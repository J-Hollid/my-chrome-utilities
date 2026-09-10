import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cp,mkdir,mkdtemp,readFile,writeFile,rm,symlink} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

const exec=promisify(execFile);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const contribution={id:'probe',label:'Probe',page:'probe.html',storage:{namespace:'utility.probe.state',version:1}};

export async function prepareUtilityExtension({hosted=true,probe=true}={}) {
  const repository=process.cwd();
  await mkdir('tmp',{recursive:true});
  const fixtureRoot=await mkdtemp(path.resolve('tmp/utility-probe-build-'));
  const extensionRoot=path.join(fixtureRoot,'build','installed-package');
  const environment={...process.env};
  delete environment.MY_CHROME_UTILITIES_DIST_LOCK_HELD;
  delete environment.MY_CHROME_UTILITIES_DIST_LOCK_ACCESS;
  const run=(command,args)=>exec(command,args,{cwd:fixtureRoot,env:environment,maxBuffer:32*1024*1024});
  try {
    // Use current tracked inputs, including edits under development. This is an
    // isolated repository; the production checkout and shipped registry stay intact.
    await run('git',['clone','--shared','--no-checkout','--quiet',repository,'.']);
    const {stdout}=await exec('git',['ls-files','-z'],{cwd:repository,maxBuffer:8*1024*1024});
    const files=stdout.split('\0').filter(Boolean);
    for(let start=0;start<files.length;start+=32)await Promise.all(files.slice(start,start+32).map(async file=>{
      await mkdir(path.dirname(path.join(fixtureRoot,file)),{recursive:true});
      await cp(path.join(repository,file),path.join(fixtureRoot,file));
    }));
    await run('git',['read-tree','HEAD']);
    await symlink(path.join(repository,'node_modules'),path.join(fixtureRoot,'node_modules'),'dir');
    const registration='src/utility-contributions/index.ts';
    if(probe)await writeFile(path.join(fixtureRoot,registration),`export const utilityPageContributions = ${JSON.stringify([contribution])};\n`);
    const declaration='build-delivered-dependencies.json';
    const dependencies=JSON.parse(await readFile(path.join(fixtureRoot,declaration),'utf8'));
    const privateFiles=probe?['probe.html','probe.mjs'].map(file=>({source:`test/utility-tab-expansion/${file}`,destination:file})):[];
    if(probe)await writeFile(path.join(fixtureRoot,declaration),JSON.stringify([...dependencies,...privateFiles],null,2)+'\n');
    await run(process.execPath,['scripts/build.mjs']);
    await run(process.execPath,['scripts/package.mjs']);
    const archive=path.join(fixtureRoot,'build/package/my-chrome-utilities.zip');
    await mkdir(extensionRoot,{recursive:true});
    await run('unzip',['-q',archive,'-d',extensionRoot]);
    const delivered=probe?[...privateFiles,{source:'test/utility-tab-expansion/probe.css',destination:'utility-fixtures/probe.css'}]:[];
    const deliveredProof=[];
    for(const {source,destination} of delivered){
      const bytes=await readFile(path.join(fixtureRoot,source));
      assert.deepEqual(await readFile(path.join(extensionRoot,destination)),bytes,
        `Production package must deliver ${source} without a post-build copy`);
      deliveredProof.push({source,destination,sha256:digest(bytes)});
    }
    const installedRegistration=await readFile(path.join(extensionRoot,'utility-contributions/index.js'));
    assert.deepEqual(installedRegistration,await readFile(path.join(fixtureRoot,'dist/utility-contributions/index.js')));
    if(probe)assert.match(installedRegistration.toString(),/"probe"/);
    else assert.deepEqual(await readFile(path.join(fixtureRoot,registration)),await readFile(path.join(repository,registration)),
      'Production icon checks retain the current contribution source');
    console.log(JSON.stringify({utilityContributionPackage:{productionBuild:true,productionPackage:true,
      packageSha256:digest(await readFile(archive)),
      inputs:await Promise.all([registration,declaration].map(async source=>({source,sha256:digest(await readFile(path.join(fixtureRoot,source)))}))),
      delivered:deliveredProof}}));
    if(hosted){
      // Controlled observation/startup instrumentation only. Contribution metadata
      // and private files above remain exactly as extracted from the package.
      const {installObservationTarget}=await import('../project-observation-sources/browser/installed.mjs');
      await writeFile(path.join(extensionRoot,'probe-target.js'),`(${installObservationTarget.toString()})();
        const startup=localStorage.getItem('probe.startup');
        if(startup==='failed')indexedDB.open=()=>globalThis.probeStorageRequest={error:new Error('Controlled Data Layer storage failure')};
        if(startup==='waiting')indexedDB.open=()=>({addEventListener(){}});`);
      const html=await readFile(path.join(extensionRoot,'side-panel.html'),'utf8');
      await writeFile(path.join(extensionRoot,'side-panel.html'),html.replace('<head>','<head><script src="probe-target.js"></script>'));
    }
    return {extensionRoot,dispose:()=>rm(fixtureRoot,{recursive:true,force:true})};
  } catch(error){await rm(fixtureRoot,{recursive:true,force:true});throw error;}
}

export const prepareProbeExtension=prepareUtilityExtension;
