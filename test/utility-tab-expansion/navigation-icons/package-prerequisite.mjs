import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {planVerification} from '../../../scripts/verification-packs.mjs';
import {timeoutIncidentDigest as digest} from '../../../scripts/verification-reliability-values.mjs';

const commit='e78b0f91',path='verification/packs.json';
const previous=JSON.parse(execFileSync('git',['show',`${commit}:${path}`],{encoding:'utf8',maxBuffer:8*1024*1024}));
const current=JSON.parse(readFileSync(path,'utf8'));
const keys=packs=>planVerification(packs,{changedPaths:['src/utility-host/workspace.ts'],includeProperties:true}).tasks.map(t=>t.key);
const oldKeys=keys(previous),newKeys=keys(current),packageKey='checkpoint:shell:portable-package';
assert.ok(oldKeys.includes('browser:test/utility-tab-expansion-browser-test.mjs'));
assert.equal(oldKeys.includes(packageKey),false);
assert.equal(newKeys.includes(packageKey),true);
assert.deepEqual(newKeys.filter(key=>key!==packageKey).sort(),oldKeys.sort(),'Package preparation is additive');
const raw=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION;
if(raw) {
  const context=JSON.parse(raw);
  if(context.causalCategory==='other:icon package prerequisite') {
    const before={browserSelected:true,packagePrepared:false};
    const after={browserSelected:true,packagePrepared:true,oldTasksConserved:true};
    const fixture={id:'icon-package-prerequisite-v1',causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{commit,path,sourceDigest:digest(previous)},
      expectedPreRepairFailure:before,expectedRepairResult:after};
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:'failed',fixtureDigest:digest(fixture),observed:before},
      repairResult:{status:'passed',fixtureDigest:digest(fixture),observed:after}}}));
  }
}
