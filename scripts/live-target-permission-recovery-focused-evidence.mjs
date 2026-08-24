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

function sameSet(left, right) {
  return JSON.stringify([...new Set(left)].sort()) ===
    JSON.stringify([...new Set(right)].sort());
}

export function isLiveTargetPermissionRecoveryEvidenceTask(task) {
  return [liveTargetPermissionRecoveryEvidenceTask,
    liveTargetPermissionPathApplyEvidenceTask].includes(task);
}

export function validateLiveTargetPermissionRecoveryFocusedPlan(plan, evidenceTask) {
  if (!isLiveTargetPermissionRecoveryEvidenceTask(evidenceTask)) return false;
  const packIds = plan.packIds ?? plan.claimPackIds ?? plan.requestedPackIds;
  const executedKeys = plan.tasks.map(({ key }) => key);
  const exactExecutedKeys = ["build:dist", ...liveTargetPermissionRecoveryFocusedTaskKeys];
  if (plan.mode !== "focused-task" || Boolean(plan.includeProperties) ||
      !sameSet(plan.requestedPackIds, liveTargetPermissionRecoveryPackIds) ||
      !sameSet(packIds, liveTargetPermissionRecoveryPackIds) ||
      plan.focusedTaskKeys !== undefined &&
        !sameSet(plan.focusedTaskKeys, liveTargetPermissionRecoveryFocusedTaskKeys) ||
      !sameSet(executedKeys, exactExecutedKeys)) {
    throw new Error("Permission-recovery evidence must use its exact causal focused bootstrap");
  }
  const executed = new Set(executedKeys);
  for (const key of liveTargetPermissionRecoveryFocusedTaskKeys) {
    if (!executed.has(key)) throw new Error(`Permission-recovery evidence omitted ${key}`);
  }
  if ([...executed].some((key) => key.startsWith("property:"))) {
    throw new Error("Permission-recovery evidence cannot infer an undeclared property task");
  }
  return true;
}
