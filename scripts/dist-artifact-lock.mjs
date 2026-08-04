import {randomUUID} from "node:crypto";
import {mkdir, readFile, readdir, rm, stat, writeFile} from "node:fs/promises";
import {AsyncLocalStorage} from "node:async_hooks";
import path from "node:path";
import {performance} from "node:perf_hooks";

const lockDirectory = new URL("../tmp/.dist-artifact.lock/", import.meta.url);
const heldEnvironmentKey = "MY_CHROME_UTILITIES_DIST_LOCK_HELD";
const localLockContext = new AsyncLocalStorage();
const malformedRecordGraceMs = 1000;
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function childPath(directory, name) {
  return directory instanceof URL ? new URL(name, directory) : path.join(directory, name);
}

function parentPath(directory) {
  return directory instanceof URL ? new URL("../", directory) : path.dirname(directory);
}

function positiveMilliseconds(name, value) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${name} must be a finite positive number; received ${value}.`);
  }
  return value;
}

function environmentMilliseconds(name, fallback) {
  return process.env[name] === undefined ? fallback : Number(process.env[name]);
}

async function linuxProcessStartTime(pid) {
  const source = (await readFile(`/proc/${pid}/stat`, "utf8")).trim();
  const commandEnd = source.lastIndexOf(")");
  if (commandEnd < 0) throw new Error(`Malformed /proc/${pid}/stat record.`);
  const fieldsAfterCommand = source.slice(commandEnd + 1).trim().split(/\s+/u);
  const startTime = fieldsAfterCommand[19];
  if (!startTime) throw new Error(`Missing start time in /proc/${pid}/stat.`);
  return startTime;
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    if (error?.code === "EPERM") return true;
    throw error;
  }
}

async function processIdentity(pid) {
  if (process.platform === "linux") {
    try {
      return {kind: "linux-proc-start-time", value: await linuxProcessStartTime(pid)};
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "ESRCH") return {kind: "pid"};
      if (error?.code !== "EACCES" && error?.code !== "EPERM") throw error;
    }
  }
  return {kind: "pid"};
}

export async function distArtifactOwnerRecord(token = randomUUID()) {
  const identity = await processIdentity(process.pid);
  const record = {pid: process.pid, identity, token};
  if (identity.kind === "linux-proc-start-time") record.startTime = identity.value;
  return record;
}

function recognizedIdentity(owner) {
  if (owner?.identity?.kind === "linux-proc-start-time") {
    return {kind: "linux-proc-start-time", value: owner.identity.value};
  }
  if (owner?.identity?.kind === "pid") return {kind: "pid"};
  if (typeof owner?.startTime === "string") {
    return {kind: "linux-proc-start-time", value: owner.startTime};
  }
  return undefined;
}

async function ownerIsLive(owner) {
  if (!Number.isInteger(owner?.pid) || owner.pid < 1) return {recognized: false, live: false};
  const identity = recognizedIdentity(owner);
  if (!identity) return {recognized: false, live: false};
  if (identity.kind === "pid" || process.platform !== "linux") {
    return {recognized: true, live: processIsAlive(owner.pid)};
  }
  if (typeof identity.value !== "string") return {recognized: false, live: false};
  try {
    return {
      recognized: true,
      live: (await linuxProcessStartTime(owner.pid)) === identity.value,
    };
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ESRCH") {
      return {recognized: true, live: false};
    }
    if (error?.code === "EACCES" || error?.code === "EPERM") {
      return {recognized: true, live: processIsAlive(owner.pid)};
    }
    throw error;
  }
}

export async function inheritedDistArtifactLockIsHeld(
  directory = lockDirectory,
  token = process.env[heldEnvironmentKey],
) {
  if (!token) return false;
  let owner;
  try {
    owner = JSON.parse(await readFile(childPath(directory, "owner.json"), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return false;
    throw error;
  }
  if (owner?.token !== token) return false;
  const status = await ownerIsLive(owner);
  return status.recognized && status.live;
}

async function olderThanGrace(target) {
  try {
    return Date.now() - (await stat(target)).mtimeMs > malformedRecordGraceMs;
  } catch (error) {
    if (error?.code === "ENOENT") return true;
    throw error;
  }
}

async function staleOwner(directory, ownerFile) {
  let source;
  try {
    source = await readFile(ownerFile, "utf8");
    const owner = JSON.parse(source);
    const status = await ownerIsLive(owner);
    if (status.recognized) return status.live ? undefined : {source};
  } catch (error) {
    if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
  }
  return (await olderThanGrace(directory)) ? {source} : undefined;
}

async function staleClaim(claimFile) {
  try {
    const owner = JSON.parse(await readFile(claimFile, "utf8"));
    const status = await ownerIsLive(owner);
    if (status.recognized) return !status.live;
  } catch (error) {
    if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
  }
  return olderThanGrace(claimFile);
}

const reclaimClaimPattern = /^reclaim\.\d{24}\..+\.claim$/;

async function reclaimClaims(directory) {
  try {
    return (await readdir(directory)).filter((name) => reclaimClaimPattern.test(name));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function orderedReclaimClaims(directory) {
  const entries = [];
  for (const name of await reclaimClaims(directory)) {
    try {
      const details = await stat(childPath(directory, name), {bigint: true});
      entries.push({name, created: details.birthtimeNs, ino: details.ino});
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return entries
    .sort((left, right) =>
      left.created < right.created
        ? -1
        : left.created > right.created
          ? 1
          : left.ino < right.ino
            ? -1
            : left.ino > right.ino
              ? 1
              : left.name.localeCompare(right.name),
    )
    .map(({name}) => name);
}

function timeoutError(startedAt, directory) {
  const waited = Math.max(0, performance.now() - startedAt);
  return new Error(
    `Timed out waiting ${Math.round(waited)}ms for dist artifact lock: ${directory.toString()}`,
  );
}

function remainingTime(deadline, startedAt, directory) {
  const remaining = deadline - performance.now();
  if (remaining <= 0) throw timeoutError(startedAt, directory);
  return remaining;
}

async function boundedPause(milliseconds, deadline, startedAt, directory) {
  await pause(Math.min(milliseconds, remainingTime(deadline, startedAt, directory)));
  remainingTime(deadline, startedAt, directory);
}

async function reclaimObservedOwner(
  directory,
  ownerFile,
  observed,
  {deadline, startedAt, reportWaiting},
) {
  remainingTime(deadline, startedAt, directory);
  const claimToken = `${process.pid}:${performance.now()}:${randomUUID()}`;
  const claimName = `reclaim.${process.hrtime.bigint().toString().padStart(24, "0")}.${process.pid}.${randomUUID()}.claim`;
  const claimFile = childPath(directory, claimName);
  const claimOwner = await distArtifactOwnerRecord(claimToken);
  try {
    await writeFile(claimFile, JSON.stringify(claimOwner), {flag: "wx"});
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }

  try {
    for (;;) {
      remainingTime(deadline, startedAt, directory);
      for (const name of await reclaimClaims(directory)) {
        remainingTime(deadline, startedAt, directory);
        const candidate = childPath(directory, name);
        if (await staleClaim(candidate)) {
          try {
            await rm(candidate);
          } catch (error) {
            if (error?.code !== "ENOENT") throw error;
          }
        }
      }
      const claims = await orderedReclaimClaims(directory);
      if (!claims.includes(claimName)) return false;
      if (claims[0] !== claimName) {
        await reportWaiting();
        await boundedPause(25, deadline, startedAt, directory);
        continue;
      }
      break;
    }

    remainingTime(deadline, startedAt, directory);
    let current;
    try {
      current = await readFile(ownerFile, "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (current !== observed.source) return false;
    const claim = JSON.parse(await readFile(claimFile, "utf8"));
    if (claim.token !== claimToken) return false;
    await rm(directory, {recursive: true});
    return true;
  } finally {
    try {
      const claim = JSON.parse(await readFile(claimFile, "utf8"));
      if (claim.token === claimToken) await rm(claimFile);
    } catch (error) {
      if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
    }
  }
}

export async function acquireDistArtifactLock(
  directory = lockDirectory,
  {
    timeoutMs = environmentMilliseconds("DIST_ARTIFACT_LOCK_TIMEOUT_MS", 600000),
    reportAfterMs = environmentMilliseconds("DIST_ARTIFACT_LOCK_REPORT_MS", 5000),
  } = {},
) {
  positiveMilliseconds("timeoutMs", timeoutMs);
  positiveMilliseconds("reportAfterMs", reportAfterMs);
  const ownerFile = childPath(directory, "owner.json");
  const startedAt = performance.now();
  const deadline = startedAt + timeoutMs;
  let reportedAt = 0;
  await mkdir(parentPath(directory), {recursive: true});

  const reportWaiting = async () => {
    const waited = performance.now() - startedAt;
    if (waited < reportAfterMs || waited - reportedAt < reportAfterMs) return;
    reportedAt = waited;
    let owner = "unknown";
    try {
      owner = await readFile(ownerFile, "utf8");
    } catch {}
    console.error(`[dist-lock:waiting ${Math.round(waited / 1000)}s] owner ${owner}`);
  };

  for (;;) {
    remainingTime(deadline, startedAt, directory);
    try {
      await mkdir(directory);
      const token = `${process.pid}:${performance.now()}:${randomUUID()}`;
      try {
        await writeFile(ownerFile, JSON.stringify(await distArtifactOwnerRecord(token)), {
          flag: "wx",
        });
      } catch (error) {
        await rm(directory, {recursive: true, force: true});
        throw error;
      }
      let released = false;
      const release = async () => {
        if (released) return;
        released = true;
        try {
          const owner = JSON.parse(await readFile(ownerFile, "utf8"));
          if (owner.token === token) await rm(directory, {recursive: true, force: true});
        } catch (error) {
          if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
        }
      };
      Object.defineProperty(release, "token", {value: token});
      return release;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const observed = await staleOwner(directory, ownerFile);
      if (observed) {
        await reclaimObservedOwner(directory, ownerFile, observed, {
          deadline,
          startedAt,
          reportWaiting,
        });
        continue;
      }
      remainingTime(deadline, startedAt, directory);
      await reportWaiting();
      await boundedPause(25, deadline, startedAt, directory);
    }
  }
}

export async function withDistArtifactLock(operation) {
  if (localLockContext.getStore() === true) return operation();
  if (await inheritedDistArtifactLockIsHeld()) return operation();
  const release = await acquireDistArtifactLock();
  const previous = process.env[heldEnvironmentKey];
  process.env[heldEnvironmentKey] = release.token;
  try {
    return await localLockContext.run(true, operation);
  } finally {
    if (previous === undefined) delete process.env[heldEnvironmentKey];
    else process.env[heldEnvironmentKey] = previous;
    await release();
  }
}
