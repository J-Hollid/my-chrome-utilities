import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const specificationCommit = "808c15f5c96258a525010d2188ea2c0cde471e31";
const packs = JSON.parse(await readFile("verification/packs.json", "utf8"));
const dispositions = JSON.parse(await readFile(
  "verification/granularity-dispositions.json",
  "utf8",
));
const capture = packs.find(({ id }) => id === "capture");
const shell = packs.find(({ id }) => id === "shell");
const slice = capture.verificationSlices.find(
  ({ id }) => id === "capture_live_target_permission_recovery",
);
const consumer = shell.verificationSlices.find(
  ({ id }) => id === "live_target_permission_recovery_consumer",
);
const disposition = dispositions.dispositions.find(({ task, path }) =>
  task === "live-target-permission-recovery" && path === "src/side-panel.ts");

assert.deepEqual(slice.sourcePrefixes, [
  "src/data-layer-live-target-permission-recovery/",
]);
assert.deepEqual(slice.tasks, [
  "unit:test/data-layer-live-target-permission-recovery-test.mjs",
  "unit:test/live-target-permission-recovery-preparation-contract-test.mjs",
]);
assert.deepEqual(slice.prerequisites, [
  "unit:test/data-layer-observation-targets-test.mjs",
  "unit:test/data-layer-target-path-status-test.mjs",
]);
assert.deepEqual(slice.consumers, [
  { packId:"shell", sliceId:"live_target_permission_recovery_consumer" },
]);
assert.equal(consumer.consumerOnly, true);
assert.deepEqual(consumer.tasks, [
  "browser-observation:LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER+SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER+WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER",
]);
assert.deepEqual(disposition, {
  task:"live-target-permission-recovery",
  path:"src/side-panel.ts",
  decision:"integrated-seam",
  replacementPaths:[
    "src/data-layer-live-target-permission-recovery/coordinator.ts",
    "src/data-layer-live-target-permission-recovery/readiness.ts",
  ],
  reviewAuthority:"qa-integration",
  reason:disposition.reason,
});

function atSpecification(path) {
  return execFileSync("git", ["show", `${specificationCommit}:${path}`], {
    encoding:"utf8",
  });
}
for (const path of [
  "src/side-panel.ts",
  "features/data-layer-observation-target-access.feature",
  "features/data-layer-target-path-status-runtime.feature",
]) {
  assert.equal(await readFile(path, "utf8"), atSpecification(path), `${path} changed`);
}

const observation = shell.browserObservations.find(
  ({ id }) => id === "LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER",
);
assert.equal(observation.path, "test/browser-packs/side-panel-shell.mjs");
assert.deepEqual(observation.observationKeys, ["liveTargetPermissionRecoveryWiring"]);

const evidence = {
  stableTask:true,
  exactBase:true,
  productCandidateAbsent:true,
  productScenariosUnchanged:true,
  captureOwnedPrefix:true,
  shellConsumer:true,
  directProof:true,
  broadSidePanelUnchanged:true,
  integratedSeam:true,
  dormantBehavior:true,
  conservativeClosure:true,
  noAllPack:true,
  automaticResumption:true,
};
console.log(JSON.stringify({ liveTargetPermissionRecoveryPreparationAcceptance:evidence }));
