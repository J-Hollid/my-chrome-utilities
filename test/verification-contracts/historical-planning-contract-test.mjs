import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { canonicalVerificationChangeSet, historicalVerificationRegistry } from
  "../../scripts/verification-planner/history/changes.mjs";
import { serializeVerificationRegistry } from
  "../../scripts/verification-registry/compiler.mjs";

const historicalBase = [{ id:"shell" }];
const historicalFragments = [{ version:1, order:1, pack:{ id:"verification_process" } }];
const historicalCanonical = serializeVerificationRegistry([
  historicalBase[0], historicalFragments[0].pack,
]);
assert.deepEqual(historicalVerificationRegistry({ canonical:historicalCanonical,
  base:serializeVerificationRegistry(historicalBase),
  fragments:[`${JSON.stringify(historicalFragments[0], null, 2)}\n`] }),
[{ id:"shell" }, { id:"verification_process" }],
"historical planning reconstructs migrated fragments at their own revision");
assert.deepEqual(historicalVerificationRegistry({ canonical:historicalCanonical }),
  [{ id:"shell" }, { id:"verification_process" }],
  "pre-migration revisions retain canonical compatibility loading");
assert.throws(() => historicalVerificationRegistry({
  canonical:serializeVerificationRegistry(historicalBase),
  base:serializeVerificationRegistry(historicalBase),
  fragments:[`${JSON.stringify(historicalFragments[0])}\n`],
}), /generated verification registry is stale/u,
"historical fragment reconstruction rejects stale canonical output");
assert.throws(() => historicalVerificationRegistry({
  canonical:historicalCanonical, base:serializeVerificationRegistry(historicalBase),
}), /incomplete authoritative inputs/u,
"historical fragment reconstruction fails closed when a migration input is missing");

const exec = promisify(execFile);
const repository = await mkdtemp(path.join(os.tmpdir(), "verification-history-contract-"));
try {
  await exec("git", ["init", "--quiet"], { cwd:repository });
  await writeFile(path.join(repository, "former.mjs"), "export const value = 1;\n");
  await exec("git", ["add", "former.mjs"], { cwd:repository });
  await exec("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid",
    "commit", "--quiet", "-m", "base"], { cwd:repository });
  const base = (await exec("git", ["rev-parse", "HEAD"], { cwd:repository })).stdout.trim();
  await rename(path.join(repository, "former.mjs"), path.join(repository, "current.mjs"));
  await exec("git", ["add", "-A"], { cwd:repository });
  await exec("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid",
    "commit", "--quiet", "-m", "rename"], { cwd:repository });
  const changeSet = await canonicalVerificationChangeSet({ base, repositoryRoot:repository });
  assert.deepEqual(changeSet.paths, ["current.mjs", "former.mjs"],
    "historical planning conserves both sides of a rename");
  assert.equal(changeSet.entries[0].status, "R", "rename identity remains explicit");
} finally {
  await rm(repository, { recursive:true, force:true });
}
