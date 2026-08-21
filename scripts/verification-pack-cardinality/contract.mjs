import { createHash } from "node:crypto";

function canonicalPackIds(packIds, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(packIds) || (!allowEmpty && !packIds.length) ||
      packIds.some((id) => typeof id !== "string" || !id) ||
      new Set(packIds).size !== packIds.length) {
    throw new Error(`${label} requires unique runnable pack identities`);
  }
  return [...packIds].sort();
}

const runnableFields = Object.freeze([
  "unit",
  "property",
  "features",
  "browserAdapters",
  "browserObservations",
  "checkpointCommands",
]);

export function isRunnablePack(pack) {
  return runnableFields.some((field) => Array.isArray(pack?.[field]) && pack[field].length > 0);
}

export function classifyPackDefinition(pack, packs) {
  if (!isRunnablePack(pack)) return {
    classification:"non-runnable compatibility metadata",
    terminalTreatment:"excluded from the runnable set",
  };
  if (Array.isArray(pack?.source) && pack.source.length > 0) return {
    classification:"valid source-owned behavior pack",
    terminalTreatment:"included with every registered task",
  };
  const owner = pack?.verificationOnly?.productionOwner;
  if (typeof owner !== "string" || !owner) return {
    classification:"invalid ambiguous pack",
    terminalTreatment:"block before planning",
  };
  const sourceOwner = packs.find((candidate) => candidate?.id === owner);
  if (!Array.isArray(sourceOwner?.source) || sourceOwner.source.length === 0) return {
    classification:"invalid verification-only production owner",
    terminalTreatment:"block before planning",
  };
  return {
    classification:"valid verification-only behavior pack",
    terminalTreatment:"included with every registered task",
  };
}

function representativeTask(pack) {
  const scalarFields = ["unit", "property", "features", "browserAdapters"];
  for (const field of scalarFields) {
    const target = pack?.[field]?.[0];
    if (typeof target === "string" && target) {
      return Object.freeze({ key:`${field}:${target}`, field, target });
    }
  }
  const observation = pack?.browserObservations?.[0];
  if (observation?.id) {
    return Object.freeze({
      key:`browser-observation:${observation.id}`,
      field:"browserObservations",
      target:observation.id,
    });
  }
  const checkpoint = pack?.checkpointCommands?.[0];
  if (checkpoint?.id) {
    return Object.freeze({
      key:`checkpoint:${pack.id}:${checkpoint.id}`,
      field:"checkpointCommands",
      target:checkpoint.id,
    });
  }
  throw new Error(`Runnable pack ${pack?.id ?? "<unknown>"} has no representative task`);
}

export function runnablePackIdsFromRegistry(packs, { allowLegacySourceLess = false } = {}) {
  if (!Array.isArray(packs)) throw new Error("Runnable pack registry must be an array");
  const runnablePacks = packs.filter(isRunnablePack);
  for (const pack of runnablePacks) {
    const result = classifyPackDefinition(pack, packs);
    if (result.classification === "invalid ambiguous pack" && !allowLegacySourceLess) {
      throw new Error(`Source-less runnable pack ${pack?.id ?? "<unknown>"} requires an explicit verification-only production owner`);
    }
    if (result.classification === "invalid verification-only production owner") {
      throw new Error(`Verification-only pack ${pack?.id ?? "<unknown>"} must name a source-owning pack as its production owner`);
    }
  }
  const ids = runnablePacks.map(({ id }) => id);
  return canonicalPackIds(ids, "Runnable pack registry", { allowEmpty:true });
}

export function runnablePackRegistryIdentity(packIds) {
  const canonical = canonicalPackIds(packIds, "Runnable pack registry identity");
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function createVerificationPackCardinalityAdapter(packs, options = {}) {
  const runnablePackIds = Object.freeze(runnablePackIdsFromRegistry(packs, options));
  const byId = new Map(packs.map((pack) => [pack.id, pack]));
  return Object.freeze({
    runnablePackIds,
    runnablePackCount:runnablePackIds.length,
    registryIdentity:runnablePackRegistryIdentity(runnablePackIds),
    representativeTasks:Object.freeze(runnablePackIds.map((packId) => Object.freeze({
      packId,
      task:representativeTask(byId.get(packId)),
    }))),
  });
}

export async function dispatchRepresentativeRunnablePacks(packs, dispatch) {
  if (typeof dispatch !== "function") {
    throw new Error("Representative runnable-pack dispatch requires an executor");
  }
  const { representativeTasks } = createVerificationPackCardinalityAdapter(packs);
  const results = [];
  for (const representative of representativeTasks) {
    results.push(await dispatch(representative));
  }
  return results;
}

export function assertCompleteRunnablePackSelection({ registryPackIds, selectedPackIds } = {}) {
  const registry = canonicalPackIds(registryPackIds, "Runnable pack registry");
  const selected = canonicalPackIds(selectedPackIds, "Terminal pack selection");
  if (JSON.stringify(registry) !== JSON.stringify(selected)) {
    throw new Error("Terminal verification requires the complete runnable pack set from the exact registry");
  }
  return selected;
}
