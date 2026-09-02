import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { exactObservationEnvironment, parseBrowserObservationBatchOutput, parseBrowserObservationOutput } from "../../scripts/run-browser-observation.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification, verificationOwner, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { browserAdapterUsesSharedHarness, clojureRequiresNamespace, loadVerificationPacks, staticallyResolvableModuleImports, validateIsolatedVerificationHandlers, validateVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
import { stylesheetDeclarationFor, stylesheetPlanFor, validateStylesheetDeclarations } from "../../scripts/verification-styles.mjs";
import { stylesheetRuleInventory, verifyFlowStylesheetConservation } from "../../scripts/flow-stylesheet-conservation.mjs";
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
const eventLibraryPack = packs.find(({id}) => id === "event-library");
const eventLibraryBasePacks = JSON.parse(await exec("git", ["show", "c37e22d3f4:verification/packs.json"]));
const eventLibraryBaseCalibration = JSON.parse(await exec("git", [
  "show", "c37e22d3f4:verification/performance-calibration.json",
]));
assert.deepEqual(eventLibraryPack.impactBoundaries.map(({id,sourceClass,propagateDependants}) =>
  [id,sourceClass,propagateDependants]), [
  ["event_library_editor_model", "core or semantic", true],
  ["event_library_editor_shared_presentation", "browser presentation", true],
  ["event_library_deletion_persistence", "persistence migration", true],
  ["event_library_transfer_persistence", "persistence migration", true],
  ["event_library_renaming_semantic", "core or semantic", true],
  ["event_library_review_model", "core or semantic", true],
  ["event_library_review_presentation", "browser presentation", false],
  ["event_library_target_push_controller", "application controller", true],
  ["event_library_page_push_semantic", "core or semantic", true],
  ["event_library_installed_side_panel_boundary", "application controller", false],
], "Event Library source classes and propagation are explicit registry data");
const eventReviewPresentationPaths = ["src/data-layer-push-draft-review-ui.ts",
  "src/data-layer-template-change-review-ui.ts"];
const eventEditorPaths = ["src/data-layer-event-library-editor.ts",
  "src/data-layer-event-library-editor-ui.ts"];
const eventSemanticPaths = ["src/data-layer-event-library-deletion.ts",
  "src/data-layer-event-library-transfer.ts", "src/data-layer-event-template-renaming.ts",
  "src/data-layer-push-draft-review.ts", "src/data-layer-template-change-review.ts",
  "src/data-layer-selected-target-push.ts", "src/data-layer-selected-target-push-page.ts"];
for (const presentationPath of eventReviewPresentationPaths) {
  const source = await readFile(new URL(`../../${presentationPath}`, import.meta.url), "utf8");
  assert.doesNotMatch(source,
    /localStorage|sessionStorage|indexedDB|data-layer-event-library-editor|data-layer-event-library-transfer|data-layer-event-template-renaming|data-layer-selected-target-push|utilities\/data-layer\/capture/u,
    `${presentationPath} cannot access Library storage, controllers, page push, or Capture`);
  assert.match(source, /root: ParentNode/u, `${presentationPath} receives its DOM root from the caller`);
}
const realRegistryChange = syntheticChangeSet([{ status:"M", path:"verification/packs.json" }]);
const runnableProductionPackIds = planVerification(packs, { terminalFull:true }).packIds;
const flowPack = packs.find(({ id }) => id === "flow_graph");
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
  "FLOW_STYLESHEET_EXTRACTION_TARGET",
];
const flowRuntimeTargetIds = flowTargetIds
  .filter((id) => id !== "FLOW_STYLESHEET_EXTRACTION_TARGET");
assert.deepEqual(new Set(flowPack.browserObservations.map(({ id }) => id)), new Set(flowTargetIds),
  "the Flow adapter exposes five exact logical targets including stylesheet evidence");
assert.ok(flowPack.browserObservations.every(({ path:program, sessionBatch }) =>
  program === "test/browser-packs/flow-graph.mjs" && sessionBatch === "flow-graph"),
"every Flow target shares the installed Flow program and compatible session batch");
assert.deepEqual(flowPack.browserAdapters, ["test/browser-packs/flow-graph.mjs"],
  "no unpartitioned legacy or example adapter remains scheduled");
const exactFlowPlan = planVerification(packs, { packIds:["flow_graph"] });
assert.equal(exactFlowPlan.observationTasks.length, 1,
  "exact Flow verification uses one compatible installed-browser process");
assert.deepEqual(new Set(exactFlowPlan.observationTasks[0].logicalTargetIds), new Set(flowTargetIds),
  "the exact Flow process retains all five independent logical identities");
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
  new Set(["FLOW_STYLESHEET_EXTRACTION_TARGET", "FLOW_WORKSPACE_AUTHORING_TARGET",
    "FLOW_WORKSPACE_CONTROLS_TARGET"]));
const semanticFlowPlan = planVerification(packs, {
  changedPaths:["src/flow-graph/relationships.ts"],
});
assert.ok(semanticFlowPlan.packIds.length > 1 && semanticFlowPlan.packIds.includes("flow_graph"),
  "semantic Flow changes retain declared dependant propagation");
assert.deepEqual(new Set(semanticFlowPlan.observationTasks
  .find(({ packId }) => packId === "flow_graph").logicalTargetIds), new Set(flowRuntimeTargetIds));
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
const headlessChromeConsumers = packs.find(({ id }) => id === "shell").verificationHelpers
  .find(({ path:helperPath }) => helperPath === "test/support/headless-chrome.mjs").consumers;
assert.deepEqual(planVerification(packs, {
  changedPaths:["test/support/headless-chrome.mjs"],
}).packIds, packs.filter(({ id }) => headlessChromeConsumers.includes(id)).map(({ id }) => id),
"the shared headless Chrome harness selects every declared consumer without semantic dependant expansion");
const registeredBrowserPrograms = new Set(packs.flatMap((pack) => [
  ...(pack.browserAdapters ?? []),
  ...(pack.browserObservations ?? []).map(({ path:programPath }) => programPath),
]));
for (const programPath of registeredBrowserPrograms) {
  const source = await readFile(new URL(`../../${programPath}`, import.meta.url), "utf8");
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
  new URL("../support/side-panel-browser-fixture-primitives.mjs", import.meta.url),
  "utf8",
);
const installedTargetSessionSource = await readFile(
  new URL("../support/browser-target-session.mjs", import.meta.url), "utf8",
);
assert.match(installedTargetSessionSource,
  /withLogicalTargetLifecycle\(\{[\s\S]*?boundary:"installed-session logical target"[\s\S]*?work:async\(\{remainingMilliseconds\}\)[\s\S]*?cleanup:async[\s\S]*?finalize:/u,
  "installed-target page cleanup remains inside its finite logical-target boundary");
const shellBrowserBatch = packs.find(({ id }) => id === "shell");
const shellContainmentTargets = shellBrowserBatch.browserObservations
  .filter(({ id }) => ["SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER",
    "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER"].includes(id));
assert.equal(new Set(shellContainmentTargets.map(({ sessionBatch }) => sessionBatch)).size, 1,
  "compatible shell containment targets declare one reusable session batch");
assert.ok(shellContainmentTargets.every(({ sessionBatch }) => sessionBatch),
  "the real registry does not leave compatible containment targets unbatched");
assert.deepEqual(shellBrowserBatch.browserAdapterPerformance, [{
  path:"test/browser-packs/reorderable-editor-controls.mjs",
  singleTargetP90Milliseconds:180000,
  maximumSingleTargetP90Milliseconds:240000,
  targetIds:["REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER"],
  sessionBatch:"reorderable-editor-controls",
},{
  path:"test/browser-packs/side-panel-shell.mjs",
  singleTargetP90Milliseconds:18000,
  maximumSingleTargetP90Milliseconds:10000,
  targetIds:["LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER",
    "SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER",
    "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER"],
  sessionBatch:"shell-containment",
}], "the Shell browser programs declare independently selectable batched targets");
assert.match(componentLayoutBrowserSource, /SWARMFORGE_BROWSER_TARGET_IDS/u,
  "the shared browser program consumes logical target identities");
assert.match(componentLayoutBrowserSource, /SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS/u,
  "the shared browser program consumes per-target environment configurations");
assert.match(componentLayoutBrowserSource, /Storage\.clearDataForOrigin/u,
  "each batched logical target clears browser storage before executing");
assert.match(componentLayoutBrowserSource, /swarmforgeBrowserTargetTiming/u,
  "the shared program emits timing evidence for each logical target");
assert.match(componentLayoutBrowserSource,
  /globalThis\.__swarmforgeRetainedEvaluation = \(\$\{expression\}\)/u,
  "DevTools evaluations retain awaited promises until their results are collected");
assert.match(componentLayoutBrowserSource,
  /activeBrowserTargetEnvironment\.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1" \? \[720\]/u,
  "the focused Schema view containment observation owns one explicit viewport");
assert.match(componentLayoutBrowserSource,
  /activeBrowserTargetEnvironment\.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1" \? \[720\]/u,
  "the focused Schema workspace observation owns its extended-workspace viewport");
const schemaViewStop = componentLayoutBrowserSource.indexOf(
  'if (activeBrowserTargetEnvironment.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1") {\n      socket.close(); continue;\n    }',
);
const schemaWorkspaceStop = componentLayoutBrowserSource.indexOf(
  'if (activeBrowserTargetEnvironment.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1") {',
);
const payloadPathPicker = componentLayoutBrowserSource.indexOf(
  "payloadPathFilterPickerObservation =",
);
assert.ok(schemaViewStop >= 0 && schemaViewStop < schemaWorkspaceStop && schemaViewStop < payloadPathPicker,
  "the focused Schema view containment observation stops before workspace and payload browser contracts");
assert.match(componentLayoutBrowserSource,
  /if \(activeBrowserTargetEnvironment\.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1"\) \{[\s\S]*?schemaWorkspaceAdapterObservations\.push\(schemaWorkspaceObservation\);[\s\S]*?console\.log\(JSON\.stringify\(\{ schemaWorkspace:schemaWorkspaceObservation \}\)\);\s*await evaluate\(socket, guidedTransportProjectRestoreRuntime\(previousActiveProjectId\)\);\s*socket\.close\(\);\s*continue;\s*\}\s*if \(activeBrowserTargetEnvironment\.PAYLOAD_PATH_FILTER_BROWSER_ADAPTER === "1" \|\| !requestedBrowserAdapter\) \{\s*payloadPathFilterPickerObservation =/u,
  "the focused Schema workspace observation stops before unrelated browser contracts");
assert.match(componentLayoutBrowserSource,
  /await reloadPanel\(socket\);\s*if \(activeBrowserTargetEnvironment\.GUIDED_VALIDATION_BROWSER_ADAPTER === "1"\) \{\s*socket\.close\(\); continue;\s*\}\s*\}\s*if \(activeBrowserTargetEnvironment\.LIVE_VALIDATION_VISUALS_BROWSER_ADAPTER === "1" \|\|\s*!requestedBrowserAdapter\) \{\s*liveValidationVisualsObservation =/su,
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
const stepDirectory = new URL("../../acceptance/src/acceptance/steps/", import.meta.url);
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
    if (name !== "all.clj" && requiredOwner !== requiringOwner) {
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
]) assert.ok(crossPackStepRequires.some((edge) =>
  edge.requiringPath === requiringPath && edge.requiredPath === requiredPath),
  `${requiringPath} exposes its cross-pack requirement on ${requiredPath}`);
assert.equal(crossPackStepRequires.some(({ requiredPath }) =>
  requiredPath === "acceptance/src/acceptance/steps/project_management.clj"), false,
"the isolated project-management handler has no cross-pack Clojure consumer");
const requiredPathImpacts = new Map();
// Acceptance source inspection proves a contract but is not a production runtime import.
// Cross-pack source reads that must affect another pack are declared as verificationInputs.
for (const edge of crossPackStepRequires) {
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
import { candidateRepositoryPaths } from "../../scripts/verification-registry/candidate-inventory.mjs";
import { compileVerificationRegistry, serializeVerificationRegistry } from "../../scripts/verification-registry/compiler.mjs";
import { loadCompiledVerificationRegistry } from "../../scripts/verification-registry/loader.mjs";
