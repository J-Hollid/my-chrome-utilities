import {execFile} from "node:child_process";
import {access,mkdir,mkdtemp,readFile,realpath,rm,symlink} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";

import {boundedClosureContractRevision,completeTaskInputClosure} from
  "../../verification-reliability-closure.mjs";
import {deterministicBaselineFailureIdentity,timeoutIncidentDigest} from
  "../../verification-reliability-values.mjs";
import {verificationPacksAtCommit} from "../../verification-changes.mjs";
import {planVerification,verificationTaskIdentity} from "../../verification-packs.mjs";

const exec=promisify(execFile);

async function git(root,...args) {
  return (await exec("git",args,{cwd:root,maxBuffer:16*1024*1024})).stdout.trim();
}

async function gitBytes(root,...args) {
  return (await exec("git",args,{cwd:root,maxBuffer:16*1024*1024,encoding:"buffer"})).stdout;
}

async function runTask(root,task) {
  try {
    const completed=await exec(task.executable,task.args,{cwd:root,
      env:{...process.env,...task.environment},maxBuffer:16*1024*1024});
    return {code:0,signal:null,stdout:completed.stdout,stderr:completed.stderr};
  } catch(error) {
    return {code:error.code??1,signal:error.signal??null,
      stdout:error.stdout??"",stderr:error.stderr??""};
  }
}

function generatedTaskInputs(task) {
  return task.args.filter((entry)=>typeof entry==="string"&&entry.startsWith("build/"));
}

export async function executeCanonicalDiagnosticAtCommit(root,commit,
  {task,preparationTasks,dependencyPreparation}={}) {
  await mkdir(path.join(root,"tmp"),{recursive:true});
  const temporary=await mkdtemp(path.join(root,"tmp","baseline-diagnostic-"));
  const checkout=path.join(temporary,"checkout");
  try {
    await exec("git",["clone","--quiet","--no-checkout","--shared",root,checkout]);
    await git(checkout,"checkout","--quiet","--detach",commit);
    const installedLockDigest=timeoutIncidentDigest(await readFile(path.join(root,"package-lock.json")));
    if(installedLockDigest!==dependencyPreparation.lockDigest) {
      return {status:"preparation-failed",failureDigest:timeoutIncidentDigest({
        code:"dependency-lock-mismatch",installedLockDigest})};
    }
    const installedModules=await realpath(path.join(root,"node_modules"));
    await symlink(installedModules,path.join(checkout,"node_modules"),"dir");
    for(const preparationTask of preparationTasks) {
      const preparation=await runTask(checkout,preparationTask);
      if(preparation.code!==0) {
        return {status:"preparation-failed",failureDigest:timeoutIncidentDigest(preparation)};
      }
    }
    try {
      await Promise.all(generatedTaskInputs(task).map((input)=>access(path.join(checkout,input))));
    } catch(error) {
      return {status:"preparation-failed",failureDigest:timeoutIncidentDigest({
        code:"missing-generated-input",message:error.message})};
    }
    const result=await runTask(checkout,task);
    return {status:result.code===0?"passed":"failed",
      failureDigest:deterministicBaselineFailureIdentity({
        task,exitCode:result.code,signal:result.signal,stdout:result.stdout,stderr:result.stderr}),
      diagnostic:{stdout:result.stdout,stderr:result.stderr}};
  } finally {
    await rm(temporary,{recursive:true,force:true});
  }
}

function canonicalPreparationTasks(plan,task) {
  const features=new Set((task.target??"").split(",").filter(Boolean));
  return plan.tasks.filter(({stage,target})=>
    stage==="build"||(["acceptance-parse","acceptance-generate"].includes(stage)&&features.has(target)))
    .map(verificationTaskIdentity);
}

async function pathClosure(root,commit,paths) {
  const pathDigests=[];
  for(const inputPath of [...new Set(paths.filter((entry)=>typeof entry==="string"))].sort()) {
    const bytes=await gitBytes(root,"show",`${commit}:${inputPath}`);
    pathDigests.push({path:inputPath,digest:timeoutIncidentDigest(bytes)});
  }
  return {complete:true,paths:pathDigests.map(({path})=>path),digest:timeoutIncidentDigest(pathDigests)};
}

export async function canonicalBaselineDiagnostic(root,receipt) {
  const prefix="acceptance-session:";
  if(!receipt.checkKey.startsWith(prefix)) {
    throw new Error("Deterministic baseline admission requires a canonical acceptance task");
  }
  const packId=receipt.checkKey.slice(prefix.length);
  const packs=await verificationPacksAtCommit(receipt.commit,{repositoryRoot:root,
    historicalRegistryFallback:true});
  const plan=planVerification(packs,{packIds:[packId],includeProperties:true});
  const planned=plan.tasks.find(({key})=>key===receipt.checkKey);
  if(!planned)throw new Error("Deterministic baseline admission canonical task is absent");
  const task=verificationTaskIdentity(planned);
  const preparationTasks=canonicalPreparationTasks(plan,task);
  const dependencyPreparation={kind:"validated-node-modules",lockDigest:timeoutIncidentDigest(
    await gitBytes(root,"show",`${receipt.commit}:package-lock.json`))};
  const pack=packs.find(({id})=>id===packId);
  const localArgs=task.args.filter((entry)=>typeof entry==="string"&&
    /^(?:acceptance|scripts|src|test|verification)\//u.test(entry)&&!entry.startsWith("build/"));
  const transitivePaths=[...(pack.source??[]),...(pack.process??[]),...(pack.globalImpact??[]),
    ...(pack.runtimeInputs??[]),...(pack.verificationInputs??[]),...localArgs];
  const [transitiveCode,featureInputs,handlerInputs]=await Promise.all([
    pathClosure(root,receipt.commit,transitivePaths),
    pathClosure(root,receipt.commit,pack.features??[]),
    pathClosure(root,receipt.commit,pack.handlers??[]),
  ]);
  const generatedPaths=generatedTaskInputs(task).sort();
  const generatedInputs={complete:true,paths:generatedPaths,digest:timeoutIncidentDigest({
    featureInputs:featureInputs.digest,generatedPaths,preparationTasks})};
  const relevantInputs=completeTaskInputClosure({contractRevision:boundedClosureContractRevision,
    task,transitiveCode,featureInputs,handlerInputs,generatedInputs,
    productArtifact:{required:false},runnerSemantics:{digest:timeoutIncidentDigest(task)},
    prerequisiteSemantics:{digest:timeoutIncidentDigest({dependencyPreparation,preparationTasks})},
    environment:task.environment,toolchain:{digest:receipt.toolchainDigest},limits:{}}).input;
  return {task,taskDigest:timeoutIncidentDigest(task),dependencyPreparation,preparationTasks,
    relevantInputs};
}

async function validateCanonicalDiagnostic(root,receipt) {
  const canonical=await canonicalBaselineDiagnostic(root,receipt);
  if(timeoutIncidentDigest(receipt.task)!==canonical.taskDigest||
      receipt.taskDigest!==canonical.taskDigest) {
    throw new Error("Deterministic baseline admission canonical task identity changed");
  }
  if(timeoutIncidentDigest(receipt.relevantInputs)!==timeoutIncidentDigest(canonical.relevantInputs)) {
    throw new Error("Deterministic baseline admission relevant input closure is incomplete");
  }
  return {...canonical,closure:completeTaskInputClosure(canonical.relevantInputs)};
}

export async function authenticateBaselineDiagnosticPair({root,baseDocument,candidateDocument,
  execute=executeCanonicalDiagnosticAtCommit}={}) {
  const base=baseDocument.receipt,candidate=candidateDocument.receipt;
  const [baseTree,candidateTree,baseToolchain,candidateToolchain]=await Promise.all([
    git(root,"rev-parse",`${base.commit}^{tree}`),git(root,"rev-parse",`${candidate.commit}^{tree}`),
    gitBytes(root,"show",`${base.commit}:swarmforge/toolchain.lock.json`),
    gitBytes(root,"show",`${candidate.commit}:swarmforge/toolchain.lock.json`),
  ]);
  await git(root,"merge-base","--is-ancestor",base.commit,candidate.commit);
  if(base.tree!==baseTree||candidate.tree!==candidateTree) {
    throw new Error("Deterministic baseline admission requires exact repository trees");
  }
  const baseToolchainDigest=timeoutIncidentDigest(baseToolchain);
  const candidateToolchainDigest=timeoutIncidentDigest(candidateToolchain);
  if(base.toolchainDigest!==baseToolchainDigest||candidate.toolchainDigest!==candidateToolchainDigest||
      baseToolchainDigest!==candidateToolchainDigest) {
    throw new Error("Deterministic baseline admission requires the locked toolchain digest");
  }
  const [baseCanonical,candidateCanonical]=await Promise.all([
    validateCanonicalDiagnostic(root,base),validateCanonicalDiagnostic(root,candidate),
  ]);
  if(baseCanonical.taskDigest!==candidateCanonical.taskDigest||
      baseCanonical.closure.digest!==candidateCanonical.closure.digest) {
    throw new Error("Deterministic baseline admission requires unchanged inputs");
  }
  const [baseResult,candidateResult]=await Promise.all([
    execute(root,base.commit,baseCanonical),execute(root,candidate.commit,candidateCanonical),
  ]);
  for(const [receipt,result] of [[base,baseResult],[candidate,candidateResult]]) {
    if(result.status!=="failed"||result.failureDigest!==receipt.result.failureDigest) {
      throw new Error("Deterministic baseline admission requires an executed matching failure");
    }
  }
  return {baseDocument,candidateDocument,relevantInputsDigest:baseCanonical.closure.digest};
}
