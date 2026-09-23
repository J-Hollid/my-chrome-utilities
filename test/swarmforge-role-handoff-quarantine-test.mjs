import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { quarantineCompletedDuplicate } from "../swarmforge/scripts/role-handoff-quarantine.mjs";
import { receiveNextBatch } from "../swarmforge/scripts/role-handoff-batch-receive.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "handoff-quarantine-"));
const digest = (text) => createHash("sha256").update(text).digest("hex");
const body = ["to: architect", "recipient: architect", "priority: 00", "type: git_handoff",
  "task: example", "commit: 0123456789", "base: abcdef0123", "readiness: review-ready",
  "verified: review-ready", "", ""].join("\n");
const completed = `id: delivered-example\nfrom: refactorer\ncompleted_at: 2026-09-05T10:00:00Z\n${body}`;

async function fixture(name, source = body, prior = completed) {
  const worktree = path.join(root, name);
  const inbox = path.join(worktree, ".swarmforge/handoffs/inbox");
  await mkdir(path.join(inbox, "new"), {recursive: true});
  await mkdir(path.join(inbox, "completed"), {recursive: true});
  await writeFile(path.join(inbox, "new", "stale.handoff"), source);
  await writeFile(path.join(inbox, "completed", "original.handoff"), prior);
  return {worktree, queuedName: "stale.handoff", completedName: "original.handoff",
    expectedDigest: digest(source)};
}

try {
  const valid = await fixture("valid");
  await assert.rejects(receiveNextBatch(valid.worktree), /Role handoff has no id/u);
  const result = await quarantineCompletedDuplicate(valid);
  assert.equal(await readFile(result.retained, "utf8"), body);
  assert.equal(await readFile(path.join(valid.worktree,
    ".swarmforge/handoffs/inbox/completed/original.handoff"), "utf8"), completed);
  assert.deepEqual(await readdir(path.join(valid.worktree, ".swarmforge/handoffs/inbox/new")), []);
  const record = await readFile(result.recordFile, "utf8");
  assert.deepEqual(await quarantineCompletedDuplicate(valid), result);
  assert.equal(await readFile(result.recordFile, "utf8"), record);
  assert.equal(await receiveNextBatch(valid.worktree), null);

  for (const [name, source, prior, expected] of [
    ["identified", `id: valid\n${body}`, completed, /identified handoff/u],
    ["other-candidate", body, completed.replace("0123456789", "9876543210"), /exact completed/u],
    ["not-completed", body, completed.replace("completed_at:", "created_at:"), /exact completed/u],
    ["duplicate-field", `task: different\n${body}`, completed, /Duplicate/u],
  ]) {
    const item = await fixture(name, source, prior);
    await assert.rejects(quarantineCompletedDuplicate(item), expected);
    assert.equal(await readFile(path.join(item.worktree,
      ".swarmforge/handoffs/inbox/new/stale.handoff"), "utf8"), source);
  }
  const changed = await fixture("changed");
  await assert.rejects(quarantineCompletedDuplicate({...changed, expectedDigest: "0".repeat(64)}),
    /digest changed/u);
  await assert.rejects(quarantineCompletedDuplicate({...changed, queuedName: "../stale.handoff"}),
    /basenames/u);

  const busy = await fixture("busy");
  const active = path.join(busy.worktree, ".swarmforge/handoffs/inbox/in_process");
  await mkdir(active, {recursive: true});
  await writeFile(path.join(active, "current.handoff"), `id: active\n${body}`);
  await assert.rejects(quarantineCompletedDuplicate(busy), /idle role/u);

  const interrupted = await fixture("interrupted");
  const directory = path.join(interrupted.worktree, ".swarmforge/handoffs/quarantine",
    interrupted.expectedDigest);
  await mkdir(directory, {recursive: true});
  await writeFile(path.join(directory, "record.json"), JSON.stringify({version: 1, source: "other"}));
  await assert.rejects(quarantineCompletedDuplicate(interrupted), /record conflicts/u);
} finally {
  await rm(root, {recursive: true, force: true});
}
console.log("Role handoff quarantine tests passed.");
