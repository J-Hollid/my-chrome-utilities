import { mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";

import { completeRoleActivity } from "./role-progress-lease.mjs";
import { clearQueueTransaction, ensureRoleAudit, ensureRoleLease, pathExists } from
  "./role-queue-transaction.mjs";

async function exactBatchContent(transaction,directory) {
  const names=(await readdir(directory)).sort(),expected=transaction.items.map(({file})=>file).sort();
  if (JSON.stringify(names)!==JSON.stringify(expected)) {
    throw new Error("Role batch transaction file identity changed");
  }
  for (const item of transaction.items) {
    const file=path.join(directory,item.file);
    if (!await pathExists(file)||await readFile(file,"utf8")!==item.content) {
      throw new Error("Role batch transaction content identity changed");
    }
  }
}

async function restoreBatchSources(transaction) {
  await mkdir(path.dirname(transaction.items[0].source),{recursive:true});
  for (const item of transaction.items) {
    const source=await pathExists(item.source),backup=await pathExists(item.backup);
    if (source&&backup) throw new Error("Role batch receipt has duplicate source identity");
    if (backup) await rename(item.backup,item.source);
  }
  await rm(transaction.stage,{recursive:true,force:true});
  await rm(transaction.backupDirectory,{recursive:true,force:true});
}

async function recoverReceipt(transaction,journalFile) {
  if (await pathExists(transaction.target)) {
    for (const item of transaction.items) {
      if (await pathExists(item.source)||!await pathExists(item.backup)) {
        throw new Error("Role batch receipt journal conflicts with queue state");
      }
    }
    await exactBatchContent(transaction,transaction.target);
    await ensureRoleLease(transaction.worktree,transaction.task,transaction.handoff,"batch receipt");
    await clearQueueTransaction(journalFile);
    await rm(transaction.backupDirectory,{recursive:true,force:true});
    return {kind:"batch-receive",status:"committed",path:transaction.target};
  }
  await restoreBatchSources(transaction); await clearQueueTransaction(journalFile);
  return {kind:"batch-receive",status:"rolled-back"};
}

async function recoverCompletion(transaction,journalFile) {
  const source=await pathExists(transaction.source),backup=await pathExists(transaction.backup),
    target=await pathExists(transaction.target);
  if (target&&backup&&!source) {
    await exactBatchContent(transaction,transaction.target);
    await completeRoleActivity({worktree:transaction.worktree,task:transaction.task,
      handoff:transaction.handoff});
    await clearQueueTransaction(journalFile); await rm(transaction.backup,{recursive:true,force:true});
    return {kind:"batch-completion",status:"committed",path:transaction.target,
      items:transaction.items.map(({file})=>({file}))};
  }
  if (backup&&!source&&!target) await rename(transaction.backup,transaction.source);
  else if (!(source&&!backup&&!target)) {
    throw new Error("Role batch completion journal conflicts with queue state");
  }
  await rm(transaction.stage,{recursive:true,force:true}); await clearQueueTransaction(journalFile);
  return {kind:"batch-completion",status:"rolled-back"};
}

async function recoverActivation(transaction,journalFile) {
  const promoted=await pathExists(transaction.promoted),queued=await pathExists(transaction.queued),
    prior=await pathExists(transaction.prior),stage=await pathExists(transaction.stage),
    retained=await Promise.all(transaction.items.map(({retained})=>pathExists(retained)));
  if (promoted&&!queued&&!prior&&!stage&&retained.every(Boolean)) {
    await ensureRoleAudit(transaction);
    await ensureRoleLease(transaction.worktree,transaction.nextTask,transaction.nextHandoff,
      "activated queued handoff");
    await clearQueueTransaction(journalFile);
    return {kind:"batch-activation",status:"committed",path:transaction.promoted};
  }
  if (prior&&queued&&!promoted&&!stage&&retained.every((value)=>!value)) {
    await clearQueueTransaction(journalFile);
    return {kind:"batch-activation",status:"rolled-back"};
  }
  if (promoted&&!queued) await rename(transaction.promoted,transaction.queued);
  else if (promoted||!queued) throw new Error("Role batch activation has conflicting queued identity");
  if (!prior) await mkdir(transaction.prior,{recursive:true});
  for (const [index,item] of transaction.items.entries()) {
    const source=retained[index]?item.retained:path.join(transaction.stage,item.file);
    if (!await pathExists(source)) throw new Error("Role batch activation lost a batch item");
    await rename(source,path.join(transaction.prior,item.file));
  }
  await rm(transaction.stage,{recursive:true,force:true}); await clearQueueTransaction(journalFile);
  return {kind:"batch-activation",status:"rolled-back"};
}

export function recoverBatchQueueTransaction(transaction,journalFile) {
  if (transaction.kind==="batch-receive") return recoverReceipt(transaction,journalFile);
  if (transaction.kind==="batch-completion") return recoverCompletion(transaction,journalFile);
  if (transaction.kind==="batch-activation") return recoverActivation(transaction,journalFile);
  throw new Error("Role batch queue transaction kind is not supported");
}
