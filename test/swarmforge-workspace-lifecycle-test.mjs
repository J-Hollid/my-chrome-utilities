import assert from "node:assert/strict";
import path from "node:path";

import {
  roleWorkspaceCleanupDecision,
  removeInactiveRoleWorkspace,
} from "../swarmforge/scripts/workspace-lifecycle-policy.mjs";

const projectRoot = path.resolve("/project");
const workspace = path.join(projectRoot, ".worktrees", "review-42");
assert.deepEqual(roleWorkspaceCleanupDecision({ projectRoot, workspace, active:false,
  evidenceDispositionComplete:true, uncommittedChanges:false }), {
  action:"remove", reason:"task disposition is complete",
});
for (const [field, reason] of [
  ["active", "workspace is active"],
  ["uncommittedChanges", "workspace has uncommitted changes"],
]) {
  assert.equal(roleWorkspaceCleanupDecision({ projectRoot, workspace,
    evidenceDispositionComplete:true, [field]:true }).reason, reason);
}
assert.equal(roleWorkspaceCleanupDecision({ projectRoot, workspace, active:false,
  evidenceDispositionComplete:false }).action, "retain");
assert.throws(() => roleWorkspaceCleanupDecision({ projectRoot,
  workspace:path.resolve("/tmp/not-owned"), evidenceDispositionComplete:true }),
  /project \.worktrees/u);

const calls = [];
assert.deepEqual(await removeInactiveRoleWorkspace({ projectRoot, workspace, active:false,
  evidenceDispositionComplete:true, uncommittedChanges:false, removeWorktree:async(target) => {
    calls.push(target);
  } }), { status:"removed", workspace });
assert.deepEqual(calls, [workspace]);
