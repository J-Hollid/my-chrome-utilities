import {fileURLToPath} from "node:url";
import {readFile} from "node:fs/promises";

import {routeCampsiteReadiness} from "./stacked-campsite-control.mjs";

import {
  canonicalVerificationChangeSet,
  verificationPacksAtCommit,
} from "./verification-changes.mjs";
import {
  loadVerificationPacks,
  planVerification,
  verificationSliceMapping,
  verificationPackTaskKeys,
} from "./verification-packs.mjs";
import {
  granularityDispositionFor,
  granularityDispositionsAtCommit,
  validateGranularityDispositions,
} from "./verification-granularity-dispositions.mjs";
import {canonicalRunIntentBootstrapPlan} from "./verification-run-intent.mjs";
import {activeVerificationSliceQuarantineIds} from "./verification-slice-quarantine.mjs";

const nextStages = {
  "bounded-ready":"product implementation starts from the approved QA base",
  "granularity-assessment-required":
    "a standing-authorized verification-slice preparation starts without another routine user approval",
  "coarse-within-pack":
    "a standing-authorized verification-slice preparation starts without another routine user approval",
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
const stableSliceId = (value) => typeof value === "string" &&
  /^[a-z0-9][a-z0-9_-]*$/u.test(value);
const uniqueStrings = (values) => Array.isArray(values) &&
  values.length === new Set(values).size && values.every((value) =>
    typeof value === "string" && value.length > 0);
const isRepositoryPath = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.startsWith("/") &&
  !value.startsWith("../") &&
  !value.startsWith("./") &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !value.includes("//") &&
  !value.split("/").some((segment) => segment === "." || segment === "..");

const sliceMatchesPrefix = (slice, prefix) =>
  (slice.sourcePrefixes ?? []).includes(prefix) || (slice.sourcePaths ?? []).includes(prefix);

function normalizeConsumers(values, packs, prefix) {
  if (!Array.isArray(values)) {
    throw new Error(`Ownership intent proposed prefix conflicts with declared consumers: ${prefix}`);
  }
  const consumers = values.map((consumer) => {
    const consumerPack = packs.find(({id}) => id === consumer?.packId);
    if (!consumerPack || consumer.sliceId !== undefined && !stableSliceId(consumer.sliceId)) {
      throw new Error(`Ownership intent proposed prefix names an unknown consumer: ${prefix}`);
    }
    return {packId:consumerPack.id, ...(consumer.sliceId === undefined ? {} : {sliceId:consumer.sliceId})};
  }).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  if (new Set(consumers.map((consumer) => JSON.stringify(consumer))).size !== consumers.length) {
    throw new Error(`Ownership intent proposed prefix repeats a consumer: ${prefix}`);
  }
  return consumers;
}

function normalizeProposedPrefix(value, packs) {
  const structured = typeof value !== "string";
  const proposal = structured ? value : {prefix:value};
  if (!proposal || Array.isArray(proposal) || !isRepositoryPath(proposal.prefix)) {
    throw new Error("Ownership intent names an invalid proposed prefix");
  }
  const matches = packs.flatMap((pack) => (pack.verificationSlices ?? [])
    .filter((slice) => sliceMatchesPrefix(slice, proposal.prefix))
    .map((slice) => ({pack, slice})));
  const parentPackId = proposal.parentPackId ?? matches[0]?.pack.id;
  const sliceId = proposal.sliceId ?? matches[0]?.slice.id;
  const declared = matches.find(({pack, slice}) => pack.id === parentPackId && slice.id === sliceId);
  if (!new Set(packs.map(({id}) => id)).has(parentPackId) || !stableSliceId(sliceId) ||
      (!structured && (!declared || matches.length !== 1)) ||
      structured && matches.length && (!declared || matches.length !== 1)) {
    throw new Error(`Ownership intent proposed prefix requires one known parent owner and slice: ${proposal.prefix}`);
  }
  const consumers = normalizeConsumers(proposal.consumers ?? declared?.slice.consumers ?? [],
    packs, proposal.prefix);
  if (declared && JSON.stringify(consumers) !== JSON.stringify(normalizeConsumers(
    declared.slice.consumers ?? [], packs, proposal.prefix,
  ))) {
    throw new Error(`Ownership intent proposed prefix conflicts with declared consumers: ${proposal.prefix}`);
  }
  const currentOwner = (() => {
    const owners = packs.filter((pack) => (pack.source ?? []).some((prefix) =>
      proposal.prefix === prefix || proposal.prefix.startsWith(`${prefix}/`)));
    return owners.length === 1 ? owners[0].id : null;
  })();
  if (currentOwner && currentOwner !== parentPackId) {
    throw new Error(`Ownership intent proposed prefix conflicts with current owner: ${proposal.prefix}`);
  }
  return {prefix:proposal.prefix,parentPackId,sliceId,consumers:structuredClone(consumers)};
}

export function validateWithinPackMateriality(value, intent, packs) {
  if (value === undefined) return undefined;
  if (!value || Array.isArray(value) || !stableSliceId(value.sliceId) ||
      typeof value.parentPackId !== "string" || !uniqueStrings(value.directTaskKeys) ||
      value.directTaskKeys.length === 0 || !uniqueStrings(value.prerequisiteTaskKeys ?? []) ||
      !uniqueStrings(value.unrelatedTaskKeys) || value.unrelatedTaskKeys.length === 0 ||
      typeof value.observableBoundary !== "string" || !value.observableBoundary.trim() ||
      value.meaningPreserved !== true) {
    throw new Error("Within-pack materiality requires a stable observable slice and exact task families");
  }
  const pack = packs.find(({id}) => id === value.parentPackId);
  if (!pack || !intent.approvedPackIds.includes(pack.id)) {
    throw new Error("Within-pack materiality requires an approved parent pack");
  }
  const declared = (pack.verificationSlices ?? []).find(({id}) => id === value.sliceId);
  const proposed = intent.proposedPrefixes.find(({parentPackId, sliceId}) =>
    parentPackId === pack.id && sliceId === value.sliceId);
  if (!declared && !proposed) {
    throw new Error("Within-pack materiality requires a declared or structured proposed slice");
  }
  if (declared && (JSON.stringify(canonical(declared.tasks ?? [])) !==
      JSON.stringify(canonical(value.directTaskKeys)) ||
      JSON.stringify(canonical(declared.prerequisites ?? [])) !==
      JSON.stringify(canonical(value.prerequisiteTaskKeys ?? [])) ||
      declared.observableBoundary !== value.observableBoundary)) {
    throw new Error("Within-pack materiality conflicts with the current slice declaration");
  }
  const complete = [...verificationPackTaskKeys(pack)].sort();
  const selected = canonical([...value.directTaskKeys, ...(value.prerequisiteTaskKeys ?? [])]);
  const unrelated = complete.filter((key) => !selected.includes(key));
  if (value.directTaskKeys.some((key) => (value.prerequisiteTaskKeys ?? []).includes(key)) ||
      selected.some((key) => !complete.includes(key)) ||
      JSON.stringify(canonical(value.unrelatedTaskKeys)) !== JSON.stringify(unrelated)) {
    throw new Error("Within-pack materiality must conserve the parent pack task closure");
  }
  return {
    parentPackId:pack.id,
    sliceId:value.sliceId,
    directTaskKeys:canonical(value.directTaskKeys),
    prerequisiteTaskKeys:canonical(value.prerequisiteTaskKeys ?? []),
    unrelatedTaskKeys:unrelated,
    observableBoundary:value.observableBoundary,
    unrelatedCompleteTaskFamily:true,
    stableObservableBoundary:true,
    reducesTaskScope:selected.length < complete.length,
    meaningPreserved:true,
  };
}

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
  if (intent.likelyPaths.some((value) => !isRepositoryPath(value))) {
    throw new Error("Ownership intent names an unavailable or malformed path");
  }
  const proposedPrefixes = intent.proposedPrefixes.map((value) => normalizeProposedPrefix(value, packs));
  if (new Set(proposedPrefixes.map(({prefix}) => prefix)).size !== proposedPrefixes.length) {
    throw new Error("Ownership intent requires unique proposedPrefixes");
  }
  return {
    ...intent,
    approvedPackIds:canonical(intent.approvedPackIds),
    likelyPaths:canonical(intent.likelyPaths),
    proposedPrefixes:proposedPrefixes.sort((left, right) => left.prefix.localeCompare(right.prefix)),
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
    const withinPack = input.withinPack ?? {};
    const assessedSlice = withinPack.unrelatedCompleteTaskFamily &&
      withinPack.stableObservableBoundary && withinPack.reducesTaskScope &&
      withinPack.meaningPreserved;
    const unresolvedCredibleBoundary = (input.expansionCauses ?? []).some((cause) =>
      cause.credibleBoundary && !cause.sliced && !cause.reviewedDisposition);
    classification = assessedSlice ? "coarse-within-pack"
      : unresolvedCredibleBoundary && !input.granularityAssessmentActive
        ? "granularity-assessment-required"
        : "bounded-ready";
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
    "granularity-assessment-required":"An unsliced credible boundary adds unforecast packs and has no reviewed durable disposition.",
    "coarse-within-pack":"A stable observable slice removes unrelated complete task work without changing verification meaning.",
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

function expansionCausesFor(intent, plan, packs, dispositionRegistry) {
  const approvedPackIds = new Set(intent.approvedPackIds);
  return Object.entries(plan.changedOwners ?? {})
    .filter(([, owners]) => owners.some((id) => !approvedPackIds.has(id)))
    .map(([path, owners]) => {
      const sliced = packs.some((pack) => owners.includes(pack.id) &&
        verificationSliceMapping(packs, pack, path).kind === "slice");
      return {
        path,
        owners,
        credibleBoundary:Boolean(plan.changedBoundaries?.[path]),
        sliced,
        reviewedDisposition:granularityDispositionFor(dispositionRegistry, intent.task, path),
      };
    });
}

function readinessResult(intent, plan, packs, {
  withinPack:rawWithinPack,
  granularityDispositions = {version:1, dispositions:[]},
  ...extra
} = {}) {
  const tasks = plan.tasks ?? [];
  const dispositionRegistry = validateGranularityDispositions(granularityDispositions);
  const expansionCauses = expansionCausesFor(intent, plan, packs, dispositionRegistry);
  const withinPack = validateWithinPackMateriality(rawWithinPack, intent, packs);
  if (withinPack && !(plan.packIds ?? []).includes(withinPack.parentPackId)) {
    throw new Error("Within-pack materiality parent pack is outside the canonical plan");
  }
  const classification = classifyOwnershipReadiness({
    plannedPackIds:canonical(plan.packIds ?? []),
    allPackIds:canonical(packs.filter((pack) => verificationPackTaskKeys(pack).size)
      .map(({ id }) => id)),
    expansionCauses,
    withinPack,
    granularityAssessmentActive:intent.task.startsWith("verification-slice-"),
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
    proposedPrefixes:structuredClone(intent.proposedPrefixes),
    withinPack:withinPack ?? null,
    quarantinedSliceIds:canonical(plan.quarantinedSliceIds ?? []),
    changedOwners:plan.changedOwners ?? {},
    changedBoundaries:plan.changedBoundaries ?? {},
    expansionCauses,
    unresolvedExpansionCauses:expansionCauses.filter(({credibleBoundary, sliced, reviewedDisposition}) =>
      credibleBoundary && !sliced && !reviewedDisposition).map(({path}) => path),
    terminalFullObligations:canonical(plan.terminalFullObligations ?? []),
  };
}

export async function intentOwnershipReadiness({
  intent,
  packs,
  quarantinedSliceIds = [],
  plan = (paths) => planVerification(packs, {changedPaths:paths, quarantinedSliceIds}),
  ...extra
}) {
  const validIntent = validateOwnershipIntent(intent, packs);
  const paths = canonical(validIntent.likelyPaths);
  const planned = await plan(paths);
  return readinessResult(validIntent, planned, packs, extra);
}

export async function exactOwnershipReadiness({
  intent,
  packs,
  changeSet,
  basePacks,
  plan,
  quarantinedSliceIds = [],
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
      quarantinedSliceIds,
    });
  } else {
    planned = planVerification(packs, {
      changedPaths:changeSet.paths,
      changeSet,
      basePacks,
      includeProperties:true,
      quarantinedSliceIds,
    });
  }
  return readinessResult(validIntent, planned, packs, extra);
}

function parseJsonOption(option, value) {
  try { return JSON.parse(value); }
  catch { throw new Error(`${option} requires valid JSON`); }
}

export async function applyCampsiteReadiness(answer,config,{repositoryRoot=process.cwd()}={}) {
  return routeCampsiteReadiness(repositoryRoot,answer,config);
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
    else if (option === "--prefix-proposal") output.prefixes.push(parseJsonOption(option, value));
    else if (option === "--within-pack") output.withinPack = parseJsonOption(option, value);
    else if (option === "--changed-since") output.changedSince = value;
    else if (option === "--campsite-config") output.campsiteConfig = value;
    else throw new Error(`Unknown ownership-readiness option: ${option}`);
  }
  return output;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const packs = await loadVerificationPacks();
  const granularityDispositions = await granularityDispositionsAtCommit(options.base);
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
    const quarantinedSliceIds = await activeVerificationSliceQuarantineIds(
      options.base, {repositoryRoot:process.cwd()},
    );
    answer = await intentOwnershipReadiness({
      intent, packs, quarantinedSliceIds, withinPack:options.withinPack, granularityDispositions,
    });
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
    const quarantinedSliceIds = await activeVerificationSliceQuarantineIds(
      changeSet.commit, {repositoryRoot:process.cwd()},
    );
    answer = await exactOwnershipReadiness({
      intent, packs, changeSet, basePacks, quarantinedSliceIds, withinPack:options.withinPack,
      granularityDispositions,
    });
  } else {
    throw new Error("Use ownership readiness mode intent or exact");
  }
  if (options.campsiteConfig) {
    const input=parseJsonOption("--campsite-config",
      await readFile(options.campsiteConfig,"utf8"));
    answer={...answer,campsite:await applyCampsiteReadiness(answer,input)};
  }
  process.stdout.write(`${JSON.stringify(answer, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
