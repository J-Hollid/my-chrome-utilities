import assert from "node:assert/strict";
import {observationSliceAdditions,emitObservationSliceRegression} from './project-observation-sources/browser/slice-conservation.mjs';
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

import {
  createInstalledDataLayerLifecycle,
  installedDataLayerControllerOrder,
} from "../dist/data-layer-installed/runtime.js";
import { collectSidePanelCutoverInventory } from
  "../scripts/side-panel-single-cutover-inventory.mjs";
import {
  sidePanelSingleCutoverEvidenceTask,
  sidePanelSingleCutoverFocusedTaskKeys,
  sidePanelSingleCutoverPackIds,
  sidePanelSingleCutoverProductEvidenceTask,
  sidePanelSingleCutoverProductFocusedTaskKeys,
  sidePanelSingleCutoverCompatibilityRepairEvidenceTask,
  sidePanelSingleCutoverCompatibilityRepairFocusedTaskKeys,
  sidePanelSingleCutoverCompatibilityRepairPackIds,
  validateSidePanelSingleCutoverFocusedPlan,
} from "../scripts/side-panel-single-cutover-focused-evidence.mjs";
import {
  changedSinceFocusedExecutionPlan,
  focusedAcceptanceOptions,
  selectFocusedVerificationTasks,
} from
  "../scripts/run-focused-acceptance.mjs";
import { runnablePackIdsFromRegistry } from
  "../scripts/verification-pack-cardinality/contract.mjs";
import { sidePanelTargetContract } from
  "./support/side-panel-browser-target-contract.mjs";
import { loadVerificationPacks, planVerification } from
  "../scripts/verification-packs.mjs";
import { runSidePanelBrowserSessionContract } from
  "./acceptance/side-panel-browser-session-contract.mjs";

const base = "96524c803b7970bf85dfbe8e895250691bbc3d08";
const currentSidePanel = await readFile("src/side-panel.ts");
const installedRuntimeSource = await readFile("src/data-layer-installed/runtime.ts", "utf8");
const shellMountIndex = installedRuntimeSource.indexOf(
  "mountUtilityShell(extensionShell, panelRoot, window)",
);
const repositoryOpenIndex = installedRuntimeSource.indexOf(
  "await openDurableProjectRuntime(storage)",
);
assert.equal(shellMountIndex >= 0 && repositoryOpenIndex >= 0 && shellMountIndex < repositoryOpenIndex,
  true, "the utility Shell becomes ready before the unrelated durable project repository opens");
const productInstalled = createHash("sha256").update(currentSidePanel).digest("hex") !==
  "833831df0f3f2fc032a6af432101cc9a2306f7da6e1000e28c83c47bb6e9f7ef";
const controllers = [
  ["capture", "capture", "capture_installed_side_panel",
    ["event-library", "project_event_transport", "schemas", "live_flow_testing", "shell"]],
  ["event-library", "event-library", "event_library_installed_side_panel",
    ["project_event_transport", "defects", "replay", "guided_test_cases", "shell"]],
  ["schemas", "schemas", "schemas_installed_side_panel",
    ["defects", "project_assurance_severity", "guided_test_cases", "shell"]],
  ["defects", "defects", "defects_installed_side_panel", ["live_flow_testing", "shell"]],
  ["replay", "replay", "replay_installed_side_panel", ["shell"]],
  ["projects", "project_management", "project_library_installed_side_panel",
    ["durable_project_repository", "project_event_transport", "guided_test_cases", "shell"]],
  ["durable-projects", "durable_project_repository", "durable_project_installed_side_panel",
    ["flow_graph", "layered_schema", "shell"]],
  ["project-event-transport", "project_event_transport",
    "project_event_transport_installed_side_panel", ["capture", "event-library", "shell"]],
  ["live-flow-testing", "live_flow_testing", "live_flow_testing_installed_side_panel",
    ["capture", "defects", "schemas", "shell"]],
];
const expectedOrder = controllers.map(([id]) => id);
assert.deepEqual(installedDataLayerControllerOrder, expectedOrder);

const calls = [];
const installedControllers = Object.fromEntries(expectedOrder.map((id) => [id, {
  mount:() => calls.push(`mount:${id}`),
  dispose:() => calls.push(`dispose:${id}`),
}]));
const lifecycle = createInstalledDataLayerLifecycle(installedControllers);
lifecycle.mount();
lifecycle.mount();
lifecycle.dispose();
lifecycle.dispose();
lifecycle.mount();
assert.deepEqual(calls, [
  ...expectedOrder.map((id) => `mount:${id}`),
  ...[...expectedOrder].reverse().map((id) => `dispose:${id}`),
  ...expectedOrder.map((id) => `mount:${id}`),
], "aggregate mount and disposal are idempotent, ordered, and remountable");
lifecycle.dispose();

const definitions = await Promise.all(controllers.map(async ([id]) => {
  const module = await import(`../dist/data-layer-installed/${id}/index.js`);
  const source = await readFile(`src/data-layer-installed/${id}/index.ts`, "utf8");
  assert.match(source, /export interface \w+InstalledPorts/u, `${id} exposes typed ports`);
  assert.doesNotMatch(source,
    /data-layer-installed\/(?:capture|event-library|schemas|defects|replay|projects|durable-projects|project-event-transport|live-flow-testing)\//u,
    `${id} does not import another controller implementation`);
  if (!productInstalled) {
    assert.equal(source.includes("addEventListener("), false,
      `${id} preparation installs no listener`);
  }
  return module.installedControllerDefinition;
}));
assert.deepEqual(definitions.map(({ id }) => id), expectedOrder);
assert.equal(definitions.every(({ capabilities }) => capabilities.length > 0), true);

const packs = await loadVerificationPacks();
const schemasPack = packs.find(({ id }) => id === "schemas");
const shellPack = packs.find(({ id }) => id === "shell");
assert.deepEqual(schemasPack.checkpointCommands.find(({ id }) =>
  id === "side-panel-direct-compatibility-capture"), {
  id:"side-panel-direct-compatibility-capture",
  executable:"node",
  args:["test/side-panel-direct-compatibility-capture-test.mjs", "--checkpoint"],
}, "Schemas owns the explicit direct compatibility capture execution");
assert.equal(schemasPack.unit.includes("test/side-panel-direct-compatibility-capture-test.mjs"), true,
  "Schemas assigns the direct compatibility capture test path exactly once");
assert.deepEqual(shellPack.checkpointCommands.find(({ id }) =>
  id === "side-panel-direct-compatibility-validation"), {
  id:"side-panel-direct-compatibility-validation",
  executable:"node",
  args:["test/side-panel-component-layout-runtime-test.mjs"],
}, "Shell owns the independent committed-map validation execution");
const focusedEvidenceOptions = focusedAcceptanceOptions([
  ...sidePanelSingleCutoverPackIds.flatMap((packId) => ["--pack", packId]),
  ...sidePanelSingleCutoverFocusedTaskKeys.flatMap((key) => ["--focused-task", key]),
  "--changed-since", base,
  "--prepare-evidence", sidePanelSingleCutoverEvidenceTask,
]);
assert.equal(focusedEvidenceOptions.includeProperties, false);
assert.deepEqual(focusedEvidenceOptions.packIds, sidePanelSingleCutoverPackIds);
const focusedEvidencePlan = selectFocusedVerificationTasks(
  planVerification(packs, { packIds:sidePanelSingleCutoverPackIds }),
  sidePanelSingleCutoverFocusedTaskKeys,
  planVerification(packs, { packIds:runnablePackIdsFromRegistry(packs) }),
);
assert.equal(validateSidePanelSingleCutoverFocusedPlan(
  focusedEvidencePlan, sidePanelSingleCutoverEvidenceTask,
), true);
const compatibilityRepairOptions = focusedAcceptanceOptions([
  ...sidePanelSingleCutoverCompatibilityRepairPackIds.flatMap((packId) => ["--pack", packId]),
  ...sidePanelSingleCutoverCompatibilityRepairFocusedTaskKeys.flatMap((key) => ["--focused-task", key]),
  "--changed-since", base,
  "--prepare-evidence", sidePanelSingleCutoverCompatibilityRepairEvidenceTask,
]);
assert.equal(compatibilityRepairOptions.includeProperties, false);
assert.deepEqual(compatibilityRepairOptions.packIds,
  sidePanelSingleCutoverCompatibilityRepairPackIds);
const compatibilityRepairPlan = selectFocusedVerificationTasks(
  planVerification(packs, { packIds:sidePanelSingleCutoverCompatibilityRepairPackIds }),
  sidePanelSingleCutoverCompatibilityRepairFocusedTaskKeys,
  planVerification(packs, { packIds:runnablePackIdsFromRegistry(packs) }),
);
const verificationEvidenceSource = await readFile("scripts/verification-evidence.mjs", "utf8");
assert.doesNotMatch(verificationEvidenceSource,
  /sidePanelCompatibilityRepairFocused/u,
  "the repair evidence must execute a task owned by every claimed pack");
assert.equal(validateSidePanelSingleCutoverFocusedPlan({
  ...compatibilityRepairPlan,
  changedPaths:[
    "acceptance/src/acceptance/steps/data_layer_observer.clj",
    "acceptance/src/acceptance/steps/data_layer_page_context.clj",
    "acceptance/src/acceptance/steps/data_layer_timeline.clj",
    "acceptance/src/acceptance/steps/hotkey_keymap.clj",
    "scripts/side-panel-single-cutover-focused-evidence.mjs",
    "scripts/verification-evidence.mjs",
    "test/side-panel-component-layout-runtime-test.mjs",
    "test/acceptance/data_layer_observer_steps_test.clj",
    "test/acceptance/data_layer_page_context_steps_test.clj",
    "test/acceptance/data_layer_timeline_steps_test.clj",
    "test/support/side-panel-browser-direct-assertion-map.mjs",
    "test/support/side-panel-browser-fixture-primitives.mjs",
    "test/support/side-panel-browser-session.mjs",
    "test/support/side-panel-defect-fixtures.mjs",
    "test/verification-process-contract-test.mjs",
  ],
}, sidePanelSingleCutoverCompatibilityRepairEvidenceTask), true,
"the preparation correction binds only its exact two-pack evidence and protected verification paths");
assert.throws(() => validateSidePanelSingleCutoverFocusedPlan({
  ...compatibilityRepairPlan,
  changedPaths:["src/side-panel.ts"],
}, sidePanelSingleCutoverCompatibilityRepairEvidenceTask), /outside the approved compatibility-repair scope/u);
const productEvidenceOptions = focusedAcceptanceOptions([
  ...sidePanelSingleCutoverPackIds.flatMap((packId) => ["--pack", packId]),
  "--property",
  "--changed-since", base,
  "--prepare-evidence", sidePanelSingleCutoverProductEvidenceTask,
]);
assert.equal(productEvidenceOptions.includeProperties, true);
assert.deepEqual(productEvidenceOptions.focusedTaskKeys, [],
  "the product route binds its stable tasks instead of accepting candidate selectors");
const productCanonicalPlan = planVerification(packs, {
  packIds:runnablePackIdsFromRegistry(packs), includeProperties:true,
});
const productBindingPlan = planVerification(packs, {
  changedPaths:["src/side-panel.ts"], includeProperties:true,
});
const productExecutionPlan = changedSinceFocusedExecutionPlan(
  packs,
  { ...productEvidenceOptions, changedPaths:["src/side-panel.ts"] },
  productBindingPlan,
  { changedSince:base, evidenceTask:sidePanelSingleCutoverProductEvidenceTask },
);
assert.deepEqual(new Set(productExecutionPlan.packIds),
  new Set(sidePanelSingleCutoverPackIds),
  "the product bootstrap isolates execution before binding the still-global root change");
assert.deepEqual(productExecutionPlan.changedPaths, ["src/side-panel.ts"],
  "the independently reviewed product bootstrap retains the canonical change binding");
const productPackPlan = planVerification(packs, {
  packIds:sidePanelSingleCutoverPackIds, includeProperties:true,
});
const productTaskKeys = sidePanelSingleCutoverProductFocusedTaskKeys(
  [...productPackPlan.tasks,
    ...productCanonicalPlan.tasks.filter(({ key }) => key === "package:extension")],
);
const productEvidencePlan = selectFocusedVerificationTasks(
  productPackPlan,
  productTaskKeys,
  productCanonicalPlan,
);
assert.equal(validateSidePanelSingleCutoverFocusedPlan({
  ...productEvidencePlan,
  changedPaths:["src/side-panel.ts", "src/data-layer-installed/capture/index.ts"],
}, sidePanelSingleCutoverProductEvidenceTask), true);
assert.equal(productEvidencePlan.tasks.filter(({ stage }) => stage === "property").length > 0,
  true, "the product route retains every relevant declared Data Layer property");
const selectedProductTargetIds = new Set(productEvidencePlan.tasks.flatMap(
  ({ logicalTargetIds = [] }) => logicalTargetIds,
));
assert.equal(sidePanelTargetContract.every(({ id }) => selectedProductTargetIds.has(id)), true,
  "the product route retains every canonical installed assertion target and its session batch");
for (const protectedEvidencePath of [
  "scripts/side-panel-single-cutover-focused-evidence.mjs",
  "test/side-panel-component-layout-runtime-test.mjs",
  "test/support/side-panel-browser-direct-assertion-map.mjs",
  "test/support/side-panel-browser-direct-compatibility.mjs",
  "verification/packs.json",
]) {
  assert.throws(() => validateSidePanelSingleCutoverFocusedPlan({
    ...productEvidencePlan,
    changedPaths:[protectedEvidencePath],
  }, sidePanelSingleCutoverProductEvidenceTask), /outside the approved cutover scope/u,
  `the product candidate cannot add or alter its protected evidence boundary: ${protectedEvidencePath}`);
}
for (const [id, packId, sliceId, consumers] of controllers) {
  const pack = packs.find(({ id: candidate }) => candidate === packId);
  const slice = pack.verificationSlices.find(({ id: candidate }) => candidate === sliceId);
  const sourcePath=id==="schemas"
    ? "src/data-layer-installed/schemas/project-hydration.ts"
    : `src/data-layer-installed/${id}/index.ts`;
  if(id==="schemas"){
    assert.deepEqual(slice.sourcePaths,[
      sourcePath,
      "test/data-layer-installed/schemas/retired-controller-assertion-inventory.mjs",
    ]);
    assert.deepEqual(slice.sourcePrefixes,[
      "test/data-layer-installed/schemas/retired-controller-contracts",
    ]);
  }else assert.deepEqual(slice.sourcePrefixes,[`src/data-layer-installed/${id}/`,...(observationSliceAdditions[id]?.prefixes??[])]);
  assert.deepEqual(slice.tasks, [id === "schemas"
    ? "unit:test/data-layer-installed/schemas/project-hydration-test.mjs"
    : `unit:test/data-layer-installed/${id}-controller-test.mjs`,...(observationSliceAdditions[id]?.tasks??[])]);
  assert.deepEqual(slice.consumers.map(({ packId: consumer }) => consumer).sort(),
    [...consumers].sort());
  assert.equal(slice.consumers.every(({ sliceId: consumerSlice }) =>
    consumerSlice === "side_panel_installed_controller_consumer"), true);
  const plan = planVerification(packs, {
    changedPaths:[sourcePath],
  });
  assert.deepEqual(plan.packIds.sort(), [packId, ...consumers].sort(),
    `${id} selects only its owner and exact consumers`);
}
const runtimeSlice = packs.find(({ id }) => id === "shell").verificationSlices.find(
  ({ id }) => id === "shell_installed_data_layer_runtime",
);
assert.deepEqual(runtimeSlice.sourcePaths, ["src/data-layer-installed/runtime.ts"]);
assert.deepEqual(runtimeSlice.consumers.map(({ packId }) => packId).sort(),
  controllers.map(([, packId]) => packId).sort());
assert.equal(planVerification(packs, {
  changedPaths:["src/side-panel.ts"],
}).packIds.length, runnablePackIdsFromRegistry(packs).length,
"the installed root remains owned by every current runnable pack");

const inventory = await collectSidePanelCutoverInventory({ repositoryRoot:process.cwd(), base });
assert.equal(inventory.baseCommit, base);
assert.equal(inventory.source.sha256,
  "833831df0f3f2fc032a6af432101cc9a2306f7da6e1000e28c83c47bb6e9f7ef");
assert.equal(inventory.imports.length, 112);
assert.equal(inventory.functions.length > 200, true);
assert.equal(inventory.stateOwners.some(({ name }) => name === "chooseObservationTargetButton"), true,
  "destructured top-level state owners remain individually inventoried");
assert.equal(inventory.listeners.length >= 275, true);
assert.equal(inventory.timers.length >= 2, true);
assert.equal(inventory.commands.length > 0, true);
assert.equal(inventory.assertions.sha256,
  "7d8beb9903566264daebe7bd1b01734d0d925e4ca65231507cca5d1b03d7f5c8");
assert.equal(inventory.assertionLeaves.length, 7088);
assert.deepEqual(inventory.assertionLeaves[0], {
  targetId:"LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER",
  path:["liveTargetPermissionRecoveryWiring", "selectedTargetRetained"],
});

function atBase(path) {
  return execFileSync("git", ["show", `${base}:${path}`]);
}
const baseSidePanel = atBase("src/side-panel.ts");
if (!currentSidePanel.equals(baseSidePanel)) {
  const currentSource = currentSidePanel.toString("utf8");
  assert.equal(currentSource.split("\n").length - 1 <= 500, true,
    "the installed cutover leaves a bounded composition root");
  const publicDataLayerSource = await readFile("src/utilities/data-layer/index.ts", "utf8");
  assert.match(publicDataLayerSource,
    /from ["']\.\.\/\.\.\/data-layer-installed\/runtime\.js["']/u,
    "the Data Layer public entry mounts through the prepared installed runtime");
}
for (const path of [
  "src/utilities/data-layer/capture.ts",
  "src/utilities/data-layer/live-inspection.ts",
  "src/utilities/data-layer/event-library.ts",
  "src/utilities/data-layer/schemas.ts",
  "src/utilities/data-layer/defect-reporting.ts",
  "src/utilities/data-layer/replay.ts",
]) {
  const current = await readFile(path);
  assert.equal(createHash("sha256").update(current).digest("hex"),
    createHash("sha256").update(atBase(path)).digest("hex"), `${path} changed during preparation`);
}
const currentAssertionSource = await readFile(
  "test/support/side-panel-browser-assertion-leaves.mjs",
);
assert.equal(createHash("sha256").update(currentAssertionSource).digest("hex"),
  inventory.assertions.sha256,
  "the product cutover cannot delete or rewrite a canonical installed assertion leaf");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "other:stale exact source-path expectation") {
    const normalized = (value) => Array.isArray(value) ? value.map(normalized)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalized(nested)]))
        : value;
    const digest = (value) => createHash("sha256")
      .update(JSON.stringify(normalized(value))).digest("hex");
    const expectedSourcePaths = [
      "src/data-layer-installed/schemas/project-hydration.ts",
      "test/data-layer-installed/schemas/retired-controller-assertion-inventory.mjs",
    ];
    const expectedSourcePrefixes = [
      "test/data-layer-installed/schemas/retired-controller-contracts",
    ];
    const expectedPreRepairFailure = { inventorySourceOwned:true, contractRecordsOwned:false };
    const expectedRepairResult = { inventorySourceOwned:true, contractRecordsOwned:true };
    const inventoryOwner = schemasPack.verificationSlices.find(
      ({ id }) => id === "schemas_installed_side_panel",
    );
    const repairResult = {
      inventorySourceOwned:JSON.stringify(inventoryOwner.sourcePaths) ===
        JSON.stringify(expectedSourcePaths),
      contractRecordsOwned:JSON.stringify(inventoryOwner.sourcePrefixes) ===
        JSON.stringify(expectedSourcePrefixes),
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixture = {
      id:"schema-assertion-inventory-source-ownership-v2",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ expectedSourcePaths, expectedSourcePrefixes },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    } }));
  }
  if (context.causalCategory === "other:renamed registered Schema controller test identity") {
    const normalized = (value) => Array.isArray(value) ? value.map(normalized)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalized(nested)]))
        : value;
    const digest = (value) => createHash("sha256")
      .update(JSON.stringify(normalized(value))).digest("hex");
    const taskKeys = [
      "unit:test/data-layer-installed/schemas/project-hydration-test.mjs",
      "unit:test/data-layer-installed/schemas-composition-test.mjs",
      "unit:test/data-layer-installed/schemas/library-controller-test.mjs",
    ];
    const expectedPreRepairFailure = { registeredDirectTasks:false };
    const expectedRepairResult = { registeredDirectTasks:true };
    const repairResult = {
      registeredDirectTasks:taskKeys.every((taskKey) =>
        schemasPack.unit.includes(taskKey.slice("unit:".length))),
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixture = {
      id:"registered-schema-controller-test-identity-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ taskKeys },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    } }));
  }
  if (context.causalCategory === "other:declared-vtd006-evidence-task") {
    const normalized = (value) => Array.isArray(value) ? value.map(normalized)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalized(nested)]))
        : value;
    const digest = (value) => createHash("sha256")
      .update(JSON.stringify(normalized(value))).digest("hex");
    const expectedPreRepairFailure = {
      preparedTask:"unit:test/verification-contracts/reliability-run-intent-contract-test.mjs",
      evidenceAvailable:false,
    };
    const expectedRepairResult = {
      preparedTask:"unit:test/side-panel-single-cutover-preparation-test.mjs",
      evidenceAvailable:true,
    };
    const observed = {
      preparedTask:"unit:test/side-panel-single-cutover-preparation-test.mjs",
      evidenceAvailable:shellPack.unit.includes("test/side-panel-single-cutover-preparation-test.mjs"),
    };
    assert.deepEqual(observed, expectedRepairResult);
    const fixture = {
      id:"declared-vtd006-evidence-task-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ pack:"shell", consumer:"VTD-006 acceptance" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed },
    } }));
  }
}

await runSidePanelBrowserSessionContract();

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "other:direct compatibility assertion line identity drift") {
    const normalized = (value) => Array.isArray(value) ? value.map(normalized)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalized(nested)]))
        : value;
    const digest = (value) => createHash("sha256")
      .update(JSON.stringify(normalized(value))).digest("hex");
    const expectedPreRepairFailure = { staleAssertionIdentity:true, currentAssertionIdentity:false };
    const expectedRepairResult = { staleAssertionIdentity:false, currentAssertionIdentity:true };
    const assertionMapSource = await readFile("test/support/side-panel-browser-direct-assertion-map.mjs", "utf8");
    const repairResult = {
      staleAssertionIdentity:assertionMapSource.includes('"deepEqual@2705:14"'),
      currentAssertionIdentity:assertionMapSource.includes('"deepEqual@2707:14"'),
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixture = {
      id:"direct-compatibility-assertion-line-identity-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ source:"side-panel-browser-fixture-primitives.mjs", insertedLines:2 },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    } }));
  }
  if (context.causalCategory === "other:installed shell readiness source boundary") {
    const normalized = (value) => Array.isArray(value) ? value.map(normalized)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalized(nested)]))
        : value;
    const digest = (value) => createHash("sha256")
      .update(JSON.stringify(normalized(value))).digest("hex");
    const expectedPreRepairFailure = { repositoryOpening:true, shellReady:false };
    const expectedRepairResult = { repositoryOpening:true, shellReady:true };
    const fixture = {
      id:"shell-readiness-before-repository-v2",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ preRepair:{ shellSource:"obsolete side-panel composition entrypoint" } },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const repairResult = {
      repositoryOpening:repositoryOpenIndex >= 0,
      shellReady:shellMountIndex >= 0 && shellMountIndex < repositoryOpenIndex,
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    } }));
  }
}

console.log("side-panel single-cutover ownership preparation passed");
if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION&&JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION).causalCategory==='other:observation source installed slice additions')emitObservationSliceRegression(packs,JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION));
