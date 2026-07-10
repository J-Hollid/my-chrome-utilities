import assert from "node:assert/strict";

import {
  canonicalCapturedEvent,
  compactCaptureTime,
  conciseValuePreview,
  importExistingHistory,
  importedOnce,
  markImported,
  nextSubscription,
  requestIsCurrent,
  stopSubscription,
} from "../dist/data-layer-event-presentation.js";
import {
  appendObservedHistoryEntry,
  attachHistoryArrayObserver,
  stopHistoryArrayObserver,
} from "../dist/data-layer-observer.js";
import { startDataLayerTestingSession } from "../dist/data-layer-session.js";

const context = {
  sessionId: "session-1",
  sourceId: "event-history",
  sourceKind: "Data Layer",
  pageUrl: "https://example.test/",
  destination: "event.history",
};
const existingInputs = [
  ["pageview", { a: 1 }],
  ["offer_view", { a: 2 }],
  7,
];
const imported = importExistingHistory(
  context,
  existingInputs,
  "2026-07-10T15:04:44.850Z",
);
assert.deepEqual(
  imported.map(({ name }) => name),
  ["pageview", "offer_view", "Unknown event"],
);
assert.equal(new Set(imported.map(({ id }) => id)).size, 3);
assert.equal(imported[2].sourceTime, undefined);
existingInputs[0][1].a = -1;
assert.deepEqual(imported[0].payload, { a: 1 });

const objectInput = { event: "purchase", value: 1 };
const objectEvent = canonicalCapturedEvent(context, objectInput, "now", 4);
objectInput.value = -1;
assert.equal(objectEvent.name, "purchase");
assert.deepEqual(objectEvent.payload, { value: 1 });
assert.deepEqual(objectEvent.rawInput, { event: "purchase", value: 1 });

let subscription = nextSubscription(
  { imported: new Set(), activeCount: 0 },
  context.pageUrl,
  context.destination,
  "first",
);
subscription = nextSubscription(
  subscription,
  context.pageUrl,
  context.destination,
  "second",
);
assert.equal(requestIsCurrent(subscription, "first"), false);
subscription = markImported(
  subscription,
  context.pageUrl,
  context.destination,
  2,
);
assert.equal(
  importedOnce(subscription, context.pageUrl, context.destination, 1),
  true,
);
assert.equal(stopSubscription(subscription).activeCount, 0);
assert.equal(compactCaptureTime("2026-07-10T15:04:44.850Z"), "15:04:44");
assert.equal(conciseValuePreview({ transaction_id: 1234 }), "transaction_id 1234");

const firstPage = {
  event: {
    history: [
      ["pageview", { page: "home" }],
      ["offer_view", { offer: "summer" }],
    ],
  },
};
const sessionState = startDataLayerTestingSession(
  {},
  {
    tabId: 1,
    url: context.pageUrl,
    historyPath: context.destination,
  },
);
const recoveredObserverState = attachHistoryArrayObserver(
  { pageObject: firstPage, sessionState, sourceEvents: [] },
  {
    historyPath: context.destination,
    pageUrl: context.pageUrl,
    pageObject: firstPage,
    requestId: "recovery",
    importExisting: false,
  },
);
assert.equal(recoveredObserverState.sourceEvents.length, 0);
let observerState = attachHistoryArrayObserver(
  { pageObject: firstPage, sessionState, sourceEvents: [] },
  {
    historyPath: context.destination,
    pageUrl: context.pageUrl,
    pageObject: firstPage,
    requestId: "initial",
  },
);
assert.deepEqual(
  observerState.sourceEvents.map(({ name }) => name),
  ["pageview", "offer_view"],
);
assert.deepEqual(
  observerState.sessionState.session.timeline.map(({ id }) => id),
  observerState.sourceEvents.map(({ id }) => id),
);

observerState = attachHistoryArrayObserver(observerState, {
  historyPath: context.destination,
  pageUrl: context.pageUrl,
  pageObject: firstPage,
  requestId: "restart",
});
assert.equal(observerState.sourceEvents.length, 2);
assert.equal(observerState.subscription.activeCount, 1);

observerState = appendObservedHistoryEntry(
  observerState,
  { event: "purchase", transaction_id: 1234 },
  "2026-07-10T15:04:46.488Z",
);
assert.equal(observerState.sourceEvents.length, 3);
assert.equal(observerState.sourceEvents[2].name, "purchase");
assert.equal(observerState.sessionState.session.timeline.length, 3);

observerState = attachHistoryArrayObserver(observerState, {
  historyPath: context.destination,
  pageUrl: context.pageUrl,
  pageObject: firstPage,
  requestId: "restart-after-push",
});
assert.equal(observerState.sourceEvents.length, 3);

const checkoutUrl = "https://example.test/checkout";
observerState = attachHistoryArrayObserver(observerState, {
  historyPath: context.destination,
  pageUrl: checkoutUrl,
  pageObject: { event: { history: [["pageview", { page: "checkout" }]] } },
  requestId: "navigation",
});
assert.equal(observerState.sourceEvents.length, 4);
assert.deepEqual(
  observerState.sourceEvents
    .filter(({ name }) => name === "pageview")
    .map(({ pageUrl }) => pageUrl),
  [context.pageUrl, checkoutUrl],
);
assert.equal(stopHistoryArrayObserver(observerState).subscription.activeCount, 0);
