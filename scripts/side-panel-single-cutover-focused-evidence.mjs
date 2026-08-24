import { expandVerificationTaskPrerequisites } from
  "./verification-execution-prerequisites.mjs";

export const sidePanelSingleCutoverEvidenceTask =
  "verification-slice-side-panel-single-cutover";

export const sidePanelSingleCutoverPackIds = Object.freeze([
  "capture",
  "defects",
  "durable_project_repository",
  "event-library",
  "flow_graph",
  "guided_test_cases",
  "layered_schema",
  "live_flow_testing",
  "project_assurance_severity",
  "project_event_transport",
  "project_management",
  "replay",
  "schemas",
  "shell",
]);

const controllerIds = [
  "capture",
  "defects",
  "durable-projects",
  "event-library",
  "live-flow-testing",
  "project-event-transport",
  "projects",
  "replay",
  "schemas",
];

const consumerIds = [
  "capture",
  "defects",
  "durable-project-repository",
  "event-library",
  "flow-graph",
  "guided-test-cases",
  "layered-schema",
  "live-flow-testing",
  "project-assurance-severity",
  "project-event-transport",
  "project-management",
  "replay",
  "schemas",
];

export const sidePanelSingleCutoverFocusedTaskKeys = Object.freeze([
  ...controllerIds.map((id) => `unit:test/data-layer-installed/${id}-controller-test.mjs`),
  ...consumerIds.map((id) =>
    `unit:test/data-layer-installed/consumers/${id}-consumer-test.mjs`),
  "unit:test/data-layer-event-library-editor-test.mjs",
  "unit:test/modular-utility-architecture-test.mjs",
  "unit:test/side-panel-single-cutover-preparation-test.mjs",
  "unit:test/verification-pack-cardinality-contract-test.mjs",
  "package:extension",
]);

const sameSet = (left, right) => JSON.stringify([...new Set(left)].sort()) ===
  JSON.stringify([...new Set(right)].sort());

export function isSidePanelSingleCutoverEvidenceTask(task) {
  return task === sidePanelSingleCutoverEvidenceTask;
}

export function validateSidePanelSingleCutoverFocusedPlan(plan, evidenceTask) {
  if (!isSidePanelSingleCutoverEvidenceTask(evidenceTask)) return false;
  const packIds = plan.packIds ?? plan.claimPackIds ?? plan.requestedPackIds;
  const tasksByKey = new Map(plan.tasks.map((task) => [task.key, task]));
  const requested = sidePanelSingleCutoverFocusedTaskKeys.map((key) => tasksByKey.get(key));
  const exactKeys = requested.every(Boolean)
    ? expandVerificationTaskPrerequisites(requested, plan.tasks,
      { mode:"ordinary-focused" }).map(({ key }) => key)
    : [];
  if (plan.mode !== "focused-task" || plan.includeProperties !== false ||
      !sameSet(plan.requestedPackIds, sidePanelSingleCutoverPackIds) ||
      !sameSet(packIds, sidePanelSingleCutoverPackIds) ||
      plan.focusedTaskKeys !== undefined &&
        !sameSet(plan.focusedTaskKeys, sidePanelSingleCutoverFocusedTaskKeys) ||
      !sameSet(plan.tasks.map(({ key }) => key), exactKeys)) {
    throw new Error("Side-panel single-cutover evidence must use its exact preparation bootstrap");
  }
  return true;
}
