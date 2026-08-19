import {timeoutRepairCandidate} from "./verification-reliability-repair.mjs";
import {timeoutIncidentDigest} from "./verification-reliability-values.mjs";

export async function eligibleRepairCoversEvidenceCandidate({incident,commit,root,isAncestor,
  commitDescendsFrom}) {
  const repairCandidate = timeoutRepairCandidate(incident);
  return Boolean(incident.repair?.status === "eligible" && repairCandidate?.commit &&
    await commitDescendsFrom({root, isAncestor, ancestor:repairCandidate.commit, commit}));
}

export function confirmedFlakyAdmissionCoversEvidenceCandidate({ incident, commit, admissions }) {
  const entry = admissions?.entries?.find(({ incidentId }) => incidentId === incident.id);
  const latest = incident.lineageTransitions?.at(-1);
  const candidateTree = incident.failure?.lineage?.commit === commit
    ? incident.failure.lineage.tree
    : latest?.kind === "rebase" && latest.toCommit === commit ? latest.toTree : undefined;
  return Boolean(entry && admissions.version === 1 && admissions.candidateCommit === commit &&
    admissions.candidateTree === candidateTree && incident.state === "unresolved" &&
    incident.repair === undefined && incident.terminalVerificationDeferred === undefined &&
    incident.retry?.status === "classified" && incident.retry.outcome === "passed" &&
    incident.retry.classification === "confirmed-flaky" &&
    incident.retry.identity === incident.failure?.retryIdentity &&
    entry.failureDigest === incident.failureDigest &&
    entry.causalKey === incident.failure?.causalKey &&
    entry.retryIdentity === incident.retry.identity &&
    entry.retryReceiptSha256 === incident.retry.receiptSha256 &&
    entry.classificationDigest === timeoutIncidentDigest(incident.retry));
}
