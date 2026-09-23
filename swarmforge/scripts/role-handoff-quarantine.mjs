#!/usr/bin/env node
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { activeRoleWork, handoffIdentity } from "./role-handoff-identity.mjs";
import { readRoleActivity } from "./role-progress-lease.mjs";
import { pathExists, withQueueLock } from "./role-queue-transaction.mjs";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const bindingFields = ["to", "recipient", "priority", "type", "task", "commit", "base",
  "readiness", "verified"];

function headers(bytes) {
  const result = {};
  for (const line of bytes.toString("utf8").split(/\r?\n/u)) {
    if (!line) break;
    const separator = line.indexOf(": ");
    if (separator < 1) throw new Error("Malformed handoff header");
    const name = line.slice(0, separator);
    if (Object.hasOwn(result, name)) throw new Error("Duplicate handoff header");
    result[name] = line.slice(separator + 2);
  }
  return result;
}

async function regularBytes(file) {
  if (!(await lstat(file)).isFile()) throw new Error("Repair requires a regular file");
  return readFile(file);
}

// This explicit repair never runs during ordinary receipt. It preserves a malformed
// queued duplicate only when an exact, already completed handoff proves its scope.
export async function quarantineCompletedDuplicate({worktree, queuedName, completedName,
  expectedDigest}) {
  for (const name of [queuedName, completedName]) {
    if (!name || path.basename(name) !== name || !name.endsWith(".handoff")) {
      throw new Error("Repair requires exact handoff basenames");
    }
  }
  if (!/^[a-f0-9]{64}$/u.test(expectedDigest ?? "")) {
    throw new Error("Repair requires the exact queued file digest");
  }
  worktree = path.resolve(worktree);
  return withQueueLock(worktree, async () => {
    const activity = await readRoleActivity(worktree);
    if (await activeRoleWork(worktree) || activity.command ||
        (activity.progressLease &&
          !(Date.parse(activity.progressLease.expiresAt) <= Date.now()))) {
      throw new Error("Repair requires an idle role with no active handoff");
    }
    const handoffs = path.join(worktree, ".swarmforge", "handoffs");
    const source = path.join(handoffs, "inbox", "new", queuedName);
    const completed = path.join(handoffs, "inbox", "completed", completedName);
    const directory = path.join(handoffs, "quarantine", expectedDigest);
    const retained = path.join(directory, queuedName);
    const recordFile = path.join(directory, "record.json");
    const sourceExists = await pathExists(source);
    const bytes = await regularBytes(sourceExists ? source : retained);
    if (digest(bytes) !== expectedDigest) throw new Error("Queued handoff digest changed");
    const queued = headers(bytes);
    if (Object.hasOwn(queued, "id")) throw new Error("Repair cannot quarantine an identified handoff");
    const completedBytes = await regularBytes(completed);
    const prior = handoffIdentity(completedBytes.toString("utf8"));
    if (!prior.from || !Number.isFinite(Date.parse(prior.completed_at)) ||
        prior.type !== "git_handoff" || bindingFields.some((field) =>
          !queued[field] || queued[field] !== prior[field])) {
      throw new Error("No exact completed handoff supports this repair");
    }
    const binding = {version: 1, reason: "unidentified-duplicate-of-completed-handoff",
      source, retained, sourceDigest: expectedDigest, completed,
      completedDigest: digest(completedBytes), completedId: prior.id};
    await mkdir(directory, {recursive: true});
    if (await pathExists(recordFile)) {
      const record = JSON.parse(await readFile(recordFile, "utf8"));
      if (Object.entries(binding).some(([key, value]) => record[key] !== value)) {
        throw new Error("Quarantine record conflicts with this repair");
      }
    } else {
      if (!sourceExists) throw new Error("Retained handoff has no repair record");
      await writeFile(recordFile, `${JSON.stringify({...binding,
        recordedAt: new Date().toISOString()}, null, 2)}\n`, {flag: "wx"});
    }
    if (sourceExists) {
      if (await pathExists(retained)) throw new Error("Quarantine destination already exists");
      if (digest(await regularBytes(source)) !== expectedDigest) {
        throw new Error("Queued handoff changed during repair");
      }
      await rename(source, retained);
    }
    return {retained, recordFile, completedId: prior.id};
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [worktree, queuedName, completedName, expectedDigest, ...extra] = process.argv.slice(2);
  if (!worktree || extra.length) {
    console.error("Use: role-handoff-quarantine.mjs <worktree> <queued-name> <completed-name> <sha256>");
    process.exitCode = 2;
  } else {
    quarantineCompletedDuplicate({worktree, queuedName, completedName, expectedDigest})
      .then((result) => console.log(JSON.stringify(result, null, 2)))
      .catch((error) => { console.error(error.message); process.exitCode = 2; });
  }
}
