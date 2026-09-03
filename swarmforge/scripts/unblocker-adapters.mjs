import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { authorityDigest, unblockerContentDigest, validateAuthorityClaim, validateTransportUnblocker,
  validateUnblockerDraft } from "./unblocker-authority.mjs";
import { handoffIdentity } from "./role-handoff-identity.mjs";
import { parseHandoff, renderHandoff } from "./unblocker-format.mjs";
import { claimUnblocker, completeUnblocker, deliverUnblocker, queueFiles } from "./unblocker-queue.mjs";

const exec=promisify(execFile);
async function git(root,...args) {
  return (await exec("git",args,{cwd:root,encoding:"utf8"})).stdout.trim();
}
async function exists(file) {
  try { await stat(file); return true; }
  catch (error) { if (error.code==="ENOENT") return false; throw error; }
}
async function atomicWrite(target,content) {
  await mkdir(path.dirname(target),{recursive:true});
  const stage=path.join(path.dirname(target),`.${path.basename(target)}.${randomUUID()}.tmp`);
  await writeFile(stage,content,{flag:"wx"}); await rename(stage,target);
}
async function authorityAt(root,commit,name) {
  return JSON.parse(await git(root,"show",`${commit}:docs/swarmforge-authorities/${name}.json`));
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
async function handoffFiles(directory) {
  if (!await exists(directory)) return [];
  const files=[];
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const target=path.join(directory,entry.name);
    if (entry.isDirectory()) files.push(...await handoffFiles(target));
    else if (entry.isFile()&&entry.name.endsWith(".handoff")) files.push(target);
  }
  return files.sort();
}
export async function resolveActiveHandoff(root,id) {
  const directory=path.join(root,".swarmforge","handoffs","inbox","in_process");
  const matches=[];
  for (const file of await handoffFiles(directory)) {
    const identity=handoffIdentity(await readFile(file,"utf8"));
    if (identity.id===id) matches.push({...identity,path:file});
  }
  if (matches.length>1) throw new Error(`Active handoff ${id} is ambiguous`);
  if (matches.length===1) return matches[0];
  throw new Error(`Active handoff ${id} is unavailable`);
}
async function trustContext(root,active,headers) {
  const grant=await authorityAt(root,headers["authority-commit"],headers.authority);
  const base=active.type==="note"?active.lineage?.base:active.base??active.commit;
  if (active.type==="note") {
    if (!active.lineage) throw new Error("Active note has no immutable recorded lineage");
    await git(root,"merge-base","--is-ancestor",active.lineage.base,active.lineage.commit);
  }
  let authorityCommitAncestral=true,authorityCommitPresentOnBase=true;
  try { await git(root,"merge-base","--is-ancestor",headers["authority-commit"],base); }
  catch { authorityCommitAncestral=false; }
  try {
    const baseGrant=await authorityAt(root,base,headers.authority);
    authorityCommitPresentOnBase=baseGrant.digest===grant.digest&&
      authorityDigest(baseGrant)===authorityDigest(grant);
  }
  catch { authorityCommitPresentOnBase=false; }
  return {grant,authorityCommitAncestral,authorityCommitPresentOnBase};
}
function activeIdentity(active) {
  return {id:active.id,from:active.from,recipient:active.recipient,task:active.task,
    type:active.type,lineageDigest:active["lineage-digest"]};
}
async function authorityValidator(root,active,headers,body) {
  const trust=await trustContext(root,active,headers);
  validateAuthorityClaim({headers,active:activeIdentity(active),...trust});
}

export async function sendUnblocker(root,draftPath,{sequenceLoader}={}) {
  const parsed=parseHandoff(await readFile(path.resolve(draftPath),"utf8"));
  validateUnblockerDraft(parsed.headers,parsed.body);
  const sender=process.env.SWARMFORGE_ROLE;
  if (!sender) throw new Error("Set SWARMFORGE_ROLE");
  const sharedRoot=await projectRoot(root),roles=await roleRows(sharedRoot);
  const recipient=roles.get(parsed.headers.to);
  if (!recipient?.worktreePath) throw new Error(`Unknown recipient ${parsed.headers.to}`);
  const active=await resolveActiveHandoff(recipient.worktreePath,parsed.headers["active-handoff"]);
  if (active.type==="note"&&!active.lineage) {
    throw new Error("Active note has no immutable recorded lineage");
  }
  const headers={...parsed.headers,from:sender,
    ...(active.type==="note"?{"active-lineage-digest":active["lineage-digest"]}: {})},
    trust=await trustContext(root,active,headers);
  validateAuthorityClaim({headers,active:activeIdentity(active),...trust});
  const sequence=sequenceLoader?await sequenceLoader():(await exec("bb",
    [path.join(root,"swarmforge/scripts/handoff_lib.bb"),"next-sequence"],
    {cwd:root,encoding:"utf8",env:process.env})).stdout.trim();
  const date=new Date(),timestamp=date.toISOString().replaceAll(/[-:]/gu,"").replace(/\.\d{3}Z$/u,"Z");
  const finalized={id:`${timestamp}_${sequence}_from_${sender}`,...headers,created_at:date.toISOString()};
  finalized["content-digest"]=unblockerContentDigest(finalized,parsed.body);
  const filename=`00_${timestamp}_${sequence}_from_${sender}_to_${headers.to}.handoff`;
  const target=path.join(root,".swarmforge","handoffs","outbox",filename);
  await atomicWrite(target,renderHandoff(finalized,parsed.body));
  console.log(`UNBLOCKER QUEUED: ${target}`);
  return target;
}

export async function deliverUnblockerFile(source,recipientRoot,sender) {
  const parsed=parseHandoff(await readFile(path.resolve(source),"utf8"));
  validateTransportUnblocker(parsed.headers,parsed.body);
  if (parsed.headers.from!==sender) throw new Error("Unblocker sender does not match its outbox owner");
  const root=path.resolve(recipientRoot),active=await resolveActiveHandoff(root,
    parsed.headers["active-handoff"]);
  const trust=await trustContext(root,active,parsed.headers);
  const result=await deliverUnblocker({queueRoot:path.join(root,".swarmforge","handoffs","inbox"),
    headers:parsed.headers,body:parsed.body,active:activeIdentity(active),...trust});
  console.log(JSON.stringify(result));
  return result;
}

export async function claimActiveUnblocker(root,activeId) {
  const active=await resolveActiveHandoff(root,activeId),queueRoot=path.join(root,
    ".swarmforge","handoffs","inbox");
  const result=await claimUnblocker({queueRoot,active:activeIdentity(active),
    authorityValidator:(headers,body)=>authorityValidator(root,active,headers,body)});
  console.log(JSON.stringify(result,null,2));
  return result;
}

async function boundReplacement(queueRoot,active,parsed) {
  if (parsed?.headers.mode!=="replace") return {};
  const replacements=[];
  for (const file of await handoffFiles(path.join(queueRoot,"new"))) {
    const candidate=parseHandoff(await readFile(file,"utf8"));
    if (candidate.headers.id===parsed.headers["replacement-handoff"]) {
      replacements.push({...candidate.headers,path:file});
    }
  }
  if (replacements.length>1) throw new Error("Bound replacement handoff is ambiguous");
  if (!replacements.length) return {};
  const replacement=replacements[0];
  const activeRelative=path.relative(path.join(queueRoot,"in_process"),active.path);
  return {replacement,ordinaryState:{activeFile:active.path,replacementFile:replacement.path,
    activeTarget:path.join(queueRoot,"completed",activeRelative),
    replacementTarget:path.join(path.dirname(active.path),path.basename(replacement.path))}};
}

export async function completeActiveUnblocker(root,activeId) {
  const active=await resolveActiveHandoff(root,activeId),queueRoot=path.join(root,
    ".swarmforge","handoffs","inbox");
  const claimed=await queueFiles(queueRoot,"in_process");
  if (claimed.length>1) throw new Error("At most one claimed unblocker is allowed");
  const parsed=claimed.length ? parseHandoff(await readFile(claimed[0],"utf8")) : null;
  const {replacement,ordinaryState}=await boundReplacement(queueRoot,active,parsed);
  const result=await completeUnblocker({queueRoot,active:activeIdentity(active),replacement,ordinaryState,
    authorityValidator:(headers,body)=>authorityValidator(root,active,headers,body)});
  console.log(result.status==="resume"?`RESUME: ${active.path}`:JSON.stringify(result));
  return result;
}

export async function unblockerCli(args,{root=process.cwd()}={}) {
  const [command,...rest]=args;
  if (command==="send") return sendUnblocker(root,rest[0]);
  if (command==="deliver-file") return deliverUnblockerFile(rest[0],rest[1],rest[2]);
  if (command==="claim") return claimActiveUnblocker(root,rest[0]);
  if (command==="complete") return completeActiveUnblocker(root,rest[0]);
  throw new Error("Use: unblocker-control.mjs send <draft> | deliver-file <source> <recipient-root> <sender> | claim <active-id> | complete <active-id>");
}
