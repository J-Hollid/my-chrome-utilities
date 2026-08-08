import { createExecutableTargetDefinitions } from "./side-panel-browser-target-contract.mjs";
import { fixturePrograms } from "./side-panel-capture-fixtures.mjs";

async function executeFixture({ context, fixturePrograms:programs, target }) {
  return context.executeFixture({ fixturePrograms:programs, target });
}

export { fixturePrograms };
export const definitions = createExecutableTargetDefinitions("capture", fixturePrograms, {
  observe:executeFixture,
});
