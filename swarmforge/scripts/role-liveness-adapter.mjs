#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  reconcileQueuedHandoff, roleStateTransition,
} from "./role-liveness.mjs";
import { activateExactQueuedHandoffLocked, withQueueLock } from "./role-handoff-activation.mjs";
import { observeRoleCommand, publishRoleActivity } from "./role-activity-evidence.mjs";
import { readRoleActivity, renewRoleProgressLease } from "./role-progress-lease.mjs";

const wakeMessage="You have new handoff mail. If idle, run ready_for_next.sh.";

function headers(text) {
  const result={};
  for (const line of text.split(/\r?\n/u)) {
    if (!line) break;
    const separator=line.indexOf(": ");
    if (separator > 0) result[line.slice(0,separator)]=line.slice(separator+2);
  }
  if (!result.id) throw new Error("Role liveness handoff has no id");
  return { ...result, task:result.task ?? result.id };
}

async function activeHandoff(worktree) {
  const directory=path.join(worktree,".swarmforge","handoffs","inbox","in_process");
  let files=[];
  try { files=(await readdir(directory)).filter((name)=>name.endsWith(".handoff")); }
  catch (error) { if (error?.code !== "ENOENT") throw error; }
  if (files.length > 1) throw new Error("Role liveness found multiple active handoffs");
  if (!files.length) return null;
  const file=path.join(directory,files[0]);
  return { identity:headers(await readFile(file,"utf8")), file };
}

async function queuedHandoff(queuedHandoffPath,active) {
  try { return {identity:headers(await readFile(queuedHandoffPath,"utf8")),claimed:false}; }
  catch (error) {
    if (error?.code!=="ENOENT"||!active||path.basename(active.file)!==path.basename(queuedHandoffPath)) {
      throw error;
    }
    return {identity:active.identity,claimed:true};
  }
}

export async function reconcileRoleDelivery({ worktree, queuedHandoffPath,
  socket=null, session=null, agent=null, now=new Date().toISOString(), processAlive }) {
  return withQueueLock(worktree,async ({journalFile})=>{
    const active=await activeHandoff(worktree),queued=await queuedHandoff(queuedHandoffPath,active);
    if (queued.claimed) {
      await renewRoleProgressLease({worktree,task:queued.identity.task,handoff:queued.identity.id,
        reason:"claimed delivery",now});
      return {version:1,queuedHandoff:{id:queued.identity.id,task:queued.identity.task},
        liveness:{version:1,reportedState:"working",effectiveState:"working",
          activityIdentity:{kind:"progress-lease",id:(await readRoleActivity(worktree)).progressLease.id,
            task:queued.identity.task,handoff:queued.identity.id},reason:"current progress lease",
          mailAction:"keep-queued",nextHandoff:null,createdReceipt:false,
          createdReplacementHandoff:false},notification:`Handoff ${queued.identity.id} is current. Process it now.`,
        activation:null};
    }
    let evidence=await readRoleActivity(worktree);
    if (active&&socket&&session) {
      const command=await observeRoleCommand({socket,session,agent,task:active.identity.task,
        handoff:active.identity.id});
      evidence=await publishRoleActivity({worktree,command,progressLease:evidence.progressLease});
      if (command) evidence=await renewRoleProgressLease({worktree,task:active.identity.task,
        handoff:active.identity.id,reason:"observed task command",now});
    }
    const priorState=active==null?"available":"working",activityOwner=active?.identity??queued.identity;
    const liveness=reconcileQueuedHandoff({reportedState:priorState,...evidence,
      queuedHandoff:queued.identity,activityTask:activityOwner.task,activityHandoff:activityOwner.id,
      processAlive,now});
    let activation=null;
    if (active&&liveness.effectiveState!==priorState) {
      const transition=roleStateTransition({priorState,nextState:liveness.effectiveState,
        task:active.identity.task,handoff:active.identity.id,activityIdentity:liveness.activityIdentity,
        reason:liveness.reason,at:now});
      activation=await activateExactQueuedHandoffLocked({worktree,queuedHandoffPath,transition,
        nextTask:queued.identity.task,nextHandoff:queued.identity.id,
        transitionFile:path.join(worktree,".swarmforge","role-liveness","transitions.json"),journalFile});
    }
    const relative=path.relative(worktree,queuedHandoffPath);
    const notification=liveness.mailAction==="keep-queued"?wakeMessage:
      `Queued handoff ${queued.identity.id} is available at ${relative}. Process it now.`;
    return {version:1,queuedHandoff:{id:queued.identity.id,task:queued.identity.task},
      liveness,notification,activation};
  });
}

async function main(args) {
  if (args[0] !== "reconcile" || ![3,6].includes(args.length)) {
    throw new Error("Usage: role-liveness-adapter.mjs reconcile <worktree> <queued-handoff> [socket session agent]");
  }
  console.log(JSON.stringify(await reconcileRoleDelivery({worktree:path.resolve(args[1]),
    queuedHandoffPath:path.resolve(args[2]),socket:args[3]??null,session:args[4]??null,
    agent:args[5]??null})));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error)=>{ console.error(error.message); process.exitCode=1; });
}
