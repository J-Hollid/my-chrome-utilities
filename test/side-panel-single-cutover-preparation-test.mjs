import assert from "node:assert/strict";
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
  validateSidePanelSingleCutoverFocusedPlan,
} from "../scripts/side-panel-single-cutover-focused-evidence.mjs";
import { focusedAcceptanceOptions, selectFocusedVerificationTasks } from
  "../scripts/run-focused-acceptance.mjs";
import { runnablePackIdsFromRegistry } from
  "../scripts/verification-pack-cardinality/contract.mjs";
import { loadVerificationPacks, planVerification } from
  "../scripts/verification-packs.mjs";

const base = "96524c803b7970bf85dfbe8e895250691bbc3d08";
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
  assert.equal(source.includes("addEventListener("), false, `${id} preparation installs no listener`);
  return module.installedControllerDefinition;
}));
assert.deepEqual(definitions.map(({ id }) => id), expectedOrder);
assert.equal(definitions.every(({ capabilities }) => capabilities.length > 0), true);

const packs = await loadVerificationPacks();
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
for (const [id, packId, sliceId, consumers] of controllers) {
  const pack = packs.find(({ id: candidate }) => candidate === packId);
  const slice = pack.verificationSlices.find(({ id: candidate }) => candidate === sliceId);
  assert.deepEqual(slice.sourcePrefixes, [`src/data-layer-installed/${id}/`]);
  assert.deepEqual(slice.tasks, [`unit:test/data-layer-installed/${id}-controller-test.mjs`]);
  assert.deepEqual(slice.consumers.map(({ packId: consumer }) => consumer).sort(),
    [...consumers].sort());
  assert.equal(slice.consumers.every(({ sliceId: consumerSlice }) =>
    consumerSlice === "side_panel_installed_controller_consumer"), true);
  const plan = planVerification(packs, {
    changedPaths:[`src/data-layer-installed/${id}/index.ts`],
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
}).packIds.length, 20, "the installed root remains globally owned");

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
for (const path of [
  "src/side-panel.ts",
  "src/utilities/data-layer/index.ts",
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

console.log("side-panel single-cutover ownership preparation passed");
