import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { candidateRepositoryPaths } from
  "../scripts/verification-registry/candidate-inventory.mjs";

const exec = promisify(execFile);
const repository = await mkdtemp(path.join(os.tmpdir(), "verification-candidate-inventory-"));

try {
  await exec("git", ["init", "--quiet"], { cwd:repository });
  await writeFile(path.join(repository, "tracked.mjs"), "export const tracked = true;\n");
  await exec("git", ["add", "tracked.mjs"], { cwd:repository });
  await exec("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid",
    "commit", "--quiet", "-m", "base"], { cwd:repository });

  await writeFile(path.join(repository, "personal-notes.xlsx"), "unrelated\n");
  await writeFile(path.join(repository, "staged-policy.mjs"), "export const staged = true;\n");
  await exec("git", ["add", "staged-policy.mjs"], { cwd:repository });

  const inventory = await candidateRepositoryPaths({ repositoryRoot:repository });
  assert.deepEqual(inventory, ["staged-policy.mjs", "tracked.mjs"],
    "candidate inventory includes tracked and explicitly staged paths but excludes unrelated untracked files");
} finally {
  await rm(repository, { recursive:true, force:true });
}
