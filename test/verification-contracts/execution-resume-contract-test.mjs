import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { withDistArtifactLock } from "../../scripts/dist-artifact-lock.mjs";
import { checkpointPreflight, createVerificationReceiptContext, focusedAcceptanceOptions, resumeVerificationPlan, validateCurrentArtifactForConsumers, verificationResumeIdentity } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification, verificationOwner, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { executeAcceptancePlan } from "../../scripts/verification-execution/execute.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
import { runIntentBootstrapCoverage, validateRunIntentBootstrapBase } from "../../scripts/verification-run-intent.mjs";
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});
const syntheticArtifact = (inputDigest, outputDigest, toolchain) => {
  const schemaVersion = 1;
  const buildIdentity = createHash("sha256").update(`${JSON.stringify({
    schemaVersion, inputDigest, outputDigest, toolchain,
  })}\n`).digest("hex");
  return { schemaVersion, buildIdentity, inputDigest, outputDigest, toolchain };
};
let nestedReadOnlyLeaseCompleted = false;
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
const focusedObservationPacks = [pack("browser", {
  browserObservations:[
    { id:"BROWSER_FIRST", path:"test/browser.mjs", environment:{ BROWSER_FIRST:"1" },
      observationKeys:["first"], features:["features/browser-one.feature"], sessionBatch:"browser-main" },
    { id:"BROWSER_SECOND", path:"test/browser.mjs", environment:{ BROWSER_SECOND:"1" },
      observationKeys:["second"], features:["features/browser-two.feature"], sessionBatch:"browser-main" },
  ],
})];
const exactObservationPlan = planVerification(focusedObservationPacks, { packIds:["browser"] });
const packs = await loadVerificationPacks();
const vtd005EditorTargetIds = ["LAYERED_SCHEMA_EDITOR_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET",
  "LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET"];
const shellPlan = planVerification(packs, { packIds:["shell"] });
const bootstrapBase = await validateRunIntentBootstrapBase({
  root:"verification-root", baseCommit:"approved-contract-base",
  changedPaths:["scripts/verification-run-intent.mjs"],
  readCommitFile:async(_root, _commit, file) => file.endsWith("modular-verification-packs.feature")
    ? "Modular verification packs 159\nModular verification packs 160\n" : null,
});
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
const terminalPlan = planVerification(packs, { terminalFull:true });
const preflightPlan = planVerification(synthetic, { packIds:["alpha"] });
const preflightOrder = [];
const verificationLoadReceiptDirectory = await mkdtemp(
  path.join(os.tmpdir(), "verification-load-receipts-"),
);
assert.equal(createVerificationReceiptContext(1, 1, {
  receiptDirectory:verificationLoadReceiptDirectory,
  executionLoad:"loaded",
}).receipt.environment.executionLoad, "loaded");
assert.throws(() => createVerificationReceiptContext(1, 1, { executionLoad:"unknown" }),
  /normal or loaded/u);
await rm(verificationLoadReceiptDirectory, { recursive:true, force:true });
await checkpointPreflight({
  packs:synthetic,
  plan:preflightPlan,
  probeEnvironment:false,
  availableCapabilities:["local-loopback"],
  receiptContext:createVerificationReceiptContext(1, 1, {
    receiptDirectory:await mkdtemp(path.join(os.tmpdir(), "verification-preflight-receipts-")),
  }),
  validators:{
    registry:async() => preflightOrder.push("registry"),
    plan:async() => preflightOrder.push("plan"),
    receipt:async() => preflightOrder.push("receipt"),
    artifact:async() => preflightOrder.push("artifact"),
    evidence:async() => preflightOrder.push("evidence"),
  },
});
assert.deepEqual(preflightOrder, ["registry", "plan", "receipt", "artifact", "evidence"],
  "checkpoint preflight finishes every contract validation before execution");
let preflightLeafStarted = false;
await assert.rejects(() => checkpointPreflight({
  packs:synthetic, plan:preflightPlan,
  receiptContext:{ receiptPath:"/tmp/receipt.json", receipt:{ version:2, tasks:{} } },
  validators:{
    registry:async() => {}, plan:async() => {},
    receipt:async() => { throw new Error("receipt recording limit incompatible"); },
    artifact:async() => { preflightLeafStarted = true; }, evidence:async() => {},
  },
}), /receipt recording limit incompatible/u);
assert.equal(preflightLeafStarted, false,
  "a preflight failure stops before later validation or verification leaves start");
const artifactGateStages = [];
await assert.rejects(() => executeAcceptancePlan(preflightPlan, {
  runCommand:async(_display, task) => artifactGateStages.push(task.stage),
  afterPreparation:async() => { throw new Error("dist output digest mismatch"); },
}), /dist output digest mismatch/u);
assert.deepEqual(artifactGateStages, ["build"],
  "the actual built artifact is validated after preparation and before the first verification leaf");
await assert.rejects(() => validateCurrentArtifactForConsumers({
  artifactValidator:async() => { throw new Error("dist manifest is missing"); },
}), /dist manifest is missing/u,
"a missing dist rejects resume before a reused consumer can run");
await assert.rejects(() => validateCurrentArtifactForConsumers({
  artifactValidator:async() => ({
    inputDigest:"a".repeat(64), outputDigest:"tampered", buildIdentity:"b".repeat(64),
  }),
}), /invalid outputDigest/u,
"a tampered dist identity rejects resume before a reused consumer can run");
const resumableTasks = preflightPlan.tasks.slice(0, 3);
const resumablePlan = { ...preflightPlan, tasks:resumableTasks };
const resumeIdentity = {
  commit:"a".repeat(40), artifactInputDigest:"b".repeat(64),
  planDigest:"c".repeat(64), toolchainDigest:"d".repeat(64),
};
const priorReceipt = {
  version:2, resumeIdentity, tasks:{
    [resumableTasks[0].key]:{
      identity:verificationTaskIdentity(resumableTasks[0]), status:"passed", durationMs:5, output:"ok",
    },
    [resumableTasks[1].key]:{
      identity:verificationTaskIdentity(resumableTasks[1]), status:"failed", durationMs:5, output:"bad",
    },
  },
};
assert.throws(() => resumeVerificationPlan(resumablePlan, priorReceipt, resumeIdentity),
  new RegExp(resumableTasks[1].key, "u"),
  "a failed task cannot enter ordinary resume before incident classification");
const diagnosticPriorReceipt = { ...priorReceipt,
  tasks:{ [resumableTasks[0].key]:priorReceipt.tasks[resumableTasks[0].key] } };
const resumed = resumeVerificationPlan(resumablePlan, diagnosticPriorReceipt, resumeIdentity);
assert.deepEqual(resumed.tasks.map(({ key }) => key), resumableTasks.slice(1).map(({ key }) => key),
  "bounded resume runs only failed and incomplete tasks");
assert.equal(resumed.reusedTasks[resumableTasks[0].key].provenance, "reused");
assert.equal(resumed.preparationTasks.some(({ key }) => key === resumableTasks[0].key), false,
  "reused tasks are removed from their executable stage as well as the flat plan");
assert.throws(() => resumeVerificationPlan(resumablePlan, {
  ...priorReceipt,
  tasks:{ ...priorReceipt.tasks, [resumableTasks[1].key]:{
    ...priorReceipt.tasks[resumableTasks[1].key], timeoutIncidentId:"incident-active",
  } },
}, resumeIdentity), /incident-active/u,
"a timeout cannot be retried away through ordinary successful-task receipt resume");
const rejectedResume = resumeVerificationPlan(resumablePlan, diagnosticPriorReceipt,
  { ...resumeIdentity, commit:"e".repeat(40) });
assert.deepEqual(rejectedResume.tasks.map(({ key }) => key), resumableTasks.map(({ key }) => key),
  "a mismatched resume identity reruns every checkpoint task");
for (const [field, value] of [
  ["artifactInputDigest", "e".repeat(64)],
  ["planDigest", "f".repeat(64)],
  ["toolchainDigest", "0".repeat(64)],
]) {
  const mismatch = resumeVerificationPlan(resumablePlan, diagnosticPriorReceipt,
    { ...resumeIdentity, [field]:value });
  assert.deepEqual(mismatch.tasks.map(({ key }) => key), resumableTasks.map(({ key }) => key),
    `a ${field} mismatch rejects every prior task before a consumer can run`);
}
const observationTask = exactObservationPlan.observationTasks[0];
const partialObservationPlan = {
  ...exactObservationPlan,
  tasks:[observationTask], observationTasks:[observationTask], preparationTasks:[],
};
const partialObservationReceipt = {
  version:2, resumeIdentity, tasks:{
    [observationTask.key]:{
      identity:verificationTaskIdentity(observationTask), status:"failed", durationMs:9,
      output:"first partial output\n", stderr:"",
      logicalResults:{
        BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
        BROWSER_SECOND:{ id:"BROWSER_SECOND", status:"failed", durationMs:4 },
      },
    },
  },
};
assert.throws(() => resumeVerificationPlan(
  partialObservationPlan, partialObservationReceipt, resumeIdentity,
), /Reliability incident retry.*browser-observation/u,
"a failed browser batch must use its incident-owned isolated retry rather than ordinary resume");
const [durableObservationTarget] = observationTask.logicalTargetIds;
const interruptedObservationReceipt = { version:2, resumeIdentity, tasks:{
  [observationTask.key]:{
    identity:verificationTaskIdentity(observationTask), status:"interrupted", durationMs:3,
    output:"", stderr:"", logicalResults:{
      [durableObservationTarget]:{ id:durableObservationTarget, status:"passed", durationMs:3 },
    },
  },
} };
const interruptedObservationResume = resumeVerificationPlan(
  partialObservationPlan, interruptedObservationReceipt, resumeIdentity);
assert.deepEqual(interruptedObservationResume.tasks[0].executionLogicalTargetIds,
  observationTask.logicalTargetIds.slice(1),
"durable logical-target continuation launches only unfinished targets");
assert.equal(verificationResumeIdentity(resumablePlan, {
  receipt:{ environment:{ node:"24", typescript:"5", platform:"linux", concurrency:1,
    observationConcurrency:1 } },
}, { inputDigest:"b".repeat(64) }).artifactInputDigest, "b".repeat(64));
const packageFeaturePlan = planVerification(packs, {
  packIds:["shell"], changedPaths:["features/portable-build-package-flow.feature"],
});
assert.deepEqual(packageFeaturePlan.checkpointCommands.filter((command) => command === "npm run package"), ["npm run package"]);
const schemaWorkspacePath = "features/data-layer-schema-workspace-runtime-completion.feature";
const schemaWorkspaceImpact = planVerification(packs, { changedPaths:[schemaWorkspacePath] });
const schemaWorkspacePlan = planVerification(packs, {
  packIds:schemaWorkspaceImpact.packIds, changedPaths:[schemaWorkspacePath],
});
const schemaWorkspaceTask = schemaWorkspacePlan.observationTasks
  .find(({ packId }) => packId === "schemas");
assert.deepEqual(schemaWorkspaceTask.logicalTargetIds,
  packs.find(({ id }) => id === "schemas").browserObservations.map(({ id }) => id).sort(),
  "schema verification batches all compatible logical observations in one process");
assert.equal(schemaWorkspaceTask.environment.SCHEMA_WORKSPACE_BROWSER_ADAPTER, "1");
const schemaSourcePath = "src/data-layer-schema-verification.ts";
const schemaSourceImpact = planVerification(packs, { changedPaths:[schemaSourcePath] });
const sourceAndDist = planVerification(packs, {
  packIds:schemaSourceImpact.packIds,
  changedPaths:[schemaSourcePath, "dist/data-layer-schema-verification.js"],
});
assert.deepEqual(sourceAndDist.packIds, schemaSourceImpact.packIds,
  "generated dist paths do not widen an explicit complete source-impact boundary");
assert.equal(verificationOwner(packs, "dist/data-layer-schema-verification.js"), "generated-artifact");
// Nested child processes inherit the held-lock marker instead of waiting on
// their own parent. This is the build-task lock reuse contract.
await withDistArtifactLock(async() => {
  const lockModule = pathToFileURL(path.resolve("scripts/dist-artifact-lock.mjs")).href;
  await exec(process.execPath, ["--input-type=module", "-e",
    `import {writeSync} from "node:fs"; import {withDistArtifactLock} from ${JSON.stringify(lockModule)}; await withDistArtifactLock(()=>writeSync(1,"nested-lock-ok\\n"),{access:"read"});`],
  { timeout:2_000 });
}, { access:"read" });
nestedReadOnlyLeaseCompleted = true;
const lockedRuntime = { node:process.versions.node, typescript:"5.9.3" };
const artifact = syntheticArtifact("b".repeat(64), "c".repeat(64), lockedRuntime);
