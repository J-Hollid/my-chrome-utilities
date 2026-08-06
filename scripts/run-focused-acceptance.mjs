import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertFreshDist, atomicWriteFile, createDistInputFingerprint } from "./dist-artifact.mjs";
import { withDistArtifactLock } from "./dist-artifact-lock.mjs";
import {
  executeAcceptancePlan,
  loadVerificationPacks,
  planVerification,
  validateVerificationPacks,
  verificationTaskIdentity,
} from "./verification-packs.mjs";
import {
  createPendingVerificationEvidence,
  validateVerificationCandidateClean,
  validateVerificationEvidenceCompatibility,
  validateStrictVerificationToolchain,
  verificationDigest,
} from "./verification-evidence.mjs";
import {
  canonicalVerificationChangeSet,
  verificationPacksAtCommit,
} from "./verification-changes.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultTimeoutMs = 600_000;
const defaultTerminationGraceMs = 5_000;
const defaultOutputLimitBytes = 16 * 1024 * 1024;
const maximumOutputLimitBytes = 64 * 1024 * 1024;
const require = createRequire(import.meta.url);

function installedTypeScriptVersion() {
  return require("typescript/package.json").version;
}

function environmentInteger(name, fallback, { maximum = Number.MAX_SAFE_INTEGER } = {}) {
  if (process.env[name] === undefined) return fallback;
  const value = Number(process.env[name]);
  if (!Number.isInteger(value) || value <= 0 || value > maximum) {
    throw new Error(`${name} must be an integer from 1 to ${maximum}`);
  }
  return value;
}

function valueArgument(args, index, option) {
  const value = args[index + 1];
  if (value === undefined || value === "" || value.startsWith("--")) {
    throw new Error(`Provide a non-empty value for ${option}`);
  }
  return value;
}

function changedPath(value) {
  if (path.isAbsolute(value) || value.includes("\\") || value.includes("\0") ||
      value === "." || value === ".." || value.startsWith("../") ||
      path.posix.normalize(value) !== value) {
    throw new Error(`Use a normalized repository-relative path with --changed: ${value}`);
  }
  return value;
}

function stableTask(value) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/u.test(value)) {
    throw new Error(`Use a stable evidence task name: ${value}`);
  }
  return value;
}

export async function validateExplicitChangedPaths(
  changedPaths,
  { root = repositoryRoot } = {},
) {
  for (const changedPath of changedPaths) {
    try {
      await access(path.join(root, changedPath));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      throw new Error(`Explicit changed path does not exist: ${changedPath}. Use --changed-since for deletes and renames.`);
    }
  }
}

export function focusedAcceptanceOptions(args) {
  const options = {
    packIds:[], changedPaths:[], terminalFull:false, includeProperties:false,
    withDependencies:false, skipBuild:false, changedSince:undefined, shard:undefined,
    prepareEvidence:undefined, browserTargetIds:[],
  };
  const seen = new Set();
  const once = (name) => {
    if (seen.has(name)) throw new Error(`Specify ${name} once`);
    seen.add(name);
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (["--full", "--property", "--with-dependencies", "--no-build"].includes(argument)) {
      once(argument);
      if (argument === "--full") options.terminalFull = true;
      else if (argument === "--property") options.includeProperties = true;
      else if (argument === "--with-dependencies") options.withDependencies = true;
      else options.skipBuild = true;
      continue;
    }
    if (argument === "--changed-since") {
      once(argument);
      const value = valueArgument(args, index, argument);
      if (value.startsWith("-") || /\s/u.test(value)) throw new Error(`Use a Git revision with ${argument}: ${value}`);
      options.changedSince = value;
      index += 1;
      continue;
    }
    if (argument === "--prepare-evidence") {
      once(argument);
      options.prepareEvidence = stableTask(valueArgument(args, index, argument));
      index += 1;
      continue;
    }
    if (argument === "--resume-receipt") {
      once(argument);
      const value = changedPath(valueArgument(args, index, argument));
      if (!/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(value)) {
        throw new Error("Resume receipts must be runner-owned under tmp/verification-receipts");
      }
      options.resumeReceipt = value;
      index += 1;
      continue;
    }
    if (argument === "--record-evidence") {
      throw new Error("Use --prepare-evidence; record the pending file only after verification exits");
    }
    if (argument === "--shard") {
      once(argument);
      const value = valueArgument(args, index, argument);
      const match = /^(\d+)\/(\d+)$/u.exec(value);
      if (!match || Number(match[1]) < 1 || Number(match[1]) > Number(match[2])) {
        throw new Error(`Use --shard <index>/<count>: ${value}`);
      }
      options.shard = { index:Number(match[1]) - 1, count:Number(match[2]) };
      index += 1;
      continue;
    }
    if (argument === "--pack") {
      const value = valueArgument(args, index, argument);
      if (!/^[a-z0-9][a-z0-9_-]*$/u.test(value)) throw new Error(`Use a valid pack id: ${value}`);
      if (options.packIds.includes(value)) throw new Error(`Select every explicit pack once: ${value}`);
      options.packIds.push(value);
      index += 1;
      continue;
    }
    if (argument === "--browser-target") {
      const value = valueArgument(args, index, argument);
      if (!/^[A-Za-z0-9][A-Za-z0-9_:.-]*$/u.test(value)) {
        throw new Error(`Use a stable browser target id: ${value}`);
      }
      if (options.browserTargetIds.includes(value)) {
        throw new Error(`Select every focused browser target once: ${value}`);
      }
      options.browserTargetIds.push(value);
      index += 1;
      continue;
    }
    if (argument === "--changed") {
      const value = changedPath(valueArgument(args, index, argument));
      if (options.changedPaths.includes(value)) throw new Error(`Select every changed path once: ${value}`);
      options.changedPaths.push(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown verification option: ${argument}`);
  }

  if (!options.terminalFull && !options.packIds.length && !options.changedPaths.length && !options.changedSince) {
    throw new Error("Select --pack <id>, --changed <path>, --changed-since <ref>, or --full");
  }
  if (options.terminalFull && (options.packIds.length || options.changedPaths.length || options.changedSince ||
      options.withDependencies || options.includeProperties || options.prepareEvidence)) {
    throw new Error("Use --full without pack, changed, dependency, property, or evidence selectors");
  }
  if (options.shard && !options.terminalFull) throw new Error("Use --shard only with --full");
  if (options.skipBuild && !options.terminalFull) throw new Error("Use --no-build only with a prepared --full shard");
  if (options.changedSince && options.changedPaths.length) {
    throw new Error("Use --changed-since or explicit --changed paths, not both");
  }
  if (options.browserTargetIds.length && (options.packIds.length !== 1 || options.changedPaths.length ||
      options.changedSince || options.terminalFull || options.includeProperties || options.withDependencies ||
      options.skipBuild || options.shard || options.prepareEvidence)) {
    throw new Error("Use --browser-target with one --pack and no other verification mode options");
  }
  if (options.prepareEvidence) {
    if (!options.packIds.length || !options.changedSince) {
      throw new Error("Evidence requires exact --pack selector(s) and --changed-since <commit>");
    }
    if (!options.includeProperties) {
      throw new Error("Evidence requires --property so every registered property leaf is executed");
    }
    if (options.withDependencies || options.skipBuild || options.shard || options.terminalFull) {
      throw new Error("Evidence cannot use dependencies, no-build, sharding, or terminal-full mode");
    }
  }
  if (options.resumeReceipt && (!options.packIds.length || !options.changedSince ||
      !options.includeProperties || !options.prepareEvidence)) {
    throw new Error("Resume requires an exact evidence checkpoint with packs, property, and changed-since selectors");
  }
  return options;
}

function terminateProcessGroup(child, signal) {
  if (process.platform === "win32") return child.kill(signal);
  try { process.kill(-child.pid, signal); return true; }
  catch { return child.kill(signal); }
}

const forwardedSignals = new Map([
  ["SIGHUP", 129],
  ["SIGINT", 130],
  ["SIGTERM", 143],
]);
const activeVerificationChildren = new Set();
let signalHandlersInstalled = false;
// A parent signal is terminal for this process. Keep it sticky for the remaining
// process lifetime so bounded workers cannot start later tasks while cleanup and
// the artifact-lock finally block are still completing.
let receivedParentSignal;

function forwardParentSignal(signal) {
  if (receivedParentSignal) {
    for (const child of activeVerificationChildren) child.forceKill();
    return;
  }
  receivedParentSignal = signal;
  process.exitCode = forwardedSignals.get(signal) ?? 1;
  for (const child of activeVerificationChildren) {
    child.terminate(`Verification runner received ${signal}`, signal);
  }
}

const parentSignalHandlers = new Map(
  [...forwardedSignals].map(([signal]) => [signal, () => forwardParentSignal(signal)]),
);

function installParentSignalHandlers() {
  if (signalHandlersInstalled) return;
  signalHandlersInstalled = true;
  for (const [signal, handler] of parentSignalHandlers) process.on(signal, handler);
}

function uninstallParentSignalHandlers() {
  if (!signalHandlersInstalled || activeVerificationChildren.size > 0) return;
  signalHandlersInstalled = false;
  for (const [signal, handler] of parentSignalHandlers) process.removeListener(signal, handler);
}

function trackVerificationChild(child, terminate) {
  const tracked = {
    terminate,
    forceKill:() => terminateProcessGroup(child, "SIGKILL"),
  };
  activeVerificationChildren.add(tracked);
  installParentSignalHandlers();
  return () => {
    activeVerificationChildren.delete(tracked);
    uninstallParentSignalHandlers();
  };
}

export function createVerificationReceiptContext(
  concurrency,
  observationConcurrency = 2,
  { receiptDirectory = path.join(repositoryRoot, "tmp", "verification-receipts") } = {},
) {
  const receiptPath = path.join(receiptDirectory, `${process.pid}-${randomUUID()}.json`);
  const receipt = {
    version:2,
    runId:randomUUID(),
    pid:process.pid,
    startedAt:new Date().toISOString(),
    environment:{
      node:process.versions.node,
      typescript:installedTypeScriptVersion(),
      platform:`${process.platform}-${process.arch}`,
      concurrency,
      observationConcurrency,
    },
    tasks:{},
  };
  let writeQueue = Promise.resolve();
  const write = () => {
    writeQueue = writeQueue.then(async() => {
      await atomicWriteFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    });
    return writeQueue;
  };
  const runDirectory = path.join(repositoryRoot, "tmp", "verification-runs", receipt.runId);
  return { receiptPath, runDirectory, receipt, write };
}

export function createVerificationCommandRunner(context) {
  if (process.platform === "win32") {
    throw new Error("The verification runner requires POSIX process-group termination; Windows is not supported");
  }
  const timeoutMs = environmentInteger("VERIFICATION_COMMAND_TIMEOUT_MS", defaultTimeoutMs);
  const terminationGraceMs = environmentInteger(
    "VERIFICATION_TERMINATION_GRACE_MS", defaultTerminationGraceMs, { maximum:30_000 },
  );
  const outputLimit = environmentInteger(
    "VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES", defaultOutputLimitBytes,
    { maximum:maximumOutputLimitBytes },
  );
  return async function runCommand(display, task) {
    if (!task?.executable || !Array.isArray(task.args)) throw new Error(`Missing structured task identity: ${display}`);
    if (receivedParentSignal) {
      throw new Error(`Verification runner received ${receivedParentSignal}; refusing to start: ${display}`);
    }
    const taskEnvironment = task.environment ?? {};
    const reservedEnvironment = Object.keys(taskEnvironment).find((name) =>
      ["PATH", "NODE_OPTIONS", "MY_CHROME_UTILITIES_DIST_LOCK_HELD",
        "SWARMFORGE_VERIFICATION_RECEIPT", "SWARMFORGE_STRICT_VERIFICATION_RECEIPT"].includes(name) ||
      name.startsWith("SWARMFORGE_") && ![
        "SWARMFORGE_BUILD_PREPARED", "SWARMFORGE_PACK_RUNNER_OWNS_JS",
      ].includes(name));
    if (reservedEnvironment) throw new Error(`Verification task cannot override reserved environment: ${reservedEnvironment}`);
    const identity = verificationTaskIdentity(task);
    const executionArgs = task.executionArgs ?? task.args;
    const executionDisplay = task.executionArgs
      ? [task.executable, ...executionArgs].join(" ")
      : display;
    const started = Date.now();
    console.error(`[verify:start] ${executionDisplay}`);
    // Keep the portable logical task identity (`node`) in receipts, but execute
    // every Node leaf with the already strict-validated parent runtime instead
    // of resolving a second, potentially different Node through PATH.
    const executable = task.executable === "node" ? process.execPath : task.executable;
    const browserOutputDirectory = ["browser", "browser-observation"].includes(task.stage)
      ? path.join(context.runDirectory, task.key.replaceAll(/[^A-Za-z0-9._-]/gu, "_"))
      : undefined;
    const child = spawn(executable, executionArgs, {
      cwd:repositoryRoot,
      shell:false,
      stdio:["inherit", "pipe", "pipe"],
      detached:process.platform !== "win32",
      env:{
        ...process.env,
        ...taskEnvironment,
        ...(process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD === undefined
          ? {}
          : { MY_CHROME_UTILITIES_DIST_LOCK_HELD:process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD }),
        SWARMFORGE_VERIFICATION_RECEIPT:context.receiptPath,
        ...(browserOutputDirectory ? {
          SWARMFORGE_VERIFICATION_OUTPUT_DIRECTORY:browserOutputDirectory,
          ...(process.env.SWARMFORGE_UPDATE_FIXTURES === "1"
            ? {}
            : { BRAND_EVIDENCE_DIR:browserOutputDirectory }),
        } : {}),
        ...(task.stage === "acceptance-session" ? { SWARMFORGE_STRICT_VERIFICATION_RECEIPT:"1" } : {}),
      },
    });
    const output = [];
    const stderr = [];
    let outputBytes = 0;
    let termination;
    let killTimer;
    const requestTermination = (reason, signal = "SIGTERM") => {
      if (termination) return;
      termination = reason;
      terminateProcessGroup(child, signal);
      killTimer = setTimeout(() => terminateProcessGroup(child, "SIGKILL"), terminationGraceMs);
    };
    const untrackChild = trackVerificationChild(child, requestTermination);
    const countOutput = (chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > outputLimit) {
        requestTermination(`Verification output exceeded ${outputLimit} bytes: ${display}`);
      }
    };
    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      countOutput(chunk);
      if (outputBytes <= outputLimit) output.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
      countOutput(chunk);
      if (outputBytes <= outputLimit) stderr.push(chunk);
    });
    const timeout = setTimeout(
      () => requestTermination(`Verification command timed out after ${timeoutMs}ms: ${display}`),
      timeoutMs,
    );
    const result = await new Promise((resolve) => {
      let spawnError;
      child.once("error", (error) => { spawnError = error; });
      child.once("close", (code, signal) => resolve({ code, signal, spawnError }));
    });
    untrackChild();
    clearTimeout(timeout);
    clearTimeout(killTimer);
    const freshDurationMs = Date.now() - started;
    const freshOut = Buffer.concat(output).toString();
    const freshErr = Buffer.concat(stderr).toString();
    const priorTask = task.priorReceiptTask;
    const out = `${priorTask?.output ?? ""}${freshOut}`;
    const err = `${priorTask?.stderr ?? ""}${freshErr}`;
    const parseLogicalResults = (source, ids) => {
      const values = Object.fromEntries(ids.map((id) => [id, {}]));
      let explicitResultCount = 0;
      for (const line of source.split(/\r?\n/u)) {
        try {
          const record = JSON.parse(line);
          const resultRecord = record.swarmforgeBrowserTargetResult;
          const timingRecord = record.swarmforgeBrowserTargetTiming;
          if (resultRecord && resultRecord.id in values) {
            Object.assign(values[resultRecord.id], resultRecord);
            explicitResultCount += 1;
          }
          if (timingRecord && timingRecord.id in values) values[timingRecord.id].durationMs = timingRecord.durationMs;
        } catch { /* ordinary task output is not a logical browser result */ }
      }
      if (explicitResultCount === 0) {
        for (const value of Object.values(values)) {
          if (Number.isFinite(value.durationMs)) value.status = "passed";
        }
      }
      return values;
    };
    const logicalResults = task.logicalTargetIds
      ? parseLogicalResults(out, task.logicalTargetIds)
      : undefined;
    const logicalPassed = !logicalResults || Object.values(logicalResults)
      .every(({ status, durationMs }) => status === "passed" && Number.isFinite(durationMs));
    const passed = !termination && !result.spawnError && result.code === 0 && logicalPassed;
    const failure = termination ?? result.spawnError?.message ??
      (!logicalPassed ? `Browser target result incomplete or failed: ${display}`
        : `Verification command failed (${result.signal ?? result.code}): ${display}`);
    const taskProvenance = priorTask ? { provenance:"mixed" } : { provenance:"fresh" };
    context.receipt.tasks[task.key] = {
      identity,
      status:passed ? "passed" : "failed",
      ...taskProvenance,
      durationMs:(priorTask?.durationMs ?? 0) + freshDurationMs,
      output:out,
      stderr:err,
      ...(logicalResults ? { logicalResults } : {}),
      ...(passed ? {} : { exitCode:result.code, signal:result.signal, error:failure }),
    };
    await context.write();
    if (passed) {
      console.error(`[verify:pass ${(freshDurationMs / 1000).toFixed(1)}s] ${executionDisplay}`);
      return { out };
    }
    throw new Error(failure);
  };
}

function sameIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function resumeVerificationPlan(plan, priorReceipt, resumeIdentity) {
  const reusable = priorReceipt?.version === 2 &&
    sameIdentity(priorReceipt.resumeIdentity, resumeIdentity);
  const reusedTasks = {};
  const tasks = [];
  for (const task of plan.tasks) {
    const prior = reusable ? priorReceipt.tasks?.[task.key] : undefined;
    if (prior?.status === "passed" &&
        sameIdentity(prior.identity, verificationTaskIdentity(task))) {
      reusedTasks[task.key] = { ...prior, provenance:"reused" };
      continue;
    }
    if (prior && sameIdentity(prior.identity, verificationTaskIdentity(task)) &&
        task.stage === "browser-observation" && task.logicalTargetIds?.length > 1) {
      const remaining = task.logicalTargetIds.filter((id) =>
        prior.logicalResults?.[id]?.status !== "passed");
      if (remaining.length && remaining.length < task.logicalTargetIds.length) {
        tasks.push({
          ...task,
          executionArgs:["scripts/run-browser-observation.mjs", ...remaining],
          priorReceiptTask:prior,
        });
        continue;
      }
    }
    tasks.push(task);
  }
  const selectedKeys = new Set(tasks.map(({ key }) => key));
  const filtered = Object.fromEntries(Object.entries(plan)
    .filter(([key, value]) => key.endsWith("Tasks") && Array.isArray(value))
    .map(([key, value]) => [key, value.filter(({ key:taskKey }) => selectedKeys.has(taskKey))]));
  return { ...plan, ...filtered, tasks, reusedTasks, resumeAccepted:reusable };
}

export function verificationResumeIdentity(plan, receiptContext, artifact) {
  return {
    commit:plan.changeSet?.commit ?? null,
    artifactInputDigest:artifact?.inputDigest ?? artifact?.digest ?? null,
    artifactOutputDigest:artifact?.outputDigest ?? null,
    artifactBuildIdentity:artifact?.buildIdentity ?? null,
    planDigest:verificationDigest(plan.tasks.map(verificationTaskIdentity)),
    toolchainDigest:verificationDigest(receiptContext.receipt.environment),
  };
}

export async function validateCurrentArtifactForConsumers({
  root = repositoryRoot,
  artifactValidator = ({ root:artifactRoot }) => assertFreshDist({ root:artifactRoot }),
} = {}) {
  const artifact = await artifactValidator({ root });
  for (const [field, pattern] of [
    ["inputDigest", /^[a-f0-9]{64}$/u],
    ["outputDigest", /^[a-f0-9]{64}$/u],
    ["buildIdentity", /^[a-f0-9]{64}$/u],
  ]) {
    if (!pattern.test(artifact?.[field] ?? "")) {
      throw new Error(`Current dist artifact has an invalid ${field}`);
    }
  }
  return artifact;
}

export async function checkpointPreflight({
  packs,
  plan,
  receiptContext,
  inputFingerprint,
  evidenceTask,
  changedSince,
  root = repositoryRoot,
  validators = {},
}) {
  const defaults = {
    registry:() => validateVerificationPacks(packs),
    plan:async() => {
      if (plan?.version !== 2 || !Array.isArray(plan.tasks) || !plan.tasks.length ||
          new Set(plan.tasks.map(({ key }) => key)).size !== plan.tasks.length) {
        throw new Error("Checkpoint preflight requires one canonical version 2 plan");
      }
      const staged = Object.entries(plan)
        .filter(([key, value]) => key.endsWith("Tasks") && key !== "tasks" && Array.isArray(value))
        .flatMap(([, value]) => value);
      const stagedByKey = new Map(staged.map((task) => [task.key, task]));
      if (staged.length !== plan.tasks.length ||
          stagedByKey.size !== staged.length ||
          !plan.tasks.every((task) => stagedByKey.has(task.key) &&
            sameIdentity(verificationTaskIdentity(task),
              verificationTaskIdentity(stagedByKey.get(task.key))))) {
        throw new Error("Checkpoint preflight canonical plan stages do not match its task identities");
      }
    },
    receipt:async() => {
      if (receiptContext?.receipt?.version !== 2 || !receiptContext.receiptPath ||
          !receiptContext.receipt.tasks || Array.isArray(receiptContext.receipt.tasks)) {
        throw new Error("Checkpoint preflight requires a writable version 2 receipt contract");
      }
      await receiptContext.write();
      const recorded = JSON.parse(await readFile(receiptContext.receiptPath, "utf8"));
      if (recorded.version !== 2 || !recorded.environment || !recorded.plan ||
          !recorded.tasks || Array.isArray(recorded.tasks)) {
        throw new Error("Checkpoint preflight receipt schema is not recordable");
      }
    },
    artifact:async() => {
      const buildTasks = plan.tasks.filter(({ stage }) => stage === "build");
      if (!plan.skipBuild && buildTasks.length !== 1) {
        throw new Error("Checkpoint preflight requires exactly one artifact build task");
      }
      if (plan.skipBuild && buildTasks.length) {
        throw new Error("Checkpoint preflight cannot build a prepared artifact");
      }
      if (!/^[a-f0-9]{64}$/u.test(inputFingerprint?.inputDigest ?? inputFingerprint?.digest ?? "")) {
        throw new Error("Checkpoint preflight requires the current artifact input identity");
      }
    },
    evidence:async() => {
      environmentInteger("VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES", defaultOutputLimitBytes, {
        maximum:maximumOutputLimitBytes,
      });
      if (evidenceTask && (plan.mode !== "exact" || !plan.includeProperties ||
          !plan.changeSet || !plan.baseCommit || !plan.claimPackIds?.length)) {
        throw new Error("Checkpoint preflight requires an exact canonical evidence plan");
      }
      if (evidenceTask) {
        await validateVerificationEvidenceCompatibility({
          task:evidenceTask,
          plan,
          receiptPath:receiptContext.receiptPath,
          changedSince,
          repositoryRoot:root,
        });
      }
    },
  };
  for (const name of ["registry", "plan", "receipt", "artifact", "evidence"]) {
    await (validators[name] ?? defaults[name])();
  }
}

export async function runFocusedAcceptance(
  args,
  { commandRunner, artifactValidator = ({ root }) => assertFreshDist({ root }) } = {},
) {
  const packs = await loadVerificationPacks();
  const options = focusedAcceptanceOptions(args);
  const evidenceTask = options.prepareEvidence;
  const resumeReceiptPath = options.resumeReceipt;
  if (evidenceTask) {
    await validateStrictVerificationToolchain({ repositoryRoot });
    await validateVerificationCandidateClean({ repositoryRoot });
  }
  let changedSince = options.changedSince;
  if (changedSince) {
    const changeSet = await canonicalVerificationChangeSet({
      base:changedSince,
      repositoryRoot,
    });
    changedSince = changeSet.baseCommit;
    options.changedPaths.push(...changeSet.paths);
    options.changeSet = changeSet;
    try {
      options.basePacks = await verificationPacksAtCommit(changeSet.baseCommit, { repositoryRoot });
    } catch (error) {
      options.historicalRegistryFallback = true;
      console.error(`[verify:conservative-history] ${error.message}`);
    }
  } else if (options.changedPaths.length) {
    await validateExplicitChangedPaths(options.changedPaths);
  }
  delete options.changedSince;
  delete options.prepareEvidence;
  delete options.resumeReceipt;
  await validateVerificationPacks(packs);
  const plan = planVerification(packs, options);
  const concurrency = environmentInteger("VERIFICATION_CONCURRENCY", 4, { maximum:64 });
  const observationConcurrency = environmentInteger("VERIFICATION_OBSERVATION_CONCURRENCY", 2, { maximum:4 });
  const context = createVerificationReceiptContext(concurrency, observationConcurrency);
  const inputFingerprint = await createDistInputFingerprint({ root:repositoryRoot });
  context.receipt.plan = {
    mode:plan.mode,
    requestedPackIds:[...plan.requestedPackIds].sort(),
    selectedPackIds:[...plan.selectedPackIds].sort(),
    changedOwners:plan.changedOwners,
    changedBoundaries:plan.changedBoundaries,
    changeSetDigest:plan.changeSet ? verificationDigest(plan.changeSet) : null,
    conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason,
  };
  const runner = commandRunner ?? createVerificationCommandRunner(context);
  let buildManifest;
  if (options.skipBuild) buildManifest = await validateCurrentArtifactForConsumers({
    root:repositoryRoot, artifactValidator,
  });
  if (!commandRunner) {
    await context.write();
    console.error(`[verify:receipt] ${path.relative(repositoryRoot, context.receiptPath)}`);
  }
  await checkpointPreflight({
    packs, plan, receiptContext:context, inputFingerprint, evidenceTask, changedSince,
  });
  let executionPlan = plan;
  if (resumeReceiptPath) {
    let priorReceipt;
    try {
      priorReceipt = JSON.parse(await readFile(path.join(repositoryRoot, resumeReceiptPath), "utf8"));
    } catch (error) {
      console.error(`[verify:resume-rejected] ${error.message}`);
    }
    if (priorReceipt) {
      try {
        buildManifest = await validateCurrentArtifactForConsumers({
          root:repositoryRoot, artifactValidator,
        });
      } catch (error) {
        priorReceipt = undefined;
        console.error(`[verify:resume-rejected] current artifact is missing, stale, or tampered: ${error.message}`);
      }
    }
    if (priorReceipt) {
      const resumeIdentity = verificationResumeIdentity(plan, context, buildManifest);
      executionPlan = resumeVerificationPlan(plan, priorReceipt, resumeIdentity);
      context.receipt.resumeIdentity = resumeIdentity;
      Object.assign(context.receipt.tasks, executionPlan.reusedTasks);
      await context.write();
      console.error(executionPlan.resumeAccepted
        ? `[verify:resume] reusing ${Object.keys(executionPlan.reusedTasks).length} passed task(s)`
        : "[verify:resume-rejected] checkpoint identity changed; running every task");
    }
  }
  console.error(`[verify:plan] ${plan.packIds.length} pack(s), ${plan.tasks.length} task(s), concurrency ${concurrency}, observation concurrency ${observationConcurrency}`);
  await executeAcceptancePlan(executionPlan, {
    runCommand:runner, concurrency, observationConcurrency,
    afterPreparation:async() => {
      buildManifest = await validateCurrentArtifactForConsumers({
        root:repositoryRoot, artifactValidator,
      });
      if (evidenceTask) {
        context.receipt.resumeIdentity = verificationResumeIdentity(plan, context, buildManifest);
        await context.write();
      }
    },
  });
  if (!commandRunner) {
    buildManifest = buildManifest ?? await validateCurrentArtifactForConsumers({
      root:repositoryRoot, artifactValidator,
    });
    context.receipt.completedAt = new Date().toISOString();
    context.receipt.artifact = {
      schemaVersion:buildManifest.schemaVersion,
      buildIdentity:buildManifest.buildIdentity,
      inputDigest:buildManifest.inputDigest,
      outputDigest:buildManifest.outputDigest,
      toolchain:{ ...buildManifest.toolchain },
    };
    await context.write();
    plan.receiptPath = context.receiptPath;
  }
  if (evidenceTask) {
    if (commandRunner) throw new Error("Evidence cannot be prepared with an injected command runner");
    const pending = await createPendingVerificationEvidence({
      task:evidenceTask,
      plan,
      receiptPath:context.receiptPath,
      changedSince,
      buildManifest,
      toolchainValidator:async() => {},
    });
    plan.pendingEvidencePath = pending.path;
    console.error(`[verify:evidence-pending] ${pending.path}`);
    console.error(`[verify:evidence-record] node scripts/verification-evidence.mjs record ${pending.path}`);
  }
  return plan;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  withDistArtifactLock(() => runFocusedAcceptance(process.argv.slice(2))).catch((error) => {
    console.error(error.message);
    if (!receivedParentSignal) process.exitCode = 1;
  });
}
