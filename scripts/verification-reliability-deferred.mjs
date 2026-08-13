const sharedVerificationInputPrefixes = Object.freeze([
  "scripts/",
  "swarmforge/scripts/",
  "verification/",
]);

const sharedVerificationInputs = Object.freeze(new Set([
  ".nvmrc",
  "bb.edn",
  "deps.edn",
  "package-lock.json",
  "package.json",
  "swarmforge/toolchain.lock.json",
  "tsconfig.json",
]));

export const verificationProcessRevalidationTask = "unit:test/verification-process-contract-test.mjs";

function canonicalChangedPaths(changedPaths) {
  return [...new Set(changedPaths ?? [])].map((changedPath) =>
    String(changedPath).replace(/^\.\//u, "")).sort();
}

export function verificationProcessOnlyChangeSet(changedPaths) {
  const paths = canonicalChangedPaths(changedPaths);
  return paths.length > 0 && paths.every((changedPath) =>
    changedPath.startsWith("scripts/") || changedPath.startsWith("verification/") ||
    changedPath === "test/verification-process-contract-test.mjs");
}

export function verificationRevalidationValid({ incident, proof, changedPaths } = {}) {
  const revalidation = proof?.verificationRevalidation;
  const actualPaths = canonicalChangedPaths(changedPaths);
  const declaredPaths = canonicalChangedPaths(revalidation?.changeSetPaths);
  const focusedTaskKeys = proof?.reviewReady?.focusedTaskKeys;
  return [
    revalidation?.version === 1,
    revalidation?.kind === "verification-process-only",
    revalidation?.incidentId === incident?.id,
    revalidation?.candidateCommit === proof?.candidate?.commit,
    revalidation?.candidateTree === proof?.candidate?.tree,
    revalidation?.baseCommit === proof?.reviewReady?.baseCommit,
    verificationProcessOnlyChangeSet(declaredPaths),
    JSON.stringify(declaredPaths) === JSON.stringify(actualPaths),
    focusedTaskKeys?.includes(verificationProcessRevalidationTask),
    revalidation?.focusedTask === verificationProcessRevalidationTask,
    revalidation?.packageDigest === proof?.package?.digest,
    proof?.package?.fresh === true,
    revalidation?.packageFresh === true,
    revalidation?.incidentState === "unresolved",
    revalidation?.terminalObligation === true,
    incident?.state === "unresolved",
    incident?.repair?.status === "eligible",
  ].every(Boolean);
}

function sharedVerificationInput(changedPath) {
  return sharedVerificationInputs.has(changedPath) ||
    sharedVerificationInputPrefixes.some((prefix) => changedPath.startsWith(prefix));
}

function repositoryPathCandidate(value, candidates) {
  if (typeof value !== "string") return null;
  const canonical = value.replace(/^\.\//u, "");
  return candidates.has(canonical) ? canonical : null;
}

function nestedValues(value) {
  if (value === null || typeof value !== "object") return [];
  return Object.values(value);
}

function repositoryPaths(value, candidates, found = new Set()) {
  const candidate = repositoryPathCandidate(value, candidates);
  if (candidate) found.add(candidate);
  for (const nested of nestedValues(value)) repositoryPaths(nested, candidates, found);
  return found;
}

export function terminalVerificationDeferredConservation({ incident, changedPaths }) {
  const canonicalPaths = canonicalChangedPaths(changedPaths);
  const candidates = new Set(canonicalPaths);
  const boundInputs = repositoryPaths({
    failureTask:incident?.failure?.task,
    repairChangedPaths:incident?.repair?.changedPaths,
    regression:incident?.repair?.regression,
    focusedTaskPlan:incident?.repair?.focusedTaskPlan,
    causalFixture:incident?.repair?.causalProtocol?.fixture,
  }, candidates);
  const relevantChangedPaths = canonicalPaths.filter((changedPath) =>
    boundInputs.has(changedPath) || sharedVerificationInput(changedPath));
  return { conserved:relevantChangedPaths.length === 0, relevantChangedPaths,
    changedPaths:canonicalPaths };
}
