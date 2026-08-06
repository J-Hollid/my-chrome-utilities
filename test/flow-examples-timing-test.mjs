import assert from "node:assert/strict";

import {
  boundedFlowExamplesReadiness,
  createFlowExamplesPhaseTimer,
  validateFlowExamplesPhaseTiming,
} from "./support/flow-examples-timing.mjs";

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

assert.throws(() => validateFlowExamplesPhaseTiming({
  durationMs:10,
  phases:timing.phases.map((phase) => phase.name === "cleanup"
    ? { ...phase, durationMs:phase.durationMs + 2 } : phase),
}), /cover target duration/u);

console.log("Flow examples phase timing tests passed");
