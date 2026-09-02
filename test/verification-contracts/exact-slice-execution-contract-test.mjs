import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

import {validateExactSliceAggregate,validateExactSliceLaunch,
  validateExactSliceReceiptAggregate} from
  "../../scripts/verification-execution/exact-slice-control.mjs";
import {loadVerificationPacks,planVerification} from "../../scripts/verification-packs.mjs";
import {canonicalEvidencePlanMode,canonicalPlanIncludesProperties,changedSinceFocusedExecutionPlan,
  selectFocusedVerificationTasks} from
  "../../scripts/verification-execution/runner.mjs";
import {bindExactSliceSuccessorPlan,exactSliceSuccessorBase,exactSliceSuccessorClosureTaskKeys,
  exactSliceSuccessorFocusedTaskKeys,
  exactSliceSuccessorTask,validateExactSliceSuccessor} from
  "../../scripts/verification-execution/exact-slice-successor.mjs";
import {verificationPolicyContracts} from "../../scripts/verification-policy/contracts.mjs";

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
assert.equal(canonicalPlanIncludesProperties(exactSliceSuccessorTask,false),true,
  "the fixed successor catalogue retains its required property identity");
assert.equal(canonicalPlanIncludesProperties("other-task",false),false);
const boundChangedPlan=changedSinceFocusedExecutionPlan(packs,{
  packIds:["verification_process"],includeProperties:true,focusedTaskKeys:[],
},plan,{changedSince:exactSliceSuccessorBase,evidenceTask:exactSliceSuccessorTask});
assert.deepEqual(new Set(boundChangedPlan.tasks.map(({key})=>key)),
  new Set(exactSliceSuccessorClosureTaskKeys.filter((key)=>key!=="package:extension")),
  "the fixed successor executes only its authenticated process slice");
assert.equal(boundChangedPlan.sessionTasks[0].target,
  "features/verification-process-exact-slice-execution.feature",
  "the fixed successor does not restore the broad aggregate acceptance session");
assert.deepEqual(boundChangedPlan.selectedVerificationSlices,plan.selectedVerificationSlices,
  "the fixed successor binds selected slices before broad changed-path planning");
assert.deepEqual(boundChangedPlan.selectedVerificationSliceTaskKeys,
  plan.selectedVerificationSliceTaskKeys,
  "the fixed successor binds exact selected-slice task identities");
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

const successorPlan=selectFocusedVerificationTasks(boundChangedPlan,
  exactSliceSuccessorFocusedTaskKeys,parentPlan);
const reboundSuccessor=bindExactSliceSuccessorPlan({...successorPlan,
  packIds:["shell","verification_process"],parentPackSliceFallbacks:["shell"]});
assert.deepEqual(reboundSuccessor.packIds,["shell","verification_process"]);
assert.deepEqual(reboundSuccessor.requestedPackIds,["shell","verification_process"]);
assert.deepEqual(reboundSuccessor.claimPackIds,["shell","verification_process"],
  "the fixed successor makes exact prerequisite and process claims");
assert.deepEqual(reboundSuccessor.selectedVerificationSlices.shell,
  ["swarmforge-handoff-control"]);
assert.deepEqual(reboundSuccessor.parentPackSliceFallbacks,[]);
assert.deepEqual(new Set(Object.values(reboundSuccessor.selectedVerificationSliceTaskKeys).flat()),
  new Set(exactSliceSuccessorClosureTaskKeys.filter((key)=>
    !["build:dist","package:extension"].includes(key))));
assert.equal(validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:exactSliceSuccessorBase,plan:reboundSuccessor}).active,true);
assert.equal(canonicalEvidencePlanMode({task:exactSliceSuccessorTask,
  baseCommit:exactSliceSuccessorBase,plan:reboundSuccessor}),true,
  "checkpoint evidence accepts only the validated fixed successor closure");
assert.equal(canonicalEvidencePlanMode({task:"other-task",
  baseCommit:exactSliceSuccessorBase,plan:successorPlan}),false);
assert.throws(()=>validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:"0".repeat(40),plan:successorPlan}),/approved QA authority/u);
assert.throws(()=>validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:exactSliceSuccessorBase,acceptedCandidate:true,plan:successorPlan}),/expired on QA/u);

const conservation=JSON.parse(await readFile(
  "test/fixtures/verification-process-contract-conservation.json","utf8"));
const splitContracts=verificationPolicyContracts.filter(({testPaths})=>testPaths.length>1);
assert.deepEqual(conservation.ownerTransitions?.map(({fromOwner})=>fromOwner).sort(),
  splitContracts.map(({testPath})=>testPath).sort(),
  "Phase 2 authenticates exactly the six aggregate owners");
for(const contract of splitContracts){
  const transition=conservation.ownerTransitions.find(({fromOwner})=>
    fromOwner===contract.testPath);
  assert.deepEqual(transition.toOwners,[...contract.testPaths],
    `${contract.id} transitions to its exact declared child owners`);
  assert.deepEqual(transition.authority,{
    commit:"4aea38cdf4899dc0a606215cc106ab743533c2fa",
    path:"features/verification-process-exact-slice-execution.feature",
    scenario:"Verification process exact slice execution 009",
  },`${contract.id} uses the approved Phase 2 owner authority`);
}

console.log("verification process exact-slice execution contracts passed");
