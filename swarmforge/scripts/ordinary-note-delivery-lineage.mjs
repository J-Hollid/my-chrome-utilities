#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { handoffIdentity, handoffLineageDigest, setHandoffHeader } from
  "./role-handoff-identity.mjs";

const exec=promisify(execFile);

async function git(worktree,...args) {
  return (await exec("git",args,{cwd:worktree,encoding:"utf8"})).stdout.trim();
}

async function handoffFiles(directory) {
  let entries=[];
  try { entries=await readdir(directory,{withFileTypes:true}); }
  catch (error) { if (error?.code!=="ENOENT") throw error; }
  return entries.filter((entry)=>entry.isFile()&&entry.name.endsWith(".handoff"))
    .map((entry)=>path.join(directory,entry.name)).sort();
}

async function sourceIdentities(directory,senderRole) {
  const sources=[];
  for (const file of await handoffFiles(directory)) {
    const text=await readFile(file,"utf8"),identity=handoffIdentity(text),
      explicitTask=text.split(/\r?\n/u).find((line)=>line.startsWith("task: "))?.slice(6);
    identity.task=explicitTask;
    if (identity.type==="git_handoff"&&identity.recipient===senderRole) sources.push(identity);
  }
  return sources;
}

function exactDate(value,name) {
  const milliseconds=Date.parse(value??"");
  if (!Number.isFinite(milliseconds)) throw new Error(`Ordinary note has no exact ${name}`);
  return milliseconds;
}

async function canonicalSourceLineage(source,senderWorktree) {
  const handoff=source.handoff??source.id;
  if (!handoff||!source.task||!source.base||!source.commit) {
    throw new Error("Source Git handoff has a missing task, base, or commit");
  }
  let base,commit;
  try {
    base=await git(senderWorktree,"rev-parse",`${source.base}^{commit}`);
    commit=await git(senderWorktree,"rev-parse",`${source.commit}^{commit}`);
    await git(senderWorktree,"merge-base","--is-ancestor",base,commit);
  } catch {
    throw new Error("Source Git handoff base is not ancestral to its commit");
  }
  return {handoff,task:source.task,base,commit};
}

async function sourceForOlderNote({identity,senderWorktree,senderRole}) {
  const inbox=path.join(senderWorktree,".swarmforge","handoffs","inbox"),
    active=await sourceIdentities(path.join(inbox,"in_process"),senderRole);
  if (active.length>1) throw new Error("Ordinary note requires exactly one active source Git handoff");
  if (active.length===1) return active[0];
  const createdAt=exactDate(identity.created_at,"creation time"),completed=(await sourceIdentities(
    path.join(inbox,"completed"),senderRole)).filter((source)=>{
    const dequeuedAt=Date.parse(source.dequeued_at??""),completedAt=Date.parse(source.completed_at??"");
    return Number.isFinite(dequeuedAt)&&Number.isFinite(completedAt)&&
      dequeuedAt<=createdAt&&createdAt<=completedAt;
  });
  if (completed.length!==1) {
    throw new Error("Ordinary note requires exactly one completed source Git handoff active at creation");
  }
  return completed[0];
}

function withLineage(text,lineage) {
  const fields={handoff:lineage.handoff,task:lineage.task,base:lineage.base,
    commit:lineage.commit,digest:handoffLineageDigest(lineage)};
  return Object.entries(fields).reduce((output,[name,value])=>
    setHandoffHeader(output,`lineage-${name}`,value),text);
}

export async function resolveOrdinaryNoteDeliveryLineage({text,senderWorktree,senderRole}) {
  const identity=handoffIdentity(text);
  if (identity.type!=="note") return {text,lineage:null,changed:false};
  if (identity.lineage) {
    await canonicalSourceLineage(identity.lineage,senderWorktree);
    return {text,lineage:identity.lineage,changed:false};
  }
  const source=await sourceForOlderNote({identity,senderWorktree,senderRole}),
    lineage=await canonicalSourceLineage(source,senderWorktree);
  return {text:withLineage(text,lineage),lineage,changed:true};
}

async function main(args) {
  if (args.length!==3||args[0]!=="resolve-file") {
    throw new Error("Use: ordinary-note-delivery-lineage.mjs resolve-file <note> <sender-worktree>");
  }
  const file=path.resolve(args[1]),senderWorktree=path.resolve(args[2]),
    result=await resolveOrdinaryNoteDeliveryLineage({text:await readFile(file,"utf8"),
      senderWorktree,senderRole:process.env.SWARMFORGE_SENDER_ROLE});
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1]===new URL(import.meta.url).pathname) {
  main(process.argv.slice(2)).catch((error)=>{console.error(error.message);process.exitCode=1;});
}
