#!/usr/bin/env node
import {execFile} from "node:child_process";
import {createHash,randomUUID} from "node:crypto";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {bootstrapBaseCommit,bootstrapTask} from "./authority-config.mjs";
import {validateBootstrapAuthority} from "./authority.mjs";
import {immutableBasePlannerResult,plannerClosureAtCommit} from "./base-planner.mjs";
import {bootstrapDigest} from "./canonical.mjs";
import {bootstrapRunPath,claimBootstrapRun,completeBootstrapRun,failBootstrapRun,
  waitForBootstrapRun} from "./durable-store.mjs";
import {bootstrapEnvironmentState,validateBootstrapEnvironmentPreflight} from
  "./environment-preflight.mjs";
import {bootstrapPromotionState,inspectBootstrapEvidenceState} from "./evidence-state.mjs";
import {executeBootstrapPlan} from "./executor.mjs";
import {fixedBootstrapRegistry} from "./fixed-registry.mjs";
import {parseMutationDiscovery,validateMutationTarget} from "./mutation.mjs";
import {createReviewBootstrapReceipt,validateReviewBootstrapReceipt} from "./receipt.mjs";
import {bootstrapReceiptPath,fileDigest,git,repositoryContext,toolchainDigest} from "./repository.mjs";
import {projectBootstrapPlan,validatePlannerClosureTransition} from "./transition-plan.mjs";

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
  if (discovery.executableMutants!==discovery.changed) {
    throw new Error("Bootstrap mutation executable population changed");
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
  const registry=fixedBootstrapRegistry();
  const [basePlan,baseClosure,candidateClosure]=await Promise.all([
    immutableBasePlannerResult(registry,{repositoryRoot:root}),
    plannerClosureAtCommit(registry,context.baseCommit,{repositoryRoot:root}),
    plannerClosureAtCommit(registry,context.candidateCommit,{repositoryRoot:root}),
  ]);
  const candidatePlan=projectBootstrapPlan({...context,toolchainDigest:toolchain,
    plannerClosure:candidateClosure});
  validatePlannerClosureTransition({...basePlan,...baseClosure},candidateClosure,candidatePlan);
  validateBootstrapAuthority({task:input.task,baseCommit:context.baseCommit,
    acceptedCandidate:await acceptedCandidate(context.candidateCommit)},candidatePlan);
  const environment=await bootstrapEnvironmentState({root,plan:candidatePlan,
    candidateCommit:context.candidateCommit,provisionCapabilities:!input.planOnly});
  const runId=bootstrapDigest({candidateCommit:context.candidateCommit,
    candidateTree:context.candidateTree,planDigest:candidatePlan.planDigest,toolchainDigest:toolchain,
    registryDigest:candidatePlan.registryDigest,task:input.task,incidentIds:environment.incidentIds});
  const identity={candidateCommit:context.candidateCommit,candidateTree:context.candidateTree,
    planDigest:candidatePlan.planDigest,toolchainDigest:toolchain,
    registryDigest:candidatePlan.registryDigest,task:input.task,incidentIds:environment.incidentIds};
  const runFile=bootstrapRunPath(root,runId);
  const promotion=await bootstrapPromotionState(root,{...context,task:input.task});
  const evidenceState=await inspectBootstrapEvidenceState({runFile,identity,promotion});
  const preflight=validateBootstrapEnvironmentPreflight(environment,evidenceState);
  if (input.planOnly) {
    const answer={version:1,task:input.task,baseCommit:context.baseCommit,
      candidateCommit:context.candidateCommit,candidateTree:context.candidateTree,
      planOnly:true,classification:"bounded-ready",packIds:candidatePlan.packIds,
      sliceIds:candidatePlan.sliceIds,taskCount:candidatePlan.tasks.length,
      forecastMs:candidatePlan.forecastMs,parentFallback:candidatePlan.parentFallback,
      immutableBasePlanner:{classification:basePlan.classification,
        plannedPackIds:basePlan.plannedPackIds,taskCount:basePlan.taskCount,
        closureTaskKeys:baseClosure.taskKeys},
      candidatePlannerClosure:{taskKeys:candidateClosure.taskKeys,
        ownerPackIds:candidateClosure.ownerPackIds,
        prerequisiteTaskKeys:candidateClosure.prerequisiteTaskKeys,
        consumerTaskKeys:candidateClosure.consumerTaskKeys,
        propertyTaskKeys:candidateClosure.propertyTaskKeys,
        packageTaskKeys:candidateClosure.packageTaskKeys},
      earlyGate:preflight.gate,
      evidenceState,
      changedPaths:candidatePlan.changedPaths,
      changedPathProjection:candidatePlan.changedPathProjection,
      taskKeys:candidatePlan.taskKeys};
    process.stdout.write(`${JSON.stringify(answer,null,2)}\n`);
    return answer;
  }
  const ownerToken=randomUUID();
  const claim=await claimBootstrapRun(runFile,identity,ownerToken);
  if (claim.action!=="start") {
    const stored=await waitForBootstrapRun(runFile,identity,{validateReceipt:true});
    if (stored.status==="failed") throw new Error(`Bootstrap stored failure: ${stored.failure}`);
    const bytes=await readFile(stored.receiptPath);
    const receipt=JSON.parse(bytes);
    validateReviewBootstrapReceipt(receipt,projectBootstrapPlan({...context,
      toolchainDigest:toolchain,artifactDigest:receipt.processFastPathBootstrap.artifactDigest,
      plannerClosure:candidateClosure}),
    candidatePlan.registryDigest);
    process.stdout.write(`[bootstrap:receipt] ${stored.receiptSourcePath}\n`);
    return stored;
  }
  const startedAt=claim.run.startedAt;
  try {
    const taskResults=await executeBootstrapPlan(candidatePlan,{runTask:runCommand,
      afterTask:(task,result)=>validateMutationTask(task,result,candidatePlan)});
    const artifactDigest=await fileDigest(path.join(root,"build/package/my-chrome-utilities.zip"));
    const finalPlan=projectBootstrapPlan({...context,toolchainDigest:toolchain,artifactDigest,
      plannerClosure:candidateClosure});
    validatePlannerClosureTransition({...basePlan,...baseClosure},candidateClosure,finalPlan);
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
