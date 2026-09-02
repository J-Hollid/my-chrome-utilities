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
const syntheticArtifact = (inputDigest, outputDigest, toolchain) => {
  const schemaVersion = 1;
  const buildIdentity = createHash("sha256").update(`${JSON.stringify({
    schemaVersion, inputDigest, outputDigest, toolchain,
  })}\n`).digest("hex");
  return { schemaVersion, buildIdentity, inputDigest, outputDigest, toolchain };
};
const diagnosticArtifact = syntheticArtifact("1".repeat(64), "2".repeat(64),
  { node:process.versions.node, typescript:"5.9.3" });
assert.deepEqual(verificationArtifactIdentity({ ...diagnosticArtifact, inputs:[{ path:"extra" }] }),
  diagnosticArtifact,
"diagnostic and repair workflows compare the bounded artifact identity stored by incidents");
const cleanupCalls = [];
await removeVerificationFixtureRoot("/tmp/deterministic-verification-fixture", {
  remove:async(root, options) => cleanupCalls.push({ root, options }),
});
assert.deepEqual(cleanupCalls, [{
  root:"/tmp/deterministic-verification-fixture",
  options:{ recursive:true, force:true, maxRetries:8, retryDelay:50 },
}], "verification fixture cleanup tolerates bounded ENOTEMPTY races from terminating descendants");
const compatibleRepair = (id) => ({ id, repair:{ status:"eligible",
  candidate:{ commit:"repair-commit", tree:"repair-tree" },
  checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014-timeout-repair-gate" } } });
assert.deepEqual(compatibleTimeoutRepairIncidentIds({ requestedId:"incident-b",
  blocking:[compatibleRepair("incident-b"), compatibleRepair("incident-a")],
  candidateCommit:"repair-commit", candidateTree:"repair-tree", baseCommit:"approved-base",
  evidenceTask:"vtd014-timeout-repair-gate", requestedPackIds:timeoutRepairPackIds }),
["incident-a", "incident-b"],
"one canonical checkpoint resolves every compatible eligible incident on the candidate lineage");
const rebasedCompatible = { ...compatibleRepair("incident-rebased"),
  repair:{ ...compatibleRepair("incident-rebased").repair,
    candidate:{ commit:"failed-repair", tree:"failed-repair-tree" } },
  lineageTransitions:[{ kind:"rebase", fromCommit:"failed-repair",
    toCommit:"repair-commit", toTree:"repair-tree" }] };
assert.deepEqual(compatibleTimeoutRepairIncidentIds({ requestedId:"incident-rebased",
  blocking:[rebasedCompatible], candidateCommit:"repair-commit", candidateTree:"repair-tree",
  baseCommit:"approved-base", evidenceTask:"vtd014-timeout-repair-gate",
  requestedPackIds:timeoutRepairPackIds }), ["incident-rebased"],
"an explicitly rebased failed repair checkpoint can use its descendant repair candidate");
const boundedCompatible = { ...rebasedCompatible,
  closureAudit:{ kind:"blocking-verification-repair", blocking:true, resolved:false,
    failureDomain:"verification-execution" } };
assert.deepEqual(canonicalCheckpointBinding(boundedCompatible, { candidate:{
  commit:"repair-commit", tree:"repair-tree",
  baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
} }), { baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask },
"record validation uses the same frozen bounded-closure binding admitted by the launch gate");
assert.deepEqual(canonicalCheckpointBinding(rebasedCompatible, { candidate:{
  commit:"repair-commit", tree:"repair-tree",
  baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
} }), rebasedCompatible.repair.checkpoint,
"record validation preserves the original proposal binding for an unaudited incident");
assert.deepEqual(compatibleTimeoutRepairIncidentIds({ requestedId:"incident-rebased",
  blocking:[boundedCompatible], candidateCommit:"repair-commit", candidateTree:"repair-tree",
  baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
  requestedPackIds:timeoutRepairPackIds }), ["incident-rebased"],
"the frozen bounded closure checkpoint preserves an audited verifier repair's original proposal binding");
const boundedProductCompatible = { ...rebasedCompatible,
  closureAudit:{ kind:"blocking-product-repair", blocking:true, resolved:false,
    failureDomain:"product-runtime" } };
assert.deepEqual(canonicalCheckpointBinding(boundedProductCompatible, { candidate:{
  commit:"repair-commit", tree:"repair-tree",
  baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
} }), { baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask },
"record validation uses the frozen bounded-closure binding admitted for audited product repairs");
assert.deepEqual(compatibleTimeoutRepairIncidentIds({ requestedId:"incident-rebased",
  blocking:[boundedProductCompatible], candidateCommit:"repair-commit", candidateTree:"repair-tree",
  baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
  requestedPackIds:timeoutRepairPackIds }), ["incident-rebased"],
"the frozen bounded closure checkpoint retains an audited eligible product repair");
const descendantClosurePolicy = await createTerminalClosurePolicy({
  root:"unused", baseCommit:"current-master", evidenceTask:boundedClosureEvidenceTask,
  candidateCommit:"repair-commit", candidateTree:"repair-tree",
  isAncestor:async(ancestor, commit) => ancestor === boundedClosureContractRevision &&
    commit === "current-master",
});
assert.equal(terminalClosurePolicyValid(descendantClosurePolicy, {
  baseCommit:"current-master", evidenceTask:boundedClosureEvidenceTask,
  candidateCommit:"repair-commit", candidateTree:"repair-tree",
}), true, "a sealed policy binds the current base descendant and exact repair candidate");
assert.deepEqual(compatibleTimeoutRepairIncidentIds({ requestedId:"incident-rebased",
  blocking:[boundedProductCompatible], candidateCommit:"repair-commit", candidateTree:"repair-tree",
  baseCommit:"current-master", evidenceTask:boundedClosureEvidenceTask,
  requestedPackIds:timeoutRepairPackIds, closurePolicy:descendantClosurePolicy,
}), ["incident-rebased"],
"the bounded closure accepts a current master base only with frozen-contract ancestry proof");
assert.deepEqual(canonicalCheckpointBinding(boundedProductCompatible, {
  candidate:{ commit:"repair-commit", tree:"repair-tree", baseCommit:"current-master",
    evidenceTask:boundedClosureEvidenceTask },
  timeoutRepairCheckpoint:{ closurePolicy:descendantClosurePolicy },
}), { baseCommit:"current-master", evidenceTask:boundedClosureEvidenceTask },
"receipt validation preserves the sealed current-base closure binding");
assert.equal(await createTerminalClosurePolicy({
  root:"unused", baseCommit:"unrelated-base", evidenceTask:boundedClosureEvidenceTask,
  candidateCommit:"repair-commit", candidateTree:"repair-tree", isAncestor:async() => false,
}), undefined, "an unrelated current base cannot receive bounded closure authority");
await assert.rejects(async() => compatibleTimeoutRepairIncidentIds({
  requestedId:"incident-rebased", blocking:[boundedProductCompatible],
  candidateCommit:"repair-commit", candidateTree:"repair-tree", baseCommit:"unrelated-base",
  evidenceTask:boundedClosureEvidenceTask, requestedPackIds:timeoutRepairPackIds,
}), /incompatible reliability incident/u,
"a current base without frozen-contract ancestry proof cannot consume audited repairs");
await assert.rejects(async() => compatibleTimeoutRepairIncidentIds({
  requestedId:"incident-rebased", blocking:[boundedProductCompatible],
  candidateCommit:"repair-commit", candidateTree:"repair-tree", baseCommit:"current-master",
  evidenceTask:"ordinary-review", requestedPackIds:timeoutRepairPackIds,
  closurePolicy:descendantClosurePolicy,
}), /incompatible reliability incident/u,
"a sealed descendant policy cannot authorize another evidence task");
await assert.rejects(async() => compatibleTimeoutRepairIncidentIds({
  requestedId:"incident-rebased", blocking:[{ ...boundedProductCompatible,
    closureAudit:{ ...boundedProductCompatible.closureAudit, blocking:false } }],
  candidateCommit:"repair-commit", candidateTree:"repair-tree", baseCommit:"current-master",
  evidenceTask:boundedClosureEvidenceTask, requestedPackIds:timeoutRepairPackIds,
  closurePolicy:descendantClosurePolicy,
}), /incompatible reliability incident/u,
"the bounded closure rejects a repair without an exact blocking audit");
const terminalBootstrapTask = { key:"unit:test/bootstrap-contract-test.mjs", stage:"unit",
  packId:"verification_process", executable:"node", args:["test/bootstrap-contract-test.mjs"],
  target:"test/bootstrap-contract-test.mjs", environment:null, requiredCapabilities:[] };
const bootstrapFailureDigest = "b".repeat(64);
const bootstrapSourceCandidate = { commit:"bootstrap-source", tree:"bootstrap-tree" };
const bootstrapDeferredUnsigned = {
  status:"terminal-verification-deferred", candidate:bootstrapSourceCandidate,
  basis:"bootstrap-terminal-obligation", failureDigest:bootstrapFailureDigest,
  reviewReady:{ task:"bootstrap-review", baseCommit:"bootstrap-base",
    candidateCommit:bootstrapSourceCandidate.commit, candidateTree:bootstrapSourceCandidate.tree,
    receiptSha256:"c".repeat(64), focusedTaskKeys:["unit:test/bootstrap-contract-test.mjs"] },
  runIntentBootstrap:{ version:1, baseCommit:"bootstrap-base",
    candidateCommit:bootstrapSourceCandidate.commit, candidateTree:bootstrapSourceCandidate.tree,
    coverage:[{ incidentId:"incident-bootstrap", failureDigest:bootstrapFailureDigest,
      admission:{ kind:"bootstrap-terminal-obligation", failureDigest:bootstrapFailureDigest,
        sourceReceiptSha256:"d".repeat(64), sourcePlanDigest:"e".repeat(64),
        sourceCommit:"failure-commit" },
      failureTaskKey:terminalBootstrapTask.key,
      failureTaskDigest:verificationTaskDigest(terminalBootstrapTask),
      selectedTaskKey:null, selectedTaskDigest:null, terminalObligation:true }] },
  eligibleRepairTransaction:{ version:1, id:"f".repeat(64), inputDigest:"1".repeat(64) },
  package:{ path:"build/package/my-chrome-utilities.zip", digest:"2".repeat(64) },
  recordedAt:"2026-08-30T00:00:00.000Z",
};
const exactBootstrap = {
  id:"incident-bootstrap", failureDigest:bootstrapFailureDigest,
  failure:{ planDigest:"e".repeat(64), task:terminalBootstrapTask,
    lineage:{ commit:"failure-commit", tree:"failure-tree" } },
  terminalVerificationDeferred:{ ...bootstrapDeferredUnsigned,
    digest:timeoutIncidentDigest(bootstrapDeferredUnsigned) },
  lineageTransitions:[{ kind:"rebase", fromCommit:"bootstrap-source",
    toCommit:"repair-commit", toTree:"repair-tree" }],
  closureAudit:{ kind:"blocking-product-repair", blocking:true, resolved:false,
    failureDomain:"product-runtime" },
};
assert.equal(exactBootstrapTerminalObligation(exactBootstrap), true,
"the bootstrap terminal obligation retains exact source, failure, review, and candidate proof");
assert.deepEqual(terminalLineageSource(exactBootstrap), bootstrapSourceCandidate,
"the persistence boundary uses the exact bootstrap candidate as its governed lineage source");
assert.deepEqual(compatibleTimeoutRepairIncidentIds({ requestedId:"incident-bootstrap",
  blocking:[exactBootstrap], candidateCommit:"repair-commit", candidateTree:"repair-tree",
  baseCommit:"current-master", evidenceTask:boundedClosureEvidenceTask,
  requestedPackIds:timeoutRepairPackIds, closurePolicy:descendantClosurePolicy,
}), ["incident-bootstrap"], "the audited exact bootstrap obligation can use the bounded checkpoint");
for (const [name, changed] of [
  ["failure digest", { failureDigest:"3".repeat(64) }],
  ["candidate tree", { candidate:{ ...bootstrapSourceCandidate, tree:"changed-tree" } }],
  ["review proof", { reviewReady:{ ...bootstrapDeferredUnsigned.reviewReady,
    receiptSha256:"invalid" } }],
]) {
  const invalid = { ...exactBootstrap, terminalVerificationDeferred:{
    ...exactBootstrap.terminalVerificationDeferred, ...changed,
  } };
  assert.equal(exactBootstrapTerminalObligation(invalid), false,
    `a changed bootstrap ${name} is rejected`);
}
await assert.rejects(async() => compatibleTimeoutRepairIncidentIds({
  requestedId:"incident-bootstrap", blocking:[exactBootstrap],
  candidateCommit:"repair-commit", candidateTree:"repair-tree", baseCommit:"bootstrap-base",
  evidenceTask:"bootstrap-review", requestedPackIds:timeoutRepairPackIds,
}), /incompatible reliability incident/u,
"ordinary review cannot consume a bootstrap terminal obligation");
const boundedConfirmedFlakyCompatible = {
  id:"incident-confirmed-flaky-rebased",
  terminalVerificationDeferred:{
    basis:"confirmed-flaky",
    candidate:{ commit:"failed-repair", tree:"failed-repair-tree" },
    reviewReady:{ baseCommit:"approved-base", task:"vtd014-timeout-repair-gate" },
  },
  lineageTransitions:[{ kind:"rebase", fromCommit:"failed-repair",
    toCommit:"repair-commit", toTree:"repair-tree" }],
  closureAudit:{ kind:"blocking-product-repair", blocking:true, resolved:false,
    failureDomain:"product-runtime" },
};
assert.deepEqual(compatibleTimeoutRepairIncidentIds({ requestedId:"incident-confirmed-flaky-rebased",
  blocking:[boundedConfirmedFlakyCompatible], candidateCommit:"repair-commit", candidateTree:"repair-tree",
  baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
  requestedPackIds:timeoutRepairPackIds }), ["incident-confirmed-flaky-rebased"],
"the bounded closure checkpoint follows an audited confirmed-flaky rebase to the selected candidate");
const directTerminalConfirmedFlaky = {
  id:"incident-terminal-confirmed-flaky",
  failure:{ retryIdentity:"retry-identity", lineage:{
    commit:"failed-repair", tree:"failed-repair-tree",
    baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
  } },
  retry:{ status:"classified", identity:"retry-identity", outcome:"passed",
    classification:"confirmed-flaky" },
  lineageTransitions:[{ kind:"rebase", fromCommit:"failed-repair",
    toCommit:"repair-commit", toTree:"repair-tree" }],
  closureAudit:{ kind:"blocking-product-repair", blocking:true, resolved:false,
    failureDomain:"product-runtime" },
};
assert.deepEqual(compatibleTimeoutRepairIncidentIds({
  requestedId:"incident-terminal-confirmed-flaky", blocking:[directTerminalConfirmedFlaky],
  candidateCommit:"repair-commit", candidateTree:"repair-tree",
  baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
  requestedPackIds:timeoutRepairPackIds,
}), ["incident-terminal-confirmed-flaky"],
"the bounded closure checkpoint directly consumes its own classified confirmed-flaky failure");
await assert.rejects(async() => compatibleTimeoutRepairIncidentIds({
  requestedId:"incident-terminal-confirmed-flaky", blocking:[directTerminalConfirmedFlaky],
  candidateCommit:"repair-commit", candidateTree:"repair-tree",
  baseCommit:"ordinary-base", evidenceTask:"ordinary-review",
  requestedPackIds:timeoutRepairPackIds,
}), /incompatible reliability incident/u,
"ordinary review cannot consume an undeferred confirmed-flaky terminal failure");
const admissionEligible = (id, closureAudit) => ({
  id, state:"unresolved", repair:{ status:"eligible" },
  ...(closureAudit ? { closureAudit } : {}),
});
const auditedAdmissionRepair = admissionEligible("incident-audited", {
  kind:"blocking-product-repair", blocking:true, resolved:false,
  failureDomain:"product-runtime",
});
const ordinaryAdmissionRepair = admissionEligible("incident-ordinary");
const boundedAdmissionPartition = reliabilityAdmissionPartition({
  incidents:[auditedAdmissionRepair, ordinaryAdmissionRepair],
  baseCommit:boundedClosureContractRevision,
  evidenceTask:boundedClosureEvidenceTask,
});
assert.deepEqual(boundedAdmissionPartition.eligibleCandidates.map(({ id }) => id),
  ["incident-ordinary"],
"bounded closure does not redundantly re-admit an audited eligible repair");
assert.deepEqual(boundedAdmissionPartition.auditedCandidates.map(({ id }) => id),
  ["incident-audited"],
"bounded closure exposes audited repair identities to complete-population revalidation");
assert.equal(boundedAdmissionPartition.admittedIds.has("incident-audited"), true,
"an audited eligible repair remains an admitted bounded-closure obligation");
assert.deepEqual(reliabilityAdmissionPartition({
  incidents:[auditedAdmissionRepair, ordinaryAdmissionRepair],
  baseCommit:"ordinary-base", evidenceTask:"ordinary-review",
}).eligibleCandidates.map(({ id }) => id), ["incident-audited", "incident-ordinary"],
"ordinary review preserves eligible repair admission behavior");
const ordinaryAuditedPartition = reliabilityAdmissionPartition({
  incidents:[auditedAdmissionRepair, ordinaryAdmissionRepair],
  baseCommit:"ordinary-base", evidenceTask:"ordinary-review",
});
assert.deepEqual(createBlockedAggregateAdmissionSnapshot({
  incidents:[auditedAdmissionRepair, ordinaryAdmissionRepair], ...ordinaryAuditedPartition,
}).entries.map(({ id, admissionClass }) => [id, admissionClass]), [
  ["incident-audited", "audited-repair-closure"],
  ["incident-ordinary", "eligible-repair"],
], "the complete snapshot binds an audited closure distinctly while ordinary eligible proof remains");
await assert.rejects(async() => compatibleTimeoutRepairIncidentIds({
  requestedId:"incident-rebased", blocking:[rebasedCompatible], candidateCommit:"repair-commit",
  candidateTree:"repair-tree", baseCommit:boundedClosureContractRevision,
  evidenceTask:boundedClosureEvidenceTask, requestedPackIds:timeoutRepairPackIds,
}), /incompatible reliability incident incident-rebased/u,
"the bounded closure checkpoint cannot carry an unaudited repair proposal");
await assert.rejects(async() => compatibleTimeoutRepairIncidentIds({ requestedId:"incident-a",
  blocking:[compatibleRepair("incident-a"), { ...compatibleRepair("incident-b"), repair:undefined }],
  candidateCommit:"repair-commit", candidateTree:"repair-tree", baseCommit:"approved-base",
  evidenceTask:"vtd014-timeout-repair-gate", requestedPackIds:timeoutRepairPackIds }),
/incompatible reliability incident incident-b/u,
"an unresolved incident without a compatible eligible repair still blocks the checkpoint");
const exerciseDeadOwnerLockFixture = ({ reclaimDeadOwner }) => {
  const lock = { owner:{ pid:4102, alive:false }, waiters:[{ pid:4103 }] };
  if (!lock.owner.alive && reclaimDeadOwner) {
    lock.owner = lock.waiters.shift();
    return { outcome:"acquired", ownerPid:lock.owner.pid, remainingWaiters:lock.waiters.length };
  }
  return { outcome:"blocked", ownerPid:lock.owner.pid, remainingWaiters:lock.waiters.length };
};
const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);
import { registryPlannerPreparationTaskKeys } from "../../scripts/verification-policy/reliability/run-intent.mjs";
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
