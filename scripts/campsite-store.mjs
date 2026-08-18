import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { bindDigest, campsiteGenerationId, dispositionApplicability, dispositionIdentity,
  recordDisposition, stableIdentity, validateDigest, valueDigest } from "./campsite-artifacts.mjs";

export async function atomicWrite(target,content,{exclusive=false}={}) {
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
  try { await atomicWrite(target,content,{exclusive:true}); return; }
  catch (error) {
    if (!/already exists/u.test(error.message)) throw error;
    if (await readFile(target,"utf8")!==content) throw new Error(`Immutable campsite artifact conflicts: ${target}`);
  }
}

async function loadDispositionLedger(target,task) {
  let existing={version:1,task,records:[]};
  try { existing=validateDigest(JSON.parse(await readFile(target,"utf8")),"Disposition ledger"); }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  return existing;
}

function requiredDisposition(values,assessment,causalPath) {
  const value=values.find((item)=>item.path===causalPath);
  const reviewed=value?.reviewedBy&&value?.reviewedAt;
  if (!value||value.task!==assessment.task||!reviewed) {
    throw new Error(`Reviewed campsite disposition is missing for ${causalPath}`);
  }
  return value;
}

function applyDisposition(records,value) {
  const normalized={...value,consumers:dispositionApplicability(value).consumers};
  const prior=records.find((item)=>dispositionIdentity(item)===dispositionIdentity(value));
  if (prior&&valueDigest(prior)!==valueDigest(normalized)) {
    throw new Error("Applicable campsite disposition cannot be replaced");
  }
  if (!prior) recordDisposition(records,value);
}

export async function persistDispositions(root,assessment,values) {
  validateDigest(assessment,"Campsite assessment");
  const target=path.join(root,".swarmforge","campsites","dispositions",`${assessment.task}.json`);
  const existing=await loadDispositionLedger(target,assessment.task);
  const records=[...existing.records];
  for (const causalPath of assessment.causalPaths) {
    applyDisposition(records,requiredDisposition(values,assessment,causalPath));
  }
  const ledger=bindDigest({version:1,task:assessment.task,records});
  await atomicWrite(target,`${JSON.stringify(ledger,null,2)}\n`); return ledger;
}

function handoffText(headers,body) {
  return `${Object.entries(headers).filter(([,value])=>value!==undefined)
    .map(([key,value])=>`${key}: ${value}`).join("\n")}\n\n${body}\n`;
}

async function routeHandoff(root,headers,body) {
  const target=path.join(root,".swarmforge","handoffs","outbox",`00_${headers.id}.handoff`);
  await immutableWrite(target,handoffText(headers,body)); return target;
}

const generationStem=(value)=>`${value.task}-${value.generationId}`;

function resumptionTransaction(root,result) {
  const stem=generationStem(result);
  const resumedPath=path.join(root,".swarmforge","campsites","resumed",`${stem}.json`);
  const handoffId=`resume-${result.task}-${result.generationId.slice(0,12)}`;
  const handoffPath=path.join(root,".swarmforge","handoffs","outbox",`00_${handoffId}.handoff`);
  const handoffContent=handoffText({id:handoffId,from:result.routing.from,to:result.routing.to,
    recipient:result.routing.to,priority:result.routing.priority,type:"task",task:result.task,
    commit:result.resumedHead,base:result.newQaHead,
    message:`Automatically resumed conserved task ${result.task} after campsite QA integration`},
  `Delta-conserved remainder resumed from ${result.remainder.head} onto ${result.newQaHead}.`);
  return bindDigest({version:1,task:result.task,generationId:result.generationId,
    result,resumedPath,handoffPath,handoffContent});
}

function inject(faultAt,boundary) {
  if (faultAt===boundary) throw new Error(`Injected campsite crash at ${boundary}`);
}

async function applyResumptionTransaction(root,transaction,faultAt) {
  validateDigest(transaction,"Campsite resumption transaction");
  const journal=path.join(root,".swarmforge","campsites","transactions",
    `${generationStem(transaction)}.json`);
  await immutableWrite(transaction.handoffPath,transaction.handoffContent);
  inject(faultAt,"resumption-routed");
  await immutableWrite(transaction.resumedPath,`${JSON.stringify(transaction.result,null,2)}\n`);
  inject(faultAt,"resumption-recorded");
  await rm(journal,{force:true});
  return {result:transaction.result,handoff:transaction.handoffPath};
}

export async function persistResumption(root,result,{faultAt}={}) {
  validateDigest(result,"Resumed remainder");
  if (result.status!=="resumed"||!result.routing) {
    throw new Error("Only a routed resumed remainder can be persisted");
  }
  const transaction=resumptionTransaction(root,result);
  const journal=path.join(root,".swarmforge","campsites","transactions",
    `${generationStem(result)}.json`);
  await immutableWrite(journal,`${JSON.stringify(transaction,null,2)}\n`);
  inject(faultAt,"resumption-journal-written");
  return applyResumptionTransaction(root,transaction,faultAt);
}

export async function recoverResumptionTransactions(root) {
  const directory=path.join(root,".swarmforge","campsites","transactions");
  let names=[];
  try { names=(await readdir(directory)).filter((name)=>name.endsWith(".json")).sort(); }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  const recovered=[];
  for (const name of names) {
    const transaction=JSON.parse(await readFile(path.join(directory,name),"utf8"));
    recovered.push(await applyResumptionTransaction(root,transaction));
  }
  return recovered;
}

function validatePipelineDispositions(assessment,manifest,dispositions) {
  const applicable=Array.isArray(manifest.applicability)&&
    manifest.applicability.length===assessment.causalPaths.length&&
    Array.isArray(dispositions)&&dispositions.length===assessment.causalPaths.length;
  if (!applicable) throw new Error("Campsite pipeline applicability is not one-to-one");
  const expected=new Map(manifest.applicability.map((value)=>[value.path,value]));
  for (const value of dispositions) {
    const row=expected.get(value.path);
    const reviewed=value.reviewedBy&&value.reviewedAt;
    const exact=row&&value.task===assessment.task&&value.generation===manifest.boundaryGeneration&&
      valueDigest(dispositionApplicability(value))===valueDigest(row);
    if (!reviewed||!exact) throw new Error("Campsite disposition differs from manifest applicability");
    expected.delete(value.path);
  }
  if (expected.size) throw new Error("Campsite pipeline applicability is not one-to-one");
}

function validatePipelineIdentity(assessment,manifest,dispositions,preparation) {
  validateDigest(assessment,"Campsite assessment"); validateDigest(manifest,"Remainder manifest");
  if (![preparation.id,preparation.from,preparation.to,preparation.task].every(stableIdentity)) {
    throw new Error("Preparation handoff identity is invalid");
  }
  if (assessment.task!==manifest.task||valueDigest(assessment.causalPaths)!==valueDigest(manifest.causalPaths)) {
    throw new Error("Assessment and preserved remainder causal paths differ");
  }
  if (assessment.candidate!==manifest.candidate) {
    throw new Error("Assessment and preserved remainder candidate generations differ");
  }
  if (manifest.generationId!==campsiteGenerationId(manifest)) {
    throw new Error("Remainder manifest generation is modified");
  }
  validatePipelineDispositions(assessment,manifest,dispositions);
}

function pipelineBinding(assessment,manifest,dispositions,preparation) {
  const normalized=dispositions.map((value)=>({...value,
    consumers:dispositionApplicability(value).consumers}));
  return {assessmentDigest:assessment.digest,manifestDigest:manifest.digest,
    dispositionsDigest:valueDigest(normalized),preparationDigest:valueDigest(preparation)};
}

async function reusablePipeline(receiptPath,binding) {
  try {
    const receipt=validateDigest(JSON.parse(await readFile(receiptPath,"utf8")),"Campsite pipeline receipt");
    if (Object.entries(binding).some(([key,value])=>receipt[key]!==value)) {
      throw new Error("Campsite pipeline identity conflicts with its receipt");
    }
    return {...receipt,reused:true};
  } catch (error) {
    if (error.code!=="ENOENT") throw error;
    return null;
  }
}

async function createPipeline(root,{assessment,dispositions,manifest,preparation},receiptPath,binding) {
  const ledger=await persistDispositions(root,assessment,dispositions);
  const preserved=path.join(root,".swarmforge","campsites","preserved",
    `${generationStem(manifest)}.json`);
  const assessmentPath=path.join(root,".swarmforge","campsites","assessments",
    `${generationStem(manifest)}.json`);
  await immutableWrite(preserved,`${JSON.stringify(manifest,null,2)}\n`);
  await immutableWrite(assessmentPath,`${JSON.stringify(assessment,null,2)}\n`);
  const routed=await routeHandoff(root,{id:`${preparation.id}-${manifest.generationId.slice(0,12)}`,
    from:preparation.from,to:preparation.to,recipient:preparation.to,
    priority:preparation.priority??"00",type:"task",task:preparation.task,
    commit:manifest.prerequisite.commit,base:manifest.splitBase,
    message:preparation.message??`Prepare campsite boundary for ${manifest.task}`,
    created_at:preparation.createdAt},
  `Preserved product remainder ${manifest.remainder.head} for stable task ${manifest.task}.`);
  const receipt=bindDigest({version:1,task:assessment.task,candidate:assessment.candidate,...binding,
    assessment:assessmentPath,ledgerDigest:ledger.digest,preserved,preparationHandoff:routed});
  await immutableWrite(receiptPath,`${JSON.stringify(receipt,null,2)}\n`);
  return receipt;
}

export async function persistCampsitePipeline(root,input) {
  const {assessment,dispositions,manifest,preparation}=input;
  validatePipelineIdentity(assessment,manifest,dispositions,preparation);
  const receiptPath=path.join(root,".swarmforge","campsites","pipelines",
    `${generationStem(manifest)}.json`);
  const binding=pipelineBinding(assessment,manifest,dispositions,preparation);
  return await reusablePipeline(receiptPath,binding)??
    createPipeline(root,input,receiptPath,binding);
}

export async function reissueProductTask(root,result) {
  return (await persistResumption(root,result)).handoff;
}
