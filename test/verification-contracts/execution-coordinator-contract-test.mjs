import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { acquireDistArtifactLock, distArtifactLeaseEnvironment, withDistArtifactLock } from "../../scripts/dist-artifact-lock.mjs";
import { decideBrowserObservationWorkers, deterministicBrowserWorkerSchedule } from "../../scripts/shared-artifact-parallel.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification } from "../../scripts/verification-planner/tasks/planner.mjs";
import { executeAcceptancePlan } from "../../scripts/verification-execution/execute.mjs";
import { emitPreparedEvidence } from "../../scripts/verification-evidence/prepared-acceptance-evidence.mjs";
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
emitPreparedEvidence("vtd017LockLifecycleAcceptance", {
  protection:{ outsideWriterBlocked:outsideWriterWasBlocked },
  failure:{ leaseReleased:failedParallelLeaseReleased },
}, { protection:{ outsideWriterBlocked:{ requirement:"true" } },
  failure:{ leaseReleased:{ requirement:"true" } } });
