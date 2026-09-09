import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {timeoutIncidentDigest} from '../../verification-reliability-values.mjs';

const addedKeys=['delta-test','repository-test','planner-test','registration-test'].map(name=>
  `unit:scripts/verification-planner/manifest-declarations/${name}.mjs`);

export function conservedLegacyTaskKeys(tasks) {
  const keys=tasks.map(({key})=>key);
  for(const key of addedKeys)assert.equal(keys.filter(value=>value===key).length,1,key);
  const legacy=keys.filter(key=>!addedKeys.includes(key));
  assert.equal(keys.length,legacy.length+addedKeys.length);
  const raw=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION;
  const context=raw?JSON.parse(raw):null;
  if(context?.causalCategory==='other:manifest declaration task registration') {
    assert.throws(()=>assert.equal(keys.length,19),{code:'ERR_ASSERTION'});
    const retained=legacy.filter(key=>!['unit:test/feature-parent-consumer-coverage-test.mjs',
      'unit:scripts/verification-planner/tasks/historical-parent-requirements-test.mjs'].includes(key));
    const retainedDigest=createHash('sha256').update(JSON.stringify(retained)).digest('hex');
    assert.equal(retainedDigest,'8f16e008e6c1cf8be61b1a1907095e26c9f40ab79689ad2fb14b46108b938ee4');
    const observed={legacyCount:legacy.length,addedKeys,retainedDigest};
    assert.equal(observed.legacyCount,19);
    const fixture={id:'manifest-task-registration-conservation-v1',causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
      input:{legacyCount:19,addedKeys},expectedPreRepairFailure:{accepted:false},expectedRepairResult:observed};
    const fixtureDigest=timeoutIncidentDigest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:'failed',fixtureDigest,observed:{accepted:false}},
      repairResult:{status:'passed',fixtureDigest,observed}}}));
  }
  return legacy;
}
