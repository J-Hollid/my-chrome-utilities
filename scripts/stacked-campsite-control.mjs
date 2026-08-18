#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { link, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
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

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function bindDigest(value) {
  const bound={...value}; delete bound.digest;
  return {...bound,digest:digest(bound)};
}

function validateDigest(value,label) {
  const bound={...value}; delete bound.digest;
  if (!sha64.test(value.digest??"")||value.digest!==digest(bound)) throw new Error(`${label} is modified`);
  return value;
}

async function atomicWrite(target,content,{exclusive=false}={}) {
  await mkdir(path.dirname(target),{recursive:true});
  const stage=path.join(path.dirname(target),`.${path.basename(target)}.${randomUUID()}.tmp`);
  await writeFile(stage,content,{flag:"wx"});
  if (!exclusive) { await rename(stage,target); return; }
  try { await link(stage,target); }
  catch (error) {
    await rm(stage,{force:true});
    if (error.code==="EEXIST") throw new Error(`Immutable campsite artifact already exists: ${target}`);
    throw error;
  }
  await rm(stage,{force:true});
}

async function immutableWrite(target,content) {
  try { await atomicWrite(target,content,{exclusive:true}); return true; }
  catch (error) {
    if (!/already exists/u.test(error.message)) throw error;
    if (await readFile(target,"utf8")!==content) throw new Error(`Immutable campsite artifact conflicts: ${target}`);
    return false;
  }
}

export function aggregateCampsiteAssessment({task,candidate,causalPaths}) {
  if (!stable.test(task) || !sha40.test(candidate)) throw new Error("Campsite assessment identity is invalid");
  const paths=[...new Set(causalPaths)].sort();
  if (!paths.length || paths.some((value)=>!value || path.isAbsolute(value) || value.includes(".."))) {
    throw new Error("Campsite assessment requires canonical causal paths");
  }
  return bindDigest({version:1,task,candidate,causalPaths:paths,assessedTogether:true});
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
  return bindDigest({version:1,task:input.task,splitBase:input.splitBase,
    prerequisite:{commit:input.prerequisiteCommit},
    remainder:{task:input.task,head:input.remainderHead,tree:input.remainderTree,
      orderedCommits:[...input.orderedCommits],changeSetDigest:input.changeSetDigest},
    causalPaths:[...new Set(input.causalPaths)].sort(),boundaryGeneration:input.boundaryGeneration,
    expectedPostRebaseDelta:input.expectedPostRebaseDelta,status:"preserved",
    routing:input.routing});
}

export function resumeRemainder(manifest,{newQaHead,observedPostRebaseDelta,
  observedChangeSetDigest,resumedHead}) {
  validateDigest(manifest,"Remainder manifest");
  requireSha(newQaHead,sha40,"new QA head"); requireSha(resumedHead,sha40,"resumed head");
  if (observedPostRebaseDelta!==manifest.expectedPostRebaseDelta) {
    throw new Error("Resumed product delta does not match the preserved remainder");
  }
  if (observedChangeSetDigest!==manifest.remainder.changeSetDigest) {
    throw new Error("Resumed complete change-set delta does not match the preserved remainder");
  }
  const immutable={...manifest}; delete immutable.digest;
  return bindDigest({...immutable,status:"resumed",newQaHead,resumedHead,
    reissuedTask:manifest.task,deltaConserved:true});
}

export function dispositionIdentity(value) {
  return [value.task,value.path,value.boundary,value.generation].join("\u0000");
}

export function recordDisposition(records,value) {
  if (!["slice","seam","integrated-seam","parent-fallback"].includes(value.result)) {
    throw new Error("Disposition result is invalid");
  }
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

function dispositionFile(root,task) {
  return path.join(root,".swarmforge","campsites","dispositions",`${task}.json`);
}

export async function persistDispositions(root,assessment,values) {
  validateDigest(assessment,"Campsite assessment");
  const target=dispositionFile(root,assessment.task);
  let existing={version:1,task:assessment.task,records:[]};
  try { existing=validateDigest(JSON.parse(await readFile(target,"utf8")),"Disposition ledger"); }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  const records=[...existing.records];
  for (const causalPath of assessment.causalPaths) {
    const value=values.find((item)=>item.path===causalPath);
    if (!value || value.task!==assessment.task || !value.reviewedBy || !value.reviewedAt) {
      throw new Error(`Reviewed campsite disposition is missing for ${causalPath}`);
    }
    const prior=records.find((item)=>dispositionIdentity(item)===dispositionIdentity(value));
    if (prior) {
      if (digest(prior)!==digest({...value,consumers:[...new Set(value.consumers??[])].sort()})) {
        throw new Error("Applicable campsite disposition cannot be replaced");
      }
    } else recordDisposition(records,value);
  }
  const ledger=bindDigest({version:1,task:assessment.task,records});
  await atomicWrite(target,`${JSON.stringify(ledger,null,2)}\n`);
  return ledger;
}

function handoffText(headers,body) {
  return `${Object.entries(headers).filter(([,value])=>value!==undefined)
    .map(([key,value])=>`${key}: ${value}`).join("\n")}\n\n${body}\n`;
}

async function routeHandoff(root,state,headers,body) {
  const filename=`00_${headers.id}.handoff`;
  const target=path.join(root,".swarmforge","handoffs",state,filename);
  await immutableWrite(target,handoffText(headers,body));
  return target;
}

export async function persistCampsitePipeline(root,{assessment,dispositions,manifest,preparation}) {
  validateDigest(assessment,"Campsite assessment"); validateDigest(manifest,"Remainder manifest");
  if (![preparation.id,preparation.from,preparation.to,preparation.task].every((value)=>stable.test(value??""))) {
    throw new Error("Preparation handoff identity is invalid");
  }
  if (assessment.task!==manifest.task || digest(assessment.causalPaths)!==digest(manifest.causalPaths)) {
    throw new Error("Assessment and preserved remainder causal paths differ");
  }
  const receiptPath=path.join(root,".swarmforge","campsites","pipelines",
    `${assessment.task}-${assessment.candidate}.json`);
  const normalizedDispositions=dispositions.map((value)=>({...value,
    consumers:[...new Set(value.consumers??[])].sort()}));
  const inputBinding={assessmentDigest:assessment.digest,manifestDigest:manifest.digest,
    dispositionsDigest:digest(normalizedDispositions),preparationDigest:digest(preparation)};
  try {
    const receipt=validateDigest(JSON.parse(await readFile(receiptPath,"utf8")),"Campsite pipeline receipt");
    for (const [key,value] of Object.entries(inputBinding)) {
      if (receipt[key]!==value) throw new Error("Campsite pipeline identity conflicts with its receipt");
    }
    return {...receipt,reused:true};
  } catch (error) { if (error.code!=="ENOENT") throw error; }
  const ledger=await persistDispositions(root,assessment,dispositions);
  const preserved=path.join(root,".swarmforge","campsites","preserved",`${manifest.task}.json`);
  await immutableWrite(preserved,`${JSON.stringify(manifest,null,2)}\n`);
  const assessmentPath=path.join(root,".swarmforge","campsites","assessments",
    `${assessment.task}-${assessment.candidate}.json`);
  await immutableWrite(assessmentPath,`${JSON.stringify(assessment,null,2)}\n`);
  const routed=await routeHandoff(root,"outbox",{
    id:preparation.id,from:preparation.from,to:preparation.to,recipient:preparation.to,
    priority:preparation.priority??"00",type:"task",task:preparation.task,
    commit:manifest.prerequisite.commit,base:manifest.splitBase,
    message:preparation.message??`Prepare campsite boundary for ${manifest.task}`,
    created_at:preparation.createdAt,
  },`Preserved product remainder ${manifest.remainder.head} for stable task ${manifest.task}.`);
  const receipt=bindDigest({version:1,task:assessment.task,candidate:assessment.candidate,
    ...inputBinding,assessment:assessmentPath,ledgerDigest:ledger.digest,preserved,
    preparationHandoff:routed});
  await immutableWrite(receiptPath,`${JSON.stringify(receipt,null,2)}\n`);
  return receipt;
}

async function reissueProductTask(root,result) {
  const routing=result.routing;
  if (!routing) return null;
  return routeHandoff(root,"inbox/new",{
    id:`resume-${result.task}-${result.resumedHead.slice(0,10)}`,from:routing.from,to:routing.to,
    recipient:routing.to,priority:routing.priority??"00",type:"task",task:result.task,
    commit:result.resumedHead,base:result.newQaHead,
    message:`Automatically resumed conserved task ${result.task} after campsite QA integration`,
  },`Delta-conserved remainder resumed from ${result.remainder.head} onto ${result.newQaHead}.`);
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
    await atomicWrite(target,`${JSON.stringify(manifest,null,2)}\n`,{exclusive:true});
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
    let originalBranch="";
    try { originalBranch=await git(root,"symbolic-ref","--quiet","--short","HEAD"); } catch {}
    const newQaHead=await git(root,"rev-parse",newQaRef);
    validateDigest(manifest,"Remainder manifest");
    try { await git(root,"merge-base","--is-ancestor",manifest.prerequisite.commit,newQaHead); }
    catch { throw new Error("New QA head does not contain the immutable campsite prerequisite"); }
    try {
      await git(root,"rebase","--onto",newQaHead,manifest.splitBase,manifest.remainder.head);
      const resumedHead=await git(root,"rev-parse","HEAD");
      const [delta,completeDelta]=await Promise.all([
        git(root,"diff","--binary",newQaHead,resumedHead,"--",...manifest.causalPaths),
        git(root,"diff","--binary",newQaHead,resumedHead),
      ]);
      const result=resumeRemainder(manifest,{newQaHead,observedPostRebaseDelta:deltaDigest(delta),
        observedChangeSetDigest:deltaDigest(completeDelta),resumedHead});
      const resumedDir=path.join(root,".swarmforge","campsites","resumed");
      await mkdir(resumedDir,{recursive:true});
      await atomicWrite(path.join(resumedDir,`${manifest.task}.json`),`${JSON.stringify(result,null,2)}\n`);
      await reissueProductTask(root,result);
      console.log(`REISSUE ${result.reissuedTask} ${result.resumedHead}`); return;
    } catch (error) {
      try { await git(root,"rebase","--abort"); } catch {}
      await git(root,"switch","--detach",manifest.remainder.head);
      if (originalBranch) {
        await git(root,"branch","--force",originalBranch,manifest.remainder.head);
        await git(root,"switch",originalBranch);
      }
      throw error;
    }
  }
  if (command==="validate-resume") {
    const manifest=JSON.parse(await readFile(path.resolve(rest[0]),"utf8"));
    const result=resumeRemainder(manifest,{newQaHead:rest[1],observedPostRebaseDelta:rest[2],
      observedChangeSetDigest:rest[3],resumedHead:rest[4]});
    await atomicWrite(path.join(root,".swarmforge","campsites","resumed",`${result.task}.json`),
      `${JSON.stringify(result,null,2)}\n`);
    await reissueProductTask(root,result);
    console.log(`REISSUE ${result.reissuedTask} ${result.resumedHead}`); return;
  }
  if (command==="prepare") {
    const input=JSON.parse(await readFile(path.resolve(rest[0]),"utf8"));
    const assessment=aggregateCampsiteAssessment(input.assessment);
    const remainderHead=await git(root,"rev-parse",input.manifest.remainderHead);
    const splitBase=await git(root,"rev-parse",input.manifest.splitBase);
    const causalPaths=assessment.causalPaths;
    const [remainderTree,commits,changeSet,delta]=await Promise.all([
      git(root,"rev-parse",`${remainderHead}^{tree}`),git(root,"rev-list","--reverse",`${splitBase}..${remainderHead}`),
      git(root,"diff","--binary",splitBase,remainderHead),
      git(root,"diff","--binary",splitBase,remainderHead,"--",...causalPaths)]);
    const manifest=createRemainderManifest({...input.manifest,task:assessment.task,splitBase,
      prerequisiteCommit:await git(root,"rev-parse",input.manifest.prerequisiteCommit),remainderHead,
      remainderTree,orderedCommits:commits.split(/\n/u).filter(Boolean),changeSetDigest:deltaDigest(changeSet),
      causalPaths,expectedPostRebaseDelta:deltaDigest(delta)});
    const result=await persistCampsitePipeline(root,{assessment,dispositions:input.dispositions,
      manifest,preparation:input.preparation});
    console.log(JSON.stringify(result)); return;
  }
  throw new Error("Use: stacked-campsite-control.mjs prepare <config> | preserve <task> <split-base> <prerequisite> <remainder-head> <generation> <causal-paths-json> <manifest> | resume <manifest> <new-qa> | validate-resume <manifest> <qa-head> <causal-delta> <complete-delta> <resumed-head>");
}

if (process.argv[1] && fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  cli(process.argv.slice(2)).catch((error)=>{ console.error(error.message); process.exitCode=1; });
}
