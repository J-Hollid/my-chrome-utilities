import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {planVerification} from '../tasks/planner.mjs';
import {isRunnablePack} from '../../verification-pack-cardinality/contract.mjs';
import {validateVerificationPacks} from '../../verification-registry/validation.mjs';
import {sharedBoundaryPlanFor,validateSharedBoundaryDeclarations} from '../../verification-shared-boundaries.mjs';
import {assertHistoricalIdentity,recordHistoricalRepair} from './historical-conservation.mjs';

const packs=JSON.parse(await readFile('verification/packs.json','utf8'));
const shell=packs.find(pack=>pack.id==='shell');
const consumers=['capture','event-library','schemas','defects','replay','project_management',
  'durable_project_repository','project_event_transport','live_flow_testing','hotkeys',
  'command-palette','verification_process'].sort();
validateSharedBoundaryDeclarations(packs);
await validateVerificationPacks(packs);
for(const id of ['devtools_manifest_declaration','background_entry_composition']) {
  const boundary=shell.sharedBoundaries.find(item=>item.id===id);
  assert.ok(boundary,id);
  assert.deepEqual([...boundary.consumers].sort(),consumers);
  assert.equal(boundary.terminalFullObligation,true);
  assert.deepEqual(boundary.qaTargets,['WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER']);
}
assert.equal(sharedBoundaryPlanFor(packs,'manifest.json'),null);
const privatePlan=planVerification(packs,{changedPaths:[
  'scripts/verification-planner/manifest-declarations/repository.mjs']});
const callers=planVerification(packs,{changedPaths:['scripts/verification-planner/history/changes.mjs']});
const guard=planVerification(packs,{changedPaths:['scripts/verification-shared-boundaries.mjs']});
for(const file of ['delta-test','repository-test','planner-test','registration-test']) {
  const key=`unit:scripts/verification-planner/manifest-declarations/${file}.mjs`;
  assert.ok(privatePlan.tasks.some(task=>task.key===key),`private ${key}`);
  assert.ok(callers.tasks.some(task=>task.key===key),`caller ${key}`);
  assert.ok(guard.tasks.some(task=>task.key===key),`guard ${key}`);
}
// A fixed specification parent is the independent pre-change task population.
const before=JSON.parse(execFileSync('git',['show',
  'a3034336ad5973d1b57b818a0465eb7c434b78b8:verification/packs.json'],{encoding:'utf8',maxBuffer:8*1024*1024}));
for(const oldPack of before) {
  if(!isRunnablePack(oldPack)) {
    assert.deepEqual(packs.find(pack=>pack.id===oldPack.id),oldPack);
    continue;
  }
  const options={packIds:[oldPack.id],includeProperties:true};
  const oldPlan=planVerification(before,options),newPlan=planVerification(packs,options);
  const tasks=new Map(newPlan.tasks.map(task=>[task.key,task]));
  for(const task of oldPlan.tasks) {
    const actual=tasks.get(task.key);
    assertHistoricalIdentity(actual,task,before);
    if(task.key==='acceptance-session:shell') {
      for(const mutate of [t=>t.args.splice(2,2),t=>t.args.push('unapproved'),
        t=>{t.executable='changed';},t=>{t.target+=',features/unapproved.feature';},
        t=>{t.display+=' unapproved';},t=>{t.requiredCapabilities.push('unapproved');}]) {
        const changed=structuredClone(actual);mutate(changed);
        assert.throws(()=>assertHistoricalIdentity(changed,task,before),assert.AssertionError);
      }
      recordHistoricalRepair('session',task,actual,()=>assertHistoricalIdentity(actual,task,before));
    }
  }
}
const allBefore=planVerification(before,{terminalFull:true}),allAfter=planVerification(packs,{terminalFull:true});
const afterKeys=new Set(allAfter.tasks.map(task=>task.key));
for(const task of allBefore.tasks)assert.ok(afterKeys.has(task.key),`terminal ${task.key}`);
const background=planVerification(packs,{changedPaths:['src/background.ts']});
assert.deepEqual([...background.packIds].sort(),['shell',...consumers].sort());
assert.ok(background.tasks.some(task=>task.key==='unit:test/background-command-test.mjs'));
assert.deepEqual(background.terminalFullObligations,['src/background.ts']);
console.log('Manifest/background registration and every parent task conserved');
