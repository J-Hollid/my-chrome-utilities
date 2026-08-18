import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";

import { atomicWrite, exists } from "./unblocker-queue-storage.mjs";

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

export async function runUnblockerJournal(queueRoot,journal,faultAt) {
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

export async function recoverUnblockerJournals(queueRoot) {
  const directory=path.join(queueRoot,"unblockers","transactions");
  await mkdir(directory,{recursive:true});
  const recovered=[];
  for (const name of (await readdir(directory)).filter((item)=>item.endsWith(".json")).sort()) {
    const journal=JSON.parse(await readFile(path.join(directory,name),"utf8"));
    recovered.push(await runUnblockerJournal(queueRoot,journal));
  }
  return recovered;
}
