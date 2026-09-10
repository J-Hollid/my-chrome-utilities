import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createFixture} from '../../../scripts/verification-planner/manifest-declarations/fixture.mjs';
import {canonicalVerificationChangeSet} from '../../../scripts/verification-planner/history/changes.mjs';
import {manifestDeclarationEvidence} from '../../../scripts/verification-planner/manifest-declarations/repository.mjs';
const registry=JSON.parse(await readFile('verification/packs.json','utf8'));
const fixture=await createFixture({registry});
try {
  const manifest=JSON.parse(await readFile('manifest.json','utf8'));
  assert.equal(manifest.devtools_page,undefined,'Stage A must leave activation to QA');
  const resource='tealium/devtools/index.html';
  for(const file of ['manifest.json','build-delivered-dependencies.json',resource])
    await fixture.put(file,await readFile(file,'utf8'));
  const base=fixture.commit('actual Stage A delivery layout');
  await fixture.put('manifest.json',JSON.stringify({...manifest,devtools_page:resource}));
  fixture.commit('sole Stage B activation');
  const change=await canonicalVerificationChangeSet({base,repositoryRoot:fixture.root});
  assert.deepEqual(change.paths,['manifest.json']);
  assert.equal(manifestDeclarationEvidence(change,registry)?.delta.after,resource);
  console.log('Actual Stage A layout accepts sole manifest activation under the unchanged guard');
} finally {await fixture.close();}
