import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {planVerification} from '../../scripts/verification-planner/tasks/planner.mjs';
import {validateVerificationPacks} from '../../scripts/verification-registry/validation.mjs';
import {isRunnablePack} from '../../scripts/verification-pack-cardinality/contract.mjs';

const base='fceab38a0880109df317b2d9d8e439875901fbc9';
const before=JSON.parse(execFileSync('git',['show',`${base}:verification/packs.json`],
  {encoding:'utf8',maxBuffer:8*1024*1024}));
const packs=JSON.parse(await readFile('verification/packs.json','utf8'));
await validateVerificationPacks(packs);
const consumers=['capture','command-palette','defects','durable_project_repository','event-library',
  'hotkeys','live_flow_testing','project_event_transport','project_management','replay','schemas','verification_process'];
const expected=[...consumers,'shell'].sort();
for(const changedPath of ['src/background.ts','src/background/repository.ts','src/background/side-panel.ts']) {
  const plan=planVerification(packs,{changedPaths:[changedPath]});
  assert.deepEqual([...plan.packIds].sort(),expected,changedPath);
  for(const key of ['unit:test/background-command-test.mjs','unit:test/background/ownership-test.mjs'])
    assert.ok(plan.tasks.some(task=>task.key===key),`${changedPath}: ${key}`);
  assert.deepEqual(plan.terminalFullObligations,[changedPath]);
}
for(const oldPack of before) {
  if(!isRunnablePack(oldPack)) {
    assert.deepEqual(packs.find(pack=>pack.id===oldPack.id),oldPack);
    continue;
  }
  const options={packIds:[oldPack.id],includeProperties:true};
  const oldPlan=planVerification(before,options),newPlan=planVerification(packs,options);
  const tasks=new Map(newPlan.tasks.map(task=>[task.key,task]));
  for(const task of oldPlan.tasks)assert.deepEqual(tasks.get(task.key),task,`${oldPack.id}: ${task.key}`);
}
const terminal=new Map(planVerification(packs,{terminalFull:true,includeProperties:true}).tasks.map(task=>[task.key,task]));
for(const task of planVerification(before,{terminalFull:true,includeProperties:true}).tasks)
  assert.deepEqual(terminal.get(task.key),task,`terminal ${task.key}`);
console.log('Stage B retains exact parent tasks, host consumers, and terminal coverage');
