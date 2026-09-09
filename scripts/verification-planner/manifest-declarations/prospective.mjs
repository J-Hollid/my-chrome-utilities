import assert from 'node:assert/strict';
import {planVerification} from '../tasks/planner.mjs';
import {canonicalVerificationChangeSet} from '../history/changes.mjs';
import {createFixture,manifest} from './fixture.mjs';

// Selection fixture for the exact proposed contracts. These tasks are not
// implemented or registered in the product by this preparation.
export function assertProspectiveTealiumSelection(registry,hostKeys) {
  const packs=structuredClone(registry),shell=packs.find(pack=>pack.id==='shell');
  const definitions=[
    {id:'tealium_detection',prefix:'src/tealium/detection/',unit:'test/tealium/detection-test.mjs',
      feature:'tealium-detection',consumers:['tealium_live','tealium_devtools']},
    {id:'tealium_live',prefix:'src/tealium/live/',unit:'test/tealium/live-session-test.mjs',
      feature:'tealium-live',consumers:[]},
    {id:'tealium_devtools',prefix:'src/tealium/devtools/',unit:'test/tealium/devtools/bridge-composition-test.mjs',
      feature:'tealium-source-navigation',consumers:['tealium_live']},
  ];
  const browser='test/tealium-live-browser-test.mjs';
  shell.browserAdapters.push(browser);
  for(const definition of definitions) {
    shell.source.push(definition.prefix);shell.unit.push(definition.unit);
    const features=[`features/${definition.feature}.feature`,`features/${definition.feature}-runtime.feature`];
    shell.features.push(...features);
    shell.plannedFeatures=shell.plannedFeatures.filter(path=>!features.includes(path));
    shell.verificationSlices.push({id:definition.id,sourcePaths:[definition.unit,...features],
      sourcePrefixes:[definition.prefix],tasks:[`unit:${definition.unit}`,`browser:${browser}`,
        ...features.flatMap(path=>['parse','generate'].map(stage=>`acceptance-${stage}:${path}`))],
      prerequisites:[],consumers:definition.consumers.map(sliceId=>({packId:'shell',sliceId})),
      observableBoundary:'Proposed Tealium behavior and its installed runtime checks'});
  }
  shell.verificationSlices.find(slice=>slice.id==='devtools_manifest_registration').consumers.push(
    {packId:'shell',sliceId:'tealium_devtools'});
  const checks={};let allKeys;
  for(const [index,definition] of definitions.entries()) {
    const plan=planVerification(packs,{changedPaths:[`${definition.prefix}fixture.ts`],includeProperties:true});
    assert.deepEqual(plan.packIds,['shell']);
    assert.deepEqual(plan.parentPackSliceFallbacks,[]);
    const expectedDefinitions=index===0?definitions:index===1?[definition]:definitions.slice(1);
    const expected=['build:dist',`browser:${browser}`,...expectedDefinitions.flatMap(item=>[
      `unit:${item.unit}`,...[`features/${item.feature}.feature`,`features/${item.feature}-runtime.feature`]
        .flatMap(path=>['parse','generate'].map(stage=>`acceptance-${stage}:${path}`))])].sort();
    assert.deepEqual(plan.tasks.map(task=>task.key).sort(),expected);
    if(index===0)allKeys=expected;
    assert.ok(!plan.tasks.some(task=>hostKeys.includes(task.key)&&task.key!=='build:dist'));
    checks[definition.id]=expected.length;
  }
  return {packs,checks,allKeys};
}

export async function assertProspectiveActivation(prospective,hostKeys) {
  const fixture=await createFixture({registry:prospective.packs});
  try {
    await fixture.put('manifest.json',JSON.stringify({...manifest,devtools_page:'tools/devtools.html'}));
    for(const part of ['detection','live','devtools'])
      await fixture.put(`src/tealium/${part}/fixture.ts`,'export const selectionFixture = true;');
    fixture.commit('Product changes after independent registration');
    const changeSet=await canonicalVerificationChangeSet({base:fixture.base,repositoryRoot:fixture.root});
    const plan=planVerification(prospective.packs,{changedPaths:changeSet.paths,changeSet,
      basePacks:prospective.packs,includeProperties:true});
    const expected=[...new Set([...hostKeys,...prospective.allKeys,'unit:test/background-command-test.mjs'])].sort();
    assert.deepEqual(plan.tasks.map(task=>task.key).sort(),expected);
    assert.deepEqual(plan.parentPackSliceFallbacks,[]);
    assert.deepEqual(plan.terminalFullObligations,['manifest.json']);
    return expected.length;
  } finally {await fixture.close();}
}
