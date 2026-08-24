import { expandVerificationTaskPrerequisites } from
  "./verification-execution-prerequisites.mjs";

export const liveTargetPermissionRecoveryEvidenceTask =
  "verification-slice-live-target-permission-recovery";
export const liveTargetPermissionPathApplyEvidenceTask =
  "verification-slice-live-target-permission-path-apply";

export const liveTargetPermissionRecoveryPackIds = [
  "capture", "defects", "event-library", "schemas", "shell",
];

export const liveTargetPermissionRecoveryFocusedTaskKeys = [
  "unit:test/data-layer-live-target-permission-recovery-test.mjs",
  "unit:test/data-layer-observation-targets-test.mjs",
  "unit:test/data-layer-target-path-status-test.mjs",
  "unit:test/live-target-permission-recovery-preparation-contract-test.mjs",
  "unit:test/live-target-permission-recovery-acceptance-test.mjs",
  "unit:test/verification-process-contract-test.mjs",
  "browser-observation:LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER+SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER+WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER",
  "package:extension",
];

export const liveTargetPermissionPathApplyFocusedTaskKeys = [
  ...liveTargetPermissionRecoveryFocusedTaskKeys,
  "unit:test/live-target-permission-path-apply-acceptance-test.mjs",
];

function sameSet(left, right) {
  return JSON.stringify([...new Set(left)].sort()) ===
    JSON.stringify([...new Set(right)].sort());
}

export function isLiveTargetPermissionRecoveryEvidenceTask(task) {
  return liveTargetPermissionRecoveryFocusedTaskKeysFor(task) !== undefined;
}

export function liveTargetPermissionRecoveryFocusedTaskKeysFor(task) {
  if (task === liveTargetPermissionRecoveryEvidenceTask) {
    return liveTargetPermissionRecoveryFocusedTaskKeys;
  }
  if (task === liveTargetPermissionPathApplyEvidenceTask) {
    return liveTargetPermissionPathApplyFocusedTaskKeys;
  }
  return undefined;
}

export function validateLiveTargetPermissionRecoveryFocusedPlan(plan, evidenceTask) {
  const focusedTaskKeys = liveTargetPermissionRecoveryFocusedTaskKeysFor(evidenceTask);
  if (!focusedTaskKeys) return false;
  const packIds = plan.packIds ?? plan.claimPackIds ?? plan.requestedPackIds;
  const executedKeys = plan.tasks.map(({ key }) => key);
  const tasksByKey = new Map(plan.tasks.map((task) => [task.key, task]));
  const requestedTasks = focusedTaskKeys
    .map((key) => tasksByKey.get(key));
  const exactExecutedKeys = requestedTasks.every(Boolean)
    ? expandVerificationTaskPrerequisites(requestedTasks, plan.tasks,
      { mode:"ordinary-focused" }).map(({ key }) => key)
    : [];
  if (plan.mode !== "focused-task" || Boolean(plan.includeProperties) ||
      !sameSet(plan.requestedPackIds, liveTargetPermissionRecoveryPackIds) ||
      !sameSet(packIds, liveTargetPermissionRecoveryPackIds) ||
      plan.focusedTaskKeys !== undefined &&
        !sameSet(plan.focusedTaskKeys, focusedTaskKeys) ||
      !sameSet(executedKeys, exactExecutedKeys)) {
    throw new Error("Permission-recovery evidence must use its exact causal focused bootstrap");
  }
  const executed = new Set(executedKeys);
  for (const key of focusedTaskKeys) {
    if (!executed.has(key)) throw new Error(`Permission-recovery evidence omitted ${key}`);
  }
  if ([...executed].some((key) => key.startsWith("property:"))) {
    throw new Error("Permission-recovery evidence cannot infer an undeclared property task");
  }
  return true;
}
