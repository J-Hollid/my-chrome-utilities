import {expandVerificationTaskPrerequisites} from
  "../verification-execution-prerequisites.mjs";
import {planVerification} from "../verification-packs.mjs";
import {createVerificationPackCardinalityAdapter} from
  "../verification-pack-cardinality/contract.mjs";
import {verificationPacksAtCommit} from "../verification-changes.mjs";
import {exactSliceSuccessorTask} from "./exact-slice-successor.mjs";
import {bindExactSliceSuccessorPlan} from
  "./exact-slice-successor.mjs";

const taskGroups=[
  "preparationTasks","unitTasks","propertyTasks","browserTasks","observationTasks",
  "parserTasks","generatorTasks","checkpointTasks","sessionTasks","packageTasks",
];

export function reliabilitySuccessionPlanProvider(blockingIncident,activeIncident,
  {exactPlanProvider,registryPlanner}){
  return blockingIncident.id===activeIncident.id?exactPlanProvider:registryPlanner;
}

export async function canonicalReliabilityRepairPlan(packs, {
  canonicalPlan,
  evidenceTask,
  changeSet,
  repositoryRoot,
  basePacksLoader=verificationPacksAtCommit,
  planner=planVerification,
}={}) {
  if(canonicalPlan)return canonicalPlan;
  if(evidenceTask===exactSliceSuccessorTask){
    const basePacks=await basePacksLoader(changeSet.baseCommit,{
      repositoryRoot,historicalRegistryFallback:true,
    });
    return planner(packs,{
      changedPaths:changeSet.paths,changeSet,basePacks,includeProperties:true,
    });
  }
  return planner(packs,{
    packIds:createVerificationPackCardinalityAdapter(packs).runnablePackIds,
    includeProperties:true,
  });
}

export function canonicalExactSliceEvidencePlan(packs,{
  changeSet,basePacks,historicalRegistryFallback,packageTask,bindingPlan:providedBindingPlan,
}) {
  const planning={changeSet,basePacks,historicalRegistryFallback};
  const bindingPlan=providedBindingPlan??planVerification(packs,{
    ...planning,changedPaths:changeSet.paths,includeProperties:true,
  });
  const canonical=planVerification(packs,{
    packIds:["shell","verification_process"],includeProperties:true,
  });
  const canonicalTaskRegistry=planVerification(packs,{
    packIds:createVerificationPackCardinalityAdapter(packs).runnablePackIds,
    includeProperties:true,
  });
  const packagePlanTask=structuredClone(packageTask);
  packagePlanTask.display=[packagePlanTask.executable,...packagePlanTask.args].join(" ");
  const packaged={...canonical,tasks:[...canonicalTaskRegistry.tasks,packagePlanTask],
    packageTasks:[packagePlanTask]};
  const closed=expandVerificationTaskPrerequisites(
    [...bindingPlan.tasks,packagePlanTask],packaged.tasks,
    {mode:bindingPlan.mode});
  const groupByKey=new Map();
  for(const source of [canonicalTaskRegistry,packaged,bindingPlan])for(const group of taskGroups){
    for(const task of source[group]??[])groupByKey.set(task.key,group);
  }
  groupByKey.set(packagePlanTask.key,"packageTasks");
  const groups=Object.fromEntries(taskGroups.map((group)=>
    [group,closed.filter(({key})=>groupByKey.get(key)===group)]));
  const tasks=taskGroups.flatMap((group)=>groups[group]);
  const commandsFor=(group)=>groups[group].map(({display})=>display);
  return bindExactSliceSuccessorPlan({...bindingPlan,...groups,tasks,includeProperties:true,
    preparationCommands:commandsFor("preparationTasks"),unitCommands:commandsFor("unitTasks"),
    propertyCommands:commandsFor("propertyTasks"),browserCommands:commandsFor("browserTasks"),
    observationCommands:commandsFor("observationTasks"),parserCommands:commandsFor("parserTasks"),
    generatorCommands:commandsFor("generatorTasks"),checkpointCommands:commandsFor("checkpointTasks"),
    sessionCommands:commandsFor("sessionTasks"),packageCommands:commandsFor("packageTasks"),
    acceptanceCommands:[...commandsFor("parserTasks"),...commandsFor("generatorTasks"),
      ...commandsFor("sessionTasks")],commands:tasks.map(({display})=>display)});
}
