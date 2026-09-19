import {execFile} from "node:child_process";
import {promisify} from "node:util";

import {terminalCheckpointCandidate} from "../../verification-reliability-repair.mjs";
import {timeoutIncidentDigest} from "../../verification-reliability-values.mjs";
import {canonicalBaselineDiagnostic} from "./baseline-diagnostic-authentication.mjs";

const execFileAsync=promisify(execFile);

export async function checkpointValidationCandidate({document,incident,root,
  isAncestor=async(ancestor,commit)=>{
    await execFileAsync("git",["merge-base","--is-ancestor",ancestor,commit],{cwd:root});
    return true;
  },treeAtCommit=async commit=>(await execFileAsync("git",["rev-parse",`${commit}^{tree}`],
    {cwd:root,encoding:"utf8"})).stdout.trim(),deriveBaselineInputs}={}) {
  const repairCandidate=terminalCheckpointCandidate(incident);
  const receiptCandidate=document?.receipt?.candidate;
  if(!repairCandidate?.commit||!receiptCandidate?.commit||!receiptCandidate?.tree||
      await treeAtCommit(receiptCandidate.commit)!==receiptCandidate.tree||
      !await isAncestor(repairCandidate.commit,receiptCandidate.commit)) {
    throw new Error("Canonical checkpoint candidate does not descend from the eligible repair");
  }
  await validateDeterministicBaselineCheckpointInputs({incident,
    candidateCommit:receiptCandidate.commit,root,derive:deriveBaselineInputs});
  return {commit:receiptCandidate.commit,tree:receiptCandidate.tree};
}

export function checkpointValidationPackIds(receipt,allowedPackIds) {
  const requested=receipt?.plan?.requestedPackIds;
  if(!Array.isArray(requested)||new Set(requested).size!==requested.length||
      JSON.stringify([...requested].sort())!==JSON.stringify([...allowedPackIds].sort())) {
    throw new Error("Canonical checkpoint requested packs are not the exact all-runnable selection");
  }
  return [...requested];
}

export async function validateDeterministicBaselineCheckpointInputs({incident,candidateCommit,root,
  derive=canonicalBaselineDiagnostic}={}) {
  if(incident?.terminalVerificationDeferred?.basis!=="deterministic-baseline")return true;
  const bound=incident.deterministicBaselineProof?.candidateReceipt;
  if(!bound?.checkKey||!bound?.toolchainDigest||!bound?.relevantInputs) {
    throw new Error("Deterministic baseline checkpoint has no authenticated input closure");
  }
  const current=await derive(root,{commit:candidateCommit,checkKey:bound.checkKey,
    toolchainDigest:bound.toolchainDigest});
  if(timeoutIncidentDigest(current.relevantInputs)!==timeoutIncidentDigest(bound.relevantInputs)) {
    throw new Error("Deterministic baseline authenticated input closure changed");
  }
  return true;
}
