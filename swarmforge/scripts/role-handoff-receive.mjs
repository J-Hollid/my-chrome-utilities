#!/usr/bin/env node
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { injectQueueFault, pathExists, settleQueueTransaction, withQueueLock,
  writeQueueTransaction } from "./role-queue-transaction.mjs";
import { renewRoleProgressLease } from "./role-progress-lease.mjs";

function handoffFiles(directory) {
  return readdir(directory,{withFileTypes:true}).then((entries)=>entries.filter((entry)=>
    entry.isFile()&&entry.name.endsWith(".handoff")).map((entry)=>path.join(directory,entry.name)).sort());
}

function header(text,name) {
  const prefix=`${name}: `;
  return text.split(/\r?\n/u).find((line)=>line.startsWith(prefix))?.slice(prefix.length);
}

async function printTask(file) {
  const text=await readFile(file,"utf8"),body=text.split(/\r?\n\r?\n/u).slice(1).join("\n\n");
  console.log(`TASK: ${file}`); console.log(`FROM: ${header(text,"from")??"unknown"}`);
  console.log(`TYPE: ${header(text,"type")??"unknown"}`);
  console.log(`PRIORITY: ${header(text,"priority")??"50"}`);
  if (header(text,"task")) console.log(`TASK_NAME: ${header(text,"task")}`);
  if (header(text,"readiness")) console.log(`READINESS: ${header(text,"readiness")}`);
  console.log("PAYLOAD:"); process.stdout.write(body);
}

async function renewReceivedTask(worktree,file) {
  const text=await readFile(file,"utf8"),handoff=header(text,"id"),task=header(text,"task")??handoff;
  if (!handoff||!task) throw new Error("Received handoff has no exact identity");
  await renewRoleProgressLease({worktree,task,handoff,reason:"task receipt"});
}

function setHeader(text,name,value) {
  const separator=text.search(/\r?\n\r?\n/u);
  const head=separator<0?text:text.slice(0,separator),body=separator<0?"":text.slice(separator);
  const lines=head.split(/\r?\n/u),prefix=`${name}: `,index=lines.findIndex((line)=>line.startsWith(prefix));
  if (index<0) lines.push(`${prefix}${value}`); else lines[index]=`${prefix}${value}`;
  return `${lines.join("\n")}${body||"\n"}`;
}

export async function receiveNextTask(worktree,{faultAt=null}={}) {
  return withQueueLock(worktree,async ({journalFile,stateDirectory})=>{
    const inbox=path.join(worktree,".swarmforge","handoffs","inbox"),newDirectory=path.join(inbox,"new"),
      inProcessDirectory=path.join(inbox,"in_process"),completed=path.join(inbox,"completed");
    await Promise.all([newDirectory,inProcessDirectory,completed].map((directory)=>mkdir(directory,{recursive:true})));
    const batches=(await readdir(inProcessDirectory,{withFileTypes:true})).filter((entry)=>
      entry.isDirectory()&&entry.name.startsWith("batch_"));
    if (batches.length) throw new Error("TASK_IN_PROCESS_IS_BATCH: use ready_for_next.sh or done_with_current.sh.");
    const active=await handoffFiles(inProcessDirectory);
    if (active.length>1) throw new Error("AMBIGUOUS_TASK_STATE: multiple tasks are already in process.");
    if (active.length===1) {
      await renewReceivedTask(worktree,active[0]); await printTask(active[0]); return active[0];
    }
    const queued=await handoffFiles(newDirectory);
    if (!queued.length) { console.log("NO_TASK"); return null; }
    const source=queued[0],target=path.join(inProcessDirectory,path.basename(source));
    if (await pathExists(target)) throw new Error("Task receipt would replace an active handoff");
    const text=await readFile(source,"utf8"),content=setHeader(text,"dequeued_at",new Date().toISOString()),
      handoff=header(text,"id"),task=header(text,"task")??handoff,
      stage=path.join(stateDirectory,`.receipt-${randomUUID()}.handoff`),
      backup=path.join(stateDirectory,`.receipt-original-${randomUUID()}.handoff`),
      transaction={version:1,kind:"receive",phase:"prepared",worktree,source,target,stage,backup,
        content,task,handoff};
    if (!handoff||!task) throw new Error("Received handoff has no exact identity");
    await writeQueueTransaction(journalFile,transaction); injectQueueFault(faultAt,"prepared");
    await writeFile(stage,content,{flag:"wx"});
    await writeQueueTransaction(journalFile,{...transaction,phase:"content-staged"});
    injectQueueFault(faultAt,"content-staged");
    await rename(source,backup);
    await writeQueueTransaction(journalFile,{...transaction,phase:"source-staged"});
    injectQueueFault(faultAt,"source-staged");
    await rename(stage,target);
    await writeQueueTransaction(journalFile,{...transaction,phase:"promoted-current"});
    injectQueueFault(faultAt,"promoted-current");
    await renewReceivedTask(worktree,target);
    await writeQueueTransaction(journalFile,{...transaction,phase:"leased"});
    injectQueueFault(faultAt,"leased");
    await settleQueueTransaction(journalFile); await printTask(target); return target;
  });
}

async function main(args) {
  if (args.length!==1) throw new Error("Use: role-handoff-receive.mjs <worktree>");
  await receiveNextTask(path.resolve(args[0]));
}

if (process.argv[1]===fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error)=>{console.error(error.message);process.exitCode=2;});
}
