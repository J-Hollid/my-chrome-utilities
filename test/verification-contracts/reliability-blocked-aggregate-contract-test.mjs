import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { decideBrowserObservationWorkers } from "../../scripts/shared-artifact-parallel.mjs";
import { verificationPacksAtCommit } from "../../scripts/verification-changes.mjs";
import { intentOwnershipReadiness } from "../../scripts/verification-ownership-readiness-core.mjs";
import { removeVerificationFixtureRoot } from "../support/verification-cleanup.mjs";
import {
  assertReadOnlyArtifactLease,
  captureRequiredRejection,
  unreadableConsumerEvidence,
  verificationPackValidationDiagnostic,
} from "../support/verification-contract-boundary-helpers.mjs";
import { estimatePlanMilliseconds, reportVerificationThroughput, validateVerificationPerformanceCalibrationSnapshot } from "../../scripts/report-verification-throughput.mjs";
import { buildCanonicalTimingLedger } from "../../scripts/verification-timing-ledger.mjs";
import { compatibleTimeoutRepairIncidentIds, applyCheckpointPrerequisitePlan, bindVerificationChangeScope, closeVerificationPlanPrerequisites, createCheckpointIdentityGuard, createVerificationCommandRunner, createVerificationReceiptContext, coordinatorArtifactLeaseRequired, executeTimeoutRepairTaskPlan, enforceTerminalClosureReceipt, focusedAcceptanceOptions, planPackageTask, selectFocusedVerificationTasks, prepareCheckpointExecution, reliabilityAdmissionPartition, resumeVerificationPlan, reviewReadyScopeGuardRequired, runTimeoutRepairFocused, runTimeoutDiagnosticRetry, validateExplicitChangedPaths, validateRegistryCardinalityReviewPreflight, verificationArtifactIdentity, verificationPromotionTasks } from "../../scripts/run-focused-acceptance.mjs";
import { candidatePredatesRunIntentImplementation, closeCanonicalEvidencePlanPrerequisites, firstCanonicalDifference, legacyArchivedCheckpointTaskIdentities, legacyAcceptanceSessionPrerequisiteCompatibility, preflightGitNotePromotion, requireEvidenceReceiptRunIntent, verificationDigest } from "../../scripts/verification-evidence.mjs";
import { planVerification, verificationOwner, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { executeAcceptancePlan } from "../../scripts/verification-execution/execute.mjs";
import { loadVerificationPacks, validateIsolatedVerificationHandlers, validateVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
import { classifyHistoricalTimeoutFixture, createTimeoutIncidentStore, createVerificationProgressTracker, deriveTaskCheckpointRepairProof, diagnosticRetryScope, reliabilityFailureFingerprint, resolvedVerificationDeadlines, timeoutIncidentDigest, timeoutRepairCausalCategory, timeoutRepairDiagnosedBoundary, timeoutRepairFocusedExecutionTaskPlan, timeoutRepairPackageTaskIdentity, timeoutRepairPackIds, timeoutRepairFocusedTaskPlan, timeoutResolutionEvidence, validateTimeoutRepairProposal, verificationProgressEmitter } from "../../scripts/verification-reliability-incidents.mjs";
import { canonicalCheckpointBinding } from "../../scripts/verification-reliability-receipts.mjs";
import { confirmedFlakyAdmissionCoversEvidenceCandidate } from "../../scripts/verification-reliability-evidence-policy.mjs";
import { bindRunIntentBootstrapPlan, blockedAggregateEvidenceRoute, blockedAggregatePreparationBaseCommit, blockedAggregatePreparationEvidenceTask, blockedAggregatePreparationPaths, buildConfirmedFlakyAdmissions, buildEligibleRepairAdmissions, bootstrapReviewIncidentProof, eligibleRepairAdmissionCandidates, governedRepairAttemptAssociation, revalidateConfirmedFlakyAdmissions, revalidateEligibleRepairAdmissions, registryPlannerPreparationFocusedPlan, requireVerificationRunIntent, runIntentBootstrapCoverage, validateEligibleRepairAdmissionsReceipt, validateConfirmedFlakyAdmissionsReceipt, validateRunIntentBootstrapBase, validateRunIntentBootstrapReceipt, verificationRegistryPlannerBootstrapEligibility, verificationRunIntent, verificationRunIntents } from "../../scripts/verification-run-intent.mjs";
import { persistBootstrapTerminalObligationSourceReceipt, readBootstrapTerminalObligationSourceReceipt, verifyCommittedReviewTransaction } from "../../scripts/settled-final-verification.mjs";
import { browserTargetSuccessionBoundary, loadTaskSuccessionGraph, resolveIncidentTaskSuccession, resolveTaskSuccessionGraph, taskSuccessionBoundaryDigest, validateUnresolvedIncidentTaskSuccession, verificationTaskDigest } from "../../scripts/verification-task-succession.mjs";
import { defaultRepositoryRuntimeDirectory, defaultStoreDirectory, validateIncident } from "../../scripts/verification-reliability-persistence.mjs";
import { verificationPolicyContracts } from "../../scripts/verification-policy/contracts.mjs";
import {
  createTerminalClosurePolicy,
  exactBootstrapTerminalObligation,
  terminalLineageSource,
  terminalClosurePolicyValid,
} from "../../scripts/verification-policy/reliability/terminal-closure.mjs";
import { createVerificationPackCardinalityAdapter } from
  "../../scripts/verification-pack-cardinality/contract.mjs";
import { terminalProjectionCoverage, terminalProjectionCoverageValid } from "../../scripts/verification-reliability-deferred.mjs";
import { recordEligibleIncidentDeferral, reviewAdmissionTransactionOwnsDeferrals } from "../../scripts/verification-reliability-runtime.mjs";
import { boundedClosureContractRevision, boundedClosureEvidenceTask, causalFailureIdentity, classifyReliabilityFailureDomain, closureDisposition, completeTaskInputClosure, inputEquivalentTaskProof, reliabilityFailureContract, terminalClosureExecution } from "../../scripts/verification-reliability-closure.mjs";
import { createVerificationLaunchAuthorizations, expandVerificationTaskPrerequisites, normalizeBrowserPrerequisiteTasks, preflightExecutionPrerequisites, probeExecutionPrerequisiteEnvironment, verificationPrerequisiteKindRegistry, verificationRunnerModeRegistry } from "../../scripts/verification-execution-prerequisites.mjs";
import { canonicalFlowReloadIdentity, classifyFlowReloadModes, flowReloadCausalKey, observeFlowReloadLifecycle } from "../../scripts/flow-reload-lifecycle.mjs";
import { defaultCheckpointAttemptDirectory } from "../../scripts/verification-checkpoint-attempt.mjs";
import {
  blockedAggregateRouteIdentity,
  createBlockedAggregateAdmissionSnapshot,
  createBlockedAggregateObligation,
  deriveConservedCorrectionDeltaIdentity,
  validateInheritedBlockedAggregateAdmission,
  decideBlockedAggregateConsumption,
  partitionBlockedAggregateExecution,
  sealBlockedAggregateObligation,
  validateBlockedAggregateLineageAdmission,
  validateBlockedAggregateAdmissionSnapshot,
  validateBlockedAggregateSource,
  validateConservedCorrectionDeltaIdentity,
  validateInheritedBlockedAggregatePreflight,
} from "../../scripts/verification-policy/reliability/blocked-aggregate.mjs";
function pack(id, overrides = {}) {
  return {
    id,
    source:[`src/${id}/`], process:[], globalImpact:[], dependencies:[], sharedComponents:[],
    verificationInputs:[], runtimeInputs:[],
    unit:[`test/${id}-one-test.mjs`, `test/${id}-two-test.mjs`], property:[],
    features:[`features/${id}-one.feature`, `features/${id}-two.feature`],
    handlers:[`acceptance/src/acceptance/steps/${id}.clj`], browserAdapters:[],
    browserAdapterModes:[], browserObservations:[], checkpointCommands:[],
    ...overrides,
  };
}
const synthetic = [
  pack("alpha", {
    browserObservations:[{
      id:"ALPHA_BROWSER_ADAPTER", path:"test/alpha-browser-test.mjs",
      environment:{ ALPHA_BROWSER_ADAPTER:"1" }, observationKeys:["alpha"],
      features:["features/alpha-one.feature"],
    }],
    checkpointCommands:[{
      id:"alpha-check", executable:"node", args:["acceptance/runtime/alpha.mjs"],
      features:["features/alpha-one.feature"],
    }],
  }),
  pack("beta", { dependencies:["alpha"] }),
  pack("process", {
    source:[], process:["scripts/", "acceptance/src/acceptance/"],
    globalImpact:["acceptance/src/acceptance/pack_session.clj"],
    features:[], handlers:[], unit:["test/process-test.mjs"],
    verificationOnly:{productionOwner:"alpha"},
  }),
  pack("empty", {
    source:[], unit:[], features:[], handlers:[], dependencies:["alpha"],
  }),
];
const packs = await loadVerificationPacks();
import { registryPlannerPreparationTaskKeys } from "../../scripts/verification-policy/reliability/run-intent.mjs";
const blockedAggregateTask = { key:blockedAggregateRouteIdentity.parentTaskKey,
  stage:"browser-observation", packId:"shell", executable:"node",
  args:["scripts/run-browser-observation.mjs", "REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER"],
  target:"REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
  environment:{ REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER:"1" },
  requiredCapabilities:["local-loopback"],
  logicalTargetIds:["REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER"] };
const blockedSyntheticTask = { key:blockedAggregateRouteIdentity.syntheticTaskKey,
  stage:"unit", packId:"verification_process", executable:"node",
  args:["test/verification-contracts/execution-binding-contract-test.mjs"],
  target:"test/verification-contracts/execution-binding-contract-test.mjs",
  environment:null, requiredCapabilities:[] };
const blockedPackageTask = { key:"package:extension", stage:"package", packId:null,
  executable:"npm", args:["run", "package"], target:null, environment:null,
  requiredCapabilities:[] };
const blockedPlan = { mode:"exact", includeProperties:true,
  tasks:[blockedAggregateTask, blockedSyntheticTask, blockedPackageTask] };
const correctionDeltaFixture = ({ destinationPatch = [
  "diff --git a/runner.mjs b/runner.mjs",
  "index 1111111..2222222 100644",
  "--- a/runner.mjs",
  "+++ b/runner.mjs",
  "@@ -1,0 +2 @@ alpha",
  "+route\n",
].join("\n"), destinationCandidate = "alpha\nroute\nprep\nshared\n" } = {}) => ({
  task:blockedAggregateRouteIdentity.correctionTask,
  paths:["runner.mjs"],
  source:{ baseCommit:"a".repeat(40), baseTree:"b".repeat(40),
    candidateCommit:"c".repeat(40), candidateTree:"d".repeat(40),
    patch:[
      "diff --git a/runner.mjs b/runner.mjs",
      "index 3333333..4444444 100644",
      "--- a/runner.mjs",
      "+++ b/runner.mjs",
      "@@ -1,0 +2 @@ alpha",
      "+route\n",
    ].join("\n"),
    files:{ "runner.mjs":{ base:"alpha\nshared\n", candidate:"alpha\nroute\nshared\n" } } },
  destination:{ baseCommit:"e".repeat(40), baseTree:"f".repeat(40),
    candidateCommit:"1".repeat(40), candidateTree:"2".repeat(40),
    patch:destinationPatch,
    files:{ "runner.mjs":{ base:"alpha\nprep\nshared\n", candidate:destinationCandidate } } },
});
const conservedCorrectionDelta = deriveConservedCorrectionDeltaIdentity(correctionDeltaFixture());
assert.equal(validateConservedCorrectionDeltaIdentity(conservedCorrectionDelta,
  conservedCorrectionDelta), conservedCorrectionDelta,
"cross-base identity accepts the same ordered correction while retaining preparation bytes");
const differentSourceDelta = deriveConservedCorrectionDeltaIdentity({
  ...correctionDeltaFixture(),
  source:{ ...correctionDeltaFixture().source, baseCommit:"3".repeat(40) },
});
assert.throws(() => validateConservedCorrectionDeltaIdentity(conservedCorrectionDelta,
  differentSourceDelta), /delta identity mismatch/u,
"a different source range is rejected even when its operations match");
const differentDestinationDelta = deriveConservedCorrectionDeltaIdentity({
  ...correctionDeltaFixture(),
  destination:{ ...correctionDeltaFixture().destination, baseTree:"4".repeat(40) },
});
assert.throws(() => validateConservedCorrectionDeltaIdentity(conservedCorrectionDelta,
  differentDestinationDelta), /delta identity mismatch/u,
"a different destination identity is rejected even when its operations match");
assert.equal(conservedCorrectionDelta.files[0].addedCount, 1);
assert.notEqual(blockedAggregateRouteIdentity.correctionPatchId,
  conservedCorrectionDelta.digest,
"a context-dependent Git patch id is not the conserved correction identity");
assert.throws(() => deriveConservedCorrectionDeltaIdentity(correctionDeltaFixture({
  destinationCandidate:"alpha\nchanged\nprep\nshared\n",
  destinationPatch:[
    "diff --git a/runner.mjs b/runner.mjs",
    "--- a/runner.mjs",
    "+++ b/runner.mjs",
    "@@ -1,0 +2 @@ alpha",
    "+changed\n",
  ].join("\n"),
})), /content|operation/u, "changed correction content is rejected");
assert.throws(() => deriveConservedCorrectionDeltaIdentity(correctionDeltaFixture({
  destinationCandidate:"alpha\nroute\nextra\nprep\nshared\n",
  destinationPatch:[
    "diff --git a/runner.mjs b/runner.mjs",
    "--- a/runner.mjs",
    "+++ b/runner.mjs",
    "@@ -1,0 +2,2 @@ alpha",
    "+route\n",
    "+extra\n",
  ].join("\n"),
})), /count|operation/u, "an extra destination operation is rejected");
assert.throws(() => deriveConservedCorrectionDeltaIdentity({
  ...correctionDeltaFixture(), paths:["different.mjs"],
}), /path/u, "a changed correction path is rejected");
assert.throws(() => deriveConservedCorrectionDeltaIdentity(correctionDeltaFixture({
  destinationCandidate:"alpha\nroute\nshared\n",
})), /reverse|preparation|byte/u,
"losing an overlapping preparation line fails reverse projection");
const productionCorrectionPatch = blockedAggregateRouteIdentity.correctionPaths.map((path, index) => [
  `diff --git a/${path} b/${path}`,
  `--- a/${path}`,
  `+++ b/${path}`,
  "@@ -1,0 +2 @@ base",
  `+route-${index}\n`,
].join("\n")).join("");
const productionCorrectionFiles = Object.fromEntries(
  blockedAggregateRouteIdentity.correctionPaths.map((path, index) => [path, {
    base:`base-${index}\n`, candidate:`base-${index}\nroute-${index}\n`,
  }]));
const blockedCorrectionDeltaIdentity = deriveConservedCorrectionDeltaIdentity({
  task:blockedAggregateRouteIdentity.correctionTask,
  paths:[...blockedAggregateRouteIdentity.correctionPaths],
  source:{ baseCommit:blockedAggregateRouteIdentity.correctionSourceBase,
    baseTree:blockedAggregateRouteIdentity.correctionSourceBaseTree,
    candidateCommit:blockedAggregateRouteIdentity.correctionSourceCandidate,
    candidateTree:blockedAggregateRouteIdentity.correctionSourceCandidateTree,
    patch:productionCorrectionPatch, files:productionCorrectionFiles },
  destination:{ baseCommit:"1".repeat(40), baseTree:"9".repeat(40),
    candidateCommit:"d".repeat(40), candidateTree:"e".repeat(40),
    patch:productionCorrectionPatch, files:productionCorrectionFiles },
});
const blockedAggregateRunnerSource = await readFile(new URL(
  "../../scripts/verification-execution/runner.mjs", import.meta.url), "utf8");
assert.match(blockedAggregateRunnerSource,
  /deriveConservedCorrectionDeltaIdentity\([\s\S]*?correctionSourceBase[\s\S]*?correctionSourceCandidate[\s\S]*?preparationQaCommit[\s\S]*?candidateCommit/u,
"the prelaunch gate derives source and destination delta identities from exact Git objects");
assert.doesNotMatch(blockedAggregateRunnerSource,
  /createBlockedAggregateObligation\(\{[\s\S]*?correctionPatchId:/u,
"context-sensitive patch identity cannot authorize the routing correction");
assert.match(blockedAggregateRunnerSource,
  /currentBlockedAggregateAdmission[\s\S]*?validateBlockedAggregateLineageAdmission/u,
  "prelaunch uses the direct immutable bound-incident admission contract");
assert.match(blockedAggregateRunnerSource,
  /revalidateAdmissions = async\(phase\)[\s\S]*?currentBlockedAggregateAdmission/u,
  "the direct bound incident and ordinary remainder are revalidated before launch");
assert.match(blockedAggregateRunnerSource,
  /blockedAdmissionSnapshot = blockedAggregateObligation[\s\S]*?createBlockedAggregateAdmissionSnapshot[\s\S]*?eligibleCandidates\.length \|\| flakyCandidates\.length \|\| blockedAggregateObligation/u,
  "every blocked obligation snapshots and revalidates its complete admitted population");
assert.match(blockedAggregateRunnerSource,
  /validateBlockedAggregateAdmissionSnapshot\(blockedAdmissionSnapshot/u,
  "blocked revalidation compares admission class and immutable proof identity");
assert.doesNotMatch(blockedAggregateRunnerSource,
  /else if \(blockedAggregateObligation\)[\s\S]*?currentIncidents\.length/u,
  "deferred-only and empty populations cannot fall back to cardinality-only rejection");
assert.match(blockedAggregateRunnerSource,
  /launchAuthorizations = commandRunner \? undefined : executionPlan\.tasks\.length[\s\S]*?: new Map\(\)/u,
  "promotion-only continuation creates no child launch authorization for an empty task plan");
assert.doesNotMatch(blockedAggregateRunnerSource, /no longer uniquely blocking/u,
  "cross-lineage admission cannot require the generic candidate query to return the bound id");
const blockedBinding = {
  version:1,
  incident:{ id:blockedAggregateRouteIdentity.incidentId,
    failureDigest:blockedAggregateRouteIdentity.failureDigest,
    sourceReceipt:blockedAggregateRouteIdentity.sourceReceipt,
    receiptSha256:blockedAggregateRouteIdentity.sourceReceiptSha256,
    runId:blockedAggregateRouteIdentity.incidentRunId,
    candidateCommit:blockedAggregateRouteIdentity.incidentCandidateCommit,
    candidateTree:blockedAggregateRouteIdentity.incidentCandidateTree,
    parentTaskKey:blockedAggregateRouteIdentity.parentTaskKey,
    childTaskKey:blockedAggregateRouteIdentity.childTaskKey,
    childTaskDigest:blockedAggregateRouteIdentity.childTaskDigest,
    command:[...blockedAggregateRouteIdentity.childCommand],
    invocationEnvironments:structuredClone(blockedAggregateRouteIdentity.childInvocationEnvironments) },
  correction:{ task:blockedAggregateRouteIdentity.correctionTask,
    candidateCommit:"d".repeat(40), candidateTree:"e".repeat(40),
    baseCommit:"1".repeat(40), preparationQaCommit:"1".repeat(40),
    changeSetDigest:"2".repeat(64), planDigest:"3".repeat(64),
    changedPaths:[...blockedAggregateRouteIdentity.correctionPaths],
    patchId:blockedAggregateRouteIdentity.correctionPatchId,
    deltaIdentity:blockedCorrectionDeltaIdentity,
    blockedTaskKey:blockedAggregateRouteIdentity.parentTaskKey,
    syntheticTaskKey:blockedAggregateRouteIdentity.syntheticTaskKey },
};
const blockedObligation = createBlockedAggregateObligation({
  binding:blockedBinding, plan:blockedPlan,
  candidate:{ commit:"d".repeat(40), tree:"e".repeat(40), baseCommit:"1".repeat(40),
    evidenceTask:blockedAggregateRouteIdentity.correctionTask,
    changeSetDigest:"2".repeat(64) },
  planDigest:"3".repeat(64), changedPaths:blockedBinding.correction.changedPaths,
  preparationQaAncestor:true,
  correctionDeltaIdentity:blockedCorrectionDeltaIdentity,
});
assert.throws(() => createBlockedAggregateObligation({
  binding:{ ...blockedBinding, correction:{ ...blockedBinding.correction,
    baseCommit:"f".repeat(40) } },
  plan:blockedPlan,
  candidate:{ commit:"d".repeat(40), tree:"e".repeat(40), baseCommit:"f".repeat(40),
    evidenceTask:blockedAggregateRouteIdentity.correctionTask,
    changeSetDigest:"2".repeat(64) },
  planDigest:"3".repeat(64), changedPaths:blockedBinding.correction.changedPaths,
  preparationQaAncestor:true, correctionDeltaIdentity:blockedCorrectionDeltaIdentity,
}), /source or destination identity/u,
"the evidence change-set base cannot diverge from the exact preparation QA base");
const boundIncident = { id:blockedAggregateRouteIdentity.incidentId, state:"unresolved",
  failureDigest:blockedAggregateRouteIdentity.failureDigest,
  failure:{ sourceReceipt:blockedAggregateRouteIdentity.sourceReceipt,
    runnerRunId:blockedAggregateRouteIdentity.incidentRunId,
    lineage:{ commit:blockedAggregateRouteIdentity.incidentCandidateCommit,
      tree:blockedAggregateRouteIdentity.incidentCandidateTree },
    task:blockedAggregateTask } };
const boundSourceReceipt = { runId:blockedAggregateRouteIdentity.incidentRunId,
  candidate:{ commit:blockedAggregateRouteIdentity.incidentCandidateCommit,
    tree:blockedAggregateRouteIdentity.incidentCandidateTree },
  tasks:{ [blockedAggregateRouteIdentity.parentTaskKey]:{
    identity:blockedAggregateTask, status:"failed",
    reliabilityIncidentId:blockedAggregateRouteIdentity.incidentId,
    reliabilityFailureDigest:blockedAggregateRouteIdentity.failureDigest } } };
assert.equal(validateBlockedAggregateSource({ binding:blockedBinding, incident:boundIncident,
  receipt:boundSourceReceipt,
  receiptSha256:blockedAggregateRouteIdentity.sourceReceiptSha256 }), blockedBinding,
"the unresolved incident and immutable receipt bind without mutation before launch");
assert.throws(() => validateBlockedAggregateSource({ binding:blockedBinding,
  incident:{ ...boundIncident, state:"resolved" }, receipt:boundSourceReceipt,
  receiptSha256:blockedAggregateRouteIdentity.sourceReceiptSha256 }), /identity mismatch/u,
"a stale or resolved incident blocks before any task can launch");
const unrelatedIncident = { id:"unrelated-incident", state:"unresolved" };
const boundAdmissionStore = (incident, blocking) => ({
  read:async(id) => {
    assert.equal(id, blockedAggregateRouteIdentity.incidentId);
    if (!incident) throw new Error("missing incident");
    return structuredClone(incident);
  },
  blocking:async({ commit }) => {
    assert.equal(commit, "d".repeat(40));
    return structuredClone(blocking);
  },
});
const boundAdmissionInput = {
  binding:blockedBinding, receipt:boundSourceReceipt,
  receiptSha256:blockedAggregateRouteIdentity.sourceReceiptSha256,
  candidateCommit:"d".repeat(40),
};
assert.deepEqual((await validateBlockedAggregateLineageAdmission({
  ...boundAdmissionInput, store:boundAdmissionStore(boundIncident, [unrelatedIncident]),
})).incidents, [unrelatedIncident],
"an off-lineage bound incident is validated directly while unrelated blockers remain ordinary");
assert.deepEqual((await validateBlockedAggregateLineageAdmission({
  ...boundAdmissionInput,
  store:boundAdmissionStore(boundIncident, [boundIncident, unrelatedIncident]),
})).incidents, [unrelatedIncident],
"an on-lineage bound incident is removed once only after the same direct validation");
await assert.rejects(validateBlockedAggregateLineageAdmission({
  ...boundAdmissionInput,
  store:boundAdmissionStore(boundIncident, [boundIncident, boundIncident]),
}), /duplicated/u,
"a duplicated lineage-query identity cannot be admitted");
await assert.rejects(validateBlockedAggregateLineageAdmission({
  ...boundAdmissionInput,
  store:boundAdmissionStore(boundIncident, [{ ...boundIncident, failureDigest:"0".repeat(64) }]),
}), /substituted/u,
"a lineage-query record cannot substitute another value under the bound id");
for (const stale of [
  { state:"resolved" },
  { resolution:{} },
  { terminalVerificationDeferred:{} },
  { repair:{ status:"eligible" } },
  { repairAttempts:[{}] },
  { retry:{ classification:"confirmed-flaky" } },
  { runIntentCompatibility:{ status:"nonblocking-development-diagnostic" } },
  { governedRepairAttempt:{} },
  { closureAudit:{ kind:"verifier-cause-superseded", blocking:false } },
  { lineageTransitions:[{ kind:"rebase" }] },
  { transitions:[{ kind:"resolved" }] },
]) {
  await assert.rejects(validateBlockedAggregateLineageAdmission({
    ...boundAdmissionInput,
    store:boundAdmissionStore({ ...boundIncident, ...stale }, []),
  }), /stale/u, "a disposition or substituted lineage makes the direct bound record stale");
}
const deferredAdmission = (id, disposition = "reviewed") => ({
  id, state:"unresolved",
  terminalVerificationDeferred:{ status:"terminal-verification-deferred", disposition },
});
const eligibleAdmission = (id, repairProof = "repair-proof") => ({
  id, state:"unresolved", failureDigest:`${id}-failure`,
  repair:{ status:"eligible", proof:repairProof },
});
const flakyAdmission = (id, retryProof = "retry-proof") => ({
  id, state:"unresolved", failureDigest:`${id}-failure`,
  retry:{ classification:"confirmed-flaky", proof:retryProof },
});
const auditedAdmission = (id, closureProof = "closure-proof") => ({
  ...eligibleAdmission(id),
  closureAudit:{ kind:"blocking-product-repair", proof:closureProof },
});
const admissionPopulation = ({ eligibleCandidates = [], flakyCandidates = [],
  alreadyDeferred = [], auditedCandidates = [], extraIncidents = [] } = {}) => ({
  incidents:[...eligibleCandidates, ...flakyCandidates, ...alreadyDeferred,
    ...auditedCandidates, ...extraIncidents],
  eligibleCandidates, flakyCandidates, alreadyDeferred, auditedCandidates,
});
const deferredOnlyPopulation = admissionPopulation({
  alreadyDeferred:[deferredAdmission("deferred-a"), deferredAdmission("deferred-b")],
});
const deferredOnlySnapshot = createBlockedAggregateAdmissionSnapshot(deferredOnlyPopulation);
assert.deepEqual(deferredOnlySnapshot.entries.map(({ id, admissionClass }) =>
  [id, admissionClass]), [
  ["deferred-a", "terminal-deferred"],
  ["deferred-b", "terminal-deferred"],
], "a deferred-only population is completely snapshotted without repair or flaky admission");
assert.deepEqual(validateBlockedAggregateAdmissionSnapshot(
  deferredOnlySnapshot, structuredClone(deferredOnlyPopulation)), deferredOnlySnapshot,
"an unchanged deferred-only population remains admitted");
const emptyAdmissionPopulation = admissionPopulation();
const emptyAdmissionSnapshot = createBlockedAggregateAdmissionSnapshot(emptyAdmissionPopulation);
assert.deepEqual(emptyAdmissionSnapshot.entries, [], "an empty admitted population is explicit");
assert.deepEqual(validateBlockedAggregateAdmissionSnapshot(
  emptyAdmissionSnapshot, emptyAdmissionPopulation), emptyAdmissionSnapshot,
"an unchanged empty population remains admitted");
const mixedAdmissionPopulation = admissionPopulation({
  eligibleCandidates:[eligibleAdmission("eligible")],
  flakyCandidates:[flakyAdmission("flaky")],
  alreadyDeferred:[deferredAdmission("deferred")],
  auditedCandidates:[auditedAdmission("audited")],
});
const mixedAdmissionSnapshot = createBlockedAggregateAdmissionSnapshot(mixedAdmissionPopulation);
assert.deepEqual(mixedAdmissionSnapshot.entries.map(({ id, admissionClass }) =>
  [id, admissionClass]), [
  ["audited", "audited-repair-closure"],
  ["deferred", "terminal-deferred"],
  ["eligible", "eligible-repair"],
  ["flaky", "confirmed-flaky"],
], "mixed admission classes retain one canonical identity per incident");
for (const [description, changedPopulation] of [
  ["added", admissionPopulation({ ...deferredOnlyPopulation,
    alreadyDeferred:[...deferredOnlyPopulation.alreadyDeferred, deferredAdmission("deferred-c")] })],
  ["removed", admissionPopulation({
    alreadyDeferred:[deferredOnlyPopulation.alreadyDeferred[0]] })],
  ["reclassified", admissionPopulation({
    eligibleCandidates:[eligibleAdmission("deferred-a")],
    alreadyDeferred:[deferredOnlyPopulation.alreadyDeferred[1]] })],
  ["proof-changed", admissionPopulation({ alreadyDeferred:[
    deferredAdmission("deferred-a", "changed"), deferredOnlyPopulation.alreadyDeferred[1],
  ] })],
  ["stale", admissionPopulation({ alreadyDeferred:[
    { ...deferredOnlyPopulation.alreadyDeferred[0], state:"resolved" },
    deferredOnlyPopulation.alreadyDeferred[1],
  ] })],
  ["unadmitted", admissionPopulation({
    alreadyDeferred:deferredOnlyPopulation.alreadyDeferred,
    extraIncidents:[{ id:"unadmitted", state:"unresolved" }],
  })],
]) {
  assert.throws(() => validateBlockedAggregateAdmissionSnapshot(
    deferredOnlySnapshot, changedPopulation), /admission (?:changed|stale|unadmitted)/u,
  `a ${description} blocked-aggregate incident population blocks before launch`);
}
const blockedPartition = partitionBlockedAggregateExecution(blockedPlan, blockedObligation);
assert.deepEqual(blockedPartition.executionPlan.tasks.map(({ key }) => key),
  [blockedAggregateRouteIdentity.syntheticTaskKey, "package:extension"],
  "one exact aggregate remains canonical while the execution child plan cannot launch it");
assert.equal(blockedPartition.blockedResult.status, "blocked-obligation");
assert.equal(blockedPartition.blockedResult.launched, false);
assert.equal(blockedPartition.blockedResult.childLaunched, false);
const productionShapedBlockedPlan = {
  ...blockedPlan,
  preparationTasks:[], unitTasks:[blockedSyntheticTask], propertyTasks:[], browserTasks:[],
  observationTasks:[blockedAggregateTask], parserTasks:[], generatorTasks:[], checkpointTasks:[],
  sessionTasks:[], packageTasks:[blockedPackageTask],
  preparationCommands:[], unitCommands:["synthetic"], propertyCommands:[], browserCommands:[],
  observationCommands:["prohibited aggregate"], parserCommands:[], generatorCommands:[],
  checkpointCommands:[], sessionCommands:[], packageCommands:["package"],
};
const productionPartition = partitionBlockedAggregateExecution(productionShapedBlockedPlan,
  blockedObligation);
assert.deepEqual(productionPartition.executionPlan.observationTasks, []);
assert.deepEqual(productionPartition.executionPlan.observationCommands, []);
const productionLaunches = [];
await executeAcceptancePlan(productionPartition.executionPlan, {
  runCommand:async(_display, task) => { productionLaunches.push(task.key); },
});
assert.deepEqual(productionLaunches,
  [blockedAggregateRouteIdentity.syntheticTaskKey, "package:extension"],
"the production-shaped stage schedule cannot hand the blocked aggregate to execution");
const blockedCheckpointIdentity = { candidateCommit:"d".repeat(40), planDigest:"3".repeat(64) };
const blockedCheckpointResult = (identity) => ({ identity, status:"passed", provenance:"fresh",
  durationMs:1, output:"passed", stderr:"" });
const continuedBlockedPlan = resumeVerificationPlan(productionPartition.executionPlan, {
  version:2, resumeIdentity:blockedCheckpointIdentity,
  tasks:{ [blockedSyntheticTask.key]:blockedCheckpointResult(blockedSyntheticTask) },
}, blockedCheckpointIdentity);
assert.deepEqual(continuedBlockedPlan.tasks.map(({ key }) => key), ["package:extension"],
  "durable checkpoint continuation cannot reintroduce the blocked aggregate");
const promotedBlockedPlan = resumeVerificationPlan(productionPartition.executionPlan, {
  version:2, resumeIdentity:blockedCheckpointIdentity,
  tasks:{
    [blockedSyntheticTask.key]:blockedCheckpointResult(blockedSyntheticTask),
    [blockedPackageTask.key]:blockedCheckpointResult(blockedPackageTask),
  },
}, blockedCheckpointIdentity);
assert.deepEqual(promotedBlockedPlan.tasks, [],
  "promotion-only checkpoint recovery retains the no-launch aggregate partition");
assert.equal(Object.hasOwn(promotedBlockedPlan.reusedTasks,
  blockedAggregateRouteIdentity.parentTaskKey), false,
"checkpoint recovery can neither execute nor synthesize a passed aggregate result");
const sealedBlockedObligation = sealBlockedAggregateObligation(blockedObligation, {
  [blockedAggregateRouteIdentity.syntheticTaskKey]:{
    identity:blockedSyntheticTask, status:"passed", provenance:"fresh", durationMs:1,
    output:"synthetic proof", stderr:"",
  },
});
assert.equal(sealedBlockedObligation.syntheticProof.status, "passed");
assert.notEqual(sealedBlockedObligation.obligationDigest, blockedObligation.obligationDigest,
  "fresh synthetic proof is sealed into the immutable obligation digest");
const consumerCanonicalPlan = planVerification(packs, {
  packIds:createVerificationPackCardinalityAdapter(packs).runnablePackIds,
  includeProperties:true,
});
const consumerPlan = planPackageTask(closeVerificationPlanPrerequisites(planVerification(packs, {
  packIds:["shell"], includeProperties:true,
}), consumerCanonicalPlan), consumerCanonicalPlan);
consumerPlan.changedPaths = [...blockedAggregateRouteIdentity.consumerChangedPaths];
consumerPlan.changeSet = { paths:[...blockedAggregateRouteIdentity.consumerChangedPaths] };
const consumerTaskIdentities = consumerPlan.tasks.map(verificationTaskIdentity);
const consumerCandidate = { commit:"4".repeat(40), tree:"5".repeat(40),
  baseCommit:"6".repeat(40), evidenceTask:blockedAggregateRouteIdentity.consumerTask,
  changeSetDigest:"7".repeat(64) };
const inheritedAdmission = validateInheritedBlockedAggregatePreflight(sealedBlockedObligation, {
  plan:consumerPlan, taskIdentities:consumerTaskIdentities,
  planDigest:blockedAggregateRouteIdentity.consumerPlanDigest,
  candidate:consumerCandidate, patchId:blockedAggregateRouteIdentity.consumerPatchId,
});
assert.equal(validateInheritedBlockedAggregateAdmission(inheritedAdmission,
  sealedBlockedObligation, { candidate:consumerCandidate,
    planDigest:blockedAggregateRouteIdentity.consumerPlanDigest,
    taskIdentities:consumerTaskIdentities }).status, "admitted",
"a descendant launch is sealed to the conserved reissued candidate and exact canonical plan");
assert.throws(() => validateInheritedBlockedAggregateAdmission(inheritedAdmission,
  sealedBlockedObligation, { candidate:{ ...consumerCandidate, commit:"8".repeat(40) },
    planDigest:blockedAggregateRouteIdentity.consumerPlanDigest,
    taskIdentities:consumerTaskIdentities }), /candidate.*mismatch/u,
"candidate drift is rejected against the prelaunch admission");
assert.throws(() => validateInheritedBlockedAggregateAdmission(inheritedAdmission,
  sealedBlockedObligation, { candidate:consumerCandidate, planDigest:"9".repeat(64),
    taskIdentities:consumerTaskIdentities }), /plan.*mismatch/u,
"plan drift is rejected against the prelaunch admission");
assert.throws(() => validateInheritedBlockedAggregateAdmission(inheritedAdmission,
  sealedBlockedObligation, { candidate:consumerCandidate,
    planDigest:blockedAggregateRouteIdentity.consumerPlanDigest,
    taskIdentities:consumerTaskIdentities.slice(1) }), /task.*mismatch/u,
"task-set substitution is rejected against the prelaunch admission");
assert.throws(() => validateInheritedBlockedAggregatePreflight(sealedBlockedObligation, {
  plan:consumerPlan, taskIdentities:consumerTaskIdentities,
  planDigest:blockedAggregateRouteIdentity.consumerPlanDigest,
  candidate:consumerCandidate, patchId:blockedAggregateRouteIdentity.consumerPatchId,
  resumeReceiptPath:"tmp/reused.json",
}), /fresh non-resumed/u,
"receipt reuse cannot attempt to consume an inherited obligation");
assert.throws(() => createBlockedAggregateObligation({
  binding:{ ...blockedBinding, correction:{ ...blockedBinding.correction,
    changedPaths:[...blockedBinding.correction.changedPaths, "src/product.ts"] } },
  plan:blockedPlan, candidate:{ commit:"d".repeat(40), tree:"e".repeat(40),
    baseCommit:"f".repeat(40), evidenceTask:blockedAggregateRouteIdentity.correctionTask,
    changeSetDigest:"2".repeat(64) }, planDigest:"3".repeat(64),
  changedPaths:[...blockedBinding.correction.changedPaths, "src/product.ts"],
  preparationQaAncestor:true,
  correctionDeltaIdentity:blockedCorrectionDeltaIdentity,
}), /verification-infrastructure-only/u,
"product changes block the obligation route before execution");
assert.deepEqual(decideBlockedAggregateConsumption(sealedBlockedObligation, {
  binding:structuredClone(sealedBlockedObligation.binding),
  child:{ taskKey:blockedAggregateRouteIdentity.childTaskKey, disposition:"governed", status:"passed",
    provenance:"fresh" },
  aggregate:{ taskKey:blockedAggregateRouteIdentity.parentTaskKey, status:"passed", provenance:"fresh" },
  synthetic:{ taskKey:blockedAggregateRouteIdentity.syntheticTaskKey, status:"passed", provenance:"fresh" },
}), { status:"consumed" }, "governed child disposition and a fresh aggregate pass consume the obligation");
assert.deepEqual(decideBlockedAggregateConsumption(sealedBlockedObligation, {
  binding:structuredClone(sealedBlockedObligation.binding),
  child:{ taskKey:blockedAggregateRouteIdentity.childTaskKey, disposition:"governed", status:"failed",
    provenance:"fresh" },
  aggregate:null,
  synthetic:{ taskKey:blockedAggregateRouteIdentity.syntheticTaskKey, status:"passed", provenance:"fresh" },
}), { status:"retained", recordNormalFailure:true },
"a fresh bound child failure retains the obligation for normal incident handling");
assert.throws(() => decideBlockedAggregateConsumption(sealedBlockedObligation, {
  binding:{ ...sealedBlockedObligation.binding, incident:{ ...sealedBlockedObligation.binding.incident,
    command:["node", "different-child.mjs"] } }, waiver:true,
}), /identity mismatch|waiver/u,
"waivers and any mismatched consumption identity are rejected without changing the obligation");
assert.throws(() => requireVerificationRunIntent({}, verificationRunIntents.review),
  /missing a valid immutable run intent/u, "missing intent blocks before execution");
assert.deepEqual(registryPlannerPreparationTaskKeys, [
  "unit:test/modular-utility-architecture-test.mjs",
  "unit:test/verification-pack-cardinality-contract-test.mjs",
  ...verificationPolicyContracts.flatMap(({testPaths})=>
    testPaths.map((testPath)=>`unit:${testPath}`)),
], "preparation evidence expands the retired process alias to every modular contract");
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
