import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, open, unlink } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const restrictedCapabilities = new Set(["local-loopback", "git-metadata-write"]);

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
    if (task.packId === "shell") keys.add("unit:test/flow-examples-timing-test.mjs");
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
  return normalizeBrowserPrerequisiteTasks(ordered, canonicalTasks);
}

const browserTargets = (task) => task.stage === "browser-observation" &&
  Array.isArray(task.logicalTargetIds) && task.logicalTargetIds.length
  ? [...task.logicalTargetIds] : [];

function compatibleBrowserExecution(source, canonical, target) {
  return source.packId === canonical.packId && source.executable === canonical.executable &&
    source.args?.[0] === canonical.args?.[0] &&
    JSON.stringify([...(source.requiredCapabilities ?? [])].sort()) ===
      JSON.stringify([...(canonical.requiredCapabilities ?? [])].sort()) &&
    source.environment?.[target] === canonical.environment?.[target];
}

export function normalizeBrowserPrerequisiteTasks(tasks, canonicalTasks) {
  if (!Array.isArray(tasks) || !Array.isArray(canonicalTasks)) {
    throw new Error("Browser prerequisite normalization requires task lists");
  }
  const canonicalBrowsers=canonicalTasks.filter(task=>browserTargets(task).length);
  const replacements=new Map(),selectedKeys=new Set();
  for(const task of tasks){
    exactTask(task);
    const targets=browserTargets(task);
    if(!targets.length){selectedKeys.add(task.key);continue;}
    if(new Set(targets).size!==targets.length)
      throw new Error(`Ambiguous browser target declaration for ${task.key}`);
    const keys=new Set();
    for(const target of targets){
      const matches=canonicalBrowsers.filter(candidate=>browserTargets(candidate).includes(target));
      if(matches.length===0)throw new Error(`Missing current canonical browser target boundary for ${target}`);
      if(matches.length!==1)throw new Error(`Ambiguous current canonical browser target boundary for ${target}`);
      if(!compatibleBrowserExecution(task,matches[0],target))
        throw new Error(`Incompatible browser execution contract for ${target}`);
      keys.add(matches[0].key);selectedKeys.add(matches[0].key);
    }
    replacements.set(task.key,[...keys]);
  }
  const requestedByKey=new Map(tasks.map(task=>[task.key,task]));
  const sourceFor=(key)=>requestedByKey.get(key)??canonicalTasks.find(task=>task.key===key);
  const normalized=[];
  for(const task of [...canonicalTasks,...tasks]){
    if(!selectedKeys.has(task.key)||normalized.some(candidate=>candidate.key===task.key))continue;
    const source=sourceFor(task.key)??task;
    const prerequisites=source.prerequisiteTaskKeys?.flatMap(key=>replacements.get(key)??[key]);
    normalized.push(prerequisites===undefined?source:{...source,
      prerequisiteTaskKeys:[...new Set(prerequisites)]});
  }
  if(normalized.length!==selectedKeys.size)
    throw new Error("Browser prerequisite normalization has an ambiguous canonical task");
  const assigned=new Set();
  for(const task of normalized){
    for(const target of browserTargets(task)){
      if(assigned.has(target))throw new Error(`Browser target ${target} remains assigned more than once`);
      assigned.add(target);
    }
  }
  return normalized;
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
