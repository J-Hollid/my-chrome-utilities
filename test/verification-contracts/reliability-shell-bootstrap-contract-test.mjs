import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { verificationPackValidationDiagnostic } from "../support/verification-contract-boundary-helpers.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification, verificationOwner, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks, validateVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
import { runIntentBootstrapCoverage, validateRunIntentBootstrapBase, verificationRegistryPlannerBootstrapEligibility } from "../../scripts/verification-run-intent.mjs";
import { persistBootstrapTerminalObligationSourceReceipt, readBootstrapTerminalObligationSourceReceipt, verifyCommittedReviewTransaction } from "../../scripts/settled-final-verification.mjs";
import { verificationTaskDigest } from "../../scripts/verification-task-succession.mjs";
import { defaultRepositoryRuntimeDirectory } from "../../scripts/verification-reliability-persistence.mjs";
import { reviewAdmissionTransactionOwnsDeferrals } from "../../scripts/verification-reliability-runtime.mjs";
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
const shellPlan = planVerification(packs, { packIds:["shell"] });
const bootstrapBase = await validateRunIntentBootstrapBase({
  root:"fixture", baseCommit:"approved-contract-base",
  changedPaths:["scripts/verification-run-intent.mjs"],
  readCommitFile:async(_root, _commit, file) => file.endsWith("modular-verification-packs.feature")
    ? "Modular verification packs 159\nModular verification packs 160\n" : null,
});
const registryPlannerFeature = [18, 19, 20]
  .map((number) => `Verification registry and planner modularization 0${number}`).join("\n");
const registryPlannerBasePacks = packs.filter(({ id }) => id !== "verification_process");
const registryPlannerBootstrapPacks = [...registryPlannerBasePacks, {
  id:"verification_process", source:[], dependencies:[], unit:[], property:[], features:[],
  plannedFeatures:["features/verification-registry-planner-modularization.feature"],
  handlers:[], browserAdapters:[], browserAdapterModes:[], browserObservations:[],
  checkpointCommands:[],
}];
const registryPlannerBootstrap = verificationRegistryPlannerBootstrapEligibility({
  baseCommit:"ef899ddb417b70c4136a5d2b419431e38673c172", feature:registryPlannerFeature,
  registry:JSON.stringify(registryPlannerBasePacks), candidatePacks:registryPlannerBootstrapPacks,
  changedPaths:[
    "scripts/run-focused-acceptance.mjs",
    "scripts/settled-final-verification.mjs",
    "scripts/verification-evidence.mjs",
    "scripts/verification-reliability-persistence.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-runtime.mjs",
    "scripts/verification-reliability-store.mjs",
    "scripts/verification-run-intent.mjs",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/verification-process-contract-test.mjs",
    "verification/packs.json",
  ],
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
});
assert.equal(registryPlannerBootstrap.kind, "verification-registry-planner-ownership");
assert.equal(registryPlannerBootstrap.terminalConserved, true);
assert.throws(() => verificationRegistryPlannerBootstrapEligibility({
  baseCommit:"ef899ddb417b70c4136a5d2b419431e38673c172", feature:registryPlannerFeature,
  registry:JSON.stringify(registryPlannerBasePacks),
  candidatePacks:[...registryPlannerBootstrapPacks, {
    id:"unauthorized_metadata", source:[], dependencies:[], unit:[], property:[], features:[],
    plannedFeatures:[], handlers:[], browserAdapters:[], browserAdapterModes:[],
    browserObservations:[], checkpointCommands:[],
  }],
  changedPaths:[
    "scripts/run-focused-acceptance.mjs",
    "scripts/settled-final-verification.mjs",
    "scripts/verification-evidence.mjs",
    "scripts/verification-reliability-persistence.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-runtime.mjs",
    "scripts/verification-reliability-store.mjs",
    "scripts/verification-run-intent.mjs",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/verification-process-contract-test.mjs",
    "verification/packs.json",
  ],
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
}), /exact registry delta/u,
"the ownership bootstrap rejects an additional non-runnable metadata pack");
assert.throws(() => verificationRegistryPlannerBootstrapEligibility({
  baseCommit:"unrelated-base", feature:registryPlannerFeature,
  registry:JSON.stringify(registryPlannerBasePacks), candidatePacks:registryPlannerBootstrapPacks,
  changedPaths:[
    "scripts/run-focused-acceptance.mjs",
    "scripts/settled-final-verification.mjs",
    "scripts/verification-evidence.mjs",
    "scripts/verification-reliability-persistence.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-runtime.mjs",
    "scripts/verification-reliability-store.mjs",
    "scripts/verification-run-intent.mjs",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/verification-process-contract-test.mjs",
    "verification/packs.json",
  ],
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
}), /authorized base lineage/u,
"the ownership bootstrap rejects an arbitrary base label");
assert.throws(() => verificationRegistryPlannerBootstrapEligibility({
  baseCommit:"ef899ddb417b70c4136a5d2b419431e38673c172", feature:registryPlannerFeature,
  registry:JSON.stringify(registryPlannerBasePacks), candidatePacks:registryPlannerBootstrapPacks,
  changedPaths:[
    "scripts/run-focused-acceptance.mjs",
    "scripts/settled-final-verification.mjs",
    "scripts/verification-reliability-persistence.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-runtime.mjs",
    "scripts/verification-reliability-store.mjs",
    "scripts/verification-run-intent.mjs",
    "src/data-layer-installed/runtime.ts",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/verification-process-contract-test.mjs",
    "verification/packs.json",
  ],
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
}), /bounded preparation paths/u,
"the ownership bootstrap rejects product or later-task implementation paths");
const bootstrapPlan = planVerification(packs, { packIds:["shell"] });
const bootstrapTask = verificationTaskIdentity(bootstrapPlan.tasks.find(({ stage }) => stage === "unit"));
const bootstrapIncident = {
  id:"bootstrap-deferred", state:"unresolved",
  failure:{ task:bootstrapTask }, repair:{ status:"eligible" },
  terminalVerificationDeferred:{ status:"terminal-verification-deferred" },
};
const bootstrapCoverage = await runIntentBootstrapCoverage({
  incidents:[bootstrapIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
});
assert.equal(bootstrapCoverage[0].selectedTaskKey, bootstrapTask.key);
const confirmedFlakyBootstrapIncident = {
  ...structuredClone(bootstrapIncident),
  id:"bootstrap-confirmed-flaky-deferred",
  repair:undefined,
  failure:{ ...structuredClone(bootstrapIncident.failure),
    retryIdentity:"a".repeat(64), registryDigest:"b".repeat(64) },
  transitions:[
    { type:"diagnostic-retry-claimed" },
    { type:"diagnostic-retry-classified", classification:"confirmed-flaky" },
  ],
  retry:{ status:"classified", identity:"a".repeat(64), outcome:"passed",
    classification:"confirmed-flaky", receiptSha256:"c".repeat(64) },
};
const confirmedFlakyBootstrapCoverage = await runIntentBootstrapCoverage({
  incidents:[confirmedFlakyBootstrapIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
});
assert.equal(confirmedFlakyBootstrapCoverage[0].admission.kind, "terminal-deferred",
  "the bootstrap preserves a newer confirmed-flaky terminal deferral without inventing a repair");
const inheritedTerminalObligation = structuredClone(confirmedFlakyBootstrapIncident);
inheritedTerminalObligation.id = "bootstrap-inherited-terminal-obligation";
inheritedTerminalObligation.failure.task = verificationTaskIdentity({
  key:"unit:test/inherited-terminal-obligation-test.mjs", stage:"unit", executable:"node",
  args:["test/inherited-terminal-obligation-test.mjs"],
});
const inheritedTerminalCoverage = await runIntentBootstrapCoverage({
  incidents:[inheritedTerminalObligation], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
  resolveSuccession:async() => { throw new Error("ownership preparation must not project inherited terminal work"); },
});
assert.deepEqual(inheritedTerminalCoverage[0], {
  incidentId:inheritedTerminalObligation.id,
  admission:{ kind:"terminal-deferred" },
  failureTaskKey:inheritedTerminalObligation.failure.task.key,
  selectedTaskKey:null, selectedTaskDigest:null, terminalObligation:true,
}, "the ownership preparation leaves inherited deferred work at the terminal checkpoint");
const unselectedBootstrapTask = verificationTaskIdentity(bootstrapPlan.tasks.find(({ key }) =>
  key !== bootstrapTask.key && key.startsWith("unit:")));
const rawBootstrapIncident = {
  id:"bootstrap-unselected-review-failure", state:"unresolved",
  failureDigest:"d".repeat(64),
  failure:{ task:unselectedBootstrapTask, lineage:{
    evidenceTask:"verification-slice-verification-registry-planner-modularization" } },
};
const rawBootstrapCoverage = await runIntentBootstrapCoverage({
  incidents:[rawBootstrapIncident], plan:{ tasks:[bootstrapTask] }, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
  terminalObligationProof:async() => ({ sourceReceiptSha256:"e".repeat(64),
    sourcePlanDigest:"f".repeat(64), sourceCommit:"source-commit" }),
});
assert.deepEqual(rawBootstrapCoverage[0], {
  incidentId:rawBootstrapIncident.id, failureDigest:rawBootstrapIncident.failureDigest,
  admission:{ kind:"bootstrap-terminal-obligation",
    failureDigest:rawBootstrapIncident.failureDigest,
    sourceReceiptSha256:"e".repeat(64), sourcePlanDigest:"f".repeat(64),
    sourceCommit:"source-commit" },
  failureTaskKey:unselectedBootstrapTask.key,
  failureTaskDigest:verificationTaskDigest(unselectedBootstrapTask),
  selectedTaskKey:null, selectedTaskDigest:null, terminalObligation:true,
}, "the exact preparation retains a rejected broad-run failure as a terminal obligation");
assert.equal(reviewAdmissionTransactionOwnsDeferrals({
  runIntentBootstrap:{ version:1, coverage:[rawBootstrapCoverage[0]] },
}), true, "bootstrap obligations remain owned by their committed admission transaction at handoff");
const portableProofRepository = await mkdtemp(path.join(os.tmpdir(), "bootstrap-proof-source-"));
const portableProofSibling = `${portableProofRepository}-sibling`;
try {
  await exec("git", ["init", "-q", "--initial-branch=main"], { cwd:portableProofRepository });
  await exec("git", ["config", "user.name", "Bootstrap Proof Test"],
    { cwd:portableProofRepository });
  await exec("git", ["config", "user.email", "bootstrap-proof@example.test"],
    { cwd:portableProofRepository });
  await writeFile(path.join(portableProofRepository, "tracked.txt"), "shared repository\n");
  await writeFile(path.join(portableProofRepository, ".gitignore"), "tmp/\n");
  await exec("git", ["add", "tracked.txt", ".gitignore"], { cwd:portableProofRepository });
  await exec("git", ["commit", "-qm", "shared base"], { cwd:portableProofRepository });
  await exec("git", ["worktree", "add", "-q", "--detach", portableProofSibling, "HEAD"],
    { cwd:portableProofRepository });
  const sourceReceipt = "tmp/verification-receipts/source-review.json";
  const sourceBytes = Buffer.from(JSON.stringify({ version:2, proof:"source-plan-result" }));
  const sourceDigest = createHash("sha256").update(sourceBytes).digest("hex");
  await mkdir(path.dirname(path.join(portableProofRepository, sourceReceipt)), { recursive:true });
  await writeFile(path.join(portableProofRepository, sourceReceipt), sourceBytes);
  assert.equal(await exec("git", ["status", "--porcelain"],
    { cwd:portableProofRepository }), "",
  "the source receipt is recorded from a clean worktree");
  await persistBootstrapTerminalObligationSourceReceipt({
    root:portableProofRepository, sourceReceipt, sourceReceiptSha256:sourceDigest,
  });
  assert.deepEqual(await readBootstrapTerminalObligationSourceReceipt({
    root:portableProofSibling, sourceReceiptSha256:sourceDigest,
  }), sourceBytes, "a sibling worktree validates the repository-common immutable source proof");
  const durableProof = path.join(await defaultRepositoryRuntimeDirectory(portableProofSibling),
    "bootstrap-terminal-obligation-source-receipts", `${sourceDigest}.json`);
  await rm(durableProof);
  await assert.rejects(() => readBootstrapTerminalObligationSourceReceipt({
    root:portableProofSibling, sourceReceiptSha256:sourceDigest,
  }), /durable source receipt is missing/i,
  "forwarding rejects a missing repository-common bootstrap proof");
  await persistBootstrapTerminalObligationSourceReceipt({
    root:portableProofRepository, sourceReceipt, sourceReceiptSha256:sourceDigest,
  });
  await writeFile(durableProof, "tampered proof");
  await assert.rejects(() => readBootstrapTerminalObligationSourceReceipt({
    root:portableProofSibling, sourceReceiptSha256:sourceDigest,
  }), /durable source receipt digest changed/i,
  "forwarding rejects a tampered repository-common bootstrap proof");
} finally {
  await exec("git", ["worktree", "remove", "--force", portableProofSibling],
    { cwd:portableProofRepository }).catch(()=>undefined);
  await rm(portableProofSibling, { recursive:true, force:true });
  await rm(portableProofRepository, { recursive:true, force:true });
}
await assert.rejects(() => verifyCommittedReviewTransaction({
  runIntentBootstrap:{ version:1, coverage:[rawBootstrapCoverage[0]] },
}, "fixture", { store:{} }), /requires a committed transaction/i,
"bootstrap terminal obligations cannot bypass the atomic review transaction binding");
await assert.rejects(() => runIntentBootstrapCoverage({
  incidents:[{ ...structuredClone(rawBootstrapIncident), id:"unrelated-bootstrap-failure",
    failure:{ ...structuredClone(rawBootstrapIncident.failure),
      sourceReceipt:"tmp/verification-receipts/unrelated.json", lineage:{
        evidenceTask:"verification-slice-verification-registry-planner-modularization",
        baseCommit:"unrelated-base", commit:"unrelated-commit", tree:"unrelated-tree",
        changeSetDigest:"1".repeat(64),
      } } }],
  plan:{ tasks:[bootstrapTask] }, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  root:"fixture",
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
}), /ineligible incident/u,
"a same-task incident from an unrelated candidate lineage remains blocking");
await assert.rejects(() => runIntentBootstrapCoverage({
  incidents:[rawBootstrapIncident], plan:{ tasks:[bootstrapTask, unselectedBootstrapTask] }, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  evidenceTask:"verification-slice-verification-registry-planner-modularization",
}), /ineligible incident/u,
"a failure in the approved focused plan cannot be deferred as an unselected obligation");
await assert.rejects(() => runIntentBootstrapCoverage({
  incidents:[{ ...bootstrapIncident, id:"ineligible", repair:null }],
  plan:bootstrapPlan, packs, candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
}), /ineligible incident/i);
const exactBootstrapRepair = { ...bootstrapIncident, id:"exact-bootstrap-repair",
  terminalVerificationDeferred:undefined, failure:{ ...bootstrapIncident.failure,
    sourceReceipt:"tmp/verification-receipts/bootstrap-review.json" },
  repair:{ status:"eligible", candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
    regression:{ key:bootstrapTask.key, status:"passed", commit:"bootstrap-candidate" },
    focusedReceipt:{ status:"passed", commit:"bootstrap-candidate" },
    causalProtocol:{ repairResult:{ status:"passed" } } } };
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
const sourceDigest = verificationTaskDigest(source);
