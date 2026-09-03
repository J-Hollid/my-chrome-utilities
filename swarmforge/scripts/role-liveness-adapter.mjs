#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  appendRoleStateTransition, reconcileQueuedHandoff, roleStateTransition,
} from "./role-liveness.mjs";

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

async function readJsonIfPresent(file) {
  try { return JSON.parse(await readFile(file,"utf8")); }
  catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}

async function activeHandoff(worktree) {
  const directory=path.join(worktree,".swarmforge","handoffs","inbox","in_process");
  let files=[];
  try { files=(await readdir(directory)).filter((name)=>name.endsWith(".handoff")); }
  catch (error) { if (error?.code !== "ENOENT") throw error; }
  if (files.length > 1) throw new Error("Role liveness found multiple active handoffs");
  if (!files.length) return null;
  return headers(await readFile(path.join(directory,files[0]),"utf8"));
}

function activity(document) {
  if (document == null) return { command:null, progressLease:null };
  if (document?.version !== 1 || !("command" in document) || !("progressLease" in document)) {
    throw new Error("Role activity evidence is malformed");
  }
  return { command:document.command, progressLease:document.progressLease };
}

export async function reconcileRoleDelivery({ worktree, queuedHandoffPath,
  now=new Date().toISOString(), processAlive }) {
  const queuedHandoff=headers(await readFile(queuedHandoffPath,"utf8"));
  const active=await activeHandoff(worktree);
  const evidence=activity(await readJsonIfPresent(path.join(worktree,".swarmforge",
    "role-liveness","activity.json")));
  const priorState=active == null ? "available" : "working";
  const activityOwner=active ?? queuedHandoff;
  const liveness=reconcileQueuedHandoff({reportedState:priorState,...evidence,queuedHandoff,
    activityTask:activityOwner.task,activityHandoff:activityOwner.id,processAlive,now});
  if (active && liveness.effectiveState !== priorState) {
    const transition=roleStateTransition({priorState,nextState:liveness.effectiveState,
      task:active.task,handoff:active.id,activityIdentity:liveness.activityIdentity,
      reason:liveness.reason,at:now});
    await appendRoleStateTransition(path.join(worktree,".swarmforge","role-liveness",
      "transitions.json"),transition);
  }
  const relative=path.relative(worktree,queuedHandoffPath);
  const notification=liveness.mailAction === "keep-queued" ? wakeMessage :
    `Queued handoff ${queuedHandoff.id} is available at ${relative}. Process it now.`;
  return { version:1,queuedHandoff:{id:queuedHandoff.id,task:queuedHandoff.task},
    liveness,notification };
}

async function main(args) {
  if (args[0] !== "reconcile" || args.length !== 3) {
    throw new Error("Usage: role-liveness-adapter.mjs reconcile <worktree> <queued-handoff>");
  }
  console.log(JSON.stringify(await reconcileRoleDelivery({worktree:path.resolve(args[1]),
    queuedHandoffPath:path.resolve(args[2])})));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error)=>{ console.error(error.message); process.exitCode=1; });
}
