const contract = (id, testName, { testNames = [testName], sourcePaths = [], sourcePrefixes = [] } = {}) =>
  Object.freeze({
    id,
    testPath:`test/verification-contracts/${testName}-contract-test.mjs`,
    testPaths:Object.freeze(testNames.map((name)=>
      `test/verification-contracts/${name}-contract-test.mjs`)),
    sourcePaths:Object.freeze([...sourcePaths]),
    sourcePrefixes:Object.freeze([...sourcePrefixes]),
  });

export const verificationPolicyContracts = Object.freeze([
  contract("registry_inventory", "registry-inventory", {
    testNames:["registry-core","registry-project-management","registry-durable-repository",
      "registry-browser-routing","registry-reachability","registry-style-boundary",
      "registry-editor-assets"],
    sourcePrefixes:["scripts/verification-registry/", "verification/manifests/"],
  }),
  contract("ownership_impact", "ownership-impact", {
    testNames:["ownership-core","ownership-event-library","ownership-capture","ownership-schemas",
      "ownership-shell","ownership-priority"],
    sourcePrefixes:["scripts/verification-planner/ownership/"],
  }),
  contract("dependency_expansion", "dependency-expansion", {
    sourcePrefixes:["scripts/verification-planner/dependencies/"],
  }),
  contract("task_batching", "task-batching", {
    sourcePaths:["scripts/verification-policy/contracts.mjs",
      "scripts/verification-policy/process-contract-compatibility.mjs"],
    sourcePrefixes:["scripts/verification-planner/tasks/"],
  }),
  contract("historical_planning", "historical-planning", {
    sourcePrefixes:["scripts/verification-planner/history/"],
  }),
  contract("execution_checkpoint", "execution-checkpoint", {
    testNames:["execution-prerequisite","execution-attempt-store","execution-cli-contention",
      "execution-coordinator","execution-resume","execution-runner-integration","execution-binding"],
    sourcePaths:["scripts/dist-artifact-lock.mjs", "scripts/dist-artifact.mjs",
      "scripts/run-focused-acceptance.mjs", "scripts/verification-checkpoint-attempt.mjs",
      "scripts/verification-execution-prerequisites.mjs"],
    sourcePrefixes:["scripts/verification-execution/"],
  }),
  contract("reliability_run_intent", "reliability-run-intent", {
    testNames:["reliability-prerequisite","reliability-terminal-policy","reliability-artifact-lock",
      "reliability-observation","reliability-incident-store","reliability-planner",
      "reliability-project","reliability-durable-event","reliability-capture-schema",
      "reliability-shell-bootstrap","reliability-admission","reliability-calibration",
      "reliability-regression-routing","reliability-blocked-aggregate","reliability-succession"],
    sourcePrefixes:["scripts/verification-policy/reliability/"],
  }),
  contract("evidence_promotion", "evidence-promotion", {
    testNames:["evidence-promotion-blocked-aggregate","evidence-promotion-conservation",
      "evidence-promotion-receipt"],
    sourcePrefixes:["scripts/verification-evidence/"],
  }),
  contract("timing_performance", "timing-performance", {
    testNames:["timing-ledger","timing-budget","timing-calibration","timing-scorecard"],
    sourcePrefixes:["scripts/verification-performance/"],
  }),
]);

export function verificationPolicyContractForPath(candidatePath) {
  return verificationPolicyContracts.find(({ sourcePaths, sourcePrefixes }) =>
    sourcePaths.includes(candidatePath) ||
    sourcePrefixes.some((prefix) => candidatePath.startsWith(prefix))) ?? null;
}

export const verificationProcessCompatibilitySuccessors = Object.freeze(
  verificationPolicyContracts.flatMap(({ testPaths }) => testPaths));
