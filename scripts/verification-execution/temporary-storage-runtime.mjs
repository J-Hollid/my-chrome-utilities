import { mkdir, statfs } from "node:fs/promises";
import path from "node:path";

import { atomicWriteFile } from "../dist-artifact.mjs";
import { currentProcessStartIdentity } from "./process-owner-liveness.mjs";
import {
  cleanupOwnedTemporaryPaths,
  ownedTemporaryChildRuns,
  plannedTemporaryRequirement,
  recoverVerificationTemporaryStorage,
  temporaryCapacityPreflight,
} from "./temporary-storage-lifecycle.mjs";

const activeContexts = new Set();

async function assertTemporaryCapacity(directory, requiredBytes, statFileSystem = statfs) {
  const reserveBytes = 67_108_864;
  const fileSystem = await statFileSystem(directory);
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

export async function preflightVerificationTemporaryCapacity(context, { tasks, concurrency,
  observationConcurrency = 2, receiptOutputLimitBytes, statFileSystem = statfs }) {
  const requirement=plannedTemporaryRequirement({ tasks, concurrency, observationConcurrency,
    receiptOutputLimitBytes });
  const [workspace, chrome]=await Promise.all([
    assertTemporaryCapacity(context.temporaryPaths.workspaceCapacityDirectory,
      requirement.workspaceBytes, statFileSystem),
    assertTemporaryCapacity(context.temporaryPaths.chromeCapacityDirectory,
      requirement.chromeBytes, statFileSystem),
  ]);
  context.temporaryCapacity={ requirement, workspace, chrome };
  return context.temporaryCapacity;
}

export async function prepareVerificationTemporaryPath(context, target, owner) {
  if (!context.temporaryCapacity) {
    throw new Error("Temporary storage capacity preflight must complete before path creation");
  }
  await mkdir(target, { recursive:true });
  const ownedRoot = target === context.temporaryPaths.chromeDirectory
    ? context.temporaryPaths.chromeDirectory : context.temporaryPaths.runDirectory;
  await mkdir(ownedRoot, { recursive:true });
  const processStartIdentity = await currentProcessStartIdentity(process.pid);
  await atomicWriteFile(path.join(ownedRoot, ".swarmforge-temporary-owner.json"),
    `${JSON.stringify({ version:3, repositoryIdentity:context.temporaryPaths.repositoryIdentity,
      runId:context.receipt.runId, owner, path:ownedRoot, pid:process.pid,
      processStartIdentity, receiptPath:context.receiptPath }, null, 2)}\n`);
}

async function cleanupContext(context) {
  const durableDispositionComplete = Boolean(context.receipt.completedAt ||
    context.receipt.environmentPrerequisiteBlocked?.length ||
    Object.values(context.receipt.tasks).some(({ status }) =>
      ["failed", "cancelled", "interrupted"].includes(status)));
  const common = { runId:context.receipt.runId, ownershipVerified:true,
    ownerLive:false, activeLease:false, durableDispositionComplete };
  const childRuns = durableDispositionComplete ? await ownedTemporaryChildRuns({
    repositoryRoot:context.temporaryPaths.workspaceCapacityDirectory,
    parentRunDirectory:context.temporaryPaths.runDirectory,
  }) : [];
  const protectedChild = childRuns.find(({ ownershipVerified, ownerLive, activeLease,
    durableDispositionComplete:childDispositionComplete }) =>
    !ownershipVerified || ownerLive || activeLease || !childDispositionComplete);
  const result = await cleanupOwnedTemporaryPaths([
    { ...common, owner:"verification-run", path:context.temporaryPaths.runDirectory,
      protectionReason:protectedChild ? "protected child run" : null },
    { ...common, owner:"chrome", path:context.temporaryPaths.chromeDirectory },
    ...childRuns,
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
