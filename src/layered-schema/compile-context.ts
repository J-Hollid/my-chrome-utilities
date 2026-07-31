import type {LayerConstraint,LayerContext,LayerContributor,LayerItemSchema,LayerScope} from "../data-layer-layered-schema.js";
export const clone=<T>(value:T):T=>structuredClone(value);
export const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
export const included=(target:string|undefined,context:LayerContext):boolean=>!target||target==="all"||target===context.eventRole||target===context.eventId||target===context.occurrenceId;
export const origin=(contributor:LayerContributor)=>({contributorId:contributor.id,contributorName:contributor.name,scope:contributor.scope,...(contributor.inheritanceRoutes?.length?{inheritanceRoutes:[...contributor.inheritanceRoutes]}:{})});
export const branch=(scope:LayerScope):"page"|"event"|"shared"|"occurrence"=>scope==="Event"?"event":scope==="Page Group"||scope==="Page"||scope==="Flow Page-instance"?"page":scope==="Event-occurrence"?"occurrence":"shared";
export const parallelMismatch=(left:LayerConstraint,right:LayerConstraint):boolean=>Boolean(left.type&&right.type&&left.type!==right.type||left.expectedValue!==undefined&&right.expectedValue!==undefined&&!same(left.expectedValue,right.expectedValue)||left.presence==="required"&&right.presence==="forbidden"||left.presence==="forbidden"&&right.presence==="required");
export const peerMismatch=(left:LayerConstraint,right:LayerConstraint):boolean=>{
  const differentFacet=(key:"concept"|"displayText"|"documentation"|"comments"|"examples"|"target")=>left[key]!==undefined&&right[key]!==undefined&&!same(left[key],right[key]);
  return parallelMismatch(left,right)||Boolean(
  left.itemType&&right.itemType&&left.itemType!==right.itemType
  ||left.itemSchema&&right.itemSchema&&!same(left.itemSchema,right.itemSchema)
  ||left.definitionId&&right.definitionId&&left.definitionId!==right.definitionId
  ||left.allowedValueIds&&right.allowedValueIds&&!same(left.allowedValueIds,right.allowedValueIds)
  ||left.allowedValueProvenance&&right.allowedValueProvenance&&!same(left.allowedValueProvenance,right.allowedValueProvenance)
  ||left.allowedValues?.length&&right.allowedValues?.length&&!left.allowedValues.some((value)=>right.allowedValues!.some((candidate)=>same(value,candidate)))
  ||left.expectedValue!==undefined&&right.allowedValues?.length&&!right.allowedValues.some((value)=>same(value,left.expectedValue))
  ||right.expectedValue!==undefined&&left.allowedValues?.length&&!left.allowedValues.some((value)=>same(value,right.expectedValue))
  ||left.minimum!==undefined&&right.maximum!==undefined&&left.minimum>right.maximum
  ||right.minimum!==undefined&&left.maximum!==undefined&&right.minimum>left.maximum
  ||left.minItems!==undefined&&right.maxItems!==undefined&&left.minItems>right.maxItems
  ||right.minItems!==undefined&&left.maxItems!==undefined&&right.minItems>left.maxItems
  ||differentFacet("concept")||differentFacet("displayText")||differentFacet("documentation")||differentFacet("comments")||differentFacet("examples")||differentFacet("target")
  );
};
type NumericBoundary={value:number;inclusive:boolean};
const valueRules=(constraints:readonly LayerConstraint[]):Record<string,unknown>[]=>constraints.flatMap(({rules})=>(rules??[]) as Record<string,unknown>[]).filter(({kind,operator,enabled,condition,arrayScope})=>kind==="value"&&typeof operator==="string"&&enabled!==false&&!condition&&!((arrayScope as {boundaries?:unknown[]}|undefined)?.boundaries?.length));
const valueDomainMismatch=(constraints:readonly LayerConstraint[]):boolean=>{
  const rules=valueRules(constraints),equals=[...constraints.flatMap(({expectedValue})=>expectedValue===undefined?[]:[expectedValue]),...rules.filter(({operator})=>operator==="Equals").map(({expectedValue})=>expectedValue)],sets=[...constraints.flatMap(({allowedValues})=>allowedValues?.length?[allowedValues]:[]),...rules.filter(({operator,expectedValue})=>operator==="Is one of"&&Array.isArray(expectedValue)).map(({expectedValue})=>expectedValue as unknown[])],prefixes=rules.filter(({operator})=>operator==="Starts with").map(({expectedValue})=>String(expectedValue??"")),suffixes=rules.filter(({operator})=>operator==="Ends with").map(({expectedValue})=>String(expectedValue??"")),minimums:NumericBoundary[]=[...constraints.flatMap(({minimum})=>minimum===undefined?[]:[{value:minimum,inclusive:true}]),...rules.filter(({operator,expectedValue})=>["Greater than","Is greater than","At least","Is at least"].includes(String(operator))&&typeof expectedValue==="number").map(({operator,expectedValue})=>({value:expectedValue as number,inclusive:["At least","Is at least"].includes(String(operator))}))],maximums:NumericBoundary[]=[...constraints.flatMap(({maximum})=>maximum===undefined?[]:[{value:maximum,inclusive:true}]),...rules.filter(({operator,expectedValue})=>["Less than","Is less than","At most","Is at most"].includes(String(operator))&&typeof expectedValue==="number").map(({operator,expectedValue})=>({value:expectedValue as number,inclusive:["At most","Is at most"].includes(String(operator))}))];
  const lower=minimums.sort((left,right)=>right.value-left.value||Number(left.inclusive)-Number(right.inclusive))[0],upper=maximums.sort((left,right)=>left.value-right.value||Number(left.inclusive)-Number(right.inclusive))[0],matches=(value:unknown):boolean=>sets.every((choices)=>choices.some((candidate)=>same(candidate,value)))&&prefixes.every((prefix)=>String(value??"").startsWith(prefix))&&suffixes.every((suffix)=>String(value??"").endsWith(suffix))&&(!lower||typeof value==="number"&&(value>lower.value||lower.inclusive&&value===lower.value))&&(!upper||typeof value==="number"&&(value<upper.value||upper.inclusive&&value===upper.value));
  if(equals.length&&equals.some((value)=>!same(value,equals[0]))||lower&&upper&&(lower.value>upper.value||lower.value===upper.value&&(!lower.inclusive||!upper.inclusive)))return true;
  if(equals.length)return!matches(equals[0]);
  if(sets.length){const intersection=sets.reduce<unknown[]>((values,choices)=>values.filter((value)=>choices.some((candidate)=>same(candidate,value))),[...sets[0]!]);if(!intersection.some(matches))return true;}
  return prefixes.some((prefix)=>!prefixes.every((candidate)=>prefix.startsWith(candidate)||candidate.startsWith(prefix)))||suffixes.some((suffix)=>!suffixes.every((candidate)=>suffix.endsWith(candidate)||candidate.endsWith(suffix)));
};
export const peerSetMismatch=(constraints:readonly LayerConstraint[]):boolean=>{
  if(valueDomainMismatch(constraints))return true;
  const allowed=constraints.flatMap(({allowedValues})=>allowedValues?.length?[allowedValues]:[]);
  if(allowed.length>1&&!allowed.reduce((intersection,values)=>intersection.filter((value)=>values.some((candidate)=>same(value,candidate)))).length)return true;
  const identifiedAllowed=constraints.filter(({allowedValueIds,allowedValueProvenance})=>allowedValueIds?.length||allowedValueProvenance?.length);if(identifiedAllowed.length&&allowed.some((values)=>!same(values,allowed[0])))return true;
  const minimums=constraints.flatMap(({minimum})=>minimum===undefined?[]:[minimum]),maximums=constraints.flatMap(({maximum})=>maximum===undefined?[]:[maximum]),minimumItems=constraints.flatMap(({minItems})=>minItems===undefined?[]:[minItems]),maximumItems=constraints.flatMap(({maxItems})=>maxItems===undefined?[]:[maxItems]);
  if(minimums.length&&maximums.length&&Math.max(...minimums)>Math.min(...maximums)||minimumItems.length&&maximumItems.length&&Math.max(...minimumItems)>Math.min(...maximumItems))return true;
  const expected=constraints.find(({expectedValue})=>expectedValue!==undefined)?.expectedValue,type=constraints.find((constraint)=>constraint.type)?.type,itemType=constraints.find((constraint)=>constraint.itemType)?.itemType,itemSchema=constraints.find((constraint)=>constraint.itemSchema)?.itemSchema,presences=constraints.flatMap(({presence})=>presence?[presence]:[]),patterns=constraints.flatMap(({patterns})=>patterns??[]);
  const typeMatches=(value:unknown,candidate:string):boolean=>candidate==="array"?Array.isArray(value):candidate==="null"?value===null:candidate==="integer"?Number.isInteger(value):candidate==="object"?Boolean(value)&&typeof value==="object"&&!Array.isArray(value):typeof value===candidate;
  const itemMatches=(value:unknown,schema:LayerItemSchema):boolean=>(!schema.type||typeMatches(value,schema.type))&&(!schema.allowedValues?.length||schema.allowedValues.some((candidate)=>same(candidate,value)))&&(!schema.items||Array.isArray(value)&&value.every((item)=>itemMatches(item,schema.items!)));
  if(type&&(minimums.length||maximums.length)&&type!=="number"&&type!=="integer"||type&&(minimumItems.length||maximumItems.length)&&type!=="array"||type&&patterns.length&&type!=="string"||type&&(itemType||itemSchema)&&type!=="array")return true;
  if(type&&allowed.some((values)=>values.some((value)=>!typeMatches(value,type))))return true;
  try{for(const pattern of patterns)new RegExp(pattern);}catch{return true;}
  if(expected===undefined)return false;
  if(presences.includes("forbidden")||type&&!typeMatches(expected,type)||minimums.length&&(typeof expected!=="number"||expected<Math.max(...minimums))||maximums.length&&(typeof expected!=="number"||expected>Math.min(...maximums))||minimumItems.length&&(!Array.isArray(expected)||expected.length<Math.max(...minimumItems))||maximumItems.length&&(!Array.isArray(expected)||expected.length>Math.min(...maximumItems))||itemType&&(!Array.isArray(expected)||expected.some((value)=>!typeMatches(value,itemType)))||itemSchema&&(!Array.isArray(expected)||expected.some((value)=>!itemMatches(value,itemSchema))))return true;
  try{return patterns.some((pattern)=>!new RegExp(pattern).test(String(expected)));}catch{return true;}
};
const ordinaryRules=(rules:readonly Record<string,unknown>[]):readonly Record<string,unknown>[]=>rules.filter(({enabled,condition,arrayScope})=>enabled!==false&&!condition&&!((arrayScope as {boundaries?:Record<string,unknown>[]}|undefined)?.boundaries?.length));
const numericRuleValues=(rules:readonly Record<string,unknown>[],kind:string,field:string):number[]=>ordinaryRules(rules).filter((rule)=>rule.kind===kind&&typeof rule[field]==="number").map((rule)=>rule[field] as number);
export const constraintWithStructuredRules=(constraint:LayerConstraint):LayerConstraint=>{const rules=constraint.rules??[],patterns=[...new Set([...(constraint.patterns??[]),...ordinaryRules(rules).filter((rule)=>rule.kind==="pattern"&&typeof rule.pattern==="string").map((rule)=>rule.pattern as string)])],minimums=[...(constraint.minimum===undefined?[]:[constraint.minimum]),...numericRuleValues(rules,"range","minimum")],maximums=[...(constraint.maximum===undefined?[]:[constraint.maximum]),...numericRuleValues(rules,"range","maximum")],minimumItems=[...(constraint.minItems===undefined?[]:[constraint.minItems]),...numericRuleValues(rules,"cardinality","minItems")],maximumItems=[...(constraint.maxItems===undefined?[]:[constraint.maxItems]),...numericRuleValues(rules,"cardinality","maxItems")];return{...constraint,...(patterns.length?{patterns}:{}),...(minimums.length?{minimum:Math.max(...minimums)}:{}),...(maximums.length?{maximum:Math.min(...maximums)}:{}),...(minimumItems.length?{minItems:Math.max(...minimumItems)}:{}),...(maximumItems.length?{maxItems:Math.min(...maximumItems)}:{})};};
const peerRuleOutcome=(constraint:LayerConstraint,rule:Record<string,unknown>):Record<string,unknown>|undefined=>{
  if(rule.enabled===false||rule.condition||((rule.arrayScope as {boundaries?:unknown[]}|undefined)?.boundaries?.length))return;
  if(rule.kind!=="reusable")return rule;
  const embedded=rule.reusableOutcome,reusable=embedded&&typeof embedded==="object"&&!Array.isArray(embedded)?embedded:(constraint.reusableRules??[]).find((candidate)=>String(candidate.id??"")===String(rule.reusableRuleId??""));
  return reusable&&typeof reusable==="object"?{...reusable,...(rule.enforcement?{enforcement:rule.enforcement}:{})}:undefined;
};
export const peerRuleOutcomes=(constraint:LayerConstraint):LayerConstraint[]=>{
  const outcomes:LayerConstraint[]=[];
  for(const rule of (constraint.rules??[]) as Record<string,unknown>[]){
    const outcome=peerRuleOutcome(constraint,rule);if(!outcome)continue;
    const enforcement=outcome.enforcement==="invariant"||outcome.enforcement==="overridable"?outcome.enforcement:undefined,base:LayerConstraint={path:constraint.path,...(enforcement?{enforcement}:{})};
    if(outcome.kind==="presence"&&(outcome.presence==="required"||outcome.presence==="optional"||outcome.presence==="forbidden"||outcome.presence==="permitted"))outcomes.push({...base,presence:outcome.presence});
    else if((outcome.kind==="value"&&(outcome.operator===undefined||outcome.operator==="Equals"))||outcome.kind==="allowed-values")outcomes.push({...base,...(Array.isArray(outcome.allowedValues)?{allowedValues:outcome.allowedValues}:outcome.expectedValue!==undefined?{expectedValue:outcome.expectedValue}:{})});
    else if(outcome.kind==="value"&&outcome.operator==="Is one of"&&Array.isArray(outcome.expectedValue))outcomes.push({...base,allowedValues:outcome.expectedValue});
    else if(outcome.kind==="pattern"&&typeof outcome.pattern==="string")outcomes.push({...base,patterns:[outcome.pattern]});
    else if(outcome.kind==="range")outcomes.push({...base,...(typeof outcome.minimum==="number"?{minimum:outcome.minimum}:{}),...(typeof outcome.maximum==="number"?{maximum:outcome.maximum}:{})});
    else if(outcome.kind==="cardinality")outcomes.push({...base,...(typeof outcome.minItems==="number"?{minItems:outcome.minItems}:{}),...(typeof outcome.maxItems==="number"?{maxItems:outcome.maxItems}:{})});
  }
  return outcomes;
};
export const peerConstraintForCompile=(constraint:LayerConstraint):LayerConstraint=>{
  const effective=constraintWithPeerRules(constraint);
  if(!constraint.condition)return effective;
  const {condition,presence,...unconditional}=effective;
  return unconditional;
};
export const constraintWithPeerRules=(constraint:LayerConstraint):LayerConstraint=>{
  const base=constraintWithStructuredRules(constraint),outcomes=peerRuleOutcomes(base),presence=[base,...outcomes].flatMap(({presence})=>presence?[presence]:[]),expected=[base,...outcomes].find(({expectedValue})=>expectedValue!==undefined)?.expectedValue,allowed=[base,...outcomes].flatMap(({allowedValues})=>allowedValues?.length?[allowedValues]:[]),patterns=[...new Set([...(base.patterns??[]),...outcomes.flatMap(({patterns})=>patterns??[])])].sort(),minimums=[base,...outcomes].flatMap(({minimum})=>minimum===undefined?[]:[minimum]),maximums=[base,...outcomes].flatMap(({maximum})=>maximum===undefined?[]:[maximum]),minimumItems=[base,...outcomes].flatMap(({minItems})=>minItems===undefined?[]:[minItems]),maximumItems=[base,...outcomes].flatMap(({maxItems})=>maxItems===undefined?[]:[maxItems]),enforcement=[base,...outcomes].some(({enforcement})=>enforcement==="invariant")?"invariant":base.enforcement;
  const allowedIntersection=allowed.length?allowed.reduce((intersection,values)=>intersection.filter((value)=>values.some((candidate)=>same(value,candidate)))):undefined,effectivePresence=presence.includes("required")?"required":presence.includes("forbidden")?"forbidden":presence.includes("optional")?"optional":presence.includes("permitted")?"permitted":undefined;
  const {allowedValues:discardedAllowedValues,...withoutAllowedValues}=base;
  return{...(expected!==undefined?withoutAllowedValues:base),...(effectivePresence?{presence:effectivePresence}:{}),...(patterns.length?{patterns}:{}),...(minimums.length?{minimum:Math.max(...minimums)}:{}),...(maximums.length?{maximum:Math.min(...maximums)}:{}),...(minimumItems.length?{minItems:Math.max(...minimumItems)}:{}),...(maximumItems.length?{maxItems:Math.min(...maximumItems)}:{}),...(enforcement?{enforcement}:{}),...(expected!==undefined?{expectedValue:clone(expected)}:allowedIntersection?{allowedValues:clone(allowedIntersection)}:{})};
};
