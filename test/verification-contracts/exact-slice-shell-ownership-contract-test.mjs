import assert from "node:assert/strict";
import { createHash } from "node:crypto";

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
assert.equal(modularPlan.tasks.length, 18);
assert.equal(createHash("sha256").update(JSON.stringify(modularPlan.tasks.map(({ key }) => key)))
  .digest("hex"), "b9cd0125491104dea7eb8ebbfd008a01b37024e2be98498a22f53e5baac1dd57");

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

const prerequisitePath = "scripts/verification-acceptance-session-prerequisites.mjs";
const prerequisitePlan = planFor(prerequisitePath,
  { verification_process:["execution_checkpoint"] });
assert.equal(prerequisitePlan.tasks.length, 17);
assert.equal(createHash("sha256").update(JSON.stringify(prerequisitePlan.tasks.map(({ key }) => key)))
  .digest("hex"), "3d519930ffe82d43a79e33dd919949603be18a27d4a3814acc46799cef509ad8");

const readinessPath = "scripts/verification-ownership-readiness-test.mjs";
const readinessPlan = planFor(readinessPath,
  { shell:["ownership_readiness_assertion"] });
assertExactTaskKeys(readinessPlan, [
  "build:dist",
  "unit:scripts/verification-ownership-readiness-test.mjs",
], readinessPath);
assert.match(packs.find(({ id }) => id === "shell").verificationSlices.find(
  ({ id }) => id === "ownership_readiness_assertion").observableBoundary,
  /direct ownership-readiness execution/iu);

console.log("exact slice Shell ownership contract tests passed");
