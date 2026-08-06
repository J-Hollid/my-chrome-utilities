import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

import { acquireDistArtifactLock, withDistArtifactLock } from "../scripts/dist-artifact-lock.mjs";
import {
  selectedBrowserTargetConfigurations,
  summarizeBrowserTargetResults,
} from "./support/browser-target-session.mjs";
import { canonicalVerificationChangeSet } from "../scripts/verification-changes.mjs";
import {
  browserTargetConfigurations,
  completeBrowserObservationOutput,
  exactObservationEnvironment,
  parseBrowserObservationBatchOutput,
  parseBrowserObservationOutput,
  validateBrowserObservationBatch,
} from "../scripts/run-browser-observation.mjs";
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
} from "../scripts/report-verification-throughput.mjs";
import {
  archiveCanonicalReceiptCandidates,
  buildCanonicalTimingLedger,
  canonicalEnvironmentClassId,
  formatCanonicalTimingLedgerSummary,
  timingMaturity,
} from "../scripts/verification-timing-ledger.mjs";
import {
  checkpointPreflight,
  createVerificationCommandRunner,
  createVerificationReceiptContext,
  focusedAcceptanceOptions,
  resumeVerificationPlan,
  validateCurrentArtifactForConsumers,
  validateExplicitChangedPaths,
  verificationResumeIdentity,
} from "../scripts/run-focused-acceptance.mjs";
import {
  createPendingVerificationEvidence,
  recordPendingVerificationEvidence,
  validateVerificationEvidenceCompatibility,
  verificationEvidence,
  verificationDigest,
  verifyVerificationEvidence,
} from "../scripts/verification-evidence.mjs";
import {
  browserAdapterUsesSharedHarness,
  browserObservationEvidenceLeaves,
  browserObservationSessionBatch,
  executeAcceptancePlan,
  loadVerificationPacks,
  planVerification,
  staticallyResolvableModuleImports,
  validateBrowserPerformanceDeclarations,
  validateBrowserObservationBatches,
  validateBrowserEvidencePartitions,
  validateVerificationPacks,
  verificationInventory,
  verificationOwner,
  verificationTaskIdentity,
} from "../scripts/verification-packs.mjs";

const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});

const syntheticArtifact = (inputDigest, outputDigest, toolchain) => {
  const schemaVersion = 1;
  const buildIdentity = createHash("sha256").update(`${JSON.stringify({
    schemaVersion, inputDigest, outputDigest, toolchain,
  })}\n`).digest("hex");
  return { schemaVersion, buildIdentity, inputDigest, outputDigest, toolchain };
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
  "--pack", "schemas", "--changed-since", "base", "--property",
  "--prepare-evidence", "task-17", "--resume-receipt", "tmp/verification-receipts/prior.json",
]).resumeReceipt, "tmp/verification-receipts/prior.json");
assert.deepEqual(focusedAcceptanceOptions([
  "--pack", "schemas", "--browser-target", "ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER",
]).browserTargetIds, ["ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER"]);
for (const invalid of [
  ["--pack"],
  ["--pack", "schemas", "--pack", "schemas"],
  ["--pack", "Schemas"],
  ["--pack", "schemas", "--shard", "1/2"],
  ["--pack", "schemas", "--no-build"],
  ["--full", "--property"],
  ["--pack", "schemas", "--changed", "src/a.ts", "--changed-since", "base"],
  ["--pack", "schemas", "--record-evidence", "task"],
  ["--pack", "schemas", "--browser-target", "A", "--changed", "src/a.ts"],
  ["--pack", "schemas", "--changed-since", "base", "--prepare-evidence", "task"],
  ["--pack", "schemas", "--resume-receipt", "docs/prior.json"],
  ["--wat"],
]) assert.throws(() => focusedAcceptanceOptions(invalid));
await assert.rejects(() => validateExplicitChangedPaths(["test/definitely-deleted-verification-path.mjs"]),
  /Use --changed-since for deletes and renames/u);

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

const packs = await loadVerificationPacks();
await validateVerificationPacks(packs);
const adapterModes = new Map(packs.flatMap((pack) => (pack.browserAdapterModes ?? [])
  .map(({ path:adapterPath, mode }) => [adapterPath, mode])));
assert.equal([...adapterModes.values()].filter((mode) => mode === "shared-wrapper").length, 0);
assert.equal([...adapterModes.values()].filter((mode) => mode === "integration").length, 7);
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
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "shell", (pack) => ({
  verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
    "test/browser-packs/shared-harness.mjs"
    ? { ...helper, consumers:helper.consumers.filter((id) => id !== "schemas") }
    : helper),
}))), /Correct verification helper consumers.*shared-harness.*schemas/u,
"registry validation rejects an undeclared helper consumer with helper path and pack identity");
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "layered_schema", (pack) => ({
  impactBoundaries:pack.impactBoundaries.map((boundary) => boundary.id === "canonical_schema_editor"
    ? { ...boundary, prefixes:boundary.prefixes.filter((prefix) =>
      prefix !== "src/data-layer-string-rule-validation") }
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
];
assert.deepEqual(new Set(flowPack.browserObservations.map(({ id }) => id)), new Set(flowTargetIds),
  "the three Flow adapters are replaced by four exact logical targets");
assert.ok(flowPack.browserObservations.every(({ path:program, sessionBatch }) =>
  program === "test/browser-packs/flow-graph.mjs" && sessionBatch === "flow-graph"),
"every Flow target shares the installed Flow program and compatible session batch");
assert.deepEqual(flowPack.browserAdapters, ["test/browser-packs/flow-graph.mjs"],
  "no unpartitioned legacy or example adapter remains scheduled");
const exactFlowPlan = planVerification(packs, { packIds:["flow_graph"] });
assert.equal(exactFlowPlan.observationTasks.length, 1,
  "exact Flow verification uses one compatible installed-browser process");
assert.deepEqual(new Set(exactFlowPlan.observationTasks[0].logicalTargetIds), new Set(flowTargetIds),
  "the exact Flow process retains all four independent logical identities");
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
  new Set(["FLOW_WORKSPACE_AUTHORING_TARGET", "FLOW_WORKSPACE_CONTROLS_TARGET"]));
const semanticFlowPlan = planVerification(packs, {
  changedPaths:["src/flow-graph/relationships.ts"],
});
assert.ok(semanticFlowPlan.packIds.length > 1 && semanticFlowPlan.packIds.includes("flow_graph"),
  "semantic Flow changes retain declared dependant propagation");
assert.deepEqual(new Set(semanticFlowPlan.observationTasks
  .find(({ packId }) => packId === "flow_graph").logicalTargetIds), new Set(flowTargetIds));
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
  new URL("./side-panel-component-layout-runtime-test.mjs", import.meta.url),
  "utf8",
);
const shellBrowserBatch = packs.find(({ id }) => id === "shell");
const shellContainmentTargets = shellBrowserBatch.browserObservations
  .filter(({ id }) => ["SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER",
    "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER"].includes(id));
assert.equal(new Set(shellContainmentTargets.map(({ sessionBatch }) => sessionBatch)).size, 1,
  "compatible shell containment targets declare one reusable session batch");
assert.ok(shellContainmentTargets.every(({ sessionBatch }) => sessionBatch),
  "the real registry does not leave compatible containment targets unbatched");
assert.deepEqual(shellBrowserBatch.browserAdapterPerformance, [{
  path:"test/side-panel-component-layout-runtime-test.mjs",
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
  /process\.env\.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1" \? \[720\]/u,
  "the focused Schema view containment observation owns one explicit viewport");
assert.match(componentLayoutBrowserSource,
  /process\.env\.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1" \? \[720\]/u,
  "the focused Schema workspace observation owns its extended-workspace viewport");
const schemaViewStop = componentLayoutBrowserSource.indexOf(
  'if (process.env.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1") {\n      socket.close(); continue;\n    }',
);
const schemaWorkspaceStop = componentLayoutBrowserSource.indexOf(
  'if (process.env.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1") {',
);
const payloadPathPicker = componentLayoutBrowserSource.indexOf(
  "payloadPathFilterPickerObservation =",
);
assert.ok(schemaViewStop >= 0 && schemaViewStop < schemaWorkspaceStop && schemaViewStop < payloadPathPicker,
  "the focused Schema view containment observation stops before workspace and payload browser contracts");
assert.match(componentLayoutBrowserSource,
  /if \(process\.env\.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1"\) \{[\s\S]*?schemaWorkspaceAdapterObservations\.push\(schemaWorkspaceObservation\);[\s\S]*?console\.log\(JSON\.stringify\(\{ schemaWorkspace:schemaWorkspaceObservation \}\)\);\s*await evaluate\(socket, guidedTransportProjectRestoreRuntime\(previousActiveProjectId\)\);\s*socket\.close\(\);\s*continue;\s*\}\s*payloadPathFilterPickerObservation =/u,
  "the focused Schema workspace observation stops before unrelated browser contracts");
assert.match(componentLayoutBrowserSource,
  /await reloadPanel\(socket\);\s*if \(process\.env\.GUIDED_VALIDATION_BROWSER_ADAPTER === "1"\) \{\s*socket\.close\(\); continue;\s*\}\s*liveValidationVisualsObservation =/su,
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
    if (requiredOwner !== requiringOwner) {
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
  ["acceptance/src/acceptance/steps/all.clj",
    "acceptance/src/acceptance/steps/project_management.clj"],
]) assert.ok(crossPackStepRequires.some((edge) =>
  edge.requiringPath === requiringPath && edge.requiredPath === requiredPath),
  `${requiringPath} exposes its cross-pack requirement on ${requiredPath}`);
const requiredPathImpacts = new Map();
for (const edge of [...crossPackStepRequires, ...crossPackLiteralSourceReads]) {
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
  trackedPath !== "dist" && !trackedPath.startsWith("dist/")));
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
for (const edge of crossPackCodeEdges) {
  if (!requiredPathImpacts.has(edge.requiredPath)) {
    requiredPathImpacts.set(edge.requiredPath,
      planVerification(packs, { changedPaths:[edge.requiredPath] }).packIds);
  }
  if (!requiredPathImpacts.get(edge.requiredPath).includes(edge.requiringOwner)) {
    codeReachabilityGaps.push(edge);
  }
}
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
const canonicalEditorPlan = planVerification(packs, {
  changedPaths:["src/data-layer-canonical-schema-focused-sections.ts"],
});
assert.equal(canonicalEditorPlan.changedBoundaries["src/data-layer-canonical-schema-focused-sections.ts"],
  "canonical_schema_editor");
assert.deepEqual(canonicalEditorPlan.packIds, ["layered_schema"],
  "canonical schema editor changes exclude unrelated layered dependants");
assert.deepEqual(canonicalEditorPlan.observationTasks
  .filter(({ packId }) => packId === "layered_schema")
  .flatMap(({ logicalTargetIds }) => logicalTargetIds), [
  "LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET",
  "LAYERED_SCHEMA_EDITOR_POLICY_TARGET",
  "LAYERED_SCHEMA_EDITOR_RULES_TARGET",
  "LAYERED_SCHEMA_EDITOR_TARGET",
], "canonical schema editor changes schedule only their assertion-leaf partitions");
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
for (const [packId, logicalObservations] of [["capture", 5], ["schemas", 46], ["defects", 9]]) {
  const pack = packs.find(({ id }) => id === packId);
  const program = "test/side-panel-component-layout-runtime-test.mjs";
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
for (const editorPath of [
  "src/data-layer-canonical-schema-focused-editor.ts",
  "src/data-layer-string-rule-validation-ui.ts",
]) {
  const editorPlan = planVerification(packs, { changedPaths:[editorPath] });
  assert.equal(editorPlan.changedBoundaries[editorPath], "canonical_schema_editor");
  assert.deepEqual(editorPlan.packIds, ["layered_schema"],
    `${editorPath} remains inside the editor-only layered-schema boundary`);
}
const layeredSourceInventory = (await verificationInventory()).source
  .filter((sourcePath) => verificationOwner(packs, sourcePath) === "layered_schema");
assert.ok(layeredSourceInventory.length > 0);
for (const sourcePath of layeredSourceInventory) {
  assert.ok(planVerification(packs, { changedPaths:[sourcePath] }).changedBoundaries[sourcePath],
    `${sourcePath} has one declared layered-schema impact boundary`);
}
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
const refreshedBudgets = refreshVerificationPerformanceBudgets({
  rows:[
    { name:"alpha:exact-full-pack", projectedSeconds:8 },
    { name:"alpha:representative-change", dependantFanOut:2 },
  ],
  browserTargetIds:["MEASURED", "UNMEASURED"],
  model:{ browserTargets:{ MEASURED:{ p90Ms:900 } } },
}, {
  performanceBudgets:{
    exactPackSeconds:{}, browserTargetP90Milliseconds:{},
  },
  defaultBrowserTargetMilliseconds:2400,
}, { tolerance:1.25 });
assert.deepEqual(refreshedBudgets.performanceBudgets.exactPackSeconds.alpha, {
  limit:10, baseline:8, percentile:"p90-projection", tolerance:1.25, provisional:false,
});
assert.equal(refreshedBudgets.performanceBudgets.changedPathFanOut.alpha.limit, 3,
  "measured pack fan-out receives an explicit budget instead of a permissive catch-all");
assert.deepEqual(refreshedBudgets.performanceBudgets.browserTargetP90Milliseconds.MEASURED, {
  limit:1125, baseline:900, percentile:"p90", tolerance:1.25, provisional:false,
});
assert.equal(refreshedBudgets.performanceBudgets.browserTargetP90Milliseconds.UNMEASURED.provisional,
  true, "unmeasured browser targets retain an explicit provisional bootstrap budget");

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
const resumed = resumeVerificationPlan(resumablePlan, priorReceipt, resumeIdentity);
assert.deepEqual(resumed.tasks.map(({ key }) => key), resumableTasks.slice(1).map(({ key }) => key),
  "bounded resume runs only failed and incomplete tasks");
assert.equal(resumed.reusedTasks[resumableTasks[0].key].provenance, "reused");
assert.equal(resumed.preparationTasks.some(({ key }) => key === resumableTasks[0].key), false,
  "reused tasks are removed from their executable stage as well as the flat plan");
const rejectedResume = resumeVerificationPlan(resumablePlan, priorReceipt,
  { ...resumeIdentity, commit:"e".repeat(40) });
assert.deepEqual(rejectedResume.tasks.map(({ key }) => key), resumableTasks.map(({ key }) => key),
  "a mismatched resume identity reruns every checkpoint task");
for (const [field, value] of [
  ["artifactInputDigest", "e".repeat(64)],
  ["planDigest", "f".repeat(64)],
  ["toolchainDigest", "0".repeat(64)],
]) {
  const mismatch = resumeVerificationPlan(resumablePlan, priorReceipt,
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
const partialObservationResume = resumeVerificationPlan(
  partialObservationPlan, partialObservationReceipt, resumeIdentity,
);
assert.deepEqual(partialObservationResume.tasks[0].executionArgs,
  ["scripts/run-browser-observation.mjs", "BROWSER_SECOND"],
  "a failed browser batch reruns only its failed logical target");
assert.equal(partialObservationResume.tasks[0].priorReceiptTask,
  partialObservationReceipt.tasks[observationTask.key],
  "the resumed browser task retains the independent passing target result for the combined receipt");
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
    `import {writeSync} from "node:fs"; import {withDistArtifactLock} from ${JSON.stringify(lockModule)}; await withDistArtifactLock(()=>writeSync(1,"nested-lock-ok\\n"));`],
  { timeout:2_000 });
});

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
    const context = createVerificationReceiptContext(1, 2, { receiptDirectory:commandReceiptDirectory });
    const runner = createVerificationCommandRunner(context);
    const envTask = {
      key:"unit:environment", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(1,process.env.VERIFICATION_TEST_VALUE+'\\n')"], target:"environment",
      environment:{ VERIFICATION_TEST_VALUE:"visible" }, display:"environment task",
    };
    await runner(envTask.display, envTask);
    assert.equal(context.receipt.tasks[envTask.key].output.trim(), "visible");
    assert.equal(context.receipt.tasks[envTask.key].stderr, "");
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
      receiptDirectory:commandReceiptDirectory,
    });
    const stderrRunner = createVerificationCommandRunner(stderrContext);
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

    process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES = "32";
    const overflowContext = createVerificationReceiptContext(1, 2, { receiptDirectory:commandReceiptDirectory });
    const overflowRunner = createVerificationCommandRunner(overflowContext);
    const overflowTask = {
      key:"unit:stderr-overflow", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(2,'x'.repeat(64));setInterval(()=>{},1000)"],
      target:"overflow", environment:null, display:"stderr overflow task",
    };
    await assert.rejects(() => overflowRunner(overflowTask.display, overflowTask), /output exceeded 32 bytes/u);

    process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES = "4096";
    process.env.VERIFICATION_COMMAND_TIMEOUT_MS = "100";
    const timeoutContext = createVerificationReceiptContext(1, 2, { receiptDirectory:commandReceiptDirectory });
    const timeoutRunner = createVerificationCommandRunner(timeoutContext);
    const timeoutTask = {
      key:"unit:timeout-tree", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "const{spawn}=require('child_process'),{writeSync}=require('node:fs');const c=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});writeSync(1,String(c.pid)+'\\n');setInterval(()=>{},1000)"],
      target:"timeout", environment:null, display:"timeout tree task",
    };
    await assert.rejects(() => timeoutRunner(timeoutTask.display, timeoutTask), /timed out/u);
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
    const parentSource = [
      `import{acquireDistArtifactLock}from ${JSON.stringify(lockModule)};`,
      `import{createVerificationCommandRunner,createVerificationReceiptContext}from ${JSON.stringify(runnerModule)};`,
      `import{executeAcceptancePlan}from ${JSON.stringify(packsModule)};`,
      `const release=await acquireDistArtifactLock(${JSON.stringify(signalLock)});`,
      "try{",
      `const context=createVerificationReceiptContext(1,1,{receiptDirectory:${JSON.stringify(signalReceiptDirectory)}});`,
      "const runner=createVerificationCommandRunner(context);",
      `const task={key:'unit:signal-tree',stage:'unit',packId:'process',executable:process.execPath,args:['-e',${JSON.stringify(taskSource)}],target:'signal-tree',environment:null,display:'signal tree task'};`,
      `const post={key:'unit:post-signal',stage:'unit',packId:'process',executable:process.execPath,args:['-e',${JSON.stringify(`require('node:fs').writeFileSync(${JSON.stringify(postSignalLeaf)},'started\\n')`)}],target:'post-signal',environment:null,display:'post-signal task'};`,
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
  await writeFile(path.join(evidenceRepository, "candidate.txt"), "after\n");
  await exec("git", ["add", "candidate.txt"], { cwd:evidenceRepository });
  await exec("git", ["commit", "-qm", "candidate"], { cwd:evidenceRepository });

  const planFor = async(ids = ["alpha"], base = baseline) => {
    const requested = Array.isArray(ids) ? ids : [ids];
    const changeSet = await canonicalVerificationChangeSet({
      base, repositoryRoot:evidenceRepository,
    });
    return planVerification(evidencePacks, {
      packIds:requested, changedPaths:changeSet.paths, changeSet,
      basePacks:evidencePacks, includeProperties:true,
    });
  };
  const receiptFor = async(plan, name, receiptArtifact = artifact) => {
    const receiptPath = path.join(evidenceRepository, "tmp", "verification-receipts", `${name}.json`);
    await mkdir(path.dirname(receiptPath), { recursive:true });
    await writeFile(receiptPath, JSON.stringify({
      version:2,
      runId:name,
      completedAt:new Date().toISOString(),
      artifact:receiptArtifact,
      plan:{
        mode:plan.mode,
        requestedPackIds:[...plan.requestedPackIds].sort(),
        selectedPackIds:[...plan.selectedPackIds].sort(),
        changedOwners:plan.changedOwners,
        changedBoundaries:plan.changedBoundaries,
        changeSetDigest:plan.changeSet ? verificationDigest(plan.changeSet) : null,
        conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason,
      },
      environment:{
        node:lockedRuntime.node, typescript:lockedRuntime.typescript,
        platform:`${process.platform}-${process.arch}`, executionLoad:"normal",
        concurrency:1, observationConcurrency:1,
      },
      tasks:Object.fromEntries(plan.tasks.map((task) => [task.key, {
        identity:verificationTaskIdentity(task), status:"passed", durationMs:1, output:"ok\n",
      }])),
    }));
    return receiptPath;
  };
  const evidenceIdFor = (record) => verificationDigest({
    task:record.task, commit:record.commit, tree:record.tree, baseCommit:record.baseCommit,
    packIds:record.packIds, planDigest:record.planDigest, identities:record.identities,
    receiptSha256:record.receipt.sha256,
  });
  const alphaPlan = await planFor("alpha");
  assert.ok(alphaPlan.propertyTasks.length > 0, "durable exact-pack fixtures include property leaves");
  const alphaReceipt = await receiptFor(alphaPlan, "alpha-receipt");
  const preflightReceipt = path.join(evidenceRepository, "tmp", "verification-receipts", "preflight.json");
  await writeFile(preflightReceipt, JSON.stringify({
    version:2,
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
  const pendingAlpha = await createPendingVerificationEvidence({
    task:"multi-pack-task", plan:alphaPlan, receiptPath:alphaReceipt,
    changedSince:baseline, buildManifest:artifact, repositoryRoot:evidenceRepository,
    toolchainValidator:skipToolchainValidation,
  });
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
  const emptyPlan = await planFor("alpha", "HEAD");
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
  assert.equal((await verifyVerificationEvidence(
    "HEAD", baseline, "multi-pack-task", "alpha", { repositoryRoot:evidenceRepository },
  )).status, "passed");
  await assert.rejects(() => verifyVerificationEvidence(
    "HEAD", baseline, "wrong-task", "alpha", { repositoryRoot:evidenceRepository },
  ), /does not exactly cover/u);
  await assert.rejects(() => verifyVerificationEvidence(
    "HEAD", "HEAD", "multi-pack-task", "alpha", { repositoryRoot:evidenceRepository },
  ), /does not exactly cover/u, "handoff evidence is bound to its received base");

  const genuineNote = await verificationEvidence("HEAD", { repositoryRoot:evidenceRepository });
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
  await writeFile(path.join(handoffRepository, ".swarmforge", "roles.tsv"),
    "specifier\tspecifier\nrefactorer\trefactorer\ncoder\tcoder\n");
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
  const queuedHandoffNames = (await readdir(
    path.join(handoffRepository, ".swarmforge", "handoffs", "outbox"),
  )).filter((name) => name.endsWith(".handoff"));
  assert.equal(queuedHandoffNames.length, 1, "one Git handoff is queued");
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

console.log("verification process contract tests passed");
