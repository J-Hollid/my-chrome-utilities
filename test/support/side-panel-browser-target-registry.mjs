function text(value) {
  return typeof value === "string" && value.trim() ? value : null;
}

function exactConfigurationDifference(expected, actual) {
  const missing = Object.keys(expected).filter((key) => !Object.hasOwn(actual, key)).sort();
  const extra = Object.keys(actual).filter((key) => !Object.hasOwn(expected, key)).sort();
  const changed = Object.keys(expected).filter((key) =>
    Object.hasOwn(actual, key) && actual[key] !== expected[key]).sort();
  return { missing, extra, changed };
}

function validateDefinition(definition, { requireHooks = true } = {}) {
  if (!text(definition?.id)) throw new Error("Side-panel target requires a logical target id");
  if (!text(definition.owningPack)) throw new Error(`${definition.id} requires an owning pack`);
  if (!definition.configuration || Array.isArray(definition.configuration) ||
      typeof definition.configuration !== "object") {
    throw new Error(`${definition.id} requires exact planner configuration`);
  }
  if (!Array.isArray(definition.observationKeys) || !definition.observationKeys.length ||
      definition.observationKeys.some((key) => !text(key))) {
    throw new Error(`${definition.id} requires observation-key ownership`);
  }
  if (requireHooks) {
    for (const hook of ["setup", "observe", "cleanup"]) {
      if (typeof definition[hook] !== "function") {
        throw new Error(`${definition.id} has invalid ${hook} hook`);
      }
    }
  }
  return definition;
}

export function createSidePanelTargetRegistry(definitions, options = {}) {
  if (!Array.isArray(definitions)) throw new TypeError("Target definitions must be an array");
  const targets = new Map();
  const outputs = new Map();
  for (const candidate of definitions) {
    const definition = validateDefinition(candidate, options);
    if (targets.has(definition.id)) {
      throw new Error(`Duplicate logical target id: ${definition.id}`);
    }
    for (const key of definition.observationKeys) {
      if (outputs.has(key)) {
        const previous = outputs.get(key);
        if (!definition.outputGroup || definition.outputGroup !== previous.outputGroup) {
          throw new Error(
            `Duplicate observation-key ownership for ${key}: ${previous.id} and ${definition.id}`,
          );
        }
      }
      outputs.set(key, { id:definition.id, outputGroup:definition.outputGroup });
    }
    targets.set(definition.id, definition);
  }
  return Object.freeze({ targets, outputs });
}

function frozenConfiguration(configuration) {
  return Object.freeze(structuredClone(configuration));
}

export async function resolveSidePanelTargets({ registry, owningPack, requests, loaders }) {
  if (!Array.isArray(requests) || !requests.length) {
    throw new Error("Side-panel target request must select at least one logical target");
  }
  const requested = [];
  for (const request of requests) {
    const contract = registry.targets.get(request.id);
    if (!contract) throw new Error(`Unknown logical target id: ${request.id}`);
    if (contract.owningPack !== owningPack) {
      throw new Error(
        `${request.id} was requested through ${owningPack}; expected owning pack ${contract.owningPack}`,
      );
    }
    const difference = exactConfigurationDifference(contract.configuration, request.configuration ?? {});
    if (difference.missing.length || difference.extra.length || difference.changed.length) {
      throw new Error(
        `${request.id} configuration difference: missing ${difference.missing.join(",") || "none"}; ` +
        `extra ${difference.extra.join(",") || "none"}; changed ${difference.changed.join(",") || "none"}`,
      );
    }
    requested.push({ request, contract });
  }

  const loaded = new Map();
  for (const { contract } of requested) {
    const loader = loaders[contract.id];
    if (typeof loader !== "function") throw new Error(`${contract.id} has no literal target-module loader`);
    if (!loaded.has(loader)) loaded.set(loader, await loader());
  }
  const definitions = loaded.values().flatMap
    ? [...loaded.values()].flatMap((module) => module.definitions ?? [])
    : [];
  const moduleTargets = new Map(definitions.map((definition) => [definition.id, definition]));
  return requested.map(({ request, contract }) => {
    const definition = validateDefinition(moduleTargets.get(contract.id));
    if (definition.owningPack !== contract.owningPack) {
      throw new Error(`${contract.id} target module changed its owning pack`);
    }
    return Object.freeze({ ...definition, configuration:frozenConfiguration(request.configuration) });
  });
}

export function parseSidePanelTargetRequests(environment = process.env) {
  let ids;
  let configurations;
  try {
    ids = JSON.parse(environment.SWARMFORGE_BROWSER_TARGET_IDS ?? "[]");
    configurations = JSON.parse(environment.SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS ?? "{}");
  } catch (error) {
    throw new Error(`Invalid side-panel target request JSON: ${error.message}`);
  }
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length) {
    throw new Error("Side-panel target request must contain unique logical target ids");
  }
  return ids.map((id) => ({ id, configuration:configurations[id] ?? {} }));
}
