import { createExecutableTargetDefinitions } from "./side-panel-browser-target-contract.mjs";
import { fixturePrograms, observeRenderedSmoke, renderedSmokeTarget } from "./side-panel-event-library-fixtures.mjs";
const [directPushTarget] = createExecutableTargetDefinitions("event-library", fixturePrograms).map(
  ({ setup, observe, cleanup, ...contract }) => contract);
export const eventLibraryTargetContract = Object.freeze([
  renderedSmokeTarget, Object.freeze({ ...directPushTarget, processGroup:"event-library-side-panel" }),
]);
async function executeFixture({ context, fixturePrograms:programs, target }) {
  return context.executeFixture({ fixturePrograms:programs, target }); }
export { fixturePrograms };
export const definitions = Object.freeze([
  Object.freeze({
    ...renderedSmokeTarget,
    fixturePrograms,
    setup:async ({ context }) => { context.activeFixtureModule = "event-library"; }, observe:async ({ context }) => observeRenderedSmoke(context),
    cleanup:async ({ context }) => { context.activeFixtureModule = null; },
  }),
  ...createExecutableTargetDefinitions("event-library", fixturePrograms, { observe:executeFixture })
    .map((definition) => Object.freeze({ ...definition, processGroup:"event-library-side-panel" })),
]);
