import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, open, unlink } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { normalizeBrowserPrerequisiteTasks as normalizeBrowserTasks } from
  "./verification-browser-prerequisite-normalization.mjs";

const restrictedCapabilities = new Set(["local-loopback", "git-metadata-write"]);
const sha40=/^[0-9a-f]{40}$/u,sha64=/^[0-9a-f]{64}$/u;
export const verificationParentExecutionContextEnvironment =
  "SWARMFORGE_VERIFICATION_PARENT_CONTEXT";

const canonicalValue=(value)=>Array.isArray(value)?value.map(canonicalValue):
  value&&typeof value==="object"?Object.fromEntries(Object.entries(value)
    .sort(([left],[right])=>left.localeCompare(right))
    .map(([key,nested])=>[key,canonicalValue(nested)])):value;
const contextDigest=(value)=>createHash("sha256")
  .update(JSON.stringify(canonicalValue(value))).digest("hex");

export function createVerificationParentExecutionContext({ receiptPath, receiptRunId, runIntent,
  candidate, parentTaskKey, authorizedTaskSetDigest, planDigest, launchAuthorization }) {
  const value={version:1,receiptPath,receiptRunId,runIntent,
    candidate:{commit:candidate?.commit,tree:candidate?.tree},parentTaskKey,
    authorizedTaskSetDigest,planDigest,launchAuthorization:structuredClone(launchAuthorization)};
  const valid=typeof receiptPath==="string"&&receiptPath.length>0&&
    typeof receiptRunId==="string"&&receiptRunId.length>0&&
    typeof runIntent==="string"&&runIntent.length>0&&
    /^[A-Za-z0-9][A-Za-z0-9_:/+.-]*$/u.test(parentTaskKey??"")&&
    sha40.test(value.candidate.commit??"")&&sha40.test(value.candidate.tree??"")&&
    sha64.test(authorizedTaskSetDigest??"")&&sha64.test(planDigest??"")&&
    launchAuthorization?.taskKey===parentTaskKey&&launchAuthorization?.runId===receiptRunId&&
    launchAuthorization?.candidate?.commit===value.candidate.commit&&
    launchAuthorization?.candidate?.tree===value.candidate.tree;
  if (!valid) throw new Error("Verification parent execution context is incomplete or mismatched");
  return {...value,digest:contextDigest(value)};
}

export function validateVerificationParentExecutionContext(value) {
  if (!value||typeof value!=="object"||Array.isArray(value)) {
    throw new Error("Verification parent execution context is malformed");
  }
  const {digest,...input}=value;
  if (!sha64.test(digest??"")||contextDigest(input)!==digest) {
    throw new Error("Verification parent execution context is stale or modified");
  }
  createVerificationParentExecutionContext({
    receiptPath:value.receiptPath,receiptRunId:value.receiptRunId,runIntent:value.runIntent,
    candidate:value.candidate,parentTaskKey:value.parentTaskKey,
    authorizedTaskSetDigest:value.authorizedTaskSetDigest,planDigest:value.planDigest,
    launchAuthorization:value.launchAuthorization,
  });
  return value;
}

function validateSyntheticVerificationFixture(encoded,repositoryRoot) {
  let value;
  try { value=JSON.parse(encoded); }
  catch { throw new Error("Synthetic verification fixture context is malformed"); }
  const root=path.resolve(value?.root??""),expectedRoot=path.resolve(repositoryRoot);
  const inside=(target)=>path.resolve(target??"").startsWith(`${root}${path.sep}`);
  const valid=value?.version===1&&root===expectedRoot&&
    root.startsWith(`${path.resolve(os.tmpdir())}${path.sep}`)&&
    path.resolve(value.registry??"")===path.join(root,"verification","packs.json")&&
    inside(value.receiptDirectory)&&inside(value.reliabilityStore)&&
    value.admissibleAsProductionEvidence===false;
  if (!valid) throw new Error("Synthetic verification fixture context is not isolated or non-admissible");
  return value;
}

export function rejectNestedProductionVerification(environment=process.env,
  {repositoryRoot=process.cwd()}={}) {
  const encoded=environment[verificationParentExecutionContextEnvironment];
  const parentMarkers=environment.SWARMFORGE_VERIFICATION_TASK_KEY!==undefined||
    environment.SWARMFORGE_VERIFICATION_RECEIPT!==undefined;
  const synthetic=environment.SWARMFORGE_SYNTHETIC_VERIFICATION_FIXTURE;
  if (synthetic!==undefined) {
    if (encoded!==undefined||parentMarkers) {
      throw new Error("Synthetic verification fixture cannot retain a production parent binding");
    }
    validateSyntheticVerificationFixture(synthetic,repositoryRoot);
    return;
  }
  if (encoded===undefined) {
    if (parentMarkers) throw new Error("Verification parent execution context is missing");
    return;
  }
  let parsed;
  try { parsed=JSON.parse(encoded); }
  catch { throw new Error("Verification parent execution context is malformed"); }
  const context=validateVerificationParentExecutionContext(parsed);
  throw new Error(`Nested production verification runner is forbidden inside ${context.parentTaskKey}`);
}

const declaredValues = (pack, key) => pack[key] ?? [];

export function declaredTaskExecutionPrerequisites(pack, target, stage) {
  const matches = declaredValues(pack, "executionPrerequisites")
    .filter(({ path:declaredPath }) => declaredPath === target);
  if (matches.length > 1) {
    throw new Error(`Verification task has duplicate execution prerequisite declarations: ${target}`);
  }
  return matches[0]?.requiredCapabilities ?? defaultTaskExecutionPrerequisites(stage);
}

export function declaredTaskTemporaryPathClass(pack, target, stage) {
  const declaration = declaredValues(pack, "executionPrerequisites")
    .find(({ path:declaredPath }) => declaredPath === target);
  return declaration?.temporaryPathClass ??
    (["browser", "browser-observation"].includes(stage) ? "chrome-short" : "workspace");
}

const runnerModeIds = [
  "focused", "ordinary-focused", "focused-task", "exact", "impact", "terminal",
  "diagnostic-retry", "repair-focused", "timeout-diagnostic", "timeout-repair-focused", "repair-checkpoint",
  "checkpoint-promotion", "package",
];

const typedPrerequisiteKindIds = [
  "upstream-task-result", "build-artifact", "acceptance-parse",
  "acceptance-generate", "file-producer", "executable",
  "bounded-output-capacity", "restricted-capability", "candidate-identity",
  "evidence-identity", "incident-identity", "checkpoint-attempt-identity",
  "promotion-identity",
];

const exactDeclaration = (declaration, kind) => {
  if (!declaration || typeof declaration !== "object" || Array.isArray(declaration) ||
      declaration.kind !== kind || typeof declaration.id !== "string" || !declaration.id) {
    throw new Error(`Invalid ${kind} prerequisite declaration`);
  }
  return declaration;
};

export const verificationRunnerModeRegistry = Object.freeze(runnerModeIds.map((id) =>
  Object.freeze({ id, validate:(mode) => {
    if (mode !== id) throw new Error(`Wrong-mode verification authorization: expected ${id}`);
    return mode;
  } })));

export const verificationPrerequisiteKindRegistry = Object.freeze(
  typedPrerequisiteKindIds.map((id) => Object.freeze({
    id,
    validate:(declaration) => exactDeclaration(declaration, id),
    satisfy:(declaration, observed) => {
      exactDeclaration(declaration, id);
      if (observed?.status !== "satisfied") {
        throw new Error(`Unsatisfied ${id} prerequisite ${declaration.id}`);
      }
      return observed;
    },
  })),
);

const runnerMode = (mode) => {
  const registered = verificationRunnerModeRegistry.find(({ id }) => id === mode);
  if (!registered) throw new Error(`Unknown verification runner mode: ${mode}`);
  registered.validate(mode);
  return registered;
};

const stableTaskIdentity = (task) => JSON.stringify({
  key:task.key, stage:task.stage, packId:task.packId ?? null,
  executable:task.executable, args:task.args, target:task.target ?? null,
  environment:task.environment ?? null,
  requiredCapabilities:[...(task.requiredCapabilities ?? [])],
});

const acceptanceSessionExternalPrerequisites = new Map([
  ["shell", ["unit:test/flow-examples-timing-test.mjs"]],
  ["verification_process", [
    "unit:test/flow-examples-timing-test.mjs",
    "unit:test/headless-chrome-lifecycle-test.mjs",
    "unit:test/settled-final-verification-workflow-test.mjs",
    "unit:test/side-panel-single-cutover-preparation-test.mjs",
  ]],
]);

export function verificationTaskPrerequisiteKeys(task, canonicalTasks) {
  exactTask(task);
  if (!Array.isArray(canonicalTasks)) throw new Error("Canonical prerequisite task registry is required");
  if (task.prerequisiteTaskKeys !== undefined) return [...task.prerequisiteTaskKeys];
  const keys = new Set();
  const buildRequiredStages = new Set([
    "browser", "browser-observation", "checkpoint", "acceptance-parse",
    "acceptance-session", "package",
  ]);
  if (buildRequiredStages.has(task.stage)) keys.add("build:dist");
  if (task.stage === "acceptance-generate") {
    const parser = canonicalTasks.find((candidate) =>
      candidate.stage === "acceptance-parse" && candidate.target === task.target);
    if (!parser) throw new Error(`Missing acceptance parser satisfier for ${task.key}`);
    keys.add(parser.key);
  }
  if (task.stage === "acceptance-session") {
    const features = new Set(task.target?.split(",") ?? []);
    for (const candidate of canonicalTasks) {
      if (["unit", "browser", "browser-observation", "checkpoint"].includes(candidate.stage) &&
          candidate.packId === task.packId ||
          ["acceptance-parse", "acceptance-generate"].includes(candidate.stage) &&
          features.has(candidate.target)) {
        keys.add(candidate.key);
      }
    }
    for (const key of acceptanceSessionExternalPrerequisites.get(task.packId) ?? []) keys.add(key);
  }
  keys.delete(task.key);
  return [...keys];
}

export function expandVerificationTaskPrerequisites(requestedTasks, canonicalTasks, { mode } = {}) {
  runnerMode(mode);
  if (!Array.isArray(requestedTasks) || !requestedTasks.length || !Array.isArray(canonicalTasks)) {
    throw new Error("Verification prerequisite closure requires requested and canonical tasks");
  }
  const canonical = new Map();
  for (const task of canonicalTasks) {
    exactTask(task);
    if (canonical.has(task.key)) throw new Error(`Duplicate canonical prerequisite satisfier: ${task.key}`);
    canonical.set(task.key, task);
  }
  const requestedKeys = new Set();
  const requestedByKey = new Map();
  for (const task of requestedTasks) {
    exactTask(task);
    if (requestedKeys.has(task.key)) throw new Error(`Duplicate requested prerequisite consumer: ${task.key}`);
    requestedKeys.add(task.key);
    requestedByKey.set(task.key, task);
    if (!canonical.has(task.key)) canonical.set(task.key, task);
  }
  const selected = new Set();
  const visiting = new Set();
  const visit = (key) => {
    if (selected.has(key)) return;
    if (visiting.has(key)) throw new Error(`Cyclic verification prerequisite declaration at ${key}`);
    const task = requestedByKey.get(key) ?? canonical.get(key);
    if (!task) throw new Error(`Missing prerequisite satisfier for ${key}`);
    const prerequisites = verificationTaskPrerequisiteKeys(task, [...canonical.values()]);
    if (!Array.isArray(prerequisites) || new Set(prerequisites).size !== prerequisites.length ||
        prerequisites.some((value) => typeof value !== "string" || !value || value === "*")) {
      throw new Error(`Unknown, duplicate, ambiguous, or catch-all prerequisite declaration for ${key}`);
    }
    visiting.add(key);
    for (const prerequisite of prerequisites) visit(prerequisite);
    visiting.delete(key);
    selected.add(key);
  };
  for (const key of requestedKeys) visit(key);
  const ordered = canonicalTasks.filter(({ key }) => selected.has(key))
    .map((task) => requestedByKey.get(task.key) ?? task);
  for (const task of requestedTasks) {
    if (!canonicalTasks.some(({ key }) => key === task.key) && selected.has(task.key)) ordered.push(task);
  }
  if (ordered.length !== selected.size) {
    throw new Error("Verification prerequisite closure has an ambiguous canonical satisfier");
  }
  return normalizeBrowserTasks(ordered, canonicalTasks, exactTask);
}

export function normalizeBrowserPrerequisiteTasks(tasks, canonicalTasks) {
  return normalizeBrowserTasks(tasks, canonicalTasks, exactTask);
}

function authorizationBinding({ task, mode, predecessorKeys, route, candidate, runId,
  artifact, receiptPath, checkpointAttempt, promotion }) {
  return {
    version:1, taskIdentity:stableTaskIdentity(task), taskKey:task.key, mode,
    predecessorKeys:[...predecessorKeys], requiredCapabilities:[...task.requiredCapabilities],
    route, candidate:structuredClone(candidate ?? null), runId,
    artifact:structuredClone(artifact ?? null), receiptPath,
    checkpointAttempt:structuredClone(checkpointAttempt ?? null),
    promotion:structuredClone(promotion ?? null),
  };
}

export function createVerificationLaunchAuthorizations({ tasks, mode, routes, candidate, runId,
  artifact, receiptPath, checkpointAttempt, promotion }) {
  runnerMode(mode);
  if (!Array.isArray(tasks) || !tasks.length || !(routes instanceof Map) ||
      typeof runId !== "string" || !runId || typeof receiptPath !== "string" || !receiptPath) {
    throw new Error("Verification launch authorization requires tasks, routes, run, and receipt");
  }
  const taskKeys = new Set(tasks.map(({ key }) => key));
  const authorizations = new Map();
  for (const task of tasks) {
    exactTask(task);
    validateTaskExecutionPrerequisites(task);
    if (authorizations.has(task.key)) throw new Error(`Duplicate launch authorization: ${task.key}`);
    const route = routes.get(task.key);
    if (typeof route !== "string" || !route || route === "blocked") {
      throw new Error(`Missing launch authorization route for ${task.key}`);
    }
    const predecessorKeys = verificationTaskPrerequisiteKeys(task, tasks)
      .filter((key) => taskKeys.has(key));
    authorizations.set(task.key, {
      binding:authorizationBinding({ task, mode, predecessorKeys, route, candidate, runId,
        artifact, receiptPath, checkpointAttempt, promotion }),
      consumed:false,
    });
  }
  return authorizations;
}

export function consumeVerificationLaunchAuthorization(authorizations, task, context) {
  if (!(authorizations instanceof Map)) {
    throw new Error("Missing task-bound verification launch authorization");
  }
  exactTask(task);
  const authorization = authorizations.get(task.key);
  if (!authorization) throw new Error(`Missing launch authorization for ${task.key}`);
  if (authorization.consumed) throw new Error(`Reused launch authorization for ${task.key}`);
  const expected = authorizationBinding({
    task, mode:context.mode,
    predecessorKeys:authorization.binding.predecessorKeys,
    route:context.route, candidate:context.candidate, runId:context.runId,
    artifact:context.artifact, receiptPath:context.receiptPath,
    checkpointAttempt:context.checkpointAttempt, promotion:context.promotion,
  });
  if (JSON.stringify(expected) !== JSON.stringify(authorization.binding)) {
    throw new Error(`Altered or wrong-mode launch authorization for ${task.key}`);
  }
  const completed = new Set(context.completedPredecessorKeys ?? []);
  const incomplete = authorization.binding.predecessorKeys.filter((key) => !completed.has(key));
  if (incomplete.length) {
    throw new Error(`Incomplete verification prerequisites for ${task.key}: ${incomplete.join(", ")}`);
  }
  authorization.consumed = true;
  return structuredClone(authorization.binding);
}

function exactTask(task) {
  if (!task || typeof task !== "object" || Array.isArray(task) ||
      typeof task.key !== "string" || !task.key || typeof task.stage !== "string" ||
      typeof task.executable !== "string" || !Array.isArray(task.args)) {
    throw new Error("Execution prerequisite validation requires a structured canonical task");
  }
  return task;
}

export function validateTaskExecutionPrerequisites(task) {
  exactTask(task);
  const declared = task.requiredCapabilities;
  if (!Array.isArray(declared)) {
    throw new Error(`Verification task ${task.key} is missing its execution prerequisite declaration`);
  }
  if (new Set(declared).size !== declared.length ||
      declared.some((capability) => typeof capability !== "string" ||
        !restrictedCapabilities.has(capability))) {
    throw new Error(`Verification task ${task.key} has an unknown, duplicate, or catch-all capability declaration`);
  }
  return [...declared].sort();
}

export function preflightExecutionPrerequisites(tasks, {
  availableCapabilities = [], approvalRoutes = {},
} = {}) {
  if (!Array.isArray(tasks) || !Array.isArray(availableCapabilities)) {
    throw new Error("Execution prerequisite preflight requires tasks and available capabilities");
  }
  const available = new Set(availableCapabilities);
  if ([...available].some((capability) => !restrictedCapabilities.has(capability))) {
    throw new Error("Execution prerequisite preflight received an unknown available capability");
  }
  const planned = [];
  const blocked = [];
  for (const task of tasks) {
    const requiredCapabilities = validateTaskExecutionPrerequisites(task);
    if (!requiredCapabilities.length) {
      planned.push({ key:task.key, requiredCapabilities, route:"workspace-sandbox" });
      continue;
    }
    const unavailable = requiredCapabilities.filter((capability) => !available.has(capability));
    if (unavailable.length) {
      for (const capability of unavailable) blocked.push({
        taskKey:task.key, capability,
        route:approvalRoutes[capability] ?? "unavailable",
        status:"environment-prerequisite-blocked",
      });
      planned.push({ key:task.key, requiredCapabilities, route:"blocked" });
      continue;
    }
    const routes = requiredCapabilities.map((capability) => approvalRoutes[capability]);
    if (routes.some((route) => typeof route !== "string" || !route || route === "denied" ||
        route === "unavailable")) {
      for (let index = 0; index < requiredCapabilities.length; index += 1) blocked.push({
        taskKey:task.key, capability:requiredCapabilities[index],
        route:routes[index] ?? "unavailable", status:"environment-prerequisite-blocked",
      });
      planned.push({ key:task.key, requiredCapabilities, route:"blocked" });
      continue;
    }
    planned.push({ key:task.key, requiredCapabilities,
      route:routes.length === 1 ? routes[0] : routes.join("+") });
  }
  return { launchable:blocked.length === 0, tasks:planned, blocked };
}

async function executableAvailable(executable) {
  const candidates = executable.includes(path.sep)
    ? [path.resolve(executable)]
    : (process.env.PATH ?? "").split(path.delimiter).filter(Boolean)
      .map((directory) => path.join(directory, executable));
  for (const candidate of candidates) {
    try { await access(candidate, constants.X_OK); return true; }
    catch {}
  }
  return false;
}

async function boundedOutputAvailable({ outputDirectory, outputLimitBytes }) {
  if (!outputDirectory || !Number.isInteger(outputLimitBytes) || outputLimitBytes < 1024) return false;
  await mkdir(outputDirectory, { recursive:true });
  const probePath = path.join(outputDirectory, `.verification-output-probe-${randomUUID()}`);
  let handle;
  try {
    handle = await open(probePath, "wx", 0o600);
    await handle.writeFile(Buffer.alloc(Math.min(outputLimitBytes, 4096), 0x61));
    await handle.sync();
    return true;
  } catch {
    return false;
  } finally {
    if (handle) await handle.close();
    await unlink(probePath).catch(() => {});
  }
}

function loopbackAvailable() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(0, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

function scopedLoopbackAvailable(workspaceRoot) {
  const source = "const n=require('net'),s=n.createServer();s.once('error',()=>process.exit(1));s.listen(0,'127.0.0.1',()=>s.close(()=>process.exit(0)))";
  return new Promise((resolve) => execFile("bwrap", [
    "--ro-bind", "/", "/", "--bind", workspaceRoot, workspaceRoot,
    "--bind", "/tmp", "/tmp", "--dev-bind", "/dev", "/dev", "--proc", "/proc",
    "--unshare-net", process.execPath, "-e", source,
  ], { cwd:workspaceRoot }, (error) => resolve(!error)));
}

function gitMetadataAvailable(workspaceRoot) {
  const probeRef = `refs/swarmforge/capability-probe/${process.pid}-${randomUUID()}`;
  const run = (...args) => new Promise((resolve, reject) => execFile("git", args,
    { cwd:workspaceRoot }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout.trim())));
  return run("update-ref", probeRef, "HEAD")
    .then(async() => {
      const [probe, head] = await Promise.all([
        run("rev-parse", probeRef), run("rev-parse", "HEAD^{commit}"),
      ]);
      return probe === head;
    })
    .catch(() => false)
    .finally(() => run("update-ref", "-d", probeRef).catch(() => {}));
}

async function capabilityAvailable(capability, { workspaceRoot = process.cwd() } = {}) {
  if (capability === "local-loopback") {
    return await loopbackAvailable() && scopedLoopbackAvailable(workspaceRoot);
  }
  if (capability === "git-metadata-write") return gitMetadataAvailable(workspaceRoot);
  return false;
}

export async function probeExecutionPrerequisiteEnvironment(tasks, {
  executableProbe = executableAvailable,
  outputCapacityProbe = boundedOutputAvailable,
  capabilityProbe = capabilityAvailable,
  outputDirectory,
  outputLimitBytes = 1024,
  requestedCapabilities = [],
  workspaceRoot = process.cwd(),
} = {}) {
  if (!Array.isArray(tasks) || !Array.isArray(requestedCapabilities)) {
    throw new Error("Execution prerequisite environment probe requires tasks and requested capabilities");
  }
  const blocked = [];
  for (const task of tasks) {
    exactTask(task);
    if (!await executableProbe(task.executable)) blocked.push({
      taskKey:task.key, prerequisite:"executable", value:task.executable,
      status:"environment-prerequisite-blocked",
    });
  }
  if (!await outputCapacityProbe({ outputDirectory, outputLimitBytes })) blocked.push({
    taskKey:"verification-receipt", prerequisite:"bounded-output-capacity",
    value:outputLimitBytes, status:"environment-prerequisite-blocked",
  });
  for (const capability of [...new Set(tasks.flatMap((task) =>
    validateTaskExecutionPrerequisites(task)))]) {
    if (requestedCapabilities.includes(capability) &&
        !await capabilityProbe(capability, { workspaceRoot })) blocked.push({
      taskKey:tasks.find((task) => task.requiredCapabilities.includes(capability)).key,
      prerequisite:"capability-authority", value:capability,
      status:"environment-prerequisite-blocked",
    });
  }
  return { launchable:blocked.length === 0, blocked };
}

export function classifyExecutionRestriction({ task, operation, code, stderr, route }) {
  const requiredCapabilities = validateTaskExecutionPrerequisites(task);
  const diagnostic = `${code ?? ""} ${stderr ?? ""}`;
  const loopbackDenied = /(?:EPERM|EACCES|operation not permitted|permission denied|socket\(\) failed)/iu
    .test(diagnostic) && (operation?.kind === "bind" || operation?.kind === "connect" ||
      /(?:socket|127\.0\.0\.1|localhost|devtools|debugging port)/iu.test(diagnostic));
  if (!loopbackDenied) return undefined;
  return {
    failureClass:"environment-contract-failure", capability:"local-loopback",
    code:code ?? (/EACCES/iu.test(diagnostic) ? "EACCES" : "EPERM"),
    operation:structuredClone(operation), route, retryPermitted:false,
  };
}

export function defaultTaskExecutionPrerequisites(stage) {
  return ["browser", "browser-observation"].includes(stage) ? ["local-loopback"] : [];
}
