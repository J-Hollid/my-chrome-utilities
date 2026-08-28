import { prefixMatches } from "./resolve.mjs";

const values = (pack, key) => pack[key] ?? [];

export function globalImpact(packs, path, owner) {
  return (owner ? [owner] : packs).some((pack) =>
    values(pack, "globalImpact").some((prefix) => prefixMatches(prefix, path)));
}

export function exactVerificationConsumers(packs, path) {
  return packs.filter((pack) =>
    values(pack, "verificationInputs").includes(path) ||
    values(pack, "browserObservations").some((observation) => observation.path === path) ||
    values(pack, "checkpointCommands").some(({ executable, args }) =>
      executable === "node" && args?.[0] === path)
  ).map(({ id }) => id);
}

export function exactVerificationHelperConsumers(packs, path) {
  return packs.flatMap((pack) => values(pack, "verificationHelpers")
    .filter((declaration) => declaration.path === path)
    .flatMap((declaration) => declaration.consumers));
}

export function exactRuntimeConsumers(packs, path) {
  return packs.filter((pack) => values(pack, "runtimeInputs").includes(path)).map(({ id }) => id);
}

export function impactBoundaryFor(pack, changedPath) {
  const matches = values(pack, "impactBoundaries").filter((boundary) =>
    boundary.prefixes.some((prefix) => prefixMatches(prefix, changedPath)));
  if (!matches.length) return null;
  return matches.sort((left, right) =>
    Math.max(...right.prefixes.map((prefix) => prefix.length)) -
    Math.max(...left.prefixes.map((prefix) => prefix.length)))[0];
}
