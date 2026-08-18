import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
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

export async function withQueueLock(queueRoot,operation,{afterStaleObserved}={}) {
  const lock=path.join(queueRoot,"unblockers.lock");
  await mkdir(queueRoot,{recursive:true});
  for (let attempt=0;attempt<100;attempt+=1) {
    const token=randomUUID();
    let acquired=false;
    try {
      await mkdir(lock);
      await writeFile(path.join(lock,"owner.json"),JSON.stringify({pid:process.pid,token}),{flag:"wx"});
      acquired=true;
    } catch (error) {
      if (error.code!=="EEXIST") throw error;
      let reclaim;
      try {
        reclaim=await open(path.join(lock,"reclaim"),"wx");
        const observed=await currentOwner(lock);
        if (observed) {
          let alive=Number.isInteger(observed.pid)&&observed.pid>0;
          if (alive) try { process.kill(observed.pid,0); }
          catch (signalError) { if (signalError.code==="ESRCH") alive=false; else throw signalError; }
          if (!alive) {
            if (afterStaleObserved) await afterStaleObserved(observed);
            const current=await currentOwner(lock);
            if (current?.token===observed.token) await rm(lock,{recursive:true,force:true});
          }
        }
      } catch (reclaimError) {
        if (!["EEXIST","ENOENT"].includes(reclaimError.code)) throw reclaimError;
      } finally {
        if (reclaim) {
          await reclaim.close();
          await rm(path.join(lock,"reclaim"),{force:true});
        }
      }
    }
    if (acquired) {
      try { return await operation(); }
      finally {
        const owner=await currentOwner(lock);
        if (owner?.token===token) await rm(lock,{recursive:true,force:true});
      }
    }
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
