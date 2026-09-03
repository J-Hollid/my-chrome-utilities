import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { reconcileRoleDelivery } from
  "../swarmforge/scripts/role-liveness-adapter.mjs";

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

  await writeFile(activityPath,`${JSON.stringify({version:1,command:{id:"stale",pid:999999,
    task:active.task,handoff:active.id},progressLease:null})}\n`);
  const stale=await reconcileRoleDelivery({worktree:root,queuedHandoffPath:queuedPath,
    now:"2026-09-03T05:30:00.000Z"});
  assert.equal(stale.liveness.effectiveState,"available");
  assert.match(stale.notification,/queued-handoff/u);
  assert.match(stale.notification,/Process it now/u);
  const history=JSON.parse(await readFile(
    path.join(root,".swarmforge/role-liveness/transitions.json"),"utf8"));
  assert.deepEqual(history.transitions[0],{
    version:1,priorState:"working",nextState:"available",task:active.task,
    handoff:active.id,activityIdentity:null,reason:"expired active claim",
    at:"2026-09-03T05:30:00.000Z",
  },"the production callback writes the stale release as one audited transition");

  child=spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore"});
  await new Promise((resolve,reject)=>child.once("spawn",resolve).once("error",reject));
  await writeFile(activityPath,`${JSON.stringify({version:1,command:{id:"running",
    pid:child.pid,task:active.task,handoff:active.id},progressLease:null})}\n`);
  const live=await reconcileRoleDelivery({worktree:root,queuedHandoffPath:queuedPath,
    now:"2026-09-03T05:30:01.000Z"});
  assert.equal(live.liveness.effectiveState,"working");
  assert.match(live.notification,/If idle, run ready_for_next\.sh/u);

  await writeFile(activityPath,`${JSON.stringify({version:1,command:{id:"unrelated",
    pid:child.pid,task:"other-task",handoff:"other-handoff"},progressLease:null})}\n`);
  const unrelated=await reconcileRoleDelivery({worktree:root,queuedHandoffPath:queuedPath,
    now:"2026-09-03T05:30:02.000Z"});
  assert.equal(unrelated.liveness.effectiveState,"available",
    "an unrelated live command cannot retain the active handoff");

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
  assert.equal((await readdir(path.join(recipient,".swarmforge/handoffs/inbox/new"))).length,1);
  assert.equal((await readdir(path.join(recipient,".swarmforge/handoffs/inbox/in_process"))).length,1,
    "routing keeps the prior handoff identity unchanged");
  assert.match(await readFile(tmuxLog,"utf8"),/queued-handoff.*Process it now/u,
    "the real daemon invokes the same production reconciliation callback");
} finally {
  child?.kill();
  await rm(root,{recursive:true,force:true});
}

console.log("SwarmForge role liveness runtime contracts passed.");
