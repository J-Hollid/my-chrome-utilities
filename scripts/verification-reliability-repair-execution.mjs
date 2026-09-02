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
  const remainingDescriptors=executionTaskPlan.filter(({identity})=>identity.stage!=="build");
  const runtimeByKey=new Map(runtimeTasks.map((task)=>[task.key,task]));
  const prerequisiteRecords=[];
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
  if(buildDescriptors.length)await executePhase(buildDescriptors,null);
  const artifact=await artifactIdentity();
  context.receipt.artifact=structuredClone(artifact);
  await context.write();
  await executePhase(buildDescriptors.length?remainingDescriptors:executionTaskPlan,artifact);
  return artifact;
}
