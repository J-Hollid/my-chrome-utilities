import { createHash } from "node:crypto";
import path from "node:path";

const sha40=/^[0-9a-f]{40}$/u,sha64=/^[0-9a-f]{64}$/u;
const stable=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;

export function valueDigest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function bindDigest(value) {
  const bound={...value}; delete bound.digest;
  return {...bound,digest:valueDigest(bound)};
}

export function validateDigest(value,label) {
  const bound={...value}; delete bound.digest;
  if (!sha64.test(value.digest??"")||value.digest!==valueDigest(bound)) {
    throw new Error(`${label} is modified`);
  }
  return value;
}

function requireSha(value,pattern,label) {
  if (!pattern.test(value??"")) throw new Error(`${label} must be canonical`);
}

export function stableIdentity(value) {
  return stable.test(value??"");
}

function validRoutingIdentity(value) {
  if (!value||Array.isArray(value)) return false;
  return stableIdentity(value.from)&&stableIdentity(value.to);
}

function normalizeRouting(value) {
  if (!validRoutingIdentity(value)) {
    throw new Error("Remainder manifest requires a validated return route");
  }
  const priority=value.priority??"00";
  if (!/^[0-9]{2}$/u.test(priority)) throw new Error("Remainder return-route priority is invalid");
  return {from:value.from,to:value.to,priority};
}

export function canonicalDiffContribution(value) {
  return value.split(/\r?\n/u).filter((line)=>
    !line.startsWith("index ")&&!line.startsWith("--- ")&&!line.startsWith("+++ ")&&
    !line.startsWith("@@ ")&&!line.startsWith("\\ No newline")).join("\n");
}

export function contributionDigest(value) {
  return deltaDigest(canonicalDiffContribution(value));
}

function defaultApplicability(causalPaths,boundaryGeneration) {
  return causalPaths.map((pathValue)=>({path:pathValue,boundary:boundaryGeneration,
    consumers:[],failedPremise:false}));
}

const normalizedConsumers=(value)=>[...new Set(value.consumers??[])].sort();

export function dispositionApplicability(value) {
  return {path:value.path,boundary:value.boundary,
    consumers:normalizedConsumers(value),failedPremise:Boolean(value.failedPremise)};
}

function validApplicabilityRow(value,causalPath) {
  return value.path===causalPath&&stableIdentity(value.boundary)&&value.consumers.every(stableIdentity);
}

function normalizeApplicability(values,causalPaths,boundaryGeneration) {
  const source=values?.length?values:defaultApplicability(causalPaths,boundaryGeneration);
  const normalized=source.map(dispositionApplicability)
    .sort((left,right)=>left.path.localeCompare(right.path)||left.boundary.localeCompare(right.boundary));
  if (normalized.length!==causalPaths.length) {
    throw new Error("Campsite applicability identity is incomplete");
  }
  for (let index=0;index<normalized.length;index+=1) {
    if (!validApplicabilityRow(normalized[index],causalPaths[index])) {
      throw new Error("Campsite applicability identity is incomplete");
    }
  }
  return normalized;
}

export function campsiteGenerationId(value) {
  const candidate=value.candidate??value.remainderHead??value.remainder?.head;
  const boundaryGeneration=value.boundaryGeneration;
  const causalPaths=[...new Set(value.causalPaths??[])].sort();
  const validTask=stableIdentity(value.task),validCandidate=sha40.test(candidate??"");
  const validBoundary=stableIdentity(boundaryGeneration),pathsPresent=causalPaths.length>0;
  if (![validTask,validCandidate,validBoundary,pathsPresent].every(Boolean)) {
    throw new Error("Campsite generation identity is incomplete");
  }
  const applicability=normalizeApplicability(value.applicability??value.dispositions,
    causalPaths,boundaryGeneration);
  return valueDigest({task:value.task,candidate,boundaryGeneration,causalPaths,applicability});
}

export function aggregateCampsiteAssessment({task,candidate,causalPaths}) {
  if (!stableIdentity(task)||!sha40.test(candidate)) throw new Error("Campsite assessment identity is invalid");
  const paths=[...new Set(causalPaths)].sort();
  if (!paths.length||paths.some((value)=>!value||path.isAbsolute(value)||value.includes(".."))) {
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
  if (!stableIdentity(input.task)||!stableIdentity(input.boundaryGeneration)) {
    throw new Error("Remainder task and boundary generation must be stable");
  }
  const candidate=input.candidate??input.remainderHead;
  requireSha(candidate,sha40,"candidate");
  const routing=normalizeRouting(input.routing);
  const causalPaths=[...new Set(input.causalPaths)].sort();
  const applicability=normalizeApplicability(input.applicability??input.dispositions,
    causalPaths,input.boundaryGeneration);
  const generationId=campsiteGenerationId({...input,candidate,causalPaths,applicability});
  return bindDigest({version:1,task:input.task,splitBase:input.splitBase,
    candidate,generationId,
    prerequisite:{commit:input.prerequisiteCommit},remainder:{task:input.task,head:input.remainderHead,
      tree:input.remainderTree,orderedCommits:[...input.orderedCommits],changeSetDigest:input.changeSetDigest},
    causalPaths,applicability,boundaryGeneration:input.boundaryGeneration,
    expectedPostRebaseDelta:input.expectedPostRebaseDelta,status:"preserved",routing});
}

export function resumeRemainder(manifest,{newQaHead,observedPostRebaseDelta,
  observedChangeSetDigest,resumedHead}) {
  validateDigest(manifest,"Remainder manifest");
  if (manifest.generationId!==campsiteGenerationId(manifest)) {
    throw new Error("Remainder manifest generation is modified");
  }
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
  const consumers=normalizedConsumers(value).join("\u0001");
  return [value.task,value.path,value.boundary,value.generation,consumers,
    String(Boolean(value.failedPremise))].join("\u0000");
}

function validateDisposition(value) {
  if (!["slice","seam","integrated-seam","parent-fallback"].includes(value.result)) {
    throw new Error("Disposition result is invalid");
  }
  const invalidFallback=value.result==="parent-fallback"&&
    (!value.failedPremise||!value.consumers?.length);
  if (invalidFallback) throw new Error("Parent fallback requires failed proof premise and preserved consumers");
}

export function recordDisposition(records,value) {
  validateDisposition(value);
  if (records.some((item)=>dispositionIdentity(item)===dispositionIdentity(value))) {
    throw new Error("Task/path generation already has a disposition");
  }
  const record={...value,consumers:normalizedConsumers(value)};
  records.push(record); return record;
}

export function deltaDigest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
