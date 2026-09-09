import assert from 'node:assert/strict';
import {canonicalVerificationChangeSet} from '../history/changes.mjs';
import {planVerification} from '../tasks/planner.mjs';
import {sharedBoundaryPlanFor} from '../../verification-shared-boundaries.mjs';
import {createFixture,manifest,packs} from './fixture.mjs';

const fixture=await createFixture(),{root,base,put,commit,reset}=fixture;
const plan=changeSet=>planVerification(packs,{changedPaths:changeSet.paths,changeSet,basePacks:packs});
try {
  await put('manifest.json',JSON.stringify({...manifest,devtools_page:'tools/devtools.html'}));
  commit('DevTools declaration');
  const changeSet=await canonicalVerificationChangeSet({base,repositoryRoot:root});
  const selected=plan(changeSet);
  assert.deepEqual(selected.packIds,['shell','host']);
  for(const key of ['build:dist','unit:test/shell.mjs','unit:test/host.mjs']) {
    assert.ok(selected.tasks.some(task=>task.key===key),key);
  }
  assert.ok(!selected.tasks.some(task=>task.key==='unit:test/other.mjs'));
  assert.deepEqual(selected.terminalFullObligations,['manifest.json']);
  assert.equal(sharedBoundaryPlanFor(packs,'manifest.json'),null);
  assert.deepEqual(planVerification(packs,{changedPaths:['manifest.json']}).packIds,['shell','host','other']);
  assert.deepEqual(plan(structuredClone(changeSet)).packIds,['shell','host','other']);
  const historical=packs.map(p=>p.id==='shell'?{...p,sharedBoundaries:[]}:p);
  assert.deepEqual(planVerification(packs,{changedPaths:changeSet.paths,changeSet,basePacks:historical}).packIds,
    ['shell','host','other']);
  const all=planVerification(packs,{terminalFull:true});
  assert.deepEqual(all.packIds,['shell','host','other']);
  for(const id of ['shell','host','other'])assert.ok(all.tasks.some(t=>t.key===`unit:test/${id}.mjs`));
  for(const patch of [{permissions:['debugger']},{name:'changed'},{commands:{new:{}}}]) {
    reset();await put('manifest.json',JSON.stringify({...manifest,...patch,devtools_page:'tools/devtools.html'}));
    commit('mixed fields');
    assert.deepEqual(plan(await canonicalVerificationChangeSet({base,repositoryRoot:root})).packIds,
      ['shell','host','other']);
  }
  console.log('Manifest planner selection, fallback, history, and terminal checks passed');
} finally {await fixture.close();}
