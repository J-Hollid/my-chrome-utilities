import assert from "node:assert/strict";

const { createSchemaLifecycle } = await import(
  "../../../dist/data-layer-installed/schemas/lifecycle.js"
);

const lifecycle = createSchemaLifecycle();
const target = new EventTarget();
let actions = 0;
const act = () => { actions += 1; };

assert.equal(lifecycle.mount(), true);
const firstGeneration = lifecycle.generation();
lifecycle.listen(target, "change", act);

assert.equal(lifecycle.mount(), false, "a repeated mount is an idempotent no-op");
target.dispatchEvent(new Event("change"));

assert.equal(actions, 1, "one input runs one owned action");

assert.equal(lifecycle.dispose(), true);

assert.equal(lifecycle.isCurrent(firstGeneration), false);
target.dispatchEvent(new Event("change"));

assert.equal(actions, 1, "dispose removes the owned listener");

assert.equal(lifecycle.dispose(), false, "a repeated dispose is an idempotent no-op");

assert.equal(lifecycle.mount(), true);
lifecycle.listen(target, "change", act);
target.dispatchEvent(new Event("change"));

assert.equal(actions, 2, "a new generation owns one fresh listener set");
lifecycle.dispose();

assert.notEqual(firstGeneration, lifecycle.generation(),
  "a remount changes the direct lifecycle generation");

assert.match(String(lifecycle.generation()), /^\d+$/,
  "the direct lifecycle exposes a numeric generation");

assert.deepEqual([lifecycle.isCurrent(firstGeneration), actions], [false, 2],
  "the direct lifecycle rejects stale work and retains only owned actions");
