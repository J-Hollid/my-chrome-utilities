import assert from "node:assert/strict";

import {
  createDormantLiveTargetPermissionRecoveryCoordinator,
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
const coordinator = createDormantLiveTargetPermissionRecoveryCoordinator({
  requestOriginAccess:async (...args) => { calls.push(["request", ...args]); return true; },
  recheckPath:async (...args) => { calls.push(["recheck", ...args]); },
  updateTargetAccess:(...args) => calls.push(["update", ...args]),
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
}), { status:"inactive", selectedTarget:selected });
assert.deepEqual(await coordinator.requestAccess({
  selectedTarget:selected,
  historyPath:"event.history",
}), { status:"inactive", selectedTarget:selected });
assert.deepEqual(calls, [], "preparation must not request, recheck, or mutate access");

const attached = { ...selected, id:"attached:42", title:"Attached checkout" };
const fallback = { ...selected, id:"selected:42", title:"Selected checkout" };
let attachedTarget = attached;
const bridged = [];
let readinessRenders = 0;
const appliedBridgeObservations = [];
let reconciliationResult = { status:"inactive", selectedTarget:attached };
const pathApplyBridge = createLiveTargetPermissionPathApplyBridge({
  attachedTarget:() => attachedTarget,
  selectedTarget:() => fallback,
  reconcileProbe:async (request) => {
    bridged.push(request);
    return reconciliationResult;
  },
  renderReadiness:() => { readinessRenders += 1; },
  observeApplied:(observation) => appliedBridgeObservations.push(observation),
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
assert.deepEqual(appliedBridgeObservations, [{
  request:bridged[0],
  result:reconciliationResult,
}], "the installed observation is emitted by the same bridge invocation");

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

console.log("live target permission recovery seam tests passed");
