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

const impact = planVerification(synthetic, { changedPaths:["src/alpha/change.ts"] });

assert.deepEqual(impact.packIds, ["alpha", "beta"]);

assert.equal(impact.unitCommands.length, 4, "source impact keeps all selected unit leaves");

const exactInputPacks = [
  pack("alpha"),
  pack("beta", { dependencies:["alpha"] }),
  pack("gamma", { verificationInputs:["src/alpha/observed.ts"] }),
  pack("delta", { dependencies:["gamma"] }),
];

const exactInputPlan = planVerification(exactInputPacks, {
  changedPaths:["src/alpha/observed.ts"],
});

assert.deepEqual(exactInputPlan.packIds, ["alpha", "beta", "gamma"],
  "exact verification inputs union their consumer after semantic closure without propagating its dependants");

assert.deepEqual(exactInputPlan.changedOwners["src/alpha/observed.ts"], ["alpha", "beta", "gamma"],
  "fail-closed evidence records the exact non-propagating verification consumer");

assert.throws(() => planVerification(exactInputPacks, {
  packIds:["alpha", "beta"], changedPaths:["src/alpha/observed.ts"],
}), /outside the explicit pack set: gamma/u,
"an explicit evidence boundary cannot omit an exact verification consumer");

const runtimeInputPacks = [
  pack("delivery"),
  pack("editor", { runtimeInputs:["src/delivery/theme.css"] }),
  pack("editor-consumer", { dependencies:["editor"] }),
  pack("unrelated"),
];

const runtimeInputPlan = planVerification(runtimeInputPacks, {
  changedPaths:["src/delivery/theme.css"],
});

assert.deepEqual(runtimeInputPlan.packIds, ["delivery", "editor", "editor-consumer"],
  "delivery runtime consumers expand semantically while unrelated packs remain excluded");

const focusedObservationPacks = [pack("browser", {
  browserObservations:[
    { id:"BROWSER_FIRST", path:"test/browser.mjs", environment:{ BROWSER_FIRST:"1" },
      observationKeys:["first"], features:["features/browser-one.feature"], sessionBatch:"browser-main" },
    { id:"BROWSER_SECOND", path:"test/browser.mjs", environment:{ BROWSER_SECOND:"1" },
      observationKeys:["second"], features:["features/browser-two.feature"], sessionBatch:"browser-main" },
  ],
})];

const feature = planVerification(synthetic, { changedPaths:["features/alpha-one.feature"] });

const syntheticChangeSet = (entries) => ({
  version:1,
  baseCommit:"1".repeat(40),
  commit:"2".repeat(40),
  entries,
  paths:[...new Set(entries.flatMap((entry) => entry.oldPath
    ? [entry.oldPath, entry.newPath]
    : [entry.path]))].sort(),
});

const packs = await loadVerificationPacks();

const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);

const vtd004CurrentCalibration = JSON.parse(await readFile(
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));

const registeredHandlerPaths = [...new Set(packs.flatMap((pack) => pack.handlers ?? []))];

const exactEvidenceKeys = ["unit", "property", "features", "handlers", "browserAdapters"];

const vtd006RegisteredPrograms = new Set([
  "test/browser-packs/side-panel-capture.mjs",
  "test/browser-packs/side-panel-event-library.mjs",
  "test/browser-packs/side-panel-schemas.mjs",
  "test/browser-packs/side-panel-defects.mjs",
  "test/browser-packs/side-panel-shell.mjs",
]);

const sidePanelPreparationProgram = (path) =>
  /^test\/data-layer-installed\/(?:consumers\/)?[^/]+-(?:controller|consumer)-test\.mjs$/u
    .test(path) || path === "test/side-panel-direct-compatibility-capture-test.mjs";

const conservedEvidenceProfile = (pack) => Object.fromEntries(exactEvidenceKeys.map((key) => [key,
  pack[key].filter((path) => !vtd006RegisteredPrograms.has(path) &&
    !sidePanelPreparationProgram(path)),
]));

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

const calibrationProvenanceKeys = ["version", "implementationCommit", "environmentClassId", "environment",
  "sourceScope", "minimumIndependentSamples", "tolerance", "receiptDigests", "algorithm"];

const calibrationProvenance = (calibration) => Object.fromEntries(calibrationProvenanceKeys.map((key) =>
  [key, calibration[key]]));

const eventLibraryPack = packs.find(({id}) => id === "event-library");

const eventLibraryBasePacks = JSON.parse(await exec("git", ["show", "c37e22d3f4:verification/packs.json"]));

const eventLibraryBaseCalibration = JSON.parse(await exec("git", [
  "show", "c37e22d3f4:verification/performance-calibration.json",
]));

const eventReviewPresentationPaths = ["src/data-layer-push-draft-review-ui.ts",
  "src/data-layer-template-change-review-ui.ts"];

const eventEditorPaths = ["src/data-layer-event-library-editor.ts",
  "src/data-layer-event-library-editor-ui.ts"];

const eventSemanticPaths = ["src/data-layer-event-library-deletion.ts",
  "src/data-layer-event-library-transfer.ts", "src/data-layer-event-template-renaming.ts",
  "src/data-layer-push-draft-review.ts", "src/data-layer-template-change-review.ts",
  "src/data-layer-selected-target-push.ts", "src/data-layer-selected-target-push-page.ts"];

const sidePanelSource = await readFile(new URL("../../src/side-panel.ts", import.meta.url), "utf8");

assert.doesNotMatch(sidePanelSource, /renderPushDraftReview|renderTemplateChangeReview/u,
  "the composition root does not retain Event Library review rendering");

const installedRuntimeSource = await readFile(
  new URL("../../src/data-layer-installed/runtime.ts", import.meta.url), "utf8");

assert.match(installedRuntimeSource,
  /renderPushReview:\(host,review\)=>eventApi\.renderPushDraftReview\(host,review\)/u);

assert.match(installedRuntimeSource,
  /renderRevisionReview:\(host,review\)=>eventApi\.renderTemplateChangeReview\(host,review\)/u);

const eventClosure = ["event-library", "project_event_transport", "defects", "replay",
  "live_flow_testing", "guided_test_cases", "shell"];

const eventEditorClosure = ["capture", ...eventClosure];

for (const changedPath of eventReviewPresentationPaths) assert.deepEqual(
  planVerification(packs, {changedPaths:[changedPath]}).packIds, ["event-library"],
  `${changedPath} selects only complete Event Library evidence`);

for (const changedPath of eventEditorPaths) assert.deepEqual(
  planVerification(packs, {changedPaths:[changedPath]}).packIds, eventEditorClosure,
  `${changedPath} retains Capture plus the ordinary Event Library closure`);

for (const changedPath of eventSemanticPaths) assert.deepEqual(
  planVerification(packs, {changedPaths:[changedPath]}).packIds, eventClosure,
  `${changedPath} retains the seven-pack dependant closure`);

assert.deepEqual(eventLibraryPack.isolatedVerificationHandlers, [
  "acceptance/src/acceptance/steps/event_library_editor.clj",
  "acceptance/src/acceptance/steps/event_template_library.clj",
  "acceptance/src/acceptance/steps/library_direct_template_push.clj",
]);

const eventHandlerEvidence = [];

for (const handlerPath of eventLibraryPack.isolatedVerificationHandlers) {
  const handlerSource = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
  const servedFeatures = [...handlerSource.matchAll(/"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)]
    .map((match) => match[1]);
  const namespace = handlerPath.replace(/^acceptance\/src\//u, "").replace(/\.clj$/u, "")
    .replaceAll("/", ".").replaceAll("_", "-");
  const consumers = [];
  for (const consumerPath of registeredHandlerPaths) {
    if (consumerPath === handlerPath || consumerPath === "acceptance/src/acceptance/steps/all.clj" ||
        eventLibraryPack.handlers.includes(consumerPath)) continue;
    const consumerSource = await readFile(new URL(`../../${consumerPath}`, import.meta.url), "utf8");
    if (clojureRequiresNamespace(consumerSource, namespace)) consumers.push(consumerPath);
  }
  assert.deepEqual(consumers, [], `${handlerPath} has no loaded cross-pack APS consumer`);
  assert.deepEqual(planVerification(packs, {changedPaths:[handlerPath]}).packIds, ["event-library"]);
  eventHandlerEvidence.push({path:handlerPath,servedFeatures,consumers,
    ownerPlan:planVerification(packs, {changedPaths:[handlerPath]}).packIds,
    negativeMutationRejected:true});
}

const captureRejection = async(action) => {
  let rejected;
  try { await action(); } catch (error) { rejected = error; }
  assert.ok(rejected instanceof Error, "the isolation mutation must be rejected");
  return rejected.message;
};

const loadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs, {
  findLoadedStepConsumers:async() => [{
    handler:"acceptance/src/acceptance/steps/event_template_library.clj",
    consumerPack:"project_event_transport",
    feature:"features/data-layer-project-event-transport-settings.feature",
    step:"<project> is active",
  }],
}));

assert.match(loadedStepDiagnostic,
  /Loaded cross-pack step consumer blocks isolation.*project_event_transport/u,
  "an effective Event Library pattern matching a parsed dependant step blocks isolation");

const eventCrossPackHandler = packs.find(({id}) => id === "project_event_transport").handlers[0];

const namespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs, {
  readSource:async(handlerPath) => {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
  return handlerPath === eventCrossPackHandler
    ? `${source}\n[acceptance.steps.event-template-library :refer [handlers]]\n` : source;
}}));

assert.match(namespaceDiagnostic, /Cross-pack handler consumer/u,
  "a non-:as Event Library consumer blocks handler isolation");

const nonIsolatedEventPacks = replacePack(packs, "event-library", (pack) => ({
  isolatedVerificationHandlers:[],
}));

const rejectedHandlerPlan = planVerification(nonIsolatedEventPacks, {
  changedPaths:["acceptance/src/acceptance/steps/event_template_library.clj"],
}).packIds;

assert.deepEqual(rejectedHandlerPlan,eventClosure,
  "a handler rejected from isolation retains the seven-pack dependant closure");

const eventHistoryChange = (entry) => syntheticChangeSet([entry]);

const deletedEventPresentation = eventHistoryChange({status:"D",path:eventReviewPresentationPaths[0]});

const renameEventPresentation = (newPath) => eventHistoryChange({status:"R",score:100,
  oldPath:eventReviewPresentationPaths[0],newPath});

const eventHistoryPlans = {
  delete:planVerification(packs, {changedPaths:deletedEventPresentation.paths,
    changeSet:deletedEventPresentation,basePacks:packs}).packIds,
  renamePresentation:planVerification(packs, {changedPaths:renameEventPresentation(
    eventReviewPresentationPaths[1]).paths,changeSet:renameEventPresentation(
    eventReviewPresentationPaths[1]),basePacks:packs}).packIds,
  renameEditorUi:planVerification(packs, {changedPaths:renameEventPresentation(
    eventEditorPaths[1]).paths,changeSet:renameEventPresentation(eventEditorPaths[1]),basePacks:packs}).packIds,
  renameEditorModel:planVerification(packs, {changedPaths:renameEventPresentation(
    eventEditorPaths[0]).paths,changeSet:renameEventPresentation(eventEditorPaths[0]),basePacks:packs}).packIds,
  renameSemantic:planVerification(packs, {changedPaths:renameEventPresentation(
    "src/data-layer-push-draft-review.ts").paths,changeSet:renameEventPresentation(
    "src/data-layer-push-draft-review.ts"),basePacks:packs}).packIds,
  unreadable:planVerification(packs, {changedPaths:deletedEventPresentation.paths,
    changeSet:deletedEventPresentation,basePacks:packs,historicalRegistryFallback:true}).packIds,
};

assert.deepEqual(eventHistoryPlans.delete,["event-library"]);

assert.deepEqual(eventHistoryPlans.renamePresentation,["event-library"]);

assert.deepEqual(eventHistoryPlans.renameEditorUi,eventEditorClosure);

assert.deepEqual(eventHistoryPlans.renameEditorModel,eventEditorClosure);

assert.deepEqual(eventHistoryPlans.renameSemantic,eventClosure);

assert.deepEqual(eventHistoryPlans.unreadable,planVerification(packs,{terminalFull:true}).packIds);

const eventEvidenceProfile = conservedEvidenceProfile(eventLibraryPack);

const eventBasePack = eventLibraryBasePacks.find(({id}) => id === "event-library");

assert.deepEqual(eventEvidenceProfile,
  conservedEvidenceProfile(eventBasePack),
  "all Event Library owner evidence identities remain conserved");

const exactEventPlan = planVerification(packs,{packIds:["event-library"],includeProperties:true});

const acceptedEventPlan = planVerification(vtd008BasePacks,
  {packIds:["event-library"],includeProperties:true,historicalRegistryFallback:true});

assert.deepEqual(terminalIdentities({ tasks:exactEventPlan.tasks.filter(({ key }) =>
  !postBaseAddedRegisteredTaskKeys.has(key)) }), terminalIdentities(acceptedEventPlan),
  "the exact Event Library plan remains identical to the accepted specification base");

assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities,
  "terminal planning conserves every Event Library task identity and ordering");

const eventCompletedCalibration = JSON.parse(await exec("git", [
  "show", "be319ad555:verification/performance-calibration.json",
]));

const eventCalibration = eventCompletedCalibration.runnablePacks.find(({id}) => id === "event-library");

const eventBaseCalibration = eventLibraryBaseCalibration.runnablePacks.find(({id}) => id === "event-library");

assert.deepEqual({representative:eventCalibration.representativeChangedPath,
  selectedPacks:eventCalibration.selectedPacks,fanOut:eventCalibration.changedPathFanOut.limit,
  duration:[eventCalibration.changedPathDuration.baseline,eventCalibration.changedPathDuration.tolerance,
    eventCalibration.changedPathDuration.limit]},
{representative:eventReviewPresentationPaths[0],selectedPacks:["event-library"],fanOut:0,
  duration:[11.6,1.2,14]});

const eventOtherCurrent = eventCompletedCalibration.runnablePacks.filter(({id}) => id !== "event-library");

const eventOtherBase = eventLibraryBaseCalibration.runnablePacks.filter(({id}) => id !== "event-library");

assert.deepEqual(eventOtherCurrent,eventOtherBase);

assert.deepEqual(eventCompletedCalibration.browserTargets,eventLibraryBaseCalibration.browserTargets);

assert.deepEqual(calibrationProvenance(eventCompletedCalibration),calibrationProvenance(eventLibraryBaseCalibration));

const eventInstalledSource = await readFile(
  new URL("../../test/support/side-panel-event-library-fixtures.mjs", import.meta.url), "utf8");

assert.match(eventInstalledSource,/renderers:\{push:pushRendered,revision:revisionRendered,revisionEmpty\}/u,
  "the installed observation directly renders push and revision supplied values");

const vtd004EventAcceptance = {
  currentPlans:Object.fromEntries([...eventReviewPresentationPaths,...eventEditorPaths,...eventSemanticPaths]
    .map((changedPath) => [changedPath,planVerification(packs,{changedPaths:[changedPath]}).packIds])),
  historyPlans:eventHistoryPlans,
  handlers:eventHandlerEvidence,
  isolationAudit:{loadedStepDiagnostic,namespaceDiagnostic,
    rejectedHandlerPlan,metadataCannotConceal:true},
  conservation:{evidenceProfile:eventEvidenceProfile,exactTaskCount:acceptedEventPlan.tasks.length,
    unitCount:eventEvidenceProfile.unit.length,propertyCount:eventEvidenceProfile.property.length,
    featureCount:exactEventPlan.parserTasks.length,handlerCount:eventLibraryPack.handlers.length,
    adapterCount:exactEventPlan.browserTasks.length,targetCount:exactEventPlan.observationTasks.length,
    executionTaskCounts:{unit:exactEventPlan.unitTasks.length,
      property:exactEventPlan.propertyTasks.length,exact:exactEventPlan.tasks.length},
    terminalTaskIdentitiesConserved:true,packageCheckCount:1,directRevisionRenderer:true},
  calibration:{current:eventCalibration,otherPackRowsConserved:true,browserTargetRowsConserved:true,
    previous:eventBaseCalibration,exactPackCalibrationConserved:
      JSON.stringify(eventCalibration.exactPackDuration) === JSON.stringify(eventBaseCalibration.exactPackDuration),
    provenanceConserved:true,otherPackCount:eventOtherCurrent.length,
    browserTargetCount:Object.keys(eventCompletedCalibration.browserTargets).length},
  presentationBoundary:{ownerOnly:true,callerSuppliedRoots:true,effectIsolated:true,
    semanticIsolated:true,installedDirect:true,behaviorPreserved:true},
};

const capturePack = packs.find(({id}) => id === "capture");

const captureBasePacks = JSON.parse(await exec("git", ["show", "be319ad555:verification/packs.json"]));

const captureBaseCalibration = JSON.parse(await exec("git", [
  "show", "be319ad555:verification/performance-calibration.json",
]));

const captureClosure = ["capture", "event-library", "project_event_transport", "schemas", "defects",
  "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"];

const capturePresentationPaths = [
  "src/data-layer-event-feed-query-ui.ts",
  "src/data-layer-live-inspector-presentation-ui.ts",
  "src/data-layer-live-inspector-return-ui.ts",
  "src/data-layer-live-session-controls-ui.ts",
  "src/data-layer-live-session-summary-ui.ts",
  "src/data-layer-observation-targets-ui.ts",
];

const expectedCaptureBoundaries = [
  ["capture_event_feed_semantic", "core or semantic", true],
  ["capture_event_feed_presentation", "browser presentation", false],
  ["capture_inspector_controller", "application controller", true],
  ["capture_inspector_return_semantic", "core or semantic", true],
  ["capture_inspector_local_presentation", "browser presentation", false],
  ["capture_live_observer_semantic", "core or semantic", true],
  ["capture_shared_live_presentation", "browser presentation", true],
  ["capture_runtime_controllers", "application controller", true],
  ["capture_live_session_semantic", "core or semantic", true],
  ["capture_live_session_presentation", "browser presentation", false],
  ["capture_observation_target_semantic", "core or semantic", true],
  ["capture_observation_target_presentation", "browser presentation", false],
  ["capture_shared_semantic_models", "core or semantic", true],
  ["capture_persistence", "persistence migration", true],
  ["capture_event_library_focus_presentation", "browser presentation", true],
  ["capture_live_target_permission_recovery", "application controller", false],
  ["capture_installed_side_panel_boundary", "application controller", false],
];

assert.deepEqual(capturePack.impactBoundaries.map(({id,sourceClass,propagateDependants}) =>
  [id,sourceClass,propagateDependants]), expectedCaptureBoundaries,
"Capture source classes and propagation are explicit registry data");

for (const changedPath of capturePresentationPaths) assert.deepEqual(
  planVerification(packs,{changedPaths:[changedPath]}).packIds,["capture"],
  `${changedPath} selects only complete Capture evidence`);

const capturePropagatingPaths = capturePack.impactBoundaries
  .filter(({propagateDependants}) => propagateDependants)
  .flatMap(({prefixes}) => prefixes);

for (const changedPath of capturePropagatingPaths) assert.deepEqual(
  planVerification(packs,{changedPaths:[changedPath]}).packIds,captureClosure,
  `${changedPath} retains the ten-pack dependant closure`);

const captureIsolatedHandlers = [
  "acceptance/src/acceptance/steps/cross_tab_reattachment.clj",
  "acceptance/src/acceptance/steps/event_feed_query.clj",
  "acceptance/src/acceptance/steps/live_event_presentation.clj",
  "acceptance/src/acceptance/steps/lossless_observation_activation.clj",
];

assert.deepEqual(capturePack.isolatedVerificationHandlers,captureIsolatedHandlers);

const captureHandlerEvidence = [];

for (const handlerPath of captureIsolatedHandlers) {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url),"utf8");
  const servedFeatures = [...source.matchAll(/"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)]
    .map((match) => match[1]);
  assert.ok(servedFeatures.length > 0,`${handlerPath} names its owner-only served features`);
  assert.deepEqual(planVerification(packs,{changedPaths:[handlerPath]}).packIds,["capture"]);
  captureHandlerEvidence.push({path:handlerPath,servedFeatures,ownerPlan:["capture"],consumers:[]});
}

const captureLoadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => [{handler:captureIsolatedHandlers[1],consumerPack:"schemas",
    feature:"features/data-layer-schema-validation-workflow.feature",step:"a captured event is selected"}],
}));

assert.match(captureLoadedStepDiagnostic,/Loaded cross-pack step consumer blocks isolation.*schemas/u);

const replayHandler = packs.find(({id}) => id === "replay").handlers[0];

const captureNamespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8");
    return handlerPath === replayHandler
      ? `${source}\n[acceptance.steps.event-feed-query :refer [handlers]]\n` : source;
  },
}));

assert.match(captureNamespaceDiagnostic,/Cross-pack handler consumer blocks isolation.*replay/u);

const missingMetadataDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => handlerPath === captureIsolatedHandlers[0] ? "(def handlers [])"
    : readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8"),
}));

assert.match(missingMetadataDiagnostic,/Owner-only served features are required/u);

const unreadableAuditDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => { throw new Error("unreadable parsed consumer evidence"); },
}));

assert.match(unreadableAuditDiagnostic,/Isolation audit fails closed/u);

const nonIsolatedCapturePacks = replacePack(packs,"capture",() => ({isolatedVerificationHandlers:[]}));

const rejectedCaptureHandlerPlan = planVerification(nonIsolatedCapturePacks,{
  changedPaths:[captureIsolatedHandlers[1]],
}).packIds;

assert.deepEqual(rejectedCaptureHandlerPlan,captureClosure);

const captureHistoryChange = (entry) => syntheticChangeSet([entry]);

const deletedCapturePresentation = captureHistoryChange({status:"D",path:capturePresentationPaths[1]});

const renameCapturePresentation = (newPath) => captureHistoryChange({status:"R",score:100,
  oldPath:capturePresentationPaths[1],newPath});

const captureHistoryPlans = {
  delete:planVerification(packs,{changedPaths:deletedCapturePresentation.paths,
    changeSet:deletedCapturePresentation,basePacks:packs}).packIds,
  renamePresentation:planVerification(packs,{changedPaths:renameCapturePresentation(
    capturePresentationPaths[2]).paths,changeSet:renameCapturePresentation(capturePresentationPaths[2]),
    basePacks:packs}).packIds,
  renameSharedPresentation:planVerification(packs,{changedPaths:renameCapturePresentation(
    "src/data-layer-live-observer-ui.ts").paths,changeSet:renameCapturePresentation(
    "src/data-layer-live-observer-ui.ts"),basePacks:packs}).packIds,
  renameSemantic:planVerification(packs,{changedPaths:renameCapturePresentation(
    "src/data-layer-live-observer.ts").paths,changeSet:renameCapturePresentation(
    "src/data-layer-live-observer.ts"),basePacks:packs}).packIds,
  renamePersistence:planVerification(packs,{changedPaths:renameCapturePresentation(
    "src/data-layer-saved-sessions.ts").paths,changeSet:renameCapturePresentation(
    "src/data-layer-saved-sessions.ts"),basePacks:packs}).packIds,
  renameLibraryFocus:planVerification(packs,{changedPaths:renameCapturePresentation(
    "src/data-layer-workflow-focus-ui.ts").paths,changeSet:renameCapturePresentation(
    "src/data-layer-workflow-focus-ui.ts"),basePacks:packs}).packIds,
  unreadable:planVerification(packs,{changedPaths:deletedCapturePresentation.paths,
    changeSet:deletedCapturePresentation,basePacks:packs,historicalRegistryFallback:true}).packIds,
};

assert.deepEqual(captureHistoryPlans.delete,["capture"]);

assert.deepEqual(captureHistoryPlans.renamePresentation,["capture"]);

for (const key of ["renameSharedPresentation","renameSemantic","renamePersistence","renameLibraryFocus"])
  assert.deepEqual(captureHistoryPlans[key],captureClosure);

assert.deepEqual(captureHistoryPlans.unreadable,planVerification(packs,{terminalFull:true}).packIds);

const captureEvidenceProfile = conservedEvidenceProfile(capturePack);

const captureBasePack = captureBasePacks.find(({id}) => id === "capture");

const captureBaseEvidenceProfile = conservedEvidenceProfile(captureBasePack);

const captureLiveSessionReleaseIndex = captureBaseEvidenceProfile.unit
  .indexOf("test/data-layer-live-session-target-release-test.mjs") + 1;

assert.deepEqual(captureEvidenceProfile, {
  ...captureBaseEvidenceProfile,
  unit:[
    ...captureBaseEvidenceProfile.unit.slice(0, captureLiveSessionReleaseIndex),
    "test/data-layer-live-target-permission-recovery-test.mjs",
    ...captureBaseEvidenceProfile.unit.slice(captureLiveSessionReleaseIndex),
  ],
},
  "all Capture owner evidence identities remain conserved");

const exactCapturePlan = planVerification(packs,{packIds:["capture"],includeProperties:true});

assert.equal(exactCapturePlan.tasks.length,174);

assert.deepEqual([exactCapturePlan.unitTasks.length,exactCapturePlan.propertyTasks.length,
  exactCapturePlan.parserTasks.length,capturePack.handlers.length,exactCapturePlan.browserTasks.length,
  exactCapturePlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).length,
  exactCapturePlan.checkpointTasks.length],[24,12,66,25,1,5,2]);

assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities,
  "terminal planning conserves every Capture task identity and ordering");

const captureCompletedCalibration = JSON.parse(await exec("git", [
  "show", "14e4992a87:verification/performance-calibration.json",
]));

const captureCalibration = captureCompletedCalibration.runnablePacks.find(({id}) => id === "capture");

const capturePreviousCalibration = captureBaseCalibration.runnablePacks.find(({id}) => id === "capture");

assert.deepEqual({selectedPacks:captureCalibration.selectedPacks,
  fanOut:captureCalibration.changedPathFanOut.limit,
  duration:[captureCalibration.changedPathDuration.baseline,captureCalibration.changedPathDuration.tolerance,
    captureCalibration.changedPathDuration.limit]},
{selectedPacks:["capture"],fanOut:0,duration:[51.9,1.2,63]});

const captureOtherCurrent = captureCompletedCalibration.runnablePacks.filter(({id}) => id !== "capture");

const captureOtherBase = captureBaseCalibration.runnablePacks.filter(({id}) => id !== "capture");

assert.deepEqual(captureOtherCurrent,captureOtherBase);

assert.deepEqual(captureCompletedCalibration.browserTargets,captureBaseCalibration.browserTargets);

assert.deepEqual(calibrationProvenance(captureCompletedCalibration),calibrationProvenance(
  captureBaseCalibration));

const captureInstalledSource = await readFile(
  new URL("../../test/support/side-panel-capture-fixtures.mjs",import.meta.url),"utf8");

assert.match(captureInstalledSource,/inspectorPresentation:\{captured,restored\}/u,
  "the installed Capture observation directly captures and restores inspector presentation");

const vtd004CaptureAcceptance = {
  currentPlans:Object.fromEntries([...capturePresentationPaths,...capturePropagatingPaths]
    .map((changedPath) => [changedPath,planVerification(packs,{changedPaths:[changedPath]}).packIds])),
  historyPlans:captureHistoryPlans,
  handlers:captureHandlerEvidence,
  isolationAudit:{captureLoadedStepDiagnostic,captureNamespaceDiagnostic,missingMetadataDiagnostic,
    unreadableAuditDiagnostic,rejectedCaptureHandlerPlan,metadataCannotConceal:true},
  conservation:{evidenceProfile:captureEvidenceProfile,
    exactTaskCount:exactCapturePlan.tasks.length-(capturePack.unit.length-captureEvidenceProfile.unit.length),
    unitCount:captureEvidenceProfile.unit.length,propertyCount:12,featureCount:66,handlerCount:25,
    adapterCount:1,targetCount:5,
    executionTaskCounts:{unit:exactCapturePlan.unitTasks.length,
      property:exactCapturePlan.propertyTasks.length,exact:exactCapturePlan.tasks.length},
    checkpointCount:2,terminalTaskIdentitiesConserved:true,packageCheckCount:1,
    directInspectorPresentation:true},
  calibration:{current:captureCalibration,previous:capturePreviousCalibration,
    otherPackRowsConserved:true,browserTargetRowsConserved:true,exactPackCalibrationConserved:
      JSON.stringify(captureCalibration.exactPackDuration) === JSON.stringify(
        capturePreviousCalibration.exactPackDuration),provenanceConserved:true,
    otherPackCount:captureOtherCurrent.length,
    browserTargetCount:Object.keys(captureCompletedCalibration.browserTargets).length},
  presentationBoundary:{ownerOnly:true,suppliedValues:true,effectIsolated:true,
    semanticIsolated:true,installedDirect:true,behaviorPreserved:true},
};

const schemasPack = packs.find(({id}) => id === "schemas");

const schemasBasePacks = JSON.parse(await exec("git", ["show", "14e4992a87:verification/packs.json"]));

const schemasBaseCalibration = JSON.parse(await exec("git", [
  "show", "14e4992a87:verification/performance-calibration.json",
]));

const schemasClosure = ["schemas", "defects", "live_flow_testing", "project_assurance_severity",
  "guided_test_cases", "shell"];

const schemasPresentationPaths = [
  "src/data-layer-allowed-value-expansion-ui.ts",
  "src/data-layer-guided-schema-picker-ui.ts",
  "src/data-layer-live-schema-property-declaration-ui.ts",
  "src/data-layer-local-rule-promotion-ui.ts",
  "src/data-layer-schema-assignment-data-conditions-ui.ts",
  "src/data-layer-schema-property-copy-ui.ts",
  "src/data-layer-schema-property-type-editing-ui.ts",
  "src/data-layer-schema-specification-builder-ui.ts",
];

const expectedSchemasBoundaries = [
  ["schemas_local_browser_presentation", "browser presentation", false],
  ["schemas_shared_browser_workflows", "browser presentation", true],
  ["schemas_application_controllers", "application controller", true],
  ["schemas_persistence_and_migration", "persistence migration", true],
  ["schemas_core_semantics", "core or semantic", true],
  ["schemas_public_core_facades", "core or semantic", true],
  ["schemas_public_application_facades", "application controller", true],
  ["schemas_public_browser_facades", "browser presentation", true],
  ["schemas_installed_side_panel_boundary", "application controller", false],
];

assert.deepEqual(schemasPack.impactBoundaries.map(({id,sourceClass,propagateDependants}) =>
  [id,sourceClass,propagateDependants]), expectedSchemasBoundaries,
"Schemas source classes and propagation are explicit registry data");

for (const changedPath of schemasPresentationPaths) assert.deepEqual(
  planVerification(packs,{changedPaths:[changedPath]}).packIds,["schemas"],
  `${changedPath} selects only complete Schemas evidence`);

const schemasBoundaryPaths = schemasPack.impactBoundaries.flatMap(({prefixes}) => prefixes);

assert.equal(schemasBoundaryPaths.length,89,"every Schemas source path has one exact boundary");

assert.equal(new Set(schemasBoundaryPaths).size,89,"Schemas impact boundaries cannot overlap");

const schemasPropagatingPaths = schemasPack.impactBoundaries
  .filter(({propagateDependants}) => propagateDependants)
  .flatMap(({prefixes}) => prefixes);

for (const changedPath of schemasPropagatingPaths) assert.deepEqual(
  planVerification(packs,{changedPaths:[changedPath]}).packIds,schemasClosure,
  `${changedPath} retains the six-pack dependant closure`);

const schemasIsolatedHandlerNames = [
  "allowed_value_expansion.clj", "allowed_values_rule_migration.clj",
  "canonical_declared_property_validation.clj", "conditional_validation_rules.clj",
  "guided_assignment_coverage.clj", "guided_nested_property_merge.clj",
  "guided_rule_parameter_integrity.clj", "guided_validation.clj", "json_schema_export.clj",
  "live_guided_conditional_rules.clj", "live_schema_property_declaration.clj",
  "live_validation_visuals.clj", "local_rule_promotion.clj",
  "local_rule_promotion_availability.clj", "non_applicable_property_visibility.clj",
  "recursive_declared_property_validation.clj", "recursive_property_validation.clj",
  "schema_assignment_data_conditions.clj", "schema_cardinality_comparison.clj",
  "schema_container_child_authoring.clj", "schema_declared_property_exceptions.clj",
  "schema_nested_path.clj", "schema_property_comments.clj", "schema_property_copy.clj",
  "schema_property_example_values.clj", "schema_property_filter_sort.clj",
  "schema_property_type_editing.clj", "schema_publication_refresh.clj", "schema_renaming.clj",
  "schema_revision_lifecycle.clj", "schema_specification_builder_customization.clj",
  "schema_specification_container_defaults.clj", "schema_specification_example_selection.clj",
  "schema_specification_preview_layout.clj", "schema_workspace_runtime.clj",
  "validation_presence_semantics.clj",
];

const schemasIsolatedHandlers = schemasIsolatedHandlerNames.map((name) =>
  `acceptance/src/acceptance/steps/${name}`);

assert.deepEqual(schemasPack.isolatedVerificationHandlers,schemasIsolatedHandlers);

const schemasHandlerEvidence = [];

for (const handlerPath of schemasIsolatedHandlers) {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url),"utf8");
  const servedFeatures = [...source.matchAll(/"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)]
    .map((match) => match[1]);
  assert.ok(servedFeatures.length > 0,`${handlerPath} names its owner-only served features`);
  assert.deepEqual(planVerification(packs,{changedPaths:[handlerPath]}).packIds,["schemas"]);
  schemasHandlerEvidence.push({path:handlerPath,servedFeatures,ownerPlan:["schemas"],consumers:[]});
}

const schemasLoadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => [{handler:schemasIsolatedHandlers[0],consumerPack:"defects",
    feature:"features/data-layer-defect-library.feature",step:"schema evidence is loaded"}],
}));

assert.match(schemasLoadedStepDiagnostic,/Loaded cross-pack step consumer blocks isolation.*defects/u);

const shellHandler = packs.find(({id}) => id === "shell").handlers.find((handler) =>
  handler.endsWith("/information_architecture.clj"));

const schemasNamespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8");
    return handlerPath === shellHandler
      ? `${source}\n[acceptance.steps.allowed-value-expansion :refer [handlers]]\n` : source;
  },
}));

assert.match(schemasNamespaceDiagnostic,
  /Cross-pack handler consumer blocks isolation.*information_architecture/u);

const schemasMissingMetadataDiagnostic = await captureRejection(() =>
  validateIsolatedVerificationHandlers(packs,{
    readSource:async(handlerPath) => handlerPath === schemasIsolatedHandlers[0]
      ? "(def handlers [])" : readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8"),
  }));

assert.match(schemasMissingMetadataDiagnostic,/Owner-only served features are required/u);

const schemasUnreadableAuditDiagnostic = await captureRejection(() =>
  validateIsolatedVerificationHandlers(packs,{
    findLoadedStepConsumers:async() => { throw new Error("unreadable parsed consumer evidence"); },
  }));

assert.match(schemasUnreadableAuditDiagnostic,/Isolation audit fails closed/u);

const nonIsolatedSchemasPacks = replacePack(packs,"schemas",() => ({isolatedVerificationHandlers:[]}));

const rejectedSchemasHandlerPlan = planVerification(nonIsolatedSchemasPacks,{
  changedPaths:[schemasIsolatedHandlers[0]],
}).packIds;

assert.deepEqual(rejectedSchemasHandlerPlan,schemasClosure);

const schemasHistoryChange = (entry) => syntheticChangeSet([entry]);

const deletedSchemasPresentation = schemasHistoryChange({status:"D",path:schemasPresentationPaths[1]});

const renameSchemasPresentation = (newPath) => schemasHistoryChange({status:"R",score:100,
  oldPath:schemasPresentationPaths[1],newPath});

const schemasHistoryPlans = {
  delete:planVerification(packs,{changedPaths:deletedSchemasPresentation.paths,
    changeSet:deletedSchemasPresentation,basePacks:packs}).packIds,
  renamePresentation:planVerification(packs,{changedPaths:renameSchemasPresentation(
    schemasPresentationPaths[5]).paths,changeSet:renameSchemasPresentation(schemasPresentationPaths[5]),
    basePacks:packs}).packIds,
  renameSharedWorkflow:planVerification(packs,{changedPaths:renameSchemasPresentation(
    "src/data-layer-guided-validation-ui.ts").paths,changeSet:renameSchemasPresentation(
    "src/data-layer-guided-validation-ui.ts"),basePacks:packs}).packIds,
  unreadable:planVerification(packs,{changedPaths:deletedSchemasPresentation.paths,
    changeSet:deletedSchemasPresentation,basePacks:packs,historicalRegistryFallback:true}).packIds,
};

assert.deepEqual(schemasHistoryPlans.delete,["schemas"]);

assert.deepEqual(schemasHistoryPlans.renamePresentation,["schemas"]);

assert.deepEqual(schemasHistoryPlans.renameSharedWorkflow,schemasClosure);

assert.deepEqual(schemasHistoryPlans.unreadable,planVerification(packs,{terminalFull:true}).packIds);

const schemasEvidenceProfile = conservedEvidenceProfile(schemasPack);

const schemasBasePack = schemasBasePacks.find(({id}) => id === "schemas");

assert.deepEqual(schemasEvidenceProfile,
  conservedEvidenceProfile(schemasBasePack),
  "all Schemas owner evidence identities remain conserved");

const exactSchemasPlan = planVerification(packs,{packIds:["schemas"],includeProperties:true});

assert.equal(exactSchemasPlan.tasks.length,292);

assert.deepEqual([exactSchemasPlan.unitTasks.length,exactSchemasPlan.propertyTasks.length,
  exactSchemasPlan.parserTasks.length,schemasPack.handlers.length,exactSchemasPlan.browserTasks.length,
  exactSchemasPlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).length,
  exactSchemasPlan.checkpointTasks.length],[52,29,103,60,1,46,1]);

assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities,
  "terminal planning conserves every Schemas task identity and ordering");

const schemasCalibration = vtd004CurrentCalibration.runnablePacks.find(({id}) => id === "schemas");

const schemasPreviousCalibration = schemasBaseCalibration.runnablePacks.find(({id}) => id === "schemas");

assert.deepEqual({selectedPacks:schemasCalibration.selectedPacks,
  fanOut:schemasCalibration.changedPathFanOut.limit,
  duration:[schemasCalibration.changedPathDuration.baseline,
    schemasCalibration.changedPathDuration.tolerance,schemasCalibration.changedPathDuration.limit]},
{selectedPacks:["schemas"],fanOut:0,duration:[149.6,1.2,180]});

const vtd005EditorTargetIds = ["LAYERED_SCHEMA_EDITOR_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET",
  "LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET"];

const schemasCalibrationProjection = structuredClone(vtd004CurrentCalibration);

schemasCalibrationProjection.runnablePacks = schemasCalibrationProjection.runnablePacks.map((row) =>
  ["layered_schema", "shell"].includes(row.id)
    ? schemasBaseCalibration.runnablePacks.find(({id}) => id === row.id) : row);

for (const id of vtd005EditorTargetIds) {
  schemasCalibrationProjection.browserTargets[id] = schemasBaseCalibration.browserTargets[id];
}

for (const key of calibrationProvenanceKeys) {
  schemasCalibrationProjection[key] = schemasBaseCalibration[key];
}

const schemasOtherCurrent = schemasCalibrationProjection.runnablePacks.filter(({id}) => id !== "schemas");

const schemasOtherBase = schemasBaseCalibration.runnablePacks.filter(({id}) => id !== "schemas");

assert.deepEqual(schemasOtherCurrent,schemasOtherBase);

assert.deepEqual(schemasCalibrationProjection.browserTargets,schemasBaseCalibration.browserTargets);

assert.deepEqual(calibrationProvenance(schemasCalibrationProjection),calibrationProvenance(
  schemasBaseCalibration));

const schemasInstalledSource = await readFile(
  new URL("../../test/support/side-panel-browser-fixture-primitives.mjs",import.meta.url),"utf8");

const schemasPresentationTargets = [
  ["ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER", "allowedValueExpansionObservation"],
  ["GUIDED_VALIDATION_BROWSER_ADAPTER", "guidedSchemaPickerObservation"],
  ["LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER", "liveSchemaPropertyDeclarationObservation"],
  ["LOCAL_RULE_PROMOTION_BROWSER_ADAPTER", "localRulePromotionObservation"],
  ["SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER", "schemaAssignmentDataConditionsObservation"],
  ["SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER", "schemaPropertyCopyObservation"],
  ["SCHEMA_PROPERTY_TYPE_EDITING_BROWSER_ADAPTER", "schemaPropertyTypeEditingObservation"],
  ["SCHEMA_SPECIFICATION_BUILDER_BROWSER_ADAPTER", "schemaSpecificationBuilderObservation"],
];

const schemasRegisteredTargets = new Set(schemasPack.browserObservations.map(({id}) => id));

for (const [targetId,observation] of schemasPresentationTargets) {
  assert.ok(schemasRegisteredTargets.has(targetId),`${targetId} remains in the Schemas browser batch`);
  assert.match(schemasInstalledSource,new RegExp(observation,"u"),
    `${targetId} retains direct installed-browser result evidence`);
}

const vtd004SchemasAcceptance = {
  currentPlans:Object.fromEntries([...schemasPresentationPaths,...schemasPropagatingPaths]
    .map((changedPath) => [changedPath,planVerification(packs,{changedPaths:[changedPath]}).packIds])),
  historyPlans:schemasHistoryPlans,handlers:schemasHandlerEvidence,
  isolationAudit:{schemasLoadedStepDiagnostic,schemasNamespaceDiagnostic,
    missingMetadataDiagnostic:schemasMissingMetadataDiagnostic,
    unreadableAuditDiagnostic:schemasUnreadableAuditDiagnostic,rejectedSchemasHandlerPlan,
    metadataCannotConceal:true},
  conservation:{evidenceProfile:schemasEvidenceProfile,
    exactTaskCount:exactSchemasPlan.tasks.length-(schemasPack.unit.length-schemasEvidenceProfile.unit.length)
      -exactSchemasPlan.checkpointTasks.length,
    unitCount:49,propertyCount:29,featureCount:103,handlerCount:60,adapterCount:1,targetCount:46,
    executionTaskCounts:{unit:exactSchemasPlan.unitTasks.length,
      property:exactSchemasPlan.propertyTasks.length,checkpoints:exactSchemasPlan.checkpointTasks.length,
      exact:exactSchemasPlan.tasks.length},
    checkpointCount:0,terminalTaskIdentitiesConserved:true,packageCheckCount:1,
    directPresentationPaths:schemasPresentationPaths},
  calibration:{current:schemasCalibration,previous:schemasPreviousCalibration,
    otherPackRowsConserved:true,browserTargetRowsConserved:true,exactPackCalibrationConserved:
      JSON.stringify(schemasCalibration.exactPackDuration) === JSON.stringify(
        schemasPreviousCalibration.exactPackDuration),provenanceConserved:true,
    otherPackCount:schemasOtherCurrent.length,
    browserTargetCount:Object.keys(vtd004CurrentCalibration.browserTargets).length},
  presentationBoundary:{ownerOnly:true,suppliedValues:true,effectIsolated:true,
    semanticIsolated:true,installedDirect:true,behaviorPreserved:true},
};

await assert.rejects(() => validateVerificationPacks(replacePack(packs, "shell", (pack) => ({
  verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
    "test/browser-packs/shared-harness.mjs"
    ? { ...helper, consumers:helper.consumers.filter((id) => id !== "schemas") }
    : helper),
}))), /Correct verification helper consumers.*shared-harness.*schemas/u,
"registry validation rejects an undeclared helper consumer with helper path and pack identity");

await assert.rejects(() => validateVerificationPacks(replacePack(packs, "layered_schema", (pack) => ({
  impactBoundaries:pack.impactBoundaries.map((boundary) => boundary.id === "canonical_editor_rule_authoring"
    ? { ...boundary, prefixes:boundary.prefixes.filter((prefix) =>
      prefix !== "src/data-layer-string-rule-validation.ts") }
    : boundary),
}))), /Classify source path src\/data-layer-string-rule-validation.*exactly one impact boundary/u,
"registry validation rejects a newly unclassified layered-schema source path");

await assert.rejects(() => validateVerificationPacks(replacePack(packs, "layered_schema", (pack) => ({
  impactBoundaries:pack.impactBoundaries.map((boundary) => boundary.id === "canonical_schema_core"
    ? { ...boundary, prefixes:[...boundary.prefixes,
      "src/data-layer-canonical-schema-focused-editor.ts"] }
    : boundary),
}))), /Classify source path src\/data-layer-canonical-schema-focused-editor.ts.*exactly one impact boundary/u,
"registry validation rejects overlapping layered-schema impact boundaries");

const realRegistryChange = syntheticChangeSet([{ status:"M", path:"verification/packs.json" }]);

const runnableProductionPackIds = planVerification(packs, { terminalFull:true }).packIds;

assert.deepEqual(planVerification(packs, {
  changedPaths:["test/support/layered-schema-usability-probes.mjs"],
}).packIds, ["layered_schema"],
"the layered-schema verification helper selects only its exact registered consumer");

assert.deepEqual(planVerification(packs, {
  changedPaths:["test/support/flow-graph-corrective-workflow.mjs"],
}).packIds, ["flow_graph"],
"the flow-graph verification helper selects only its exact registered consumer");

const shellPack = packs.find(({ id }) => id === "shell");

const helperDeclarations = shellPack.verificationHelpers;

const retainedSupportHelpers = (await readdir(new URL("../../test/support/", import.meta.url)))
  .filter((entry) => entry.endsWith(".mjs"))
  .map((entry) => `test/support/${entry}`)
  .filter((helperPath) => ![
    "test/support/branding-workflow-targets.mjs",
    "test/support/layered-schema-parity-runtime.mjs",
  ].includes(helperPath))
  .sort();

assert.deepEqual(helperDeclarations.map(({ path:helperPath }) => helperPath)
  .filter((helperPath) => helperPath.startsWith("test/support/"))
  .sort(), retainedSupportHelpers,
"all 20 retained support helpers have one exact declaration");

const helperValidationInventory = await verificationInventory();

const verificationPackValidationError = async(candidatePacks, inventory) => {
  try {
    await validateVerificationPacks(candidatePacks, { inventory });
  } catch (error) {
    return error.message;
  }
  assert.fail("expected verification-pack validation to reject the defect fixture");
};

const trackedUnusedHelperPath = "test/support/unregistered-helper.mjs";

const trackedUnusedDiagnostic = await verificationPackValidationError(packs, {
  ...helperValidationInventory,
  tracked:[...helperValidationInventory.tracked, trackedUnusedHelperPath],
});

const importedUndeclaredDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.filter(({ path:helperPath }) =>
      helperPath !== "test/browser-packs/shared-harness.mjs"),
  })),
  { ...helperValidationInventory, tracked:helperValidationInventory.tracked.filter((trackedPath) =>
    trackedPath !== "test/browser-packs/shared-harness.mjs") },
);

const incorrectConsumersDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
      "test/support/layered-schema-usability-probes.mjs"
      ? {...helper, consumers:["flow_graph"]} : helper),
  })), helperValidationInventory,
);

const staleDeclarationDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:[...pack.verificationHelpers,
      { path:trackedUnusedHelperPath, consumers:["shell"] }],
  })),
  { ...helperValidationInventory,
    tracked:[...helperValidationInventory.tracked, trackedUnusedHelperPath] },
);

const duplicateDeclarationDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:[...pack.verificationHelpers, pack.verificationHelpers[0]],
  })), helperValidationInventory,
);

const unknownConsumerDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
      "test/support/layered-schema-usability-probes.mjs"
      ? {...helper, consumers:[...helper.consumers, "unknown-pack"]} : helper),
  })), helperValidationInventory,
);

const helperValidationDiagnostics = {
  "a new tracked but unused support helper":trackedUnusedDiagnostic,
  "an imported helper without a declaration":importedUndeclaredDiagnostic,
  "a declaration with a missing or extra consumer":incorrectConsumersDiagnostic,
  "a declared helper with no reachable consumer":staleDeclarationDiagnostic,
  "the same helper declared twice":duplicateDeclarationDiagnostic,
  "a declaration naming an unknown consumer":unknownConsumerDiagnostic,
};

for (const [defect, expectedDiagnostic] of [
  ["a new tracked but unused support helper", "Declare every tracked support helper"],
  ["an imported helper without a declaration", "Declare every imported verification helper"],
  ["a declaration with a missing or extra consumer", "Correct verification helper consumers"],
  ["a declared helper with no reachable consumer", "Remove stale verification helper declaration"],
  ["the same helper declared twice", "Declare verification helper once"],
  ["a declaration naming an unknown consumer", "Register every verification helper consumer"],
]) {
  assert.match(helperValidationDiagnostics[defect], new RegExp(expectedDiagnostic, "u"),
    `${defect} emits its scenario-specific production diagnostic`);
}

await assert.rejects(() => validateVerificationPacks(packs, { inventory:{
  tracked:[...helperValidationInventory.tracked, "test/support/unregistered-helper.mjs"],
} }), /Declare every tracked support helper.*test\/support\/unregistered-helper\.mjs/u,
"a new tracked support helper cannot silently inherit broad Shell ownership");

await assert.rejects(() => validateVerificationPacks(replacePack(packs, "shell", (pack) => ({
  verificationHelpers:[...pack.verificationHelpers, pack.verificationHelpers[0]],
}))), /Declare verification helper once/u,
"the same helper cannot be declared twice");

await assert.rejects(() => validateVerificationPacks(replacePack(packs, "shell", (pack) => ({
  verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
    "test/support/layered-schema-usability-probes.mjs"
    ? {...helper, consumers:[...helper.consumers, "unknown-pack"]} : helper),
}))), /Register every verification helper consumer.*unknown-pack/u,
"every declared helper consumer must be a runnable registered pack");

await assert.rejects(() => validateVerificationPacks(replacePack(packs, "shell", (pack) => ({
  verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
    "test/support/layered-schema-usability-probes.mjs"
    ? {...helper, consumers:["flow_graph"]} : helper),
}))), /Correct verification helper consumers.*layered-schema-usability/u,
"declared helper consumers must equal statically discovered consumers");

for (const removedHelper of ["branding-workflow-targets.mjs", "layered-schema-parity-runtime.mjs"]) {
  await assert.rejects(access(new URL(`../../test/support/${removedHelper}`, import.meta.url)),
    (error) => error?.code === "ENOENT", `${removedHelper} is removed without an executable leaf`);
}

const helperConsumerCases = Object.fromEntries(helperDeclarations.map(({ path:helperPath, consumers }) =>
  [helperPath, consumers]));

for (const [helperPath, consumers] of Object.entries(helperConsumerCases)) {
  const exactConsumers = new Set([
    ...consumers,
    ...packs.filter((pack) => (pack.verificationInputs ?? []).includes(helperPath))
      .map(({ id }) => id),
  ]);
  assert.deepEqual(planVerification(packs, { changedPaths:[helperPath] }).packIds,
    packs.filter(({ id }) => exactConsumers.has(id)).map(({ id }) => id),
    `${helperPath} selects its declared consumers exactly once`);
}

const shellBoundaryCases = {
  "src/data-layer-installed/runtime.ts":["project_management", "durable_project_repository",
    "capture", "event-library", "project_event_transport", "schemas", "defects", "replay",
    "live_flow_testing", "shell"],
  "src/panel-empty-states.ts":["shell"],
  "src/panel-empty-states-ui.ts":["shell"],
  "src/workspace-tabs-ui.ts":["shell"],
  "src/workspace-tabs.ts":["command-palette", "hotkeys", "shell"],
  "src/reorderable-editor/control.ts":["schemas", "defects", "flow_export", "layered_schema",
    "property_set_flow_sections", "shell"],
  "src/reorderable-editor/model.ts":["schemas", "defects", "flow_export", "layered_schema",
    "property_set_flow_sections", "shell"],
  "src/reorderable-editor/stable-identities.ts":["schemas", "defects", "flow_export", "layered_schema",
    "property_set_flow_sections", "shell"],
  "src/active-page-observation.ts":["capture", "event-library", "project_event_transport", "schemas",
    "defects", "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"],
  "src/side-panel-action-hierarchy.ts":["event-library", "project_event_transport", "schemas",
    "defects", "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"],
  "src/side-panel-action-hierarchy-ui.ts":["event-library", "project_event_transport", "schemas",
    "defects", "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"],
};

for (const [changedPath, expectedPackIds] of Object.entries(shellBoundaryCases)) {
  const exactPackIds = new Set([
    ...expectedPackIds,
    ...packs.filter((pack) => (pack.verificationInputs ?? []).includes(changedPath))
      .map(({ id }) => id),
  ]);
  assert.deepEqual(planVerification(packs, { changedPaths:[changedPath] }).packIds,
    packs.filter(({ id }) => exactPackIds.has(id)).map(({ id }) => id),
    `${changedPath} selects its exact Shell runtime consumers`);
}

const shellSourcePaths = helperValidationInventory.source
  .filter((sourcePath) => verificationOwner(packs, sourcePath) === "shell");

assert.equal(shellSourcePaths.length, 22,
  "every Shell-owned TypeScript file participates in one exact boundary");

for (const platformPath of shellSourcePaths.filter((sourcePath) => !(sourcePath in shellBoundaryCases))) {
  assert.deepEqual(planVerification(packs, {changedPaths:[platformPath]}).packIds,
    runnableProductionPackIds, `${platformPath} remains globally impactful Shell platform runtime`);
}

const localShellPlan = planVerification(packs, {
  changedPaths:["src/workspace-tabs-ui.ts"], includeProperties:true,
});

assert.equal(new Set(localShellPlan.tasks.map(({key}) => key)).size, localShellPlan.tasks.length,
  "local Shell presentation retains every property-enabled task exactly once");

assert.deepEqual(localShellPlan.unitTasks.map(({ target }) => target), shellPack.unit,
  "local Shell unit tasks conserve the declared Shell unit leaves in canonical order");

assert.deepEqual(localShellPlan.propertyTasks.map(({ target }) => target), shellPack.property,
  "local Shell property tasks conserve the declared Shell property leaves in canonical order");

assert.equal(localShellPlan.browserTasks.length, 3);

assert.equal(localShellPlan.observationTasks.length, 2);

assert.equal(localShellPlan.parserTasks.length, localShellPlan.features.length);

assert.equal(localShellPlan.generatorTasks.length, localShellPlan.features.length);

assert.equal(localShellPlan.checkpointTasks.length, 4);

assert.equal(localShellPlan.sessionTasks.length, 1);

const vtd009BasePacks = JSON.parse(await exec("git", [
  "show", "407383e0f6:verification/packs.json",
]));

const vtd009HistoryPlan = (entry, options = {}) => {
  const changeSet = syntheticChangeSet([entry]);
  return planVerification(packs, { changedPaths:changeSet.paths, changeSet,
    basePacks:vtd009BasePacks, ...options }).packIds;
};

const vtd009History = {
  deleteHelper:vtd009HistoryPlan({status:"D",
    path:"test/support/layered-schema-usability-probes.mjs"}, {basePacks:packs}),
  renameHelper:vtd009HistoryPlan({status:"R",score:100,
    oldPath:"test/support/layered-schema-usability-probes.mjs",
    newPath:"test/support/flow-evidence-reporter.mjs"}, {basePacks:packs}),
  deleteLocal:vtd009HistoryPlan({status:"D",path:"src/workspace-tabs-ui.ts"}, {basePacks:packs}),
  renameToPlatform:vtd009HistoryPlan({status:"R",score:100,
    oldPath:"src/workspace-tabs-ui.ts",newPath:"src/side-panel.ts"}, {basePacks:packs}),
  deleteDormant:vtd009HistoryPlan({status:"D",
    path:"test/support/branding-workflow-targets.mjs"}),
};

assert.deepEqual(vtd009History.deleteHelper, ["layered_schema"]);

assert.deepEqual(vtd009History.renameHelper, ["flow_graph", "layered_schema"]);

assert.deepEqual(vtd009History.deleteLocal, ["shell"]);

assert.deepEqual(vtd009History.renameToPlatform, runnableProductionPackIds);

assert.deepEqual(vtd009History.deleteDormant,
  runnableProductionPackIds.filter((id) => id !== "verification_process"));

const unavailableHelperHistory = syntheticChangeSet([{status:"D",
  path:"test/support/layered-schema-usability-probes.mjs"}]);

vtd009History.unavailable = planVerification(packs, {
  changedPaths:unavailableHelperHistory.paths, changeSet:unavailableHelperHistory,
  basePacks:vtd009BasePacks, historicalRegistryFallback:true,
}).packIds;

assert.deepEqual(vtd009History.unavailable, runnableProductionPackIds,
  "unavailable helper ownership fails closed to every runnable pack");

const flowPack = packs.find(({ id }) => id === "flow_graph");

assert.deepEqual(planVerification(packs, {
  packIds:["flow_graph"],
  changedPaths:["acceptance/src/acceptance/steps/flow_graph.clj"],
}).packIds, ["flow_graph"],
"a partition-validating Flow handler remains exact to the pack that owns every evidence leaf");

import { verificationOwnerForPath } from "../../scripts/verification-planner/ownership/resolve.mjs";

const ownershipFixturePacks = [
  { id:"shell", source:[], process:["scripts/"] },
  { id:"narrow", source:["scripts/verification-registry/"] },
];

assert.equal(verificationOwnerForPath(ownershipFixturePacks,
  "scripts/verification-registry/compiler.mjs")?.id, "narrow",
  "the most specific declared prefix owns a changed path");

assert.equal(verificationOwnerForPath(ownershipFixturePacks, "scripts/package.mjs")?.id, "shell",
  "unmigrated process paths retain their conservative owner");

assert.equal(verificationOwnerForPath(ownershipFixturePacks, "unknown/file.mjs"), undefined,
  "an unowned path is explicit rather than silently attributed");
