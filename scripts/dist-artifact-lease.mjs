export const distArtifactLockEnvironmentKey = "MY_CHROME_UTILITIES_DIST_LOCK_HELD";
export const distArtifactAccessEnvironmentKey = "MY_CHROME_UTILITIES_DIST_LOCK_ACCESS";

export function artifactAccess(value) {
  if (value !== "read" && value !== "write") {
    throw new TypeError(`Artifact lease access must be read or write; received ${value}.`);
  }
  return value;
}

export function distArtifactLeaseEnvironment(token, access = "read") {
  if (typeof token !== "string" || token.length === 0) {
    throw new TypeError("Artifact lease token must be a non-empty string.");
  }
  return {
    [distArtifactLockEnvironmentKey]:token,
    [distArtifactAccessEnvironmentKey]:artifactAccess(access),
  };
}

export function assertArtifactAccessPermits(heldAccess, requestedAccess) {
  if (heldAccess === "read" && requestedAccess === "write") {
    throw new Error("A read-only artifact lease cannot authorize write access.");
  }
}
