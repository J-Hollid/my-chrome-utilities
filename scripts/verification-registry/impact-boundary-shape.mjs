import {prefixMatches} from "../verification-planner/ownership/resolve.mjs";

const sourceClasses = [
  "core or semantic", "application controller", "browser presentation", "persistence migration",
];
const shapes = [
  "id,prefixes,propagateDependants",
  "id,prefixes,propagateDependants,sourceClass",
  "fallbackPropagateDependants,id,prefixes,propagateDependants,sourceClass",
  "consumers,fallbackPropagateDependants,id,prefixes,propagateDependants,sourceClass",
  "consumers,id,prefixes,propagateDependants,sourceClass",
];

export function validImpactBoundaryShape(boundary, pack) {
  const ownedPaths=pack.source??[];
  return boundary && !Array.isArray(boundary) &&
    shapes.includes(Object.keys(boundary).sort().join(",")) &&
    /^[a-z0-9][a-z0-9_-]*$/u.test(boundary.id ?? "") &&
    Array.isArray(boundary.prefixes) && boundary.prefixes.length > 0 &&
    boundary.prefixes.every((prefix) => typeof prefix === "string" && prefix &&
      ownedPaths.some((owned) => prefixMatches(owned, prefix) || prefixMatches(prefix, owned))) &&
    typeof boundary.propagateDependants === "boolean" &&
    (boundary.fallbackPropagateDependants === undefined ||
      typeof boundary.fallbackPropagateDependants === "boolean") &&
    (boundary.consumers === undefined || Array.isArray(boundary.consumers) &&
      new Set(boundary.consumers).size === boundary.consumers.length &&
      boundary.consumers.every((id) => id !== pack.id && typeof id === "string")) &&
    (boundary.sourceClass === undefined || sourceClasses.includes(boundary.sourceClass));
}
