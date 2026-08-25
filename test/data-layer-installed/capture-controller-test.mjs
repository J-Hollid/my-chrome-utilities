import assert from "node:assert/strict";
const { createCaptureInstalledController } = await import("../../dist/data-layer-installed/capture/index.js");
let subscriptions = 0, removals = 0, listener, changes = 0;
const values = new Map();
const controller = createCaptureInstalledController({
  root:{ querySelector:() => null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  initialPageUrl:() => "https://shop.example/", initialSources:() => [{ id:"history", name:"History", status:"Connected" }],
  sessionStart:async () => ({ id:"session:1", tabId:4, url:"https://shop.example/", historyPath:"event.history" }),
  subscribeToLiveFeed:(next) => { subscriptions += 1; listener = next; return () => { removals += 1; listener = undefined; }; },
  changed:() => { changes += 1; },
  runCommand() {}, setLiveSessionMessage() {},
});
controller.mount(); controller.mount(); assert.equal(subscriptions, 1);
await controller.begin();
listener({ id:"event:1", name:"page_view", sourceId:"history", captureTime:"2026-08-25T00:00:00.000Z",
  pageUrl:"https://shop.example/product" });
assert.equal(controller.state().observer.events.length, 1);
assert.equal(controller.state().session.session.timeline.length, 1,
  "Capture owns synchronized session and Live event recording");
controller.pause(); controller.capture({ id:"event:2", name:"ignored", sourceId:"history",
  captureTime:"2026-08-25T00:00:01.000Z" });
assert.equal(controller.state().observer.events.length, 1, "paused capture conserves the installed event gate");
controller.resume(); controller.end();
assert.equal(controller.state().session.session.status, "ended");
assert.ok(values.has("dataLayerTestingSession"), "Capture owns session persistence");
assert.ok(changes >= 6);
controller.dispose(); controller.dispose(); assert.equal(removals, 1);
controller.mount(); assert.equal(subscriptions, 2);
assert.equal(controller.state().observer.events.length, 1, "owned state survives one fresh lifecycle");
