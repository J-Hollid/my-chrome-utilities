import {randomUUID} from "node:crypto";
import {execFile} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";

import {canonicalBaselineDiagnostic,executeCanonicalDiagnosticAtCommit} from
  "./baseline-diagnostic-authentication.mjs";
import {timeoutIncidentDigest} from "../../verification-reliability-values.mjs";

const exec=promisify(execFile);

export async function produceBaselineDiagnosticReceipt(root,{commit,tree,checkKey},{
  derive=canonicalBaselineDiagnostic,execute=executeCanonicalDiagnosticAtCommit,
  now=()=>new Date().toISOString(),identifier=randomUUID,
}={}) {
  const git=async(...args)=>(await exec("git",args,{cwd:root,encoding:"buffer",
    maxBuffer:16*1024*1024})).stdout;
  const actualTree=(await git("rev-parse",`${commit}^{tree}`)).toString().trim();
  if(actualTree!==tree)throw new Error("Baseline diagnostic producer requires the exact tree");
  const toolchainDigest=timeoutIncidentDigest(await git("show",
    `${commit}:swarmforge/toolchain.lock.json`));
  const canonical=await derive(root,{commit,checkKey,toolchainDigest});
  const startedAt=now();
  const result=await execute(root,commit,canonical);
  const completedAt=now();
  if(result.status!=="failed") {
    throw new Error("Baseline diagnostic producer requires a canonical failing check");
  }
  const receipt={version:1,runIntent:"baseline-diagnostic",commit,tree,toolchainDigest,checkKey,
    task:canonical.task,taskDigest:canonical.taskDigest,relevantInputs:canonical.relevantInputs,
    result:{status:"failed",failureDigest:result.failureDigest},startedAt,completedAt};
  const directory=path.join(root,"tmp","verification-receipts");
  await mkdir(directory,{recursive:true});
  const receiptPath=path.join(directory,`baseline-diagnostic-${commit.slice(0,12)}-${identifier()}.json`);
  await writeFile(receiptPath,`${JSON.stringify(receipt,null,2)}\n`,{flag:"wx"});
  return {receipt,path:path.relative(root,receiptPath)};
}

export async function produceBaselineDiagnosticPair(root,binding,options={}) {
  const [base,candidate]=await Promise.all([
    produceBaselineDiagnosticReceipt(root,{...binding.base,checkKey:binding.checkKey},options),
    produceBaselineDiagnosticReceipt(root,{...binding.candidate,checkKey:binding.checkKey},options),
  ]);
  return {base,candidate};
}
