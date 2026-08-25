import assert from "node:assert/strict";
const { createCaptureInstalledController } = await import("../../dist/data-layer-installed/capture/index.js");
let subscriptions = 0, removals = 0, listener, changes = 0;
const values = new Map();
const noOpCaptureUi = {
  historyPath:() => ({ path:"event.history", fieldValue:"event.history", status:"Ready" }),
  restartObservation() {}, chooseObservationTarget() {}, browseObservationTargets() {},
  closeObservationTargetPicker() {}, searchObservationTargets() {}, cancelDetachTarget() {},
  confirmDetachTarget() {},
  showDataLayerView() {}, backToEvents() {}, copyPageUrl() {}, reportMissingEvent() {},
};
const noOpObservation = { discover:async () => [], requestTabsAccess:async () => true,
  requestOriginAccess:async () => true, attach:async () => true, detach:async () => {}, render() {} };
const noOpSavedSessions = {
  now:() => "2026-08-25T00:00:00.000Z", createSessionId:(tabId) => `fresh:${tabId}`,
  readImportFile:async () => undefined, download() {}, validate:() => ({ state:"Not checked" }),
  render() {}, resetFlowTesting() {}, createReplaySequence() {},
};
const noOpSavedFilters = { createId:() => "saved-filter:1", render() {}, dispose() {} };
const controller = createCaptureInstalledController({
  root:{ querySelector:() => null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  initialPageUrl:() => "https://shop.example/", initialSources:() => [{ id:"history", name:"History", status:"Connected" }],
  sessionStart:async () => ({ id:"session:1", tabId:4, url:"https://shop.example/", historyPath:"event.history" }),
  subscribeToLiveFeed:(next) => { subscriptions += 1; listener = next; return () => { removals += 1; listener = undefined; }; },
  changed:() => { changes += 1; },
  runCommand() {}, setLiveSessionMessage() {}, runObservationRefresh() {},
  observation:noOpObservation,
  savedSessions:noOpSavedSessions,
  savedFilters:noOpSavedFilters,
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
    textContent:"", value:"", dataset:{}, hidden:false, disabled:false, open:false, scrollTop:0,
    setAttribute() {}, removeAttribute() {},
    showModal() { this.open = true; }, close() { this.open = false; }, focus() {},
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
  savedSessions:noOpSavedSessions,
  savedFilters:noOpSavedFilters,
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
  "#live-events-empty-state", "#live-source-error-state", "#saved-session-empty-state",
];
const sessionElements = new Map(sessionSelectors.map((selector) => [selector, interactiveElement()]));
const sessionCalls = [], persistedSessions = new Map();
let renderedSessions = [], savedActions, importResolve;
const sessionPorts = {
  ...noOpSavedSessions,
  readImportFile:() => new Promise((resolve) => { importResolve = resolve; }),
  download:(name, serialized) => sessionCalls.push(`download:${name}:${JSON.parse(serialized).id}`),
  validate:() => ({ state:"Valid", schema:{ name:"Checkout", version:2 } }),
  render:(sessions, actions) => { renderedSessions = sessions; savedActions = actions; },
  resetFlowTesting:() => sessionCalls.push("reset-flow"),
  createReplaySequence:(session) => sessionCalls.push(`replay:${session.id}`),
};
const sessionController = createCaptureInstalledController({
  root:{ querySelector:(selector) => sessionElements.get(selector) ?? null },
  storage:{ getItem:(key) => persistedSessions.get(key) ?? null,
    setItem:(key, value) => persistedSessions.set(key, value), removeItem:(key) => persistedSessions.delete(key) },
  initialPageUrl:() => "https://shop.example/", initialSources:() => [],
  sessionStart:async () => ({ id:"live:1", tabId:1, url:"https://shop.example/", historyPath:"dataLayer" }), subscribeToLiveFeed:() => () => {},
  changed() {}, runCommand() {}, setLiveSessionMessage:(message) => sessionCalls.push(`message:${message}`), runObservationRefresh() {}, ui:noOpCaptureUi,
  observation:noOpObservation,
  savedSessions:sessionPorts,
  savedFilters:noOpSavedFilters,
});
sessionController.mount();
await sessionController.begin();
sessionController.capture({ id:"event:checkout", name:"checkout", sourceId:"history", sourceName:"History",
  captureTime:"2026-08-25T00:00:01.000Z", payload:{ total:42 }, rawInput:{ total:42 } });
assert.equal(sessionElements.get("#live-events-empty-state").hidden, true);
assert.equal(sessionElements.get("#live-source-error-state").hidden, true);
assert.equal(sessionElements.get("#saved-session-empty-state").hidden, false);
sessionElements.get("#save-live-session").click();
assert.equal(sessionElements.get("#save-live-session-dialog").open, true);
assert.match(sessionElements.get("#save-live-session-summary").textContent, /1 events/);
sessionElements.get("#save-live-session-name").value = "Checkout regression";
sessionElements.get("#save-live-session-form").dispatch("submit");
assert.equal(renderedSessions.length, 1, "Capture persists and renders its saved-session library");
assert.equal(renderedSessions[0].name, "Checkout regression");
assert.ok(persistedSessions.has("my-chrome-utilities.saved-session-library.v1"));
savedActions.open(renderedSessions[0].id);
assert.match(sessionElements.get("#saved-session-live-summary").textContent, /Read-only archive/);
sessionController.capture({ id:"event:background", name:"background", sourceId:"history", sourceName:"History",
  captureTime:"2026-08-25T00:00:02.000Z", payload:{}, rawInput:{} });
assert.match(sessionElements.get("#saved-session-background-status").textContent, /1 new events/);
sessionElements.get("#revalidate-saved-session").click();
assert.match(sessionElements.get("#saved-session-validation-comparison").textContent, /revisions 2/);
sessionElements.get("#return-to-current-live-feed").click();
assert.equal(sessionController.state().observer.events.at(-1).id, "event:background", "return restores background events");
sessionElements.get("#saved-session-search").value = "checkout"; sessionElements.get("#saved-session-search").dispatch("input");
savedActions.rename(renderedSessions[0].id, "Renamed checkout");
savedActions.export(renderedSessions[0].id); savedActions.createSequence(renderedSessions[0].id);
savedActions.requestDelete(renderedSessions[0].id);
assert.equal(sessionElements.get("#confirm-saved-session-delete").hidden, false);
sessionElements.get("#cancel-saved-session-delete").click();
savedActions.requestDelete(renderedSessions[0].id); sessionElements.get("#confirm-saved-session-delete").click();
assert.equal(renderedSessions.length, 0, "confirmed deletion persists and rerenders");
sessionElements.get("#saved-session-search").value = "";
sessionElements.get("#import-saved-session").click(); sessionElements.get("#saved-session-file").dispatch("change");
importResolve(JSON.stringify({ id:"saved:imported", name:"Imported", pageScope:"https://import.example/",
  startedAt:"2026-08-25T00:00:00.000Z", endedAt:"2026-08-25T00:00:01.000Z", events:[] }));
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(renderedSessions[0].name, "Imported", "async import settles into controller-owned persistence");
savedActions.resume(renderedSessions[0].id);
assert.equal(sessionController.state().session.session.parentSavedSessionId, "saved:imported");
assert.equal(sessionController.state().observer.events.length, 0);
assert.ok(sessionCalls.includes("reset-flow"));
assert.ok(sessionCalls.some((call) => call.startsWith("download:renamed-checkout.json")));
assert.ok(sessionCalls.some((call) => call.startsWith("replay:saved:live-")));

sessionElements.get("#start-fresh-session").click();
assert.equal(sessionElements.get("#fresh-session-confirmation").open, false, "empty linked capture starts fresh without review");
sessionController.capture({ id:"event:unsaved", name:"unsaved", sourceId:"history", captureTime:"2026-08-25T00:00:03.000Z" });
sessionElements.get("#start-fresh-session").click();
assert.equal(sessionElements.get("#fresh-session-confirmation").open, true);
sessionElements.get("#discard-and-start-fresh-session").click();
assert.equal(sessionController.state().observer.events.length, 0, "discard transition starts a fresh owned session");

let staleResolve;
sessionPorts.readImportFile = () => new Promise((resolve) => { staleResolve = resolve; });
sessionElements.get("#saved-session-file").dispatch("change");
sessionController.dispose();
staleResolve(JSON.stringify({ id:"saved:stale", name:"Stale", pageScope:"https://stale.example/",
  startedAt:"2026-08-25T00:00:00.000Z", endedAt:"2026-08-25T00:00:01.000Z", events:[] }));
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(renderedSessions.some(({ id }) => id === "saved:stale"), false, "disposed controller rejects stale import settlement");
assert.equal([...sessionElements.values()].reduce((count, element) => count + element.listenerCount(), 0), 0,
  "Capture removes every live-session and saved-library listener it owns");

const filterStorage = new Map();
let rejectFilterWrite = false, filterControls, updateWorkingFilter, filterDisposals = 0;
const filterController = createCaptureInstalledController({
  root:{ querySelector:() => null },
  storage:{ getItem:(key) => filterStorage.get(key) ?? null,
    setItem:(key, value) => { if (rejectFilterWrite && key === "my-chrome-utilities.saved-event-feed-filters.v1") throw new Error("quota");
      filterStorage.set(key, value); }, removeItem:(key) => filterStorage.delete(key) },
  initialPageUrl:() => "https://shop.example/", initialSources:() => [],
  sessionStart:async () => ({ id:"filter-session", tabId:3, url:"https://shop.example/", historyPath:"dataLayer" }),
  subscribeToLiveFeed:() => () => {}, changed() {}, runCommand() {}, setLiveSessionMessage() {}, runObservationRefresh() {},
  observation:noOpObservation, savedSessions:noOpSavedSessions, ui:noOpCaptureUi,
  savedFilters:{ createId:() => "saved-filter:checkout",
    render:(_events, _query, controls, update) => { filterControls = controls; updateWorkingFilter = update; },
    dispose:() => { filterDisposals += 1; } },
});
filterController.mount(); await filterController.begin();
updateWorkingFilter({ conditions:[{ id:"condition:1", field:"Name", operator:"contains", values:["checkout"] }] });
filterControls.create("Checkout events");
assert.equal(filterController.state().savedFilters.filters[0].name, "Checkout events");
assert.equal(filterController.state().observer.savedFilterId, "saved-filter:checkout");
filterControls.setDefault("saved-filter:checkout");
assert.equal(filterController.state().savedFilters.defaultFilterId, "saved-filter:checkout");
filterControls.rename("Checkout funnel");
assert.equal(filterController.state().savedFilters.filters[0].name, "Checkout funnel");
updateWorkingFilter({ conditions:[{ id:"condition:2", field:"Name", operator:"contains", values:["purchase"] }] });
assert.equal(filterControls.update(), true, "working-query updates commit through Capture persistence");
rejectFilterWrite = true; filterControls.rename("Rejected rename");
assert.equal(filterController.state().savedFilters.filters[0].name, "Checkout funnel", "rejected persistence retains the prior library");
assert.equal(filterController.state().savedEventFeedFilterFeedback, "Renaming saved filter failed");
rejectFilterWrite = false; filterControls.revert(); filterControls.delete();
assert.equal(filterController.state().savedFilters.filters.length, 0);
assert.equal(filterController.state().observer.savedFilterId, undefined);
filterController.dispose(); filterController.dispose();
assert.equal(filterDisposals, 1, "Capture symmetrically disposes saved-filter rendering");
