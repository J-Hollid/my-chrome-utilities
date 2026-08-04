import assert from "node:assert/strict";
import {
  compareGuidedTestCase,
  createGuidedTestCase,
  guidedArrayMove,
  guidedInputControls,
  guidedInputWithValue,
  guidedTestCaseFinding,
  guidedTestCaseTypeOptions,
  saveAndRunGuidedTestCase,
  validateGuidedInput,
} from "../dist/data-layer-guided-test-cases.js";
import {
  addCanonicalProperty,
  canonicalRequirements,
  createCanonicalSchema,
  setCanonicalProperty,
} from "../dist/data-layer-canonical-schema.js";

const ids=(kind)=>`${kind}:1`;
assert.deepEqual(guidedTestCaseTypeOptions(),[
  {
    value:"page-context",
    label:"Page context test",
    purpose:"Property Set applicability and Page validation",
    scope:"one production Page",
    evaluation:"production Page effective-schema evaluation",
  },
  {
    value:"event-validation",
    label:"Event validation test",
    purpose:"Assignment routing and Event validation",
    scope:"one production Event and optional Page",
    evaluation:"production Assignment and schema evaluation",
  },
]);

const source={
  kind:"event-library",
  id:"library:purchase",
  revision:"revision:7",
  eventId:"event:purchase",
  destination:"dataLayer",
  payload:{market:"retail",value:7,accepted:false},
  schemaId:"schema:purchase",
};
const created=createGuidedTestCase({
  name:"Purchase confirmation",
  testType:"event-validation",
  eventId:"event:purchase",
  source,
  id:ids,
});
source.payload.value=99;
assert.equal(created.id,"fixture:1");
assert.equal(created.testType,"event-validation");
assert.deepEqual(created.input,{market:"retail",value:7,accepted:false});
assert.deepEqual(created.sourceProvenance,{
  kind:"event-library",
  id:"library:purchase",
  revision:"revision:7",
});
assert.equal(created.inputGuidance.schemaId,"schema:purchase");
assert.deepEqual(created.sourceSnapshot,{
  eventId:"event:purchase",
  destination:"dataLayer",
  schemaId:"schema:purchase",
});
assert.equal(created.status,"Blocked");
assert.equal("releasePolicy" in created,false);

const controls=guidedInputControls([
  {path:"/market",type:"string",required:true,allowedValues:["retail","trade"],description:"Selling market",example:"retail",origin:"Retail"},
  {path:"/value",type:"number",minimum:1,maximum:10},
  {path:"/accepted",type:"boolean"},
  {path:"/order",type:"object",required:true},
  {path:"/products",type:"array"},
  {path:"/campaign",type:["string","null"]},
],created.input);
assert.deepEqual(controls.map(({path,control,jsonTypes})=>({path,control,jsonTypes})),[
  {path:"/market",control:"choice",jsonTypes:["string"]},
  {path:"/value",control:"number",jsonTypes:["number"]},
  {path:"/accepted",control:"boolean",jsonTypes:["boolean"]},
  {path:"/order",control:"object",jsonTypes:["object"]},
  {path:"/products",control:"array",jsonTypes:["array"]},
  {path:"/campaign",control:"nullable",jsonTypes:["string","null"]},
]);
assert.equal(controls[0].description,"Selling market");
assert.equal(controls[0].origin,"Retail");

let canonicalGuidance=createCanonicalSchema({id:"schema:guidance",contributorId:"profile:guidance",contributorName:"Guidance"});
let facetSequence=0;const facetId=(kind)=>`${kind}:facet:${++facetSequence}`;
canonicalGuidance=addCanonicalProperty(canonicalGuidance,{baseRevision:0,name:"campaign",type:"string",id:facetId}).document;
canonicalGuidance=setCanonicalProperty(canonicalGuidance,{baseRevision:canonicalGuidance.revision,propertyId:canonicalGuidance.selectedPropertyId,patch:{nullable:true}}).document;
canonicalGuidance=addCanonicalProperty(canonicalGuidance,{baseRevision:canonicalGuidance.revision,name:"closed",type:"object",id:facetId}).document;
canonicalGuidance=setCanonicalProperty(canonicalGuidance,{baseRevision:canonicalGuidance.revision,propertyId:canonicalGuidance.selectedPropertyId,patch:{onlyDefinedFields:true}}).document;
assert.deepEqual(canonicalRequirements(canonicalGuidance).map(({path,type,nullable,additionalProperties})=>({path,type,nullable,additionalProperties})),[
  {path:"/campaign",type:"string",nullable:true,additionalProperties:undefined},
  {path:"/closed",type:"object",nullable:undefined,additionalProperties:false},
]);

const recursiveControls=guidedInputControls([
  {path:"/order",type:"object",required:true,description:"Order details"},
  {path:"/order/id",type:"string",required:true,pattern:"^[A-Z]-[0-9]+$"},
  {path:"/products",type:"array",required:true,minItems:1,itemType:"object"},
  {path:"/products/*/id",type:"integer",required:true,minimum:1},
  {path:"/campaign",type:["string","null"]},
  {path:"/trade_reference",type:"string",required:true,active:false,explanation:"Required only for trade"},
],{order:{id:"A-1"},products:[{id:1},{id:2}],campaign:null});
assert.deepEqual(
  recursiveControls.map(({path,control,depth,active})=>({path,control,depth,active})),
  [
    {path:"/order",control:"object",depth:0,active:true},
    {path:"/order/id",control:"text",depth:1,active:true},
    {path:"/products",control:"array",depth:0,active:true},
    {path:"/products/*/id",control:"number",depth:2,active:true},
    {path:"/campaign",control:"nullable",depth:0,active:true},
    {path:"/trade_reference",control:"text",depth:0,active:false},
  ],
);
const nestedInput=guidedInputWithValue(
  {order:{id:"A-1"},products:[{id:1},{id:2}],campaign:null},
  "/products/1/id",
  7,
);
assert.deepEqual(nestedInput.products,[{id:1},{id:7}]);
assert.deepEqual(guidedArrayMove(nestedInput,"/products",1,0).products,[{id:7},{id:1}]);
assert.deepEqual(validateGuidedInput(recursiveControls,nestedInput),[]);
assert.deepEqual(
  validateGuidedInput(recursiveControls,{order:{id:"bad"},products:[{id:0}],campaign:null})
    .map(({path,code})=>({path,code})),
  [{path:"/order/id",code:"pattern"},{path:"/products/0/id",code:"minimum"}],
);
assert.equal(validateGuidedInput(recursiveControls,{order:{},products:[]})
  .some(({path,code})=>path==="/order/id"&&code==="required"),true);
assert.equal(validateGuidedInput(recursiveControls,{order:{id:"A-1"},products:[{id:1}]})
  .some(({path})=>path==="/trade_reference"),false,"inactive conditional fields do not block");

const calls=[];
const executed=await saveAndRunGuidedTestCase({
  testCase:{...created,input:{market:"trade"},reviewedExpectations:{winner:"assignment:trade",outcome:"Invalid",issues:[{path:"/value",code:"required"}]}},
  save:async(testCase)=>{calls.push(["save",structuredClone(testCase.input)]);return{...testCase,draftToken:"draft:2"};},
  evaluatePage:async()=>{calls.push(["page"]);return{};},
  evaluateEvent:async(testCase)=>{calls.push(["event",testCase.draftToken]);return{winner:"assignment:trade",outcome:"Invalid",issues:[{path:"/value",code:"required"}],evaluatorRevision:"evaluator:3"};},
});
assert.deepEqual(calls,[["save",{market:"trade"}],["event","draft:2"]]);
assert.equal(executed.status,"Matched");
assert.equal(executed.actualResult.outcome,"Invalid");

const mismatched=compareGuidedTestCase({
  ...executed,
  reviewedExpectations:{winner:"assignment:retail",outcome:"Invalid",issues:[{path:"/value",code:"required"}]},
});
assert.equal(mismatched.status,"Mismatched");
assert.deepEqual(mismatched.differences.map(({field})=>field),["winner"]);
assert.equal(compareGuidedTestCase({...executed,evaluatorRevision:"evaluator:4"}).status,"Stale");
const stale=compareGuidedTestCase({...executed,evaluatorRevision:"evaluator:4"});
assert.deepEqual(stale.actualResult,executed.actualResult,"stale derivation retains superseded actual evidence");
assert.deepEqual(stale.reviewedExpectations,executed.reviewedExpectations,"stale derivation retains reviewed evidence");
assert.equal(compareGuidedTestCase({...created,input:{},reviewedExpectations:{}}).status,"Blocked");

let evaluatorCalls=0;
await assert.rejects(
  saveAndRunGuidedTestCase({
    testCase:{...created,input:{market:"trade"},reviewedExpectations:{outcome:"Valid"}},
    save:async()=>{throw new Error("quota");},
    evaluatePage:async()=>{evaluatorCalls+=1;return{};},
    evaluateEvent:async()=>{evaluatorCalls+=1;return{};},
  }),
  /quota/,
);
assert.equal(evaluatorCalls,0,"a failed save cannot invoke either evaluator");

assert.deepEqual(guidedTestCaseFinding(mismatched),{
  code:"test-case-mismatched",
  message:"Test case Purchase confirmation is Mismatched. Review winner.",
  entityId:"fixture:1",
  field:"collections.fixtures/fixture:1/reviewedExpectations",
  severity:"warning",
});
assert.equal(guidedTestCaseFinding(executed),undefined);

console.log("data-layer guided test cases tests passed");
console.log(JSON.stringify({guidedTestCaseModel:{
  model001:created.status==="Blocked"&&!("releasePolicy" in created),
  model002:guidedTestCaseTypeOptions().length===2,
  model003:guidedTestCaseTypeOptions().every(({value})=>value!=="journey"),
  model004:created.sourceSnapshot.destination==="dataLayer"&&created.input.value===7,
  model005:created.sourceProvenance.kind==="event-library",
  model006:controls.every(({path,jsonTypes})=>path.startsWith("/")&&jsonTypes.length>0),
  model007:recursiveControls.some(({control})=>control==="object")&&recursiveControls.some(({control})=>control==="array"),
  model008:recursiveControls.some(({active})=>!active),
  model009:created.inputGuidance.kind==="authoring-guidance",
  model010:created.inputGuidance.schemaId==="schema:purchase",
  model011:calls[0][0]==="save"&&evaluatorCalls===0,
  model012:Object.keys(executed.reviewedExpectations).length>0,
  model013:executed.status==="Matched"&&executed.actualResult.outcome==="Invalid",
  model014:mismatched.status==="Mismatched"&&stale.status==="Stale",
  model015:guidedTestCaseFinding(mismatched).severity==="warning",
  model016:validateGuidedInput(recursiveControls,nestedInput).length===0,
}}));
