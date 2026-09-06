import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {canonicalVerificationChangeSet} from '../history/changes.mjs';
import {planVerification} from '../tasks/planner.mjs';
import {exactOwnershipReadiness} from '../../verification-ownership-readiness-core.mjs';
const root=await mkdtemp(path.resolve('tmp/architecture-declaration-'));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',timeout:5000});
const put=async(file,text)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});await writeFile(path.join(root,file),text);};
const entry=(contracts=[])=>({module:'schemas',layer:'application',contracts});
const file='architecture/data-layer-boundaries.json';
const pack=(id,source,extra={})=>({id,source,unit:[`test/${id}.mjs`],property:[],features:[],handlers:[],browserAdapters:[],dependencies:[],sharedComponents:[],...extra});
const packs=[pack('owner',['src/owner']),pack('consumer',['src/consumer.ts']),
 pack('other',['src/other.ts']),pack('shell',['src/shell.ts'],{process:['architecture/'],globalImpact:['architecture/']})];
try {
 git('init','-q');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture');
 for(const name of ['owner','consumer','other'])await put(`src/${name}.ts`,'export const value=1;');
 await put('scripts/verification-planner/architecture-declarations/repository.mjs','// Previously reviewed policy fixture.');
 await put(file,JSON.stringify({'src/owner.ts':entry(),'src/consumer.ts':entry(['src/owner.ts'])}));
 git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD').trim();
 await put(file,JSON.stringify({'src/owner.ts':{...entry(),layer:'core'},'src/consumer.ts':entry(['src/owner.ts'])}));
 git('add','.');git('commit','-qm','declaration');
 const changeSet=await canonicalVerificationChangeSet({base,repositoryRoot:root});
 const plan=planVerification(packs,{changedPaths:changeSet.paths,changeSet,basePacks:packs});
 assert.deepEqual(plan.packIds,['owner','consumer','shell']);
 assert.ok(plan.tasks.some(task=>task.key==='build:dist'));
 const readiness=await exactOwnershipReadiness({intent:{version:1,baseCommit:base,task:'declarations',
  approvedPackIds:['owner','consumer','shell'],likelyPaths:[file],proposedPrefixes:[]},packs,basePacks:packs,changeSet});
 assert.equal(readiness.classification,'bounded-ready');
 const historical=packs.map(pack=>pack.id==='other'?{...pack,runtimeInputs:['src/owner.ts']}:pack);
 assert.equal(planVerification(packs,{changedPaths:changeSet.paths,changeSet,basePacks:historical}).packIds.length,4);
 const forged=structuredClone(changeSet);forged.declarationOnly=true;forged.owners=['owner'];
 assert.equal(planVerification(packs,{changedPaths:forged.paths,changeSet:forged,basePacks:packs}).packIds.length,4);
 assert.equal(planVerification(packs,{changedPaths:[file]}).packIds.length,4);
 await put('architecture/shared-policy.json','{}');git('add','.');git('commit','-qm','mixed');
 const mixed=await canonicalVerificationChangeSet({base,repositoryRoot:root});
 assert.equal(planVerification(packs,{changedPaths:mixed.paths,changeSet:mixed,basePacks:packs}).packIds.length,4);
 const changes=[];
 for(const kind of ['add a module entry','edit a module entry','delete a module entry','rename a source path','change a contract edge']) {
  git('reset','--hard',base);
  const declarations={'src/owner.ts':entry(),'src/consumer.ts':entry(['src/owner.ts'])};
  let expected=['owner','consumer','shell'];
  if(kind==='add a module entry'){
   await put('src/owner-new.ts','export const value=2;');declarations['src/owner-new.ts']=entry(['src/owner.ts']);
  } else if(kind==='edit a module entry')declarations['src/owner.ts'].layer='core';
  else if(kind==='delete a module entry'){
   await rm(path.join(root,'src/owner.ts'));delete declarations['src/owner.ts'];declarations['src/consumer.ts']=entry();
  } else if(kind==='rename a source path'){
   git('mv','src/owner.ts','src/owner-renamed.ts');delete declarations['src/owner.ts'];
   declarations['src/owner-renamed.ts']=entry();declarations['src/consumer.ts']=entry(['src/owner-renamed.ts']);
  } else {declarations['src/owner.ts']=entry(['src/other.ts']);expected=['owner','consumer','other','shell'];}
  await put(file,JSON.stringify(declarations));git('add','.');git('commit','-qm',kind);
  const delta=await canonicalVerificationChangeSet({base,repositoryRoot:root});
  assert.deepEqual(planVerification(packs,{changedPaths:delta.paths,changeSet:delta,basePacks:packs}).packIds,expected);
  changes.push(kind);
 }
 git('reset','--hard',base);
 await put(file,JSON.stringify({'src/owner.ts':{...entry(),layer:'invalid'}}));git('add','.');git('commit','-qm','invalid');
 const invalid=await canonicalVerificationChangeSet({base,repositoryRoot:root});
 assert.throws(()=>planVerification(packs,{changedPaths:invalid.paths,changeSet:invalid,basePacks:packs}),/Invalid architecture/);
 git('reset','--hard',base);
 await put('src/unowned.ts','export const value=1;');
 await put(file,JSON.stringify({'src/owner.ts':entry(['src/unowned.ts'])}));git('add','.');git('commit','-qm','unowned');
 const unresolved=await canonicalVerificationChangeSet({base,repositoryRoot:root});
 assert.throws(()=>planVerification(packs,{changedPaths:unresolved.paths,changeSet:unresolved,basePacks:packs}),/Unresolved architecture consumer|Assign every changed path/);
 git('reset','--hard',base);
 await rm(path.join(root,'scripts/verification-planner/architecture-declarations/repository.mjs'));
 git('add','.');git('commit','-qm','before implementation');const unprepared=git('rev-parse','HEAD').trim();
 await put('scripts/verification-planner/architecture-declarations/repository.mjs','// New policy.');
 await put(file,JSON.stringify({'src/owner.ts':{...entry(),layer:'core'},'src/consumer.ts':entry(['src/owner.ts'])}));
 git('add','.');git('commit','-qm','same range policy');
 const sameRange=await canonicalVerificationChangeSet({base:unprepared,repositoryRoot:root});
 const policyPacks=packs.map(pack=>pack.id==='shell'?{...pack,process:[...pack.process,'scripts/']}:pack);
 assert.equal(planVerification(policyPacks,{changedPaths:sameRange.paths,changeSet:sameRange,basePacks:policyPacks}).packIds.length,4);
 await assert.rejects(canonicalVerificationChangeSet({base:'0'.repeat(40),repositoryRoot:root}));
 console.log(JSON.stringify({architectureDeclarations:{planner:true,readiness:true,callerLabelsRejected:true,
  mixed:true,changes,invalid:true,unresolved:true,unavailable:true,baseConsumers:true,sameRange:true}}));
} finally {await rm(root,{recursive:true,force:true});}
