import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export function handoffIdentity(text) {
  const headers={};
  for (const line of text.split(/\r?\n/u)) {
    if (!line) break;
    const separator=line.indexOf(": ");
    if (separator>0) headers[line.slice(0,separator)]=line.slice(separator+2);
  }
  if (!headers.id) throw new Error("Role handoff has no id");
  return {...headers,task:headers.task??headers.id};
}

export function setHandoffHeader(text,name,value) {
  const separator=text.search(/\r?\n\r?\n/u),head=separator<0?text:text.slice(0,separator),
    body=separator<0?"":text.slice(separator),lines=head.split(/\r?\n/u),prefix=`${name}: `,
    index=lines.findIndex((line)=>line.startsWith(prefix));
  if (index<0) lines.push(`${prefix}${value}`); else lines[index]=`${prefix}${value}`;
  return `${lines.join("\n")}${body||"\n"}`;
}

export function batchIdentity(directoryName,items) {
  const exactItems=items.map(({file,id,task,priority})=>({file,id,task,priority}));
  const digest=createHash("sha256").update(JSON.stringify({directory:directoryName,items:exactItems}))
    .digest("hex");
  return {id:`batch:${digest}`,task:`batch:${digest}`,priority:exactItems[0]?.priority??"50"};
}

async function handoffFiles(directory) {
  const entries=await readdir(directory,{withFileTypes:true});
  return entries.filter((entry)=>entry.isFile()&&entry.name.endsWith(".handoff"))
    .map((entry)=>path.join(directory,entry.name)).sort();
}

export async function batchRoleWork(directory) {
  const files=await handoffFiles(directory);
  if (!files.length) throw new Error("Active role batch has no handoffs");
  const items=[];
  for (const file of files) {
    const identity=handoffIdentity(await readFile(file,"utf8"));
    items.push({file:path.basename(file),id:identity.id,task:identity.task,
      priority:identity.priority??"50"});
  }
  return {kind:"batch",file:directory,files,items,
    identity:batchIdentity(path.basename(directory),items)};
}

export async function activeRoleWork(worktree) {
  const directory=path.join(worktree,".swarmforge","handoffs","inbox","in_process");
  let entries=[];
  try { entries=await readdir(directory,{withFileTypes:true}); }
  catch (error) { if (error?.code!=="ENOENT") throw error; }
  const files=entries.filter((entry)=>entry.isFile()&&entry.name.endsWith(".handoff")),
    batches=entries.filter((entry)=>entry.isDirectory()&&entry.name.startsWith("batch_"));
  if (files.length+batches.length>1) throw new Error("Role liveness found multiple active handoffs");
  if (files.length) {
    const file=path.join(directory,files[0].name);
    return {kind:"task",file,files:[file],identity:handoffIdentity(await readFile(file,"utf8"))};
  }
  return batches.length?batchRoleWork(path.join(directory,batches[0].name)):null;
}
