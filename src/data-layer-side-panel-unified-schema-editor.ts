import {canonicalPropertyPath,type CanonicalCommand,type CanonicalPredicate,type CanonicalPredicateOperator,type CanonicalPresenceMode,type CanonicalPropertyNode,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import {savedSchemaCanonicalDocument,savedSchemaFromCanonical} from "./data-layer-saved-schema-canonical.js";
export {savedSchemaCanonicalDocument,savedSchemaFromCanonical} from "./data-layer-saved-schema-canonical.js";
import type {SchemaDefinition} from "./data-layer-schema-verification.js";

const clone=<T>(value:T):T=>structuredClone(value);

export function compactCanonicalCommandPolicy(kind:CanonicalCommand["kind"],semanticSavePending:boolean):{semantic:boolean;allowed:boolean;settles:boolean}{
  const semantic=kind!=="select"&&kind!=="view";
  return{semantic,allowed:!semantic||!semanticSavePending,settles:semantic};
}

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
const valuesWithStableIds=(current:CanonicalPropertyNode["allowedValues"],next:CanonicalPropertyNode["allowedValues"],id:(kind:string)=>string)=>{const claimed=new Set<string>();return next.map((entry)=>{
  const prior=current.find((candidate)=>!claimed.has(candidate.id)&&same(candidate.value,entry.value));
  if(prior){claimed.add(prior.id);return clone(prior);}
  return{...entry,id:id("allowed-value")};
});};
const remapPredicateProperties=(predicate:CanonicalPredicate,propertyId:(id:string)=>string):CanonicalPredicate=>predicate.kind==="predicate"?{...predicate,propertyId:propertyId(predicate.propertyId)}:{...predicate,children:predicate.children.map((child)=>remapPredicateProperties(child,propertyId))};
const predicateWithoutIds=(predicate:CanonicalPredicate):unknown=>{const{id:_id,...value}=predicate;return predicate.kind==="predicate"?value:{...value,children:predicate.children.map(predicateWithoutIds)};};
const stablePredicateIds=(prior:CanonicalPredicate,next:CanonicalPredicate):CanonicalPredicate=>{
  if(prior.kind!==next.kind)return next;
  if(next.kind==="predicate")return{...next,...(prior.id?{id:prior.id}:{})};
  const priorGroup=prior as Exclude<CanonicalPredicate,{kind:"predicate"}>;return{...next,...(priorGroup.id?{id:priorGroup.id}:{}),children:next.children.map((child,index)=>priorGroup.children[index]?stablePredicateIds(priorGroup.children[index]!,child):child)};
};
const comparableRule=(rule:CanonicalPropertyNode["rules"][number]):unknown=>{const{id:_id,name:_name,revision:_revision,provenance:_provenance,reusableRuleId:_reusableRuleId,reusableOutcome:_reusableOutcome,replacesRuleId:_replacesRuleId,enforcement:_enforcement,arrayScope:_arrayScope,condition,...semantic}=rule;return{...semantic,...(condition?{condition:predicateWithoutIds(condition)}:{})};};
const rulesWithStableConditions=(current:CanonicalPropertyNode["rules"],next:CanonicalPropertyNode["rules"],propertyId:(id:string)=>string):CanonicalPropertyNode["rules"]=>{
  const claimed=new Set<string>();
  return next.map((rule)=>{
    const remapped=rule.condition?{...rule,condition:remapPredicateProperties(rule.condition,propertyId)}:rule,prior=current.find(({id})=>id===remapped.id&&!claimed.has(id))??(remapped.id.startsWith("json-facet:")?current.find((candidate)=>candidate.id.startsWith("json-facet:")&&candidate.kind===remapped.kind&&!claimed.has(candidate.id)):undefined),stable=prior&&remapped.id.startsWith("json-facet:")?{...remapped,id:prior.id}:remapped;
    if(prior)claimed.add(prior.id);
    if(prior&&same(comparableRule(prior),comparableRule(stable)))return clone(prior);
    if(!prior)return stable;
    const merged={...prior,...stable};
    if(prior.reusableRuleId===undefined&&stable.reusableRuleId===stable.id)delete merged.reusableRuleId;
    if(prior.provenance)merged.provenance=clone(prior.provenance);
    if(prior.condition&&!stable.condition)merged.condition=clone(prior.condition);else if(prior.condition&&stable.condition)merged.condition=stablePredicateIds(prior.condition,stable.condition);
    return merged;
  });
};

export function canonicalCommandsFromCompactProjection(document:CanonicalSchemaDocument,projection:SchemaDefinition,id:(kind:string)=>string):CanonicalCommand[]{
  const {canonicalSchema:_canonicalSchema,...source}=projection;
  const parsed=savedSchemaCanonicalDocument(source,id),parsedByPath=new Map(Object.values(parsed.nodes).map((node)=>[canonicalPropertyPath(parsed,node.id),node])),currentByPath=new Map(Object.values(document.nodes).map((node)=>[canonicalPropertyPath(document,node.id),node])),currentIdByParsedId=new Map([...parsedByPath].flatMap(([path,node])=>currentByPath.get(path)?[[node.id,currentByPath.get(path)!.id] as const]:[]));
  const commands:CanonicalCommand[]=[];
  const revision=document.revision;
  const onlyDefinedFields=projection.document.additionalProperties===false;
  if((document.onlyDefinedFields===true)!==onlyDefinedFields)commands.push({kind:"policy",baseRevision:revision,onlyDefinedFields});
  const removedPaths=new Set([...currentByPath.keys()].filter((path)=>!parsedByPath.has(path)));
  for(const [path,current] of [...currentByPath].filter(([candidatePath])=>removedPaths.has(candidatePath)&&!candidatePath.split("/").slice(1,-1).some((_,index)=>removedPaths.has(`/${candidatePath.split("/").slice(1,index+2).join("/")}`)))){
    commands.push({kind:"delete",baseRevision:revision,propertyId:current.id});
  }
  const addedIdsByPath=new Map<string,string>();
  for(const [path,candidate] of [...parsedByPath].filter(([candidatePath])=>!currentByPath.has(candidatePath)).sort(([left],[right])=>left.split("/").length-right.split("/").length)){
    const parentPath=path.split("/").slice(0,-1).join("/"),structuralParentPath=parentPath.endsWith("/*")?parentPath.slice(0,-2):parentPath,parentId=parentPath?(currentByPath.get(parentPath)?.id??addedIdsByPath.get(parentPath)??currentByPath.get(structuralParentPath)?.id??addedIdsByPath.get(structuralParentPath)):undefined,nodeId=candidate.id;
    commands.push({kind:"add",baseRevision:revision,name:candidate.name,type:candidate.type,...(parentId?{parentId}:{}),id:()=>nodeId});
    addedIdsByPath.set(path,nodeId);
    if(candidate.itemType)commands.push({kind:"type",baseRevision:revision,propertyId:nodeId,type:candidate.type,itemType:candidate.itemType,confirmed:true});
    const facets={presence:candidate.presence,allowedValues:candidate.allowedValues,rules:candidate.rules,documentation:candidate.documentation},defaults={presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}}};
    if(!same(facets,defaults))commands.push({kind:"set",baseRevision:revision,propertyId:nodeId,patch:clone(facets)});
  }
  for(const current of Object.values(document.nodes)){
    const path=canonicalPropertyPath(document,current.id),candidate=parsedByPath.get(path);
    if(!candidate)continue;
    if(current.type!==candidate.type||current.itemType!==candidate.itemType){
      commands.push({kind:"type",baseRevision:revision,propertyId:current.id,type:candidate.type,...(candidate.itemType?{itemType:candidate.itemType}:{}),confirmed:true});
    }
    const candidatePresence=(current.presence.mode.endsWith("-when")&&candidate.presence.mode==="optional")||presenceFamily(candidate.presence.mode)===presenceFamily(current.presence.mode)
      ? current.presence
      : candidate.presence;
    const candidateFacets={
      presence:clone(candidatePresence),
      allowedValues:valuesWithStableIds(current.allowedValues,candidate.allowedValues,id),
      rules:rulesWithStableConditions(current.rules,candidate.rules,(propertyId)=>currentIdByParsedId.get(propertyId)??propertyId),
      documentation:clone(candidate.documentation),
    };
    const currentFacets={presence:current.presence,allowedValues:current.allowedValues,rules:current.rules,documentation:current.documentation},patch:Extract<CanonicalCommand,{kind:"set"}>["patch"]={};
    for(const key of ["presence","allowedValues","rules","documentation"] as const)if(!same(currentFacets[key],candidateFacets[key]))Object.assign(patch,{[key]:candidateFacets[key]});
    if(Object.keys(patch).length)commands.push({kind:"set",baseRevision:revision,propertyId:current.id,patch});
  }
  return commands;
}
