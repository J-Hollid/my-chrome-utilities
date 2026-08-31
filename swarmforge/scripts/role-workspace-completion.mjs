import { execFile } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { completeRoleWorkspace } from "./workspace-lifecycle-policy.mjs";

const exec = promisify(execFile);

async function exists(target) {
  try { await access(target); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function handoffCount(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes:true });
    const counts = await Promise.all(entries.map((entry) => {
      if (entry.isFile() && entry.name.endsWith(".handoff")) return 1;
      if (entry.isDirectory()) return handoffCount(path.join(directory, entry.name));
      return 0;
    }));
    return counts.reduce((total, count) => total + count, 0);
  }
  catch (error) { if (error.code === "ENOENT") return 0; throw error; }
}

export async function roleSessionIsLive({ projectRoot, session }, { run = exec } = {}) {
  if (typeof projectRoot !== "string" || !projectRoot || typeof session !== "string" || !session) {
    return false;
  }
  let socket;
  try {
    socket = (await readFile(path.join(projectRoot, ".swarmforge", "tmux-socket"), "utf8")).trim();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
  if (!socket) return false;
  try {
    await run("tmux", ["-S", socket, "has-session", "-t", session]);
    return true;
  } catch (error) {
    const diagnostic = `${error.stderr ?? ""}\n${error.message ?? ""}`;
    if (/can't find session|no server running|no sessions/u.test(diagnostic)) return false;
    throw error;
  }
}

export async function roleTaskState({ workspace, ...roleWorkspace }, {
  sessionIsLive = roleSessionIsLive,
} = {}) {
  const inbox = path.join(workspace, ".swarmforge", "handoffs", "inbox");
  const [queued, inProcess, liveSession] = await Promise.all([
    handoffCount(path.join(inbox, "new")), handoffCount(path.join(inbox, "in_process")),
    sessionIsLive({ workspace, ...roleWorkspace }),
  ]);
  return { active:liveSession || queued + inProcess > 0,
    evidenceDispositionComplete:inProcess === 0 };
}

export async function readRoleWorkspaces(projectRoot) {
  const rows = (await readFile(path.join(projectRoot, ".swarmforge", "roles.tsv"), "utf8"))
    .split(/\r?\n/u).filter(Boolean);
  return rows.map((row) => {
    const [role,,workspace,session] = row.split("\t");
    return { role, workspace:path.resolve(workspace), session };
  }).filter(({ workspace }) => workspace !== path.resolve(projectRoot));
}

export async function completeInactiveRoleWorkspaces({ projectRoot, roles,
  taskState = roleTaskState, completeWorkspace = completeRoleWorkspace,
  workspaceExists = exists, sessionIsLive = roleSessionIsLive }) {
  const results = [];
  for (const roleWorkspace of roles) {
    const { role, workspace } = roleWorkspace;
    if (!await workspaceExists(workspace)) {
      results.push({ role, status:"absent", workspace });
      continue;
    }
    const state = await taskState({ projectRoot, ...roleWorkspace }, { sessionIsLive });
    if (state.active) {
      results.push({ role, status:"retained", workspace, reason:"workspace is active" });
      continue;
    }
    try {
      results.push({ role, ...await completeWorkspace({ projectRoot, workspace, ...state }) });
    } catch (error) {
      results.push({ role, status:"failed", workspace, reason:error.message });
    }
  }
  return results;
}

export async function runRoleWorkspaceCompletion(projectRoot) {
  return completeInactiveRoleWorkspaces({ projectRoot,
    roles:await readRoleWorkspaces(projectRoot) });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  runRoleWorkspaceCompletion(path.resolve(process.argv[2] ?? "."))
    .then((results) => {
      for (const result of results) process.stdout.write(`${JSON.stringify(result)}\n`);
      if (results.some(({ status }) => status === "failed")) process.exitCode = 1;
    })
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
