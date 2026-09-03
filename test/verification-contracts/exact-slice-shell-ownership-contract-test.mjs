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
}

assertCausalPath(
  "acceptance/src/acceptance/steps/modular_architecture.clj",
  { shell:["verification_pack_cardinality_contract"], verification_process:["task_batching"] },
  18, "b9cd0125491104dea7eb8ebbfd008a01b37024e2be98498a22f53e5baac1dd57",
);

assertCausalPath(
  "acceptance/src/acceptance/verification_support/" +
    "modular_architecture_task_checkpoint_repair_handlers.clj",
  { shell:["eligible_repair_admission"], verification_process:["reliability_run_intent"] },
  27, "c9c2a869dec4710993defbe06843f1c235ec60133cfa18ca39efba5115e13bf6",
);

assertCausalPath(
  "acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj",
  { verification_process:["evidence_administration_preflight"] },
  14, "58b4fcc3fc0ff5d59c686f3cab6c469e434defd6c236dbd31cd1e78ef53557b0",
);

assertCausalPath(
  "scripts/verification-acceptance-session-prerequisites.mjs",
  { verification_process:["execution_checkpoint"] },
  17, "3d519930ffe82d43a79e33dd919949603be18a27d4a3814acc46799cef509ad8",
);

assertCausalPath(
  "scripts/verification-ownership-readiness-test.mjs",
  { shell:["verification_pack_cardinality_contract"], verification_process:["task_batching"] },
  18, "b9cd0125491104dea7eb8ebbfd008a01b37024e2be98498a22f53e5baac1dd57",
);

console.log("exact slice Shell ownership contract tests passed");
