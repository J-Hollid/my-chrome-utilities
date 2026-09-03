import assert from "node:assert/strict";
import path from "node:path";

import { activateExactQueuedHandoffLocked,withQueueLock } from
  "../swarmforge/scripts/role-handoff-activation.mjs";
import { reconcileRoleDelivery } from "../swarmforge/scripts/role-liveness-adapter.mjs";
import { roleStateTransition } from "../swarmforge/scripts/role-liveness.mjs";
import { readRoleActivity,renewRoleProgressLease } from
  "../swarmforge/scripts/role-progress-lease.mjs";
import { active,exec,queued,removeRoleRuntimeRoot,roleRuntimeRoot,writeHandoff } from
  "./swarmforge-role-runtime-fixtures.mjs";

const root=await roleRuntimeRoot("lease-race");
try {
  const leased=path.join(root,"leased"),leasedInbox=path.join(leased,
    ".swarmforge/handoffs/inbox"),leasedActive=path.join(leasedInbox,"in_process/active.handoff"),
    leasedQueued=path.join(leasedInbox,"new/queued.handoff");
  await writeHandoff(leasedActive,active); await writeHandoff(leasedQueued,queued);
  await renewRoleProgressLease({worktree:leased,task:active.task,handoff:active.id,
    now:"2026-09-03T05:30:00.000Z",durationMs:2000});
  const retained=await reconcileRoleDelivery({worktree:leased,queuedHandoffPath:leasedQueued,
    now:"2026-09-03T05:30:01.000Z"});
  assert.equal(retained.liveness.effectiveState,"working");
  const released=await reconcileRoleDelivery({worktree:leased,queuedHandoffPath:leasedQueued,
    now:"2026-09-03T05:30:03.000Z"});
  assert.equal(released.liveness.effectiveState,"available");
  assert.equal((await readRoleActivity(leased)).progressLease.task,queued.task);

  const renewalRace=path.join(root,"renewal"),inbox=path.join(renewalRace,
    ".swarmforge/handoffs/inbox"),raceActive=path.join(inbox,"in_process/active.handoff"),
    raceQueued=path.join(inbox,"new/queued.handoff");
  await writeHandoff(raceActive,active); await writeHandoff(raceQueued,queued);
  await renewRoleProgressLease({worktree:renewalRace,task:active.task,handoff:active.id});
  let renewalSettled=false,renewal;
  await withQueueLock(renewalRace,async ({journalFile})=>{
    renewal=exec(process.execPath,[path.resolve("swarmforge/scripts/role-progress-lease.mjs"),
      "renew-current",renewalRace]).finally(()=>{renewalSettled=true;});
    await new Promise((resolve)=>setTimeout(resolve,30));
    assert.equal(renewalSettled,false,"manual renewal waits for the queue transaction");
    const transition=roleStateTransition({priorState:"working",nextState:"available",task:active.task,
      handoff:active.id,reason:"expired active claim",at:"2026-09-03T05:30:05.000Z"});
    await activateExactQueuedHandoffLocked({worktree:renewalRace,queuedHandoffPath:raceQueued,
      transitionFile:path.join(renewalRace,".swarmforge/role-liveness/transitions.json"),transition,
      nextTask:queued.task,nextHandoff:queued.id,journalFile});
  });
  await renewal;
  assert.equal((await readRoleActivity(renewalRace)).progressLease.task,queued.task);
} finally {
  await removeRoleRuntimeRoot(root);
}

console.log("SwarmForge role lease race contracts passed.");
