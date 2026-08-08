import {
  createExecutableTargetDefinitions,
  sidePanelTargetContract,
} from "./side-panel-browser-target-contract.mjs";
import { runInstalledSidePanelSession } from "./side-panel-browser-session.mjs";
import { fixturePrograms as captureFixtures } from "./side-panel-capture-fixtures.mjs";
import { fixturePrograms as defectFixtures } from "./side-panel-defect-fixtures.mjs";
import { fixturePrograms as eventLibraryFixtures } from "./side-panel-event-library-fixtures.mjs";
import {
  definitions as documentationDefinitions,
  fixturePrograms as documentationFixtures,
} from "./side-panel-schema-documentation-targets.mjs";
import {
  definitions as guidedDefinitions,
  fixturePrograms as guidedFixtures,
} from "./side-panel-schema-guided-targets.mjs";
import {
  definitions as validationDefinitions,
  fixturePrograms as validationFixtures,
} from "./side-panel-schema-validation-targets.mjs";
import {
  definitions as workspaceDefinitions,
  fixturePrograms as workspaceFixtures,
} from "./side-panel-schema-workspace-targets.mjs";
import {
  definitions as shellDefinitions,
  fixturePrograms as shellFixtures,
} from "./side-panel-shell-targets.mjs";

const executeFixture = ({ context, fixturePrograms, target }) =>
  context.executeFixture({ fixturePrograms, target });

const definitionsByModule = [
  ...createExecutableTargetDefinitions("capture", captureFixtures, { observe:executeFixture }),
  ...createExecutableTargetDefinitions("event-library", eventLibraryFixtures, { observe:executeFixture }),
  ...workspaceDefinitions,
  ...guidedDefinitions,
  ...validationDefinitions,
  ...documentationDefinitions,
  ...createExecutableTargetDefinitions("defects", defectFixtures, { observe:executeFixture }),
  ...shellDefinitions,
];
const definitionsById = new Map(definitionsByModule.map((definition) => [definition.id, definition]));
const directDefinitions = Object.freeze(sidePanelTargetContract.map(({ id }) => definitionsById.get(id)));

const directTargetIds = directDefinitions.map(({ id }) => id);
const contractTargetIds = sidePanelTargetContract.map(({ id }) => id);
if (JSON.stringify(directTargetIds) !== JSON.stringify(contractTargetIds)) {
  throw new Error("Direct side-panel compatibility definitions do not conserve canonical target order");
}

export const directCompatibilityDefinitions = directDefinitions;
export const directCompatibilityFixturePrograms = Object.freeze(Object.assign({},
  captureFixtures, eventLibraryFixtures, workspaceFixtures, guidedFixtures,
  validationFixtures, documentationFixtures, defectFixtures, shellFixtures));

export function directCompatibilityExecution(executions) {
  if (!Array.isArray(executions) || executions.length === 0) {
    throw new Error("Direct side-panel compatibility did not execute any definitions");
  }
  const viewportCounts = {};
  for (const { viewport } of executions) {
    const key = viewport.join(",");
    viewportCounts[key] = (viewportCounts[key] ?? 0) + 1;
  }
  const targetIds = executions.map(({ id }) => id);
  return {
    targetCount:executions.length,
    outputCount:executions.reduce((count, target) => count + target.observationKeys.length, 0),
    assertionLeafCount:executions.reduce((count, target) => count + target.assertionLeafCount, 0),
    deferredAssertionCount:executions.reduce((count, target) => count + target.deferredAssertionCount, 0),
    targetIds,
    targetIdsExact:JSON.stringify(targetIds) === JSON.stringify(contractTargetIds),
    expectedObservations:executions.every(({ observationKeys, observedKeys }) =>
      JSON.stringify([...observedKeys].sort()) === JSON.stringify([...observationKeys].sort())),
    viewportCounts,
  };
}

export async function runDirectSidePanelCompatibility({
  environment = process.env,
  runSession = runInstalledSidePanelSession,
  emit = (record) => console.log(JSON.stringify(record)),
} = {}) {
  const session = await runSession({
    definitions:directCompatibilityDefinitions,
    fixturePrograms:directCompatibilityFixturePrograms,
    environment,
    emit,
  });
  const execution = directCompatibilityExecution(session?.executions);
  emit({ vtd006DirectCompatibility:execution });
  return execution;
}
