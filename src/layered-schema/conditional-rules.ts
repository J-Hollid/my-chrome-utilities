import type {CompiledLayeredSchema,EffectiveProperty,LayerConflict} from "../data-layer-layered-schema.js";

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
const reusableOutcome=(property:EffectiveProperty,rule:Record<string,unknown>):Record<string,unknown>|undefined=>{
  const embedded=rule.reusableOutcome;
  if(embedded&&typeof embedded==="object"&&!Array.isArray(embedded))return embedded as Record<string,unknown>;
  return (property.reusableRules??[]).find((candidate)=>String(candidate.id??"")===String(rule.reusableRuleId??"")) as Record<string,unknown>|undefined;
};
const executable=(property:EffectiveProperty,rule:Record<string,unknown>):Record<string,unknown>|undefined=>{
  if(rule.kind!=="reusable")return rule;
  const outcome=reusableOutcome(property,rule);if(!outcome)return undefined;
  return{...clone(outcome),id:rule.id,name:rule.name??outcome.name,condition:rule.condition,enabled:rule.enabled,severity:rule.severity??outcome.severity,message:rule.message??outcome.message};
};
const conditional=(property:EffectiveProperty,payload:Record<string,unknown>,paths:ReadonlyMap<string,string>):Record<string,unknown>[]=>((property.rules??[]) as Record<string,unknown>[]).flatMap((rule)=>{
  const outcome=executable(property,rule);
  if(!outcome||outcome.enabled===false)return[];
  const alreadyProjected=!outcome.condition&&rule.kind!=="reusable"&&["pattern","range","cardinality"].includes(String(outcome.kind));
  return!alreadyProjected&&layeredConditionMatches(outcome.condition as Record<string,unknown>|undefined,payload,paths)?[outcome]:[];
});
const differing=(rules:Record<string,unknown>[],read:(rule:Record<string,unknown>)=>unknown):boolean=>new Set(rules.map((rule)=>JSON.stringify(read(rule)))).size>1;
const conflictFor=(path:string,facet:string,rules:Record<string,unknown>[]):LayerConflict=>({path,message:`conditional ${facet} outcomes contradict`,contributors:rules.map(named)});

function resolveProperty(property:EffectiveProperty,payload:Record<string,unknown>,paths:ReadonlyMap<string,string>):{property:EffectiveProperty;conflicts:LayerConflict[]}{
  const result=clone(property),matches=conditional(property,payload,paths),conflicts:LayerConflict[]=[];
  const presence=matches.filter(({kind})=>kind==="presence");
  if(presence.length){if(differing(presence,(rule)=>rule.presence))conflicts.push(conflictFor(property.path,"presence",presence));else if(typeof presence[0]!.presence==="string")result.presence=presence[0]!.presence as NonNullable<EffectiveProperty["presence"]>;}
  const values=matches.filter(({kind})=>kind==="value");
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

export function resolveConditionalLayeredSchema(compiled:CompiledLayeredSchema,payload:Record<string,unknown>):CompiledLayeredSchema {
  const paths=layeredPropertyPaths(compiled),properties:Record<string,EffectiveProperty>={},conflicts=[...compiled.conflicts];
  for(const [path,property] of Object.entries(compiled.properties)){const resolved=resolveProperty(property,payload,paths);properties[path]=resolved.property;conflicts.push(...resolved.conflicts);}
  return{...compiled,status:conflicts.length?"blocked":"ready",properties,conflicts};
}
