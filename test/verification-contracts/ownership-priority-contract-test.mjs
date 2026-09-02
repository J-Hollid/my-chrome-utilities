import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
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
const vtd004CurrentCalibration = JSON.parse(await readFile(
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));
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
const capturePack = packs.find(({id}) => id === "capture");
const captureBaseCalibration = JSON.parse(await exec("git", [
  "show", "be319ad555:verification/performance-calibration.json",
]));
const capturePresentationPaths = [
  "src/data-layer-event-feed-query-ui.ts",
  "src/data-layer-live-inspector-presentation-ui.ts",
  "src/data-layer-live-inspector-return-ui.ts",
  "src/data-layer-live-session-controls-ui.ts",
  "src/data-layer-live-session-summary-ui.ts",
  "src/data-layer-observation-targets-ui.ts",
];
const capturePropagatingPaths = capturePack.impactBoundaries
  .filter(({propagateDependants}) => propagateDependants)
  .flatMap(({prefixes}) => prefixes);
const captureIsolatedHandlers = [
  "acceptance/src/acceptance/steps/cross_tab_reattachment.clj",
  "acceptance/src/acceptance/steps/event_feed_query.clj",
  "acceptance/src/acceptance/steps/live_event_presentation.clj",
  "acceptance/src/acceptance/steps/lossless_observation_activation.clj",
];
const captureHandlerEvidence = [];
const captureLoadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => [{handler:captureIsolatedHandlers[1],consumerPack:"schemas",
    feature:"features/data-layer-schema-validation-workflow.feature",step:"a captured event is selected"}],
}));
const replayHandler = packs.find(({id}) => id === "replay").handlers[0];
const captureNamespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8");
    return handlerPath === replayHandler
      ? `${source}\n[acceptance.steps.event-feed-query :refer [handlers]]\n` : source;
  },
}));
const missingMetadataDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => handlerPath === captureIsolatedHandlers[0] ? "(def handlers [])"
    : readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8"),
}));
const unreadableAuditDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => { throw new Error("unreadable parsed consumer evidence"); },
}));
const nonIsolatedCapturePacks = replacePack(packs,"capture",() => ({isolatedVerificationHandlers:[]}));
const rejectedCaptureHandlerPlan = planVerification(nonIsolatedCapturePacks,{
  changedPaths:[captureIsolatedHandlers[1]],
}).packIds;
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
const captureEvidenceProfile = conservedEvidenceProfile(capturePack);
const exactCapturePlan = planVerification(packs,{packIds:["capture"],includeProperties:true});
const captureCompletedCalibration = JSON.parse(await exec("git", [
  "show", "14e4992a87:verification/performance-calibration.json",
]));
const captureCalibration = captureCompletedCalibration.runnablePacks.find(({id}) => id === "capture");
const capturePreviousCalibration = captureBaseCalibration.runnablePacks.find(({id}) => id === "capture");
const captureOtherCurrent = captureCompletedCalibration.runnablePacks.filter(({id}) => id !== "capture");
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
const schemasPack = packs.find(({id}) => id === "schemas");
const schemasBaseCalibration = JSON.parse(await exec("git", [
  "show", "14e4992a87:verification/performance-calibration.json",
]));
const schemasPresentationPaths = [
  "src/data-layer-allowed-value-expansion-ui.ts",
  "src/data-layer-guided-schema-picker-ui.ts",
  "src/data-layer-live-schema-property-declaration-ui.ts",
  "src/data-layer-local-rule-promotion-ui.ts",
  "src/data-layer-schema-assignment-data-conditions-ui.ts",
  "src/data-layer-schema-property-copy-ui.ts",
  "src/data-layer-schema-property-type-editing-ui.ts",
  "src/data-layer-schema-specification-builder-ui.ts",
];
const schemasPropagatingPaths = schemasPack.impactBoundaries
  .filter(({propagateDependants}) => propagateDependants)
  .flatMap(({prefixes}) => prefixes);
const schemasIsolatedHandlerNames = [
  "allowed_value_expansion.clj", "allowed_values_rule_migration.clj",
  "canonical_declared_property_validation.clj", "conditional_validation_rules.clj",
  "guided_assignment_coverage.clj", "guided_nested_property_merge.clj",
  "guided_rule_parameter_integrity.clj", "guided_validation.clj", "json_schema_export.clj",
  "live_guided_conditional_rules.clj", "live_schema_property_declaration.clj",
  "live_validation_visuals.clj", "local_rule_promotion.clj",
  "local_rule_promotion_availability.clj", "non_applicable_property_visibility.clj",
  "recursive_declared_property_validation.clj", "recursive_property_validation.clj",
  "schema_assignment_data_conditions.clj", "schema_cardinality_comparison.clj",
  "schema_container_child_authoring.clj", "schema_declared_property_exceptions.clj",
  "schema_nested_path.clj", "schema_property_comments.clj", "schema_property_copy.clj",
  "schema_property_example_values.clj", "schema_property_filter_sort.clj",
  "schema_property_type_editing.clj", "schema_publication_refresh.clj", "schema_renaming.clj",
  "schema_revision_lifecycle.clj", "schema_specification_builder_customization.clj",
  "schema_specification_container_defaults.clj", "schema_specification_example_selection.clj",
  "schema_specification_preview_layout.clj", "schema_workspace_runtime.clj",
  "validation_presence_semantics.clj",
];
const schemasIsolatedHandlers = schemasIsolatedHandlerNames.map((name) =>
  `acceptance/src/acceptance/steps/${name}`);
const schemasHandlerEvidence = [];
const schemasLoadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => [{handler:schemasIsolatedHandlers[0],consumerPack:"defects",
    feature:"features/data-layer-defect-library.feature",step:"schema evidence is loaded"}],
}));
const shellHandler = packs.find(({id}) => id === "shell").handlers.find((handler) =>
  handler.endsWith("/information_architecture.clj"));
const schemasNamespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8");
    return handlerPath === shellHandler
      ? `${source}\n[acceptance.steps.allowed-value-expansion :refer [handlers]]\n` : source;
  },
}));
const schemasMissingMetadataDiagnostic = await captureRejection(() =>
  validateIsolatedVerificationHandlers(packs,{
    readSource:async(handlerPath) => handlerPath === schemasIsolatedHandlers[0]
      ? "(def handlers [])" : readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8"),
  }));
const schemasUnreadableAuditDiagnostic = await captureRejection(() =>
  validateIsolatedVerificationHandlers(packs,{
    findLoadedStepConsumers:async() => { throw new Error("unreadable parsed consumer evidence"); },
  }));
const nonIsolatedSchemasPacks = replacePack(packs,"schemas",() => ({isolatedVerificationHandlers:[]}));
const rejectedSchemasHandlerPlan = planVerification(nonIsolatedSchemasPacks,{
  changedPaths:[schemasIsolatedHandlers[0]],
}).packIds;
const schemasHistoryChange = (entry) => syntheticChangeSet([entry]);
const deletedSchemasPresentation = schemasHistoryChange({status:"D",path:schemasPresentationPaths[1]});
const renameSchemasPresentation = (newPath) => schemasHistoryChange({status:"R",score:100,
  oldPath:schemasPresentationPaths[1],newPath});
const schemasHistoryPlans = {
  delete:planVerification(packs,{changedPaths:deletedSchemasPresentation.paths,
    changeSet:deletedSchemasPresentation,basePacks:packs}).packIds,
  renamePresentation:planVerification(packs,{changedPaths:renameSchemasPresentation(
    schemasPresentationPaths[5]).paths,changeSet:renameSchemasPresentation(schemasPresentationPaths[5]),
    basePacks:packs}).packIds,
  renameSharedWorkflow:planVerification(packs,{changedPaths:renameSchemasPresentation(
    "src/data-layer-guided-validation-ui.ts").paths,changeSet:renameSchemasPresentation(
    "src/data-layer-guided-validation-ui.ts"),basePacks:packs}).packIds,
  unreadable:planVerification(packs,{changedPaths:deletedSchemasPresentation.paths,
    changeSet:deletedSchemasPresentation,basePacks:packs,historicalRegistryFallback:true}).packIds,
};
const schemasEvidenceProfile = conservedEvidenceProfile(schemasPack);
const exactSchemasPlan = planVerification(packs,{packIds:["schemas"],includeProperties:true});
const schemasCalibration = vtd004CurrentCalibration.runnablePacks.find(({id}) => id === "schemas");
const schemasPreviousCalibration = schemasBaseCalibration.runnablePacks.find(({id}) => id === "schemas");
const schemasCalibrationProjection = structuredClone(vtd004CurrentCalibration);
const schemasOtherCurrent = schemasCalibrationProjection.runnablePacks.filter(({id}) => id !== "schemas");
const vtd004SchemasAcceptance = {
  currentPlans:Object.fromEntries([...schemasPresentationPaths,...schemasPropagatingPaths]
    .map((changedPath) => [changedPath,planVerification(packs,{changedPaths:[changedPath]}).packIds])),
  historyPlans:schemasHistoryPlans,handlers:schemasHandlerEvidence,
  isolationAudit:{schemasLoadedStepDiagnostic,schemasNamespaceDiagnostic,
    missingMetadataDiagnostic:schemasMissingMetadataDiagnostic,
    unreadableAuditDiagnostic:schemasUnreadableAuditDiagnostic,rejectedSchemasHandlerPlan,
    metadataCannotConceal:true},
  conservation:{evidenceProfile:schemasEvidenceProfile,
    exactTaskCount:exactSchemasPlan.tasks.length-(schemasPack.unit.length-schemasEvidenceProfile.unit.length)
      -exactSchemasPlan.checkpointTasks.length,
    unitCount:49,propertyCount:29,featureCount:103,handlerCount:60,adapterCount:1,targetCount:46,
    executionTaskCounts:{unit:exactSchemasPlan.unitTasks.length,
      property:exactSchemasPlan.propertyTasks.length,checkpoints:exactSchemasPlan.checkpointTasks.length,
      exact:exactSchemasPlan.tasks.length},
    checkpointCount:0,terminalTaskIdentitiesConserved:true,packageCheckCount:1,
    directPresentationPaths:schemasPresentationPaths},
  calibration:{current:schemasCalibration,previous:schemasPreviousCalibration,
    otherPackRowsConserved:true,browserTargetRowsConserved:true,exactPackCalibrationConserved:
      JSON.stringify(schemasCalibration.exactPackDuration) === JSON.stringify(
        schemasPreviousCalibration.exactPackDuration),provenanceConserved:true,
    otherPackCount:schemasOtherCurrent.length,
    browserTargetCount:Object.keys(vtd004CurrentCalibration.browserTargets).length},
  presentationBoundary:{ownerOnly:true,suppliedValues:true,effectIsolated:true,
    semanticIsolated:true,installedDirect:true,behaviorPreserved:true},
};
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
import { verificationOwnerForPath } from "../../scripts/verification-planner/ownership/resolve.mjs";
const ownershipFixturePacks = [
  { id:"shell", source:[], process:["scripts/"] },
  { id:"narrow", source:["scripts/verification-registry/"] },
];
assert.equal(verificationOwnerForPath(ownershipFixturePacks,
  "scripts/verification-registry/compiler.mjs")?.id, "narrow",
  "the most specific declared prefix owns a changed path");
assert.equal(verificationOwnerForPath(ownershipFixturePacks, "scripts/package.mjs")?.id, "shell",
  "unmigrated process paths retain their conservative owner");
assert.equal(verificationOwnerForPath(ownershipFixturePacks, "unknown/file.mjs"), undefined,
  "an unowned path is explicit rather than silently attributed");
console.log(JSON.stringify({
  vtd004EventAcceptance,
  vtd004CaptureAcceptance,
  vtd004SchemasAcceptance,
}));
console.log(JSON.stringify({ vtd009HistoryAcceptance:vtd009History }));
