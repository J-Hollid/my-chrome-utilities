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
const captureRejection = captureRequiredRejection;
const capturePack = packs.find(({id}) => id === "capture");
const captureBaseCalibration = JSON.parse(await exec("git", [
  "show", "be319ad555:verification/performance-calibration.json",
]));
const capturePresentationPaths = [
  "src/data-layer-event-feed-query-ui.ts",
  "src/data-layer-live-inspector-presentation-ui.ts",
  "src/data-layer-live-inspector-return-ui.ts",
  "src/data-layer-live-session-controls-ui.ts",
  "src/data-layer-live-session-summary-ui.ts",
  "src/data-layer-observation-targets-ui.ts",
];
const capturePropagatingPaths = capturePack.impactBoundaries
  .filter(({propagateDependants}) => propagateDependants)
  .flatMap(({prefixes}) => prefixes);
const captureIsolatedHandlers = [
  "acceptance/src/acceptance/steps/cross_tab_reattachment.clj",
  "acceptance/src/acceptance/steps/event_feed_query.clj",
  "acceptance/src/acceptance/steps/live_event_presentation.clj",
  "acceptance/src/acceptance/steps/lossless_observation_activation.clj",
];
const captureHandlerEvidence = [];
const captureLoadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => [{handler:captureIsolatedHandlers[1],consumerPack:"schemas",
    feature:"features/data-layer-schema-validation-workflow.feature",step:"a captured event is selected"}],
}));
const replayHandler = packs.find(({id}) => id === "replay").handlers[0];
const captureNamespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8");
    return handlerPath === replayHandler
      ? `${source}\n[acceptance.steps.event-feed-query :refer [handlers]]\n` : source;
  },
}));
const missingMetadataDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => handlerPath === captureIsolatedHandlers[0] ? "(def handlers [])"
    : readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8"),
}));
const unreadableAuditDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => unreadableConsumerEvidence(),
}));
const nonIsolatedCapturePacks = replacePack(packs,"capture",() => ({isolatedVerificationHandlers:[]}));
const rejectedCaptureHandlerPlan = planVerification(nonIsolatedCapturePacks,{
  changedPaths:[captureIsolatedHandlers[1]],
}).packIds;
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
const captureEvidenceProfile = conservedEvidenceProfile(capturePack);
const exactCapturePlan = planVerification(packs,{packIds:["capture"],includeProperties:true});
const captureCompletedCalibration = JSON.parse(await exec("git", [
  "show", "14e4992a87:verification/performance-calibration.json",
]));
const captureCalibration = captureCompletedCalibration.runnablePacks.find(({id}) => id === "capture");
const capturePreviousCalibration = captureBaseCalibration.runnablePacks.find(({id}) => id === "capture");
const captureOtherCurrent = captureCompletedCalibration.runnablePacks.filter(({id}) => id !== "capture");
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
const schemasBaseCalibration = JSON.parse(await exec("git", [
  "show", "14e4992a87:verification/performance-calibration.json",
]));
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
const schemasPropagatingPaths = schemasPack.impactBoundaries
  .filter(({propagateDependants}) => propagateDependants)
  .flatMap(({prefixes}) => prefixes);
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
const schemasHandlerEvidence = [];
const schemasLoadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => [{handler:schemasIsolatedHandlers[0],consumerPack:"defects",
    feature:"features/data-layer-defect-library.feature",step:"schema evidence is loaded"}],
}));
const shellHandler = packs.find(({id}) => id === "shell").handlers.find((handler) =>
  handler.endsWith("/information_architecture.clj"));
const schemasNamespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8");
    return handlerPath === shellHandler
      ? `${source}\n[acceptance.steps.allowed-value-expansion :refer [handlers]]\n` : source;
  },
}));
const schemasMissingMetadataDiagnostic = await captureRejection(() =>
  validateIsolatedVerificationHandlers(packs,{
    readSource:async(handlerPath) => handlerPath === schemasIsolatedHandlers[0]
      ? "(def handlers [])" : readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8"),
  }));
const schemasUnreadableAuditDiagnostic = await captureRejection(() =>
  validateIsolatedVerificationHandlers(packs,{
    findLoadedStepConsumers:async() => unreadableConsumerEvidence(),
  }));
const nonIsolatedSchemasPacks = replacePack(packs,"schemas",() => ({isolatedVerificationHandlers:[]}));
const rejectedSchemasHandlerPlan = planVerification(nonIsolatedSchemasPacks,{
  changedPaths:[schemasIsolatedHandlers[0]],
}).packIds;
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
const schemasEvidenceProfile = conservedEvidenceProfile(schemasPack);
const exactSchemasPlan = planVerification(packs,{packIds:["schemas"],includeProperties:true});
const schemasCalibration = vtd004CurrentCalibration.runnablePacks.find(({id}) => id === "schemas");
const schemasPreviousCalibration = schemasBaseCalibration.runnablePacks.find(({id}) => id === "schemas");
const vtd005EditorTargetIds = ["LAYERED_SCHEMA_EDITOR_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET",
  "LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET"];
const schemasCalibrationProjection = structuredClone(vtd004CurrentCalibration);
const schemasOtherCurrent = schemasCalibrationProjection.runnablePacks.filter(({id}) => id !== "schemas");
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
import { registryPlannerPreparationTaskKeys } from "../../scripts/verification-policy/reliability/run-intent.mjs";
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
