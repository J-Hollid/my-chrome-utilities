import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { access, copyFile, mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { removeVerificationFixtureRoot } from "../../scripts/verification-fixture-cleanup.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { verificationProcessCompatibilitySuccessors } from "../../scripts/verification-policy/contracts.mjs";
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});
const cliContentionRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-cli-contention-"));
const cliContentionRepository = path.join(cliContentionRoot, "repository");
const cliProcesses = new Set();
const cliBuildProcessGroups = new Set();
function resolvedNodeModulesRoot(resolve = (specifier) => import.meta.resolve(specifier)) {
  const installedTypescriptRoot = path.dirname(path.dirname(
    fileURLToPath(resolve("typescript"))));
  return path.dirname(installedTypescriptRoot);
}
const cliBuildProcessGroup = async() => {
  const owner = (await readFile(path.join(cliContentionRepository,
    "tmp", "cli-contention-build-owner"), "utf8")).trim().split(" ").map(Number);
  const buildPid = owner[1];
  const group = Number((await exec("ps", ["-o", "pgid=", "-p", String(buildPid)])).trim());
  assert.ok(Number.isInteger(group) && group > 1 && group !== process.pid,
    "the contention fixture must resolve the nested build process group");
  cliBuildProcessGroups.add(group);
  return group;
};
const CLI_CONTENTION_READINESS_TIMEOUT_MS = 120_000;
const terminateCliBuildGroup = (group) => {
  try { process.kill(-group, "SIGKILL"); }
  catch (error) { if (error?.code !== "ESRCH") throw error; }
  cliBuildProcessGroups.delete(group);
};
try {
  await exec("git", ["clone", "--quiet", "--no-hardlinks", path.resolve("."), cliContentionRepository]);
  const cliContentionBase = await exec("git", ["rev-parse", "HEAD"]);
  await exec("git", ["checkout", "--quiet", "--detach", cliContentionBase], {
    cwd:cliContentionRepository,
  });
  await exec("git", ["config", "user.name", "CLI Contention Test"], { cwd:cliContentionRepository });
  await exec("git", ["config", "user.email", "cli-contention@example.test"], {
    cwd:cliContentionRepository,
  });
  const cliRunnerPath = path.join(cliContentionRepository, "scripts/run-focused-acceptance.mjs");
  await copyFile(path.resolve("scripts/run-focused-acceptance.mjs"), cliRunnerPath);
  await copyFile(path.resolve("scripts/verification-run-intent.mjs"),
    path.join(cliContentionRepository, "scripts/verification-run-intent.mjs"));
  await copyFile(path.resolve("scripts/verification-packs.mjs"),
    path.join(cliContentionRepository, "scripts/verification-packs.mjs"));
  const migratedManifestPaths = (await readdir(path.resolve("verification/manifests")))
    .map((name) => `verification/manifests/${name}`);
  const obsoleteManifestPath = "verification/manifests/verification-process.json";
  const obsoleteManifestExisted = await access(path.join(
    cliContentionRepository, obsoleteManifestPath)).then(() => true, () => false);
  const exactSliceFixturePaths=JSON.parse(await readFile(
    "test/fixtures/exact-slice-fixture-paths.json","utf8"));
  const extractedVerificationPaths = [
    ...exactSliceFixturePaths,
    "acceptance/src/acceptance/steps/verification_process_legacy.clj",
    "acceptance/src/acceptance/steps/verification_registry_planner_modularization.clj",
    "acceptance/src/acceptance/verification_support/administration_preflight_handlers.clj",
    "acceptance/src/acceptance/verification_support/modular_architecture_temporary_lifecycle_handlers.clj",
    "features/verification-administration-preflight.feature",
    "scripts/verification-evidence/administration-eligibility.mjs",
    "scripts/verification-evidence/administration-preflight.mjs",
    "scripts/verification-evidence/core.mjs",
    "scripts/verification-execution/runner.mjs",
    "scripts/verification-execution/execute.mjs",
    "scripts/verification-execution/bounded-stage-coordinator.mjs",
    "scripts/verification-execution/temporary-storage-lifecycle.mjs",
    "scripts/verification-execution/temporary-storage-runtime.mjs",
    "scripts/verification-reliability-evidence-retention.mjs",
    "scripts/verification-integration-receipt-disposition.mjs",
    "swarmforge/scripts/workspace-lifecycle-policy.mjs",
    "scripts/verification-performance/report-throughput.mjs",
    "scripts/verification-registry/candidate-inventory.mjs",
    "scripts/verification-registry/compiler.mjs",
    "scripts/verification-registry/loader.mjs",
    "scripts/verification-registry/validation.mjs",
    "scripts/verification-" + "fixture-cleanup.mjs",
    "test/fixtures/verification-process-compact-conservation.json",
    "verification/compact-conservation-authorities.json",
    "scripts/generate-compact-conservation.mjs",
    "scripts/verification-registry/compact-conservation-authority.mjs",
    "scripts/verification-registry/compact-conservation-command.mjs",
    "scripts/verification-registry/compact-conservation-identity.mjs",
    "scripts/verification-registry/compact-conservation.mjs",
    "scripts/verification-registry/compact-conservation-projection.mjs",
    "test/support/verification-cleanup.mjs",
    "test/support/verification-contract-boundary-helpers.mjs",
    "test/verification-candidate-inventory-test.mjs",
    "test/verification-contracts/dependency-expansion-contract-test.mjs",
    "test/verification-contracts/administration-preflight-contract-test.mjs",
    "test/verification-contracts/evidence-promotion-contract-test.mjs",
    "test/verification-contracts/execution-checkpoint-contract-test.mjs",
    "test/verification-contracts/historical-planning-contract-test.mjs",
    "test/verification-contracts/ownership-impact-contract-test.mjs",
    "test/verification-contracts/registry-inventory-contract-test.mjs",
    "test/verification-contracts/reliability-run-intent-contract-test.mjs",
    "test/verification-contracts/task-batching-contract-test.mjs",
    "test/verification-contracts/timing-performance-contract-test.mjs",
    "test/verification-contracts/temporary-storage-lifecycle-test.mjs",
    "test/verification-contracts/receipt-retention-lifecycle-test.mjs",
    "test/swarmforge-workspace-lifecycle-test.mjs",
    "test/verification-policy-contract-routing-test.mjs",
    "test/verification-process-property-test.mjs",
    "test/verification-registry-planner-modularization-acceptance-test.mjs",
    ...verificationProcessCompatibilitySuccessors,
    "scripts/verification-planner/ownership/resolve.mjs",
    "scripts/verification-planner/ownership/impact.mjs",
    "scripts/verification-planner/dependencies/expand.mjs",
    "scripts/verification-planner/history/changes.mjs",
    "scripts/verification-planner/tasks/planner.mjs",
    "scripts/verification-policy/contracts.mjs",
    "scripts/verification-policy/process-contract-compatibility.mjs",
    "scripts/verification-policy/reliability/run-intent.mjs",
    "scripts/verification-policy/reliability/task-succession.mjs",
    ...migratedManifestPaths,
    "verification/packs.base.json",
    "verification/packs.json",
    "verification/task-succession.json",
    "verification/vtd012-adoption-scorecard.json",
  ];
  for (const verificationPath of extractedVerificationPaths) {
    const destination = path.join(cliContentionRepository, verificationPath);
    await mkdir(path.dirname(destination), { recursive:true });
    await copyFile(path.resolve(verificationPath), destination);
  }
  await rm(path.join(cliContentionRepository, obsoleteManifestPath), { force:true });
  await mkdir(path.join(cliContentionRepository, "scripts/verification-pack-cardinality"),
    { recursive:true });
  await copyFile(path.resolve("scripts/verification-pack-cardinality/contract.mjs"),
    path.join(cliContentionRepository, "scripts/verification-pack-cardinality/contract.mjs"));
  await copyFile(path.resolve("scripts/verification-pack-cardinality/focused-evidence.mjs"),
    path.join(cliContentionRepository, "scripts/verification-pack-cardinality/focused-evidence.mjs"));
  await copyFile(path.resolve("scripts/live-target-permission-recovery-focused-evidence.mjs"),
    path.join(cliContentionRepository,
      "scripts/live-target-permission-recovery-focused-evidence.mjs"));
  await copyFile(path.resolve("scripts/side-panel-single-cutover-focused-evidence.mjs"),
    path.join(cliContentionRepository,
      "scripts/side-panel-single-cutover-focused-evidence.mjs"));
  await copyFile(path.resolve("scripts/verification-shared-boundaries.mjs"),
    path.join(cliContentionRepository, "scripts/verification-shared-boundaries.mjs"));
  await copyFile(path.resolve("scripts/settled-final-verification-policy.mjs"),
    path.join(cliContentionRepository, "scripts/settled-final-verification-policy.mjs"));
  await copyFile(path.resolve("scripts/dist-artifact-lock.mjs"),
    path.join(cliContentionRepository, "scripts/dist-artifact-lock.mjs"));
  const cliRepairPlannerPath = path.join(
    cliContentionRepository, "scripts/verification-reliability-repair.mjs",
  );
  await copyFile(path.resolve("scripts/verification-reliability-repair.mjs"), cliRepairPlannerPath);
  const cliSuccessionPath = path.join(
    cliContentionRepository, "scripts/verification-task-succession.mjs",
  );
  await copyFile(path.resolve("scripts/verification-task-succession.mjs"), cliSuccessionPath);
  await copyFile(path.resolve("scripts/verification-same-target-planner-projection.mjs"),
    path.join(cliContentionRepository, "scripts/verification-same-target-planner-projection.mjs"));
  await copyFile(path.resolve("verification/task-succession.json"),
    path.join(cliContentionRepository, "verification/task-succession.json"));
  await copyFile(path.resolve("verification/packs.json"),
    path.join(cliContentionRepository, "verification/packs.json"));
  await copyFile(path.resolve("test/browser-packs/global-style-smoke.mjs"),
    path.join(cliContentionRepository, "test/browser-packs/global-style-smoke.mjs"));
  await mkdir(path.join(cliContentionRepository, "test"), { recursive:true });
  await copyFile(path.resolve("test/live-target-permission-recovery-acceptance-test.mjs"),
    path.join(cliContentionRepository,
      "test/live-target-permission-recovery-acceptance-test.mjs"));
  await copyFile(path.resolve("test/stylesheet-declarations-property-test.mjs"),
    path.join(cliContentionRepository, "test/stylesheet-declarations-property-test.mjs"));
  await copyFile(path.resolve("test/data-layer-flow-visual-asset-portability-property-test.mjs"),
    path.join(cliContentionRepository, "test/data-layer-flow-visual-asset-portability-property-test.mjs"));
  await copyFile(path.resolve("test/verification-pack-cardinality-contract-test.mjs"),
    path.join(cliContentionRepository, "test/verification-pack-cardinality-contract-test.mjs"));
  await mkdir(path.join(cliContentionRepository, "test/verification-contracts"), { recursive:true });
  await copyFile(path.resolve("test/verification-contracts/lifecycle-properties-test.mjs"),
    path.join(cliContentionRepository,
      "test/verification-contracts/lifecycle-properties-test.mjs"));
  for (const documentationTemplateTest of [
    "data-layer-documentation-template-acceptance-test.mjs",
    "data-layer-documentation-template-excel-test.mjs",
    "data-layer-documentation-template-library-test.mjs",
    "data-layer-documentation-template-rich-test.mjs",
  ]) {
    await copyFile(path.resolve("test", documentationTemplateTest),
      path.join(cliContentionRepository, "test", documentationTemplateTest));
  }
  await mkdir(path.join(cliContentionRepository, "src/documentation-templates"), { recursive:true });
  for (const documentationTemplateSource of [
    "excel-renderer.ts",
    "excel-template.ts",
    "excel-workbook.ts",
    "rich-renderer.ts",
    "rich-template.ts",
    "template-body.ts",
    "template-context.ts",
    "template-contract.ts",
    "template-library.ts",
  ]) {
    await copyFile(path.resolve("src/documentation-templates", documentationTemplateSource),
      path.join(cliContentionRepository, "src/documentation-templates", documentationTemplateSource));
  }
  await mkdir(path.join(cliContentionRepository, "src/project-documentation"), { recursive:true });
  await copyFile(path.resolve("src/project-documentation/workspace-template-library-ui.ts"),
    path.join(cliContentionRepository,
      "src/project-documentation/workspace-template-library-ui.ts"));
  await copyFile(path.resolve("test/flow-stylesheet-extraction-test.mjs"),
    path.join(cliContentionRepository, "test/flow-stylesheet-extraction-test.mjs"));
  await mkdir(path.join(cliContentionRepository, "src/flow-graph"), { recursive:true });
  await copyFile(path.resolve("src/flow-graph/flow-workspace.css"),
    path.join(cliContentionRepository, "src/flow-graph/flow-workspace.css"));
  await copyFile(path.resolve("src/flow-graph/flow-workspace-shell.css"),
    path.join(cliContentionRepository, "src/flow-graph/flow-workspace-shell.css"));
  const cliClosurePath = path.join(
    cliContentionRepository, "scripts/verification-reliability-closure.mjs",
  );
  await copyFile(path.resolve("scripts/verification-reliability-closure.mjs"), cliClosurePath);
  const cliPrerequisitePath = path.join(
    cliContentionRepository, "scripts/verification-execution-prerequisites.mjs",
  );
  await copyFile(path.resolve("scripts/verification-execution-prerequisites.mjs"), cliPrerequisitePath);
  await copyFile(path.resolve("scripts/verification-browser-prerequisite-normalization.mjs"),
    path.join(cliContentionRepository, "scripts/verification-browser-prerequisite-normalization.mjs"));
  const buildOwnerFile = path.join(cliContentionRepository, "tmp", "cli-contention-build-owner");
  await writeFile(path.join(cliContentionRepository, "scripts/build.mjs"), [
    'import { writeFile } from "node:fs/promises";',
    'import { withDistArtifactLock } from "./dist-artifact-lock.mjs";',
    `await withDistArtifactLock(async() => { await writeFile(${JSON.stringify(buildOwnerFile)}, process.ppid + " " + process.pid + "\\n"); await new Promise(() => setInterval(() => {}, 1000)); });`,
    "",
  ].join("\n"));
  await mkdir(path.join(cliContentionRepository, "tmp"), { recursive:true });
  const installedNodeModulesRoot = resolvedNodeModulesRoot();
  const fixtureNodeModulesRoot = path.join(cliContentionRepository, "node_modules");
  await symlink(installedNodeModulesRoot, fixtureNodeModulesRoot, "dir");
  assert.equal(await realpath(fixtureNodeModulesRoot), await realpath(installedNodeModulesRoot),
    "the isolated checkpoint fixture attaches the resolved locked npm prerequisites");
  await symlink(path.resolve("tmp/tools"), path.join(cliContentionRepository, "tmp/tools"), "dir");
  await writeFile(path.join(cliContentionRepository, ".git/info/exclude"),
    "node_modules\n.swarmforge\nverification/task-succession.json\n");
  await exec("git", ["add", "scripts/run-focused-acceptance.mjs",
    "scripts/verification-run-intent.mjs",
    "scripts/settled-final-verification-policy.mjs",
    "scripts/dist-artifact-lock.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-closure.mjs",
    "scripts/verification-execution-prerequisites.mjs",
    "scripts/verification-browser-prerequisite-normalization.mjs", "scripts/build.mjs",
    "scripts/verification-same-target-planner-projection.mjs",
    "scripts/verification-task-succession.mjs",
    "scripts/verification-styles.mjs", "scripts/verification-packs.mjs",
    ...extractedVerificationPaths,
    ...(obsoleteManifestExisted ? [obsoleteManifestPath] : []),
    "scripts/verification-pack-cardinality/contract.mjs",
    "scripts/verification-pack-cardinality/focused-evidence.mjs",
    "scripts/live-target-permission-recovery-focused-evidence.mjs",
    "scripts/side-panel-single-cutover-focused-evidence.mjs",
    "scripts/verification-shared-boundaries.mjs",
    "test/browser-packs/global-style-smoke.mjs", "test/stylesheet-declarations-property-test.mjs",
    "test/data-layer-flow-visual-asset-portability-property-test.mjs",
    "test/verification-contracts/lifecycle-properties-test.mjs",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/data-layer-documentation-template-acceptance-test.mjs",
    "test/data-layer-documentation-template-excel-test.mjs",
    "test/data-layer-documentation-template-library-test.mjs",
    "test/data-layer-documentation-template-rich-test.mjs",
    "test/live-target-permission-recovery-acceptance-test.mjs",
    "src/documentation-templates/excel-renderer.ts",
    "src/documentation-templates/excel-template.ts",
    "src/documentation-templates/excel-workbook.ts",
    "src/documentation-templates/rich-renderer.ts",
    "src/documentation-templates/rich-template.ts",
    "src/documentation-templates/template-body.ts",
    "src/documentation-templates/template-context.ts",
    "src/documentation-templates/template-contract.ts",
    "src/documentation-templates/template-library.ts",
    "src/project-documentation/workspace-template-library-ui.ts",
    "test/flow-stylesheet-extraction-test.mjs", "src/flow-graph/flow-workspace.css",
    "src/flow-graph/flow-workspace-shell.css",
    "verification/packs.json"], {
    cwd:cliContentionRepository,
  });
  await exec("git", ["commit", "-qm", "cli contention fixture baseline"], { cwd:cliContentionRepository });
  await writeFile(path.join(cliContentionRepository, "scripts/build.mjs"), `${await readFile(
    path.join(cliContentionRepository, "scripts/build.mjs"), "utf8")}\n`);
  await exec("git", ["add", "scripts/build.mjs"], { cwd:cliContentionRepository });
  await exec("git", ["commit", "-qm", "cli contention fixture"], { cwd:cliContentionRepository });

  const packIds = JSON.parse(await readFile(path.join(cliContentionRepository,
    "verification/packs.json"), "utf8"))
    .filter((pack) => ["unit", "property", "features", "browserAdapters",
      "browserObservations", "checkpointCommands"].some((key) => pack[key]?.length))
    .map(({ id }) => id);
  const checkpointArgs = ["scripts/run-focused-acceptance.mjs",
    ...packIds.flatMap((id) => ["--pack", id]), "--property", "--changed-since", "HEAD^",
    "--prepare-evidence", "vtd014-cli-contention"];
  const observeCli = (args, environment = {}) => {
    const childEnvironment={...process.env,...environment,
      SWARMFORGE_SYNTHETIC_VERIFICATION_FIXTURE:JSON.stringify({
        version:1,root:cliContentionRepository,
        registry:path.join(cliContentionRepository,"verification/packs.json"),
        receiptDirectory:path.join(cliContentionRepository,"tmp/verification-receipts"),
        reliabilityStore:path.join(cliContentionRepository,".git/swarmforge-timeout-incidents"),
        admissibleAsProductionEvidence:false,
      })};
    delete childEnvironment.SWARMFORGE_VERIFICATION_PARENT_CONTEXT;
    delete childEnvironment.SWARMFORGE_VERIFICATION_TASK_KEY;
    delete childEnvironment.SWARMFORGE_VERIFICATION_RECEIPT;
    const child = spawn(process.execPath, args, {
      cwd:cliContentionRepository, stdio:["ignore", "pipe", "pipe"],
      env:childEnvironment,
    });
    cliProcesses.add(child);
    const observation = { child, stdout:"", stderr:"" };
    child.stdout.on("data", (chunk) => { observation.stdout += chunk; });
    child.stderr.on("data", (chunk) => { observation.stderr += chunk; });
    observation.closed = new Promise((resolve) => child.once("close", (code, signal) => {
      cliProcesses.delete(child);
      resolve({ code, signal });
    }));
    return observation;
  };
  const waitForCli = async(observation, predicate, description,
    timeoutMs = CLI_CONTENTION_READINESS_TIMEOUT_MS) => {
    const deadline = Date.now() + timeoutMs;
    while (!await predicate(observation) && observation.child.exitCode === null &&
        observation.child.signalCode === null && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    const ready = await predicate(observation);
    const fixtureStatus = ready ? "" : await exec("git", ["status", "--short"], {
      cwd:cliContentionRepository,
    }).catch((error) => `status unavailable: ${error.message}`);
    assert.ok(ready,
      `${description}: ${observation.stdout}${observation.stderr}\nfixture status:\n${fixtureStatus}`);
  };
  const firstCli = observeCli(checkpointArgs);
  await waitForCli(firstCli, ({ stderr }) => stderr.includes("[verify:start] npm run build"),
    "the first real CLI did not claim its checkpoint before starting the build");
  await waitForCli(firstCli, async() => {
    try { return Boolean((await readFile(buildOwnerFile, "utf8")).trim()); }
    catch (error) { if (error?.code === "ENOENT") return false; throw error; }
  }, "the first real CLI build did not acquire the artifact lease");

  const compatibleCli = observeCli(checkpointArgs, { DIST_ARTIFACT_LOCK_TIMEOUT_MS:"100" });
  const compatibleExit = await compatibleCli.closed;
  assert.equal(compatibleExit.code, 1);
  assert.match(compatibleCli.stderr, /Compatible checkpoint attempt [a-f0-9]{64} is already active/u);
  assert.match(compatibleCli.stderr, /no duplicate all-pack process launched/u);
  assert.doesNotMatch(compatibleCli.stderr, /\[verify:start\]|Timed out waiting.*dist artifact lock/u,
    "a compatible CLI must attach before task timing or artifact-lock waiting");

  const incompatibleArgs = [...checkpointArgs.slice(0, -1), "vtd014-cli-contention-incompatible"];
  const incompatibleCli = observeCli(incompatibleArgs, { DIST_ARTIFACT_LOCK_TIMEOUT_MS:"100" });
  const incompatibleExit = await incompatibleCli.closed;
  assert.equal(incompatibleExit.code, 1);
  assert.match(incompatibleCli.stderr, /Incompatible checkpoint attempt [a-f0-9]{64} is owned by pid/u);
  assert.doesNotMatch(incompatibleCli.stderr, /\[verify:start\]|Timed out waiting.*dist artifact lock/u,
    "an incompatible CLI must report the named owner before task timing or artifact-lock waiting");

  const buildGroupPid = await cliBuildProcessGroup();
  firstCli.child.kill("SIGKILL");
  terminateCliBuildGroup(buildGroupPid);
  await firstCli.closed;
  await rm(buildOwnerFile, { force:true });

  const staleCli = observeCli(checkpointArgs, { DIST_ARTIFACT_LOCK_TIMEOUT_MS:"3000" });
  await waitForCli(staleCli, ({ stderr }) => stderr.includes("[verify:checkpoint-continue]"),
    "a replacement real CLI did not recover the stale checkpoint owner");
  await waitForCli(staleCli, ({ stderr }) => stderr.includes("[verify:start] npm run build"),
    "the stale-owner replacement did not proceed after recovery");
  await waitForCli(staleCli, async() => {
    try { return Boolean((await readFile(buildOwnerFile, "utf8")).trim()); }
    catch (error) { if (error?.code === "ENOENT") return false; throw error; }
  }, "the stale-owner replacement build did not publish its cleanup identity");
  assert.ok(staleCli.stderr.indexOf("[verify:checkpoint-continue]") <
    staleCli.stderr.indexOf("[verify:start] npm run build"),
  "stale-owner recovery must complete outside and before task timing");
  const staleBuildGroupPid = await cliBuildProcessGroup();
  staleCli.child.kill("SIGTERM");
  await staleCli.closed;
  terminateCliBuildGroup(staleBuildGroupPid);
} finally {
  for (const child of cliProcesses) child.kill("SIGKILL");
  await Promise.all([...cliProcesses].map((child) => new Promise((resolve) => child.once("close", resolve))));
  for (const group of cliBuildProcessGroups) terminateCliBuildGroup(group);
  await removeVerificationFixtureRoot(cliContentionRoot);
}
const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);
function pack(id, overrides = {}) {
  return {
    id,
    source:[`src/${id}/`], process:[], globalImpact:[], dependencies:[], sharedComponents:[],
    verificationInputs:[], runtimeInputs:[],
    unit:[`test/${id}-one-test.mjs`, `test/${id}-two-test.mjs`], property:[],
    features:[`features/${id}-one.feature`, `features/${id}-two.feature`],
    handlers:[`acceptance/src/acceptance/steps/${id}.clj`], browserAdapters:[],
    browserAdapterModes:[], browserObservations:[], checkpointCommands:[],
    ...overrides,
  };
}
