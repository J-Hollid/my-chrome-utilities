import { expandVerificationTaskPrerequisites } from
  "./verification-execution-prerequisites.mjs";
import { sidePanelTargetContract } from
  "../test/support/side-panel-browser-target-contract.mjs";

export const sidePanelSingleCutoverEvidenceTask =
  "verification-slice-side-panel-single-cutover";
export const sidePanelSingleCutoverProductEvidenceTask =
  "side-panel-single-cutover";
export const sidePanelSingleCutoverCompatibilityRepairEvidenceTask =
  "verification-slice-side-panel-single-cutover-compatibility-repair";

export const sidePanelSingleCutoverCompatibilityRepairPackIds = Object.freeze([
  "schemas",
  "shell",
]);

export const sidePanelSingleCutoverCompatibilityRepairFocusedTaskKeys = Object.freeze([
  "unit:test/side-panel-single-cutover-preparation-test.mjs",
  "checkpoint:schemas:side-panel-direct-compatibility-capture",
  "checkpoint:shell:side-panel-direct-compatibility-validation",
  "package:extension",
]);

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
  ...controllerIds
    .filter((id) => id !== "schemas")
    .map((id) => `unit:test/data-layer-installed/${id}-controller-test.mjs`),
  "unit:test/data-layer-installed/schemas-composition-test.mjs",
  "unit:test/data-layer-installed/schemas/project-hydration-test.mjs",
  ...consumerIds.map((id) =>
    `unit:test/data-layer-installed/consumers/${id}-consumer-test.mjs`),
  "unit:test/data-layer-event-library-editor-test.mjs",
  "unit:test/modular-utility-architecture-test.mjs",
  "unit:test/settled-final-verification-workflow-test.mjs",
  "unit:test/side-panel-single-cutover-preparation-test.mjs",
  "unit:test/verification-pack-cardinality-contract-test.mjs",
  "package:extension",
]);

const productContractTaskKeys = Object.freeze([
  ...controllerIds
    .filter((id) => id !== "schemas")
    .map((id) => `unit:test/data-layer-installed/${id}-controller-test.mjs`),
  "unit:test/data-layer-installed/schemas-composition-test.mjs",
  "unit:test/modular-utility-architecture-test.mjs",
  "unit:test/side-panel-single-cutover-preparation-test.mjs",
  "package:extension",
]);

const canonicalTargetIds = Object.freeze(sidePanelTargetContract.map(({ id }) => id));

function productTaskKeys(tasks) {
  const targetIds = new Set(canonicalTargetIds);
  const observations = tasks.filter(({ stage, logicalTargetIds = [] }) =>
    stage === "browser-observation" && logicalTargetIds.length &&
    logicalTargetIds.some((id) => targetIds.has(id)));
  const observed = observations.flatMap(({ logicalTargetIds }) =>
    logicalTargetIds.filter((id) => targetIds.has(id)));
  if (!sameSet(observed, canonicalTargetIds)) {
    throw new Error("Side-panel product evidence must bind every canonical installed target once");
  }
  const properties = tasks.filter(({ key, packId, stage }) =>
    stage === "property" && sidePanelSingleCutoverPackIds.includes(packId) &&
    key.startsWith("property:test/data-layer-"));
  return [...new Set([
    ...productContractTaskKeys,
    ...properties.map(({ key }) => key),
    ...observations.map(({ key }) => key),
  ])];
}

export function sidePanelSingleCutoverProductFocusedTaskKeys(tasks) {
  const byKey = new Map(tasks.map((task) => [task.key, task]));
  const keys = productTaskKeys(tasks);
  for (const key of keys) {
    if (key !== "package:extension" && !byKey.has(key)) {
      throw new Error(`Side-panel product evidence task is not registered: ${key}`);
    }
  }
  return Object.freeze(keys);
}

const sameSet = (left, right) => JSON.stringify([...new Set(left)].sort()) ===
  JSON.stringify([...new Set(right)].sort());

export function isSidePanelSingleCutoverEvidenceTask(task) {
  return task === sidePanelSingleCutoverEvidenceTask ||
    task === sidePanelSingleCutoverProductEvidenceTask ||
    task === sidePanelSingleCutoverCompatibilityRepairEvidenceTask;
}

export function sidePanelSingleCutoverEvidencePackIdsFor(task) {
  return task === sidePanelSingleCutoverCompatibilityRepairEvidenceTask
    ? sidePanelSingleCutoverCompatibilityRepairPackIds
    : sidePanelSingleCutoverPackIds;
}

export function sidePanelSingleCutoverEvidenceFocusedTaskKeysFor(task) {
  return task === sidePanelSingleCutoverCompatibilityRepairEvidenceTask
    ? sidePanelSingleCutoverCompatibilityRepairFocusedTaskKeys
    : sidePanelSingleCutoverFocusedTaskKeys;
}

function approvedProductChangedPath(file) {
  return file === "src/side-panel.ts" || file === "src/side-panel-bootstrap.ts" ||
    file === "src/utilities/data-layer/index.ts" ||
    file.startsWith("src/data-layer-installed/") ||
    file === "dist/side-panel.js" || file === "dist/side-panel-bootstrap.js" ||
    file === "dist/utilities/data-layer/index.js" ||
    file.startsWith("dist/data-layer-installed/") ||
    /^test\/data-layer-installed\/[^/]+-controller-test\.mjs$/u.test(file);
}

function approvedCompatibilityRepairChangedPath(file) {
  return [
    "acceptance/src/acceptance/steps/data_layer_observer.clj",
    "acceptance/src/acceptance/steps/data_layer_page_context.clj",
    "acceptance/src/acceptance/steps/data_layer_timeline.clj",
    "acceptance/src/acceptance/steps/hotkey_keymap.clj",
    "scripts/run-focused-acceptance.mjs",
    "scripts/side-panel-single-cutover-focused-evidence.mjs",
    "scripts/verification-evidence.mjs",
    "test/side-panel-direct-compatibility-capture-test.mjs",
    "test/acceptance/side-panel-browser-session-contract.mjs",
    "test/acceptance/data_layer_observer_steps_test.clj",
    "test/acceptance/data_layer_page_context_steps_test.clj",
    "test/acceptance/data_layer_timeline_steps_test.clj",
    "test/modular-utility-architecture-test.mjs",
    "test/side-panel-component-layout-runtime-test.mjs",
    "test/side-panel-single-cutover-preparation-test.mjs",
    "test/support/side-panel-browser-direct-assertion-map.mjs",
    "test/support/side-panel-browser-direct-compatibility.mjs",
    "test/support/side-panel-browser-fixture-primitives.mjs",
    "test/support/side-panel-browser-session.mjs",
    "test/support/side-panel-capture-fixtures.mjs",
    "test/support/side-panel-defect-fixtures.mjs",
    "test/support/side-panel-schema-fixture-primitives.mjs",
    "test/support/side-panel-schema-guided-lifecycle-fixtures.mjs",
    "test/support/side-panel-schema-guided-targets.mjs",
    "test/support/side-panel-schema-validation-targets.mjs",
    "test/fixtures/x11-accept-chrome-permission-prompt.c",
    "test/verification-process-contract-test.mjs",
    "verification/packs.json",
  ].includes(file);
}

export function validateSidePanelSingleCutoverFocusedPlan(plan, evidenceTask) {
  if (!isSidePanelSingleCutoverEvidenceTask(evidenceTask)) return false;
  const productEvidence = evidenceTask === sidePanelSingleCutoverProductEvidenceTask;
  const compatibilityRepair =
    evidenceTask === sidePanelSingleCutoverCompatibilityRepairEvidenceTask;
  const focusedTaskKeys = productEvidence
    ? sidePanelSingleCutoverProductFocusedTaskKeys(plan.tasks)
    : sidePanelSingleCutoverEvidenceFocusedTaskKeysFor(evidenceTask);
  const expectedPackIds = sidePanelSingleCutoverEvidencePackIdsFor(evidenceTask);
  const packIds = plan.packIds ?? plan.claimPackIds ?? plan.requestedPackIds;
  const tasksByKey = new Map(plan.tasks.map((task) => [task.key, task]));
  const requested = focusedTaskKeys.map((key) => tasksByKey.get(key));
  const exactKeys = requested.every(Boolean)
    ? expandVerificationTaskPrerequisites(requested, plan.tasks,
      { mode:"ordinary-focused" }).map(({ key }) => key)
    : [];
  if (plan.mode !== "focused-task" || Boolean(plan.includeProperties) !== productEvidence ||
      !sameSet(plan.requestedPackIds, expectedPackIds) ||
      !sameSet(packIds, expectedPackIds) ||
      plan.focusedTaskKeys !== undefined &&
        !sameSet(plan.focusedTaskKeys, focusedTaskKeys) ||
      !sameSet(plan.tasks.map(({ key }) => key), exactKeys)) {
    throw new Error(`Side-panel single-cutover evidence must use its exact ${
      productEvidence ? "product" : "preparation"} bootstrap`);
  }
  if (productEvidence && (plan.changedPaths ?? []).some((file) =>
    !approvedProductChangedPath(file))) {
    throw new Error("Side-panel product evidence rejects a changed path outside the approved cutover scope");
  }
  if (compatibilityRepair && (plan.changedPaths ?? []).some((file) =>
    !approvedCompatibilityRepairChangedPath(file))) {
    throw new Error("Side-panel preparation evidence rejects a changed path outside the approved compatibility-repair scope");
  }
  return true;
}
