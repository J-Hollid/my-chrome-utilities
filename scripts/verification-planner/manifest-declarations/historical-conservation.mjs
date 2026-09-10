import {iconFeatures,iconKeys,iconRegistryCommit,recordIconTaskRepair} from '../../../test/utility-tab-expansion/navigation-icons/task-conservation.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {planVerification} from '../tasks/planner.mjs';
import {projectAcceptanceSessionToBaseline,approvedTealiumCheckpointIds} from
  '../../../test/verification-contracts/acceptance-history-projection.mjs';
import {timeoutIncidentDigest as digest} from '../../verification-reliability-values.mjs';

export const acceptedCommit='721c0ca298e6f1d75ff771048682343c9df32489';
export const approvedFeatures=['tealium-detection','tealium-detection-runtime','tealium-live',
  'tealium-live-runtime','tealium-source-navigation','tealium-source-navigation-runtime']
  .map(name=>`features/${name}.feature`).sort();
const approvedUnits=['detection/model','live/model','devtools/model','detection/reader',
  'detection/target','live/filter','live/session','devtools/bridge','devtools/source',
  'live/owner','live/source-actions','live/mapping','devtools/activation'];
const host='browser:test/project-observation-source-host-browser-test.mjs';
export const approvedKeys=[host,...approvedUnits.map(name=>`unit:test/tealium/${name}-test.mjs`),
  ...approvedFeatures.flatMap(file=>['parse','generate'].map(stage=>`acceptance-${stage}:${file}`)),
  ...approvedTealiumCheckpointIds.map(id=>`checkpoint:shell:${id}`)].sort();
export const committedRegistry=commit=>JSON.parse(execFileSync('git',
  ['show',`${commit}:verification/packs.json`],{encoding:'utf8',maxBuffer:8*1024*1024}));
const keys=tasks=>tasks.map(task=>task.key).sort();
const artifacts=feature=>[
  `build/acceptance/generated/${feature.replace(/[^a-z0-9]+/gu,'-')}_acceptance_test.clj`,
  `build/acceptance/ir/${feature.slice('features/'.length,-'.feature'.length)}.json`];

export function assertHistoricalIdentity(actual,old,basePacks) {
  if(old.key!=='acceptance-session:shell')return assert.deepEqual(actual,old,old.key);
  const features=[...old.target.split(','),...approvedFeatures,...iconFeatures].sort();
  assert.equal(new Set(features).size,features.length,'Approved features are new and unique');
  const expectedArgs=[...old.args.slice(0,2),...features.flatMap(artifacts)];
  recordIconTaskRepair('session',actual.args,expectedArgs,[...old.args.slice(0,2),
    ...[...old.target.split(','),...approvedFeatures].sort().flatMap(artifacts)]);
  assert.deepEqual(actual.args,expectedArgs);
  assert.equal(actual.target,features.join(','));
  assert.equal(actual.display,[actual.executable,...actual.args].join(' '));
  const projected=projectAcceptanceSessionToBaseline(actual,basePacks);
  assert.deepEqual({...projected,display:old.display},old,'Historical executable identity is retained');
}

export function assertHistoricalPopulation(actual,old,basePacks) {
  const approved=planVerification(committedRegistry(acceptedCommit),
    {changedPaths:['manifest.json'],includeProperties:true}).tasks;
  const oldKeys=new Set(keys(old));
  const additions=approved.filter(task=>!oldKeys.has(task.key));
  assert.deepEqual(keys(additions),approvedKeys,'Only independently accepted additions are allowed');
  const icons=planVerification(committedRegistry(iconRegistryCommit),
    {changedPaths:['src/utility-host/workspace.ts'],includeProperties:true}).tasks
    .filter(task=>iconKeys.includes(task.key));
  assert.deepEqual(keys(icons),iconKeys,'Only the exact approved icon tasks are added');
  assert.deepEqual(keys(actual),[...keys(old),...approvedKeys,...iconKeys].sort());
  const byKey=new Map(actual.map(task=>[task.key,task]));
  for(const task of old)assertHistoricalIdentity(byKey.get(task.key),task,basePacks);
  for(const task of [...additions,...icons])assert.deepEqual(byKey.get(task.key),task,task.key);
}

export function recordHistoricalRepair(kind,old,actual,check) {
  const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
    ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
  if(context?.causalCategory!=='other:Tealium historical task conservation')return;
  const previous=()=>kind==='fallback'
    ?assert.deepEqual(keys(actual),[...keys(old),host].sort()):assert.deepEqual(actual,old);
  assert.throws(previous,assert.AssertionError,'The original assertion rejects the approved additions');
  check();
  const pre={historicalProjectionAccepted:false},post={historicalProjectionAccepted:true};
  const fixture={id:`tealium-historical-${kind}-v1`,causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{failedCommit:'6013b1602360f8cd03bcef81ab5e32ed57048a77',
      historicalCommit:kind==='fallback'?'3d91abb4f7':'a3034336ad5973d1b57b818a0465eb7c434b78b8',
      acceptedCommit,oldDigest:digest(old),actualDigest:digest(actual)},
    expectedPreRepairFailure:pre,expectedRepairResult:post};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:pre},
    repairResult:{status:'passed',fixtureDigest,observed:post}}}));
}
