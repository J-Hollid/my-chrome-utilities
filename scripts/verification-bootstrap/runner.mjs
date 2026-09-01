#!/usr/bin/env node
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {bootstrapBaseCommit,bootstrapTask} from "./authority-config.mjs";
import {validateBootstrapAuthority} from "./authority.mjs";
import {bootstrapDigest} from "./canonical.mjs";
import {bootstrapRunPath,readBootstrapRun,writeBootstrapRun} from "./durable-store.mjs";
import {executeBootstrapPlan} from "./executor.mjs";
import {createReviewBootstrapReceipt} from "./receipt.mjs";
import {recoverBootstrapRun} from "./recovery.mjs";
import {bootstrapReceiptPath,fileDigest,git,repositoryContext,toolchainDigest} from "./repository.mjs";
import {compareProjectedBootstrapPlans,projectBootstrapPlan} from "./transition-plan.mjs";

const root=fileURLToPath(new URL("../../",import.meta.url));

function options(args) {
  const result={base:bootstrapBaseCommit,candidate:"HEAD",task:bootstrapTask};
  for (let index=0;index<args.length;index+=1) {
    const key=args[index];
    if (key==="--plan-only") { result.planOnly=true;continue; }
    const value=args[index+1];
    if (!value) throw new Error(`${key} requires a value`);
    if (key==="--base") result.base=value;
    else if (key==="--candidate") result.candidate=value;
    else if (key==="--task") result.task=value;
    else if (key==="--prepare-evidence") result.prepareEvidence=value;
    else throw new Error(`Unknown bootstrap option: ${key}`);
    index+=1;
  }
  return result;
}

function runCommand(task) {
  return new Promise((resolve,reject)=>{
    const [command,...args]=task.command;
    const startedAt=new Date().toISOString();
    execFile(command,args,{cwd:root,maxBuffer:64*1024*1024},(error,stdout,stderr)=>{
      if (error) return reject(new Error(`${task.key} failed\n${stderr||stdout||error.message}`));
      resolve({key:task.key,status:"passed",identity:task,startedAt,
        completedAt:new Date().toISOString(),stdout,stderr});
    });
  });
}

async function acceptedCandidate(candidateCommit) {
  try {
    const qa=await git(root,"rev-parse","qa^{commit}");
    await git(root,"merge-base","--is-ancestor",candidateCommit,qa);
    return candidateCommit;
  } catch { return null; }
}

export async function runBootstrap(args=process.argv.slice(2)) {
  const input=options(args);
  if (input.task!==bootstrapTask||input.prepareEvidence&&input.prepareEvidence!==bootstrapTask) {
    throw new Error("Bootstrap task identity does not match its authority");
  }
  const context=await repositoryContext(root,input.base,input.candidate);
  const toolchain=await toolchainDigest(root);
  const candidatePlan=projectBootstrapPlan({...context,toolchainDigest:toolchain});
  const basePlan=projectBootstrapPlan({...context,candidateCommit:context.baseCommit,
    candidateTree:await git(root,"rev-parse",`${context.baseCommit}^{tree}`),toolchainDigest:toolchain});
  compareProjectedBootstrapPlans(basePlan,candidatePlan);
  validateBootstrapAuthority({task:input.task,baseCommit:context.baseCommit,
    acceptedCandidate:await acceptedCandidate(context.candidateCommit)},candidatePlan);
  if (input.planOnly) {
    const answer={version:1,task:input.task,baseCommit:context.baseCommit,
      candidateCommit:context.candidateCommit,candidateTree:context.candidateTree,
      planOnly:true,classification:"bounded-ready",packIds:candidatePlan.packIds,
      sliceIds:candidatePlan.sliceIds,taskCount:candidatePlan.tasks.length,
      forecastMs:candidatePlan.forecastMs,parentFallback:candidatePlan.parentFallback,
      changedPaths:candidatePlan.changedPaths,
      changedPathProjection:candidatePlan.changedPathProjection,
      taskKeys:candidatePlan.taskKeys};
    process.stdout.write(`${JSON.stringify(answer,null,2)}\n`);
    return answer;
  }
  const runId=bootstrapDigest({candidateCommit:context.candidateCommit,
    candidateTree:context.candidateTree,planDigest:candidatePlan.planDigest,toolchainDigest:toolchain,
    task:input.task,incidentIds:[]});
  const identity={candidateCommit:context.candidateCommit,candidateTree:context.candidateTree,
    planDigest:candidatePlan.planDigest,toolchainDigest:toolchain,task:input.task,incidentIds:[]};
  const runFile=bootstrapRunPath(root,runId),stored=await readBootstrapRun(runFile);
  if (stored) {
    const recovery=recoverBootstrapRun(stored,identity);
    if (recovery.action==="use-receipt") return stored;
    if (recovery.action==="attach") throw new Error(`Bootstrap run is already active: ${runId}`);
    throw new Error(`Bootstrap run already failed: ${stored.failure}`);
  }
  const startedAt=new Date().toISOString();
  await writeBootstrapRun(runFile,{...identity,runId,status:"running",startedAt,taskResults:[]});
  try {
    const taskResults=await executeBootstrapPlan(candidatePlan,{runTask:runCommand});
    const artifactDigest=await fileDigest(path.join(root,"build/package/my-chrome-utilities.zip"));
    const finalPlan=projectBootstrapPlan({...context,toolchainDigest:toolchain,artifactDigest});
    compareProjectedBootstrapPlans(candidatePlan,finalPlan);
    const completedAt=new Date().toISOString();
    const receipt=createReviewBootstrapReceipt({plan:finalPlan,taskResults,runId,startedAt,completedAt});
    const receiptPath=bootstrapReceiptPath(root);
    await mkdir(path.dirname(receiptPath),{recursive:true});
    await writeFile(receiptPath,`${JSON.stringify(receipt,null,2)}\n`,{flag:"wx",mode:0o600});
    const complete={...identity,status:"completed",runId,startedAt,completedAt,
      receiptPath:path.relative(root,receiptPath),receiptSha256:createHash("sha256")
        .update(await import("node:fs/promises").then(({readFile})=>readFile(receiptPath))).digest("hex")};
    await writeBootstrapRun(runFile,complete);
    process.stdout.write(`[bootstrap:receipt] ${complete.receiptPath}\n`);
    process.stdout.write(`[bootstrap:record-review] node scripts/settled-final-verification.mjs record-review ${complete.receiptPath} ${context.baseCommit} ${input.task}\n`);
    return complete;
  } catch (error) {
    await writeBootstrapRun(runFile,{...identity,status:"failed",runId,startedAt,
      completedAt:new Date().toISOString(),failure:error.message});
    throw error;
  }
}

if (process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  runBootstrap().catch((error)=>{console.error(error.message);process.exitCode=1;});
}
