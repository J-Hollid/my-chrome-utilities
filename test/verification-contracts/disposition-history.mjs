import {validateGranularityDispositions} from "../../scripts/verification-granularity-dispositions.mjs";

export function preservesDispositionHistory(current,baseline) {
  const accepted = validateGranularityDispositions(baseline).dispositions;
  const actual = validateGranularityDispositions(current).dispositions;
  return accepted.every(entry => actual.some(candidate =>
    candidate.task === entry.task && candidate.path === entry.path &&
    JSON.stringify(candidate) === JSON.stringify(entry)));
}
