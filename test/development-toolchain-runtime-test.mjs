import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {mkdtemp, mkdir, readFile, writeFile, symlink, rm, readdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";
import {main} from "../swarmforge/toolchain/cli.mjs";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = await mkdtemp(path.join(root, "tmp/development-toolchain-"));
const lock = JSON.parse(await readFile(path.join(root, "swarmforge/toolchain.lock.json"), "utf8"));
const pin = {provider:"fixture", revision:"a".repeat(40), sha256:"b".repeat(64)};
const fragmentPath = path.join(fixture, "swarmforge/toolchain/optional-tools.lock.json");
const lockPath = path.join(fixture, "swarmforge/toolchain.lock.json");
const coreResults = [];
try {
  await mkdir(path.dirname(fragmentPath), {recursive:true});
  await writeFile(lockPath, JSON.stringify(lock));
  await writeFile(fragmentPath, JSON.stringify({version:1, tools:{navigator:pin}}));
  const calls = [];
  const providers = {fixture:{
    inspect:async ({name, pin:actual}) => {
      assert.deepEqual(actual, pin); calls.push(["inspect", name]); return {available:false};
    },
    provision:async ({name, pin:actual}) => {
      assert.deepEqual(actual, pin); calls.push(["provision", name]); return {available:true};
    },
  }};
  const options = {repositoryRoot:fixture, providers};
  assert.equal((await main(["inspect", "navigator"], options)).available, false);
  assert.deepEqual(calls, [["inspect", "navigator"]]);
  assert.equal((await main(["provision", "navigator"], options)).available, true);
  for (const args of [["provision"], ["provision", "absent"]]) {
    await assert.rejects(main(args, options), /request|missing-pin/u);
  }
  assert.deepEqual(calls, [["inspect", "navigator"], ["provision", "navigator"]]);
  assert.deepEqual(await readdir(path.dirname(fragmentPath)), ["optional-tools.lock.json"]);
  await writeFile(fragmentPath, JSON.stringify({version:1, tools:{node:pin}}));
  await assert.rejects(main(["provision", "node"], options), /authority-conflict/u);
  assert.equal(calls.length, 2);
  await rm(fragmentPath);
  await assert.rejects(main(["inspect", "navigator"], options), /ENOENT/u);

  // Run the unchanged production strict checker in an isolated worktree-shaped fixture.
  await mkdir(path.join(fixture, "scripts"));
  await writeFile(path.join(fixture, "scripts/check-swarmforge-toolchain.mjs"),
    await readFile(path.join(root, "scripts/check-swarmforge-toolchain.mjs")));
  for (const entry of ["vendor", "node_modules", "deps.edn", "package.json", "package-lock.json"]) {
    await symlink(path.join(root, entry), path.join(fixture, entry));
  }
  const checker = path.join(fixture, "scripts/check-swarmforge-toolchain.mjs");
  const run = (env = process.env) => exec(process.execPath, [checker, "--strict-runtime"], {cwd:fixture, env});
  const passing = await run();
  assert.match(passing.stdout, /npm-direct-dependencies: 4 exact/u);
  coreResults.push(["all locked runtime requirements pass", "pass"]);
  await writeFile(lockPath, JSON.stringify({...lock, node:{...lock.node, version:"0.0.1"}}));
  await assert.rejects(run(), /Node.*lock|Node.*0\.0\.1/iu);
  coreResults.push(["Node differs from the lock", "fail"]);
  await writeFile(lockPath, JSON.stringify(lock));
  await rm(path.join(fixture, "node_modules"));
  await mkdir(path.join(fixture, "node_modules"));
  await assert.rejects(run(), /TypeScript.*not installed/u);
  coreResults.push(["TypeScript is missing", "fail"]);
  await rm(path.join(fixture, "node_modules"), {recursive:true});
  await symlink(path.join(root, "node_modules"), path.join(fixture, "node_modules"));
  await mkdir(path.join(fixture, "bin"));
  await writeFile(path.join(fixture, "bin/bb"), "#!/bin/sh\nprintf 'babashka v0.0.1\\n'\n", {mode:0o755});
  await assert.rejects(run({...process.env, PATH:`${fixture}/bin:${process.env.PATH}`}), /Babashka lock mismatch/u);
  coreResults.push(["Babashka is invalid", "fail"]);
  const altered = structuredClone(lock);
  altered["acceptance-pipeline-specification"].contentSha256 = "0".repeat(64);
  await writeFile(lockPath, JSON.stringify(altered));
  await assert.rejects(run(), /Vendored APS content differs/u);
  coreResults.push(["the vendored APS digest differs", "fail"]);
  assert.equal(calls.length, 2, "core startup must not dispatch optional providers");
  assert.deepEqual(await readdir(path.dirname(fragmentPath)), [], "core checks do not install optional tools");
  const cli = path.join(root, "swarmforge/toolchain/cli.mjs");
  await assert.rejects(exec(process.execPath, [cli, "provision"], {cwd:fixture}), /request/u);
  await assert.rejects(exec(process.execPath, [cli, "inspect", "navigator"], {cwd:fixture}), /missing-pin/u);
  console.log(JSON.stringify({developmentToolchainRuntime:{coreResults, dispatch:true,
    missingOptionalIndependent:true, cliBoundToOwnWorktree:true}}));
} finally {
  await rm(fixture, {recursive:true, force:true});
}
