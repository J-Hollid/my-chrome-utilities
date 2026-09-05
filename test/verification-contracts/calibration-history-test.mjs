import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { validateHistoricalCalibration } from "../../scripts/verification-performance/historical-calibration.mjs";

const calibration = JSON.parse(await readFile("verification/performance-calibration.json", "utf8"));
const prior = JSON.parse(execFileSync("git", ["show",
  "3dae61aa25bd66c8547e9e2cabdbf15feff86aba:verification/performance-calibration.json"], {encoding:"utf8"}));
const before = JSON.stringify(calibration);
const result = validateHistoricalCalibration(calibration);
const { sourceEvidence, ...retained } = calibration;
assert.deepEqual(retained, prior, "all historical values and identities are retained");
assert.equal(result.status, "historical-reference");
assert.equal(result.freshMeasurementEvidence, false);
assert.equal(result.unavailableReceiptDigests.length, 6);
assert.equal(result.retiredReceiptDigests.length, 1);
assert.deepEqual(sourceEvidence.unavailable, prior.receiptDigests
  .filter(digest => !prior.retiredReceipts.some(entry => entry.digest === digest))
  .map(digest => ({digest, status:"unavailable"})));
assert.equal(JSON.stringify(calibration), before);
for (const change of [
  x => {x.sourceEvidence.contentDigest = "a".repeat(64);},
  x => {x.sourceEvidence.unavailable.pop();},
  x => {x.sourceEvidence.unavailable[0].completedAt = x.receiptCutoff;},
  x => {x.sourceEvidence.status = "verified";},
  x => {x.runnablePacks[0].changedPathDuration.limit += 1;},
  x => {x.tolerance = Infinity;},
  x => {x.receiptDigests.push(x.receiptDigests[0]);},
  x => {x.retiredReceipts[0].completedAt = "2000-01-01T00:00:00Z";},
]) {
  const changed = structuredClone(calibration); change(changed);
  assert.throws(() => validateHistoricalCalibration(changed), /Historical calibration/u);
}
assert.throws(() => validateHistoricalCalibration(prior), /Historical calibration/u);
console.log(JSON.stringify({calibrationHistory:{retained:true, unavailable:6, retired:1,
  nonmutation:true, rejectsMalformed:true, freshMeasurementEvidence:false}}));
