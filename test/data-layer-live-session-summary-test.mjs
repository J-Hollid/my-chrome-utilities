import assert from "node:assert/strict";

import { createLiveSessionSummary } from "../dist/data-layer-live-session-summary.js";

const fields = {
  targetPage: "Checkout",
  pageUrl: "https://shop.example.test/checkout",
  observerPath: "event.history",
  capturedEventCount: 42,
  connectedSourceCount: 3,
};

assert.deepEqual(createLiveSessionSummary({ ...fields, testingState: "Active", observerStatus: "Connected" }), {
  statusLabel: "Capturing",
  observerStatus: "Connected",
  ...fields,
});
assert.equal(
  createLiveSessionSummary({ ...fields, testingState: "Paused", observerStatus: "Error" }).statusLabel,
  "Paused",
);
assert.equal(
  createLiveSessionSummary({ ...fields, testingState: "Ended", observerStatus: "Disconnected" }).statusLabel,
  "Ended",
);
