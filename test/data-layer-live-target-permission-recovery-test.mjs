import assert from "node:assert/strict";

import {
  createDormantLiveTargetPermissionRecoveryCoordinator,
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

console.log("live target permission recovery seam tests passed");
