import {calibrationRuleEvidence} from "./calibration-rule-evidence.mjs";
import {preContextPlan,preContextSourceInventory} from "./ownership-terminal-identity-support.mjs";
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { estimatePlanMilliseconds, reportVerificationThroughput } from "../../scripts/report-verification-throughput.mjs";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification, verificationOwner } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});

const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);

const syntheticChangeSet = (entries) => ({
  version:1,
  baseCommit:"1".repeat(40),
  commit:"2".repeat(40),
  entries,
  paths:[...new Set(entries.flatMap((entry) => entry.oldPath
    ? [entry.oldPath, entry.newPath]
    : [entry.path]))].sort(),
});

const packs = await loadVerificationPacks();
const vtd005EditorTargetIds = ["LAYERED_SCHEMA_EDITOR_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET",
  "LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET"];

const layeredEditorClasses = {
  canonical_editor_general_presentation:{
    paths:["src/canonical-schema-focused/navigator-rows.ts",
      "src/data-layer-canonical-schema-render-navigator.ts",
      "src/data-layer-side-panel-schema-editor.ts",
      "src/data-layer-side-panel-unified-schema-editor.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_TARGET"],
  },
  canonical_editor_rule_authoring:{
    paths:["src/data-layer-canonical-predicate-editor.ts",
      "src/data-layer-canonical-schema-focused-condition-tree.ts",
      "src/data-layer-canonical-schema-focused-conditions.ts",
      "src/data-layer-canonical-schema-focused-rule-add.ts",
      "src/data-layer-canonical-schema-focused-rule-rows.ts",
      "src/data-layer-canonical-schema-focused-rules.ts",
      "src/data-layer-project-condition-editor.ts","src/data-layer-shared-condition-tree-editor.ts",
      "src/data-layer-string-rule-validation-ui.ts","src/data-layer-string-rule-validation.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_RULES_TARGET"],
  },
  canonical_editor_document_integration:{
    paths:["src/canonical-schema-focused/definition.ts","src/canonical-schema-focused/documentation.ts",
      "src/canonical-schema-focused/example.ts","src/canonical-schema-focused/presence.ts",
      "src/canonical-schema-focused/structure.ts","src/canonical-schema-focused/values.ts",
      "src/data-layer-canonical-schema-focused-command.ts",
      "src/data-layer-canonical-schema-focused-drafts.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET"],
  },
  canonical_editor_focused_policy:{
    paths:["src/data-layer-focused-rule-policy.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_POLICY_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET"],
  },
  canonical_editor_shared_primitives:{
    paths:["src/canonical-schema-focused/dom.ts","src/data-layer-canonical-schema-focused-editor.ts",
      "src/data-layer-canonical-schema-focused-facets-ui.ts",
      "src/data-layer-canonical-schema-focused-menu.ts",
      "src/data-layer-canonical-schema-focused-sections.ts","src/data-layer-canonical-schema-render.ts",
      "src/data-layer-canonical-schema-ui.ts","src/data-layer-focused-schema-property-menu.ts",
      "src/data-layer-focused-schema-property-ui.ts"],
    targets:["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET",
      "LAYERED_SCHEMA_EDITOR_RULES_TARGET","LAYERED_SCHEMA_EDITOR_TARGET"],
  },
};

const layeredSourceInventory = preContextSourceInventory((await verificationInventory()).source
  .filter((sourcePath) => verificationOwner(packs, sourcePath) === "layered_schema"),packs,planVerification);

const layeredPack = packs.find(({id}) => id === "layered_schema");

const exactLayeredPlan = preContextPlan(planVerification(packs,{packIds:["layered_schema"],includeProperties:true}));

const editorLeafCounts = Object.fromEntries(layeredPack.browserEvidencePartitions
  .find(({sessionBatch}) => sessionBatch === "layered-schema-editor").targets
  .map(({id,leaves}) => [id,leaves.length]));

const targetsFor = (plan) => plan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort();

const editorHistoryChange = (entry) => syntheticChangeSet([entry]);

const deleteRules = editorHistoryChange({status:"D",
  path:"src/data-layer-canonical-schema-focused-rules.ts"});

const renameRules = editorHistoryChange({status:"R",score:100,
  oldPath:"src/data-layer-canonical-schema-focused-rule-add.ts",
  newPath:"src/data-layer-canonical-schema-focused-rule-rows.ts"});

const renameRulesCanonical = editorHistoryChange({status:"R",score:100,
  oldPath:"src/data-layer-canonical-schema-focused-rules.ts",
  newPath:"src/canonical-schema-focused/definition.ts"});

const renameGeneralShared = editorHistoryChange({status:"R",score:100,
  oldPath:"src/canonical-schema-focused/navigator-rows.ts",
  newPath:"src/data-layer-canonical-schema-render.ts"});

const historyTargets = (change,extra={}) => targetsFor(planVerification(packs,{
  changedPaths:change.paths,changeSet:change,basePacks:packs,...extra,
}));

const layeredHistoryPlans = {
  delete:historyTargets(deleteRules),renameRules:historyTargets(renameRules),
  renameRulesCanonical:historyTargets(renameRulesCanonical),
  renameGeneralShared:historyTargets(renameGeneralShared),
  unavailable:planVerification(packs,{changedPaths:deleteRules.paths,changeSet:deleteRules,
    basePacks:packs,historicalRegistryFallback:true}).packIds,
};

const committedTimingBaseline = JSON.parse(await readFile(
  new URL("../../verification/timing-baseline.json", import.meta.url), "utf8"));
const committedCalibrationReport = JSON.parse(await readFile(
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));
const {committedSnapshot,liveCalibrationLedger,refreshedSnapshot,historical} =
  calibrationRuleEvidence(committedCalibrationReport);

const handoffRepository = await mkdtemp(path.join(os.tmpdir(), "verification-handoff-boundary-"));

try {
  await mkdir(path.join(handoffRepository, ".swarmforge"), { recursive:true });
  await mkdir(path.join(handoffRepository, "docs"), { recursive:true });
  await mkdir(path.join(handoffRepository, "scripts"), { recursive:true });
  await writeFile(path.join(handoffRepository, "scripts", "verification-reliability-incidents.mjs"), [
    'import { access } from "node:fs/promises";',
    'import path from "node:path";',
    'if (process.argv[2] !== "assert-handoff") process.exit(2);',
    'try { await access(path.join(process.cwd(), ".block-reliability-handoff"));',
    '  console.error("unresolved reliability incident fixture"); process.exit(1); } catch {}',
    '',
  ].join("\n"));
  await writeFile(path.join(handoffRepository, "scripts", "settled-final-verification.mjs"), [
    'if (!["validate-handoff", "verify-review", "verify-release-candidate"].includes(process.argv[2])) process.exit(2);',
    'console.log("handoff readiness fixture passed");',
    '',
  ].join("\n"));
  await writeFile(path.join(handoffRepository, ".swarmforge", "roles.tsv"),
    "specifier\tspecifier\nrefactorer\trefactorer\ncoder\tcoder\narchitect\tarchitect\n");
  await writeFile(path.join(handoffRepository, "README.md"), "base\n");
  await exec("git", ["init", "-q"], { cwd:handoffRepository });
  await exec("git", ["config", "user.name", "Handoff Boundary Test"], { cwd:handoffRepository });
  await exec("git", ["config", "user.email", "handoff@example.test"], { cwd:handoffRepository });
  await exec("git", ["add", ".swarmforge/roles.tsv", "README.md"], { cwd:handoffRepository });
  await exec("git", ["commit", "-qm", "base"], { cwd:handoffRepository });
  const handoffBase = await exec("git", ["rev-parse", "--short=10", "HEAD"], { cwd:handoffRepository });
  await writeFile(path.join(handoffRepository, "docs", "approved-specification.md"), "approved\n");
  await exec("git", ["add", "docs/approved-specification.md"], { cwd:handoffRepository });
  await exec("git", ["commit", "-qm", "specification only"], { cwd:handoffRepository });
  const specificationCommit = await exec("git", ["rev-parse", "--short=10", "HEAD"], { cwd:handoffRepository });
  const handoffScript = path.resolve("swarmforge/scripts/swarm_handoff.bb");
  const allowedDraft = path.join(handoffRepository, "allowed.handoff-draft");
  await writeFile(allowedDraft, [
    "type: git_handoff", "to: refactorer", "priority: 00", "task: specification-only",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`, "verified: not-required", "",
  ].join("\n"));
  assert.match(await exec("bb", [handoffScript, allowedDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"specifier" },
  }), /HANDOFF QUEUED/u, "specification-only handoffs retain the explicit not-required path");
  const releaseDraft = path.join(handoffRepository, "release.handoff-draft");
  await writeFile(releaseDraft, [
    "type: git_handoff", "to: architect", "priority: 00", "task: qa-master-promotion",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`,
    "readiness: release-candidate", "verified: qa-candidate", "",
  ].join("\n"));
  assert.match(await exec("bb", [handoffScript, releaseDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"specifier" },
  }), /HANDOFF QUEUED/u, "an explicit QA release candidate routes from specifier to architect");
  const qaReadyDraft = path.join(handoffRepository, "qa-ready.handoff-draft");
  await writeFile(qaReadyDraft, [
    "type: git_handoff", "to: specifier", "priority: 00", "task: qa-feature",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`,
    "readiness: qa-ready", "verified: review-ready", "",
  ].join("\n"));
  assert.match(await exec("bb", [handoffScript, qaReadyDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"architect" },
  }), /HANDOFF QUEUED/u, "bound focused evidence can route an exact feature candidate to QA");
  const misroutedReleaseDraft = path.join(handoffRepository, "misrouted-release.handoff-draft");
  await writeFile(misroutedReleaseDraft, [
    "type: git_handoff", "to: coder", "priority: 00", "task: qa-master-promotion",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`,
    "readiness: release-candidate", "verified: qa-candidate", "",
  ].join("\n"));
  await assert.rejects(() => exec("bb", [handoffScript, misroutedReleaseDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"specifier" },
  }), /QA release candidates are limited to the specifier-to-architect route/u);
  const blockedDraft = path.join(handoffRepository, "blocked.handoff-draft");
  await writeFile(blockedDraft, [
    "type: git_handoff", "to: refactorer", "priority: 00", "task: blocked-reliability",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`, "verified: not-required", "",
  ].join("\n"));
  await writeFile(path.join(handoffRepository, ".block-reliability-handoff"), "blocked\n");
  await assert.rejects(() => exec("bb", [handoffScript, blockedDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"specifier" },
  }), /Git handoff is blocked by reliability incident state/u);
  await rm(path.join(handoffRepository, ".block-reliability-handoff"));
  const queuedHandoffNames = (await readdir(
    path.join(handoffRepository, ".swarmforge", "handoffs", "outbox"),
  )).filter((name) => name.endsWith(".handoff"));
  assert.equal(queuedHandoffNames.length, 3, "the ordinary, QA-ready, and release-candidate handoffs are queued");
  const queuedHandoff = await readFile(path.join(
    handoffRepository, ".swarmforge", "handoffs", "outbox", queuedHandoffNames[0],
  ), "utf8");
  assert.doesNotMatch(queuedHandoff, /merge_and_process/u,
    "Git handoffs must not emit a workflow label that resembles an executable");
  assert.match(queuedHandoff, /This is a workflow instruction, not a shell command\./u,
    "Git handoffs distinguish prose instructions from executable commands");
  assert.ok(queuedHandoff.includes(`commit \`${specificationCommit}\``),
    "Git handoffs identify the candidate commit in prose");
  assert.match(queuedHandoff, /`swarmforge\/scripts\/done_with_current\.sh`/u,
    "Git handoffs name the actual completion helper explicitly");

  await mkdir(path.join(handoffRepository, "src"), { recursive:true });
  await writeFile(path.join(handoffRepository, "docs", "mixed.md"), "documentation\n");
  await writeFile(path.join(handoffRepository, "src", "product.ts"), "export const changed = true;\n");
  await exec("git", ["add", "docs/mixed.md", "src/product.ts"], { cwd:handoffRepository });
  await exec("git", ["commit", "-qm", "mixed documentation and product"], { cwd:handoffRepository });
  const mixedCommit = await exec("git", ["rev-parse", "--short=10", "HEAD"], { cwd:handoffRepository });
  const mixedDraft = path.join(handoffRepository, "mixed.handoff-draft");
  await writeFile(mixedDraft, [
    "type: git_handoff", "to: refactorer", "priority: 00", "task: mixed-change",
    `commit: ${mixedCommit}`, `base: ${specificationCommit}`, "verified: not-required", "",
  ].join("\n"));
  await assert.rejects(() => exec("bb", [handoffScript, mixedDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"specifier" },
  }), /durable exact-pack evidence is required for: src\/product\.ts/u,
  "a documentation change cannot hide a product change behind not-required");

  const coderDraft = path.join(handoffRepository, "coder.handoff-draft");
  await writeFile(coderDraft, [
    "type: git_handoff", "to: refactorer", "priority: 00", "task: coder-specification",
    `commit: ${specificationCommit}`, `base: ${handoffBase}`, "verified: not-required", "",
  ].join("\n"));
  await assert.rejects(() => exec("bb", [handoffScript, coderDraft], {
    cwd:handoffRepository, env:{ ...process.env, SWARMFORGE_ROLE:"coder" },
  }), /Coder handoffs require durable exact-pack evidence/u);
} finally {
  await rm(handoffRepository, { recursive:true, force:true });
}

const sequenceRepository = await mkdtemp(path.join(os.tmpdir(), "verification-handoff-sequence-"));

try {
  const sequenceState = path.join(sequenceRepository, ".swarmforge", "handoffs");
  const sequenceFile = path.join(sequenceState, "sequence");
  const sequenceOwner = path.join(sequenceState, "sequence.lock", "owner.edn");
  const interruptedStage = path.join(sequenceState, ".sequence.interrupted.tmp");
  const sequenceHelper = path.resolve("swarmforge/scripts/handoff_lib.bb");
  const sequenceLockModule = path.resolve("swarmforge/scripts/handoff_sequence.bb");
  const holderScript = path.join(sequenceRepository, "hold-sequence-lock.bb");
  await mkdir(sequenceState, { recursive:true });
  await writeFile(sequenceFile, "000041\n");
  await writeFile(holderScript, [
    "#!/usr/bin/env bb",
    "(require '[babashka.fs :as fs])",
    `(load-file ${JSON.stringify(sequenceLockModule)})`,
    `(let [with-lock (resolve 'swarmforge.handoff-sequence/with-sequence-lock!)]`,
    `  (with-lock ${JSON.stringify(sequenceState)} (fn []`,
    `    (spit ${JSON.stringify(interruptedStage)} "0")`,
    "    (println \"LOCKED\")",
    "    (flush)",
    "    (Thread/sleep 10000))))",
    "",
  ].join("\n"));

  const holder = spawn("bb", [holderScript], {
    cwd:sequenceRepository,
    stdio:["ignore", "pipe", "pipe"],
  });
  let holderStdout = "";
  let holderStderr = "";
  holder.stdout.on("data", (chunk) => { holderStdout += chunk; });
  holder.stderr.on("data", (chunk) => { holderStderr += chunk; });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(
      `handoff sequence holder did not acquire its lock: ${holderStdout}${holderStderr}`,
    )), 3_000);
    const observe = () => {
      if (!holderStdout.includes("LOCKED")) return;
      clearTimeout(timer);
      holder.stdout.off("data", observe);
      resolve();
    };
    holder.stdout.on("data", observe);
    holder.once("close", (code, signal) => {
      if (holderStdout.includes("LOCKED")) return;
      clearTimeout(timer);
      reject(new Error(`handoff sequence holder exited before locking (${signal ?? code}): ${holderStderr}`));
    });
    observe();
  });

  const liveOwner = await readFile(sequenceOwner, "utf8");
  assert.match(liveOwner, /:pid \d+/u);
  assert.match(liveOwner, /:start-time "[^"]+"/u);
  assert.match(liveOwner, /:token "[^"]+"/u);
  const timeoutStarted = Date.now();
  await assert.rejects(() => exec("bb", [sequenceHelper, "next-sequence"], {
    cwd:sequenceRepository,
    env:{ ...process.env, SWARMFORGE_SEQUENCE_LOCK_TIMEOUT_MS:"100" },
  }), /Timed out after 100ms waiting for handoff sequence lock.*owner pid/u,
  "a live handoff sequence owner must be excluded by a bounded wait");
  assert.ok(Date.now() - timeoutStarted < 1_000, "handoff sequence lock timeout must remain bounded");
  assert.equal(await readFile(sequenceFile, "utf8"), "000041\n",
    "a timed-out contender must not mutate the published sequence");

  const holderExitPromise = new Promise((resolve) =>
    holder.once("close", (code, signal) => resolve({ code, signal })));
  assert.equal(holder.kill("SIGKILL"), true);
  const holderExit = await holderExitPromise;
  assert.equal(holderExit.signal, "SIGKILL");
  assert.equal(await readFile(interruptedStage, "utf8"), "0",
    "the crash fixture must leave a partial unpublished stage");
  assert.equal(await exec("bb", [sequenceHelper, "next-sequence"], {
    cwd:sequenceRepository,
    env:{ ...process.env, SWARMFORGE_SEQUENCE_LOCK_TIMEOUT_MS:"500" },
  }), "000042", "a killed owner must release its kernel lease and recover monotonically");
  assert.equal(await readFile(sequenceFile, "utf8"), "000042\n",
    "crash recovery must ignore an unpublished partial stage and atomically advance the prior sequence");
  await assert.rejects(readFile(sequenceOwner), (error) => error?.code === "ENOENT",
    "the recovering owner must remove only its matching owner record on release");

  await writeFile(sequenceFile, "00004x");
  await assert.rejects(() => exec("bb", [sequenceHelper, "next-sequence"], {
    cwd:sequenceRepository,
  }), /Malformed handoff sequence file; refusing to reset or reuse an id/u,
  "a truncated or malformed published counter must fail closed");
  assert.equal(await readFile(sequenceFile, "utf8"), "00004x",
    "malformed sequence recovery must never silently reset the counter to zero");
  await writeFile(sequenceFile, "000042\n");
  assert.equal(await exec("bb", [sequenceHelper, "next-sequence"], { cwd:sequenceRepository }), "000043");

  const concurrentSequences = await Promise.all(Array.from({ length:6 }, () =>
    exec("bb", [sequenceHelper, "next-sequence"], { cwd:sequenceRepository })));
  assert.deepEqual(concurrentSequences.map(Number).sort((left, right) => left - right), [44, 45, 46, 47, 48, 49],
    "concurrent handoff writers must receive one unique monotonic sequence each");
  assert.equal(await readFile(sequenceFile, "utf8"), "000049\n");
} finally {
  await rm(sequenceRepository, { recursive:true, force:true });
}

const handoffSource = await readFile(new URL("../../swarmforge/scripts/swarm_handoff.bb", import.meta.url), "utf8");

const handoffLibrarySource = await readFile(new URL("../../swarmforge/scripts/handoff_lib.bb", import.meta.url), "utf8");

assert.match(handoffSource, /"verify" canonical-commit canonical-base \(get headers "task"\) verified/u);

assert.doesNotMatch(handoffSource, /verify" canonical-commit \(get headers "task"\) verified/u);

for (const source of [handoffSource, handoffLibrarySource]) {
  assert.match(source, /swarmforge\.handoff-sequence\/next-sequence!/u,
    "every handoff sequence caller must use the shared crash-safe allocator");
  assert.doesNotMatch(source, /fs\/create-dir lock-dir/u,
    "handoff callers must not retain the legacy unbounded directory lock");
}

const vtd005SnapshotReport = reportVerificationThroughput({packs,baseline:committedTimingBaseline,
  receipts:committedSnapshot.receipts,
  environmentClassId:refreshedSnapshot.environmentClassId,
  minimumIndependentSamples:5});

const vtd005BoundaryRepresentatives = {
  canonical_editor_general_presentation:"src/canonical-schema-focused/navigator-rows.ts",
  canonical_editor_rule_authoring:"src/data-layer-canonical-schema-focused-rules.ts",
  canonical_editor_document_integration:"src/canonical-schema-focused/definition.ts",
  canonical_editor_focused_policy:"src/data-layer-focused-rule-policy.ts",
};

const vtd005BoundaryCalibration = Object.fromEntries(Object.entries(vtd005BoundaryRepresentatives)
  .map(([boundary,changedPath]) => [boundary,{changedPath,
    baseline:Number((estimatePlanMilliseconds(preContextPlan(planVerification(packs,{changedPaths:[changedPath]})),
      vtd005SnapshotReport.model)/1000).toFixed(1)),tolerance:1.2}]));

// Authored inputs have no task durations: this checks baseline fallback, not remeasurement.
assert.deepEqual(Object.values(vtd005BoundaryCalibration).map(({baseline}) => baseline),
  [54.6,54.5,95.2,72.9]);

const vtd005BaseCalibration = JSON.parse(await exec("git",[
  "show","99782ccc49^:verification/performance-calibration.json"]));

assert.deepEqual(committedCalibrationReport.runnablePacks.filter(({id}) => !["layered_schema", "shell"].includes(id)),
  vtd005BaseCalibration.runnablePacks.filter(({id}) => !["layered_schema", "shell"].includes(id)));

const currentLayeredCalibration = committedCalibrationReport.runnablePacks.find(({id}) => id === "layered_schema");

const baseLayeredCalibration = vtd005BaseCalibration.runnablePacks.find(({id}) => id === "layered_schema");

assert.deepEqual(currentLayeredCalibration.exactPackDuration,baseLayeredCalibration.exactPackDuration);

assert.deepEqual(currentLayeredCalibration.changedPathFanOut,baseLayeredCalibration.changedPathFanOut);

assert.deepEqual(Object.fromEntries(Object.entries(committedCalibrationReport.browserTargets)
  .filter(([id]) => !vtd005EditorTargetIds.includes(id))),
Object.fromEntries(Object.entries(vtd005BaseCalibration.browserTargets)
  .filter(([id]) => !vtd005EditorTargetIds.includes(id))));

const vtd005Acceptance = {
  classes:Object.fromEntries(Object.entries(layeredEditorClasses).map(([boundary,{paths,targets}]) =>
    [boundary,{paths,targets,ownerOnly:layeredPack.impactBoundaries
      .find(({id}) => id === boundary)?.propagateDependants === false}])),
  plans:Object.fromEntries(Object.values(layeredEditorClasses).flatMap(({paths}) => paths).map((changedPath) => {
    const plan = preContextPlan(planVerification(packs,{changedPaths:[changedPath],includeProperties:true}));
    return [changedPath,{boundary:plan.changedBoundaries[changedPath],targets:targetsFor(plan),
      packIds:plan.packIds,browserSessions:plan.observationTasks.length,unit:plan.unitTasks.length,
      property:plan.propertyTasks.length,features:plan.features,handlers:plan.handlers}];
  })),
  history:layeredHistoryPlans,
  calibration:{boundaries:vtd005BoundaryCalibration,projectionSource:"committed-baseline-fallback",
    targets:Object.fromEntries(vtd005EditorTargetIds.map((id) =>
      [id,committedCalibrationReport.browserTargets[id]])),
    receiptDigests:committedCalibrationReport.receiptDigests,sourceEvidence:historical,
    rejectedByReason:liveCalibrationLedger.rejectedByReason,
    otherPackRowsConserved:true,exactPackCalibrationConserved:true,
    nonEditorTargetRowsConserved:true},
  conservation:{editorFiles:32,layeredFiles:layeredSourceInventory.length,leafCounts:editorLeafCounts,
    editorLeaves:Object.values(editorLeafCounts).reduce((sum,count) => sum + count,0),
    exactTasks:exactLayeredPlan.tasks.length,builds:exactLayeredPlan.preparationTasks.length,
    unit:exactLayeredPlan.unitTasks.length,property:exactLayeredPlan.propertyTasks.length,
    browserSessions:exactLayeredPlan.observationTasks.length,
    targetIds:exactLayeredPlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort(),
    parses:exactLayeredPlan.parserTasks.length,generators:exactLayeredPlan.generatorTasks.length,
    acceptanceSessions:exactLayeredPlan.sessionTasks.length,exactIdentitiesConserved:true,
    terminalIdentitiesConserved:true},
};

console.log(JSON.stringify({ vtd005Acceptance }));
