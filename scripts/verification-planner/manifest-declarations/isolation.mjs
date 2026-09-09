import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {canonicalVerificationChangeSet} from '../history/changes.mjs';
import {planVerification} from '../tasks/planner.mjs';
import {createFixture,manifest} from './fixture.mjs';
import {assertProspectiveTealiumSelection,assertProspectiveActivation} from './prospective.mjs';
import {isRunnablePack} from '../../verification-pack-cardinality/contract.mjs';

const hostUnits=[
  'data-layer-installed/consumers/project-management-consumer',
  'data-layer-installed/consumers/durable-project-repository-consumer',
  'command-palette-installed-controller','command-registry-runtime','hotkey-installed-controller',
  'data-layer-installed/consumers/capture-consumer','data-layer-installed/consumers/event-library-consumer',
  'data-layer-installed/consumers/project-event-transport-consumer','data-layer-installed/consumers/schemas-consumer',
  'data-layer-installed/consumers/defects-consumer','data-layer-installed/consumers/replay-consumer',
  'data-layer-installed/consumers/live-flow-testing-consumer','side-panel-single-cutover-preparation',
  'modular-utility-architecture','workspace-tabs-installed-controller','utility-tab-expansion/protocol',
  'utility-tab-expansion/planning','utility-tab-expansion/host-message',
  'verification-contracts/registry-reachability-contract','verification-contracts/ownership-event-library-contract',
];
const hostKeys=['build:dist',...hostUnits.map(name=>`unit:test/${name}-test.mjs`),
  'property:test/workspace-tabs-property-test.mjs',
  ...['project-observation-sources','utility-tab-expansion','utility-tab-expansion-standalone']
    .map(name=>`browser:test/${name}-browser-test.mjs`),
  'browser-observation:LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER+SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER+WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER',
  ...['side-panel-workspace-tabs','utility-tab-expansion-boundary','utility-tab-expansion-runtime']
    .flatMap(name=>['parse','generate'].map(stage=>`acceptance-${stage}:features/${name}.feature`))].sort();
const keys=plan=>plan.tasks.map(task=>task.key).sort();

export async function assertUtilityIsolation() {
  const packs=JSON.parse(await readFile('verification/packs.json','utf8'));
  const plan=options=>planVerification(packs,{includeProperties:true,...options});
  for(const path of ['src/utility-contributions/index.ts','src/utility-host/page-client.ts'])
    assert.deepEqual(keys(plan({changedPaths:[path]})),hostKeys,path);
  const background=plan({changedPaths:['src/background.ts']});
  const bridgeKeys=[...hostKeys,'unit:test/background-command-test.mjs'].sort();
  assert.deepEqual(keys(background),bridgeKeys,'background retains exact host checks and its direct callback test');
  assert.deepEqual(background.parentPackSliceFallbacks,[]);
  const fixture=await createFixture({registry:packs});
  try {
    await fixture.put('manifest.json',JSON.stringify({...manifest,devtools_page:'tools/devtools.html'}));
    fixture.commit('Independent manifest activation');
    const changeSet=await canonicalVerificationChangeSet({base:fixture.base,repositoryRoot:fixture.root});
    const activation=plan({changedPaths:changeSet.paths,changeSet,basePacks:packs});
    assert.deepEqual(keys(activation),bridgeKeys,'canonical field activation uses exact host observations');
    assert.deepEqual(activation.parentPackSliceFallbacks,[]);
    assert.deepEqual(activation.terminalFullObligations,['manifest.json']);
    const before=JSON.parse(execFileSync('git',['show','3d91abb4f7:verification/packs.json'],
      {encoding:'utf8',maxBuffer:8*1024*1024}));
    const full=keys(planVerification(before,{changedPaths:['manifest.json'],includeProperties:true}));
    assert.deepEqual(keys(plan({changedPaths:['manifest.json']})),full,'path-only permissions remain conservative');
    assert.deepEqual(keys(plan({changedPaths:changeSet.paths,changeSet:structuredClone(changeSet),basePacks:packs})),full);
    fixture.reset();
    await fixture.put('manifest.json',JSON.stringify({...manifest,permissions:['debugger']}));
    fixture.commit('Permission change');
    const permission=await canonicalVerificationChangeSet({base:fixture.base,repositoryRoot:fixture.root});
    assert.deepEqual(keys(plan({changedPaths:permission.paths,changeSet:permission,basePacks:packs})),full);
    fixture.reset();
    await fixture.put('manifest.json',JSON.stringify({...manifest,devtools_page:'tools/devtools.html'}));
    await fixture.put('verification/packs.json',JSON.stringify(before));
    fixture.commit('Policy and activation cannot narrow their own range');
    const mixed=await canonicalVerificationChangeSet({base:fixture.base,repositoryRoot:fixture.root});
    assert.deepEqual([...plan({changedPaths:mixed.paths,changeSet:mixed,basePacks:packs}).packIds].sort(),
      before.filter(isRunnablePack).map(pack=>pack.id).sort());
    const prospective=assertProspectiveTealiumSelection(packs,hostKeys);
    const proposedActivation=await assertProspectiveActivation(prospective,hostKeys);
    console.log(JSON.stringify({utilityIsolation:{host:hostKeys.length,background:bridgeKeys.length,
      manifest:bridgeKeys.length,parentFallbacks:0,permissionFallback:'all original task identities',
      prospectiveOnly:{...prospective.checks,combinedActivation:proposedActivation}}}));
  } finally {await fixture.close();}
}
