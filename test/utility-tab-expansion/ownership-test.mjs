import {verifyEntryConsumerReachability} from './reachability-regression.mjs';
import {verifyNavigationOwnership} from './navigation-regression.mjs';
import {verifyRootOwnershipRegression} from './root-ownership-regression.mjs';
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
  'unit:test/utility-tab-expansion/host-contract-test.mjs',
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
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const preparation=execFileSync('git',['diff','--name-status',base,commit],{encoding:'utf8'})
  .trim().split('\n').filter(Boolean).map(line=>{const [status,path]=line.split('\t');return {status,path};});
for(const [label,initial] of [['host-only',[]],['complete preparation',preparation]]) {
  const entries=[...initial];
  for(const path of hostPaths) if(!entries.some(entry=>entry.path===path))entries.push({status:'M',path});
  const paths=entries.map(({path})=>path);
  const mixed=planVerification(after,{changedPaths:paths,includeProperties:true,basePacks:before,
    changeSet:{version:1,baseCommit:base,commit,paths,entries}});
  const counts=new Map();
  for(const {key} of mixed.tasks) counts.set(key,(counts.get(key)??0)+1);
  const missing=oldPlan.tasks.filter(({key})=>counts.get(key)!==1).map(({key})=>key);
  assert.deepEqual(missing,[],`${label} retains every former executable task exactly once`);
}
console.log(JSON.stringify({utilityHostOwnership:{before:oldPlan.tasks.length,after:newPlan.tasks.length,
  packs:newPlan.packIds,conserved:true,permissionsConservative:true,sameRangeConservative:true}}));

verifyRootOwnershipRegression(after,process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ? JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined);

verifyNavigationOwnership(after,process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ? JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined);

verifyEntryConsumerReachability(after,process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ? JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined);
