import assert from "node:assert/strict";

import {
  createLiveObserverState,
  closeLiveInspector,
  dataLayerViewForNavigationKey,
  dataLayerViews,
  filteredLiveEvents,
  liveEventWindow,
  pauseCapture,
  recordLiveEvent,
  resetLiveObserverForSession,
  resumeCapture,
  selectLiveEvent,
  setLiveFilter,
  setLiveQuery,
  updateLiveSourceStatus,
} from "../dist/data-layer-live-observer.js";
assert.equal(dataLayerViewForNavigationKey("Live", "ArrowRight"), "Library");
assert.deepEqual(dataLayerViews, ["Live", "Library", "Sessions", "Defects", "Schemas"]);
assert.equal(dataLayerViewForNavigationKey("Sessions", "ArrowRight"), "Defects");
assert.equal(dataLayerViewForNavigationKey("Defects", "ArrowRight"), "Schemas");
assert.equal(dataLayerViewForNavigationKey("Defects", "ArrowLeft"), "Sessions");
assert.equal(dataLayerViewForNavigationKey("Schemas", "ArrowRight"), "Live");
assert.equal(dataLayerViewForNavigationKey("Schemas", "Home"), "Live");
assert.equal(dataLayerViewForNavigationKey("Live", "End"), "Schemas");

let state = createLiveObserverState({
  pageUrl: "https://example.test/checkout",
  sources: [{ id: "history", name: "Event history", status: "Connected" }],
});
state = recordLiveEvent(state, { id: "one", name: "pageview", sourceId: "history", captureTime: "2026-07-10T10:00:00Z" });
state = pauseCapture(state);
const paused = recordLiveEvent(state, { id: "two", name: "purchase", sourceId: "history", captureTime: "2026-07-10T10:00:01Z" });
assert.equal(paused.events.length, 1);
assert.equal(paused.status, "Paused");
state = resumeCapture(paused);
state = recordLiveEvent(state, { id: "two", name: "purchase", sourceId: "history", captureTime: "2026-07-10T10:00:01Z" });
assert.equal(state.events.length, 2);
assert.equal(state.status, "Live");

state = updateLiveSourceStatus(state, "history", "Path missing");
assert.equal(state.sources[0].status, "Path missing");
assert.equal(state.sources[0].restartVisible, true);

state = setLiveFilter(state, { kind: "event name", value: "purchase" });
assert.deepEqual(filteredLiveEvents(state).map(({ id }) => id), ["two"]);
assert.deepEqual(liveEventWindow({ ...state, filter: undefined }, 1).map(({ id }) => id), ["two"]);

const richEvents = {
  ...state,
  events: [
    { ...state.events[0], sourceName: "Event history", validation: "Valid" },
    { ...state.events[1], sourceName: "Adobe beacons", validation: "2 issues" },
    { id:"three", name:"warning", sourceId:"history", captureTime:"2026-07-10T10:00:02Z", validation:"1 warnings" },
    { id:"four", name:"unchecked", sourceId:"history", captureTime:"2026-07-10T10:00:03Z", validation:"Not checked" },
    { id:"five", name:"ambiguous", sourceId:"history", captureTime:"2026-07-10T10:00:04Z", validation:"Assignment error" },
  ],
};
assert.deepEqual(
  filteredLiveEvents(setLiveFilter(richEvents, { kind: "source", value: "Adobe beacons" })).map(({ id }) => id),
  ["two"],
);
assert.deepEqual(
  filteredLiveEvents(setLiveFilter(richEvents, { kind: "validation state", value: "2 issues" })).map(({ id }) => id),
  ["two"],
);
assert.deepEqual(filteredLiveEvents(setLiveFilter(richEvents, { kind:"validation state", value:"warnings" })).map(({ id }) => id), ["three"]);
assert.deepEqual(filteredLiveEvents(setLiveFilter(richEvents, { kind:"validation state", value:"Valid" })).map(({ id }) => id), ["one"]);
assert.deepEqual(filteredLiveEvents(setLiveFilter(richEvents, { kind:"validation state", value:"Not checked" })).map(({ id }) => id), ["four"]);
assert.deepEqual(filteredLiveEvents(setLiveFilter(richEvents, { kind:"validation state", value:"Assignment error" })).map(({ id }) => id), ["five"]);

let queried = setLiveQuery(richEvents, { conditions: [{ id:"names", field:"Event name", operator:"is", values:["purchase"] }] });
assert.deepEqual(filteredLiveEvents(queried).map(({ id }) => id), ["two"]);
queried = recordLiveEvent(queried, { id:"six", name:"checkout", sourceId:"history", captureTime:"2026-07-10T10:00:05Z" });
queried = recordLiveEvent(queried, { id:"seven", name:"purchase", sourceId:"history", captureTime:"2026-07-10T10:00:06Z" });
assert.deepEqual(filteredLiveEvents(queried).map(({ id }) => id), ["two", "seven"]);
assert.equal(selectLiveEvent(queried, "two", "stacked").query.conditions[0].values[0], "purchase");

state = selectLiveEvent(state, "two", "stacked");
assert.equal(state.inspectorEventId, "two");
assert.equal(state.listVisible, false);
state = selectLiveEvent(state, "two", "split");
assert.equal(state.listVisible, true);
state = closeLiveInspector(state);
assert.equal(state.inspectorEventId, undefined);
assert.equal(state.listVisible, true);
state = resetLiveObserverForSession(pauseCapture(state));
assert.deepEqual(state.events, []);
assert.equal(state.filter, undefined);
assert.equal(state.query, undefined);
assert.equal(state.inspectorEventId, undefined);
assert.equal(state.listVisible, true);
assert.equal(state.status, "Live");
