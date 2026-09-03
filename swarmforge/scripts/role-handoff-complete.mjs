#!/usr/bin/env node
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { injectQueueFault, pathExists, settleQueueTransaction, withQueueLock,
  writeQueueTransaction } from "./role-queue-transaction.mjs";
import { receiveNextTask } from "./role-handoff-receive.mjs";
import { completeRoleActivity } from "./role-progress-lease.mjs";

function header(text,name) {
  const prefix=`${name}: `;
  return text.split(/\r?\n/u).find((line)=>line.startsWith(prefix))?.slice(prefix.length);
}

async function completedText(file) {
  const text=await readFile(file,"utf8"),separator=text.search(/\r?\n\r?\n/u);
  const head=separator<0?text:text.slice(0,separator),body=separator<0?"":text.slice(separator);
  const lines=head.split(/\r?\n/u),prefix="completed_at: ",index=lines.findIndex((line)=>line.startsWith(prefix));
  const value=`${prefix}${new Date().toISOString()}`;
  if (index<0) lines.push(value); else lines[index]=value;
  return {text:`${lines.join("\n")}${body||"\n"}`,handoff:header(text,"id"),task:header(text,"task")??header(text,"id")};
}

export async function completeCurrentTask(worktree,{faultAt=null}={}) {
  return withQueueLock(worktree,async ({journalFile,stateDirectory,recovery})=>{
    if (recovery?.kind==="completion"&&recovery.status==="committed") {
      console.log(`COMPLETED: ${recovery.path}`); return recovery.path;
    }
    const inbox=path.join(worktree,".swarmforge","handoffs","inbox"),
      activeDirectory=path.join(inbox,"in_process"),completedDirectory=path.join(inbox,"completed");
    await Promise.all([activeDirectory,completedDirectory].map((directory)=>mkdir(directory,{recursive:true})));
    const entries=await readdir(activeDirectory,{withFileTypes:true});
    if (entries.some((entry)=>entry.isDirectory()&&entry.name.startsWith("batch_"))) {
      throw new Error("CURRENT_WORK_IS_BATCH: use done_with_current.sh.");
    }
    const active=entries.filter((entry)=>entry.isFile()&&entry.name.endsWith(".handoff"));
    if (!active.length) throw new Error("NO_CURRENT_TASK");
    if (active.length>1) throw new Error("AMBIGUOUS_TASK_STATE: multiple tasks are in process.");
    const source=path.join(activeDirectory,active[0].name),target=path.join(completedDirectory,active[0].name);
    if (await pathExists(target)) throw new Error(`AMBIGUOUS_TASK_STATE: completed file already exists: ${target}`);
    const completed=await completedText(source),stage=path.join(stateDirectory,
      `.completion-${randomUUID()}.handoff`),backup=path.join(stateDirectory,
      `.completion-original-${randomUUID()}.handoff`),transaction={version:1,kind:"completion",
        phase:"prepared",worktree,source,target,stage,backup,content:completed.text,
        task:completed.task,handoff:completed.handoff};
    if (!completed.handoff||!completed.task) throw new Error("Current handoff has no exact identity");
    await writeQueueTransaction(journalFile,transaction); injectQueueFault(faultAt,"prepared");
    await writeFile(stage,completed.text,{flag:"wx"});
    await writeQueueTransaction(journalFile,{...transaction,phase:"content-staged"});
    injectQueueFault(faultAt,"content-staged");
    await rename(source,backup);
    await writeQueueTransaction(journalFile,{...transaction,phase:"source-staged"});
    injectQueueFault(faultAt,"source-staged");
    await rename(stage,target);
    await writeQueueTransaction(journalFile,{...transaction,phase:"promoted-completed"});
    injectQueueFault(faultAt,"promoted-completed");
    await completeRoleActivity({worktree,task:completed.task,handoff:completed.handoff});
    await writeQueueTransaction(journalFile,{...transaction,phase:"activity-cleared"});
    injectQueueFault(faultAt,"activity-cleared");
    await settleQueueTransaction(journalFile);
    console.log(`COMPLETED: ${target}`); return target;
  });
}

async function main(args) {
  if (args.length!==1) throw new Error("Use: role-handoff-complete.mjs <worktree>");
  const worktree=path.resolve(args[0]); await completeCurrentTask(worktree); await receiveNextTask(worktree);
}

if (process.argv[1]===fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error)=>{console.error(error.message);process.exitCode=2;});
}
