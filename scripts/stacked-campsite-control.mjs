#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { contributionDigest, createRemainderManifest, resumeRemainder } from "./campsite-artifacts.mjs";
import { prepareCampsite, resumeOntoQa, routeCampsiteReadiness,
  triggerQaIntegrations } from "./campsite-git-runtime.mjs";
import { atomicWrite, persistResumption } from "./campsite-store.mjs";

export { aggregateCampsiteAssessment, campsiteGenerationId, contributionDigest,
  createRemainderManifest, deltaDigest,
  dispositionIdentity, recordDisposition, resumeRemainder } from "./campsite-artifacts.mjs";
export { persistCampsitePipeline, persistDispositions } from "./campsite-store.mjs";
export { prepareCampsite, routeCampsiteReadiness } from "./campsite-git-runtime.mjs";

const exec=promisify(execFile);
async function git(root,...args) {
  return (await exec("git",args,{cwd:root,encoding:"utf8",maxBuffer:16*1024*1024})).stdout.trim();
}

async function preserve(root,rest) {
  const [task,splitBase,prerequisiteCommit,remainderHead,boundaryGeneration,
    causalJson,routingJson,output]=rest;
  const causalPaths=JSON.parse(causalJson);
  const [remainderTree,commits,changeSet,delta]=await Promise.all([
    git(root,"rev-parse",`${remainderHead}^{tree}`),
    git(root,"rev-list","--reverse",`${splitBase}..${remainderHead}`),
    git(root,"diff","--binary","--unified=0",splitBase,remainderHead),
    git(root,"diff","--binary","--unified=0",splitBase,remainderHead,"--",...causalPaths),
  ]);
  const manifest=createRemainderManifest({task,splitBase:await git(root,"rev-parse",splitBase),
    prerequisiteCommit:await git(root,"rev-parse",prerequisiteCommit),
    remainderHead:await git(root,"rev-parse",remainderHead),remainderTree,
    orderedCommits:commits.split(/\n/u).filter(Boolean),changeSetDigest:contributionDigest(changeSet),
    causalPaths,boundaryGeneration,expectedPostRebaseDelta:contributionDigest(delta),
    routing:JSON.parse(routingJson)});
  await atomicWrite(path.resolve(output),`${JSON.stringify(manifest,null,2)}\n`,{exclusive:true});
  console.log(`PRESERVED ${manifest.task} ${manifest.remainder.head}`);
}

async function validateResume(root,rest) {
  const manifest=JSON.parse(await readFile(path.resolve(rest[0]),"utf8"));
  const result=resumeRemainder(manifest,{newQaHead:rest[1],observedPostRebaseDelta:rest[2],
    observedChangeSetDigest:rest[3],resumedHead:rest[4]});
  await persistResumption(root,result);
  console.log(`REISSUE ${result.reissuedTask} ${result.resumedHead}`);
}

async function cli(args) {
  const [command,...rest]=args,root=process.cwd();
  if (command==="preserve") return preserve(root,rest);
  if (command==="resume") {
    const result=await resumeOntoQa(root,rest[0],await git(root,"rev-parse",rest[1]));
    console.log(`REISSUE ${result.reissuedTask} ${result.resumedHead}`); return;
  }
  if (command==="validate-resume") return validateResume(root,rest);
  if (command==="prepare") {
    console.log(JSON.stringify(await prepareCampsite(root,
      JSON.parse(await readFile(path.resolve(rest[0]),"utf8"))))); return;
  }
  if (command==="qa-trigger") {
    const results=await triggerQaIntegrations(root);
    console.log(JSON.stringify({status:"ok",triggered:results.map(({task,resumedHead})=>({task,resumedHead}))}));
    return;
  }
  throw new Error("Use: stacked-campsite-control.mjs prepare <config> | preserve <task> <split-base> <prerequisite> <remainder-head> <generation> <causal-paths-json> <routing-json> <manifest> | resume <manifest> <new-qa> | qa-trigger | validate-resume <manifest> <qa-head> <causal-delta> <complete-delta> <resumed-head>");
}

if (process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  cli(process.argv.slice(2)).catch((error)=>{console.error(error.message);process.exitCode=1;});
}
