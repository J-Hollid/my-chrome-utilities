import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createRoleWorkspace,
  completeRoleWorkspace,
  roleWorkspaceCleanupDecision,
  removeInactiveRoleWorkspace,
} from "../swarmforge/scripts/workspace-lifecycle-policy.mjs";
import { completeInactiveRoleWorkspaces, roleTaskState } from
  "../swarmforge/scripts/role-workspace-completion.mjs";

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

const lifecycleCalls = [];
assert.deepEqual(await completeInactiveRoleWorkspaces({ projectRoot, roles:[
  { role:"coder", workspace },
  { role:"refactorer", workspace:path.join(projectRoot, ".worktrees", "refactorer") },
], taskState:async({ role }) => role === "coder"
  ? { active:false, evidenceDispositionComplete:true }
  : { active:true, evidenceDispositionComplete:false },
workspaceExists:async() => true,
completeWorkspace:async(input) => {
  lifecycleCalls.push(input);
  return { status:"removed", workspace:input.workspace };
} }), [
  { role:"coder", status:"removed", workspace },
  { role:"refactorer", status:"retained",
    workspace:path.join(projectRoot, ".worktrees", "refactorer"), reason:"workspace is active" },
]);
assert.deepEqual(lifecycleCalls, [{ projectRoot, workspace,
  active:false, evidenceDispositionComplete:true }]);

const stateRoot = await mkdtemp(path.join(os.tmpdir(), "role-workspace-state-"));
try {
  const inbox = path.join(stateRoot, ".swarmforge", "handoffs", "inbox");
  await mkdir(path.join(inbox, "new"), { recursive:true });
  await mkdir(path.join(inbox, "in_process"), { recursive:true });
  assert.deepEqual(await roleTaskState({ workspace:stateRoot }), {
    active:false, evidenceDispositionComplete:true,
  });
  await writeFile(path.join(inbox, "new", "queued.handoff"), "type: note\n");
  assert.deepEqual(await roleTaskState({ workspace:stateRoot }), {
    active:true, evidenceDispositionComplete:true,
  }, "queued work preserves the role workspace");
  await rm(path.join(inbox, "new", "queued.handoff"));
  await writeFile(path.join(inbox, "in_process", "active.handoff"), "type: note\n");
  assert.deepEqual(await roleTaskState({ workspace:stateRoot }), {
    active:true, evidenceDispositionComplete:false,
  }, "active work preserves the workspace until evidence disposition completes");
  await rm(path.join(inbox, "in_process", "active.handoff"));
  const batch = path.join(inbox, "in_process", "batch-1");
  await mkdir(batch);
  await writeFile(path.join(batch, "active.handoff"), "type: note\n");
  assert.deepEqual(await roleTaskState({ workspace:stateRoot }), {
    active:true, evidenceDispositionComplete:false,
  }, "an active handoff batch preserves the workspace and its evidence");
} finally {
  await rm(stateRoot, { recursive:true, force:true });
}
