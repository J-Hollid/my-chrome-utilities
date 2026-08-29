#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { verificationProcessCompatibilitySuccessors } from
  "./verification-policy/contracts.mjs";
import {
  assertVerificationContractConservation,
  refreshVerificationContractConservationManifest,
  verificationContractSourceState,
} from "./verification-registry/contract-conservation.mjs";

const exec = promisify(execFile);
const repositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const defaultManifestPath = "test/fixtures/verification-process-contract-conservation.json";
const authorityPath = "features/modular-verification-packs.feature";
const authorityScenario = "Modular verification packs 221";

function parseOptions(arguments_) {
  if (arguments_[0] !== "refresh" && arguments_[0] !== "check") {
    throw new Error("Use refresh-verification-contract-conservation.mjs check|refresh [--manifest path] [--authority commit]");
  }
  const options = { mode:arguments_[0], manifest:defaultManifestPath };
  for (let index=1; index<arguments_.length; index+=2) {
    const option=arguments_[index], value=arguments_[index+1];
    if (!value) throw new Error(`${option} requires a value`);
    if (option === "--manifest") options.manifest=value;
    else if (option === "--authority") options.authority=value;
    else throw new Error(`Unknown conservation refresh option: ${option}`);
  }
  if (options.mode === "refresh" && !/^[a-f0-9]{40}$/u.test(options.authority ?? "")) {
    throw new Error("Explicit refresh requires one full authority commit");
  }
  if (options.mode === "check" && options.authority !== undefined) {
    throw new Error("Read-only check does not accept refresh authority");
  }
  return options;
}

async function isAncestor(commit) {
  try {
    await exec("git", ["merge-base", "--is-ancestor", commit, "HEAD"], {cwd:repositoryRoot});
    return true;
  } catch { return false; }
}

async function sourceState() {
  return verificationContractSourceState(Object.fromEntries(await Promise.all(
    verificationProcessCompatibilitySuccessors.map(async(owner) => [
      owner, await readFile(path.join(repositoryRoot, owner), "utf8"),
    ]),
  )));
}

async function ancestralAuthorities(manifest, refreshAuthority) {
  const commits = new Set([
    ...(manifest.transitions ?? []).map(({authority}) => authority?.commit),
    ...(manifest.generations ?? []).map(({authority}) => authority?.commit),
    refreshAuthority,
  ].filter(Boolean));
  const ancestral = new Set();
  for (const commit of commits) if (await isAncestor(commit)) ancestral.add(commit);
  return ancestral;
}

export async function runVerificationContractConservationCommand(arguments_) {
  const options=parseOptions(arguments_);
  const manifestPath=path.resolve(repositoryRoot, options.manifest);
  const defaultTarget=path.resolve(repositoryRoot, defaultManifestPath);
  const temporaryRoot=`${path.resolve(os.tmpdir())}${path.sep}`;
  if (manifestPath !== defaultTarget && !manifestPath.startsWith(temporaryRoot)) {
    throw new Error("Conservation refresh can write only the canonical manifest or an isolated temporary fixture");
  }
  const manifest=JSON.parse(await readFile(manifestPath, "utf8"));
  const state=await sourceState();
  const ancestralAuthorityCommits=await ancestralAuthorities(manifest, options.authority);
  if (options.mode === "check") {
    assertVerificationContractConservation(manifest, state.leavesByOwner,
      {sourceSha256:state.sourceSha256, ancestralAuthorityCommits});
    return {mode:"check", manifest:manifestPath, changed:false};
  }
  if (!ancestralAuthorityCommits.has(options.authority)) {
    throw new Error("Refresh authority is not ancestral to the current candidate");
  }
  const authority={commit:options.authority, path:authorityPath, scenario:authorityScenario};
  const refreshed=refreshVerificationContractConservationManifest(manifest, state, {
    authority, id:`current-${options.authority.slice(0, 10)}`, ancestralAuthorityCommits,
  });
  const output=`${JSON.stringify(refreshed, null, 2)}\n`;
  const prior=`${JSON.stringify(manifest, null, 2)}\n`;
  if (output !== prior) await writeFile(manifestPath, output, {flag:"w"});
  return {mode:"refresh", manifest:manifestPath, changed:output !== prior};
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runVerificationContractConservationCommand(process.argv.slice(2))
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error.message); process.exitCode=1; });
}
