import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
const exec=promisify(execFile);
export async function packagedTealium() {
  await exec(process.execPath,['scripts/package.mjs'],{maxBuffer:4*1024*1024});
  const extensionRoot=await mkdtemp(path.resolve('tmp/tealium-package-'));
  const close=()=>rm(extensionRoot,{recursive:true,force:true});
  try {
    await exec('unzip',['-q',path.resolve('build/package/my-chrome-utilities.zip'),'-d',extensionRoot]);
    return {extensionRoot,close};
  }catch(error){await close();throw error;}
}
