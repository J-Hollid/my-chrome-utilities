import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verificationDigest} from '../../scripts/verification-evidence.mjs';

export function recordUtilityAdditionsConservation(approved) {
  if(!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION)return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const causalCategory='other:approved utility browser additions';
  if(context.causalCategory!==causalCategory)return;
  const beforeSource=execFileSync('git',['show','9817be2c:test/verification-contracts/acceptance-history-projection.mjs'],{encoding:'utf8'});
  const before=new Set([...beforeSource.matchAll(/"(browser:[^"]+)"/g)].map(match=>match[1]));
  const additions=approved.filter(key=>key.startsWith('browser:test/tealium/'));
  assert.equal(additions.length,18);
  const historical={key:'browser:historical-retained',target:'historical',version:1};
  const unrelated={key:'browser:unapproved-addition',target:'unapproved',version:1};
  const input=[historical,...additions.map(key=>({key})),unrelated];
  const project=keys=>input.filter(task=>!keys.has(task.key));
  const previous=project(before),current=project(new Set(approved));
  const pre={unexpected:previous.filter(task=>additions.includes(task.key)).length,retained:previous.filter(task=>!additions.includes(task.key))};
  const post={unexpected:current.filter(task=>additions.includes(task.key)).length,retained:current};
  assert.equal(pre.unexpected,18);assert.equal(post.unexpected,0);
  assert.deepEqual(pre.retained,[historical,unrelated]);assert.deepEqual(post.retained,[historical,unrelated]);
  const fixture={id:'tealium-browser-additions-conservation-v1',causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{preRepairCommit:'9817be2c',additions},expectedPreRepairFailure:pre,expectedRepairResult:post};
  const fixtureDigest=verificationDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:pre},
    repairResult:{status:'passed',fixtureDigest,observed:post}}}));
}
