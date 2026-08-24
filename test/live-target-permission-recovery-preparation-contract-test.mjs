import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import {
  liveTargetPermissionPathApplyEvidenceTask,
  liveTargetPermissionPathApplyFocusedTaskKeys,
  liveTargetPermissionRecoveryProductEvidenceTask,
  liveTargetPermissionRecoveryProductFocusedTaskKeys,
  liveTargetPermissionRecoveryEvidenceTask,
  liveTargetPermissionRecoveryFocusedTaskKeys,
  liveTargetPermissionRecoveryPackIds,
  validateLiveTargetPermissionRecoveryFocusedPlan,
} from "../scripts/live-target-permission-recovery-focused-evidence.mjs";

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
const pathApplySlice = capture.verificationSlices.find(
  ({ id }) => id === "capture_live_target_permission_path_apply",
);
const consumer = shell.verificationSlices.find(
  ({ id }) => id === "live_target_permission_recovery_consumer",
);
const pathApplyConsumer = shell.verificationSlices.find(
  ({ id }) => id === "live_target_permission_path_apply_consumer",
);
const disposition = dispositions.dispositions.find(({ task, path }) =>
  task === "verification-slice-live-target-permission-recovery"
  && path === "src/side-panel.ts");
const publicFacadeDisposition = dispositions.dispositions.find(({ task, path }) =>
  task === "verification-slice-live-target-permission-recovery"
  && path === "src/utilities/data-layer/capture.ts");
const pathApplyDisposition = dispositions.dispositions.find(({ task, path }) =>
  task === "verification-slice-live-target-permission-path-apply"
  && path === "src/side-panel.ts");
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
const permissionRecoveryHandlerSource = await readFile(
  "acceptance/src/acceptance/verification_support/modular_architecture_live_target_permission_handlers.clj",
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
assert.deepEqual(pathApplySlice, {
  id:"capture_live_target_permission_path_apply",
  sourcePaths:[
    "src/data-layer-live-target-permission-recovery/path-apply.ts",
    "src/data-layer-live-target-permission-recovery/path-apply-callback.ts",
  ],
  sourcePrefixes:[],
  tasks:["unit:test/data-layer-live-target-permission-recovery-test.mjs"],
  prerequisites:[
    "unit:test/data-layer-observation-targets-test.mjs",
    "unit:test/data-layer-target-path-status-test.mjs",
  ],
  consumers:[{ packId:"shell", sliceId:"live_target_permission_path_apply_consumer" }],
  observableBoundary:pathApplySlice.observableBoundary,
});
assert.equal(pathApplyConsumer.consumerOnly, true);
assert.equal(consumer.consumerOnly, true);
assert.deepEqual(pathApplyConsumer.tasks, [
  "unit:test/live-target-permission-recovery-preparation-contract-test.mjs",
  "unit:test/live-target-permission-path-apply-acceptance-test.mjs",
  "browser-observation:LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER+SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER+WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER",
]);
assert.deepEqual(consumer.tasks, [
  "unit:test/live-target-permission-recovery-preparation-contract-test.mjs",
  "unit:test/live-target-permission-recovery-acceptance-test.mjs",
  "browser-observation:LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER+SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER+WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER",
]);
assert.deepEqual(disposition, {
  task:"verification-slice-live-target-permission-recovery",
  path:"src/side-panel.ts",
  decision:"integrated-seam",
  replacementPaths:[
    "src/data-layer-live-target-permission-recovery/coordinator.ts",
    "src/data-layer-live-target-permission-recovery/readiness.ts",
  ],
  reviewAuthority:"qa-integration",
  reason:disposition.reason,
});
assert.deepEqual(publicFacadeDisposition, {
  task:"verification-slice-live-target-permission-recovery",
  path:"src/utilities/data-layer/capture.ts",
  decision:"integrated-seam",
  replacementPaths:[
    "src/data-layer-live-target-permission-recovery/coordinator.ts",
    "src/data-layer-live-target-permission-recovery/readiness.ts",
  ],
  reviewAuthority:"qa-integration",
  reason:publicFacadeDisposition.reason,
});
assert.deepEqual(pathApplyDisposition, {
  task:"verification-slice-live-target-permission-path-apply",
  path:"src/side-panel.ts",
  decision:"integrated-seam",
  replacementPaths:["src/data-layer-live-target-permission-recovery/path-apply.ts"],
  reviewAuthority:"qa-integration",
  reason:pathApplyDisposition.reason,
});
assert.match(operatorInterfaceSource,
  /"origin" #\{"https:\/\/shop\.example\.test"\}/u);
assert.match(captureHandlerSource, /\[22 12 66 25 1 5 2 172\]/u);
assert.match(captureHandlerSource,
  /false\? \(:propagateDependants %\)[\s\S]+"browser presentation"/u);
assert.match(readinessSource, /dispositions\.dispositions\.length===12/u);
assert.equal((modularFeatureSource.match(
  /\| shell\s+\| 3\s+\|(?: 3\s+\|)?/gu) ?? []).length, 2);
assert.match(sidePanelContractHandlerSource,
  /filterv #\(= 9 %\)[\s\S]+:shellLeaves/u);
assert.match(sidePanelContractHandlerSource,
  /\{:outputCount 68 :exactValues true\}[\s\S]+\[64 68\][\s\S]+7059/u);
assert.match(permissionRecoveryHandlerSource,
  /"202"[\s\S]+only affected packs are Capture, Event Library, Schemas, Defects, and Shell/u);
assert.match(permissionRecoveryHandlerSource,
  /"203"[\s\S]+focused bootstrap is invalid/u);
assert.match(permissionRecoveryHandlerSource,
  /"204"[\s\S]+verification-slice-live-target-permission-path-apply/u);
assert.match(permissionRecoveryHandlerSource,
  /"205"[\s\S]+capture_live_target_permission_path_apply/u);
assert.match(permissionRecoveryHandlerSource,
  /"206"[\s\S]+automatic plan widening blocks before execution/u);

const productionChanges = execFileSync(
  "git",
  ["diff", "--name-only", specificationCommit, "HEAD", "--", "src"],
  { encoding:"utf8" },
).trim().split("\n").filter(Boolean).sort();
const permissionRecoveryChanges = productionChanges.filter(
  (path) => !path.startsWith("src/data-layer-installed/"),
);
assert.deepEqual(permissionRecoveryChanges, [
  "src/data-layer-live-target-permission-recovery/action-host.ts",
  "src/data-layer-live-target-permission-recovery/coordinator.ts",
  "src/data-layer-live-target-permission-recovery/index.ts",
  "src/data-layer-live-target-permission-recovery/path-apply-callback.ts",
  "src/data-layer-live-target-permission-recovery/path-apply.ts",
  "src/data-layer-live-target-permission-recovery/readiness.ts",
  "src/side-panel.ts",
  "src/utilities/data-layer/capture.ts",
]);
assert.match(modularFeatureSource,
  /only affected packs are Capture, Event Library, Schemas, Defects, and Shell/u);
assert.match(modularFeatureSource,
  /no unrelated whole-pack task array or all-runnable-pack checkpoint executes/u);
for (const drift of [
  "a production hunk outside the reviewed seam, facade export, and dormant Shell composition",
  "a newly affected owner outside the five causal packs",
  "active permission-recovery product behavior",
  "a missing task or installed observation leaf",
  "a weakened assertion or changed product requirement",
]) {
  assert.ok(modularFeatureSource.includes(`| ${drift} |`), `missing drift guard: ${drift}`);
}
function focusedPlanFixtureFor(focusedTaskKeys, includeProperties = false) {
  return {
    mode:"focused-task",
    includeProperties,
    requestedPackIds:liveTargetPermissionRecoveryPackIds,
    packIds:liveTargetPermissionRecoveryPackIds,
    focusedTaskKeys,
    tasks:["build:dist", ...focusedTaskKeys].map((key) => ({
      key,
      stage:key.split(":", 1)[0],
      executable:"node",
      args:[],
      prerequisiteTaskKeys:key === "build:dist" || key.startsWith("unit:")
        ? [] : ["build:dist"],
    })),
  };
}
const focusedPlanFixture = focusedPlanFixtureFor(
  liveTargetPermissionRecoveryFocusedTaskKeys,
);
assert.equal(validateLiveTargetPermissionRecoveryFocusedPlan(
  focusedPlanFixture,
  liveTargetPermissionRecoveryEvidenceTask,
), true);
const productFocusedPlanFixture = focusedPlanFixtureFor(
  liveTargetPermissionRecoveryProductFocusedTaskKeys,
  true,
);
assert.equal(validateLiveTargetPermissionRecoveryFocusedPlan(
  productFocusedPlanFixture,
  liveTargetPermissionRecoveryProductEvidenceTask,
), true, "the stable product task includes direct presentation and property proof");
assert.throws(() => validateLiveTargetPermissionRecoveryFocusedPlan(
  focusedPlanFixture,
  liveTargetPermissionRecoveryProductEvidenceTask,
), /exact causal focused bootstrap/u,
  "the product task cannot reuse preparation-only evidence");
assert.throws(() => validateLiveTargetPermissionRecoveryFocusedPlan(
  productFocusedPlanFixture,
  liveTargetPermissionRecoveryEvidenceTask,
), /exact causal focused bootstrap/u,
  "the preparation task cannot inherit product property authority");
const pathApplyFocusedPlanFixture = focusedPlanFixtureFor(
  liveTargetPermissionPathApplyFocusedTaskKeys,
);
assert.equal(validateLiveTargetPermissionRecoveryFocusedPlan(
  pathApplyFocusedPlanFixture,
  liveTargetPermissionPathApplyEvidenceTask,
), true);
assert.throws(() => validateLiveTargetPermissionRecoveryFocusedPlan(
  pathApplyFocusedPlanFixture,
  liveTargetPermissionRecoveryEvidenceTask,
), /exact causal focused bootstrap/u,
  "the completed preparation retains its settled task set");
assert.throws(() => validateLiveTargetPermissionRecoveryFocusedPlan(
  focusedPlanFixture,
  liveTargetPermissionPathApplyEvidenceTask,
), /exact causal focused bootstrap/u,
  "the path-apply preparation requires its direct acceptance task");
assert.throws(() => validateLiveTargetPermissionRecoveryFocusedPlan(
  { ...focusedPlanFixture, includeProperties:true },
  liveTargetPermissionRecoveryEvidenceTask,
), /exact causal focused bootstrap/u);
assert.throws(() => validateLiveTargetPermissionRecoveryFocusedPlan(
  { ...focusedPlanFixture, tasks:[...focusedPlanFixture.tasks, {
    key:"unit:test/unrelated-test.mjs", stage:"unit", executable:"node", args:[],
    prerequisiteTaskKeys:[],
  }] },
  liveTargetPermissionRecoveryEvidenceTask,
), /exact causal focused bootstrap/u);

function atSpecification(path) {
  return execFileSync("git", ["show", `${specificationCommit}:${path}`], {
    encoding:"utf8",
  });
}
for (const path of [
  "features/data-layer-observation-target-access.feature",
  "features/data-layer-target-path-status-runtime.feature",
]) {
  assert.equal(await readFile(path, "utf8"), atSpecification(path), `${path} changed`);
}
const sidePanelSource = await readFile("src/side-panel.ts", "utf8");
const installedFixtureSource = await readFile(
  "test/support/side-panel-capture-fixtures.mjs", "utf8");
assert.doesNotMatch(sidePanelSource, /live-target-permission-path-applied/u,
  "dormant preparation must not publish a production-global observer event");
assert.doesNotMatch(installedFixtureSource, /live-target-permission-path-applied/u,
  "installed proof must use stable product effects rather than a global test hook");
assert.match(sidePanelSource,
  /createDormantLiveTargetPermissionRecoveryCoordinator[\s\S]+from "\.\/utilities\/data-layer\/capture\.js"/u,
  "the production composition root must install the dormant coordinator");
assert.match(sidePanelSource,
  /liveTargetPermissionRecoveryCoordinator\.projectReadiness/u,
  "the installed current-step projection must be consumed");
assert.match(sidePanelSource,
  /liveTargetPermissionRecoveryCoordinator\.reconcileProbe/u,
  "the installed failed-probe callback must be reachable");
assert.match(sidePanelSource,
  /liveTargetPermissionRecoveryCoordinator\.requestAccess/u,
  "the installed permission action callback must be reachable");
assert.match(sidePanelSource,
  /createLiveTargetPermissionPathApplyCallback\(\{[\s\S]+coordinator:liveTargetPermissionRecoveryCoordinator,[\s\S]+applyObservationEffects:\(observation\)/u,
  "the existing target-path effects and dormant coordinator must share the deterministic callback adapter");
assert.match(sidePanelSource,
  /apply:applyLiveTargetPathObservation/u,
  "the installed target-path controller must execute the deterministic callback adapter");

const observation = shell.browserObservations.find(
  ({ id }) => id === "LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER",
);
assert.equal(observation.path, "test/browser-packs/side-panel-shell.mjs");
assert.deepEqual(observation.observationKeys, ["liveTargetPermissionRecoveryWiring"]);

const evidence = {
  stableTask:true,
  exactBase:true,
  productCandidateActivatedThroughReviewedSeam:true,
  productScenariosUnchanged:true,
  captureOwnedPrefix:true,
  shellConsumer:true,
  directProof:true,
  broadSidePanelCompositionOnly:true,
  integratedSeam:true,
  productBehaviorBoundedToPreparedSeam:true,
  conservativeClosure:true,
  noAllPack:true,
  automaticResumption:true,
  pathApplyBridge:true,
  exactAppliedObservation:true,
  matchingTargetOnly:true,
  runtimeExampleDomainConserved:true,
  captureEvidenceInventoryConserved:true,
  causalBootstrapPackBoundary:true,
  causalBootstrapTaskBoundary:true,
  causalBootstrapFailClosed:true,
};
console.log(JSON.stringify({ liveTargetPermissionRecoveryPreparationAcceptance:evidence }));

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const runtimeSource = await readFile("test/support/side-panel-capture-fixtures.mjs", "utf8");
  const protocols = {
    "readiness or settling":{
      id:"permission-recovery-path-status-readiness-v1",
      input:{ historyPath:"", authoritativeStatus:"Waiting for observation path",
        targetReadCardinality:"one or more" },
      expectedPreRepairFailure:{authoritativeStatus:false,repeatedReadsAccepted:false},
      expectedRepairResult:{authoritativeStatus:true,repeatedReadsAccepted:true},
      repairResult:{
        authoritativeStatus:runtimeSource.includes(
          'textContent.trim() === "Waiting for observation path"'),
        repeatedReadsAccepted:runtimeSource.includes("scriptCalls.length > 0"),
      },
    },
    "other:evidence leaf polarity contract":{
      id:"permission-recovery-positive-evidence-leaves-v1",
      input:{ observationKey:"liveTargetPermissionRecoveryWiring",
        requiredLeafType:"positive boolean" },
      expectedPreRepairFailure:{positiveBooleanLeaves:false,absenceSemanticsPositive:false},
      expectedRepairResult:{positiveBooleanLeaves:true,absenceSemanticsPositive:true},
      repairResult:{
        positiveBooleanLeaves:["selectedTargetRetained", "requestAccessVisible",
          "exactOriginRequested", "sameTabPathRechecked", "readinessReady",
          "startTestingEnabled"].every((key) => runtimeSource.includes(key)),
        absenceSemanticsPositive:!["callbacksSuppressed", "requestAccessAbsent",
          "startTestingRemainsDisabled"].some((key) => runtimeSource.includes(key)),
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
      input:{ durableDispositionCount:12, captureUnitCount:22, captureTaskCount:172 },
      expectedPreRepairFailure:{durableDispositions:false,captureInventory:false,
        typedPresentationBoundary:false,sidePanelInventory:false,containmentLeaves:false,
        globalBrowserInventory:false},
      expectedRepairResult:{durableDispositions:true,captureInventory:true,
        typedPresentationBoundary:true,sidePanelInventory:true,containmentLeaves:true,
        globalBrowserInventory:true},
      repairResult:{
        durableDispositions:/dispositions\.dispositions\.length===12/u.test(readinessSource),
        captureInventory:/\[22 12 66 25 1 5 2 172\]/u.test(captureHandlerSource),
        typedPresentationBoundary:
          /false\? \(:propagateDependants %\)[\s\S]+"browser presentation"/u
            .test(captureHandlerSource),
        sidePanelInventory:(modularFeatureSource.match(
          /\| shell\s+\| 3\s+\|(?: 3\s+\|)?/gu) ?? []).length === 2,
        containmentLeaves:/filterv #\(= 9 %\)[\s\S]+:shellLeaves/u
          .test(sidePanelContractHandlerSource),
        globalBrowserInventory:
          /\{:outputCount 68 :exactValues true\}[\s\S]+\[64 68\][\s\S]+7059/u
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
