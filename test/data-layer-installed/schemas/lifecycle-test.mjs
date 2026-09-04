import assert from "node:assert/strict";
import { runRetiredSchemaControllerScenario } from "./fixtures/retired-controller-scenario.mjs";

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
// RETIRED_SCHEMA_ASSERTIONS_START:canonical-stale-work-lifecycle-disposal
const retiredSchemaAssertions = {
  "canonical-stale-work-lifecycle-disposal-001": (...args) => assert.equal(...args),
  "canonical-stale-work-lifecycle-disposal-002": (...args) => assert.equal(...args),
  "canonical-stale-work-lifecycle-disposal-003": (...args) => assert.equal(...args),
  "canonical-stale-work-lifecycle-disposal-004": (...args) => assert.notEqual(...args),
  "canonical-stale-work-lifecycle-disposal-005": (...args) => assert.match(...args),
  "canonical-stale-work-lifecycle-disposal-006": (...args) => assert.equal(...args),
  "canonical-stale-work-lifecycle-disposal-007": (...args) => assert.equal(...args),
  "canonical-stale-work-lifecycle-disposal-008": (...args) => assert.equal(...args),
  "canonical-stale-work-lifecycle-disposal-009": (...args) => assert.equal(...args),
  "canonical-stale-work-lifecycle-disposal-010": (...args) => assert.deepEqual(...args),
};
await runRetiredSchemaControllerScenario(retiredSchemaAssertions);
// RETIRED_SCHEMA_ASSERTIONS_END:canonical-stale-work-lifecycle-disposal
