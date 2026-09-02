import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { compareTimingEnvironmentClasses, flowExamplesCharacterization, measuredTimingModel } from "../../scripts/report-verification-throughput.mjs";
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
const terminalPlan = planVerification(packs, { terminalFull:true });
const vtd005EditorTargetIds = ["LAYERED_SCHEMA_EDITOR_TARGET", "LAYERED_SCHEMA_EDITOR_RULES_TARGET",
  "LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET", "LAYERED_SCHEMA_EDITOR_POLICY_TARGET"];
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
const receiptLossDisposition = {
  version:1,
  digest:"f".repeat(64),
  environmentClassId:"e".repeat(64),
  completedAt:"2026-08-07T19:48:51.141Z",
};
const lossDispositionLedger = await buildCanonicalTimingLedger({
  sources:canonicalSources,
  expectedRuntime:reportRuntime,
  receiptLossDispositions:[receiptLossDisposition],
});
assert.deepEqual(lossDispositionLedger.receiptLossDispositions, [receiptLossDisposition],
  "the timing ledger retains one immutable compact identity for a lost raw receipt");
await assert.rejects(() => buildCanonicalTimingLedger({
  sources:canonicalSources,
  expectedRuntime:reportRuntime,
  receiptLossDispositions:[{ ...receiptLossDisposition, digest:normalDigest }],
}), /lost timing receipt .* is present/u,
"a loss disposition cannot conceal available raw timing evidence");
await assert.rejects(() => buildCanonicalTimingLedger({
  sources:canonicalSources,
  expectedRuntime:reportRuntime,
  receiptLossDispositions:[{ ...receiptLossDisposition, unexpected:true }],
}), /invalid timing receipt loss disposition/u,
"a receipt loss disposition rejects added or malformed identity fields");
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
const lockedRuntime = { node:process.versions.node, typescript:"5.9.3" };
const artifact = syntheticArtifact("b".repeat(64), "c".repeat(64), lockedRuntime);
