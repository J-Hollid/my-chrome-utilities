#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { readdir, rename, rmdir } from "node:fs/promises";
import path from "node:path";

import { activeRoleWork } from "./role-handoff-identity.mjs";
import { injectQueueFault, pathExists, settleQueueTransaction, withQueueLock,
  writeQueueTransaction } from "./role-queue-transaction.mjs";

async function exactActivePath(worktree) {
  const directory=path.join(worktree,".swarmforge","handoffs","inbox","in_process");
  const files=(await readdir(directory)).filter((name)=>name.endsWith(".handoff"));
  if (files.length!==1) throw new Error("Stale recovery requires one exact active handoff");
  return path.join(directory,files[0]);
}

export { withQueueLock } from "./role-queue-transaction.mjs";

async function activateBatch({worktree,queuedHandoffPath,transitionFile,transition,nextTask,
  nextHandoff,journalFile,activeWork,faultAt}) {
  const inbox=path.join(worktree,".swarmforge","handoffs","inbox"),newDirectory=path.join(inbox,"new"),
    promoted=path.join(inbox,"in_process",path.basename(queuedHandoffPath)),
    stage=path.join(path.dirname(journalFile),`.activation-${randomUUID()}`),
    items=activeWork.items.map((item)=>({...item,retained:path.join(newDirectory,item.file)}));
  if (items.some(({file})=>file===path.basename(queuedHandoffPath))) {
    throw new Error("Stale batch recovery requires distinct handoff file identities");
  }
  const collisions=await Promise.all(items.map(({retained})=>pathExists(retained)));
  if (items.some((_,index)=>collisions[index])) {
    throw new Error("Stale batch recovery would replace a queued handoff");
  }
  const transaction={version:1,kind:"batch-activation",phase:"prepared",worktree,
    prior:activeWork.file,queued:queuedHandoffPath,stage,promoted,items,transitionFile,transition,
    nextTask,nextHandoff};
  await writeQueueTransaction(journalFile,transaction); injectQueueFault(faultAt,"prepared");
  await rename(activeWork.file,stage);
  await writeQueueTransaction(journalFile,{...transaction,phase:"prior-staged"});
  injectQueueFault(faultAt,"prior-staged");
  await rename(queuedHandoffPath,promoted);
  await writeQueueTransaction(journalFile,{...transaction,phase:"promoted-current"});
  injectQueueFault(faultAt,"promoted-current");
  for (const item of items) await rename(path.join(stage,item.file),item.retained);
  await rmdir(stage);
  await writeQueueTransaction(journalFile,{...transaction,phase:"swapped"});
  injectQueueFault(faultAt,"swapped");
  await settleQueueTransaction(journalFile);
  return {promoted,retained:items.map(({retained})=>retained),createdReceipt:false,
    createdReplacementHandoff:false};
}

export async function activateExactQueuedHandoffLocked({worktree,queuedHandoffPath,
  transitionFile,transition,nextTask,nextHandoff,journalFile,activeWork=null,faultAt=null}) {
  const current=activeWork??await activeRoleWork(worktree);
  if (current?.kind==="batch") return activateBatch({worktree,queuedHandoffPath,transitionFile,
    transition,nextTask,nextHandoff,journalFile,activeWork:current,faultAt});
  const inbox=path.join(worktree,".swarmforge","handoffs","inbox"),
    newDirectory=path.join(inbox,"new"),inProcessDirectory=path.join(inbox,"in_process");
  if (path.dirname(queuedHandoffPath)!==newDirectory) {
    throw new Error("Stale recovery requires an exact queued handoff path");
  }
  const prior=await exactActivePath(worktree),stage=path.join(path.dirname(journalFile),
    `.activation-${randomUUID()}.handoff`),promoted=path.join(inProcessDirectory,
    path.basename(queuedHandoffPath)),retained=path.join(newDirectory,path.basename(prior));
  if (path.basename(prior)===path.basename(queuedHandoffPath)) {
    throw new Error("Stale recovery requires distinct handoff file identities");
  }
  if (retained!==queuedHandoffPath&&await pathExists(retained)||promoted!==prior&&await pathExists(promoted)) {
    throw new Error("Stale recovery would replace an existing handoff");
  }
  const transaction={version:1,kind:"activation",phase:"prepared",worktree,prior,
    queued:queuedHandoffPath,stage,promoted,retained,transitionFile,transition,nextTask,nextHandoff};
  await writeQueueTransaction(journalFile,transaction);
  await rename(prior,stage);
  await writeQueueTransaction(journalFile,{...transaction,phase:"prior-staged"});
  await rename(queuedHandoffPath,promoted);
  await writeQueueTransaction(journalFile,{...transaction,phase:"promoted-current"});
  await rename(stage,retained);
  await writeQueueTransaction(journalFile,{...transaction,phase:"swapped"});
  await settleQueueTransaction(journalFile);
  return {promoted,retained,createdReceipt:false,createdReplacementHandoff:false};
}

export async function activateExactQueuedHandoff(options) {
  return withQueueLock(options.worktree,({journalFile})=>
    activateExactQueuedHandoffLocked({...options,journalFile}));
}
