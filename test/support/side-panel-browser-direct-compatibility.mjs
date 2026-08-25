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

export function validateDirectCompatibilityAssertionSites(assertionLeaves, assertionSource) {
  if (!Array.isArray(assertionLeaves) || !assertionLeaves.length || typeof assertionSource !== "string") {
    throw new Error("Direct compatibility assertion-site validation requires captured identities and source");
  }
  const lines = assertionSource.split(/\r?\n/u);
  for (const identity of assertionLeaves) {
    const match = /^(deepEqual|doesNotMatch|equal|fail|match|notDeepEqual|notEqual|ok)@(\d+):(\d+)$/u.exec(identity);
    const lineNumber = Number(match?.[2]);
    const columnNumber = Number(match?.[3]);
    const line = lines[lineNumber - 1] ?? "";
    const method = match?.[1] ?? "";
    const methodIndex = columnNumber - 1;
    if (!match || line.slice(methodIndex - 7, methodIndex) !== "assert." ||
        !line.slice(methodIndex).startsWith(`${method}(`)) {
      throw new Error(`Direct compatibility identity ${identity} does not resolve to a current assertion call`);
    }
  }
  return Object.freeze({ assertionLeafCount:assertionLeaves.length,
    uniqueAssertionSiteCount:new Set(assertionLeaves).size });
}

export function directCompatibilityCaptureExecution(execution, assertionSource) {
  if (!Array.isArray(execution?.assertionLeaves) || execution.assertionLeaves.length === 0) {
    throw new Error("Direct side-panel compatibility capture did not execute any assertions");
  }
  if (JSON.stringify(execution.viewportWidths) !== JSON.stringify(directCompatibilityViewportWidths)) {
    throw new Error("Direct side-panel compatibility capture did not execute the original viewports");
  }
  const sites = validateDirectCompatibilityAssertionSites(execution.assertionLeaves, assertionSource);
  return Object.freeze({ assertionLeafCount:sites.assertionLeafCount,
    assertionLeaves:Object.freeze([...execution.assertionLeaves]),
    uniqueAssertionSiteCount:sites.uniqueAssertionSiteCount,
    viewportWidths:Object.freeze([...execution.viewportWidths]) });
}

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
  capturePreparation = false,
  assertionSource,
} = {}) {
  const options = {
    fixturePrograms:directCompatibilityFixturePrograms,
    environment,
    emit,
    viewportWidths:directCompatibilityViewportWidths,
  };
  if (!capturePreparation) options.assertionLeaves = directCompatibilityAssertionLeaves;
  const installed = await runCompatibility(options);
  if (capturePreparation) {
    const capture = directCompatibilityCaptureExecution(installed, assertionSource);
    emit({ vtd006DirectCompatibilityCapture:capture });
    return capture;
  }
  const execution = directCompatibilityExecution(installed);
  emit({ vtd006DirectCompatibility:execution });
  return execution;
}
