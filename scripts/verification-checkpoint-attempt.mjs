import { readdir } from "node:fs/promises";
import path from "node:path";

import {
  atomicReplace, defaultRepositoryRuntimeDirectory, ensureSafeDirectory, legacyGitCommonDirectory, safeStoreFile,
  withIncidentLock, writeExclusive,
} from "./verification-reliability-persistence.mjs";
import { git, normalized, timeoutIncidentDigest } from "./verification-reliability-values.mjs";

export async function defaultCheckpointAttemptDirectory(root) {
  return path.join(await defaultRepositoryRuntimeDirectory(root), "checkpoint-attempts");
}

export async function defaultLegacyCheckpointAttemptDirectory(root) {
  return path.join(await legacyGitCommonDirectory(root), "swarmforge-checkpoint-attempts");
}

const identityFields = ["candidate", "baseCommit", "evidenceTask", "planDigest",
  "artifactInputDigest", "artifactOutputDigest", "artifactBuildIdentity",
  "registryDigest", "toolchainDigest", "environmentClass",
  "capabilityRoutes"];
const legacyIdentityFields = identityFields.filter((field) =>
  !["artifactOutputDigest", "artifactBuildIdentity"].includes(field));
const artifactIdentityFields = ["artifactOutputDigest", "artifactBuildIdentity"];
const attemptStates = new Set(["active", "interrupted", "tasks-complete", "promoted"]);
const promotionOrder = ["receipt-finalized", "pending-evidence-created", "git-note-recorded",
  "handoff-eligible"];

function validTimestamp(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validOwner(owner) {
  return owner && typeof owner === "object" && !Array.isArray(owner) &&
    Number.isInteger(owner.pid) && owner.pid > 0 && typeof owner.token === "string" && owner.token;
}

function same(left, right) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

function validateAttemptResult(attempt, key, result) {
  const identity = result?.receiptTask?.identity;
  if (!attempt.taskKeys.includes(key) || result?.status !== "passed" ||
      typeof result.identityDigest !== "string" || result.identityDigest.length !== 64 ||
      result.receiptTask?.status !== "passed" || identity?.key !== key ||
      result.identityDigest !== timeoutIncidentDigest(identity)) {
    throw new Error(`Checkpoint attempt ${attempt.id} has a forged or mismatched result for ${key}`);
  }
}

function validateAttemptHistory(attempt) {
  if (!validTimestamp(attempt.createdAt) || !Array.isArray(attempt.transitions) ||
      !attempt.transitions.length || attempt.transitions[0]?.type !== "created" ||
      !validOwner(attempt.transitions[0]?.owner)) {
    throw new Error(`Checkpoint attempt ${attempt.id} has malformed transition history`);
  }
  let phase = "active";
  let owner = structuredClone(attempt.transitions[0].owner);
  let interruptedTask = null;
  let previousTime = Date.parse(attempt.createdAt);
  const passed = new Set();
  const logicalResults = {};
  const promotions = [];
  let artifactIdentity;
  for (const [index, transition] of attempt.transitions.entries()) {
    const at = Date.parse(transition?.at);
    if (!validTimestamp(transition?.at) || at < previousTime ||
        index > 0 && transition.type === "created") {
      throw new Error(`Checkpoint attempt ${attempt.id} has reordered or duplicated transitions`);
    }
    previousTime = at;
    if (index === 0) continue;
    if (transition.type === "artifact-bound") {
      if (phase !== "active" || artifactIdentity || passed.size ||
          artifactIdentityFields.some((field) => typeof transition[field] !== "string" ||
            !transition[field])) {
        throw new Error(`Checkpoint attempt ${attempt.id} has an impossible artifact transition`);
      }
      artifactIdentity = Object.fromEntries(artifactIdentityFields.map((field) =>
        [field, transition[field]]));
      continue;
    }
    if (transition.type === "task-passed") {
      if (phase !== "active" || !attempt.taskKeys.includes(transition.taskKey) ||
          passed.has(transition.taskKey)) {
        throw new Error(`Checkpoint attempt ${attempt.id} has an impossible task transition`);
      }
      passed.add(transition.taskKey);
      continue;
    }
    if (transition.type === "logical-target-passed") {
      if (phase !== "active" || !attempt.taskKeys.includes(transition.taskKey) ||
          passed.has(transition.taskKey) || typeof transition.logicalTargetId !== "string" ||
          !transition.logicalTargetId || logicalResults[transition.taskKey]?.has(transition.logicalTargetId)) {
        throw new Error(`Checkpoint attempt ${attempt.id} has an impossible logical target transition`);
      }
      logicalResults[transition.taskKey] ??= new Set();
      logicalResults[transition.taskKey].add(transition.logicalTargetId);
      continue;
    }
    if (transition.type === "interrupted") {
      if (phase !== "active" || !attempt.taskKeys.includes(transition.taskKey) ||
          passed.has(transition.taskKey)) {
        throw new Error(`Checkpoint attempt ${attempt.id} has an impossible interruption`);
      }
      phase = "interrupted";
      owner = null;
      interruptedTask = transition.taskKey;
      continue;
    }
    if (["continued", "stale-owner-recovered"].includes(transition.type)) {
      const expectedPhase = transition.type === "continued" ? "interrupted" : "active";
      if (phase !== expectedPhase || !validOwner(transition.owner)) {
        throw new Error(`Checkpoint attempt ${attempt.id} has an impossible owner recovery`);
      }
      phase = "active";
      owner = structuredClone(transition.owner);
      interruptedTask = null;
      continue;
    }
    if (transition.type === "tasks-complete") {
      if (phase !== "active" || passed.size !== attempt.taskKeys.length) {
        throw new Error(`Checkpoint attempt ${attempt.id} completed an incomplete task set`);
      }
      phase = "tasks-complete";
      owner = null;
      continue;
    }
    if (promotionOrder.includes(transition.type)) {
      if (phase !== "tasks-complete" || transition.type !== promotionOrder[promotions.length]) {
        throw new Error(`Checkpoint attempt ${attempt.id} has promotion transition drift`);
      }
      promotions.push(transition.type);
      if (transition.type === "handoff-eligible") phase = "promoted";
      continue;
    }
    throw new Error(`Checkpoint attempt ${attempt.id} has an unknown transition`);
  }
  return { phase, owner, interruptedTask, passed, logicalResults, promotions, artifactIdentity };
}

function validatedCheckpointIdentity(value, { allowUnboundArtifact = false } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Checkpoint attempt identity must be an object");
  }
  const identity = Object.fromEntries(identityFields.map((field) => [field,
    structuredClone(value[field]) ]));
  if (typeof identity.candidate?.commit !== "string" || !identity.candidate.commit ||
      typeof identity.candidate?.tree !== "string" || !identity.candidate.tree ||
      identityFields.slice(1, -1).some((field) => allowUnboundArtifact &&
        artifactIdentityFields.includes(field) ? identity[field] !== null :
        typeof identity[field] !== "string" || !identity[field]) || !identity.capabilityRoutes ||
      typeof identity.capabilityRoutes !== "object" || Array.isArray(identity.capabilityRoutes)) {
    throw new Error("Checkpoint attempt identity is incomplete");
  }
  return normalized(identity);
}

export function checkpointAttemptIdentity(value) {
  return validatedCheckpointIdentity(value);
}

export function checkpointAttemptInputIdentity(value) {
  return validatedCheckpointIdentity({ ...value, artifactOutputDigest:null,
    artifactBuildIdentity:null }, { allowUnboundArtifact:true });
}

function envelope(attempt) {
  return { version:attempt.version, attempt, digest:timeoutIncidentDigest(attempt) };
}

function validateAttempt(document, expectedId) {
  const attempt = document?.attempt;
  const legacy = document?.version === 1 && attempt?.version === 1;
  const current = document?.version === 2 && attempt?.version === 2;
  const expectedIdentity = legacy
    ? normalized(Object.fromEntries(legacyIdentityFields.map((field) =>
      [field, structuredClone(attempt?.identity?.[field]) ])))
    : attempt?.identity?.artifactOutputDigest === null && attempt?.identity?.artifactBuildIdentity === null
      ? checkpointAttemptInputIdentity(attempt?.identity)
      : checkpointAttemptIdentity(attempt?.identity);
  const validIdentityId = legacy || [timeoutIncidentDigest(expectedIdentity),
    timeoutIncidentDigest(checkpointAttemptInputIdentity(expectedIdentity))].includes(expectedId);
  if ((!legacy && !current) || attempt?.id !== expectedId || !validIdentityId ||
      document.digest !== timeoutIncidentDigest(attempt) ||
      attempt.identityDigest !== timeoutIncidentDigest(attempt.identity) ||
      !same(attempt.identity, expectedIdentity) ||
      !Array.isArray(attempt.taskKeys) || !attempt.taskKeys.length ||
      attempt.taskKeys.some((key) => typeof key !== "string" || !key) ||
      new Set(attempt.taskKeys).size !== attempt.taskKeys.length ||
      !attempt.results || typeof attempt.results !== "object" || Array.isArray(attempt.results) ||
      (!legacy && (!attempt.logicalResults || typeof attempt.logicalResults !== "object" ||
        Array.isArray(attempt.logicalResults))) ||
      !attempt.promotion || typeof attempt.promotion !== "object" || Array.isArray(attempt.promotion) ||
      !attemptStates.has(attempt.state)) {
    throw new Error(`Checkpoint attempt ${expectedId} is malformed or digest-mismatched`);
  }
  for (const [key, result] of Object.entries(attempt.results)) {
    validateAttemptResult(attempt, key, result);
  }
  const durableLogicalResults = attempt.logicalResults ?? {};
  for (const [key, results] of Object.entries(durableLogicalResults)) {
    if (!attempt.taskKeys.includes(key) || !results || typeof results !== "object" ||
        Array.isArray(results) || Object.entries(results).some(([targetId, result]) =>
          !targetId || result?.id !== targetId || result.status !== "passed" ||
          !Number.isFinite(result.durationMs))) {
      throw new Error(`Checkpoint attempt ${expectedId} has malformed logical target results`);
    }
  }
  const history = validateAttemptHistory(attempt);
  if (history.artifactIdentity && !same(history.artifactIdentity,
    Object.fromEntries(artifactIdentityFields.map((field) => [field, attempt.identity[field]]))) ||
      !history.artifactIdentity && attempt.transitions[0]?.identityDigest &&
        attempt.transitions[0].identityDigest !== attempt.identityDigest) {
    throw new Error(`Checkpoint attempt ${expectedId} has artifact identity drift`);
  }
  if (!same([...history.passed].sort(), Object.keys(attempt.results).sort()) ||
      !same(Object.fromEntries(Object.entries(history.logicalResults)
        .map(([key, values]) => [key, [...values].sort()])),
      Object.fromEntries(Object.entries(durableLogicalResults)
        .map(([key, values]) => [key, Object.keys(values).sort()]))) ||
      history.phase !== attempt.state ||
      attempt.state === "active" && (!validOwner(attempt.owner) || !same(attempt.owner, history.owner) ||
        attempt.currentTask !== null) ||
      attempt.state === "interrupted" && (attempt.owner !== null ||
        attempt.currentTask !== history.interruptedTask) ||
      ["tasks-complete", "promoted"].includes(attempt.state) &&
        (attempt.owner !== null || attempt.currentTask !== null ||
          Object.keys(attempt.results).length !== attempt.taskKeys.length)) {
    throw new Error(`Checkpoint attempt ${expectedId} has impossible state, owner, or results`);
  }
  const promotionKeys = Object.keys(attempt.promotion);
  if (!same(promotionKeys, history.promotions) || promotionKeys.some((step, index) =>
    step !== promotionOrder[index] || !validTimestamp(attempt.promotion[step]?.at) ||
    attempt.promotion[step].at !== attempt.transitions.find(({ type }) => type === step)?.at)) {
    throw new Error(`Checkpoint attempt ${expectedId} has promotion state drift`);
  }
  return { ...attempt, logicalResults:durableLogicalResults };
}

async function defaultOwnerAlive(owner) {
  if (!Number.isInteger(owner?.pid) || owner.pid <= 0) return false;
  try { process.kill(owner.pid, 0); return true; }
  catch { return false; }
}

export function createCheckpointAttemptStore({ directory, legacyDirectories = [], now = () => new Date().toISOString(),
  ownerAlive = defaultOwnerAlive } = {}) {
  if (typeof directory !== "string" || !directory) {
    throw new Error("Checkpoint attempt store requires a repository-common directory");
  }
  if (!Array.isArray(legacyDirectories) || legacyDirectories.some((entry) =>
    typeof entry !== "string" || !entry)) {
    throw new Error("Checkpoint attempt legacy directories must be paths");
  }
  const storeDirectory = () => ensureSafeDirectory(directory);
  const readableDirectories = async() => [await storeDirectory(), ...(await Promise.all(
    legacyDirectories.map((entry) => ensureSafeDirectory(entry, { create:false }))))
    .filter(Boolean)];
  const target = (id) => path.join(directory, `${id}.json`);
  const markerTarget = (id) => path.join(directory, `${id}.legacy-source`);
  const locate = async(id) => {
    const matches = [];
    for (const store of await readableDirectories()) {
      try { matches.push({ store, bytes:await safeStoreFile(path.join(store, `${id}.json`)) }); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    if (!matches.length) throw new Error(`Unknown checkpoint attempt ${id}`);
    if (matches.some(({ bytes }) => !bytes.equals(matches[0].bytes))) {
      let marker;
      try { marker = JSON.parse(await safeStoreFile(markerTarget(id))); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
      const legacyDigests = matches.filter(({ store }) => store !== directory)
        .map(({ bytes }) => timeoutIncidentDigest(bytes)).sort();
      if (marker?.version !== 1 || marker.id !== id || !same(marker.legacyDigests, legacyDigests) ||
          matches[0].store !== directory) {
        throw new Error(`Checkpoint attempt ${id} diverges across repository namespaces`);
      }
    }
    return matches;
  };
  const read = async(id) => {
    const matches = await locate(id);
    try { return validateAttempt(JSON.parse(matches[0].bytes), id); }
    catch (error) { throw new Error(`Cannot read checkpoint attempt ${id}: ${error.message}`); }
  };
  const update = async(id, operation) => {
    await storeDirectory();
    return withIncidentLock(directory, id, async() => {
      const matches = await locate(id);
      const current = await read(id);
      const next = await operation(structuredClone(current));
      validateAttempt(envelope(next), id);
      await atomicReplace(target(id), envelope(next));
      const legacyDigests = matches.filter(({ store }) => store !== directory)
        .map(({ bytes }) => timeoutIncidentDigest(bytes)).sort();
      if (legacyDigests.length) {
        await atomicReplace(markerTarget(id), { version:1, id, legacyDigests });
      }
      return next;
    });
  };
  const list = async() => {
    const names = [...new Set((await Promise.all((await readableDirectories()).map((store) =>
      readdir(store)))).flat().filter((name) => name.endsWith(".json")))].sort();
    return Promise.all(names.map((name) => read(name.slice(0, -5))));
  };
  const requireOwner = (attempt, owner) => {
    if (attempt.owner?.token !== owner?.token) {
      throw new Error(`Checkpoint attempt ${attempt.id} is owned by another process`);
    }
  };
  return {
    read,
    list,
    async claim(identityValue, taskKeys, owner) {
      const inputIdentity = checkpointAttemptInputIdentity(identityValue);
      const identity = identityValue?.artifactOutputDigest && identityValue?.artifactBuildIdentity
        ? checkpointAttemptIdentity(identityValue) : inputIdentity;
      if (!Array.isArray(taskKeys) || !taskKeys.length || new Set(taskKeys).size !== taskKeys.length ||
          taskKeys.some((key) => typeof key !== "string" || !key) ||
          !Number.isInteger(owner?.pid) || typeof owner?.token !== "string" || !owner.token) {
        throw new Error("Checkpoint attempt claim requires unique tasks and a stable owner");
      }
      const id = timeoutIncidentDigest(inputIdentity);
      await storeDirectory();
      return withIncidentLock(directory, "checkpoint-attempt-claim", async() => {
        const attempts = await list();
        const existing = attempts.find((attempt) =>
          same(checkpointAttemptInputIdentity(attempt.identity), inputIdentity));
        if (existing) {
          if (JSON.stringify(existing.taskKeys) !== JSON.stringify(taskKeys)) {
            throw new Error(`Checkpoint attempt ${id} task identity drift`);
          }
          if (["tasks-complete", "promoted"].includes(existing.state)) {
            return { action:"promotion-only", attempt:existing,
              reusableTaskKeys:[...existing.taskKeys], pendingTaskKeys:[] };
          }
          if (existing.state === "active" && await ownerAlive(existing.owner)) {
            return { action:"attached", attempt:existing,
              owner:structuredClone(existing.owner), reusableTaskKeys:Object.keys(existing.results).sort(),
              pendingTaskKeys:taskKeys.filter((key) => !existing.results[key]) };
          }
          const action = existing.state === "active" ? "stale-owner-recovered" : "continued";
          const recovered = await update(id, (attempt) => ({ ...attempt, state:"active",
            owner:structuredClone(owner), currentTask:null,
            transitions:[...attempt.transitions, { type:action, at:now(), owner:structuredClone(owner) }] }));
          return { action, attempt:recovered, reusableTaskKeys:Object.keys(recovered.results).sort(),
            pendingTaskKeys:taskKeys.filter((key) => !recovered.results[key]) };
        }
        for (const attempt of attempts.filter(({ state }) => state === "active")) {
          if (await ownerAlive(attempt.owner)) {
            throw new Error(`Incompatible checkpoint attempt ${attempt.id} is owned by pid ${attempt.owner.pid}`);
          }
        }
        const attempt = { version:2, id, identity, identityDigest:timeoutIncidentDigest(identity),
          taskKeys:[...taskKeys],
          state:"active", owner:structuredClone(owner), currentTask:null, results:{}, logicalResults:{},
          promotion:{}, createdAt:now(), transitions:[{ type:"created", at:now(),
            owner:structuredClone(owner), identityDigest:timeoutIncidentDigest(identity) }] };
        await writeExclusive(target(id), envelope(attempt));
        return { action:"created", attempt, reusableTaskKeys:[], pendingTaskKeys:[...taskKeys] };
      });
    },
    assertIdentity(id, identityValue) {
      return read(id).then((attempt) => {
        const expected = identityValue?.artifactOutputDigest && identityValue?.artifactBuildIdentity
          ? checkpointAttemptIdentity(identityValue) : checkpointAttemptInputIdentity(identityValue);
        const actual = identityValue?.artifactOutputDigest && identityValue?.artifactBuildIdentity
          ? attempt.identity : checkpointAttemptInputIdentity(attempt.identity);
        if (!same(actual, expected)) {
          throw new Error(`Checkpoint attempt ${id} identity drift`);
        }
        return attempt;
      });
    },
    bindArtifactIdentity(id, artifact, owner) {
      return update(id, (attempt) => {
        requireOwner(attempt, owner);
        const values = Object.fromEntries(artifactIdentityFields.map((field) => [field, artifact?.[field]]));
        if (artifactIdentityFields.some((field) => typeof values[field] !== "string" || !values[field])) {
          throw new Error(`Checkpoint attempt ${id} requires a complete artifact identity`);
        }
        if (attempt.identity.artifactOutputDigest !== null ||
            attempt.identity.artifactBuildIdentity !== null) {
          if (!same(values, Object.fromEntries(artifactIdentityFields.map((field) =>
            [field, attempt.identity[field]])))) {
            throw new Error(`Checkpoint attempt ${id} artifact identity drift`);
          }
          return attempt;
        }
        if (attempt.state !== "active" || Object.keys(attempt.results).length) {
          throw new Error(`Checkpoint attempt ${id} cannot bind its artifact identity`);
        }
        const identity = checkpointAttemptIdentity({ ...attempt.identity, ...values });
        return { ...attempt, identity, identityDigest:timeoutIncidentDigest(identity),
          transitions:[...attempt.transitions, { type:"artifact-bound", at:now(), ...values }] };
      });
    },
    recordTask(id, key, result, owner) {
      return update(id, (attempt) => {
        requireOwner(attempt, owner);
        if (attempt.state !== "active" || !attempt.taskKeys.includes(key) ||
            result?.status !== "passed" || attempt.results[key]) {
          throw new Error(`Checkpoint attempt ${id} cannot record task ${key}`);
        }
        return { ...attempt, currentTask:null,
          results:{ ...attempt.results, [key]:structuredClone(result) },
          transitions:[...attempt.transitions, { type:"task-passed", taskKey:key, at:now() }] };
      });
    },
    recordLogicalTargets(id, key, receiptTask, owner) {
      return update(id, (attempt) => {
        requireOwner(attempt, owner);
        const identity = receiptTask?.identity;
        if (attempt.state !== "active" || !attempt.taskKeys.includes(key) ||
            identity?.key !== key || !Array.isArray(identity.logicalTargetIds)) {
          throw new Error(`Checkpoint attempt ${id} cannot record logical targets for ${key}`);
        }
        const prior = attempt.logicalResults[key] ?? {};
        const additions = Object.entries(receiptTask.logicalResults ?? {})
          .filter(([targetId, result]) => identity.logicalTargetIds.includes(targetId) &&
            result?.id === targetId && result.status === "passed" && Number.isFinite(result.durationMs) &&
            !prior[targetId]);
        if (!additions.length) return attempt;
        return { ...attempt,
          logicalResults:{ ...attempt.logicalResults,
            [key]:{ ...prior, ...Object.fromEntries(additions.map(([targetId, result]) =>
              [targetId, structuredClone(result)])) } },
          transitions:[...attempt.transitions, ...additions.map(([logicalTargetId]) => ({
            type:"logical-target-passed", taskKey:key, logicalTargetId, at:now(),
          }))],
        };
      });
    },
    interrupt(id, currentTask, owner) {
      return update(id, (attempt) => {
        requireOwner(attempt, owner);
        if (attempt.state !== "active" || !attempt.taskKeys.includes(currentTask)) {
          throw new Error(`Checkpoint attempt ${id} cannot be interrupted at ${currentTask}`);
        }
        return { ...attempt, state:"interrupted", currentTask, owner:null,
          transitions:[...attempt.transitions, { type:"interrupted", taskKey:currentTask, at:now() }] };
      });
    },
    markTasksComplete(id, owner) {
      return update(id, (attempt) => {
        requireOwner(attempt, owner);
        if (attempt.state !== "active" ||
            attempt.taskKeys.some((key) => attempt.results[key]?.status !== "passed")) {
          throw new Error(`Checkpoint attempt ${id} has incomplete tasks`);
        }
        return { ...attempt, state:"tasks-complete", currentTask:null, owner:null,
          transitions:[...attempt.transitions, { type:"tasks-complete", at:now() }] };
      });
    },
    markPromotion(id, step) {
      return update(id, (attempt) => {
        if (attempt.promotion[step]) return attempt;
        if (!["tasks-complete", "promoted"].includes(attempt.state) ||
            !promotionOrder.includes(step) ||
            promotionOrder.slice(0, promotionOrder.indexOf(step))
              .some((prior) => !attempt.promotion[prior])) {
          throw new Error(`Checkpoint attempt ${id} promotion step is out of order`);
        }
        const at = now();
        const promotion = { ...attempt.promotion, [step]:{ at } };
        return { ...attempt, promotion, state:step === "handoff-eligible" ? "promoted" : attempt.state,
          transitions:[...attempt.transitions, { type:step, at }] };
      });
    },
    async recovery(id) {
      const attempt = await read(id);
      if (!["tasks-complete", "promoted"].includes(attempt.state)) {
        return { scope:"task-continuation", attempt };
      }
      const scope = !attempt.promotion["receipt-finalized"] ? "receipt-finalization"
        : !attempt.promotion["pending-evidence-created"] ? "pending-evidence"
          : !attempt.promotion["git-note-recorded"] ? "git-note-recording"
            : "handoff-eligibility";
      return { scope, attempt };
    },
  };
}
