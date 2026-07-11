import assert from "node:assert/strict";

import { endLiveSession } from "../dist/data-layer-live-session-end.js";
import { createObservationTarget, restoreAttachedObservationTarget } from "../dist/data-layer-observation-targets.js";

const target = createObservationTarget({
  tabId: 42,
  windowId: 7,
  pageUrl: "https://shop.example.test/checkout",
  title: "Checkout",
});
const ended = endLiveSession(
  { session: { id: "test", status: "active", tabId: 42, historyPath: "event.history", startUrl: target.pageUrl, currentUrl: target.pageUrl, timeline: [] } },
  restoreAttachedObservationTarget(target),
);

assert.equal(ended.sessionState.session?.status, "ended");
assert.equal(ended.targetState.sessionState, "Detached");
assert.equal(ended.targetState.attachedTargetId, undefined);
