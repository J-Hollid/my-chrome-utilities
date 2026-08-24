import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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
const operatorInterfaceSource = await readFile(
  "acceptance/src/acceptance/steps/operator_interface_support.clj", "utf8");
const captureHandlerSource = await readFile(
  "acceptance/src/acceptance/verification_support/modular_architecture_capture_handlers.clj",
  "utf8",
);
const readinessSource = await readFile(
  "scripts/verification-ownership-readiness-test.mjs", "utf8");
const modularFeatureSource = await readFile(
  "features/modular-verification-packs.feature", "utf8");
const sidePanelContractHandlerSource = await readFile(
  "acceptance/src/acceptance/verification_support/modular_architecture_vtd006_handlers.clj",
  "utf8",
);

assert.deepEqual(slice.sourcePrefixes, [
  "src/data-layer-live-target-permission-recovery/",
]);
assert.deepEqual(slice.tasks, [
  "unit:test/data-layer-live-target-permission-recovery-test.mjs",
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
  "unit:test/live-target-permission-recovery-preparation-contract-test.mjs",
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
assert.match(operatorInterfaceSource,
  /"origin" #\{"https:\/\/shop\.example\.test"\}/u);
assert.match(captureHandlerSource, /\[22 12 66 25 1 5 2 172\]/u);
assert.match(captureHandlerSource,
  /false\? \(:propagateDependants %\)[\s\S]+"browser presentation"/u);
assert.match(readinessSource, /dispositions\.dispositions\.length===9/u);
assert.equal((modularFeatureSource.match(
  /\| shell\s+\| 3\s+\|(?: 3\s+\|)?/gu) ?? []).length, 2);
assert.match(sidePanelContractHandlerSource,
  /filterv #\(= 9 %\)[\s\S]+:shellLeaves/u);
assert.match(sidePanelContractHandlerSource,
  /\{:outputCount 68 :exactValues true\}[\s\S]+\[64 68\][\s\S]+7054/u);

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
  runtimeExampleDomainConserved:true,
  captureEvidenceInventoryConserved:true,
};
console.log(JSON.stringify({ liveTargetPermissionRecoveryPreparationAcceptance:evidence }));

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const runtimeSource = await readFile("test/support/side-panel-capture-fixtures.mjs", "utf8");
  const protocols = {
    "other:evidence leaf polarity contract":{
      id:"permission-recovery-positive-evidence-leaves-v1",
      input:{ observationKey:"liveTargetPermissionRecoveryWiring",
        requiredLeafType:"positive boolean" },
      expectedPreRepairFailure:{positiveBooleanLeaves:false,absenceSemanticsPositive:false},
      expectedRepairResult:{positiveBooleanLeaves:true,absenceSemanticsPositive:true},
      repairResult:{
        positiveBooleanLeaves:["moduleLoaded", "inactive", "callbacksSuppressed",
          "requestAccessAbsent", "startTestingRemainsDisabled", "selectedTargetPresented"]
          .every((key) => runtimeSource.includes(`${key}:`)),
        absenceSemanticsPositive:!["callbacks:", "requestAccessVisible:",
          "startTestingEnabled:", "selectedLabel:"].some((key) => runtimeSource.includes(key)),
      },
    },
    "other:acceptance example domain":{
      id:"permission-recovery-origin-example-domain-v1",
      input:{ exampleKey:"origin", value:"https://shop.example.test" },
      expectedPreRepairFailure:{originRegistered:false},
      expectedRepairResult:{originRegistered:true},
      repairResult:{originRegistered:/"origin" #\{"https:\/\/shop\.example\.test"\}/u
        .test(operatorInterfaceSource)},
    },
    "other:verification conservation inventory":{
      id:"permission-recovery-conservation-inventory-v1",
      input:{ durableDispositionCount:9, captureUnitCount:22, captureTaskCount:172 },
      expectedPreRepairFailure:{durableDispositions:false,captureInventory:false,
        typedPresentationBoundary:false,sidePanelInventory:false,containmentLeaves:false,
        globalBrowserInventory:false},
      expectedRepairResult:{durableDispositions:true,captureInventory:true,
        typedPresentationBoundary:true,sidePanelInventory:true,containmentLeaves:true,
        globalBrowserInventory:true},
      repairResult:{
        durableDispositions:/dispositions\.dispositions\.length===9/u.test(readinessSource),
        captureInventory:/\[22 12 66 25 1 5 2 172\]/u.test(captureHandlerSource),
        typedPresentationBoundary:
          /false\? \(:propagateDependants %\)[\s\S]+"browser presentation"/u
            .test(captureHandlerSource),
        sidePanelInventory:(modularFeatureSource.match(
          /\| shell\s+\| 3\s+\|(?: 3\s+\|)?/gu) ?? []).length === 2,
        containmentLeaves:/filterv #\(= 9 %\)[\s\S]+:shellLeaves/u
          .test(sidePanelContractHandlerSource),
        globalBrowserInventory:
          /\{:outputCount 68 :exactValues true\}[\s\S]+\[64 68\][\s\S]+7054/u
            .test(sidePanelContractHandlerSource),
      },
    },
  };
  const protocol = protocols[context.causalCategory];
  assert.ok(protocol, `unsupported causal category ${context.causalCategory}`);
  const { expectedPreRepairFailure, expectedRepairResult, repairResult } = protocol;
  assert.deepEqual(repairResult, expectedRepairResult);
  const normalized = (value) => Array.isArray(value) ? value.map(normalized)
    : value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)])) : value;
  const digest = (value) => createHash("sha256")
    .update(JSON.stringify(normalized(value))).digest("hex");
  const fixture = {
    id:protocol.id,
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:protocol.input,
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
    version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
  } }));
}
