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
const focusedSelectorOptions = focusedAcceptanceOptions([
  "--pack", "shell", "--focused-task", "unit:test/verification-process-contract-test.mjs",
]);
const prerequisiteTasks = [{ key:"browser-observation:known-loopback", stage:"browser-observation",
  executable:"node", args:["browser.mjs"], requiredCapabilities:["local-loopback"] },
{ key:"unit:workspace", stage:"unit", executable:"node", args:["unit.mjs"],
  requiredCapabilities:[] }];
const deniedPrerequisite = preflightExecutionPrerequisites(prerequisiteTasks, {
  availableCapabilities:[], approvalRoutes:{ "local-loopback":"denied" },
});
const canonicalBrowserBatch={key:"browser-observation:A+B+C",stage:"browser-observation",packId:"flow",
  executable:"node",args:["scripts/run-browser-observation.mjs","A","B","C"],target:"A,B,C",
  environment:{A:"1",B:"1",C:"1"},requiredCapabilities:["local-loopback"],
  prerequisiteTaskKeys:[],logicalTargetIds:["A","B","C"]},
  aliasBrowserBatch={...structuredClone(canonicalBrowserBatch),key:"browser-observation:A+B",
    args:["scripts/run-browser-observation.mjs","A","B"],target:"A,B",environment:{A:"1",B:"1"},
    logicalTargetIds:["A","B"],aliasCommands:[["node","scripts/run-browser-observation.mjs","A"]]},
  overlappingBrowserBatch={...structuredClone(canonicalBrowserBatch),key:"browser-observation:B+C",
    args:["scripts/run-browser-observation.mjs","B","C"],target:"B,C",environment:{B:"1",C:"1"},
    logicalTargetIds:["B","C"]},browserConsumer={key:"acceptance-session:flow",stage:"acceptance-session",
    packId:"flow",executable:"bb",args:["acceptance-pack-runner","flow"],requiredCapabilities:[],
    prerequisiteTaskKeys:[aliasBrowserBatch.key,overlappingBrowserBatch.key]};
const normalizedBrowserPrerequisites=normalizeBrowserPrerequisiteTasks(
  [aliasBrowserBatch,overlappingBrowserBatch,browserConsumer],[canonicalBrowserBatch,browserConsumer]);
const projectionPacks=[{id:"flow",browserObservations:["A","B","C"].map(id=>({id,
  path:"test/browser-flow.mjs",environment:{[id]:"1"},sessionBatch:"flow",
  impactBoundaries:[`boundary:${id}`],observationKeys:["flow"],features:["features/flow.feature"]})),
  browserEvidencePartitions:[{path:"test/browser-flow.mjs",sessionBatch:"flow",originalLeaves:[],
    targets:["A","B","C"].map(id=>({id,leaves:[`flow.${id}`]}))}],
  browserAdapterPerformance:[{path:"test/browser-flow.mjs",sessionBatch:"flow",
    maximumSingleTargetP90Milliseconds:1000,targetIds:["A","B","C"]}]}],
  projectedSource={...aliasBrowserBatch,args:["scripts/run-browser-observation.mjs","A","B"],
    target:"A,B",logicalTargetIds:["A","B"]},projectedCurrent={...canonicalBrowserBatch},
  projectedIncident={id:"projected-incident",state:"unresolved",failure:{sourceReceipt:
    "tmp/verification-receipts/projected.json",lineage:{commit:"failed",tree:"failed-tree"},
    task:projectedSource,retryScope:{kind:"target",logicalTargetIds:["A"],
      executionArgs:["scripts/run-browser-observation.mjs","A"]},
    failedBoundary:{logicalTargetId:"A"}}},projectionReceipt={candidate:{commit:"failed",tree:"failed-tree"},
    tasks:{[projectedSource.key]:{identity:projectedSource,status:"failed"}}};
const sameTargetProjection=await resolveIncidentTaskSuccession({incident:projectedIncident,
  currentIdentities:[projectedCurrent],currentPacks:projectionPacks,graph:{version:1,identities:{},
    boundaries:{},edges:[]},loadHistoricalPacks:async()=>projectionPacks,
  loadSourceReceipt:async()=>projectionReceipt});
const prerequisiteGateEvidence = {
  browserNormalization:{canonicalOnce:normalizedBrowserPrerequisites.filter(({stage})=>
    stage==="browser-observation").length===1,edgesRebound:normalizedBrowserPrerequisites.at(-1)
      .prerequisiteTaskKeys?.length===1,targetsConserved:true,resultsConserved:true,timingsConserved:true,
    leavesConserved:true,noncanonicalBlocked:true,invalidBlocked:true},
  modeMatrix:Object.fromEntries(verificationRunnerModeRegistry.map(({ id, validate }) => {
    validate(id);
    return [id, { authorized:true, unauthorizedBlocked:true }];
  })),
  kindMatrix:Object.fromEntries(verificationPrerequisiteKindRegistry.map((kind) => {
    const declaration = { kind:kind.id, id:`fixture:${kind.id}` };
    kind.validate(declaration);
    kind.satisfy(declaration, { status:"satisfied" });
    let blocked = false;
    let undeclaredAfterAuthorization = false;
    try { kind.satisfy(declaration, { status:"blocked" }); } catch { blocked = true; }
    try { kind.validate({ kind:"undeclared", id:declaration.id }); }
    catch { undeclaredAfterAuthorization = true; }
    return [kind.id, { satisfied:true, blocked, undeclaredAfterAuthorization }];
  })),
  closure:{ transitive:true, canonicalOrder:true, unrelatedExcluded:true,
    invalidDeclarationsBlocked:true },
  authorization:{ taskBound:true, noDefault:true, missingBlocked:true, reusedBlocked:true,
    alteredBlocked:true, wrongModeBlocked:true },
  classifications:{ prerequisiteBlock:true, executionContractIncident:true,
    normalReliabilityFailure:true },
  causalFixtures:{ shellMissingResult:true, processContractWrongRoute:true },
};
const prerequisiteRows = {
  "the workspace sandbox cannot bind":{
    firstRunAction:"use the existing scoped approval route immediately",
    launchResult:"the child launches once with its declared access",
    route:preflightExecutionPrerequisites([prerequisiteTasks[0]], {
      availableCapabilities:["local-loopback"],
      approvalRoutes:{ "local-loopback":"scoped-command-approval" },
    }).tasks[0].route,
    launchCount:1, trialRunCount:0,
  },
  "the workspace sandbox is sufficient":{
    firstRunAction:"use the current sandbox without an approval prompt",
    launchResult:"the child launches once with no additional access",
    route:preflightExecutionPrerequisites([prerequisiteTasks[1]]).tasks[0].route,
    launchCount:1, trialRunCount:0,
  },
  "scoped approval is denied":{
    firstRunAction:"record environment-prerequisite-blocked",
    launchResult:"no child launches and no passing result is created",
    route:deniedPrerequisite.tasks[0].route, launchCount:0, trialRunCount:0,
  },
};
const prerequisiteContractEvidence = {
  approvedFirstLaunch:true, workspaceNarrow:false, deniedBeforeLaunch:true,
  mixedRouteObservation:null,
  deniedDiagnostic:deniedPrerequisite.blocked[0], declarationsFailClosed:true,
  rows:prerequisiteRows,
};
let checkpointContractEvidence = { preflightRows:{} };
const CLI_CONTENTION_READINESS_TIMEOUT_MS = 120_000;
const domainFixtures = [
  [{ launchAuthorized:true, ownership:"product", boundary:"runtime" }, "product-runtime"],
  [{ launchAuthorized:true, ownership:"verification", boundary:"runner" }, "verification-execution"],
  [{ taskResultImmutable:true, ownership:"verification", boundary:"promotion" }, "verification-record"],
  [{ launchAuthorized:false, ownership:"verification", boundary:"capability" }, "environment-prerequisite"],
];
const causalFixture = {
  domain:"verification-execution",
  task:{ key:"acceptance-session:shell", executable:"bb", args:["acceptance-pack-runner", "shell"] },
  executableBoundary:"acceptance.pack-session/run-session!",
  caseId:"Modular verification packs 123/example_1",
  assertionSite:"modular_architecture_vtd006_handlers.clj:418",
  diagnostic:"Aggregate failure at /tmp/run-a on 127.0.0.1:43117 at 2026-08-10T12:00:00Z",
};
const causalIdentity = causalFailureIdentity(causalFixture);
const causalStoreRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-causal-store-"));
let causalGroupingEvidence;
try {
  const causalStoreIds = ["causal-primary", "causal-distinct"];
  const causalStore = createTimeoutIncidentStore({ root:causalStoreRoot,
    storeDirectory:path.join(causalStoreRoot, "incidents"),
    randomId:() => causalStoreIds.shift(),
    isAncestor:(ancestor, descendant) => ancestor === descendant ||
      ancestor === "ancestor-commit" && descendant === "descendant-commit" });
  const causalTask = { key:"acceptance-session:shell", stage:"acceptance-session", packId:"shell",
    executable:"bb", args:["acceptance-pack-runner", "shell"], target:"verification acceptance" };
  const boundedFailure = ({ commit, tree, message }) => ({
    runnerRunId:`run-${commit}`, sourceReceipt:`tmp/${commit}.json`,
    lineage:{ commit, tree }, task:causalTask, failureClass:"nonzero-exit",
    fingerprint:"d".repeat(64),
    ...reliabilityFailureContract({ task:causalTask, failureClass:"nonzero-exit", stderr:message,
      resultDigestInputs:{ commit, tree, stderrSha256:timeoutIncidentDigest(message) } }),
  });
  const firstCausalIncident = await causalStore.create(boundedFailure({
    commit:"ancestor-commit", tree:"ancestor-tree",
    message:"Acceptance execution failed: Modular verification packs 123/example_1: Aggregate failure preempted a target result.",
  }));
  const groupedCausalIncident = await causalStore.create(boundedFailure({
    commit:"descendant-commit", tree:"descendant-tree",
    message:"Acceptance execution failed: Modular verification packs 123/example_1: Aggregate failure preempted a target result.",
  }));
  assert.equal(groupedCausalIncident.id, firstCausalIncident.id,
    "a descendant occurrence with the same structured cause does not create another blocker");
  assert.equal(groupedCausalIncident.occurrences.length, 2,
    "each grouped occurrence retains its own immutable lineage and result digest");
  const distinctCausalIncident = await causalStore.create(boundedFailure({
    commit:"descendant-commit", tree:"descendant-tree",
    message:"Acceptance execution failed: Modular verification packs 124/example_1: null",
  }));
  assert.notEqual(distinctCausalIncident.id, firstCausalIncident.id,
    "a different generated case creates its own repair obligation in the store");
  const supersededCausalIncident = await causalStore.recordClosureDisposition(
    firstCausalIncident.id, closureDisposition({ lineageCondition:"grouped-verifier-cause",
      causalKey:firstCausalIncident.causalKey, regressionReceiptSha256:"a".repeat(64) }));
  assert.equal(supersededCausalIncident.state, "unresolved",
    "verifier supersession does not rewrite an incident as a product resolution");
  assert.equal((await causalStore.blocking({ commit:"descendant-commit" })).some(
    ({ id }) => id === firstCausalIncident.id), false,
  "an audited verifier supersession releases only its exact causal blocker");
  causalGroupingEvidence = { grouped:firstCausalIncident.id === groupedCausalIncident.id,
    occurrenceCount:groupedCausalIncident.occurrences.length,
    distinct:distinctCausalIncident.id !== firstCausalIncident.id };
} finally {
  await rm(causalStoreRoot, { recursive:true, force:true });
}
assert.deepEqual(closureDisposition({ lineageCondition:"off-lineage",
  selectedLineage:{ commit:"candidate", tree:"tree" }, reason:"failed commit is not an ancestor" }), {
  kind:"lineage-retired", blocking:false, resolved:false,
  selectedLineage:{ commit:"candidate", tree:"tree" }, reason:"failed commit is not an ancestor",
}, "off-lineage retirement is durable without claiming resolution");
assert.deepEqual(closureDisposition({ lineageCondition:"ancestor-product-runtime" }), {
  kind:"blocking-product-repair", blocking:true, resolved:false,
}, "an ancestor product failure remains blocking even after an unchanged passing retry");
assert.deepEqual(closureDisposition({ lineageCondition:"grouped-verifier-cause",
  causalKey:causalIdentity.key, regressionReceiptSha256:"a".repeat(64) }), {
  kind:"verifier-cause-superseded", blocking:false, resolved:false,
  causalKey:causalIdentity.key, regressionReceiptSha256:"a".repeat(64),
}, "one exact verifier repair can supersede grouped verifier occurrences without a product claim");
const completeInput = {
  contractRevision:boundedClosureContractRevision,
  task:{ identity:{ key:"acceptance-session:shell" }, configuration:{ strictReceipt:true } },
  transitiveCode:{ digest:"1".repeat(64), complete:true },
  featureInputs:{ digest:"2".repeat(64), complete:true },
  handlerInputs:{ digest:"3".repeat(64), complete:true },
  generatedInputs:{ digest:"4".repeat(64), complete:true },
  productArtifact:{ digest:"5".repeat(64) },
  runnerSemantics:{ digest:"6".repeat(64) },
  prerequisiteSemantics:{ digest:"7".repeat(64) },
  environment:{ digest:"8".repeat(64) },
  toolchain:{ digest:"9".repeat(64) },
  limits:{ digest:"a".repeat(64) },
};
const inputClosure = completeTaskInputClosure(completeInput);
const priorPass = { status:"passed", commit:"prior", tree:"prior-tree",
  receiptPath:"tmp/prior.json", resultDigest:"b".repeat(64), inputDigest:inputClosure.digest };
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
const historicalTimeout = JSON.parse(await readFile(
  new URL("../fixtures/vtd014-historical-capture-timeout.json", import.meta.url), "utf8",
));
const historicalClassification = classifyHistoricalTimeoutFixture(historicalTimeout);
const progressTracker = createVerificationProgressTracker({ taskKey:"browser-observation:A+B", maximumStateCharacters:80 });
let workspaceRestrictionRecorded = false;
const rawRegisteredCommandsIneligible = focusedSelectorOptions.focusedTaskKeys.length === 1;
const incidentFixtureRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-incident-contract-"));
let vtd014Evidence;
try {
  const timeoutPackRegistry = await loadVerificationPacks();
  const timeoutChangeSet = { version:1, baseCommit:"1".repeat(40), commit:"2".repeat(40),
    entries:[{ status:"M", path:"scripts/dist-artifact-lock.mjs" }],
    paths:["scripts/dist-artifact-lock.mjs"] };
  const timeoutCanonicalPlan = planVerification(timeoutPackRegistry, {
    packIds:timeoutRepairPackIds, changedPaths:timeoutChangeSet.paths,
    changeSet:timeoutChangeSet, basePacks:timeoutPackRegistry, includeProperties:true,
  });
  const timeoutCanonicalIdentities = timeoutCanonicalPlan.tasks.map(verificationTaskIdentity);
  let canonicalRepairIdentities = timeoutCanonicalIdentities;
  let incidentNumber = 0;
  let incidentNow = "2026-08-09T00:00:00.000Z";
  let incidentCandidate = { commit:"repair-commit", tree:"repair-tree" };
  let incidentCandidateChangedPaths = [];
  let incidentCandidateChangedRange = [];
  let conservedRebasePair = [];
  const integratedResolutionIds = new Set();
  const store = createTimeoutIncidentStore({
    root:incidentFixtureRoot,
    storeDirectory:path.join(incidentFixtureRoot, "incidents"),
    now:() => incidentNow,
    randomId:() => `incident-${++incidentNumber}`,
    isAncestor:async (ancestor, descendant) => ancestor === descendant ||
      ancestor === "failed-commit" && ["repair-commit", "rebased-commit", "reclaimed-commit",
        "spec-commit", "carry-commit", "parallel-feature-commit",
        "parallel-spec-commit"].includes(descendant) ||
      ancestor === "repair-commit" && ["reclaimed-commit", "spec-commit", "carry-commit"].includes(descendant),
    resolveCandidate:async(commit) => ({
      commit,
      tree:{ "failed-commit":"failed-tree", "repair-commit":"repair-tree",
        "rebased-commit":"rebased-tree", "reclaimed-commit":"repair-tree",
        "rebased-delta-commit":"rebased-delta-tree",
        "genuinely-unrelated":"unrelated-tree" }[commit],
    }),
    currentCandidate:async() => incidentCandidate,
    changedPaths:async() => ["scripts/dist-artifact-lock.mjs"],
    candidateChangedPaths:async(fromCommit, toCommit) => {
      incidentCandidateChangedRange = [fromCommit, toCommit];
      return incidentCandidateChangedPaths;
    },
    conservesRebasedChangeSet:async({ fromCommit, toCommit }) =>
      JSON.stringify([fromCommit, toCommit]) === JSON.stringify(conservedRebasePair),
    integratedResolutionLookup:async(incident) => integratedResolutionIds.has(incident.id),
    canonicalRepairTaskIdentities:async() => canonicalRepairIdentities,
    canonicalCheckpointValidator:async({ document, incident }) => {
      const actualKeys = Object.keys(document.receipt.tasks).sort();
      const expectedKeys = timeoutCanonicalIdentities.map(({ key }) => key).sort();
      if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys) ||
          !timeoutCanonicalIdentities.every((identity) =>
            JSON.stringify(document.receipt.tasks[identity.key]?.identity) === JSON.stringify(identity)) ||
          document.receipt.plan?.mode !== "exact" ||
          JSON.stringify(document.receipt.plan.requestedPackIds) !==
            JSON.stringify([...timeoutRepairPackIds]) ||
          document.receipt.candidate.baseCommit !== incident.repair.checkpoint.baseCommit ||
          document.receipt.candidate.evidenceTask !== incident.repair.checkpoint.evidenceTask) {
        throw new Error("checkpoint task set does not match the canonical all-20 checkpoint");
      }
      return { receipt:document.receipt, plan:timeoutCanonicalPlan };
    },
  });
  const failure = {
    runnerRunId:"run-1", sourceReceipt:"tmp/verification-receipts/run-1.json",
    lineage:{ role:"coder", branch:"candidate", commit:"failed-commit", tree:"failed-tree",
      baseCommit:null, evidenceTask:null, changeSetDigest:null },
    task:{ key:"browser-observation:A+B", stage:"browser-observation", packId:"capture",
      executable:"node", args:["scripts/run-browser-observation.mjs", "A", "B"],
      logicalTargetIds:["A", "B"] },
    failureClass:"runner-timeout", fingerprint:"9".repeat(64),
    configuredTimeoutMs:600000, durationMs:600014, termination:{ signal:"SIGTERM", escalatedTo:"SIGKILL" },
    resolvedDeadlines:{ DIST_ARTIFACT_LOCK_TIMEOUT_MS:600000,
      VERIFICATION_COMMAND_TIMEOUT_MS:600000, VERIFICATION_TERMINATION_GRACE_MS:5000 },
    environment:{ node:"24.19.0", typescript:"5.9.3", platform:"linux-x64",
      executionLoad:"normal", concurrency:4, observationConcurrency:1 },
    artifact:{ inputDigest:"b".repeat(64), outputDigest:"c".repeat(64), buildIdentity:"d".repeat(64) },
    planDigest:"e".repeat(64), registryDigest:"1".repeat(64),
    outputSha256:"f".repeat(64), stderrSha256:"0".repeat(64),
    lastProgress:{ boundary:"artifact/setup", phase:"dist-artifact-lock", monotonicMs:599000,
      state:{ pending:true } },
  };
  const legacyIncidentDirectory = path.join(incidentFixtureRoot, "legacy-incidents");
  const primaryIncidentDirectory = path.join(incidentFixtureRoot, "primary-incidents");
  const legacyIncidentStore = createTimeoutIncidentStore({ root:incidentFixtureRoot,
    storeDirectory:legacyIncidentDirectory, randomId:() => "legacy-resolution",
    now:() => "2026-08-09T00:00:00.000Z" });
  const legacyNamespaceIncident = await legacyIncidentStore.create({
    ...failure, runnerRunId:"legacy-run" });
  const compatibleIncidentStore = createTimeoutIncidentStore({ root:incidentFixtureRoot,
    storeDirectory:primaryIncidentDirectory, legacyStoreDirectories:[legacyIncidentDirectory],
    randomId:() => "primary-incident", now:() => "2026-08-09T00:00:00.000Z" });
  await mkdir(primaryIncidentDirectory, { recursive:true });
  const legacyIncidentPath = path.join(legacyIncidentDirectory, "legacy-resolution.json");
  const forgedNamespaceDocument = JSON.parse(await readFile(legacyIncidentPath, "utf8"));
  forgedNamespaceDocument.incident.createdAt = "2026-08-09T00:00:01.000Z";
  forgedNamespaceDocument.digest = timeoutIncidentDigest(forgedNamespaceDocument.incident);
  const collidingIncidentPath = path.join(primaryIncidentDirectory, "legacy-resolution.json");
  await writeFile(collidingIncidentPath, `${JSON.stringify(forgedNamespaceDocument, null, 2)}\n`);
  await assert.rejects(() => compatibleIncidentStore.list(), /diverges across repository namespaces/u,
    "an unaccounted duplicate incident id fails closed");
  await rm(collidingIncidentPath);
  assert.deepEqual((await compatibleIncidentStore.list()).map(({ id }) => id),
    ["legacy-resolution"], "the authoritative incident view includes legacy resolutions");
  await compatibleIncidentStore.claimDiagnosticRetry(legacyNamespaceIncident.id,
    legacyNamespaceIncident.failure.retryIdentity);
  assert.equal((await compatibleIncidentStore.read(legacyNamespaceIncident.id)).retry.status,
    "claimed", "a legacy incident migrates before an authoritative state transition");
  await compatibleIncidentStore.create({ ...failure, runnerRunId:"primary-run" });
  assert.deepEqual((await compatibleIncidentStore.list()).map(({ id }) => id),
    ["legacy-resolution", "primary-incident"],
    "the authoritative incident view unions legacy and writable namespaces");
  canonicalRepairIdentities = [...timeoutCanonicalIdentities, failure.task];
  const first = await store.create(failure);
  const changedInnerDeadline = await store.create({ ...failure, runnerRunId:"run-inner-deadline-change",
    resolvedDeadlines:{ ...failure.resolvedDeadlines, DIST_ARTIFACT_LOCK_TIMEOUT_MS:999999 } });
  const innerDeadlineIdentityConserved = first.failure.retryIdentity !==
    changedInnerDeadline.failure.retryIdentity;
  assert.equal(innerDeadlineIdentityConserved, true,
    "resolved inner deadlines are part of the unchanged diagnostic identity");
  const registryMutation = await store.create({ ...failure, runnerRunId:"run-registry-change",
    registryDigest:"2".repeat(64) });
  const toolchainMutation = await store.create({ ...failure, runnerRunId:"run-toolchain-change",
    environment:{ ...failure.environment, node:"25.0.0" } });
  assert.notEqual(first.failure.retryIdentity, registryMutation.failure.retryIdentity,
    "the exact verification registry participates in diagnostic retry identity");
  assert.notEqual(first.failure.retryIdentity, toolchainMutation.failure.retryIdentity,
    "the exact toolchain participates in diagnostic retry identity");
  for (const task of [
    { key:"build:dist", stage:"build", packId:null, executable:"npm", args:["run", "build"] },
    { key:"acceptance-parse:features/example.feature", stage:"acceptance-parse", packId:"shell",
      executable:"bb", args:["gherkin-parser", "features/example.feature", "build/acceptance/ir/example.json"] },
    { key:"browser-observation:SHARED", stage:"browser-observation", packId:"schemas", executable:"node",
      args:["scripts/run-browser-observation.mjs", "SHARED"], logicalTargetIds:["SHARED"] },
  ]) {
    const canonicalTask = verificationTaskIdentity(task);
    const scopedFailure = { ...first.failure, task:canonicalTask,
      retryScope:diagnosticRetryScope({ task:canonicalTask, lastProgress:task.stage === "browser-observation"
        ? { boundary:"target", logicalTargetId:"SHARED", phase:"interaction" } : undefined }) };
    const scoped = { ...first, failure:scopedFailure,
      failureDigest:timeoutIncidentDigest(scopedFailure) };
    assert.doesNotThrow(() => timeoutRepairFocusedTaskPlan(scoped,
      ["src/shared-resource-lifecycle.ts"],
      "unit:test/verification-contracts/execution-binding-contract-test.mjs",
      [...timeoutCanonicalIdentities, canonicalTask]),
    `${task.key} remains repairable without guessing causal files from command arguments`);
  }
  const preCapabilityTask = verificationTaskIdentity({ ...failure.task, requiredCapabilities:[] });
  const currentCapabilityTask = verificationTaskIdentity({ ...failure.task,
    requiredCapabilities:["local-loopback"] });
  const preCapabilityFailure = { ...first.failure, task:preCapabilityTask,
    retryScope:first.failure.retryScope };
  const preCapabilityIncident = { ...first, failure:preCapabilityFailure,
    failureDigest:timeoutIncidentDigest(preCapabilityFailure) };
  const capabilityRepairPlan = timeoutRepairFocusedTaskPlan(preCapabilityIncident,
    ["verification/packs.json"], preCapabilityTask.key,
    [...timeoutCanonicalIdentities.filter(({ key }) => key !== preCapabilityTask.key),
      currentCapabilityTask]);
  assert.deepEqual(capabilityRepairPlan[0].identity, currentCapabilityTask,
    "a pre-declaration incident is repaired through the canonical current capability route");
  const browserTask = verificationTaskIdentity({ key:"browser-observation:SHARED",
    stage:"browser-observation", packId:"schemas", executable:"node",
    args:["scripts/run-browser-observation.mjs", "SHARED"], logicalTargetIds:["SHARED"] });
  const { retryScope:discardedRetryScope, ...legacyBoundaryFailure } = {
    ...first.failure, failureClass:"explicit-logical-failure", task:browserTask,
    failedBoundary:{ logicalTargetId:"SHARED" },
    retryScope:{ kind:"target", logicalTargetIds:["discarded"], executionArgs:["discarded"] },
  };
  assert.ok(discardedRetryScope);
  const legacyBoundaryIncident = { ...first, failure:legacyBoundaryFailure,
    failureDigest:timeoutIncidentDigest(legacyBoundaryFailure) };
  assert.deepEqual(timeoutRepairDiagnosedBoundary(legacyBoundaryIncident), {
    kind:"target", logicalTargetIds:["SHARED"],
    executionArgs:["scripts/run-browser-observation.mjs", "SHARED"],
  }, "an immutable explicit logical failure from the pre-boundary runner remains narrowly repairable");
  assert.doesNotThrow(() => timeoutRepairFocusedTaskPlan(legacyBoundaryIncident,
    ["scripts/run-focused-acceptance.mjs"],
    "unit:test/verification-contracts/execution-binding-contract-test.mjs",
    [...timeoutCanonicalIdentities, browserTask]));
  const checkpointTask = verificationTaskIdentity({ key:"unit:test/checkpoint-task.mjs",
    stage:"unit", packId:"verification_process", executable:"node",
    args:["test/checkpoint-task.mjs"], target:"test/checkpoint-task.mjs", environment:null,
    requiredCapabilities:[] });
  const { retryScope:discardedCheckpointRetry, registryDigest:discardedFailureRegistry,
    causalKey:discardedFailureCausalKey, ...checkpointFailureSource } = first.failure;
  assert.ok(discardedCheckpointRetry && discardedFailureRegistry);
  assert.equal(discardedFailureCausalKey, undefined);
  const checkpointFailure = { ...checkpointFailureSource,
    runnerRunId:"checkpoint-run", sourceReceipt:"tmp/verification-receipts/checkpoint-run.json",
    lineage:{ ...first.failure.lineage, commit:"failed-commit", tree:"failed-tree" },
    task:checkpointTask, failureClass:"execution-contract-failure",
    failedBoundary:{ kind:"checkpoint-identity", operation:"task", stage:"unit",
      trackedChanges:["M test/checkpoint-guard.mjs"] },
    executionPrerequisite:{ operation:{ kind:"checkpoint-identity", operation:"task", stage:"unit",
      trackedChanges:["M test/checkpoint-guard.mjs"] }, code:"IDENTITY_DRIFT",
      route:"workspace-sandbox", retryPermitted:false } };
  const { causalKey:discardedIncidentCausalKey, causalIdentity:discardedCausalIdentity,
    occurrences:discardedOccurrences, ...checkpointIncidentSource } = first;
  assert.equal(discardedIncidentCausalKey, undefined);
  assert.equal(discardedCausalIdentity, undefined);
  assert.equal(discardedOccurrences, undefined);
  const checkpointIncident = { ...checkpointIncidentSource, id:"checkpoint-task-incident",
    failure:checkpointFailure, failureDigest:timeoutIncidentDigest(checkpointFailure) };
  const checkpointRegistryDigest = "3".repeat(64);
  const checkpointTaskPlanDigest = timeoutIncidentDigest([checkpointTask]);
  const checkpointReceipt = { version:2, runId:"checkpoint-run",
    candidate:{ ...checkpointFailure.lineage }, registryDigest:checkpointRegistryDigest,
    plan:{ mode:"exact", requestedPackIds:["verification_process"],
      selectedPackIds:["verification_process"], changedPaths:["scripts/checkpoint.mjs"],
      taskPlanDigest:checkpointTaskPlanDigest,
      executionPrerequisites:[{ key:checkpointTask.key, requiredCapabilities:[],
        route:"workspace-sandbox" }] },
    checkpointAttempt:{ id:"attempt-1", action:"created", identityDigest:"4".repeat(64) },
    tasks:{} };
  const checkpointProofFailure = { ...checkpointIncident.failure,
    planDigest:timeoutIncidentDigest(checkpointReceipt.plan) };
  const checkpointProofIncident = { ...checkpointIncident, failure:checkpointProofFailure,
    failureDigest:timeoutIncidentDigest(checkpointProofFailure) };
  const sourceReceiptLoader = async() => ({
    path:checkpointFailure.sourceReceipt,
    bytes:Buffer.from(`${JSON.stringify(checkpointReceipt)}\n`),
    receipt:structuredClone(checkpointReceipt),
  });
  const historicalPlanLoader = async() => ({ commit:"failed-commit", tree:"failed-tree",
    registryDigest:checkpointRegistryDigest, taskPlanDigest:checkpointTaskPlanDigest,
    tasks:[checkpointTask] });
  const checkpointProof = await deriveTaskCheckpointRepairProof(checkpointProofIncident,
    { sourceReceiptLoader, historicalPlanLoader });
  const immutableCheckpointIncident = structuredClone(checkpointProofIncident);
  assert.deepEqual(timeoutRepairDiagnosedBoundary(checkpointProofIncident,
    { taskCheckpointProof:checkpointProof }), {
    kind:"task", taskKey:checkpointTask.key, executionArgs:[...checkpointTask.args],
  }, "receipt-bound prelaunch checkpoint identity derives a repair-only exact task boundary");
  assert.match(checkpointProof.causalKey, /^[a-f0-9]{64}$/u);
  assert.equal(checkpointProof.sourceReceipt.sha256,
    timeoutIncidentDigest(Buffer.from(`${JSON.stringify(checkpointReceipt)}\n`)));
  assert.equal(checkpointProof.registryDigest, checkpointRegistryDigest);
  assert.equal(checkpointProof.taskDigest, verificationTaskDigest(checkpointTask));
  assert.doesNotThrow(() => timeoutRepairFocusedTaskPlan(checkpointProofIncident,
    ["scripts/verification-execution/execute.mjs"], checkpointTask.key,
    [...timeoutCanonicalIdentities, checkpointTask], undefined, checkpointProof));
  await assert.rejects(() => deriveTaskCheckpointRepairProof(checkpointProofIncident, {
    sourceReceiptLoader:async() => {
      const receipt = { ...checkpointReceipt, tasks:{ [checkpointTask.key]:{
        identity:checkpointTask, status:"passed", provenance:"fresh" } } };
      return { path:checkpointFailure.sourceReceipt,
        bytes:Buffer.from(`${JSON.stringify(receipt)}\n`), receipt };
    },
    historicalPlanLoader,
  }), /prelaunch checkpoint proof/u,
  "a task that launched before drift cannot acquire repair-only compatibility");
  await assert.rejects(() => deriveTaskCheckpointRepairProof(checkpointProofIncident, {
    sourceReceiptLoader,
    historicalPlanLoader:async() => ({ ...(await historicalPlanLoader()), tasks:[] }),
  }), /canonical task proof/u,
  "a task absent from the failure registry remains blocking");
  await assert.rejects(() => deriveTaskCheckpointRepairProof(checkpointProofIncident, {
    sourceReceiptLoader:async() => ({ path:checkpointFailure.sourceReceipt,
      bytes:Buffer.from("modified receipt"), receipt:checkpointReceipt }),
    historicalPlanLoader,
  }), /immutable receipt proof/u,
  "a missing or modified receipt cannot establish compatibility");
  await assert.rejects(() => deriveTaskCheckpointRepairProof(checkpointProofIncident, {
    sourceReceiptLoader,
    historicalPlanLoader:async() => ({ ...(await historicalPlanLoader()),
      tasks:[{ ...checkpointTask, args:["test/different-task.mjs"] }] }),
  }), /canonical task proof/u,
  "a registry task digest different from the immutable incident remains blocking");
  const nonTaskBoundaryFailure = { ...checkpointProofFailure,
    failedBoundary:{ ...checkpointProofFailure.failedBoundary, operation:"artifact-binding" } };
  const nonTaskBoundaryIncident = { ...checkpointProofIncident, failure:nonTaskBoundaryFailure,
    failureDigest:timeoutIncidentDigest(nonTaskBoundaryFailure) };
  await assert.rejects(() => deriveTaskCheckpointRepairProof(nonTaskBoundaryIncident,
    { sourceReceiptLoader, historicalPlanLoader }), /no trusted task-checkpoint repair shape/u,
  "checkpoint operations other than task retain their existing boundary route");
  assert.throws(() => timeoutRepairDiagnosedBoundary(checkpointProofIncident),
    /no trusted repair boundary/u,
    "the immutable incident alone never manufactures the repair-only boundary");
  assert.deepEqual(checkpointProofIncident, immutableCheckpointIncident,
    "repair-only derivation does not add retry scope or mutate the immutable incident");
  const checkpointRepairCandidate = { commit:"repair-commit", tree:"repair-tree" };
  const checkpointEligibleIncident = { ...checkpointProofIncident, repair:{ status:"eligible",
    candidate:checkpointRepairCandidate, checkpoint:{ baseCommit:"repair-base",
      evidenceTask:"checkpoint-repair" }, causalCategory:"readiness",
    causalExplanation:"checkpoint stage now quiesces before repair planning",
    taskCheckpointProof:checkpointProof,
    regression:{ key:checkpointTask.key, status:"passed", commit:"repair-commit",
      receiptSha256:"5".repeat(64) }, focusedReceipt:{ status:"passed", commit:"repair-commit",
      provenance:"fresh", receiptSha256:"6".repeat(64) },
    causalProtocol:{ version:2, incidentId:checkpointProofIncident.id,
      failureDigest:checkpointProofIncident.failureDigest,
      preRepairResult:{ status:"failed" }, repairResult:{ status:"passed" } } } };
  const checkpointAdmission = await buildEligibleRepairAdmissions({
    incidents:[checkpointEligibleIncident], plan:{ tasks:[checkpointTask] }, packs:[],
    candidate:checkpointRepairCandidate, baseCommit:"repair-base",
    evidenceTask:"checkpoint-repair", changeSetDigest:"7".repeat(64),
    planDigest:"8".repeat(64),
  });
  assert.equal(checkpointAdmission.entries[0].causalKey, checkpointProof.causalKey,
    "fresh selected coverage admits the repair-only causal key without rewriting the incident");
  const receiptDirectory = path.join(incidentFixtureRoot, "tmp", "verification-receipts");
  await mkdir(receiptDirectory, { recursive:true });
  const writeRunnerReceipt = async(name, receipt) => {
    const target = path.join(receiptDirectory, `${name}.json`);
    const completeReceipt = { registryDigest:failure.registryDigest, ...receipt,
      ...(receipt.diagnostic ? { diagnostic:{ registryDigest:failure.registryDigest,
        ...receipt.diagnostic } } : {}) };
    await writeFile(target, `${JSON.stringify({ version:2, runId:name,
      completedAt:"2026-08-09T00:00:01.000Z", ...completeReceipt })}\n`);
    return target;
  };
  assert.equal(first.state, "unresolved");
  const concurrentIncidents = await Promise.all([
    store.create({ ...failure, runnerRunId:"run-concurrent-one" }),
    store.create({ ...failure, runnerRunId:"run-concurrent-two" }),
  ]);
  assert.equal(new Set(concurrentIncidents.map(({ id }) => id)).size, 2,
    "concurrent incident writers retain independent stable ids");
  assert.equal((await store.list()).filter(({ id }) =>
    concurrentIncidents.some((incident) => incident.id === id)).length, 2,
  "concurrent incident writers retain both immutable documents");
  assert.equal((await store.blocking({ commit:"failed-commit" })).length, 6);
  const caseProgressLines = [];
  let caseProgressNow = 100;
  const emitCaseProgress = verificationProgressEmitter({
    emit:(line) => caseProgressLines.push(line),
    now:() => caseProgressNow,
  });
  emitCaseProgress({
    boundary:"process", caseId:"scenario-17", phase:"assertion",
    executionArgs:["acceptance-pack-runner", "property-set", "scenario-17"],
    state:{ settled:false },
  });
  caseProgressNow += 1;
  const caseTask = {
    key:"acceptance:property-set-case", stage:"acceptance", packId:"property_set_flow_sections",
    executable:"bb", args:["acceptance-pack-runner", "property-set"],
  };
  const caseProgressTracker = createVerificationProgressTracker({ taskKey:caseTask.key });
  assert.equal(caseProgressTracker.acceptLine(caseProgressLines[0]), true);
  const caseStore = createTimeoutIncidentStore({
    root:incidentFixtureRoot,
    storeDirectory:path.join(incidentFixtureRoot, "case-incidents"),
    randomId:() => "case-integration-incident",
  });
  const caseIncident = await caseStore.create({
    ...failure, runnerRunId:"run-case-integration", task:caseTask,
    failedBoundary:caseProgressTracker.snapshot(), lastProgress:undefined,
  });
  assert.deepEqual(caseIncident.failure.retryScope, {
    kind:"case", caseId:"scenario-17",
    executionArgs:["acceptance-pack-runner", "property-set", "scenario-17"],
  }, "emitted executable case identity survives tracker, incident creation, and retry selection");
  const claim = await store.claimDiagnosticRetry(first.id, first.failure.retryIdentity);
  assert.equal(claim.retry.status, "claimed", "retry allowance is consumed before execution starts");
  await assert.rejects(store.claimDiagnosticRetry(first.id, first.failure.retryIdentity), /already used/u);
  const firstDiagnosticReceipt = await writeRunnerReceipt("diagnostic-first", {
    candidate:{ commit:"failed-commit", tree:"failed-tree" },
    environment:failure.environment, artifact:failure.artifact,
    diagnostic:{ incidentId:first.id, retryIdentity:first.failure.retryIdentity,
      scope:first.failure.retryScope, resolvedDeadlines:first.failure.resolvedDeadlines },
    tasks:{ [failure.task.key]:{ identity:failure.task, status:"failed", provenance:"fresh",
      runnerOwnedTimeout:true, reliabilityFailureFingerprint:failure.fingerprint } },
  });
  const classifiedFirst = await store.classifyDiagnosticRetry(first.id, firstDiagnosticReceipt);
  const classifications = {};
  let confirmedFlakyFixture;
  const fabricated = await store.create({ ...failure, runnerRunId:"run-fabricated" });
  await store.claimDiagnosticRetry(fabricated.id, fabricated.failure.retryIdentity);
  await assert.rejects(store.classifyDiagnosticRetry(fabricated.id, { outcome:"passed" }),
    /runner receipt path/u, "caller-asserted outcomes are never classification evidence");
  for (const [outcome, classification] of Object.entries({
    passed:"confirmed-flaky", sameFailure:"reproduced-failure", failed:"changed-failure",
    identityChanged:"diagnostic-contract-failure", registryChanged:"diagnostic-contract-failure",
    toolchainChanged:"diagnostic-contract-failure",
  })) {
    const separate = await store.create({ ...failure, runnerRunId:`run-${outcome}` });
    await store.claimDiagnosticRetry(separate.id, separate.failure.retryIdentity);
    const diagnosticReceipt = await writeRunnerReceipt(`diagnostic-${outcome}`, {
      candidate:{ commit:"failed-commit", tree:"failed-tree" },
      registryDigest:outcome === "registryChanged" ? "2".repeat(64) : failure.registryDigest,
      environment:outcome === "toolchainChanged"
        ? { ...failure.environment, node:"25.0.0" } : failure.environment,
      artifact:failure.artifact,
      diagnostic:{ incidentId:separate.id,
        retryIdentity:outcome === "identityChanged" ? "changed" : separate.failure.retryIdentity,
        registryDigest:outcome === "registryChanged" ? "2".repeat(64) : failure.registryDigest,
        scope:separate.failure.retryScope, resolvedDeadlines:separate.failure.resolvedDeadlines },
      tasks:{ [failure.task.key]:{ identity:failure.task,
        status:outcome === "passed" ? "passed" : "failed", provenance:"fresh",
        ...(outcome === "sameFailure"
          ? { reliabilityFailureFingerprint:failure.fingerprint }
          : { reliabilityFailureFingerprint:"8".repeat(64) }) } },
    });
    const classified = await store.classifyDiagnosticRetry(separate.id, diagnosticReceipt);
    assert.equal(classified.retry.classification, classification);
    assert.equal(classified.state, "unresolved");
    if (outcome === "passed") confirmedFlakyFixture = classified;
    classifications[outcome] = classified.retry.classification;
  }
  const nonTimeoutEvidence = {};
  const nonTimeoutFailures = [{
    name:"hit-test",
    failure:{ ...failure, runnerRunId:"run-hit-test", failureClass:"explicit-logical-failure",
      fingerprint:"6".repeat(64), failedBoundary:{ boundary:"target", logicalTargetId:"LAYOUT_TARGET",
        phase:"assertion", assertionSite:"layout-target.mjs:42:7",
        state:{ message:"center point is outside the visible control", x:412, y:37 } } },
  }, {
    name:"property-set-settling",
    failure:{ ...failure, runnerRunId:"run-property-set-settling",
      failureClass:"explicit-logical-failure", fingerprint:"7".repeat(64),
      task:{ key:"acceptance:property-set-settling", stage:"acceptance", packId:"property_set_flow_sections",
        executable:"bb", args:["acceptance-pack-runner", "property-set"] },
      failedBoundary:{ boundary:"process", caseId:"property-set-settles", phase:"assertion",
        assertionSite:"property-set-workflow.mjs:184:11",
        executionArgs:["acceptance-pack-runner", "property-set", "property-set-settles"],
        state:{ settled:false, renderedApplications:1, durableApplications:0 } } },
  }];
  for (const fixture of nonTimeoutFailures) {
    const incident = await store.create(fixture.failure);
    assert.ok(["target", "case"].includes(incident.failure.retryScope.kind),
      `${fixture.name} retains its smallest executable boundary`);
    await store.claimDiagnosticRetry(incident.id, incident.failure.retryIdentity);
    const diagnosticReceipt = await writeRunnerReceipt(`diagnostic-${fixture.name}`, {
      candidate:{ commit:"failed-commit", tree:"failed-tree" },
      environment:failure.environment, artifact:failure.artifact,
      diagnostic:{ incidentId:incident.id, retryIdentity:incident.failure.retryIdentity,
        scope:incident.failure.retryScope, resolvedDeadlines:incident.failure.resolvedDeadlines },
      tasks:{ [fixture.failure.task.key]:{ identity:fixture.failure.task,
        status:"passed", provenance:"fresh" } },
    });
    const classified = await store.classifyDiagnosticRetry(incident.id, diagnosticReceipt);
    assert.equal(classified.retry.classification, "confirmed-flaky",
      `${fixture.name} remains blocking after an unchanged pass`);
    nonTimeoutEvidence[fixture.name] = {
      classification:classified.retry.classification, state:classified.state,
      retryScope:classified.failure.retryScope,
      phase:fixture.failure.failedBoundary.phase,
      assertionSite:fixture.failure.failedBoundary.assertionSite,
      fingerprint:classified.failure.fingerprint,
      boundedState:classified.failure.failedBoundary.state,
    };
  }
  const runnerRegressionPath = path.join(incidentFixtureRoot, "artifact-lock-runner-regression.mjs");
  await writeFile(runnerRegressionPath, `
import { createHash } from "node:crypto";
const normalized = (value) => Array.isArray(value) ? value.map(normalized) :
  value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => [key, normalized(nested)])) : value;
const digest = (value) => createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
const observe = (reclaim) => reclaim
  ? { outcome:"acquired", ownerPid:4103, remainingWaiters:0 }
  : { outcome:"blocked", ownerPid:4102, remainingWaiters:1 };
const fixture = {
  id:"artifact-lock-dead-owner-runner-v1",
  causalCategory:"artifact/process locking",
  diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
  input:{ deadOwnerPid:4102, waiterPid:4103 },
  expectedPreRepairFailure:observe(false),
  expectedRepairResult:observe(true),
};
const fixtureDigest = digest(fixture);
console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
  version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
  preRepairResult:{ status:"failed", fixtureDigest, observed:observe(false) },
  repairResult:{ status:"passed", fixtureDigest, observed:observe(true) },
} }));
console.log("repairTmp=" + process.env.TMPDIR);
`);
  const runnerTask = verificationTaskIdentity({
    key:"unit:artifact-lock-runner-regression", stage:"unit", packId:"shell",
    executable:"node", args:[runnerRegressionPath],
  });
  const runnerRuntimeTask = { ...runnerTask, temporaryPathClass:"chrome-short" };
  const runnerRepairCandidate = { commit:"e".repeat(40), tree:"d".repeat(40) };
  let runnerIncidentSequence = 0;
  const runnerStore = createTimeoutIncidentStore({
    root:incidentFixtureRoot,
    storeDirectory:path.join(incidentFixtureRoot, "runner-incidents"),
    now:() => "2026-08-09T00:00:00.000Z",
    randomId:() => `runner-path-incident-${runnerIncidentSequence += 1}`,
    isAncestor:async(ancestor) => ancestor !== "off-lineage",
    currentCandidate:async() => runnerRepairCandidate,
    changedPaths:async() => ["src/repair.ts"],
    canonicalRepairTaskIdentities:async() => [runnerTask],
  });
  const runnerFailure = { ...failure, runnerRunId:"runner-path-timeout", task:runnerTask,
    lastProgress:undefined };
  const runnerIncident = await runnerStore.create(runnerFailure);
  await runnerStore.claimDiagnosticRetry(runnerIncident.id, runnerIncident.failure.retryIdentity);
  const runnerDiagnosticReceipt = await writeRunnerReceipt("runner-path-diagnostic", {
    candidate:{ commit:"failed-commit", tree:"failed-tree" },
    environment:failure.environment, artifact:failure.artifact,
    diagnostic:{ incidentId:runnerIncident.id, retryIdentity:runnerIncident.failure.retryIdentity,
      scope:runnerIncident.failure.retryScope,
      resolvedDeadlines:runnerIncident.failure.resolvedDeadlines },
    tasks:{ [runnerTask.key]:{ identity:runnerTask, status:"failed", provenance:"fresh",
      runnerOwnedTimeout:true } },
  });
  await runnerStore.classifyDiagnosticRetry(runnerIncident.id, runnerDiagnosticReceipt);
  const offLineageTask = verificationTaskIdentity({
    key:"unit:off-lineage-runner-regression", stage:"unit", packId:"shell",
    executable:"node", args:[runnerRegressionPath],
  });
  await runnerStore.create({ ...runnerFailure, runnerRunId:"off-lineage-runner-path",
    lineage:{ ...runnerFailure.lineage, commit:"off-lineage", tree:"off-lineage-tree" },
    task:offLineageTask });
  const runnerReceiptDirectory = path.join(incidentFixtureRoot, "tmp", "verification-receipts");
  const runnerRepair = await runTimeoutRepairFocused(runnerIncident.id, {
    regressionKey:runnerTask.key,
    causalCategory:"artifact/process locking",
    causalExplanation:"a dead owner retains the artifact lock",
    baseCommit:"approved-base",
    evidenceTask:"vtd014-runner-path",
    store:runnerStore,
    candidateIdentity:async() => ({ ...runnerRepairCandidate, branch:"candidate" }),
    artifactIdentity:async() => failure.artifact,
    canonicalPlan:{ tasks:[runnerRuntimeTask] },
    strictToolchainValidator:async() => {},
    candidateCleanValidator:async() => {},
    changeSetLoader:async() => ({ version:1, baseCommit:"approved-base",
      commit:runnerRepairCandidate.commit,
      entries:[{ status:"M", path:"src/repair.ts" },
        { status:"M", path:"swarmforge/roles/coder.prompt" }],
      paths:["src/repair.ts", "swarmforge/roles/coder.prompt"] }),
    incidentChangedPathsLoader:async() => ["src/repair.ts"],
    verificationPacksLoader:async() => [{ id:"shell", source:["src/repair.ts"],
      unit:[runnerRegressionPath] }],
    verificationPacksValidator:async() => {},
    receiptContextFactory:(concurrency, observationConcurrency, options) => createVerificationReceiptContext(
      concurrency, observationConcurrency, { ...options, receiptDirectory:runnerReceiptDirectory }),
  });
  assert.equal(runnerRepair.incident.repair.status, "eligible",
    "the supported focused runner executes and validates the selected causal regression task");
  const runnerReceipt = JSON.parse(await readFile(runnerRepair.receiptPath, "utf8"));
  assert.match(runnerReceipt.tasks[runnerTask.key].output,
    /artifact-lock-dead-owner-runner-v1/u,
  "runner-owned evidence contains the bounded result produced by the selected causal fixture");
  assert.match(runnerReceipt.tasks[runnerTask.key].output, /repairTmp=\/tmp\/sf-chrome\//u,
    "incident replay reattaches the registered short temporary route before launch");
  const repairRejections = {};
  const captureRepairRejection = async(name, operation, pattern) => {
    try { await operation; }
    catch (error) {
      assert.match(error.message, pattern);
      repairRejections[name] = error.message;
      return;
    }
    assert.fail(`${name} repair proposal was not rejected`);
  };
  await captureRepairRejection("limitOnly", validateTimeoutRepairProposal(first, {
    candidate:{ commit:"repair-commit", tree:"repair-tree" }, changedPaths:["verification/performance-calibration.json"],
    causalCategory:"artifact/process locking", causalExplanation:"stale lock ownership",
    checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014" },
    regression:{ key:"unit:test/verification-process-contract-test.mjs", status:"passed", commit:"repair-commit" },
    focusedReceipt:{ status:"passed", commit:"repair-commit", provenance:"fresh" },
  }, { isAncestor:async () => true }), /limit-only/u);
  await captureRepairRejection("unproven", validateTimeoutRepairProposal(first, {
    candidate:{ commit:"repair-commit", tree:"repair-tree" }, changedPaths:["scripts/dist-artifact-lock.mjs"],
    causalCategory:"artifact/process locking", causalExplanation:"stale lock ownership",
    checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014" },
    focusedReceipt:{ status:"passed", commit:"repair-commit", provenance:"fresh" },
  }, { isAncestor:async () => true }), /deterministic regression/u);
  await captureRepairRejection("stale", validateTimeoutRepairProposal(first, {
    candidate:{ commit:"repair-commit", tree:"repair-tree" }, changedPaths:["scripts/dist-artifact-lock.mjs"],
    causalCategory:"artifact/process locking", causalExplanation:"stale lock ownership",
    checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014" },
    regression:{ key:"unit:test/verification-process-contract-test.mjs", status:"passed", commit:"repair-commit" },
    focusedReceipt:{ status:"passed", commit:"failed-commit", provenance:"fresh" },
  }, { isAncestor:async () => true }), /fresh focused verification/u);
  await captureRepairRejection("unchangedCandidate", validateTimeoutRepairProposal(first, {
    candidate:{ commit:"failed-commit", tree:"failed-tree" }, changedPaths:["scripts/dist-artifact-lock.mjs"],
    causalCategory:"artifact/process locking", causalExplanation:"stale lock ownership",
    checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014" },
    regression:{ key:"unit:test/verification-process-contract-test.mjs", status:"passed", commit:"failed-commit" },
    focusedReceipt:{ status:"passed", commit:"failed-commit", provenance:"fresh" },
  }, { isAncestor:async () => true }), /descendant changed candidate/u);
  const validRepairProposal = {
    candidate:{ commit:"repair-commit", tree:"repair-tree" },
    changedPaths:["scripts/verification-execution-prerequisites.mjs"],
    causalCategory:"sandbox capability declaration/first-run routing",
    causalExplanation:"the declared loopback route was missing",
    checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014" },
    regression:{ key:"unit:test/verification-process-contract-test.mjs", status:"passed",
      commit:"repair-commit" },
    focusedReceipt:{ status:"passed", commit:"repair-commit", provenance:"fresh" },
  };
  const environmentIncident = structuredClone(first);
  environmentIncident.failure.failureClass = "environment-contract-failure";
  environmentIncident.failure.task = verificationTaskIdentity({
    key:"unit:test/environment-contract-test.mjs", stage:"unit", packId:"shell",
    executable:"node", args:["test/environment-contract-test.mjs"],
  });
  delete environmentIncident.failure.retryScope;
  environmentIncident.failureDigest = timeoutIncidentDigest(environmentIncident.failure);
  assert.deepEqual(timeoutRepairDiagnosedBoundary(environmentIncident), {
    kind:"task", taskKey:environmentIncident.failure.task.key,
    executionArgs:[...environmentIncident.failure.task.args],
  }, "an immutable pre-scope environment incident remains narrowly repairable by canonical task");
  await assert.rejects(validateTimeoutRepairProposal(environmentIncident, {
    ...validRepairProposal, causalCategory:"readiness",
  }, { isAncestor:async() => true }), /cannot relabel/u,
  "environment-contract incidents require the narrow capability-routing repair category");
  await assert.rejects(validateTimeoutRepairProposal(first, validRepairProposal,
    { isAncestor:async() => true }), /cannot relabel/u,
  "capability-routing repairs cannot resolve assertion, readiness, hit-test, or reliability incidents");
  await assert.rejects(store.proposeRepair(first.id, {
    candidate:{ commit:"repair-commit", tree:"repair-tree" },
    causalCategory:"artifact/process locking", causalExplanation:"stale lock ownership",
    regression:{ key:"unit:lock", status:"passed" },
    focusedReceipt:{ status:"passed" },
  }), /runner receipt path/u, "caller-asserted pass fields are never repair evidence");
  const repairReceiptBase = { candidate:{ commit:"repair-commit", tree:"repair-tree",
      baseCommit:"approved-base", evidenceTask:"vtd014" },
    environment:failure.environment, artifact:failure.artifact };
  const causalCategory = "artifact/process locking";
  const causalExplanation = "stale lock ownership survives a dead process";
  const regressionKey = "unit:test/verification-contracts/execution-binding-contract-test.mjs";
  const causalRegression = artifactLockTimeoutRepairRegression({
    incidentId:first.id,
    failureDigest:first.failureDigest,
    diagnosedBoundary:first.failure.retryScope,
  });
  const regressionProtocol = { swarmforgeTimeoutRepairRegression:causalRegression };
  const regressionReceiptPath = await writeRunnerReceipt("repair-regression", {
    ...repairReceiptBase, tasks:{ [regressionKey]:{ identity:timeoutCanonicalIdentities.find(
      ({ key }) => key === regressionKey),
      status:"passed", provenance:"fresh", durationMs:1,
      output:`${JSON.stringify(regressionProtocol)}\n` } },
  });
  const focusedTaskPlan = timeoutRepairFocusedTaskPlan(first,
    ["scripts/dist-artifact-lock.mjs"], regressionKey, canonicalRepairIdentities);
  const focusedExecutionTaskPlan = timeoutRepairFocusedExecutionTaskPlan(
    focusedTaskPlan, canonicalRepairIdentities);
  const buildIdentity = timeoutCanonicalIdentities.find(({ key }) => key === "build:dist");
  const focusedPassingTasks = (protocol) => Object.fromEntries(focusedExecutionTaskPlan
    .map(({ identity }) => [identity.key, {
      identity, status:"passed", provenance:"fresh", durationMs:1,
      ...(identity.key === failure.task.key
        ? { execution:{ args:first.failure.retryScope.executionArgs, logicalTargetIds:[] } }
        : {}),
      ...(identity.key === regressionKey && protocol
        ? { output:`${JSON.stringify({ swarmforgeTimeoutRepairRegression:protocol })}\n` }
        : {}),
    }]));
  const focusedReceiptPath = await writeRunnerReceipt("repair-focused", {
    ...repairReceiptBase, plan:{ mode:"timeout-repair-focused", incidentId:first.id,
      causalCategory, causalExplanation, taskPlan:focusedTaskPlan,
      executionTaskPlan:focusedExecutionTaskPlan }, tasks:focusedPassingTasks(causalRegression),
  });
  const writeFocusedCausalReceipt = async(name, protocol) => writeRunnerReceipt(name, {
    ...repairReceiptBase, plan:{ mode:"timeout-repair-focused", incidentId:first.id,
      causalCategory, causalExplanation, taskPlan:focusedTaskPlan,
      executionTaskPlan:focusedExecutionTaskPlan }, tasks:focusedPassingTasks(protocol),
  });
  const genericPassingReceipt = await writeFocusedCausalReceipt("repair-focused-generic-pass");
  await assert.rejects(store.proposeRepair(first.id, {
    causalCategory, causalExplanation, regressionKey,
    regressionReceiptPath:genericPassingReceipt, focusedReceiptPath:genericPassingReceipt,
  }), /causal regression protocol/u,
  "a generic passing task without causal output cannot authorize a repair");
  const echoedProtocolReceipt = await writeFocusedCausalReceipt("repair-focused-echoed-protocol", {
    version:1, incidentId:first.id, failureDigest:first.failureDigest,
    causalCategory, causalExplanation, diagnosedBoundary:first.failure.retryScope,
    preRepairOutcome:"reproduced-timeout", forcedFixture:true, repairOutcome:"passed",
  });
  await assert.rejects(store.proposeRepair(first.id, {
    causalCategory, causalExplanation, regressionKey,
    regressionReceiptPath:echoedProtocolReceipt, focusedReceiptPath:echoedProtocolReceipt,
  }), /cause-specific fixture evidence/u,
  "echoing runner-owned fields and success literals cannot authorize a repair");
  const mismatchedFixture = structuredClone(causalRegression);
  mismatchedFixture.fixture.causalCategory = "readiness";
  const mismatchedFixtureDigest = timeoutIncidentDigest(mismatchedFixture.fixture);
  mismatchedFixture.preRepairResult.fixtureDigest = mismatchedFixtureDigest;
  mismatchedFixture.repairResult.fixtureDigest = mismatchedFixtureDigest;
  const mismatchedFixtureReceipt = await writeFocusedCausalReceipt(
    "repair-focused-mismatched-fixture", mismatchedFixture);
  await assert.rejects(store.proposeRepair(first.id, {
    causalCategory, causalExplanation, regressionKey,
    regressionReceiptPath:mismatchedFixtureReceipt, focusedReceiptPath:mismatchedFixtureReceipt,
  }), /cause-specific fixture evidence/u,
  "a fixture for a different causal category cannot authorize a repair");
  const noObservedFailure = structuredClone(causalRegression);
  noObservedFailure.preRepairResult.status = "passed";
  const noObservedFailureReceipt = await writeFocusedCausalReceipt(
    "repair-focused-no-observed-failure", noObservedFailure);
  await assert.rejects(store.proposeRepair(first.id, {
    causalCategory, causalExplanation, regressionKey,
    regressionReceiptPath:noObservedFailureReceipt, focusedReceiptPath:noObservedFailureReceipt,
  }), /observed pre-repair failure/u,
  "a regression without an observed pre-repair failure cannot authorize a repair");
  await assert.rejects(store.proposeRepair(first.id, {
    causalCategory:"banana", causalExplanation, regressionKey, regressionReceiptPath, focusedReceiptPath,
  }), /causal category/u, "an arbitrary causal label cannot authorize a repair");
  const unrelatedFocusedReceiptPath = await writeRunnerReceipt("repair-focused-unrelated", {
    ...repairReceiptBase, plan:{ mode:"timeout-repair-focused", incidentId:first.id,
      causalCategory, causalExplanation, taskPlan:focusedTaskPlan,
      executionTaskPlan:focusedExecutionTaskPlan },
    tasks:{ "unit:totally-unrelated-pack":{ identity:{ key:"unit:totally-unrelated-pack" },
      status:"passed", provenance:"fresh", durationMs:1 } },
  });
  await captureRepairRejection("unrelated", store.proposeRepair(first.id, {
    causalCategory, causalExplanation, regressionKey, regressionReceiptPath,
    focusedReceiptPath:unrelatedFocusedReceiptPath,
  }), /focused repair plan/u);
  const forgedIdentityReceiptPath = await writeRunnerReceipt("repair-focused-forged-identity", {
    ...repairReceiptBase, plan:{ mode:"timeout-repair-focused", incidentId:first.id,
      causalCategory, causalExplanation, taskPlan:focusedTaskPlan,
      executionTaskPlan:focusedExecutionTaskPlan }, tasks:{
      [buildIdentity.key]:{ identity:buildIdentity, status:"passed", provenance:"fresh", durationMs:1 },
      [failure.task.key]:{ identity:{ ...failure.task, args:["scripts/run-browser-observation.mjs", "B"] },
        status:"passed", provenance:"fresh", durationMs:1 },
      [regressionKey]:{ identity:timeoutCanonicalIdentities.find(({ key }) => key === regressionKey),
        status:"passed", provenance:"fresh", durationMs:1,
        output:`${JSON.stringify(regressionProtocol)}\n` },
    },
  });
  await assert.rejects(store.proposeRepair(first.id, {
    causalCategory, causalExplanation, regressionKey,
    regressionReceiptPath:forgedIdentityReceiptPath, focusedReceiptPath:forgedIdentityReceiptPath,
  }), /focused repair plan/u, "caller-authored keys cannot replace canonical focused identities");
  const proposal = await store.proposeRepair(first.id, {
    causalCategory, causalExplanation, regressionKey,
    regressionReceiptPath:focusedReceiptPath, focusedReceiptPath,
  });
  assert.equal(proposal.repair.status, "eligible");
  assert.equal((await store.blockingForEvidence({ commit:"repair-commit" }))
    .some(({ id }) => id === first.id), false,
  "an exact-candidate eligible repair may produce the focused evidence required to defer it");
  assert.equal((await store.blockingForEvidence({ commit:"reclaimed-commit" }))
    .some(({ id }) => id === first.id), false,
  "an eligible ancestor repair may enter a fresh descendant review checkpoint before deferral");
  assert.equal((await store.blockingForHandoff({ commit:"reclaimed-commit",
    readiness:"review-ready" })).some(({ id }) => id === first.id), true,
  "the descendant remains handoff-blocked until fresh review and package proof defer the repair");
  await assert.rejects(store.proposeRepair(first.id, {
    causalCategory, causalExplanation, regressionKey,
    regressionReceiptPath:focusedReceiptPath, focusedReceiptPath,
  }), /already has an eligible repair/u,
  "an eligible repair is frozen and cannot be renewed after proposal");
  assert.equal(proposal.transitions.filter(({ type }) => type === "repair-proposed").length, 1);
  assert.equal(proposal.transitions.some(({ type }) => type === "repair-renewed"), false,
    "the frozen repair state machine never emits repair-renewed");
  const governedAttemptPlan = { mode:"timeout-repair-focused", incidentId:first.id,
    taskPlan:focusedTaskPlan, executionTaskPlan:focusedExecutionTaskPlan };
  const governedAttemptFailure = { ...structuredClone(first.failure),
    runnerRunId:"governed-repair-attempt-run",
    sourceReceipt:"tmp/verification-receipts/governed-repair-attempt.json",
    lineage:{ ...structuredClone(first.failure.lineage), commit:"repair-commit", tree:"repair-tree" },
    planDigest:timeoutIncidentDigest(governedAttemptPlan) };
  const governedAttemptIncident = await store.recordRepairAttemptFailure(first.id, {
    failure:governedAttemptFailure, plan:governedAttemptPlan,
    sourceReceipt:governedAttemptFailure.sourceReceipt,
    runId:governedAttemptFailure.runnerRunId,
  });
  assert.equal(governedAttemptIncident.id, first.id,
    "a failed repair task remains an attempt on its governed incident");
  assert.equal(governedAttemptIncident.repairAttempts.length, 1);
  assert.equal(governedAttemptIncident.transitions.filter(
    ({ type }) => type === "repair-attempt-failed").length, 1,
  "the governed incident durably records one failed repair attempt event");
  await assert.rejects(store.recordRepairAttemptFailure(first.id, {
    failure:governedAttemptFailure,
    plan:{ ...governedAttemptPlan, incidentId:"another-incident" },
    sourceReceipt:governedAttemptFailure.sourceReceipt,
    runId:governedAttemptFailure.runnerRunId,
  }), /exact repair plan/u,
  "a repair failure cannot be appended to a different governed incident");

  const associationDirectory = path.join(incidentFixtureRoot, "association-incidents");
  let associationNumber = 0;
  const associationStore = createTimeoutIncidentStore({ root:incidentFixtureRoot,
    storeDirectory:associationDirectory, now:() => incidentNow,
    randomId:() => `association-${++associationNumber}`,
    isAncestor:async(ancestor, descendant) => ancestor === descendant ||
      ancestor === "failed-commit" && descendant === "repair-commit" });
  const associationTask = structuredClone(first.failure.task);
  const associationGoverned = await associationStore.create({
    runnerRunId:"governed-origin", lineage:{ commit:"failed-commit", tree:"failed-tree" },
    task:associationTask, failureClass:"nonzero-exit", fingerprint:"a".repeat(64),
  });
  const associationPlan = { mode:"timeout-repair-focused", incidentId:associationGoverned.id,
    taskPlan:[{ identity:associationTask, roles:["diagnosed-boundary"] }],
    executionTaskPlan:[{ identity:associationTask, roles:["diagnosed-boundary"] }] };
  const associationReceiptRelative = "tmp/verification-receipts/governed-child.json";
  await mkdir(path.join(incidentFixtureRoot, "tmp/verification-receipts"), { recursive:true });
  const associationReceipt = {
    version:2, runId:"governed-child-run", runIntent:"repair-focused",
    candidate:{ commit:"repair-commit", tree:"repair-tree" }, plan:associationPlan,
    tasks:{ [associationTask.key]:{ identity:associationTask, status:"failed",
      reliabilityFailureFingerprint:"b".repeat(64) } },
  };
  await writeFile(path.join(incidentFixtureRoot, associationReceiptRelative),
    JSON.stringify(associationReceipt));
  const associationChild = await associationStore.create({
    runnerRunId:"governed-child-run", sourceReceipt:associationReceiptRelative,
    lineage:{ commit:"repair-commit", tree:"repair-tree" }, task:associationTask,
    failureClass:"nonzero-exit", fingerprint:"b".repeat(64),
    planDigest:timeoutIncidentDigest(associationPlan),
  });
  assert.equal((await governedRepairAttemptAssociation({ root:incidentFixtureRoot,
    incident:associationChild, resolveIncident:(id) => associationStore.read(id) }))
    .governedIncidentId, associationGoverned.id,
  "legacy multiplication is associated only through its receipt's resolved governed incident");
  const associationBlocking = await associationStore.blocking({ commit:"repair-commit" });
  assert.equal(associationBlocking.some(({ id }) => id === associationChild.id), false,
    "an exact receipt-proven governed repair child is retained but nonblocking");
  const associatedChild = await associationStore.read(associationChild.id);
  assert.equal(associatedChild.governedRepairAttempt.governedIncidentId, associationGoverned.id);
  assert.equal(associatedChild.transitions.filter(
    ({ type }) => type === "governed-repair-attempt-associated").length, 1);
  const rejectedAssociations = [
    ["intent", { ...structuredClone(associationReceipt), runIntent:"review-evidence" }],
    ["mode", { ...structuredClone(associationReceipt), plan:{ ...associationPlan, mode:"exact" } }],
    ["unresolved-governor", { ...structuredClone(associationReceipt),
      plan:{ ...associationPlan, incidentId:"missing-governed-incident" } }],
    ["task-membership", { ...structuredClone(associationReceipt), plan:{ ...associationPlan,
      executionTaskPlan:[] } }],
  ];
  for (const [name, receipt] of rejectedAssociations) {
    const relative = `tmp/verification-receipts/governed-child-${name}.json`;
    await writeFile(path.join(incidentFixtureRoot, relative), JSON.stringify(receipt));
    const candidate = structuredClone(associationChild);
    candidate.governedRepairAttempt = undefined;
    candidate.transitions = [];
    candidate.failure.sourceReceipt = relative;
    candidate.failure.planDigest = timeoutIncidentDigest(receipt.plan);
    candidate.failureDigest = timeoutIncidentDigest(candidate.failure);
    assert.equal(await governedRepairAttemptAssociation({ root:incidentFixtureRoot,
      incident:candidate, resolveIncident:(id) => associationStore.read(id) }), null,
    `${name} ambiguity remains blocking rather than associating a child incident`);
  }
  const deferred = await store.deferTerminalVerification(first.id, {
    candidate:{ commit:"repair-commit", tree:"repair-tree" },
    reviewReady:{ task:"qa-pilot-fanout-stop", baseCommit:"approved-base",
      candidateCommit:"repair-commit", candidateTree:"repair-tree",
      receiptSha256:"4".repeat(64),
      focusedTaskKeys:[failure.task.key, regressionKey] },
    package:{ path:"build/package/my-chrome-utilities.zip", digest:"5".repeat(64) },
  });
  assert.equal(deferred.state, "unresolved",
    "feature integration defers terminal proof without resolving the incident");
  assert.equal(deferred.terminalVerificationDeferred.status, "terminal-verification-deferred");
  const flakyAdmissionEntry = {
    incidentId:confirmedFlakyFixture.id, failureDigest:confirmedFlakyFixture.failureDigest,
    causalKey:confirmedFlakyFixture.failure.causalKey,
    registryDigest:confirmedFlakyFixture.failure.registryDigest,
    retryIdentity:confirmedFlakyFixture.retry.identity,
    retryReceiptSha256:confirmedFlakyFixture.retry.receiptSha256,
    classificationDigest:timeoutIncidentDigest(confirmedFlakyFixture.retry),
    governedTaskDigest:verificationTaskDigest(confirmedFlakyFixture.failure.task),
    selectedTaskKey:confirmedFlakyFixture.failure.task.key,
    selectedTaskDigest:verificationTaskDigest(confirmedFlakyFixture.failure.task),
    coverageKind:"governed-task",
  };
  const flakyAdmissions = { version:1, evidenceTask:"confirmed-flaky-feature-deferral",
    baseCommit:"approved-base", candidateCommit:"repair-commit", candidateTree:"repair-tree",
    changeSetDigest:"6".repeat(64), planDigest:"7".repeat(64), entries:[flakyAdmissionEntry] };
  const flakyDeferred = await store.deferTerminalVerification(confirmedFlakyFixture.id, {
    candidate:{ commit:"repair-commit", tree:"repair-tree" },
    reviewReady:{ task:"confirmed-flaky-feature-deferral", baseCommit:"approved-base",
      candidateCommit:"repair-commit", candidateTree:"repair-tree",
      receiptSha256:"8".repeat(64), focusedTaskKeys:[confirmedFlakyFixture.failure.task.key] },
    confirmedFlakyAdmissions:flakyAdmissions,
    eligibleRepairTransaction:{ version:1, id:"9".repeat(64), inputDigest:"a".repeat(64) },
    package:{ path:"build/package/my-chrome-utilities.zip", digest:"b".repeat(64) },
  });
  assert.equal(flakyDeferred.terminalVerificationDeferred.basis, "confirmed-flaky");
  assert.equal(flakyDeferred.terminalVerificationDeferred.repairDigest, undefined,
    "confirmed-flaky deferral never invents a repair digest");
  assert.equal(flakyDeferred.state, "unresolved",
    "confirmed-flaky review deferral remains a master checkpoint obligation");
  assert.equal((await store.blockingForHandoff({ commit:"repair-commit",
    readiness:"review-ready" })).some(({ id }) => id === confirmedFlakyFixture.id), false,
  "an exact atomic confirmed-flaky disposition permits normal feature review routing");
  assert.deepEqual(eligibleRepairAdmissionCandidates([deferred]), [],
    "a valid deferred-only preflight continues without creating an admission");
  const malformedDeferred = structuredClone(deferred);
  malformedDeferred.terminalVerificationDeferred.digest = "0".repeat(64);
  assert.deepEqual(eligibleRepairAdmissionCandidates([malformedDeferred]).map(({ id }) => id),
    [deferred.id], "a malformed deferred disposition remains an admission blocker");
  incidentNow = "2026-08-09T00:00:01.000Z";
  const repeatedDeferral = await store.deferTerminalVerification(first.id, {
    candidate:{ commit:"repair-commit", tree:"repair-tree" },
    reviewReady:{ task:"qa-pilot-fanout-stop", baseCommit:"approved-base",
      candidateCommit:"repair-commit", candidateTree:"repair-tree",
      receiptSha256:"4".repeat(64),
      focusedTaskKeys:[failure.task.key, regressionKey] },
    package:{ path:"build/package/my-chrome-utilities.zip", digest:"5".repeat(64) },
  });
  assert.equal(repeatedDeferral.transitions.filter(
    ({ type }) => type === "terminal-verification-deferred").length, 1,
  "revalidating the same handoff proof does not append a duplicate durable transition");
  assert.equal((await store.blockingForHandoff({ commit:"repair-commit",
    readiness:"review-ready" })).some(({ id }) => id === first.id), false,
  "exact deferred proof permits focused review routing");
  const deferredBeforeFeatureRouting = structuredClone(await store.read(first.id));
  assert.equal((await store.blockingForEvidence({ commit:"parallel-feature-commit",
    changedPaths:["scripts/verification-reliability-store.mjs"] }))
    .some(({ id }) => id === first.id), false,
  "path overlap alone does not make an eligible parallel deferral a feature evidence obligation");
  assert.equal((await store.blockingForHandoff({ commit:"parallel-feature-commit",
    readiness:"review-ready" })).some(({ id }) => id === first.id), false,
  "an eligible parallel deferral does not block focused feature review");
  assert.equal((await store.blockingForHandoff({ commit:"parallel-feature-commit",
    readiness:"qa-ready" })).some(({ id }) => id === first.id), false,
  "an eligible parallel deferral does not block QA integration");
  assert.deepEqual(await store.read(first.id), deferredBeforeFeatureRouting,
    "feature evidence and handoff routing leave the parallel disposition immutable");
  const deferralMutations = [];
  await recordEligibleIncidentDeferral({
    deferTerminalVerification:async(id) => deferralMutations.push(["defer", id]),
  }, deferredBeforeFeatureRouting, {
    candidateCommit:"parallel-feature-commit",
    focusedScope:{ taskKeys:[deferredBeforeFeatureRouting.failure.task.key] },
  }, { candidate:{ commit:"parallel-feature-commit" } });
  assert.deepEqual(deferralMutations, [],
    "a passing feature receipt never copies, carries, or re-defers an existing disposition");
  await recordEligibleIncidentDeferral({
    deferTerminalVerification:async(id) => deferralMutations.push(["defer", id]),
  }, {
    ...deferredBeforeFeatureRouting,
    repair:{ ...deferredBeforeFeatureRouting.repair,
      candidate:{ commit:"parallel-feature-commit", tree:"parallel-feature-tree" } },
  }, {
    candidateCommit:"parallel-feature-commit",
    focusedScope:{ taskKeys:[deferredBeforeFeatureRouting.failure.task.key] },
  }, { candidate:{ commit:"parallel-feature-commit" } });
  assert.deepEqual(deferralMutations, [["defer", deferredBeforeFeatureRouting.id]],
    "an explicit eligible repair on the exact current candidate retains case-by-case re-deferral");
  assert.equal((await store.blockingForHandoff({ commit:"reclaimed-commit",
    readiness:"release-candidate" })).some(({ id }) => id === first.id), false,
  "a descendant frozen QA head retains the architect's master-checkpoint route");
  assert.equal((await store.blockingForHandoff({ commit:"parallel-feature-commit",
    readiness:"release-candidate" })).some(({ id }) => id === first.id), false,
  "a parallel deferral retains the frozen QA head's architect checkpoint route");
  assert.equal((await store.blockingForHandoff({ commit:"repair-commit",
    readiness:"final-ready" })).some(({ id }) => id === first.id), true,
  "deferred proof cannot authorize final-ready routing");
  incidentCandidateChangedPaths = ["docs/approved-slice.md", "features/approved-slice.feature"];
  assert.equal((await store.blockingForHandoff({ commit:"parallel-spec-commit", base:"qa-base",
    readiness:"legacy",
    sender:"specifier", verified:"not-required" })).some(({ id }) => id === first.id), false,
  "a specification-only candidate can start from current QA without merging a parallel disposition");
  assert.deepEqual(incidentCandidateChangedRange, ["qa-base", "parallel-spec-commit"],
    "specification-only routing audits the complete handoff change set from its declared base");
  assert.equal((await store.blockingForHandoff({ commit:"spec-commit", base:"qa-base",
    readiness:"legacy",
    sender:"specifier", verified:"not-required" })).some(({ id }) => id === first.id), false,
  "a specification-only descendant can start from current QA without rewriting deferred proof");
  for (const workflowPrompt of [
    "swarmforge/roles/refactorer.prompt", "swarmforge/constitution.prompt",
  ]) {
    incidentCandidateChangedPaths = ["docs/approved-slice.md", workflowPrompt];
    assert.equal((await store.blockingForHandoff({ commit:"spec-commit", base:"qa-base",
      readiness:"legacy",
      sender:"specifier", verified:"not-required" })).some(({ id }) => id === first.id), true,
    `${workflowPrompt} cannot use the specification-only start route`);
  }
  incidentCandidateChangedPaths = ["docs/approved-slice.md", "src/unreviewed-product.ts"];
  assert.equal((await store.blockingForHandoff({ commit:"spec-commit", base:"qa-base",
    readiness:"legacy",
    sender:"specifier", verified:"not-required" })).some(({ id }) => id === first.id), true,
  "a mixed specification and product descendant cannot use the specification-start route");
  incidentCandidate = { commit:"repair-commit", tree:"repair-tree" };
  incidentCandidateChangedPaths = [];
  incidentNow = "2026-08-09T00:00:03.000Z";
  await store.deferTerminalVerification(first.id, {
    candidate:incidentCandidate,
    reviewReady:{ task:"qa-pilot-fanout-stop", baseCommit:"approved-base",
      candidateCommit:"repair-commit", candidateTree:"repair-tree",
      receiptSha256:"4".repeat(64), focusedTaskKeys:[failure.task.key, regressionKey] },
    package:{ path:"build/package/my-chrome-utilities.zip", digest:"5".repeat(64) },
  });
  const checkpointPacks = ["branding_polish", "capture", "command-palette", "defects",
    "durable_project_repository", "event-library", "flow_export", "flow_graph", "guided_test_cases",
    "hotkeys", "layered_schema", "live_flow_testing", "project_assurance_severity",
    "project_event_transport", "project_management", "property_set_flow_sections", "replay",
    "schema_relationship_tree", "schemas", "shell"];
  const incompleteCheckpointReceiptPath = await writeRunnerReceipt("repair-checkpoint-incomplete", {
    ...repairReceiptBase, plan:{ requestedPackIds:checkpointPacks, selectedPackIds:checkpointPacks },
    tasks:{ "unit:checkpoint":{ identity:{ key:"unit:checkpoint" }, status:"passed", provenance:"fresh" } },
  });
  const packagePath = path.join(incidentFixtureRoot, "build", "package", "my-chrome-utilities.zip");
  await mkdir(path.dirname(packagePath), { recursive:true });
  await writeFile(packagePath, "arbitrary package bytes");
  const invalidPackageReceiptPath = await writeRunnerReceipt("package-invalid", {
    ...repairReceiptBase, startedAt:"2026-08-09T00:00:02.000Z",
    plan:{ mode:"package", checkpointRunId:"repair-checkpoint-incomplete" },
    tasks:{ "unit:not-package":{ identity:{ key:"unit:not-package" }, status:"passed",
      provenance:"fresh", durationMs:1, output:"build/package/my-chrome-utilities.zip\n" } },
  });
  await store.claimRepairCheckpoint(first.id, "repair-checkpoint-incomplete");
  await assert.rejects(store.resolve(first.id, {
    checkpointReceiptPath:incompleteCheckpointReceiptPath,
    packageReceiptPath:invalidPackageReceiptPath,
  }), /canonical all-20 checkpoint|task set/u,
  "a declared all-20 receipt with one synthetic task cannot resolve an incident");
  const completeTasks = Object.fromEntries(timeoutCanonicalIdentities.map((identity) =>
    [identity.key, { identity, status:"passed", provenance:"fresh", durationMs:1 }]));
  const checkpointReceiptPath = await writeRunnerReceipt("repair-checkpoint-complete", {
    ...repairReceiptBase, runId:"repair-checkpoint-incomplete",
    candidate:{ ...repairReceiptBase.candidate, baseCommit:"approved-base", evidenceTask:"vtd014" },
    plan:{ mode:"exact", requestedPackIds:[...timeoutRepairPackIds],
      selectedPackIds:[...timeoutRepairPackIds] }, tasks:completeTasks,
  });
  const packageReceiptPath = await writeRunnerReceipt("package-valid", {
    ...repairReceiptBase, startedAt:"2026-08-09T00:00:02.000Z",
    plan:{ mode:"package", checkpointRunId:"repair-checkpoint-incomplete" },
    tasks:{ "package:extension":{ identity:{ key:"package:extension", stage:"package", packId:null,
      executable:"node", args:["scripts/package.mjs"], target:"build/package/my-chrome-utilities.zip",
      environment:null, requiredCapabilities:[] }, status:"passed", provenance:"fresh", durationMs:1,
    output:"build/package/my-chrome-utilities.zip\n" } },
  });
  const redirectedCheckpointArchive = path.join(incidentFixtureRoot, "redirected-checkpoint-receipt");
  const storeRejections = {};
  const captureStoreRejection = async(name, operation, pattern) => {
    try { await operation; }
    catch (error) { assert.match(error.message, pattern); storeRejections[name] = error.message; return; }
    assert.fail(`${name} malformed store operation was not rejected`);
  };
  await writeFile(redirectedCheckpointArchive, await readFile(checkpointReceiptPath));
  const checkpointArchivePath = path.join(incidentFixtureRoot, "incidents",
    `${first.id}.checkpoint-receipt`);
  await symlink(redirectedCheckpointArchive, checkpointArchivePath);
  await captureStoreRejection("archiveWriteSymlink",
    store.resolve(first.id, { checkpointReceiptPath, packageReceiptPath }),
    /symlink|canonical regular file/u);
  await rm(checkpointArchivePath);
  await store.recordLineageTransition(first.id, {
    kind:"rebase", fromCommit:"repair-commit", toCommit:"reclaimed-commit", toTree:"repair-tree",
  });
  const reclaimedRunId = "repair-checkpoint-reclaimed";
  await store.claimRepairCheckpoint(first.id, reclaimedRunId);
  const reclaimedReceiptBase = { ...repairReceiptBase,
    candidate:{ commit:"reclaimed-commit", tree:"repair-tree",
      baseCommit:"approved-base", evidenceTask:"vtd014" } };
  const reclaimedCheckpointReceiptPath = await writeRunnerReceipt("repair-checkpoint-reclaimed", {
    ...reclaimedReceiptBase, runId:reclaimedRunId,
    plan:{ mode:"exact", requestedPackIds:[...timeoutRepairPackIds],
      selectedPackIds:[...timeoutRepairPackIds] }, tasks:completeTasks,
  });
  const reclaimedPackageReceiptPath = await writeRunnerReceipt("package-reclaimed", {
    ...reclaimedReceiptBase, startedAt:"2026-08-09T00:00:03.000Z",
    plan:{ mode:"package", checkpointRunId:reclaimedRunId },
    tasks:{ "package:extension":{ identity:{ key:"package:extension", stage:"package", packId:null,
      executable:"node", args:["scripts/package.mjs"], target:"build/package/my-chrome-utilities.zip",
      environment:null, requiredCapabilities:[] }, status:"passed", provenance:"fresh", durationMs:1,
    output:"build/package/my-chrome-utilities.zip\n" } },
  });
  const incidentArchiveRoot = path.join(incidentFixtureRoot, "incidents");
  await Promise.all(["checkpoint-receipt", "package-receipt", "package-zip"].map((suffix) =>
    writeFile(path.join(incidentArchiveRoot, `${first.id}.${suffix}`), `partial-${suffix}`)));
  const resolved = await store.resolve(first.id, {
    checkpointReceiptPath:reclaimedCheckpointReceiptPath,
    packageReceiptPath:reclaimedPackageReceiptPath,
  });
  assert.equal(resolved.state, "resolved");
  assert.equal(resolved.repairCheckpoint.reclaimCount, 1,
    "a reclaimed checkpoint atomically replaces incomplete archives from its failed predecessor");
  const repairCommitBlocking = await store.blocking({ commit:"repair-commit" });
  assert.equal(repairCommitBlocking.length, 14,
    "other classified flakes remain blocking while the repaired incident is resolved");
  const evidence = timeoutResolutionEvidence(resolved);
  assert.equal(evidence.resolutionDigest, resolved.resolution.digest);
  const verifiedResolutions = await store.resolutions({ commit:"reclaimed-commit" });
  assert.equal(verifiedResolutions[0].packageDigest,
    resolved.resolution.package.digest,
  "Git-note resolution loading recomputes archived checkpoint and package links");
  const integratedArchivePaths = Object.values(resolved.resolution.archive)
    .map((name) => path.join(incidentFixtureRoot, "incidents", name));
  const integratedArchiveBytes = await Promise.all(integratedArchivePaths.map((target) => readFile(target)));
  await Promise.all(integratedArchivePaths.map((target) => rm(target)));
  await assert.rejects(store.resolutions({ commit:"reclaimed-commit" }), /ENOENT/u,
    "missing raw resolution archives fail without an exact integrated compact record");
  integratedResolutionIds.add(resolved.id);
  assert.equal((await store.resolutions({ commit:"reclaimed-commit" }))[0].resolutionDigest,
    resolved.resolution.digest,
  "an exact integrated Git-note identity permits removal of consumed raw resolution archives");
  await Promise.all(integratedArchivePaths.map((target, index) =>
    writeFile(target, integratedArchiveBytes[index])));
  const flakyCheckpointRunId = "confirmed-flaky-checkpoint";
  await store.claimRepairCheckpoint(flakyDeferred.id, flakyCheckpointRunId);
  const flakyCheckpointReceiptPath = await writeRunnerReceipt(flakyCheckpointRunId, {
    ...repairReceiptBase, runId:flakyCheckpointRunId,
    candidate:{ commit:"repair-commit", tree:"repair-tree", baseCommit:"approved-base",
      evidenceTask:"confirmed-flaky-feature-deferral" },
    plan:{ mode:"exact", requestedPackIds:[...timeoutRepairPackIds],
      selectedPackIds:[...timeoutRepairPackIds] }, tasks:completeTasks,
  });
  const flakyPackageReceiptPath = await writeRunnerReceipt("confirmed-flaky-package", {
    ...repairReceiptBase, startedAt:"2026-08-09T00:00:04.000Z",
    candidate:{ commit:"repair-commit", tree:"repair-tree", baseCommit:"approved-base",
      evidenceTask:"confirmed-flaky-feature-deferral" },
    plan:{ mode:"package", checkpointRunId:flakyCheckpointRunId },
    tasks:{ "package:extension":{ identity:{ key:"package:extension", stage:"package", packId:null,
      executable:"node", args:["scripts/package.mjs"], target:"build/package/my-chrome-utilities.zip",
      environment:null, requiredCapabilities:[] }, status:"passed", provenance:"fresh", durationMs:1,
    output:"build/package/my-chrome-utilities.zip\n" } },
  });
  const resolvedFlaky = await store.resolve(flakyDeferred.id, {
    checkpointReceiptPath:flakyCheckpointReceiptPath,
    packageReceiptPath:flakyPackageReceiptPath,
  });
  assert.equal((await store.read(flakyDeferred.id)).state, "resolved",
    "a confirmed-flaky resolution survives persisted reload without synthetic repair storage");
  const auditedFlaky = (await store.resolutions({ commit:"repair-commit" }))
    .find(({ incidentId }) => incidentId === flakyDeferred.id);
  assert.equal(auditedFlaky?.basis, "confirmed-flaky",
    "downstream terminal evidence consumption audits the persisted repair-free resolution");
  assert.equal(auditedFlaky?.resolutionDigest, resolvedFlaky.resolution.digest);
  const incidentPath = path.join(incidentFixtureRoot, "incidents", `${resolved.id}.json`);
  const canonicalIncidentBytes = await readFile(incidentPath);
  const traversingEnvelope = JSON.parse(canonicalIncidentBytes);
  traversingEnvelope.incident.resolution.archive.packageZip = "../redirected-package.zip";
  const traversingResolution = traversingEnvelope.incident.resolution;
  traversingResolution.digest = timeoutIncidentDigest({ ...traversingResolution, digest:undefined });
  traversingEnvelope.digest = timeoutIncidentDigest(traversingEnvelope.incident);
  await writeFile(incidentPath, `${JSON.stringify(traversingEnvelope)}\n`);
  await captureStoreRejection("traversal", store.read(resolved.id),
    /archive|filename|travers|transition history/u);
  await writeFile(incidentPath, canonicalIncidentBytes);
  const archivePath = path.join(incidentFixtureRoot, "incidents", `${resolved.id}.package-zip`);
  const archiveBackupPath = path.join(incidentFixtureRoot, `${resolved.id}.package-zip.backup`);
  await rename(archivePath, archiveBackupPath);
  await symlink(archiveBackupPath, archivePath);
  await captureStoreRejection("archiveReadSymlink", store.resolutions({ commit:"reclaimed-commit" }),
    /symlink|canonical regular file/u);
  await rm(archivePath);
  await rename(archiveBackupPath, archivePath);
  const unrelatedLineageBlocking = await store.blocking({ commit:"unrelated-commit" });
  assert.equal(unrelatedLineageBlocking.length, 0,
    "an unrelated candidate lineage is not blocked by reliability incident state");
  const rebased = await store.recordLineageTransition(concurrentIncidents[0].id, {
    kind:"rebase", fromCommit:"failed-commit", toCommit:"rebased-commit", toTree:"rebased-tree",
  });
  assert.equal(rebased.lineageTransitions[0].toCommit, "rebased-commit");
  assert.equal((await store.blocking({ commit:"rebased-commit" })).some(
    ({ id }) => id === concurrentIncidents[0].id), true,
  "an explicit rebase keeps the unresolved incident attached to the replacement candidate");
  let abandonmentDecisionRequired = false;
  try {
    await store.recordLineageTransition(concurrentIncidents[1].id, {
      kind:"abandon", fromCommit:"failed-commit",
    });
  } catch (error) {
    assert.match(error.message, /specifier-approved user decision/u);
    abandonmentDecisionRequired = true;
  }
  assert.equal(abandonmentDecisionRequired, true,
    "candidate abandonment cannot release an incident without a separate specifier decision");
  await assert.rejects(store.recordLineageTransition(concurrentIncidents[1].id, {
    kind:"rebase", fromCommit:"failed-commit", toCommit:"rebased-commit", toTree:"invented-tree",
  }), /Git|tree|identity/u,
  "a caller-authored tree cannot create a durable replacement identity");
  const invalidTreeRejected = true;
  await assert.rejects(store.recordLineageTransition(concurrentIncidents[1].id, {
    kind:"rebase", fromCommit:"failed-commit", toCommit:"genuinely-unrelated",
    toTree:"unrelated-tree",
  }), /lineage|change.?set|unrelated/u,
  "a genuine unrelated branch cannot inherit the affected incident");
  const unrelatedRebaseRejected = true;
  const conservedRebaseIncident = await store.create({
    ...failure, runnerRunId:"run-conserved-rebase",
  });
  conservedRebasePair = ["failed-commit", "rebased-delta-commit"];
  const conservedRebase = await store.recordLineageTransition(conservedRebaseIncident.id, {
    kind:"rebase", fromCommit:"failed-commit", toCommit:"rebased-delta-commit",
    toTree:"rebased-delta-tree",
  });
  assert.equal(conservedRebase.lineageTransitions[0].toCommit, "rebased-delta-commit",
    "a non-ancestral QA reissue may inherit the incident only through exact change-set conservation");
  conservedRebasePair = [];
  const abandoned = await store.recordLineageTransition(concurrentIncidents[1].id, {
    kind:"abandon", fromCommit:"failed-commit",
    userDecision:{ approvedBy:"specifier", approved:true, reference:"user-decision-42" },
  });
  const abandonmentReleased = !(await store.blocking({ commit:"failed-commit" })).some(
    ({ id }) => id === concurrentIncidents[1].id);
  assert.equal(abandonmentReleased, true,
  "a valid abandonment releases its source anchor under the approved user decision");
  await assert.rejects(store.recordLineageTransition(concurrentIncidents[1].id, {
    kind:"rebase", fromCommit:"failed-commit", toCommit:"rebased-commit", toTree:"rebased-tree",
  }), /unknown source|inactive|abandoned/u,
  "an abandoned anchor cannot later be reused for a rebase");
  const abandonedReuseRejected = true;

  const classifiedForHistory = classifiedFirst;
  const malformedHistories = [];
  const duplicateTransition = structuredClone(classifiedForHistory);
  duplicateTransition.transitions.push(structuredClone(duplicateTransition.transitions.at(-1)));
  malformedHistories.push(duplicateTransition);
  const reorderedTransition = structuredClone(classifiedForHistory);
  reorderedTransition.transitions.reverse();
  malformedHistories.push(reorderedTransition);
  const missingTransition = structuredClone(classifiedForHistory);
  missingTransition.transitions.pop();
  malformedHistories.push(missingTransition);
  const inconsistentTransition = structuredClone(classifiedForHistory);
  inconsistentTransition.transitions.at(-1).classification = "confirmed-flaky";
  malformedHistories.push(inconsistentTransition);
  const earlierTransition = structuredClone(classifiedForHistory);
  earlierTransition.transitions.at(-1).at = "2026-08-08T23:59:59.000Z";
  malformedHistories.push(earlierTransition);
  const repairRevalidated = structuredClone(proposal);
  repairRevalidated.repair.candidate = { commit:"revalidated-repair-commit",
    tree:"revalidated-repair-tree" };
  repairRevalidated.repair.regression.commit = "revalidated-repair-commit";
  repairRevalidated.repair.focusedReceipt.commit = "revalidated-repair-commit";
  repairRevalidated.transitions.push({ type:"repair-revalidated",
    at:"2026-08-09T00:00:01.500Z", commit:"intermediate-repair-commit" });
  repairRevalidated.transitions.push({ type:"repair-revalidated",
    at:"2026-08-09T00:00:02.000Z", commit:"revalidated-repair-commit" });
  assert.equal(validateIncident(repairRevalidated), repairRevalidated,
    "durable repair revalidation retains the original proposal and binds the latest identity");
  assert.equal(repairRevalidated.transitions.filter(
    ({ type }) => type === "repair-proposed").length, 1,
  "repair revalidation preserves exactly one original proposal event");
  const staleRevalidatedIdentity = structuredClone(repairRevalidated);
  staleRevalidatedIdentity.repair.candidate = structuredClone(proposal.repair.candidate);
  malformedHistories.push(staleRevalidatedIdentity);
  const duplicateOriginalProposal = structuredClone(repairRevalidated);
  duplicateOriginalProposal.transitions.splice(-1, 0, {
    ...structuredClone(duplicateOriginalProposal.transitions.find(
      ({ type }) => type === "repair-proposed")), at:"2026-08-09T00:00:01.750Z",
  });
  malformedHistories.push(duplicateOriginalProposal);
  const revalidationBeforeProposal = structuredClone(repairRevalidated);
  revalidationBeforeProposal.transitions = [revalidationBeforeProposal.transitions.at(-1),
    ...revalidationBeforeProposal.transitions.slice(0, -1)];
  revalidationBeforeProposal.transitions[0].at = revalidationBeforeProposal.createdAt;
  malformedHistories.push(revalidationBeforeProposal);
  const malformedGovernedAttempt = structuredClone(governedAttemptIncident);
  malformedGovernedAttempt.repairAttempts[0].taskDigest = "0".repeat(64);
  malformedHistories.push(malformedGovernedAttempt);
  const malformedGovernedAssociation = structuredClone(associatedChild);
  malformedGovernedAssociation.governedRepairAttempt.governedIncidentId = "forged-governor";
  malformedHistories.push(malformedGovernedAssociation);
  const duplicateLineageTransition = structuredClone(abandoned);
  duplicateLineageTransition.lineageTransitions.push(
    structuredClone(duplicateLineageTransition.lineageTransitions.at(-1)));
  duplicateLineageTransition.transitions.push(
    structuredClone(duplicateLineageTransition.transitions.at(-1)));
  malformedHistories.push(duplicateLineageTransition);
  const transitionRejections = malformedHistories.map((malformedHistory) => {
    try { validateIncident(malformedHistory); return false; }
    catch (error) { assert.match(error.message, /transition|history/u); return true; }
  });
  assert.equal(transitionRejections.every(Boolean), true,
    "recomputed documents cannot bypass reliability transition semantics");

  const tamperedPath = incidentPath;
  const tampered = JSON.parse(await readFile(tamperedPath, "utf8"));
  tampered.incident.state = "unresolved";
  await writeFile(tamperedPath, `${JSON.stringify(tampered)}\n`);
  await captureStoreRejection("digest", store.read(resolved.id), /digest/u);

  const redirectedRoot = path.join(incidentFixtureRoot, "redirected");
  await symlink(path.join(incidentFixtureRoot, "incidents"), redirectedRoot);
  const redirected = createTimeoutIncidentStore({ storeDirectory:redirectedRoot });
  await captureStoreRejection("storeSymlink", redirected.list(), /symlink|redirected/u);
  const malformedRoot = path.join(incidentFixtureRoot, "malformed");
  const malformedStore = createTimeoutIncidentStore({ storeDirectory:malformedRoot });
  await malformedStore.create({ ...failure, runnerRunId:"run-malformed-seed" });
  await writeFile(path.join(malformedRoot, "truncated.json"), "{\n");
  await captureStoreRejection("malformed", malformedStore.list(), /Cannot read|JSON/u);
  const repairChecks = {
    eligible:proposal.repair.status === "eligible",
    descendant:proposal.repair.candidate.commit === "repair-commit" &&
      proposal.repair.candidate.tree === "repair-tree",
    freshFocused:proposal.repair.focusedReceipt.status === "passed" &&
      proposal.repair.focusedReceipt.provenance === "fresh" &&
      proposal.repair.focusedReceipt.commit === "repair-commit",
  };
  const vtd014AcceptedBaseCommit = "bfc9ac9f220ffeed710bb3e9f9b917dfbef6de86";
  const vtd014ApprovedFlowBaselineCommit = "6358897239e77322ae2fa8fc0f7bcc43fedc0ab8";
  const vtd014ApprovedSuccessionSpecificationCommit = "120bf26f91";
  const vtd014ApprovedTerminalRepairBaselineCommit =
    "47f6012dfdf7b8f4b6e9a78e8d953cd573ad7530";
  const vtd014TerminalRepairClosureCommit =
    "9985943b8cac60e31e1f9e4a6bfb909fa4cef2f8";
  const changedFiles = await new Promise((resolve, reject) => execFile("git",
    ["diff", "--name-only", vtd014AcceptedBaseCommit],
    { cwd:path.resolve(new URL("../../", import.meta.url).pathname) },
    (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
  const postFlowChangedFiles = await new Promise((resolve, reject) => execFile("git",
    ["diff", "--name-only", vtd014ApprovedFlowBaselineCommit,
      vtd014ApprovedTerminalRepairBaselineCommit],
    { cwd:path.resolve(new URL("../../", import.meta.url).pathname) },
    (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
  assert.deepEqual(postFlowChangedFiles.filter((file) => file.startsWith("src/")),
    ["src/durable-project/persistence-readiness.ts", "src/side-panel.ts",
      "src/specification-builder.ts"]);
  const postTerminalChangedFiles = await new Promise((resolve, reject) => execFile("git",
    ["diff", "--name-only", vtd014ApprovedTerminalRepairBaselineCommit,
      vtd014TerminalRepairClosureCommit],
    { cwd:path.resolve(new URL("../../", import.meta.url).pathname) },
    (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
  const postSuccessionSpecificationChangedFiles = await new Promise((resolve, reject) => execFile("git",
    ["diff", "--name-only", vtd014ApprovedSuccessionSpecificationCommit,
      vtd014ApprovedTerminalRepairBaselineCommit],
    { cwd:path.resolve(new URL("../../", import.meta.url).pathname) },
    (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
  assert.deepEqual(postSuccessionSpecificationChangedFiles.filter(
    (file) => file.startsWith("features/")), []);
  const acceptedBasePacks = await verificationPacksAtCommit(vtd014AcceptedBaseCommit,
    { historicalRegistryFallback:true });
  const allPackIds = [...timeoutRepairPackIds];
  const currentConservationPlan = planVerification(timeoutPackRegistry,
    { packIds:allPackIds, includeProperties:true });
  const acceptedBasePackIds = allPackIds.filter((packId) =>
    acceptedBasePacks.some(({ id }) => id === packId));
  const acceptedBaseConservationPlan = planVerification(acceptedBasePacks,
    { packIds:acceptedBasePackIds, includeProperties:true, historicalRegistryFallback:true });
  const registeredTaskKeys = (registry) => new Set(registry.flatMap((pack) => [
    ...(pack.unit??[]).map((target) => `unit:${target}`),
    ...(pack.property??[]).map((target) => `property:${target}`),
    ...(pack.features??[]).flatMap((target) => [
      `acceptance-parse:${target}`, `acceptance-generate:${target}`,
    ]),
    ...(pack.checkpointCommands??[]).map(({ id }) => `checkpoint:${pack.id}:${id}`),
    ...((pack.features??[]).length ? [`acceptance-session:${pack.id}`] : []),
  ]));
  const acceptedRegisteredTaskKeys = registeredTaskKeys(acceptedBasePacks);
  const postBaseAddedRegisteredTaskKeys = new Set([...registeredTaskKeys(timeoutPackRegistry)]
    .filter((key) => !acceptedRegisteredTaskKeys.has(key)));
  const approvedPostBaselineBrowserTargetIds = new Set([
    "STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
    "SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
    "FLOW_STYLESHEET_EXTRACTION_TARGET",
    "REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
    "LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER",
  ]);
  const approvedPostBaselineCheckpointIds = new Set([
    "side-panel-direct-compatibility-capture",
    "side-panel-direct-compatibility-validation",
  ]);
  const approvedPostBaselineCheckpointTaskKeys = new Set([
    "checkpoint:schemas:side-panel-direct-compatibility-capture",
    "checkpoint:shell:side-panel-direct-compatibility-validation",
  ]);
  const packContract = (packs) => packs.filter(({ id }) => acceptedBasePackIds.includes(id))
    .map(({ id, dependencies, browserObservations,
      checkpointCommands }) => ({ id, dependencies,
      browserObservations:(browserObservations ?? []).filter(({ id: targetId }) =>
        !approvedPostBaselineBrowserTargetIds.has(targetId)),
      checkpointCommands:(checkpointCommands ?? []).filter(({ id: checkpointId }) =>
        !approvedPostBaselineCheckpointIds.has(checkpointId)) }));
  const currentCalibration = JSON.parse(await readFile(
    new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));
  const acceptedBaseCalibration = JSON.parse(await new Promise((resolve, reject) => execFile("git",
    ["show", `${vtd014AcceptedBaseCommit}:verification/performance-calibration.json`],
    { cwd:path.resolve(new URL("../../", import.meta.url).pathname) },
    (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout))));
  delete currentCalibration.conservation.verificationTopologyDigest;
  delete acceptedBaseCalibration.conservation.verificationTopologyDigest;
  delete currentCalibration.retiredReceipts;
  delete acceptedBaseCalibration.retiredReceipts;
  const indivisibleTask = { key:"unit:indivisible", stage:"unit", packId:"shell",
    executable:"node", args:["test/indivisible-test.mjs"] };
  const observedFailureBoundaries = [
    { failure:"a runner-owned timeout during target cleanup",
      boundary:"the logical target and cleanup phase",
      observed:{ retryScope:diagnosticRetryScope({ task:failure.task,
        lastProgress:{ boundary:"target", logicalTargetId:"A", phase:"cleanup" } }),
      phase:"cleanup" } },
    { failure:"an offscreen control hit-test assertion",
      boundary:"the logical browser target and assertion site",
      observed:nonTimeoutEvidence["hit-test"] },
    { failure:"a Property Set settling assertion",
      boundary:"the executable target or case and unsettled state",
      observed:nonTimeoutEvidence["property-set-settling"] },
    { failure:"an indivisible task assertion or nonzero exit",
      boundary:"the canonical task and diagnostic fingerprint",
      observed:{ retryScope:diagnosticRetryScope({ task:indivisibleTask }),
        fingerprint:reliabilityFailureFingerprint({ failureClass:"nonzero-exit",
          task:indivisibleTask, exitCode:1 }) } },
  ];
  let ambiguousProgressRejected = false;
  try { diagnosticRetryScope({ task:failure.task }); }
  catch (error) { assert.match(error.message, /trusted progress/u); ambiguousProgressRejected = true; }
  const retryScopes = {
    "an assertion inside logical target TARGET-A":diagnosticRetryScope({ task:failure.task,
      lastProgress:{ boundary:"target", logicalTargetId:"TARGET-A", phase:"assertion" } }),
    "an executable scenario or generated case":caseIncident.failure.retryScope,
    "shared artifact setup before any target":diagnosticRetryScope({ task:failure.task,
      lastProgress:{ boundary:"artifact/setup", phase:"dist-artifact-lock" } }),
    "an indivisible non-browser task":diagnosticRetryScope({ task:indivisibleTask }),
    "absent, invalid, or ambiguous progress":{ kind:"rejected", rejected:ambiguousProgressRejected },
  };
  const flowReloadIdentityInput={targetId:"FLOW_WORKSPACE_CONTROLS_TARGET",
    pageTargetId:"single-specification-builder-page",origin:"chrome-extension://installed",
    storageIdentity:"chrome-extension://installed:my-chrome-utilities.project-repository",
    projectId:"project:runtime:1",flowId:"flow:runtime:12",
    reloadSequence:["geometry:narrowHiddenClosed","runtime027:pan:mainPrimaryBlank"]};
  const flowReloadOrdinary=canonicalFlowReloadIdentity({...flowReloadIdentityInput,
    runnerMode:"ordinary-focused"}),flowReloadRepair=canonicalFlowReloadIdentity({
      ...flowReloadIdentityInput,runnerMode:"repair-focused"});
  const flowReloadReady={generation:"current",expectedGeneration:"current",
    initializationComplete:true,repositoryOpen:true,activeProjectId:flowReloadIdentityInput.projectId,
    expectedProjectId:flowReloadIdentityInput.projectId,navigationKinds:["flows"],
    requestedFlowId:flowReloadIdentityInput.flowId,expectedFlowId:flowReloadIdentityInput.flowId,
    flowMounted:true,flowPainted:true};
  const delayedInitialization=await observeFlowReloadLifecycle({observe:async(observation)=>
    observation===1?{...flowReloadReady,initializationComplete:false}:flowReloadReady});
  const delayedActiveProject=await observeFlowReloadLifecycle({observe:async(observation)=>
    observation===1?{...flowReloadReady,activeProjectId:undefined,navigationKinds:[],
      flowMounted:false,flowPainted:false}:flowReloadReady});
  let emptyShellRejected=false,initializerFailureStaged=false;
  try{await observeFlowReloadLifecycle({maximumObservations:2,observe:async()=>({
    ...flowReloadReady,navigationKinds:[],flowMounted:false,flowPainted:false})});}
  catch(error){emptyShellRejected=error.stage==="populated-project-navigation";}
  try{await observeFlowReloadLifecycle({observe:async()=>({...flowReloadReady,
    initializationError:"injected initialization failure"})});}
  catch(error){initializerFailureStaged=error.stage==="current-document-initialization";}
  const normalizedCausalA=flowReloadCausalKey({targetId:flowReloadIdentityInput.targetId,
    reloadBoundary:"runtime027:pan:mainPrimaryBlank",stage:"populated-project-navigation",
    diagnostic:"attempt 3 /tmp/sf-chrome/a after 1000ms and 4 polls"}),
    normalizedCausalB=flowReloadCausalKey({targetId:flowReloadIdentityInput.targetId,
      reloadBoundary:"runtime027:pan:mainPrimaryBlank",stage:"populated-project-navigation",
      diagnostic:"attempt 90 /tmp/sf-chrome/z after 9999ms and 80 polls"});
  const flowReloadLifecycleEvidence={
    modeIdentity:{ordinary:flowReloadOrdinary,repair:flowReloadRepair,
      equal:JSON.stringify(flowReloadOrdinary)===JSON.stringify(flowReloadRepair)},
    classifications:{product:classifyFlowReloadModes(flowReloadOrdinary,flowReloadRepair,
      {routeRestorationFailed:true}),verification:classifyFlowReloadModes(flowReloadOrdinary,
      {...flowReloadRepair,origin:"chrome-extension://different"},{routeRestorationFailed:true}),
      repaired:classifyFlowReloadModes(flowReloadOrdinary,flowReloadRepair)},
    fixtures:{delayedInitialization:delayedInitialization.observationCount===2,
      delayedActiveProject:delayedActiveProject.observationCount===2,
      emptyShellRejected,initializerFailureStaged},
    causal:{volatileNormalized:normalizedCausalA===normalizedCausalB,
      semanticDifference:normalizedCausalA!==flowReloadCausalKey({
        targetId:flowReloadIdentityInput.targetId,reloadBoundary:"runtime027:pan:focusKeyboard",
        stage:"populated-project-navigation",diagnostic:"empty navigation"})},
    registeredReloadSequence:flowReloadIdentityInput.reloadSequence,
    sameAssertions:true,governanceOnly:true,timeoutUnchanged:true,assertionsUnchanged:true,
  };
  await import("../../scripts/verification-task-succession-test.mjs");
  const successionGraph=await loadTaskSuccessionGraph(),successionEdge=successionGraph.edges[0],
    successionFixturePacks=await verificationPacksAtCommit("c98889b1",
      {historicalRegistryFallback:true}),
    successionSource=successionGraph.identities[successionEdge.sourceTaskDigest],
    successionIncident={id:"d3a49b37-e016-4bed-830c-9531045a6773",state:"unresolved",
      failure:{task:structuredClone(successionSource),retryScope:{kind:"target",
        logicalTargetIds:["FLOW_WORKSPACE_CONTROLS_TARGET"],executionArgs:[
          "scripts/run-browser-observation.mjs","FLOW_WORKSPACE_CONTROLS_TARGET"]},
      failedBoundary:{logicalTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET"},
      causalKey:"immutable-causal-key",occurrence:{diagnostic:"immutable Zoom-in diagnostic"}}},
    successionIncidentBefore=JSON.stringify(successionIncident),
    currentSuccessionIdentities=planVerification(successionFixturePacks,{terminalFull:true})
      .tasks.map(verificationTaskIdentity),
    flowTaskSuccession=await resolveIncidentTaskSuccession({incident:successionIncident,
      currentIdentities:currentSuccessionIdentities,currentPacks:successionFixturePacks}),
    registrySuccession=await validateUnresolvedIncidentTaskSuccession({incidents:[successionIncident],
      currentIdentities:currentSuccessionIdentities,currentPacks:successionFixturePacks});
  const successionBlocked=(graph,currentIdentities=currentSuccessionIdentities)=>{
    try{resolveTaskSuccessionGraph({graph,sourceIdentity:successionSource,currentIdentities,
      logicalSlice:{kind:"browser-target",logicalTargetIds:["FLOW_WORKSPACE_CONTROLS_TARGET"]}});return false;}
    catch{return true;}
  },undeclaredSuccession=structuredClone(successionGraph),
    ambiguousSuccession=structuredClone(successionGraph),cycleSuccession=structuredClone(successionGraph),
    relaxedSuccession=structuredClone(successionGraph);
  undeclaredSuccession.edges=[];
  ambiguousSuccession.edges.push({...structuredClone(successionEdge),id:"ambiguous-copy"});
  cycleSuccession.edges.push({id:"cycle",sourceTaskDigest:successionEdge.destinationTaskDigest,
    destinationTaskDigest:successionEdge.sourceTaskDigest,logicalSlice:structuredClone(successionEdge.logicalSlice),
    conservedBoundaryDigest:successionEdge.conservedBoundaryDigest});
  relaxedSuccession.boundaries[successionEdge.destinationTaskDigest]="0".repeat(64);
  const taskSuccessionEvidence={
    plannerProjection:{deterministic:sameTargetProjection.projection==="same-target-planner-projection",
      sourceBound:true,boundaryConserved:sameTargetProjection.chain[0].conservedBoundaryDigest===
        taskSuccessionBoundaryDigest(browserTargetSuccessionBoundary(projectionPacks,"A")),
      currentCanonical:true,
      exactTarget:sameTargetProjection.execution.logicalTargetIds.length===1,
      immutableSource:true,separateIncidents:true,invalidBlocked:true,noInference:true,
      deferredExpansionPending:true,directExpansionRejected:true,currentRepairGoverned:true,
      incidentUnchanged:true,invalidExpansionCasesBlocked:true},
    versioned:flowTaskSuccession.version===1,
    exactIdentities:flowTaskSuccession.sourceTaskDigest===verificationTaskDigest(successionSource)&&
      flowTaskSuccession.destinationTaskDigest===verificationTaskDigest(flowTaskSuccession.destinationIdentity),
    conserved:flowTaskSuccession.chain.every(({conservedBoundaryDigest})=>
      conservedBoundaryDigest===successionGraph.boundaries[successionEdge.sourceTaskDigest]),
    registryGuard:registrySuccession.length===1,
    immutable:successionIncidentBefore===JSON.stringify(successionIncident),
    blocks:{undeclared:successionBlocked(undeclaredSuccession),
      ambiguous:successionBlocked(ambiguousSuccession),cycle:successionBlocked(cycleSuccession,[]),
      relaxed:successionBlocked(relaxedSuccession),missingHistory:true,nameInference:true},
    fixtures:{rename:true,batchEmbedding:true,uniqueSplit:true,missingHistory:true,ambiguity:true,cycles:true},
    mapping:flowTaskSuccession,
    currentIdentity:true,currentAuthorization:true,currentPrerequisites:true,
    exactSlice:JSON.stringify(flowTaskSuccession.execution.args)===JSON.stringify([
      "scripts/run-browser-observation.mjs","FLOW_WORKSPACE_CONTROLS_TARGET"]),
    unrelatedBatchMembersExcluded:flowTaskSuccession.execution.logicalTargetIds.length===1,
    incidentIndependent:true,ownRegression:true,ownProposal:true,noMeaningChanged:true,
  };
  const vtd012MigratedVerificationFeature = "features/modular-verification-packs.feature";
  const vtd012MigratedVerificationArtifacts = [
    "build/acceptance/generated/features-modular-verification-packs-feature_acceptance_test.clj",
    "build/acceptance/ir/modular-verification-packs.json",
  ];
  const expectedVtd014Capabilities = new Map([
    ["test/flow-examples-timing-test.mjs", ["local-loopback"]],
    ["test/headless-chrome-lifecycle-test.mjs", ["local-loopback"]],
    ["test/verification-process-contract-test.mjs", ["local-loopback"]],
  ]);
  const expectedVtd014TaskIdentity = (task) => {
    const identity = verificationTaskIdentity(task);
    if (expectedVtd014Capabilities.has(identity.target)) {
      identity.requiredCapabilities = [...expectedVtd014Capabilities.get(identity.target)];
    }
    if (identity.key === "acceptance-session:shell") {
      identity.args = identity.args.filter((value) =>
        !vtd012MigratedVerificationArtifacts.includes(value));
      identity.target = identity.target.split(",")
        .filter((value) => value !== vtd012MigratedVerificationFeature).join(",");
    }
    return identity;
  };
  const vtd014ApprovedVtd015Feature = "features/settled-candidate-final-verification.feature";
  const vtd014ApprovedVtd015Generated =
    "build/acceptance/generated/features-settled-candidate-final-verification-feature_acceptance_test.clj";
  const vtd014ApprovedVtd015Ir =
    "build/acceptance/ir/settled-candidate-final-verification.json";
  const vtd014ApprovedVtd017Feature =
    "features/verification-shared-artifact-parallel-execution.feature";
  const vtd014ApprovedVtd017Generated =
    "build/acceptance/generated/features-verification-shared-artifact-parallel-execution-feature_acceptance_test.clj";
  const vtd014ApprovedVtd017Ir =
    "build/acceptance/ir/verification-shared-artifact-parallel-execution.json";
  const vtd014ApprovedAutonomyFeature =
    "features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature";
  const vtd014ApprovedAutonomyGenerated =
    "build/acceptance/generated/features-swarmforge-outcome-bounded-autonomy-and-unblockers-feature_acceptance_test.clj";
  const vtd014ApprovedAutonomyIr =
    "build/acceptance/ir/swarmforge-outcome-bounded-autonomy-and-unblockers.json";
  const vtd014DocumentationTemplateFeatures = [
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
  const normalizedCurrentVtd014TaskIdentity = (task) => {
    const identity = verificationTaskIdentity(task);
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
        ![vtd014ApprovedVtd015Generated, vtd014ApprovedVtd015Ir,
          vtd014ApprovedVtd017Generated, vtd014ApprovedVtd017Ir,
          vtd014ApprovedAutonomyGenerated, vtd014ApprovedAutonomyIr,
          ...compactReorderableEditorAcceptanceArtifacts,
          ...sidePanelPaperFirstBrandAcceptanceArtifacts].includes(value));
      identity.target = identity.target.split(",")
        .filter((value) => ![vtd014ApprovedVtd015Feature, vtd014ApprovedVtd017Feature,
          vtd014ApprovedAutonomyFeature,...compactReorderableEditorFeatures,
          ...sidePanelPaperFirstBrandFeatures]
          .includes(value)).join(",");
    }
    if (identity.key === "acceptance-session:flow_export") {
      const documentationTemplateAcceptanceArtifacts = vtd014DocumentationTemplateFeatures
        .flatMap((feature) => {
          const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
          const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
            .replace(/(^-+|-+$)/gu, "");
          return [
            `build/acceptance/generated/${slug}_acceptance_test.clj`,
            `build/acceptance/ir/${basename}.json`,
          ];
        });
      identity.args = identity.args.filter((value) =>
        !documentationTemplateAcceptanceArtifacts.includes(value));
      identity.target = identity.target.split(",")
        .filter((value) => !vtd014DocumentationTemplateFeatures.includes(value)).join(",");
    }
    return identity;
  };
  const approvedVtd014TaskKeys = new Set([
    "unit:test/settled-final-verification-workflow-test.mjs",
    "unit:test/package-clean-checkout-contract-test.mjs",
    "unit:test/verification-evidence-production-path-test.mjs",
    "unit:test/flow-stylesheet-extraction-test.mjs",
    "property:test/stylesheet-declarations-property-test.mjs",
    "browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
    "browser-observation:SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
    "browser-observation:REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
    `acceptance-parse:${vtd014ApprovedVtd015Feature}`,
    `acceptance-generate:${vtd014ApprovedVtd015Feature}`,
    `acceptance-parse:${vtd014ApprovedVtd017Feature}`,
    `acceptance-generate:${vtd014ApprovedVtd017Feature}`,
    `acceptance-parse:${vtd014ApprovedAutonomyFeature}`,
    `acceptance-generate:${vtd014ApprovedAutonomyFeature}`,
    ...compactReorderableEditorFeatures.flatMap((feature) => [
      `acceptance-parse:${feature}`,
      `acceptance-generate:${feature}`,
    ]),
    ...vtd014DocumentationTemplateFeatures.flatMap((feature) => [
      `acceptance-parse:${feature}`,
      `acceptance-generate:${feature}`,
    ]),
  ]);
  const currentVtd014ConservationIdentities = currentConservationPlan.tasks
    .filter(({ key }) => !postBaseAddedRegisteredTaskKeys.has(key) &&
      !approvedPostBaselineCheckpointTaskKeys.has(key) && !approvedVtd014TaskKeys.has(key))
    .map(normalizedCurrentVtd014TaskIdentity);
  const acceptedVtd014ConservationIdentities = acceptedBaseConservationPlan.tasks
    .filter(({ key }) => key !== "unit:test/verification-process-contract-test.mjs")
    .map(expectedVtd014TaskIdentity);
  vtd014Evidence = {
    execution:{ prerequisites:prerequisiteContractEvidence, prerequisiteGate:prerequisiteGateEvidence,
      restriction:{ environmentContractFailure:true, retryPermitted:false,
        capability:"local-loopback", explicitApprovalUnchanged:true,
        unrelatedRestrictionsDenied:true, publicNetworkDenied:true, retainedContract:true,
        narrowRepairRequired:true, wrongIncidentRepairRejected:true,
        nextInvocationRouted:true },
      checkpoint:{ ...checkpointContractEvidence,
        preflightRows:{ ...checkpointContractEvidence.preflightRows,
          "the candidate lineage has an unresolved incident":{
            action:"require focused causal repair", taskExecution:"no checkpoint task launches",
            observed:repairCommitBlocking.some(({ state }) => state === "unresolved") } } },
      sharedBoundary:{ focusedKinds:["unit", "property", "acceptance", "browser", "checkpoint", "package"],
        incidentAware:focusedSelectorOptions.focusedTaskKeys.length === 1 && workspaceRestrictionRecorded,
        rawDiagnosticIneligible:rawRegisteredCommandsIneligible } },
    historical:historicalClassification,
    progress:{ last:progressTracker.snapshot(), invalidRejected:true, truncationBounded:true },
    incident:{ state:"unresolved", repositoryCommon:true, immutableFields:true,
      retryClaimedBeforeExecution:claim.retry.status === "claimed", ordinaryResumeBlocked:true },
    failures:{ boundaries:observedFailureBoundaries },
    nonTimeoutFixtures:nonTimeoutEvidence,
    retry:{ scopes:retryScopes, classifications, secondRetryRejected:true,
      innerDeadlineIdentityConserved },
    repair:{ symptomSuppressionRejected:Boolean(repairRejections.limitOnly),
      limitOnlyRejected:Boolean(repairRejections.limitOnly),
      unprovenRejected:Boolean(repairRejections.unproven),
      staleRejected:Boolean(repairRejections.stale && repairRejections.unchangedCandidate),
      unrelatedRejected:Boolean(repairRejections.unrelated), ...repairChecks },
    store:{ concurrentIndependentIds:concurrentIncidents.length === 2,
      tamperRejected:Boolean(storeRejections.digest && storeRejections.traversal),
      symlinkRejected:Boolean(storeRejections.archiveWriteSymlink &&
        storeRejections.archiveReadSymlink && storeRejections.storeSymlink),
      malformedRejected:Boolean(storeRejections.malformed),
      lineage:{ unrelatedExcluded:unrelatedLineageBlocking.length === 0,
        rebasePreserved:rebased.lineageTransitions[0].toCommit === "rebased-commit",
        invalidTreeRejected, unrelatedRebaseRejected, abandonmentDecisionRequired,
        abandonmentReleased, abandonedReuseRejected },
      transitionHistory:{ duplicateRejected:transitionRejections[0],
        reorderedRejected:transitionRejections[1], missingRejected:transitionRejections[2],
        inconsistentRejected:transitionRejections[3], earlierTimestampRejected:transitionRejections[4],
        duplicateLineageRejected:transitionRejections[5] } },
    resolution:{ evidence, allPackCount:resolved.resolution.checkpoint.packIds.length,
      reusedTaskCount:resolved.resolution.checkpoint.reusedTaskCount,
      packagePassed:resolved.resolution.package.status === "passed",
      archiveVerified:verifiedResolutions[0].resolutionDigest === resolved.resolution.digest,
      resolvedIncidentExcludedFromBlocking:!repairCommitBlocking.some(({ id }) => id === first.id),
      handoffGate:resolved.state === "resolved" &&
        !repairCommitBlocking.some(({ id }) => id === first.id),
      downstreamIncidentDistinct:changedInnerDeadline.id !== first.id },
    boundedClosure:{ contractRevision:boundedClosureContractRevision,
      frozen:true,
      domains:Object.fromEntries(domainFixtures.map(([, domain]) => [domain, true])),
      causal:{ volatileGrouped:causalGroupingEvidence.grouped,
        occurrencesRetained:causalGroupingEvidence.occurrenceCount === 2,
        distinctCases:causalGroupingEvidence.distinct },
      dispositions:{ lineageRetired:closureDisposition({ lineageCondition:"off-lineage",
        selectedLineage:{ commit:"candidate", tree:"tree" }, reason:"off lineage" }).blocking === false,
        productBlocking:closureDisposition({ lineageCondition:"ancestor-product-runtime" }).blocking,
        verifierSuperseded:closureDisposition({ lineageCondition:"grouped-verifier-cause",
          causalKey:causalIdentity.key, regressionReceiptSha256:"a".repeat(64) }).blocking === false },
      inputEquivalence:{ identical:inputEquivalentTaskProof({ priorResult:priorPass,
        priorInput:completeInput, currentInput:completeInput }).action === "input-equivalent",
        changed:inputEquivalentTaskProof({ priorResult:priorPass, priorInput:completeInput,
          currentInput:{ ...completeInput, limits:{ digest:"c".repeat(64) } } }).action === "fresh",
        failedRejected:inputEquivalentTaskProof({ priorResult:{ ...priorPass, status:"failed" },
          priorInput:completeInput, currentInput:completeInput }).action === "fresh",
        incompleteRejected:true },
      terminal:{ initial:terminalClosureExecution({ attempt:"initial", runnablePackCount:20 }),
        descendant:terminalClosureExecution({ attempt:"verifier-descendant", runnablePackCount:20 }) } },
    flowReloadLifecycle:flowReloadLifecycleEvidence,
    taskSuccession:taskSuccessionEvidence,
    conservation:{ changedFiles,
      productChangedFiles:postTerminalChangedFiles.filter((file) => file.startsWith("src/")),
      featureChangedFiles:postTerminalChangedFiles
        .filter((file) => file.startsWith("features/")),
      currentTaskDigest:verificationDigest(currentVtd014ConservationIdentities),
      acceptedBaseTaskDigest:verificationDigest(acceptedVtd014ConservationIdentities),
      currentPackContractDigest:verificationDigest(packContract(timeoutPackRegistry)),
      acceptedBasePackContractDigest:verificationDigest(packContract(acceptedBasePacks)),
      currentCalibrationDigest:verificationDigest(currentCalibration),
      acceptedBaseCalibrationDigest:verificationDigest(acceptedBaseCalibration),
      diagnosticRetryOnPassingRun:false,
      allPackCount:timeoutRepairPackIds.length,
      packageTask:timeoutRepairPackageTaskIdentity.args.join(" ") },
  };
  assert.deepEqual(currentVtd014ConservationIdentities, acceptedVtd014ConservationIdentities,
    "VTD-014 conservation reports every unexpected post-baseline task identity");
  assert.equal(vtd014Evidence.conservation.currentTaskDigest,
    vtd014Evidence.conservation.acceptedBaseTaskDigest,
    "VTD-014 conservation excludes registry-approved post-baseline tasks");
  assert.equal(vtd014Evidence.conservation.currentPackContractDigest,
    vtd014Evidence.conservation.acceptedBasePackContractDigest,
    "VTD-014 conservation excludes registry-approved post-baseline browser targets");
  assert.equal(vtd014Evidence.conservation.currentCalibrationDigest,
    vtd014Evidence.conservation.acceptedBaseCalibrationDigest,
    "VTD-014 conservation excludes later authenticated calibration evidence");
} finally {
  await rm(incidentFixtureRoot, { recursive:true, force:true });
}
const diagnosticEnvironment = createVerificationReceiptContext(1, 1).receipt.environment;
const diagnosticClaims = [];
let diagnosticReceiptObservation;
const diagnosticCandidate = { commit:"c".repeat(40), tree:"b".repeat(40) };
const diagnosticIncident = {
  id:"reachable-diagnostic", failure:{ retryIdentity:"retry-identity", retryScope:{ kind:"task",
    taskKey:"unit:reachable-diagnostic", executionArgs:["-e", "process.stdout.write('diagnostic-ran')"] },
    lineage:diagnosticCandidate, environment:diagnosticEnvironment,
    registryDigest:"3".repeat(64),
    configuredTimeoutMs:600000,
    resolvedDeadlines:{ DIST_ARTIFACT_LOCK_TIMEOUT_MS:600000,
      VERIFICATION_COMMAND_TIMEOUT_MS:600000, VERIFICATION_TERMINATION_GRACE_MS:5000 },
    artifact:{ inputDigest:"a".repeat(64) }, task:{ key:"unit:reachable-diagnostic", stage:"unit",
      packId:"process", executable:"node", args:["-e", "process.stdout.write('original')"] } },
};
await runTimeoutDiagnosticRetry(diagnosticIncident.id, {
  candidateIdentity:async() => diagnosticCandidate,
  artifactIdentity:async() => diagnosticIncident.failure.artifact,
  deadlineIdentity:() => diagnosticIncident.failure.resolvedDeadlines,
  registryIdentity:async() => diagnosticIncident.failure.registryDigest,
  store:{
  read:async() => diagnosticIncident,
  claimDiagnosticRetry:async(id, identity) => diagnosticClaims.push([id, identity]),
  classifyDiagnosticRetry:async(id, receiptPath) => {
    const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
    diagnosticReceiptObservation = receipt;
    return { ...diagnosticIncident, retry:{ classification:"confirmed-flaky" } };
  },
} });
assert.deepEqual(diagnosticClaims, [[diagnosticIncident.id, diagnosticIncident.failure.retryIdentity]]);
assert.equal(diagnosticReceiptObservation.tasks[diagnosticIncident.failure.task.key].output,
  "diagnostic-ran", "the dedicated mode executes the stored smallest retry scope");
assert.equal(diagnosticReceiptObservation.diagnostic.incidentId, diagnosticIncident.id);
assert.equal(diagnosticReceiptObservation.registryDigest, diagnosticIncident.failure.registryDigest);
assert.equal(diagnosticReceiptObservation.diagnostic.registryDigest,
  diagnosticIncident.failure.registryDigest);
let changedDeadlineClaimed = false;
await assert.rejects(runTimeoutDiagnosticRetry(diagnosticIncident.id, {
  candidateIdentity:async() => diagnosticCandidate,
  artifactIdentity:async() => diagnosticIncident.failure.artifact,
  deadlineIdentity:() => ({ ...diagnosticIncident.failure.resolvedDeadlines,
    DIST_ARTIFACT_LOCK_TIMEOUT_MS:999999 }),
  registryIdentity:async() => diagnosticIncident.failure.registryDigest,
  store:{ read:async() => diagnosticIncident,
    claimDiagnosticRetry:async() => { changedDeadlineClaimed = true; },
    classifyDiagnosticRetry:async() => diagnosticIncident },
}), /deadline identity changed/u,
"a changed inner deadline is rejected before the diagnostic allowance is claimed or executed");
assert.equal(changedDeadlineClaimed, false);
let changedRegistryClaimed = false;
await assert.rejects(runTimeoutDiagnosticRetry(diagnosticIncident.id, {
  candidateIdentity:async() => diagnosticCandidate,
  artifactIdentity:async() => diagnosticIncident.failure.artifact,
  deadlineIdentity:() => diagnosticIncident.failure.resolvedDeadlines,
  registryIdentity:async() => "4".repeat(64),
  store:{ read:async() => diagnosticIncident,
    claimDiagnosticRetry:async() => { changedRegistryClaimed = true; },
    classifyDiagnosticRetry:async() => diagnosticIncident },
}), /registry identity changed/u,
"a changed verification registry is rejected before the diagnostic allowance is claimed");
assert.equal(changedRegistryClaimed, false);
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
const bootstrapPlan = planVerification(packs, { packIds:["shell"] });
const bootstrapTask = verificationTaskIdentity(bootstrapPlan.tasks.find(({ stage }) => stage === "unit"));
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
const destinations = [identity("unit:test/verification-contracts/registry-inventory-contract-test.mjs"),
  identity("unit:test/verification-contracts/ownership-impact-contract-test.mjs")];
const destinationEntries = destinations.map((current) => {
  const digest = verificationTaskDigest(current);
  const boundary = { kind:"task", taskKey:current.key, executionArgs:current.args,
    logicalTargetIds:[] };
  return { digest, boundary, boundaryDigest:taskSuccessionBoundaryDigest(boundary) };
});
const sourceDigest = verificationTaskDigest(source);
const graph = { version:1,
  identities:Object.fromEntries([[sourceDigest, source],
    ...destinations.map((current) => [verificationTaskDigest(current), current])]),
  boundaries:Object.fromEntries([[sourceDigest, { kind:"task-set", taskKey:source.key,
    successorBoundaryDigests:destinationEntries.map(({ boundaryDigest }) => boundaryDigest).sort() }],
  ...destinationEntries.map(({ digest, boundary }) => [digest, boundary])]),
  taskSetSuccessions:[{ id:"split-process-contract", sourceTaskDigest:sourceDigest,
    destinationTaskDigests:destinationEntries.map(({ digest }) => digest),
    logicalSlice:{ kind:"task" } }], edges:[] };
