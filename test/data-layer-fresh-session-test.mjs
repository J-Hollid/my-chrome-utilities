import assert from "node:assert/strict";

import {
  freshSessionAvailability,
  restoreFreshSessionLiveObserver,
  startFreshLiveSession,
} from "../dist/data-layer-fresh-session.js";
import { createLiveObserverState, recordLiveEvent, selectLiveEvent, setLiveQuery } from "../dist/data-layer-live-observer.js";

assert.deepEqual(freshSessionAvailability({ eventCount:0, savedThroughEventCount:0, savedSessionMode:false }), {
  available:true,
  unsavedEventCount:0,
  action:"start",
});
assert.deepEqual(freshSessionAvailability({ eventCount:12, savedThroughEventCount:12, savedSessionMode:false }), {
  available:true,
  unsavedEventCount:0,
  action:"start",
});
assert.deepEqual(freshSessionAvailability({ eventCount:12, savedThroughEventCount:9, savedSessionMode:false }), {
  available:true,
  unsavedEventCount:3,
  action:"confirm",
});
assert.deepEqual(freshSessionAvailability({ eventCount:12, savedThroughEventCount:9, savedSessionMode:true }), {
  available:false,
  unsavedEventCount:3,
  action:"unavailable",
});

const events = Array.from({ length:12 }, (_, index) => ({
  id:`event-${index + 1}`,
  name:index === 0 ? "page_view" : "add_to_cart",
  sourceId:"event-history",
  captureTime:`2026-07-14T06:${String(index).padStart(2, "0")}:00Z`,
  pageUrl:"https://shop.test/checkout",
  payload:{ index:index + 1 },
  rawInput:["event", index + 1],
}));
const originalSession = {
  session:{
    id:"tab-7-session-old",
    status:"active",
    tabId:7,
    windowId:2,
    historyPath:"queue.history",
    startUrl:"https://shop.test/checkout",
    currentUrl:"https://shop.test/checkout",
    targetTitle:"Checkout",
    targetOrigin:"https://shop.test",
    timeline:events.map((event) => ({ ...event, type:"observed", url:event.pageUrl, timestamp:event.captureTime, observerPath:"queue.history", rawValue:event.rawInput })),
  },
};
let originalLive = createLiveObserverState({
  pageUrl:"https://shop.test/checkout",
  sources:[
    { id:"event-history", name:"Event history", status:"Connected" },
    { id:"adobe", name:"Adobe beacons", status:"Connected" },
  ],
});
for (const event of events) originalLive = recordLiveEvent(originalLive, event);
originalLive = setLiveQuery(originalLive, { conditions:[{ id:"purchase", field:"Event name", operator:"is", values:["purchase"] }] });
originalLive = selectLiveEvent(originalLive, "event-12", "stacked");
const queue = [["page_view"], ["add_to_cart"]];
const originalObserver = {
  observer:{ status:"ready", historyPath:"queue.history", pageUrl:"https://shop.test/checkout", activeCount:1 },
  pageObject:{ queue:{ history:queue } },
  observedEntries:[{ event:events[0] }, { event:events[1] }],
  sourceEvents:events,
  sessionState:originalSession,
  subscription:{ imported:new Set(["existing-boundary"]), activeCount:1 },
};

const fresh = startFreshLiveSession(originalSession, originalLive, originalObserver, "tab-7-session-fresh");
assert.equal(fresh.started, true);
assert.equal(fresh.sessionState.session.id, "tab-7-session-fresh");
assert.equal(fresh.sessionState.session.freshBoundary, true);
assert.notEqual(fresh.sessionState.session.id, originalSession.session.id);
assert.deepEqual(fresh.sessionState.session.timeline, []);
assert.deepEqual({
  tabId:fresh.sessionState.session.tabId,
  windowId:fresh.sessionState.session.windowId,
  historyPath:fresh.sessionState.session.historyPath,
  currentUrl:fresh.sessionState.session.currentUrl,
  targetTitle:fresh.sessionState.session.targetTitle,
  targetOrigin:fresh.sessionState.session.targetOrigin,
}, {
  tabId:7,
  windowId:2,
  historyPath:"queue.history",
  currentUrl:"https://shop.test/checkout",
  targetTitle:"Checkout",
  targetOrigin:"https://shop.test",
});
assert.deepEqual(fresh.liveObserverState.events, []);
assert.equal(fresh.liveObserverState.query, undefined);
assert.equal(fresh.liveObserverState.filter, undefined);
assert.equal(fresh.liveObserverState.inspectorEventId, undefined);
assert.equal(fresh.liveObserverState.listVisible, true);
assert.equal(fresh.liveObserverState.status, "Live");
assert.deepEqual(fresh.liveObserverState.sources, originalLive.sources);
assert.deepEqual(fresh.observerState.sourceEvents, []);
assert.deepEqual(fresh.observerState.observedEntries, []);
assert.equal(fresh.observerState.pageObject, originalObserver.pageObject);
assert.equal(fresh.observerState.subscription, originalObserver.subscription);
assert.equal(fresh.observerState.sessionState, fresh.sessionState);
assert.equal(originalSession.session.timeline.length, 12);
assert.equal(originalLive.events.length, 12);

const purchase = {
  id:"purchase-1",
  name:"purchase",
  sourceId:"event-history",
  sourceKind:"Data Layer",
  pageUrl:"https://shop.test/checkout",
  captureTime:"2026-07-14T06:20:00Z",
  payload:{ order_id:"123" },
  rawInput:["purchase", { order_id:"123" }],
};
const persistedFresh = {
  session:{
    ...fresh.sessionState.session,
    timeline:[{ ...purchase, type:"observed", url:purchase.pageUrl, timestamp:purchase.captureTime, observerPath:"queue.history", rawValue:purchase.rawInput }],
  },
};
const restored = restoreFreshSessionLiveObserver(fresh.liveObserverState, persistedFresh);
assert.deepEqual(restored.events.map(({ id, name }) => ({ id, name })), [{ id:"purchase-1", name:"purchase" }]);
assert.equal(restored.events.some(({ name }) => name === "page_view" || name === "add_to_cart"), false);
assert.equal(restored.sources.length, 2);

const ordinaryRestored = restoreFreshSessionLiveObserver(fresh.liveObserverState, originalSession);
assert.deepEqual(ordinaryRestored.events, []);
