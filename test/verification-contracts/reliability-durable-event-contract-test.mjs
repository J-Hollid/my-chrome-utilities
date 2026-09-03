
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { captureRequiredRejection } from "../support/verification-contract-boundary-helpers.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks, validateIsolatedVerificationHandlers } from "../../scripts/verification-registry/validation.mjs";
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
const eventLibraryPack = packs.find(({id}) => id === "event-library");
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
const eventHandlerEvidence = [];
const captureRejection = captureRequiredRejection;
const loadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs, {
  findLoadedStepConsumers:async() => [{
    handler:"acceptance/src/acceptance/steps/event_template_library.clj",
    consumerPack:"project_event_transport",
    feature:"features/data-layer-project-event-transport-settings.feature",
    step:"<project> is active",
  }],
}));
const eventCrossPackHandler = packs.find(({id}) => id === "project_event_transport").handlers[0];
const namespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs, {
  readSource:async(handlerPath) => {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url), "utf8");
  return handlerPath === eventCrossPackHandler
    ? `${source}\n[acceptance.steps.event-template-library :refer [handlers]]\n` : source;
}}));
const nonIsolatedEventPacks = replacePack(packs, "event-library", (pack) => ({
  isolatedVerificationHandlers:[],
}));
const rejectedHandlerPlan = planVerification(nonIsolatedEventPacks, {
  changedPaths:["acceptance/src/acceptance/steps/event_template_library.clj"],
}).packIds;
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
const eventEvidenceProfile = conservedEvidenceProfile(eventLibraryPack);
const exactEventPlan = planVerification(packs,{packIds:["event-library"],includeProperties:true});
const acceptedEventPlan = planVerification(vtd008BasePacks,
  {packIds:["event-library"],includeProperties:true,historicalRegistryFallback:true});
const eventCompletedCalibration = JSON.parse(await exec("git", [
  "show", "be319ad555:verification/performance-calibration.json",
]));
const eventCalibration = eventCompletedCalibration.runnablePacks.find(({id}) => id === "event-library");
const eventBaseCalibration = eventLibraryBaseCalibration.runnablePacks.find(({id}) => id === "event-library");
const eventOtherCurrent = eventCompletedCalibration.runnablePacks.filter(({id}) => id !== "event-library");
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
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
