import assert from "node:assert/strict";
import {utilityHostPackIds,verifyUtilitySourceAdditions,verifyLocalWorkspaceTasks} from "../utility-tab-expansion/installed-root-ownership.mjs";
import {emitContextHelperInventoryRepair} from "./schema-context-conservation-repair-support.mjs";
import { execFile } from "node:child_process";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification, verificationOwner } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks, validateVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});
const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);
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
const syntheticChangeSet = (entries) => ({
  version:1,
  baseCommit:"1".repeat(40),
  commit:"2".repeat(40),
  entries,
  paths:[...new Set(entries.flatMap((entry) => entry.oldPath
    ? [entry.oldPath, entry.newPath]
    : [entry.path]))].sort(),
});
const packs = await loadVerificationPacks();
const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);
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
const shellPack = packs.find(({ id }) => id === "shell");
const helperDeclarations = shellPack.verificationHelpers;
const retainedSupportHelpers = [
  ...await readdir(new URL("../../test/support/", import.meta.url)),
  ...(await readdir(new URL("../../test/support/side-panel-companion/", import.meta.url)))
    .map((entry) => `side-panel-companion/${entry}`),
  ...(await readdir(new URL("../../test/support/schema-context-export/", import.meta.url)))
    .map((entry) => `schema-context-export/${entry}`),
]
  .filter((entry) => entry.endsWith(".mjs"))
  .map((entry) => `test/support/${entry}`)
  .filter((helperPath) => ![
    "test/support/branding-workflow-targets.mjs",
    "test/support/layered-schema-parity-runtime.mjs",
  ].includes(helperPath))
  .sort();
await emitContextHelperInventoryRepair({helperDeclarations,retainedSupportHelpers});
assert.deepEqual(helperDeclarations.map(({ path:helperPath }) => helperPath)
  .filter((helperPath) => helperPath.startsWith("test/support/"))
  .sort(), retainedSupportHelpers,
"all 20 retained support helpers have one exact declaration");
const helperValidationInventory = await verificationInventory();
const verificationPackValidationError = async(candidatePacks, inventory) => {
  try {
    await validateVerificationPacks(candidatePacks, { inventory });
  } catch (error) {
    return error.message;
  }
  assert.fail("expected verification-pack validation to reject the defect fixture");
};
const trackedUnusedHelperPath = "test/support/unregistered-helper.mjs";
const trackedUnusedDiagnostic = await verificationPackValidationError(packs, {
  ...helperValidationInventory,
  tracked:[...helperValidationInventory.tracked, trackedUnusedHelperPath],
});
const importedUndeclaredDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.filter(({ path:helperPath }) =>
      helperPath !== "test/browser-packs/shared-harness.mjs"),
  })),
  { ...helperValidationInventory, tracked:helperValidationInventory.tracked.filter((trackedPath) =>
    trackedPath !== "test/browser-packs/shared-harness.mjs") },
);
const incorrectConsumersDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
      "test/support/layered-schema-usability-probes.mjs"
      ? {...helper, consumers:["flow_graph"]} : helper),
  })), helperValidationInventory,
);
const staleDeclarationDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:[...pack.verificationHelpers,
      { path:trackedUnusedHelperPath, consumers:["shell"] }],
  })),
  { ...helperValidationInventory,
    tracked:[...helperValidationInventory.tracked, trackedUnusedHelperPath] },
);
const duplicateDeclarationDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:[...pack.verificationHelpers, pack.verificationHelpers[0]],
  })), helperValidationInventory,
);
const unknownConsumerDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
      "test/support/layered-schema-usability-probes.mjs"
      ? {...helper, consumers:[...helper.consumers, "unknown-pack"]} : helper),
  })), helperValidationInventory,
);
const helperValidationDiagnostics = {
  "a new tracked but unused support helper":trackedUnusedDiagnostic,
  "an imported helper without a declaration":importedUndeclaredDiagnostic,
  "a declaration with a missing or extra consumer":incorrectConsumersDiagnostic,
  "a declared helper with no reachable consumer":staleDeclarationDiagnostic,
  "the same helper declared twice":duplicateDeclarationDiagnostic,
  "a declaration naming an unknown consumer":unknownConsumerDiagnostic,
};
for (const [defect, expectedDiagnostic] of [
  ["a new tracked but unused support helper", "Declare every tracked support helper"],
  ["an imported helper without a declaration", "Declare every imported verification helper"],
  ["a declaration with a missing or extra consumer", "Correct verification helper consumers"],
  ["a declared helper with no reachable consumer", "Remove stale verification helper declaration"],
  ["the same helper declared twice", "Declare verification helper once"],
  ["a declaration naming an unknown consumer", "Register every verification helper consumer"],
]) {
  assert.match(helperValidationDiagnostics[defect], new RegExp(expectedDiagnostic, "u"),
    `${defect} emits its scenario-specific production diagnostic`);
}
await assert.rejects(() => validateVerificationPacks(packs, { inventory:{
  tracked:[...helperValidationInventory.tracked, "test/support/unregistered-helper.mjs"],
} }), /Declare every tracked support helper.*test\/support\/unregistered-helper\.mjs/u,
"a new tracked support helper cannot silently inherit broad Shell ownership");
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "shell", (pack) => ({
  verificationHelpers:[...pack.verificationHelpers, pack.verificationHelpers[0]],
}))), /Declare verification helper once/u,
"the same helper cannot be declared twice");
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "shell", (pack) => ({
  verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
    "test/support/layered-schema-usability-probes.mjs"
    ? {...helper, consumers:[...helper.consumers, "unknown-pack"]} : helper),
}))), /Register every verification helper consumer.*unknown-pack/u,
"every declared helper consumer must be a runnable registered pack");
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "shell", (pack) => ({
  verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
    "test/support/layered-schema-usability-probes.mjs"
    ? {...helper, consumers:["flow_graph"]} : helper),
}))), /Correct verification helper consumers.*layered-schema-usability/u,
"declared helper consumers must equal statically discovered consumers");
for (const removedHelper of ["branding-workflow-targets.mjs", "layered-schema-parity-runtime.mjs"]) {
  await assert.rejects(access(new URL(`../../test/support/${removedHelper}`, import.meta.url)),
    (error) => error?.code === "ENOENT", `${removedHelper} is removed without an executable leaf`);
}
const helperConsumerCases = Object.fromEntries(helperDeclarations.map(({ path:helperPath, consumers }) =>
  [helperPath, consumers]));
for (const [helperPath, consumers] of Object.entries(helperConsumerCases)) {
  const exactConsumers = new Set([
    ...consumers,
    ...packs.filter((pack) => (pack.verificationInputs ?? []).includes(helperPath))
      .map(({ id }) => id),
  ]);
  assert.deepEqual(planVerification(packs, { changedPaths:[helperPath] }).packIds,
    packs.filter(({ id }) => exactConsumers.has(id)).map(({ id }) => id),
    `${helperPath} selects its declared consumers exactly once`);
}
const shellBoundaryCases = {
  ...Object.fromEntries(["src/side-panel.ts","src/side-panel-bootstrap.ts","src/utility-registry.ts"]
    .map(source=>[source,utilityHostPackIds])),
  "src/data-layer-installed/runtime.ts":["project_management", "durable_project_repository",
    "capture", "event-library", "project_event_transport", "schemas", "defects", "replay",
    "live_flow_testing", "shell"],
  "src/panel-empty-states.ts":["shell"],
  "src/panel-empty-states-ui.ts":["shell"],
  "src/workspace-tabs-ui.ts":["shell"],
  "src/workspace-tabs.ts":["command-palette", "hotkeys", "shell"],
  "src/reorderable-editor/control.ts":["schemas", "defects", "flow_export", "layered_schema",
    "property_set_flow_sections", "shell"],
  "src/reorderable-editor/model.ts":["schemas", "defects", "flow_export", "layered_schema",
    "property_set_flow_sections", "shell"],
  "src/reorderable-editor/stable-identities.ts":["schemas", "defects", "flow_export", "layered_schema",
    "property_set_flow_sections", "shell"],
  "src/active-page-observation.ts":["capture", "event-library", "project_event_transport", "schemas",
    "defects", "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"],
  "src/side-panel-action-hierarchy.ts":["event-library", "project_event_transport", "schemas",
    "defects", "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"],
  "src/side-panel-action-hierarchy-ui.ts":["event-library", "project_event_transport", "schemas",
    "defects", "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"],
};
for (const [changedPath, expectedPackIds] of Object.entries(shellBoundaryCases)) {
  const exactPackIds = new Set([
    ...expectedPackIds,
    ...packs.filter((pack) => (pack.verificationInputs ?? []).includes(changedPath))
      .map(({ id }) => id),
  ]);
  assert.deepEqual(planVerification(packs, { changedPaths:[changedPath] }).packIds,
    packs.filter(({ id }) => exactPackIds.has(id)).map(({ id }) => id),
    `${changedPath} selects its exact Shell runtime consumers`);
}
const shellSourcePaths = verifyUtilitySourceAdditions(packs,helperValidationInventory.source
  .filter((sourcePath) => sourcePath.endsWith(".ts") &&
    verificationOwner(packs, sourcePath) === "shell"));
assert.equal(shellSourcePaths.length, 22,
  "every Shell-owned TypeScript file participates in one exact boundary");
for (const platformPath of shellSourcePaths.filter((sourcePath) => !(sourcePath in shellBoundaryCases))) {
  assert.deepEqual(planVerification(packs, {changedPaths:[platformPath]}).packIds,
    runnableProductionPackIds, `${platformPath} remains globally impactful Shell platform runtime`);
}
const localShellPlan = planVerification(packs, {
  changedPaths:["src/workspace-tabs-ui.ts"], includeProperties:true,
});
assert.equal(new Set(localShellPlan.tasks.map(({key}) => key)).size, localShellPlan.tasks.length,
  "local Shell presentation retains every property-enabled task exactly once");
verifyLocalWorkspaceTasks(localShellPlan);
assert.deepEqual(localShellPlan.unitTasks.map(({ target }) => target),
  shellPack.unit.filter(target=>target==="test/workspace-tabs-installed-controller-test.mjs"),
  "local Shell unit tasks conserve the declared Shell unit leaves in canonical order");
assert.deepEqual(localShellPlan.propertyTasks.map(({ target }) => target),
  shellPack.property.filter(target=>target==="test/workspace-tabs-property-test.mjs"),
  "local Shell property tasks conserve the declared Shell property leaves in canonical order");
assert.equal(localShellPlan.browserTasks.length, 0);
assert.equal(localShellPlan.observationTasks.length, 1);
assert.equal(localShellPlan.parserTasks.length, 1);
assert.equal(localShellPlan.generatorTasks.length, 1);
assert.equal(localShellPlan.checkpointTasks.length, 0);
assert.equal(localShellPlan.sessionTasks.length, 0);
const vtd009BasePacks = JSON.parse(await exec("git", [
  "show", "407383e0f6:verification/packs.json",
]));
const vtd009HistoryPlan = (entry, options = {}) => {
  const changeSet = syntheticChangeSet([entry]);
  return planVerification(packs, { changedPaths:changeSet.paths, changeSet,
    basePacks:vtd009BasePacks, ...options }).packIds;
};
const vtd009History = {
  deleteHelper:vtd009HistoryPlan({status:"D",
    path:"test/support/layered-schema-usability-probes.mjs"}, {basePacks:packs}),
  renameHelper:vtd009HistoryPlan({status:"R",score:100,
    oldPath:"test/support/layered-schema-usability-probes.mjs",
    newPath:"test/support/flow-evidence-reporter.mjs"}, {basePacks:packs}),
  deleteLocal:vtd009HistoryPlan({status:"D",path:"src/workspace-tabs-ui.ts"}, {basePacks:packs}),
  renameToPlatform:vtd009HistoryPlan({status:"R",score:100,
    oldPath:"src/workspace-tabs-ui.ts",newPath:"src/side-panel.ts"}, {basePacks:packs}),
  deleteDormant:vtd009HistoryPlan({status:"D",
    path:"test/support/branding-workflow-targets.mjs"}),
};
assert.deepEqual(vtd009History.deleteHelper, ["layered_schema"]);
assert.deepEqual(vtd009History.renameHelper, ["flow_graph", "layered_schema"]);
assert.deepEqual(vtd009History.deleteLocal, ["shell"]);
assert.deepEqual(vtd009History.renameToPlatform,
  runnableProductionPackIds.filter(id=>utilityHostPackIds.includes(id)));
assert.deepEqual(vtd009History.deleteDormant,
  runnableProductionPackIds.filter((id) => id !== "verification_process"));
const unavailableHelperHistory = syntheticChangeSet([{status:"D",
  path:"test/support/layered-schema-usability-probes.mjs"}]);
vtd009History.unavailable = planVerification(packs, {
  changedPaths:unavailableHelperHistory.paths, changeSet:unavailableHelperHistory,
  basePacks:vtd009BasePacks, historicalRegistryFallback:true,
}).packIds;
assert.deepEqual(vtd009History.unavailable, runnableProductionPackIds,
  "unavailable helper ownership fails closed to every runnable pack");
const flowPack = packs.find(({ id }) => id === "flow_graph");
assert.deepEqual(planVerification(packs, {
  packIds:["flow_graph"],
  changedPaths:["acceptance/src/acceptance/steps/flow_graph.clj"],
}).packIds, ["flow_graph"],
"a partition-validating Flow handler remains exact to the pack that owns every evidence leaf");
