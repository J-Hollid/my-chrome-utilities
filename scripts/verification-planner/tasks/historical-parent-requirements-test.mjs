import assert from 'node:assert/strict';
import {planVerification} from './planner.mjs';

const pack=id=>({id,source:[`src/${id}/`],process:[],globalImpact:[],dependencies:[],
  unit:[`test/${id}-one.mjs`,`test/${id}-two.mjs`],property:[`test/${id}-property.mjs`],
  features:[],handlers:[],browserAdapters:[]});
const slice=(id,paths,consumers=[])=>({id:'local',sourcePaths:paths,sourcePrefixes:[],
  tasks:[`unit:test/${id}-one.mjs`],prerequisites:[],consumers,observableBoundary:'controlled consumer'});
const before=['alpha','beta','gamma'].map(pack);
before[0].impactBoundaries=[{id:'alpha_boundary',prefixes:['src/alpha/'],
  propagateDependants:false,sourceClass:'application controller',consumers:['beta']}];
before[2].verificationSlices=[slice('gamma',['src/gamma/private.ts'])];
const after=structuredClone(before);
after[0].verificationSlices=[slice('alpha',['src/alpha/entry.ts','src/alpha/moved.ts'],
  [{packId:'beta',sliceId:'local'}])];
after[1].verificationSlices=[{...slice('beta',[]),consumerOnly:true}];
function plan(current,base,entries){
  const paths=[...new Set(entries.flatMap(e=>e.oldPath?[e.oldPath,e.newPath]:[e.path]))];
  return planVerification(current,{changedPaths:paths,basePacks:base,includeProperties:true,
    changeSet:{version:1,baseCommit:'a'.repeat(40),commit:'b'.repeat(40),paths,entries}});
}
const former=planVerification(before,{changedPaths:['src/alpha/entry.ts'],includeProperties:true});
for(const entry of [{status:'M',path:'src/alpha/entry.ts'},
  {status:'R',oldPath:'src/alpha/entry.ts',newPath:'src/alpha/moved.ts',score:100},
  {status:'C',oldPath:'src/alpha/entry.ts',newPath:'src/alpha/moved.ts',score:100},
  {status:'D',path:'src/alpha/entry.ts'}]){
  const result=plan(after,before,[entry,{status:'M',path:'src/gamma/private.ts'}]);
  for(const {key} of former.tasks)assert.equal(result.tasks.filter(t=>t.key===key).length,1,
    `${entry.status} retains ${key} exactly once`);
  assert.ok(result.tasks.some(t=>t.key==='unit:test/gamma-one.mjs'));
  assert.ok(!result.tasks.some(t=>t.key==='unit:test/gamma-two.mjs'),
    'an unrelated historical exact slice remains narrow');
}
const integrated=plan(after,after,[{status:'M',path:'src/alpha/entry.ts'}]);
assert.deepEqual(integrated.parentPackSliceFallbacks,[]);
assert.deepEqual(integrated.tasks.map(t=>t.key).filter(k=>k.startsWith('unit:')),
  ['unit:test/alpha-one.mjs','unit:test/beta-one.mjs']);
console.log('historical parent tasks survive modification, rename, copy, and deletion; integrated slices remain narrow');
