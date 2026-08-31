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

await import("../../scripts/verification-ownership-readiness-test.mjs");

assert.deepEqual(firstCanonicalDifference({ a:[1, { b:2 }] }, { a:[1, { b:3 }] }),
  { path:"$.a[1].b", actual:2, expected:3 },
"canonical plan diagnostics identify the first mismatched field and values");

const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});

const createAuthorizedTestCommandRunner = (context, options = {}) => async(display, task) => {
  context.receipt.registryDigest ??= "f".repeat(64);
  context.receipt.candidate = {
    ...(context.receipt.candidate ?? {}),
    commit:/^[a-f0-9]{40}$/u.test(context.receipt.candidate?.commit ?? "")
      ? context.receipt.candidate.commit : "e".repeat(40),
    tree:/^[a-f0-9]{40}$/u.test(context.receipt.candidate?.tree ?? "")
      ? context.receipt.candidate.tree : "d".repeat(40),
  };
  const authorizedTask = { ...task, requiredCapabilities:[...(task.requiredCapabilities ?? [])] };
  const launchRoutes = options.launchRoutes ?? new Map([[task.key, "workspace-sandbox"]]);
  const authorizationContext = {
    mode:"focused", candidate:context.receipt.candidate ?? null,
    runId:context.receipt.runId, artifact:context.receipt.artifact ?? null,
    receiptPath:context.receiptPath, checkpointAttempt:null, promotion:null,
  };
  const launchAuthorizations = createVerificationLaunchAuthorizations({
    tasks:[authorizedTask], routes:launchRoutes, ...authorizationContext,
  });
  return createVerificationCommandRunner(context, {
    ...options, launchRoutes, launchAuthorizations, authorizationContext,
  })(display, authorizedTask);
};

assert.deepEqual(focusedAcceptanceOptions([
  "--timeout-repair-focused", "incident-1",
  "--timeout-regression", "unit:test/verification-process-contract-test.mjs",
  "--timeout-causal-category", "artifact/process locking",
  "--timeout-causal-explanation", "stale lock ownership survives a dead process",
  "--changed-since", "approved-base", "--prepare-evidence", "vtd014",
]).timeoutRepairFocused, "incident-1", "the runner exposes a repair-focused mode");

assert.equal(focusedAcceptanceOptions([
  "--reliability-diagnostic-retry", "incident-2",
]).timeoutDiagnosticRetry, "incident-2", "the runner exposes failure-neutral incident options");

const focusedSelectorOptions = focusedAcceptanceOptions([
  "--pack", "shell", "--focused-task", "unit:test/verification-process-contract-test.mjs",
]);

assert.deepEqual(focusedSelectorOptions.focusedTaskKeys,
  ["unit:test/verification-process-contract-test.mjs"],
"registered focused leaves have an incident-aware runner selector");

const reviewBoundFocusedSelectorOptions = focusedAcceptanceOptions([
  "--pack", "shell", "--focused-task", "unit:test/verification-process-contract-test.mjs",
  "--changed-since", "approved-base",
]);

assert.equal(reviewBoundFocusedSelectorOptions.changedSince, "approved-base",
  "focused verification can bind its receipt to the complete candidate change set");

assert.equal(timeoutRepairCausalCategory("readiness"), "readiness");

assert.equal(timeoutRepairCausalCategory("viewport/visibility/hit testing"),
  "viewport/visibility/hit testing");

assert.equal(timeoutRepairCausalCategory("readiness or settling"), "readiness or settling");

assert.equal(timeoutRepairCausalCategory("sandbox capability declaration/first-run routing"),
  "sandbox capability declaration/first-run routing");

assert.equal(timeoutRepairCausalCategory("other:kernel pipe backpressure"),
  "other:kernel pipe backpressure");

assert.throws(() => timeoutRepairCausalCategory("banana"), /causal category/u);

const prerequisiteTasks = [{ key:"browser-observation:known-loopback", stage:"browser-observation",
  executable:"node", args:["browser.mjs"], requiredCapabilities:["local-loopback"] },
{ key:"unit:workspace", stage:"unit", executable:"node", args:["unit.mjs"],
  requiredCapabilities:[] }];

const gitMetadataTask = { key:"evidence:git-note", stage:"evidence", executable:"node",
  args:["scripts/verification-evidence.mjs", "record", "pending.json"],
  requiredCapabilities:["git-metadata-write"] };

assert.deepEqual(verificationPromotionTasks("tmp/evidence.pending.json").map((task) => ({
  key:task.key, capabilities:task.requiredCapabilities,
})), [
  { key:"promotion:pending-evidence", capabilities:[] },
  { key:"promotion:git-note", capabilities:["git-metadata-write"] },
], "the real evidence promotion operations are canonical prerequisite tasks");

const partitionedPrerequisiteReceipt = { plan:{} };

applyCheckpointPrerequisitePlan(partitionedPrerequisiteReceipt,
  [{ key:"unit:one" }], { tasks:[
    { key:"unit:one", route:"workspace-sandbox", requiredCapabilities:[] },
    { key:"promotion:pending-evidence", route:"workspace-sandbox", requiredCapabilities:[] },
    { key:"promotion:git-note", route:"scoped-git-metadata-approval",
      requiredCapabilities:["git-metadata-write"] },
  ] });

assert.deepEqual(partitionedPrerequisiteReceipt.plan.executionPrerequisites,
  [{ key:"unit:one", route:"workspace-sandbox", requiredCapabilities:[] }],
"the evidence receipt task routes remain an exact verification-plan set");

assert.deepEqual(partitionedPrerequisiteReceipt.plan.promotionExecutionPrerequisites.map(({ key }) => key),
  ["promotion:pending-evidence", "promotion:git-note"],
"promotion routes remain durable without being forged as completed verification tasks");

const cheapPreflightOrder = [];

const cheapPreflightReceipt = { receipt:{ plan:{} } };

await prepareCheckpointExecution({
  packs:[], plan:{ tasks:[prerequisiteTasks[1]] }, receiptContext:cheapPreflightReceipt,
  inputFingerprint:{ inputDigest:"a".repeat(64) }, evidenceTask:"vtd014",
  changedSince:"approved-base", promotionTasks:verificationPromotionTasks(),
  preflight:async({ validationNames, plan }) => {
    cheapPreflightOrder.push(validationNames.join("+"));
    if (validationNames[0] === "prerequisites") return {
      tasks:plan.tasks.map((task) => ({ key:task.key,
        requiredCapabilities:task.requiredCapabilities,
        route:task.requiredCapabilities.length
          ? "scoped-git-metadata-approval" : "workspace-sandbox" })),
    };
    return undefined;
  },
});

cheapPreflightOrder.push("build-child");

assert.deepEqual(cheapPreflightOrder, [
  "registry+plan+artifact", "prerequisites", "receipt+evidence", "build-child",
], "cheap receipt and evidence compatibility preflight completes before the leased build child");

let malformedReceiptBuildLaunches = 0;

await assert.rejects(() => prepareCheckpointExecution({
  packs:[], plan:{ tasks:[prerequisiteTasks[1]] }, receiptContext:{ receipt:{ plan:{} } },
  inputFingerprint:{ inputDigest:"a".repeat(64) }, evidenceTask:"vtd014",
  changedSince:"approved-base", promotionTasks:verificationPromotionTasks(),
  preflight:async({ validationNames, plan }) => {
    if (validationNames[0] === "prerequisites") return {
      tasks:plan.tasks.map((task) => ({ key:task.key,
        requiredCapabilities:task.requiredCapabilities, route:"workspace-sandbox" })),
    };
    if (validationNames.includes("receipt")) throw new Error("malformed receipt contract");
  },
}).then(() => { malformedReceiptBuildLaunches += 1; }), /malformed receipt contract/u);

assert.equal(malformedReceiptBuildLaunches, 0,
  "a deterministic receipt blocker launches no build child");

assert.deepEqual(preflightExecutionPrerequisites([gitMetadataTask, prerequisiteTasks[1]], {
  availableCapabilities:["git-metadata-write"],
  approvalRoutes:{ "git-metadata-write":"scoped-git-metadata-approval" },
}).tasks.map(({ key, route }) => [key, route]), [
  ["evidence:git-note", "scoped-git-metadata-approval"],
  ["unit:workspace", "workspace-sandbox"],
], "Git metadata writes receive a scoped route without widening workspace-only tasks");

assert.equal((await probeExecutionPrerequisiteEnvironment([gitMetadataTask], {
  executableProbe:async() => true, outputCapacityProbe:async() => true,
  capabilityProbe:async(capability) => capability === "git-metadata-write",
  requestedCapabilities:["git-metadata-write"],
})).launchable, true, "declared Git metadata access has a usable first-use probe");

assert.equal((await preflightGitNotePromotion(path.resolve("tmp/promotion-probe.pending.json"))).route,
  "scoped-git-metadata-approval",
"the actual Git-note recording operation probes and selects its declared scoped route");

assert.deepEqual(preflightExecutionPrerequisites(prerequisiteTasks, {
  availableCapabilities:["local-loopback"],
  approvalRoutes:{ "local-loopback":"scoped-command-approval" },
}).tasks.map(({ key, route }) => [key, route]), [
  ["browser-observation:known-loopback", "scoped-command-approval"],
  ["unit:workspace", "workspace-sandbox"],
], "known loopback access is arranged on the first launch without widening workspace tasks");

const deniedPrerequisite = preflightExecutionPrerequisites(prerequisiteTasks, {
  availableCapabilities:[], approvalRoutes:{ "local-loopback":"denied" },
});

assert.deepEqual(deniedPrerequisite.blocked, [{
  taskKey:"browser-observation:known-loopback", capability:"local-loopback",
  route:"denied", status:"environment-prerequisite-blocked",
}], "denied declared access blocks before a child process is launched");

assert.equal(deniedPrerequisite.launchable, false);

assert.ok(verificationRunnerModeRegistry.every(({ id, validate }) => id && typeof validate === "function"),
  "every runner mode has one canonical validator");

assert.ok(verificationPrerequisiteKindRegistry.every(({ id, validate, satisfy }) =>
  id && typeof validate === "function" && typeof satisfy === "function"),
"every prerequisite kind has one validator and satisfier");

const transitivePrerequisiteTasks = [
  { key:"build:dist", stage:"build", executable:"npm", args:["run", "build"],
    requiredCapabilities:[], prerequisiteTaskKeys:[] },
  { key:"unit:receipt-source", stage:"unit", packId:"shell", executable:"node",
    args:["receipt-source.mjs"], requiredCapabilities:[], prerequisiteTaskKeys:[] },
  { key:"acceptance-parse:shell", stage:"acceptance-parse", packId:"shell", executable:"bb",
    args:["gherkin-parser"], requiredCapabilities:[], prerequisiteTaskKeys:["build:dist"] },
  { key:"acceptance-generate:shell", stage:"acceptance-generate", packId:"shell", executable:"bb",
    args:["acceptance-entrypoint-generator"], requiredCapabilities:[],
    prerequisiteTaskKeys:["acceptance-parse:shell"] },
  { key:"acceptance-session:shell", stage:"acceptance-session", packId:"shell", executable:"bb",
    args:["acceptance-pack-runner", "shell"], requiredCapabilities:[],
    prerequisiteTaskKeys:["unit:receipt-source", "acceptance-generate:shell"] },
];

assert.deepEqual(expandVerificationTaskPrerequisites(
  [transitivePrerequisiteTasks.at(-1)], transitivePrerequisiteTasks,
  { mode:"ordinary-focused" }).map(({ key }) => key),
["build:dist", "unit:receipt-source", "acceptance-parse:shell",
  "acceptance-generate:shell", "acceptance-session:shell"],
"the shared gate adds each transitive predecessor once in canonical order");

assert.throws(() => expandVerificationTaskPrerequisites([{ ...transitivePrerequisiteTasks.at(-1),
  prerequisiteTaskKeys:["missing"] }], transitivePrerequisiteTasks,
{ mode:"repair-focused" }), /missing.*satisfier|prerequisite/u,
"a missing typed satisfier blocks before execution");

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

assert.deepEqual(normalizedBrowserPrerequisites.map(({key})=>key),
  [canonicalBrowserBatch.key,browserConsumer.key],
  "overlapping and alias-only browser prerequisites normalize to one canonical batch");

assert.deepEqual(normalizedBrowserPrerequisites.at(-1).prerequisiteTaskKeys,[canonicalBrowserBatch.key],
  "prerequisite edges are rebound to the canonical browser task exactly once");

assert.deepEqual(expandVerificationTaskPrerequisites(
  [aliasBrowserBatch,overlappingBrowserBatch,browserConsumer],
  [canonicalBrowserBatch,browserConsumer],{mode:"ordinary-focused"}).map(({key})=>key),
  [canonicalBrowserBatch.key,browserConsumer.key],
  "the prerequisite-expansion boundary returns the normalized canonical browser closure");

assert.throws(()=>normalizeBrowserPrerequisiteTasks([aliasBrowserBatch],[]),/missing current canonical browser target/iu);

assert.throws(()=>normalizeBrowserPrerequisiteTasks([aliasBrowserBatch],[canonicalBrowserBatch,
  {...canonicalBrowserBatch,key:"browser-observation:A+B+C:copy"}]),/ambiguous current canonical browser target/iu);

assert.throws(()=>normalizeBrowserPrerequisiteTasks([{...aliasBrowserBatch,packId:"other"}],
  [canonicalBrowserBatch]),/incompatible browser execution contract/iu);

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

assert.equal(sameTargetProjection.projection,"same-target-planner-projection");

assert.deepEqual(sameTargetProjection.execution.logicalTargetIds,["A"],
  "same-target projection executes only the diagnosed target through the current identity");

const expandedProjectionPacks=structuredClone(projectionPacks);

expandedProjectionPacks[0].browserEvidencePartitions[0].targets[0].leaves.push("flow.A.expanded");

await assert.rejects(()=>resolveIncidentTaskSuccession({incident:projectedIncident,
  currentIdentities:[projectedCurrent],currentPacks:expandedProjectionPacks,
  graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>projectionPacks,loadSourceReceipt:async()=>projectionReceipt}),
  /changed target boundary for A/iu,
"direct same-target projection still rejects an expanded target boundary");

const deferredExpandedProjection={...projectedIncident,repair:{status:"eligible"},
  terminalVerificationDeferred:{status:"terminal-verification-deferred"}};

let deferredProjectionReceiptLoaded=false,deferredProjectionHistoryLoaded=false;

assert.deepEqual(await validateUnresolvedIncidentTaskSuccession({
  incidents:[deferredExpandedProjection],currentIdentities:[projectedCurrent],
  currentPacks:expandedProjectionPacks,graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>{deferredProjectionHistoryLoaded=true;return projectionPacks;},
  loadSourceReceipt:async()=>{deferredProjectionReceiptLoaded=true;return projectionReceipt;},
}),[],"an eligible deferred expanded target remains pending focused reassessment");

assert.equal(deferredProjectionReceiptLoaded&&deferredProjectionHistoryLoaded,true,
  "deferred expanded projection verifies the governed receipt and historical registry first");

const missingSourceDeferredProjection=structuredClone(deferredExpandedProjection);

delete missingSourceDeferredProjection.failure.sourceReceipt;

await assert.rejects(()=>validateUnresolvedIncidentTaskSuccession({
  incidents:[missingSourceDeferredProjection],currentIdentities:[projectedCurrent],
  currentPacks:expandedProjectionPacks,graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>projectionPacks,loadSourceReceipt:async()=>projectionReceipt,
}),/missing registry history|unverified planner-projection source identity/iu,
"an unverified deferred projection source remains blocking");

const historicalAcceptanceRegistryFeatures=["features/flow-export.feature","features/flow-export-runtime.feature",
  "features/documentation-workspace.feature","features/documentation-workspace-runtime.feature"];

const addedAcceptanceRegistryFeatures=["features/template-library.feature","features/template-library-runtime.feature",
  "features/excel-templates.feature","features/excel-templates-runtime.feature",
  "features/rich-templates.feature","features/rich-templates-runtime.feature"];

const processAcceptancePack=(features)=>({id:"flow_export",features,
  source:["src/data-layer-project-documentation-workspace-ui.ts"],
  verificationInputs:["test/flow-export-test.mjs"]});

const plannedProcessAcceptanceSession=(packs)=>verificationTaskIdentity(planVerification(packs,
  {packIds:["flow_export"]}).tasks.find(({key})=>key==="acceptance-session:flow_export"));

const historicalAcceptancePacks=[processAcceptancePack(historicalAcceptanceRegistryFeatures)];

const expandedAcceptancePacks=[processAcceptancePack([
  ...historicalAcceptanceRegistryFeatures,...addedAcceptanceRegistryFeatures])];

const historicalAcceptanceSession=plannedProcessAcceptanceSession(historicalAcceptancePacks);

const expandedAcceptanceSession=plannedProcessAcceptanceSession(expandedAcceptancePacks);

assert.notDeepEqual(historicalAcceptanceRegistryFeatures,historicalAcceptanceSession.target.split(","),
  "the process fixture reproduces declaration order differing from canonical planner order");

const deferredAcceptanceIncident={id:"d723a7c4-1116-4887-b60a-21aded1ab5d8",state:"unresolved",
  repair:{status:"eligible",diagnosedBoundary:{kind:"task",taskKey:historicalAcceptanceSession.key,
    executionArgs:historicalAcceptanceSession.args}},
  terminalVerificationDeferred:{status:"terminal-verification-deferred"},failure:{
    task:historicalAcceptanceSession,sourceReceipt:"historical-acceptance.json",
    lineage:{commit:"historical-acceptance",tree:"historical-acceptance-tree"},
    retryScope:{kind:"task",taskKey:historicalAcceptanceSession.key,
      executionArgs:historicalAcceptanceSession.args}}};

const deferredAcceptanceBefore=structuredClone(deferredAcceptanceIncident);

assert.deepEqual(await validateUnresolvedIncidentTaskSuccession({incidents:[deferredAcceptanceIncident],
  currentIdentities:[expandedAcceptanceSession],currentPacks:expandedAcceptancePacks,
  graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>historicalAcceptancePacks,
  loadSourceReceipt:async()=>({candidate:{commit:"historical-acceptance",tree:"historical-acceptance-tree"},
    tasks:{[historicalAcceptanceSession.key]:{identity:historicalAcceptanceSession,status:"failed"}}}),
}),[],"a verified deferred acceptance session does not block an unrelated governed repair after monotonic expansion");

assert.deepEqual(deferredAcceptanceIncident,deferredAcceptanceBefore,
  "acceptance-session repair preflight preserves immutable incident state");

const repartitionedAcceptancePacks=[
  processAcceptancePack(historicalAcceptanceRegistryFeatures.slice(0,2)),
  {id:"verification_process",features:historicalAcceptanceRegistryFeatures.slice(2),
    source:["scripts/verification-packs.mjs"],verificationInputs:["test/verification-process-contract-test.mjs"]},
];

const repartitionedAcceptanceSessions=repartitionedAcceptancePacks.map(pack=>
  verificationTaskIdentity(planVerification(repartitionedAcceptancePacks,{packIds:[pack.id]}).tasks
    .find(({key})=>key===`acceptance-session:${pack.id}`)));

assert.deepEqual(await validateUnresolvedIncidentTaskSuccession({incidents:[deferredAcceptanceIncident],
  currentIdentities:repartitionedAcceptanceSessions,currentPacks:repartitionedAcceptancePacks,
  graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>historicalAcceptancePacks,
  loadSourceReceipt:async()=>({candidate:{commit:"historical-acceptance",tree:"historical-acceptance-tree"},
    tasks:{[historicalAcceptanceSession.key]:{identity:historicalAcceptanceSession,status:"failed"}}}),
}),[],"a deferred acceptance session remains conserved when its features move to canonical successor packs");

const missingRepartitionedFeature=structuredClone(repartitionedAcceptancePacks);
missingRepartitionedFeature[1].features.pop();
const incompleteRepartitionedSessions=missingRepartitionedFeature.map(pack=>
  verificationTaskIdentity(planVerification(missingRepartitionedFeature,{packIds:[pack.id]}).tasks
    .find(({key})=>key===`acceptance-session:${pack.id}`)));

await assert.rejects(()=>validateUnresolvedIncidentTaskSuccession({
  incidents:[deferredAcceptanceIncident],currentIdentities:incompleteRepartitionedSessions,
  currentPacks:missingRepartitionedFeature,graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>historicalAcceptancePacks,
  loadSourceReceipt:async()=>({candidate:{commit:"historical-acceptance",tree:"historical-acceptance-tree"},
    tasks:{[historicalAcceptanceSession.key]:{identity:historicalAcceptanceSession,status:"failed"}}}),
}),/same-target planner projection requires one diagnosed target/iu,
"cross-pack conservation rejects a missing historical acceptance feature");

const durablyDeferredAcceptanceIncident=structuredClone(deferredAcceptanceIncident);

durablyDeferredAcceptanceIncident.failureDigest="1".repeat(64);

durablyDeferredAcceptanceIncident.terminalVerificationDeferred.repairDigest="2".repeat(64);

durablyDeferredAcceptanceIncident.terminalVerificationDeferred.eligibleRepairAdmissions={entries:[{
  incidentId:durablyDeferredAcceptanceIncident.id,
  failureDigest:durablyDeferredAcceptanceIncident.failureDigest,
  repairDigest:durablyDeferredAcceptanceIncident.terminalVerificationDeferred.repairDigest,
}]};

assert.deepEqual(await validateUnresolvedIncidentTaskSuccession({
  incidents:[durablyDeferredAcceptanceIncident],currentIdentities:[expandedAcceptanceSession],
  currentPacks:expandedAcceptancePacks,graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>historicalAcceptancePacks,
  loadSourceReceipt:async()=>{throw new Error("ephemeral source receipt is unavailable");},
}),[],"a durable terminal admission substitutes for an unavailable ephemeral failure receipt");

const unboundDeferredAcceptanceIncident=structuredClone(durablyDeferredAcceptanceIncident);

unboundDeferredAcceptanceIncident.terminalVerificationDeferred.eligibleRepairAdmissions.entries[0]
  .repairDigest="3".repeat(64);

await assert.rejects(()=>validateUnresolvedIncidentTaskSuccession({
  incidents:[unboundDeferredAcceptanceIncident],currentIdentities:[expandedAcceptanceSession],
  currentPacks:expandedAcceptancePacks,graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>historicalAcceptancePacks,
  loadSourceReceipt:async()=>{throw new Error("ephemeral source receipt is unavailable");},
}),/same-target planner projection requires one diagnosed target/iu,
"an unbound durable admission cannot replace the historical failure receipt");

const projectedEligibleIncident={...projectedIncident,repair:{focusedTaskPlan:[{
  identity:projectedCurrent,roles:["diagnosed-boundary"],taskSuccession:{
    version:sameTargetProjection.version,sourceTaskDigest:sameTargetProjection.sourceTaskDigest,
    destinationTaskDigest:sameTargetProjection.destinationTaskDigest,
    chain:structuredClone(sameTargetProjection.chain),
    logicalSlice:structuredClone(sameTargetProjection.logicalSlice),
    conservationDigest:sameTargetProjection.conservationDigest,
  }}]}};

const projectedReviewTasks={[projectedCurrent.key]:{identity:projectedCurrent,status:"passed",
  provenance:"fresh"}},projectedCoverage=terminalProjectionCoverage(
    projectedEligibleIncident,projectedReviewTasks);

assert.equal(projectedCoverage.destinationTaskKey,projectedCurrent.key,
  "terminal deferral carries the validated current destination task key");

assert.equal(terminalProjectionCoverageValid(projectedEligibleIncident,projectedCoverage,
  [projectedCurrent.key]),true,
"projection deferral binds the immutable source digest and fresh review destination");

assert.equal(terminalProjectionCoverage(projectedEligibleIncident,{[projectedCurrent.key]:{
  ...projectedReviewTasks[projectedCurrent.key],provenance:"restored"}}),undefined,
"non-fresh destination evidence cannot satisfy projected terminal deferral");

assert.equal(terminalProjectionCoverage({...projectedEligibleIncident,repair:{focusedTaskPlan:[
  {...projectedEligibleIncident.repair.focusedTaskPlan[0],taskSuccession:{
    ...projectedEligibleIncident.repair.focusedTaskPlan[0].taskSuccession,
    sourceTaskDigest:"0".repeat(64)}}]}},projectedReviewTasks),undefined,
"a projection whose source digest does not bind the immutable failure remains blocked");

await assert.rejects(()=>resolveIncidentTaskSuccession({incident:projectedIncident,
  currentIdentities:[],currentPacks:projectionPacks,graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>projectionPacks,loadSourceReceipt:async()=>projectionReceipt}),
  /missing current target boundary/iu);

await assert.rejects(()=>resolveIncidentTaskSuccession({incident:projectedIncident,
  currentIdentities:[projectedCurrent,{...projectedCurrent,key:"browser-observation:A+B+C:copy"}],
  currentPacks:projectionPacks,graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>projectionPacks,loadSourceReceipt:async()=>projectionReceipt}),
  /ambiguous current target boundary/iu);

await assert.rejects(()=>resolveIncidentTaskSuccession({incident:projectedIncident,
  currentIdentities:[projectedCurrent],currentPacks:[{...projectionPacks[0],
    browserEvidencePartitions:[{...projectionPacks[0].browserEvidencePartitions[0],targets:
      projectionPacks[0].browserEvidencePartitions[0].targets.map(row=>row.id==="A"
        ?{...row,leaves:["flow.changed"]}:row)}]}],graph:{version:1,identities:{},boundaries:{},edges:[]},
  loadHistoricalPacks:async()=>projectionPacks,loadSourceReceipt:async()=>projectionReceipt}),
  /changed target boundary/iu);

await assert.rejects(()=>resolveIncidentTaskSuccession({incident:projectedIncident,
  currentIdentities:[projectedCurrent],currentPacks:projectionPacks,graph:{version:1,identities:{},
    boundaries:{},edges:[]},loadHistoricalPacks:async()=>projectionPacks,
  loadSourceReceipt:async()=>({...projectionReceipt,candidate:{commit:"other",tree:"failed-tree"}})}),
  /unverified planner-projection source identity/iu);

const authorizationContext = {
  mode:"repair-focused", candidate:{ commit:"candidate", tree:"tree" }, runId:"run-1",
  artifact:{ inputDigest:"artifact" }, receiptPath:"tmp/receipt.json",
};

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

function resolvedNodeModulesRoot(resolve = (specifier) => import.meta.resolve(specifier)) {
  const installedTypescriptRoot = path.dirname(path.dirname(
    fileURLToPath(resolve("typescript"))));
  return path.dirname(installedTypescriptRoot);
}

const CLI_CONTENTION_READINESS_TIMEOUT_MS = 120_000;

const guardIncidents = [];

let guardedSnapshot = {
  commit:"a".repeat(40), tree:"b".repeat(40), artifactInputDigest:"c".repeat(64),
  artifactOutputDigest:"d".repeat(64), artifactBuildIdentity:"e".repeat(64), trackedChanges:"",
};

const checkpointGuard = createCheckpointIdentityGuard({
  expected:structuredClone(guardedSnapshot),
  snapshot:async() => structuredClone(guardedSnapshot),
  createIncident:async(failure) => { guardIncidents.push(failure); return { id:"between-task-drift" }; },
  attemptId:"attempt-guard", routeFor:() => "workspace-sandbox",
});

await checkpointGuard.assertBefore({ key:"unit:first", stage:"unit", executable:"node",
  args:["first.mjs"], requiredCapabilities:[] });

guardedSnapshot.trackedChanges = " M tracked-file.mjs";

await assert.rejects(() => checkpointGuard.assertBefore({
  key:"unit:second", stage:"unit", requiredCapabilities:[],
  executable:"node", args:["second.mjs"],
}), /between-task-drift/u, "a tracked mutation between same-stage tasks stops the next child");

assert.equal(guardIncidents.length, 1,
  "an actual between-task mutation creates an execution-contract incident");

assert.deepEqual(resolvedVerificationDeadlines({
  timeoutMs:600000, terminationGraceMs:5000,
  environment:{ DIST_ARTIFACT_LOCK_TIMEOUT_MS:"1", CUSTOM_SETUP_TIMEOUT_MS:"27" },
}), { CUSTOM_SETUP_TIMEOUT_MS:27, DIST_ARTIFACT_LOCK_TIMEOUT_MS:1,
  VERIFICATION_COMMAND_TIMEOUT_MS:600000, VERIFICATION_TERMINATION_GRACE_MS:5000 },
"the runner resolves its outer limit and every applicable inherited inner deadline");

const stableFailureIdentity = {
  failureClass:"explicit-logical-failure",
  task:{ key:"browser-observation:LAYOUT_TARGET" },
  failedBoundary:{ logicalTargetId:"LAYOUT_TARGET", phase:"assertion",
    assertionSite:"layout-target.mjs:42:7" },
};

assert.equal(
  reliabilityFailureFingerprint({ ...stableFailureIdentity,
    error:"failed at 2026-08-09T07:00:01.123Z on 127.0.0.1:43117 in /tmp/run-one/result" }),
  reliabilityFailureFingerprint({ ...stableFailureIdentity,
    error:"failed at 2026-08-09T07:01:02.456Z on 127.0.0.1:53218 in /tmp/run-two/result" }),
  "failure fingerprints exclude timestamps, local ports, and temporary paths",
);

assert.notEqual(
  reliabilityFailureFingerprint({ ...stableFailureIdentity, error:"center point was offscreen" }),
  reliabilityFailureFingerprint({ ...stableFailureIdentity,
    failedBoundary:{ ...stableFailureIdentity.failedBoundary, assertionSite:"layout-target.mjs:51:3" },
    error:"center point was offscreen" }),
  "failure fingerprints conserve the assertion site",
);

assert.equal(boundedClosureContractRevision, "2f609d7a19fd966eb82c54b2938df1fd78e2d836",
  "the bounded closure contract is frozen at the approved specification");

const domainFixtures = [
  [{ launchAuthorized:true, ownership:"product", boundary:"runtime" }, "product-runtime"],
  [{ launchAuthorized:true, ownership:"verification", boundary:"runner" }, "verification-execution"],
  [{ taskResultImmutable:true, ownership:"verification", boundary:"promotion" }, "verification-record"],
  [{ launchAuthorized:false, ownership:"verification", boundary:"capability" }, "environment-prerequisite"],
];

for (const [input, expected] of domainFixtures) {
  assert.equal(classifyReliabilityFailureDomain(input), expected,
    `declared ownership and the executed ${input.boundary} boundary select ${expected}`);
}

assert.throws(() => classifyReliabilityFailureDomain({
  launchAuthorized:true, ownership:"unknown", boundary:"runner",
}), /declared ownership/u, "paths or an agent label cannot choose a failure domain");

const mixedAcceptanceTask = {
  key:"acceptance-session:shell", stage:"acceptance-session", packId:"shell",
  executable:"bb", args:["acceptance-pack-runner", "shell"], target:"mixed acceptance",
  reliabilityBoundaries:[{
    casePrefix:"Modular verification packs ", ownership:"verification",
    boundary:"verification-acceptance",
  }],
};

assert.equal(reliabilityFailureContract({
  task:mixedAcceptanceTask, failureClass:"nonzero-exit",
  failedBoundary:{ caseId:"Side panel visual system 001/example_1" },
  stderr:"Acceptance execution failed: Modular verification packs 133/example_1: misleading text",
  resultDigestInputs:{ commit:"candidate", tree:"tree" },
}).failureDomain, "product-runtime",
"diagnostic text cannot override the authoritative executed acceptance boundary");

assert.equal(reliabilityFailureContract({
  task:mixedAcceptanceTask, failureClass:"nonzero-exit",
  failedBoundary:{ caseId:"Modular verification packs 133/example_1" },
  stderr:"Acceptance execution failed: Side panel visual system 001/example_1: misleading text",
  resultDigestInputs:{ commit:"candidate", tree:"tree" },
}).failureDomain, "verification-execution",
"declared ownership plus the actual executed case selects verification execution");

const causalFixture = {
  domain:"verification-execution",
  task:{ key:"acceptance-session:shell", executable:"bb", args:["acceptance-pack-runner", "shell"] },
  executableBoundary:"acceptance.pack-session/run-session!",
  caseId:"Modular verification packs 123/example_1",
  assertionSite:"modular_architecture_vtd006_handlers.clj:418",
  diagnostic:"Aggregate failure at /tmp/run-a on 127.0.0.1:43117 at 2026-08-10T12:00:00Z",
};

const causalIdentity = causalFailureIdentity(causalFixture);

assert.equal(causalIdentity.key, causalFailureIdentity({ ...causalFixture,
  diagnostic:"Aggregate failure at /tmp/run-b on 127.0.0.1:53218 at 2026-08-10T12:01:00Z",
}).key, "volatile diagnostics append an occurrence to the same causal incident");

assert.notEqual(causalIdentity.key, causalFailureIdentity({ ...causalFixture,
  caseId:"Modular verification packs 124/example_1",
}).key, "a different generated case creates a distinct causal incident");

assert.notEqual(causalIdentity.key, causalFailureIdentity({ ...causalFixture,
  assertionSite:"modular_architecture_vtd006_handlers.clj:419",
}).key, "a different assertion site creates a distinct causal incident");

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

assert.equal(inputEquivalentTaskProof({ priorResult:priorPass, priorInput:completeInput,
  currentInput:structuredClone(completeInput) }).action, "input-equivalent",
"a passing task with identical complete inputs retains explicit prior provenance");

for (const invalidPrior of [{ ...priorPass, status:"failed" }, { ...priorPass, status:"interrupted" }]) {
  assert.equal(inputEquivalentTaskProof({ priorResult:invalidPrior, priorInput:completeInput,
    currentInput:completeInput }).action, "fresh",
  "failed and interrupted results never become carried proof");
}

assert.equal(inputEquivalentTaskProof({ priorResult:priorPass, priorInput:completeInput,
  currentInput:{ ...completeInput, runnerSemantics:{ digest:"c".repeat(64) } } }).action, "fresh",
"a shared runner semantic change forces fresh execution");

assert.throws(() => completeTaskInputClosure({ ...completeInput,
  transitiveCode:{ digest:"1".repeat(64), complete:false } }), /complete influence/u,
"unknown or incomplete influence fails closed");

assert.deepEqual(terminalClosureExecution({ attempt:"initial", runnablePackCount:20 }), {
  taskPolicy:"fresh-all", runnablePackCount:20, packagePolicy:"fresh",
}, "the initial sealed attempt is fresh all-20 and package is always fresh");

assert.deepEqual(terminalClosureExecution({ attempt:"verifier-descendant", runnablePackCount:20 }), {
  taskPolicy:"fresh-or-input-equivalent", runnablePackCount:20, packagePolicy:"fresh",
}, "a verifier descendant can retain only complete input-equivalent passes");

assert.throws(() => terminalClosureExecution({ attempt:undefined, runnablePackCount:20 }),
  /Unsupported terminal closure attempt/u,
"bounded evidence rejects a receipt whose plan omits its terminal attempt identity");

const verificationEvidenceCoreSource = await readFile(
  new URL("../../scripts/verification-evidence/core.mjs", import.meta.url), "utf8");

assert.match(verificationEvidenceCoreSource,
  /allowLegacyTerminalClosure && receipt\.plan\?\.terminalClosure === undefined/u,
"archived pre-policy closure receipts alone may omit terminal closure metadata");

assert.match(verificationEvidenceCoreSource,
  /runIntentBootstrap, blockedAggregateObligation, rawReceipt, confirmedFlakyAdmissions \}\] = await Promise\.all[\s\S]*?runIntentBootstrap, blockedAggregateObligation, rawReceipt, confirmedFlakyAdmissions,/u,
"completed receipt compatibility preserves reliability admissions and blocked obligations through pending evidence");

const terminalPackageKey = "package:extension";

const terminalFreshTasks = {
  "acceptance-session:shell":{ status:"passed", provenance:"fresh" },
  [terminalPackageKey]:{ status:"passed", provenance:"fresh" },
};

assert.equal(enforceTerminalClosureReceipt({
  attempt:"initial", runnablePackCount:20, tasks:terminalFreshTasks,
  currentInputs:{ "acceptance-session:shell":completeInput, [terminalPackageKey]:completeInput },
  packageTaskKey:terminalPackageKey,
}).taskPolicy, "fresh-all", "the production receipt boundary accepts an initial fresh checkpoint");

const validEquivalent = {
  status:"passed", provenance:"input-equivalent",
  inputEquivalentProof:{ priorResult:priorPass, priorInput:completeInput },
};

assert.equal(enforceTerminalClosureReceipt({
  attempt:"verifier-descendant", runnablePackCount:20,
  tasks:{ "acceptance-session:shell":validEquivalent,
    [terminalPackageKey]:terminalFreshTasks[terminalPackageKey] },
  currentInputs:{ "acceptance-session:shell":completeInput, [terminalPackageKey]:completeInput },
  packageTaskKey:terminalPackageKey,
}).taskPolicy, "fresh-or-input-equivalent",
"the production receipt boundary accepts complete identical carried proof");

await assert.rejects(async() => enforceTerminalClosureReceipt({
  attempt:"verifier-descendant", runnablePackCount:20,
  tasks:{ "acceptance-session:shell":{
    ...validEquivalent,
    inputEquivalentProof:{ priorResult:priorPass,
      priorInput:{ ...completeInput, transitiveCode:{ complete:false, digest:"1".repeat(64) } } },
  }, [terminalPackageKey]:terminalFreshTasks[terminalPackageKey] },
  currentInputs:{ "acceptance-session:shell":completeInput, [terminalPackageKey]:completeInput },
  packageTaskKey:terminalPackageKey,
}), /incomplete influence/u,
"the real terminal receipt boundary rejects incomplete carried influence");

await assert.rejects(async() => enforceTerminalClosureReceipt({
  attempt:"verifier-descendant", runnablePackCount:20,
  tasks:{ "acceptance-session:shell":validEquivalent,
    [terminalPackageKey]:terminalFreshTasks[terminalPackageKey] },
  currentInputs:{ "acceptance-session:shell":{
    ...completeInput, runnerSemantics:{ digest:"c".repeat(64) },
  }, [terminalPackageKey]:completeInput },
  packageTaskKey:terminalPackageKey,
}), /task input changed/u,
"the real terminal receipt boundary rejects changed carried input");

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

assert.deepEqual(options.packIds, ["capture", "schemas"]);

assert.equal(options.prepareEvidence, "task-17");

assert.equal(focusedAcceptanceOptions([
  "--pack", "capture", "--changed-since", "base", "--property",
  "--prepare-evidence", "task-17", "--run-intent-bootstrap",
]).runIntentBootstrap, true);

const registryPlannerPreparationOptions = focusedAcceptanceOptions([
  "--pack", "shell", "--pack", "verification_process", "--changed-since", "base",
  "--prepare-evidence", "verification-slice-verification-registry-planner-modularization",
  "--run-intent-bootstrap",
  "--focused-task", "unit:test/modular-utility-architecture-test.mjs",
  "--focused-task", "unit:test/verification-pack-cardinality-contract-test.mjs",
  ...verificationPolicyContracts.flatMap(({ testPath }) =>
    ["--focused-task", `unit:${testPath}`]),
]);

assert.equal(registryPlannerPreparationOptions.runIntentBootstrap, true);

assert.deepEqual(registryPlannerPreparationOptions.packIds, ["shell", "verification_process"]);

assert.equal(registryPlannerPreparationOptions.includeProperties, false);

assert.equal(reviewReadyScopeGuardRequired(true, true), false,
  "the one-time bootstrap uses its exact deferred-task preflight instead of generic all-pack expansion");

assert.equal(reviewReadyScopeGuardRequired(true, false), true,
  "ordinary product evidence retains the generic review-scope guard");

assert.equal(requireEvidenceReceiptRunIntent({}, "review-evidence", {
  allowLegacyResolvedArchive:true,
  candidatePredatesRunIntent:true,
}), "pre-intent-resolved-archive",
"an immutable pre-intent resolved archive retains its historical checkpoint shape");

assert.throws(() => requireEvidenceReceiptRunIntent({}, "review-evidence", {
  allowLegacyResolvedArchive:true,
}), /missing a valid immutable run intent/u,
"archive status without Git-proven pre-intent ancestry cannot waive run intent");

assert.throws(() => requireEvidenceReceiptRunIntent({}, "review-evidence"),
  /missing a valid immutable run intent/u,
"a current evidence receipt cannot omit its immutable run intent");

assert.throws(() => requireEvidenceReceiptRunIntent({ runIntent:"invented" }, "review-evidence", {
  allowLegacyResolvedArchive:true, candidatePredatesRunIntent:true,
}), /missing a valid immutable run intent/u,
"archive compatibility cannot admit an invalid or ambiguous run intent");

assert.throws(() => requireEvidenceReceiptRunIntent({ runIntent:"repair-focused" },
  "review-evidence", { allowLegacyResolvedArchive:true, candidatePredatesRunIntent:true }),
  /cannot support review-evidence/u,
"a present valid intent still must match the archived checkpoint purpose");

assert.equal(await candidatePredatesRunIntentImplementation(
  "66b91e38e6c55d6611daaa572d626ca3dfbb3dd9"), true,
"the authorized bootstrap base is a Git-proven pre-run-intent candidate");

assert.equal(await candidatePredatesRunIntentImplementation("HEAD"), false,
"a candidate containing the run-intent implementation cannot use archive compatibility");

await assert.rejects(() => candidatePredatesRunIntentImplementation("ambiguous-archive-candidate"),
  /unknown revision|Needed a single revision|ambiguous/u,
"an unresolved archive candidate cannot be classified as pre-intent");

const preIntentArchivePacks = await verificationPacksAtCommit(
  "66b91e38e6c55d6611daaa572d626ca3dfbb3dd9", { historicalRegistryFallback:true });

const preIntentBuildIdentity = verificationTaskIdentity(planVerification(preIntentArchivePacks, {
  terminalFull:true, includeProperties:true, historicalRegistryFallback:true,
}).tasks.find(({ key }) => key === "build:dist"));

assert.deepEqual(legacyArchivedCheckpointTaskIdentities({ tasks:{
  [preIntentBuildIdentity.key]:{ identity:preIntentBuildIdentity },
} }, preIntentArchivePacks, timeoutRepairPackIds), [preIntentBuildIdentity],
"a pre-intent archive task remains bound to its candidate registry identity");

assert.throws(() => legacyArchivedCheckpointTaskIdentities({ tasks:{
  [preIntentBuildIdentity.key]:{ identity:{ ...preIntentBuildIdentity, executable:"forged" } },
} }, preIntentArchivePacks, timeoutRepairPackIds), /absent or ambiguous/u,
"archive compatibility rejects a recorded task field that differs from the candidate registry");

const bootstrapExactPlan = { packIds:["flow_graph", "shell"],
  selectedPackIds:["flow_graph", "shell"], includeProperties:true, tasks:[] };

const bootstrapBoundPlan = bindVerificationChangeScope(bootstrapExactPlan, {
  changedPaths:["scripts/run-focused-acceptance.mjs"],
  changeSet:{ version:1, baseCommit:"base", commit:"candidate",
    paths:["scripts/run-focused-acceptance.mjs"] },
  baseCommit:"base", changedOwners:{ "scripts/run-focused-acceptance.mjs":timeoutRepairPackIds },
  changedBoundaries:{}, styleSmokeTargets:[], terminalFullObligations:[],
  changedStyleTargets:{}, adapterAuthorizationPackIds:[],
});

assert.deepEqual(bootstrapBoundPlan.packIds.toSorted(), ["flow_graph", "shell"],
  "bootstrap preserves its exact authorized execution packs");

assert.deepEqual(bootstrapBoundPlan.changedPaths, ["scripts/run-focused-acceptance.mjs"],
  "bootstrap evidence retains the full canonical change set");

const bootstrapPackRegistry = await loadVerificationPacks();

const bootstrapObservationPlan = bindRunIntentBootstrapPlan(
  planVerification(bootstrapPackRegistry, { packIds:["flow_graph", "shell"],
    includeProperties:true }), bootstrapBoundPlan, bootstrapPackRegistry);

const bootstrapObservationKeys = bootstrapObservationPlan.tasks
  .filter(({ stage }) => stage === "browser-observation").map(({ key }) => key);

assert(bootstrapObservationKeys.includes("browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET"),
  "the exact bootstrap plan includes the deferred Studio QA-only observation");

assert(bootstrapObservationKeys.includes("browser-observation:SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET"),
  "the exact bootstrap plan includes the deferred Side Panel QA-only observation");

assert(bootstrapObservationKeys.includes(
  "browser-observation:FLOW_GRAPH_EXAMPLES_TARGET+FLOW_GRAPH_LEGACY_TARGET+" +
  "FLOW_STYLESHEET_EXTRACTION_TARGET+FLOW_WORKSPACE_AUTHORING_TARGET+FLOW_WORKSPACE_CONTROLS_TARGET"),
"the exact bootstrap plan retains the current Flow successor batch");

assert.equal(focusedAcceptanceOptions([
  "--pack", "schemas", "--changed-since", "base", "--property",
  "--prepare-evidence", "task-17", "--resume-receipt", "tmp/verification-receipts/prior.json",
]).resumeReceipt, "tmp/verification-receipts/prior.json");

assert.deepEqual(focusedAcceptanceOptions([
  "--pack", "schemas", "--browser-target", "ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER",
]).browserTargetIds, ["ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER"]);

assert.equal(focusedAcceptanceOptions([
  "--timeout-diagnostic-retry", "incident-1",
]).timeoutDiagnosticRetry, "incident-1");

assert.equal(focusedAcceptanceOptions([
  "--pack", "schemas", "--changed-since", "base", "--property",
  "--prepare-evidence", "task-17", "--timeout-repair-incident", "incident-1",
]).timeoutRepairIncident, "incident-1");

for (const invalid of [
  ["--pack"],
  ["--pack", "schemas", "--pack", "schemas"],
  ["--pack", "Schemas"],
  ["--pack", "schemas", "--shard", "1/2"],
  ["--pack", "schemas", "--no-build"],
  ["--full", "--property"],
  ["--pack", "schemas", "--changed", "src/a.ts", "--changed-since", "base"],
  ["--pack", "schemas", "--record-evidence", "task"],
  ["--pack", "schemas", "--run-intent-bootstrap"],
  ["--pack", "schemas", "--browser-target", "A", "--changed", "src/a.ts"],
  ["--pack", "schemas", "--changed-since", "base", "--prepare-evidence", "task"],
  ["--timeout-diagnostic-retry", "incident-1", "--pack", "schemas"],
  ["--timeout-repair-incident", "incident-1", "--pack", "schemas"],
  ["--pack", "schemas", "--resume-receipt", "docs/prior.json"],
  ["--wat"],
]) assert.throws(() => focusedAcceptanceOptions(invalid));

await assert.rejects(() => validateExplicitChangedPaths(["test/definitely-deleted-verification-path.mjs"]),
  /Use --changed-since for deletes and renames/u);

const historicalTimeout = JSON.parse(await readFile(
  new URL("../fixtures/vtd014-historical-capture-timeout.json", import.meta.url), "utf8",
));

const historicalClassification = classifyHistoricalTimeoutFixture(historicalTimeout);

assert.equal(historicalClassification.boundary, "artifact/setup");

assert.equal(historicalClassification.retry.kind, "setup");

assert.equal(historicalClassification.retry.phase, "dist-artifact-lock");

assert.deepEqual(historicalClassification.retry.logicalTargetIds, []);

assert.equal(historicalClassification.excludedPassedTaskCount, 274);

assert.equal(historicalClassification.retroactiveIncident, false);

const progressTracker = createVerificationProgressTracker({ taskKey:"browser-observation:A+B", maximumStateCharacters:80 });

assert.equal(progressTracker.accept({ version:1, sequence:1, monotonicMs:10,
  boundary:"process", state:{ status:"started" } }), true);

assert.equal(progressTracker.accept({ version:1, sequence:2, monotonicMs:20,
  boundary:"target", logicalTargetId:"A", state:{ status:"started" } }), true);

assert.equal(progressTracker.accept({ version:1, sequence:3, monotonicMs:30,
  boundary:"target", logicalTargetId:"A", phase:"persistence",
  state:{ value:"x".repeat(200) } }), true);

assert.equal(progressTracker.accept({ version:1, sequence:3, monotonicMs:31,
  boundary:"target", logicalTargetId:"B", phase:"assertion" }), false,
"duplicate and out-of-order progress cannot replace the last trusted boundary");

assert.equal(progressTracker.snapshot().logicalTargetId, "A");

assert.equal(progressTracker.snapshot().phase, "persistence");

assert.ok(JSON.stringify(progressTracker.snapshot().state).length <= 82,
  "last progress state remains bounded independently of ordinary output truncation");

assert.deepEqual(diagnosticRetryScope({ task:{ stage:"browser-observation", args:[
  "scripts/run-browser-observation.mjs", "A", "B",
] }, lastProgress:{ boundary:"target", logicalTargetId:"A", phase:"persistence" } }), {
  kind:"target", logicalTargetIds:["A"], executionArgs:["scripts/run-browser-observation.mjs", "A"],
});

assert.deepEqual(diagnosticRetryScope({ task:{ stage:"browser-observation", args:[
  "scripts/run-browser-observation.mjs", "A", "B",
] }, lastProgress:{ boundary:"artifact/setup", phase:"dist-artifact-lock" } }), {
  kind:"setup", phase:"dist-artifact-lock", logicalTargetIds:[],
  executionArgs:["scripts/run-browser-observation.mjs", "--setup-only"],
});

assert.throws(() => diagnosticRetryScope({ task:{ stage:"browser-observation", args:[] } }),
  /trusted progress/u);

const assertionProgress = createVerificationProgressTracker({ taskKey:"browser-observation:TARGET-A" });

assert.equal(assertionProgress.accept({
  version:1, sequence:1, monotonicMs:10, boundary:"target", taskKey:"browser-observation:TARGET-A",
  logicalTargetId:"TARGET-A", phase:"assertion", caseId:"property-set-settles",
  assertionSite:"property-set-workflow.mjs:184", failureFingerprint:"f".repeat(64),
  state:{ settled:false },
}), true);

assert.deepEqual(assertionProgress.snapshot(), {
  version:1, sequence:1, monotonicMs:10, boundary:"target", taskKey:"browser-observation:TARGET-A",
  logicalTargetId:"TARGET-A", phase:"assertion", caseId:"property-set-settles",
  assertionSite:"property-set-workflow.mjs:184", failureFingerprint:"f".repeat(64),
  state:{ settled:false },
}, "assertion progress retains its executable case, assertion site, and fingerprint");

assert.deepEqual(diagnosticRetryScope({
  task:{ key:"acceptance:feature", stage:"acceptance", args:["run", "feature"] },
  lastProgress:{ boundary:"process", caseId:"scenario-17", executionArgs:["run", "feature", "scenario-17"] },
}), {
  kind:"case", caseId:"scenario-17", executionArgs:["run", "feature", "scenario-17"],
}, "a stable executable case is the smallest diagnostic retry boundary");

const unboundedCaseProgress = createVerificationProgressTracker({ taskKey:"acceptance:feature" });

assert.equal(unboundedCaseProgress.accept({
  version:1, sequence:1, monotonicMs:1, boundary:"process", caseId:"scenario-17",
  executionArgs:Array.from({ length:33 }, (_, index) => `argument-${index}`),
}), false, "unbounded executable case commands cannot enter trusted progress");

assert.equal(unboundedCaseProgress.snapshot(), undefined);

const workspaceRestrictionRepository = await mkdtemp(path.join(os.tmpdir(), "vtd014-workspace-store-"));

let workspaceRestrictionRecorded = false;

try {
  await exec("git", ["init", "-q"], { cwd:workspaceRestrictionRepository });
  const restrictedStore = createTimeoutIncidentStore({ root:workspaceRestrictionRepository });
  const restrictedContext = createVerificationReceiptContext(1, 1, {
    receiptDirectory:path.join(workspaceRestrictionRepository, "receipts"),
    runIntent:verificationRunIntents.review,
  });
  restrictedContext.receipt.candidate = { commit:"workspace-restricted", tree:"workspace-tree" };
  const restrictedRunner = createAuthorizedTestCommandRunner(restrictedContext, {
    incidentStore:restrictedStore,
  });
  const restrictedFailureTask = {
    key:"unit:workspace-restricted-failure", stage:"unit", packId:"shell",
    executable:process.execPath, args:["-e", "process.exitCode=19"],
    target:"workspace-restricted-failure", environment:null, requiredCapabilities:[],
    display:"workspace-restricted failure fixture",
  };
  await assert.rejects(() => restrictedRunner(restrictedFailureTask.display, restrictedFailureTask),
    /Verification command failed \(19\)/u);
  const restrictedIncidents = await restrictedStore.list();
  workspaceRestrictionRecorded = restrictedIncidents.length === 1 &&
    restrictedIncidents[0].failure.task.key === restrictedFailureTask.key;
  assert.equal(workspaceRestrictionRecorded, true,
    "a real workspace-only failure remains recorded in repository-common writable state");
  assert.equal(restrictedContext.receipt.tasks[restrictedFailureTask.key].reliabilityIncidentId,
    restrictedIncidents[0].id,
  "the failed focused receipt and durable repository-common incident remain linked");
} finally {
  const restrictedStoreDirectory = await defaultStoreDirectory(workspaceRestrictionRepository);
  await rm(path.dirname(restrictedStoreDirectory), { recursive:true, force:true });
  await rm(workspaceRestrictionRepository, { recursive:true, force:true });
}

const rawRegisteredCommandsIneligible = focusedSelectorOptions.focusedTaskKeys.length === 1;

const incidentFixtureRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-incident-contract-"));

let vtd014Evidence;

let runIntentDiagnosticIsolationObserved = false;

let runIntentReviewIncidentObserved = false;

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
      "unit:test/verification-contracts/execution-checkpoint-contract-test.mjs",
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
    "unit:test/verification-contracts/execution-checkpoint-contract-test.mjs",
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
  const regressionKey = "unit:test/verification-contracts/execution-checkpoint-contract-test.mjs";
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
  const focusedReceiptPath = await writeRunnerReceipt("repair-focused", {
    ...repairReceiptBase, plan:{ mode:"timeout-repair-focused", incidentId:first.id,
      causalCategory, causalExplanation, taskPlan:focusedTaskPlan,
      executionTaskPlan:focusedExecutionTaskPlan }, tasks:{
      [buildIdentity.key]:{ identity:buildIdentity, status:"passed", provenance:"fresh", durationMs:1 },
      [failure.task.key]:{ identity:failure.task, status:"passed", provenance:"fresh", durationMs:1,
        execution:{ args:first.failure.retryScope.executionArgs, logicalTargetIds:[] } },
      [regressionKey]:{ identity:timeoutCanonicalIdentities.find(({ key }) => key === regressionKey),
        status:"passed", provenance:"fresh", durationMs:1,
        output:`${JSON.stringify(regressionProtocol)}\n` },
    },
  });
  const writeFocusedCausalReceipt = async(name, protocol) => writeRunnerReceipt(name, {
    ...repairReceiptBase, plan:{ mode:"timeout-repair-focused", incidentId:first.id,
      causalCategory, causalExplanation, taskPlan:focusedTaskPlan,
      executionTaskPlan:focusedExecutionTaskPlan }, tasks:{
      [buildIdentity.key]:{ identity:buildIdentity, status:"passed", provenance:"fresh", durationMs:1 },
      [failure.task.key]:{ identity:failure.task, status:"passed", provenance:"fresh", durationMs:1,
        execution:{ args:first.failure.retryScope.executionArgs, logicalTargetIds:[] } },
      [regressionKey]:{ identity:timeoutCanonicalIdentities.find(({ key }) => key === regressionKey),
        status:"passed", provenance:"fresh", durationMs:1,
        ...(protocol ? { output:`${JSON.stringify({ swarmforgeTimeoutRepairRegression:protocol })}\n` }
          : {}) },
    },
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
          ...compactReorderableEditorAcceptanceArtifacts].includes(value));
      identity.target = identity.target.split(",")
        .filter((value) => ![vtd014ApprovedVtd015Feature, vtd014ApprovedVtd017Feature,
          vtd014ApprovedAutonomyFeature,...compactReorderableEditorFeatures]
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

const sharedArtifactEvents = [];

let releaseSharedArtifact;

const sharedArtifactPlan = {
  preparationTasks:[{
    key:"build:dist", stage:"build", executable:"npm", args:["run", "build"],
    display:"npm run build",
  }],
  unitTasks:[], propertyTasks:[], browserTasks:[], parserTasks:[], generatorTasks:[],
  checkpointTasks:[], sessionTasks:[], unitCommands:[], parserCommands:[],
  observationTasks:["one", "two"].map((name) => ({
    key:`browser-observation:${name}`, stage:"browser-observation", packId:name,
    executable:"node", args:[name], target:name, display:`node ${name}`,
  })),
};

let activeSharedArtifactTasks = 0;

let maximumSharedArtifactTasks = 0;

const sharedArtifactMetrics = await executeAcceptancePlan(sharedArtifactPlan, {
  observationConcurrency:2,
  acquireArtifactLease:async() => {
    sharedArtifactEvents.push("lease-acquired");
    return {
      token:"coordinator-token", waitMs:7,
      release:async() => { sharedArtifactEvents.push("lease-released"); releaseSharedArtifact?.(); },
    };
  },
  afterPreparation:async() => sharedArtifactEvents.push("artifact-validated"),
  runCommand:async(_display, task) => {
    sharedArtifactEvents.push(`start:${task.key}`);
    if (task.stage === "build") return;
    assertReadOnlyArtifactLease(task);
    activeSharedArtifactTasks += 1;
    maximumSharedArtifactTasks = Math.max(maximumSharedArtifactTasks, activeSharedArtifactTasks);
    await new Promise((resolve) => setTimeout(resolve, 20));
    activeSharedArtifactTasks -= 1;
    sharedArtifactEvents.push(`finish:${task.key}`);
  },
});

const acceptedThreeWorkers = decideBrowserObservationWorkers({
  acceptedTwoWorker:{ mode:"normal", packId:"layered_schema", durationMs:220_000, passed:true },
  candidateThreeWorkerNormal:{ mode:"normal", packId:"layered_schema", durationMs:150_000,
    passed:true, collisions:[] },
  candidateThreeWorkerLoaded:{ mode:"loaded", packId:"layered_schema", durationMs:165_000,
    passed:true, collisions:[] },
});

let outsideWriterWasBlocked = false;

let failedParallelLeaseReleased = false;

const packs = await loadVerificationPacks();

await validateVerificationPacks(packs);

const cardinalityProcessInput = {
  evidenceTask:"registry-derived-verification-packs",
  packs,
  plan:{
    changedPaths:["scripts/verification-pack-cardinality/contract.mjs"],
    tasks:["unit:test/verification-pack-cardinality-contract-test.mjs",
      "unit:test/settled-final-verification-workflow-test.mjs",
      "unit:test/verification-evidence-production-path-test.mjs",
      "unit:test/verification-process-contract-test.mjs",
      "property:test/workspace-tabs-property-test.mjs", "acceptance-session:shell",
      "package:extension"].map((key) => ({ key })),
    includeProperties:true,
  },
  terminalFull:false,
};

assert.throws(() => validateRegistryCardinalityReviewPreflight({
  ...cardinalityProcessInput,
  packs:packs.map((pack) => pack.id === "shell"
    ? { ...pack, globalImpact:[...pack.globalImpact, "scripts/verification-pack-cardinality/"] }
    : pack),
}), /globally impactful/u,
"the process preflight rejects restored cardinality global impact");

assert.throws(() => validateRegistryCardinalityReviewPreflight({
  ...cardinalityProcessInput,
  packs:packs.map((pack) => pack.id === "shell" ? {
    ...pack,
    verificationSlices:pack.verificationSlices.map((slice) =>
      slice.id === "verification_pack_cardinality_contract"
        ? { ...slice, consumers:[{ packId:"shell", sliceId:"eligible_repair_admission" }] }
        : slice),
  } : pack),
}), /exact verification_process task-batching consumer/u,
"the process preflight rejects a cardinality registry consumer");

await assert.rejects(() => validateVerificationPacks(packs.map((pack) =>
  pack.id === "project_management" ? { ...pack, executionPrerequisites:[{
    path:"test/flow-examples-timing-test.mjs", requiredCapabilities:["local-loopback"],
  }] } : pack)), /exact registered test execution prerequisite in pack project_management/u,
"a pack cannot grant authority to a task owned by another pack");

const focusedVerificationProcessPlan = selectFocusedVerificationTasks(planVerification(packs, {
  packIds:["verification_process"],
}), ["unit:test/verification-contracts/execution-checkpoint-contract-test.mjs"]);

assert.deepEqual(focusedVerificationProcessPlan.tasks.map(({ key }) => key),
  ["unit:test/verification-contracts/execution-checkpoint-contract-test.mjs"],
"the focused delivery path launches the exact registered unit leaf without unrelated work");

const shortChromeUnitTasks = planVerification(packs, {
  packIds:["flow_graph", "shell"],
}).unitTasks.filter(({ target }) => [
  "test/flow-examples-timing-test.mjs",
  "test/headless-chrome-lifecycle-test.mjs",
].includes(target));

assert.equal(shortChromeUnitTasks.length, 2,
  "both nested production probes remain registered verification tasks");

for (const task of shortChromeUnitTasks) {
  assert.equal(task.temporaryPathClass, "chrome-short",
    `${task.target} receives its short Chrome route before first launch`);
  assert.deepEqual(task.requiredCapabilities, ["local-loopback"],
    `${task.target} declares Chrome socket authority before first launch`);
  assert.equal(Object.hasOwn(verificationTaskIdentity(task), "temporaryPathClass"), false,
    `${task.target} routing metadata does not change canonical topology identity`);
}

const modularVtd007HandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_vtd007_handlers.clj",
  import.meta.url), "utf8");

assert.match(modularVtd007HandlerSource,
  /run-focused-acceptance\.mjs[\s\S]*--focused-task[\s\S]*flow-examples-timing-test\.mjs/u,
  "the nested Flow production probe enters through the registered focused launcher");

assert.match(modularVtd007HandlerSource,
  /run-focused-acceptance\.mjs[\s\S]*--focused-task[\s\S]*headless-chrome-lifecycle-test\.mjs/u,
  "the nested lifecycle production probe enters through the registered focused launcher");

assert.doesNotMatch(modularVtd007HandlerSource,
  /shell\/sh\s+"node"\s+"test\/(?:flow-examples-timing|headless-chrome-lifecycle)-test\.mjs"/u,
  "the acceptance handler cannot bypass focused routing with a raw registered test command");

assert.match(modularVtd007HandlerSource,
  /prepared-task\s+"unit:test\/flow-examples-timing-test\.mjs"/u,
  "the Flow production probe consumes its declared strict-receipt predecessor");

assert.match(modularVtd007HandlerSource,
  /planVerification\(delivered,\{packIds:historicalIds,includeProperties:true,historicalRegistryFallback:true\}\)/u,
  "the delivered registry comparison uses its historical runnable set and explicit compatibility");

assert.match(modularVtd007HandlerSource,
  /planVerification\(base,\{packIds:historicalIds,includeProperties:true,historicalRegistryFallback:true\}\)/u,
  "the base registry comparison uses the delivered historical runnable set and explicit compatibility");

assert.match(modularVtd007HandlerSource,
  /strictCurrentAmbiguityRejected[\s\S]*explicit verification-only production owner/u,
  "the historical adapter does not relax ambiguous current-registry ownership");

assert.doesNotMatch(modularVtd007HandlerSource,
  /planVerification\(current,\{(?:packIds:ids,includeProperties:true|terminalFull:true),historicalRegistryFallback:true\}\)/u,
  "current registry comparisons remain on strict ownership validation");

const modularVtd014HandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_vtd014_handlers.clj",
  import.meta.url), "utf8");

assert.match(modularVtd014HandlerSource,
  /scoped-command-approval\|bwrap-shared-loopback[\s\S]*workspace-sandbox\|bwrap-unshared-network/u,
  "acceptance evidence matches the tested mixed-plan capability isolation boundaries");

const modularVtd006HandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_vtd006_handlers.clj",
  import.meta.url), "utf8");

assert.match(modularVtd006HandlerSource,
  /defn- inventory-handlers[\s\S]*assoc \(prepared world\)[\s\S]*pack-facts world/u,
  "the VTD-006 inventory boundary loads production evidence before reading pack facts");

const modularEventLibraryHandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_event_library_handlers.clj",
  import.meta.url), "utf8");

assert.match(modularEventLibraryHandlerSource, /= \[9 1 8 3 0 1 29\]/u,
  "Event Library acceptance conserves the exact 29-task accepted-base plan");

const focusedPropertyPlan = selectFocusedVerificationTasks(planVerification(packs, {
  packIds:["shell"], includeProperties:true,
}), ["property:test/workspace-tabs-property-test.mjs"]);

assert.deepEqual(focusedPropertyPlan.tasks.map(({ key }) => key),
  ["property:test/workspace-tabs-property-test.mjs"],
"the focused delivery path launches the exact registered property leaf");

const focusedAcceptancePlan = selectFocusedVerificationTasks(planVerification(packs, {
  packIds:["shell"],
}), ["acceptance-session:shell"], planVerification(packs, {
  packIds:timeoutRepairPackIds, includeProperties:true,
}));

assert.equal(focusedAcceptancePlan.tasks[0].key, "build:dist");

assert.equal(focusedAcceptancePlan.tasks.at(-1).key, "acceptance-session:shell");

assert.deepEqual(focusedAcceptancePlan.tasks.at(-1).requiredCapabilities, [],
  "an acceptance session does not inherit authority from separately launched unit tasks");

assert.equal(focusedAcceptancePlan.tasks.at(-1).temporaryPathClass, "workspace",
  "an acceptance session keeps its own workspace route");

const currentAcceptanceIdentity = verificationTaskIdentity(focusedAcceptancePlan.tasks.at(-1));

const legacyAcceptancePrerequisite = {
  key:currentAcceptanceIdentity.key,
  requiredCapabilities:["local-loopback"], route:"scoped-command-approval",
};

const legacyAcceptanceResult = {
  identity:{ ...currentAcceptanceIdentity, requiredCapabilities:["local-loopback"] },
  executionPrerequisites:{
    requiredCapabilities:["local-loopback"], launchRoute:"scoped-command-approval",
  },
};

assert.equal(legacyAcceptanceSessionPrerequisiteCompatibility({
  allowed:true, task:focusedAcceptancePlan.tasks.at(-1), identity:currentAcceptanceIdentity,
  prerequisite:legacyAcceptancePrerequisite, result:legacyAcceptanceResult,
}), true, "archived incident evidence accepts the former inherited acceptance-session route");

assert.equal(legacyAcceptanceSessionPrerequisiteCompatibility({
  allowed:false, task:focusedAcceptancePlan.tasks.at(-1), identity:currentAcceptanceIdentity,
  prerequisite:legacyAcceptancePrerequisite, result:legacyAcceptanceResult,
}), false, "new checkpoints cannot opt into the historical acceptance-session route");

assert.equal(legacyAcceptanceSessionPrerequisiteCompatibility({
  allowed:true, task:focusedAcceptancePlan.tasks.at(-1), identity:currentAcceptanceIdentity,
  prerequisite:legacyAcceptancePrerequisite,
  result:{ ...legacyAcceptanceResult, executionPrerequisites:{
    requiredCapabilities:["local-loopback"], launchRoute:"workspace-sandbox",
  } },
}), false, "archived route compatibility remains bound to its recorded execution result");

assert.ok(focusedAcceptancePlan.parserTasks.length > 0 &&
  focusedAcceptancePlan.parserTasks.length === focusedAcceptancePlan.generatorTasks.length &&
  focusedAcceptancePlan.unitTasks.length > 0 && focusedAcceptancePlan.browserTasks.length > 0 &&
  focusedAcceptancePlan.tasks.some(({ key }) => key === "unit:test/flow-examples-timing-test.mjs"),
"the focused acceptance session retains every owning strict-receipt prerequisite");

const ordinaryShellPlan = closeVerificationPlanPrerequisites(planVerification(packs, {
  packIds:["shell"],
}), planVerification(packs, { packIds:timeoutRepairPackIds }));

assert.ok(ordinaryShellPlan.tasks.some(({ key }) => key === "unit:test/flow-examples-timing-test.mjs"),
  "ordinary pack execution receives the same cross-pack strict-receipt closure");

assert.ok(ordinaryShellPlan.tasks.indexOf(ordinaryShellPlan.tasks.find(({ key }) =>
  key === "unit:test/flow-examples-timing-test.mjs")) <
  ordinaryShellPlan.tasks.indexOf(ordinaryShellPlan.tasks.find(({ key }) =>
    key === "acceptance-session:shell")),
"the ordinary cross-pack predecessor runs before its acceptance consumer");

const evidenceCommandPaletteShellPlan = closeCanonicalEvidencePlanPrerequisites(
  planVerification(packs, {
    packIds:["command-palette", "shell"],
    includeProperties:true,
  }),
  packs,
);

assert.deepEqual(evidenceCommandPaletteShellPlan.requestedPackIds,
  ["command-palette", "shell"],
  "evidence prerequisite closure does not widen the requested pack set");

assert.ok(evidenceCommandPaletteShellPlan.tasks.some(({ key }) =>
  key === "unit:test/flow-examples-timing-test.mjs"),
"evidence validation uses the repository-wide canonical satisfier registry");

const runnerCommandPaletteShellPlan = closeVerificationPlanPrerequisites(
  planVerification(packs, {
    packIds:["command-palette", "shell"],
    includeProperties:true,
  }),
  planVerification(packs, {
    packIds:timeoutRepairPackIds,
    includeProperties:true,
  }),
);

assert.deepEqual(evidenceCommandPaletteShellPlan.tasks.map(({ key }) => key),
  runnerCommandPaletteShellPlan.tasks.map(({ key }) => key),
  "runner and evidence validation close over the same exact task identities");

const prerequisiteTerminalPlan = planVerification(packs, { terminalFull:true });

const closedTerminalPlan = closeVerificationPlanPrerequisites(prerequisiteTerminalPlan,
  planVerification(packs, { packIds:timeoutRepairPackIds,
    includeProperties:prerequisiteTerminalPlan.includeProperties }));

assert.ok(closedTerminalPlan.tasks.some(({ key }) =>
  key === "checkpoint:shell:prepared-dist-freshness"),
"terminal-only requested leaves remain registered while canonical prerequisites are added");

assert.equal(new Set(closedTerminalPlan.tasks.map(({ key }) => key)).size,
  closedTerminalPlan.tasks.length,
  "terminal prerequisite closure records each canonical or requested task exactly once");

const repairCanonicalPlan = planVerification(packs, {
  packIds:timeoutRepairPackIds, includeProperties:true,
});

const repairHotkeysPlan = selectFocusedVerificationTasks(repairCanonicalPlan,
  ["acceptance-session:hotkeys"]);

assert.deepEqual(repairHotkeysPlan.tasks.map(({ key }) => key), [
  "build:dist",
  "unit:test/hotkey-installed-controller-test.mjs",
  "browser:test/browser-packs/hotkeys.mjs",
  "acceptance-parse:features/side-panel-hotkey-editor.feature",
  "acceptance-parse:features/side-panel-hotkey-keymap.feature",
  "acceptance-parse:features/side-panel-hotkey-operator-layout.feature",
  "acceptance-generate:features/side-panel-hotkey-editor.feature",
  "acceptance-generate:features/side-panel-hotkey-keymap.feature",
  "acceptance-generate:features/side-panel-hotkey-operator-layout.feature",
  "acceptance-session:hotkeys",
], "repair-focused acceptance closes over only the owning pack's canonical predecessors");

assert.equal(new Set(repairHotkeysPlan.tasks.map(({ key }) => key)).size,
  repairHotkeysPlan.tasks.length,
  "repair-focused prerequisite closure records each predecessor and leaf once");

const repairCanonicalIdentities = repairCanonicalPlan.tasks.map(verificationTaskIdentity);

const repairIdentity = (key) => repairCanonicalIdentities.find((identity) => identity.key === key);

const repairExecutionPlan = timeoutRepairFocusedExecutionTaskPlan([
  { identity:repairIdentity("acceptance-session:hotkeys"), roles:["diagnosed-boundary"] },
  { identity:repairIdentity("unit:test/hotkey-installed-controller-test.mjs"), roles:["causal-regression"] },
], repairCanonicalIdentities);

assert.deepEqual(repairExecutionPlan.map(({ identity }) => identity.key), [
  "build:dist",
  "unit:test/hotkey-installed-controller-test.mjs",
  "browser:test/browser-packs/hotkeys.mjs",
  ...repairHotkeysPlan.parserTasks.map(({ key }) => key),
  ...repairHotkeysPlan.generatorTasks.map(({ key }) => key),
  "acceptance-session:hotkeys",
], "the repair execution plan preserves canonical stage order around its exact repair work");

const predecessorFailure = Object.assign(new Error("generated prerequisite failed"),
  { reliabilityIncidentId:"prerequisite-incident" });

const predecessorLaunches = [];

await assert.rejects(executeTimeoutRepairTaskPlan(repairExecutionPlan, {
  runner:async(_label, task) => {
    predecessorLaunches.push(task.key);
    if (task.key === "build:dist") throw predecessorFailure;
  },
}), (error) => error === predecessorFailure,
"the failed predecessor remains the owning reliability incident");

assert.deepEqual(predecessorLaunches, ["build:dist"],
  "a failed predecessor prevents the repair leaf and every later task from launching");

assert.deepEqual(timeoutRepairFocusedExecutionTaskPlan([
  { identity:repairIdentity("unit:test/hotkey-installed-controller-test.mjs"), roles:["causal-regression"] },
], repairCanonicalIdentities).map(({ identity }) => identity.key),
["unit:test/hotkey-installed-controller-test.mjs"],
"a workspace-only repair unit receives no artifact prerequisites");

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

const focusedPackagePlan = selectFocusedVerificationTasks(planVerification(packs, {
  packIds:["shell"],
}), ["package:extension"]);

assert.deepEqual(focusedPackagePlan.tasks.map(({ key }) => key),
  ["build:dist", "package:extension"],
"the focused package path retains only its required build prerequisite");

const focusedEvidenceCanonicalPlan = planVerification(packs, { packIds:["shell"] });

const focusedEvidenceUnitKey = focusedEvidenceCanonicalPlan.tasks
  .find(({ stage }) => stage === "unit").key;

const focusedEvidencePlan = planPackageTask(selectFocusedVerificationTasks(
  focusedEvidenceCanonicalPlan, [focusedEvidenceUnitKey]), focusedEvidenceCanonicalPlan);

assert.deepEqual(focusedEvidencePlan.tasks.map(({ key }) => key),
  ["build:dist", focusedEvidenceUnitKey, "package:extension"],
"adding evidence packaging re-closes the package build prerequisite around focused units");

const registryPlannerCanonicalPlan = planVerification(packs,
  { packIds:registryPlannerPreparationOptions.packIds });

const registryPlannerFocusedPlan = planPackageTask(selectFocusedVerificationTasks(
  registryPlannerCanonicalPlan, registryPlannerPreparationOptions.focusedTaskKeys),
registryPlannerCanonicalPlan);

assert.equal(registryPlannerPreparationFocusedPlan(registryPlannerFocusedPlan,
  "verification-slice-verification-registry-planner-modularization"), true,
"the exact non-property ownership preparation is an admitted canonical evidence plan");

assert.equal(registryPlannerPreparationFocusedPlan({ ...registryPlannerFocusedPlan,
  tasks:registryPlannerFocusedPlan.tasks.slice(1) },
"verification-slice-verification-registry-planner-modularization"), false,
"the ownership preparation exception rejects a plan missing its build prerequisite");

const repositoryCommonStore = await defaultStoreDirectory(process.cwd());

assert.ok(repositoryCommonStore.startsWith(path.join(os.tmpdir(), "swarmforge-repository-runtime")),
  "the repository-common incident store is writable under the real workspace restriction");

assert.equal(repositoryCommonStore.includes(`${path.sep}.git${path.sep}`), false,
  "ordinary reliability failures do not depend on protected Git metadata");

const repositoryCommonAttempts = await defaultCheckpointAttemptDirectory(process.cwd());

assert.equal(path.dirname(repositoryCommonAttempts), path.dirname(repositoryCommonStore),
  "incidents and checkpoint attempts share one writable repository-common runtime identity");

const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);

const projectManagementPack = packs.find(({ id }) => id === "project_management");

const vtd004CurrentCalibration = JSON.parse(await readFile(
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));

const vtd004CompletedProjectCalibration = JSON.parse(await exec("git", [
  "show", "2d46bc7062:verification/performance-calibration.json",
]));

const projectHandlerPath = projectManagementPack.isolatedVerificationHandlers[0];

const projectHandlerSource = await readFile(new URL(`../../${projectHandlerPath}`, import.meta.url), "utf8");

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

const projectServedFeatures = [...projectHandlerSource.matchAll(
  /"(features\/[A-Za-z0-9_./-]+\.feature)"/gu,
)].map((match) => match[1]);

const projectHandlerConsumers = [];

const projectHistoryChange = (entry) => syntheticChangeSet([entry]);

const deletedProjectPresentation = projectHistoryChange({
  status:"D", path:"src/data-layer-assignment-routing-ui.ts",
});

const renamedBetweenPresentations = projectHistoryChange({status:"R", score:100,
  oldPath:"src/data-layer-assignment-routing-ui.ts",
  newPath:"src/data-layer-project-library-presentation-ui.ts"});

const renamedIntoPersistence = projectHistoryChange({status:"R", score:100,
  oldPath:"src/data-layer-assignment-routing-ui.ts", newPath:"src/data-layer-project-library.ts"});

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

const projectExecutionProfile = Object.fromEntries(exactEvidenceKeys.map((key) => [key,
  projectManagementPack[key].filter((path) => !vtd006RegisteredPrograms.has(path)),
]));

const exactProjectPlan = planVerification(packs, {packIds:["project_management"], includeProperties:true});

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

const currentOtherPackRows = vtd004CompletedProjectCalibration.runnablePacks.filter(({ id }) =>
  id !== "project_management");

const vtd004Acceptance = {
  currentPlans:Object.fromEntries([
    ...["src/data-layer-assignment-routing-ui.ts", "src/data-layer-project-library-presentation-ui.ts",
      "src/data-layer-project-entity-lifecycle.ts", "src/data-layer-page-authoring.ts",
      "src/data-layer-assignment-routing.ts", "src/data-layer-project-library.ts",
      "src/data-layer-project-library-ui.ts"].map((changedPath) => [changedPath,
      planVerification(packs, {changedPaths:[changedPath], includeProperties:true}).packIds]),
    [projectHandlerPath, planVerification(packs, {changedPaths:[projectHandlerPath],
      includeProperties:true}).packIds],
  ]),
  historyPlans:{
    delete:planVerification(packs, {changedPaths:deletedProjectPresentation.paths,
      changeSet:deletedProjectPresentation, basePacks:packs}).packIds,
    renamePresentation:planVerification(packs, {changedPaths:renamedBetweenPresentations.paths,
      changeSet:renamedBetweenPresentations, basePacks:packs}).packIds,
    renamePersistence:planVerification(packs, {changedPaths:renamedIntoPersistence.paths,
      changeSet:renamedIntoPersistence, basePacks:packs}).packIds,
    unreadable:planVerification(packs, {changedPaths:deletedProjectPresentation.paths,
      changeSet:deletedProjectPresentation, basePacks:packs,
      historicalRegistryFallback:true}).packIds,
  },
  handler:{path:projectHandlerPath, servedFeatures:projectServedFeatures,
    consumers:projectHandlerConsumers, negativeMutationRejected:true,
    ownerPlan:planVerification(packs, {changedPaths:[projectHandlerPath], includeProperties:true}).packIds},
  conservation:{evidenceProfile:projectEvidenceProfile, executionProfile:projectExecutionProfile,
    exactTaskTargets:Object.fromEntries(["unitTasks", "propertyTasks", "parserTasks", "browserTasks"]
      .map((key) => [key, exactProjectPlan[key].map(({ target }) => target)])),
    conservedTaskTargets:Object.fromEntries(["unitTasks", "propertyTasks", "parserTasks", "browserTasks"]
      .map((key) => [key, exactProjectPlan[key].map(({ target }) => target)
        .filter((target) => !sidePanelPreparationProgram(target))])),
    handlerSessions:exactProjectPlan.sessionTasks.map(({ packId }) => packId),
    terminalTaskIdentitiesConserved:true, packageCheckCount:1},
  calibration:{current:vtd004CompletedProjectCalibration.runnablePacks.find(({ id }) => id === "project_management"),
    otherPackRowsConserved:true, browserTargetRowsConserved:true, provenanceConserved:true,
    otherPackCount:currentOtherPackRows.length,
    browserTargetCount:Object.keys(vtd004CompletedProjectCalibration.browserTargets).length},
};

const durablePack = packs.find(({id}) => id === "durable_project_repository");

const durableCompletedCalibration = JSON.parse(await exec("git", [
  "show", "82e704bdc8:verification/performance-calibration.json",
]));

const durablePresentationPath = "src/data-layer-durable-project-repository-presentation-ui.ts";

const durableControllerPath = "src/data-layer-durable-project-repository-ui.ts";

const durableClosure = ["durable_project_repository", "flow_graph", "flow_export", "live_flow_testing",
  "layered_schema", "property_set_flow_sections"];

const durableCurrentPaths = [durablePresentationPath, "src/data-layer-durable-project-repository.ts",
  "src/data-layer-production-model.ts", durableControllerPath, "src/data-layer-durable-project-runtime.ts",
  "src/data-layer-compact-canonical-history.ts", "src/utilities/data-layer/saved-schema-feed.ts"];

const durableHandlerPath = durablePack.isolatedVerificationHandlers[0];

const durableHandlerSource = await readFile(new URL(`../../${durableHandlerPath}`, import.meta.url), "utf8");

const durableServedFeatures = [...durableHandlerSource.matchAll(
  /"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)].map((match) => match[1]);

const durableConsumers = [];

const durableEvidenceProfile = conservedEvidenceProfile(durablePack);

const exactDurablePlan = planVerification(packs, {packIds:["durable_project_repository"],includeProperties:true});

const durableAssertionLeafCount = durablePack.browserEvidencePartitions.flatMap(({originalLeaves}) => originalLeaves).length;

const durableCurrentCalibration = durableCompletedCalibration.runnablePacks.find(({id}) =>
  id === "durable_project_repository");

const durableOtherCurrent = durableCompletedCalibration.runnablePacks.filter(({id}) => id !== "durable_project_repository");

const vtd004DurableAcceptance = {
  currentPlans:Object.fromEntries(durableCurrentPaths.map((changedPath) => [changedPath,
    planVerification(packs,{changedPaths:[changedPath],includeProperties:true}).packIds])),
  historyPlans:{delete:["durable_project_repository"],renameController:durableClosure,
    unreadable:planVerification(packs,{terminalFull:true}).packIds},
  handler:{path:durableHandlerPath,servedFeatures:durableServedFeatures,consumers:durableConsumers,
    negativeMutationRejected:true,ownerPlan:planVerification(packs,{changedPaths:[durableHandlerPath]}).packIds},
  conservation:{evidenceProfile:durableEvidenceProfile,
    exactTaskCounts:{unit:durableEvidenceProfile.unit.length,property:durableEvidenceProfile.property.length,
      features:exactDurablePlan.parserTasks.length,handlers:exactDurablePlan.sessionTasks.length,
      adapters:durablePack.browserAdapters.length,targets:exactDurablePlan.observationTasks
        .flatMap(({logicalTargetIds}) => logicalTargetIds).length,leaves:durableAssertionLeafCount},
    executionTaskCounts:{unit:exactDurablePlan.unitTasks.length,
      property:exactDurablePlan.propertyTasks.length,exact:exactDurablePlan.tasks.length},
    terminalTaskIdentitiesConserved:true,packageCheckCount:1},
  calibration:{current:durableCurrentCalibration,otherPackRowsConserved:true,
    browserTargetRowsConserved:true,provenanceConserved:true,otherPackCount:durableOtherCurrent.length,
    browserTargetCount:Object.keys(durableCompletedCalibration.browserTargets).length},
  presentationBoundary:true,
};

const eventLibraryPack = packs.find(({id}) => id === "event-library");

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

const eventHandlerEvidence = [];

const captureRejection = captureRequiredRejection;

const loadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs, {
  findLoadedStepConsumers:async() => [{
    handler:"acceptance/src/acceptance/steps/event_template_library.clj",
    consumerPack:"project_event_transport",
    feature:"features/data-layer-project-event-transport-settings.feature",
    step:"<project> is active",
  }],
}));

const eventCrossPackHandler = packs.find(({id}) => id === "project_event_transport").handlers[0];

const namespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs, {
  readSource:async(handlerPath) => {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
  return handlerPath === eventCrossPackHandler
    ? `${source}\n[acceptance.steps.event-template-library :refer [handlers]]\n` : source;
}}));

const nonIsolatedEventPacks = replacePack(packs, "event-library", (pack) => ({
  isolatedVerificationHandlers:[],
}));

const rejectedHandlerPlan = planVerification(nonIsolatedEventPacks, {
  changedPaths:["acceptance/src/acceptance/steps/event_template_library.clj"],
}).packIds;

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

const eventEvidenceProfile = conservedEvidenceProfile(eventLibraryPack);

const exactEventPlan = planVerification(packs,{packIds:["event-library"],includeProperties:true});

const acceptedEventPlan = planVerification(vtd008BasePacks,
  {packIds:["event-library"],includeProperties:true,historicalRegistryFallback:true});

const eventCompletedCalibration = JSON.parse(await exec("git", [
  "show", "be319ad555:verification/performance-calibration.json",
]));

const eventCalibration = eventCompletedCalibration.runnablePacks.find(({id}) => id === "event-library");

const eventBaseCalibration = eventLibraryBaseCalibration.runnablePacks.find(({id}) => id === "event-library");

const eventOtherCurrent = eventCompletedCalibration.runnablePacks.filter(({id}) => id !== "event-library");

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

const shellPlan = planVerification(packs, { packIds:["shell"] });

const bootstrapBase = await validateRunIntentBootstrapBase({
  root:"fixture", baseCommit:"approved-contract-base",
  changedPaths:["scripts/verification-run-intent.mjs"],
  readCommitFile:async(_root, _commit, file) => file.endsWith("modular-verification-packs.feature")
    ? "Modular verification packs 159\nModular verification packs 160\n" : null,
});

const registryPlannerFeature = [18, 19, 20]
  .map((number) => `Verification registry and planner modularization 0${number}`).join("\n");

const registryPlannerBasePacks = packs.filter(({ id }) => id !== "verification_process");

const registryPlannerBootstrapPacks = [...registryPlannerBasePacks, {
  id:"verification_process", source:[], dependencies:[], unit:[], property:[], features:[],
  plannedFeatures:["features/verification-registry-planner-modularization.feature"],
  handlers:[], browserAdapters:[], browserAdapterModes:[], browserObservations:[],
  checkpointCommands:[],
}];

const registryPlannerBootstrap = verificationRegistryPlannerBootstrapEligibility({
  baseCommit:"ef899ddb417b70c4136a5d2b419431e38673c172", feature:registryPlannerFeature,
  registry:JSON.stringify(registryPlannerBasePacks), candidatePacks:registryPlannerBootstrapPacks,
  changedPaths:[
    "scripts/run-focused-acceptance.mjs",
    "scripts/settled-final-verification.mjs",
    "scripts/verification-evidence.mjs",
    "scripts/verification-reliability-persistence.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-runtime.mjs",
    "scripts/verification-reliability-store.mjs",
    "scripts/verification-run-intent.mjs",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/verification-process-contract-test.mjs",
    "verification/packs.json",
  ],
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
});

assert.equal(registryPlannerBootstrap.kind, "verification-registry-planner-ownership");

assert.equal(registryPlannerBootstrap.terminalConserved, true);

assert.throws(() => verificationRegistryPlannerBootstrapEligibility({
  baseCommit:"ef899ddb417b70c4136a5d2b419431e38673c172", feature:registryPlannerFeature,
  registry:JSON.stringify(registryPlannerBasePacks),
  candidatePacks:[...registryPlannerBootstrapPacks, {
    id:"unauthorized_metadata", source:[], dependencies:[], unit:[], property:[], features:[],
    plannedFeatures:[], handlers:[], browserAdapters:[], browserAdapterModes:[],
    browserObservations:[], checkpointCommands:[],
  }],
  changedPaths:[
    "scripts/run-focused-acceptance.mjs",
    "scripts/settled-final-verification.mjs",
    "scripts/verification-evidence.mjs",
    "scripts/verification-reliability-persistence.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-runtime.mjs",
    "scripts/verification-reliability-store.mjs",
    "scripts/verification-run-intent.mjs",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/verification-process-contract-test.mjs",
    "verification/packs.json",
  ],
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
}), /exact registry delta/u,
"the ownership bootstrap rejects an additional non-runnable metadata pack");

assert.throws(() => verificationRegistryPlannerBootstrapEligibility({
  baseCommit:"unrelated-base", feature:registryPlannerFeature,
  registry:JSON.stringify(registryPlannerBasePacks), candidatePacks:registryPlannerBootstrapPacks,
  changedPaths:[
    "scripts/run-focused-acceptance.mjs",
    "scripts/settled-final-verification.mjs",
    "scripts/verification-evidence.mjs",
    "scripts/verification-reliability-persistence.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-runtime.mjs",
    "scripts/verification-reliability-store.mjs",
    "scripts/verification-run-intent.mjs",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/verification-process-contract-test.mjs",
    "verification/packs.json",
  ],
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
}), /authorized base lineage/u,
"the ownership bootstrap rejects an arbitrary base label");

assert.throws(() => verificationRegistryPlannerBootstrapEligibility({
  baseCommit:"ef899ddb417b70c4136a5d2b419431e38673c172", feature:registryPlannerFeature,
  registry:JSON.stringify(registryPlannerBasePacks), candidatePacks:registryPlannerBootstrapPacks,
  changedPaths:[
    "scripts/run-focused-acceptance.mjs",
    "scripts/settled-final-verification.mjs",
    "scripts/verification-reliability-persistence.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-runtime.mjs",
    "scripts/verification-reliability-store.mjs",
    "scripts/verification-run-intent.mjs",
    "src/data-layer-installed/runtime.ts",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/verification-process-contract-test.mjs",
    "verification/packs.json",
  ],
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
}), /bounded preparation paths/u,
"the ownership bootstrap rejects product or later-task implementation paths");

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

assert.equal(bootstrapCoverage[0].selectedTaskKey, bootstrapTask.key);

const confirmedFlakyBootstrapIncident = {
  ...structuredClone(bootstrapIncident),
  id:"bootstrap-confirmed-flaky-deferred",
  repair:undefined,
  failure:{ ...structuredClone(bootstrapIncident.failure),
    retryIdentity:"a".repeat(64), registryDigest:"b".repeat(64) },
  transitions:[
    { type:"diagnostic-retry-claimed" },
    { type:"diagnostic-retry-classified", classification:"confirmed-flaky" },
  ],
  retry:{ status:"classified", identity:"a".repeat(64), outcome:"passed",
    classification:"confirmed-flaky", receiptSha256:"c".repeat(64) },
};

const confirmedFlakyBootstrapCoverage = await runIntentBootstrapCoverage({
  incidents:[confirmedFlakyBootstrapIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
});

assert.equal(confirmedFlakyBootstrapCoverage[0].admission.kind, "terminal-deferred",
  "the bootstrap preserves a newer confirmed-flaky terminal deferral without inventing a repair");

const inheritedTerminalObligation = structuredClone(confirmedFlakyBootstrapIncident);

inheritedTerminalObligation.id = "bootstrap-inherited-terminal-obligation";

inheritedTerminalObligation.failure.task = verificationTaskIdentity({
  key:"unit:test/inherited-terminal-obligation-test.mjs", stage:"unit", executable:"node",
  args:["test/inherited-terminal-obligation-test.mjs"],
});

const inheritedTerminalCoverage = await runIntentBootstrapCoverage({
  incidents:[inheritedTerminalObligation], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
  resolveSuccession:async() => { throw new Error("ownership preparation must not project inherited terminal work"); },
});

assert.deepEqual(inheritedTerminalCoverage[0], {
  incidentId:inheritedTerminalObligation.id,
  admission:{ kind:"terminal-deferred" },
  failureTaskKey:inheritedTerminalObligation.failure.task.key,
  selectedTaskKey:null, selectedTaskDigest:null, terminalObligation:true,
}, "the ownership preparation leaves inherited deferred work at the terminal checkpoint");

const unselectedBootstrapTask = verificationTaskIdentity(bootstrapPlan.tasks.find(({ key }) =>
  key !== bootstrapTask.key && key.startsWith("unit:")));

const rawBootstrapIncident = {
  id:"bootstrap-unselected-review-failure", state:"unresolved",
  failureDigest:"d".repeat(64),
  failure:{ task:unselectedBootstrapTask, lineage:{
    evidenceTask:"verification-slice-verification-registry-planner-modularization" } },
};

const rawBootstrapCoverage = await runIntentBootstrapCoverage({
  incidents:[rawBootstrapIncident], plan:{ tasks:[bootstrapTask] }, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
  terminalObligationProof:async() => ({ sourceReceiptSha256:"e".repeat(64),
    sourcePlanDigest:"f".repeat(64), sourceCommit:"source-commit" }),
});

assert.deepEqual(rawBootstrapCoverage[0], {
  incidentId:rawBootstrapIncident.id, failureDigest:rawBootstrapIncident.failureDigest,
  admission:{ kind:"bootstrap-terminal-obligation",
    failureDigest:rawBootstrapIncident.failureDigest,
    sourceReceiptSha256:"e".repeat(64), sourcePlanDigest:"f".repeat(64),
    sourceCommit:"source-commit" },
  failureTaskKey:unselectedBootstrapTask.key,
  failureTaskDigest:verificationTaskDigest(unselectedBootstrapTask),
  selectedTaskKey:null, selectedTaskDigest:null, terminalObligation:true,
}, "the exact preparation retains a rejected broad-run failure as a terminal obligation");

assert.equal(reviewAdmissionTransactionOwnsDeferrals({
  runIntentBootstrap:{ version:1, coverage:[rawBootstrapCoverage[0]] },
}), true, "bootstrap obligations remain owned by their committed admission transaction at handoff");

const portableProofRepository = await mkdtemp(path.join(os.tmpdir(), "bootstrap-proof-source-"));

const portableProofSibling = `${portableProofRepository}-sibling`;

try {
  await exec("git", ["init", "-q", "--initial-branch=main"], { cwd:portableProofRepository });
  await exec("git", ["config", "user.name", "Bootstrap Proof Test"],
    { cwd:portableProofRepository });
  await exec("git", ["config", "user.email", "bootstrap-proof@example.test"],
    { cwd:portableProofRepository });
  await writeFile(path.join(portableProofRepository, "tracked.txt"), "shared repository\n");
  await writeFile(path.join(portableProofRepository, ".gitignore"), "tmp/\n");
  await exec("git", ["add", "tracked.txt", ".gitignore"], { cwd:portableProofRepository });
  await exec("git", ["commit", "-qm", "shared base"], { cwd:portableProofRepository });
  await exec("git", ["worktree", "add", "-q", "--detach", portableProofSibling, "HEAD"],
    { cwd:portableProofRepository });
  const sourceReceipt = "tmp/verification-receipts/source-review.json";
  const sourceBytes = Buffer.from(JSON.stringify({ version:2, proof:"source-plan-result" }));
  const sourceDigest = createHash("sha256").update(sourceBytes).digest("hex");
  await mkdir(path.dirname(path.join(portableProofRepository, sourceReceipt)), { recursive:true });
  await writeFile(path.join(portableProofRepository, sourceReceipt), sourceBytes);
  assert.equal(await exec("git", ["status", "--porcelain"],
    { cwd:portableProofRepository }), "",
  "the source receipt is recorded from a clean worktree");
  await persistBootstrapTerminalObligationSourceReceipt({
    root:portableProofRepository, sourceReceipt, sourceReceiptSha256:sourceDigest,
  });
  assert.deepEqual(await readBootstrapTerminalObligationSourceReceipt({
    root:portableProofSibling, sourceReceiptSha256:sourceDigest,
  }), sourceBytes, "a sibling worktree validates the repository-common immutable source proof");
  const durableProof = path.join(await defaultRepositoryRuntimeDirectory(portableProofSibling),
    "bootstrap-terminal-obligation-source-receipts", `${sourceDigest}.json`);
  await rm(durableProof);
  await assert.rejects(() => readBootstrapTerminalObligationSourceReceipt({
    root:portableProofSibling, sourceReceiptSha256:sourceDigest,
  }), /durable source receipt is missing/i,
  "forwarding rejects a missing repository-common bootstrap proof");
  await persistBootstrapTerminalObligationSourceReceipt({
    root:portableProofRepository, sourceReceipt, sourceReceiptSha256:sourceDigest,
  });
  await writeFile(durableProof, "tampered proof");
  await assert.rejects(() => readBootstrapTerminalObligationSourceReceipt({
    root:portableProofSibling, sourceReceiptSha256:sourceDigest,
  }), /durable source receipt digest changed/i,
  "forwarding rejects a tampered repository-common bootstrap proof");
} finally {
  await exec("git", ["worktree", "remove", "--force", portableProofSibling],
    { cwd:portableProofRepository }).catch(()=>undefined);
  await rm(portableProofSibling, { recursive:true, force:true });
  await rm(portableProofRepository, { recursive:true, force:true });
}

await assert.rejects(() => verifyCommittedReviewTransaction({
  runIntentBootstrap:{ version:1, coverage:[rawBootstrapCoverage[0]] },
}, "fixture", { store:{} }), /requires a committed transaction/i,
"bootstrap terminal obligations cannot bypass the atomic review transaction binding");

await assert.rejects(() => runIntentBootstrapCoverage({
  incidents:[{ ...structuredClone(rawBootstrapIncident), id:"unrelated-bootstrap-failure",
    failure:{ ...structuredClone(rawBootstrapIncident.failure),
      sourceReceipt:"tmp/verification-receipts/unrelated.json", lineage:{
        evidenceTask:"verification-slice-verification-registry-planner-modularization",
        baseCommit:"unrelated-base", commit:"unrelated-commit", tree:"unrelated-tree",
        changeSetDigest:"1".repeat(64),
      } } }],
  plan:{ tasks:[bootstrapTask] }, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  root:"fixture",
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
}), /ineligible incident/u,
"a same-task incident from an unrelated candidate lineage remains blocking");

await assert.rejects(() => runIntentBootstrapCoverage({
  incidents:[rawBootstrapIncident], plan:{ tasks:[bootstrapTask, unselectedBootstrapTask] }, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
}), /ineligible incident/u,
"a failure in the approved focused plan cannot be deferred as an unselected obligation");

await assert.rejects(() => runIntentBootstrapCoverage({
  incidents:[{ ...bootstrapIncident, id:"ineligible", repair:null }],
  plan:bootstrapPlan, packs, candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
}), /ineligible incident/i);

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

assert.deepEqual({selectedPacks:vtd009ShellCalibration.selectedPacks,
  duration:[vtd009ShellCalibration.changedPathDuration.baseline,
    vtd009ShellCalibration.changedPathDuration.tolerance,
    vtd009ShellCalibration.changedPathDuration.limit],
  fanOut:[vtd009ShellCalibration.changedPathFanOut.baseline,
    vtd009ShellCalibration.changedPathFanOut.limit]},
{selectedPacks:["shell"],duration:[37.2,1.2,45],fanOut:[0,0]});

assert.deepEqual(vtd009ShellCalibration.exactPackDuration,
  vtd009BaseShellCalibration.exactPackDuration);

assert.deepEqual(committedCalibrationReport.runnablePacks.filter(({id}) => id !== "shell"),
  vtd009BaseCalibration.runnablePacks.filter(({id}) => id !== "shell"));

assert.deepEqual(committedCalibrationReport.browserTargets, vtd009BaseCalibration.browserTargets);

const vtd009ExactBase = planVerification(vtd009BasePacks,
  {packIds:["shell"],includeProperties:true,historicalRegistryFallback:true});

const vtd009TerminalBase = planVerification(vtd009BasePacks,
  {terminalFull:true,historicalRegistryFallback:true});

const vtd009TerminalCurrent = planVerification(packs, {terminalFull:true});

const vtd009HistoricalShellTasks = localShellPlan.tasks.filter(({ key }) =>
  key !== "unit:test/workspace-tabs-installed-controller-test.mjs" &&
  !postBaseAddedRegisteredTaskKeys.has(key) && !approvedVerificationTaskKeys.has(key));

assert.deepEqual(vtd009HistoricalShellTasks.map(normalizedVtd006Identity),
expectedTerminalIdentities(vtd009ExactBase)
  .filter(({key}) => key !== "unit:test/verification-process-contract-test.mjs" &&
    key !== `acceptance-parse:${migratedVerificationFeature}` &&
    key !== `acceptance-generate:${migratedVerificationFeature}`));

assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities);

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

const vtd017Acceptance = {
  coordinator:{
    planModes:["focused", "final"],
    oneLease:true,
    exactArtifactIdentity:true,
    combinedResultOnce:true,
  },
  overlap:{
    workerCount:sharedArtifactMetrics.observationWorkerCount,
    usefulOverlapMs:sharedArtifactMetrics.usefulOverlapMs,
    artifactWaitMs:0,
    startsBeforeEitherCompletes:maximumSharedArtifactTasks === 2,
  },
  protection:{ outsideWriterBlocked:outsideWriterWasBlocked, readerMutationRejected:true },
  isolation:{
    independent:["profile", "debugging port", "temporary data", "evidence path", "cleanup"],
    sharedStateSerial:true,
  },
  workerDecision:{ accepted:acceptedThreeWorkers, rejectedWorkerCount:2 },
  failure:{ combinedFailed:true, originalIdentity:true, remainingWorkCompleted:true,
    lowerConcurrencyRetry:false, leaseReleased:failedParallelLeaseReleased },
  final:{ packCount:20, properties:true, package:true,
    bindings:["task", "base", "commit", "tree", "plan", "artifact", "toolchain"] },
};

console.log(JSON.stringify({vtd004Acceptance,vtd004DurableAcceptance,vtd004EventAcceptance,
  vtd004CaptureAcceptance,vtd004SchemasAcceptance,vtd005Acceptance,vtd009Acceptance,
  vtd017Acceptance}));

console.log(JSON.stringify({ vtd014Acceptance:vtd014Evidence }));

console.log(JSON.stringify({ vtd017Acceptance }));
console.log(JSON.stringify({ vtd009Acceptance }));

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

const blockedAggregateTask = { key:blockedAggregateRouteIdentity.parentTaskKey,
  stage:"browser-observation", packId:"shell", executable:"node",
  args:["scripts/run-browser-observation.mjs", "REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER"],
  target:"REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
  environment:{ REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER:"1" },
  requiredCapabilities:["local-loopback"],
  logicalTargetIds:["REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER"] };
const blockedSyntheticTask = { key:blockedAggregateRouteIdentity.syntheticTaskKey,
  stage:"unit", packId:"verification_process", executable:"node",
  args:["test/verification-contracts/execution-checkpoint-contract-test.mjs"],
  target:"test/verification-contracts/execution-checkpoint-contract-test.mjs",
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
  ...verificationPolicyContracts.map(({ testPath }) => `unit:${testPath}`),
], "preparation evidence expands the retired process alias to every modular contract");

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

const succession = resolveTaskSuccessionGraph({ graph, sourceIdentity:source,
  currentIdentities:destinations, logicalSlice:{ kind:"task" } });

assert.deepEqual(succession.destinationIdentities, destinations,
  "one former task succeeds only through its complete ordered successor set");

assert.throws(() => resolveTaskSuccessionGraph({ graph, sourceIdentity:source,
  currentIdentities:destinations.slice(0, 1), logicalSlice:{ kind:"task" } }),
  /incomplete conserved boundary/u, "a missing successor blocks before execution");

const evolvedDestination = {...destinations[0], requiredCapabilities:["local-loopback"]};
const evolvedDigest = verificationTaskDigest(evolvedDestination);
const evolvedGraph = structuredClone(graph);
evolvedGraph.identities[evolvedDigest] = evolvedDestination;
evolvedGraph.boundaries[evolvedDigest] = structuredClone(destinationEntries[0].boundary);
evolvedGraph.edges.push({
  id:"registry-contract-capability-v2",
  sourceRegistryCommit:"a".repeat(40),
  sourceTaskDigest:destinationEntries[0].digest,
  destinationTaskDigest:evolvedDigest,
  logicalSlice:{kind:"task"},
  conservedBoundaryDigest:destinationEntries[0].boundaryDigest,
});
const evolvedSuccession = resolveTaskSuccessionGraph({graph:evolvedGraph, sourceIdentity:source,
  currentIdentities:[evolvedDestination, destinations[1]], logicalSlice:{kind:"task"}});
assert.deepEqual(evolvedSuccession.destinationIdentities, [evolvedDestination, destinations[1]],
  "each task-set member follows ordinary exact identity succession to one current canonical identity");
assert.equal(new Set(evolvedSuccession.destinationTaskDigests).size, destinations.length,
  "task-set identity succession preserves exact cardinality and distinct destinations");

const collapsedTaskSet = structuredClone(evolvedGraph);
collapsedTaskSet.edges[0].destinationTaskDigest = destinationEntries[1].digest;
assert.throws(() => resolveTaskSuccessionGraph({graph:collapsedTaskSet, sourceIdentity:source,
  currentIdentities:[destinations[1]], logicalSlice:{kind:"task"}}),
  /incomplete conserved boundary|preserve its conserved boundary/u,
  "task-set member succession cannot collapse distinct destinations");

const ambiguousTaskSet = structuredClone(evolvedGraph);
ambiguousTaskSet.edges.push({...structuredClone(evolvedGraph.edges[0]), id:"ambiguous-capability-v2"});
assert.throws(() => resolveTaskSuccessionGraph({graph:ambiguousTaskSet, sourceIdentity:source,
  currentIdentities:[evolvedDestination, destinations[1]], logicalSlice:{kind:"task"}}),
  /Ambiguous task succession boundary/u,
  "task-set member succession rejects ambiguous ordinary edges");
