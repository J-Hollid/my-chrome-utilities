import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  createDormantLiveTargetPermissionRecoveryCoordinator,
  createLiveTargetPermissionRecoveryCoordinator,
  createLiveTargetPermissionPathApplyCallback,
  createLiveTargetPermissionPathApplyBridge,
  liveTargetPermissionRecoveryReadiness,
} from "../dist/data-layer-live-target-permission-recovery/index.js";

const selected = {
  id:"tab:42:window:7",
  tabId:42,
  windowId:7,
  pageUrl:"https://shop.example.test/checkout",
  title:"Checkout",
  origin:"https://shop.example.test",
  accessState:"Ready",
};

assert.deepEqual(liveTargetPermissionRecoveryReadiness({
  selectedTarget:{ ...selected, accessState:"Permission required" },
  pathStatus:"Permission required",
}), {
  targetSelected:true,
  ready:false,
  currentStep:"readiness",
  requestAccessVisible:true,
});
assert.deepEqual(liveTargetPermissionRecoveryReadiness({
  selectedTarget:selected,
  pathStatus:"Waiting for path",
}), {
  targetSelected:true,
  ready:false,
  currentStep:"readiness",
  requestAccessVisible:false,
});
assert.deepEqual(liveTargetPermissionRecoveryReadiness({
  selectedTarget:selected,
  pathStatus:"Ready",
}), {
  targetSelected:true,
  ready:true,
  currentStep:"session",
  requestAccessVisible:false,
});
assert.deepEqual(liveTargetPermissionRecoveryReadiness({
  pathStatus:"Selection required",
}), {
  targetSelected:false,
  ready:false,
  currentStep:"target",
  requestAccessVisible:false,
});

const calls = [];
let currentAction;
const coordinator = createLiveTargetPermissionRecoveryCoordinator({
  requestOriginAccess:async (...args) => { calls.push(["request", ...args]); return true; },
  recheckPath:async (...args) => {
    calls.push(["recheck", ...args]);
    return {
      tabId:42,
      pageUrl:selected.pageUrl,
      historyPath:"event.history",
      pageAccessStatus:"page access available",
      pageObject:{ event:{ history:[] } },
    };
  },
  updateTargetAccess:(...args) => calls.push(["update", ...args]),
  actionHost:{
    show:(_target, action) => { currentAction = action; calls.push(["show"]); },
    hide:() => { currentAction = undefined; calls.push(["hide"]); },
  },
});
assert.deepEqual(coordinator.projectReadiness({
  selectedTarget:selected,
  pathStatus:"Waiting for path",
}), {
  targetSelected:true,
  ready:false,
  currentStep:"readiness",
  requestAccessVisible:false,
});
assert.deepEqual(await coordinator.reconcileProbe({
  selectedTarget:selected,
  historyPath:"event.history",
  pageAccessStatus:"page access unavailable",
}), {
  status:"recovery-required",
  selectedTarget:selected,
  pathStatus:"Permission required",
});
assert.deepEqual(calls, [
  ["update", selected.id, "Permission required"],
  ["show"],
]);
assert.equal(typeof currentAction, "function", "the current step exposes recovery");

await currentAction();
assert.deepEqual(calls, [
  ["update", selected.id, "Permission required"],
  ["show"],
  ["request", selected.origin],
  ["recheck", selected, "event.history"],
  ["hide"],
  ["update", selected.id, "Ready"],
]);
assert.deepEqual(coordinator.projectReadiness({
  selectedTarget:selected,
  pathStatus:"Selection required",
}), {
  targetSelected:true,
  ready:true,
  currentStep:"session",
  requestAccessVisible:false,
});

const activeCalls = [];
const activeCoordinator = createDormantLiveTargetPermissionRecoveryCoordinator({
  requestOriginAccess:async (...args) => { activeCalls.push(["request", ...args]); return true; },
  recheckPath:async (...args) => { activeCalls.push(["recheck", ...args]); },
  updateTargetAccess:(...args) => activeCalls.push(["update", ...args]),
  actionHost:{
    show:() => activeCalls.push(["show"]),
    hide:() => activeCalls.push(["hide"]),
  },
});
assert.deepEqual(await activeCoordinator.reconcileProbe({
  selectedTarget:selected,
  historyPath:"event.history",
  pageAccessStatus:"page access available",
}), { status:"inactive", selectedTarget:selected });
activeCoordinator.projectReadiness({
  selectedTarget:selected,
  pathStatus:"Permission required",
});
await Promise.resolve();
assert.deepEqual(activeCalls, [["hide"]], "valid active-tab access never prompts or rechecks");

const settledCalls = [];
let settledPathStatus = "Permission required";
const settledCoordinator = createDormantLiveTargetPermissionRecoveryCoordinator({
  requestOriginAccess:async () => true,
  recheckPath:async () => undefined,
  updateTargetAccess:(...args) => settledCalls.push(["update", ...args]),
  actionHost:{
    show:() => settledCalls.push(["show"]),
    hide:() => settledCalls.push(["hide"]),
    historyPath:() => "event.history",
    pathStatus:() => settledPathStatus,
  },
});
settledCoordinator.projectReadiness({ selectedTarget:selected, pathStatus:"Permission required" });
settledPathStatus = "Ready";
await new Promise((resolve) => setTimeout(resolve, 175));
assert.deepEqual(settledCalls, [], "a transient permission status settles before recovery activates");

const slowSuccessfulProbeCalls = [];
const slowSuccessfulProbeCoordinator = createDormantLiveTargetPermissionRecoveryCoordinator({
  requestOriginAccess:async () => true,
  recheckPath:async () => undefined,
  updateTargetAccess:(...args) => slowSuccessfulProbeCalls.push(["update", ...args]),
  actionHost:{
    show:() => slowSuccessfulProbeCalls.push(["show"]),
    hide:() => slowSuccessfulProbeCalls.push(["hide"]),
    historyPath:() => "event.history",
    pathStatus:() => "Permission required",
  },
});
slowSuccessfulProbeCoordinator.projectReadiness({
  selectedTarget:selected,
  pathStatus:"Permission required",
});
await new Promise((resolve) => setTimeout(resolve, 175));
await slowSuccessfulProbeCoordinator.reconcileProbe({
  selectedTarget:selected,
  historyPath:"event.history",
  pageAccessStatus:"page access available",
});
assert.deepEqual(slowSuccessfulProbeCalls, [
  ["hide"],
], "a slow successful exact probe cannot transiently activate recovery");
const slowSuccessfulReadiness = slowSuccessfulProbeCoordinator.projectReadiness({
  selectedTarget:selected,
  pathStatus:"Ready",
});
assert.deepEqual(slowSuccessfulReadiness, {
  targetSelected:true,
  ready:true,
  currentStep:"session",
  requestAccessVisible:false,
}, "the slow successful probe leaves the selected target ready");

const failedProbeCalls = [];
const failedProbeCoordinator = createDormantLiveTargetPermissionRecoveryCoordinator({
  requestOriginAccess:async () => true,
  recheckPath:async () => undefined,
  updateTargetAccess:(...args) => failedProbeCalls.push(["update", ...args]),
  actionHost:{
    show:() => failedProbeCalls.push(["show"]),
    hide:() => failedProbeCalls.push(["hide"]),
    historyPath:() => "event.history",
    pathStatus:() => "Permission required",
  },
});
failedProbeCoordinator.projectReadiness({ selectedTarget:selected, pathStatus:"Permission required" });
await new Promise((resolve) => setTimeout(resolve, 175));
assert.deepEqual(failedProbeCalls, [], "rendered status alone cannot activate recovery");
await failedProbeCoordinator.reconcileProbe({
  selectedTarget:selected,
  historyPath:"event.history",
  pageAccessStatus:"page access unavailable",
});
assert.deepEqual(failedProbeCalls, [
  ["update", selected.id, "Permission required"],
  ["show"],
], "a settled failed probe exposes recovery for the retained selected target");
failedProbeCoordinator.projectReadiness({
  selectedTarget:{ ...selected, id:"tab:84:window:7", tabId:84 },
  pathStatus:"Waiting for path",
});
assert.deepEqual(failedProbeCalls, [
  ["update", selected.id, "Permission required"],
  ["show"],
  ["hide"],
], "changing the exact target cancels its active recovery");

const declinedCalls = [];
const declinedCoordinator = createDormantLiveTargetPermissionRecoveryCoordinator({
  requestOriginAccess:async (origin) => { declinedCalls.push(["request", origin]); return false; },
  recheckPath:async (...args) => { declinedCalls.push(["recheck", ...args]); },
  updateTargetAccess:(...args) => declinedCalls.push(["update", ...args]),
  actionHost:{
    show:(target) => declinedCalls.push(["show", target.id]),
    hide:() => declinedCalls.push(["hide"]),
  },
});
assert.deepEqual(await declinedCoordinator.requestAccess({
  selectedTarget:selected,
  historyPath:"event.history",
}), {
  status:"access-declined",
  selectedTarget:selected,
  pathStatus:"Permission required",
});
assert.deepEqual(declinedCalls, [
  ["request", selected.origin],
  ["update", selected.id, "Permission required"],
  ["show", selected.id],
], "declining keeps the selected target and recovery action without probing");

const attached = { ...selected, id:"attached:42", title:"Attached checkout" };
const fallback = { ...selected, id:"selected:42", title:"Selected checkout" };
let attachedTarget = attached;
const bridged = [];
let readinessRenders = 0;
let reconciliationResult = { status:"inactive", selectedTarget:attached };
const pathApplyBridge = createLiveTargetPermissionPathApplyBridge({
  attachedTarget:() => attachedTarget,
  selectedTarget:() => fallback,
  reconcileProbe:async (request) => {
    bridged.push(request);
    return reconciliationResult;
  },
  renderReadiness:() => { readinessRenders += 1; },
});
const appliedObservation = {
  tabId:42,
  pageUrl:selected.pageUrl,
  historyPath:"event.history",
  pageAccessStatus:"page access available",
  pageObject:{ event:{ history:[] } },
};
assert.equal(await pathApplyBridge.apply(appliedObservation), reconciliationResult);
assert.deepEqual(bridged, [{
  selectedTarget:attached,
  historyPath:"event.history",
  pageAccessStatus:"page access available",
}], "the applied observation reaches the dormant seam with exact causal identity");
assert.equal(readinessRenders, 0, "inactive preparation never requests a readiness render");

await pathApplyBridge.apply({ ...appliedObservation, tabId:84 });
assert.equal(bridged.length, 1, "an observation for another tab is excluded");

attachedTarget = undefined;
reconciliationResult = {
  status:"recovery-required",
  selectedTarget:fallback,
  pathStatus:"Permission required",
};
assert.equal(await pathApplyBridge.apply({
  ...appliedObservation,
  pageAccessStatus:"page access unavailable",
}), reconciliationResult);
assert.deepEqual(bridged.at(-1), {
  selectedTarget:fallback,
  historyPath:"event.history",
  pageAccessStatus:"page access unavailable",
}, "the matching selected target is the fallback when no target is attached");
assert.equal(readinessRenders, 1, "only a relevant seam transition requests readiness rendering");

const installedRecoveryCalls = [];
const installedRecoveryCoordinator = createDormantLiveTargetPermissionRecoveryCoordinator({
  requestOriginAccess:async () => false,
  recheckPath:async () => undefined,
  updateTargetAccess:(...args) => installedRecoveryCalls.push(["update", ...args]),
  actionHost:{
    show:() => installedRecoveryCalls.push(["show"]),
    hide:() => installedRecoveryCalls.push(["hide"]),
  },
  pathApply:{
    attachedTarget:() => selected,
    selectedTarget:() => selected,
    renderReadiness:() => installedRecoveryCalls.push(["render"]),
  },
});
assert.deepEqual(await installedRecoveryCoordinator.applyProbeObservation({
  ...appliedObservation,
  pageAccessStatus:"page access unavailable",
}), {
  status:"recovery-required",
  selectedTarget:selected,
  pathStatus:"Permission required",
});
assert.deepEqual(installedRecoveryCalls, [
  ["update", selected.id, "Permission required"],
  ["show"],
  ["render"],
  ["show"],
], "the current-step permission action is restored after the installed readiness render");

const callbackCalls = [];
const pathApplyCallback = createLiveTargetPermissionPathApplyCallback({
  applyObservationEffects:(observation) => callbackCalls.push(["effects", observation]),
  coordinator:{
    applyProbeObservation:async (observation) => {
      callbackCalls.push(["permission", observation]);
      return undefined;
    },
  },
});
pathApplyCallback(appliedObservation);
await Promise.resolve();
assert.deepEqual(callbackCalls, [
  ["effects", appliedObservation],
  ["permission", appliedObservation],
], "the installed callback adapter preserves existing effects and delegates the exact observation");

console.log("live target permission recovery seam tests passed");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const slowProbeRepair = context.causalCategory === "readiness or settling";
  if (!slowProbeRepair) {
    assert.equal(context.causalCategory, "other:settled permission probe recovery activation");
  }
  const expectedPreRepairFailure = slowProbeRepair ? {
    recoveryActivatedBeforeExactSuccess:true,
    exactSuccessReady:false,
  } : {
    transientStatusPrompts:true,
    settledFailurePrompts:false,
  };
  const expectedRepairResult = slowProbeRepair ? {
    recoveryActivatedBeforeExactSuccess:false,
    exactSuccessReady:true,
  } : {
    transientStatusPrompts:false,
    settledFailurePrompts:true,
  };
  const repairResult = slowProbeRepair ? {
    recoveryActivatedBeforeExactSuccess:slowSuccessfulProbeCalls.some(
      ([kind]) => kind === "show" || kind === "update",
    ),
    exactSuccessReady:slowSuccessfulReadiness.ready,
  } : {
    transientStatusPrompts:settledCalls.length > 0,
    settledFailurePrompts:failedProbeCalls.some(([kind]) => kind === "show"),
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const normalized = (value) => Array.isArray(value) ? value.map(normalized)
    : value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)])) : value;
  const digest = (value) => createHash("sha256")
    .update(JSON.stringify(normalized(value))).digest("hex");
  const fixture = {
    id:slowProbeRepair
      ? "slow-successful-exact-permission-probe-v1"
      : "settled-permission-probe-recovery-activation-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:slowProbeRepair
      ? { probeDelayMilliseconds:175, historyPath:"event.history" }
      : { settlementMilliseconds:150, historyPath:"event.history" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
  } }));
}
