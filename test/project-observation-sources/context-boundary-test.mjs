import assert from 'node:assert/strict';
import {createObservationSourceEditor} from '../../dist/data-layer-project-observation-sources/editor-state.js';
let projectId='retail',release;
let stored={projectId,sources:[{id:'m',name:'Marketing',path:'dataLayer',enabled:true}]};
const editor=createObservationSourceEditor({projectId:()=>projectId,load:async()=>stored,
  save:async()=>{},changed:()=>{},id:()=> 'new'});
await editor.refresh();
projectId='partner';stored=new Promise(resolve=>release=resolve);
const refresh=editor.refresh();
assert.equal(editor.configuration(),undefined,'old project settings are unavailable while new settings load');
release({projectId,sources:[{id:'p',name:'Partner',path:'partnerQueue',enabled:true}]});await refresh;
assert.equal(editor.configuration().projectId,'partner');
console.log('Source project context boundary tests passed');
await (await import('./browser/settled-control-regression.mjs')).verifySettledControlRegression(
  process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined);
