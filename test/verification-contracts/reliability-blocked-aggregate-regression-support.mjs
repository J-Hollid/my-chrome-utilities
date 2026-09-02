import assert from "node:assert/strict";
import { verificationDigest } from "../../scripts/verification-evidence.mjs";

const causalCategory="other:blocked aggregate owner transition plan digest";
const preTransitionDigest=
  "96a30653d513a9782a57db4b4916accf71c09a1b5b5adf58d3f08261cb2ba7e1";

export function emitBlockedAggregatePlanDigestRegression({
  actualPlanDigest, expectedPlanDigest,
}) {
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  assert.equal(context.version, 1);
  if (context.causalCategory !== causalCategory) return;
  assert.equal(actualPlanDigest, expectedPlanDigest);
  const expectedPreRepairFailure={
    planDigestMatches:false, expectedPlanDigest:preTransitionDigest, actualPlanDigest,
  };
  const expectedRepairResult={
    planDigestMatches:true, expectedPlanDigest, actualPlanDigest,
  };
  const fixture={
    id:"blocked-aggregate-owner-transition-plan-digest-v1",
    causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{ syntheticOwner:"execution-binding-contract", taskCount:92 },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest=verificationDigest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{ status:"failed", fixtureDigest,
      observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest,
      observed:expectedRepairResult },
  } }));
}
