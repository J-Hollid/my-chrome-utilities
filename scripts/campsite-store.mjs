import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { bindDigest, dispositionIdentity, recordDisposition, stableIdentity,
  validateDigest, valueDigest } from "./campsite-artifacts.mjs";

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

export async function persistDispositions(root,assessment,values) {
  validateDigest(assessment,"Campsite assessment");
  const target=path.join(root,".swarmforge","campsites","dispositions",`${assessment.task}.json`);
  let existing={version:1,task:assessment.task,records:[]};
  try { existing=validateDigest(JSON.parse(await readFile(target,"utf8")),"Disposition ledger"); }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  const records=[...existing.records];
  for (const causalPath of assessment.causalPaths) {
    const value=values.find((item)=>item.path===causalPath);
    if (!value||value.task!==assessment.task||!value.reviewedBy||!value.reviewedAt) {
      throw new Error(`Reviewed campsite disposition is missing for ${causalPath}`);
    }
    const normalized={...value,consumers:[...new Set(value.consumers??[])].sort()};
    const prior=records.find((item)=>dispositionIdentity(item)===dispositionIdentity(value));
    if (prior&&valueDigest(prior)!==valueDigest(normalized)) {
      throw new Error("Applicable campsite disposition cannot be replaced");
    }
    if (!prior) recordDisposition(records,value);
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

export async function persistCampsitePipeline(root,{assessment,dispositions,manifest,preparation}) {
  validateDigest(assessment,"Campsite assessment"); validateDigest(manifest,"Remainder manifest");
  if (![preparation.id,preparation.from,preparation.to,preparation.task].every(stableIdentity)) {
    throw new Error("Preparation handoff identity is invalid");
  }
  if (assessment.task!==manifest.task||valueDigest(assessment.causalPaths)!==valueDigest(manifest.causalPaths)) {
    throw new Error("Assessment and preserved remainder causal paths differ");
  }
  const receiptPath=path.join(root,".swarmforge","campsites","pipelines",
    `${assessment.task}-${assessment.candidate}.json`);
  const normalized=dispositions.map((value)=>({...value,consumers:[...new Set(value.consumers??[])].sort()}));
  const binding={assessmentDigest:assessment.digest,manifestDigest:manifest.digest,
    dispositionsDigest:valueDigest(normalized),preparationDigest:valueDigest(preparation)};
  try {
    const receipt=validateDigest(JSON.parse(await readFile(receiptPath,"utf8")),"Campsite pipeline receipt");
    if (Object.entries(binding).some(([key,value])=>receipt[key]!==value)) {
      throw new Error("Campsite pipeline identity conflicts with its receipt");
    }
    return {...receipt,reused:true};
  } catch (error) { if (error.code!=="ENOENT") throw error; }
  const ledger=await persistDispositions(root,assessment,dispositions);
  const preserved=path.join(root,".swarmforge","campsites","preserved",`${manifest.task}.json`);
  const assessmentPath=path.join(root,".swarmforge","campsites","assessments",
    `${assessment.task}-${assessment.candidate}.json`);
  await immutableWrite(preserved,`${JSON.stringify(manifest,null,2)}\n`);
  await immutableWrite(assessmentPath,`${JSON.stringify(assessment,null,2)}\n`);
  const routed=await routeHandoff(root,{id:preparation.id,from:preparation.from,to:preparation.to,
    recipient:preparation.to,priority:preparation.priority??"00",type:"task",task:preparation.task,
    commit:manifest.prerequisite.commit,base:manifest.splitBase,
    message:preparation.message??`Prepare campsite boundary for ${manifest.task}`,
    created_at:preparation.createdAt},
  `Preserved product remainder ${manifest.remainder.head} for stable task ${manifest.task}.`);
  const receipt=bindDigest({version:1,task:assessment.task,candidate:assessment.candidate,...binding,
    assessment:assessmentPath,ledgerDigest:ledger.digest,preserved,preparationHandoff:routed});
  await immutableWrite(receiptPath,`${JSON.stringify(receipt,null,2)}\n`); return receipt;
}

export async function reissueProductTask(root,result) {
  if (!result.routing) return null;
  return routeHandoff(root,{id:`resume-${result.task}-${result.resumedHead.slice(0,10)}`,
    from:result.routing.from,to:result.routing.to,recipient:result.routing.to,
    priority:result.routing.priority??"00",type:"task",task:result.task,
    commit:result.resumedHead,base:result.newQaHead,
    message:`Automatically resumed conserved task ${result.task} after campsite QA integration`},
  `Delta-conserved remainder resumed from ${result.remainder.head} onto ${result.newQaHead}.`);
}
