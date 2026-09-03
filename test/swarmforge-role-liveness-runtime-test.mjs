import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { reconcileRoleDelivery } from
  "../swarmforge/scripts/role-liveness-adapter.mjs";
import { observeRoleCommand, publishRoleActivity } from
  "../swarmforge/scripts/role-activity-evidence.mjs";

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
    "require('node:child_process').spawn('sleep',['30']);setInterval(()=>{},1000)"],{stdio:"ignore"});
  await new Promise((resolve,reject)=>child.once("spawn",resolve).once("error",reject));
  await new Promise((resolve)=>setTimeout(resolve,50));
  const observed=await observeRoleCommand({socket:"fixture",session:"coder",task:active.task,
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
} finally {
  child?.kill();
  await rm(root,{recursive:true,force:true});
}

console.log("SwarmForge role liveness runtime contracts passed.");
