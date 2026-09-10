import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {verificationDigest} from '../../../../scripts/verification-evidence.mjs';
export function checkMappingConservation(repairedStatus) {
  const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION ? JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) : null;
  if(context?.causalCategory!=='other:Tealium metadata mapping conservation')return;
  const original=execFileSync('git',['show','5a09e5fe22338916d7a560cb872dc9aedd41366e:test/tealium/live/mapping_test.clj'],{encoding:'utf8'});
  const before=spawnSync('bb',['-e',`(require '[clojure.test :as test]) (load-string ${JSON.stringify(original)}) (let [r (test/run-tests 'tealium.live.mapping-test)] (System/exit (+ (:fail r) (:error r))))`],{encoding:'utf8'});
  assert.notEqual(before.status,0);
  assert.match(before.stdout,/FAIL in \(current-row-evidence\)/);
  assert.match(before.stdout,/ERROR in \(runtime-evidence-validation\)/);
  assert.equal(repairedStatus,0);
  const fixture={id:'tealium-metadata-mapping-conservation-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{originalCommit:'5a09e5fe22338916d7a560cb872dc9aedd41366e',originalTestDigest:verificationDigest(original),
      originalRows:6,metadataRows:4,boundary:'acceptance.steps.tealium-live/rows! and assert-runtime!'},
    expectedPreRepairFailure:{mappingPassed:false},expectedRepairResult:{mappingPassed:true}};
  const fixtureDigest=verificationDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:{mappingPassed:false}},
    repairResult:{status:'passed',fixtureDigest,observed:{mappingPassed:repairedStatus===0}}}}));
}
