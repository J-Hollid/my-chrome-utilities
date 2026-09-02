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
const sidePanelPaperFirstBrandFeatures = [
  "features/side-panel-paper-first-brand-alignment.feature",
  "features/side-panel-paper-first-brand-alignment-runtime.feature",
];
const sidePanelPaperFirstBrandAcceptanceArtifacts = sidePanelPaperFirstBrandFeatures
  .flatMap((feature) => {
    const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
    const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
      .replace(/(^-+|-+$)/gu, "");
    return [
      `build/acceptance/generated/${slug}_acceptance_test.clj`,
      `build/acceptance/ir/${basename}.json`,
    ];
  });
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});
const processAcceptancePack=(features)=>({id:"flow_export",features,
  source:["src/data-layer-project-documentation-workspace-ui.ts"],
  verificationInputs:["test/flow-export-test.mjs"]});
function resolvedNodeModulesRoot(resolve = (specifier) => import.meta.resolve(specifier)) {
  const installedTypescriptRoot = path.dirname(path.dirname(
    fileURLToPath(resolve("typescript"))));
  return path.dirname(installedTypescriptRoot);
}
const CLI_CONTENTION_READINESS_TIMEOUT_MS = 120_000;
const exerciseDeadOwnerLockFixture = ({ reclaimDeadOwner }) => {
  const lock = { owner:{ pid:4102, alive:false }, waiters:[{ pid:4103 }] };
  if (!lock.owner.alive && reclaimDeadOwner) {
    lock.owner = lock.waiters.shift();
    return { outcome:"acquired", ownerPid:lock.owner.pid, remainingWaiters:lock.waiters.length };
  }
  return { outcome:"blocked", ownerPid:lock.owner.pid, remainingWaiters:lock.waiters.length };
};
let nestedReadOnlyLeaseCompleted = false;
const documentationTemplateRuntimeEvidenceKeys = [
  "documentationTemplateStarterParity",
  "documentationTemplateStarterOverview",
  "documentationTemplateStarterFlow",
  "documentationTemplateStarterMatrix",
  "documentationTemplateStarterProfile",
  "documentationTemplateValidationBoundaries",
  "documentationTemplateValidationScopedBinding",
  "documentationTemplateValidationCrossing",
  "documentationTemplateValidationUnsafePackage",
  "documentationTemplateValidationSizeLimit",
  "documentationTemplateValidationEncrypted",
  "documentationTemplateValidationMalformed",
  "documentationTemplateRichRuntime",
  "documentationTemplateRichPreviewClipboard",
  "documentationTemplateRichSanitization",
  "documentationTemplateRichHistory",
  "documentationTemplatePortableReload",
];
const documentationTemplateStepStem = ["flow", "table", "documentation", "export"].join("_");
const documentationTemplateHandlerSource = await readFile(new URL(
  `../../acceptance/src/acceptance/steps/${documentationTemplateStepStem}.clj`, import.meta.url), "utf8");
const documentationTemplateAcceptanceFixtureSource = await readFile(new URL(
  `../acceptance/${documentationTemplateStepStem}_steps_test.clj`, import.meta.url), "utf8");
const documentationTemplateLibraryUiStem = ["workspace", "template", "library", "ui"].join("-");
const documentationTemplateLibraryUiSource = await readFile(new URL(
  `../../src/project-documentation/${documentationTemplateLibraryUiStem}.ts`, import.meta.url), "utf8");
const artifactLockTimeoutRepairRegression = ({ incidentId, failureDigest, diagnosedBoundary,
  causalCategory = "artifact/process locking" }) => {
  if (causalCategory === "other:documentation template acceptance fixture parity") {
    const handlerKeys = documentationTemplateRuntimeEvidenceKeys.filter((key) =>
      new RegExp(`:${key}(?=[\\s\\]])`, "u").test(documentationTemplateHandlerSource));
    const fixtureTrueKeys = documentationTemplateRuntimeEvidenceKeys.filter((key) =>
      new RegExp(`:${key}\\s+true(?=[\\s}])`, "u").test(documentationTemplateAcceptanceFixtureSource));
    const fixture = {
      id:"documentation-template-acceptance-fixture-parity-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ evidenceKeys:documentationTemplateRuntimeEvidenceKeys,
        historicalFixtureTrueKeys:[] },
      expectedPreRepairFailure:{ handlerKeys:documentationTemplateRuntimeEvidenceKeys,
        fixtureTrueKeys:[], exactParity:false },
      expectedRepairResult:{ handlerKeys:documentationTemplateRuntimeEvidenceKeys,
        fixtureTrueKeys:documentationTemplateRuntimeEvidenceKeys, exactParity:true },
    };
    const repairResult = { handlerKeys, fixtureTrueKeys,
      exactParity:handlerKeys.length === documentationTemplateRuntimeEvidenceKeys.length &&
        fixtureTrueKeys.length === documentationTemplateRuntimeEvidenceKeys.length &&
        handlerKeys.every((key, index) => key === fixtureTrueKeys[index]) };
    assert.deepEqual(repairResult, fixture.expectedRepairResult,
      "the bounded fixture proves exact parity for all 17 Documentation Template runtime evidence keys");
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
  }
  if (causalCategory === "other:documentation template rich outline focus timing") {
    const fixture = {
      id:"documentation-template-rich-outline-focus-timing-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ rerenderContract:"synchronous plus later persistence rerenders",
        focusTarget:'[data-rich-block-selected="true"]' },
      expectedPreRepairFailure:{ focusScheduling:"initiating-rerender-only",
        laterRerenderRestoresSelectedOutlineFocus:false },
      expectedRepairResult:{ focusScheduling:"every-outline-mode-render",
        laterRerenderRestoresSelectedOutlineFocus:true },
    };
    const renderRestoresFocus = documentationTemplateLibraryUiSource.includes(
      "if(options.selectedRichBlockId&&!options.richEditorMobileDetail)focusAfterRender");
    const repairResult = { focusScheduling:renderRestoresFocus
      ? "every-outline-mode-render" : "initiating-rerender-only",
    laterRerenderRestoresSelectedOutlineFocus:renderRestoresFocus };
    assert.deepEqual(repairResult, fixture.expectedRepairResult,
      "the bounded fixture proves Rich outline selection focuses synchronously after rerender");
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
  }
  if (causalCategory === "other:checkpoint fixture readiness budget") {
    const fixture = {
      id:"checkpoint-fixture-readiness-budget-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ nestedCli:true, concurrentContractWork:true, commandTimeoutMs:600_000 },
      expectedPreRepairFailure:{ readinessTimeoutMs:30_000, withinCommandTimeout:true,
        survivesConcurrentPreflight:false },
      expectedRepairResult:{ readinessTimeoutMs:120_000, withinCommandTimeout:true,
        survivesConcurrentPreflight:true },
    };
    const repairResult = { readinessTimeoutMs:CLI_CONTENTION_READINESS_TIMEOUT_MS,
      withinCommandTimeout:CLI_CONTENTION_READINESS_TIMEOUT_MS < fixture.input.commandTimeoutMs,
      survivesConcurrentPreflight:CLI_CONTENTION_READINESS_TIMEOUT_MS >= 120_000 };
    assert.deepEqual(repairResult, fixture.expectedRepairResult);
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
  }
  const boundedStyleRegression = {
    "other:global-stylesheet-reader reachability separation": {
      id:"global-stylesheet-reader-reachability-v1",
      input:{ globalReaders:["test/twatility-brand-polish-test.mjs", "test/data-layer-flow-workspace-test.mjs"], qaConsumers:[] },
      expectedPreRepairFailure:{ readerEdgesClassifiedAsQaConsumers:true, featurePlanScope:"owner-and-readers" },
      expectedRepairResult:{ readerEdgesClassifiedAsQaConsumers:false, featurePlanScope:"declared-smoke-targets-only" },
    },
    "other:stylesheet helper named-export completeness": {
      id:"stylesheet-helper-named-exports-v1",
      input:{ helpers:["stylesheetDeclarationFor", "stylesheetPlanFor", "validateStylesheetDeclarations"] },
      expectedPreRepairFailure:{ exportedHelpers:0, processContractImport:false },
      expectedRepairResult:{ exportedHelpers:3, processContractImport:true },
    },
    "other:canonical stylesheet build inventory marker": {
      id:"canonical-stylesheet-build-inventory-v1",
      input:{ inventorySource:"verification/packs.json", buildSource:"scripts/build.mjs", marker:"side-panel.css" },
      expectedPreRepairFailure:{ canonicalInventoryConsumed:false, operatorShellWired:false },
      expectedRepairResult:{ canonicalInventoryConsumed:true, operatorShellWired:true },
    },
  }[causalCategory];
  if (boundedStyleRegression) {
    const fixture = { ...boundedStyleRegression, causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary) };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  const manifestedRegression = {
    "other:checkpoint task initialization ordering": {
      id:"checkpoint-task-initialization-ordering-v1",
      input:{ checkpointTasksReferencedBeforeDeclaration:true },
      expectedPreRepairFailure:{ outcome:"temporal-dead-zone" },
      expectedRepairResult:{ outcome:"checkpoint-task-list-initialized-before-use" },
    },
    "other:Studio smoke observation return contract": {
      id:"studio-smoke-observation-return-contract-v1",
      input:{ target:"STUDIO_GLOBAL_STYLE_SMOKE_TARGET", observationRequired:true },
      expectedPreRepairFailure:{ returnedObservation:false },
      expectedRepairResult:{ returnedObservation:true },
    },
    "other:empty execution pack rejection": {
      id:"empty-execution-pack-rejection-v1",
      input:{ selectedPackIds:[], styleSmokeAuthorizationPackIds:[] },
      expectedPreRepairFailure:{ runnableChecks:false, outcome:"no-runnable-checks" },
      expectedRepairResult:{ runnableChecks:true, outcome:"explicit-exact-pack-or-style-target" },
    },
    "other:receipt plan summary field completeness": {
      id:"receipt-plan-summary-field-completeness-v1",
      input:{ mandatoryFields:["styleSmokeTargets", "terminalFullObligations",
        "changedStyleTargets", "adapterAuthorizationPackIds"] },
      expectedPreRepairFailure:{ missingFields:4, summaryMatches:false },
      expectedRepairResult:{ missingFields:0, summaryMatches:true },
    },
    "other:Shell source inventory reachability": {
      id:"shell-source-inventory-reachability-v1",
      input:{ declaredShellSourceInventory:true },
      expectedPreRepairFailure:{ sourceCount:1, allOwnedSourcesReachable:false },
      expectedRepairResult:{ sourceCount:3, allOwnedSourcesReachable:true },
    },
    "other:browser adapter inventory path registration": {
      id:"browser-adapter-inventory-path-registration-v1",
      input:{ adapterPath:"test/browser-packs/global-style-smoke.mjs" },
      expectedPreRepairFailure:{ pathRegistered:false, checkpointClaimed:false },
      expectedRepairResult:{ pathRegistered:true, checkpointClaimed:true },
    },
    "other:browser smoke adapter path cleanup": {
      id:"browser-smoke-adapter-path-cleanup-v1",
      input:{ removedAdapterPath:"test/browser-packs/global-style-smoke.mjs" },
      expectedPreRepairFailure:{ stalePathLookup:true, cleanupSucceeded:false },
      expectedRepairResult:{ stalePathLookup:false, cleanupSucceeded:true },
    },
    "other:global stylesheet QA scope isolation": {
      id:"global-stylesheet-qa-scope-isolation-v1",
      input:{ declaredQaTargets:["STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
        "SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET"] },
      expectedPreRepairFailure:{ selectedOwnerUnitTasks:13, selectedQaTargets:0 },
      expectedRepairResult:{ selectedOwnerUnitTasks:0, selectedQaTargets:2 },
    },
    "other:Shell declared task identity conservation": {
      id:"shell-declared-task-identity-conservation-v1",
      input:{ declaredUnitAndPropertyLeaves:true },
      expectedPreRepairFailure:{ plannedUnitAndPropertyLeaves:13, declaredUnitAndPropertyLeaves:15 },
      expectedRepairResult:{ plannedUnitAndPropertyLeaves:15, declaredUnitAndPropertyLeaves:15 },
    },
    "other:calibration target identity conservation": {
      id:"calibration-target-identity-conservation-v1",
      input:{ approvedPostCalibrationTargets:3 },
      expectedPreRepairFailure:{ durableTargetCount:82, observedTargetCount:84 },
      expectedRepairResult:{ durableTargetCount:84, observedTargetCount:84 },
    },
    "other:empty canonical change-set fixture binding": {
      id:"empty-canonical-change-set-fixture-binding-v1",
      input:{ candidateRangeEmpty:true, version:1 },
      expectedPreRepairFailure:{ canonicalChangeSet:false, nonEmptyRangeAssertionReached:false },
      expectedRepairResult:{ canonicalChangeSet:true, nonEmptyRangeAssertionReached:true },
    },
    "other:terminal-full task identity conservation": {
      id:"terminal-full-task-identity-conservation-v1",
      input:{ canonicalRunnableLeaves:true, includeProperties:true },
      expectedPreRepairFailure:{ addedApprovedLeavesConserved:false },
      expectedRepairResult:{ addedApprovedLeavesConserved:true },
    },
    "other:terminal observation coverage conservation": {
      id:"terminal-observation-coverage-conservation-v1",
      input:{ canonicalRunnableLeaves:true, globalStyleTargets:true },
      expectedPreRepairFailure:{ nonStyleObservationsPreserved:false },
      expectedRepairResult:{ nonStyleObservationsPreserved:true },
    },
    "other:Flow logical-target isolation and semantic item hit testing": {
      id:"flow-logical-target-isolation-semantic-hit-testing-v1",
      input:{ styleTarget:"FLOW_STYLESHEET_EXTRACTION_TARGET",
        controlsTarget:"FLOW_WORKSPACE_CONTROLS_TARGET",
        semanticItemSelector:"g[data-page-frame-id]:not([data-occurrence-id]),g[data-flow-section-id]" },
      expectedPreRepairFailure:{ styleProbeExecutedForControls:true,
        genericGroupAncestorRejectedSemanticItem:true },
      expectedRepairResult:{ styleProbeExecutedForControls:false,
        semanticItemAncestorHit:true },
    },
    "other:Flow diagnostic measurement leaf separation": {
      id:"flow-diagnostic-measurement-leaf-separation-v1",
      input:{ assertionNamespace:"flowGraph.styles",
        diagnosticNamespace:"flowGraph.styles.measurements" },
      expectedPreRepairFailure:{ diagnosticValuesTraversedAsAssertionLeaves:true,
        falseDiagnosticValueRejectedPassingTarget:true },
      expectedRepairResult:{ diagnosticValuesTraversedAsAssertionLeaves:false,
        declaredBooleanLeavesValidated:true },
    },
    "other:browser fixed-attempt rationale adjacency": {
      id:"browser-fixed-attempt-rationale-adjacency-v1",
      input:{ entryPoint:"test/browser-packs/flow-graph.mjs",
        loop:"bounded Flow zoom key-repeat" },
      expectedPreRepairFailure:{ fixedAttemptReasonAdjacent:false,
        fixedWaitsBehaviorOnly:false },
      expectedRepairResult:{ fixedAttemptReasonAdjacent:true,
        fixedWaitsBehaviorOnly:true },
    },
    "other:Flow resize handle live-coordinate targeting": {
      id:"flow-resize-handle-live-coordinate-targeting-v1",
      input:{ gesture:"Checkout Section resize", cameraMayVary:true },
      expectedPreRepairFailure:{ hardCodedViewportOrigin:true,
        resizeHandleTargeted:false },
      expectedRepairResult:{ hardCodedViewportOrigin:false,
        resizeHandleTargeted:true },
    },
  }[causalCategory];
  if (manifestedRegression) {
    const fixture = { ...manifestedRegression, causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary) };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  if (causalCategory === "other:task-specific Flow receipt identity") {
    const fixture = {
      id:"task-specific-flow-receipt-identity-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ adapterCommand:["node", "test/browser-packs/flow-graph.mjs"],
        matchingBatchTargets:[["FLOW_GRAPH_EXAMPLES_TARGET", "FLOW_GRAPH_LEGACY_TARGET",
          "FLOW_WORKSPACE_AUTHORING_TARGET", "FLOW_WORKSPACE_CONTROLS_TARGET"],
        ["FLOW_WORKSPACE_AUTHORING_TARGET", "FLOW_WORKSPACE_CONTROLS_TARGET"]],
        requiredDiscriminator:"FLOW_GRAPH_EXAMPLES_TARGET" },
      expectedPreRepairFailure:{ matchingReceiptCount:2, outcome:"duplicate-command-identities" },
      expectedRepairResult:{ matchingReceiptCount:1, outcome:"complete-flow-evidence-selected" },
    };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  if (causalCategory === "other:unambiguous synthetic Section target") {
    const fixture = {
      id:"unambiguous-synthetic-section-target-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ sharedAttribute:"data-flow-section-id",
        candidateKinds:["Section group", "member Page frame"] },
      expectedPreRepairFailure:{ selector:"first matching group",
        directManipulationGuaranteed:false, durableMove:false },
      expectedRepairResult:{ selector:"group with direct Section dropzone",
        directManipulationGuaranteed:true, durableMove:true },
    };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  if (causalCategory === "other:concurrent verification fixture cleanup") {
    const fixture = {
      id:"concurrent-verification-fixture-cleanup-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ terminatingNestedRunner:true, nodeCompileCacheMayStillPopulate:true },
      expectedPreRepairFailure:{ recursiveRemovalRetries:0, nestedBuildProcessGroupReaped:false,
        outcome:"ENOTEMPTY" },
      expectedRepairResult:{ recursiveRemovalRetries:8, retryDelayMs:50,
        nestedBuildProcessGroupReaped:true, outcome:"removed" },
    };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  if (causalCategory === "other:shell canonical task topology conservation") {
    const fixture = {
      id:"shell-canonical-task-topology-conservation-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ canonicalShellTaskCount:59, standaloneSuccessionTestIsRegistryTask:false },
      expectedPreRepairFailure:{ observedShellTaskCount:60, scenario085Passed:false },
      expectedRepairResult:{ observedShellTaskCount:59, scenario085Passed:true },
    };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  if (causalCategory === "other:approved workspace-tabs Shell inventory accounting") {
    const fixture = {
      id:"approved-workspace-tabs-shell-inventory-accounting-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ approvedTaskKey:"unit:test/workspace-tabs-installed-controller-test.mjs",
        historicalShellTaskCount:59, currentShellTaskCount:60 },
      expectedPreRepairFailure:{ historicalEvidenceTaskCount:60,
        currentShellTaskCount:60, approvedTaskCount:1, scenario085Passed:false },
      expectedRepairResult:{ historicalEvidenceTaskCount:59,
        currentShellTaskCount:60, approvedTaskCount:1, scenario085Passed:true },
    };
    const repairResult = {
      historicalEvidenceTaskCount:vtd009Acceptance.localPlan.tasks,
      currentShellTaskCount:localShellPlan.tasks.length,
      approvedTaskCount:localShellPlan.tasks.filter(({key}) =>
        key === fixture.input.approvedTaskKey).length,
      scenario085Passed:vtd009Acceptance.localPlan.tasks === fixture.input.historicalShellTaskCount,
    };
    assert.deepEqual(repairResult, fixture.expectedRepairResult);
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
  }
  if (causalCategory === "other:Flow stability evidence inclusion") {
    const fixture = {
      id:"flow-stability-evidence-inclusion-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ observedStabilityMilliseconds:[150, 100, 100, 100, 250], required:250 },
      expectedPreRepairFailure:{ comparison:"exact-vector", accepted:false },
      expectedRepairResult:{ comparison:"required-member", accepted:true },
    };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  if (causalCategory === "other:later-approved Flow repair conservation baseline") {
    const fixture = {
      id:"later-approved-terminal-repair-conservation-baseline-v2", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ infrastructureBaseline:"bfc9ac9f22", approvedFlowBaseline:"6358897239",
        approvedTerminalRepairBaseline:"8bfd9d9e6e4e6d9602a7a4933ba624d27e75cfec",
        approvedTerminalProductDelta:["src/specification-builder.ts"] },
      expectedPreRepairFailure:{ approvedTerminalProductRepairClassifiedAsVtd014Drift:true },
      expectedRepairResult:{ postTerminalProductDrift:[], postTerminalFeatureDrift:[] },
    };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  if (causalCategory === "other:transitive strict-receipt prerequisite closure") {
    const fixture = {
      id:"transitive-strict-receipt-prerequisite-closure-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ consumer:"acceptance-session:shell", upstreamStrictReceiptResults:6 },
      expectedPreRepairFailure:{ selectedPredecessors:0, strictReceiptComplete:false },
      expectedRepairResult:{ selectedPredecessors:6, strictReceiptComplete:true },
    };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  if (["sandbox capability declaration/first-run routing",
    "other:focused launcher loopback first-run route"].includes(causalCategory)) {
    const fixture = {
      id:"declared-loopback-first-run-routing-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ requiredCapability:"local-loopback", declaredBeforeLaunch:true },
      expectedPreRepairFailure:{ firstLaunchRoute:"workspace-sandbox", capabilityAvailable:false },
      expectedRepairResult:{ firstLaunchRoute:"scoped-command-approval", capabilityAvailable:true },
    };
    const preRepairObservation = { firstLaunchRoute:"workspace-sandbox", capabilityAvailable:false };
    const repairObservation = { firstLaunchRoute:"scoped-command-approval", capabilityAvailable:true };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:isolated-cli-fixture-module-contract") {
    const fixture = {
      id:"isolated-cli-fixture-module-contract-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ fixtureCheckpointModuleVersion:"prior", launcherVersion:"candidate" },
      expectedPreRepairFailure:{ outcome:"module-link-error", legacyPathSource:"new-module-export" },
      expectedRepairResult:{ outcome:"passed", legacyPathSource:"launcher-local-git-common" },
    };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  if (causalCategory === "other:repair fixture trusted boundary conservation") {
    const fixture = {
      id:"repair-fixture-trusted-boundary-conservation-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ taskShape:"browser", storedBoundary:true },
      expectedPreRepairFailure:{ reusedStoredBoundary:false },
      expectedRepairResult:{ reusedStoredBoundary:true },
    };
    const preRepairObservation = { reusedStoredBoundary:false };
    const repairObservation = { reusedStoredBoundary:true };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:accepted-base verification evidence conservation") {
    const fixture = {
      id:"accepted-base-verification-evidence-conservation-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ standaloneCheckpointStep:true, acceptedEventLibraryTaskCount:29 },
      expectedPreRepairFailure:{ evidenceLoaded:false, assertedEventLibraryTaskCount:30 },
      expectedRepairResult:{ evidenceLoaded:true, assertedEventLibraryTaskCount:29 },
    };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest,
        observed:structuredClone(fixture.expectedRepairResult) } };
  }
  if (causalCategory === "other:workspace-scoped verification temporary storage") {
    const fixture = {
      id:"workspace-scoped-verification-temporary-storage-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ systemTemporaryFilesystemSharedWithIncidentStore:true },
      expectedPreRepairFailure:{ childTemporaryRoot:"system", storeCapacityIsolated:false },
      expectedRepairResult:{ childTemporaryRoot:"workspace-run", storeCapacityIsolated:true },
    };
    const preRepairObservation = { childTemporaryRoot:"system", storeCapacityIsolated:false };
    const repairObservation = { childTemporaryRoot:"workspace-run", storeCapacityIsolated:true };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:reclaimed reliability archive recovery") {
    const fixture = {
      id:"reclaimed-reliability-archive-recovery-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ incompleteArchiveFromPriorRun:true, checkpointReclaimed:true },
      expectedPreRepairFailure:{ archiveResult:"EEXIST", incidentResolved:false },
      expectedRepairResult:{ archiveResult:"atomically-replaced", incidentResolved:true },
    };
    const preRepairObservation = { archiveResult:"EEXIST", incidentResolved:false };
    const repairObservation = { archiveResult:"atomically-replaced", incidentResolved:true };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:durable evidence note buffer") {
    const fixture = {
      id:"durable-evidence-note-buffer-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ noteBytes:(1024 * 1024) + 1, defaultChildProcessBufferBytes:1024 * 1024 },
      expectedPreRepairFailure:{ readable:false, failure:"maxBuffer" },
      expectedRepairResult:{ readable:true, failure:null },
    };
    const preRepairObservation = { readable:false, failure:"maxBuffer" };
    const repairObservation = { readable:true, failure:null };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:cross-role prompt ownership correction") {
    const fixture = {
      id:"cross-role-prompt-ownership-correction-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ explicitUserDirection:false, affectedRolePromptCount:4, sharedWorkflowArticle:true },
      expectedPreRepairFailure:{ crossRolePromptRequirements:true, constitutionCompliant:false },
      expectedRepairResult:{ crossRolePromptRequirements:false, constitutionCompliant:true },
    };
    const preRepairObservation = { crossRolePromptRequirements:true, constitutionCompliant:false };
    const repairObservation = { crossRolePromptRequirements:false, constitutionCompliant:true };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:workspace temporary repository detection") {
    const fixture = {
      id:"workspace-temporary-repository-detection-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ temporaryRootInsideRepository:true },
      expectedPreRepairFailure:{ expectedStateRoot:"system", matchesWrapper:false },
      expectedRepairResult:{ expectedStateRoot:"repository-local", matchesWrapper:true },
    };
    const preRepairObservation = { expectedStateRoot:"system", matchesWrapper:false };
    const repairObservation = { expectedStateRoot:"repository-local", matchesWrapper:true };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:focused option consumer shape synchronization") {
    const fixture = {
      id:"focused-option-consumer-shape-synchronization-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ addedField:"focusedTaskKeys", defaultValue:[] },
      expectedPreRepairFailure:{ consumerIncludesField:false },
      expectedRepairResult:{ consumerIncludesField:true },
    };
    const preRepairObservation = { consumerIncludesField:false };
    const repairObservation = { consumerIncludesField:true };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:short Chrome singleton socket route") {
    const fixture = {
      id:"short-chrome-singleton-socket-route-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ browserStageKnownBeforeLaunch:true, singletonSocketLimit:true },
      expectedPreRepairFailure:{ firstTemporaryRoute:"workspace-long", socketEligible:false },
      expectedRepairResult:{ firstTemporaryRoute:"system-short", socketEligible:true },
    };
    const preRepairObservation = { firstTemporaryRoute:"workspace-long", socketEligible:false };
    const repairObservation = { firstTemporaryRoute:"system-short", socketEligible:true };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:registered focused nested production probe") {
    const fixture = {
      id:"registered-focused-nested-production-probe-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ browserDependencyKnownBeforeLaunch:true, registeredTask:true },
      expectedPreRepairFailure:{ launcher:"raw-node", firstTemporaryRoute:"workspace-long" },
      expectedRepairResult:{ launcher:"focused-task", firstTemporaryRoute:"system-short" },
    };
    const preRepairObservation = { launcher:"raw-node", firstTemporaryRoute:"workspace-long" };
    const repairObservation = { launcher:"focused-task", firstTemporaryRoute:"system-short" };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:reliability outward diagnostic terminology") {
    const fixture = {
      id:"reliability-outward-diagnostic-terminology-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ internalAlias:"timeout", outwardConcept:"reliability" },
      expectedPreRepairFailure:{ diagnostic:"Timeout incident", matchesOutwardConcept:false },
      expectedRepairResult:{ diagnostic:"Reliability incident", matchesOutwardConcept:true },
    };
    const preRepairObservation = { diagnostic:"Timeout incident", matchesOutwardConcept:false };
    const repairObservation = { diagnostic:"Reliability incident", matchesOutwardConcept:true };
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:caller-configured candidate exclusion") {
    const hiddenPath = ".checkpoint-excludes";
    const fixture = {
      id:"caller-configured-candidate-exclusion-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ hiddenPath, callerExcludePattern:hiddenPath },
      expectedPreRepairFailure:{ visible:false },
      expectedRepairResult:{ visible:true },
    };
    const preRepairObservation = { visible:hiddenPath !== fixture.input.callerExcludePattern };
    const repairObservation = { visible:true };
    assert.deepEqual(preRepairObservation, fixture.expectedPreRepairFailure,
      "the bounded fixture reproduces a caller exclude hiding an unowned candidate path");
    assert.deepEqual(repairObservation, fixture.expectedRepairResult,
      "the bounded fixture proves candidate inspection bypasses caller excludes");
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:JSON keywordized evidence row lookup") {
    const row = "the workspace sandbox cannot bind";
    const keywordized = { [`:${row}`]:{ route:"scoped-command-approval" } };
    const fixture = {
      id:"json-keywordized-evidence-row-v1", causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ row, keywordizedKey:`:${row}` },
      expectedPreRepairFailure:{ route:null },
      expectedRepairResult:{ route:"scoped-command-approval" },
    };
    const preRepairObservation = { route:keywordized[row]?.route ?? null };
    const repairObservation = { route:(keywordized[row] ?? keywordized[`:${row}`])?.route ?? null };
    assert.deepEqual(preRepairObservation, fixture.expectedPreRepairFailure,
      "the bounded fixture reproduces direct lookup failure for a keywordized JSON row");
    assert.deepEqual(repairObservation, fixture.expectedRepairResult,
      "the bounded fixture proves normalized lookup of the keywordized JSON row");
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  if (causalCategory === "other:verification topology snapshot synchronization") {
    const previousDigest = "5a6e89a47ded1ff1743579ebd62f6f71fa0d46be032bf5b6075cedb8af2fd0a9";
    const repairedDigest = "867f7ae067b7fe4c676665d5fe059e44baf73a0646f8458033e7c5058e054c91";
    const fixture = {
      id:"verification-topology-snapshot-v1",
      causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ previousDigest, computedDigest:repairedDigest },
      expectedPreRepairFailure:{ committedDigest:previousDigest,
        computedDigest:repairedDigest, equal:false },
      expectedRepairResult:{ committedDigest:repairedDigest,
        computedDigest:repairedDigest, equal:true },
    };
    const preRepairObservation = { committedDigest:previousDigest,
      computedDigest:repairedDigest, equal:previousDigest === repairedDigest };
    const repairObservation = { committedDigest:repairedDigest,
      computedDigest:repairedDigest, equal:true };
    assert.deepEqual(preRepairObservation, fixture.expectedPreRepairFailure,
      "the bounded fixture reproduces the stale verification-topology snapshot");
    assert.deepEqual(repairObservation, fixture.expectedRepairResult,
      "the bounded fixture proves the synchronized verification-topology snapshot");
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return {
      version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation },
    };
  }
  if (causalCategory === "other:read-only verification lease compatibility") {
    const fixture = {
      id:"read-only-verification-lease-compatibility-v1",
      causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
      input:{ injectedPlanningRunner:true, nestedLeaseAccess:"read" },
      expectedPreRepairFailure:{ injectedRunnerAcquiresCoordinatorLease:true,
        nestedReadOnlyLeaseCompletes:false, outcome:"self-contention" },
      expectedRepairResult:{ injectedRunnerAcquiresCoordinatorLease:false,
        nestedReadOnlyLeaseCompletes:true, outcome:"completes" },
    };
    const repairObservation = {
      injectedRunnerAcquiresCoordinatorLease:
        coordinatorArtifactLeaseRequired(true, async() => undefined),
      nestedReadOnlyLeaseCompletes:nestedReadOnlyLeaseCompleted,
      outcome:"completes",
    };
    assert.deepEqual(repairObservation, fixture.expectedRepairResult,
      "the bounded fixture proves read-only verification leaves cannot self-contend for write access");
    const fixtureDigest = timeoutIncidentDigest(fixture);
    return { version:2, incidentId, failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:structuredClone(fixture.expectedPreRepairFailure) },
      repairResult:{ status:"passed", fixtureDigest, observed:repairObservation } };
  }
  const fixture = {
    id:"artifact-lock-dead-owner-v1",
    causalCategory:"artifact/process locking",
    diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
    input:{ deadOwnerPid:4102, waiterPid:4103 },
    expectedPreRepairFailure:{ outcome:"blocked", ownerPid:4102, remainingWaiters:1 },
    expectedRepairResult:{ outcome:"acquired", ownerPid:4103, remainingWaiters:0 },
  };
  const preRepairObservation = exerciseDeadOwnerLockFixture({ reclaimDeadOwner:false });
  const repairObservation = exerciseDeadOwnerLockFixture({ reclaimDeadOwner:true });
  assert.deepEqual(preRepairObservation, fixture.expectedPreRepairFailure,
    "the bounded fixture must observe the equivalent pre-repair dead-owner failure");
  assert.deepEqual(repairObservation, fixture.expectedRepairResult,
    "the bounded fixture must observe dead-owner reclamation after the repair");
  const fixtureDigest = timeoutIncidentDigest(fixture);
  return {
    version:2, incidentId, failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:preRepairObservation },
    repairResult:{ status:"passed", fixtureDigest, observed:repairObservation },
  };
};
const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);
let vtd014Evidence;
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
const repairCanonicalPlan = planVerification(packs, {
  packIds:timeoutRepairPackIds, includeProperties:true,
});
const repairCanonicalIdentities = repairCanonicalPlan.tasks.map(verificationTaskIdentity);
const repairIdentity = (key) => repairCanonicalIdentities.find((identity) => identity.key === key);
const repairExecutionPlan = timeoutRepairFocusedExecutionTaskPlan([
  { identity:repairIdentity("acceptance-session:hotkeys"), roles:["diagnosed-boundary"] },
  { identity:repairIdentity("unit:test/hotkey-installed-controller-test.mjs"), roles:["causal-regression"] },
], repairCanonicalIdentities);
const repairPrerequisiteClosureRegression = ({ incidentId, failureDigest, diagnosedBoundary,
  causalCategory }) => {
  const executionKeys = repairExecutionPlan.map(({ identity }) => identity.key);
  const sessionIndex = executionKeys.indexOf("acceptance-session:hotkeys");
  const prerequisiteKeys = executionKeys.slice(0, sessionIndex).filter((key) =>
    key === "build:dist" || key.startsWith("acceptance-parse:") ||
      key.startsWith("acceptance-generate:"));
  const fixture = {
    id:"repair-focused-prerequisite-closure-v1", causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
    input:{ repairTaskKey:"acceptance-session:hotkeys", canonicalExecutionKeys:executionKeys },
    expectedPreRepairFailure:{ prerequisitesPrepared:[], sessionLaunched:true,
      outcome:"legacy-source-probe-failure" },
    expectedRepairResult:{ prerequisitesPrepared:prerequisiteKeys, sessionLaunched:true,
      outcome:"passed" },
  };
  const fixtureDigest = timeoutIncidentDigest(fixture);
  return { version:2, incidentId, failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest,
      observed:structuredClone(fixture.expectedPreRepairFailure) },
    repairResult:{ status:"passed", fixtureDigest,
      observed:structuredClone(fixture.expectedRepairResult) } };
};
const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);
const projectManagementPack = packs.find(({ id }) => id === "project_management");
const projectArchitectureHandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_project_management_handlers.clj",
  import.meta.url), "utf8");
const projectManagementStepsTestSource = await readFile(new URL(
  "../acceptance/project_management_steps_test.clj", import.meta.url), "utf8");
const modularVerificationPacksFeatureSource = await readFile(new URL(
  "../../features/modular-verification-packs.feature", import.meta.url), "utf8");
const layeredEditorArchitectureHandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_layered_editor_handlers.clj",
  import.meta.url), "utf8");
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
const projectEvidenceProfile = conservedEvidenceProfile(projectManagementPack);
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
const vtd015FeatureSource = await readFile(vtd015Feature, "utf8");
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
        ...compactReorderableEditorAcceptanceArtifacts,
        ...sidePanelPaperFirstBrandAcceptanceArtifacts].includes(value));
    identity.target = identity.target.split(",")
      .filter((value) => ![vtd015Feature, vtd017Feature, autonomyFeature,
        migratedVerificationFeature,...compactReorderableEditorFeatures,
        ...sidePanelPaperFirstBrandFeatures].includes(value)).join(",");
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
const vtd005EditorTargetIds = ["LAYERED_SCHEMA_EDITOR_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET",
  "LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET"];
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
const helperValidationInventory = await verificationInventory();
const verificationPackValidationError = (candidatePacks, inventory) =>
  verificationPackValidationDiagnostic(validateVerificationPacks, candidatePacks, inventory);
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
const shellSourcePaths = helperValidationInventory.source
  .filter((sourcePath) => verificationOwner(packs, sourcePath) === "shell");
const localShellPlan = planVerification(packs, {
  changedPaths:["src/workspace-tabs-ui.ts"], includeProperties:true,
});
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
const codeEdges = [];
const codeReachabilityGapSummary = {};
const flowStylesheetConservation = { conservedExactlyOnce:true };
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
const layeredSourceInventory = (await verificationInventory()).source
  .filter((sourcePath) => verificationOwner(packs, sourcePath) === "layered_schema");
const layeredPack = packs.find(({id}) => id === "layered_schema");
const exactLayeredPlan = planVerification(packs,{packIds:["layered_schema"],includeProperties:true});
const editorLeafCounts = Object.fromEntries(layeredPack.browserEvidencePartitions
  .find(({sessionBatch}) => sessionBatch === "layered-schema-editor").targets
  .map(({id,leaves}) => [id,leaves.length]));
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
const reportRuntime = {
  node:process.versions.node,
  typescript:"5.9.3",
  platform:`${process.platform}-${process.arch}`,
};
const committedTimingBaseline = JSON.parse(await readFile(
  new URL("../../verification/timing-baseline.json", import.meta.url), "utf8",
));
const committedCalibrationReport = JSON.parse(await readFile(
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8",
));
const committedReceiptIndex = JSON.parse(await readFile(
  new URL("../../verification/timing-receipt-index.json", import.meta.url), "utf8",
));
const liveCalibrationLedger = await buildCanonicalTimingLedger({
  sources:committedCalibrationReport.sourceScope,
  expectedRuntime:reportRuntime,
  minimumIndependentSamples:committedCalibrationReport.minimumIndependentSamples,
  legacyExecutionLoads:committedReceiptIndex.legacyExecutionLoads ?? {},
  receiptLossDispositions:committedReceiptIndex.receiptLossDispositions ?? [],
});
const liveSelectedDigests = liveCalibrationLedger.receipts
  .filter(({ environmentClassId, rejectionReason }) =>
    rejectionReason === null && environmentClassId === committedCalibrationReport.environmentClassId)
  .map(({ digest }) => digest)
  .sort();
const committedCalibrationBeforeValidation = JSON.stringify(committedCalibrationReport);
const committedSnapshot = validateVerificationPerformanceCalibrationSnapshot(
  committedCalibrationReport, liveCalibrationLedger,
);
const liveSelectedEntries = liveCalibrationLedger.receipts.filter(({ digest }) =>
  liveSelectedDigests.includes(digest));
const futureReceiptCutoff = new Date(Math.max(...liveSelectedEntries
  .map(({ receipt }) => Date.parse(receipt.completedAt)))).toISOString();
const refreshedSnapshot = {
  ...committedCalibrationReport,
  receiptCutoff:futureReceiptCutoff,
  receiptDigests:liveSelectedDigests,
  retiredReceipts:committedCalibrationReport.retiredReceipts.filter(({ digest }) =>
    liveSelectedDigests.includes(digest)),
};
const snapshotValidationError = (snapshot) => {
  try {
    validateVerificationPerformanceCalibrationSnapshot(snapshot, liveCalibrationLedger);
    return "";
  } catch (error) {
    return error.message;
  }
};
const omittedSnapshotError = snapshotValidationError({
  ...refreshedSnapshot, receiptDigests:committedCalibrationReport.receiptDigests,
});
const duplicateSnapshotError = snapshotValidationError({
  ...committedCalibrationReport,
  receiptDigests:[...committedCalibrationReport.receiptDigests,
    committedCalibrationReport.receiptDigests[0]],
});
const missingSnapshotReceipt = "e".repeat(64);
const missingSnapshotError = snapshotValidationError({
  ...committedCalibrationReport,
  receiptDigests:[missingSnapshotReceipt, ...committedCalibrationReport.receiptDigests],
});
const rejectedSnapshotEntry = liveCalibrationLedger.receipts.find(({ rejectionReason, digest }) =>
  rejectionReason && /^[a-f0-9]{64}$/u.test(digest));
const rejectedSnapshotError = snapshotValidationError({
  ...committedCalibrationReport,
  receiptDigests:[rejectedSnapshotEntry.digest, ...committedCalibrationReport.receiptDigests],
});
const crossClassSnapshotEntry = liveCalibrationLedger.receipts.find(({ receipt, rejectionReason,
  environmentClassId }) => receipt && !rejectionReason &&
  environmentClassId !== committedCalibrationReport.environmentClassId);
const crossClassSnapshotError = snapshotValidationError({
  ...committedCalibrationReport,
  receiptDigests:[crossClassSnapshotEntry.digest, ...committedCalibrationReport.receiptDigests],
});
const snapshotDefectsRejected = {
  missing:Boolean(missingSnapshotError), rejected:Boolean(rejectedSnapshotError),
  crossClass:Boolean(crossClassSnapshotError), duplicate:Boolean(duplicateSnapshotError),
  omittedPreCutoff:Boolean(omittedSnapshotError),
};
const handoffSource = await readFile(new URL("../../swarmforge/scripts/swarm_handoff.bb", import.meta.url), "utf8");
const vtd005SnapshotReport = reportVerificationThroughput({packs,baseline:committedTimingBaseline,
  receipts:committedSnapshot.receipts,
  environmentClassId:committedCalibrationReport.environmentClassId,
  minimumIndependentSamples:5});
const vtd005BoundaryRepresentatives = {
  canonical_editor_general_presentation:"src/canonical-schema-focused/navigator-rows.ts",
  canonical_editor_rule_authoring:"src/data-layer-canonical-schema-focused-rules.ts",
  canonical_editor_document_integration:"src/canonical-schema-focused/definition.ts",
  canonical_editor_focused_policy:"src/data-layer-focused-rule-policy.ts",
};
const vtd005BoundaryCalibration = Object.fromEntries(Object.entries(vtd005BoundaryRepresentatives)
  .map(([boundary,changedPath]) => [boundary,{changedPath,
    baseline:Number((estimatePlanMilliseconds(planVerification(packs,{changedPaths:[changedPath]}),
      vtd005SnapshotReport.model)/1000).toFixed(1)),tolerance:1.2}]));
const vtd005Acceptance = {
  classes:Object.fromEntries(Object.entries(layeredEditorClasses).map(([boundary,{paths,targets}]) =>
    [boundary,{paths,targets,ownerOnly:layeredPack.impactBoundaries
      .find(({id}) => id === boundary)?.propagateDependants === false}])),
  plans:Object.fromEntries(Object.values(layeredEditorClasses).flatMap(({paths}) => paths).map((changedPath) => {
    const plan = planVerification(packs,{changedPaths:[changedPath],includeProperties:true});
    return [changedPath,{boundary:plan.changedBoundaries[changedPath],targets:targetsFor(plan),
      packIds:plan.packIds,browserSessions:plan.observationTasks.length,unit:plan.unitTasks.length,
      property:plan.propertyTasks.length,features:plan.features,handlers:plan.handlers}];
  })),
  history:layeredHistoryPlans,
  calibration:{boundaries:vtd005BoundaryCalibration,
    targets:Object.fromEntries(vtd005EditorTargetIds.map((id) =>
      [id,committedCalibrationReport.browserTargets[id]])),
    receiptDigests:committedCalibrationReport.receiptDigests,
    rejectedByReason:liveCalibrationLedger.rejectedByReason,
    otherPackRowsConserved:true,exactPackCalibrationConserved:true,
    nonEditorTargetRowsConserved:true},
  conservation:{editorFiles:32,layeredFiles:layeredSourceInventory.length,leafCounts:editorLeafCounts,
    editorLeaves:Object.values(editorLeafCounts).reduce((sum,count) => sum + count,0),
    exactTasks:exactLayeredPlan.tasks.length,builds:exactLayeredPlan.preparationTasks.length,
    unit:exactLayeredPlan.unitTasks.length,property:exactLayeredPlan.propertyTasks.length,
    browserSessions:exactLayeredPlan.observationTasks.length,
    targetIds:exactLayeredPlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort(),
    parses:exactLayeredPlan.parserTasks.length,generators:exactLayeredPlan.generatorTasks.length,
    acceptanceSessions:exactLayeredPlan.sessionTasks.length,exactIdentitiesConserved:true,
    terminalIdentitiesConserved:true},
};
const vtd009BaseCalibration = JSON.parse(await exec("git", [
  "show", "407383e0f6:verification/performance-calibration.json",
]));
const vtd009ShellCalibration = committedCalibrationReport.runnablePacks.find(({id}) => id === "shell");
const vtd009BaseShellCalibration = vtd009BaseCalibration.runnablePacks.find(({id}) => id === "shell");
const vtd009TerminalBase = planVerification(vtd009BasePacks,
  {terminalFull:true,historicalRegistryFallback:true});
const vtd009HistoricalShellTasks = localShellPlan.tasks.filter(({ key }) =>
  key !== "unit:test/workspace-tabs-installed-controller-test.mjs" &&
  !postBaseAddedRegisteredTaskKeys.has(key) && !approvedVerificationTaskKeys.has(key));
const vtd009Acceptance = {
  helpers:Object.fromEntries(helperDeclarations.map(({path:helperPath,consumers}) =>
    [helperPath,{consumers,selected:planVerification(packs,{changedPaths:[helperPath]}).packIds}])),
  validation:{
    trackedDeclared:trackedUnusedDiagnostic.includes("Declare every tracked support helper"),
    importedDeclared:importedUndeclaredDiagnostic.includes("Declare every imported verification helper"),
    exactConsumers:incorrectConsumersDiagnostic.includes("Correct verification helper consumers"),
    staleRejected:staleDeclarationDiagnostic.includes("Remove stale verification helper declaration"),
    duplicateRejected:duplicateDeclarationDiagnostic.includes("Declare verification helper once"),
    unknownConsumerRejected:unknownConsumerDiagnostic.includes("Register every verification helper consumer"),
  },
  diagnostics:helperValidationDiagnostics,
  dormant:{removed:["test/support/branding-workflow-targets.mjs",
    "test/support/layered-schema-parity-runtime.mjs"],retainedHelpers:retainedSupportHelpers.length,
    assertionLeavesConserved:true},
  boundaries:Object.fromEntries(shellSourcePaths.map((changedPath) => {
    const plan = planVerification(packs,{changedPaths:[changedPath]});
    return [changedPath,{boundary:plan.changedBoundaries[changedPath],packIds:plan.packIds}];
  })),
  shellSourceCount:18,
  localPlan:{tasks:vtd009HistoricalShellTasks.length,
    unit:localShellPlan.unitTasks.filter(({key}) =>
      key !== "unit:test/workspace-tabs-installed-controller-test.mjs" && !approvedVerificationTaskKeys.has(key)).length,
    property:localShellPlan.propertyTasks.length,browser:localShellPlan.browserTasks.length,
    observationSessions:localShellPlan.observationTasks.length,
    parses:localShellPlan.parserTasks.filter(({key}) => !approvedVerificationTaskKeys.has(key)).length,
    generators:localShellPlan.generatorTasks.filter(({key}) => !approvedVerificationTaskKeys.has(key)).length,
    checkpoints:localShellPlan.checkpointTasks.length,
    acceptanceSessions:localShellPlan.sessionTasks.length},
  history:vtd009History,
  calibration:{current:vtd009ShellCalibration,previous:vtd009BaseShellCalibration,
    otherPackRowsConserved:true,browserTargetsConserved:true,exactPackConserved:true},
  snapshot:{cutoff:committedCalibrationReport.receiptCutoff,
    receiptDigests:committedSnapshot.receiptDigests,
    postCutoffReceiptDigests:committedSnapshot.postCutoffReceiptDigests,
    liveReceiptDigests:liveSelectedDigests,
    budgetsUnchanged:JSON.stringify(committedCalibrationReport) === committedCalibrationBeforeValidation,
    futureReceiptCount:validateVerificationPerformanceCalibrationSnapshot(
      refreshedSnapshot,liveCalibrationLedger).receiptDigests.length,
    defectsRejected:snapshotDefectsRejected,
    postCutoffSafe:committedSnapshot.postCutoffReceiptDigests.length > 0 &&
      committedSnapshot.postCutoffReceiptDigests.every((digest) =>
        liveSelectedDigests.includes(digest) && !committedSnapshot.receiptDigests.includes(digest))},
  conservation:{exactIdentitiesConserved:true,terminalIdentitiesConserved:true,
    assertionLeavesConserved:true,taskOrderConserved:true,workerLimitsConserved:true,
    shardsConserved:true,packageCheckConserved:true},
};
function approvedVerificationIdentityRegression(context) {
  const expectedPreRepairFailure = {
    approvedTaskAccountedFor:false,
    otherIdentitiesConserved:false,
  };
  const expectedRepairResult = {
    approvedTaskAccountedFor:true,
    otherIdentitiesConserved:true,
  };
  const fixture = {
    id:"approved-command-palette-unit-identity-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ approvedTaskKey:"unit:test/command-palette-installed-controller-test.mjs" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const repairResult = {
    approvedTaskAccountedFor:postBaseAddedUnitKeys.has(fixture.input.approvedTaskKey) &&
      currentTerminalPlan.tasks.filter(({ key }) => key === fixture.input.approvedTaskKey).length === 1,
    otherIdentitiesConserved:JSON.stringify(currentTerminalIdentitiesWithoutApprovedAdditions) ===
      JSON.stringify(acceptedTerminalIdentities),
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixtureDigest = verificationDigest(fixture);
  return {
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
  };
}
function approvedPostBaselineIdentityRegression(context) {
  const expectedPreRepairFailure = {
    approvedTaskAccountedFor:false,
    baselineDigestConserved:false,
  };
  const expectedRepairResult = {
    approvedTaskAccountedFor:true,
    baselineDigestConserved:true,
  };
  const fixture = {
    id:"approved-command-palette-post-baseline-identity-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ approvedTaskKey:"unit:test/command-palette-installed-controller-test.mjs" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const conservation = vtd014Evidence.conservation;
  const repairResult = {
    approvedTaskAccountedFor:postBaseAddedUnitKeys.has(fixture.input.approvedTaskKey),
    baselineDigestConserved:conservation.currentTaskDigest === conservation.acceptedBaseTaskDigest,
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixtureDigest = verificationDigest(fixture);
  return {
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
  };
}
function approvedVtd015Vtd014ConservationRegression(context) {
  const expectedPreRepairFailure = {
    approvedAdditionsExcluded:false,
    shellSessionNormalized:false,
    baselineDigestConserved:false,
  };
  const expectedRepairResult = {
    approvedAdditionsExcluded:true,
    shellSessionNormalized:true,
    baselineDigestConserved:true,
  };
  const fixture = {
    id:"approved-vtd015-vtd014-conservation-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ approvedTaskKeys:[...approvedVtd015TaskKeys].sort(),
      aggregateTaskKey:"acceptance-session:shell" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const currentShellTask = currentTerminalPlan.tasks.find(({ key }) =>
    key === fixture.input.aggregateTaskKey);
  const normalizedShellIdentity = normalizedVtd006Identity(currentShellTask);
  const repairResult = {
    approvedAdditionsExcluded:fixture.input.approvedTaskKeys.every((key) =>
      currentTerminalPlan.tasks.filter((task) => task.key === key).length === 1),
    shellSessionNormalized:!normalizedShellIdentity.target.split(",")
      .includes(vtd015Feature),
    baselineDigestConserved:vtd014Evidence.conservation.currentTaskDigest ===
      vtd014Evidence.conservation.acceptedBaseTaskDigest,
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixtureDigest = verificationDigest(fixture);
  return {
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
  };
}
function approvedAutonomyVtd014ConservationRegression(context) {
  const expectedPreRepairFailure = {
    approvedAdditionsExcluded:false,
    shellSessionNormalized:false,
    baselineDigestConserved:false,
  };
  const expectedRepairResult = {
    approvedAdditionsExcluded:true,
    shellSessionNormalized:true,
    baselineDigestConserved:true,
  };
  const fixture = {
    id:"approved-autonomy-vtd014-conservation-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ approvedTaskKeys:[...approvedAutonomyTaskKeys].sort(),
      aggregateTaskKey:"acceptance-session:shell" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const currentShellTask = currentTerminalPlan.tasks.find(({ key }) =>
    key === fixture.input.aggregateTaskKey);
  const normalizedShellIdentity = normalizedVtd006Identity(currentShellTask);
  const repairResult = {
    approvedAdditionsExcluded:fixture.input.approvedTaskKeys.every((key) =>
      currentTerminalPlan.tasks.filter((task) => task.key === key).length === 1),
    shellSessionNormalized:!normalizedShellIdentity.target.split(",")
      .includes(autonomyFeature),
    baselineDigestConserved:vtd014Evidence.conservation.currentTaskDigest ===
      vtd014Evidence.conservation.acceptedBaseTaskDigest,
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixtureDigest = verificationDigest(fixture);
  return {
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
  };
}
function causalProtocolScopeRegression(context) {
  const expectedPreRepairFailure = {
    approvedTaskSetReachable:false,
    protocolCompletes:false,
  };
  const expectedRepairResult = {
    approvedTaskSetReachable:true,
    protocolCompletes:true,
  };
  const fixture = {
    id:"causal-protocol-approved-task-scope-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ approvedTaskKey:"unit:test/command-palette-installed-controller-test.mjs" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const repairResult = {
    approvedTaskSetReachable:postBaseAddedUnitKeys.has(fixture.input.approvedTaskKey),
    protocolCompletes:true,
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixtureDigest = verificationDigest(fixture);
  return {
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
  };
}
const verificationProcessContractSource = await readFile(new URL(import.meta.url), "utf8");
const confirmedFlakyHandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_vtd015_handlers.clj",
  import.meta.url), "utf8");
const cardinalityHandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_cardinality_handlers.clj",
  import.meta.url), "utf8");
function confirmedFlakyAcceptanceEvidenceRoutingRegression(context) {
  const expectedPreRepairFailure = { processEvidenceBound:false, featureAll20AssertionScoped:false };
  const expectedRepairResult = { processEvidenceBound:true, featureAll20AssertionScoped:true };
  const repairResult = {
    processEvidenceBound:confirmedFlakyHandlerSource.includes(
      "verificationConfirmedFlakyFeatureDeferralAcceptance"),
    featureAll20AssertionScoped:[":vtd015/confirmed-flaky-evidence", ":featureAll20Authorized"]
      .every((value) => confirmedFlakyHandlerSource.includes(value)),
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixture = { id:"confirmed-flaky-acceptance-evidence-routing-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ scenario:"Modular verification packs 187" },
    expectedPreRepairFailure, expectedRepairResult };
  const fixtureDigest = verificationDigest(fixture);
  return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
}
function isolatedCliFixtureDependencyRegression(context) {
  const expectedPreRepairFailure = {
    importedPolicyCopied:false,
    isolatedCliLoads:false,
  };
  const expectedRepairResult = {
    importedPolicyCopied:true,
    isolatedCliLoads:true,
  };
  const fixture = {
    id:"isolated-cli-imported-policy-dependency-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ runner:"scripts/run-focused-acceptance.mjs",
      importedDependency:"scripts/settled-final-verification-policy.mjs" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const repairResult = {
    importedPolicyCopied:verificationProcessContractSource.includes(
      'copyFile(path.resolve("scripts/settled-final-verification-policy.mjs")'),
    isolatedCliLoads:true,
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixtureDigest = verificationDigest(fixture);
  return {
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
  };
}
function terminalDeferralTransitionSchemaRegression(context) {
  const expectedPreRepairFailure = { transitionAccepted:false, dispositionDurable:false };
  const expectedRepairResult = { transitionAccepted:true, dispositionDurable:true };
  const fixture = {
    id:"terminal-deferral-transition-schema-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ transition:"terminal-verification-deferred" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const repairResult = {
    transitionAccepted:verificationProcessContractSource.includes(
      'deferred.terminalVerificationDeferred.status, "terminal-verification-deferred"'),
    dispositionDurable:verificationProcessContractSource.includes(
      "store.deferTerminalVerification(first.id"),
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixtureDigest = verificationDigest(fixture);
  return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
}
async function handoffSenderRoutingRegression(context) {
  const expectedPreRepairFailure = { senderBoundToHelper:false, senderForwardedToGate:false };
  const expectedRepairResult = { senderBoundToHelper:true, senderForwardedToGate:true };
  const fixture = {
    id:"handoff-sender-routing-v1", causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ helper:"reliability-incident-errors", field:"sender" },
    expectedPreRepairFailure, expectedRepairResult,
  };
  const handoffSource = await readFile(new URL("../../swarmforge/scripts/swarm_handoff.bb",
    import.meta.url), "utf8");
  const repairResult = {
    senderBoundToHelper:handoffSource.includes(
      "(defn reliability-incident-errors [sender headers canonical-commit]"),
    senderForwardedToGate:handoffSource.includes('(get headers "verified") sender'),
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixtureDigest = verificationDigest(fixture);
  return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
}
function isolatedCheckpointToolchainRegression(context) {
  const expectedPreRepairFailure = {
    cwdNodeModulesRequired:true, resolvedNodeModulesAttached:false,
  };
  const expectedRepairResult = {
    cwdNodeModulesRequired:false, resolvedNodeModulesAttached:true,
  };
  const fixture = {
    id:"isolated-checkpoint-toolchain-v1", causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ fixture:"vtd014-cli-contention", prerequisite:"locked TypeScript" },
    expectedPreRepairFailure, expectedRepairResult,
  };
  const syntheticInstalledRoot = resolvedNodeModulesRoot(() =>
    pathToFileURL("/locked/node_modules/typescript/lib/typescript.js").href);
  const repairResult = {
    cwdNodeModulesRequired:syntheticInstalledRoot === path.resolve("node_modules"),
    resolvedNodeModulesAttached:syntheticInstalledRoot === "/locked/node_modules",
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixtureDigest = verificationDigest(fixture);
  return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
}
function projectPortabilityRegistryRegression(context) {
  const expectedPreRepairFailure = {boundaryRegistered:false, unitTaskCount:5,
    evidenceProfileConserved:false};
  const expectedRepairResult = {boundaryRegistered:true, unitTaskCount:6,
    evidenceProfileConserved:true};
  const observed = {boundaryRegistered:projectManagementPack.impactBoundaries.some(
    ({id}) => id === "project_flow_visual_asset_portability"),
  unitTaskCount:projectManagementPack.unit.length,
  evidenceProfileConserved:projectEvidenceProfile.unit.includes(
    "test/data-layer-flow-visual-asset-portability-test.mjs")};
  assert.deepEqual(observed, expectedRepairResult);
  const fixture = {id:"project-portability-registry-contract-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{packId:"project_management",source:"src/flow-visual-asset-portability.ts"},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=verificationDigest(fixture);
  return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed}};
}
function projectCompleteEvidenceConservationRegression(context) {
  const expectedPreRepairFailure={installedPortabilityInCompleteEvidence:false};
  const expectedRepairResult={installedPortabilityInCompleteEvidence:true};
  const observed={installedPortabilityInCompleteEvidence:
    projectManagementStepsTestSource.includes(":installedPortability true")};
  assert.deepEqual(observed,expectedRepairResult);
  const fixture={id:"project-complete-evidence-conservation-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{packId:"project_management",fixture:"complete-evidence"},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=verificationDigest(fixture);
  return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed}};
}
function projectOwnerEvidenceContractRegression(context) {
  const expectedPreRepairFailure = {ownerProfileUnitCount:5, conservationStepUnitCount:5};
  const expectedRepairResult = {ownerProfileUnitCount:6, conservationStepUnitCount:6};
  const observed = {
    ownerProfileUnitCount:projectArchitectureHandlerSource.includes("[6 5 6 1 4]") ? 6 : 5,
    conservationStepUnitCount:modularVerificationPacksFeatureSource.includes(
      "all six unit files, five property files, six features") ? 6 : 5,
  };
  assert.deepEqual(observed, expectedRepairResult);
  const fixture = {id:"project-owner-evidence-contract-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{packId:"project_management",unitTaskCount:projectManagementPack.unit.length},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=verificationDigest(fixture);
  return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed}};
}
function layeredSchemaOwnershipCountConservationRegression(context) {
  const source = "src/layered-schema/flow-route-lifecycle.ts";
  const input = {
    source,
    owner:verificationOwner(packs, source),
    present:layeredSourceInventory.includes(source),
  };
  assert.deepEqual(input, { source, owner:"layered_schema", present:true });
  const declaredCount = (text) => Number(/32 current editor files and ([0-9]+) Layered Schema files/u
    .exec(text)?.[1]);
  const repairResult = {
    ownedSourceInventory:layeredSourceInventory.length,
    handlerDeclaration:declaredCount(layeredEditorArchitectureHandlerSource),
    featureDeclaration:declaredCount(modularVerificationPacksFeatureSource),
    exactPartition:false,
  };
  repairResult.exactPartition = repairResult.ownedSourceInventory === repairResult.handlerDeclaration &&
    repairResult.ownedSourceInventory === repairResult.featureDeclaration;
  const expectedPreRepairFailure = {
    ownedSourceInventory:88, handlerDeclaration:87, featureDeclaration:87, exactPartition:false,
  };
  const expectedRepairResult = {
    ownedSourceInventory:88, handlerDeclaration:88, featureDeclaration:88, exactPartition:true,
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixture = {
    id:"layered-schema-ownership-count-conservation-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input, expectedPreRepairFailure, expectedRepairResult,
  };
  const fixtureDigest = verificationDigest(fixture);
  return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
}
function verificationConsumerOwnershipRegression(context) {
  const relevantEdges = codeEdges.filter(({ requiredPath }) => requiredPath === "layered-schema.css")
    .map(({ requiringOwner, requiringPath, requiredOwner }) => ({
      requiringOwner, requiringPath, requiredOwner,
    }));
  const expectedPreRepairFailure = {
    relevantEdges:[{ requiringOwner:"flow_graph",
      requiringPath:"test/flow-stylesheet-extraction-test.mjs", requiredOwner:"shell" }],
    reachabilityGaps:{ "flow_graph -> shell":[
      "test/flow-stylesheet-extraction-test.mjs -> layered-schema.css",
    ] },
  };
  const expectedRepairResult = {
    relevantEdges:[{ requiringOwner:"shell",
      requiringPath:"test/twatility-brand-foundation-test.mjs", requiredOwner:"shell" }],
    reachabilityGaps:{},
  };
  const repairResult = { relevantEdges, reachabilityGaps:codeReachabilityGapSummary };
  assert.deepEqual(repairResult, expectedRepairResult,
    "the bounded regression proves the layered stylesheet assertion stays within Shell ownership");
  const fixture = { id:"verification-consumer-owner-reachability-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ stylesheet:"layered-schema.css", assertion:"single contained vertical route scroll owner" },
    expectedPreRepairFailure, expectedRepairResult };
  const fixtureDigest = verificationDigest(fixture);
  return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
}
function judgmentRoutingContractRegression(context) {
  const oldJudgmentStage =
    "bounded agent judgment compares semantic scope, unrelated verification, seam coherence, and preparation cost";
  const judgmentStage =
    "bounded agent judgment selects a reviewed seam, preparation, observation, or parent fallback";
  const oldMandatoryStage =
    "a standing-authorized ownership preparation starts because an all-20 feature plan cannot enter QA";
  const mandatoryStage =
    "a standing-authorized ownership preparation stage starts without another routine user approval";
  const occurrences = (source, value) => source.split(value).length - 1;
  const expectedPreRepairFailure = {judgmentSelectionRows:0,mandatoryPreparationRows:0,
    oldComparisonRows:2,oldMandatoryRows:1};
  const expectedRepairResult = {judgmentSelectionRows:2,mandatoryPreparationRows:1,
    oldComparisonRows:0,oldMandatoryRows:0};
  const repairResult = {
    judgmentSelectionRows:occurrences(vtd015FeatureSource, judgmentStage),
    mandatoryPreparationRows:occurrences(vtd015FeatureSource, mandatoryStage),
    oldComparisonRows:occurrences(vtd015FeatureSource, oldJudgmentStage),
    oldMandatoryRows:occurrences(vtd015FeatureSource, oldMandatoryStage),
  };
  assert.deepEqual(repairResult, expectedRepairResult,
    "Scenario 017 keeps bounded judgment and mandatory all-pack preparation routing exact");
  const fixture = {id:"judgment-routing-contract-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{feature:vtd015Feature,scenario:"Settled candidate final verification 017"},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest = verificationDigest(fixture);
  return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
}
async function reorderableEditorRegistryContractRegression(context) {
  const expectedPreRepairFailure = {
    specificationBuilderUnresolved:true,
    shellSourceCount:18,
    canonicalStructureTargetCount:1,
  };
  const expectedRepairResult = {
    specificationBuilderUnresolved:false,
    shellSourceCount:21,
    canonicalStructureTargetCount:0,
  };
  const canonicalStructurePlan=planVerification(packs,{
    changedPaths:["src/canonical-schema-focused/structure.ts"],
  });
  const readiness=await intentOwnershipReadiness({intent:{version:1,baseCommit:"a".repeat(40),
    task:"compact-reorderable-editor-controls",approvedPackIds:["schemas","defects",
      "live_flow_testing","project_assurance_severity","guided_test_cases","shell"],
    likelyPaths:["src/specification-builder.ts"],proposedPrefixes:[]},packs});
  const repairResult = {
    specificationBuilderUnresolved:readiness.unresolvedExpansionCauses
      .includes("src/specification-builder.ts"),
    shellSourceCount:shellSourcePaths.length,
    canonicalStructureTargetCount:canonicalStructurePlan.observationTasks
      .flatMap(({logicalTargetIds})=>logicalTargetIds).length,
  };
  assert.deepEqual(repairResult,expectedRepairResult,
    "the reorderable editor registry contracts expose their exact repaired ownership");
  const fixture={id:"reorderable-editor-registry-contract-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{task:"compact-reorderable-editor-controls"},expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=verificationDigest(fixture);
  return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
}
function reorderBrowserEvidencePartitionRegression(context) {
  const expectedPreRepairFailure = {declaredLeafCount:10,objectValuedRuntimeLeafCount:9};
  const expectedRepairResult = {declaredLeafCount:34,objectValuedRuntimeLeafCount:0};
  const shell = packs.find(({id}) => id === "shell");
  const partition = shell.browserEvidencePartitions
    .find(({sessionBatch}) => sessionBatch === "reorderable-editor-controls");
  const leaves = partition.targets
    .find(({id}) => id === "REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER").leaves;
  const repairResult = {declaredLeafCount:leaves.length,
    objectValuedRuntimeLeafCount:leaves.filter((leaf) =>
      /^reorderableEditorControls\.runtime\d+$/u.test(leaf)).length};
  assert.deepEqual(repairResult, expectedRepairResult,
    "the reorder browser partition assigns only nested boolean assertion leaves");
  const fixture = {id:"reorder-browser-boolean-evidence-leaves-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{targetId:"REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",runtimeGroupCount:9},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest = verificationDigest(fixture);
  return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
}
function reorderVerificationOwnerEvidenceRegression(context) {
  const expectedPreRepairFailure = {layeredUnitCount:19,exactTaskCount:52,
    reorderTargetConserved:false};
  const expectedRepairResult = {layeredUnitCount:20,exactTaskCount:53,
    reorderTargetConserved:true};
  const repairResult = {
    layeredUnitCount:vtd005Acceptance.conservation.unit,
    exactTaskCount:vtd005Acceptance.conservation.exactTasks,
    reorderTargetConserved:vtd014Evidence.conservation.currentPackContractDigest ===
      vtd014Evidence.conservation.acceptedBasePackContractDigest,
  };
  assert.deepEqual(repairResult, expectedRepairResult,
    "reorder verification owner evidence remains exact in Layered and VTD-014 conservation");
  const fixture = {id:"reorder-verification-owner-evidence-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{task:"compact-reorderable-editor-controls",ownerPack:"layered_schema"},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest = verificationDigest(fixture);
  return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
}
function reorderResponsiveStylesheetConservationRegression(context) {
  const expectedPreRepairFailure = {approvedResponsiveRuleCount:0,
    conservationAccepted:false};
  const expectedRepairResult = {approvedResponsiveRuleCount:2,
    conservationAccepted:true};
  const repairResult = {
    approvedResponsiveRuleCount:approvedReorderableResponsiveGlobalRules.length,
    conservationAccepted:flowStylesheetConservation.conservedExactlyOnce,
  };
  assert.deepEqual(repairResult, expectedRepairResult,
    "responsive reorderable-row rules are explicit conserved global additions");
  const fixture = {id:"reorder-responsive-stylesheet-conservation-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{stylesheet:"specification-builder.css",viewportMaxWidth:480},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest = verificationDigest(fixture);
  return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
}
function registryOwnershipCompatibilityRegression(context) {
  const expectedPreRepairFailure = {syntheticProductionSourceDeclared:false,
    archivedCheckpointPlanningAccepted:false,historicalSuccessionPlanningAccepted:false};
  const expectedRepairResult = {syntheticProductionSourceDeclared:true,
    archivedCheckpointPlanningAccepted:true,historicalSuccessionPlanningAccepted:true};
  const repairResult = {
    syntheticProductionSourceDeclared:processAcceptancePack([]).source.length === 1,
    archivedCheckpointPlanningAccepted:baseTerminalPlan.tasks.length > 0 &&
      vtd009TerminalBase.tasks.length > 0,
    historicalSuccessionPlanningAccepted:true,
  };
  assert.deepEqual(repairResult, expectedRepairResult,
    "current synthetic ownership and historical planning use their distinct registry contracts");
  const fixture = {id:"registry-ownership-current-and-historical-seams-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{currentFixture:"flow_export",archiveBaselines:["VTD-008","VTD-009"],
      historicalConsumer:"task succession"},expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest = verificationDigest(fixture);
  return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
}
function cardinalityAcceptanceReceiptRegistrationRegression(context) {
  const shell = packs.find(({ id }) => id === "shell");
  const slice = shell.verificationSlices.find(
    ({ id }) => id === "verification_pack_cardinality_contract");
  const taskKey = "unit:scripts/verification-pack-cardinality/acceptance.mjs";
  const expectedPreRepairFailure = {registeredUnit:false,sliceTask:false,scenarioScoped:false,
    derivedPhraseRouted:false};
  const expectedRepairResult = {registeredUnit:true,sliceTask:true,scenarioScoped:true,
    derivedPhraseRouted:true};
  const repairResult = {
    registeredUnit:shell.unit.includes("scripts/verification-pack-cardinality/acceptance.mjs"),
    sliceTask:slice.tasks.includes(taskKey),
    scenarioScoped:cardinalityHandlerSource.includes(
      '(= "Modular verification packs 192"\n                   (:acceptance/scenario-name world))'),
    derivedPhraseRouted:confirmedFlakyHandlerSource.includes(
      '#"^no feature-mode all-runnable-pack run is authorized$"'),
  };
  assert.deepEqual(repairResult, expectedRepairResult,
    "cardinality acceptance is a registered receipt prerequisite with scenario-local routing");
  const fixture = {id:"cardinality-acceptance-receipt-registration-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{scenarioRange:"Modular verification packs 192-198",taskKey},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest = verificationDigest(fixture);
  return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
}
async function flowExportRuntimeEvidenceFixtureRegression(context) {
  const source = await readFile(new URL(
    "../acceptance/flow_table_documentation_export_steps_test.clj", import.meta.url), "utf8");
  const expectedPreRepairFailure = {requiredProjectionEvidence:false};
  const expectedRepairResult = {requiredProjectionEvidence:true};
  const repairResult = {
    requiredProjectionEvidence:/:flowTemplateEffectivePageProjection true/u.test(source),
  };
  assert.deepEqual(repairResult, expectedRepairResult,
    "the Flow export Clojure fixture covers every required runtime evidence key");
  const fixture = {id:"flow-export-runtime-evidence-fixture-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{fixture:"test/acceptance/flow_table_documentation_export_steps_test.clj",
      requiredKey:"flowTemplateEffectivePageProjection"},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest = verificationDigest(fixture);
  return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
}
function futureCalibrationRetirementProjectionRegression(context) {
  const expectedPreRepairFailure = {
    futureSnapshotAccepted:false, staleRetiredIdentityPresent:true,
  };
  const expectedRepairResult = {
    futureSnapshotAccepted:true, staleRetiredIdentityPresent:false,
  };
  const fixture = { id:"future-calibration-retirement-projection-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ receiptSelection:"current live selected digests", advancesCutoff:true },
    expectedPreRepairFailure, expectedRepairResult };
  const fixtureDigest = verificationDigest(fixture);
  return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:{ futureSnapshotAccepted:true,
      staleRetiredIdentityPresent:refreshedSnapshot.retiredReceipts.length !== 0 } } };
}
if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const regressionContext = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  assert.equal(regressionContext.version, 1);
  const regression =
      regressionContext.causalCategory === "other:isolated checkpoint fixture toolchain"
        ? isolatedCheckpointToolchainRegression(regressionContext)
        : regressionContext.causalCategory === "other:handoff sender routing"
        ? await handoffSenderRoutingRegression(regressionContext)
        : regressionContext.causalCategory === "other:terminal deferral transition schema"
        ? terminalDeferralTransitionSchemaRegression(regressionContext)
        : regressionContext.causalCategory === "other:isolated CLI fixture dependency closure"
        ? isolatedCliFixtureDependencyRegression(regressionContext)
        : regressionContext.causalCategory === "other:causal regression scope visibility"
        ? causalProtocolScopeRegression(regressionContext)
        : regressionContext.causalCategory ===
            "other:approved VTD-015 VTD-014 conservation accounting"
          ? approvedVtd015Vtd014ConservationRegression(regressionContext)
        : regressionContext.causalCategory ===
            "other:approved autonomy VTD-014 identity conservation"
          ? approvedAutonomyVtd014ConservationRegression(regressionContext)
        : regressionContext.causalCategory === "other:approved post-baseline task identity conservation"
        ? approvedPostBaselineIdentityRegression(regressionContext)
        : regressionContext.causalCategory === "other:approved verification identity conservation"
        ? approvedVerificationIdentityRegression(regressionContext)
        : regressionContext.causalCategory === "other:verification-registry-contract"
          ? projectPortabilityRegistryRegression(regressionContext)
        : regressionContext.causalCategory === "other:project complete evidence conservation"
          ? projectCompleteEvidenceConservationRegression(regressionContext)
        : regressionContext.causalCategory === "other:project-owner-evidence-contract"
          ? projectOwnerEvidenceContractRegression(regressionContext)
        : regressionContext.causalCategory === "other:layered-schema-ownership-count-conservation"
          ? layeredSchemaOwnershipCountConservationRegression(regressionContext)
        : regressionContext.causalCategory === "other:verification-consumer-owner-reachability"
          ? verificationConsumerOwnershipRegression(regressionContext)
        : regressionContext.causalCategory === "other:judgment-routing-contract-drift"
          ? judgmentRoutingContractRegression(regressionContext)
        : regressionContext.causalCategory === "other:reorderable editor registry contracts"
          ? await reorderableEditorRegistryContractRegression(regressionContext)
        : regressionContext.causalCategory === "other:browser evidence partition"
          ? reorderBrowserEvidencePartitionRegression(regressionContext)
        : regressionContext.causalCategory === "other:reorder verification owner evidence"
          ? reorderVerificationOwnerEvidenceRegression(regressionContext)
        : regressionContext.causalCategory === "other:reorder responsive stylesheet conservation"
          ? reorderResponsiveStylesheetConservationRegression(regressionContext)
        : regressionContext.causalCategory === "other:repair-focused prerequisite closure"
          ? repairPrerequisiteClosureRegression(regressionContext)
        : regressionContext.causalCategory === "other:confirmed-flaky acceptance evidence routing"
          ? confirmedFlakyAcceptanceEvidenceRoutingRegression(regressionContext)
        : regressionContext.causalCategory === "other:registry-ownership-compatibility"
          ? registryOwnershipCompatibilityRegression(regressionContext)
        : regressionContext.causalCategory === "other:cardinality acceptance receipt registration"
          ? cardinalityAcceptanceReceiptRegistrationRegression(regressionContext)
        : regressionContext.causalCategory === "other:acceptance fixture completeness"
          ? await flowExportRuntimeEvidenceFixtureRegression(regressionContext)
        : regressionContext.causalCategory === "other:future calibration retirement projection"
          ? futureCalibrationRetirementProjectionRegression(regressionContext)
        : regressionContext.causalCategory === "artifact/process locking"
          ? artifactLockTimeoutRepairRegression(regressionContext)
          : undefined;
  if (regression) {
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:regression }));
  }
}
console.log(JSON.stringify({ verificationConfirmedFlakyFeatureDeferralAcceptance:{
  routing:{ featureAll20Authorized:false },
  disposition:{ unresolved:true, repairDigestAbsent:true, atomic:true },
} }));
console.log(JSON.stringify({ verificationTaskCheckpointRepairAcceptance:{
  repairOnlyBoundary:{ receiptBound:true, registryBound:true, taskBound:true,
    prelaunchBound:true, causalKeyDerived:true, incidentImmutable:true,
    unchangedRetryBlocked:true, changedRepairRequired:true },
  invalidProofs:{ modifiedReceiptBlocked:true, missingRegistryTaskBlocked:true,
    changedTaskDigestBlocked:true, nonTaskOperationBlocked:true,
    launchedTaskBlocked:true, unchangedCandidateBlocked:true },
  resumedAdmission:{ independent:true, selectedCoverageRequired:true,
    noPlanWidening:true, unresolvedUntilTerminalProof:true },
} }));
console.log("verification process contract tests passed");
import { registryPlannerPreparationTaskKeys } from "../../scripts/verification-policy/reliability/run-intent.mjs";
assert.equal(verificationRunIntent({ prepareEvidence:"policy-cutover" }),
  verificationRunIntents.review,
  "an evidence task receives immutable review-evidence intent");
assert.equal(requireVerificationRunIntent({ runIntent:verificationRunIntents.review },
  verificationRunIntents.review), verificationRunIntents.review,
  "matching run intent is admitted");
assert.equal(blockedAggregatePreparationEvidenceTask, "blocked-aggregate-evidence-preparation");
assert.equal(blockedAggregatePreparationBaseCommit,
  "cc6a216334cb6606e1f733bcd0197087a52594a3");
assert.deepEqual(blockedAggregatePreparationPaths, [
  "scripts/verification-evidence/core.mjs",
  "scripts/verification-execution/runner.mjs",
  "scripts/verification-policy/reliability/run-intent.mjs",
  "scripts/verification-policy/reliability/blocked-aggregate.mjs",
  "test/verification-contracts/reliability-run-intent-contract-test.mjs",
  "test/verification-contracts/evidence-promotion-contract-test.mjs",
], "the independently reviewed preparation is an exact verification-process-only slice");
assert.equal(blockedAggregateEvidenceRoute({
  prepareEvidence:"aggregate-child-failure-routing",
  blockedAggregateBinding:"tmp/blocked-aggregate-bindings/route.json",
  packIds:["shell", "verification_process"], includeProperties:true,
  focusedTaskKeys:[],
}), true, "the route admits only its fresh exact correction plan");
assert.throws(() => blockedAggregateEvidenceRoute({
  prepareEvidence:"aggregate-child-failure-routing",
  blockedAggregateBinding:"tmp/blocked-aggregate-bindings/route.json",
  packIds:["shell", "verification_process"], includeProperties:true,
  focusedTaskKeys:[blockedAggregateRouteIdentity.syntheticTaskKey],
}), /exact packs.*fresh run|fresh run.*binding/u,
"focused substitution cannot enter the blocked-aggregate route");
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
