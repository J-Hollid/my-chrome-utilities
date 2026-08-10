import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import {
  normalized, timeoutIncidentDigest, timeoutRepairPackIds,
} from "./verification-reliability-values.mjs";
import { timeoutRepairCandidate } from "./verification-reliability-repair.mjs";
import {
  boundedClosureContractRevision,
  boundedClosureEvidenceTask,
} from "./verification-reliability-closure.mjs";

export async function receiptDocument(root, receiptPath) {
  if (typeof receiptPath !== "string" || !receiptPath) throw new Error("Provide a runner receipt path");
  const resolved = path.resolve(root, receiptPath);
  const receiptRoot = path.resolve(root, "tmp", "verification-receipts");
  if (resolved !== receiptRoot && !resolved.startsWith(`${receiptRoot}${path.sep}`)) {
    throw new Error("Runner receipts must be under tmp/verification-receipts");
  }
  const details = await lstat(resolved);
  if (!details.isFile() || details.isSymbolicLink() || await realpath(resolved) !== resolved) {
    throw new Error("Runner receipt must be a canonical regular file");
  }
  const bytes = await readFile(resolved);
  let receipt;
  try { receipt = JSON.parse(bytes); }
  catch (error) { throw new Error(`Cannot parse runner receipt: ${error.message}`); }
  if (receipt.version !== 2 || !receipt.runId || !receipt.completedAt ||
      !receipt.candidate?.commit || !receipt.candidate?.tree ||
      !receipt.tasks || Array.isArray(receipt.tasks)) {
    throw new Error("Runner receipt is incomplete");
  }
  return { path:path.relative(root, resolved), receipt, bytes, sha256:timeoutIncidentDigest(bytes) };
}

export function freshPassingReceipt(document, candidate, description) {
  const tasks = Object.entries(document.receipt.tasks);
  if (!tasks.length || document.receipt.candidate.commit !== candidate.commit ||
      document.receipt.candidate.tree !== candidate.tree ||
      tasks.some(([, task]) => task.status !== "passed" || task.provenance !== "fresh")) {
    throw new Error(`${description} requires a complete fresh passing runner receipt from the repair tree`);
  }
  return tasks;
}

export function canonicalCheckpointBinding(incident, receipt) {
  const boundedClosure = receipt?.candidate?.baseCommit === boundedClosureContractRevision &&
    receipt?.candidate?.evidenceTask === boundedClosureEvidenceTask &&
    incident.closureAudit?.kind === "blocking-verification-repair";
  return boundedClosure ? {
    baseCommit:receipt.candidate.baseCommit,
    evidenceTask:receipt.candidate.evidenceTask,
  } : structuredClone(incident.repair.checkpoint);
}

export async function defaultCanonicalCheckpointValidator({
  document, incident, root, allowLegacySeparatePackage = false,
}) {
  const { validateCanonicalVerificationCheckpoint } = await import("./verification-evidence.mjs");
  const candidate = timeoutRepairCandidate(incident);
  const binding = canonicalCheckpointBinding(incident, document.receipt);
  return validateCanonicalVerificationCheckpoint({
    receiptPath:path.resolve(root, document.path),
    commit:candidate.commit,
    tree:candidate.tree,
    baseCommit:binding.baseCommit,
    evidenceTask:binding.evidenceTask,
    packIds:timeoutRepairPackIds,
    repositoryRoot:root,
    allowLegacySeparatePackage,
  });
}

export async function defaultCanonicalRepairTaskIdentities() {
  const { loadVerificationPacks, planVerification, verificationTaskIdentity } =
    await import("./verification-packs.mjs");
  const packs = await loadVerificationPacks();
  return planVerification(packs, { packIds:timeoutRepairPackIds, includeProperties:true })
    .tasks.map(verificationTaskIdentity);
}

export const timeoutRepairPackageTaskIdentity = Object.freeze({
  key:"package:extension", stage:"package", packId:null, executable:"node",
  args:["scripts/package.mjs"], target:"build/package/my-chrome-utilities.zip", environment:null,
  requiredCapabilities:[],
});

export function validatePackageReceipt(
  document, checkpointDocument, incident, { allowLegacyPrerequisites = false } = {},
) {
  const receipt = document.receipt;
  const entries = Object.entries(receipt.tasks);
  const [key, result] = entries[0] ?? [];
  const packageStartedAt = Date.parse(receipt.startedAt);
  const checkpointCompletedAt = Date.parse(checkpointDocument.receipt.completedAt);
  const candidate = timeoutRepairCandidate(incident);
  if (receipt.candidate.commit !== candidate.commit ||
      receipt.candidate.tree !== candidate.tree ||
      receipt.plan?.mode !== "package" ||
      receipt.plan?.checkpointRunId !== checkpointDocument.receipt.runId ||
      !Number.isFinite(packageStartedAt) || !Number.isFinite(checkpointCompletedAt) ||
      packageStartedAt < checkpointCompletedAt ||
      entries.length !== 1 || key !== timeoutRepairPackageTaskIdentity.key || result.status !== "passed" ||
      result.provenance !== "fresh" || !Number.isFinite(result.durationMs) ||
      ![timeoutRepairPackageTaskIdentity,
        ...(allowLegacyPrerequisites ? [Object.fromEntries(
          Object.entries(timeoutRepairPackageTaskIdentity)
            .filter(([field]) => field !== "requiredCapabilities"),
        )] : []),
      ].some((identity) => JSON.stringify(normalized(result.identity)) ===
        JSON.stringify(normalized(identity))) ||
      result.output?.trim() !== timeoutRepairPackageTaskIdentity.target) {
    throw new Error("Resolution requires a runner-owned package command receipt after the checkpoint");
  }
  return result;
}
