import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { canonicalVerificationChangeSet } from
  "../../scripts/verification-changes.mjs";
import { compatibleHistoricalOwnerTransition } from
  "../../scripts/verification-packs.mjs";

const exec = promisify(execFile);
const repository = await mkdtemp(path.join(os.tmpdir(), "verification-history-contract-"));
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

const transitionedPath = "scripts/stable-facade.mjs";
const transitionRegistry = [{id:"shell"}, {id:"verification_process", unit:["test/contract.mjs"],
  verificationSlices:[{id:"execution", sourcePaths:[transitionedPath], sourcePrefixes:[],
    tasks:["unit:test/contract.mjs"], prerequisites:[], consumers:[], historicalOwners:["shell"],
    observableBoundary:"Reviewed stable-facade ownership transition"}]}];
assert.equal(compatibleHistoricalOwnerTransition(transitionRegistry, transitionedPath,
  "shell", "verification_process"), true,
"a reviewed slice declares its compatible former owner explicitly");
assert.equal(compatibleHistoricalOwnerTransition(transitionRegistry, transitionedPath,
  "other", "verification_process"), false,
"an undeclared historical owner remains incompatible");
