import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, chmod, copyFile, mkdtemp, mkdir, readFile, readdir, realpath, rename, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import "../acceptance/side-panel-browser-session-contract.mjs";
import {
  acquireDistArtifactLock,
  distArtifactLeaseEnvironment,
  withDistArtifactLock,
} from "../../scripts/dist-artifact-lock.mjs";
import {
  decideBrowserObservationWorkers,
  deterministicBrowserWorkerSchedule,
} from "../../scripts/shared-artifact-parallel.mjs";
import {
  assertFreshDistArtifact, createDistInputFingerprint, writeDistArtifactManifest,
} from "../../scripts/dist-artifact.mjs";
import {
  selectedBrowserTargetConfigurations,
  summarizeBrowserTargetResults,
} from "../support/browser-target-session.mjs";
import {
  canonicalVerificationChangeSet, verificationPacksAtCommit,
} from "../../scripts/verification-changes.mjs";
import { intentOwnershipReadiness } from "../../scripts/verification-ownership-readiness-core.mjs";
import {
  browserTargetConfigurations,
  completeBrowserObservationOutput,
  exactObservationEnvironment,
  parseBrowserObservationBatchOutput,
  parseBrowserObservationOutput,
  validateBrowserObservationBatch,
} from "../../scripts/run-browser-observation.mjs";
import { removeVerificationFixtureRoot } from "../../scripts/verification-fixture-cleanup.mjs";
import {
  boundedStageMilliseconds,
  checkVerificationPerformanceBudgets,
  compareTimingEnvironmentClasses,
  estimatePlanMilliseconds,
  estimateTaskTiming,
  flowExamplesCharacterization,
  loadVerificationReceipts,
  measuredTimingModel,
  refreshVerificationPerformanceBudgets,
  reportVerificationThroughput,
  validateVerificationPerformanceCalibrationSnapshot,
  verificationPerformanceCalibration,
} from "../../scripts/report-verification-throughput.mjs";
import {
  archiveCanonicalReceiptCandidates,
  buildCanonicalTimingLedger,
  canonicalEnvironmentClassId,
  formatCanonicalTimingLedgerSummary,
  timingMaturity,
} from "../../scripts/verification-timing-ledger.mjs";
import {
  compatibleTimeoutRepairIncidentIds,
  applyCheckpointPrerequisitePlan,
  bindVerificationChangeScope,
  checkpointPreflight,
  closeVerificationPlanPrerequisites,
  createCheckpointIdentityGuard,
  createRepositoryCheckpointIdentityGuard,
  createVerificationCommandRunner,
  createVerificationReceiptContext,
  coordinatorArtifactLeaseRequired,
  executeTimeoutRepairTaskPlan,
  enforceTerminalClosureReceipt,
  focusedAcceptanceOptions,
  planPackageTask,
  selectFocusedVerificationTasks,
  prepareCheckpointExecution,
  reliabilityAdmissionPartition,
  reviewReadyScopeGuardRequired,
  resumeVerificationPlan,
  runTimeoutRepairFocused,
  runTimeoutDiagnosticRetry,
  validateCurrentArtifactForConsumers,
  validateExplicitChangedPaths,
  validateRegistryCardinalityReviewPreflight,
  verificationArtifactIdentity,
  verificationPromotionTasks,
  verificationResumeIdentity,
} from "../../scripts/run-focused-acceptance.mjs";
import {
  candidatePredatesRunIntentImplementation,
  closeCanonicalEvidencePlanPrerequisites,
  createPendingVerificationEvidence,
  firstCanonicalDifference,
  legacyArchivedCheckpointTaskIdentities,
  legacyAcceptanceSessionPrerequisiteCompatibility,
  preflightGitNotePromotion,
  probeGitMetadataWrite,
  recordPendingVerificationEvidence,
  requireEvidenceReceiptRunIntent,
  validateVerificationCandidateClean,
  validateVerificationEvidenceCompatibility,
  verificationEvidence,
  verificationDigest,
  verifyVerificationEvidence,
} from "../../scripts/verification-evidence.mjs";
import {
  browserAdapterUsesSharedHarness,
  browserObservationEvidenceLeaves,
  browserObservationSessionBatch,
  clojureRequiresNamespace,
  executeAcceptancePlan,
  loadVerificationPacks,
  planVerification,
  stylesheetDeclarationFor,
  stylesheetPlanFor,
  staticallyResolvableModuleImports,
  validateBrowserPerformanceDeclarations,
  validateBrowserObservationBatches,
  validateBrowserEvidencePartitions,
  validateIsolatedVerificationHandlers,
  validateVerificationPacks,
  verificationInventory,
  verificationOwner,
  verificationTaskIdentity,
} from "../../scripts/verification-packs.mjs";
import { validateStylesheetDeclarations } from "../../scripts/verification-styles.mjs";
import {
  classifyHistoricalTimeoutFixture,
  createTimeoutIncidentStore,
  createVerificationProgressTracker,
  diagnosticRetryScope,
  reliabilityFailureFingerprint,
  resolvedVerificationDeadlines,
  timeoutIncidentDigest,
  timeoutRepairCausalCategory,
  timeoutRepairDiagnosedBoundary,
  timeoutRepairFocusedExecutionTaskPlan,
  timeoutRepairPackageTaskIdentity,
  timeoutRepairPackIds,
  timeoutRepairFocusedTaskPlan,
  timeoutResolutionEvidence,
  validateTimeoutRepairProposal,
  verificationProgressEmitter,
} from "../../scripts/verification-reliability-incidents.mjs";
import { canonicalCheckpointBinding } from "../../scripts/verification-reliability-receipts.mjs";
import { confirmedFlakyAdmissionCoversEvidenceCandidate } from
  "../../scripts/verification-reliability-evidence-policy.mjs";
import {
  bindRunIntentBootstrapPlan,
  buildConfirmedFlakyAdmissions,
  buildEligibleRepairAdmissions,
  bootstrapReviewIncidentProof,
  classifyLegacyIncidentRunIntent,
  eligibleRepairAdmissionCandidates,
  governedRepairAttemptAssociation,
  revalidateConfirmedFlakyAdmissions,
  revalidateEligibleRepairAdmissions,
  registryPlannerPreparationFocusedPlan,
  requireVerificationRunIntent,
  runIntentBootstrapCoverage,
  validateEligibleRepairAdmissionsReceipt,
  validateConfirmedFlakyAdmissionsReceipt,
  validateRunIntentBootstrapBase,
  validateRunIntentBootstrapReceipt,
  verificationRegistryPlannerBootstrapEligibility,
  verificationRunIntent,
  verificationRunIntents,
} from "../../scripts/verification-run-intent.mjs";
import {
  persistBootstrapTerminalObligationSourceReceipt,
  readBootstrapTerminalObligationSourceReceipt,
  verifyCommittedReviewTransaction,
} from "../../scripts/settled-final-verification.mjs";
import {
  browserTargetSuccessionBoundary, loadTaskSuccessionGraph, resolveIncidentTaskSuccession,
  resolveTaskSuccessionGraph, taskSuccessionBoundaryDigest, validateUnresolvedIncidentTaskSuccession,
  verificationTaskDigest,
} from "../../scripts/verification-task-succession.mjs";
import {
  defaultRepositoryRuntimeDirectory, defaultStoreDirectory, validateIncident,
} from "../../scripts/verification-reliability-persistence.mjs";
import { verificationPolicyContracts } from "../../scripts/verification-policy/contracts.mjs";
import {
  terminalProjectionCoverage,
  terminalProjectionCoverageValid,
} from "../../scripts/verification-reliability-deferred.mjs";
import {
  recordEligibleIncidentDeferral,
  reviewAdmissionTransactionOwnsDeferrals,
} from "../../scripts/verification-reliability-runtime.mjs";
import {
  boundedClosureContractRevision,
  boundedClosureEvidenceTask,
  causalFailureIdentity,
  classifyReliabilityFailureDomain,
  closureDisposition,
  completeTaskInputClosure,
  inputEquivalentTaskProof,
  reliabilityFailureContract,
  terminalClosureExecution,
} from "../../scripts/verification-reliability-closure.mjs";
import {
  classifyExecutionRestriction,
  consumeVerificationLaunchAuthorization,
  createVerificationLaunchAuthorizations,
  expandVerificationTaskPrerequisites,
  normalizeBrowserPrerequisiteTasks,
  preflightExecutionPrerequisites,
  probeExecutionPrerequisiteEnvironment,
  verificationPrerequisiteKindRegistry,
  verificationRunnerModeRegistry,
  validateTaskExecutionPrerequisites,
} from "../../scripts/verification-execution-prerequisites.mjs";
import {
  canonicalFlowReloadIdentity,
  classifyFlowReloadModes,
  flowReloadCausalKey,
  observeFlowReloadLifecycle,
} from "../../scripts/flow-reload-lifecycle.mjs";
import {
  stylesheetRuleInventory,
  verifyFlowStylesheetConservation,
} from "../../scripts/flow-stylesheet-conservation.mjs";
import {
  checkpointAttemptInputIdentity,
  checkpointAttemptIdentity,
  createCheckpointAttemptStore,
  defaultCheckpointAttemptDirectory,
} from "../../scripts/verification-checkpoint-attempt.mjs";

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

assert.throws(() => planVerification(synthetic, {
  packIds:["alpha"], changedPaths:["src/beta/change.ts"],
}), /outside the explicit pack set/u);

assert.deepEqual(planVerification(synthetic, { packIds:["alpha"] }).packIds, ["alpha"],
  "an ordinary exact pack remains exact when no changed-path boundary is requested");

for (const verificationPath of [
  "test/alpha-one-test.mjs",
]) {
  assert.deepEqual(planVerification(synthetic, {
    packIds:["alpha"], changedPaths:[verificationPath],
  }).packIds, ["alpha"],
  `verification-only change remains exact to its owning pack: ${verificationPath}`);
}

for (const focusedPolicyPath of [
  "scripts/settled-final-verification-policy.mjs",
  "scripts/verification-packs.mjs",
  "scripts/verification-reliability-runtime.mjs",
  "scripts/verification-reliability-store.mjs",
]) {
  assert.deepEqual(planVerification(synthetic, {
    changedPaths:[focusedPolicyPath],
  }).packIds, ["process"],
  "the policy path keeps ordinary process ownership without an explicit focused pack");
  const focusedPolicyPlan = planVerification(synthetic, {
    packIds:["alpha", "beta"],
    changedPaths:["src/alpha/change.ts", focusedPolicyPath],
  });
  assert.deepEqual(focusedPolicyPlan.packIds, ["alpha", "beta"],
    "the closed focused-policy set does not expand an authorized feature checkpoint");
  assert.deepEqual(focusedPolicyPlan.changedOwners[focusedPolicyPath], [],
    "the closed focused-policy path stays visible without a product-pack owner");
  const canonicalPolicyPlan = planVerification(synthetic, {
    packIds:["alpha", "beta", "process"], changedPaths:[focusedPolicyPath],
  });
  assert.deepEqual(canonicalPolicyPlan.changedOwners[focusedPolicyPath],
    ["process"],
  "canonical runnable-pack planning retains the policy path's ordinary ownership");
}

assert.deepEqual(planVerification(synthetic, {
  packIds:["alpha", "beta", "process"],
  changedPaths:["src/alpha/change.ts", "scripts/run-focused-acceptance.mjs"],
}).packIds, ["alpha", "beta", "process"],
"the central runner remains outside the closed focused-policy exception");

assert.throws(() => planVerification(synthetic, {
  packIds:["alpha"], changedPaths:["src/alpha/change.ts"],
}), /outside the explicit pack set: beta/u,
  "an explicit changed-path boundary cannot omit a transitive consumer");

const exactImpact = planVerification(synthetic, {
  packIds:["alpha", "beta"], changedPaths:["src/alpha/change.ts"],
});

assert.deepEqual(exactImpact.packIds, ["alpha", "beta"]);

assert.deepEqual(exactImpact.changedOwners["src/alpha/change.ts"], ["alpha", "beta"],
  "the accepted exact boundary records the complete owner-and-consumer closure");

assert.deepEqual(planVerification(synthetic, { packIds:["beta"] }).packIds, ["beta"]);

assert.deepEqual(planVerification(synthetic, {
  packIds:["beta"], withDependencies:true,
}).packIds, ["alpha", "beta"],
  "--with-dependencies remains an explicit upstream expansion distinct from changed-path consumers");

const impact = planVerification(synthetic, { changedPaths:["src/alpha/change.ts"] });

import { expandVerificationDependencies } from "../../scripts/verification-planner/dependencies/expand.mjs";

const dependencyFixturePack = (id, overrides = {}) => ({
  id, source:[`src/${id}/`], process:[], globalImpact:[], dependencies:[], sharedComponents:[],
  unit:[`test/${id}-test.mjs`], property:[], features:[], handlers:[], browserAdapters:[],
  browserAdapterModes:[], browserObservations:[], checkpointCommands:[], ...overrides,
});

const dependencyFixturePacks = [dependencyFixturePack("base"),
  dependencyFixturePack("consumer", { dependencies:["base"] })];

assert.deepEqual([...expandVerificationDependencies(dependencyFixturePacks, ["consumer"])].sort(),
  ["base", "consumer"],
"dependency closure includes every transitive predecessor");

assert.throws(() => expandVerificationDependencies(dependencyFixturePacks, ["missing"]),
  /Register every direct dependency/u, "unknown dependency identities fail closed");
