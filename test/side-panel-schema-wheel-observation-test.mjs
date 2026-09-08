import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {timeoutIncidentDigest} from "../scripts/verification-reliability-values.mjs";
import {observeSchemaEditorWheel} from "./support/side-panel-schema-wheel-observation.mjs";

function fixture(offsetAt = time => time >= 120 ? 520 : 0) {
  let time = 0, inputs = 0;
  const options = {
    read: async () => ({offset: offsetAt(time), finalVisible: false}),
    dispatch: async () => { inputs += 1; },
    now: () => time,
    sleep: async milliseconds => { time += milliseconds; },
  };
  return {options, inputs: () => inputs, time: () => time};
}

const historical = execFileSync("git", ["show",
  "72074819:test/browser-packs/side-panel-schema-editor-reachability.mjs"],
{encoding: "utf8", maxBuffer: 200_000});
const oldWheelProgram = historical.match(/await socket\(\).call\("Input.dispatchMouseEvent", \{[\s\S]*?const wheelAfter = await evaluate\(socket\(\), returnExpression\(scrollState\)\);/)?.[0];
assert.ok(oldWheelProgram, "The actual pre-repair wheel observation must remain available");
const oldFixture = fixture();
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const oldWheel = await new AsyncFunction("socket", "before", "wait", "evaluate",
  "scrollState", "returnExpression", `${oldWheelProgram}; return wheelAfter;`)(
  () => ({call: oldFixture.options.dispatch}), {point: {x: 20, y: 40}},
  oldFixture.options.sleep, oldFixture.options.read, "scroll-state", value => value);
assert.equal(oldWheel.offset, 0, "The old 80 ms sample misses the delayed native movement");
assert.equal(oldFixture.inputs(), 1);

const delayed = fixture();
const measured = await observeSchemaEditorWheel(delayed.options);
assert.equal(measured.before.offset, 0);
assert.equal(measured.after.offset, 520);
assert.equal(delayed.inputs(), 1, "Observation must not retry the input");
assert.ok(delayed.time() >= 170);
const animation = fixture(time => time < 120 ? 0 : time < 175 ? 160 : time < 250 ? 350 : 520);
assert.equal((await observeSchemaEditorWheel(animation.options)).after.offset, 520,
  "Reset must wait for settled movement, not the first partial animation sample");
assert.ok(animation.time() >= 300);
const blocked = fixture(() => 0);
await assert.rejects(observeSchemaEditorWheel(blocked.options), /timed out.*native wheel movement/);
assert.equal(blocked.inputs(), 1);
const backwards = fixture(time => time === 0 ? 100 : 50);
await assert.rejects(observeSchemaEditorWheel(backwards.options), /timed out/);

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const specification = {id: "schema-editor-delayed-native-wheel",
    causalCategory: context.causalCategory,
    diagnosedBoundaryDigest: timeoutIncidentDigest(context.diagnosedBoundary),
    input: {nativeWheelDelayMs: 120, wheelDelta: 520, formerSampleMs: 80},
    expectedPreRepairFailure: {offset: 0, inputs: 1},
    expectedRepairResult: {offset: 520, inputs: 1}};
  const fixtureDigest = timeoutIncidentDigest(specification);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression: {version: 2,
    incidentId: context.incidentId, failureDigest: context.failureDigest, fixture: specification,
    preRepairResult: {status: "failed", fixtureDigest,
      observed: {offset: oldWheel.offset, inputs: oldFixture.inputs()}},
    repairResult: {status: "passed", fixtureDigest,
      observed: {offset: measured.after.offset, inputs: delayed.inputs()}}}}));
}
console.log("Schema wheel observation: historical miss, delayed input, settled motion, and no-motion rejection passed");
