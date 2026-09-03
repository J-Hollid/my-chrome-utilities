import assert from "node:assert/strict";
import { access, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { completeCurrentTask } from "../swarmforge/scripts/role-handoff-complete.mjs";
import { receiveNextTask } from "../swarmforge/scripts/role-handoff-receive.mjs";
import { readRoleActivity,renewRoleProgressLease } from
  "../swarmforge/scripts/role-progress-lease.mjs";
import { active,queued,removeRoleRuntimeRoot,roleRuntimeRoot,writeHandoff } from
  "./swarmforge-role-runtime-fixtures.mjs";

const root=await roleRuntimeRoot("task-recovery");
try {
  const interrupted=path.join(root,"activation"),inbox=path.join(interrupted,
    ".swarmforge/handoffs/inbox"),state=path.join(interrupted,".swarmforge/role-liveness"),
    activePath=path.join(inbox,"in_process/active.handoff"),
    queuedPath=path.join(inbox,"new/queued.handoff"),stage=path.join(state,"staged.handoff");
  await writeHandoff(activePath,active); await writeHandoff(queuedPath,queued);
  await mkdir(state,{recursive:true}); await rename(activePath,stage);
  const transition={version:1,priorState:"working",nextState:"available",task:active.task,
    handoff:active.id,activityIdentity:null,reason:"expired active claim",
    at:"2026-09-03T05:30:03.000Z"};
  await writeFile(path.join(state,"activation.lock"),'{"version":1,"pid":999999}\n');
  await writeFile(path.join(state,"activation.json"),`${JSON.stringify({version:1,
    phase:"prior-staged",prior:activePath,queued:queuedPath,stage,
    promoted:path.join(inbox,"in_process/queued.handoff"),retained:path.join(inbox,"new/active.handoff"),
    transitionFile:path.join(state,"transitions.json"),transition})}\n`);
  assert.equal(await receiveNextTask(interrupted),activePath);
  await access(activePath); await access(queuedPath); await assert.rejects(access(stage),/ENOENT/u);

  for (const faultAt of ["prepared","content-staged","source-staged","promoted-current","leased"]) {
    const worktree=path.join(root,`receive-${faultAt}`),receiveInbox=path.join(worktree,
      ".swarmforge/handoffs/inbox"),source=path.join(receiveInbox,"new/queued.handoff");
    await writeHandoff(source,queued);
    await assert.rejects(receiveNextTask(worktree,{faultAt}),/Injected queue fault/u);
    await receiveNextTask(worktree);
    const currentFiles=await readdir(path.join(receiveInbox,"in_process"));
    assert.deepEqual(currentFiles,["queued.handoff"]);
    const currentText=await readFile(path.join(receiveInbox,"in_process",currentFiles[0]),"utf8");
    assert.equal((currentText.match(/^dequeued_at: /gmu)??[]).length,1);
    assert.equal((await readRoleActivity(worktree)).progressLease.task,queued.task);
  }

  for (const faultAt of ["prepared","content-staged","source-staged","promoted-completed",
    "activity-cleared"]) {
    const worktree=path.join(root,`completion-${faultAt}`),completionInbox=path.join(worktree,
      ".swarmforge/handoffs/inbox"),source=path.join(completionInbox,"in_process/active.handoff");
    await writeHandoff(source,active);
    await renewRoleProgressLease({worktree,task:active.task,handoff:active.id});
    await assert.rejects(completeCurrentTask(worktree,{faultAt}),/Injected queue fault/u);
    await completeCurrentTask(worktree);
    assert.deepEqual(await readdir(path.join(completionInbox,"in_process")),[]);
    const completedFiles=await readdir(path.join(completionInbox,"completed"));
    assert.deepEqual(completedFiles,["active.handoff"]);
    const completedText=await readFile(path.join(completionInbox,"completed",completedFiles[0]),"utf8");
    assert.equal((completedText.match(/^completed_at: /gmu)??[]).length,1);
    assert.equal((await readRoleActivity(worktree)).progressLease,null);
  }
} finally {
  await removeRoleRuntimeRoot(root);
}

console.log("SwarmForge role task recovery contracts passed.");
