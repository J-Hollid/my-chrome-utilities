import { createHash } from "node:crypto";

import {
  directCompatibilityAssertionLeaves,
  directCompatibilityViewportWidths,
} from "./side-panel-browser-direct-assertion-map.mjs";
import { runInstalledSidePanelCompatibility } from "./side-panel-browser-session.mjs";
import { fixturePrograms as captureFixtures } from "./side-panel-capture-fixtures.mjs";
import { fixturePrograms as defectFixtures } from "./side-panel-defect-fixtures.mjs";
import { fixturePrograms as eventLibraryFixtures } from "./side-panel-event-library-fixtures.mjs";
import { fixturePrograms as documentationFixtures } from "./side-panel-schema-documentation-targets.mjs";
import { fixturePrograms as guidedFixtures } from "./side-panel-schema-guided-targets.mjs";
import { fixturePrograms as validationFixtures } from "./side-panel-schema-validation-targets.mjs";
import { fixturePrograms as workspaceFixtures } from "./side-panel-schema-workspace-targets.mjs";
import { fixturePrograms as shellFixtures } from "./side-panel-shell-targets.mjs";

export const directCompatibilityFixturePrograms = Object.freeze(Object.assign({},
  captureFixtures, eventLibraryFixtures, workspaceFixtures, guidedFixtures,
  validationFixtures, documentationFixtures, defectFixtures, shellFixtures));

const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function directCompatibilityExecution(execution) {
  if (!Array.isArray(execution?.assertionLeaves) || execution.assertionLeaves.length === 0) {
    throw new Error("Direct side-panel compatibility did not execute any no-target assertions");
  }
  if (JSON.stringify(execution.assertionLeaves) !==
      JSON.stringify(directCompatibilityAssertionLeaves)) {
    throw new Error("Direct side-panel compatibility did not execute the exact no-target assertion map");
  }
  if (JSON.stringify(execution.viewportWidths) !==
      JSON.stringify(directCompatibilityViewportWidths)) {
    throw new Error("Direct side-panel compatibility did not execute the exact no-target viewports");
  }
  return Object.freeze({
    assertionLeafCount:execution.assertionLeaves.length,
    assertionMapDigest:digest(execution.assertionLeaves),
    assertionMapExact:true,
    viewportWidths:[...execution.viewportWidths],
  });
}

export async function runDirectSidePanelCompatibility({
  environment = process.env,
  runCompatibility = runInstalledSidePanelCompatibility,
  emit = (record) => console.log(JSON.stringify(record)),
} = {}) {
  const installed = await runCompatibility({
    fixturePrograms:directCompatibilityFixturePrograms,
    environment,
    emit,
    assertionLeaves:directCompatibilityAssertionLeaves,
    viewportWidths:directCompatibilityViewportWidths,
  });
  const execution = directCompatibilityExecution(installed);
  emit({ vtd006DirectCompatibility:execution });
  return execution;
}
