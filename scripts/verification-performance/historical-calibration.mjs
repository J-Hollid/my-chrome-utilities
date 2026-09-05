import { createHash } from "node:crypto";

// This authority closes only the snapshot disposed by calibration-receipt-independence R01.
const sourceCommit = "3dae61aa25bd66c8547e9e2cabdbf15feff86aba";
const contentDigest = "5c56538bec50836bb6b6c7c58e77d90bceb858925d570d79cfa083c3f336da10";
const reason = "User reports sources were not retained after workflow cleanup.";
const digestPattern = /^[a-f0-9]{64}$/u;
const fail = () => { throw new Error("Historical calibration has invalid structure or provenance binding"); };

function finiteValues(value) {
  if (typeof value === "number" && (!Number.isFinite(value) || value < 0)) fail();
  if (value && typeof value === "object") Object.values(value).forEach(finiteValues);
}

export function validateHistoricalCalibration(calibration) {
  if (!calibration || typeof calibration !== "object") fail();
  const { sourceEvidence, ...aggregate } = calibration;
  finiteValues(aggregate);
  if (aggregate.version !== 1 || !digestPattern.test(aggregate.environmentClassId ?? "") ||
      !Number.isFinite(Date.parse(aggregate.receiptCutoff)) ||
      !Array.isArray(aggregate.runnablePacks) || !Array.isArray(aggregate.receiptDigests) ||
      aggregate.receiptDigests.some(digest => !digestPattern.test(digest)) ||
      new Set(aggregate.receiptDigests).size !== aggregate.receiptDigests.length ||
      !Array.isArray(aggregate.retiredReceipts)) fail();
  const actualDigest = createHash("sha256").update(JSON.stringify(aggregate)).digest("hex");
  if (actualDigest !== contentDigest) fail();
  const retiredReceiptDigests = aggregate.retiredReceipts.map(({digest}) => digest);
  const unavailableReceiptDigests = aggregate.receiptDigests
    .filter(digest => !retiredReceiptDigests.includes(digest));
  const expected = {version:1, status:"historical-reference", completeness:"incomplete-source-evidence",
    sourceCommit, contentDigest, reason,
    unavailable:unavailableReceiptDigests.map(digest => ({digest,status:"unavailable"}))};
  if (JSON.stringify(sourceEvidence) !== JSON.stringify(expected)) fail();
  return {status:"historical-reference", completeness:"incomplete-source-evidence",
    freshMeasurementEvidence:false, unavailableReceiptDigests, retiredReceiptDigests};
}
