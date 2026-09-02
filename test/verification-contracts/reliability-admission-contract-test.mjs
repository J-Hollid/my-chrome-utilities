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
const packs = await loadVerificationPacks();
const shellPlan = planVerification(packs, { packIds:["shell"] });
const bootstrapBase = await validateRunIntentBootstrapBase({
  root:"fixture", baseCommit:"approved-contract-base",
  changedPaths:["scripts/verification-run-intent.mjs"],
  readCommitFile:async(_root, _commit, file) => file.endsWith("modular-verification-packs.feature")
    ? "Modular verification packs 159\nModular verification packs 160\n" : null,
});
const bootstrapPlan = planVerification(packs, { packIds:["shell"] });
const bootstrapTask = verificationTaskIdentity(bootstrapPlan.tasks.find(({ stage }) => stage === "unit"));
const bootstrapIncident = {
  id:"bootstrap-deferred", state:"unresolved",
  failure:{ task:bootstrapTask }, repair:{ status:"eligible" },
  terminalVerificationDeferred:{ status:"terminal-verification-deferred" },
};
const bootstrapCoverage = await runIntentBootstrapCoverage({
  incidents:[bootstrapIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
});
const exactBootstrapRepair = { ...bootstrapIncident, id:"exact-bootstrap-repair",
  terminalVerificationDeferred:undefined, failure:{ ...bootstrapIncident.failure,
    sourceReceipt:"tmp/verification-receipts/bootstrap-review.json" },
  repair:{ status:"eligible", candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
    regression:{ key:bootstrapTask.key, status:"passed", commit:"bootstrap-candidate" },
    focusedReceipt:{ status:"passed", commit:"bootstrap-candidate" },
    causalProtocol:{ repairResult:{ status:"passed" } } } };
const exactRepairCoverage = await runIntentBootstrapCoverage({ incidents:[exactBootstrapRepair],
  plan:bootstrapPlan, packs, candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  reviewIncidentProof:async()=>({ sourceReceipt:exactBootstrapRepair.failure.sourceReceipt,
    sourceReceiptSha256:"a".repeat(64) }) });
assert.equal(exactRepairCoverage[0].admission.kind, "exact-candidate-causal-repair",
  "a bootstrap review failure with an eligible exact-candidate causal repair is admitted once");
const admissionIncident = {
  ...structuredClone(exactBootstrapRepair),
  failureDigest:"1".repeat(64),
  failure:{ ...structuredClone(exactBootstrapRepair.failure), causalKey:"2".repeat(64) },
  repair:{ ...structuredClone(exactBootstrapRepair.repair),
    checkpoint:{ baseCommit:"approved-contract-base", evidenceTask:"eligible-repair-admission" },
    causalCategory:"readiness or settling", causalExplanation:"The settled control was replaced.",
    regression:{ ...structuredClone(exactBootstrapRepair.repair.regression),
      receiptPath:"tmp/verification-receipts/regression.json", receiptSha256:"3".repeat(64) },
    focusedReceipt:{ ...structuredClone(exactBootstrapRepair.repair.focusedReceipt),
      provenance:"fresh", receiptPath:"tmp/verification-receipts/focused.json",
      receiptSha256:"4".repeat(64) },
    causalProtocol:{ version:2, incidentId:"exact-bootstrap-repair",
      failureDigest:"1".repeat(64), preRepairResult:{ status:"failed" },
      repairResult:{ status:"passed" } } },
};
const admissions = await buildEligibleRepairAdmissions({
  incidents:[admissionIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  baseCommit:"approved-contract-base", evidenceTask:"eligible-repair-admission",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
});
assert.deepEqual(admissions.entries.map(({ incidentId, coverageKind, selectedTaskKey }) =>
  ({ incidentId, coverageKind, selectedTaskKey })), [{
  incidentId:"exact-bootstrap-repair", coverageKind:"regression", selectedTaskKey:bootstrapTask.key,
}], "an eligible exact-candidate repair is admitted from persisted repair proof without source receipt bootstrap");
assert.equal(admissions.entries[0].repairDigest, timeoutIncidentDigest(admissionIncident.repair));
const rebasedAdmissionIncident = { ...structuredClone(admissionIncident),
  lineageTransitions:[{ kind:"rebase", fromCommit:"bootstrap-candidate",
    toCommit:"rebased-candidate", toTree:"rebased-tree",
    at:"2026-08-19T13:35:58.539Z" }, { kind:"rebase", fromCommit:"rebased-candidate",
    toCommit:"twice-rebased-candidate", toTree:"twice-rebased-tree",
    at:"2026-08-19T13:45:58.539Z" }] };
const rebasedAdmissions = await buildEligibleRepairAdmissions({
  incidents:[rebasedAdmissionIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"twice-rebased-candidate", tree:"twice-rebased-tree" },
  baseCommit:"approved-contract-base", evidenceTask:"eligible-repair-admission",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
});
assert.equal(rebasedAdmissions.entries[0].repairDigest,
  timeoutIncidentDigest(rebasedAdmissionIncident.repair),
"an eligible repair remains admissible after its exact validated recorded rebase");
for (const phase of ["immediately before task launch", "before receipt finalization"]) {
  const mutatedIncident = structuredClone(admissionIncident);
  mutatedIncident.repair.causalExplanation += ` Mutated ${phase}.`;
  await assert.rejects(()=>revalidateEligibleRepairAdmissions({
    admissions, phase, incidents:[mutatedIncident], plan:bootstrapPlan, packs,
    candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
    baseCommit:"approved-contract-base", evidenceTask:"eligible-repair-admission",
    changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
  }), new RegExp(`changed ${phase}`),
  `an admitted repair mutation is rejected ${phase}`);
}
const admittedReceipt = { eligibleRepairAdmissions:admissions, tasks:{
  [bootstrapTask.key]:{ identity:bootstrapTask, status:"passed", provenance:"fresh" },
  "package:canonical":{ identity:{ key:"package:canonical", stage:"package" },
    status:"passed", provenance:"fresh" },
} };
assert.equal(validateEligibleRepairAdmissionsReceipt(admittedReceipt, admissions), admissions,
  "the receipt requires the selected admission leaf and package to pass freshly");
assert.throws(()=>validateEligibleRepairAdmissionsReceipt(admittedReceipt, {
  ...admissions, entries:[...admissions.entries, structuredClone(admissions.entries[0])],
}), /sorted and unique/i, "duplicate admission entries fail closed");
assert.throws(()=>validateEligibleRepairAdmissionsReceipt(admittedReceipt, {
  ...admissions, entries:[{ ...admissions.entries[0], coverageKind:"invented-coverage" }],
}), /malformed or causally conflicting/i, "unknown coverage kinds fail closed");
assert.throws(()=>validateEligibleRepairAdmissionsReceipt(admittedReceipt, {
  ...admissions, entries:[{ ...admissions.entries[0], selectedTaskKey:"package:canonical",
    selectedTaskDigest:verificationTaskDigest({ key:"package:canonical", stage:"package" }) }],
}), /malformed or causally conflicting/i,
"regression coverage cannot name an unrelated freshly passing task");
assert.throws(()=>validateEligibleRepairAdmissionsReceipt(admittedReceipt, {
  ...admissions, entries:[{ ...admissions.entries[0], unexpected:true }],
}), /malformed or causally conflicting/i, "extra admission fields fail closed");
assert.throws(()=>validateEligibleRepairAdmissionsReceipt(admittedReceipt, {
  ...admissions, entries:[{ ...admissions.entries[0], coverageKind:"successor" }],
}), /malformed or causally conflicting/i, "successor coverage requires exact conservation fields");
await assert.rejects(()=>buildEligibleRepairAdmissions({
  incidents:[admissionIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"stale-candidate", tree:"bootstrap-tree" },
  baseCommit:"approved-contract-base", evidenceTask:"eligible-repair-admission",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
}), /exact candidate/i);
await assert.rejects(()=>buildEligibleRepairAdmissions({
  incidents:[{ ...admissionIncident, repair:{ ...admissionIncident.repair,
    regression:{ ...admissionIncident.repair.regression, key:"unit:not-selected" } },
    failure:{ ...admissionIncident.failure, task:{ ...admissionIncident.failure.task,
      key:"unit:not-selected", args:["test/not-selected.mjs"] } } }],
  plan:bootstrapPlan, packs, candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  baseCommit:"approved-contract-base", evidenceTask:"eligible-repair-admission",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
  resolveSuccession:async()=>{ throw new Error("no conserved successor"); },
}), /coverage/i);
assert.throws(()=>validateEligibleRepairAdmissionsReceipt({ ...admittedReceipt, tasks:{
  ...admittedReceipt.tasks,
  [bootstrapTask.key]:{ identity:bootstrapTask, status:"passed", provenance:"reused" },
} }, admissions), /fresh pass/i);
const flakyDiagnostic = {
  version:2, runIntent:"repair-focused", completedAt:"2026-08-19T12:11:15.280Z",
  registryDigest:"b".repeat(64),
  environment:{ node:"24.19.0", platform:"linux-x64" },
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree",
    baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
    changeSetDigest:"5".repeat(64) },
  artifact:{ schemaVersion:1, outputDigest:"7".repeat(64) },
  plan:{ mode:"timeout-diagnostic", requestedPackIds:[bootstrapTask.packId],
    selectedPackIds:[bootstrapTask.packId] },
  diagnostic:{ incidentId:"confirmed-flaky", retryIdentity:"8".repeat(64),
    registryDigest:"b".repeat(64),
    scope:{ kind:"task", executionArgs:bootstrapTask.args, logicalTargetIds:[] },
    resolvedDeadlines:{ VERIFICATION_COMMAND_TIMEOUT_MS:600000 } },
  tasks:{ [bootstrapTask.key]:{ identity:bootstrapTask, status:"passed", provenance:"fresh",
    execution:{ args:bootstrapTask.args, logicalTargetIds:[] } } },
};
const flakyDiagnosticBytes = Buffer.from(JSON.stringify(flakyDiagnostic));
const flakyIncident = {
  id:"confirmed-flaky", state:"unresolved", failureDigest:"9".repeat(64),
  failure:{ lineage:{ commit:"bootstrap-candidate", tree:"bootstrap-tree",
    baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
    changeSetDigest:"5".repeat(64) }, task:bootstrapTask, causalKey:"a".repeat(64),
    retryIdentity:"8".repeat(64), retryScope:flakyDiagnostic.diagnostic.scope,
    registryDigest:flakyDiagnostic.registryDigest,
    resolvedDeadlines:flakyDiagnostic.diagnostic.resolvedDeadlines,
    artifact:flakyDiagnostic.artifact, environment:flakyDiagnostic.environment },
  transitions:[{ type:"diagnostic-retry-claimed" },
    { type:"diagnostic-retry-classified", classification:"confirmed-flaky" }],
  retry:{ status:"classified", identity:"8".repeat(64), outcome:"passed",
    classification:"confirmed-flaky", receiptPath:"tmp/verification-receipts/flaky.json",
    receiptSha256:createHash("sha256").update(flakyDiagnosticBytes).digest("hex") },
};
const flakyAdmissions = await buildConfirmedFlakyAdmissions({ root:"fixture",
  incidents:[flakyIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
  receiptLoader:async()=>flakyDiagnosticBytes });
assert.deepEqual(flakyAdmissions.entries.map(({ incidentId, coverageKind, selectedTaskKey }) =>
  ({ incidentId, coverageKind, selectedTaskKey })), [{ incidentId:"confirmed-flaky",
  coverageKind:"governed-task", selectedTaskKey:bootstrapTask.key }]);
assert.equal(flakyAdmissions.entries[0].classificationDigest,
  timeoutIncidentDigest(flakyIncident.retry));
assert.equal(flakyAdmissions.entries[0].registryDigest, flakyDiagnostic.registryDigest);
const taskScopedDiagnostic = structuredClone(flakyDiagnostic);
delete taskScopedDiagnostic.diagnostic.scope.logicalTargetIds;
const taskScopedDiagnosticBytes = Buffer.from(JSON.stringify(taskScopedDiagnostic));
const taskScopedIncident = structuredClone(flakyIncident);
delete taskScopedIncident.failure.retryScope.logicalTargetIds;
taskScopedIncident.retry.receiptSha256 = createHash("sha256")
  .update(taskScopedDiagnosticBytes).digest("hex");
const taskScopedAdmissions = await buildConfirmedFlakyAdmissions({ root:"fixture",
  incidents:[taskScopedIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
  receiptLoader:async()=>taskScopedDiagnosticBytes });
assert.equal(taskScopedAdmissions.entries[0].incidentId, "confirmed-flaky",
  "ordinary task-scope retries admit exact receipts without logical target identifiers");
const rebasedFlakyIncident = structuredClone(flakyIncident);
rebasedFlakyIncident.lineageTransitions = [{ kind:"rebase",
  fromCommit:"bootstrap-candidate", toCommit:"rebased-candidate", toTree:"rebased-tree" }];
const rebasedFlakyAdmissions = await buildConfirmedFlakyAdmissions({ root:"fixture",
  incidents:[rebasedFlakyIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"rebased-candidate", tree:"rebased-tree" },
  baseCommit:"new-approved-base", evidenceTask:"confirmed-flaky-feature-deferral",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
  receiptLoader:async()=>flakyDiagnosticBytes });
assert.equal(rebasedFlakyAdmissions.baseCommit, "new-approved-base",
  "a validated terminal rebase binds fresh review evidence to the current QA base");
assert.equal(confirmedFlakyAdmissionCoversEvidenceCandidate({
  incident:rebasedFlakyIncident, commit:"rebased-candidate",
  admissions:rebasedFlakyAdmissions,
}), true, "the exact admitted incident may pass the pending-evidence blocker");
assert.equal(confirmedFlakyAdmissionCoversEvidenceCandidate({
  incident:rebasedFlakyIncident, commit:"rebased-candidate",
  admissions:{ ...rebasedFlakyAdmissions, entries:[{
    ...rebasedFlakyAdmissions.entries[0], classificationDigest:"0".repeat(64),
  }] },
}), false, "changed confirmed-flaky admission proof remains evidence-blocking");
await assert.rejects(()=>buildConfirmedFlakyAdmissions({ root:"fixture",
  incidents:[flakyIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"rebased-candidate", tree:"rebased-tree" },
  baseCommit:"new-approved-base", evidenceTask:"confirmed-flaky-feature-deferral",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
  receiptLoader:async()=>flakyDiagnosticBytes }), /exact conserved candidate/i,
"a candidate cannot advance its review base without the recorded rebase");
const flakyReceipt = { confirmedFlakyAdmissions:flakyAdmissions, tasks:admittedReceipt.tasks };
assert.equal(validateConfirmedFlakyAdmissionsReceipt(flakyReceipt, flakyAdmissions), flakyAdmissions);
assert.throws(()=>validateConfirmedFlakyAdmissionsReceipt(flakyReceipt, {
  ...flakyAdmissions, entries:[{ ...flakyAdmissions.entries[0], repairDigest:"b".repeat(64) }],
}), /malformed or causally conflicting/i, "confirmed-flaky evidence cannot invent repair proof");
const changedFlaky = structuredClone(flakyIncident);
changedFlaky.retry.classification = "reproduced";
await assert.rejects(()=>revalidateConfirmedFlakyAdmissions({ admissions:flakyAdmissions,
  phase:"before receipt finalization", root:"fixture", incidents:[changedFlaky],
  plan:bootstrapPlan, packs, candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
  receiptLoader:async()=>flakyDiagnosticBytes }), /not bound|changed/i);
for (const [name, mutate] of [
  ["registry", (receipt) => { receipt.registryDigest = "c".repeat(64); }],
  ["diagnostic registry", (receipt) => { receipt.diagnostic.registryDigest = "c".repeat(64); }],
  ["toolchain", (receipt) => { receipt.environment.node = "25.0.0"; }],
]) {
  const mutated = structuredClone(flakyDiagnostic);
  mutate(mutated);
  const mutatedBytes = Buffer.from(JSON.stringify(mutated));
  const mutationIncident = structuredClone(flakyIncident);
  mutationIncident.retry.receiptSha256 = createHash("sha256").update(mutatedBytes).digest("hex");
  await assert.rejects(()=>buildConfirmedFlakyAdmissions({ root:"fixture",
    incidents:[mutationIncident], plan:bootstrapPlan, packs,
    candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
    baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
    changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
    receiptLoader:async()=>mutatedBytes }), /diagnostic receipt is not exact/i,
  `${name} mutation invalidates confirmed-flaky admission`);
}
const legacyFlakyDiagnostic = structuredClone(flakyDiagnostic);
delete legacyFlakyDiagnostic.registryDigest;
delete legacyFlakyDiagnostic.diagnostic.registryDigest;
const legacyFlakyDiagnosticBytes = Buffer.from(JSON.stringify(legacyFlakyDiagnostic));
const legacyFlakyIncident = structuredClone(flakyIncident);
delete legacyFlakyIncident.failure.registryDigest;
legacyFlakyIncident.retry.receiptSha256 = createHash("sha256")
  .update(legacyFlakyDiagnosticBytes).digest("hex");
const immutableLegacyIncidentDigest = timeoutIncidentDigest(legacyFlakyIncident);
const immutableLegacyReceiptDigest = verificationDigest(legacyFlakyDiagnosticBytes);
const exactLegacyRegistryProof = async() => ({
  commit:legacyFlakyIncident.failure.lineage.commit,
  tree:legacyFlakyIncident.failure.lineage.tree,
  packs,
});
const legacyFlakyAdmissions = await buildConfirmedFlakyAdmissions({ root:"fixture",
  incidents:[legacyFlakyIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
  receiptLoader:async()=>legacyFlakyDiagnosticBytes,
  registryProofLoader:exactLegacyRegistryProof });
assert.equal(legacyFlakyAdmissions.entries[0].registryDigest, verificationDigest(packs),
  "the named legacy shape derives registry identity from its exact source candidate");
assert.equal(timeoutIncidentDigest(legacyFlakyIncident), immutableLegacyIncidentDigest,
  "legacy admission preserves the immutable incident");
assert.equal(verificationDigest(legacyFlakyDiagnosticBytes), immutableLegacyReceiptDigest,
  "legacy admission preserves the immutable diagnostic receipt bytes");
for (const [name, proof] of [
  ["changed commit", { commit:"changed-candidate", tree:"bootstrap-tree", packs }],
  ["changed tree", { commit:"bootstrap-candidate", tree:"changed-tree", packs }],
  ["missing registry", { commit:"bootstrap-candidate", tree:"bootstrap-tree" }],
  ["ambiguous registry", { commit:"bootstrap-candidate", tree:"bootstrap-tree",
    packs:[packs, packs] }],
]) {
  await assert.rejects(()=>buildConfirmedFlakyAdmissions({ root:"fixture",
    incidents:[legacyFlakyIncident], plan:bootstrapPlan, packs,
    candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
    baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
    changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
    receiptLoader:async()=>legacyFlakyDiagnosticBytes,
    registryProofLoader:async()=>proof }), /registry proof/i,
  `${name} fails legacy confirmed-flaky admission closed`);
}
const partialLegacyDiagnostic = structuredClone(legacyFlakyDiagnostic);
partialLegacyDiagnostic.registryDigest = verificationDigest(packs);
const partialLegacyBytes = Buffer.from(JSON.stringify(partialLegacyDiagnostic));
const partialLegacyIncident = structuredClone(legacyFlakyIncident);
partialLegacyIncident.retry.receiptSha256 = verificationDigest(partialLegacyBytes);
await assert.rejects(()=>buildConfirmedFlakyAdmissions({ root:"fixture",
  incidents:[partialLegacyIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
  receiptLoader:async()=>partialLegacyBytes,
  registryProofLoader:exactLegacyRegistryProof }), /diagnostic receipt is not exact/i,
"partial explicit registry evidence does not fall back to legacy derivation");
const promotionBootstrapRepair = structuredClone(exactBootstrapRepair);
promotionBootstrapRepair.id = "exact-promotion-bootstrap-repair";
promotionBootstrapRepair.terminalVerificationDeferred = {
  status:"terminal-verification-deferred",
  candidate:{ commit:"ancestor-candidate", tree:"ancestor-tree" },
};
promotionBootstrapRepair.failure.task = verificationTaskIdentity({
  key:"promotion:artifact-binding", stage:"promotion", executable:"internal", args:[],
  target:"artifact-binding",
});
promotionBootstrapRepair.failure.failureClass = "execution-contract-failure";
promotionBootstrapRepair.repair.regression.key = bootstrapTask.key;
const promotionRepairCoverage = await runIntentBootstrapCoverage({
  incidents:[promotionBootstrapRepair], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  resolveSuccession:async() => { throw new Error("promotion tasks must not invent succession"); },
  reviewIncidentProof:async() => ({
    sourceReceipt:promotionBootstrapRepair.failure.sourceReceipt,
    sourceReceiptSha256:"a".repeat(64),
  }),
});
assert.equal(promotionRepairCoverage[0].selectedTaskKey, bootstrapTask.key,
  "an internal promotion failure is covered by its exact causal regression leaf");
assert.equal(promotionRepairCoverage[0].repairRegressionKey, bootstrapTask.key);
assert.equal(promotionRepairCoverage[0].admission.kind, "exact-candidate-causal-repair",
  "a current exact repair supersedes its stale ancestor terminal deferral during bootstrap");
const deferredPromotionRepair = structuredClone(promotionBootstrapRepair);
deferredPromotionRepair.id = "deferred-promotion-bootstrap-repair";
deferredPromotionRepair.repair.candidate = {
  commit:"ancestor-candidate", tree:"ancestor-tree",
};
deferredPromotionRepair.repair.regression.commit = "ancestor-candidate";
deferredPromotionRepair.repair.focusedReceipt.commit = "ancestor-candidate";
const deferredPromotionCoverage = await runIntentBootstrapCoverage({
  incidents:[deferredPromotionRepair], plan:bootstrapPlan, packs,
  candidate:{ commit:"review-descendant", tree:"review-descendant-tree" },
  resolveSuccession:async() => { throw new Error("promotion tasks must not invent succession"); },
  reviewIncidentProof:async() => { throw new Error("deferred repairs do not require a new source proof"); },
});
assert.equal(deferredPromotionCoverage[0].selectedTaskKey, bootstrapTask.key,
  "a deferred internal promotion failure remains covered by its declared causal regression");
assert.equal(deferredPromotionCoverage[0].repairRegressionKey, bootstrapTask.key);
assert.equal(deferredPromotionCoverage[0].admission.kind, "terminal-deferred");
await assert.rejects(()=>runIntentBootstrapCoverage({ incidents:[exactBootstrapRepair],
  plan:bootstrapPlan, packs, candidate:{ commit:"later-candidate", tree:"later-tree" },
  reviewIncidentProof:async()=>({ sourceReceipt:"unused", sourceReceiptSha256:"b".repeat(64) }) }),
/ineligible incident/i, "a stale-candidate causal repair cannot enter bootstrap coverage");
await assert.rejects(()=>runIntentBootstrapCoverage({ incidents:[exactBootstrapRepair],
  plan:bootstrapPlan, packs, candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  reviewIncidentProof:async()=>null }), /ineligible incident/i,
"an eligible repair without a bootstrap review-evidence source remains blocking");
assert.equal(typeof bootstrapReviewIncidentProof, "function",
  "eligible repair revalidation is gated by immutable bootstrap review-receipt proof");
await assert.rejects(() => validateRunIntentBootstrapBase({
  root:"fixture", baseCommit:"implemented-base",
  changedPaths:["scripts/verification-run-intent.mjs"],
  readCommitFile:async(_root, _commit, file) => file.endsWith("modular-verification-packs.feature")
    ? "Modular verification packs 159\nModular verification packs 160\n"
    : "export const alreadyImplemented = true;\n",
}), /base without implementation/i,
"a future base containing the implementation cannot reuse bootstrap authority");
const bootstrapReceipt = {
  tasks:{
    [bootstrapTask.key]:{ identity:bootstrapTask, status:"passed", provenance:"fresh" },
    "package:canonical":{ identity:{ key:"package:canonical", stage:"package" },
      status:"passed", provenance:"fresh" },
  },
};
assert.equal(validateRunIntentBootstrapReceipt(bootstrapReceipt, {
  ...bootstrapBase, version:1, coverage:bootstrapCoverage,
}).coverage.length, 1);
assert.throws(() => validateRunIntentBootstrapReceipt({
  ...bootstrapReceipt,
  tasks:{ ...bootstrapReceipt.tasks,
    [bootstrapTask.key]:{ ...bootstrapReceipt.tasks[bootstrapTask.key], provenance:"reused" } },
}, { ...bootstrapBase, version:1, coverage:bootstrapCoverage }), /fresh pass/i);
const terminalPlan = planVerification(packs, { terminalFull:true });
const preparedTerminalPlan = planVerification(packs, { terminalFull:true, skipBuild:true });
const shellImpactPlan = planVerification(packs, {
  changedPaths:["features/portable-build-package-flow.feature"],
});
assert.equal(preparedTerminalPlan.preparationTasks.length, 0,
  "a prepared terminal aggregate does not rebuild");
const preparedFreshnessIndex = preparedTerminalPlan.checkpointTasks.findIndex(({ key }) =>
  key === "checkpoint:shell:prepared-dist-freshness");
const portablePackageIndex = preparedTerminalPlan.checkpointTasks.findIndex(({ key }) =>
  key === "checkpoint:shell:portable-package");
assert.ok(preparedFreshnessIndex >= 0 && preparedFreshnessIndex < portablePackageIndex,
  "prepared terminal aggregates receipt a fresh artifact before portable packaging");
assert.ok(shellPlan.preparationTasks.some(({ key }) => key === "build:dist"));
assert.ok(shellImpactPlan.preparationTasks.some(({ key }) => key === "build:dist"));
assert.equal(shellPlan.checkpointTasks.some(({ key }) =>
  key === "checkpoint:shell:prepared-dist-freshness"), false,
"an exact plan retains its real build task without the terminal-only fallback");
assert.equal(shellImpactPlan.checkpointTasks.some(({ key }) =>
  key === "checkpoint:shell:prepared-dist-freshness"), false,
"an impact plan retains its real build task without the terminal-only fallback");
for (const sharedBuildInput of [
  "package.json", "swarmforge/toolchain.lock.json", "scripts/build.mjs", "scripts/run-browser-observation.mjs",
  "architecture/data-layer-boundaries.json", "manifest.json", "src/side-panel-runtime.ts",
]) {
  assert.deepEqual(planVerification(packs, { changedPaths:[sharedBuildInput] }).packIds, terminalPlan.packIds,
    `${sharedBuildInput} conservatively selects every runnable pack`);
}
assert.equal(terminalPlan.checkpointCommands.includes("bb test:unit"), false,
  "terminal orchestration does not repeat its already completed Clojure unit lane");
import { registryPlannerPreparationTaskKeys } from "../../scripts/verification-policy/reliability/run-intent.mjs";
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
