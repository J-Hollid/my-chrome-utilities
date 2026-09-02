import {readFile} from "node:fs/promises";
import path from "node:path";

const sameValue=(left,right)=>JSON.stringify(left)===JSON.stringify(right);

export function validateArtifactBoundRepairContinuation(receipt,{incidentId,candidate,plan}){
  const plannedKeys=new Set((plan?.executionTaskPlan??[]).map(({identity})=>identity.key));
  const taskEntries=Object.entries(receipt?.tasks??{});
  const receiptPlan={...(receipt?.plan??{})};
  delete receiptPlan.executionPrerequisites;
  const exactCandidate=receipt?.candidate?.commit===candidate?.commit&&
    receipt?.candidate?.tree===candidate?.tree&&
    receipt?.candidate?.baseCommit===candidate?.baseCommit&&
    receipt?.candidate?.evidenceTask===candidate?.evidenceTask&&
    receipt?.candidate?.changeSetDigest===candidate?.changeSetDigest;
  const valid=receipt?.version===2&&receipt.runIntent==="repair"&&!receipt.completedAt&&
    receipt.plan?.mode==="timeout-repair-focused"&&receipt.plan.incidentId===incidentId&&
    exactCandidate&&sameValue(receiptPlan,plan)&&taskEntries.length>0&&
    taskEntries.every(([key,result])=>plannedKeys.has(key)&&result?.status==="passed");
  const buildKey=(plan?.executionTaskPlan??[])
    .find(({identity})=>identity.stage==="build")?.identity.key;
  if(!valid||(buildKey&&receipt.tasks[buildKey]&&!receipt.artifact)){
    throw new Error("Repair continuation receipt is incomplete, stale, or mismatched");
  }
  return receipt;
}

export async function createArtifactBoundRepairContext({
  resumeReceiptPath,repositoryRoot,incidentId,candidate,plan,runIntent,
  concurrency,observationConcurrency,receiptContextFactory,
}){
  let continuation;
  if(resumeReceiptPath){
    const receiptPath=path.join(repositoryRoot,resumeReceiptPath);
    const receipt=JSON.parse(await readFile(receiptPath,"utf8"));
    validateArtifactBoundRepairContinuation(receipt,{incidentId,candidate,plan});
    continuation={receiptPath,receipt};
  }
  const context=receiptContextFactory(concurrency,observationConcurrency,{runIntent,continuation});
  context.receipt.candidate=candidate;
  context.receipt.plan=continuation?{...plan,
    executionPrerequisites:continuation.receipt.plan.executionPrerequisites??[]}:plan;
  return context;
}

export async function executeArtifactBoundRepairPlan(executionTaskPlan, {
  context,
  runtimeTasks,
  prepareLaunch,
  artifactIdentity,
  runnerFactory,
  executePlan,
}) {
  const buildDescriptors=executionTaskPlan.filter(({identity})=>identity.stage==="build");
  if(buildDescriptors.length>1){
    throw new Error("Reliability repair accepts at most one selected build task");
  }
  const passedKeys=new Set(Object.entries(context.receipt.tasks??{})
    .filter(([,result])=>result?.status==="passed").map(([key])=>key));
  const pendingBuildDescriptors=buildDescriptors
    .filter(({identity})=>!passedKeys.has(identity.key));
  const remainingDescriptors=executionTaskPlan
    .filter(({identity})=>identity.stage!=="build"&&!passedKeys.has(identity.key));
  const runtimeByKey=new Map(runtimeTasks.map((task)=>[task.key,task]));
  const prerequisiteRecords=[...(context.receipt.plan.executionPrerequisites??[])];
  const executePhase=async(descriptors,artifact)=>{
    if(!descriptors.length)return;
    const tasks=descriptors.map(({identity})=>runtimeByKey.get(identity.key));
    if(tasks.some((task)=>!task)){
      throw new Error("Reliability repair phase lacks a registered runtime task");
    }
    let launch;
    try{
      launch=await prepareLaunch(context,tasks,{artifact});
    }finally{
      const phaseKeys=new Set(tasks.map(({key})=>key));
      prerequisiteRecords.push(...(context.receipt.plan.executionPrerequisites??[])
        .filter((record)=>phaseKeys.has(record.key??record.taskKey)));
      context.receipt.plan.executionPrerequisites=prerequisiteRecords;
      await context.write();
    }
    const runner=runnerFactory(context,launch);
    await executePlan(descriptors,{runner});
  };
  if(pendingBuildDescriptors.length)await executePhase(pendingBuildDescriptors,null);
  const artifact=await artifactIdentity();
  if(buildDescriptors.length&&!pendingBuildDescriptors.length&&
      !sameValue(context.receipt.artifact,artifact)){
    throw new Error("Repair continuation artifact is stale or mismatched");
  }
  context.receipt.artifact=structuredClone(artifact);
  await context.write();
  const pendingNonBuildDescriptors=buildDescriptors.length?remainingDescriptors:
    executionTaskPlan.filter(({identity})=>!passedKeys.has(identity.key));
  await executePhase(pendingNonBuildDescriptors,artifact);
  return artifact;
}
