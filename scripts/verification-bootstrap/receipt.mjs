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
      receipt.taskResults.some((result,index)=>result.key!==plan.tasks[index].key||
        result.status!=="passed"||JSON.stringify(result.identity)!==JSON.stringify(plan.tasks[index]))) {
    if (receipt.taskResults?.length===plan.tasks.length&&receipt.taskResults.some((result,index)=>result.identity&&
      JSON.stringify(result.identity)!==JSON.stringify(plan.tasks[index]))) {
      throw new Error("Bootstrap receipt command identity does not match the canonical plan");
    }
    throw new Error("Bootstrap receipt task results do not match the exact plan");
  }
  const {receiptDigest,...unsigned}=receipt;
  if (receiptDigest!==bootstrapDigest(unsigned)) throw new Error("Bootstrap receipt digest is invalid");
  return structuredClone(receipt);
}

export function createReviewBootstrapReceipt({plan,taskResults,runId,startedAt,completedAt,
  registryDigest=plan.registryDigest}) {
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
      planDigest:canonical.planDigest,registryDigest,
      sourceClosureDigest:canonical.sourceClosureDigest,
      sourceTaskKeys:[...canonical.sourceTaskKeys],
      sourceOwnerPackIds:[...canonical.sourceOwnerPackIds],
      sourcePrerequisiteTaskKeys:[...canonical.sourcePrerequisiteTaskKeys],
      sourceConsumerTaskKeys:[...canonical.sourceConsumerTaskKeys],
      sourcePropertyTaskKeys:[...canonical.sourcePropertyTaskKeys],
      sourcePackageTaskKeys:[...canonical.sourcePackageTaskKeys],
      toolchainDigest:canonical.toolchainDigest,
      artifactDigest:canonical.artifactDigest,forecastMs:canonical.forecastMs,
      parentFallback:false,sliceIds:[...canonical.sliceIds],
      taskKeys:[...canonical.taskKeys],changedPathProjection:canonical.changedPathProjection},
  };
}

export function validateReviewBootstrapReceipt(receipt,value,registryDigest=value.registryDigest) {
  const plan=canonicalBootstrapPlan(value),binding=receipt?.processFastPathBootstrap;
  if (receipt?.version!==2||receipt.runIntent!=="review-evidence"||
      receipt.candidate?.commit!==plan.candidateCommit||receipt.candidate?.tree!==plan.candidateTree||
      receipt.plan?.mode!=="bootstrap-fast-path"||
      JSON.stringify(receipt.plan?.packIds)!==JSON.stringify(plan.packIds)||
      JSON.stringify(receipt.plan?.requestedPackIds)!==JSON.stringify(plan.packIds)||
      JSON.stringify(receipt.plan?.selectedPackIds)!==JSON.stringify(plan.packIds)||
      (receipt.plan?.terminalFullObligations??[]).length!==0||
      receipt.plan?.taskPlanDigest!==plan.planDigest||binding?.planDigest!==plan.planDigest||
      binding?.task!==plan.task||binding?.baseCommit!==plan.baseCommit||
      binding?.candidateCommit!==plan.candidateCommit||binding?.candidateTree!==plan.candidateTree||
      binding?.registryDigest!==registryDigest||binding?.artifactDigest!==plan.artifactDigest||
      binding?.sourceClosureDigest!==plan.sourceClosureDigest||
      JSON.stringify(binding?.sourceTaskKeys)!==JSON.stringify(plan.sourceTaskKeys)||
      JSON.stringify(binding?.sourceOwnerPackIds)!==JSON.stringify(plan.sourceOwnerPackIds)||
      JSON.stringify(binding?.sourcePrerequisiteTaskKeys)!==
        JSON.stringify(plan.sourcePrerequisiteTaskKeys)||
      JSON.stringify(binding?.sourceConsumerTaskKeys)!==JSON.stringify(plan.sourceConsumerTaskKeys)||
      JSON.stringify(binding?.sourcePropertyTaskKeys)!==JSON.stringify(plan.sourcePropertyTaskKeys)||
      JSON.stringify(binding?.sourcePackageTaskKeys)!==JSON.stringify(plan.sourcePackageTaskKeys)||
      binding?.toolchainDigest!==plan.toolchainDigest||binding?.forecastMs!==plan.forecastMs||
      binding?.parentFallback!==false||
      JSON.stringify(binding?.sliceIds)!==JSON.stringify(plan.sliceIds)||
      JSON.stringify(binding?.taskKeys)!==JSON.stringify(plan.taskKeys)||
      JSON.stringify(binding?.changedPathProjection)!==JSON.stringify(plan.changedPathProjection)||
      JSON.stringify(receipt.plan?.changedPaths)!==JSON.stringify(plan.changedPaths)) {
    throw new Error("Bootstrap review receipt identity does not match the independent plan");
  }
  const results=Object.values(receipt.tasks??{});
  if (results.length!==plan.tasks.length||results.some((result)=>{
    const task=plan.tasks.find(({key})=>key===result.key);
    return !task||result.status!=="passed"||JSON.stringify(result.identity)!==JSON.stringify(task);
  })) throw new Error("Bootstrap review receipt command identities do not match the independent plan");
  return structuredClone(receipt);
}
