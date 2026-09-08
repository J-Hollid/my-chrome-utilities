import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {timeoutIncidentDigest as digest} from '../../../scripts/verification-reliability-values.mjs';

export function emitObservationCompactRegression({state,generator,authority,document,validate}){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const path='test/fixtures/verification-process-compact-conservation.json';
  const stale=JSON.parse(execFileSync('git',['show',`e0f12073810f4b92e1e740047af4cfdf948a613f:${path}`],{encoding:'utf8',maxBuffer:4*1024*1024}));
  let accepted=true;
  try{validate(stale,state,{generator,authority});}
  catch(error){assert.match(error.message,/Compact conservation record identity mismatch/);accepted=false;}
  assert.equal(accepted,false);
  assert.equal(validate(document,state,{generator,authority}),true);
  assert.equal(stale.normalizedOutputDigest,document.normalizedOutputDigest);
  assert.equal(stale.itemCount,document.itemCount);
  const before={accepted},after={accepted:true,assertionInventoryPreserved:true};
  const fixture={id:'observation-source-compact-record-refresh-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{staleRecordDigest:digest(stale),path},
    expectedPreRepairFailure:{accepted:false},expectedRepairResult:{accepted:true,assertionInventoryPreserved:true}},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,preRepairResult:{status:'failed',fixtureDigest,observed:before},
    repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
