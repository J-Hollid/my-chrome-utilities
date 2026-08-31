import { mkdir, statfs } from "node:fs/promises";
import path from "node:path";

import { atomicWriteFile } from "../dist-artifact.mjs";
import {
  cleanupOwnedTemporaryPaths,
  recoverVerificationTemporaryStorage,
  temporaryCapacityPreflight,
} from "./temporary-storage-lifecycle.mjs";

const activeContexts = new Set();

function environmentByteCount(name, fallback) {
  if (process.env[name] === undefined) return fallback;
  const value = Number(process.env[name]);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a nonnegative byte count`);
  }
  return value;
}

async function assertTemporaryCapacity(directory) {
  const requiredBytes = environmentByteCount("VERIFICATION_TEMPORARY_REQUIRED_BYTES", 0);
  const reserveBytes = environmentByteCount("VERIFICATION_TEMPORARY_RESERVE_BYTES", 536_870_912);
  const fileSystem = await statfs(directory);
  const result = temporaryCapacityPreflight({ requiredBytes,
    availableBytes:Number(fileSystem.bavail) * Number(fileSystem.bsize), reserveBytes });
  if (!result.permitted) {
    throw new Error(`Temporary storage capacity is insufficient: required ${result.requiredBytes} bytes, available ${result.availableBytes} bytes after reserve`);
  }
  return result;
}

export function trackVerificationTemporaryContext(context) {
  activeContexts.add(context);
  return context;
}

export async function prepareVerificationTemporaryPath(context, target, owner) {
  await mkdir(target, { recursive:true });
  const ownedRoot = target === context.temporaryPaths.chromeDirectory
    ? context.temporaryPaths.chromeDirectory : context.temporaryPaths.runDirectory;
  await mkdir(ownedRoot, { recursive:true });
  await atomicWriteFile(path.join(ownedRoot, ".swarmforge-temporary-owner.json"),
    `${JSON.stringify({ version:1, runId:context.receipt.runId, owner, path:ownedRoot,
      pid:process.pid, receiptPath:context.receiptPath }, null, 2)}\n`);
  await assertTemporaryCapacity(target);
}

async function cleanupContext(context) {
  const durableDispositionComplete = Boolean(context.receipt.completedAt ||
    context.receipt.environmentPrerequisiteBlocked?.length ||
    Object.values(context.receipt.tasks).some(({ status }) =>
      ["failed", "cancelled", "interrupted"].includes(status)));
  const common = { runId:context.receipt.runId, ownershipVerified:true,
    ownerLive:false, durableDispositionComplete };
  const result = await cleanupOwnedTemporaryPaths([
    { ...common, owner:"verification-run", path:context.temporaryPaths.runDirectory },
    { ...common, owner:"chrome", path:context.temporaryPaths.chromeDirectory },
  ]);
  for (const item of [...result.failures, ...result.retained]) {
    console.error(`[verify:temporary-retained] run=${item.runId} owner=${item.owner} path=${item.path} reason=${item.reason}`);
  }
  return result;
}

export async function cleanupActiveVerificationTemporaryStorage() {
  const contexts = [...activeContexts];
  activeContexts.clear();
  return Promise.all(contexts.map(cleanupContext));
}

export async function recoverVerificationTemporaryStorageAtStartup(repositoryRoot) {
  return recoverVerificationTemporaryStorage({ repositoryRoot });
}
