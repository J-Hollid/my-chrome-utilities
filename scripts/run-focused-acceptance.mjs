import { execFile, spawn } from "node:child_process";
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
import {
  assertNoBlockingTimeoutIncidents,
  createTimeoutIncidentStore,
  createVerificationProgressTracker,
  reliabilityFailureFingerprint,
  resolvedVerificationDeadlines,
  timeoutRepairCausalCategory,
  timeoutRepairFocusedTaskPlan,
  timeoutRepairPackageTaskIdentity,
  timeoutRepairPackIds,
} from "./verification-reliability-incidents.mjs";
import {
  classifyExecutionRestriction, preflightExecutionPrerequisites,
  probeExecutionPrerequisiteEnvironment,
} from "./verification-execution-prerequisites.mjs";
import {
  checkpointAttemptIdentity, createCheckpointAttemptStore, defaultCheckpointAttemptDirectory,
} from "./verification-checkpoint-attempt.mjs";

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

function configuredExecutionCapabilities(environment = process.env) {
  const encoded = environment.SWARMFORGE_VERIFICATION_CAPABILITIES ?? "";
  return encoded ? encoded.split(",").map((value) => value.trim()).filter(Boolean) : [];
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
  const reliabilityOptionAliases = new Map([
    ["--reliability-diagnostic-retry", "--timeout-diagnostic-retry"],
    ["--reliability-repair-incident", "--timeout-repair-incident"],
    ["--reliability-repair-focused", "--timeout-repair-focused"],
    ["--reliability-regression", "--timeout-regression"],
    ["--reliability-causal-category", "--timeout-causal-category"],
    ["--reliability-causal-explanation", "--timeout-causal-explanation"],
  ]);
  const seen = new Set();
  const once = (name) => {
    if (seen.has(name)) throw new Error(`Specify ${name} once`);
    seen.add(name);
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = reliabilityOptionAliases.get(args[index]) ?? args[index];
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
    if (["--timeout-diagnostic-retry", "--timeout-repair-incident", "--timeout-repair-focused"].includes(argument)) {
      once(argument);
      const value = valueArgument(args, index, argument);
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(value)) {
        throw new Error(`Use a stable reliability incident id with ${argument}`);
      }
      if (argument === "--timeout-diagnostic-retry") options.timeoutDiagnosticRetry = value;
      else if (argument === "--timeout-repair-incident") options.timeoutRepairIncident = value;
      else options.timeoutRepairFocused = value;
      index += 1;
      continue;
    }
    if (["--timeout-regression", "--timeout-causal-category", "--timeout-causal-explanation"].includes(argument)) {
      once(argument);
      const value = valueArgument(args, index, argument);
      if (argument === "--timeout-regression") options.timeoutRegression = value;
      else if (argument === "--timeout-causal-category") options.timeoutCausalCategory = value;
      else options.timeoutCausalExplanation = value;
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

  if (!options.terminalFull && !options.packIds.length && !options.changedPaths.length && !options.changedSince &&
      !options.timeoutDiagnosticRetry && !options.timeoutRepairFocused) {
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
  if (options.prepareEvidence && !options.timeoutRepairFocused) {
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
  if (options.timeoutDiagnosticRetry && (options.packIds.length || options.changedPaths.length ||
      options.changedSince || options.terminalFull || options.includeProperties || options.withDependencies ||
      options.skipBuild || options.shard || options.prepareEvidence || options.resumeReceipt ||
      options.browserTargetIds.length || options.timeoutRepairIncident)) {
    throw new Error("Use --timeout-diagnostic-retry as an isolated runner-owned mode");
  }
  if (options.timeoutRepairIncident && (!options.prepareEvidence || options.resumeReceipt)) {
    throw new Error("Use --timeout-repair-incident only with a fresh exact evidence checkpoint");
  }
  if (options.timeoutRepairFocused) {
    if (!options.timeoutRegression || !options.timeoutCausalCategory || !options.timeoutCausalExplanation ||
        !options.changedSince || !options.prepareEvidence) {
      throw new Error("Repair-focused mode requires regression, causal category/explanation, changed-since, and evidence task");
    }
    if (options.packIds.length || options.changedPaths.length || options.terminalFull || options.includeProperties ||
        options.withDependencies || options.skipBuild || options.shard || options.resumeReceipt ||
        options.browserTargetIds.length || options.timeoutDiagnosticRetry || options.timeoutRepairIncident) {
      throw new Error("Use --timeout-repair-focused as an isolated runner-owned mode");
    }
  } else if (options.timeoutRegression || options.timeoutCausalCategory || options.timeoutCausalExplanation) {
    throw new Error("Timeout regression and causal fields require --timeout-repair-focused");
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
  {
    receiptDirectory = path.join(repositoryRoot, "tmp", "verification-receipts"),
    executionLoad = process.env.VERIFICATION_EXECUTION_LOAD ?? "normal",
  } = {},
) {
  if (!["normal", "loaded"].includes(executionLoad)) {
    throw new Error("VERIFICATION_EXECUTION_LOAD must be normal or loaded");
  }
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
      executionLoad,
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

export function createVerificationCommandRunner(context, options = {}) {
  if (process.platform === "win32") {
    throw new Error("The verification runner requires POSIX process-group termination; Windows is not supported");
  }
  const timeoutMs = options.timeoutMs ?? environmentInteger("VERIFICATION_COMMAND_TIMEOUT_MS", defaultTimeoutMs);
  const terminationGraceMs = options.terminationGraceMs ?? environmentInteger(
    "VERIFICATION_TERMINATION_GRACE_MS", defaultTerminationGraceMs, { maximum:30_000 },
  );
  const outputLimit = options.outputLimit ?? environmentInteger(
    "VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES", defaultOutputLimitBytes,
    { maximum:maximumOutputLimitBytes },
  );
  return async function runCommand(display, task) {
    if (!task?.executable || !Array.isArray(task.args)) throw new Error(`Missing structured task identity: ${display}`);
    if (receivedParentSignal) {
      throw new Error(`Verification runner received ${receivedParentSignal}; refusing to start: ${display}`);
    }
    const taskEnvironment = task.environment ?? {};
    const executionEnvironment = task.executionEnvironment ?? {};
    const invalidExecutionEnvironment = Object.keys(executionEnvironment).find((name) =>
      name !== "SWARMFORGE_TIMEOUT_REPAIR_REGRESSION");
    if (invalidExecutionEnvironment) {
      throw new Error(`Verification task has an unsupported runner-owned environment: ${invalidExecutionEnvironment}`);
    }
    const reservedEnvironment = Object.keys(taskEnvironment).find((name) =>
      ["PATH", "NODE_OPTIONS", "MY_CHROME_UTILITIES_DIST_LOCK_HELD",
        "SWARMFORGE_VERIFICATION_RECEIPT", "SWARMFORGE_STRICT_VERIFICATION_RECEIPT"].includes(name) ||
      name.startsWith("SWARMFORGE_") && ![
        "SWARMFORGE_BUILD_PREPARED", "SWARMFORGE_PACK_RUNNER_OWNS_JS",
      ].includes(name));
    if (reservedEnvironment) throw new Error(`Verification task cannot override reserved environment: ${reservedEnvironment}`);
    const identity = verificationTaskIdentity(task);
    const launchRoute = options.launchRoutes?.get(task.key) ?? "workspace-sandbox";
    const resolvedDeadlines = resolvedVerificationDeadlines({ timeoutMs, terminationGraceMs,
      environment:{ ...process.env, ...taskEnvironment } });
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
    const isolateWorkspace = [...(options.launchRoutes?.values() ?? [])]
      .some((route) => route !== "workspace-sandbox");
    const launch = isolateWorkspace ? {
      executable:"bwrap",
      args:["--ro-bind", "/", "/", "--bind", repositoryRoot, repositoryRoot,
        "--bind", "/tmp", "/tmp", "--dev-bind", "/dev", "/dev", "--proc", "/proc",
        "--unshare-net", executable, ...executionArgs],
    } : { executable, args:executionArgs };
    const child = spawn(launch.executable, launch.args, {
      cwd:repositoryRoot,
      shell:false,
      stdio:["inherit", "pipe", "pipe"],
      detached:process.platform !== "win32",
      env:{
        ...process.env,
        ...taskEnvironment,
        ...executionEnvironment,
        ...(process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD === undefined
          ? {}
          : { MY_CHROME_UTILITIES_DIST_LOCK_HELD:process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD }),
        SWARMFORGE_VERIFICATION_RECEIPT:context.receiptPath,
        SWARMFORGE_VERIFICATION_TASK_KEY:task.key,
        SWARMFORGE_EXECUTION_ROUTE:launchRoute,
        SWARMFORGE_EXECUTION_BOUNDARY:isolateWorkspace ? "bwrap-unshared-network" :
          "workspace-sandbox",
        ...(browserOutputDirectory ? {
          SWARMFORGE_VERIFICATION_OUTPUT_DIRECTORY:browserOutputDirectory,
          ...(process.env.SWARMFORGE_UPDATE_FIXTURES === "1"
            ? {}
            : { BRAND_EVIDENCE_DIR:browserOutputDirectory }),
        } : {}),
        ...(task.stage === "acceptance-session" && options.strictAcceptanceReceipt !== false
          ? { SWARMFORGE_STRICT_VERIFICATION_RECEIPT:"1" } : {}),
      },
    });
    const output = [];
    const stderr = [];
    let outputBytes = 0;
    let termination;
    let runnerTimedOut = false;
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
    const progress = createVerificationProgressTracker({ taskKey:task.key });
    let progressBuffer = "";
    const captureProgress = (chunk) => {
      progressBuffer += chunk.toString();
      const lines = progressBuffer.split(/\r?\n/u);
      progressBuffer = lines.pop() ?? "";
      for (const line of lines) progress.acceptLine(line);
    };
    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      captureProgress(chunk);
      countOutput(chunk);
      if (outputBytes <= outputLimit) output.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
      countOutput(chunk);
      if (outputBytes <= outputLimit) stderr.push(chunk);
    });
    const timeout = setTimeout(
      () => {
        runnerTimedOut = true;
        requestTermination(`Verification command timed out after ${timeoutMs}ms: ${display}`);
      },
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
    if (progressBuffer) progress.acceptLine(progressBuffer);
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
    const executionLogicalTargetIds = task.executionLogicalTargetIds ?? task.logicalTargetIds;
    const logicalResults = executionLogicalTargetIds?.length
      ? parseLogicalResults(out, executionLogicalTargetIds)
      : undefined;
    const logicalPassed = !logicalResults || Object.values(logicalResults)
      .every(({ status, durationMs }) => status === "passed" && Number.isFinite(durationMs));
    const passed = !termination && !result.spawnError && result.code === 0 && logicalPassed;
    const failure = termination ?? result.spawnError?.message ??
      (!logicalPassed ? `Browser target result incomplete or failed: ${display}`
        : `Verification command failed (${result.signal ?? result.code}): ${display}`);
    const taskProvenance = priorTask ? { provenance:"mixed" } : { provenance:"fresh" };
    const receiptTask = {
      identity,
      executionPrerequisites:{ requiredCapabilities:[...identity.requiredCapabilities], launchRoute },
      status:passed ? "passed" : "failed",
      ...taskProvenance,
      durationMs:(priorTask?.durationMs ?? 0) + freshDurationMs,
      output:out,
      stderr:err,
      ...(task.executionArgs ? { execution:{ args:[...executionArgs],
        logicalTargetIds:[...(task.executionLogicalTargetIds ?? [])] } } : {}),
      ...(logicalResults ? { logicalResults } : {}),
      ...(passed ? {} : { exitCode:result.code, signal:result.signal, error:failure }),
    };
    context.receipt.tasks[task.key] = receiptTask;
    await context.write();
    if (!passed && !receivedParentSignal) {
      const failedLogicalResult = Object.entries(logicalResults ?? {})
        .find(([, logicalResult]) => logicalResult.status !== "passed");
      const failedBoundary = failedLogicalResult ? {
        logicalTargetId:failedLogicalResult[0],
        phase:failedLogicalResult[1].phase,
        assertionSite:failedLogicalResult[1].assertionSite,
        caseId:failedLogicalResult[1].caseId,
        deadlineOwner:failedLogicalResult[1].deadlineOwner,
        state:failedLogicalResult[1].finalState,
      } : progress.snapshot();
      const restriction = classifyExecutionRestriction({ task:identity,
        operation:{ kind:"bind", address:"loopback" },
        code:/\bEACCES\b/u.test(freshErr) ? "EACCES" : /\bEPERM\b/u.test(freshErr) ? "EPERM" : undefined,
        stderr:freshErr, route:launchRoute });
      const failureClass = restriction?.failureClass ?? (runnerTimedOut ? "runner-timeout"
        : result.spawnError ? "spawn-failure"
          : termination?.startsWith("Verification output exceeded") ? "output-limit"
            : failedLogicalResult?.[1].assertionSite ? "assertion-failure"
              : failedLogicalResult?.[1].status === "failed" ? "explicit-logical-failure"
              : logicalResults && !logicalPassed ? "incomplete-result"
                : result.code !== 0 ? "nonzero-exit" : "incomplete-result");
      const fingerprint = reliabilityFailureFingerprint({
        failureClass, task:identity, failedBoundary, lastProgress:progress.snapshot(),
        exitCode:result.code, signal:result.signal, error:failure, stderr:freshErr,
      });
      receiptTask.failureClass = failureClass;
      receiptTask.reliabilityFailureFingerprint = fingerprint;
      if (options.diagnosticIncidentId) {
        if (runnerTimedOut) receiptTask.runnerOwnedTimeout = true;
        receiptTask.reliabilityIncidentId = options.diagnosticIncidentId;
        receiptTask.timeoutIncidentId = options.diagnosticIncidentId;
        await context.write();
      } else {
        const store = options.incidentStore ?? createTimeoutIncidentStore();
        const incident = await store.create({
        runnerRunId:context.receipt.runId,
        sourceReceipt:path.relative(repositoryRoot, context.receiptPath),
        lineage:context.receipt.candidate ?? {},
        task:identity,
        failureClass,
        fingerprint,
        configuredTimeoutMs:timeoutMs,
        resolvedDeadlines,
        applicableLimit:runnerTimedOut ? { kind:"runner-timeout", milliseconds:timeoutMs }
          : failureClass === "output-limit" ? { kind:"output-bytes", bytes:outputLimit } : null,
        durationMs:freshDurationMs,
        exitResult:{ code:result.code, signal:result.signal },
        termination:{ signal:result.signal, escalatedTo:result.signal === "SIGKILL" ? "SIGKILL" : null },
        environment:context.receipt.environment,
        artifact:context.receipt.artifact ?? context.receipt.artifactInput ?? null,
        planDigest:verificationDigest(context.receipt.plan ?? {}),
        outputSha256:verificationDigest(freshOut),
        stderrSha256:verificationDigest(freshErr),
        failedBoundary,
        lastProgress:progress.snapshot(),
        progressDiagnostics:progress.diagnostics(),
        ...(restriction ? { executionPrerequisite:restriction } : {}),
        });
        receiptTask.reliabilityIncidentId = incident.id;
        receiptTask.reliabilityFailureDigest = incident.failureDigest;
        if (runnerTimedOut) {
          receiptTask.runnerOwnedTimeout = true;
          receiptTask.timeoutIncidentId = incident.id;
          receiptTask.timeoutFailureDigest = incident.failureDigest;
        }
        await context.write();
      }
    }
    if (passed) {
      console.error(`[verify:pass ${(freshDurationMs / 1000).toFixed(1)}s] ${executionDisplay}`);
      return { out };
    }
    throw new Error(failure);
  };
}

export async function runTimeoutDiagnosticRetry(id, {
  store = createTimeoutIncidentStore(),
  candidateIdentity = async() => ({
    commit:await new Promise((resolve, reject) => execFile("git", ["rev-parse", "HEAD^{commit}"],
      { cwd:repositoryRoot }, (error, stdout, stderr) => error
        ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout.trim()))),
    tree:await new Promise((resolve, reject) => execFile("git", ["rev-parse", "HEAD^{tree}"],
      { cwd:repositoryRoot }, (error, stdout, stderr) => error
        ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout.trim()))),
  }),
  artifactIdentity = async() => verificationArtifactIdentity(
    await validateCurrentArtifactForConsumers({ root:repositoryRoot })),
  deadlineIdentity = (incident) => resolvedVerificationDeadlines({
    timeoutMs:environmentInteger("VERIFICATION_COMMAND_TIMEOUT_MS", defaultTimeoutMs),
    terminationGraceMs:environmentInteger("VERIFICATION_TERMINATION_GRACE_MS",
      defaultTerminationGraceMs, { maximum:30000 }),
    environment:{ ...process.env, ...(incident.failure.task.environment ?? {}) },
  }),
} = {}) {
  const incident = await store.read(id);
  if (!incident.failure.retryScope) throw new Error(`Timeout incident ${id} has no trusted retry scope`);
  const [candidate, artifact, deadlines] = await Promise.all([
    candidateIdentity(), artifactIdentity(), deadlineIdentity(incident),
  ]);
  if (candidate.commit !== incident.failure.lineage.commit || candidate.tree !== incident.failure.lineage.tree ||
      verificationDigest(artifact) !== verificationDigest(incident.failure.artifact)) {
    throw new Error(`Timeout incident ${id} diagnostic candidate or artifact identity changed`);
  }
  if (verificationDigest(deadlines) !== verificationDigest(incident.failure.resolvedDeadlines)) {
    throw new Error(`Timeout incident ${id} diagnostic deadline identity changed`);
  }
  const concurrency = incident.failure.environment.concurrency;
  const observationConcurrency = incident.failure.environment.observationConcurrency;
  const context = createVerificationReceiptContext(concurrency, observationConcurrency);
  context.receipt.candidate = { ...structuredClone(incident.failure.lineage), ...candidate };
  context.receipt.artifact = structuredClone(artifact);
  context.receipt.plan = { mode:"timeout-diagnostic", requestedPackIds:[incident.failure.task.packId],
    selectedPackIds:[incident.failure.task.packId] };
  context.receipt.diagnostic = { incidentId:id, retryIdentity:incident.failure.retryIdentity,
    scope:structuredClone(incident.failure.retryScope), resolvedDeadlines:structuredClone(deadlines) };
  if (JSON.stringify(context.receipt.environment) !== JSON.stringify(incident.failure.environment)) {
    throw new Error(`Timeout incident ${id} diagnostic environment identity changed`);
  }
  await store.claimDiagnosticRetry(id, incident.failure.retryIdentity);
  await context.write();
  const task = { ...structuredClone(incident.failure.task),
    executionArgs:[...incident.failure.retryScope.executionArgs],
    executionLogicalTargetIds:incident.failure.retryScope.logicalTargetIds ?? [] };
  const runner = createVerificationCommandRunner(context, { diagnosticIncidentId:id,
    timeoutMs:incident.failure.configuredTimeoutMs, strictAcceptanceReceipt:false });
  try { await runner(`diagnostic retry ${id}`, task); }
  catch { /* the persisted runner receipt is the classification authority */ }
  context.receipt.completedAt = new Date().toISOString();
  await context.write();
  const classified = await store.classifyDiagnosticRetry(id, context.receiptPath);
  console.error(`[verify:timeout-diagnostic] ${id} ${classified.retry.classification}`);
  return { incident:classified, receiptPath:context.receiptPath };
}

export async function runTimeoutRepairFocused(id, {
  regressionKey, causalCategory, causalExplanation, baseCommit, evidenceTask,
  store = createTimeoutIncidentStore(),
  candidateIdentity = async() => {
    const value = (...arguments_) => new Promise((resolve, reject) => execFile("git", arguments_,
      { cwd:repositoryRoot }, (error, stdout, stderr) => error
        ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout.trim())));
    return { commit:await value("rev-parse", "HEAD^{commit}"),
      tree:await value("rev-parse", "HEAD^{tree}"), branch:await value("rev-parse", "--abbrev-ref", "HEAD") };
  },
  artifactIdentity = async() => verificationArtifactIdentity(
    await validateCurrentArtifactForConsumers({ root:repositoryRoot })),
  canonicalPlan,
  strictToolchainValidator = () => validateStrictVerificationToolchain({ repositoryRoot }),
  candidateCleanValidator = () => validateVerificationCandidateClean({ repositoryRoot }),
  changeSetLoader = (base) => canonicalVerificationChangeSet({ base, repositoryRoot }),
  verificationPacksLoader = loadVerificationPacks,
  verificationPacksValidator = validateVerificationPacks,
  receiptContextFactory = createVerificationReceiptContext,
  commandRunnerFactory = createVerificationCommandRunner,
} = {}) {
  timeoutRepairCausalCategory(causalCategory);
  if (typeof causalExplanation !== "string" || causalExplanation !== causalExplanation.trim() ||
      causalExplanation.length < 1 || causalExplanation.length > 500 ||
      /[\u0000-\u001f\u007f]/u.test(causalExplanation)) {
    throw new Error("Timeout repair requires a bounded one-line causal explanation");
  }
  if (typeof regressionKey !== "string" || !regressionKey || !baseCommit || !evidenceTask) {
    throw new Error("Timeout repair requires regression, approved base, and evidence task");
  }
  await strictToolchainValidator();
  await candidateCleanValidator();
  const incident = await store.read(id);
  const [candidate, artifact, changeSet, packs] = await Promise.all([
    candidateIdentity(), artifactIdentity(),
    changeSetLoader(baseCommit), verificationPacksLoader(),
  ]);
  await verificationPacksValidator(packs);
  const plan = canonicalPlan ?? planVerification(packs, {
    packIds:timeoutRepairPackIds, includeProperties:true, changedPaths:changeSet.paths, changeSet,
  });
  const canonicalIdentities = plan.tasks.map(verificationTaskIdentity);
  const taskPlan = timeoutRepairFocusedTaskPlan(incident, changeSet.paths, regressionKey,
    canonicalIdentities);
  const context = receiptContextFactory(incident.failure.environment.concurrency,
    incident.failure.environment.observationConcurrency);
  context.receipt.candidate = { role:process.env.SWARMFORGE_ROLE ?? null, branch:candidate.branch ?? null,
    commit:candidate.commit, tree:candidate.tree, baseCommit:changeSet.baseCommit, evidenceTask,
    changeSetDigest:verificationDigest(changeSet) };
  context.receipt.artifact = structuredClone(artifact);
  context.receipt.plan = { mode:"timeout-repair-focused", incidentId:id, causalCategory,
    causalExplanation, taskPlan };
  await context.write();
  console.error(`[verify:receipt] ${path.relative(repositoryRoot, context.receiptPath)}`);
  const regressionContext = { version:1, incidentId:id, failureDigest:incident.failureDigest,
    diagnosedBoundary:incident.failure.retryScope, causalCategory, causalExplanation };
  const runner = commandRunnerFactory(context, { strictAcceptanceReceipt:false });
  for (const descriptor of taskPlan) {
    const task = { ...structuredClone(descriptor.identity),
      ...(descriptor.executionArgs ? { executionArgs:[...descriptor.executionArgs] } : {}),
      ...(descriptor.executionLogicalTargetIds
        ? { executionLogicalTargetIds:[...descriptor.executionLogicalTargetIds] } : {}),
      ...(descriptor.roles.includes("causal-regression") ? { executionEnvironment:{
        SWARMFORGE_TIMEOUT_REPAIR_REGRESSION:JSON.stringify(regressionContext),
      } } : {}),
    };
    await runner(`timeout repair ${descriptor.roles.join("+")} ${task.key}`, task);
  }
  context.receipt.completedAt = new Date().toISOString();
  await context.write();
  const repaired = await store.proposeRepair(id, { causalCategory, causalExplanation, regressionKey,
    regressionReceiptPath:context.receiptPath, focusedReceiptPath:context.receiptPath });
  console.error(`[verify:timeout-repair-focused] ${id} ${repaired.repair.status}`);
  return { incident:repaired, receiptPath:context.receiptPath, taskPlan };
}

export const runReliabilityDiagnosticRetry = runTimeoutDiagnosticRetry;
export const runReliabilityRepairFocused = runTimeoutRepairFocused;

function sameIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function resumeVerificationPlan(plan, priorReceipt, resumeIdentity) {
  const failed = Object.entries(priorReceipt?.tasks ?? {})
    .filter(([, result]) => result?.status === "failed" || result?.reliabilityIncidentId ||
      result?.timeoutIncidentId);
  if (failed.length) {
    throw new Error(`Reliability incident retry cannot use ordinary receipt resume: ${
      failed.map(([key, result]) => result.reliabilityIncidentId ?? result.timeoutIncidentId ?? key)
        .join(", ")}`);
  }
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

export function verificationArtifactIdentity(artifact) {
  return {
    schemaVersion:artifact?.schemaVersion,
    buildIdentity:artifact?.buildIdentity,
    inputDigest:artifact?.inputDigest,
    outputDigest:artifact?.outputDigest,
    toolchain:{ node:artifact?.toolchain?.node, typescript:artifact?.toolchain?.typescript },
  };
}

function planPackageTask(plan) {
  const task = { ...structuredClone(timeoutRepairPackageTaskIdentity), requiredCapabilities:[] };
  task.display = [task.executable, ...task.args].join(" ");
  return { ...plan, tasks:[...plan.tasks, task], packageTasks:[task],
    packageCommands:[task.display], commands:[...plan.commands, task.display],
    stages:{ ...plan.stages, package:[] } };
}

export async function checkpointPreflight({
  packs,
  plan,
  receiptContext,
  inputFingerprint,
  evidenceTask,
  changedSince,
  availableCapabilities = configuredExecutionCapabilities(),
  root = repositoryRoot,
  validators = {},
  validationNames = ["registry", "plan", "receipt", "artifact", "evidence", "prerequisites"],
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
    prerequisites:async() => {
      const outputLimitBytes = environmentInteger("VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES",
        defaultOutputLimitBytes, { maximum:maximumOutputLimitBytes });
      const environment = await probeExecutionPrerequisiteEnvironment(plan.tasks, {
        outputDirectory:path.dirname(receiptContext.receiptPath), outputLimitBytes,
        requestedCapabilities:availableCapabilities, workspaceRoot:root,
      });
      const result = preflightExecutionPrerequisites(plan.tasks, {
        availableCapabilities,
        approvalRoutes:{ "local-loopback":"scoped-command-approval",
          "git-metadata-write":"scoped-git-metadata-approval" },
      });
      receiptContext.receipt.plan ??= {};
      receiptContext.receipt.plan.executionPrerequisites = result.tasks;
      if (!result.launchable || !environment.launchable) {
        const blocked = [...result.blocked, ...environment.blocked];
        receiptContext.receipt.environmentPrerequisiteBlocked = blocked;
        await receiptContext.write();
        throw new Error(`Verification environment prerequisite blocked before task launch: ${
          blocked.map(({ taskKey, capability, prerequisite, route, value }) =>
            `${taskKey}:${capability ?? prerequisite}:${route ?? value}`).join(", ")}`);
      }
      return { ...result, environment };
    },
  };
  let prerequisites;
  for (const name of validationNames) {
    if (!Object.hasOwn(defaults, name)) throw new Error(`Unknown checkpoint preflight phase: ${name}`);
    const result = await (validators[name] ?? defaults[name])();
    if (name === "prerequisites") prerequisites = result;
  }
  return prerequisites;
}

export async function runFocusedAcceptance(
  args,
  { commandRunner, artifactValidator = ({ root }) => assertFreshDist({ root }) } = {},
) {
  const packs = await loadVerificationPacks();
  const options = focusedAcceptanceOptions(args);
  if (options.timeoutDiagnosticRetry) {
    if (commandRunner) throw new Error("Diagnostic retry cannot use an injected command runner");
    return runTimeoutDiagnosticRetry(options.timeoutDiagnosticRetry);
  }
  if (options.timeoutRepairFocused) {
    if (commandRunner) throw new Error("Repair-focused mode cannot use an injected command runner");
    return runTimeoutRepairFocused(options.timeoutRepairFocused, {
      regressionKey:options.timeoutRegression,
      causalCategory:options.timeoutCausalCategory,
      causalExplanation:options.timeoutCausalExplanation,
      baseCommit:options.changedSince,
      evidenceTask:options.prepareEvidence,
    });
  }
  const evidenceTask = options.prepareEvidence;
  const resumeReceiptPath = options.resumeReceipt;
  const timeoutRepairIncident = options.timeoutRepairIncident;
  if (evidenceTask) {
    if (!timeoutRepairIncident) await assertNoBlockingTimeoutIncidents("HEAD");
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
  delete options.timeoutDiagnosticRetry;
  delete options.timeoutRepairIncident;
  await validateVerificationPacks(packs);
  let plan = planVerification(packs, options);
  if (evidenceTask) plan = planPackageTask(plan);
  const concurrency = environmentInteger("VERIFICATION_CONCURRENCY", 4, { maximum:64 });
  const observationConcurrency = environmentInteger("VERIFICATION_OBSERVATION_CONCURRENCY", 2, { maximum:4 });
  const context = createVerificationReceiptContext(concurrency, observationConcurrency);
  const inputFingerprint = await createDistInputFingerprint({ root:repositoryRoot });
  const gitValue = (...arguments_) => new Promise((resolve, reject) => {
    execFile("git", arguments_, { cwd:repositoryRoot }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim()));
  });
  const [candidateCommit, candidateTree, candidateBranch] = await Promise.all([
    gitValue("rev-parse", "HEAD^{commit}"), gitValue("rev-parse", "HEAD^{tree}"),
    gitValue("rev-parse", "--abbrev-ref", "HEAD"),
  ]);
  context.receipt.candidate = {
    role:process.env.SWARMFORGE_ROLE ?? null, branch:candidateBranch, commit:candidateCommit,
    tree:candidateTree, baseCommit:changedSince ?? null, evidenceTask:evidenceTask ?? null,
    changeSetDigest:plan.changeSet ? verificationDigest(plan.changeSet) : null,
  };
  context.receipt.artifactInput = {
    inputDigest:inputFingerprint.inputDigest ?? inputFingerprint.digest,
  };
  context.receipt.plan = {
    mode:plan.mode,
    requestedPackIds:[...plan.requestedPackIds].sort(),
    selectedPackIds:[...plan.selectedPackIds].sort(),
    changedOwners:plan.changedOwners,
    changedBoundaries:plan.changedBoundaries,
    changeSetDigest:plan.changeSet ? verificationDigest(plan.changeSet) : null,
    conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason,
  };
  let timeoutStore;
  if (timeoutRepairIncident) {
    timeoutStore = createTimeoutIncidentStore();
    const [incident, blocking] = await Promise.all([
      timeoutStore.read(timeoutRepairIncident), timeoutStore.blocking({ commit:candidateCommit }),
    ]);
    if (blocking.some(({ id }) => id !== timeoutRepairIncident) ||
        !blocking.some(({ id }) => id === timeoutRepairIncident)) {
      throw new Error("Repair checkpoint can bypass only its single applicable timeout incident");
    }
    if (incident.repair?.status !== "eligible" ||
        incident.repair.candidate.commit !== candidateCommit ||
        incident.repair.candidate.tree !== candidateTree ||
        incident.repair.checkpoint.baseCommit !== changedSince ||
        incident.repair.checkpoint.evidenceTask !== evidenceTask ||
        JSON.stringify([...plan.requestedPackIds].sort()) !== JSON.stringify(timeoutRepairPackIds)) {
      throw new Error("Repair checkpoint requires the eligible repair candidate and exact all-20 plan");
    }
    context.receipt.timeoutRepairCheckpoint = { incidentId:timeoutRepairIncident };
    await timeoutStore.claimRepairCheckpoint(timeoutRepairIncident, context.receipt.runId);
  }
  let buildManifest;
  if (options.skipBuild) buildManifest = await validateCurrentArtifactForConsumers({
    root:repositoryRoot, artifactValidator,
  });
  const prerequisitePlan = await checkpointPreflight({
    packs, plan, receiptContext:context, inputFingerprint, evidenceTask, changedSince,
    validationNames:evidenceTask
      ? ["registry", "plan", "artifact", "prerequisites"]
      : ["registry", "plan", "receipt", "artifact", "evidence", "prerequisites"],
  });
  const launchRoutes = new Map(prerequisitePlan.tasks.map(({ key, route }) => [key, route]));
  let executionPlan = plan;
  let checkpointAttempt;
  let checkpointAttemptStore;
  let checkpointOwner;
  let checkpointIdentity;
  let promotionOnly = false;
  if (evidenceTask) {
    checkpointIdentity = checkpointAttemptIdentity({
      candidate:{ commit:candidateCommit, tree:candidateTree }, baseCommit:changedSince,
      evidenceTask, planDigest:verificationDigest(plan.tasks.map(verificationTaskIdentity)),
      artifactInputDigest:context.receipt.artifactInput.inputDigest,
      registryDigest:verificationDigest(packs),
      toolchainDigest:verificationDigest(context.receipt.environment),
      environmentClass:verificationDigest(context.receipt.environment),
      capabilityRoutes:Object.fromEntries(prerequisitePlan.tasks.map(({ key, route }) => [key, route])),
    });
    checkpointAttemptStore = createCheckpointAttemptStore({
      directory:await defaultCheckpointAttemptDirectory(repositoryRoot),
    });
    checkpointOwner = { pid:process.pid, token:randomUUID() };
    checkpointAttempt = await checkpointAttemptStore.claim(checkpointIdentity,
      plan.tasks.map(({ key }) => key), checkpointOwner);
    context.receipt.checkpointAttempt = { id:checkpointAttempt.attempt.id,
      action:checkpointAttempt.action, identityDigest:checkpointAttempt.attempt.identityDigest };
    if (checkpointAttempt.action === "attached") {
      throw new Error(`Compatible checkpoint attempt ${checkpointAttempt.attempt.id} is already active under pid ${
        checkpointAttempt.owner.pid}; no duplicate all-pack process launched`);
    }
    if (checkpointAttempt.action === "promotion-only") {
      const recovery = await checkpointAttemptStore.recovery(checkpointAttempt.attempt.id);
      const priorTasks = Object.fromEntries(Object.entries(checkpointAttempt.attempt.results)
        .map(([key, result]) => [key, result.receiptTask]));
      executionPlan = resumeVerificationPlan(plan,
        { version:2, resumeIdentity:checkpointIdentity, tasks:priorTasks }, checkpointIdentity);
      for (const result of Object.values(executionPlan.reusedTasks)) {
        result.provenance = "fresh";
        result.attemptContinuation = true;
      }
      Object.assign(context.receipt.tasks, executionPlan.reusedTasks);
      promotionOnly = true;
      console.error(`[verify:checkpoint-promotion] ${checkpointAttempt.attempt.id} recovering ${
        recovery.scope} without rerunning verification`);
    }
    if (["continued", "stale-owner-recovered"].includes(checkpointAttempt.action)) {
      const priorTasks = Object.fromEntries(Object.entries(checkpointAttempt.attempt.results)
        .map(([key, result]) => [key, result.receiptTask]));
      executionPlan = resumeVerificationPlan(plan,
        { version:2, resumeIdentity:checkpointIdentity, tasks:priorTasks }, checkpointIdentity);
      for (const result of Object.values(executionPlan.reusedTasks)) {
        result.provenance = "fresh";
        result.attemptContinuation = true;
      }
      Object.assign(context.receipt.tasks, executionPlan.reusedTasks);
      console.error(`[verify:checkpoint-continue] ${checkpointAttempt.attempt.id} reusing ${
        Object.keys(executionPlan.reusedTasks).length} durable passed task(s)`);
    }
  }
  if (evidenceTask) {
    await checkpointPreflight({
      packs, plan, receiptContext:context, inputFingerprint, evidenceTask, changedSince,
      validationNames:["receipt", "evidence"],
    });
  }
  if (!commandRunner) {
    await context.write();
    console.error(`[verify:receipt] ${path.relative(repositoryRoot, context.receiptPath)}`);
  }
  const baseRunner = commandRunner ?? createVerificationCommandRunner(context, { launchRoutes });
  let activeAttemptTask;
  let checkedAttemptStage;
  const runner = !checkpointAttempt ? baseRunner : async(display, task) => {
    activeAttemptTask = task.key;
    if (checkedAttemptStage !== task.stage) {
      const [currentCommit, currentTree, currentInput, trackedChanges] = await Promise.all([
        gitValue("rev-parse", "HEAD^{commit}"), gitValue("rev-parse", "HEAD^{tree}"),
        createDistInputFingerprint({ root:repositoryRoot }),
        gitValue("status", "--porcelain", "--untracked-files=no"),
      ]);
      if (currentCommit !== candidateCommit || currentTree !== candidateTree ||
          (currentInput.inputDigest ?? currentInput.digest) !== checkpointIdentity.artifactInputDigest ||
          trackedChanges) {
        const identity = verificationTaskIdentity(task);
        const failedBoundary = { kind:"checkpoint-stage-identity", stage:task.stage,
          trackedChanges:trackedChanges.split(/\r?\n/u).filter(Boolean).slice(0, 20) };
        const failureClass = "execution-contract-failure";
        const failureMessage = `Checkpoint identity drift before ${task.stage}`;
        const fingerprint = reliabilityFailureFingerprint({ failureClass, task:identity,
          failedBoundary, error:failureMessage });
        const incident = await createTimeoutIncidentStore().create({
          runnerRunId:context.receipt.runId,
          sourceReceipt:path.relative(repositoryRoot, context.receiptPath),
          lineage:{ commit:candidateCommit, tree:candidateTree }, task:identity,
          failureClass, fingerprint, environment:context.receipt.environment,
          artifact:context.receipt.artifact ?? context.receipt.artifactInput ?? null,
          planDigest:verificationDigest(context.receipt.plan ?? {}), failedBoundary,
          executionPrerequisite:{ operation:{ kind:"checkpoint-stage-identity", stage:task.stage },
            code:"IDENTITY_DRIFT", route:launchRoutes.get(task.key), retryPermitted:false },
        });
        throw new Error(`Checkpoint attempt ${checkpointAttempt.attempt.id} identity drift before ${
          task.stage}; execution-contract incident ${incident.id}`);
      }
      if (buildManifest && task.stage !== "build") {
        const currentArtifact = await validateCurrentArtifactForConsumers({
          root:repositoryRoot, artifactValidator,
        });
        if (verificationDigest(currentArtifact) !== verificationDigest(buildManifest)) {
          throw new Error(`Checkpoint attempt ${checkpointAttempt.attempt.id} artifact identity drift before ${task.stage}`);
        }
      }
      checkedAttemptStage = task.stage;
    }
    await checkpointAttemptStore.assertIdentity(checkpointAttempt.attempt.id, checkpointIdentity);
    const result = await baseRunner(display, task);
    await checkpointAttemptStore.recordTask(checkpointAttempt.attempt.id, task.key, {
      status:"passed", identityDigest:verificationDigest(verificationTaskIdentity(task)),
      receiptTask:structuredClone(context.receipt.tasks[task.key]),
    }, checkpointOwner);
    activeAttemptTask = undefined;
    return result;
  };
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
  try {
    await executeAcceptancePlan(executionPlan, {
      runCommand:runner, concurrency, observationConcurrency,
      afterPreparation:async() => {
      buildManifest = await validateCurrentArtifactForConsumers({
        root:repositoryRoot, artifactValidator,
      });
      context.receipt.artifact = {
        schemaVersion:buildManifest.schemaVersion,
        buildIdentity:buildManifest.buildIdentity,
        inputDigest:buildManifest.inputDigest,
        outputDigest:buildManifest.outputDigest,
        toolchain:{ ...buildManifest.toolchain },
      };
      await context.write();
      if (evidenceTask) {
        context.receipt.resumeIdentity = verificationResumeIdentity(plan, context, buildManifest);
        await context.write();
      }
      },
    });
  } catch (error) {
    if (checkpointAttempt && receivedParentSignal && activeAttemptTask) {
      await checkpointAttemptStore.interrupt(checkpointAttempt.attempt.id,
        activeAttemptTask, checkpointOwner);
    }
    throw error;
  }
  if (checkpointAttempt && !promotionOnly) {
    await checkpointAttemptStore.markTasksComplete(checkpointAttempt.attempt.id, checkpointOwner);
  }
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
    if (checkpointAttempt) {
      await checkpointAttemptStore.markPromotion(checkpointAttempt.attempt.id, "receipt-finalized");
    }
  }
  if (evidenceTask) {
    if (commandRunner) throw new Error("Evidence cannot be prepared with an injected command runner");
    if (timeoutRepairIncident) {
      const packageContext = createVerificationReceiptContext(1, 1);
      packageContext.receipt.candidate = structuredClone(context.receipt.candidate);
      packageContext.receipt.artifact = structuredClone(context.receipt.artifact);
      packageContext.receipt.plan = { mode:"package", checkpointRunId:context.receipt.runId };
      packageContext.receipt.tasks[timeoutRepairPackageTaskIdentity.key] = structuredClone(
        context.receipt.tasks[timeoutRepairPackageTaskIdentity.key]);
      packageContext.receipt.completedAt = new Date().toISOString();
      await packageContext.write();
      await timeoutStore.resolve(timeoutRepairIncident, {
        checkpointReceiptPath:context.receiptPath,
        packageReceiptPath:packageContext.receiptPath,
      });
      await assertNoBlockingTimeoutIncidents("HEAD");
    }
    // A continued attempt can restore hundreds of durable task results into a
    // fresh receipt at once.  Flush that final, completed document again at
    // the promotion boundary so evidence validation never observes an older
    // queued receipt image.
    await context.write();
    const pending = await createPendingVerificationEvidence({
      task:evidenceTask,
      plan,
      receiptPath:context.receiptPath,
      changedSince,
      buildManifest,
      toolchainValidator:async() => {},
    });
    plan.pendingEvidencePath = pending.path;
    if (checkpointAttempt) {
      await checkpointAttemptStore.markPromotion(checkpointAttempt.attempt.id,
        "pending-evidence-created");
    }
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
