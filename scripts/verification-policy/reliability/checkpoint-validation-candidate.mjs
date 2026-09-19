import {execFile} from "node:child_process";
import {promisify} from "node:util";

import {timeoutRepairCandidate} from "../../verification-reliability-repair.mjs";

const execFileAsync=promisify(execFile);

export async function checkpointValidationCandidate({document,incident,root,
  isAncestor=async(ancestor,commit)=>{
    await execFileAsync("git",["merge-base","--is-ancestor",ancestor,commit],{cwd:root});
    return true;
  },treeAtCommit=async commit=>(await execFileAsync("git",["rev-parse",`${commit}^{tree}`],
    {cwd:root,encoding:"utf8"})).stdout.trim()}={}) {
  const repairCandidate=timeoutRepairCandidate(incident);
  const receiptCandidate=document?.receipt?.candidate;
  if(!receiptCandidate?.commit||!receiptCandidate?.tree||
      await treeAtCommit(receiptCandidate.commit)!==receiptCandidate.tree||
      !await isAncestor(repairCandidate.commit,receiptCandidate.commit)) {
    throw new Error("Canonical checkpoint candidate does not descend from the eligible repair");
  }
  return {commit:receiptCandidate.commit,tree:receiptCandidate.tree};
}

export function checkpointValidationPackIds(receipt,allowedPackIds) {
  const requested=receipt?.plan?.requestedPackIds;
  const allowed=new Set(allowedPackIds);
  if(!Array.isArray(requested)||requested.length===0||new Set(requested).size!==requested.length||
      requested.some(id=>!allowed.has(id))) {
    throw new Error("Canonical checkpoint requested packs are not an allowed exact selection");
  }
  return [...requested];
}
