import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const launcher = path.join(root, "swarmforge/scripts/swarmforge.sh");
const launcherBb = path.join(root, "swarmforge/scripts/swarmforge.bb");
const {
  atomicExchangeDirectories,
  atomicPromoteDirectory,
  babashkaBootstrapMessage,
  ensureLockedGitCheckout,
  installBabashkaArchive,
  main: checkToolchain,
  parseArgs,
  recoverStrandedGitCheckout,
  usage,
  validateBabashkaTarget,
  validateDirectNpmDependencies,
  validateNodeArchiveTarget,
} = await import("../scripts/check-swarmforge-toolchain.mjs");

async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      ...options,
    }, (error, stdout, stderr) => {
      if (error && typeof error.code !== "number") {
        reject(error);
        return;
      }
      resolve({ status: error?.code || 0, stdout, stderr });
    });
  });
}

assert.match(usage, /--strict-runtime/u);
assert.match(usage, /--provision TOOL/u);
assert.match(usage, /--validate-local-babashka/u);
assert.match(usage, /--print-babashka-guidance/u);
assert.match(usage, /node, babashka/u);
assert.equal(parseArgs(["--help"]).help, true);
assert.equal(parseArgs(["--validate-local-babashka"]).validateLocalBabashka, true);

for (const badArgs of [["--unknown-option"], ["--require"], ["clj-mutate"]]) {
  assert.throws(() => parseArgs(badArgs), undefined,
    `checker unexpectedly accepted ${badArgs.join(" ")}`);
}

const lock = JSON.parse(await readFile(path.join(root, "swarmforge/toolchain.lock.json"), "utf8"));
const toolchainSource = await readFile(path.join(root, "scripts/check-swarmforge-toolchain.mjs"), "utf8");
assert.ok(toolchainSource.includes('const extractionStage = uniqueSibling(target, "extract");'),
  "Node provisioning must extract into a unique sibling before final promotion");
assert.ok(toolchainSource.includes('const stage = uniqueSibling(target, "clone");'),
  "Git-tool provisioning must clone into a unique sibling before final promotion");
assert.ok(toolchainSource.includes('const stage = uniqueSibling(target, "displaced");'),
  "Git-tool replacement residue must use the recovery-owned displaced prefix");
assert.ok(toolchainSource.includes("await validateNodeArchiveTarget(archive, target, lock.node.version);"),
  "an existing project-local Node tree must be deeply checked against its verified archive");
assert.ok(!toolchainSource.includes("entry.repository, target]"),
  "Git tools must never be cloned directly into their final target");
assert.doesNotMatch(
  toolchainSource,
  /exec\("git", \["(?:fetch|checkout)"[^\n]+\{ cwd: target \}/u,
  "an existing optional Git-tool target must never be fetched or checked out in place",
);
const launcherSource = await readFile(launcherBb, "utf8");
assert.match(launcherSource, /\(def required-helpers[\s\S]*?"browser-test"/u,
  "the approval-friendly browser helper must be validated before launch mutation");
assert.match(launcherSource, /\(def required-helpers[\s\S]*?"handoff_sequence\.bb"/u,
  "the shared crash-safe handoff sequence allocator must be validated before launch mutation");
const babashkaTaskSource = await readFile(path.join(root, "bb.edn"), "utf8");
const acceptanceTestDirectory = path.join(root, "test/acceptance");
const acceptanceTestFiles = (await readdir(acceptanceTestDirectory))
  .filter((name) => name.endsWith("_test.clj"))
  .sort();
assert.ok(acceptanceTestFiles.length > 0, "the aggregate Clojure test inventory must not be empty");
for (const name of acceptanceTestFiles) {
  const source = await readFile(path.join(acceptanceTestDirectory, name), "utf8");
  const namespace = source.match(/^\(ns\s+([^\s)]+)/mu)?.[1];
  assert.ok(namespace, `${name} must declare a Clojure namespace`);
  assert.match(source, /\(deftest\s/u, `${name} must remain a real test namespace`);
  assert.ok(babashkaTaskSource.includes(`[${namespace}]`),
    `${namespace} must be required by the aggregate Babashka tasks`);
  assert.ok(babashkaTaskSource.includes(`'${namespace}`),
    `${namespace} must be executed by an aggregate Clojure test lane`);
}
const runMainSource = launcherSource.slice(
  launcherSource.indexOf("(defn run-main!"),
  launcherSource.indexOf("(defn test-terminal-bridge!"),
);
assert.ok(runMainSource.indexOf("(check-host-dependencies!)") < runMainSource.indexOf("(initialize-git-repo! ctx)"),
  "all host dependencies, including rg, must validate before Git mutation");
assert.match(
  runMainSource,
  /\(let \[ctx \(prepare-ctx \(context root\)\)\]\s*\(check-backend-dependencies! ctx\)\s*\(check-helper-scripts! ctx\)\s*\(let \[ctx \(detect-tmux-base-indexes ctx\)\]\s*\(initialize-git-repo! ctx\)/u,
  "project configuration, backend dependencies, and helpers must validate before tmux or Git mutation",
);
await checkToolchain([]);
const currentNode = process.version.replace(/^v/u, "");
if (currentNode === lock.node.version) {
  await checkToolchain(["--strict-runtime"]);
} else {
  await assert.rejects(checkToolchain(["--strict-runtime"]), /--provision node/u);
}

const dependencyFixture = await mkdtemp(path.join(os.tmpdir(), "swarmforge-dependency-contract-"));
try {
  const fixtureManifest = {
    dependencies: { "runtime-dependency": "^1.0.0" },
    devDependencies: { "@fixture/build-dependency": "~2.3.0" },
  };
  const fixtureLock = {
    lockfileVersion: 3,
    packages: {
      "": {
        dependencies: { "runtime-dependency": "^1.0.0" },
        devDependencies: { "@fixture/build-dependency": "~2.3.0" },
      },
      "node_modules/runtime-dependency": { version: "1.4.0" },
      "node_modules/@fixture/build-dependency": { version: "2.3.4" },
      "node_modules/platform-only-transitive": { version: "9.0.0", optional: true },
    },
  };
  const runtimeManifest = path.join(dependencyFixture, "node_modules/runtime-dependency/package.json");
  const buildManifest = path.join(dependencyFixture, "node_modules/@fixture/build-dependency/package.json");
  await mkdir(path.dirname(runtimeManifest), { recursive: true });
  await mkdir(path.dirname(buildManifest), { recursive: true });
  await writeFile(path.join(dependencyFixture, "package.json"), JSON.stringify(fixtureManifest));
  await writeFile(path.join(dependencyFixture, "package-lock.json"), JSON.stringify(fixtureLock));
  await writeFile(runtimeManifest, JSON.stringify({ name: "runtime-dependency", version: "1.4.0" }));
  await writeFile(buildManifest, JSON.stringify({ name: "@fixture/build-dependency", version: "2.3.4" }));

  const complete = await validateDirectNpmDependencies({ repositoryRoot: dependencyFixture });
  assert.equal(complete.count, 2);
  assert.deepEqual(complete.versions, {
    "runtime-dependency": "1.4.0",
    "@fixture/build-dependency": "2.3.4",
  });

  await rm(path.dirname(buildManifest), { recursive: true, force: true });
  await assert.rejects(
    validateDirectNpmDependencies({ repositoryRoot: dependencyFixture }),
    /@fixture\/build-dependency: missing or unreadable[\s\S]+expected package-lock version 2\.3\.4[\s\S]+npm ci/u,
    "every direct development dependency must be installed even when an absent optional transitive is ignored",
  );

  await mkdir(path.dirname(buildManifest), { recursive: true });
  await writeFile(buildManifest, JSON.stringify({ name: "@fixture/build-dependency", version: "2.3.5" }));
  await assert.rejects(
    validateDirectNpmDependencies({ repositoryRoot: dependencyFixture }),
    /@fixture\/build-dependency: installed version mismatch; expected 2\.3\.4, found 2\.3\.5/u,
    "an installed direct dependency must match its exact package-lock version",
  );

  await writeFile(buildManifest, JSON.stringify({ name: "@fixture/build-dependency", version: "2.3.4" }));
  fixtureLock.packages[""].dependencies["runtime-dependency"] = "^9.0.0";
  await writeFile(path.join(dependencyFixture, "package-lock.json"), JSON.stringify(fixtureLock));
  await assert.rejects(
    validateDirectNpmDependencies({ repositoryRoot: dependencyFixture }),
    /runtime-dependency: package-lock root dependencies declares \^9\.0\.0; package\.json declares \^1\.0\.0/u,
    "package.json and the package-lock root declaration must remain synchronized",
  );
} finally {
  await rm(dependencyFixture, { recursive: true, force: true });
}

const temporary = await mkdtemp(path.join(os.tmpdir(), "swarmforge-process-contract-"));
try {
  const launcherHelp = await run(launcher, ["--help"], { cwd: temporary });
  assert.equal(launcherHelp.status, 0, launcherHelp.stderr);
  assert.deepEqual(await readdir(temporary), [], "--help must not create project state");

  const unknown = await run(launcher, ["--unknown-option"], { cwd: temporary });
  assert.equal(unknown.status, 64);
  assert.deepEqual(await readdir(temporary), [], "an invalid option must not create project state");

  const invalidProject = path.join(temporary, "invalid-project");
  const invalidSwarmforge = path.join(invalidProject, "swarmforge");
  await mkdir(path.join(invalidSwarmforge, "roles"), { recursive: true });
  await writeFile(path.join(invalidSwarmforge, "constitution.prompt"), "# Test constitution\n");
  await writeFile(path.join(invalidSwarmforge, "swarmforge.conf"), "window missing-role codex master\n");
  const invalidConfig = await run("bb", [launcherBb, "--test-parse", invalidProject]);
  assert.notEqual(invalidConfig.status, 0, "a missing role prompt must fail configuration validation");
  assert.match(invalidConfig.stderr, /Missing role prompt/u);
  assert.deepEqual(await readdir(invalidProject), ["swarmforge"],
    "invalid project configuration must fail before Git, tmux, worktree, or state mutation");

  const unsafeProject = path.join(temporary, "unsafe-codex-project");
  const unsafeSwarmforge = path.join(unsafeProject, "swarmforge");
  await mkdir(path.join(unsafeSwarmforge, "roles"), { recursive: true });
  await writeFile(path.join(unsafeSwarmforge, "constitution.prompt"), "# Test constitution\n");
  await writeFile(path.join(unsafeSwarmforge, "roles", "coder.prompt"), "# Coder\n");
  await writeFile(
    path.join(unsafeSwarmforge, "swarmforge.conf"),
    "window coder codex master task --sandbox danger-full-access\n",
  );
  const unsafeConfig = await run("bb", [launcherBb, "--test-parse", unsafeProject]);
  assert.notEqual(unsafeConfig.status, 0, "an unsafe Codex override must fail configuration validation");
  assert.match(unsafeConfig.stderr, /Unsafe Codex sandbox override/u);
  assert.deepEqual(await readdir(unsafeProject), ["swarmforge"],
    "unsafe Codex arguments must fail before Git, tmux, worktree, or state mutation");

  const tunedProject = path.join(temporary, "tuned-codex-project");
  const tunedSwarmforge = path.join(tunedProject, "swarmforge");
  await mkdir(path.join(tunedSwarmforge, "roles"), { recursive: true });
  await writeFile(path.join(tunedSwarmforge, "constitution.prompt"), "# Test constitution\n");
  await writeFile(path.join(tunedSwarmforge, "roles", "coder.prompt"), "# Coder\n");
  await writeFile(
    path.join(tunedSwarmforge, "swarmforge.conf"),
    "window coder codex master task --model gpt-5.6-sol -c model_reasoning_effort=xhigh\n",
  );
  const tunedConfig = await run("bb", [launcherBb, "--test-parse", tunedProject]);
  assert.equal(tunedConfig.status, 0, tunedConfig.stderr);
  assert.match(tunedConfig.stdout,
    /coder Coder .* task --model gpt-5\.6-sol -c model_reasoning_effort=xhigh/u,
    "Codex model and reasoning effort are accepted as role-local tuning");

  const helperProject = path.join(temporary, "missing-helper-project");
  const helperSwarmforge = path.join(helperProject, "swarmforge");
  await mkdir(path.join(helperSwarmforge, "roles"), { recursive: true });
  await writeFile(path.join(helperSwarmforge, "constitution.prompt"), "# Test constitution\n");
  await writeFile(path.join(helperSwarmforge, "roles", "coder.prompt"), "# Coder\n");
  await writeFile(path.join(helperSwarmforge, "swarmforge.conf"), "window coder codex master\n");
  const isolatedScripts = path.join(temporary, "isolated-scripts");
  await mkdir(isolatedScripts);
  const isolatedLauncherBb = path.join(isolatedScripts, "swarmforge.bb");
  await writeFile(isolatedLauncherBb, launcherSource, { mode: 0o755 });
  const missingHelper = await run("bb", [isolatedLauncherBb, "--test-parse", helperProject]);
  assert.notEqual(missingHelper.status, 0, "missing pinned helpers must fail validation");
  assert.match(missingHelper.stderr, /Required helper script not found or not executable/u);
  assert.match(missingHelper.stderr, /browser-test/u,
    "the required browser helper must participate in mutation-free helper validation");
  assert.deepEqual(await readdir(helperProject), ["swarmforge"],
    "missing helpers must fail before Git, tmux, worktree, or state mutation");

  const dependencyPath = path.join(temporary, "dependency-path-without-rg");
  await mkdir(dependencyPath);
  await writeFile(path.join(dependencyPath, "sh"), "#!/bin/sh\nexec /bin/sh \"$@\"\n", { mode:0o755 });
  for (const command of ["tmux", "git", "bb", "node"]) {
    await writeFile(path.join(dependencyPath, command), "#!/bin/sh\nexit 0\n", { mode:0o755 });
  }
  const babashkaPath = (await run("sh", ["-c", "command -v bb"])).stdout.trim();
  const missingRg = await run(babashkaPath, [launcherBb, "--test-host-dependencies"], {
    env:{ ...process.env, PATH:dependencyPath },
  });
  assert.notEqual(missingRg.status, 0, "missing rg must fail host preflight");
  assert.match(missingRg.stderr, /'rg' is required but not installed/u);
  assert.deepEqual((await readdir(dependencyPath)).sort(), ["bb", "git", "node", "sh", "tmux"],
    "host dependency preflight must not mutate its fixture");

  const launch = await run("bb", [launcherBb, "--test-launch-command", temporary, "codex", "--no-alt-screen"]);
  assert.equal(launch.status, 0, launch.stderr);
  const command = launch.stdout;
  assert.match(command, /--strict-config/u);
  assert.match(command, /--sandbox workspace-write/u);
  assert.match(command, /--ask-for-approval on-request/u);
  assert.match(command, /approvals_reviewer=auto_review/u);
  assert.match(command, /sandbox_workspace_write\.network_access=true/u);
  assert.match(command, /features\.network_proxy\.enabled=true/u);
  assert.match(command, /"127\.0\.0\.1" = "allow"/u);
  assert.match(command, /"localhost" = "allow"/u);
  assert.match(command, /features\.network_proxy\.allow_local_binding=false/u);
  assert.doesNotMatch(command, /allow_local_binding=true/u);
  assert.ok(command.indexOf("--no-alt-screen") < command.indexOf("--strict-config"),
    "enforced security arguments must follow optional role arguments");

  for (const unsafe of [
    "--yolo",
    "--sandbox danger-full-access",
    "-c sandbox_mode=\"danger-full-access\"",
    "-csandbox_mode=\"danger-full-access\"",
    "-C /tmp",
    "--profile permissive",
    "--",
  ]) {
    const rejected = await run("bb", [launcherBb, "--test-launch-command", temporary, "codex", unsafe]);
    assert.notEqual(rejected.status, 0, `launcher unexpectedly accepted ${unsafe}`);
  }

  const fakeClojure = path.join(temporary, "fake-clojure");
  await writeFile(fakeClojure, `#!/usr/bin/env bash
printf 'CLJ_CONFIG=%s\\n' "$CLJ_CONFIG"
printf 'CLJ_CACHE=%s\\n' "$CLJ_CACHE"
printf 'GITLIBS=%s\\n' "$GITLIBS"
for argument in "$@"; do printf 'ARG=%s\\n' "$argument"; done
`, { mode: 0o755 });
  const state = `/tmp/swarmforge-clojure-${process.getuid()}`;
  const wrapper = await run(path.join(root, "swarmforge/scripts/clj"), ["-Sdescribe"], {
    cwd: temporary,
    env: {
      ...process.env,
      CLOJURE_CLI: fakeClojure,
      SWARMFORGE_CLJ_STATE_DIR: path.join(temporary, "ignored-state-override"),
      CLJ_CONFIG: "",
      CLJ_CACHE: "",
      GITLIBS: "",
    },
  });
  assert.equal(wrapper.status, 0, wrapper.stderr);
  assert.match(wrapper.stdout, new RegExp(`GITLIBS=${state.replaceAll("\\", "\\\\")}/gitlibs`, "u"));
  assert.match(wrapper.stdout, /ARG=-Sdeps/u);
  assert.match(wrapper.stdout, /:mvn\/local-repo/u);
  assert.match(wrapper.stdout, new RegExp(`${state.replaceAll("\\", "\\\\")}/m2`, "u"));
  assert.doesNotMatch(wrapper.stdout, /ignored-state-override/u);

  const overrideDeps = await run(
    path.join(root, "swarmforge/scripts/clj"),
    ["-Sdeps", '{:mvn/local-repo "/var/tmp/outside-m2"}', "-Sdescribe"],
    { cwd: temporary, env: { ...process.env, CLOJURE_CLI: fakeClojure } },
  );
  assert.equal(overrideDeps.status, 64);
  assert.match(overrideDeps.stderr, /wrapper owns -Sdeps/u);
  assert.equal(overrideDeps.stdout, "", "rejected -Sdeps must not reach Clojure CLI");

  const project = path.join(temporary, "project");
  await run("git", ["init", "-q", project]);
  const hostile = await run(path.join(root, "swarmforge/scripts/clj"), ["-Sdescribe"], {
    cwd: project,
    env: {
      ...process.env,
      CLOJURE_CLI: fakeClojure,
      SWARMFORGE_CLJ_STATE_DIR: "/var/tmp/outside-swarmforge",
      SWARMFORGE_M2_DIR: "/var/tmp/outside-m2",
      CLJ_CONFIG: "/var/tmp/outside-config",
      CLJ_CACHE: "/var/tmp/outside-cache",
      GITLIBS: "/var/tmp/outside-gitlibs",
    },
  });
  assert.equal(hostile.status, 0, hostile.stderr);
  const localState = path.join(project, ".swarmforge", "clojure");
  assert.match(hostile.stdout, new RegExp(`CLJ_CONFIG=${localState.replaceAll("\\", "\\\\")}/config`, "u"));
  assert.match(hostile.stdout, new RegExp(`CLJ_CACHE=${localState.replaceAll("\\", "\\\\")}/cache`, "u"));
  assert.match(hostile.stdout, new RegExp(`GITLIBS=${localState.replaceAll("\\", "\\\\")}/gitlibs`, "u"));
  assert.match(hostile.stdout, new RegExp(`${localState.replaceAll("\\", "\\\\")}/m2`, "u"));
  assert.doesNotMatch(hostile.stdout, /\/var\/tmp\/outside/u);

  const nodeFixture = path.join(temporary, "node-fixture");
  const fixtureSource = path.join(nodeFixture, "source");
  const fixtureRootName = "node-v9.8.7-test-x64";
  const fixtureTree = path.join(fixtureSource, fixtureRootName);
  await mkdir(path.join(fixtureTree, "bin"), { recursive: true });
  await writeFile(
    path.join(fixtureTree, "bin", "node"),
    "#!/bin/sh\nprintf 'v9.8.7\\n'\n",
    { mode: 0o755 },
  );
  await writeFile(path.join(fixtureTree, "README.md"), "verified fixture\n");
  const fixtureArchive = path.join(nodeFixture, "node-fixture.tar.xz");
  const createArchive = await run(
    "tar",
    ["-cJf", fixtureArchive, "-C", fixtureSource, fixtureRootName],
  );
  assert.equal(createArchive.status, 0, createArchive.stderr);
  const fixtureExtraction = path.join(nodeFixture, "extracted");
  await mkdir(fixtureExtraction);
  const extractArchive = await run("tar", ["-xJf", fixtureArchive, "-C", fixtureExtraction]);
  assert.equal(extractArchive.status, 0, extractArchive.stderr);
  const fixtureTarget = path.join(fixtureExtraction, fixtureRootName);
  await validateNodeArchiveTarget(fixtureArchive, fixtureTarget, "9.8.7");

  const unexpectedFixtureEntry = path.join(fixtureTarget, "unexpected.txt");
  await writeFile(unexpectedFixtureEntry, "not in archive\n");
  await assert.rejects(
    validateNodeArchiveTarget(fixtureArchive, fixtureTarget, "9.8.7"),
    /entries differ from the verified archive.*unexpected/u,
    "a version-matching Node tree with extra content must not be accepted",
  );
  await rm(unexpectedFixtureEntry);
  await writeFile(path.join(fixtureTarget, "README.md"), "modified fixture\n");
  await assert.rejects(
    validateNodeArchiveTarget(fixtureArchive, fixtureTarget, "9.8.7"),
    /content differs from the verified archive/u,
    "a version-matching Node tree with modified content must not be accepted",
  );

  const babashkaFixture = path.join(temporary, "babashka-fixture");
  const babashkaSource = path.join(babashkaFixture, "source");
  await mkdir(babashkaSource, { recursive: true });
  const fixtureBb = path.join(babashkaSource, "bb");
  await writeFile(
    fixtureBb,
    "#!/bin/sh\nprintf 'babashka v9.8.7\\n'\n",
    { mode: 0o755 },
  );
  const babashkaArchive = path.join(babashkaFixture, "babashka.tar.gz");
  const createBabashkaArchive = await run(
    "tar",
    ["-czf", babashkaArchive, "-C", babashkaSource, "bb"],
  );
  assert.equal(createBabashkaArchive.status, 0, createBabashkaArchive.stderr);
  const babashkaPlatform = {
    binarySha256: await sha256(fixtureBb),
    sha256: await sha256(babashkaArchive),
  };
  const babashkaTarget = path.join(babashkaFixture, "installed");
  const babashkaInstalls = await Promise.all([
    installBabashkaArchive(babashkaArchive, babashkaTarget, babashkaPlatform, "9.8.7"),
    installBabashkaArchive(babashkaArchive, babashkaTarget, babashkaPlatform, "9.8.7"),
  ]);
  assert.deepEqual(
    babashkaInstalls.map(({ promoted }) => promoted).sort(),
    [false, true],
    "concurrent Babashka provisioning must converge on one validated atomic promotion",
  );
  assert.equal(
    (await run(path.join(babashkaTarget, "bin/bb"), ["--version"])).stdout,
    "babashka v9.8.7\n",
  );
  assert.deepEqual(
    (await readdir(babashkaFixture)).sort(),
    ["babashka.tar.gz", "installed", "source"],
    "successful Babashka provisioning must not leave extraction stages behind",
  );
  await validateBabashkaTarget(babashkaTarget, babashkaPlatform, "9.8.7");

  const corruptBabashkaTarget = path.join(babashkaFixture, "corrupt");
  await mkdir(path.join(corruptBabashkaTarget, "bin"), { recursive: true });
  await writeFile(
    path.join(corruptBabashkaTarget, "bin/bb"),
    "#!/bin/sh\nprintf 'babashka v9.8.7\\n'\n# corrupt payload\n",
    { mode: 0o755 },
  );
  await assert.rejects(
    validateBabashkaTarget(corruptBabashkaTarget, babashkaPlatform, "9.8.7"),
    /binary checksum mismatch/u,
    "a version-shaped local bb with an untrusted digest must be rejected before launcher use",
  );

  const wrongVersionTarget = path.join(babashkaFixture, "wrong-version");
  const wrongVersionBb = path.join(wrongVersionTarget, "bin/bb");
  await mkdir(path.dirname(wrongVersionBb), { recursive: true });
  await writeFile(wrongVersionBb, "#!/bin/sh\nprintf 'babashka v0.0.0\\n'\n", { mode: 0o755 });
  await assert.rejects(
    validateBabashkaTarget(
      wrongVersionTarget,
      { ...babashkaPlatform, binarySha256: await sha256(wrongVersionBb) },
      "9.8.7",
    ),
    /reported babashka v0\.0\.0/u,
    "a digest-authorized local bb with the wrong locked version must still be rejected",
  );
  await writeFile(path.join(babashkaTarget, "bin", "unexpected"), "partial\n");
  await assert.rejects(
    installBabashkaArchive(babashkaArchive, babashkaTarget, babashkaPlatform, "9.8.7"),
    /unexpected or incomplete entries/u,
    "an existing partial or modified Babashka target must never be accepted",
  );

  const gitFixture = path.join(temporary, "git-tool-fixture");
  const gitOrigin = path.join(gitFixture, "origin");
  await mkdir(gitFixture);
  assert.equal((await run("git", ["init", "-q", gitOrigin])).status, 0);
  assert.equal((await run("git", ["config", "user.email", "fixture@example.invalid"], { cwd: gitOrigin })).status, 0);
  assert.equal((await run("git", ["config", "user.name", "Fixture"], { cwd: gitOrigin })).status, 0);
  const originFile = path.join(gitOrigin, "tool.txt");
  await writeFile(originFile, "old\n");
  assert.equal((await run("git", ["add", "tool.txt"], { cwd: gitOrigin })).status, 0);
  assert.equal((await run("git", ["commit", "-q", "-m", "old"], { cwd: gitOrigin })).status, 0);
  const oldRevision = (await run("git", ["rev-parse", "HEAD"], { cwd: gitOrigin })).stdout.trim();
  await writeFile(originFile, "locked\n");
  assert.equal((await run("git", ["commit", "-q", "-am", "locked"], { cwd: gitOrigin })).status, 0);
  const lockedRevision = (await run("git", ["rev-parse", "HEAD"], { cwd: gitOrigin })).stdout.trim();
  const gitToolParent = path.join(gitFixture, "tools");
  const gitToolTarget = path.join(gitToolParent, "fixture-tool");
  await mkdir(gitToolParent);
  assert.equal((await run("git", ["clone", "-q", gitOrigin, gitToolTarget])).status, 0);
  assert.equal((await run("git", ["checkout", "-q", "--detach", oldRevision], { cwd: gitToolTarget })).status, 0);
  const fixtureToolLock = {
    "fixture-tool": {
      repository: gitOrigin,
      revision: lockedRevision,
    },
  };
  const supportsAtomicExchange = /--exchange/u.test((await run("mv", ["--help"])).stdout);
  if (supportsAtomicExchange) {
    const replacement = await ensureLockedGitCheckout(fixtureToolLock, "fixture-tool", gitToolTarget);
    assert.equal(replacement.replaced, true);
    assert.equal(
      (await run("git", ["rev-parse", "HEAD"], { cwd: gitToolTarget })).stdout.trim(),
      lockedRevision,
    );
    assert.equal(await readFile(path.join(gitToolTarget, "tool.txt"), "utf8"), "locked\n");
  } else {
    await assert.rejects(
      ensureLockedGitCheckout(fixtureToolLock, "fixture-tool", gitToolTarget),
      /requires atomic directory exchange.*final target was not changed/u,
    );
    assert.equal(
      (await run("git", ["rev-parse", "HEAD"], { cwd: gitToolTarget })).stdout.trim(),
      oldRevision,
      "a host without atomic exchange support must leave the final checkout unchanged",
    );
  }
  assert.deepEqual(await readdir(gitToolParent), ["fixture-tool"],
    "staged Git replacement must not leave the displaced checkout behind");

  const dirtyGitTarget = path.join(gitToolParent, "dirty-tool");
  assert.equal((await run("git", ["clone", "-q", gitOrigin, dirtyGitTarget])).status, 0);
  assert.equal((await run("git", ["checkout", "-q", "--detach", oldRevision], { cwd: dirtyGitTarget })).status, 0);
  await writeFile(path.join(dirtyGitTarget, "local-change"), "preserve me\n");
  await assert.rejects(
    ensureLockedGitCheckout(fixtureToolLock, "fixture-tool", dirtyGitTarget),
    /local changes.*refusing to use or replace/u,
    "dirty existing Git tools must be refused before staging or replacement",
  );
  assert.equal(
    (await run("git", ["rev-parse", "HEAD"], { cwd: dirtyGitTarget })).stdout.trim(),
    oldRevision,
  );
  assert.equal(await readFile(path.join(dirtyGitTarget, "local-change"), "utf8"), "preserve me\n");

  const recoveryParent = path.join(gitFixture, "recovery-tools");
  const recoveryTarget = path.join(recoveryParent, "recovered-tool");
  const deadOwner = spawn(process.execPath, ["-e", ""], { stdio:"ignore" });
  const deadOwnerPid = deadOwner.pid;
  await new Promise((resolve, reject) => {
    deadOwner.once("error", reject);
    deadOwner.once("close", resolve);
  });
  const strandedTarget = path.join(recoveryParent, `.recovered-tool.displaced-${deadOwnerPid}-fixture`);
  await mkdir(recoveryParent);
  assert.equal((await run("git", ["clone", "-q", gitOrigin, strandedTarget])).status, 0);
  assert.equal((await run("git", ["checkout", "-q", "--detach", oldRevision], { cwd: strandedTarget })).status, 0);
  const recovery = await recoverStrandedGitCheckout(fixtureToolLock, "fixture-tool", recoveryTarget);
  assert.equal(recovery.recovered, true);
  assert.equal(recovery.revision, oldRevision);
  assert.deepEqual(await readdir(recoveryParent), ["recovered-tool"],
    "a sole clean generated displaced checkout must be atomically restored before provisioning continues");
  assert.equal(
    (await run("git", ["rev-parse", "HEAD"], { cwd: recoveryTarget })).stdout.trim(),
    oldRevision,
  );

  const completedTarget = path.join(recoveryParent, "completed-tool");
  const completedResidue = path.join(
    recoveryParent,
    `.completed-tool.displaced-${deadOwnerPid}-fixture`,
  );
  assert.equal((await run("git", ["clone", "-q", gitOrigin, completedTarget])).status, 0);
  assert.equal((await run("git", ["checkout", "-q", "--detach", lockedRevision], { cwd: completedTarget })).status, 0);
  assert.equal((await run("git", ["clone", "-q", gitOrigin, completedResidue])).status, 0);
  assert.equal((await run("git", ["checkout", "-q", "--detach", oldRevision], { cwd: completedResidue })).status, 0);
  const completedRecovery = await recoverStrandedGitCheckout(
    fixtureToolLock,
    "fixture-tool",
    completedTarget,
  );
  assert.equal(completedRecovery.cleaned, true,
    "post-exchange crash residue must be recognized and removed");
  assert.equal(
    (await run("git", ["rev-parse", "HEAD"], { cwd: completedTarget })).stdout.trim(),
    lockedRevision,
  );

  const liveResidue = path.join(
    recoveryParent,
    `.completed-tool.displaced-${process.pid}-live`,
  );
  assert.equal((await run("git", ["clone", "-q", gitOrigin, liveResidue])).status, 0);
  assert.equal((await run("git", ["checkout", "-q", "--detach", oldRevision], { cwd: liveResidue })).status, 0);
  const liveRecovery = await recoverStrandedGitCheckout(
    fixtureToolLock,
    "fixture-tool",
    completedTarget,
  );
  assert.deepEqual(liveRecovery, { recovered:false, deferred:true },
    "a stage owned by a live provisioner must never be reinterpreted as crash residue");
  assert.equal(
    (await run("git", ["rev-parse", "HEAD"], { cwd: liveResidue })).stdout.trim(),
    oldRevision,
  );
  await rm(liveResidue, { recursive:true, force:true });
  assert.deepEqual((await readdir(recoveryParent)).sort(), ["completed-tool", "recovered-tool"],
    "actual displaced-prefix recovery must leave only complete final checkouts");

  const promotionFixture = path.join(temporary, "atomic-promotion");
  await mkdir(promotionFixture);
  const promotedTarget = path.join(promotionFixture, "tool");
  const firstStage = path.join(promotionFixture, ".tool.stage-first");
  await mkdir(firstStage);
  await writeFile(path.join(firstStage, "revision"), "locked\n");
  const firstPromotion = await atomicPromoteDirectory(
    firstStage,
    promotedTarget,
    async () => assert.fail("an uncontended promotion must not use race validation"),
    "fixture tool",
  );
  assert.equal(firstPromotion.promoted, true);
  assert.equal(await readFile(path.join(promotedTarget, "revision"), "utf8"), "locked\n");

  const racingStage = path.join(promotionFixture, ".tool.stage-racing");
  await mkdir(racingStage);
  await writeFile(path.join(racingStage, "revision"), "locked\n");
  const convergedPromotion = await atomicPromoteDirectory(
    racingStage,
    promotedTarget,
    async (finalTarget) => assert.equal(
      await readFile(path.join(finalTarget, "revision"), "utf8"),
      "locked\n",
    ),
    "fixture tool",
  );
  assert.equal(convergedPromotion.promoted, false,
    "a losing provision attempt must converge only after validating the winning target");

  const invalidTarget = path.join(promotionFixture, "invalid-tool");
  const invalidStage = path.join(promotionFixture, ".invalid-tool.stage-racing");
  await mkdir(invalidTarget);
  await writeFile(path.join(invalidTarget, "revision"), "partial\n");
  await mkdir(invalidStage);
  await writeFile(path.join(invalidStage, "revision"), "locked\n");
  await assert.rejects(
    atomicPromoteDirectory(
      invalidStage,
      invalidTarget,
      async (finalTarget) => assert.equal(
        await readFile(path.join(finalTarget, "revision"), "utf8"),
        "locked\n",
      ),
      "fixture tool",
    ),
    /final target did not validate/u,
    "a losing provision attempt must never accept a partial final target",
  );

  const unsupportedExchangeTarget = path.join(promotionFixture, "unsupported-exchange-tool");
  const unsupportedExchangeStage = path.join(promotionFixture, ".unsupported-exchange-tool.stage");
  await mkdir(unsupportedExchangeTarget);
  await writeFile(path.join(unsupportedExchangeTarget, "revision"), "old\n");
  await mkdir(unsupportedExchangeStage);
  await writeFile(path.join(unsupportedExchangeStage, "revision"), "locked\n");
  const fakeCommands = path.join(promotionFixture, "fake-commands");
  await mkdir(fakeCommands);
  await writeFile(
    path.join(fakeCommands, "mv"),
    "#!/bin/sh\nprintf '%s\\n' \"mv: unrecognized option '--exchange'\" >&2\nexit 1\n",
    { mode: 0o755 },
  );
  const originalPath = process.env.PATH;
  process.env.PATH = `${fakeCommands}${path.delimiter}${originalPath}`;
  try {
    await assert.rejects(
      atomicExchangeDirectories(
        unsupportedExchangeStage,
        unsupportedExchangeTarget,
        async () => assert.fail("unsupported exchange must not validate a changed final target"),
        async () => assert.fail("unsupported exchange must not displace the existing target"),
        "unsupported fixture tool",
      ),
      /requires atomic directory exchange.*final target was not changed/u,
    );
  } finally {
    process.env.PATH = originalPath;
  }
  assert.equal(
    await readFile(path.join(unsupportedExchangeTarget, "revision"), "utf8"),
    "old\n",
  );
  assert.equal(
    await readFile(path.join(unsupportedExchangeStage, "revision"), "utf8"),
    "locked\n",
  );

} finally {
  await rm(temporary, { recursive: true, force: true });
}

const bootstrapSource = await readFile(path.join(root, "swarm"), "utf8");
assert.doesNotMatch(bootstrapSource, /\bcurl\b|github\.com|\btar\b/u);
const localBbValidationIndex = bootstrapSource.indexOf("--validate-local-babashka");
const localBbPathIndex = bootstrapSource.indexOf('export PATH="$(dirname "$project_bb"):$PATH"');
assert.ok(
  localBbValidationIndex >= 0 && localBbValidationIndex < localBbPathIndex,
  "the root launcher must validate a project-local bb before making it executable through PATH",
);
assert.match(toolchainSource, /if \(await entryExists\(target\)\) await validateLocalBabashka\(lock\);/u,
  "ordinary toolchain validation must deeply verify any project-local Babashka target");
const terminalWorkflow = await readFile(
  path.join(root, ".github", "workflows", "terminal-verification.yml"),
  "utf8",
);
assert.doesNotMatch(terminalWorkflow, /curl[^\n]*\|\s*tar|\|\s*tar\b/u);
assert.equal(
  terminalWorkflow.match(/--provision babashka/gu)?.length,
  2,
  "each CI job must delegate Babashka installation to the lock checker",
);
assert.equal(
  terminalWorkflow.match(/tmp\/toolchain\/babashka\/bin/gu)?.length,
  2,
  "each CI job must expose the checker-managed Babashka binary",
);
assert.doesNotMatch(terminalWorkflow, /babashka-1\.12\.218|ca5b2824|github\.com\/babashka/u,
  "the toolchain lock must be the sole CI authority for Babashka release metadata");
const bootstrapTemporary = await mkdtemp(path.join(os.tmpdir(), "swarmforge-bootstrap-contract-"));
try {
  const isolatedBootstrap = path.join(bootstrapTemporary, "swarm");
  await writeFile(isolatedBootstrap, bootstrapSource, { mode: 0o755 });
  const missingScripts = await run(isolatedBootstrap, [], { cwd: bootstrapTemporary });
  assert.equal(missingScripts.status, 78);
  assert.match(missingScripts.stderr, /automatic network bootstrap is disabled/u);
  assert.deepEqual(await readdir(bootstrapTemporary), ["swarm"],
    "missing pinned scripts must not trigger downloads or project mutation");
} finally {
  await rm(bootstrapTemporary, { recursive: true, force: true });
}

const runtimeBootstrapTemporary = await mkdtemp(path.join(os.tmpdir(), "swarmforge-babashka-contract-"));
try {
  const isolatedBootstrap = path.join(runtimeBootstrapTemporary, "swarm");
  const isolatedScripts = path.join(runtimeBootstrapTemporary, "swarmforge", "scripts");
  const isolatedCheckerDirectory = path.join(runtimeBootstrapTemporary, "scripts");
  const isolatedLockPath = path.join(runtimeBootstrapTemporary, "swarmforge", "toolchain.lock.json");
  await mkdir(path.join(isolatedScripts, "shared-articles"), { recursive: true });
  await mkdir(isolatedCheckerDirectory);
  await writeFile(isolatedBootstrap, bootstrapSource, { mode: 0o755 });
  await writeFile(
    path.join(isolatedCheckerDirectory, "check-swarmforge-toolchain.mjs"),
    toolchainSource,
  );
  await writeFile(
    path.join(isolatedScripts, "swarmforge.sh"),
    "#!/usr/bin/env bash\nexec bb --version\n",
    { mode: 0o755 },
  );
  const fixturePlatformKey = `${process.platform}-${process.arch}`;
  const fixtureBabashkaLock = {
    version: 1,
    babashka: {
      version: "9.8.7",
      platforms: {
        [fixturePlatformKey]: {
          archive: "fixture.tar.gz",
          binarySha256: "0".repeat(64),
          sha256: "0".repeat(64),
          url: "https://example.invalid/fixture.tar.gz",
        },
      },
    },
  };
  await writeFile(isolatedLockPath, `${JSON.stringify(fixtureBabashkaLock, null, 2)}\n`);
  const helpWithoutBb = await run(isolatedBootstrap, ["--help"], {
    cwd: runtimeBootstrapTemporary,
    env: { ...process.env, PATH: "/usr/bin:/bin" },
  });
  assert.equal(helpWithoutBb.status, 0, helpWithoutBb.stderr);
  assert.match(helpWithoutBb.stdout, /Usage: swarm \[PROJECT_ROOT\]/u);
  const withoutBb = await run(isolatedBootstrap, [], {
    cwd: runtimeBootstrapTemporary,
    env: { ...process.env, PATH: "/usr/bin:/bin" },
  });
  assert.equal(withoutBb.status, 78);
  assert.match(withoutBb.stderr, /--provision babashka/u);
  assert.doesNotMatch(withoutBb.stderr, /not found|curl|download/u);
  assert.deepEqual((await readdir(runtimeBootstrapTemporary)).sort(), ["scripts", "swarm", "swarmforge"],
    "a missing Babashka runtime must not create project state");

  const projectBb = path.join(runtimeBootstrapTemporary, "tmp/toolchain/babashka/bin/bb");
  await mkdir(path.dirname(projectBb), { recursive: true });
  await writeFile(projectBb, "#!/bin/sh\nprintf 'babashka v9.8.7\\n'\n", { mode: 0o755 });
  fixtureBabashkaLock.babashka.platforms[fixturePlatformKey].binarySha256 = await sha256(projectBb);
  await writeFile(isolatedLockPath, `${JSON.stringify(fixtureBabashkaLock, null, 2)}\n`);
  const withProjectBb = await run(isolatedBootstrap, [], {
    cwd: runtimeBootstrapTemporary,
    env: { ...process.env, PATH: "/usr/bin:/bin" },
  });
  assert.equal(withProjectBb.status, 0, withProjectBb.stderr);
  assert.equal(withProjectBb.stdout, "babashka v9.8.7\n",
    "the root launcher must discover a digest- and version-verified project-local Babashka binary");

  await writeFile(projectBb, "#!/bin/sh\nprintf 'babashka v9.8.7\\n'\n# corrupt\n", { mode: 0o755 });
  const corruptProjectBb = await run(isolatedBootstrap, [], {
    cwd: runtimeBootstrapTemporary,
    env: { ...process.env, PATH: "/usr/bin:/bin" },
  });
  assert.equal(corruptProjectBb.status, 78);
  assert.match(corruptProjectBb.stderr, /binary checksum mismatch/u);
  assert.equal(corruptProjectBb.stdout, "",
    "an unverified project-local bb must never reach the launcher");

  await writeFile(projectBb, "#!/bin/sh\nprintf 'babashka v0.0.0\\n'\n", { mode: 0o755 });
  fixtureBabashkaLock.babashka.platforms[fixturePlatformKey].binarySha256 = await sha256(projectBb);
  await writeFile(isolatedLockPath, `${JSON.stringify(fixtureBabashkaLock, null, 2)}\n`);
  const wrongVersionProjectBb = await run(isolatedBootstrap, [], {
    cwd: runtimeBootstrapTemporary,
    env: { ...process.env, PATH: "/usr/bin:/bin" },
  });
  assert.equal(wrongVersionProjectBb.status, 78);
  assert.match(wrongVersionProjectBb.stderr, /reported babashka v0\.0\.0/u);
  assert.equal(wrongVersionProjectBb.stdout, "",
    "a wrong-version project-local bb must never reach the launcher");
} finally {
  await rm(runtimeBootstrapTemporary, { recursive: true, force: true });
}

const deps = await readFile(path.join(root, "deps.edn"), "utf8");
for (const name of ["clj-mutate", "crap4clj", "dry4clj"]) {
  assert.match(lock[name].revision, /^[0-9a-f]{40}$/u);
  assert.ok(deps.includes(`:local/root \"${lock[name].localRoot}\"`));
  assert.ok(!deps.includes(lock[name].revision), `${name} revision must have one authority`);
}
assert.equal(lock.node.version, "24.19.0");
assert.match(lock.node.platforms["linux-x64"].sha256, /^[0-9a-f]{64}$/u);
assert.equal(lock.babashka.version, "1.12.218");
assert.match(lock.babashka.platforms["linux-x64"].url, /^https:\/\/github\.com\/babashka\/babashka\/releases\//u);
assert.match(lock.babashka.platforms["linux-x64"].sha256, /^[0-9a-f]{64}$/u);
assert.match(lock.babashka.platforms["linux-x64"].binarySha256, /^[0-9a-f]{64}$/u);
assert.equal(lock.babashka.linuxAmd64Sha256, undefined,
  "Babashka platform metadata must have one authority");
assert.match(babashkaBootstrapMessage(lock, "linux-x64"), /--provision babashka/u);
const unsupportedBabashkaGuidance = babashkaBootstrapMessage(lock, "plan9-mips");
assert.match(unsupportedBabashkaGuidance, /Install Babashka 1\.12\.218 on PATH/u);
assert.doesNotMatch(unsupportedBabashkaGuidance, /--provision babashka/u,
  "unsupported platforms must never be promised a project-local provision operation");
assert.equal(lock.codex.requiredFeature, "network_proxy");

console.log("SwarmForge process contracts passed.");
