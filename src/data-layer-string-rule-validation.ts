export type StringLiteralRuleKind="starts-with"|"ends-with"|"includes";
export interface StringRuleKindOption {kind:StringLiteralRuleKind;label:string;}
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

export function renderRegularExpressionTester(dom:Document,pattern:HTMLInputElement):HTMLElement {
  const host=dom.createElement("div"),sample=dom.createElement("input"),result=dom.createElement("p");
  host.dataset.patternTester="true";sample.type="text";sample.setAttribute("aria-label","Test value");result.setAttribute("aria-live","polite");result.dataset.patternTestResult="true";
  const render=():void=>{
    const state=regularExpressionTest(pattern.value,sample.value);result.textContent=state.text;result.dataset.patternTestState=state.state;
    if("treatment" in state){result.dataset.patternTestTreatment=state.treatment;result.style.color=state.treatment==="valid-green"?"var(--valid-color, #187a3d)":"var(--invalid-color, #b42318)";}
    else{delete result.dataset.patternTestTreatment;result.style.removeProperty("color");}
  };
  pattern.addEventListener("input",render);sample.addEventListener("input",render);host.append(sample,result);render();return host;
}
