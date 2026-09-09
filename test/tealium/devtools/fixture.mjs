import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {packagedTealium} from '../package.mjs';

export async function sourceNavigationPackage() {
  const packaged=await packagedTealium(),{extensionRoot,close}=packaged;
  try {
    const file=path.join(extensionRoot,'manifest.json'), manifest=JSON.parse(await readFile(file,'utf8'));
    const preview=manifest.devtools_page===undefined;
    if(preview) {
      // Stage 1 delivers the exact resource before QA activates this single field.
      // This test is a source-runtime preview, never final activation evidence.
      await writeFile(file,JSON.stringify({...manifest,devtools_page:'tealium/devtools/index.html'},null,2)+'\n');
      const activated=JSON.parse(await readFile(file,'utf8'));
      delete activated.devtools_page; assert.deepEqual(activated,manifest);
    } else assert.equal(manifest.devtools_page,'tealium/devtools/index.html');
    assert.equal(manifest.permissions.includes('debugger'),false);
    return {extensionRoot,preview,close};
  }catch(error){await close();throw error;}
}
