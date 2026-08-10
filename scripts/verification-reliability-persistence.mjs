import { createHash, randomUUID } from "node:crypto";
import {
  lstat, mkdir, open, readFile, realpath, rename, rm, writeFile,
} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { setTimeout as pause } from "node:timers/promises";

import {
  exactObject, git, normalized, shaPattern, stableIncidentId, timeoutIncidentDigest,
} from "./verification-reliability-values.mjs";

export async function defaultRepositoryRuntimeDirectory(root) {
  const common = await git(root, "rev-parse", "--git-common-dir");
  const commonDirectory = path.isAbsolute(common) ? common : path.resolve(root, common);
  const repositoryIdentity = createHash("sha256").update(path.resolve(commonDirectory)).digest("hex");
  return path.join(os.tmpdir(), "swarmforge-repository-runtime", repositoryIdentity);
}

export async function defaultStoreDirectory(root) {
  return path.join(await defaultRepositoryRuntimeDirectory(root), "reliability-incidents");
}

export async function ensureSafeDirectory(directory, { create = true } = {}) {
  const resolved = path.resolve(directory);
  try {
    const details = await lstat(resolved);
    if (details.isSymbolicLink()) throw new Error(`Reliability incident store is redirected by a symlink: ${resolved}`);
    if (!details.isDirectory()) throw new Error(`Reliability incident store is not a directory: ${resolved}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    if (!create) return undefined;
    await mkdir(resolved, { recursive:true });
  }
  if (await realpath(resolved) !== resolved) {
    throw new Error(`Reliability incident store is redirected outside its canonical path: ${resolved}`);
  }
  return resolved;
}

export function incidentEnvelope(incident) {
  return { version:1, incident, digest:timeoutIncidentDigest(incident) };
}

function transitionHistoryError(id, message) {
  throw new Error(`Reliability incident ${id} has invalid transition history: ${message}`);
}

function matchingTransitions(incident, type) {
  return incident.transitions.filter((record) => record?.type === type);
}

function validateTransitionHistory(incident) {
  const allowed = new Set(["diagnostic-retry-claimed", "diagnostic-retry-classified",
    "repair-proposed", "repair-checkpoint-claimed", "repair-checkpoint-reclaimed", "resolved", "lineage-rebased",
    "lineage-abandoned"]);
  let previousTime = Date.parse(incident.createdAt);
  let previousRank = 0;
  let terminal = false;
  const rank = { "diagnostic-retry-claimed":10, "diagnostic-retry-classified":20,
    "repair-proposed":30, "repair-checkpoint-claimed":40, resolved:50 };
  if (!Number.isFinite(previousTime)) transitionHistoryError(incident.id, "invalid created timestamp");
  for (const record of incident.transitions) {
    if (terminal) transitionHistoryError(incident.id, "an event follows the resolved transition");
    exactObject(record, "Reliability incident transition");
    const time = Date.parse(record.at);
    if (!allowed.has(record.type) || !Number.isFinite(time)) {
      transitionHistoryError(incident.id, "unknown transition or timestamp");
    }
    if (time < previousTime) transitionHistoryError(incident.id, "timestamps are out of order");
    previousTime = time;
    if (rank[record.type]) {
      if (rank[record.type] <= previousRank) transitionHistoryError(incident.id, "events are duplicated or reordered");
      previousRank = rank[record.type];
    }
    if (record.type === "resolved") terminal = true;
  }
  const requireCount = (type, expected) => {
    if (matchingTransitions(incident, type).length !== expected) {
      transitionHistoryError(incident.id, `${type} event does not agree with incident state`);
    }
  };
  const retryStatus = incident.retry?.status;
  if (retryStatus !== undefined && !["claimed", "classified", "invalidated-by-repair"].includes(retryStatus)) {
    transitionHistoryError(incident.id, "diagnostic status is unknown");
  }
  if (["claimed", "classified"].includes(retryStatus) &&
      incident.retry.identity !== incident.failure.retryIdentity) {
    transitionHistoryError(incident.id, "diagnostic identity disagrees with the failure");
  }
  const classifications = { passed:"confirmed-flaky", sameFailure:"reproduced-failure",
    failed:"changed-failure", identityChanged:"diagnostic-contract-failure" };
  if (retryStatus === "classified" &&
      classifications[incident.retry.outcome] !== incident.retry.classification) {
    transitionHistoryError(incident.id, "diagnostic outcome and classification disagree");
  }
  if (retryStatus === "invalidated-by-repair" &&
      incident.retry.classification !== "not-retried-repaired") {
    transitionHistoryError(incident.id, "repair invalidation classification disagrees");
  }
  if (incident.repair && incident.repair.status !== "eligible") {
    transitionHistoryError(incident.id, "repair proposal is not eligible");
  }
  if (incident.repairCheckpoint && incident.repairCheckpoint.status !== "claimed") {
    transitionHistoryError(incident.id, "repair checkpoint is not claimed");
  }
  if (incident.repairCheckpoint && !incident.repair) {
    transitionHistoryError(incident.id, "checkpoint claim has no repair proposal");
  }
  if (incident.state === "resolved" && (!incident.repair || !incident.repairCheckpoint || !incident.retry)) {
    transitionHistoryError(incident.id, "resolution is missing diagnostic, repair, or checkpoint state");
  }
  requireCount("diagnostic-retry-claimed", ["claimed", "classified"].includes(retryStatus) ? 1 : 0);
  requireCount("diagnostic-retry-classified", retryStatus === "classified" ? 1 : 0);
  requireCount("repair-proposed", incident.repair ? 1 : 0);
  requireCount("repair-checkpoint-claimed", incident.repairCheckpoint ? 1 : 0);
  requireCount("repair-checkpoint-reclaimed", Number(incident.repairCheckpoint?.reclaimCount ?? 0));
  requireCount("resolved", incident.state === "resolved" ? 1 : 0);
  const claimed = matchingTransitions(incident, "diagnostic-retry-claimed")[0];
  if (claimed && claimed.at !== incident.retry.claimedAt) {
    transitionHistoryError(incident.id, "diagnostic claim timestamp disagrees");
  }
  const classified = matchingTransitions(incident, "diagnostic-retry-classified")[0];
  if (classified && (classified.at !== incident.retry.classifiedAt ||
      classified.classification !== incident.retry.classification)) {
    transitionHistoryError(incident.id, "diagnostic classification disagrees");
  }
  const repair = matchingTransitions(incident, "repair-proposed")[0];
  if (repair && repair.commit !== incident.repair.candidate?.commit) {
    transitionHistoryError(incident.id, "repair candidate disagrees");
  }
  const checkpoint = [...matchingTransitions(incident, "repair-checkpoint-claimed"),
    ...matchingTransitions(incident, "repair-checkpoint-reclaimed")].at(-1);
  if (checkpoint && (checkpoint.runId !== incident.repairCheckpoint.runId ||
      checkpoint.at !== incident.repairCheckpoint.claimedAt)) {
    transitionHistoryError(incident.id, "checkpoint claim disagrees");
  }
  const resolved = matchingTransitions(incident, "resolved")[0];
  if (resolved && (resolved.resolutionDigest !== incident.resolution?.digest ||
      resolved.at !== incident.resolution?.resolvedAt)) {
    transitionHistoryError(incident.id, "resolution disagrees");
  }
  const lineageTransitions = incident.lineageTransitions ?? [];
  if (!Array.isArray(lineageTransitions)) transitionHistoryError(incident.id, "lineage transitions are malformed");
  const anchors = new Set([incident.failure?.lineage?.commit,
    ...(incident.repair?.candidate?.commit ? [incident.repair.candidate.commit] : [])]);
  for (const mapping of lineageTransitions) {
    exactObject(mapping, "Reliability incident lineage transition");
    if (!anchors.has(mapping.fromCommit) || !["rebase", "abandon"].includes(mapping.kind) ||
        !Number.isFinite(Date.parse(mapping.at))) {
      transitionHistoryError(incident.id, "lineage transition has an invalid source, kind, or timestamp");
    }
    if (mapping.kind === "rebase") {
      if (typeof mapping.toCommit !== "string" || !mapping.toCommit ||
          typeof mapping.toTree !== "string" || !mapping.toTree) {
        transitionHistoryError(incident.id, "rebase transition has an invalid replacement");
      }
      anchors.delete(mapping.fromCommit);
      anchors.add(mapping.toCommit);
    } else if (mapping.userDecision?.approvedBy !== "specifier" ||
        mapping.userDecision?.approved !== true ||
        typeof mapping.userDecision?.reference !== "string" || !mapping.userDecision.reference.trim()) {
      transitionHistoryError(incident.id, "abandonment lacks a specifier-approved user decision");
    } else anchors.delete(mapping.fromCommit);
  }
  const lineageEvents = incident.transitions.filter(({ type }) => type.startsWith("lineage-"));
  if (JSON.stringify(normalized(lineageEvents.map(({ type, ...record }) => ({
    kind:type === "lineage-rebased" ? "rebase" : "abandon", ...record,
  })))) !== JSON.stringify(normalized(lineageTransitions))) {
    transitionHistoryError(incident.id, "lineage events disagree with durable mappings");
  }
}

export function validateIncident(incident) {
  exactObject(incident, "Reliability incident");
  stableIncidentId(incident.id);
  if (!["unresolved", "resolved"].includes(incident.state) || !incident.failure ||
      !shaPattern.test(incident.failureDigest ?? "") ||
      incident.failureDigest !== timeoutIncidentDigest(incident.failure) ||
      !Array.isArray(incident.transitions)) {
    throw new Error(`Malformed reliability incident ${incident.id}`);
  }
  validateTransitionHistory(incident);
  if (incident.state === "unresolved" && incident.resolution !== undefined) {
    transitionHistoryError(incident.id, "an unresolved incident contains a resolution");
  }
  if (incident.state === "resolved" &&
      (!shaPattern.test(incident.resolution?.digest ?? "") ||
       incident.resolution.digest !== timeoutIncidentDigest({ ...incident.resolution, digest:undefined }))) {
    throw new Error(`Reliability incident ${incident.id} has an invalid resolution digest`);
  }
  if (incident.state === "resolved") validateArchiveNames(incident.id, incident.resolution.archive);
  return incident;
}

export function validateEnvelope(envelope, expectedId) {
  exactObject(envelope, "Reliability incident document");
  if (envelope.version !== 1 || envelope.incident?.id !== expectedId ||
      envelope.digest !== timeoutIncidentDigest(envelope.incident)) {
    throw new Error(`Reliability incident ${expectedId} document digest does not match`);
  }
  return validateIncident(envelope.incident);
}

export async function writeExclusive(target, value) {
  const handle = await open(target, "wx", 0o600);
  try { await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`); await handle.sync(); }
  finally { await handle.close(); }
}

export async function atomicReplace(target, value) {
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag:"wx", mode:0o600 });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force:true });
  }
}

async function replaceArchiveBytes(target, bytes) {
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  let handle;
  try {
    handle = await open(temporary, "wx", 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporary, target);
  } finally {
    if (handle) await handle.close();
    await rm(temporary, { force:true });
  }
}

export async function archiveBytes(target, bytes, { replaceExisting = false } = {}) {
  let handle;
  try {
    handle = await open(target, "wx", 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = undefined;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existingDigest = timeoutIncidentDigest(await safeStoreFile(target));
    if (existingDigest === timeoutIncidentDigest(bytes)) return;
    if (!replaceExisting) throw error;
    await replaceArchiveBytes(target, bytes);
  } finally {
    if (handle) await handle.close();
  }
}

export function archiveNames(id) {
  stableIncidentId(id);
  return {
    checkpointReceipt:`${id}.checkpoint-receipt`,
    packageReceipt:`${id}.package-receipt`,
    packageZip:`${id}.package-zip`,
  };
}

export function validateArchiveNames(id, archive) {
  if (JSON.stringify(normalized(archive)) !== JSON.stringify(normalized(archiveNames(id)))) {
    throw new Error(`Reliability incident ${id} has invalid archive filenames or traversal`);
  }
  return archive;
}

export async function safeStoreFile(target) {
  const resolved = path.resolve(target);
  const details = await lstat(resolved);
  if (!details.isFile() || details.isSymbolicLink() || await realpath(resolved) !== resolved) {
    throw new Error(`Timeout archive is not a canonical regular file: ${resolved}`);
  }
  return readFile(resolved);
}

export async function archivedReceiptDocument(target) {
  const bytes = await safeStoreFile(target);
  const receipt = JSON.parse(bytes);
  return { path:target, receipt, bytes, sha256:timeoutIncidentDigest(bytes) };
}

export async function withIncidentLock(directory, id, operation) {
  const lockPath = path.join(directory, `${id}.lock`);
  let handle;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try { handle = await open(lockPath, "wx", 0o600); break; }
    catch (error) {
      if (error.code !== "EEXIST") throw error;
      await pause(5);
    }
  }
  if (!handle) throw new Error(`Timed out waiting for reliability incident lock ${id}`);
  try { return await operation(); }
  finally { await handle.close(); await rm(lockPath, { force:true }); }
}

export function transition(incident, type, at, details = {}) {
  return { ...incident, transitions:[...incident.transitions, { type, at, ...details }] };
}
