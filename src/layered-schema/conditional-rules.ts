import type {CompiledLayeredSchema,EffectiveProperty,LayerConflict,LayerConstraint} from "../data-layer-layered-schema.js";
import {constraintWithPeerRules,constraintWithStructuredRules,peerMismatch,peerSetMismatch} from "./compile-context.js";
import {mergeLayeredProperty} from "./compile-merge.js";

const clone=<T>(value:T):T=>structuredClone(value);
const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
const valueAt=(payload:Record<string,unknown>,path:string):unknown=>path.split("/").filter(Boolean).reduce<unknown>((value,key)=>value&&typeof value==="object"?(value as Record<string,unknown>)[key]:undefined,payload);

const predicateMatches=(operator:string,actual:unknown,expected:unknown):boolean=>{
  if(operator==="Equals")return same(actual,expected);
  if(operator==="Does not equal")return!same(actual,expected);
  if(operator==="Exists")return actual!==undefined;
  if(operator==="Does not exist")return actual===undefined;
  if(operator==="Starts with")return String(actual??"").startsWith(String(expected??""));
  if(operator==="Contains")return String(actual??"").includes(String(expected??""));
  if(operator==="Is one of")return(Array.isArray(expected)?expected:[expected]).some((choice)=>same(actual,choice));
  if(operator==="Contains any of")return(Array.isArray(expected)?expected:[expected]).some((choice)=>Array.isArray(actual)?actual.some((entry)=>same(entry,choice)):String(actual??"").includes(String(choice??"")));
  if(operator==="Matches pattern")try{return new RegExp(String(expected??"")).test(String(actual??""));}catch{return false;}
  if(operator==="Greater than")return Number(actual)>Number(expected);
  if(operator==="At least")return Number(actual)>=Number(expected);
  if(operator==="Less than")return Number(actual)<Number(expected);
  if(operator==="At most")return Number(actual)<=Number(expected);
  return false;
};

export const layeredConditionMatches=(condition:Record<string,unknown>|undefined,payload:Record<string,unknown>,pathsByDefinition:ReadonlyMap<string,string>):boolean=>{
  if(!condition)return true;
  const kind=String(condition.kind??"");
  if(kind==="predicate"){const path=pathsByDefinition.get(String(condition.propertyId??"")),actual=path?valueAt(payload,path):undefined;return predicateMatches(String(condition.operator??"Equals"),actual,condition.value);}
  const children=(condition.children as Record<string,unknown>[]|undefined)??[];
  if(!children.length&&["all","any"].includes(kind))return true;
  if(kind==="all")return children.every((child)=>layeredConditionMatches(child,payload,pathsByDefinition));
  if(kind==="any")return children.some((child)=>layeredConditionMatches(child,payload,pathsByDefinition));
  if(kind==="not")return!children.some((child)=>layeredConditionMatches(child,payload,pathsByDefinition));
  return false;
};

const named=(rule:Record<string,unknown>):string=>String(rule.name??rule.id??rule.kind??"Unnamed rule");
export const layeredPropertyPaths=(compiled:CompiledLayeredSchema):Map<string,string>=>{
  const paths=new Map<string,string>();
  for(const[path,property]of Object.entries(compiled.properties)){paths.set(path,path);if(property.definitionId)paths.set(property.definitionId,path);}
  return paths;
};
const reusableOutcome=(property:{reusableRules?:readonly Record<string,unknown>[]},rule:Record<string,unknown>):Record<string,unknown>|undefined=>{
  const embedded=rule.reusableOutcome;
  if(embedded&&typeof embedded==="object"&&!Array.isArray(embedded))return embedded as Record<string,unknown>;
  return (property.reusableRules??[]).find((candidate)=>String(candidate.id??"")===String(rule.reusableRuleId??"")) as Record<string,unknown>|undefined;
};
const executable=(property:{reusableRules?:readonly Record<string,unknown>[]},rule:Record<string,unknown>):Record<string,unknown>|undefined=>{
  if(rule.kind!=="reusable")return rule;
  const outcome=reusableOutcome(property,rule);if(!outcome)return undefined;
  return{...clone(outcome),id:rule.id,name:rule.name??outcome.name,condition:rule.condition,enabled:rule.enabled,severity:rule.severity??outcome.severity,message:rule.message??outcome.message};
};
const conditional=(property:EffectiveProperty,payload:Record<string,unknown>,paths:ReadonlyMap<string,string>):Record<string,unknown>[]=>((property.rules??[]) as Record<string,unknown>[]).flatMap((rule)=>{
  const outcome=executable(property,rule);
  if(!outcome||outcome.enabled===false||((outcome.arrayScope as {boundaries?:unknown[]}|undefined)?.boundaries?.length))return[];
  const alreadyProjected=!outcome.condition&&rule.kind!=="reusable"&&["pattern","range","cardinality"].includes(String(outcome.kind));
  return!alreadyProjected&&layeredConditionMatches(outcome.condition as Record<string,unknown>|undefined,payload,paths)?[outcome]:[];
});
const differing=(rules:Record<string,unknown>[],read:(rule:Record<string,unknown>)=>unknown):boolean=>new Set(rules.map((rule)=>JSON.stringify(read(rule)))).size>1;
const conflictFor=(path:string,facet:string,rules:Record<string,unknown>[]):LayerConflict=>({path,message:`conditional ${facet} outcomes contradict`,contributors:rules.map(named)});
const resolvedPeerConstraint=(constraint:LayerConstraint,payload:Record<string,unknown>,paths:ReadonlyMap<string,string>):LayerConstraint=>{
  const result=clone(constraint);
  if(result.condition&&!layeredConditionMatches(result.condition,payload,paths)){delete result.presence;delete result.condition;}else delete result.condition;
  result.rules=((constraint.rules??[]) as Record<string,unknown>[]).flatMap((rule)=>{
    const outcome=executable(constraint,rule);
    if(!outcome||outcome.enabled===false||((outcome.arrayScope as {boundaries?:unknown[]}|undefined)?.boundaries?.length)||!layeredConditionMatches(outcome.condition as Record<string,unknown>|undefined,payload,paths))return[];
    const active=clone(outcome);delete active.condition;return[active];
  });
  return constraintWithPeerRules(result);
};
const peerResolution=(property:EffectiveProperty,payload:Record<string,unknown>,paths:ReadonlyMap<string,string>):{constraints:LayerConstraint[];conflict?:LayerConflict}=>{
  const contributions=property.peerContributions??[],constraints=contributions.map(({constraint})=>resolvedPeerConstraint(constraint,payload,paths));let incompatible=peerSetMismatch(constraints);
  for(let left=0;left<constraints.length;left+=1)for(let right=left+1;right<constraints.length;right+=1)incompatible||=peerMismatch(constraints[left]!,constraints[right]!);
  return{constraints,...(incompatible?{conflict:{path:property.path,message:"conditional Shared Profile peers conflict; add an explicit contextual resolution",contributors:contributions.map(({contributorName})=>contributorName)}}:{})};
};
const composeResolvedPeers=(property:EffectiveProperty,constraints:readonly LayerConstraint[]):EffectiveProperty=>{
  const result=clone(property),first=<K extends keyof LayerConstraint>(key:K):LayerConstraint[K]|undefined=>constraints.find((constraint)=>constraint[key]!==undefined)?.[key],facetKeys:(keyof LayerConstraint)[]=["concept","type","itemType","itemSchema","allowedValues","allowedValueIds","allowedValueProvenance","presence","patterns","minimum","maximum","minItems","maxItems","expectedValue","enforcement","target","condition","displayText","documentation","comments","examples","definitionId","overrideReferences"];
  for(const key of facetKeys)delete result[key];delete result.expectedContributor;delete result.expectedContributors;
  for(const key of ["concept","type","itemType","itemSchema","allowedValueIds","allowedValueProvenance","target","displayText","documentation","comments","examples","definitionId"] as const){const value=first(key);if(value!==undefined)(result[key] as unknown)=clone(value);}
  const presences=constraints.flatMap(({presence})=>presence?[presence]:[]);if(presences.includes("required"))result.presence="required";else if(presences.includes("forbidden"))result.presence="forbidden";else if(presences.includes("optional"))result.presence="optional";else if(presences.includes("permitted"))result.presence="permitted";
  const expected=first("expectedValue"),allowed=constraints.flatMap(({allowedValues})=>allowedValues?.length?[allowedValues]:[]);if(expected!==undefined){result.expectedValue=clone(expected);const owners=(property.peerContributions??[]).flatMap((contribution,index)=>same(constraints[index]?.expectedValue,expected)?[contribution.contributorName]:[]).sort();if(owners.length){result.expectedContributors=owners;result.expectedContributor=owners.join(" + ");}}else if(allowed.length){const intersection=allowed.slice(1).reduce<unknown[]>((values,candidates)=>values.filter((value)=>candidates.some((candidate)=>same(value,candidate))),[...allowed[0]!]);result.allowedValues=clone(intersection.sort((left,right)=>JSON.stringify(left).localeCompare(JSON.stringify(right))));}
  const patterns=[...new Set(constraints.flatMap(({patterns})=>patterns??[]))].sort();if(patterns.length)result.patterns=patterns;
  const minimums=constraints.flatMap(({minimum})=>minimum===undefined?[]:[minimum]),maximums=constraints.flatMap(({maximum})=>maximum===undefined?[]:[maximum]),minimumItems=constraints.flatMap(({minItems})=>minItems===undefined?[]:[minItems]),maximumItems=constraints.flatMap(({maxItems})=>maxItems===undefined?[]:[maxItems]);if(minimums.length)result.minimum=Math.max(...minimums);if(maximums.length)result.maximum=Math.min(...maximums);if(minimumItems.length)result.minItems=Math.max(...minimumItems);if(maximumItems.length)result.maxItems=Math.min(...maximumItems);
  const enforcement=constraints.some((constraint)=>constraint.enforcement==="invariant")?"invariant":first("enforcement");if(enforcement)result.enforcement=enforcement;
  const references=[...new Set(constraints.flatMap(({overrideReferences})=>overrideReferences??[]))].sort();if(references.length)result.overrideReferences=references;
  const peerIds=new Set((property.peerContributions??[]).map(({contributorId})=>contributorId)),uniqueRules=(rules:Record<string,unknown>[]):Record<string,unknown>[]=>[...new Map(rules.map((rule)=>[JSON.stringify(rule),clone(rule)])).values()].sort((left,right)=>JSON.stringify(left).localeCompare(JSON.stringify(right)));result.origins=property.origins.filter(({contributorId})=>peerIds.has(contributorId));result.superseded=[];result.rules=uniqueRules((property.peerContributions??[]).flatMap(({constraint})=>(constraint.rules??[]) as Record<string,unknown>[]));result.reusableRules=uniqueRules((property.peerContributions??[]).flatMap(({constraint})=>(constraint.reusableRules??[]) as Record<string,unknown>[]));
  return result;
};
const replayDownstream=(property:EffectiveProperty,base:EffectiveProperty,payload:Record<string,unknown>,paths:ReadonlyMap<string,string>):{property:EffectiveProperty;conflicts:LayerConflict[]}=>{
  let result=base;const conflicts:LayerConflict[]=[];
  for(const contribution of property.downstreamContributions??[]){const owned:EffectiveProperty={...constraintWithStructuredRules(clone(contribution.constraint)),origins:[],superseded:[]},resolved=resolveOrdinaryProperty(owned,payload,paths),contributor={id:contribution.contributorId,name:contribution.contributorName,scope:contribution.scope,constraints:[contribution.constraint],...(contribution.inheritanceRoutes?.length?{inheritanceRoutes:contribution.inheritanceRoutes}:{})};conflicts.push(...resolved.conflicts);result=mergeLayeredProperty(result,resolved.property,contributor,contribution.parallelPair===true,false,(path,message,names)=>conflicts.push({path,message,contributors:names}));}
  return{property:result,conflicts};
};

function resolveOrdinaryProperty(property:EffectiveProperty,payload:Record<string,unknown>,paths:ReadonlyMap<string,string>):{property:EffectiveProperty;conflicts:LayerConflict[]}{
  const result=clone(property),matches=conditional(property,payload,paths),conflicts:LayerConflict[]=[];
  const presence=matches.filter(({kind})=>kind==="presence");
  if(presence.length){if(differing(presence,(rule)=>rule.presence))conflicts.push(conflictFor(property.path,"presence",presence));else if(typeof presence[0]!.presence==="string")result.presence=presence[0]!.presence as NonNullable<EffectiveProperty["presence"]>;}
  const values=matches.filter(({kind,operator})=>(kind==="value"&&operator===undefined)||kind==="allowed-values");
  if(values.length){
    const definition=(rule:Record<string,unknown>)=>rule.allowedValues!==undefined?{allowedValues:rule.allowedValues}:{expectedValue:rule.expectedValue};
    if(differing(values,definition))conflicts.push(conflictFor(property.path,"value",values));
    else if(values[0]!.allowedValues!==undefined){delete result.expectedValue;result.allowedValues=clone(values[0]!.allowedValues as unknown[]);}
    else{delete result.allowedValues;result.expectedValue=clone(values[0]!.expectedValue);}
  }
  const patterns=matches.filter(({kind,pattern})=>kind==="pattern"&&typeof pattern==="string");
  if(patterns.length)result.patterns=[...new Set(patterns.map(({pattern})=>String(pattern)))];
  const ranges=matches.filter(({kind})=>kind==="range"),minimums=ranges.map(({minimum})=>minimum).filter((value):value is number=>typeof value==="number"),maximums=ranges.map(({maximum})=>maximum).filter((value):value is number=>typeof value==="number");
  if(minimums.length)result.minimum=Math.max(...minimums);if(maximums.length)result.maximum=Math.min(...maximums);
  if(result.minimum!==undefined&&result.maximum!==undefined&&result.minimum>result.maximum)conflicts.push(conflictFor(property.path,"range",ranges));
  const cardinality=matches.filter(({kind})=>kind==="cardinality"),minimumItems=cardinality.map(({minItems})=>minItems).filter((value):value is number=>typeof value==="number"),maximumItems=cardinality.map(({maxItems})=>maxItems).filter((value):value is number=>typeof value==="number");
  if(minimumItems.length)result.minItems=Math.max(...minimumItems);if(maximumItems.length)result.maxItems=Math.min(...maximumItems);
  if(result.minItems!==undefined&&result.maxItems!==undefined&&result.minItems>result.maxItems)conflicts.push(conflictFor(property.path,"cardinality",cardinality));
  return{property:result,conflicts};
}
function resolveProperty(property:EffectiveProperty,payload:Record<string,unknown>,paths:ReadonlyMap<string,string>):{property:EffectiveProperty;conflicts:LayerConflict[]}{
  const ordinary=resolveOrdinaryProperty(property,payload,paths),peers=property.peerContributions?.length?peerResolution(property,payload,paths):undefined;
  if(peers?.conflict)return{property:clone(property),conflicts:[peers.conflict]};
  if(peers){const replayed=replayDownstream(property,composeResolvedPeers(property,peers.constraints),payload,paths);return{property:replayed.property,conflicts:[...ordinary.conflicts,...replayed.conflicts]};}
  return ordinary;
}

export function resolveConditionalLayeredSchema(compiled:CompiledLayeredSchema,payload:Record<string,unknown>):CompiledLayeredSchema {
  const paths=layeredPropertyPaths(compiled),properties:Record<string,EffectiveProperty>={},conflicts=[...compiled.conflicts];
  for(const [path,property] of Object.entries(compiled.properties)){const resolved=resolveProperty(property,payload,paths);properties[path]=resolved.property;conflicts.push(...resolved.conflicts);}
  return{...compiled,status:conflicts.length?"blocked":"ready",properties,conflicts};
}
