import { createHash } from "node:crypto";

function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) =>
    left.localeCompare(right)).map(([key, nested]) => [key, normalized(nested)]));
}

const digest = (value) => createHash("sha256")
  .update(JSON.stringify(normalized(value))).digest("hex");

export function emitVerificationAdministrationRepairProtocol(fixtureId) {
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const expectedPreRepairFailure = { artifactInputIdentity:"changed-before-task-launch" };
  const expectedRepairResult = { artifactInputIdentity:"bound-to-runner-receipt" };
  const fixture = {
    id:fixtureId,
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
    version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:expectedRepairResult },
  } }));
}

export function emitAcceptanceSessionPrerequisiteRepairProtocol(observed) {
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const expectedPreRepairFailure = { checkpointProducerPrerequisite:false };
  const expectedRepairResult = { checkpointProducerPrerequisite:true };
  if (JSON.stringify(observed) !== JSON.stringify(expectedRepairResult)) {
    throw new Error("Acceptance-session checkpoint prerequisite repair is incomplete");
  }
  const fixture = {
    id:"vtd014-checkpoint-producer-session-prerequisite-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
    version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed },
  } }));
}
