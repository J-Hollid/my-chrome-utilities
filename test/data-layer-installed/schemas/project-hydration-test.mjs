import assert from "node:assert/strict";
import { runRetiredSchemaControllerScenario } from "../../support/schema-library-fake-dom.mjs";

const { createProjectHydrationSlot } = await import(
  "../../../dist/data-layer-installed/schemas/project-hydration.js"
);

const slot = createProjectHydrationSlot();
let releaseFirst;
let releaseSecond;
let reentered;
const first = slot.run("project:first", () => {
  reentered = slot.run("project:first", () =>
    Promise.reject(new Error("reentrant hydration started")),
  );
  return new Promise((resolve) => {
    releaseFirst = resolve;
  });
});
assert.equal(
  reentered,
  first,
  "synchronous project notifications reuse the active hydration",
);
assert.equal(
  slot.run("project:first", () =>
    Promise.reject(new Error("duplicate hydration started")),
  ),
  first,
  "one project reuses its active contributor hydration",
);
const second = slot.run(
  "project:second",
  () =>
    new Promise((resolve) => {
      releaseSecond = resolve;
    }),
);
assert.notEqual(
  second,
  first,
  "a new active project supersedes the older hydration",
);
releaseFirst();
await first;
assert.equal(
  slot.run("project:second", () =>
    Promise.reject(new Error("superseding hydration was lost")),
  ),
  second,
  "an old settlement cannot clear the new hydration",
);
releaseSecond();
await second;
// RETIRED_SCHEMA_ASSERTIONS_START:project-hydration-durable-recovery
const retiredSchemaAssertions = {
  "project-hydration-durable-recovery-001": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-002": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-003": (...args) => assert.notEqual(...args),
  "project-hydration-durable-recovery-004": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-005": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-006": (...args) => assert.deepEqual(...args),
  "project-hydration-durable-recovery-007": (...args) => assert.deepEqual(...args),
  "project-hydration-durable-recovery-008": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-009": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-010": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-011": (...args) => assert.deepEqual(...args),
  "project-hydration-durable-recovery-012": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-013": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-014": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-015": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-016": (...args) => assert.deepEqual(...args),
  "project-hydration-durable-recovery-017": (...args) => assert.equal(...args),
  "project-hydration-durable-recovery-018": (...args) => assert.equal(...args),
};
await runRetiredSchemaControllerScenario(retiredSchemaAssertions);
// RETIRED_SCHEMA_ASSERTIONS_END:project-hydration-durable-recovery
