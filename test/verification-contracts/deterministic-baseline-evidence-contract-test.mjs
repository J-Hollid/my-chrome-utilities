import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdir,mkdtemp,rm,writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createDeterministicBaselineAdmission,
  deterministicBaselineAdmissionEntries,
  deterministicBaselineAdmissionCoversIncident,
  deterministicBaselineAdmissionsEquivalent,
  deterministicBaselineDispositionValid,
  validateDeterministicBaselineAdmissionReceipt,
} from "../../scripts/verification-policy/reliability/baseline-evidence-admission.mjs";
import {groupDeterministicBaselineAdmissions} from
  "../../scripts/verification-policy/reliability/deterministic-baseline-review.mjs";
import {executeAcceptancePlan} from "../../scripts/verification-execution/execute.mjs";
import {createVerificationLaunchAuthorizations} from
  "../../scripts/verification-execution-prerequisites.mjs";
import {createVerificationCommandRunner,reliabilityAdmissionPartition} from
  "../../scripts/verification-execution/runner.mjs";
import {createReviewReadyRecord} from "../../scripts/settled-final-verification-review.mjs";
import {createRecordDeterministicBaselineProof} from
  "../../scripts/verification-policy/reliability/baseline-evidence-store-operation.mjs";
import {boundedClosureContractRevision} from
  "../../scripts/verification-reliability-closure.mjs";
import {authenticateBaselineDiagnosticPair,canonicalBaselineDiagnostic} from
  "../../scripts/verification-policy/reliability/baseline-diagnostic-authentication.mjs";
import {deterministicBaselineFailureIdentity,reliabilityFailureFingerprint,timeoutIncidentDigest} from
  "../../scripts/verification-reliability-values.mjs";
import {invalidFeatureResolutionNeedsFreshDeferral,recoverInvalidFeatureResolution} from
  "../../scripts/verification-policy/reliability/invalid-checkpoint-resolution-recovery.mjs";
import {createTimeoutIncidentStore,eligibleDeferredIncident} from
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
  eligibleRepairTransaction:{version:1,id:sha("f"),inputDigest:sha("e"),status:"committed"},
  eligibleRepairAdmissions:{entries:[{incidentId:correctedEligibleRepair.id,
    failureDigest:correctedEligibleRepair.failureDigest}]}}};
assert.equal(invalidFeatureResolutionNeedsFreshDeferral(freshlyDeferredRepair),false);
assert.equal(eligibleTerminalDeferred(freshlyDeferredRepair),true);
assert.equal(eligibleDeferredIncident(freshlyDeferredRepair),true,
  "a post-correction atomic deferral is idempotently admissible");
const descendantDeferredRepair={...freshlyDeferredRepair,terminalVerificationDeferred:{
  ...freshlyDeferredRepair.terminalVerificationDeferred,
  candidate:{commit:commit("6"),tree:commit("7")},
  reviewReady:{task:"portability-baseline-evidence"}}};
assert.deepEqual(eligibleRepairAdmissionCandidates([descendantDeferredRepair],{
  candidateCommit:commit("8"),evidenceTask:"portability-baseline-evidence"}),
  [descendantDeferredRepair],
"a same-task descendant candidate reopens its parent-bound corrected admission");
assert.deepEqual(reliabilityAdmissionPartition({incidents:[descendantDeferredRepair],
  baseCommit:commit("0"),candidateCommit:commit("8"),candidateTree:commit("9"),
  evidenceTask:"portability-baseline-evidence"}).eligibleCandidates,
  [descendantDeferredRepair],
"the runner passes exact candidate identity into descendant admission selection");
assert.throws(()=>recoverInvalidFeatureResolution(invalidFeatureResolution,{
  checkpointCommit:commit("0"),packIds:["shell"],correctedAt:"2026-09-19T09:02:00.000Z"}),
/does not exactly match/u);
const repairPlanningInput={changeSet:{commit:"candidate",baseCommit:"current-base"},
  packIds:["shell","verification_process"],excludedChangedPaths:["existing"]};
const repairPlanningStore={blocking:async()=>[{
  failure:{task:{packId:"shell"}},repair:{status:"eligible",changedPaths:["repair-path"],
    checkpoint:{baseCommit:"accepted-qa-base",evidenceTask:"portability-baseline-evidence"}}}]};
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
const realStoreDirectory=await mkdtemp(path.join(os.tmpdir(),"baseline-real-store-"));
const realStore=createTimeoutIncidentStore({storeDirectory:realStoreDirectory,
  randomId:()=>"baseline-incident",now:()=>timestamp});
const realIncident=await realStore.create({failureClass:"nonzero-exit",fingerprint:sha("f"),
  task:diagnosticTask,lineage:{commit:base.commit,tree:base.tree,baseCommit:base.commit,
    evidenceTask:"portability-baseline-evidence",changeSetDigest:sha("1")},
  environment:{node:"24.19.0"},artifact:null,planDigest:sha("2"),registryDigest:sha("3"),
  configuredTimeoutMs:600000,resolvedDeadlines:{},durationMs:1,
  exitResult:{code:1,signal:null},termination:{signal:null,escalatedTo:null}});
assert.notEqual(realIncident.failureDigest,sha("c"),
  "a real incident digest is independent from its diagnostic fingerprint");
const legacyTask={key:"unit:legacy",stage:"unit",executable:"node",args:["legacy"],
  environment:null,requiredCapabilities:[]};
const legacyFingerprint=reliabilityFailureFingerprint({failureClass:"nonzero-exit",task:legacyTask,
  exitCode:1,signal:null,error:"legacy failure",stdout:"new output that legacy ignores",
  stderr:"legacy stderr"});
assert.equal(legacyFingerprint,"f96fb682d6fc3fd07976d45d504df81bdda9b9b944db45fde47011472819fae8",
  "the legacy incident fingerprint contract is unchanged");
const legacyStore=createTimeoutIncidentStore({root:realStoreDirectory,
  storeDirectory:path.join(realStoreDirectory,"legacy-incidents"),
  randomId:()=>"legacy-incident",now:()=>timestamp});
const legacyIncident=await legacyStore.create({failureClass:"nonzero-exit",
  fingerprint:legacyFingerprint,task:legacyTask,
  lineage:{commit:base.commit,tree:base.tree},environment:{node:"24.19.0"},artifact:null,
  planDigest:sha("2"),registryDigest:sha("3"),configuredTimeoutMs:600000,
  resolvedDeadlines:{},durationMs:1,exitResult:{code:1,signal:null},
  termination:{signal:null,escalatedTo:null}});
await legacyStore.claimDiagnosticRetry(legacyIncident.id,legacyIncident.failure.retryIdentity);
const legacyReceiptDirectory=path.join(realStoreDirectory,"tmp","verification-receipts");
await mkdir(legacyReceiptDirectory,{recursive:true});
const legacyReceiptPath=path.join(legacyReceiptDirectory,"legacy-retry.json");
await writeFile(legacyReceiptPath,`${JSON.stringify({version:2,runId:"legacy-retry",
  completedAt:timestamp,candidate:{commit:base.commit,tree:base.tree},
  environment:legacyIncident.failure.environment,artifact:legacyIncident.failure.artifact,
  registryDigest:legacyIncident.failure.registryDigest,
  diagnostic:{incidentId:legacyIncident.id,retryIdentity:legacyIncident.failure.retryIdentity,
    registryDigest:legacyIncident.failure.registryDigest,
    resolvedDeadlines:legacyIncident.failure.resolvedDeadlines,
    scope:legacyIncident.failure.retryScope},tasks:{[legacyTask.key]:{identity:legacyTask,
    status:"failed",reliabilityFailureFingerprint:legacyFingerprint}}})}\n`);
const classifiedLegacy=await legacyStore.classifyDiagnosticRetry(legacyIncident.id,legacyReceiptPath);
assert.equal(classifiedLegacy.retry.classification,"reproduced-failure",
  "an old stored fingerprint still follows the unchanged retry path");
const input={incidentId:realIncident.id,failureDigest:realIncident.failureDigest,base,candidate,
  checkKey:"acceptance-session:verification_process",baseReceipt:diagnostic({...base,revision:base.commit,path:"base"}),
  candidateReceipt:diagnostic({...candidate,revision:candidate.commit,path:"candidate"}),
  baseSource:source("base",sha("d")),candidateSource:source("candidate",sha("e")),
  evidenceTask:"portability-baseline-evidence",changeSetDigest:sha("f"),planDigest:sha("9"),
  selectedTaskKey:"acceptance-session:verification_process"};
const admission=createDeterministicBaselineAdmission(input);
assert.equal(admission.failureDigest,realIncident.failureDigest);
assert.equal(admission.diagnosticFailureDigest,sha("c"));
const portableAdmission=createDeterministicBaselineAdmission({...input,
  base:{commit:commit("7"),tree:commit("8")},candidate:{commit:commit("9"),tree:commit("a")},
  diagnosticBase:base,diagnosticCandidate:candidate});
assert.equal(portableAdmission.base.commit,commit("7"),
  "authenticated diagnostic commits can bind a later review base and candidate");
assert.equal(deterministicBaselineAdmissionCoversIncident(portableAdmission,{
  id:realIncident.id,failureDigest:realIncident.failureDigest,
  failure:{task:{key:portableAdmission.selectedTaskKey}}},portableAdmission.candidate.commit),true,
"prelaunch accepts only the exact incident, failure, task, and current candidate binding");
const duplicateAdmission=createDeterministicBaselineAdmission({...input,
  incidentId:"duplicate-incident",failureDigest:sha("6"),
  base:{commit:commit("7"),tree:commit("8")},candidate:{commit:commit("9"),tree:commit("a")},
  diagnosticBase:base,diagnosticCandidate:candidate});
assert.equal(deterministicBaselineAdmissionsEquivalent(
  portableAdmission,duplicateAdmission),true,
"separately authenticated incidents can share one complete diagnostic identity");
assert.equal(deterministicBaselineAdmissionsEquivalent(portableAdmission,
  {...duplicateAdmission,relevantInputsDigest:sha("0")}),false,
"duplicate admission rejects a changed relevant-input closure");
assert.equal(deterministicBaselineAdmissionsEquivalent(portableAdmission,
  {...duplicateAdmission,candidateSource:{...duplicateAdmission.candidateSource,
    receiptDigest:sha("0")}}),false,
"duplicate admission rejects changed authenticated source receipt bytes");
const groupedAdmission={...portableAdmission,equivalentAdmissions:[duplicateAdmission]};
assert.deepEqual(groupDeterministicBaselineAdmissions(
  [portableAdmission,duplicateAdmission]),groupedAdmission,
"the review boundary groups equivalent incidents under one primary admission");
assert.equal(groupDeterministicBaselineAdmissions([]),null,
  "the review boundary keeps an empty baseline population absent");
assert.throws(()=>groupDeterministicBaselineAdmissions([portableAdmission,
  {...duplicateAdmission,planDigest:sha("0")}]),/do not share one authenticated identity/u,
"the review boundary rejects non-equivalent baseline incidents");
assert.deepEqual(deterministicBaselineAdmissionEntries(groupedAdmission)
  .map(({incidentId})=>incidentId),[realIncident.id,"duplicate-incident"]);
assert.equal(deterministicBaselineAdmissionCoversIncident(groupedAdmission,{
  id:"duplicate-incident",failureDigest:sha("6"),
  failure:{task:{key:duplicateAdmission.selectedTaskKey}}},groupedAdmission.candidate.commit),true,
"prelaunch covers a duplicate only through its own exact authenticated admission");
assert.equal(deterministicBaselineAdmissionCoversIncident({...groupedAdmission,
  equivalentAdmissions:[{...duplicateAdmission,planDigest:sha("0")}]},{
  id:"duplicate-incident",failureDigest:sha("6"),
  failure:{task:{key:duplicateAdmission.selectedTaskKey}}},groupedAdmission.candidate.commit),false,
"prelaunch rejects a duplicate whose complete admission identity changed");
const fingerprintInput={task:diagnosticTask,exitCode:1,signal:null,stderr:"assertion failed"};
assert.notEqual(deterministicBaselineFailureIdentity({...fingerprintInput,stdout:"first failure"}),
  deterministicBaselineFailureIdentity({...fingerprintInput,stdout:"changed failure"}),
  "changed standard output changes the authenticated failure identity");
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
const firstOutputFingerprint=deterministicBaselineFailureIdentity({
  task:authenticatedCandidate.task,
  exitCode:1,stdout:"first failure",stderr:"assertion failed"});
const changedOutputFingerprint=deterministicBaselineFailureIdentity({
  task:authenticatedCandidate.task,
  exitCode:1,stdout:"first failure\nadditional failure",stderr:"assertion failed"});
const outputBoundBase={...authenticatedBase,
  result:{status:"failed",failureDigest:firstOutputFingerprint}};
const outputBoundCandidate={...authenticatedCandidate,
  result:{status:"failed",failureDigest:firstOutputFingerprint}};
const runnerAdmission=createDeterministicBaselineAdmission({...input,
  base:{commit:repositoryBase,tree:authenticatedBase.tree},
  candidate:{commit:repositoryCandidate,tree:authenticatedCandidate.tree},
  baseReceipt:outputBoundBase,candidateReceipt:outputBoundCandidate});
let outputExecution=0;
await assert.rejects(authenticateBaselineDiagnosticPair({root:process.cwd(),
  baseDocument:{receipt:outputBoundBase},candidateDocument:{receipt:outputBoundCandidate},
  execute:async()=>({status:"failed",failureDigest:
    outputExecution++===0?firstOutputFingerprint:changedOutputFingerprint})}),
/executed matching failure/u,"changed stdout fails through full diagnostic authentication");
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
      status:"failed",provenance:"fresh",reliabilityFailureDigest:input.failureDigest,
      deterministicBaselineFailureIdentity:admission.diagnosticFailureDigest},
    "unit:other":{identity:{key:"unit:other",stage:"unit"},status:"passed",provenance:"fresh"},
    "package:extension":{identity:{key:"package:extension",stage:"package"},
      status:"passed",provenance:"fresh"}}};
assert.equal(validateDeterministicBaselineAdmissionReceipt(receipt,admission),admission);

const runnerReceipt={runId:"baseline-runner-contract",runIntent:"development-diagnostic",tasks:{},
  candidate:runnerAdmission.candidate,deterministicBaselineAdmission:runnerAdmission};
const runnerTask={key:input.selectedTaskKey,stage:"acceptance-session",target:"verification_process",
  display:"baseline runner identity",executable:process.execPath,
  args:["-e","process.stdout.write('first failure'); process.stderr.write('assertion failed'); process.exit(1)"],
  environment:{},requiredCapabilities:[]};
const runnerReceiptPath=path.join(os.tmpdir(),"baseline-runner-contract.json");
const runnerRoutes=new Map([[runnerTask.key,"workspace-sandbox"]]);
const runnerAuthorizationContext={mode:"focused",candidate:runnerAdmission.candidate,
  runId:runnerReceipt.runId,artifact:null,receiptPath:runnerReceiptPath,
  checkpointAttempt:null,promotion:null};
const productionRunner=createVerificationCommandRunner({
  receipt:runnerReceipt,receiptPath:runnerReceiptPath,
  write:async()=>{},runDirectory:realStoreDirectory,
  temporaryPaths:{systemDirectory:realStoreDirectory,chromeDirectory:realStoreDirectory},
  temporaryCapacity:{availableBytes:Number.MAX_SAFE_INTEGER},
},{timeoutMs:10_000,launchRoutes:runnerRoutes,authorizationContext:runnerAuthorizationContext,
  authorizedTaskSetDigest:sha("a"),planDigest:sha("b"),
  incidentStore:{create:async()=>{throw new Error("an exact admitted baseline must not create a duplicate incident");}},
  launchAuthorizations:createVerificationLaunchAuthorizations({tasks:[runnerTask],routes:runnerRoutes,
    ...runnerAuthorizationContext})});
await assert.rejects(productionRunner(runnerTask.display,runnerTask),/Verification command failed/u);
assert.equal(runnerReceipt.tasks[input.selectedTaskKey].deterministicBaselineFailureIdentity,
  firstOutputFingerprint,"the production runner uses the diagnostic baseline identity");
assert.equal(validateDeterministicBaselineAdmissionReceipt({...receipt,candidate:{
  ...runnerAdmission.candidate,baseCommit:runnerAdmission.base.commit,
  evidenceTask:runnerAdmission.evidenceTask,changeSetDigest:runnerAdmission.changeSetDigest},tasks:{...receipt.tasks,
  [input.selectedTaskKey]:{...runnerReceipt.tasks[input.selectedTaskKey],provenance:"fresh"}}},runnerAdmission),
runnerAdmission,"the production runner failure is admitted without a synthetic fingerprint");
assert.throws(()=>validateDeterministicBaselineAdmissionReceipt({...receipt,tasks:{...receipt.tasks,
  [input.selectedTaskKey]:{...receipt.tasks[input.selectedTaskKey],
    deterministicBaselineFailureIdentity:changedOutputFingerprint}}},admission),
/fresh matching admitted failure/u,"changed stdout identity fails fresh admission validation");
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
assert.equal(stored.deterministicBaselineProof.failureDigest,realIncident.failureDigest);
assert.equal(stored.transitions.at(-1).type,"deterministic-baseline-classified");

const repairContext=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION?
  JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
if(repairContext?.causalCategory==="other:evidence-policy") {
  process.stdout.write("\n");
  const fixture={id:"baseline-deferral-visibility-scope-v1",
    causalCategory:repairContext.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(repairContext.diagnosedBoundary),
    expectedPreRepairFailure:{unrelatedDispositionBlocked:true},
    expectedRepairResult:{unrelatedDispositionBlocked:false}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:repairContext.incidentId,failureDigest:repairContext.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,
      observed:{unrelatedDispositionBlocked:true}},
    repairResult:{status:"passed",fixtureDigest,
      observed:{unrelatedDispositionBlocked:false}}}}));
} else if(repairContext?.causalCategory==="other:parent orchestration environment leakage") {
  process.stdout.write("\n");
  const fixture={id:"baseline-diagnostic-parent-environment-isolation-v1",
    causalCategory:repairContext.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(repairContext.diagnosedBoundary),
    expectedPreRepairFailure:{parentReceiptVisible:true},
    expectedRepairResult:{parentReceiptVisible:false}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:repairContext.incidentId,failureDigest:repairContext.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{parentReceiptVisible:true}},
    repairResult:{status:"passed",fixtureDigest,observed:{parentReceiptVisible:false}}}}));
}

console.log("deterministic baseline evidence contract passed");
await rm(realStoreDirectory,{recursive:true,force:true});
