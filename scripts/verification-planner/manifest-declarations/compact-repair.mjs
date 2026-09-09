import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {timeoutIncidentDigest as digest} from '../../verification-reliability-values.mjs';

export function emitManifestCompactRepair({state,generator,authority,document,validate}) {
  const raw=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION;
  const context=raw?JSON.parse(raw):null;
  if(context?.causalCategory!=='other:manifest background conservation record')return;
  const path='test/fixtures/verification-process-compact-conservation.json';
  const sourceCommit='861de2e016';
  const stale=JSON.parse(execFileSync('git',['show',`${sourceCommit}:${path}`],
    {encoding:'utf8',timeout:5000,maxBuffer:4*1024*1024}));
  assert.throws(()=>validate(stale,state,{generator,authority}),
    /record identity mismatch test\/verification-contracts\/ownership-shell-contract-test/);
  assert.equal(validate(document,state,{generator,authority}),true);
  assert.equal(stale.normalizedOutputDigest,document.normalizedOutputDigest);
  assert.equal(stale.itemCount,document.itemCount);
  const observed={accepted:true,assertionInventoryPreserved:true};
  const fixture={id:'manifest-background-conservation-record-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{sourceCommit,path,staleDigest:digest(stale)},
    expectedPreRepairFailure:{accepted:false},expectedRepairResult:observed};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:{accepted:false}},
    repairResult:{status:'passed',fixtureDigest,observed}}}));
}
