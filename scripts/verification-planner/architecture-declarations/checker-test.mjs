import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cp,mkdtemp,mkdir,readFile,writeFile,symlink,rm} from 'node:fs/promises';
import path from 'node:path';
const root=await mkdtemp(path.resolve('tmp/architecture-complete-check-'));
const check=()=>execFileSync(process.execPath,['scripts/check-architecture.mjs'],{
 cwd:root,encoding:'utf8',timeout:20000,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe']});
try {
 await cp('src',path.join(root,'src'),{recursive:true,dereference:true});
 await mkdir(path.join(root,'scripts'));await mkdir(path.join(root,'architecture'));
 await cp('scripts/check-architecture.mjs',path.join(root,'scripts/check-architecture.mjs'));
 await symlink(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
 const declarations=JSON.parse(await readFile('architecture/data-layer-boundaries.json','utf8'));
 const file='src/data-layer-declaration-fixture.ts';
 declarations[file]={module:'schemas',layer:'core'};
 await writeFile(path.join(root,'architecture/data-layer-boundaries.json'),JSON.stringify(declarations));
 await writeFile(path.join(root,file),'export const declarationFixture=1;');
 check();
 await writeFile(path.join(root,file),'export const declarationFixture=document.body;');
 assert.throws(check,error=>error.stderr.includes('core may not use DOM'));
 await writeFile(path.join(root,file),'import "./data-layer-project-library-ui.js";');
 assert.throws(check,error=>error.stderr.includes('core may not depend on browser'));
 console.log(JSON.stringify({architectureDeclarations:{completeChecker:true,newModule:true,invalidLayer:true,invalidImport:true}}));
} finally {await rm(root,{recursive:true,force:true});}
