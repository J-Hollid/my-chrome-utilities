import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { aggregateCampsiteAssessment, bindDigest, contributionDigest, createRemainderManifest,
  resumeRemainder, validateDigest } from "./campsite-artifacts.mjs";
import { atomicWrite, persistCampsitePipeline, persistResumption,
  recoverResumptionTransactions } from "./campsite-store.mjs";

const exec=promisify(execFile);
async function git(root,...args) {
  return (await exec("git",args,{cwd:root,encoding:"utf8",maxBuffer:16*1024*1024})).stdout.trim();
}

export async function prepareCampsite(root,input) {
  const assessment=aggregateCampsiteAssessment(input.assessment);
  const remainderHead=await git(root,"rev-parse",input.manifest.remainderHead);
  const splitBase=await git(root,"rev-parse",input.manifest.splitBase);
  const [remainderTree,commits,changeSet,delta]=await Promise.all([
    git(root,"rev-parse",`${remainderHead}^{tree}`),
    git(root,"rev-list","--reverse",`${splitBase}..${remainderHead}`),
    git(root,"diff","--binary","--unified=0",splitBase,remainderHead),
    git(root,"diff","--binary","--unified=0",splitBase,remainderHead,"--",...assessment.causalPaths),
  ]);
  const manifest=createRemainderManifest({...input.manifest,task:assessment.task,
    candidate:assessment.candidate,splitBase,
    prerequisiteCommit:await git(root,"rev-parse",input.manifest.prerequisiteCommit),remainderHead,
    remainderTree,orderedCommits:commits.split(/\n/u).filter(Boolean),
    changeSetDigest:contributionDigest(changeSet),causalPaths:assessment.causalPaths,
    dispositions:input.dispositions,
    expectedPostRebaseDelta:contributionDigest(delta)});
  return persistCampsitePipeline(root,{assessment,dispositions:input.dispositions,
    manifest,preparation:input.preparation});
}

export async function routeCampsiteReadiness(root,readiness,input) {
  const requiring=["granularity-assessment-required","coarse-within-pack","coarse-boundary"];
  if (!requiring.includes(readiness.classification)) {
    throw new Error("Readiness does not require a campsite preparation");
  }
  const causalPaths=(readiness.expansionCauses??[]).filter(({credibleBoundary=true})=>credibleBoundary)
    .map(({path:causalPath})=>causalPath);
  const union=[...new Set(causalPaths.length?causalPaths:input.assessment?.causalPaths??[])].sort();
  if (!union.length) throw new Error("Campsite readiness has no causal paths to assess");
  return prepareCampsite(root,{...input,assessment:{task:readiness.task,
    candidate:await git(root,"rev-parse","HEAD"),causalPaths:union}});
}

async function requirePrerequisite(root,manifest,newQaHead) {
  validateDigest(manifest,"Remainder manifest");
  try { await git(root,"merge-base","--is-ancestor",manifest.prerequisite.commit,newQaHead); }
  catch { throw new Error("New QA head does not contain the immutable campsite prerequisite"); }
}

async function restoreRemainder(root,manifest,originalBranch) {
  try { await git(root,"rebase","--abort"); } catch {}
  await git(root,"switch","--detach",manifest.remainder.head);
  if (originalBranch) {
    await git(root,"branch","--force",originalBranch,manifest.remainder.head);
    await git(root,"switch",originalBranch);
  }
}

const generationStem=(manifest)=>`${manifest.task}-${manifest.generationId}`;
const resumedPath=(root,manifest)=>path.join(root,".swarmforge","campsites","resumed",
  `${generationStem(manifest)}.json`);
const attemptPath=(root,manifest)=>path.join(root,".swarmforge","campsites","resume-attempts",
  `${generationStem(manifest)}.json`);

async function readJsonIfPresent(target,label) {
  try { return validateDigest(JSON.parse(await readFile(target,"utf8")),label); }
  catch (error) { if (error.code==="ENOENT") return null; throw error; }
}

async function currentBranch(root) {
  try { return await git(root,"symbolic-ref","--quiet","--short","HEAD"); }
  catch { return ""; }
}

async function contributionAt(root,manifest,newQaHead,resumedHead) {
  const [causal,complete]=await Promise.all([
    git(root,"diff","--binary","--unified=0",newQaHead,resumedHead,"--",...manifest.causalPaths),
    git(root,"diff","--binary","--unified=0",newQaHead,resumedHead),
  ]);
  return resumeRemainder(manifest,{newQaHead,
    observedPostRebaseDelta:contributionDigest(causal),
    observedChangeSetDigest:contributionDigest(complete),resumedHead});
}

async function rebaseStatePresent(root) {
  const gitDir=await git(root,"rev-parse","--git-dir");
  try { await readFile(path.resolve(root,gitDir,"rebase-merge","head-name")); return true; }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  try { await readFile(path.resolve(root,gitDir,"rebase-apply","head-name")); return true; }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  return false;
}

async function runRebase(root,manifest,newQaHead,strategy) {
  const unionReverse=strategy==="union-reverse";
  const options=strategy&&!unionReverse?[`--strategy-option=${strategy}`]:[];
  try {
    await git(root,"rebase",...options,"--onto",newQaHead,manifest.splitBase,manifest.remainder.head);
  } catch (error) {
    if (!await resolveUnionConflicts(root,manifest.remainder.orderedCommits.length,unionReverse)) throw error;
  }
}

async function unionFile(root,target,reverse) {
  const directory=path.join(root,".swarmforge","campsites","conflict-tmp",randomUUID());
  await mkdir(directory,{recursive:true});
  const files={ours:path.join(directory,"ours"),base:path.join(directory,"base"),
    theirs:path.join(directory,"theirs")};
  try {
    const [ours,base,theirs]=await Promise.all([":2",":1",":3"].map(async(stage)=>(
      await exec("git",["show",`${stage}:${target}`],{cwd:root,encoding:"utf8",
        maxBuffer:16*1024*1024})).stdout));
    await Promise.all([writeFile(files.ours,ours),writeFile(files.base,base),
      writeFile(files.theirs,theirs)]);
    const sides=reverse?[files.theirs,files.base,files.ours]:[files.ours,files.base,files.theirs];
    let merged;
    try { merged=(await exec("git",["merge-file","-p","--union",...sides],
      {cwd:root,encoding:"utf8",maxBuffer:16*1024*1024})).stdout; }
    catch (error) {
      if (![1,2].includes(error.code)||typeof error.stdout!=="string") throw error;
      merged=error.stdout;
    }
    await writeFile(path.join(root,target),merged);
    await git(root,"add","--",target);
  } finally { await rm(directory,{recursive:true,force:true}); }
}

async function resolveUnionConflicts(root,commitCount,reverse) {
  for (let step=0;step<=commitCount;step+=1) {
    const conflicts=(await git(root,"diff","--name-only","--diff-filter=U")).split(/\n/u).filter(Boolean);
    if (!conflicts.length) return !await rebaseStatePresent(root);
    try {
      for (const target of conflicts) await unionFile(root,target,reverse);
      await exec("git",["rebase","--continue"],{cwd:root,encoding:"utf8",
        maxBuffer:16*1024*1024,env:{...process.env,GIT_EDITOR:"true"}});
      if (!await rebaseStatePresent(root)) return true;
    } catch { return false; }
  }
  return false;
}

async function establishAttempt(root,manifest,newQaHead,originalBranch) {
  const target=attemptPath(root,manifest);
  const existing=await readJsonIfPresent(target,"Campsite resume attempt");
  if (existing) {
    const mismatched=existing.task!==manifest.task||existing.generationId!==manifest.generationId||
      existing.newQaHead!==newQaHead||existing.remainderHead!==manifest.remainder.head;
    if (mismatched) {
      throw new Error("Campsite resume attempt conflicts with its durable generation");
    }
    return existing;
  }
  const attempt=bindDigest({version:1,task:manifest.task,generationId:manifest.generationId,
    newQaHead,remainderHead:manifest.remainder.head,originalBranch});
  await atomicWrite(target,`${JSON.stringify(attempt,null,2)}\n`,{exclusive:true});
  return attempt;
}

async function requireCleanResume(root,manifestPath,manifest,newQaHead,requireCurrentQa) {
  const manifestRelative=path.relative(root,path.resolve(manifestPath));
  const dirty=(await git(root,"status","--porcelain")).split(/\n/u).filter(Boolean)
    .map((line)=>line.slice(3)).filter((item)=>item!==manifestRelative&&!item.startsWith(".swarmforge/"));
  if (dirty.length) throw new Error("Automatic remainder resume requires a clean product worktree");
  await requirePrerequisite(root,manifest,newQaHead);
  if (requireCurrentQa&&await git(root,"rev-parse","refs/heads/qa")!==newQaHead) {
    throw new Error("Campsite resumption requires the exact current QA head");
  }
}

async function recoverMovedResume(root,manifest,newQaHead,attempt) {
  const head=await git(root,"rev-parse","HEAD");
  if (head===manifest.remainder.head) return {result:null,lastError:null};
  try { return {result:await contributionAt(root,manifest,newQaHead,head),lastError:null}; }
  catch (error) {
    await restoreRemainder(root,manifest,attempt.originalBranch);
    return {result:null,lastError:error};
  }
}

async function tryRebaseStrategy(root,manifest,newQaHead,strategy,faultAt,attempt) {
  try {
    await runRebase(root,manifest,newQaHead,strategy);
    const head=await git(root,"rev-parse","HEAD");
    if (faultAt==="resume-git-moved") throw new Error("Injected campsite crash at resume-git-moved");
    return {result:await contributionAt(root,manifest,newQaHead,head),error:null};
  } catch (error) {
    if (/Injected campsite crash/u.test(error.message)) throw error;
    await restoreRemainder(root,manifest,attempt.originalBranch);
    return {result:null,error};
  }
}

async function reapplyRemainder(root,manifest,newQaHead,attempt,faultAt,initial) {
  let {result,lastError}=initial;
  for (const strategy of [null,"union-reverse","theirs","ours"]) {
    if (result) break;
    const outcome=await tryRebaseStrategy(root,manifest,newQaHead,strategy,faultAt,attempt);
    result=outcome.result; lastError=outcome.error??lastError;
  }
  if (!result) throw lastError??new Error("Campsite remainder could not be reapplied safely");
  return result;
}

async function persistVerifiedResume(root,manifest,newQaHead,result,attempt,requireCurrentQa,faultAt) {
  const currentQaHead=requireCurrentQa?await git(root,"rev-parse","refs/heads/qa"):newQaHead;
  if (currentQaHead!==newQaHead) {
    await restoreRemainder(root,manifest,attempt.originalBranch);
    throw new Error("QA advanced during campsite resumption");
  }
  await persistResumption(root,result,{faultAt});
  await rm(attemptPath(root,manifest),{force:true});
  return result;
}

export async function resumeOntoQa(root,manifestPath,newQaHead,{requireCurrentQa=false,faultAt}={}) {
  const manifest=JSON.parse(await readFile(path.resolve(manifestPath),"utf8"));
  validateDigest(manifest,"Remainder manifest");
  await recoverResumptionTransactions(root);
  const completed=await readJsonIfPresent(resumedPath(root,manifest),"Resumed remainder");
  if (completed) {
    await rm(attemptPath(root,manifest),{force:true});
    return completed;
  }
  await requireCleanResume(root,manifestPath,manifest,newQaHead,requireCurrentQa);
  const priorAttempt=await readJsonIfPresent(attemptPath(root,manifest),"Campsite resume attempt");
  const head=await git(root,"rev-parse","HEAD");
  if (!priorAttempt&&head!==manifest.remainder.head) {
    throw new Error("First campsite resume attempt requires the exact preserved remainder HEAD");
  }
  const originalBranch=await currentBranch(root);
  const attempt=await establishAttempt(root,manifest,newQaHead,originalBranch);
  if (await rebaseStatePresent(root)) await restoreRemainder(root,manifest,attempt.originalBranch);
  const initial=await recoverMovedResume(root,manifest,newQaHead,attempt);
  const result=await reapplyRemainder(root,manifest,newQaHead,attempt,faultAt,initial);
  return persistVerifiedResume(root,manifest,newQaHead,result,attempt,requireCurrentQa,faultAt);
}

async function manifestReadyForQa(root,manifest,qaHead) {
  try { await readFile(resumedPath(root,manifest)); return false; }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  try { await git(root,"merge-base","--is-ancestor",manifest.prerequisite.commit,qaHead); return true; }
  catch { return false; }
}

async function triggerManifest(root,preservedDir,name,qaHead) {
  const manifestPath=path.join(preservedDir,name);
  const manifest=JSON.parse(await readFile(manifestPath,"utf8"));
  if (!await manifestReadyForQa(root,manifest,qaHead)) return null;
  return resumeOntoQa(root,manifestPath,qaHead,{requireCurrentQa:true});
}

export async function triggerQaIntegrations(root) {
  await recoverResumptionTransactions(root);
  const preservedDir=path.join(root,".swarmforge","campsites","preserved");
  let files=[];
  try { files=(await readdir(preservedDir)).filter((name)=>name.endsWith(".json")).sort(); }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  if (!files.length) return [];
  const qaHead=await git(root,"rev-parse","refs/heads/qa"),triggered=[];
  for (const name of files) {
    const result=await triggerManifest(root,preservedDir,name,qaHead);
    if (result) triggered.push(result);
  }
  return triggered;
}
