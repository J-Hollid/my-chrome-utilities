import {execFile} from "node:child_process";
import {mkdtemp,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";

import {completeTaskInputClosure} from "../../verification-reliability-closure.mjs";
import {timeoutIncidentDigest} from "../../verification-reliability-values.mjs";

const exec=promisify(execFile);

async function git(root,...args) {
  return (await exec("git",args,{cwd:root,maxBuffer:16*1024*1024})).stdout.trim();
}

async function gitBytes(root,...args) {
  return (await exec("git",args,{cwd:root,maxBuffer:16*1024*1024,encoding:"buffer"})).stdout;
}

async function executeAtCommit(root,commit,task) {
  const temporary=await mkdtemp(path.join(os.tmpdir(),"baseline-diagnostic-"));
  try {
    await git(root,"worktree","add","--detach",temporary,commit);
    let result;
    try {
      const completed=await exec(task.executable,task.args,{cwd:temporary,
        env:{...process.env,...task.environment},maxBuffer:16*1024*1024});
      result={code:0,signal:null,stdout:completed.stdout,stderr:completed.stderr};
    } catch(error) {
      result={code:error.code??1,signal:error.signal??null,
        stdout:error.stdout??"",stderr:error.stderr??""};
    }
    return {status:result.code===0?"passed":"failed",
      failureDigest:timeoutIncidentDigest(result)};
  } finally {
    await exec("git",["worktree","remove","--force",temporary],{cwd:root});
    await rm(temporary,{recursive:true,force:true});
  }
}

async function deriveRelevantInputClosure(root,receipt) {
  const fields=["transitiveCode","featureInputs","handlerInputs","generatedInputs"];
  const declared=receipt.task.inputPaths;
  if(!Array.isArray(declared)||!declared.length||new Set(declared).size!==declared.length) {
    throw new Error("Deterministic baseline admission requires canonical task input paths");
  }
  const derived=[];
  for(const field of fields) {
    const paths=receipt.relevantInputs[field]?.paths;
    if(!Array.isArray(paths)||new Set(paths).size!==paths.length) {
      throw new Error("Deterministic baseline admission requires derived input paths");
    }
    const pathDigests=[];
    for(const inputPath of paths) {
      const bytes=await gitBytes(root,"show",`${receipt.commit}:${inputPath}`);
      pathDigests.push({path:inputPath,digest:timeoutIncidentDigest(bytes)});
      derived.push(inputPath);
    }
    if(timeoutIncidentDigest(pathDigests)!==receipt.relevantInputs[field].digest) {
      throw new Error(`Deterministic baseline admission input bytes changed for ${field}`);
    }
  }
  if(JSON.stringify([...derived].sort())!==JSON.stringify([...declared].sort())) {
    throw new Error("Deterministic baseline admission relevant input closure is incomplete");
  }
  return completeTaskInputClosure(receipt.relevantInputs);
}

export async function authenticateBaselineDiagnosticPair({root,baseDocument,candidateDocument,
  execute=executeAtCommit}={}) {
  const base=baseDocument.receipt,candidate=candidateDocument.receipt;
  const [baseTree,candidateTree,baseToolchain,candidateToolchain]=await Promise.all([
    git(root,"rev-parse",`${base.commit}^{tree}`),git(root,"rev-parse",`${candidate.commit}^{tree}`),
    gitBytes(root,"show",`${base.commit}:swarmforge/toolchain.lock.json`),
    gitBytes(root,"show",`${candidate.commit}:swarmforge/toolchain.lock.json`),
  ]);
  await git(root,"merge-base","--is-ancestor",base.commit,candidate.commit);
  if(base.tree!==baseTree||candidate.tree!==candidateTree) {
    throw new Error("Deterministic baseline admission requires exact repository trees");
  }
  const baseToolchainDigest=timeoutIncidentDigest(baseToolchain);
  const candidateToolchainDigest=timeoutIncidentDigest(candidateToolchain);
  if(base.toolchainDigest!==baseToolchainDigest||candidate.toolchainDigest!==candidateToolchainDigest||
      baseToolchainDigest!==candidateToolchainDigest) {
    throw new Error("Deterministic baseline admission requires the locked toolchain digest");
  }
  const [baseClosure,candidateClosure]=await Promise.all([
    deriveRelevantInputClosure(root,base),deriveRelevantInputClosure(root,candidate),
  ]);
  if(baseClosure.digest!==candidateClosure.digest) {
    throw new Error("Deterministic baseline admission requires unchanged inputs");
  }
  const [baseResult,candidateResult]=await Promise.all([
    execute(root,base.commit,base.task),execute(root,candidate.commit,candidate.task),
  ]);
  for(const [receipt,result] of [[base,baseResult],[candidate,candidateResult]]) {
    if(result.status!=="failed"||result.failureDigest!==receipt.result.failureDigest) {
      throw new Error("Deterministic baseline admission requires an executed matching failure");
    }
  }
  return {baseDocument,candidateDocument,relevantInputsDigest:baseClosure.digest};
}
