import assert from "node:assert/strict";
import path from "node:path";

import {
  createRoleWorkspace,
  completeRoleWorkspace,
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

const gitCalls = [];
const git = async(...arguments_) => { gitCalls.push(arguments_); return ""; };
assert.deepEqual(await createRoleWorkspace({ projectRoot, workspace, branch:"review-42", git,
  workspaceExists:async() => false }), { status:"created", workspace });
assert.deepEqual(gitCalls[0], ["worktree", "add", "--force", "-B", "review-42", workspace,
  "HEAD"]);
assert.deepEqual(await completeRoleWorkspace({ projectRoot, workspace, active:false,
  evidenceDispositionComplete:true, git, workspaceStatus:async() => "" }),
{ status:"removed", workspace });
assert.deepEqual(gitCalls.slice(-2), [["worktree", "remove", workspace], ["worktree", "prune"]]);
