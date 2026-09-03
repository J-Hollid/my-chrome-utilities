import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createVerificationCommandRunner, focusedAcceptanceOptions, runFocusedAcceptance } from "../../scripts/run-focused-acceptance.mjs";
import { classifyExecutionRestriction, consumeVerificationLaunchAuthorization, createVerificationLaunchAuthorizations, createVerificationParentExecutionContext, normalizeBrowserPrerequisiteTasks, preflightExecutionPrerequisites, probeExecutionPrerequisiteEnvironment, verificationPrerequisiteKindRegistry, verificationRunnerModeRegistry, validateTaskExecutionPrerequisites } from "../../scripts/verification-execution-prerequisites.mjs";
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});
const repositoryRoot = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const expectedChromeTemporaryDirectory = (runId) => path.join("/tmp", "sf-chrome",
  createHash("sha256").update(repositoryRoot).digest("hex").slice(0, 24),
  createHash("sha256").update(runId).digest("hex").slice(0, 24));
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
const syntheticArtifact = (inputDigest, outputDigest, toolchain) => {
  const schemaVersion = 1;
  const buildIdentity = createHash("sha256").update(`${JSON.stringify({
    schemaVersion, inputDigest, outputDigest, toolchain,
  })}\n`).digest("hex");
  return { schemaVersion, buildIdentity, inputDigest, outputDigest, toolchain };
};
const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);
const lockedRuntime = { node:process.versions.node, typescript:"5.9.3" };
const artifact = syntheticArtifact("b".repeat(64), "c".repeat(64), lockedRuntime);
