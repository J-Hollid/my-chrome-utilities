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
const packs = await loadVerificationPacks();
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
