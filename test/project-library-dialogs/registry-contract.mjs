import assert from "node:assert/strict";

export const projectDialogPaths = new Set([
  "test/project-library-dialogs/lifecycle-test.mjs",
  "test/project-library-dialogs/structure-test.mjs",
  "test/project-library-dialogs/registration-test.mjs",
  "features/project-library-dialog-decomposition.feature",
  "acceptance/src/acceptance/steps/project_library_dialogs.clj",
  "test/configuration-portability-project-library-transport-test.mjs",
  "test/configuration-portability-ownership-preparation-contract-test.mjs",
  "features/configuration-portability-ownership-preparation.feature",
  "acceptance/src/acceptance/steps/configuration_portability_ownership_preparation.clj",
]);
export const priorProjectBoundaries = [
  ["project_entity_lifecycle_semantic", "core or semantic", true],
  ["project_page_authoring_controller", "application controller", true],
  ["project_assignment_routing_semantic", "core or semantic", true],
  ["project_assignment_routing_presentation", "browser presentation", false],
  ["project_flow_visual_asset_portability", "persistence migration", true],
  ["project_library_persistence", "persistence migration", true],
  ["project_library_controller", "application controller", true],
  ["project_library_presentation", "browser presentation", false],
  ["project_library_installed_side_panel_boundary", "application controller", false],
];
export const boundaryRows = pack => pack.impactBoundaries.map(({id,sourceClass,propagateDependants})=>[id,sourceClass,propagateDependants]);
export const currentProjectBoundaries = [...priorProjectBoundaries,
  ["project_library_dialogs_boundary", "application controller", true],
  ["configuration_portability_transport_boundary", "persistence migration", false]];
export const projectDialogHandlers = [
  "acceptance/src/acceptance/steps/project_library_dialogs.clj",
  "acceptance/src/acceptance/steps/project_management.clj",
  "acceptance/src/acceptance/steps/configuration_portability_ownership_preparation.clj",
];
export function assertProjectDialogRegistry(pack) {
  assert.deepEqual(boundaryRows(pack), currentProjectBoundaries);
  assert.deepEqual(pack.isolatedVerificationHandlers, projectDialogHandlers);
  assertProjectDialogAdditions(pack);
}
export function assertProjectDialogAdditions(pack) {
  const paths = [...pack.unit,...pack.features,...pack.plannedFeatures,...pack.handlers];
  for (const path of projectDialogPaths) assert.equal(paths.filter(value=>value===path).length,1,path);
}

export async function projectDialogHandlerCoverage(pack, primaryFeatures) {
  const {readFile} = await import("node:fs/promises");
  const sources = await Promise.all(projectDialogHandlers
    .filter(path=>!path.endsWith("project_management.clj"))
    .map(path=>readFile(path,"utf8")));
  const features = sources.flatMap(source=>[...source.matchAll(/"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)]
    .map(match=>match[1]));
  assert.deepEqual(features,[
    "features/project-library-dialog-decomposition.feature",
    "features/configuration-portability-ownership-preparation.feature",
  ]);
  const served=[...primaryFeatures,...features.filter(feature=>pack.features.includes(feature))];
  assert.deepEqual([...served].sort(),[...pack.features].sort());
  return served;
}
