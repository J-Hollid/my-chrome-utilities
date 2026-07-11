import assert from "node:assert/strict";

import {
  canonicalLiveObserverStatus,
  createLiveSessionSummary,
} from "../dist/data-layer-live-session-summary.js";
import { createLiveNotificationController } from "../dist/data-layer-live-notifications.js";
import { copyLivePageUrl } from "../dist/data-layer-live-session-summary-actions.js";
import { renderLiveSessionSummary } from "../dist/data-layer-live-session-summary-ui.js";

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
assert.deepEqual(
  ["attached", "needs sync", "page access unavailable", "inactive"]
    .map(canonicalLiveObserverStatus),
  ["Connected", "Waiting for path", "Error", "Disconnected"],
);

const elements = {
  sessionStatus: { textContent: "", dataset: {} },
  observerStatus: { textContent: "", dataset: {} },
  targetPage: { textContent: "" },
  pageUrl: { textContent: "" },
  observerPath: { textContent: "" },
  capturedEventCount: { textContent: "" },
  connectedSourceCount: { textContent: "" },
  copyPageUrlButton: { disabled: true },
};
const summary = createLiveSessionSummary({
  ...fields,
  testingState: "Active",
  observerStatus: "Connected",
});
renderLiveSessionSummary(elements, summary);

assert.equal(elements.sessionStatus.textContent, "Capturing");
assert.equal(elements.sessionStatus.dataset.status, "capturing");
assert.equal(elements.observerStatus.textContent, "Connected");
assert.equal(elements.observerStatus.dataset.status, "connected");
assert.equal(elements.targetPage.textContent, fields.targetPage);
assert.equal(elements.pageUrl.textContent, fields.pageUrl);
assert.equal(elements.observerPath.textContent, fields.observerPath);
assert.equal(elements.capturedEventCount.textContent, "42");
assert.equal(elements.connectedSourceCount.textContent, "3");
assert.equal(elements.copyPageUrlButton.disabled, false);

for (const [observerStatus, dataStatus] of [
  ["Connected", "connected"],
  ["Waiting for path", "waiting-for-path"],
  ["Error", "error"],
  ["Disconnected", "disconnected"],
]) {
  renderLiveSessionSummary(elements, createLiveSessionSummary({
    ...fields,
    testingState: "Ended",
    observerStatus,
  }));
  assert.equal(elements.observerStatus.textContent, observerStatus);
  assert.equal(elements.observerStatus.dataset.status, dataStatus);
}

let copiedValue;
assert.equal(
  await copyLivePageUrl(fields.pageUrl, async (value) => { copiedValue = value; }),
  "copied",
);
assert.equal(copiedValue, fields.pageUrl);
assert.equal(await copyLivePageUrl("", async () => {}), "unavailable");
assert.equal(await copyLivePageUrl(fields.pageUrl, async () => { throw new Error("denied"); }), "failed");

const notifications = [];
const scheduled = [];
const notificationController = createLiveNotificationController(
  (message) => notifications.push(message),
  (clear, delayMs) => scheduled.push({ clear, delayMs }),
);
notificationController.announce("Testing started");
notificationController.announce("Capture paused");
scheduled[0].clear();
assert.deepEqual(notifications, ["Testing started", "Capture paused"]);
scheduled[1].clear();
assert.deepEqual(notifications, ["Testing started", "Capture paused", ""]);
assert.equal(scheduled[1].delayMs, 4000);
