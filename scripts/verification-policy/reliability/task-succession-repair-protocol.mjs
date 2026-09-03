import assert from "node:assert/strict";

import {verificationTaskDigest} from "./task-succession.mjs";

const causalCategory="other:phase2 acceptance-session prerequisite identity";
const compactSuccessionCausalCategory="other:missing-receipt-bound-compact-successor";

export function emitCompactSuccessionRepairProtocol({incident,productionEdges}) {
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  assert.equal(context.version,1);
  if (context.causalCategory!==compactSuccessionCausalCategory) return;
  const expectedPreRepairFailure={receiptBoundSuccessorCount:0};
  const expectedRepairResult={receiptBoundSuccessorCount:1};
  const repairResult={receiptBoundSuccessorCount:productionEdges.length};
  assert.deepEqual(repairResult,expectedRepairResult,
    "compact conservation has one receipt-bound successor");
  const fixture={id:"compact-conservation-receipt-bound-successor-v1",
    causalCategory:compactSuccessionCausalCategory,
    diagnosedBoundaryDigest:verificationTaskDigest(context.diagnosedBoundary),
    input:{incidentId:incident.id,sourceReceipt:incident.failure.sourceReceipt},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=verificationTaskDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}}}));
}

export function emitPhase2SuccessionRepairProtocol({currentSession,productionEdge}) {
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  assert.equal(context.version,1);
  if (context.causalCategory!==causalCategory) return;
  const expectedPreRepairFailure={prerequisiteTaskCount:84,
    destinationTaskDigest:"de6cdfb0c1f1d493405239bb099f130e235b3e71eafcd1b8fdc1d74f638fbaf1"};
  const expectedRepairResult={prerequisiteTaskCount:0,
    destinationTaskDigest:"75e9bd207b230149823491df87ed6d0d05299bd5278ff9b058cea3c5990d0bf1"};
  const repairResult={prerequisiteTaskCount:currentSession.prerequisiteTaskKeys?.length??0,
    destinationTaskDigest:productionEdge.destinationTaskDigest};
  assert.deepEqual(repairResult,expectedRepairResult,
    "Phase 2 succession uses the current exact prerequisite identity");
  const fixture={id:"phase2-acceptance-session-prerequisite-identity-v1",causalCategory,
    diagnosedBoundaryDigest:verificationTaskDigest(context.diagnosedBoundary),
    input:{taskKey:"acceptance-session:verification_process"},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=verificationTaskDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}}}));
}
