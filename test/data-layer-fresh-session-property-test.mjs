import assert from "node:assert/strict";

import {
  freshSessionAvailability,
  restoreFreshSessionLiveObserver,
  startFreshLiveSession,
} from "../dist/data-layer-fresh-session.js";
import { createLiveObserverState } from "../dist/data-layer-live-observer.js";

let seed = 0x9e3779b9;

function nextInt(limit) {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed % limit;
}

for (let sample = 0; sample < 200; sample += 1) {
  const eventCount = nextInt(80);
  const savedThroughEventCount = nextInt(100);
  const savedSessionMode = sample % 4 === 0;
  const unsavedEventCount = Math.max(0, eventCount - savedThroughEventCount);
  assert.deepEqual(freshSessionAvailability({ eventCount, savedThroughEventCount, savedSessionMode }), {
    available:!savedSessionMode,
    unsavedEventCount,
    action:savedSessionMode ? "unavailable" : unsavedEventCount > 0 ? "confirm" : "start",
  }, "availability must conserve the unsaved-event boundary without exposing archive mutation");

  const tabId = nextInt(500) + 1;
  const originalSession = {
    session:{
      id:`session:${sample}:before`,
      status:"active",
      tabId,
      windowId:nextInt(30) + 1,
      historyPath:`queue${sample}.history`,
      startUrl:`https://shop.test/start/${sample}`,
      currentUrl:`https://shop.test/current/${sample}`,
      targetTitle:`Target ${sample}`,
      targetOrigin:"https://shop.test",
      warningMetadata:`preserved only outside the fresh session ${sample}`,
      timeline:Array.from({ length:eventCount }, (_, index) => ({ type:"observed", id:`old:${sample}:${index}`, url:"https://shop.test/old" })),
    },
  };
  const originalLive = {
    ...createLiveObserverState({
      pageUrl:originalSession.session.currentUrl,
      sources:[{ id:"event-history", name:"Event history", status:"Connected" }],
    }),
    status:"Paused",
    events:Array.from({ length:eventCount }, (_, index) => ({
      id:`old:${sample}:${index}`,
      name:"old_event",
      sourceId:"event-history",
      captureTime:`2026-07-14T06:${String(index % 60).padStart(2, "0")}:00Z`,
    })),
    filter:{ kind:"event name", value:"old" },
    query:{ conditions:[{ id:"old", field:"Event name", operator:"is", values:["old_event"] }] },
    inspectorEventId:eventCount ? `old:${sample}:${eventCount - 1}` : undefined,
    listVisible:false,
  };
  const pageObject = { [`queue${sample}`]:{ history:["existing"] } };
  const subscription = { imported:new Set([`boundary:${sample}`]), activeCount:1 };
  const originalObserver = {
    observer:{ status:"ready", historyPath:originalSession.session.historyPath, pageUrl:originalSession.session.currentUrl, activeCount:1 },
    pageObject,
    observedEntries:[{ id:"old-entry" }],
    sourceEvents:[{ id:"old-source" }],
    sessionState:originalSession,
    subscription,
  };
  const sessionSnapshot = structuredClone(originalSession);
  const liveSnapshot = structuredClone(originalLive);

  const fresh = startFreshLiveSession(originalSession, originalLive, originalObserver, `session:${sample}:fresh`);
  assert.equal(fresh.started, true);
  assert.deepEqual(originalSession, sessionSnapshot, "starting fresh must not mutate the prior persisted session");
  assert.deepEqual(originalLive, liveSnapshot, "starting fresh must not mutate the prior feed state");
  assert.deepEqual(fresh.sessionState.session, {
    id:`session:${sample}:fresh`,
    status:"active",
    freshBoundary:true,
    tabId,
    historyPath:originalSession.session.historyPath,
    startUrl:originalSession.session.currentUrl,
    currentUrl:originalSession.session.currentUrl,
    windowId:originalSession.session.windowId,
    targetTitle:originalSession.session.targetTitle,
    targetOrigin:originalSession.session.targetOrigin,
    timeline:[],
  }, "a fresh boundary must retain target attachment and discard prior feed state");
  assert.deepEqual(fresh.liveObserverState, {
    view:"Live",
    status:"Live",
    pageUrl:originalSession.session.currentUrl,
    sources:originalLive.sources,
    events:[],
    listVisible:true,
  }, "fresh Live state must reset filters, queries, selection, events, pause state, and layout");
  assert.equal(fresh.observerState.pageObject, pageObject);
  assert.equal(fresh.observerState.subscription, subscription);
  assert.deepEqual(fresh.observerState.observedEntries, []);
  assert.deepEqual(fresh.observerState.sourceEvents, []);
  assert.equal(fresh.observerState.sessionState, fresh.sessionState);

  const restoredEntries = Array.from({ length:nextInt(12) }, (_, index) => ({
    type:"observed",
    id:`new:${sample}:${index}`,
    name:index % 2 ? "purchase" : "page_view",
    sourceId:"event-history",
    sourceKind:"Data Layer",
    url:originalSession.session.currentUrl,
    pageUrl:originalSession.session.currentUrl,
    timestamp:`2026-07-14T07:${String(index).padStart(2, "0")}:00Z`,
    payload:{ sample, index },
    rawInput:["event", index],
  }));
  const persistedFresh = {
    session:{ ...fresh.sessionState.session, timeline:[...restoredEntries, { type:"marker", id:"ignored" }] },
  };
  const restored = restoreFreshSessionLiveObserver(originalLive, persistedFresh);
  assert.deepEqual(restored.events.map(({ id }) => id), restoredEntries.map(({ id }) => id), "reload must restore only post-boundary observed events in order");
  assert.deepEqual(restored.events.map(({ payload }) => payload), restoredEntries.map(({ payload }) => payload), "reload must conserve post-boundary payloads");
  assert.deepEqual(restored.sources, originalLive.sources, "reload must retain observation sources");
  assert.equal(restored.status, "Live");
  assert.equal(restored.query, undefined);
  assert.equal(restored.filter, undefined);
  assert.equal(restored.inspectorEventId, undefined);

  const ended = { session:{ ...originalSession.session, status:"ended" } };
  const notStarted = startFreshLiveSession(ended, originalLive, originalObserver, `session:${sample}:unused`);
  assert.deepEqual(notStarted, { sessionState:ended, liveObserverState:originalLive, observerState:originalObserver, started:false });
  assert.equal(restoreFreshSessionLiveObserver(originalLive, originalSession), originalLive, "ordinary sessions must bypass fresh-boundary restoration");
}

console.log("fresh live session properties: 200 generated cases passed");
