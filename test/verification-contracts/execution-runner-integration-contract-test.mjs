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
const repositoryRoot = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const expectedChromeTemporaryDirectory = (runId) => path.join("/tmp", "sf-chrome",
  createHash("sha256").update(repositoryRoot).digest("hex").slice(0, 24),
  createHash("sha256").update(runId).digest("hex").slice(0, 24));
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
const deniedPrerequisite = preflightExecutionPrerequisites(prerequisiteTasks, {
  availableCapabilities:[], approvalRoutes:{ "local-loopback":"denied" },
});
const authorizationContext = {
  mode:"repair-focused", candidate:{ commit:"candidate", tree:"tree" }, runId:"run-1",
  artifact:{ inputDigest:"artifact" }, receiptPath:"tmp/receipt.json",
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
let vtd014Evidence = {};
let runIntentDiagnosticIsolationObserved = false;
let runIntentReviewIncidentObserved = false;
const packs = await loadVerificationPacks();
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
      expectedChromeTemporaryDirectory(context.receipt.runId),
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
      expectedChromeTemporaryDirectory(context.receipt.runId),
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
