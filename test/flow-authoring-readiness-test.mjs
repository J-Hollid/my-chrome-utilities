import assert from "node:assert/strict";
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
assert.deepEqual(await acquireFlowKeyboardTarget(lateTarget.options), { preview: true, valid: true });
await Promise.resolve();
assert.equal(lateTarget.result().committed, 17,
  "The port cycle must include targets beyond the former Page-count limit");
assert.equal(lateTarget.result().focused, true);
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
console.log("Flow authoring readiness: late ports, detached nodes, current names, saving, and generated program passed");
