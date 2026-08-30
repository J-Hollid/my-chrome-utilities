import { execFile } from "node:child_process";

import {
  boundedClosureContractRevision,
  boundedClosureEvidenceTask,
} from "../../verification-reliability-closure.mjs";
import {
  shaPattern,
  timeoutIncidentDigest,
} from "../../verification-reliability-values.mjs";
import { verificationTaskDigest } from "../../verification-task-succession.mjs";

const blockingAuditKinds = new Set([
  "blocking-product-repair",
  "blocking-verification-repair",
]);

function gitAncestor(root, ancestor, commit) {
  return new Promise((resolve) => execFile("git",
    ["merge-base", "--is-ancestor", ancestor, commit], { cwd:root },
    (error) => resolve(error === null)));
}

function policyIdentity({ baseCommit, evidenceTask, candidateCommit, candidateTree }) {
  return {
    version:1,
    kind:"vtd014-descendant-terminal-closure",
    contractRevision:boundedClosureContractRevision,
    baseCommit,
    evidenceTask,
    candidateCommit,
    candidateTree,
    ancestry:"git-merge-base-is-ancestor",
  };
}

export async function createTerminalClosurePolicy({
  root, baseCommit, evidenceTask, candidateCommit, candidateTree,
  isAncestor = (ancestor, commit) => gitAncestor(root, ancestor, commit),
}) {
  if (evidenceTask !== boundedClosureEvidenceTask ||
      !await isAncestor(boundedClosureContractRevision, baseCommit)) return undefined;
  const identity = policyIdentity({ baseCommit, evidenceTask, candidateCommit, candidateTree });
  return { ...identity, digest:timeoutIncidentDigest(identity) };
}

export function terminalClosurePolicyValid(policy, binding) {
  if (!policy || !binding) return false;
  const identity = policyIdentity(binding);
  return Object.keys(identity).every((key) => policy[key] === identity[key]) &&
    policy.digest === timeoutIncidentDigest(identity);
}

export function boundedTerminalClosure({
  baseCommit, evidenceTask, candidateCommit, candidateTree, closurePolicy,
}) {
  if (evidenceTask !== boundedClosureEvidenceTask) return false;
  if (baseCommit === boundedClosureContractRevision && closurePolicy === undefined) return true;
  return terminalClosurePolicyValid(closurePolicy,
    { baseCommit, evidenceTask, candidateCommit, candidateTree });
}

export function auditedBlockingClosure(incident) {
  return blockingAuditKinds.has(incident.closureAudit?.kind) &&
    incident.closureAudit.blocking === true && incident.closureAudit.resolved === false;
}

function exactReviewReadyProof(incident, deferred) {
  const reviewReady = deferred.reviewReady;
  return typeof reviewReady?.task === "string" && Boolean(reviewReady.task) &&
    typeof reviewReady.baseCommit === "string" && Boolean(reviewReady.baseCommit) &&
    reviewReady.candidateCommit === deferred.candidate?.commit &&
    reviewReady.candidateTree === deferred.candidate?.tree &&
    shaPattern.test(reviewReady.receiptSha256 ?? "") &&
    Array.isArray(reviewReady.focusedTaskKeys) && reviewReady.focusedTaskKeys.length > 0;
}

function exactBootstrapSourceProof(incident, deferred) {
  const bootstrap = deferred.runIntentBootstrap;
  const entry = bootstrap?.coverage?.find(({ incidentId }) => incidentId === incident.id);
  return bootstrap?.version === 1 &&
    bootstrap.baseCommit === deferred.reviewReady?.baseCommit &&
    bootstrap.candidateCommit === deferred.candidate?.commit &&
    bootstrap.candidateTree === deferred.candidate?.tree &&
    entry?.terminalObligation === true && entry.selectedTaskKey === null &&
    entry.selectedTaskDigest === null && entry.failureDigest === incident.failureDigest &&
    entry.failureTaskKey === incident.failure?.task?.key &&
    entry.failureTaskDigest === verificationTaskDigest(incident.failure.task) &&
    entry.admission?.kind === "bootstrap-terminal-obligation" &&
    entry.admission.failureDigest === incident.failureDigest &&
    entry.admission.sourceCommit === incident.failure?.lineage?.commit &&
    entry.admission.sourcePlanDigest === incident.failure?.planDigest &&
    shaPattern.test(entry.admission.sourceReceiptSha256 ?? "");
}

export function exactBootstrapTerminalObligation(incident) {
  const deferred = incident.terminalVerificationDeferred;
  if (deferred?.status !== "terminal-verification-deferred" ||
      deferred.basis !== "bootstrap-terminal-obligation" ||
      deferred.failureDigest !== incident.failureDigest ||
      !deferred.candidate?.commit || !deferred.candidate?.tree ||
      !exactReviewReadyProof(incident, deferred) ||
      !exactBootstrapSourceProof(incident, deferred) ||
      deferred.package?.path !== "build/package/my-chrome-utilities.zip" ||
      !shaPattern.test(deferred.package?.digest ?? "")) return false;
  const unsigned = { ...deferred }; delete unsigned.digest;
  return deferred.digest === timeoutIncidentDigest(unsigned);
}

function directConfirmedFlaky(incident) {
  return incident.repair === undefined && incident.retry?.status === "classified" &&
    incident.retry.identity === incident.failure?.retryIdentity &&
    incident.retry.outcome === "passed" && incident.retry.classification === "confirmed-flaky";
}

export function terminalClosureDisposition(incident) {
  if (!auditedBlockingClosure(incident)) return undefined;
  if (incident.repair?.status === "eligible") return "eligible-repair";
  if (exactBootstrapTerminalObligation(incident)) return "bootstrap-terminal-obligation";
  if (incident.terminalVerificationDeferred?.basis === "confirmed-flaky") {
    return "deferred-confirmed-flaky";
  }
  if (directConfirmedFlaky(incident)) return "terminal-confirmed-flaky";
  return undefined;
}

export function compatibleTerminalClosureIncident(incident, checkpoint) {
  if (!boundedTerminalClosure(checkpoint) || !terminalClosureDisposition(incident)) return false;
  const candidate = terminalClosureCandidate(incident);
  return candidate?.commit === checkpoint.candidateCommit &&
    candidate?.tree === checkpoint.candidateTree;
}

export function terminalLineageSource(incident) {
  if (incident.repair?.candidate?.commit) return structuredClone(incident.repair.candidate);
  if (["confirmed-flaky", "bootstrap-terminal-obligation"]
    .includes(incident.terminalVerificationDeferred?.basis)) {
    return structuredClone(incident.terminalVerificationDeferred.candidate);
  }
  if (directConfirmedFlaky(incident)) {
    return { commit:incident.failure?.lineage?.commit, tree:incident.failure?.lineage?.tree };
  }
  return undefined;
}

export function terminalClosureCandidate(incident) {
  let candidate = terminalLineageSource(incident);
  if (!candidate) return undefined;
  for (const mapping of incident.lineageTransitions ?? []) {
    if (mapping.kind === "rebase" && mapping.fromCommit === candidate.commit) {
      candidate = { commit:mapping.toCommit, tree:mapping.toTree };
    }
  }
  return candidate;
}

export function terminalClosureResolutionEvidence(incident) {
  const candidate = terminalClosureCandidate(incident);
  return {
    incidentId:incident.id,
    failureDigest:incident.failureDigest,
    basis:terminalClosureDisposition(incident),
    repairCommit:candidate.commit,
    repairTree:candidate.tree,
    checkpointReceiptSha256:incident.resolution.checkpoint.receiptSha256,
    packageReceiptSha256:incident.resolution.package.receiptSha256,
    packageDigest:incident.resolution.package.digest,
    resolutionDigest:incident.resolution.digest,
  };
}
