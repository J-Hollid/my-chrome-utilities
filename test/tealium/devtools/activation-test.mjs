import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFixture} from '../../../scripts/verification-planner/manifest-declarations/fixture.mjs';
import {canonicalVerificationChangeSet} from '../../../scripts/verification-planner/history/changes.mjs';
import {manifestDeclarationEvidence} from '../../../scripts/verification-planner/manifest-declarations/repository.mjs';
const registry=JSON.parse(await readFile('verification/packs.json','utf8'));
const fixture=await createFixture({registry});
try {
  const manifest=JSON.parse(await readFile('manifest.json','utf8'));
  const resource='tealium/devtools/index.html';
  const accepted=JSON.parse(execFileSync('git',['show',
    '721c0ca298e6f1d75ff771048682343c9df32489:manifest.json'],{encoding:'utf8'}));
  assert.equal(accepted.devtools_page,undefined,'The accepted registration stage has no activation');
  assert.deepEqual(manifest,{...accepted,devtools_page:resource},
    'The delivered manifest must activate DevTools without changing other fields');
  await fixture.put('manifest.json',JSON.stringify(accepted));
  for(const file of ['build-delivered-dependencies.json',resource])
    await fixture.put(file,await readFile(file,'utf8'));
  const base=fixture.commit('actual Stage A delivery layout');
  await fixture.put('manifest.json',JSON.stringify(manifest));
  fixture.commit('sole Stage B activation');
  const change=await canonicalVerificationChangeSet({base,repositoryRoot:fixture.root});
  assert.deepEqual(change.paths,['manifest.json']);
  assert.equal(manifestDeclarationEvidence(change,registry)?.delta.after,resource);
  console.log('Delivered manifest activates the accepted DevTools resource under the unchanged guard');
} finally {await fixture.close();}
