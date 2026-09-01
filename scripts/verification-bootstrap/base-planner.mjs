import {verificationPacksAtCommit} from "../verification-changes.mjs";
import {intentOwnershipReadiness} from "../verification-ownership-readiness-core.mjs";
import {activeVerificationSliceQuarantineIds} from "../verification-slice-quarantine.mjs";
import {planVerification} from "../verification-packs.mjs";

const taskKeysByStage=(tasks,stage)=>tasks.filter((task)=>task.stage===stage)
  .map(({key})=>key);

export async function plannerClosureAtCommit(registry,commit,{repositoryRoot}) {
  const packs=await verificationPacksAtCommit(commit,{repositoryRoot,
    historicalRegistryFallback:true});
  const plan=planVerification(packs,{changedPaths:registry.baseIntent.likelyPaths,
    includeProperties:true,historicalRegistryFallback:true});
  return {packIds:[...plan.packIds],ownerPackIds:[...new Set(Object.values(plan.changedOwners)
    .flat())].sort(),taskKeys:plan.tasks.map(({key})=>key),
  prerequisiteTaskKeys:taskKeysByStage(plan.tasks,"build"),
  consumerTaskKeys:taskKeysByStage(plan.tasks,"acceptance-session"),
  propertyTaskKeys:taskKeysByStage(plan.tasks,"property"),packageTaskKeys:["package:extension"]};
}

export async function immutableBasePlannerResult(registry,{repositoryRoot}) {
  const packs=await verificationPacksAtCommit(registry.baseCommit,{repositoryRoot,
    historicalRegistryFallback:true});
  const quarantinedSliceIds=await activeVerificationSliceQuarantineIds(registry.baseCommit,
    {repositoryRoot});
  return intentOwnershipReadiness({intent:{version:1,baseCommit:registry.baseCommit,
    task:registry.task,...structuredClone(registry.baseIntent)},packs,quarantinedSliceIds});
}
