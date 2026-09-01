import assert from "node:assert/strict";

import {validateAggregateChildren} from
  "../../scripts/verification-bootstrap/aggregate.mjs";
import {validateBootstrapAuthority} from
  "../../scripts/verification-bootstrap/authority.mjs";
import {validateBootstrapEligibility} from
  "../../scripts/verification-bootstrap/eligibility.mjs";
import {executeBootstrapPlan} from
  "../../scripts/verification-bootstrap/executor.mjs";
import {runTargetedMutationCheck} from
  "../../scripts/verification-bootstrap/mutation.mjs";
import {canonicalBootstrapPlan,compareBootstrapPlans} from
  "../../scripts/verification-bootstrap/plan.mjs";
import {createBootstrapReceipt,validateBootstrapReceipt} from
  "../../scripts/verification-bootstrap/receipt.mjs";
import {createReviewBootstrapReceipt} from
  "../../scripts/verification-bootstrap/receipt.mjs";
import {recoverBootstrapRun} from
  "../../scripts/verification-bootstrap/recovery.mjs";
import {validateSyntheticStageFixtures} from
  "../../scripts/verification-bootstrap/synthetic.mjs";
import {compareProjectedBootstrapPlans,projectBootstrapPlan} from
  "../../scripts/verification-bootstrap/transition-plan.mjs";
import {createReviewReadyRecord,validateReviewReadyRecord} from
  "../../scripts/settled-final-verification-review.mjs";
import {bootstrapPlan,stageFixtureTasks} from "./fixtures.mjs";

const plan=canonicalBootstrapPlan(bootstrapPlan());
assert.equal(validateSyntheticStageFixtures(stageFixtureTasks).stages.length,9);
assert.equal(plan.tasks.length,7);
assert.deepEqual(plan.packIds,["verification_process"]);
assert.deepEqual(plan.sliceIds,["process_fast_path_bootstrap"]);
assert.throws(()=>canonicalBootstrapPlan(bootstrapPlan({
  tasks:[...plan.tasks,{...plan.tasks[0]}],
})),/task identity/u);
assert.throws(()=>canonicalBootstrapPlan(bootstrapPlan({
  tasks:stageFixtureTasks,
})),/product or browser task/u);

assert.deepEqual(compareBootstrapPlans(plan,structuredClone(plan)).taskKeys,
  plan.tasks.map(({key})=>key));
assert.throws(()=>compareBootstrapPlans(plan,bootstrapPlan({tasks:plan.tasks.slice(1)})),
  /plan mismatch.*unit:bootstrap/u);

for (const [field,value,pattern] of [
  ["forecastMs",300_001,/five-minute forecast/u],
  ["parentFallback",true,/parent-pack fallback/u],
  ["packIds",["verification_process","shell"],/process-only/u],
]) {
  assert.throws(()=>validateBootstrapEligibility({...plan,[field]:value}),pattern);
}
assert.equal(validateBootstrapEligibility(plan).launchEligible,true);

let launches=0;
const executed=await executeBootstrapPlan(plan,{runTask:async(task)=>{
  launches+=1;
  return {key:task.key,status:"passed",identity:task};
}});
assert.equal(launches,plan.tasks.length);
assert.equal(new Set(executed.map(({key})=>key)).size,executed.length);
await assert.rejects(()=>executeBootstrapPlan({...plan,tasks:[...plan.tasks,plan.tasks[0]]},{
  runTask:async()=>{ launches+=1; },
}),/task identity/u);

let childLaunches=0;
const children=plan.tasks.slice(0,2).map((task)=>({key:task.key,status:"passed",identity:task}));
assert.equal(validateAggregateChildren(plan.tasks.slice(0,2),children).length,2);
assert.equal(childLaunches,0);
assert.throws(()=>validateAggregateChildren(plan.tasks.slice(0,2),children.slice(1)),/missing/u);
assert.throws(()=>validateAggregateChildren(plan.tasks.slice(0,2),[...children,children[0]]),/duplicate/u);
assert.throws(()=>validateAggregateChildren(plan.tasks.slice(0,2),[
  {...children[0],status:"failed"},children[1],
]),/failed/u);

let mutationCommands=0;
assert.deepEqual(await runTargetedMutationCheck({mutants:[],targetCommand:["bb","test"]},{
  runCommand:async()=>{ mutationCommands+=1; },
}),{status:"passed",mutantCount:0,commandStarted:false});
assert.equal(mutationCommands,0);
assert.equal((await runTargetedMutationCheck({mutants:[{id:"m1"}],targetCommand:["bb","test"]},{
  runCommand:async(command)=>{ mutationCommands+=1;assert.deepEqual(command,["bb","test"]); },
})).commandStarted,true);
assert.equal(mutationCommands,1);
await assert.rejects(()=>runTargetedMutationCheck({mutants:[{}],targetCommand:[]},{
  runCommand:async()=>{},
}),/target-specific/u);

const runIdentity={candidateCommit:plan.candidateCommit,candidateTree:plan.candidateTree,
  planDigest:"f".repeat(64),toolchainDigest:plan.toolchainDigest,task:plan.task,incidentIds:[]};
for (const [status,action] of [["running","attach"],["completed","use-receipt"],["failed","report-failure"]]) {
  assert.equal(recoverBootstrapRun({...runIdentity,status},runIdentity).action,action);
}
assert.throws(()=>recoverBootstrapRun({...runIdentity,status:"running"},{...runIdentity,
  candidateTree:"0".repeat(40)}),/identity changed/u);

const receipt=createBootstrapReceipt(plan,executed);
assert.equal(validateBootstrapReceipt(receipt,plan).status,"passed");
assert.throws(()=>validateBootstrapReceipt({...receipt,candidateTree:"0".repeat(40)},plan),
  /receipt identity/u);
assert.throws(()=>validateBootstrapReceipt({...receipt,taskResults:receipt.taskResults.slice(1)},plan),
  /task results/u);

const reviewReceipt=createReviewBootstrapReceipt({plan,taskResults:executed,runId:"run-1",
  startedAt:"2026-09-01T00:00:00.000Z",completedAt:"2026-09-01T00:00:01.000Z"});
const changeSet={version:1,baseCommit:plan.baseCommit,commit:plan.candidateCommit,
  paths:[],entries:[]};
const record=createReviewReadyRecord({task:plan.task,baseCommit:plan.baseCommit,
  candidateCommit:plan.candidateCommit,candidateTree:plan.candidateTree,changeSet,
  receipt:reviewReceipt,receiptPath:"tmp/verification-receipts/bootstrap.json",
  receiptSha256:"1".repeat(64),recordedAt:"2026-09-01T00:00:02.000Z"});
assert.equal(record.processFastPathBootstrap.planDigest,plan.planDigest);
assert.equal(validateReviewReadyRecord(record,{task:plan.task,baseCommit:plan.baseCommit,
  candidateCommit:plan.candidateCommit,candidateTree:plan.candidateTree}),true);
assert.throws(()=>createReviewReadyRecord({task:plan.task,baseCommit:plan.baseCommit,
  candidateCommit:plan.candidateCommit,candidateTree:plan.candidateTree,changeSet,
  receipt:{...reviewReceipt,processFastPathBootstrap:{...reviewReceipt.processFastPathBootstrap,
    parentFallback:true}},receiptPath:"tmp/verification-receipts/bootstrap.json",
  receiptSha256:"1".repeat(64)}),/fast-path bootstrap binding/u);

assert.equal(validateBootstrapAuthority({task:plan.task,baseCommit:plan.baseCommit,
  acceptedCandidate:null},plan).active,true);
assert.throws(()=>validateBootstrapAuthority({task:plan.task,baseCommit:plan.baseCommit,
  acceptedCandidate:plan.candidateCommit},plan),/expired/u);
assert.throws(()=>validateBootstrapAuthority({task:"different",baseCommit:plan.baseCommit,
  acceptedCandidate:null},plan),/authority identity/u);

const transitionInput={candidateCommit:"2".repeat(40),candidateTree:"3".repeat(40),
  toolchainDigest:"4".repeat(64),changedPaths:[
    "scripts/verification-bootstrap/runner.mjs",
    "test/verification-bootstrap/bootstrap-fast-path-test.mjs",
    "acceptance/src/acceptance/bootstrap_session.clj",
    "acceptance/src/acceptance/verification_support/bootstrap_fast_path_handlers.clj",
    "scripts/settled-final-verification-review.mjs",
  ]};
const transitionPlan=projectBootstrapPlan(transitionInput);
assert.equal(transitionPlan.forecastMs,55_000);
assert.equal(transitionPlan.changedPathProjection.length,transitionInput.changedPaths.length);
assert.equal(compareProjectedBootstrapPlans(transitionPlan,structuredClone(transitionPlan)).taskKeys.length,8);
assert.throws(()=>projectBootstrapPlan({...transitionInput,
  changedPaths:[...transitionInput.changedPaths,"src/product.ts"]}),/no transition owner/u);
assert.throws(()=>compareProjectedBootstrapPlans(transitionPlan,{...transitionPlan,
  propertyTaskKeys:["property:unexpected"]}),/propertyTaskKeys/u);

console.log("verification bootstrap fast-path contracts passed");
