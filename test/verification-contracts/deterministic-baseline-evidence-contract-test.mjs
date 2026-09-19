import assert from "node:assert/strict";

import {
  createDeterministicBaselineAdmission,
  deterministicBaselineDispositionValid,
  validateDeterministicBaselineAdmissionReceipt,
} from "../../scripts/verification-policy/reliability/baseline-evidence-admission.mjs";
import {executeAcceptancePlan} from "../../scripts/verification-execution/execute.mjs";
import {createReviewReadyRecord} from "../../scripts/settled-final-verification-review.mjs";
import {createRecordDeterministicBaselineProof} from
  "../../scripts/verification-policy/reliability/baseline-evidence-store-operation.mjs";

const sha=(value)=>value.repeat(64);
const commit=(value)=>value.repeat(40);
const timestamp="2026-09-19T09:00:00.000Z";
const source=(name,digest)=>({path:`tmp/${name}.json`,sha256:digest,authenticatedSha256:digest});
const diagnostic=({revision,tree,path})=>({version:1,runIntent:"baseline-diagnostic",
  commit:revision,tree,toolchainDigest:sha("a"),checkKey:"acceptance-session:verification_process",
  relevantInputs:[{path:"handlers/project_management.clj",digest:sha("b")}],
  result:{status:"failed",failureDigest:sha("c")},startedAt:timestamp,completedAt:timestamp});
const base={commit:commit("1"),tree:commit("2")};
const candidate={commit:commit("3"),tree:commit("4")};
const input={incidentId:"baseline-incident",failureDigest:sha("c"),base,candidate,
  checkKey:"acceptance-session:verification_process",baseReceipt:diagnostic({...base,revision:base.commit,path:"base"}),
  candidateReceipt:diagnostic({...candidate,revision:candidate.commit,path:"candidate"}),
  baseSource:source("base",sha("d")),candidateSource:source("candidate",sha("e")),
  evidenceTask:"portability-baseline-evidence",changeSetDigest:sha("f"),planDigest:sha("9"),
  selectedTaskKey:"acceptance-session:verification_process"};
const admission=createDeterministicBaselineAdmission(input);
assert.equal(admission.failureDigest,sha("c"));
assert.throws(()=>createDeterministicBaselineAdmission({...input,candidateReceipt:{
  ...input.candidateReceipt,relevantInputs:[{path:"handlers/project_management.clj",digest:sha("8")}],
}}),/unchanged inputs/u);
assert.throws(()=>createDeterministicBaselineAdmission({...input,
  baseSource:{...input.baseSource,authenticatedSha256:sha("0")}}),/authenticated diagnostic/u);

const receipt={version:2,runIntent:"review-evidence",startedAt:timestamp,completedAt:timestamp,
  candidate:{...candidate,baseCommit:base.commit,evidenceTask:input.evidenceTask,
    changeSetDigest:input.changeSetDigest},plan:{taskPlanDigest:input.planDigest},tasks:{
    [input.selectedTaskKey]:{identity:{key:input.selectedTaskKey,stage:"acceptance-session"},
      status:"failed",provenance:"fresh",reliabilityFailureDigest:input.failureDigest},
    "unit:other":{identity:{key:"unit:other",stage:"unit"},status:"passed",provenance:"fresh"},
    "package:extension":{identity:{key:"package:extension",stage:"package"},
      status:"passed",provenance:"fresh"}}};
assert.equal(validateDeterministicBaselineAdmissionReceipt(receipt,admission),admission);
assert.throws(()=>validateDeterministicBaselineAdmissionReceipt({...receipt,tasks:{...receipt.tasks,
  "unit:other":{...receipt.tasks["unit:other"],status:"failed"}}},admission),/additional failure/u);
assert.throws(()=>validateDeterministicBaselineAdmissionReceipt({...receipt,completedAt:null},admission),
  /complete fresh review receipt/u);
assert.equal(deterministicBaselineDispositionValid({basis:"deterministic-baseline",
  failureDigest:admission.failureDigest,baselineAdmission:admission}),true);
const reviewReceipt={...receipt,runId:"baseline-review",plan:{...receipt.plan,
  changedPaths:["scripts/verification-policy/reliability/baseline-evidence-admission.mjs"],
  requestedPackIds:["verification_process"]},deterministicBaselineAdmission:admission};
const review=createReviewReadyRecord({task:input.evidenceTask,baseCommit:base.commit,
  candidateCommit:candidate.commit,candidateTree:candidate.tree,
  changeSet:{version:1,baseCommit:base.commit,commit:candidate.commit,
    paths:reviewReceipt.plan.changedPaths},receipt:reviewReceipt,
  receiptPath:"tmp/verification-receipts/baseline-review.json",receiptSha256:sha("7"),
  recordedAt:timestamp});
assert.equal(review.deterministicBaselineAdmissionDigest.length,64);

const attempted=[];
await executeAcceptancePlan({preparationTasks:[],unitTasks:[],propertyTasks:[],browserTasks:[],
  observationTasks:[],parserTasks:[],generatorTasks:[],checkpointTasks:[],unitCommands:[],
  parserCommands:[],sessionTasks:[
    {key:input.selectedTaskKey,stage:"acceptance-session",display:"baseline"},
    {key:"acceptance-session:next",stage:"acceptance-session",display:"next"}],
  packageTasks:[{key:"package:extension",stage:"package",display:"package"}]},{
  admittedFailureTaskKeys:[input.selectedTaskKey],concurrency:1,
  runCommand:async(_display,task)=>{attempted.push(task.key);
    if(task.key===input.selectedTaskKey)throw new Error("same baseline failure");},
});
assert.deepEqual(attempted,[input.selectedTaskKey,"acceptance-session:next","package:extension"],
  "an admitted failure does not cancel independent selected work or package proof");
let stored={id:input.incidentId,state:"unresolved",failureDigest:input.failureDigest,transitions:[]};
const recordProof=createRecordDeterministicBaselineProof({read:async()=>structuredClone(stored),
  update:async(_id,operation)=>{stored=await operation(structuredClone(stored));return stored;},
  now:()=>timestamp});
await recordProof(input.incidentId,{binding:{...input,baseReceipt:undefined,
  candidateReceipt:undefined,baseSource:undefined,candidateSource:undefined},
  baseReceipt:input.baseReceipt,candidateReceipt:input.candidateReceipt,
  baseSource:input.baseSource,candidateSource:input.candidateSource});
assert.equal(stored.deterministicBaselineProof.status,"eligible");
assert.equal(stored.transitions.at(-1).type,"deterministic-baseline-classified");

console.log("deterministic baseline evidence contract passed");
