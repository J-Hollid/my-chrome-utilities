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
  const canonicalChangedPaths = [...new Set(changedPaths)].sort();
  const candidates = new Set(canonicalChangedPaths);
  const boundInputs = repositoryPaths({
    failureTask:incident?.failure?.task,
    repairChangedPaths:incident?.repair?.changedPaths,
    regression:incident?.repair?.regression,
    focusedTaskPlan:incident?.repair?.focusedTaskPlan,
    causalFixture:incident?.repair?.causalProtocol?.fixture,
  }, candidates);
  const relevantChangedPaths = canonicalChangedPaths.filter((changedPath) =>
    boundInputs.has(changedPath) || sharedVerificationInput(changedPath));
  return { conserved:relevantChangedPaths.length === 0, relevantChangedPaths,
    changedPaths:canonicalChangedPaths };
}
