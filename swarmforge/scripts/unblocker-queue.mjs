import { randomUUID } from "node:crypto";
import { readFile, rename } from "node:fs/promises";
import path from "node:path";

import { unblockerContentDigest, validateAuthorityClaim, validateStoredUnblocker,
  validateUnblockerDraft } from "./unblocker-authority.mjs";
import { bindingKey, parseHandoff, renderHandoff } from "./unblocker-format.mjs";
import { recoverUnblockerJournals, runUnblockerJournal } from "./unblocker-journal.mjs";
import { atomicWrite, matchingBindings, queueFiles, reconcileLegacyClaimDuplicate,
  withQueueLock } from "./unblocker-queue-storage.mjs";

export { queueFiles } from "./unblocker-queue-storage.mjs";

async function validateTrust(parsed,active,trust) {
  validateStoredUnblocker(parsed.headers,parsed.body);
  if (parsed.headers["active-handoff"]!==active.id || parsed.headers.task!==active.task ||
    parsed.headers.to!==active.recipient) throw new Error("Stored unblocker binding is stale or modified");
  if (trust?.authorityValidator) await trust.authorityValidator(parsed.headers,parsed.body);
  else if (trust?.grant) validateAuthorityClaim({headers:parsed.headers,grant:trust.grant,active,
    authorityCommitPresentOnBase:trust.authorityCommitPresentOnBase,
    authorityCommitAncestral:trust.authorityCommitAncestral});
}

function duplicateDelivery(matches,digest) {
  const same=matches.find(({headers:item})=>item["content-digest"]===digest);
  if (same?.state==="completed") return {status:"completed-duplicate",filename:path.basename(same.file),
    activeRetained:true,notification:""};
  if (same) return {status:same.state==="in_process"?"already-claimed":"queued-duplicate",
    filename:path.basename(same.file),activeRetained:true,notification:""};
  if (matches.length) throw new Error("Unblocker binding collision with different content");
  return undefined;
}

function activeBindingIsStale(headers,active) {
  if (active.id!==headers["active-handoff"]) return true;
  if (active.task!==headers.task) return true;
  if (active.recipient!==headers.to) return true;
  return headers.mode==="replace" && active.from!==headers.from;
}

async function deliverLocked({queueRoot,headers,body,grant,active,
  authorityCommitPresentOnBase,authorityCommitAncestral,now,digest,key}) {
  const duplicate=duplicateDelivery(await matchingBindings(queueRoot,key),digest);
  if (duplicate) return duplicate;
  const filename=`00_${key}.handoff`,created={id:headers.id??`unblocker-${key}`,...headers,
    "content-digest":digest,created_at:headers.created_at??now(),enqueued_at:now()};
  if (activeBindingIsStale(headers,active)) {
    await atomicWrite(path.join(queueRoot,"unblockers","failed",filename),
      renderHandoff({...created,"failure-reason":"stale binding"},body));
    return {status:"stale",filename,activeRetained:true,notification:""};
  }
  validateAuthorityClaim({headers,grant,active,authorityCommitPresentOnBase,authorityCommitAncestral});
  await atomicWrite(path.join(queueRoot,"unblockers","new",filename),renderHandoff(created,body));
  return {status:"queued",filename,activeRetained:true,
    notification:`USER-AUTHORIZED UNBLOCKER ${headers.name} under ${headers.authority}@${headers["authority-commit"].slice(0,10)} for ${headers.task} handoff ${headers["active-handoff"]}: ${headers.message}. Handle now at the next safe boundary with unblocker_claim.sh.`};
}

export async function deliverUnblocker({queueRoot,headers,body="",grant,active,
  authorityCommitPresentOnBase,authorityCommitAncestral,now=()=>new Date().toISOString()}) {
  const draftKeys=["type","to","priority","name","authority","authority-commit","task",
    "active-handoff","mode","supersedes","replacement-handoff","message"];
  const draftHeaders=Object.fromEntries(draftKeys.filter((key)=>headers[key]!==undefined)
    .map((key)=>[key,headers[key]]));
  validateUnblockerDraft(draftHeaders,body);
  const digest=unblockerContentDigest(headers,body),key=bindingKey(headers);
  return withQueueLock(queueRoot,()=>deliverLocked({queueRoot,headers,body,grant,active,
    authorityCommitPresentOnBase,authorityCommitAncestral,now,digest,key}));
}

function claimOwnerIsAlive(rawOwner) {
  const owner=Number(rawOwner);
  if (!Number.isInteger(owner)) return false;
  if (owner<=0) return false;
  try { process.kill(owner,0); return true; }
  catch (error) {
    if (error.code==="ESRCH") return false;
    throw error;
  }
}

async function claimInProcess({queueRoot,active,now,faultAt,trust}) {
  const inProcess=await queueFiles(queueRoot,"in_process");
  if (!inProcess.length) return undefined;
  const file=inProcess[0],parsed=parseHandoff(await readFile(file,"utf8"));
  await validateTrust(parsed,active,trust);
  if (claimOwnerIsAlive(parsed.headers.claimed_by)) return {status:"already-claimed",file};
  const content=renderHandoff({...parsed.headers,claimed_by:String(process.pid),
    claim_token:randomUUID(),dequeued_at:now()},parsed.body);
  return runUnblockerJournal(queueRoot,{version:1,id:randomUUID(),kind:"claim",operations:[
    {type:"write",target:file,content,boundary:"claim-written"}],
  result:{kind:"claim",status:"claimed",reclaimed:true,file,headers:parsed.headers,body:parsed.body}},faultAt);
}

async function claimQueued({queueRoot,active,now,faultAt,trust}) {
  for (const file of await queueFiles(queueRoot,"new")) {
    const parsed=parseHandoff(await readFile(file,"utf8"));
    if (parsed.headers["active-handoff"]!==active.id || parsed.headers.task!==active.task) {
      await rename(file,path.join(queueRoot,"unblockers","failed",path.basename(file))); continue;
    }
    await validateTrust(parsed,active,trust);
    const target=path.join(queueRoot,"unblockers","in_process",path.basename(file));
    const content=renderHandoff({...parsed.headers,claimed_by:String(process.pid),
      claim_token:randomUUID(),dequeued_at:now()},parsed.body);
    return runUnblockerJournal(queueRoot,{version:1,id:randomUUID(),kind:"claim",operations:[
      {type:"rename",source:file,target,boundary:"claim-moved"},
      {type:"write",target,content,boundary:"claim-written"}],
    result:{kind:"claim",status:"claimed",file:target,headers:parsed.headers,body:parsed.body}},faultAt);
  }
  return {status:"none"};
}

function replacementIsAvailable(headers,active,replacement) {
  if (!replacement) return false;
  if (replacement.id!==headers["replacement-handoff"]) return false;
  if (replacement.from!==active.from) return false;
  if (replacement.recipient!==active.recipient) return false;
  return headers.supersedes===active.id;
}

function completionOperations(parsed,ordinaryState,file,target,completedAt) {
  const operations=[];
  if (parsed.headers.mode==="replace" && ordinaryState) operations.push(
    {type:"rename",source:ordinaryState.replacementFile,
      target:path.join(ordinaryState.inProcessDir,path.basename(ordinaryState.replacementFile)),
      boundary:"complete-replacement-activated"},
    {type:"rename",source:ordinaryState.activeFile,
      target:path.join(ordinaryState.completedDir,path.basename(ordinaryState.activeFile)),
      boundary:"complete-active-archived"});
  operations.push({type:"rename",source:file,target,boundary:"complete-unblocker-moved"},
    {type:"write",target,content:renderHandoff({...parsed.headers,completed_at:completedAt},parsed.body),
      boundary:"complete-unblocker-written"});
  return operations;
}

function completionResult(parsed,active,replacement) {
  if (parsed.headers.mode==="resume") return {kind:"complete",status:"resume",active};
  return {kind:"complete",status:"replace",archivedActive:active,replacement};
}

async function completeLocked({queueRoot,active,replacement,ordinaryState,now,faultAt,trust}) {
  const recovered=await recoverUnblockerJournals(queueRoot);
  const recoveredCompletion=recovered.find(({kind})=>kind==="complete");
  if (recoveredCompletion) return recoveredCompletion;
  const claimed=await queueFiles(queueRoot,"in_process");
  if (claimed.length!==1) throw new Error("Exactly one claimed unblocker is required");
  const file=claimed[0],parsed=parseHandoff(await readFile(file,"utf8"));
  await validateTrust(parsed,active,trust);
  if (parsed.headers.mode==="replace" && !replacementIsAvailable(parsed.headers,active,replacement)) {
    throw new Error("Bound replacement handoff is unavailable");
  }
  const target=path.join(queueRoot,"unblockers","completed",path.basename(file));
  const operations=completionOperations(parsed,ordinaryState,file,target,now());
  const result=completionResult(parsed,active,replacement);
  return runUnblockerJournal(queueRoot,
    {version:1,id:randomUUID(),kind:"complete",operations,result},faultAt);
}

export async function claimUnblocker({queueRoot,active,now=()=>new Date().toISOString(),faultAt,
  ...trust}) {
  return withQueueLock(queueRoot,async()=>{
    const recovered=await recoverUnblockerJournals(queueRoot);
    const recoveredClaim=recovered.find(({kind})=>kind==="claim");
    if (recoveredClaim) return recoveredClaim;
    await reconcileLegacyClaimDuplicate(queueRoot);
    const claimed=await claimInProcess({queueRoot,active,now,faultAt,trust});
    if (claimed) return claimed;
    return claimQueued({queueRoot,active,now,faultAt,trust});
  });
}

export async function completeUnblocker({queueRoot,active,replacement,ordinaryState,
  now=()=>new Date().toISOString(),faultAt,...trust}) {
  return withQueueLock(queueRoot,()=>completeLocked(
    {queueRoot,active,replacement,ordinaryState,now,faultAt,trust}));
}
