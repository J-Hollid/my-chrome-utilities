import {canonicalPropertyPath,type CanonicalCommand,type CanonicalPredicateOperator,type CanonicalPresenceMode,type CanonicalPropertyNode,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import {savedSchemaCanonicalDocument} from "./data-layer-saved-schema-canonical.js";
export {savedSchemaCanonicalDocument} from "./data-layer-saved-schema-canonical.js";
import type {AttachedSchemaRule,JsonSchema,SchemaDefinition} from "./data-layer-schema-verification.js";

const pointer=(path:string)=>`/${path.split(/[./]/).filter(Boolean).join("/")}`;
const clone=<T>(value:T):T=>structuredClone(value);

export function compactSchemaProjection(document:CanonicalSchemaDocument,identity:{id:string;name:string;version:number}):SchemaDefinition{
  const base:SchemaDefinition={
    ...identity,
    published:false,
    assignments:[],
    document:{type:"object"},
  };
  const projected=savedSchemaFromCanonical(base,document);
  const {canonicalSchema:_canonicalSchema,...compact}=projected;
  return compact;
}

export function compactConditionalPresence(mode:Extract<CanonicalPresenceMode,"required-when"|"forbidden-when">,propertyId:string,operator:CanonicalPredicateOperator,value?:unknown):CanonicalPropertyNode["presence"]{
  return{mode,condition:{kind:"predicate",propertyId,operator,...(!operator.includes("exist")&&!operator.includes("Exist")?{value}:{})}};
}

const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
const presenceFamily=(mode:CanonicalPropertyNode["presence"]["mode"]):"required"|"forbidden"|"optional"=>mode.startsWith("required")?"required":mode.startsWith("forbidden")?"forbidden":"optional";
const valuesWithStableIds=(current:CanonicalPropertyNode["allowedValues"],next:CanonicalPropertyNode["allowedValues"],id:(kind:string)=>string)=>next.map((entry,index)=>{
  const prior=current[index];
  return prior&&same(prior.value,entry.value)?{...entry,id:prior.id}:{...entry,id:id("allowed-value")};
});
const rulesWithStableConditions=(current:CanonicalPropertyNode["rules"],next:CanonicalPropertyNode["rules"]):CanonicalPropertyNode["rules"]=>{
  const claimed=new Set<string>();
  return next.map((rule)=>{
    const prior=current.find(({id})=>id===rule.id&&!claimed.has(id))??(rule.id.startsWith("json-facet:")?current.find((candidate)=>candidate.id.startsWith("json-facet:")&&candidate.kind===rule.kind&&!claimed.has(candidate.id)):undefined),stable=prior&&rule.id.startsWith("json-facet:")?{...rule,id:prior.id}:rule;
    if(prior)claimed.add(prior.id);
    return prior?.condition&&!stable.condition?{...stable,condition:clone(prior.condition)}:stable;
  });
};

export function canonicalCommandsFromCompactProjection(document:CanonicalSchemaDocument,projection:SchemaDefinition,id:(kind:string)=>string):CanonicalCommand[]{
  const {canonicalSchema:_canonicalSchema,...source}=projection;
  const parsed=savedSchemaCanonicalDocument(source,id),parsedByPath=new Map(Object.values(parsed.nodes).map((node)=>[canonicalPropertyPath(parsed,node.id),node])),currentByPath=new Map(Object.values(document.nodes).map((node)=>[canonicalPropertyPath(document,node.id),node]));
  const commands:CanonicalCommand[]=[];
  let revision=document.revision;
  const removedPaths=new Set([...currentByPath.keys()].filter((path)=>!parsedByPath.has(path)));
  for(const [path,current] of [...currentByPath].filter(([candidatePath])=>removedPaths.has(candidatePath)&&!candidatePath.split("/").slice(1,-1).some((_,index)=>removedPaths.has(`/${candidatePath.split("/").slice(1,index+2).join("/")}`)))){
    commands.push({kind:"delete",baseRevision:revision++,propertyId:current.id});
  }
  const addedIdsByPath=new Map<string,string>();
  for(const [path,candidate] of [...parsedByPath].filter(([candidatePath])=>!currentByPath.has(candidatePath)).sort(([left],[right])=>left.split("/").length-right.split("/").length)){
    const parentPath=path.split("/").slice(0,-1).join("/"),parentId=parentPath?(currentByPath.get(parentPath)?.id??addedIdsByPath.get(parentPath)):undefined,nodeId=candidate.id;
    commands.push({kind:"add",baseRevision:revision++,name:candidate.name,type:candidate.type,...(parentId?{parentId}:{}),id:()=>nodeId});
    addedIdsByPath.set(path,nodeId);
    if(candidate.itemType)commands.push({kind:"type",baseRevision:revision++,propertyId:nodeId,type:candidate.type,itemType:candidate.itemType,confirmed:true});
    const facets={presence:candidate.presence,allowedValues:candidate.allowedValues,rules:candidate.rules,documentation:candidate.documentation},defaults={presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}}};
    if(!same(facets,defaults))commands.push({kind:"set",baseRevision:revision++,propertyId:nodeId,patch:clone(facets)});
  }
  for(const current of Object.values(document.nodes)){
    const path=canonicalPropertyPath(document,current.id),candidate=parsedByPath.get(path);
    if(!candidate)continue;
    if(current.type!==candidate.type||current.itemType!==candidate.itemType){
      commands.push({kind:"type",baseRevision:revision++,propertyId:current.id,type:candidate.type,...(candidate.itemType?{itemType:candidate.itemType}:{}),confirmed:true});
    }
    const candidatePresence=presenceFamily(candidate.presence.mode)===presenceFamily(current.presence.mode)
      ? current.presence
      : candidate.presence;
    const candidateFacets={
      presence:clone(candidatePresence),
      allowedValues:valuesWithStableIds(current.allowedValues,candidate.allowedValues,id),
      rules:rulesWithStableConditions(current.rules,candidate.rules),
      documentation:clone(candidate.documentation),
    };
    const currentFacets={presence:current.presence,allowedValues:current.allowedValues,rules:current.rules,documentation:current.documentation},patch:Extract<CanonicalCommand,{kind:"set"}>["patch"]={};
    for(const key of ["presence","allowedValues","rules","documentation"] as const)if(!same(currentFacets[key],candidateFacets[key]))Object.assign(patch,{[key]:candidateFacets[key]});
    if(Object.keys(patch).length)commands.push({kind:"set",baseRevision:revision++,propertyId:current.id,patch});
  }
  return commands;
}

const orderedChildren=(document:CanonicalSchemaDocument,parentId?:string):CanonicalPropertyNode[]=>Object.values(document.nodes).filter((node)=>node.parentId===parentId).sort((left,right)=>left.order-right.order||left.id.localeCompare(right.id));
function jsonDefinition(document:CanonicalSchemaDocument,node:CanonicalPropertyNode):JsonSchema{
  const base=clone(document.sourceContent?.definitionsByNodeId?.[node.id]??{}) as Record<string,unknown>,children=orderedChildren(document,node.id),definition:Record<string,unknown>={...base,type:node.type};
  for(const key of["properties","required","forbidden","enum","description","examples","pattern","minimum","maximum","minItems","maxItems"])delete definition[key];
  if(node.type==="array"){const prior=base.items&&typeof base.items==="object"?clone(base.items as Record<string,unknown>):undefined;definition.items=node.itemType&&prior?.type===node.itemType?prior:{type:node.itemType??"string"};}else delete definition.items;
  if(children.length){definition.properties=Object.fromEntries(children.map((child)=>[child.name,jsonDefinition(document,child)]));const required=children.filter(({presence})=>presence.mode.startsWith("required")).map(({name})=>name),forbidden=children.filter(({presence})=>presence.mode.startsWith("forbidden")).map(({name})=>name);if(required.length)definition.required=required;if(forbidden.length)definition.forbidden=forbidden;}
  if(node.allowedValues.length)definition.enum=node.allowedValues.map(({value})=>clone(value));if(node.documentation.description)definition.description=node.documentation.description;if(node.documentation.example.method!=="blank")definition.examples=[clone(node.documentation.example.value)];
  for(const rule of node.rules.filter(({id})=>id.startsWith("json-facet:"))){if(rule.kind==="pattern"&&rule.pattern)definition.pattern=rule.pattern;if(rule.kind==="range"){if(rule.minimum!==undefined)definition.minimum=rule.minimum;if(rule.maximum!==undefined)definition.maximum=rule.maximum;}if(rule.kind==="cardinality"){if(rule.minItems!==undefined)definition.minItems=rule.minItems;if(rule.maxItems!==undefined)definition.maxItems=rule.maxItems;}}
  return definition as JsonSchema;
}
export function savedSchemaFromCanonical<T extends SchemaDefinition>(schema:T,canonical:CanonicalSchemaDocument):T{
  const roots=orderedChildren(canonical),root=clone(canonical.sourceContent?.document??{}) as Record<string,unknown>;for(const key of["properties","required","forbidden"])delete root[key];root.type="object";root.properties=Object.fromEntries(roots.map((node)=>[node.name,jsonDefinition(canonical,node)]));const rootRequired=roots.filter(({presence})=>presence.mode.startsWith("required")).map(({name})=>name),rootForbidden=roots.filter(({presence})=>presence.mode.startsWith("forbidden")).map(({name})=>name);if(rootRequired.length)root.required=rootRequired;if(rootForbidden.length)root.forbidden=rootForbidden;const document=root as JsonSchema,attachedRules:AttachedSchemaRule[]=[],properties:Record<string,NonNullable<NonNullable<SchemaDefinition["documentation"]>["properties"]>[string]>={};
  for(const node of Object.values(canonical.nodes)){
    const path=canonicalPropertyPath(canonical,node.id),priorDocumentation=schema.documentation?.properties?.[path],example=node.documentation.example.method==="blank"?undefined:{value:structuredClone(node.documentation.example.value) as string|number|boolean|null,selectionMethod:node.documentation.example.method==="allowed-value"?"allowed value" as const:"custom" as const},sourceRules=canonical.sourceContent?.definitionsByNodeId?.[node.id]?.rules,embeddedRuleIds=new Set(Array.isArray(sourceRules)?sourceRules.flatMap((rule)=>rule&&typeof rule==="object"&&"id"in rule&&typeof rule.id==="string"?[rule.id]:[]):[]);
    if(node.documentation.displayText||node.documentation.description||node.documentation.comments||priorDocumentation||example)properties[path]={displayName:node.documentation.displayText,description:node.documentation.description,...(node.documentation.comments?{comments:node.documentation.comments}:{}),...(example?{example}:{})};
    for(const rule of node.rules){if(rule.id.startsWith("json-facet:"))continue;const prior=(schema.attachedRules??[]).find(({id})=>id===rule.id);if(!prior&&embeddedRuleIds.has(rule.id))continue;const operator=rule.kind==="pattern"?(prior?.operator??"regular-expression"):rule.kind==="range"?"numeric-range":rule.kind==="cardinality"?"item-count":prior?.operator??rule.kind,parameters=rule.kind==="pattern"?rule.pattern:rule.kind==="range"?`${rule.minimum??""},${rule.maximum??""}`:rule.kind==="cardinality"?`${rule.minItems??""},${rule.maxItems??""}`:prior?.parameters,propertyPath=prior?.propertyPath&&pointer(prior.propertyPath)===path?prior.propertyPath:path,{conditionGroup:_legacyConditionGroup,...priorWithoutLegacyCondition}=prior??{};attachedRules.push({...priorWithoutLegacyCondition,id:rule.id,version:prior?.version??1,propertyPath,operator,...(parameters!==undefined?{parameters}:{}),severity:rule.severity,...(rule.message!==undefined?{message:rule.message}:{})});}
  }
  const clean=(value:JsonSchema):JsonSchema=>{const next=structuredClone(value) as JsonSchema&{attachedRules?:unknown};delete next.attachedRules;if(next.required&&!next.required.length)delete next.required;for(const child of Object.values(next.properties??{}))clean(child);return next;};
  const documentation={...(schema.documentation?.description?{description:schema.documentation.description}:{}),...(Object.keys(properties).length?{properties}:{})};
  const {attachedRules:_attachedRules,documentation:_documentation,canonicalSchema:_canonicalSchema,...current}=schema;return{...current,document:clean(document),...(attachedRules.length?{attachedRules}:{}),...(Object.keys(documentation).length?{documentation}:{}),canonicalSchema:clone(canonical)} as unknown as T;
}
