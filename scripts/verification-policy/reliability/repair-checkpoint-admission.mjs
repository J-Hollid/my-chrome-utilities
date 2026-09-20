import {claimableRepairCheckpointIds,createTimeoutIncidentStore} from
  "../../verification-reliability-store.mjs";
import {terminalCheckpointCandidate} from "../../verification-reliability-repair.mjs";
import {timeoutRepairPackIds} from "../../verification-reliability-values.mjs";
import {boundedTerminalClosure,compatibleTerminalClosureIncident} from "./terminal-closure.mjs";
import {effectiveEligibleRepair} from "./eligible-repair-checkpoint-correction.mjs";

function sameSet(left,right) {
  return JSON.stringify([...left].sort())===JSON.stringify([...right].sort());
}

export function compatibleTimeoutRepairIncidentIds({requestedId,blocking,candidateCommit,
  candidateTree,baseCommit,evidenceTask,requestedPackIds,exactRunnablePackIds,closurePolicy}) {
  exactRunnablePackIds??=timeoutRepairPackIds;
  if (!blocking.some(({id})=>id===requestedId)) {
    throw new Error("Repair checkpoint requires an applicable reliability incident");
  }
  if (!sameSet(requestedPackIds,exactRunnablePackIds)) {
    throw new Error("Repair checkpoint requires the eligible repair candidate and exact all-runnable-pack plan");
  }
  const checkpoint={baseCommit,evidenceTask,candidateCommit,candidateTree,closurePolicy};
  const boundedClosureCheckpoint=boundedTerminalClosure(checkpoint);
  const incompatible=blocking.find((incident)=>{
    if(boundedClosureCheckpoint)return !compatibleTerminalClosureIncident(incident,checkpoint);
    const deferredConfirmedFlaky=incident.terminalVerificationDeferred?.basis==="confirmed-flaky";
    const eligibleRepair=effectiveEligibleRepair(incident)?.status==="eligible";
    const repairCandidate=terminalCheckpointCandidate(incident);
    const binding=deferredConfirmedFlaky?{
      baseCommit:incident.terminalVerificationDeferred.reviewReady.baseCommit,
      evidenceTask:incident.terminalVerificationDeferred.reviewReady.task,
    }:effectiveEligibleRepair(incident)?.checkpoint;
    return !(eligibleRepair||deferredConfirmedFlaky)||
      !eligibleRepair&&(repairCandidate?.commit!==candidateCommit||repairCandidate?.tree!==candidateTree)||
      binding?.baseCommit!==baseCommit||binding?.evidenceTask!==evidenceTask;
  });
  if(incompatible)throw new Error(`Repair checkpoint is blocked by incompatible reliability incident ${incompatible.id}`);
  return blocking.map(({id})=>id).sort();
}

export async function repairPlanningOptions({options,candidateCommit,terminalCheckpoint=false,
  store=createTimeoutIncidentStore()}) {
  if(!options.changeSet||!terminalCheckpoint)return options;
  const incidents=await store.blocking({commit:candidateCommit});
  const excluded=new Set();
  for(const incident of incidents) {
    if(incident.repair?.status!=="eligible")continue;
    for(const changedPath of incident.repair.changedPaths??[])excluded.add(changedPath);
  }
  return excluded.size?{...options,excludedChangedPaths:[...excluded].sort()}:options;
}

export async function claimRepairCheckpointAggregate({store,runId,requestedId,blocking,
  candidateCommit,candidateTree,baseCommit,evidenceTask,requestedPackIds,exactRunnablePackIds,
  closurePolicy}) {
  const incidentIds=compatibleTimeoutRepairIncidentIds({requestedId,blocking,candidateCommit,
    candidateTree,baseCommit,evidenceTask,requestedPackIds,exactRunnablePackIds,closurePolicy});
  const claimIds=claimableRepairCheckpointIds(
    blocking.filter(({id})=>incidentIds.includes(id)));
  await Promise.all(claimIds.map((id)=>store.assertRepairCheckpointClaimable(id)));
  for(const id of claimIds)await store.claimRepairCheckpoint(id,runId);
  return {incidentIds,claimedIncidentIds:claimIds};
}
