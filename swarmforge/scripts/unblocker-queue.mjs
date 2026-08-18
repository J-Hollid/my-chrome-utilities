import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
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

function resultMatchesActive(result,active) {
  return result.binding?.activeHandoff===active.id && result.binding?.task===active.task;
}

function binding(active) {
  return {activeHandoff:active.id,task:active.task};
}

export async function deliverUnblocker({queueRoot,headers,body="",grant,active,
  authorityCommitPresentOnBase,authorityCommitAncestral,now=()=>new Date().toISOString()}) {
  const draftKeys=["type","to","priority","name","authority","authority-commit","task",
    "active-handoff","mode","supersedes","replacement-handoff","message"];
  const draftHeaders=Object.fromEntries(draftKeys.filter((key)=>headers[key]!==undefined)
    .map((key)=>[key,headers[key]]));
  validateUnblockerDraft(draftHeaders,body);
  const digest=unblockerContentDigest(headers,body),key=bindingKey(headers);
  return withQueueLock(queueRoot,async()=>{
    const matches=await matchingBindings(queueRoot,key);
    const same=matches.find(({headers:item})=>item["content-digest"]===digest);
    if (same?.state==="completed") return {status:"completed-duplicate",filename:path.basename(same.file),
      activeRetained:true,notification:""};
    if (same) return {status:same.state==="in_process"?"already-claimed":"queued-duplicate",
      filename:path.basename(same.file),activeRetained:true,notification:""};
    if (matches.length) throw new Error("Unblocker binding collision with different content");
    const filename=`00_${key}.handoff`,created={id:headers.id??`unblocker-${key}`,...headers,"content-digest":digest,
      created_at:headers.created_at??now(),enqueued_at:now()};
    const stale=active.id!==headers["active-handoff"] || active.task!==headers.task ||
      active.recipient!==headers.to || (headers.mode==="replace" && active.from!==headers.from);
    if (stale) {
      await atomicWrite(path.join(queueRoot,"unblockers","failed",filename),
        renderHandoff({...created,"failure-reason":"stale binding"},body));
      return {status:"stale",filename,activeRetained:true,notification:""};
    }
    validateAuthorityClaim({headers,grant,active,authorityCommitPresentOnBase,authorityCommitAncestral});
    await atomicWrite(path.join(queueRoot,"unblockers","new",filename),renderHandoff(created,body));
    return {status:"queued",filename,activeRetained:true,
      notification:`USER-AUTHORIZED UNBLOCKER ${headers.name} under ${headers.authority}@${headers["authority-commit"].slice(0,10)} for ${headers.task} handoff ${headers["active-handoff"]}: ${headers.message}. Handle now at the next safe boundary with unblocker_claim.sh.`};
  });
}

export async function claimUnblocker({queueRoot,active,now=()=>new Date().toISOString(),faultAt,
  ...trust}) {
  return withQueueLock(queueRoot,async()=>{
    const recovered=await recoverUnblockerJournals(queueRoot);
    const recoveredClaim=recovered.find((result)=>result.kind==="claim"&&resultMatchesActive(result,active));
    if (recoveredClaim) return recoveredClaim;
    await reconcileLegacyClaimDuplicate(queueRoot);
    const inProcess=await queueFiles(queueRoot,"in_process");
    if (inProcess.length) {
      const file=inProcess[0],parsed=parseHandoff(await readFile(file,"utf8"));
      await validateTrust(parsed,active,trust);
      const owner=Number(parsed.headers.claimed_by);
      let alive=Number.isInteger(owner)&&owner>0;
      if (alive) try { process.kill(owner,0); }
      catch (error) { if (error.code==="ESRCH") alive=false; else throw error; }
      if (alive) return {status:"already-claimed",file};
      const content=renderHandoff({...parsed.headers,claimed_by:String(process.pid),
        claim_token:randomUUID(),dequeued_at:now()},parsed.body);
      return runUnblockerJournal(queueRoot,{version:1,id:randomUUID(),kind:"claim",operations:[
        {type:"write",target:file,content,boundary:"claim-written"}],
      result:{kind:"claim",status:"claimed",reclaimed:true,file,headers:parsed.headers,
        body:parsed.body,binding:binding(active)}},faultAt);
    }
    for (const file of await queueFiles(queueRoot,"new")) {
      const parsed=parseHandoff(await readFile(file,"utf8"));
      if (parsed.headers["active-handoff"]!==active.id || parsed.headers.task!==active.task) {
        const target=path.join(queueRoot,"unblockers","failed",path.basename(file));
        const content=renderHandoff({...parsed.headers,"failure-reason":"stale binding"},parsed.body);
        await runUnblockerJournal(queueRoot,{version:1,id:randomUUID(),kind:"stale",operations:[
          {type:"rename",source:file,target,boundary:"stale-moved"},
          {type:"write",target,content,boundary:"stale-audited"}],
        result:{kind:"stale",status:"stale",file:target,binding:{
          activeHandoff:parsed.headers["active-handoff"],task:parsed.headers.task}}},faultAt);
        continue;
      }
      await validateTrust(parsed,active,trust);
      const target=path.join(queueRoot,"unblockers","in_process",path.basename(file));
      const content=renderHandoff({...parsed.headers,claimed_by:String(process.pid),
        claim_token:randomUUID(),dequeued_at:now()},parsed.body);
      return runUnblockerJournal(queueRoot,{version:1,id:randomUUID(),kind:"claim",operations:[
        {type:"rename",source:file,target,boundary:"claim-moved"},
        {type:"write",target,content,boundary:"claim-written"}],
      result:{kind:"claim",status:"claimed",file:target,headers:parsed.headers,body:parsed.body,
        binding:binding(active)}},faultAt);
    }
    return {status:"none"};
  });
}

export async function completeUnblocker({queueRoot,active,replacement,ordinaryState,
  now=()=>new Date().toISOString(),faultAt,...trust}) {
  return withQueueLock(queueRoot,async()=>{
    const recovered=await recoverUnblockerJournals(queueRoot);
    const recoveredCompletion=recovered.find((result)=>result.kind==="complete"&&
      resultMatchesActive(result,active));
    if (recoveredCompletion) return recoveredCompletion;
    const claimed=await queueFiles(queueRoot,"in_process");
    if (claimed.length!==1) throw new Error("Exactly one claimed unblocker is required");
    const file=claimed[0],parsed=parseHandoff(await readFile(file,"utf8"));
    await validateTrust(parsed,active,trust);
    if (parsed.headers.mode==="replace" && (!replacement ||
      replacement.id!==parsed.headers["replacement-handoff"] || replacement.from!==active.from ||
      replacement.recipient!==active.recipient || parsed.headers.supersedes!==active.id)) {
      throw new Error("Bound replacement handoff is unavailable");
    }
    const target=path.join(queueRoot,"unblockers","completed",path.basename(file));
    const operations=[];
    if (parsed.headers.mode==="replace" && ordinaryState) operations.push(
      {type:"rename",source:ordinaryState.replacementFile,
        target:ordinaryState.replacementTarget??path.join(ordinaryState.inProcessDir,
          path.basename(ordinaryState.replacementFile)),
        boundary:"complete-replacement-activated"},
      {type:"rename",source:ordinaryState.activeFile,
        target:ordinaryState.activeTarget??path.join(ordinaryState.completedDir,
          path.basename(ordinaryState.activeFile)),
        boundary:"complete-active-archived"});
    operations.push({type:"rename",source:file,target,boundary:"complete-unblocker-moved"},
      {type:"write",target,content:renderHandoff({...parsed.headers,completed_at:now()},parsed.body),
        boundary:"complete-unblocker-written"});
    const result=parsed.headers.mode==="resume"
      ? {kind:"complete",status:"resume",active,binding:binding(active)}
      : {kind:"complete",status:"replace",archivedActive:active,replacement,binding:binding(active)};
    return runUnblockerJournal(queueRoot,{version:1,id:randomUUID(),kind:"complete",operations,result},faultAt);
  });
}
