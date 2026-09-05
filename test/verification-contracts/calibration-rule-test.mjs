import assert from "node:assert/strict";
import {calibrationRuleFixture} from "./calibration-rule-fixture.mjs";
import {validateVerificationPerformanceCalibrationSnapshot as validate} from
  "../../scripts/report-verification-throughput.mjs";

const {calibration,ledger,refreshed,conditions} = calibrationRuleFixture();
const before = JSON.stringify({calibration,ledger});
const snapshot = validate(calibration,ledger);
assert.deepEqual(snapshot.receiptDigests,calibration.receiptDigests);
assert.equal(snapshot.postCutoffReceiptDigests.length,1);
const errors = {omitted:/omits eligible/,duplicate:/duplicate/,missing:/missing/,
  rejected:/rejected/,crossClass:/cross-class/,postCutoff:/after its cutoff/,
  retirementMismatch:/does not match raw evidence/};
for (const [condition,pattern] of Object.entries(errors))
  assert.throws(() => validate(conditions[condition],ledger),pattern,condition);
assert.equal(validate(refreshed,ledger).receiptDigests.length,8);
const sample = ledger.receipts[0];
const compact = {...calibration,retiredReceipts:[{digest:sample.digest,
  environmentClassId:sample.environmentClassId,completedAt:sample.receipt.completedAt}]};
assert.deepEqual(validate(compact,ledger).receiptDigests,snapshot.receiptDigests);
assert.deepEqual(validate(compact,{...ledger,receipts:ledger.receipts.slice(1)}).receiptDigests,
  snapshot.receiptDigests,"validated compact identity can replace raw input");
assert.throws(() => validate(calibration,{receipts:[]}),/missing/);
assert.equal(JSON.stringify({calibration,ledger}),before);
console.log(JSON.stringify({calibrationRules:{valid:true,rejected:Object.keys(errors),
  cutoff:true,retirementMatch:true,nonmutation:true,authoredInputs:true}}));
