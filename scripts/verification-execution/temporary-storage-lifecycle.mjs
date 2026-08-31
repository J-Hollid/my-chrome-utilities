import { createHash } from "node:crypto";
import { readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";

const systemTemporaryRoot = "/tmp";

function digest(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export function verificationRepositoryIdentity(repositoryRoot) {
  return digest(path.resolve(repositoryRoot));
}

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
  const repositoryIdentity = verificationRepositoryIdentity(repositoryRoot);
  return {
    repositoryIdentity,
    workspaceCapacityDirectory:repositoryRoot,
    chromeCapacityDirectory:temporaryRoot,
    runDirectory:path.join(repositoryRoot, "tmp", "verification-runs", runId),
    systemDirectory:path.join(repositoryRoot, "tmp", "verification-runs", runId, "system-temp"),
    chromeDirectory:path.join(temporaryRoot, "sf-chrome", repositoryIdentity, digest(runId)),
  };
}

export function plannedTemporaryRequirement({ tasks, concurrency,
  observationConcurrency = 2, receiptOutputLimitBytes }) {
  if (!Array.isArray(tasks) || !Number.isSafeInteger(concurrency) || concurrency < 1 ||
      !Number.isSafeInteger(observationConcurrency) || observationConcurrency < 1 ||
      !Number.isSafeInteger(receiptOutputLimitBytes) || receiptOutputLimitBytes < 0) {
    throw new Error("Temporary requirement needs tasks, execution concurrency, observation concurrency, and receipt output bytes");
  }
  const poolLimit = (stage) => stage === "browser" ? 1
    : stage === "browser-observation" ? observationConcurrency
      : ["build", "checkpoint", "package"].includes(stage) ? 1 : concurrency;
  const stageRequirements = new Map();
  for (const task of tasks) {
    const stage = task.stage ?? "unit";
    const chrome = task.temporaryPathClass === "chrome-short" ||
      ["browser", "browser-observation"].includes(stage);
    const workspace = !chrome || stage === "acceptance-session";
    const temporaryBytes = task.temporaryRequirementBytes ?? (chrome
      ? 134_217_728 : stage === "acceptance-session" ? 67_108_864 : 16_777_216);
    const requirement = { workspaceBytes:receiptOutputLimitBytes +
      (workspace ? temporaryBytes : 0), chromeBytes:chrome ? temporaryBytes : 0 };
    const group = stageRequirements.get(stage) ?? [];
    group.push(requirement);
    stageRequirements.set(stage, group);
  }
  const concurrentTotal = (requirements, field, limit) => requirements
    .map((requirement) => requirement[field]).sort((left, right) => right - left)
    .slice(0, limit).reduce((total, value) => total + value, 0);
  let workspaceBytes = 0, chromeBytes = 0;
  for (const [stage, requirements] of stageRequirements) {
    workspaceBytes = Math.max(workspaceBytes,
      concurrentTotal(requirements, "workspaceBytes", poolLimit(stage)));
    chromeBytes = Math.max(chromeBytes,
      concurrentTotal(requirements, "chromeBytes", poolLimit(stage)));
  }
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

export async function currentProcessStartIdentity(pid, { read = readFile } = {}) {
  if (!Number.isInteger(pid) || pid < 1) {
    throw new Error("Process start identity requires a positive process id");
  }
  const [bootIdentity, processStat] = await Promise.all([
    read("/proc/sys/kernel/random/boot_id", "utf8"),
    read(`/proc/${pid}/stat`, "utf8"),
  ]);
  const commandEnd = processStat.lastIndexOf(")");
  const fields = commandEnd < 0 ? [] : processStat.slice(commandEnd + 1).trim().split(/\s+/u);
  const startTicks = fields[19];
  const boot = bootIdentity.trim();
  if (!boot || !/^\d+$/u.test(startTicks ?? "")) {
    throw new Error(`Process ${pid} has no stable start identity`);
  }
  return `${boot}:${startTicks}`;
}

export async function processOwnerIsLive(owner, {
  currentStartIdentity = currentProcessStartIdentity,
} = {}) {
  if (!Number.isInteger(owner?.pid) || owner.pid < 1) return false;
  if (typeof owner.processStartIdentity !== "string" || !owner.processStartIdentity) {
    return processIsAlive(owner.pid);
  }
  try {
    return await currentStartIdentity(owner.pid) === owner.processStartIdentity;
  } catch (error) {
    if (["ENOENT", "ESRCH"].includes(error.code)) return false;
    throw error;
  }
}

function pathIsInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function ownedChildRecords(parent, { repositoryRoot, repositoryIdentity, legacyLocal,
  ownerAlive, receiptComplete, leaseActive }) {
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
      const receiptOwned = typeof marker.receiptPath === "string" &&
        pathIsInside(repositoryRoot, marker.receiptPath);
      const currentOwnership = [2, 3].includes(marker.version) &&
        marker.repositoryIdentity === repositoryIdentity;
      const ownershipVerified = (currentOwnership || (legacyLocal && marker.version === 1)) &&
        marker.path === ownedPath && receiptOwned &&
        typeof marker.runId === "string" && marker.runId.length > 0;
      records.push({ runId:marker.runId, owner:marker.owner, path:ownedPath, ownershipVerified,
        ownerLive:ownershipVerified && await ownerAlive(marker),
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
  temporaryRoot = systemTemporaryRoot, ownerAlive = processOwnerIsLive,
  receiptComplete = receiptDispositionComplete, leaseActive = async(marker) =>
    marker.activeLease === true, remove = (target) => rm(target, { recursive:true, force:true }) } = {}) {
  const repositoryIdentity = verificationRepositoryIdentity(repositoryRoot);
  const parents = [{ path:path.join(repositoryRoot, "tmp", "verification-runs"), legacyLocal:true },
    { path:path.join(temporaryRoot, "sf-chrome", repositoryIdentity), legacyLocal:false }];
  const records = (await Promise.all(parents.map((parent) =>
    ownedChildRecords(parent.path, { repositoryRoot, repositoryIdentity,
      legacyLocal:parent.legacyLocal, ownerAlive, receiptComplete, leaseActive })))).flat();
  const results = [];
  for (const record of records) {
    try { results.push(await recoverOwnedTemporaryPath({ record, remove })); }
    catch (error) { results.push({ status:"failed", path:record.path, reason:error.message }); }
  }
  return results;
}
