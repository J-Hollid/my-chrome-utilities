import {
  validateConfirmedFlakyAdmissionsReceipt,
  validateEligibleRepairAdmissionsReceipt,
  validateRunIntentBootstrapReceipt,
} from "./verification-run-intent.mjs";
import { timeoutIncidentDigest } from "./verification-reliability-values.mjs";

const sha1Pattern = /^[a-f0-9]{40}$/u;
const sha256Pattern = /^[a-f0-9]{64}$/u;
const taskPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/u;

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonical(nested)]));
  }
  return value;
}

export function same(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

export function sortedUnique(values) {
  return [...new Set(values ?? [])].sort();
}

function assertIsoTimestamp(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an ISO timestamp`);
  }
}

function matches(pattern, value) {
  return typeof value === "string" && pattern.test(value);
}

function assertBinding({ task, baseCommit, candidateCommit, candidateTree }) {
  if (!matches(taskPattern, task)) throw new Error("Review-ready evidence requires a stable task");
  for (const [label, value] of Object.entries({ baseCommit, candidateCommit, candidateTree })) {
    if (!matches(sha1Pattern, value)) throw new Error(`Review-ready evidence requires ${label}`);
  }
}

function assertChangeSet(changeSet, baseCommit, candidateCommit) {
  if (changeSet?.version !== 1 || changeSet.baseCommit !== baseCommit ||
      changeSet.commit !== candidateCommit || !Array.isArray(changeSet.paths)) {
    throw new Error("Review-ready evidence requires the canonical candidate change set");
  }
}

function assertReceiptBinding(receipt, candidateCommit, candidateTree) {
  if (receipt?.version !== 2 || receipt.candidate?.commit !== candidateCommit ||
      receipt.candidate?.tree !== candidateTree) {
    throw new Error("Review-ready receipt does not match the candidate commit and tree");
  }
  if (receipt.runIntent !== "review-evidence") {
    throw new Error("Review-ready evidence requires an immutable review-evidence receipt intent");
  }
}

function assertReceiptChangeSet(receipt, changeSet) {
  if (!Array.isArray(receipt.plan?.changedPaths) ||
      !same(sortedUnique(receipt.plan.changedPaths), sortedUnique(changeSet.paths))) {
    throw new Error("Review-ready receipt changed paths do not match the candidate change set");
  }
}

function passedTasks(receipt) {
  const tasks = Object.values(receipt.tasks ?? {});
  if (!tasks.length || tasks.some(({ status }) => status !== "passed")) {
    throw new Error("Every focused review task must have passed");
  }
  return tasks;
}

function focusedScope(receipt, tasks) {
  const scope = {
    changedPaths:sortedUnique(receipt.plan.changedPaths),
    packIds:sortedUnique(receipt.plan?.requestedPackIds ?? receipt.plan?.packIds),
    taskKeys:sortedUnique(tasks.map(({ identity }) => identity?.key)),
  };
  if (!scope.taskKeys.length || scope.taskKeys.some((key) => !key)) {
    throw new Error("Review-ready evidence requires canonical focused task identities");
  }
  return scope;
}

function assertReceiptIdentity(receiptPath, receiptSha256) {
  if (!receiptPath || !sha256Pattern.test(receiptSha256 ?? "")) {
    throw new Error("Review-ready evidence requires a bound receipt path and SHA-256");
  }
}

function terminalObligationBinding(receipt, candidateCommit, candidateTree) {
  const paths = sortedUnique(receipt.plan?.terminalFullObligations ?? []);
  if (!paths.length) return undefined;
  return {
    status:"pending-master-checkpoint",
    paths,
    candidateCommit,
    candidateTree,
    receiptRunId:receipt.runId ?? null,
  };
}

export function createReviewReadyRecord({
  task, baseCommit, candidateCommit, candidateTree, changeSet, receipt,
  receiptPath, receiptSha256, recordedAt = new Date().toISOString(),
}) {
  assertBinding({ task, baseCommit, candidateCommit, candidateTree });
  assertChangeSet(changeSet, baseCommit, candidateCommit);
  assertReceiptBinding(receipt, candidateCommit, candidateTree);
  assertReceiptChangeSet(receipt, changeSet);
  const tasks = passedTasks(receipt);
  if (receipt.runIntentBootstrap) {
    validateRunIntentBootstrapReceipt(receipt, receipt.runIntentBootstrap);
  }
  if (receipt.eligibleRepairAdmissions) {
    validateEligibleRepairAdmissionsReceipt(receipt, receipt.eligibleRepairAdmissions);
  }
  if (receipt.confirmedFlakyAdmissions) {
    validateConfirmedFlakyAdmissionsReceipt(receipt, receipt.confirmedFlakyAdmissions);
  }
  assertIsoTimestamp(receipt.startedAt, "Review receipt start");
  assertIsoTimestamp(receipt.completedAt, "Review receipt completion");
  assertIsoTimestamp(recordedAt, "Review evidence recording");
  assertReceiptIdentity(receiptPath, receiptSha256);
  const record = {
    version:1, kind:"review-ready", result:"passed", task, baseCommit,
    candidateCommit, candidateTree, changeSet, focusedScope:focusedScope(receipt, tasks),
    receipt:{ path:receiptPath, sha256:receiptSha256, runId:receipt.runId,
      runIntent:receipt.runIntent },
    ...(receipt.runIntentBootstrap
      ? { runIntentBootstrap:structuredClone(receipt.runIntentBootstrap) } : {}),
    ...(receipt.eligibleRepairAdmissions ? {
      eligibleRepairAdmissions:structuredClone(receipt.eligibleRepairAdmissions),
      eligibleRepairAdmissionsDigest:timeoutIncidentDigest(receipt.eligibleRepairAdmissions),
    } : {}),
    ...(receipt.confirmedFlakyAdmissions ? {
      confirmedFlakyAdmissions:structuredClone(receipt.confirmedFlakyAdmissions),
      confirmedFlakyAdmissionsDigest:timeoutIncidentDigest(receipt.confirmedFlakyAdmissions),
    } : {}),
    startedAt:receipt.startedAt, completedAt:receipt.completedAt, recordedAt,
    finalRegressionClaim:false,
  };
  const obligations = terminalObligationBinding(receipt, candidateCommit, candidateTree);
  if (obligations) record.terminalObligations = obligations;
  return record;
}

function assertRecordShape(record) {
  if (record?.version !== 1 || record.kind !== "review-ready" || record.result !== "passed" ||
      record.finalRegressionClaim !== false) {
    throw new Error("Invalid review-ready evidence record");
  }
}

function assertRecordBinding(record, binding) {
  for (const key of ["task", "baseCommit", "candidateCommit", "candidateTree"]) {
    if (record[key] !== binding[key]) throw new Error(`Review-ready evidence ${key} does not match`);
  }
}

function assertRecordContents(record) {
  const hasTaskKeys = Array.isArray(record.focusedScope?.taskKeys) && record.focusedScope.taskKeys.length > 0;
  const hasChangedPaths = Array.isArray(record.changeSet?.paths);
  const hasReceiptDigest = matches(sha256Pattern, record.receipt?.sha256);
  if (!hasTaskKeys || !hasChangedPaths || !hasReceiptDigest) {
    throw new Error("Review-ready evidence is incomplete");
  }
  if (record.receipt?.runIntent !== undefined && record.receipt.runIntent !== "review-evidence") {
    throw new Error("Review-ready evidence has an invalid run intent");
  }
  if (record.runIntentBootstrap !== undefined &&
      (record.runIntentBootstrap.version !== 1 ||
       record.runIntentBootstrap.baseCommit !== record.baseCommit ||
       record.runIntentBootstrap.candidateCommit !== record.candidateCommit ||
       record.runIntentBootstrap.candidateTree !== record.candidateTree ||
       !Array.isArray(record.runIntentBootstrap.coverage))) {
    throw new Error("Review-ready evidence has an invalid run-intent bootstrap binding");
  }
  if (record.eligibleRepairAdmissions !== undefined &&
      (record.eligibleRepairAdmissions?.version !== 1 ||
       !Array.isArray(record.eligibleRepairAdmissions?.entries) ||
       !record.eligibleRepairAdmissions.entries.length ||
       record.eligibleRepairAdmissions.candidateCommit !== record.candidateCommit ||
       record.eligibleRepairAdmissions.candidateTree !== record.candidateTree ||
       record.eligibleRepairAdmissionsDigest !==
         timeoutIncidentDigest(record.eligibleRepairAdmissions))) {
    throw new Error("Review-ready evidence has an invalid eligible-repair admission binding");
  }
  if (record.confirmedFlakyAdmissions !== undefined &&
      (record.confirmedFlakyAdmissions?.version !== 1 ||
       !Array.isArray(record.confirmedFlakyAdmissions?.entries) ||
       !record.confirmedFlakyAdmissions.entries.length ||
       record.confirmedFlakyAdmissions.candidateCommit !== record.candidateCommit ||
       record.confirmedFlakyAdmissions.candidateTree !== record.candidateTree ||
       record.confirmedFlakyAdmissionsDigest !== timeoutIncidentDigest(record.confirmedFlakyAdmissions))) {
    throw new Error("Review-ready evidence has an invalid confirmed-flaky admission binding");
  }
  if ((record.eligibleRepairAdmissions !== undefined || record.confirmedFlakyAdmissions !== undefined) &&
      (record.eligibleRepairTransaction?.version !== 1 ||
       record.eligibleRepairTransaction?.status !== "committed" ||
       !sha256Pattern.test(record.eligibleRepairTransaction?.id ?? ""))) {
    throw new Error("Review-ready evidence has no committed eligible-repair transaction");
  }
  const obligations = record.terminalObligations;
  if (obligations !== undefined &&
      (obligations.status !== "pending-master-checkpoint" ||
       !Array.isArray(obligations.paths) || !obligations.paths.length ||
       !same(obligations.paths, sortedUnique(obligations.paths)) ||
       !matches(sha1Pattern, obligations.candidateCommit) ||
       !matches(sha1Pattern, obligations.candidateTree))) {
    throw new Error("Review-ready terminal obligations are invalid");
  }
}

export function validateReviewReadyRecord(record, binding) {
  assertBinding(binding);
  assertRecordShape(record);
  assertRecordBinding(record, binding);
  assertRecordContents(record);
  assertIsoTimestamp(record.startedAt, "Review evidence start");
  assertIsoTimestamp(record.completedAt, "Review evidence completion");
  assertIsoTimestamp(record.recordedAt, "Review evidence recording");
  return true;
}

function assertCanonicalMasterCheckpoint(proof, {
  candidateCommit, candidateTree, baseCommit, canonicalPackIds,
} = {}) {
  const allPacks = sortedUnique(canonicalPackIds);
  const plan = proof?.plan;
  const receipt = proof?.receipt;
  const hasProperties = plan?.includeProperties === true &&
    (plan.tasks ?? []).some(({ key = "" }) => key.startsWith("property:"));
  const hasAllPacks = allPacks.length === 20 && same(sortedUnique(plan?.packIds), allPacks) &&
    same(sortedUnique(plan?.selectedPackIds), allPacks);
  const evidenceCandidateCommit = proof?.commit ?? proof?.receipt?.candidate?.commit;
  const evidenceCandidateTree = proof?.tree ?? proof?.receipt?.candidate?.tree;
  const evidenceBaseCommit = proof?.baseCommit ?? proof?.receipt?.candidate?.baseCommit;
  const artifact = proof?.identities?.artifact ?? proof?.receipt?.artifact;
  if (!plan || plan.mode !== "exact" || !hasAllPacks || !hasProperties ||
      evidenceCandidateCommit !== candidateCommit || evidenceCandidateTree !== candidateTree ||
      evidenceBaseCommit !== baseCommit || !artifact?.buildIdentity ||
      !artifact?.inputDigest || !artifact?.outputDigest) {
    throw new Error("Terminal obligations require canonical all-20 properties/package/evidence proof");
  }
  return proof;
}

export function consumeTerminalFullObligations(record, checkpointReceipt, {
  canonicalCheckpoint,
  canonicalPackIds = [],
  ancestryProof,
  masterBaseCommit,
} = {}) {
  validateReviewReadyRecord(record, {
    task:record?.task, baseCommit:record?.baseCommit,
    candidateCommit:record?.candidateCommit, candidateTree:record?.candidateTree,
  });
  const obligations = record.terminalObligations;
  if (!obligations) return record;
  const candidateCommit = checkpointReceipt?.candidate?.commit;
  const candidateTree = checkpointReceipt?.candidate?.tree;
  if (obligations.status !== "pending-master-checkpoint" || !candidateCommit || !candidateTree ||
      obligations.candidateCommit !== record.candidateCommit || obligations.candidateTree !== record.candidateTree) {
    throw new Error("Terminal obligations are not pending for this candidate");
  }
  const sameOrigin = candidateCommit === obligations.candidateCommit && candidateTree === obligations.candidateTree;
  if (!sameOrigin) {
    if (ancestryProof?.originCommit !== obligations.candidateCommit ||
        ancestryProof?.originTree !== obligations.candidateTree ||
        ancestryProof?.descendantCommit !== candidateCommit || ancestryProof?.descendantTree !== candidateTree ||
        ancestryProof?.isAncestor !== true ||
        !obligations.paths.every((changedPath) => ancestryProof.changedPaths?.includes(changedPath))) {
      throw new Error("Terminal obligations require a conserved descendant of the origin candidate");
    }
  }
  if (checkpointReceipt?.version !== 2 ||
      Object.values(checkpointReceipt.tasks ?? {}).some(({ status }) => status !== "passed") ||
      !Object.keys(checkpointReceipt.tasks ?? {}).length ||
      !obligations.paths.every((path) =>
        sortedUnique(checkpointReceipt.plan?.terminalFullObligations ?? []).includes(path))) {
    throw new Error("Terminal obligations require a matching successful master checkpoint");
  }
  const proof = canonicalCheckpoint;
  if (!proof) throw new Error("Terminal obligations require validated canonical master evidence");
  assertCanonicalMasterCheckpoint(proof, {
    candidateCommit, candidateTree, baseCommit:masterBaseCommit ?? record.baseCommit, canonicalPackIds,
  });
  return {
    ...record,
    terminalObligations:{ ...obligations, status:"consumed", originCommit:obligations.candidateCommit,
      originTree:obligations.candidateTree, consumedByCommit:candidateCommit,
      consumedByTree:candidateTree, masterBaseCommit:masterBaseCommit ?? record.baseCommit,
      checkpointRunId:checkpointReceipt.runId ?? null },
  };
}
