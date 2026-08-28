import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { boundedStageMilliseconds, checkVerificationPerformanceBudgets, compareTimingEnvironmentClasses, estimatePlanMilliseconds, estimateTaskTiming, flowExamplesCharacterization, loadVerificationReceipts, measuredTimingModel, refreshVerificationPerformanceBudgets, reportVerificationThroughput, validateVerificationPerformanceCalibrationSnapshot, verificationPerformanceCalibration } from "../../scripts/report-verification-throughput.mjs";
import { archiveCanonicalReceiptCandidates, buildCanonicalTimingLedger, canonicalEnvironmentClassId, formatCanonicalTimingLedgerSummary, timingMaturity } from "../../scripts/verification-timing-ledger.mjs";
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

assert.equal(timingModel.browserTargets.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER.p90Ms, 800);

assert.equal(timingModel.browserTargets.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER.p90Ms, 900,
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
  new URL("../../verification/flow-examples-characterization.json", import.meta.url), "utf8",
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
  result.identity.logicalTargetIds = result.identity.logicalTargetIds
    .filter((id) => id === "SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER");
  result.output = result.output.split("\n").filter((line) =>
    line.includes(`\"id\":\"${result.identity.logicalTargetIds[0]}\"`)).join("\n");
}

const legacySingleTargetModel = measuredTimingModel([legacySingleTargetReceipt], reportBaseline);

assert.equal(legacySingleTargetModel.browserTargets.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER.p90Ms, 800,
  "a legacy timing-only task remains a valid sample when it owns exactly one target");

const partialExplicitReceipt = structuredClone(reportReceipt);

for (const result of Object.values(partialExplicitReceipt.tasks)) {
  if (result.identity.stage !== "browser-observation" || result.identity.logicalTargetIds.length < 2) continue;
  const omitted = result.identity.logicalTargetIds.at(-1);
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

const committedTimingBaseline = JSON.parse(await readFile(
  new URL("../../verification/timing-baseline.json", import.meta.url), "utf8",
));

const completeCalibration = refreshVerificationPerformanceBudgets(
  throughput, committedTimingBaseline,
  { packs, tolerance:1.2, minimumIndependentSamples:5,
    flowExamplesCharacterization:committedFlowCharacterization },
);

const acceptedBrowserTargetCount = new Set(packs.flatMap((pack) =>
  (pack.browserObservations ?? []).map(({ id }) => id))).size;

assert.equal(Object.keys(completeCalibration.performanceBudgets.exactPackSeconds).length,
  runnablePackCount);

assert.equal(Object.keys(completeCalibration.performanceBudgets.changedPathSeconds).length,
  runnablePackCount);

assert.equal(Object.keys(completeCalibration.performanceBudgets.changedPathFanOut).length,
  runnablePackCount);

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

assert.equal(calibrationReport.runnablePacks.length, runnablePackCount);

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
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8",
));

assert.match(committedCalibrationReport.implementationCommit, /^[a-f0-9]{40}$/u);

assert.equal(committedCalibrationReport.completion.status, "complete");

assert.equal(committedCalibrationReport.receiptDigests.length, 7);

assert.equal(committedCalibrationReport.sourceScope.length, 4);

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

const lockedRuntime = { node:process.versions.node, typescript:"5.9.3" };

const artifact = syntheticArtifact("b".repeat(64), "c".repeat(64), lockedRuntime);

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
  const isolatedReceiptLedger = await loadVerificationReceipts(isolatedReceiptDirectory, {
    expectedRuntime:reportRuntime,
    includeRejected:true,
  });
  assert.equal(isolatedReceiptLedger.length, 5,
    "the throughput ledger retains parseable rejected receipts for truthful rejection counts");
  assert.equal(measuredTimingModel(isolatedReceiptLedger, reportBaseline).ledger.rejectedReceipts, 4);
} finally {
  await rm(isolatedReceiptDirectory, { recursive:true, force:true });
}



const unitTasks = [{ key:"unit:registry", stage:"unit" }, { key:"unit:ownership", stage:"unit" }];

const estimate = estimatePlanMilliseconds({
  preparationTasks:[], unitTasks, propertyTasks:[], browserTasks:[], observationTasks:[],
  parserTasks:[], generatorTasks:[], checkpointTasks:[], sessionTasks:[],
}, { tasks:{
  "unit:registry":{ samples:1, medianMs:1200 },
  "unit:ownership":{ samples:1, medianMs:800 },
} });

assert.ok(Number.isFinite(estimate) && estimate >= 0,
  "timing policy returns a finite critical-path estimate for boundary tasks");

const scorecard = JSON.parse(await readFile(
  new URL("../../verification/vtd012-adoption-scorecard.json", import.meta.url), "utf8"));

assert.equal(scorecard.version, 3);

assert.deepEqual(scorecard.reconstruction, {
  sourcePatchReference:"962affc8c2fb281036a221020910a503ed96bb6b",
  repairedQaBase:"db157699df9cecde5b323b0efafe2d43a5c250a7",
  integratedRepairCandidate:"bb8d05ae64a1d1484cd45c0509eccf79394cc5ae",
  excludedRepairPatchReferences:[
    "15f110217b36c7f79c674d3b07f75c55b0e5e7a7",
    "31fc1b814f8f73a0297c01efd8be6af6b44f48a6",
    "1bb4ae05e367aba92105088cfb622570e620faff",
    "bdfab2fa4fdb4a9f72aa1032db95ed202db43342",
  ],
  carriedQaRepairAssertions:[
    "6f9411dac1ffeed47f5811e5758e8f0694e36bde",
    "2b4e7df2a302ac50170bbf65c75bb5494f9d1a86",
  ],
  rule:"Port only the conserved VTD-012 product remainder onto the repaired QA base; preserve integrated repair behavior and do not inherit stopped ancestry.",
}, "the adoption scorecard binds the repaired-base reconstruction and excluded repair ancestry");
