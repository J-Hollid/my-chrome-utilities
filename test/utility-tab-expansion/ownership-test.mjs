import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {loadVerificationPacks,planVerification} from '../../scripts/verification-packs.mjs';

import {isRunnablePack} from '../../scripts/verification-pack-cardinality/contract.mjs';

const base='03f3e769de13943f0e516ea91b0fe3b48c621825';
const before=JSON.parse(execFileSync('git',['show',`${base}:verification/packs.json`],{encoding:'utf8'}));
const after=await loadVerificationPacks();
const hostPaths=['src/side-panel.ts','src/side-panel-bootstrap.ts','src/utility-registry.ts',
  'src/workspace-tabs.ts','src/workspace-tabs-ui.ts','side-panel.html'];
const oldPlan=planVerification(before,{changedPaths:hostPaths,includeProperties:true});
const newPlan=planVerification(after,{changedPaths:hostPaths,includeProperties:true});
assert.ok(newPlan.packIds.length<oldPlan.packIds.length,'the reviewed host mapping must remove the all-pack expansion');
assert.deepEqual(newPlan.parentPackSliceFallbacks,[],'host checks must use exact consumers');
const keys=new Set(newPlan.tasks.map(({key})=>key));
for(const key of ['unit:test/workspace-tabs-installed-controller-test.mjs',
  'unit:test/modular-utility-architecture-test.mjs',
  'unit:test/side-panel-single-cutover-preparation-test.mjs',
  'unit:test/hotkey-installed-controller-test.mjs',
  'unit:test/command-palette-installed-controller-test.mjs',
  'browser-observation:LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER+SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER+WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER'])
  assert.ok(keys.has(key),`missing host observation ${key}`);
const controllers=['capture','event-library','schemas','defects','replay','projects',
  'durable-projects','project-event-transport','live-flow-testing'];
for(const id of controllers) assert.ok(keys.has(`unit:test/data-layer-installed/consumers/${id==='projects'?'project-management':id==='durable-projects'?'durable-project-repository':id}-consumer-test.mjs`),`missing ${id} consumer`);
for(const oldPack of before){
  const current=after.find(({id})=>id===oldPack.id);
  for(const field of ['globalImpact','dependencies','runtimeInputs','browserObservations','checkpointCommands'])
    assert.deepEqual(current[field],oldPack[field],`${oldPack.id} conserves ${field}`);
  if(!isRunnablePack(oldPack)) continue;
  const oldKeys=planVerification(before,{packIds:[oldPack.id],includeProperties:true}).tasks.map(({key})=>key);
  const currentKeys=new Set(planVerification(after,{packIds:[oldPack.id],includeProperties:true}).tasks.map(({key})=>key));
  for(const key of oldKeys) assert.ok(currentKeys.has(key),`lost executable task ${key}`);
}
const permission=planVerification(after,{changedPaths:['manifest.json'],includeProperties:true});
assert.equal(permission.packIds.length,oldPlan.packIds.length,'permission changes keep conservative verification');
assert.throws(()=>planVerification(after,{changedPaths:['src/unregistered-utility-shared.ts']}),/Assign every changed path/);
const mixed=planVerification(after,{changedPaths:hostPaths,includeProperties:true,basePacks:before,
  changeSet:{version:1,baseCommit:base,commit:'a'.repeat(40),paths:hostPaths,entries:hostPaths.map(path=>({status:'M',path}))}});
assert.equal(mixed.packIds.length,oldPlan.packIds.length,'same-range changes keep all former owners');
console.log(JSON.stringify({utilityHostOwnership:{before:oldPlan.tasks.length,after:newPlan.tasks.length,
  packs:newPlan.packIds,conserved:true,permissionsConservative:true,sameRangeConservative:true}}));
