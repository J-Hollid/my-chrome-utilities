import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertFreshDist, atomicWriteFile, createDistInputFingerprint } from "./dist-artifact.mjs";
import {
  acquireDistArtifactLock,
  distArtifactLeaseEnvironment,
} from "./dist-artifact-lock.mjs";
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
  timeoutRepairCandidate,
  timeoutRepairDiagnosedBoundary,
  timeoutRepairFocusedExecutionTaskPlan,
  timeoutRepairFocusedTaskPlan,
  timeoutRepairPackageTaskIdentity,
  timeoutRepairPackIds,
} from "./verification-reliability-incidents.mjs";
import {
  classifyExecutionRestriction, consumeVerificationLaunchAuthorization,
  createVerificationLaunchAuthorizations, defaultTaskExecutionPrerequisites,
  expandVerificationTaskPrerequisites,
  preflightExecutionPrerequisites, probeExecutionPrerequisiteEnvironment,
} from "./verification-execution-prerequisites.mjs";
import {
  checkpointAttemptIdentity, checkpointAttemptInputIdentity, createCheckpointAttemptStore,
  defaultCheckpointAttemptDirectory,
} from "./verification-checkpoint-attempt.mjs";
import {
  boundedClosureContractRevision,
  boundedClosureEvidenceTask,
  completeTaskInputClosure,
  inputEquivalentTaskProof,
  reliabilityFailureContract,
  terminalClosureExecution,
} from "./verification-reliability-closure.mjs";
export { verificationPromotionTasks } from "./verification-promotion-plan.mjs";
import { verificationPromotionTasks } from "./verification-promotion-plan.mjs";
import {
  resolveIncidentTaskSuccession, validateUnresolvedIncidentTaskSuccession,
  verificationTaskDigest,
} from "./verification-task-succession.mjs";
import {
  formatReviewReadyScopePreflight,
  reviewReadyProductCandidatePath,
  reviewReadyScopePreflight,
} from "./settled-final-verification-policy.mjs";
import {
  estimatePlanMilliseconds,
  measuredTimingModel,
} from "./report-verification-throughput.mjs";
import {
  bindRunIntentBootstrapPlan,
  buildConfirmedFlakyAdmissions,
  buildEligibleRepairAdmissions,
  bootstrapReviewIncidentProof,
  confirmedFlakyAdmissionCandidates,
  eligibleRepairAdmissionCandidates,
  revalidateConfirmedFlakyAdmissions,
  revalidateEligibleRepairAdmissions,
  requireVerificationRunIntent,
  runIntentBootstrapCoverage,
  validateEligibleRepairAdmissionsReceipt,
  validateConfirmedFlakyAdmissionsReceipt,
  validateRunIntentBootstrapBase,
  verificationRunIntent,
  verificationRunIntents,
} from "./verification-run-intent.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultTimeoutMs = 600_000;
const defaultTerminationGraceMs = 5_000;
const defaultOutputLimitBytes = 16 * 1024 * 1024;
const maximumOutputLimitBytes = 64 * 1024 * 1024;
const require = createRequire(import.meta.url);

async function legacyCheckpointAttemptDirectory(root) {
  const common = await new Promise((resolve, reject) => {
    execFile("git", ["rev-parse", "--git-common-dir"], { cwd:root },
      (error, stdout, stderr) => error
        ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout.trim()));
  });
  return path.join(path.isAbsolute(common) ? common : path.resolve(root, common),
    "swarmforge-checkpoint-attempts");
}

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

function plannedExecutionCapabilities(plan) {
  return [...new Set((plan?.tasks ?? []).flatMap((task) =>
    Array.isArray(task.requiredCapabilities) ? task.requiredCapabilities : []))];
}

async function prepareTaskLaunchAuthorizations(context, tasks, mode, identity = {}) {
  const availableCapabilities = plannedExecutionCapabilities({ tasks });
  const outputLimitBytes = environmentInteger("VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES",
    defaultOutputLimitBytes, { maximum:maximumOutputLimitBytes });
  const environment = await probeExecutionPrerequisiteEnvironment(tasks, {
    outputDirectory:path.dirname(context.receiptPath), outputLimitBytes,
    requestedCapabilities:availableCapabilities, workspaceRoot:repositoryRoot,
  });
  const prerequisitePlan = preflightExecutionPrerequisites(tasks, {
    availableCapabilities,
    approvalRoutes:{ "local-loopback":"scoped-command-approval",
      "git-metadata-write":"scoped-git-metadata-approval" },
  });
  context.receipt.plan ??= {};
  context.receipt.plan.executionPrerequisites = prerequisitePlan.tasks;
  if (!prerequisitePlan.launchable || !environment.launchable) {
    const blocked = [...prerequisitePlan.blocked, ...environment.blocked];
    context.receipt.environmentPrerequisiteBlocked = blocked;
    await context.write();
    throw new Error(`Verification environment prerequisite blocked before task launch: ${
      blocked.map(({ taskKey, capability, prerequisite, route, value }) =>
        `${taskKey}:${capability ?? prerequisite}:${route ?? value}`).join(", ")}`);
  }
  const launchRoutes = new Map(prerequisitePlan.tasks.map(({ key, route }) => [key, route]));
  const authorizationContext = {
    mode, candidate:structuredClone(identity.candidate ?? context.receipt.candidate ?? null),
    runId:context.receipt.runId,
    artifact:structuredClone(identity.artifact ?? context.receipt.artifact ?? null),
    receiptPath:context.receiptPath,
    checkpointAttempt:structuredClone(identity.checkpointAttempt ?? null),
    promotion:structuredClone(identity.promotion ?? null),
  };
  return { launchRoutes, authorizationContext,
    launchAuthorizations:createVerificationLaunchAuthorizations({
      tasks, routes:launchRoutes, ...authorizationContext,
    }) };
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

export function coordinatorArtifactLeaseRequired(artifactRequired, commandRunner) {
  return artifactRequired && !commandRunner;
}

export function reviewReadyScopeGuardRequired(productCandidate, runIntentBootstrap = false) {
  return productCandidate && !runIntentBootstrap;
}

export function bindVerificationChangeScope(executionPlan, bindingPlan) {
  return {
    ...executionPlan,
    changedPaths:bindingPlan.changedPaths,
    changeSet:bindingPlan.changeSet,
    baseCommit:bindingPlan.baseCommit,
    changedOwners:bindingPlan.changedOwners,
    changedBoundaries:bindingPlan.changedBoundaries,
    styleSmokeTargets:bindingPlan.styleSmokeTargets,
    terminalFullObligations:bindingPlan.terminalFullObligations,
    changedStyleTargets:bindingPlan.changedStyleTargets,
    adapterAuthorizationPackIds:bindingPlan.adapterAuthorizationPackIds,
    conservativeHistoricalFallbackReason:bindingPlan.conservativeHistoricalFallbackReason,
  };
}

export function focusedAcceptanceOptions(args) {
  const options = {
    packIds:[], changedPaths:[], terminalFull:false, includeProperties:false,
    withDependencies:false, skipBuild:false, changedSince:undefined, shard:undefined,
    prepareEvidence:undefined, browserTargetIds:[], focusedTaskKeys:[],
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
    if (argument === "--run-intent-bootstrap") {
      once(argument);
      options.runIntentBootstrap = true;
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
    if (argument === "--focused-task") {
      const value = valueArgument(args, index, argument);
      if (!/^[A-Za-z0-9][A-Za-z0-9_:/+.-]{0,511}$/u.test(value)) {
        throw new Error(`Use a canonical registered task key with ${argument}: ${value}`);
      }
      if (options.focusedTaskKeys.includes(value)) {
        throw new Error(`Select every focused task once: ${value}`);
      }
      options.focusedTaskKeys.push(value);
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
  if (options.focusedTaskKeys.length && (options.packIds.length !== 1 || options.changedPaths.length ||
      options.terminalFull || options.includeProperties || options.withDependencies ||
      options.skipBuild || options.shard || options.prepareEvidence || options.resumeReceipt ||
      options.browserTargetIds.length || options.timeoutDiagnosticRetry || options.timeoutRepairIncident ||
      options.timeoutRepairFocused)) {
    throw new Error("Use --focused-task with one owning --pack, optional --changed-since, and no broad or evidence selectors");
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
  if (options.runIntentBootstrap && (!options.prepareEvidence || options.timeoutRepairFocused ||
      options.terminalFull || options.resumeReceipt || options.timeoutRepairIncident)) {
    throw new Error("Run-intent bootstrap requires fresh review evidence authority");
  }
  if (options.resumeReceipt && (!options.packIds.length || !options.changedSince ||
      !options.includeProperties || !options.prepareEvidence)) {
    throw new Error("Resume requires an exact evidence checkpoint with packs, property, and changed-since selectors");
  }
  if (options.timeoutDiagnosticRetry && (options.packIds.length || options.changedPaths.length ||
      options.changedSince || options.terminalFull || options.includeProperties || options.withDependencies ||
      options.skipBuild || options.shard || options.prepareEvidence || options.resumeReceipt ||
      options.browserTargetIds.length || options.timeoutRepairIncident)) {
    throw new Error("Use --reliability-diagnostic-retry as an isolated runner-owned mode");
  }
  if (options.timeoutRepairIncident && (!options.prepareEvidence || options.resumeReceipt)) {
    throw new Error("Use --reliability-repair-incident only with a fresh exact evidence checkpoint");
  }
  if (options.timeoutRepairFocused) {
    if (!options.timeoutRegression || !options.timeoutCausalCategory || !options.timeoutCausalExplanation ||
        !options.changedSince || !options.prepareEvidence) {
      throw new Error("Repair-focused mode requires regression, causal category/explanation, changed-since, and evidence task");
    }
    if (options.packIds.length || options.changedPaths.length || options.terminalFull || options.includeProperties ||
        options.withDependencies || options.skipBuild || options.shard || options.resumeReceipt ||
        options.browserTargetIds.length || options.timeoutDiagnosticRetry || options.timeoutRepairIncident) {
      throw new Error("Use --reliability-repair-focused as an isolated runner-owned mode");
    }
  } else if (options.timeoutRegression || options.timeoutCausalCategory || options.timeoutCausalExplanation) {
    throw new Error("Reliability regression and causal fields require --reliability-repair-focused");
  }
  return options;
}

export function compatibleTimeoutRepairIncidentIds({ requestedId, blocking, candidateCommit,
  candidateTree, baseCommit, evidenceTask, requestedPackIds }) {
  if (!blocking.some(({ id }) => id === requestedId)) {
    throw new Error("Repair checkpoint requires an applicable reliability incident");
  }
  if (JSON.stringify([...requestedPackIds].sort()) !== JSON.stringify(timeoutRepairPackIds)) {
    throw new Error("Repair checkpoint requires the eligible repair candidate and exact all-20 plan");
  }
  const boundedClosureCheckpoint = baseCommit === boundedClosureContractRevision &&
    evidenceTask === boundedClosureEvidenceTask;
  const incompatible = blocking.find((incident) => {
    const confirmedFlaky = incident.terminalVerificationDeferred?.basis === "confirmed-flaky";
    const repairCandidate = confirmedFlaky
      ? incident.terminalVerificationDeferred.candidate : timeoutRepairCandidate(incident);
    const binding = confirmedFlaky ? {
      baseCommit:incident.terminalVerificationDeferred.reviewReady.baseCommit,
      evidenceTask:incident.terminalVerificationDeferred.reviewReady.task,
    } : incident.repair?.checkpoint;
    return !(incident.repair?.status === "eligible" || confirmedFlaky) ||
    repairCandidate?.commit !== candidateCommit ||
    repairCandidate?.tree !== candidateTree ||
    (!boundedClosureCheckpoint && (binding?.baseCommit !== baseCommit ||
      binding?.evidenceTask !== evidenceTask)) ||
    (boundedClosureCheckpoint && !["blocking-product-repair", "blocking-verification-repair"]
      .includes(incident.closureAudit?.kind));
  });
  if (incompatible) {
    throw new Error(`Repair checkpoint is blocked by incompatible reliability incident ${incompatible.id}`);
  }
  return blocking.map(({ id }) => id).sort();
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
    runIntent = verificationRunIntents.development,
  } = {},
) {
  if (!["normal", "loaded"].includes(executionLoad)) {
    throw new Error("VERIFICATION_EXECUTION_LOAD must be normal or loaded");
  }
  const receiptPath = path.join(receiptDirectory, `${process.pid}-${randomUUID()}.json`);
  const receipt = {
    version:2,
    runIntent,
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
  requireVerificationRunIntent(receipt);
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
  const capabilityApprovedPlan = [...(options.launchRoutes?.values() ?? [])]
    .some((route) => route !== "workspace-sandbox");
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
        "MY_CHROME_UTILITIES_DIST_LOCK_ACCESS",
        "SWARMFORGE_VERIFICATION_RECEIPT", "SWARMFORGE_STRICT_VERIFICATION_RECEIPT",
        "TMPDIR"].includes(name) ||
      name.startsWith("SWARMFORGE_") && ![
        "SWARMFORGE_BUILD_PREPARED", "SWARMFORGE_PACK_RUNNER_OWNS_JS",
      ].includes(name));
    if (reservedEnvironment) throw new Error(`Verification task cannot override reserved environment: ${reservedEnvironment}`);
    const identity = verificationTaskIdentity(task);
    const launchRoute = options.launchRoutes?.get(task.key);
    consumeVerificationLaunchAuthorization(options.launchAuthorizations, task, {
      ...options.authorizationContext,
      route:launchRoute,
      completedPredecessorKeys:Object.entries(context.receipt.tasks)
        .filter(([, result]) => result?.status === "passed")
        .map(([key]) => key),
    });
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
    const workspaceTempDirectory = path.join(context.runDirectory, "system-temp");
    const chromeTempDirectory = path.join("/tmp", "sf-chrome", context.receipt.runId.slice(0, 8));
    const usesShortChromeRoute = task.temporaryPathClass === "chrome-short" ||
      ["browser", "browser-observation"].includes(task.stage);
    const taskTempDirectory = usesShortChromeRoute && task.stage !== "acceptance-session"
      ? chromeTempDirectory : workspaceTempDirectory;
    await mkdir(taskTempDirectory, { recursive:true });
    if (usesShortChromeRoute) await mkdir(chromeTempDirectory, { recursive:true });
    const isolateChild = capabilityApprovedPlan;
    const shareLoopback = launchRoute === "scoped-command-approval";
    const launch = isolateChild ? {
      executable:"bwrap",
      args:["--ro-bind", "/", "/", "--bind", repositoryRoot, repositoryRoot,
        "--bind", "/tmp", "/tmp", "--dev-bind", "/dev", "/dev", "--proc", "/proc",
        ...(shareLoopback ? [] : ["--unshare-net"]), executable, ...executionArgs],
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
        TMPDIR:taskTempDirectory,
        ...(usesShortChromeRoute ? { SWARMFORGE_CHROME_TMPDIR:chromeTempDirectory } : {}),
        ...(task.artifactLease
          ? distArtifactLeaseEnvironment(task.artifactLease.token, task.artifactLease.access)
          : process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD === undefined
            ? {}
            : {
              MY_CHROME_UTILITIES_DIST_LOCK_HELD:process.env.MY_CHROME_UTILITIES_DIST_LOCK_HELD,
              MY_CHROME_UTILITIES_DIST_LOCK_ACCESS:
                process.env.MY_CHROME_UTILITIES_DIST_LOCK_ACCESS ?? "write",
            }),
        SWARMFORGE_VERIFICATION_RECEIPT:context.receiptPath,
        SWARMFORGE_VERIFICATION_TASK_KEY:task.key,
        SWARMFORGE_EXECUTION_ROUTE:launchRoute,
        SWARMFORGE_EXECUTION_BOUNDARY:isolateChild
          ? shareLoopback ? "bwrap-shared-loopback" : "bwrap-unshared-network"
          : "workspace-sandbox",
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
    const executionLogicalTargetIds = task.executionLogicalTargetIds ?? task.logicalTargetIds;
    const streamedLogicalResults = Object.fromEntries((executionLogicalTargetIds ?? [])
      .map((id) => [id, {}]));
    const persistedLogicalTargets = new Set();
    let logicalPersistence = Promise.resolve();
    let logicalPersistenceError;
    const captureLogicalRecord = (line) => {
      if (!executionLogicalTargetIds?.length) return;
      let record;
      try { record = JSON.parse(line); }
      catch { return; }
      const resultRecord = record.swarmforgeBrowserTargetResult;
      const timingRecord = record.swarmforgeBrowserTargetTiming;
      if (resultRecord && Object.hasOwn(streamedLogicalResults, resultRecord.id)) {
        Object.assign(streamedLogicalResults[resultRecord.id], resultRecord);
      }
      if (timingRecord && Object.hasOwn(streamedLogicalResults, timingRecord.id)) {
        streamedLogicalResults[timingRecord.id].durationMs = timingRecord.durationMs;
      }
      for (const [id, result] of Object.entries(streamedLogicalResults)) {
        if (persistedLogicalTargets.has(id) || result.id !== id || result.status !== "passed" ||
            !Number.isFinite(result.durationMs)) continue;
        persistedLogicalTargets.add(id);
        if (options.onLogicalTargetResult) {
          const receiptTask = { identity, status:"interrupted", provenance:"fresh", durationMs:result.durationMs,
            output:"", stderr:"", logicalResults:{ [id]:structuredClone(result) } };
          logicalPersistence = logicalPersistence.then(() =>
            options.onLogicalTargetResult(task, receiptTask)).catch((error) => {
            logicalPersistenceError = error;
            requestTermination(`Cannot persist logical target ${id}: ${error.message}`);
          });
        }
      }
    };
    let progressBuffer = "";
    const captureProgress = (chunk) => {
      progressBuffer += chunk.toString();
      const lines = progressBuffer.split(/\r?\n/u);
      progressBuffer = lines.pop() ?? "";
      for (const line of lines) {
        progress.acceptLine(line);
        captureLogicalRecord(line);
      }
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
    await logicalPersistence;
    untrackChild();
    clearTimeout(timeout);
    clearTimeout(killTimer);
    const freshDurationMs = Date.now() - started;
    if (progressBuffer) {
      progress.acceptLine(progressBuffer);
      captureLogicalRecord(progressBuffer);
      await logicalPersistence;
    }
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
    const freshLogicalResults = executionLogicalTargetIds?.length
      ? parseLogicalResults(freshOut, executionLogicalTargetIds)
      : undefined;
    const logicalResults = freshLogicalResults
      ? { ...(priorTask?.logicalResults ?? {}), ...freshLogicalResults }
      : undefined;
    const logicalPassed = !logicalResults || Object.values(logicalResults)
      .every(({ status, durationMs }) => status === "passed" && Number.isFinite(durationMs));
    const passed = !logicalPersistenceError && !termination && !result.spawnError &&
      result.code === 0 && logicalPassed;
    const failure = logicalPersistenceError?.message ?? termination ?? result.spawnError?.message ??
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
    await options.onTaskResult?.(task, receiptTask);
    if (!passed && !receivedParentSignal) {
      const failedLogicalResult = Object.entries(logicalResults ?? {})
        .find(([, logicalResult]) => logicalResult.status !== "passed");
      const failedBoundary = failedLogicalResult ? {
        boundary:"target",
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
      } else if (context.receipt.runIntent !== verificationRunIntents.development) {
        const store = options.incidentStore ?? createTimeoutIncidentStore();
        const closureContract = reliabilityFailureContract({
          task:{ ...identity, ...(task.reliabilityBoundaries
            ? { reliabilityBoundaries:structuredClone(task.reliabilityBoundaries) } : {}) },
          failureClass, failedBoundary, lastProgress:progress.snapshot(),
          stderr:freshErr, error:failure,
          resultDigestInputs:{
            commit:context.receipt.candidate?.commit,
            tree:context.receipt.candidate?.tree,
            outputSha256:verificationDigest(freshOut),
            stderrSha256:verificationDigest(freshErr),
            exitCode:result.code,
            signal:result.signal,
          },
        });
        const incidentFailure = {
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
        registryDigest:context.receipt.registryDigest,
        outputSha256:verificationDigest(freshOut),
        stderrSha256:verificationDigest(freshErr),
        failedBoundary,
        lastProgress:progress.snapshot(),
        progressDiagnostics:progress.diagnostics(),
        ...closureContract,
        ...(restriction ? { executionPrerequisite:restriction } : {}),
        };
        const governedRepairIncidentId = context.receipt.runIntent === verificationRunIntents.repair &&
          context.receipt.plan?.mode === "timeout-repair-focused"
          ? context.receipt.plan.incidentId : null;
        const incident = governedRepairIncidentId
          ? await store.recordRepairAttemptFailure(governedRepairIncidentId, {
            failure:incidentFailure, plan:context.receipt.plan,
            sourceReceipt:path.relative(repositoryRoot, context.receiptPath),
            runId:context.receipt.runId,
          })
          : await store.create(incidentFailure);
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
  registryIdentity = async() => verificationDigest(await loadVerificationPacks()),
} = {}) {
  const incident = await store.read(id);
  if (!incident.failure.retryScope) throw new Error(`Reliability incident ${id} has no trusted retry scope`);
  const [candidate, artifact, deadlines, registryDigest] = await Promise.all([
    candidateIdentity(), artifactIdentity(), deadlineIdentity(incident), registryIdentity(incident),
  ]);
  if (candidate.commit !== incident.failure.lineage.commit || candidate.tree !== incident.failure.lineage.tree ||
      verificationDigest(artifact) !== verificationDigest(incident.failure.artifact)) {
    throw new Error(`Reliability incident ${id} diagnostic candidate or artifact identity changed`);
  }
  if (verificationDigest(deadlines) !== verificationDigest(incident.failure.resolvedDeadlines)) {
    throw new Error(`Reliability incident ${id} diagnostic deadline identity changed`);
  }
  if (registryDigest !== incident.failure.registryDigest) {
    throw new Error(`Reliability incident ${id} diagnostic registry identity changed`);
  }
  const concurrency = incident.failure.environment.concurrency;
  const observationConcurrency = incident.failure.environment.observationConcurrency;
  const context = createVerificationReceiptContext(concurrency, observationConcurrency, {
    runIntent:verificationRunIntents.repair,
  });
  context.receipt.candidate = { ...structuredClone(incident.failure.lineage), ...candidate };
  context.receipt.artifact = structuredClone(artifact);
  context.receipt.registryDigest = registryDigest;
  context.receipt.plan = { mode:"timeout-diagnostic", requestedPackIds:[incident.failure.task.packId],
    selectedPackIds:[incident.failure.task.packId] };
  context.receipt.diagnostic = { incidentId:id, retryIdentity:incident.failure.retryIdentity,
    registryDigest, scope:structuredClone(incident.failure.retryScope),
    resolvedDeadlines:structuredClone(deadlines) };
  if (JSON.stringify(context.receipt.environment) !== JSON.stringify(incident.failure.environment)) {
    throw new Error(`Reliability incident ${id} diagnostic environment identity changed`);
  }
  const task = { ...structuredClone(incident.failure.task),
    requiredCapabilities:[...(incident.failure.task.requiredCapabilities ??
      defaultTaskExecutionPrerequisites(incident.failure.task.stage))],
    executionArgs:[...incident.failure.retryScope.executionArgs],
    executionLogicalTargetIds:incident.failure.retryScope.logicalTargetIds ?? [] };
  const launch = await prepareTaskLaunchAuthorizations(context, [task], "timeout-diagnostic", {
    candidate:context.receipt.candidate, artifact:context.receipt.artifact,
  });
  await store.claimDiagnosticRetry(id, incident.failure.retryIdentity);
  await context.write();
  const runner = createVerificationCommandRunner(context, { ...launch, diagnosticIncidentId:id,
    timeoutMs:incident.failure.configuredTimeoutMs, strictAcceptanceReceipt:false });
  try { await runner(`diagnostic retry ${id}`, task); }
  catch { /* the persisted runner receipt is the classification authority */ }
  context.receipt.completedAt = new Date().toISOString();
  await context.write();
  const classified = await store.classifyDiagnosticRetry(id, context.receiptPath);
  console.error(`[verify:reliability-diagnostic] ${id} ${classified.retry.classification}`);
  return { incident:classified, receiptPath:context.receiptPath };
}

export async function executeTimeoutRepairTaskPlan(executionTaskPlan, {
  registeredRuntimeTasks = new Map(), runner, regressionContext,
}) {
  for (const descriptor of executionTaskPlan) {
    const registeredTask = registeredRuntimeTasks.get(descriptor.identity.key);
    const task = { ...structuredClone(descriptor.identity),
      ...(registeredTask?.temporaryPathClass
        ? { temporaryPathClass:registeredTask.temporaryPathClass } : {}),
      ...(descriptor.executionArgs ? { executionArgs:[...descriptor.executionArgs] } : {}),
      ...(descriptor.executionLogicalTargetIds
        ? { executionLogicalTargetIds:[...descriptor.executionLogicalTargetIds] } : {}),
      ...(descriptor.roles.includes("causal-regression") ? { executionEnvironment:{
        SWARMFORGE_TIMEOUT_REPAIR_REGRESSION:JSON.stringify(regressionContext),
      } } : {}),
    };
    await runner(`reliability repair ${descriptor.roles.join("+")} ${task.key}`, task);
  }
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
  incidentChangedPathsLoader = (failedCommit) => new Promise((resolve, reject) =>
    execFile("git", ["diff", "--name-only", `${failedCommit}..HEAD`], { cwd:repositoryRoot },
      (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
        : resolve(stdout.split(/\r?\n/u).filter(Boolean)))),
  verificationPacksLoader = loadVerificationPacks,
  verificationPacksValidator = validateVerificationPacks,
  receiptContextFactory = createVerificationReceiptContext,
  commandRunnerFactory = createVerificationCommandRunner,
} = {}) {
  timeoutRepairCausalCategory(causalCategory);
  if (typeof causalExplanation !== "string" || causalExplanation !== causalExplanation.trim() ||
      causalExplanation.length < 1 || causalExplanation.length > 500 ||
      /[\u0000-\u001f\u007f]/u.test(causalExplanation)) {
    throw new Error("Reliability repair requires a bounded one-line causal explanation");
  }
  if (typeof regressionKey !== "string" || !regressionKey || !baseCommit || !evidenceTask) {
    throw new Error("Reliability repair requires regression, approved base, and evidence task");
  }
  await strictToolchainValidator();
  await candidateCleanValidator();
  const incident = await store.read(id);
  const [candidate, artifact, changeSet, packs, incidentChangedPaths] = await Promise.all([
    candidateIdentity(), artifactIdentity(),
    changeSetLoader(baseCommit), verificationPacksLoader(),
    incidentChangedPathsLoader(incident.failure.lineage.commit),
  ]);
  await verificationPacksValidator(packs);
  const plan = canonicalPlan ?? planVerification(packs, {
    packIds:timeoutRepairPackIds, includeProperties:true,
  });
  const canonicalIdentities = plan.tasks.map(verificationTaskIdentity);
  const unresolvedIncidents = await store.blocking({ commit:candidate.commit });
  await validateUnresolvedIncidentTaskSuccession({ incidents:unresolvedIncidents,
    currentIdentities:canonicalIdentities, currentPacks:packs });
  const internalExecutionContract = incident.failure.failureClass === "execution-contract-failure" &&
    incident.failure.task.stage === "promotion";
  const taskSuccession = internalExecutionContract || canonicalIdentities.some((identity) =>
    verificationTaskDigest(identity) === verificationTaskDigest(incident.failure.task))
    ? undefined : await resolveIncidentTaskSuccession({ incident,
      currentIdentities:canonicalIdentities, currentPacks:packs });
  const registeredRuntimeTasks = new Map(plan.tasks.map((task) => [task.key, task]));
  const taskPlan = timeoutRepairFocusedTaskPlan(incident, incidentChangedPaths, regressionKey,
    canonicalIdentities, taskSuccession);
  const executionTaskPlan = timeoutRepairFocusedExecutionTaskPlan(taskPlan, canonicalIdentities);
  const context = receiptContextFactory(incident.failure.environment.concurrency,
    incident.failure.environment.observationConcurrency, {
      runIntent:verificationRunIntents.repair,
    });
  context.receipt.candidate = { role:process.env.SWARMFORGE_ROLE ?? null, branch:candidate.branch ?? null,
    commit:candidate.commit, tree:candidate.tree, baseCommit:changeSet.baseCommit, evidenceTask,
    changeSetDigest:verificationDigest(changeSet) };
  context.receipt.artifact = structuredClone(artifact);
  context.receipt.plan = { mode:"timeout-repair-focused", incidentId:id, causalCategory,
    causalExplanation, ...(taskSuccession ? { taskSuccession } : {}), taskPlan, executionTaskPlan };
  const runtimeExecutionTasks = executionTaskPlan.map((descriptor) => ({
    ...structuredClone(descriptor.identity),
    ...(registeredRuntimeTasks.get(descriptor.identity.key)?.temporaryPathClass
      ? { temporaryPathClass:registeredRuntimeTasks.get(descriptor.identity.key).temporaryPathClass } : {}),
  }));
  const launch = await prepareTaskLaunchAuthorizations(context, runtimeExecutionTasks,
    "timeout-repair-focused", { candidate:context.receipt.candidate,
      artifact:context.receipt.artifact });
  await context.write();
  console.error(`[verify:receipt] ${path.relative(repositoryRoot, context.receiptPath)}`);
  const regressionContext = { version:1, incidentId:id, failureDigest:incident.failureDigest,
    diagnosedBoundary:timeoutRepairDiagnosedBoundary(incident), causalCategory, causalExplanation };
  const runner = commandRunnerFactory(context, { ...launch, strictAcceptanceReceipt:false,
    incidentStore:store });
  await executeTimeoutRepairTaskPlan(executionTaskPlan,
    { registeredRuntimeTasks, runner, regressionContext });
  context.receipt.completedAt = new Date().toISOString();
  await context.write();
  const repaired = await store.proposeRepair(id, { causalCategory, causalExplanation, regressionKey,
    regressionReceiptPath:context.receiptPath, focusedReceiptPath:context.receiptPath,
    allowEligibleRevalidation:Boolean(await bootstrapReviewIncidentProof({
      root:repositoryRoot, incident, evidenceTask,
    })) });
  console.error(`[verify:reliability-repair-focused] ${id} ${repaired.repair.status}`);
  return { incident:repaired, receiptPath:context.receiptPath, taskPlan, executionTaskPlan };
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
          executionLogicalTargetIds:remaining,
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

export function terminalTaskInputClosure({ task, candidate, artifact, environment,
  planDigest, registryDigest, prerequisitePlan, limits } = {}) {
  const repositoryTree = candidate?.tree;
  if (typeof repositoryTree !== "string" || !repositoryTree) {
    throw new Error("Terminal task input closure requires the candidate tree");
  }
  const completeRepositoryInput = (kind) => ({ complete:true,
    digest:verificationDigest({ kind, repositoryTree }) });
  return completeTaskInputClosure({
    contractRevision:boundedClosureContractRevision,
    task:{ identity:verificationTaskIdentity(task), configuration:{ planDigest, registryDigest } },
    transitiveCode:completeRepositoryInput("transitive-task-code-and-imports"),
    featureInputs:completeRepositoryInput("feature-inputs"),
    handlerInputs:completeRepositoryInput("acceptance-handler-inputs"),
    generatedInputs:completeRepositoryInput("generated-inputs"),
    productArtifact:verificationArtifactIdentity(artifact),
    runnerSemantics:{ digest:verificationDigest({ repositoryTree, planDigest }) },
    prerequisiteSemantics:{ digest:verificationDigest({ repositoryTree, prerequisitePlan }) },
    environment:structuredClone(environment),
    toolchain:{ node:environment?.node, typescript:environment?.typescript },
    limits:structuredClone(limits),
  });
}

export function enforceTerminalClosureReceipt({ attempt, runnablePackCount, tasks,
  currentInputs, packageTaskKey } = {}) {
  const policy = terminalClosureExecution({ attempt, runnablePackCount });
  if (!tasks || Array.isArray(tasks) || !currentInputs || Array.isArray(currentInputs)) {
    throw new Error("Terminal closure requires receipt tasks and complete current inputs");
  }
  for (const [key, result] of Object.entries(tasks)) {
    completeTaskInputClosure(currentInputs[key]);
    if (result?.status !== "passed") {
      throw new Error(`Terminal closure task ${key} is not passed`);
    }
    if (key === packageTaskKey) {
      if (result.provenance !== "fresh") {
        throw new Error("Terminal closure package task must be fresh");
      }
      continue;
    }
    if (result.provenance === "fresh") continue;
    if (policy.taskPolicy === "fresh-all") {
      throw new Error(`Initial terminal closure task ${key} must be fresh`);
    }
    if (result.provenance !== "input-equivalent") {
      throw new Error(`Terminal closure task ${key} has unsupported provenance ${result.provenance}`);
    }
    const proof = inputEquivalentTaskProof({
      priorResult:result.inputEquivalentProof?.priorResult,
      priorInput:result.inputEquivalentProof?.priorInput,
      currentInput:currentInputs[key],
    });
    if (proof.action !== "input-equivalent") {
      throw new Error(`Terminal closure task ${key} rejected ${proof.reason.replaceAll("-", " ")}: ${
        proof.diagnostic ?? "proof is not identical"}`);
    }
  }
  return policy;
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

export function createCheckpointIdentityGuard({
  expected, snapshot, createIncident, attemptId, routeFor = () => undefined,
}) {
  if (!expected || typeof snapshot !== "function" || typeof createIncident !== "function") {
    throw new Error("Checkpoint identity guard requires expected identity, snapshot, and incident writer");
  }
  return {
    async assertBefore(boundary) {
      let current;
      try { current = await snapshot(); }
      catch (error) { current = { snapshotError:error.message }; }
      const drift = current.snapshotError || current.commit !== expected.commit || current.tree !== expected.tree ||
        current.artifactInputDigest !== expected.artifactInputDigest ||
        current.artifactOutputDigest !== expected.artifactOutputDigest ||
        current.artifactBuildIdentity !== expected.artifactBuildIdentity || current.trackedChanges;
      if (!drift) return current;
      const task = boundary?.key ? verificationTaskIdentity(boundary) : {
        key:`promotion:${boundary?.kind ?? "unknown"}`, stage:"promotion", packId:null,
        executable:"internal", args:[], target:boundary?.kind ?? "unknown",
        environment:null, requiredCapabilities:[],
      };
      const failedBoundary = { kind:"checkpoint-identity", operation:boundary?.kind ?? "task",
        stage:boundary?.stage ?? null,
        ...(current.snapshotError ? { snapshotError:current.snapshotError } : {}),
        trackedChanges:String(current.trackedChanges ?? "").split(/\r?\n/u).filter(Boolean).slice(0, 20),
      };
      const incident = await createIncident({ task, failureClass:"execution-contract-failure",
        failedBoundary, executionPrerequisite:{ operation:failedBoundary,
          code:"IDENTITY_DRIFT", route:routeFor(boundary), retryPermitted:false }, current, expected });
      throw new Error(`Checkpoint attempt ${attemptId} identity drift before ${
        boundary?.key ?? boundary?.kind}; execution-contract incident ${incident.id}`);
    },
  };
}

function planPackageTask(plan) {
  const task = { ...structuredClone(timeoutRepairPackageTaskIdentity), requiredCapabilities:[] };
  task.display = [task.executable, ...task.args].join(" ");
  return { ...plan, tasks:[...plan.tasks, task], packageTasks:[task],
    packageCommands:[task.display], commands:[...plan.commands, task.display],
    stages:{ ...plan.stages, package:[] } };
}

const focusedTaskGroups = [
  "preparationTasks", "unitTasks", "propertyTasks", "browserTasks", "observationTasks",
  "parserTasks", "generatorTasks", "checkpointTasks", "sessionTasks", "packageTasks",
];

export function selectFocusedVerificationTasks(plan, requestedKeys, canonicalPlan = plan) {
  if (!Array.isArray(requestedKeys) || !requestedKeys.length ||
      new Set(requestedKeys).size !== requestedKeys.length) {
    throw new Error("Focused verification requires unique canonical task keys");
  }
  const withPackage = requestedKeys.includes(timeoutRepairPackageTaskIdentity.key)
    ? planPackageTask(canonicalPlan) : canonicalPlan;
  const candidates = new Map(withPackage.tasks.map((task) => [task.key, task]));
  for (const key of requestedKeys) {
    if (!candidates.has(key)) throw new Error(`Focused verification task is not registered by the selected pack: ${key}`);
  }
  const closedTasks = expandVerificationTaskPrerequisites(
    requestedKeys.map((key) => candidates.get(key)), withPackage.tasks,
    { mode:"ordinary-focused" });
  const selected = new Set(closedTasks.map(({ key }) => key));
  const groups = Object.fromEntries(focusedTaskGroups.map((group) => [group,
    (withPackage[group] ?? []).filter(({ key }) => selected.has(key))]));
  const tasks = withPackage.tasks.filter(({ key }) => selected.has(key));
  if (tasks.length !== selected.size) {
    throw new Error("Focused verification dependencies are not registered by the selected pack");
  }
  const commandsFor = (group) => groups[group].map(({ display }) => display);
  return {
    ...plan,
    ...groups,
    mode:"focused-task",
    tasks,
    preparationCommands:commandsFor("preparationTasks"),
    unitCommands:commandsFor("unitTasks"),
    propertyCommands:commandsFor("propertyTasks"),
    browserCommands:commandsFor("browserTasks"),
    observationCommands:commandsFor("observationTasks"),
    parserCommands:commandsFor("parserTasks"),
    generatorCommands:commandsFor("generatorTasks"),
    checkpointCommands:commandsFor("checkpointTasks"),
    sessionCommands:commandsFor("sessionTasks"),
    packageCommands:commandsFor("packageTasks"),
    acceptanceCommands:[...commandsFor("parserTasks"), ...commandsFor("generatorTasks"),
      ...commandsFor("sessionTasks")],
    commands:tasks.map(({ display }) => display),
    includeProperties:tasks.some(({ stage }) => stage === "property"),
    focusedTaskKeys:[...requestedKeys],
  };
}

export function closeVerificationPlanPrerequisites(plan, canonicalPlan = plan) {
  const closedTasks = expandVerificationTaskPrerequisites(plan.tasks, canonicalPlan.tasks,
    { mode:plan.mode });
  const taskGroups = new Map();
  for (const source of [canonicalPlan, plan]) {
    for (const group of focusedTaskGroups) {
      for (const task of source[group] ?? []) {
        const existing = taskGroups.get(task.key);
        if (existing && existing !== group) {
          throw new Error(`Verification task has ambiguous execution groups: ${task.key}`);
        }
        taskGroups.set(task.key, group);
      }
    }
  }
  const groups = Object.fromEntries(focusedTaskGroups.map((group) => [group,
    closedTasks.filter(({ key }) => taskGroups.get(key) === group)]));
  const grouped = new Set(Object.values(groups).flat().map(({ key }) => key));
  if (grouped.size !== closedTasks.length) {
    throw new Error("Verification plan prerequisites are not registered by a canonical or requested execution group");
  }
  const tasks = focusedTaskGroups.flatMap((group) => groups[group]);
  const commandsFor = (group) => groups[group].map(({ display }) => display);
  return { ...plan, ...groups, tasks,
    preparationCommands:commandsFor("preparationTasks"),
    unitCommands:commandsFor("unitTasks"),
    propertyCommands:commandsFor("propertyTasks"),
    browserCommands:commandsFor("browserTasks"),
    observationCommands:commandsFor("observationTasks"),
    parserCommands:commandsFor("parserTasks"),
    generatorCommands:commandsFor("generatorTasks"),
    checkpointCommands:commandsFor("checkpointTasks"),
    sessionCommands:commandsFor("sessionTasks"),
    packageCommands:commandsFor("packageTasks"),
    acceptanceCommands:[...commandsFor("parserTasks"), ...commandsFor("generatorTasks"),
      ...commandsFor("sessionTasks")],
    commands:tasks.map(({ display }) => display),
  };
}

export function createRepositoryCheckpointIdentityGuard({
  repositoryRoot:root = repositoryRoot, expected, context, attemptId, launchRoutes = new Map(),
  inputFingerprintOptions = {}, artifactValidator = ({ root:artifactRoot }) =>
    assertFreshDist({ root:artifactRoot }),
}) {
  const gitValue = (...arguments_) => new Promise((resolve, reject) => {
    execFile("git", arguments_, { cwd:root }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout.trim()));
  });
  return createCheckpointIdentityGuard({ expected,
    snapshot:async() => {
      const [commit, tree, input, trackedChanges, artifact] = await Promise.all([
        gitValue("rev-parse", "HEAD^{commit}"), gitValue("rev-parse", "HEAD^{tree}"),
        createDistInputFingerprint({ root, ...inputFingerprintOptions }),
        gitValue("status", "--porcelain", "--untracked-files=no"),
        expected.artifactOutputDigest === null ? null : artifactValidator({ root }),
      ]);
      return { commit, tree, artifactInputDigest:input.inputDigest ?? input.digest,
        artifactOutputDigest:artifact?.outputDigest ?? null,
        artifactBuildIdentity:artifact?.buildIdentity ?? null,
        trackedChanges };
    },
    createIncident:async(failure) => createTimeoutIncidentStore({ root }).create({
      runnerRunId:context.receipt.runId,
      sourceReceipt:path.relative(root, context.receiptPath),
      lineage:{ commit:expected.commit, tree:expected.tree },
      failureClass:failure.failureClass, task:failure.task,
      fingerprint:reliabilityFailureFingerprint({ failureClass:failure.failureClass,
        task:failure.task, failedBoundary:failure.failedBoundary, error:"Checkpoint identity drift" }),
      environment:context.receipt.environment,
      artifact:context.receipt.artifact ?? context.receipt.artifactInput ?? null,
      planDigest:verificationDigest(context.receipt.plan ?? {}),
      failedBoundary:failure.failedBoundary,
      executionPrerequisite:failure.executionPrerequisite,
    }),
    attemptId,
    routeFor:(boundary) => boundary?.key ? launchRoutes.get(boundary.key) : "promotion-boundary",
  });
}

export function applyCheckpointPrerequisitePlan(receipt, verificationTasks, prerequisitePlan) {
  const verificationKeys = new Set(verificationTasks.map(({ key }) => key));
  receipt.plan ??= {};
  receipt.plan.executionPrerequisites = prerequisitePlan.tasks
    .filter(({ key }) => verificationKeys.has(key));
  receipt.plan.promotionExecutionPrerequisites = prerequisitePlan.tasks
    .filter(({ key }) => !verificationKeys.has(key));
}

export async function prepareCheckpointExecution({
  packs,
  plan,
  receiptContext,
  inputFingerprint,
  evidenceTask,
  changedSince,
  promotionTasks = [],
  probeEnvironment = true,
  preflight = checkpointPreflight,
}) {
  await preflight({
    packs, plan, receiptContext, inputFingerprint, evidenceTask, changedSince,
    probeEnvironment,
    validationNames:evidenceTask
      ? ["registry", "plan", "artifact"]
      : ["registry", "plan", "receipt", "artifact", "evidence"],
  });
  const prerequisitePlan = await preflight({
    packs, plan:{ ...plan, tasks:[...plan.tasks, ...promotionTasks] }, receiptContext,
    inputFingerprint, evidenceTask, changedSince, probeEnvironment, validationNames:["prerequisites"],
  });
  applyCheckpointPrerequisitePlan(receiptContext.receipt, plan.tasks, prerequisitePlan);
  if (evidenceTask) await preflight({
    packs, plan, receiptContext, inputFingerprint, evidenceTask, changedSince,
    probeEnvironment,
    validationNames:["receipt", "evidence"],
  });
  return prerequisitePlan;
}

export async function checkpointPreflight({
  packs,
  plan,
  receiptContext,
  inputFingerprint,
  evidenceTask,
  changedSince,
  availableCapabilities = plannedExecutionCapabilities(plan),
  probeEnvironment = true,
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
      const artifactRequired = plan.tasks.some(({ stage }) =>
        ["build", "browser", "browser-observation", "checkpoint", "acceptance-session", "package"]
          .includes(stage));
      if (artifactRequired && !plan.skipBuild && buildTasks.length !== 1) {
        throw new Error("Checkpoint preflight requires exactly one artifact build task");
      }
      if (!artifactRequired && buildTasks.length) {
        throw new Error("Workspace-only focused verification cannot include an unrelated artifact build");
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
      const environment = probeEnvironment
        ? await probeExecutionPrerequisiteEnvironment(plan.tasks, {
          outputDirectory:path.dirname(receiptContext.receiptPath), outputLimitBytes,
          requestedCapabilities:availableCapabilities, workspaceRoot:root,
        })
        : { launchable:true, blocked:[], probes:[] };
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
  const reviewPreflightStartedAt = Date.now();
  const packs = await loadVerificationPacks();
  const options = focusedAcceptanceOptions(args);
  const runIntent = verificationRunIntent({ ...options, boundedClosureEvidenceTask });
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
  const boundedTerminalAttempt = evidenceTask === boundedClosureEvidenceTask
    ? (resumeReceiptPath ? "verifier-descendant" : "initial") : undefined;
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
  delete options.timeoutDiagnosticRetry;
  delete options.timeoutRepairIncident;
  await validateVerificationPacks(packs);
  let plan;
  let bindingPlan;
  if (changedSince && options.packIds.length) {
    bindingPlan = planVerification(packs, { ...options, packIds:[] });
    const productCandidate = bindingPlan.changedPaths.some(reviewReadyProductCandidatePath);
    if (reviewReadyScopeGuardRequired(productCandidate, options.runIntentBootstrap)) {
      const timingBaseline = JSON.parse(await readFile(
        path.join(repositoryRoot, "verification", "timing-baseline.json"), "utf8"));
      const preflight = reviewReadyScopePreflight({
        approvedPackIds:options.packIds,
        plannedPackIds:bindingPlan.packIds,
        taskCount:bindingPlan.tasks.length,
        criticalPathEstimateMs:estimatePlanMilliseconds(bindingPlan,
          measuredTimingModel([], timingBaseline), {
            concurrency:environmentInteger("VERIFICATION_CONCURRENCY", 4, { maximum:64 }),
            observationConcurrency:environmentInteger("VERIFICATION_OBSERVATION_CONCURRENCY", 2,
              { maximum:4 }),
          }),
        changedOwners:bindingPlan.changedOwners,
        startedAtMs:Number(process.env.SWARMFORGE_TASK_STARTED_AT_MS ?? reviewPreflightStartedAt),
        nowMs:Date.now(),
        effortCeilingMs:environmentInteger("SWARMFORGE_EFFORT_CEILING_MINUTES", 60,
          { maximum:24 * 60 }) * 60_000,
        allPackIds:timeoutRepairPackIds,
      });
      console.error(`[verify:review-scope] ${formatReviewReadyScopePreflight(preflight)}`);
      if (preflight.status === "blocked") {
        throw new Error("Review-ready verification scope expanded before task launch; restore the " +
          "approved candidate or approve the shared verification repair as a standalone slice");
      }
    }
  }
  if (options.runIntentBootstrap && changedSince) {
    const executionPlan = planVerification(packs, {
      ...options,
      changedPaths:[],
      changeSet:null,
      basePacks:undefined,
      historicalRegistryFallback:false,
    });
    plan = bindRunIntentBootstrapPlan(executionPlan, bindingPlan, packs);
  } else if (options.focusedTaskKeys.length && changedSince) {
    bindingPlan ??= planVerification(packs, { ...options, packIds:[] });
    const executionPlan = planVerification(packs, {
      ...options,
      changedPaths:[],
      changeSet:null,
      basePacks:undefined,
      historicalRegistryFallback:false,
    });
    plan = bindVerificationChangeScope(executionPlan, bindingPlan);
  } else plan = planVerification(packs, options);
  const canonicalPlan = planVerification(packs, {
    packIds:timeoutRepairPackIds, includeProperties:plan.includeProperties,
  });
  if (options.focusedTaskKeys.length) {
    plan = selectFocusedVerificationTasks(plan, options.focusedTaskKeys, canonicalPlan);
  } else plan = closeVerificationPlanPrerequisites(plan, canonicalPlan);
  if (evidenceTask) plan = planPackageTask(plan);
  const concurrency = environmentInteger("VERIFICATION_CONCURRENCY", 4, { maximum:64 });
  const observationConcurrency = environmentInteger("VERIFICATION_OBSERVATION_CONCURRENCY", 2, { maximum:4 });
  const context = createVerificationReceiptContext(concurrency, observationConcurrency, { runIntent });
  context.receipt.registryDigest = verificationDigest(packs);
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
    changedPaths:[...plan.changedPaths].sort(),
    changedOwners:plan.changedOwners,
    changedBoundaries:plan.changedBoundaries,
    styleSmokeTargets:[...new Set(plan.styleSmokeTargets ?? [])].sort(),
    terminalFullObligations:[...new Set(plan.terminalFullObligations ?? [])].sort(),
    changedStyleTargets:plan.changedStyleTargets ?? {},
    adapterAuthorizationPackIds:[...new Set(plan.adapterAuthorizationPackIds ?? [])].sort(),
    changeSetDigest:plan.changeSet ? verificationDigest(plan.changeSet) : null,
    taskPlanDigest:verificationDigest(plan.tasks.map(verificationTaskIdentity)),
    conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason,
  };
  let admissionStore;
  let revalidateAdmissions;
  if (evidenceTask && !timeoutRepairIncident && !options.runIntentBootstrap) {
    admissionStore = createTimeoutIncidentStore();
    const incidents = await admissionStore.blocking({ commit:candidateCommit });
    const eligibleCandidates = eligibleRepairAdmissionCandidates(incidents)
      .filter((incident) => incident.repair?.status === "eligible");
    const flakyCandidates = confirmedFlakyAdmissionCandidates(incidents);
    const alreadyDeferred = incidents.filter((incident) =>
      incident.terminalVerificationDeferred?.status === "terminal-verification-deferred");
    const admittedIds = new Set([...eligibleCandidates, ...flakyCandidates, ...alreadyDeferred]
      .map(({ id }) => id));
    const unadmitted = incidents.filter(({ id }) => !admittedIds.has(id));
    if (unadmitted.length) {
      throw new Error(`Unresolved reliability incidents have no admissible proof: ${
        unadmitted.map(({ id }) => id).sort().join(", ")}`);
    }
    if (eligibleCandidates.length || flakyCandidates.length) {
      const common = {
        plan, packs,
        candidate:{ commit:candidateCommit, tree:candidateTree },
        baseCommit:changedSince, evidenceTask,
        changeSetDigest:context.receipt.candidate.changeSetDigest,
        planDigest:context.receipt.plan.taskPlanDigest,
      };
      const [eligibleAdmissions, confirmedFlakyAdmissions] = await Promise.all([
        buildEligibleRepairAdmissions({ ...common, incidents:eligibleCandidates }),
        buildConfirmedFlakyAdmissions({ ...common, root:repositoryRoot, incidents:flakyCandidates }),
      ]);
      if (resumeReceiptPath) {
        throw new Error("Reliability admission requires one fresh review run without receipt resume");
      }
      if (eligibleAdmissions) context.receipt.eligibleRepairAdmissions = eligibleAdmissions;
      if (confirmedFlakyAdmissions) context.receipt.confirmedFlakyAdmissions = confirmedFlakyAdmissions;
      revalidateAdmissions = async(phase) => {
        await validateVerificationCandidateClean({ repositoryRoot });
        const [currentCommit, currentTree, currentChangeSet] = await Promise.all([
          gitValue("rev-parse", "HEAD^{commit}"), gitValue("rev-parse", "HEAD^{tree}"),
          canonicalVerificationChangeSet({
            base:changedSince, commit:candidateCommit, repositoryRoot,
          }),
        ]);
        if (currentCommit !== candidateCommit || currentTree !== candidateTree ||
            verificationDigest(currentChangeSet) !== context.receipt.candidate.changeSetDigest) {
          throw new Error(`Reliability admission candidate changed ${phase}`);
        }
        const current = new Map(await Promise.all([...admittedIds].map(async(id) =>
          [id, await admissionStore.read(id)])));
        if (eligibleAdmissions) await revalidateEligibleRepairAdmissions({
          admissions:eligibleAdmissions, phase,
          incidents:eligibleCandidates.map(({ id }) => current.get(id)), ...common,
        });
        if (confirmedFlakyAdmissions) await revalidateConfirmedFlakyAdmissions({
          admissions:confirmedFlakyAdmissions, phase, root:repositoryRoot,
          incidents:flakyCandidates.map(({ id }) => current.get(id)), ...common,
        });
      };
    }
  }
  if (options.runIntentBootstrap) {
    const store = createTimeoutIncidentStore();
    const [base, incidents] = await Promise.all([
      validateRunIntentBootstrapBase({
        root:repositoryRoot, baseCommit:changedSince, changedPaths:plan.changeSet.paths,evidenceTask,
      }),
      store.blocking({ commit:candidateCommit }),
    ]);
    const coverage = await runIntentBootstrapCoverage({ incidents, plan, packs,
      candidate:{ commit:candidateCommit, tree:candidateTree }, root:repositoryRoot, evidenceTask });
    context.receipt.runIntentBootstrap = {
      ...base,
      candidateCommit,
      candidateTree,
      coverage,
    };
  }
  if (boundedTerminalAttempt) {
    context.receipt.plan.terminalClosure = terminalClosureExecution({
      attempt:boundedTerminalAttempt,
      runnablePackCount:plan.requestedPackIds.length,
    });
    context.receipt.plan.terminalClosure.attempt = boundedTerminalAttempt;
  }
  let timeoutStore;
  let timeoutRepairIncidentIds = [];
  if (timeoutRepairIncident) {
    timeoutStore = createTimeoutIncidentStore();
    const blocking = await timeoutStore.blocking({ commit:candidateCommit });
    timeoutRepairIncidentIds = compatibleTimeoutRepairIncidentIds({
      requestedId:timeoutRepairIncident, blocking, candidateCommit, candidateTree,
      baseCommit:changedSince, evidenceTask, requestedPackIds:plan.requestedPackIds,
    });
    context.receipt.timeoutRepairCheckpoint = {
      incidentId:timeoutRepairIncident, incidentIds:timeoutRepairIncidentIds,
    };
    for (const incidentId of timeoutRepairIncidentIds) {
      await timeoutStore.claimRepairCheckpoint(incidentId, context.receipt.runId);
    }
  }
  let buildManifest;
  const artifactRequired = plan.tasks.some(({ stage }) =>
    ["build", "browser", "browser-observation", "checkpoint", "acceptance-session", "package"]
      .includes(stage));
  if (options.skipBuild) buildManifest = await validateCurrentArtifactForConsumers({
    root:repositoryRoot, artifactValidator,
  });
  const promotionTasks = evidenceTask ? verificationPromotionTasks() : [];
  const prerequisitePlan = await prepareCheckpointExecution({
    packs, plan, receiptContext:context, inputFingerprint, evidenceTask, changedSince,
    promotionTasks, probeEnvironment:!commandRunner,
  });
  if (evidenceTask) plan.promotionTasks = promotionTasks;
  const launchRoutes = new Map(prerequisitePlan.tasks.map(({ key, route }) => [key, route]));
  let executionPlan = { ...plan };
  let checkpointAttempt;
  let checkpointAttemptStore;
  let checkpointOwner;
  let checkpointIdentity;
  let promotionOnly = false;
  const initializeCheckpointAttempt = async() => {
    if (!evidenceTask || checkpointAttempt) return;
    const inputIdentity = checkpointAttemptInputIdentity({
      candidate:{ commit:candidateCommit, tree:candidateTree }, baseCommit:changedSince,
      evidenceTask, planDigest:verificationDigest(plan.tasks.map(verificationTaskIdentity)),
      artifactInputDigest:inputFingerprint.inputDigest ?? inputFingerprint.digest,
      registryDigest:verificationDigest(packs),
      toolchainDigest:verificationDigest(context.receipt.environment),
      environmentClass:verificationDigest(context.receipt.environment),
      capabilityRoutes:Object.fromEntries(prerequisitePlan.tasks.map(({ key, route }) => [key, route])),
    });
    checkpointAttemptStore = createCheckpointAttemptStore({
      directory:await defaultCheckpointAttemptDirectory(repositoryRoot),
      legacyDirectories:[await legacyCheckpointAttemptDirectory(repositoryRoot)],
    });
    checkpointOwner = { pid:process.pid, token:randomUUID() };
    checkpointAttempt = await checkpointAttemptStore.claim(inputIdentity,
      plan.tasks.map(({ key }) => key), checkpointOwner);
    checkpointIdentity = checkpointAttempt.attempt.identity;
    context.receipt.checkpointAttempt = { id:checkpointAttempt.attempt.id,
      action:checkpointAttempt.action, identityDigest:checkpointAttempt.attempt.identityDigest };
    if (checkpointAttempt.action === "attached") {
      throw new Error(`Compatible checkpoint attempt ${checkpointAttempt.attempt.id} is already active under pid ${
        checkpointAttempt.owner.pid}; no duplicate all-pack process launched`);
    }
    if (checkpointAttempt.action === "promotion-only") {
      buildManifest = await validateCurrentArtifactForConsumers({
        root:repositoryRoot, artifactValidator,
      });
      checkpointIdentity = checkpointAttemptIdentity(checkpointAttempt.attempt.identity);
      const recovery = await checkpointAttemptStore.recovery(checkpointAttempt.attempt.id);
      const priorTasks = Object.fromEntries(Object.entries(checkpointAttempt.attempt.results)
        .map(([key, result]) => [key, result.receiptTask]));
      Object.assign(executionPlan, resumeVerificationPlan(plan,
        { version:2, resumeIdentity:checkpointIdentity, tasks:priorTasks }, checkpointIdentity));
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
      for (const [key, logicalResults] of Object.entries(checkpointAttempt.attempt.logicalResults)) {
        if (priorTasks[key]) continue;
        const task = plan.tasks.find(({ key:taskKey }) => taskKey === key);
        priorTasks[key] = { identity:verificationTaskIdentity(task), status:"interrupted",
          provenance:"fresh", durationMs:Object.values(logicalResults)
            .reduce((total, result) => total + result.durationMs, 0), output:"", stderr:"",
          logicalResults:structuredClone(logicalResults) };
      }
      Object.assign(executionPlan, resumeVerificationPlan(plan,
        { version:2, resumeIdentity:checkpointIdentity, tasks:priorTasks }, checkpointIdentity));
      for (const result of Object.values(executionPlan.reusedTasks)) {
        result.provenance = "fresh";
        result.attemptContinuation = true;
      }
      Object.assign(context.receipt.tasks, executionPlan.reusedTasks);
      console.error(`[verify:checkpoint-continue] ${checkpointAttempt.attempt.id} reusing ${
        Object.keys(executionPlan.reusedTasks).length} durable passed task(s) and ${
        Object.values(checkpointAttempt.attempt.logicalResults)
          .reduce((count, results) => count + Object.keys(results).length, 0)} logical target(s)`);
    }
  };
  let activeAttemptTask;
  let checkpointGuard;
  const createGuard = () => createRepositoryCheckpointIdentityGuard({
    repositoryRoot, expected:{ commit:candidateCommit, tree:candidateTree,
      artifactInputDigest:checkpointIdentity.artifactInputDigest,
      artifactOutputDigest:checkpointIdentity.artifactOutputDigest,
      artifactBuildIdentity:checkpointIdentity.artifactBuildIdentity, trackedChanges:"" },
    context, attemptId:checkpointAttempt.attempt.id, launchRoutes, artifactValidator,
  });
  const bindCheckpointArtifact = async(artifact) => {
    if (!checkpointAttempt || checkpointIdentity.artifactOutputDigest !== null) return;
    await checkpointGuard.assertBefore({ kind:"artifact-binding" });
    checkpointAttempt = { ...checkpointAttempt,
      attempt:await checkpointAttemptStore.bindArtifactIdentity(checkpointAttempt.attempt.id, {
        artifactOutputDigest:artifact.outputDigest, artifactBuildIdentity:artifact.buildIdentity,
      }, checkpointOwner) };
    checkpointIdentity = checkpointAttemptIdentity(checkpointAttempt.attempt.identity);
    context.receipt.checkpointAttempt.identityDigest = checkpointAttempt.attempt.identityDigest;
    checkpointGuard = createGuard();
    const buildTask = plan.tasks.find(({ stage }) => stage === "build");
    if (buildTask && !checkpointAttempt.attempt.results[buildTask.key]) {
      await checkpointAttemptStore.recordTask(checkpointAttempt.attempt.id, buildTask.key, {
        status:"passed", identityDigest:verificationDigest(verificationTaskIdentity(buildTask)),
        receiptTask:structuredClone(context.receipt.tasks[buildTask.key]),
      }, checkpointOwner);
    }
  };
  if (evidenceTask) {
    await initializeCheckpointAttempt();
    checkpointGuard = createGuard();
    if (options.skipBuild) await bindCheckpointArtifact(buildManifest);
  }
  if (!commandRunner) {
    await context.write();
    console.error(`[verify:receipt] ${path.relative(repositoryRoot, context.receiptPath)}`);
  }
  const authorizationContext = {
    mode:plan.mode,
    candidate:structuredClone(context.receipt.candidate),
    runId:context.receipt.runId,
    artifact:structuredClone(context.receipt.artifactInput),
    receiptPath:context.receiptPath,
    checkpointAttempt:structuredClone(context.receipt.checkpointAttempt ?? null),
    promotion:evidenceTask ? promotionTasks.map(verificationTaskIdentity) : null,
  };
  const launchAuthorizations = commandRunner ? undefined : createVerificationLaunchAuthorizations({
    tasks:plan.tasks, routes:launchRoutes, ...authorizationContext,
  });
  const baseRunner = commandRunner ?? createVerificationCommandRunner(context, { launchRoutes,
    launchAuthorizations, authorizationContext,
    onLogicalTargetResult:async(task, receiptTask) => {
      if (checkpointAttempt) {
        await checkpointAttemptStore.recordLogicalTargets(checkpointAttempt.attempt.id,
          task.key, receiptTask, checkpointOwner);
      }
    },
    onTaskResult:async(task, receiptTask) => {
      if (checkpointAttempt && receiptTask.logicalResults) {
        await checkpointAttemptStore.recordLogicalTargets(checkpointAttempt.attempt.id,
          task.key, receiptTask, checkpointOwner);
      }
    },
  });
  const runner = async(display, task) => {
    if (!checkpointAttempt) return baseRunner(display, task);
    activeAttemptTask = task.key;
    await checkpointGuard.assertBefore(task);
    await checkpointAttemptStore.assertIdentity(checkpointAttempt.attempt.id, checkpointIdentity);
    const result = await baseRunner(display, task);
    if (task.stage === "build" && checkpointIdentity.artifactOutputDigest === null) {
      activeAttemptTask = undefined;
      return result;
    }
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
  await revalidateAdmissions?.("immediately before task launch");
  console.error(`[verify:plan] ${plan.packIds.length} pack(s), ${plan.tasks.length} task(s), concurrency ${concurrency}, observation concurrency ${observationConcurrency}`);
  try {
    await executeAcceptancePlan(executionPlan, {
      runCommand:runner, concurrency, observationConcurrency,
      ...(coordinatorArtifactLeaseRequired(artifactRequired, commandRunner) ? {
        acquireArtifactLease:async() => {
          const startedAt = Date.now();
          const release = await acquireDistArtifactLock();
          return { token:release.token, waitMs:Date.now() - startedAt, release };
        },
        onMetrics:async(metrics) => {
          context.receipt.coordination = metrics;
          await context.write();
        },
      } : {}),
      ...(artifactRequired ? { afterPreparation:async() => {
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
        await bindCheckpointArtifact(buildManifest);
        context.receipt.resumeIdentity = verificationResumeIdentity(plan, context, buildManifest);
        await context.write();
      }
      } } : {}),
    });
  } catch (error) {
    if (checkpointAttempt && receivedParentSignal && activeAttemptTask) {
      await checkpointAttemptStore.interrupt(checkpointAttempt.attempt.id,
        activeAttemptTask, checkpointOwner);
    }
    throw error;
  }
  if (checkpointAttempt && !promotionOnly) {
    await checkpointGuard.assertBefore({ kind:"task-completion" });
    await checkpointAttemptStore.markTasksComplete(checkpointAttempt.attempt.id, checkpointOwner);
  }
  if (!commandRunner) {
    if (artifactRequired) buildManifest = buildManifest ?? await validateCurrentArtifactForConsumers({
      root:repositoryRoot, artifactValidator,
    });
    if (buildManifest) context.receipt.artifact = {
      schemaVersion:buildManifest.schemaVersion,
      buildIdentity:buildManifest.buildIdentity,
      inputDigest:buildManifest.inputDigest,
      outputDigest:buildManifest.outputDigest,
      toolchain:{ ...buildManifest.toolchain },
    };
    if (boundedTerminalAttempt) {
      const planDigest = verificationDigest(plan.tasks.map(verificationTaskIdentity));
      const registryDigest = verificationDigest(packs);
      const limits = {
        ...resolvedVerificationDeadlines({ timeoutMs:defaultTimeoutMs,
          terminationGraceMs:defaultTerminationGraceMs, environment:process.env }),
        outputLimitBytes:environmentInteger("VERIFICATION_RECEIPT_OUTPUT_LIMIT_BYTES",
          defaultOutputLimitBytes, { maximum:maximumOutputLimitBytes }),
      };
      const currentInputs = {};
      for (const task of plan.tasks) {
        const closure = terminalTaskInputClosure({
          task, candidate:context.receipt.candidate, artifact:context.receipt.artifact,
          environment:context.receipt.environment, planDigest, registryDigest,
          prerequisitePlan:prerequisitePlan.tasks, limits,
        });
        currentInputs[task.key] = closure.input;
        const result = context.receipt.tasks[task.key];
        if (result?.provenance === "fresh") {
          result.terminalInputClosure = closure.input;
          result.terminalInputDigest = closure.digest;
          result.resultDigest = verificationDigest({
            identity:result.identity, status:result.status, output:result.output,
            stderr:result.stderr, logicalResults:result.logicalResults,
          });
        }
      }
      enforceTerminalClosureReceipt({
        attempt:boundedTerminalAttempt, runnablePackCount:plan.requestedPackIds.length,
        tasks:context.receipt.tasks, currentInputs,
        packageTaskKey:timeoutRepairPackageTaskIdentity.key,
      });
    }
    context.receipt.completedAt = new Date().toISOString();
    if (context.receipt.eligibleRepairAdmissions) {
      await revalidateAdmissions("before receipt finalization");
      validateEligibleRepairAdmissionsReceipt(context.receipt,
        context.receipt.eligibleRepairAdmissions);
    }
    if (context.receipt.confirmedFlakyAdmissions) {
      await revalidateAdmissions("before receipt finalization");
      validateConfirmedFlakyAdmissionsReceipt(context.receipt,
        context.receipt.confirmedFlakyAdmissions);
    }
    if (checkpointGuard) await checkpointGuard.assertBefore({ kind:"receipt-finalization" });
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
      for (const incidentId of timeoutRepairIncidentIds) {
        await timeoutStore.resolve(incidentId, {
          checkpointReceiptPath:context.receiptPath,
          packageReceiptPath:packageContext.receiptPath,
        });
      }
      await assertNoBlockingTimeoutIncidents("HEAD");
    }
    // A continued attempt can restore hundreds of durable task results into a
    // fresh receipt at once.  Flush that final, completed document again at
    // the promotion boundary so evidence validation never observes an older
    // queued receipt image.
    await context.write();
    if (checkpointGuard) await checkpointGuard.assertBefore({ kind:"pending-evidence" });
    const pending = await createPendingVerificationEvidence({
      task:evidenceTask,
      plan,
      receiptPath:context.receiptPath,
      changedSince,
      buildManifest,
      toolchainValidator:async() => {},
    });
    plan.pendingEvidencePath = pending.path;
    plan.promotionTasks = verificationPromotionTasks(path.relative(repositoryRoot, pending.path));
    if (checkpointAttempt) {
      await checkpointAttemptStore.markPromotion(checkpointAttempt.attempt.id,
        "pending-evidence-created");
    }
    console.error(`[verify:evidence-pending] ${pending.path}`);
    console.error(`[verify:evidence-record] route=scoped-git-metadata-approval command=node scripts/verification-evidence.mjs record ${pending.path}`);
  }
  return plan;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFocusedAcceptance(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    if (!receivedParentSignal) process.exitCode = 1;
  });
}
