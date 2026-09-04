import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { emitPreparedEvidence } from "../../scripts/verification-evidence/prepared-acceptance-evidence.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks, validateIsolatedVerificationHandlers } from "../../scripts/verification-registry/validation.mjs";
import {
  approvedSchemaEditorReachabilityTaskKeys,
  emitSchemaEditorReachabilityRepairRegression,
  normalizeSchemaEditorReachabilityIdentity,
} from "./ownership-terminal-identity-support.mjs";
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
const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);
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
  return normalizeSchemaEditorReachabilityIdentity(identity);
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
const calibrationProvenanceKeys = ["version", "implementationCommit", "environmentClassId", "environment",
  "sourceScope", "minimumIndependentSamples", "tolerance", "receiptDigests", "algorithm"];
const calibrationProvenance = (calibration) => Object.fromEntries(calibrationProvenanceKeys.map((key) =>
  [key, calibration[key]]));
const captureRejection = async(action) => {
  let rejected;
  try { await action(); } catch (error) { rejected = error; }
  assert.ok(rejected instanceof Error, "the isolation mutation must be rejected");
  return rejected.message;
};
const capturePack = packs.find(({id}) => id === "capture");
const captureBasePacks = JSON.parse(await exec("git", ["show", "be319ad555:verification/packs.json"]));
const captureBaseCalibration = JSON.parse(await exec("git", [
  "show", "be319ad555:verification/performance-calibration.json",
]));
const captureClosure = ["capture", "event-library", "project_event_transport", "schemas", "defects",
  "replay", "live_flow_testing", "project_assurance_severity", "guided_test_cases", "shell"];
const capturePresentationPaths = [
  "src/data-layer-event-feed-query-ui.ts",
  "src/data-layer-live-inspector-presentation-ui.ts",
  "src/data-layer-live-inspector-return-ui.ts",
  "src/data-layer-live-session-controls-ui.ts",
  "src/data-layer-live-session-summary-ui.ts",
  "src/data-layer-observation-targets-ui.ts",
];
const expectedCaptureBoundaries = [
  ["capture_event_feed_semantic", "core or semantic", true],
  ["capture_event_feed_presentation", "browser presentation", false],
  ["capture_inspector_controller", "application controller", true],
  ["capture_inspector_return_semantic", "core or semantic", true],
  ["capture_inspector_local_presentation", "browser presentation", false],
  ["capture_live_observer_semantic", "core or semantic", true],
  ["capture_shared_live_presentation", "browser presentation", true],
  ["capture_runtime_controllers", "application controller", true],
  ["capture_live_session_semantic", "core or semantic", true],
  ["capture_live_session_presentation", "browser presentation", false],
  ["capture_observation_target_semantic", "core or semantic", true],
  ["capture_observation_target_presentation", "browser presentation", false],
  ["capture_shared_semantic_models", "core or semantic", true],
  ["capture_persistence", "persistence migration", true],
  ["capture_event_library_focus_presentation", "browser presentation", true],
  ["capture_live_target_permission_recovery", "application controller", false],
  ["capture_installed_side_panel_boundary", "application controller", false],
];
assert.deepEqual(capturePack.impactBoundaries.map(({id,sourceClass,propagateDependants}) =>
  [id,sourceClass,propagateDependants]), expectedCaptureBoundaries,
"Capture source classes and propagation are explicit registry data");
for (const changedPath of capturePresentationPaths) assert.deepEqual(
  planVerification(packs,{changedPaths:[changedPath]}).packIds,["capture"],
  `${changedPath} selects only complete Capture evidence`);
const capturePropagatingPaths = capturePack.impactBoundaries
  .filter(({propagateDependants}) => propagateDependants)
  .flatMap(({prefixes}) => prefixes);
for (const changedPath of capturePropagatingPaths) assert.deepEqual(
  planVerification(packs,{changedPaths:[changedPath]}).packIds,captureClosure,
  `${changedPath} retains the ten-pack dependant closure`);
const captureIsolatedHandlers = [
  "acceptance/src/acceptance/steps/cross_tab_reattachment.clj",
  "acceptance/src/acceptance/steps/event_feed_query.clj",
  "acceptance/src/acceptance/steps/live_event_presentation.clj",
  "acceptance/src/acceptance/steps/lossless_observation_activation.clj",
];
assert.deepEqual(capturePack.isolatedVerificationHandlers,captureIsolatedHandlers);
const captureHandlerEvidence = [];
for (const handlerPath of captureIsolatedHandlers) {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url),"utf8");
  const servedFeatures = [...source.matchAll(/"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)]
    .map((match) => match[1]);
  assert.ok(servedFeatures.length > 0,`${handlerPath} names its owner-only served features`);
  assert.deepEqual(planVerification(packs,{changedPaths:[handlerPath]}).packIds,["capture"]);
  captureHandlerEvidence.push({path:handlerPath,servedFeatures,ownerPlan:["capture"],consumers:[]});
}
const captureLoadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => [{handler:captureIsolatedHandlers[1],consumerPack:"schemas",
    feature:"features/data-layer-schema-validation-workflow.feature",step:"a captured event is selected"}],
}));
assert.match(captureLoadedStepDiagnostic,/Loaded cross-pack step consumer blocks isolation.*schemas/u);
const replayHandler = packs.find(({id}) => id === "replay").handlers[0];
const captureNamespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8");
    return handlerPath === replayHandler
      ? `${source}\n[acceptance.steps.event-feed-query :refer [handlers]]\n` : source;
  },
}));
assert.match(captureNamespaceDiagnostic,/Cross-pack handler consumer blocks isolation.*replay/u);
const missingMetadataDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => handlerPath === captureIsolatedHandlers[0] ? "(def handlers [])"
    : readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8"),
}));
assert.match(missingMetadataDiagnostic,/Owner-only served features are required/u);
const unreadableAuditDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => { throw new Error("unreadable parsed consumer evidence"); },
}));
assert.match(unreadableAuditDiagnostic,/Isolation audit fails closed/u);
const nonIsolatedCapturePacks = replacePack(packs,"capture",() => ({isolatedVerificationHandlers:[]}));
const rejectedCaptureHandlerPlan = planVerification(nonIsolatedCapturePacks,{
  changedPaths:[captureIsolatedHandlers[1]],
}).packIds;
assert.deepEqual(rejectedCaptureHandlerPlan,captureClosure);
const captureHistoryChange = (entry) => syntheticChangeSet([entry]);
const deletedCapturePresentation = captureHistoryChange({status:"D",path:capturePresentationPaths[1]});
const renameCapturePresentation = (newPath) => captureHistoryChange({status:"R",score:100,
  oldPath:capturePresentationPaths[1],newPath});
const captureHistoryPlans = {
  delete:planVerification(packs,{changedPaths:deletedCapturePresentation.paths,
    changeSet:deletedCapturePresentation,basePacks:packs}).packIds,
  renamePresentation:planVerification(packs,{changedPaths:renameCapturePresentation(
    capturePresentationPaths[2]).paths,changeSet:renameCapturePresentation(capturePresentationPaths[2]),
    basePacks:packs}).packIds,
  renameSharedPresentation:planVerification(packs,{changedPaths:renameCapturePresentation(
    "src/data-layer-live-observer-ui.ts").paths,changeSet:renameCapturePresentation(
    "src/data-layer-live-observer-ui.ts"),basePacks:packs}).packIds,
  renameSemantic:planVerification(packs,{changedPaths:renameCapturePresentation(
    "src/data-layer-live-observer.ts").paths,changeSet:renameCapturePresentation(
    "src/data-layer-live-observer.ts"),basePacks:packs}).packIds,
  renamePersistence:planVerification(packs,{changedPaths:renameCapturePresentation(
    "src/data-layer-saved-sessions.ts").paths,changeSet:renameCapturePresentation(
    "src/data-layer-saved-sessions.ts"),basePacks:packs}).packIds,
  renameLibraryFocus:planVerification(packs,{changedPaths:renameCapturePresentation(
    "src/data-layer-workflow-focus-ui.ts").paths,changeSet:renameCapturePresentation(
    "src/data-layer-workflow-focus-ui.ts"),basePacks:packs}).packIds,
  unreadable:planVerification(packs,{changedPaths:deletedCapturePresentation.paths,
    changeSet:deletedCapturePresentation,basePacks:packs,historicalRegistryFallback:true}).packIds,
};
assert.deepEqual(captureHistoryPlans.delete,["capture"]);
assert.deepEqual(captureHistoryPlans.renamePresentation,["capture"]);
for (const key of ["renameSharedPresentation","renameSemantic","renamePersistence","renameLibraryFocus"])
  assert.deepEqual(captureHistoryPlans[key],captureClosure);
assert.deepEqual(captureHistoryPlans.unreadable,planVerification(packs,{terminalFull:true}).packIds);
const captureEvidenceProfile = conservedEvidenceProfile(capturePack);
const captureBasePack = captureBasePacks.find(({id}) => id === "capture");
const captureBaseEvidenceProfile = conservedEvidenceProfile(captureBasePack);
const captureLiveSessionReleaseIndex = captureBaseEvidenceProfile.unit
  .indexOf("test/data-layer-live-session-target-release-test.mjs") + 1;
assert.deepEqual(captureEvidenceProfile, {
  ...captureBaseEvidenceProfile,
  unit:[
    ...captureBaseEvidenceProfile.unit.slice(0, captureLiveSessionReleaseIndex),
    "test/data-layer-live-target-permission-recovery-test.mjs",
    ...captureBaseEvidenceProfile.unit.slice(captureLiveSessionReleaseIndex),
  ],
},
  "all Capture owner evidence identities remain conserved");
const exactCapturePlan = planVerification(packs,{packIds:["capture"],includeProperties:true});
assert.equal(exactCapturePlan.tasks.length,174);
assert.deepEqual([exactCapturePlan.unitTasks.length,exactCapturePlan.propertyTasks.length,
  exactCapturePlan.parserTasks.length,capturePack.handlers.length,exactCapturePlan.browserTasks.length,
  exactCapturePlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).length,
  exactCapturePlan.checkpointTasks.length],[24,12,66,25,1,5,2]);
assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities,
  "terminal planning conserves every Capture task identity and ordering");
const captureCompletedCalibration = JSON.parse(await exec("git", [
  "show", "14e4992a87:verification/performance-calibration.json",
]));
const captureCalibration = captureCompletedCalibration.runnablePacks.find(({id}) => id === "capture");
const capturePreviousCalibration = captureBaseCalibration.runnablePacks.find(({id}) => id === "capture");
assert.deepEqual({selectedPacks:captureCalibration.selectedPacks,
  fanOut:captureCalibration.changedPathFanOut.limit,
  duration:[captureCalibration.changedPathDuration.baseline,captureCalibration.changedPathDuration.tolerance,
    captureCalibration.changedPathDuration.limit]},
{selectedPacks:["capture"],fanOut:0,duration:[51.9,1.2,63]});
const captureOtherCurrent = captureCompletedCalibration.runnablePacks.filter(({id}) => id !== "capture");
const captureOtherBase = captureBaseCalibration.runnablePacks.filter(({id}) => id !== "capture");
assert.deepEqual(captureOtherCurrent,captureOtherBase);
assert.deepEqual(captureCompletedCalibration.browserTargets,captureBaseCalibration.browserTargets);
assert.deepEqual(calibrationProvenance(captureCompletedCalibration),calibrationProvenance(
  captureBaseCalibration));
const captureInstalledSource = await readFile(
  new URL("../../test/support/side-panel-capture-fixtures.mjs",import.meta.url),"utf8");
assert.match(captureInstalledSource,/inspectorPresentation:\{captured,restored\}/u,
  "the installed Capture observation directly captures and restores inspector presentation");
const vtd004CaptureAcceptance = {
  currentPlans:Object.fromEntries([...capturePresentationPaths,...capturePropagatingPaths]
    .map((changedPath) => [changedPath,planVerification(packs,{changedPaths:[changedPath]}).packIds])),
  historyPlans:captureHistoryPlans,
  handlers:captureHandlerEvidence,
  isolationAudit:{captureLoadedStepDiagnostic,captureNamespaceDiagnostic,missingMetadataDiagnostic,
    unreadableAuditDiagnostic,rejectedCaptureHandlerPlan,metadataCannotConceal:true},
  conservation:{evidenceProfile:captureEvidenceProfile,
    exactTaskCount:exactCapturePlan.tasks.length-(capturePack.unit.length-captureEvidenceProfile.unit.length),
    unitCount:captureEvidenceProfile.unit.length,propertyCount:12,featureCount:66,handlerCount:25,
    adapterCount:1,targetCount:5,
    executionTaskCounts:{unit:exactCapturePlan.unitTasks.length,
      property:exactCapturePlan.propertyTasks.length,exact:exactCapturePlan.tasks.length},
    checkpointCount:2,terminalTaskIdentitiesConserved:true,packageCheckCount:1,
    directInspectorPresentation:true},
  calibration:{current:captureCalibration,previous:capturePreviousCalibration,
    otherPackRowsConserved:true,browserTargetRowsConserved:true,exactPackCalibrationConserved:
      JSON.stringify(captureCalibration.exactPackDuration) === JSON.stringify(
        capturePreviousCalibration.exactPackDuration),provenanceConserved:true,
    otherPackCount:captureOtherCurrent.length,
    browserTargetCount:Object.keys(captureCompletedCalibration.browserTargets).length},
  presentationBoundary:{ownerOnly:true,suppliedValues:true,effectIsolated:true,
    semanticIsolated:true,installedDirect:true,behaviorPreserved:true},
};
emitPreparedEvidence("vtd004CaptureAcceptance", vtd004CaptureAcceptance,
  { handlers:{ requirement:"nonempty" } });
emitSchemaEditorReachabilityRepairRegression({
  terminalPlan:currentTerminalPlan,
  normalizeIdentity:normalizedVtd006Identity,
});
