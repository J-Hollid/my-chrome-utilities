import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { reconcileRoleDelivery } from "../swarmforge/scripts/role-liveness-adapter.mjs";
import { activateExactQueuedHandoff } from "../swarmforge/scripts/role-handoff-activation.mjs";
import { completeCurrentBatch } from "../swarmforge/scripts/role-handoff-batch-complete.mjs";
import { receiveNextBatch } from "../swarmforge/scripts/role-handoff-batch-receive.mjs";
import { activeRoleWork } from "../swarmforge/scripts/role-handoff-identity.mjs";
import { readRoleActivity, renewRoleProgressLease } from
  "../swarmforge/scripts/role-progress-lease.mjs";
import { roleStateTransition } from "../swarmforge/scripts/role-liveness.mjs";

const root=await mkdtemp(path.join(os.tmpdir(),"swarmforge-role-batch-"));
const exec=promisify(execFile);
const handoff=({id,task,priority="00"})=>`id: ${id}\ntask: ${task}\npriority: ${priority}\n\nwork\n`;

async function queued(worktree,values) {
  const directory=path.join(worktree,".swarmforge/handoffs/inbox/new");
  await mkdir(directory,{recursive:true});
  for (const value of values) await writeFile(path.join(directory,`${value.id}.handoff`),handoff(value));
  return directory;
}

async function assertCurrentBatch(worktree,count) {
  const current=await activeRoleWork(worktree);
  assert.equal(current.kind,"batch"); assert.equal(current.files.length,count);
  const activity=await readRoleActivity(worktree);
  assert.equal(activity.progressLease.task,current.identity.task);
  assert.equal(activity.progressLease.handoff,current.identity.id);
  for (const file of current.files) {
    assert.equal(((await readFile(file,"utf8")).match(/^dequeued_at: /gmu)??[]).length,1);
  }
  return current;
}

try {
  const worktree=path.join(root,"live"),newDirectory=await queued(worktree,[
    {id:"one",task:"first",priority:"00"},{id:"two",task:"second",priority:"00"},
    {id:"z-later",task:"later",priority:"50"},
  ]);
  await receiveNextBatch(worktree);
  const current=await assertCurrentBatch(worktree,2);
  const claimed=await reconcileRoleDelivery({worktree,
    queuedHandoffPath:path.join(newDirectory,"one.handoff")});
  assert.equal(claimed.activation,null,"delivery accepts a handoff already claimed into the exact batch");
  assert.equal(claimed.liveness.activityIdentity.handoff,current.identity.id);
  const receiptExpiry=Date.parse((await readRoleActivity(worktree)).progressLease.expiresAt);
  await new Promise((resolve)=>setTimeout(resolve,10));
  await exec(process.execPath,[path.resolve("swarmforge/scripts/role-progress-lease.mjs"),
    "renew-current",worktree]);
  assert.ok(Date.parse((await readRoleActivity(worktree)).progressLease.expiresAt)>receiptExpiry,
    "the production renewal command renews an exact active batch");
  assert.deepEqual(await readdir(newDirectory),["z-later.handoff"],
    "batch receipt preserves the lower-priority handoff");
  await renewRoleProgressLease({worktree,task:current.identity.task,handoff:current.identity.id,
    now:"2026-09-03T06:00:00.000Z",durationMs:2000});
  const retained=await reconcileRoleDelivery({worktree,
    queuedHandoffPath:path.join(newDirectory,"z-later.handoff"),now:"2026-09-03T06:00:01.000Z"});
  assert.equal(retained.liveness.effectiveState,"working","a current batch lease retains ordinary mail");
  const released=await reconcileRoleDelivery({worktree,
    queuedHandoffPath:path.join(newDirectory,"z-later.handoff"),now:"2026-09-03T06:00:03.000Z"});
  assert.equal(released.liveness.effectiveState,"available","an expired batch lease releases ordinary mail");
  assert.equal((await activeRoleWork(worktree)).identity.id,"z-later",
    "stale batch release promotes the exact queued handoff");
  assert.deepEqual((await readdir(newDirectory)).sort(),["one.handoff","two.handoff"],
    "stale batch release returns every original batch item without replacement");

  for (const faultAt of ["prepared","prior-staged","promoted-current","swapped"]) {
    const interrupted=path.join(root,`activation-${faultAt}`),queue=await queued(interrupted,[
      {id:"one",task:"first"},{id:"two",task:"second"}]);
    await receiveNextBatch(interrupted);
    await writeFile(path.join(queue,"z-later.handoff"),handoff({id:"z-later",task:"later",priority:"50"}));
    const batch=await activeRoleWork(interrupted),transition=roleStateTransition({priorState:"working",
      nextState:"available",task:batch.identity.task,handoff:batch.identity.id,
      reason:"expired active claim",at:"2026-09-03T06:00:03.000Z"});
    await renewRoleProgressLease({worktree:interrupted,task:batch.identity.task,
      handoff:batch.identity.id,now:"2026-09-03T06:00:00.000Z",durationMs:2000});
    await assert.rejects(activateExactQueuedHandoff({worktree:interrupted,
      queuedHandoffPath:path.join(queue,"z-later.handoff"),
      transitionFile:path.join(interrupted,".swarmforge/role-liveness/transitions.json"),transition,
      nextTask:"later",nextHandoff:"z-later",faultAt}),/Injected queue fault/u);
    await reconcileRoleDelivery({worktree:interrupted,
      queuedHandoffPath:path.join(queue,"z-later.handoff"),now:"2026-09-03T06:00:04.000Z"});
    assert.equal((await activeRoleWork(interrupted)).identity.id,"z-later",
      `batch activation recovers exactly after ${faultAt}`);
    assert.deepEqual((await readdir(queue)).sort(),["one.handoff","two.handoff"]);
    assert.equal((await readRoleActivity(interrupted)).progressLease.handoff,"z-later");
  }

  for (const faultAt of ["prepared","content-staged","sources-staged","promoted-current","leased"]) {
    const interrupted=path.join(root,`receive-${faultAt}`);
    await queued(interrupted,[{id:"one",task:"first"},{id:"two",task:"second"}]);
    await assert.rejects(receiveNextBatch(interrupted,{faultAt}),/Injected queue fault/u);
    await receiveNextBatch(interrupted); await assertCurrentBatch(interrupted,2);
  }

  for (const faultAt of ["prepared","content-staged","source-staged","promoted-completed",
    "activity-cleared"]) {
    const interrupted=path.join(root,`complete-${faultAt}`);
    await queued(interrupted,[{id:"one",task:"first"},{id:"two",task:"second"}]);
    await receiveNextBatch(interrupted);
    await assert.rejects(completeCurrentBatch(interrupted,{faultAt}),/Injected queue fault/u);
    await completeCurrentBatch(interrupted);
    assert.equal(await activeRoleWork(interrupted),null);
    const completedDirectory=path.join(interrupted,".swarmforge/handoffs/inbox/completed"),
      batches=await readdir(completedDirectory);
    assert.equal(batches.length,1);
    for (const file of await readdir(path.join(completedDirectory,batches[0]))) {
      assert.equal(((await readFile(path.join(completedDirectory,batches[0],file),"utf8"))
        .match(/^completed_at: /gmu)??[]).length,1);
    }
    assert.equal((await readRoleActivity(interrupted)).progressLease,null);
  }
} finally {
  await rm(root,{recursive:true,force:true});
}

console.log("SwarmForge batch role liveness runtime contracts passed.");
