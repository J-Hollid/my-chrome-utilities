import {
  browserObservationSessionBatch, stableSliceId, uniqueStrings, values,
} from "../../verification-registry/validation.mjs";
import { prefixMatches } from "../ownership/resolve.mjs";

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
