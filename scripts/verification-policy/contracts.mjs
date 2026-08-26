const contract = (id, testName, { sourcePaths = [], sourcePrefixes = [] } = {}) =>
  Object.freeze({
    id,
    testPath:`test/verification-contracts/${testName}-contract-test.mjs`,
    sourcePaths:Object.freeze([...sourcePaths]),
    sourcePrefixes:Object.freeze([...sourcePrefixes]),
  });

export const verificationPolicyContracts = Object.freeze([
  contract("registry_inventory", "registry-inventory", {
    sourcePrefixes:["scripts/verification-registry/", "verification/manifests/"],
  }),
  contract("ownership_impact", "ownership-impact", {
    sourcePrefixes:["scripts/verification-planner/ownership/"],
  }),
  contract("dependency_expansion", "dependency-expansion", {
    sourcePrefixes:["scripts/verification-planner/dependencies/"],
  }),
  contract("task_batching", "task-batching", {
    sourcePaths:["scripts/verification-policy/contracts.mjs"],
    sourcePrefixes:["scripts/verification-planner/tasks/"],
  }),
  contract("historical_planning", "historical-planning", {
    sourcePrefixes:["scripts/verification-planner/history/"],
  }),
  contract("execution_checkpoint", "execution-checkpoint", {
    sourcePaths:["scripts/dist-artifact-lock.mjs", "scripts/dist-artifact.mjs",
      "scripts/run-focused-acceptance.mjs", "scripts/verification-checkpoint-attempt.mjs",
      "scripts/verification-execution-prerequisites.mjs"],
    sourcePrefixes:["scripts/verification-execution/"],
  }),
  contract("reliability_run_intent", "reliability-run-intent", {
    sourcePrefixes:["scripts/verification-policy/reliability/"],
  }),
  contract("evidence_promotion", "evidence-promotion", {
    sourcePrefixes:["scripts/verification-evidence/"],
  }),
  contract("timing_performance", "timing-performance", {
    sourcePrefixes:["scripts/verification-performance/"],
  }),
]);

export function verificationPolicyContractForPath(candidatePath) {
  return verificationPolicyContracts.find(({ sourcePaths, sourcePrefixes }) =>
    sourcePaths.includes(candidatePath) ||
    sourcePrefixes.some((prefix) => candidatePath.startsWith(prefix))) ?? null;
}

export const verificationProcessCompatibilitySuccessors = Object.freeze([
  ...verificationPolicyContracts.map(({ testPath }) => testPath),
  "test/verification-process-contract-legacy.mjs",
]);
