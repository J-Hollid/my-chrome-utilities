import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { link, mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertFreshDist } from "./dist-artifact.mjs";
import { acquireDistArtifactLock, inheritedDistArtifactLockIsHeld } from "./dist-artifact-lock.mjs";
import { acquireVerificationNotesLock } from "./verification-git-notes.mjs";
import {
  canonicalVerificationChangeSet,
  requireGitAncestor,
  verificationPacksAtCommit,
} from "./verification-changes.mjs";
import { planVerification, verificationTaskIdentity } from "./verification-packs.mjs";
import {
  createCheckpointAttemptStore,
  defaultCheckpointAttemptDirectory, defaultLegacyCheckpointAttemptDirectory,
} from "./verification-checkpoint-attempt.mjs";
import {
  consumeVerificationLaunchAuthorization, createVerificationLaunchAuthorizations,
  expandVerificationTaskPrerequisites,
  preflightExecutionPrerequisites, probeExecutionPrerequisiteEnvironment,
  validateTaskExecutionPrerequisites,
} from "./verification-execution-prerequisites.mjs";
import {
  verificationGitNotePromotionTask,
  verificationPromotionTasks,
} from "./verification-promotion-plan.mjs";
import {
  assertNoBlockingTimeoutIncidents,
  createTimeoutIncidentStore,
  timeoutRepairPackageTaskIdentity,
} from "./verification-reliability-incidents.mjs";
import {
  boundedClosureEvidenceTask,
  terminalClosureExecution,
} from "./verification-reliability-closure.mjs";
import { createVerificationPackCardinalityAdapter } from
  "./verification-pack-cardinality/contract.mjs";
import {
  registryCardinalityFocusedTaskKeys,
  validateRegistryCardinalityFocusedEvidence,
} from "./verification-pack-cardinality/focused-evidence.mjs";
import {
  canonicalRunIntentBootstrapPlan,
  requireVerificationRunIntent,
  runIntentBootstrapCoverage,
  validateRunIntentBootstrapBase,
  validateRunIntentBootstrapReceipt,
  verificationRunIntents,
} from "./verification-run-intent.mjs";
import {
  consumeTerminalFullObligations,
  validateReviewReadyRecord,
} from "./settled-final-verification-review.mjs";

function expectedRunIntentForEvidenceTask(task) {
  return task === boundedClosureEvidenceTask
    ? verificationRunIntents.terminal : verificationRunIntents.review;
}

export function requireEvidenceReceiptRunIntent(receipt, expected, {
  allowLegacyResolvedArchive = false,
  candidatePredatesRunIntent = false,
} = {}) {
  if (allowLegacyResolvedArchive && candidatePredatesRunIntent && receipt?.runIntent === undefined) {
    return "pre-intent-resolved-archive";
  }
  return requireVerificationRunIntent(receipt, expected);
}

export async function candidatePredatesRunIntentImplementation(candidateCommit, {
  repositoryRoot = repository,
} = {}) {
  await git(repositoryRoot, "rev-parse", "--verify", `${candidateCommit}^{commit}`);
  try {
    await git(repositoryRoot, "show", `${candidateCommit}:scripts/verification-run-intent.mjs`);
    return false;
  } catch (error) {
    const entry = await git(repositoryRoot, "ls-tree", "--name-only", candidateCommit, "--",
      "scripts/verification-run-intent.mjs");
    if (entry === "") return true;
    throw new Error(`Cannot verify the archived checkpoint run-intent boundary: ${error.message}`);
  }
}

const repository = fileURLToPath(new URL("../", import.meta.url));
const notesRef = "refs/notes/swarmforge-verification";
const reviewReadyNotesRef = "refs/notes/swarmforge-review-ready";
const gitOutputMaxBuffer = 16 * 1024 * 1024;
const shaPattern = /^[a-f0-9]{64}$/u;
const incidentIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const runtimeVersionPattern = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/u;

function git(repositoryRoot, ...args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd:repositoryRoot, maxBuffer:gitOutputMaxBuffer }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim()));
  });
}

function gitBytes(repositoryRoot, ...args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd:repositoryRoot, encoding:"buffer", maxBuffer:gitOutputMaxBuffer }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.toString().trim() || error.message))
      : resolve(stdout));
  });
}

function gitInput(repositoryRoot, args, input) {
  return new Promise((resolve, reject) => {
    const child = execFile("git", args, {
      cwd:repositoryRoot,
      maxBuffer:gitOutputMaxBuffer,
    }, (error, stdout, stderr) => error
      ? reject(new Error(stderr.trim() || error.message))
      : resolve(stdout.trim()));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

async function reviewReadyNote(repositoryRoot, commit) {
  try {
    return JSON.parse(await git(repositoryRoot, "notes", `--ref=${reviewReadyNotesRef}`, "show", commit));
  } catch (error) {
    if (/no note found|cannot read note data|bad object/iu.test(error.message)) return undefined;
    throw error;
  }
}

function canonicalTerminalObligations(obligations = []) {
  return [...obligations].map((item) => ({
    originCommit:item.originCommit,
    originTree:item.originTree,
    consumedByCommit:item.consumedByCommit,
    consumedByTree:item.consumedByTree,
    paths:sortedUnique(item.paths),
  })).sort((left, right) =>
    `${left.originCommit}:${left.originTree}:${left.paths.join(",")}`.localeCompare(
      `${right.originCommit}:${right.originTree}:${right.paths.join(",")}`));
}

function canonicalTerminalPlanEligible(plan, candidatePacks) {
  const expected = planVerification(candidatePacks, {
    terminalFull:true, includeProperties:true,
  }).selectedPackIds;
  return plan?.mode === "exact" && plan.includeProperties === true &&
    same(sortedUnique(plan.selectedPackIds), sortedUnique(expected)) &&
    same(sortedUnique(plan.packIds), sortedUnique(expected)) &&
    plan.tasks?.some(({ key = "" }) => key.startsWith("property:"));
}
export { canonicalTerminalPlanEligible };

async function discoverPendingReviewObligations({ baseCommit, candidateCommit, candidateTree,
  finalPaths, finalTerminalPaths, repositoryRoot, canonicalEvidenceRecord }) {
  const commits = (await git(repositoryRoot, "rev-list", `${baseCommit}..${candidateCommit}`)).split("\n").filter(Boolean);
  const pending = [];
  for (const originCommit of commits) {
    const note = await reviewReadyNote(repositoryRoot, originCommit);
    for (const record of note?.records ?? []) {
      if (record?.terminalObligations?.status !== "pending-master-checkpoint") continue;
      const noteTree = await git(repositoryRoot, "rev-parse", `${originCommit}^{tree}`);
      if (record.candidateCommit !== originCommit || record.candidateTree !== noteTree ||
          record.terminalObligations.candidateCommit !== originCommit ||
          record.terminalObligations.candidateTree !== noteTree) {
        throw new Error("Review-ready terminal obligation is not bound to its note commit and tree");
      }
      validateReviewReadyRecord(record, {
        task:record.task, baseCommit:record.baseCommit,
        candidateCommit:record.candidateCommit, candidateTree:record.candidateTree,
      });
      const originChangeSet = await canonicalVerificationChangeSet({
        base:record.baseCommit, commit:originCommit, repositoryRoot,
      });
      if (!same(originChangeSet, record.changeSet)) {
        throw new Error("Review-ready terminal obligation change set no longer matches its origin range");
      }
      await requireGitAncestor(record.candidateCommit, candidateCommit, { repositoryRoot });
      const paths = sortedUnique(record.terminalObligations.paths);
      if (!paths.every((changedPath) => finalPaths.includes(changedPath))) {
        throw new Error("Terminal obligation path is outside the final master-base change set");
      }
      if (!paths.every((changedPath) => finalTerminalPaths.includes(changedPath))) {
        throw new Error("Final checkpoint does not carry every pending terminal obligation");
      }
      if (canonicalEvidenceRecord) {
        const checkpointReceipt = {
          version:2,
          runId:canonicalEvidenceRecord.receipt.runId ?? canonicalEvidenceRecord.receipt.sha256,
          candidate:{ commit:candidateCommit, tree:candidateTree },
          plan:{ terminalFullObligations:finalTerminalPaths },
          tasks:Object.fromEntries(canonicalEvidenceRecord.receipt.tasks.map((task) => [task.key, task])),
        };
        consumeTerminalFullObligations(record, checkpointReceipt, {
          canonicalCheckpoint:canonicalEvidenceRecord,
          canonicalPackIds:canonicalEvidenceRecord.packIds,
          masterBaseCommit:baseCommit,
          ancestryProof:{ isAncestor:true, originCommit, originTree:noteTree,
            descendantCommit:candidateCommit, descendantTree:candidateTree, changedPaths:finalPaths },
        });
      }
      pending.push({ originCommit, originTree:noteTree,
        consumedByCommit:candidateCommit, consumedByTree:candidateTree, paths });
    }
  }
  const canonical = canonicalTerminalObligations(pending);
  if (canonical.length && !canonical.every(({ paths }) =>
      paths.every((changedPath) => finalPaths.includes(changedPath) && finalTerminalPaths.includes(changedPath)))) {
    throw new Error("Final checkpoint does not carry every pending terminal obligation");
  }
  return canonical;
}

function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(normalized(value));
}

export function verificationDigest(value) {
  return createHash("sha256").update(
    typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(value),
  ).digest("hex");
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function acceptanceArtifacts(feature) {
  const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
  const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/(^-+|-+$)/gu, "");
  return { ir:`build/acceptance/ir/${basename}.json`,
    generated:`build/acceptance/generated/${slug}_acceptance_test.clj` };
}

function recordedSubset(recorded, canonical) {
  if (Array.isArray(recorded)) return Array.isArray(canonical) && recorded.length === canonical.length &&
    recorded.every((value, index) => recordedSubset(value, canonical[index]));
  if (recorded && typeof recorded === "object") return canonical && typeof canonical === "object" &&
    !Array.isArray(canonical) && Object.entries(recorded).every(([key, value]) =>
      Object.hasOwn(canonical, key) && recordedSubset(value, canonical[key]));
  return Object.is(recorded, canonical);
}

export function legacyArchivedCheckpointTaskIdentities(receipt, candidatePacks, packIds) {
  const candidates = [
    ...planVerification(candidatePacks, { terminalFull:true, includeProperties:true }).tasks,
    ...sortedUnique(packIds).flatMap((packId) => planVerification(candidatePacks, {
      packIds:[packId], includeProperties:true,
    }).tasks),
  ].map(verificationTaskIdentity);
  for (const result of Object.values(receipt.tasks ?? {})) {
    const identity = result?.identity;
    if (identity?.stage === "browser-observation" && Array.isArray(identity.logicalTargetIds)) {
      candidates.push(...planVerification(candidatePacks, {
        packIds:[identity.packId], browserTargetIds:identity.logicalTargetIds,
      }).tasks.map(verificationTaskIdentity));
    }
    if (identity?.stage === "acceptance-session" && typeof identity.target === "string") {
      const pack = candidatePacks.find(({ id }) => id === identity.packId);
      const features = identity.target.split(",").filter(Boolean);
      if (pack && features.length && features.every((feature) => pack.features?.includes(feature))) {
        candidates.push({ key:`acceptance-session:${pack.id}`, stage:"acceptance-session",
          packId:pack.id, executable:"bb", args:["acceptance-pack-runner", pack.id,
            ...features.flatMap((feature) => {
              const artifacts = acceptanceArtifacts(feature);
              return [artifacts.generated, artifacts.ir];
            })], target:features.join(","), environment:null, requiredCapabilities:[] });
      }
    }
  }
  candidates.push(timeoutRepairPackageTaskIdentity);
  return Object.entries(receipt.tasks ?? {}).map(([key, result]) => {
    const matches = candidates.filter((identity) => identity.key === key &&
      recordedSubset(result?.identity, identity));
    const distinctMatches = new Set(matches.map((identity) => JSON.stringify(identity)));
    if (distinctMatches.size !== 1) {
      throw new Error(`Legacy archived checkpoint task is absent or ambiguous in its candidate registry: ${key}`);
    }
    return structuredClone(result.identity);
  });
}

function legacyArchivedChangedOwners(changedOwners) {
  return Object.fromEntries(Object.entries(changedOwners).map(([changedPath, owners]) =>
    [changedPath, changedPath.startsWith("dist/") ? [] : owners]));
}

function assertTaskName(task) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/u.test(task ?? "")) {
    throw new Error("Provide a stable task name (letters, numbers, dot, underscore, or hyphen; max 80)");
  }
}

function artifactIdentity(manifest) {
  const identity = {
    schemaVersion:manifest?.schemaVersion,
    buildIdentity:manifest?.buildIdentity,
    inputDigest:manifest?.inputDigest,
    outputDigest:manifest?.outputDigest,
    toolchain:{
      node:manifest?.toolchain?.node,
      typescript:manifest?.toolchain?.typescript,
    },
  };
  if (identity.schemaVersion !== 1 || [identity.buildIdentity, identity.inputDigest, identity.outputDigest]
      .some((value) => !shaPattern.test(value ?? "")) ||
      Object.values(identity.toolchain).some((value) => !runtimeVersionPattern.test(value ?? ""))) {
    throw new Error("A validated dist artifact identity is required for verification evidence");
  }
  return identity;
}

function receiptEnvironment(environment, { allowLegacyExecutionLoad = false } = {}) {
  const keys = ["concurrency", "executionLoad", "node", "observationConcurrency", "platform", "typescript"];
  const legacyKeys = keys.filter((key) => key !== "executionLoad");
  const actualKeys = Object.keys(environment ?? {}).sort();
  const legacyEnvironment = allowLegacyExecutionLoad && same(actualKeys, legacyKeys);
  if (!environment || Array.isArray(environment) ||
      !same(actualKeys, keys) && !legacyEnvironment ||
      !runtimeVersionPattern.test(environment.node ?? "") ||
      !runtimeVersionPattern.test(environment.typescript ?? "") ||
      !/^[a-z0-9]+-[A-Za-z0-9_]+$/u.test(environment.platform ?? "") ||
      !legacyEnvironment && !["normal", "loaded"].includes(environment.executionLoad) ||
      !Number.isInteger(environment.concurrency) || environment.concurrency < 1 ||
      !Number.isInteger(environment.observationConcurrency) || environment.observationConcurrency < 1) {
    throw new Error("Verification receipt has an invalid exact runtime environment");
  }
  return {
    node:environment.node,
    typescript:environment.typescript,
    platform:environment.platform,
    executionLoad:legacyEnvironment ? "unclassified" : environment.executionLoad,
    concurrency:environment.concurrency,
    observationConcurrency:environment.observationConcurrency,
  };
}

function planDocument(plan, { evidenceTask } = {}) {
  if (plan?.version !== 2 || !Array.isArray(plan.tasks)) {
    throw new Error("Verification evidence requires a version 2 structured plan");
  }
  const packIds = sortedUnique(plan.claimPackIds ?? plan.packIds ?? []);
  const cardinalityFocused = evidenceTask === "registry-derived-verification-packs" &&
    plan.mode === "focused-task";
  if ((plan.mode !== "exact" && !cardinalityFocused) || !packIds.length ||
      !same(packIds, sortedUnique(plan.requestedPackIds ?? []))) {
    throw new Error("Verification evidence requires exact explicit known pack(s)");
  }
  if (plan.skipBuild || plan.shard || plan.withDependencies) {
    throw new Error("Verification evidence cannot use --no-build, --shard, or --with-dependencies");
  }
  if (!same(sortedUnique(plan.selectedPackIds ?? []), packIds)) {
    throw new Error("Evidence pack claims must equal the packs whose stages were executed");
  }
  if (plan.includeProperties !== true) {
    throw new Error("Verification evidence requires every registered property leaf; add --property");
  }
  if (plan.changeSet?.version !== 1 || !plan.baseCommit ||
      plan.changeSet.baseCommit !== plan.baseCommit ||
      !same(sortedUnique(plan.changeSet.paths ?? []), sortedUnique(plan.changedPaths ?? []))) {
    throw new Error("Verification evidence requires the canonical version 1 Git change set");
  }
  const identities = plan.tasks.map(verificationTaskIdentity);
  if (cardinalityFocused) {
    validateRegistryCardinalityFocusedEvidence({
      task:evidenceTask,
      changedPaths:plan.changedPaths,
      taskKeys:identities.map(({ key }) => key),
      syntheticProofs:{ current:true, addedRunnable:true, emptyCompatibility:true },
      includeProperties:plan.includeProperties,
      includePackage:identities.some(({ key }) => key === "package:extension"),
      terminalFull:false,
    });
  }
  const keys = identities.map(({ key }) => key);
  if (!identities.length || new Set(keys).size !== keys.length) {
    throw new Error("Verification evidence requires a non-empty plan with unique task identities");
  }
  for (const packId of packIds) {
    if (!identities.some((identity) => identity.packId === packId)) {
      throw new Error(`Claimed pack has no executed verification stage: ${packId}`);
    }
  }
  return {
    version:2,
    mode:plan.mode,
    packIds,
    selectedPackIds:sortedUnique(plan.selectedPackIds),
    requestedPackIds:sortedUnique(plan.requestedPackIds),
    changedPaths:sortedUnique(plan.changedPaths ?? []),
    baseCommit:plan.baseCommit,
    changeSet:plan.changeSet,
    changedOwners:plan.changedOwners ?? {},
    changedBoundaries:plan.changedBoundaries ?? {},
    styleSmokeTargets:sortedUnique(plan.styleSmokeTargets ?? []),
    terminalFullObligations:sortedUnique(plan.terminalFullObligations ?? []),
    changedStyleTargets:plan.changedStyleTargets ?? {},
    adapterAuthorizationPackIds:sortedUnique(plan.adapterAuthorizationPackIds ?? []),
    conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason ?? null,
    features:[...(plan.features ?? [])].sort(),
    handlers:[...(plan.handlers ?? [])].sort(),
    includeProperties:Boolean(plan.includeProperties),
    stages:plan.stages,
    tasks:identities,
  };
}

function withEvidencePackageTask(plan) {
  const task = structuredClone(timeoutRepairPackageTaskIdentity);
  return { ...plan, tasks:[...plan.tasks, task], packageTasks:[task],
    stages:{ ...plan.stages, package:[] } };
}

const evidenceTaskGroups = [
  "preparationTasks", "unitTasks", "propertyTasks", "browserTasks", "observationTasks",
  "parserTasks", "generatorTasks", "checkpointTasks", "sessionTasks", "packageTasks",
];

function closeEvidencePlanPrerequisites(plan, canonicalPlan) {
  const tasks = expandVerificationTaskPrerequisites(plan.tasks, canonicalPlan.tasks,
    { mode:plan.mode });
  const groupsByTask = new Map();
  for (const source of [canonicalPlan, plan]) {
    for (const group of evidenceTaskGroups) {
      for (const task of source[group] ?? []) groupsByTask.set(task.key, group);
    }
  }
  const groups = Object.fromEntries(evidenceTaskGroups.map((group) => [group,
    tasks.filter(({ key }) => groupsByTask.get(key) === group)]));
  return { ...plan, ...groups, tasks:evidenceTaskGroups.flatMap((group) => groups[group]) };
}

export function closeCanonicalEvidencePlanPrerequisites(plan, candidatePacks) {
  const runnablePackIds = createVerificationPackCardinalityAdapter(candidatePacks).runnablePackIds;
  return closeEvidencePlanPrerequisites(plan, planVerification(candidatePacks, {
    packIds:runnablePackIds,
    includeProperties:true,
  }));
}

function bindEvidenceChangeScope(executionPlan, bindingPlan) {
  return {
    ...executionPlan,
    changedPaths:bindingPlan.changedPaths,
    changeSet:bindingPlan.changeSet,
    baseCommit:bindingPlan.baseCommit,
    changedOwners:bindingPlan.changedOwners,
    changedBoundaries:bindingPlan.changedBoundaries,
    styleSmokeTargets:bindingPlan.styleSmokeTargets,
    terminalFullObligations:bindingPlan.terminalFullObligations,
    changedStyleTargets:bindingPlan.changedStyleTargets,
    adapterAuthorizationPackIds:bindingPlan.adapterAuthorizationPackIds,
    conservativeHistoricalFallbackReason:bindingPlan.conservativeHistoricalFallbackReason,
  };
}

function canonicalRegistryCardinalityPlan(candidatePacks, {
  packIds, changeSet, basePacks, historicalRegistryFallback,
}) {
  const bindingPlan = planVerification(candidatePacks, {
    changedPaths:changeSet.paths,
    includeProperties:true,
    changeSet,
    basePacks,
    historicalRegistryFallback,
  });
  const executionPlan = bindEvidenceChangeScope(planVerification(candidatePacks, {
    packIds,
    includeProperties:true,
  }), bindingPlan);
  const completePlan = planVerification(candidatePacks, {
    packIds:createVerificationPackCardinalityAdapter(candidatePacks).runnablePackIds,
    includeProperties:true,
  });
  const completeWithPackage = withEvidencePackageTask(completePlan);
  const requestedKeys = registryCardinalityFocusedTaskKeys(executionPlan);
  const tasks = expandVerificationTaskPrerequisites(
    requestedKeys.map((key) => {
      const task = completeWithPackage.tasks.find((candidate) => candidate.key === key);
      if (!task) throw new Error(`Registry cardinality evidence task is not registered: ${key}`);
      return task;
    }),
    completeWithPackage.tasks,
    { mode:"ordinary-focused" },
  );
  const selected = new Set(tasks.map(({ key }) => key));
  return {
    ...executionPlan,
    mode:"focused-task",
    tasks:completeWithPackage.tasks.filter(({ key }) => selected.has(key)),
    includeProperties:true,
  };
}

async function canonicalPlanDocument({
  commit, baseCommit, changeSet, packIds, repositoryRoot, includePackage = true,
  runIntentBootstrap = false, evidenceTask,
}) {
  const candidatePacks = await verificationPacksAtCommit(commit, { repositoryRoot });
  let basePacks;
  let historicalRegistryFallback = false;
  try {
    basePacks = await verificationPacksAtCommit(baseCommit, {
      repositoryRoot,
      historicalRegistryFallback:true,
    });
  } catch {
    historicalRegistryFallback = true;
  }
  let plan = runIntentBootstrap
    ? canonicalRunIntentBootstrapPlan(candidatePacks, {
      packIds, changeSet, basePacks, historicalRegistryFallback,
    })
    : evidenceTask === "registry-derived-verification-packs"
      ? canonicalRegistryCardinalityPlan(candidatePacks, {
        packIds, changeSet, basePacks, historicalRegistryFallback,
      })
    : planVerification(candidatePacks, {
      packIds,
      changedPaths:changeSet.paths,
      includeProperties:true,
      changeSet,
      basePacks,
      historicalRegistryFallback,
    });
  if (evidenceTask !== "registry-derived-verification-packs") {
    plan = closeCanonicalEvidencePlanPrerequisites(plan, candidatePacks);
    if (includePackage) plan = withEvidencePackageTask(plan);
  }
  return planDocument(plan, { evidenceTask });
}

export async function validateCanonicalVerificationCheckpoint({
  receiptPath, commit, tree, baseCommit, evidenceTask, packIds, repositoryRoot = repository,
  allowLegacySeparatePackage = false, allowLegacyTerminalClosure = false,
} = {}) {
  const changeSet = await canonicalVerificationChangeSet({ base:baseCommit, commit, repositoryRoot });
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  const legacySeparatePackage = allowLegacySeparatePackage &&
    !receipt.tasks?.[timeoutRepairPackageTaskIdentity.key];
  const legacyArchivedRunIntent = allowLegacySeparatePackage && receipt.runIntent === undefined &&
    await candidatePredatesRunIntentImplementation(commit, { repositoryRoot });
  const legacyCandidatePacks = legacyArchivedRunIntent
    ? await verificationPacksAtCommit(commit, { repositoryRoot }) : undefined;
  const plan = await canonicalPlanDocument({
    commit, baseCommit, changeSet, packIds:sortedUnique(packIds ?? []), repositoryRoot,
    includePackage:!legacySeparatePackage, evidenceTask,
  });
  if (receipt.candidate?.commit !== commit || receipt.candidate?.tree !== tree ||
      receipt.candidate?.baseCommit !== baseCommit ||
      receipt.candidate?.evidenceTask !== evidenceTask ||
      receipt.candidate?.changeSetDigest !== verificationDigest(changeSet)) {
    throw new Error("Canonical checkpoint candidate, base, task, or change set is not bound to the repair");
  }
  const parsed = await parsedReceipt(receiptPath, plan, {
    allowLegacyPrerequisites:legacySeparatePackage,
    allowLegacyPromotionPrerequisites:allowLegacySeparatePackage,
    allowLegacyAcceptanceSessionPrerequisites:allowLegacySeparatePackage,
    allowLegacyTerminalClosure,
    allowLegacyRunIntent:legacyArchivedRunIntent,
    legacyCandidatePacks,
  });
  const results = Object.values(receipt.tasks);
  if (results.some((result) => result.provenance !== "fresh" || result.reliabilityIncidentId ||
      result.timeoutIncidentId ||
      result.runnerOwnedTimeout)) {
    throw new Error("Canonical checkpoint requires a complete fresh task set without reuse or timeout");
  }
  return { plan, changeSet, receipt, ...parsed };
}

// The terminal handoff consumes this real checkpoint shape.  It deliberately
// builds on the same raw-receipt/Git-note validator used by evidence
// preparation and recording; callers cannot substitute a proof-shaped object.
export async function validateCanonicalMasterCheckpointEvidence(options = {}) {
  const checkpoint = await validateCanonicalVerificationCheckpoint(options);
  const candidatePacks = await verificationPacksAtCommit(options.commit, {
    repositoryRoot:options.repositoryRoot ?? repository,
  });
  const expectedPackIds = planVerification(candidatePacks, {
    terminalFull:true,
    includeProperties:true,
  }).selectedPackIds;
  if (checkpoint.plan.mode !== "exact" || checkpoint.plan.includeProperties !== true ||
      !same(sortedUnique(options.packIds ?? []), sortedUnique(expectedPackIds)) ||
      !same(sortedUnique(checkpoint.plan.packIds), sortedUnique(expectedPackIds)) ||
      !checkpoint.plan.tasks.some(({ key }) => key.startsWith("property:"))) {
    throw new Error("Canonical master evidence requires the exact all-runnable-pack plan with properties");
  }
  return checkpoint;
}

export function validateCanonicalMasterEvidenceRecord(record, {
  candidateCommit = record?.commit,
  candidateTree = record?.tree,
  masterBaseCommit = record?.baseCommit,
  canonicalPackIds = [],
} = {}) {
  const allPacks = sortedUnique(canonicalPackIds);
  const plan = record?.plan;
  const artifact = record?.identities?.artifact;
  const receiptTasks = record?.receipt?.tasks ?? [];
  if (record?.version !== 2 || record.status !== "passed" || record.commit !== candidateCommit ||
      record.tree !== candidateTree || record.baseCommit !== masterBaseCommit ||
      plan?.mode !== "exact" || plan.includeProperties !== true || !allPacks.length ||
      !same(sortedUnique(record.packIds), allPacks) || !same(sortedUnique(plan.packIds), allPacks) ||
      !same(sortedUnique(plan.selectedPackIds), allPacks) ||
      !plan.tasks.some(({ key = "" }) => key.startsWith("property:")) ||
      !artifact || artifact.schemaVersion !== 1 ||
      ![artifact.buildIdentity, artifact.inputDigest, artifact.outputDigest].every((value) => shaPattern.test(value ?? "")) ||
      !Array.isArray(receiptTasks) || !receiptTasks.length ||
      receiptTasks.some(({ status }) => status !== "passed")) {
    throw new Error("Canonical master evidence record is not an exact fresh all-runnable-pack proof");
  }
  return record;
}

export function legacyAcceptanceSessionPrerequisiteCompatibility({
  allowed = false, task, identity, prerequisite, result,
} = {}) {
  if (!allowed || task?.stage !== "acceptance-session" ||
      identity?.requiredCapabilities?.length !== 0 ||
      !Array.isArray(prerequisite?.requiredCapabilities) ||
      prerequisite.requiredCapabilities.length === 0 ||
      typeof prerequisite.route !== "string" || !prerequisite.route ||
      ["blocked", "workspace-sandbox"].includes(prerequisite.route)) return false;
  let requiredCapabilities;
  try {
    requiredCapabilities = validateTaskExecutionPrerequisites({
      ...identity, requiredCapabilities:prerequisite.requiredCapabilities,
    });
  } catch {
    return false;
  }
  const legacyIdentity = { ...identity, requiredCapabilities };
  return same(result?.identity, legacyIdentity) && same(result?.executionPrerequisites, {
    requiredCapabilities, launchRoute:prerequisite.route,
  });
}

async function assertCanonicalPlan(recordPlan, details) {
  const canonical = await canonicalPlanDocument(details);
  if (!same(recordPlan, canonical)) {
    throw new Error("Verification evidence plan does not match the committed pack registry");
  }
  return canonical;
}

async function parsedReceipt(receiptPath, plan, {
  allowLegacyPrerequisites = false,
  allowLegacyPromotionPrerequisites = false,
  allowLegacyAcceptanceSessionPrerequisites = false,
  allowLegacyTerminalClosure = false,
  allowLegacyRunIntent = false,
  legacyCandidatePacks = undefined,
} = {}) {
  if (!receiptPath) throw new Error("Provide the verification receipt produced by this run");
  const bytes = await readFile(receiptPath);
  let receipt;
  try { receipt = JSON.parse(bytes); }
  catch { throw new Error(`Verification receipt is not valid JSON: ${receiptPath}`); }
  if (receipt?.version !== 2 || !receipt.tasks || Array.isArray(receipt.tasks)) {
    throw new Error("Verification evidence requires a version 2 task receipt");
  }
  const expectedRunIntent = expectedRunIntentForEvidenceTask(receipt.candidate?.evidenceTask);
  requireEvidenceReceiptRunIntent(receipt, expectedRunIntent, {
    allowLegacyResolvedArchive:allowLegacyRunIntent,
    candidatePredatesRunIntent:allowLegacyRunIntent,
  });
  if (!receipt.completedAt || Number.isNaN(Date.parse(receipt.completedAt))) {
    throw new Error("Verification evidence requires a completed task receipt");
  }
  const environment = receiptEnvironment(receipt.environment);
  const receiptArtifact = artifactIdentity(receipt.artifact);
  const legacyArchiveTasks = allowLegacyRunIntent
    ? legacyArchivedCheckpointTaskIdentities(receipt, legacyCandidatePacks, plan.requestedPackIds)
    : undefined;
  const validationTasks = legacyArchiveTasks ?? plan.tasks;
  const legacyPrerequisites = allowLegacyPrerequisites &&
    !Array.isArray(receipt.plan?.executionPrerequisites);
  const prerequisiteRows = legacyPrerequisites
    ? validationTasks.map((task) => ({ key:task.key, requiredCapabilities:[], route:"workspace-sandbox" }))
    : receipt.plan?.executionPrerequisites;
  const expectedPrerequisiteKeys = validationTasks.map(({ key }) => key).sort();
  if (!Array.isArray(prerequisiteRows) ||
      !same(prerequisiteRows.map(({ key }) => key).sort(), expectedPrerequisiteKeys)) {
    throw new Error("Verification receipt execution prerequisites do not cover the exact task plan");
  }
  for (const task of validationTasks) {
    const identity = verificationTaskIdentity(task);
    const row = prerequisiteRows.find(({ key }) => key === task.key);
    const workspaceOnly = identity.requiredCapabilities.length === 0;
    const legacyAcceptanceSession = legacyAcceptanceSessionPrerequisiteCompatibility({
      allowed:allowLegacyAcceptanceSessionPrerequisites,
      task, identity, prerequisite:row, result:receipt.tasks[task.key],
    });
    if (!row || !legacyPrerequisites && !legacyAcceptanceSession &&
          !same(row.requiredCapabilities, identity.requiredCapabilities) ||
        typeof row.route !== "string" || !row.route || row.route === "blocked" ||
        !legacyPrerequisites && !legacyAcceptanceSession &&
          workspaceOnly !== (row.route === "workspace-sandbox")) {
      throw new Error(`Verification receipt has an invalid execution route for ${task.key}`);
    }
  }
  const promotionTasks = verificationPromotionTasks();
  const promotionPrerequisiteRows = receipt.plan?.promotionExecutionPrerequisites;
  const legacyPromotionPrerequisites = allowLegacyPromotionPrerequisites &&
    !Array.isArray(promotionPrerequisiteRows);
  if (!legacyPromotionPrerequisites) {
    const expectedPromotionKeys = promotionTasks.map(({ key }) => key).sort();
    if (!Array.isArray(promotionPrerequisiteRows) ||
        !same(promotionPrerequisiteRows.map(({ key }) => key).sort(), expectedPromotionKeys)) {
      throw new Error(`Verification receipt execution prerequisites do not cover the exact promotion plan (expected ${
        expectedPromotionKeys.join(",")}; received ${Array.isArray(promotionPrerequisiteRows)
          ? promotionPrerequisiteRows.map(({ key }) => key).sort().join(",") : "none"})`);
    }
    for (const task of promotionTasks) {
      const identity = verificationTaskIdentity(task);
      const row = promotionPrerequisiteRows.find(({ key }) => key === task.key);
      const workspaceOnly = identity.requiredCapabilities.length === 0;
      if (!row || !same(row.requiredCapabilities, identity.requiredCapabilities) ||
          typeof row.route !== "string" || !row.route || row.route === "blocked" ||
          workspaceOnly !== (row.route === "workspace-sandbox")) {
        throw new Error(`Verification receipt has an invalid promotion route for ${task.key}`);
      }
    }
  }
  const expectedPlanSummary = {
    mode:plan.mode,
    requestedPackIds:plan.requestedPackIds,
    selectedPackIds:plan.selectedPackIds,
    ...(receipt.plan?.changedPaths === undefined ? {} : {changedPaths:plan.changedPaths}),
    changedOwners:allowLegacyRunIntent
      ? legacyArchivedChangedOwners(plan.changedOwners) : plan.changedOwners,
    changedBoundaries:plan.changedBoundaries,
    ...(!(allowLegacyRunIntent && receipt.plan?.styleSmokeTargets === undefined) ? {
      styleSmokeTargets:sortedUnique(plan.styleSmokeTargets ?? []),
    } : {}),
    ...(!(allowLegacyRunIntent && receipt.plan?.terminalFullObligations === undefined) ? {
      terminalFullObligations:sortedUnique(plan.terminalFullObligations ?? []),
    } : {}),
    ...(!(allowLegacyRunIntent && receipt.plan?.changedStyleTargets === undefined) ? {
      changedStyleTargets:plan.changedStyleTargets ?? {},
    } : {}),
    ...(!(allowLegacyRunIntent && receipt.plan?.adapterAuthorizationPackIds === undefined) ? {
      adapterAuthorizationPackIds:sortedUnique(plan.adapterAuthorizationPackIds ?? []),
    } : {}),
    changeSetDigest:verificationDigest(plan.changeSet),
    ...(receipt.plan?.taskPlanDigest === undefined ? {} : {
      taskPlanDigest:verificationDigest(plan.tasks.map(verificationTaskIdentity)),
    }),
    conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason,
    ...(receipt.candidate?.evidenceTask === boundedClosureEvidenceTask &&
      !(allowLegacyTerminalClosure && receipt.plan?.terminalClosure === undefined) ? {
      terminalClosure:{
        ...terminalClosureExecution({
          attempt:receipt.plan?.terminalClosure?.attempt,
          runnablePackCount:plan.requestedPackIds.length,
        }),
        attempt:receipt.plan?.terminalClosure?.attempt,
      },
    } : {}),
    ...(!legacyPrerequisites ? { executionPrerequisites:allowLegacyRunIntent
      ? prerequisiteRows : validationTasks.map((task) =>
        prerequisiteRows.find(({ key }) => key === task.key)),
    ...(!legacyPromotionPrerequisites ? {
      promotionExecutionPrerequisites:promotionTasks.map((task) =>
        promotionPrerequisiteRows.find(({ key }) => key === task.key)),
    } : {}) } : {}),
  };
  if (!same(receipt.plan, expectedPlanSummary)) {
    throw new Error("Verification receipt plan selection summary does not match the executed plan");
  }
  const expected = new Map(validationTasks.map((identity) => [identity.key, identity]));
  const actualKeys = Object.keys(receipt.tasks).sort();
  if (!same(actualKeys, [...expected.keys()].sort())) {
    const missing = [...expected.keys()].filter((key) => !actualKeys.includes(key));
    const extra = actualKeys.filter((key) => !expected.has(key));
    throw new Error(`Receipt task set does not match the plan (missing: ${missing.join(",") || "none"}; extra: ${extra.join(",") || "none"})`);
  }
  const results = [];
  for (const [key, identity] of expected) {
    const result = receipt.tasks[key];
    if (result?.status !== "passed") throw new Error(`Required verification task did not pass: ${key}`);
    const prerequisite = prerequisiteRows.find(({ key:taskKey }) => taskKey === key);
    const legacyAcceptanceSession = legacyAcceptanceSessionPrerequisiteCompatibility({
      allowed:allowLegacyAcceptanceSessionPrerequisites,
      task:identity, identity, prerequisite, result,
    });
    const expectedIdentity = legacyAcceptanceSession
      ? { ...identity, requiredCapabilities:[...prerequisite.requiredCapabilities] }
      : legacyPrerequisites
      ? Object.fromEntries(Object.entries(identity).filter(([field]) => field !== "requiredCapabilities"))
      : identity;
    if (!same(result.identity, expectedIdentity)) {
      throw new Error(`Receipt task identity does not match the plan: ${key}`);
    }
    if (!Number.isFinite(result.durationMs) || result.durationMs < 0) {
      throw new Error(`Receipt task has no valid duration: ${key}`);
    }
    if (!legacyPrerequisites && !same(result.executionPrerequisites, {
      requiredCapabilities:legacyAcceptanceSession
        ? prerequisite.requiredCapabilities : identity.requiredCapabilities,
      launchRoute:prerequisite.route,
    })) throw new Error(`Receipt task execution route does not match the plan: ${key}`);
    results.push({
      key,
      identity,
      status:"passed",
      durationMs:result.durationMs,
      outputSha256:verificationDigest(result.output ?? ""),
    });
  }
  const checkpointAttempt = receipt.checkpointAttempt;
  if (checkpointAttempt && (!shaPattern.test(checkpointAttempt.id ?? "") ||
      !shaPattern.test(checkpointAttempt.identityDigest ?? "") ||
      !["created", "continued", "stale-owner-recovered", "promotion-only"]
        .includes(checkpointAttempt.action))) {
    throw new Error("Verification receipt has an invalid checkpoint attempt identity");
  }
  if (receipt.runIntentBootstrap) {
    validateRunIntentBootstrapReceipt(receipt, receipt.runIntentBootstrap);
  }
  return { bytes, results, environment, artifact:receiptArtifact, runIntent:receipt.runIntent,
    confirmedFlakyAdmissions:receipt.confirmedFlakyAdmissions,
    runIntentBootstrap:receipt.runIntentBootstrap,
    checkpointAttempt:checkpointAttempt ? {
      id:checkpointAttempt.id, identityDigest:checkpointAttempt.identityDigest,
    } : undefined };
}

async function repositoryIdentity(repositoryRoot) {
  const [registry, toolchain] = await Promise.all([
    readFile(path.join(repositoryRoot, "verification/packs.json")),
    readFile(path.join(repositoryRoot, "swarmforge/toolchain.lock.json")),
  ]);
  const lock = JSON.parse(toolchain);
  const runtime = {
    node:lock?.node?.version,
    typescript:lock?.typescript?.version,
  };
  if (Object.values(runtime).some((value) => !runtimeVersionPattern.test(value ?? ""))) {
    throw new Error("Toolchain lock has no valid Node and TypeScript runtime identity");
  }
  return {
    registrySha256:verificationDigest(registry),
    toolchainSha256:verificationDigest(toolchain),
    runtime,
  };
}

export async function validateStrictVerificationToolchain({ repositoryRoot = repository } = {}) {
  const checker = path.join(repositoryRoot, "scripts", "check-swarmforge-toolchain.mjs");
  await new Promise((resolve, reject) => {
    execFile(process.execPath, [checker, "--strict-runtime"], {
      cwd:repositoryRoot,
      maxBuffer:16 * 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Strict verification toolchain preflight failed: ${stderr.trim() || stdout.trim() || error.message}`));
        return;
      }
      if (stdout.trim()) console.error(stdout.trim());
      if (stderr.trim()) console.error(stderr.trim());
      resolve();
    });
  });
}

async function cleanCandidate(repositoryRoot) {
  const dirty = await git(repositoryRoot, "-c", "core.excludesFile=/dev/null",
    "status", "--porcelain", "--untracked-files=all");
  if (dirty) throw new Error("Commit candidate changes before preparing or recording verification evidence");
}

export async function validateVerificationCandidateClean({ repositoryRoot = repository } = {}) {
  await cleanCandidate(repositoryRoot);
}

export async function validateVerificationEvidenceCompatibility({
  task,
  plan,
  receiptPath,
  changedSince,
  buildManifest,
  repositoryRoot = repository,
  requireCompletedReceipt = false,
}) {
  assertTaskName(task);
  if (!changedSince?.trim()) throw new Error("Evidence preparation requires --changed-since <commit>");
  await cleanCandidate(repositoryRoot);
  const [commit, tree, baseCommit, sourceIdentity] = await Promise.all([
    git(repositoryRoot, "rev-parse", "HEAD^{commit}"),
    git(repositoryRoot, "rev-parse", "HEAD^{tree}"),
    git(repositoryRoot, "rev-parse", `${changedSince}^{commit}`),
    repositoryIdentity(repositoryRoot),
  ]);
  const planRecord = planDocument(plan, { evidenceTask:task });
  const actualChangeSet = await canonicalVerificationChangeSet({
    base:baseCommit,
    commit,
    repositoryRoot,
  });
  if (!actualChangeSet.paths.length) {
    throw new Error("Verification evidence requires a non-empty committed candidate range");
  }
  if (!same(actualChangeSet, planRecord.changeSet)) {
    throw new Error("Planned canonical change set does not match the committed candidate range");
  }
  const receiptSourcePath = repositoryRelativePath(repositoryRoot, receiptPath, "Verification receipt");
  if (!validRawReceiptPath(receiptSourcePath)) {
    throw new Error("Verification receipt must be runner-owned under tmp/verification-receipts");
  }
  const absoluteReceiptPath = path.join(repositoryRoot, receiptSourcePath);
  const receiptContract = JSON.parse(await readFile(absoluteReceiptPath, "utf8"));
  await assertCanonicalPlan(planRecord, {
    commit,
    baseCommit,
    changeSet:actualChangeSet,
    packIds:planRecord.packIds,
    repositoryRoot,
    evidenceTask:task,
    runIntentBootstrap:receiptContract.runIntentBootstrap !== undefined,
  });
  if (!requireCompletedReceipt) {
    const receipt = receiptContract;
    if (receipt?.version !== 2 || !receipt.tasks || Array.isArray(receipt.tasks)) {
      throw new Error("Verification evidence requires a version 2 task receipt contract");
    }
    requireVerificationRunIntent(receipt, expectedRunIntentForEvidenceTask(task));
    const environment = receiptEnvironment(receipt.environment);
    if (!same({ node:environment.node, typescript:environment.typescript }, sourceIdentity.runtime)) {
      throw new Error("Verification receipt contract and locked runtime identities must match");
    }
    return {
      commit, tree, baseCommit, sourceIdentity, planRecord, actualChangeSet,
      receiptSourcePath, environment,
    };
  }
  const [{ bytes, results, environment, artifact:receiptArtifact, checkpointAttempt, runIntent,
    runIntentBootstrap, confirmedFlakyAdmissions }] = await Promise.all([
    parsedReceipt(absoluteReceiptPath, planRecord),
  ]);
  const artifact = artifactIdentity(buildManifest);
  if (!same(receiptArtifact, artifact) ||
      !same({ node:environment.node, typescript:environment.typescript }, sourceIdentity.runtime) ||
      !same(artifact.toolchain, sourceIdentity.runtime)) {
    throw new Error("Verification receipt, supplied artifact, and locked runtime identities must match");
  }
  return {
    commit, tree, baseCommit, sourceIdentity, planRecord, actualChangeSet,
    receiptSourcePath, bytes, results, environment, artifact, checkpointAttempt, runIntent,
    runIntentBootstrap, confirmedFlakyAdmissions,
  };
}

function pendingPathFor(repositoryRoot, task, planDigest) {
  return path.join(
    repositoryRoot,
    "tmp",
    "verification-evidence",
    `${task}-${planDigest.slice(0, 16)}-${process.pid}-${randomUUID()}.pending.json`,
  );
}

function repositoryRelativePath(repositoryRoot, candidate, label) {
  const absolute = path.resolve(candidate);
  const relative = path.relative(path.resolve(repositoryRoot), absolute).split(path.sep).join("/");
  if (!relative || relative === ".." || relative.startsWith("../") || path.posix.isAbsolute(relative) ||
      relative.includes("\\") || relative.includes("\0") || path.posix.normalize(relative) !== relative) {
    throw new Error(`${label} must be a normalized file inside the repository`);
  }
  return relative;
}

function validRepositoryRelativePath(candidate) {
  return typeof candidate === "string" && candidate.length > 0 && !path.posix.isAbsolute(candidate) &&
    !candidate.includes("\\") && !candidate.includes("\0") && candidate !== "." && candidate !== ".." &&
    !candidate.startsWith("../") && path.posix.normalize(candidate) === candidate;
}

function validRawReceiptPath(candidate) {
  return validRepositoryRelativePath(candidate) &&
    /^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(candidate);
}

async function writeExclusiveAtomic(target, contents) {
  await mkdir(path.dirname(target), { recursive:true });
  const stage = path.join(
    path.dirname(target),
    `.${path.basename(target)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let handle;
  try {
    handle = await open(stage, "wx", 0o600);
    await handle.writeFile(contents);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await link(stage, target);
  } finally {
    if (handle) await handle.close();
    try { await unlink(stage); }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
  }
}

function evidenceId(record) {
  const identity = {
    task:record.task, commit:record.commit, tree:record.tree, baseCommit:record.baseCommit,
    packIds:record.packIds, planDigest:record.planDigest, identities:record.identities,
    receiptSha256:record.receipt.sha256, runIntent:record.receipt.runIntent,
    runIntentBootstrap:record.runIntentBootstrap,
    checkpointAttempt:record.checkpointAttempt,
    ...((record.reliabilityResolutions ?? []).length
      ? { reliabilityResolutions:record.reliabilityResolutions }
      : (record.timeoutResolutions ?? []).length
        ? { timeoutResolutions:record.timeoutResolutions }
        : {}),
  };
  if (record.consumedTerminalObligations !== undefined) {
    identity.consumedTerminalObligations = canonicalTerminalObligations(record.consumedTerminalObligations);
  }
  return verificationDigest(identity);
}

function validateRecordDocument(record, { allowLegacyExecutionLoad = false } = {}) {
  if (record?.version !== 2 || record.status !== "pending" && record.status !== "passed") {
    throw new Error("Verification evidence has an unsupported schema or status");
  }
  assertTaskName(record.task);
  if (!/^[a-f0-9]{40,64}$/u.test(record.commit ?? "") || !/^[a-f0-9]{40,64}$/u.test(record.tree ?? "") ||
      !/^[a-f0-9]{40,64}$/u.test(record.baseCommit ?? "")) {
    throw new Error("Verification evidence has invalid Git identities");
  }
  if (!same(record.packIds, sortedUnique(record.packIds ?? [])) || !record.packIds.length) {
    throw new Error("Verification evidence has an invalid exact pack set");
  }
  if (!same(record.plan, planDocument(record.plan))) {
    throw new Error("Verification evidence plan is not in canonical exact-pack form");
  }
  if (record.planDigest !== verificationDigest(record.plan)) throw new Error("Verification plan digest does not match its plan");
  if (!same(record.plan.packIds, record.packIds)) throw new Error("Verification plan pack set does not match its evidence claim");
  if (!same(record.changedPaths, record.plan.changedPaths)) throw new Error("Verification changed paths do not match the plan");
  if (!same(record.changeSet, record.plan.changeSet) || record.baseCommit !== record.plan.baseCommit ||
      !same(record.changedPaths, sortedUnique(record.changeSet?.paths ?? []))) {
    throw new Error("Verification evidence change set does not match its plan or base");
  }
  if (![record.identities?.registrySha256, record.identities?.toolchainSha256,
    record.identities?.artifact?.buildIdentity, record.identities?.artifact?.inputDigest,
    record.identities?.artifact?.outputDigest, record.receipt?.sha256].every((value) => shaPattern.test(value ?? ""))) {
    throw new Error("Verification evidence is missing registry, toolchain, build, or receipt identity");
  }
  if (!validRawReceiptPath(record.receipt?.sourcePath)) {
    throw new Error("Verification evidence requires a runner-owned raw receipt under tmp/verification-receipts");
  }
  const expectedRunIntent = record.task === boundedClosureEvidenceTask
    ? verificationRunIntents.terminal : verificationRunIntents.review;
  requireVerificationRunIntent(record.receipt, expectedRunIntent);
  if (record.checkpointAttempt &&
      (!shaPattern.test(record.checkpointAttempt.id ?? "") ||
       !shaPattern.test(record.checkpointAttempt.identityDigest ?? ""))) {
    throw new Error("Verification evidence has an invalid checkpoint attempt identity");
  }
  if (record.consumedTerminalObligations !== undefined &&
      !same(record.consumedTerminalObligations,
        canonicalTerminalObligations(record.consumedTerminalObligations)) ||
      record.consumedTerminalObligations?.some(({ originCommit, originTree, consumedByCommit,
        consumedByTree, paths }) =>
        !/^[a-f0-9]{40,64}$/u.test(originCommit ?? "") || !/^[a-f0-9]{40,64}$/u.test(originTree ?? "") ||
        !/^[a-f0-9]{40,64}$/u.test(consumedByCommit ?? "") || !/^[a-f0-9]{40,64}$/u.test(consumedByTree ?? "") ||
        !Array.isArray(paths) || !paths.length || paths.some((value) => typeof value !== "string"))) {
    throw new Error("Verification evidence has invalid terminal obligation consumption identities");
  }
  if (record.identities.artifact.schemaVersion !== 1) {
    throw new Error("Verification evidence has an unsupported artifact identity schema");
  }
  const environment = receiptEnvironment(record.receipt?.environment, { allowLegacyExecutionLoad });
  const lockedRuntime = record.identities?.runtime;
  const artifactToolchain = record.identities?.artifact?.toolchain;
  if (!same({ node:environment.node, typescript:environment.typescript }, lockedRuntime) ||
      !same(artifactToolchain, lockedRuntime)) {
    throw new Error("Verification receipt, artifact, and locked runtime identities do not match");
  }
  const expected = new Map(record.plan.tasks.map((identity) => [identity.key, identity]));
  if (expected.size !== record.plan.tasks.length || !same([...expected.keys()].sort(), record.receipt.tasks.map(({ key }) => key).sort())) {
    throw new Error("Verification receipt summary does not cover the exact plan task set");
  }
  for (const result of record.receipt.tasks) {
    if (result.status !== "passed" || !same(result.identity, expected.get(result.key)) ||
        !Number.isFinite(result.durationMs) || result.durationMs < 0 || !shaPattern.test(result.outputSha256 ?? "")) {
      throw new Error(`Invalid verification receipt result: ${result.key}`);
    }
  }
  const reliabilityResolutions = record.reliabilityResolutions ?? record.timeoutResolutions ?? [];
  if (!Array.isArray(reliabilityResolutions) || reliabilityResolutions.some((resolution) =>
    !incidentIdPattern.test(resolution?.incidentId ?? "") ||
    !shaPattern.test(resolution?.failureDigest ?? "") ||
    !shaPattern.test(resolution?.resolutionDigest ?? "")) ||
    !same(reliabilityResolutions.map(({ incidentId }) => incidentId),
      [...reliabilityResolutions.map(({ incidentId }) => incidentId)].sort())) {
    throw new Error("Verification evidence has invalid reliability resolution links");
  }
  if (record.runIntentBootstrap !== undefined &&
      (record.receipt.runIntent !== verificationRunIntents.review ||
       record.runIntentBootstrap.version !== 1 ||
       record.runIntentBootstrap.baseCommit !== record.baseCommit ||
       record.runIntentBootstrap.candidateCommit !== record.commit ||
       record.runIntentBootstrap.candidateTree !== record.tree ||
       !Array.isArray(record.runIntentBootstrap.coverage))) {
    throw new Error("Verification evidence has an invalid run-intent bootstrap binding");
  }
  if (record.evidenceId && record.evidenceId !== evidenceId(record)) throw new Error("Verification evidence id does not match its content");
  return record;
}

export async function createPendingVerificationEvidence({
  task,
  plan,
  receiptPath,
  changedSince,
  buildManifest,
  pendingPath,
  repositoryRoot = repository,
  toolchainValidator = validateStrictVerificationToolchain,
}) {
  await toolchainValidator({ repositoryRoot });
  const {
    commit, tree, baseCommit, sourceIdentity, planRecord, actualChangeSet,
    receiptSourcePath, bytes, results, environment, artifact, checkpointAttempt,
    runIntent, runIntentBootstrap, confirmedFlakyAdmissions,
  } = await validateVerificationEvidenceCompatibility({
    task, plan, receiptPath, changedSince, buildManifest, repositoryRoot,
    requireCompletedReceipt:true,
  });
  const candidatePacks = await verificationPacksAtCommit(commit, { repositoryRoot });
  if (runIntentBootstrap) {
    await validateRunIntentBootstrapBase({
      root:repositoryRoot, baseCommit, changedPaths:actualChangeSet.paths,
      evidenceTask:task,
    });
    const incidents = await createTimeoutIncidentStore({ root:repositoryRoot })
      .blocking({ commit });
    const coverage = await runIntentBootstrapCoverage({ incidents, plan, packs:candidatePacks,
      candidate:{ commit, tree }, root:repositoryRoot, evidenceTask:task });
    if (!same(coverage, runIntentBootstrap.coverage)) {
      throw new Error("Run-intent bootstrap incident coverage changed before evidence preparation");
    }
  } else {
    await assertNoBlockingTimeoutIncidents("HEAD", {
      root:repositoryRoot, changedPaths:actualChangeSet.paths,
      confirmedFlakyAdmissions,
    });
  }
  const reliabilityResolutions = await createTimeoutIncidentStore({ root:repositoryRoot })
    .resolutions({ commit });
  const terminalEligible = canonicalTerminalPlanEligible(planRecord, candidatePacks);
  const consumedTerminalObligations = terminalEligible
    ? await discoverPendingReviewObligations({
      baseCommit, candidateCommit:commit, candidateTree:tree,
      finalPaths:actualChangeSet.paths,
      finalTerminalPaths:planRecord.terminalFullObligations ?? [], repositoryRoot,
    })
    : undefined;
  const record = {
    version:2,
    status:"pending",
    task,
    commit,
    tree,
    baseCommit,
    packIds:planRecord.packIds,
    changedPaths:actualChangeSet.paths,
    changeSet:actualChangeSet,
    plan:planRecord,
    planDigest:verificationDigest(planRecord),
    identities:{ ...sourceIdentity, artifact },
    ...(checkpointAttempt ? { checkpointAttempt } : {}),
    ...(runIntentBootstrap ? { runIntentBootstrap } : {}),
    receipt:{ sourcePath:receiptSourcePath, sha256:verificationDigest(bytes),
      runIntent, environment, tasks:results },
    ...(terminalEligible ? { consumedTerminalObligations } : {}),
    reliabilityResolutions:reliabilityResolutions.sort((left, right) =>
      left.incidentId.localeCompare(right.incidentId)),
    preparedAt:new Date().toISOString(),
  };
  record.evidenceId = evidenceId(record);
  validateRecordDocument(record);
  const target = pendingPath ?? pendingPathFor(repositoryRoot, task, record.planDigest);
  await writeExclusiveAtomic(target, `${JSON.stringify(record, null, 2)}\n`);
  return { evidence:record, path:target };
}

async function readPending(pendingPath) {
  let pending;
  try { pending = JSON.parse(await readFile(pendingPath, "utf8")); }
  catch (error) { throw new Error(`Cannot read pending verification evidence ${pendingPath}: ${error.message}`); }
  return validateRecordDocument(pending);
}

async function currentNote(commit, repositoryRoot) {
  try { return JSON.parse(await git(repositoryRoot, "notes", `--ref=${notesRef}`, "show", commit)); }
  catch (error) {
    if (/no note found|cannot read note data|bad object/iu.test(error.message)) return { version:2, records:[] };
    throw error;
  }
}

async function withRepositoryArtifactLock(repositoryRoot, operation) {
  const lockDirectory = path.join(repositoryRoot, "tmp", ".dist-artifact.lock");
  if (await inheritedDistArtifactLockIsHeld(lockDirectory)) return operation();
  const release = await acquireDistArtifactLock(lockDirectory);
  try { return await operation(); }
  finally { await release(); }
}

async function checkpointAttemptStore(repositoryRoot) {
  return createCheckpointAttemptStore({
    directory:await defaultCheckpointAttemptDirectory(repositoryRoot),
    legacyDirectories:[await defaultLegacyCheckpointAttemptDirectory(repositoryRoot)],
  });
}

export async function probeGitMetadataWrite(repositoryRoot) {
  const probeRef = `refs/swarmforge/preflight/${process.pid}-${randomUUID()}`;
  await git(repositoryRoot, "update-ref", probeRef, "HEAD");
  try {
    if (await git(repositoryRoot, "rev-parse", probeRef) !==
        await git(repositoryRoot, "rev-parse", "HEAD^{commit}")) {
      throw new Error("Git metadata preflight wrote an unexpected object identity");
    }
  } finally {
    await git(repositoryRoot, "update-ref", "-d", probeRef);
  }
}

export async function preflightGitNotePromotion(pendingPath, {
  repositoryRoot = repository,
  executableProbe,
  outputCapacityProbe,
} = {}) {
  const task = verificationGitNotePromotionTask(path.relative(repositoryRoot, pendingPath));
  const planned = preflightExecutionPrerequisites([task], {
    availableCapabilities:["git-metadata-write"],
    approvalRoutes:{ "git-metadata-write":"scoped-git-metadata-approval" } });
  const environment = await probeExecutionPrerequisiteEnvironment([task], {
    executableProbe, outputCapacityProbe, requestedCapabilities:[], workspaceRoot:repositoryRoot,
    outputDirectory:path.dirname(pendingPath), outputLimitBytes:4096,
  });
  if (!planned.launchable || !environment.launchable) {
    const blocked = [...planned.blocked, ...environment.blocked];
    throw new Error(`Git-note promotion prerequisite blocked before metadata write: ${
      blocked.map(({ taskKey, capability, prerequisite, route, value }) =>
        `${taskKey}:${capability ?? prerequisite}:${route ?? value}`).join(", ")}`);
  }
  return { task, route:planned.tasks[0].route, environment };
}

export async function recordPendingVerificationEvidence(
  pendingPath,
  {
    repositoryRoot = repository,
    artifactValidator = ({ root }) => assertFreshDist({ root }),
    toolchainValidator = validateStrictVerificationToolchain,
    metadataValidator = probeGitMetadataWrite,
  } = {},
) {
  const pending = await readPending(pendingPath);
  if (pending.status !== "pending") throw new Error("Only pending verification evidence can be recorded");
  const promotionPreflight = await preflightGitNotePromotion(pendingPath, { repositoryRoot });
  const promotionContext = {
    mode:"checkpoint-promotion", candidate:{ commit:pending.commit, tree:pending.tree },
    runId:pending.receipt.runId ?? pending.receipt.sha256,
    artifact:pending.identities.artifact, receiptPath:pending.receipt.sourcePath,
    checkpointAttempt:pending.checkpointAttempt ?? null,
    promotion:{ pendingPath:path.relative(repositoryRoot, pendingPath) },
  };
  const promotionAuthorizations = createVerificationLaunchAuthorizations({
    tasks:[promotionPreflight.task],
    routes:new Map([[promotionPreflight.task.key, promotionPreflight.route]]),
    ...promotionContext,
  });
  consumeVerificationLaunchAuthorization(promotionAuthorizations, promotionPreflight.task, {
    ...promotionContext, route:promotionPreflight.route, completedPredecessorKeys:[],
  });
  try {
    await metadataValidator(repositoryRoot);
  } catch (error) {
    throw new Error(`Git-note promotion prerequisite blocked before metadata write: promotion:git-note:git-metadata-write:scoped-git-metadata-approval: ${
      error.message}`);
  }
  await toolchainValidator({ repositoryRoot });
  return withRepositoryArtifactLock(repositoryRoot, async() => {
    // Global lock order is artifact first, Git notes second. Keeping both for
    // the final snapshot makes an early recorder wait for a running build and
    // prevents a promotion from interleaving with note publication.
    const releaseNotes = await acquireVerificationNotesLock(repositoryRoot);
    try {
      await cleanCandidate(repositoryRoot);
      const rawReceiptPath = path.join(repositoryRoot, pending.receipt.sourcePath);
      const [commit, tree, sourceIdentity, manifest, rawReceipt] = await Promise.all([
        git(repositoryRoot, "rev-parse", "HEAD^{commit}"),
        git(repositoryRoot, "rev-parse", "HEAD^{tree}"),
        repositoryIdentity(repositoryRoot),
        artifactValidator({ root:repositoryRoot }),
        parsedReceipt(rawReceiptPath, pending.plan),
      ]);
      if (pending.commit !== commit || pending.tree !== tree) {
        throw new Error("Pending evidence does not match the current commit and tree");
      }
      if (pending.runIntentBootstrap) {
        await validateRunIntentBootstrapBase({
          root:repositoryRoot, baseCommit:pending.baseCommit,
          changedPaths:pending.changeSet.paths,
          evidenceTask:pending.task,
        });
        const [incidents, candidatePacks] = await Promise.all([
          createTimeoutIncidentStore({ root:repositoryRoot }).blocking({ commit }),
          verificationPacksAtCommit(commit, { repositoryRoot }),
        ]);
        const coverage = await runIntentBootstrapCoverage({
          incidents, plan:pending.plan, packs:candidatePacks,
          candidate:{ commit, tree }, root:repositoryRoot, evidenceTask:pending.task,
        });
        if (!same(coverage, pending.runIntentBootstrap.coverage)) {
          throw new Error("Run-intent bootstrap incident coverage changed before recording");
        }
      } else {
        await assertNoBlockingTimeoutIncidents(commit, {
          root:repositoryRoot, changedPaths:pending.changeSet.paths,
          confirmedFlakyAdmissions:rawReceipt.confirmedFlakyAdmissions,
        });
      }
      const currentReliabilityResolutions = await createTimeoutIncidentStore({ root:repositoryRoot })
        .resolutions({ commit });
      if (!same(currentReliabilityResolutions.sort((left, right) => left.incidentId.localeCompare(right.incidentId)),
        pending.reliabilityResolutions ?? pending.timeoutResolutions ?? [])) {
        throw new Error("Reliability incident resolutions changed after verification");
      }
      if (!same(sourceIdentity, {
        registrySha256:pending.identities.registrySha256,
        toolchainSha256:pending.identities.toolchainSha256,
        runtime:pending.identities.runtime,
      })) throw new Error("Registry or toolchain changed after verification");
      const currentArtifact = artifactIdentity(manifest);
      if (!same(currentArtifact, pending.identities.artifact)) {
        throw new Error("Build artifact changed after verification");
      }
      if (verificationDigest(rawReceipt.bytes) !== pending.receipt.sha256 ||
          !same(rawReceipt.environment, pending.receipt.environment) ||
          !same(rawReceipt.results, pending.receipt.tasks) ||
          !same(rawReceipt.artifact, pending.identities.artifact)) {
        throw new Error("Raw verification receipt changed after evidence preparation");
      }
      const currentChangeSet = await canonicalVerificationChangeSet({
        base:pending.baseCommit,
        commit,
        repositoryRoot,
      });
      if (!same(currentChangeSet, pending.changeSet)) {
        throw new Error("Candidate change set no longer matches the verified plan");
      }
      await assertCanonicalPlan(pending.plan, {
        commit,
        baseCommit:pending.baseCommit,
        changeSet:currentChangeSet,
        packIds:pending.packIds,
        repositoryRoot,
        evidenceTask:pending.task,
        runIntentBootstrap:pending.runIntentBootstrap !== undefined,
      });

      const candidatePacks = await verificationPacksAtCommit(commit, { repositoryRoot });
      const terminalEligible = canonicalTerminalPlanEligible(pending.plan, candidatePacks);
      const consumedTerminalObligations = terminalEligible
        ? await discoverPendingReviewObligations({
          baseCommit:pending.baseCommit, candidateCommit:commit, candidateTree:tree,
          finalPaths:currentChangeSet.paths,
          finalTerminalPaths:pending.plan.terminalFullObligations ?? [], repositoryRoot,
        }) : [];
      if (!terminalEligible && pending.consumedTerminalObligations !== undefined) {
        throw new Error("Focused evidence cannot carry terminal obligation consumption");
      }
      if (!same(consumedTerminalObligations, pending.consumedTerminalObligations ?? [])) {
        throw new Error("Pending evidence terminal obligation consumption changed before recording");
      }

      let passed = validateRecordDocument({
        ...pending,
        status:"passed",
        recordedAt:new Date().toISOString(),
      });
      const existing = await currentNote(commit, repositoryRoot);
      if (existing.version === 2 && !Array.isArray(existing.records)) {
        throw new Error("Existing verification note has an invalid version 2 record set");
      }
      const records = existing.version === 2 ? existing.records : [];
      for (const record of records) {
        await validateRecordedEvidence(record, commit, tree, repositoryRoot);
      }
      const merged = records.some(({ evidenceId:existingId }) => existingId === passed.evidenceId)
        ? records
        : [...records, passed];
      const note = {
        version:2,
        records:merged,
        ...(existing.version === 2 ? {} : { legacy:[existing] }),
      };
      await gitInput(repositoryRoot,
        ["notes", `--ref=${notesRef}`, "add", "-f", "-F", "-", commit], JSON.stringify(note));
      if (pending.checkpointAttempt) {
        const store = await checkpointAttemptStore(repositoryRoot);
        const attempt = await store.read(pending.checkpointAttempt.id);
        if (attempt.identityDigest !== pending.checkpointAttempt.identityDigest) {
          throw new Error("Checkpoint attempt identity changed before Git-note promotion");
        }
        await store.markPromotion(pending.checkpointAttempt.id, "git-note-recorded");
      }
      return passed;
    } finally {
      await releaseNotes();
    }
  });
}

export async function verificationEvidence(commit = "HEAD", { repositoryRoot = repository } = {}) {
  try {
    const note = JSON.parse(await git(repositoryRoot, "notes", `--ref=${notesRef}`, "show", commit));
    if (note?.version !== 2 || !Array.isArray(note.records)) throw new Error("unsupported note schema");
    return note;
  } catch (error) {
    throw new Error(`No durable verification evidence for ${commit}: ${error.message}`);
  }
}

async function validateRecordedEvidence(record, canonical, tree, repositoryRoot) {
  validateRecordDocument(record, { allowLegacyExecutionLoad:true });
  if (record.status !== "passed" || record.commit !== canonical || record.tree !== tree) {
    throw new Error(`Verification evidence does not match commit ${canonical}`);
  }
  await requireGitAncestor(record.baseCommit, canonical, { repositoryRoot });
  const [registry, toolchain] = await Promise.all([
    gitBytes(repositoryRoot, "show", `${canonical}:verification/packs.json`),
    gitBytes(repositoryRoot, "show", `${canonical}:swarmforge/toolchain.lock.json`),
  ]);
  if (verificationDigest(registry) !== record.identities.registrySha256 ||
      verificationDigest(toolchain) !== record.identities.toolchainSha256) {
    throw new Error("Verification evidence registry or toolchain identity does not match its commit");
  }
  const lock = JSON.parse(toolchain);
  if (!same(record.identities.runtime, {
    node:lock?.node?.version,
    typescript:lock?.typescript?.version,
  })) {
    throw new Error("Verification evidence runtime identity does not match its committed toolchain lock");
  }
  const committedChangeSet = await canonicalVerificationChangeSet({
    base:record.baseCommit,
    commit:canonical,
    repositoryRoot,
  });
  if (!same(committedChangeSet, record.changeSet)) {
    throw new Error("Verification evidence change set does not match its commit range");
  }
  await assertCanonicalPlan(record.plan, {
    commit:canonical,
    baseCommit:record.baseCommit,
    changeSet:committedChangeSet,
    packIds:record.packIds,
    repositoryRoot,
    evidenceTask:record.task,
    runIntentBootstrap:record.runIntentBootstrap !== undefined,
  });
  if (record.reliabilityResolutions || record.timeoutResolutions) {
    const current = await createTimeoutIncidentStore({ root:repositoryRoot }).resolutions({ commit:canonical });
    if (!same(current.sort((left, right) => left.incidentId.localeCompare(right.incidentId)),
      record.reliabilityResolutions ?? record.timeoutResolutions)) {
      throw new Error("Verification evidence reliability resolution links do not match repository-common state");
    }
  }
  return record;
}

function evidenceCover(records, requestedPacks) {
  const requested = new Set(requestedPacks);
  const eligible = records.filter((record) => record.packIds.every((pack) => requested.has(pack)));
  function cover(group) {
    const covered = new Set();
    const selected = [];
    for (const record of group) {
      if (!record.packIds.some((pack) => !covered.has(pack))) continue;
      selected.push(record);
      for (const pack of record.packIds) covered.add(pack);
      if (requestedPacks.every((pack) => covered.has(pack))) return selected;
    }
    return undefined;
  }
  const artifactGroups = new Map();
  for (const record of eligible) {
    const key = canonicalJson(record.identities.artifact);
    artifactGroups.set(key, [...(artifactGroups.get(key) ?? []), record]);
  }
  for (const group of artifactGroups.values()) {
    const found = cover(group);
    if (found) return found;
  }
  return undefined;
}

export async function verifyVerificationEvidence(
  commit,
  base,
  task,
  packs,
  { repositoryRoot = repository } = {},
) {
  assertTaskName(task);
  const requestedPacks = sortedUnique(Array.isArray(packs) ? packs : String(packs ?? "").split(",").filter(Boolean));
  if (!requestedPacks.length || requestedPacks.some((pack) => !/^[a-z0-9][a-z0-9_-]*$/u.test(pack))) {
    throw new Error("Provide the exact comma-separated verification pack set");
  }
  const [canonical, tree] = await Promise.all([
    git(repositoryRoot, "rev-parse", `${commit}^{commit}`),
    git(repositoryRoot, "rev-parse", `${commit}^{tree}`),
  ]);
  const canonicalBase = await git(repositoryRoot, "rev-parse", `${base}^{commit}`);
  await requireGitAncestor(canonicalBase, canonical, { repositoryRoot });
  const note = await verificationEvidence(canonical, { repositoryRoot });
  const candidates = note.records.filter((record) => record.task === task && record.baseCommit === canonicalBase);
  const validated = [];
  for (const record of candidates) validated.push(await validateRecordedEvidence(record, canonical, tree, repositoryRoot));
  const records = evidenceCover(validated, requestedPacks);
  if (!records) {
    throw new Error(`Verification evidence for ${canonical} does not exactly cover base ${canonicalBase}, task ${task}, and packs ${requestedPacks.join(",")}`);
  }
  const candidatePacks = await verificationPacksAtCommit(canonical, { repositoryRoot });
  const terminalEligible = records.some(({ plan }) => canonicalTerminalPlanEligible(plan, candidatePacks));
  const canonicalRunnablePacks = planVerification(candidatePacks, {
    terminalFull:true, includeProperties:true,
  }).selectedPackIds;
  const requestedIsCanonical = same(sortedUnique(requestedPacks), sortedUnique(canonicalRunnablePacks));
  if (requestedIsCanonical && !terminalEligible) {
    throw new Error("Canonical all-runnable-pack verification evidence requires one terminal-eligible plan record");
  }
  const hasConsumption = records.some((record) => record.consumedTerminalObligations !== undefined);
  if (!terminalEligible && hasConsumption) throw new Error("Focused evidence cannot carry terminal obligation consumption");
  let consumedTerminalObligations = [];
  if (terminalEligible) {
    const finalPaths = sortedUnique(records.flatMap(({ changeSet }) => changeSet?.paths ?? []));
    const finalTerminalPaths = sortedUnique(records.flatMap(({ plan }) => plan?.terminalFullObligations ?? []));
    const canonicalEvidenceRecord = records.find(({ plan }) => canonicalTerminalPlanEligible(plan, candidatePacks));
    consumedTerminalObligations = await discoverPendingReviewObligations({
      baseCommit:canonicalBase, candidateCommit:canonical, candidateTree:tree,
      finalPaths, finalTerminalPaths, repositoryRoot, canonicalEvidenceRecord,
    });
    const recordedTerminalObligations = canonicalTerminalObligations(
      records.flatMap(({ consumedTerminalObligations:items = [] }) => items));
    if (!same(consumedTerminalObligations, recordedTerminalObligations)) {
      throw new Error("Durable verification evidence terminal obligation consumption does not match review notes");
    }
  }
  const attemptIds = [...new Set(records.flatMap((record) =>
    record.checkpointAttempt ? [record.checkpointAttempt.id] : []))];
  if (attemptIds.length) {
    const store = await checkpointAttemptStore(repositoryRoot);
    for (const id of attemptIds) await store.markPromotion(id, "handoff-eligible");
  }
  return {
    version:2,
    status:"passed",
    task,
    commit:canonical,
    tree,
    baseCommit:canonicalBase,
    packs:requestedPacks,
    planDigests:records.map(({ planDigest }) => planDigest),
    records,
    consumedTerminalObligations,
  };
}

// Compatibility name for callers: recording is intentionally a separate,
// short operation and accepts a pending evidence path, never a live plan.
export const recordVerificationEvidence = recordPendingVerificationEvidence;

async function main(args) {
  const [operation, ...rest] = args;
  if (operation === "record" && rest.length === 1) {
    const pendingPath = path.resolve(rest[0]);
    await preflightGitNotePromotion(pendingPath);
    const evidence = await recordPendingVerificationEvidence(pendingPath);
    console.log(`verification evidence recorded: ${evidence.task} (${evidence.packIds.join(",")}) ${evidence.planDigest}`);
    return;
  }
  if (operation === "verify" && rest.length === 4) {
    const evidence = await verifyVerificationEvidence(rest[0], rest[1], rest[2], rest[3]);
    console.log(`verification evidence passed: ${evidence.task} (${evidence.packs.join(",")})`);
    return;
  }
  throw new Error("Use: verification-evidence.mjs record <pending-file> | verify <commit> <base> <task> <pack[,pack...]> ");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
