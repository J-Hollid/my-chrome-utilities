import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { candidateRepositoryPaths } from
  "../../scripts/verification-registry/candidate-inventory.mjs";
import { compileVerificationRegistry, serializeVerificationRegistry } from
  "../../scripts/verification-registry/compiler.mjs";
import { loadCompiledVerificationRegistry } from
  "../../scripts/verification-registry/loader.mjs";
import { loadVerificationPacks, verificationInventory } from
  "../../scripts/verification-planner/tasks/planner.mjs";

const packs = await loadVerificationPacks();
assert.equal(new Set(packs.map(({ id }) => id)).size, packs.length,
  "the authoritative registry exposes every pack identity once");
const inventory = await verificationInventory();
for (const [kind, paths] of Object.entries(inventory)) {
  assert.equal(new Set(paths).size, paths.length,
    `candidate inventory exposes every ${kind} repository path once`);
}
assert.equal(typeof candidateRepositoryPaths, "function",
  "candidate inventory has a stable registry-owned seam");
const base = [{ id:"shell" }];
const fragments = [{ version:1, order:1, pack:{ id:"verification_process" } }];
const compiled = compileVerificationRegistry({ base, fragments });
assert.deepEqual(compiled.map(({ id }) => id), ["shell", "verification_process"],
  "registry compilation preserves base order followed by explicit fragment order");
assert.equal(serializeVerificationRegistry(compiled), serializeVerificationRegistry(structuredClone(compiled)),
  "registry serialization is deterministic");
assert.throws(() => compileVerificationRegistry({ base, fragments:[
  { order:1, pack:{ id:"verification_process" } },
]}), /schema version 1/u, "fragment schema versions are explicit rather than inferred");
assert.throws(() => compileVerificationRegistry({ base, fragments:[
  fragments[0], { ...fragments[0], pack:{ id:"other" } },
]}), /fragment order must be unique/u, "fragment ordering has one authority");

const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "verification-registry-fragment-"));
try {
  await mkdir(path.join(fixtureRoot, "verification/manifests"), { recursive:true });
  await Promise.all([
    writeFile(path.join(fixtureRoot, "verification/packs.base.json"),
      serializeVerificationRegistry(base)),
    writeFile(path.join(fixtureRoot, "verification/manifests/process.json"),
      `${JSON.stringify(fragments[0], null, 2)}\n`),
    writeFile(path.join(fixtureRoot, "verification/packs.json"),
      serializeVerificationRegistry(compiled)),
  ]);
  assert.deepEqual(await loadCompiledVerificationRegistry({ repositoryRoot:fixtureRoot }), compiled,
    "the loader returns the validated fragment assembly");
  await writeFile(path.join(fixtureRoot, "verification/packs.json"),
    serializeVerificationRegistry(base));
  await assert.rejects(
    loadCompiledVerificationRegistry({ repositoryRoot:fixtureRoot }),
    /packs\.json is stale/u,
    "a stale generated compatibility registry fails closed",
  );
} finally {
  await rm(fixtureRoot, { recursive:true, force:true });
}
assert.equal(await readFile(new URL("../../verification/packs.json", import.meta.url), "utf8"),
  serializeVerificationRegistry(await loadCompiledVerificationRegistry()),
  "the checked canonical registry is byte-identical to its authoritative inputs");
