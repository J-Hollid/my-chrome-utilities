import assert from 'node:assert/strict';
import {canonicalVerificationChangeSet} from '../history/changes.mjs';
import {manifestDeclarationEvidence,bindManifestDeclarations} from './repository.mjs';
import {createFixture,manifest,packs,policyFiles} from './fixture.mjs';

const fixture=await createFixture(),{root,base,put,commit,reset,git}=fixture;
const observe=()=>canonicalVerificationChangeSet({base,repositoryRoot:root});
const change=()=>put('manifest.json',JSON.stringify({...manifest,devtools_page:'tools/devtools.html'}));
try {
  await change();commit('manifest entry');
  const valid=await observe();
  assert.equal(manifestDeclarationEvidence(valid,packs)?.delta.after,'tools/devtools.html');
  assert.equal(manifestDeclarationEvidence(structuredClone(valid),packs),null);
  assert.equal(manifestDeclarationEvidence(valid,[...packs].reverse()),null);
  const forged={...valid,entries:[{path:'manifest.json',status:'A'}]};
  await bindManifestDeclarations(forged,root);
  assert.equal(manifestDeclarationEvidence(forged,packs),null);
  assert.throws(()=>{manifestDeclarationEvidence(valid,packs).delta.after='forged.html';});
  const stale={...valid,commit:base};
  await bindManifestDeclarations(stale,root);
  assert.equal(manifestDeclarationEvidence(stale,packs),null);
  valid.paths.push('extra');assert.equal(manifestDeclarationEvidence(valid,packs),null);
  for(const file of policyFiles) {
    reset();await change();await put(file,'// changed policy');commit('policy change');
    assert.equal(manifestDeclarationEvidence(await observe(),packs),null,file);
  }
  for(const [name,mutate] of [
    ['declaration',()=>put('verification/packs.json',JSON.stringify(packs.map(p=>({...p,unit:[]}))))],
    ['missing resource',()=>{git('rm','tools/devtools.html');}],
    ['missing delivery',()=>put('build-delivered-dependencies.json','[]')],
    ['wrong destination',()=>put('build-delivered-dependencies.json',JSON.stringify([
      {source:'tools/devtools.html',destination:'elsewhere.html'}]))],
    ['duplicate field',()=>put('manifest.json','{"name":"wrong","name":"Fixture","devtools_page":"tools/devtools.html"}')],
    ['deleted manifest',()=>{git('rm','-f','manifest.json');}],
  ]) {
    reset();await change();await mutate();commit(name);
    assert.equal(manifestDeclarationEvidence(await observe(),packs),null,name);
  }
  reset();await put(policyFiles[0],'// Filename without the accepted implementation');
  const filenameOnly=commit('unsupported base policy');await change();commit('entry with wrong base policy');
  assert.equal(manifestDeclarationEvidence(await canonicalVerificationChangeSet({base:filenameOnly,
    repositoryRoot:root}),packs),null);
  reset();git('rm',policyFiles[0]);const unprepared=commit('before adapter');
  await change();commit('unprepared manifest');
  const absent=await canonicalVerificationChangeSet({base:unprepared,repositoryRoot:root});
  assert.equal(manifestDeclarationEvidence(absent,packs),null);
  const unavailable={...absent,baseCommit:'0'.repeat(40)};
  await bindManifestDeclarations(unavailable,root);
  assert.equal(manifestDeclarationEvidence(unavailable,packs),null);
  console.log('Canonical manifest evidence and policy conservation passed');
} finally {await fixture.close();}
