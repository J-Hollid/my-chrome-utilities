import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { validateStoredUnblocker } from "./unblocker-authority.mjs";
import { bindingKey, parseHandoff } from "./unblocker-format.mjs";

export async function exists(file) {
  try { await stat(file); return true; }
  catch (error) { if (error.code==="ENOENT") return false; throw error; }
}

export async function atomicWrite(target,content) {
  await mkdir(path.dirname(target),{recursive:true});
  const stage=path.join(path.dirname(target),`.${path.basename(target)}.${randomUUID()}.tmp`);
  await writeFile(stage,content,{flag:"wx"});
  await rename(stage,target);
}

async function currentOwner(lock) {
  try { return JSON.parse(await readFile(path.join(lock,"owner.json"),"utf8")); }
  catch (error) { if (error.code==="ENOENT") return null; throw error; }
}

async function ownerIsAlive(owner) {
  let alive=Number.isInteger(owner?.pid)&&owner.pid>0;
  if (alive) try { process.kill(owner.pid,0); }
  catch (error) { if (error.code==="ESRCH") alive=false; else throw error; }
  return alive;
}

async function acquireLock(lock,token) {
  const stage=`${lock}.${token}.tmp`;
  try {
    await mkdir(stage);
    await writeFile(path.join(stage,"owner.json"),JSON.stringify({pid:process.pid,token}),{flag:"wx"});
    await rename(stage,lock);
    return true;
  } catch (error) {
    await rm(stage,{recursive:true,force:true});
    if (["EEXIST","ENOTEMPTY"].includes(error.code)) return false;
    throw error;
  }
}

async function acquireReclaimLease(lock,token) {
  const lease=`${lock}.reclaim`,stage=`${lease}.${token}.tmp`;
  try {
    await mkdir(stage);
    await writeFile(path.join(stage,"owner.json"),JSON.stringify({pid:process.pid,token}),{flag:"wx"});
    await rename(stage,lease);
    return true;
  } catch (error) {
    await rm(stage,{recursive:true,force:true});
    if (!["EEXIST","ENOTEMPTY"].includes(error.code)) throw error;
    const owner=await currentOwner(lease);
    if (await ownerIsAlive(owner)) return false;
    const retired=`${lease}.${randomUUID()}.retired`;
    try { await rename(lease,retired); }
    catch (renameError) { if (renameError.code!=="ENOENT") throw renameError; }
    await rm(retired,{recursive:true,force:true});
    return false;
  }
}

async function releaseOwnedDirectory(target,token) {
  const owner=await currentOwner(target);
  if (owner?.token!==token) return;
  const retired=`${target}.${token}.retired`;
  try { await rename(target,retired); }
  catch (error) { if (error.code!=="ENOENT") throw error; return; }
  await rm(retired,{recursive:true,force:true});
}

async function sameDirectory(target,observed) {
  try {
    const current=await stat(target);
    return current.dev===observed.dev&&current.ino===observed.ino;
  } catch (error) {
    if (error.code==="ENOENT") return false;
    throw error;
  }
}

async function staleLockObservation(lock) {
  let identity;
  try { identity=await stat(lock); }
  catch (error) { if (error.code==="ENOENT") return null; throw error; }
  const owner=await currentOwner(lock);
  return await ownerIsAlive(owner)?null:{identity,owner};
}

async function observationStillCurrent(lock,observation) {
  const current=await currentOwner(lock);
  const sameOwner=(observation.owner===null&&current===null)||
    current?.token===observation.owner?.token;
  return sameOwner&&await sameDirectory(lock,observation.identity);
}

async function retireUnchangedLock(lock,observation,token) {
  if (!await observationStillCurrent(lock,observation)) return;
  const retired=`${lock}.${token}.retired`;
  try { await rename(lock,retired); }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  await rm(retired,{recursive:true,force:true});
}

async function reclaimStaleLock(lock,afterStaleObserved) {
  const token=randomUUID(),lease=`${lock}.reclaim`;
  if (!await acquireReclaimLease(lock,token)) return;
  try {
    const observation=await staleLockObservation(lock);
    if (!observation) return;
    if (afterStaleObserved) await afterStaleObserved(observation.owner);
    await retireUnchangedLock(lock,observation,token);
  } finally {
    await releaseOwnedDirectory(lease,token);
  }
}

async function releaseOwnedLock(lock,token) {
  await releaseOwnedDirectory(lock,token);
}

export async function withQueueLock(queueRoot,operation,{afterStaleObserved}={}) {
  const lock=path.join(queueRoot,"unblockers.lock");
  await mkdir(queueRoot,{recursive:true});
  for (let attempt=0;attempt<100;attempt+=1) {
    const token=randomUUID();
    const acquired=await acquireLock(lock,token);
    if (acquired) {
      try { return await operation(); }
      finally { await releaseOwnedLock(lock,token); }
    }
    await reclaimStaleLock(lock,afterStaleObserved);
    await new Promise((resolve)=>setTimeout(resolve,20));
  }
  throw new Error("Timed out waiting for unblocker queue lock");
}

export async function queueFiles(queueRoot,state) {
  const directory=path.join(queueRoot,"unblockers",state);
  await mkdir(directory,{recursive:true});
  return (await readdir(directory)).filter((name)=>name.endsWith(".handoff")).sort()
    .map((name)=>path.join(directory,name));
}

export async function matchingBindings(queueRoot,key) {
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

export async function reconcileLegacyClaimDuplicate(queueRoot) {
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
