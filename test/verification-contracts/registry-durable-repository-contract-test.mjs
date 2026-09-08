import {approvedObservationSourceTaskKeys,approvedSchemaContextExportTaskKeys} from "./ownership-terminal-identity-support.mjs";
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
const registeredHandlerPaths = [...new Set(packs.flatMap((pack) => pack.handlers ?? []))];
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
  ...approvedSchemaContextExportTaskKeys, ...approvedObservationSourceTaskKeys,
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
const calibrationProvenanceKeys = ["version", "implementationCommit", "environmentClassId", "environment",
  "sourceScope", "minimumIndependentSamples", "tolerance", "receiptDigests", "algorithm"];
const calibrationProvenance = (calibration) => Object.fromEntries(calibrationProvenanceKeys.map((key) =>
  [key, calibration[key]]));
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
