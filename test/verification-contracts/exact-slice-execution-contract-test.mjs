import assert from "node:assert/strict";

import {validateExactSliceAggregate,validateExactSliceLaunch,
  validateExactSliceReceiptAggregate} from
  "../../scripts/verification-execution/exact-slice-control.mjs";
import {loadVerificationPacks,planVerification} from "../../scripts/verification-packs.mjs";
import {selectFocusedVerificationTasks} from
  "../../scripts/verification-execution/runner.mjs";
import {exactSliceSuccessorBase,exactSliceSuccessorFocusedTaskKeys,
  exactSliceSuccessorTask,validateExactSliceSuccessor} from
  "../../scripts/verification-execution/exact-slice-successor.mjs";

const task=(key,stage="unit")=>({key,stage,executable:"node",args:[`${key}.mjs`],
  requiredCapabilities:[]});
const selected=[task("build:dist","build"),task("unit:child"),task("package:extension","package")];
const plan={tasks:selected,packIds:["verification_process"],
  selectedVerificationSlices:{verification_process:["task_batching"]},
  selectedVerificationSliceTaskKeys:{verification_process:["unit:child"]},
  parentPackSliceFallbacks:[],verificationSliceDiagnostics:[],
  verificationSliceConservation:{verification_process:{completeTaskKeys:["unit:child"],
    sliceTaskKeys:["unit:child"],remainderTaskKeys:[],conserved:true}}};

assert.deepEqual(validateExactSliceLaunch(plan,{forecastMs:20_000,masterMode:false}),{
  taskKeys:selected.map(({key})=>key),sliceIds:["task_batching"],forecastMs:20_000,
});
for (const [change,pattern] of [
  [{parentPackSliceFallbacks:["verification_process"]},/parent-pack fallback/u],
  [{verificationSliceDiagnostics:["missing declaration"]},/slice diagnostics/u],
  [{tasks:[...selected,selected[1]]},/duplicate task/u],
]) assert.throws(()=>validateExactSliceLaunch({...plan,...change},{forecastMs:20_000}),pattern);
assert.throws(()=>validateExactSliceLaunch(plan,{forecastMs:300_001}),/five-minute forecast/u);
assert.throws(()=>validateExactSliceLaunch({...plan,verificationSliceConservation:{
  verification_process:{...plan.verificationSliceConservation.verification_process,
    remainderTaskKeys:["unit:unowned"]}}},{forecastMs:20_000,masterMode:true}),
  /parent closure.*slice union/u);

const results=selected.map((identity)=>({key:identity.key,status:"passed",identity}));
assert.equal(validateExactSliceAggregate(selected,results).length,selected.length);
assert.throws(()=>validateExactSliceAggregate(selected,results.slice(1)),/missing child/u);
assert.throws(()=>validateExactSliceAggregate(selected,[...results,results[0]]),/duplicate child/u);
assert.throws(()=>validateExactSliceAggregate(selected,results.map((result,index)=>index?result:{
  ...result,status:"failed"})),/failed child/u);
assert.throws(()=>validateExactSliceAggregate(selected,results.map((result,index)=>index?result:{
  ...result,identity:{...result.identity,args:["changed.mjs"]}})),/changed child/u);
assert.equal(validateExactSliceReceiptAggregate({tasks:selected},Object.fromEntries(results.map(
  ({key,...result})=>[key,result]))).length,selected.length);
assert.throws(()=>validateExactSliceReceiptAggregate({tasks:selected},{
  [selected[0].key]:results[0],
}),/missing child/u);

const packs=await loadVerificationPacks();
const impactPlan=planVerification(packs,{changedPaths:[
  "scripts/verification-execution/exact-slice-control.mjs",
]});
assert.deepEqual(impactPlan.selectedVerificationSlices,{verification_process:["task_batching"]});
assert.ok(impactPlan.tasks.some(({key})=>
  key==="unit:test/verification-contracts/exact-slice-execution-contract-test.mjs"));
assert.ok(!impactPlan.tasks.some(({key})=>
  key==="unit:test/verification-contracts/reliability-prerequisite-contract-test.mjs"));
assert.equal(impactPlan.sessionTasks.length,1);
assert.equal(impactPlan.sessionTasks[0].target,
  "features/verification-process-exact-slice-execution.feature");
assert.ok(!impactPlan.sessionTasks[0].args.some((value)=>
  value.includes("modular-verification-packs")));
validateExactSliceLaunch(impactPlan,{forecastMs:20_000});

const parentPlan=planVerification(packs,{packIds:["verification_process"],includeProperties:true});
assert.deepEqual(parentPlan.verificationSliceConservation.verification_process.remainderTaskKeys,[]);
validateExactSliceLaunch(parentPlan,{forecastMs:200_000,masterMode:true});

const successorPlan=selectFocusedVerificationTasks(impactPlan,
  exactSliceSuccessorFocusedTaskKeys,parentPlan);
assert.equal(validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:exactSliceSuccessorBase,plan:successorPlan}).active,true);
assert.throws(()=>validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:"0".repeat(40),plan:successorPlan}),/approved QA authority/u);
assert.throws(()=>validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:exactSliceSuccessorBase,acceptedCandidate:true,plan:successorPlan}),/expired on QA/u);

console.log("verification process exact-slice execution contracts passed");
