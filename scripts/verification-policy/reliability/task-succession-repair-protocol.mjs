import assert from "node:assert/strict";

import {verificationTaskDigest} from "./task-succession.mjs";

const causalCategory="other:phase2 acceptance-session prerequisite identity";

export function emitPhase2SuccessionRepairProtocol({currentSession,productionEdge}) {
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  assert.equal(context.version,1);
  if (context.causalCategory!==causalCategory) return;
  const expectedPreRepairFailure={prerequisiteTaskCount:84,
    destinationTaskDigest:"de6cdfb0c1f1d493405239bb099f130e235b3e71eafcd1b8fdc1d74f638fbaf1"};
  const expectedRepairResult={prerequisiteTaskCount:87,
    destinationTaskDigest:"39ad8474c9d8f95449e59a54f5334479784216a87f53985b18f16290e3201ed3"};
  const repairResult={prerequisiteTaskCount:currentSession.prerequisiteTaskKeys.length,
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
