import assert from "node:assert/strict";
import path from "node:path";

import { completeCurrentTask } from "../swarmforge/scripts/role-handoff-complete.mjs";
import { receiveNextTask } from "../swarmforge/scripts/role-handoff-receive.mjs";
import { withQueueLock } from "../swarmforge/scripts/role-handoff-activation.mjs";
import { reconcileRoleDelivery } from "../swarmforge/scripts/role-liveness-adapter.mjs";
import { readRoleActivity,renewRoleProgressLease } from
  "../swarmforge/scripts/role-progress-lease.mjs";
import { active,exec,queued,removeRoleRuntimeRoot,roleRuntimeRoot,writeHandoff } from
  "./swarmforge-role-runtime-fixtures.mjs";

const root=await roleRuntimeRoot("task-lifecycle");
try {
  const claimed=path.join(root,"claimed"),queuedPath=path.join(claimed,
    ".swarmforge/handoffs/inbox/new/queued.handoff");
  await writeHandoff(queuedPath,queued); await receiveNextTask(claimed);
  const initialExpiry=Date.parse((await readRoleActivity(claimed)).progressLease.expiresAt);
  await new Promise((resolve)=>setTimeout(resolve,10));
  await exec(process.execPath,[path.resolve("swarmforge/scripts/role-progress-lease.mjs"),
    "renew-current",claimed]);
  const renewed=(await readRoleActivity(claimed)).progressLease;
  assert.equal(renewed.reason,"active role boundary");
  assert.ok(Date.parse(renewed.expiresAt)>initialExpiry);
  const reconciled=await reconcileRoleDelivery({worktree:claimed,queuedHandoffPath:queuedPath,
    now:"2026-09-03T05:30:04.000Z"});
  assert.equal(reconciled.activation,null); assert.match(reconciled.notification,/is current/u);

  const completed=path.join(root,"completed"),activePath=path.join(completed,
    ".swarmforge/handoffs/inbox/in_process/active.handoff");
  await writeHandoff(activePath,active);
  await renewRoleProgressLease({worktree:completed,task:active.task,handoff:active.id});
  let completionSettled=false,completion;
  await withQueueLock(completed,async ()=>{
    completion=completeCurrentTask(completed).finally(()=>{completionSettled=true;});
    await new Promise((resolve)=>setTimeout(resolve,30));
    assert.equal(completionSettled,false,"completion waits for the queue transaction");
  });
  await completion;
  assert.equal((await readRoleActivity(completed)).progressLease,null);
} finally {
  await removeRoleRuntimeRoot(root);
}

console.log("SwarmForge role task lifecycle contracts passed.");
