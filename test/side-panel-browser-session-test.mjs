import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createSidePanelTargetRegistry,
  resolveSidePanelTargets,
} from "./support/side-panel-browser-target-registry.mjs";
import {
  runInstalledSidePanelSession,
  runSidePanelBrowserSession,
} from "./support/side-panel-browser-session.mjs";
import {
  installedOrderPairs,
  normalizeInstalledObservation,
  runInstalledOrderRegression,
} from "./support/side-panel-browser-installed-order-regression.mjs";
import { sidePanelTargetContract } from "./support/side-panel-browser-target-contract.mjs";

const targetModulePaths = [
  "side-panel-capture-targets.mjs",
  "side-panel-event-library-targets.mjs",
  "side-panel-schema-workspace-targets.mjs",
  "side-panel-schema-guided-targets.mjs",
  "side-panel-schema-validation-targets.mjs",
  "side-panel-schema-documentation-targets.mjs",
  "side-panel-defect-targets.mjs",
  "side-panel-shell-targets.mjs",
];

assert.equal(sidePanelTargetContract.length, 63);
assert.equal(sidePanelTargetContract.reduce((count, target) => count + target.observationKeys.length, 0), 67);
assert.deepEqual(Object.fromEntries(["capture", "event-library", "schemas", "defects", "shell"]
  .map((pack) => [pack, sidePanelTargetContract.filter(({ owningPack }) => owningPack === pack).length])), {
  capture:5, "event-library":1, schemas:46, defects:9, shell:2,
});
assert.equal(sidePanelTargetContract.filter(({ module }) => module === "schema-workspace").length, 10);
assert.equal(sidePanelTargetContract.filter(({ module }) => module === "schema-guided").length, 17);
assert.equal(sidePanelTargetContract.filter(({ module }) => module === "schema-validation").length, 10);
assert.equal(sidePanelTargetContract.filter(({ module }) => module === "schema-documentation").length, 9);
assert.equal(Object.keys(installedOrderPairs).length, 4);
assert.deepEqual(sidePanelTargetContract.filter(({ owningPack }) => owningPack === "shell")
  .map(({ assertionLeaves }) => assertionLeaves.length), [9, 9]);
assert.equal(sidePanelTargetContract.every(({ assertionLeaves }) => assertionLeaves.length > 0), true,
  "every target must map its installed output to reachable assertion leaves");
assert.notDeepEqual(normalizeInstalledObservation({ stable:"before", count:1 }),
  normalizeInstalledObservation({ stable:"after", count:2 }),
  "installed order normalization must retain primitive values");
assert.deepEqual(Object.fromEntries(sidePanelTargetContract
  .filter(({ viewport }) => viewport.length > 1 || viewport[0] !== 720)
  .map(({ id, viewport }) => [id, viewport])), {
  SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER:[320],
  ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER:[320],
  ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER:[320],
  GUIDED_VALIDATION_BROWSER_ADAPTER:[320, 720],
  JSON_SCHEMA_EXPORT_BROWSER_ADAPTER:[320],
  LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER:[320],
  LOCAL_RULE_PROMOTION_BROWSER_ADAPTER:[320],
  SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER:[320],
  SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER:[320],
  SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER:[320],
  SCHEMA_PROPERTY_EXAMPLE_VALUES_BROWSER_ADAPTER:[320],
  SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER:[320],
  SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER:[320],
  SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER:[320],
  RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER:[320],
  SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER:[320],
  DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER:[320],
  DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER:[320],
  DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER:[320],
  EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER:[320],
  REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER:[360, 520],
  REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER:[320],
}, "all installed targets retain their exact canonical viewport sequences");
assert.equal(sidePanelTargetContract.every(({ viewport }) => Object.isFrozen(viewport)), true);

const hook = async () => {};
const definition = (id, overrides = {}) => ({
  id,
  owningPack:"capture",
  configuration:{ [`${id}_BROWSER_ADAPTER`]:"1" },
  observationKeys:[id.toLowerCase()],
  viewport:[720],
  setup:hook,
  observe:async ({ context }) => ({ [id.toLowerCase()]:context.configuration[`${id}_BROWSER_ADAPTER`] === "1" }),
  cleanup:hook,
  ...overrides,
});

assert.throws(
  () => createSidePanelTargetRegistry([definition("ONE"), definition("ONE")]),
  /duplicate logical target id.*ONE/iu,
);
assert.throws(
  () => createSidePanelTargetRegistry([
    definition("ONE"), definition("TWO", { observationKeys:["one"] }),
  ]),
  /duplicate observation-key ownership.*one.*ONE.*TWO|duplicate observation-key ownership.*one.*TWO.*ONE/iu,
);
for (const invalidHook of ["setup", "observe", "cleanup"]) {
  assert.throws(
    () => createSidePanelTargetRegistry([definition("ONE", { [invalidHook]:null })]),
    new RegExp(`ONE.*invalid ${invalidHook} hook`, "iu"),
  );
}

const imported = [];
const registry = createSidePanelTargetRegistry([
  definition("ONE"),
  definition("TWO", {
    owningPack:"schemas",
    configuration:{ TWO_BROWSER_ADAPTER:"1", FIXTURE:"two" },
  }),
]);
const loaders = {
  ONE:async () => { imported.push("capture"); return { definitions:[definition("ONE")] }; },
  TWO:async () => { imported.push("schemas"); return { definitions:[definition("TWO", {
    owningPack:"schemas",
    configuration:{ TWO_BROWSER_ADAPTER:"1", FIXTURE:"two" },
  })] }; },
};

await assert.rejects(
  resolveSidePanelTargets({ registry, owningPack:"capture", requests:[{ id:"UNKNOWN", configuration:{} }], loaders }),
  /unknown logical target id.*UNKNOWN/iu,
);
await assert.rejects(
  resolveSidePanelTargets({ registry, owningPack:"capture", requests:[{
    id:"TWO", configuration:{ TWO_BROWSER_ADAPTER:"1", FIXTURE:"two" },
  }], loaders }),
  /TWO.*expected owning pack.*schemas/iu,
);
await assert.rejects(
  resolveSidePanelTargets({ registry, owningPack:"schemas", requests:[{
    id:"TWO", configuration:{ TWO_BROWSER_ADAPTER:"1", EXTRA:"wrong" },
  }], loaders }),
  /TWO.*configuration.*missing.*FIXTURE.*extra.*EXTRA/iu,
);
const selected = await resolveSidePanelTargets({
  registry,
  owningPack:"capture",
  requests:[{ id:"ONE", configuration:{ ONE_BROWSER_ADAPTER:"1" } }],
  loaders,
});
assert.deepEqual(imported, ["capture"], "only the selected target module is initialized");
assert.ok(Object.isFrozen(selected[0].configuration));

const events = [];
const sessionDefinitions = [
  definition("ONE", {
    setup:async ({ context }) => {
      events.push("one:setup");
      context.cleanup.push(() => events.push("one:stack-cleanup"));
      context.listeners.add("listener");
      context.timers.add("timer");
    },
    observe:async () => { events.push("one:observe"); throw new Error("forced fixture failure"); },
    cleanup:async () => events.push("one:cleanup"),
  }),
  definition("TWO", {
    setup:async ({ context }) => {
      events.push(`two:fresh:${context.listeners.size}:${context.timers.size}:${context.observations.size}`);
    },
    observe:async () => { events.push("two:observe"); return { two:true }; },
    cleanup:async () => events.push("two:cleanup"),
  }),
];
const emitted = [];
let monotonicTime = 0;
await assert.rejects(
  runSidePanelBrowserSession({
    definitions:sessionDefinitions,
    resources:{
      start:async () => { events.push("process:start"); return { process:true }; },
      resetOrigins:async ({ targetId }) => events.push(`${targetId}:reset-origins`),
      openTarget:async ({ targetId }) => ({ page:`${targetId}:page`, socket:`${targetId}:socket` }),
      verifyPersistence:async ({ observation }) => structuredClone(observation),
      closeTarget:async ({ targetId }) => events.push(`${targetId}:close-target`),
      stop:async () => events.push("process:stop"),
    },
    emit:(record) => emitted.push(record),
    now:() => ++monotonicTime,
  }),
  /ONE.*forced fixture failure/iu,
);
assert.equal(events.filter((event) => event === "process:start").length, 1);
assert.equal(events.filter((event) => event === "process:stop").length, 1);
assert.ok(events.indexOf("one:cleanup") < events.indexOf("two:fresh:0:0:0"));
assert.ok(events.indexOf("one:stack-cleanup") < events.indexOf("two:fresh:0:0:0"));
assert.deepEqual(
  emitted.filter(({ swarmforgeBrowserTargetResult }) => swarmforgeBrowserTargetResult)
    .map(({ swarmforgeBrowserTargetResult:result }) => [result.id, result.status]),
  [["ONE", "failed"], ["TWO", "passed"]],
);
const passedResultIndex = emitted.findIndex(({ swarmforgeBrowserTargetResult:result }) =>
  result?.id === "TWO" && result.status === "passed");
assert.deepEqual(emitted[passedResultIndex - 1], { two:true },
  "a successful target observation must immediately precede its result marker for receipt parsing");
const failure = emitted.find(({ swarmforgeBrowserTargetResult:result }) => result?.status === "failed")
  .swarmforgeBrowserTargetResult;
assert.equal(failure.phase, "interaction");
assert.equal(typeof failure.durationMs, "number");
assert.ok(failure.finalState.length <= 600);
assert.match(failure.finalState, /"listeners":1/iu,
  "failure diagnostics must snapshot target listeners before cleanup clears them");
assert.match(failure.finalState, /"timers":1/iu,
  "failure diagnostics must snapshot target timers before cleanup clears them");
assert.ok(emitted.filter(({ swarmforgeBrowserTargetTiming }) => swarmforgeBrowserTargetTiming).length === 2);
for (const { swarmforgeBrowserTargetTiming:timing } of emitted.filter(({ swarmforgeBrowserTargetTiming }) =>
  swarmforgeBrowserTargetTiming)) {
  assert.deepEqual(timing.phases.map(({ name }) => name),
    ["setup", "navigation", "fixture", "interaction", "persistence", "assertion", "cleanup"]);
  if (timing.status === "passed") {
    assert.equal(timing.phases.every(({ durationMs }) => durationMs > 0), true,
      `${timing.id} must execute measurable work in every installed lifecycle phase: ${JSON.stringify(timing.phases)}`);
  }
  assert.equal(timing.phases.reduce((sum, { durationMs }) => sum + durationMs, 0), timing.durationMs);
}

const installedEvents = [];
const installedRecords = [];
let installedTime = 0;
await runInstalledSidePanelSession({
  definitions:[definition("ONE", {
    observe:async ({ context }) => context.executeFixture(),
  })],
  fixturePrograms:{ fixture:true },
  environment:{ ...process.env, VTD006_PARSED_ENVIRONMENT:"accepted" },
  emit:(record) => installedRecords.push(record),
  now:() => ++installedTime,
  startProcess:async () => {
    installedEvents.push("process:start");
    return { process:true };
  },
  stopProcess:async () => installedEvents.push("process:stop"),
  prepareTarget:async ({ context }) => {
    installedEvents.push(`${context.id}:navigation`);
    return { page:"page", socket:"socket" };
  },
  resetTarget:async ({ context }) => installedEvents.push(`${context.id}:setup`),
  executeTarget:async ({ definition:target, context }) => {
    assert.equal(context.environment.VTD006_PARSED_ENVIRONMENT, "accepted");
    assert.equal(Object.isFrozen(context.environment), true);
    installedEvents.push(`${context.id}:interaction`);
    return Object.fromEntries(target.observationKeys.map((key) => [key, true]));
  },
  verifyTargetPersistence:async ({ context, observation }) => {
    installedEvents.push(`${context.id}:persistence`);
    return structuredClone(observation);
  },
  closeTarget:async ({ context }) => installedEvents.push(`${context.id}:cleanup`),
});
assert.deepEqual(installedEvents, [
  "process:start", "ONE:setup", "ONE:navigation", "ONE:interaction", "ONE:persistence",
  "ONE:cleanup", "process:stop",
], "the installed runner must use the reusable per-target session lifecycle");
assert.equal(installedRecords.some(({ swarmforgeBrowserTargetResult:result }) =>
  result?.id === "ONE" && result.status === "passed"), true);

const fixtureSource = await readFile(new URL("./support/side-panel-browser-fixture-primitives.mjs", import.meta.url), "utf8");
const sessionSource = await readFile(new URL("./support/side-panel-browser-session.mjs", import.meta.url), "utf8");
const entrySource = await readFile(new URL("./support/side-panel-browser-entry.mjs", import.meta.url), "utf8");
const launcherSource = await readFile(new URL("./side-panel-component-layout-runtime-test.mjs", import.meta.url), "utf8");
const targetModuleSources = await Promise.all(targetModulePaths.map(async (modulePath) => [
  modulePath,
  await readFile(new URL(`./support/${modulePath}`, import.meta.url), "utf8"),
]));
for (const [modulePath, source] of targetModuleSources) {
  assert.ok(source.trim().split(/\r?\n/u).length > 20,
    `${modulePath} must own substantive executable fixture/check logic`);
  assert.match(source, /executeFixture/u,
    `${modulePath} must execute its selected installed fixture through its target hook`);
}
assert.ok(fixtureSource.trim().split(/\r?\n/u).length < 4000,
  "cross-domain fixture primitives must not retain the copied 7,823-line program");

const identityOrderRun = async (orderedTargets) => {
  const records = [];
  await runSidePanelBrowserSession({
    definitions:orderedTargets.map((target) => definition(target.id, {
      owningPack:target.owningPack,
      configuration:target.configuration,
      observationKeys:target.observationKeys,
      setup:async () => {},
      observe:async () => Object.fromEntries(target.observationKeys.map((key) => [key, target.id])),
      cleanup:async () => {},
    })),
    resources:{
      start:async () => ({}), resetOrigins:async () => {}, openTarget:async () => ({}),
      closeTarget:async () => {}, stop:async () => {},
    },
    emit:(record) => records.push(record),
  });
  return records.filter((record) => !record.swarmforgeBrowserTargetResult &&
      !record.swarmforgeBrowserTargetTiming)
    .flatMap((record) => Object.entries(record)).sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      `${leftValue}:${leftKey}`.localeCompare(`${rightValue}:${rightKey}`));
};
const canonicalIdentityResults = await identityOrderRun(sidePanelTargetContract);
const permutedIdentityResults = await identityOrderRun([...sidePanelTargetContract].reverse());
assert.equal(canonicalIdentityResults.length, 67);
assert.deepEqual(permutedIdentityResults, canonicalIdentityResults,
  "all 67 target outputs must retain normalized values in a compatible permutation");
const exactLeafFailureRecords = [];
await assert.rejects(runSidePanelBrowserSession({
  definitions:[definition("EXACT_LEAF", {
    observationKeys:["exactLeaf"],
    assertionLeaves:[["exactLeaf", "required", "value"]],
    observe:async () => ({ exactLeaf:{ renamed:{ value:true } } }),
  })],
  resources:{
    start:async () => ({}), resetOrigins:async () => {},
    openTarget:async () => ({ page:"page", socket:"socket" }),
    closeTarget:async () => {}, stop:async () => {},
  },
  emit:(record) => exactLeafFailureRecords.push(record),
}), /omitted assertion leaf exactLeaf\.required\.value/iu);
assert.equal(exactLeafFailureRecords.find(({ swarmforgeBrowserTargetResult }) =>
  swarmforgeBrowserTargetResult)?.swarmforgeBrowserTargetResult.phase, "assertion",
"a renamed conserved leaf must fail in the assertion phase");
const assertionLeafInventory = {
  targetCount:sidePanelTargetContract.length,
  mappedLeafCount:sidePanelTargetContract.reduce((count, target) => count + target.assertionLeaves.length, 0),
  everyTargetMapped:sidePanelTargetContract.every(({ assertionLeaves }) => assertionLeaves.length > 0),
  rootsReachable:sidePanelTargetContract.every(({ assertionLeaves, observationKeys }) =>
    assertionLeaves.every(([root]) => observationKeys.includes(root))),
  wildcardFree:sidePanelTargetContract.every(({ assertionLeaves }) =>
    assertionLeaves.every((leaf) => !leaf.includes("*"))),
  pathsUnique:sidePanelTargetContract.every(({ assertionLeaves }) =>
    new Set(assertionLeaves.map((leaf) => JSON.stringify(leaf))).size === assertionLeaves.length),
  renamedPathRejected:exactLeafFailureRecords.some(({ swarmforgeBrowserTargetResult:result }) =>
    result?.status === "failed" && result.phase === "assertion"),
  primitiveValuesRetained:JSON.stringify(normalizeInstalledObservation({ stable:"before", count:1 })) !==
    JSON.stringify(normalizeInstalledObservation({ stable:"after", count:2 })),
};
const packs = JSON.parse(await readFile(new URL("../verification/packs.json", import.meta.url), "utf8"));
const installedOrder = await runInstalledOrderRegression();
const packInventory = Object.fromEntries(["capture", "event-library", "schemas", "defects", "shell"]
  .map((owningPack) => {
    const targets = sidePanelTargetContract.filter((target) => target.owningPack === owningPack);
    return [owningPack, {
      targetCount:targets.length,
      outputCount:targets.reduce((count, target) => count + target.observationKeys.length, 0),
      program:new Set(targets.map(({ newProgram }) => newProgram)).values().next().value,
      processGroup:new Set(targets.map(({ processGroup }) => processGroup)).values().next().value,
    }];
  }));
const registeredPrograms = Object.fromEntries(Object.keys(packInventory).map((packId) => [packId,
  [...new Set(packs.find(({ id }) => id === packId).browserObservations
    .filter(({ id }) => sidePanelTargetContract.some((target) => target.id === id))
    .map(({ path }) => path))],
]));
console.log(JSON.stringify({ vtd006Acceptance:{
  contract:{ targetCount:sidePanelTargetContract.length,
    outputCount:sidePanelTargetContract.reduce((count, target) => count + target.observationKeys.length, 0),
    packInventory,
    moduleCounts:Object.fromEntries([...new Set(sidePanelTargetContract.map(({ module }) => module))]
      .map((module) => [module, sidePanelTargetContract.filter((target) => target.module === module).length])),
    shellLeaves:sidePanelTargetContract.filter(({ owningPack }) => owningPack === "shell")
      .map(({ assertionLeaves }) => assertionLeaves.length),
    targets:Object.fromEntries(sidePanelTargetContract.map((target) => [target.id, {
      owningPack:target.owningPack, module:target.module, program:target.newProgram,
      configuration:target.configuration, observationKeys:target.observationKeys,
    }])),
    registeredPrograms,
    helperConsumers:Object.fromEntries(packs.find(({ id }) => id === "shell").verificationHelpers
      .filter(({ path }) => path.includes("side-panel-"))
      .map(({ path, consumers }) => [path, consumers])),
  },
  selectiveLoading:{ imported:[...imported] },
  registryValidation:{ duplicateId:true, unknownId:true, configurationDifference:true,
    owningPack:true, duplicateOutput:true, hookShape:true, beforeResourcesStarted:true },
  isolation:{ resetCount:events.filter((event) => event.endsWith(":reset-origins")).length,
    cleanupBeforeContinuation:events.indexOf("one:cleanup") < events.indexOf("two:fresh:0:0:0"),
    freshSecondContext:events.includes("two:fresh:0:0:0"),
    processEnvironmentImmutable:!/(?:delete\s+process\.env|Object\.assign\(process\.env)/u.test(fixtureSource) },
  process:{ starts:events.filter((event) => event === "process:start").length,
    stops:events.filter((event) => event === "process:stop").length,
    results:emitted.filter(({ swarmforgeBrowserTargetResult }) => swarmforgeBrowserTargetResult).length },
  failure:{ phase:failure.phase, durationType:typeof failure.durationMs,
    bounded:failure.finalState.length <= 600, laterPassed:emitted.some(({ swarmforgeBrowserTargetResult:result }) =>
      result?.id === "TWO" && result.status === "passed") },
  installedOrder,
  identityOrder:{ outputCount:canonicalIdentityResults.length, exactValues:true },
  assertionLeafInventory,
  controls:{ installedLifecycle:true, completePhaseTiming:true,
    fixtureWorkStaged:fixtureSource.includes("runInstalledPhase(operationPhase") &&
      fixtureSource.includes("nextReloadPhase = \"fixture\""),
    persistenceWorkStaged:fixtureSource.includes("runInstalledPhase(reloadPhase"),
    assertionsDeferred:fixtureSource.includes("deferredAssertions.push") &&
      sessionSource.includes("for (const assertion of context.deferredAssertions) assertion()"),
    installedResourcesTracked:sessionSource.includes("this.context.listeners.add(record)") &&
      sessionSource.includes("this.context.timers.add(timer)"),
  },
  launcher:{ lineCount:launcherSource.trim().split(/\r?\n/u).length,
    delegates:launcherSource.includes("runInstalledSidePanelSession") },
} }));
console.log("side-panel browser session contract passed");
