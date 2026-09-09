import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";
import {conservedLegacyTaskKeys} from "../../scripts/verification-planner/manifest-declarations/repair-proof.mjs";

import { planVerification } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";

const packs = await loadVerificationPacks();

function planFor(path, expectedSlices) {
  const plan = planVerification(packs, { changedPaths:[path] });
  assert.deepEqual(plan.parentPackSliceFallbacks, [], `${path} has no parent-pack fallback`);
  assert.deepEqual(plan.verificationSliceDiagnostics, [], `${path} has one valid causal slice`);
  assert.deepEqual(plan.selectedVerificationSlices, expectedSlices,
    `${path} selects its exact causal slice and consumers`);
  return plan;
}

function assertExactTaskKeys(plan, expected, path) {
  assert.deepEqual(plan.tasks.map(({ key }) => key), expected,
    `${path} selects only its direct bounded task closure`);
}

const modularPath = "acceptance/src/acceptance/steps/modular_architecture.clj";
const modularPlan = planFor(modularPath,
  { shell:["verification_pack_cardinality_contract"], verification_process:["task_batching"] });
const parentRegressionKey="unit:test/feature-parent-consumer-coverage-test.mjs";
const modularKeys=conservedLegacyTaskKeys(modularPlan.tasks);
const historyRegressionKey="unit:scripts/verification-planner/tasks/historical-parent-requirements-test.mjs";
assert.equal(modularKeys.filter(key=>key===historyRegressionKey).length,1);
assert.equal(modularKeys.filter(key=>key===parentRegressionKey).length,1);
assert.equal(modularKeys.length, 19);
assert.equal(createHash("sha256").update(JSON.stringify(modularKeys.filter(key=>key!==parentRegressionKey&&key!==historyRegressionKey)))
  .digest("hex"), "8f16e008e6c1cf8be61b1a1907095e26c9f40ab79689ad2fb14b46108b938ee4");

const checkpointPath = "acceptance/src/acceptance/verification_support/" +
  "modular_architecture_task_checkpoint_repair_handlers.clj";
const checkpointPlan = planFor(checkpointPath,
  { shell:["task_checkpoint_repair_handler"] });
assertExactTaskKeys(checkpointPlan, [
  "build:dist",
  "unit:test/verification-contracts/task-checkpoint-repair-handler-direct-test.mjs",
], checkpointPath);
assert.match(packs.find(({ id }) => id === "shell").verificationSlices.find(
  ({ id }) => id === "task_checkpoint_repair_handler").observableBoundary,
  /direct handler invocation/iu);

const throughputPath =
  "acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj";
const throughputPlan = planFor(throughputPath,
  { shell:["modular_throughput_evidence"] });
assertExactTaskKeys(throughputPlan, [
  "build:dist",
  "unit:test/verification-contracts/modular-throughput-evidence-direct-test.mjs",
], throughputPath);
assert.match(packs.find(({ id }) => id === "shell").verificationSlices.find(
  ({ id }) => id === "modular_throughput_evidence").observableBoundary,
  /direct helper invocation/iu);

const pathLocalOwnershipCases = [{
  path:"test/verification-pack-cardinality-contract-test.mjs",
  sourcePaths:["test/verification-pack-cardinality-contract-test.mjs"],
  sliceId:"verification_pack_cardinality_path_contract",
  taskKey:"unit:test/verification-pack-cardinality-contract-test.mjs",
  boundary:/path-local registry cardinality contract/iu,
}, {
  path:"test/verification-evidence-production-path-test.mjs",
  sourcePaths:["test/verification-evidence-production-path-test.mjs"],
  sliceId:"verification_evidence_production_path_contract",
  taskKey:"unit:test/verification-evidence-production-path-test.mjs",
  boundary:/path-local review-evidence production contract/iu,
}, {
  path:"test/verification-evidence-production-repair-protocol.mjs",
  sourcePaths:["test/verification-evidence-production-repair-protocol.mjs"],
  sliceId:"verification_evidence_production_repair_protocol",
  taskKey:"unit:test/verification-evidence-production-path-test.mjs",
  boundary:/path-local causal repair protocol/iu,
}];
for (const { path:sourcePath, sourcePaths, sliceId, taskKey, boundary } of
  pathLocalOwnershipCases) {
  const pathPlan = planFor(sourcePath, { shell:[sliceId] });
  assertExactTaskKeys(pathPlan, ["build:dist", taskKey], sourcePath);
  const slice = packs.find(({ id }) => id === "shell").verificationSlices.find(
    ({ id }) => id === sliceId);
  assert.deepEqual(slice.sourcePaths, sourcePaths,
    `${sourcePath} and its focused support stay in one exact slice`);
  assert.deepEqual(slice.tasks, [taskKey], `${sourcePath} selects only its own unit task`);
  assert.deepEqual(slice.prerequisites, [], `${sourcePath} adds no arbitrary prerequisite`);
  assert.deepEqual(slice.consumers, [], `${sourcePath} does not widen to another consumer`);
  assert.match(slice.observableBoundary, boundary,
    `${sourcePath} has one stable observable boundary`);
}

const prerequisitePath = "scripts/verification-acceptance-session-prerequisites.mjs";
const prerequisitePlan = planFor(prerequisitePath,
  { verification_process:["execution_checkpoint"] });
assert.equal(prerequisitePlan.tasks.length, 16);
assert.equal(createHash("sha256").update(JSON.stringify(prerequisitePlan.tasks.map(({ key }) => key)))
  .digest("hex"), "0df4443d71cb9a5ec97cde12352becfecf2e6f74a535887ecd9a111889df7f89");

const readinessPath = "scripts/verification-ownership-readiness-test.mjs";
const readinessPlan = planFor(readinessPath,
  { shell:["ownership_readiness_assertion"] });
assertExactTaskKeys(readinessPlan, [
  "build:dist",
  "unit:scripts/verification-ownership-readiness-test.mjs",
  "unit:test/verification-contracts/disposition-history-test.mjs",
], readinessPath);
assert.match(packs.find(({ id }) => id === "shell").verificationSlices.find(
  ({ id }) => id === "ownership_readiness_assertion").observableBoundary,
  /direct ownership-readiness execution/iu);

console.log("exact slice Shell ownership contract tests passed");

const repairContext=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(repairContext?.causalCategory==="other:parent regression task registration") {
  assert.throws(()=>assert.equal(modularKeys.length,17),{code:"ERR_ASSERTION"});
  const retainedDigest=createHash("sha256").update(JSON.stringify(
    modularKeys.filter(key=>key!==parentRegressionKey&&key!==historyRegressionKey))).digest("hex");
  const observed={retainedDigest,addedTaskCount:modularKeys.filter(key=>key===parentRegressionKey).length};
  assert.deepEqual(observed,{retainedDigest:"8f16e008e6c1cf8be61b1a1907095e26c9f40ab79689ad2fb14b46108b938ee4",addedTaskCount:1});
  const fixture={id:"parent-regression-registration-v1",causalCategory:repairContext.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(repairContext.diagnosedBoundary),
    input:{legacyTaskCount:17,addedTaskKey:parentRegressionKey},
    expectedPreRepairFailure:{accepted:false},expectedRepairResult:observed};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:repairContext.incidentId,failureDigest:repairContext.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{accepted:false}},
    repairResult:{status:"passed",fixtureDigest,observed}}}));
}
if(repairContext?.causalCategory==="other:stale exact-slice readiness expectation"){
  let rejected=false;
  try{assertExactTaskKeys(readinessPlan,["build:dist",
    "unit:scripts/verification-ownership-readiness-test.mjs"],readinessPath);}
  catch(error){assert.equal(error.code,"ERR_ASSERTION");rejected=true;}
  assert.equal(rejected,true);
  const actual=readinessPlan.tasks.map(({key})=>key);
  const expected=["build:dist","unit:scripts/verification-ownership-readiness-test.mjs",
    "unit:test/verification-contracts/disposition-history-test.mjs"];
  assert.deepEqual(actual,expected);
  const fixture={id:"readiness-disposition-prerequisite-v1",causalCategory:repairContext.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(repairContext.diagnosedBoundary),
    expectedPreRepairFailure:{rejected:true},expectedRepairResult:{tasks:expected}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:repairContext.incidentId,failureDigest:repairContext.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{rejected}},
    repairResult:{status:"passed",fixtureDigest,observed:{tasks:actual}}}}));
}
