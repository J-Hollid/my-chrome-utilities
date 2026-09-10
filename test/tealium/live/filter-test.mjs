import {checkProfileDisplay} from './metadata/profile-display-check.mjs';
import assert from 'node:assert/strict';
import {visibleTags} from '../../../dist/tealium/live/render.js';
const rows=[{key:'first',name:'Analytics',uid:'21',codeState:'Configured',frameId:0,profile:'shop'},
  {key:'second',name:'Other analytics',uid:'32',codeState:'Code registered',frameId:1,profile:'other'},
  {key:'third',name:'<img src=x onerror=run>',uid:'21',codeState:'Code registered',frameId:2,profile:'shop'}];
const state={rows,search:'',codeFilter:'',profileFilter:''};
assert.deepEqual(visibleTags({...state,search:'ANALYTICS'}).map(row=>row.key),['first','second']);
assert.deepEqual(visibleTags({...state,search:'21',codeFilter:'Code registered'}).map(row=>row.key),['third']);
assert.deepEqual(visibleTags({...state,profileFilter:'1 / other'}).map(row=>row.key),['second']);
assert.equal(visibleTags({...state,search:'missing'}).length,0);
assert.equal(visibleTags(state).length,3);
assert.equal(rows[2].name,'<img src=x onerror=run>');
console.log('Tealium name, UID, code, profile, and clear-filter results passed');

checkProfileDisplay();
