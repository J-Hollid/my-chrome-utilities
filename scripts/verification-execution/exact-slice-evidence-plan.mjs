import {expandVerificationTaskPrerequisites} from
  "../verification-execution-prerequisites.mjs";
import {planVerification} from "../verification-packs.mjs";
import {bindExactSliceSuccessorPlan,exactSliceSuccessorFocusedTaskKeys} from
  "./exact-slice-successor.mjs";

const taskGroups=[
  "preparationTasks","unitTasks","propertyTasks","browserTasks","observationTasks",
  "parserTasks","generatorTasks","checkpointTasks","sessionTasks","packageTasks",
];

const bindChangeScope=(executionPlan,bindingPlan)=>({
  ...executionPlan,
  changedPaths:bindingPlan.changedPaths,
  changeSet:bindingPlan.changeSet,
  baseCommit:bindingPlan.baseCommit,
  changedOwners:bindingPlan.changedOwners,
  changedBoundaries:bindingPlan.changedBoundaries,
  styleSmokeTargets:bindingPlan.styleSmokeTargets,
  terminalFullObligations:bindingPlan.terminalFullObligations,
  changedStyleTargets:bindingPlan.changedStyleTargets,
  adapterAuthorizationPackIds:bindingPlan.adapterAuthorizationPackIds,
  conservativeHistoricalFallbackReason:bindingPlan.conservativeHistoricalFallbackReason,
});

export function canonicalExactSliceEvidencePlan(packs,{
  changeSet,basePacks,historicalRegistryFallback,packageTask,bindingPlan:providedBindingPlan,
}) {
  const planning={changeSet,basePacks,historicalRegistryFallback};
  const bindingPlan=providedBindingPlan??planVerification(packs,{
    ...planning,changedPaths:changeSet.paths,includeProperties:true,
  });
  const executionPlan=bindChangeScope(planVerification(packs,{
    ...planning,changeSet:null,basePacks:undefined,historicalRegistryFallback:false,
    changedPaths:["scripts/verification-execution/exact-slice-control.mjs",
      "swarmforge/scripts/unblocker-queue-storage.mjs"],includeProperties:false,
  }),bindingPlan);
  const canonical=planVerification(packs,{
    packIds:["shell","verification_process"],includeProperties:true,
  });
  const packaged={...canonical,tasks:[...canonical.tasks,structuredClone(packageTask)],
    packageTasks:[structuredClone(packageTask)]};
  const candidates=new Map(packaged.tasks.map((task)=>[task.key,task]));
  for(const task of executionPlan.tasks)candidates.set(task.key,task);
  const requested=exactSliceSuccessorFocusedTaskKeys.map((key)=>candidates.get(key));
  if(requested.some((task)=>!task))throw new Error("Exact-slice evidence task is not registered");
  const closed=expandVerificationTaskPrerequisites(requested,packaged.tasks,
    {mode:"ordinary-focused"});
  const groupByKey=new Map();
  for(const source of [packaged,executionPlan])for(const group of taskGroups){
    for(const task of source[group]??[])groupByKey.set(task.key,group);
  }
  groupByKey.set(packageTask.key,"packageTasks");
  const tasks=taskGroups.flatMap((group)=>closed.filter(({key})=>groupByKey.get(key)===group));
  return bindExactSliceSuccessorPlan({...executionPlan,mode:"focused-task",tasks,
    includeProperties:true,focusedTaskKeys:[...exactSliceSuccessorFocusedTaskKeys]});
}
