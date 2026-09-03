import path from "node:path";

import {
  defaultTaskExecutionPrerequisites, declaredTaskExecutionPrerequisites,
  declaredTaskTemporaryPathClass, validateTaskExecutionPrerequisites,
} from "../../verification-execution-prerequisites.mjs";
import { isRunnablePack, runnablePackIdsFromRegistry } from
  "../../verification-pack-cardinality/contract.mjs";
import { sharedBoundaryPlanFor } from "../../verification-shared-boundaries.mjs";
import {
  stylesheetDeclarationFor, stylesheetDeclarations, stylesheetPlanFor,
  stylesheetQaTargets as stylesheetQaTargetIds, validateStylesheetDeclarations,
  validateStylesheetOwnership,
} from "../../verification-styles.mjs";
import {bindSliceAcceptancePrerequisites,sliceAcceptanceFeatureSelected} from
  "./slice-acceptance.mjs";
import {
  browserAdapterModeNames, browserObservationSessionBatch, canonicalPaths, compatibilityOwnedPathKeys,
  exactOwnedPathKeys, focusedFeaturePolicyPaths, ownerOf, prefixOwnedPathKeys,
  slicedFocusedFeaturePolicyPaths, stableSliceId, uniqueStrings, validImpactBoundaryShape,
  validateDependencies, values, verificationImplementationPathKeys,
} from "../../verification-registry/validation.mjs";
import {
  expandVerificationDependantsAcross as expandDependantsAcross,
  expandVerificationDependencies as expandDependencies,
} from "../dependencies/expand.mjs";
import { prefixMatches } from "../ownership/resolve.mjs";
import { exactRuntimeConsumers, exactVerificationConsumers, exactVerificationHelperConsumers,
  globalImpact, impactBoundaryFor } from "../ownership/impact.mjs";

export function verificationPackTaskKeys(pack) {
  const observationGroups = new Map();
  const observedAdapterPaths = new Set(values(pack, "browserObservations").map(({path:program}) => program));
  const compatibilityAdapters = new Set(values(pack, "browserAdapterModes")
    .filter(({mode}) => mode === "compatibility").map(({path:program}) => program));
  for (const observation of values(pack, "browserObservations")) {
    const batch = browserObservationSessionBatch(pack, observation);
    const identity = batch ? `${observation.path}\0${batch}` : observation.id;
    const ids = observationGroups.get(identity) ?? [];
    ids.push(observation.id);
    observationGroups.set(identity, ids);
  }
  return new Set([
    ...values(pack, "unit").map((path) => `unit:${path}`),
    ...values(pack, "property").map((path) => `property:${path}`),
    ...values(pack, "browserAdapters")
      .filter((path) => !observedAdapterPaths.has(path) && !compatibilityAdapters.has(path))
      .map((path) => `browser:${path}`),
    ...[...observationGroups.values()].map((ids) => `browser-observation:${ids.sort().join("+")}`),
    ...values(pack, "features").flatMap((feature) => [
      `acceptance-parse:${feature}`, `acceptance-generate:${feature}`,
    ]),
    ...(values(pack, "features").length ? [`acceptance-session:${pack.id}`] : []),
    ...values(pack, "checkpointCommands").map(({id}) => `checkpoint:${pack.id}:${id}`),
  ]);
}

export function verificationSliceDeclaration(registry, pack, slice) {
  const diagnostics = [];
  if (!slice || Array.isArray(slice) || !stableSliceId(slice.id)) {
    diagnostics.push("unstable identity");
  }
  const hasSourceMapping = slice?.sourcePaths?.length || slice?.sourcePrefixes?.length ||
    slice?.consumerOnly === true;
  if (!uniqueStrings(slice?.sourcePaths ?? []) ||
      !uniqueStrings(slice?.sourcePrefixes ?? []) || !hasSourceMapping) {
    diagnostics.push("missing or duplicate source mapping");
  }
  if (!uniqueStrings(slice?.tasks ?? []) || slice?.tasks?.length === 0 ||
      !uniqueStrings(slice?.prerequisites ?? [])) {
    diagnostics.push("missing or duplicate task mapping");
  } else {
    const registered = verificationPackTaskKeys(pack);
    if ([...slice.tasks, ...slice.prerequisites].some((key) => !registered.has(key))) {
      diagnostics.push("unregistered task mapping");
    }
  }
  if (typeof slice?.observableBoundary !== "string" || !slice.observableBoundary.trim()) {
    diagnostics.push("unobservable boundary");
  }
  if (!Array.isArray(slice?.consumers)) diagnostics.push("missing consumers");
  else for (const consumer of slice.consumers) {
    const consumerPack = registry.find(({id}) => id === consumer?.packId);
    if (!consumerPack || consumer.sliceId !== undefined &&
        !(consumerPack.verificationSlices ?? []).some(({id}) => id === consumer.sliceId)) {
      diagnostics.push("unknown consumer");
    }
  }
  if (!uniqueStrings(slice?.historicalOwners ?? []) ||
      (slice?.historicalOwners ?? []).some((id) => id === pack.id ||
        !registry.some((candidate) => candidate.id === id))) {
    diagnostics.push("invalid historical owner transition");
  }
  return diagnostics;
}

export function verificationSliceMapping(registry, pack, changedPath) {
  const matches = (pack.verificationSlices ?? []).filter((slice) =>
    (slice.sourcePaths ?? []).includes(changedPath) ||
    (slice.sourcePrefixes ?? []).some((prefix) => prefixMatches(prefix, changedPath)));
  if (matches.length !== 1) return {
    kind:"parent-fallback",
    diagnostic:matches.length ? `conflicting verification slices for ${changedPath}`
      : `no verification slice for ${changedPath}`,
  };
  const diagnostics = verificationSliceDeclaration(registry, pack, matches[0]);
  return diagnostics.length ? {
    kind:"parent-fallback",diagnostic:`invalid verification slice ${pack.id}:${matches[0].id}: ${diagnostics.join(", ")}`,
  } : {kind:"slice",slice:matches[0]};
}

export function compatibleHistoricalOwnerTransition(registry, changedPath,
  formerOwner, currentOwner, {allowExactFirstRegistration=false}={}) {
  if (!currentOwner || formerOwner === currentOwner) return false;
  const pack = registry.find(({id}) => id === currentOwner);
  if (!pack) return false;
  const mapping = verificationSliceMapping(registry, pack, changedPath);
  return mapping.kind === "slice" &&
    (formerOwner ? (mapping.slice.historicalOwners ?? []).includes(formerOwner)
      : allowExactFirstRegistration);
}

export function verificationSliceSelectionMiss({sliceId, causalFailureOutsideSlice, reviewedMappingRepair = false}) {
  if (!stableSliceId(sliceId)) throw new Error("Selection miss requires a stable verification slice id");
  return {
    sliceId,
    quarantined:Boolean(causalFailureOutsideSlice && !reviewedMappingRepair),
    fallback:causalFailureOutsideSlice && !reviewedMappingRepair ? "parent-pack" : "slice-eligible",
    terminalAction:causalFailureOutsideSlice
      ? "focused-repair-then-fresh-all-runnable-packs"
      : "no-selection-miss",
  };
}

export function verificationOwner(packs, path) {
  if (path === "dist" || path.startsWith("dist/")) return "generated-artifact";
  return ownerOf(packs, path)?.id;
}

function bootstrapPackWeight(pack) {
  if (Number.isFinite(pack.measuredWeightMs) && pack.measuredWeightMs > 0) return pack.measuredWeightMs;
  return values(pack, "unit").length * 250 + values(pack, "property").length * 500 +
    values(pack, "browserAdapters").length * 15_000 +
    values(pack, "browserObservations").length * 2_000 +
    values(pack, "features").length * 200 + values(pack, "checkpointCommands").length * 2_000 + 1;
}

function shardedPacks(packs, shard) {
  if (!shard) return packs;
  const lanes = Array.from({ length:shard.count }, (_, index) => ({ index, weight:0, ids:new Set() }));
  const weighted = [...packs].sort((left, right) =>
    bootstrapPackWeight(right) - bootstrapPackWeight(left) || left.id.localeCompare(right.id));
  for (const pack of weighted) {
    lanes.sort((left, right) => left.weight - right.weight || left.index - right.index);
    lanes[0].ids.add(pack.id);
    lanes[0].weight += bootstrapPackWeight(pack);
  }
  const selected = lanes.find(({ index }) => index === shard.index)?.ids ?? new Set();
  return packs.filter(({ id }) => selected.has(id));
}

function acceptanceArtifacts(feature) {
  const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
  const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/(^-+|-+$)/gu, "");
  return {
    ir:`build/acceptance/ir/${basename}.json`,
    generated:`build/acceptance/generated/${slug}_acceptance_test.clj`,
  };
}

function displayArgument(argument) {
  return /^[A-Za-z0-9_./:=@+-]+$/u.test(argument) ? argument : JSON.stringify(argument);
}

function commandTask({
  key, stage, packId = null, executable, args, target = null, environment = null,
  logicalTargetIds = undefined, aliasCommands = undefined, reliabilityBoundaries = undefined,
  requiredCapabilities = defaultTaskExecutionPrerequisites(stage),
  temporaryPathClass = ["browser", "browser-observation"].includes(stage)
    ? "chrome-short" : "workspace",
}) {
  const task = { key, stage, packId, executable, args:[...args], target, environment,
    requiredCapabilities:[...requiredCapabilities], temporaryPathClass };
  if (logicalTargetIds) task.logicalTargetIds = [...logicalTargetIds];
  if (aliasCommands) task.aliasCommands = aliasCommands.map((command) => [...command]);
  if (reliabilityBoundaries) task.reliabilityBoundaries = structuredClone(reliabilityBoundaries);
  return { ...task, display:[executable, ...args].map(displayArgument).join(" ") };
}

export function verificationTaskIdentity(task) {
  const declared = task.requiredCapabilities === undefined
    ? { ...task, requiredCapabilities:defaultTaskExecutionPrerequisites(task.stage) }
    : task;
  const requiredCapabilities = validateTaskExecutionPrerequisites(declared);
  const identity = {
    key:task.key,
    stage:task.stage,
    packId:task.packId ?? null,
    executable:task.executable,
    args:[...task.args],
    target:task.target ?? null,
    environment:task.environment ?? null,
    requiredCapabilities,
  };
  if (task.logicalTargetIds) identity.logicalTargetIds = [...task.logicalTargetIds];
  if (task.aliasCommands) identity.aliasCommands = task.aliasCommands.map((command) => [...command]);
  if (task.prerequisiteTaskKeys) identity.prerequisiteTaskKeys=[...task.prerequisiteTaskKeys];
  return identity;
}

function featureTasks(features, packs,featureSelected=()=>true) {
  const artifacts = features.map((feature) => ({ feature, ...acceptanceArtifacts(feature) }));
  const parser = artifacts.map(({ feature, ir }) => commandTask({
    key:`acceptance-parse:${feature}`, stage:"acceptance-parse", executable:"bb",
    args:["gherkin-parser", feature, ir], target:feature,
  }));
  const generator = artifacts.map(({ feature, ir }) => commandTask({
    key:`acceptance-generate:${feature}`, stage:"acceptance-generate", executable:"bb",
    args:["acceptance-entrypoint-generator", ir, "build/acceptance/generated"], target:feature,
  }));
  const sessions = packs.map((pack) => {
    const packArtifacts = artifacts.filter(({ feature }) =>
      values(pack,"features").includes(feature)&&featureSelected(pack,feature));
    if (!packArtifacts.length) return null;
    return commandTask({
      key:`acceptance-session:${pack.id}`, stage:"acceptance-session", packId:pack.id,
      executable:"bb",
      args:["acceptance-pack-runner", pack.id, ...packArtifacts.flatMap(({ generated, ir }) => [generated, ir])],
      target:packArtifacts.map(({ feature }) => feature).join(","),
      requiredCapabilities:[], temporaryPathClass:"workspace",
      reliabilityBoundaries:values(pack, "reliabilityBoundaries"),
    });
  }).filter(Boolean);
  return { parser, generator, sessions };
}

function runnable(pack) {
  return isRunnablePack(pack);
}

function uniquePackIds(tasks) {
  return [...new Set(tasks.map(({ packId }) => packId).filter(Boolean))];
}

function historicalRegistryHasPlanningShape(packs, known) {
  const arrayKeys = [
    ...exactOwnedPathKeys, ...compatibilityOwnedPathKeys, ...prefixOwnedPathKeys,
    "globalImpact", "features", "plannedFeatures",
    "browserObservations", "checkpointCommands", "dependencies", "sharedComponents",
    "verificationInputs", "runtimeInputs", "verificationHelpers", "isolatedVerificationHandlers", "browserAdapterModes",
    "browserAdapterPerformance", "browserObservationBatches", "browserEvidencePartitions",
    "impactBoundaries", "executionPrerequisites", "stylesheets", "sharedBoundaries", "verificationSlices",
  ];
  const boundaryIds = Array.isArray(packs)
    ? packs.flatMap((pack) => Array.isArray(pack?.impactBoundaries)
      ? pack.impactBoundaries.map((boundary) => boundary?.id)
      : [])
    : [];
  const structurallyCompatible = Array.isArray(packs) && packs.length > 0 &&
    new Set(packs.map((pack) => pack?.id)).size === packs.length &&
    new Set(boundaryIds).size === boundaryIds.length &&
    packs.every((pack) => pack && typeof pack.id === "string" && known.has(pack.id) &&
      arrayKeys.every((key) => pack[key] === undefined || Array.isArray(pack[key])) &&
      exactOwnedPathKeys.concat(compatibilityOwnedPathKeys, prefixOwnedPathKeys,
        "globalImpact", "features", "plannedFeatures", "verificationInputs", "runtimeInputs")
        .every((key) => values(pack, key).every((entry) => typeof entry === "string")) &&
      ["dependencies", "sharedComponents"].every((key) =>
        values(pack, key).every((entry) => typeof entry === "string" && known.has(entry))) &&
      values(pack, "browserAdapterModes").every((entry) => entry && !Array.isArray(entry) &&
        Object.keys(entry).sort().join(",") === "mode,path" && typeof entry.path === "string" &&
        browserAdapterModeNames.has(entry.mode)) &&
      values(pack, "verificationHelpers").every((entry) => entry && typeof entry.path === "string" &&
        Array.isArray(entry.consumers)) &&
      values(pack, "impactBoundaries").every((boundary) =>
        validImpactBoundaryShape(boundary, pack)) &&
      values(pack, "sharedBoundaries").every((boundary) => boundary&&typeof boundary.id==="string") &&
      values(pack, "browserObservations").every((entry) => entry && typeof entry.path === "string") &&
      values(pack, "checkpointCommands").every((entry) => entry && typeof entry.executable === "string" &&
        Array.isArray(entry.args)));
  if (!structurallyCompatible) return false;
  try {
    validateStylesheetOwnership(packs);
    validateStylesheetDeclarations(stylesheetDeclarations(packs), {
      packIds:[...known],
    });
    return true;
  } catch {
    return false;
  }
}

function reviewedRegistrySliceChanges(basePack, currentPack, registry) {
  if (!basePack || !currentPack) return null;
  const compatibilityPaths = new Set(registry.flatMap((pack) =>
    values(pack, "compatibilityTests")));
  const normalized = (pack) => {
    const copy = structuredClone(pack);
    delete copy.verificationSlices;
    copy.unit = values(copy, "unit").filter((path) => !compatibilityPaths.has(path));
    copy.executionPrerequisites = values(copy, "executionPrerequisites")
      .filter(({path}) => !compatibilityPaths.has(path));
    return copy;
  };
  if (JSON.stringify(normalized(basePack)) !== JSON.stringify(normalized(currentPack))) return null;
  const baseSlices = new Map(values(basePack, "verificationSlices").map((slice) => [slice.id, slice]));
  const currentSlices = new Map(values(currentPack, "verificationSlices").map((slice) => [slice.id, slice]));
  if ([...baseSlices].some(([id]) => !currentSlices.has(id))) return null;
  return [...currentSlices].filter(([id, slice]) =>
    JSON.stringify(baseSlices.get(id)) !== JSON.stringify(slice)).map(([id]) => id);
}

export function planVerification(
  packs,
  {
    packIds = [], changedPaths = [], terminalFull = false, includeProperties = false,
    withDependencies = false, skipBuild = false, shard, changeSet = null,
    basePacks = undefined, historicalRegistryFallback = false, browserTargetIds = [],
    quarantinedSliceIds = packs.quarantinedSliceIds ?? [],
  } = {},
) {
  runnablePackIdsFromRegistry(packs, {
    allowLegacySourceLess:historicalRegistryFallback || packs.legacySourceLessOwnership === true,
  });
  const known = new Set(packs.map(({ id }) => id));
  validateDependencies(packs, known);
  if (new Set(packIds).size !== packIds.length) throw new Error("Select every explicit verification pack once");
  if (new Set(changedPaths).size !== changedPaths.length) throw new Error("Select every changed path once");
  if (new Set(browserTargetIds).size !== browserTargetIds.length) {
    throw new Error("Select every focused browser target once");
  }
  if (!uniqueStrings(quarantinedSliceIds) || quarantinedSliceIds.some((id) => !stableSliceId(id))) {
    throw new Error("Select every quarantined verification slice once by stable identity");
  }
  const quarantinedSlices = new Set(quarantinedSliceIds);
  for (const id of packIds) {
    const pack = packs.find((candidate) => candidate.id === id);
    if (!pack) throw new Error(`Unknown verification pack: ${id}`);
    if (!runnable(pack)) throw new Error(`Verification pack has no runnable checks: ${id}`);
  }
  if (terminalFull && (packIds.length || changedPaths.length || withDependencies)) {
    throw new Error("Use --full without pack, changed-path, or dependency selectors");
  }
  if (browserTargetIds.length && (terminalFull || changedPaths.length || packIds.length !== 1)) {
    throw new Error("Select focused browser targets from one exact pack");
  }
  if (shard && !terminalFull) throw new Error("Use --shard only with --full");
  if (skipBuild && !terminalFull) throw new Error("Use --no-build only for a prepared --full shard");
  if (!terminalFull && !packIds.length && !changedPaths.length) {
    throw new Error("Select an explicit pack, changed path, or terminal full plan");
  }

  if (changeSet) {
    const validEntries = Array.isArray(changeSet.entries) && changeSet.entries.every((entry) => {
      if (!entry || !/^[ACDMRTUXB]$/u.test(entry.status ?? "")) return false;
      if (entry.status === "R" || entry.status === "C") {
        return typeof entry.oldPath === "string" && typeof entry.newPath === "string" &&
          Number.isInteger(entry.score) && entry.score >= 0 && entry.score <= 100;
      }
      return typeof entry.path === "string";
    });
    const entryPaths = validEntries ? canonicalPaths(changeSet.entries.flatMap((entry) => entry.oldPath
      ? [entry.oldPath, entry.newPath]
      : [entry.path])) : [];
    if (changeSet.version !== 1 || !Array.isArray(changeSet.entries) || !Array.isArray(changeSet.paths) ||
        !/^[a-f0-9]{40,64}$/u.test(changeSet.baseCommit ?? "") ||
        !/^[a-f0-9]{40,64}$/u.test(changeSet.commit ?? "") || !validEntries ||
        entryPaths.join("\0") !== canonicalPaths(changeSet.paths).join("\0") ||
        canonicalPaths(changeSet.paths).join("\0") !== canonicalPaths(changedPaths).join("\0")) {
      throw new Error("Use the canonical version 1 Git change set for --changed-since planning");
    }
  }

  const explicit = new Set(packIds);
  // Explicit pack ids authorize changed-path planning. They are selected
  // directly only for exact-pack mode; changed paths must add their own
  // declared owners/consumers through applyAffected.
  let selected = terminalFull ? new Set(known)
    : (changedPaths.length || changeSet ? new Set() : new Set(explicit));
  const changedOwners = new Map();
  const changedBoundaries = new Map();
  const changedStyleTargets = new Map();
  const styleSmokeTargets = [];
  const sharedBoundaryTargets = [];
  const terminalFullObligations = [];
  const selectedVerificationSlices = new Map();
  const selectedVerificationSliceTaskKeys = new Map();
  const verificationSliceDiagnostics = [];
  const parentPackSliceFallbacks = new Set();
  const registryChanged = changedPaths.includes("verification/packs.json");
  const modularRegistrySlices = packs.some((pack) => pack.id === "verification_process" &&
    values(pack, "verificationSlices").some(({id}) => id === "registry_inventory"));
  const historicalPacksCompatible = historicalRegistryHasPlanningShape(basePacks, known);
  const historicalOwnerPaths = !changeSet || !historicalPacksCompatible ? []
    : changeSet.entries.flatMap((entry) => entry.status === "D" ? [entry.path]
      : entry.status === "R" || entry.status === "C" ? [entry.oldPath]
        : []).filter((changedPath) => changedPath !== "dist" && !changedPath.startsWith("dist/"));
  const historicalOwnershipUnavailable = historicalOwnerPaths.some((changedPath) =>
    !ownerOf(basePacks, changedPath));
  const registryPackChanges = registryChanged && historicalPacksCompatible
    ? [...new Set([...packs.map(({ id }) => id), ...basePacks.map(({ id }) => id)])]
      .filter((id) => JSON.stringify(packs.find((pack) => pack.id === id)) !==
        JSON.stringify(basePacks.find((pack) => pack.id === id)))
    : [];
  const registryChangeUnmapped = registryChanged && registryPackChanges.length === 0;
  const historicalStylesheetPaths = !changeSet ? [] : changeSet.entries.flatMap((entry) => {
    if (entry.status === "A") return [];
    if (entry.status === "R" || entry.status === "C") return [entry.oldPath];
    return [entry.path];
  }).filter((changedPath) => changedPath.endsWith(".css") &&
    changedPath !== "dist" && !changedPath.startsWith("dist/"));
  if (historicalStylesheetPaths.length && (historicalRegistryFallback ||
      !historicalPacksCompatible || registryChangeUnmapped ||
      historicalStylesheetPaths.some((changedPath) => !ownerOf(basePacks, changedPath)))) {
    throw new Error(`Stylesheet history is unavailable or incompatible for: ${historicalStylesheetPaths.join(", ")}`);
  }
  const forceAll = Boolean(changeSet) && (registryChangeUnmapped || historicalRegistryFallback ||
    !historicalPacksCompatible || historicalOwnershipUnavailable);
  const conservativeHistoricalFallbackReason = !changeSet ? null
    : registryChangeUnmapped ? "verification-registry-changed"
      : historicalRegistryFallback ? "historical-registry-unreadable"
        : !historicalPacksCompatible ? "historical-registry-incompatible"
          : historicalOwnershipUnavailable ? "historical-ownership-unavailable"
            : null;
  const allRunnableIds = packs.filter(runnable).map(({ id }) => id);
  const canonicalRunnableSelection = allRunnableIds.length === explicit.size &&
    allRunnableIds.every((id) => explicit.has(id));
  const focusedPolicyPath = (registry, changedPath) =>
    focusedFeaturePolicyPaths.has(changedPath) ||
    slicedFocusedFeaturePolicyPaths.has(changedPath) && (() => {
      return [registry, packs].some((candidateRegistry) => {
        const pack = ownerOf(candidateRegistry, changedPath);
        return pack && verificationSliceMapping(candidateRegistry, pack, changedPath).kind === "slice";
      });
    })();
  const hasFocusedFeatureBoundary = changedPaths.some(
    (changedPath) => !focusedPolicyPath(packs, changedPath));
  if (terminalFull || canonicalRunnableSelection) selected = new Set(allRunnableIds);

  const activateSlice = (registry, packId, sliceId, visiting = new Set()) => {
    const identity = `${packId}:${sliceId}`;
    if (visiting.has(identity)) return;
    const pack = registry.find(({ id }) => id === packId);
    const slice = pack?.verificationSlices?.find(({ id }) => id === sliceId);
    const diagnostics = pack && slice
      ? verificationSliceDeclaration(registry, pack, slice)
      : ["missing declaration"];
    if (diagnostics.length) {
      parentPackSliceFallbacks.add(packId);
      verificationSliceDiagnostics.push(
        `Verification slice ${identity} fell back to its parent: ${diagnostics.join(", ")}`,
      );
      return;
    }
    if (quarantinedSlices.has(sliceId)) {
      parentPackSliceFallbacks.add(packId);
      selected.add(packId);
      verificationSliceDiagnostics.push(`Verification slice ${identity} is quarantined; using parent-pack closure`);
      return;
    }
    const ids = selectedVerificationSlices.get(packId) ?? new Set();
    ids.add(sliceId);
    selectedVerificationSlices.set(packId, ids);
    const taskKeys = selectedVerificationSliceTaskKeys.get(packId) ?? new Set();
    for (const key of [...slice.tasks, ...slice.prerequisites]) taskKeys.add(key);
    selectedVerificationSliceTaskKeys.set(packId, taskKeys);
    selected.add(packId);
    const nextVisiting = new Set([...visiting, identity]);
    for (const consumer of slice.consumers) {
      if (consumer.sliceId) activateSlice(registry, consumer.packId, consumer.sliceId, nextVisiting);
      else {
        parentPackSliceFallbacks.add(consumer.packId);
        selected.add(consumer.packId);
        verificationSliceDiagnostics.push(
          `Verification slice ${identity} uses parent consumer ${consumer.packId}`);
      }
    }
  };

  const recordSliceMapping = (changedPath, registries) => {
    if (terminalFull || canonicalRunnableSelection) return;
    if (hasFocusedFeatureBoundary && registries.some((registry) => focusedPolicyPath(registry, changedPath))) return;
    if (registryChanged && !modularRegistrySlices) {
      for (const registry of registries) {
        const pack = ownerOf(registry, changedPath);
        if (pack && verificationSliceMapping(registry, pack, changedPath).kind === "slice") {
          parentPackSliceFallbacks.add(pack.id);
          verificationSliceDiagnostics.push("Verification slices cannot narrow the same registry-change evidence range");
        }
      }
      return;
    }
    for (const registry of registries) {
      const pack = ownerOf(registry, changedPath);
      if (!pack) continue;
      const retiredExactHelper=registry===basePacks&&
        exactVerificationHelperConsumers(basePacks,changedPath).length>0&&
        exactVerificationHelperConsumers(packs,changedPath).length===0;
      if(retiredExactHelper)continue;
      const mapping = verificationSliceMapping(registry, pack, changedPath);
      const currentSuccessor=registry===basePacks&&mapping.kind==="slice"&&
        packs.find(({id})=>id===pack.id)?.verificationSlices
          ?.some(({id})=>id===mapping.slice.id);
      if(currentSuccessor){
        activateSlice(packs,pack.id,mapping.slice.id);
        continue;
      }
      if (mapping.kind === "slice") activateSlice(registry, pack.id, mapping.slice.id);
      else {
        parentPackSliceFallbacks.add(pack.id);
        if ((pack.verificationSlices ?? []).length) {
          verificationSliceDiagnostics.push(mapping.diagnostic);
        }
      }
    }
  };

  const affectedFor = (registry, changedPath, {
    exactVerificationChange = true, forceVerificationExact = false,
  } = {}) => {
    if ((explicit.size || hasFocusedFeatureBoundary) &&
        focusedPolicyPath(registry, changedPath) &&
        !canonicalRunnableSelection && !terminalFull) {
      return { semantic:[], exactSemantic:[], verificationConsumers:[], boundary:null };
    }
    if (changedPath === "dist" || changedPath.startsWith("dist/")) {
      return { semantic:[], exactSemantic:[], verificationConsumers:[], boundary:null };
    }
    const owner = ownerOf(registry, changedPath);
    if (!owner) throw new Error(`Assign every changed path to one verification pack: ${changedPath}`);
    const sharedPlan=sharedBoundaryPlanFor(registry,changedPath);
    if(sharedPlan)return{semantic:sharedPlan.selected,exactSemantic:[],verificationConsumers:[],boundary:sharedPlan.boundaryId,propagateDependants:false,sharedBoundaryTargets:sharedPlan.qaTargets,terminalFullObligation:sharedPlan.terminalFullObligation};
    const stylePlan = stylesheetPlanFor(registry, changedPath);
    if (stylePlan) {
      const unavailable = stylePlan.selected.filter((id) => !known.has(id));
      if (unavailable.length) {
        throw new Error(`Stylesheet ${changedPath} names unavailable verification consumers: ${unavailable.join(", ")}`);
      }
      return {
        semantic:stylePlan.selected,
        exactSemantic:[],
        verificationConsumers:[],
        boundary:null,
        propagateDependants:false,
        styleSmokeTargets:stylePlan.styleSmokeTargets,
        terminalFullObligation:stylePlan.terminalFullObligation,
      };
    }
    if (changedPath.endsWith(".css") && stylesheetDeclarations(registry).length) {
      throw new Error(`Undeclared stylesheet boundary blocks verification prelaunch: ${changedPath}`);
    }
    const boundary = impactBoundaryFor(owner, changedPath);
    const runtimeConsumers = exactRuntimeConsumers(registry, changedPath);
    const boundaryConsumers = values(boundary ?? {}, "consumers");
    const helperConsumers = exactVerificationHelperConsumers(registry, changedPath);
    const verificationOwned = exactVerificationChange && (forceVerificationExact ||
      verificationImplementationPathKeys.some((key) => values(owner, key).includes(changedPath)) ||
      values(owner, "isolatedVerificationHandlers").includes(changedPath)
    );
    const semantic = helperConsumers.length || verificationOwned ? []
        : globalImpact(registry, changedPath, modularRegistrySlices ? owner : undefined)
        ? [owner.id, ...registry.filter(runnable).map(({ id }) => id)]
        : [...(boundary && !boundary.propagateDependants ? [] : [owner.id]), ...runtimeConsumers];
    const exactSemantic = verificationOwned || boundary && !boundary.propagateDependants
      ? [owner.id, ...boundaryConsumers] : [];
    const verificationConsumers = [
      ...exactVerificationConsumers(registry, changedPath), ...helperConsumers,
    ];
    const unavailable = [...new Set([...semantic, ...verificationConsumers])]
      .filter((id) => !known.has(id));
    if (unavailable.length) {
      throw new Error(`Historical verification owner is unavailable for ${changedPath}: ${unavailable.join(", ")}`);
    }
    return {
      semantic:[...new Set(semantic)],
      exactSemantic:[...new Set(exactSemantic)],
      verificationConsumers:[...new Set(verificationConsumers)],
      boundary:boundary?.id ?? null,
    };
  };
  const combinedAffected = (...affected) => ({
    semantic:[...new Set(affected.flatMap((entry) => entry.semantic))],
    exactSemantic:[...new Set(affected.flatMap((entry) => entry.exactSemantic ?? []))],
    verificationConsumers:[...new Set(affected.flatMap((entry) => entry.verificationConsumers))],
    boundary:affected.map(({ boundary }) => boundary).find(Boolean) ?? null,
    propagateDependants:affected.every((entry) => entry.propagateDependants === false) ? false : undefined,
    styleSmokeTargets:[...new Set(affected.flatMap((entry) => entry.styleSmokeTargets ?? []))],
    sharedBoundaryTargets:[...new Set(affected.flatMap((entry)=>entry.sharedBoundaryTargets??[]))],
    terminalFullObligation:affected.some((entry) => entry.terminalFullObligation),
  });
  const applyAffected = (changedPath, affected, registries = [packs]) => {
    recordSliceMapping(changedPath, registries);
    const semanticClosure = affected.propagateDependants === false
      ? affected.semantic
      : expandDependantsAcross(registries, affected.semantic);
    const complete = new Set([
      ...semanticClosure, ...(affected.exactSemantic ?? []), ...affected.verificationConsumers,
    ]);
    const orderedClosure = (changedPath === "dist" || changedPath.startsWith("dist/")) &&
      explicit.size && !complete.size
      ? packs.filter((pack) => explicit.has(pack.id) && runnable(pack)).map(({ id }) => id)
      : packs.filter((pack) => complete.has(pack.id) && runnable(pack)).map(({ id }) => id);
    const omitted = orderedClosure.filter((id) => !explicit.has(id));
    if (explicit.size && omitted.length) {
      throw new Error(`Changed path ${changedPath} affects ${orderedClosure.join(", ")}, ` +
        `outside the explicit pack set: ${omitted.join(", ")}`);
    }
    for (const id of orderedClosure) selected.add(id);
    changedOwners.set(changedPath, orderedClosure);
    if (affected.boundary) changedBoundaries.set(changedPath, affected.boundary);
    if (affected.styleSmokeTargets?.length) styleSmokeTargets.push(...affected.styleSmokeTargets);
    if(affected.sharedBoundaryTargets?.length)sharedBoundaryTargets.push(...affected.sharedBoundaryTargets);
    if (affected.styleSmokeTargets?.length) {
      changedStyleTargets.set(changedPath, [...affected.styleSmokeTargets]);
    }
    if (affected.terminalFullObligation) terminalFullObligations.push(changedPath);
  };

  if (forceAll) {
    for (const changedPath of changedPaths) {
      applyAffected(changedPath, {
        semantic:allRunnableIds, exactSemantic:[], verificationConsumers:[], boundary:null,
      });
    }
  } else if (changeSet) {
    for (const entry of changeSet.entries) {
      if (entry.path === "verification/packs.json") {
        const unslicedRegistryChanges = [];
        if (!modularRegistrySlices) {
          unslicedRegistryChanges.push(...registryPackChanges);
        } else {
          for (const id of registryPackChanges) {
            const currentPack = packs.find((pack) => pack.id === id);
            const basePack = basePacks.find((pack) => pack.id === id);
            const sliceIds = reviewedRegistrySliceChanges(basePack, currentPack, packs);
            if (!sliceIds?.length) unslicedRegistryChanges.push(id);
            else for (const sliceId of sliceIds) activateSlice(packs, id, sliceId);
          }
        }
        applyAffected(entry.path, {
          semantic:[], exactSemantic:unslicedRegistryChanges,
          verificationConsumers:[], boundary:null,
        }, modularRegistrySlices ? [packs] : [basePacks, packs]);
      } else if (entry.status === "A") {
        applyAffected(entry.path, affectedFor(packs, entry.path));
      } else if (entry.status === "D") {
        applyAffected(entry.path, affectedFor(basePacks, entry.path, {
          exactVerificationChange:false,
        }), [basePacks]);
      } else if (entry.status === "R" || entry.status === "C") {
        if (entry.status === "C" && modularRegistrySlices && ownerOf(packs, entry.oldPath)) {
          const formerOwner = ownerOf(basePacks, entry.oldPath)?.id;
          const currentOwner = ownerOf(packs, entry.oldPath)?.id;
          const compatibleTransition = compatibleHistoricalOwnerTransition(
            packs, entry.oldPath, formerOwner, currentOwner);
          const former = compatibleTransition
            ? {semantic:[], exactSemantic:[], verificationConsumers:[], boundary:null,
                propagateDependants:false}
            : affectedFor(basePacks, entry.oldPath);
          applyAffected(entry.oldPath,
            combinedAffected(former, affectedFor(packs, entry.oldPath)), [packs]);
        } else {
          applyAffected(entry.oldPath, affectedFor(basePacks, entry.oldPath, {
            exactVerificationChange:entry.status !== "R",
          }), [basePacks, packs]);
        }
        applyAffected(entry.newPath, affectedFor(packs, entry.newPath),
          modularRegistrySlices ? [packs] : [packs, basePacks]);
      } else {
        const formerOwner = ownerOf(basePacks, entry.path)?.id;
        const currentOwner = ownerOf(packs, entry.path)?.id;
        const compatibleTransition = compatibleHistoricalOwnerTransition(
          packs, entry.path, formerOwner, currentOwner,
          {allowExactFirstRegistration:modularRegistrySlices});
        if (formerOwner !== currentOwner && !compatibleTransition) {
          throw new Error(`Conflicting current and historical verification ownership for ${entry.path}: ${formerOwner} -> ${currentOwner}`);
        }
        const currentPack = packs.find(({ id }) => id === currentOwner);
        const isolatedHandler = currentPack
          ? values(currentPack, "isolatedVerificationHandlers").includes(entry.path)
          : false;
        const former = compatibleTransition
          ? {semantic:[], exactSemantic:[], verificationConsumers:[], boundary:null,
              propagateDependants:false}
          : affectedFor(basePacks, entry.path, {forceVerificationExact:isolatedHandler});
        const current = affectedFor(packs, entry.path);
        applyAffected(entry.path, combinedAffected(former, current),
          modularRegistrySlices ? [packs] : [basePacks, packs]);
      }
    }
  } else {
    for (const changedPath of changedPaths) applyAffected(changedPath, affectedFor(packs, changedPath));
  }
  if (explicit.size) {
    const omittedSliceConsumers = [...selected].filter((id) => !explicit.has(id));
    if (omittedSliceConsumers.length) {
      throw new Error(`Verification slices affect packs outside the explicit pack set: ${omittedSliceConsumers.join(", ")}`);
    }
  }
  if (terminalFull || withDependencies) selected = expandDependencies(packs, selected);

  const styleSmokeAuthorization = changedStyleTargets.size > 0
    ? packs.filter((pack) => {
      const targets = new Set(values(pack, "browserObservations").map(({ id }) => id));
      return styleSmokeTargets.some((target) => targets.has(target)) &&
        (!explicit.size || explicit.has(pack.id));
    }) : [];
  const ordered = packs.filter(({ id }) => selected.has(id));
  const styleAuthorizationIds = new Set(styleSmokeAuthorization.map(({ id }) => id));
  const authorizedExecutionPacks = packs.filter((pack) => runnable(pack) &&
    (selected.has(pack.id) || styleAuthorizationIds.has(pack.id)));
  const executionPacks = canonicalRunnableSelection
    ? packs.filter(runnable)
    : shardedPacks(authorizedExecutionPacks, shard);
  if (!executionPacks.some(runnable)) throw new Error("Verification plan has no runnable checks");

  const preparationTasks = skipBuild ? [] : [commandTask({
    key:"build:dist", stage:"build", executable:"npm", args:["run", "build"],
  })];
  let unitTasks = browserTargetIds.length ? [] : executionPacks.flatMap((pack) => values(pack, "unit").map((path) => commandTask({
    key:`unit:${path}`, stage:"unit", packId:pack.id, executable:"node", args:[path], target:path,
    requiredCapabilities:declaredTaskExecutionPrerequisites(pack, path, "unit"),
    temporaryPathClass:declaredTaskTemporaryPathClass(pack, path, "unit"),
  })));
  let propertyTasks = !browserTargetIds.length
    ? executionPacks.flatMap((pack) => (terminalFull || includeProperties
      ? values(pack, "property") : []).map((path) => commandTask({
      key:`property:${path}`, stage:"property", packId:pack.id, executable:"node", args:[path], target:path,
      requiredCapabilities:declaredTaskExecutionPrerequisites(pack, path, "property"),
      temporaryPathClass:declaredTaskTemporaryPathClass(pack, path, "property"),
    })))
    : [];
  const observedAdapterPaths = new Set(executionPacks.flatMap((pack) =>
    values(pack, "browserObservations").map(({ path }) => path)));
  const compatibilityAdapters = new Set(packs.flatMap((pack) =>
    values(pack, "browserAdapterModes")
      .filter(({ mode }) => mode === "compatibility").map(({ path }) => path)));
  let browserTasks = browserTargetIds.length ? [] : executionPacks.flatMap((pack) =>
    values(pack, "browserAdapters")
      .filter((path) => !observedAdapterPaths.has(path) && !compatibilityAdapters.has(path))
      .map((path) => commandTask({
      key:`browser:${path}`, stage:"browser", packId:pack.id, executable:"node", args:[path], target:path,
      requiredCapabilities:declaredTaskExecutionPrerequisites(pack, path, "browser"),
      temporaryPathClass:declaredTaskTemporaryPathClass(pack, path, "browser"),
    })));

  const onlyGlobalStyleQaBoundaries = changedPaths.length > 0 && changedPaths.every((changedPath) => {
    const declaration = stylesheetDeclarationFor(packs, changedPath);
    return declaration?.classification === "global" && declaration.qaTargets.length > 0;
  });
  const styleSmokeOnly = onlyGlobalStyleQaBoundaries &&
    changedStyleTargets.size === changedPaths.length &&
    !terminalFull && !canonicalRunnableSelection;
  const changedStyleTargetIds = new Set(Object.values(Object.fromEntries(changedStyleTargets))
    .flatMap((targets) => targets));
  const changedSharedTargetIds=new Set(sharedBoundaryTargets);
  const executionIds = new Set(executionPacks.map(({ id }) => id));
  const selectedObservations = packs.flatMap((declarationPack) => {
    if (!executionIds.has(declarationPack.id)) return [];
    const observations = values(declarationPack, "browserObservations");
    const changedBoundaryIds = new Set(Object.entries(Object.fromEntries(changedBoundaries))
      .filter(([changedPath]) => changedOwners.get(changedPath)?.includes(declarationPack.id))
      .map(([, boundary]) => boundary));
    const changedAdapterTargetIds = new Set(
      observations.filter(({ path }) => changedPaths.includes(path)).map(({ id }) => id),
    );
    const boundaryTargets = changedBoundaryIds.size
      ? observations.filter(({ impactBoundaries }) => impactBoundaries?.some((id) => changedBoundaryIds.has(id)))
      : [];
    const styleTargets = observations.filter(({ id }) => changedStyleTargetIds.has(id));
    const sharedTargets=observations.filter(({id})=>changedSharedTargetIds.has(id));
    const sliceNarrowed = selectedVerificationSlices.has(declarationPack.id) &&
      !parentPackSliceFallbacks.has(declarationPack.id);
    const sliceTargets = sliceNarrowed ? observations.filter(({id}) =>
      [...selectedVerificationSliceTaskKeys.get(declarationPack.id) ?? []]
        .some((key) => key.startsWith("browser-observation:") &&
          key.slice("browser-observation:".length).split("+").includes(id))) : [];
    const ordinaryTargets = sliceNarrowed ? sliceTargets
      : styleSmokeOnly || !selected.has(declarationPack.id) ? []
      : changedAdapterTargetIds.size ? observations.filter(({ id }) => changedAdapterTargetIds.has(id))
      : boundaryTargets.length ? boundaryTargets : observations.filter(({ id }) =>
        !stylesheetQaTargetIds.has(id));
    const selectedTargets = browserTargetIds.length
      ? observations.filter(({ id }) => browserTargetIds.includes(id))
      : terminalFull || canonicalRunnableSelection ? observations
      : [...new Map([...styleTargets,...sharedTargets, ...ordinaryTargets].map((item) => [item.id, item])).values()];
    return selectedTargets.map((observation) => ({
      declarationPack, observation,
      boundaryScoped:boundaryTargets.some(({ id }) => id === observation.id),
    }));
  });
  const selectedTargetIds = new Set(selectedObservations.map(({ observation }) => observation.id));
  for (const id of browserTargetIds) {
    if (!selectedTargetIds.has(id)) throw new Error(`Unknown browser target in selected pack: ${id}`);
  }
  const acceptancePacks = browserTargetIds.length ? [] : executionPacks
    .filter((pack) => values(pack, "features").length);
  const features = acceptancePacks.flatMap((pack) => {
    const selectedForPack = selectedObservations.filter(({ declarationPack }) =>
      declarationPack.id === pack.id);
    if (!selectedForPack.some(({ boundaryScoped }) => boundaryScoped)) return values(pack, "features");
    const owned = new Set(selectedForPack.flatMap(({ observation }) => observation.features ?? []));
    return values(pack, "features").filter((feature) => owned.has(feature));
  }).sort();
  const acceptance = featureTasks(features, acceptancePacks,(pack,feature)=>
    sliceAcceptanceFeatureSelected({packId:pack.id,feature,
      selectedSlices:selectedVerificationSlices,selectedTaskKeys:selectedVerificationSliceTaskKeys,
      parentFallbacks:parentPackSliceFallbacks}));
  acceptance.sessions=acceptance.sessions.map((task)=>bindSliceAcceptancePrerequisites(task,{
    selectedSlices:selectedVerificationSlices,selectedTaskKeys:selectedVerificationSliceTaskKeys,
    parentFallbacks:parentPackSliceFallbacks}));
  const observationGroups = new Map();
  for (const item of selectedObservations) {
    const { declarationPack, observation } = item;
    const sessionBatch = browserObservationSessionBatch(declarationPack, observation);
    const groupKey = sessionBatch
      ? `${declarationPack.id}\0${observation.path}\0${sessionBatch}`
      : `${declarationPack.id}\0${observation.id}`;
    const group = observationGroups.get(groupKey) ?? [];
    group.push(item);
    observationGroups.set(groupKey, group);
  }
  let observationTasks = [...observationGroups.values()].map((group) => {
    const ids = group.map(({ observation }) => observation.id).sort();
    const environment = Object.assign({}, ...group.map(({ observation }) => observation.environment));
    const declarationPack = group[0].declarationPack;
    const sessionBatch = browserObservationSessionBatch(declarationPack, group[0].observation);
    const completeIds = values(declarationPack, "browserObservations")
      .filter((observation) => observation.path === group[0].observation.path &&
        browserObservationSessionBatch(declarationPack, observation) === sessionBatch)
      .map((observation) => observation.id).sort();
    const completeAdapterBatch = ids.length === completeIds.length &&
      ids.every((id, index) => id === completeIds[index]);
    return commandTask({
      key:`browser-observation:${ids.join("+")}`, stage:"browser-observation",
      packId:declarationPack.id, executable:"node",
      args:["scripts/run-browser-observation.mjs", ...ids], target:ids.join(","), environment,
      logicalTargetIds:ids, aliasCommands:[
        ...(completeAdapterBatch ? [["node", group[0].observation.path]] : []),
        ...ids.map((id) => ["node", "scripts/run-browser-observation.mjs", id]),
      ],
    });
  });
  const mode = browserTargetIds.length ? "focused" : terminalFull ? "terminal" : explicit.size ? "exact" : "impact";
  let checkpointTasks = browserTargetIds.length ? [] : executionPacks.flatMap((pack) => values(pack, "checkpointCommands")
    .filter((checkpoint) => !checkpoint.modes || checkpoint.modes.includes(mode))
    .map((checkpoint) => commandTask({
      key:`checkpoint:${pack.id}:${checkpoint.id}`, stage:"checkpoint", packId:pack.id,
      executable:checkpoint.executable, args:checkpoint.args, target:checkpoint.id,
      environment:checkpoint.environment ?? null,
    })));
  const taskAllowedBySlice = (task) => {
    if (terminalFull || canonicalRunnableSelection) return true;
    if (includeProperties && task.stage === "property" &&
        !selectedVerificationSlices.has(task.packId)) return true;
    let packId = task.packId;
    if (!packId && typeof task.target === "string") {
      packId = packs.find((pack) => values(pack, "features").includes(task.target))?.id;
    }
    if (!packId || parentPackSliceFallbacks.has(packId) || !selectedVerificationSlices.has(packId)) return true;
    return selectedVerificationSliceTaskKeys.get(packId)?.has(task.key) ?? false;
  };
  unitTasks = unitTasks.filter(taskAllowedBySlice);
  propertyTasks = propertyTasks.filter(taskAllowedBySlice);
  browserTasks = browserTasks.filter(taskAllowedBySlice);
  observationTasks = observationTasks.filter(taskAllowedBySlice);
  checkpointTasks = checkpointTasks.filter(taskAllowedBySlice);
  acceptance.parser = acceptance.parser.filter(taskAllowedBySlice);
  acceptance.generator = acceptance.generator.filter(taskAllowedBySlice);
  acceptance.sessions = acceptance.sessions.filter(taskAllowedBySlice);

  if (styleSmokeOnly) {
    // A stylesheet-only impact is intentionally bounded to its declared smoke
    // observations; do not expose unrelated owner, consumer, or acceptance
    // tasks through the plan metadata either.
    unitTasks.length = 0;
    propertyTasks.length = 0;
    browserTasks.length = 0;
    acceptance.parser.length = 0;
    acceptance.generator.length = 0;
    acceptance.sessions.length = 0;
    checkpointTasks.length = 0;
  }

  const tasks = styleSmokeOnly
    ? [...preparationTasks, ...observationTasks]
    : [
      ...preparationTasks, ...unitTasks, ...propertyTasks, ...browserTasks, ...observationTasks,
      ...acceptance.parser, ...acceptance.generator, ...checkpointTasks, ...acceptance.sessions,
    ];
  const keys = tasks.map(({ key }) => key);
  if (new Set(keys).size !== keys.length) throw new Error("Verification task identities must be unique");
  if (!tasks.some(({ stage }) => stage !== "build")) throw new Error("Verification plan has no runnable checks");

  const display = (items) => items.map(({ display:command }) => command);
  const stages = {
    build:uniquePackIds(preparationTasks), unit:uniquePackIds(unitTasks),
    property:uniquePackIds(propertyTasks), browser:uniquePackIds(browserTasks),
    browserObservation:uniquePackIds(observationTasks), acceptance:uniquePackIds(acceptance.sessions),
    checkpoint:uniquePackIds(checkpointTasks),
  };
  const verificationSliceConservation = Object.fromEntries(packs
    .filter((pack) => values(pack, "verificationSlices").length)
    .map((pack) => {
      const complete = [...verificationPackTaskKeys(pack)].sort();
      const sliced = [...new Set(values(pack, "verificationSlices")
        .flatMap((slice) => [...values(slice, "tasks"), ...values(slice, "prerequisites")]))].sort();
      const remainder = complete.filter((key) => !sliced.includes(key));
      const conserved = [...new Set([...sliced, ...remainder])].sort().join("\0") ===
        complete.join("\0");
      return [pack.id, {
        completeTaskKeys:complete,
        sliceTaskKeys:sliced,
        remainderTaskKeys:remainder,
        conserved,
      }];
    }));
  return {
    version:2,
    mode,
    requestedPackIds:packs.filter(({ id }) => explicit.has(id)).map(({ id }) => id),
    claimPackIds:packs.filter(({ id }) => explicit.has(id)).map(({ id }) => id),
    selectedPackIds:ordered.map(({ id }) => id),
    packIds:ordered.map(({ id }) => id),
    adapterAuthorizationPackIds:styleSmokeAuthorization.map(({ id }) => id),
    changedPaths:[...changedPaths].sort(),
    changeSet:changeSet ? structuredClone(changeSet) : null,
    baseCommit:changeSet?.baseCommit ?? null,
    changedOwners:Object.fromEntries([...changedOwners].sort(([left], [right]) => left.localeCompare(right))),
    changedBoundaries:Object.fromEntries([...changedBoundaries].sort(([left], [right]) => left.localeCompare(right))),
    styleSmokeTargets:[...new Set(styleSmokeTargets)].sort(),
    sharedBoundaryTargets:[...new Set(sharedBoundaryTargets)].sort(),
    terminalFullObligations:[...new Set(terminalFullObligations)].sort(),
    changedStyleTargets:Object.fromEntries([...changedStyleTargets]
      .sort(([left], [right]) => left.localeCompare(right))),
    conservativeHistoricalFallbackReason,
    selectedVerificationSlices:Object.fromEntries([...selectedVerificationSlices]
      .map(([id, ids]) => [id, [...ids].sort()]).sort(([left], [right]) => left.localeCompare(right))),
    selectedVerificationSliceTaskKeys:Object.fromEntries([...selectedVerificationSliceTaskKeys]
      .map(([id, keys]) => [id, [...keys].sort()]).sort(([left], [right]) => left.localeCompare(right))),
    quarantinedSliceIds:[...quarantinedSlices].sort(),
    verificationSliceDiagnostics:[...new Set(verificationSliceDiagnostics)].sort(),
    parentPackSliceFallbacks:[...parentPackSliceFallbacks].sort(),
    verificationSliceConservation,
    features,
    handlers:acceptancePacks.flatMap((pack) => values(pack, "handlers")),
    shard:shard ?? null,
    includeProperties:Boolean(terminalFull || includeProperties),
    withDependencies:Boolean(withDependencies),
    skipBuild:Boolean(skipBuild),
    stages,
    preparationTasks, unitTasks, propertyTasks, browserTasks, observationTasks,
    parserTasks:acceptance.parser, generatorTasks:acceptance.generator,
    checkpointTasks, sessionTasks:acceptance.sessions, tasks,
    preparationCommands:display(preparationTasks),
    unitCommands:display(unitTasks), propertyCommands:display(propertyTasks),
    browserCommands:display(browserTasks), observationCommands:display(observationTasks),
    parserCommands:display(acceptance.parser), generatorCommands:display(acceptance.generator),
    checkpointCommands:display(checkpointTasks), sessionCommands:display(acceptance.sessions),
    acceptanceCommands:display([...acceptance.parser, ...acceptance.generator, ...acceptance.sessions]),
    commands:display(tasks),
  };
}
