import assert from "node:assert/strict";
const { createCaptureInstalledController } = await import("../../dist/data-layer-installed/capture/index.js");
let subscriptions = 0, removals = 0;
const controller = createCaptureInstalledController({
  beginSession:async()=>{}, endSession:async()=>{}, saveCurrentSession:async()=>{},
  subscribeToLiveFeed:() => { subscriptions += 1; return () => { removals += 1; }; },
});
controller.mount(); controller.mount();
assert.equal(subscriptions, 1);
controller.noteCapturedEvent();
assert.equal(controller.state().capturedEventCount, 1);
controller.dispose(); controller.dispose();
assert.equal(removals, 1);
controller.mount();
assert.equal(controller.state().capturedEventCount, 1);
