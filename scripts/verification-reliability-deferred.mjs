import { verificationTaskDigest } from "./verification-task-succession.mjs";

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

function diagnosedProjection(incident) {
  const descriptors=(incident?.repair?.focusedTaskPlan??[]).filter(({roles,taskSuccession})=>
    roles?.includes("diagnosed-boundary")&&taskSuccession);
  if(descriptors.length!==1)return undefined;
  const descriptor=descriptors[0],succession=descriptor.taskSuccession,
    sourceTaskDigest=verificationTaskDigest(incident.failure.task),
    destinationTaskDigest=verificationTaskDigest(descriptor.identity);
  if(succession?.version!==1||succession.sourceTaskDigest!==sourceTaskDigest||
      succession.destinationTaskDigest!==destinationTaskDigest||!succession.chain?.length||
      typeof succession.conservationDigest!=="string")return undefined;
  return{version:1,incidentId:incident.id,sourceTaskDigest,
    destinationTaskKey:descriptor.identity.key,destinationTaskDigest,
    conservationDigest:succession.conservationDigest};
}

export function terminalProjectionCoverage(incident,reviewTasks) {
  const projection=diagnosedProjection(incident);
  if(!projection)return undefined;
  const result=reviewTasks?.[projection.destinationTaskKey];
  if(result?.status!=="passed"||result.provenance!=="fresh"||
      verificationTaskDigest(result.identity)!==projection.destinationTaskDigest)return undefined;
  return{...projection,status:"passed",provenance:"fresh"};
}

export function terminalProjectionCoverageShapeValid(coverage) {
  return coverage===undefined||(coverage?.version===1&&typeof coverage.incidentId==="string"&&
    typeof coverage.sourceTaskDigest==="string"&&typeof coverage.destinationTaskKey==="string"&&
    typeof coverage.destinationTaskDigest==="string"&&typeof coverage.conservationDigest==="string"&&
    coverage.status==="passed"&&coverage.provenance==="fresh");
}

export function terminalProjectionCoverageValid(incident,coverage,focusedTaskKeys) {
  const expected=diagnosedProjection(incident);
  return Boolean(expected&&terminalProjectionCoverageShapeValid(coverage)&&coverage&&
    Object.entries(expected).every(([key,value])=>coverage[key]===value)&&
    focusedTaskKeys?.includes(expected.destinationTaskKey));
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
