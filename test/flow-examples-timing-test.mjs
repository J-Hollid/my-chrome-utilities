import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  boundedFlowExamplesReadiness,
  createFlowExamplesPhaseTimer,
  flowExamplesPhaseNames,
  validateFlowExamplesPhaseTiming,
} from "./support/flow-examples-timing.mjs";
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

assert.throws(() => validateFlowExamplesPhaseTiming({
  durationMs:10,
  phases:timing.phases.map((phase) => phase.name === "cleanup"
    ? { ...phase, durationMs:phase.durationMs + 2 } : phase),
}), /cover target duration/u);

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

const characterization = JSON.parse(await readFile(
  new URL("../verification/flow-examples-characterization.json", import.meta.url), "utf8",
));
assert.match(characterization.implementationCommit, /^[a-f0-9]{40}$/u);
assert.equal(characterization.completion.status, "complete");
assert.equal(characterization.focusedBudgetMilliseconds, 12_891);
assert.equal(characterization.representativeFlowChangedPathGuardrailSeconds, 35);
for (const timingClass of Object.values(characterization.classes)) {
  assert.equal(timingClass.sampleCount, 5);
  assert.equal(timingClass.receiptDigests.length, 5);
  assert.equal(new Set(timingClass.receiptDigests).size, 5);
  assert.equal(timingClass.maturity.status, "non-provisional");
  assert.deepEqual(Object.keys(timingClass.phases), flowExamplesPhaseNames);
}
assert.ok(characterization.classes.focusedNormal.target.p90Ms <=
  characterization.focusedBudgetMilliseconds);

console.log("Flow examples phase timing tests passed");
