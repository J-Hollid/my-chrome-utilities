#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { activeRoleWork, handoffIdentity, setHandoffHeader } from "./role-handoff-identity.mjs";
import { receiveNextBatch } from "./role-handoff-batch-receive.mjs";
import { completeRoleActivity } from "./role-progress-lease.mjs";
import { injectQueueFault, pathExists, settleQueueTransaction, withQueueLock,
  writeQueueTransaction } from "./role-queue-transaction.mjs";

async function report(pathname,items) {
  for (const item of items) console.log(`COMPLETED: ${path.join(pathname,item.file)}`);
  console.log(`COMPLETED_BATCH: ${pathname}`);
}

export async function completeCurrentBatch(worktree,{faultAt=null}={}) {
  return withQueueLock(worktree,async ({journalFile,stateDirectory,recovery})=>{
    if (recovery?.kind==="batch-completion"&&recovery.status==="committed") {
      await report(recovery.path,recovery.items??[]); return recovery.path;
    }
    const current=await activeRoleWork(worktree);
    if (!current) throw new Error("NO_CURRENT_BATCH");
    if (current.kind==="task") throw new Error("CURRENT_WORK_IS_SINGLE_TASK: use done_with_current.sh.");
    const completedDirectory=path.join(worktree,".swarmforge","handoffs","inbox","completed"),
      target=path.join(completedDirectory,path.basename(current.file));
    await mkdir(completedDirectory,{recursive:true});
    if (await pathExists(target)) throw new Error("Completed batch identity already exists");
    const stage=path.join(stateDirectory,`.batch-completion-${randomUUID()}`),
      backup=path.join(stateDirectory,`.batch-completion-original-${randomUUID()}`),at=new Date().toISOString(),
      items=[];
    for (const file of current.files) {
      const text=await readFile(file,"utf8"),identity=handoffIdentity(text);
      items.push({file:path.basename(file),content:setHandoffHeader(text,"completed_at",at),
        id:identity.id,task:identity.task,priority:identity.priority??"50"});
    }
    const transaction={version:1,kind:"batch-completion",phase:"prepared",worktree,
      source:current.file,target,stage,backup,items,task:current.identity.task,
      handoff:current.identity.id};
    await writeQueueTransaction(journalFile,transaction); injectQueueFault(faultAt,"prepared");
    await mkdir(stage);
    for (const item of items) await writeFile(path.join(stage,item.file),item.content,{flag:"wx"});
    await writeQueueTransaction(journalFile,{...transaction,phase:"content-staged"});
    injectQueueFault(faultAt,"content-staged");
    await rename(current.file,backup);
    await writeQueueTransaction(journalFile,{...transaction,phase:"source-staged"});
    injectQueueFault(faultAt,"source-staged");
    await rename(stage,target);
    await writeQueueTransaction(journalFile,{...transaction,phase:"promoted-completed"});
    injectQueueFault(faultAt,"promoted-completed");
    await completeRoleActivity({worktree,task:current.identity.task,handoff:current.identity.id});
    await writeQueueTransaction(journalFile,{...transaction,phase:"activity-cleared"});
    injectQueueFault(faultAt,"activity-cleared");
    await settleQueueTransaction(journalFile); await report(target,items); return target;
  });
}

async function main(args) {
  if (args.length!==1) throw new Error("Use: role-handoff-batch-complete.mjs <worktree>");
  const worktree=path.resolve(args[0]); await completeCurrentBatch(worktree); await receiveNextBatch(worktree);
}

if (process.argv[1]===fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error)=>{console.error(error.message);process.exitCode=2;});
}
