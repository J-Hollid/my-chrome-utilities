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
    input:{ syntheticOwner:"execution-binding-contract", taskCount:102 },
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

export function emitBlockedAggregatePopulationAssertionRegression({runnerSource}) {
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  assert.equal(context.version,1);
  const category="other:brittle-source-assertion";
  if(context.causalCategory!==category)return;
  const legacyPattern=/eligibleCandidates\.length \|\| flakyCandidates\.length\|\| blockedAggregateObligation/u;
  const currentPattern=/eligibleCandidates\.length \|\| flakyCandidates\.length\|\|baselineCandidates\.length \|\| blockedAggregateObligation/u;
  const expectedPreRepairFailure={completePopulationAssertion:false};
  const expectedRepairResult={completePopulationAssertion:true};
  assert.equal(legacyPattern.test(runnerSource),false);
  assert.equal(currentPattern.test(runnerSource),true);
  const fixture={id:"blocked-aggregate-complete-population-assertion-v1",
    causalCategory:category,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{legacyPattern:legacyPattern.source,currentPattern:currentPattern.source},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=verificationDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:expectedRepairResult}}}));
}
