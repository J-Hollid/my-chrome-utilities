import assert from "node:assert/strict";

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
// retired-schema-assertion: project-hydration-durable-recovery-001
// retired-schema-assertion: project-hydration-durable-recovery-005
// retired-schema-assertion: project-hydration-durable-recovery-010
// retired-schema-assertion: project-hydration-durable-recovery-014
// retired-schema-assertion: project-hydration-durable-recovery-018
assert.equal(
  reentered,
  first,
  "synchronous project notifications reuse the active hydration",
);
// retired-schema-assertion: project-hydration-durable-recovery-002
// retired-schema-assertion: project-hydration-durable-recovery-008
// retired-schema-assertion: project-hydration-durable-recovery-012
// retired-schema-assertion: project-hydration-durable-recovery-015
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
// retired-schema-assertion: project-hydration-durable-recovery-003
assert.notEqual(
  second,
  first,
  "a new active project supersedes the older hydration",
);
releaseFirst();
await first;
// retired-schema-assertion: project-hydration-durable-recovery-004
// retired-schema-assertion: project-hydration-durable-recovery-009
// retired-schema-assertion: project-hydration-durable-recovery-013
// retired-schema-assertion: project-hydration-durable-recovery-017
assert.equal(
  slot.run("project:second", () =>
    Promise.reject(new Error("superseding hydration was lost")),
  ),
  second,
  "an old settlement cannot clear the new hydration",
);
releaseSecond();
await second;
const settledThird = slot.run("project:third", () => Promise.resolve());
// retired-schema-assertion: project-hydration-durable-recovery-006
// retired-schema-assertion: project-hydration-durable-recovery-007
// retired-schema-assertion: project-hydration-durable-recovery-011
// retired-schema-assertion: project-hydration-durable-recovery-016
assert.deepEqual(await Promise.all([settledThird]), [undefined],
  "the direct hydration owner settles a new operation after it clears the old slot");
