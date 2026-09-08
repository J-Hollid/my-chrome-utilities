import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {planVerification} from '../../scripts/verification-packs.mjs';
import {verificationDigest as digest} from '../../scripts/verification-evidence.mjs';

export function verifyEntryConsumerReachability(packs,context) {
  const selection=registry=>planVerification(registry,{changedPaths:['src/side-panel.ts']});
  const plan=selection(packs);
  assert.ok(plan.packIds.includes('verification_process'));
  assert.ok(plan.tasks.some(({key})=>key==='unit:test/verification-contracts/ownership-event-library-contract-test.mjs'));
  if(context?.causalCategory!=='other:Utility entry verification consumer')return;
  const source=readFileSync('test/verification-contracts/ownership-event-library-contract-test.mjs','utf8');
  assert.ok(source.includes('readFile(new URL("../../src/side-panel.ts", import.meta.url)'));
  const old=JSON.parse(execFileSync('git',['show','2f7f59ac:verification/packs.json'],{encoding:'utf8'}));
  const before={consumerReachable:selection(old).packIds.includes('verification_process')};
  const after={consumerReachable:plan.packIds.includes('verification_process')};
  assert.deepEqual(before,{consumerReachable:false});assert.deepEqual(after,{consumerReachable:true});
  const fixture={id:'utility-entry-verification-consumer-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{boundary:'verification consumer source read',importer:'test/verification-contracts/ownership-event-library-contract-test.mjs',source:'src/side-panel.ts'},
    expectedPreRepairFailure:before,expectedRepairResult:after};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:before},
    repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
