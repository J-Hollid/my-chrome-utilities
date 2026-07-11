import assert from "node:assert/strict";

import {
  captureEntry,
  endDataLayerTestingSession,
  startDataLayerTestingSession,
} from "../dist/data-layer-session.js";
import {
  createLiveObserverState,
  recordLiveEvent,
} from "../dist/data-layer-live-observer.js";
import { beginDataLayerTestingSession } from "../dist/data-layer-session-start.js";

const options = {
  id: "tab-42-session-first",
  tabId: 42,
  url: "https://example.test/home",
  historyPath: "event.history",
};
const first = captureEntry(
  startDataLayerTestingSession({}, options),
  { type: "observed", url: options.url, name: "pageview" },
);
const restarted = startDataLayerTestingSession(
  endDataLayerTestingSession(first),
  { ...options, id: "tab-42-session-second" },
);

assert.notEqual(restarted.session?.id, first.session?.id);
assert.equal(restarted.session?.status, "active");
assert.deepEqual(restarted.session?.timeline, []);

const previousLiveState = recordLiveEvent(
  createLiveObserverState({ pageUrl: options.url, sources: [] }),
  {
    id: "old-event",
    name: "pageview",
    sourceId: "event.history",
    captureTime: "now",
  },
);
const coordinated = beginDataLayerTestingSession(
  endDataLayerTestingSession(first),
  previousLiveState,
  { ...options, id: "tab-42-session-coordinated" },
);

assert.equal(coordinated.started, true);
assert.equal(coordinated.sessionState.session?.id, "tab-42-session-coordinated");
assert.deepEqual(coordinated.sessionState.session?.timeline, []);
assert.deepEqual(coordinated.liveObserverState.events, []);

const rejected = beginDataLayerTestingSession(
  coordinated.sessionState,
  previousLiveState,
  { ...options, id: "tab-42-session-rejected" },
);

assert.equal(rejected.started, false);
assert.equal(rejected.liveObserverState, previousLiveState);
