import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const exec=promisify(execFile);

function isOwnedWorkspace(projectRoot, workspace) {
  const worktrees = path.resolve(projectRoot, ".worktrees");
  const relative = path.relative(worktrees, path.resolve(workspace));
  return Boolean(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative);
}

export function roleWorkspaceCleanupDecision({ projectRoot, workspace, active = false,
  evidenceDispositionComplete = false, uncommittedChanges = false }) {
  if (!isOwnedWorkspace(projectRoot, workspace)) {
    throw new Error("Role workspace cleanup is limited to project .worktrees");
  }
  if (active) return { action:"retain", reason:"workspace is active" };
  if (uncommittedChanges) return { action:"retain", reason:"workspace has uncommitted changes" };
  if (!evidenceDispositionComplete) {
    return { action:"retain", reason:"evidence disposition is incomplete" };
  }
  return { action:"remove", reason:"task disposition is complete" };
}

export async function removeInactiveRoleWorkspace(input) {
  const decision = roleWorkspaceCleanupDecision(input);
  if (decision.action === "retain") {
    return { status:"retained", workspace:input.workspace, reason:decision.reason };
  }
  await input.removeWorktree(input.workspace);
  return { status:"removed", workspace:input.workspace };
}

function validBranch(branch) {
  if (typeof branch!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(branch)||
      branch.includes("..")) throw new Error("Role workspace branch is invalid");
}

async function defaultGit(projectRoot,...arguments_) {
  const result=await exec("git",["-C",projectRoot,...arguments_]);
  return result.stdout.trim();
}

async function defaultWorkspaceExists(workspace) {
  try { await access(workspace);return true; }
  catch (error) { if (error.code==="ENOENT") return false;throw error; }
}

export async function createRoleWorkspace({projectRoot,workspace,branch,
  git=(...arguments_)=>defaultGit(projectRoot,...arguments_),
  workspaceExists=()=>defaultWorkspaceExists(workspace)}) {
  roleWorkspaceCleanupDecision({projectRoot,workspace,active:true});
  validBranch(branch);
  if (await workspaceExists()) return {status:"existing",workspace};
  await git("worktree","add","--force","-B",branch,workspace,"HEAD");
  return {status:"created",workspace};
}

export async function completeRoleWorkspace({projectRoot,workspace,active=false,
  evidenceDispositionComplete=false,
  git=(...arguments_)=>defaultGit(projectRoot,...arguments_),
  workspaceStatus=()=>git("-C",workspace,"status","--porcelain")}) {
  const uncommittedChanges=Boolean((await workspaceStatus()).trim());
  return removeInactiveRoleWorkspace({projectRoot,workspace,active,evidenceDispositionComplete,
    uncommittedChanges,removeWorktree:async(target)=>{
      await git("worktree","remove",target);
      await git("worktree","prune");
    }});
}

export async function runWorkspaceLifecycleCommand([operation,projectRoot,workspace,value]) {
  if (operation==="create"&&value) {
    return createRoleWorkspace({projectRoot:path.resolve(projectRoot),
      workspace:path.resolve(workspace),branch:value});
  }
  if (operation==="complete"&&value==="evidence-complete") {
    return completeRoleWorkspace({projectRoot:path.resolve(projectRoot),
      workspace:path.resolve(workspace),evidenceDispositionComplete:true});
  }
  throw new Error("Use workspace-lifecycle-policy.mjs create <project-root> <workspace> <branch> | complete <project-root> <workspace> evidence-complete");
}

if (process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url) {
  runWorkspaceLifecycleCommand(process.argv.slice(2))
    .then((result)=>process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error)=>{console.error(error.message);process.exitCode=1;});
}
