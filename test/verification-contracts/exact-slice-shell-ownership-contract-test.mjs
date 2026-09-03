import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { planVerification } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";

const packs = await loadVerificationPacks();

function taskKeyDigest(plan) {
  return createHash("sha256").update(JSON.stringify(plan.tasks.map(({ key }) => key))).digest("hex");
}

function assertCausalPath(path, expectedSlices, expectedTaskCount, expectedTaskKeyDigest) {
  const plan = planVerification(packs, { changedPaths:[path] });
  assert.deepEqual(plan.parentPackSliceFallbacks, [], `${path} has no parent-pack fallback`);
  assert.deepEqual(plan.verificationSliceDiagnostics, [], `${path} has one valid causal slice`);
  assert.deepEqual(plan.selectedVerificationSlices, expectedSlices,
    `${path} selects its exact causal slice and consumers`);
  assert.equal(plan.tasks.length, expectedTaskCount, `${path} keeps its exact causal task count`);
  assert.equal(taskKeyDigest(plan), expectedTaskKeyDigest,
    `${path} keeps its exact ordered causal task set`);
  return plan;
}

assertCausalPath(
  "acceptance/src/acceptance/steps/modular_architecture.clj",
  { shell:["verification_pack_cardinality_contract"], verification_process:["task_batching"] },
  19, "0d5960384836ce811f872f23ebb2d50da6632781ae19075390b3c0ed9aeea204",
);

const checkpointRepairPlan = assertCausalPath(
  "acceptance/src/acceptance/verification_support/" +
    "modular_architecture_task_checkpoint_repair_handlers.clj",
  { shell:["eligible_repair_admission"], verification_process:["reliability_run_intent"] },
  31, "06b5dbe8b5ed0519c09355f490b6cc6b25f424d66c4d943f05a8eff84011fbac",
);
for (const key of [
  "unit:test/verification-contracts/execution-binding-contract-test.mjs",
  "unit:test/verification-contracts/reliability-regression-routing-contract-test.mjs",
]) assert.ok(checkpointRepairPlan.tasks.some((task) => task.key === key),
  `the task-checkpoint repair path selects ${key}`);
assert.match(checkpointRepairPlan.tasks.find(({ key }) =>
  key === "acceptance-session:verification_process").target,
  /features\/modular-verification-packs\.feature/u);
assert.match(packs.find(({ id }) => id === "shell").verificationSlices.find(
  ({ id }) => id === "eligible_repair_admission").observableBoundary,
  /task-checkpoint prepared evidence/u);

const throughputPlan = assertCausalPath(
  "acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj",
  { verification_process:["evidence_administration_preflight"] },
  22, "fc8b2ab1dc7d09cdd5737a99653bab7aa883884b52a7d4f3ae7efcf67f7f4675",
);
for (const key of [
  "unit:test/verification-contracts/reliability-calibration-contract-test.mjs",
  "unit:test/verification-contracts/ownership-event-library-contract-test.mjs",
  "unit:test/verification-contracts/ownership-capture-contract-test.mjs",
  "unit:test/verification-contracts/ownership-schemas-contract-test.mjs",
  "unit:test/verification-contracts/evidence-promotion-conservation-contract-test.mjs",
  "unit:test/verification-contracts/ownership-priority-contract-test.mjs",
  "acceptance-parse:features/modular-verification-packs.feature",
  "acceptance-generate:features/modular-verification-packs.feature",
]) assert.ok(throughputPlan.tasks.some((task) => task.key === key),
  `the modular throughput path selects ${key}`);
assert.match(throughputPlan.tasks.find(({ key }) =>
  key === "acceptance-session:verification_process").target,
  /features\/modular-verification-packs\.feature/u);
assert.match(packs.find(({ id }) => id === "verification_process").verificationSlices.find(
  ({ id }) => id === "evidence_administration_preflight").observableBoundary,
  /modular throughput prepared evidence/u);

assertCausalPath(
  "scripts/verification-acceptance-session-prerequisites.mjs",
  { verification_process:["execution_checkpoint"] },
  17, "3d519930ffe82d43a79e33dd919949603be18a27d4a3814acc46799cef509ad8",
);

const ownershipReadinessPlan = assertCausalPath(
  "scripts/verification-ownership-readiness-test.mjs",
  { shell:["verification_pack_cardinality_contract"], verification_process:["task_batching"] },
  19, "0d5960384836ce811f872f23ebb2d50da6632781ae19075390b3c0ed9aeea204",
);
assert.ok(ownershipReadinessPlan.tasks.some(({ key }) =>
  key === "unit:test/verification-contracts/reliability-prerequisite-contract-test.mjs"),
"the ownership-readiness assertion selects its direct importing contract");
assert.match(packs.find(({ id }) => id === "shell").verificationSlices.find(
  ({ id }) => id === "verification_pack_cardinality_contract").observableBoundary,
  /ownership-readiness assertion/u);

console.log("exact slice Shell ownership contract tests passed");
