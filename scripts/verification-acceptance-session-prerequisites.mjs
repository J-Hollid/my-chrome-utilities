const externalPrerequisitesByPackId = new Map([
  ["shell", ["unit:test/flow-examples-timing-test.mjs"]],
  ["verification_process", [
    "unit:test/flow-examples-timing-test.mjs",
    "unit:test/headless-chrome-lifecycle-test.mjs",
    "unit:test/settled-final-verification-workflow-test.mjs",
    "unit:test/side-panel-single-cutover-preparation-test.mjs",
  ]],
]);

export function registeredAcceptanceSessionExternalPrerequisiteKeys(packId) {
  return [...externalPrerequisitesByPackId.get(packId) ?? []];
}
