import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";

import {
  createDeterministicBaselineAdmission,
  deterministicBaselineDispositionValid,
  validateDeterministicBaselineAdmissionReceipt,
} from "../../scripts/verification-policy/reliability/baseline-evidence-admission.mjs";
import {executeAcceptancePlan} from "../../scripts/verification-execution/execute.mjs";
import {createReviewReadyRecord} from "../../scripts/settled-final-verification-review.mjs";
import {createRecordDeterministicBaselineProof} from
  "../../scripts/verification-policy/reliability/baseline-evidence-store-operation.mjs";
import {boundedClosureContractRevision} from
  "../../scripts/verification-reliability-closure.mjs";
import {authenticateBaselineDiagnosticPair,canonicalBaselineDiagnostic} from
  "../../scripts/verification-policy/reliability/baseline-diagnostic-authentication.mjs";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";
import {invalidFeatureResolutionNeedsFreshDeferral,recoverInvalidFeatureResolution} from
  "../../scripts/verification-policy/reliability/invalid-checkpoint-resolution-recovery.mjs";
import {eligibleDeferredIncident} from
  "../../scripts/verification-reliability-store.mjs";
import {eligibleRepairAdmissionCandidates,eligibleTerminalDeferred} from
  "../../scripts/verification-policy/reliability/run-intent.mjs";
import {repairPlanningOptions} from
  "../../scripts/verification-policy/reliability/repair-checkpoint-admission.mjs";

const sha=(value)=>value.repeat(64);
const commit=(value)=>value.repeat(40);
const timestamp="2026-09-19T09:00:00.000Z";
const invalidFeatureResolution = {
  id:"incident-invalid-feature-resolution", state:"resolved", failureDigest:sha("a"),
  repairCheckpoint:{status:"claimed",runId:"invalid-run",claimedAt:timestamp},
  resolution:{checkpoint:{commit:commit("0"),tree:commit("1"),runId:"invalid-run",
    packIds:["shell","verification_process"],receiptPath:"tmp/invalid.json",
    receiptSha256:sha("2"),status:"passed",reusedTaskCount:0},
  package:{status:"passed",path:"build/package/my-chrome-utilities.zip",
    receiptPath:"tmp/package.json",receiptSha256:sha("3"),digest:sha("4")},
  archive:{checkpointReceipt:"incident.checkpoint-receipt",
    packageReceipt:"incident.package-receipt",packageZip:"incident.package-zip"},
  resolvedAt:"2026-09-19T09:01:00.000Z",digest:sha("5")},
  transitions:[{type:"resolved",at:"2026-09-19T09:01:00.000Z",resolutionDigest:sha("5")}],
};
const recoveredFeatureResolution=recoverInvalidFeatureResolution(invalidFeatureResolution,{
  checkpointCommit:commit("0"),packIds:["shell","verification_process"],
  correctedAt:"2026-09-19T09:02:00.000Z"});
assert.equal(recoveredFeatureResolution.state,"unresolved");
assert.equal(recoveredFeatureResolution.resolution,undefined);
assert.deepEqual(recoveredFeatureResolution.invalidResolutionCorrection.priorResolution,
  invalidFeatureResolution.resolution);
assert.equal(recoveredFeatureResolution.transitions.at(-1).type,
  "invalid-feature-resolution-corrected");
const correctedEligibleRepair={...recoveredFeatureResolution,repair:{status:"eligible"},
  terminalVerificationDeferred:{status:"terminal-verification-deferred",
    recordedAt:"2026-09-19T09:01:30.000Z"}};
assert.equal(invalidFeatureResolutionNeedsFreshDeferral(correctedEligibleRepair),true);
assert.equal(eligibleTerminalDeferred(correctedEligibleRepair),false);
assert.equal(eligibleDeferredIncident(correctedEligibleRepair),false,
  "a pre-correction deferral cannot hide a recovered blocker from evidence gates");
assert.deepEqual(eligibleRepairAdmissionCandidates([correctedEligibleRepair]),
  [correctedEligibleRepair],"a recovered blocker returns to focused admission");
const freshlyDeferredRepair={...correctedEligibleRepair,terminalVerificationDeferred:{
  ...correctedEligibleRepair.terminalVerificationDeferred,
  recordedAt:"2026-09-19T09:03:00.000Z",
  invalidFeatureResolutionCorrectionDigest:
    correctedEligibleRepair.invalidResolutionCorrection.digest,
  eligibleRepairAdmissions:{entries:[{incidentId:correctedEligibleRepair.id,
    failureDigest:correctedEligibleRepair.failureDigest}]}}};
assert.equal(invalidFeatureResolutionNeedsFreshDeferral(freshlyDeferredRepair),false);
assert.equal(eligibleTerminalDeferred(freshlyDeferredRepair),true);
assert.equal(eligibleDeferredIncident(freshlyDeferredRepair),true,
  "a post-correction atomic deferral is idempotently admissible");
assert.throws(()=>recoverInvalidFeatureResolution(invalidFeatureResolution,{
  checkpointCommit:commit("0"),packIds:["shell"],correctedAt:"2026-09-19T09:02:00.000Z"}),
/does not exactly match/u);
const repairPlanningInput={changeSet:{commit:"candidate"},excludedChangedPaths:["existing"]};
const repairPlanningStore={blocking:async()=>[{
  repair:{status:"eligible",changedPaths:["repair-path"]}}]};
assert.equal(await repairPlanningOptions({options:repairPlanningInput,candidateCommit:"candidate",
  store:repairPlanningStore,terminalCheckpoint:false}),repairPlanningInput);
assert.deepEqual((await repairPlanningOptions({options:repairPlanningInput,candidateCommit:"candidate",
  store:repairPlanningStore,terminalCheckpoint:true})).excludedChangedPaths,["repair-path"]);
const source=(name,digest)=>({path:`tmp/verification-receipts/${name}.json`,sha256:digest,
  authenticatedSha256:digest});
const relevantInputs={contractRevision:boundedClosureContractRevision,
  task:{key:"acceptance-session:verification_process"},
  transitiveCode:{complete:true,paths:["scripts/check.mjs"],digest:sha("1")},
  featureInputs:{complete:true,paths:[],digest:sha("2")},
  handlerInputs:{complete:true,paths:["handlers/project_management.clj"],digest:sha("3")},
  generatedInputs:{complete:true,paths:[],digest:sha("4")},
  productArtifact:{digest:sha("5")},runnerSemantics:{digest:sha("6")},
  prerequisiteSemantics:{digest:sha("7")},environment:{node:"24.19.0"},
  toolchain:{node:"24.19.0"},limits:{timeoutMs:600000}};
const diagnosticTask={key:"acceptance-session:verification_process",stage:"acceptance-session",
  packId:"verification_process",executable:"bb",args:["acceptance-pack-runner"],target:null,
  environment:null,requiredCapabilities:[]};
const diagnostic=({revision,tree,path})=>({version:1,runIntent:"baseline-diagnostic",
  commit:revision,tree,toolchainDigest:sha("a"),checkKey:"acceptance-session:verification_process",
  task:diagnosticTask,taskDigest:timeoutIncidentDigest(diagnosticTask),
  relevantInputs,
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
  ...input.candidateReceipt,relevantInputs:{...relevantInputs,
    handlerInputs:{complete:true,digest:sha("8")}},
}}),/unchanged inputs/u);
assert.throws(()=>createDeterministicBaselineAdmission({...input,
  baseSource:{...input.baseSource,authenticatedSha256:sha("0")}}),/authenticated diagnostic/u);

const git=(...args)=>execFileSync("git",args,{encoding:"utf8"}).trim();
const gitBytes=(...args)=>execFileSync("git",args);
const repositoryCandidate=git("rev-parse","HEAD^{commit}");
const repositoryBase=repositoryCandidate;
const executedFailureDigest=sha("c");
const authenticatedReceipt=async(revision)=>{
  const seed={commit:revision,checkKey:"acceptance-session:verification_process",
    toolchainDigest:timeoutIncidentDigest(gitBytes("show",`${revision}:swarmforge/toolchain.lock.json`))};
  const canonical=await canonicalBaselineDiagnostic(process.cwd(),seed);
  return {...diagnostic({revision,tree:git("rev-parse",`${revision}^{tree}`)}),...seed,
    tree:git("rev-parse",`${revision}^{tree}`),task:canonical.task,taskDigest:canonical.taskDigest,
    relevantInputs:canonical.relevantInputs,
    result:{status:"failed",failureDigest:executedFailureDigest}};
};
const authenticatedBase=await authenticatedReceipt(repositoryBase);
const authenticatedCandidate=await authenticatedReceipt(repositoryCandidate);
let executedTask;
let executedPreparation;
await authenticateBaselineDiagnosticPair({root:process.cwd(),
  baseDocument:{receipt:authenticatedBase},candidateDocument:{receipt:authenticatedCandidate},
  execute:async(_root,_commit,canonical)=>{executedTask=canonical.task;
    executedPreparation=canonical.preparationTasks;
    return {status:"failed",failureDigest:executedFailureDigest};}});
assert.deepEqual(executedTask,authenticatedCandidate.task);
assert.ok(executedPreparation.some(({stage})=>stage==="build"));
assert.ok(executedPreparation.some(({stage})=>stage==="acceptance-parse"));
assert.ok(executedPreparation.some(({stage})=>stage==="acceptance-generate"));
await assert.rejects(authenticateBaselineDiagnosticPair({root:process.cwd(),
  baseDocument:{receipt:authenticatedBase},candidateDocument:{receipt:{...authenticatedCandidate,
    tree:commit("0")}},execute:async()=>({status:"failed",failureDigest:executedFailureDigest})}),
  /exact repository trees/u);
for(const task of [
  {...authenticatedCandidate.task,executable:"node"},
  {...authenticatedCandidate.task,args:[...authenticatedCandidate.task.args,"--changed"]},
  {...authenticatedCandidate.task,environment:{FORGED:"1"}},
]) {
  await assert.rejects(authenticateBaselineDiagnosticPair({root:process.cwd(),
    baseDocument:{receipt:authenticatedBase},candidateDocument:{receipt:{...authenticatedCandidate,task}},
    execute:async()=>({status:"failed",failureDigest:executedFailureDigest})}),
  /canonical task identity changed/u);
}
await assert.rejects(authenticateBaselineDiagnosticPair({root:process.cwd(),
  baseDocument:{receipt:authenticatedBase},candidateDocument:{receipt:{...authenticatedCandidate,
    taskDigest:sha("0")}},execute:async()=>({status:"failed",failureDigest:executedFailureDigest})}),
  /canonical task identity changed/u);
const omittedInputs=structuredClone(authenticatedCandidate.relevantInputs);
omittedInputs.featureInputs.paths.pop();
await assert.rejects(authenticateBaselineDiagnosticPair({root:process.cwd(),
  baseDocument:{receipt:authenticatedBase},candidateDocument:{receipt:{...authenticatedCandidate,
    relevantInputs:omittedInputs}},execute:async()=>({status:"failed",failureDigest:executedFailureDigest})}),
  /relevant input closure is incomplete/u);

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
  runCommand:async(_display,task,control)=>{attempted.push(task.key);
    if(task.key===input.selectedTaskKey){await control.onManifestedFailure();
      throw new Error("same baseline failure");}},
});
assert.deepEqual(attempted,[input.selectedTaskKey,"acceptance-session:next","package:extension"],
  "an admitted failure does not cancel independent selected work or package proof");
let stored={id:input.incidentId,state:"unresolved",failureDigest:input.failureDigest,transitions:[]};
const recordProof=createRecordDeterministicBaselineProof({read:async()=>structuredClone(stored),
  update:async(_id,operation)=>{stored=await operation(structuredClone(stored));return stored;},
  now:()=>timestamp,authenticate:async()=>true});
await recordProof(input.incidentId,{binding:{...input,baseReceipt:undefined,
  candidateReceipt:undefined,baseSource:undefined,candidateSource:undefined},
  baseReceipt:input.baseReceipt,candidateReceipt:input.candidateReceipt,
  baseSource:input.baseSource,candidateSource:input.candidateSource});
assert.equal(stored.deterministicBaselineProof.status,"eligible");
assert.equal(stored.transitions.at(-1).type,"deterministic-baseline-classified");

console.log("deterministic baseline evidence contract passed");
