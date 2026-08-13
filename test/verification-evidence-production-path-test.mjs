import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  closeCanonicalEvidencePlanPrerequisites,
  createPendingVerificationEvidence,
  verificationDigest,
  verifyVerificationEvidence,
} from "../scripts/verification-evidence.mjs";
import {
  loadVerificationPacks,
  planVerification,
  verificationTaskIdentity,
} from "../scripts/verification-packs.mjs";
import { canonicalVerificationChangeSet, verificationPacksAtCommit } from "../scripts/verification-changes.mjs";
import { createReviewReadyRecord } from "../scripts/settled-final-verification-review.mjs";
import { timeoutRepairPackageTaskIdentity } from "../scripts/verification-reliability-receipts.mjs";
import { verificationPromotionTasks } from "../scripts/verification-promotion-plan.mjs";

const exec = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const packs = await loadVerificationPacks();
const runnablePackIds = planVerification(packs, {
  terminalFull:true, includeProperties:true,
}).selectedPackIds;

async function git(root, ...args) {
  const result = await exec("git", args, { cwd:root, maxBuffer:64 * 1024 * 1024 });
  return result.stdout.trim();
}

async function commit(root, message) {
  await git(root, "add", "specification-builder.css", "test/verification-process-contract-test.mjs");
  await git(root, "commit", "-m", message);
  return git(root, "rev-parse", "HEAD");
}

function normalizedPlan(plan) {
  const packIds = [...new Set(plan.claimPackIds ?? plan.packIds ?? [])].sort();
  return {
    version:2, mode:plan.mode, packIds,
    selectedPackIds:[...plan.selectedPackIds].sort(),
    requestedPackIds:[...plan.requestedPackIds].sort(),
    changedPaths:[...plan.changedPaths].sort(), baseCommit:plan.baseCommit,
    changeSet:plan.changeSet, changedOwners:plan.changedOwners ?? {},
    changedBoundaries:plan.changedBoundaries ?? {},
    styleSmokeTargets:[...(plan.styleSmokeTargets ?? [])].sort(),
    terminalFullObligations:[...(plan.terminalFullObligations ?? [])].sort(),
    changedStyleTargets:plan.changedStyleTargets ?? {},
    adapterAuthorizationPackIds:[...(plan.adapterAuthorizationPackIds ?? [])].sort(),
    conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason ?? null,
    features:[...(plan.features ?? [])].sort(), handlers:[...(plan.handlers ?? [])].sort(),
    includeProperties:Boolean(plan.includeProperties), stages:plan.stages,
    tasks:plan.tasks.map(verificationTaskIdentity),
  };
}

function evidencePlan(rawPlan, candidatePacks) {
  const closed = closeCanonicalEvidencePlanPrerequisites(rawPlan, candidatePacks);
  const packageTask = structuredClone(timeoutRepairPackageTaskIdentity);
  return normalizedPlan({
    ...closed, tasks:[...closed.tasks, packageTask],
    stages:{ ...closed.stages, package:[] },
  });
}

function receiptFor(plan, commitId, tree, artifact, runId) {
  const routeFor = (identity) => identity.requiredCapabilities?.length ? "approved-host" : "workspace-sandbox";
  const executionPrerequisites = plan.tasks.map((identity) => ({
    key:identity.key, requiredCapabilities:identity.requiredCapabilities, route:routeFor(identity),
  }));
  const promotionExecutionPrerequisites = verificationPromotionTasks().map((identity) => ({
    key:identity.key, requiredCapabilities:identity.requiredCapabilities, route:routeFor(identity),
  }));
  const planSummary = {
    mode:plan.mode, requestedPackIds:plan.requestedPackIds, selectedPackIds:plan.selectedPackIds,
    changedPaths:plan.changedPaths, changedOwners:plan.changedOwners,
    changedBoundaries:plan.changedBoundaries, styleSmokeTargets:plan.styleSmokeTargets,
    terminalFullObligations:plan.terminalFullObligations,
    changedStyleTargets:plan.changedStyleTargets,
    adapterAuthorizationPackIds:plan.adapterAuthorizationPackIds,
    changeSetDigest:verificationDigest(plan.changeSet),
    conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason,
    executionPrerequisites, promotionExecutionPrerequisites,
  };
  const environment = {
    node:artifact.toolchain.node, typescript:artifact.toolchain.typescript,
    platform:"linux-x64", executionLoad:"normal", concurrency:1, observationConcurrency:1,
  };
  const tasks = Object.fromEntries(plan.tasks.map((identity) => [identity.key, {
    identity, status:"passed", durationMs:1,
    executionPrerequisites:{ requiredCapabilities:identity.requiredCapabilities, launchRoute:routeFor(identity) },
    output:"fixture-pass",
  }]));
  return {
    version:2, runId, startedAt:"2026-08-13T10:00:00.000Z", completedAt:"2026-08-13T10:00:01.000Z",
    candidate:{ commit:commitId, tree, baseCommit:plan.baseCommit, evidenceTask:"fixture-evidence",
      changeSetDigest:verificationDigest(plan.changeSet) },
    plan:planSummary, tasks, environment, artifact,
  };
}

async function writeVerificationNote(root, commitId, record) {
  const notePath = path.join(root, "tmp", `verification-note-${commitId}.json`);
  await writeFile(notePath, `${JSON.stringify({ version:2, records:[record] })}\n`);
  await git(root, "notes", "--ref=refs/notes/swarmforge-verification", "add", "-f", "-F", notePath, commitId);
}

async function writeReviewNote(root, commitId, record) {
  const notePath = path.join(root, "tmp", `review-note-${commitId}.json`);
  await writeFile(notePath, `${JSON.stringify({ version:1, records:[record] })}\n`);
  await git(root, "notes", "--ref=refs/notes/swarmforge-review-ready", "add", "-f", "-F", notePath, commitId);
}

const fixture = await mkdtemp(path.join(os.tmpdir(), "verification-evidence-production-") );
try {
  await exec("git", ["clone", "--no-local", repositoryRoot, fixture], { maxBuffer:64 * 1024 * 1024 });
  const root = fixture;
  await git(root, "config", "user.email", "fixture@example.invalid");
  await git(root, "config", "user.name", "Verification Fixture");
  await mkdir(path.join(root, "tmp", "verification-receipts"), { recursive:true });
  await writeFile(path.join(root, "dist", ".dist-artifact.json"),
    await readFile(path.join(repositoryRoot, "dist", ".dist-artifact.json")));
  const masterBase = await git(root, "rev-parse", "HEAD");
  const artifact = JSON.parse(await readFile(path.join(root, "dist", ".dist-artifact.json"), "utf8"));

  await writeFile(path.join(root, "specification-builder.css"),
    `${await readFile(path.join(root, "specification-builder.css"), "utf8")}\n/* fixture stylesheet obligation */\n`);
  const originCommit = await commit(root, "fixture: create pending stylesheet obligation");
  const originTree = await git(root, "rev-parse", `${originCommit}^{tree}`);
  const originChangeSet = await canonicalVerificationChangeSet({
    base:masterBase, commit:originCommit, repositoryRoot:root,
  });
  const originReceipt = {
    version:2, runId:"origin-focused", startedAt:"2026-08-13T10:00:00.000Z",
    completedAt:"2026-08-13T10:00:01.000Z", candidate:{ commit:originCommit, tree:originTree },
    plan:{ changedPaths:originChangeSet.paths, requestedPackIds:["shell"],
      terminalFullObligations:["specification-builder.css"] },
    tasks:{ "unit:test/verification-process-contract-test.mjs":{
      identity:{ key:"unit:test/verification-process-contract-test.mjs" }, status:"passed" } },
  };
  const reviewRecord = createReviewReadyRecord({
    task:"fixture-stylesheet-slice", baseCommit:masterBase,
    candidateCommit:originCommit, candidateTree:originTree, changeSet:originChangeSet,
    receipt:originReceipt, receiptPath:"tmp/verification-receipts/origin.json", receiptSha256:"a".repeat(64),
  });
  await writeReviewNote(root, originCommit, reviewRecord);

  await writeFile(path.join(root, "test/verification-process-contract-test.mjs"),
    `${await readFile(path.join(root, "test/verification-process-contract-test.mjs"), "utf8")}\n// focused descendant fixture\n`);
  const focusedCommit = await commit(root, "fixture: focused descendant evidence");
  const focusedTree = await git(root, "rev-parse", `${focusedCommit}^{tree}`);
  const focusedChangeSet = await canonicalVerificationChangeSet({
    base:masterBase, commit:focusedCommit, repositoryRoot:root,
  });
  const focusedRawPlan = planVerification(packs, {
    packIds:["shell"], changedPaths:focusedChangeSet.paths, changeSet:focusedChangeSet,
    basePacks:packs, includeProperties:true,
  });
  const focusedPlan = evidencePlan(focusedRawPlan, packs);
  assert.equal(focusedPlan.packIds.length, 1, "focused fixture remains one-pack evidence");
  assert.equal(focusedPlan.terminalFullObligations.length, 1, "focused plan retains the stylesheet obligation boundary");
  const focusedReceipt = receiptFor(focusedPlan, focusedCommit, focusedTree, artifact, "focused-descendant");
  const focusedReceiptPath = path.join(root, "tmp/verification-receipts/focused.json");
  await writeFile(focusedReceiptPath, JSON.stringify(focusedReceipt));
  const focusedPending = await createPendingVerificationEvidence({
    task:"fixture-evidence", plan:focusedPlan, receiptPath:focusedReceiptPath,
    changedSince:masterBase, buildManifest:artifact, repositoryRoot:root,
    toolchainValidator:async() => {},
  });
  assert.equal(focusedPending.evidence.consumedTerminalObligations, undefined,
    "focused evidence does not carry terminal consumption");
  await writeVerificationNote(root, focusedCommit, {
    ...focusedPending.evidence, status:"passed", recordedAt:"2026-08-13T10:00:02.000Z",
  });
  const focusedVerified = await verifyVerificationEvidence(
    focusedCommit, masterBase, "fixture-evidence", ["shell"], { repositoryRoot:root });
  assert.deepEqual(focusedVerified.consumedTerminalObligations, [],
    "production verify retains a pending obligation for focused evidence");

  await writeFile(path.join(root, "test/verification-process-contract-test.mjs"),
    `${await readFile(path.join(root, "test/verification-process-contract-test.mjs"), "utf8")}\n// canonical descendant fixture\n`);
  const terminalCommit = await commit(root, "fixture: canonical descendant evidence");
  const terminalTree = await git(root, "rev-parse", `${terminalCommit}^{tree}`);
  const terminalChangeSet = await canonicalVerificationChangeSet({
    base:masterBase, commit:terminalCommit, repositoryRoot:root,
  });
  const terminalRawPlan = planVerification(packs, {
    packIds:runnablePackIds, changedPaths:terminalChangeSet.paths, changeSet:terminalChangeSet,
    basePacks:packs, includeProperties:true,
  });
  assert.deepEqual(terminalRawPlan.selectedPackIds, runnablePackIds,
    "canonical explicit selection retains every runnable selected pack");
  assert.deepEqual(terminalRawPlan.packIds, runnablePackIds,
    "canonical explicit selection retains every runnable pack claim");
  assert.ok(terminalRawPlan.tasks.some(({ packId }) => packId && packId !== "shell"),
    "canonical execution includes non-Shell pack tasks");
  const terminalPlan = evidencePlan(terminalRawPlan, packs);
  assert.equal(terminalPlan.packIds.length, 20, "terminal fixture uses the canonical runnable pack set");
  assert.ok(terminalPlan.tasks.some(({ key }) => key.startsWith("property:")),
    "terminal fixture retains property tasks");
  assert.deepEqual(terminalPlan.terminalFullObligations, ["specification-builder.css"]);
  const terminalReceipt = receiptFor(terminalPlan, terminalCommit, terminalTree, artifact, "canonical-descendant");
  const terminalReceiptPath = path.join(root, "tmp/verification-receipts/terminal.json");
  await writeFile(terminalReceiptPath, JSON.stringify(terminalReceipt));
  const terminalPending = await createPendingVerificationEvidence({
    task:"fixture-evidence", plan:terminalPlan, receiptPath:terminalReceiptPath,
    changedSince:masterBase, buildManifest:artifact, repositoryRoot:root,
    toolchainValidator:async() => {},
  });
  assert.equal(terminalPending.evidence.consumedTerminalObligations.length, 1,
    "terminal preparation discovers the ancestor obligation");
  const terminalRecord = {
    ...terminalPending.evidence, status:"passed", recordedAt:"2026-08-13T10:00:03.000Z",
  };
  await writeVerificationNote(root, terminalCommit, terminalRecord);
  const terminalVerified = await verifyVerificationEvidence(
    terminalCommit, masterBase, "fixture-evidence", runnablePackIds, { repositoryRoot:root });
  assert.equal(terminalVerified.consumedTerminalObligations.length, 1,
    "production verify consumes the conserved ancestor obligation");
  assert.equal(terminalVerified.consumedTerminalObligations[0].originCommit, originCommit);
  assert.equal(terminalVerified.consumedTerminalObligations[0].consumedByCommit, terminalCommit);

  await writeVerificationNote(root, terminalCommit, {
    ...terminalRecord, consumedTerminalObligations:[],
  });
  await assert.rejects(
    verifyVerificationEvidence(terminalCommit, masterBase, "fixture-evidence", runnablePackIds, { repositoryRoot:root }),
    /evidence id|consumption|terminal obligation/i,
    "production verify rejects an omitted or forged consumption list",
  );
} finally {
  await rm(fixture, { recursive:true, force:true });
}

console.log("verification evidence production-path fixture passed");
