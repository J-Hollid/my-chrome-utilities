import {assertSourceConsumerSelection} from './source-consumer-selection.mjs';
import {assertHostAssertionConservation} from './host-assertion-conservation.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {loadVerificationPacks,planVerification} from '../../scripts/verification-packs.mjs';
import {isRunnablePack} from '../../scripts/verification-pack-cardinality/contract.mjs';

const packs=await loadVerificationPacks();
const options={includeProperties:true};
const additive=planVerification(packs,{...options,changedPaths:['build-delivered-dependencies.json','src/utility-contributions/index.ts','test/utility-tab-expansion/probe.html','test/utility-tab-expansion/probe.css','test/utility-tab-expansion/probe.mjs']});
const privateEdit=planVerification(packs,{...options,changedPaths:['test/utility-tab-expansion/probe.mjs']});
const shared=planVerification(packs,{...options,changedPaths:['src/utility-host/retained-page.ts']});
for(const plan of [additive,privateEdit,shared])assert.deepEqual(plan.parentPackSliceFallbacks,[],'Only exact causal slices are eligible');
const keys=plan=>plan.tasks.map(({key})=>key).sort();
assert.deepEqual(keys(privateEdit),['browser:test/utility-tab-expansion-standalone-browser-test.mjs','build:dist','unit:test/utility-tab-expansion/protocol-test.mjs']);
assert.ok(keys(additive).includes('browser:test/utility-tab-expansion-browser-test.mjs'));
for(const task of ['unit:test/package-clean-checkout-contract-test.mjs','checkpoint:shell:dist-artifact-integrity','checkpoint:shell:portable-package'])assert.ok(keys(additive).includes(task),'Additive delivery retains '+task);
for(const key of keys(shared))assert.ok(keys(additive).includes(key),'Additive entries retain the installed host consumer '+key);
const host=packs.find(({id})=>id==='shell').verificationSlices.find(({id})=>id==='utility_workspace_host');
for(const consumer of host.consumers)assert.ok(shared.packIds.includes(consumer.packId),'Shared semantics retain '+consumer.packId);
const base='de53abe11e8c41f6e53d2880f621a765dde7bdd7';
const before=JSON.parse(execFileSync('git',['show',base+':verification/packs.json'],{encoding:'utf8'}));
let conserved=0;
for(const pack of before.filter(isRunnablePack)){
  const prior=planVerification(before,{...options,packIds:[pack.id]});
  const current=new Set(keys(planVerification(packs,{...options,packIds:[pack.id]})));
  for(const key of keys(prior)){assert.ok(current.has(key),'Lost executable check '+key);conserved++;}
}
const permission=planVerification(packs,{...options,changedPaths:['manifest.json']});
assert.equal(permission.packIds.length,before.filter(isRunnablePack).length);
assert.throws(()=>planVerification(packs,{changedPaths:['src/unregistered-utility-shared.ts']}),/Assign every changed path/);
const paths=['src/side-panel.ts'];
const mixed=planVerification(packs,{...options,changedPaths:paths,basePacks:before,
  changeSet:{version:1,baseCommit:base,commit:base,paths,entries:[{status:'M',path:paths[0]}]}});
for(const key of keys(planVerification(before,{...options,changedPaths:paths})))assert.ok(keys(mixed).includes(key),'Same-range base obligation '+key);
console.log(JSON.stringify({utilityExpansionPlans:{planOnly:true,base,conserved,
  additive:keys(additive),privateEdit:keys(privateEdit),additionalHostTasks:keys(additive).filter(key=>!keys(privateEdit).includes(key)),
  unknownStops:true,permissionConservative:true,sameRangeConservative:true}}));

await assertSourceConsumerSelection();
await assertHostAssertionConservation();
