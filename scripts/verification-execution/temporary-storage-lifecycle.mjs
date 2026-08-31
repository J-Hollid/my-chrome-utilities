import { readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";

const systemTemporaryRoot = "/tmp";

function retained(record, reason) {
  return { runId:record.runId, owner:record.owner, path:record.path, reason };
}

function cleanupProtection(record) {
  if (!record.ownershipVerified) return "ownership not verified";
  if (record.ownerLive) return "live owner";
  if (!record.durableDispositionComplete) return "durable disposition incomplete";
  return null;
}

export function verificationTemporaryPaths({ repositoryRoot, runId,
  temporaryRoot = systemTemporaryRoot }) {
  if (!runId || typeof runId !== "string") throw new Error("Temporary storage requires a run id");
  return {
    runDirectory:path.join(repositoryRoot, "tmp", "verification-runs", runId),
    systemDirectory:path.join(repositoryRoot, "tmp", "verification-runs", runId, "system-temp"),
    chromeDirectory:path.join(temporaryRoot, "sf-chrome", runId.slice(0, 8)),
  };
}

export function temporaryCapacityPreflight({ requiredBytes, availableBytes, reserveBytes }) {
  for (const [name, value] of Object.entries({ requiredBytes, availableBytes, reserveBytes })) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Temporary capacity ${name} must be a nonnegative byte count`);
    }
  }
  const usableBytes = Math.max(0, availableBytes - reserveBytes);
  return { permitted:usableBytes >= requiredBytes, requiredBytes,
    availableBytes:usableBytes, reserveBytes };
}

export async function cleanupOwnedTemporaryPaths(records, { remove = (target) =>
  rm(target, { recursive:true, force:true }) } = {}) {
  const removed = [], retainedPaths = [], failures = [];
  await Promise.all(records.map(async(record) => {
    const protection = cleanupProtection(record);
    if (protection) {
      retainedPaths.push(retained(record, protection));
      return;
    }
    try {
      await remove(record.path);
      removed.push(record.path);
    } catch (error) {
      failures.push(retained(record, error.message));
    }
  }));
  return {
    removed:removed.sort(),
    retained:retainedPaths.sort((left, right) => left.path.localeCompare(right.path)),
    failures:failures.sort((left, right) => left.path.localeCompare(right.path)),
  };
}

export async function recoverOwnedTemporaryPath({ record, recoverDisposition,
  remove = (target) => rm(target, { recursive:true, force:true }) }) {
  if (!record.ownershipVerified) {
    return { status:"retained", path:record.path, reason:"ownership not verified" };
  }
  if (record.ownerLive) return { status:"retained", path:record.path, reason:"live owner" };
  let dispositionComplete = record.durableDispositionComplete;
  if (!dispositionComplete && recoverDisposition) dispositionComplete = await recoverDisposition(record);
  if (!dispositionComplete) {
    return { status:"retained", path:record.path, reason:"durable disposition incomplete" };
  }
  await remove(record.path);
  return { status:"removed", path:record.path };
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; }
  catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

async function ownedChildRecords(parent, { ownerAlive, receiptComplete }) {
  let entries;
  try { entries = await readdir(parent, { withFileTypes:true }); }
  catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const records = [];
  for (const entry of entries.filter((item) => item.isDirectory())) {
    const ownedPath = path.join(parent, entry.name);
    try {
      const marker = JSON.parse(await readFile(path.join(ownedPath,
        ".swarmforge-temporary-owner.json"), "utf8"));
      const ownershipVerified = marker.version === 1 && marker.path === ownedPath &&
        typeof marker.runId === "string" && marker.runId.length > 0;
      records.push({ runId:marker.runId, owner:marker.owner, path:ownedPath, ownershipVerified,
        ownerLive:ownershipVerified && await ownerAlive(marker.pid),
        durableDispositionComplete:ownershipVerified && await receiptComplete(marker) });
    } catch (error) {
      if (error.code !== "ENOENT") {
        records.push({ runId:"unknown", owner:"unknown", path:ownedPath,
          ownershipVerified:false, ownerLive:false, durableDispositionComplete:false });
      }
    }
  }
  return records;
}

async function receiptDispositionComplete(marker) {
  try {
    const receipt = JSON.parse(await readFile(marker.receiptPath, "utf8"));
    return receipt.runId === marker.runId && Boolean(receipt.completedAt ||
      Object.values(receipt.tasks ?? {}).some(({ status }) =>
        ["failed", "cancelled", "interrupted"].includes(status)));
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function recoverVerificationTemporaryStorage({ repositoryRoot,
  temporaryRoot = systemTemporaryRoot, ownerAlive = processIsAlive,
  receiptComplete = receiptDispositionComplete } = {}) {
  const parents = [path.join(repositoryRoot, "tmp", "verification-runs"),
    path.join(temporaryRoot, "sf-chrome")];
  const records = (await Promise.all(parents.map((parent) =>
    ownedChildRecords(parent, { ownerAlive, receiptComplete })))).flat();
  const results = [];
  for (const record of records) results.push(await recoverOwnedTemporaryPath({ record }));
  return results;
}
