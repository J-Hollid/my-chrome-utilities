import type {LayerConstraint} from "./data-layer-layered-schema.js";

type ConditionPredicate={kind:"predicate";propertyId:string;operator:string;value?:unknown};
type ConditionGroup={kind:"all"|"any"|"not";children:ComposedCondition[]};
type ComposedCondition=ConditionPredicate|ConditionGroup;
export interface ComposedPropertyChoice {path:string;definitionId:string;type?:string|undefined;}
export interface ComposedFacetDraft {
  type?:string|undefined;itemType?:string|undefined;presence?:LayerConstraint["presence"]|undefined;expectedValue?:unknown;allowedValues:unknown[];
  condition:ConditionGroup;rules:Record<string,unknown>[];documentation:string;exampleMethod:"allowed-value"|"custom"|"blank";exampleValue?:unknown;
}

const clone=<T>(value:T):T=>structuredClone(value);
const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
const propertyChoice=(choices:readonly ComposedPropertyChoice[],definitionId:string):ComposedPropertyChoice|undefined=>choices.find((choice)=>choice.definitionId===definitionId);
const conditionPropertyPath=(choices:readonly ComposedPropertyChoice[],definitionId:string):string=>propertyChoice(choices,definitionId)?.path??definitionId;
const normalizedCondition=(condition:Record<string,unknown>):ComposedCondition=>{
  if(condition.kind==="predicate")return clone(condition) as unknown as ConditionPredicate;
  if(["all","any","not"].includes(String(condition.kind)))return{kind:condition.kind as ConditionGroup["kind"],children:((condition.children as Record<string,unknown>[]|undefined)??[]).map(normalizedCondition)};
  return{kind:"predicate",propertyId:String(condition.propertyId??condition.field??"/property"),operator:String(condition.operator??(condition.equals!==undefined?"Equals":"Exists")),...(condition.value!==undefined?{value:clone(condition.value)}:condition.equals!==undefined?{value:clone(condition.equals)}:{})};
};
const conditionGroup=(condition:LayerConstraint["condition"]):ConditionGroup=>condition&&["all","any","not"].includes(String(condition.kind))?normalizedCondition(condition) as ConditionGroup:{kind:"all",children:condition?[normalizedCondition(condition)]:[]};

export function composedFacetDraft(local:LayerConstraint,effective:LayerConstraint):ComposedFacetDraft{
  const examples=local.examples??effective.examples??[],allowedValues=clone([...(local.allowedValues??effective.allowedValues??[])]),exampleMethod:ComposedFacetDraft["exampleMethod"]=!examples.length?"blank":allowedValues.some((value)=>same(value,examples[0]))?"allowed-value":"custom";
  return{type:local.type??effective.type,itemType:local.itemType??effective.itemType,presence:local.presence??effective.presence,expectedValue:Object.hasOwn(local,"expectedValue")?clone(local.expectedValue):clone(effective.expectedValue),allowedValues,condition:conditionGroup(local.condition??effective.condition),rules:clone([...(local.rules??effective.rules??[])]),documentation:String(local.documentation??effective.documentation??""),exampleMethod,...(examples.length?{exampleValue:clone(examples[0])}:{})};
}

export function typedComposedValue(type:string|undefined,text:string):unknown{
  if(type==="number"){const value=Number(text);if(!Number.isFinite(value))throw new Error("Enter a number.");return value;}
  if(type==="integer"){const value=Number(text);if(!Number.isInteger(value))throw new Error("Enter a whole number.");return value;}
  if(type==="boolean"){if(text!=="true"&&text!=="false")throw new Error("Enter true or false.");return text==="true";}
  if(type==="null")return null;
  if(type==="array"||type==="object"){let value:unknown;try{value=JSON.parse(text);}catch{throw new Error(`Enter valid JSON for ${type}.`);}if(type==="array"&&!Array.isArray(value)||type==="object"&&(!value||typeof value!=="object"||Array.isArray(value)))throw new Error(`Enter a JSON ${type}.`);return value;}
  return text;
}

export function addComposedAllowedValue(draft:ComposedFacetDraft,value:unknown):ComposedFacetDraft{return{...draft,allowedValues:[...draft.allowedValues,clone(value)]};}
export function removeComposedAllowedValue(draft:ComposedFacetDraft,index:number):ComposedFacetDraft{return{...draft,allowedValues:draft.allowedValues.filter((_,candidate)=>candidate!==index)};}
export function moveComposedAllowedValue(draft:ComposedFacetDraft,index:number,delta:number):ComposedFacetDraft{const target=index+delta;if(target<0||target>=draft.allowedValues.length)return draft;const allowedValues=clone(draft.allowedValues);[allowedValues[index],allowedValues[target]]=[allowedValues[target]!,allowedValues[index]!];return{...draft,allowedValues};}

const groupAt=(root:ConditionGroup,path:readonly number[]):ConditionGroup=>path.reduce((group,index)=>{const child=group.children[index];if(!child||child.kind==="predicate")throw new Error("Choose a condition group.");return child;},root);
export function addComposedConditionGroup(draft:ComposedFacetDraft,path:readonly number[],kind:ConditionGroup["kind"]):ComposedFacetDraft{const condition=clone(draft.condition),group=groupAt(condition,path);if(group.kind==="not"&&group.children.length)throw new Error("Not accepts one branch.");group.children.push({kind,children:[]});return{...draft,condition};}
export function addComposedConditionPredicate(draft:ComposedFacetDraft,path:readonly number[],predicate:Omit<ConditionPredicate,"kind">):ComposedFacetDraft{const condition=clone(draft.condition),group=groupAt(condition,path);if(group.kind==="not"&&group.children.length)throw new Error("Not accepts one branch.");group.children.push({kind:"predicate",...clone(predicate)});return{...draft,condition};}
export function composedConditionPredicate(choice:ComposedPropertyChoice,operator:string,value?:unknown):Omit<ConditionPredicate,"kind">{return{propertyId:choice.definitionId,operator,...(value!==undefined?{value:clone(value)}:{})};}
export function removeComposedConditionBranch(draft:ComposedFacetDraft,path:readonly number[]):ComposedFacetDraft{if(!path.length)return{...draft,condition:{kind:"all",children:[]}};const condition=clone(draft.condition),parent=groupAt(condition,path.slice(0,-1));parent.children.splice(path.at(-1)!,1);return{...draft,condition};}
export function moveComposedConditionBranch(draft:ComposedFacetDraft,path:readonly number[],delta:number):ComposedFacetDraft{if(!path.length)return draft;const condition=clone(draft.condition),parent=groupAt(condition,path.slice(0,-1)),index=path.at(-1)!,target=index+delta;if(index<0||index>=parent.children.length||target<0||target>=parent.children.length)return draft;[parent.children[index],parent.children[target]]=[parent.children[target]!,parent.children[index]!];return{...draft,condition};}
export function addComposedRule(draft:ComposedFacetDraft,rule:Record<string,unknown>):ComposedFacetDraft{return{...draft,rules:[...draft.rules,clone(rule)]};}
export function overrideComposedRule(draft:ComposedFacetDraft,index:number,id:string):ComposedFacetDraft{const rule=draft.rules[index];if(!rule)return draft;const replacement=clone(rule);replacement.id=id;replacement.provenance={source:"created",state:"effective"};return{...draft,rules:draft.rules.map((candidate,candidateIndex)=>candidateIndex===index?replacement:candidate)};}
export function composedRuleIssue(rule:Record<string,unknown>):string|undefined{
  if(!String(rule.message??"").trim())return"Enter an issue message.";
  if(rule.kind==="pattern"&&!String(rule.pattern??"").trim())return"Enter a regular expression.";
  if(rule.kind==="range"&&rule.minimum===undefined&&rule.maximum===undefined)return"Enter a minimum or maximum.";
  if(rule.kind==="cardinality"&&rule.minItems===undefined&&rule.maxItems===undefined)return"Enter minimum or maximum items.";
  if(rule.kind==="condition"&&!rule.condition)return"Build a condition before adding a condition rule.";
  return undefined;
}

const valueAt=(observation:Record<string,unknown>,path:string):unknown=>path.split("/").filter(Boolean).reduce<unknown>((value,key)=>value&&typeof value==="object"?(value as Record<string,unknown>)[key]:undefined,observation);
export function evaluateComposedCondition(condition:ComposedCondition,observation:Record<string,unknown>,propertyChoices:readonly ComposedPropertyChoice[]=[]):boolean{if(condition.kind!=="predicate"){if(condition.kind==="all")return condition.children.every((child)=>evaluateComposedCondition(child,observation,propertyChoices));if(condition.kind==="any")return condition.children.some((child)=>evaluateComposedCondition(child,observation,propertyChoices));return!condition.children.some((child)=>evaluateComposedCondition(child,observation,propertyChoices));}const actual=valueAt(observation,conditionPropertyPath(propertyChoices,condition.propertyId)),expected=condition.value;switch(condition.operator){case"Equals":return same(actual,expected);case"Does not equal":return!same(actual,expected);case"Exists":return actual!==undefined;case"Does not exist":return actual===undefined;case"Starts with":return String(actual??"").startsWith(String(expected??""));case"Contains":return String(actual??"").includes(String(expected??""));case"Matches pattern":try{return new RegExp(String(expected??"")).test(String(actual??""));}catch{return false;}case"Greater than":return Number(actual)>Number(expected);case"At least":return Number(actual)>=Number(expected);case"Less than":return Number(actual)<Number(expected);case"At most":return Number(actual)<=Number(expected);default:return false;}}

export function sparseComposedFacets(draft:ComposedFacetDraft,inherited:LayerConstraint):Omit<LayerConstraint,"path">{
  if(draft.exampleMethod!=="blank"&&draft.exampleValue===undefined)throw new Error(draft.exampleMethod==="allowed-value"?"Choose an allowed-value example.":"Enter a custom typed example.");
  if(draft.exampleMethod==="allowed-value"&&!draft.allowedValues.some((value)=>same(value,draft.exampleValue)))throw new Error("Choose an example from the current allowed values.");
  const candidate:Omit<LayerConstraint,"path">={...(draft.type?{type:draft.type}:{}),...(draft.itemType?{itemType:draft.itemType}:{}),...(draft.presence?{presence:draft.presence}:{}),...(draft.expectedValue!==undefined?{expectedValue:clone(draft.expectedValue)}:{}),...(draft.allowedValues.length?{allowedValues:clone(draft.allowedValues)}:{}),...(draft.condition.children.length?{condition:clone(draft.condition) as unknown as Record<string,unknown>}:{ }),...(draft.rules.length?{rules:clone(draft.rules)}:{}),...(draft.documentation?{documentation:draft.documentation}:{}),...(draft.exampleMethod!=="blank"?{examples:[clone(draft.exampleValue)]}:{})};
  return Object.fromEntries(Object.entries(candidate).filter(([key,value])=>!same(value,inherited[key as keyof LayerConstraint]))) as Omit<LayerConstraint,"path">;
}

export {mountComposedSchemaFacetBuilder} from "./composed-schema/facet-builder.js";
