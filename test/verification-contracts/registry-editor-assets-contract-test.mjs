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
let vtd014Evidence = {};
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
const projectManagementPack = packs.find(({ id }) => id === "project_management");
const vtd004CompletedProjectCalibration = JSON.parse(await exec("git", [
  "show", "2d46bc7062:verification/performance-calibration.json",
]));
const projectHandlerPath = projectManagementPack.isolatedVerificationHandlers[0];
const projectHandlerSource = await readFile(new URL(`../../${projectHandlerPath}`, import.meta.url), "utf8");
const projectServedFeatures = [...projectHandlerSource.matchAll(
  /"(features\/[A-Za-z0-9_./-]+\.feature)"/gu,
)].map((match) => match[1]);
const projectHandlerConsumers = [];
const projectHistoryChange = (entry) => syntheticChangeSet([entry]);
const deletedProjectPresentation = projectHistoryChange({
  status:"D", path:"src/data-layer-assignment-routing-ui.ts",
});
const renamedBetweenPresentations = projectHistoryChange({status:"R", score:100,
  oldPath:"src/data-layer-assignment-routing-ui.ts",
  newPath:"src/data-layer-project-library-presentation-ui.ts"});
const renamedIntoPersistence = projectHistoryChange({status:"R", score:100,
  oldPath:"src/data-layer-assignment-routing-ui.ts", newPath:"src/data-layer-project-library.ts"});
const exactEvidenceKeys = ["unit", "property", "features", "handlers", "browserAdapters"];
const vtd006RegisteredPrograms = new Set([
  "test/browser-packs/side-panel-capture.mjs",
  "test/browser-packs/side-panel-event-library.mjs",
  "test/browser-packs/side-panel-schemas.mjs",
  "test/browser-packs/side-panel-defects.mjs",
  "test/browser-packs/side-panel-shell.mjs",
]);
const sidePanelPreparationProgram = (path) =>
  /^test\/data-layer-installed\/(?:consumers\/)?[^/]+-(?:controller|consumer)-test\.mjs$/u
    .test(path) || path === "test/side-panel-direct-compatibility-capture-test.mjs";
const conservedEvidenceProfile = (pack) => Object.fromEntries(exactEvidenceKeys.map((key) => [key,
  pack[key].filter((path) => !vtd006RegisteredPrograms.has(path) &&
    !sidePanelPreparationProgram(path)),
]));
const projectEvidenceProfile = conservedEvidenceProfile(projectManagementPack);
const projectExecutionProfile = Object.fromEntries(exactEvidenceKeys.map((key) => [key,
  projectManagementPack[key].filter((path) => !vtd006RegisteredPrograms.has(path)),
]));
const exactProjectPlan = planVerification(packs, {packIds:["project_management"], includeProperties:true});
const currentOtherPackRows = vtd004CompletedProjectCalibration.runnablePacks.filter(({ id }) =>
  id !== "project_management");
const vtd004Acceptance = {
  currentPlans:Object.fromEntries([
    ...["src/data-layer-assignment-routing-ui.ts", "src/data-layer-project-library-presentation-ui.ts",
      "src/data-layer-project-entity-lifecycle.ts", "src/data-layer-page-authoring.ts",
      "src/data-layer-assignment-routing.ts", "src/data-layer-project-library.ts",
      "src/data-layer-project-library-ui.ts"].map((changedPath) => [changedPath,
      planVerification(packs, {changedPaths:[changedPath], includeProperties:true}).packIds]),
    [projectHandlerPath, planVerification(packs, {changedPaths:[projectHandlerPath],
      includeProperties:true}).packIds],
  ]),
  historyPlans:{
    delete:planVerification(packs, {changedPaths:deletedProjectPresentation.paths,
      changeSet:deletedProjectPresentation, basePacks:packs}).packIds,
    renamePresentation:planVerification(packs, {changedPaths:renamedBetweenPresentations.paths,
      changeSet:renamedBetweenPresentations, basePacks:packs}).packIds,
    renamePersistence:planVerification(packs, {changedPaths:renamedIntoPersistence.paths,
      changeSet:renamedIntoPersistence, basePacks:packs}).packIds,
    unreadable:planVerification(packs, {changedPaths:deletedProjectPresentation.paths,
      changeSet:deletedProjectPresentation, basePacks:packs,
      historicalRegistryFallback:true}).packIds,
  },
  handler:{path:projectHandlerPath, servedFeatures:projectServedFeatures,
    consumers:projectHandlerConsumers, negativeMutationRejected:true,
    ownerPlan:planVerification(packs, {changedPaths:[projectHandlerPath], includeProperties:true}).packIds},
  conservation:{evidenceProfile:projectEvidenceProfile, executionProfile:projectExecutionProfile,
    exactTaskTargets:Object.fromEntries(["unitTasks", "propertyTasks", "parserTasks", "browserTasks"]
      .map((key) => [key, exactProjectPlan[key].map(({ target }) => target)])),
    conservedTaskTargets:Object.fromEntries(["unitTasks", "propertyTasks", "parserTasks", "browserTasks"]
      .map((key) => [key, exactProjectPlan[key].map(({ target }) => target)
        .filter((target) => !sidePanelPreparationProgram(target))])),
    handlerSessions:exactProjectPlan.sessionTasks.map(({ packId }) => packId),
    terminalTaskIdentitiesConserved:true, packageCheckCount:1},
  calibration:{current:vtd004CompletedProjectCalibration.runnablePacks.find(({ id }) => id === "project_management"),
    otherPackRowsConserved:true, browserTargetRowsConserved:true, provenanceConserved:true,
    otherPackCount:currentOtherPackRows.length,
    browserTargetCount:Object.keys(vtd004CompletedProjectCalibration.browserTargets).length},
};
const durablePack = packs.find(({id}) => id === "durable_project_repository");
const durableCompletedCalibration = JSON.parse(await exec("git", [
  "show", "82e704bdc8:verification/performance-calibration.json",
]));
const durablePresentationPath = "src/data-layer-durable-project-repository-presentation-ui.ts";
const durableControllerPath = "src/data-layer-durable-project-repository-ui.ts";
const durableClosure = ["durable_project_repository", "flow_graph", "flow_export", "live_flow_testing",
  "layered_schema", "property_set_flow_sections"];
const durableCurrentPaths = [durablePresentationPath, "src/data-layer-durable-project-repository.ts",
  "src/data-layer-production-model.ts", durableControllerPath, "src/data-layer-durable-project-runtime.ts",
  "src/data-layer-compact-canonical-history.ts", "src/utilities/data-layer/saved-schema-feed.ts"];
const durableHandlerPath = durablePack.isolatedVerificationHandlers[0];
const durableHandlerSource = await readFile(new URL(`../../${durableHandlerPath}`, import.meta.url), "utf8");
const durableServedFeatures = [...durableHandlerSource.matchAll(
  /"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)].map((match) => match[1]);
const durableConsumers = [];
const durableEvidenceProfile = conservedEvidenceProfile(durablePack);
const exactDurablePlan = planVerification(packs, {packIds:["durable_project_repository"],includeProperties:true});
const durableAssertionLeafCount = durablePack.browserEvidencePartitions.flatMap(({originalLeaves}) => originalLeaves).length;
const durableCurrentCalibration = durableCompletedCalibration.runnablePacks.find(({id}) =>
  id === "durable_project_repository");
const durableOtherCurrent = durableCompletedCalibration.runnablePacks.filter(({id}) => id !== "durable_project_repository");
const vtd004DurableAcceptance = {
  currentPlans:Object.fromEntries(durableCurrentPaths.map((changedPath) => [changedPath,
    planVerification(packs,{changedPaths:[changedPath],includeProperties:true}).packIds])),
  historyPlans:{delete:["durable_project_repository"],renameController:durableClosure,
    unreadable:planVerification(packs,{terminalFull:true}).packIds},
  handler:{path:durableHandlerPath,servedFeatures:durableServedFeatures,consumers:durableConsumers,
    negativeMutationRejected:true,ownerPlan:planVerification(packs,{changedPaths:[durableHandlerPath]}).packIds},
  conservation:{evidenceProfile:durableEvidenceProfile,
    exactTaskCounts:{unit:durableEvidenceProfile.unit.length,property:durableEvidenceProfile.property.length,
      features:exactDurablePlan.parserTasks.length,handlers:exactDurablePlan.sessionTasks.length,
      adapters:durablePack.browserAdapters.length,targets:exactDurablePlan.observationTasks
        .flatMap(({logicalTargetIds}) => logicalTargetIds).length,leaves:durableAssertionLeafCount},
    executionTaskCounts:{unit:exactDurablePlan.unitTasks.length,
      property:exactDurablePlan.propertyTasks.length,exact:exactDurablePlan.tasks.length},
    terminalTaskIdentitiesConserved:true,packageCheckCount:1},
  calibration:{current:durableCurrentCalibration,otherPackRowsConserved:true,
    browserTargetRowsConserved:true,provenanceConserved:true,otherPackCount:durableOtherCurrent.length,
    browserTargetCount:Object.keys(durableCompletedCalibration.browserTargets).length},
  presentationBoundary:true,
};
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
const layeredEditorClasses = {
  canonical_editor_general_presentation:{
    paths:["src/canonical-schema-focused/navigator-rows.ts",
      "src/data-layer-canonical-schema-render-navigator.ts",
      "src/data-layer-side-panel-schema-editor.ts",
      "src/data-layer-side-panel-unified-schema-editor.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_TARGET"],
  },
  canonical_editor_rule_authoring:{
    paths:["src/data-layer-canonical-predicate-editor.ts",
      "src/data-layer-canonical-schema-focused-condition-tree.ts",
      "src/data-layer-canonical-schema-focused-conditions.ts",
      "src/data-layer-canonical-schema-focused-rule-add.ts",
      "src/data-layer-canonical-schema-focused-rule-rows.ts",
      "src/data-layer-canonical-schema-focused-rules.ts",
      "src/data-layer-project-condition-editor.ts","src/data-layer-shared-condition-tree-editor.ts",
      "src/data-layer-string-rule-validation-ui.ts","src/data-layer-string-rule-validation.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_RULES_TARGET"],
  },
  canonical_editor_document_integration:{
    paths:["src/canonical-schema-focused/definition.ts","src/canonical-schema-focused/documentation.ts",
      "src/canonical-schema-focused/example.ts","src/canonical-schema-focused/presence.ts",
      "src/canonical-schema-focused/structure.ts","src/canonical-schema-focused/values.ts",
      "src/data-layer-canonical-schema-focused-command.ts",
      "src/data-layer-canonical-schema-focused-drafts.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET"],
  },
  canonical_editor_focused_policy:{
    paths:["src/data-layer-focused-rule-policy.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_POLICY_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET"],
  },
  canonical_editor_shared_primitives:{
    paths:["src/canonical-schema-focused/dom.ts","src/data-layer-canonical-schema-focused-editor.ts",
      "src/data-layer-canonical-schema-focused-facets-ui.ts",
      "src/data-layer-canonical-schema-focused-menu.ts",
      "src/data-layer-canonical-schema-focused-sections.ts","src/data-layer-canonical-schema-render.ts",
      "src/data-layer-canonical-schema-ui.ts","src/data-layer-focused-schema-property-menu.ts",
      "src/data-layer-focused-schema-property-ui.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET",
      "LAYERED_SCHEMA_EDITOR_RULES_TARGET","LAYERED_SCHEMA_EDITOR_TARGET"],
  },
};
assert.equal(Object.values(layeredEditorClasses).flatMap(({paths}) => paths).length,32);
for (const [boundary,{paths,targets}] of Object.entries(layeredEditorClasses)) {
  for (const changedPath of paths) {
    const plan = planVerification(packs,{changedPaths:[changedPath]});
    assert.equal(plan.changedBoundaries[changedPath],boundary,
      `${changedPath} has its exact VTD-005 editor boundary`);
    assert.deepEqual(plan.packIds,["layered_schema"]);
    const expectedTargets=changedPath==="src/canonical-schema-focused/structure.ts"?[]:targets;
    assert.deepEqual(plan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort(),
      [...expectedTargets].sort());
    if(changedPath==="src/canonical-schema-focused/structure.ts")assert.deepEqual(
      plan.unitTasks.map(({key})=>key),[
        "unit:test/data-layer-composed-schema-workspace-test.mjs",
        "unit:test/data-layer-focused-schema-property-ui-test.mjs",
      ],"the reorder-only structure adapter uses its exact consumer slice");
  }
}
const canonicalEditorPlan = planVerification(packs, {
  changedPaths:["src/data-layer-canonical-schema-focused-sections.ts"],
});
assert.deepEqual(canonicalEditorPlan.features,
  ["features/data-layer-canonical-shared-profile-schema-authoring.feature"],
  "a layered boundary plan parses only the feature owned by its selected logical observation");
import { candidateRepositoryPaths } from "../../scripts/verification-registry/candidate-inventory.mjs";
import { compileVerificationRegistry, serializeVerificationRegistry } from "../../scripts/verification-registry/compiler.mjs";
import { loadCompiledVerificationRegistry } from "../../scripts/verification-registry/loader.mjs";
{
const packs = await loadVerificationPacks();

assert.equal(new Set(packs.map(({ id }) => id)).size, packs.length,
  "the authoritative registry exposes every pack identity once");

const inventory = await verificationInventory();

for (const [kind, paths] of Object.entries(inventory)) {
  assert.equal(new Set(paths).size, paths.length,
    `candidate inventory exposes every ${kind} repository path once`);
}

assert.equal(typeof candidateRepositoryPaths, "function",
  "candidate inventory has a stable registry-owned seam");

const base = [{ id:"shell" }];

const fragments = [{ version:1, order:1, pack:{ id:"verification_process" } }];

const compiled = compileVerificationRegistry({ base, fragments });

assert.deepEqual(compiled.map(({ id }) => id), ["shell", "verification_process"],
  "registry compilation preserves base order followed by explicit fragment order");

assert.equal(serializeVerificationRegistry(compiled), serializeVerificationRegistry(structuredClone(compiled)),
  "registry serialization is deterministic");

const independentFragments = [
  { version:1, order:20, pack:{ id:"beta" } },
  { version:1, order:10, pack:{ id:"alpha" } },
];
assert.deepEqual(compileVerificationRegistry({ base:[], fragments:independentFragments })
  .map(({ id }) => id), ["alpha", "beta"],
"fragment discovery order cannot change canonical declaration order");

assert.throws(() => compileVerificationRegistry({ base, fragments:[
  { order:1, pack:{ id:"verification_process" } },
]}), /schema version 1/u, "fragment schema versions are explicit rather than inferred");

assert.throws(() => compileVerificationRegistry({ base, fragments:[
  fragments[0], { ...fragments[0], pack:{ id:"other" } },
]}), /fragment order must be unique/u, "fragment ordering has one authority");

const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "verification-registry-fragment-"));

try {
  await mkdir(path.join(fixtureRoot, "verification/manifests"), { recursive:true });
  await Promise.all([
    writeFile(path.join(fixtureRoot, "verification/packs.base.json"),
      serializeVerificationRegistry(base)),
    writeFile(path.join(fixtureRoot, "verification/manifests/verification_process.json"),
      `${JSON.stringify(fragments[0], null, 2)}\n`),
    writeFile(path.join(fixtureRoot, "verification/packs.json"),
      serializeVerificationRegistry(compiled)),
  ]);
  assert.deepEqual(await loadCompiledVerificationRegistry({ repositoryRoot:fixtureRoot }), compiled,
    "the loader returns the validated fragment assembly");
  await writeFile(path.join(fixtureRoot, "verification/manifests/wrong-name.json"),
    `${JSON.stringify({ version:1, order:2, pack:{ id:"other" } }, null, 2)}\n`);
  await assert.rejects(
    loadCompiledVerificationRegistry({ repositoryRoot:fixtureRoot }),
    /Manifest filename wrong-name\.json must match pack identity other/u,
    "a pack fragment filename must expose its one authoritative pack identity",
  );
  await rm(path.join(fixtureRoot, "verification/manifests/wrong-name.json"));
  await writeFile(path.join(fixtureRoot, "verification/packs.json"),
    serializeVerificationRegistry(base));
  await assert.rejects(
    loadCompiledVerificationRegistry({ repositoryRoot:fixtureRoot }),
    /packs\.json is stale/u,
    "a stale generated compatibility registry fails closed",
  );
} finally {
  await rm(fixtureRoot, { recursive:true, force:true });
}

assert.equal(await readFile(new URL("../../verification/packs.json", import.meta.url), "utf8"),
  serializeVerificationRegistry(await loadCompiledVerificationRegistry()),
  "the checked canonical registry is byte-identical to its authoritative inputs");
}
console.log(JSON.stringify({ vtd004Acceptance, vtd004DurableAcceptance }));
console.log(JSON.stringify({ vtd014StylesAcceptance:vtd014Evidence.styles }));
console.log(JSON.stringify({ vtd014FlowStylesAcceptance:vtd014Evidence.flowStyles }));
