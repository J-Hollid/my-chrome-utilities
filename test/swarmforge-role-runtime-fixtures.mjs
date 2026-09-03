import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

export const active={id:"active-handoff",task:"active-task"};
export const queued={id:"queued-handoff",task:"queued-task",from:"architect"};
export const exec=promisify(execFile);

export function handoff(value) {
  return `${Object.entries(value).map(([key,item])=>`${key}: ${item}`).join("\n")}\n\nwork\n`;
}

export async function roleRuntimeRoot(name) {
  return mkdtemp(path.join(os.tmpdir(),`swarmforge-role-${name}-`));
}

export async function writeHandoff(file,value) {
  await mkdir(path.dirname(file),{recursive:true});
  await writeFile(file,handoff(value));
  return file;
}

export async function removeRoleRuntimeRoot(root) {
  await rm(root,{recursive:true,force:true});
}
