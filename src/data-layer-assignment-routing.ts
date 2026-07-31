import {conditionMatches,type Condition} from "./data-layer-specification-project.js";

export type GuidedAssignmentConditionKind="Environment"|"Host"|"Pathname"|"Query"|"Hash"|"Context data";
export interface GuidedAssignmentConditionDescriptor {kind:GuidedAssignmentConditionKind;guidedInput:string;field:string;comparisons:readonly string[];valueKind:"environment"|"text"|"typed"|"schema-property";}
export interface AssignmentConditionProperty {path:string;type:string;}
export interface AssignmentConditionControl extends AssignmentConditionProperty {comparisons:readonly string[];valueType:string;}
export interface GuidedAssignmentConditionInput {kind:GuidedAssignmentConditionKind;comparison:string;value?:string;parameter?:string;property?:AssignmentConditionProperty;valueType?:string;}

const existence=["exists","does not exist"] as const;
const stringComparisons=[...existence,"equals","does not equal","is one of","starts with","contains","matches pattern"] as const;
const numberComparisons=[...existence,"equals","does not equal","is greater than","is at least","is less than","is at most"] as const;
const booleanComparisons=[...existence,"equals","does not equal"] as const;
const existenceOnlyComparisons=[...existence] as const;

export const guidedAssignmentConditionKinds:readonly GuidedAssignmentConditionDescriptor[]=[
  {kind:"Environment",guidedInput:"one configured project environment",field:"environment",comparisons:["equals","does not equal"],valueKind:"environment"},
  {kind:"Host",guidedInput:"host comparison and host value",field:"host",comparisons:["equals","does not equal","starts with","matches pattern"],valueKind:"text"},
  {kind:"Pathname",guidedInput:"exact, starts-with, or pattern comparison and path",field:"pathname",comparisons:["equals","starts with","matches pattern"],valueKind:"text"},
  {kind:"Query",guidedInput:"parameter name, comparison, and typed value",field:"query",comparisons:stringComparisons,valueKind:"typed"},
  {kind:"Hash",guidedInput:"hash comparison and value",field:"hash",comparisons:["equals","does not equal","starts with","matches pattern"],valueKind:"text"},
  {kind:"Context data",guidedInput:"schema property, compatible comparison, and typed value",field:"context",comparisons:stringComparisons,valueKind:"schema-property"},
] as const;

export function assignmentConditionControl(property:AssignmentConditionProperty):AssignmentConditionControl{
  const type=property.type==="integer"?"number":property.type||"string",comparisons=type==="number"?numberComparisons:type==="boolean"?booleanComparisons:["object","array","null"].includes(type)?existenceOnlyComparisons:stringComparisons;
  return{path:property.path,type:property.type,comparisons,valueType:type};
}

const typedValue=(type:string,text:string):unknown=>{
  if(type==="number"){const value=Number(text);if(!Number.isFinite(value))throw new Error("Enter a numeric typed value.");return value;}
  if(type==="boolean"){if(text!=="true"&&text!=="false")throw new Error("Choose a boolean typed value.");return text==="true";}
  if(type==="null")return null;
  return text;
};

export function buildGuidedAssignmentCondition(input:GuidedAssignmentConditionInput):Condition{
  const descriptor=guidedAssignmentConditionKinds.find(({kind})=>kind===input.kind)!;
  if(input.kind==="Context data"&&!input.property?.path)throw new Error("Choose a schema property.");
  if(input.kind==="Query"&&!input.parameter?.trim())throw new Error("Enter a query parameter name.");
  const control=input.kind==="Context data"?assignmentConditionControl(input.property!):undefined,comparisons=control?.comparisons??descriptor.comparisons;
  if(!comparisons.includes(input.comparison))throw new Error(`Choose a compatible ${input.kind} comparison.`);
  const field=input.kind==="Context data"?input.property!.path:input.kind==="Query"?`query.${input.parameter!.trim()}`:descriptor.field;
  if(existence.includes(input.comparison as typeof existence[number]))return{kind:"predicate",field,operator:input.comparison};
  const text=input.value??"";if(!text.trim())throw new Error(`Enter a ${input.kind} value.`);
  const type=control?.valueType??input.valueType??"string",value=typedValue(type,text);
  if(input.comparison==="matches pattern")return{kind:"predicate",field,operator:input.comparison,pattern:text};
  if(input.comparison==="is one of")return{kind:"predicate",field,operator:input.comparison,values:text.split(",").map((entry)=>typedValue(type,entry.trim())).filter((entry)=>entry!=="")};
  return{kind:"predicate",field,operator:input.comparison,value};
}

const fieldLabel=(field:string):string=>field.split(/[./]/).filter(Boolean)[0]??"applicability";
export function assignmentConditionRejections(condition:Condition|undefined,observation:Record<string,unknown>):string[]{
  if(!condition||conditionMatches(condition,observation))return[];
  if(condition.kind==="predicate")return[fieldLabel(condition.field)];
  if(condition.kind==="not")return["applicability"];
  const children=condition.conditions.flatMap((child)=>assignmentConditionRejections(child,observation));
  return children.length?[...new Set(children)]:["applicability"];
}
