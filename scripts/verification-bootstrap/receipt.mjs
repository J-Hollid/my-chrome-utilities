import {bootstrapDigest} from "./canonical.mjs";
import {canonicalBootstrapPlan} from "./plan.mjs";

function receiptIdentity(plan) {
  return {task:plan.task,baseCommit:plan.baseCommit,candidateCommit:plan.candidateCommit,
    candidateTree:plan.candidateTree,planDigest:plan.planDigest,
    toolchainDigest:plan.toolchainDigest,artifactDigest:plan.artifactDigest,
    taskKeys:plan.taskKeys};
}

export function createBootstrapReceipt(value,taskResults) {
  const plan=canonicalBootstrapPlan(value),identity=receiptIdentity(plan);
  const receipt={version:1,status:"passed",...identity,
    taskResults:taskResults.map((result)=>structuredClone(result))};
  return {...receipt,receiptDigest:bootstrapDigest(receipt)};
}

export function validateBootstrapReceipt(receipt,value) {
  const plan=canonicalBootstrapPlan(value),expected=receiptIdentity(plan);
  if (!receipt||receipt.version!==1||receipt.status!=="passed"||
      Object.entries(expected).some(([key,value_])=>JSON.stringify(receipt[key])!==JSON.stringify(value_))) {
    throw new Error("Bootstrap receipt identity does not match the exact plan");
  }
  if (!Array.isArray(receipt.taskResults)||receipt.taskResults.length!==plan.tasks.length||
      receipt.taskResults.some((result,index)=>result.key!==plan.tasks[index].key||result.status!=="passed")) {
    throw new Error("Bootstrap receipt task results do not match the exact plan");
  }
  const {receiptDigest,...unsigned}=receipt;
  if (receiptDigest!==bootstrapDigest(unsigned)) throw new Error("Bootstrap receipt digest is invalid");
  return structuredClone(receipt);
}

export function createReviewBootstrapReceipt({plan,taskResults,runId,startedAt,completedAt}) {
  const canonical=canonicalBootstrapPlan(plan);
  const tasks=Object.fromEntries(taskResults.map((result)=>[result.key,structuredClone(result)]));
  return {version:2,runId,runIntent:"review-evidence",
    candidate:{commit:canonical.candidateCommit,tree:canonical.candidateTree},
    plan:{version:1,mode:"bootstrap-fast-path",packIds:[...canonical.packIds],
      requestedPackIds:[...canonical.packIds],selectedPackIds:[...canonical.packIds],
      changedPaths:[...canonical.changedPaths],taskPlanDigest:canonical.planDigest,
      terminalFullObligations:[]},
    tasks,startedAt,completedAt,
    processFastPathBootstrap:{version:1,task:canonical.task,baseCommit:canonical.baseCommit,
      candidateCommit:canonical.candidateCommit,candidateTree:canonical.candidateTree,
      planDigest:canonical.planDigest,toolchainDigest:canonical.toolchainDigest,
      artifactDigest:canonical.artifactDigest,forecastMs:canonical.forecastMs,
      parentFallback:false,sliceIds:[...canonical.sliceIds],
      taskKeys:[...canonical.taskKeys],changedPathProjection:canonical.changedPathProjection},
  };
}
