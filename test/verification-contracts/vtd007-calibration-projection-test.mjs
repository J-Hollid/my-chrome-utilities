import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import path from "node:path";
import {validateHistoricalCalibration} from "../../scripts/verification-performance/historical-calibration.mjs";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";
const helper="acceptance/src/acceptance/verification_support/modular_architecture_vtd007_retirement_conservation.clj";
const calibration=JSON.parse(await readFile("verification/performance-calibration.json","utf8"));
const history=validateHistoricalCalibration(calibration);
assert.equal(history.freshMeasurementEvidence,false);
const falseClaim=structuredClone(calibration);falseClaim.sourceEvidence.status="verified";
assert.throws(()=>validateHistoricalCalibration(falseClaim),/Historical calibration/u);
const temporary=await mkdtemp(path.resolve("tmp/vtd007-calibration-"));
let observed;
try {
  const prior=path.join(temporary,"prior.clj"),base=path.join(temporary,"base.json");
  for(const [target,source] of [[prior,`a32b2c94:${helper}`],
    [base,"0642b1d4c8:verification/performance-calibration.json"]])
    await writeFile(target,execFileSync("git",["show",source],{timeout:10000,maxBuffer:1024*1024}));
  const program=`
(require '[cheshire.core :as json]
         '[acceptance.verification-support.modular-architecture-vtd007-retirement-conservation :as conservation])
(let [base (json/parse-string (slurp (nth *command-line-args* 2)))
      current (json/parse-string (slurp "verification/performance-calibration.json"))]
  (load-file (first *command-line-args*))
  (let [prior (= (conservation/calibration-projection base) (conservation/calibration-projection current))]
    (load-file (second *command-line-args*))
    (let [expected (conservation/calibration-projection base)
          changed-budget (update-in current ["runnablePacks" 0 "changedPathDuration" "limit"] inc)
          changed-receipts (update current "receiptDigests" conj (first (get current "receiptDigests")))]
      (println (json/generate-string
        {:prior prior :conserved (= expected (conservation/calibration-projection current))
         :changedBudgetRejected (not= expected (conservation/calibration-projection changed-budget))
         :changedReceiptsRejected (not= expected (conservation/calibration-projection changed-receipts))})))))`;
  observed=JSON.parse(execFileSync("bb",["-e",program,prior,helper,base],
    {encoding:"utf8",timeout:12000,maxBuffer:1024*1024}));
} finally {await rm(temporary,{recursive:true,force:true});}
const expected={conserved:true,changedBudgetRejected:true,changedReceiptsRejected:true};
assert.deepEqual(observed,{prior:false,...expected});
const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(context?.causalCategory==="other:historical calibration provenance projection"){
  await import("./schema-boundary-count-handler-test.mjs");
  await import("./retained-helper-inventory-handler-test.mjs");
  const fixture={id:"vtd007-calibration-provenance-projection-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    expectedPreRepairFailure:{conserved:false},expectedRepairResult:expected};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  const {prior,...repaired}=observed;
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{conserved:prior}},
    repairResult:{status:"passed",fixtureDigest,observed:repaired}}}));
}
console.log("VTD007 calibration projection regression passed");
