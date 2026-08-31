import assert from "node:assert/strict";
import path from "node:path";

import { loadCalibrationReceiptConsumer } from
  "../../scripts/verification-calibration-receipt-consumer.mjs";

const digest = "a".repeat(64);
const calibration = { environmentClassId:"environment-a", receiptDigests:[digest],
  retiredReceipts:[], sourceScope:[], minimumIndependentSamples:1,
  environment:{ node:"24", typescript:"5", platform:"linux" } };
const reads = [];
let ledgerLoads = 0, validations = 0;
const consumerFor = await loadCalibrationReceiptConsumer({ repositoryRoot:"/project" }, {
  read:async(target) => {
    reads.push(path.basename(target));
    return JSON.stringify(target.endsWith("performance-calibration.json")
      ? calibration : { legacyExecutionLoads:{} });
  },
  buildTimingLedger:async() => { ledgerLoads += 1; return {}; },
  validateSnapshot:() => { validations += 1; return { retiredReceiptDigests:[] }; },
});
assert.deepEqual(reads, ["performance-calibration.json", "timing-receipt-index.json"]);
assert.equal(ledgerLoads, 1);
assert.equal(validations, 1);
assert.equal(consumerFor({ contentIdentity:`sha256:${digest}` }).id, "environment-a");
assert.equal(consumerFor({ contentIdentity:`sha256:${"b".repeat(64)}` }), null);
assert.equal(ledgerLoads, 1, "receipt lookup reuses the run calibration context");
assert.equal(validations, 1, "receipt lookup does not repeat calibration validation");

let absentCalibrationReads = 0;
const noCalibrationConsumer = await loadCalibrationReceiptConsumer({ repositoryRoot:"/project" }, {
  read:async() => {
    absentCalibrationReads += 1;
    const error = new Error("missing"); error.code = "ENOENT"; throw error;
  },
});
assert.equal(noCalibrationConsumer({ contentIdentity:`sha256:${digest}` }), null);
assert.equal(absentCalibrationReads, 1,
  "an absent calibration does not require a timing receipt index");

let missingIndexReads = 0;
await assert.rejects(loadCalibrationReceiptConsumer({ repositoryRoot:"/project" }, {
  read:async(target) => {
    missingIndexReads += 1;
    if (target.endsWith("performance-calibration.json")) return JSON.stringify(calibration);
    const error = new Error("missing"); error.code = "ENOENT"; throw error;
  },
}), /requires the timing receipt index/u,
"an active calibration fails closed when its timing index is absent");
assert.equal(missingIndexReads, 2);
