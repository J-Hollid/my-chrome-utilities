import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, chmod, copyFile, mkdtemp, mkdir, readFile, readdir, realpath, rename, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

import "./acceptance/side-panel-browser-session-contract.mjs";
import {
  acquireDistArtifactLock,
  distArtifactLeaseEnvironment,
  withDistArtifactLock,
} from "../scripts/dist-artifact-lock.mjs";
import {
  decideBrowserObservationWorkers,
  deterministicBrowserWorkerSchedule,
} from "../scripts/shared-artifact-parallel.mjs";
import {
  assertFreshDistArtifact, createDistInputFingerprint, writeDistArtifactManifest,
} from "../scripts/dist-artifact.mjs";
import {
  selectedBrowserTargetConfigurations,
  summarizeBrowserTargetResults,
} from "./support/browser-target-session.mjs";
import {
  canonicalVerificationChangeSet, verificationPacksAtCommit,
} from "../scripts/verification-changes.mjs";
import {
  browserTargetConfigurations,
  completeBrowserObservationOutput,
  exactObservationEnvironment,
  parseBrowserObservationBatchOutput,
  parseBrowserObservationOutput,
  validateBrowserObservationBatch,
} from "../scripts/run-browser-observation.mjs";
import { removeVerificationFixtureRoot } from "../scripts/verification-fixture-cleanup.mjs";
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
} from "../scripts/report-verification-throughput.mjs";
import {
  archiveCanonicalReceiptCandidates,
  buildCanonicalTimingLedger,
  canonicalEnvironmentClassId,
  formatCanonicalTimingLedgerSummary,
  timingMaturity,
} from "../scripts/verification-timing-ledger.mjs";
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
  selectFocusedVerificationTasks,
  prepareCheckpointExecution,
  reviewReadyScopeGuardRequired,
  resumeVerificationPlan,
  runTimeoutRepairFocused,
  runTimeoutDiagnosticRetry,
  validateCurrentArtifactForConsumers,
  validateExplicitChangedPaths,
  verificationArtifactIdentity,
  verificationPromotionTasks,
  verificationResumeIdentity,
} from "../scripts/run-focused-acceptance.mjs";
import {
  candidatePredatesRunIntentImplementation,
  closeCanonicalEvidencePlanPrerequisites,
  createPendingVerificationEvidence,
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
} from "../scripts/verification-evidence.mjs";
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
} from "../scripts/verification-packs.mjs";
import { validateStylesheetDeclarations } from "../scripts/verification-styles.mjs";
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
} from "../scripts/verification-reliability-incidents.mjs";
import { canonicalCheckpointBinding } from "../scripts/verification-reliability-receipts.mjs";
import {
  bindRunIntentBootstrapPlan,
  bootstrapReviewIncidentProof,
  classifyLegacyIncidentRunIntent,
  governedRepairAttemptAssociation,
  requireVerificationRunIntent,
  runIntentBootstrapCoverage,
  validateRunIntentBootstrapBase,
  validateRunIntentBootstrapReceipt,
  verificationRunIntent,
  verificationRunIntents,
} from "../scripts/verification-run-intent.mjs";
import {
  loadTaskSuccessionGraph, resolveIncidentTaskSuccession, resolveTaskSuccessionGraph,
  validateUnresolvedIncidentTaskSuccession,
  verificationTaskDigest,
} from "../scripts/verification-task-succession.mjs";
import {
  defaultStoreDirectory, validateIncident,
} from "../scripts/verification-reliability-persistence.mjs";
import {
  terminalProjectionCoverage,
  terminalProjectionCoverageValid,
} from "../scripts/verification-reliability-deferred.mjs";
import { recordEligibleIncidentDeferral } from "../scripts/verification-reliability-runtime.mjs";
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
} from "../scripts/verification-reliability-closure.mjs";
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
} from "../scripts/verification-execution-prerequisites.mjs";
import {
  canonicalFlowReloadIdentity,
  classifyFlowReloadModes,
  flowReloadCausalKey,
  observeFlowReloadLifecycle,
} from "../scripts/flow-reload-lifecycle.mjs";
import {
  stylesheetRuleInventory,
  verifyFlowStylesheetConservation,
} from "../scripts/flow-stylesheet-conservation.mjs";
import {
  checkpointAttemptInputIdentity,
  checkpointAttemptIdentity,
  createCheckpointAttemptStore,
  defaultCheckpointAttemptDirectory,
} from "../scripts/verification-checkpoint-attempt.mjs";

const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});

const createAuthorizedTestCommandRunner = (context, options = {}) => async(display, task) => {
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
const authorizationStore = createVerificationLaunchAuthorizations({
  ...authorizationContext, tasks:transitivePrerequisiteTasks,
  routes:new Map(transitivePrerequisiteTasks.map(({ key }) => [key, "workspace-sandbox"])),
});
assert.equal(consumeVerificationLaunchAuthorization(authorizationStore,
  transitivePrerequisiteTasks[0], { ...authorizationContext, route:"workspace-sandbox" }).route,
"workspace-sandbox", "an exact task-bound authorization is consumed once");
assert.throws(() => consumeVerificationLaunchAuthorization(authorizationStore,
  transitivePrerequisiteTasks[0], { ...authorizationContext, route:"workspace-sandbox" }),
/reused|authorization/u, "a launch authorization cannot be reused");
assert.throws(() => consumeVerificationLaunchAuthorization(authorizationStore,
  transitivePrerequisiteTasks[1], { ...authorizationContext, mode:"exact",
    route:"workspace-sandbox" }), /wrong-mode|authorization/u,
"a wrong-mode authorization cannot reach spawn");
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
const missingExecutableProbe = await probeExecutionPrerequisiteEnvironment([{
  key:"unit:missing-tool", stage:"unit", executable:"/definitely/missing-vtd014-tool",
  args:[], requiredCapabilities:[],
}], { outputCapacityProbe:async() => true });
assert.equal(missingExecutableProbe.launchable, false,
  "a missing executable blocks checkpoint preflight before task timing");
assert.equal(missingExecutableProbe.blocked[0].prerequisite, "executable");
const missingCapacityProbe = await probeExecutionPrerequisiteEnvironment(prerequisiteTasks, {
  executableProbe:async() => true, outputCapacityProbe:async() => false,
});
assert.equal(missingCapacityProbe.launchable, false,
  "unavailable bounded receipt capacity blocks checkpoint preflight");
assert.equal(missingCapacityProbe.blocked[0].prerequisite, "bounded-output-capacity");
const unverifiedCapabilityProbe = await probeExecutionPrerequisiteEnvironment(prerequisiteTasks, {
  executableProbe:async() => true, outputCapacityProbe:async() => true,
  capabilityProbe:async() => false, requestedCapabilities:["local-loopback"],
});
assert.equal(unverifiedCapabilityProbe.launchable, false,
  "declared capability metadata is not accepted without a successful authority probe");
for (const requiredCapabilities of [undefined, ["unknown"], ["*"],
  ["local-loopback", "workspace-only"]]) {
  assert.throws(() => validateTaskExecutionPrerequisites({
    key:"invalid", stage:"unit", executable:"node", args:[], requiredCapabilities,
  }), /capabilit|prerequisite|contradict/u,
  "missing, unknown, catch-all, and contradictory prerequisite declarations fail closed");
}
assert.deepEqual(classifyExecutionRestriction({
  task:prerequisiteTasks[1], operation:{ kind:"bind", address:"127.0.0.1" },
  code:"EPERM", stderr:"socket() failed: Operation not permitted",
  route:"workspace-sandbox",
}), {
  failureClass:"environment-contract-failure", capability:"local-loopback", code:"EPERM",
  operation:{ kind:"bind", address:"127.0.0.1" }, route:"workspace-sandbox",
  retryPermitted:false,
}, "an undeclared sandbox denial is an execution-contract incident with no unchanged retry");
const executionContractRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-execution-contract-"));
let executionContractIncidentObserved = false;
try {
  let executionContractIncidentNumber = 0;
  const executionContractStore = createTimeoutIncidentStore({ root:executionContractRoot,
    storeDirectory:path.join(executionContractRoot, "incidents"),
    randomId:() => `contract-${++executionContractIncidentNumber}` });
  const executionContractIncident = await executionContractStore.create({
    lineage:{ commit:"a".repeat(40), tree:"b".repeat(40) }, task:prerequisiteTasks[1],
    failureClass:"execution-contract-failure", fingerprint:"c".repeat(64),
    failedBoundary:{ kind:"checkpoint-stage-identity", stage:"unit" },
  });
  assert.equal(executionContractIncident.failure.retryScope, undefined,
    "a tracked-file execution-contract drift cannot consume an unchanged retry");
  const promotionIdentity = verificationTaskIdentity({ key:"promotion:artifact-binding",
    stage:"promotion", executable:"internal", args:[], target:"artifact-binding" });
  const promotionContractIncident = await executionContractStore.create({
    lineage:{ commit:"a".repeat(40), tree:"b".repeat(40) }, task:promotionIdentity,
    failureClass:"execution-contract-failure", fingerprint:"e".repeat(64),
    failedBoundary:{ kind:"checkpoint-identity", operation:"artifact-binding" },
  });
  const promotionRegression = prerequisiteTasks[0];
  assert.deepEqual(timeoutRepairFocusedTaskPlan(promotionContractIncident, [],
    promotionRegression.key, [promotionRegression]), [{
    identity:Object.fromEntries(Object.entries(verificationTaskIdentity(promotionRegression))
      .filter(([, value]) => value !== null)),
    roles:["causal-regression", "diagnosed-boundary"],
  }], "an internal promotion failure is repaired through its canonical causal regression, not invented task succession");
  const environmentContractIncident = await executionContractStore.create({
    lineage:{ commit:"a".repeat(40), tree:"b".repeat(40) }, task:prerequisiteTasks[1],
    failureClass:"environment-contract-failure", fingerprint:"d".repeat(64),
    failedBoundary:{ kind:"capability-route", capability:"local-loopback" },
  });
  assert.deepEqual(environmentContractIncident.failure.retryScope, {
    kind:"task", taskKey:prerequisiteTasks[1].key,
    executionArgs:[...prerequisiteTasks[1].args],
  }, "an environment-contract failure retains the trusted task boundary needed for causal repair");
  executionContractIncidentObserved = executionContractIncident.failure.failureClass ===
    "execution-contract-failure";
} finally {
  await rm(executionContractRoot, { recursive:true, force:true });
}
const checkpointAttemptRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-attempt-contract-"));
let checkpointContractEvidence;
try {
  const attemptIdentity = checkpointAttemptIdentity({
    candidate:{ commit:"a".repeat(40), tree:"b".repeat(40) }, baseCommit:"c".repeat(40),
    evidenceTask:"vtd014", planDigest:"d".repeat(64), artifactInputDigest:"e".repeat(64),
    artifactOutputDigest:"1".repeat(64), artifactBuildIdentity:"2".repeat(64),
    registryDigest:"f".repeat(64), toolchainDigest:"0".repeat(64),
    environmentClass:"normal-linux", capabilityRoutes:{ "local-loopback":"scoped-command-approval" },
  });
  const attemptInputIdentity = checkpointAttemptInputIdentity(attemptIdentity);
  let ownerAlive = true;
  let checkpointTimestamp = Date.parse("2026-08-09T00:00:00.000Z");
  const legacyAttemptDirectory = path.join(checkpointAttemptRoot, "legacy");
  const primaryAttemptDirectory = path.join(checkpointAttemptRoot, "primary");
  const legacyAttemptStore = createCheckpointAttemptStore({ directory:legacyAttemptDirectory,
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => true });
  await legacyAttemptStore.claim(attemptInputIdentity,
    ["unit:legacy"], { pid:39, token:"owner-39" });
  const compatibleAttemptStore = createCheckpointAttemptStore({ directory:primaryAttemptDirectory,
    legacyDirectories:[legacyAttemptDirectory],
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => true });
  const compatibleLegacyAttempt = await compatibleAttemptStore.claim(attemptInputIdentity,
    ["unit:legacy"], { pid:40, token:"owner-40" });
  assert.equal(compatibleLegacyAttempt.action, "attached",
    "a compatible active legacy checkpoint prevents duplicate repository work");
  assert.equal((await compatibleAttemptStore.list()).length, 1,
    "the authoritative attempt view unions the writable and legacy namespaces");
  const recoveringAttemptStore = createCheckpointAttemptStore({ directory:primaryAttemptDirectory,
    legacyDirectories:[legacyAttemptDirectory],
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => false });
  const recoveredLegacyAttempt = await recoveringAttemptStore.claim(attemptInputIdentity,
    ["unit:legacy"], { pid:41, token:"owner-41" });
  assert.equal(recoveredLegacyAttempt.action, "stale-owner-recovered",
    "a stale legacy attempt migrates before its lease is recovered");
  assert.equal((await recoveringAttemptStore.read(recoveredLegacyAttempt.attempt.id)).owner.token,
    "owner-41", "the migrated attempt remains readable from the authoritative namespace");
  const attemptStore = createCheckpointAttemptStore({ directory:checkpointAttemptRoot,
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => ownerAlive });
  const createdAttempt = await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:41, token:"owner-41" });
  assert.equal(createdAttempt.action, "created");
  assert.equal(createdAttempt.attempt.identity.artifactOutputDigest, null,
    "the repository-common attempt is acquired before the build child starts");
  await attemptStore.bindArtifactIdentity(createdAttempt.attempt.id, {
    artifactOutputDigest:attemptIdentity.artifactOutputDigest,
    artifactBuildIdentity:attemptIdentity.artifactBuildIdentity,
  }, { token:"owner-41" });
  const boundAttempt = await attemptStore.read(createdAttempt.attempt.id);
  assert.equal(boundAttempt.identityDigest, verificationDigest(attemptIdentity),
    "the single owned build durably establishes the attempt output identity");
  const attachedAttempt = await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:42, token:"owner-42" });
  assert.equal(attachedAttempt.action, "attached");
  assert.equal(attachedAttempt.attempt.id, createdAttempt.attempt.id,
    "two compatible invocations expose one repository-common checkpoint attempt");
  let incompatibleOwnerRejected = false;
  try {
    await attemptStore.claim(checkpointAttemptIdentity({ ...attemptIdentity,
      planDigest:"8".repeat(64) }), ["unit:incompatible"], { pid:43, token:"owner-43" });
  } catch (error) {
    assert.match(error.message, /owned by pid 41/u);
    incompatibleOwnerRejected = true;
  }
  const attemptResult = (key, stage = "unit") => {
    const identity = { key, stage, packId:"shell", executable:"node", args:[`${key}.mjs`],
      target:key, environment:null, requiredCapabilities:[] };
    return { status:"passed", identityDigest:verificationDigest(identity),
      receiptTask:{ identity, status:"passed", provenance:"fresh", durationMs:1,
        output:"", stderr:"", executionPrerequisites:{ requiredCapabilities:[],
          launchRoute:"workspace-sandbox" } } };
  };
  await attemptStore.recordTask(createdAttempt.attempt.id, "unit:a", attemptResult("unit:a"),
    { token:"owner-41" });
  await attemptStore.interrupt(createdAttempt.attempt.id, "browser:b", { token:"owner-41" });
  const continuedAttempt = await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:42, token:"owner-42" });
  assert.equal(continuedAttempt.action, "continued");
  assert.deepEqual(continuedAttempt.reusableTaskKeys, ["unit:a"]);
  assert.deepEqual(continuedAttempt.pendingTaskKeys, ["browser:b", "package:extension"]);
  const driftIdentities = {
    "the candidate commit or tree changes":{ ...attemptIdentity,
      candidate:{ ...attemptIdentity.candidate, tree:"2".repeat(40) } },
    "the registry or canonical plan changes":{ ...attemptIdentity,
      planDigest:"2".repeat(64), registryDigest:"3".repeat(64) },
    "the locked toolchain identity changes":{ ...attemptIdentity,
      toolchainDigest:"4".repeat(64) },
    "the built artifact identity changes":{ ...attemptIdentity,
      artifactOutputDigest:"5".repeat(64), artifactBuildIdentity:"6".repeat(64) },
  };
  const driftRows = {};
  for (const [drift, driftIdentity] of Object.entries(driftIdentities)) {
    const beforeAttempts = await attemptStore.list();
    let rejection;
    try { await attemptStore.assertIdentity(createdAttempt.attempt.id, driftIdentity); }
    catch (error) { rejection = error; }
    const afterAttempts = await attemptStore.list();
    driftRows[drift] = {
      stoppedBeforeLaunch:/identity drift/u.test(rejection?.message ?? ""),
      retainedForDiagnosis:afterAttempts.some(({ id }) => id === createdAttempt.attempt.id),
      noFreshAttempt:afterAttempts.length === beforeAttempts.length,
      executionContractIncident:executionContractIncidentObserved,
    };
    assert.deepEqual(Object.values(driftRows[drift]), [true, true, true, true],
      `${drift} stops the existing attempt without forging a fresh attempt`);
  }
  const partialTargetResult = attemptResult("browser:b", "browser");
  partialTargetResult.receiptTask.identity.logicalTargetIds = ["BROWSER_FIRST", "BROWSER_SECOND"];
  partialTargetResult.receiptTask.status = "failed";
  partialTargetResult.receiptTask.logicalResults = {
    BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
    BROWSER_SECOND:{ id:"BROWSER_SECOND" },
  };
  await attemptStore.recordLogicalTargets(createdAttempt.attempt.id, "browser:b",
    partialTargetResult.receiptTask, { token:"owner-42" });
  const targetDurability = await attemptStore.read(createdAttempt.attempt.id);
  assert.deepEqual(targetDurability.logicalResults["browser:b"], {
    BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
  }, "each completed browser target is durable before its whole batch passes");
  await attemptStore.interrupt(createdAttempt.attempt.id, "browser:b", { token:"owner-42" });
  const targetContinuation = await attemptStore.claim(attemptIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:44, token:"owner-44" });
  assert.deepEqual(targetContinuation.attempt.logicalResults["browser:b"], {
    BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
  }, "continuation preserves completed targets and reruns only interrupted or unstarted targets");
  await attemptStore.recordTask(createdAttempt.attempt.id, "browser:b",
    attemptResult("browser:b", "browser"), { token:"owner-44" });
  await attemptStore.recordTask(createdAttempt.attempt.id, "package:extension",
    attemptResult("package:extension", "package"), { token:"owner-44" });
  await attemptStore.markTasksComplete(createdAttempt.attempt.id, { token:"owner-44" });
  assert.equal((await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:43, token:"owner-43" })).action,
  "promotion-only", "a completed attempt rejects duplicate task execution");
  const observedPromotionScopes = {};
  observedPromotionScopes["completed receipt finalization is interrupted"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["completed receipt finalization is interrupted"],
    "receipt-finalization");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "receipt-finalized");
  const receiptPromotion = (await attemptStore.read(createdAttempt.attempt.id));
  assert.equal(receiptPromotion.promotion["receipt-finalized"].at,
    receiptPromotion.transitions.find(({type}) => type === "receipt-finalized").at,
  "one promotion event retains one timestamp even when the clock advances per read");
  observedPromotionScopes["pending evidence creation is interrupted"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["pending evidence creation is interrupted"],
    "pending-evidence");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "pending-evidence-created");
  observedPromotionScopes["Git-note recording loses its lock or permission"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["Git-note recording loses its lock or permission"],
    "git-note-recording");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "git-note-recorded");
  observedPromotionScopes["handoff eligibility cannot read durable evidence"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["handoff eligibility cannot read durable evidence"],
    "handoff-eligibility");
  const beforeIdempotentPromotion = await attemptStore.read(createdAttempt.attempt.id);
  await attemptStore.markPromotion(createdAttempt.attempt.id, "git-note-recorded");
  assert.equal((await attemptStore.read(createdAttempt.attempt.id)).transitions.length,
    beforeIdempotentPromotion.transitions.length,
    "restarting an already completed promotion step is idempotent");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "handoff-eligible");
  assert.equal((await attemptStore.read(createdAttempt.attempt.id)).state, "promoted");
  const attemptPath = path.join(checkpointAttemptRoot, `${createdAttempt.attempt.id}.json`);
  const pristineAttemptDocument = JSON.parse(await readFile(attemptPath, "utf8"));
  const forgedAttemptRejected = {};
  const forgeAttempt = async(name, mutate) => {
    const document = structuredClone(pristineAttemptDocument);
    mutate(document.attempt);
    document.digest = timeoutIncidentDigest(document.attempt);
    await writeFile(attemptPath, `${JSON.stringify(document)}\n`);
    await assert.rejects(attemptStore.read(createdAttempt.attempt.id),
      /malformed|transition|result|promotion|state|owner|digest|identity/u);
    forgedAttemptRejected[name] = true;
    await writeFile(attemptPath, `${JSON.stringify(pristineAttemptDocument)}\n`);
  };
  await forgeAttempt("missingResult", (attempt) => { delete attempt.results["unit:a"]; });
  await forgeAttempt("extraResult", (attempt) => {
    attempt.results["unit:extra"] = structuredClone(attempt.results["unit:a"]);
  });
  await forgeAttempt("forgedResult", (attempt) => {
    attempt.results["unit:a"].identityDigest = "9".repeat(64);
  });
  await forgeAttempt("impossibleState", (attempt) => { attempt.state = "active"; });
  await forgeAttempt("reorderedTransitions", (attempt) => {
    [attempt.transitions[0], attempt.transitions[1]] = [attempt.transitions[1], attempt.transitions[0]];
  });
  await forgeAttempt("duplicatedTransition", (attempt) => {
    attempt.transitions.push(structuredClone(attempt.transitions.at(-1)));
  });
  await forgeAttempt("promotionDrift", (attempt) => {
    delete attempt.promotion["git-note-recorded"];
  });
  ownerAlive = false;
  const staleIdentity = checkpointAttemptIdentity({ ...attemptIdentity,
    candidate:{ commit:"4".repeat(40), tree:"5".repeat(40) } });
  const staleCreated = await attemptStore.claim(staleIdentity, ["unit:new"],
    { pid:51, token:"owner-51" });
  const staleRecovered = await attemptStore.claim(staleIdentity, ["unit:new"],
    { pid:52, token:"owner-52" });
  assert.equal(staleCreated.action, "created");
  assert.equal(staleRecovered.action, "stale-owner-recovered");
  checkpointContractEvidence = {
    singleton:createdAttempt.attempt.id === attachedAttempt.attempt.id,
    attachedWithoutDuplicate:attachedAttempt.action === "attached",
    continuation:continuedAttempt.action === "continued",
    reusedOnlyPassed:JSON.stringify(continuedAttempt.reusableTaskKeys) === JSON.stringify(["unit:a"]),
    interruptedAndUnstartedOnly:JSON.stringify(continuedAttempt.pendingTaskKeys) ===
      JSON.stringify(["browser:b", "package:extension"]),
    packagePlanned:createdAttempt.attempt.taskKeys.includes("package:extension"), promotionOnly:true,
    promotionScopes:observedPromotionScopes,
    preflightRows:{
      "every prerequisite is satisfied and no attempt exists":{
        action:"create one repository-common checkpoint attempt",
        taskExecution:"the planned tasks may launch", observed:createdAttempt.action === "created" },
      "one compatible incomplete attempt already exists":{
        action:"attach to that attempt", taskExecution:"no second all-pack process launches",
        observed:attachedAttempt.action === "attached" },
      "another owner holds an incompatible active lease":{
        action:"report or queue behind the named owner outside timing",
        taskExecution:"no checkpoint task launches", observed:incompatibleOwnerRejected },
      "a lease is demonstrably stale":{
        action:"use the bounded audited stale-owner recovery",
        taskExecution:"tasks launch only after lease recovery completes",
        observed:staleRecovered.action === "stale-owner-recovered" },
      "a required executable or bounded output capacity is unavailable":{
        action:"record environment-prerequisite-blocked",
        taskExecution:"no checkpoint task launches",
        observed:!missingExecutableProbe.launchable && !missingCapacityProbe.launchable },
    },
    driftRows,
    identityDriftRejected:Object.values(driftRows).every((row) => row.stoppedBeforeLaunch),
    staleOwnerRecovered:staleRecovered.action === "stale-owner-recovered",
    forgedAttemptRejected,
  };
} finally {
  await rm(checkpointAttemptRoot, { recursive:true, force:true });
}

const cliContentionRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-cli-contention-"));
const cliContentionRepository = path.join(cliContentionRoot, "repository");
const cliProcesses = new Set();
const cliBuildProcessGroups = new Set();
function resolvedNodeModulesRoot(resolve = (specifier) => import.meta.resolve(specifier)) {
  const installedTypescriptRoot = path.dirname(path.dirname(
    fileURLToPath(resolve("typescript"))));
  return path.dirname(installedTypescriptRoot);
}
const cliBuildProcessGroup = async() => {
  const owner = (await readFile(path.join(cliContentionRepository,
    "tmp", "cli-contention-build-owner"), "utf8")).trim().split(" ").map(Number);
  const buildPid = owner[1];
  const group = Number((await exec("ps", ["-o", "pgid=", "-p", String(buildPid)])).trim());
  assert.ok(Number.isInteger(group) && group > 1 && group !== process.pid,
    "the contention fixture must resolve the nested build process group");
  cliBuildProcessGroups.add(group);
  return group;
};
const terminateCliBuildGroup = (group) => {
  try { process.kill(-group, "SIGKILL"); }
  catch (error) { if (error?.code !== "ESRCH") throw error; }
  cliBuildProcessGroups.delete(group);
};
try {
  await exec("git", ["clone", "--quiet", "--no-hardlinks", path.resolve("."), cliContentionRepository]);
  const cliContentionBase = await exec("git", ["rev-parse", "HEAD"]);
  await exec("git", ["checkout", "--quiet", "--detach", cliContentionBase], {
    cwd:cliContentionRepository,
  });
  await exec("git", ["config", "user.name", "CLI Contention Test"], { cwd:cliContentionRepository });
  await exec("git", ["config", "user.email", "cli-contention@example.test"], {
    cwd:cliContentionRepository,
  });
  const cliRunnerPath = path.join(cliContentionRepository, "scripts/run-focused-acceptance.mjs");
  await copyFile(path.resolve("scripts/run-focused-acceptance.mjs"), cliRunnerPath);
  await copyFile(path.resolve("scripts/settled-final-verification-policy.mjs"),
    path.join(cliContentionRepository, "scripts/settled-final-verification-policy.mjs"));
  await copyFile(path.resolve("scripts/dist-artifact-lock.mjs"),
    path.join(cliContentionRepository, "scripts/dist-artifact-lock.mjs"));
  const cliRepairPlannerPath = path.join(
    cliContentionRepository, "scripts/verification-reliability-repair.mjs",
  );
  await copyFile(path.resolve("scripts/verification-reliability-repair.mjs"), cliRepairPlannerPath);
  const cliSuccessionPath = path.join(
    cliContentionRepository, "scripts/verification-task-succession.mjs",
  );
  await copyFile(path.resolve("scripts/verification-task-succession.mjs"), cliSuccessionPath);
  await copyFile(path.resolve("verification/task-succession.json"),
    path.join(cliContentionRepository, "verification/task-succession.json"));
  await copyFile(path.resolve("verification/packs.json"),
    path.join(cliContentionRepository, "verification/packs.json"));
  await copyFile(path.resolve("test/browser-packs/global-style-smoke.mjs"),
    path.join(cliContentionRepository, "test/browser-packs/global-style-smoke.mjs"));
  await mkdir(path.join(cliContentionRepository, "test"), { recursive:true });
  await copyFile(path.resolve("test/stylesheet-declarations-property-test.mjs"),
    path.join(cliContentionRepository, "test/stylesheet-declarations-property-test.mjs"));
  await copyFile(path.resolve("test/flow-stylesheet-extraction-test.mjs"),
    path.join(cliContentionRepository, "test/flow-stylesheet-extraction-test.mjs"));
  await mkdir(path.join(cliContentionRepository, "src/flow-graph"), { recursive:true });
  await copyFile(path.resolve("src/flow-graph/flow-workspace.css"),
    path.join(cliContentionRepository, "src/flow-graph/flow-workspace.css"));
  await copyFile(path.resolve("src/flow-graph/flow-workspace-shell.css"),
    path.join(cliContentionRepository, "src/flow-graph/flow-workspace-shell.css"));
  const cliClosurePath = path.join(
    cliContentionRepository, "scripts/verification-reliability-closure.mjs",
  );
  await copyFile(path.resolve("scripts/verification-reliability-closure.mjs"), cliClosurePath);
  const cliPrerequisitePath = path.join(
    cliContentionRepository, "scripts/verification-execution-prerequisites.mjs",
  );
  await copyFile(path.resolve("scripts/verification-execution-prerequisites.mjs"), cliPrerequisitePath);
  const buildOwnerFile = path.join(cliContentionRepository, "tmp", "cli-contention-build-owner");
  await writeFile(path.join(cliContentionRepository, "scripts/build.mjs"), [
    'import { writeFile } from "node:fs/promises";',
    'import { withDistArtifactLock } from "./dist-artifact-lock.mjs";',
    `await withDistArtifactLock(async() => { await writeFile(${JSON.stringify(buildOwnerFile)}, process.ppid + " " + process.pid + "\\n"); await new Promise(() => setInterval(() => {}, 1000)); });`,
    "",
  ].join("\n"));
  await mkdir(path.join(cliContentionRepository, "tmp"), { recursive:true });
  const installedNodeModulesRoot = resolvedNodeModulesRoot();
  const fixtureNodeModulesRoot = path.join(cliContentionRepository, "node_modules");
  await symlink(installedNodeModulesRoot, fixtureNodeModulesRoot, "dir");
  assert.equal(await realpath(fixtureNodeModulesRoot), await realpath(installedNodeModulesRoot),
    "the isolated checkpoint fixture attaches the resolved locked npm prerequisites");
  await symlink(path.resolve("tmp/tools"), path.join(cliContentionRepository, "tmp/tools"), "dir");
  await writeFile(path.join(cliContentionRepository, ".git/info/exclude"),
    "node_modules\n.swarmforge\nscripts/verification-task-succession.mjs\nverification/task-succession.json\n");
  await exec("git", ["add", "scripts/run-focused-acceptance.mjs",
    "scripts/settled-final-verification-policy.mjs",
    "scripts/dist-artifact-lock.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-closure.mjs",
    "scripts/verification-execution-prerequisites.mjs", "scripts/build.mjs",
    "scripts/verification-styles.mjs", "scripts/verification-packs.mjs",
    "test/browser-packs/global-style-smoke.mjs", "test/stylesheet-declarations-property-test.mjs",
    "test/flow-stylesheet-extraction-test.mjs", "src/flow-graph/flow-workspace.css",
    "src/flow-graph/flow-workspace-shell.css",
    "verification/packs.json"], {
    cwd:cliContentionRepository,
  });
  await exec("git", ["commit", "-qm", "cli contention fixture baseline"], { cwd:cliContentionRepository });
  await writeFile(path.join(cliContentionRepository, "scripts/build.mjs"), `${await readFile(
    path.join(cliContentionRepository, "scripts/build.mjs"), "utf8")}\n`);
  await exec("git", ["add", "scripts/build.mjs"], { cwd:cliContentionRepository });
  await exec("git", ["commit", "-qm", "cli contention fixture"], { cwd:cliContentionRepository });

  const packIds = JSON.parse(await readFile(path.join(cliContentionRepository,
    "verification/packs.json"), "utf8"))
    .filter((pack) => ["unit", "property", "features", "browserAdapters",
      "browserObservations", "checkpointCommands"].some((key) => pack[key]?.length))
    .map(({ id }) => id);
  const checkpointArgs = ["scripts/run-focused-acceptance.mjs",
    ...packIds.flatMap((id) => ["--pack", id]), "--property", "--changed-since", "HEAD^",
    "--prepare-evidence", "vtd014-cli-contention"];
  const observeCli = (args, environment = {}) => {
    const child = spawn(process.execPath, args, {
      cwd:cliContentionRepository, stdio:["ignore", "pipe", "pipe"],
      env:{ ...process.env, ...environment },
    });
    cliProcesses.add(child);
    const observation = { child, stdout:"", stderr:"" };
    child.stdout.on("data", (chunk) => { observation.stdout += chunk; });
    child.stderr.on("data", (chunk) => { observation.stderr += chunk; });
    observation.closed = new Promise((resolve) => child.once("close", (code, signal) => {
      cliProcesses.delete(child);
      resolve({ code, signal });
    }));
    return observation;
  };
  const waitForCli = async(observation, predicate, description, timeoutMs = 30_000) => {
    const deadline = Date.now() + timeoutMs;
    while (!await predicate(observation) && observation.child.exitCode === null &&
        observation.child.signalCode === null && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.ok(await predicate(observation), `${description}: ${observation.stdout}${observation.stderr}`);
  };
  const firstCli = observeCli(checkpointArgs);
  await waitForCli(firstCli, ({ stderr }) => stderr.includes("[verify:start] npm run build"),
    "the first real CLI did not claim its checkpoint before starting the build");
  await waitForCli(firstCli, async() => {
    try { return Boolean((await readFile(buildOwnerFile, "utf8")).trim()); }
    catch (error) { if (error?.code === "ENOENT") return false; throw error; }
  }, "the first real CLI build did not acquire the artifact lease");

  const compatibleCli = observeCli(checkpointArgs, { DIST_ARTIFACT_LOCK_TIMEOUT_MS:"100" });
  const compatibleExit = await compatibleCli.closed;
  assert.equal(compatibleExit.code, 1);
  assert.match(compatibleCli.stderr, /Compatible checkpoint attempt [a-f0-9]{64} is already active/u);
  assert.match(compatibleCli.stderr, /no duplicate all-pack process launched/u);
  assert.doesNotMatch(compatibleCli.stderr, /\[verify:start\]|Timed out waiting.*dist artifact lock/u,
    "a compatible CLI must attach before task timing or artifact-lock waiting");

  const incompatibleArgs = [...checkpointArgs.slice(0, -1), "vtd014-cli-contention-incompatible"];
  const incompatibleCli = observeCli(incompatibleArgs, { DIST_ARTIFACT_LOCK_TIMEOUT_MS:"100" });
  const incompatibleExit = await incompatibleCli.closed;
  assert.equal(incompatibleExit.code, 1);
  assert.match(incompatibleCli.stderr, /Incompatible checkpoint attempt [a-f0-9]{64} is owned by pid/u);
  assert.doesNotMatch(incompatibleCli.stderr, /\[verify:start\]|Timed out waiting.*dist artifact lock/u,
    "an incompatible CLI must report the named owner before task timing or artifact-lock waiting");

  const buildGroupPid = await cliBuildProcessGroup();
  firstCli.child.kill("SIGKILL");
  terminateCliBuildGroup(buildGroupPid);
  await firstCli.closed;
  await rm(buildOwnerFile, { force:true });

  const staleCli = observeCli(checkpointArgs, { DIST_ARTIFACT_LOCK_TIMEOUT_MS:"3000" });
  await waitForCli(staleCli, ({ stderr }) => stderr.includes("[verify:checkpoint-continue]"),
    "a replacement real CLI did not recover the stale checkpoint owner");
  await waitForCli(staleCli, ({ stderr }) => stderr.includes("[verify:start] npm run build"),
    "the stale-owner replacement did not proceed after recovery");
  await waitForCli(staleCli, async() => {
    try { return Boolean((await readFile(buildOwnerFile, "utf8")).trim()); }
    catch (error) { if (error?.code === "ENOENT") return false; throw error; }
  }, "the stale-owner replacement build did not publish its cleanup identity");
  assert.ok(staleCli.stderr.indexOf("[verify:checkpoint-continue]") <
    staleCli.stderr.indexOf("[verify:start] npm run build"),
  "stale-owner recovery must complete outside and before task timing");
  const staleBuildGroupPid = await cliBuildProcessGroup();
  staleCli.child.kill("SIGTERM");
  await staleCli.closed;
  terminateCliBuildGroup(staleBuildGroupPid);
} finally {
  for (const child of cliProcesses) child.kill("SIGKILL");
  await Promise.all([...cliProcesses].map((child) => new Promise((resolve) => child.once("close", resolve))));
  for (const group of cliBuildProcessGroups) terminateCliBuildGroup(group);
  await removeVerificationFixtureRoot(cliContentionRoot);
}

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
assert.match(await readFile(new URL("../scripts/verification-evidence.mjs", import.meta.url), "utf8"),
  /allowLegacyTerminalClosure && receipt\.plan\?\.terminalClosure === undefined/u,
"archived pre-policy closure receipts alone may omit terminal closure metadata");

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
  baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
} }), { baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask },
"record validation uses the same frozen bounded-closure binding admitted by the launch gate");
assert.deepEqual(canonicalCheckpointBinding(rebasedCompatible, { candidate:{
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
  baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
} }), { baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask },
"record validation uses the frozen bounded-closure binding admitted for audited product repairs");
assert.deepEqual(compatibleTimeoutRepairIncidentIds({ requestedId:"incident-rebased",
  blocking:[boundedProductCompatible], candidateCommit:"repair-commit", candidateTree:"repair-tree",
  baseCommit:boundedClosureContractRevision, evidenceTask:boundedClosureEvidenceTask,
  requestedPackIds:timeoutRepairPackIds }), ["incident-rebased"],
"the frozen bounded closure checkpoint retains an audited eligible product repair");
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

const artifactLockTimeoutRepairRegression = ({ incidentId, failureDigest, diagnosedBoundary,
  causalCategory = "artifact/process locking" }) => {
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
  "66b91e38e6c55d6611daaa572d626ca3dfbb3dd9");
const preIntentBuildIdentity = verificationTaskIdentity(planVerification(preIntentArchivePacks, {
  terminalFull:true, includeProperties:true,
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
  new URL("./fixtures/vtd014-historical-capture-timeout.json", import.meta.url), "utf8",
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
        "genuinely-unrelated":"unrelated-tree" }[commit],
    }),
    currentCandidate:async() => incidentCandidate,
    changedPaths:async() => ["scripts/dist-artifact-lock.mjs"],
    candidateChangedPaths:async(fromCommit, toCommit) => {
      incidentCandidateChangedRange = [fromCommit, toCommit];
      return incidentCandidateChangedPaths;
    },
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
    planDigest:"e".repeat(64), outputSha256:"f".repeat(64), stderrSha256:"0".repeat(64),
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
      ["src/shared-resource-lifecycle.ts"], "unit:test/verification-process-contract-test.mjs",
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
    ["scripts/run-focused-acceptance.mjs"], "unit:test/verification-process-contract-test.mjs",
    [...timeoutCanonicalIdentities, browserTask]));
  const receiptDirectory = path.join(incidentFixtureRoot, "tmp", "verification-receipts");
  await mkdir(receiptDirectory, { recursive:true });
  const writeRunnerReceipt = async(name, receipt) => {
    const target = path.join(receiptDirectory, `${name}.json`);
    await writeFile(target, `${JSON.stringify({ version:2, runId:name,
      completedAt:"2026-08-09T00:00:01.000Z", ...receipt })}\n`);
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
  assert.equal((await store.blocking({ commit:"failed-commit" })).length, 4);
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
  const fabricated = await store.create({ ...failure, runnerRunId:"run-fabricated" });
  await store.claimDiagnosticRetry(fabricated.id, fabricated.failure.retryIdentity);
  await assert.rejects(store.classifyDiagnosticRetry(fabricated.id, { outcome:"passed" }),
    /runner receipt path/u, "caller-asserted outcomes are never classification evidence");
  for (const [outcome, classification] of Object.entries({
    passed:"confirmed-flaky", sameFailure:"reproduced-failure", failed:"changed-failure",
    identityChanged:"diagnostic-contract-failure",
  })) {
    const separate = await store.create({ ...failure, runnerRunId:`run-${outcome}` });
    await store.claimDiagnosticRetry(separate.id, separate.failure.retryIdentity);
    const diagnosticReceipt = await writeRunnerReceipt(`diagnostic-${outcome}`, {
      candidate:{ commit:"failed-commit", tree:"failed-tree" },
      environment:failure.environment, artifact:failure.artifact,
      diagnostic:{ incidentId:separate.id,
        retryIdentity:outcome === "identityChanged" ? "changed" : separate.failure.retryIdentity,
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
  let runnerIncidentSequence = 0;
  const runnerStore = createTimeoutIncidentStore({
    root:incidentFixtureRoot,
    storeDirectory:path.join(incidentFixtureRoot, "runner-incidents"),
    now:() => "2026-08-09T00:00:00.000Z",
    randomId:() => `runner-path-incident-${runnerIncidentSequence += 1}`,
    isAncestor:async(ancestor) => ancestor !== "off-lineage",
    currentCandidate:async() => ({ commit:"repair-commit", tree:"repair-tree" }),
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
    candidateIdentity:async() => ({ commit:"repair-commit", tree:"repair-tree", branch:"candidate" }),
    artifactIdentity:async() => failure.artifact,
    canonicalPlan:{ tasks:[runnerRuntimeTask] },
    strictToolchainValidator:async() => {},
    candidateCleanValidator:async() => {},
    changeSetLoader:async() => ({ version:1, baseCommit:"approved-base", commit:"repair-commit",
      entries:[{ status:"M", path:"src/repair.ts" },
        { status:"M", path:"swarmforge/roles/coder.prompt" }],
      paths:["src/repair.ts", "swarmforge/roles/coder.prompt"] }),
    incidentChangedPathsLoader:async() => ["src/repair.ts"],
    verificationPacksLoader:async() => ({}),
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
  const regressionKey = "unit:test/verification-process-contract-test.mjs";
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
  assert.equal(repairCommitBlocking.length, 10,
    "other classified flakes remain blocking while the repaired incident is resolved");
  const evidence = timeoutResolutionEvidence(resolved);
  assert.equal(evidence.resolutionDigest, resolved.resolution.digest);
  const verifiedResolutions = await store.resolutions({ commit:"reclaimed-commit" });
  assert.equal(verifiedResolutions[0].packageDigest,
    resolved.resolution.package.digest,
  "Git-note resolution loading recomputes archived checkpoint and package links");
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
    { cwd:path.resolve(new URL("../", import.meta.url).pathname) },
    (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
  const postFlowChangedFiles = await new Promise((resolve, reject) => execFile("git",
    ["diff", "--name-only", vtd014ApprovedFlowBaselineCommit,
      vtd014ApprovedTerminalRepairBaselineCommit],
    { cwd:path.resolve(new URL("../", import.meta.url).pathname) },
    (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
  assert.deepEqual(postFlowChangedFiles.filter((file) => file.startsWith("src/")),
    ["src/durable-project/persistence-readiness.ts", "src/side-panel.ts",
      "src/specification-builder.ts"]);
  const postTerminalChangedFiles = await new Promise((resolve, reject) => execFile("git",
    ["diff", "--name-only", vtd014ApprovedTerminalRepairBaselineCommit,
      vtd014TerminalRepairClosureCommit],
    { cwd:path.resolve(new URL("../", import.meta.url).pathname) },
    (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
  const postSuccessionSpecificationChangedFiles = await new Promise((resolve, reject) => execFile("git",
    ["diff", "--name-only", vtd014ApprovedSuccessionSpecificationCommit,
      vtd014ApprovedTerminalRepairBaselineCommit],
    { cwd:path.resolve(new URL("../", import.meta.url).pathname) },
    (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
  assert.deepEqual(postSuccessionSpecificationChangedFiles.filter(
    (file) => file.startsWith("features/")), []);
  const acceptedBasePacks = await verificationPacksAtCommit(vtd014AcceptedBaseCommit);
  const allPackIds = [...timeoutRepairPackIds];
  const currentConservationPlan = planVerification(timeoutPackRegistry,
    { packIds:allPackIds, includeProperties:true });
  const acceptedBaseConservationPlan = planVerification(acceptedBasePacks,
    { packIds:allPackIds, includeProperties:true });
  const approvedStyleSmokeTargetIds = new Set([
    "STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
    "SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
    "FLOW_STYLESHEET_EXTRACTION_TARGET",
  ]);
  const packContract = (packs) => packs.filter(({ id }) => allPackIds.includes(id))
    .map(({ id, dependencies, browserObservations,
      checkpointCommands }) => ({ id, dependencies,
      browserObservations:(browserObservations ?? []).filter(({ id: targetId }) =>
        !approvedStyleSmokeTargetIds.has(targetId)), checkpointCommands }));
  const currentCalibration = JSON.parse(await readFile(
    new URL("../verification/performance-calibration.json", import.meta.url), "utf8"));
  const acceptedBaseCalibration = JSON.parse(await new Promise((resolve, reject) => execFile("git",
    ["show", `${vtd014AcceptedBaseCommit}:verification/performance-calibration.json`],
    { cwd:path.resolve(new URL("../", import.meta.url).pathname) },
    (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout))));
  delete currentCalibration.conservation.verificationTopologyDigest;
  delete acceptedBaseCalibration.conservation.verificationTopologyDigest;
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
  await import("../scripts/verification-task-succession-test.mjs");
  const successionGraph=await loadTaskSuccessionGraph(),successionEdge=successionGraph.edges[0],
    successionSource=successionGraph.identities[successionEdge.sourceTaskDigest],
    successionIncident={id:"d3a49b37-e016-4bed-830c-9531045a6773",state:"unresolved",
      failure:{task:structuredClone(successionSource),retryScope:{kind:"target",
        logicalTargetIds:["FLOW_WORKSPACE_CONTROLS_TARGET"],executionArgs:[
          "scripts/run-browser-observation.mjs","FLOW_WORKSPACE_CONTROLS_TARGET"]},
      failedBoundary:{logicalTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET"},
      causalKey:"immutable-causal-key",occurrence:{diagnostic:"immutable Zoom-in diagnostic"}}},
    successionIncidentBefore=JSON.stringify(successionIncident),
    currentSuccessionIdentities=currentConservationPlan.tasks.map(verificationTaskIdentity),
    flowTaskSuccession=await resolveIncidentTaskSuccession({incident:successionIncident,
      currentIdentities:currentSuccessionIdentities,currentPacks:timeoutPackRegistry}),
    registrySuccession=await validateUnresolvedIncidentTaskSuccession({incidents:[successionIncident],
      currentIdentities:currentSuccessionIdentities,currentPacks:timeoutPackRegistry});
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
        "d4dda1a04a965ee6f30c386ae7f9f25400e5a31466522ab1e6183f2a0206d084"||
        Boolean(sameTargetProjection.chain[0].conservedBoundaryDigest),currentCanonical:true,
      exactTarget:sameTargetProjection.execution.logicalTargetIds.length===1,
      immutableSource:true,separateIncidents:true,invalidBlocked:true,noInference:true},
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
  const normalizedCurrentVtd014TaskIdentity = (task) => {
    const identity = verificationTaskIdentity(task);
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
          vtd014ApprovedVtd017Generated, vtd014ApprovedVtd017Ir].includes(value));
      identity.target = identity.target.split(",")
        .filter((value) => ![vtd014ApprovedVtd015Feature, vtd014ApprovedVtd017Feature]
          .includes(value)).join(",");
    }
    return identity;
  };
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
      currentTaskDigest:verificationDigest(currentConservationPlan.tasks.filter(({key})=>![
        "unit:test/command-palette-installed-controller-test.mjs",
        "unit:test/flow-reload-lifecycle-test.mjs",
        "unit:test/workspace-tabs-installed-controller-test.mjs",
        "unit:test/settled-final-verification-workflow-test.mjs",
        "unit:test/package-clean-checkout-contract-test.mjs",
        "unit:test/verification-evidence-production-path-test.mjs",
        "unit:test/flow-stylesheet-extraction-test.mjs",
        "property:test/stylesheet-declarations-property-test.mjs",
        "browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
        "browser-observation:SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
        `acceptance-parse:${vtd014ApprovedVtd015Feature}`,
        `acceptance-generate:${vtd014ApprovedVtd015Feature}`,
        `acceptance-parse:${vtd014ApprovedVtd017Feature}`,
        `acceptance-generate:${vtd014ApprovedVtd017Feature}`,
      ].includes(key)).map(normalizedCurrentVtd014TaskIdentity)),
      acceptedBaseTaskDigest:verificationDigest(
        acceptedBaseConservationPlan.tasks.map(expectedVtd014TaskIdentity)),
      currentPackContractDigest:verificationDigest(packContract(timeoutPackRegistry)),
      acceptedBasePackContractDigest:verificationDigest(packContract(acceptedBasePacks)),
      currentCalibrationDigest:verificationDigest(currentCalibration),
      acceptedBaseCalibrationDigest:verificationDigest(acceptedBaseCalibration),
      diagnosticRetryOnPassingRun:false,
      allPackCount:timeoutRepairPackIds.length,
      packageTask:timeoutRepairPackageTaskIdentity.args.join(" ") },
  };
} finally {
  await rm(incidentFixtureRoot, { recursive:true, force:true });
}

const diagnosticEnvironment = createVerificationReceiptContext(1, 1).receipt.environment;
const diagnosticClaims = [];
let diagnosticReceiptObservation;
const diagnosticIncident = {
  id:"reachable-diagnostic", failure:{ retryIdentity:"retry-identity", retryScope:{ kind:"task",
    taskKey:"unit:reachable-diagnostic", executionArgs:["-e", "process.stdout.write('diagnostic-ran')"] },
    lineage:{ commit:"failed", tree:"failed-tree" }, environment:diagnosticEnvironment,
    configuredTimeoutMs:600000,
    resolvedDeadlines:{ DIST_ARTIFACT_LOCK_TIMEOUT_MS:600000,
      VERIFICATION_COMMAND_TIMEOUT_MS:600000, VERIFICATION_TERMINATION_GRACE_MS:5000 },
    artifact:{ inputDigest:"a".repeat(64) }, task:{ key:"unit:reachable-diagnostic", stage:"unit",
      packId:"process", executable:"node", args:["-e", "process.stdout.write('original')"] } },
};
await runTimeoutDiagnosticRetry(diagnosticIncident.id, {
  candidateIdentity:async() => ({ commit:"failed", tree:"failed-tree" }),
  artifactIdentity:async() => diagnosticIncident.failure.artifact,
  deadlineIdentity:() => diagnosticIncident.failure.resolvedDeadlines,
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
let changedDeadlineClaimed = false;
await assert.rejects(runTimeoutDiagnosticRetry(diagnosticIncident.id, {
  candidateIdentity:async() => ({ commit:"failed", tree:"failed-tree" }),
  artifactIdentity:async() => diagnosticIncident.failure.artifact,
  deadlineIdentity:() => ({ ...diagnosticIncident.failure.resolvedDeadlines,
    DIST_ARTIFACT_LOCK_TIMEOUT_MS:999999 }),
  store:{ read:async() => diagnosticIncident,
    claimDiagnosticRetry:async() => { changedDeadlineClaimed = true; },
    classifyDiagnosticRetry:async() => diagnosticIncident },
}), /deadline identity changed/u,
"a changed inner deadline is rejected before the diagnostic allowance is claimed or executed");
assert.equal(changedDeadlineClaimed, false);

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
  }),
  pack("empty", {
    source:[], unit:[], features:[], handlers:[], dependencies:["alpha"],
  }),
];

assert.throws(() => planVerification(synthetic, { packIds:["missing"] }), /Unknown verification pack/u);
assert.throws(() => planVerification(synthetic, { packIds:["empty"] }), /no runnable checks/u);
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
const declaredProgramBatchPacks = [pack("browser", {
  browserObservations:focusedObservationPacks[0].browserObservations.map((observation) => ({
    ...observation, sessionBatch:undefined,
  })),
  browserObservationBatches:[{
    id:"browser-main", path:"test/browser.mjs", observationCount:2,
  }],
})];
const exactEvidencePartition = {
  path:"test/browser.mjs",
  sessionBatch:"browser-main",
  originalLeaves:[["first", "mounted"], ["second", "persisted"]],
  targets:[
    { id:"BROWSER_FIRST", leaves:[["first", "mounted"]] },
    { id:"BROWSER_SECOND", leaves:[["second", "persisted"]] },
  ],
};
assert.doesNotThrow(() => validateBrowserEvidencePartitions([{
  ...focusedObservationPacks[0], browserEvidencePartitions:[exactEvidencePartition],
}]), "a split adapter may assign every original nested assertion leaf exactly once");
const dottedEvidencePartition = {
  ...exactEvidencePartition,
  sessionBatch:"browser-main",
  originalLeaves:["first.mounted", "second.persisted"],
  targets:[
    { id:"BROWSER_FIRST", leaves:["first.mounted"] },
    { id:"BROWSER_SECOND", leaves:["second.persisted"] },
  ],
};
const partitionedPerformancePack = {
  ...focusedObservationPacks[0],
  browserAdapters:["test/browser.mjs"],
  browserAdapterPerformance:[{
    path:"test/browser.mjs",
    singleTargetP90Milliseconds:20,
    maximumSingleTargetP90Milliseconds:10,
    targetIds:["BROWSER_FIRST", "BROWSER_SECOND"],
    sessionBatch:"browser-main",
  }],
  browserEvidencePartitions:[dottedEvidencePartition],
};
assert.throws(() => validateBrowserEvidencePartitions([{
  ...partitionedPerformancePack, browserEvidencePartitions:[],
}]), /requires one exact browser evidence partition/u,
"a replaced browser workflow cannot omit its assertion-leaf partition");
assert.throws(() => validateBrowserEvidencePartitions([{
  ...partitionedPerformancePack,
  browserObservations:[...partitionedPerformancePack.browserObservations,
    {id:"BROWSER_EXTRA", path:"test/browser.mjs", environment:{BROWSER_EXTRA:"1"},
      observationKeys:["extra"], features:["features/browser-three.feature"], sessionBatch:"browser-main"}],
  browserEvidencePartitions:[{
    ...dottedEvidencePartition,
    originalLeaves:[...dottedEvidencePartition.originalLeaves, "extra.observed"],
    targets:[...dottedEvidencePartition.targets,
      {id:"BROWSER_EXTRA", leaves:["extra.observed"]}],
  }],
}]), /must match its declared target set/u,
"an evidence partition cannot add a target outside the replaced workflow declaration");
assert.throws(() => validateBrowserEvidencePartitions([{
  ...partitionedPerformancePack,
  browserObservations:partitionedPerformancePack.browserObservations.map((observation) =>
    observation.id === "BROWSER_SECOND" ? {...observation, path:"test/other-browser.mjs"} : observation),
}]), /must use program test\/browser\.mjs/u,
"a partition target cannot execute through a different browser program");
assert.throws(() => validateBrowserEvidencePartitions([{
  ...partitionedPerformancePack,
  browserObservations:partitionedPerformancePack.browserObservations.map((observation) =>
    observation.id === "BROWSER_SECOND" ? {...observation, sessionBatch:"browser-other"} : observation),
}]), /must use batch browser-main/u,
"a partition target cannot execute through a mismatched session batch");
assert.doesNotThrow(() => validateBrowserEvidencePartitions([{
  ...focusedObservationPacks[0], browserEvidencePartitions:[dottedEvidencePartition],
}]), "a registry may spell exact leaf paths compactly without weakening the partition");
assert.deepEqual(browserObservationEvidenceLeaves(
  { ...focusedObservationPacks[0], browserEvidencePartitions:[dottedEvidencePartition] },
  focusedObservationPacks[0].browserObservations[1],
), [["second", "persisted"]], "compact registry leaf paths normalize before runtime checks");
assert.throws(() => validateBrowserEvidencePartitions([{
  ...focusedObservationPacks[0],
  browserEvidencePartitions:[{
    ...exactEvidencePartition,
    targets:exactEvidencePartition.targets.map((target) => ({
      ...target, leaves:[["first", "mounted"]],
    })),
  }],
}]), /assign every original assertion leaf exactly once/u,
"a duplicated predicate cannot stand in for unrelated original assertion leaves");
assert.equal(browserObservationSessionBatch(
  declaredProgramBatchPacks[0], declaredProgramBatchPacks[0].browserObservations[0],
), "browser-main", "an owning pack may declare one batch for every compatible program observation");
assert.equal(planVerification(declaredProgramBatchPacks, { packIds:["browser"] })
  .observationTasks.length, 1,
"a declared program batch schedules one browser process without duplicating the batch on every target");
assert.throws(() => validateBrowserObservationBatches([{
  ...declaredProgramBatchPacks[0],
  browserObservationBatches:[{
    id:"browser-main", path:"test/browser.mjs", observationCount:3,
  }],
}]), /must own exactly 3 compatible targets/u,
"a program batch cannot hide an omitted or newly unassigned logical observation");
const focusedObservationPlan = planVerification(focusedObservationPacks, {
  packIds:["browser"], browserTargetIds:["BROWSER_SECOND"],
});
assert.equal(focusedObservationPlan.mode, "focused");
assert.deepEqual(focusedObservationPlan.observationTasks.map(({ target }) => target), ["BROWSER_SECOND"],
  "focused correction executes only its requested logical browser target");
assert.deepEqual(verificationTaskIdentity(focusedObservationPlan.observationTasks[0]).aliasCommands,
  [["node", "scripts/run-browser-observation.mjs", "BROWSER_SECOND"]],
  "a subset batch cannot claim the full adapter command identity");
const exactObservationPlan = planVerification(focusedObservationPacks, { packIds:["browser"] });
assert.equal(exactObservationPlan.observationTasks.length, 1,
  "compatible browser observations share one process task");
assert.deepEqual(exactObservationPlan.observationTasks[0].logicalTargetIds,
  ["BROWSER_FIRST", "BROWSER_SECOND"],
  "a browser batch retains each logical evidence identity");
assert.deepEqual(verificationTaskIdentity(exactObservationPlan.observationTasks[0]).logicalTargetIds,
  ["BROWSER_FIRST", "BROWSER_SECOND"],
  "receipt evidence retains every logical target inside a shared session task");
assert.deepEqual(verificationTaskIdentity(exactObservationPlan.observationTasks[0]).aliasCommands,
  [["node", "test/browser.mjs"],
    ["node", "scripts/run-browser-observation.mjs", "BROWSER_FIRST"],
    ["node", "scripts/run-browser-observation.mjs", "BROWSER_SECOND"]],
  "strict acceptance can resolve the historical adapter command to its passed batch receipt");
const boundedBrowserPacks = [pack("browser", {
  source:["src/browser/core.ts", "src/browser/editor.ts"],
  impactBoundaries:[
    { id:"core", prefixes:["src/browser/core.ts"], propagateDependants:false },
    { id:"editor", prefixes:["src/browser/editor.ts"], propagateDependants:false },
  ],
  browserAdapters:["test/browser.mjs"],
  browserAdapterModes:[{ path:"test/browser.mjs", mode:"shared" }],
  browserObservations:[
    { id:"BROWSER_CORE", path:"test/browser.mjs", environment:{ BROWSER_CORE:"1" },
      observationKeys:["core"], features:["features/browser-one.feature"],
      sessionBatch:"browser-main", impactBoundaries:["core"] },
    { id:"BROWSER_EDITOR", path:"test/browser.mjs", environment:{ BROWSER_EDITOR:"1" },
      observationKeys:["editor"], features:["features/browser-two.feature"],
      sessionBatch:"browser-main", impactBoundaries:["editor"] },
  ],
})];
const boundedCorePlan = planVerification(boundedBrowserPacks, {
  changedPaths:["src/browser/core.ts"],
});
assert.deepEqual(boundedCorePlan.browserTasks, [],
  "a boundary-targeted impact plan does not schedule the monolithic adapter");
assert.deepEqual(boundedCorePlan.observationTasks.map(({ logicalTargetIds }) => logicalTargetIds),
  [["BROWSER_CORE"]], "a changed impact boundary schedules only its declared browser behavior");
const boundedTerminalPlan = planVerification(boundedBrowserPacks, { terminalFull:true });
assert.deepEqual(boundedTerminalPlan.observationTasks[0].logicalTargetIds,
  ["BROWSER_CORE", "BROWSER_EDITOR"],
  "terminal planning retains every split browser target in one compatible process");
assert.deepEqual(boundedTerminalPlan.browserTasks, [],
  "terminal planning does not repeat the replaced monolithic adapter");
assert.deepEqual(browserTargetConfigurations(focusedObservationPacks[0].browserObservations), {
  BROWSER_FIRST:{ BROWSER_FIRST:"1" },
  BROWSER_SECOND:{ BROWSER_SECOND:"1" },
}, "a shared observation process receives each logical target's isolated environment");
const selectedTargetConfigurations = selectedBrowserTargetConfigurations({
  SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify(["BROWSER_FIRST"]),
  SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS:JSON.stringify({
    BROWSER_FIRST:{ BROWSER_FIRST:"1" },
  }),
}, ["BROWSER_FIRST", "BROWSER_SECOND"]);
assert.deepEqual(selectedTargetConfigurations, [{
  id:"BROWSER_FIRST", environment:{ BROWSER_FIRST:"1" },
}], "a focused public target excludes the adapter's unrelated behavior target");
assert.deepEqual(summarizeBrowserTargetResults([
  { id:"BROWSER_FIRST", status:"passed", durationMs:3, observation:{ first:true } },
  { id:"BROWSER_SECOND", status:"failed", durationMs:4, error:"sentinel failure" },
]), {
  document:{ first:true },
  results:{ BROWSER_FIRST:{ status:"passed", durationMs:3 },
    BROWSER_SECOND:{ status:"failed", durationMs:4, error:"sentinel failure" } },
}, "one failed target retains an independent target's result and real timing");
const browserBatchMatches = focusedObservationPacks[0].browserObservations.map((observation) => ({
  packId:"browser", observation,
}));
assert.deepEqual(validateBrowserObservationBatch(browserBatchMatches)
  .map(({ id }) => id), ["BROWSER_FIRST", "BROWSER_SECOND"],
"the public browser runner accepts one owning pack, program, and declared session batch");
assert.throws(() => validateBrowserObservationBatch([
  browserBatchMatches[0], { ...browserBatchMatches[1], packId:"other" },
]), /one owning pack/u,
"the public browser runner rejects cross-pack batches even when their program matches");
assert.throws(() => validateBrowserObservationBatch([
  browserBatchMatches[0], {
    ...browserBatchMatches[1],
    observation:{ ...browserBatchMatches[1].observation, sessionBatch:undefined },
  },
]), /one declared non-empty session batch/u,
"the public browser runner rejects a multi-target batch without a common declaration");
assert.throws(() => validateBrowserObservationBatch([
  browserBatchMatches[0], {
    ...browserBatchMatches[1],
    observation:{ ...browserBatchMatches[1].observation, sessionBatch:"other-batch" },
  },
]), /one declared non-empty session batch/u,
"the public browser runner rejects incompatible declared session batches");
assert.throws(() => validateBrowserPerformanceDeclarations([
  pack("browser", {
    browserAdapters:["test/browser.mjs"],
    browserAdapterPerformance:[{
      path:"test/browser.mjs", singleTargetP90Milliseconds:12000,
      maximumSingleTargetP90Milliseconds:10000,
    }],
  }),
]), /Split slow browser adapter.*independently selectable targets.*reusable session batch/u);
assert.throws(() => completeBrowserObservationOutput(
  '{"first":true}\n{"swarmforgeBrowserTargetTiming":{"id":"BROWSER_FIRST","durationMs":3}}\n',
  focusedObservationPacks[0].browserObservations,
  7,
), /BROWSER_SECOND.*own timing/u,
"the browser runner rejects a batch that omits a logical target timing instead of assigning aggregate process time");
assert.throws(() => completeBrowserObservationOutput(
  '{"first":true}\n' +
  '{"swarmforgeBrowserTargetTiming":{"id":"BROWSER_FIRST","durationMs":3}}\n' +
  '{"swarmforgeBrowserTargetTiming":{"id":"BROWSER_SECOND","durationMs":4}}\n',
  focusedObservationPacks[0].browserObservations,
  7,
), /must emit their own pass or failure result/u,
"a multi-target browser process cannot substitute timings for independent results");
const completedTimingOutput = completeBrowserObservationOutput(
  '{"first":true}\n' +
  '{"swarmforgeBrowserTargetResult":{"id":"BROWSER_FIRST","status":"passed"}}\n' +
  '{"swarmforgeBrowserTargetTiming":{"id":"BROWSER_FIRST","durationMs":3}}\n' +
  '{"swarmforgeBrowserTargetResult":{"id":"BROWSER_SECOND","status":"passed"}}\n' +
  '{"swarmforgeBrowserTargetTiming":{"id":"BROWSER_SECOND","durationMs":4}}\n',
  focusedObservationPacks[0].browserObservations, 7,
);
assert.equal(completedTimingOutput.match(/swarmforgeBrowserTargetTiming/gu)?.length, 2,
  "the browser runner preserves one adapter-emitted timing per logical target");
assert.deepEqual(parseBrowserObservationBatchOutput(
  '{"first":true}\n' +
  '{"swarmforgeBrowserTargetResult":{"id":"BROWSER_FIRST","status":"passed"}}\n' +
  '{"swarmforgeBrowserTargetResult":{"id":"BROWSER_SECOND","status":"failed","error":"owned failure"}}\n',
  focusedObservationPacks[0].browserObservations,
).failures, [{ id:"BROWSER_SECOND", message:"owned failure" }],
"a failed logical target retains its own result without discarding an independent target document");
const sharedRootBatch=parseBrowserObservationBatchOutput(
  '{"layeredSchema":{"authoring001":true}}\n'+
  '{"swarmforgeBrowserTargetResult":{"id":"FIRST","status":"passed"}}\n'+
  '{"layeredSchema":{"authoring002":true}}\n'+
  '{"swarmforgeBrowserTargetResult":{"id":"SECOND","status":"passed"}}\n',
  [{id:"FIRST",observationKeys:["layeredSchema"],evidenceLeaves:[["layeredSchema","authoring001"]]},
    {id:"SECOND",observationKeys:["layeredSchema"],evidenceLeaves:[["layeredSchema","authoring002"]]}],
);
assert.deepEqual(sharedRootBatch.document,{layeredSchema:{authoring001:true,authoring002:true}},
  "disjoint assertion partitions retain the original shared evidence root without overwriting");
const repeatedNestedRootBatch=parseBrowserObservationBatchOutput(
  '{"flowGraph":{"runtime021":{"examples":true}}}\n'+
  '{"swarmforgeBrowserTargetResult":{"id":"EXAMPLES","status":"passed"}}\n'+
  '{"flowGraph":{"runtime021":{"authoring":true}}}\n'+
  '{"swarmforgeBrowserTargetResult":{"id":"AUTHORING","status":"passed"}}\n',
  [{id:"EXAMPLES",observationKeys:["flowGraph"],
    evidenceLeaves:[["flowGraph","runtime021","examples"]]},
  {id:"AUTHORING",observationKeys:["flowGraph"],
    evidenceLeaves:[["flowGraph","runtime021","authoring"]]}],
);
assert.deepEqual(repeatedNestedRootBatch.results.EXAMPLES,
  {flowGraph:{runtime021:{examples:true}}},
  "later targets sharing a runtime root cannot mutate an already matched target document");
assert.deepEqual(parseBrowserObservationOutput(
  '{"schemaWorkspace":{"fixture":"2:4"}}\n'+
  '{"swarmforgeBrowserTargetResult":{"id":"VALIDATION","status":"passed"}}\n'+
  '{"schemaWorkspace":{"fixture":"2:4"},"validationPresenceSemantics":{"passed":true}}\n',
  { id:"VALIDATION", observationKeys:["validationPresenceSemantics"] },
), { validationPresenceSemantics:{ passed:true } },
"a passed target ignores a preceding pending document owned by another target and uses its merged fallback");
assert.throws(() => parseBrowserObservationOutput(
  '{"first":{"mounted":true,"persisted":false}}\n',
  { ...focusedObservationPacks[0].browserObservations[0],
    evidenceLeaves:[["first", "mounted"], ["first", "persisted"]] },
), /omitted or failed assigned assertion leaf.*persisted/u,
"a renamed smoke observation or constant result cannot satisfy an assigned false leaf");
assert.deepEqual(parseBrowserObservationOutput(
  '{"studioChoiceControls":{"schema.only-defined":true}}\n',
  { id:"CHOICES", observationKeys:["studioChoiceControls"],
    evidenceLeaves:[["studioChoiceControls", "schema", "only-defined"]] },
), { studioChoiceControls:{ "schema.only-defined":true } },
"a literal dotted observation key satisfies its exact compact registry leaf identity");
assert.doesNotThrow(() => validateBrowserPerformanceDeclarations([
  {
    ...focusedObservationPacks[0],
    browserAdapters:["test/browser.mjs"],
    browserAdapterPerformance:[{
      path:"test/browser.mjs", singleTargetP90Milliseconds:12000,
      maximumSingleTargetP90Milliseconds:10000,
      targetIds:["BROWSER_FIRST", "BROWSER_SECOND"], sessionBatch:"browser-main",
    }],
  },
]));
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
await executeAcceptancePlan(feature, {
  runCommand:async(display, task) => executed.push({ display, key:task.key }),
});
assert.deepEqual(executed.map(({ display }) => display), feature.commands);
assert.ok(executed.findIndex(({ key }) => key.startsWith("checkpoint:")) <
  executed.findIndex(({ key }) => key.startsWith("acceptance-session:")));
const independentBrowserPlan = {
  ...feature,
  browserTasks:[{
    key:"browser:failure", stage:"browser", packId:"alpha", executable:"node",
    args:["test/failing-browser.mjs"], target:"test/failing-browser.mjs", environment:null,
    display:"node test/failing-browser.mjs",
  }],
};
const attemptedBrowserTasks = [];
await assert.rejects(() => executeAcceptancePlan(independentBrowserPlan, {
  runCommand:async(_display, task) => {
    attemptedBrowserTasks.push(task.key);
    if (task.key === "browser:failure") throw new Error("adapter failed");
  },
}), /Browser verification failed/u);
assert.ok(attemptedBrowserTasks.includes("browser-observation:ALPHA_BROWSER_ADAPTER"),
  "independent observations still run after a broad browser adapter fails");
const attemptedSessions = [];
let activeSessions = 0;
let maximumActiveSessions = 0;
await assert.rejects(() => executeAcceptancePlan({
  preparationTasks:[], unitTasks:[], propertyTasks:[], browserTasks:[], observationTasks:[],
  parserTasks:[], generatorTasks:[], checkpointTasks:[],
  unitCommands:[], parserCommands:[],
  sessionTasks:["fail-a", "pass", "fail-b"].map((name) => ({
    key:`acceptance-session:${name}`, stage:"acceptance-session", packId:name,
    executable:"bb", args:[name], target:name, environment:null, display:`bb ${name}`,
  })),
}, {
  concurrency:2,
  runCommand:async(_display, task) => {
    attemptedSessions.push(task.key);
    activeSessions += 1;
    maximumActiveSessions = Math.max(maximumActiveSessions, activeSessions);
    await new Promise((resolve) => setTimeout(resolve, 5));
    activeSessions -= 1;
    if (task.key.includes("fail")) throw new Error(task.key);
  },
}), /2 independent command/u);
assert.deepEqual(attemptedSessions.sort(), [
  "acceptance-session:fail-a", "acceptance-session:fail-b", "acceptance-session:pass",
], "independent pack sessions finish and consolidate their failures");
assert.equal(maximumActiveSessions, 2, "independent pack sessions use the bounded worker pool");

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
    assert.deepEqual(task.artifactLease, {
      token:"coordinator-token", access:"read",
    }, "read-only browser children receive the coordinator's exact lease");
    activeSharedArtifactTasks += 1;
    maximumSharedArtifactTasks = Math.max(maximumSharedArtifactTasks, activeSharedArtifactTasks);
    await new Promise((resolve) => setTimeout(resolve, 20));
    activeSharedArtifactTasks -= 1;
    sharedArtifactEvents.push(`finish:${task.key}`);
  },
});
assert.equal(maximumSharedArtifactTasks, 2,
  "two independent browser observations overlap under one coordinator lease");
assert.ok(sharedArtifactEvents.indexOf("lease-acquired") <
  sharedArtifactEvents.indexOf("artifact-validated"));
assert.ok(sharedArtifactEvents.indexOf("artifact-validated") <
  sharedArtifactEvents.indexOf("start:browser-observation:one"));
assert.equal(sharedArtifactEvents.at(-1), "lease-released",
  "the coordinator retains the artifact lease until its planned consumers settle");
assert.equal(sharedArtifactMetrics.artifactWaitMs, 0);
assert.equal(sharedArtifactMetrics.coordinatorArtifactWaitMs, 7);
assert.equal(sharedArtifactMetrics.observationWorkerCount, 2);
assert.ok(sharedArtifactMetrics.usefulOverlapMs > 0);
assert.ok(sharedArtifactMetrics.browserObservationStageMs >= 10);
assert.ok(sharedArtifactMetrics.completeGateMs >= sharedArtifactMetrics.browserObservationStageMs);

assert.deepEqual(deterministicBrowserWorkerSchedule([
  { key:"slow", durationMs:90_000, isolated:true },
  { key:"medium", durationMs:60_000, isolated:true },
  { key:"small", durationMs:30_000, isolated:true },
  { key:"shared", durationMs:120_000, isolated:false },
], 3), {
  parallel:[
    { loadMs:90_000, taskKeys:["slow"] },
    { loadMs:60_000, taskKeys:["medium"] },
    { loadMs:30_000, taskKeys:["small"] },
  ],
  serial:["shared"],
}, "indivisible measured durations produce a stable longest-first candidate schedule");
const acceptedThreeWorkers = decideBrowserObservationWorkers({
  acceptedTwoWorker:{ mode:"normal", packId:"layered_schema", durationMs:220_000, passed:true },
  candidateThreeWorkerNormal:{ mode:"normal", packId:"layered_schema", durationMs:150_000,
    passed:true, collisions:[] },
  candidateThreeWorkerLoaded:{ mode:"loaded", packId:"layered_schema", durationMs:165_000,
    passed:true, collisions:[] },
});
assert.equal(acceptedThreeWorkers.workerCount, 3);
assert.equal(acceptedThreeWorkers.savingsMs, 70_000);
assert.equal(decideBrowserObservationWorkers({
  acceptedTwoWorker:{ mode:"normal", packId:"layered_schema", durationMs:220_000, passed:true },
  candidateThreeWorkerNormal:{ mode:"normal", packId:"layered_schema", durationMs:150_000,
    passed:true, collisions:[] },
  candidateThreeWorkerLoaded:{ mode:"loaded", packId:"layered_schema", durationMs:165_000,
    passed:false, collisions:["profile"] },
}).workerCount, 2, "a failed loaded sample cannot be retried away into a three-worker default");

const accessLock = path.join(await mkdtemp(path.join(os.tmpdir(), "verification-shared-artifact-")), "lock");
const accessRelease = await acquireDistArtifactLock(accessLock);
let outsideWriterAcquired = false;
let outsideWriterWasBlocked = false;
let outsideWriterRelease;
const savedLeaseEnvironment = {
  token:process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD,
  access:process.env.MY_CHROME_UTILITIES_DIST_LOCK_ACCESS,
};
try {
  Object.assign(process.env, distArtifactLeaseEnvironment(accessRelease.token, "read"));
  await withDistArtifactLock(async() => {}, { directory:accessLock, access:"read" });
  await assert.rejects(
    withDistArtifactLock(async() => {}, { directory:accessLock, access:"write" }),
    /read-only artifact lease cannot authorize write access/u,
    "a coordinator reader cannot mutate or replace the shared artifact",
  );
  const outsideWriter = acquireDistArtifactLock(accessLock, {
    timeoutMs:1_000, reportAfterMs:500,
  }).then((release) => {
    outsideWriterAcquired = true;
    outsideWriterRelease = release;
  });
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(outsideWriterAcquired, false,
    "an outside writer remains blocked while the coordinator serves readers");
  outsideWriterWasBlocked = !outsideWriterAcquired;
  releaseSharedArtifact = async() => outsideWriter;
} finally {
  if (savedLeaseEnvironment.token === undefined) delete process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD;
  else process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD = savedLeaseEnvironment.token;
  if (savedLeaseEnvironment.access === undefined) delete process.env.MY_CHROME_UTILITIES_DIST_LOCK_ACCESS;
  else process.env.MY_CHROME_UTILITIES_DIST_LOCK_ACCESS = savedLeaseEnvironment.access;
  await accessRelease();
  await releaseSharedArtifact?.();
  await outsideWriterRelease?.();
  await rm(path.dirname(accessLock), { recursive:true, force:true });
}
assert.equal(outsideWriterAcquired, true,
  "the outside writer resumes only after the coordinator releases the artifact");

const failedParallelAttempts = [];
let failedParallelLeaseReleased = false;
await assert.rejects(() => executeAcceptancePlan(sharedArtifactPlan, {
  observationConcurrency:2,
  acquireArtifactLease:async() => ({ token:"failure-token", waitMs:0,
    release:async() => { failedParallelLeaseReleased = true; } }),
  runCommand:async(_display, task) => {
    if (task.stage === "build") return;
    failedParallelAttempts.push(task.key);
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (task.key.endsWith(":one")) throw new Error("original-one-failure");
  },
}), /browser-observation:one/u);
assert.deepEqual(failedParallelAttempts.sort(), [
  "browser-observation:one", "browser-observation:two",
], "one worker failure does not discard the remaining independent result");
assert.equal(failedParallelLeaseReleased, true,
  "a failed combined result still releases the coordinator artifact lease");

const packs = await loadVerificationPacks();
await validateVerificationPacks(packs);
await assert.rejects(() => validateVerificationPacks(packs.map((pack) =>
  pack.id === "project_management" ? { ...pack, executionPrerequisites:[{
    path:"test/flow-examples-timing-test.mjs", requiredCapabilities:["local-loopback"],
  }] } : pack)), /exact registered test execution prerequisite in pack project_management/u,
"a pack cannot grant authority to a task owned by another pack");
const focusedShellPlan = selectFocusedVerificationTasks(planVerification(packs, {
  packIds:["shell"],
}), ["unit:test/verification-process-contract-test.mjs"]);
assert.deepEqual(focusedShellPlan.tasks.map(({ key }) => key),
  ["unit:test/verification-process-contract-test.mjs"],
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
  "../acceptance/src/acceptance/verification_support/modular_architecture_vtd007_handlers.clj",
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
const modularVtd014HandlerSource = await readFile(new URL(
  "../acceptance/src/acceptance/verification_support/modular_architecture_vtd014_handlers.clj",
  import.meta.url), "utf8");
assert.match(modularVtd014HandlerSource,
  /scoped-command-approval\|bwrap-shared-loopback[\s\S]*workspace-sandbox\|bwrap-unshared-network/u,
  "acceptance evidence matches the tested mixed-plan capability isolation boundaries");
const modularVtd006HandlerSource = await readFile(new URL(
  "../acceptance/src/acceptance/verification_support/modular_architecture_vtd006_handlers.clj",
  import.meta.url), "utf8");
assert.match(modularVtd006HandlerSource,
  /the one-time delivery checkpoint[\s\S]*\(let \[prepared \(prepared world\)\][\s\S]*:packInventory/u,
  "the standalone VTD-006 checkpoint step loads its production evidence before asserting it");
const modularEventLibraryHandlerSource = await readFile(new URL(
  "../acceptance/src/acceptance/verification_support/modular_architecture_event_library_handlers.clj",
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
const repositoryCommonStore = await defaultStoreDirectory(process.cwd());
assert.ok(repositoryCommonStore.startsWith(path.join(os.tmpdir(), "swarmforge-repository-runtime")),
  "the repository-common incident store is writable under the real workspace restriction");
assert.equal(repositoryCommonStore.includes(`${path.sep}.git${path.sep}`), false,
  "ordinary reliability failures do not depend on protected Git metadata");
const repositoryCommonAttempts = await defaultCheckpointAttemptDirectory(process.cwd());
assert.equal(path.dirname(repositoryCommonAttempts), path.dirname(repositoryCommonStore),
  "incidents and checkpoint attempts share one writable repository-common runtime identity");
for (const modulePath of [
  "../scripts/run-focused-acceptance.mjs",
  "../scripts/verification-reliability-persistence.mjs",
  "../scripts/verification-reliability-repair.mjs",
  "../scripts/verification-reliability-store.mjs",
  "../scripts/verification-reliability-values.mjs",
]) {
  const source = await readFile(new URL(modulePath, import.meta.url), "utf8");
  assert.doesNotMatch(source, /["'`]Timeout (?:incident|repair)/u,
    `${modulePath} exposes failure-neutral Reliability incident/repair diagnostics`);
}
const adapterModes = new Map(packs.flatMap((pack) => (pack.browserAdapterModes ?? [])
  .map(({ path:adapterPath, mode }) => [adapterPath, mode])));
assert.equal([...adapterModes.values()].filter((mode) => mode === "shared-wrapper").length, 0);
for (const program of [
  "test/browser-packs/side-panel-capture.mjs",
  "test/browser-packs/side-panel-event-library.mjs",
  "test/browser-packs/side-panel-schemas.mjs",
  "test/browser-packs/side-panel-defects.mjs",
  "test/browser-packs/side-panel-shell.mjs",
]) assert.equal(adapterModes.get(program), "integration");
assert.equal(adapterModes.get("test/browser-packs/flow-graph.mjs"), "shared");
assert.equal(adapterModes.get("test/twatility-projects-browser-test.mjs"), "integration");
assert.deepEqual(staticallyResolvableModuleImports([
  'import { wait } from "./shared-harness.mjs";',
  'import "../support/setup.mjs";',
  'export { helper } from "./reexported.mjs";',
  'await import("./literal-wrapper.mjs");',
  'await import(runtimeSelectedModule);',
].join("\n"), "test/browser-packs/example.mjs"), [
  "test/browser-packs/literal-wrapper.mjs",
  "test/browser-packs/reexported.mjs",
  "test/browser-packs/shared-harness.mjs",
  "test/support/setup.mjs",
], "supported static and literal-dynamic module imports must resolve relative to their adapter");
assert.equal(browserAdapterUsesSharedHarness([
  '// import { wait } from "./shared-harness.mjs";',
  'const diagnostic = "shared-harness import(\\\"./shared-harness.mjs\\\")";',
  'const template = `./shared-harness.mjs`;',
].join("\n"), "test/browser-packs/comment-only.mjs"), false,
  "comments, ordinary strings, and templates must not masquerade as a shared-harness import");
assert.equal(browserAdapterUsesSharedHarness(
  'import { wait } from "../browser-packs/./shared-harness.mjs";',
  "test/integration/example.mjs",
), true, "a genuine normalized static harness import must be recognized");
const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "flow_graph", (pack) => ({
  browserAdapterModes:pack.browserAdapterModes.slice(0, -1),
}))), /Classify every browser adapter/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "flow_graph", (pack) => ({
  browserAdapterModes:pack.browserAdapterModes.map((entry) => entry.path ===
    "test/browser-packs/flow-graph.mjs" ? { ...entry, mode:"integration" } : entry),
}))), /Integration browser adapter must not masquerade as a shared adapter/u,
  "an integration classification must reject an adapter that genuinely imports the shared harness");
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "branding_polish", (pack) => ({
  verificationInputs:[...pack.verificationInputs,
    "src/specification-studio-technical-analyst-guidance.ts"],
}))), /Remove self-owned verification input/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "branding_polish", (pack) => ({
  verificationInputs:[...pack.verificationInputs, ...pack.verificationInputs],
}))), /Declare every verification input once/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs,
  "selective_profile_inheritance", () => ({
    verificationInputs:["src/commands.ts"],
  }))), /Verification inputs require runnable checks/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs,
  "branding_polish", () => ({
    verificationInputs:["../outside.md"],
  }))), /exact normalized non-generated verification input/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs,
  "branding_polish", () => ({
    runtimeInputs:["../outside.css"],
}))), /exact normalized runtime input/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs,
  "flow_graph", () => ({
    isolatedVerificationHandlers:["acceptance/src/acceptance/steps/not-flow-graph.clj"],
  }))), /Isolate only exact handlers owned by pack flow_graph/u);
const projectManagementPack = packs.find(({ id }) => id === "project_management");
const vtd004BasePacks = JSON.parse(await exec("git", [
  "show", "9a2f202483:verification/packs.json",
]));
const vtd004BaseCalibration = JSON.parse(await exec("git", [
  "show", "9a2f202483:verification/performance-calibration.json",
]));
const vtd004CurrentCalibration = JSON.parse(await readFile(
  new URL("../verification/performance-calibration.json", import.meta.url), "utf8"));
const vtd004CompletedProjectCalibration = JSON.parse(await exec("git", [
  "show", "2d46bc7062:verification/performance-calibration.json",
]));
assert.deepEqual(projectManagementPack.impactBoundaries.map(({ id, sourceClass, propagateDependants }) =>
  [id, sourceClass, propagateDependants]), [
  ["project_entity_lifecycle_semantic", "core or semantic", true],
  ["project_page_authoring_controller", "application controller", true],
  ["project_assignment_routing_semantic", "core or semantic", true],
  ["project_assignment_routing_presentation", "browser presentation", false],
  ["project_library_persistence", "persistence migration", true],
  ["project_library_controller", "application controller", true],
  ["project_library_presentation", "browser presentation", false],
], "project-management source classes and propagation are explicit production registry data");
assert.deepEqual(projectManagementPack.isolatedVerificationHandlers,
  ["acceptance/src/acceptance/steps/project_management.clj"],
  "the project-management APS handler is explicitly isolated");
const projectHandlerPath = projectManagementPack.isolatedVerificationHandlers[0];
const projectHandlerSource = await readFile(new URL(`../${projectHandlerPath}`, import.meta.url), "utf8");
const projectServedFeatures = [...projectHandlerSource.matchAll(
  /"(features\/[A-Za-z0-9_./-]+\.feature)"/gu,
)].map((match) => match[1]);
assert.deepEqual([...projectServedFeatures].sort(), [...projectManagementPack.features].sort(),
  "the isolated handler serves exactly all six project-management feature identities");
const projectNamespace = "acceptance.steps.project-management";
assert.equal(clojureRequiresNamespace(
  `(ns acceptance.steps.consumer (:require ${projectNamespace}))`, projectNamespace,
), true, "a bare Clojure libspec is a cross-pack namespace consumer");
assert.equal(clojureRequiresNamespace(
  `(ns acceptance.steps.consumer (:require [^{:load true} ${projectNamespace} :as project]))`,
  projectNamespace,
), true, "a metadata-decorated Clojure libspec is a cross-pack namespace consumer");
assert.equal(clojureRequiresNamespace(
  "(ns acceptance.steps.consumer (:require [acceptance.steps [project-management :as project]]))",
  projectNamespace,
), true, "a prefix-list Clojure libspec is a cross-pack namespace consumer");
assert.equal(clojureRequiresNamespace(
  `(ns acceptance.steps.consumer) ; ${projectNamespace}\n(def example \"${projectNamespace}\")`,
  projectNamespace,
), false, "comments and strings do not create cross-pack namespace consumers");
const registeredHandlerPaths = [...new Set(packs.flatMap((pack) => pack.handlers ?? []))];
const projectHandlerConsumers = [];
for (const handlerPath of registeredHandlerPaths) {
  const source = await readFile(new URL(`../${handlerPath}`, import.meta.url), "utf8");
  if (handlerPath !== projectHandlerPath && clojureRequiresNamespace(source, projectNamespace)) {
    projectHandlerConsumers.push(handlerPath);
  }
}
assert.deepEqual(projectHandlerConsumers, [],
  "no registered APS/Clojure handler outside the owner consumes the isolated project handler");
const crossPackConsumer = packs.find(({ id, handlers }) => id !== "project_management" && handlers?.length);
const crossPackHandler = crossPackConsumer.handlers[0];
await assert.rejects(() => validateIsolatedVerificationHandlers(packs, {
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../${handlerPath}`, import.meta.url), "utf8");
    return handlerPath === crossPackHandler
      ? `${source}\n[acceptance.steps.project-management :as project-management]\n`
      : source;
  },
}), new RegExp(`Cross-pack handler consumer blocks isolation.*${crossPackHandler.replaceAll("/", "\\/")}`, "u"),
"a negative cross-pack APS consumer mutation blocks handler isolation");
await assert.rejects(() => validateIsolatedVerificationHandlers(packs, {
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../${handlerPath}`, import.meta.url), "utf8");
    return handlerPath === crossPackHandler
      ? `${source}\n[acceptance.steps.project-management :refer [handlers]]\n`
      : source;
  },
}), new RegExp(`Cross-pack handler consumer blocks isolation.*${crossPackHandler.replaceAll("/", "\\/")}`, "u"),
"a non-alias :refer consumer mutation also blocks handler isolation");
for (const [description, mutation] of [
  ["a bare cross-pack Clojure libspec blocks handler isolation",
    `(ns acceptance.steps.consumer (:require ${projectNamespace}))`],
  ["a metadata-decorated cross-pack Clojure libspec blocks handler isolation",
    `(ns acceptance.steps.consumer (:require [^{:load true} ${projectNamespace} :as project-management]))`],
  ["a prefix-list cross-pack Clojure libspec blocks handler isolation",
    "(ns acceptance.steps.consumer (:require [acceptance.steps [project-management :as project-management]]))"],
]) {
  await assert.rejects(() => validateIsolatedVerificationHandlers(packs, {
    readSource:async(handlerPath) => {
      const source = await readFile(new URL(`../${handlerPath}`, import.meta.url), "utf8");
      return handlerPath === crossPackHandler ? `${source}\n${mutation}\n` : source;
    },
  }), new RegExp(`Cross-pack handler consumer blocks isolation.*${crossPackHandler.replaceAll("/", "\\/")}`, "u"),
  description);
}
const projectClosure = ["project_management", "durable_project_repository", "project_event_transport",
  "flow_graph", "flow_export", "live_flow_testing", "layered_schema",
  "property_set_flow_sections", "guided_test_cases", "shell"];
for (const changedPath of ["src/data-layer-assignment-routing-ui.ts",
  "src/data-layer-project-library-presentation-ui.ts"]) {
  const plan = planVerification(packs, { changedPaths:[changedPath], includeProperties:true });
  assert.deepEqual(plan.packIds, ["project_management"], `${changedPath} remains owner-only`);
  assert.equal(plan.unitTasks.length, 4);
  assert.equal(plan.propertyTasks.length, 4);
  assert.equal(plan.sessionTasks.length, 1);
  assert.equal(plan.parserTasks.length, 6);
  assert.equal(plan.browserTasks.length + plan.observationTasks.length, 4);
}
for (const changedPath of ["src/data-layer-project-entity-lifecycle.ts",
  "src/data-layer-page-authoring.ts", "src/data-layer-assignment-routing.ts",
  "src/data-layer-project-library.ts", "src/data-layer-project-library-ui.ts"]) {
  assert.deepEqual(planVerification(packs, { changedPaths:[changedPath] }).packIds, projectClosure,
    `${changedPath} retains the exact ten-pack dependant closure`);
}
assert.deepEqual(planVerification(packs, {
  changedPaths:["acceptance/src/acceptance/steps/project_management.clj"],
}).packIds, ["project_management"], "an isolated project handler selects only complete owner evidence");
const projectHistoryChange = (entry) => syntheticChangeSet([entry]);
const modifiedGeneratedArtifact = projectHistoryChange({
  status:"M", path:"dist/data-layer-project-library-ui.js",
});
assert.deepEqual(planVerification(packs, {
  packIds:["project_management"], changedPaths:modifiedGeneratedArtifact.paths,
  changeSet:modifiedGeneratedArtifact, basePacks:packs,
}).packIds, ["project_management"],
"a modified generated artifact remains excluded before isolated-handler history lookup");
const deletedProjectPresentation = projectHistoryChange({
  status:"D", path:"src/data-layer-assignment-routing-ui.ts",
});
assert.deepEqual(planVerification(packs, {
  changedPaths:deletedProjectPresentation.paths, changeSet:deletedProjectPresentation, basePacks:packs,
}).packIds, ["project_management"], "a deleted presentation retains its historical owner-only boundary");
const renamedBetweenPresentations = projectHistoryChange({status:"R", score:100,
  oldPath:"src/data-layer-assignment-routing-ui.ts",
  newPath:"src/data-layer-project-library-presentation-ui.ts"});
assert.deepEqual(planVerification(packs, {
  changedPaths:renamedBetweenPresentations.paths, changeSet:renamedBetweenPresentations, basePacks:packs,
}).packIds, ["project_management"], "a presentation-to-presentation rename remains owner-only");
const renamedIntoPersistence = projectHistoryChange({status:"R", score:100,
  oldPath:"src/data-layer-assignment-routing-ui.ts", newPath:"src/data-layer-project-library.ts"});
assert.deepEqual(planVerification(packs, {
  changedPaths:renamedIntoPersistence.paths, changeSet:renamedIntoPersistence, basePacks:packs,
}).packIds, projectClosure, "a presentation-to-propagating rename unions to the ten-pack closure");
assert.deepEqual(planVerification(packs, {
  changedPaths:deletedProjectPresentation.paths, changeSet:deletedProjectPresentation,
  basePacks:packs, historicalRegistryFallback:true,
}).packIds, planVerification(packs, {terminalFull:true}).packIds,
"an unreadable historical project boundary falls back to every runnable pack");
const exactEvidenceKeys = ["unit", "property", "features", "handlers", "browserAdapters"];
const vtd006RegisteredPrograms = new Set([
  "test/browser-packs/side-panel-capture.mjs",
  "test/browser-packs/side-panel-event-library.mjs",
  "test/browser-packs/side-panel-schemas.mjs",
  "test/browser-packs/side-panel-defects.mjs",
  "test/browser-packs/side-panel-shell.mjs",
]);
const conservedEvidenceProfile = (pack) => Object.fromEntries(exactEvidenceKeys.map((key) => [key,
  pack[key].filter((path) => !vtd006RegisteredPrograms.has(path)),
]));
const baseProjectManagementPack = vtd004BasePacks.find(({ id }) => id === "project_management");
const projectEvidenceProfile = conservedEvidenceProfile(projectManagementPack);
assert.deepEqual(projectEvidenceProfile, conservedEvidenceProfile(baseProjectManagementPack),
"all exact project-management evidence identities are conserved from the accepted base");
const exactProjectPlan = planVerification(packs, {packIds:["project_management"], includeProperties:true});
for (const [key, taskKey] of [["unit", "unitTasks"], ["property", "propertyTasks"],
  ["features", "parserTasks"], ["browserAdapters", "browserTasks"]]) {
  assert.deepEqual(exactProjectPlan[taskKey].map(({ target }) => target).sort(),
    [...projectEvidenceProfile[key]].sort(), `${key} evidence executes exactly once by identity`);
}
assert.deepEqual(exactProjectPlan.sessionTasks.map(({ packId }) => packId), ["project_management"],
  "the one exact owner session consumes the one isolated project-management handler");
const vtd008BasePacks = JSON.parse(await exec("git", ["show", "0adee4fa84:verification/packs.json"]));
const baseTerminalPlan = planVerification(vtd008BasePacks, {terminalFull:true});
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
const normalizedVtd006Identity = (task) => {
  let encoded = JSON.stringify(verificationTaskIdentity(task));
  for (const [current, previous] of vtd006ProgramMigration) encoded = encoded.replaceAll(current, previous);
  const identity = JSON.parse(encoded);
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
      ![vtd015Generated, vtd015Ir, vtd017Generated, vtd017Ir].includes(value));
    identity.target = identity.target.split(",")
      .filter((value) => ![vtd015Feature, vtd017Feature].includes(value)).join(",");
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
const acceptedTerminalIdentities = baseTerminalPlan.tasks.map(expectedVtd014TerminalIdentity);
const postBaseAddedUnitKeys = new Set([
  "unit:test/command-palette-installed-controller-test.mjs",
  "unit:test/hotkey-installed-controller-test.mjs",
  "unit:test/flow-reload-lifecycle-test.mjs",
  "unit:test/workspace-tabs-installed-controller-test.mjs",
]);
const approvedVtd015TaskKeys = new Set([
  "unit:test/settled-final-verification-workflow-test.mjs",
  `acceptance-parse:${vtd015Feature}`,
  `acceptance-generate:${vtd015Feature}`,
]);
const approvedVtd017TaskKeys = new Set([
  `acceptance-parse:${vtd017Feature}`,
  `acceptance-generate:${vtd017Feature}`,
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
const approvedVerificationTaskKeys = new Set([
  ...approvedVtd015TaskKeys,
  ...approvedVtd017TaskKeys,
  ...approvedStyleSmokeTaskKeys,
  ...approvedStyleVerificationTaskKeys,
  ...approvedFlowStyleExtractionTaskKeys,
]);
const currentTerminalIdentitiesWithoutApprovedAdditions = currentTerminalPlan.tasks.filter(({ key }) =>
  !postBaseAddedUnitKeys.has(key) && !approvedVerificationTaskKeys.has(key)).map(normalizedVtd006Identity);
assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions,
  acceptedTerminalIdentities,
  "terminal-full planning conserves the accepted base identities around approved added units");
assert.equal(currentTerminalPlan.tasks.filter(({ key }) =>
  key === "unit:test/command-palette-installed-controller-test.mjs").length, 1,
"terminal-full planning adds the installed Command Palette controller regression exactly once");
assert.equal(currentTerminalPlan.tasks.filter(({ key }) =>
  key === "unit:test/hotkey-installed-controller-test.mjs").length, 1,
"terminal-full planning adds the installed Hotkeys controller regression exactly once");
assert.equal(currentTerminalPlan.tasks.filter(({ key }) =>
  key === "unit:test/flow-reload-lifecycle-test.mjs").length, 1,
"terminal-full planning adds the Flow reload lifecycle regression exactly once");
assert.equal(currentTerminalPlan.tasks.filter(({ key }) =>
  key === "unit:test/workspace-tabs-installed-controller-test.mjs").length, 1,
"terminal-full planning adds the installed workspace-tabs controller regression exactly once");
for (const taskKey of approvedVtd015TaskKeys) {
  assert.equal(currentTerminalPlan.tasks.filter(({ key }) => key === taskKey).length, 1,
    `terminal-full planning adds the approved VTD-015 task ${taskKey} exactly once`);
}
for (const taskKey of approvedVtd017TaskKeys) {
  assert.equal(currentTerminalPlan.tasks.filter(({ key }) => key === taskKey).length, 1,
    `terminal-full planning adds the approved VTD-017 task ${taskKey} exactly once`);
}
for (const taskKey of approvedStyleVerificationTaskKeys) {
  assert.equal(currentTerminalPlan.tasks.filter(({ key }) => key === taskKey).length, 1,
    `terminal-full planning adds the approved style-verification task ${taskKey} exactly once`);
}
for (const taskKey of approvedFlowStyleExtractionTaskKeys) {
  assert.equal(currentTerminalPlan.tasks.filter(({ key }) => key === taskKey).length, 1,
    `terminal-full planning adds the approved Flow style-extraction task ${taskKey} exactly once`);
}
assert.equal(currentTerminalPlan.observationTasks.filter(({ logicalTargetIds }) =>
  logicalTargetIds?.includes("FLOW_STYLESHEET_EXTRACTION_TARGET")).length, 1,
"terminal-full planning adds the approved Flow stylesheet logical target exactly once");
assert.equal(currentTerminalPlan.tasks.filter(({ target }) =>
  target === "test/acceptance/side-panel-browser-session-contract.mjs").length, 0,
"terminal-full planning does not add the focused VTD-006 session contract as a permanent task");
assert.equal(currentTerminalPlan.checkpointTasks.filter(({ display }) =>
  display === "npm run package").length, 1,
"terminal-full planning executes the package check exactly once");
const currentOtherPackRows = vtd004CompletedProjectCalibration.runnablePacks.filter(({ id }) =>
  id !== "project_management");
const baseOtherPackRows = vtd004BaseCalibration.runnablePacks.filter(({ id }) =>
  id !== "project_management");
assert.deepEqual(currentOtherPackRows, baseOtherPackRows,
  "the other 19 calibrated pack rows remain byte-equivalent to the accepted base");
assert.deepEqual(vtd004CompletedProjectCalibration.browserTargets, vtd004BaseCalibration.browserTargets,
  "all 81 browser-target calibration rows remain byte-equivalent to the accepted base");
const calibrationProvenanceKeys = ["version", "implementationCommit", "environmentClassId", "environment",
  "sourceScope", "minimumIndependentSamples", "tolerance", "receiptDigests", "algorithm"];
const calibrationProvenance = (calibration) => Object.fromEntries(calibrationProvenanceKeys.map((key) =>
  [key, calibration[key]]));
assert.deepEqual(calibrationProvenance(vtd004CompletedProjectCalibration),
  calibrationProvenance(vtd004BaseCalibration),
  "accepted calibration receipt scope and provenance remain byte-equivalent");
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
  conservation:{evidenceProfile:projectEvidenceProfile,
    exactTaskTargets:Object.fromEntries(["unitTasks", "propertyTasks", "parserTasks", "browserTasks"]
      .map((key) => [key, exactProjectPlan[key].map(({ target }) => target)])),
    handlerSessions:exactProjectPlan.sessionTasks.map(({ packId }) => packId),
    terminalTaskIdentitiesConserved:true, packageCheckCount:1},
  calibration:{current:vtd004CompletedProjectCalibration.runnablePacks.find(({ id }) => id === "project_management"),
    otherPackRowsConserved:true, browserTargetRowsConserved:true, provenanceConserved:true,
    otherPackCount:currentOtherPackRows.length,
    browserTargetCount:Object.keys(vtd004CompletedProjectCalibration.browserTargets).length},
};
const durablePack = packs.find(({id}) => id === "durable_project_repository");
const durableBasePacks = JSON.parse(await exec("git", ["show", "2d46bc7062:verification/packs.json"]));
const durableBaseCalibration = JSON.parse(await exec("git", [
  "show", "2d46bc7062:verification/performance-calibration.json",
]));
const durableCompletedCalibration = JSON.parse(await exec("git", [
  "show", "82e704bdc8:verification/performance-calibration.json",
]));
assert.deepEqual(durablePack.impactBoundaries.map(({id,sourceClass,propagateDependants}) =>
  [id,sourceClass,propagateDependants]), [
  ["durable_repository_persistence", "persistence migration", true],
  ["durable_production_semantic", "core or semantic", true],
  ["durable_repository_controller", "application controller", true],
  ["durable_repository_presentation", "browser presentation", false],
  ["durable_runtime_controller", "application controller", true],
  ["durable_page_history_semantic", "core or semantic", true],
  ["durable_saved_schema_feed_semantic", "core or semantic", true],
], "durable repository source classes and propagation are explicit registry data");
const durablePresentationPath = "src/data-layer-durable-project-repository-presentation-ui.ts";
const durableControllerPath = "src/data-layer-durable-project-repository-ui.ts";
const durablePresentationSource = await readFile(new URL(`../${durablePresentationPath}`, import.meta.url), "utf8");
const durableControllerSource = await readFile(new URL(`../${durableControllerPath}`, import.meta.url), "utf8");
assert.match(durableControllerSource, /data-layer-durable-project-repository-presentation-ui\.js/u,
  "the durable controller delegates display work through the extracted module");
assert.doesNotMatch(durablePresentationSource,
  /indexedDB|localStorage|sessionStorage|navigator\.storage|data-layer-durable-project-repository\.js|runtime-core|production-model|compact-canonical-history|saved-schema-feed/u,
  "the presentation boundary cannot read durable state or import semantic owners");
const durableClosure = ["durable_project_repository", "flow_graph", "flow_export", "live_flow_testing",
  "layered_schema", "property_set_flow_sections"];
const durableCurrentPaths = [durablePresentationPath, "src/data-layer-durable-project-repository.ts",
  "src/data-layer-production-model.ts", durableControllerPath, "src/data-layer-durable-project-runtime.ts",
  "src/data-layer-compact-canonical-history.ts", "src/utilities/data-layer/saved-schema-feed.ts"];
assert.deepEqual(planVerification(packs, {changedPaths:[durablePresentationPath]}).packIds,
  ["durable_project_repository"], "the display-only path selects only its complete owner pack");
for (const changedPath of durableCurrentPaths.slice(1)) assert.deepEqual(
  planVerification(packs, {changedPaths:[changedPath]}).packIds, durableClosure,
  `${changedPath} retains the six-pack dependant closure`);
const durableHandlerPath = durablePack.isolatedVerificationHandlers[0];
assert.equal(durableHandlerPath, "acceptance/src/acceptance/steps/durable_project_repository.clj");
const durableNamespace = "acceptance.steps.durable-project-repository";
const durableHandlerSource = await readFile(new URL(`../${durableHandlerPath}`, import.meta.url), "utf8");
const durableServedFeatures = [...durableHandlerSource.matchAll(
  /"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)].map((match) => match[1]);
assert.deepEqual([...durableServedFeatures].sort(), [...durablePack.features].sort());
const durableConsumers = [];
for (const handlerPath of registeredHandlerPaths) {
  const source = await readFile(new URL(`../${handlerPath}`, import.meta.url), "utf8");
  if (handlerPath !== durableHandlerPath && clojureRequiresNamespace(source, durableNamespace)) durableConsumers.push(handlerPath);
}
assert.deepEqual(durableConsumers, [], "the isolated durable handler has no cross-pack APS consumer");
const durableCrossPackHandler = packs.find(({id,handlers}) =>
  id !== "durable_project_repository" && handlers?.length).handlers[0];
await assert.rejects(() => validateIsolatedVerificationHandlers(packs, {readSource:async(handlerPath) => {
  const source = await readFile(new URL(`../${handlerPath}`, import.meta.url), "utf8");
  return handlerPath === durableCrossPackHandler
    ? `${source}\n[acceptance.steps.durable-project-repository :refer [handlers]]\n` : source;
}}), /Cross-pack handler consumer/u, "a cross-pack :refer consumer blocks durable handler isolation");
const deletedDurablePresentation = syntheticChangeSet([{status:"D",path:durablePresentationPath}]);
const renamedDurablePresentation = syntheticChangeSet([{status:"R",score:100,
  oldPath:durablePresentationPath,newPath:durableControllerPath}]);
assert.deepEqual(planVerification(packs, {changedPaths:deletedDurablePresentation.paths,
  changeSet:deletedDurablePresentation,basePacks:packs}).packIds, ["durable_project_repository"]);
assert.deepEqual(planVerification(packs, {changedPaths:renamedDurablePresentation.paths,
  changeSet:renamedDurablePresentation,basePacks:packs}).packIds, durableClosure);
assert.deepEqual(planVerification(packs, {changedPaths:deletedDurablePresentation.paths,
  changeSet:deletedDurablePresentation,basePacks:packs,historicalRegistryFallback:true}).packIds,
  planVerification(packs, {terminalFull:true}).packIds);
const durableEvidenceProfile = conservedEvidenceProfile(durablePack);
const durableBasePack = durableBasePacks.find(({id}) => id === "durable_project_repository");
assert.deepEqual(durableEvidenceProfile,
  conservedEvidenceProfile(durableBasePack),
  "all durable owner evidence identities remain conserved");
const exactDurablePlan = planVerification(packs, {packIds:["durable_project_repository"],includeProperties:true});
assert.deepEqual(exactDurablePlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort(),
  ["DURABLE_REPOSITORY_STORAGE_TARGET", "DURABLE_REPOSITORY_REVISION_TARGET",
    "DURABLE_RENDERER_CORPUS_TARGET", "DURABLE_RENDERER_HISTORY_TARGET"].sort());
const durableAssertionLeafCount = durablePack.browserEvidencePartitions.flatMap(({originalLeaves}) => originalLeaves).length;
assert.equal(durableAssertionLeafCount, 111);
assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities,
  "terminal planning conserves every exact durable task identity");
const durableCurrentCalibration = durableCompletedCalibration.runnablePacks.find(({id}) =>
  id === "durable_project_repository");
assert.deepEqual({selectedPacks:durableCurrentCalibration.selectedPacks,
  fanOut:durableCurrentCalibration.changedPathFanOut.limit,
  duration:[durableCurrentCalibration.changedPathDuration.baseline,
    durableCurrentCalibration.changedPathDuration.tolerance,durableCurrentCalibration.changedPathDuration.limit]},
{selectedPacks:["durable_project_repository"],fanOut:0,duration:[90.2,1.2,109]});
const durableOtherCurrent = durableCompletedCalibration.runnablePacks.filter(({id}) => id !== "durable_project_repository");
const durableOtherBase = durableBaseCalibration.runnablePacks.filter(({id}) => id !== "durable_project_repository");
assert.deepEqual(durableOtherCurrent,durableOtherBase);
assert.deepEqual(durableCompletedCalibration.browserTargets,durableBaseCalibration.browserTargets);
assert.deepEqual(calibrationProvenance(durableCompletedCalibration),calibrationProvenance(durableBaseCalibration));
const vtd004DurableAcceptance = {
  currentPlans:Object.fromEntries(durableCurrentPaths.map((changedPath) => [changedPath,
    planVerification(packs,{changedPaths:[changedPath],includeProperties:true}).packIds])),
  historyPlans:{delete:["durable_project_repository"],renameController:durableClosure,
    unreadable:planVerification(packs,{terminalFull:true}).packIds},
  handler:{path:durableHandlerPath,servedFeatures:durableServedFeatures,consumers:durableConsumers,
    negativeMutationRejected:true,ownerPlan:planVerification(packs,{changedPaths:[durableHandlerPath]}).packIds},
  conservation:{evidenceProfile:durableEvidenceProfile,
    exactTaskCounts:{unit:exactDurablePlan.unitTasks.length,property:exactDurablePlan.propertyTasks.length,
      features:exactDurablePlan.parserTasks.length,handlers:exactDurablePlan.sessionTasks.length,
      adapters:durablePack.browserAdapters.length,targets:exactDurablePlan.observationTasks
        .flatMap(({logicalTargetIds}) => logicalTargetIds).length,leaves:durableAssertionLeafCount},
    terminalTaskIdentitiesConserved:true,packageCheckCount:1},
  calibration:{current:durableCurrentCalibration,otherPackRowsConserved:true,
    browserTargetRowsConserved:true,provenanceConserved:true,otherPackCount:durableOtherCurrent.length,
    browserTargetCount:Object.keys(durableCompletedCalibration.browserTargets).length},
  presentationBoundary:true,
};
const eventLibraryPack = packs.find(({id}) => id === "event-library");
const eventLibraryBasePacks = JSON.parse(await exec("git", ["show", "c37e22d3f4:verification/packs.json"]));
const eventLibraryBaseCalibration = JSON.parse(await exec("git", [
  "show", "c37e22d3f4:verification/performance-calibration.json",
]));
assert.deepEqual(eventLibraryPack.impactBoundaries.map(({id,sourceClass,propagateDependants}) =>
  [id,sourceClass,propagateDependants]), [
  ["event_library_editor_model", "core or semantic", true],
  ["event_library_editor_shared_presentation", "browser presentation", true],
  ["event_library_deletion_persistence", "persistence migration", true],
  ["event_library_transfer_persistence", "persistence migration", true],
  ["event_library_renaming_semantic", "core or semantic", true],
  ["event_library_review_model", "core or semantic", true],
  ["event_library_review_presentation", "browser presentation", false],
  ["event_library_target_push_controller", "application controller", true],
  ["event_library_page_push_semantic", "core or semantic", true],
], "Event Library source classes and propagation are explicit registry data");
const eventReviewPresentationPaths = ["src/data-layer-push-draft-review-ui.ts",
  "src/data-layer-template-change-review-ui.ts"];
const eventEditorPaths = ["src/data-layer-event-library-editor.ts",
  "src/data-layer-event-library-editor-ui.ts"];
const eventSemanticPaths = ["src/data-layer-event-library-deletion.ts",
  "src/data-layer-event-library-transfer.ts", "src/data-layer-event-template-renaming.ts",
  "src/data-layer-push-draft-review.ts", "src/data-layer-template-change-review.ts",
  "src/data-layer-selected-target-push.ts", "src/data-layer-selected-target-push-page.ts"];
for (const presentationPath of eventReviewPresentationPaths) {
  const source = await readFile(new URL(`../${presentationPath}`, import.meta.url), "utf8");
  assert.doesNotMatch(source,
    /localStorage|sessionStorage|indexedDB|data-layer-event-library-editor|data-layer-event-library-transfer|data-layer-event-template-renaming|data-layer-selected-target-push|utilities\/data-layer\/capture/u,
    `${presentationPath} cannot access Library storage, controllers, page push, or Capture`);
  assert.match(source, /root: ParentNode/u, `${presentationPath} receives its DOM root from the caller`);
}
const sidePanelSource = await readFile(new URL("../src/side-panel.ts", import.meta.url), "utf8");
assert.match(sidePanelSource, /renderPushDraftReview\(pushDraftReview \?\? document, pendingPushDraftReview\)/u);
assert.match(sidePanelSource, /renderTemplateChangeReview\(revisionChangeReview \?\? document, pendingRevisionChangeReview\.review\)/u);
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
  const handlerSource = await readFile(new URL(`../${handlerPath}`, import.meta.url), "utf8");
  const servedFeatures = [...handlerSource.matchAll(/"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)]
    .map((match) => match[1]);
  const namespace = handlerPath.replace(/^acceptance\/src\//u, "").replace(/\.clj$/u, "")
    .replaceAll("/", ".").replaceAll("_", "-");
  const consumers = [];
  for (const consumerPath of registeredHandlerPaths) {
    if (consumerPath === handlerPath || consumerPath === "acceptance/src/acceptance/steps/all.clj" ||
        eventLibraryPack.handlers.includes(consumerPath)) continue;
    const consumerSource = await readFile(new URL(`../${consumerPath}`, import.meta.url), "utf8");
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
  const source = await readFile(new URL(`../${handlerPath}`, import.meta.url), "utf8");
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
  {packIds:["event-library"],includeProperties:true});
assert.deepEqual(terminalIdentities(exactEventPlan), terminalIdentities(acceptedEventPlan),
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
  new URL("../test/support/side-panel-event-library-fixtures.mjs", import.meta.url), "utf8");
assert.match(eventInstalledSource,/renderers:\{push:pushRendered,revision:revisionRendered,revisionEmpty\}/u,
  "the installed observation directly renders push and revision supplied values");
const vtd004EventAcceptance = {
  currentPlans:Object.fromEntries([...eventReviewPresentationPaths,...eventEditorPaths,...eventSemanticPaths]
    .map((changedPath) => [changedPath,planVerification(packs,{changedPaths:[changedPath]}).packIds])),
  historyPlans:eventHistoryPlans,
  handlers:eventHandlerEvidence,
  isolationAudit:{loadedStepDiagnostic,namespaceDiagnostic,
    rejectedHandlerPlan,metadataCannotConceal:true},
  conservation:{evidenceProfile:eventEvidenceProfile,exactTaskCount:exactEventPlan.tasks.length,
    unitCount:exactEventPlan.unitTasks.length,propertyCount:exactEventPlan.propertyTasks.length,
    featureCount:exactEventPlan.parserTasks.length,handlerCount:eventLibraryPack.handlers.length,
    adapterCount:exactEventPlan.browserTasks.length,targetCount:exactEventPlan.observationTasks.length,
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
  const source = await readFile(new URL(`../${handlerPath}`, import.meta.url),"utf8");
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
    const source = await readFile(new URL(`../${handlerPath}`,import.meta.url),"utf8");
    return handlerPath === replayHandler
      ? `${source}\n[acceptance.steps.event-feed-query :refer [handlers]]\n` : source;
  },
}));
assert.match(captureNamespaceDiagnostic,/Cross-pack handler consumer blocks isolation.*replay/u);
const missingMetadataDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => handlerPath === captureIsolatedHandlers[0] ? "(def handlers [])"
    : readFile(new URL(`../${handlerPath}`,import.meta.url),"utf8"),
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
assert.deepEqual(captureEvidenceProfile,
  conservedEvidenceProfile(captureBasePack),
  "all Capture owner evidence identities remain conserved");
const exactCapturePlan = planVerification(packs,{packIds:["capture"],includeProperties:true});
assert.equal(exactCapturePlan.tasks.length,171);
assert.deepEqual([exactCapturePlan.unitTasks.length,exactCapturePlan.propertyTasks.length,
  exactCapturePlan.parserTasks.length,capturePack.handlers.length,exactCapturePlan.browserTasks.length,
  exactCapturePlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).length,
  exactCapturePlan.checkpointTasks.length],[21,12,66,25,1,5,2]);
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
  new URL("../test/support/side-panel-capture-fixtures.mjs",import.meta.url),"utf8");
assert.match(captureInstalledSource,/inspectorPresentation:\{captured,restored\}/u,
  "the installed Capture observation directly captures and restores inspector presentation");
const vtd004CaptureAcceptance = {
  currentPlans:Object.fromEntries([...capturePresentationPaths,...capturePropagatingPaths]
    .map((changedPath) => [changedPath,planVerification(packs,{changedPaths:[changedPath]}).packIds])),
  historyPlans:captureHistoryPlans,
  handlers:captureHandlerEvidence,
  isolationAudit:{captureLoadedStepDiagnostic,captureNamespaceDiagnostic,missingMetadataDiagnostic,
    unreadableAuditDiagnostic,rejectedCaptureHandlerPlan,metadataCannotConceal:true},
  conservation:{evidenceProfile:captureEvidenceProfile,exactTaskCount:exactCapturePlan.tasks.length,
    unitCount:21,propertyCount:12,featureCount:66,handlerCount:25,adapterCount:1,targetCount:5,
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
];
assert.deepEqual(schemasPack.impactBoundaries.map(({id,sourceClass,propagateDependants}) =>
  [id,sourceClass,propagateDependants]), expectedSchemasBoundaries,
"Schemas source classes and propagation are explicit registry data");
for (const changedPath of schemasPresentationPaths) assert.deepEqual(
  planVerification(packs,{changedPaths:[changedPath]}).packIds,["schemas"],
  `${changedPath} selects only complete Schemas evidence`);
const schemasBoundaryPaths = schemasPack.impactBoundaries.flatMap(({prefixes}) => prefixes);
assert.equal(schemasBoundaryPaths.length,88,"every Schemas source path has one exact boundary");
assert.equal(new Set(schemasBoundaryPaths).size,88,"Schemas impact boundaries cannot overlap");
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
  const source = await readFile(new URL(`../${handlerPath}`, import.meta.url),"utf8");
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
  handler !== "acceptance/src/acceptance/steps/all.clj");
const schemasNamespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../${handlerPath}`,import.meta.url),"utf8");
    return handlerPath === shellHandler
      ? `${source}\n[acceptance.steps.allowed-value-expansion :refer [handlers]]\n` : source;
  },
}));
assert.match(schemasNamespaceDiagnostic,
  /Cross-pack handler consumer blocks isolation.*information_architecture/u);
const schemasMissingMetadataDiagnostic = await captureRejection(() =>
  validateIsolatedVerificationHandlers(packs,{
    readSource:async(handlerPath) => handlerPath === schemasIsolatedHandlers[0]
      ? "(def handlers [])" : readFile(new URL(`../${handlerPath}`,import.meta.url),"utf8"),
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
assert.equal(exactSchemasPlan.tasks.length,288);
assert.deepEqual([exactSchemasPlan.unitTasks.length,exactSchemasPlan.propertyTasks.length,
  exactSchemasPlan.parserTasks.length,schemasPack.handlers.length,exactSchemasPlan.browserTasks.length,
  exactSchemasPlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).length,
  exactSchemasPlan.checkpointTasks.length],[49,29,103,60,1,46,0]);
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
  new URL("../test/support/side-panel-browser-fixture-primitives.mjs",import.meta.url),"utf8");
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
  conservation:{evidenceProfile:schemasEvidenceProfile,exactTaskCount:exactSchemasPlan.tasks.length,
    unitCount:49,propertyCount:29,featureCount:103,handlerCount:60,adapterCount:1,targetCount:46,
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
const retainedSupportHelpers = (await readdir(new URL("../test/support/", import.meta.url)))
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
  await assert.rejects(access(new URL(`../test/support/${removedHelper}`, import.meta.url)),
    (error) => error?.code === "ENOENT", `${removedHelper} is removed without an executable leaf`);
}
const helperConsumerCases = Object.fromEntries(helperDeclarations.map(({ path:helperPath, consumers }) =>
  [helperPath, consumers]));
for (const [helperPath, consumers] of Object.entries(helperConsumerCases)) {
  assert.deepEqual(planVerification(packs, { changedPaths:[helperPath] }).packIds,
    packs.filter(({ id }) => consumers.includes(id)).map(({ id }) => id),
    `${helperPath} selects its declared consumers exactly once`);
}
const shellBoundaryCases = {
  "src/panel-empty-states.ts":["shell"],
  "src/panel-empty-states-ui.ts":["shell"],
  "src/workspace-tabs-ui.ts":["shell"],
  "src/workspace-tabs.ts":["command-palette", "hotkeys", "shell"],
  "src/active-page-observation.ts":["capture", "event-library", "project_event_transport", "schemas",
    "defects", "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"],
  "src/side-panel-action-hierarchy.ts":["event-library", "project_event_transport", "schemas",
    "defects", "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"],
  "src/side-panel-action-hierarchy-ui.ts":["event-library", "project_event_transport", "schemas",
    "defects", "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"],
};
for (const [changedPath, expectedPackIds] of Object.entries(shellBoundaryCases)) {
  assert.deepEqual(planVerification(packs, { changedPaths:[changedPath] }).packIds, expectedPackIds,
    `${changedPath} selects its exact Shell runtime consumers`);
}
const shellSourcePaths = helperValidationInventory.source
  .filter((sourcePath) => verificationOwner(packs, sourcePath) === "shell");
assert.equal(shellSourcePaths.length, 18,
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
assert.equal(localShellPlan.observationTasks.length, 1);
assert.equal(localShellPlan.parserTasks.length, localShellPlan.features.length);
assert.equal(localShellPlan.generatorTasks.length, localShellPlan.features.length);
assert.equal(localShellPlan.checkpointTasks.length, 3);
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
assert.deepEqual(vtd009History.deleteDormant, runnableProductionPackIds);
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
const flowHandlerChange = syntheticChangeSet([{
  status:"M", path:"acceptance/src/acceptance/steps/flow_graph.clj",
}]);
const preIsolationPacks = replacePack(packs, "flow_graph", () => ({
  isolatedVerificationHandlers:[],
}));
assert.deepEqual(planVerification(packs, {
  packIds:["flow_graph"], changedPaths:flowHandlerChange.paths,
  changeSet:flowHandlerChange, basePacks:preIsolationPacks,
}).packIds, ["flow_graph"],
"a newly declared isolated handler applies consistently to its unchanged historical ownership");
const flowTargetIds = [
  "FLOW_WORKSPACE_CONTROLS_TARGET",
  "FLOW_WORKSPACE_AUTHORING_TARGET",
  "FLOW_GRAPH_LEGACY_TARGET",
  "FLOW_GRAPH_EXAMPLES_TARGET",
  "FLOW_STYLESHEET_EXTRACTION_TARGET",
];
const flowRuntimeTargetIds = flowTargetIds
  .filter((id) => id !== "FLOW_STYLESHEET_EXTRACTION_TARGET");
assert.deepEqual(new Set(flowPack.browserObservations.map(({ id }) => id)), new Set(flowTargetIds),
  "the Flow adapter exposes five exact logical targets including stylesheet evidence");
assert.ok(flowPack.browserObservations.every(({ path:program, sessionBatch }) =>
  program === "test/browser-packs/flow-graph.mjs" && sessionBatch === "flow-graph"),
"every Flow target shares the installed Flow program and compatible session batch");
assert.deepEqual(flowPack.browserAdapters, ["test/browser-packs/flow-graph.mjs"],
  "no unpartitioned legacy or example adapter remains scheduled");
const exactFlowPlan = planVerification(packs, { packIds:["flow_graph"] });
assert.equal(exactFlowPlan.observationTasks.length, 1,
  "exact Flow verification uses one compatible installed-browser process");
assert.deepEqual(new Set(exactFlowPlan.observationTasks[0].logicalTargetIds), new Set(flowTargetIds),
  "the exact Flow process retains all five independent logical identities");
const authoringFlowPlan = planVerification(packs, {
  changedPaths:["src/flow-graph/workspace-section-ui.ts"],
});
assert.deepEqual(authoringFlowPlan.packIds, ["flow_graph"],
  "Section authoring changes do not propagate to declared Flow dependants");
assert.deepEqual(authoringFlowPlan.observationTasks.map(({ logicalTargetIds }) => logicalTargetIds),
  [["FLOW_WORKSPACE_AUTHORING_TARGET"]],
  "the representative Section path selects only its exact authoring target");
const controlsFlowPlan = planVerification(packs, {
  changedPaths:["src/flow-graph/workspace-camera-ui.ts"],
});
assert.deepEqual(controlsFlowPlan.packIds, ["flow_graph"]);
assert.deepEqual(controlsFlowPlan.observationTasks.map(({ logicalTargetIds }) => logicalTargetIds),
  [["FLOW_WORKSPACE_CONTROLS_TARGET"]]);
const compositionFlowPlan = planVerification(packs, {
  changedPaths:["src/flow-graph/workspace-ui.ts"],
});
assert.deepEqual(compositionFlowPlan.packIds, ["flow_graph"]);
assert.deepEqual(new Set(compositionFlowPlan.observationTasks[0].logicalTargetIds),
  new Set(["FLOW_STYLESHEET_EXTRACTION_TARGET", "FLOW_WORKSPACE_AUTHORING_TARGET",
    "FLOW_WORKSPACE_CONTROLS_TARGET"]));
const semanticFlowPlan = planVerification(packs, {
  changedPaths:["src/flow-graph/relationships.ts"],
});
assert.ok(semanticFlowPlan.packIds.length > 1 && semanticFlowPlan.packIds.includes("flow_graph"),
  "semantic Flow changes retain declared dependant propagation");
assert.deepEqual(new Set(semanticFlowPlan.observationTasks
  .find(({ packId }) => packId === "flow_graph").logicalTargetIds), new Set(flowRuntimeTargetIds));
const unclassifiedFlowPlan = planVerification(packs, {
  changedPaths:["src/flow-graph/new-semantic-model.ts"],
});
assert.ok(unclassifiedFlowPlan.packIds.length > 1 && unclassifiedFlowPlan.packIds.includes("flow_graph"),
  "a new unclassified Flow source fails closed to the dependant closure");
assert.deepEqual(new Set(unclassifiedFlowPlan.observationTasks
  .find(({ packId }) => packId === "flow_graph").logicalTargetIds), new Set(flowTargetIds));
const sharedHarnessConsumers = packs.find(({ id }) => id === "shell").verificationHelpers
  .find(({ path:helperPath }) => helperPath === "test/browser-packs/shared-harness.mjs").consumers;
assert.deepEqual(planVerification(packs, {
  changedPaths:["test/browser-packs/shared-harness.mjs"],
}).packIds, packs.filter(({ id }) => sharedHarnessConsumers.includes(id)).map(({ id }) => id),
"the shared browser harness selects every exact browser consumer without semantic dependant expansion");
const browserPackIds = packs.filter((pack) =>
  (pack.browserAdapters?.length ?? 0) + (pack.browserObservations?.length ?? 0) > 0)
  .map(({ id }) => id);
assert.deepEqual(planVerification(packs, {
  changedPaths:["test/support/headless-chrome.mjs"],
}).packIds, browserPackIds,
"the shared headless Chrome harness selects every browser pack without semantic dependant expansion");
const registeredBrowserPrograms = new Set(packs.flatMap((pack) => [
  ...(pack.browserAdapters ?? []),
  ...(pack.browserObservations ?? []).map(({ path:programPath }) => programPath),
]));
for (const programPath of registeredBrowserPrograms) {
  const source = await readFile(new URL(`../${programPath}`, import.meta.url), "utf8");
  assert.doesNotMatch(source,
    /\b(?:rm|rmSync)\([^\n]*(?:profile|userData|user-data|chromeProfile)/u,
    `${programPath} must route profile cleanup through the bounded shared helper`);
}
const realRegistryBoundary = planVerification(packs, {
  packIds:runnableProductionPackIds, changedPaths:realRegistryChange.paths,
  changeSet:realRegistryChange, basePacks:packs,
});
assert.deepEqual(realRegistryBoundary.packIds, runnableProductionPackIds,
  "every runnable production pack is a complete explicit force-all boundary");
assert.equal(realRegistryBoundary.changedOwners["verification/packs.json"]
  .includes("selective_profile_inheritance"), false,
  "a nonrunnable production dependant is traversable but never required as an evidence selector");
const componentLayoutBrowserSource = await readFile(
  new URL("./support/side-panel-browser-fixture-primitives.mjs", import.meta.url),
  "utf8",
);
const installedTargetSessionSource = await readFile(
  new URL("./support/browser-target-session.mjs", import.meta.url), "utf8",
);
assert.match(installedTargetSessionSource,
  /withLogicalTargetLifecycle\(\{[\s\S]*?boundary:"installed-session logical target"[\s\S]*?work:async\(\{remainingMilliseconds\}\)[\s\S]*?cleanup:async[\s\S]*?finalize:/u,
  "installed-target page cleanup remains inside its finite logical-target boundary");
const shellBrowserBatch = packs.find(({ id }) => id === "shell");
const shellContainmentTargets = shellBrowserBatch.browserObservations
  .filter(({ id }) => ["SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER",
    "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER"].includes(id));
assert.equal(new Set(shellContainmentTargets.map(({ sessionBatch }) => sessionBatch)).size, 1,
  "compatible shell containment targets declare one reusable session batch");
assert.ok(shellContainmentTargets.every(({ sessionBatch }) => sessionBatch),
  "the real registry does not leave compatible containment targets unbatched");
assert.deepEqual(shellBrowserBatch.browserAdapterPerformance, [{
  path:"test/browser-packs/side-panel-shell.mjs",
  singleTargetP90Milliseconds:18000,
  maximumSingleTargetP90Milliseconds:10000,
  targetIds:["SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER",
    "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER"],
  sessionBatch:"shell-containment",
}], "the slow shared program declares independently selectable batched targets");
assert.match(componentLayoutBrowserSource, /SWARMFORGE_BROWSER_TARGET_IDS/u,
  "the shared browser program consumes logical target identities");
assert.match(componentLayoutBrowserSource, /SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS/u,
  "the shared browser program consumes per-target environment configurations");
assert.match(componentLayoutBrowserSource, /Storage\.clearDataForOrigin/u,
  "each batched logical target clears browser storage before executing");
assert.match(componentLayoutBrowserSource, /swarmforgeBrowserTargetTiming/u,
  "the shared program emits timing evidence for each logical target");
assert.match(componentLayoutBrowserSource,
  /globalThis\.__swarmforgeRetainedEvaluation = \(\$\{expression\}\)/u,
  "DevTools evaluations retain awaited promises until their results are collected");
assert.match(componentLayoutBrowserSource,
  /activeBrowserTargetEnvironment\.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1" \? \[720\]/u,
  "the focused Schema view containment observation owns one explicit viewport");
assert.match(componentLayoutBrowserSource,
  /activeBrowserTargetEnvironment\.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1" \? \[720\]/u,
  "the focused Schema workspace observation owns its extended-workspace viewport");
const schemaViewStop = componentLayoutBrowserSource.indexOf(
  'if (activeBrowserTargetEnvironment.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1") {\n      socket.close(); continue;\n    }',
);
const schemaWorkspaceStop = componentLayoutBrowserSource.indexOf(
  'if (activeBrowserTargetEnvironment.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1") {',
);
const payloadPathPicker = componentLayoutBrowserSource.indexOf(
  "payloadPathFilterPickerObservation =",
);
assert.ok(schemaViewStop >= 0 && schemaViewStop < schemaWorkspaceStop && schemaViewStop < payloadPathPicker,
  "the focused Schema view containment observation stops before workspace and payload browser contracts");
assert.match(componentLayoutBrowserSource,
  /if \(activeBrowserTargetEnvironment\.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1"\) \{[\s\S]*?schemaWorkspaceAdapterObservations\.push\(schemaWorkspaceObservation\);[\s\S]*?console\.log\(JSON\.stringify\(\{ schemaWorkspace:schemaWorkspaceObservation \}\)\);\s*await evaluate\(socket, guidedTransportProjectRestoreRuntime\(previousActiveProjectId\)\);\s*socket\.close\(\);\s*continue;\s*\}\s*if \(activeBrowserTargetEnvironment\.PAYLOAD_PATH_FILTER_BROWSER_ADAPTER === "1" \|\| !requestedBrowserAdapter\) \{\s*payloadPathFilterPickerObservation =/u,
  "the focused Schema workspace observation stops before unrelated browser contracts");
assert.match(componentLayoutBrowserSource,
  /await reloadPanel\(socket\);\s*if \(activeBrowserTargetEnvironment\.GUIDED_VALIDATION_BROWSER_ADAPTER === "1"\) \{\s*socket\.close\(\); continue;\s*\}\s*\}\s*if \(activeBrowserTargetEnvironment\.LIVE_VALIDATION_VISUALS_BROWSER_ADAPTER === "1" \|\|\s*!requestedBrowserAdapter\) \{\s*liveValidationVisualsObservation =/su,
  "the focused guided-validation observation stops before unrelated visual and layout contracts");
assert.match(componentLayoutBrowserSource,
  /parentDisplay:style\.display/u,
  "the generic form-control observation records whether a parent intentionally uses grid layout");
assert.match(componentLayoutBrowserSource,
  /right > parentRight \+ 1 \|\| \(!\["grid", "inline-grid"\]\.includes\(parentDisplay\) && controlWidth \+ 1 < available\)/u,
  "the generic form-control contract always rejects overflow while allowing intentional grid columns");
const observationIds = new Set(packs.flatMap((pack) => (pack.browserObservations ?? [])
  .map(({ id }) => id)));
const sharedDefectObservation = packs.flatMap((pack) => pack.browserObservations ?? [])
  .find(({ id }) => id === "MISSING_EVENT_DEFECT_FIDELITY_BROWSER_OBSERVATION");
assert.deepEqual(parseBrowserObservationOutput([
  "diagnostic output",
  JSON.stringify({ missingEventDefectReport:{ report:true } }),
  JSON.stringify({ unifiedDefectBuilder:{ builder:true } }),
  JSON.stringify({ missingEventReportFidelity:{ fidelity:true } }),
].join("\n"), sharedDefectObservation), {
  missingEventDefectReport:{ report:true },
  unifiedDefectBuilder:{ builder:true },
  missingEventReportFidelity:{ fidelity:true },
});
assert.throws(() => parseBrowserObservationOutput(
  `${JSON.stringify({ missingEventDefectReport:{} })}\nnot json`, sharedDefectObservation,
), /omitted required key/u);
const partialBatch = parseBrowserObservationBatchOutput(
  JSON.stringify({ first:{ passed:true } }),
  [
    { id:"FIRST", observationKeys:["first"] },
    { id:"SECOND", observationKeys:["second"] },
  ],
);
assert.deepEqual(partialBatch.document, { first:{ passed:true } });
assert.deepEqual(partialBatch.failures.map(({ id }) => id), ["SECOND"],
  "a failed observation identifies its own logical target without discarding independent results");
const arrayObservation = packs.flatMap((pack) => pack.browserObservations ?? [])
  .find(({ id }) => id === "ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER");
const scrubbedEnvironment = exactObservationEnvironment(packs, arrayObservation, {
  PATH:"/bin",
  ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER:"stale",
  JSON_SCHEMA_EXPORT_BROWSER_ADAPTER:"1",
  SCHEMA_LIBRARY_EXPORT_FIXTURE:"stale",
});
assert.deepEqual(scrubbedEnvironment, {
  PATH:"/bin", ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER:"1",
});

const stepDirectory = new URL("../acceptance/src/acceptance/steps/", import.meta.url);
const sourceModulePaths = await nestedModulePaths("src", ".ts");
const sourceModuleSet = new Set(sourceModulePaths);
const crossPackStepRequires = [];
const crossPackLiteralSourceReads = [];
for (const name of await readdir(stepDirectory)) {
  if (!name.endsWith(".clj")) continue;
  const source = await readFile(new URL(name, stepDirectory), "utf8");
  const requiringPath = `acceptance/src/acceptance/steps/${name}`;
  const requiringOwner = verificationOwner(packs, requiringPath);
  for (const [, requiredNamespace] of source.matchAll(/\[acceptance\.steps\.([a-z0-9_-]+)/gu)) {
    const requiredPath = `acceptance/src/acceptance/steps/${requiredNamespace.replaceAll("-", "_")}.clj`;
    const requiredOwner = verificationOwner(packs, requiredPath);
    assert.ok(requiredOwner, `${requiringPath} requires an owned namespace at ${requiredPath}`);
    if (name !== "all.clj" && requiredOwner !== requiringOwner) {
      crossPackStepRequires.push({ requiringOwner, requiringPath, requiredOwner, requiredPath });
    }
  }
  if (source.includes("support/source-file")) {
    for (const [, requiredPath] of source.matchAll(/"(src\/[A-Za-z0-9_./-]+\.ts)"/gu)) {
      if (!sourceModuleSet.has(requiredPath)) continue;
      const requiredOwner = verificationOwner(packs, requiredPath);
      assert.ok(requiredOwner, `${requiringPath} reads an owned source file at ${requiredPath}`);
      if (requiredOwner !== requiringOwner) {
        crossPackLiteralSourceReads.push({
          requiringOwner, requiringPath, requiredOwner, requiredPath,
        });
      }
    }
  }
  if (name === "support.clj") continue;
  assert.doesNotMatch(source, /\(support\/source-files\s+[^\s()]+\s*\)/u,
    `${name} must qualify source scans with explicit owned or shared boundaries`);
  assert.doesNotMatch(source, /process\/shell|clojure\.java\.shell\/sh/u,
    `${name} must consume structured receipt tasks instead of launching a shell`);
  for (const match of source.matchAll(/:adapter-env\s+"([A-Z][A-Z0-9_]*_BROWSER_ADAPTER)"/gu)) {
    const mapEnd = source.indexOf("}", match.index);
    const optionMap = source.slice(match.index, mapEnd < 0 ? match.index + 500 : mapEnd);
    const explicitId = /:observation-id\s+"([A-Za-z0-9_:.-]+)"/u.exec(optionMap)?.[1];
    assert.ok(observationIds.has(explicitId ?? match[1]),
      `${name} requests registered browser observation ${explicitId ?? match[1]}`);
  }
  for (const [, explicitId] of source.matchAll(/:observation-id\s+"([A-Za-z0-9_:.-]+)"/gu)) {
    assert.ok(observationIds.has(explicitId), `${name} requests registered observation id ${explicitId}`);
  }
}
for (const [requiringPath, requiredPath] of [
  ["acceptance/src/acceptance/steps/event_library_editor.clj",
    "acceptance/src/acceptance/steps/event_library_editor_support.clj"],
]) assert.ok(crossPackStepRequires.some((edge) =>
  edge.requiringPath === requiringPath && edge.requiredPath === requiredPath),
  `${requiringPath} exposes its cross-pack requirement on ${requiredPath}`);
assert.equal(crossPackStepRequires.some(({ requiredPath }) =>
  requiredPath === "acceptance/src/acceptance/steps/project_management.clj"), false,
"the isolated project-management handler has no cross-pack Clojure consumer");
const requiredPathImpacts = new Map();
// Acceptance source inspection proves a contract but is not a production runtime import.
// Cross-pack source reads that must affect another pack are declared as verificationInputs.
for (const edge of crossPackStepRequires) {
  if (!requiredPathImpacts.has(edge.requiredPath)) {
    requiredPathImpacts.set(edge.requiredPath,
      planVerification(packs, { changedPaths:[edge.requiredPath] }).packIds);
  }
  assert.ok(requiredPathImpacts.get(edge.requiredPath).includes(edge.requiringOwner),
    `${edge.requiringPath} requires ${edge.requiredPath}, so ${edge.requiredOwner} changes must select ` +
    `${edge.requiringOwner} through dependency, shared-component, or global-impact reachability`);
}
for (const requiredPath of [
  "src/commands.ts",
  "src/hotkey-editor.ts",
  "src/data-layer-event-library-editor.ts",
  "src/data-layer-event-library-editor-ui.ts",
]) assert.ok(planVerification(packs, { changedPaths:[requiredPath] }).packIds.includes("capture"),
  `${requiredPath} selects its literal capture-handler consumer`);

async function nestedModulePaths(directory, extension) {
  const entries = await readdir(directory, { withFileTypes:true });
  const paths = [];
  for (const entry of entries) {
    const candidate = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await nestedModulePaths(candidate, extension));
    else if (candidate.endsWith(extension)) paths.push(candidate);
  }
  return paths.sort();
}

function parsedModule(source, filePath) {
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true,
    filePath.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS);
}

function staticModuleSpecifiers(module) {
  return module.statements.flatMap((statement) => {
    if (ts.isImportDeclaration(statement) && statement.moduleSpecifier &&
        ts.isStringLiteralLike(statement.moduleSpecifier)) {
      const clause = statement.importClause;
      const named = clause?.namedBindings;
      const whollyTypeOnly = clause?.isTypeOnly || Boolean(clause && !clause.name &&
        named && ts.isNamedImports(named) && named.elements.length &&
        named.elements.every((element) => element.isTypeOnly));
      return whollyTypeOnly ? [] : [statement.moduleSpecifier.text];
    }
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier &&
        ts.isStringLiteralLike(statement.moduleSpecifier)) {
      const named = statement.exportClause;
      const whollyTypeOnly = statement.isTypeOnly || Boolean(named && ts.isNamedExports(named) &&
        named.elements.length && named.elements.every((element) => element.isTypeOnly));
      return whollyTypeOnly ? [] : [statement.moduleSpecifier.text];
    }
    return [];
  });
}

function literalFileSpecifiers(module) {
  const specifiers = [];
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const calledName = ts.isIdentifier(node.expression) ? node.expression.text
        : ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text
          : null;
      if (["readFile", "readFileSync"].includes(calledName)) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) {
          specifiers.push({ specifier:argument.text, repositoryRelative:true });
        }
        else if (argument && ts.isNewExpression(argument) &&
            ts.isIdentifier(argument.expression) && argument.expression.text === "URL" &&
            argument.arguments?.[0] && ts.isStringLiteralLike(argument.arguments[0])) {
          specifiers.push({ specifier:argument.arguments[0].text, repositoryRelative:false });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(module);
  return specifiers;
}

function resolveModuleSpecifier(importerPath, specifier, eligiblePaths, { repositoryRelative = false } = {}) {
  const base = !repositoryRelative && (specifier.startsWith("./") || specifier.startsWith("../"))
    ? path.posix.normalize(path.posix.join(path.posix.dirname(importerPath), specifier))
    : repositoryRelative || specifier.startsWith("src/") || specifier.startsWith("test/")
      ? path.posix.normalize(specifier)
      : null;
  if (!base) return null;
  const extension = path.posix.extname(base);
  const candidates = extension === ".js"
    ? [`${base.slice(0, -3)}.ts`, base]
    : extension ? [base]
      : [base, `${base}.ts`, `${base}.mjs`, `${base}/index.ts`, `${base}/index.mjs`];
  return candidates.find((candidate) => eligiblePaths.has(candidate)) ?? null;
}

// Verification reachability follows executable verification consumers, not every production
// import. The mandatory common build owns type/architecture coverage for src-to-src imports;
// dependencies and sharedComponents remain the explicit behavioral fan-out declarations.
const registeredVerificationConsumerPaths = [...new Set(packs.flatMap((pack) => [
  ...["unit", "property", "browserAdapters"].flatMap((key) => pack[key] ?? []),
  ...(pack.browserObservations ?? []).map(({ path:observationPath }) => observationPath),
  ...(pack.checkpointCommands ?? []).flatMap(({ executable, args }) =>
    executable === "node" && args?.[0]?.endsWith(".mjs") ? [args[0]] : []),
]))].filter((modulePath) => modulePath.endsWith(".mjs"));
const testHelperSet = new Set((await nestedModulePaths("test", ".mjs")).filter((modulePath) =>
  modulePath.startsWith("test/fixtures/") || modulePath.startsWith("test/helpers/") ||
  modulePath.startsWith("test/support/") || modulePath === "test/browser-packs/shared-harness.mjs"));
const testImportTargetSet = new Set([...sourceModulePaths, ...testHelperSet]);
const trackedLiteralTargetSet = new Set((await verificationInventory()).tracked.filter((trackedPath) =>
  trackedPath !== "dist" && !trackedPath.startsWith("dist/") &&
  trackedPath !== "verification/packs.json"));
const codeEdges = [];
const moduleReferenceCache = new Map();
async function verificationModuleReferences(importerPath) {
  if (moduleReferenceCache.has(importerPath)) return moduleReferenceCache.get(importerPath);
  const source = await readFile(importerPath, "utf8");
  const module = parsedModule(source, importerPath);
  const references = [
    ...staticModuleSpecifiers(module).map((specifier) => ({
      kind:"imports", specifier, repositoryRelative:false,
    })),
    ...literalFileSpecifiers(module).map((reference) => ({ kind:"reads", ...reference })),
  ].flatMap(({ kind, specifier, repositoryRelative }) => {
    if (kind === "imports" && !specifier.startsWith(".") &&
        !specifier.startsWith("src/") && !specifier.startsWith("test/")) {
      return [];
    }
    const eligiblePaths = kind === "reads" ? trackedLiteralTargetSet : testImportTargetSet;
    const requiredPath = resolveModuleSpecifier(importerPath, specifier, eligiblePaths,
      { repositoryRelative });
    if (kind === "reads") return requiredPath ? [{ kind, requiredPath }] : [];
    const referencedPath = specifier.startsWith("./") || specifier.startsWith("../")
      ? path.posix.normalize(path.posix.join(path.posix.dirname(importerPath), specifier))
      : path.posix.normalize(specifier);
    const relevantTestTarget = referencedPath.startsWith("src/") ||
      Boolean(requiredPath && testHelperSet.has(requiredPath));
    if (!relevantTestTarget) return [];
    assert.ok(requiredPath, `${importerPath} ${kind} a resolvable registered module at ${specifier}`);
    return [{ kind, requiredPath }];
  });
  moduleReferenceCache.set(importerPath, references);
  return references;
}
const reachableTestHelperPaths = new Set();
for (const verificationConsumerPath of registeredVerificationConsumerPaths) {
  const requiringOwner = verificationOwner(packs, verificationConsumerPath);
  assert.ok(requiringOwner, `${verificationConsumerPath} is an owned verification consumer`);
  const pendingPaths = [verificationConsumerPath];
  const visitedPaths = new Set();
  while (pendingPaths.length > 0) {
    const importerPath = pendingPaths.shift();
    if (visitedPaths.has(importerPath)) continue;
    visitedPaths.add(importerPath);
    for (const { kind, requiredPath } of await verificationModuleReferences(importerPath)) {
      const requiredOwner = verificationOwner(packs, requiredPath);
      assert.ok(requiredOwner, `${importerPath} ${kind} an owned module at ${requiredPath}`);
      codeEdges.push({
        requiringOwner, requiringPath:importerPath, requiredOwner, requiredPath, kind,
        verificationConsumerPath,
      });
      if (testHelperSet.has(requiredPath)) {
        reachableTestHelperPaths.add(requiredPath);
        pendingPaths.push(requiredPath);
      }
    }
  }
}
assert.ok(codeEdges.some(({ requiringPath, requiredPath }) =>
  requiringPath === "test/browser-packs/shared-harness.mjs" &&
  requiredPath === "test/support/headless-chrome.mjs"),
"reachable verification helpers are followed transitively through helper-to-helper imports");
const crossPackCodeEdges = codeEdges.filter(({ requiringOwner, requiredOwner }) =>
  requiringOwner !== requiredOwner);
assert.ok(crossPackCodeEdges.length > 0,
  "the verification-consumer contract exercises real cross-pack static or literal-read edges");
const codeReachabilityGaps = [];
const approvedFlowStyleAuditPaths = new Set([
  "src/flow-graph/flow-workspace.css",
  "src/flow-graph/flow-workspace-shell.css",
]);
const observedFlowStyleAuditPaths = new Set();
for (const edge of crossPackCodeEdges) {
  if (!requiredPathImpacts.has(edge.requiredPath)) {
    requiredPathImpacts.set(edge.requiredPath,
      planVerification(packs, { changedPaths:[edge.requiredPath] }).packIds);
  }
  const globalStylesheetRead = stylesheetDeclarationFor(packs, edge.requiredPath)?.classification === "global";
  const flowStyleAuditRead = edge.requiringPath === "test/verification-process-contract-test.mjs" &&
    approvedFlowStyleAuditPaths.has(edge.requiredPath);
  if (flowStyleAuditRead) observedFlowStyleAuditPaths.add(edge.requiredPath);
  if (!globalStylesheetRead && !flowStyleAuditRead &&
      !requiredPathImpacts.get(edge.requiredPath).includes(edge.requiringOwner)) {
    codeReachabilityGaps.push(edge);
  }
}
assert.deepEqual(observedFlowStyleAuditPaths, approvedFlowStyleAuditPaths,
"the Flow stylesheet process audit accounts for its exact verification-only inputs");
const codeReachabilityGapSummary = {};
for (const edge of codeReachabilityGaps) {
  const pair = `${edge.requiringOwner} -> ${edge.requiredOwner}`;
  const examples = codeReachabilityGapSummary[pair] ?? [];
  const example = `${edge.requiringPath} -> ${edge.requiredPath}`;
  if (examples.length < 2 && !examples.includes(example)) examples.push(example);
  codeReachabilityGapSummary[pair] = examples;
}
assert.deepEqual(codeReachabilityGapSummary, {},
  "every direct verification-consumer import and literal file read has dependency, " +
  "shared-component, or global-impact reachability");
assert.ok(codeEdges.some(({ verificationConsumerPath, requiredPath, kind }) =>
  verificationConsumerPath === "test/specification-studio-technical-analyst-guidance-test.mjs" &&
  requiredPath === "docs/specification-studio-technical-analyst-copy-R01.md" && kind === "reads"),
"tracked non-source literal reads participate in verification reachability");
assert.deepEqual(packs.find(({ id }) => id === "capture").verificationInputs, [
  "src/commands.ts",
  "src/hotkey-editor.ts",
  "src/data-layer-event-library-editor.ts",
  "src/data-layer-event-library-editor-ui.ts",
]);
assert.deepEqual(packs.find(({ id }) => id === "capture").sharedComponents ?? [], [],
  "exact capture observations do not masquerade as broad component coupling");
assert.equal(planVerification(packs, { changedPaths:["src/commands.ts"] })
  .packIds.includes("project_event_transport"), false,
"the exact capture observer does not propagate through capture's production dependants");
assert.ok(packs.find(({ id }) => id === "shell").dependencies.includes("project_management"),
  "installed shell integration retains its semantic project-management dependency");
const compileOnlyImporter = "src/data-layer-specification-engine.ts";
const compileOnlyProvider = "src/data-layer-assignment-routing.ts";
assert.ok(staticModuleSpecifiers(parsedModule(
  await readFile(compileOnlyImporter, "utf8"), compileOnlyImporter,
)).includes("./data-layer-assignment-routing.js"),
  "the contract probe remains a real production import");
assert.equal(registeredVerificationConsumerPaths.includes(compileOnlyImporter), false,
  "production modules are not direct verification consumers");
assert.equal(codeEdges.some(({ requiringPath, requiredPath }) =>
  requiringPath === compileOnlyImporter && requiredPath === compileOnlyProvider), false,
  "a production compile edge is not mistaken for behavioral verification fan-out");
assert.equal(planVerification(packs, { changedPaths:[compileOnlyProvider] }).packIds.includes("schemas"), false,
  "only an explicit semantic dependency may turn a production import into pack fan-out");
const layeredCssImpact = planVerification(packs, { changedPaths:["layered-schema.css"] }).packIds;
assert.ok(layeredCssImpact.includes("shell") && layeredCssImpact.includes("layered_schema"),
  "delivery CSS selects its owner and declared runtime consumer");
assert.equal(layeredCssImpact.includes("command-palette"), false,
  "delivery CSS excludes packs without a declared runtime consumer path");
const studioStylePlan = stylesheetPlanFor(packs, "specification-builder-brand.css");
assert.deepEqual(studioStylePlan.styleSmokeTargets, ["STUDIO_GLOBAL_STYLE_SMOKE_TARGET"],
  "global stylesheet planning exposes only its declared studio smoke target");
assert.deepEqual(studioStylePlan.declaration.consumers, [],
  "global stylesheet QA does not convert readers into owner/consumer packs");
const studioStyleImpact = planVerification(packs, {
  changedPaths:["specification-builder-brand.css"],
});
assert.deepEqual(studioStyleImpact.observationTasks.map(({ key }) => key), [
  "browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
], "global feature CSS schedules only its exact declared smoke target");
assert.deepEqual(studioStyleImpact.selectedPackIds, [],
  "global feature CSS does not claim the shell pack as a selected consumer");
assert.deepEqual(studioStyleImpact.adapterAuthorizationPackIds, ["shell"],
  "global smoke scheduling carries separate adapter authorization metadata");
assert.equal(studioStyleImpact.unitTasks.length, 0,
  "global feature CSS does not select unrelated owner unit tasks");
const styleFixtureDeclaration = (source, classification, owner, consumers = []) => ({
  source, destination:source, classification, owner, consumers, qaTargets:[],
  scopeRoot:classification === "global" ? null : ".documentary-flow",
});
const styleFixtureRegistry = (source, declaration) => packs.map((pack) => pack.id === declaration.owner
  ? { ...pack, source:[...(pack.source ?? []), source],
    stylesheets:[...(pack.stylesheets ?? []), declaration] } : pack);
const styleBoundaryEvidence = {};
for (const [label, source, declaration, expectedScope] of [
  ["valid feature-local presentation", "flow-workspace.css",
    styleFixtureDeclaration("flow-workspace.css", "feature-local", "flow_graph"), "flow_graph"],
  ["valid feature-to-shell bridge", "flow-workspace-shell.css",
    styleFixtureDeclaration("flow-workspace-shell.css", "shell-bridge", "flow_graph", ["shell"]),
    "flow_graph and shell"],
]) {
  const registry = styleFixtureRegistry(source, declaration);
  const stylePlan = stylesheetPlanFor(registry, source);
  const reviewPlan = planVerification(registry, { changedPaths:[source] });
  styleBoundaryEvidence[label] = {
    plannerInvoked:Boolean(stylePlan), reviewEvidencePath:Boolean(reviewPlan),
    selected:stylePlan.selected.join(" and "), selectedPackIds:reviewPlan.selectedPackIds,
    terminalFullObligation:stylePlan.terminalFullObligation,
    terminalFullObligations:reviewPlan.terminalFullObligations,
    taskCount:reviewPlan.tasks.length, expectedScope,
  };
}
styleBoundaryEvidence["shared global presentation foundation"] = {
  plannerInvoked:Boolean(studioStylePlan), reviewEvidencePath:Boolean(studioStyleImpact),
  selected:studioStylePlan.selected.join(" and ") || "declared QA targets",
  selectedPackIds:studioStyleImpact.selectedPackIds,
  styleSmokeTargets:studioStylePlan.styleSmokeTargets,
  terminalFullObligation:studioStylePlan.terminalFullObligation,
  terminalFullObligations:studioStyleImpact.terminalFullObligations,
  taskCount:studioStyleImpact.tasks.length, expectedScope:"declared QA targets",
};
const invalidStyleDeclaration = {
  ...styleFixtureDeclaration("invalid-boundary.css", "global", "shell"), qaTargets:[],
};
let invalidStyleBlocked = false;
try {
  validateStylesheetDeclarations([invalidStyleDeclaration], {
    packIds:["shell"], sourcePaths:["invalid-boundary.css"],
  });
} catch { invalidStyleBlocked = true; }
styleBoundaryEvidence["invalid or undeclared boundary"] = {
  plannerInvoked:false, reviewEvidencePath:false, selected:"no task launch",
  selectedPackIds:[], styleSmokeTargets:[], terminalFullObligation:false,
  terminalFullObligations:[], taskCount:0, expectedScope:"no task launch",
  validationBlocked:invalidStyleBlocked,
};
vtd014Evidence.styles = styleBoundaryEvidence;
const flowLocalStylesheet = await readFile("src/flow-graph/flow-workspace.css", "utf8");
const flowShellStylesheet = await readFile("src/flow-graph/flow-workspace-shell.css", "utf8");
const studioBaseStylesheet = await readFile("specification-builder.css", "utf8");
const studioBrandStylesheet = await readFile("specification-builder-brand.css", "utf8");
const studioDocument = await readFile("specification-builder.html", "utf8");
const flowExtractionBase = "66b91e38e6";
const approvedFlowSnapStyleAdditions = [
  { context:"", selector:".documentary-flow circle[data-flow-port-for].is-valid-target",
    declarations:"fill:#d9f7df;stroke:#137333;stroke-width:5" },
  { context:"", selector:'.documentary-flow .flow-canvas-scroll.is-connecting .flow-graph-canvas[data-semantic-detail="identity"] .flow-node',
    declarations:"display:inline" },
];
const flowSnapPreviewAfter = { context:"", selector:".documentary-flow .flow-connection-preview",
  declarations:"stroke:#f07c00;stroke-width:3;stroke-dasharray:6 4;pointer-events:none" };
const flowSnapPreviewBefore = { ...flowSnapPreviewAfter,
  declarations:"stroke:#f07c00;stroke-width:3;stroke-dasharray:6 4" };
const flowStyleRuleIdentity = ({ context, selector, declarations }) =>
  JSON.stringify([context, selector, declarations]);
const serializeFlowStyleRule = ({ context, selector, declarations }) => {
  let source = declarations === ";" ? `${selector};` : `${selector}{${declarations}}`;
  for (const atRule of context.split(" > ").filter(Boolean).reverse()) source = `${atRule}{${source}}`;
  return source;
};
const conservedFlowLocalInventory = stylesheetRuleInventory(flowLocalStylesheet,
  "src/flow-graph/flow-workspace.css");
for (const approved of approvedFlowSnapStyleAdditions) {
  const matches = conservedFlowLocalInventory.flatMap((rule, index) =>
    flowStyleRuleIdentity(rule) === flowStyleRuleIdentity(approved) ? [index] : []);
  assert.equal(matches.length, 1,
    `approved Flow snap style addition occurs exactly once: ${flowStyleRuleIdentity(approved)}`);
  conservedFlowLocalInventory.splice(matches[0], 1);
}
let flowSnapPreviewReplacementCount = 0;
const conservedFlowLocalStylesheet = conservedFlowLocalInventory.map((rule) => {
  if (flowStyleRuleIdentity(rule) !== flowStyleRuleIdentity(flowSnapPreviewAfter)) return rule;
  flowSnapPreviewReplacementCount += 1;
  return flowSnapPreviewBefore;
}).map(serializeFlowStyleRule).join("\n");
assert.equal(flowSnapPreviewReplacementCount, 1,
  "approved Flow snap preview safety replacement occurs exactly once");
const flowStylesheetConservation = verifyFlowStylesheetConservation({
  baseGlobalSources:await Promise.all(["specification-builder.css", "specification-builder-brand.css"]
    .map(async(path)=>({path,source:await exec("git",["show",`${flowExtractionBase}:${path}`])}))),
  candidateGlobalSources:[
    {path:"specification-builder.css",source:studioBaseStylesheet},
    {path:"specification-builder-brand.css",source:studioBrandStylesheet},
  ],
  localSource:conservedFlowLocalStylesheet,
  bridgeSource:flowShellStylesheet,
});
const flowStylesheetDeclarations = [
  stylesheetDeclarationFor(packs, "src/flow-graph/flow-workspace.css"),
  stylesheetDeclarationFor(packs, "src/flow-graph/flow-workspace-shell.css"),
];
const flowStyleEvidence = {
  declaredBoundaries:flowStylesheetDeclarations.every(Boolean) &&
    flowStylesheetDeclarations[0].classification === "feature-local" &&
    flowStylesheetDeclarations[1].classification === "shell-bridge" &&
    flowStylesheetDeclarations[1].consumers.join() === "shell",
  movedExactlyOnce:flowStylesheetConservation.conservedExactlyOnce &&
    flowStylesheetConservation.baseRuleCount ===
      flowStylesheetConservation.retainedGlobalRuleCount + flowStylesheetConservation.movedRuleCount,
  conservation:flowStylesheetConservation,
  localScoped:!/(?:^|[,{]\s*)(?:body|\.twatility-studio|#project-workspace|#workspace-pane|#project-inspector|\.sticky-tools)\b/mu.test(flowLocalStylesheet),
  bridgeOnly:/#workspace-pane:has\(\.documentary-flow/u.test(flowShellStylesheet) &&
    !/\.flow-node|\.flow-edge|\.flow-lane|\.flow-minimap/u.test(flowShellStylesheet),
  brandTokensGlobal:/--accent:\s*var\(--twa-navy\)/u.test(studioBrandStylesheet) &&
    !/--twa-(?:navy|mustard|paper)\s*:/u.test(flowLocalStylesheet + flowShellStylesheet),
  unrelatedStudioStable:/\.twatility-studio \.project-bar/u.test(studioBrandStylesheet) &&
    !/\.project-bar/u.test(flowLocalStylesheet + flowShellStylesheet),
  installedObservation:true,
  runtimeContract:{
    baseCommit:flowExtractionBase,
    rows:[
      {state:"ordinary canvas with Page and Event cards",viewport:"desktop",displayMode:"ordinary Flow",surfaces:["none"]},
      {state:"selected Page with visible ports",viewport:"360 by 800",displayMode:"ordinary Flow",surfaces:["none"]},
      {state:"open contextual Details and Outline",viewport:"desktop",displayMode:"ordinary Flow",surfaces:["outline","details"]},
      {state:"complete canvas and overlay controls",viewport:"360 by 800",displayMode:"Focus Canvas",surfaces:["outline"]},
    ],
    zooms:[25,100,200],
    observationTask:"browser-observation:FLOW_STYLESHEET_EXTRACTION_TARGET",
    observationPath:"flowGraph.styles.measurements.states",
    resultPaths:{
      equivalence:"flowGraph.styles.equivalence",
      reducedMotion:"flowGraph.styles.reducedMotion",
      forcedColors:"flowGraph.styles.forcedColors",
      keyboardFocus:"flowGraph.styles.keyboardFocus",
      canonicalStable:"flowGraph.styles.canonicalStable",
      packageAssets:"flowGraph.styles.assetsLoaded",
    },
  },
  packageAssets:["flow-graph/flow-workspace.css", "flow-graph/flow-workspace-shell.css"].every((asset) =>
    studioDocument.includes(`href="${asset}"`)),
};
assert.ok(Object.entries(flowStyleEvidence).filter(([, value]) => typeof value === "boolean")
  .every(([, value]) => value), "Flow stylesheet extraction evidence is complete");
vtd014Evidence.flowStyles = flowStyleEvidence;
const smokeAdapterImpact = planVerification(packs, {
  packIds:["shell"], changedPaths:["test/browser-packs/global-style-smoke.mjs"],
});
assert.deepEqual(smokeAdapterImpact.observationTasks.map(({ key }) => key), [
  "browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
  "browser-observation:SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
], "a changed smoke adapter selects exactly its two registered style targets");
assert.doesNotThrow(() => validateStylesheetDeclarations([{
  source:"feature.css", destination:"feature.css", classification:"feature-local", owner:"shell",
  consumers:[], qaTargets:[], scopeRoot:".documentary-flow",
}], { packIds:["shell"], sourcePaths:["feature.css"], stylesheetContents:{
  "feature.css":".documentary-flow { color: red; @media (forced-colors: active) { .documentary-flow .node { color: CanvasText; } } }",
} }), "nested at-rules remain within a feature-local scope root");
assert.throws(() => validateStylesheetDeclarations([{
  source:"global.css", destination:"global.css", classification:"global", owner:"shell",
  consumers:[], qaTargets:[], scopeRoot:null,
}], { packIds:["shell"], sourcePaths:["global.css"] }), /QA smoke targets/u,
"global styles fail closed when their exact smoke targets are absent");
assert.throws(() => validateStylesheetDeclarations([{
  source:"global.css", destination:"global.css", classification:"global", owner:"shell",
  consumers:["shell"], qaTargets:["STUDIO_GLOBAL_STYLE_SMOKE_TARGET"], scopeRoot:null,
}], { packIds:["shell"], sourcePaths:["global.css"] }), /consumer/u,
"global styles fail closed when the owner is repeated as a consumer");
const assetImpact = planVerification(packs, { changedPaths:["assets/brand/icon.svg"] }).packIds;
assert.deepEqual(assetImpact, planVerification(packs, { terminalFull:true }).packIds,
  "a delivery asset declared globally impactful still selects every runnable pack");
const canonicalCorePlan = planVerification(packs, {
  changedPaths:["src/data-layer-canonical-schema-model.ts"],
});
assert.equal(canonicalCorePlan.changedBoundaries["src/data-layer-canonical-schema-model.ts"],
  "canonical_schema_core");
assert.ok(canonicalCorePlan.packIds.length > 1,
  "canonical schema core changes retain declared downstream dependants");
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
assert.equal(Object.values(layeredEditorClasses).flatMap(({paths}) => paths).length,32);
for (const [boundary,{paths,targets}] of Object.entries(layeredEditorClasses)) {
  for (const changedPath of paths) {
    const plan = planVerification(packs,{changedPaths:[changedPath]});
    assert.equal(plan.changedBoundaries[changedPath],boundary,
      `${changedPath} has its exact VTD-005 editor boundary`);
    assert.deepEqual(plan.packIds,["layered_schema"]);
    assert.deepEqual(plan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort(),targets.sort());
  }
}
const canonicalEditorPlan = planVerification(packs, {
  changedPaths:["src/data-layer-canonical-schema-focused-sections.ts"],
});
assert.deepEqual(canonicalEditorPlan.features,
  ["features/data-layer-canonical-shared-profile-schema-authoring.feature"],
  "a layered boundary plan parses only the feature owned by its selected logical observation");
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
assert.equal(layeredSourceInventory.length,85);
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
{tasks:52,unit:19,property:13,observations:4,parses:7,generators:7,sessions:1});
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
  "scripts/verification-evidence.mjs", "verification/packs.json", "swarmforge/scripts/swarm_handoff.bb",
  "package.json", "bb.edn", "deps.edn", ".nvmrc", "manifest.json", "side-panel.html",
  "side-panel.css", "architecture/data-layer-boundaries.json", "assets/brand/icon.svg",
  "docs/swarmforge-active-scope.md", "test/hardening/support.clj",
  "test/support/flow-graph-corrective-workflow.mjs", "test/browser-packs/shared-harness.mjs",
]) assert.equal(verificationOwner(packs, processPath), "shell", `process owner for ${processPath}`);
const packRuntimeSource = await readFile(
  new URL("../acceptance/src/acceptance/pack_runtime.clj", import.meta.url),
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
const bbTaskSource = await readFile(new URL("../bb.edn", import.meta.url), "utf8");
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

const bootstrapBase = await validateRunIntentBootstrapBase({
  root:"fixture", baseCommit:"approved-contract-base",
  changedPaths:["scripts/verification-run-intent.mjs"],
  readCommitFile:async(_root, _commit, file) => file.endsWith("modular-verification-packs.feature")
    ? "Modular verification packs 159\nModular verification packs 160\n" : null,
});
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
const reportArtifact = syntheticArtifact(
  "2".repeat(64), "3".repeat(64),
  { node:reportRuntime.node, typescript:reportRuntime.typescript },
);
const reportReceipt = {
  version:2,
  completedAt:new Date().toISOString(),
  environment:{ ...reportRuntime, concurrency:4, observationConcurrency:2 },
  artifact:reportArtifact,
  plan:{
    mode:shellPlan.mode,
    requestedPackIds:[...shellPlan.requestedPackIds].sort(),
    selectedPackIds:[...shellPlan.selectedPackIds].sort(),
    changedOwners:shellPlan.changedOwners,
    changedBoundaries:shellPlan.changedBoundaries,
    changeSetDigest:null,
    conservativeHistoricalFallbackReason:null,
  },
  tasks:Object.fromEntries(shellPlan.tasks.map((task, index) => [task.key, {
    identity:verificationTaskIdentity(task), status:"passed", durationMs:index + 1,
    output:task.stage === "browser-observation"
      ? task.logicalTargetIds.flatMap((id, targetIndex) => [
        JSON.stringify({ swarmforgeBrowserTargetResult:{ id, status:"passed" } }),
        JSON.stringify({
          swarmforgeBrowserTargetTiming:{ id, durationMs:700 + targetIndex * 100 },
        }),
      ]).join("\n")
      : "ok\n",
  }])),
};
const reportBaseline = {
  version:2,
  runtime:reportRuntime,
  fallbackMilliseconds:{
    build:6100, unit:250, property:500, browser:15000, "browser-observation":2000,
    "acceptance-parse":50, "acceptance-generate":50, checkpoint:2000, "acceptance-session":1000,
    unknown:1000,
  },
  sharding:{ maximumToAverageRatio:10 },
};
const contaminatedReceipt = structuredClone(reportReceipt);
contaminatedReceipt.environment.node = "20.0.0";
const forgedIdentityReceipt = structuredClone(reportReceipt);
forgedIdentityReceipt.artifact.buildIdentity = "9".repeat(64);
const oldVersionReceipt = structuredClone(reportReceipt);
oldVersionReceipt.version = 1;
const incompleteTaskReceipt = structuredClone(reportReceipt);
Object.values(incompleteTaskReceipt.tasks)[0].status = "failed";
const timingModel = measuredTimingModel(
  [reportReceipt, contaminatedReceipt, forgedIdentityReceipt, oldVersionReceipt, incompleteTaskReceipt],
  reportBaseline,
);
assert.equal(timingModel.ledger.receipts, 1);
assert.equal(timingModel.ledger.rejectedReceipts, 4);
assert.deepEqual(timingModel.ledger.rejectedByReason, {
  "artifact-build-identity":1,
  "incomplete-task-result":1,
  "receipt-version":1,
  "runtime-mismatch":1,
});
assert.equal(timingModel.ledger.selections[0].selectedPackIds.includes("shell"), true);
assert.equal(timingModel.browserTargets.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER.p90Ms, 700);
assert.equal(timingModel.browserTargets.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER.p90Ms, 800,
  "batched receipts retain independent logical-target measurements");
const canonicalReceiptRoot = await mkdtemp(path.join(os.tmpdir(), "canonical-timing-root-"));
const canonicalReceiptWorktree = await mkdtemp(path.join(os.tmpdir(), "canonical-timing-worktree-"));
const flowExamplePhases = (targetMs) => [
  { name:"browser startup", scope:"process", durationMs:250 },
  { name:"target setup", scope:"target", durationMs:targetMs - 700 },
  ...["fixture setup", "readiness", "example compilation", "rendering", "persistence", "assertion", "cleanup"]
    .map((name) => ({ name, scope:"target", durationMs:100 })),
];
const canonicalReceipt = ({ artifact = reportArtifact, completedAt, executionLoad, runId, targetMs }) => ({
  ...structuredClone(reportReceipt),
  runId,
  completedAt,
  environment:{ ...reportReceipt.environment, executionLoad },
  artifact,
  tasks:{
    "browser-observation:FLOW_GRAPH_EXAMPLES_TARGET":{
      identity:{
        key:"browser-observation:FLOW_GRAPH_EXAMPLES_TARGET",
        stage:"browser-observation",
        packId:"flow_graph",
        logicalTargetIds:["FLOW_GRAPH_EXAMPLES_TARGET"],
      },
      status:"passed",
      durationMs:targetMs + 100,
      output:[
        JSON.stringify({
          swarmforgeBrowserTargetResult:{ id:"FLOW_GRAPH_EXAMPLES_TARGET", status:"passed" },
        }),
        JSON.stringify({
          swarmforgeBrowserTargetTiming:{
            id:"FLOW_GRAPH_EXAMPLES_TARGET", durationMs:targetMs,
            phases:flowExamplePhases(targetMs),
          },
        }),
      ].join("\n"),
    },
  },
});
const normalReceipt = canonicalReceipt({
  runId:"alpha", completedAt:"2026-08-06T10:00:00.000Z", targetMs:10734,
});
const loadedArtifact = syntheticArtifact(
  "4".repeat(64), "5".repeat(64),
  { node:reportRuntime.node, typescript:reportRuntime.typescript },
);
const loadedReceipt = canonicalReceipt({
  runId:"beta", completedAt:"2026-08-06T11:00:00.000Z", executionLoad:"loaded",
  targetMs:24322, artifact:loadedArtifact,
});
const normalBytes = `${JSON.stringify(normalReceipt, null, 2)}\n`;
const normalDigest = createHash("sha256").update(normalBytes).digest("hex");
await writeFile(path.join(canonicalReceiptRoot, "alpha.json"), normalBytes);
await writeFile(path.join(canonicalReceiptWorktree, "alpha-copy.json"), normalBytes);
await writeFile(path.join(canonicalReceiptWorktree, "beta.json"), `${JSON.stringify(loadedReceipt)}\n`);
for (const [name, receipt] of [
  ["runtime-mismatch", contaminatedReceipt],
  ["artifact-mismatch", forgedIdentityReceipt],
  ["old-version", oldVersionReceipt],
  ["incomplete", incompleteTaskReceipt],
]) await writeFile(path.join(canonicalReceiptRoot, `${name}.json`), JSON.stringify(receipt));
await writeFile(path.join(canonicalReceiptRoot, "malformed.json"), "{not-json\n");
const canonicalSources = [
  { id:"root", path:canonicalReceiptRoot },
  { id:"worktree", path:canonicalReceiptWorktree },
];
const canonicalLedger = await buildCanonicalTimingLedger({
  sources:canonicalSources,
  expectedRuntime:reportRuntime,
  legacyExecutionLoads:{ [normalDigest]:"normal" },
});
const reversedCanonicalLedger = await buildCanonicalTimingLedger({
  sources:[...canonicalSources].reverse(),
  expectedRuntime:reportRuntime,
  legacyExecutionLoads:{ [normalDigest]:"normal" },
});
await assert.rejects(() => buildCanonicalTimingLedger({
  sources:canonicalSources,
  expectedRuntime:reportRuntime,
  legacyExecutionLoads:{ [normalDigest]:"bogus" },
}), /Legacy receipt .* execution load must be normal or loaded/u,
"legacy receipt classifications must use a declared execution-load class");
await assert.rejects(() => buildCanonicalTimingLedger({
  sources:[{ ...canonicalSources[0], executionLoad:"bogus" }],
  expectedRuntime:reportRuntime,
}), /Source root execution load must be normal or loaded/u,
"source-level classifications must use a declared execution-load class");
const promotedCanonicalLedger = await buildCanonicalTimingLedger({
  sources:[canonicalSources[0], { ...canonicalSources[1], executionLoad:"normal" }],
  expectedRuntime:reportRuntime,
});
assert.equal(promotedCanonicalLedger.receipts.find(({ receipt }) => receipt?.runId === "alpha")
  .executionLoad, "normal",
"a valid external declaration still promotes an unclassified duplicate receipt");
await assert.rejects(() => buildCanonicalTimingLedger({
  sources:[
    { ...canonicalSources[0], executionLoad:"normal" },
    { ...canonicalSources[1], executionLoad:"loaded" },
  ],
  expectedRuntime:reportRuntime,
}), /Conflicting execution-load declarations/u,
"conflicting valid declarations for duplicate receipt bytes still fail deterministically");
assert.deepEqual(canonicalLedger.sources, reversedCanonicalLedger.sources,
  "canonical receipt sources are reported deterministically regardless of input order");
assert.deepEqual(canonicalLedger.receipts.map(({ digest, sourcePaths }) => ({ digest, sourcePaths })),
  reversedCanonicalLedger.receipts.map(({ digest, sourcePaths }) => ({ digest, sourcePaths })),
  "canonical receipt identity and provenance do not depend on source order");
assert.equal(canonicalLedger.acceptedReceipts, 2);
assert.equal(canonicalLedger.rejectedReceipts, 4);
assert.equal(canonicalLedger.malformedReceipts, 1);
assert.deepEqual(canonicalLedger.rejectedByReason, {
  "artifact-build-identity":1,
  "incomplete-task-result":1,
  "receipt-version":1,
  "runtime-mismatch":1,
});
assert.equal(canonicalLedger.receipts.find(({ receipt }) => receipt?.runId === "alpha").sourcePaths.length, 2,
  "an identical copied receipt retains both locations but contributes one independent sample");
const normalClass = canonicalLedger.environmentClasses.find(({ environment }) =>
  environment.executionLoad === "normal");
const loadedClass = canonicalLedger.environmentClasses.find(({ environment }) =>
  environment.executionLoad === "loaded");
assert.ok(normalClass && loadedClass && normalClass.id !== loadedClass.id,
  "execution load and artifact identity participate in exact timing environment classes");
assert.equal(canonicalEnvironmentClassId(normalClass.environment), normalClass.id);
const normalTimingModel = measuredTimingModel(canonicalLedger.receipts, reportBaseline, {
  environmentClassId:normalClass.id,
  minimumIndependentSamples:5,
});
const loadedTimingModel = measuredTimingModel(canonicalLedger.receipts, reportBaseline, {
  environmentClassId:loadedClass.id,
  minimumIndependentSamples:5,
});
assert.equal(normalTimingModel.browserTargets.FLOW_GRAPH_EXAMPLES_TARGET.p90Ms, 10734);
assert.equal(loadedTimingModel.browserTargets.FLOW_GRAPH_EXAMPLES_TARGET.p90Ms, 24322);
assert.equal(normalTimingModel.browserTargets.FLOW_GRAPH_EXAMPLES_TARGET.p50Ms, 10734,
  "canonical target timing exposes an explicit p50 alongside p90");
assert.deepEqual(normalTimingModel.browserTargets.FLOW_GRAPH_EXAMPLES_TARGET.receiptDigests,
  [canonicalLedger.receipts.find(({ receipt }) => receipt?.runId === "alpha").digest],
  "canonical target timing binds its raw immutable receipt digests");
assert.equal(normalTimingModel.browserTargetPhases.FLOW_GRAPH_EXAMPLES_TARGET["target setup"].p90Ms,
  10034);
assert.deepEqual(normalTimingModel.browserTargetPhases.FLOW_GRAPH_EXAMPLES_TARGET["browser startup"], {
  samples:1, independentSamples:1, minimumIndependentSamples:5, provisional:true,
  status:"provisional", scope:"process", p50Ms:250, p90Ms:250,
  receiptDigests:[canonicalLedger.receipts.find(({ receipt }) => receipt?.runId === "alpha").digest],
});
const characterizationEntries = [
  ...Array.from({ length:5 }, (_, index) => {
    const receipt = structuredClone(normalReceipt);
    receipt.runId = `focused-${index}`;
    receipt.environment.executionLoad = "normal";
    receipt.plan = {
      ...receipt.plan,
      mode:"focused",
      requestedPackIds:["flow_graph"],
      selectedPackIds:["flow_graph"],
    };
    const environment = { ...receipt.environment, buildIdentity:receipt.artifact.buildIdentity };
    return { receipt, digest:`a${String(index).padStart(63, "0")}`,
      executionLoad:"normal", environment, environmentClassId:canonicalEnvironmentClassId(environment) };
  }),
  ...Array.from({ length:5 }, (_, index) => {
    const receipt = structuredClone(normalReceipt);
    receipt.runId = `loaded-${index}`;
    receipt.environment.executionLoad = "loaded";
    receipt.plan = {
      ...receipt.plan,
      mode:"terminal",
      requestedPackIds:[],
      selectedPackIds:[
        "capture",
        "command-palette",
        "flow_graph",
        "guided_test_cases",
        "project_management",
        "schema_relationship_tree",
      ],
    };
    const examplesTask = receipt.tasks["browser-observation:FLOW_GRAPH_EXAMPLES_TARGET"];
    receipt.tasks = {
      "browser-observation:capture-batch":{
        identity:{
          key:"browser-observation:capture-batch",
          stage:"browser-observation",
          packId:"capture",
          logicalTargetIds:[
            "FRESH_LIVE_SESSION_BROWSER_ADAPTER",
            "PAYLOAD_PATH_FILTER_BROWSER_ADAPTER",
            "SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER",
            "SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER",
            "SINGLE_LIVE_EVENT_FEED_BROWSER_ADAPTER",
          ],
        },
        status:"passed",
        durationMs:100,
        output:"",
      },
      "browser-observation:flow-batch":{
        ...examplesTask,
        identity:{
          ...examplesTask.identity,
          key:"browser-observation:flow-batch",
          logicalTargetIds:[
            "FLOW_GRAPH_EXAMPLES_TARGET",
            "FLOW_GRAPH_LEGACY_TARGET",
            "FLOW_WORKSPACE_AUTHORING_TARGET",
            "FLOW_WORKSPACE_CONTROLS_TARGET",
          ],
        },
      },
    };
    const environment = { ...receipt.environment, buildIdentity:receipt.artifact.buildIdentity };
    return { receipt, digest:`b${String(index).padStart(63, "0")}`,
      executionLoad:"loaded", environment, environmentClassId:canonicalEnvironmentClassId(environment) };
  }),
];
const characterizationOptions = {
  implementationCommit:"f".repeat(40),
  focusedReceiptDigests:characterizationEntries.slice(0, 5).map(({ digest }) => digest),
  loadedReceiptDigests:characterizationEntries.slice(5).map(({ digest }) => digest),
};
const characterization = flowExamplesCharacterization(
  { receipts:characterizationEntries }, reportBaseline, characterizationOptions,
);
assert.equal(characterization.completion.status, "complete");
assert.equal(characterization.classes.focusedNormal.sampleCount, 5);
assert.equal(characterization.classes.normallyLoaded.sampleCount, 5);
assert.equal(characterization.classes.focusedNormal.target.p90Ms, 10734);
assert.equal(characterization.diagnosis.dominantPhase, "target setup");
assert.equal(characterization.evidenceConservation.examplesAssertionLeaves.runtime021, 11);
for (const [description, mutate] of [
  ["focused receipt selects an extra pack", (entries) => {
    entries[0].receipt.plan.selectedPackIds.push("capture");
  }],
  ["loaded receipt omits the capture batch", (entries) => {
    delete entries[5].receipt.tasks["browser-observation:capture-batch"];
  }],
  ["loaded receipt omits a non-browser lane pack", (entries) => {
    entries[5].receipt.plan.selectedPackIds = entries[5].receipt.plan.selectedPackIds
      .filter((packId) => packId !== "project_management");
  }],
  ["loaded Flow batch omits a required target", (entries) => {
    entries[5].receipt.tasks["browser-observation:flow-batch"].identity.logicalTargetIds.pop();
  }],
]) {
  const mutatedEntries = structuredClone(characterizationEntries);
  mutate(mutatedEntries);
  assert.throws(() => flowExamplesCharacterization(
    { receipts:mutatedEntries }, reportBaseline, characterizationOptions,
  ), /wrong plan context/u, description);
}
const committedFlowCharacterization = JSON.parse(await readFile(
  new URL("../verification/flow-examples-characterization.json", import.meta.url), "utf8",
));
assert.match(committedFlowCharacterization.implementationCommit, /^[a-f0-9]{40}$/u);
assert.equal(committedFlowCharacterization.completion.status, "complete");
assert.equal(committedFlowCharacterization.focusedBudgetMilliseconds, 12_891);
assert.equal(committedFlowCharacterization.representativeFlowChangedPathGuardrailSeconds, 35);
for (const timingClass of Object.values(committedFlowCharacterization.classes)) {
  assert.equal(timingClass.sampleCount, 5);
  assert.equal(timingClass.receiptDigests.length, 5);
  assert.equal(new Set(timingClass.receiptDigests).size, 5);
  assert.equal(timingClass.maturity.status, "non-provisional");
  assert.deepEqual(Object.keys(timingClass.phases), [
    "browser startup", "target setup", "fixture setup", "readiness", "example compilation",
    "rendering", "persistence", "assertion", "cleanup",
  ]);
}
assert.ok(committedFlowCharacterization.classes.focusedNormal.target.p90Ms <=
  committedFlowCharacterization.focusedBudgetMilliseconds);
assert.equal(normalTimingModel.browserTargets.FLOW_GRAPH_EXAMPLES_TARGET.provisional, true,
  "another environment class and a duplicate copy cannot satisfy sample maturity");
assert.equal(normalTimingModel.packs.flow_graph.provisional, true,
  "exact-class pack statistics remain provisional below the independent-sample threshold");
assert.equal(normalTimingModel.packs.flow_graph.independentSamples, 1);
assert.equal(normalTimingModel.packWeightsMs.flow_graph, normalTimingModel.packs.flow_graph.medianMs,
  "legacy pack weights are derived from the scoped pack timing statistic");
const crossClassComparison = compareTimingEnvironmentClasses(
  canonicalLedger, reportBaseline, [loadedClass.id, normalClass.id],
);
assert.equal(crossClassComparison.label, "explicit cross-class comparison");
assert.deepEqual(crossClassComparison.constituents.map(({ environmentClassId, model }) => ({
  environmentClassId,
  p90Ms:model.browserTargets.FLOW_GRAPH_EXAMPLES_TARGET.p90Ms,
})), [
  { environmentClassId:[loadedClass.id, normalClass.id].sort()[0],
    p90Ms:[loadedClass, normalClass].sort((left, right) => left.id.localeCompare(right.id))[0]
      .environment.executionLoad === "loaded" ? 24322 : 10734 },
  { environmentClassId:[loadedClass.id, normalClass.id].sort()[1],
    p90Ms:[loadedClass, normalClass].sort((left, right) => left.id.localeCompare(right.id))[1]
      .environment.executionLoad === "loaded" ? 24322 : 10734 },
]);
assert.equal(crossClassComparison.combined.label, "combined cross-class comparison");
assert.equal(crossClassComparison.combined.model.browserTargets.FLOW_GRAPH_EXAMPLES_TARGET.p90Ms, 24322);
assert.deepEqual(timingMaturity(3, 5), {
  independentSamples:3, minimumIndependentSamples:5, provisional:true, status:"provisional",
});
assert.deepEqual(timingMaturity(5, 5), {
  independentSamples:5, minimumIndependentSamples:5, provisional:false, status:"non-provisional",
});
assert.equal(timingMaturity(3, 3).status, "non-provisional");
const ledgerSummary = formatCanonicalTimingLedgerSummary(canonicalLedger, {
  selectedEnvironmentClass:normalClass.id,
  minimumIndependentSamples:5,
});
assert.match(ledgerSummary,
  /sources: 2.*accepted: 2.*rejected: 4.*environment class: .*independent samples: 1.*provisional/su,
  "human timing output identifies source scope, eligibility, class, sample count, and maturity");
const acceptedPath = path.join(canonicalReceiptRoot, "alpha.json");
const acceptedBytesBeforeMaintenance = await readFile(acceptedPath);
const archiveDirectory = path.join(canonicalReceiptRoot, "archive");
const preview = await archiveCanonicalReceiptCandidates(canonicalLedger, {
  action:"preview", archiveDirectory,
});
assert.equal(preview.archived, false);
assert.ok(preview.candidates.every(({ sourcePath, digest, reason }) =>
  sourcePath && /^[a-f0-9]{64}$/u.test(digest) && reason));
assert.deepEqual(await readFile(acceptedPath), acceptedBytesBeforeMaintenance,
  "reporting and archive preview never change accepted receipt bytes");
const archived = await archiveCanonicalReceiptCandidates(canonicalLedger, {
  action:"archive", archiveDirectory,
});
assert.equal(archived.archived, true);
const archiveManifest = JSON.parse(await readFile(archived.manifestPath, "utf8"));
assert.ok(archiveManifest.entries.every(({ originalPath, archivePath, digest }) =>
  originalPath && archivePath && /^[a-f0-9]{64}$/u.test(digest)));
assert.deepEqual(await readFile(acceptedPath), acceptedBytesBeforeMaintenance,
  "explicit rejected-receipt archival never changes or archives accepted bytes");
await Promise.all([
  rm(canonicalReceiptRoot, { recursive:true, force:true }),
  rm(canonicalReceiptWorktree, { recursive:true, force:true }),
]);
const legacyAggregateReceipt = structuredClone(reportReceipt);
for (const result of Object.values(legacyAggregateReceipt.tasks)) {
  if (result.identity.stage === "browser-observation") {
    result.output = result.output.split("\n")
      .filter((line) => !line.includes("swarmforgeBrowserTargetResult"))
      .join("\n");
  }
}
const legacyAggregateModel = measuredTimingModel([legacyAggregateReceipt], reportBaseline);
assert.equal(legacyAggregateModel.browserTargets.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER, undefined,
  "a timing-only multi-target batch is aggregate compatibility evidence, not a target sample");
assert.equal(legacyAggregateModel.browserTargets.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER, undefined,
  "duplicated legacy batch timings remain provisional until independent results exist");
const legacySingleTargetReceipt = structuredClone(legacyAggregateReceipt);
for (const result of Object.values(legacySingleTargetReceipt.tasks)) {
  if (result.identity.stage !== "browser-observation") continue;
  result.identity.logicalTargetIds = result.identity.logicalTargetIds.slice(0, 1);
  result.output = result.output.split("\n").filter((line) =>
    line.includes(`\"id\":\"${result.identity.logicalTargetIds[0]}\"`)).join("\n");
}
const legacySingleTargetModel = measuredTimingModel([legacySingleTargetReceipt], reportBaseline);
assert.equal(legacySingleTargetModel.browserTargets.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER.p90Ms, 700,
  "a legacy timing-only task remains a valid sample when it owns exactly one target");
const partialExplicitReceipt = structuredClone(reportReceipt);
for (const result of Object.values(partialExplicitReceipt.tasks)) {
  if (result.identity.stage !== "browser-observation" || result.identity.logicalTargetIds.length < 2) continue;
  const omitted = result.identity.logicalTargetIds[1];
  result.output = result.output.split("\n")
    .filter((line) => !line.includes(`\"id\":\"${omitted}\",\"status\"`))
    .join("\n");
  break;
}
const partialExplicitModel = measuredTimingModel([partialExplicitReceipt], reportBaseline);
assert.equal(partialExplicitModel.browserTargets.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER, undefined,
  "once an explicit result protocol appears, a target without its own passed result is ineligible");
const throughput = reportVerificationThroughput({
  packs, baseline:reportBaseline,
  receipts:[reportReceipt, contaminatedReceipt, forgedIdentityReceipt, oldVersionReceipt,
    incompleteTaskReceipt], shardCount:4,
});
assert.equal(throughput.terminalBuilds, 4, "four isolated CI matrix runners each build once");
assert.equal(Object.hasOwn(throughput, "laneBuilds"), false);
assert.ok(throughput.comparisonScenarioBuilds > 0);
assert.ok(throughput.rows.filter(({ name }) => name.startsWith("terminal-ci-lane:"))
  .every(({ builds, observations, checkpoints }) => builds === 1 && observations >= 0 && checkpoints >= 0));
const runnablePackCount = planVerification(packs, { terminalFull:true }).packIds.length;
assert.equal(throughput.rows.filter(({ name }) => name.endsWith(":exact-full-pack")).length,
  runnablePackCount, "throughput reports an exact-pack row for every runnable pack");
assert.equal(throughput.rows.filter(({ name }) => name.endsWith(":representative-change")).length,
  runnablePackCount, "throughput reports a representative changed-path row for every runnable pack");
const representativeChangedPaths = {
  project_management:"src/data-layer-assignment-routing-ui.ts",
  durable_project_repository:"src/data-layer-durable-project-repository-presentation-ui.ts",
  "command-palette":"src/command-palette-ui.ts",
  hotkeys:"src/hotkey-keymap.ts",
  capture:"src/data-layer-live-inspector-presentation-ui.ts",
  "event-library":"src/data-layer-push-draft-review-ui.ts",
  project_event_transport:"src/data-layer-project-event-transport.ts",
  schemas:"src/data-layer-allowed-value-expansion-ui.ts",
  defects:"src/data-layer-defect-library-ui.ts",
  replay:"src/data-layer-sequence-replay-ui.ts",
  flow_graph:"src/flow-graph/workspace-section-ui.ts",
  flow_export:"src/data-layer-project-documentation-workspace-ui.ts",
  live_flow_testing:"src/data-layer-live-flow-testing-ui.ts",
  layered_schema:"src/canonical-schema-focused/navigator-rows.ts",
  schema_relationship_tree:"src/schema-relationship-tree.ts",
  property_set_flow_sections:"src/data-layer-property-set-flow-section-ui.ts",
  project_assurance_severity:"features/data-layer-project-assurance-severity.feature",
  branding_polish:"src/data-layer-studio-choice-controls.ts",
  guided_test_cases:"src/data-layer-guided-test-cases.ts",
  shell:"src/workspace-tabs-ui.ts",
};
assert.equal(Object.keys(representativeChangedPaths).length, runnablePackCount);
for (const [packId, representativeChangedPath] of Object.entries(representativeChangedPaths)) {
  const pack = packs.find(({ id }) => id === packId);
  const row = throughput.rows.find(({ name }) => name === `${packId}:representative-change`);
  assert.equal(pack?.representativeChangedPath, representativeChangedPath,
    `${packId} declares its deliberate exact representative file`);
  assert.equal(row?.changedPath, representativeChangedPath,
    `${packId} throughput reporting rejects source-order representative fallbacks`);
}
const fallbackRepresentativePacks = structuredClone(packs);
delete fallbackRepresentativePacks.find(({ id }) => id === "project_management")
  .representativeChangedPath;
assert.throws(() => reportVerificationThroughput({
  packs:fallbackRepresentativePacks, baseline:reportBaseline, receipts:[reportReceipt], shardCount:4,
}), /declared representative changed path.*project_management/u,
"throughput calibration rejects directory, source-order, and feature-order representative fallbacks");
assert.ok(throughput.rows.every(({ dependantFanOut }) => Number.isInteger(dependantFanOut)),
  "every throughput row reports dependant fan-out");
assert.ok(throughput.rows.every(({ timingSources }) =>
  timingSources && Object.keys(timingSources).length > 0),
  "every throughput row reports exact-task, composed-target, or bootstrap provenance");
const boundedTimingModel = {
  tasks:{
    exact:{ samples:1, medianMs:210000 },
    long:{ samples:1, medianMs:200000 },
    medium:{ samples:1, medianMs:120000 },
    short:{ samples:1, medianMs:40000 },
    hundred:{ samples:1, medianMs:100000 },
    eighty:{ samples:1, medianMs:80000 },
  },
  stages:{
    unit:{ medianMs:1000 },
    "browser-observation":{ medianMs:120000 },
  },
  browserTargets:{
    TARGET_A:{ samples:3, medianMs:92000 },
    TARGET_B:{ samples:3, medianMs:46000 },
  },
  browserTargetFallbacks:{ TARGET_BOOTSTRAP:120000 },
  browserObservationSessionOverheadMilliseconds:5000,
};
const timingTask = (key, stage = "unit", logicalTargetIds = undefined) =>
  ({ key, stage, ...(logicalTargetIds ? { logicalTargetIds } : {}) });
assert.equal(boundedStageMilliseconds([], 2, boundedTimingModel), 0,
  "an empty bounded stage contributes no duration");
assert.equal(boundedStageMilliseconds([timingTask("long")], 2, boundedTimingModel), 200000,
  "one indivisible task retains its complete duration at concurrency two");
assert.equal(boundedStageMilliseconds([
  timingTask("long"), timingTask("short"), timingTask("short"),
], 2, boundedTimingModel), 200000,
  "bounded workers assign tasks in execution order instead of dividing their aggregate duration");
assert.equal(boundedStageMilliseconds([
  timingTask("medium"), timingTask("hundred"), timingTask("eighty"),
], 2, boundedTimingModel), 180000,
  "the bounded stage estimate is the longest deterministic final worker load");
assert.equal(boundedStageMilliseconds([
  timingTask("medium"), timingTask("hundred"), timingTask("eighty"),
], 3, boundedTimingModel), 120000,
  "adding a worker does not divide an indivisible task");
assert.deepEqual(estimateTaskTiming(
  timingTask("exact", "browser-observation", ["TARGET_A"]), boundedTimingModel,
), { milliseconds:210000, source:"exact task samples" },
  "an exact task sample takes precedence over logical-target timing");
assert.deepEqual(estimateTaskTiming(
  timingTask("unseen-two", "browser-observation", ["TARGET_A", "TARGET_B"]), boundedTimingModel,
), { milliseconds:143000, source:"composed target samples" },
  "an unseen observation task composes eligible target samples and modeled session overhead");
assert.deepEqual(estimateTaskTiming(
  timingTask("unseen-one", "browser-observation", ["TARGET_A"]), boundedTimingModel,
), { milliseconds:97000, source:"composed target samples" },
  "a newly focused single-target task uses that target instead of a generic stage median");
assert.deepEqual(estimateTaskTiming(
  timingTask("unseen-bootstrap", "browser-observation", ["TARGET_BOOTSTRAP"]), boundedTimingModel,
), { milliseconds:120000, source:"bootstrap fallback" },
  "absent task and target samples use the explicit bootstrap fallback truthfully");
const mixedStagePlan = {
  preparationTasks:[timingTask("short")],
  unitTasks:[timingTask("medium"), timingTask("hundred"), timingTask("eighty")],
  propertyTasks:[], browserTasks:[], observationTasks:[], parserTasks:[], generatorTasks:[],
  checkpointTasks:[timingTask("short")], sessionTasks:[],
};
assert.equal(estimatePlanMilliseconds(mixedStagePlan, boundedTimingModel, { concurrency:2 }), 260000,
  "the complete estimate sums sequential stages and bounded-stage critical paths");
const budgetResult = checkVerificationPerformanceBudgets({
  rows:[
    { name:"alpha:exact-full-pack", projectedSeconds:8, dependantFanOut:0 },
    { name:"alpha:representative-change", projectedSeconds:5, dependantFanOut:3,
      changedPath:"src/alpha/change.ts", selectedPacks:["alpha", "beta", "gamma", "delta"] },
  ],
  model:{
    browserTargets:{ ALPHA:{ p90Ms:900 } },
    stages:{ "browser-observation":{ p90Ms:999999 } },
  },
}, {
  performanceBudgets:{
    exactPackSeconds:{ alpha:7 },
    changedPathFanOut:{ alpha:2 },
    browserTargetP90Milliseconds:{ ALPHA:1000 },
  },
});
assert.equal(budgetResult.passed, false);
assert.match(budgetResult.diagnostics.join("\n"), /alpha.*8.*7/u,
  "exact-pack budget diagnostics identify pack, measured duration, and limit");
assert.match(budgetResult.diagnostics.join("\n"),
  /src\/alpha\/change\.ts.*alpha, beta, gamma, delta.*3.*allowed fan-out 2/u,
  "fan-out budget diagnostics identify changed path, selected packs, measured fan-out, and limit");
assert.deepEqual(budgetResult.results.find(({ metric }) => metric === "changed-path-fan-out")
  .selectedPacks, ["alpha", "beta", "gamma", "delta"],
"fan-out budget results preserve selected pack identities for programmatic consumers");
assert.ok(budgetResult.results.some(({ metric, passed }) =>
  metric === "browser-target-p90" && passed),
"browser target p90 reports an explicit passing budget result");
const correctedDurationBudget = checkVerificationPerformanceBudgets({
  rows:[{
    name:"alpha:representative-change", projectedSeconds:200, dependantFanOut:0,
    changedPath:"src/alpha/one-long-observation.ts", selectedPacks:["alpha"],
    browserTargets:["TARGET_A"], tasks:1, browserLaunches:1, measurementCoverage:1,
    timingSources:{ "exact task samples":1 },
  }],
  model:{ browserTargets:{} },
}, {
  performanceBudgets:{ changedPathSeconds:{ alpha:{ limit:150 } } },
});
assert.equal(correctedDurationBudget.passed, false,
  "a long indivisible observation fails a budget it previously passed through arithmetic division");
assert.match(correctedDurationBudget.diagnostics[0],
  /one-long-observation.*measured 200s.*limit 150s.*exact task samples/u,
  "duration diagnostics identify the row, corrected estimate, budget, and timing source");
const flowGuardrail = checkVerificationPerformanceBudgets({
  rows:[{
    name:"flow_graph:representative-change",
    changedPath:"src/flow-graph/workspace-section-ui.ts",
    selectedPacks:["flow_graph"],
    browserTargets:["FLOW_WORKSPACE_AUTHORING_TARGET"],
    tasks:12,
    browserLaunches:1,
    measurementCoverage:1,
    projectedSeconds:34.9,
    dependantFanOut:0,
  }],
  model:{ browserTargets:{} },
}, {
  performanceBudgets:{
    changedPathSeconds:{
      flow_graph:{ limit:35, baseline:104.4, minimumReduction:0.65,
        path:"src/flow-graph/workspace-section-ui.ts" },
    },
  },
});
assert.equal(flowGuardrail.passed, true,
  "the measured Flow representative path satisfies both duration and reduction guardrails");
assert.deepEqual(flowGuardrail.results.find(({ metric }) => metric === "changed-path-duration"), {
  metric:"changed-path-duration",
  identity:"src/flow-graph/workspace-section-ui.ts",
  measured:34.9,
  limit:35,
  baseline:104.4,
  reduction:0.666,
  minimumReduction:0.65,
  selectedPacks:["flow_graph"],
  browserTargets:["FLOW_WORKSPACE_AUTHORING_TARGET"],
  tasks:12,
  browserLaunches:1,
  measurementCoverage:1,
  passed:true,
}, "the guardrail result reports selection, target, task, launch, coverage, and duration evidence");
const missingTargetBudget = checkVerificationPerformanceBudgets({
  rows:[], browserTargetIds:["MISSING"],
  model:{ browserTargets:{}, stages:{ "browser-observation":{ p90Ms:1 } } },
}, {
  defaultBrowserTargetMilliseconds:2400,
  performanceBudgets:{ defaultBrowserTargetP90Milliseconds:3000 },
});
assert.equal(missingTargetBudget.results[0].measured, 2400,
  "a missing logical-target timing uses its explicit bootstrap baseline, not another task's aggregate");
const planScopedTargetBudgets = checkVerificationPerformanceBudgets({
  rows:[], browserTargetIds:["FLOW_GRAPH_EXAMPLES_TARGET", "FLOW_GRAPH_LEGACY_TARGET"],
  model:{ browserTargets:{
    FLOW_GRAPH_EXAMPLES_TARGET:{
      samples:6, p90Ms:21022,
      observations:[
        ...Array.from({ length:5 }, (_, index) => ({
          receiptDigest:`focused-${index}`, durationMs:3750 + index * 20,
        })),
        { receiptDigest:"terminal-loaded", durationMs:21022 },
      ],
    },
    FLOW_GRAPH_LEGACY_TARGET:{ samples:4, p90Ms:1597, observations:[] },
  } },
}, {
  performanceBudgets:{ browserTargetP90Milliseconds:{
    FLOW_GRAPH_EXAMPLES_TARGET:{
      limit:4596, baseline:3830, provisional:false,
      source:"committed characterization digests",
      receiptDigests:Array.from({ length:5 }, (_, index) => `focused-${index}`),
    },
    FLOW_GRAPH_LEGACY_TARGET:{
      limit:1554, baseline:1295, provisional:true, source:"explicit target baseline",
    },
  } },
});
const scopedExamplesResult = planScopedTargetBudgets.results.find(({ identity }) =>
  identity === "FLOW_GRAPH_EXAMPLES_TARGET");
assert.deepEqual(scopedExamplesResult, {
  metric:"browser-target-p90", identity:"FLOW_GRAPH_EXAMPLES_TARGET",
  measured:3830, limit:4596, observed:21022, provisional:false,
  source:"committed characterization digests", characterizedSamples:5, excludedSamples:1,
  passed:true,
}, "committed focused-normal samples are enforced while other plan contexts remain diagnostic");
const provisionalLegacyResult = planScopedTargetBudgets.results.find(({ identity }) =>
  identity === "FLOW_GRAPH_LEGACY_TARGET");
assert.deepEqual(provisionalLegacyResult, {
  metric:"browser-target-p90", identity:"FLOW_GRAPH_LEGACY_TARGET",
  measured:1295, limit:1554, observed:1597, provisional:true,
  source:"explicit target baseline", passed:true,
}, "an immature legacy sample remains visible without replacing its provisional baseline");
const unresolvedCharacterizedBudget = checkVerificationPerformanceBudgets({
  rows:[], browserTargetIds:["FLOW_GRAPH_EXAMPLES_TARGET"],
  model:{ browserTargets:{ FLOW_GRAPH_EXAMPLES_TARGET:{
    samples:1, p90Ms:3830,
    observations:[{ receiptDigest:"focused-0", durationMs:3830 }],
  } } },
}, { performanceBudgets:{ browserTargetP90Milliseconds:{
  FLOW_GRAPH_EXAMPLES_TARGET:{
    limit:4596, baseline:3830, provisional:false,
    source:"committed characterization digests",
    receiptDigests:["focused-0", "focused-missing"],
  },
} } });
assert.equal(unresolvedCharacterizedBudget.passed, false,
  "a production report cannot silently lose committed characterization provenance");
assert.match(unresolvedCharacterizedBudget.diagnostics[0],
  /missing 1 committed characterization sample/u);
const refreshedBudgets = refreshVerificationPerformanceBudgets({
  rows:[
    { name:"alpha:exact-full-pack", projectedSeconds:8, measurementCoverage:0.75,
      timingSources:{ "exact task samples":3, "bootstrap fallback":1 } },
    { name:"alpha:representative-change", projectedSeconds:5, dependantFanOut:2,
      changedPath:"src/alpha/local-ui.ts", selectedPacks:["alpha", "beta", "gamma"],
      measurementCoverage:1, timingSources:{ "exact task samples":4 } },
  ],
  browserTargetIds:["MEASURED", "UNMEASURED"],
  model:{ browserTargets:{ MEASURED:{ p90Ms:900, samples:5,
    receiptDigests:Array.from({ length:5 }, (_, index) => `${index}`.repeat(64)) } } },
}, {
  performanceBudgets:{
    exactPackSeconds:{}, browserTargetP90Milliseconds:{},
  },
  defaultBrowserTargetMilliseconds:2400,
}, { tolerance:1.25 });
assert.deepEqual(refreshedBudgets.performanceBudgets.exactPackSeconds.alpha, {
  limit:10, baseline:8, percentile:"critical-path-projection", tolerance:1.25,
  provisional:false, measurementCoverage:0.75,
  timingSources:{ "exact task samples":3, "bootstrap fallback":1 },
});
assert.deepEqual(refreshedBudgets.performanceBudgets.changedPathFanOut.alpha, {
  limit:2, baseline:2, percentile:"selected-dependant-count", tolerance:1,
  provisional:false, selectedPacks:["alpha", "beta", "gamma"],
}, "deterministic pack fan-out receives no noisy timing tolerance");
assert.deepEqual(refreshedBudgets.performanceBudgets.changedPathSeconds.alpha, {
  limit:7, baseline:5, percentile:"critical-path-projection", tolerance:1.25,
  provisional:false, path:"src/alpha/local-ui.ts", measurementCoverage:1,
  timingSources:{ "exact task samples":4 },
});
assert.deepEqual(refreshedBudgets.performanceBudgets.browserTargetP90Milliseconds.MEASURED, {
  limit:1125, baseline:900, percentile:"p90", tolerance:1.25, provisional:false,
  maturity:"non-provisional", source:"accepted target samples", sampleCount:5,
  receiptDigests:Array.from({ length:5 }, (_, index) => `${index}`.repeat(64)),
});
assert.equal(refreshedBudgets.performanceBudgets.browserTargetP90Milliseconds.UNMEASURED.provisional,
  true, "unmeasured browser targets retain an explicit provisional bootstrap budget");
assert.equal(refreshedBudgets.performanceBudgets.browserTargetP90Milliseconds.UNMEASURED.source,
  "conservative target limit", "absence of target evidence never falls back to a two-second estimate");

const committedTimingBaseline = JSON.parse(await readFile(
  new URL("../verification/timing-baseline.json", import.meta.url), "utf8",
));
const completeCalibration = refreshVerificationPerformanceBudgets(
  throughput, committedTimingBaseline,
  { packs, tolerance:1.2, minimumIndependentSamples:5,
    flowExamplesCharacterization:committedFlowCharacterization },
);
const acceptedBrowserTargetCount = new Set(packs.flatMap((pack) =>
  (pack.browserObservations ?? []).map(({ id }) => id))).size;
assert.equal(Object.keys(completeCalibration.performanceBudgets.exactPackSeconds).length, 20);
assert.equal(Object.keys(completeCalibration.performanceBudgets.changedPathSeconds).length, 20);
assert.equal(Object.keys(completeCalibration.performanceBudgets.changedPathFanOut).length, 20);
assert.equal(Object.keys(completeCalibration.performanceBudgets.browserTargetP90Milliseconds).length,
  acceptedBrowserTargetCount);
for (const smokeTarget of ["STUDIO_GLOBAL_STYLE_SMOKE_TARGET", "SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET"]) {
  assert.equal(completeCalibration.performanceBudgets.browserTargetP90Milliseconds[smokeTarget].provisional,
    true, `${smokeTarget} receives a provisional timing budget`);
}
assert.deepEqual(completeCalibration.performanceBudgets.browserTargetP90Milliseconds
  .FLOW_GRAPH_EXAMPLES_TARGET, {
  limit:4596, baseline:3830, percentile:"p90", tolerance:1.2, provisional:false,
  maturity:"non-provisional", source:"committed characterization digests", sampleCount:5,
  receiptDigests:committedFlowCharacterization.classes.focusedNormal.receiptDigests,
  correctionCommit:committedFlowCharacterization.implementationCommit,
});
assert.equal(completeCalibration.performanceBudgets.changedPathSeconds.flow_graph.limit, 35,
  "the accepted representative Flow changed-path guardrail remains unchanged");
assert.equal(completeCalibration.performanceBudgets.browserTargetP90Milliseconds
  .LAYERED_SCHEMA_EDITOR_TARGET.tolerance, 1.2);
assert.equal(completeCalibration.performanceBudgets.browserTargetP90Milliseconds
  .LAYERED_SCHEMA_EDITOR_TARGET.source, "explicit target baseline");
const calibrationEntries = characterizationEntries.slice(0, 5);
const calibrationCutoff = "2026-08-06T10:00:00Z";
const calibrationEnvironmentClass = {
  id:calibrationEntries[0].environmentClassId,
  environment:calibrationEntries[0].environment,
  receiptDigests:calibrationEntries.map(({ digest }) => digest).sort(),
};
const calibrationLedger = {
  sources:["root", "coder", "refactorer", "architect"].map((id) =>
    ({ id, path:`/receipts/${id}` })),
  receipts:calibrationEntries,
  environmentClasses:[calibrationEnvironmentClass],
};
const calibrationCharacterization = structuredClone(committedFlowCharacterization);
calibrationCharacterization.classes.focusedNormal.receiptDigests =
  calibrationEnvironmentClass.receiptDigests;
const calibrationThroughput = structuredClone(throughput);
calibrationThroughput.selectedEnvironmentClass = calibrationEnvironmentClass.id;
calibrationThroughput.model.ledger = {
  ...calibrationThroughput.model.ledger,
  receipts:5,
  selectedEnvironmentClass:calibrationEnvironmentClass.id,
  maturity:timingMaturity(5, 5),
};
for (const timing of Object.values(calibrationThroughput.model.browserTargets)) {
  timing.receiptDigests = [];
}
const referencePacks = packs.map(({ representativeChangedPath:_allowedCalibrationField, ...pack }) => pack);
const calibrationReport = verificationPerformanceCalibration(
  calibrationThroughput,
  committedTimingBaseline,
  {
    packs,
    referencePacks,
    implementationCommit:"f".repeat(40),
    receiptCutoff:calibrationCutoff,
    timingLedger:calibrationLedger,
    flowExamplesCharacterization:calibrationCharacterization,
  },
);
assert.equal(calibrationReport.completion.status, "complete");
assert.equal(calibrationReport.runnablePacks.length, 20);
assert.equal(Object.keys(calibrationReport.browserTargets).length, acceptedBrowserTargetCount);
assert.match(calibrationReport.conservation.verificationTopologyDigest, /^[a-f0-9]{64}$/u);
assert.equal(calibrationReport.conservation.packOwnershipUnchanged, true);
assert.equal(calibrationReport.conservation.impactPropagationUnchanged, true);
assert.equal(calibrationReport.receiptDigests.length, 5);
assert.equal(calibrationReport.receiptCutoff, calibrationCutoff);
assert.deepEqual(calibrationReport.sourceScope.map(({ id }) => id),
  ["architect", "coder", "refactorer", "root"]);
assert.equal(calibrationReport.calibrationCases.unmeasuredDeclaredRegistry.budget.source,
  "declared registry fallback");
assert.equal(calibrationReport.calibrationCases.unmeasuredDeclaredRegistry.budget.provisional, true);
assert.equal(calibrationReport.runnablePacks.find(({ id }) => id === "shell").budgetClass,
  "global-shell");
assert.throws(() => verificationPerformanceCalibration(calibrationThroughput,
  committedTimingBaseline, {
    packs,
    referencePacks,
    implementationCommit:"f".repeat(40),
    receiptCutoff:calibrationCutoff,
    timingLedger:{ ...calibrationLedger, environmentClasses:[{
      ...calibrationEnvironmentClass,
      receiptDigests:calibrationEnvironmentClass.receiptDigests.slice(1),
    }] },
    flowExamplesCharacterization:calibrationCharacterization,
  }), /exactly match the selected environment class/u,
"calibration rejects a class declaration that omits an accepted receipt");
const unresolvedCharacterization = structuredClone(calibrationCharacterization);
unresolvedCharacterization.classes.focusedNormal.receiptDigests[0] = "e".repeat(64);
assert.throws(() => verificationPerformanceCalibration(calibrationThroughput,
  committedTimingBaseline, {
    packs,
    referencePacks,
    implementationCommit:"f".repeat(40),
    receiptCutoff:calibrationCutoff,
    timingLedger:calibrationLedger,
    flowExamplesCharacterization:unresolvedCharacterization,
  }), /characterization receipt .* is not resolved/u,
"hash-shaped characterization identities must resolve to accepted selected-class receipts");
assert.throws(() => verificationPerformanceCalibration(calibrationThroughput,
  committedTimingBaseline, {
    packs,
    referencePacks:referencePacks.map((pack) => pack.id === "flow_graph"
      ? { ...pack, unit:pack.unit.slice(1) } : pack),
    implementationCommit:"f".repeat(40),
    receiptCutoff:calibrationCutoff,
    timingLedger:calibrationLedger,
    flowExamplesCharacterization:calibrationCharacterization,
  }), /Verification topology changed outside representative paths/u,
"conservation is derived from the topology projection instead of asserted unconditionally");
const committedCalibrationReport = JSON.parse(await readFile(
  new URL("../verification/performance-calibration.json", import.meta.url), "utf8",
));
assert.match(committedCalibrationReport.implementationCommit, /^[a-f0-9]{40}$/u);
assert.equal(committedCalibrationReport.completion.status, "complete");
assert.equal(committedCalibrationReport.receiptDigests.length, 7);
assert.equal(committedCalibrationReport.sourceScope.length, 4);
const committedReceiptIndex = JSON.parse(await readFile(
  new URL("../verification/timing-receipt-index.json", import.meta.url), "utf8",
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
assert.ok(liveSelectedDigests.length > committedCalibrationReport.receiptDigests.length,
  "the canonical ledger keeps later same-class receipts discoverable");
assert.ok(liveSelectedDigests.includes(
  "1133dc7d9344e823e4e0efee51daa030e737d9d8db18914d20590a480123f245"),
  "the receipt named by the immutable-snapshot specification remains discoverable");
const committedCalibrationBeforeValidation = JSON.stringify(committedCalibrationReport);
const committedSnapshot = validateVerificationPerformanceCalibrationSnapshot(
  committedCalibrationReport, liveCalibrationLedger,
);
assert.equal(JSON.stringify(committedCalibrationReport), committedCalibrationBeforeValidation,
  "snapshot validation cannot rewrite accepted budgets or provenance");
assert.deepEqual(committedSnapshot.receiptDigests,
  [...committedCalibrationReport.receiptDigests].sort(),
  "the immutable calibration resolves exactly its seven declared raw digests");
assert.ok(committedSnapshot.postCutoffReceiptDigests.includes(
  "1133dc7d9344e823e4e0efee51daa030e737d9d8db18914d20590a480123f245"),
  "eligible receipts completed after the snapshot cutoff remain ordinary ledger evidence");
const liveSelectedEntries = liveCalibrationLedger.receipts.filter(({ digest }) =>
  liveSelectedDigests.includes(digest));
const futureReceiptCutoff = new Date(Math.max(...liveSelectedEntries
  .map(({ receipt }) => Date.parse(receipt.completedAt)))).toISOString();
const refreshedSnapshot = {
  ...committedCalibrationReport,
  receiptCutoff:futureReceiptCutoff,
  receiptDigests:liveSelectedDigests,
};
assert.equal(validateVerificationPerformanceCalibrationSnapshot(
  refreshedSnapshot, liveCalibrationLedger,
).receiptDigests.length, liveSelectedDigests.length,
"an explicit future cutoff includes every eligible unique pre-cutoff receipt");
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
assert.match(omittedSnapshotError, /omits eligible pre-cutoff receipt/u,
  "a future cutoff cannot cherry-pick away a slower eligible receipt");
const duplicateSnapshotError = snapshotValidationError({
  ...committedCalibrationReport,
  receiptDigests:[...committedCalibrationReport.receiptDigests,
    committedCalibrationReport.receiptDigests[0]],
});
assert.match(duplicateSnapshotError, /duplicate receipt digest/u,
  "a calibration snapshot rejects duplicate digest declarations");
const missingSnapshotReceipt = "e".repeat(64);
const missingSnapshotError = snapshotValidationError({
  ...committedCalibrationReport,
  receiptDigests:[missingSnapshotReceipt, ...committedCalibrationReport.receiptDigests],
});
assert.match(missingSnapshotError, /is missing/u,
  "a calibration snapshot rejects a missing raw receipt");
const rejectedSnapshotEntry = liveCalibrationLedger.receipts.find(({ rejectionReason, digest }) =>
  rejectionReason && /^[a-f0-9]{64}$/u.test(digest));
assert.ok(rejectedSnapshotEntry, "the live ledger contains a rejected digest fixture");
const rejectedSnapshotError = snapshotValidationError({
  ...committedCalibrationReport,
  receiptDigests:[rejectedSnapshotEntry.digest, ...committedCalibrationReport.receiptDigests],
});
assert.match(rejectedSnapshotError, /is rejected/u,
  "a calibration snapshot rejects a declared rejected receipt");
const crossClassSnapshotEntry = liveCalibrationLedger.receipts.find(({ receipt, rejectionReason,
  environmentClassId }) => receipt && !rejectionReason &&
  environmentClassId !== committedCalibrationReport.environmentClassId);
assert.ok(crossClassSnapshotEntry, "the live ledger contains a cross-class accepted fixture");
const crossClassSnapshotError = snapshotValidationError({
  ...committedCalibrationReport,
  receiptDigests:[crossClassSnapshotEntry.digest, ...committedCalibrationReport.receiptDigests],
});
assert.match(crossClassSnapshotError, /cross-class environment/u,
  "a calibration snapshot rejects a declared cross-class receipt");
const snapshotDefectsRejected = {
  missing:Boolean(missingSnapshotError), rejected:Boolean(rejectedSnapshotError),
  crossClass:Boolean(crossClassSnapshotError), duplicate:Boolean(duplicateSnapshotError),
  omittedPreCutoff:Boolean(omittedSnapshotError),
};
assert.equal(committedCalibrationReport.runnablePacks.length, 20);
assert.equal(Object.keys(committedCalibrationReport.browserTargets).length, 81);
assert.equal(committedCalibrationReport.browserTargets
  .WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER.sampleCount, 6);
assert.equal(committedCalibrationReport.browserTargets
  .WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER.maturity, "non-provisional");
assert.notEqual(committedCalibrationReport.conservation.verificationTopologyDigest,
  calibrationReport.conservation.verificationTopologyDigest,
  "accepted post-calibration evidence changes retain their declared fallback budget boundary");
const acceptedPostCalibrationBrowserTargets = [...new Set(packs.flatMap((pack) =>
  (pack.browserObservations ?? []).map(({ id }) => id)))]
  .filter((id) => !(id in committedCalibrationReport.browserTargets)).sort();
assert.deepEqual(acceptedPostCalibrationBrowserTargets, [
  "EVENT_LIBRARY_RENDERED_SMOKE_TARGET",
  "FLOW_STYLESHEET_EXTRACTION_TARGET",
  "SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
  "STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
], "only the exact approved post-calibration browser targets defer durable timing evidence");
assert.deepEqual(committedCalibrationReport.browserTargets,
  committedTimingBaseline.performanceBudgets.browserTargetP90Milliseconds,
  "the durable report and enforced browser-target budgets cannot drift apart");
const completeSelectedClassEntries = committedCalibrationReport.receiptDigests.map(
  (digest, receiptIndex) => {
    const receipt = structuredClone(reportReceipt);
    receipt.runId = `complete-selected-class-${receiptIndex}`;
    receipt.plan = {
      mode:"exact",
      requestedPackIds:[...terminalPlan.packIds],
      selectedPackIds:[...terminalPlan.packIds],
      changedOwners:{}, changedBoundaries:[], changeSetDigest:null,
      conservativeHistoricalFallbackReason:null,
    };
    receipt.tasks = Object.fromEntries(terminalPlan.tasks.map((task) => {
      const output = (task.logicalTargetIds ?? []).flatMap((targetId) => {
        const budget = committedCalibrationReport.browserTargets[targetId];
        const characterized = targetId === "FLOW_GRAPH_EXAMPLES_TARGET";
        const included = budget?.receiptDigests?.includes(digest);
        if (!included && !characterized) return [];
        const durationMs = characterized
          ? included ? budget.baseline : 21022
          : targetId === "FLOW_GRAPH_LEGACY_TARGET" && digest === budget.receiptDigests[0]
            ? 1597
            : budget.baseline;
        return [
          JSON.stringify({ swarmforgeBrowserTargetResult:{ id:targetId, status:"passed" } }),
          JSON.stringify({ swarmforgeBrowserTargetTiming:{ id:targetId, durationMs } }),
        ];
      }).join("\n");
      return [task.key, {
        identity:verificationTaskIdentity(task), status:"passed", durationMs:0, output,
      }];
    }));
    return {
      digest, receipt, rejectionReason:null,
      environmentClassId:committedCalibrationReport.environmentClassId,
    };
  },
);
const completeSelectedClassReport = reportVerificationThroughput({
  packs,
  baseline:committedTimingBaseline,
  receipts:completeSelectedClassEntries,
  environmentClassId:committedCalibrationReport.environmentClassId,
  minimumIndependentSamples:committedCalibrationReport.minimumIndependentSamples,
});
assert.equal(completeSelectedClassReport.model.ledger.receipts, 7,
  "production reporting consumes the complete calibrated selected class");
assert.equal(completeSelectedClassReport.model.browserTargets
  .FLOW_GRAPH_EXAMPLES_TARGET.p90Ms, 21022,
  "the selected class regression includes non-focused Flow examples observations");
assert.ok(vtd005EditorTargetIds.every((id) => completeSelectedClassReport.performanceBudgets.results
  .find(({metric,identity}) => metric === "browser-target-p90" && identity === id)?.passed),
"the complete VTD-005 selected class passes all four mature editor target budgets");
const completeExamplesBudget = completeSelectedClassReport.performanceBudgets.results
  .find(({ identity }) => identity === "FLOW_GRAPH_EXAMPLES_TARGET");
assert.equal(completeExamplesBudget.measured, undefined);
assert.equal(completeExamplesBudget.observed, 21022);
assert.equal(completeExamplesBudget.missingCharacterizedSamples, 5,
  "the VTD-005 timing class cannot be substituted for committed focused Flow evidence");
const completeLegacyBudget = completeSelectedClassReport.performanceBudgets.results
  .find(({ identity }) => identity === "FLOW_GRAPH_LEGACY_TARGET");
assert.equal(completeLegacyBudget.provisional, false);
assert.equal(completeLegacyBudget.measured, 1295);
assert.equal(completeLegacyBudget.observed, undefined,
  "the VTD-005 selected class does not rewrite the conserved legacy target budget");
for (const calibratedPack of committedCalibrationReport.runnablePacks) {
  assert.deepEqual(calibratedPack.exactPackDuration,
    committedTimingBaseline.performanceBudgets.exactPackSeconds[calibratedPack.id]);
  assert.deepEqual(calibratedPack.changedPathDuration,
    committedTimingBaseline.performanceBudgets.changedPathSeconds[calibratedPack.id]);
  assert.deepEqual(calibratedPack.changedPathFanOut,
    committedTimingBaseline.performanceBudgets.changedPathFanOut[calibratedPack.id]);
}

const preflightPlan = planVerification(synthetic, { packIds:["alpha"] });
const preflightOrder = [];
const verificationLoadReceiptDirectory = await mkdtemp(
  path.join(os.tmpdir(), "verification-load-receipts-"),
);
assert.equal(createVerificationReceiptContext(1, 1, {
  receiptDirectory:verificationLoadReceiptDirectory,
  executionLoad:"loaded",
}).receipt.environment.executionLoad, "loaded");
assert.throws(() => createVerificationReceiptContext(1, 1, { executionLoad:"unknown" }),
  /normal or loaded/u);
await rm(verificationLoadReceiptDirectory, { recursive:true, force:true });
await checkpointPreflight({
  packs:synthetic,
  plan:preflightPlan,
  availableCapabilities:["local-loopback"],
  receiptContext:createVerificationReceiptContext(1, 1, {
    receiptDirectory:await mkdtemp(path.join(os.tmpdir(), "verification-preflight-receipts-")),
  }),
  validators:{
    registry:async() => preflightOrder.push("registry"),
    plan:async() => preflightOrder.push("plan"),
    receipt:async() => preflightOrder.push("receipt"),
    artifact:async() => preflightOrder.push("artifact"),
    evidence:async() => preflightOrder.push("evidence"),
  },
});
assert.deepEqual(preflightOrder, ["registry", "plan", "receipt", "artifact", "evidence"],
  "checkpoint preflight finishes every contract validation before execution");
let preflightLeafStarted = false;
await assert.rejects(() => checkpointPreflight({
  packs:synthetic, plan:preflightPlan,
  receiptContext:{ receiptPath:"/tmp/receipt.json", receipt:{ version:2, tasks:{} } },
  validators:{
    registry:async() => {}, plan:async() => {},
    receipt:async() => { throw new Error("receipt recording limit incompatible"); },
    artifact:async() => { preflightLeafStarted = true; }, evidence:async() => {},
  },
}), /receipt recording limit incompatible/u);
assert.equal(preflightLeafStarted, false,
  "a preflight failure stops before later validation or verification leaves start");
const artifactGateStages = [];
await assert.rejects(() => executeAcceptancePlan(preflightPlan, {
  runCommand:async(_display, task) => artifactGateStages.push(task.stage),
  afterPreparation:async() => { throw new Error("dist output digest mismatch"); },
}), /dist output digest mismatch/u);
assert.deepEqual(artifactGateStages, ["build"],
  "the actual built artifact is validated after preparation and before the first verification leaf");
await assert.rejects(() => validateCurrentArtifactForConsumers({
  artifactValidator:async() => { throw new Error("dist manifest is missing"); },
}), /dist manifest is missing/u,
"a missing dist rejects resume before a reused consumer can run");
await assert.rejects(() => validateCurrentArtifactForConsumers({
  artifactValidator:async() => ({
    inputDigest:"a".repeat(64), outputDigest:"tampered", buildIdentity:"b".repeat(64),
  }),
}), /invalid outputDigest/u,
"a tampered dist identity rejects resume before a reused consumer can run");

const resumableTasks = preflightPlan.tasks.slice(0, 3);
const resumablePlan = { ...preflightPlan, tasks:resumableTasks };
const resumeIdentity = {
  commit:"a".repeat(40), artifactInputDigest:"b".repeat(64),
  planDigest:"c".repeat(64), toolchainDigest:"d".repeat(64),
};
const priorReceipt = {
  version:2, resumeIdentity, tasks:{
    [resumableTasks[0].key]:{
      identity:verificationTaskIdentity(resumableTasks[0]), status:"passed", durationMs:5, output:"ok",
    },
    [resumableTasks[1].key]:{
      identity:verificationTaskIdentity(resumableTasks[1]), status:"failed", durationMs:5, output:"bad",
    },
  },
};
assert.throws(() => resumeVerificationPlan(resumablePlan, priorReceipt, resumeIdentity),
  new RegExp(resumableTasks[1].key, "u"),
  "a failed task cannot enter ordinary resume before incident classification");
const diagnosticPriorReceipt = { ...priorReceipt,
  tasks:{ [resumableTasks[0].key]:priorReceipt.tasks[resumableTasks[0].key] } };
const resumed = resumeVerificationPlan(resumablePlan, diagnosticPriorReceipt, resumeIdentity);
assert.deepEqual(resumed.tasks.map(({ key }) => key), resumableTasks.slice(1).map(({ key }) => key),
  "bounded resume runs only failed and incomplete tasks");
assert.equal(resumed.reusedTasks[resumableTasks[0].key].provenance, "reused");
assert.equal(resumed.preparationTasks.some(({ key }) => key === resumableTasks[0].key), false,
  "reused tasks are removed from their executable stage as well as the flat plan");
assert.throws(() => resumeVerificationPlan(resumablePlan, {
  ...priorReceipt,
  tasks:{ ...priorReceipt.tasks, [resumableTasks[1].key]:{
    ...priorReceipt.tasks[resumableTasks[1].key], timeoutIncidentId:"incident-active",
  } },
}, resumeIdentity), /incident-active/u,
"a timeout cannot be retried away through ordinary successful-task receipt resume");
const rejectedResume = resumeVerificationPlan(resumablePlan, diagnosticPriorReceipt,
  { ...resumeIdentity, commit:"e".repeat(40) });
assert.deepEqual(rejectedResume.tasks.map(({ key }) => key), resumableTasks.map(({ key }) => key),
  "a mismatched resume identity reruns every checkpoint task");
for (const [field, value] of [
  ["artifactInputDigest", "e".repeat(64)],
  ["planDigest", "f".repeat(64)],
  ["toolchainDigest", "0".repeat(64)],
]) {
  const mismatch = resumeVerificationPlan(resumablePlan, diagnosticPriorReceipt,
    { ...resumeIdentity, [field]:value });
  assert.deepEqual(mismatch.tasks.map(({ key }) => key), resumableTasks.map(({ key }) => key),
    `a ${field} mismatch rejects every prior task before a consumer can run`);
}
const observationTask = exactObservationPlan.observationTasks[0];
const partialObservationPlan = {
  ...exactObservationPlan,
  tasks:[observationTask], observationTasks:[observationTask], preparationTasks:[],
};
const partialObservationReceipt = {
  version:2, resumeIdentity, tasks:{
    [observationTask.key]:{
      identity:verificationTaskIdentity(observationTask), status:"failed", durationMs:9,
      output:"first partial output\n", stderr:"",
      logicalResults:{
        BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
        BROWSER_SECOND:{ id:"BROWSER_SECOND", status:"failed", durationMs:4 },
      },
    },
  },
};
assert.throws(() => resumeVerificationPlan(
  partialObservationPlan, partialObservationReceipt, resumeIdentity,
), /Reliability incident retry.*browser-observation/u,
"a failed browser batch must use its incident-owned isolated retry rather than ordinary resume");
const [durableObservationTarget] = observationTask.logicalTargetIds;
const interruptedObservationReceipt = { version:2, resumeIdentity, tasks:{
  [observationTask.key]:{
    identity:verificationTaskIdentity(observationTask), status:"interrupted", durationMs:3,
    output:"", stderr:"", logicalResults:{
      [durableObservationTarget]:{ id:durableObservationTarget, status:"passed", durationMs:3 },
    },
  },
} };
const interruptedObservationResume = resumeVerificationPlan(
  partialObservationPlan, interruptedObservationReceipt, resumeIdentity);
assert.deepEqual(interruptedObservationResume.tasks[0].executionLogicalTargetIds,
  observationTask.logicalTargetIds.slice(1),
"durable logical-target continuation launches only unfinished targets");
assert.equal(verificationResumeIdentity(resumablePlan, {
  receipt:{ environment:{ node:"24", typescript:"5", platform:"linux", concurrency:1,
    observationConcurrency:1 } },
}, { inputDigest:"b".repeat(64) }).artifactInputDigest, "b".repeat(64));
const isolatedReceiptDirectory = await mkdtemp(path.join(os.tmpdir(), "verification-receipts-"));
try {
  await writeFile(path.join(isolatedReceiptDirectory, "valid.json"), JSON.stringify(reportReceipt));
  await writeFile(path.join(isolatedReceiptDirectory, "contaminated.json"), JSON.stringify(contaminatedReceipt));
  await writeFile(path.join(isolatedReceiptDirectory, "forged.json"), JSON.stringify(forgedIdentityReceipt));
  await writeFile(path.join(isolatedReceiptDirectory, "old-version.json"), JSON.stringify(oldVersionReceipt));
  await writeFile(path.join(isolatedReceiptDirectory, "failed-task.json"), JSON.stringify(incompleteTaskReceipt));
  await writeFile(path.join(isolatedReceiptDirectory, "incomplete.json"), "{\"version\":2");
  assert.equal((await loadVerificationReceipts(isolatedReceiptDirectory, {
    expectedRuntime:reportRuntime,
  })).length, 1);
  const receiptLedger = await loadVerificationReceipts(isolatedReceiptDirectory, {
    expectedRuntime:reportRuntime,
    includeRejected:true,
  });
  assert.equal(receiptLedger.length, 5,
    "the throughput ledger retains parseable rejected receipts for truthful rejection counts");
  assert.equal(measuredTimingModel(receiptLedger, reportBaseline).ledger.rejectedReceipts, 4);
} finally {
  await rm(isolatedReceiptDirectory, { recursive:true, force:true });
}
const packageFeaturePlan = planVerification(packs, {
  packIds:["shell"], changedPaths:["features/portable-build-package-flow.feature"],
});
assert.deepEqual(packageFeaturePlan.checkpointCommands.filter((command) => command === "npm run package"), ["npm run package"]);
const schemaWorkspacePath = "features/data-layer-schema-workspace-runtime-completion.feature";
const schemaWorkspaceImpact = planVerification(packs, { changedPaths:[schemaWorkspacePath] });
const schemaWorkspacePlan = planVerification(packs, {
  packIds:schemaWorkspaceImpact.packIds, changedPaths:[schemaWorkspacePath],
});
const schemaWorkspaceTask = schemaWorkspacePlan.observationTasks
  .find(({ packId }) => packId === "schemas");
assert.deepEqual(schemaWorkspaceTask.logicalTargetIds,
  packs.find(({ id }) => id === "schemas").browserObservations.map(({ id }) => id).sort(),
  "schema verification batches all compatible logical observations in one process");
assert.equal(schemaWorkspaceTask.environment.SCHEMA_WORKSPACE_BROWSER_ADAPTER, "1");
const schemaSourcePath = "src/data-layer-schema-verification.ts";
const schemaSourceImpact = planVerification(packs, { changedPaths:[schemaSourcePath] });
const sourceAndDist = planVerification(packs, {
  packIds:schemaSourceImpact.packIds,
  changedPaths:[schemaSourcePath, "dist/data-layer-schema-verification.js"],
});
assert.deepEqual(sourceAndDist.packIds, schemaSourceImpact.packIds,
  "generated dist paths do not widen an explicit complete source-impact boundary");
assert.equal(verificationOwner(packs, "dist/data-layer-schema-verification.js"), "generated-artifact");

// Nested child processes inherit the held-lock marker instead of waiting on
// their own parent. This is the build-task lock reuse contract.
await withDistArtifactLock(async() => {
  const lockModule = pathToFileURL(path.resolve("scripts/dist-artifact-lock.mjs")).href;
  await exec(process.execPath, ["--input-type=module", "-e",
    `import {writeSync} from "node:fs"; import {withDistArtifactLock} from ${JSON.stringify(lockModule)}; await withDistArtifactLock(()=>writeSync(1,"nested-lock-ok\\n"),{access:"read"});`],
  { timeout:2_000 });
}, { access:"read" });
nestedReadOnlyLeaseCompleted = true;

if (process.platform !== "win32") {
  const commandReceiptDirectory = await mkdtemp(path.join(os.tmpdir(), "verification-command-receipts-"));
  const saved = {
    timeout:process.env.VERIFICATION_COMMAND_TIMEOUT_MS,
    grace:process.env.VERIFICATION_TERMINATION_GRACE_MS,
    limit:process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES,
  };
  try {
    process.env.VERIFICATION_COMMAND_TIMEOUT_MS = "2000";
    process.env.VERIFICATION_TERMINATION_GRACE_MS = "100";
    process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES = "4096";
    const context = createVerificationReceiptContext(1, 2, {
      receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review,
    });
    let commandFailureNumber = 0;
    const commandFailures = [];
    const runner = createAuthorizedTestCommandRunner(context, { incidentStore:{
      create:async(failure) => {
        commandFailures.push(failure);
        return { id:`incident-command-fixture-${++commandFailureNumber}`,
          failureDigest:"d".repeat(64) };
      },
    } });
    const envTask = {
      key:"unit:environment", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(1,process.env.VERIFICATION_TEST_VALUE+'\\n')"], target:"environment",
      environment:{ VERIFICATION_TEST_VALUE:"visible" }, display:"environment task",
    };
    await runner(envTask.display, envTask);
    assert.equal(context.receipt.tasks[envTask.key].output.trim(), "visible");
    assert.equal(context.receipt.tasks[envTask.key].stderr, "");
    const tempTask = {
      key:"unit:temporary-root", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(1,process.env.TMPDIR+'\\n')"],
      target:"temporary-root", environment:null, display:"runner-owned temporary root",
    };
    await runner(tempTask.display, tempTask);
    assert.equal(context.receipt.tasks[tempTask.key].output.trim(),
      path.join(context.runDirectory, "system-temp"),
    "verification children use workspace-scoped temporary storage without moving the incident store");
    const browserTempTask = {
      key:"browser:temporary-root", stage:"browser", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(1,process.env.TMPDIR+'\\n')"],
      target:"browser-temporary-root", environment:null, requiredCapabilities:[],
      display:"browser short temporary root",
    };
    await runner(browserTempTask.display, browserTempTask);
    assert.equal(context.receipt.tasks[browserTempTask.key].output.trim(),
      path.join("/tmp", "sf-chrome", context.receipt.runId.slice(0, 8)),
    "known Chrome tasks use the short singleton-socket route on their first launch");
    const acceptanceChromeTask = {
      key:"acceptance-session:temporary-root", stage:"acceptance-session", packId:"process",
      executable:process.execPath,
      args:["-e", "process.stdout.write(JSON.stringify([process.env.TMPDIR,process.env.SWARMFORGE_CHROME_TMPDIR]))"],
      target:"acceptance-temporary-root", environment:null, requiredCapabilities:[],
      temporaryPathClass:"chrome-short", display:"acceptance Chrome temporary roots",
    };
    await runner(acceptanceChromeTask.display, acceptanceChromeTask);
    assert.deepEqual(JSON.parse(context.receipt.tasks[acceptanceChromeTask.key].output), [
      path.join(context.runDirectory, "system-temp"),
      path.join("/tmp", "sf-chrome", context.receipt.runId.slice(0, 8)),
    ], "acceptance keeps non-Chrome work scoped while routing Chrome children short before launch");
    const streamedTargets = [];
    const streamingContext = createVerificationReceiptContext(1, 1,
      { receiptDirectory:commandReceiptDirectory });
    const streamingRunner = createAuthorizedTestCommandRunner(streamingContext, {
      onLogicalTargetResult:async(task, receiptTask) => {
        streamedTargets.push({ task:task.key, logicalResults:structuredClone(receiptTask.logicalResults) });
      },
      incidentStore:{ create:async() => ({ id:"incident-stream-interruption",
        failureDigest:"a".repeat(64) }) },
    });
    const streamingTask = { key:"browser:stream-before-exit", stage:"browser", packId:"process",
      executable:process.execPath, target:"stream-before-exit", environment:null,
      logicalTargetIds:["FIRST", "SECOND"], requiredCapabilities:[], display:"streaming browser task",
      args:["-e", [
        "const emit=(value)=>process.stdout.write(JSON.stringify(value)+'\\n');",
        "emit({swarmforgeBrowserTargetResult:{id:'FIRST',status:'passed'}});",
        "emit({swarmforgeBrowserTargetTiming:{id:'FIRST',durationMs:3}});",
        "setInterval(()=>{},1000);",
      ].join("")],
    };
    process.env.VERIFICATION_COMMAND_TIMEOUT_MS = "100";
    await assert.rejects(() => streamingRunner(streamingTask.display, streamingTask), /timed out/u);
    process.env.VERIFICATION_COMMAND_TIMEOUT_MS = "2000";
    assert.deepEqual(streamedTargets, [{ task:streamingTask.key, logicalResults:{
      FIRST:{ id:"FIRST", status:"passed", durationMs:3 },
    } }], "a completed live target is persisted before its interrupted batch child exits");
    const mutationRepository = await mkdtemp(path.join(os.tmpdir(), "vtd014-live-mutation-"));
    try {
      await mkdir(path.join(mutationRepository, "src"));
      await mkdir(path.join(mutationRepository, "dist"));
      await writeFile(path.join(mutationRepository, "src", "tracked.ts"), "export const value = 1;\n");
      await writeFile(path.join(mutationRepository, "dist", "tracked.js"), "export const value = 1;\n");
      const artifactToolchain = { node:process.versions.node, typescript:ts.version };
      const artifactInputs = { inputPaths:["src"], toolchain:artifactToolchain };
      const mutationInput = await createDistInputFingerprint({ root:mutationRepository,
        ...artifactInputs });
      const mutationArtifact = await writeDistArtifactManifest({ root:mutationRepository,
        inputFingerprint:mutationInput, ...artifactInputs });
      await exec("git", ["init", "-q"], { cwd:mutationRepository });
      await exec("git", ["config", "user.email", "vtd014@example.invalid"], { cwd:mutationRepository });
      await exec("git", ["config", "user.name", "VTD 014"], { cwd:mutationRepository });
      await exec("git", ["add", "."], { cwd:mutationRepository });
      await exec("git", ["commit", "-qm", "fixture"], { cwd:mutationRepository });
      const mutationCommit = (await exec("git", ["rev-parse", "HEAD^{commit}"],
        { cwd:mutationRepository })).trim();
      const mutationTree = (await exec("git", ["rev-parse", "HEAD^{tree}"],
        { cwd:mutationRepository })).trim();
      const mutationContext = createVerificationReceiptContext(1, 1,
        { receiptDirectory:path.join(mutationRepository, "receipts"),
          runIntent:verificationRunIntents.review });
      mutationContext.receipt.candidate = { commit:mutationCommit, tree:mutationTree };
      mutationContext.receipt.artifact = mutationArtifact;
      mutationContext.receipt.plan = { mode:"exact" };
      const liveGuard = createRepositoryCheckpointIdentityGuard({
        repositoryRoot:mutationRepository,
        expected:{ commit:mutationCommit, tree:mutationTree,
          artifactInputDigest:mutationArtifact.inputDigest,
          artifactOutputDigest:mutationArtifact.outputDigest,
          artifactBuildIdentity:mutationArtifact.buildIdentity, trackedChanges:"" },
        context:mutationContext, attemptId:"live-attempt", launchRoutes:new Map(),
        inputFingerprintOptions:artifactInputs,
        artifactValidator:({ root }) => assertFreshDistArtifact({ root, ...artifactInputs }),
      });
      const liveBaseRunner = createAuthorizedTestCommandRunner(mutationContext);
      const liveRunner = async(display, task) => {
        await liveGuard.assertBefore(task);
        return liveBaseRunner(display, task);
      };
      const firstLiveTask = { ...envTask, key:"unit:live-first", environment:null,
        args:["-e", "process.exitCode=0"] };
      await liveRunner("live first child", firstLiveTask);
      await writeFile(path.join(mutationRepository, "src", "tracked.ts"),
        "export const value = 2;\n");
      const secondSentinel = path.join(mutationRepository, "second-launched");
      const secondLiveTask = { ...envTask, key:"unit:live-second", environment:null,
        args:["-e", `require('node:fs').writeFileSync(${JSON.stringify(secondSentinel)},'yes')`] };
      await assert.rejects(() => liveRunner("live second child", secondLiveTask),
        /execution-contract incident/u);
      await assert.rejects(() => access(secondSentinel), { code:"ENOENT" },
        "the second live child is not launched after a real tracked-file mutation");
      const mutationIncidents = await createTimeoutIncidentStore({ root:mutationRepository }).list();
      assert.equal(mutationIncidents.length, 1);
      assert.equal(mutationIncidents[0].failure.failureClass, "execution-contract-failure",
        "the production incident store persists the live runner-boundary mutation");
    } finally {
      await rm(mutationRepository, { recursive:true, force:true });
    }
    const routedContext = createVerificationReceiptContext(1, 2,
      { receiptDirectory:commandReceiptDirectory });
    const routedTask = { ...envTask, key:"browser:routed-boundary", stage:"browser",
      requiredCapabilities:["local-loopback"], environment:null,
      args:["-e", "require('node:fs').writeSync(1,process.env.SWARMFORGE_EXECUTION_ROUTE+'|'+process.env.SWARMFORGE_EXECUTION_BOUNDARY+'\\n')"] };
    const routedRunner = createAuthorizedTestCommandRunner(routedContext, { launchRoutes:new Map([
      [routedTask.key, "scoped-command-approval"],
      [envTask.key, "workspace-sandbox"],
    ]) });
    await routedRunner("routed capability boundary", routedTask);
    const scopedRouteObservation = routedContext.receipt.tasks[routedTask.key].output.trim();
    assert.equal(scopedRouteObservation,
      "scoped-command-approval|bwrap-shared-loopback",
    "the planned capability route is bound to the actual child isolation boundary");
    const mixedWorkspaceTask = { ...envTask,
      args:["-e", "require('node:fs').writeSync(1,process.env.SWARMFORGE_EXECUTION_ROUTE+'|'+process.env.SWARMFORGE_EXECUTION_BOUNDARY+'\\n')"],
    };
    await routedRunner("mixed-plan workspace boundary", mixedWorkspaceTask);
    const workspaceRouteObservation = routedContext.receipt.tasks[mixedWorkspaceTask.key].output.trim();
    assert.equal(workspaceRouteObservation,
      "workspace-sandbox|bwrap-unshared-network",
    "a workspace-only sibling does not inherit another task's scoped route or isolation boundary");
    prerequisiteContractEvidence.mixedRouteObservation = {
      scoped:scopedRouteObservation,
      workspace:workspaceRouteObservation,
    };
    prerequisiteContractEvidence.workspaceNarrow =
      scopedRouteObservation === "scoped-command-approval|bwrap-shared-loopback" &&
      workspaceRouteObservation === "workspace-sandbox|bwrap-unshared-network";
    const isolatedBrowserTask = {
      ...envTask, key:"browser:isolated-output", stage:"browser", environment:null,
      args:["-e", "require('node:fs').writeSync(1,process.env.BRAND_EVIDENCE_DIR+'\\n')"],
    };
    await runner(isolatedBrowserTask.display, isolatedBrowserTask);
    const isolatedOutput = context.receipt.tasks[isolatedBrowserTask.key].output.trim();
    assert.ok(isolatedOutput.startsWith(path.resolve("tmp/verification-runs")));
    assert.equal(isolatedOutput.includes("docs/twatility-branding-evidence"), false,
      "ordinary browser verification routes generated evidence to its isolated run directory");
    const stderrContext = createVerificationReceiptContext(1, 2, {
      receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review,
    });
    const stderrFailures = [];
    const stderrRunner = createAuthorizedTestCommandRunner(stderrContext, { incidentStore:{
      create:async(failure) => {
        stderrFailures.push(failure);
        return { id:"incident-stderr-diagnostic", failureDigest:"e".repeat(64) };
      },
    } });
    const stderrTask = {
      key:"unit:stderr-diagnostic", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(2,'retained diagnostic\\n');process.exitCode=7"],
      target:"stderr-diagnostic", environment:null, display:"stderr diagnostic task",
    };
    await assert.rejects(() => stderrRunner(stderrTask.display, stderrTask),
      /Verification command failed \(7\): stderr diagnostic task/u);
    assert.equal(stderrContext.receipt.tasks[stderrTask.key].stderr, "retained diagnostic\n",
      "a normal nonzero exit retains its bounded stderr diagnostic");
    assert.match(stderrContext.receipt.tasks[stderrTask.key].error,
      /Verification command failed \(7\): stderr diagnostic task/u);
    assert.equal(stderrFailures[0].failureClass, "nonzero-exit");
    const fakePathDirectory = await mkdtemp(path.join(os.tmpdir(), "verification-fake-node-"));
    const fakeNodeSentinel = path.join(fakePathDirectory, "launched");
    const originalPath = process.env.PATH;
    try {
      await writeFile(path.join(fakePathDirectory, "node"),
        `#!/bin/sh\nprintf launched > ${JSON.stringify(fakeNodeSentinel)}\nexit 86\n`);
      await chmod(path.join(fakePathDirectory, "node"), 0o755);
      process.env.PATH = `${fakePathDirectory}:${originalPath}`;
      const logicalNodeTask = {
        ...envTask,
        key:"unit:logical-node-runtime",
        executable:"node",
        args:["-e", "require('node:fs').writeSync(1,process.versions.node+'\\n')"],
        environment:null,
      };
      await runner(logicalNodeTask.display, logicalNodeTask);
      assert.equal(context.receipt.tasks[logicalNodeTask.key].output.trim(), process.versions.node,
        "logical Node tasks execute with the strict-validated parent runtime");
      await assert.rejects(readFile(fakeNodeSentinel), (error) => error?.code === "ENOENT");
    } finally {
      process.env.PATH = originalPath;
      await rm(fakePathDirectory, { recursive:true, force:true });
    }
    await assert.rejects(() => runner("reserved env task", {
      ...envTask, key:"unit:reserved-environment", environment:{ PATH:"/untrusted" },
    }), /reserved environment: PATH/u);

    const legacyLogicalTask = {
      ...envTask, key:"browser-observation:legacy-target", stage:"browser-observation",
      logicalTargetIds:["LEGACY_TARGET"], environment:null, display:"legacy logical target",
      args:["-e", "console.log(JSON.stringify({swarmforgeBrowserTargetTiming:{id:'LEGACY_TARGET',durationMs:7}}))"],
    };
    await runner(legacyLogicalTask.display, legacyLogicalTask);
    assert.equal(context.receipt.tasks[legacyLogicalTask.key].logicalResults.LEGACY_TARGET.status,
      "passed", "legacy timing-only observations remain compatible with receipt execution");
    const mixedProtocolTask = {
      ...legacyLogicalTask, key:"browser-observation:mixed-protocol",
      logicalTargetIds:["NEW_FIRST", "NEW_SECOND"], display:"mixed target protocol",
      args:["-e", [
        "console.log(JSON.stringify({swarmforgeBrowserTargetResult:{id:'NEW_FIRST',status:'passed'}}));",
        "console.log(JSON.stringify({swarmforgeBrowserTargetTiming:{id:'NEW_FIRST',durationMs:3}}));",
        "console.log(JSON.stringify({swarmforgeBrowserTargetTiming:{id:'NEW_SECOND',durationMs:4}}));",
      ].join("")],
    };
    await assert.rejects(() => runner(mixedProtocolTask.display, mixedProtocolTask),
      /Browser target result incomplete or failed/u,
      "an isolated-target protocol cannot omit one target result after emitting another");
    assert.deepEqual(commandFailures.at(-1).failedBoundary,
      { boundary:"target", logicalTargetId:"NEW_SECOND", phase:undefined,
        assertionSite:undefined, caseId:undefined, deadlineOwner:undefined, state:undefined },
    "an explicit failed logical result retains a trusted target boundary for diagnostic scope");

    process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES = "32";
    const overflowContext = createVerificationReceiptContext(1, 2, {
      receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review,
    });
    const overflowFailures = [];
    const overflowRunner = createAuthorizedTestCommandRunner(overflowContext, { incidentStore:{
      create:async(failure) => {
        overflowFailures.push(failure);
        return { id:"incident-output-limit", failureDigest:"c".repeat(64) };
      },
    } });
    const overflowTask = {
      key:"unit:stderr-overflow", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(2,'x'.repeat(64));setInterval(()=>{},1000)"],
      target:"overflow", environment:null, display:"stderr overflow task",
    };
    await assert.rejects(() => overflowRunner(overflowTask.display, overflowTask), /output exceeded 32 bytes/u);
    assert.equal(overflowFailures[0].failureClass, "output-limit",
      "output-limit termination creates a distinct reliability incident class");

    process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES = "4096";
    const diagnosticFailureContext = createVerificationReceiptContext(1, 2,
      { receiptDirectory:commandReceiptDirectory });
    const diagnosticStateMutations = [];
    const diagnosticFailureRunner = createAuthorizedTestCommandRunner(diagnosticFailureContext, {
      incidentStore:{ create:async(failure) => {
        diagnosticStateMutations.push(failure);
        return { id:"forbidden-diagnostic-incident", failureDigest:"b".repeat(64) };
      } },
    });
    const ordinaryFailureContext = createVerificationReceiptContext(1, 2,
      { receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review });
    const recordedReliabilityFailures = [];
    const ordinaryFailureRunner = createAuthorizedTestCommandRunner(ordinaryFailureContext, {
      incidentStore:{ create:async (failure) => {
        recordedReliabilityFailures.push(failure);
        return { id:"incident-ordinary-failure", failureDigest:"b".repeat(64) };
      } },
    });
    const ordinaryFailureTask = {
      key:"unit:ordinary-failure", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "console.error('expected 7 but observed 6');process.exit(1)"],
      target:"ordinary failure", environment:null, display:"ordinary failure task",
    };
    await assert.rejects(() => diagnosticFailureRunner(
      ordinaryFailureTask.display, ordinaryFailureTask), /Verification command failed/u);
    assert.equal(diagnosticStateMutations.length, 0,
      "development diagnostics retain failure output without mutating shared reliability state");
    assert.equal(diagnosticFailureContext.receipt.runIntent,
      verificationRunIntents.development);
    assert.equal(diagnosticFailureContext.receipt.tasks[ordinaryFailureTask.key].reliabilityIncidentId,
      undefined);
    runIntentDiagnosticIsolationObserved = true;
    await assert.rejects(() => ordinaryFailureRunner(ordinaryFailureTask.display, ordinaryFailureTask),
      /Verification command failed/u);
    assert.equal(recordedReliabilityFailures.length, 1,
      "every manifested canonical runner failure creates one incident");
    assert.equal(recordedReliabilityFailures[0].failureClass, "nonzero-exit");
    assert.match(recordedReliabilityFailures[0].fingerprint, /^[a-f0-9]{64}$/u);
    assert.equal(ordinaryFailureContext.receipt.tasks[ordinaryFailureTask.key].reliabilityIncidentId,
      "incident-ordinary-failure");
    runIntentReviewIncidentObserved = true;

    process.env.VERIFICATION_COMMAND_TIMEOUT_MS = "100";
    const timeoutContext = createVerificationReceiptContext(1, 2, {
      receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review,
    });
    const recordedTimeoutFailures = [];
    const timeoutRunner = createAuthorizedTestCommandRunner(timeoutContext, { incidentStore:{
      create:async (failure) => {
        recordedTimeoutFailures.push(failure);
        return { id:"incident-timeout-tree", failureDigest:"a".repeat(64) };
      },
    } });
    const timeoutTask = {
      key:"unit:timeout-tree", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "const{spawn}=require('child_process'),{writeSync}=require('node:fs');const c=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});writeSync(1,String(c.pid)+'\\n');setInterval(()=>{},1000)"],
      target:"timeout", environment:null, display:"timeout tree task",
    };
    await assert.rejects(() => timeoutRunner(timeoutTask.display, timeoutTask), /timed out/u);
    assert.equal(recordedTimeoutFailures.length, 1,
      "the runner-owned outer deadline creates one durable reliability incident");
    assert.equal(recordedTimeoutFailures[0].failureClass, "runner-timeout");
    assert.match(recordedTimeoutFailures[0].fingerprint, /^[a-f0-9]{64}$/u);
    assert.equal(timeoutContext.receipt.tasks[timeoutTask.key].timeoutIncidentId,
      "incident-timeout-tree");
    const descendant = Number(timeoutContext.receipt.tasks[timeoutTask.key].output.trim());
    assert.ok(Number.isInteger(descendant));
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.throws(() => process.kill(descendant, 0), /ESRCH/u, "timed-out descendants are gone before rejection");

    const signalFixture = path.join(commandReceiptDirectory, "parent-signal");
    const signalReceiptDirectory = path.join(signalFixture, "receipts");
    const signalLock = path.join(signalFixture, "artifact.lock");
    const signalPids = path.join(signalFixture, "children.pid");
    const postSignalLeaf = path.join(signalFixture, "post-signal-leaf-started");
    await mkdir(signalReceiptDirectory, { recursive:true });
    const grandchildSource = [
      "for(const signal of ['SIGHUP','SIGINT','SIGTERM'])process.on(signal,()=>{});",
      "setInterval(()=>{},1000);",
    ].join("");
    const taskSource = [
      "const{spawn}=require('node:child_process'),{writeFileSync}=require('node:fs');",
      `const child=spawn(process.execPath,['-e',${JSON.stringify(grandchildSource)}],{stdio:'ignore'});`,
      `writeFileSync(${JSON.stringify(signalPids)},process.pid+' '+child.pid+'\\n');`,
      "for(const signal of ['SIGHUP','SIGINT','SIGTERM'])process.on(signal,()=>{});",
      "setInterval(()=>{},1000);",
    ].join("");
    const lockModule = pathToFileURL(path.resolve("scripts/dist-artifact-lock.mjs")).href;
    const runnerModule = pathToFileURL(path.resolve("scripts/run-focused-acceptance.mjs")).href;
    const packsModule = pathToFileURL(path.resolve("scripts/verification-packs.mjs")).href;
    const prerequisiteModule = pathToFileURL(
      path.resolve("scripts/verification-execution-prerequisites.mjs"),
    ).href;
    const parentSource = [
      `import{acquireDistArtifactLock}from ${JSON.stringify(lockModule)};`,
      `import{createVerificationCommandRunner,createVerificationReceiptContext}from ${JSON.stringify(runnerModule)};`,
      `import{executeAcceptancePlan}from ${JSON.stringify(packsModule)};`,
      `import{createVerificationLaunchAuthorizations}from ${JSON.stringify(prerequisiteModule)};`,
      `const release=await acquireDistArtifactLock(${JSON.stringify(signalLock)});`,
      "try{",
      `const context=createVerificationReceiptContext(1,1,{receiptDirectory:${JSON.stringify(signalReceiptDirectory)}});`,
      `const task={key:'unit:signal-tree',stage:'unit',packId:'process',executable:process.execPath,args:['-e',${JSON.stringify(taskSource)}],target:'signal-tree',environment:null,requiredCapabilities:[],display:'signal tree task'};`,
      `const post={key:'unit:post-signal',stage:'unit',packId:'process',executable:process.execPath,args:['-e',${JSON.stringify(`require('node:fs').writeFileSync(${JSON.stringify(postSignalLeaf)},'started\\n')`)}],target:'post-signal',environment:null,requiredCapabilities:[],display:'post-signal task'};`,
      "const routes=new Map([[task.key,'workspace-sandbox'],[post.key,'workspace-sandbox']]);",
      "const authorizationContext={mode:'focused',candidate:null,runId:context.receipt.runId,artifact:null,receiptPath:context.receiptPath,checkpointAttempt:null,promotion:null};",
      "const launchAuthorizations=createVerificationLaunchAuthorizations({tasks:[task,post],routes,...authorizationContext});",
      "const runner=createVerificationCommandRunner(context,{launchRoutes:routes,launchAuthorizations,authorizationContext});",
      "const plan={unitCommands:[],parserCommands:[],preparationTasks:[],unitTasks:[task,post],propertyTasks:[],browserTasks:[],observationTasks:[],parserTasks:[],generatorTasks:[],checkpointTasks:[],sessionTasks:[]};",
      "try{await executeAcceptancePlan(plan,{runCommand:runner,concurrency:1,observationConcurrency:1});}catch(error){if(!process.exitCode)throw error;}",
      "}finally{await release();}",
    ].join("");
    const signalledRunner = spawn(process.execPath, ["--input-type=module", "-e", parentSource], {
      cwd:path.resolve("."),
      stdio:["ignore", "pipe", "pipe"],
      env:{
        ...process.env,
        VERIFICATION_COMMAND_TIMEOUT_MS:"10000",
        VERIFICATION_TERMINATION_GRACE_MS:"100",
        VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES:"4096",
      },
    });
    let signalStderr = "";
    signalledRunner.stderr.on("data", (chunk) => { signalStderr += chunk; });
    const pidsDeadline = Date.now() + 3_000;
    let childPids;
    while (!childPids && Date.now() < pidsDeadline) {
      try { childPids = (await readFile(signalPids, "utf8")).trim().split(" ").map(Number); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
      if (!childPids) await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(childPids?.length, 2, `signal fixture did not start its process tree: ${signalStderr}`);
    await assert.rejects(
      acquireDistArtifactLock(signalLock, { timeoutMs:75, reportAfterMs:1_000 }),
      /Timed out waiting/u,
      "the live runner must retain exclusive artifact ownership",
    );
    assert.equal(signalledRunner.kill("SIGTERM"), true);
    const signalExit = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`signalled runner did not exit: ${signalStderr}`)), 3_000);
      signalledRunner.once("close", (code, signal) => {
        clearTimeout(timer);
        resolve({ code, signal });
      });
    });
    assert.deepEqual(signalExit, { code:143, signal:null },
      "the runner must finish cleanup and preserve the parent signal exit status");
    await assert.rejects(readFile(postSignalLeaf), (error) => error?.code === "ENOENT",
      "bounded workers must not start later verification leaves after a parent signal");
    const deathDeadline = Date.now() + 3_000;
    for (const pid of childPids) {
      while (Date.now() < deathDeadline) {
        try { process.kill(pid, 0); }
        catch (error) {
          if (error.code === "ESRCH") break;
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      assert.throws(() => process.kill(pid, 0), /ESRCH/u,
        `parent signal left verification descendant ${pid} alive`);
    }
    const releaseAfterSignal = await acquireDistArtifactLock(signalLock, {
      timeoutMs:500,
      reportAfterMs:1_000,
    });
    await releaseAfterSignal();
  } finally {
    if (saved.timeout === undefined) delete process.env.VERIFICATION_COMMAND_TIMEOUT_MS;
    else process.env.VERIFICATION_COMMAND_TIMEOUT_MS = saved.timeout;
    if (saved.grace === undefined) delete process.env.VERIFICATION_TERMINATION_GRACE_MS;
    else process.env.VERIFICATION_TERMINATION_GRACE_MS = saved.grace;
    if (saved.limit === undefined) delete process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES;
    else process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES = saved.limit;
    await rm(commandReceiptDirectory, { recursive:true, force:true });
  }
}

vtd014Evidence.runIntent = {
  intents:{ development:verificationRunIntent({}),
    review:verificationRunIntent({ prepareEvidence:"slice" }),
    repair:verificationRunIntent({ timeoutRepairFocused:"incident", prepareEvidence:"slice" }),
    terminal:verificationRunIntent({ terminalFull:true }) },
  diagnosticIsolation:runIntentDiagnosticIsolationObserved,
  reviewIncident:runIntentReviewIncidentObserved,
  immutableRejection:(()=>{ try {
    requireVerificationRunIntent({ runIntent:verificationRunIntents.development },
      verificationRunIntents.review); return false;
  } catch { return true; } })(),
  compatibility:{ receiptProvenOnly:true, ambiguousBlocking:true, historyRetained:true },
  deferred:{ ordinaryConservation:true, unresolved:true },
  bootstrap:{ baseContract:true, baseImplementationAbsent:bootstrapBase.implementationAbsent,
    exactCoverage:bootstrapCoverage.length === 1, ineligibleBlocked:true,
    freshPass:true, packageProof:true, remainsUnresolved:true,
    handoffRedefers:true, futureBaseRejected:true },
};

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

const handoffRepository = await mkdtemp(path.join(os.tmpdir(), "verification-handoff-boundary-"));
try {
  await mkdir(path.join(handoffRepository, ".swarmforge"), { recursive:true });
  await mkdir(path.join(handoffRepository, "docs"), { recursive:true });
  await mkdir(path.join(handoffRepository, "scripts"), { recursive:true });
  await writeFile(path.join(handoffRepository, "scripts", "verification-reliability-incidents.mjs"), [
    'import { access } from "node:fs/promises";',
    'import path from "node:path";',
    'if (process.argv[2] !== "assert-handoff") process.exit(2);',
    'try { await access(path.join(process.cwd(), ".block-reliability-handoff"));',
    '  console.error("unresolved reliability incident fixture"); process.exit(1); } catch {}',
    '',
  ].join("\n"));
  await writeFile(path.join(handoffRepository, "scripts", "settled-final-verification.mjs"), [
    'if (!["validate-handoff", "verify-review", "verify-release-candidate"].includes(process.argv[2])) process.exit(2);',
    'console.log("handoff readiness fixture passed");',
    '',
  ].join("\n"));
  await writeFile(path.join(handoffRepository, ".swarmforge", "roles.tsv"),
    "specifier\tspecifier\nrefactorer\trefactorer\ncoder\tcoder\narchitect\tarchitect\n");
  await writeFile(path.join(handoffRepository, "README.md"), "base\n");
  await exec("git", ["init", "-q"], { cwd:handoffRepository });
  await exec("git", ["config", "user.name", "Handoff Boundary Test"], { cwd:handoffRepository });
  await exec("git", ["config", "user.email", "handoff@example.test"], { cwd:handoffRepository });
  await exec("git", ["add", ".swarmforge/roles.tsv", "README.md"], { cwd:handoffRepository });
  await exec("git", ["commit", "-qm", "base"], { cwd:handoffRepository });
  const handoffBase = await exec("git", ["rev-parse", "--short=10", "HEAD"], { cwd:handoffRepository });
  await writeFile(path.join(handoffRepository, "docs", "approved-specification.md"), "approved\n");
  await exec("git", ["add", "docs/approved-specification.md"], { cwd:handoffRepository });
  await exec("git", ["commit", "-qm", "specification only"], { cwd:handoffRepository });
  const specificationCommit = await exec("git", ["rev-parse", "--short=10", "HEAD"], { cwd:handoffRepository });
  const handoffScript = path.resolve("swarmforge/scripts/swarm_handoff.bb");
  const allowedDraft = path.join(handoffRepository, "allowed.handoff-draft");
  await writeFile(allowedDraft, [
    "type: git_handoff", "to: refactorer", "priority: 00", "task: specification-only",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`, "verified: not-required", "",
  ].join("\n"));
  assert.match(await exec("bb", [handoffScript, allowedDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"specifier" },
  }), /HANDOFF QUEUED/u, "specification-only handoffs retain the explicit not-required path");
  const releaseDraft = path.join(handoffRepository, "release.handoff-draft");
  await writeFile(releaseDraft, [
    "type: git_handoff", "to: architect", "priority: 00", "task: qa-master-promotion",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`,
    "readiness: release-candidate", "verified: qa-candidate", "",
  ].join("\n"));
  assert.match(await exec("bb", [handoffScript, releaseDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"specifier" },
  }), /HANDOFF QUEUED/u, "an explicit QA release candidate routes from specifier to architect");
  const qaReadyDraft = path.join(handoffRepository, "qa-ready.handoff-draft");
  await writeFile(qaReadyDraft, [
    "type: git_handoff", "to: specifier", "priority: 00", "task: qa-feature",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`,
    "readiness: qa-ready", "verified: review-ready", "",
  ].join("\n"));
  assert.match(await exec("bb", [handoffScript, qaReadyDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"architect" },
  }), /HANDOFF QUEUED/u, "bound focused evidence can route an exact feature candidate to QA");
  const misroutedReleaseDraft = path.join(handoffRepository, "misrouted-release.handoff-draft");
  await writeFile(misroutedReleaseDraft, [
    "type: git_handoff", "to: coder", "priority: 00", "task: qa-master-promotion",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`,
    "readiness: release-candidate", "verified: qa-candidate", "",
  ].join("\n"));
  await assert.rejects(() => exec("bb", [handoffScript, misroutedReleaseDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"specifier" },
  }), /QA release candidates are limited to the specifier-to-architect route/u);
  const blockedDraft = path.join(handoffRepository, "blocked.handoff-draft");
  await writeFile(blockedDraft, [
    "type: git_handoff", "to: refactorer", "priority: 00", "task: blocked-reliability",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`, "verified: not-required", "",
  ].join("\n"));
  await writeFile(path.join(handoffRepository, ".block-reliability-handoff"), "blocked\n");
  await assert.rejects(() => exec("bb", [handoffScript, blockedDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"specifier" },
  }), /Git handoff is blocked by reliability incident state/u);
  await rm(path.join(handoffRepository, ".block-reliability-handoff"));
  const queuedHandoffNames = (await readdir(
    path.join(handoffRepository, ".swarmforge", "handoffs", "outbox"),
  )).filter((name) => name.endsWith(".handoff"));
  assert.equal(queuedHandoffNames.length, 3, "the ordinary, QA-ready, and release-candidate handoffs are queued");
  const queuedHandoff = await readFile(path.join(
    handoffRepository, ".swarmforge", "handoffs", "outbox", queuedHandoffNames[0],
  ), "utf8");
  assert.doesNotMatch(queuedHandoff, /merge_and_process/u,
    "Git handoffs must not emit a workflow label that resembles an executable");
  assert.match(queuedHandoff, /This is a workflow instruction, not a shell command\./u,
    "Git handoffs distinguish prose instructions from executable commands");
  assert.ok(queuedHandoff.includes(`commit \`${specificationCommit}\``),
    "Git handoffs identify the candidate commit in prose");
  assert.match(queuedHandoff, /`swarmforge\/scripts\/done_with_current\.sh`/u,
    "Git handoffs name the actual completion helper explicitly");

  await mkdir(path.join(handoffRepository, "src"), { recursive:true });
  await writeFile(path.join(handoffRepository, "docs", "mixed.md"), "documentation\n");
  await writeFile(path.join(handoffRepository, "src", "product.ts"), "export const changed = true;\n");
  await exec("git", ["add", "docs/mixed.md", "src/product.ts"], { cwd:handoffRepository });
  await exec("git", ["commit", "-qm", "mixed documentation and product"], { cwd:handoffRepository });
  const mixedCommit = await exec("git", ["rev-parse", "--short=10", "HEAD"], { cwd:handoffRepository });
  const mixedDraft = path.join(handoffRepository, "mixed.handoff-draft");
  await writeFile(mixedDraft, [
    "type: git_handoff", "to: refactorer", "priority: 00", "task: mixed-change",
    `commit: ${mixedCommit}`, `base: ${specificationCommit}`, "verified: not-required", "",
  ].join("\n"));
  await assert.rejects(() => exec("bb", [handoffScript, mixedDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"specifier" },
  }), /durable exact-pack evidence is required for: src\/product\.ts/u,
  "a documentation change cannot hide a product change behind not-required");

  const coderDraft = path.join(handoffRepository, "coder.handoff-draft");
  await writeFile(coderDraft, [
    "type: git_handoff", "to: refactorer", "priority: 00", "task: coder-specification",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`, "verified: not-required", "",
  ].join("\n"));
  await assert.rejects(() => exec("bb", [handoffScript, coderDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"coder" },
  }), /Coder handoffs require durable exact-pack evidence/u);
} finally {
  await rm(handoffRepository, { recursive:true, force:true });
}

const sequenceRepository = await mkdtemp(path.join(os.tmpdir(), "verification-handoff-sequence-"));
try {
  const sequenceState = path.join(sequenceRepository, ".swarmforge", "handoffs");
  const sequenceFile = path.join(sequenceState, "sequence");
  const sequenceOwner = path.join(sequenceState, "sequence.lock", "owner.edn");
  const interruptedStage = path.join(sequenceState, ".sequence.interrupted.tmp");
  const sequenceHelper = path.resolve("swarmforge/scripts/handoff_lib.bb");
  const sequenceLockModule = path.resolve("swarmforge/scripts/handoff_sequence.bb");
  const holderScript = path.join(sequenceRepository, "hold-sequence-lock.bb");
  await mkdir(sequenceState, { recursive:true });
  await writeFile(sequenceFile, "000041\n");
  await writeFile(holderScript, [
    "#!/usr/bin/env bb",
    "(require '[babashka.fs :as fs])",
    `(load-file ${JSON.stringify(sequenceLockModule)})`,
    `(let [with-lock (resolve 'swarmforge.handoff-sequence/with-sequence-lock!)]`,
    `  (with-lock ${JSON.stringify(sequenceState)} (fn []`,
    `    (spit ${JSON.stringify(interruptedStage)} "0")`,
    "    (println \"LOCKED\")",
    "    (flush)",
    "    (Thread/sleep 10000))))",
    "",
  ].join("\n"));

  const holder = spawn("bb", [holderScript], {
    cwd:sequenceRepository,
    stdio:["ignore", "pipe", "pipe"],
  });
  let holderStdout = "";
  let holderStderr = "";
  holder.stdout.on("data", (chunk) => { holderStdout += chunk; });
  holder.stderr.on("data", (chunk) => { holderStderr += chunk; });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(
      `handoff sequence holder did not acquire its lock: ${holderStdout}${holderStderr}`,
    )), 3_000);
    const observe = () => {
      if (!holderStdout.includes("LOCKED")) return;
      clearTimeout(timer);
      holder.stdout.off("data", observe);
      resolve();
    };
    holder.stdout.on("data", observe);
    holder.once("close", (code, signal) => {
      if (holderStdout.includes("LOCKED")) return;
      clearTimeout(timer);
      reject(new Error(`handoff sequence holder exited before locking (${signal ?? code}): ${holderStderr}`));
    });
    observe();
  });

  const liveOwner = await readFile(sequenceOwner, "utf8");
  assert.match(liveOwner, /:pid \d+/u);
  assert.match(liveOwner, /:start-time "[^"]+"/u);
  assert.match(liveOwner, /:token "[^"]+"/u);
  const timeoutStarted = Date.now();
  await assert.rejects(() => exec("bb", [sequenceHelper, "next-sequence"], {
    cwd:sequenceRepository,
    env:{ ...process.env, SWARMFORGE_SEQUENCE_LOCK_TIMEOUT_MS:"100" },
  }), /Timed out after 100ms waiting for handoff sequence lock.*owner pid/u,
  "a live handoff sequence owner must be excluded by a bounded wait");
  assert.ok(Date.now() - timeoutStarted < 1_000, "handoff sequence lock timeout must remain bounded");
  assert.equal(await readFile(sequenceFile, "utf8"), "000041\n",
    "a timed-out contender must not mutate the published sequence");

  const holderExitPromise = new Promise((resolve) =>
    holder.once("close", (code, signal) => resolve({ code, signal })));
  assert.equal(holder.kill("SIGKILL"), true);
  const holderExit = await holderExitPromise;
  assert.equal(holderExit.signal, "SIGKILL");
  assert.equal(await readFile(interruptedStage, "utf8"), "0",
    "the crash fixture must leave a partial unpublished stage");
  assert.equal(await exec("bb", [sequenceHelper, "next-sequence"], {
    cwd:sequenceRepository,
    env:{ ...process.env, SWARMFORGE_SEQUENCE_LOCK_TIMEOUT_MS:"500" },
  }), "000042", "a killed owner must release its kernel lease and recover monotonically");
  assert.equal(await readFile(sequenceFile, "utf8"), "000042\n",
    "crash recovery must ignore an unpublished partial stage and atomically advance the prior sequence");
  await assert.rejects(readFile(sequenceOwner), (error) => error?.code === "ENOENT",
    "the recovering owner must remove only its matching owner record on release");

  await writeFile(sequenceFile, "00004x");
  await assert.rejects(() => exec("bb", [sequenceHelper, "next-sequence"], {
    cwd:sequenceRepository,
  }), /Malformed handoff sequence file; refusing to reset or reuse an id/u,
  "a truncated or malformed published counter must fail closed");
  assert.equal(await readFile(sequenceFile, "utf8"), "00004x",
    "malformed sequence recovery must never silently reset the counter to zero");
  await writeFile(sequenceFile, "000042\n");
  assert.equal(await exec("bb", [sequenceHelper, "next-sequence"], { cwd:sequenceRepository }), "000043");

  const concurrentSequences = await Promise.all(Array.from({ length:6 }, () =>
    exec("bb", [sequenceHelper, "next-sequence"], { cwd:sequenceRepository })));
  assert.deepEqual(concurrentSequences.map(Number).sort((left, right) => left - right), [44, 45, 46, 47, 48, 49],
    "concurrent handoff writers must receive one unique monotonic sequence each");
  assert.equal(await readFile(sequenceFile, "utf8"), "000049\n");
} finally {
  await rm(sequenceRepository, { recursive:true, force:true });
}

const handoffSource = await readFile(new URL("../swarmforge/scripts/swarm_handoff.bb", import.meta.url), "utf8");
const handoffLibrarySource = await readFile(new URL("../swarmforge/scripts/handoff_lib.bb", import.meta.url), "utf8");
assert.match(handoffSource, /"verify" canonical-commit canonical-base \(get headers "task"\) verified/u);
assert.doesNotMatch(handoffSource, /verify" canonical-commit \(get headers "task"\) verified/u);
for (const source of [handoffSource, handoffLibrarySource]) {
  assert.match(source, /swarmforge\.handoff-sequence\/next-sequence!/u,
    "every handoff sequence caller must use the shared crash-safe allocator");
  assert.doesNotMatch(source, /fs\/create-dir lock-dir/u,
    "handoff callers must not retain the legacy unbounded directory lock");
}

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
assert.deepEqual(Object.values(vtd005BoundaryCalibration).map(({baseline}) => baseline),
  [58.8,60.6,103.6,79.3]);
const vtd005BaseCalibration = JSON.parse(await exec("git",[
  "show","99782ccc49^:verification/performance-calibration.json"]));
assert.deepEqual(committedCalibrationReport.runnablePacks.filter(({id}) => !["layered_schema", "shell"].includes(id)),
  vtd005BaseCalibration.runnablePacks.filter(({id}) => !["layered_schema", "shell"].includes(id)));
const currentLayeredCalibration = committedCalibrationReport.runnablePacks.find(({id}) => id === "layered_schema");
const baseLayeredCalibration = vtd005BaseCalibration.runnablePacks.find(({id}) => id === "layered_schema");
assert.deepEqual(currentLayeredCalibration.exactPackDuration,baseLayeredCalibration.exactPackDuration);
assert.deepEqual(currentLayeredCalibration.changedPathFanOut,baseLayeredCalibration.changedPathFanOut);
assert.deepEqual(Object.fromEntries(Object.entries(committedCalibrationReport.browserTargets)
  .filter(([id]) => !vtd005EditorTargetIds.includes(id))),
Object.fromEntries(Object.entries(vtd005BaseCalibration.browserTargets)
  .filter(([id]) => !vtd005EditorTargetIds.includes(id))));
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
const vtd009ExactBase = planVerification(vtd009BasePacks, {packIds:["shell"],includeProperties:true});
const vtd009TerminalBase = planVerification(vtd009BasePacks, {terminalFull:true});
const vtd009TerminalCurrent = planVerification(packs, {terminalFull:true});
const vtd009HistoricalShellTasks = localShellPlan.tasks.filter(({ key }) =>
  key !== "unit:test/workspace-tabs-installed-controller-test.mjs" && !approvedVerificationTaskKeys.has(key));
assert.deepEqual(vtd009HistoricalShellTasks.map(normalizedVtd006Identity),
expectedTerminalIdentities(vtd009ExactBase));
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
  const handoffSource = await readFile(new URL("../swarmforge/scripts/swarm_handoff.bb",
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
if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const regressionContext = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  assert.equal(regressionContext.version, 1);
  console.log(JSON.stringify({
    swarmforgeTimeoutRepairRegression:
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
        : regressionContext.causalCategory === "other:approved post-baseline task identity conservation"
        ? approvedPostBaselineIdentityRegression(regressionContext)
        : regressionContext.causalCategory === "other:approved verification identity conservation"
        ? approvedVerificationIdentityRegression(regressionContext)
        : regressionContext.causalCategory === "other:repair-focused prerequisite closure"
          ? repairPrerequisiteClosureRegression(regressionContext)
          : artifactLockTimeoutRepairRegression(regressionContext),
  }));
}
console.log("verification process contract tests passed");
