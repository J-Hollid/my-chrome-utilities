import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, open, unlink } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const restrictedCapabilities = new Set(["local-loopback", "git-metadata-write"]);

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
