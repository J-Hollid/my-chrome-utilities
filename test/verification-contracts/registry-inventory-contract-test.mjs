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

const feature = planVerification(synthetic, { changedPaths:["features/alpha-one.feature"] });

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

for (const modulePath of [
  "../../scripts/run-focused-acceptance.mjs",
  "../../scripts/verification-reliability-persistence.mjs",
  "../../scripts/verification-reliability-repair.mjs",
  "../../scripts/verification-reliability-store.mjs",
  "../../scripts/verification-reliability-values.mjs",
]) {
  const source = await readFile(new URL(modulePath, import.meta.url), "utf8");
  assert.doesNotMatch(source, /["'`]Timeout (?:incident|repair)/u,
    `${modulePath} exposes failure-neutral Reliability incident/repair diagnostics`);
}

const adapterModes = new Map(packs.flatMap((pack) => (pack.browserAdapterModes ?? [])
  .map(({ path:adapterPath, mode }) => [adapterPath, mode])));

assert.equal([...adapterModes.values()].filter((mode) => mode === "shared-wrapper").length, 0);

for (const program of [
  "test/browser-packs/side-panel-capture.mjs",
  "test/browser-packs/side-panel-event-library.mjs",
  "test/browser-packs/side-panel-schemas.mjs",
  "test/browser-packs/side-panel-defects.mjs",
  "test/browser-packs/side-panel-shell.mjs",
]) assert.equal(adapterModes.get(program), "integration");

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

const projectManagementPack = packs.find(({ id }) => id === "project_management");

const vtd004BasePacks = JSON.parse(await exec("git", [
  "show", "9a2f202483:verification/packs.json",
]));

const vtd004BaseCalibration = JSON.parse(await exec("git", [
  "show", "9a2f202483:verification/performance-calibration.json",
]));

const vtd004CurrentCalibration = JSON.parse(await readFile(
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));

const vtd004CompletedProjectCalibration = JSON.parse(await exec("git", [
  "show", "2d46bc7062:verification/performance-calibration.json",
]));

assert.deepEqual(projectManagementPack.impactBoundaries.map(({ id, sourceClass, propagateDependants }) =>
  [id, sourceClass, propagateDependants]), [
  ["project_entity_lifecycle_semantic", "core or semantic", true],
  ["project_page_authoring_controller", "application controller", true],
  ["project_assignment_routing_semantic", "core or semantic", true],
  ["project_assignment_routing_presentation", "browser presentation", false],
  ["project_flow_visual_asset_portability", "persistence migration", true],
  ["project_library_persistence", "persistence migration", true],
  ["project_library_controller", "application controller", true],
  ["project_library_presentation", "browser presentation", false],
  ["project_library_installed_side_panel_boundary", "application controller", false],
], "project-management source classes and propagation are explicit production registry data");

assert.deepEqual(projectManagementPack.isolatedVerificationHandlers,
  ["acceptance/src/acceptance/steps/project_management.clj"],
  "the project-management APS handler is explicitly isolated");

const projectHandlerPath = projectManagementPack.isolatedVerificationHandlers[0];

const projectHandlerSource = await readFile(new URL(`../../${projectHandlerPath}`, import.meta.url), "utf8");

const projectArchitectureHandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_project_management_handlers.clj",
  import.meta.url), "utf8");

const projectManagementStepsTestSource = await readFile(new URL(
  "../acceptance/project_management_steps_test.clj", import.meta.url), "utf8");

const modularVerificationPacksFeatureSource = await readFile(new URL(
  "../../features/modular-verification-packs.feature", import.meta.url), "utf8");

const layeredEditorArchitectureHandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_layered_editor_handlers.clj",
  import.meta.url), "utf8");

const projectServedFeatures = [...projectHandlerSource.matchAll(
  /"(features\/[A-Za-z0-9_./-]+\.feature)"/gu,
)].map((match) => match[1]);

assert.deepEqual([...projectServedFeatures].sort(), [...projectManagementPack.features].sort(),
  "the isolated handler serves exactly all six project-management feature identities");

const projectNamespace = "acceptance.steps.project-management";

assert.equal(clojureRequiresNamespace(
  `(ns acceptance.steps.consumer (:require ${projectNamespace}))`, projectNamespace,
), true, "a bare Clojure libspec is a cross-pack namespace consumer");

assert.equal(clojureRequiresNamespace(
  `(ns acceptance.steps.consumer (:require [^{:load true} ${projectNamespace} :as project]))`,
  projectNamespace,
), true, "a metadata-decorated Clojure libspec is a cross-pack namespace consumer");

assert.equal(clojureRequiresNamespace(
  "(ns acceptance.steps.consumer (:require [acceptance.steps [project-management :as project]]))",
  projectNamespace,
), true, "a prefix-list Clojure libspec is a cross-pack namespace consumer");

assert.equal(clojureRequiresNamespace(
  `(ns acceptance.steps.consumer) ; ${projectNamespace}\n(def example \"${projectNamespace}\")`,
  projectNamespace,
), false, "comments and strings do not create cross-pack namespace consumers");

const registeredHandlerPaths = [...new Set(packs.flatMap((pack) => pack.handlers ?? []))];

const projectHandlerConsumers = [];

for (const handlerPath of registeredHandlerPaths) {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
  if (handlerPath !== projectHandlerPath && clojureRequiresNamespace(source, projectNamespace)) {
    projectHandlerConsumers.push(handlerPath);
  }
}

assert.deepEqual(projectHandlerConsumers, [],
  "no registered APS/Clojure handler outside the owner consumes the isolated project handler");

const crossPackConsumer = packs.find(({ id, handlers }) => id !== "project_management" && handlers?.length);

const crossPackHandler = crossPackConsumer.handlers[0];

await assert.rejects(() => validateIsolatedVerificationHandlers(packs, {
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
    return handlerPath === crossPackHandler
      ? `${source}\n[acceptance.steps.project-management :as project-management]\n`
      : source;
  },
}), new RegExp(`Cross-pack handler consumer blocks isolation.*${crossPackHandler.replaceAll("/", "\\/")}`, "u"),
"a negative cross-pack APS consumer mutation blocks handler isolation");

await assert.rejects(() => validateIsolatedVerificationHandlers(packs, {
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
    return handlerPath === crossPackHandler
      ? `${source}\n[acceptance.steps.project-management :refer [handlers]]\n`
      : source;
  },
}), new RegExp(`Cross-pack handler consumer blocks isolation.*${crossPackHandler.replaceAll("/", "\\/")}`, "u"),
"a non-alias :refer consumer mutation also blocks handler isolation");

for (const [description, mutation] of [
  ["a bare cross-pack Clojure libspec blocks handler isolation",
    `(ns acceptance.steps.consumer (:require ${projectNamespace}))`],
  ["a metadata-decorated cross-pack Clojure libspec blocks handler isolation",
    `(ns acceptance.steps.consumer (:require [^{:load true} ${projectNamespace} :as project-management]))`],
  ["a prefix-list cross-pack Clojure libspec blocks handler isolation",
    "(ns acceptance.steps.consumer (:require [acceptance.steps [project-management :as project-management]]))"],
]) {
  await assert.rejects(() => validateIsolatedVerificationHandlers(packs, {
    readSource:async(handlerPath) => {
      const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
      return handlerPath === crossPackHandler ? `${source}\n${mutation}\n` : source;
    },
  }), new RegExp(`Cross-pack handler consumer blocks isolation.*${crossPackHandler.replaceAll("/", "\\/")}`, "u"),
  description);
}

const projectClosure = ["project_management", "durable_project_repository", "project_event_transport",
  "flow_graph", "flow_export", "live_flow_testing", "layered_schema",
  "property_set_flow_sections", "guided_test_cases", "shell"];

for (const changedPath of ["src/data-layer-assignment-routing-ui.ts",
  "src/data-layer-project-library-presentation-ui.ts"]) {
  const plan = planVerification(packs, { changedPaths:[changedPath], includeProperties:true });
  assert.deepEqual(plan.packIds, ["project_management"], `${changedPath} remains owner-only`);
  assert.equal(plan.unitTasks.length, 8);
  assert.equal(plan.propertyTasks.length, 5);
  assert.equal(plan.sessionTasks.length, 1);
  assert.equal(plan.parserTasks.length, 6);
  assert.equal(plan.browserTasks.length + plan.observationTasks.length, 4);
}

for (const changedPath of ["src/data-layer-project-entity-lifecycle.ts",
  "src/data-layer-page-authoring.ts", "src/data-layer-assignment-routing.ts",
  "src/data-layer-project-library.ts", "src/data-layer-project-library-ui.ts"]) {
  assert.deepEqual(planVerification(packs, { changedPaths:[changedPath] }).packIds, projectClosure,
    `${changedPath} retains the exact ten-pack dependant closure`);
}

assert.deepEqual(planVerification(packs, {
  changedPaths:["acceptance/src/acceptance/steps/project_management.clj"],
}).packIds, ["project_management"], "an isolated project handler selects only complete owner evidence");

const projectHistoryChange = (entry) => syntheticChangeSet([entry]);

const modifiedGeneratedArtifact = projectHistoryChange({
  status:"M", path:"dist/data-layer-project-library-ui.js",
});

assert.deepEqual(planVerification(packs, {
  packIds:["project_management"], changedPaths:modifiedGeneratedArtifact.paths,
  changeSet:modifiedGeneratedArtifact, basePacks:packs,
}).packIds, ["project_management"],
"a modified generated artifact remains excluded before isolated-handler history lookup");

const deletedProjectPresentation = projectHistoryChange({
  status:"D", path:"src/data-layer-assignment-routing-ui.ts",
});

assert.deepEqual(planVerification(packs, {
  changedPaths:deletedProjectPresentation.paths, changeSet:deletedProjectPresentation, basePacks:packs,
}).packIds, ["project_management"], "a deleted presentation retains its historical owner-only boundary");

const renamedBetweenPresentations = projectHistoryChange({status:"R", score:100,
  oldPath:"src/data-layer-assignment-routing-ui.ts",
  newPath:"src/data-layer-project-library-presentation-ui.ts"});

assert.deepEqual(planVerification(packs, {
  changedPaths:renamedBetweenPresentations.paths, changeSet:renamedBetweenPresentations, basePacks:packs,
}).packIds, ["project_management"], "a presentation-to-presentation rename remains owner-only");

const renamedIntoPersistence = projectHistoryChange({status:"R", score:100,
  oldPath:"src/data-layer-assignment-routing-ui.ts", newPath:"src/data-layer-project-library.ts"});

assert.deepEqual(planVerification(packs, {
  changedPaths:renamedIntoPersistence.paths, changeSet:renamedIntoPersistence, basePacks:packs,
}).packIds, projectClosure, "a presentation-to-propagating rename unions to the ten-pack closure");

assert.deepEqual(planVerification(packs, {
  changedPaths:deletedProjectPresentation.paths, changeSet:deletedProjectPresentation,
  basePacks:packs, historicalRegistryFallback:true,
}).packIds, planVerification(packs, {terminalFull:true}).packIds,
"an unreadable historical project boundary falls back to every runnable pack");

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

const baseProjectManagementPack = vtd004BasePacks.find(({ id }) => id === "project_management");

const projectEvidenceProfile = conservedEvidenceProfile(projectManagementPack);

const projectExecutionProfile = Object.fromEntries(exactEvidenceKeys.map((key) => [key,
  projectManagementPack[key].filter((path) => !vtd006RegisteredPrograms.has(path)),
]));

assert.deepEqual(projectEvidenceProfile, {...conservedEvidenceProfile(baseProjectManagementPack),
  unit:[...conservedEvidenceProfile(baseProjectManagementPack).unit.slice(0, 3),
    "test/data-layer-project-library-transport-test.mjs",
    "test/data-layer-flow-visual-asset-portability-test.mjs",
    ...conservedEvidenceProfile(baseProjectManagementPack).unit.slice(3)],
  property:[...conservedEvidenceProfile(baseProjectManagementPack).property.slice(0, 3),
    "test/data-layer-flow-visual-asset-portability-property-test.mjs",
    ...conservedEvidenceProfile(baseProjectManagementPack).property.slice(3)]},
"all exact project-management evidence identities are conserved from the accepted base");

const exactProjectPlan = planVerification(packs, {packIds:["project_management"], includeProperties:true});

for (const [key, taskKey] of [["unit", "unitTasks"], ["property", "propertyTasks"],
  ["features", "parserTasks"], ["browserAdapters", "browserTasks"]]) {
  assert.deepEqual(exactProjectPlan[taskKey].map(({ target }) => target).sort(),
    [...projectExecutionProfile[key]].sort(), `${key} evidence executes exactly once by identity`);
}

assert.deepEqual(exactProjectPlan.sessionTasks.map(({ packId }) => packId), ["project_management"],
  "the one exact owner session consumes the one isolated project-management handler");

const vtd008BasePacks = JSON.parse(await exec("git", ["show", "0adee4fa84:verification/packs.json"]));

const baseTerminalPlan = planVerification(vtd008BasePacks,
  {terminalFull:true,historicalRegistryFallback:true});

const currentTerminalPlan = planVerification(packs, {terminalFull:true});

const vtd006ProgramMigration = new Map([
  ["test/browser-packs/side-panel-capture.mjs", "test/side-panel-component-layout-runtime-test.mjs"],
  ["test/browser-packs/side-panel-event-library.mjs", "test/side-panel-component-layout-runtime-test.mjs"],
  ["test/browser-packs/side-panel-schemas.mjs", "test/side-panel-component-layout-runtime-test.mjs"],
  ["test/browser-packs/side-panel-defects.mjs", "test/side-panel-component-layout-runtime-test.mjs"],
  ["test/browser-packs/side-panel-shell.mjs", "test/side-panel-component-layout-runtime-test.mjs"],
]);

const vtd015Feature = "features/settled-candidate-final-verification.feature";

const vtd015Generated = "build/acceptance/generated/features-settled-candidate-final-verification-feature_acceptance_test.clj";

const vtd015Ir = "build/acceptance/ir/settled-candidate-final-verification.json";

const vtd015FeatureSource = await readFile(vtd015Feature, "utf8");

const vtd017Feature = "features/verification-shared-artifact-parallel-execution.feature";

const vtd017Generated =
  "build/acceptance/generated/features-verification-shared-artifact-parallel-execution-feature_acceptance_test.clj";

const vtd017Ir = "build/acceptance/ir/verification-shared-artifact-parallel-execution.json";

const autonomyFeature = "features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature";

const autonomyGenerated =
  "build/acceptance/generated/features-swarmforge-outcome-bounded-autonomy-and-unblockers-feature_acceptance_test.clj";

const autonomyIr = "build/acceptance/ir/swarmforge-outcome-bounded-autonomy-and-unblockers.json";

const migratedVerificationFeature = "features/modular-verification-packs.feature";

const migratedVerificationAcceptanceArtifacts = [
  "build/acceptance/generated/features-modular-verification-packs-feature_acceptance_test.clj",
  "build/acceptance/ir/modular-verification-packs.json",
];

const documentationTemplateFeatures = [
  "features/data-layer-documentation-template-library.feature",
  "features/data-layer-documentation-template-library-runtime.feature",
  "features/data-layer-excel-documentation-templates.feature",
  "features/data-layer-excel-documentation-templates-runtime.feature",
  "features/data-layer-rich-page-documentation-templates.feature",
  "features/data-layer-rich-page-documentation-templates-runtime.feature",
];

const documentationTemplateAcceptanceArtifacts = documentationTemplateFeatures.flatMap((feature) => {
  const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
  const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
    .replace(/(^-+|-+$)/gu, "");
  return [
    `build/acceptance/generated/${slug}_acceptance_test.clj`,
    `build/acceptance/ir/${basename}.json`,
  ];
});

const compactReorderableEditorFeatures = [
  "features/data-layer-compact-reorderable-editor-controls.feature",
  "features/data-layer-compact-reorderable-editor-controls-runtime.feature",
];

const compactReorderableEditorAcceptanceArtifacts = compactReorderableEditorFeatures
  .flatMap((feature) => {
    const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
    const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
      .replace(/(^-+|-+$)/gu, "");
    return [
      `build/acceptance/generated/${slug}_acceptance_test.clj`,
      `build/acceptance/ir/${basename}.json`,
    ];
  });

const normalizedVtd006Identity = (task) => {
  let encoded = JSON.stringify(verificationTaskIdentity(task));
  for (const [current, previous] of vtd006ProgramMigration) encoded = encoded.replaceAll(current, previous);
  const identity = JSON.parse(encoded);
  if (identity.stage === "browser-observation" &&
      identity.logicalTargetIds?.includes("LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER")) {
    const targetId = "LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER";
    identity.key = identity.key.replace(`${targetId}+`, "");
    identity.args = identity.args.filter((value) => value !== targetId);
    identity.target = identity.target.split(",")
      .filter((value) => value !== targetId).join(",");
    delete identity.environment[targetId];
    identity.logicalTargetIds = identity.logicalTargetIds
      .filter((value) => value !== targetId);
    identity.aliasCommands = identity.aliasCommands.filter((command) =>
      !command.includes(targetId));
  }
  if (identity.stage === "browser-observation" &&
      identity.logicalTargetIds?.includes("FLOW_STYLESHEET_EXTRACTION_TARGET")) {
    identity.key = identity.key.replace("+FLOW_STYLESHEET_EXTRACTION_TARGET", "");
    identity.args = identity.args.filter((value) => value !== "FLOW_STYLESHEET_EXTRACTION_TARGET");
    identity.target = identity.target.split(",")
      .filter((value) => value !== "FLOW_STYLESHEET_EXTRACTION_TARGET").join(",");
    delete identity.environment.FLOW_STYLESHEET_EXTRACTION_TARGET;
    identity.logicalTargetIds = identity.logicalTargetIds
      .filter((value) => value !== "FLOW_STYLESHEET_EXTRACTION_TARGET");
    identity.aliasCommands = identity.aliasCommands.filter((command) =>
      !command.includes("FLOW_STYLESHEET_EXTRACTION_TARGET"));
  }
  if (identity.key === "acceptance-session:shell") {
    identity.args = identity.args.filter((value) =>
      ![vtd015Generated, vtd015Ir, vtd017Generated, vtd017Ir,
        autonomyGenerated, autonomyIr,...migratedVerificationAcceptanceArtifacts,
        ...compactReorderableEditorAcceptanceArtifacts].includes(value));
    identity.target = identity.target.split(",")
      .filter((value) => ![vtd015Feature, vtd017Feature, autonomyFeature,
        migratedVerificationFeature,...compactReorderableEditorFeatures].includes(value)).join(",");
  }
  if (identity.key === "acceptance-session:flow_export") {
    identity.args = identity.args.filter((value) =>
      !documentationTemplateAcceptanceArtifacts.includes(value));
    identity.target = identity.target.split(",")
      .filter((value) => !documentationTemplateFeatures.includes(value)).join(",");
  }
  return identity;
};

const expectedVtd014TerminalIdentity = (task) => {
  const identity = normalizedVtd006Identity(task);
  const capabilities = new Map([
    ["test/flow-examples-timing-test.mjs", ["local-loopback"]],
    ["test/headless-chrome-lifecycle-test.mjs", ["local-loopback"]],
    ["test/verification-process-contract-test.mjs", ["local-loopback"]],
  ]).get(identity.target);
  if (capabilities) identity.requiredCapabilities = capabilities;
  return identity;
};

const terminalIdentities = (plan) => plan.tasks.map(normalizedVtd006Identity);

const expectedTerminalIdentities = (plan) => plan.tasks.map(expectedVtd014TerminalIdentity);

const acceptedTerminalIdentities = baseTerminalPlan.tasks.filter(({ key }) =>
  key !== "unit:test/verification-process-contract-test.mjs")
  .map(expectedVtd014TerminalIdentity);

const registeredTaskKeys = (registry) => new Set(registry.flatMap((pack) => [
  ...(pack.unit??[]).map((target) => `unit:${target}`),
  ...(pack.property??[]).map((target) => `property:${target}`),
  ...(pack.features??[]).flatMap((target) => [
    `acceptance-parse:${target}`, `acceptance-generate:${target}`,
  ]),
  ...(pack.checkpointCommands??[]).map(({ id }) => `checkpoint:${pack.id}:${id}`),
  ...((pack.features??[]).length ? [`acceptance-session:${pack.id}`] : []),
]));

const acceptedRegisteredTaskKeys = registeredTaskKeys(vtd008BasePacks);

const postBaseAddedRegisteredTaskKeys = new Set([...registeredTaskKeys(packs)]
  .filter((key) => !acceptedRegisteredTaskKeys.has(key)));

const approvedVtd015TaskKeys = new Set([
  "unit:test/settled-final-verification-workflow-test.mjs",
  `acceptance-parse:${vtd015Feature}`,
  `acceptance-generate:${vtd015Feature}`,
]);

const approvedVtd017TaskKeys = new Set([
  `acceptance-parse:${vtd017Feature}`,
  `acceptance-generate:${vtd017Feature}`,
]);

const approvedAutonomyTaskKeys = new Set([
  "unit:test/swarmforge-outcome-bounded-autonomy-test.mjs",
  "unit:test/stacked-campsite-control-test.mjs",
  "property:test/swarmforge-outcome-bounded-autonomy-property-test.mjs",
  `acceptance-parse:${autonomyFeature}`,
  `acceptance-generate:${autonomyFeature}`,
]);

const approvedDocumentationTemplateTaskKeys = new Set(documentationTemplateFeatures
  .flatMap((feature) => [
    `acceptance-parse:${feature}`,
    `acceptance-generate:${feature}`,
  ]));

const approvedCompactReorderableEditorTaskKeys = new Set([
  ...compactReorderableEditorFeatures.flatMap((feature) => [
    `acceptance-parse:${feature}`,
    `acceptance-generate:${feature}`,
  ]),
  "browser-observation:REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
]);

const approvedStyleSmokeTaskKeys = new Set([
  "browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
  "browser-observation:SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
]);

const approvedStyleVerificationTaskKeys = new Set([
  "unit:test/package-clean-checkout-contract-test.mjs",
  "unit:test/verification-evidence-production-path-test.mjs",
  "property:test/stylesheet-declarations-property-test.mjs",
]);

const approvedFlowStyleExtractionTaskKeys = new Set([
  "unit:test/flow-stylesheet-extraction-test.mjs",
]);

const approvedSidePanelCompatibilityCheckpointTaskKeys = new Set([
  "checkpoint:schemas:side-panel-direct-compatibility-capture",
  "checkpoint:shell:side-panel-direct-compatibility-validation",
]);

const approvedVerificationTaskKeys = new Set([
  ...approvedVtd015TaskKeys,
  ...approvedVtd017TaskKeys,
  ...approvedAutonomyTaskKeys,
  ...approvedDocumentationTemplateTaskKeys,
  ...approvedCompactReorderableEditorTaskKeys,
  ...approvedStyleSmokeTaskKeys,
  ...approvedStyleVerificationTaskKeys,
  ...approvedFlowStyleExtractionTaskKeys,
  ...approvedSidePanelCompatibilityCheckpointTaskKeys,
]);

const currentTerminalIdentitiesWithoutApprovedAdditions = currentTerminalPlan.tasks.filter(({ key }) =>
  !postBaseAddedRegisteredTaskKeys.has(key) && !approvedVerificationTaskKeys.has(key)).map(normalizedVtd006Identity);

assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions,
  acceptedTerminalIdentities,
  "terminal-full planning conserves the accepted base identities around approved added units");

assert.equal(currentTerminalPlan.tasks.filter(({ key }) =>
  key === "unit:test/command-palette-installed-controller-test.mjs").length, 1,
"terminal-full planning adds the installed Command Palette controller regression exactly once");

assert.equal(currentTerminalPlan.tasks.filter(({ key }) =>
  key === "unit:test/hotkey-installed-controller-test.mjs").length, 1,
"terminal-full planning adds the installed Hotkeys controller regression exactly once");

assert.equal(currentTerminalPlan.tasks.filter(({ key }) =>
  key === "unit:test/flow-reload-lifecycle-test.mjs").length, 1,
"terminal-full planning adds the Flow reload lifecycle regression exactly once");

assert.equal(currentTerminalPlan.tasks.filter(({ key }) =>
  key === "unit:test/workspace-tabs-installed-controller-test.mjs").length, 1,
"terminal-full planning adds the installed workspace-tabs controller regression exactly once");

assert.equal(currentTerminalPlan.tasks.filter(({ key }) =>
  key === "unit:test/data-layer-flow-concept-visual-test.mjs").length, 1,
"terminal-full planning adds the registry-approved Flow concept visual regression exactly once");

for (const taskKey of approvedVtd015TaskKeys) {
  assert.equal(currentTerminalPlan.tasks.filter(({ key }) => key === taskKey).length, 1,
    `terminal-full planning adds the approved VTD-015 task ${taskKey} exactly once`);
}

for (const taskKey of approvedVtd017TaskKeys) {
  assert.equal(currentTerminalPlan.tasks.filter(({ key }) => key === taskKey).length, 1,
    `terminal-full planning adds the approved VTD-017 task ${taskKey} exactly once`);
}

for (const taskKey of approvedStyleVerificationTaskKeys) {
  assert.equal(currentTerminalPlan.tasks.filter(({ key }) => key === taskKey).length, 1,
    `terminal-full planning adds the approved style-verification task ${taskKey} exactly once`);
}

for (const taskKey of approvedFlowStyleExtractionTaskKeys) {
  assert.equal(currentTerminalPlan.tasks.filter(({ key }) => key === taskKey).length, 1,
    `terminal-full planning adds the approved Flow style-extraction task ${taskKey} exactly once`);
}

assert.equal(currentTerminalPlan.observationTasks.filter(({ logicalTargetIds }) =>
  logicalTargetIds?.includes("FLOW_STYLESHEET_EXTRACTION_TARGET")).length, 1,
"terminal-full planning adds the approved Flow stylesheet logical target exactly once");

assert.equal(currentTerminalPlan.tasks.filter(({ target }) =>
  target === "test/acceptance/side-panel-browser-session-contract.mjs").length, 0,
"terminal-full planning does not add the focused VTD-006 session contract as a permanent task");

assert.equal(currentTerminalPlan.checkpointTasks.filter(({ display }) =>
  display === "npm run package").length, 1,
"terminal-full planning executes the package check exactly once");

const currentOtherPackRows = vtd004CompletedProjectCalibration.runnablePacks.filter(({ id }) =>
  id !== "project_management");

const baseOtherPackRows = vtd004BaseCalibration.runnablePacks.filter(({ id }) =>
  id !== "project_management");

assert.deepEqual(currentOtherPackRows, baseOtherPackRows,
  "the other 19 calibrated pack rows remain byte-equivalent to the accepted base");

assert.deepEqual(vtd004CompletedProjectCalibration.browserTargets, vtd004BaseCalibration.browserTargets,
  "all 81 browser-target calibration rows remain byte-equivalent to the accepted base");

const calibrationProvenanceKeys = ["version", "implementationCommit", "environmentClassId", "environment",
  "sourceScope", "minimumIndependentSamples", "tolerance", "receiptDigests", "algorithm"];

const calibrationProvenance = (calibration) => Object.fromEntries(calibrationProvenanceKeys.map((key) =>
  [key, calibration[key]]));

assert.deepEqual(calibrationProvenance(vtd004CompletedProjectCalibration),
  calibrationProvenance(vtd004BaseCalibration),
  "accepted calibration receipt scope and provenance remain byte-equivalent");

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

const durableBasePacks = JSON.parse(await exec("git", ["show", "2d46bc7062:verification/packs.json"]));

const durableBaseCalibration = JSON.parse(await exec("git", [
  "show", "2d46bc7062:verification/performance-calibration.json",
]));

const durableCompletedCalibration = JSON.parse(await exec("git", [
  "show", "82e704bdc8:verification/performance-calibration.json",
]));

assert.deepEqual(durablePack.impactBoundaries.map(({id,sourceClass,propagateDependants}) =>
  [id,sourceClass,propagateDependants]), [
  ["durable_repository_persistence", "persistence migration", true],
  ["durable_production_semantic", "core or semantic", true],
  ["durable_repository_controller", "application controller", true],
  ["durable_repository_presentation", "browser presentation", false],
  ["durable_runtime_controller", "application controller", true],
  ["durable_page_history_semantic", "core or semantic", true],
  ["durable_saved_schema_feed_semantic", "core or semantic", true],
  ["durable_project_installed_side_panel_boundary", "application controller", false],
], "durable repository source classes and propagation are explicit registry data");

const durablePresentationPath = "src/data-layer-durable-project-repository-presentation-ui.ts";

const durableControllerPath = "src/data-layer-durable-project-repository-ui.ts";

const durablePresentationSource = await readFile(new URL(`../../${durablePresentationPath}`, import.meta.url), "utf8");

const durableControllerSource = await readFile(new URL(`../../${durableControllerPath}`, import.meta.url), "utf8");

assert.match(durableControllerSource, /data-layer-durable-project-repository-presentation-ui\.js/u,
  "the durable controller delegates display work through the extracted module");

assert.doesNotMatch(durablePresentationSource,
  /indexedDB|localStorage|sessionStorage|navigator\.storage|data-layer-durable-project-repository\.js|runtime-core|production-model|compact-canonical-history|saved-schema-feed/u,
  "the presentation boundary cannot read durable state or import semantic owners");

const durableClosure = ["durable_project_repository", "flow_graph", "flow_export", "live_flow_testing",
  "layered_schema", "property_set_flow_sections"];

const durableCurrentPaths = [durablePresentationPath, "src/data-layer-durable-project-repository.ts",
  "src/data-layer-production-model.ts", durableControllerPath, "src/data-layer-durable-project-runtime.ts",
  "src/data-layer-compact-canonical-history.ts", "src/utilities/data-layer/saved-schema-feed.ts"];

assert.deepEqual(planVerification(packs, {changedPaths:[durablePresentationPath]}).packIds,
  ["durable_project_repository"], "the display-only path selects only its complete owner pack");

for (const changedPath of durableCurrentPaths.slice(1)) assert.deepEqual(
  planVerification(packs, {changedPaths:[changedPath]}).packIds, durableClosure,
  `${changedPath} retains the six-pack dependant closure`);

const durableHandlerPath = durablePack.isolatedVerificationHandlers[0];

assert.equal(durableHandlerPath, "acceptance/src/acceptance/steps/durable_project_repository.clj");

const durableNamespace = "acceptance.steps.durable-project-repository";

const durableHandlerSource = await readFile(new URL(`../../${durableHandlerPath}`, import.meta.url), "utf8");

const durableServedFeatures = [...durableHandlerSource.matchAll(
  /"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)].map((match) => match[1]);

assert.deepEqual([...durableServedFeatures].sort(), [...durablePack.features].sort());

const durableConsumers = [];

for (const handlerPath of registeredHandlerPaths) {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
  if (handlerPath !== durableHandlerPath && clojureRequiresNamespace(source, durableNamespace)) durableConsumers.push(handlerPath);
}

assert.deepEqual(durableConsumers, [], "the isolated durable handler has no cross-pack APS consumer");

const durableCrossPackHandler = packs.find(({id,handlers}) =>
  id !== "durable_project_repository" && handlers?.length).handlers[0];

await assert.rejects(() => validateIsolatedVerificationHandlers(packs, {readSource:async(handlerPath) => {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
  return handlerPath === durableCrossPackHandler
    ? `${source}\n[acceptance.steps.durable-project-repository :refer [handlers]]\n` : source;
}}), /Cross-pack handler consumer/u, "a cross-pack :refer consumer blocks durable handler isolation");

const deletedDurablePresentation = syntheticChangeSet([{status:"D",path:durablePresentationPath}]);

const renamedDurablePresentation = syntheticChangeSet([{status:"R",score:100,
  oldPath:durablePresentationPath,newPath:durableControllerPath}]);

assert.deepEqual(planVerification(packs, {changedPaths:deletedDurablePresentation.paths,
  changeSet:deletedDurablePresentation,basePacks:packs}).packIds, ["durable_project_repository"]);

assert.deepEqual(planVerification(packs, {changedPaths:renamedDurablePresentation.paths,
  changeSet:renamedDurablePresentation,basePacks:packs}).packIds, durableClosure);

assert.deepEqual(planVerification(packs, {changedPaths:deletedDurablePresentation.paths,
  changeSet:deletedDurablePresentation,basePacks:packs,historicalRegistryFallback:true}).packIds,
  planVerification(packs, {terminalFull:true}).packIds);

const durableEvidenceProfile = conservedEvidenceProfile(durablePack);

const durableBasePack = durableBasePacks.find(({id}) => id === "durable_project_repository");

assert.deepEqual(durableEvidenceProfile,
  conservedEvidenceProfile(durableBasePack),
  "all durable owner evidence identities remain conserved");

const exactDurablePlan = planVerification(packs, {packIds:["durable_project_repository"],includeProperties:true});

assert.deepEqual(exactDurablePlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort(),
  ["DURABLE_REPOSITORY_STORAGE_TARGET", "DURABLE_REPOSITORY_REVISION_TARGET",
    "DURABLE_RENDERER_CORPUS_TARGET", "DURABLE_RENDERER_HISTORY_TARGET"].sort());

const durableAssertionLeafCount = durablePack.browserEvidencePartitions.flatMap(({originalLeaves}) => originalLeaves).length;

assert.equal(durableAssertionLeafCount, 111);

assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities,
  "terminal planning conserves every exact durable task identity");

const durableCurrentCalibration = durableCompletedCalibration.runnablePacks.find(({id}) =>
  id === "durable_project_repository");

assert.deepEqual({selectedPacks:durableCurrentCalibration.selectedPacks,
  fanOut:durableCurrentCalibration.changedPathFanOut.limit,
  duration:[durableCurrentCalibration.changedPathDuration.baseline,
    durableCurrentCalibration.changedPathDuration.tolerance,durableCurrentCalibration.changedPathDuration.limit]},
{selectedPacks:["durable_project_repository"],fanOut:0,duration:[90.2,1.2,109]});

const durableOtherCurrent = durableCompletedCalibration.runnablePacks.filter(({id}) => id !== "durable_project_repository");

const durableOtherBase = durableBaseCalibration.runnablePacks.filter(({id}) => id !== "durable_project_repository");

assert.deepEqual(durableOtherCurrent,durableOtherBase);

assert.deepEqual(durableCompletedCalibration.browserTargets,durableBaseCalibration.browserTargets);

assert.deepEqual(calibrationProvenance(durableCompletedCalibration),calibrationProvenance(durableBaseCalibration));

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
  modulePath.startsWith("test/support/") ||
  modulePath === "test/browser-packs/shared-harness.mjs"));

const testImportTargetSet = new Set([...sourceModulePaths, ...testHelperSet]);

const trackedLiteralTargetSet = new Set((await verificationInventory()).tracked.filter((trackedPath) =>
  trackedPath !== "dist" && !trackedPath.startsWith("dist/") &&
  trackedPath !== "verification/packs.json"));

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

const approvedFlowStyleAuditPaths = new Set([
  "src/flow-graph/flow-workspace.css",
  "src/flow-graph/flow-workspace-shell.css",
]);

const observedFlowStyleAuditPaths = new Set();

for (const edge of crossPackCodeEdges) {
  if (!requiredPathImpacts.has(edge.requiredPath)) {
    requiredPathImpacts.set(edge.requiredPath,
      planVerification(packs, { changedPaths:[edge.requiredPath] }).packIds);
  }
  const globalStylesheetRead = stylesheetDeclarationFor(packs, edge.requiredPath)?.classification === "global";
  const flowStyleAuditRead = edge.requiringPath ===
      "test/verification-contracts/registry-inventory-contract-test.mjs" &&
    approvedFlowStyleAuditPaths.has(edge.requiredPath);
  if (flowStyleAuditRead) observedFlowStyleAuditPaths.add(edge.requiredPath);
  if (!globalStylesheetRead && !flowStyleAuditRead &&
      !requiredPathImpacts.get(edge.requiredPath).includes(edge.requiringOwner)) {
    codeReachabilityGaps.push(edge);
  }
}

assert.deepEqual(observedFlowStyleAuditPaths, approvedFlowStyleAuditPaths,
"the Flow stylesheet process audit accounts for its exact verification-only inputs");

const codeReachabilityGapSummary = {};

for (const edge of codeReachabilityGaps) {
  const pair = `${edge.requiringOwner} -> ${edge.requiredOwner}`;
  const examples = codeReachabilityGapSummary[pair] ?? [];
  const example = `${edge.requiringPath} -> ${edge.requiredPath}`;
  if (!examples.includes(example)) examples.push(example);
  codeReachabilityGapSummary[pair] = examples;
}

assert.deepEqual(codeReachabilityGapSummary, {},
  "every direct verification-consumer import and literal file read has dependency, " +
  "shared-component, or global-impact reachability");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const normalized = (value) => Array.isArray(value) ? value.map(normalized)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalized(nested)]))
      : value;
  const digest = (value) => createHash("sha256")
    .update(JSON.stringify(normalized(value))).digest("hex");
  const expectedPreRepairFailure = { directConsumerReachabilityGaps:{
    "command-palette -> shell":[
      "test/command-palette-installed-controller-test.mjs -> src/data-layer-installed/runtime.ts",
    ],
    "hotkeys -> shell":[
      "test/hotkey-installed-controller-test.mjs -> src/data-layer-installed/runtime.ts",
    ],
  } };
  const expectedRepairResult = { directConsumerReachabilityGaps:{} };
  const fixture = {
    id:"verification-consumer-ownership-boundary-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{ compositionContractOwner:"shell", utilityOwners:["command-palette", "hotkeys"] },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const repairResult = { directConsumerReachabilityGaps:codeReachabilityGapSummary };
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

const studioStylePlan = stylesheetPlanFor(packs, "specification-builder-brand.css");

assert.deepEqual(studioStylePlan.styleSmokeTargets, ["STUDIO_GLOBAL_STYLE_SMOKE_TARGET"],
  "global stylesheet planning exposes only its declared studio smoke target");

assert.deepEqual(studioStylePlan.declaration.consumers, [],
  "global stylesheet QA does not convert readers into owner/consumer packs");

const studioStyleImpact = planVerification(packs, {
  changedPaths:["specification-builder-brand.css"],
});

assert.deepEqual(studioStyleImpact.observationTasks.map(({ key }) => key), [
  "browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
], "global feature CSS schedules only its exact declared smoke target");

assert.deepEqual(studioStyleImpact.selectedPackIds, [],
  "global feature CSS does not claim the shell pack as a selected consumer");

assert.deepEqual(studioStyleImpact.adapterAuthorizationPackIds, ["shell"],
  "global smoke scheduling carries separate adapter authorization metadata");

assert.equal(studioStyleImpact.unitTasks.length, 0,
  "global feature CSS does not select unrelated owner unit tasks");

const styleFixtureDeclaration = (source, classification, owner, consumers = []) => ({
  source, destination:source, classification, owner, consumers, qaTargets:[],
  scopeRoot:classification === "global" ? null : ".documentary-flow",
});

const styleFixtureRegistry = (source, declaration) => packs.map((pack) => pack.id === declaration.owner
  ? { ...pack, source:[...(pack.source ?? []), source],
    stylesheets:[...(pack.stylesheets ?? []), declaration] } : pack);

const styleBoundaryEvidence = {};

for (const [label, source, declaration, expectedScope] of [
  ["valid feature-local presentation", "flow-workspace.css",
    styleFixtureDeclaration("flow-workspace.css", "feature-local", "flow_graph"), "flow_graph"],
  ["valid feature-to-shell bridge", "flow-workspace-shell.css",
    styleFixtureDeclaration("flow-workspace-shell.css", "shell-bridge", "flow_graph", ["shell"]),
    "flow_graph and shell"],
]) {
  const registry = styleFixtureRegistry(source, declaration);
  const stylePlan = stylesheetPlanFor(registry, source);
  const reviewPlan = planVerification(registry, { changedPaths:[source] });
  styleBoundaryEvidence[label] = {
    plannerInvoked:Boolean(stylePlan), reviewEvidencePath:Boolean(reviewPlan),
    selected:stylePlan.selected.join(" and "), selectedPackIds:reviewPlan.selectedPackIds,
    terminalFullObligation:stylePlan.terminalFullObligation,
    terminalFullObligations:reviewPlan.terminalFullObligations,
    taskCount:reviewPlan.tasks.length, expectedScope,
  };
}

styleBoundaryEvidence["shared global presentation foundation"] = {
  plannerInvoked:Boolean(studioStylePlan), reviewEvidencePath:Boolean(studioStyleImpact),
  selected:studioStylePlan.selected.join(" and ") || "declared QA targets",
  selectedPackIds:studioStyleImpact.selectedPackIds,
  styleSmokeTargets:studioStylePlan.styleSmokeTargets,
  terminalFullObligation:studioStylePlan.terminalFullObligation,
  terminalFullObligations:studioStyleImpact.terminalFullObligations,
  taskCount:studioStyleImpact.tasks.length, expectedScope:"declared QA targets",
};

const invalidStyleDeclaration = {
  ...styleFixtureDeclaration("invalid-boundary.css", "global", "shell"), qaTargets:[],
};

let invalidStyleBlocked = false;

try {
  validateStylesheetDeclarations([invalidStyleDeclaration], {
    packIds:["shell"], sourcePaths:["invalid-boundary.css"],
  });
} catch { invalidStyleBlocked = true; }

styleBoundaryEvidence["invalid or undeclared boundary"] = {
  plannerInvoked:false, reviewEvidencePath:false, selected:"no task launch",
  selectedPackIds:[], styleSmokeTargets:[], terminalFullObligation:false,
  terminalFullObligations:[], taskCount:0, expectedScope:"no task launch",
  validationBlocked:invalidStyleBlocked,
};

vtd014Evidence.styles = styleBoundaryEvidence;

const flowLocalStylesheet = await readFile("src/flow-graph/flow-workspace.css", "utf8");

const flowShellStylesheet = await readFile("src/flow-graph/flow-workspace-shell.css", "utf8");

const studioBaseStylesheet = await readFile("specification-builder.css", "utf8");

const studioBrandStylesheet = await readFile("specification-builder-brand.css", "utf8");

const studioDocument = await readFile("specification-builder.html", "utf8");

const flowExtractionBase = "66b91e38e6";

const approvedFlowSnapStyleAdditions = [
  { context:"", selector:".documentary-flow circle[data-flow-port-for].is-valid-target",
    declarations:"fill:#d9f7df;stroke:#137333;stroke-width:5" },
  { context:"", selector:'.documentary-flow .flow-canvas-scroll.is-connecting .flow-graph-canvas[data-semantic-detail="identity"] .flow-node',
    declarations:"display:inline" },
];

const flowSnapPreviewAfter = { context:"", selector:".documentary-flow .flow-connection-preview",
  declarations:"stroke:#f07c00;stroke-width:3;stroke-dasharray:6 4;pointer-events:none" };

const flowSnapPreviewBefore = { ...flowSnapPreviewAfter,
  declarations:"stroke:#f07c00;stroke-width:3;stroke-dasharray:6 4" };

const flowStyleRuleIdentity = ({ context, selector, declarations }) =>
  JSON.stringify([context, selector, declarations]);

const serializeFlowStyleRule = ({ context, selector, declarations }) => {
  let source = declarations === ";" ? `${selector};` : `${selector}{${declarations}}`;
  for (const atRule of context.split(" > ").filter(Boolean).reverse()) source = `${atRule}{${source}}`;
  return source;
};

const conservedFlowLocalInventory = stylesheetRuleInventory(flowLocalStylesheet,
  "src/flow-graph/flow-workspace.css");

for (const approved of approvedFlowSnapStyleAdditions) {
  const matches = conservedFlowLocalInventory.flatMap((rule, index) =>
    flowStyleRuleIdentity(rule) === flowStyleRuleIdentity(approved) ? [index] : []);
  assert.equal(matches.length, 1,
    `approved Flow snap style addition occurs exactly once: ${flowStyleRuleIdentity(approved)}`);
  conservedFlowLocalInventory.splice(matches[0], 1);
}

let flowSnapPreviewReplacementCount = 0;

const conservedFlowLocalStylesheet = conservedFlowLocalInventory.map((rule) => {
  if (flowStyleRuleIdentity(rule) !== flowStyleRuleIdentity(flowSnapPreviewAfter)) return rule;
  flowSnapPreviewReplacementCount += 1;
  return flowSnapPreviewBefore;
}).map(serializeFlowStyleRule).join("\n");

assert.equal(flowSnapPreviewReplacementCount, 1,
  "approved Flow snap preview safety replacement occurs exactly once");

const approvedFlowViewerGlobalRules = stylesheetRuleInventory(studioBrandStylesheet,
  "specification-builder-brand.css").filter(({ selector }) =>
  selector === ".twatility-studio dialog.flow-concept-visual-viewer" ||
  selector.startsWith(".twatility-studio .flow-concept-visual-viewer"));

assert.equal(approvedFlowViewerGlobalRules.length, 17,
  "approved Flow concept-visual viewer global rules occur exactly once");

const flowBaseGlobalSources = await Promise.all(["specification-builder.css", "specification-builder-brand.css"]
  .map(async(path)=>({path,source:await exec("git",["show",`${flowExtractionBase}:${path}`])})));

const flowBaseGlobalRuleIdentities = new Set(flowBaseGlobalSources.flatMap(({ path, source }) =>
  stylesheetRuleInventory(source, path)).map(flowStyleRuleIdentity));

const approvedDocumentationGlobalRules = stylesheetRuleInventory(studioBaseStylesheet,
  "specification-builder.css").filter((rule) => rule.selector.startsWith(".documentation-") &&
    !flowBaseGlobalRuleIdentities.has(flowStyleRuleIdentity(rule)));

assert.equal(approvedDocumentationGlobalRules.length, 63,
  "approved Documentation workspace global rules occur exactly once");

const approvedReorderableResponsiveGlobalRules = stylesheetRuleInventory(studioBaseStylesheet,
  "specification-builder.css").filter((rule) =>
    rule.context === "@media(max-width:480px)" &&
    rule.selector.startsWith("[data-reorder-item-row=\"true\"]") &&
    !flowBaseGlobalRuleIdentities.has(flowStyleRuleIdentity(rule)));

assert.equal(approvedReorderableResponsiveGlobalRules.length, 2,
  "approved responsive reorderable-row global rules occur exactly once");

const flowStylesheetConservation = verifyFlowStylesheetConservation({
  baseGlobalSources:flowBaseGlobalSources,
  candidateGlobalSources:[
    {path:"specification-builder.css",source:studioBaseStylesheet},
    {path:"specification-builder-brand.css",source:studioBrandStylesheet},
  ],
  localSource:conservedFlowLocalStylesheet,
  bridgeSource:flowShellStylesheet,
  approvedCandidateGlobalRules:[...approvedFlowViewerGlobalRules, ...approvedDocumentationGlobalRules,
    ...approvedReorderableResponsiveGlobalRules],
});

const flowStylesheetDeclarations = [
  stylesheetDeclarationFor(packs, "src/flow-graph/flow-workspace.css"),
  stylesheetDeclarationFor(packs, "src/flow-graph/flow-workspace-shell.css"),
];

const flowStyleEvidence = {
  declaredBoundaries:flowStylesheetDeclarations.every(Boolean) &&
    flowStylesheetDeclarations[0].classification === "feature-local" &&
    flowStylesheetDeclarations[1].classification === "shell-bridge" &&
    flowStylesheetDeclarations[1].consumers.join() === "shell",
  movedExactlyOnce:flowStylesheetConservation.conservedExactlyOnce &&
    flowStylesheetConservation.baseRuleCount ===
      flowStylesheetConservation.retainedGlobalRuleCount + flowStylesheetConservation.movedRuleCount,
  conservation:flowStylesheetConservation,
  localScoped:!/(?:^|[,{]\s*)(?:body|\.twatility-studio|#project-workspace|#workspace-pane|#project-inspector|\.sticky-tools)\b/mu.test(flowLocalStylesheet),
  bridgeOnly:/#workspace-pane:has\(\.documentary-flow/u.test(flowShellStylesheet) &&
    !/\.flow-node|\.flow-edge|\.flow-lane|\.flow-minimap/u.test(flowShellStylesheet),
  brandTokensGlobal:/--accent:\s*var\(--twa-navy\)/u.test(studioBrandStylesheet) &&
    !/--twa-(?:navy|mustard|paper)\s*:/u.test(flowLocalStylesheet + flowShellStylesheet),
  unrelatedStudioStable:/\.twatility-studio \.project-bar/u.test(studioBrandStylesheet) &&
    !/\.project-bar/u.test(flowLocalStylesheet + flowShellStylesheet),
  installedObservation:true,
  runtimeContract:{
    baseCommit:flowExtractionBase,
    rows:[
      {state:"ordinary canvas with Page and Event cards",viewport:"desktop",displayMode:"ordinary Flow",surfaces:["none"]},
      {state:"selected Page with visible ports",viewport:"360 by 800",displayMode:"ordinary Flow",surfaces:["none"]},
      {state:"open contextual Details and Outline",viewport:"desktop",displayMode:"ordinary Flow",surfaces:["outline","details"]},
      {state:"complete canvas and overlay controls",viewport:"360 by 800",displayMode:"Focus Canvas",surfaces:["outline"]},
    ],
    zooms:[25,100,200],
    observationTask:"browser-observation:FLOW_STYLESHEET_EXTRACTION_TARGET",
    observationPath:"flowGraph.styles.measurements.states",
    resultPaths:{
      equivalence:"flowGraph.styles.equivalence",
      reducedMotion:"flowGraph.styles.reducedMotion",
      forcedColors:"flowGraph.styles.forcedColors",
      keyboardFocus:"flowGraph.styles.keyboardFocus",
      canonicalStable:"flowGraph.styles.canonicalStable",
      packageAssets:"flowGraph.styles.assetsLoaded",
    },
  },
  packageAssets:["flow-graph/flow-workspace.css", "flow-graph/flow-workspace-shell.css"].every((asset) =>
    studioDocument.includes(`href="${asset}"`)),
};

assert.ok(Object.entries(flowStyleEvidence).filter(([, value]) => typeof value === "boolean")
  .every(([, value]) => value), "Flow stylesheet extraction evidence is complete");

vtd014Evidence.flowStyles = flowStyleEvidence;

const smokeAdapterImpact = planVerification(packs, {
  packIds:["shell"], changedPaths:["test/browser-packs/global-style-smoke.mjs"],
});

assert.deepEqual(smokeAdapterImpact.observationTasks.map(({ key }) => key), [
  "browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
  "browser-observation:SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
], "a changed smoke adapter selects exactly its two registered style targets");

assert.doesNotThrow(() => validateStylesheetDeclarations([{
  source:"feature.css", destination:"feature.css", classification:"feature-local", owner:"shell",
  consumers:[], qaTargets:[], scopeRoot:".documentary-flow",
}], { packIds:["shell"], sourcePaths:["feature.css"], stylesheetContents:{
  "feature.css":".documentary-flow { color: red; @media (forced-colors: active) { .documentary-flow .node { color: CanvasText; } } }",
} }), "nested at-rules remain within a feature-local scope root");

assert.throws(() => validateStylesheetDeclarations([{
  source:"global.css", destination:"global.css", classification:"global", owner:"shell",
  consumers:[], qaTargets:[], scopeRoot:null,
}], { packIds:["shell"], sourcePaths:["global.css"] }), /QA smoke targets/u,
"global styles fail closed when their exact smoke targets are absent");

assert.throws(() => validateStylesheetDeclarations([{
  source:"global.css", destination:"global.css", classification:"global", owner:"shell",
  consumers:["shell"], qaTargets:["STUDIO_GLOBAL_STYLE_SMOKE_TARGET"], scopeRoot:null,
}], { packIds:["shell"], sourcePaths:["global.css"] }), /consumer/u,
"global styles fail closed when the owner is repeated as a consumer");

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
