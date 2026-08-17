import {fileURLToPath} from "node:url";

import {
  canonicalVerificationChangeSet,
  verificationPacksAtCommit,
} from "./verification-changes.mjs";
import {loadVerificationPacks, planVerification} from "./verification-packs.mjs";
import {canonicalRunIntentBootstrapPlan} from "./verification-run-intent.mjs";

const nextStages = {
  "bounded-ready":"product implementation starts from the approved QA base",
  "coarse-boundary":
    "a standing-authorized ownership preparation stage starts without another routine user approval",
  "genuinely-global":"implementation waits for current user or release direction",
  "ownership-unavailable":
    "implementation waits for ownership repair direction without inferring a narrower boundary",
  "requirements-expanded":
    "implementation waits for current user approval of the changed product or safety requirement",
};
const readinessClasses = new Set(Object.keys(nextStages));
const canonical = (values) => [...new Set(values)].sort();
const isRepositoryPath = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.startsWith("/") &&
  !value.startsWith("../") &&
  !value.includes("\\") &&
  !value.includes("\0");

export function validateOwnershipIntent(intent, packs) {
  if (!intent || intent.version !== 1) {
    throw new Error("Ownership intent requires version 1");
  }
  if (!/^[a-f0-9]{40,64}$/u.test(intent.baseCommit ?? "")) {
    throw new Error("Ownership intent requires a canonical base commit");
  }
  if (
    typeof intent.task !== "string" ||
    !/^[a-z0-9][a-z0-9_-]*$/u.test(intent.task)
  ) {
    throw new Error("Ownership intent requires a stable task identity");
  }
  const knownPackIds = new Set((packs ?? []).map(({ id }) => id));
  for (const key of ["approvedPackIds", "likelyPaths", "proposedPrefixes"]) {
    if (!Array.isArray(intent[key]) || new Set(intent[key]).size !== intent[key].length) {
      throw new Error(`Ownership intent requires unique ${key}`);
    }
  }
  if (
    intent.approvedPackIds.length === 0 ||
    intent.approvedPackIds.some((id) => !knownPackIds.has(id))
  ) {
    throw new Error("Ownership intent names an unknown pack");
  }
  if ([...intent.likelyPaths, ...intent.proposedPrefixes].some((value) =>
    !isRepositoryPath(value))) {
    throw new Error("Ownership intent names an unavailable or malformed path");
  }
  return {
    ...intent,
    approvedPackIds:canonical(intent.approvedPackIds),
    likelyPaths:canonical(intent.likelyPaths),
    proposedPrefixes:canonical(intent.proposedPrefixes),
  };
}

function allRunnablePacksSelected(plannedPackIds, allPackIds) {
  const planned = canonical(plannedPackIds ?? []);
  const all = canonical(allPackIds ?? []);
  return all.length > 0 && planned.length === all.length &&
    planned.every((id, index) => id === all[index]);
}

export function classifyOwnershipReadiness(input) {
  let classification;
  if (input.requirementsExpanded) classification = "requirements-expanded";
  else if (input.ownershipUnavailable) classification = "ownership-unavailable";
  else if (input.genuinelyGlobal) classification = "genuinely-global";
  else if (!allRunnablePacksSelected(input.plannedPackIds, input.allPackIds)) {
    classification = "bounded-ready";
  } else {
    const causes = input.expansionCauses ?? [];
    classification = causes.length > 0 && causes.every(({ credibleBoundary }) => credibleBoundary)
      ? "coarse-boundary"
      : "genuinely-global";
  }
  if (!readinessClasses.has(classification)) {
    throw new Error("Unknown ownership-readiness classification");
  }
  const reasons = {
    "bounded-ready":"Canonical ownership remains smaller than all runnable packs.",
    "coarse-boundary":"All-pack expansion is limited to shared paths with credible exact QA boundaries.",
    "genuinely-global":"The executable behavior has canonical application-wide impact.",
    "ownership-unavailable":"Canonical current or historical ownership is unavailable.",
    "requirements-expanded":"A bounded seam would alter an approved behavior or safety requirement.",
  };
  return {
    classification,
    nextStage:nextStages[classification],
    reason:reasons[classification],
  };
}

function expansionCausesFor(intent, plan) {
  const approvedPackIds = new Set(intent.approvedPackIds);
  return Object.entries(plan.changedOwners ?? {})
    .filter(([, owners]) => owners.some((id) => !approvedPackIds.has(id)))
    .map(([path, owners]) => ({
      path,
      owners,
      credibleBoundary:Boolean(plan.changedBoundaries?.[path]),
    }));
}

function readinessResult(intent, plan, packs, extra = {}) {
  const tasks = plan.tasks ?? [];
  const expansionCauses = expansionCausesFor(intent, plan);
  const classification = classifyOwnershipReadiness({
    plannedPackIds:canonical(plan.packIds ?? []),
    allPackIds:canonical(packs.map(({ id }) => id)),
    expansionCauses,
    ...extra,
  });
  return {
    version:1,
    task:intent.task,
    baseCommit:intent.baseCommit,
    planOnly:true,
    ...classification,
    approvedPackIds:intent.approvedPackIds,
    plannedPackIds:canonical(plan.packIds ?? []),
    taskCount:tasks.length,
    criticalPathEstimateMs:plan.criticalPathEstimateMs ?? tasks.length * 1000,
    paths:canonical(plan.changedPaths ?? []),
    changedOwners:plan.changedOwners ?? {},
    changedBoundaries:plan.changedBoundaries ?? {},
    expansionCauses,
    terminalFullObligations:canonical(plan.terminalFullObligations ?? []),
  };
}

export async function intentOwnershipReadiness({
  intent,
  packs,
  plan = (paths) => planVerification(packs, {changedPaths:paths}),
  ...extra
}) {
  const validIntent = validateOwnershipIntent(intent, packs);
  const paths = canonical([...validIntent.likelyPaths, ...validIntent.proposedPrefixes]);
  const planned = await plan(paths);
  return readinessResult(validIntent, planned, packs, extra);
}

export async function exactOwnershipReadiness({
  intent,
  packs,
  changeSet,
  basePacks,
  plan,
  ...extra
}) {
  const validIntent = validateOwnershipIntent(intent, packs);
  if (
    changeSet?.version !== 1 ||
    changeSet.baseCommit !== validIntent.baseCommit ||
    !Array.isArray(changeSet.paths)
  ) {
    throw new Error("Exact ownership readiness requires the canonical version 1 change set");
  }
  let planned;
  if (plan) planned = await plan();
  else if (validIntent.task === "verification-ownership-readiness") {
    planned = canonicalRunIntentBootstrapPlan(packs, {
      packIds:validIntent.approvedPackIds,
      changeSet,
      basePacks,
    });
  } else {
    planned = planVerification(packs, {
      changedPaths:changeSet.paths,
      changeSet,
      basePacks,
      includeProperties:true,
    });
  }
  return readinessResult(validIntent, planned, packs, extra);
}

function parseOptions(args) {
  const output = {mode:args[0], packs:[], paths:[], prefixes:[]};
  for (let index = 1; index < args.length; index += 1) {
    const option = args[index];
    const value = args[index + 1];
    index += 1;
    if (option === "--base") output.base = value;
    else if (option === "--task") output.task = value;
    else if (option === "--pack") output.packs.push(value);
    else if (option === "--path") output.paths.push(value);
    else if (option === "--prefix") output.prefixes.push(value);
    else if (option === "--changed-since") output.changedSince = value;
    else throw new Error(`Unknown ownership-readiness option: ${option}`);
  }
  return output;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const packs = await loadVerificationPacks();
  const intent = {
    version:1,
    baseCommit:options.base,
    task:options.task,
    approvedPackIds:options.packs,
    likelyPaths:options.paths,
    proposedPrefixes:options.prefixes,
  };
  let answer;
  if (options.mode === "intent") {
    answer = await intentOwnershipReadiness({intent, packs});
  } else if (options.mode === "exact") {
    if (!options.changedSince) {
      throw new Error("Exact ownership readiness requires --changed-since");
    }
    const changeSet = await canonicalVerificationChangeSet({
      base:options.changedSince,
      repositoryRoot:process.cwd(),
    });
    const basePacks = await verificationPacksAtCommit(changeSet.baseCommit, {
      repositoryRoot:process.cwd(),
    });
    answer = await exactOwnershipReadiness({intent, packs, changeSet, basePacks});
  } else {
    throw new Error("Use ownership readiness mode intent or exact");
  }
  process.stdout.write(`${JSON.stringify(answer, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
