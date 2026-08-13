import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const fixture = await mkdtemp(path.join(os.tmpdir(), "package-clean-checkout-"));

async function packageIn(root) {
  return exec(process.execPath, ["scripts/package.mjs"], {
    cwd:root, maxBuffer:32 * 1024 * 1024,
  });
}

try {
  await exec("git", ["clone", "--no-local", repositoryRoot, fixture], {
    maxBuffer:32 * 1024 * 1024,
  });
  const root = fixture;
  // Dependencies are immutable inputs shared from the checkout; all build and
  // package outputs remain isolated in this temporary clone.
  await symlink(path.join(repositoryRoot, "node_modules"), path.join(root, "node_modules"), "dir");
  const manifestPath = path.join(root, "dist", ".dist-artifact.json");
  await rm(manifestPath, { force:true });
  const first = await packageIn(root);
  assert.match(first.stdout, /build\/package\/my-chrome-utilities\.zip/u,
    "package succeeds after rebuilding an absent dist manifest");

  await writeFile(manifestPath, "{\n");
  await assert.rejects(packageIn(root), /invalid|manifest|dist artifact/iu,
    "a malformed present dist manifest fails closed");

  const freshManifest = JSON.parse(await readFile(path.join(repositoryRoot, "dist", ".dist-artifact.json"), "utf8"));
  await writeFile(manifestPath, `${JSON.stringify(freshManifest)}\n`);
  await writeFile(path.join(root, "specification-builder.css"),
    `${await readFile(path.join(root, "specification-builder.css"), "utf8")}\n/* stale fixture input */\n`);
  await assert.rejects(packageIn(root), /stale|fresh dist artifact|input/iu,
    "a stale present dist manifest fails closed");
} finally {
  await rm(fixture, { recursive:true, force:true });
}

console.log("clean-checkout package contract passed");
