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
const packs = await loadVerificationPacks();
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
// Verification reachability follows executable verification consumers, not every production
// import. The mandatory common build owns type/architecture coverage for src-to-src imports;
// dependencies and sharedComponents remain the explicit behavioral fan-out declarations.
const registeredVerificationConsumerPaths = [...new Set(packs.flatMap((pack) => [
  ...["unit", "property", "browserAdapters"].flatMap((key) => pack[key] ?? []),
  ...(pack.browserObservations ?? []).map(({ path:observationPath }) => observationPath),
  ...(pack.checkpointCommands ?? []).flatMap(({ executable, args }) =>
    executable === "node" && args?.[0]?.endsWith(".mjs") ? [args[0]] : []),
]))].filter((modulePath) => modulePath.endsWith(".mjs"));
const codeEdges = [];
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
import { candidateRepositoryPaths } from "../../scripts/verification-registry/candidate-inventory.mjs";
import { compileVerificationRegistry, serializeVerificationRegistry } from "../../scripts/verification-registry/compiler.mjs";
import { loadCompiledVerificationRegistry } from "../../scripts/verification-registry/loader.mjs";
