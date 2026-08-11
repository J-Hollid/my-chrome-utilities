import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { canonicalVerificationChangeSet, requireGitAncestor } from "./verification-changes.mjs";

const repository = fileURLToPath(new URL("../", import.meta.url));
const reviewNotesRef = "refs/notes/swarmforge-review-ready";
const sha1Pattern = /^[a-f0-9]{40}$/u;
const sha256Pattern = /^[a-f0-9]{64}$/u;
const taskPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/u;
const finalInputPrefixes = [
  "acceptance/", "architecture/", "scripts/", "src/", "swarmforge/", "test/", "verification/",
];

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonical(nested)]));
  }
  return value;
}

function same(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function sortedUnique(values) {
  return [...new Set(values ?? [])].sort();
}

function assertIsoTimestamp(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an ISO timestamp`);
  }
}

function assertBinding({ task, baseCommit, candidateCommit, candidateTree }) {
  if (!taskPattern.test(task ?? "")) throw new Error("Review-ready evidence requires a stable task");
  for (const [label, value] of Object.entries({ baseCommit, candidateCommit, candidateTree })) {
    if (!sha1Pattern.test(value ?? "")) throw new Error(`Review-ready evidence requires ${label}`);
  }
}

export function createReviewReadyRecord({
  task, baseCommit, candidateCommit, candidateTree, changeSet, receipt,
  receiptPath, receiptSha256, recordedAt = new Date().toISOString(),
}) {
  assertBinding({ task, baseCommit, candidateCommit, candidateTree });
  if (changeSet?.version !== 1 || changeSet.baseCommit !== baseCommit ||
      changeSet.commit !== candidateCommit || !Array.isArray(changeSet.paths)) {
    throw new Error("Review-ready evidence requires the canonical candidate change set");
  }
  if (receipt?.version !== 2 || receipt.candidate?.commit !== candidateCommit ||
      receipt.candidate?.tree !== candidateTree) {
    throw new Error("Review-ready receipt does not match the candidate commit and tree");
  }
  const tasks = Object.values(receipt.tasks ?? {});
  if (!tasks.length || tasks.some(({ status }) => status !== "passed")) {
    throw new Error("Every focused review task must have passed");
  }
  assertIsoTimestamp(receipt.startedAt, "Review receipt start");
  assertIsoTimestamp(receipt.completedAt, "Review receipt completion");
  assertIsoTimestamp(recordedAt, "Review evidence recording");
  if (!receiptPath || !sha256Pattern.test(receiptSha256 ?? "")) {
    throw new Error("Review-ready evidence requires a bound receipt path and SHA-256");
  }
  const focusedScope = {
    changedPaths:sortedUnique(receipt.plan?.changedPaths ?? changeSet.paths),
    packIds:sortedUnique(receipt.plan?.requestedPackIds ?? receipt.plan?.packIds),
    taskKeys:sortedUnique(tasks.map(({ identity }) => identity?.key)),
  };
  if (!focusedScope.taskKeys.length || focusedScope.taskKeys.some((key) => !key)) {
    throw new Error("Review-ready evidence requires canonical focused task identities");
  }
  return {
    version:1, kind:"review-ready", result:"passed", task, baseCommit,
    candidateCommit, candidateTree, changeSet, focusedScope,
    receipt:{ path:receiptPath, sha256:receiptSha256, runId:receipt.runId },
    startedAt:receipt.startedAt, completedAt:receipt.completedAt, recordedAt,
    finalRegressionClaim:false,
  };
}

export function validateReviewReadyRecord(record, binding) {
  assertBinding(binding);
  if (record?.version !== 1 || record.kind !== "review-ready" || record.result !== "passed" ||
      record.finalRegressionClaim !== false) throw new Error("Invalid review-ready evidence record");
  for (const key of ["task", "baseCommit", "candidateCommit", "candidateTree"]) {
    if (record[key] !== binding[key]) throw new Error(`Review-ready evidence ${key} does not match`);
  }
  if (!Array.isArray(record.focusedScope?.taskKeys) || !record.focusedScope.taskKeys.length ||
      !Array.isArray(record.changeSet?.paths) || !sha256Pattern.test(record.receipt?.sha256 ?? "")) {
    throw new Error("Review-ready evidence is incomplete");
  }
  assertIsoTimestamp(record.startedAt, "Review evidence start");
  assertIsoTimestamp(record.completedAt, "Review evidence completion");
  assertIsoTimestamp(record.recordedAt, "Review evidence recording");
  return true;
}

export function handoffReadinessPolicy({ sender, recipients, task, readiness, verified, allPackIds }) {
  const recipientSet = new Set(recipients ?? []);
  if (task === "vtd015-settled-final-verification" && readiness === undefined) {
    if (verified === "not-required" || verified === "review-ready") {
      throw new Error("The VTD-015 bootstrap requires legacy exact verification evidence");
    }
    return { mode:"legacy-bootstrap", requiredEvidence:"legacy-exact" };
  }
  if ((sender === "coder" && recipientSet.has("refactorer")) ||
      (sender === "refactorer" && recipientSet.has("architect"))) {
    if (readiness !== "review-ready" || verified !== "review-ready") {
      throw new Error(`${sender} must send review-ready evidence to the next review role`);
    }
    return { mode:"review", requiredEvidence:"review-ready" };
  }
  if (sender === "architect" && recipientSet.has("specifier")) {
    if (readiness !== "final-ready") {
      throw new Error("Only a final-ready candidate may be sent for integration or completion");
    }
    if (!same(sortedUnique(String(verified ?? "").split(",").filter(Boolean)), sortedUnique(allPackIds))) {
      throw new Error("Final-ready evidence must cover every canonical verification pack");
    }
    return { mode:"final", requiredEvidence:"final-ready" };
  }
  return { mode:"ordinary", requiredEvidence:readiness ?? "legacy" };
}

export function finalEvidenceEffect({ changedPaths, boundIdentitiesEqual }) {
  const behaviorBearing = (changedPaths ?? []).some((changedPath) =>
    finalInputPrefixes.some((prefix) => changedPath.startsWith(prefix)) ||
    ["package.json", "package-lock.json", "tsconfig.json"].includes(changedPath));
  return behaviorBearing || !boundIdentitiesEqual
    ? { eligible:false, action:"settle-and-rerun-all-20" }
    : { eligible:true, action:"promote-or-integrate" };
}

export function deliveryScorecard({ approvedAt, integratedAt, handoffs = [], receipts = [],
  historicalSuccessfulFullRuns = 0 }) {
  const finalReceipts = receipts.filter(({ kind }) => kind === "final-ready");
  const successfulFullRuns = finalReceipts.filter(({ status }) => status === "passed").length;
  return {
    approvalToIntegrationMs:Date.parse(integratedAt) - Date.parse(approvedAt),
    roleIntervals:Object.fromEntries(handoffs.map(({ role, startedAt, completedAt }) =>
      [role, Date.parse(completedAt) - Date.parse(startedAt)])),
    focusedVerificationMs:receipts.filter(({ kind }) => kind === "review-ready")
      .reduce((total, { durationMs = 0 }) => total + durationMs, 0),
    finalGateMs:finalReceipts.reduce((total, { durationMs = 0 }) => total + durationMs, 0),
    successfulFullRuns,
    invalidatedFullRuns:finalReceipts.filter(({ status, invalidated }) => status === "passed" && invalidated).length,
    failures:receipts.filter(({ status }) => status === "failed").length,
    repairs:receipts.filter(({ repaired }) => repaired).length,
    reruns:receipts.filter(({ rerun }) => rerun).length,
    terminalEvidencePreserved:finalReceipts.some(({ status, terminalLeavesPreserved }) =>
      status === "passed" && terminalLeavesPreserved),
    modeledAvoidedSuccessfulFullRuns:Math.max(0, historicalSuccessfulFullRuns - 1),
  };
}

function git(root, args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile("git", args, { cwd:root, maxBuffer:16 * 1024 * 1024 },
      (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout.trim()));
    if (input !== undefined) child.stdin.end(input);
  });
}

async function currentReviewNote(commit, root) {
  try {
    const note = JSON.parse(await git(root, ["notes", `--ref=${reviewNotesRef}`, "show", commit]));
    if (note.version !== 1 || !Array.isArray(note.records)) throw new Error("unsupported schema");
    return note;
  } catch (error) {
    if (/no note found|cannot read note data|unsupported schema/iu.test(error.message)) return { version:1, records:[] };
    throw error;
  }
}

export async function recordReviewReadyEvidence(receiptFile, base, task, { repositoryRoot = repository } = {}) {
  const dirty = await git(repositoryRoot, ["status", "--porcelain"]);
  if (dirty) throw new Error("Commit candidate changes before recording review-ready evidence");
  const [candidateCommit, candidateTree, baseCommit, receiptBytes] = await Promise.all([
    git(repositoryRoot, ["rev-parse", "HEAD^{commit}"]),
    git(repositoryRoot, ["rev-parse", "HEAD^{tree}"]),
    git(repositoryRoot, ["rev-parse", `${base}^{commit}`]),
    readFile(path.resolve(repositoryRoot, receiptFile)),
  ]);
  await requireGitAncestor(baseCommit, candidateCommit, { repositoryRoot });
  const changeSet = await canonicalVerificationChangeSet({ base:baseCommit, commit:candidateCommit, repositoryRoot });
  const record = createReviewReadyRecord({
    task, baseCommit, candidateCommit, candidateTree, changeSet,
    receipt:JSON.parse(receiptBytes), receiptPath:path.relative(repositoryRoot, path.resolve(repositoryRoot, receiptFile)),
    receiptSha256:createHash("sha256").update(receiptBytes).digest("hex"),
  });
  const note = await currentReviewNote(candidateCommit, repositoryRoot);
  const records = [...note.records.filter((item) => !(item.task === task && item.baseCommit === baseCommit)), record];
  await git(repositoryRoot, ["notes", `--ref=${reviewNotesRef}`, "add", "-f", "-F", "-", candidateCommit],
    { input:JSON.stringify({ version:1, records }) });
  return record;
}

export async function verifyReviewReadyEvidence(commit, base, task, { repositoryRoot = repository } = {}) {
  const [candidateCommit, candidateTree, baseCommit] = await Promise.all([
    git(repositoryRoot, ["rev-parse", `${commit}^{commit}`]),
    git(repositoryRoot, ["rev-parse", `${commit}^{tree}`]),
    git(repositoryRoot, ["rev-parse", `${base}^{commit}`]),
  ]);
  await requireGitAncestor(baseCommit, candidateCommit, { repositoryRoot });
  const note = await currentReviewNote(candidateCommit, repositoryRoot);
  const record = note.records.find((item) => item.task === task && item.baseCommit === baseCommit);
  if (!record) throw new Error("No bound review-ready evidence for candidate, base, and task");
  validateReviewReadyRecord(record, { task, baseCommit, candidateCommit, candidateTree });
  const changeSet = await canonicalVerificationChangeSet({ base:baseCommit, commit:candidateCommit, repositoryRoot });
  if (!same(changeSet, record.changeSet)) throw new Error("Review-ready changed paths no longer match the candidate");
  return record;
}

async function main([operation, ...args]) {
  if (operation === "record-review" && args.length === 3) {
    const record = await recordReviewReadyEvidence(args[0], args[1], args[2]);
    console.log(`review-ready evidence recorded: ${record.task} (${record.focusedScope.taskKeys.length} focused tasks)`);
    return;
  }
  if (operation === "verify-review" && args.length === 3) {
    const record = await verifyReviewReadyEvidence(args[0], args[1], args[2]);
    console.log(`review-ready evidence passed: ${record.task} (${record.focusedScope.taskKeys.length} focused tasks)`);
    return;
  }
  if (operation === "validate-handoff" && args.length === 5) {
    const packs = JSON.parse(await readFile(path.join(repository, "verification/packs.json"), "utf8"));
    const policy = handoffReadinessPolicy({
      sender:args[0], recipients:args[1].split(",").filter(Boolean), task:args[2],
      readiness:args[3] === "legacy" ? undefined : args[3], verified:args[4],
      allPackIds:packs.map(({ id }) => id),
    });
    console.log(`handoff readiness passed: ${policy.mode}`);
    return;
  }
  throw new Error("Use: settled-final-verification.mjs record-review <receipt> <base> <task> | verify-review <commit> <base> <task> | validate-handoff <sender> <recipients> <task> <readiness|legacy> <verified>");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
