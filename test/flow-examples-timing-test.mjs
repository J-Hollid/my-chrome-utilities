import assert from "node:assert/strict";

import {
  boundedFlowExamplesReadiness,
  createFlowExamplesPhaseTimer,
  validateFlowExamplesPhaseTiming,
} from "./support/flow-examples-timing.mjs";
import {
  browserReadinessProgramSource,
  browserProgram,
  createBrowserPhaseTimer,
  observeBrowserReadiness,
  withBrowserDeadline,
} from "./support/browser-observation-control.mjs";
import {
  flowGraphEventExampleIncompleteEvidence,
  flowGraphEventExampleStateEvidence,
  flowGraphPageExampleIncompleteEvidence,
  flowGraphPageExampleStateEvidence,
} from "./support/flow-graph-corrective-workflow.mjs";

let timestamp = 0;
const timer = createFlowExamplesPhaseTimer({
  browserStartupMs:37,
  now:() => timestamp,
});
timestamp = 4;
timer.transition("fixture setup");
timestamp = 11;
timer.transition("readiness");
timestamp = 19;
timer.transition("example compilation");
timestamp = 23;
timer.transition("rendering");
timestamp = 31;
timer.transition("persistence");
timestamp = 36;
timer.transition("assertion");
timestamp = 44;
timer.transition("cleanup");
timestamp = 47;
const timing = timer.finish();
assert.deepEqual(timing.phases.map(({ name, scope }) => [name, scope]), [
  ["browser startup", "process"],
  ["target setup", "target"],
  ["fixture setup", "target"],
  ["readiness", "target"],
  ["example compilation", "target"],
  ["rendering", "target"],
  ["persistence", "target"],
  ["assertion", "target"],
  ["cleanup", "target"],
]);
assert.equal(timing.durationMs, 47);
assert.equal(timing.phases.filter(({ scope }) => scope === "target")
  .reduce((sum, { durationMs }) => sum + durationMs, 0), timing.durationMs);
assert.deepEqual(validateFlowExamplesPhaseTiming(timing), timing);

let readinessClock = 0;
const states = [{ ready:false, status:"loading" }, { ready:false, status:"mounting" },
  { ready:true, status:"ready" }];
const ready = await boundedFlowExamplesReadiness({
  targetId:"FLOW_GRAPH_EXAMPLES_TARGET",
  phase:"readiness",
  predicate:"project tree mounted",
  timeoutMs:100,
  now:() => readinessClock,
  sleep:async(milliseconds) => { readinessClock += milliseconds; },
  observe:async() => states.shift(),
  intervalMs:10,
});
assert.equal(ready.status, "ready");

readinessClock = 0;
await assert.rejects(() => boundedFlowExamplesReadiness({
  targetId:"FLOW_GRAPH_EXAMPLES_TARGET",
  phase:"rendering",
  predicate:"example row rendered",
  timeoutMs:20,
  now:() => readinessClock,
  sleep:async(milliseconds) => { readinessClock += milliseconds; },
  observe:async() => ({ ready:false, status:"still-loading", oversized:"x".repeat(1000) }),
  intervalMs:10,
  maximumSnapshotCharacters:80,
}), /FLOW_GRAPH_EXAMPLES_TARGET.*rendering.*example row rendered.*20ms.*still-loading/su);

readinessClock = 0;
await assert.rejects(() => boundedFlowExamplesReadiness({
  targetId:"FLOW_GRAPH_EXAMPLES_TARGET",
  phase:"readiness",
  predicate:"snapshot available",
  timeoutMs:10,
  now:() => readinessClock,
  sleep:async(milliseconds) => { readinessClock += milliseconds; },
  observe:async() => undefined,
  intervalMs:10,
}), /last state undefined/u,
"a missing diagnostic snapshot must not mask the bounded-readiness timeout");

assert.throws(() => validateFlowExamplesPhaseTiming({
  durationMs:10,
  phases:timing.phases.map((phase) => phase.name === "cleanup"
    ? { ...phase, durationMs:phase.durationMs + 2 } : phase),
}), /cover target duration/u);

readinessClock = 0;
const stableStates = [true, false, true, true, true].map((ready, index) => ({ ready, index }));
const stable = await observeBrowserReadiness({
  targetId:"TARGET-READY", phase:"navigation", predicateDescription:"workspace mounted",
  timeoutMs:100, pollIntervalMs:25, stabilityMs:50, maximumSnapshotCharacters:80,
  now:() => readinessClock,
  sleep:async(milliseconds) => { readinessClock += milliseconds; },
  observe:async() => stableStates.shift(), ready:({ ready }) => ready,
  snapshot:(observation) => observation,
});
assert.equal(stable.index, 4, "a false observation resets elapsed stability");

readinessClock = 0;
const hostile = { ready:false, text:"x".repeat(200) };hostile.self=hostile;
await assert.rejects(() => observeBrowserReadiness({
  targetId:"TARGET-READY", phase:"navigation", predicateDescription:"workspace mounted",
  timeoutMs:60, pollIntervalMs:25, maximumSnapshotCharacters:80,
  now:() => readinessClock,
  sleep:async(milliseconds) => { readinessClock += milliseconds; },
  observe:async() => hostile, ready:({ ready }) => ready,
  snapshot:() => { throw new Error("snapshot exploded"); },
}), (error) => error.snapshot.length <= 80 && /60ms.*snapshot exploded/su.test(error.message));
readinessClock = 0;
await assert.rejects(() => observeBrowserReadiness({
  targetId:"TARGET-READY", phase:"navigation", predicateDescription:"workspace mounted",
  timeoutMs:0, pollIntervalMs:25, maximumSnapshotCharacters:40,
  now:() => readinessClock, sleep:async() => {}, observe:async() => false,
  ready:() => false, snapshot:() => { throw undefined; },
}), (error) => error.targetId === "TARGET-READY" && error.phase === "navigation" &&
  error.snapshot.length <= 40 && /snapshot failed: undefined/u.test(error.message));

let sharedTimestamp = 0;
const sharedTimer = createBrowserPhaseTimer({
  targetId:"TARGET", phaseNames:["navigation", "fixture", "assertion"],
  now:() => sharedTimestamp,
});
sharedTimestamp=3;sharedTimer.transition("fixture");
sharedTimestamp=5;sharedTimer.transition("navigation");
sharedTimestamp=9;sharedTimer.transition("assertion");
sharedTimestamp=12;
const sharedTiming=sharedTimer.finish();
assert.equal(sharedTiming.durationMs,12);
assert.deepEqual(sharedTiming.phases.map(({durationMs})=>durationMs),[7,2,3]);
assert.equal(browserProgram({targetId:"TARGET",phase:"fixture",source:"return true;",shape:"statements"}),
  "(async()=>{return true;})()");
assert.throws(() => browserProgram({targetId:"TARGET",phase:"fixture",source:"return (;",shape:"statements"}),
  /TARGET.*fixture.*syntax/u);
const inPageReadiness = browserReadinessProgramSource({
  targetId:"FLOW_WORKSPACE_AUTHORING_TARGET", phase:"interaction", timeoutMs:10000,
  pollIntervalMs:25, maximumSnapshotCharacters:400,
});
assert.match(inPageReadiness, /performance\.now\(\)/u);
assert.match(inPageReadiness, /FLOW_WORKSPACE_AUTHORING_TARGET/u);
assert.doesNotMatch(inPageReadiness, /attempt/u,
  "generated in-page readiness must use elapsed time rather than a fixed sample count");
for (const owner of ["Chrome debug-port startup", "DevTools protocol call",
  "logical target outer work", "Chrome termination", "profile cleanup"]) {
  await assert.rejects(() => withBrowserDeadline({
    owner, targetId:"TARGET-DEADLINE", limitMs:10, work:() => new Promise(() => {}),
    schedule:(callback) => { callback(); return 1; }, cancel:() => {},
  }), (error) => error.deadlineOwner === owner && error.message.includes(owner) &&
    !error.message.includes("readiness predicate"));
}

const exampleEvidenceSources = [
  flowGraphEventExampleIncompleteEvidence({ projectId:"project", flowId:"flow" },
    { occurrenceId:"occurrence" }),
  flowGraphEventExampleStateEvidence({}, { occurrenceId:"occurrence" }, "Invalid", "/quantity", "TYPE"),
  flowGraphPageExampleIncompleteEvidence({ projectId:"project", flowId:"flow" }, { frameId:"frame" }),
  flowGraphPageExampleStateEvidence({ frameId:"frame" }, "Invalid", "/typed_page", "TYPE"),
];
for (const source of exampleEvidenceSources) {
  assert.match(source, /FLOW_GRAPH_EXAMPLES_TARGET example compilation timed out/u);
  assert.match(source, /performance\.now\(\)/u);
  assert.doesNotMatch(source, /for\(let attempt=/u,
    "examples-only readiness must not use fixed-count polling");
  assert.doesNotMatch(source, /setTimeout\(resolve,120\)/u,
    "examples-only readiness must not use fixed-duration polling");
}

console.log("Flow examples phase timing tests passed");
