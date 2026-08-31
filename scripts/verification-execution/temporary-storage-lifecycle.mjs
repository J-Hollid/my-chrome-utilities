import { createHash } from "node:crypto";
import { readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";

const systemTemporaryRoot = "/tmp";

function retained(record, reason) {
  return { runId:record.runId, owner:record.owner, path:record.path, reason };
}

function cleanupProtection(record) {
  if (!record.ownershipVerified) return "ownership not verified";
  if (record.ownerLive) return "live owner";
  if (record.activeLease) return "active lease";
  if (!record.durableDispositionComplete) return "durable disposition incomplete";
  return null;
}

export function verificationTemporaryPaths({ repositoryRoot, runId,
  temporaryRoot = systemTemporaryRoot }) {
  if (!runId || typeof runId !== "string") throw new Error("Temporary storage requires a run id");
  return {
    workspaceCapacityDirectory:repositoryRoot,
    chromeCapacityDirectory:temporaryRoot,
    runDirectory:path.join(repositoryRoot, "tmp", "verification-runs", runId),
    systemDirectory:path.join(repositoryRoot, "tmp", "verification-runs", runId, "system-temp"),
    chromeDirectory:path.join(temporaryRoot, "sf-chrome",
      createHash("sha256").update(runId).digest("hex").slice(0, 24)),
  };
}

export function plannedTemporaryRequirement({ tasks, concurrency,
  receiptOutputLimitBytes }) {
  if (!Array.isArray(tasks) || !Number.isSafeInteger(concurrency) || concurrency < 1 ||
      !Number.isSafeInteger(receiptOutputLimitBytes) || receiptOutputLimitBytes < 0) {
    throw new Error("Temporary requirement needs tasks, concurrency, and receipt output bytes");
  }
  const workspaceTaskBytes = tasks.filter((task) =>
    task.temporaryPathClass !== "chrome-short" && !["browser", "browser-observation"]
      .includes(task.stage)).map((task) => task.temporaryRequirementBytes ??
        (task.stage === "acceptance-session" ? 67_108_864 : 16_777_216));
  const chromeTaskBytes = tasks.filter((task) => task.temporaryPathClass === "chrome-short" ||
    ["browser", "browser-observation"].includes(task.stage))
    .map((task) => task.temporaryRequirementBytes ?? 134_217_728);
  const workspaceBytes = Math.max(0, ...workspaceTaskBytes) +
    concurrency * receiptOutputLimitBytes;
  const chromeBytes = Math.max(0, ...chromeTaskBytes);
  return { workspaceBytes, chromeBytes, requiredBytes:workspaceBytes + chromeBytes };
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
  if (record.activeLease) return { status:"retained", path:record.path, reason:"active lease" };
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

async function ownedChildRecords(parent, { ownerAlive, receiptComplete, leaseActive }) {
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
        activeLease:ownershipVerified && await leaseActive(marker),
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
  receiptComplete = receiptDispositionComplete, leaseActive = async(marker) =>
    marker.activeLease === true, remove = (target) => rm(target, { recursive:true, force:true }) } = {}) {
  const parents = [path.join(repositoryRoot, "tmp", "verification-runs"),
    path.join(temporaryRoot, "sf-chrome")];
  const records = (await Promise.all(parents.map((parent) =>
    ownedChildRecords(parent, { ownerAlive, receiptComplete, leaseActive })))).flat();
  const results = [];
  for (const record of records) {
    try { results.push(await recoverOwnedTemporaryPath({ record, remove })); }
    catch (error) { results.push({ status:"failed", path:record.path, reason:error.message }); }
  }
  return results;
}
