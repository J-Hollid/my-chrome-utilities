import {createHash} from "node:crypto";
import {mkdir,open,readFile,rename,writeFile} from "node:fs/promises";
import path from "node:path";

import {recoverBootstrapRun} from "./recovery.mjs";

export function bootstrapRunPath(root,runId) {
  return path.join(root,"tmp","verification-bootstrap-runs",`${runId}.json`);
}

export async function readBootstrapRun(file) {
  try { return JSON.parse(await readFile(file,"utf8")); }
  catch (error) { if (error?.code==="ENOENT") return null;throw error; }
}

export async function writeBootstrapRun(file,value) {
  await mkdir(path.dirname(file),{recursive:true});
  const stage=`${file}.${process.pid}.tmp`;
  await writeFile(stage,`${JSON.stringify(value,null,2)}\n`,{flag:"wx",mode:0o600});
  await rename(stage,file);
}

export async function claimBootstrapRun(file,identity,ownerToken) {
  await mkdir(path.dirname(file),{recursive:true});
  const run={...structuredClone(identity),status:"running",ownerToken,
    startedAt:new Date().toISOString()};
  const claimFile=`${file}.claim`;
  try {
    const handle=await open(claimFile,"wx",0o600);
    try { await handle.writeFile(`${ownerToken}\n`);await handle.sync(); }
    finally { await handle.close(); }
    await writeBootstrapRun(file,run);
    return {action:"start",run};
  } catch (error) {
    if (error?.code!=="EEXIST") throw error;
    let stored=null;
    for (let attempt=0;attempt<100&&!stored;attempt+=1) {
      stored=await readBootstrapRun(file);
      if (!stored) await delay(5);
    }
    if (!stored) throw new Error("Bootstrap claimed run has no durable state");
    const recovery=recoverBootstrapRun(stored,identity);
    if (recovery.action==="use-receipt") await validateStoredBootstrapReceipt(stored);
    return {action:recovery.action==="attach"?"wait":recovery.action,run:stored};
  }
}

async function updateOwnedRun(file,ownerToken,update) {
  const current=await readBootstrapRun(file);
  if (current?.status!=="running"||current.ownerToken!==ownerToken) {
    throw new Error("Bootstrap run owner cannot update durable state");
  }
  const next={...current,...structuredClone(update)};
  await writeBootstrapRun(file,next);
  return next;
}

export function completeBootstrapRun(file,ownerToken,receipt) {
  return updateOwnedRun(file,ownerToken,{status:"completed",...receipt,
    completedAt:new Date().toISOString()});
}

export function failBootstrapRun(file,ownerToken,failure) {
  return updateOwnedRun(file,ownerToken,{status:"failed",failure,
    completedAt:new Date().toISOString()});
}

function delay(ms) { return new Promise((resolve)=>setTimeout(resolve,ms)); }

export async function validateStoredBootstrapReceipt(run) {
  const bytes=await readFile(run.receiptPath);
  const digest=createHash("sha256").update(bytes).digest("hex");
  if (digest!==run.receiptSha256) throw new Error("Bootstrap completed receipt digest changed");
}

export async function waitForBootstrapRun(file,identity,{timeoutMs=600_000,pollMs=100,
  validateReceipt=false}={}) {
  const deadline=Date.now()+timeoutMs;
  while (Date.now()<=deadline) {
    const run=await readBootstrapRun(file);
    const recovery=recoverBootstrapRun(run,identity);
    if (recovery.action==="use-receipt") {
      if (validateReceipt) await validateStoredBootstrapReceipt(run);
      return run;
    }
    if (recovery.action==="report-failure") {
      throw new Error(`Bootstrap stored failure: ${run.failure}`);
    }
    await delay(pollMs);
  }
  throw new Error("Bootstrap running receipt wait timed out");
}
