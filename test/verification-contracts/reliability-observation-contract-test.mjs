import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { verificationPacksAtCommit } from "../../scripts/verification-changes.mjs";
import { bindVerificationChangeScope, createVerificationCommandRunner, createVerificationReceiptContext, focusedAcceptanceOptions, reviewReadyScopeGuardRequired, validateExplicitChangedPaths } from "../../scripts/run-focused-acceptance.mjs";
import { candidatePredatesRunIntentImplementation, legacyArchivedCheckpointTaskIdentities, requireEvidenceReceiptRunIntent } from "../../scripts/verification-evidence.mjs";
import { planVerification, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
import { classifyHistoricalTimeoutFixture, createTimeoutIncidentStore, createVerificationProgressTracker, diagnosticRetryScope, timeoutRepairPackIds } from "../../scripts/verification-reliability-incidents.mjs";
import { bindRunIntentBootstrapPlan, verificationRunIntents } from "../../scripts/verification-run-intent.mjs";
import { defaultStoreDirectory } from "../../scripts/verification-reliability-persistence.mjs";
import { verificationPolicyContracts } from "../../scripts/verification-policy/contracts.mjs";
import { createVerificationLaunchAuthorizations } from "../../scripts/verification-execution-prerequisites.mjs";
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
const focusedSelectorOptions = focusedAcceptanceOptions([
  "--pack", "shell", "--focused-task", "unit:test/verification-process-contract-test.mjs",
]);
const authorizationContext = {
  mode:"repair-focused", candidate:{ commit:"candidate", tree:"tree" }, runId:"run-1",
  artifact:{ inputDigest:"artifact" }, receiptPath:"tmp/receipt.json",
};
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
  ...verificationPolicyContracts.flatMap(({testPaths})=>testPaths.flatMap((testPath)=>
    ["--focused-task",`unit:${testPath}`])),
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
assert.equal(focusedAcceptanceOptions([
  "--reliability-repair-focused", "incident-1", "--reliability-regression", "unit:test/a.mjs",
  "--reliability-causal-category", "other:repair", "--reliability-causal-explanation", "repair",
  "--changed-since", "base", "--prepare-evidence", "task-17",
  "--resume-receipt", "tmp/verification-receipts/prior.json",
]).resumeReceipt,"tmp/verification-receipts/prior.json",
"repair-focused mode accepts only its runner-owned continuation receipt");
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
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
