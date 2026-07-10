import assert from "node:assert/strict";

import {
  adapterActions,
  addObservationSource,
  artifactLifecycle,
  captureSourceInput,
  createSourceManager,
  normalizeAdapterInput,
  removeObservationSource,
  setObservationSourceEnabled,
  sourceFeed,
  sourceSummaries,
} from "../dist/data-layer-observability.js";

const dataLayer = {
  id: "event-history-primary",
  name: "Event history",
  kind: "data-layer",
  destination: "event.history",
  enabled: true,
  status: "Connected",
  capabilities: ["inspect", "save", "validate", "push"],
};

const adobe = {
  id: "adobe-primary",
  name: "Adobe beacons",
  kind: "adobe",
  destination: "/b/ss/collect",
  enabled: true,
  status: "Connected",
  capabilities: ["inspect", "save", "validate"],
};

const tuple = ["pageview", { label: "pageview-values" }];
const normalizedTuple = normalizeAdapterInput(dataLayer, tuple);
assert.equal(normalizedTuple.name, "pageview");
assert.deepEqual(normalizedTuple.payload, { label: "pageview-values" });
assert.deepEqual(normalizedTuple.rawInput, tuple);

const objectInput = { event: "purchase", value: 49.95 };
const normalizedObject = normalizeAdapterInput(dataLayer, objectInput);
assert.equal(normalizedObject.name, "purchase");
assert.deepEqual(normalizedObject.payload, { value: 49.95 });
assert.deepEqual(normalizedObject.rawInput, objectInput);

assert.deepEqual(adapterActions(dataLayer), dataLayer.capabilities);
assert.deepEqual(adapterActions(adobe), adobe.capabilities);
assert.equal(artifactLifecycle("captured event").contentLifecycle, "immutable");
assert.equal(artifactLifecycle("event template").executionBehavior, "pushable when supported");

let manager = createSourceManager([dataLayer, adobe]);
manager = captureSourceInput(manager, "event-history-primary", tuple, {
  eventId: "event-1",
  sessionId: "session-1",
  captureTime: "2026-07-10T10:48:01.100Z",
  sourceTime: "2026-07-10T10:48:03.000Z",
  pageUrl: "https://example.test/",
});
manager = captureSourceInput(manager, "adobe-primary", { event: "beacon", page: "home" }, {
  eventId: "event-2",
  sessionId: "session-1",
  captureTime: "2026-07-10T10:48:03.100Z",
  pageUrl: "https://example.test/",
});

assert.deepEqual(sourceFeed(manager).map(({ id }) => id), ["event-1", "event-2"]);
assert.deepEqual(sourceFeed(manager, "adobe-primary").map(({ id }) => id), ["event-2"]);
assert.deepEqual(sourceSummaries(manager).map(({ name, status }) => ({ name, status })), [
  { name: "Event history", status: "Connected" },
  { name: "Adobe beacons", status: "Connected" },
]);

manager = setObservationSourceEnabled(manager, "event-history-primary", false);
const beforeDisabledCapture = manager.events;
manager = captureSourceInput(manager, "event-history-primary", ["ignored", {}], {
  eventId: "event-3",
  sessionId: "session-1",
  captureTime: "2026-07-10T10:48:04.100Z",
  pageUrl: "https://example.test/",
});
assert.deepEqual(manager.events, beforeDisabledCapture);

manager = addObservationSource(manager, {
  id: "gtag-primary",
  name: "GA4 collect",
  kind: "gtag",
  destination: "/g/collect",
  enabled: true,
  status: "Connected",
  capabilities: ["inspect", "save", "validate", "push"],
});
assert.equal(manager.sources.length, 3);

manager = removeObservationSource(manager, "event-history-primary");
assert.equal(manager.sources.some(({ id }) => id === "event-history-primary"), false);
assert.equal(manager.events.some(({ sourceId }) => sourceId === "event-history-primary"), true);
