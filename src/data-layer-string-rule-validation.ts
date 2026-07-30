export type StringLiteralRuleKind="starts-with"|"ends-with"|"includes";
export interface StringRuleKindOption {kind:StringLiteralRuleKind;label:string;}
export type ValueRuleOperator="Equals"|"Does not equal"|"Starts with"|"Does not start with"|"Ends with"|"Does not end with"|"Includes"|"Does not include";
export type RegularExpressionTestResult=
  |{state:"empty";text:""}
  |{state:"match";text:"Matches pattern";treatment:"valid-green"}
  |{state:"no-match";text:"Does not match pattern";treatment:"invalid-red"}
  |{state:"invalid";text:string};

const options:readonly StringRuleKindOption[]=[
  {kind:"starts-with",label:"Starts with"},
  {kind:"ends-with",label:"Ends with"},
  {kind:"includes",label:"Includes"},
];
const equalityOperators:readonly ValueRuleOperator[]=["Equals","Does not equal"];
const stringOperators:readonly ValueRuleOperator[]=[...equalityOperators,"Starts with","Does not start with","Ends with","Does not end with","Includes","Does not include"];
const legacyOperators:Record<StringLiteralRuleKind,ValueRuleOperator>={"starts-with":"Starts with","ends-with":"Ends with","includes":"Includes"};

export const valueOperatorOptions=(propertyType:string|undefined):ValueRuleOperator[]=>
  propertyType?.toLocaleLowerCase()==="string"?[...stringOperators]:["number","integer","boolean"].includes(propertyType?.toLocaleLowerCase()??"")?[...equalityOperators]:[];

export function valueRuleOperand(propertyType:string|undefined,value:string):unknown {
  if(propertyType?.toLocaleLowerCase()==="boolean")return value==="true";
  if(["number","integer"].includes(propertyType?.toLocaleLowerCase()??"")){
    const numeric=Number(value);
    if(!Number.isFinite(numeric)||propertyType?.toLocaleLowerCase()==="integer"&&!Number.isInteger(numeric))return undefined;
    return numeric;
  }
  return value;
}

export function normalizeValueRule<T extends Record<string,unknown>>(rule:T):T {
  if(!isStringLiteralRuleKind(rule.kind))return structuredClone(rule);
  const {literal,...retained}=structuredClone(rule);
  return{...retained,kind:"value",operator:legacyOperators[rule.kind],expectedValue:literal} as unknown as T;
}

export function valueRuleMatches(operator:unknown,actual:unknown,operand:unknown):boolean {
  const equal=actual===operand,value=String(actual??""),expected=String(operand??"");
  if(operator==="Equals")return equal;
  if(operator==="Does not equal")return!equal;
  if(operator==="Starts with")return value.startsWith(expected);
  if(operator==="Does not start with")return!value.startsWith(expected);
  if(operator==="Ends with")return value.endsWith(expected);
  if(operator==="Does not end with")return!value.endsWith(expected);
  if(operator==="Includes")return value.includes(expected);
  if(operator==="Does not include")return!value.includes(expected);
  return false;
}

export function valueRuleRequirement(operator:unknown,operand:unknown):string {
  const value=String(operand??"");
  if(operator==="Equals")return`equal ${value}`;
  if(operator==="Does not equal")return`not equal ${value}`;
  if(operator==="Starts with")return`start with ${value}`;
  if(operator==="Does not start with")return`not start with ${value}`;
  if(operator==="Ends with")return`end with ${value}`;
  if(operator==="Does not end with")return`not end with ${value}`;
  if(operator==="Includes")return`include ${value}`;
  if(operator==="Does not include")return`not include ${value}`;
  return value;
}

export const stringRuleKindOptions=(propertyType:string|undefined):StringRuleKindOption[]=>
  propertyType?.toLocaleLowerCase()==="string"?options.map((option)=>({...option})):[];

export const isStringLiteralRuleKind=(kind:unknown):kind is StringLiteralRuleKind=>
  options.some((option)=>option.kind===kind);

export function stringRuleMatches(kind:unknown,actual:unknown,literal:unknown):boolean {
  const value=String(actual??""),expected=String(literal??"");
  if(kind==="starts-with")return value.startsWith(expected);
  if(kind==="ends-with")return value.endsWith(expected);
  if(kind==="includes")return value.includes(expected);
  return false;
}

export function stringRuleRequirement(kind:unknown,literal:unknown):string {
  const value=String(literal??"");
  if(kind==="starts-with")return`start with ${value}`;
  if(kind==="ends-with")return`end with ${value}`;
  if(kind==="includes")return`include ${value}`;
  return value;
}

export function regularExpressionIssue(expression:unknown):string|undefined {
  const value=String(expression??"");
  if(!value.trim())return"Enter a regular expression";
  try{new RegExp(value);return undefined;}
  catch(error){return`Invalid regular expression: ${error instanceof Error?error.message:String(error)}`;}
}

export function regularExpressionTest(expression:unknown,sample:unknown):RegularExpressionTestResult {
  const issue=regularExpressionIssue(expression);
  if(issue)return issue==="Enter a regular expression"?{state:"empty",text:""}:{state:"invalid",text:issue};
  if(String(sample??"")==="")return{state:"empty",text:""};
  return new RegExp(String(expression)).test(String(sample))
    ?{state:"match",text:"Matches pattern",treatment:"valid-green"}
    :{state:"no-match",text:"Does not match pattern",treatment:"invalid-red"};
}
