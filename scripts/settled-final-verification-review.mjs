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

export function createReviewReadyRecord({
  task, baseCommit, candidateCommit, candidateTree, changeSet, receipt,
  receiptPath, receiptSha256, recordedAt = new Date().toISOString(),
}) {
  assertBinding({ task, baseCommit, candidateCommit, candidateTree });
  assertChangeSet(changeSet, baseCommit, candidateCommit);
  assertReceiptBinding(receipt, candidateCommit, candidateTree);
  assertReceiptChangeSet(receipt, changeSet);
  const tasks = passedTasks(receipt);
  assertIsoTimestamp(receipt.startedAt, "Review receipt start");
  assertIsoTimestamp(receipt.completedAt, "Review receipt completion");
  assertIsoTimestamp(recordedAt, "Review evidence recording");
  assertReceiptIdentity(receiptPath, receiptSha256);
  return {
    version:1, kind:"review-ready", result:"passed", task, baseCommit,
    candidateCommit, candidateTree, changeSet, focusedScope:focusedScope(receipt, tasks),
    receipt:{ path:receiptPath, sha256:receiptSha256, runId:receipt.runId },
    startedAt:receipt.startedAt, completedAt:receipt.completedAt, recordedAt,
    finalRegressionClaim:false,
  };
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
