#!/usr/bin/env node

import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const stableValue = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;
const sha40 = /^[0-9a-f]{40}$/u;
const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const generatedFields = new Set(["id","recipient","created_at","enqueued_at",
  "dequeued_at","completed_at","content-digest"]);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort()
    .map((key)=>[key,canonical(value[key])]));
  return value;
}

export function authorityDigest(value) {
  const withoutDigest={...value};
  delete withoutDigest.digest;
  return createHash("sha256").update(JSON.stringify(canonical(withoutDigest))).digest("hex");
}

export function classifyOutcome(input) {
  const crossings=[];
  if (!input.reversible) crossings.push("irreversible response");
  if (!input.preservesBehavior) crossings.push("user-visible behavior change");
  if (input.externalRiskIncrease) crossings.push("material external risk increase");
  if (input.needsUserOnlyAuthority) crossings.push("user-only authority, credential, or information");
  if (input.materiallyExpandsScope) crossings.push("material global scope or cost expansion");
  if (input.weakensEvidence) crossings.push("safety or evidence weakening");
  return crossings.length ? {decision:"escalate",crossings} : {decision:"proceed",crossings:[]};
}

export function boundedExecutionScope({catalogueSize,authorizedTasks,prerequisiteTasks,
  broadTaskThreshold=50}) {
  const tasks=[...new Set([...authorizedTasks,...prerequisiteTasks])];
  return { catalogueSize, tasks, taskCount:tasks.length,
    materiallyBroad:tasks.length>=broadTaskThreshold };
}

function required(headers,key) {
  const value=headers[key];
  if (typeof value!=="string" || !value.trim()) throw new Error(`Unblocker requires ${key}`);
  return value;
}

export function validateUnblockerDraft(headers,body="") {
  const requiredFields=["type","to","priority","name","authority","authority-commit","task",
    "active-handoff","mode","supersedes","message"];
  for (const field of requiredFields) required(headers,field);
  if (headers.type!=="unblocker") throw new Error("Unblocker type must be unblocker");
  if (headers.to.includes(",") || !stableValue.test(headers.to)) {
    throw new Error("Unblocker requires exactly one canonical recipient");
  }
  if (headers.priority!=="00") throw new Error("Unblocker priority must be 00");
  for (const field of ["name","authority","task","active-handoff","supersedes"]) {
    if (!stableValue.test(headers[field])) throw new Error(`Unblocker ${field} must be canonical`);
  }
  if (!sha40.test(headers["authority-commit"])) {
    throw new Error("Unblocker authority-commit must be a full immutable commit");
  }
  if (!["resume","replace"].includes(headers.mode)) throw new Error("Unblocker mode must be resume or replace");
  if (headers.mode==="replace") {
    required(headers,"replacement-handoff");
    if (!stableValue.test(headers["replacement-handoff"]) ||
      headers.supersedes!==headers["active-handoff"]) {
      throw new Error("Replace unblocker must bind the exact active and replacement handoffs");
    }
  } else if (headers["replacement-handoff"]) {
    throw new Error("Resume unblocker cannot bind a replacement handoff");
  }
  if ([...headers.message].length>80) throw new Error("Unblocker message exceeds 80 characters");
  if (Buffer.byteLength(body,"utf8")>4000) throw new Error("Unblocker detail exceeds 4000 bytes");
  return {mode:headers.mode,recipient:headers.to};
}

export function validateAuthorityClaim({headers,grant,active,authorityCommitPresentOnBase,
  authorityCommitAncestral}) {
  validateUnblockerDraft(headers,headers.body??"");
  if (!digestPattern.test(grant?.digest??"") || grant.digest!==`sha256:${authorityDigest(grant)}`) {
    throw new Error("Authority grant digest is invalid or modified");
  }
  if (grant.name!==headers.authority) throw new Error("Authority name does not match the registered grant");
  const issuer=headers.from??active.from;
  if (!grant.issuerRoles?.includes(issuer)) throw new Error("Unblocker issuer is not authorized");
  if (!authorityCommitPresentOnBase) throw new Error("Candidate-only authority grant is not trusted");
  if (!authorityCommitAncestral) throw new Error("Authority commit is outside the accepted ancestry");
  if (active.from!==issuer || active.recipient!==headers.to || active.task!==headers.task ||
    active.id!==headers["active-handoff"]) {
    throw new Error("Unblocker authority binding does not match the active handoff");
  }
  return {trusted:true,authority:grant.name,issuer};
}

function parseHandoff(content) {
  const [header,body=""]=content.split(/\n\n/u,2);
  const headers={};
  for (const line of header.split(/\r?\n/u)) {
    const index=line.indexOf(": ");
    if (index>0) headers[line.slice(0,index)]=line.slice(index+2);
  }
  return {headers,body,content};
}

function renderHandoff(headers,body) {
  const preferred=["id","from","to","recipient","priority","type","name","authority",
    "authority-commit","task","active-handoff","mode","supersedes","replacement-handoff",
    "message","content-digest","created_at","enqueued_at","dequeued_at","completed_at"];
  const keys=[...preferred.filter((key)=>headers[key]),...Object.keys(headers)
    .filter((key)=>!preferred.includes(key)).sort()];
  return `${keys.map((key)=>`${key}: ${headers[key]}`).join("\n")}\n\n${body}`;
}

function contentDigest(headers,body) {
  const authored=Object.fromEntries(Object.entries(headers).filter(([key])=>!generatedFields.has(key)));
  return createHash("sha256").update(JSON.stringify(canonical({headers:authored,body}))).digest("hex");
}

function bindingKey(headers) {
  return [headers.name,headers.to,headers.task,headers["active-handoff"]].join("--")
    .replaceAll(/[^A-Za-z0-9._-]/gu,"_");
}

async function exists(file) {
  try { await stat(file); return true; } catch (error) { if (error.code==="ENOENT") return false; throw error; }
}

async function withQueueLock(queueRoot,operation) {
  const lock=path.join(queueRoot,"unblockers.lock");
  await mkdir(queueRoot,{recursive:true});
  for (let attempt=0;attempt<100;attempt+=1) {
    try {
      const handle=await open(lock,"wx");
      await handle.writeFile(JSON.stringify({pid:process.pid,token:randomUUID()}));
      try { return await operation(); }
      finally { await handle.close(); await rm(lock,{force:true}); }
    } catch (error) {
      if (error.code!=="EEXIST") throw error;
      try {
        const owner=JSON.parse(await readFile(lock,"utf8"));
        try { process.kill(owner.pid,0); }
        catch (signalError) { if (signalError.code==="ESRCH") await rm(lock,{force:true}); }
      } catch {}
      await new Promise((resolve)=>setTimeout(resolve,20));
    }
  }
  throw new Error("Timed out waiting for unblocker queue lock");
}

async function queueFiles(queueRoot,state) {
  const directory=path.join(queueRoot,"unblockers",state);
  await mkdir(directory,{recursive:true});
  return (await readdir(directory)).filter((name)=>name.endsWith(".handoff")).sort()
    .map((name)=>path.join(directory,name));
}

async function matchingBindings(queueRoot,key) {
  const matches=[];
  for (const state of ["new","in_process","completed","failed"]) {
    for (const file of await queueFiles(queueRoot,state)) {
      const parsed=parseHandoff(await readFile(file,"utf8"));
      if (bindingKey(parsed.headers)===key) matches.push({state,file,...parsed});
    }
  }
  return matches;
}

async function atomicWrite(target,content) {
  await mkdir(path.dirname(target),{recursive:true});
  const stage=path.join(path.dirname(target),`.${path.basename(target)}.${randomUUID()}.tmp`);
  await writeFile(stage,content,{flag:"wx"});
  await rename(stage,target);
}

export async function deliverUnblocker({queueRoot,headers,body="",grant,active,
  authorityCommitPresentOnBase,authorityCommitAncestral,now=()=>new Date().toISOString()}) {
  validateUnblockerDraft(headers,body);
  if (grant.digest!==`sha256:${authorityDigest(grant)}`) throw new Error("Authority grant digest is invalid");
  if (!grant.issuerRoles?.includes(headers.from??active.from)) throw new Error("Unblocker issuer is not authorized");
  const digest=contentDigest(headers,body),key=bindingKey(headers);
  return withQueueLock(queueRoot,async()=>{
    const matches=await matchingBindings(queueRoot,key);
    const same=matches.find(({headers:item})=>item["content-digest"]===digest);
    if (same?.state==="completed") return {status:"completed-duplicate",filename:path.basename(same.file),
      activeRetained:true,notification:""};
    if (same) return {status:same.state==="in_process"?"already-claimed":"queued-duplicate",
      filename:path.basename(same.file),activeRetained:true,notification:""};
    if (matches.length) throw new Error("Unblocker binding collision with different content");
    const filename=`00_${key}.handoff`;
    const created={...headers,"content-digest":digest,created_at:now(),enqueued_at:now()};
    if (active.id!==headers["active-handoff"] || active.task!==headers.task ||
      active.recipient!==headers.to || active.from!==(headers.from??active.from)) {
      const target=path.join(queueRoot,"unblockers","failed",filename);
      await atomicWrite(target,renderHandoff({...created,"failure-reason":"stale binding"},body));
      return {status:"stale",filename,activeRetained:true,notification:""};
    }
    validateAuthorityClaim({headers,grant,active,authorityCommitPresentOnBase,authorityCommitAncestral});
    const target=path.join(queueRoot,"unblockers","new",filename);
    await atomicWrite(target,renderHandoff(created,body));
    const shortCommit=headers["authority-commit"].slice(0,10);
    return {status:"queued",filename,activeRetained:true,
      notification:`USER-AUTHORIZED UNBLOCKER ${headers.name} under ${headers.authority}@${shortCommit} for ${headers.task} handoff ${headers["active-handoff"]}: ${headers.message}. Handle now at the next safe boundary with unblocker_claim.sh.`};
  });
}

export async function claimUnblocker({queueRoot,active,now=()=>new Date().toISOString()}) {
  return withQueueLock(queueRoot,async()=>{
    const inProcess=await queueFiles(queueRoot,"in_process");
    if (inProcess.length) {
      const file=inProcess[0],parsed=parseHandoff(await readFile(file,"utf8"));
      const owner=Number(parsed.headers.claimed_by);
      let alive=Number.isInteger(owner)&&owner>0;
      if (alive) try { process.kill(owner,0); } catch (error) { if (error.code==="ESRCH") alive=false; else throw error; }
      if (alive) return {status:"already-claimed",file};
      await atomicWrite(file,renderHandoff({...parsed.headers,claimed_by:String(process.pid),
        claim_token:randomUUID(),dequeued_at:now()},parsed.body));
      return {status:"claimed",reclaimed:true,file,headers:parsed.headers,body:parsed.body};
    }
    for (const file of await queueFiles(queueRoot,"new")) {
      const parsed=parseHandoff(await readFile(file,"utf8"));
      if (parsed.headers["active-handoff"]!==active.id || parsed.headers.task!==active.task) {
        const failed=path.join(queueRoot,"unblockers","failed",path.basename(file));
        await rename(file,failed);
        continue;
      }
      const target=path.join(queueRoot,"unblockers","in_process",path.basename(file));
      await atomicWrite(target,renderHandoff({...parsed.headers,claimed_by:String(process.pid),
        claim_token:randomUUID(),dequeued_at:now()},parsed.body));
      await rm(file,{force:true});
      return {status:"claimed",file:target,headers:parsed.headers,body:parsed.body};
    }
    return {status:"none"};
  });
}

export async function completeUnblocker({queueRoot,active,replacement,ordinaryState,
  now=()=>new Date().toISOString()}) {
  return withQueueLock(queueRoot,async()=>{
    const claimed=await queueFiles(queueRoot,"in_process");
    if (claimed.length!==1) throw new Error("Exactly one claimed unblocker is required");
    const file=claimed[0],parsed=parseHandoff(await readFile(file,"utf8"));
    if (parsed.headers["active-handoff"]!==active.id) throw new Error("Claimed unblocker is stale");
    if (parsed.headers.mode==="replace") {
      if (!replacement || replacement.id!==parsed.headers["replacement-handoff"] ||
        replacement.from!==active.from || replacement.recipient!==active.recipient ||
        parsed.headers.supersedes!==active.id) throw new Error("Bound replacement handoff is unavailable");
    }
    const target=path.join(queueRoot,"unblockers","completed",path.basename(file));
    await atomicWrite(target,renderHandoff({...parsed.headers,completed_at:now()},parsed.body));
    await rm(file,{force:true});
    if (parsed.headers.mode==="replace" && ordinaryState) {
      await mkdir(ordinaryState.completedDir,{recursive:true});
      await mkdir(ordinaryState.inProcessDir,{recursive:true});
      await rename(ordinaryState.activeFile,path.join(ordinaryState.completedDir,
        path.basename(ordinaryState.activeFile)));
      await rename(ordinaryState.replacementFile,path.join(ordinaryState.inProcessDir,
        path.basename(ordinaryState.replacementFile)));
    }
    return parsed.headers.mode==="resume"
      ? {status:"resume",active}
      : {status:"replace",archivedActive:active,replacement};
  });
}

async function git(root,...args) {
  return (await exec("git",args,{cwd:root,encoding:"utf8"})).stdout.trim();
}

async function authorityAt(root,commit,name) {
  const relative=`docs/swarmforge-authorities/${name}.json`;
  return JSON.parse(await git(root,"show",`${commit}:${relative}`));
}

async function projectRoot(repositoryRoot) {
  if (process.env.SWARMFORGE_PROJECT_ROOT) return path.resolve(process.env.SWARMFORGE_PROJECT_ROOT);
  if (await exists(path.join(repositoryRoot,".swarmforge","roles.tsv"))) return repositoryRoot;
  const common=await git(repositoryRoot,"rev-parse","--git-common-dir");
  const absolute=path.isAbsolute(common)?common:path.resolve(repositoryRoot,common);
  const candidate=path.dirname(absolute);
  if (await exists(path.join(candidate,".swarmforge","roles.tsv"))) return candidate;
  throw new Error("Cannot find SwarmForge project root");
}

async function roleRows(root) {
  const rows=(await readFile(path.join(root,".swarmforge","roles.tsv"),"utf8")).trim().split(/\r?\n/u);
  return new Map(rows.filter(Boolean).map((line)=>{const fields=line.split("\t");
    return [fields[0],{role:fields[0],worktreePath:fields[2]}];}));
}

async function activeHandoff(root,id) {
  const activeDir=path.join(root,".swarmforge","handoffs","inbox","in_process");
  for (const name of await readdir(activeDir)) {
    if (!name.endsWith(".handoff")) continue;
    const file=path.join(activeDir,name),parsed=parseHandoff(await readFile(file,"utf8"));
    if (parsed.headers.id===id) return {...parsed.headers,path:file};
  }
  throw new Error(`Active handoff ${id} is unavailable`);
}

function draftFromFile(content) {
  const parsed=parseHandoff(content);
  return {headers:parsed.headers,body:parsed.body};
}

async function cli(args) {
  const [command,...rest]=args;
  const root=process.cwd();
  if (command==="send") {
    const draft=draftFromFile(await readFile(path.resolve(rest[0]),"utf8"));
    validateUnblockerDraft(draft.headers,draft.body);
    const sender=process.env.SWARMFORGE_ROLE;
    if (!sender) throw new Error("Set SWARMFORGE_ROLE");
    const sharedRoot=await projectRoot(root),roles=await roleRows(sharedRoot);
    const recipient=roles.get(draft.headers.to);
    if (!recipient?.worktreePath) throw new Error(`Unknown recipient ${draft.headers.to}`);
    const active=await activeHandoff(recipient.worktreePath,draft.headers["active-handoff"]);
    const authorityCommit=draft.headers["authority-commit"];
    const grant=await authorityAt(root,authorityCommit,draft.headers.authority);
    const base=active.base??active.commit;
    let ancestral=true;
    try { await git(root,"merge-base","--is-ancestor",authorityCommit,base); } catch { ancestral=false; }
    let presentOnBase=true;
    try { await authorityAt(root,base,draft.headers.authority); } catch { presentOnBase=false; }
    const headers={...draft.headers,from:sender};
    validateAuthorityClaim({headers,grant,active:{id:active.id,from:active.from,
      recipient:active.recipient,task:active.task},authorityCommitPresentOnBase:presentOnBase,
      authorityCommitAncestral:ancestral});
    const handoffState=path.join(root,".swarmforge","handoffs");
    const sequence=(await exec("bb",[path.join(root,"swarmforge/scripts/handoff_lib.bb"),
      "next-sequence"],{cwd:root,encoding:"utf8",env:process.env})).stdout.trim();
    const date=new Date(),timestamp=date.toISOString().replaceAll(/[-:]/gu,"").replace(/\.\d{3}Z$/u,"Z");
    const id=`${timestamp}_${sequence}_from_${sender}`;
    const finalized={id,...headers,"content-digest":contentDigest(headers,draft.body),created_at:date.toISOString()};
    const filename=`00_${timestamp}_${sequence}_from_${sender}_to_${headers.to}.handoff`;
    await atomicWrite(path.join(handoffState,"outbox",filename),renderHandoff(finalized,draft.body));
    console.log(`UNBLOCKER QUEUED: ${path.join(handoffState,"outbox",filename)}`);
    return;
  }
  if (command==="deliver-file") {
    const [source,recipientRoot,sender]=rest;
    const parsed=parseHandoff(await readFile(path.resolve(source),"utf8"));
    const active=await activeHandoff(path.resolve(recipientRoot),parsed.headers["active-handoff"]);
    const grant=await authorityAt(path.resolve(recipientRoot),parsed.headers["authority-commit"],
      parsed.headers.authority);
    const base=active.base??active.commit;
    let ancestral=true,presentOnBase=true;
    try { await git(path.resolve(recipientRoot),"merge-base","--is-ancestor",
      parsed.headers["authority-commit"],base); } catch { ancestral=false; }
    try { await authorityAt(path.resolve(recipientRoot),base,parsed.headers.authority); }
    catch { presentOnBase=false; }
    if (parsed.headers.from!==sender) throw new Error("Unblocker sender does not match its outbox owner");
    const result=await deliverUnblocker({
      queueRoot:path.join(path.resolve(recipientRoot),".swarmforge","handoffs","inbox"),
      headers:parsed.headers,body:parsed.body,grant,
      active:{id:active.id,from:active.from,recipient:active.recipient,task:active.task},
      authorityCommitPresentOnBase:presentOnBase,authorityCommitAncestral:ancestral,
    });
    console.log(JSON.stringify(result)); return;
  }
  if (command==="claim") {
    const active=await activeHandoff(root,rest[0]);
    const result=await claimUnblocker({queueRoot:path.join(root,".swarmforge","handoffs","inbox"),active});
    console.log(JSON.stringify(result,null,2)); return;
  }
  if (command==="complete") {
    const active=await activeHandoff(root,rest[0]);
    const queueRoot=path.join(root,".swarmforge","handoffs","inbox");
    const claimed=await queueFiles(queueRoot,"in_process");
    if (claimed.length!==1) throw new Error("Exactly one claimed unblocker is required");
    const parsed=parseHandoff(await readFile(claimed[0],"utf8"));
    let replacement,ordinaryState;
    if (parsed.headers.mode==="replace") {
      const newDir=path.join(queueRoot,"new");
      for (const name of await readdir(newDir)) {
        if (!name.endsWith(".handoff")) continue;
        const file=path.join(newDir,name),candidate=parseHandoff(await readFile(file,"utf8"));
        if (candidate.headers.id===parsed.headers["replacement-handoff"]) {
          replacement={...candidate.headers,path:file};
          ordinaryState={activeFile:active.path,replacementFile:file,
            completedDir:path.join(queueRoot,"completed"),inProcessDir:path.join(queueRoot,"in_process")};
          break;
        }
      }
    }
    const result=await completeUnblocker({queueRoot,active,replacement,ordinaryState});
    console.log(result.status==="resume"?`RESUME: ${active.path}`:JSON.stringify(result)); return;
  }
  throw new Error("Use: unblocker-control.mjs send <draft> | deliver-file <source> <recipient-root> <sender> | claim <active-id> | complete <active-id>");
}

if (process.argv[1] && fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  cli(process.argv.slice(2)).catch((error)=>{ console.error(error.message); process.exitCode=1; });
}
