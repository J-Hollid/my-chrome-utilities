import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  lstat, mkdir, open, readFile, readdir, realpath, rename, rm, writeFile,
} from "node:fs/promises";
import path from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const incidentIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const shaPattern = /^[a-f0-9]{64}$/u;
const retryClassifications = Object.freeze({
  passed:"confirmed-flaky",
  timeout:"reproduced-timeout",
  failed:"changed-failure",
  identityChanged:"diagnostic-contract-failure",
});
export const timeoutRepairPackIds = Object.freeze([
  "branding_polish", "capture", "command-palette", "defects", "durable_project_repository",
  "event-library", "flow_export", "flow_graph", "guided_test_cases", "hotkeys", "layered_schema",
  "live_flow_testing", "project_assurance_severity", "project_event_transport", "project_management",
  "property_set_flow_sections", "replay", "schema_relationship_tree", "schemas", "shell",
].sort());

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

export function timeoutIncidentDigest(value) {
  return createHash("sha256").update(
    typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(normalized(value)),
  ).digest("hex");
}

function exactObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value;
}

function stableIncidentId(value) {
  if (!incidentIdPattern.test(value ?? "") || value === "." || value === "..") {
    throw new Error(`Invalid timeout incident id: ${value}`);
  }
  return value;
}

function boundedState(value, maximumCharacters) {
  if (value === undefined) return undefined;
  let encoded;
  try { encoded = JSON.stringify(value); }
  catch { encoded = JSON.stringify({ diagnostic:"unserializable progress state" }); }
  if (encoded.length <= maximumCharacters) return JSON.parse(encoded);
  // A JSON string adds surrounding quotes and may escape the preview's quotes.
  // Reserve enough room so the persisted state remains within the caller's bound.
  return `${encoded.slice(0, Math.max(0, maximumCharacters - 10))}…`;
}

export function createVerificationProgressTracker({ taskKey, maximumStateCharacters = 2048 } = {}) {
  if (typeof taskKey !== "string" || !taskKey) throw new Error("Progress requires a canonical task key");
  if (!Number.isInteger(maximumStateCharacters) || maximumStateCharacters < 32) {
    throw new Error("Progress state limit must be at least 32 characters");
  }
  let last;
  const diagnostics = [];
  return {
    accept(record) {
      try {
        exactObject(record, "Progress record");
        if (record.version !== 1 || !Number.isInteger(record.sequence) || record.sequence < 1 ||
            !Number.isFinite(record.monotonicMs) || record.monotonicMs < 0 ||
            !["process", "artifact/setup", "target", "cleanup"].includes(record.boundary)) {
          throw new Error("invalid progress schema");
        }
        if (record.taskKey !== undefined && record.taskKey !== taskKey) throw new Error("cross-task progress");
        if (last && (record.sequence <= last.sequence || record.monotonicMs < last.monotonicMs ||
            last.completed === true)) throw new Error("duplicate, out-of-order, or post-completion progress");
        if (record.boundary === "target" &&
            (typeof record.logicalTargetId !== "string" || !record.logicalTargetId)) {
          throw new Error("target progress requires a logical target id");
        }
        last = {
          version:1, taskKey, sequence:record.sequence, monotonicMs:record.monotonicMs,
          boundary:record.boundary,
          ...(record.logicalTargetId ? { logicalTargetId:record.logicalTargetId } : {}),
          ...(record.phase ? { phase:record.phase } : {}),
          ...(record.completed === true ? { completed:true } : {}),
          ...(record.state === undefined ? {} : { state:boundedState(record.state, maximumStateCharacters) }),
        };
        return true;
      } catch (error) {
        diagnostics.push(error.message);
        return false;
      }
    },
    acceptLine(line) {
      try {
        const progress = JSON.parse(line)?.swarmforgeVerificationProgress;
        return progress ? this.accept(progress) : false;
      } catch { return false; }
    },
    snapshot:() => last ? structuredClone(last) : undefined,
    diagnostics:() => [...diagnostics],
  };
}

export function verificationProgressEmitter({ emit = console.log, now = () => performance.now() } = {}) {
  let sequence = Number(process.env.SWARMFORGE_PROGRESS_SEQUENCE_START ?? 0);
  const offset = Number(process.env.SWARMFORGE_PROGRESS_MONOTONIC_OFFSET ?? 0);
  const started = now();
  return (record) => emit(JSON.stringify({ swarmforgeVerificationProgress:{
    version:1, sequence:++sequence, monotonicMs:Math.max(0, offset + now() - started), ...record,
  } }));
}

export function diagnosticRetryScope({ task, lastProgress } = {}) {
  exactObject(task, "Timed-out task");
  if (task.stage !== "browser-observation") {
    return { kind:"task", taskKey:task.key, executionArgs:[...(task.args ?? [])] };
  }
  if (!lastProgress) throw new Error("A browser timeout has no trusted progress; repair the progress contract first");
  if (lastProgress.boundary === "target" && lastProgress.logicalTargetId) {
    return {
      kind:"target", logicalTargetIds:[lastProgress.logicalTargetId],
      executionArgs:["scripts/run-browser-observation.mjs", lastProgress.logicalTargetId],
    };
  }
  if (lastProgress.boundary === "artifact/setup") {
    return {
      kind:"setup", phase:lastProgress.phase ?? "shared-setup", logicalTargetIds:[],
      executionArgs:["scripts/run-browser-observation.mjs", "--setup-only"],
    };
  }
  throw new Error("A browser timeout has no unambiguous trusted target or setup boundary");
}

export function classifyHistoricalTimeoutFixture(fixture) {
  exactObject(fixture, "Historical timeout fixture");
  if (fixture.runId !== "1686032b-39aa-4140-a4db-f4f265e28eb5" ||
      fixture.durationMs !== 600014 || fixture.passedTaskCount !== 274 ||
      fixture.lastProgress?.boundary !== "artifact/setup" ||
      fixture.lastProgress?.phase !== "dist-artifact-lock") {
    throw new Error("Historical Capture timeout fixture does not match its sanitized contract");
  }
  return {
    boundary:"artifact/setup",
    retry:{ kind:"setup", phase:"dist-artifact-lock", logicalTargetIds:[] },
    excludedPassedTaskCount:fixture.passedTaskCount,
    excludedLogicalTargetIds:[...(fixture.task?.logicalTargetIds ?? [])],
    lockOwner:structuredClone(fixture.lastProgress.state?.owner),
    retroactiveIncident:false,
  };
}

function git(root, ...args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd:root }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim()));
  });
}

async function receiptDocument(root, receiptPath) {
  if (typeof receiptPath !== "string" || !receiptPath) throw new Error("Provide a runner receipt path");
  const resolved = path.resolve(root, receiptPath);
  const receiptRoot = path.resolve(root, "tmp", "verification-receipts");
  if (resolved !== receiptRoot && !resolved.startsWith(`${receiptRoot}${path.sep}`)) {
    throw new Error("Runner receipts must be under tmp/verification-receipts");
  }
  const details = await lstat(resolved);
  if (!details.isFile() || details.isSymbolicLink() || await realpath(resolved) !== resolved) {
    throw new Error("Runner receipt must be a canonical regular file");
  }
  const bytes = await readFile(resolved);
  let receipt;
  try { receipt = JSON.parse(bytes); }
  catch (error) { throw new Error(`Cannot parse runner receipt: ${error.message}`); }
  if (receipt.version !== 2 || !receipt.runId || !receipt.completedAt ||
      !receipt.candidate?.commit || !receipt.candidate?.tree ||
      !receipt.tasks || Array.isArray(receipt.tasks)) {
    throw new Error("Runner receipt is incomplete");
  }
  return { path:path.relative(root, resolved), receipt, bytes, sha256:timeoutIncidentDigest(bytes) };
}

function freshPassingReceipt(document, candidate, description) {
  const tasks = Object.entries(document.receipt.tasks);
  if (!tasks.length || document.receipt.candidate.commit !== candidate.commit ||
      document.receipt.candidate.tree !== candidate.tree ||
      tasks.some(([, task]) => task.status !== "passed" || task.provenance !== "fresh")) {
    throw new Error(`${description} requires a complete fresh passing runner receipt from the repair tree`);
  }
  return tasks;
}

async function defaultCanonicalCheckpointValidator({ document, incident, root }) {
  const { validateCanonicalVerificationCheckpoint } = await import("./verification-evidence.mjs");
  return validateCanonicalVerificationCheckpoint({
    receiptPath:path.resolve(root, document.path),
    commit:incident.repair.candidate.commit,
    tree:incident.repair.candidate.tree,
    baseCommit:incident.repair.checkpoint.baseCommit,
    evidenceTask:incident.repair.checkpoint.evidenceTask,
    packIds:timeoutRepairPackIds,
    repositoryRoot:root,
  });
}

async function defaultCanonicalRepairTaskIdentities() {
  const { loadVerificationPacks, planVerification, verificationTaskIdentity } =
    await import("./verification-packs.mjs");
  const packs = await loadVerificationPacks();
  return planVerification(packs, { packIds:timeoutRepairPackIds, includeProperties:true })
    .tasks.map(verificationTaskIdentity);
}

export const timeoutRepairPackageTaskIdentity = Object.freeze({
  key:"package:extension", stage:"package", packId:null, executable:"node",
  args:["scripts/package.mjs"], target:"build/package/my-chrome-utilities.zip", environment:null,
});

function validatePackageReceipt(document, checkpointDocument, incident) {
  const receipt = document.receipt;
  const entries = Object.entries(receipt.tasks);
  const [key, result] = entries[0] ?? [];
  const packageStartedAt = Date.parse(receipt.startedAt);
  const checkpointCompletedAt = Date.parse(checkpointDocument.receipt.completedAt);
  if (receipt.candidate.commit !== incident.repair.candidate.commit ||
      receipt.candidate.tree !== incident.repair.candidate.tree ||
      receipt.plan?.mode !== "package" ||
      receipt.plan?.checkpointRunId !== checkpointDocument.receipt.runId ||
      !Number.isFinite(packageStartedAt) || !Number.isFinite(checkpointCompletedAt) ||
      packageStartedAt < checkpointCompletedAt ||
      entries.length !== 1 || key !== timeoutRepairPackageTaskIdentity.key || result.status !== "passed" ||
      result.provenance !== "fresh" || !Number.isFinite(result.durationMs) ||
      JSON.stringify(normalized(result.identity)) !==
        JSON.stringify(normalized(timeoutRepairPackageTaskIdentity)) ||
      result.output?.trim() !== timeoutRepairPackageTaskIdentity.target) {
    throw new Error("Resolution requires a runner-owned package command receipt after the checkpoint");
  }
  return result;
}

async function defaultStoreDirectory(root) {
  const common = await git(root, "rev-parse", "--git-common-dir");
  const commonDirectory = path.isAbsolute(common) ? common : path.resolve(root, common);
  return path.join(commonDirectory, "swarmforge-timeout-incidents");
}

async function ensureSafeDirectory(directory, { create = true } = {}) {
  const resolved = path.resolve(directory);
  try {
    const details = await lstat(resolved);
    if (details.isSymbolicLink()) throw new Error(`Timeout incident store is redirected by a symlink: ${resolved}`);
    if (!details.isDirectory()) throw new Error(`Timeout incident store is not a directory: ${resolved}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    if (!create) return undefined;
    await mkdir(resolved, { recursive:true });
  }
  if (await realpath(resolved) !== resolved) {
    throw new Error(`Timeout incident store is redirected outside its canonical path: ${resolved}`);
  }
  return resolved;
}

function incidentEnvelope(incident) {
  return { version:1, incident, digest:timeoutIncidentDigest(incident) };
}

function validateIncident(incident) {
  exactObject(incident, "Timeout incident");
  stableIncidentId(incident.id);
  if (!['unresolved', 'resolved'].includes(incident.state) || !incident.failure ||
      !shaPattern.test(incident.failureDigest ?? "") ||
      incident.failureDigest !== timeoutIncidentDigest(incident.failure) ||
      !Array.isArray(incident.transitions)) {
    throw new Error(`Malformed timeout incident ${incident.id}`);
  }
  if (incident.state === "resolved" &&
      (!shaPattern.test(incident.resolution?.digest ?? "") ||
       incident.resolution.digest !== timeoutIncidentDigest({ ...incident.resolution, digest:undefined }))) {
    throw new Error(`Timeout incident ${incident.id} has an invalid resolution digest`);
  }
  if (incident.state === "resolved") validateArchiveNames(incident.id, incident.resolution.archive);
  return incident;
}

function validateEnvelope(envelope, expectedId) {
  exactObject(envelope, "Timeout incident document");
  if (envelope.version !== 1 || envelope.incident?.id !== expectedId ||
      envelope.digest !== timeoutIncidentDigest(envelope.incident)) {
    throw new Error(`Timeout incident ${expectedId} document digest does not match`);
  }
  return validateIncident(envelope.incident);
}

async function writeExclusive(target, value) {
  const handle = await open(target, "wx", 0o600);
  try { await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`); await handle.sync(); }
  finally { await handle.close(); }
}

async function atomicReplace(target, value) {
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag:"wx", mode:0o600 });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force:true });
  }
}

async function archiveBytes(target, bytes) {
  let handle;
  try {
    handle = await open(target, "wx", 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = undefined;
  }
  catch (error) {
    if (error.code !== "EEXIST" || timeoutIncidentDigest(await safeStoreFile(target)) !==
        timeoutIncidentDigest(bytes)) throw error;
  } finally {
    if (handle) await handle.close();
  }
}

function archiveNames(id) {
  stableIncidentId(id);
  return {
    checkpointReceipt:`${id}.checkpoint-receipt`,
    packageReceipt:`${id}.package-receipt`,
    packageZip:`${id}.package-zip`,
  };
}

function validateArchiveNames(id, archive) {
  if (JSON.stringify(normalized(archive)) !== JSON.stringify(normalized(archiveNames(id)))) {
    throw new Error(`Timeout incident ${id} has invalid archive filenames or traversal`);
  }
  return archive;
}

async function safeStoreFile(target) {
  const resolved = path.resolve(target);
  const details = await lstat(resolved);
  if (!details.isFile() || details.isSymbolicLink() || await realpath(resolved) !== resolved) {
    throw new Error(`Timeout archive is not a canonical regular file: ${resolved}`);
  }
  return readFile(resolved);
}

async function archivedReceiptDocument(target) {
  const bytes = await safeStoreFile(target);
  const receipt = JSON.parse(bytes);
  return { path:target, receipt, bytes, sha256:timeoutIncidentDigest(bytes) };
}

async function withIncidentLock(directory, id, operation) {
  const lockPath = path.join(directory, `${id}.lock`);
  let handle;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try { handle = await open(lockPath, "wx", 0o600); break; }
    catch (error) {
      if (error.code !== "EEXIST") throw error;
      await pause(5);
    }
  }
  if (!handle) throw new Error(`Timed out waiting for timeout incident lock ${id}`);
  try { return await operation(); }
  finally { await handle.close(); await rm(lockPath, { force:true }); }
}

function retryIdentity(failure) {
  return timeoutIncidentDigest({
    lineage:failure.lineage, task:failure.task, configuredTimeoutMs:failure.configuredTimeoutMs,
    environment:failure.environment, artifact:failure.artifact, planDigest:failure.planDigest,
    scope:diagnosticRetryScope({ task:failure.task, lastProgress:failure.lastProgress }),
  });
}

function transition(incident, type, at, details = {}) {
  return { ...incident, transitions:[...incident.transitions, { type, at, ...details }] };
}

const timeoutRepairCausalCategories = new Set([
  "readiness", "cleanup/resource lifecycle", "target isolation", "artifact/process locking",
  "duplicated or unbounded workload",
]);

export function timeoutRepairCausalCategory(value) {
  if (typeof value !== "string" ||
      (!timeoutRepairCausalCategories.has(value) && !/^other:[^\s].{0,119}$/u.test(value))) {
    throw new Error("Timeout repair causal category must be a specified category or explicitly testable other:<cause>");
  }
  return value;
}

function validateCausalExplanation(value) {
  if (typeof value !== "string" || value !== value.trim() || value.length < 1 || value.length > 500 ||
      /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error("Timeout repair requires a bounded one-line causal explanation");
  }
  return value;
}

export function timeoutRepairFocusedTaskKeys(incident, changedPaths, regressionKey) {
  validateIncident(incident);
  const keys = new Set([incident.failure.task.key, regressionKey]);
  if (changedPaths.some((changedPath) => changedPath.startsWith("scripts/") ||
      changedPath.startsWith("test/support/") ||
      changedPath.startsWith("acceptance/src/acceptance/verification_support/"))) {
    keys.add("unit:test/verification-process-contract-test.mjs");
  }
  if (changedPaths.some((changedPath) => changedPath.startsWith("swarmforge/") ||
      ["scripts/verification-evidence.mjs", "scripts/verification-timeout-incidents.mjs",
        "scripts/run-focused-acceptance.mjs"].includes(changedPath))) {
    keys.add("unit:test/swarmforge-process-contract-test.mjs");
  }
  return [...keys].sort();
}

export function timeoutRepairFocusedTaskPlan(incident, changedPaths, regressionKey, canonicalIdentities) {
  validateIncident(incident);
  if (!Array.isArray(canonicalIdentities)) throw new Error("Canonical repair task identities are required");
  const canonical = new Map(canonicalIdentities.map((identity) => [identity.key, normalized(identity)]));
  const expectedKeys = timeoutRepairFocusedTaskKeys(incident, changedPaths, regressionKey);
  const roles = new Map();
  const addRole = (key, role) => {
    if (!roles.has(key)) roles.set(key, new Set());
    roles.get(key).add(role);
  };
  addRole(incident.failure.task.key, "diagnosed-boundary");
  addRole(regressionKey, "causal-regression");
  for (const key of expectedKeys) {
    if (key.startsWith("unit:test/") && ["unit:test/verification-process-contract-test.mjs",
      "unit:test/swarmforge-process-contract-test.mjs"].includes(key)) addRole(key, "affected-process-contract");
  }
  const taskPlan = expectedKeys.map((key) => {
    const identity = key === incident.failure.task.key
      ? normalized(incident.failure.task) : canonical.get(key);
    if (!identity || !canonical.has(key) || (key === incident.failure.task.key &&
        JSON.stringify(identity) !== JSON.stringify(canonical.get(key)))) {
      throw new Error(`Timeout repair task ${key} is not a canonical current task identity`);
    }
    const descriptor = { identity, roles:[...(roles.get(key) ?? new Set())].sort() };
    if (key === incident.failure.task.key) {
      descriptor.executionArgs = [...incident.failure.retryScope.executionArgs];
      descriptor.executionLogicalTargetIds = [...(incident.failure.retryScope.logicalTargetIds ?? [])];
    }
    return descriptor;
  });
  return taskPlan.sort((left, right) => left.identity.key.localeCompare(right.identity.key));
}

function timeoutRepairRegressionProtocol(document, regressionKey) {
  const output = document.receipt.tasks[regressionKey]?.output ?? "";
  const records = output.split(/\r?\n/u).filter(Boolean).flatMap((line) => {
    try {
      const parsed = JSON.parse(line).swarmforgeTimeoutRepairRegression;
      return parsed ? [parsed] : [];
    } catch { return []; }
  });
  if (records.length !== 1) throw new Error("Timeout repair requires one causal regression protocol record");
  return records[0];
}

function validateTimeoutRepairRegressionEvidence(incident, proposal, protocol) {
  const invalidEvidence = () => new Error("Timeout repair causal regression must contain bounded cause-specific fixture evidence with an observed pre-repair failure and repaired result");
  if (!protocol?.fixture || typeof protocol.fixture !== "object" || Array.isArray(protocol.fixture) ||
      !protocol.preRepairResult || typeof protocol.preRepairResult !== "object" ||
      Array.isArray(protocol.preRepairResult) || !protocol.repairResult ||
      typeof protocol.repairResult !== "object" || Array.isArray(protocol.repairResult)) {
    throw invalidEvidence();
  }
  const fixture = exactObject(protocol.fixture, "Timeout repair causal fixture");
  const preRepairResult = exactObject(protocol.preRepairResult,
    "Timeout repair pre-repair result");
  const repairResult = exactObject(protocol.repairResult, "Timeout repair result");
  let encodedFixture;
  try { encodedFixture = JSON.stringify(fixture); }
  catch { throw new Error("Timeout repair causal fixture must be serializable"); }
  const fixtureDigest = timeoutIncidentDigest(fixture);
  if (protocol.version !== 2 || protocol.incidentId !== incident.id ||
      protocol.failureDigest !== incident.failureDigest ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(fixture.id ?? "") ||
      fixture.causalCategory !== proposal.causalCategory || encodedFixture.length > 16_384 ||
      fixture.diagnosedBoundaryDigest !== timeoutIncidentDigest(incident.failure.retryScope) ||
      !fixture.expectedPreRepairFailure || !fixture.expectedRepairResult ||
      JSON.stringify(normalized(fixture.expectedPreRepairFailure)) ===
        JSON.stringify(normalized(fixture.expectedRepairResult)) ||
      preRepairResult.status !== "failed" || repairResult.status !== "passed" ||
      preRepairResult.fixtureDigest !== fixtureDigest || repairResult.fixtureDigest !== fixtureDigest ||
      JSON.stringify(normalized(preRepairResult.observed)) !==
        JSON.stringify(normalized(fixture.expectedPreRepairFailure)) ||
      JSON.stringify(normalized(repairResult.observed)) !==
        JSON.stringify(normalized(fixture.expectedRepairResult))) {
    throw invalidEvidence();
  }
  return protocol;
}

async function validateRepairReceiptSemantics(incident, proposal, regressionDocument, focusedDocument,
  canonicalRepairTaskIdentities) {
  timeoutRepairCausalCategory(proposal.causalCategory);
  validateCausalExplanation(proposal.causalExplanation);
  const protocol = validateTimeoutRepairRegressionEvidence(incident, proposal,
    timeoutRepairRegressionProtocol(regressionDocument, proposal.regression.key));
  const canonicalIdentities = await canonicalRepairTaskIdentities({ incident, proposal });
  const expectedTaskPlan = timeoutRepairFocusedTaskPlan(incident, proposal.changedPaths,
    proposal.regression.key, canonicalIdentities);
  const expectedFocusedKeys = expectedTaskPlan.map(({ identity }) => identity.key);
  if (focusedDocument.receipt.plan?.mode !== "timeout-repair-focused" ||
      focusedDocument.receipt.plan?.incidentId !== incident.id ||
      focusedDocument.receipt.plan?.causalCategory !== proposal.causalCategory ||
      focusedDocument.receipt.plan?.causalExplanation !== proposal.causalExplanation ||
      regressionDocument.sha256 !== focusedDocument.sha256 ||
      JSON.stringify(normalized(focusedDocument.receipt.plan.taskPlan)) !==
        JSON.stringify(normalized(expectedTaskPlan)) ||
      JSON.stringify(Object.keys(focusedDocument.receipt.tasks).sort()) !==
        JSON.stringify([...expectedFocusedKeys].sort()) ||
      expectedTaskPlan.some(({ identity }) => JSON.stringify(normalized(
        focusedDocument.receipt.tasks[identity.key]?.identity)) !== JSON.stringify(normalized(identity))) ||
      expectedTaskPlan.some(({ identity, executionArgs, executionLogicalTargetIds }) => executionArgs &&
        JSON.stringify(normalized(focusedDocument.receipt.tasks[identity.key]?.execution)) !==
          JSON.stringify(normalized({ args:executionArgs,
            logicalTargetIds:executionLogicalTargetIds ?? [] })))) {
    throw new Error("Timeout repair focused repair plan contains unrelated or missing tasks");
  }
  return { ...proposal, diagnosedBoundary:structuredClone(incident.failure.retryScope),
    causalProtocol:protocol, focusedTaskPlan:expectedTaskPlan };
}

export async function validateTimeoutRepairProposal(incident, proposal, { isAncestor } = {}) {
  validateIncident(incident);
  exactObject(proposal, "Timeout repair proposal");
  const failed = incident.failure.lineage;
  if (!proposal.candidate?.commit || !proposal.candidate?.tree ||
      proposal.candidate.commit === failed.commit || proposal.candidate.tree === failed.tree ||
      !(await (isAncestor ?? (async (ancestor, descendant) => {
        try { await git(repositoryRoot, "merge-base", "--is-ancestor", ancestor, descendant); return true; }
        catch { return false; }
      }))(failed.commit, proposal.candidate.commit))) {
    throw new Error("Timeout repair must use a descendant changed candidate and tree");
  }
  const changedPaths = proposal.changedPaths ?? [];
  const limitDeclaration = /(?:performance-calibration|timing-baseline|budget|timeout|worker)/iu;
  if (!changedPaths.length || changedPaths.every((changedPath) => limitDeclaration.test(changedPath))) {
    throw new Error("Timeout repair is rejected as a limit-only or unrelated change");
  }
  timeoutRepairCausalCategory(proposal.causalCategory);
  validateCausalExplanation(proposal.causalExplanation);
  if (typeof proposal.checkpoint?.baseCommit !== "string" || !proposal.checkpoint.baseCommit ||
      typeof proposal.checkpoint?.evidenceTask !== "string" || !proposal.checkpoint.evidenceTask) {
    throw new Error("Timeout repair requires the approved checkpoint base and evidence task");
  }
  if (proposal.regression?.status !== "passed" || proposal.regression?.commit !== proposal.candidate.commit ||
      typeof proposal.regression?.key !== "string") {
    throw new Error("Timeout repair requires a deterministic regression on the repair commit");
  }
  if (proposal.focusedReceipt?.status !== "passed" ||
      proposal.focusedReceipt?.commit !== proposal.candidate.commit ||
      proposal.focusedReceipt?.provenance !== "fresh") {
    throw new Error("Timeout repair requires fresh focused verification from the repair tree");
  }
  return { ...structuredClone(proposal), status:"eligible", validatedAt:new Date().toISOString() };
}

export function timeoutResolutionEvidence(incident) {
  validateIncident(incident);
  if (incident.state !== "resolved") throw new Error(`Timeout incident ${incident.id} is unresolved`);
  return {
    incidentId:incident.id,
    failureDigest:incident.failureDigest,
    diagnosticClassification:incident.retry?.classification,
    repairCommit:incident.repair.candidate.commit,
    repairTree:incident.repair.candidate.tree,
    causalCategory:incident.repair.causalCategory,
    causalExplanation:incident.repair.causalExplanation,
    diagnosedBoundary:incident.repair.diagnosedBoundary,
    regression:incident.repair.regression,
    focusedReceipt:incident.repair.focusedReceipt,
    checkpointReceiptSha256:incident.resolution.checkpoint.receiptSha256,
    packageReceiptSha256:incident.resolution.package.receiptSha256,
    packageDigest:incident.resolution.package.digest,
    resolutionDigest:incident.resolution.digest,
  };
}

export function createTimeoutIncidentStore({
  storeDirectory, root = repositoryRoot, now = () => new Date().toISOString(),
  randomId = () => randomUUID(), isAncestor,
  currentCandidate = async() => ({
    commit:await git(root, "rev-parse", "HEAD^{commit}"),
    tree:await git(root, "rev-parse", "HEAD^{tree}"),
  }),
  changedPaths = async(failedCommit) => (await git(root, "diff", "--name-only", `${failedCommit}..HEAD`))
    .split(/\r?\n/u).filter(Boolean),
  canonicalCheckpointValidator = defaultCanonicalCheckpointValidator,
  canonicalRepairTaskIdentities = defaultCanonicalRepairTaskIdentities,
} = {}) {
  const directory = async({ create = true } = {}) => ensureSafeDirectory(
    storeDirectory ?? await defaultStoreDirectory(root), { create },
  );
  const read = async(id) => {
    stableIncidentId(id);
    const store = await directory({ create:false });
    if (!store) throw new Error(`Unknown timeout incident ${id}`);
    let envelope;
    try { envelope = JSON.parse(await safeStoreFile(path.join(store, `${id}.json`))); }
    catch (error) { throw new Error(`Cannot read timeout incident ${id}: ${error.message}`); }
    return validateEnvelope(envelope, id);
  };
  const update = async(id, operation) => {
    const store = await directory();
    return withIncidentLock(store, stableIncidentId(id), async() => {
      const current = await read(id);
      const next = validateIncident(await operation(structuredClone(current)));
      if (next.id !== id || next.failureDigest !== current.failureDigest) {
        throw new Error(`Timeout incident ${id} immutable failure record changed`);
      }
      await atomicReplace(path.join(store, `${id}.json`), incidentEnvelope(next));
      return next;
    });
  };
  return {
    read,
    async list() {
      const store = await directory({ create:false });
      if (!store) return [];
      const names = await readdir(store);
      const unexpected = names.filter((name) => !name.endsWith(".lock") &&
        !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:checkpoint-receipt|package-receipt|package-zip)$/u.test(name) &&
        !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.json$/u.test(name));
      if (unexpected.length) throw new Error(`Malformed timeout incident store entry: ${unexpected[0]}`);
      const ids = names.filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -5));
      if (new Set(ids).size !== ids.length) throw new Error("Duplicate timeout incident ids");
      return Promise.all(ids.sort().map(read));
    },
    async create(failure) {
      exactObject(failure, "Timeout failure");
      const id = stableIncidentId(randomId());
      const scoped = (() => {
        try { return diagnosticRetryScope({ task:failure.task, lastProgress:failure.lastProgress }); }
        catch { return undefined; }
      })();
      const immutableFailure = structuredClone({ ...failure,
        retryScope:scoped, retryIdentity:scoped ? retryIdentity(failure) : timeoutIncidentDigest({
          lineage:failure.lineage, task:failure.task, progressContract:"untrusted",
        }),
      });
      const incident = validateIncident({
        version:1, id, createdAt:now(), state:"unresolved", failure:immutableFailure,
        failureDigest:timeoutIncidentDigest(immutableFailure), transitions:[],
      });
      const store = await directory();
      try { await writeExclusive(path.join(store, `${id}.json`), incidentEnvelope(incident)); }
      catch (error) {
        if (error.code === "EEXIST") throw new Error(`Duplicate timeout incident id ${id}`);
        throw error;
      }
      return incident;
    },
    claimDiagnosticRetry(id, identity) {
      return update(id, (incident) => {
        if (incident.state !== "unresolved") throw new Error(`Timeout incident ${id} is resolved`);
        if (incident.retry) throw new Error(`Timeout incident ${id} diagnostic retry was already used`);
        if (!incident.failure.retryScope || identity !== incident.failure.retryIdentity) {
          throw new Error(`Timeout incident ${id} diagnostic retry identity changed`);
        }
        return transition({ ...incident, retry:{ status:"claimed", identity, claimedAt:now() } },
          "diagnostic-retry-claimed", now());
      });
    },
    async classifyDiagnosticRetry(id, receiptPath) {
      const document = await receiptDocument(root, receiptPath);
      return update(id, (incident) => {
        if (incident.retry?.status !== "claimed") throw new Error(`Timeout incident ${id} retry is not claimable`);
        const task = Object.values(document.receipt.tasks)[0];
        const identityChanged = document.receipt.diagnostic?.incidentId !== id ||
          document.receipt.diagnostic?.retryIdentity !== incident.failure.retryIdentity ||
          JSON.stringify(normalized(document.receipt.diagnostic?.scope)) !==
            JSON.stringify(normalized(incident.failure.retryScope)) ||
          document.receipt.candidate.commit !== incident.failure.lineage.commit ||
          document.receipt.candidate.tree !== incident.failure.lineage.tree ||
          JSON.stringify(normalized(document.receipt.environment)) !==
            JSON.stringify(normalized(incident.failure.environment)) ||
          JSON.stringify(normalized(document.receipt.artifact)) !==
            JSON.stringify(normalized(incident.failure.artifact)) ||
          Object.keys(document.receipt.tasks).length !== 1 ||
          JSON.stringify(normalized(task?.identity)) !== JSON.stringify(normalized(incident.failure.task));
        const outcome = identityChanged ? "identityChanged"
          : task.runnerOwnedTimeout ? "timeout"
            : task.status === "passed" ? "passed" : "failed";
        const classification = retryClassifications[outcome];
        return transition({ ...incident, retry:{ ...incident.retry, status:"classified", outcome,
          classification, receiptPath:document.path, receiptSha256:document.sha256, classifiedAt:now() } },
        "diagnostic-retry-classified", now(), { classification });
      });
    },
    async proposeRepair(id, { causalCategory, causalExplanation, regressionKey, regressionReceiptPath,
      focusedReceiptPath } = {}) {
      const current = await read(id);
      if (current.retry?.status !== "classified") {
        throw new Error(`Timeout incident ${id} requires its one classified diagnostic retry`);
      }
      const candidate = await currentCandidate();
      const [regressionDocument, focusedDocument, paths] = await Promise.all([
        receiptDocument(root, regressionReceiptPath), receiptDocument(root, focusedReceiptPath),
        changedPaths(current.failure.lineage.commit),
      ]);
      const regressionTasks = freshPassingReceipt(regressionDocument, candidate,
        "Deterministic regression");
      freshPassingReceipt(focusedDocument, candidate, "Fresh focused verification");
      if (!regressionTasks.some(([key]) => key === regressionKey)) {
        throw new Error("Timeout repair requires the named deterministic regression task");
      }
      const proposal = {
        candidate, changedPaths:paths, causalCategory, causalExplanation,
        checkpoint:{ baseCommit:focusedDocument.receipt.candidate.baseCommit,
          evidenceTask:focusedDocument.receipt.candidate.evidenceTask },
        regression:{ key:regressionKey, status:"passed", commit:candidate.commit,
          receiptPath:regressionDocument.path, receiptSha256:regressionDocument.sha256 },
        focusedReceipt:{ status:"passed", commit:candidate.commit, provenance:"fresh",
          receiptPath:focusedDocument.path, receiptSha256:focusedDocument.sha256 },
      };
      const semanticProposal = await validateRepairReceiptSemantics(current, proposal,
        regressionDocument, focusedDocument, canonicalRepairTaskIdentities);
      const eligible = await validateTimeoutRepairProposal(current, semanticProposal, { isAncestor });
      return update(id, (incident) => transition({ ...incident, repair:eligible },
        "repair-proposed", now(), { commit:eligible.candidate.commit }));
    },
    claimRepairCheckpoint(id, runId) {
      return update(id, (incident) => {
        if (incident.state !== "unresolved" || incident.repair?.status !== "eligible") {
          throw new Error(`Timeout incident ${id} has no eligible repair`);
        }
        if (incident.repairCheckpoint) throw new Error(`Timeout incident ${id} repair checkpoint was already used`);
        return transition({ ...incident, repairCheckpoint:{ status:"claimed", runId, claimedAt:now() } },
          "repair-checkpoint-claimed", now(), { runId });
      });
    },
    async resolve(id, { checkpointReceiptPath, packageReceiptPath } = {}) {
      const incidentBeforeResolution = await read(id);
      const resolvedPackagePath = path.resolve(root, "build", "package", "my-chrome-utilities.zip");
      const [checkpointDocument, packageDocument, packageDetails] = await Promise.all([
        receiptDocument(root, checkpointReceiptPath), receiptDocument(root, packageReceiptPath),
        lstat(resolvedPackagePath),
      ]);
      if (!packageDetails.isFile() || packageDetails.isSymbolicLink() ||
          await realpath(resolvedPackagePath) !== resolvedPackagePath) {
        throw new Error("Package result must be a canonical regular file");
      }
      const canonicalCheckpoint = await canonicalCheckpointValidator({
        document:checkpointDocument, incident:incidentBeforeResolution, root,
      });
      validatePackageReceipt(packageDocument, checkpointDocument, incidentBeforeResolution);
      const packageBytes = await readFile(resolvedPackagePath);
      const store = await directory();
      const archive = archiveNames(id);
      await Promise.all([
        archiveBytes(path.join(store, archive.checkpointReceipt), checkpointDocument.bytes),
        archiveBytes(path.join(store, archive.packageReceipt), packageDocument.bytes),
        archiveBytes(path.join(store, archive.packageZip), packageBytes),
      ]);
      return update(id, (incident) => {
        if (incident.state !== "unresolved" || incident.repair?.status !== "eligible") {
          throw new Error(`Timeout incident ${id} has no eligible repair`);
        }
        const checkpoint = checkpointDocument.receipt;
        if (incident.repairCheckpoint?.status !== "claimed" ||
            incident.repairCheckpoint.runId !== checkpoint.runId ||
            canonicalCheckpoint.receipt.runId !== checkpoint.runId) {
          throw new Error(`Timeout incident ${id} resolution requires one canonical all-20 checkpoint and package`);
        }
        const checkpointResult = { status:"passed", commit:checkpoint.candidate.commit,
          tree:checkpoint.candidate.tree, reusedTaskCount:0,
          packIds:[...checkpoint.plan.requestedPackIds].sort(), runId:checkpoint.runId,
          receiptPath:checkpointDocument.path, receiptSha256:checkpointDocument.sha256 };
        const packageResult = { status:"passed", path:path.relative(root, resolvedPackagePath),
          receiptPath:packageDocument.path, receiptSha256:packageDocument.sha256,
          digest:timeoutIncidentDigest(packageBytes) };
        const resolutionWithoutDigest = { checkpoint:checkpointResult,
          package:packageResult, archive, resolvedAt:now() };
        const resolution = { ...resolutionWithoutDigest, digest:timeoutIncidentDigest(resolutionWithoutDigest) };
        return transition({ ...incident, state:"resolved", resolution }, "resolved", now(),
          { resolutionDigest:resolution.digest });
      });
    },
    async blocking({ commit }) {
      const applicable = [];
      for (const incident of await this.list()) {
        const failedCommit = incident.failure?.lineage?.commit;
        let applies = failedCommit === commit;
        if (!applies && failedCommit && commit) {
          if (isAncestor) applies = await isAncestor(failedCommit, commit);
          else {
            try { await git(root, "merge-base", "--is-ancestor", failedCommit, commit); applies = true; }
            catch { applies = false; }
          }
        }
        if (applies && incident.state !== "resolved") applicable.push(incident);
      }
      return applicable;
    },
    async resolutions({ commit }) {
      const records = [];
      for (const incident of await this.list()) {
        if (incident.state !== "resolved") continue;
        const repairCommit = incident.repair?.candidate?.commit;
        let applies = repairCommit === commit;
        if (!applies && repairCommit && commit) {
          if (isAncestor) applies = await isAncestor(repairCommit, commit);
          else {
            try { await git(root, "merge-base", "--is-ancestor", repairCommit, commit); applies = true; }
            catch { applies = false; }
          }
        }
        if (applies) {
          const store = await directory({ create:false });
          validateArchiveNames(incident.id, incident.resolution.archive);
          const checkpointDocument = await archivedReceiptDocument(
            path.join(store, incident.resolution.archive.checkpointReceipt));
          const packageDocument = await archivedReceiptDocument(
            path.join(store, incident.resolution.archive.packageReceipt));
          const packageBytes = await safeStoreFile(path.join(store, incident.resolution.archive.packageZip));
          const canonical = await canonicalCheckpointValidator({ document:checkpointDocument, incident, root });
          validatePackageReceipt(packageDocument, checkpointDocument, incident);
          if (canonical.receipt.runId !== incident.resolution.checkpoint.runId ||
              checkpointDocument.sha256 !== incident.resolution.checkpoint.receiptSha256 ||
              packageDocument.sha256 !== incident.resolution.package.receiptSha256 ||
              timeoutIncidentDigest(packageBytes) !== incident.resolution.package.digest) {
            throw new Error(`Timeout incident ${incident.id} archived resolution evidence does not match`);
          }
          records.push(timeoutResolutionEvidence(incident));
        }
      }
      return records;
    },
  };
}

export async function assertNoBlockingTimeoutIncidents(commit = "HEAD", options = {}) {
  const root = options.root ?? repositoryRoot;
  const canonical = await git(root, "rev-parse", `${commit}^{commit}`);
  const incidents = await createTimeoutIncidentStore({ ...options, root }).blocking({ commit:canonical });
  if (incidents.length) {
    throw new Error(`Unresolved timeout incident(s) block verification evidence and Git handoff: ${
      incidents.map(({ id }) => id).join(", ")}. Complete a causal repair and fresh checkpoint.`);
  }
  return [];
}

async function main(args) {
  const [command, commit = "HEAD"] = args;
  if (command === "assert-handoff" || command === "assert-evidence") {
    await assertNoBlockingTimeoutIncidents(commit);
    console.log("timeout incident gate passed");
    return;
  }
  if (command === "list") {
    console.log(JSON.stringify(await createTimeoutIncidentStore().list(), null, 2));
    return;
  }
  if (command === "propose-repair") {
    const [, id, causalCategory, causalExplanation, regressionKey, regressionReceiptPath,
      focusedReceiptPath] = args;
    const incident = await createTimeoutIncidentStore().proposeRepair(id, {
      causalCategory, causalExplanation, regressionKey, regressionReceiptPath, focusedReceiptPath,
    });
    console.log(JSON.stringify({ incidentId:incident.id, repair:incident.repair }, null, 2));
    return;
  }
  throw new Error("Use: verification-timeout-incidents.mjs assert-handoff|assert-evidence [commit] | list | propose-repair <id> <causal-category> <causal-explanation> <regression-key> <regression-receipt> <focused-receipt>");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
