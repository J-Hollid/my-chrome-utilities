import { randomUUID } from "node:crypto";
import { access, mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { appendRoleStateTransition, roleStateTransition } from "./role-liveness.mjs";
import { clearStaleRoleActivity, completeRoleActivity, readRoleActivity,
  renewRoleProgressLease } from "./role-progress-lease.mjs";

const pause=(milliseconds)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));

export async function pathExists(file) {
  try { await access(file); return true; }
  catch (error) { if (error?.code==="ENOENT") return false; throw error; }
}

export async function writeQueueTransaction(file,value) {
  await mkdir(path.dirname(file),{recursive:true});
  const stage=path.join(path.dirname(file),`.${path.basename(file)}.${randomUUID()}.tmp`);
  await writeFile(stage,`${JSON.stringify(value,null,2)}\n`,{flag:"wx"});
  await rename(stage,file);
}

export async function clearQueueTransaction(file) {
  await unlink(file);
}

export function injectQueueFault(faultAt,phase) {
  if (faultAt===phase) throw new Error(`Injected queue fault at ${phase}`);
}

function processAlive(pid) {
  try { process.kill(pid,0); return true; }
  catch (error) { return error?.code==="EPERM"; }
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
      if (error?.code!=="EEXIST") throw error;
      let owner;
      try { owner=JSON.parse(await readFile(lockPath,"utf8")); }
      catch { await pause(10); continue; }
      if (!Number.isInteger(owner?.pid)||owner.pid<=0) { await pause(10); continue; }
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

export async function ensureRoleAudit(transaction) {
  roleStateTransition(transaction.transition);
  let history;
  try { history=JSON.parse(await readFile(transaction.transitionFile,"utf8")); }
  catch (error) { if (error?.code!=="ENOENT") throw error; }
  const same=(history?.transitions??[]).filter((entry)=>entry.at===transaction.transition.at&&
    entry.task===transaction.transition.task&&entry.handoff===transaction.transition.handoff);
  if (same.length>1||same.length===1&&JSON.stringify(same[0])!==JSON.stringify(transaction.transition)) {
    throw new Error("Role activation audit identity conflicts with durable history");
  }
  if (!same.length) await appendRoleStateTransition(transaction.transitionFile,transaction.transition);
}

export async function ensureRoleLease(worktree,task,handoff,reason) {
  const activity=await readRoleActivity(worktree),isCurrent=(item)=>item?.task===task&&
    item?.handoff===handoff,successorEvidence=[activity.progressLease,activity.command].some(isCurrent);
  if (successorEvidence&&![activity.progressLease,activity.command].filter(Boolean).every(isCurrent)) {
    throw new Error("Role activity conflicts with queue transaction");
  }
  if (isCurrent(activity.progressLease)) return;
  if (!successorEvidence) await clearStaleRoleActivity({worktree,nextTask:task,nextHandoff:handoff});
  await renewRoleProgressLease({worktree,task,handoff,reason});
}

async function recoverActivation(transaction,journalFile) {
  const state={prior:await pathExists(transaction.prior),queued:await pathExists(transaction.queued),
    stage:await pathExists(transaction.stage),promoted:await pathExists(transaction.promoted),
    retained:await pathExists(transaction.retained)};
  if (state.promoted&&state.retained&&!state.prior&&!state.queued&&!state.stage) {
    await ensureRoleAudit(transaction);
    await ensureRoleLease(transaction.worktree,transaction.nextTask,transaction.nextHandoff,
      "activated queued handoff");
    await clearQueueTransaction(journalFile);
    return {kind:"activation",status:"committed",path:transaction.promoted};
  }
  if (state.promoted&&state.stage&&!state.prior&&!state.queued&&!state.retained) {
    await rename(transaction.promoted,transaction.queued); await rename(transaction.stage,transaction.prior);
  } else if (state.stage&&state.queued&&!state.prior&&!state.promoted&&!state.retained) {
    await rename(transaction.stage,transaction.prior);
  } else if (!(state.prior&&state.queued&&!state.stage&&!state.promoted&&!state.retained)) {
    throw new Error("Role handoff activation journal conflicts with queue state");
  }
  await clearQueueTransaction(journalFile);
  return {kind:"activation",status:"rolled-back"};
}

async function exactContent(transaction,target) {
  if (await readFile(target,"utf8")!==transaction.content) {
    throw new Error("Role queue transaction content identity changed");
  }
}

async function recoverReceipt(transaction,journalFile) {
  const state={source:await pathExists(transaction.source),stage:await pathExists(transaction.stage),
    backup:await pathExists(transaction.backup),target:await pathExists(transaction.target)};
  if (state.target&&state.backup&&!state.source&&!state.stage) {
    await exactContent(transaction,transaction.target);
    await ensureRoleLease(transaction.worktree,transaction.task,transaction.handoff,"task receipt");
    await clearQueueTransaction(journalFile); await unlink(transaction.backup);
    return {kind:"receive",status:"committed",path:transaction.target};
  }
  if (state.backup&&!state.source&&!state.target) {
    await rename(transaction.backup,transaction.source);
    if (state.stage) await unlink(transaction.stage);
  } else if (state.source&&!state.backup&&!state.target) {
    if (state.stage) await unlink(transaction.stage);
  } else {
    throw new Error("Role handoff receipt journal conflicts with queue state");
  }
  await clearQueueTransaction(journalFile);
  return {kind:"receive",status:"rolled-back"};
}

async function recoverCompletion(transaction,journalFile) {
  const state={source:await pathExists(transaction.source),stage:await pathExists(transaction.stage),
    backup:await pathExists(transaction.backup),target:await pathExists(transaction.target)};
  if (state.target&&state.backup&&!state.source&&!state.stage) {
    await exactContent(transaction,transaction.target);
    await completeRoleActivity({worktree:transaction.worktree,task:transaction.task,
      handoff:transaction.handoff});
    await clearQueueTransaction(journalFile); await unlink(transaction.backup);
    return {kind:"completion",status:"committed",path:transaction.target};
  }
  if (state.backup&&!state.source&&!state.target) {
    await rename(transaction.backup,transaction.source);
    if (state.stage) await unlink(transaction.stage);
  } else if (state.source&&!state.backup&&!state.target) {
    if (state.stage) await unlink(transaction.stage);
  } else {
    throw new Error("Role handoff completion journal conflicts with queue state");
  }
  await clearQueueTransaction(journalFile);
  return {kind:"completion",status:"rolled-back"};
}

export async function settleQueueTransaction(journalFile) {
  let transaction;
  try { transaction=JSON.parse(await readFile(journalFile,"utf8")); }
  catch (error) { if (error?.code==="ENOENT") return null; throw error; }
  if (transaction?.version!==1||!transaction.phase) {
    throw new Error("Role queue transaction journal is malformed");
  }
  const kind=transaction.kind??"activation";
  if (kind==="activation") return recoverActivation(transaction,journalFile);
  if (kind==="receive") return recoverReceipt(transaction,journalFile);
  if (kind==="completion") return recoverCompletion(transaction,journalFile);
  if (kind.startsWith("batch-")) {
    const {recoverBatchQueueTransaction}=await import("./role-queue-batch-recovery.mjs");
    return recoverBatchQueueTransaction(transaction,journalFile);
  }
  throw new Error("Role queue transaction kind is not supported");
}

export async function withQueueLock(worktree,operation) {
  const stateDirectory=path.join(worktree,".swarmforge","role-liveness"),
    journalFile=path.join(stateDirectory,"activation.json"),lock=await acquireLock(stateDirectory);
  try {
    const recovery=await settleQueueTransaction(journalFile);
    return await operation({journalFile,stateDirectory,recovery});
  } finally { await releaseLock(lock); }
}
