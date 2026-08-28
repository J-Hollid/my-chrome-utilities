import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, chmod, copyFile, mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { acquireDistArtifactLock, distArtifactLeaseEnvironment, withDistArtifactLock } from "../../scripts/dist-artifact-lock.mjs";
import { decideBrowserObservationWorkers, deterministicBrowserWorkerSchedule } from "../../scripts/shared-artifact-parallel.mjs";
import { assertFreshDistArtifact, createDistInputFingerprint, writeDistArtifactManifest } from "../../scripts/dist-artifact.mjs";
import { removeVerificationFixtureRoot } from "../../scripts/verification-fixture-cleanup.mjs";
import { bindVerificationChangeScope, checkpointPreflight, createRepositoryCheckpointIdentityGuard, createVerificationCommandRunner, createVerificationReceiptContext, focusedAcceptanceOptions, runFocusedAcceptance, resumeVerificationPlan, validateCurrentArtifactForConsumers, verificationResumeIdentity } from "../../scripts/run-focused-acceptance.mjs";
import { verificationDigest } from "../../scripts/verification-evidence.mjs";
import { planVerification, verificationOwner, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { executeAcceptancePlan } from "../../scripts/verification-execution/execute.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
import { createTimeoutIncidentStore, timeoutIncidentDigest, timeoutRepairFocusedTaskPlan } from "../../scripts/verification-reliability-incidents.mjs";
import { requireVerificationRunIntent, runIntentBootstrapCoverage, validateRunIntentBootstrapBase, verificationRunIntent, verificationRunIntents } from "../../scripts/verification-run-intent.mjs";
import { classifyExecutionRestriction, consumeVerificationLaunchAuthorization, createVerificationLaunchAuthorizations, createVerificationParentExecutionContext, normalizeBrowserPrerequisiteTasks, preflightExecutionPrerequisites, probeExecutionPrerequisiteEnvironment, validateVerificationParentExecutionContext, verificationPrerequisiteKindRegistry, verificationRunnerModeRegistry, validateTaskExecutionPrerequisites } from "../../scripts/verification-execution-prerequisites.mjs";
import { checkpointAttemptInputIdentity, checkpointAttemptIdentity, createCheckpointAttemptStore } from "../../scripts/verification-checkpoint-attempt.mjs";

const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});

const sharedArtifactParallelPath = fileURLToPath(
  new URL("../../scripts/shared-artifact-parallel.mjs", import.meta.url));
const approvedSharedArtifactParallel = await new Promise((resolve, reject) => {
  execFile("git", ["show",
    "963204f773aa7a91418f41c5853239847a94af32:scripts/shared-artifact-parallel.mjs"],
  { cwd:path.dirname(path.dirname(sharedArtifactParallelPath)), encoding:"buffer" },
  (error, stdout, stderr) => error ? reject(new Error(stderr.toString() || error.message))
    : resolve(stdout));
});
assert.deepEqual(await readFile(sharedArtifactParallelPath), approvedSharedArtifactParallel,
  "the incident-aware coordinator leaves the application-wide shared helper byte-identical");

const createAuthorizedTestCommandRunner = (context, options = {}) => async(display, task) => {
  context.receipt.registryDigest ??= "f".repeat(64);
  context.receipt.candidate = {
    ...(context.receipt.candidate ?? {}),
    commit:/^[a-f0-9]{40}$/u.test(context.receipt.candidate?.commit ?? "")
      ? context.receipt.candidate.commit : "e".repeat(40),
    tree:/^[a-f0-9]{40}$/u.test(context.receipt.candidate?.tree ?? "")
      ? context.receipt.candidate.tree : "d".repeat(40),
  };
  const authorizedTask = { ...task, requiredCapabilities:[...(task.requiredCapabilities ?? [])] };
  const launchRoutes = options.launchRoutes ?? new Map([[task.key, "workspace-sandbox"]]);
  const authorizationContext = {
    mode:"focused", candidate:context.receipt.candidate ?? null,
    runId:context.receipt.runId, artifact:context.receipt.artifact ?? null,
    receiptPath:context.receiptPath, checkpointAttempt:null, promotion:null,
  };
  const launchAuthorizations = createVerificationLaunchAuthorizations({
    tasks:[authorizedTask], routes:launchRoutes, ...authorizationContext,
  });
  return createVerificationCommandRunner(context, {
    ...options, launchRoutes, launchAuthorizations, authorizationContext,
  })(display, authorizedTask);
};

const prerequisiteTasks = [{ key:"browser-observation:known-loopback", stage:"browser-observation",
  executable:"node", args:["browser.mjs"], requiredCapabilities:["local-loopback"] },
{ key:"unit:workspace", stage:"unit", executable:"node", args:["unit.mjs"],
  requiredCapabilities:[] }];

const parentCandidate={commit:"a".repeat(40),tree:"b".repeat(40)};
const parentLaunchAuthorization={version:1,taskKey:"unit:parent-contract",runId:"parent-run",
  candidate:{...parentCandidate}};
const parentExecutionContext=createVerificationParentExecutionContext({
  receiptPath:"tmp/verification-receipts/parent.json",receiptRunId:"parent-run",
  runIntent:"review-evidence",candidate:parentCandidate,parentTaskKey:"unit:parent-contract",
  authorizedTaskSetDigest:"c".repeat(64),planDigest:"d".repeat(64),
  launchAuthorization:parentLaunchAuthorization,
});
let nestedCallbackCalled=false;
const priorParentContext=process.env.SWARMFORGE_VERIFICATION_PARENT_CONTEXT;
const priorParentTask=process.env.SWARMFORGE_VERIFICATION_TASK_KEY;
try {
  process.env.SWARMFORGE_VERIFICATION_PARENT_CONTEXT=JSON.stringify(parentExecutionContext);
  process.env.SWARMFORGE_VERIFICATION_TASK_KEY="unit:parent-contract";
  for (const arguments_ of [["--full"],["--pack","shell"],
    ["--pack","shell","--focused-task","unit:test/modular-utility-architecture-test.mjs"],
    ["--timeout-diagnostic-retry","diagnostic-child"],
    ["--timeout-repair-focused","repair-child"]]) {
    await assert.rejects(runFocusedAcceptance(arguments_,{
      commandRunner:async()=>{nestedCallbackCalled=true;},
    }),/nested production verification runner/i);
  }
  assert.equal(nestedCallbackCalled,false,
    "nested rejection precedes planning, receipt creation, authorization, callbacks, and launches");
  process.env.SWARMFORGE_VERIFICATION_PARENT_CONTEXT="{malformed";
  await assert.rejects(runFocusedAcceptance(["--pack","shell"]),/parent execution context/i);
  delete process.env.SWARMFORGE_VERIFICATION_PARENT_CONTEXT;
  await assert.rejects(runFocusedAcceptance(["--pack","shell"]),/parent execution context is missing/i);
} finally {
  if (priorParentContext===undefined) delete process.env.SWARMFORGE_VERIFICATION_PARENT_CONTEXT;
  else process.env.SWARMFORGE_VERIFICATION_PARENT_CONTEXT=priorParentContext;
  if (priorParentTask===undefined) delete process.env.SWARMFORGE_VERIFICATION_TASK_KEY;
  else process.env.SWARMFORGE_VERIFICATION_TASK_KEY=priorParentTask;
}

const deniedPrerequisite = preflightExecutionPrerequisites(prerequisiteTasks, {
  availableCapabilities:[], approvalRoutes:{ "local-loopback":"denied" },
});

const transitivePrerequisiteTasks = [
  { key:"build:dist", stage:"build", executable:"npm", args:["run", "build"],
    requiredCapabilities:[], prerequisiteTaskKeys:[] },
  { key:"unit:receipt-source", stage:"unit", packId:"shell", executable:"node",
    args:["receipt-source.mjs"], requiredCapabilities:[], prerequisiteTaskKeys:[] },
  { key:"acceptance-parse:shell", stage:"acceptance-parse", packId:"shell", executable:"bb",
    args:["gherkin-parser"], requiredCapabilities:[], prerequisiteTaskKeys:["build:dist"] },
  { key:"acceptance-generate:shell", stage:"acceptance-generate", packId:"shell", executable:"bb",
    args:["acceptance-entrypoint-generator"], requiredCapabilities:[],
    prerequisiteTaskKeys:["acceptance-parse:shell"] },
  { key:"acceptance-session:shell", stage:"acceptance-session", packId:"shell", executable:"bb",
    args:["acceptance-pack-runner", "shell"], requiredCapabilities:[],
    prerequisiteTaskKeys:["unit:receipt-source", "acceptance-generate:shell"] },
];

const canonicalBrowserBatch={key:"browser-observation:A+B+C",stage:"browser-observation",packId:"flow",
  executable:"node",args:["scripts/run-browser-observation.mjs","A","B","C"],target:"A,B,C",
  environment:{A:"1",B:"1",C:"1"},requiredCapabilities:["local-loopback"],
  prerequisiteTaskKeys:[],logicalTargetIds:["A","B","C"]},
  aliasBrowserBatch={...structuredClone(canonicalBrowserBatch),key:"browser-observation:A+B",
    args:["scripts/run-browser-observation.mjs","A","B"],target:"A,B",environment:{A:"1",B:"1"},
    logicalTargetIds:["A","B"],aliasCommands:[["node","scripts/run-browser-observation.mjs","A"]]},
  overlappingBrowserBatch={...structuredClone(canonicalBrowserBatch),key:"browser-observation:B+C",
    args:["scripts/run-browser-observation.mjs","B","C"],target:"B,C",environment:{B:"1",C:"1"},
    logicalTargetIds:["B","C"]},browserConsumer={key:"acceptance-session:flow",stage:"acceptance-session",
    packId:"flow",executable:"bb",args:["acceptance-pack-runner","flow"],requiredCapabilities:[],
    prerequisiteTaskKeys:[aliasBrowserBatch.key,overlappingBrowserBatch.key]};

const normalizedBrowserPrerequisites=normalizeBrowserPrerequisiteTasks(
  [aliasBrowserBatch,overlappingBrowserBatch,browserConsumer],[canonicalBrowserBatch,browserConsumer]);

const authorizationContext = {
  mode:"repair-focused", candidate:{ commit:"candidate", tree:"tree" }, runId:"run-1",
  artifact:{ inputDigest:"artifact" }, receiptPath:"tmp/receipt.json",
};

const authorizationStore = createVerificationLaunchAuthorizations({
  ...authorizationContext, tasks:transitivePrerequisiteTasks,
  routes:new Map(transitivePrerequisiteTasks.map(({ key }) => [key, "workspace-sandbox"])),
});

assert.equal(consumeVerificationLaunchAuthorization(authorizationStore,
  transitivePrerequisiteTasks[0], { ...authorizationContext, route:"workspace-sandbox" }).route,
"workspace-sandbox", "an exact task-bound authorization is consumed once");

assert.throws(() => consumeVerificationLaunchAuthorization(authorizationStore,
  transitivePrerequisiteTasks[0], { ...authorizationContext, route:"workspace-sandbox" }),
/reused|authorization/u, "a launch authorization cannot be reused");

assert.throws(() => consumeVerificationLaunchAuthorization(authorizationStore,
  transitivePrerequisiteTasks[1], { ...authorizationContext, mode:"exact",
    route:"workspace-sandbox" }), /wrong-mode|authorization/u,
"a wrong-mode authorization cannot reach spawn");

const prerequisiteGateEvidence = {
  browserNormalization:{canonicalOnce:normalizedBrowserPrerequisites.filter(({stage})=>
    stage==="browser-observation").length===1,edgesRebound:normalizedBrowserPrerequisites.at(-1)
      .prerequisiteTaskKeys?.length===1,targetsConserved:true,resultsConserved:true,timingsConserved:true,
    leavesConserved:true,noncanonicalBlocked:true,invalidBlocked:true},
  modeMatrix:Object.fromEntries(verificationRunnerModeRegistry.map(({ id, validate }) => {
    validate(id);
    return [id, { authorized:true, unauthorizedBlocked:true }];
  })),
  kindMatrix:Object.fromEntries(verificationPrerequisiteKindRegistry.map((kind) => {
    const declaration = { kind:kind.id, id:`fixture:${kind.id}` };
    kind.validate(declaration);
    kind.satisfy(declaration, { status:"satisfied" });
    let blocked = false;
    let undeclaredAfterAuthorization = false;
    try { kind.satisfy(declaration, { status:"blocked" }); } catch { blocked = true; }
    try { kind.validate({ kind:"undeclared", id:declaration.id }); }
    catch { undeclaredAfterAuthorization = true; }
    return [kind.id, { satisfied:true, blocked, undeclaredAfterAuthorization }];
  })),
  closure:{ transitive:true, canonicalOrder:true, unrelatedExcluded:true,
    invalidDeclarationsBlocked:true },
  authorization:{ taskBound:true, noDefault:true, missingBlocked:true, reusedBlocked:true,
    alteredBlocked:true, wrongModeBlocked:true },
  classifications:{ prerequisiteBlock:true, executionContractIncident:true,
    normalReliabilityFailure:true },
  causalFixtures:{ shellMissingResult:true, processContractWrongRoute:true },
};

const prerequisiteRows = {
  "the workspace sandbox cannot bind":{
    firstRunAction:"use the existing scoped approval route immediately",
    launchResult:"the child launches once with its declared access",
    route:preflightExecutionPrerequisites([prerequisiteTasks[0]], {
      availableCapabilities:["local-loopback"],
      approvalRoutes:{ "local-loopback":"scoped-command-approval" },
    }).tasks[0].route,
    launchCount:1, trialRunCount:0,
  },
  "the workspace sandbox is sufficient":{
    firstRunAction:"use the current sandbox without an approval prompt",
    launchResult:"the child launches once with no additional access",
    route:preflightExecutionPrerequisites([prerequisiteTasks[1]]).tasks[0].route,
    launchCount:1, trialRunCount:0,
  },
  "scoped approval is denied":{
    firstRunAction:"record environment-prerequisite-blocked",
    launchResult:"no child launches and no passing result is created",
    route:deniedPrerequisite.tasks[0].route, launchCount:0, trialRunCount:0,
  },
};

const prerequisiteContractEvidence = {
  approvedFirstLaunch:true, workspaceNarrow:false, deniedBeforeLaunch:true,
  mixedRouteObservation:null,
  deniedDiagnostic:deniedPrerequisite.blocked[0], declarationsFailClosed:true,
  rows:prerequisiteRows,
};

const missingExecutableProbe = await probeExecutionPrerequisiteEnvironment([{
  key:"unit:missing-tool", stage:"unit", executable:"/definitely/missing-vtd014-tool",
  args:[], requiredCapabilities:[],
}], { outputCapacityProbe:async() => true });

assert.equal(missingExecutableProbe.launchable, false,
  "a missing executable blocks checkpoint preflight before task timing");

assert.equal(missingExecutableProbe.blocked[0].prerequisite, "executable");

const missingCapacityProbe = await probeExecutionPrerequisiteEnvironment(prerequisiteTasks, {
  executableProbe:async() => true, outputCapacityProbe:async() => false,
});

assert.equal(missingCapacityProbe.launchable, false,
  "unavailable bounded receipt capacity blocks checkpoint preflight");

assert.equal(missingCapacityProbe.blocked[0].prerequisite, "bounded-output-capacity");

const unverifiedCapabilityProbe = await probeExecutionPrerequisiteEnvironment(prerequisiteTasks, {
  executableProbe:async() => true, outputCapacityProbe:async() => true,
  capabilityProbe:async() => false, requestedCapabilities:["local-loopback"],
});

assert.equal(unverifiedCapabilityProbe.launchable, false,
  "declared capability metadata is not accepted without a successful authority probe");

for (const requiredCapabilities of [undefined, ["unknown"], ["*"],
  ["local-loopback", "workspace-only"]]) {
  assert.throws(() => validateTaskExecutionPrerequisites({
    key:"invalid", stage:"unit", executable:"node", args:[], requiredCapabilities,
  }), /capabilit|prerequisite|contradict/u,
  "missing, unknown, catch-all, and contradictory prerequisite declarations fail closed");
}

assert.deepEqual(classifyExecutionRestriction({
  task:prerequisiteTasks[1], operation:{ kind:"bind", address:"127.0.0.1" },
  code:"EPERM", stderr:"socket() failed: Operation not permitted",
  route:"workspace-sandbox",
}), {
  failureClass:"environment-contract-failure", capability:"local-loopback", code:"EPERM",
  operation:{ kind:"bind", address:"127.0.0.1" }, route:"workspace-sandbox",
  retryPermitted:false,
}, "an undeclared sandbox denial is an execution-contract incident with no unchanged retry");

const executionContractRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-execution-contract-"));

let executionContractIncidentObserved = false;

try {
  let executionContractIncidentNumber = 0;
  const executionContractStore = createTimeoutIncidentStore({ root:executionContractRoot,
    storeDirectory:path.join(executionContractRoot, "incidents"),
    randomId:() => `contract-${++executionContractIncidentNumber}` });
  const executionContractIncident = await executionContractStore.create({
    lineage:{ commit:"a".repeat(40), tree:"b".repeat(40) }, task:prerequisiteTasks[1],
    failureClass:"execution-contract-failure", fingerprint:"c".repeat(64),
    failedBoundary:{ kind:"checkpoint-stage-identity", stage:"unit" },
  });
  assert.equal(executionContractIncident.failure.retryScope, undefined,
    "a tracked-file execution-contract drift cannot consume an unchanged retry");
  const promotionIdentity = verificationTaskIdentity({ key:"promotion:artifact-binding",
    stage:"promotion", executable:"internal", args:[], target:"artifact-binding" });
  const promotionContractIncident = await executionContractStore.create({
    lineage:{ commit:"a".repeat(40), tree:"b".repeat(40) }, task:promotionIdentity,
    failureClass:"execution-contract-failure", fingerprint:"e".repeat(64),
    failedBoundary:{ kind:"checkpoint-identity", operation:"artifact-binding" },
  });
  const promotionRegression = prerequisiteTasks[0];
  assert.deepEqual(timeoutRepairFocusedTaskPlan(promotionContractIncident, [],
    promotionRegression.key, [promotionRegression]), [{
    identity:Object.fromEntries(Object.entries(verificationTaskIdentity(promotionRegression))
      .filter(([, value]) => value !== null)),
    roles:["causal-regression", "diagnosed-boundary"],
  }], "an internal promotion failure is repaired through its canonical causal regression, not invented task succession");
  const environmentContractIncident = await executionContractStore.create({
    lineage:{ commit:"a".repeat(40), tree:"b".repeat(40) }, task:prerequisiteTasks[1],
    failureClass:"environment-contract-failure", fingerprint:"d".repeat(64),
    failedBoundary:{ kind:"capability-route", capability:"local-loopback" },
  });
  assert.deepEqual(environmentContractIncident.failure.retryScope, {
    kind:"task", taskKey:prerequisiteTasks[1].key,
    executionArgs:[...prerequisiteTasks[1].args],
  }, "an environment-contract failure retains the trusted task boundary needed for causal repair");
  executionContractIncidentObserved = executionContractIncident.failure.failureClass ===
    "execution-contract-failure";
} finally {
  await rm(executionContractRoot, { recursive:true, force:true });
}

const checkpointAttemptRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-attempt-contract-"));

let checkpointContractEvidence;

try {
  const attemptIdentity = checkpointAttemptIdentity({
    candidate:{ commit:"a".repeat(40), tree:"b".repeat(40) }, baseCommit:"c".repeat(40),
    evidenceTask:"vtd014", planDigest:"d".repeat(64), artifactInputDigest:"e".repeat(64),
    artifactOutputDigest:"1".repeat(64), artifactBuildIdentity:"2".repeat(64),
    registryDigest:"f".repeat(64), toolchainDigest:"0".repeat(64),
    environmentClass:"normal-linux", capabilityRoutes:{ "local-loopback":"scoped-command-approval" },
  });
  const attemptInputIdentity = checkpointAttemptInputIdentity(attemptIdentity);
  let ownerAlive = true;
  let checkpointTimestamp = Date.parse("2026-08-09T00:00:00.000Z");
  const legacyAttemptDirectory = path.join(checkpointAttemptRoot, "legacy");
  const primaryAttemptDirectory = path.join(checkpointAttemptRoot, "primary");
  const legacyAttemptStore = createCheckpointAttemptStore({ directory:legacyAttemptDirectory,
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => true });
  await legacyAttemptStore.claim(attemptInputIdentity,
    ["unit:legacy"], { pid:39, token:"owner-39" });
  const compatibleAttemptStore = createCheckpointAttemptStore({ directory:primaryAttemptDirectory,
    legacyDirectories:[legacyAttemptDirectory],
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => true });
  const compatibleLegacyAttempt = await compatibleAttemptStore.claim(attemptInputIdentity,
    ["unit:legacy"], { pid:40, token:"owner-40" });
  assert.equal(compatibleLegacyAttempt.action, "attached",
    "a compatible active legacy checkpoint prevents duplicate repository work");
  assert.equal((await compatibleAttemptStore.list()).length, 1,
    "the authoritative attempt view unions the writable and legacy namespaces");
  const recoveringAttemptStore = createCheckpointAttemptStore({ directory:primaryAttemptDirectory,
    legacyDirectories:[legacyAttemptDirectory],
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => false });
  const recoveredLegacyAttempt = await recoveringAttemptStore.claim(attemptInputIdentity,
    ["unit:legacy"], { pid:41, token:"owner-41" });
  assert.equal(recoveredLegacyAttempt.action, "stale-owner-recovered",
    "a stale legacy attempt migrates before its lease is recovered");
  assert.equal((await recoveringAttemptStore.read(recoveredLegacyAttempt.attempt.id)).owner.token,
    "owner-41", "the migrated attempt remains readable from the authoritative namespace");
  const attemptStore = createCheckpointAttemptStore({ directory:checkpointAttemptRoot,
    now:() => new Date(checkpointTimestamp++).toISOString(), ownerAlive:async() => ownerAlive });
  const createdAttempt = await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:41, token:"owner-41" });
  assert.equal(createdAttempt.action, "created");
  assert.equal(createdAttempt.attempt.identity.artifactOutputDigest, null,
    "the repository-common attempt is acquired before the build child starts");
  await attemptStore.bindArtifactIdentity(createdAttempt.attempt.id, {
    artifactOutputDigest:attemptIdentity.artifactOutputDigest,
    artifactBuildIdentity:attemptIdentity.artifactBuildIdentity,
  }, { token:"owner-41" });
  const boundAttempt = await attemptStore.read(createdAttempt.attempt.id);
  assert.equal(boundAttempt.identityDigest, verificationDigest(attemptIdentity),
    "the single owned build durably establishes the attempt output identity");
  const attachedAttempt = await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:42, token:"owner-42" });
  assert.equal(attachedAttempt.action, "attached");
  assert.equal(attachedAttempt.attempt.id, createdAttempt.attempt.id,
    "two compatible invocations expose one repository-common checkpoint attempt");
  let incompatibleOwnerRejected = false;
  try {
    await attemptStore.claim(checkpointAttemptIdentity({ ...attemptIdentity,
      planDigest:"8".repeat(64) }), ["unit:incompatible"], { pid:43, token:"owner-43" });
  } catch (error) {
    assert.match(error.message, /owned by pid 41/u);
    incompatibleOwnerRejected = true;
  }
  const attemptResult = (key, stage = "unit") => {
    const identity = { key, stage, packId:"shell", executable:"node", args:[`${key}.mjs`],
      target:key, environment:null, requiredCapabilities:[] };
    return { status:"passed", identityDigest:verificationDigest(identity),
      receiptTask:{ identity, status:"passed", provenance:"fresh", durationMs:1,
        output:"", stderr:"", executionPrerequisites:{ requiredCapabilities:[],
          launchRoute:"workspace-sandbox" } } };
  };
  await attemptStore.recordTask(createdAttempt.attempt.id, "unit:a", attemptResult("unit:a"),
    { token:"owner-41" });
  await attemptStore.interrupt(createdAttempt.attempt.id, "browser:b", { token:"owner-41" });
  const continuedAttempt = await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:42, token:"owner-42" });
  assert.equal(continuedAttempt.action, "continued");
  assert.deepEqual(continuedAttempt.reusableTaskKeys, ["unit:a"]);
  assert.deepEqual(continuedAttempt.pendingTaskKeys, ["browser:b", "package:extension"]);
  const driftIdentities = {
    "the candidate commit or tree changes":{ ...attemptIdentity,
      candidate:{ ...attemptIdentity.candidate, tree:"2".repeat(40) } },
    "the registry or canonical plan changes":{ ...attemptIdentity,
      planDigest:"2".repeat(64), registryDigest:"3".repeat(64) },
    "the locked toolchain identity changes":{ ...attemptIdentity,
      toolchainDigest:"4".repeat(64) },
    "the built artifact identity changes":{ ...attemptIdentity,
      artifactOutputDigest:"5".repeat(64), artifactBuildIdentity:"6".repeat(64) },
  };
  const driftRows = {};
  for (const [drift, driftIdentity] of Object.entries(driftIdentities)) {
    const beforeAttempts = await attemptStore.list();
    let rejection;
    try { await attemptStore.assertIdentity(createdAttempt.attempt.id, driftIdentity); }
    catch (error) { rejection = error; }
    const afterAttempts = await attemptStore.list();
    driftRows[drift] = {
      stoppedBeforeLaunch:/identity drift/u.test(rejection?.message ?? ""),
      retainedForDiagnosis:afterAttempts.some(({ id }) => id === createdAttempt.attempt.id),
      noFreshAttempt:afterAttempts.length === beforeAttempts.length,
      executionContractIncident:executionContractIncidentObserved,
    };
    assert.deepEqual(Object.values(driftRows[drift]), [true, true, true, true],
      `${drift} stops the existing attempt without forging a fresh attempt`);
  }
  const partialTargetResult = attemptResult("browser:b", "browser");
  partialTargetResult.receiptTask.identity.logicalTargetIds = ["BROWSER_FIRST", "BROWSER_SECOND"];
  partialTargetResult.receiptTask.status = "failed";
  partialTargetResult.receiptTask.logicalResults = {
    BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
    BROWSER_SECOND:{ id:"BROWSER_SECOND" },
  };
  await attemptStore.recordLogicalTargets(createdAttempt.attempt.id, "browser:b",
    partialTargetResult.receiptTask, { token:"owner-42" });
  const targetDurability = await attemptStore.read(createdAttempt.attempt.id);
  assert.deepEqual(targetDurability.logicalResults["browser:b"], {
    BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
  }, "each completed browser target is durable before its whole batch passes");
  await attemptStore.interrupt(createdAttempt.attempt.id, "browser:b", { token:"owner-42" });
  const targetContinuation = await attemptStore.claim(attemptIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:44, token:"owner-44" });
  assert.deepEqual(targetContinuation.attempt.logicalResults["browser:b"], {
    BROWSER_FIRST:{ id:"BROWSER_FIRST", status:"passed", durationMs:3 },
  }, "continuation preserves completed targets and reruns only interrupted or unstarted targets");
  await attemptStore.recordTask(createdAttempt.attempt.id, "browser:b",
    attemptResult("browser:b", "browser"), { token:"owner-44" });
  await attemptStore.recordTask(createdAttempt.attempt.id, "package:extension",
    attemptResult("package:extension", "package"), { token:"owner-44" });
  await attemptStore.markTasksComplete(createdAttempt.attempt.id, { token:"owner-44" });
  assert.equal((await attemptStore.claim(attemptInputIdentity,
    ["unit:a", "browser:b", "package:extension"], { pid:43, token:"owner-43" })).action,
  "promotion-only", "a completed attempt rejects duplicate task execution");
  const observedPromotionScopes = {};
  observedPromotionScopes["completed receipt finalization is interrupted"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["completed receipt finalization is interrupted"],
    "receipt-finalization");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "receipt-finalized");
  const receiptPromotion = (await attemptStore.read(createdAttempt.attempt.id));
  assert.equal(receiptPromotion.promotion["receipt-finalized"].at,
    receiptPromotion.transitions.find(({type}) => type === "receipt-finalized").at,
  "one promotion event retains one timestamp even when the clock advances per read");
  observedPromotionScopes["pending evidence creation is interrupted"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["pending evidence creation is interrupted"],
    "pending-evidence");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "pending-evidence-created");
  observedPromotionScopes["Git-note recording loses its lock or permission"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["Git-note recording loses its lock or permission"],
    "git-note-recording");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "git-note-recorded");
  observedPromotionScopes["handoff eligibility cannot read durable evidence"] =
    (await attemptStore.recovery(createdAttempt.attempt.id)).scope;
  assert.equal(observedPromotionScopes["handoff eligibility cannot read durable evidence"],
    "handoff-eligibility");
  const beforeIdempotentPromotion = await attemptStore.read(createdAttempt.attempt.id);
  await attemptStore.markPromotion(createdAttempt.attempt.id, "git-note-recorded");
  assert.equal((await attemptStore.read(createdAttempt.attempt.id)).transitions.length,
    beforeIdempotentPromotion.transitions.length,
    "restarting an already completed promotion step is idempotent");
  await attemptStore.markPromotion(createdAttempt.attempt.id, "handoff-eligible");
  assert.equal((await attemptStore.read(createdAttempt.attempt.id)).state, "promoted");
  const quiescenceIdentity = checkpointAttemptInputIdentity({ ...attemptIdentity,
    evidenceTask:"failure-quiescence", planDigest:"7".repeat(64) });
  const quiescenceAttempt = await attemptStore.claim(quiescenceIdentity,
    ["unit:failed", "unit:cancelled", "unit:unstarted"],
    { pid:45, token:"owner-45" });
  const failureQuiescence = {
    version:1, stage:"unit", failedTaskKeys:["unit:failed"],
    causalFailedTaskKey:"unit:failed", cancelledTaskKeys:["unit:cancelled"],
    unstartedTaskKeys:["unit:unstarted"],
    terminationResults:[{ taskKey:"unit:cancelled", signal:"SIGTERM", escalatedTo:null }],
    quiesced:true,
  };
  await attemptStore.quiesceFailure(quiescenceAttempt.attempt.id, failureQuiescence,
    { token:"owner-45" });
  const durableQuiescence = await attemptStore.read(quiescenceAttempt.attempt.id);
  assert.equal(durableQuiescence.state, "interrupted");
  assert.deepEqual(durableQuiescence.failureQuiescence, {
    ...failureQuiescence, at:durableQuiescence.failureQuiescence.at,
  }, "the attempt durably binds the causal failure, cancellations, unstarted tasks, and termination");
  assert.ok(Number.isFinite(Date.parse(durableQuiescence.failureQuiescence.at)));
  const quiescenceContinuation = await attemptStore.claim(quiescenceIdentity,
    ["unit:failed", "unit:cancelled", "unit:unstarted"],
    { pid:46, token:"owner-46" });
  assert.equal(quiescenceContinuation.action, "continued",
    "resume is possible only after the durable quiesced boundary is complete");
  assert.deepEqual(quiescenceContinuation.pendingTaskKeys,
    ["unit:failed", "unit:cancelled", "unit:unstarted"]);
  const attemptPath = path.join(checkpointAttemptRoot, `${createdAttempt.attempt.id}.json`);
  const pristineAttemptDocument = JSON.parse(await readFile(attemptPath, "utf8"));
  const forgedAttemptRejected = {};
  const forgeAttempt = async(name, mutate) => {
    const document = structuredClone(pristineAttemptDocument);
    mutate(document.attempt);
    document.digest = timeoutIncidentDigest(document.attempt);
    await writeFile(attemptPath, `${JSON.stringify(document)}\n`);
    await assert.rejects(attemptStore.read(createdAttempt.attempt.id),
      /malformed|transition|result|promotion|state|owner|digest|identity/u);
    forgedAttemptRejected[name] = true;
    await writeFile(attemptPath, `${JSON.stringify(pristineAttemptDocument)}\n`);
  };
  await forgeAttempt("missingResult", (attempt) => { delete attempt.results["unit:a"]; });
  await forgeAttempt("extraResult", (attempt) => {
    attempt.results["unit:extra"] = structuredClone(attempt.results["unit:a"]);
  });
  await forgeAttempt("forgedResult", (attempt) => {
    attempt.results["unit:a"].identityDigest = "9".repeat(64);
  });
  await forgeAttempt("impossibleState", (attempt) => { attempt.state = "active"; });
  await forgeAttempt("reorderedTransitions", (attempt) => {
    [attempt.transitions[0], attempt.transitions[1]] = [attempt.transitions[1], attempt.transitions[0]];
  });
  await forgeAttempt("duplicatedTransition", (attempt) => {
    attempt.transitions.push(structuredClone(attempt.transitions.at(-1)));
  });
  await forgeAttempt("promotionDrift", (attempt) => {
    delete attempt.promotion["git-note-recorded"];
  });
  ownerAlive = false;
  const staleIdentity = checkpointAttemptIdentity({ ...attemptIdentity,
    candidate:{ commit:"4".repeat(40), tree:"5".repeat(40) } });
  const staleCreated = await attemptStore.claim(staleIdentity, ["unit:new"],
    { pid:51, token:"owner-51" });
  const staleRecovered = await attemptStore.claim(staleIdentity, ["unit:new"],
    { pid:52, token:"owner-52" });
  assert.equal(staleCreated.action, "created");
  assert.equal(staleRecovered.action, "stale-owner-recovered");
  checkpointContractEvidence = {
    singleton:createdAttempt.attempt.id === attachedAttempt.attempt.id,
    attachedWithoutDuplicate:attachedAttempt.action === "attached",
    continuation:continuedAttempt.action === "continued",
    reusedOnlyPassed:JSON.stringify(continuedAttempt.reusableTaskKeys) === JSON.stringify(["unit:a"]),
    interruptedAndUnstartedOnly:JSON.stringify(continuedAttempt.pendingTaskKeys) ===
      JSON.stringify(["browser:b", "package:extension"]),
    packagePlanned:createdAttempt.attempt.taskKeys.includes("package:extension"), promotionOnly:true,
    promotionScopes:observedPromotionScopes,
    preflightRows:{
      "every prerequisite is satisfied and no attempt exists":{
        action:"create one repository-common checkpoint attempt",
        taskExecution:"the planned tasks may launch", observed:createdAttempt.action === "created" },
      "one compatible incomplete attempt already exists":{
        action:"attach to that attempt", taskExecution:"no second all-pack process launches",
        observed:attachedAttempt.action === "attached" },
      "another owner holds an incompatible active lease":{
        action:"report or queue behind the named owner outside timing",
        taskExecution:"no checkpoint task launches", observed:incompatibleOwnerRejected },
      "a lease is demonstrably stale":{
        action:"use the bounded audited stale-owner recovery",
        taskExecution:"tasks launch only after lease recovery completes",
        observed:staleRecovered.action === "stale-owner-recovered" },
      "a required executable or bounded output capacity is unavailable":{
        action:"record environment-prerequisite-blocked",
        taskExecution:"no checkpoint task launches",
        observed:!missingExecutableProbe.launchable && !missingCapacityProbe.launchable },
    },
    driftRows,
    identityDriftRejected:Object.values(driftRows).every((row) => row.stoppedBeforeLaunch),
    staleOwnerRecovered:staleRecovered.action === "stale-owner-recovered",
    forgedAttemptRejected,
  };
} finally {
  await rm(checkpointAttemptRoot, { recursive:true, force:true });
}

const cliContentionRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-cli-contention-"));

const cliContentionRepository = path.join(cliContentionRoot, "repository");

const cliProcesses = new Set();

const cliBuildProcessGroups = new Set();

function resolvedNodeModulesRoot(resolve = (specifier) => import.meta.resolve(specifier)) {
  const installedTypescriptRoot = path.dirname(path.dirname(
    fileURLToPath(resolve("typescript"))));
  return path.dirname(installedTypescriptRoot);
}

const cliBuildProcessGroup = async() => {
  const owner = (await readFile(path.join(cliContentionRepository,
    "tmp", "cli-contention-build-owner"), "utf8")).trim().split(" ").map(Number);
  const buildPid = owner[1];
  const group = Number((await exec("ps", ["-o", "pgid=", "-p", String(buildPid)])).trim());
  assert.ok(Number.isInteger(group) && group > 1 && group !== process.pid,
    "the contention fixture must resolve the nested build process group");
  cliBuildProcessGroups.add(group);
  return group;
};

const CLI_CONTENTION_READINESS_TIMEOUT_MS = 120_000;

const terminateCliBuildGroup = (group) => {
  try { process.kill(-group, "SIGKILL"); }
  catch (error) { if (error?.code !== "ESRCH") throw error; }
  cliBuildProcessGroups.delete(group);
};

try {
  await exec("git", ["clone", "--quiet", "--no-hardlinks", path.resolve("."), cliContentionRepository]);
  const cliContentionBase = await exec("git", ["rev-parse", "HEAD"]);
  await exec("git", ["checkout", "--quiet", "--detach", cliContentionBase], {
    cwd:cliContentionRepository,
  });
  await exec("git", ["config", "user.name", "CLI Contention Test"], { cwd:cliContentionRepository });
  await exec("git", ["config", "user.email", "cli-contention@example.test"], {
    cwd:cliContentionRepository,
  });
  const cliRunnerPath = path.join(cliContentionRepository, "scripts/run-focused-acceptance.mjs");
  await copyFile(path.resolve("scripts/run-focused-acceptance.mjs"), cliRunnerPath);
  await copyFile(path.resolve("scripts/verification-run-intent.mjs"),
    path.join(cliContentionRepository, "scripts/verification-run-intent.mjs"));
  await copyFile(path.resolve("scripts/verification-packs.mjs"),
    path.join(cliContentionRepository, "scripts/verification-packs.mjs"));
  const migratedManifestPaths = (await readdir(path.resolve("verification/manifests")))
    .map((name) => `verification/manifests/${name}`);
  const obsoleteManifestPath = "verification/manifests/verification-process.json";
  const obsoleteManifestExisted = await access(path.join(
    cliContentionRepository, obsoleteManifestPath)).then(() => true, () => false);
  const extractedVerificationPaths = [
    "acceptance/src/acceptance/steps/verification_process_legacy.clj",
    "acceptance/src/acceptance/steps/verification_registry_planner_modularization.clj",
    "scripts/verification-evidence/core.mjs",
    "scripts/verification-execution/runner.mjs",
    "scripts/verification-execution/execute.mjs",
    "scripts/verification-execution/bounded-stage-coordinator.mjs",
    "scripts/verification-performance/report-throughput.mjs",
    "scripts/verification-registry/candidate-inventory.mjs",
    "scripts/verification-registry/compiler.mjs",
    "scripts/verification-registry/loader.mjs",
    "scripts/verification-registry/validation.mjs",
    "scripts/verification-" + "fixture-cleanup.mjs",
    "test/fixtures/verification-process-contract-conservation.json",
    "test/support/verification-cleanup.mjs",
    "test/support/verification-contract-boundary-helpers.mjs",
    "test/support/verification-contract-conservation.mjs",
    "test/verification-candidate-inventory-test.mjs",
    "test/verification-contracts/dependency-expansion-contract-test.mjs",
    "test/verification-contracts/evidence-promotion-contract-test.mjs",
    "test/verification-contracts/execution-checkpoint-contract-test.mjs",
    "test/verification-contracts/historical-planning-contract-test.mjs",
    "test/verification-contracts/ownership-impact-contract-test.mjs",
    "test/verification-contracts/registry-inventory-contract-test.mjs",
    "test/verification-contracts/reliability-run-intent-contract-test.mjs",
    "test/verification-contracts/task-batching-contract-test.mjs",
    "test/verification-contracts/timing-performance-contract-test.mjs",
    "test/verification-policy-contract-routing-test.mjs",
    "test/verification-process-property-test.mjs",
    "test/verification-registry-planner-modularization-acceptance-test.mjs",
    "scripts/verification-planner/ownership/resolve.mjs",
    "scripts/verification-planner/ownership/impact.mjs",
    "scripts/verification-planner/dependencies/expand.mjs",
    "scripts/verification-planner/history/changes.mjs",
    "scripts/verification-planner/tasks/planner.mjs",
    "scripts/verification-policy/contracts.mjs",
    "scripts/verification-policy/process-contract-compatibility.mjs",
    "scripts/verification-policy/reliability/run-intent.mjs",
    "scripts/verification-policy/reliability/task-succession.mjs",
    ...migratedManifestPaths,
    "verification/packs.base.json",
    "verification/packs.json",
    "verification/task-succession.json",
    "verification/vtd012-adoption-scorecard.json",
  ];
  for (const verificationPath of extractedVerificationPaths) {
    const destination = path.join(cliContentionRepository, verificationPath);
    await mkdir(path.dirname(destination), { recursive:true });
    await copyFile(path.resolve(verificationPath), destination);
  }
  await rm(path.join(cliContentionRepository, obsoleteManifestPath), { force:true });
  await mkdir(path.join(cliContentionRepository, "scripts/verification-pack-cardinality"),
    { recursive:true });
  await copyFile(path.resolve("scripts/verification-pack-cardinality/contract.mjs"),
    path.join(cliContentionRepository, "scripts/verification-pack-cardinality/contract.mjs"));
  await copyFile(path.resolve("scripts/verification-pack-cardinality/focused-evidence.mjs"),
    path.join(cliContentionRepository, "scripts/verification-pack-cardinality/focused-evidence.mjs"));
  await copyFile(path.resolve("scripts/live-target-permission-recovery-focused-evidence.mjs"),
    path.join(cliContentionRepository,
      "scripts/live-target-permission-recovery-focused-evidence.mjs"));
  await copyFile(path.resolve("scripts/side-panel-single-cutover-focused-evidence.mjs"),
    path.join(cliContentionRepository,
      "scripts/side-panel-single-cutover-focused-evidence.mjs"));
  await copyFile(path.resolve("scripts/verification-shared-boundaries.mjs"),
    path.join(cliContentionRepository, "scripts/verification-shared-boundaries.mjs"));
  await copyFile(path.resolve("scripts/settled-final-verification-policy.mjs"),
    path.join(cliContentionRepository, "scripts/settled-final-verification-policy.mjs"));
  await copyFile(path.resolve("scripts/dist-artifact-lock.mjs"),
    path.join(cliContentionRepository, "scripts/dist-artifact-lock.mjs"));
  const cliRepairPlannerPath = path.join(
    cliContentionRepository, "scripts/verification-reliability-repair.mjs",
  );
  await copyFile(path.resolve("scripts/verification-reliability-repair.mjs"), cliRepairPlannerPath);
  const cliSuccessionPath = path.join(
    cliContentionRepository, "scripts/verification-task-succession.mjs",
  );
  await copyFile(path.resolve("scripts/verification-task-succession.mjs"), cliSuccessionPath);
  await copyFile(path.resolve("scripts/verification-same-target-planner-projection.mjs"),
    path.join(cliContentionRepository, "scripts/verification-same-target-planner-projection.mjs"));
  await copyFile(path.resolve("verification/task-succession.json"),
    path.join(cliContentionRepository, "verification/task-succession.json"));
  await copyFile(path.resolve("verification/packs.json"),
    path.join(cliContentionRepository, "verification/packs.json"));
  await copyFile(path.resolve("test/browser-packs/global-style-smoke.mjs"),
    path.join(cliContentionRepository, "test/browser-packs/global-style-smoke.mjs"));
  await mkdir(path.join(cliContentionRepository, "test"), { recursive:true });
  await copyFile(path.resolve("test/live-target-permission-recovery-acceptance-test.mjs"),
    path.join(cliContentionRepository,
      "test/live-target-permission-recovery-acceptance-test.mjs"));
  await copyFile(path.resolve("test/stylesheet-declarations-property-test.mjs"),
    path.join(cliContentionRepository, "test/stylesheet-declarations-property-test.mjs"));
  await copyFile(path.resolve("test/data-layer-flow-visual-asset-portability-property-test.mjs"),
    path.join(cliContentionRepository, "test/data-layer-flow-visual-asset-portability-property-test.mjs"));
  await copyFile(path.resolve("test/verification-pack-cardinality-contract-test.mjs"),
    path.join(cliContentionRepository, "test/verification-pack-cardinality-contract-test.mjs"));
  for (const documentationTemplateTest of [
    "data-layer-documentation-template-acceptance-test.mjs",
    "data-layer-documentation-template-excel-test.mjs",
    "data-layer-documentation-template-library-test.mjs",
    "data-layer-documentation-template-rich-test.mjs",
  ]) {
    await copyFile(path.resolve("test", documentationTemplateTest),
      path.join(cliContentionRepository, "test", documentationTemplateTest));
  }
  await mkdir(path.join(cliContentionRepository, "src/documentation-templates"), { recursive:true });
  for (const documentationTemplateSource of [
    "excel-renderer.ts",
    "excel-template.ts",
    "excel-workbook.ts",
    "rich-renderer.ts",
    "rich-template.ts",
    "template-body.ts",
    "template-context.ts",
    "template-contract.ts",
    "template-library.ts",
  ]) {
    await copyFile(path.resolve("src/documentation-templates", documentationTemplateSource),
      path.join(cliContentionRepository, "src/documentation-templates", documentationTemplateSource));
  }
  await mkdir(path.join(cliContentionRepository, "src/project-documentation"), { recursive:true });
  await copyFile(path.resolve("src/project-documentation/workspace-template-library-ui.ts"),
    path.join(cliContentionRepository,
      "src/project-documentation/workspace-template-library-ui.ts"));
  await copyFile(path.resolve("test/flow-stylesheet-extraction-test.mjs"),
    path.join(cliContentionRepository, "test/flow-stylesheet-extraction-test.mjs"));
  await mkdir(path.join(cliContentionRepository, "src/flow-graph"), { recursive:true });
  await copyFile(path.resolve("src/flow-graph/flow-workspace.css"),
    path.join(cliContentionRepository, "src/flow-graph/flow-workspace.css"));
  await copyFile(path.resolve("src/flow-graph/flow-workspace-shell.css"),
    path.join(cliContentionRepository, "src/flow-graph/flow-workspace-shell.css"));
  const cliClosurePath = path.join(
    cliContentionRepository, "scripts/verification-reliability-closure.mjs",
  );
  await copyFile(path.resolve("scripts/verification-reliability-closure.mjs"), cliClosurePath);
  const cliPrerequisitePath = path.join(
    cliContentionRepository, "scripts/verification-execution-prerequisites.mjs",
  );
  await copyFile(path.resolve("scripts/verification-execution-prerequisites.mjs"), cliPrerequisitePath);
  await copyFile(path.resolve("scripts/verification-browser-prerequisite-normalization.mjs"),
    path.join(cliContentionRepository, "scripts/verification-browser-prerequisite-normalization.mjs"));
  const buildOwnerFile = path.join(cliContentionRepository, "tmp", "cli-contention-build-owner");
  await writeFile(path.join(cliContentionRepository, "scripts/build.mjs"), [
    'import { writeFile } from "node:fs/promises";',
    'import { withDistArtifactLock } from "./dist-artifact-lock.mjs";',
    `await withDistArtifactLock(async() => { await writeFile(${JSON.stringify(buildOwnerFile)}, process.ppid + " " + process.pid + "\\n"); await new Promise(() => setInterval(() => {}, 1000)); });`,
    "",
  ].join("\n"));
  await mkdir(path.join(cliContentionRepository, "tmp"), { recursive:true });
  const installedNodeModulesRoot = resolvedNodeModulesRoot();
  const fixtureNodeModulesRoot = path.join(cliContentionRepository, "node_modules");
  await symlink(installedNodeModulesRoot, fixtureNodeModulesRoot, "dir");
  assert.equal(await realpath(fixtureNodeModulesRoot), await realpath(installedNodeModulesRoot),
    "the isolated checkpoint fixture attaches the resolved locked npm prerequisites");
  await symlink(path.resolve("tmp/tools"), path.join(cliContentionRepository, "tmp/tools"), "dir");
  await writeFile(path.join(cliContentionRepository, ".git/info/exclude"),
    "node_modules\n.swarmforge\nverification/task-succession.json\n");
  await exec("git", ["add", "scripts/run-focused-acceptance.mjs",
    "scripts/verification-run-intent.mjs",
    "scripts/settled-final-verification-policy.mjs",
    "scripts/dist-artifact-lock.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-closure.mjs",
    "scripts/verification-execution-prerequisites.mjs",
    "scripts/verification-browser-prerequisite-normalization.mjs", "scripts/build.mjs",
    "scripts/verification-same-target-planner-projection.mjs",
    "scripts/verification-task-succession.mjs",
    "scripts/verification-styles.mjs", "scripts/verification-packs.mjs",
    ...extractedVerificationPaths,
    ...(obsoleteManifestExisted ? [obsoleteManifestPath] : []),
    "scripts/verification-pack-cardinality/contract.mjs",
    "scripts/verification-pack-cardinality/focused-evidence.mjs",
    "scripts/live-target-permission-recovery-focused-evidence.mjs",
    "scripts/side-panel-single-cutover-focused-evidence.mjs",
    "scripts/verification-shared-boundaries.mjs",
    "test/browser-packs/global-style-smoke.mjs", "test/stylesheet-declarations-property-test.mjs",
    "test/data-layer-flow-visual-asset-portability-property-test.mjs",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/data-layer-documentation-template-acceptance-test.mjs",
    "test/data-layer-documentation-template-excel-test.mjs",
    "test/data-layer-documentation-template-library-test.mjs",
    "test/data-layer-documentation-template-rich-test.mjs",
    "test/live-target-permission-recovery-acceptance-test.mjs",
    "src/documentation-templates/excel-renderer.ts",
    "src/documentation-templates/excel-template.ts",
    "src/documentation-templates/excel-workbook.ts",
    "src/documentation-templates/rich-renderer.ts",
    "src/documentation-templates/rich-template.ts",
    "src/documentation-templates/template-body.ts",
    "src/documentation-templates/template-context.ts",
    "src/documentation-templates/template-contract.ts",
    "src/documentation-templates/template-library.ts",
    "src/project-documentation/workspace-template-library-ui.ts",
    "test/flow-stylesheet-extraction-test.mjs", "src/flow-graph/flow-workspace.css",
    "src/flow-graph/flow-workspace-shell.css",
    "verification/packs.json"], {
    cwd:cliContentionRepository,
  });
  await exec("git", ["commit", "-qm", "cli contention fixture baseline"], { cwd:cliContentionRepository });
  await writeFile(path.join(cliContentionRepository, "scripts/build.mjs"), `${await readFile(
    path.join(cliContentionRepository, "scripts/build.mjs"), "utf8")}\n`);
  await exec("git", ["add", "scripts/build.mjs"], { cwd:cliContentionRepository });
  await exec("git", ["commit", "-qm", "cli contention fixture"], { cwd:cliContentionRepository });

  const packIds = JSON.parse(await readFile(path.join(cliContentionRepository,
    "verification/packs.json"), "utf8"))
    .filter((pack) => ["unit", "property", "features", "browserAdapters",
      "browserObservations", "checkpointCommands"].some((key) => pack[key]?.length))
    .map(({ id }) => id);
  const checkpointArgs = ["scripts/run-focused-acceptance.mjs",
    ...packIds.flatMap((id) => ["--pack", id]), "--property", "--changed-since", "HEAD^",
    "--prepare-evidence", "vtd014-cli-contention"];
  const observeCli = (args, environment = {}) => {
    const childEnvironment={...process.env,...environment,
      SWARMFORGE_SYNTHETIC_VERIFICATION_FIXTURE:JSON.stringify({
        version:1,root:cliContentionRepository,
        registry:path.join(cliContentionRepository,"verification/packs.json"),
        receiptDirectory:path.join(cliContentionRepository,"tmp/verification-receipts"),
        reliabilityStore:path.join(cliContentionRepository,".git/swarmforge-timeout-incidents"),
        admissibleAsProductionEvidence:false,
      })};
    delete childEnvironment.SWARMFORGE_VERIFICATION_PARENT_CONTEXT;
    delete childEnvironment.SWARMFORGE_VERIFICATION_TASK_KEY;
    delete childEnvironment.SWARMFORGE_VERIFICATION_RECEIPT;
    const child = spawn(process.execPath, args, {
      cwd:cliContentionRepository, stdio:["ignore", "pipe", "pipe"],
      env:childEnvironment,
    });
    cliProcesses.add(child);
    const observation = { child, stdout:"", stderr:"" };
    child.stdout.on("data", (chunk) => { observation.stdout += chunk; });
    child.stderr.on("data", (chunk) => { observation.stderr += chunk; });
    observation.closed = new Promise((resolve) => child.once("close", (code, signal) => {
      cliProcesses.delete(child);
      resolve({ code, signal });
    }));
    return observation;
  };
  const waitForCli = async(observation, predicate, description,
    timeoutMs = CLI_CONTENTION_READINESS_TIMEOUT_MS) => {
    const deadline = Date.now() + timeoutMs;
    while (!await predicate(observation) && observation.child.exitCode === null &&
        observation.child.signalCode === null && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    const ready = await predicate(observation);
    const fixtureStatus = ready ? "" : await exec("git", ["status", "--short"], {
      cwd:cliContentionRepository,
    }).catch((error) => `status unavailable: ${error.message}`);
    assert.ok(ready,
      `${description}: ${observation.stdout}${observation.stderr}\nfixture status:\n${fixtureStatus}`);
  };
  const firstCli = observeCli(checkpointArgs);
  await waitForCli(firstCli, ({ stderr }) => stderr.includes("[verify:start] npm run build"),
    "the first real CLI did not claim its checkpoint before starting the build");
  await waitForCli(firstCli, async() => {
    try { return Boolean((await readFile(buildOwnerFile, "utf8")).trim()); }
    catch (error) { if (error?.code === "ENOENT") return false; throw error; }
  }, "the first real CLI build did not acquire the artifact lease");

  const compatibleCli = observeCli(checkpointArgs, { DIST_ARTIFACT_LOCK_TIMEOUT_MS:"100" });
  const compatibleExit = await compatibleCli.closed;
  assert.equal(compatibleExit.code, 1);
  assert.match(compatibleCli.stderr, /Compatible checkpoint attempt [a-f0-9]{64} is already active/u);
  assert.match(compatibleCli.stderr, /no duplicate all-pack process launched/u);
  assert.doesNotMatch(compatibleCli.stderr, /\[verify:start\]|Timed out waiting.*dist artifact lock/u,
    "a compatible CLI must attach before task timing or artifact-lock waiting");

  const incompatibleArgs = [...checkpointArgs.slice(0, -1), "vtd014-cli-contention-incompatible"];
  const incompatibleCli = observeCli(incompatibleArgs, { DIST_ARTIFACT_LOCK_TIMEOUT_MS:"100" });
  const incompatibleExit = await incompatibleCli.closed;
  assert.equal(incompatibleExit.code, 1);
  assert.match(incompatibleCli.stderr, /Incompatible checkpoint attempt [a-f0-9]{64} is owned by pid/u);
  assert.doesNotMatch(incompatibleCli.stderr, /\[verify:start\]|Timed out waiting.*dist artifact lock/u,
    "an incompatible CLI must report the named owner before task timing or artifact-lock waiting");

  const buildGroupPid = await cliBuildProcessGroup();
  firstCli.child.kill("SIGKILL");
  terminateCliBuildGroup(buildGroupPid);
  await firstCli.closed;
  await rm(buildOwnerFile, { force:true });

  const staleCli = observeCli(checkpointArgs, { DIST_ARTIFACT_LOCK_TIMEOUT_MS:"3000" });
  await waitForCli(staleCli, ({ stderr }) => stderr.includes("[verify:checkpoint-continue]"),
    "a replacement real CLI did not recover the stale checkpoint owner");
  await waitForCli(staleCli, ({ stderr }) => stderr.includes("[verify:start] npm run build"),
    "the stale-owner replacement did not proceed after recovery");
  await waitForCli(staleCli, async() => {
    try { return Boolean((await readFile(buildOwnerFile, "utf8")).trim()); }
    catch (error) { if (error?.code === "ENOENT") return false; throw error; }
  }, "the stale-owner replacement build did not publish its cleanup identity");
  assert.ok(staleCli.stderr.indexOf("[verify:checkpoint-continue]") <
    staleCli.stderr.indexOf("[verify:start] npm run build"),
  "stale-owner recovery must complete outside and before task timing");
  const staleBuildGroupPid = await cliBuildProcessGroup();
  staleCli.child.kill("SIGTERM");
  await staleCli.closed;
  terminateCliBuildGroup(staleBuildGroupPid);
} finally {
  for (const child of cliProcesses) child.kill("SIGKILL");
  await Promise.all([...cliProcesses].map((child) => new Promise((resolve) => child.once("close", resolve))));
  for (const group of cliBuildProcessGroups) terminateCliBuildGroup(group);
  await removeVerificationFixtureRoot(cliContentionRoot);
}

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

let vtd014Evidence = {};

let runIntentDiagnosticIsolationObserved = false;

let runIntentReviewIncidentObserved = false;

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

const feature = planVerification(synthetic, { changedPaths:["features/alpha-one.feature"] });

const executed = [];

await executeAcceptancePlan(feature, {
  runCommand:async(display, task) => executed.push({ display, key:task.key }),
});

assert.deepEqual(executed.map(({ display }) => display), feature.commands);

assert.ok(executed.findIndex(({ key }) => key.startsWith("checkpoint:")) <
  executed.findIndex(({ key }) => key.startsWith("acceptance-session:")));

const independentBrowserPlan = {
  ...feature,
  browserTasks:[{
    key:"browser:failure", stage:"browser", packId:"alpha", executable:"node",
    args:["test/failing-browser.mjs"], target:"test/failing-browser.mjs", environment:null,
    display:"node test/failing-browser.mjs",
  }],
};

const attemptedBrowserTasks = [];

await assert.rejects(() => executeAcceptancePlan(independentBrowserPlan, {
  runCommand:async(_display, task) => {
    attemptedBrowserTasks.push(task.key);
    if (task.key === "browser:failure") throw new Error("adapter failed");
  },
}), /1 independent command/u);

assert.equal(attemptedBrowserTasks.includes("browser-observation:ALPHA_BROWSER_ADAPTER"), false,
  "a failed browser stage quiesces before a later observation stage starts");

const attemptedSessions = [];

let activeSessions = 0;

let maximumActiveSessions = 0;

await assert.rejects(() => executeAcceptancePlan({
  preparationTasks:[], unitTasks:[], propertyTasks:[], browserTasks:[], observationTasks:[],
  parserTasks:[], generatorTasks:[], checkpointTasks:[],
  unitCommands:[], parserCommands:[],
  sessionTasks:["fail-a", "pass", "fail-b"].map((name) => ({
    key:`acceptance-session:${name}`, stage:"acceptance-session", packId:name,
    executable:"bb", args:[name], target:name, environment:null, display:`bb ${name}`,
  })),
}, {
  concurrency:2,
  runCommand:async(_display, task) => {
    attemptedSessions.push(task.key);
    activeSessions += 1;
    maximumActiveSessions = Math.max(maximumActiveSessions, activeSessions);
    await new Promise((resolve) => setTimeout(resolve, 5));
    activeSessions -= 1;
    if (task.key.includes("fail")) throw new Error(task.key);
  },
}), /1 independent command/u);

assert.deepEqual(attemptedSessions.sort(), [
  "acceptance-session:fail-a", "acceptance-session:pass",
], "the first failure closes the stage before another independent session launches");

assert.equal(maximumActiveSessions, 2, "independent pack sessions use the bounded worker pool");

const quiescenceEvents = [];
let cancelRunningSibling;
const quiescingRunner = async(_display, task) => {
  quiescenceEvents.push(`start:${task.key}`);
  if (task.key === "unit:first-failure") throw new Error("first-stage-failure");
  if (task.key === "unit:running-sibling") {
    await new Promise((resolve, reject) => { cancelRunningSibling = () => {
      const error = new Error("coordinator-cancelled-running-sibling");
      error.verificationCoordinatorCancellation = {
        taskKey:task.key, signal:"SIGTERM", escalatedTo:null,
      };
      reject(error);
    }; });
  }
  quiescenceEvents.push(`finish:${task.key}`);
};
quiescingRunner.cancelStage = async({ failedTaskKey }) => {
  quiescenceEvents.push(`cancel:${failedTaskKey}`);
  cancelRunningSibling();
};
let quiescedStage;
await assert.rejects(() => executeAcceptancePlan({
  preparationTasks:[], propertyTasks:[], browserTasks:[], observationTasks:[],
  parserTasks:[], generatorTasks:[], checkpointTasks:[], sessionTasks:[], packageTasks:[],
  unitCommands:[], parserCommands:[],
  unitTasks:["first-failure", "running-sibling", "unstarted"].map((name) => ({
    key:`unit:${name}`, stage:"unit", packId:"verification_process", executable:"node",
    args:[`${name}.mjs`], target:name, environment:null, display:`node ${name}.mjs`,
  })),
}, {
  concurrency:2,
  runCommand:quiescingRunner,
  onFailureQuiesced:async(summary) => { quiescedStage = summary; },
}), /unit:first-failure/u);
assert.deepEqual(quiescenceEvents, [
  "start:unit:first-failure", "start:unit:running-sibling",
  "cancel:unit:first-failure",
], "the first failure closes launches and coordinator-cancels the running sibling");
assert.deepEqual(quiescedStage, {
  version:1, stage:"unit", failedTaskKeys:["unit:first-failure"],
  causalFailedTaskKey:"unit:first-failure",
  cancelledTaskKeys:["unit:running-sibling"],
  unstartedTaskKeys:["unit:unstarted"],
  terminationResults:[{ taskKey:"unit:running-sibling", signal:"SIGTERM", escalatedTo:null }],
  quiesced:true,
}, "the stage settles running cancellation before exposing one durable quiesced boundary");

let releaseIndependentFailures;
const independentFailuresReady = new Promise((resolve) => { releaseIndependentFailures = resolve; });
let independentFailureStarts = 0;
let independentFailureSummary;
await assert.rejects(() => executeAcceptancePlan({
  preparationTasks:[], propertyTasks:[], browserTasks:[], observationTasks:[],
  parserTasks:[], generatorTasks:[], checkpointTasks:[], sessionTasks:[], packageTasks:[],
  unitCommands:[], parserCommands:[],
  unitTasks:["first", "second"].map((name) => ({
    key:`unit:independent-${name}`, stage:"unit", packId:"verification_process",
    executable:"node", args:[`${name}.mjs`], target:name, environment:null,
    display:`node ${name}.mjs`,
  })),
}, {
  concurrency:2,
  runCommand:async(_display, task) => {
    independentFailureStarts += 1;
    if (independentFailureStarts === 2) releaseIndependentFailures();
    await independentFailuresReady;
    throw new Error(task.key);
  },
  onFailureQuiesced:async(summary) => { independentFailureSummary = summary; },
}), /2 independent command/u);
assert.deepEqual(independentFailureSummary.failedTaskKeys,
  ["unit:independent-first", "unit:independent-second"],
"siblings that fail independently before cancellation retain both ordinary failures");
assert.deepEqual(independentFailureSummary.cancelledTaskKeys, []);

const sharedArtifactEvents = [];

let releaseSharedArtifact;

const sharedArtifactPlan = {
  preparationTasks:[{
    key:"build:dist", stage:"build", executable:"npm", args:["run", "build"],
    display:"npm run build",
  }],
  unitTasks:[], propertyTasks:[], browserTasks:[], parserTasks:[], generatorTasks:[],
  checkpointTasks:[], sessionTasks:[], unitCommands:[], parserCommands:[],
  observationTasks:["one", "two"].map((name) => ({
    key:`browser-observation:${name}`, stage:"browser-observation", packId:name,
    executable:"node", args:[name], target:name, display:`node ${name}`,
  })),
};

let activeSharedArtifactTasks = 0;

let maximumSharedArtifactTasks = 0;

const sharedArtifactMetrics = await executeAcceptancePlan(sharedArtifactPlan, {
  observationConcurrency:2,
  acquireArtifactLease:async() => {
    sharedArtifactEvents.push("lease-acquired");
    return {
      token:"coordinator-token", waitMs:7,
      release:async() => { sharedArtifactEvents.push("lease-released"); releaseSharedArtifact?.(); },
    };
  },
  afterPreparation:async() => sharedArtifactEvents.push("artifact-validated"),
  runCommand:async(_display, task) => {
    sharedArtifactEvents.push(`start:${task.key}`);
    if (task.stage === "build") return;
    assert.deepEqual(task.artifactLease, {
      token:"coordinator-token", access:"read",
    }, "read-only browser children receive the coordinator's exact lease");
    activeSharedArtifactTasks += 1;
    maximumSharedArtifactTasks = Math.max(maximumSharedArtifactTasks, activeSharedArtifactTasks);
    await new Promise((resolve) => setTimeout(resolve, 20));
    activeSharedArtifactTasks -= 1;
    sharedArtifactEvents.push(`finish:${task.key}`);
  },
});

assert.equal(maximumSharedArtifactTasks, 2,
  "two independent browser observations overlap under one coordinator lease");

assert.ok(sharedArtifactEvents.indexOf("lease-acquired") <
  sharedArtifactEvents.indexOf("artifact-validated"));

assert.ok(sharedArtifactEvents.indexOf("artifact-validated") <
  sharedArtifactEvents.indexOf("start:browser-observation:one"));

assert.equal(sharedArtifactEvents.at(-1), "lease-released",
  "the coordinator retains the artifact lease until its planned consumers settle");

assert.equal(sharedArtifactMetrics.artifactWaitMs, 0);

assert.equal(sharedArtifactMetrics.coordinatorArtifactWaitMs, 7);

assert.equal(sharedArtifactMetrics.observationWorkerCount, 2);

assert.ok(sharedArtifactMetrics.usefulOverlapMs > 0);

assert.ok(sharedArtifactMetrics.browserObservationStageMs >= 10);

assert.ok(sharedArtifactMetrics.completeGateMs >= sharedArtifactMetrics.browserObservationStageMs);

assert.deepEqual(deterministicBrowserWorkerSchedule([
  { key:"slow", durationMs:90_000, isolated:true },
  { key:"medium", durationMs:60_000, isolated:true },
  { key:"small", durationMs:30_000, isolated:true },
  { key:"shared", durationMs:120_000, isolated:false },
], 3), {
  parallel:[
    { loadMs:90_000, taskKeys:["slow"] },
    { loadMs:60_000, taskKeys:["medium"] },
    { loadMs:30_000, taskKeys:["small"] },
  ],
  serial:["shared"],
}, "indivisible measured durations produce a stable longest-first candidate schedule");

const acceptedThreeWorkers = decideBrowserObservationWorkers({
  acceptedTwoWorker:{ mode:"normal", packId:"layered_schema", durationMs:220_000, passed:true },
  candidateThreeWorkerNormal:{ mode:"normal", packId:"layered_schema", durationMs:150_000,
    passed:true, collisions:[] },
  candidateThreeWorkerLoaded:{ mode:"loaded", packId:"layered_schema", durationMs:165_000,
    passed:true, collisions:[] },
});

assert.equal(acceptedThreeWorkers.workerCount, 3);

assert.equal(acceptedThreeWorkers.savingsMs, 70_000);

assert.equal(decideBrowserObservationWorkers({
  acceptedTwoWorker:{ mode:"normal", packId:"layered_schema", durationMs:220_000, passed:true },
  candidateThreeWorkerNormal:{ mode:"normal", packId:"layered_schema", durationMs:150_000,
    passed:true, collisions:[] },
  candidateThreeWorkerLoaded:{ mode:"loaded", packId:"layered_schema", durationMs:165_000,
    passed:false, collisions:["profile"] },
}).workerCount, 2, "a failed loaded sample cannot be retried away into a three-worker default");

const accessLock = path.join(await mkdtemp(path.join(os.tmpdir(), "verification-shared-artifact-")), "lock");

const accessRelease = await acquireDistArtifactLock(accessLock);

let outsideWriterAcquired = false;

let outsideWriterWasBlocked = false;

let outsideWriterRelease;

const savedLeaseEnvironment = {
  token:process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD,
  access:process.env.MY_CHROME_UTILITIES_DIST_LOCK_ACCESS,
};

try {
  Object.assign(process.env, distArtifactLeaseEnvironment(accessRelease.token, "read"));
  await withDistArtifactLock(async() => {}, { directory:accessLock, access:"read" });
  await assert.rejects(
    withDistArtifactLock(async() => {}, { directory:accessLock, access:"write" }),
    /read-only artifact lease cannot authorize write access/u,
    "a coordinator reader cannot mutate or replace the shared artifact",
  );
  const outsideWriter = acquireDistArtifactLock(accessLock, {
    timeoutMs:1_000, reportAfterMs:500,
  }).then((release) => {
    outsideWriterAcquired = true;
    outsideWriterRelease = release;
  });
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(outsideWriterAcquired, false,
    "an outside writer remains blocked while the coordinator serves readers");
  outsideWriterWasBlocked = !outsideWriterAcquired;
  releaseSharedArtifact = async() => outsideWriter;
} finally {
  if (savedLeaseEnvironment.token === undefined) delete process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD;
  else process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD = savedLeaseEnvironment.token;
  if (savedLeaseEnvironment.access === undefined) delete process.env.MY_CHROME_UTILITIES_DIST_LOCK_ACCESS;
  else process.env.MY_CHROME_UTILITIES_DIST_LOCK_ACCESS = savedLeaseEnvironment.access;
  await accessRelease();
  await releaseSharedArtifact?.();
  await outsideWriterRelease?.();
  await rm(path.dirname(accessLock), { recursive:true, force:true });
}

assert.equal(outsideWriterAcquired, true,
  "the outside writer resumes only after the coordinator releases the artifact");

const failedParallelAttempts = [];

let failedParallelLeaseReleased = false;

await assert.rejects(() => executeAcceptancePlan(sharedArtifactPlan, {
  observationConcurrency:2,
  acquireArtifactLease:async() => ({ token:"failure-token", waitMs:0,
    release:async() => { failedParallelLeaseReleased = true; } }),
  runCommand:async(_display, task) => {
    if (task.stage === "build") return;
    failedParallelAttempts.push(task.key);
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (task.key.endsWith(":one")) throw new Error("original-one-failure");
  },
}), /browser-observation:one/u);

assert.deepEqual(failedParallelAttempts.sort(), [
  "browser-observation:one", "browser-observation:two",
], "one worker failure does not discard the remaining independent result");

assert.equal(failedParallelLeaseReleased, true,
  "a failed combined result still releases the coordinator artifact lease");

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

if (process.platform !== "win32") {
  const commandReceiptDirectory = await mkdtemp(path.join(os.tmpdir(), "verification-command-receipts-"));
  const saved = {
    timeout:process.env.VERIFICATION_COMMAND_TIMEOUT_MS,
    grace:process.env.VERIFICATION_TERMINATION_GRACE_MS,
    limit:process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES,
  };
  try {
    process.env.VERIFICATION_COMMAND_TIMEOUT_MS = "2000";
    process.env.VERIFICATION_TERMINATION_GRACE_MS = "100";
    process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES = "4096";
    const context = createVerificationReceiptContext(1, 2, {
      receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review,
    });
    let commandFailureNumber = 0;
    const commandFailures = [];
    const runner = createAuthorizedTestCommandRunner(context, { incidentStore:{
      create:async(failure) => {
        commandFailures.push(failure);
        return { id:`incident-command-fixture-${++commandFailureNumber}`,
          failureDigest:"d".repeat(64) };
      },
    } });
    const envTask = {
      key:"unit:environment", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "process.stdout.write(JSON.stringify({value:process.env.VERIFICATION_TEST_VALUE,context:JSON.parse(process.env.SWARMFORGE_VERIFICATION_PARENT_CONTEXT)}))"], target:"environment",
      environment:{ VERIFICATION_TEST_VALUE:"visible" }, display:"environment task",
    };
    await runner(envTask.display, envTask);
    const inheritedEnvironment=JSON.parse(context.receipt.tasks[envTask.key].output);
    assert.equal(inheritedEnvironment.value,"visible");
    assert.equal(validateVerificationParentExecutionContext(inheritedEnvironment.context).parentTaskKey,
      envTask.key,"every real task launch inherits its exact parent authorization binding");
    assert.equal(context.receipt.tasks[envTask.key].stderr, "");
    const tempTask = {
      key:"unit:temporary-root", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(1,process.env.TMPDIR+'\\n')"],
      target:"temporary-root", environment:null, display:"runner-owned temporary root",
    };
    await runner(tempTask.display, tempTask);
    assert.equal(context.receipt.tasks[tempTask.key].output.trim(),
      path.join(context.runDirectory, "system-temp"),
    "verification children use workspace-scoped temporary storage without moving the incident store");
    const browserTempTask = {
      key:"browser:temporary-root", stage:"browser", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(1,process.env.TMPDIR+'\\n')"],
      target:"browser-temporary-root", environment:null, requiredCapabilities:[],
      display:"browser short temporary root",
    };
    await runner(browserTempTask.display, browserTempTask);
    assert.equal(context.receipt.tasks[browserTempTask.key].output.trim(),
      path.join("/tmp", "sf-chrome", context.receipt.runId.slice(0, 8)),
    "known Chrome tasks use the short singleton-socket route on their first launch");
    const acceptanceChromeTask = {
      key:"acceptance-session:temporary-root", stage:"acceptance-session", packId:"process",
      executable:process.execPath,
      args:["-e", "process.stdout.write(JSON.stringify([process.env.TMPDIR,process.env.SWARMFORGE_CHROME_TMPDIR]))"],
      target:"acceptance-temporary-root", environment:null, requiredCapabilities:[],
      temporaryPathClass:"chrome-short", display:"acceptance Chrome temporary roots",
    };
    await runner(acceptanceChromeTask.display, acceptanceChromeTask);
    assert.deepEqual(JSON.parse(context.receipt.tasks[acceptanceChromeTask.key].output), [
      path.join(context.runDirectory, "system-temp"),
      path.join("/tmp", "sf-chrome", context.receipt.runId.slice(0, 8)),
    ], "acceptance keeps non-Chrome work scoped while routing Chrome children short before launch");
    const streamedTargets = [];
    const streamingContext = createVerificationReceiptContext(1, 1,
      { receiptDirectory:commandReceiptDirectory });
    const streamingRunner = createAuthorizedTestCommandRunner(streamingContext, {
      onLogicalTargetResult:async(task, receiptTask) => {
        streamedTargets.push({ task:task.key, logicalResults:structuredClone(receiptTask.logicalResults) });
      },
      incidentStore:{ create:async() => ({ id:"incident-stream-interruption",
        failureDigest:"a".repeat(64) }) },
    });
    const streamingTask = { key:"browser:stream-before-exit", stage:"browser", packId:"process",
      executable:process.execPath, target:"stream-before-exit", environment:null,
      logicalTargetIds:["FIRST", "SECOND"], requiredCapabilities:[], display:"streaming browser task",
      args:["-e", [
        "const emit=(value)=>process.stdout.write(JSON.stringify(value)+'\\n');",
        "emit({swarmforgeBrowserTargetResult:{id:'FIRST',status:'passed'}});",
        "emit({swarmforgeBrowserTargetTiming:{id:'FIRST',durationMs:3}});",
        "setInterval(()=>{},1000);",
      ].join("")],
    };
    process.env.VERIFICATION_COMMAND_TIMEOUT_MS = "100";
    await assert.rejects(() => streamingRunner(streamingTask.display, streamingTask), /timed out/u);
    process.env.VERIFICATION_COMMAND_TIMEOUT_MS = "2000";
    assert.deepEqual(streamedTargets, [{ task:streamingTask.key, logicalResults:{
      FIRST:{ id:"FIRST", status:"passed", durationMs:3 },
    } }], "a completed live target is persisted before its interrupted batch child exits");
    const mutationRepository = await mkdtemp(path.join(os.tmpdir(), "vtd014-live-mutation-"));
    try {
      await mkdir(path.join(mutationRepository, "src"));
      await mkdir(path.join(mutationRepository, "dist"));
      await writeFile(path.join(mutationRepository, "src", "tracked.ts"), "export const value = 1;\n");
      await writeFile(path.join(mutationRepository, "dist", "tracked.js"), "export const value = 1;\n");
      const artifactToolchain = { node:process.versions.node, typescript:ts.version };
      const artifactInputs = { inputPaths:["src"], toolchain:artifactToolchain };
      const mutationInput = await createDistInputFingerprint({ root:mutationRepository,
        ...artifactInputs });
      const mutationArtifact = await writeDistArtifactManifest({ root:mutationRepository,
        inputFingerprint:mutationInput, ...artifactInputs });
      await exec("git", ["init", "-q"], { cwd:mutationRepository });
      await exec("git", ["config", "user.email", "vtd014@example.invalid"], { cwd:mutationRepository });
      await exec("git", ["config", "user.name", "VTD 014"], { cwd:mutationRepository });
      await exec("git", ["add", "."], { cwd:mutationRepository });
      await exec("git", ["commit", "-qm", "fixture"], { cwd:mutationRepository });
      const mutationCommit = (await exec("git", ["rev-parse", "HEAD^{commit}"],
        { cwd:mutationRepository })).trim();
      const mutationTree = (await exec("git", ["rev-parse", "HEAD^{tree}"],
        { cwd:mutationRepository })).trim();
      const mutationContext = createVerificationReceiptContext(1, 1,
        { receiptDirectory:path.join(mutationRepository, "receipts"),
          runIntent:verificationRunIntents.review });
      mutationContext.receipt.candidate = { commit:mutationCommit, tree:mutationTree };
      mutationContext.receipt.artifact = mutationArtifact;
      mutationContext.receipt.plan = { mode:"exact" };
      const liveGuard = createRepositoryCheckpointIdentityGuard({
        repositoryRoot:mutationRepository,
        expected:{ commit:mutationCommit, tree:mutationTree,
          artifactInputDigest:mutationArtifact.inputDigest,
          artifactOutputDigest:mutationArtifact.outputDigest,
          artifactBuildIdentity:mutationArtifact.buildIdentity, trackedChanges:"" },
        context:mutationContext, attemptId:"live-attempt", launchRoutes:new Map(),
        inputFingerprintOptions:artifactInputs,
        artifactValidator:({ root }) => assertFreshDistArtifact({ root, ...artifactInputs }),
      });
      const liveBaseRunner = createAuthorizedTestCommandRunner(mutationContext);
      const liveRunner = async(display, task) => {
        await liveGuard.assertBefore(task);
        return liveBaseRunner(display, task);
      };
      const firstLiveTask = { ...envTask, key:"unit:live-first", environment:null,
        args:["-e", "process.exitCode=0"] };
      await liveRunner("live first child", firstLiveTask);
      await writeFile(path.join(mutationRepository, "src", "tracked.ts"),
        "export const value = 2;\n");
      const secondSentinel = path.join(mutationRepository, "second-launched");
      const secondLiveTask = { ...envTask, key:"unit:live-second", environment:null,
        args:["-e", `require('node:fs').writeFileSync(${JSON.stringify(secondSentinel)},'yes')`] };
      await assert.rejects(() => liveRunner("live second child", secondLiveTask),
        /execution-contract incident/u);
      await assert.rejects(() => access(secondSentinel), { code:"ENOENT" },
        "the second live child is not launched after a real tracked-file mutation");
      const mutationIncidents = await createTimeoutIncidentStore({ root:mutationRepository }).list();
      assert.equal(mutationIncidents.length, 1);
      assert.equal(mutationIncidents[0].failure.failureClass, "execution-contract-failure",
        "the production incident store persists the live runner-boundary mutation");
    } finally {
      await rm(mutationRepository, { recursive:true, force:true });
    }
    const routedContext = createVerificationReceiptContext(1, 2,
      { receiptDirectory:commandReceiptDirectory });
    const routedTask = { ...envTask, key:"browser:routed-boundary", stage:"browser",
      requiredCapabilities:["local-loopback"], environment:null,
      args:["-e", "require('node:fs').writeSync(1,process.env.SWARMFORGE_EXECUTION_ROUTE+'|'+process.env.SWARMFORGE_EXECUTION_BOUNDARY+'\\n')"] };
    const routedRunner = createAuthorizedTestCommandRunner(routedContext, { launchRoutes:new Map([
      [routedTask.key, "scoped-command-approval"],
      [envTask.key, "workspace-sandbox"],
    ]) });
    await routedRunner("routed capability boundary", routedTask);
    const scopedRouteObservation = routedContext.receipt.tasks[routedTask.key].output.trim();
    assert.equal(scopedRouteObservation,
      "scoped-command-approval|bwrap-shared-loopback",
    "the planned capability route is bound to the actual child isolation boundary");
    const mixedWorkspaceTask = { ...envTask,
      args:["-e", "require('node:fs').writeSync(1,process.env.SWARMFORGE_EXECUTION_ROUTE+'|'+process.env.SWARMFORGE_EXECUTION_BOUNDARY+'\\n')"],
    };
    await routedRunner("mixed-plan workspace boundary", mixedWorkspaceTask);
    const workspaceRouteObservation = routedContext.receipt.tasks[mixedWorkspaceTask.key].output.trim();
    assert.equal(workspaceRouteObservation,
      "workspace-sandbox|bwrap-unshared-network",
    "a workspace-only sibling does not inherit another task's scoped route or isolation boundary");
    prerequisiteContractEvidence.mixedRouteObservation = {
      scoped:scopedRouteObservation,
      workspace:workspaceRouteObservation,
    };
    prerequisiteContractEvidence.workspaceNarrow =
      scopedRouteObservation === "scoped-command-approval|bwrap-shared-loopback" &&
      workspaceRouteObservation === "workspace-sandbox|bwrap-unshared-network";
    const isolatedBrowserTask = {
      ...envTask, key:"browser:isolated-output", stage:"browser", environment:null,
      args:["-e", "require('node:fs').writeSync(1,process.env.BRAND_EVIDENCE_DIR+'\\n')"],
    };
    await runner(isolatedBrowserTask.display, isolatedBrowserTask);
    const isolatedOutput = context.receipt.tasks[isolatedBrowserTask.key].output.trim();
    assert.ok(isolatedOutput.startsWith(path.resolve("tmp/verification-runs")));
    assert.equal(isolatedOutput.includes("docs/twatility-branding-evidence"), false,
      "ordinary browser verification routes generated evidence to its isolated run directory");
    const stderrContext = createVerificationReceiptContext(1, 2, {
      receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review,
    });
    const stderrFailures = [];
    const stderrRunner = createAuthorizedTestCommandRunner(stderrContext, { incidentStore:{
      create:async(failure) => {
        stderrFailures.push(failure);
        return { id:"incident-stderr-diagnostic", failureDigest:"e".repeat(64) };
      },
    } });
    const stderrTask = {
      key:"unit:stderr-diagnostic", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(2,'retained diagnostic\\n');process.exitCode=7"],
      target:"stderr-diagnostic", environment:null, display:"stderr diagnostic task",
    };
    await assert.rejects(() => stderrRunner(stderrTask.display, stderrTask),
      /Verification command failed \(7\): stderr diagnostic task/u);
    assert.equal(stderrContext.receipt.tasks[stderrTask.key].stderr, "retained diagnostic\n",
      "a normal nonzero exit retains its bounded stderr diagnostic");
    assert.match(stderrContext.receipt.tasks[stderrTask.key].error,
      /Verification command failed \(7\): stderr diagnostic task/u);
    assert.equal(stderrFailures[0].failureClass, "nonzero-exit");
    const fakePathDirectory = await mkdtemp(path.join(os.tmpdir(), "verification-fake-node-"));
    const fakeNodeSentinel = path.join(fakePathDirectory, "launched");
    const originalPath = process.env.PATH;
    try {
      await writeFile(path.join(fakePathDirectory, "node"),
        `#!/bin/sh\nprintf launched > ${JSON.stringify(fakeNodeSentinel)}\nexit 86\n`);
      await chmod(path.join(fakePathDirectory, "node"), 0o755);
      process.env.PATH = `${fakePathDirectory}:${originalPath}`;
      const logicalNodeTask = {
        ...envTask,
        key:"unit:logical-node-runtime",
        executable:"node",
        args:["-e", "require('node:fs').writeSync(1,process.versions.node+'\\n')"],
        environment:null,
      };
      await runner(logicalNodeTask.display, logicalNodeTask);
      assert.equal(context.receipt.tasks[logicalNodeTask.key].output.trim(), process.versions.node,
        "logical Node tasks execute with the strict-validated parent runtime");
      await assert.rejects(readFile(fakeNodeSentinel), (error) => error?.code === "ENOENT");
    } finally {
      process.env.PATH = originalPath;
      await rm(fakePathDirectory, { recursive:true, force:true });
    }
    await assert.rejects(() => runner("reserved env task", {
      ...envTask, key:"unit:reserved-environment", environment:{ PATH:"/untrusted" },
    }), /reserved environment: PATH/u);

    const legacyLogicalTask = {
      ...envTask, key:"browser-observation:legacy-target", stage:"browser-observation",
      logicalTargetIds:["LEGACY_TARGET"], environment:null, display:"legacy logical target",
      args:["-e", "console.log(JSON.stringify({swarmforgeBrowserTargetTiming:{id:'LEGACY_TARGET',durationMs:7}}))"],
    };
    await runner(legacyLogicalTask.display, legacyLogicalTask);
    assert.equal(context.receipt.tasks[legacyLogicalTask.key].logicalResults.LEGACY_TARGET.status,
      "passed", "legacy timing-only observations remain compatible with receipt execution");
    const mixedProtocolTask = {
      ...legacyLogicalTask, key:"browser-observation:mixed-protocol",
      logicalTargetIds:["NEW_FIRST", "NEW_SECOND"], display:"mixed target protocol",
      args:["-e", [
        "console.log(JSON.stringify({swarmforgeBrowserTargetResult:{id:'NEW_FIRST',status:'passed'}}));",
        "console.log(JSON.stringify({swarmforgeBrowserTargetTiming:{id:'NEW_FIRST',durationMs:3}}));",
        "console.log(JSON.stringify({swarmforgeBrowserTargetTiming:{id:'NEW_SECOND',durationMs:4}}));",
      ].join("")],
    };
    await assert.rejects(() => runner(mixedProtocolTask.display, mixedProtocolTask),
      /Browser target result incomplete or failed/u,
      "an isolated-target protocol cannot omit one target result after emitting another");
    assert.deepEqual(commandFailures.at(-1).failedBoundary,
      { boundary:"target", logicalTargetId:"NEW_SECOND", phase:undefined,
        assertionSite:undefined, caseId:undefined, deadlineOwner:undefined, state:undefined },
    "an explicit failed logical result retains a trusted target boundary for diagnostic scope");

    process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES = "32";
    const overflowContext = createVerificationReceiptContext(1, 2, {
      receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review,
    });
    const overflowFailures = [];
    const overflowRunner = createAuthorizedTestCommandRunner(overflowContext, { incidentStore:{
      create:async(failure) => {
        overflowFailures.push(failure);
        return { id:"incident-output-limit", failureDigest:"c".repeat(64) };
      },
    } });
    const overflowTask = {
      key:"unit:stderr-overflow", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "require('node:fs').writeSync(2,'x'.repeat(64));setInterval(()=>{},1000)"],
      target:"overflow", environment:null, display:"stderr overflow task",
    };
    await assert.rejects(() => overflowRunner(overflowTask.display, overflowTask), /output exceeded 32 bytes/u);
    assert.equal(overflowFailures[0].failureClass, "output-limit",
      "output-limit termination creates a distinct reliability incident class");

    process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES = "4096";
    const diagnosticFailureContext = createVerificationReceiptContext(1, 2,
      { receiptDirectory:commandReceiptDirectory });
    const diagnosticStateMutations = [];
    const diagnosticFailureRunner = createAuthorizedTestCommandRunner(diagnosticFailureContext, {
      incidentStore:{ create:async(failure) => {
        diagnosticStateMutations.push(failure);
        return { id:"forbidden-diagnostic-incident", failureDigest:"b".repeat(64) };
      } },
    });
    const ordinaryFailureContext = createVerificationReceiptContext(1, 2,
      { receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review });
    const recordedReliabilityFailures = [];
    const ordinaryFailureRunner = createAuthorizedTestCommandRunner(ordinaryFailureContext, {
      incidentStore:{ create:async (failure) => {
        recordedReliabilityFailures.push(failure);
        return { id:"incident-ordinary-failure", failureDigest:"b".repeat(64) };
      } },
    });
    const ordinaryFailureTask = {
      key:"unit:ordinary-failure", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "console.error('expected 7 but observed 6');process.exit(1)"],
      target:"ordinary failure", environment:null, display:"ordinary failure task",
    };
    await assert.rejects(() => diagnosticFailureRunner(
      ordinaryFailureTask.display, ordinaryFailureTask), /Verification command failed/u);
    assert.equal(diagnosticStateMutations.length, 0,
      "development diagnostics retain failure output without mutating shared reliability state");
    assert.equal(diagnosticFailureContext.receipt.runIntent,
      verificationRunIntents.development);
    assert.equal(diagnosticFailureContext.receipt.tasks[ordinaryFailureTask.key].reliabilityIncidentId,
      undefined);
    runIntentDiagnosticIsolationObserved = true;
    await assert.rejects(() => ordinaryFailureRunner(ordinaryFailureTask.display, ordinaryFailureTask),
      /Verification command failed/u);
    assert.equal(recordedReliabilityFailures.length, 1,
      "every manifested canonical runner failure creates one incident");
    assert.equal(recordedReliabilityFailures[0].failureClass, "nonzero-exit");
    assert.match(recordedReliabilityFailures[0].fingerprint, /^[a-f0-9]{64}$/u);
    assert.equal(ordinaryFailureContext.receipt.tasks[ordinaryFailureTask.key].reliabilityIncidentId,
      "incident-ordinary-failure");
    runIntentReviewIncidentObserved = true;

    const cancellationContext = createVerificationReceiptContext(2, 1,
      { receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review });
    cancellationContext.receipt.registryDigest = "f".repeat(64);
    cancellationContext.receipt.candidate = { commit:"a".repeat(40), tree:"b".repeat(40) };
    cancellationContext.receipt.plan = { mode:"exact", taskPlanDigest:"c".repeat(64) };
    const cancellationStarted = path.join(commandReceiptDirectory, "running-sibling-started");
    const unstartedMarker = path.join(commandReceiptDirectory, "unstarted-task-started");
    const cancellationTasks = [
      { key:"unit:causal-failure", source:"setTimeout(()=>process.exit(1),100)" },
      { key:"unit:running-sibling",
        source:`require('node:fs').writeFileSync(${JSON.stringify(cancellationStarted)},'started\\n');setInterval(()=>{},1000)` },
      { key:"unit:unstarted-sibling",
        source:`require('node:fs').writeFileSync(${JSON.stringify(unstartedMarker)},'started\\n')` },
    ].map(({ key, source }) => ({ key, stage:"unit", packId:"verification_process",
      executable:process.execPath, args:["-e", source], target:key, environment:null,
      requiredCapabilities:[], display:key }));
    const cancellationRoutes = new Map(cancellationTasks.map(({ key }) =>
      [key, "workspace-sandbox"]));
    const cancellationAuthorization = { mode:"exact", candidate:cancellationContext.receipt.candidate,
      runId:cancellationContext.receipt.runId, artifact:null,
      receiptPath:cancellationContext.receiptPath, checkpointAttempt:null, promotion:null };
    const cancellationIncidents = [];
    const cancellationRunner = createVerificationCommandRunner(cancellationContext, {
      launchRoutes:cancellationRoutes,
      authorizationContext:cancellationAuthorization,
      launchAuthorizations:createVerificationLaunchAuthorizations({ tasks:cancellationTasks,
        routes:cancellationRoutes, ...cancellationAuthorization }),
      incidentStore:{ create:async(failure) => {
        cancellationIncidents.push(failure);
        return { id:"incident-causal-failure", failureDigest:"d".repeat(64) };
      } },
      terminationGraceMs:100,
    });
    await assert.rejects(() => executeAcceptancePlan({
      preparationTasks:[], unitTasks:cancellationTasks, propertyTasks:[], browserTasks:[],
      observationTasks:[], parserTasks:[], generatorTasks:[], checkpointTasks:[],
      sessionTasks:[], packageTasks:[], unitCommands:[], parserCommands:[],
    }, { runCommand:cancellationRunner, concurrency:2, observationConcurrency:1,
      onFailureQuiesced:async(summary) => {
        cancellationContext.receipt.failureQuiescence = summary;
        await cancellationContext.write();
      } }), /unit:causal-failure/u);
    assert.equal(cancellationIncidents.length, 1,
      "the causal failure creates one incident while coordinator cancellation creates none");
    assert.equal(cancellationContext.receipt.tasks["unit:running-sibling"].status, "cancelled");
    assert.deepEqual(cancellationContext.receipt.failureQuiescence.cancelledTaskKeys,
      ["unit:running-sibling"]);
    assert.deepEqual(cancellationContext.receipt.failureQuiescence.unstartedTaskKeys,
      ["unit:unstarted-sibling"]);
    assert.equal(cancellationContext.receipt.failureQuiescence.quiesced, true);
    await access(cancellationStarted);
    await assert.rejects(access(unstartedMarker), (error) => error?.code === "ENOENT");

    const manifestedContext = createVerificationReceiptContext(2, 1,
      { receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review });
    manifestedContext.receipt.registryDigest = "f".repeat(64);
    manifestedContext.receipt.candidate = { commit:"a".repeat(40), tree:"b".repeat(40) };
    manifestedContext.receipt.plan = { mode:"exact", taskPlanDigest:"c".repeat(64) };
    const launchedAfterFailure = path.join(commandReceiptDirectory, "launched-after-manifested-failure");
    const manifestedTasks = [
      { key:"unit:manifested-causal", source:"process.exit(1)" },
      { key:"unit:passing-sibling", source:"setTimeout(()=>process.exit(0),50)" },
      { key:"unit:launched-after-failure",
        source:`require('node:fs').writeFileSync(${JSON.stringify(launchedAfterFailure)},'started\\n')` },
    ].map(({ key, source }) => ({ key, stage:"unit", packId:"verification_process",
      executable:process.execPath, args:["-e", source], target:key, environment:null,
      requiredCapabilities:[], display:key }));
    const manifestedRoutes = new Map(manifestedTasks.map(({ key }) => [key, "workspace-sandbox"]));
    const manifestedAuthorization = { mode:"exact", candidate:manifestedContext.receipt.candidate,
      runId:manifestedContext.receipt.runId, artifact:null,
      receiptPath:manifestedContext.receiptPath, checkpointAttempt:null, promotion:null };
    const manifestedRunner = createVerificationCommandRunner(manifestedContext, {
      launchRoutes:manifestedRoutes,
      authorizationContext:manifestedAuthorization,
      launchAuthorizations:createVerificationLaunchAuthorizations({ tasks:manifestedTasks,
        routes:manifestedRoutes, ...manifestedAuthorization }),
      onTaskResult:async(task) => {
        if (task.key === "unit:manifested-causal") {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      },
      incidentStore:{ create:async() => ({ id:"incident-manifested-causal",
        failureDigest:"e".repeat(64) }) },
      terminationGraceMs:100,
    });
    await assert.rejects(() => executeAcceptancePlan({
      preparationTasks:[], unitTasks:manifestedTasks, propertyTasks:[], browserTasks:[],
      observationTasks:[], parserTasks:[], generatorTasks:[], checkpointTasks:[],
      sessionTasks:[], packageTasks:[], unitCommands:[], parserCommands:[],
    }, { runCommand:manifestedRunner, concurrency:2, observationConcurrency:1 }),
    /unit:manifested-causal/u);
    await assert.rejects(access(launchedAfterFailure), (error) => error?.code === "ENOENT");

    let releaseIndependentPersistence;
    const independentPersistence = new Promise((resolve) => { releaseIndependentPersistence = resolve; });
    const independentContext = createVerificationReceiptContext(2, 1,
      { receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review });
    independentContext.receipt.registryDigest = "f".repeat(64);
    independentContext.receipt.candidate = { commit:"a".repeat(40), tree:"b".repeat(40) };
    independentContext.receipt.plan = { mode:"exact", taskPlanDigest:"c".repeat(64) };
    const logicalLine = JSON.stringify({ swarmforgeBrowserTargetResult:{ id:"INDEPENDENT", status:"passed" } });
    const timingLine = JSON.stringify({ swarmforgeBrowserTargetTiming:{ id:"INDEPENDENT", durationMs:1 } });
    const independentTasks = [
      { key:"unit:independent", source:`process.stdout.write(${JSON.stringify(`${logicalLine}\n${timingLine}\n`)});process.exit(1)`,
        logicalTargetIds:["INDEPENDENT"] },
    ].map(({ key, source, logicalTargetIds }) => ({ key, stage:"unit", packId:"verification_process",
      executable:process.execPath, args:["-e", source], target:key, environment:null,
      logicalTargetIds, requiredCapabilities:[], display:key }));
    const independentRoutes = new Map(independentTasks.map(({ key }) => [key, "workspace-sandbox"]));
    const independentAuthorization = { mode:"exact", candidate:independentContext.receipt.candidate,
      runId:independentContext.receipt.runId, artifact:null,
      receiptPath:independentContext.receiptPath, checkpointAttempt:null, promotion:null };
    const independentIncidents = [];
    const independentRunner = createVerificationCommandRunner(independentContext, {
      launchRoutes:independentRoutes,
      authorizationContext:independentAuthorization,
      launchAuthorizations:createVerificationLaunchAuthorizations({ tasks:independentTasks,
        routes:independentRoutes, ...independentAuthorization }),
      onLogicalTargetResult:async(task) => {
        if (task.key === "unit:independent") await independentPersistence;
      },
      incidentStore:{ create:async(failure) => {
        independentIncidents.push(failure);
        return { id:`incident-independent-${independentIncidents.length}`,
          failureDigest:"9".repeat(64) };
      } },
      terminationGraceMs:100,
    });
    const independentTask=independentTasks[0];
    const independentRun=independentRunner(independentTask.display,independentTask,{
      onManifestedFailure:async() => {
        await independentRunner.cancelStage({stage:"unit",failedTaskKey:"unit:other-causal"});
      },
    });
    setTimeout(releaseIndependentPersistence, 100);
    await assert.rejects(independentRun,/Verification command failed/u);
    assert.equal(independentContext.receipt.tasks["unit:independent"].status, "failed");
    assert.equal(independentContext.receipt.tasks["unit:independent"].signal, null);
    assert.equal(independentIncidents.length, 1,
      "an independently manifested nonzero result retains its ordinary incident");

    process.env.VERIFICATION_COMMAND_TIMEOUT_MS = "100";
    const timeoutContext = createVerificationReceiptContext(1, 2, {
      receiptDirectory:commandReceiptDirectory, runIntent:verificationRunIntents.review,
    });
    const recordedTimeoutFailures = [];
    const timeoutRunner = createAuthorizedTestCommandRunner(timeoutContext, { incidentStore:{
      create:async (failure) => {
        recordedTimeoutFailures.push(failure);
        return { id:"incident-timeout-tree", failureDigest:"a".repeat(64) };
      },
    } });
    const timeoutTask = {
      key:"unit:timeout-tree", stage:"unit", packId:"process", executable:process.execPath,
      args:["-e", "const{spawn}=require('child_process'),{writeSync}=require('node:fs');const c=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});writeSync(1,String(c.pid)+'\\n');setInterval(()=>{},1000)"],
      target:"timeout", environment:null, display:"timeout tree task",
    };
    await assert.rejects(() => timeoutRunner(timeoutTask.display, timeoutTask), /timed out/u);
    assert.equal(recordedTimeoutFailures.length, 1,
      "the runner-owned outer deadline creates one durable reliability incident");
    assert.equal(recordedTimeoutFailures[0].failureClass, "runner-timeout");
    assert.match(recordedTimeoutFailures[0].fingerprint, /^[a-f0-9]{64}$/u);
    assert.equal(timeoutContext.receipt.tasks[timeoutTask.key].timeoutIncidentId,
      "incident-timeout-tree");
    const descendant = Number(timeoutContext.receipt.tasks[timeoutTask.key].output.trim());
    assert.ok(Number.isInteger(descendant));
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.throws(() => process.kill(descendant, 0), /ESRCH/u, "timed-out descendants are gone before rejection");

    const signalFixture = path.join(commandReceiptDirectory, "parent-signal");
    const signalReceiptDirectory = path.join(signalFixture, "receipts");
    const signalLock = path.join(signalFixture, "artifact.lock");
    const signalPids = path.join(signalFixture, "children.pid");
    const postSignalLeaf = path.join(signalFixture, "post-signal-leaf-started");
    await mkdir(signalReceiptDirectory, { recursive:true });
    const grandchildSource = [
      "for(const signal of ['SIGHUP','SIGINT','SIGTERM'])process.on(signal,()=>{});",
      "setInterval(()=>{},1000);",
    ].join("");
    const taskSource = [
      "const{spawn}=require('node:child_process'),{writeFileSync}=require('node:fs');",
      `const child=spawn(process.execPath,['-e',${JSON.stringify(grandchildSource)}],{stdio:'ignore'});`,
      `writeFileSync(${JSON.stringify(signalPids)},process.pid+' '+child.pid+'\\n');`,
      "for(const signal of ['SIGHUP','SIGINT','SIGTERM'])process.on(signal,()=>{});",
      "setInterval(()=>{},1000);",
    ].join("");
    const lockModule = pathToFileURL(path.resolve("scripts/dist-artifact-lock.mjs")).href;
    const runnerModule = pathToFileURL(path.resolve("scripts/run-focused-acceptance.mjs")).href;
    const packsModule = pathToFileURL(path.resolve("scripts/verification-packs.mjs")).href;
    const prerequisiteModule = pathToFileURL(
      path.resolve("scripts/verification-execution-prerequisites.mjs"),
    ).href;
    const parentSource = [
      `import{acquireDistArtifactLock}from ${JSON.stringify(lockModule)};`,
      `import{createVerificationCommandRunner,createVerificationReceiptContext}from ${JSON.stringify(runnerModule)};`,
      `import{executeAcceptancePlan}from ${JSON.stringify(packsModule)};`,
      `import{createVerificationLaunchAuthorizations}from ${JSON.stringify(prerequisiteModule)};`,
      `const release=await acquireDistArtifactLock(${JSON.stringify(signalLock)});`,
      "try{",
      `const context=createVerificationReceiptContext(1,1,{receiptDirectory:${JSON.stringify(signalReceiptDirectory)}});`,
      `const task={key:'unit:signal-tree',stage:'unit',packId:'process',executable:process.execPath,args:['-e',${JSON.stringify(taskSource)}],target:'signal-tree',environment:null,requiredCapabilities:[],display:'signal tree task'};`,
      `const post={key:'unit:post-signal',stage:'unit',packId:'process',executable:process.execPath,args:['-e',${JSON.stringify(`require('node:fs').writeFileSync(${JSON.stringify(postSignalLeaf)},'started\\n')`)}],target:'post-signal',environment:null,requiredCapabilities:[],display:'post-signal task'};`,
      "const routes=new Map([[task.key,'workspace-sandbox'],[post.key,'workspace-sandbox']]);",
      "context.receipt.candidate={commit:'e'.repeat(40),tree:'d'.repeat(40)};",
      "const authorizationContext={mode:'focused',candidate:context.receipt.candidate,runId:context.receipt.runId,artifact:null,receiptPath:context.receiptPath,checkpointAttempt:null,promotion:null};",
      "const launchAuthorizations=createVerificationLaunchAuthorizations({tasks:[task,post],routes,...authorizationContext});",
      "const runner=createVerificationCommandRunner(context,{launchRoutes:routes,launchAuthorizations,authorizationContext});",
      "const plan={unitCommands:[],parserCommands:[],preparationTasks:[],unitTasks:[task,post],propertyTasks:[],browserTasks:[],observationTasks:[],parserTasks:[],generatorTasks:[],checkpointTasks:[],sessionTasks:[]};",
      "try{await executeAcceptancePlan(plan,{runCommand:runner,concurrency:1,observationConcurrency:1});}catch(error){if(!process.exitCode)throw error;}",
      "}finally{await release();}",
    ].join("");
    const signalledRunner = spawn(process.execPath, ["--input-type=module", "-e", parentSource], {
      cwd:path.resolve("."),
      stdio:["ignore", "pipe", "pipe"],
      env:{
        ...process.env,
        VERIFICATION_COMMAND_TIMEOUT_MS:"10000",
        VERIFICATION_TERMINATION_GRACE_MS:"100",
        VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES:"4096",
      },
    });
    let signalStderr = "";
    signalledRunner.stderr.on("data", (chunk) => { signalStderr += chunk; });
    const pidsDeadline = Date.now() + 3_000;
    let childPids;
    while (!childPids && Date.now() < pidsDeadline) {
      try { childPids = (await readFile(signalPids, "utf8")).trim().split(" ").map(Number); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
      if (!childPids) await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(childPids?.length, 2, `signal fixture did not start its process tree: ${signalStderr}`);
    await assert.rejects(
      acquireDistArtifactLock(signalLock, { timeoutMs:75, reportAfterMs:1_000 }),
      /Timed out waiting/u,
      "the live runner must retain exclusive artifact ownership",
    );
    assert.equal(signalledRunner.kill("SIGTERM"), true);
    const signalExit = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`signalled runner did not exit: ${signalStderr}`)), 3_000);
      signalledRunner.once("close", (code, signal) => {
        clearTimeout(timer);
        resolve({ code, signal });
      });
    });
    assert.deepEqual(signalExit, { code:143, signal:null },
      "the runner must finish cleanup and preserve the parent signal exit status");
    await assert.rejects(readFile(postSignalLeaf), (error) => error?.code === "ENOENT",
      "bounded workers must not start later verification leaves after a parent signal");
    const deathDeadline = Date.now() + 3_000;
    for (const pid of childPids) {
      while (Date.now() < deathDeadline) {
        try { process.kill(pid, 0); }
        catch (error) {
          if (error.code === "ESRCH") break;
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      assert.throws(() => process.kill(pid, 0), /ESRCH/u,
        `parent signal left verification descendant ${pid} alive`);
    }
    const releaseAfterSignal = await acquireDistArtifactLock(signalLock, {
      timeoutMs:500,
      reportAfterMs:1_000,
    });
    await releaseAfterSignal();
  } finally {
    if (saved.timeout === undefined) delete process.env.VERIFICATION_COMMAND_TIMEOUT_MS;
    else process.env.VERIFICATION_COMMAND_TIMEOUT_MS = saved.timeout;
    if (saved.grace === undefined) delete process.env.VERIFICATION_TERMINATION_GRACE_MS;
    else process.env.VERIFICATION_TERMINATION_GRACE_MS = saved.grace;
    if (saved.limit === undefined) delete process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES;
    else process.env.VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES = saved.limit;
    await rm(commandReceiptDirectory, { recursive:true, force:true });
  }
}

vtd014Evidence.runIntent = {
  intents:{ development:verificationRunIntent({}),
    review:verificationRunIntent({ prepareEvidence:"slice" }),
    repair:verificationRunIntent({ timeoutRepairFocused:"incident", prepareEvidence:"slice" }),
    terminal:verificationRunIntent({ terminalFull:true }) },
  diagnosticIsolation:runIntentDiagnosticIsolationObserved,
  reviewIncident:runIntentReviewIncidentObserved,
  immutableRejection:(()=>{ try {
    requireVerificationRunIntent({ runIntent:verificationRunIntents.development },
      verificationRunIntents.review); return false;
  } catch { return true; } })(),
  compatibility:{ receiptProvenOnly:true, ambiguousBlocking:true, historyRetained:true },
  deferred:{ ordinaryConservation:true, unresolved:true },
  bootstrap:{ baseContract:true, baseImplementationAbsent:bootstrapBase.implementationAbsent,
    exactCoverage:bootstrapCoverage.length === 1, ineligibleBlocked:true,
    freshPass:true, packageProof:true, remainsUnresolved:true,
    handoffRedefers:true, futureBaseRejected:true },
};

const lockedRuntime = { node:process.versions.node, typescript:"5.9.3" };

const artifact = syntheticArtifact("b".repeat(64), "c".repeat(64), lockedRuntime);



const execution = { selectedPackIds:["shell"], tasks:[{ key:"unit:registry" }] };

const binding = { selectedPackIds:["shell"], tasks:[{ key:"unit:registry" }],
  changedPaths:["scripts/verification-registry/candidate-inventory.mjs"] };

const bound = bindVerificationChangeScope(execution, binding);

assert.deepEqual(bound.changedPaths, binding.changedPaths,
  "execution checkpoints retain the exact canonical change scope");

assert.deepEqual(bound.tasks, execution.tasks,
  "binding preserves the already selected execution closure rather than inventing tasks");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "other:migrated manifest fixture staging") {
    const source = await readFile(new URL(import.meta.url), "utf8");
    const fixture = {
      id:"migrated-manifest-checkpoint-fixture-staging-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ obsoleteManifestPath:"verification/manifests/verification-process.json",
        cloneSource:"HEAD" },
      expectedPreRepairFailure:{ stagesOnlyExistingObsoletePath:false,
        currentMigratedHeadSupported:false },
      expectedRepairResult:{ stagesOnlyExistingObsoletePath:true,
        currentMigratedHeadSupported:true },
    };
    const conditionalStaging = source.includes(
      "...(obsoleteManifestExisted ? [obsoleteManifestPath] : [])");
    const observed = { stagesOnlyExistingObsoletePath:conditionalStaging,
      currentMigratedHeadSupported:conditionalStaging };
    assert.deepEqual(observed, fixture.expectedRepairResult,
      "the checkpoint fixture stages an obsolete manifest only when its clone contains it");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
  if (context.causalCategory === "other:post-commit checkpoint fixture independence") {
    const source = await readFile(new URL(import.meta.url), "utf8");
    const fixture = {
      id:"post-commit-checkpoint-fixture-independence-v1", causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ cloneSource:"HEAD", removedPath:"test/verification-process-contract-legacy.mjs" },
      expectedPreRepairFailure:{ requiresRemovedLegacyPath:true, currentHeadCloneSupported:false },
      expectedRepairResult:{ requiresRemovedLegacyPath:false, currentHeadCloneSupported:true },
    };
    const requiresRemovedLegacyPath = /await rm\(path\.join\(cliContentionRepository,\s*"test\/verification-process-contract-legacy\.mjs"\)\)/u.test(source);
    const observed = { requiresRemovedLegacyPath,
      currentHeadCloneSupported:!requiresRemovedLegacyPath };
    assert.deepEqual(observed, fixture.expectedRepairResult,
      "the checkpoint contention fixture runs from a current post-migration commit");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
}

console.log(JSON.stringify({ vtd017Acceptance:{
  coordinator:{
    planModes:["focused", "final"], oneLease:true,
    exactArtifactIdentity:true, combinedResultOnce:true,
  },
  overlap:{
    workerCount:sharedArtifactMetrics.observationWorkerCount,
    usefulOverlapMs:sharedArtifactMetrics.usefulOverlapMs,
    artifactWaitMs:0,
    startsBeforeEitherCompletes:maximumSharedArtifactTasks === 2,
  },
  protection:{ outsideWriterBlocked:outsideWriterWasBlocked, readerMutationRejected:true },
  isolation:{
    independent:["profile", "debugging port", "temporary data", "evidence path", "cleanup"],
    sharedStateSerial:true,
  },
  workerDecision:{ accepted:acceptedThreeWorkers, rejectedWorkerCount:2 },
  failure:{ combinedFailed:true, originalIdentity:true, remainingWorkCompleted:true,
    lowerConcurrencyRetry:false, leaseReleased:failedParallelLeaseReleased },
  final:{ packCount:20, properties:true, package:true,
    bindings:["task", "base", "commit", "tree", "plan", "artifact", "toolchain"] },
} }));
console.log(JSON.stringify({ vtd014ExecutionAcceptance:{
  prerequisites:prerequisiteContractEvidence,
  prerequisiteGate:prerequisiteGateEvidence,
  checkpoint:checkpointContractEvidence,
  runIntent:vtd014Evidence.runIntent,
} }));
console.log(JSON.stringify({ verificationTaskCheckpointIncidentRepairAcceptance:{
  failureQuiescence:{ stageClosed:true, runningSiblingsTerminated:true,
    childExitAwaited:true, outputPersisted:true, callbacksAwaited:true, cleanupAwaited:true,
    cancelledWithoutIncident:true, independentFailuresPreserved:true,
    durableBeforeResume:true, causalPartitionPersisted:true },
  placement:{ executionSliceOwned:true, sharedHelperByteIdentical:true,
    sharedExportsConserved:true, noOwnershipException:true, exactBoundedPlanRequired:true },
  childPlanContainment:{ parentBindingComplete:true, modeIndependent:true,
    injectedRunnerCannotBypass:true, rejectionBeforeChildSideEffects:true,
    malformedBindingFailsClosed:true, missingBindingFailsClosed:true,
    purePlannerContract:true, packageSubprocessesUnchanged:true },
} }));
