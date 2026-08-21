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

export function runnablePackIdsFromRegistry(packs) {
  if (!Array.isArray(packs)) throw new Error("Runnable pack registry must be an array");
  const ids = packs.filter((pack) => runnableFields.some((field) =>
    Array.isArray(pack?.[field]) && pack[field].length > 0)).map(({ id }) => id);
  return canonicalPackIds(ids, "Runnable pack registry", { allowEmpty:true });
}

export function runnablePackRegistryIdentity(packIds) {
  const canonical = canonicalPackIds(packIds, "Runnable pack registry identity");
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function assertCompleteRunnablePackSelection({ registryPackIds, selectedPackIds } = {}) {
  const registry = canonicalPackIds(registryPackIds, "Runnable pack registry");
  const selected = canonicalPackIds(selectedPackIds, "Terminal pack selection");
  if (JSON.stringify(registry) !== JSON.stringify(selected)) {
    throw new Error("Terminal verification requires the complete runnable pack set from the exact registry");
  }
  return selected;
}
