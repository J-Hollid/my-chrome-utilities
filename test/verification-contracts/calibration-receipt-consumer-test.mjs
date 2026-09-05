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

const {readFile} = await import("node:fs/promises");
const historical = JSON.parse(await readFile("verification/performance-calibration.json", "utf8"));
let historicalReads = 0;
const historicalConsumer = await loadCalibrationReceiptConsumer({repositoryRoot:"/project"}, {
  read:async target => {
    historicalReads += 1;
    assert.equal(path.basename(target), "performance-calibration.json");
    return JSON.stringify(historical);
  },
  buildTimingLedger:async () => assert.fail("closed history must not load the old ledger"),
  validateSnapshot:() => assert.fail("history is not freshly verified raw evidence"),
});
for (const sample of historical.receiptDigests)
  assert.equal(historicalConsumer({contentIdentity:`sha256:${sample}`}), null);
assert.equal(historicalReads, 1);
const malformed = structuredClone(historical);
malformed.sourceEvidence.contentDigest = digest;
await assert.rejects(loadCalibrationReceiptConsumer({repositoryRoot:"/project"}, {
  read:async () => JSON.stringify(malformed),
  buildTimingLedger:async () => assert.fail("bad history must fail before ledger access"),
}), /Historical calibration/u);
console.log(JSON.stringify({calibrationConsumer:{historicalClosed:true, ledgerReads:0,
  activeRetained:true, missingActiveIndexRejected:true, malformedRejected:true}}));

const {receiptRetentionDecision} = await import(
  "../../scripts/verification-reliability-evidence-retention.mjs");
const receiptIdentity = {candidateCommit:"a".repeat(40),baseCommit:"b".repeat(40),
  tree:"c".repeat(40),task:"fixture",planDigest:digest,runIntent:"review-evidence"};
for (const obligation of [{currentConsumer:{kind:"pending-review",id:"review"}},
  {activeObligation:{incidentId:"incident",status:"unresolved"}}]) {
  assert.equal(historicalConsumer({contentIdentity:`sha256:${historical.receiptDigests[0]}`}),null);
  assert.equal(receiptRetentionDecision({receiptIdentity,identityMatches:true,
    integrationComplete:true,...obligation}).action,"retain");
}
console.log(JSON.stringify({calibrationOtherConsumers:{pendingReview:true,activeIncident:true}}));
