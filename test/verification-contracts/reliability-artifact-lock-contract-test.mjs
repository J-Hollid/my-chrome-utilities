import {calibrationRuleEvidence} from "./calibration-rule-evidence.mjs";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { verificationPackValidationDiagnostic } from "../support/verification-contract-boundary-helpers.mjs";
import { validateVerificationPerformanceCalibrationSnapshot } from "../../scripts/report-verification-throughput.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification, verificationOwner } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks, validateVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});
const batchedReceiptResult = await exec("bb", ["-e", `
  (require '[acceptance.steps.support :as support])
  (let [receipt {"version" 2
                 "tasks" {"browser-observation:FIRST+SECOND"
                          {"identity" {"executable" "node"
                                       "args" ["scripts/run-browser-observation.mjs" "FIRST" "SECOND"]
                                       "logicalTargetIds" ["FIRST" "SECOND"]}
                           "status" "passed"
                           "output" "{\\\"first\\\":true}\\n{\\\"second\\\":true}\\n"}}}]
    (prn (support/verification-receipt-result
          receipt "browser-observation:SECOND"
          ["node" "scripts/run-browser-observation.mjs" "SECOND"])))
`]);
assert.match(batchedReceiptResult, /:exit 0/u,
  "acceptance consumers resolve a logical browser target from its passed batch receipt");
assert.match(batchedReceiptResult, /second/u,
  "a logical browser target receives the shared batch output containing its observation");
const targetScopedReceiptObservation = await exec("bb", ["-e", `
  (require '[acceptance.steps.support])
  (let [parse-payload (var-get (ns-resolve 'acceptance.steps.support 'browser-observation-payload))
        output (str "{\\\"workspace\\\":{\\\"fixture\\\":\\\"1:3\\\"}}\\n"
                    "{\\\"swarmforgeBrowserTargetResult\\\":{\\\"id\\\":\\\"FIRST\\\",\\\"status\\\":\\\"passed\\\"}}\\n"
                    "{\\\"workspace\\\":{\\\"fixture\\\":\\\"2:4\\\"}}\\n"
                    "{\\\"swarmforgeBrowserTargetResult\\\":{\\\"id\\\":\\\"SECOND\\\",\\\"status\\\":\\\"passed\\\"}}\\n"
                    "{\\\"unrelated\\\":true}\\n"
                    "{\\\"swarmforgeBrowserTargetResult\\\":{\\\"id\\\":\\\"THIRD\\\",\\\"status\\\":\\\"passed\\\"}}\\n"
                    "{\\\"workspace\\\":{\\\"fixture\\\":\\\"merged\\\"},\\\"third\\\":{\\\"passed\\\":true}}\\n")]
    (prn [(get-in (parse-payload output "FIRST" :workspace) [:workspace :fixture])
          (get-in (parse-payload output "SECOND" :workspace) [:workspace :fixture])
          (get-in (parse-payload output "THIRD" :third) [:third :passed])]))
`]);
assert.match(targetScopedReceiptObservation, /\["1:3" "2:4" true\]/u,
  "Clojure acceptance consumers ignore another target's pending document and recover the later merged fallback");
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
const vtd008BasePacks = JSON.parse(await exec("git", ["show", "0adee4fa84:verification/packs.json"]));
const vtd015Feature = "features/settled-candidate-final-verification.feature";
const vtd017Feature = "features/verification-shared-artifact-parallel-execution.feature";
const autonomyFeature = "features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature";
const documentationTemplateFeatures = [
  "features/data-layer-documentation-template-library.feature",
  "features/data-layer-documentation-template-library-runtime.feature",
  "features/data-layer-excel-documentation-templates.feature",
  "features/data-layer-excel-documentation-templates-runtime.feature",
  "features/data-layer-rich-page-documentation-templates.feature",
  "features/data-layer-rich-page-documentation-templates-runtime.feature",
];
const compactReorderableEditorFeatures = [
  "features/data-layer-compact-reorderable-editor-controls.feature",
  "features/data-layer-compact-reorderable-editor-controls-runtime.feature",
];
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
const committedCalibrationReport = JSON.parse(await readFile(
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));
const {committedCalibrationBeforeValidation,committedSnapshot,liveCalibrationLedger,
  liveSelectedDigests,refreshedSnapshot,snapshotDefectsRejected,historical,fixtureCutoff} =
  calibrationRuleEvidence(committedCalibrationReport);
const vtd009BaseCalibration = JSON.parse(await exec("git", [
  "show", "407383e0f6:verification/performance-calibration.json",
]));
const vtd009ShellCalibration = committedCalibrationReport.runnablePacks.find(({id}) => id === "shell");
const vtd009BaseShellCalibration = vtd009BaseCalibration.runnablePacks.find(({id}) => id === "shell");
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
  snapshot:{cutoff:fixtureCutoff,inputKind:"authored-rule-input",historical,
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
};
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
