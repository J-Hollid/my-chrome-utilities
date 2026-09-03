#!/usr/bin/env node
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { activeRoleWork, handoffLineageDigest } from "./role-handoff-identity.mjs";

const exec=promisify(execFile);
async function git(root,...args) {
  return (await exec("git",args,{cwd:root,encoding:"utf8"})).stdout.trim();
}

export async function recordedNoteLineage(worktree) {
  const active=await activeRoleWork(worktree),identity=active?.identity;
  if (!identity) throw new Error("Note delivery requires one recorded active handoff");
  const source=identity.lineage??{handoff:identity.id,task:identity.task,
    base:identity.base,commit:identity.commit};
  if (!source.handoff||!source.task||!source.base||!source.commit) {
    throw new Error("Note delivery requires an exact recorded base and commit");
  }
  const lineage={handoff:source.handoff,task:source.task,
    base:await git(worktree,"rev-parse",`${source.base}^{commit}`),
    commit:await git(worktree,"rev-parse",`${source.commit}^{commit}`)};
  await git(worktree,"merge-base","--is-ancestor",lineage.base,lineage.commit);
  return {...lineage,digest:handoffLineageDigest(lineage)};
}

export function renderRecordedNoteLineage(lineage) {
  return [`lineage-handoff: ${lineage.handoff}`,`lineage-task: ${lineage.task}`,
    `lineage-base: ${lineage.base}`,`lineage-commit: ${lineage.commit}`,
    `lineage-digest: ${lineage.digest}`].join("\n");
}

if (process.argv[1]===new URL(import.meta.url).pathname) {
  const root=path.resolve(process.argv[2]??".");
  const lineage=await recordedNoteLineage(root);
  process.stdout.write(`${renderRecordedNoteLineage(lineage)}\n`);
}
