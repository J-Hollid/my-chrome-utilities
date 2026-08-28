#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { contributionDigest, createRemainderManifest, resumeRemainder } from "./campsite-artifacts.mjs";
import { prepareCampsite, quarantinePrematureResumption,
  recordCampsitePrerequisiteSatisfaction, resumeOntoQa, routeCampsiteReadiness,
  triggerQaIntegrations } from "./campsite-git-runtime.mjs";
import { atomicWrite } from "./campsite-store.mjs";
import { granularityPortfolioFreezeStatus, listGranularityPortfolio,
  recordGranularityObservation, recordGranularityPortfolioDisposition,
  recordGranularityQaProof } from "./campsite-granularity-observations.mjs";

export { aggregateCampsiteAssessment, campsiteGenerationId, contributionDigest,
  createPrerequisiteSatisfaction, createRemainderManifest, createResumptionQuarantine, deltaDigest,
  dispositionIdentity, recordDisposition, resumeRemainder } from "./campsite-artifacts.mjs";
export { persistCampsitePipeline, persistDispositions, persistPrerequisiteSatisfaction,
  persistResumptionQuarantine, prerequisiteSatisfactionForQa,
  resumptionQuarantine } from "./campsite-store.mjs";
export { prepareCampsite, quarantinePrematureResumption,
  recordCampsitePrerequisiteSatisfaction, routeCampsiteReadiness } from "./campsite-git-runtime.mjs";
export { granularityObservationIdentity, granularityPortfolioFreezeStatus,
  listGranularityPortfolio, recordGranularityObservation,
  recordGranularityPortfolioDisposition, recordGranularityQaProof,
  validateGranularityJudgment } from "./campsite-granularity-observations.mjs";

const exec=promisify(execFile);
async function git(root,...args) {
  return (await exec("git",args,{cwd:root,encoding:"utf8",maxBuffer:16*1024*1024})).stdout.trim();
}

async function preserve(root,rest) {
  const [task,splitBase,prerequisiteCommit,prerequisiteTask,remainderHead,boundaryGeneration,
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
    prerequisiteTask,
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
  console.log(`VALID ${result.reissuedTask} ${result.resumedHead}`);
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
  if (command==="record-satisfaction") {
    const result=await recordCampsitePrerequisiteSatisfaction(root,rest[0],
      JSON.parse(await readFile(path.resolve(rest[1]),"utf8")));
    console.log(JSON.stringify(result)); return;
  }
  if (command==="quarantine-resumption") {
    const result=await quarantinePrematureResumption(root,rest[0],
      JSON.parse(await readFile(path.resolve(rest[1]),"utf8")));
    console.log(JSON.stringify(result)); return;
  }
  if (command==="judge-readiness") {
    const readiness=JSON.parse(await readFile(path.resolve(rest[0]),"utf8"));
    const input=JSON.parse(await readFile(path.resolve(rest[1]),"utf8"));
    console.log(JSON.stringify(await routeCampsiteReadiness(root,readiness,input))); return;
  }
  if (command==="observe") {
    console.log(JSON.stringify(await recordGranularityObservation(root,
      JSON.parse(await readFile(path.resolve(rest[0]),"utf8"))))); return;
  }
  if (command==="portfolio") {
    console.log(JSON.stringify(await listGranularityPortfolio(root))); return;
  }
  if (command==="dispose") {
    console.log(JSON.stringify(await recordGranularityPortfolioDisposition(root,
      JSON.parse(await readFile(path.resolve(rest[0]),"utf8"))))); return;
  }
  if (command==="record-hardening") {
    console.log(JSON.stringify(await recordGranularityQaProof(root,
      JSON.parse(await readFile(path.resolve(rest[0]),"utf8"))))); return;
  }
  if (command==="assert-freeze") {
    const status=await granularityPortfolioFreezeStatus(root,
      {promotionIdentity:rest[0],qaHead:rest[1]});
    if (!status.ready) throw new Error(`Granularity portfolio blocks release freeze: ${status.blocking.join(", ")}`);
    console.log(JSON.stringify(status)); return;
  }
  throw new Error("Use: stacked-campsite-control.mjs prepare <config> | judge-readiness <readiness> <config> | observe <observation> | portfolio | dispose <disposition> | record-hardening <proof> | assert-freeze <promotion> <qa-head> | preserve <task> <split-base> <prerequisite-specification> <prerequisite-task> <remainder-head> <generation> <causal-paths-json> <routing-json> <manifest> | record-satisfaction <manifest> <input> | quarantine-resumption <manifest> <input> | resume <manifest> <new-qa> | qa-trigger | validate-resume <manifest> <qa-head> <causal-delta> <complete-delta> <resumed-head>");
}

if (process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  cli(process.argv.slice(2)).catch((error)=>{console.error(error.message);process.exitCode=1;});
}
