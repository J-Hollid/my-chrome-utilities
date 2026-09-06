import assert from "node:assert/strict";

export const projectDialogPaths = new Set([
  "test/project-library-dialogs/lifecycle-test.mjs",
  "test/project-library-dialogs/structure-test.mjs",
  "test/project-library-dialogs/registration-test.mjs",
  "features/project-library-dialog-decomposition.feature",
  "acceptance/src/acceptance/steps/project_library_dialogs.clj",
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
  ["project_library_dialogs_boundary", "application controller", true]];
export const projectDialogHandlers = [
  "acceptance/src/acceptance/steps/project_library_dialogs.clj",
  "acceptance/src/acceptance/steps/project_management.clj",
];
export function assertProjectDialogRegistry(pack) {
  assert.deepEqual(boundaryRows(pack), currentProjectBoundaries);
  assert.deepEqual(pack.isolatedVerificationHandlers, projectDialogHandlers);
  assertProjectDialogAdditions(pack);
}
export function assertProjectDialogAdditions(pack) {
  const paths = [...pack.unit,...pack.features,...pack.handlers];
  for (const path of projectDialogPaths) assert.equal(paths.filter(value=>value===path).length,1,path);
}
