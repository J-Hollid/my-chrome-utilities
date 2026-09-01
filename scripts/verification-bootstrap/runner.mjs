#!/usr/bin/env node
import {execFile} from "node:child_process";
import {createHash,randomUUID} from "node:crypto";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {bootstrapBaseCommit,bootstrapTask} from "./authority-config.mjs";
import {validateBootstrapAuthority} from "./authority.mjs";
import {immutableBasePlannerResult} from "./base-planner.mjs";
import {bootstrapDigest} from "./canonical.mjs";
import {bootstrapRunPath,claimBootstrapRun,completeBootstrapRun,failBootstrapRun,
  waitForBootstrapRun} from "./durable-store.mjs";
import {bootstrapEnvironmentPreflight} from "./environment-preflight.mjs";
import {executeBootstrapPlan} from "./executor.mjs";
import {fixedBootstrapRegistry} from "./fixed-registry.mjs";
import {parseMutationDiscovery,validateMutationTarget} from "./mutation.mjs";
import {createReviewBootstrapReceipt,validateReviewBootstrapReceipt} from "./receipt.mjs";
import {bootstrapReceiptPath,fileDigest,git,repositoryContext,toolchainDigest} from "./repository.mjs";
import {projectBootstrapPlan,validateBasePlannerTransition} from "./transition-plan.mjs";

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
    const startedAt=new Date().toISOString();
    execFile(task.executable,task.args,{cwd:root,maxBuffer:task.outputLimitBytes},(error,stdout,stderr)=>{
      if (error) return reject(new Error(`${task.key} failed\n${stderr||stdout||error.message}`));
      resolve({key:task.key,status:"passed",identity:task,startedAt,
        completedAt:new Date().toISOString(),stdout,stderr});
    });
  });
}

function validateMutationTask(task,result,plan) {
  if (task.stage!=="mutation-discovery") return;
  const line=result.stdout.split("\n").findLast((value)=>value.startsWith("{"));
  let discovery;
  try { discovery=JSON.parse(line).bootstrapMutationDiscovery; }
  catch { throw new Error("Bootstrap mutation discovery result is not valid JSON"); }
  const parsed=parseMutationDiscovery(discovery.output);
  if (parsed.total!==discovery.total||parsed.changed!==discovery.changed) {
    throw new Error("Bootstrap mutation discovery counts changed");
  }
  validateMutationTarget(discovery,discovery.targetKey,plan);
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
  const registry=fixedBootstrapRegistry();
  const basePlan=await immutableBasePlannerResult(registry,{repositoryRoot:root});
  validateBasePlannerTransition(basePlan,candidatePlan);
  validateBootstrapAuthority({task:input.task,baseCommit:context.baseCommit,
    acceptedCandidate:await acceptedCandidate(context.candidateCommit)},candidatePlan);
  const preflight=await bootstrapEnvironmentPreflight({root,plan:candidatePlan,
    candidateCommit:context.candidateCommit});
  if (input.planOnly) {
    const answer={version:1,task:input.task,baseCommit:context.baseCommit,
      candidateCommit:context.candidateCommit,candidateTree:context.candidateTree,
      planOnly:true,classification:"bounded-ready",packIds:candidatePlan.packIds,
      sliceIds:candidatePlan.sliceIds,taskCount:candidatePlan.tasks.length,
      forecastMs:candidatePlan.forecastMs,parentFallback:candidatePlan.parentFallback,
      immutableBasePlanner:{classification:basePlan.classification,
        plannedPackIds:basePlan.plannedPackIds,taskCount:basePlan.taskCount},
      earlyGate:preflight.gate,
      changedPaths:candidatePlan.changedPaths,
      changedPathProjection:candidatePlan.changedPathProjection,
      taskKeys:candidatePlan.taskKeys};
    process.stdout.write(`${JSON.stringify(answer,null,2)}\n`);
    return answer;
  }
  const runId=bootstrapDigest({candidateCommit:context.candidateCommit,
    candidateTree:context.candidateTree,planDigest:candidatePlan.planDigest,toolchainDigest:toolchain,
    registryDigest:candidatePlan.registryDigest,task:input.task,incidentIds:preflight.incidentIds});
  const identity={candidateCommit:context.candidateCommit,candidateTree:context.candidateTree,
    planDigest:candidatePlan.planDigest,toolchainDigest:toolchain,
    registryDigest:candidatePlan.registryDigest,task:input.task,incidentIds:preflight.incidentIds};
  const runFile=bootstrapRunPath(root,runId),ownerToken=randomUUID();
  const claim=await claimBootstrapRun(runFile,identity,ownerToken);
  if (claim.action!=="start") {
    const stored=claim.action==="wait"
      ?await waitForBootstrapRun(runFile,identity,{validateReceipt:true})
      :claim.run;
    if (stored.status==="failed") throw new Error(`Bootstrap stored failure: ${stored.failure}`);
    const bytes=await readFile(stored.receiptPath);
    const receipt=JSON.parse(bytes);
    validateReviewBootstrapReceipt(receipt,projectBootstrapPlan({...context,
      toolchainDigest:toolchain,artifactDigest:receipt.processFastPathBootstrap.artifactDigest}),
    candidatePlan.registryDigest);
    process.stdout.write(`[bootstrap:receipt] ${stored.receiptSourcePath}\n`);
    return stored;
  }
  const startedAt=claim.run.startedAt;
  try {
    const taskResults=await executeBootstrapPlan(candidatePlan,{runTask:runCommand,
      afterTask:(task,result)=>validateMutationTask(task,result,candidatePlan)});
    const artifactDigest=await fileDigest(path.join(root,"build/package/my-chrome-utilities.zip"));
    const finalPlan=projectBootstrapPlan({...context,toolchainDigest:toolchain,artifactDigest});
    validateBasePlannerTransition(basePlan,finalPlan);
    const completedAt=new Date().toISOString();
    const receipt=createReviewBootstrapReceipt({plan:finalPlan,taskResults,runId,startedAt,completedAt,
      registryDigest:candidatePlan.registryDigest});
    validateReviewBootstrapReceipt(receipt,finalPlan,candidatePlan.registryDigest);
    const receiptPath=bootstrapReceiptPath(root);
    await mkdir(path.dirname(receiptPath),{recursive:true});
    await writeFile(receiptPath,`${JSON.stringify(receipt,null,2)}\n`,{flag:"wx",mode:0o600});
    const receiptSha256=createHash("sha256").update(await readFile(receiptPath)).digest("hex");
    const complete=await completeBootstrapRun(runFile,ownerToken,{runId,receiptPath,
      receiptSourcePath:path.relative(root,receiptPath),receiptSha256});
    process.stdout.write(`[bootstrap:receipt] ${complete.receiptSourcePath}\n`);
    process.stdout.write(`[bootstrap:record-review] node scripts/settled-final-verification.mjs record-review ${complete.receiptSourcePath} ${context.baseCommit} ${input.task}\n`);
    return complete;
  } catch (error) {
    await failBootstrapRun(runFile,ownerToken,error.message);
    throw error;
  }
}

if (process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  runBootstrap().catch((error)=>{console.error(error.message);process.exitCode=1;});
}
