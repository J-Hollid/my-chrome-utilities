const externalPrerequisitesByPackId = new Map([
  ["project_event_transport", [
    "unit:test/project-observation-sources/page-hook-test.mjs",
    "unit:test/project-observation-sources/coordinator-test.mjs",
    "unit:test/project-observation-sources/activation-order-test.mjs",
    "unit:test/project-observation-sources/subscription-test.mjs",
    "unit:test/project-observation-sources/refresh-order-test.mjs",
    "unit:test/project-observation-sources/project-switch-test.mjs",
    "unit:test/project-observation-sources/feed-test.mjs",
    "unit:test/project-observation-sources/saved-evidence-test.mjs",
  ]],
  ["shell", ["unit:test/flow-examples-timing-test.mjs", "browser:test/twatility-projects-browser-test.mjs"]],
  ["verification_process", [
    "unit:test/flow-examples-timing-test.mjs",
    "unit:test/headless-chrome-lifecycle-test.mjs",
    "unit:test/settled-final-verification-workflow-test.mjs",
    "unit:test/side-panel-single-cutover-preparation-test.mjs",
    "unit:test/verification-contracts/execution-attempt-store-contract-test.mjs",
    "unit:test/verification-contracts/execution-runner-integration-contract-test.mjs",
    "unit:test/verification-contracts/reliability-admission-contract-test.mjs",
    "unit:test/verification-contracts/reliability-incident-store-contract-test.mjs",
  ]],
]);

export function registeredAcceptanceSessionExternalPrerequisiteKeys(packId) {
  return [...externalPrerequisitesByPackId.get(packId) ?? []];
}
