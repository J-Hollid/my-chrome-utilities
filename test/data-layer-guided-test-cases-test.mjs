import assert from "node:assert/strict";
import {
  compareGuidedTestCase,
  createGuidedTestCase,
  guidedInputControls,
  guidedTestCaseFinding,
  guidedTestCaseTypeOptions,
  saveAndRunGuidedTestCase,
} from "../dist/data-layer-guided-test-cases.js";

const ids=(kind)=>`${kind}:1`;
assert.deepEqual(guidedTestCaseTypeOptions(),[
  {
    value:"page-context",
    label:"Page context test",
    purpose:"Page Group applicability and Page validation",
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
assert.equal(compareGuidedTestCase({...created,input:{},reviewedExpectations:{}}).status,"Blocked");

assert.deepEqual(guidedTestCaseFinding(mismatched),{
  code:"test-case-mismatched",
  message:"Test case Purchase confirmation is Mismatched. Review winner.",
  entityId:"fixture:1",
  field:"collections.fixtures/fixture:1/reviewedExpectations",
  severity:"warning",
});
assert.equal(guidedTestCaseFinding(executed),undefined);

console.log("data-layer guided test cases tests passed");
