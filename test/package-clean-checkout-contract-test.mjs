import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const fixture = await mkdtemp(path.join(os.tmpdir(), "package-clean-checkout-"));

async function run(script, root) {
  return exec(process.execPath, [script], { cwd:root, maxBuffer:32 * 1024 * 1024 });
}

try {
  await exec("git", ["clone", "--no-local", repositoryRoot, fixture], {
    maxBuffer:32 * 1024 * 1024,
  });
  const root = fixture;
  await symlink(path.join(repositoryRoot, "node_modules"), path.join(root, "node_modules"), "dir");
  await rm(path.join(root, "dist", ".dist-artifact.json"));
  await assert.rejects(run("scripts/package.mjs", root), /ENOENT|dist artifact|manifest/iu,
    "a clean checkout must run the validated build prerequisite before packaging");

  await run("scripts/build.mjs", root);
  const first = await run("scripts/package.mjs", root);
  assert.match(first.stdout, /build\/package\/my-chrome-utilities\.zip/u,
    "package consumes the explicitly built, validated dist artifact");

  const manifestPath = path.join(root, "dist", ".dist-artifact.json");
  await writeFile(manifestPath, "{\n");
  await assert.rejects(run("scripts/package.mjs", root), /invalid|manifest|dist artifact/iu,
    "a malformed present dist manifest fails closed");

  await run("scripts/build.mjs", root);
  await writeFile(path.join(root, "specification-builder.css"),
    `${await readFile(path.join(root, "specification-builder.css"), "utf8")}\n/* stale fixture input */\n`);
  await assert.rejects(run("scripts/package.mjs", root), /stale|fresh dist artifact|input/iu,
    "a stale present dist manifest fails closed");
} finally {
  await rm(fixture, { recursive:true, force:true });
}

console.log("clean-checkout package contract passed");
