import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {planVerification} from '../../scripts/verification-packs.mjs';
import {runnablePackIdsFromRegistry} from '../../scripts/verification-pack-cardinality/contract.mjs';
import {verificationDigest as digest} from '../../scripts/verification-evidence.mjs';
import {verifyInstalledRootOwnership} from './installed-root-ownership.mjs';

export function verifyRootOwnershipRegression(packs,context) {
  const source=execFileSync('git',['show','03f3e769de:test/side-panel-single-cutover-preparation-test.mjs'],{encoding:'utf8'});
  const start=source.indexOf('assert.equal(planVerification(packs, {\n  changedPaths:["src/side-panel.ts"]');
  assert.ok(start>=0);
  const end=source.indexOf(';',start)+1;
  const oldCheck=new Function('assert','planVerification','packs','runnablePackIdsFromRegistry',source.slice(start,end));
  assert.throws(()=>oldCheck(assert,planVerification,packs,runnablePackIdsFromRegistry),
    /the installed root remains owned by every current runnable pack/);
  verifyInstalledRootOwnership(packs);
  const before={legacyCountAssertion:'failed'},after={declaredAndDefaultOwnership:'passed'};
  if(!context)return;
  const fixture={id:'reviewed-utility-entry-ownership-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{boundary:'installed-root ownership assertion',base:'03f3e769de',
      selected:planVerification(packs,{changedPaths:['src/side-panel.ts']}).packIds},
    expectedPreRepairFailure:before,expectedRepairResult:after};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:before},
    repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
