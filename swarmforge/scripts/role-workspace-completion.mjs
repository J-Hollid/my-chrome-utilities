import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { completeRoleWorkspace } from "./workspace-lifecycle-policy.mjs";

async function exists(target) {
  try { await access(target); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function handoffCount(directory) {
  try { return (await readdir(directory)).filter((name) => name.endsWith(".handoff")).length; }
  catch (error) { if (error.code === "ENOENT") return 0; throw error; }
}

export async function roleTaskState({ workspace }) {
  const inbox = path.join(workspace, ".swarmforge", "handoffs", "inbox");
  const [queued, inProcess] = await Promise.all([
    handoffCount(path.join(inbox, "new")), handoffCount(path.join(inbox, "in_process")),
  ]);
  return { active:queued + inProcess > 0, evidenceDispositionComplete:inProcess === 0 };
}

export async function readRoleWorkspaces(projectRoot) {
  const rows = (await readFile(path.join(projectRoot, ".swarmforge", "roles.tsv"), "utf8"))
    .split(/\r?\n/u).filter(Boolean);
  return rows.map((row) => {
    const [role,,workspace] = row.split("\t");
    return { role, workspace:path.resolve(workspace) };
  }).filter(({ workspace }) => workspace !== path.resolve(projectRoot));
}

export async function completeInactiveRoleWorkspaces({ projectRoot, roles,
  taskState = roleTaskState, completeWorkspace = completeRoleWorkspace,
  workspaceExists = exists }) {
  const results = [];
  for (const roleWorkspace of roles) {
    const { role, workspace } = roleWorkspace;
    if (!await workspaceExists(workspace)) {
      results.push({ role, status:"absent", workspace });
      continue;
    }
    const state = await taskState(roleWorkspace);
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
