import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { aggregateCampsiteAssessment, createRemainderManifest, deltaDigest,
  resumeRemainder, validateDigest } from "./campsite-artifacts.mjs";
import { atomicWrite, persistCampsitePipeline, reissueProductTask } from "./campsite-store.mjs";

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
    git(root,"diff","--binary",splitBase,remainderHead),
    git(root,"diff","--binary",splitBase,remainderHead,"--",...assessment.causalPaths),
  ]);
  const manifest=createRemainderManifest({...input.manifest,task:assessment.task,splitBase,
    prerequisiteCommit:await git(root,"rev-parse",input.manifest.prerequisiteCommit),remainderHead,
    remainderTree,orderedCommits:commits.split(/\n/u).filter(Boolean),changeSetDigest:deltaDigest(changeSet),
    causalPaths:assessment.causalPaths,expectedPostRebaseDelta:deltaDigest(delta)});
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

export async function resumeOntoQa(root,manifestPath,newQaHead,{requireCurrentQa=false}={}) {
  const manifest=JSON.parse(await readFile(path.resolve(manifestPath),"utf8"));
  const manifestRelative=path.relative(root,path.resolve(manifestPath));
  const dirty=(await git(root,"status","--porcelain")).split(/\n/u).filter(Boolean)
    .map((line)=>line.slice(3)).filter((item)=>item!==manifestRelative&&!item.startsWith(".swarmforge/"));
  if (dirty.length) throw new Error("Automatic remainder resume requires a clean product worktree");
  if (await git(root,"rev-parse","HEAD")!==manifest.remainder.head) {
    throw new Error("Current HEAD is not the preserved remainder head");
  }
  await requirePrerequisite(root,manifest,newQaHead);
  if (requireCurrentQa&&await git(root,"rev-parse","refs/heads/qa")!==newQaHead) {
    throw new Error("Campsite resumption requires the exact current QA head");
  }
  let originalBranch="";
  try { originalBranch=await git(root,"symbolic-ref","--quiet","--short","HEAD"); } catch {}
  try {
    await git(root,"rebase","--onto",newQaHead,manifest.splitBase,manifest.remainder.head);
    const resumedHead=await git(root,"rev-parse","HEAD");
    const [delta,completeDelta,currentQaHead]=await Promise.all([
      git(root,"diff","--binary",newQaHead,resumedHead,"--",...manifest.causalPaths),
      git(root,"diff","--binary",newQaHead,resumedHead),
      requireCurrentQa?git(root,"rev-parse","refs/heads/qa"):Promise.resolve(newQaHead),
    ]);
    if (currentQaHead!==newQaHead) throw new Error("QA advanced during campsite resumption");
    const result=resumeRemainder(manifest,{newQaHead,observedPostRebaseDelta:deltaDigest(delta),
      observedChangeSetDigest:deltaDigest(completeDelta),resumedHead});
    await atomicWrite(path.join(root,".swarmforge","campsites","resumed",`${manifest.task}.json`),
      `${JSON.stringify(result,null,2)}\n`);
    await reissueProductTask(root,result); return result;
  } catch (error) {
    await restoreRemainder(root,manifest,originalBranch); throw error;
  }
}

export async function triggerQaIntegrations(root) {
  const preservedDir=path.join(root,".swarmforge","campsites","preserved");
  let files=[];
  try { files=(await readdir(preservedDir)).filter((name)=>name.endsWith(".json")).sort(); }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  if (!files.length) return [];
  const qaHead=await git(root,"rev-parse","refs/heads/qa"),triggered=[];
  for (const name of files) {
    const manifestPath=path.join(preservedDir,name);
    const manifest=JSON.parse(await readFile(manifestPath,"utf8"));
    try { await readFile(path.join(root,".swarmforge","campsites","resumed",`${manifest.task}.json`)); continue; }
    catch (error) { if (error.code!=="ENOENT") throw error; }
    try { await git(root,"merge-base","--is-ancestor",manifest.prerequisite.commit,qaHead); }
    catch { continue; }
    triggered.push(await resumeOntoQa(root,manifestPath,qaHead,{requireCurrentQa:true}));
  }
  return triggered;
}
