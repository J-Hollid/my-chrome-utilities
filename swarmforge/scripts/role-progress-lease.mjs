import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { publishRoleActivity } from "./role-activity-evidence.mjs";
import { activeRoleWork } from "./role-handoff-identity.mjs";

const defaultDurationMs=120000;

function activityFile(worktree) {
  return path.join(worktree,".swarmforge","role-liveness","activity.json");
}

export async function readRoleActivity(worktree) {
  let document;
  try { document=JSON.parse(await readFile(activityFile(worktree),"utf8")); }
  catch (error) { if (error?.code === "ENOENT") return {version:1,command:null,progressLease:null}; throw error; }
  if (document?.version!==1||!("command" in document)||!("progressLease" in document)) {
    throw new Error("Role activity evidence is malformed");
  }
  return document;
}

export async function renewRoleProgressLease({worktree,task,handoff,reason="active role work",
  now=new Date().toISOString(),durationMs=defaultDurationMs}) {
  if (!task||!handoff||!reason||!Number.isInteger(durationMs)||durationMs<1000||durationMs>300000) {
    throw new Error("Role progress lease requires an exact bounded identity");
  }
  const current=await readRoleActivity(worktree),prior=current.progressLease;
  if (prior&&(prior.task!==task||prior.handoff!==handoff)) {
    throw new Error("Role progress lease belongs to another task or handoff");
  }
  const start=Date.parse(now);
  if (!Number.isFinite(start)) throw new Error("Role progress lease requires a valid time");
  const progressLease={version:1,id:prior?.id??`lease:${randomUUID()}`,task,handoff,reason,
    expiresAt:new Date(start+durationMs).toISOString()};
  return publishRoleActivity({worktree,command:current.command,progressLease});
}

export async function completeRoleActivity({worktree,task,handoff}) {
  const current=await readRoleActivity(worktree),lease=current.progressLease;
  if (lease&&(lease.task!==task||lease.handoff!==handoff)) {
    throw new Error("Role activity completion does not match the current lease");
  }
  return publishRoleActivity({worktree,command:null,progressLease:null});
}

export async function clearStaleRoleActivity({worktree,nextTask,nextHandoff}) {
  const current=await readRoleActivity(worktree),isSuccessor=(item)=>item?.task===nextTask&&
    item?.handoff===nextHandoff;
  if ([current.command,current.progressLease].some(isSuccessor)) {
    throw new Error("Stale activity cleanup conflicts with successor activity");
  }
  return publishRoleActivity({worktree,command:null,progressLease:null});
}

async function main(args) {
  if (args.length!==2||args[0]!=="renew-current") {
    throw new Error("Use: role-progress-lease.mjs renew-current <worktree>");
  }
  const worktree=path.resolve(args[1]),{withQueueLock}=await import("./role-queue-transaction.mjs");
  await withQueueLock(worktree,async ()=>{
    const current=await activeRoleWork(worktree);
    if (!current) throw new Error("Progress renewal requires one exact active handoff or batch");
    await renewRoleProgressLease({worktree,task:current.identity.task,handoff:current.identity.id,
      reason:"active role boundary"});
  });
}

if (process.argv[1]===fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error)=>{console.error(error.message);process.exitCode=2;});
}
