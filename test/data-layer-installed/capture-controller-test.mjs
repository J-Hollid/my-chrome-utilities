import assert from "node:assert/strict";
const { createCaptureInstalledController } = await import("../../dist/data-layer-installed/capture/index.js");
let subscriptions = 0, removals = 0, listener, changes = 0;
const values = new Map();
const noOpCaptureUi = {
  historyPath:() => ({ path:"event.history", fieldValue:"event.history", status:"Ready" }),
  restartObservation() {}, chooseObservationTarget() {}, browseObservationTargets() {},
  closeObservationTargetPicker() {}, searchObservationTargets() {}, cancelDetachTarget() {},
  confirmDetachTarget() {},
};
const controller = createCaptureInstalledController({
  root:{ querySelector:() => null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  initialPageUrl:() => "https://shop.example/", initialSources:() => [{ id:"history", name:"History", status:"Connected" }],
  sessionStart:async () => ({ id:"session:1", tabId:4, url:"https://shop.example/", historyPath:"event.history" }),
  subscribeToLiveFeed:(next) => { subscriptions += 1; listener = next; return () => { removals += 1; listener = undefined; }; },
  changed:() => { changes += 1; },
  runCommand() {}, setLiveSessionMessage() {}, runObservationRefresh() {},
  ui:noOpCaptureUi,
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

function interactiveElement() {
  const listeners = new Map();
  return {
    textContent:"", value:"", dataset:{},
    setAttribute() {}, removeAttribute() {},
    addEventListener(type, handler) { listeners.set(type, handler); },
    removeEventListener(type, handler) { if (listeners.get(type) === handler) listeners.delete(type); },
    dispatch(type) { listeners.get(type)?.({ target:this }); },
    listenerCount:() => listeners.size,
  };
}
const elements = new Map([
  ["#history-path-display", interactiveElement()], ["#history-path-status", interactiveElement()],
  ["#session-history-path", interactiveElement()], ["#session-warning", interactiveElement()],
  ["#restart-observation", interactiveElement()], ["#choose-observation-target", interactiveElement()],
  ["#browse-observation-targets", interactiveElement()], ["#close-observation-target-picker", interactiveElement()],
  ["#observation-target-picker", interactiveElement()], ["#observation-target-search", interactiveElement()],
  ["#observation-target-list", interactiveElement()], ["#cancel-detach-observation-target", interactiveElement()],
  ["#confirm-detach-observation-target", interactiveElement()],
]);
const uiCalls = [];
const uiController = createCaptureInstalledController({
  root:{ querySelector:(selector) => elements.get(selector) ?? null },
  storage:{ getItem:() => null, setItem() {} }, initialPageUrl:() => "https://shop.example/",
  initialSources:() => [], sessionStart:async () => ({ id:"unused", tabId:1, url:"", historyPath:"" }),
  subscribeToLiveFeed:() => () => {}, changed() {}, runCommand() {}, setLiveSessionMessage() {},
  runObservationRefresh() {}, ui:{
    historyPath:() => ({ path:"dataLayer", fieldValue:"dataLayer", status:"Waiting for path" }),
    restartObservation:() => uiCalls.push("restart"), chooseObservationTarget:() => uiCalls.push("choose"),
    browseObservationTargets:() => uiCalls.push("browse"), closeObservationTargetPicker:() => uiCalls.push("close"),
    searchObservationTargets:(query) => uiCalls.push(`search:${query}`),
    cancelDetachTarget:() => uiCalls.push("cancel"), confirmDetachTarget:() => uiCalls.push("confirm"),
  },
});
uiController.mount();
assert.equal(elements.get("#history-path-status").textContent, "Waiting for observation path");
elements.get("#restart-observation").dispatch("click");
elements.get("#choose-observation-target").dispatch("click");
elements.get("#browse-observation-targets").dispatch("click");
elements.get("#close-observation-target-picker").dispatch("click");
elements.get("#observation-target-search").value = "checkout";
elements.get("#observation-target-search").dispatch("input");
elements.get("#cancel-detach-observation-target").dispatch("click");
elements.get("#confirm-detach-observation-target").dispatch("click");
assert.deepEqual(uiCalls, ["restart", "choose", "browse", "close", "search:checkout", "cancel", "confirm"]);
uiController.dispose();
assert.equal([...elements.values()].reduce((count, element) => count + element.listenerCount(), 0), 0,
  "Capture removes every observation-target listener it owns");
