import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {loadVerificationPacks,planVerification} from '../../scripts/verification-packs.mjs';
import {retainedSliceTasks} from '../../scripts/verification-planner/tasks/retained-slice-tasks.mjs';

export async function assertSourceConsumerSelection() {
  const packs=await loadVerificationPacks();
  const keys=plan=>plan.tasks.map(task=>task.key).sort();
  const plan=changedPaths=>planVerification(packs,{changedPaths,includeProperties:true});
  const host=plan(['src/utility-contributions/index.ts']);
  const source='browser:test/project-observation-sources-browser-test.mjs';
  const architecture='unit:test/modular-utility-architecture-test.mjs';
  assert.ok(!keys(host).includes(source),'Additive registration must not run all source groups');
  assert.ok(!keys(host).includes(architecture),'Additive registration must not run registry/Schema architecture checks');
  assert.ok(keys(host).includes('browser:test/project-observation-source-host-browser-test.mjs'));
  assert.ok(keys(host).includes('unit:test/utility-tab-expansion/host-message-test.mjs'));
  assert.deepEqual(host.parentPackSliceFallbacks,[]);
  assert.ok(keys(plan(['src/data-layer-project-event-transport.ts'])).includes(source));
  assert.ok(keys(planVerification(packs,{packIds:['project_event_transport']})).includes(source));
  assert.ok(keys(planVerification(packs,{packIds:['shell']})).includes(architecture));
  const base=JSON.parse(execFileSync('git',['show','d5c876f400:verification/packs.json'],{encoding:'utf8'}));
  const historical=retainedSliceTasks(base,packs,'src/utility-contributions/index.ts')
    .flatMap(slice=>slice.keys);
  assert.ok(historical.includes(source)&&historical.includes(architecture),'Registered base consumer tasks survive narrowing');
  const retired=structuredClone(packs);
  retired.find(pack=>pack.id==='project_event_transport').browserAdapters=
    retired.find(pack=>pack.id==='project_event_transport').browserAdapters
      .filter(path=>path!=='test/project-observation-sources-browser-test.mjs');
  assert.ok(!retainedSliceTasks(base,retired,'src/utility-contributions/index.ts')
    .flatMap(slice=>slice.keys).includes(source),'A retired task is not resurrected');
  for(const ids of [['shell'],['project_event_transport']]) {
    const current=new Set(keys(planVerification(packs,{packIds:ids,includeProperties:true})));
    for(const key of keys(planVerification(base,{packIds:ids,includeProperties:true})))
      assert.ok(current.has(key),'Original task retained: '+key);
  }
  const terminal=new Set(keys(planVerification(packs,{terminalFull:true,includeProperties:true})));
  for(const key of keys(planVerification(base,{terminalFull:true,includeProperties:true})))
    assert.ok(terminal.has(key),'Original terminal task retained: '+key);
  const changedPaths=['src/utility-contributions/index.ts'];
  const mixed=planVerification(packs,{changedPaths,basePacks:base,
    includeProperties:true,changeSet:{version:1,
      baseCommit:'d5c876f4000994a8455d51b7e5242899c2e40d0c',
      commit:'d5c876f4000994a8455d51b7e5242899c2e40d0c',
      paths:changedPaths,entries:changedPaths.map(path=>({status:'M',path}))}});
  for(const key of keys(planVerification(base,{changedPaths:['src/utility-contributions/index.ts'],includeProperties:true})))
    assert.ok(keys(mixed).includes(key),'Same-range base obligation retained: '+key);
}
