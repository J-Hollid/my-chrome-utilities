import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {planVerification} from '../../scripts/verification-packs.mjs';
import {verificationDigest as digest} from '../../scripts/verification-evidence.mjs';

export function verifyNavigationOwnership(packs,context) {
  const selection=(registry,path)=>planVerification(registry,{changedPaths:[path]}).packIds;
  assert.deepEqual(selection(packs,'src/workspace-tabs-ui.ts'),['shell']);
  assert.deepEqual(selection(packs,'src/workspace-tabs.ts'),['command-palette','hotkeys','shell']);
  if(context?.causalCategory!=='other:Utility navigation consumer separation')return;
  const old=JSON.parse(execFileSync('git',['show','14efc109:verification/packs.json'],{encoding:'utf8'}));
  const before={presentationOwners:selection(old,'src/workspace-tabs-ui.ts')};
  const after={presentationOwners:selection(packs,'src/workspace-tabs-ui.ts')};
  assert.ok(before.presentationOwners.includes('capture'));
  assert.throws(()=>assert.deepEqual(before.presentationOwners,['shell']));
  assert.deepEqual(after,{presentationOwners:['shell']});
  const fixture={id:'utility-navigation-consumer-separation-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{boundary:'workspace presentation ownership',path:'src/workspace-tabs-ui.ts',base:'14efc109'},
    expectedPreRepairFailure:before,expectedRepairResult:after};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:before},
    repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
