import path from "node:path";

const isSafeRepositoryPath = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !path.posix.isAbsolute(value) &&
  path.posix.normalize(value) === value &&
  !value.startsWith("../") &&
  !value.includes("\\") &&
  !value.includes("\0");

export function validateBuildDeliveredDependencies(value) {
  if (!Array.isArray(value)) {
    throw new Error("Build-delivered dependencies require an array");
  }
  const destinations = new Set();
  for (const dependency of value) {
    const fields = dependency && Object.keys(dependency).sort().join(",");
    if (
      fields !== "destination,source" ||
      !isSafeRepositoryPath(dependency.source) ||
      !isSafeRepositoryPath(dependency.destination) ||
      destinations.has(dependency.destination)
    ) {
      throw new Error(
        "Build-delivered dependencies require unique safe source and destination paths",
      );
    }
    destinations.add(dependency.destination);
  }
  return value;
}
