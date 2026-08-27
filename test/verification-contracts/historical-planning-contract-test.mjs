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

const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});

const syntheticArtifact = (inputDigest, outputDigest, toolchain) => {
  const schemaVersion = 1;
  const buildIdentity = createHash("sha256").update(`${JSON.stringify({
    schemaVersion, inputDigest, outputDigest, toolchain,
  })}\n`).digest("hex");
  return { schemaVersion, buildIdentity, inputDigest, outputDigest, toolchain };
};

const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);

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

const feature = planVerification(synthetic, { changedPaths:["features/alpha-one.feature"] });

assert.deepEqual(feature.features, [
  "features/alpha-one.feature", "features/alpha-two.feature",
  "features/beta-one.feature", "features/beta-two.feature",
]);

assert.deepEqual(feature.observationTasks.map(({ key }) => key), ["browser-observation:ALPHA_BROWSER_ADAPTER"]);

assert.deepEqual(feature.checkpointTasks.map(({ key }) => key), ["checkpoint:alpha:alpha-check"]);

assert.ok(feature.tasks.every(({ executable, args, key }) => executable && Array.isArray(args) && key));

assert.equal(new Set(feature.tasks.map(({ key }) => key)).size, feature.tasks.length);

const global = planVerification(synthetic, {
  changedPaths:["acceptance/src/acceptance/pack_session.clj"],
});

assert.deepEqual(global.packIds, ["alpha", "beta", "process"],
  "shared acceptance framework changes conservatively select all acceptance consumers plus owner");

const syntheticChangeSet = (entries) => ({
  version:1,
  baseCommit:"1".repeat(40),
  commit:"2".repeat(40),
  entries,
  paths:[...new Set(entries.flatMap((entry) => entry.oldPath
    ? [entry.oldPath, entry.newPath]
    : [entry.path]))].sort(),
});

const evidenceBoundaryOptions = focusedAcceptanceOptions([
  "--pack", "alpha", "--pack", "beta", "--changed-since", "base",
  "--prepare-evidence", "consumer-boundary", "--property",
]);

const alphaAddition = syntheticChangeSet([{ status:"A", path:"src/alpha/new.ts" }]);

assert.throws(() => planVerification(synthetic, {
  packIds:["alpha"], changedPaths:alphaAddition.paths, changeSet:alphaAddition,
  basePacks:synthetic, includeProperties:true,
}), /outside the explicit pack set: beta/u,
  "changed-since evidence cannot claim an incomplete exact pack boundary");

const completeEvidenceBoundary = planVerification(synthetic, {
  packIds:evidenceBoundaryOptions.packIds, changedPaths:alphaAddition.paths,
  changeSet:alphaAddition, basePacks:synthetic,
  includeProperties:evidenceBoundaryOptions.includeProperties,
});

assert.deepEqual(completeEvidenceBoundary.requestedPackIds, ["alpha", "beta"]);

assert.deepEqual(completeEvidenceBoundary.selectedPackIds, ["alpha", "beta"],
  "the complete explicit consumer boundary remains eligible for exact evidence");

const syntheticRegistryChange = syntheticChangeSet([{ status:"M", path:"verification/packs.json" }]);

const runnableSyntheticBoundary = planVerification(synthetic, {
  packIds:["alpha", "beta", "process"], changedPaths:syntheticRegistryChange.paths,
  changeSet:syntheticRegistryChange, basePacks:synthetic,
});

assert.deepEqual(runnableSyntheticBoundary.packIds, ["alpha", "beta", "process"]);

assert.deepEqual(runnableSyntheticBoundary.changedOwners["verification/packs.json"],
  ["alpha", "beta", "process"],
  "force-all traversal does not require a nonrunnable dependant as an explicit selector");

const bridgedConsumerPacks = [
  pack("alpha"),
  pack("bridge", {
    source:[], unit:[], features:[], handlers:[], dependencies:["alpha"],
  }),
  pack("gamma", { dependencies:["bridge"] }),
];

assert.deepEqual(planVerification(bridgedConsumerPacks, {
  packIds:["alpha", "gamma"], changedPaths:["src/alpha/change.ts"],
}).changedOwners["src/alpha/change.ts"], ["alpha", "gamma"],
  "consumer closure traverses a nonrunnable intermediary to retain runnable downstream consumers");

const currentOwnershipPacks = [
  pack("alpha", { unit:["test/alpha-current-test.mjs"] }),
  pack("beta", { unit:["test/beta-current-test.mjs"] }),
];

const formerOwnershipPacks = [
  pack("alpha", { unit:["test/former-alpha-test.mjs"] }),
  pack("beta", { unit:["test/beta-current-test.mjs"], dependencies:["alpha"] }),
];

const deletedChange = syntheticChangeSet([{ status:"D", path:"test/former-alpha-test.mjs" }]);

assert.deepEqual(planVerification(currentOwnershipPacks, {
  changedPaths:deletedChange.paths, changeSet:deletedChange, basePacks:formerOwnershipPacks,
}).packIds, ["alpha", "beta"],
  "a deleted exact leaf retains its historical owner and historical consumer closure");

assert.throws(() => planVerification(currentOwnershipPacks, {
  packIds:["alpha"], changedPaths:deletedChange.paths,
  changeSet:deletedChange, basePacks:formerOwnershipPacks,
}), /outside the explicit pack set: beta/u);

assert.deepEqual(planVerification(currentOwnershipPacks, {
  packIds:["alpha", "beta"], changedPaths:deletedChange.paths,
  changeSet:deletedChange, basePacks:formerOwnershipPacks,
}).packIds, ["alpha", "beta"]);

const renamedChange = syntheticChangeSet([{
  status:"R", score:100, oldPath:"test/former-alpha-test.mjs", newPath:"test/beta-current-test.mjs",
}]);

assert.deepEqual(planVerification(currentOwnershipPacks, {
  changedPaths:renamedChange.paths, changeSet:renamedChange, basePacks:formerOwnershipPacks,
}).packIds, ["alpha", "beta"], "a cross-pack rename selects former and candidate owners");

const renamedConsumerCurrentPacks = [
  pack("alpha", { unit:["test/alpha-current-test.mjs"] }),
  pack("beta", { unit:["test/beta-current-test.mjs"] }),
  pack("gamma", { unit:["test/gamma-current-test.mjs"] }),
];

const renamedConsumerFormerPacks = [
  pack("alpha", { unit:["test/former-alpha-test.mjs"] }),
  pack("beta", { unit:["test/beta-current-test.mjs"], dependencies:["alpha"] }),
  pack("gamma", { unit:["test/gamma-former-test.mjs"] }),
];

const renamedConsumerChange = syntheticChangeSet([{
  status:"R", score:100,
  oldPath:"test/former-alpha-test.mjs", newPath:"test/gamma-current-test.mjs",
}]);

assert.throws(() => planVerification(renamedConsumerCurrentPacks, {
  packIds:["alpha", "gamma"], changedPaths:renamedConsumerChange.paths,
  changeSet:renamedConsumerChange, basePacks:renamedConsumerFormerPacks,
}), /outside the explicit pack set: beta/u,
  "a rename boundary cannot omit a consumer declared only by the historical registry");

assert.deepEqual(planVerification(renamedConsumerCurrentPacks, {
  packIds:["alpha", "beta", "gamma"], changedPaths:renamedConsumerChange.paths,
  changeSet:renamedConsumerChange, basePacks:renamedConsumerFormerPacks,
}).packIds, ["alpha", "beta", "gamma"]);

const historicalInputCurrentPacks = [
  pack("alpha"),
  pack("beta"),
  pack("gamma", { verificationInputs:["src/alpha/current-observed.ts"] }),
  pack("delta", { dependencies:["gamma"] }),
];

const historicalInputFormerPacks = [
  pack("alpha"),
  pack("beta", { verificationInputs:["src/alpha/former-observed.ts"] }),
  pack("gamma"),
  pack("delta", { dependencies:["gamma"] }),
];

const renamedInputChange = syntheticChangeSet([{
  status:"R", score:100,
  oldPath:"src/alpha/former-observed.ts", newPath:"src/alpha/current-observed.ts",
}]);

assert.deepEqual(planVerification(historicalInputCurrentPacks, {
  changedPaths:renamedInputChange.paths, changeSet:renamedInputChange,
  basePacks:historicalInputFormerPacks,
}).packIds, ["alpha", "beta", "gamma"],
"renames union historical and current exact verification consumers without propagating their dependants");

const deletedInputChange = syntheticChangeSet([{
  status:"D", path:"src/alpha/former-observed.ts",
}]);

assert.deepEqual(planVerification(historicalInputCurrentPacks, {
  changedPaths:deletedInputChange.paths, changeSet:deletedInputChange,
  basePacks:historicalInputFormerPacks,
}).packIds, ["alpha", "beta"],
"deletes retain the historical exact verification consumer without propagating its dependants");

const copiedInputChange = syntheticChangeSet([{
  status:"C", score:100,
  oldPath:"src/alpha/former-observed.ts", newPath:"src/alpha/current-observed.ts",
}]);

assert.deepEqual(planVerification(historicalInputCurrentPacks, {
  changedPaths:copiedInputChange.paths, changeSet:copiedInputChange,
  basePacks:historicalInputFormerPacks,
}).packIds, ["alpha", "beta", "gamma"],
"copies union historical and current exact verification consumers without propagating their dependants");

const registryChange = syntheticChangeSet([{ status:"M", path:"verification/packs.json" }]);

assert.deepEqual(planVerification(currentOwnershipPacks, {
  changedPaths:registryChange.paths, changeSet:registryChange, basePacks:formerOwnershipPacks,
}).packIds, ["alpha", "beta"], "registry edits cannot narrow their own ownership effect");

assert.throws(() => planVerification(currentOwnershipPacks, {
  packIds:["alpha"], changedPaths:registryChange.paths,
  changeSet:registryChange, basePacks:formerOwnershipPacks,
}), /outside the explicit pack set: beta/u,
  "a conservative registry-change plan still fails a narrowed explicit boundary");

assert.deepEqual(planVerification(currentOwnershipPacks, {
  packIds:["alpha", "beta"], changedPaths:registryChange.paths,
  changeSet:registryChange, basePacks:formerOwnershipPacks,
}).packIds, ["alpha", "beta"]);

const alphaOnlyRegistryPacks = [
  pack("alpha", { unit:["test/alpha-new-test.mjs"] }),
  pack("beta", { unit:["test/beta-current-test.mjs"] }),
];

assert.deepEqual(planVerification(alphaOnlyRegistryPacks, {
  packIds:["alpha"], changedPaths:registryChange.paths,
  changeSet:registryChange, basePacks:currentOwnershipPacks,
}).packIds, ["alpha"],
"a registry edit may narrow only to the exact pack entries whose declarations changed");

const incompleteHistoricalRegistry = [
  pack("alpha", { unit:["test/alpha-current-test.mjs"] }),
  pack("beta", { unit:["test/beta-current-test.mjs"] }),
];

const unavailableHistoricalOwnerPlan = planVerification(currentOwnershipPacks, {
  changedPaths:deletedChange.paths, changeSet:deletedChange,
  basePacks:incompleteHistoricalRegistry,
});

assert.deepEqual(unavailableHistoricalOwnerPlan.packIds, ["alpha", "beta"],
  "an unavailable deleted-path owner triggers every runnable pack");

assert.equal(unavailableHistoricalOwnerPlan.conservativeHistoricalFallbackReason,
  "historical-ownership-unavailable");

assert.deepEqual(planVerification(currentOwnershipPacks, {
  changedPaths:deletedChange.paths, changeSet:deletedChange,
  basePacks:[{ ...formerOwnershipPacks[0], unit:"not-an-array" }],
}).packIds, ["alpha", "beta"], "schema-incompatible historical registries use every runnable pack");

const malformedHistoricalImpactPlan = planVerification(currentOwnershipPacks, {
  changedPaths:deletedChange.paths, changeSet:deletedChange,
  basePacks:[{ ...formerOwnershipPacks[0], impactBoundaries:[{}] }],
});

assert.deepEqual(malformedHistoricalImpactPlan.packIds, ["alpha", "beta"],
  "malformed historical impact boundaries fail closed to every runnable pack");

assert.equal(malformedHistoricalImpactPlan.conservativeHistoricalFallbackReason,
  "historical-registry-incompatible");

assert.throws(() => planVerification(currentOwnershipPacks, {
  changedPaths:deletedChange.paths,
  changeSet:deletedChange,
  basePacks:[
    formerOwnershipPacks[0],
    pack("beta", { unit:["test/former-alpha-test.mjs"] }),
  ],
}), /Ambiguous verification ownership/u);

const conflictingChange = syntheticChangeSet([{ status:"M", path:"test/reassigned-test.mjs" }]);

assert.throws(() => planVerification([
  pack("alpha", { unit:["test/alpha-current-test.mjs"] }),
  pack("beta", { unit:["test/reassigned-test.mjs"] }),
], {
  changedPaths:conflictingChange.paths,
  changeSet:conflictingChange,
  basePacks:[
    pack("alpha", { unit:["test/reassigned-test.mjs"] }),
    pack("beta", { unit:["test/beta-current-test.mjs"] }),
  ],
}), /Conflicting current and historical verification ownership/u);

const snapNamedBoundary = {
  id:"flow_workspace_relationship_port_snap",
  prefixes:["src/alpha/narrow.ts"],
  propagateDependants:false,
};

const narrowedCurrentOwnershipPacks = [
  pack("alpha", { impactBoundaries:[snapNamedBoundary] }),
  pack("beta", { dependencies:["alpha"] }),
];

const unnarrowedFormerOwnershipPacks = [
  pack("alpha"),
  pack("beta", { dependencies:["alpha"] }),
];

const narrowedChange = syntheticChangeSet([{ status:"M", path:"src/alpha/narrow.ts" }]);

assert.throws(() => planVerification(narrowedCurrentOwnershipPacks, {
  packIds:["alpha"], changedPaths:narrowedChange.paths,
  changeSet:narrowedChange, basePacks:unnarrowedFormerOwnershipPacks,
}), /outside the explicit pack set: beta/u,
"a newly narrowed boundary cannot discard the historical affected consumer union by name");

assert.deepEqual(planVerification(narrowedCurrentOwnershipPacks, {
  packIds:["alpha", "beta"], changedPaths:narrowedChange.paths,
  changeSet:narrowedChange, basePacks:unnarrowedFormerOwnershipPacks,
}).packIds, ["alpha", "beta"],
"ordinary historical ownership admits a narrow boundary only with its conserved former consumers");

assert.throws(() => planVerification([
  pack("alpha", { unit:["test/alpha-current-test.mjs"] }),
  pack("beta", { unit:["test/reassigned-test.mjs"], impactBoundaries:[{
    ...snapNamedBoundary, prefixes:["test/reassigned-test.mjs"],
  }] }),
], {
  changedPaths:conflictingChange.paths,
  changeSet:conflictingChange,
  basePacks:[
    pack("alpha", { unit:["test/reassigned-test.mjs"] }),
    pack("beta", { unit:["test/beta-current-test.mjs"] }),
  ],
}), /Conflicting current and historical verification ownership/u,
"a boundary name cannot authorize a current owner to replace its historical owner");

const focusedProcessOwnershipPacks = [
  pack("flow"),
  pack("shell", {
    source:[], process:["scripts/", "verification/"],
    unit:["test/verification-process-contract-test.mjs"],
    features:[], handlers:[],
    verificationOnly:{productionOwner:"flow"},
  }),
];

for (const processPath of [
  "scripts/verification-task-succession-test.mjs",
  "scripts/verification-task-succession.mjs",
  "test/verification-process-contract-test.mjs",
  "verification/task-succession.json",
]) {
  assert.throws(() => planVerification(focusedProcessOwnershipPacks, {
    packIds:["flow"], changedPaths:[processPath],
  }), /outside the explicit pack set: shell/u,
  `changed process input retains its declared owner: ${processPath}`);
}

const executed = [];

const packs = await loadVerificationPacks();

const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);

const vtd008BasePacks = JSON.parse(await exec("git", ["show", "0adee4fa84:verification/packs.json"]));

const baseTerminalPlan = planVerification(vtd008BasePacks,
  {terminalFull:true,historicalRegistryFallback:true});

const currentTerminalPlan = planVerification(packs, {terminalFull:true});

const vtd006ProgramMigration = new Map([
  ["test/browser-packs/side-panel-capture.mjs", "test/side-panel-component-layout-runtime-test.mjs"],
  ["test/browser-packs/side-panel-event-library.mjs", "test/side-panel-component-layout-runtime-test.mjs"],
  ["test/browser-packs/side-panel-schemas.mjs", "test/side-panel-component-layout-runtime-test.mjs"],
  ["test/browser-packs/side-panel-defects.mjs", "test/side-panel-component-layout-runtime-test.mjs"],
  ["test/browser-packs/side-panel-shell.mjs", "test/side-panel-component-layout-runtime-test.mjs"],
]);

const vtd015Feature = "features/settled-candidate-final-verification.feature";

const vtd015Generated = "build/acceptance/generated/features-settled-candidate-final-verification-feature_acceptance_test.clj";

const vtd015Ir = "build/acceptance/ir/settled-candidate-final-verification.json";

const vtd017Feature = "features/verification-shared-artifact-parallel-execution.feature";

const vtd017Generated =
  "build/acceptance/generated/features-verification-shared-artifact-parallel-execution-feature_acceptance_test.clj";

const vtd017Ir = "build/acceptance/ir/verification-shared-artifact-parallel-execution.json";

const autonomyFeature = "features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature";

const autonomyGenerated =
  "build/acceptance/generated/features-swarmforge-outcome-bounded-autonomy-and-unblockers-feature_acceptance_test.clj";

const autonomyIr = "build/acceptance/ir/swarmforge-outcome-bounded-autonomy-and-unblockers.json";

const migratedVerificationFeature = "features/modular-verification-packs.feature";

const migratedVerificationAcceptanceArtifacts = [
  "build/acceptance/generated/features-modular-verification-packs-feature_acceptance_test.clj",
  "build/acceptance/ir/modular-verification-packs.json",
];

const documentationTemplateFeatures = [
  "features/data-layer-documentation-template-library.feature",
  "features/data-layer-documentation-template-library-runtime.feature",
  "features/data-layer-excel-documentation-templates.feature",
  "features/data-layer-excel-documentation-templates-runtime.feature",
  "features/data-layer-rich-page-documentation-templates.feature",
  "features/data-layer-rich-page-documentation-templates-runtime.feature",
];

const documentationTemplateAcceptanceArtifacts = documentationTemplateFeatures.flatMap((feature) => {
  const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
  const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
    .replace(/(^-+|-+$)/gu, "");
  return [
    `build/acceptance/generated/${slug}_acceptance_test.clj`,
    `build/acceptance/ir/${basename}.json`,
  ];
});

const compactReorderableEditorFeatures = [
  "features/data-layer-compact-reorderable-editor-controls.feature",
  "features/data-layer-compact-reorderable-editor-controls-runtime.feature",
];

const compactReorderableEditorAcceptanceArtifacts = compactReorderableEditorFeatures
  .flatMap((feature) => {
    const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
    const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
      .replace(/(^-+|-+$)/gu, "");
    return [
      `build/acceptance/generated/${slug}_acceptance_test.clj`,
      `build/acceptance/ir/${basename}.json`,
    ];
  });

const normalizedVtd006Identity = (task) => {
  let encoded = JSON.stringify(verificationTaskIdentity(task));
  for (const [current, previous] of vtd006ProgramMigration) encoded = encoded.replaceAll(current, previous);
  const identity = JSON.parse(encoded);
  if (identity.stage === "browser-observation" &&
      identity.logicalTargetIds?.includes("LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER")) {
    const targetId = "LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER";
    identity.key = identity.key.replace(`${targetId}+`, "");
    identity.args = identity.args.filter((value) => value !== targetId);
    identity.target = identity.target.split(",")
      .filter((value) => value !== targetId).join(",");
    delete identity.environment[targetId];
    identity.logicalTargetIds = identity.logicalTargetIds
      .filter((value) => value !== targetId);
    identity.aliasCommands = identity.aliasCommands.filter((command) =>
      !command.includes(targetId));
  }
  if (identity.stage === "browser-observation" &&
      identity.logicalTargetIds?.includes("FLOW_STYLESHEET_EXTRACTION_TARGET")) {
    identity.key = identity.key.replace("+FLOW_STYLESHEET_EXTRACTION_TARGET", "");
    identity.args = identity.args.filter((value) => value !== "FLOW_STYLESHEET_EXTRACTION_TARGET");
    identity.target = identity.target.split(",")
      .filter((value) => value !== "FLOW_STYLESHEET_EXTRACTION_TARGET").join(",");
    delete identity.environment.FLOW_STYLESHEET_EXTRACTION_TARGET;
    identity.logicalTargetIds = identity.logicalTargetIds
      .filter((value) => value !== "FLOW_STYLESHEET_EXTRACTION_TARGET");
    identity.aliasCommands = identity.aliasCommands.filter((command) =>
      !command.includes("FLOW_STYLESHEET_EXTRACTION_TARGET"));
  }
  if (identity.key === "acceptance-session:shell") {
    identity.args = identity.args.filter((value) =>
      ![vtd015Generated, vtd015Ir, vtd017Generated, vtd017Ir,
        autonomyGenerated, autonomyIr,...migratedVerificationAcceptanceArtifacts,
        ...compactReorderableEditorAcceptanceArtifacts].includes(value));
    identity.target = identity.target.split(",")
      .filter((value) => ![vtd015Feature, vtd017Feature, autonomyFeature,
        migratedVerificationFeature,...compactReorderableEditorFeatures].includes(value)).join(",");
  }
  if (identity.key === "acceptance-session:flow_export") {
    identity.args = identity.args.filter((value) =>
      !documentationTemplateAcceptanceArtifacts.includes(value));
    identity.target = identity.target.split(",")
      .filter((value) => !documentationTemplateFeatures.includes(value)).join(",");
  }
  return identity;
};

const expectedVtd014TerminalIdentity = (task) => {
  const identity = normalizedVtd006Identity(task);
  const capabilities = new Map([
    ["test/flow-examples-timing-test.mjs", ["local-loopback"]],
    ["test/headless-chrome-lifecycle-test.mjs", ["local-loopback"]],
    ["test/verification-process-contract-test.mjs", ["local-loopback"]],
  ]).get(identity.target);
  if (capabilities) identity.requiredCapabilities = capabilities;
  return identity;
};

const terminalIdentities = (plan) => plan.tasks.map(normalizedVtd006Identity);

const expectedTerminalIdentities = (plan) => plan.tasks.map(expectedVtd014TerminalIdentity);

const acceptedTerminalIdentities = baseTerminalPlan.tasks.filter(({ key }) =>
  key !== "unit:test/verification-process-contract-test.mjs")
  .map(expectedVtd014TerminalIdentity);

const registeredTaskKeys = (registry) => new Set(registry.flatMap((pack) => [
  ...(pack.unit??[]).map((target) => `unit:${target}`),
  ...(pack.property??[]).map((target) => `property:${target}`),
  ...(pack.features??[]).flatMap((target) => [
    `acceptance-parse:${target}`, `acceptance-generate:${target}`,
  ]),
  ...(pack.checkpointCommands??[]).map(({ id }) => `checkpoint:${pack.id}:${id}`),
  ...((pack.features??[]).length ? [`acceptance-session:${pack.id}`] : []),
]));

const acceptedRegisteredTaskKeys = registeredTaskKeys(vtd008BasePacks);

const postBaseAddedRegisteredTaskKeys = new Set([...registeredTaskKeys(packs)]
  .filter((key) => !acceptedRegisteredTaskKeys.has(key)));

const approvedVtd015TaskKeys = new Set([
  "unit:test/settled-final-verification-workflow-test.mjs",
  `acceptance-parse:${vtd015Feature}`,
  `acceptance-generate:${vtd015Feature}`,
]);

const approvedVtd017TaskKeys = new Set([
  `acceptance-parse:${vtd017Feature}`,
  `acceptance-generate:${vtd017Feature}`,
]);

const approvedAutonomyTaskKeys = new Set([
  "unit:test/swarmforge-outcome-bounded-autonomy-test.mjs",
  "unit:test/stacked-campsite-control-test.mjs",
  "property:test/swarmforge-outcome-bounded-autonomy-property-test.mjs",
  `acceptance-parse:${autonomyFeature}`,
  `acceptance-generate:${autonomyFeature}`,
]);

const approvedDocumentationTemplateTaskKeys = new Set(documentationTemplateFeatures
  .flatMap((feature) => [
    `acceptance-parse:${feature}`,
    `acceptance-generate:${feature}`,
  ]));

const approvedCompactReorderableEditorTaskKeys = new Set([
  ...compactReorderableEditorFeatures.flatMap((feature) => [
    `acceptance-parse:${feature}`,
    `acceptance-generate:${feature}`,
  ]),
  "browser-observation:REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
]);

const approvedStyleSmokeTaskKeys = new Set([
  "browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
  "browser-observation:SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
]);

const approvedStyleVerificationTaskKeys = new Set([
  "unit:test/package-clean-checkout-contract-test.mjs",
  "unit:test/verification-evidence-production-path-test.mjs",
  "property:test/stylesheet-declarations-property-test.mjs",
]);

const approvedFlowStyleExtractionTaskKeys = new Set([
  "unit:test/flow-stylesheet-extraction-test.mjs",
]);

const approvedSidePanelCompatibilityCheckpointTaskKeys = new Set([
  "checkpoint:schemas:side-panel-direct-compatibility-capture",
  "checkpoint:shell:side-panel-direct-compatibility-validation",
]);

const approvedVerificationTaskKeys = new Set([
  ...approvedVtd015TaskKeys,
  ...approvedVtd017TaskKeys,
  ...approvedAutonomyTaskKeys,
  ...approvedDocumentationTemplateTaskKeys,
  ...approvedCompactReorderableEditorTaskKeys,
  ...approvedStyleSmokeTaskKeys,
  ...approvedStyleVerificationTaskKeys,
  ...approvedFlowStyleExtractionTaskKeys,
  ...approvedSidePanelCompatibilityCheckpointTaskKeys,
]);

const currentTerminalIdentitiesWithoutApprovedAdditions = currentTerminalPlan.tasks.filter(({ key }) =>
  !postBaseAddedRegisteredTaskKeys.has(key) && !approvedVerificationTaskKeys.has(key)).map(normalizedVtd006Identity);

const runnableProductionPackIds = planVerification(packs, { terminalFull:true }).packIds;

const observationIds = new Set(packs.flatMap((pack) => (pack.browserObservations ?? [])
  .map(({ id }) => id)));

const layeredEditorClasses = {
  canonical_editor_general_presentation:{
    paths:["src/canonical-schema-focused/navigator-rows.ts",
      "src/data-layer-canonical-schema-render-navigator.ts",
      "src/data-layer-side-panel-schema-editor.ts",
      "src/data-layer-side-panel-unified-schema-editor.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_TARGET"],
  },
  canonical_editor_rule_authoring:{
    paths:["src/data-layer-canonical-predicate-editor.ts",
      "src/data-layer-canonical-schema-focused-condition-tree.ts",
      "src/data-layer-canonical-schema-focused-conditions.ts",
      "src/data-layer-canonical-schema-focused-rule-add.ts",
      "src/data-layer-canonical-schema-focused-rule-rows.ts",
      "src/data-layer-canonical-schema-focused-rules.ts",
      "src/data-layer-project-condition-editor.ts","src/data-layer-shared-condition-tree-editor.ts",
      "src/data-layer-string-rule-validation-ui.ts","src/data-layer-string-rule-validation.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_RULES_TARGET"],
  },
  canonical_editor_document_integration:{
    paths:["src/canonical-schema-focused/definition.ts","src/canonical-schema-focused/documentation.ts",
      "src/canonical-schema-focused/example.ts","src/canonical-schema-focused/presence.ts",
      "src/canonical-schema-focused/structure.ts","src/canonical-schema-focused/values.ts",
      "src/data-layer-canonical-schema-focused-command.ts",
      "src/data-layer-canonical-schema-focused-drafts.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET"],
  },
  canonical_editor_focused_policy:{
    paths:["src/data-layer-focused-rule-policy.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_POLICY_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET"],
  },
  canonical_editor_shared_primitives:{
    paths:["src/canonical-schema-focused/dom.ts","src/data-layer-canonical-schema-focused-editor.ts",
      "src/data-layer-canonical-schema-focused-facets-ui.ts",
      "src/data-layer-canonical-schema-focused-menu.ts",
      "src/data-layer-canonical-schema-focused-sections.ts","src/data-layer-canonical-schema-render.ts",
      "src/data-layer-canonical-schema-ui.ts","src/data-layer-focused-schema-property-menu.ts",
      "src/data-layer-focused-schema-property-ui.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET",
      "LAYERED_SCHEMA_EDITOR_RULES_TARGET","LAYERED_SCHEMA_EDITOR_TARGET"],
  },
};

const canonicalEditorPlan = planVerification(packs, {
  changedPaths:["src/data-layer-canonical-schema-focused-sections.ts"],
});

assert.equal(canonicalEditorPlan.sessionTasks.length, 1,
  "a layered boundary plan retains one acceptance session for its selected feature");

assert.equal(canonicalEditorPlan.sessionTasks[0].target,
  "features/data-layer-canonical-shared-profile-schema-authoring.feature",
  "the boundary acceptance receipt cannot be used as proof for unrelated layered features");

assert.equal(canonicalEditorPlan.browserTasks.some(({ target }) =>
  target === "test/browser-packs/layered-schema.mjs"), false,
"focused boundary planning never schedules the monolithic layered-schema adapter");

const terminalLayeredPlan = planVerification(packs, { terminalFull:true });

assert.deepEqual(terminalLayeredPlan.observationTasks
  .filter(({ packId }) => packId === "layered_schema")
  .flatMap(({ logicalTargetIds }) => logicalTargetIds).sort(), [
  "LAYERED_SCHEMA_COMPOSITION_TARGET",
  "LAYERED_SCHEMA_CORE_TARGET",
  "LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET",
  "LAYERED_SCHEMA_EDITOR_POLICY_TARGET",
  "LAYERED_SCHEMA_EDITOR_RULES_TARGET",
  "LAYERED_SCHEMA_EDITOR_TARGET",
  "LAYERED_SCHEMA_INHERITANCE_TARGET",
  "LAYERED_SCHEMA_PAGE_GROUP_TARGET",
], "terminal verification executes every split layered-schema target exactly once");

for (const [packId, adapterPath] of [
  ["layered_schema", "test/browser-packs/layered-schema.mjs"],
  ["durable_project_repository", "test/browser-packs/durable-project-renderer.mjs"],
  ["branding_polish", "test/twatility-workflow-polish-browser-test.mjs"],
]) {
  const declaration = packs.find(({ id }) => id === packId).browserAdapterPerformance
    .find(({ path:declaredPath }) => declaredPath === adapterPath);
  assert.ok(declaration.targetIds.length >= 2 && declaration.sessionBatch,
    `${packId} runtime outlier declares independently selectable batched targets`);
}

for (const [packId, logicalObservations, program] of [
  ["capture", 5, "test/browser-packs/side-panel-capture.mjs"],
  ["schemas", 46, "test/browser-packs/side-panel-schemas.mjs"],
  ["defects", 9, "test/browser-packs/side-panel-defects.mjs"],
]) {
  const pack = packs.find(({ id }) => id === packId);
  const observations = pack.browserObservations.filter(({ path }) => path === program);
  assert.equal(observations.length, logicalObservations,
    `${packId} retains the specified shared side-panel observation count`);
  assert.deepEqual(pack.browserObservationBatches, [{
    id:`${packId}-side-panel`, path:program, observationCount:logicalObservations,
  }], `${packId} declares one compatible side-panel process batch`);
  assert.equal(planVerification(packs, { packIds:[packId] }).observationTasks
    .filter(({ logicalTargetIds }) => logicalTargetIds.some((id) =>
      observations.some((observation) => observation.id === id))).length, 1,
  `${packId} schedules all shared side-panel observations in one browser process`);
}

const layeredSourceInventory = (await verificationInventory()).source
  .filter((sourcePath) => verificationOwner(packs, sourcePath) === "layered_schema");

assert.equal(layeredSourceInventory.length,90);

for (const sourcePath of layeredSourceInventory) {
  assert.ok(planVerification(packs, { changedPaths:[sourcePath] }).changedBoundaries[sourcePath],
    `${sourcePath} has one declared layered-schema impact boundary`);
}

const layeredPack = packs.find(({id}) => id === "layered_schema");

const editorBoundaryIds = new Set(Object.keys(layeredEditorClasses));

const oldEditorPrefixes = Object.values(layeredEditorClasses).flatMap(({paths}) => paths);

const layeredBasePacks = replacePack(packs,"layered_schema",(pack) => ({
  impactBoundaries:[...pack.impactBoundaries.filter(({id}) => !editorBoundaryIds.has(id)),{
    id:"canonical_schema_editor",prefixes:oldEditorPrefixes,propagateDependants:false,
  }],
  browserObservations:pack.browserObservations.map((observation) =>
    observation.id.startsWith("LAYERED_SCHEMA_EDITOR_")
      ? {...observation,impactBoundaries:["canonical_schema_editor"]} : observation),
}));

const exactLayeredPlan = planVerification(packs,{packIds:["layered_schema"],includeProperties:true});

const baseExactLayeredPlan = planVerification(layeredBasePacks,
  {packIds:["layered_schema"],includeProperties:true});

assert.deepEqual({tasks:exactLayeredPlan.tasks.length,unit:exactLayeredPlan.unitTasks.length,
  property:exactLayeredPlan.propertyTasks.length,observations:exactLayeredPlan.observationTasks.length,
  parses:exactLayeredPlan.parserTasks.length,generators:exactLayeredPlan.generatorTasks.length,
  sessions:exactLayeredPlan.sessionTasks.length},
{tasks:55,unit:22,property:13,observations:4,parses:7,generators:7,sessions:1});

assert.deepEqual(terminalIdentities(exactLayeredPlan),expectedTerminalIdentities(baseExactLayeredPlan),
  "VTD-005 changes routing without changing exact owner task identities");

assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities,
  "VTD-005 conserves terminal task identities");

const editorLeafCounts = Object.fromEntries(layeredPack.browserEvidencePartitions
  .find(({sessionBatch}) => sessionBatch === "layered-schema-editor").targets
  .map(({id,leaves}) => [id,leaves.length]));

assert.deepEqual(editorLeafCounts,{LAYERED_SCHEMA_EDITOR_TARGET:22,
  LAYERED_SCHEMA_EDITOR_RULES_TARGET:19,LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET:23,
  LAYERED_SCHEMA_EDITOR_POLICY_TARGET:16});

const targetsFor = (plan) => plan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort();

const editorHistoryChange = (entry) => syntheticChangeSet([entry]);

const deleteRules = editorHistoryChange({status:"D",
  path:"src/data-layer-canonical-schema-focused-rules.ts"});

const renameRules = editorHistoryChange({status:"R",score:100,
  oldPath:"src/data-layer-canonical-schema-focused-rule-add.ts",
  newPath:"src/data-layer-canonical-schema-focused-rule-rows.ts"});

const renameRulesCanonical = editorHistoryChange({status:"R",score:100,
  oldPath:"src/data-layer-canonical-schema-focused-rules.ts",
  newPath:"src/canonical-schema-focused/definition.ts"});

const renameGeneralShared = editorHistoryChange({status:"R",score:100,
  oldPath:"src/canonical-schema-focused/navigator-rows.ts",
  newPath:"src/data-layer-canonical-schema-render.ts"});

const historyTargets = (change,extra={}) => targetsFor(planVerification(packs,{
  changedPaths:change.paths,changeSet:change,basePacks:packs,...extra,
}));

const layeredHistoryPlans = {
  delete:historyTargets(deleteRules),renameRules:historyTargets(renameRules),
  renameRulesCanonical:historyTargets(renameRulesCanonical),
  renameGeneralShared:historyTargets(renameGeneralShared),
  unavailable:planVerification(packs,{changedPaths:deleteRules.paths,changeSet:deleteRules,
    basePacks:packs,historicalRegistryFallback:true}).packIds,
};

assert.deepEqual(layeredHistoryPlans.delete,["LAYERED_SCHEMA_EDITOR_RULES_TARGET"]);

assert.deepEqual(layeredHistoryPlans.renameRules,["LAYERED_SCHEMA_EDITOR_RULES_TARGET"]);

assert.deepEqual(layeredHistoryPlans.renameRulesCanonical,
  ["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET"]);

assert.deepEqual(layeredHistoryPlans.renameGeneralShared,
  ["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET",
    "LAYERED_SCHEMA_EDITOR_RULES_TARGET","LAYERED_SCHEMA_EDITOR_TARGET"]);

assert.deepEqual(layeredHistoryPlans.unavailable,planVerification(packs,{terminalFull:true}).packIds);

const selectiveInheritancePlan = planVerification(packs, {
  changedPaths:["src/data-layer-selective-profile-inheritance-ui.ts"],
});

assert.equal(selectiveInheritancePlan.changedBoundaries[
  "src/data-layer-selective-profile-inheritance-ui.ts"], "selective_profile_inheritance");

assert.deepEqual(selectiveInheritancePlan.packIds, ["layered_schema"],
  "selective profile inheritance changes remain within their focused aggregate pack");

assert.equal([...observationIds].filter((id) => id.startsWith("SCHEMA_WORKSPACE_BROWSER_ADAPTER:")).length, 3);

assert.equal(verificationOwner(packs, "acceptance/src/acceptance/steps/schema_property_comments.clj"), "schemas");

assert.equal(verificationOwner(packs,
  "acceptance/src/acceptance/steps/event_library_editor_support.clj"), "capture");

assert.equal(verificationOwner(packs, "acceptance/src/acceptance/pack_session.clj"), "shell");

assert.equal(verificationOwner(packs, "acceptance/runtime/cross-tab-reattachment.mjs"), "capture");

for (const processPath of [
  "swarmforge/scripts/swarm_handoff.bb",
  "package.json", "bb.edn", "deps.edn", ".nvmrc", "manifest.json", "side-panel.html",
  "side-panel.css", "architecture/data-layer-boundaries.json", "assets/brand/icon.svg",
  "docs/swarmforge-active-scope.md", "test/hardening/support.clj",
  "test/support/flow-graph-corrective-workflow.mjs", "test/browser-packs/shared-harness.mjs",
]) assert.equal(verificationOwner(packs, processPath), "shell", `process owner for ${processPath}`);

for (const processPath of ["scripts/verification-evidence.mjs", "verification/packs.json"])
  assert.equal(verificationOwner(packs, processPath), "verification_process",
    `verification-process owner for ${processPath}`);

const packRuntimeSource = await readFile(
  new URL("../../acceptance/src/acceptance/pack_runtime.clj", import.meta.url),
  "utf8",
);

const sharedHandlerNamespaceBlock = /def shared-handler-namespaces\s*\n\s*\[([\s\S]*?)\]\)/u
  .exec(packRuntimeSource)?.[1];

assert.ok(sharedHandlerNamespaceBlock, "the acceptance runtime declares shared handler namespaces");

const sharedHandlerPaths = [...sharedHandlerNamespaceBlock.matchAll(/'acceptance\.steps\.([a-z0-9-]+)/gu)]
  .map(([, namespace]) => `acceptance/src/acceptance/steps/${namespace.replaceAll("-", "_")}.clj`);

assert.deepEqual(sharedHandlerPaths, [
  "acceptance/src/acceptance/steps/project_skeleton.clj",
  "acceptance/src/acceptance/steps/side_panel.clj",
  "acceptance/src/acceptance/steps/operator_interface.clj",
]);

const featureBearingRunnablePackIds = runnableProductionPackIds.filter((id) =>
  packs.find((pack) => pack.id === id).features.length);

for (const sharedRuntimePath of [
  "acceptance/src/acceptance/pack_session.clj",
  "acceptance/src/acceptance/steps/support.clj",
  ...sharedHandlerPaths,
]) {
  const sharedImpact = planVerification(packs, { changedPaths:[sharedRuntimePath] });
  assert.ok(featureBearingRunnablePackIds.every((id) => sharedImpact.packIds.includes(id)),
    `${sharedRuntimePath} selects every feature-bearing runnable pack`);
  assert.equal(verificationOwner(packs, sharedRuntimePath), "shell",
    `${sharedRuntimePath} retains one process owner`);
}

const shellPlan = planVerification(packs, { packIds:["shell"] });

assert.ok(planVerification(packs, { packIds:["command-palette"] }).unitCommands
  .includes("node test/command-registry-runtime-test.mjs"));

assert.ok(shellPlan.unitCommands.includes("node test/information-architecture-runtime-test.mjs"));

assert.ok(shellPlan.checkpointCommands.includes("node scripts/dist-artifact-integrity-test.mjs"));

assert.ok(shellPlan.checkpointCommands.includes("npm run package"));

assert.ok(shellPlan.checkpointCommands.includes("bb test:unit"));

const clojureCheckpoint = shellPlan.checkpointTasks.find(({ key }) =>
  key === "checkpoint:shell:acceptance-clojure-contracts");

assert.deepEqual(clojureCheckpoint.environment, {
  SWARMFORGE_BUILD_PREPARED:"1", SWARMFORGE_PACK_RUNNER_OWNS_JS:"1",
});

const bbTaskSource = await readFile(new URL("../../bb.edn", import.meta.url), "utf8");

const runnerOwnedNamespaces = /runner-owned-test-namespaces\s*\n\s*\[([\s\S]*?)\]\s*\n\s*result/u
  .exec(bbTaskSource)?.[1];

assert.ok(runnerOwnedNamespaces, "bb test:unit declares an explicit runner-owned namespace set");

for (const integrationNamespace of [
  "acceptance.conditional-validation-rules-steps-test",
  "acceptance.cross-tab-reattachment-steps-test",
  "acceptance.guided-assignment-coverage-steps-test",
  "acceptance.lossless-observation-activation-steps-test",
  "acceptance.schema-documentation-steps-test",
]) assert.doesNotMatch(runnerOwnedNamespaces, new RegExp(integrationNamespace.replaceAll(".", "\\."), "u"));

assert.match(bbTaskSource, /run-js-test \(fn \[& command\][\s\S]*?if runner-owns-js\?[\s\S]*?\{:exit 0\}/u,
  "runner-owned unit/property lanes bypass their standalone JavaScript wrappers");

if (process.platform !== "win32") {
  const noNodeDirectory = await mkdtemp(path.join(os.tmpdir(), "verification-no-node-"));
  const fakeNode = path.join(noNodeDirectory, "node");
  const sentinel = path.join(noNodeDirectory, "node-launched");
  try {
    await writeFile(fakeNode,
      "#!/bin/sh\nprintf launched > \"$SWARMFORGE_NODE_LAUNCH_SENTINEL\"\nexit 86\n");
    await chmod(fakeNode, 0o755);
    const environment = {
      ...process.env,
      PATH:`${noNodeDirectory}:${process.env.PATH}`,
      SWARMFORGE_BUILD_PREPARED:"1",
      SWARMFORGE_PACK_RUNNER_OWNS_JS:"1",
      SWARMFORGE_NODE_LAUNCH_SENTINEL:sentinel,
    };
    await exec("bb", ["test:unit"], { cwd:path.resolve("."), env:environment, timeout:10_000 });
    await exec("bb", ["test:property"], { cwd:path.resolve("."), env:environment, timeout:10_000 });
    await assert.rejects(readFile(sentinel), (error) => error?.code === "ENOENT",
      "runner-owned aggregate tests must not launch a Node/browser subprocess");
  } finally {
    await rm(noNodeDirectory, { recursive:true, force:true });
  }
}

const changeRepository = await mkdtemp(path.join(os.tmpdir(), "verification-change-model-"));

try {
  await exec("git", ["init", "-q"], { cwd:changeRepository });
  await exec("git", ["config", "user.name", "Change Model Test"], { cwd:changeRepository });
  await exec("git", ["config", "user.email", "changes@example.test"], { cwd:changeRepository });
  await writeFile(path.join(changeRepository, "former-leaf.mjs"), "same content\n");
  await writeFile(path.join(changeRepository, "deleted-leaf.mjs"), "deleted content\n");
  await exec("git", ["add", "."], { cwd:changeRepository });
  await exec("git", ["commit", "-qm", "base"], { cwd:changeRepository });
  const changeBase = await exec("git", ["rev-parse", "HEAD"], { cwd:changeRepository });
  await rename(path.join(changeRepository, "former-leaf.mjs"), path.join(changeRepository, "renamed-leaf.mjs"));
  await rm(path.join(changeRepository, "deleted-leaf.mjs"));
  await exec("git", ["add", "-A"], { cwd:changeRepository });
  await exec("git", ["commit", "-qm", "rename and delete"], { cwd:changeRepository });
  const canonicalChanges = await canonicalVerificationChangeSet({
    base:changeBase, repositoryRoot:changeRepository,
  });
  assert.deepEqual(canonicalChanges.paths, ["deleted-leaf.mjs", "former-leaf.mjs", "renamed-leaf.mjs"]);
  assert.ok(canonicalChanges.entries.some(({ status, oldPath, newPath }) =>
    status === "R" && oldPath === "former-leaf.mjs" && newPath === "renamed-leaf.mjs"));
  assert.ok(canonicalChanges.entries.some(({ status, path:changedPath }) =>
    status === "D" && changedPath === "deleted-leaf.mjs"));
} finally {
  await rm(changeRepository, { recursive:true, force:true });
}

const evidenceRepository = await mkdtemp(path.join(os.tmpdir(), "verification-process-evidence-"));

const lockedRuntime = { node:process.versions.node, typescript:"5.9.3" };

const artifact = syntheticArtifact("b".repeat(64), "c".repeat(64), lockedRuntime);

const skipToolchainValidation = async() => {};

const evidencePacks = [
  pack("alpha", {
    source:["candidate.txt", "spec.txt"],
    property:["test/alpha-property-test.mjs"],
  }),
  pack("beta", {
    source:["beta-owned.txt"],
    property:["test/beta-property-test.mjs"],
  }),
];

try {
  await mkdir(path.join(evidenceRepository, "verification"), { recursive:true });
  await mkdir(path.join(evidenceRepository, "swarmforge"), { recursive:true });
  await writeFile(path.join(evidenceRepository, ".gitignore"), "tmp/\n");
  await writeFile(path.join(evidenceRepository, "verification", "packs.json"),
    `${JSON.stringify(evidencePacks, null, 2)}\n`);
  await writeFile(path.join(evidenceRepository, "swarmforge", "toolchain.lock.json"), JSON.stringify({
    node:{ version:lockedRuntime.node }, typescript:{ version:lockedRuntime.typescript },
  }));
  await writeFile(path.join(evidenceRepository, "candidate.txt"), "before\n");
  await writeFile(path.join(evidenceRepository, "beta-owned.txt"), "stable\n");
  await exec("git", ["init", "-q"], { cwd:evidenceRepository });
  await exec("git", ["config", "user.name", "Verification Test"], { cwd:evidenceRepository });
  await exec("git", ["config", "user.email", "verification@example.test"], { cwd:evidenceRepository });
  await exec("git", ["add", "."], { cwd:evidenceRepository });
  await exec("git", ["commit", "-qm", "prebase"], { cwd:evidenceRepository });
  const prebase = await exec("git", ["rev-parse", "HEAD"], { cwd:evidenceRepository });
  await writeFile(path.join(evidenceRepository, "spec.txt"), "received\n");
  await exec("git", ["add", "spec.txt"], { cwd:evidenceRepository });
  await exec("git", ["commit", "-qm", "received specification"], { cwd:evidenceRepository });
  const baseline = await exec("git", ["rev-parse", "HEAD"], { cwd:evidenceRepository });
  const externalExclude = path.join(os.tmpdir(), `verification-hidden-${process.pid}.exclude`);
  const hiddenCandidatePath = path.join(evidenceRepository, "hidden-candidate.txt");
  await writeFile(externalExclude, "hidden-candidate.txt\n");
  await exec("git", ["config", "core.excludesFile", externalExclude], { cwd:evidenceRepository });
  await writeFile(hiddenCandidatePath, "must remain visible to verification\n");
  await assert.rejects(() => validateVerificationCandidateClean({ repositoryRoot:evidenceRepository }),
    /Commit candidate changes/u,
  "candidate cleanliness ignores caller-configured global excludes that could hide unowned files");
  await rm(hiddenCandidatePath);
  await rm(externalExclude);
  await exec("git", ["config", "--unset", "core.excludesFile"], { cwd:evidenceRepository });
  await probeGitMetadataWrite(evidenceRepository);
  assert.equal(await exec("git", ["for-each-ref", "--format=%(refname)",
    "refs/swarmforge/preflight"], { cwd:evidenceRepository }), "",
  "Git metadata capacity is exercised and the preflight ref is removed before evidence work");
  await writeFile(path.join(evidenceRepository, "candidate.txt"), "after\n");
  await exec("git", ["add", "candidate.txt"], { cwd:evidenceRepository });
  await exec("git", ["commit", "-qm", "candidate"], { cwd:evidenceRepository });

  const planFor = async(ids = ["alpha"], base = baseline) => {
    const requested = Array.isArray(ids) ? ids : [ids];
    const changeSet = base === null ? null : await canonicalVerificationChangeSet({
      base, repositoryRoot:evidenceRepository,
    });
    const plan = planVerification(evidencePacks, {
      packIds:requested,
      ...(changeSet ? { changedPaths:changeSet.paths, changeSet } : {}),
      basePacks:evidencePacks, includeProperties:true,
    });
    const packageTask = structuredClone(timeoutRepairPackageTaskIdentity);
    return { ...plan, tasks:[...plan.tasks, packageTask], packageTasks:[packageTask],
      stages:{ ...plan.stages, package:[] } };
  };
  const receiptFor = async(plan, name, receiptArtifact = artifact) => {
    const receiptPath = path.join(evidenceRepository, "tmp", "verification-receipts", `${name}.json`);
    await mkdir(path.dirname(receiptPath), { recursive:true });
    await writeFile(receiptPath, JSON.stringify({
      version:2,
      runIntent:verificationRunIntents.review,
      runId:name,
      completedAt:new Date().toISOString(),
      artifact:receiptArtifact,
      plan:{
        mode:plan.mode,
        requestedPackIds:[...plan.requestedPackIds].sort(),
        selectedPackIds:[...plan.selectedPackIds].sort(),
        changedPaths:[...plan.changedPaths].sort(),
        changedOwners:plan.changedOwners,
        changedBoundaries:plan.changedBoundaries,
        styleSmokeTargets:[...new Set(plan.styleSmokeTargets ?? [])].sort(),
        terminalFullObligations:[...new Set(plan.terminalFullObligations ?? [])].sort(),
        changedStyleTargets:plan.changedStyleTargets ?? {},
        adapterAuthorizationPackIds:[...new Set(plan.adapterAuthorizationPackIds ?? [])].sort(),
        changeSetDigest:plan.changeSet ? verificationDigest(plan.changeSet) : null,
        conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason,
        executionPrerequisites:plan.tasks.map((task) => ({
          key:task.key,
          requiredCapabilities:verificationTaskIdentity(task).requiredCapabilities,
          route:verificationTaskIdentity(task).requiredCapabilities.length
            ? "scoped-command-approval" : "workspace-sandbox",
        })),
        promotionExecutionPrerequisites:verificationPromotionTasks().map((task) => ({
          key:task.key,
          requiredCapabilities:verificationTaskIdentity(task).requiredCapabilities,
          route:verificationTaskIdentity(task).requiredCapabilities.length
            ? "scoped-command-approval" : "workspace-sandbox",
        })),
      },
      environment:{
        node:lockedRuntime.node, typescript:lockedRuntime.typescript,
        platform:`${process.platform}-${process.arch}`, executionLoad:"normal",
        concurrency:1, observationConcurrency:1,
      },
      tasks:Object.fromEntries(plan.tasks.map((task) => [task.key, {
        identity:verificationTaskIdentity(task), status:"passed", durationMs:1, output:"ok\n",
        executionPrerequisites:{
          requiredCapabilities:verificationTaskIdentity(task).requiredCapabilities,
          launchRoute:verificationTaskIdentity(task).requiredCapabilities.length
            ? "scoped-command-approval" : "workspace-sandbox",
        },
      }])),
    }));
    return receiptPath;
  };
  const evidenceIdFor = (record) => verificationDigest({
    task:record.task, commit:record.commit, tree:record.tree, baseCommit:record.baseCommit,
    packIds:record.packIds, planDigest:record.planDigest, identities:record.identities,
    receiptSha256:record.receipt.sha256, runIntent:record.receipt.runIntent,
    checkpointAttempt:record.checkpointAttempt,
  });
  const alphaPlan = await planFor("alpha");
  assert.ok(alphaPlan.propertyTasks.length > 0, "durable exact-pack fixtures include property leaves");
  const alphaReceipt = await receiptFor(alphaPlan, "alpha-receipt");
  const preflightReceipt = path.join(evidenceRepository, "tmp", "verification-receipts", "preflight.json");
  await writeFile(preflightReceipt, JSON.stringify({
    version:2,
    runIntent:verificationRunIntents.review,
    environment:{
      node:lockedRuntime.node, typescript:lockedRuntime.typescript,
      platform:`${process.platform}-${process.arch}`, executionLoad:"normal",
      concurrency:1, observationConcurrency:1,
    },
    tasks:{},
  }));
  const compatibility = await validateVerificationEvidenceCompatibility({
    task:"preflight-compatibility", plan:alphaPlan, receiptPath:preflightReceipt,
    changedSince:baseline, repositoryRoot:evidenceRepository,
  });
  assert.equal(compatibility.commit, await exec("git", ["rev-parse", "HEAD"], { cwd:evidenceRepository }),
    "preflight evidence compatibility binds the clean committed candidate before execution");
  await checkpointPreflight({
    packs:evidencePacks, plan:alphaPlan,
    receiptContext:{ receiptPath:preflightReceipt, receipt:{ version:2, tasks:{} } },
    inputFingerprint:{ inputDigest:"a".repeat(64) },
    evidenceTask:"preflight-compatibility", changedSince:baseline, root:evidenceRepository,
    validators:{
      registry:async() => {}, plan:async() => {}, receipt:async() => {}, artifact:async() => {},
    },
  });
  await writeFile(path.join(evidenceRepository, "uncommitted-evidence-blocker"), "dirty\n");
  await assert.rejects(() => checkpointPreflight({
    packs:evidencePacks, plan:alphaPlan,
    receiptContext:{ receiptPath:preflightReceipt, receipt:{ version:2, tasks:{} } },
    inputFingerprint:{ inputDigest:"a".repeat(64) },
    evidenceTask:"preflight-compatibility", changedSince:baseline, root:evidenceRepository,
    validators:{
      registry:async() => {}, plan:async() => {}, receipt:async() => {}, artifact:async() => {},
    },
  }), /Commit candidate changes/u,
  "the default evidence preflight rejects an incompatible candidate before any verification command");
  await rm(path.join(evidenceRepository, "uncommitted-evidence-blocker"));
  const redirectedReceipt = path.join(evidenceRepository, "tmp", "arbitrary-receipt.json");
  await writeFile(redirectedReceipt, await readFile(alphaReceipt));
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"redirected-receipt", plan:alphaPlan, receiptPath:redirectedReceipt,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  }), /runner-owned under tmp\/verification-receipts/u);
  const nonPropertyPlan = planVerification(evidencePacks, {
    packIds:["alpha"], changedPaths:alphaPlan.changeSet.paths,
    changeSet:alphaPlan.changeSet, basePacks:evidencePacks,
  });
  const nonPropertyReceipt = await receiptFor(nonPropertyPlan, "non-property-receipt");
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"non-property", plan:nonPropertyPlan, receiptPath:nonPropertyReceipt,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  }), /requires every registered property leaf/u);
  const incompleteRegistryPlan = structuredClone(alphaPlan);
  incompleteRegistryPlan.tasks = incompleteRegistryPlan.tasks.filter(({ stage }) => stage !== "property");
  const incompleteRegistryReceipt = await receiptFor(incompleteRegistryPlan, "incomplete-registry-receipt");
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"incomplete-registry", plan:incompleteRegistryPlan, receiptPath:incompleteRegistryReceipt,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  }), /does not match the committed pack registry/u);
  const forgedRuntimeReceipt = JSON.parse(await readFile(alphaReceipt, "utf8"));
  forgedRuntimeReceipt.environment.node = "0.0.0";
  const forgedRuntimePath = path.join(evidenceRepository, "tmp", "verification-receipts", "forged-runtime.json");
  await writeFile(forgedRuntimePath, JSON.stringify(forgedRuntimeReceipt));
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"forged-runtime", plan:alphaPlan, receiptPath:forgedRuntimePath,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  }), /locked runtime identities must match/u);
  const forgedArtifactReceipt = JSON.parse(await readFile(alphaReceipt, "utf8"));
  forgedArtifactReceipt.artifact.outputDigest = "d".repeat(64);
  const forgedArtifactPath = path.join(evidenceRepository, "tmp", "verification-receipts", "forged-artifact.json");
  await writeFile(forgedArtifactPath, JSON.stringify(forgedArtifactReceipt));
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"forged-artifact", plan:alphaPlan, receiptPath:forgedArtifactPath,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  }), /supplied artifact/u);
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"mismatched-manifest", plan:alphaPlan, receiptPath:alphaReceipt,
    changedSince:baseline,
    buildManifest:{ ...artifact, toolchain:{ ...artifact.toolchain, typescript:"5.8.0" } },
    repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  }), /supplied artifact/u);
  const missingExecutionLoadReceipt = JSON.parse(await readFile(alphaReceipt, "utf8"));
  delete missingExecutionLoadReceipt.environment.executionLoad;
  const missingExecutionLoadPath = path.join(
    evidenceRepository, "tmp", "verification-receipts", "missing-execution-load.json",
  );
  await writeFile(missingExecutionLoadPath, JSON.stringify(missingExecutionLoadReceipt));
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"missing-execution-load", plan:alphaPlan, receiptPath:missingExecutionLoadPath,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  }), /invalid exact runtime environment/u,
  "new verification receipts must declare normal or loaded execution load");
  const legacyPlanSummaryReceipt = JSON.parse(await readFile(alphaReceipt, "utf8"));
  delete legacyPlanSummaryReceipt.plan.changedPaths;
  const legacyPlanSummaryPath = path.join(
    evidenceRepository, "tmp", "verification-receipts", "legacy-plan-summary.json",
  );
  await writeFile(legacyPlanSummaryPath, JSON.stringify(legacyPlanSummaryReceipt));
  await createPendingVerificationEvidence({
    task:"legacy-plan-summary", plan:alphaPlan, receiptPath:legacyPlanSummaryPath,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  });
  const alphaReceiptDocument = JSON.parse(await readFile(alphaReceipt, "utf8"));
  const alphaAttemptStore = createCheckpointAttemptStore({
    directory:await defaultCheckpointAttemptDirectory(evidenceRepository),
  });
  const alphaAttemptIdentity = checkpointAttemptIdentity({
    candidate:{
      commit:await exec("git", ["rev-parse", "HEAD"], { cwd:evidenceRepository }),
      tree:await exec("git", ["rev-parse", "HEAD^{tree}"], { cwd:evidenceRepository }),
    },
    baseCommit:baseline, evidenceTask:"multi-pack-task",
    planDigest:verificationDigest(alphaPlan.tasks.map(verificationTaskIdentity)),
    artifactInputDigest:artifact.inputDigest, artifactOutputDigest:artifact.outputDigest,
    artifactBuildIdentity:artifact.buildIdentity,
    registryDigest:verificationDigest(evidencePacks),
    toolchainDigest:verificationDigest(alphaReceiptDocument.environment),
    environmentClass:verificationDigest(alphaReceiptDocument.environment),
    capabilityRoutes:Object.fromEntries([
      ...alphaReceiptDocument.plan.executionPrerequisites,
      ...alphaReceiptDocument.plan.promotionExecutionPrerequisites,
    ]
      .map(({ key, route }) => [key, route])),
  });
  const alphaAttemptOwner = { pid:process.pid, token:"evidence-promotion-owner" };
  const alphaAttempt = await alphaAttemptStore.claim(alphaAttemptIdentity,
    alphaPlan.tasks.map(({ key }) => key), alphaAttemptOwner);
  for (const task of alphaPlan.tasks) {
    await alphaAttemptStore.recordTask(alphaAttempt.attempt.id, task.key, {
      status:"passed", identityDigest:verificationDigest(verificationTaskIdentity(task)),
      receiptTask:alphaReceiptDocument.tasks[task.key],
    }, alphaAttemptOwner);
  }
  await alphaAttemptStore.markTasksComplete(alphaAttempt.attempt.id, alphaAttemptOwner);
  await alphaAttemptStore.markPromotion(alphaAttempt.attempt.id, "receipt-finalized");
  alphaReceiptDocument.checkpointAttempt = { id:alphaAttempt.attempt.id,
    identityDigest:alphaAttempt.attempt.identityDigest, action:alphaAttempt.action };
  assert.notEqual(alphaAttempt.attempt.id, alphaAttempt.attempt.identityDigest,
    "the pre-build lease identity remains distinct from its durably bound artifact identity");
  await writeFile(alphaReceipt, JSON.stringify(alphaReceiptDocument));
  const pendingAlpha = await createPendingVerificationEvidence({
    task:"multi-pack-task", plan:alphaPlan, receiptPath:alphaReceipt,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  });
  assert.equal(pendingAlpha.evidence.checkpointAttempt.id, alphaAttempt.attempt.id,
    "pending evidence retains its immutable checkpoint attempt identity");
  await alphaAttemptStore.markPromotion(alphaAttempt.attempt.id, "pending-evidence-created");
  assert.deepEqual(pendingAlpha.evidence.receipt.environment, {
    node:lockedRuntime.node,
    typescript:lockedRuntime.typescript,
    platform:`${process.platform}-${process.arch}`,
    executionLoad:"normal",
    concurrency:1,
    observationConcurrency:1,
  });
  assert.match(pendingAlpha.evidence.receipt.sourcePath,
    /^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u);
  const exclusivePendingPath = path.join(evidenceRepository, "tmp", "verification-evidence", "exclusive.pending.json");
  const exclusiveReceipt = await receiptFor(alphaPlan, "exclusive-pending-receipt");
  await createPendingVerificationEvidence({
    task:"exclusive-pending", plan:alphaPlan, receiptPath:exclusiveReceipt,
    pendingPath:exclusivePendingPath, changedSince:baseline, buildManifest:artifact,
    repositoryRoot:evidenceRepository, toolchainValidator:skipToolchainValidation,
  });
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"exclusive-pending", plan:alphaPlan, receiptPath:exclusiveReceipt,
    pendingPath:exclusivePendingPath, changedSince:baseline, buildManifest:artifact,
    repositoryRoot:evidenceRepository, toolchainValidator:skipToolchainValidation,
  }), /EEXIST/u, "pending evidence publication never overwrites an existing file");
  const tamperedRawReceipt = await receiptFor(alphaPlan, "tampered-raw-receipt");
  const pendingRawTamper = await createPendingVerificationEvidence({
    task:"raw-receipt-tamper", plan:alphaPlan, receiptPath:tamperedRawReceipt,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  });
  await writeFile(tamperedRawReceipt, `${await readFile(tamperedRawReceipt, "utf8")}\n`);
  await assert.rejects(() => recordPendingVerificationEvidence(pendingRawTamper.path, {
    repositoryRoot:evidenceRepository, artifactValidator:async() => artifact,
    toolchainValidator:skipToolchainValidation,
  }), /Raw verification receipt changed/u);
  const pendingDocumentReceipt = await receiptFor(alphaPlan, "tampered-pending-receipt");
  const pendingDocumentTamper = await createPendingVerificationEvidence({
    task:"pending-document-tamper", plan:alphaPlan, receiptPath:pendingDocumentReceipt,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  });
  const tamperedPendingDocument = JSON.parse(await readFile(pendingDocumentTamper.path, "utf8"));
  tamperedPendingDocument.packIds.push("beta");
  tamperedPendingDocument.plan.packIds.push("beta");
  tamperedPendingDocument.plan.requestedPackIds.push("beta");
  tamperedPendingDocument.plan.selectedPackIds.push("beta");
  tamperedPendingDocument.planDigest = verificationDigest(tamperedPendingDocument.plan);
  tamperedPendingDocument.evidenceId = evidenceIdFor(tamperedPendingDocument);
  await writeFile(pendingDocumentTamper.path, JSON.stringify(tamperedPendingDocument));
  await assert.rejects(() => recordPendingVerificationEvidence(pendingDocumentTamper.path, {
    repositoryRoot:evidenceRepository, artifactValidator:async() => artifact,
    toolchainValidator:skipToolchainValidation,
  }), /Claimed pack has no executed verification stage/u);
  await assert.rejects(() => verificationEvidence("HEAD", { repositoryRoot:evidenceRepository }), /No durable/u,
    "long verification only emits pending evidence and does not write Git notes");
  await assert.rejects(() => recordPendingVerificationEvidence(pendingAlpha.path, {
    repositoryRoot:evidenceRepository, artifactValidator:async() => artifact,
    toolchainValidator:skipToolchainValidation,
    metadataValidator:async() => { throw new Error("EACCES protected Git metadata"); },
  }), /promotion:git-note:git-metadata-write:scoped-git-metadata-approval.*EACCES/u,
  "denied Git metadata authority fails closed at the declared promotion route");
  const missingReceipt = JSON.parse(await readFile(alphaReceipt, "utf8"));
  delete missingReceipt.tasks[alphaPlan.tasks.at(-1).key];
  const missingPath = path.join(evidenceRepository, "tmp", "verification-receipts", "missing.json");
  await writeFile(missingPath, JSON.stringify(missingReceipt));
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"missing-task", plan:alphaPlan, receiptPath:missingPath, changedSince:baseline,
    buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  }), /task set does not match/u);
  const candidateTree = await exec("git", ["rev-parse", "HEAD^{tree}"], { cwd:evidenceRepository });
  const divergent = await exec("git", ["commit-tree", candidateTree, "-m", "divergent base"], {
    cwd:evidenceRepository,
  });
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"divergent-task", plan:alphaPlan, receiptPath:alphaReceipt,
    changedSince:divergent, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  }), /not an ancestor/u);
  const emptyPlan = await planFor("alpha", null);
  emptyPlan.changeSet = await canonicalVerificationChangeSet({
    base:"HEAD", commit:"HEAD", repositoryRoot:evidenceRepository,
  });
  emptyPlan.baseCommit = emptyPlan.changeSet.baseCommit;
  assert.equal(emptyPlan.changeSet.version, 1);
  assert.ok(emptyPlan.baseCommit);
  assert.equal(emptyPlan.baseCommit, emptyPlan.changeSet.baseCommit);
  assert.deepEqual(emptyPlan.changedPaths, emptyPlan.changeSet.paths);
  const emptyReceipt = await receiptFor(emptyPlan, "empty-receipt");
  await assert.rejects(() => createPendingVerificationEvidence({
    task:"empty-range-task", plan:emptyPlan, receiptPath:emptyReceipt,
    changedSince:"HEAD", buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  }), /non-empty committed candidate range/u);
  const recordedAlpha = await recordPendingVerificationEvidence(pendingAlpha.path, {
    repositoryRoot:evidenceRepository, artifactValidator:async() => artifact,
    toolchainValidator:skipToolchainValidation,
  });
  assert.ok((await alphaAttemptStore.read(alphaAttempt.attempt.id)).promotion["git-note-recorded"],
    "recording durable evidence promotes only the Git-note step");
  assert.equal((await verifyVerificationEvidence(
    "HEAD", baseline, "multi-pack-task", "alpha", { repositoryRoot:evidenceRepository },
  )).status, "passed");
  assert.equal((await alphaAttemptStore.read(alphaAttempt.attempt.id)).state, "promoted",
    "handoff verification promotes the completed checkpoint without rerunning a task");
  await assert.rejects(() => verifyVerificationEvidence(
    "HEAD", baseline, "wrong-task", "alpha", { repositoryRoot:evidenceRepository },
  ), /does not exactly cover/u);
  await assert.rejects(() => verifyVerificationEvidence(
    "HEAD", "HEAD", "multi-pack-task", "alpha", { repositoryRoot:evidenceRepository },
  ), /does not exactly cover/u, "handoff evidence is bound to its received base");

  const genuineNote = await verificationEvidence("HEAD", { repositoryRoot:evidenceRepository });
  const oversizedNotePath = path.join(evidenceRepository, "oversized-verification-note.json");
  await writeFile(oversizedNotePath, JSON.stringify({
    ...genuineNote,
    retainedIncidentHistory:"x".repeat((1024 * 1024) + 1),
  }));
  await exec("git", ["notes", "--ref=refs/notes/swarmforge-verification", "add", "-f", "-F",
    oversizedNotePath, "HEAD"], { cwd:evidenceRepository });
  assert.equal((await verificationEvidence("HEAD", {
    repositoryRoot:evidenceRepository,
  })).records.length, genuineNote.records.length,
  "durable evidence remains readable after retained incident history exceeds the default child-process buffer");
  await exec("git", ["notes", "--ref=refs/notes/swarmforge-verification", "add", "-f", "-m",
    JSON.stringify(genuineNote), "HEAD"], { cwd:evidenceRepository });
  await rm(oversizedNotePath);
  const legacyEvidenceRecord = structuredClone(recordedAlpha);
  delete legacyEvidenceRecord.receipt.environment.executionLoad;
  await exec("git", ["notes", "--ref=refs/notes/swarmforge-verification", "add", "-f", "-m",
    JSON.stringify({ version:2, records:[legacyEvidenceRecord] }), "HEAD"], {
    cwd:evidenceRepository,
  });
  assert.equal((await verifyVerificationEvidence(
    "HEAD", baseline, "multi-pack-task", "alpha", { repositoryRoot:evidenceRepository },
  )).status, "passed", "immutable pre-load-field evidence remains verifiable");
  await exec("git", ["notes", "--ref=refs/notes/swarmforge-verification", "add", "-f", "-m",
    JSON.stringify(genuineNote), "HEAD"], { cwd:evidenceRepository });
  const forgedNoteRecord = structuredClone(recordedAlpha);
  const canonicalCompositePlan = await planFor(["alpha", "beta"]);
  const inventedBetaIdentity = verificationTaskIdentity(
    canonicalCompositePlan.tasks.find(({ packId }) => packId === "beta"),
  );
  forgedNoteRecord.packIds.push("beta");
  forgedNoteRecord.plan.packIds.push("beta");
  forgedNoteRecord.plan.requestedPackIds.push("beta");
  forgedNoteRecord.plan.selectedPackIds.push("beta");
  forgedNoteRecord.plan.tasks.push(inventedBetaIdentity);
  forgedNoteRecord.receipt.tasks.push({
    key:inventedBetaIdentity.key, identity:inventedBetaIdentity, status:"passed",
    durationMs:1, outputSha256:verificationDigest("invented"),
  });
  forgedNoteRecord.planDigest = verificationDigest(forgedNoteRecord.plan);
  forgedNoteRecord.evidenceId = evidenceIdFor(forgedNoteRecord);
  await exec("git", ["notes", "--ref=refs/notes/swarmforge-verification", "add", "-f", "-m",
    JSON.stringify({ version:2, records:[...genuineNote.records, forgedNoteRecord] }), "HEAD"], {
    cwd:evidenceRepository,
  });
  await assert.rejects(() => verifyVerificationEvidence(
    "HEAD", baseline, "multi-pack-task", "alpha,beta", { repositoryRoot:evidenceRepository },
  ), /does not match the committed pack registry/u, "self-consistent forged notes cannot invent a reduced pack plan");
  await exec("git", ["notes", "--ref=refs/notes/swarmforge-verification", "add", "-f", "-m",
    JSON.stringify(genuineNote), "HEAD"], { cwd:evidenceRepository });

  const betaWrongBasePlan = await planFor(["alpha", "beta"], prebase);
  const betaWrongBaseReceipt = await receiptFor(betaWrongBasePlan, "beta-wrong-base-receipt");
  const pendingWrongBase = await createPendingVerificationEvidence({
    task:"multi-pack-task", plan:betaWrongBasePlan, receiptPath:betaWrongBaseReceipt,
    changedSince:prebase, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  });
  await recordPendingVerificationEvidence(pendingWrongBase.path, {
    repositoryRoot:evidenceRepository, artifactValidator:async() => artifact,
    toolchainValidator:skipToolchainValidation,
  });
  await assert.rejects(() => verifyVerificationEvidence(
    "HEAD", baseline, "multi-pack-task", "alpha,beta", { repositoryRoot:evidenceRepository },
  ), /does not exactly cover/u, "records from different received bases cannot be mixed");

  const betaPlan = await planFor(["alpha", "beta"]);
  const betaReceipt = await receiptFor(betaPlan, "beta-receipt");
  const pendingBeta = await createPendingVerificationEvidence({
    task:"multi-pack-task", plan:betaPlan, receiptPath:betaReceipt,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  });
  await recordPendingVerificationEvidence(pendingBeta.path, {
    repositoryRoot:evidenceRepository, artifactValidator:async() => artifact,
    toolchainValidator:skipToolchainValidation,
  });
  const combined = await verifyVerificationEvidence(
    "HEAD", baseline, "multi-pack-task", "alpha,beta", { repositoryRoot:evidenceRepository },
  );
  assert.ok(combined.records.some(({ packIds }) => packIds.join(",") === "alpha,beta"),
    "a canonical composite record remains eligible alongside preserved subset evidence");
  assert.ok((await verificationEvidence("HEAD", { repositoryRoot:evidenceRepository })).records.length >= 3,
    "recording a canonical composite plan preserves existing durable records");

  const concurrentPending = [];
  for (const id of ["concurrent-one", "concurrent-two"]) {
    const concurrentPlan = await planFor("alpha");
    const concurrentReceipt = await receiptFor(concurrentPlan, `${id}-receipt`);
    concurrentPending.push(await createPendingVerificationEvidence({
      task:"concurrent-record-task", plan:concurrentPlan, receiptPath:concurrentReceipt,
      changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
      toolchainValidator:skipToolchainValidation,
    }));
  }
  assert.notEqual(concurrentPending[0].path, concurrentPending[1].path,
    "same task and plan receive unique exclusive pending paths");
  const evidenceModule = pathToFileURL(path.resolve("scripts/verification-evidence.mjs")).href;
  const concurrentRecord = (pending) => exec(process.execPath, ["--input-type=module", "-e", [
    `import {recordPendingVerificationEvidence} from ${JSON.stringify(evidenceModule)};`,
    `const artifact=${JSON.stringify(artifact)};`,
    `await recordPendingVerificationEvidence(${JSON.stringify(pending.path)},{repositoryRoot:${JSON.stringify(evidenceRepository)},artifactValidator:async()=>artifact,toolchainValidator:async()=>{}});`,
  ].join("")], { cwd:evidenceRepository });
  const lockReceipt = await receiptFor(alphaPlan, "artifact-lock-receipt");
  const lockPending = await createPendingVerificationEvidence({
    task:"artifact-lock-task", plan:alphaPlan, receiptPath:lockReceipt,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  });
  const artifactLockPath = path.join(evidenceRepository, "tmp", ".dist-artifact.lock");
  const artifactRecorderStarted = path.join(evidenceRepository, "tmp", "artifact-recorder-started");
  const artifactValidatorSentinel = path.join(evidenceRepository, "tmp", "artifact-validator-entered");
  const releaseArtifact = await acquireDistArtifactLock(artifactLockPath);
  let lockedRecord;
  try {
    lockedRecord = exec(process.execPath, ["--input-type=module", "-e", [
      `import {writeFile} from "node:fs/promises";`,
      `import {recordPendingVerificationEvidence} from ${JSON.stringify(evidenceModule)};`,
      `const artifact=${JSON.stringify(artifact)};`,
      `await writeFile(${JSON.stringify(artifactRecorderStarted)},"started");`,
      `await recordPendingVerificationEvidence(${JSON.stringify(lockPending.path)},{repositoryRoot:${JSON.stringify(evidenceRepository)},artifactValidator:async()=>{await writeFile(${JSON.stringify(artifactValidatorSentinel)},"entered");return artifact;},toolchainValidator:async()=>{}});`,
    ].join("")], { cwd:evidenceRepository });
    for (let attempt = 0; attempt < 80; attempt += 1) {
      try { if (await readFile(artifactRecorderStarted, "utf8") === "started") break; }
      catch (error) { if (error?.code !== "ENOENT") throw error; }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.equal(await readFile(artifactRecorderStarted, "utf8"), "started");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await assert.rejects(readFile(artifactValidatorSentinel), (error) => error?.code === "ENOENT",
      "the recorder cannot validate or publish while another process owns the repository artifact lock");
  } finally {
    await releaseArtifact();
  }
  await lockedRecord;
  assert.equal(await readFile(artifactValidatorSentinel, "utf8"), "entered");
  await Promise.all(concurrentPending.map(concurrentRecord));
  const concurrentRecords = (await verificationEvidence("HEAD", { repositoryRoot:evidenceRepository })).records
    .filter(({ task }) => task === "concurrent-record-task");
  assert.deepEqual(new Set(concurrentRecords.map(({ evidenceId:recordId }) => recordId)),
    new Set(concurrentPending.map(({ evidence }) => evidence.evidenceId)),
    "two genuine recorder processes preserve both Git-note records");

  const largeNotePlan = await planFor("alpha");
  const largeNoteReceipt = await receiptFor(largeNotePlan, "large-note-receipt");
  const largeNotePending = await createPendingVerificationEvidence({
    task:"large-note-task", plan:largeNotePlan, receiptPath:largeNoteReceipt,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  });
  const largeNoteDocument = JSON.parse(await readFile(largeNotePending.path, "utf8"));
  largeNoteDocument.regressionPadding = "x".repeat(256 * 1024);
  await writeFile(largeNotePending.path, JSON.stringify(largeNoteDocument));
  await recordPendingVerificationEvidence(largeNotePending.path, {
    repositoryRoot:evidenceRepository, artifactValidator:async() => artifact,
    toolchainValidator:skipToolchainValidation,
  });
  assert.ok((await verificationEvidence("HEAD", { repositoryRoot:evidenceRepository })).records
    .some(({ task }) => task === "large-note-task"),
  "large all-pack evidence records through Git stdin without exceeding process argument limits");

  const mixedArtifacts = [
    artifact,
    syntheticArtifact(artifact.inputDigest, "e".repeat(64), lockedRuntime),
  ];
  const mixedArtifactBase = await exec("git", ["rev-parse", "HEAD"], { cwd:evidenceRepository });
  await mkdir(path.join(evidenceRepository, "dist"), { recursive:true });
  await writeFile(path.join(evidenceRepository, "dist", "evidence-marker"), "generated\n");
  await exec("git", ["add", "dist/evidence-marker"], { cwd:evidenceRepository });
  await exec("git", ["commit", "-qm", "generated-only candidate"], { cwd:evidenceRepository });
  for (const [index, id] of ["alpha", "beta"].entries()) {
    const mixedPlan = await planFor(id, mixedArtifactBase);
    const mixedReceipt = await receiptFor(mixedPlan, `${id}-receipt`, mixedArtifacts[index]);
    const mixedPending = await createPendingVerificationEvidence({
      task:"mixed-artifact-task", plan:mixedPlan, receiptPath:mixedReceipt,
      changedSince:mixedArtifactBase, buildManifest:mixedArtifacts[index], repositoryRoot:evidenceRepository,
      toolchainValidator:skipToolchainValidation,
    });
    await recordPendingVerificationEvidence(mixedPending.path, {
      repositoryRoot:evidenceRepository,
      artifactValidator:async() => mixedArtifacts[index],
      toolchainValidator:skipToolchainValidation,
    });
  }
  await assert.rejects(() => verifyVerificationEvidence(
    "HEAD", mixedArtifactBase, "mixed-artifact-task", "alpha,beta", { repositoryRoot:evidenceRepository },
  ), /does not exactly cover/u, "one claim cannot mix records produced from different dist artifacts");
} finally {
  await rm(evidenceRepository, { recursive:true, force:true });
}

import { promisify } from "node:util";
import { historicalVerificationRegistry } from "../../scripts/verification-planner/history/changes.mjs";
import { serializeVerificationRegistry } from "../../scripts/verification-registry/compiler.mjs";

const historicalBase = [{ id:"shell" }];

const historicalFragments = [{ version:1, order:1, pack:{ id:"verification_process" } }];

const historicalCanonical = serializeVerificationRegistry([
  historicalBase[0], historicalFragments[0].pack,
]);

assert.deepEqual(historicalVerificationRegistry({ canonical:historicalCanonical,
  base:serializeVerificationRegistry(historicalBase),
  fragments:[`${JSON.stringify(historicalFragments[0], null, 2)}\n`] }),
[{ id:"shell" }, { id:"verification_process" }],
"historical planning reconstructs migrated fragments at their own revision");

assert.deepEqual(historicalVerificationRegistry({ canonical:historicalCanonical }),
  [{ id:"shell" }, { id:"verification_process" }],
  "pre-migration revisions retain canonical compatibility loading");

assert.throws(() => historicalVerificationRegistry({
  canonical:serializeVerificationRegistry(historicalBase),
  base:serializeVerificationRegistry(historicalBase),
  fragments:[`${JSON.stringify(historicalFragments[0])}\n`],
}), /generated verification registry is stale/u,
"historical fragment reconstruction rejects stale canonical output");

assert.throws(() => historicalVerificationRegistry({
  canonical:historicalCanonical, base:serializeVerificationRegistry(historicalBase),
}), /incomplete authoritative inputs/u,
"historical fragment reconstruction fails closed when a migration input is missing");

const historyFixtureExec = promisify(execFile);

const historyFixtureRepository = await mkdtemp(path.join(os.tmpdir(), "verification-history-contract-"));

try {
  await historyFixtureExec("git", ["init", "--quiet"], { cwd:historyFixtureRepository });
  await writeFile(path.join(historyFixtureRepository, "former.mjs"), "export const value = 1;\n");
  await historyFixtureExec("git", ["add", "former.mjs"], { cwd:historyFixtureRepository });
  await historyFixtureExec("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid",
    "commit", "--quiet", "-m", "base"], { cwd:historyFixtureRepository });
  const historyFixtureBase = (await historyFixtureExec("git", ["rev-parse", "HEAD"],
    { cwd:historyFixtureRepository })).stdout.trim();
  await rename(path.join(historyFixtureRepository, "former.mjs"),
    path.join(historyFixtureRepository, "current.mjs"));
  await historyFixtureExec("git", ["add", "-A"], { cwd:historyFixtureRepository });
  await historyFixtureExec("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid",
    "commit", "--quiet", "-m", "rename"], { cwd:historyFixtureRepository });
  const historyFixtureChangeSet = await canonicalVerificationChangeSet({
    base:historyFixtureBase, repositoryRoot:historyFixtureRepository });
  assert.deepEqual(historyFixtureChangeSet.paths, ["current.mjs", "former.mjs"],
    "historical planning conserves both sides of a rename");
  assert.equal(historyFixtureChangeSet.entries[0].status, "R", "rename identity remains explicit");
} finally {
  await rm(historyFixtureRepository, { recursive:true, force:true });
}
