#!/usr/bin/env node
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { withQueueLock } from "./role-handoff-activation.mjs";

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

async function setHeader(file,name,value) {
  const text=await readFile(file,"utf8"),separator=text.search(/\r?\n\r?\n/u);
  const head=separator<0?text:text.slice(0,separator),body=separator<0?"":text.slice(separator);
  const lines=head.split(/\r?\n/u),prefix=`${name}: `,index=lines.findIndex((line)=>line.startsWith(prefix));
  if (index<0) lines.push(`${prefix}${value}`); else lines[index]=`${prefix}${value}`;
  const stage=path.join(path.dirname(file),`.${path.basename(file)}.${randomUUID()}.tmp`);
  await writeFile(stage,`${lines.join("\n")}${body||"\n"}`,{flag:"wx"}); await rename(stage,file);
}

export async function receiveNextTask(worktree) {
  return withQueueLock(worktree,async ()=>{
    const inbox=path.join(worktree,".swarmforge","handoffs","inbox"),newDirectory=path.join(inbox,"new"),
      inProcessDirectory=path.join(inbox,"in_process"),completed=path.join(inbox,"completed");
    await Promise.all([newDirectory,inProcessDirectory,completed].map((directory)=>mkdir(directory,{recursive:true})));
    const batches=(await readdir(inProcessDirectory,{withFileTypes:true})).filter((entry)=>
      entry.isDirectory()&&entry.name.startsWith("batch_"));
    if (batches.length) throw new Error("TASK_IN_PROCESS_IS_BATCH: use ready_for_next.sh or done_with_current.sh.");
    const active=await handoffFiles(inProcessDirectory);
    if (active.length>1) throw new Error("AMBIGUOUS_TASK_STATE: multiple tasks are already in process.");
    if (active.length===1) { await printTask(active[0]); return active[0]; }
    const queued=await handoffFiles(newDirectory);
    if (!queued.length) { console.log("NO_TASK"); return null; }
    const target=path.join(inProcessDirectory,path.basename(queued[0]));
    await rename(queued[0],target); await setHeader(target,"dequeued_at",new Date().toISOString());
    await printTask(target); return target;
  });
}

async function main(args) {
  if (args.length!==1) throw new Error("Use: role-handoff-receive.mjs <worktree>");
  await receiveNextTask(path.resolve(args[0]));
}

if (process.argv[1]===fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error)=>{console.error(error.message);process.exitCode=2;});
}
