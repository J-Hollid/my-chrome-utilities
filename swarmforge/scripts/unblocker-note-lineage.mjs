#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { activeRoleWork, handoffIdentity, handoffLineageDigest } from
  "./role-handoff-identity.mjs";

const exec=promisify(execFile);
async function git(root,...args) {
  return (await exec("git",args,{cwd:root,encoding:"utf8"})).stdout.trim();
}

async function recordedBatchSource(worktree,active) {
  const pairs=[];
  for (const file of active.files) {
    const identity=handoffIdentity(await readFile(file,"utf8")),source=identity.lineage??identity;
    if (!source.base||!source.commit) {
      throw new Error("Note delivery requires one exact recorded base and commit for the active batch");
    }
    pairs.push({base:await git(worktree,"rev-parse",`${source.base}^{commit}`),
      commit:await git(worktree,"rev-parse",`${source.commit}^{commit}`)});
  }
  const exactPairs=new Set(pairs.map(({base,commit})=>`${base}:${commit}`));
  if (exactPairs.size!==1) {
    throw new Error("Note delivery requires one exact recorded base and commit for the active batch");
  }
  return {handoff:active.identity.id,task:active.identity.task,...pairs[0]};
}

export async function recordedNoteLineage(worktree) {
  const active=await activeRoleWork(worktree),identity=active?.identity;
  if (!identity) throw new Error("Note delivery requires one recorded active handoff");
  const source=active.kind==="batch"?await recordedBatchSource(worktree,active):
    identity.lineage??{handoff:identity.id,task:identity.task,
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
