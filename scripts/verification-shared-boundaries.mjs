import path from "node:path";

const structuralClasses = new Set([
  "registration",
  "packaging",
  "composition",
  "persistence",
  "migration",
  "shared-semantics",
]);
const boundaryFields = [
  "consumers",
  "id",
  "owner",
  "prefixes",
  "propagateDependants",
  "qaTargets",
  "structuralClass",
  "terminalFullObligation",
].sort().join(",");

const isNormalizedPath = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !path.posix.isAbsolute(value) &&
  path.posix.normalize(value) === value &&
  !value.startsWith("../") &&
  !value.includes("\\") &&
  !value.includes("\0");

export function sharedBoundaryDeclarations(packs) {
  return (packs ?? []).flatMap((pack) =>
    (pack.sharedBoundaries ?? []).map((declaration) => ({
      ...declaration,
      declaredBy:pack.id,
    })));
}

function observationOwners(packs) {
  return new Map(packs.flatMap((pack) =>
    (pack.browserObservations ?? []).map(({ id }) => [id, pack.id])));
}

export function validateSharedBoundaryDeclarations(packs) {
  if (!Array.isArray(packs)) {
    throw new Error("Shared boundaries require the canonical verification pack array");
  }
  const packIds = new Set(packs.map(({ id }) => id));
  const observations = observationOwners(packs);
  const seenIds = new Set();
  const seenPrefixes = new Set();

  for (const boundary of sharedBoundaryDeclarations(packs)) {
    const fields = Object.keys(boundary)
      .filter((key) => key !== "declaredBy")
      .sort()
      .join(",");
    if (fields !== boundaryFields) {
      throw new Error(
        `Shared boundary ${boundary.id ?? "declaration"} has missing or unknown fields`,
      );
    }
    if (
      typeof boundary.id !== "string" ||
      !/^[a-z0-9][a-z0-9_-]*$/u.test(boundary.id) ||
      seenIds.has(boundary.id)
    ) {
      throw new Error(`Duplicate or invalid shared boundary identity: ${boundary.id}`);
    }
    seenIds.add(boundary.id);

    if (boundary.owner !== boundary.declaredBy || !packIds.has(boundary.owner)) {
      throw new Error(`Shared boundary ${boundary.id} must be declared by its owner pack`);
    }
    if (
      !Array.isArray(boundary.prefixes) ||
      boundary.prefixes.length === 0 ||
      boundary.prefixes.some((prefix) =>
        !isNormalizedPath(prefix) || seenPrefixes.has(prefix))
    ) {
      throw new Error(`Shared boundary ${boundary.id} has duplicate or invalid prefixes`);
    }
    boundary.prefixes.forEach((prefix) => seenPrefixes.add(prefix));

    if (
      !Array.isArray(boundary.consumers) ||
      new Set(boundary.consumers).size !== boundary.consumers.length ||
      boundary.consumers.some((id) => !packIds.has(id) || id === boundary.owner)
    ) {
      throw new Error(
        `Shared boundary ${boundary.id} has an unknown, duplicate, or self-owned consumer`,
      );
    }
    if (
      !structuralClasses.has(boundary.structuralClass) ||
      boundary.propagateDependants !== false ||
      typeof boundary.terminalFullObligation !== "boolean"
    ) {
      throw new Error(`Shared boundary ${boundary.id} has an invalid structural contract`);
    }
    const boundaryPacks = [boundary.owner, ...boundary.consumers];
    if (
      !Array.isArray(boundary.qaTargets) ||
      boundary.qaTargets.length === 0 ||
      new Set(boundary.qaTargets).size !== boundary.qaTargets.length ||
      boundary.qaTargets.some((target) =>
        !observations.has(target) || !boundaryPacks.includes(observations.get(target)))
    ) {
      throw new Error(
        `Shared boundary ${boundary.id} requires observable QA smoke targets owned by its boundary packs`,
      );
    }
  }
  return packs;
}

function boundaryContainsSource(boundary, source) {
  return boundary.prefixes.some((prefix) =>
    source === prefix || source.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`));
}

export function sharedBoundaryPlanFor(packs, source) {
  const matches = sharedBoundaryDeclarations(packs)
    .filter((boundary) => boundaryContainsSource(boundary, source));
  if (matches.length > 1) {
    throw new Error(`Ambiguous shared boundary ownership for ${source}`);
  }
  const [boundary] = matches;
  if (!boundary) return null;
  return {
    boundaryId:boundary.id,
    owner:boundary.owner,
    selected:[...new Set([boundary.owner, ...boundary.consumers])],
    qaTargets:[...boundary.qaTargets],
    structuralClass:boundary.structuralClass,
    propagateDependants:false,
    terminalFullObligation:boundary.terminalFullObligation,
  };
}
