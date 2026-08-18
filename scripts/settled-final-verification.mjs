import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  canonicalVerificationChangeSet, requireGitAncestor, verificationPacksAtCommit,
} from "./verification-changes.mjs";
import { planVerification, verificationTaskIdentity } from "./verification-packs.mjs";
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
import { createTimeoutIncidentStore } from "./verification-reliability-store.mjs";
import { timeoutIncidentDigest } from "./verification-reliability-values.mjs";
import { canonicalPackageProof } from "./verification-reliability-runtime.mjs";
import {
  buildEligibleRepairAdmissions, eligibleRepairAdmissionCandidates,
} from "./verification-run-intent.mjs";
import { withVerificationNotesLock } from "./verification-git-notes.mjs";
import {
  eligibleRepairReviewTransactionDirectory, readEligibleRepairReviewTransaction,
  withEligibleRepairReviewTransactionLock, writeEligibleRepairReviewTransaction,
} from "./eligible-repair-review-transaction-store.mjs";

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

function admittedDeferralProof(record, packageProof, transaction) {
  return {
    candidate:{ commit:record.candidateCommit, tree:record.candidateTree },
    reviewReady:{ task:record.task, baseCommit:record.baseCommit,
      candidateCommit:record.candidateCommit, candidateTree:record.candidateTree,
      receiptSha256:record.receipt.sha256,
      focusedTaskKeys:[...record.focusedScope.taskKeys] },
    eligibleRepairAdmissions:structuredClone(record.eligibleRepairAdmissions),
    eligibleRepairTransaction:structuredClone(transaction),
    package:structuredClone(packageProof),
  };
}

function transactionRecord(record, id) {
  return { ...record, eligibleRepairTransaction:{ version:1, id, status:"committed" } };
}

async function boundAdmissionReceipt(record, root) {
  const relative = record.receipt?.path;
  if (typeof relative !== "string" ||
      !/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(relative)) {
    throw new Error("Eligible repair transaction requires a canonical receipt path");
  }
  const target = path.resolve(root, relative);
  if (path.relative(root, target).split(path.sep).join("/") !== relative) {
    throw new Error("Eligible repair transaction receipt escapes the repository");
  }
  const bytes = await readFile(target);
  if (createHash("sha256").update(bytes).digest("hex") !== record.receipt.sha256) {
    throw new Error("Eligible repair transaction receipt digest changed");
  }
  return JSON.parse(bytes);
}

async function rederiveEligibleRepairAdmissions(record, transactionBinding, {
  repositoryRoot, store, receiptLoader = boundAdmissionReceipt,
  packsLoader = (commit) => verificationPacksAtCommit(commit, { repositoryRoot }),
}) {
  const [receipt, packs, blocking, admittedIncidents] = await Promise.all([
    receiptLoader(record, repositoryRoot), packsLoader(record.candidateCommit),
    store.blocking({ commit:record.candidateCommit }),
    Promise.all(record.eligibleRepairAdmissions.entries.map(({ incidentId }) =>
      store.read(incidentId))),
  ]);
  if (timeoutIncidentDigest(receipt.eligibleRepairAdmissions) !==
      timeoutIncidentDigest(record.eligibleRepairAdmissions) ||
      receipt.plan?.taskPlanDigest !== record.eligibleRepairAdmissions.planDigest ||
      receipt.candidate?.changeSetDigest !== record.eligibleRepairAdmissions.changeSetDigest) {
    throw new Error("Eligible repair admission receipt changed before review recording");
  }
  const admittedIds = new Set(record.eligibleRepairAdmissions.entries.map(({ incidentId }) => incidentId));
  const currentById = new Map([...blocking, ...admittedIncidents]
    .map((incident) => [incident.id, structuredClone(incident)]));
  const candidates = eligibleRepairAdmissionCandidates([...currentById.values()].map((incident) =>
    admittedIds.has(incident.id) ? { ...incident, terminalVerificationDeferred:undefined } : incident));
  const plan = { tasks:Object.values(receipt.tasks ?? {})
    .map(({ identity }) => identity)
    .filter((identity) => typeof identity?.key === "string" && Array.isArray(identity.args))
    .map(verificationTaskIdentity) };
  const rebuilt = await buildEligibleRepairAdmissions({
    incidents:candidates, plan, packs,
    candidate:{ commit:record.candidateCommit, tree:record.candidateTree },
    baseCommit:record.baseCommit, evidenceTask:record.task,
    changeSetDigest:record.eligibleRepairAdmissions.changeSetDigest,
    planDigest:record.eligibleRepairAdmissions.planDigest,
  });
  if (timeoutIncidentDigest(rebuilt) !== timeoutIncidentDigest(record.eligibleRepairAdmissions)) {
    throw new Error("Eligible repair admission set changed before review recording");
  }
  for (const incident of admittedIncidents) {
    const bound = incident.terminalVerificationDeferred?.eligibleRepairTransaction;
    if (bound && timeoutIncidentDigest(bound) !== timeoutIncidentDigest(transactionBinding)) {
      throw new Error(`Eligible repair admission ${incident.id} is bound to another transaction`);
    }
  }
  return { receipt, packs, incidents:admittedIncidents, admissions:rebuilt };
}

export async function verifyCommittedReviewTransaction(record, root, {
  store = createTimeoutIncidentStore({ root }),
} = {}) {
  const transaction = record.eligibleRepairTransaction;
  if (!transaction) return record;
  const target = path.join(await eligibleRepairReviewTransactionDirectory(root),
    `${transaction.id}.json`);
  const journal = await readEligibleRepairReviewTransaction(target);
  if (transaction.version !== 1 || transaction.status !== "committed" ||
      journal?.version !== 1 || journal.status !== "committed" ||
      journal.id !== transaction.id || journal.inputDigest !== timeoutIncidentDigest({
        candidateCommit:record.candidateCommit, candidateTree:record.candidateTree,
        task:record.task, receiptSha256:record.receipt.sha256,
        admissionsDigest:record.eligibleRepairAdmissionsDigest,
      }) || timeoutIncidentDigest(journal.incidentIds) !== timeoutIncidentDigest(
        (record.eligibleRepairAdmissions?.entries ?? []).map(({ incidentId }) => incidentId).sort())) {
    throw new Error("Eligible repair review transaction is not durably committed");
  }
  const expectedTransaction = { version:1, id:transaction.id, inputDigest:journal.inputDigest };
  for (const entry of record.eligibleRepairAdmissions?.entries ?? []) {
    const incident = await store.read(entry.incidentId);
    const deferred = incident.terminalVerificationDeferred;
    if (incident.id !== entry.incidentId || incident.failureDigest !== entry.failureDigest ||
        timeoutIncidentDigest(incident.repair) !== entry.repairDigest ||
        deferred?.status !== "terminal-verification-deferred" ||
        deferred.candidate?.commit !== record.candidateCommit ||
        deferred.candidate?.tree !== record.candidateTree ||
        deferred.repairDigest !== entry.repairDigest ||
        deferred.reviewReady?.task !== record.task ||
        deferred.reviewReady?.baseCommit !== record.baseCommit ||
        deferred.reviewReady?.candidateCommit !== record.candidateCommit ||
        deferred.reviewReady?.candidateTree !== record.candidateTree ||
        deferred.reviewReady?.receiptSha256 !== record.receipt.sha256 ||
        timeoutIncidentDigest(deferred.eligibleRepairAdmissions) !==
          timeoutIncidentDigest(record.eligibleRepairAdmissions) ||
        timeoutIncidentDigest(deferred.eligibleRepairTransaction) !==
          timeoutIncidentDigest(expectedTransaction) ||
        timeoutIncidentDigest(deferred.package) !== timeoutIncidentDigest(journal.packageProof)) {
      throw new Error(`Eligible repair admission ${entry.incidentId} lacks its exact committed deferral`);
    }
  }
  return record;
}

export async function recordEligibleRepairReviewTransaction(record, note, {
  repositoryRoot = repository,
  store = createTimeoutIncidentStore({ root:repositoryRoot }),
  receiptLoader,
  packsLoader,
  afterDeferrals,
} = {}) {
  const admissions = record.eligibleRepairAdmissions;
  if (!admissions) return { record, note };
  const input = {
    candidateCommit:record.candidateCommit, candidateTree:record.candidateTree,
    task:record.task, receiptSha256:record.receipt.sha256,
    admissionsDigest:record.eligibleRepairAdmissionsDigest,
  };
  const inputDigest = timeoutIncidentDigest(input);
  const id = timeoutIncidentDigest({ version:1, ...input });
  const transactionBinding = { version:1, id, inputDigest };
  const committedRecord = transactionRecord(record, id);
  const records = [...note.records.filter((item) =>
    !(item.task === record.task && item.baseCommit === record.baseCommit)), committedRecord];
  const desiredNote = { version:1, records };
  const incidentIds = admissions.entries.map(({ incidentId }) => incidentId).sort();
  return withVerificationNotesLock(repositoryRoot, () =>
    withEligibleRepairReviewTransactionLock(repositoryRoot, record.candidateCommit,
      ({ directory }) => store.withAdmissionRecordingLock(async() => {
    await rederiveEligibleRepairAdmissions(record, transactionBinding,
      { repositoryRoot, store, receiptLoader, packsLoader });
    const target = path.join(directory, `${id}.json`);
    const liveNote = await currentReviewNote(record.candidateCommit, repositoryRoot);
    const liveNoteDigest = timeoutIncidentDigest(liveNote);
    let journal = await readEligibleRepairReviewTransaction(target);
    if (!journal) {
      if (liveNoteDigest !== timeoutIncidentDigest(note)) {
        throw new Error("Eligible repair review transaction observed a competing review note writer");
      }
      const incidents = [];
      for (const entry of [...admissions.entries].sort((left, right) =>
        left.incidentId.localeCompare(right.incidentId))) {
        const incident = await store.read(entry.incidentId);
        if (incident.state !== "unresolved" || incident.repair?.status !== "eligible" ||
            incident.repair?.candidate?.commit !== record.candidateCommit ||
            incident.repair?.candidate?.tree !== record.candidateTree ||
            incident.failureDigest !== entry.failureDigest ||
            timeoutIncidentDigest(incident.repair) !== entry.repairDigest) {
          throw new Error(`Eligible repair admission ${entry.incidentId} changed before review recording`);
        }
        incidents.push({ id:entry.incidentId, repairDigest:entry.repairDigest });
      }
      journal = { version:1, id, status:"prepared", inputDigest,
        priorNoteDigest:timeoutIncidentDigest(note), desiredNoteDigest:timeoutIncidentDigest(desiredNote),
        incidentIds, incidents, preparedAt:new Date().toISOString() };
      await writeEligibleRepairReviewTransaction(target, journal);
    } else if (journal.inputDigest !== inputDigest ||
        journal.desiredNoteDigest !== timeoutIncidentDigest(desiredNote) ||
        timeoutIncidentDigest(journal.incidentIds) !== timeoutIncidentDigest(incidentIds)) {
      throw new Error("Eligible repair review transaction conflicts with existing prepared evidence");
    }
    if (journal.status === "committed") {
      if (liveNoteDigest !== journal.desiredNoteDigest) {
        throw new Error("Eligible repair review transaction committed note was replaced");
      }
      await verifyCommittedReviewTransaction(committedRecord, repositoryRoot, { store });
      return { record:committedRecord, note:desiredNote, journal };
    }
    if (!["prepared", "deferrals-written"].includes(journal.status)) {
      throw new Error("Eligible repair review transaction has an invalid recovery state");
    }
    const packageProof = await canonicalPackageProof(record, { root:repositoryRoot });
    const proof = admittedDeferralProof(record, packageProof, transactionBinding);
    for (const entry of [...admissions.entries].sort((left, right) =>
      left.incidentId.localeCompare(right.incidentId))) {
      await store.deferTerminalVerification(entry.incidentId, proof);
    }
    journal = { ...journal, status:"deferrals-written", packageProof,
      deferralsWrittenAt:journal.deferralsWrittenAt ?? new Date().toISOString() };
    await writeEligibleRepairReviewTransaction(target, journal);
    await afterDeferrals?.(structuredClone(journal));
    const currentNote = await currentReviewNote(record.candidateCommit, repositoryRoot);
    const currentNoteDigest = timeoutIncidentDigest(currentNote);
    if (currentNoteDigest !== journal.priorNoteDigest &&
        currentNoteDigest !== journal.desiredNoteDigest) {
      throw new Error("Eligible repair review transaction cannot overwrite a competing review note");
    }
    await git(repositoryRoot, ["notes", `--ref=${reviewNotesRef}`, "add", "-f", "-F", "-",
      record.candidateCommit], { input:JSON.stringify(desiredNote) });
    journal = { ...journal, status:"committed",
      committedAt:journal.committedAt ?? new Date().toISOString() };
    await writeEligibleRepairReviewTransaction(target, journal);
    return { record:committedRecord, note:desiredNote, journal };
  })));
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
  if (record.eligibleRepairAdmissions) {
    return (await recordEligibleRepairReviewTransaction(record, note,
      { repositoryRoot })).record;
  }
  return withVerificationNotesLock(repositoryRoot, async() => {
    const current = await currentReviewNote(candidateCommit, repositoryRoot);
    const records = [...current.records.filter((item) =>
      !(item.task === task && item.baseCommit === baseCommit)), record];
    await git(repositoryRoot,
      ["notes", `--ref=${reviewNotesRef}`, "add", "-f", "-F", "-", candidateCommit],
      { input:JSON.stringify({ version:1, records }) });
    return record;
  });
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
  await verifyCommittedReviewTransaction(record, repositoryRoot);
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
