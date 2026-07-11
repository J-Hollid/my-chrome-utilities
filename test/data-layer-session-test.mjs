import assert from "node:assert/strict";

import {
  captureEntry,
  endDataLayerTestingSession,
  startDataLayerTestingSession,
} from "../dist/data-layer-session.js";

const options = {
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
  options,
);

assert.notEqual(restarted.session?.id, first.session?.id);
assert.equal(restarted.session?.status, "active");
assert.deepEqual(restarted.session?.timeline, []);
