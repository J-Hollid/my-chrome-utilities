import path from "node:path";

import { createVerificationPackCardinalityAdapter } from "./contract.mjs";
import { canonicalCheckpointBinding } from "../verification-reliability-receipts.mjs";
import { timeoutRepairCandidate } from "../verification-reliability-repair.mjs";

export function canonicalRepairTaskIdentities(packs, {
  planVerification,
  verificationTaskIdentity,
}) {
  const exactRunnablePackIds = createVerificationPackCardinalityAdapter(packs).runnablePackIds;
  const identities=planVerification(packs, { packIds:exactRunnablePackIds, includeProperties:true })
    .tasks.map(verificationTaskIdentity);
  return identities;
}

export async function registryDerivedCanonicalRepairTaskIdentities({incident}={}) {
  const { loadVerificationPacks, planVerification, verificationTaskIdentity } =
    await import("../verification-packs.mjs");
  const packs = await loadVerificationPacks();
  return canonicalRepairTaskIdentities(packs, { planVerification, verificationTaskIdentity,incident });
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
