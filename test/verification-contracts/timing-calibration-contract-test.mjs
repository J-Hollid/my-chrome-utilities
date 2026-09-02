import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { flowExamplesCharacterization, refreshVerificationPerformanceBudgets, reportVerificationThroughput, validateVerificationPerformanceCalibrationSnapshot, verificationPerformanceCalibration } from "../../scripts/report-verification-throughput.mjs";
import { buildCanonicalTimingLedger, canonicalEnvironmentClassId, timingMaturity } from "../../scripts/verification-timing-ledger.mjs";
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
const forgedIdentityReceipt = structuredClone(reportReceipt);
const oldVersionReceipt = structuredClone(reportReceipt);
const incompleteTaskReceipt = structuredClone(reportReceipt);
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
const committedFlowCharacterization = JSON.parse(await readFile(
  new URL("../../verification/flow-examples-characterization.json", import.meta.url), "utf8",
));
const throughput = reportVerificationThroughput({
  packs, baseline:reportBaseline,
  receipts:[reportReceipt, contaminatedReceipt, forgedIdentityReceipt, oldVersionReceipt,
    incompleteTaskReceipt], shardCount:4,
});
const runnablePackCount = planVerification(packs, { terminalFull:true }).packIds.length;
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
  receiptLossDispositions:committedReceiptIndex.receiptLossDispositions ?? [],
});
const liveSelectedDigests = liveCalibrationLedger.receipts
  .filter(({ environmentClassId, rejectionReason }) =>
    rejectionReason === null && environmentClassId === committedCalibrationReport.environmentClassId)
  .map(({ digest }) => digest)
  .sort();
assert.ok(liveSelectedDigests.length > committedCalibrationReport.receiptDigests.length,
  "the canonical ledger keeps later same-class receipts discoverable");
const lostPostCutoffReceipt = {
  version:1,
  digest:"1133dc7d9344e823e4e0efee51daa030e737d9d8db18914d20590a480123f245",
  environmentClassId:committedCalibrationReport.environmentClassId,
  completedAt:"2026-08-07T19:48:51.141Z",
};
assert.deepEqual(liveCalibrationLedger.receiptLossDispositions,
  [lostPostCutoffReceipt],
  "the receipt named by the immutable-snapshot specification remains discoverable");
assert.equal(liveSelectedDigests.includes(lostPostCutoffReceipt.digest), false,
  "a lost raw receipt is not accepted as timing evidence");
const committedCalibrationBeforeValidation = JSON.stringify(committedCalibrationReport);
const committedSnapshot = validateVerificationPerformanceCalibrationSnapshot(
  committedCalibrationReport, liveCalibrationLedger,
);
assert.equal(JSON.stringify(committedCalibrationReport), committedCalibrationBeforeValidation,
  "snapshot validation cannot rewrite accepted budgets or provenance");
assert.deepEqual(committedSnapshot.receiptDigests,
  [...committedCalibrationReport.receiptDigests].sort(),
  "the immutable calibration resolves its raw and compact retired receipt digests");
assert.deepEqual(committedSnapshot.retiredReceiptDigests,
  ["7ec18d4652e12c04c5a3df91afc8243c6a88d4ab9ab16c2b4def2d1a2c8ac255"],
  "the removed raw receipt keeps one exact compact calibration identity");
assert.throws(() => validateVerificationPerformanceCalibrationSnapshot({
  ...committedCalibrationReport, retiredReceipts:[],
}, liveCalibrationLedger), /receipt .* is missing/u,
"a missing raw calibration receipt needs an exact compact identity");
assert.throws(() => validateVerificationPerformanceCalibrationSnapshot({
  ...committedCalibrationReport,
  retiredReceipts:committedCalibrationReport.retiredReceipts.map((entry) => ({
    ...entry, environmentClassId:"0".repeat(64),
  })),
}, liveCalibrationLedger), /identity drift/u,
"a compact retired receipt cannot change its environment class");
assert.ok(committedSnapshot.postCutoffReceiptDigests.length > 0,
  "eligible receipts completed after the snapshot cutoff remain ordinary ledger evidence");
assert.equal(committedSnapshot.postCutoffReceiptDigests.includes(
  lostPostCutoffReceipt.digest), false,
"a lost post-cutoff receipt cannot enter an immutable or future calibration snapshot");
const liveSelectedEntries = liveCalibrationLedger.receipts.filter(({ digest }) =>
  liveSelectedDigests.includes(digest));
const futureReceiptCutoff = new Date(Math.max(...liveSelectedEntries
  .map(({ receipt }) => Date.parse(receipt.completedAt)))).toISOString();
const refreshedReceiptDigests = [...new Set([...liveSelectedDigests,
  ...committedCalibrationReport.retiredReceipts.map(({ digest }) => digest)])].sort();
const refreshedSnapshot = {
  ...committedCalibrationReport,
  receiptCutoff:futureReceiptCutoff,
  receiptDigests:refreshedReceiptDigests,
};
assert.equal(validateVerificationPerformanceCalibrationSnapshot(
  refreshedSnapshot, liveCalibrationLedger,
).receiptDigests.length, refreshedReceiptDigests.length,
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
  "LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER",
  "REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
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
  .find(({metric, identity}) => metric === "browser-target-p90" && identity === id)?.passed),
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
const lockedRuntime = { node:process.versions.node, typescript:"5.9.3" };
const artifact = syntheticArtifact("b".repeat(64), "c".repeat(64), lockedRuntime);
