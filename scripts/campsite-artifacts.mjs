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
  return bindDigest({version:1,task:input.task,splitBase:input.splitBase,
    prerequisite:{commit:input.prerequisiteCommit},remainder:{task:input.task,head:input.remainderHead,
      tree:input.remainderTree,orderedCommits:[...input.orderedCommits],changeSetDigest:input.changeSetDigest},
    causalPaths:[...new Set(input.causalPaths)].sort(),boundaryGeneration:input.boundaryGeneration,
    expectedPostRebaseDelta:input.expectedPostRebaseDelta,status:"preserved",routing:input.routing});
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
  if (value.result==="parent-fallback"&&(!value.failedPremise||!value.consumers?.length)) {
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
