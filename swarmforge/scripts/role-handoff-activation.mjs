import { access, mkdir, open, readdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

async function activePath(worktree) {
  const directory=path.join(worktree,".swarmforge","handoffs","inbox","in_process");
  const files=(await readdir(directory)).filter((name)=>name.endsWith(".handoff"));
  if (files.length !== 1) throw new Error("Stale recovery requires one exact active handoff");
  return path.join(directory,files[0]);
}

async function exists(file) {
  try { await access(file); return true; }
  catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

export async function activateExactQueuedHandoff({worktree,queuedHandoffPath,audit}) {
  const inbox=path.join(worktree,".swarmforge","handoffs","inbox");
  const newDirectory=path.join(inbox,"new"),inProcessDirectory=path.join(inbox,"in_process");
  if (path.dirname(queuedHandoffPath) !== newDirectory) {
    throw new Error("Stale recovery requires an exact queued handoff path");
  }
  const stateDirectory=path.join(worktree,".swarmforge","role-liveness");
  await mkdir(stateDirectory,{recursive:true});
  const lockPath=path.join(stateDirectory,"activation.lock");
  let lock;
  try { lock=await open(lockPath,"wx"); }
  catch (error) {
    if (error?.code === "EEXIST") throw new Error("Role handoff activation is already in progress");
    throw error;
  }
  let prior,stage,promoted,retained,priorStaged=false,promotedCurrent=false,retainedQueued=false;
  try {
    prior=await activePath(worktree);
    stage=path.join(stateDirectory,`.activation-${randomUUID()}.handoff`);
    promoted=path.join(inProcessDirectory,path.basename(queuedHandoffPath));
    retained=path.join(newDirectory,path.basename(prior));
    if (retained !== queuedHandoffPath && await exists(retained)) {
      throw new Error("Stale recovery would replace an existing queued handoff");
    }
    if (promoted !== prior && await exists(promoted)) {
      throw new Error("Stale recovery would replace an existing active handoff");
    }
    await rename(prior,stage); priorStaged=true;
    await rename(queuedHandoffPath,promoted); promotedCurrent=true;
    await rename(stage,retained); priorStaged=false; retainedQueued=true;
    await audit();
    return {promoted,retained,createdReceipt:false,createdReplacementHandoff:false};
  } catch (error) {
    if (promotedCurrent) await rename(promoted,queuedHandoffPath).catch(()=>{});
    if (priorStaged) await rename(stage,prior).catch(()=>{});
    else if (retainedQueued) await rename(retained,prior).catch(()=>{});
    throw error;
  } finally {
    await lock.close();
    await unlink(lockPath).catch(()=>{});
  }
}
