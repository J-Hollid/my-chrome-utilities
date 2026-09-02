import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, chmod, copyFile, mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { acquireDistArtifactLock, distArtifactLeaseEnvironment, withDistArtifactLock } from "../../scripts/dist-artifact-lock.mjs";
import { decideBrowserObservationWorkers, deterministicBrowserWorkerSchedule } from "../../scripts/shared-artifact-parallel.mjs";
import { assertFreshDistArtifact, createDistInputFingerprint, writeDistArtifactManifest } from "../../scripts/dist-artifact.mjs";
import { removeVerificationFixtureRoot } from "../../scripts/verification-fixture-cleanup.mjs";
import { bindVerificationChangeScope, checkpointPreflight, createRepositoryCheckpointIdentityGuard, createVerificationCommandRunner, createVerificationReceiptContext, focusedAcceptanceOptions, runFocusedAcceptance, resumeVerificationPlan, validateCurrentArtifactForConsumers, verificationResumeIdentity } from "../../scripts/run-focused-acceptance.mjs";
import { verificationDigest } from "../../scripts/verification-evidence.mjs";
import { planVerification, verificationOwner, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { executeAcceptancePlan } from "../../scripts/verification-execution/execute.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
import { createTimeoutIncidentStore, timeoutIncidentDigest, timeoutRepairFocusedTaskPlan } from "../../scripts/verification-reliability-incidents.mjs";
import { requireVerificationRunIntent, runIntentBootstrapCoverage, validateRunIntentBootstrapBase, verificationRunIntent, verificationRunIntents } from "../../scripts/verification-run-intent.mjs";
import { classifyExecutionRestriction, consumeVerificationLaunchAuthorization, createVerificationLaunchAuthorizations, createVerificationParentExecutionContext, normalizeBrowserPrerequisiteTasks, preflightExecutionPrerequisites, probeExecutionPrerequisiteEnvironment, validateVerificationParentExecutionContext, verificationPrerequisiteKindRegistry, verificationRunnerModeRegistry, validateTaskExecutionPrerequisites } from "../../scripts/verification-execution-prerequisites.mjs";
import { checkpointAttemptInputIdentity, checkpointAttemptIdentity, createCheckpointAttemptStore } from "../../scripts/verification-checkpoint-attempt.mjs";
const prerequisiteTasks = [{ key:"browser-observation:known-loopback", stage:"browser-observation",
  executable:"node", args:["browser.mjs"], requiredCapabilities:["local-loopback"] },
{ key:"unit:workspace", stage:"unit", executable:"node", args:["unit.mjs"],
  requiredCapabilities:[] }];
const missingExecutableProbe = await probeExecutionPrerequisiteEnvironment([{
  key:"unit:missing-tool", stage:"unit", executable:"/definitely/missing-vtd014-tool",
  args:[], requiredCapabilities:[],
}], { outputCapacityProbe:async() => true });
const missingCapacityProbe = await probeExecutionPrerequisiteEnvironment(prerequisiteTasks, {
  executableProbe:async() => true, outputCapacityProbe:async() => false,
});
const executionContractRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-execution-contract-"));
let executionContractIncidentObserved = false;
try {
  let executionContractIncidentNumber = 0;
  const executionContractStore = createTimeoutIncidentStore({ root:executionContractRoot,
    storeDirectory:path.join(executionContractRoot, "incidents"),
    randomId:() => `contract-${++executionContractIncidentNumber}` });
  const executionContractIncident = await executionContractStore.create({
    lineage:{ commit:"a".repeat(40), tree:"b".repeat(40) }, task:prerequisiteTasks[1],
    failureClass:"execution-contract-failure", fingerprint:"c".repeat(64),
    failedBoundary:{ kind:"checkpoint-stage-identity", stage:"unit" },
  });
  assert.equal(executionContractIncident.failure.retryScope, undefined,
    "a tracked-file execution-contract drift cannot consume an unchanged retry");
  const promotionIdentity = verificationTaskIdentity({ key:"promotion:artifact-binding",
    stage:"promotion", executable:"internal", args:[], target:"artifact-binding" });
  const promotionContractIncident = await executionContractStore.create({
    lineage:{ commit:"a".repeat(40), tree:"b".repeat(40) }, task:promotionIdentity,
    failureClass:"execution-contract-failure", fingerprint:"e".repeat(64),
    failedBoundary:{ kind:"checkpoint-identity", operation:"artifact-binding" },
  });
  const promotionRegression = prerequisiteTasks[0];
  assert.deepEqual(timeoutRepairFocusedTaskPlan(promotionContractIncident, [],
    promotionRegression.key, [promotionRegression]), [{
    identity:Object.fromEntries(Object.entries(verificationTaskIdentity(promotionRegression))
      .filter(([, value]) => value !== null)),
    roles:["causal-regression", "diagnosed-boundary"],
  }], "an internal promotion failure is repaired through its canonical causal regression, not invented task succession");
  const environmentContractIncident = await executionContractStore.create({
    lineage:{ commit:"a".repeat(40), tree:"b".repeat(40) }, task:prerequisiteTasks[1],
    failureClass:"environment-contract-failure", fingerprint:"d".repeat(64),
    failedBoundary:{ kind:"capability-route", capability:"local-loopback" },
  });
  assert.deepEqual(environmentContractIncident.failure.retryScope, {
    kind:"task", taskKey:prerequisiteTasks[1].key,
    executionArgs:[...prerequisiteTasks[1].args],
  }, "an environment-contract failure retains the trusted task boundary needed for causal repair");
  executionContractIncidentObserved = executionContractIncident.failure.failureClass ===
    "execution-contract-failure";
} finally {
  await rm(executionContractRoot, { recursive:true, force:true });
}
const checkpointAttemptRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-attempt-contract-"));
let checkpointContractEvidence;
try {
  const attemptIdentity = checkpointAttemptIdentity({
    candidate:{ commit:"a".repeat(40), tree:"b".repeat(40) }, baseCommit:"c".repeat(40),
    evidenceTask:"vtd014", planDigest:"d".repeat(64), artifactInputDigest:"e".repeat(64),
    artifactOutputDigest:"1".repeat(64), artifactBuildIdentity:"2".repeat(64),
    registryDigest:"f".repeat(64), toolchainDigest:"0".repeat(64),
    environmentClass:"normal-linux", capabilityRoutes:{ "local-loopback":"scoped-command-approval" },
  });
  const attemptInputIdentity = checkpointAttemptInputIdentity(attemptIdentity);
  let ownerAlive = true;
  let checkpointTimestamp = Date.parse("2026-08-09T00:00:00.000Z");
  const legacyAttemptDirectory = path.join(checkpointAttemptRoot, "legacy");
  const primaryAttemptDirectory = path.join(checkpointAttemptRoot, "primary");
  const legacyAttemptStore = createCheckpointAttemptStore({ directory:legacyAttemptDirectory,
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => true });
  await legacyAttemptStore.claim(attemptInputIdentity,
    ["unit:legacy"], { pid:39, token:"owner-39" });
  const compatibleAttemptStore = createCheckpointAttemptStore({ directory:primaryAttemptDirectory,
    legacyDirectories:[legacyAttemptDirectory],
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => true });
  const compatibleLegacyAttempt = await compatibleAttemptStore.claim(attemptInputIdentity,
    ["unit:legacy"], { pid:40, token:"owner-40" });
  assert.equal(compatibleLegacyAttempt.action, "attached",
    "a compatible active legacy checkpoint prevents duplicate repository work");
  assert.equal((await compatibleAttemptStore.list()).length, 1,
    "the authoritative attempt view unions the writable and legacy namespaces");
  const recoveringAttemptStore = createCheckpointAttemptStore({ directory:primaryAttemptDirectory,
    legacyDirectories:[legacyAttemptDirectory],
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => false });
  const recoveredLegacyAttempt = await recoveringAttemptStore.claim(attemptInputIdentity,
    ["unit:legacy"], { pid:41, token:"owner-41" });
  assert.equal(recoveredLegacyAttempt.action, "stale-owner-recovered",
    "a stale legacy attempt migrates before its lease is recovered");
  assert.equal((await recoveringAttemptStore.read(recoveredLegacyAttempt.attempt.id)).owner.token,
    "owner-41", "the migrated attempt remains readable from the authoritative namespace");
  const attemptStore = createCheckpointAttemptStore({ directory:checkpointAttemptRoot,
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => ownerAlive });
  const createdAttempt = await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:41, token:"owner-41" });
  assert.equal(createdAttempt.action, "created");
  assert.equal(createdAttempt.attempt.identity.artifactOutputDigest, null,
    "the repository-common attempt is acquired before the build child starts");
  await attemptStore.bindArtifactIdentity(createdAttempt.attempt.id, {
    artifactOutputDigest:attemptIdentity.artifactOutputDigest,
    artifactBuildIdentity:attemptIdentity.artifactBuildIdentity,
  }, { token:"owner-41" });
  const boundAttempt = await attemptStore.read(createdAttempt.attempt.id);
  assert.equal(boundAttempt.identityDigest, verificationDigest(attemptIdentity),
    "the single owned build durably establishes the attempt output identity");
  const attachedAttempt = await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:42, token:"owner-42" });
  assert.equal(attachedAttempt.action, "attached");
  assert.equal(attachedAttempt.attempt.id, createdAttempt.attempt.id,
    "two compatible invocations expose one repository-common checkpoint attempt");
  let incompatibleOwnerRejected = false;
  try {
    await attemptStore.claim(checkpointAttemptIdentity({ ...attemptIdentity,
      planDigest:"8".repeat(64) }), ["unit:incompatible"], { pid:43, token:"owner-43" });
  } catch (error) {
    assert.match(error.message, /owned by pid 41/u);
    incompatibleOwnerRejected = true;
  }
  const attemptResult = (key, stage = "unit") => {
    const identity = { key, stage, packId:"shell", executable:"node", args:[`${key}.mjs`],
      target:key, environment:null, requiredCapabilities:[] };
    return { status:"passed", identityDigest:verificationDigest(identity),
      receiptTask:{ identity, status:"passed", provenance:"fresh", durationMs:1,
        output:"", stderr:"", executionPrerequisites:{ requiredCapabilities:[],
          launchRoute:"workspace-sandbox" } } };
  };
  await attemptStore.recordTask(createdAttempt.attempt.id, "unit:a", attemptResult("unit:a"),
    { token:"owner-41" });
  await attemptStore.interrupt(createdAttempt.attempt.id, "browser:b", { token:"owner-41" });
  const continuedAttempt = await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:42, token:"owner-42" });
  assert.equal(continuedAttempt.action, "continued");
  assert.deepEqual(continuedAttempt.reusableTaskKeys, ["unit:a"]);
  assert.deepEqual(continuedAttempt.pendingTaskKeys, ["browser:b", "package:extension"]);
  const driftIdentities = {
    "the candidate commit or tree changes":{ ...attemptIdentity,
      candidate:{ ...attemptIdentity.candidate, tree:"2".repeat(40) } },
    "the registry or canonical plan changes":{ ...attemptIdentity,
      planDigest:"2".repeat(64), registryDigest:"3".repeat(64) },
    "the locked toolchain identity changes":{ ...attemptIdentity,
      toolchainDigest:"4".repeat(64) },
    "the built artifact identity changes":{ ...attemptIdentity,
      artifactOutputDigest:"5".repeat(64), artifactBuildIdentity:"6".repeat(64) },
  };
  const driftRows = {};
  for (const [drift, driftIdentity] of Object.entries(driftIdentities)) {
    const beforeAttempts = await attemptStore.list();
    let rejection;
    try { await attemptStore.assertIdentity(createdAttempt.attempt.id, driftIdentity); }
    catch (error) { rejection = error; }
    const afterAttempts = await attemptStore.list();
    driftRows[drift] = {
      stoppedBeforeLaunch:/identity drift/u.test(rejection?.message ?? ""),
      retainedForDiagnosis:afterAttempts.some(({ id }) => id === createdAttempt.attempt.id),
      noFreshAttempt:afterAttempts.length === beforeAttempts.length,
      executionContractIncident:executionContractIncidentObserved,
    };
    assert.deepEqual(Object.values(driftRows[drift]), [true, true, true, true],
      `${drift} stops the existing attempt without forging a fresh attempt`);
  }
  const partialTargetResult = attemptResult("browser:b", "browser");
  partialTargetResult.receiptTask.identity.logicalTargetIds = ["BROWSER_FIRST", "BROWSER_SECOND"];
  partialTargetResult.receiptTask.status = "failed";
  partialTargetResult.receiptTask.logicalResults = {
    BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
    BROWSER_SECOND:{ id:"BROWSER_SECOND" },
  };
  await attemptStore.recordLogicalTargets(createdAttempt.attempt.id, "browser:b",
    partialTargetResult.receiptTask, { token:"owner-42" });
  const targetDurability = await attemptStore.read(createdAttempt.attempt.id);
  assert.deepEqual(targetDurability.logicalResults["browser:b"], {
    BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
  }, "each completed browser target is durable before its whole batch passes");
  await attemptStore.interrupt(createdAttempt.attempt.id, "browser:b", { token:"owner-42" });
  const targetContinuation = await attemptStore.claim(attemptIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:44, token:"owner-44" });
  assert.deepEqual(targetContinuation.attempt.logicalResults["browser:b"], {
    BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
  }, "continuation preserves completed targets and reruns only interrupted or unstarted targets");
  await attemptStore.recordTask(createdAttempt.attempt.id, "browser:b",
    attemptResult("browser:b", "browser"), { token:"owner-44" });
  await attemptStore.recordTask(createdAttempt.attempt.id, "package:extension",
    attemptResult("package:extension", "package"), { token:"owner-44" });
  await attemptStore.markTasksComplete(createdAttempt.attempt.id, { token:"owner-44" });
  assert.equal((await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:43, token:"owner-43" })).action,
  "promotion-only", "a completed attempt rejects duplicate task execution");
  const observedPromotionScopes = {};
  observedPromotionScopes["completed receipt finalization is interrupted"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["completed receipt finalization is interrupted"],
    "receipt-finalization");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "receipt-finalized");
  const receiptPromotion = (await attemptStore.read(createdAttempt.attempt.id));
  assert.equal(receiptPromotion.promotion["receipt-finalized"].at,
    receiptPromotion.transitions.find(({type}) => type === "receipt-finalized").at,
  "one promotion event retains one timestamp even when the clock advances per read");
  observedPromotionScopes["pending evidence creation is interrupted"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["pending evidence creation is interrupted"],
    "pending-evidence");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "pending-evidence-created");
  observedPromotionScopes["Git-note recording loses its lock or permission"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["Git-note recording loses its lock or permission"],
    "git-note-recording");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "git-note-recorded");
  observedPromotionScopes["handoff eligibility cannot read durable evidence"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["handoff eligibility cannot read durable evidence"],
    "handoff-eligibility");
  const beforeIdempotentPromotion = await attemptStore.read(createdAttempt.attempt.id);
  await attemptStore.markPromotion(createdAttempt.attempt.id, "git-note-recorded");
  assert.equal((await attemptStore.read(createdAttempt.attempt.id)).transitions.length,
    beforeIdempotentPromotion.transitions.length,
    "restarting an already completed promotion step is idempotent");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "handoff-eligible");
  assert.equal((await attemptStore.read(createdAttempt.attempt.id)).state, "promoted");
  const quiescenceIdentity = checkpointAttemptInputIdentity({ ...attemptIdentity,
    evidenceTask:"failure-quiescence", planDigest:"7".repeat(64) });
  const quiescenceAttempt = await attemptStore.claim(quiescenceIdentity,
    ["unit:failed", "unit:cancelled", "unit:unstarted"],
    { pid:45, token:"owner-45" });
  const failureQuiescence = {
    version:1, stage:"unit", failedTaskKeys:["unit:failed"],
    causalFailedTaskKey:"unit:failed", cancelledTaskKeys:["unit:cancelled"],
    unstartedTaskKeys:["unit:unstarted"],
    terminationResults:[{ taskKey:"unit:cancelled", signal:"SIGTERM", escalatedTo:null }],
    quiesced:true,
  };
  await attemptStore.quiesceFailure(quiescenceAttempt.attempt.id, failureQuiescence,
    { token:"owner-45" });
  const durableQuiescence = await attemptStore.read(quiescenceAttempt.attempt.id);
  assert.equal(durableQuiescence.state, "interrupted");
  assert.deepEqual(durableQuiescence.failureQuiescence, {
    ...failureQuiescence, at:durableQuiescence.failureQuiescence.at,
  }, "the attempt durably binds the causal failure, cancellations, unstarted tasks, and termination");
  assert.ok(Number.isFinite(Date.parse(durableQuiescence.failureQuiescence.at)));
  const quiescenceContinuation = await attemptStore.claim(quiescenceIdentity,
    ["unit:failed", "unit:cancelled", "unit:unstarted"],
    { pid:46, token:"owner-46" });
  assert.equal(quiescenceContinuation.action, "continued",
    "resume is possible only after the durable quiesced boundary is complete");
  assert.deepEqual(quiescenceContinuation.pendingTaskKeys,
    ["unit:failed", "unit:cancelled", "unit:unstarted"]);
  const attemptPath = path.join(checkpointAttemptRoot, `${createdAttempt.attempt.id}.json`);
  const pristineAttemptDocument = JSON.parse(await readFile(attemptPath, "utf8"));
  const forgedAttemptRejected = {};
  const forgeAttempt = async(name, mutate) => {
    const document = structuredClone(pristineAttemptDocument);
    mutate(document.attempt);
    document.digest = timeoutIncidentDigest(document.attempt);
    await writeFile(attemptPath, `${JSON.stringify(document)}\n`);
    await assert.rejects(attemptStore.read(createdAttempt.attempt.id),
      /malformed|transition|result|promotion|state|owner|digest|identity/u);
    forgedAttemptRejected[name] = true;
    await writeFile(attemptPath, `${JSON.stringify(pristineAttemptDocument)}\n`);
  };
  await forgeAttempt("missingResult", (attempt) => { delete attempt.results["unit:a"]; });
  await forgeAttempt("extraResult", (attempt) => {
    attempt.results["unit:extra"] = structuredClone(attempt.results["unit:a"]);
  });
  await forgeAttempt("forgedResult", (attempt) => {
    attempt.results["unit:a"].identityDigest = "9".repeat(64);
  });
  await forgeAttempt("impossibleState", (attempt) => { attempt.state = "active"; });
  await forgeAttempt("reorderedTransitions", (attempt) => {
    [attempt.transitions[0], attempt.transitions[1]] = [attempt.transitions[1], attempt.transitions[0]];
  });
  await forgeAttempt("duplicatedTransition", (attempt) => {
    attempt.transitions.push(structuredClone(attempt.transitions.at(-1)));
  });
  await forgeAttempt("promotionDrift", (attempt) => {
    delete attempt.promotion["git-note-recorded"];
  });
  ownerAlive = false;
  const staleIdentity = checkpointAttemptIdentity({ ...attemptIdentity,
    candidate:{ commit:"4".repeat(40), tree:"5".repeat(40) } });
  const staleCreated = await attemptStore.claim(staleIdentity, ["unit:new"],
    { pid:51, token:"owner-51" });
  const staleRecovered = await attemptStore.claim(staleIdentity, ["unit:new"],
    { pid:52, token:"owner-52" });
  assert.equal(staleCreated.action, "created");
  assert.equal(staleRecovered.action, "stale-owner-recovered");
  checkpointContractEvidence = {
    singleton:createdAttempt.attempt.id === attachedAttempt.attempt.id,
    attachedWithoutDuplicate:attachedAttempt.action === "attached",
    continuation:continuedAttempt.action === "continued",
    reusedOnlyPassed:JSON.stringify(continuedAttempt.reusableTaskKeys) === JSON.stringify(["unit:a"]),
    interruptedAndUnstartedOnly:JSON.stringify(continuedAttempt.pendingTaskKeys) ===
      JSON.stringify(["browser:b", "package:extension"]),
    packagePlanned:createdAttempt.attempt.taskKeys.includes("package:extension"), promotionOnly:true,
    promotionScopes:observedPromotionScopes,
    preflightRows:{
      "every prerequisite is satisfied and no attempt exists":{
        action:"create one repository-common checkpoint attempt",
        taskExecution:"the planned tasks may launch", observed:createdAttempt.action === "created" },
      "one compatible incomplete attempt already exists":{
        action:"attach to that attempt", taskExecution:"no second all-pack process launches",
        observed:attachedAttempt.action === "attached" },
      "another owner holds an incompatible active lease":{
        action:"report or queue behind the named owner outside timing",
        taskExecution:"no checkpoint task launches", observed:incompatibleOwnerRejected },
      "a lease is demonstrably stale":{
        action:"use the bounded audited stale-owner recovery",
        taskExecution:"tasks launch only after lease recovery completes",
        observed:staleRecovered.action === "stale-owner-recovered" },
      "a required executable or bounded output capacity is unavailable":{
        action:"record environment-prerequisite-blocked",
        taskExecution:"no checkpoint task launches",
        observed:!missingExecutableProbe.launchable && !missingCapacityProbe.launchable },
    },
    driftRows,
    identityDriftRejected:Object.values(driftRows).every((row) => row.stoppedBeforeLaunch),
    staleOwnerRecovered:staleRecovered.action === "stale-owner-recovered",
    forgedAttemptRejected,
  };
} finally {
  await rm(checkpointAttemptRoot, { recursive:true, force:true });
}
