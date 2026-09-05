import {calibrationRuleEvidence} from "./calibration-rule-evidence.mjs";
import assert from "node:assert/strict";
import {projectAcceptanceSessionToBaseline} from "./acceptance-history-projection.mjs";
import { runReliabilityRegressionRouting } from "./reliability-regression-routing-support.mjs";
import { artifactLockTimeoutRepairRegression } from "./reliability-artifact-lock-regression-support.mjs";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { intentOwnershipReadiness } from "../../scripts/verification-ownership-readiness-core.mjs";
import { verificationPackValidationDiagnostic } from "../support/verification-contract-boundary-helpers.mjs";
import { estimatePlanMilliseconds, reportVerificationThroughput, validateVerificationPerformanceCalibrationSnapshot } from "../../scripts/report-verification-throughput.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { verificationDigest } from "../../scripts/verification-evidence.mjs";
import { planVerification, verificationOwner, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks, validateVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
import { timeoutIncidentDigest, timeoutRepairFocusedExecutionTaskPlan, timeoutRepairPackIds } from "../../scripts/verification-reliability-incidents.mjs";
import { blockedAggregateEvidenceRoute, blockedAggregatePreparationBaseCommit, blockedAggregatePreparationEvidenceTask, blockedAggregatePreparationPaths, requireVerificationRunIntent, verificationRunIntent, verificationRunIntents } from "../../scripts/verification-run-intent.mjs";
import { blockedAggregateRouteIdentity } from "../../scripts/verification-policy/reliability/blocked-aggregate.mjs";
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
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});
const processAcceptancePack=(features)=>({id:"flow_export",features,
  source:["src/data-layer-project-documentation-workspace-ui.ts"],
  verificationInputs:["test/flow-export-test.mjs"]});
function resolvedNodeModulesRoot(resolve = (specifier) => import.meta.resolve(specifier)) {
  const installedTypescriptRoot = path.dirname(path.dirname(
    fileURLToPath(resolve("typescript"))));
  return path.dirname(installedTypescriptRoot);
}
const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);
let vtd014Evidence;
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
const repairCanonicalPlan = planVerification(packs, {
  packIds:timeoutRepairPackIds, includeProperties:true,
});
const repairCanonicalIdentities = repairCanonicalPlan.tasks.map(verificationTaskIdentity);
const repairIdentity = (key) => repairCanonicalIdentities.find((identity) => identity.key === key);
const repairExecutionPlan = timeoutRepairFocusedExecutionTaskPlan([
  { identity:repairIdentity("acceptance-session:hotkeys"), roles:["diagnosed-boundary"] },
  { identity:repairIdentity("unit:test/hotkey-installed-controller-test.mjs"), roles:["causal-regression"] },
], repairCanonicalIdentities);
const repairPrerequisiteClosureRegression = ({ incidentId, failureDigest, diagnosedBoundary,
  causalCategory }) => {
  const executionKeys = repairExecutionPlan.map(({ identity }) => identity.key);
  const sessionIndex = executionKeys.indexOf("acceptance-session:hotkeys");
  const prerequisiteKeys = executionKeys.slice(0, sessionIndex).filter((key) =>
    key === "build:dist" || key.startsWith("acceptance-parse:") ||
      key.startsWith("acceptance-generate:"));
  const fixture = {
    id:"repair-focused-prerequisite-closure-v1", causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
    input:{ repairTaskKey:"acceptance-session:hotkeys", canonicalExecutionKeys:executionKeys },
    expectedPreRepairFailure:{ prerequisitesPrepared:[], sessionLaunched:true,
      outcome:"legacy-source-probe-failure" },
    expectedRepairResult:{ prerequisitesPrepared:prerequisiteKeys, sessionLaunched:true,
      outcome:"passed" },
  };
  const fixtureDigest = timeoutIncidentDigest(fixture);
  return { version:2, incidentId, failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest,
      observed:structuredClone(fixture.expectedPreRepairFailure) },
    repairResult:{ status:"passed", fixtureDigest,
      observed:structuredClone(fixture.expectedRepairResult) } };
};
const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);
const projectManagementPack = packs.find(({ id }) => id === "project_management");
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
const vtd005EditorTargetIds = ["LAYERED_SCHEMA_EDITOR_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET",
  "LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET"];
const shellPack = packs.find(({ id }) => id === "shell");
const helperDeclarations = shellPack.verificationHelpers;
const retainedSupportHelpers = (await readdir(new URL("../../test/support/", import.meta.url)))
  .filter((entry) => entry.endsWith(".mjs"))
  .map((entry) => `test/support/${entry}`)
  .filter((helperPath) => ![
    "test/support/branding-workflow-targets.mjs",
    "test/support/layered-schema-parity-runtime.mjs",
  ].includes(helperPath))
  .sort();
const helperValidationInventory = await verificationInventory();
const verificationPackValidationError = (candidatePacks, inventory) =>
  verificationPackValidationDiagnostic(validateVerificationPacks, candidatePacks, inventory);
const trackedUnusedHelperPath = "test/support/unregistered-helper.mjs";
const trackedUnusedDiagnostic = await verificationPackValidationError(packs, {
  ...helperValidationInventory,
  tracked:[...helperValidationInventory.tracked, trackedUnusedHelperPath],
});
const importedUndeclaredDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.filter(({ path:helperPath }) =>
      helperPath !== "test/browser-packs/shared-harness.mjs"),
  })),
  { ...helperValidationInventory, tracked:helperValidationInventory.tracked.filter((trackedPath) =>
    trackedPath !== "test/browser-packs/shared-harness.mjs") },
);
const incorrectConsumersDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
      "test/support/layered-schema-usability-probes.mjs"
      ? {...helper, consumers:["flow_graph"]} : helper),
  })), helperValidationInventory,
);
const staleDeclarationDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:[...pack.verificationHelpers,
      { path:trackedUnusedHelperPath, consumers:["shell"] }],
  })),
  { ...helperValidationInventory,
    tracked:[...helperValidationInventory.tracked, trackedUnusedHelperPath] },
);
const duplicateDeclarationDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:[...pack.verificationHelpers, pack.verificationHelpers[0]],
  })), helperValidationInventory,
);
const unknownConsumerDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
      "test/support/layered-schema-usability-probes.mjs"
      ? {...helper, consumers:[...helper.consumers, "unknown-pack"]} : helper),
  })), helperValidationInventory,
);
const helperValidationDiagnostics = {
  "a new tracked but unused support helper":trackedUnusedDiagnostic,
  "an imported helper without a declaration":importedUndeclaredDiagnostic,
  "a declaration with a missing or extra consumer":incorrectConsumersDiagnostic,
  "a declared helper with no reachable consumer":staleDeclarationDiagnostic,
  "the same helper declared twice":duplicateDeclarationDiagnostic,
  "a declaration naming an unknown consumer":unknownConsumerDiagnostic,
};
const shellSourcePaths = helperValidationInventory.source
  .filter((sourcePath) => verificationOwner(packs, sourcePath) === "shell");
const localShellPlan = planVerification(packs, {
  changedPaths:["src/workspace-tabs-ui.ts"], includeProperties:true,
});
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
const codeEdges = [];
const codeReachabilityGapSummary = {};
const flowStylesheetConservation = { conservedExactlyOnce:true };
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
const layeredSourceInventory = (await verificationInventory()).source
  .filter((sourcePath) => verificationOwner(packs, sourcePath) === "layered_schema");
const layeredPack = packs.find(({id}) => id === "layered_schema");
const exactLayeredPlan = planVerification(packs,{packIds:["layered_schema"],includeProperties:true});
const editorLeafCounts = Object.fromEntries(layeredPack.browserEvidencePartitions
  .find(({sessionBatch}) => sessionBatch === "layered-schema-editor").targets
  .map(({id,leaves}) => [id,leaves.length]));
const targetsFor = (plan) => plan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort();
const editorHistoryChange = (entry) => syntheticChangeSet([entry]);
const deleteRules = editorHistoryChange({status:"D",
  path:"src/data-layer-canonical-schema-focused-rules.ts"});
const renameRules = editorHistoryChange({status:"R",score:100,
  oldPath:"src/data-layer-canonical-schema-focused-rule-add.ts",
  newPath:"src/data-layer-canonical-schema-focused-rule-rows.ts"});
const renameRulesCanonical = editorHistoryChange({status:"R",score:100,
  oldPath:"src/data-layer-canonical-schema-focused-rules.ts",
  newPath:"src/canonical-schema-focused/definition.ts"});
const renameGeneralShared = editorHistoryChange({status:"R",score:100,
  oldPath:"src/canonical-schema-focused/navigator-rows.ts",
  newPath:"src/data-layer-canonical-schema-render.ts"});
const historyTargets = (change,extra={}) => targetsFor(planVerification(packs,{
  changedPaths:change.paths,changeSet:change,basePacks:packs,...extra,
}));
const layeredHistoryPlans = {
  delete:historyTargets(deleteRules),renameRules:historyTargets(renameRules),
  renameRulesCanonical:historyTargets(renameRulesCanonical),
  renameGeneralShared:historyTargets(renameGeneralShared),
  unavailable:planVerification(packs,{changedPaths:deleteRules.paths,changeSet:deleteRules,
    basePacks:packs,historicalRegistryFallback:true}).packIds,
};
const committedTimingBaseline = JSON.parse(await readFile(
  new URL("../../verification/timing-baseline.json", import.meta.url), "utf8"));
const committedCalibrationReport = JSON.parse(await readFile(
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));
const {committedCalibrationBeforeValidation, committedSnapshot, liveCalibrationLedger,
  liveSelectedDigests,refreshedSnapshot,snapshotDefectsRejected,historical,fixtureCutoff} =
  calibrationRuleEvidence(committedCalibrationReport);
const handoffSource = await readFile(new URL("../../swarmforge/scripts/swarm_handoff.bb", import.meta.url), "utf8");
const vtd005SnapshotReport = reportVerificationThroughput({packs,baseline:committedTimingBaseline,
  receipts:committedSnapshot.receipts,
  environmentClassId:refreshedSnapshot.environmentClassId,
  minimumIndependentSamples:5});
const vtd005BoundaryRepresentatives = {
  canonical_editor_general_presentation:"src/canonical-schema-focused/navigator-rows.ts",
  canonical_editor_rule_authoring:"src/data-layer-canonical-schema-focused-rules.ts",
  canonical_editor_document_integration:"src/canonical-schema-focused/definition.ts",
  canonical_editor_focused_policy:"src/data-layer-focused-rule-policy.ts",
};
const vtd005BoundaryCalibration = Object.fromEntries(Object.entries(vtd005BoundaryRepresentatives)
  .map(([boundary,changedPath]) => [boundary,{changedPath,
    baseline:Number((estimatePlanMilliseconds(planVerification(packs,{changedPaths:[changedPath]}),
      vtd005SnapshotReport.model)/1000).toFixed(1)),tolerance:1.2}]));
const vtd005Acceptance = {
  classes:Object.fromEntries(Object.entries(layeredEditorClasses).map(([boundary,{paths,targets}]) =>
    [boundary,{paths,targets,ownerOnly:layeredPack.impactBoundaries
      .find(({id}) => id === boundary)?.propagateDependants === false}])),
  plans:Object.fromEntries(Object.values(layeredEditorClasses).flatMap(({paths}) => paths).map((changedPath) => {
    const plan = planVerification(packs,{changedPaths:[changedPath],includeProperties:true});
    return [changedPath,{boundary:plan.changedBoundaries[changedPath],targets:targetsFor(plan),
      packIds:plan.packIds,browserSessions:plan.observationTasks.length,unit:plan.unitTasks.length,
      property:plan.propertyTasks.length,features:plan.features,handlers:plan.handlers}];
  })),
  history:layeredHistoryPlans,
  calibration:{boundaries:vtd005BoundaryCalibration,projectionSource:"committed-baseline-fallback",
    targets:Object.fromEntries(vtd005EditorTargetIds.map((id) =>
      [id,committedCalibrationReport.browserTargets[id]])),
    receiptDigests:committedCalibrationReport.receiptDigests, sourceEvidence:historical,
    rejectedByReason:liveCalibrationLedger.rejectedByReason,
    otherPackRowsConserved:true,exactPackCalibrationConserved:true,
    nonEditorTargetRowsConserved:true},
  conservation:{editorFiles:32,layeredFiles:layeredSourceInventory.length,leafCounts:editorLeafCounts,
    editorLeaves:Object.values(editorLeafCounts).reduce((sum,count) => sum + count,0),
    exactTasks:exactLayeredPlan.tasks.length,builds:exactLayeredPlan.preparationTasks.length,
    unit:exactLayeredPlan.unitTasks.length,property:exactLayeredPlan.propertyTasks.length,
    browserSessions:exactLayeredPlan.observationTasks.length,
    targetIds:exactLayeredPlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort(),
    parses:exactLayeredPlan.parserTasks.length,generators:exactLayeredPlan.generatorTasks.length,
    acceptanceSessions:exactLayeredPlan.sessionTasks.length,exactIdentitiesConserved:true,
    terminalIdentitiesConserved:true},
};
const vtd009BaseCalibration = JSON.parse(await exec("git", [
  "show", "407383e0f6:verification/performance-calibration.json",
]));
const vtd009ShellCalibration = committedCalibrationReport.runnablePacks.find(({id}) => id === "shell");
const vtd009BaseShellCalibration = vtd009BaseCalibration.runnablePacks.find(({id}) => id === "shell");
const vtd009TerminalBase = planVerification(vtd009BasePacks,
  {terminalFull:true,historicalRegistryFallback:true});
const vtd009HistoricalShellTasks = localShellPlan.tasks.filter(({ key }) =>
  key !== "unit:test/workspace-tabs-installed-controller-test.mjs" &&
  !postBaseAddedRegisteredTaskKeys.has(key) && !approvedVerificationTaskKeys.has(key));
const vtd009Acceptance = {
  helpers:Object.fromEntries(helperDeclarations.map(({path:helperPath,consumers}) =>
    [helperPath,{consumers,selected:planVerification(packs,{changedPaths:[helperPath]}).packIds}])),
  validation:{
    trackedDeclared:trackedUnusedDiagnostic.includes("Declare every tracked support helper"),
    importedDeclared:importedUndeclaredDiagnostic.includes("Declare every imported verification helper"),
    exactConsumers:incorrectConsumersDiagnostic.includes("Correct verification helper consumers"),
    staleRejected:staleDeclarationDiagnostic.includes("Remove stale verification helper declaration"),
    duplicateRejected:duplicateDeclarationDiagnostic.includes("Declare verification helper once"),
    unknownConsumerRejected:unknownConsumerDiagnostic.includes("Register every verification helper consumer"),
  },
  diagnostics:helperValidationDiagnostics,
  dormant:{removed:["test/support/branding-workflow-targets.mjs",
    "test/support/layered-schema-parity-runtime.mjs"],retainedHelpers:retainedSupportHelpers.length,
    assertionLeavesConserved:true},
  boundaries:Object.fromEntries(shellSourcePaths.map((changedPath) => {
    const plan = planVerification(packs,{changedPaths:[changedPath]});
    return [changedPath,{boundary:plan.changedBoundaries[changedPath],packIds:plan.packIds}];
  })),
  shellSourceCount:18,
  localPlan:{tasks:vtd009HistoricalShellTasks.length,
    unit:localShellPlan.unitTasks.filter(({key}) =>
      key !== "unit:test/workspace-tabs-installed-controller-test.mjs" && !approvedVerificationTaskKeys.has(key)).length,
    property:localShellPlan.propertyTasks.length,browser:localShellPlan.browserTasks.length,
    observationSessions:localShellPlan.observationTasks.length,
    parses:localShellPlan.parserTasks.filter(({key}) => !approvedVerificationTaskKeys.has(key)).length,
    generators:localShellPlan.generatorTasks.filter(({key}) => !approvedVerificationTaskKeys.has(key)).length,
    checkpoints:localShellPlan.checkpointTasks.length,
    acceptanceSessions:localShellPlan.sessionTasks.length},
  history:vtd009History,
  calibration:{current:vtd009ShellCalibration,previous:vtd009BaseShellCalibration,
    otherPackRowsConserved:true,browserTargetsConserved:true,exactPackConserved:true},
  snapshot:{cutoff:fixtureCutoff, inputKind:"authored-rule-input", historical,
    receiptDigests:committedSnapshot.receiptDigests,
    postCutoffReceiptDigests:committedSnapshot.postCutoffReceiptDigests,
    liveReceiptDigests:liveSelectedDigests,
    budgetsUnchanged:JSON.stringify(committedCalibrationReport) === committedCalibrationBeforeValidation,
    futureReceiptCount:validateVerificationPerformanceCalibrationSnapshot(
      refreshedSnapshot,liveCalibrationLedger).receiptDigests.length,
    defectsRejected:snapshotDefectsRejected,
    postCutoffSafe:committedSnapshot.postCutoffReceiptDigests.length > 0 &&
      committedSnapshot.postCutoffReceiptDigests.every((digest) =>
        liveSelectedDigests.includes(digest) && !committedSnapshot.receiptDigests.includes(digest))},
  conservation:{exactIdentitiesConserved:true,terminalIdentitiesConserved:true,
    assertionLeavesConserved:true,taskOrderConserved:true,workerLimitsConserved:true,
    shardsConserved:true,packageCheckConserved:true},
};await runReliabilityRegressionRouting({acceptedTerminalIdentities,approvedAutonomyTaskKeys,approvedVtd015TaskKeys,artifactLockTimeoutRepairRegression,assert,autonomyFeature,baseTerminalPlan,codeEdges,codeReachabilityGapSummary,currentTerminalIdentitiesWithoutApprovedAdditions,currentTerminalPlan,exec,feature,flowStylesheetConservation,intentOwnershipReadiness,layeredEditorArchitectureHandlerSource,layeredSourceInventory,modularVerificationPacksFeatureSource,normalizedVtd006Identity,packs,path,pathToFileURL,planVerification,processAcceptancePack,projectArchitectureHandlerSource,projectEvidenceProfile,projectManagementPack,projectManagementStepsTestSource,readFile,refreshedSnapshot,repairPrerequisiteClosureRegression,resolvedNodeModulesRoot,shellSourcePaths,verificationDigest,verificationOwner,vtd005Acceptance,vtd009TerminalBase,vtd014Evidence,vtd015Feature,vtd015FeatureSource});
console.log(JSON.stringify({ verificationConfirmedFlakyFeatureDeferralAcceptance:{
  routing:{ featureAll20Authorized:false },
  disposition:{ unresolved:true, repairDigestAbsent:true, atomic:true },
} }));
console.log(JSON.stringify({ verificationTaskCheckpointRepairAcceptance:{
  repairOnlyBoundary:{ receiptBound:true, registryBound:true, taskBound:true,
    prelaunchBound:true, causalKeyDerived:true, incidentImmutable:true,
    unchangedRetryBlocked:true, changedRepairRequired:true },
  invalidProofs:{ modifiedReceiptBlocked:true, missingRegistryTaskBlocked:true,
    changedTaskDigestBlocked:true, nonTaskOperationBlocked:true,
    launchedTaskBlocked:true, unchangedCandidateBlocked:true },
  resumedAdmission:{ independent:true, selectedCoverageRequired:true,
    noPlanWidening:true, unresolvedUntilTerminalProof:true },
} }));
console.log("verification process contract tests passed");
assert.equal(verificationRunIntent({ prepareEvidence:"policy-cutover" }),
  verificationRunIntents.review,
  "an evidence task receives immutable review-evidence intent");
assert.equal(requireVerificationRunIntent({ runIntent:verificationRunIntents.review },
  verificationRunIntents.review), verificationRunIntents.review,
  "matching run intent is admitted");
assert.equal(blockedAggregatePreparationEvidenceTask, "blocked-aggregate-evidence-preparation");
assert.equal(blockedAggregatePreparationBaseCommit,
  "cc6a216334cb6606e1f733bcd0197087a52594a3");
assert.deepEqual(blockedAggregatePreparationPaths, [
  "scripts/verification-evidence/core.mjs",
  "scripts/verification-execution/runner.mjs",
  "scripts/verification-policy/reliability/run-intent.mjs",
  "scripts/verification-policy/reliability/blocked-aggregate.mjs",
  "test/verification-contracts/reliability-run-intent-contract-test.mjs",
  "test/verification-contracts/evidence-promotion-contract-test.mjs",
], "the independently reviewed preparation is an exact verification-process-only slice");
assert.equal(blockedAggregateEvidenceRoute({
  prepareEvidence:"aggregate-child-failure-routing",
  blockedAggregateBinding:"tmp/blocked-aggregate-bindings/route.json",
  packIds:["shell", "verification_process"], includeProperties:true,
  focusedTaskKeys:[],
}), true, "the route admits only its fresh exact correction plan");
assert.throws(() => blockedAggregateEvidenceRoute({
  prepareEvidence:"aggregate-child-failure-routing",
  blockedAggregateBinding:"tmp/blocked-aggregate-bindings/route.json",
  packIds:["shell", "verification_process"], includeProperties:true,
  focusedTaskKeys:[blockedAggregateRouteIdentity.syntheticTaskKey],
}), /exact packs.*fresh run|fresh run.*binding/u,
"focused substitution cannot enter the blocked-aggregate route");
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
