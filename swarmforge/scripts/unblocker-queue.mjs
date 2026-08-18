import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { unblockerContentDigest, validateAuthorityClaim, validateStoredUnblocker,
  validateUnblockerDraft } from "./unblocker-authority.mjs";
import { bindingKey, parseHandoff, renderHandoff } from "./unblocker-format.mjs";

async function exists(file) {
  try { await stat(file); return true; }
  catch (error) { if (error.code==="ENOENT") return false; throw error; }
}

async function atomicWrite(target,content) {
  await mkdir(path.dirname(target),{recursive:true});
  const stage=path.join(path.dirname(target),`.${path.basename(target)}.${randomUUID()}.tmp`);
  await writeFile(stage,content,{flag:"wx"});
  await rename(stage,target);
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

export async function queueFiles(queueRoot,state) {
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
      validateStoredUnblocker(parsed.headers,parsed.body);
      if (bindingKey(parsed.headers)===key) matches.push({state,file,...parsed});
    }
  }
  return matches;
}

function journalDigest(journal) {
  const value={...journal}; delete value.digest;
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function inject(faultAt,boundary) {
  if (faultAt===boundary) throw new Error(`Injected crash at ${boundary}`);
}

async function applyRename({source,target}) {
  const [sourceExists,targetExists]=await Promise.all([exists(source),exists(target)]);
  if (sourceExists && targetExists) throw new Error("Transition collision retains both source and target");
  if (sourceExists) { await mkdir(path.dirname(target),{recursive:true}); await rename(source,target); return; }
  if (!targetExists) throw new Error("Transition source and target are both unavailable");
}

async function runJournal(queueRoot,journal,faultAt) {
  const directory=path.join(queueRoot,"unblockers","transactions");
  const durable=journal.digest ? journal : {...journal,digest:journalDigest(journal)};
  if (durable.digest!==journalDigest(durable)) throw new Error("Unblocker transition journal is modified");
  const journalPath=path.join(directory,`${durable.id}.json`);
  if (!await exists(journalPath)) await atomicWrite(journalPath,`${JSON.stringify(durable,null,2)}\n`);
  inject(faultAt,`${durable.kind}-journal-written`);
  for (const operation of durable.operations) {
    if (operation.type==="rename") await applyRename(operation);
    else if (operation.type==="write") await atomicWrite(operation.target,operation.content);
    else throw new Error(`Unknown unblocker transition operation ${operation.type}`);
    inject(faultAt,operation.boundary);
  }
  await rm(journalPath,{force:true});
  return durable.result;
}

async function recoverJournals(queueRoot) {
  const directory=path.join(queueRoot,"unblockers","transactions");
  await mkdir(directory,{recursive:true});
  const recovered=[];
  for (const name of (await readdir(directory)).filter((item)=>item.endsWith(".json")).sort()) {
    const journal=JSON.parse(await readFile(path.join(directory,name),"utf8"));
    recovered.push(await runJournal(queueRoot,journal));
  }
  return recovered;
}

async function reconcileLegacyClaimDuplicate(queueRoot) {
  for (const claimed of await queueFiles(queueRoot,"in_process")) {
    const queued=path.join(queueRoot,"unblockers","new",path.basename(claimed));
    if (!await exists(queued)) continue;
    const [claimedParsed,queuedParsed]=await Promise.all([readFile(claimed,"utf8"),readFile(queued,"utf8")])
      .then((values)=>values.map(parseHandoff));
    validateStoredUnblocker(claimedParsed.headers,claimedParsed.body);
    validateStoredUnblocker(queuedParsed.headers,queuedParsed.body);
    if (claimedParsed.headers["content-digest"]!==queuedParsed.headers["content-digest"] ||
      claimedParsed.body!==queuedParsed.body) throw new Error("Duplicate claim copies have different content");
    await rm(queued);
  }
}

async function validateTrust(parsed,active,trust) {
  validateStoredUnblocker(parsed.headers,parsed.body);
  if (parsed.headers["active-handoff"]!==active.id || parsed.headers.task!==active.task ||
    parsed.headers.to!==active.recipient) throw new Error("Stored unblocker binding is stale or modified");
  if (trust?.authorityValidator) await trust.authorityValidator(parsed.headers,parsed.body);
  else if (trust?.grant) validateAuthorityClaim({headers:parsed.headers,grant:trust.grant,active,
    authorityCommitPresentOnBase:trust.authorityCommitPresentOnBase,
    authorityCommitAncestral:trust.authorityCommitAncestral});
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
    const recovered=await recoverJournals(queueRoot);
    const recoveredClaim=recovered.find(({kind})=>kind==="claim");
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
      return runJournal(queueRoot,{version:1,id:randomUUID(),kind:"claim",operations:[
        {type:"write",target:file,content,boundary:"claim-written"}],
      result:{kind:"claim",status:"claimed",reclaimed:true,file,headers:parsed.headers,body:parsed.body}},faultAt);
    }
    for (const file of await queueFiles(queueRoot,"new")) {
      const parsed=parseHandoff(await readFile(file,"utf8"));
      if (parsed.headers["active-handoff"]!==active.id || parsed.headers.task!==active.task) {
        await rename(file,path.join(queueRoot,"unblockers","failed",path.basename(file))); continue;
      }
      await validateTrust(parsed,active,trust);
      const target=path.join(queueRoot,"unblockers","in_process",path.basename(file));
      const content=renderHandoff({...parsed.headers,claimed_by:String(process.pid),
        claim_token:randomUUID(),dequeued_at:now()},parsed.body);
      return runJournal(queueRoot,{version:1,id:randomUUID(),kind:"claim",operations:[
        {type:"rename",source:file,target,boundary:"claim-moved"},
        {type:"write",target,content,boundary:"claim-written"}],
      result:{kind:"claim",status:"claimed",file:target,headers:parsed.headers,body:parsed.body}},faultAt);
    }
    return {status:"none"};
  });
}

export async function completeUnblocker({queueRoot,active,replacement,ordinaryState,
  now=()=>new Date().toISOString(),faultAt,...trust}) {
  return withQueueLock(queueRoot,async()=>{
    const recovered=await recoverJournals(queueRoot);
    const recoveredCompletion=recovered.find(({kind})=>kind==="complete");
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
        target:path.join(ordinaryState.inProcessDir,path.basename(ordinaryState.replacementFile)),
        boundary:"complete-replacement-activated"},
      {type:"rename",source:ordinaryState.activeFile,
        target:path.join(ordinaryState.completedDir,path.basename(ordinaryState.activeFile)),
        boundary:"complete-active-archived"});
    operations.push({type:"rename",source:file,target,boundary:"complete-unblocker-moved"},
      {type:"write",target,content:renderHandoff({...parsed.headers,completed_at:now()},parsed.body),
        boundary:"complete-unblocker-written"});
    const result=parsed.headers.mode==="resume"
      ? {kind:"complete",status:"resume",active}
      : {kind:"complete",status:"replace",archivedActive:active,replacement};
    return runJournal(queueRoot,{version:1,id:randomUUID(),kind:"complete",operations,result},faultAt);
  });
}
