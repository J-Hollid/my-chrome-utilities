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
const batchedReceiptResult = await exec("bb", ["-e", `
  (require '[acceptance.steps.support :as support])
  (let [receipt {"version" 2
                 "tasks" {"browser-observation:FIRST+SECOND"
                          {"identity" {"executable" "node"
                                       "args" ["scripts/run-browser-observation.mjs" "FIRST" "SECOND"]
                                       "logicalTargetIds" ["FIRST" "SECOND"]}
                           "status" "passed"
                           "output" "{\\\"first\\\":true}\\n{\\\"second\\\":true}\\n"}}}]
    (prn (support/verification-receipt-result
          receipt "browser-observation:SECOND"
          ["node" "scripts/run-browser-observation.mjs" "SECOND"])))
`]);
assert.match(batchedReceiptResult, /:exit 0/u,
  "acceptance consumers resolve a logical browser target from its passed batch receipt");
assert.match(batchedReceiptResult, /second/u,
  "a logical browser target receives the shared batch output containing its observation");
const targetScopedReceiptObservation = await exec("bb", ["-e", `
  (require '[acceptance.steps.support])
  (let [parse-payload (var-get (ns-resolve 'acceptance.steps.support 'browser-observation-payload))
        output (str "{\\\"workspace\\\":{\\\"fixture\\\":\\\"1:3\\\"}}\\n"
                    "{\\\"swarmforgeBrowserTargetResult\\\":{\\\"id\\\":\\\"FIRST\\\",\\\"status\\\":\\\"passed\\\"}}\\n"
                    "{\\\"workspace\\\":{\\\"fixture\\\":\\\"2:4\\\"}}\\n"
                    "{\\\"swarmforgeBrowserTargetResult\\\":{\\\"id\\\":\\\"SECOND\\\",\\\"status\\\":\\\"passed\\\"}}\\n"
                    "{\\\"unrelated\\\":true}\\n"
                    "{\\\"swarmforgeBrowserTargetResult\\\":{\\\"id\\\":\\\"THIRD\\\",\\\"status\\\":\\\"passed\\\"}}\\n"
                    "{\\\"workspace\\\":{\\\"fixture\\\":\\\"merged\\\"},\\\"third\\\":{\\\"passed\\\":true}}\\n")]
    (prn [(get-in (parse-payload output "FIRST" :workspace) [:workspace :fixture])
          (get-in (parse-payload output "SECOND" :workspace) [:workspace :fixture])
          (get-in (parse-payload output "THIRD" :third) [:third :passed])]))
`]);
assert.match(targetScopedReceiptObservation, /\["1:3" "2:4" true\]/u,
  "Clojure acceptance consumers ignore another target's pending document and recover the later merged fallback");
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
const vtd008BasePacks = JSON.parse(await exec("git", ["show", "0adee4fa84:verification/packs.json"]));
const vtd015Feature = "features/settled-candidate-final-verification.feature";
const vtd017Feature = "features/verification-shared-artifact-parallel-execution.feature";
const autonomyFeature = "features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature";
const documentationTemplateFeatures = [
  "features/data-layer-documentation-template-library.feature",
  "features/data-layer-documentation-template-library-runtime.feature",
  "features/data-layer-excel-documentation-templates.feature",
  "features/data-layer-excel-documentation-templates-runtime.feature",
  "features/data-layer-rich-page-documentation-templates.feature",
  "features/data-layer-rich-page-documentation-templates-runtime.feature",
];
const compactReorderableEditorFeatures = [
  "features/data-layer-compact-reorderable-editor-controls.feature",
  "features/data-layer-compact-reorderable-editor-controls-runtime.feature",
];
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
const reportRuntime = {
  node:process.versions.node,
  typescript:"5.9.3",
  platform:`${process.platform}-${process.arch}`,
};
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
const vtd009BaseCalibration = JSON.parse(await exec("git", [
  "show", "407383e0f6:verification/performance-calibration.json",
]));
const vtd009ShellCalibration = committedCalibrationReport.runnablePacks.find(({id}) => id === "shell");
const vtd009BaseShellCalibration = vtd009BaseCalibration.runnablePacks.find(({id}) => id === "shell");
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
import { registryPlannerPreparationTaskKeys } from "../../scripts/verification-policy/reliability/run-intent.mjs";
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
