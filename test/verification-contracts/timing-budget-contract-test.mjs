import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import path from "node:path";
import { boundedStageMilliseconds, checkVerificationPerformanceBudgets, estimatePlanMilliseconds, estimateTaskTiming, refreshVerificationPerformanceBudgets, reportVerificationThroughput } from "../../scripts/report-verification-throughput.mjs";
import { planVerification, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
const syntheticArtifact = (inputDigest, outputDigest, toolchain) => {
  const schemaVersion = 1;
  const buildIdentity = createHash("sha256").update(`${JSON.stringify({
    schemaVersion, inputDigest, outputDigest, toolchain,
  })}\n`).digest("hex");
  return { schemaVersion, buildIdentity, inputDigest, outputDigest, toolchain };
};
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
const packs = await loadVerificationPacks();
const shellPlan = planVerification(packs, { packIds:["shell"] });
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
const forgedIdentityReceipt = structuredClone(reportReceipt);
const oldVersionReceipt = structuredClone(reportReceipt);
const incompleteTaskReceipt = structuredClone(reportReceipt);
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
  verification_process:"scripts/verification-registry/compiler.mjs",
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
const lockedRuntime = { node:process.versions.node, typescript:"5.9.3" };
const artifact = syntheticArtifact("b".repeat(64), "c".repeat(64), lockedRuntime);
const unitTasks = [{ key:"unit:registry", stage:"unit" }, { key:"unit:ownership", stage:"unit" }];
