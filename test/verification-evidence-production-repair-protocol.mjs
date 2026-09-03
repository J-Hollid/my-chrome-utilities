import assert from "node:assert/strict";
import {createHash} from "node:crypto";

const incidentId="f60e272e-9870-4584-9189-b2376ecd699d";
const failureDigest="653aec2af8e20bb53b56a4c7d3be2fc0c5ff11776a934b8f7f434e023b5f463b";
const causalCategory="other:focused evidence ownership claims";
const diagnosedBoundary={
  kind:"task",
  taskKey:"unit:test/verification-evidence-production-path-test.mjs",
  executionArgs:["test/verification-evidence-production-path-test.mjs"],
};
const exactContextKeys=["causalCategory","causalExplanation","diagnosedBoundary",
  "failureDigest","incidentId","version"];

function normalized(value){
  if(Array.isArray(value))return value.map(normalized);
  if(!value||typeof value!=="object")return value;
  return Object.fromEntries(Object.entries(value)
    .sort(([left],[right])=>left.localeCompare(right))
    .map(([key,nested])=>[key,normalized(nested)]));
}

function digest(value){
  return createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
}

export function verificationEvidenceProductionRepairProtocol(context,{
  claimPackIds,prerequisiteTaskKeys,selectedTaskKeys,
}){
  assert.deepEqual(Object.keys(context??{}).sort(),exactContextKeys,
    "the causal protocol accepts only its exact context");
  assert.equal(context.version,1);
  assert.equal(context.incidentId,incidentId);
  assert.equal(context.failureDigest,failureDigest);
  assert.equal(context.causalCategory,causalCategory);
  assert.equal(typeof context.causalExplanation,"string");
  assert.ok(context.causalExplanation.length>0&&context.causalExplanation.length<=500);
  assert.deepEqual(context.diagnosedBoundary,diagnosedBoundary);
  const expectedPreRepairFailure={
    claimPackIds:["flow_graph","shell","verification_process"],prerequisiteTaskKeys,
  };
  const expectedRepairResult={claimPackIds:["verification_process"],prerequisiteTaskKeys};
  const fixture={id:"focused-evidence-ownership-claim-v1",causalCategory,
    diagnosedBoundaryDigest:digest(diagnosedBoundary),
    input:{focusedEvidenceTask:"fixture-evidence"},
    expectedPreRepairFailure,expectedRepairResult};
  const repairResult={claimPackIds,prerequisiteTaskKeys:prerequisiteTaskKeys.filter((key)=>
    selectedTaskKeys.includes(key))};
  assert.deepEqual(repairResult,expectedRepairResult);
  const fixtureDigest=digest(fixture);
  return {version:2,incidentId,failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
}

export function emitVerificationEvidenceProductionRepairProtocol({
  encodedContext,claimPackIds,prerequisiteTaskKeys,selectedTaskKeys,
}){
  if(!encodedContext)return;
  const protocol=verificationEvidenceProductionRepairProtocol(JSON.parse(encodedContext),{
    claimPackIds,prerequisiteTaskKeys,selectedTaskKeys});
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:protocol}));
}
