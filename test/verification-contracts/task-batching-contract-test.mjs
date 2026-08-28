import assert from "node:assert/strict";
import path from "node:path";
import { selectedBrowserTargetConfigurations, summarizeBrowserTargetResults } from "../support/browser-target-session.mjs";
import { browserTargetConfigurations, completeBrowserObservationOutput, parseBrowserObservationBatchOutput, parseBrowserObservationOutput, validateBrowserObservationBatch } from "../../scripts/run-browser-observation.mjs";
import { planVerification, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { browserObservationEvidenceLeaves, browserObservationSessionBatch, validateBrowserPerformanceDeclarations, validateBrowserObservationBatches, validateBrowserEvidencePartitions } from "../../scripts/verification-registry/validation.mjs";

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

assert.throws(() => planVerification(synthetic, { packIds:["missing"] }), /Unknown verification pack/u);

assert.throws(() => planVerification(synthetic, { packIds:["empty"] }), /no runnable checks/u);

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



const taskFixturePack = { id:"boundary", source:["src/boundary/"], process:[], globalImpact:[],
  dependencies:[], sharedComponents:[], unit:["test/one.mjs", "test/two.mjs"], property:[],
  features:[], handlers:[], browserAdapters:[], browserAdapterModes:[], browserObservations:[],
  checkpointCommands:[] };

const taskFixturePlan = planVerification([taskFixturePack], { changedPaths:["src/boundary/value.ts"] });

assert.deepEqual(taskFixturePlan.tasks.map(({ key }) => key),
  ["build:dist", "unit:test/one.mjs", "unit:test/two.mjs"],
  "task planning preserves deterministic stage and manifest order");

assert.equal(new Set(taskFixturePlan.tasks.map(({ key }) => key)).size, taskFixturePlan.tasks.length,
  "task planning emits every execution identity once");
