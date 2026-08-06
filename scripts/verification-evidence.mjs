import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { link, mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertFreshDist } from "./dist-artifact.mjs";
import { acquireDistArtifactLock, inheritedDistArtifactLockIsHeld } from "./dist-artifact-lock.mjs";
import {
  canonicalVerificationChangeSet,
  requireGitAncestor,
  verificationPacksAtCommit,
} from "./verification-changes.mjs";
import { planVerification, verificationTaskIdentity } from "./verification-packs.mjs";

const repository = fileURLToPath(new URL("../", import.meta.url));
const notesRef = "refs/notes/swarmforge-verification";
const shaPattern = /^[a-f0-9]{64}$/u;
const runtimeVersionPattern = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/u;

function git(repositoryRoot, ...args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd:repositoryRoot }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim()));
  });
}

function gitBytes(repositoryRoot, ...args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd:repositoryRoot, encoding:"buffer" }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.toString().trim() || error.message))
      : resolve(stdout));
  });
}

function gitInput(repositoryRoot, args, input) {
  return new Promise((resolve, reject) => {
    const child = execFile("git", args, { cwd:repositoryRoot }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim()));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(normalized(value));
}

export function verificationDigest(value) {
  return createHash("sha256").update(
    typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(value),
  ).digest("hex");
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function assertTaskName(task) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/u.test(task ?? "")) {
    throw new Error("Provide a stable task name (letters, numbers, dot, underscore, or hyphen; max 80)");
  }
}

function artifactIdentity(manifest) {
  const identity = {
    schemaVersion:manifest?.schemaVersion,
    buildIdentity:manifest?.buildIdentity,
    inputDigest:manifest?.inputDigest,
    outputDigest:manifest?.outputDigest,
    toolchain:{
      node:manifest?.toolchain?.node,
      typescript:manifest?.toolchain?.typescript,
    },
  };
  if (identity.schemaVersion !== 1 || [identity.buildIdentity, identity.inputDigest, identity.outputDigest]
      .some((value) => !shaPattern.test(value ?? "")) ||
      Object.values(identity.toolchain).some((value) => !runtimeVersionPattern.test(value ?? ""))) {
    throw new Error("A validated dist artifact identity is required for verification evidence");
  }
  return identity;
}

function receiptEnvironment(environment) {
  const keys = ["concurrency", "executionLoad", "node", "observationConcurrency", "platform", "typescript"];
  if (!environment || Array.isArray(environment) ||
      !same(Object.keys(environment).sort(), keys) ||
      !runtimeVersionPattern.test(environment.node ?? "") ||
      !runtimeVersionPattern.test(environment.typescript ?? "") ||
      !/^[a-z0-9]+-[A-Za-z0-9_]+$/u.test(environment.platform ?? "") ||
      !["normal", "loaded"].includes(environment.executionLoad) ||
      !Number.isInteger(environment.concurrency) || environment.concurrency < 1 ||
      !Number.isInteger(environment.observationConcurrency) || environment.observationConcurrency < 1) {
    throw new Error("Verification receipt has an invalid exact runtime environment");
  }
  return {
    node:environment.node,
    typescript:environment.typescript,
    platform:environment.platform,
    executionLoad:environment.executionLoad,
    concurrency:environment.concurrency,
    observationConcurrency:environment.observationConcurrency,
  };
}

function planDocument(plan) {
  if (plan?.version !== 2 || !Array.isArray(plan.tasks)) {
    throw new Error("Verification evidence requires a version 2 structured plan");
  }
  const packIds = sortedUnique(plan.claimPackIds ?? plan.packIds ?? []);
  if (plan.mode !== "exact" || !packIds.length || !same(packIds, sortedUnique(plan.requestedPackIds ?? []))) {
    throw new Error("Verification evidence requires exact explicit known pack(s)");
  }
  if (plan.skipBuild || plan.shard || plan.withDependencies) {
    throw new Error("Verification evidence cannot use --no-build, --shard, or --with-dependencies");
  }
  if (!same(sortedUnique(plan.selectedPackIds ?? []), packIds)) {
    throw new Error("Evidence pack claims must equal the packs whose stages were executed");
  }
  if (plan.includeProperties !== true) {
    throw new Error("Verification evidence requires every registered property leaf; add --property");
  }
  if (plan.changeSet?.version !== 1 || !plan.baseCommit ||
      plan.changeSet.baseCommit !== plan.baseCommit ||
      !same(sortedUnique(plan.changeSet.paths ?? []), sortedUnique(plan.changedPaths ?? []))) {
    throw new Error("Verification evidence requires the canonical version 1 Git change set");
  }
  const identities = plan.tasks.map(verificationTaskIdentity);
  const keys = identities.map(({ key }) => key);
  if (!identities.length || new Set(keys).size !== keys.length) {
    throw new Error("Verification evidence requires a non-empty plan with unique task identities");
  }
  for (const packId of packIds) {
    if (!identities.some((identity) => identity.packId === packId)) {
      throw new Error(`Claimed pack has no executed verification stage: ${packId}`);
    }
  }
  return {
    version:2,
    mode:plan.mode,
    packIds,
    selectedPackIds:sortedUnique(plan.selectedPackIds),
    requestedPackIds:sortedUnique(plan.requestedPackIds),
    changedPaths:sortedUnique(plan.changedPaths ?? []),
    baseCommit:plan.baseCommit,
    changeSet:plan.changeSet,
    changedOwners:plan.changedOwners ?? {},
    changedBoundaries:plan.changedBoundaries ?? {},
    conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason ?? null,
    features:[...(plan.features ?? [])].sort(),
    handlers:[...(plan.handlers ?? [])].sort(),
    includeProperties:Boolean(plan.includeProperties),
    stages:plan.stages,
    tasks:identities,
  };
}

async function canonicalPlanDocument({ commit, baseCommit, changeSet, packIds, repositoryRoot }) {
  const candidatePacks = await verificationPacksAtCommit(commit, { repositoryRoot });
  let basePacks;
  let historicalRegistryFallback = false;
  try {
    basePacks = await verificationPacksAtCommit(baseCommit, { repositoryRoot });
  } catch {
    historicalRegistryFallback = true;
  }
  return planDocument(planVerification(candidatePacks, {
    packIds,
    changedPaths:changeSet.paths,
    includeProperties:true,
    changeSet,
    basePacks,
    historicalRegistryFallback,
  }));
}

async function assertCanonicalPlan(recordPlan, details) {
  const canonical = await canonicalPlanDocument(details);
  if (!same(recordPlan, canonical)) {
    throw new Error("Verification evidence plan does not match the committed pack registry");
  }
  return canonical;
}

async function parsedReceipt(receiptPath, plan) {
  if (!receiptPath) throw new Error("Provide the verification receipt produced by this run");
  const bytes = await readFile(receiptPath);
  let receipt;
  try { receipt = JSON.parse(bytes); }
  catch { throw new Error(`Verification receipt is not valid JSON: ${receiptPath}`); }
  if (receipt?.version !== 2 || !receipt.tasks || Array.isArray(receipt.tasks)) {
    throw new Error("Verification evidence requires a version 2 task receipt");
  }
  if (!receipt.completedAt || Number.isNaN(Date.parse(receipt.completedAt))) {
    throw new Error("Verification evidence requires a completed task receipt");
  }
  const environment = receiptEnvironment(receipt.environment);
  const receiptArtifact = artifactIdentity(receipt.artifact);
  const expectedPlanSummary = {
    mode:plan.mode,
    requestedPackIds:plan.requestedPackIds,
    selectedPackIds:plan.selectedPackIds,
    changedOwners:plan.changedOwners,
    changedBoundaries:plan.changedBoundaries,
    changeSetDigest:verificationDigest(plan.changeSet),
    conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason,
  };
  if (!same(receipt.plan, expectedPlanSummary)) {
    throw new Error("Verification receipt plan selection summary does not match the executed plan");
  }
  const expected = new Map(plan.tasks.map((identity) => [identity.key, identity]));
  const actualKeys = Object.keys(receipt.tasks).sort();
  if (!same(actualKeys, [...expected.keys()].sort())) {
    const missing = [...expected.keys()].filter((key) => !actualKeys.includes(key));
    const extra = actualKeys.filter((key) => !expected.has(key));
    throw new Error(`Receipt task set does not match the plan (missing: ${missing.join(",") || "none"}; extra: ${extra.join(",") || "none"})`);
  }
  const results = [];
  for (const [key, identity] of expected) {
    const result = receipt.tasks[key];
    if (result?.status !== "passed") throw new Error(`Required verification task did not pass: ${key}`);
    if (!same(result.identity, identity)) throw new Error(`Receipt task identity does not match the plan: ${key}`);
    if (!Number.isFinite(result.durationMs) || result.durationMs < 0) {
      throw new Error(`Receipt task has no valid duration: ${key}`);
    }
    results.push({
      key,
      identity,
      status:"passed",
      durationMs:result.durationMs,
      outputSha256:verificationDigest(result.output ?? ""),
    });
  }
  return { bytes, results, environment, artifact:receiptArtifact };
}

async function repositoryIdentity(repositoryRoot) {
  const [registry, toolchain] = await Promise.all([
    readFile(path.join(repositoryRoot, "verification/packs.json")),
    readFile(path.join(repositoryRoot, "swarmforge/toolchain.lock.json")),
  ]);
  const lock = JSON.parse(toolchain);
  const runtime = {
    node:lock?.node?.version,
    typescript:lock?.typescript?.version,
  };
  if (Object.values(runtime).some((value) => !runtimeVersionPattern.test(value ?? ""))) {
    throw new Error("Toolchain lock has no valid Node and TypeScript runtime identity");
  }
  return {
    registrySha256:verificationDigest(registry),
    toolchainSha256:verificationDigest(toolchain),
    runtime,
  };
}

export async function validateStrictVerificationToolchain({ repositoryRoot = repository } = {}) {
  const checker = path.join(repositoryRoot, "scripts", "check-swarmforge-toolchain.mjs");
  await new Promise((resolve, reject) => {
    execFile(process.execPath, [checker, "--strict-runtime"], {
      cwd:repositoryRoot,
      maxBuffer:16 * 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Strict verification toolchain preflight failed: ${stderr.trim() || stdout.trim() || error.message}`));
        return;
      }
      if (stdout.trim()) console.error(stdout.trim());
      if (stderr.trim()) console.error(stderr.trim());
      resolve();
    });
  });
}

async function cleanCandidate(repositoryRoot) {
  const dirty = await git(repositoryRoot, "status", "--porcelain", "--untracked-files=all");
  if (dirty) throw new Error("Commit candidate changes before preparing or recording verification evidence");
}

export async function validateVerificationCandidateClean({ repositoryRoot = repository } = {}) {
  await cleanCandidate(repositoryRoot);
}

export async function validateVerificationEvidenceCompatibility({
  task,
  plan,
  receiptPath,
  changedSince,
  buildManifest,
  repositoryRoot = repository,
  requireCompletedReceipt = false,
}) {
  assertTaskName(task);
  if (!changedSince?.trim()) throw new Error("Evidence preparation requires --changed-since <commit>");
  await cleanCandidate(repositoryRoot);
  const [commit, tree, baseCommit, sourceIdentity] = await Promise.all([
    git(repositoryRoot, "rev-parse", "HEAD^{commit}"),
    git(repositoryRoot, "rev-parse", "HEAD^{tree}"),
    git(repositoryRoot, "rev-parse", `${changedSince}^{commit}`),
    repositoryIdentity(repositoryRoot),
  ]);
  const planRecord = planDocument(plan);
  const actualChangeSet = await canonicalVerificationChangeSet({
    base:baseCommit,
    commit,
    repositoryRoot,
  });
  if (!actualChangeSet.paths.length) {
    throw new Error("Verification evidence requires a non-empty committed candidate range");
  }
  if (!same(actualChangeSet, planRecord.changeSet)) {
    throw new Error("Planned canonical change set does not match the committed candidate range");
  }
  await assertCanonicalPlan(planRecord, {
    commit,
    baseCommit,
    changeSet:actualChangeSet,
    packIds:planRecord.packIds,
    repositoryRoot,
  });
  const receiptSourcePath = repositoryRelativePath(repositoryRoot, receiptPath, "Verification receipt");
  if (!validRawReceiptPath(receiptSourcePath)) {
    throw new Error("Verification receipt must be runner-owned under tmp/verification-receipts");
  }
  const absoluteReceiptPath = path.join(repositoryRoot, receiptSourcePath);
  if (!requireCompletedReceipt) {
    const receipt = JSON.parse(await readFile(absoluteReceiptPath, "utf8"));
    if (receipt?.version !== 2 || !receipt.tasks || Array.isArray(receipt.tasks)) {
      throw new Error("Verification evidence requires a version 2 task receipt contract");
    }
    const environment = receiptEnvironment(receipt.environment);
    if (!same({ node:environment.node, typescript:environment.typescript }, sourceIdentity.runtime)) {
      throw new Error("Verification receipt contract and locked runtime identities must match");
    }
    return {
      commit, tree, baseCommit, sourceIdentity, planRecord, actualChangeSet,
      receiptSourcePath, environment,
    };
  }
  const [{ bytes, results, environment, artifact:receiptArtifact }] = await Promise.all([
    parsedReceipt(absoluteReceiptPath, planRecord),
  ]);
  const artifact = artifactIdentity(buildManifest);
  if (!same(receiptArtifact, artifact) ||
      !same({ node:environment.node, typescript:environment.typescript }, sourceIdentity.runtime) ||
      !same(artifact.toolchain, sourceIdentity.runtime)) {
    throw new Error("Verification receipt, supplied artifact, and locked runtime identities must match");
  }
  return {
    commit, tree, baseCommit, sourceIdentity, planRecord, actualChangeSet,
    receiptSourcePath, bytes, results, environment, artifact,
  };
}

function pendingPathFor(repositoryRoot, task, planDigest) {
  return path.join(
    repositoryRoot,
    "tmp",
    "verification-evidence",
    `${task}-${planDigest.slice(0, 16)}-${process.pid}-${randomUUID()}.pending.json`,
  );
}

function repositoryRelativePath(repositoryRoot, candidate, label) {
  const absolute = path.resolve(candidate);
  const relative = path.relative(path.resolve(repositoryRoot), absolute).split(path.sep).join("/");
  if (!relative || relative === ".." || relative.startsWith("../") || path.posix.isAbsolute(relative) ||
      relative.includes("\\") || relative.includes("\0") || path.posix.normalize(relative) !== relative) {
    throw new Error(`${label} must be a normalized file inside the repository`);
  }
  return relative;
}

function validRepositoryRelativePath(candidate) {
  return typeof candidate === "string" && candidate.length > 0 && !path.posix.isAbsolute(candidate) &&
    !candidate.includes("\\") && !candidate.includes("\0") && candidate !== "." && candidate !== ".." &&
    !candidate.startsWith("../") && path.posix.normalize(candidate) === candidate;
}

function validRawReceiptPath(candidate) {
  return validRepositoryRelativePath(candidate) &&
    /^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(candidate);
}

async function writeExclusiveAtomic(target, contents) {
  await mkdir(path.dirname(target), { recursive:true });
  const stage = path.join(
    path.dirname(target),
    `.${path.basename(target)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let handle;
  try {
    handle = await open(stage, "wx", 0o600);
    await handle.writeFile(contents);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await link(stage, target);
  } finally {
    if (handle) await handle.close();
    try { await unlink(stage); }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
  }
}

function evidenceId(record) {
  return verificationDigest({
    task:record.task, commit:record.commit, tree:record.tree, baseCommit:record.baseCommit,
    packIds:record.packIds, planDigest:record.planDigest, identities:record.identities,
    receiptSha256:record.receipt.sha256,
  });
}

function validateRecordDocument(record) {
  if (record?.version !== 2 || record.status !== "pending" && record.status !== "passed") {
    throw new Error("Verification evidence has an unsupported schema or status");
  }
  assertTaskName(record.task);
  if (!/^[a-f0-9]{40,64}$/u.test(record.commit ?? "") || !/^[a-f0-9]{40,64}$/u.test(record.tree ?? "") ||
      !/^[a-f0-9]{40,64}$/u.test(record.baseCommit ?? "")) {
    throw new Error("Verification evidence has invalid Git identities");
  }
  if (!same(record.packIds, sortedUnique(record.packIds ?? [])) || !record.packIds.length) {
    throw new Error("Verification evidence has an invalid exact pack set");
  }
  if (!same(record.plan, planDocument(record.plan))) {
    throw new Error("Verification evidence plan is not in canonical exact-pack form");
  }
  if (record.planDigest !== verificationDigest(record.plan)) throw new Error("Verification plan digest does not match its plan");
  if (!same(record.plan.packIds, record.packIds)) throw new Error("Verification plan pack set does not match its evidence claim");
  if (!same(record.changedPaths, record.plan.changedPaths)) throw new Error("Verification changed paths do not match the plan");
  if (!same(record.changeSet, record.plan.changeSet) || record.baseCommit !== record.plan.baseCommit ||
      !same(record.changedPaths, sortedUnique(record.changeSet?.paths ?? []))) {
    throw new Error("Verification evidence change set does not match its plan or base");
  }
  if (![record.identities?.registrySha256, record.identities?.toolchainSha256,
    record.identities?.artifact?.buildIdentity, record.identities?.artifact?.inputDigest,
    record.identities?.artifact?.outputDigest, record.receipt?.sha256].every((value) => shaPattern.test(value ?? ""))) {
    throw new Error("Verification evidence is missing registry, toolchain, build, or receipt identity");
  }
  if (!validRawReceiptPath(record.receipt?.sourcePath)) {
    throw new Error("Verification evidence requires a runner-owned raw receipt under tmp/verification-receipts");
  }
  if (record.identities.artifact.schemaVersion !== 1) {
    throw new Error("Verification evidence has an unsupported artifact identity schema");
  }
  const environment = receiptEnvironment(record.receipt?.environment);
  const lockedRuntime = record.identities?.runtime;
  const artifactToolchain = record.identities?.artifact?.toolchain;
  if (!same({ node:environment.node, typescript:environment.typescript }, lockedRuntime) ||
      !same(artifactToolchain, lockedRuntime)) {
    throw new Error("Verification receipt, artifact, and locked runtime identities do not match");
  }
  const expected = new Map(record.plan.tasks.map((identity) => [identity.key, identity]));
  if (expected.size !== record.plan.tasks.length || !same([...expected.keys()].sort(), record.receipt.tasks.map(({ key }) => key).sort())) {
    throw new Error("Verification receipt summary does not cover the exact plan task set");
  }
  for (const result of record.receipt.tasks) {
    if (result.status !== "passed" || !same(result.identity, expected.get(result.key)) ||
        !Number.isFinite(result.durationMs) || result.durationMs < 0 || !shaPattern.test(result.outputSha256 ?? "")) {
      throw new Error(`Invalid verification receipt result: ${result.key}`);
    }
  }
  if (record.evidenceId && record.evidenceId !== evidenceId(record)) throw new Error("Verification evidence id does not match its content");
  return record;
}

export async function createPendingVerificationEvidence({
  task,
  plan,
  receiptPath,
  changedSince,
  buildManifest,
  pendingPath,
  repositoryRoot = repository,
  toolchainValidator = validateStrictVerificationToolchain,
}) {
  await toolchainValidator({ repositoryRoot });
  const {
    commit, tree, baseCommit, sourceIdentity, planRecord, actualChangeSet,
    receiptSourcePath, bytes, results, environment, artifact,
  } = await validateVerificationEvidenceCompatibility({
    task, plan, receiptPath, changedSince, buildManifest, repositoryRoot,
    requireCompletedReceipt:true,
  });
  const record = {
    version:2,
    status:"pending",
    task,
    commit,
    tree,
    baseCommit,
    packIds:planRecord.packIds,
    changedPaths:actualChangeSet.paths,
    changeSet:actualChangeSet,
    plan:planRecord,
    planDigest:verificationDigest(planRecord),
    identities:{ ...sourceIdentity, artifact },
    receipt:{ sourcePath:receiptSourcePath, sha256:verificationDigest(bytes), environment, tasks:results },
    preparedAt:new Date().toISOString(),
  };
  record.evidenceId = evidenceId(record);
  validateRecordDocument(record);
  const target = pendingPath ?? pendingPathFor(repositoryRoot, task, record.planDigest);
  await writeExclusiveAtomic(target, `${JSON.stringify(record, null, 2)}\n`);
  return { evidence:record, path:target };
}

async function readPending(pendingPath) {
  let pending;
  try { pending = JSON.parse(await readFile(pendingPath, "utf8")); }
  catch (error) { throw new Error(`Cannot read pending verification evidence ${pendingPath}: ${error.message}`); }
  return validateRecordDocument(pending);
}

async function currentNote(commit, repositoryRoot) {
  try { return JSON.parse(await git(repositoryRoot, "notes", `--ref=${notesRef}`, "show", commit)); }
  catch (error) {
    if (/no note found|cannot read note data|bad object/iu.test(error.message)) return { version:2, records:[] };
    throw error;
  }
}

async function notesLock(repositoryRoot) {
  const commonDirectory = await git(repositoryRoot, "rev-parse", "--git-common-dir");
  const lockDirectory = path.join(
    path.isAbsolute(commonDirectory) ? commonDirectory : path.resolve(repositoryRoot, commonDirectory),
    "swarmforge-verification-notes.lock",
  );
  return acquireDistArtifactLock(lockDirectory, {
    timeoutMs:120_000,
    reportAfterMs:5_000,
  });
}

async function withRepositoryArtifactLock(repositoryRoot, operation) {
  const lockDirectory = path.join(repositoryRoot, "tmp", ".dist-artifact.lock");
  if (await inheritedDistArtifactLockIsHeld(lockDirectory)) return operation();
  const release = await acquireDistArtifactLock(lockDirectory);
  try { return await operation(); }
  finally { await release(); }
}

export async function recordPendingVerificationEvidence(
  pendingPath,
  {
    repositoryRoot = repository,
    artifactValidator = ({ root }) => assertFreshDist({ root }),
    toolchainValidator = validateStrictVerificationToolchain,
  } = {},
) {
  const pending = await readPending(pendingPath);
  if (pending.status !== "pending") throw new Error("Only pending verification evidence can be recorded");
  await toolchainValidator({ repositoryRoot });
  return withRepositoryArtifactLock(repositoryRoot, async() => {
    // Global lock order is artifact first, Git notes second. Keeping both for
    // the final snapshot makes an early recorder wait for a running build and
    // prevents a promotion from interleaving with note publication.
    const releaseNotes = await notesLock(repositoryRoot);
    try {
      await cleanCandidate(repositoryRoot);
      const rawReceiptPath = path.join(repositoryRoot, pending.receipt.sourcePath);
      const [commit, tree, sourceIdentity, manifest, rawReceipt] = await Promise.all([
        git(repositoryRoot, "rev-parse", "HEAD^{commit}"),
        git(repositoryRoot, "rev-parse", "HEAD^{tree}"),
        repositoryIdentity(repositoryRoot),
        artifactValidator({ root:repositoryRoot }),
        parsedReceipt(rawReceiptPath, pending.plan),
      ]);
      if (pending.commit !== commit || pending.tree !== tree) {
        throw new Error("Pending evidence does not match the current commit and tree");
      }
      if (!same(sourceIdentity, {
        registrySha256:pending.identities.registrySha256,
        toolchainSha256:pending.identities.toolchainSha256,
        runtime:pending.identities.runtime,
      })) throw new Error("Registry or toolchain changed after verification");
      const currentArtifact = artifactIdentity(manifest);
      if (!same(currentArtifact, pending.identities.artifact)) {
        throw new Error("Build artifact changed after verification");
      }
      if (verificationDigest(rawReceipt.bytes) !== pending.receipt.sha256 ||
          !same(rawReceipt.environment, pending.receipt.environment) ||
          !same(rawReceipt.results, pending.receipt.tasks) ||
          !same(rawReceipt.artifact, pending.identities.artifact)) {
        throw new Error("Raw verification receipt changed after evidence preparation");
      }
      const currentChangeSet = await canonicalVerificationChangeSet({
        base:pending.baseCommit,
        commit,
        repositoryRoot,
      });
      if (!same(currentChangeSet, pending.changeSet)) {
        throw new Error("Candidate change set no longer matches the verified plan");
      }
      await assertCanonicalPlan(pending.plan, {
        commit,
        baseCommit:pending.baseCommit,
        changeSet:currentChangeSet,
        packIds:pending.packIds,
        repositoryRoot,
      });

      const passed = validateRecordDocument({
        ...pending,
        status:"passed",
        recordedAt:new Date().toISOString(),
      });
      const existing = await currentNote(commit, repositoryRoot);
      if (existing.version === 2 && !Array.isArray(existing.records)) {
        throw new Error("Existing verification note has an invalid version 2 record set");
      }
      const records = existing.version === 2 ? existing.records : [];
      for (const record of records) {
        await validateRecordedEvidence(record, commit, tree, repositoryRoot);
      }
      const merged = records.some(({ evidenceId:existingId }) => existingId === passed.evidenceId)
        ? records
        : [...records, passed];
      const note = {
        version:2,
        records:merged,
        ...(existing.version === 2 ? {} : { legacy:[existing] }),
      };
      await gitInput(repositoryRoot,
        ["notes", `--ref=${notesRef}`, "add", "-f", "-F", "-", commit], JSON.stringify(note));
      return passed;
    } finally {
      await releaseNotes();
    }
  });
}

export async function verificationEvidence(commit = "HEAD", { repositoryRoot = repository } = {}) {
  try {
    const note = JSON.parse(await git(repositoryRoot, "notes", `--ref=${notesRef}`, "show", commit));
    if (note?.version !== 2 || !Array.isArray(note.records)) throw new Error("unsupported note schema");
    return note;
  } catch (error) {
    throw new Error(`No durable verification evidence for ${commit}: ${error.message}`);
  }
}

async function validateRecordedEvidence(record, canonical, tree, repositoryRoot) {
  validateRecordDocument(record);
  if (record.status !== "passed" || record.commit !== canonical || record.tree !== tree) {
    throw new Error(`Verification evidence does not match commit ${canonical}`);
  }
  await requireGitAncestor(record.baseCommit, canonical, { repositoryRoot });
  const [registry, toolchain] = await Promise.all([
    gitBytes(repositoryRoot, "show", `${canonical}:verification/packs.json`),
    gitBytes(repositoryRoot, "show", `${canonical}:swarmforge/toolchain.lock.json`),
  ]);
  if (verificationDigest(registry) !== record.identities.registrySha256 ||
      verificationDigest(toolchain) !== record.identities.toolchainSha256) {
    throw new Error("Verification evidence registry or toolchain identity does not match its commit");
  }
  const lock = JSON.parse(toolchain);
  if (!same(record.identities.runtime, {
    node:lock?.node?.version,
    typescript:lock?.typescript?.version,
  })) {
    throw new Error("Verification evidence runtime identity does not match its committed toolchain lock");
  }
  const committedChangeSet = await canonicalVerificationChangeSet({
    base:record.baseCommit,
    commit:canonical,
    repositoryRoot,
  });
  if (!same(committedChangeSet, record.changeSet)) {
    throw new Error("Verification evidence change set does not match its commit range");
  }
  await assertCanonicalPlan(record.plan, {
    commit:canonical,
    baseCommit:record.baseCommit,
    changeSet:committedChangeSet,
    packIds:record.packIds,
    repositoryRoot,
  });
  return record;
}

function evidenceCover(records, requestedPacks) {
  const requested = new Set(requestedPacks);
  const eligible = records.filter((record) => record.packIds.every((pack) => requested.has(pack)));
  function cover(group) {
    const covered = new Set();
    const selected = [];
    for (const record of group) {
      if (!record.packIds.some((pack) => !covered.has(pack))) continue;
      selected.push(record);
      for (const pack of record.packIds) covered.add(pack);
      if (requestedPacks.every((pack) => covered.has(pack))) return selected;
    }
    return undefined;
  }
  const artifactGroups = new Map();
  for (const record of eligible) {
    const key = canonicalJson(record.identities.artifact);
    artifactGroups.set(key, [...(artifactGroups.get(key) ?? []), record]);
  }
  for (const group of artifactGroups.values()) {
    const found = cover(group);
    if (found) return found;
  }
  return undefined;
}

export async function verifyVerificationEvidence(
  commit,
  base,
  task,
  packs,
  { repositoryRoot = repository } = {},
) {
  assertTaskName(task);
  const requestedPacks = sortedUnique(Array.isArray(packs) ? packs : String(packs ?? "").split(",").filter(Boolean));
  if (!requestedPacks.length || requestedPacks.some((pack) => !/^[a-z0-9][a-z0-9_-]*$/u.test(pack))) {
    throw new Error("Provide the exact comma-separated verification pack set");
  }
  const [canonical, tree] = await Promise.all([
    git(repositoryRoot, "rev-parse", `${commit}^{commit}`),
    git(repositoryRoot, "rev-parse", `${commit}^{tree}`),
  ]);
  const canonicalBase = await git(repositoryRoot, "rev-parse", `${base}^{commit}`);
  await requireGitAncestor(canonicalBase, canonical, { repositoryRoot });
  const note = await verificationEvidence(canonical, { repositoryRoot });
  const candidates = note.records.filter((record) => record.task === task && record.baseCommit === canonicalBase);
  const validated = [];
  for (const record of candidates) validated.push(await validateRecordedEvidence(record, canonical, tree, repositoryRoot));
  const records = evidenceCover(validated, requestedPacks);
  if (!records) {
    throw new Error(`Verification evidence for ${canonical} does not exactly cover base ${canonicalBase}, task ${task}, and packs ${requestedPacks.join(",")}`);
  }
  return {
    version:2,
    status:"passed",
    task,
    commit:canonical,
    tree,
    baseCommit:canonicalBase,
    packs:requestedPacks,
    planDigests:records.map(({ planDigest }) => planDigest),
    records,
  };
}

// Compatibility name for callers: recording is intentionally a separate,
// short operation and accepts a pending evidence path, never a live plan.
export const recordVerificationEvidence = recordPendingVerificationEvidence;

async function main(args) {
  const [operation, ...rest] = args;
  if (operation === "record" && rest.length === 1) {
    const evidence = await recordPendingVerificationEvidence(path.resolve(rest[0]));
    console.log(`verification evidence recorded: ${evidence.task} (${evidence.packIds.join(",")}) ${evidence.planDigest}`);
    return;
  }
  if (operation === "verify" && rest.length === 4) {
    const evidence = await verifyVerificationEvidence(rest[0], rest[1], rest[2], rest[3]);
    console.log(`verification evidence passed: ${evidence.task} (${evidence.packs.join(",")})`);
    return;
  }
  throw new Error("Use: verification-evidence.mjs record <pending-file> | verify <commit> <base> <task> <pack[,pack...]> ");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
