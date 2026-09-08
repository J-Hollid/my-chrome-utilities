import {installedSchemaDirectOwners,isSchemaWheelUnit,schemaWheelTaskCount} from "./schema-owner-conservation-support.mjs";
import {approvedSchemaContextExportTaskKeys,contextPermissionTaskCount} from "./ownership-terminal-identity-support.mjs";
import assert from "node:assert/strict";
import {schemaConservationCounts} from "./schema-conservation-counts.mjs";
import {projectAcceptanceSessionToBaseline} from "./acceptance-history-projection.mjs";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { emitPreparedEvidence } from "../../scripts/verification-evidence/prepared-acceptance-evidence.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks, validateIsolatedVerificationHandlers, validateVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
import {
  approvedSchemaEditorReachabilityTaskKeys,
  normalizeSchemaEditorReachabilityIdentity,
} from "./ownership-terminal-identity-support.mjs";
import { verifySchemaPublicOwnerRegistration } from
  "./schema-public-owner-registration-repair-support.mjs";
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
  ...approvedSchemaContextExportTaskKeys,
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
const captureIsolatedHandlers = [
  "acceptance/src/acceptance/steps/cross_tab_reattachment.clj",
  "acceptance/src/acceptance/steps/event_feed_query.clj",
  "acceptance/src/acceptance/steps/live_event_presentation.clj",
  "acceptance/src/acceptance/steps/lossless_observation_activation.clj",
];
const missingMetadataDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => handlerPath === captureIsolatedHandlers[0] ? "(def handlers [])"
    : readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8"),
}));
const unreadableAuditDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => { throw new Error("unreadable parsed consumer evidence"); },
}));
const schemasPack = packs.find(({id}) => id === "schemas");
const schemasBasePacks = JSON.parse(await exec("git", ["show", "09828badc5:verification/packs.json"]));
const schemasBaseCalibration = JSON.parse(await exec("git", [
  "show", "14e4992a87:verification/performance-calibration.json",
]));
const schemasClosure = ["schemas", "defects", "live_flow_testing", "project_assurance_severity",
  "guided_test_cases", "shell"];
const schemasInstalledIndex = "src/data-layer-installed/schemas/index.ts";
const schemaEditorReachabilitySlice = schemasPack.verificationSlices.find(({id}) =>
  id === "schema_editor_reachability");
assert.equal(schemaEditorReachabilitySlice.sourcePaths.includes(schemasInstalledIndex),false,
  "the reachability slice does not claim the multi-purpose installed Schema controller");
const schemasInstalledIndexPlan = planVerification(packs,{changedPaths:[schemasInstalledIndex]});
assert.deepEqual(schemasInstalledIndexPlan.packIds,
  ["schemas", "defects", "project_assurance_severity", "guided_test_cases", "shell"],
  "the thin installed Schema composition root selects exact consumer ownership");
assert.deepEqual(schemasInstalledIndexPlan.selectedVerificationSlices.schemas,
  ["schemas_installed_composition"],
  "the thin installed Schema composition root selects its exact subordinate slice");
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
const expectedSchemasBoundaries = [
  ["schemas_local_browser_presentation", "browser presentation", false],
  ["schemas_shared_browser_workflows", "browser presentation", true],
  ["schemas_application_controllers", "application controller", true],
  ["schemas_persistence_and_migration", "persistence migration", true],
  ["schemas_core_semantics", "core or semantic", true],
  ["schemas_public_core_facades", "core or semantic", true],
  ["schemas_public_application_facades", "application controller", true],
  ["schemas_public_browser_facades", "browser presentation", true],
  ["schemas_installed_side_panel_boundary", "application controller", false],
  ["schema_editor_reachability_boundary", "application controller", false],
];
assert.deepEqual(schemasPack.impactBoundaries.map(({id,sourceClass,propagateDependants}) =>
  [id,sourceClass,propagateDependants]), expectedSchemasBoundaries,
"Schemas source classes and propagation are explicit registry data");
for (const changedPath of schemasPresentationPaths) assert.deepEqual(
  planVerification(packs,{changedPaths:[changedPath]}).packIds,["schemas"],
  `${changedPath} selects only complete Schemas evidence`);
const schemasBoundaryPaths = schemasPack.impactBoundaries.flatMap(({prefixes}) => prefixes);
assert.equal(schemasBoundaryPaths.length,90,"every Schemas source path has one exact boundary");
assert.equal(new Set(schemasBoundaryPaths).size,90,"Schemas impact boundaries cannot overlap");
const schemasPropagatingPaths = schemasPack.impactBoundaries
  .filter(({propagateDependants}) => propagateDependants)
  .flatMap(({prefixes}) => prefixes);
for (const changedPath of schemasPropagatingPaths) assert.deepEqual(
  planVerification(packs,{changedPaths:[changedPath]}).packIds,schemasClosure,
  `${changedPath} retains the six-pack dependant closure`);
const schemasIsolatedHandlerNames = [
  "schema_editor_reachability.clj", "allowed_value_expansion.clj", "allowed_values_rule_migration.clj",
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
assert.deepEqual(schemasPack.isolatedVerificationHandlers,schemasIsolatedHandlers);
const schemaEditorReachabilityHandler =
  "acceptance/src/acceptance/steps/schema_editor_reachability.clj";
const schemasIsolatedHandlerForNegativeChecks =
  "acceptance/src/acceptance/steps/allowed_value_expansion.clj";
const schemasHandlerEvidence = [];
for (const handlerPath of schemasIsolatedHandlers) {
  const source = await readFile(new URL(`../../${handlerPath}`, import.meta.url),"utf8");
  const servedFeatures = [...source.matchAll(/"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)]
    .map((match) => match[1]);
  assert.ok(servedFeatures.length > 0,`${handlerPath} names its owner-only served features`);
  const ownerPlan = handlerPath === schemaEditorReachabilityHandler
    ? ["schemas","schema_relationship_tree"] : ["schemas"];
  const consumers = handlerPath === schemaEditorReachabilityHandler
    ? ["schema_relationship_tree:schema_editor_return"] : [];
  assert.deepEqual(planVerification(packs,{changedPaths:[handlerPath]}).packIds,ownerPlan);
  schemasHandlerEvidence.push({path:handlerPath,servedFeatures,ownerPlan,consumers});
}
const schemasLoadedStepDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  findLoadedStepConsumers:async() => [{handler:schemasIsolatedHandlerForNegativeChecks,consumerPack:"defects",
    feature:"features/data-layer-defect-library.feature",step:"schema evidence is loaded"}],
}));
assert.match(schemasLoadedStepDiagnostic,/Loaded cross-pack step consumer blocks isolation.*defects/u);
const shellHandler = packs.find(({id}) => id === "shell").handlers.find((handler) =>
  handler.endsWith("/information_architecture.clj"));
const schemasNamespaceDiagnostic = await captureRejection(() => validateIsolatedVerificationHandlers(packs,{
  readSource:async(handlerPath) => {
    const source = await readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8");
    return handlerPath === shellHandler
      ? `${source}\n[acceptance.steps.allowed-value-expansion :refer [handlers]]\n` : source;
  },
}));
assert.match(schemasNamespaceDiagnostic,
  /Cross-pack handler consumer blocks isolation.*information_architecture/u);
const schemasMissingMetadataDiagnostic = await captureRejection(() =>
  validateIsolatedVerificationHandlers(packs,{
    readSource:async(handlerPath) => handlerPath === schemasIsolatedHandlerForNegativeChecks
      ? "(def handlers [])" : readFile(new URL(`../../${handlerPath}`,import.meta.url),"utf8"),
  }));
assert.match(schemasMissingMetadataDiagnostic,/Owner-only served features are required/u);
const schemasUnreadableAuditDiagnostic = await captureRejection(() =>
  validateIsolatedVerificationHandlers(packs,{
    findLoadedStepConsumers:async() => { throw new Error("unreadable parsed consumer evidence"); },
  }));
assert.match(schemasUnreadableAuditDiagnostic,/Isolation audit fails closed/u);
const nonIsolatedSchemasPacks = replacePack(packs,"schemas",() => ({isolatedVerificationHandlers:[]}));
const rejectedSchemasHandlerPlan = planVerification(nonIsolatedSchemasPacks,{
  changedPaths:[schemasIsolatedHandlerForNegativeChecks],
}).packIds;
assert.deepEqual(rejectedSchemasHandlerPlan,schemasClosure);
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
assert.deepEqual(schemasHistoryPlans.delete,["schemas"]);
assert.deepEqual(schemasHistoryPlans.renamePresentation,["schemas"]);
assert.deepEqual(schemasHistoryPlans.renameSharedWorkflow,schemasClosure);
assert.deepEqual(schemasHistoryPlans.unreadable,planVerification(packs,{terminalFull:true}).packIds);
const schemasBasePack = schemasBasePacks.find(({id}) => id === "schemas");

const installedSchemaDirectOwnerSet = new Set(installedSchemaDirectOwners);
const schemaPublicOperationsOwner =
  "test/data-layer-installed/schemas/library-public-operations-test.mjs";
verifySchemaPublicOwnerRegistration({
  registeredInConservedDirectOwners:installedSchemaDirectOwnerSet.has(schemaPublicOperationsOwner),
  registeredInManifest:schemasPack.unit.includes(schemaPublicOperationsOwner),
});
const currentSchemasEvidenceProfile = conservedEvidenceProfile(schemasPack);
const schemasEvidenceProfile = {
  ...currentSchemasEvidenceProfile,
  unit:currentSchemasEvidenceProfile.unit.filter((path) =>
    !installedSchemaDirectOwnerSet.has(path)&&!approvedSchemaContextExportTaskKeys.has(`unit:${path}`)&&!isSchemaWheelUnit(path)),
};
assert.deepEqual(schemasEvidenceProfile,
  conservedEvidenceProfile(schemasBasePack),
  "all Schemas owner evidence identities remain conserved");
const decomposedSchemasPlan = planVerification(packs,{packIds:["schemas"],includeProperties:true});
const addedContextTaskCount=contextPermissionTaskCount(decomposedSchemasPlan.unitTasks);
const addedWheelTaskCount=schemaWheelTaskCount(decomposedSchemasPlan.unitTasks);
const exactSchemasPlan = {
  ...decomposedSchemasPlan,
  tasks:{length:decomposedSchemasPlan.tasks.length-installedSchemaDirectOwners.length+1-addedContextTaskCount-addedWheelTaskCount},
  unitTasks:{length:decomposedSchemasPlan.unitTasks.length-installedSchemaDirectOwners.length+1-addedContextTaskCount-addedWheelTaskCount},
};
assert.equal(exactSchemasPlan.tasks.length,298);
assert.deepEqual([exactSchemasPlan.unitTasks.length,exactSchemasPlan.propertyTasks.length,
  exactSchemasPlan.parserTasks.length,schemasPack.handlers.length,exactSchemasPlan.browserTasks.length,
  exactSchemasPlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).length,
  exactSchemasPlan.checkpointTasks.length],[53,29,105,61,2,46,1]);
assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities,
  "terminal planning conserves every Schemas task identity and ordering");
const schemasCalibration = vtd004CurrentCalibration.runnablePacks.find(({id}) => id === "schemas");
const schemasPreviousCalibration = schemasBaseCalibration.runnablePacks.find(({id}) => id === "schemas");
assert.deepEqual({selectedPacks:schemasCalibration.selectedPacks,
  fanOut:schemasCalibration.changedPathFanOut.limit,
  duration:[schemasCalibration.changedPathDuration.baseline,
    schemasCalibration.changedPathDuration.tolerance,schemasCalibration.changedPathDuration.limit]},
{selectedPacks:["schemas"],fanOut:0,duration:[149.6,1.2,180]});
const vtd005EditorTargetIds = ["LAYERED_SCHEMA_EDITOR_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET",
  "LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET"];
const schemasCalibrationProjection = structuredClone(vtd004CurrentCalibration);
schemasCalibrationProjection.runnablePacks = schemasCalibrationProjection.runnablePacks.map((row) =>
  ["layered_schema", "shell"].includes(row.id)
    ? schemasBaseCalibration.runnablePacks.find(({id}) => id === row.id) : row);
for (const id of vtd005EditorTargetIds) {
  schemasCalibrationProjection.browserTargets[id] = schemasBaseCalibration.browserTargets[id];
}
for (const key of calibrationProvenanceKeys) {
  schemasCalibrationProjection[key] = schemasBaseCalibration[key];
}
const schemasOtherCurrent = schemasCalibrationProjection.runnablePacks.filter(({id}) => id !== "schemas");
const schemasOtherBase = schemasBaseCalibration.runnablePacks.filter(({id}) => id !== "schemas");
assert.deepEqual(schemasOtherCurrent,schemasOtherBase);
assert.deepEqual(schemasCalibrationProjection.browserTargets,schemasBaseCalibration.browserTargets);
assert.deepEqual(calibrationProvenance(schemasCalibrationProjection),calibrationProvenance(
  schemasBaseCalibration));
const schemasInstalledSource = await readFile(
  new URL("../../test/support/side-panel-browser-fixture-primitives.mjs",import.meta.url),"utf8");
const schemasPresentationTargets = [
  ["ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER", "allowedValueExpansionObservation"],
  ["GUIDED_VALIDATION_BROWSER_ADAPTER", "guidedSchemaPickerObservation"],
  ["LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER", "liveSchemaPropertyDeclarationObservation"],
  ["LOCAL_RULE_PROMOTION_BROWSER_ADAPTER", "localRulePromotionObservation"],
  ["SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER", "schemaAssignmentDataConditionsObservation"],
  ["SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER", "schemaPropertyCopyObservation"],
  ["SCHEMA_PROPERTY_TYPE_EDITING_BROWSER_ADAPTER", "schemaPropertyTypeEditingObservation"],
  ["SCHEMA_SPECIFICATION_BUILDER_BROWSER_ADAPTER", "schemaSpecificationBuilderObservation"],
];
const schemasRegisteredTargets = new Set(schemasPack.browserObservations.map(({id}) => id));
for (const [targetId,observation] of schemasPresentationTargets) {
  assert.ok(schemasRegisteredTargets.has(targetId),`${targetId} remains in the Schemas browser batch`);
  assert.match(schemasInstalledSource,new RegExp(observation,"u"),
    `${targetId} retains direct installed-browser result evidence`);
}
const vtd004SchemasAcceptance = {
  currentPlans:Object.fromEntries([...schemasPresentationPaths,...schemasPropagatingPaths]
    .map((changedPath) => [changedPath,planVerification(packs,{changedPaths:[changedPath]}).packIds])),
  historyPlans:schemasHistoryPlans,handlers:schemasHandlerEvidence,
  isolationAudit:{schemasLoadedStepDiagnostic,schemasNamespaceDiagnostic,
    missingMetadataDiagnostic:schemasMissingMetadataDiagnostic,
    unreadableAuditDiagnostic:schemasUnreadableAuditDiagnostic,rejectedSchemasHandlerPlan,
    metadataCannotConceal:true},
  conservation:{evidenceProfile:schemasEvidenceProfile,
    ...schemaConservationCounts(exactSchemasPlan,schemasEvidenceProfile),
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
emitPreparedEvidence("vtd004SchemasAcceptance", vtd004SchemasAcceptance,
  { handlers:{ requirement:"nonempty" } });
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "shell", (pack) => ({
  verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
    "test/browser-packs/shared-harness.mjs"
    ? { ...helper, consumers:helper.consumers.filter((id) => id !== "schemas") }
    : helper),
}))), /Correct verification helper consumers.*shared-harness.*schemas/u,
"registry validation rejects an undeclared helper consumer with helper path and pack identity");
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "layered_schema", (pack) => ({
  impactBoundaries:pack.impactBoundaries.map((boundary) => boundary.id === "canonical_editor_rule_authoring"
    ? { ...boundary, prefixes:boundary.prefixes.filter((prefix) =>
      prefix !== "src/data-layer-string-rule-validation.ts") }
    : boundary),
}))), /Classify source path src\/data-layer-string-rule-validation.*exactly one impact boundary/u,
"registry validation rejects a newly unclassified layered-schema source path");
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "layered_schema", (pack) => ({
  impactBoundaries:pack.impactBoundaries.map((boundary) => boundary.id === "canonical_schema_core"
    ? { ...boundary, prefixes:[...boundary.prefixes,
      "src/data-layer-canonical-schema-focused-editor.ts"] }
    : boundary),
}))), /Classify source path src\/data-layer-canonical-schema-focused-editor.ts.*exactly one impact boundary/u,
"registry validation rejects overlapping layered-schema impact boundaries");
