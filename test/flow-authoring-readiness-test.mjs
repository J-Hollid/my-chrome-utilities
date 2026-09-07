import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {timeoutIncidentDigest} from "../scripts/verification-reliability-values.mjs";
import {acquireFlowKeyboardTarget, waitForFlowOutlineProjection} from
  "./support/flow-authoring-readiness.mjs";
import {flowWorkspaceR02Runtime} from "./support/flow-workspace-r02-runtime.mjs";

async function waitFor(observe, label, ready = value => Boolean(value)) {
  for (let index = 0; index < 50; index += 1) {
    const value = await observe();
    if (ready(value)) return value;
    await Promise.resolve();
  }
  throw new Error(`Not ready: ${label}`);
}

function connectionFixture({ targetIndex = 17, connected = true } = {}) {
  let active = false, selected = 0, committed, focused = false;
  const keys = [];
  return {
    options: {
      source: () => ({ focus() { focused = true; } }),
      target: () => ({ isConnected: connected,
        classList: { contains: () => active && selected === targetIndex } }),
      ports: () => Array.from({ length: 24 }),
      selected: () => active ? `port:${selected}` : undefined,
      preview: () => active,
      key(key) {
        keys.push(key);
        queueMicrotask(() => {
          if (key === "Enter" && !active) active = true;
          else if (key === "ArrowRight") selected = (selected + 1) % 24;
          else if (key === "Enter") committed = selected;
        });
      },
      waitFor,
    },
    result: () => ({ committed, focused, keys }),
  };
}

const lateTarget = connectionFixture();
const acquiredResult = await acquireFlowKeyboardTarget(lateTarget.options);
assert.deepEqual(acquiredResult, { preview: true, valid: true });
await Promise.resolve();
assert.equal(lateTarget.result().committed, 17,
  "The port cycle must include targets beyond the former Page-count limit");
assert.equal(lateTarget.result().focused, true);
const historical = execFileSync("git", ["show",
  "f43cb72497:test/support/flow-workspace-r02-runtime.mjs"], { encoding: "utf8", maxBuffer: 2_000_000 });
const historicalBranch = historical.match(/\}else\{(source=findSource\(\);target=findTarget\(\);.*?)\}const next=await waitFor/s)?.[1];
assert.ok(historicalBranch, "The pre-repair keyboard branch must remain available");
const oldTarget = connectionFixture();
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const oldResult = await new AsyncFunction("findSource", "findTarget", "flowNativeKey", "pause",
  "q", "canvas", "before", `let source,target,preview=false,valid=false;${historicalBranch};return {preview,valid};`)(
  oldTarget.options.source, oldTarget.options.target,
  encoded => oldTarget.options.key(JSON.parse(encoded).key), async () => Promise.resolve(),
  () => oldTarget.options.preview(), {}, { pageFrames: Array.from({ length: 8 }) });
await Promise.resolve();
assert.equal(oldResult.valid, false);
assert.equal(oldTarget.result().committed, 10,
  "The actual historical helper commits the wrong target after its incomplete search");
const absentTarget = connectionFixture({ targetIndex: 30 });
await assert.rejects(acquireFlowKeyboardTarget(absentTarget.options), /not acquired/);
assert.equal(absentTarget.result().committed, undefined);
const detachedTarget = connectionFixture({ connected: false });
await assert.rejects(acquireFlowKeyboardTarget(detachedTarget.options), /not acquired/);
assert.equal(detachedTarget.result().committed, undefined);

const oldCanvas = { isConnected: false, textContent: "Basket Source" };
const oldOutline = { isConnected: false, textContent: "Basket Source" };
const canvas = { isConnected: true, textContent: "Basket Source" };
const outline = { isConnected: true, textContent: "Basket Source" };
const projections = [
  { canvas: oldCanvas, outline: oldOutline, surfaceOpen: true },
  { canvas, outline: { ...outline, textContent: "Basket" }, surfaceOpen: true },
  { canvas, outline, surfaceOpen: true, saving: true },
  { canvas, outline, surfaceOpen: true, saving: false },
];
let observations = 0;
const projection = await waitForFlowOutlineProjection({
  observe: () => projections[Math.min(observations++, projections.length - 1)],
  expectedNames: ["Basket", "Source"], waitFor,
});
assert.equal(observations, 4);
assert.equal(projection.canvas, canvas);
assert.equal(projection.outline, outline);
await assert.rejects(waitForFlowOutlineProjection({
  observe: () => ({ canvas, outline, surfaceOpen: false }), waitFor,
}), /Not ready/);
await assert.rejects(waitForFlowOutlineProjection({
  observe: () => ({ canvas, outline, surfaceOpen: true }),
  expectedNames: ["Missing source"], waitFor,
}), /Not ready/);

// Compile the exact generated browser program, including the extracted workflow.
const program = flowWorkspaceR02Runtime({ projectId: "project", flowId: "flow" });
new Function(`return ${program}`);
if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const before = { targetAcquired: oldResult.valid, committedPort: oldTarget.result().committed,
    outlineConnected: oldOutline.isConnected };
  const after = { targetAcquired: acquiredResult.valid, committedPort: lateTarget.result().committed,
    outlineConnected: projection.outline.isConnected };
  const fixture = { id: "flow-live-authoring-targets", causalCategory: context.causalCategory,
    diagnosedBoundaryDigest: timeoutIncidentDigest(context.diagnosedBoundary),
    expectedPreRepairFailure: { targetAcquired: false, committedPort: 10, outlineConnected: false },
    expectedRepairResult: { targetAcquired: true, committedPort: 17, outlineConnected: true } };
  const fixtureDigest = timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression: { version: 2,
    incidentId: context.incidentId, failureDigest: context.failureDigest, fixture,
    preRepairResult: { status: "failed", fixtureDigest, observed: before },
    repairResult: { status: "passed", fixtureDigest, observed: after } } }));
}
console.log("Flow authoring readiness: late ports, detached nodes, current names, saving, and generated program passed");
