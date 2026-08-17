import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { verificationPacksAtCommit } from "./verification-changes.mjs";
import {
  verificationPackTaskKeys,
  planVerification,
  verificationSliceDeclaration,
} from "./verification-packs.mjs";

const repository = fileURLToPath(new URL("../", import.meta.url));
const notesRef = "refs/notes/swarmforge-verification-slice-quarantine";
const reviewNotesRef = "refs/notes/swarmforge-review-ready";
const slicePattern = /^[a-z0-9][a-z0-9_-]*$/u;
const taskPattern = /^[A-Za-z0-9][A-Za-z0-9._:+/-]{0,255}$/u;
const sha1Pattern = /^[a-f0-9]{40}$/u;

function git(root, args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile("git", args, { cwd:root, maxBuffer:16 * 1024 * 1024 },
      (error, stdout, stderr) => error
        ? reject(new Error(stderr.trim() || error.message))
        : resolve(stdout.trim()));
    if (input !== undefined) child.stdin.end(input);
  });
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableSliceId(value) {
  if (!slicePattern.test(value ?? "")) throw new Error("Use a stable verification slice id");
  return value;
}

async function noteAt(root, ref, commit, fallback) {
  try { return JSON.parse(await git(root, ["notes", `--ref=${ref}`, "show", commit])); }
  catch (error) {
    if (/no note found|cannot read note data|bad object/iu.test(error.message)) return fallback;
    throw error;
  }
}

export function activeVerificationSliceIdsFromTransitions(rows) {
  const states = new Map();
  for (const row of rows) {
    const transition = row.transition ?? row;
    stableSliceId(transition.sliceId);
    if (transition.kind === "selection-miss") states.set(transition.sliceId, true);
    else if (transition.kind === "mapping-repair") states.set(transition.sliceId, false);
    else throw new Error(`Unknown verification slice quarantine transition: ${transition.kind}`);
  }
  return [...states].filter(([, active]) => active).map(([sliceId]) => sliceId).sort();
}

async function applicableTransitions(commit, root) {
  const canonical = await git(root, ["rev-parse", `${commit}^{commit}`]);
  const ancestry = (await git(root, ["rev-list", "--reverse", canonical])).split("\n").filter(Boolean);
  const order = new Map(ancestry.map((item, index) => [item, index]));
  let listed;
  try { listed = await git(root, ["notes", `--ref=${notesRef}`, "list"]); }
  catch (error) {
    if (/cannot read|unknown revision|bad object/iu.test(error.message)) return [];
    throw error;
  }
  const rows = [];
  for (const line of listed.split("\n").filter(Boolean)) {
    const [, annotated] = line.trim().split(/\s+/u);
    if (!order.has(annotated)) continue;
    const note = await noteAt(root, notesRef, annotated, { version:1, transitions:[] });
    if (note.version !== 1 || !Array.isArray(note.transitions)) {
      throw new Error("Verification slice quarantine note has an invalid schema");
    }
    note.transitions.forEach((transition, index) => rows.push({
      commit:annotated, order:order.get(annotated), index, transition,
    }));
  }
  return rows.sort((left, right) => left.order - right.order || left.index - right.index);
}

export async function activeVerificationSliceQuarantineIds(commit = "HEAD", {
  repositoryRoot = repository,
} = {}) {
  return activeVerificationSliceIdsFromTransitions(await applicableTransitions(commit, repositoryRoot));
}

async function appendTransition(commit, transition, root) {
  const canonical = await git(root, ["rev-parse", `${commit}^{commit}`]);
  const note = await noteAt(root, notesRef, canonical, { version:1, transitions:[] });
  if (note.version !== 1 || !Array.isArray(note.transitions)) {
    throw new Error("Verification slice quarantine note has an invalid schema");
  }
  const duplicate = note.transitions.some((item) => item.kind === transition.kind &&
    item.sliceId === transition.sliceId && item.receiptSha256 === transition.receiptSha256 &&
    item.reviewReceiptSha256 === transition.reviewReceiptSha256);
  if (duplicate) return transition;
  const next = { version:1, transitions:[...note.transitions, transition] };
  await git(root, ["notes", `--ref=${notesRef}`, "add", "-f", "-F", "-", canonical], {
    input:JSON.stringify(next),
  });
  return transition;
}

async function reviewRecordsBetween(baseCommit, candidateCommit, root) {
  const commits = (await git(root, ["rev-list", "--reverse", `${baseCommit}..${candidateCommit}`]))
    .split("\n").filter(Boolean);
  const records = [];
  for (const commit of commits) {
    const note = await noteAt(root, reviewNotesRef, commit, { version:1, records:[] });
    if (note.version !== 1 || !Array.isArray(note.records)) continue;
    for (const record of note.records) records.push({ annotatedCommit:commit, record });
  }
  return records;
}

export async function recordVerificationSliceSelectionMiss({
  receiptPath, sliceId, failedTaskKey, repositoryRoot = repository,
} = {}) {
  stableSliceId(sliceId);
  if (!taskPattern.test(failedTaskKey ?? "")) {
    throw new Error("Selection miss requires the exact failed terminal task key");
  }
  const absolute = path.resolve(repositoryRoot, receiptPath ?? "");
  const relative = path.relative(repositoryRoot, absolute).split(path.sep).join("/");
  if (!/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(relative)) {
    throw new Error("Selection miss requires a runner-owned terminal receipt");
  }
  const bytes = await readFile(absolute);
  const receipt = JSON.parse(bytes);
  const candidateCommit = receipt.candidate?.commit;
  const candidateTree = receipt.candidate?.tree;
  const baseCommit = receipt.candidate?.baseCommit;
  const taskResult = receipt.tasks?.[failedTaskKey];
  if (receipt.version !== 2 || receipt.runIntent !== "terminal" ||
      !sha1Pattern.test(candidateCommit ?? "") || !sha1Pattern.test(candidateTree ?? "") ||
      !sha1Pattern.test(baseCommit ?? "") || taskResult?.status !== "failed") {
    throw new Error("Selection miss requires a bound failed terminal receipt");
  }
  const [actualCommit, actualTree, packs, records] = await Promise.all([
    git(repositoryRoot, ["rev-parse", `${candidateCommit}^{commit}`]),
    git(repositoryRoot, ["rev-parse", `${candidateCommit}^{tree}`]),
    verificationPacksAtCommit(candidateCommit, { repositoryRoot }),
    reviewRecordsBetween(baseCommit, candidateCommit, repositoryRoot),
  ]);
  const runnablePackIds = packs.filter((pack) => [
    ...(pack.unit ?? []), ...(pack.property ?? []), ...(pack.browserAdapters ?? []),
    ...(pack.browserObservations ?? []), ...(pack.features ?? []),
    ...(pack.checkpointCommands ?? []),
  ].length).map(({ id }) => id).sort();
  if (actualCommit !== candidateCommit || actualTree !== candidateTree ||
      receipt.plan?.mode !== "exact" ||
      JSON.stringify([...(receipt.plan?.selectedPackIds ?? [])].sort()) !== JSON.stringify(runnablePackIds)) {
    throw new Error("Selection miss requires the canonical all-pack terminal comparison");
  }
  const applicable = [];
  for (const row of records) {
    const record = row.record;
    let focusedPacks;
    let focusedBasePacks;
    try {
      [focusedPacks, focusedBasePacks] = await Promise.all([
        verificationPacksAtCommit(record.candidateCommit, { repositoryRoot }),
        verificationPacksAtCommit(record.baseCommit, { repositoryRoot }),
      ]);
    } catch { continue; }
    let focusedPlan;
    try {
      focusedPlan = planVerification(focusedPacks, {
        changedPaths:record.changeSet?.paths ?? [], changeSet:record.changeSet,
        basePacks:focusedBasePacks, includeProperties:true,
        quarantinedSliceIds:await activeVerificationSliceQuarantineIds(
          record.candidateCommit, {repositoryRoot},
        ),
      });
    } catch { continue; }
    if (Object.values(focusedPlan.selectedVerificationSlices).flat().includes(sliceId)) {
      applicable.push({ ...row, focusedPlan });
    }
  }
  if (!applicable.length) {
    throw new Error(`Terminal candidate has no bound focused evidence for verification slice ${sliceId}`);
  }
  const latest = applicable.at(-1);
  const focusedRecord = latest.record;
  const { verifyReviewReadyEvidence } = await import("./settled-final-verification.mjs");
  const reviewed = await verifyReviewReadyEvidence(
    focusedRecord.candidateCommit, focusedRecord.baseCommit, focusedRecord.task, {repositoryRoot},
  );
  if (reviewed.receipt?.sha256 !== focusedRecord.receipt?.sha256) {
    throw new Error("Selection miss focused evidence is not the bound reviewed record");
  }
  if (focusedRecord.focusedScope.taskKeys.includes(failedTaskKey)) {
    throw new Error(`Terminal task ${failedTaskKey} was already covered by the applicable focused slice`);
  }
  const scopedPackIds = Object.entries(latest.focusedPlan.selectedVerificationSlices)
    .filter(([, ids]) => ids.includes(sliceId)).map(([packId]) => packId);
  if (!scopedPackIds.some((packId) => {
    const pack = packs.find(({id}) => id === packId);
    return pack && verificationPackTaskKeys(pack).has(failedTaskKey);
  })) {
    throw new Error(`Terminal task ${failedTaskKey} is outside the quarantined slice parent closure`);
  }
  const transition = {
    version:1,
    kind:"selection-miss",
    sliceId,
    terminalCandidateCommit:candidateCommit,
    terminalCandidateTree:candidateTree,
    terminalBaseCommit:baseCommit,
    failedTaskKey,
    focusedCandidateCommit:focusedRecord.candidateCommit,
    focusedReceiptSha256:focusedRecord.receipt.sha256,
    receiptPath:relative,
    receiptSha256:digest(bytes),
    recordedAt:new Date().toISOString(),
  };
  return appendTransition(focusedRecord.candidateCommit, transition, repositoryRoot);
}

export async function recordVerificationSliceMappingRepair({
  commit, base, task, sliceId, repositoryRoot = repository,
} = {}) {
  stableSliceId(sliceId);
  const [candidateCommit, qaCommit] = await Promise.all([
    git(repositoryRoot, ["rev-parse", `${commit}^{commit}`]),
    git(repositoryRoot, ["rev-parse", "refs/heads/qa^{commit}"]),
  ]);
  if (candidateCommit !== qaCommit) {
    throw new Error("Verification slice mapping repair must already be integrated at the exact QA head");
  }
  const { verifyReviewReadyEvidence } = await import("./settled-final-verification.mjs");
  const review = await verifyReviewReadyEvidence(candidateCommit, base, task, { repositoryRoot });
  if (!review.changeSet.paths.includes("verification/packs.json")) {
    throw new Error("Verification slice mapping repair must change the canonical pack registry");
  }
  const active = await activeVerificationSliceQuarantineIds(`${candidateCommit}^`, { repositoryRoot });
  if (!active.includes(sliceId)) throw new Error(`Verification slice ${sliceId} is not quarantined`);
  const packs = await verificationPacksAtCommit(candidateCommit, { repositoryRoot });
  const declarations = packs.flatMap((pack) => (pack.verificationSlices ?? [])
    .filter(({ id }) => id === sliceId).map((slice) => ({ pack, slice })));
  if (declarations.length !== 1 ||
      verificationSliceDeclaration(packs, declarations[0].pack, declarations[0].slice).length) {
    throw new Error("Reviewed mapping repair does not install one observable verification slice");
  }
  const transition = {
    version:1,
    kind:"mapping-repair",
    sliceId,
    candidateCommit,
    candidateTree:review.candidateTree,
    baseCommit:review.baseCommit,
    reviewTask:review.task,
    reviewReceiptSha256:review.receipt.sha256,
    recordedAt:new Date().toISOString(),
  };
  return appendTransition(candidateCommit, transition, repositoryRoot);
}

async function main([operation, ...args]) {
  if (operation === "record-selection-miss" && args.length === 3) {
    const transition = await recordVerificationSliceSelectionMiss({
      receiptPath:args[0], sliceId:args[1], failedTaskKey:args[2],
    });
    console.log(`verification slice quarantined: ${transition.sliceId} (${transition.failedTaskKey})`);
    return;
  }
  if (operation === "record-slice-repair" && args.length === 4) {
    const transition = await recordVerificationSliceMappingRepair({
      commit:args[0], base:args[1], task:args[2], sliceId:args[3],
    });
    console.log(`verification slice mapping repaired: ${transition.sliceId}`);
    return;
  }
  throw new Error("Use: verification-slice-quarantine.mjs record-selection-miss <terminal-receipt> <slice-id> <failed-task-key> | record-slice-repair <commit> <base> <task> <slice-id>");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
