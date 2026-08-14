import {timeoutRepairCandidate} from "./verification-reliability-repair.mjs";

export async function eligibleRepairCoversEvidenceCandidate({incident,commit,root,isAncestor,
  commitDescendsFrom}) {
  const repairCandidate = timeoutRepairCandidate(incident);
  return Boolean(incident.repair?.status === "eligible" && repairCandidate?.commit &&
    await commitDescendsFrom({root, isAncestor, ancestor:repairCandidate.commit, commit}));
}
