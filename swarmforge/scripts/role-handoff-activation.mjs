#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { access, mkdir, open, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { appendRoleStateTransition, roleStateTransition } from "./role-liveness.mjs";
import { clearStaleRoleActivity, readRoleActivity, renewRoleProgressLease } from
  "./role-progress-lease.mjs";

const pause=(milliseconds)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));

async function exists(file) {
  try { await access(file); return true; }
  catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

async function atomicJson(file,value) {
  await mkdir(path.dirname(file),{recursive:true});
  const stage=path.join(path.dirname(file),`.${path.basename(file)}.${randomUUID()}.tmp`);
  await writeFile(stage,`${JSON.stringify(value,null,2)}\n`,{flag:"wx"});
  await rename(stage,file);
}

function processAlive(pid) {
  try { process.kill(pid,0); return true; }
  catch (error) { return error?.code === "EPERM"; }
}

async function acquireLock(stateDirectory) {
  const lockPath=path.join(stateDirectory,"activation.lock");
  await mkdir(stateDirectory,{recursive:true});
  for (let attempt=0;attempt<500;attempt+=1) {
    try {
      const handle=await open(lockPath,"wx");
      await handle.writeFile(`${JSON.stringify({version:1,pid:process.pid})}\n`);
      return {handle,lockPath};
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      let owner;
      try { owner=JSON.parse(await readFile(lockPath,"utf8")); }
      catch { await pause(10); continue; }
      if (!Number.isInteger(owner?.pid)||owner.pid<=0) {
        await pause(10); continue;
      }
      if (processAlive(owner.pid)) { await pause(10); continue; }
      await unlink(lockPath).catch(()=>{});
    }
  }
  throw new Error("Timed out waiting for role handoff activation");
}

async function releaseLock(lock) {
  await lock.handle.close();
  await unlink(lock.lockPath).catch(()=>{});
}

async function exactActivePath(worktree) {
  const directory=path.join(worktree,".swarmforge","handoffs","inbox","in_process");
  const files=(await readdir(directory)).filter((name)=>name.endsWith(".handoff"));
  if (files.length !== 1) throw new Error("Stale recovery requires one exact active handoff");
  return path.join(directory,files[0]);
}

async function ensureAudit(transaction) {
  roleStateTransition(transaction.transition);
  let history;
  try { history=JSON.parse(await readFile(transaction.transitionFile,"utf8")); }
  catch (error) { if (error?.code !== "ENOENT") throw error; }
  const same=(history?.transitions??[]).filter((entry)=>entry.at===transaction.transition.at&&
    entry.task===transaction.transition.task&&entry.handoff===transaction.transition.handoff);
  if (same.length>1||same.length===1&&JSON.stringify(same[0])!==JSON.stringify(transaction.transition)) {
    throw new Error("Role activation audit identity conflicts with durable history");
  }
  if (!same.length) await appendRoleStateTransition(transaction.transitionFile,transaction.transition);
}

async function ensureActivatedLease(transaction) {
  const activity=await readRoleActivity(transaction.worktree),lease=activity.progressLease,
    command=activity.command,newIdentity=(item)=>item?.task===transaction.nextTask&&
      item?.handoff===transaction.nextHandoff;
  const successorEvidence=[lease,command].some(newIdentity);
  if (successorEvidence&&![lease,command].filter(Boolean).every(newIdentity)) {
    throw new Error("Role activity conflicts with queue transaction");
  }
  if (newIdentity(lease)) return;
  if (!successorEvidence) await clearStaleRoleActivity({worktree:transaction.worktree,
    nextTask:transaction.nextTask,nextHandoff:transaction.nextHandoff});
  await renewRoleProgressLease({worktree:transaction.worktree,task:transaction.nextTask,
    handoff:transaction.nextHandoff,reason:"activated queued handoff"});
}

async function recoverTransaction(journalFile) {
  let transaction;
  try { transaction=JSON.parse(await readFile(journalFile,"utf8")); }
  catch (error) { if (error?.code === "ENOENT") return null; throw error; }
  if (transaction?.version!==1||!transaction.phase) {
    throw new Error("Role handoff activation journal is malformed");
  }
  const state={prior:await exists(transaction.prior),queued:await exists(transaction.queued),
    stage:await exists(transaction.stage),promoted:await exists(transaction.promoted),
    retained:await exists(transaction.retained)};
  if (state.promoted&&state.retained&&!state.prior&&!state.queued&&!state.stage) {
    await ensureAudit(transaction);
    await ensureActivatedLease(transaction);
    await unlink(journalFile);
    return {status:"committed",promoted:transaction.promoted,retained:transaction.retained};
  }
  if (state.promoted&&state.stage&&!state.prior&&!state.queued&&!state.retained) {
    await rename(transaction.promoted,transaction.queued);
    await rename(transaction.stage,transaction.prior);
  } else if (state.stage&&state.queued&&!state.prior&&!state.promoted&&!state.retained) {
    await rename(transaction.stage,transaction.prior);
  } else if (!(state.prior&&state.queued&&!state.stage&&!state.promoted&&!state.retained)) {
    throw new Error("Role handoff activation journal conflicts with queue state");
  }
  await unlink(journalFile);
  return {status:"rolled-back"};
}

export async function withQueueLock(worktree,operation) {
  const stateDirectory=path.join(worktree,".swarmforge","role-liveness");
  const journalFile=path.join(stateDirectory,"activation.json");
  const lock=await acquireLock(stateDirectory);
  try { await recoverTransaction(journalFile); return await operation({journalFile}); }
  finally { await releaseLock(lock); }
}

export async function activateExactQueuedHandoffLocked({worktree,queuedHandoffPath,
  transitionFile,transition,nextTask,nextHandoff,journalFile}) {
    const inbox=path.join(worktree,".swarmforge","handoffs","inbox");
    const newDirectory=path.join(inbox,"new"),inProcessDirectory=path.join(inbox,"in_process");
    if (path.dirname(queuedHandoffPath)!==newDirectory) {
      throw new Error("Stale recovery requires an exact queued handoff path");
    }
    const prior=await exactActivePath(worktree),stage=path.join(path.dirname(journalFile),
      `.activation-${randomUUID()}.handoff`);
    const promoted=path.join(inProcessDirectory,path.basename(queuedHandoffPath));
    const retained=path.join(newDirectory,path.basename(prior));
    if (path.basename(prior)===path.basename(queuedHandoffPath)) {
      throw new Error("Stale recovery requires distinct handoff file identities");
    }
    if (retained!==queuedHandoffPath&&await exists(retained) || promoted!==prior&&await exists(promoted)) {
      throw new Error("Stale recovery would replace an existing handoff");
    }
    const transaction={version:1,phase:"prepared",worktree,prior,queued:queuedHandoffPath,stage,
      promoted,retained,transitionFile,transition,nextTask,nextHandoff};
    await atomicJson(journalFile,transaction);
    await rename(prior,stage); await atomicJson(journalFile,{...transaction,phase:"prior-staged"});
    await rename(queuedHandoffPath,promoted);
    await atomicJson(journalFile,{...transaction,phase:"promoted-current"});
    await rename(stage,retained); await atomicJson(journalFile,{...transaction,phase:"swapped"});
    await ensureAudit(transaction); await ensureActivatedLease(transaction);
    await atomicJson(journalFile,{...transaction,phase:"audited"});
    await unlink(journalFile);
    return {promoted,retained,createdReceipt:false,createdReplacementHandoff:false};
}

export async function activateExactQueuedHandoff(options) {
  return withQueueLock(options.worktree,({journalFile})=>
    activateExactQueuedHandoffLocked({...options,journalFile}));
}
