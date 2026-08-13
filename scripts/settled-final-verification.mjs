import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { canonicalVerificationChangeSet, requireGitAncestor } from "./verification-changes.mjs";
import { planVerification } from "./verification-packs.mjs";
import {
  createReviewReadyRecord,
  consumeTerminalFullObligations,
  same,
  validateReviewReadyRecord,
} from "./settled-final-verification-review.mjs";
import {
  deliveryScorecard,
  finalEvidenceEffect,
  formatReviewReadyScopePreflight,
  handoffReadinessPolicy,
  reviewReadyProductCandidatePath,
  reviewReadyScopePreflight,
  terminalVerificationDeferredRoute,
} from "./settled-final-verification-policy.mjs";
import { terminalVerificationDeferredConservation } from "./verification-reliability-deferred.mjs";

export {
  createReviewReadyRecord,
  consumeTerminalFullObligations,
  deliveryScorecard,
  finalEvidenceEffect,
  formatReviewReadyScopePreflight,
  handoffReadinessPolicy,
  reviewReadyProductCandidatePath,
  reviewReadyScopePreflight,
  terminalVerificationDeferredRoute,
  terminalVerificationDeferredConservation,
  validateReviewReadyRecord,
};

const repository = fileURLToPath(new URL("../", import.meta.url));
const reviewNotesRef = "refs/notes/swarmforge-review-ready";

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
    if (/no note found|cannot read note data|unsupported schema/iu.test(error.message)) {
      return { version:1, records:[] };
    }
    throw error;
  }
}

async function reviewContext(commit, base, repositoryRoot) {
  const [candidateCommit, candidateTree, baseCommit] = await Promise.all([
    git(repositoryRoot, ["rev-parse", `${commit}^{commit}`]),
    git(repositoryRoot, ["rev-parse", `${commit}^{tree}`]),
    git(repositoryRoot, ["rev-parse", `${base}^{commit}`]),
  ]);
  await requireGitAncestor(baseCommit, candidateCommit, { repositoryRoot });
  const [changeSet, note] = await Promise.all([
    canonicalVerificationChangeSet({ base:baseCommit, commit:candidateCommit, repositoryRoot }),
    currentReviewNote(candidateCommit, repositoryRoot),
  ]);
  return { candidateCommit, candidateTree, baseCommit, changeSet, note };
}

export async function recordReviewReadyEvidence(receiptFile, base, task, {
  repositoryRoot = repository,
} = {}) {
  const dirty = await git(repositoryRoot, ["status", "--porcelain"]);
  if (dirty) throw new Error("Commit candidate changes before recording review-ready evidence");
  const [context, receiptBytes] = await Promise.all([
    reviewContext("HEAD", base, repositoryRoot),
    readFile(path.resolve(repositoryRoot, receiptFile)),
  ]);
  const { candidateCommit, candidateTree, baseCommit, changeSet, note } = context;
  const record = createReviewReadyRecord({
    task, baseCommit, candidateCommit, candidateTree, changeSet,
    receipt:JSON.parse(receiptBytes),
    receiptPath:path.relative(repositoryRoot, path.resolve(repositoryRoot, receiptFile)),
    receiptSha256:createHash("sha256").update(receiptBytes).digest("hex"),
  });
  const records = [...note.records.filter((item) =>
    !(item.task === task && item.baseCommit === baseCommit)), record];
  await git(repositoryRoot, ["notes", `--ref=${reviewNotesRef}`, "add", "-f", "-F", "-", candidateCommit],
    { input:JSON.stringify({ version:1, records }) });
  return record;
}

export async function verifyReviewReadyEvidence(commit, base, task, {
  repositoryRoot = repository,
} = {}) {
  const { candidateCommit, candidateTree, baseCommit, changeSet, note } =
    await reviewContext(commit, base, repositoryRoot);
  const record = note.records.find((item) => item.task === task && item.baseCommit === baseCommit);
  if (!record) throw new Error("No bound review-ready evidence for candidate, base, and task");
  validateReviewReadyRecord(record, { task, baseCommit, candidateCommit, candidateTree });
  if (!same(changeSet, record.changeSet)) {
    throw new Error("Review-ready changed paths no longer match the candidate");
  }
  return record;
}

// Final handoff path: validate the runner-owned canonical receipt and then
// consume any review-ready terminal obligation against that real evidence.
// The review base remains on the origin record; masterBaseCommit is explicit
// because the frozen release base may differ from it.
export async function verifyQaReleaseCandidate(commit, base, {
  repositoryRoot = repository,
} = {}) {
  const [candidateCommit, baseCommit, qaHead, masterHead] = await Promise.all([
    git(repositoryRoot, ["rev-parse", `${commit}^{commit}`]),
    git(repositoryRoot, ["rev-parse", `${base}^{commit}`]),
    git(repositoryRoot, ["rev-parse", "refs/heads/qa^{commit}"]),
    git(repositoryRoot, ["rev-parse", "refs/heads/master^{commit}"]),
  ]);
  await requireGitAncestor(baseCommit, candidateCommit, { repositoryRoot });
  if (candidateCommit !== qaHead) throw new Error("Release candidate must be the exact QA head");
  if (baseCommit !== masterHead) throw new Error("Release candidate base must be the exact master head");
  if (candidateCommit === baseCommit) throw new Error("QA has no accumulated commit to promote");
  return { candidateCommit, baseCommit, qaHead, masterHead };
}

async function recordReview([receipt, base, task]) {
  const record = await recordReviewReadyEvidence(receipt, base, task);
  console.log(`review-ready evidence recorded: ${record.task} (${record.focusedScope.taskKeys.length} focused tasks)`);
}

async function verifyReview([commit, base, task]) {
  const record = await verifyReviewReadyEvidence(commit, base, task);
  console.log(`review-ready evidence passed: ${record.task} (${record.focusedScope.taskKeys.length} focused tasks)`);
}

async function verifyReleaseCandidate([commit, base]) {
  const candidate = await verifyQaReleaseCandidate(commit, base);
  console.log(`QA release candidate passed: ${candidate.candidateCommit.slice(0, 10)} based on ${candidate.baseCommit.slice(0, 10)}`);
}

async function validateHandoff([sender, recipientList, task, readiness, verified]) {
  const packs = JSON.parse(await readFile(path.join(repository, "verification/packs.json"), "utf8"));
  const policy = handoffReadinessPolicy({
    sender, recipients:recipientList.split(",").filter(Boolean), task,
    readiness:readiness === "legacy" ? undefined : readiness, verified,
    allPackIds:planVerification(packs, {terminalFull:true}).selectedPackIds,
  });
  console.log(`handoff readiness passed: ${policy.mode}`);
}

const operations = {
  "record-review":{ arity:3, run:recordReview },
  "verify-review":{ arity:3, run:verifyReview },
  "verify-release-candidate":{ arity:2, run:verifyReleaseCandidate },
  "validate-handoff":{ arity:5, run:validateHandoff },
};

export async function runSettledFinalVerificationCommand([operation, ...args]) {
  const selected = operations[operation];
  if (!selected || args.length !== selected.arity) {
    throw new Error("Use: settled-final-verification.mjs record-review <receipt> <base> <task> | verify-review <commit> <base> <task> | verify-release-candidate <commit> <base> | validate-handoff <sender> <recipients> <task> <readiness|legacy> <verified>");
  }
  await selected.run(args);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSettledFinalVerificationCommand(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
