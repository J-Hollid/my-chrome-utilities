import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { exactSliceSuccessorBase } from
  "../verification-execution/exact-slice-successor.mjs";
import { expandVerificationTaskPrerequisites } from
  "../verification-execution-prerequisites.mjs";
import { createVerificationPackCardinalityAdapter } from
  "../verification-pack-cardinality/contract.mjs";
import { blockedAggregateRouteIdentity } from
  "../verification-policy/reliability/blocked-aggregate.mjs";
import { timeoutRepairPackageTaskIdentity } from
  "../verification-reliability-incidents.mjs";
import { loadTaskSuccessionGraph, taskSuccessionBoundaryDigest, verificationTaskDigest } from
  "../verification-task-succession.mjs";
import { canonicalVerificationChangeSet, verificationPacksAtCommit } from
  "../verification-changes.mjs";
import { planVerification, verificationTaskIdentity } from
  "../verification-packs.mjs";

const exec=promisify(execFile),sha40=/^[a-f0-9]{40}$/u,sha64=/^[a-f0-9]{64}$/u;
const phase2TaskKey="acceptance-session:verification_process";

export const phase2ReceiptBoundSuccessionAuthority=Object.freeze({
  incidentId:"2e282fe6-b636-4c67-b889-5b30a00e5e7e",
  baseCommit:exactSliceSuccessorBase,
});

function fail(name,cause,details="") {
  throw new Error(`${name} ${cause}${details?`: ${details}`:""}`);
}

function governedPlan(plan) {
  return plan?.tasks?.some(({packId})=>packId==="verification_process")||
    Boolean(plan?.blockedAggregateObligation||plan?.blockedAggregateConsumptionAdmissions?.length);
}

function exactBlockedDeclaration(identity) {
  if (!identity||typeof identity!=="object"||Array.isArray(identity)) {
    fail("authenticated blocked-aggregate consumer-plan authority","is missing");
  }
  if (!sha40.test(identity.consumerSourceCommit??"")||
      !sha40.test(identity.consumerSourceTree??"")||
      typeof identity.consumerTask!=="string"||!identity.consumerTask||
      !Array.isArray(identity.consumerChangedPaths)||!identity.consumerChangedPaths.length||
      !sha64.test(identity.consumerPlanDigest??"")) {
    fail("authenticated blocked-aggregate consumer-plan authority","is malformed");
  }
  return identity;
}

export function blockedAggregateConsumerTaskIdentities(packs) {
  const runnable=createVerificationPackCardinalityAdapter(packs).runnablePackIds,
    canonical=planVerification(packs,{packIds:runnable,includeProperties:true}),
    shell=planVerification(packs,{packIds:["shell"],includeProperties:true}),
    closed=expandVerificationTaskPrerequisites(shell.tasks,canonical.tasks,{mode:shell.mode}),
    packaged=expandVerificationTaskPrerequisites([...closed,
      structuredClone(timeoutRepairPackageTaskIdentity)],canonical.tasks,{mode:shell.mode});
  return packaged.map(verificationTaskIdentity);
}

async function defaultConsumerSource(identity,repositoryRoot) {
  const [commit,tree]=(await Promise.all([
    exec("git",["rev-parse",`${identity.consumerSourceCommit}^{commit}`],
      {cwd:repositoryRoot,encoding:"utf8"}),
    exec("git",["rev-parse",`${identity.consumerSourceCommit}^{tree}`],
      {cwd:repositoryRoot,encoding:"utf8"}),
  ])).map(({stdout})=>stdout.trim());
  return {commit,tree};
}

export async function derivePhase2AcceptanceSessionIdentities({packs,repositoryRoot,authority}) {
  const changeSet=await canonicalVerificationChangeSet({base:authority.baseCommit,
      repositoryRoot}),
    basePacks=await verificationPacksAtCommit(authority.baseCommit,
      {repositoryRoot,historicalRegistryFallback:true});
  return planVerification(packs,{changedPaths:changeSet.paths,changeSet,basePacks,
    includeProperties:true}).tasks.map(verificationTaskIdentity)
    .filter(({key})=>key===phase2TaskKey);
}

function exactPhase2Edge(graph,authority) {
  if (!authority||!sha40.test(authority.baseCommit??"")||
      typeof authority.incidentId!=="string"||!authority.incidentId) {
    fail("Phase 2 receipt-bound succession authority","is missing or malformed");
  }
  if (graph?.version!==1||!graph.identities||!graph.boundaries||!Array.isArray(graph.edges)) {
    fail("Phase 2 task-succession authority","is malformed");
  }
  const matches=graph.edges.filter(({incidentId})=>incidentId===authority.incidentId);
  if (!matches.length) fail("Phase 2 incident-scoped task-succession edge","is missing");
  if (matches.length!==1) fail("Phase 2 incident-scoped task-succession edge","is duplicate");
  const edge=matches[0],boundary={version:1,kind:"receipt-bound-task",
    incidentId:edge.incidentId,sourceReceipt:edge.sourceReceipt,
    sourceLineage:{commit:edge.sourceRegistryCommit,tree:edge.sourceLineageTree},
    sourceTaskDigest:edge.sourceTaskDigest};
  if (edge.version!==1||!sha64.test(edge.sourceTaskDigest??"")||
      !sha64.test(edge.destinationTaskDigest??"")||edge.logicalSlice?.kind!=="task"||
      !Number.isInteger(edge.destinationPrerequisiteTaskCount)||
      edge.destinationPrerequisiteTaskCount<0||
      Object.keys(edge.logicalSlice??{}).length!==1||
      !graph.boundaries[edge.sourceTaskDigest]||!graph.boundaries[edge.destinationTaskDigest]||
      taskSuccessionBoundaryDigest(graph.boundaries[edge.sourceTaskDigest])!==
        taskSuccessionBoundaryDigest(boundary)||
      taskSuccessionBoundaryDigest(graph.boundaries[edge.destinationTaskDigest])!==
        taskSuccessionBoundaryDigest(boundary)||
      edge.conservedBoundaryDigest!==taskSuccessionBoundaryDigest(boundary)) {
    fail("Phase 2 incident-scoped task-succession edge","is malformed");
  }
  return edge;
}

export async function validateGovernedPrelaunchIdentities({
  plan,packs,repositoryRoot=process.cwd(),digest,blockedIdentity=blockedAggregateRouteIdentity,
  phase2Authority=phase2ReceiptBoundSuccessionAuthority,
  loadSuccessionGraph=loadTaskSuccessionGraph,
  derivePhase2Sessions=derivePhase2AcceptanceSessionIdentities,
  resolveConsumerSource=defaultConsumerSource,
}={}) {
  if (!governedPlan(plan)) return {applicable:false};
  if (!Array.isArray(packs)||typeof digest!=="function") {
    throw new Error("Governed prelaunch identity validation requires canonical packs and digest");
  }
  const declaration=exactBlockedDeclaration(blockedIdentity);
  let source;
  try { source=await resolveConsumerSource(declaration,repositoryRoot); }
  catch(error) {
    fail("authenticated blocked-aggregate consumer-plan source identity","cannot be resolved",
      error.message);
  }
  if (source.commit!==declaration.consumerSourceCommit||source.tree!==declaration.consumerSourceTree) {
    fail("authenticated blocked-aggregate consumer-plan source identity","does not match",
      `expected ${source.commit}/${source.tree}, observed ${declaration.consumerSourceCommit}/${declaration.consumerSourceTree}`);
  }
  const blockedDigest=digest(blockedAggregateConsumerTaskIdentities(packs));
  if (blockedDigest!==declaration.consumerPlanDigest) {
    fail("authenticated blocked-aggregate consumer-plan digest","does not match",
      `expected ${blockedDigest}, observed ${declaration.consumerPlanDigest}`);
  }

  let graph;
  try { graph=await loadSuccessionGraph(); }
  catch(error) { fail("Phase 2 task-succession authority","cannot be loaded",error.message); }
  const edge=exactPhase2Edge(graph,phase2Authority);
  let sessions;
  try { sessions=await derivePhase2Sessions({packs,repositoryRoot,authority:phase2Authority}); }
  catch(error) {
    fail("Phase 2 current acceptance-session task identity","cannot be derived",error.message);
  }
  if (!sessions.length) fail("Phase 2 current acceptance-session task identity","is missing");
  if (sessions.length!==1) fail("Phase 2 current acceptance-session task identity","is ambiguous");
  const identity=sessions[0],currentDigest=verificationTaskDigest(identity),
    currentCount=identity.prerequisiteTaskKeys?.length??0,
    declaredCount=edge.destinationPrerequisiteTaskCount;
  if (currentDigest!==edge.destinationTaskDigest||currentCount!==declaredCount) {
    fail("Phase 2 receipt-bound acceptance-session destination digest","does not match",
      `expected ${currentDigest}, observed ${edge.destinationTaskDigest}; prerequisite counts expected ${currentCount}, observed ${declaredCount}`);
  }
  return {applicable:true,blockedAggregate:{matches:true,digest:blockedDigest,declaration},
    phase2:{matches:true,digest:currentDigest,prerequisiteTaskCount:currentCount,
      identity,authority:phase2Authority,graph}};
}
