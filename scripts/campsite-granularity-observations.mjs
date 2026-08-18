import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { promisify } from "node:util";

import { stableIdentity, valueDigest } from "./campsite-artifacts.mjs";
import { atomicWrite } from "./campsite-store.mjs";

const exec=promisify(execFile);
const sha=/^[0-9a-f]{40}$/u;
const dispositions=new Set(["selected","combined","carried","retired"]);
const forbiddenJudgmentFields=new Set(["roadmap","futureTouches","futureTouchPrediction",
  "weightedScore","threshold"]);

function repositoryPortfolioRoot(root) {
  try {
    const common=execFileSync("git",["rev-parse","--git-common-dir"],
      {cwd:root,encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim();
    const absolute=path.isAbsolute(common)?common:path.resolve(root,common);
    const identity=createHash("sha256").update(absolute).digest("hex");
    return path.join(os.tmpdir(),"swarmforge-repository-runtime",identity);
  } catch { return path.join(root,".swarmforge","campsites"); }
}

const targetFor=(root)=>path.join(repositoryPortfolioRoot(root),"granularity-portfolio.json");
const lockFor=(root)=>`${targetFor(root)}.lock`;
const text=(value,label)=>{
  if (typeof value!=="string"||!value.trim()) throw new Error(`${label} is required`);
  return value.trim();
};
const strings=(value,label,{allowEmpty=false}={})=>{
  if (!Array.isArray(value)||(!allowEmpty&&!value.length)||
      value.some((item)=>typeof item!=="string"||!item.trim())) throw new Error(`${label} is required`);
  return [...new Set(value.map((item)=>item.trim()))].sort();
};
const timestamp=(value,label="Recorded timestamp")=>{
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} is invalid`);
  return value;
};

function emptyPortfolio() { return {version:1,observations:[],hardeningProofs:[]}; }

async function load(root) {
  try {
    const value=JSON.parse(await readFile(targetFor(root),"utf8"));
    if (value?.version!==1||!Array.isArray(value.observations)||!Array.isArray(value.hardeningProofs)) {
      throw new Error("Granularity portfolio is malformed");
    }
    return value;
  } catch (error) { if (error.code==="ENOENT") return emptyPortfolio(); throw error; }
}

function loadSync(root) {
  try {
    const value=JSON.parse(readFileSync(targetFor(root),"utf8"));
    return value?.version===1&&Array.isArray(value.observations)&&Array.isArray(value.hardeningProofs)?
      value:emptyPortfolio();
  } catch (error) { if (error.code==="ENOENT") return emptyPortfolio(); throw error; }
}

async function locked(root,operation) {
  await mkdir(path.dirname(targetFor(root)),{recursive:true});
  try { await mkdir(lockFor(root)); }
  catch (error) {
    if (error.code==="EEXIST") throw new Error("Granularity portfolio is already being updated");
    throw error;
  }
  try {
    const portfolio=await load(root),result=await operation(portfolio);
    await atomicWrite(targetFor(root),`${JSON.stringify(portfolio,null,2)}\n`);
    return result;
  } finally { await rm(lockFor(root),{recursive:true,force:true}); }
}

function identityInput(value) {
  const task=text(value.task,"Observation task"),qaBase=text(value.qaBase,"Observation QA base");
  if (!sha.test(qaBase)) throw new Error("Observation QA base must be an exact commit");
  return {task,qaBase,causalPaths:strings(value.causalPaths,"Observation causal paths"),
    boundaryGeneration:text(value.boundaryGeneration,"Observation boundary generation")};
}

export function granularityObservationIdentity(value) {
  return valueDigest(identityInput(value));
}

export function validateGranularityJudgment(value) {
  if (value?.version!==1) throw new Error("Granularity judgment must use version 1");
  for (const field of forbiddenJudgmentFields) {
    if (Object.hasOwn(value,field)) throw new Error("Granularity judgment cannot use a roadmap, future touches, weighted score, or threshold");
  }
  const outcomes=new Set(["use-reviewed-seam","opportunistic-seam","immediate-preparation",
    "deferred-observation","parent-fallback"]);
  if (!outcomes.has(value.outcome)) throw new Error("Granularity judgment outcome is invalid");
  const measuredCost=value.measuredCost;
  if (!measuredCost||!Number.isInteger(measuredCost.taskCount)||measuredCost.taskCount<0||
      !Number.isFinite(measuredCost.criticalPathEstimateMs)||measuredCost.criticalPathEstimateMs<0||
      !Number.isInteger(measuredCost.failureCount)||measuredCost.failureCount<0) {
    throw new Error("Granularity judgment requires measured task, critical-path, and failure cost");
  }
  return {version:1,outcome:value.outcome,
    semanticProductScope:text(value.semanticProductScope,"Semantic product scope"),
    unrelatedSelectedFamilies:strings(value.unrelatedSelectedFamilies,"Unrelated selected families",{allowEmpty:true}),
    measuredCost:structuredClone(measuredCost),failureSurface:text(value.failureSurface,"Failure surface"),
    seamClarity:text(value.seamClarity,"Seam clarity"),
    preparationCostRisk:text(value.preparationCostRisk,"Preparation cost and risk"),
    rationale:text(value.rationale,"Judgment rationale"),
    reconsiderationEvidence:text(value.reconsiderationEvidence,"Reconsideration evidence")};
}

function observationOccurrence(input) {
  const judgment=validateGranularityJudgment({version:1,outcome:"deferred-observation",
    semanticProductScope:input.semanticProductScope,
    unrelatedSelectedFamilies:input.unrelatedTaskFamilies,
    measuredCost:input.measuredCost,failureSurface:input.failureSurface,
    seamClarity:input.seamClarity,preparationCostRisk:input.preparationCostRisk,
    rationale:input.rationale,reconsiderationEvidence:input.reconsiderationEvidence});
  return {recordedAt:timestamp(input.recordedAt),semanticProductScope:judgment.semanticProductScope,
    selectedPackIds:strings(input.selectedPackIds,"Selected packs"),
    selectedTaskFamilies:strings(input.selectedTaskFamilies,"Selected task families"),
    unrelatedTaskFamilies:judgment.unrelatedSelectedFamilies,
    ...(input.candidateSeam?{candidateSeam:text(input.candidateSeam,"Candidate seam")} : {}),
    measuredCost:judgment.measuredCost,failureSurface:judgment.failureSurface,
    seamClarity:judgment.seamClarity,preparationCostRisk:judgment.preparationCostRisk,
    rationale:judgment.rationale,reconsiderationEvidence:judgment.reconsiderationEvidence};
}

async function defaultIsBaseAncestor(root,base) {
  try { await exec("git",["merge-base","--is-ancestor",base,"refs/heads/qa"],{cwd:root}); return true; }
  catch { return false; }
}

export async function recordGranularityObservation(root,input,{isBaseAncestor=defaultIsBaseAncestor}={}) {
  const identityValues=identityInput(input),identity=granularityObservationIdentity(input);
  if (input.identity&&input.identity!==identity) throw new Error("Granularity observation identity collision");
  if (!await isBaseAncestor(root,identityValues.qaBase)) {
    throw new Error("Granularity observation QA base is stale or non-ancestral");
  }
  const occurrence=observationOccurrence(input);
  return locked(root,(portfolio)=>{
    let observation=portfolio.observations.find((item)=>item.identity===identity);
    if (observation) {
      if (valueDigest(identityInput(observation))!==valueDigest(identityValues)) {
        throw new Error("Granularity observation identity collision");
      }
      observation.occurrences.push(occurrence);
    } else {
      observation={identity,...identityValues,occurrences:[occurrence],dispositionHistory:[]};
      portfolio.observations.push(observation);
      portfolio.observations.sort((left,right)=>left.identity.localeCompare(right.identity));
    }
    return {status:"recorded",observation:structuredClone(observation)};
  });
}

function normalizedDisposition(input) {
  if (!dispositions.has(input.disposition)) throw new Error("Portfolio disposition is invalid");
  const value={kind:input.disposition,reason:text(input.reason,"Portfolio disposition reason"),
    recordedAt:timestamp(input.recordedAt)};
  if (["selected","combined"].includes(value.kind)) {
    value.refinementIdentity=text(input.refinementIdentity,"Refinement identity");
    if (!stableIdentity(value.refinementIdentity)) throw new Error("Refinement identity is invalid");
  }
  if (["carried","combined"].includes(value.kind)) {
    value.reconsiderationEvidence=text(input.reconsiderationEvidence,"Reconsideration evidence");
  }
  if (value.kind==="retired") value.disprovedPremise=text(input.disprovedPremise,"Disproved premise");
  return value;
}

export async function recordGranularityPortfolioDisposition(root,input) {
  const identity=text(input.observationIdentity,"Observation identity"),value=normalizedDisposition(input);
  return locked(root,(portfolio)=>{
    const observation=portfolio.observations.find((item)=>item.identity===identity);
    if (!observation) throw new Error("Portfolio disposition observation is missing or stale");
    const prior=observation.dispositionHistory.at(-1);
    if (prior) {
      if (valueDigest(prior)!==valueDigest(value)) throw new Error("Portfolio disposition is append-only and cannot be replaced");
      return {status:"reused",observation:structuredClone(observation)};
    }
    observation.dispositionHistory.push(value);
    return {status:"recorded",observation:structuredClone(observation)};
  });
}

export async function recordGranularityQaProof(root,input) {
  const proof={refinementIdentity:text(input.refinementIdentity,"Refinement identity"),
    task:text(input.task,"Hardening task"),candidateCommit:text(input.candidateCommit,"Hardening candidate"),
    evidence:text(input.evidence,"Hardening evidence"),qaIntegrated:input.qaIntegrated===true,
    recordedAt:timestamp(input.recordedAt)};
  if (!stableIdentity(proof.refinementIdentity)||!sha.test(proof.candidateCommit)||
      proof.evidence!=="review-ready"||!proof.qaIntegrated) {
    throw new Error("Selected hardening requires review-ready evidence and QA integration");
  }
  return locked(root,(portfolio)=>{
    const selected=portfolio.observations.some((observation)=>
      ["selected","combined"].includes(observation.dispositionHistory.at(-1)?.kind)&&
      observation.dispositionHistory.at(-1).refinementIdentity===proof.refinementIdentity);
    if (!selected) throw new Error("Hardening proof has no selected portfolio refinement");
    const prior=portfolio.hardeningProofs.find((item)=>item.refinementIdentity===proof.refinementIdentity);
    if (prior&&valueDigest(prior)!==valueDigest(proof)) throw new Error("Hardening QA proof is immutable");
    if (!prior) portfolio.hardeningProofs.push(proof);
    return {status:prior?"reused":"recorded",proof:structuredClone(prior??proof)};
  });
}

function visiblePortfolio(portfolio) {
  return {version:1,observations:portfolio.observations.map((observation)=>({...structuredClone(observation),
    disposition:structuredClone(observation.dispositionHistory.at(-1)??null)})),
  hardeningProofs:structuredClone(portfolio.hardeningProofs)};
}

export async function listGranularityPortfolio(root) { return visiblePortfolio(await load(root)); }

async function freezeBlocking(portfolio,qaHead,isAncestor) {
  const blocking=[];
  for (const observation of portfolio.observations) {
    const disposition=observation.dispositionHistory.at(-1);
    if (!disposition) { blocking.push(`undisposed:${observation.identity}`); continue; }
    if (!["selected","combined"].includes(disposition.kind)) continue;
    const proof=portfolio.hardeningProofs.find((item)=>item.refinementIdentity===disposition.refinementIdentity);
    if (!proof||proof.evidence!=="review-ready"||!proof.qaIntegrated||
        !await isAncestor(proof.candidateCommit,qaHead)) {
      blocking.push(`selected-hardening-not-on-qa:${disposition.refinementIdentity}`);
    }
  }
  return [...new Set(blocking)].sort();
}

export async function granularityPortfolioFreezeStatus(root,{qaHead,isAncestor}={}) {
  const portfolio=await load(root),ancestor=isAncestor??(async(candidate,head)=>{
    try { await exec("git",["merge-base","--is-ancestor",candidate,head],{cwd:root}); return true; }
    catch { return false; }
  });
  const blocking=await freezeBlocking(portfolio,qaHead??"refs/heads/qa",ancestor);
  return {ready:blocking.length===0,blocking,observationCount:portfolio.observations.length};
}

export function granularityPortfolioFreezeStatusSync(root=process.cwd()) {
  const portfolio=loadSync(root),blocking=[];
  let qaHead="";
  try { qaHead=execFileSync("git",["rev-parse","refs/heads/qa"],{cwd:root,encoding:"utf8"}).trim(); }
  catch {}
  for (const observation of portfolio.observations) {
    const disposition=observation.dispositionHistory.at(-1);
    if (!disposition) { blocking.push(`undisposed:${observation.identity}`); continue; }
    if (!["selected","combined"].includes(disposition.kind)) continue;
    const proof=portfolio.hardeningProofs.find((item)=>item.refinementIdentity===disposition.refinementIdentity);
    let ancestral=false;
    if (proof&&qaHead) {
      try { execFileSync("git",["merge-base","--is-ancestor",proof.candidateCommit,qaHead],
        {cwd:root,stdio:"ignore"}); ancestral=true; } catch {}
    }
    if (!proof||proof.evidence!=="review-ready"||!proof.qaIntegrated||!ancestral) {
      blocking.push(`selected-hardening-not-on-qa:${disposition.refinementIdentity}`);
    }
  }
  return {ready:blocking.length===0,blocking:[...new Set(blocking)].sort(),
    observationCount:portfolio.observations.length};
}
