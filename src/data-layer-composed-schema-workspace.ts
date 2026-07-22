import {applyCanonicalCommand,canonicalConstraints,canonicalPropertyPath,canonicalTableRows,createCanonicalSchema,type CanonicalPredicate,type CanonicalPropertyNode,type CanonicalPropertyType,type CanonicalRule,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import {compileLayeredSchema,type EffectiveProperty,type LayerConflict,type LayerConstraint,type LayerScope} from "./data-layer-layered-schema.js";
import {layeredContributorPath,layeredContributorsForPath} from "./data-layer-layered-schema-project.js";
import {transactProject,type ProjectEntity,type ProjectEntityKind,type ProjectState} from "./data-layer-specification-project.js";

export type ComposedSchemaRowState="ready"|"warning"|"blocked";
export interface ComposedSchemaProvenance {contributorId:string;contributorName:string;scope:LayerScope;state:"inherited"|"shadowed"|"effective";}
export interface ComposedSchemaRepair {contributorId:string;contributorName:string;label:string;}
export interface ComposedSchemaRow {
  path:string;
  inherited?:EffectiveProperty;
  local:LayerConstraint;
  effective:EffectiveProperty;
  source:string;
  validationState:ComposedSchemaRowState;
  message:string;
  action:"override"|"reset"|"remove";
  provenance:ComposedSchemaProvenance[];
  repairs:ComposedSchemaRepair[];
}
export interface ComposedSchemaWorkspace {heading:string;status:"ready"|"blocked";rows:ComposedSchemaRow[];conflictSummary:string;}

const clone=<T>(value:T):T=>structuredClone(value);
const constraintsFor=(entity:ProjectEntity):LayerConstraint[]=>{
  const canonical=entity.canonicalSchema as CanonicalSchemaDocument|undefined;
  return[
    ...(canonical?canonicalConstraints(canonical):((entity.schemaConstraints as LayerConstraint[]|undefined)??[])),
    ...((entity.localSchemaContributions as LayerConstraint[]|undefined)??[]),
  ];
};
const mergedAt=(constraints:readonly LayerConstraint[],path:string):LayerConstraint=>constraints.filter((constraint)=>constraint.path===path).reduce<LayerConstraint>((result,constraint)=>({...result,...clone(constraint),path}),{path});
const entities=(state:ProjectState):ProjectEntity[]=>(Object.values(state.project.collections) as ProjectEntity[][]).flat();
const eventContext=(entity:ProjectEntity)=>({eventId:String(entity.eventId??entity.id),eventRole:(entity.role==="context-setting"?"context":"interaction") as "context"|"interaction"});
const provenanceFor=(effective:EffectiveProperty,entityId:string):ComposedSchemaProvenance[]=>{
  const shadowed=new Set(effective.superseded.map(({contributorId})=>contributorId)),lastOrigin=effective.origins.at(-1)?.contributorId;
  return effective.origins.map((origin)=>({...origin,state:origin.contributorId===entityId||origin.contributorId===lastOrigin?"effective":shadowed.has(origin.contributorId)?"shadowed":"inherited"}));
};
const repairsFor=(conflicts:readonly LayerConflict[],allEntities:readonly ProjectEntity[],entity:ProjectEntity):ComposedSchemaRepair[]=>
  conflicts.flatMap(({contributors})=>contributors).filter((name,index,names)=>names.indexOf(name)===index).flatMap((name)=>{const contributor=allEntities.find((candidate)=>candidate.name===name);return contributor?[{contributorId:contributor.id,contributorName:name,label:contributor.id===entity.id?`Adjust ${entity.name} override`:`Edit ${name}`}]:[];});

export function composedSchemaWorkspace(state:ProjectState,entity:ProjectEntity,scope:"Page"|"Page Group"|"Flow Page-instance",observation?:Record<string,unknown>,flowId?:string):ComposedSchemaWorkspace{
  const resolved=layeredContributorsForPath(state,layeredContributorPath(state,entity,scope,flowId),observation??{}),contributors=observation?resolved:resolved.map(({active:_active,applicabilityConditional:_conditional,exclusionReason:_reason,...contributor})=>contributor),parents=contributors.filter(({id})=>id!==entity.id),compiled=compileLayeredSchema(contributors,eventContext(entity)),parentCompiled=compileLayeredSchema(parents,eventContext(entity)),localConstraints=constraintsFor(entity),paths=new Set([
    ...Object.keys(parentCompiled.properties),...Object.keys(compiled.properties),...localConstraints.map(({path})=>path),...compiled.conflicts.map(({path})=>path).filter((path)=>path!=="/"),
  ]),allEntities=entities(state);
  const rows=[...paths].sort((left,right)=>left.localeCompare(right)).map((path):ComposedSchemaRow=>{
    const inherited=parentCompiled.properties[path],local=mergedAt(localConstraints,path),effective=compiled.properties[path]??inherited??({path,origins:[],superseded:[]} as EffectiveProperty),conflicts=compiled.conflicts.filter((conflict)=>conflict.path===path),hasLocal=localConstraints.some((constraint)=>constraint.path===path),ordinaryResolution=hasLocal&&conflicts.length===0&&effective.superseded.some(({contributorId})=>contributorId!==entity.id);
    return{path,...(inherited?{inherited:clone(inherited)}:{}),local,effective:clone(effective),source:(inherited?.origins??[]).map(({contributorName})=>contributorName).join(" → ")||"Local only",validationState:conflicts.length?"blocked":ordinaryResolution?"warning":"ready",message:conflicts.map(({message})=>message).join(" · ")||(ordinaryResolution?`Parent difference resolved by ${entity.name} override`:hasLocal?"Local contribution is effective":"Inherited from live parents"),action:hasLocal?(inherited?"reset":"remove"):"override",provenance:provenanceFor(effective,entity.id),repairs:repairsFor(conflicts,allEntities,entity)};
  });
  return{heading:`Effective schema at ${entity.name}`,status:compiled.status,rows,conflictSummary:compiled.status==="blocked"?`${compiled.conflicts.length} unresolved conflict${compiled.conflicts.length===1?"":"s"} block validation and developer export.`:"Ready for validation and developer export."};
}

const canonicalTypes=new Set<CanonicalPropertyType>(["string","number","integer","boolean","null","object","array"]);
const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
const propertyIdFor=(entity:ProjectEntity,path:string,effective:EffectiveProperty,used:Set<string>):string=>{const preferred=effective.definitionId??`property:${entity.id}:${encodeURIComponent(path)}`;if(!used.has(preferred)){used.add(preferred);return preferred;}const scoped=`property:${entity.id}:${encodeURIComponent(path)}`;used.add(scoped);return scoped;};
const ruleFor=(value:Record<string,unknown>,fallbackId:string):CanonicalRule=>({id:String(value.id??fallbackId),kind:(["pattern","range","cardinality","condition","custom"].includes(String(value.kind))?String(value.kind):"custom") as CanonicalRule["kind"],...(typeof value.pattern==="string"?{pattern:value.pattern}:{}),...(typeof value.minimum==="number"?{minimum:value.minimum}:{}),...(typeof value.maximum==="number"?{maximum:value.maximum}:{}),...(typeof value.minItems==="number"?{minItems:value.minItems}:{}),...(typeof value.maxItems==="number"?{maxItems:value.maxItems}:{}),...(value.condition?{condition:clone(value.condition) as CanonicalPredicate}:{}),severity:value.severity==="warning"?"warning":"error",message:String(value.message??"Constraint mismatch"),...(typeof value.reusableRuleId==="string"?{reusableRuleId:value.reusableRuleId}:{})});
export function composedCanonicalSchema(state:ProjectState,entity:ProjectEntity,scope:"Page"|"Page Group"):CanonicalSchemaDocument{
  const workspace=composedSchemaWorkspace(state,entity,scope),document=createCanonicalSchema({id:`canonical:effective:${entity.id}`,contributorId:entity.id,contributorName:entity.name}),used=new Set<string>(),byPath=new Map<string,string>(),rows=[...workspace.rows].sort((left,right)=>left.path.split("/").length-right.path.split("/").length||left.path.localeCompare(right.path));
  for(const row of rows){const segments=row.path.split("/").filter(Boolean),parentPath=`/${segments.slice(0,-1).join("/")}`,parentId=segments.length>1?byPath.get(parentPath):undefined,type=canonicalTypes.has(row.effective.type as CanonicalPropertyType)?row.effective.type as CanonicalPropertyType:"string",id=propertyIdFor(entity,row.path,row.effective,used),rules=(row.effective.rules??[]).map((rule,index)=>ruleFor(rule,`rule:${id}:${index}`));for(const[at,pattern]of(row.effective.patterns??[]).entries())if(!rules.some((rule)=>rule.kind==="pattern"&&rule.pattern===pattern))rules.push({id:`rule:${id}:pattern:${at}`,kind:"pattern",pattern,severity:"error",message:"Pattern mismatch"});if((row.effective.minimum!==undefined||row.effective.maximum!==undefined)&&!rules.some(({kind})=>kind==="range"))rules.push({id:`rule:${id}:range`,kind:"range",...(row.effective.minimum!==undefined?{minimum:row.effective.minimum}:{}),...(row.effective.maximum!==undefined?{maximum:row.effective.maximum}:{}),severity:"error",message:"Outside range"});if((row.effective.minItems!==undefined||row.effective.maxItems!==undefined)&&!rules.some(({kind})=>kind==="cardinality"))rules.push({id:`rule:${id}:cardinality`,kind:"cardinality",...(row.effective.minItems!==undefined?{minItems:row.effective.minItems}:{}),...(row.effective.maxItems!==undefined?{maxItems:row.effective.maxItems}:{}),severity:"error",message:"Outside cardinality"});const node:CanonicalPropertyNode={id,name:segments.at(-1)!,...(parentId?{parentId}:{}),order:Object.values(document.nodes).filter((candidate)=>candidate.parentId===parentId).length,type,presence:{mode:row.effective.presence==="required"?"required":row.effective.presence==="forbidden"?"forbidden":"optional",...(row.effective.condition?{condition:clone(row.effective.condition) as unknown as CanonicalPredicate}:{})},allowedValues:(row.effective.allowedValues??[]).map((value,index)=>({id:`allowed-value:${id}:${index}`,value:clone(value)})),rules,documentation:{displayText:"",description:row.effective.documentation??"",comments:"",example:row.effective.examples?.length?{method:"custom",value:clone(row.effective.examples[0])}:{method:"blank"}},provenance:row.provenance.map(({contributorId,contributorName,scope:originScope,state:originState})=>({source:"path-constraint" as const,sourceId:contributorId,contributorId,contributorName,scope:originScope,state:originState})),overrideReferences:[...(row.effective.overrideReferences??[])],...(row.effective.expectedValue!==undefined?{expectedValue:clone(row.effective.expectedValue)}:{}),...(row.effective.enforcement?{enforcement:row.effective.enforcement}:{}),...(row.effective.target?{target:row.effective.target}:{})};document.nodes[id]=node;byPath.set(row.path,id);}
  document.rootIds=Object.values(document.nodes).filter(({parentId})=>!parentId).sort((left,right)=>left.order-right.order).map(({id})=>id);document.revision=Math.max(1,...layeredContributorsForPath(state,layeredContributorPath(state,entity,scope)).map((contributor)=>Number((entities(state).find(({id})=>id===contributor.id)?.canonicalSchema as CanonicalSchemaDocument|undefined)?.revision??0)))+((entity.localSchemaContributions as LayerConstraint[]|undefined)?.length??0);document.changes=[];document.source={identity:entity.id,revision:document.revision,provenance:"project-composed-effective"};if(document.rootIds[0])document.selectedPropertyId=document.rootIds[0];return document;
}

const sparseFacetKeys=(constraint:LayerConstraint):LayerConstraint=>Object.fromEntries(Object.entries(constraint).filter(([key])=>!["path","origins","superseded","expectedContributor"].includes(key))) as LayerConstraint;
const sparseAgainst=(constraint:LayerConstraint,inherited:EffectiveProperty|undefined):LayerConstraint=>{const result:Record<string,unknown>={path:constraint.path},parent:Partial<LayerConstraint>=inherited?sparseFacetKeys(inherited):{};for(const[key,value]of Object.entries(sparseFacetKeys(constraint))){if(key==="definitionId"&&inherited&&!inherited.definitionId)continue;if(key==="target"&&inherited&&value==="all"&&parent.target===undefined)continue;if(value!==undefined&&!same(value,parent[key as keyof LayerConstraint]))result[key]=clone(value);}return result as unknown as LayerConstraint;};
export function saveComposedCanonicalDocument(state:ProjectState,kind:"pages"|"pageGroups",entityId:string,document:CanonicalSchemaDocument):ProjectState{
  const entity=(state.project.collections[kind] as ProjectEntity[]).find(({id})=>id===entityId);if(!entity)throw new Error(`${kind==="pages"?"Page":"Page Group"} ${entityId} is unavailable.`);const scope=kind==="pages"?"Page":"Page Group",workspace=composedSchemaWorkspace(state,entity,scope),parents=new Map(workspace.rows.map(({path,inherited})=>[path,inherited])),constraints=canonicalConstraints(document).map((constraint)=>sparseAgainst(constraint,parents.get(constraint.path))).filter((constraint)=>Object.keys(constraint).length>1);return updateEntity(state,kind,entityId,`Save effective canonical schema for ${entity.name}`,(current)=>{const next:ProjectEntity={...current,localSchemaContributions:constraints,compiledTargetsStale:true};delete next.canonicalSchema;delete next.schemaConstraints;return next;});
}

function updateEntity(state:ProjectState,kind:ProjectEntityKind,entityId:string,label:string,update:(entity:ProjectEntity)=>ProjectEntity):ProjectState{
  return transactProject(state,label,(project)=>({...project,collections:{...project.collections,[kind]:(project.collections[kind] as ProjectEntity[]).map((entity)=>entity.id===entityId?update(entity):entity)}} as typeof project));
}

export function saveComposedSchemaLocalFacets(state:ProjectState,kind:"pages"|"pageGroups",entityId:string,path:string,facets:Omit<LayerConstraint,"path">):ProjectState{
  const sparse=Object.fromEntries(Object.entries(facets).filter(([,value])=>value!==undefined&&value!=="")) as Omit<LayerConstraint,"path">;
  return updateEntity(state,kind,entityId,`Override ${path} at ${kind==="pages"?"Page":"Page Group"}`,(entity)=>{const existing=(entity.localSchemaContributions as LayerConstraint[]|undefined)??[],next=[...existing.filter((constraint)=>constraint.path!==path),...(Object.keys(sparse).length?[{path,...clone(sparse)}]:[])];return{...entity,localSchemaContributions:next,compiledTargetsStale:true};});
}

export function resetComposedSchemaLocalProperty(state:ProjectState,kind:"pages"|"pageGroups",entityId:string,path:string):ProjectState{
  return updateEntity(state,kind,entityId,`Reset ${path} to parents`,(entity)=>{
    const next:ProjectEntity={...entity,localSchemaContributions:((entity.localSchemaContributions as LayerConstraint[]|undefined)??[]).filter((constraint)=>constraint.path!==path),schemaConstraints:((entity.schemaConstraints as LayerConstraint[]|undefined)??[]).filter((constraint)=>constraint.path!==path),compiledTargetsStale:true},canonical=entity.canonicalSchema as CanonicalSchemaDocument|undefined,row=canonical&&canonicalTableRows(canonical).find((candidate)=>candidate.path===path);
    if(row){const result=applyCanonicalCommand(canonical,{kind:"delete",baseRevision:canonical.revision,propertyId:row.id});if(result.status==="applied"||result.status==="rebased")next.canonicalSchema=result.document;}
    return next;
  });
}
