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
  return{
    id:input.id("fixture"),
    name:input.name.trim(),
    testType:input.testType,
    ...(input.eventId??source.eventId?{eventId:input.eventId??source.eventId}:{}),
    ...(input.pageId??source.pageId?{pageId:input.pageId??source.pageId}:{}),
    input:structuredClone(source.payload??{}),
    inputGuidance:{...(source.schemaId?{schemaId:String(source.schemaId)}:{}),...(source.schemaRevision?{revision:String(source.schemaRevision)}:{}),kind:"authoring-guidance"},
    sourceProvenance:{kind:source.kind,id:source.id,revision:source.revision},
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
  constraints:Record<string,unknown>;
  description?:string;
  example?:unknown;
  origin?:string;
  value?:unknown;
}
type GuidedRequirement=Requirement&{minimum?:number;maximum?:number;example?:unknown;type?:string|readonly string[]};
const valueAtPath=(value:Record<string,unknown>,path:string):unknown=>path.split("/").filter(Boolean).reduce<unknown>((current,key)=>current&&typeof current==="object"?(current as Record<string,unknown>)[key]:undefined,value);
export function guidedInputControls(requirements:readonly GuidedRequirement[],input:Record<string,unknown>):GuidedInputControl[]{
  return requirements.map((requirement)=>{
    const jsonTypes=Array.isArray(requirement.type)?[...requirement.type]:[requirement.type??"string"],nullable=jsonTypes.includes("null"),primary=jsonTypes.find((type)=>type!=="null")??"string";
    const control=nullable?"nullable":requirement.allowedValues?.length?"choice":primary==="number"||primary==="integer"?"number":primary==="boolean"?"boolean":primary==="object"?"object":primary==="array"?"array":"text";
    const constraints=Object.fromEntries(Object.entries({allowedValues:requirement.allowedValues,minimum:requirement.minimum,maximum:requirement.maximum}).filter(([,value])=>value!==undefined));
    return{path:requirement.path,control,jsonTypes,required:requirement.required===true,constraints,...(requirement.description?{description:requirement.description}:{}),...(requirement.example!==undefined?{example:requirement.example}:{}),...(requirement.origin?{origin:requirement.origin}:{}),...(valueAtPath(input,requirement.path)!==undefined?{value:valueAtPath(input,requirement.path)}:{})};
  });
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
