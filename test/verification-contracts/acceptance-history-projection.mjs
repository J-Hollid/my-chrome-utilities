import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {verificationDigest} from '../../scripts/verification-evidence.mjs';

export function recordUtilityAdditionsConservation(approved) {
  if(!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION)return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const causalCategory='other:approved utility browser additions';
  if(context.causalCategory==='other:repair proof registry boundary') {
    const source='verification/manifests/verification_process.json';
    const slice=text=>JSON.parse(text).pack.verificationSlices.find(item=>item.id==='registry_inventory');
    const baseline=slice(execFileSync('git',['show','e79136b3:'+source],{encoding:'utf8'}));
    const before=slice(execFileSync('git',['show','be2acfa7:'+source],{encoding:'utf8'}));
    const after=slice(readFileSync(source,'utf8'));
    const inspect=value=>({matchesBaseline:verificationDigest(value)===verificationDigest(baseline),
      extraPaths:value.sourcePaths.filter(path=>!baseline.sourcePaths.includes(path)),
      taskIdentitiesRetained:verificationDigest(value.tasks)===verificationDigest(baseline.tasks)});
    const pre=inspect(before),post=inspect(after);
    assert.equal(pre.matchesBaseline,false);assert.deepEqual(pre.extraPaths,['test/verification-contracts/utility-additions-conservation.mjs']);
    assert.equal(pre.taskIdentitiesRetained,true);assert.deepEqual(after,baseline);
    const fixture={id:'tealium-proof-registry-boundary-v1',causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{baseline:'e79136b3',preRepair:'be2acfa7',slice:'registry_inventory'},
      expectedPreRepairFailure:pre,expectedRepairResult:post};
    emitConservationRecord(context,fixture,pre,post);return;
  }
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
  emitConservationRecord(context,fixture,pre,post);
}

function emitConservationRecord(context,fixture,pre,post) {
  const fixtureDigest=verificationDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:pre},
    repairResult:{status:'passed',fixtureDigest,observed:post}}}));
}

// Compare the retained historical session separately from later registered features.
export const approvedUtilityBrowserTaskKeys = [
  "browser:test/utility-tab-expansion-browser-test.mjs",
  "browser:test/utility-tab-expansion-standalone-browser-test.mjs",
  "browser:test/tealium/detection/cost-test.mjs",
  "browser:test/tealium/detection/browser-test.mjs",
  "browser:test/tealium/detection/frame-access-test.mjs",
  "browser:test/tealium/detection/real-runtime-test.mjs",
  "browser:test/tealium/detection/states-browser-test.mjs",
  "browser:test/tealium/live/access-recovery-test.mjs",
  "browser:test/tealium/live/browser-test.mjs",
  "browser:test/tealium/live/closure-test.mjs",
  "browser:test/tealium/live/data-layer-continuity-test.mjs",
  "browser:test/tealium/live/frame-lifecycle-test.mjs",
  "browser:test/tealium/live/geometry-test.mjs",
  "browser:test/tealium/live/lifecycle-test.mjs",
  "browser:test/tealium/live/startup-test.mjs",
  "browser:test/tealium/devtools/browser-test.mjs",
  "browser:test/tealium/devtools/clipboard-test.mjs",
  "browser:test/tealium/devtools/lifecycle-test.mjs",
  "browser:test/tealium/devtools/limits-test.mjs",
  "browser:test/tealium/devtools/protocol-test.mjs",
];
recordUtilityAdditionsConservation(approvedUtilityBrowserTaskKeys);

// These same approved commands run after the package checkpoint in Stage A.
export const approvedTealiumCheckpointIds=approvedUtilityBrowserTaskKeys
  .filter(key=>key.startsWith('browser:test/tealium/'))
  .map(key=>'tealium-'+key.split('/')[2]+'-'+key.split('/')[3].replace('-test.mjs',''));

export function projectAcceptanceSessionToBaseline(identity, basePacks) {
  if (identity.stage !== "acceptance-session") return identity;
  const baseline = new Set(basePacks.find(({id}) => id === identity.packId)?.features ?? []);
  const current = identity.target.split(",");
  const excluded = current.filter((feature) => !baseline.has(feature));
  const artifacts = new Set(excluded.flatMap((feature) => {
    const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
    return [`build/acceptance/generated/${slug}_acceptance_test.clj`,
      `build/acceptance/ir/${feature.slice("features/".length, -".feature".length)}.json`];
  }));
  return {...identity, target:current.filter((feature) => baseline.has(feature)).join(","),
    args:identity.args.filter((argument) => !artifacts.has(argument))};
}
