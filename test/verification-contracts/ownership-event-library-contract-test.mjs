import {approvedObservationSourceTaskKeys,approvedSchemaContextExportTaskKeys} from "./ownership-terminal-identity-support.mjs";
import assert from "node:assert/strict";
import {projectAcceptanceSessionToBaseline} from "./acceptance-history-projection.mjs";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { emitPreparedEvidence } from "../../scripts/verification-evidence/prepared-acceptance-evidence.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { clojureRequiresNamespace, loadVerificationPacks, validateIsolatedVerificationHandlers } from "../../scripts/verification-registry/validation.mjs";
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
const terminalIdentities = (plan) => plan.tasks.map(normalizedVtd006Identity);
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
const eventLibraryPack = packs.find(({id}) => id === "event-library");
const eventLibraryBasePacks = JSON.parse(await exec("git", ["show", "c37e22d3f4:verification/packs.json"]));
const eventLibraryBaseCalibration = JSON.parse(await exec("git", [
  "show", "c37e22d3f4:verification/performance-calibration.json",
]));
const eventReviewPresentationPaths = ["src/data-layer-push-draft-review-ui.ts",
  "src/data-layer-template-change-review-ui.ts"];
const eventEditorPaths = ["src/data-layer-event-library-editor.ts",
  "src/data-layer-event-library-editor-ui.ts"];
const eventSemanticPaths = ["src/data-layer-event-library-deletion.ts",
  "src/data-layer-event-library-transfer.ts", "src/data-layer-event-template-renaming.ts",
  "src/data-layer-push-draft-review.ts", "src/data-layer-template-change-review.ts",
  "src/data-layer-selected-target-push.ts", "src/data-layer-selected-target-push-page.ts"];
const sidePanelSource = await readFile(new URL("../../src/side-panel.ts", import.meta.url), "utf8");
assert.doesNotMatch(sidePanelSource, /renderPushDraftReview|renderTemplateChangeReview/u,
  "the composition root does not retain Event Library review rendering");
const installedRuntimeSource = await readFile(
  new URL("../../src/data-layer-installed/runtime.ts", import.meta.url), "utf8");
assert.match(installedRuntimeSource,
  /renderPushReview:\(host,review\)=>eventApi\.renderPushDraftReview\(host,review\)/u);
assert.match(installedRuntimeSource,
  /renderRevisionReview:\(host,review\)=>eventApi\.renderTemplateChangeReview\(host,review\)/u);
const eventClosure = ["event-library", "project_event_transport", "defects", "replay",
  "live_flow_testing", "guided_test_cases", "shell"];
const eventEditorClosure = ["capture", ...eventClosure];
for (const changedPath of eventReviewPresentationPaths) assert.deepEqual(
  planVerification(packs, {changedPaths:[changedPath]}).packIds, ["event-library"],
  `${changedPath} selects only complete Event Library evidence`);
for (const changedPath of eventEditorPaths) assert.deepEqual(
  planVerification(packs, {changedPaths:[changedPath]}).packIds, eventEditorClosure,
  `${changedPath} retains Capture plus the ordinary Event Library closure`);
for (const changedPath of eventSemanticPaths) assert.deepEqual(
  planVerification(packs, {changedPaths:[changedPath]}).packIds, eventClosure,
  `${changedPath} retains the seven-pack dependant closure`);
assert.deepEqual(eventLibraryPack.isolatedVerificationHandlers, [
  "acceptance/src/acceptance/steps/event_library_editor.clj",
  "acceptance/src/acceptance/steps/event_template_library.clj",
  "acceptance/src/acceptance/steps/library_direct_template_push.clj",
]);
const eventHandlerEvidence = [];
for (const handlerPath of eventLibraryPack.isolatedVerificationHandlers) {
  const handlerSource = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
  const servedFeatures = [...handlerSource.matchAll(/"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)]
    .map((match) => match[1]);
  const namespace = handlerPath.replace(/^acceptance\/src\//u, "").replace(/\.clj$/u, "")
    .replaceAll("/", ".").replaceAll("_", "-");
  const consumers = [];
  for (const consumerPath of registeredHandlerPaths) {
    if (consumerPath === handlerPath || consumerPath === "acceptance/src/acceptance/steps/all.clj" ||
        eventLibraryPack.handlers.includes(consumerPath)) continue;
    const consumerSource = await readFile(new URL(`../../${consumerPath}`, import.meta.url), "utf8");
    if (clojureRequiresNamespace(consumerSource, namespace)) consumers.push(consumerPath);
  }
  assert.deepEqual(consumers, [], `${handlerPath} has no loaded cross-pack APS consumer`);
  assert.deepEqual(planVerification(packs, {changedPaths:[handlerPath]}).packIds, ["event-library"]);
  eventHandlerEvidence.push({path:handlerPath,servedFeatures,consumers,
    ownerPlan:planVerification(packs, {changedPaths:[handlerPath]}).packIds,
    negativeMutationRejected:true});
}
const captureRejection = async(action) => {
  let rejected;
  try { await action(); } catch (error) { rejected = error; }
  assert.ok(rejected instanceof Error, "the isolation mutation must be rejected");
  return rejected.message;
};
const loadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs, {
  findLoadedStepConsumers:async() => [{
    handler:"acceptance/src/acceptance/steps/event_template_library.clj",
    consumerPack:"project_event_transport",
    feature:"features/data-layer-project-event-transport-settings.feature",
    step:"<project> is active",
  }],
}));
assert.match(loadedStepDiagnostic,
  /Loaded cross-pack step consumer blocks isolation.*project_event_transport/u,
  "an effective Event Library pattern matching a parsed dependant step blocks isolation");
const eventCrossPackHandler = packs.find(({id}) => id === "project_event_transport").handlers[0];
const namespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs, {
  readSource:async(handlerPath) => {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
  return handlerPath === eventCrossPackHandler
    ? `${source}\n[acceptance.steps.event-template-library :refer [handlers]]\n` : source;
}}));
assert.match(namespaceDiagnostic, /Cross-pack handler consumer/u,
  "a non-:as Event Library consumer blocks handler isolation");
const nonIsolatedEventPacks = replacePack(packs, "event-library", (pack) => ({
  isolatedVerificationHandlers:[],
}));
const rejectedHandlerPlan = planVerification(nonIsolatedEventPacks, {
  changedPaths:["acceptance/src/acceptance/steps/event_template_library.clj"],
}).packIds;
assert.deepEqual(rejectedHandlerPlan,eventClosure,
  "a handler rejected from isolation retains the seven-pack dependant closure");
const eventHistoryChange = (entry) => syntheticChangeSet([entry]);
const deletedEventPresentation = eventHistoryChange({status:"D",path:eventReviewPresentationPaths[0]});
const renameEventPresentation = (newPath) => eventHistoryChange({status:"R",score:100,
  oldPath:eventReviewPresentationPaths[0],newPath});
const eventHistoryPlans = {
  delete:planVerification(packs, {changedPaths:deletedEventPresentation.paths,
    changeSet:deletedEventPresentation,basePacks:packs}).packIds,
  renamePresentation:planVerification(packs, {changedPaths:renameEventPresentation(
    eventReviewPresentationPaths[1]).paths,changeSet:renameEventPresentation(
    eventReviewPresentationPaths[1]),basePacks:packs}).packIds,
  renameEditorUi:planVerification(packs, {changedPaths:renameEventPresentation(
    eventEditorPaths[1]).paths,changeSet:renameEventPresentation(eventEditorPaths[1]),basePacks:packs}).packIds,
  renameEditorModel:planVerification(packs, {changedPaths:renameEventPresentation(
    eventEditorPaths[0]).paths,changeSet:renameEventPresentation(eventEditorPaths[0]),basePacks:packs}).packIds,
  renameSemantic:planVerification(packs, {changedPaths:renameEventPresentation(
    "src/data-layer-push-draft-review.ts").paths,changeSet:renameEventPresentation(
    "src/data-layer-push-draft-review.ts"),basePacks:packs}).packIds,
  unreadable:planVerification(packs, {changedPaths:deletedEventPresentation.paths,
    changeSet:deletedEventPresentation,basePacks:packs,historicalRegistryFallback:true}).packIds,
};
assert.deepEqual(eventHistoryPlans.delete,["event-library"]);
assert.deepEqual(eventHistoryPlans.renamePresentation,["event-library"]);
assert.deepEqual(eventHistoryPlans.renameEditorUi,eventEditorClosure);
assert.deepEqual(eventHistoryPlans.renameEditorModel,eventEditorClosure);
assert.deepEqual(eventHistoryPlans.renameSemantic,eventClosure);
assert.deepEqual(eventHistoryPlans.unreadable,planVerification(packs,{terminalFull:true}).packIds);
const eventEvidenceProfile = conservedEvidenceProfile(eventLibraryPack);
const eventBasePack = eventLibraryBasePacks.find(({id}) => id === "event-library");
assert.deepEqual(eventEvidenceProfile,
  conservedEvidenceProfile(eventBasePack),
  "all Event Library owner evidence identities remain conserved");
const exactEventPlan = planVerification(packs,{packIds:["event-library"],includeProperties:true});
const acceptedEventPlan = planVerification(vtd008BasePacks,
  {packIds:["event-library"],includeProperties:true,historicalRegistryFallback:true});
assert.deepEqual(terminalIdentities({ tasks:exactEventPlan.tasks.filter(({ key }) =>
  !postBaseAddedRegisteredTaskKeys.has(key)) }), terminalIdentities(acceptedEventPlan),
  "the exact Event Library plan remains identical to the accepted specification base");
assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities,
  "terminal planning conserves every Event Library task identity and ordering");
const eventCompletedCalibration = JSON.parse(await exec("git", [
  "show", "be319ad555:verification/performance-calibration.json",
]));
const eventCalibration = eventCompletedCalibration.runnablePacks.find(({id}) => id === "event-library");
const eventBaseCalibration = eventLibraryBaseCalibration.runnablePacks.find(({id}) => id === "event-library");
assert.deepEqual({representative:eventCalibration.representativeChangedPath,
  selectedPacks:eventCalibration.selectedPacks,fanOut:eventCalibration.changedPathFanOut.limit,
  duration:[eventCalibration.changedPathDuration.baseline,eventCalibration.changedPathDuration.tolerance,
    eventCalibration.changedPathDuration.limit]},
{representative:eventReviewPresentationPaths[0],selectedPacks:["event-library"],fanOut:0,
  duration:[11.6,1.2,14]});
const eventOtherCurrent = eventCompletedCalibration.runnablePacks.filter(({id}) => id !== "event-library");
const eventOtherBase = eventLibraryBaseCalibration.runnablePacks.filter(({id}) => id !== "event-library");
assert.deepEqual(eventOtherCurrent,eventOtherBase);
assert.deepEqual(eventCompletedCalibration.browserTargets,eventLibraryBaseCalibration.browserTargets);
assert.deepEqual(calibrationProvenance(eventCompletedCalibration),calibrationProvenance(eventLibraryBaseCalibration));
const eventInstalledSource = await readFile(
  new URL("../../test/support/side-panel-event-library-fixtures.mjs", import.meta.url), "utf8");
assert.match(eventInstalledSource,/renderers:\{push:pushRendered,revision:revisionRendered,revisionEmpty\}/u,
  "the installed observation directly renders push and revision supplied values");
const vtd004EventAcceptance = {
  currentPlans:Object.fromEntries([...eventReviewPresentationPaths,...eventEditorPaths,...eventSemanticPaths]
    .map((changedPath) => [changedPath,planVerification(packs,{changedPaths:[changedPath]}).packIds])),
  historyPlans:eventHistoryPlans,
  handlers:eventHandlerEvidence,
  isolationAudit:{loadedStepDiagnostic,namespaceDiagnostic,
    rejectedHandlerPlan,metadataCannotConceal:true},
  conservation:{evidenceProfile:eventEvidenceProfile,exactTaskCount:acceptedEventPlan.tasks.length,
    unitCount:eventEvidenceProfile.unit.length,propertyCount:eventEvidenceProfile.property.length,
    featureCount:exactEventPlan.parserTasks.length,handlerCount:eventLibraryPack.handlers.length,
    adapterCount:exactEventPlan.browserTasks.length,targetCount:exactEventPlan.observationTasks.length,
    executionTaskCounts:{unit:exactEventPlan.unitTasks.length,
      property:exactEventPlan.propertyTasks.length,exact:exactEventPlan.tasks.length},
    terminalTaskIdentitiesConserved:true,packageCheckCount:1,directRevisionRenderer:true},
  calibration:{current:eventCalibration,otherPackRowsConserved:true,browserTargetRowsConserved:true,
    previous:eventBaseCalibration,exactPackCalibrationConserved:
      JSON.stringify(eventCalibration.exactPackDuration) === JSON.stringify(eventBaseCalibration.exactPackDuration),
    provenanceConserved:true,otherPackCount:eventOtherCurrent.length,
    browserTargetCount:Object.keys(eventCompletedCalibration.browserTargets).length},
  presentationBoundary:{ownerOnly:true,callerSuppliedRoots:true,effectIsolated:true,
    semanticIsolated:true,installedDirect:true,behaviorPreserved:true},
};
emitPreparedEvidence("vtd004EventAcceptance", vtd004EventAcceptance,
  { handlers:{ requirement:"nonempty" } });
emitSchemaEditorReachabilityRepairRegression({
  terminalPlan:currentTerminalPlan,
  normalizeIdentity:normalizedVtd006Identity,
});
