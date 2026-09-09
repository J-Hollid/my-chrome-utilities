import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';

export const policyFiles=[
  'scripts/verification-planner/manifest-declarations/delta.mjs',
  'scripts/verification-planner/manifest-declarations/repository.mjs',
  'scripts/verification-planner/manifest-declarations/impact.mjs',
  'scripts/verification-planner/manifest-declarations/slice-mapping.mjs',
  'scripts/verification-planner/history/changes.mjs',
  'scripts/verification-planner/tasks/planner.mjs',
  'scripts/verification-shared-boundaries.mjs',
  'scripts/build.mjs','scripts/build-delivered-dependencies.mjs',
];
export const boundary={id:'devtools_manifest_declaration',prefixes:['manifest.json'],
  owner:'shell',consumers:['host'],structuralClass:'registration',
  qaTargets:['HOST_SMOKE'],propagateDependants:false,terminalFullObligation:true};
const pack=(id,extra={})=>({id,source:[`src/${id}/`],unit:[`test/${id}.mjs`],
  property:[],features:[],handlers:[],browserAdapters:[],dependencies:[],sharedComponents:[],...extra});
export const packs=[pack('shell',{source:['manifest.json','tools/','scripts/','build-delivered-dependencies.json'],
  globalImpact:['manifest.json'],sharedBoundaries:[boundary]}),
  pack('host',{browserObservations:[{id:'HOST_SMOKE',path:'test/host.mjs',environment:{},
    observationKeys:['host'],features:[]}]}),pack('other')];
export const manifest={manifest_version:3,name:'Fixture',version:'1',permissions:['activeTab']};

export async function createFixture({registry=packs}={}) {
  const root=await mkdtemp(path.resolve('tmp/manifest-declarations-'));
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',timeout:5000});
  const put=async(file,text)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});
    await writeFile(path.join(root,file),text);};
  git('init','-q');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture');
  for(const file of policyFiles)await put(file,await readFile(file,'utf8'));
  await put('verification/packs.json',JSON.stringify(registry));
  await put('manifest.json',JSON.stringify(manifest));
  await put('tools/devtools.html','<!doctype html><title>Fixture entry</title>');
  await put('build-delivered-dependencies.json',JSON.stringify([
    {source:'tools/devtools.html',destination:'tools/devtools.html'}]));
  const commit=message=>{git('add','.');git('commit','-qm',`${message}\n\nBy coder.`);return git('rev-parse','HEAD').trim();};
  const base=commit('fixture base');
  return {root,git,put,commit,base,reset:()=>git('reset','--hard',base),
    close:()=>rm(root,{recursive:true,force:true})};
}
