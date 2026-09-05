import assert from "node:assert/strict";
import {calibrationRuleFixture} from "./calibration-rule-fixture.mjs";
import {validateVerificationPerformanceCalibrationSnapshot as validate} from
  "../../scripts/report-verification-throughput.mjs";
import {validateHistoricalCalibration} from
  "../../scripts/verification-performance/historical-calibration.mjs";

export function calibrationRuleEvidence(committedCalibrationReport) {
  const committedCalibrationBeforeValidation = JSON.stringify(committedCalibrationReport);
  const historical = validateHistoricalCalibration(committedCalibrationReport);
  const {calibration,ledger:liveCalibrationLedger,refreshed:refreshedSnapshot,conditions} =
    calibrationRuleFixture();
  const committedSnapshot = validate(calibration,liveCalibrationLedger);
  const snapshotDefectsRejected = {};
  for (const [name,input] of Object.entries(conditions)) {
    if (name === "valid") continue;
    assert.throws(() => validate(input,liveCalibrationLedger),/Calibration snapshot/u,name);
    snapshotDefectsRejected[name === "omitted" ? "omittedPreCutoff" : name] = true;
  }
  const liveSelectedDigests = validate(refreshedSnapshot,liveCalibrationLedger).receiptDigests;
  assert.equal(JSON.stringify(committedCalibrationReport),committedCalibrationBeforeValidation);
  return {committedCalibrationBeforeValidation, committedSnapshot, liveCalibrationLedger,
    liveSelectedDigests,refreshedSnapshot,snapshotDefectsRejected,historical,
    fixtureCutoff:calibration.receiptCutoff};
}

export function retainedHistoricalCalibrationValues(calibration) {
  validateHistoricalCalibration(calibration);
  const {sourceEvidence, ...values} = structuredClone(calibration);
  return values;
}

export {retiredCalibrationRuleFixture,authoredCalibrationTimingInputs} from "./calibration-rule-fixture.mjs";
