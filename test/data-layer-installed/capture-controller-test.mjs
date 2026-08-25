import assert from "node:assert/strict";
import { verifyPreparedInstalledController } from "../support/data-layer-installed-controller-contract.mjs";
await verifyPreparedInstalledController("capture");
const { createCaptureInstalledController } = await import("../../dist/data-layer-installed/capture/index.js");
let changes = 0;
const values = new Map();
const noOpCaptureUi = {
  historyPath:() => ({ path:"event.history", fieldValue:"event.history", status:"Ready" }),
  chooseObservationTarget() {}, browseObservationTargets() {},
  closeObservationTargetPicker() {}, searchObservationTargets() {}, cancelDetachTarget() {},
  confirmDetachTarget() {},
  showDataLayerView() {}, backToEvents() {}, copyPageUrl() {}, reportMissingEvent() {},
};
const noOpObservation = { discover:async () => [], requestTabsAccess:async () => true,
  requestOriginAccess:async () => true, probe:async (target, historyPath, pageLoadId) => ({ tabId:target.tabId,
    pageUrl:target.pageUrl, historyPath, pageLoadId, pageAccessStatus:"page access available", pageObject:{ dataLayer:[] } }), render() {} };
const noOpSavedSessions = {
  now:() => "2026-08-25T00:00:00.000Z", createSessionId:(tabId) => `fresh:${tabId}`,
  readImportFile:async () => undefined, download() {}, validate:() => ({ state:"Not checked" }),
  render() {}, resetFlowTesting() {}, createReplaySequence() {},
};
const noOpSavedFilters = { createId:() => "saved-filter:1", render() {}, dispose() {} };
const noOpObserverRuntime = {
  read:async ({ tabId, pageUrl, historyPath, pageLoadId }) => ({ tabId, pageUrl, historyPath, pageLoadId,
    pageAccessStatus:"page access available", pageObject:{ dataLayer:[] } }),
  startPush:async () => () => {}, present:(event) => ({ ...event, sourceName:event.sourceId }),
  recordCapture() {}, recordNavigation() {}, subscribeTabUpdated:() => () => {},
  subscribeTabRemoved:() => () => {}, subscribePermissionsRemoved:() => () => {},
};
const noOpInspector = { splitView:() => false,
  capturePresentation:() => ({ showNonApplicableProperties:false, expandedPropertyPaths:[], expandedRulePaths:[], scrollTop:0 }),
  restorePresentation() {}, restoreReturn() {}, render() {} };
const controller = createCaptureInstalledController({
  root:{ querySelector:() => null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  initialPageUrl:() => "https://shop.example/", initialSources:() => [{ id:"history", name:"History", status:"Connected" }],
  sessionStart:async () => ({ id:"session:1", tabId:4, url:"https://shop.example/", historyPath:"event.history" }),
  changed:() => { changes += 1; },
  runCommand() {}, setLiveSessionMessage() {}, observerRuntime:noOpObserverRuntime,
  observation:noOpObservation,
  savedSessions:noOpSavedSessions,
  savedFilters:noOpSavedFilters,
  inspector:noOpInspector,
  ui:noOpCaptureUi,
});
controller.mount(); controller.mount();
await controller.begin();
controller.capture({ id:"event:1", name:"page_view", sourceId:"history", captureTime:"2026-08-25T00:00:00.000Z",
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
assert.equal(controller.currentSessionDraft().completed.events[0].id, "event:1",
  "Capture exposes an immutable completed-session port for cross-owner evidence attachment");
const replacementSessions = { sessions:[] };
controller.replaceSavedSessions(replacementSessions);
assert.deepEqual(controller.savedSessions(), replacementSessions,
  "Capture owns replacement persistence for a reviewed cross-owner saved-session transaction");
assert.ok(changes >= 6);
controller.dispose(); controller.dispose();
controller.mount();
assert.equal(controller.state().observer.events.length, 1, "owned state survives one fresh lifecycle");
controller.dispose();
const persistedFreshSession = JSON.parse(values.get("dataLayerTestingSession"));
persistedFreshSession.session.freshBoundary = true;
values.set("dataLayerTestingSession", JSON.stringify(persistedFreshSession));
const restoredController = createCaptureInstalledController({
  root:{ querySelector:() => null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  initialPageUrl:() => "https://shop.example/", initialSources:() => [{ id:"history", name:"History", status:"Connected" }],
  sessionStart:async () => ({ id:"unused", tabId:4, url:"https://shop.example/", historyPath:"event.history" }),
  changed() {}, runCommand() {}, setLiveSessionMessage() {}, observerRuntime:noOpObserverRuntime,
  observation:noOpObservation, savedSessions:noOpSavedSessions, savedFilters:noOpSavedFilters,
  inspector:noOpInspector, ui:noOpCaptureUi,
});
restoredController.mount();
assert.equal(restoredController.state().observer.events.length, 1,
  "Capture restores a persisted fresh-session timeline into a newly constructed Live observer");
restoredController.dispose();

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
  changed() {}, runCommand() {}, setLiveSessionMessage() {},
  observerRuntime:noOpObserverRuntime, observation:{
    discover:async (scope) => scope === "current" ? [currentTarget] : [currentTarget, checkoutTarget],
    requestTabsAccess:async () => true, requestOriginAccess:async () => false,
    probe:async (target, historyPath, pageLoadId) => { uiCalls.push(`probe:${target.tabId}`); return {
      tabId:target.tabId, pageUrl:target.pageUrl, historyPath, pageLoadId, pageAccessStatus:"page access available", pageObject:{ dataLayer:[] } }; },
    render:(targets, actions) => { renderedTargets = targets; renderedTargetActions = actions; },
  }, ui:{
    historyPath:() => ({ path:"dataLayer", fieldValue:"dataLayer", status:"Waiting for path" }),
    chooseObservationTarget:() => uiCalls.push("choose"),
    browseObservationTargets:() => uiCalls.push("browse"), closeObservationTargetPicker:() => uiCalls.push("close"),
    searchObservationTargets:(query) => uiCalls.push(`search:${query}`),
    cancelDetachTarget:() => uiCalls.push("cancel"), confirmDetachTarget:() => uiCalls.push("confirm"),
    ...noOpCaptureUi,
    historyPath:() => ({ path:"dataLayer", fieldValue:"dataLayer", status:"Waiting for path" }),
    chooseObservationTarget:() => uiCalls.push("choose"),
    browseObservationTargets:() => uiCalls.push("browse"), closeObservationTargetPicker:() => uiCalls.push("close"),
    searchObservationTargets:(query) => uiCalls.push(`search:${query}`),
    cancelDetachTarget:() => uiCalls.push("cancel"), confirmDetachTarget:() => uiCalls.push("confirm"),
  },
  savedSessions:noOpSavedSessions,
  savedFilters:noOpSavedFilters,
  inspector:noOpInspector,
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
assert.deepEqual(uiCalls, ["probe:7", "probe:8", "close"],
  "Capture proves target access through the observation probe and owns detach cleanup itself");
uiController.dispose();
assert.equal([...elements.values()].reduce((count, element) => count + element.listenerCount(), 0), 0,
  "Capture removes every observation-target listener it owns");

{
  const permissionCalls = [];
  let pathStatus = "Permission required";
  let recoveryAction;
  const previousDocument = globalThis.document;
  const readinessHost = interactiveElement();
  readinessHost.append = (action) => { recoveryAction = action;
    action.remove = () => { if (recoveryAction === action) recoveryAction = undefined; }; };
  globalThis.document = { createElement:() => interactiveElement() };
  const permissionController = createCaptureInstalledController({
    root:{ querySelector:(selector) => selector === "#live-setup-readiness" ? readinessHost : null },
    storage:{ getItem:() => null, setItem() {} },
    initialPageUrl:() => "https://shop.example/", initialSources:() => [],
    sessionStart:async () => ({ id:"unused", tabId:42, url:"", historyPath:"" }),
    changed() {}, runCommand() {}, setLiveSessionMessage() {}, observerRuntime:noOpObserverRuntime,
    observation:{ ...noOpObservation,
      discover:async () => [{ tabId:42, windowId:7, pageUrl:"https://shop.example/checkout", title:"Checkout" }],
      requestOriginAccess:async (origin) => { permissionCalls.push(["request", origin]); return true; },
      probe:async (target, historyPath, pageLoadId) => {
        permissionCalls.push(["probe", target.tabId, historyPath]);
        return { tabId:target.tabId, pageUrl:target.pageUrl, historyPath, pageLoadId,
          pageAccessStatus:"page access available", pageObject:{ event:{ history:[] } } };
      },
    }, savedSessions:noOpSavedSessions, savedFilters:noOpSavedFilters, inspector:noOpInspector,
    ui:{ ...noOpCaptureUi,
      historyPath:() => ({ path:"event.history", fieldValue:"event.history", status:pathStatus, generation:1 }),
      selectedTargetChanged:(observation) => {
        permissionCalls.push(["apply", observation?.tabId, observation?.historyPath]);
        if (observation) pathStatus = "Ready";
      },
    },
  });
  permissionController.mount();
  await permissionController.discoverTargets();
  permissionController.applyTargetPathObservation({ tabId:42, pageUrl:"https://shop.example/checkout",
    historyPath:"event.history", pageLoadId:"pre-grant", pageAccessStatus:"page access unavailable" });
  assert.equal(permissionController.state().targets.targets[0].accessState, "Permission required",
    "the failed pre-grant transport observation activates recovery on the retained target");
  assert.equal(recoveryAction?.textContent, "Request access",
    "Capture projects the retained target's recovery into the visible current step");
  await permissionController.requestTargetAccess("tab:42:window:7");
  assert.deepEqual(permissionCalls, [
    ["apply", undefined, undefined],
    ["request", "https://shop.example"],
    ["probe", 42, "event.history"],
    ["apply", 42, "event.history"],
  ], "a native exact-origin grant settles through one same-tab configured-path probe before readiness");
  assert.equal(permissionController.state().targets.targets[0].accessState, "Ready");
  permissionController.dispose();
  if (previousDocument === undefined) delete globalThis.document;
  else globalThis.document = previousDocument;
}

async function permissionRecoveryHarness({ grant = true, observation, deferProbe = false } = {}) {
  const calls = [], applied = [];
  let path = "event.history", generation = 1, releaseProbe;
  const probeGate = deferProbe ? new Promise((resolve) => { releaseProbe = resolve; }) : undefined;
  const targets = [
    { tabId:42, windowId:7, pageUrl:"https://shop.example/checkout", title:"Checkout" },
    { tabId:84, windowId:7, pageUrl:"https://other.example/", title:"Other" },
  ];
  const fallbackObservation = { tabId:42, pageUrl:targets[0].pageUrl, historyPath:path, pageLoadId:"permission",
    pageAccessStatus:"page access available", pageObject:{ event:{ history:[] } } };
  const controller = createCaptureInstalledController({
    root:{ querySelector:() => null }, storage:{ getItem:() => null, setItem() {} },
    initialPageUrl:() => "https://shop.example/", initialSources:() => [],
    sessionStart:async () => ({ id:"unused", tabId:42, url:"", historyPath:"" }),
    changed() {}, runCommand() {}, setLiveSessionMessage() {}, observerRuntime:noOpObserverRuntime,
    observation:{ ...noOpObservation, discover:async (scope) => scope === "current" ? targets.slice(0, 1) : targets,
      requestOriginAccess:async () => { calls.push("request"); return grant; },
      probe:async () => { calls.push("probe"); if (probeGate) await probeGate; return observation ?? fallbackObservation; },
    }, savedSessions:noOpSavedSessions, savedFilters:noOpSavedFilters, inspector:noOpInspector,
    ui:{ ...noOpCaptureUi, historyPath:() => ({ path, fieldValue:path, status:"Permission required", generation }),
      selectedTargetChanged:(value) => { if (value) applied.push(value); },
    },
  });
  controller.mount(); await controller.discoverTargets();
  return { controller, calls, applied, releaseProbe,
    changePath(next) { path = next; generation += 1; },
  };
}

{
  const declined = await permissionRecoveryHarness({ grant:false });
  await declined.controller.requestTargetAccess("tab:42:window:7");
  assert.deepEqual(declined.calls, ["request"], "a declined permission result never probes");
  assert.equal(declined.controller.state().targets.targets[0].accessState, "Permission required");
  declined.controller.dispose();

  const unavailable = await permissionRecoveryHarness({ observation:{ tabId:42, pageUrl:"https://shop.example/checkout",
    historyPath:"event.history", pageLoadId:"permission", pageAccessStatus:"page access unavailable" } });
  await unavailable.controller.requestTargetAccess("tab:42:window:7");
  assert.deepEqual(unavailable.calls, ["request", "probe"]);
  assert.equal(unavailable.controller.state().targets.targets[0].accessState, "Permission required",
    "the permission Boolean cannot override an unavailable post-grant probe");
  unavailable.controller.dispose();

  const missingPath = await permissionRecoveryHarness({ observation:{ tabId:42, pageUrl:"https://shop.example/checkout",
    historyPath:"event.history", pageLoadId:"permission", pageAccessStatus:"page access available",
    pageObject:{ event:{} } } });
  await missingPath.controller.requestTargetAccess("tab:42:window:7");
  assert.equal(missingPath.controller.state().targets.targets[0].accessState, "Ready",
    "accessible pages retain Ready access even when the configured path is absent");
  assert.equal(missingPath.applied.length, 1, "the transport receives the missing-path observation that keeps Start disabled");
  missingPath.controller.dispose();

  const staleTarget = await permissionRecoveryHarness({ deferProbe:true });
  const staleTargetRequest = staleTarget.controller.requestTargetAccess("tab:42:window:7");
  await Promise.resolve(); await Promise.resolve();
  await staleTarget.controller.browseTargets(); staleTarget.controller.selectTarget("tab:84:window:7");
  staleTarget.releaseProbe(); await staleTargetRequest;
  assert.equal(staleTarget.applied.length, 0, "a target change invalidates the granted probe settlement");
  staleTarget.controller.dispose();

  const stalePath = await permissionRecoveryHarness({ deferProbe:true });
  const stalePathRequest = stalePath.controller.requestTargetAccess("tab:42:window:7");
  await Promise.resolve(); await Promise.resolve();
  stalePath.changePath("dataLayer"); stalePath.releaseProbe(); await stalePathRequest;
  assert.equal(stalePath.applied.length, 0, "a configured-path generation change invalidates the granted probe settlement");
  stalePath.controller.dispose();

  const disposed = await permissionRecoveryHarness({ deferProbe:true });
  const disposedRequest = disposed.controller.requestTargetAccess("tab:42:window:7");
  await Promise.resolve(); await Promise.resolve();
  disposed.controller.dispose(); disposed.releaseProbe(); await disposedRequest;
  assert.equal(disposed.applied.length, 0, "a disposed controller ignores the granted probe settlement");
}

let tabUpdated, tabRemoved, permissionsRemoved, pushActions, pushStops = 0, runtimeUnsubscribes = 0;
let resolveStaleRead;
let pageAccessAvailable = true;
const observerRuntime = {
  ...noOpObserverRuntime,
  read:({ tabId, pageUrl, historyPath, pageLoadId }) => pageUrl.includes("stale")
    ? new Promise((resolve) => { resolveStaleRead = () => resolve({ tabId, pageUrl, historyPath, pageLoadId,
      pageAccessStatus:"page access available", pageObject:{ dataLayer:[] } }); })
    : Promise.resolve({ tabId, pageUrl, historyPath, pageLoadId,
      pageAccessStatus:pageAccessAvailable ? "page access available" : "page access unavailable",
      ...(pageAccessAvailable ? { pageObject:{ dataLayer:[] } } : {}) }),
  startPush:async (actions) => { pushActions = actions; return () => { pushStops += 1; }; },
  present:(event, destination) => ({ ...event, sourceName:"History", destination, validation:"Valid" }),
  recordCapture:() => {}, recordNavigation:() => {},
  subscribeTabUpdated:(listener) => { tabUpdated = listener; return () => { runtimeUnsubscribes += 1; }; },
  subscribeTabRemoved:(listener) => { tabRemoved = listener; return () => { runtimeUnsubscribes += 1; }; },
  subscribePermissionsRemoved:(listener) => { permissionsRemoved = listener; return () => { runtimeUnsubscribes += 1; }; },
};
const observerController = createCaptureInstalledController({
  root:{ querySelector:() => null }, storage:{ getItem:() => null, setItem() {}, removeItem() {} },
  initialPageUrl:() => "https://shop.example/", initialSources:() => [{ id:"event-history", name:"History", status:"Connected" }],
  sessionStart:async () => ({ id:"observer-session", tabId:9, windowId:2, url:"https://shop.example/", historyPath:"dataLayer" }),
  changed() {}, runCommand() {}, setLiveSessionMessage() {},
  observerRuntime, observation:{ ...noOpObservation,
    discover:async () => [{ tabId:9, windowId:2, pageUrl:"https://shop.example/", title:"Shop" }] },
  savedSessions:noOpSavedSessions, savedFilters:noOpSavedFilters, inspector:noOpInspector, ui:noOpCaptureUi,
});
observerController.mount(); await observerController.begin(); await observerController.discoverTargets();
const initialPushActions = pushActions;
assert.ok(initialPushActions, "starting a ready session activates production push capture immediately");
tabUpdated(9, { status:"loading", url:"https://shop.example/stale" }, { url:"https://shop.example/stale", title:"Stale" });
tabUpdated(9, { status:"complete" }, { url:"https://shop.example/stale", title:"Stale" });
await new Promise((resolve) => setTimeout(resolve, 0));
tabUpdated(9, { status:"loading", url:"https://shop.example/current" }, { url:"https://shop.example/current", title:"Current" });
resolveStaleRead(); await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(pushActions, initialPushActions, "a superseded page read cannot replace capture with stale activation");
tabUpdated(9, { status:"complete" }, { url:"https://shop.example/current", title:"Current" });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.ok(pushActions, "the current completed page activates observer push capture");
pushActions.onSnapshot({ historyPath:"dataLayer", rawValues:[{ event:"snapshot" }] });
pushActions.onEntry({ rawValue:{ event:"purchase" }, timestamp:"2026-08-25T00:00:04.000Z" });
assert.equal(observerController.state().observer.events.length, 2);
assert.equal(observerController.state().session.session.timeline.filter(({ type }) => type === "observed").length, 2);
pageAccessAvailable = false;
tabUpdated(9, { status:"loading", url:"https://shop.example/denied" }, { url:"https://shop.example/denied", title:"Denied" });
tabUpdated(9, { status:"complete" }, { url:"https://shop.example/denied", title:"Denied" });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(observerController.state().targets.targets[0].accessState, "Permission required",
  "an unavailable current refresh transitions the selected target to access recovery");
permissionsRemoved(["https://shop.example/*"]);
assert.equal(observerController.state().targets.targets[0].accessState, "Permission required");
tabRemoved(9);
assert.equal(observerController.state().targets.targets[0].accessState, "Closed");
assert.ok(pushStops >= 1, "tab removal stops the active push capture");
observerController.dispose(); observerController.dispose();
assert.equal(runtimeUnsubscribes, 3, "Capture removes all browser-runtime subscriptions exactly once");
const eventsBeforeStalePush = observerController.state().observer.events.length;
pushActions.onEntry({ rawValue:{ event:"late" }, timestamp:"2026-08-25T00:00:05.000Z" });
assert.equal(observerController.state().observer.events.length, eventsBeforeStalePush, "disposed activation rejects stale push events");

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
let renderedInspectorEvent, restoredInspectorReturn;
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
  sessionStart:async () => ({ id:"live:1", tabId:1, url:"https://shop.example/", historyPath:"dataLayer" }),
  changed() {}, runCommand() {}, setLiveSessionMessage:(message) => sessionCalls.push(`message:${message}`), observerRuntime:noOpObserverRuntime, ui:noOpCaptureUi,
  observation:noOpObservation,
  savedSessions:sessionPorts,
  savedFilters:noOpSavedFilters,
  inspector:{ ...noOpInspector, render:(event) => { renderedInspectorEvent = event; },
    restoreReturn:(snapshot) => { restoredInspectorReturn = snapshot; } },
});
sessionController.mount();
await sessionController.begin();
sessionController.capture({ id:"event:checkout", name:"checkout", sourceId:"history", sourceName:"History",
  captureTime:"2026-08-25T00:00:01.000Z", payload:{ total:42 }, rawInput:{ total:42 } });
sessionController.openInspector("event:checkout");
assert.equal(renderedInspectorEvent.id, "event:checkout", "Capture owns inspector selection and rendering");
assert.equal(sessionController.state().inspectorReturnSnapshot.eventId, "event:checkout");
sessionController.closeInspector();
assert.equal(restoredInspectorReturn.eventId, "event:checkout");
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

const linkedSessionId = sessionController.state().session.session.id;
sessionElements.get("#start-fresh-session").click();
assert.equal(sessionElements.get("#fresh-session-confirmation").open, false, "empty linked capture starts fresh without review");
const firstFreshSessionId = sessionController.state().session.session.id;
assert.notEqual(firstFreshSessionId, linkedSessionId, "Capture owns fresh-session identity generation");
sessionController.capture({ id:"event:unsaved", name:"unsaved", sourceId:"history", captureTime:"2026-08-25T00:00:03.000Z" });
sessionElements.get("#start-fresh-session").click();
assert.equal(sessionElements.get("#fresh-session-confirmation").open, true);
sessionElements.get("#cancel-fresh-session").click();
assert.equal(sessionElements.get("#fresh-session-confirmation").open, false, "Capture closes fresh-session review and restores its trigger");
sessionElements.get("#start-fresh-session").click();
sessionElements.get("#discard-and-start-fresh-session").click();
assert.equal(sessionController.state().observer.events.length, 0, "discard transition starts a fresh owned session");
assert.notEqual(sessionController.state().session.session.id, firstFreshSessionId, "Capture advances each fresh-session identity");
sessionController.capture({ id:"event:save-cancel", name:"save-cancel", sourceId:"history", captureTime:"2026-08-25T00:00:04.000Z" });
sessionElements.get("#save-live-session").click();
assert.equal(sessionElements.get("#save-live-session-dialog").open, true);
sessionElements.get("#cancel-save-live-session").click();
assert.equal(sessionElements.get("#save-live-session-dialog").open, false, "Capture closes save review without persisting a draft");

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
  changed() {}, runCommand() {}, setLiveSessionMessage() {}, observerRuntime:noOpObserverRuntime,
  observation:noOpObservation, savedSessions:noOpSavedSessions, ui:noOpCaptureUi,
  savedFilters:{ createId:() => "saved-filter:checkout",
    render:(_events, _query, controls, update) => { filterControls = controls; updateWorkingFilter = update; },
    dispose:() => { filterDisposals += 1; } },
  inspector:noOpInspector,
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

{
  const { createInstalledLiveInspectorCoordination } = await import("../../dist/data-layer-installed/runtime.js");
  const coordinationCalls = [];
  const selectedEvent = { id:"event:coordination", name:"page_view", sourceId:"history",
    payload:{ page_type:"product" }, rawInput:[] };
  const coordinationEvaluation = { propertyPath:"/page_type", ruleId:"rule:1", schemaId:"schema:1" };
  const coordinationTrigger = { id:"trigger" };
  const effects = createInstalledLiveInspectorCoordination({
    currentPageUrl:() => "https://shop.example/page",
    writeClipboard:async (text) => { coordinationCalls.push(["clipboard", text]); },
    storeTemplate:(template) => { coordinationCalls.push(["template", template]); },
    defaultDestination:() => "dataLayer",
    onTemplateSaved:(template) => { coordinationCalls.push(["template-saved", template]); },
    schemas:{
      create:(selected) => coordinationCalls.push(["create-schema", selected]),
      createValidation:(selected) => coordinationCalls.push(["create-validation", selected]),
      addPropertyValidation:(selected, path) => coordinationCalls.push(["add-property-validation", selected, path]),
      addPropertyToSchema:(selected, path, control) => coordinationCalls.push(["add-property", selected, path, control]),
      propertyDeclaration:(selected, path) => ({ destination:selected.name, alreadyDeclared:path === "/page_type" }),
      expandAllowedValue:(selected, item, control) => coordinationCalls.push(["expand", selected, item, control]),
      draftContinuation:(selected) => ({ schemaId:"schema:1", schemaName:selected.name, schemaVersion:1, pendingChanges:0,
        addProperty() {}, review() {}, publish() {}, useDifferent() {} }),
      validationAvailable:() => true,
      validationState:() => "Valid",
      manualSchemaChoices:() => [{ id:"schema:1", label:"Page view v1" }],
      selectManualSchema:(eventId, schemaId) => coordinationCalls.push(["manual-schema", eventId, schemaId]),
    },
    defects:{
      startValidationReport:(selected) => coordinationCalls.push(["validation-defect", selected]),
      startOccurrenceReport:(selected, mode) => coordinationCalls.push(["occurrence-defect", selected, mode]),
      openReported:(defectId, selected, issueIndex, control) => coordinationCalls.push(["reported", defectId, selected, issueIndex, control]),
    },
    updateValidation:(eventId, state) => coordinationCalls.push(["validation", eventId, state]),
  });
  assert.deepEqual(Object.keys(effects).sort(), [
    "addPropertyToSchema", "addPropertyValidation", "createSchema", "createValidation", "currentPageUrl",
    "defaultDestination", "draftContinuation", "expandAllowedValue", "manualSchemaChoices", "onTemplateSaved",
    "openReportedDefect", "propertyDeclaration", "selectManualSchema", "startDefectReport",
    "startOccurrenceDefectReport", "storeTemplate", "updateValidation", "validationAvailable", "validationState",
    "writeClipboard",
  ].sort(), "the installed coordination seam must supply every conserved Live Inspector capability");
  effects.createSchema(selectedEvent); effects.createValidation(selectedEvent);
  effects.addPropertyValidation(selectedEvent, "/page_type", coordinationTrigger);
  effects.addPropertyToSchema(selectedEvent, "/page_type", coordinationTrigger);
  effects.expandAllowedValue(selectedEvent, coordinationEvaluation, coordinationTrigger);
  effects.startDefectReport(selectedEvent); effects.startOccurrenceDefectReport(selectedEvent, "Unexpected event");
  effects.openReportedDefect("defect:1", selectedEvent, 2, coordinationTrigger);
  effects.selectManualSchema("event:coordination", "schema:1"); effects.updateValidation("event:coordination", "Valid");
  assert.deepEqual(effects.propertyDeclaration(selectedEvent, "/page_type"), { destination:"page_view", alreadyDeclared:true });
  assert.equal(effects.draftContinuation(selectedEvent).schemaId, "schema:1");
  assert.equal(effects.validationAvailable(selectedEvent), true); assert.equal(effects.validationState(selectedEvent), "Valid");
  assert.deepEqual(effects.manualSchemaChoices(selectedEvent), [{ id:"schema:1", label:"Page view v1" }]);
  assert.deepEqual(coordinationCalls.map(([name]) => name), [
    "create-schema", "create-validation", "add-property-validation", "add-property", "expand",
    "validation-defect", "occurrence-defect", "reported", "manual-schema", "validation",
  ]);
}
