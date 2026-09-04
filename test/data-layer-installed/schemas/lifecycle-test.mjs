import assert from "node:assert/strict";

const { createSchemaLifecycle } = await import(
  "../../../dist/data-layer-installed/schemas/lifecycle.js"
);

const lifecycle = createSchemaLifecycle();
const target = new EventTarget();
let actions = 0;
const act = () => { actions += 1; };
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-001
assert.equal(lifecycle.mount(), true);
const firstGeneration = lifecycle.generation();
lifecycle.listen(target, "change", act);
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-003
assert.equal(lifecycle.mount(), false, "a repeated mount is an idempotent no-op");
target.dispatchEvent(new Event("change"));
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-006
assert.equal(actions, 1, "one input runs one owned action");
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-007
assert.equal(lifecycle.dispose(), true);
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-009
assert.equal(lifecycle.isCurrent(firstGeneration), false);
target.dispatchEvent(new Event("change"));
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-002
assert.equal(actions, 1, "dispose removes the owned listener");
assert.equal(lifecycle.dispose(), false, "a repeated dispose is an idempotent no-op");
assert.equal(lifecycle.mount(), true);
lifecycle.listen(target, "change", act);
target.dispatchEvent(new Event("change"));
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-008
assert.equal(actions, 2, "a new generation owns one fresh listener set");
lifecycle.dispose();
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-004
assert.notEqual(firstGeneration, lifecycle.generation(),
  "a remount changes the direct lifecycle generation");
// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-005
assert.match(String(lifecycle.generation()), /^\d+$/,
  "the direct lifecycle exposes a numeric generation");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-022
assert.deepEqual([lifecycle.isCurrent(firstGeneration), actions], [false, 2],
  "the direct lifecycle rejects stale work and retains only owned actions");
