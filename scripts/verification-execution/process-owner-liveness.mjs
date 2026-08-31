import { readFile } from "node:fs/promises";

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; }
  catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

export async function currentProcessStartIdentity(pid, { read = readFile } = {}) {
  if (!Number.isInteger(pid) || pid < 1) {
    throw new Error("Process start identity requires a positive process id");
  }
  const [bootIdentity, processStat] = await Promise.all([
    read("/proc/sys/kernel/random/boot_id", "utf8"),
    read(`/proc/${pid}/stat`, "utf8"),
  ]);
  const commandEnd = processStat.lastIndexOf(")");
  const fields = commandEnd < 0 ? [] : processStat.slice(commandEnd + 1).trim().split(/\s+/u);
  const startTicks = fields[19];
  const boot = bootIdentity.trim();
  if (!boot || !/^\d+$/u.test(startTicks ?? "")) {
    throw new Error(`Process ${pid} has no stable start identity`);
  }
  return `${boot}:${startTicks}`;
}

export async function processOwnerIsLive(owner, {
  currentStartIdentity = currentProcessStartIdentity,
} = {}) {
  if (!Number.isInteger(owner?.pid) || owner.pid < 1) return false;
  if (typeof owner.processStartIdentity !== "string" || !owner.processStartIdentity) {
    return processIsAlive(owner.pid);
  }
  try {
    return await currentStartIdentity(owner.pid) === owner.processStartIdentity;
  } catch (error) {
    if (["ENOENT", "ESRCH"].includes(error.code)) return false;
    throw error;
  }
}
