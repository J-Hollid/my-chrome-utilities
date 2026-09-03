import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const states = new Set(["working", "waiting", "blocked", "available"]);

function timestamp(value, name) {
  const time = Date.parse(value ?? "");
  if (!Number.isFinite(time)) throw new Error(`Role liveness requires a valid ${name}`);
  return time;
}

function validIdentity(value) {
  return typeof value === "string" && value.length > 0;
}

export function currentProgressLease(lease, now = new Date().toISOString()) {
  if (lease == null) return false;
  if (lease?.version !== 1 || !validIdentity(lease.id) || !validIdentity(lease.task) ||
      !validIdentity(lease.handoff) || !validIdentity(lease.reason)) {
    throw new Error("Role progress lease has an incomplete identity");
  }
  return timestamp(lease.expiresAt, "progress lease expiry") > timestamp(now, "current time");
}

export function roleLiveness({ reportedState, command = null, progressLease = null,
  now = new Date().toISOString() }) {
  if (!states.has(reportedState)) throw new Error("Role liveness requires a known reported state");
  const liveCommand = command == null ? false : command.live === true &&
    validIdentity(command.id) && Number.isInteger(command.pid) && command.pid > 0;
  if (command != null && !liveCommand && command.live !== false) {
    throw new Error("Role command evidence is malformed");
  }
  const liveLease = currentProgressLease(progressLease, now);
  const working = liveCommand || liveLease;
  const effectiveState = working ? "working" : "available";
  return {
    version:1,
    reportedState,
    effectiveState,
    activityIdentity:liveCommand ? { kind:"command", id:command.id, pid:command.pid }
      : liveLease ? { kind:"progress-lease", id:progressLease.id } : null,
    reason:liveCommand ? "live command" : liveLease ? "current progress lease"
      : reportedState === "working" ? "expired active claim" : "no observable work",
    mailAction:working ? "keep-queued" : "activate-exact-handoff",
  };
}

export function reconcileQueuedHandoff({ reportedState, command, progressLease, queuedHandoff,
  now = new Date().toISOString() }) {
  if (!validIdentity(queuedHandoff?.id) || !validIdentity(queuedHandoff?.task)) {
    throw new Error("Liveness reconciliation requires an exact queued handoff");
  }
  const liveness = roleLiveness({ reportedState, command, progressLease, now });
  return {
    ...liveness,
    nextHandoff:liveness.mailAction === "activate-exact-handoff"
      ? structuredClone(queuedHandoff) : null,
    createdReceipt:false,
    createdReplacementHandoff:false,
  };
}

export function roleStateTransition({ priorState, nextState, task, handoff, activityIdentity = null,
  reason, at = new Date().toISOString() }) {
  if (!states.has(priorState) || !states.has(nextState) || !validIdentity(task) ||
      !validIdentity(handoff) || !validIdentity(reason)) {
    throw new Error("Role state transition has an incomplete identity");
  }
  timestamp(at, "transition timestamp");
  if (activityIdentity != null && (!validIdentity(activityIdentity.kind) ||
      !validIdentity(activityIdentity.id))) {
    throw new Error("Role state transition has malformed activity evidence");
  }
  return { version:1, priorState, nextState, task, handoff,
    activityIdentity:structuredClone(activityIdentity), reason, at };
}

export function roleTimingSummary(transitions, endAt) {
  if (!Array.isArray(transitions) || !transitions.length) {
    throw new Error("Role timing requires transition history");
  }
  const end = timestamp(endAt, "timing end");
  const totals = { activeWorkMs:0, queueWaitMs:0, staleStateDelayMs:0 };
  for (const [index, entry] of transitions.entries()) {
    roleStateTransition(entry);
    const start = timestamp(entry.at, "transition timestamp");
    const finish = index + 1 < transitions.length
      ? timestamp(transitions[index + 1].at, "next transition timestamp") : end;
    if (finish < start) throw new Error("Role state transitions are out of order");
    const duration = finish - start;
    if (entry.nextState === "working") totals.activeWorkMs += duration;
    else if (entry.nextState === "waiting" || entry.nextState === "blocked") {
      totals.queueWaitMs += duration;
    } else if (entry.reason === "expired active claim") totals.staleStateDelayMs += duration;
  }
  return { version:1, ...totals };
}

export async function appendRoleStateTransition(file, transition) {
  roleStateTransition(transition);
  let document = { version:1, transitions:[] };
  try { document = JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  if (document?.version !== 1 || !Array.isArray(document.transitions) ||
      document.transitions.some((entry) => JSON.stringify(roleStateTransition(entry)) !==
        JSON.stringify(entry))) {
    throw new Error("Role state history is malformed");
  }
  const next = { version:1, transitions:[...document.transitions, transition] };
  await mkdir(path.dirname(file), { recursive:true });
  const stage = path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`);
  await writeFile(stage, `${JSON.stringify(next, null, 2)}\n`, { flag:"wx" });
  await rename(stage, file);
  return structuredClone(next);
}

export function completedAuthorityFollowUp(completion, requestedAction) {
  if (completion?.status !== "resume" || !validIdentity(completion?.binding?.activeHandoff) ||
      !validIdentity(completion?.binding?.task) || !validIdentity(requestedAction)) {
    throw new Error("Completed authority follow-up requires an exact durable completion");
  }
  return { action:requestedAction, reusedCompletion:true, activeHandoff:completion.binding.activeHandoff,
    task:completion.binding.task, requestNewAuthority:false, createReceipt:false,
    createHandoff:false };
}
