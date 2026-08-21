import path from "node:path";

import { createVerificationPackCardinalityAdapter } from "./contract.mjs";
import { canonicalCheckpointBinding } from "../verification-reliability-receipts.mjs";
import { timeoutRepairCandidate } from "../verification-reliability-repair.mjs";

export function canonicalRepairTaskIdentities(packs, {
  planVerification,
  verificationTaskIdentity,
}) {
  const exactRunnablePackIds = createVerificationPackCardinalityAdapter(packs).runnablePackIds;
  return planVerification(packs, { packIds:exactRunnablePackIds, includeProperties:true })
    .tasks.map(verificationTaskIdentity);
}

export async function registryDerivedCanonicalRepairTaskIdentities() {
  const { loadVerificationPacks, planVerification, verificationTaskIdentity } =
    await import("../verification-packs.mjs");
  const packs = await loadVerificationPacks();
  return canonicalRepairTaskIdentities(packs, { planVerification, verificationTaskIdentity });
}

export async function registryDerivedCanonicalCheckpointValidator({
  document,
  incident,
  root,
  allowLegacySeparatePackage = false,
}) {
  const [{ validateCanonicalVerificationCheckpoint }, { loadVerificationPacks }] = await Promise.all([
    import("../verification-evidence.mjs"),
    import("../verification-packs.mjs"),
  ]);
  const packs = await loadVerificationPacks();
  const exactRunnablePackIds = createVerificationPackCardinalityAdapter(packs).runnablePackIds;
  const candidate = timeoutRepairCandidate(incident);
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
