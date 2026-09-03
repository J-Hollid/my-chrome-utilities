import assert from "node:assert/strict";

import { planVerification } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";

const phaseTwoShellPaths = [
  "acceptance/src/acceptance/steps/modular_architecture.clj",
  "acceptance/src/acceptance/verification_support/modular_architecture_task_checkpoint_repair_handlers.clj",
  "acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj",
  "scripts/verification-acceptance-session-prerequisites.mjs",
  "scripts/verification-ownership-readiness-test.mjs",
];

const packs = await loadVerificationPacks();
const plan = planVerification(packs, {
  changedPaths:phaseTwoShellPaths,
});

assert.deepEqual(plan.parentPackSliceFallbacks, [],
  "the five Phase 2 paths do not require the Shell parent fallback");
assert.deepEqual(plan.verificationSliceDiagnostics, [],
  "each Phase 2 path has an exact child-slice owner");
assert.deepEqual(plan.selectedVerificationSlices.shell,
  ["verification_pack_cardinality_contract"],
  "the five paths select only the existing Shell cardinality child slice");
assert.deepEqual(plan.selectedVerificationSlices.verification_process,
  ["task_batching"],
  "the existing consumer stays on the exact verification-process task-batching slice");

const expectedShellTasks = new Set([
  "unit:scripts/verification-pack-cardinality/acceptance.mjs",
  "unit:test/verification-pack-cardinality-contract-test.mjs",
  "unit:test/settled-final-verification-workflow-test.mjs",
  "unit:test/verification-evidence-production-path-test.mjs",
]);
assert.deepEqual(new Set(plan.tasks.filter(({ packId }) => packId === "shell")
  .map(({ key }) => key)), expectedShellTasks,
"the child ownership does not select an unrelated Shell task");

console.log("exact slice Shell ownership contract tests passed");
