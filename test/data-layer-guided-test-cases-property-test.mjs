import assert from "node:assert/strict";
import {
  compareGuidedTestCase,
  createGuidedTestCase,
  guidedArrayMove,
  guidedInputControls,
  guidedInputWithValue,
  saveAndRunGuidedTestCase,
  validateGuidedInput,
} from "../dist/data-layer-guided-test-cases.js";

let seed=0x71c4a5e;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};
for(let example=0;example<200;example+=1){
  const minimum=1+Math.floor(random()*5),maximum=minimum+1+Math.floor(random()*10);
  const entered=minimum+Math.floor(random()*(maximum-minimum+1));
  const payload={order:{id:`A-${example}`},products:[{id:example+1},{id:example+2}],amount:entered};
  const source={kind:"generated",id:`source:${example}`,revision:`revision:${example}`,payload};
  const testCase=createGuidedTestCase({name:`Case ${example}`,testType:example%2?"event-validation":"page-context",source,id:(kind)=>`${kind}:${example}`});
  payload.order.id="mutated";
  assert.equal(testCase.input.order.id,`A-${example}`,"source snapshots are deeply immutable");

  const controls=guidedInputControls([
    {path:"/order",type:"object",required:true},
    {path:"/order/id",type:"string",required:true,pattern:"^A-[0-9]+$"},
    {path:"/products",type:"array",required:true,minItems:2,itemType:"object"},
    {path:"/products/*/id",type:"integer",required:true,minimum:1},
    {path:"/amount",type:"number",required:true,minimum,maximum},
  ],testCase.input);
  assert.deepEqual(validateGuidedInput(controls,testCase.input),[]);
  const updated=guidedInputWithValue(testCase.input,"/products/1/id",example+20);
  assert.equal(updated.products[1].id,example+20);
  assert.equal(testCase.input.products[1].id,example+2,"nested edits do not mutate the prior Draft");
  const reordered=guidedArrayMove(updated,"/products",1,0);
  assert.equal(reordered.products[0].id,example+20);
  assert.equal(updated.products[0].id,example+1,"array reorder preserves the prior order");

  const expected={outcome:example%3?"Valid":"Invalid",issues:[]};
  const actual={...expected,evaluatorRevision:`evaluator:${example}`};
  const matched=compareGuidedTestCase({...testCase,input:reordered,reviewedExpectations:expected,actualResult:actual,evaluatorRevision:actual.evaluatorRevision});
  assert.equal(matched.status,"Matched");
  assert.equal(compareGuidedTestCase({...matched,evaluatorRevision:`evaluator:${example+1}`}).status,"Stale");
  assert.deepEqual(compareGuidedTestCase({...matched,evaluatorRevision:`evaluator:${example+1}`}).actualResult,actual);

  const calls=[];
  const executed=await saveAndRunGuidedTestCase({
    testCase:{...testCase,input:reordered,reviewedExpectations:expected},
    save:async(candidate)=>{calls.push("save");return structuredClone(candidate);},
    evaluatePage:async()=>{calls.push("page");return actual;},
    evaluateEvent:async()=>{calls.push("event");return actual;},
  });
  assert.deepEqual(calls,["save",testCase.testType==="page-context"?"page":"event"]);
  assert.equal(executed.status,"Matched");
}

console.log("guided Test case properties: 200 generated cases passed");
