import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  atomicReplace, defaultRepositoryRuntimeDirectory, ensureSafeDirectory, withIncidentLock,
} from "./verification-reliability-persistence.mjs";

export async function eligibleRepairReviewTransactionDirectory(root) {
  return ensureSafeDirectory(path.join(await defaultRepositoryRuntimeDirectory(root),
    "eligible-repair-review-transactions"));
}

export async function readEligibleRepairReviewTransaction(target) {
  try { return JSON.parse(await readFile(target, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

export async function writeEligibleRepairReviewTransaction(target, journal) {
  await atomicReplace(target, journal);
  return journal;
}

export async function withEligibleRepairReviewTransactionLock(root, candidateCommit, operation) {
  const directory = await eligibleRepairReviewTransactionDirectory(root);
  return withIncidentLock(directory, `review-note-${candidateCommit}`,
    () => operation({ directory }));
}
