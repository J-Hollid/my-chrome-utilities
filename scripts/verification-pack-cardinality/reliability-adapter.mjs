import path from "node:path";

import { createVerificationPackCardinalityAdapter } from "./contract.mjs";
import { canonicalCheckpointBinding } from "../verification-reliability-receipts.mjs";
import { timeoutRepairCandidate,validateTaskCheckpointRepairProof } from "../verification-reliability-repair.mjs";
import { normalized, timeoutIncidentDigest } from "../verification-reliability-values.mjs";
import {projectReceiptBoundAcceptanceShardIdentities} from
  "./receipt-bound-acceptance-shard.mjs";

const receiptBoundRepairTaskIdentityProviders = new WeakSet();

function same(left, right) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

export function canonicalRepairTaskIdentities(packs, {
  planVerification,
  verificationTaskIdentity,
  incident,
}) {
  const exactRunnablePackIds = createVerificationPackCardinalityAdapter(packs).runnablePackIds;
  const identities=planVerification(packs, { packIds:exactRunnablePackIds, includeProperties:true })
    .tasks.map(verificationTaskIdentity);
  return projectReceiptBoundAcceptanceShardIdentities(identities,incident);
}

export async function registryDerivedCanonicalRepairTaskIdentities({incident}={}) {
  const { loadVerificationPacks, planVerification, verificationTaskIdentity } =
    await import("../verification-packs.mjs");
  const packs = await loadVerificationPacks();
  return canonicalRepairTaskIdentities(packs, { planVerification, verificationTaskIdentity,incident });
}

export function createReceiptBoundRepairTaskIdentityProvider({
  packs, plan, incident, candidate, baseCommit, evidenceTask, changedPaths, taskCheckpointProof,
  verificationTaskIdentity, currentRegistryLoader, currentCandidateLoader, currentPlanLoader,
}) {
  if(taskCheckpointProof)validateTaskCheckpointRepairProof(incident,taskCheckpointProof);
  const binding=structuredClone({packs,plan,incident:{id:incident?.id,
    failureDigest:incident?.failureDigest,failure:incident?.failure},
  candidate:{commit:candidate?.commit,tree:candidate?.tree},
  baseCommit,evidenceTask,changedPaths});
  if(!binding.incident.id||!binding.incident.failureDigest||!binding.incident.failure?.task||
      (!binding.incident.failure?.retryScope&&!taskCheckpointProof)||!binding.candidate.commit||
      !binding.candidate.tree||!binding.baseCommit||!binding.evidenceTask||
      !Array.isArray(binding.changedPaths)||typeof verificationTaskIdentity!=="function"||
      typeof currentRegistryLoader!=="function"||typeof currentCandidateLoader!=="function"||
      typeof currentPlanLoader!=="function"){
    throw new Error("Receipt-bound repair identity requires complete immutable inputs");
  }
  const identities=canonicalRepairTaskIdentities(binding.packs,{
    planVerification:()=>binding.plan,verificationTaskIdentity,incident:binding.incident,
  });
  const registryDigest=timeoutIncidentDigest(binding.packs);
  const planDigest=timeoutIncidentDigest(binding.plan);
  const provider=async({incident:currentIncident,proposal}={})=>{
    const [currentPacks,currentCandidate]=await Promise.all([
      currentRegistryLoader(),currentCandidateLoader(),
    ]);
    const currentPlan=await currentPlanLoader(currentPacks);
    if(timeoutIncidentDigest(currentPacks)!==registryDigest){
      throw new Error("Receipt-bound repair registry identity changed");
    }
    if(timeoutIncidentDigest(currentPlan)!==planDigest){
      throw new Error("Receipt-bound repair exact plan identity changed");
    }
    if(!same({id:currentIncident?.id,failureDigest:currentIncident?.failureDigest,
      failure:currentIncident?.failure},
      binding.incident)){
      throw new Error("Receipt-bound repair immutable incident changed");
    }
    if(!same({commit:currentCandidate?.commit,tree:currentCandidate?.tree},binding.candidate)||
        !same(proposal?.candidate,binding.candidate)){
      throw new Error("Receipt-bound repair candidate identity changed");
    }
    if(!same(proposal?.changedPaths,binding.changedPaths)||
        !same(proposal?.checkpoint,{baseCommit:binding.baseCommit,evidenceTask:binding.evidenceTask})){
      throw new Error("Receipt-bound repair planning inputs changed");
    }
    return structuredClone(identities);
  };
  receiptBoundRepairTaskIdentityProviders.add(provider);
  return provider;
}

export function trustedRepairTaskIdentityProvider(provider, fallback) {
  if(provider===undefined)return fallback;
  if(typeof provider!=="function"||!receiptBoundRepairTaskIdentityProviders.has(provider)){
    throw new Error("Repair persistence requires a trusted receipt-bound identity provider");
  }
  return provider;
}

export function canonicalCheckpointPackIds(packs) {
  return createVerificationPackCardinalityAdapter(packs, {
    allowLegacySourceLess:true,
  }).runnablePackIds;
}

export async function registryDerivedCanonicalCheckpointValidator({
  document,
  incident,
  root,
  allowLegacySeparatePackage = false,
}) {
  const candidate = timeoutRepairCandidate(incident);
  const [{ validateCanonicalVerificationCheckpoint }, { verificationPacksAtCommit }] = await Promise.all([
    import("../verification-evidence.mjs"),
    import("../verification-changes.mjs"),
  ]);
  const packs = await verificationPacksAtCommit(candidate.commit, {
    repositoryRoot:root,
    historicalRegistryFallback:true,
  });
  const exactRunnablePackIds = canonicalCheckpointPackIds(packs);
  const binding = canonicalCheckpointBinding(incident, document.receipt);
  return validateCanonicalVerificationCheckpoint({
    receiptPath:path.resolve(root, document.path),
    commit:candidate.commit,
    tree:candidate.tree,
    baseCommit:binding.baseCommit,
    evidenceTask:binding.evidenceTask,
    packIds:exactRunnablePackIds,
    repositoryRoot:root,
    allowLegacySeparatePackage,
    allowLegacyTerminalClosure:allowLegacySeparatePackage,
  });
}
