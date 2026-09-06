import { assertProjectDialogAdditions, boundaryRows, currentProjectBoundaries, projectDialogHandlers, projectDialogPaths } from "../project-library-dialogs/registry-contract.mjs";
import assert from "node:assert/strict";
import {projectAcceptanceSessionToBaseline} from "./acceptance-history-projection.mjs";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { clojureRequiresNamespace, loadVerificationPacks, validateIsolatedVerificationHandlers } from "../../scripts/verification-registry/validation.mjs";
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
assert.deepEqual(boundaryRows(projectManagementPack), currentProjectBoundaries,
  "project-management source classes and propagation are explicit production registry data");
assert.deepEqual(projectManagementPack.isolatedVerificationHandlers, projectDialogHandlers,
  "the project-management APS handler is explicitly isolated");
assertProjectDialogAdditions(projectManagementPack);
const projectHandlerPath = "acceptance/src/acceptance/steps/project_management.clj";
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
assert.deepEqual([...projectServedFeatures].sort(), [...projectManagementPack.features].filter(path => !projectDialogPaths.has(path)).sort(),
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
  assert.equal(plan.unitTasks.length, projectManagementPack.unit.length);
  assert.equal(plan.propertyTasks.length, 5);
  assert.equal(plan.sessionTasks.length, 1);
  assert.equal(plan.parserTasks.length, projectManagementPack.features.length);
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
    !sidePanelPreparationProgram(path) && !projectDialogPaths.has(path)),
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
const sidePanelPaperFirstBrandFeatures = [
  "features/side-panel-paper-first-brand-alignment.feature",
  "features/side-panel-paper-first-brand-alignment-runtime.feature",
];
const sidePanelPaperFirstBrandAcceptanceArtifacts = sidePanelPaperFirstBrandFeatures
  .flatMap((feature) => {
    const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
    const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
      .replace(/(^-+|-+$)/gu, "");
    return [
      `build/acceptance/generated/${slug}_acceptance_test.clj`,
      `build/acceptance/ir/${basename}.json`,
    ];
  });
const schemaEditorReachabilityFeatures = [
  "features/data-layer-side-panel-schema-editor-reachability.feature",
  "features/data-layer-side-panel-schema-editor-reachability-runtime.feature",
];
const schemaEditorReachabilityAcceptanceArtifacts = schemaEditorReachabilityFeatures
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
  const identity = projectAcceptanceSessionToBaseline(JSON.parse(encoded), vtd008BasePacks);
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
        ...compactReorderableEditorAcceptanceArtifacts,
        ...sidePanelPaperFirstBrandAcceptanceArtifacts].includes(value));
    identity.target = identity.target.split(",")
      .filter((value) => ![vtd015Feature, vtd017Feature, autonomyFeature,
        migratedVerificationFeature,...compactReorderableEditorFeatures,
        ...sidePanelPaperFirstBrandFeatures].includes(value)).join(",");
  }
  if (identity.key === "acceptance-session:flow_export") {
    identity.args = identity.args.filter((value) =>
      !documentationTemplateAcceptanceArtifacts.includes(value));
    identity.target = identity.target.split(",")
      .filter((value) => !documentationTemplateFeatures.includes(value)).join(",");
  }
  if (identity.key === "acceptance-session:schemas") {
    identity.args = identity.args.filter((value) =>
      !schemaEditorReachabilityAcceptanceArtifacts.includes(value));
    identity.target = identity.target.split(",")
      .filter((value) => !schemaEditorReachabilityFeatures.includes(value)).join(",");
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
const approvedSchemaEditorReachabilityTaskKeys = new Set([
  "browser:test/browser-packs/side-panel-schema-editor-reachability.mjs",
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
  ...approvedSchemaEditorReachabilityTaskKeys,
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
