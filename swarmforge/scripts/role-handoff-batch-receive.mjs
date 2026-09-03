#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { activeRoleWork, batchIdentity, handoffIdentity, setHandoffHeader } from
  "./role-handoff-identity.mjs";
import { ensureRoleLease, injectQueueFault, pathExists, settleQueueTransaction, withQueueLock,
  writeQueueTransaction } from "./role-queue-transaction.mjs";

const timestamp=()=>new Date().toISOString();

async function handoffFiles(directory) {
  const entries=await readdir(directory,{withFileTypes:true});
  return entries.filter((entry)=>entry.isFile()&&entry.name.endsWith(".handoff"))
    .map((entry)=>path.join(directory,entry.name)).sort();
}

async function printBatch(current) {
  console.log(`BATCH: ${current.file}`); console.log(`COUNT: ${current.files.length}`);
  console.log(`PRIORITY: ${current.identity.priority}`);
  for (const [index,file] of current.files.entries()) {
    const text=await readFile(file,"utf8"),identity=handoffIdentity(text);
    console.log(`\nBATCH_ITEM: ${index+1}`); console.log(`TASK: ${file}`);
    console.log(`FROM: ${identity.from??"unknown"}`); console.log(`TYPE: ${identity.type??"unknown"}`);
    console.log(`PRIORITY: ${identity.priority??"50"}`); console.log(`TASK_NAME: ${identity.task}`);
    console.log("PAYLOAD:"); process.stdout.write(text.split(/\r?\n\r?\n/u).slice(1).join("\n\n"));
  }
}

async function batchDirectory(inProcessDirectory) {
  const prefix=`batch_${timestamp().replace(/[-:]/gu,"").replace(/\.\d{3}Z$/u,"Z")}`;
  for (let index=1;index<1000000;index+=1) {
    const candidate=path.join(inProcessDirectory,`${prefix}_${String(index).padStart(6,"0")}`);
    if (!await pathExists(candidate)) return candidate;
  }
  throw new Error("Cannot allocate an exact role batch identity");
}

export async function receiveNextBatch(worktree,{faultAt=null}={}) {
  return withQueueLock(worktree,async ({journalFile,stateDirectory})=>{
    const inbox=path.join(worktree,".swarmforge","handoffs","inbox"),newDirectory=path.join(inbox,"new"),
      inProcessDirectory=path.join(inbox,"in_process"),completedDirectory=path.join(inbox,"completed");
    await Promise.all([newDirectory,inProcessDirectory,completedDirectory]
      .map((directory)=>mkdir(directory,{recursive:true})));
    const active=await activeRoleWork(worktree);
    if (active?.kind==="task") throw new Error("TASK_IN_PROCESS_IS_SINGLE: use ready_for_next.sh.");
    if (active) {
      await ensureRoleLease(worktree,active.identity.task,active.identity.id,"batch receipt");
      await printBatch(active); return active.file;
    }
    const queued=await handoffFiles(newDirectory);
    if (!queued.length) { console.log("NO_TASK"); return null; }
    const first=handoffIdentity(await readFile(queued[0],"utf8")),priority=first.priority??"50",
      selected=[];
    for (const source of queued) {
      const text=await readFile(source,"utf8"),identity=handoffIdentity(text);
      if ((identity.priority??"50")===priority) selected.push({source,text,identity,file:path.basename(source)});
    }
    const target=await batchDirectory(inProcessDirectory),targetName=path.basename(target);
    const stage=path.join(stateDirectory,`.batch-receipt-${randomUUID()}`),
      backupDirectory=path.join(stateDirectory,`.batch-receipt-original-${randomUUID()}`),
      at=timestamp(),items=selected.map(({source,text,identity,file})=>({source,file,
        backup:path.join(backupDirectory,file),content:setHandoffHeader(text,"dequeued_at",at),
        id:identity.id,task:identity.task,priority:identity.priority??"50"})),
      identity=batchIdentity(targetName,items),transaction={version:1,kind:"batch-receive",
        phase:"prepared",worktree,target,stage,backupDirectory,items,task:identity.task,
        handoff:identity.id};
    await writeQueueTransaction(journalFile,transaction); injectQueueFault(faultAt,"prepared");
    await mkdir(stage);
    for (const item of items) await writeFile(path.join(stage,item.file),item.content,{flag:"wx"});
    await writeQueueTransaction(journalFile,{...transaction,phase:"content-staged"});
    injectQueueFault(faultAt,"content-staged");
    await mkdir(backupDirectory);
    for (const item of items) await rename(item.source,item.backup);
    await writeQueueTransaction(journalFile,{...transaction,phase:"sources-staged"});
    injectQueueFault(faultAt,"sources-staged");
    await rename(stage,target);
    await writeQueueTransaction(journalFile,{...transaction,phase:"promoted-current"});
    injectQueueFault(faultAt,"promoted-current");
    await ensureRoleLease(worktree,identity.task,identity.id,"batch receipt");
    await writeQueueTransaction(journalFile,{...transaction,phase:"leased"});
    injectQueueFault(faultAt,"leased");
    await settleQueueTransaction(journalFile);
    const current=await activeRoleWork(worktree); await printBatch(current); return current.file;
  });
}

async function main(args) {
  if (args.length!==1) throw new Error("Use: role-handoff-batch-receive.mjs <worktree>");
  await receiveNextBatch(path.resolve(args[0]));
}

if (process.argv[1]===fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error)=>{console.error(error.message);process.exitCode=2;});
}
