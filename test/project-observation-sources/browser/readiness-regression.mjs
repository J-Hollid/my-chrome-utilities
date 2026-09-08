import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export function emitSourceStartupReadinessRegression(ready,context) {
  const observations=[false,true].map(shellReady=>({readyState:'complete',
    activeProjectText:'Retail website',projectCount:3,shellReady}));
  const legacy=row=>row.readyState==='complete'&&row.activeProjectText.includes('Retail website')&&row.projectCount===3;
  const before={observationIndex:observations.findIndex(legacy),shellReady:false};
  const index=observations.findIndex(row=>ready(row));
  const after={observationIndex:index,shellReady:observations[index].shellReady};
  const expectedPreRepairFailure={observationIndex:0,shellReady:false};
  const expectedRepairResult={observationIndex:1,shellReady:true};
  assert.deepEqual(before,expectedPreRepairFailure);assert.deepEqual(after,expectedRepairResult);
  const normalized=value=>Array.isArray(value)?value.map(normalized):value&&typeof value==='object'
    ?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,normalized(item)])):value;
  const digest=value=>createHash('sha256').update(JSON.stringify(normalized(value))).digest('hex');
  const fixture={id:'observation-source-startup-ready-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{observations},
    expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:before},repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
