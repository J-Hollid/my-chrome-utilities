import { execFile } from "node:child_process";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";

const execute=promisify(execFile);

function descendantPids(root,rows) {
  const children=new Map();
  for (const {pid,parent} of rows) children.set(parent,[...(children.get(parent)??[]),pid]);
  const result=[],pending=[root];
  while (pending.length) {
    const parent=pending.shift();
    for (const child of children.get(parent)??[]) { result.push(child); pending.push(child); }
  }
  return result;
}

function processRows(text) {
  return text.trim().split(/\r?\n/u).filter(Boolean).map((line)=>{
    const [pid,parent]=line.trim().split(/\s+/u).map(Number);
    return {pid,parent};
  }).filter(({pid,parent})=>Number.isInteger(pid)&&Number.isInteger(parent));
}

async function atomicWrite(file,value) {
  await mkdir(path.dirname(file),{recursive:true});
  const stage=path.join(path.dirname(file),`.${path.basename(file)}.${randomUUID()}.tmp`);
  await writeFile(stage,`${JSON.stringify(value,null,2)}\n`,{flag:"wx"});
  await rename(stage,file);
}

export async function observeRoleCommand({socket,session,task,handoff,run=execute}) {
  let pane;
  try {
    const result=await run("tmux",["-S",socket,"list-panes","-t",session,"-F","#{pane_pid}"]);
    pane=Number(String(result.stdout??"").trim().split(/\s+/u)[0]);
  } catch { return null; }
  if (!Number.isInteger(pane)||pane<=0) return null;
  const processes=await run("ps",["-eo","pid=,ppid="]);
  const descendants=descendantPids(pane,processRows(String(processes.stdout??"")));
  const pid=descendants.at(-1);
  return pid == null ? null : {id:`process:${pid}`,pid,task,handoff};
}

export async function publishRoleActivity({worktree,command,progressLease=null}) {
  const document={version:1,command,progressLease};
  await atomicWrite(path.join(worktree,".swarmforge","role-liveness","activity.json"),document);
  return structuredClone(document);
}
