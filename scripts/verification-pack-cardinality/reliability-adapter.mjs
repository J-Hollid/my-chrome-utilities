import path from "node:path";

import { createVerificationPackCardinalityAdapter } from "./contract.mjs";
import { canonicalCheckpointBinding } from "../verification-reliability-receipts.mjs";
import { timeoutRepairCandidate } from "../verification-reliability-repair.mjs";

export function canonicalRepairTaskIdentities(packs, {
  planVerification,
  verificationTaskIdentity,
  incident,
}) {
  const exactRunnablePackIds = createVerificationPackCardinalityAdapter(packs).runnablePackIds;
  const identities=planVerification(packs, { packIds:exactRunnablePackIds, includeProperties:true })
    .tasks.map(verificationTaskIdentity);
  const source=incident?.failure?.task,scope=incident?.failure?.retryScope;
  if(source?.stage!=="acceptance-session"||source.executable!=="bb"||scope?.kind!=="task"||
      scope.taskKey!==source.key||JSON.stringify(scope.executionArgs)!==JSON.stringify(source.args))return identities;
  const canonical=identities.find(identity=>identity.key===source.key);
  if(!canonical||canonical.stage!==source.stage||canonical.packId!==source.packId||
      canonical.executable!==source.executable||JSON.stringify(canonical.environment)!==JSON.stringify(source.environment)||
      JSON.stringify(canonical.requiredCapabilities)!==JSON.stringify(source.requiredCapabilities)||
      source.args?.[0]!=="acceptance-pack-runner"||source.args?.[1]!==source.packId||
      canonical.args?.[0]!==source.args[0]||canonical.args?.[1]!==source.args[1])return identities;
  const canonicalTargets=canonical.target?.split(",")??[],sourceTargets=source.target?.split(",")??[];
  if(!sourceTargets.length||source.args.length!==2+sourceTargets.length*2||
      canonical.args.length!==2+canonicalTargets.length*2)return identities;
  let previousIndex=-1;
  const exactOrderedSubset=sourceTargets.every((target,index)=>{
    const canonicalIndex=canonicalTargets.indexOf(target,previousIndex+1);
    if(canonicalIndex<0)return false;
    previousIndex=canonicalIndex;
    return source.args[2+index*2]===canonical.args[2+canonicalIndex*2]&&
      source.args[3+index*2]===canonical.args[3+canonicalIndex*2];
  });
  return exactOrderedSubset?identities.map(identity=>identity.key===source.key?structuredClone(source):identity):identities;
}

export async function registryDerivedCanonicalRepairTaskIdentities({incident}={}) {
  const { loadVerificationPacks, planVerification, verificationTaskIdentity } =
    await import("../verification-packs.mjs");
  const packs = await loadVerificationPacks();
  return canonicalRepairTaskIdentities(packs, { planVerification, verificationTaskIdentity,incident });
}

export async function registryDerivedCanonicalCheckpointValidator({
  document,
  incident,
  root,
  allowLegacySeparatePackage = false,
}) {
  const [{ validateCanonicalVerificationCheckpoint }, { verificationPacksAtCommit }] = await Promise.all([
    import("../verification-evidence.mjs"),
    import("../verification-changes.mjs"),
  ]);
  const candidate = timeoutRepairCandidate(incident);
  const candidatePacks = await verificationPacksAtCommit(candidate.commit, {
    repositoryRoot:root, historicalRegistryFallback:true,
  });
  const exactRunnablePackIds = createVerificationPackCardinalityAdapter(candidatePacks, {
    allowLegacySourceLess:true,
  }).runnablePackIds;
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
