import {applyCanonicalCommand,canonicalConstraints,canonicalTableRows,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
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

export function composedSchemaWorkspace(state:ProjectState,entity:ProjectEntity,scope:"Page"|"Page Group",observation?:Record<string,unknown>):ComposedSchemaWorkspace{
  const resolved=layeredContributorsForPath(state,layeredContributorPath(state,entity,scope),observation??{}),contributors=observation?resolved:resolved.map(({active:_active,applicabilityConditional:_conditional,exclusionReason:_reason,...contributor})=>contributor),parents=contributors.filter(({id})=>id!==entity.id),compiled=compileLayeredSchema(contributors,eventContext(entity)),parentCompiled=compileLayeredSchema(parents,eventContext(entity)),localConstraints=constraintsFor(entity),paths=new Set([
    ...Object.keys(parentCompiled.properties),...Object.keys(compiled.properties),...localConstraints.map(({path})=>path),...compiled.conflicts.map(({path})=>path).filter((path)=>path!=="/"),
  ]),allEntities=entities(state);
  const rows=[...paths].sort((left,right)=>left.localeCompare(right)).map((path):ComposedSchemaRow=>{
    const inherited=parentCompiled.properties[path],local=mergedAt(localConstraints,path),effective=compiled.properties[path]??inherited??({path,origins:[],superseded:[]} as EffectiveProperty),conflicts=compiled.conflicts.filter((conflict)=>conflict.path===path),hasLocal=localConstraints.some((constraint)=>constraint.path===path),ordinaryResolution=hasLocal&&conflicts.length===0&&effective.superseded.some(({contributorId})=>contributorId!==entity.id);
    return{path,...(inherited?{inherited:clone(inherited)}:{}),local,effective:clone(effective),source:(inherited?.origins??[]).map(({contributorName})=>contributorName).join(" → ")||"Local only",validationState:conflicts.length?"blocked":ordinaryResolution?"warning":"ready",message:conflicts.map(({message})=>message).join(" · ")||(ordinaryResolution?`Parent difference resolved by ${entity.name} override`:hasLocal?"Local contribution is effective":"Inherited from live parents"),action:hasLocal?(inherited?"reset":"remove"):"override",provenance:provenanceFor(effective,entity.id),repairs:repairsFor(conflicts,allEntities,entity)};
  });
  return{heading:`Effective schema at ${entity.name}`,status:compiled.status,rows,conflictSummary:compiled.status==="blocked"?`${compiled.conflicts.length} unresolved conflict${compiled.conflicts.length===1?"":"s"} block validation and developer export.`:"Ready for validation and developer export."};
}

function updateEntity(state:ProjectState,kind:ProjectEntityKind,entityId:string,label:string,update:(entity:ProjectEntity)=>ProjectEntity):ProjectState{
  return transactProject(state,label,(project)=>({...project,collections:{...project.collections,[kind]:(project.collections[kind] as ProjectEntity[]).map((entity)=>entity.id===entityId?update(entity):entity)}} as typeof project));
}

export function saveComposedSchemaLocalFacets(state:ProjectState,kind:"pages"|"pageGroups",entityId:string,path:string,facets:Omit<LayerConstraint,"path">):ProjectState{
  const sparse=Object.fromEntries(Object.entries(facets).filter(([,value])=>value!==undefined&&value!=="")) as Omit<LayerConstraint,"path">;
  return updateEntity(state,kind,entityId,`Override ${path} at ${kind==="pages"?"Page":"Page Group"}`,(entity)=>{const existing=(entity.localSchemaContributions as LayerConstraint[]|undefined)??[],next=[...existing.filter((constraint)=>constraint.path!==path),{path,...clone(sparse)}];return{...entity,localSchemaContributions:next,compiledTargetsStale:true};});
}

export function resetComposedSchemaLocalProperty(state:ProjectState,kind:"pages"|"pageGroups",entityId:string,path:string):ProjectState{
  return updateEntity(state,kind,entityId,`Reset ${path} to parents`,(entity)=>{
    const next:ProjectEntity={...entity,localSchemaContributions:((entity.localSchemaContributions as LayerConstraint[]|undefined)??[]).filter((constraint)=>constraint.path!==path),schemaConstraints:((entity.schemaConstraints as LayerConstraint[]|undefined)??[]).filter((constraint)=>constraint.path!==path),compiledTargetsStale:true},canonical=entity.canonicalSchema as CanonicalSchemaDocument|undefined,row=canonical&&canonicalTableRows(canonical).find((candidate)=>candidate.path===path);
    if(row){const result=applyCanonicalCommand(canonical,{kind:"delete",baseRevision:canonical.revision,propertyId:row.id});if(result.status==="applied"||result.status==="rebased")next.canonicalSchema=result.document;}
    return next;
  });
}
