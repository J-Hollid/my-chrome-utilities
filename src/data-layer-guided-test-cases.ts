import type {IdFactory,ProjectEntity,Requirement} from "./data-layer-specification-project.js";

export type GuidedTestCaseType="page-context"|"event-validation";
export type GuidedTestCaseStatus="Blocked"|"Matched"|"Mismatched"|"Stale";
export interface GuidedTestCaseResult {
  winner?:string;
  outcome?:string;
  issues?:readonly {path:string;code:string}[];
  evaluatorRevision:string;
  [key:string]:unknown;
}
export interface GuidedTestCase extends ProjectEntity {
  testType:GuidedTestCaseType;
  eventId?:string;
  pageId?:string;
  input:Record<string,unknown>;
  inputGuidance:{schemaId?:string;revision?:string;kind:"authoring-guidance"};
  sourceProvenance:{kind:string;id:string;revision:string};
  sourceSnapshot?:Record<string,unknown>;
  reviewedExpectations:Record<string,unknown>;
  actualResult?:GuidedTestCaseResult;
  evaluatorRevision?:string;
  status:GuidedTestCaseStatus;
  differences:{field:string;expected:unknown;actual:unknown}[];
}
export interface GuidedTestCaseSource {
  kind:string;
  id:string;
  revision:string;
  eventId?:string;
  pageId?:string;
  payload?:Record<string,unknown>;
  schemaId?:string;
  schemaRevision?:string;
  [key:string]:unknown;
}

export function guidedTestCaseTypeOptions(){
  return[
    {value:"page-context" as const,label:"Page context test",purpose:"Page Group applicability and Page validation",scope:"one production Page",evaluation:"production Page effective-schema evaluation"},
    {value:"event-validation" as const,label:"Event validation test",purpose:"Assignment routing and Event validation",scope:"one production Event and optional Page",evaluation:"production Assignment and schema evaluation"},
  ];
}

export function createGuidedTestCase(input:{name:string;testType:GuidedTestCaseType;eventId?:string;pageId?:string;source?:GuidedTestCaseSource;id:IdFactory}):GuidedTestCase{
  const source=input.source??{kind:"manual",id:input.id("manual-source"),revision:"draft"};
  const sourceSnapshot=Object.fromEntries(["eventId","destination","schemaId"].flatMap((key)=>source[key]===undefined?[]:[[key,structuredClone(source[key])]]));
  return{
    id:input.id("fixture"),
    name:input.name.trim(),
    testType:input.testType,
    ...(input.eventId??source.eventId?{eventId:input.eventId??source.eventId}:{}),
    ...(input.pageId??source.pageId?{pageId:input.pageId??source.pageId}:{}),
    input:structuredClone(source.payload??{}),
    inputGuidance:{...(source.schemaId?{schemaId:String(source.schemaId)}:{}),...(source.schemaRevision?{revision:String(source.schemaRevision)}:{}),kind:"authoring-guidance"},
    sourceProvenance:{kind:source.kind,id:source.id,revision:source.revision},
    ...(Object.keys(sourceSnapshot).length?{sourceSnapshot}:{}),
    reviewedExpectations:{},
    status:"Blocked",
    differences:[],
  };
}

export interface GuidedInputControl {
  path:string;
  control:"choice"|"text"|"number"|"boolean"|"object"|"array"|"nullable";
  jsonTypes:string[];
  required:boolean;
  active:boolean;
  depth:number;
  constraints:Record<string,unknown>;
  description?:string;
  explanation?:string;
  example?:unknown;
  origin?:string;
  value?:unknown;
}
type GuidedRequirement=Requirement&{
  minimum?:number;
  maximum?:number;
  minItems?:number;
  maxItems?:number;
  pattern?:string;
  itemType?:string;
  additionalProperties?:boolean;
  example?:unknown;
  type?:string|readonly string[];
  active?:boolean;
  explanation?:string;
};
const pathParts=(path:string):string[]=>path.split("/").filter(Boolean);
const valueAtPath=(value:Record<string,unknown>,path:string):unknown=>{
  const parts=pathParts(path);
  if(parts.includes("*"))return undefined;
  return parts.reduce<unknown>((current,key)=>current&&typeof current==="object"?(current as Record<string,unknown>)[key]:undefined,value);
};
export function guidedInputControls(requirements:readonly GuidedRequirement[],input:Record<string,unknown>):GuidedInputControl[]{
  return requirements.map((requirement)=>{
    const jsonTypes=Array.isArray(requirement.type)?[...requirement.type]:[requirement.type??"string"],nullable=jsonTypes.includes("null"),primary=jsonTypes.find((type)=>type!=="null")??"string";
    const control=nullable?"nullable":requirement.allowedValues?.length?"choice":primary==="number"||primary==="integer"?"number":primary==="boolean"?"boolean":primary==="object"?"object":primary==="array"?"array":"text";
    const constraints=Object.fromEntries(Object.entries({allowedValues:requirement.allowedValues,minimum:requirement.minimum,maximum:requirement.maximum,minItems:requirement.minItems,maxItems:requirement.maxItems,pattern:requirement.pattern,itemType:requirement.itemType,additionalProperties:requirement.additionalProperties}).filter(([,value])=>value!==undefined));
    return{path:requirement.path,control,jsonTypes,required:requirement.required===true,active:requirement.active!==false,depth:Math.max(0,pathParts(requirement.path).length-1),constraints,...(requirement.description?{description:requirement.description}:{}),...(requirement.explanation?{explanation:requirement.explanation}:{}),...(requirement.example!==undefined?{example:requirement.example}:{}),...(requirement.origin?{origin:requirement.origin}:{}),...(valueAtPath(input,requirement.path)!==undefined?{value:valueAtPath(input,requirement.path)}:{})};
  });
}

export function guidedInputWithValue(input:Record<string,unknown>,path:string,value:unknown):Record<string,unknown>{
  const next=structuredClone(input),parts=pathParts(path);
  let cursor:Record<string,unknown>|unknown[]=next;
  parts.forEach((part,index)=>{
    const key:ArrayIndexOrKey=/^\d+$/.test(part)?Number(part):part;
    if(index===parts.length-1){(cursor as any)[key]=structuredClone(value);return;}
    const following=parts[index+1]!,current=(cursor as any)[key];
    if(!current||typeof current!=="object")(cursor as any)[key]=/^\d+$/.test(following)?[]:{};
    cursor=(cursor as any)[key];
  });
  return next;
}
type ArrayIndexOrKey=number|string;
export function guidedArrayMove(input:Record<string,unknown>,path:string,from:number,to:number):Record<string,unknown>{
  const current=valueAtPath(input,path);
  if(!Array.isArray(current)||from<0||from>=current.length)return structuredClone(input);
  const moved=[...current],entry=moved.splice(from,1)[0];
  moved.splice(Math.max(0,Math.min(to,moved.length)),0,entry);
  return guidedInputWithValue(input,path,moved);
}
export interface GuidedInputIssue{path:string;code:"required"|"type"|"enum"|"minimum"|"maximum"|"minItems"|"maxItems"|"pattern";message:string}
const observedType=(value:unknown):string=>value===null?"null":Array.isArray(value)?"array":typeof value;
const concretePaths=(input:Record<string,unknown>,pattern:string):{path:string;value:unknown}[]=>{
  const parts=pathParts(pattern),visit=(current:unknown,index:number,resolved:string[]):{path:string;value:unknown}[]=>{
    if(index===parts.length)return[{path:`/${resolved.join("/")}`,value:current}];
    const part=parts[index]!;
    if(part==="*"){if(!Array.isArray(current))return[];return current.flatMap((entry,at)=>visit(entry,index+1,[...resolved,String(at)]));}
    return visit(current&&typeof current==="object"?(current as Record<string,unknown>)[part]:undefined,index+1,[...resolved,part]);
  };
  return visit(input,0,[]);
};
export function validateGuidedInput(controls:readonly GuidedInputControl[],input:Record<string,unknown>):GuidedInputIssue[]{
  const issues:GuidedInputIssue[]=[];
  for(const control of controls){
    if(!control.active)continue;
    const values=concretePaths(input,control.path);
    if(!values.length&&control.path.includes("*"))continue;
    for(const {path,value} of values){
      const add=(code:GuidedInputIssue["code"],message:string)=>issues.push({path,code,message});
      if(value===undefined||value===""){if(control.required)add("required","Enter a required value.");continue;}
      const type=observedType(value);
      if(!control.jsonTypes.includes(type)&&!(type==="number"&&control.jsonTypes.includes("integer")&&Number.isInteger(value))){add("type",`Enter ${control.jsonTypes.join(" or ")}.`);continue;}
      const allowed=control.constraints.allowedValues as unknown[]|undefined;
      if(allowed&&!allowed.some((candidate)=>Object.is(candidate,value)))add("enum",`Choose ${allowed.map(String).join(" or ")}.`);
      if(typeof value==="number"&&typeof control.constraints.minimum==="number"&&value<control.constraints.minimum)add("minimum",`Enter at least ${control.constraints.minimum}.`);
      if(typeof value==="number"&&typeof control.constraints.maximum==="number"&&value>control.constraints.maximum)add("maximum",`Enter at most ${control.constraints.maximum}.`);
      if(Array.isArray(value)&&typeof control.constraints.minItems==="number"&&value.length<control.constraints.minItems)add("minItems",`Add at least ${control.constraints.minItems} item(s).`);
      if(Array.isArray(value)&&typeof control.constraints.maxItems==="number"&&value.length>control.constraints.maxItems)add("maxItems",`Keep at most ${control.constraints.maxItems} item(s).`);
      if(typeof value==="string"&&typeof control.constraints.pattern==="string"){
        try{if(!new RegExp(control.constraints.pattern).test(value))add("pattern",`Match ${control.constraints.pattern}.`);}catch{add("pattern","The configured pattern is invalid.");}
      }
    }
  }
  return issues;
}

const equal=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
export function compareGuidedTestCase(testCase:GuidedTestCase):GuidedTestCase{
  const expected=testCase.reviewedExpectations??{},actual=testCase.actualResult;
  if(!Object.keys(testCase.input??{}).length||!Object.keys(expected).length||!actual)return{...testCase,status:"Blocked",differences:[]};
  if(testCase.evaluatorRevision&&testCase.evaluatorRevision!==actual.evaluatorRevision)return{...testCase,status:"Stale",differences:[]};
  const differences=Object.entries(expected).flatMap(([field,value])=>equal(value,actual[field])?[]:[{field,expected:value,actual:actual[field]}]);
  return{...testCase,status:differences.length?"Mismatched":"Matched",differences};
}

export async function saveAndRunGuidedTestCase(options:{
  testCase:GuidedTestCase;
  save:(testCase:GuidedTestCase)=>Promise<GuidedTestCase>;
  evaluatePage:(testCase:GuidedTestCase)=>Promise<Omit<GuidedTestCaseResult,"evaluatorRevision">&{evaluatorRevision?:string}>;
  evaluateEvent:(testCase:GuidedTestCase)=>Promise<Omit<GuidedTestCaseResult,"evaluatorRevision">&{evaluatorRevision?:string}>;
}):Promise<GuidedTestCase>{
  const saved=await options.save(structuredClone(options.testCase));
  const evaluation=saved.testType==="page-context"?await options.evaluatePage(saved):await options.evaluateEvent(saved);
  const actualResult={...evaluation,evaluatorRevision:evaluation.evaluatorRevision??"current"} as GuidedTestCaseResult;
  return compareGuidedTestCase({...saved,actualResult,evaluatorRevision:actualResult.evaluatorRevision});
}

export function guidedTestCaseFinding(testCase:GuidedTestCase):{code:string;message:string;entityId:string;field:string;severity:"warning"}|undefined{
  if(testCase.status==="Matched")return undefined;
  const repair=testCase.status==="Blocked"?"complete its guided input and reviewed expectations":testCase.status==="Stale"?"rerun it against the current Draft":`Review ${testCase.differences.map(({field})=>field).join(", ")}.`;
  return{code:`test-case-${testCase.status.toLowerCase()}`,message:`Test case ${testCase.name} is ${testCase.status}. ${repair}`,entityId:testCase.id,field:`collections.fixtures/${testCase.id}/reviewedExpectations`,severity:"warning"};
}
