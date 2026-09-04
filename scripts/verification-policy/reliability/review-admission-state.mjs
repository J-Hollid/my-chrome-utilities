import {eligibleRepairStateDigest} from "./eligible-repair-checkpoint-correction.mjs";
import {
  eligibleRepairCandidateMatches,
  validateAncestorRepairCompatibility,
} from "./eligible-repair-lineage-compatibility.mjs";

export function reviewEligibleRepairStateMatches(incident, entry, candidate) {
  if (incident?.repair?.status !== "eligible" ||
      eligibleRepairStateDigest(incident) !== entry?.repairDigest) return false;
  return eligibleRepairCandidateMatches(incident, candidate) ||
    entry.ancestorRepairCompatibility !== undefined &&
    validateAncestorRepairCompatibility(entry.ancestorRepairCompatibility, entry, candidate);
}
