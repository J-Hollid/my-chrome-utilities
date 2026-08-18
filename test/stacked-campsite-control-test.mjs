import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  aggregateCampsiteAssessment,
  createRemainderManifest,
  recordDisposition,
  resumeRemainder,
} from "../scripts/stacked-campsite-control.mjs";

const exec=promisify(execFile);
const control=path.resolve("scripts/stacked-campsite-control.mjs");
async function git(root,...args){return (await exec("git",args,{cwd:root,encoding:"utf8"})).stdout.trim();}

const assessment=aggregateCampsiteAssessment({task:"product-task",candidate:"1".repeat(40),
  causalPaths:["src/two.ts","src/one.ts","src/two.ts"]});
assert.deepEqual(assessment.causalPaths,["src/one.ts","src/two.ts"]);
const manifest=createRemainderManifest({task:assessment.task,splitBase:"2".repeat(40),
  prerequisiteCommit:"3".repeat(40),remainderHead:"4".repeat(40),remainderTree:"5".repeat(40),
  orderedCommits:["4".repeat(40)],changeSetDigest:"6".repeat(64),
  causalPaths:assessment.causalPaths,boundaryGeneration:"shell-v1",
  expectedPostRebaseDelta:"7".repeat(64)});
assert.equal(resumeRemainder(manifest,{newQaHead:"8".repeat(40),
  observedPostRebaseDelta:"7".repeat(64),observedChangeSetDigest:"6".repeat(64),
  resumedHead:"9".repeat(40)}).reissuedTask,"product-task");
assert.throws(()=>resumeRemainder(manifest,{newQaHead:"8".repeat(40),
  observedPostRebaseDelta:"7".repeat(64),observedChangeSetDigest:"0".repeat(64),
  resumedHead:"9".repeat(40)}),/complete.*delta|change-set/i);
const records=[];
recordDisposition(records,{task:"product-task",path:"src/one.ts",boundary:"shell",
  generation:"shell-v1",result:"parent-fallback",failedPremise:"seam is not stable",consumers:["shell"]});
assert.throws(()=>recordDisposition(records,{task:"product-task",path:"src/one.ts",boundary:"shell",
  generation:"shell-v1",result:"slice",consumers:["shell"]}),/already has a disposition/u);

const repository=await mkdtemp(path.join(os.tmpdir(),"stacked-campsite-git-"));
try {
  await git(repository,"init","-q"); await git(repository,"config","user.name","Campsite Test");
  await git(repository,"config","user.email","campsite@example.test");
  await mkdir(path.join(repository,"src"));
  await writeFile(path.join(repository,"src/product.ts"),"export const product = 1;\n");
  await writeFile(path.join(repository,"src/outside.ts"),"export const outside = 1;\n");
  await writeFile(path.join(repository,"mapping.json"),"{}\n");
  await git(repository,"add","."); await git(repository,"commit","-qm","base");
  const base=await git(repository,"rev-parse","HEAD");
  await writeFile(path.join(repository,"src/product.ts"),"export const product = 2;\n");
  await writeFile(path.join(repository,"src/outside.ts"),"export const outside = 2;\n");
  await git(repository,"commit","-qam","product remainder");
  const remainder=await git(repository,"rev-parse","HEAD");
  await git(repository,"switch","-qc","preparation",base);
  await writeFile(path.join(repository,"mapping.json"),'{"slice":"ready"}\n');
  await git(repository,"commit","-qam","preparation");
  const preparation=await git(repository,"rev-parse","HEAD");
  await git(repository,"switch","-q","master");
  assert.equal(await git(repository,"branch","--show-current"),"master");
  const manifestPath=path.join(repository,"campsite.json");
  await exec(process.execPath,[control,"preserve","product-task",base,preparation,remainder,
    "shell-v1",JSON.stringify(["src/product.ts"]),manifestPath],{cwd:repository});
  await exec(process.execPath,[control,"resume",manifestPath,preparation],{cwd:repository});
  const preservedManifest=JSON.parse(await readFile(manifestPath,"utf8"));
  assert.equal(preservedManifest.status,"preserved","the preserved stack identity remains immutable");
  const resumedManifest=JSON.parse(await readFile(path.join(repository,
    ".swarmforge/campsites/resumed/product-task.json"),"utf8"));
  assert.equal(resumedManifest.status,"resumed");
  assert.equal(resumedManifest.deltaConserved,true);
  assert.equal(await readFile(path.join(repository,"src/product.ts"),"utf8"),"export const product = 2;\n");
  assert.equal(await readFile(path.join(repository,"src/outside.ts"),"utf8"),"export const outside = 2;\n");
  assert.equal(JSON.parse(await readFile(path.join(repository,"mapping.json"),"utf8")).slice,"ready");
  assert.equal(JSON.parse(await readFile(path.join(repository,".swarmforge/campsites/resumed/product-task.json"),
    "utf8")).reissuedTask,"product-task");

  await git(repository,"branch","-f","remainder-work",remainder);
  await git(repository,"switch","-q","remainder-work");
  await rm(manifestPath);
  const mismatchManifestPath=path.join(repository,".swarmforge/campsites/mismatch-campsite.json");
  await mkdir(path.dirname(mismatchManifestPath),{recursive:true});
  await exec(process.execPath,[control,"preserve","mismatch-task",base,preparation,remainder,
    "shell-v1",JSON.stringify(["src/product.ts"]),mismatchManifestPath],{cwd:repository});
  const mismatchManifest=JSON.parse(await readFile(mismatchManifestPath,"utf8"));
  mismatchManifest.remainder.changeSetDigest="0".repeat(64);
  await writeFile(mismatchManifestPath,`${JSON.stringify(mismatchManifest,null,2)}\n`);
  await assert.rejects(exec(process.execPath,[control,"resume",mismatchManifestPath,preparation],
    {cwd:repository}),/complete.*delta|change-set|modified/i);
  assert.equal(await git(repository,"rev-parse","HEAD"),remainder,
    "a failed full-delta check restores the preserved stack head");
  assert.equal(await git(repository,"branch","--show-current"),"remainder-work",
    "a failed full-delta check restores the caller's checked-out branch");
  assert.equal(await readFile(path.join(repository,"src/outside.ts"),"utf8"),"export const outside = 2;\n");

  const pipelineConfig=path.join(repository,".swarmforge/campsites/pipeline-input.json");
  const reviewedAt="2026-08-18T00:00:00.000Z";
  await writeFile(pipelineConfig,`${JSON.stringify({
    assessment:{task:"automatic-product-task",candidate:remainder,
      causalPaths:["src/outside.ts","src/product.ts","src/outside.ts"]},
    dispositions:[
      {task:"automatic-product-task",path:"src/product.ts",boundary:"shell",generation:"shell-v1",
        result:"slice",consumers:["shell"],reviewedBy:"architect",reviewedAt},
      {task:"automatic-product-task",path:"src/outside.ts",boundary:"shell",generation:"shell-v1",
        result:"parent-fallback",failedPremise:"no stable narrower observation",
        consumers:["shell"],reviewedBy:"architect",reviewedAt},
    ],
    manifest:{splitBase:base,prerequisiteCommit:preparation,remainderHead:remainder,
      boundaryGeneration:"shell-v1",routing:{from:"qa",to:"coder",priority:"00"}},
    preparation:{id:"prepare-automatic-product-task",from:"coder",to:"refactorer",
      task:"verification-slice-automatic-product-task"},
  },null,2)}\n`);
  const firstPipeline=JSON.parse((await exec(process.execPath,[control,"prepare",pipelineConfig],
    {cwd:repository})).stdout);
  const secondPipeline=JSON.parse((await exec(process.execPath,[control,"prepare",pipelineConfig],
    {cwd:repository})).stdout);
  assert.equal(secondPipeline.reused,true,"a later process reuses the reviewed task/path generation");
  assert.equal(firstPipeline.preparationHandoff,secondPipeline.preparationHandoff);
  assert.equal((await readdir(path.join(repository,".swarmforge/handoffs/outbox"))).length,1,
    "the same disposition cannot route the same preparation twice");
  const automaticManifest=path.join(repository,
    ".swarmforge/campsites/preserved/automatic-product-task.json");
  await assert.rejects(exec(process.execPath,[control,"resume",automaticManifest,base],{cwd:repository}),
    /does not contain.*prerequisite/i);
  await exec(process.execPath,[control,"resume",automaticManifest,preparation],{cwd:repository});
  const reissued=await readdir(path.join(repository,".swarmforge/handoffs/inbox/new"));
  assert.equal(reissued.length,1);
  const reissuedText=await readFile(path.join(repository,".swarmforge/handoffs/inbox/new",reissued[0]),"utf8");
  assert.match(reissuedText,/task: automatic-product-task/u);
  assert.match(reissuedText,new RegExp(`base: ${preparation}`,"u"));
} finally { await rm(repository,{recursive:true,force:true}); }
console.log("Stacked campsite control contracts passed.");
