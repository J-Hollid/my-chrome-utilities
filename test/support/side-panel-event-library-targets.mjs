import { createExecutableTargetDefinitions } from "./side-panel-browser-target-contract.mjs";
import { observeRenderedSmoke, renderedSmokeTarget } from "../browser-packs/side-panel-event-library.mjs";
import { sharedHarnessReadinessState } from "../browser-packs/shared-harness.mjs";
import { fixturePrograms } from "./side-panel-event-library-fixtures.mjs";
const [directPushTarget] = createExecutableTargetDefinitions("event-library", fixturePrograms).map(({ setup, observe, cleanup, ...contract }) => contract);
export const eventLibraryTargetContract = Object.freeze([
  renderedSmokeTarget, Object.freeze({ ...directPushTarget, processGroup:"event-library-side-panel" }),
]);
async function executeFixture({ context, fixturePrograms:programs, target }) {
  return context.executeFixture({ fixturePrograms:programs, target }); } export { fixturePrograms };
export const definitions = Object.freeze([
  Object.freeze({
    ...renderedSmokeTarget,
    fixturePrograms,
    setup:async ({ context }) => { context.activeFixtureModule = "event-library"; }, observe:async ({ context }) => observeRenderedSmoke(context, sharedHarnessReadinessState),
    cleanup:async ({ context }) => { context.activeFixtureModule = null; },
  }),
  ...createExecutableTargetDefinitions("event-library", fixturePrograms, { observe:executeFixture })
    .map((definition) => Object.freeze({ ...definition, processGroup:"event-library-side-panel" })),
]);
