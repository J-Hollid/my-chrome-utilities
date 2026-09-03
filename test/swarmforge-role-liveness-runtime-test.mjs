import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { access, mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { reconcileRoleDelivery } from
  "../swarmforge/scripts/role-liveness-adapter.mjs";
import { observeRoleCommand, publishRoleActivity } from
  "../swarmforge/scripts/role-activity-evidence.mjs";
import { receiveNextTask } from "../swarmforge/scripts/role-handoff-receive.mjs";
import { completeCurrentTask } from "../swarmforge/scripts/role-handoff-complete.mjs";
import { withQueueLock } from "../swarmforge/scripts/role-handoff-activation.mjs";
import { readRoleActivity, renewRoleProgressLease } from
  "../swarmforge/scripts/role-progress-lease.mjs";

const root=await mkdtemp(path.join(os.tmpdir(),"swarmforge-role-runtime-"));
const inbox=path.join(root,".swarmforge/handoffs/inbox");
const activePath=path.join(inbox,"in_process/active.handoff");
const queuedPath=path.join(inbox,"new/queued.handoff");
const activityPath=path.join(root,".swarmforge/role-liveness/activity.json");
const active={id:"active-handoff",task:"active-task"};
const queued={id:"queued-handoff",task:"queued-task",from:"architect"};
const handoff=(value)=>Object.entries(value).map(([key,item])=>`${key}: ${item}`).join("\n")+"\n\nwork\n";
const exec=promisify(execFile);
let child;
try {
  await mkdir(path.dirname(activePath),{recursive:true});
  await mkdir(path.dirname(queuedPath),{recursive:true});
  await mkdir(path.dirname(activityPath),{recursive:true});
  await writeFile(activePath,handoff(active));
  await writeFile(queuedPath,handoff(queued));

  child=spawn(process.execPath,["-e",
    "process.stdin.on('data',()=>require('node:child_process').spawn('sleep',['30']));setInterval(()=>{},1000)"],
  {stdio:["pipe","ignore","ignore"]});
  await new Promise((resolve,reject)=>child.once("spawn",resolve).once("error",reject));
  await new Promise((resolve)=>setTimeout(resolve,50));
  const idleAgent=await observeRoleCommand({socket:"fixture",session:"coder",agent:"MainThread",
    task:active.task,handoff:active.id,run:(command,args)=>command==="tmux" ?
      Promise.resolve({stdout:`${child.pid}\n`}) : exec(command,args)});
  assert.equal(idleAgent,null,"an idle persistent agent is not a live task command");
  const idleHost=await observeRoleCommand({socket:"fixture",session:"coder",agent:"codex",
    task:active.task,handoff:active.id,run:async (command)=>({stdout:command==="tmux" ?
      "10\n" : "10 1 zsh\n11 10 codex\n"})});
  assert.equal(idleHost,null,"the persistent agent below a role shell is not task work");
  const hostedCommand=await observeRoleCommand({socket:"fixture",session:"coder",agent:"codex",
    task:active.task,handoff:active.id,run:async (command)=>({stdout:command==="tmux" ?
      "10\n" : "10 1 zsh\n11 10 codex\n12 11 bash\n"})});
  assert.equal(hostedCommand.pid,12,"a command below the persistent agent retains the task");
  child.stdin.write("run\n");
  await new Promise((resolve)=>setTimeout(resolve,50));
  const observed=await observeRoleCommand({socket:"fixture",session:"coder",agent:"MainThread",task:active.task,
    handoff:active.id,run:(command,args)=>command==="tmux" ?
      Promise.resolve({stdout:`${child.pid}\n`}) : exec(command,args)});
  assert.equal(observed.task,active.task);
  assert.equal(observed.handoff,active.id);
  await publishRoleActivity({worktree:root,command:observed});
  const live=await reconcileRoleDelivery({worktree:root,queuedHandoffPath:queuedPath,
    now:"2026-09-03T05:30:00.000Z"});
  assert.equal(live.liveness.effectiveState,"working");
  assert.match(live.notification,/If idle, run ready_for_next\.sh/u);

  await writeFile(activityPath,`${JSON.stringify({version:1,command:{id:"unrelated",
    pid:child.pid,task:"other-task",handoff:"other-handoff"},progressLease:null})}\n`);
  const unrelated=await reconcileRoleDelivery({worktree:root,queuedHandoffPath:queuedPath,
    now:"2026-09-03T05:30:01.000Z"});
  assert.equal(unrelated.liveness.effectiveState,"available",
    "an unrelated live command cannot retain the active handoff");
  assert.equal((await readdir(path.join(inbox,"in_process")))[0],"queued.handoff",
    "stale recovery makes the exact queued handoff current");
  assert.equal((await readdir(path.join(inbox,"new")))[0],"active.handoff",
    "stale recovery keeps the prior handoff queued under its original identity");
  const history=JSON.parse(await readFile(
    path.join(root,".swarmforge/role-liveness/transitions.json"),"utf8"));
  assert.deepEqual(history.transitions[0],{
    version:1,priorState:"working",nextState:"available",task:active.task,
    handoff:active.id,activityIdentity:null,reason:"expired active claim",
    at:"2026-09-03T05:30:01.000Z",
  },"the production callback writes the stale release as one audited transition");

  const project=path.join(root,"project"),sender=path.join(root,"sender"),recipient=path.join(root,"recipient"),
    fakeBin=path.join(root,"bin"),tmuxLog=path.join(root,"tmux.log");
  await mkdir(path.join(project,".swarmforge"),{recursive:true});
  await mkdir(path.join(sender,".swarmforge/handoffs/outbox"),{recursive:true});
  await mkdir(path.join(recipient,".swarmforge/handoffs/inbox/in_process"),{recursive:true});
  await mkdir(path.join(recipient,".swarmforge/role-liveness"),{recursive:true});
  await mkdir(fakeBin,{recursive:true});
  await writeFile(path.join(project,".swarmforge/roles.tsv"),
    `sender\tsender\t${sender}\tsender-session\tSender\tcodex\ttask\n`+
    `coder\tcoder\t${recipient}\tcoder-session\tCoder\tcodex\ttask\n`);
  await writeFile(path.join(project,".swarmforge/tmux-socket"),"fixture-socket\n");
  await writeFile(path.join(recipient,".swarmforge/handoffs/inbox/in_process/active.handoff"),
    handoff(active));
  await writeFile(path.join(recipient,".swarmforge/role-liveness/activity.json"),
    `${JSON.stringify({version:1,command:{id:"dead",pid:999999,task:active.task,
      handoff:active.id},progressLease:null})}\n`);
  await writeFile(path.join(sender,".swarmforge/handoffs/outbox/00_queued.handoff"),
    handoff({...queued,to:"coder",type:"note",priority:"00"}));
  await writeFile(path.join(fakeBin,"tmux"),
    "#!/bin/sh\nprintf '%s\\n' \"$*\" >> \"$TMUX_LOG\"\n",{mode:0o755});
  await exec("bb",[path.resolve("swarmforge/scripts/handoffd.bb"),project,"--once"],{
    cwd:path.resolve("."),env:{...process.env,PATH:`${fakeBin}${path.delimiter}${process.env.PATH}`,
      TMUX_LOG:tmuxLog}});
  assert.deepEqual(await readdir(path.join(recipient,".swarmforge/handoffs/inbox/new")),
    ["active.handoff"]);
  assert.deepEqual(await readdir(path.join(recipient,".swarmforge/handoffs/inbox/in_process")),
    ["00_queued.handoff"]);
  assert.match(await readFile(tmuxLog,"utf8"),/queued-handoff.*Process it now/u,
    "the real daemon invokes the same production reconciliation callback");
  await writeFile(path.join(recipient,".swarmforge/roles.tsv"),
    `coder\tcoder\t${recipient}\tcoder-session\tCoder\tcodex\ttask\n`);
  await exec("git",["init","-q"],{cwd:recipient});
  const received=(await exec(path.resolve("swarmforge/scripts/ready_for_next.sh"),[],{
    cwd:recipient,env:{...process.env,SWARMFORGE_ROLE:"coder"}})).stdout;
  assert.match(received,/TASK_NAME: queued-task/u,
    "the real receive helper returns the exact handoff selected by reconciliation");

  const interrupted=path.join(root,"interrupted"),interruptedInbox=path.join(interrupted,
    ".swarmforge/handoffs/inbox"),interruptedState=path.join(interrupted,".swarmforge/role-liveness");
  const interruptedActive=path.join(interruptedInbox,"in_process/active.handoff"),
    interruptedQueued=path.join(interruptedInbox,"new/queued.handoff"),
    interruptedStage=path.join(interruptedState,"staged.handoff");
  await mkdir(path.dirname(interruptedActive),{recursive:true});
  await mkdir(path.dirname(interruptedQueued),{recursive:true}); await mkdir(interruptedState,{recursive:true});
  await writeFile(interruptedActive,handoff(active)); await writeFile(interruptedQueued,handoff(queued));
  await rename(interruptedActive,interruptedStage);
  const interruptedTransition={version:1,priorState:"working",nextState:"available",
    task:active.task,handoff:active.id,activityIdentity:null,reason:"expired active claim",
    at:"2026-09-03T05:30:03.000Z"};
  await writeFile(path.join(interruptedState,"activation.lock"),'{"version":1,"pid":999999}\n');
  await writeFile(path.join(interruptedState,"activation.json"),`${JSON.stringify({version:1,
    phase:"prior-staged",prior:interruptedActive,queued:interruptedQueued,stage:interruptedStage,
    promoted:path.join(interruptedInbox,"in_process/queued.handoff"),
    retained:path.join(interruptedInbox,"new/active.handoff"),
    transitionFile:path.join(interruptedState,"transitions.json"),
    transition:interruptedTransition})}\n`);
  assert.equal(await receiveNextTask(interrupted),interruptedActive,
    "receive rolls back an interrupted activation before it selects work");
  await access(interruptedActive); await access(interruptedQueued);
  await assert.rejects(access(interruptedStage),/ENOENT/u);

  const leased=path.join(root,"leased"),leasedInbox=path.join(leased,
    ".swarmforge/handoffs/inbox"),leasedActive=path.join(leasedInbox,"in_process/active.handoff"),
    leasedQueued=path.join(leasedInbox,"new/queued.handoff");
  await mkdir(path.dirname(leasedActive),{recursive:true});
  await mkdir(path.dirname(leasedQueued),{recursive:true});
  await writeFile(leasedActive,handoff(active)); await writeFile(leasedQueued,handoff(queued));
  await renewRoleProgressLease({worktree:leased,task:active.task,handoff:active.id,
    now:"2026-09-03T05:30:00.000Z",durationMs:2000});
  const retained=await reconcileRoleDelivery({worktree:leased,queuedHandoffPath:leasedQueued,
    now:"2026-09-03T05:30:01.000Z"});
  assert.equal(retained.liveness.effectiveState,"working","a current exact lease retains the handoff");
  const released=await reconcileRoleDelivery({worktree:leased,queuedHandoffPath:leasedQueued,
    now:"2026-09-03T05:30:03.000Z"});
  assert.equal(released.liveness.effectiveState,"available","an expired lease releases the handoff");
  assert.equal((await readRoleActivity(leased)).progressLease.task,queued.task,
    "stale activation transfers the lease to the promoted handoff");

  const claimed=path.join(root,"claimed"),claimedInbox=path.join(claimed,
    ".swarmforge/handoffs/inbox"),claimedQueued=path.join(claimedInbox,"new/queued.handoff");
  await mkdir(path.dirname(claimedQueued),{recursive:true});
  await writeFile(claimedQueued,handoff(queued));
  await receiveNextTask(claimed);
  await exec(process.execPath,[path.resolve("swarmforge/scripts/role-progress-lease.mjs"),
    "renew-current",claimed]);
  assert.equal((await readRoleActivity(claimed)).progressLease.reason,"active role boundary",
    "the production renewal command binds the current task and handoff");
  const reconciledClaim=await reconcileRoleDelivery({worktree:claimed,
    queuedHandoffPath:claimedQueued,now:"2026-09-03T05:30:04.000Z"});
  assert.equal(reconciledClaim.activation,null,
    "delivery accepts the exact handoff when receive already claimed it");
  assert.match(reconciledClaim.notification,/is current/u);

  const completed=path.join(root,"completed"),completedInbox=path.join(completed,
    ".swarmforge/handoffs/inbox"),completedActive=path.join(completedInbox,"in_process/active.handoff");
  await mkdir(path.dirname(completedActive),{recursive:true});
  await writeFile(completedActive,handoff(active));
  await renewRoleProgressLease({worktree:completed,task:active.task,handoff:active.id});
  let completionSettled=false,completion;
  await withQueueLock(completed,async ()=>{
    completion=completeCurrentTask(completed).finally(()=>{completionSettled=true;});
    await new Promise((resolve)=>setTimeout(resolve,30));
    assert.equal(completionSettled,false,"completion waits while activation owns the queue lock");
  });
  await completion;
  assert.equal((await readRoleActivity(completed)).progressLease,null,
    "completion clears the exact task lease inside the queue transaction");
} finally {
  child?.kill();
  await rm(root,{recursive:true,force:true});
}

console.log("SwarmForge role liveness runtime contracts passed.");
