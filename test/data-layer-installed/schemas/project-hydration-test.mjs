import assert from "node:assert/strict";

const { createProjectHydrationSlot, SchemaProjectHydrationCoordinator } = await import(
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
const settledThird = slot.run("project:third", () => Promise.resolve());

assert.deepEqual(await Promise.all([settledThird]), [undefined],
  "the direct hydration owner settles a new operation after it clears the old slot");

const hydrationResult = { textContent:"" };
const hydration = new SchemaProjectHydrationCoordinator({
  activeProjectId:() => "project:one", generation:() => 1, isMounted:() => true,
  ensure:async() => ({ name:"Project One" }), invalidate() {}, render() {}, result:hydrationResult,
});
await hydration.hydrate("project:one");

assert.equal(hydrationResult.textContent,"Loaded schema contributors for Project One.");
