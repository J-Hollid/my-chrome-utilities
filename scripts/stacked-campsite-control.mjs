#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const sha40=/^[0-9a-f]{40}$/u, sha64=/^[0-9a-f]{64}$/u;
const stable=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;
const exec=promisify(execFile);

async function git(root,...args) {
  return (await exec("git",args,{cwd:root,encoding:"utf8",maxBuffer:16*1024*1024})).stdout.trim();
}

function requireSha(value,pattern,label) {
  if (!pattern.test(value??"")) throw new Error(`${label} must be canonical`);
}

export function aggregateCampsiteAssessment({task,candidate,causalPaths}) {
  if (!stable.test(task) || !sha40.test(candidate)) throw new Error("Campsite assessment identity is invalid");
  const paths=[...new Set(causalPaths)].sort();
  if (!paths.length || paths.some((value)=>!value || path.isAbsolute(value) || value.includes(".."))) {
    throw new Error("Campsite assessment requires canonical causal paths");
  }
  return {version:1,task,candidate,causalPaths:paths,assessedTogether:true};
}

export function createRemainderManifest(input) {
  for (const [key,value] of [["splitBase",input.splitBase],["prerequisiteCommit",input.prerequisiteCommit],
    ["remainderHead",input.remainderHead],["remainderTree",input.remainderTree]]) requireSha(value,sha40,key);
  for (const commit of input.orderedCommits) requireSha(commit,sha40,"ordered commit");
  requireSha(input.changeSetDigest,sha64,"change-set digest");
  requireSha(input.expectedPostRebaseDelta,sha64,"expected post-rebase delta");
  if (!stable.test(input.task) || !stable.test(input.boundaryGeneration)) {
    throw new Error("Remainder task and boundary generation must be stable");
  }
  return {version:1,task:input.task,splitBase:input.splitBase,
    prerequisite:{commit:input.prerequisiteCommit},
    remainder:{task:input.task,head:input.remainderHead,tree:input.remainderTree,
      orderedCommits:[...input.orderedCommits],changeSetDigest:input.changeSetDigest},
    causalPaths:[...new Set(input.causalPaths)].sort(),boundaryGeneration:input.boundaryGeneration,
    expectedPostRebaseDelta:input.expectedPostRebaseDelta,status:"preserved"};
}

export function resumeRemainder(manifest,{newQaHead,observedPostRebaseDelta,resumedHead}) {
  requireSha(newQaHead,sha40,"new QA head"); requireSha(resumedHead,sha40,"resumed head");
  if (observedPostRebaseDelta!==manifest.expectedPostRebaseDelta) {
    throw new Error("Resumed product delta does not match the preserved remainder");
  }
  return {...manifest,status:"resumed",newQaHead,resumedHead,
    reissuedTask:manifest.task,deltaConserved:true};
}

export function dispositionIdentity(value) {
  return [value.task,value.path,value.boundary,value.generation].join("\u0000");
}

export function recordDisposition(records,value) {
  if (!["slice","parent-fallback"].includes(value.result)) throw new Error("Disposition result is invalid");
  if (value.result==="parent-fallback" && (!value.failedPremise || !value.consumers?.length)) {
    throw new Error("Parent fallback requires failed proof premise and preserved consumers");
  }
  if (records.some((item)=>dispositionIdentity(item)===dispositionIdentity(value))) {
    throw new Error("Task/path generation already has a disposition");
  }
  const record={...value,consumers:[...new Set(value.consumers??[])].sort()};
  records.push(record); return record;
}

export function deltaDigest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function cli(args) {
  const [command,...rest]=args;
  const root=process.cwd();
  if (command==="preserve") {
    const [task,splitBase,prerequisiteCommit,remainderHead,boundaryGeneration,causalJson,output]=rest;
    const causalPaths=JSON.parse(causalJson);
    const [remainderTree,commits,changeSet,delta]=await Promise.all([
      git(root,"rev-parse",`${remainderHead}^{tree}`),
      git(root,"rev-list","--reverse",`${splitBase}..${remainderHead}`),
      git(root,"diff","--binary",splitBase,remainderHead),
      git(root,"diff","--binary",splitBase,remainderHead,"--",...causalPaths),
    ]);
    const manifest=createRemainderManifest({task,splitBase:await git(root,"rev-parse",splitBase),
      prerequisiteCommit:await git(root,"rev-parse",prerequisiteCommit),
      remainderHead:await git(root,"rev-parse",remainderHead),remainderTree,
      orderedCommits:commits.split(/\n/u).filter(Boolean),changeSetDigest:deltaDigest(changeSet),
      causalPaths,boundaryGeneration,expectedPostRebaseDelta:deltaDigest(delta)});
    const target=path.resolve(output);
    await mkdir(path.dirname(target),{recursive:true});
    await writeFile(target,`${JSON.stringify(manifest,null,2)}\n`,{flag:"wx"});
    console.log(`PRESERVED ${manifest.task} ${manifest.remainder.head}`); return;
  }
  if (command==="resume") {
    const [manifestPath,newQaRef]=rest,manifest=JSON.parse(await readFile(path.resolve(manifestPath),"utf8"));
    const manifestRelative=path.relative(root,path.resolve(manifestPath));
    const dirty=(await git(root,"status","--porcelain")).split(/\n/u).filter(Boolean)
      .map((line)=>line.slice(3)).filter((item)=>item!==manifestRelative&&!item.startsWith(".swarmforge/"));
    if (dirty.length) throw new Error("Automatic remainder resume requires a clean product worktree");
    const head=await git(root,"rev-parse","HEAD");
    if (head!==manifest.remainder.head) throw new Error("Current HEAD is not the preserved remainder head");
    const newQaHead=await git(root,"rev-parse",newQaRef);
    await git(root,"rebase","--onto",newQaHead,manifest.splitBase,manifest.remainder.head);
    const resumedHead=await git(root,"rev-parse","HEAD");
    const delta=await git(root,"diff","--binary",newQaHead,resumedHead,"--",...manifest.causalPaths);
    const result=resumeRemainder(manifest,{newQaHead,observedPostRebaseDelta:deltaDigest(delta),resumedHead});
    const target=path.resolve(manifestPath);
    await writeFile(target,`${JSON.stringify(result,null,2)}\n`);
    const resumedDir=path.join(root,".swarmforge","campsites","resumed");
    await mkdir(resumedDir,{recursive:true});
    await writeFile(path.join(resumedDir,`${manifest.task}.json`),`${JSON.stringify(result,null,2)}\n`);
    console.log(`REISSUE ${result.reissuedTask} ${result.resumedHead}`); return;
  }
  if (command==="validate-resume") {
    const manifest=JSON.parse(await readFile(path.resolve(rest[0]),"utf8"));
    const result=resumeRemainder(manifest,{newQaHead:rest[1],observedPostRebaseDelta:rest[2],resumedHead:rest[3]});
    await writeFile(path.resolve(rest[0]),`${JSON.stringify(result,null,2)}\n`);
    console.log(`REISSUE ${result.reissuedTask} ${result.resumedHead}`); return;
  }
  throw new Error("Use: stacked-campsite-control.mjs preserve <task> <split-base> <prerequisite> <remainder-head> <generation> <causal-paths-json> <manifest> | resume <manifest> <new-qa> | validate-resume <manifest> <qa-head> <delta> <resumed-head>");
}

if (process.argv[1] && fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  cli(process.argv.slice(2)).catch((error)=>{ console.error(error.message); process.exitCode=1; });
}
