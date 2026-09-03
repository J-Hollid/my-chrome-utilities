import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { observeRoleCommand, publishRoleActivity } from
  "../swarmforge/scripts/role-activity-evidence.mjs";
import { reconcileRoleDelivery } from "../swarmforge/scripts/role-liveness-adapter.mjs";
import { active,exec,queued,removeRoleRuntimeRoot,roleRuntimeRoot,writeHandoff } from
  "./swarmforge-role-runtime-fixtures.mjs";

const root=await roleRuntimeRoot("command-observation"),inbox=path.join(root,
  ".swarmforge/handoffs/inbox"),activePath=path.join(inbox,"in_process/active.handoff"),
  queuedPath=path.join(inbox,"new/queued.handoff"),activityPath=path.join(root,
    ".swarmforge/role-liveness/activity.json");
let child;
try {
  const instructionFile=path.join(root,"coder-instruction.md");
  await exec("bb",[path.resolve("swarmforge/scripts/role-agent-instruction.bb"),"coder",instructionFile]);
  assert.match(await readFile(instructionFile,"utf8"),
    /shared-articles\/handoffs\.prompt.*progress-lease instructions/u);
  await writeHandoff(activePath,active); await writeHandoff(queuedPath,queued);
  await mkdir(path.dirname(activityPath),{recursive:true});

  await assert.rejects(observeRoleCommand({socket:"fixture",session:"coder",agent:"codex",
    task:active.task,handoff:active.id,run:async ()=>{throw new Error("tmux unavailable");}}),
  /tmux unavailable/u,"an unavailable command observation fails closed");
  await assert.rejects(reconcileRoleDelivery({worktree:root,queuedHandoffPath:queuedPath,
    socket:path.join(root,"missing-tmux-socket"),session:"coder",agent:"codex"}),
  "delivery fails closed when command state is unavailable");
  await access(activePath); await access(queuedPath);

  child=spawn(process.execPath,["-e",
    "process.stdin.on('data',()=>require('node:child_process').spawn('sleep',['30']));setInterval(()=>{},1000)"],
  {stdio:["pipe","ignore","ignore"]});
  await new Promise((resolve,reject)=>child.once("spawn",resolve).once("error",reject));
  await new Promise((resolve)=>setTimeout(resolve,50));
  const idle=await observeRoleCommand({socket:"fixture",session:"coder",agent:"MainThread",
    task:active.task,handoff:active.id,run:(command,args)=>command==="tmux" ?
      Promise.resolve({stdout:`${child.pid}\n`}) : exec(command,args)});
  assert.equal(idle,null,"a successful observation can prove that the agent is idle");
  const idleHost=await observeRoleCommand({socket:"fixture",session:"coder",agent:"codex",
    task:active.task,handoff:active.id,run:async (command)=>({stdout:command==="tmux" ?
      "10\n" : "10 1 zsh\n11 10 codex\n"})});
  assert.equal(idleHost,null,"a persistent agent without a child command is idle");
  const hosted=await observeRoleCommand({socket:"fixture",session:"coder",agent:"codex",
    task:active.task,handoff:active.id,run:async (command)=>({stdout:command==="tmux" ?
      "10\n" : "10 1 zsh\n11 10 codex\n12 11 bash\n"})});
  assert.equal(hosted.pid,12);
  child.stdin.write("run\n"); await new Promise((resolve)=>setTimeout(resolve,50));
  const observed=await observeRoleCommand({socket:"fixture",session:"coder",agent:"MainThread",
    task:active.task,handoff:active.id,run:(command,args)=>command==="tmux" ?
      Promise.resolve({stdout:`${child.pid}\n`}) : exec(command,args)});
  await publishRoleActivity({worktree:root,command:observed});
  const live=await reconcileRoleDelivery({worktree:root,queuedHandoffPath:queuedPath,
    now:"2026-09-03T05:30:00.000Z"});
  assert.equal(live.liveness.effectiveState,"working");
  assert.match(live.notification,/If idle, run ready_for_next\.sh/u);
} finally {
  child?.kill(); await removeRoleRuntimeRoot(root);
}

console.log("SwarmForge role command observation contracts passed.");
