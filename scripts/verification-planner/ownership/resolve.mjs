const exactOwnedPathKeys = [
  "unit", "property", "features", "handlers", "browserAdapters", "compatibilityTests",
];
const values = (pack, key) => pack[key] ?? [];

export function prefixMatches(prefix, candidatePath) {
  return candidatePath === prefix || candidatePath.startsWith(prefix);
}

export function processPrefixMatches(prefix, candidatePath) {
  return prefix.endsWith("/") ? candidatePath.startsWith(prefix) : candidatePath === prefix;
}

function ownersAtPriority(packs, candidatePath) {
  const levels = [
    packs.filter((pack) => values(pack, "sharedBoundaries").some(({ prefixes }) =>
      prefixes.some((prefix) => prefixMatches(prefix, candidatePath)))),
    packs.filter((pack) => exactOwnedPathKeys.some((key) =>
      values(pack, key).includes(candidatePath)) ||
      values(pack, "plannedFeatures").includes(candidatePath) ||
      values(pack, "checkpointCommands").some(({ executable, args }) =>
        executable === "node" && args?.[0] === candidatePath)),
    packs.filter((pack) => values(pack, "verificationSlices").some((slice) =>
      values(slice, "sourcePaths").includes(candidatePath) ||
      values(slice, "sourcePrefixes").some((prefix) => prefixMatches(prefix, candidatePath)))),
    packs.filter((pack) => values(pack, "source").some((prefix) =>
      prefixMatches(prefix, candidatePath))),
    packs.filter((pack) => values(pack, "process").some((prefix) =>
      processPrefixMatches(prefix, candidatePath))),
  ];
  return levels.find((owners) => owners.length) ?? [];
}

export function verificationOwnerForPath(packs, candidatePath) {
  const owners = ownersAtPriority(packs, candidatePath);
  const ids = [...new Set(owners.map(({ id }) => id))];
  if (ids.length > 1) {
    throw new Error(`Ambiguous verification ownership for ${candidatePath}: ${ids.join(", ")}`);
  }
  return owners[0];
}
