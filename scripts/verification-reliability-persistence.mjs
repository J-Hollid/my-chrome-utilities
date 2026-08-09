import { randomUUID } from "node:crypto";
import {
  lstat, mkdir, open, readFile, realpath, rename, rm, writeFile,
} from "node:fs/promises";
import path from "node:path";
import { setTimeout as pause } from "node:timers/promises";

import {
  exactObject, git, normalized, shaPattern, stableIncidentId, timeoutIncidentDigest,
} from "./verification-reliability-values.mjs";

export async function defaultStoreDirectory(root) {
  const common = await git(root, "rev-parse", "--git-common-dir");
  const commonDirectory = path.isAbsolute(common) ? common : path.resolve(root, common);
  return path.join(commonDirectory, "swarmforge-reliability-incidents");
}

export async function ensureSafeDirectory(directory, { create = true } = {}) {
  const resolved = path.resolve(directory);
  try {
    const details = await lstat(resolved);
    if (details.isSymbolicLink()) throw new Error(`Timeout incident store is redirected by a symlink: ${resolved}`);
    if (!details.isDirectory()) throw new Error(`Timeout incident store is not a directory: ${resolved}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    if (!create) return undefined;
    await mkdir(resolved, { recursive:true });
  }
  if (await realpath(resolved) !== resolved) {
    throw new Error(`Timeout incident store is redirected outside its canonical path: ${resolved}`);
  }
  return resolved;
}

export function incidentEnvelope(incident) {
  return { version:1, incident, digest:timeoutIncidentDigest(incident) };
}

export function validateIncident(incident) {
  exactObject(incident, "Timeout incident");
  stableIncidentId(incident.id);
  if (!["unresolved", "resolved"].includes(incident.state) || !incident.failure ||
      !shaPattern.test(incident.failureDigest ?? "") ||
      incident.failureDigest !== timeoutIncidentDigest(incident.failure) ||
      !Array.isArray(incident.transitions)) {
    throw new Error(`Malformed timeout incident ${incident.id}`);
  }
  if (incident.state === "resolved" &&
      (!shaPattern.test(incident.resolution?.digest ?? "") ||
       incident.resolution.digest !== timeoutIncidentDigest({ ...incident.resolution, digest:undefined }))) {
    throw new Error(`Timeout incident ${incident.id} has an invalid resolution digest`);
  }
  if (incident.state === "resolved") validateArchiveNames(incident.id, incident.resolution.archive);
  return incident;
}

export function validateEnvelope(envelope, expectedId) {
  exactObject(envelope, "Timeout incident document");
  if (envelope.version !== 1 || envelope.incident?.id !== expectedId ||
      envelope.digest !== timeoutIncidentDigest(envelope.incident)) {
    throw new Error(`Timeout incident ${expectedId} document digest does not match`);
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

export async function archiveBytes(target, bytes) {
  let handle;
  try {
    handle = await open(target, "wx", 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = undefined;
  } catch (error) {
    if (error.code !== "EEXIST" || timeoutIncidentDigest(await safeStoreFile(target)) !==
        timeoutIncidentDigest(bytes)) throw error;
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
    throw new Error(`Timeout incident ${id} has invalid archive filenames or traversal`);
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
  if (!handle) throw new Error(`Timed out waiting for timeout incident lock ${id}`);
  try { return await operation(); }
  finally { await handle.close(); await rm(lockPath, { force:true }); }
}

export function transition(incident, type, at, details = {}) {
  return { ...incident, transitions:[...incident.transitions, { type, at, ...details }] };
}
