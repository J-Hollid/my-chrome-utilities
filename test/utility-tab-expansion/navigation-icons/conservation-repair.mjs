import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {timeoutIncidentDigest as digest} from '../../../scripts/verification-reliability-values.mjs';
import {validateCompactConservation} from '../../../scripts/verification-registry/compact-conservation.mjs';
import {validateCompactSemanticProjection} from '../../../scripts/verification-registry/compact-conservation-projection.mjs';

export function emitIconConservationRepair({kind,state,generator,authority,document}) {
  const raw=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION;
  if(!raw)return false;
  const context=JSON.parse(raw);
  if(context.causalCategory!=='other:icon compact record correction')return false;
  const failedCommit='c46ee7b1e86f5bccc6b4c85472779119268c6ace';
  const path='test/fixtures/verification-process-compact-conservation.json';
  const original=JSON.parse(execFileSync('git',['show',`${failedCommit}:${path}`],{encoding:'utf8'}));
  let before;
  try {
    if(kind==='projection')validateCompactSemanticProjection(
      {...document,semanticProjection:original.semanticProjection},original);
    else {
      // Isolate the failed source records from the separately repaired projection
      // and the generator identity that follows the authority binding.
      const stale={...document,records:document.records.map(record=>{
        if(!record.boundaryIdentity.owner.endsWith('blocked-aggregate-contract-test.mjs'))return record;
        const old=original.records.find(entry=>entry.boundaryIdentity.owner===record.boundaryIdentity.owner);
        return {...record,source:old.source,inputDigests:old.inputDigests};
      })};
      validateCompactConservation(stale,state,{generator,authority});
    }
    before={accepted:true};
  } catch(error) {
    assert.match(error.message,kind==='projection'
      ?/Compact semantic projection output mismatch/u
      :/Compact conservation record identity mismatch/u);
    before={accepted:false,error:error.message};
  }
  assert.equal(before.accepted,false);
  validateCompactConservation(document,state,{generator,authority});
  const after={accepted:true};
  const fixture={id:`icon-compact-${kind}-correction-v1`,causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{failedCommit,path,originalDigest:digest(original),kind},
    expectedPreRepairFailure:before,expectedRepairResult:after};
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest:digest(fixture),observed:before},
    repairResult:{status:'passed',fixtureDigest:digest(fixture),observed:after}}}));
  return true;
}
