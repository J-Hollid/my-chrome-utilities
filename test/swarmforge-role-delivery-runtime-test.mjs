import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { reconcileRoleDelivery } from "../swarmforge/scripts/role-liveness-adapter.mjs";
import { active,exec,handoff,queued,removeRoleRuntimeRoot,roleRuntimeRoot,writeHandoff } from
  "./swarmforge-role-runtime-fixtures.mjs";

const root=await roleRuntimeRoot("delivery"),inbox=path.join(root,".swarmforge/handoffs/inbox"),
  activePath=path.join(inbox,"in_process/active.handoff"),
  queuedPath=path.join(inbox,"new/queued.handoff"),activityPath=path.join(root,
    ".swarmforge/role-liveness/activity.json");
try {
  await writeHandoff(activePath,active); await writeHandoff(queuedPath,queued);
  await mkdir(path.dirname(activityPath),{recursive:true});
  await writeFile(activityPath,`${JSON.stringify({version:1,command:{id:"unrelated",pid:999999,
    task:"other-task",handoff:"other-handoff"},progressLease:null})}\n`);
  const unrelated=await reconcileRoleDelivery({worktree:root,queuedHandoffPath:queuedPath,
    now:"2026-09-03T05:30:01.000Z"});
  assert.equal(unrelated.liveness.effectiveState,"available");
  assert.deepEqual(await readdir(path.join(inbox,"in_process")),["queued.handoff"]);
  assert.deepEqual(await readdir(path.join(inbox,"new")),["active.handoff"]);
  const history=JSON.parse(await readFile(
    path.join(root,".swarmforge/role-liveness/transitions.json"),"utf8"));
  assert.deepEqual(history.transitions[0],{version:1,priorState:"working",nextState:"available",
    task:active.task,handoff:active.id,activityIdentity:null,reason:"expired active claim",
    at:"2026-09-03T05:30:01.000Z"});

  const project=path.join(root,"project"),sender=path.join(root,"sender"),
    recipient=path.join(root,"recipient"),fakeBin=path.join(root,"bin"),tmuxLog=path.join(root,"tmux.log");
  await mkdir(path.join(project,".swarmforge"),{recursive:true});
  await mkdir(path.join(sender,".swarmforge/handoffs/outbox"),{recursive:true});
  await mkdir(path.join(recipient,".swarmforge/handoffs/inbox/in_process"),{recursive:true});
  await mkdir(path.join(recipient,".swarmforge/role-liveness"),{recursive:true});
  await mkdir(fakeBin,{recursive:true});
  await writeFile(path.join(project,".swarmforge/roles.tsv"),
    `sender\tsender\t${sender}\tsender-session\tSender\tcodex\ttask\n`+
    `coder\tcoder\t${recipient}\tcoder-session\tCoder\tcodex\ttask\n`);
  await writeFile(path.join(project,".swarmforge/tmux-socket"),"fixture-socket\n");
  await writeHandoff(path.join(recipient,
    ".swarmforge/handoffs/inbox/in_process/active.handoff"),active);
  await writeFile(path.join(recipient,".swarmforge/role-liveness/activity.json"),
    `${JSON.stringify({version:1,command:{id:"dead",pid:999999,task:active.task,
      handoff:active.id},progressLease:null})}\n`);
  await writeFile(path.join(sender,".swarmforge/handoffs/outbox/00_queued.handoff"),
    handoff({...queued,to:"coder",type:"note",priority:"00"}));
  await writeFile(path.join(fakeBin,"tmux"),
    "#!/bin/sh\nprintf '%s\\n' \"$*\" >> \"$TMUX_LOG\"\nprintf '1\\n'\n",{mode:0o755});
  await exec("bb",[path.resolve("swarmforge/scripts/handoffd.bb"),project,"--once"],{
    cwd:path.resolve("."),env:{...process.env,PATH:`${fakeBin}${path.delimiter}${process.env.PATH}`,
      TMUX_LOG:tmuxLog}});
  assert.deepEqual(await readdir(path.join(recipient,".swarmforge/handoffs/inbox/new")),
    ["active.handoff"]);
  assert.deepEqual(await readdir(path.join(recipient,".swarmforge/handoffs/inbox/in_process")),
    ["00_queued.handoff"]);
  assert.match(await readFile(tmuxLog,"utf8"),/queued-handoff.*Process it now/u);
  await writeFile(path.join(recipient,".swarmforge/roles.tsv"),
    `coder\tcoder\t${recipient}\tcoder-session\tCoder\tcodex\ttask\n`);
  await exec("git",["init","-q"],{cwd:recipient});
  const received=(await exec(path.resolve("swarmforge/scripts/ready_for_next.sh"),[],{
    cwd:recipient,env:{...process.env,SWARMFORGE_ROLE:"coder"}})).stdout;
  assert.match(received,/TASK_NAME: queued-task/u);
} finally {
  await removeRoleRuntimeRoot(root);
}

console.log("SwarmForge role delivery runtime contracts passed.");
