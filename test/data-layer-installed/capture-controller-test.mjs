import assert from "node:assert/strict";
const { createCaptureInstalledController } = await import("../../dist/data-layer-installed/capture/index.js");
let subscriptions = 0, removals = 0, listener, changes = 0;
const values = new Map();
const noOpCaptureUi = {
  historyPath:() => ({ path:"event.history", fieldValue:"event.history", status:"Ready" }),
  restartObservation() {}, chooseObservationTarget() {}, browseObservationTargets() {},
  closeObservationTargetPicker() {}, searchObservationTargets() {}, cancelDetachTarget() {},
  confirmDetachTarget() {},
  sessionPresentation:() => ({ heading:"Save session", summary:"No events", freshHeading:"Start fresh",
    freshSummary:"Current session", liveSummary:"Live feed", backgroundStatus:"Connected",
    validationComparison:"Not validated", savedCount:"0 saved sessions", confirmation:"" }),
  showDataLayerView() {}, backToEvents() {}, copyPageUrl() {}, openSessionSave() {}, startFreshSession() {},
  reportMissingEvent() {}, confirmSaveSession() {}, cancelSaveSession() {}, saveAndStartFreshSession() {},
  discardAndStartFreshSession() {}, cancelFreshSession() {}, returnToCurrentLiveFeed() {},
  revalidateSavedSession() {}, searchSavedSessions() {}, importSavedSession() {}, selectSavedSession() {},
  cancelSavedSessionDelete() {}, confirmSavedSessionDelete() {},
};
const noOpObservation = { discover:async () => [], requestTabsAccess:async () => true,
  requestOriginAccess:async () => true, attach:async () => true, detach:async () => {}, render() {} };
const controller = createCaptureInstalledController({
  root:{ querySelector:() => null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  initialPageUrl:() => "https://shop.example/", initialSources:() => [{ id:"history", name:"History", status:"Connected" }],
  sessionStart:async () => ({ id:"session:1", tabId:4, url:"https://shop.example/", historyPath:"event.history" }),
  subscribeToLiveFeed:(next) => { subscriptions += 1; listener = next; return () => { removals += 1; listener = undefined; }; },
  changed:() => { changes += 1; },
  runCommand() {}, setLiveSessionMessage() {}, runObservationRefresh() {},
  observation:noOpObservation,
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
    dispatch(type, event = { target:this, preventDefault() {} }) { listeners.get(type)?.(event); },
    click() { this.dispatch("click"); },
    listenerCount:() => listeners.size,
  };
}
const elements = new Map([
  ["#observation-target-result", interactiveElement()],
  ["#history-path-display", interactiveElement()], ["#history-path-status", interactiveElement()],
  ["#session-history-path", interactiveElement()], ["#session-warning", interactiveElement()],
  ["#restart-observation", interactiveElement()], ["#choose-observation-target", interactiveElement()],
  ["#browse-observation-targets", interactiveElement()], ["#close-observation-target-picker", interactiveElement()],
  ["#observation-target-picker", interactiveElement()], ["#observation-target-search", interactiveElement()],
  ["#observation-target-list", interactiveElement()], ["#cancel-detach-observation-target", interactiveElement()],
  ["#confirm-detach-observation-target", interactiveElement()],
]);
const uiCalls = [];
let renderedTargets = [], renderedTargetActions;
const currentTarget = { tabId:7, windowId:2, pageUrl:"https://shop.example/", title:"Shop", activeTab:true, currentWindow:true };
const checkoutTarget = { tabId:8, windowId:2, pageUrl:"https://shop.example/checkout", title:"Checkout", currentWindow:true };
const uiController = createCaptureInstalledController({
  root:{ querySelector:(selector) => elements.get(selector) ?? null },
  storage:{ getItem:() => null, setItem() {} }, initialPageUrl:() => "https://shop.example/",
  initialSources:() => [], sessionStart:async () => ({ id:"unused", tabId:1, url:"", historyPath:"" }),
  subscribeToLiveFeed:() => () => {}, changed() {}, runCommand() {}, setLiveSessionMessage() {},
  runObservationRefresh() {}, observation:{
    discover:async (scope) => scope === "current" ? [currentTarget] : [currentTarget, checkoutTarget],
    requestTabsAccess:async () => true, requestOriginAccess:async () => false,
    attach:async (target) => { uiCalls.push(`attach:${target.tabId}`); return true; },
    detach:async (target) => { uiCalls.push(`detach:${target.tabId}`); },
    render:(targets, actions) => { renderedTargets = targets; renderedTargetActions = actions; },
  }, ui:{
    historyPath:() => ({ path:"dataLayer", fieldValue:"dataLayer", status:"Waiting for path" }),
    restartObservation:() => uiCalls.push("restart"), chooseObservationTarget:() => uiCalls.push("choose"),
    browseObservationTargets:() => uiCalls.push("browse"), closeObservationTargetPicker:() => uiCalls.push("close"),
    searchObservationTargets:(query) => uiCalls.push(`search:${query}`),
    cancelDetachTarget:() => uiCalls.push("cancel"), confirmDetachTarget:() => uiCalls.push("confirm"),
    ...noOpCaptureUi,
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
await uiController.discoverTargets();
assert.equal(renderedTargets[0].title, "Shop");
await uiController.attachTarget();
await uiController.browseTargets();
assert.equal(renderedTargets.length, 2);
uiController.selectTarget("tab:8:window:2");
await uiController.attachTarget();
assert.equal(uiController.state().pendingObservationTargetSwitchId, "tab:8:window:2", "switching cannot replace an attached target without review");
await uiController.confirmDetachTarget();
assert.equal(uiController.state().targets.attachedTargetId, "tab:8:window:2");
await uiController.requestTargetAccess("tab:8:window:2");
assert.equal(elements.get("#observation-target-result").textContent, "Permission required");
elements.get("#close-observation-target-picker").dispatch("click");
elements.get("#observation-target-search").value = "checkout";
elements.get("#observation-target-search").dispatch("input");
assert.deepEqual(renderedTargets.map(({ title }) => title), ["Checkout"]);
assert.deepEqual(uiCalls, ["restart", "attach:7", "detach:7", "attach:8", "close"]);
uiController.dispose();
assert.equal([...elements.values()].reduce((count, element) => count + element.listenerCount(), 0), 0,
  "Capture removes every observation-target listener it owns");

const sessionSelectors = [
  "#data-layer-views", "#back-to-events", "#copy-live-page-url", "#save-live-session", "#start-fresh-session",
  "#report-missing-event", "#save-live-session-dialog", "#save-live-session-form", "#save-live-session-heading",
  "#save-live-session-name", "#save-live-session-summary", "#confirm-save-live-session", "#cancel-save-live-session",
  "#fresh-session-confirmation", "#fresh-session-confirmation-heading", "#fresh-session-confirmation-summary",
  "#save-and-start-fresh-session", "#discard-and-start-fresh-session", "#cancel-fresh-session",
  "#saved-session-live-banner", "#saved-session-live-summary", "#saved-session-background-status",
  "#return-to-current-live-feed", "#revalidate-saved-session", "#saved-session-validation-comparison",
  "#saved-session-search", "#import-saved-session", "#saved-session-file", "#saved-session-list",
  "#saved-session-count", "#saved-session-confirmation", "#cancel-saved-session-delete", "#confirm-saved-session-delete",
];
const sessionElements = new Map(sessionSelectors.map((selector) => [selector, interactiveElement()]));
const sessionCalls = [];
const sessionUi = {
  ...noOpCaptureUi,
  sessionPresentation:() => ({ heading:"Save checkout", summary:"3 captured events", freshHeading:"Start fresh?",
    freshSummary:"Unsaved checkout", liveSummary:"Checkout live feed", backgroundStatus:"Observing",
    validationComparison:"2 matches", savedCount:"4 saved sessions", confirmation:"Session imported" }),
  backToEvents:() => sessionCalls.push("back"), copyPageUrl:() => sessionCalls.push("copy"),
  openSessionSave:() => sessionCalls.push("save"), startFreshSession:() => sessionCalls.push("fresh"),
  reportMissingEvent:() => sessionCalls.push("report"), confirmSaveSession:(name) => sessionCalls.push(`confirm:${name}`),
  cancelSaveSession:() => sessionCalls.push("cancel-save"), saveAndStartFreshSession:() => sessionCalls.push("save-fresh"),
  discardAndStartFreshSession:() => sessionCalls.push("discard-fresh"), cancelFreshSession:() => sessionCalls.push("cancel-fresh"),
  returnToCurrentLiveFeed:() => sessionCalls.push("return"), revalidateSavedSession:() => sessionCalls.push("revalidate"),
  searchSavedSessions:(query) => sessionCalls.push(`search-saved:${query}`), importSavedSession:() => sessionCalls.push("import"),
  cancelSavedSessionDelete:() => sessionCalls.push("cancel-delete"),
  confirmSavedSessionDelete:() => sessionCalls.push("confirm-delete"),
};
const sessionController = createCaptureInstalledController({
  root:{ querySelector:(selector) => sessionElements.get(selector) ?? null }, storage:{ getItem:() => null, setItem() {} },
  initialPageUrl:() => "https://shop.example/", initialSources:() => [],
  sessionStart:async () => ({ id:"unused", tabId:1, url:"", historyPath:"" }), subscribeToLiveFeed:() => () => {},
  changed() {}, runCommand() {}, setLiveSessionMessage() {}, runObservationRefresh() {}, ui:sessionUi,
  observation:noOpObservation,
});
sessionController.mount();
assert.equal(sessionElements.get("#save-live-session-heading").textContent, "Save checkout");
assert.equal(sessionElements.get("#saved-session-count").textContent, "4 saved sessions");
sessionElements.get("#back-to-events").click(); sessionElements.get("#copy-live-page-url").click();
sessionElements.get("#save-live-session").click(); sessionElements.get("#start-fresh-session").click();
sessionElements.get("#report-missing-event").click();
sessionElements.get("#save-live-session-name").value = "Checkout regression";
sessionElements.get("#save-live-session-form").dispatch("submit");
sessionElements.get("#cancel-save-live-session").click(); sessionElements.get("#save-and-start-fresh-session").click();
sessionElements.get("#discard-and-start-fresh-session").click(); sessionElements.get("#cancel-fresh-session").click();
sessionElements.get("#return-to-current-live-feed").click(); sessionElements.get("#revalidate-saved-session").click();
sessionElements.get("#saved-session-search").value = "checkout"; sessionElements.get("#saved-session-search").dispatch("input");
sessionElements.get("#import-saved-session").click(); sessionElements.get("#saved-session-file").dispatch("change");
sessionElements.get("#cancel-saved-session-delete").click(); sessionElements.get("#confirm-saved-session-delete").click();
assert.deepEqual(sessionCalls, ["back", "copy", "save", "fresh", "report", "confirm:Checkout regression", "cancel-save",
  "save-fresh", "discard-fresh", "cancel-fresh", "return", "revalidate", "search-saved:checkout", "import",
  "cancel-delete", "confirm-delete"]);
sessionController.dispose();
assert.equal([...sessionElements.values()].reduce((count, element) => count + element.listenerCount(), 0), 0,
  "Capture removes every live-session and saved-library listener it owns");
