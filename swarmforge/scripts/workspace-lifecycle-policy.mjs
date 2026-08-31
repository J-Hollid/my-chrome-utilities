import path from "node:path";

function isOwnedWorkspace(projectRoot, workspace) {
  const worktrees = path.resolve(projectRoot, ".worktrees");
  const relative = path.relative(worktrees, path.resolve(workspace));
  return Boolean(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative);
}

export function roleWorkspaceCleanupDecision({ projectRoot, workspace, active = false,
  evidenceDispositionComplete = false, uncommittedChanges = false }) {
  if (!isOwnedWorkspace(projectRoot, workspace)) {
    throw new Error("Role workspace cleanup is limited to project .worktrees");
  }
  if (active) return { action:"retain", reason:"workspace is active" };
  if (uncommittedChanges) return { action:"retain", reason:"workspace has uncommitted changes" };
  if (!evidenceDispositionComplete) {
    return { action:"retain", reason:"evidence disposition is incomplete" };
  }
  return { action:"remove", reason:"task disposition is complete" };
}

export async function removeInactiveRoleWorkspace(input) {
  const decision = roleWorkspaceCleanupDecision(input);
  if (decision.action === "retain") {
    return { status:"retained", workspace:input.workspace, reason:decision.reason };
  }
  await input.removeWorktree(input.workspace);
  return { status:"removed", workspace:input.workspace };
}
