import assert from "node:assert/strict";

import { createLiveSessionSummary } from "../dist/data-layer-live-session-summary.js";
import { copyLivePageUrl } from "../dist/data-layer-live-session-summary-actions.js";
import { renderLiveSessionSummary } from "../dist/data-layer-live-session-summary-ui.js";

const fields = {
  targetPage: "Checkout",
  pageUrl: "https://shop.example.test/checkout",
  observerPath: "event.history",
  capturedEventCount: 42,
  connectedSourceCount: 3,
};

assert.deepEqual(createLiveSessionSummary({ ...fields, testingState: "Active" }), {
  statusLabel: "Capturing",
  ...fields,
});
assert.equal(
  createLiveSessionSummary({ ...fields, testingState: "Paused" }).statusLabel,
  "Paused",
);
assert.equal(
  createLiveSessionSummary({ ...fields, testingState: "Detached" }).statusLabel,
  "Detached",
);

const elements = {
  sessionStatus: { textContent: "", dataset: {} },
  targetPage: { textContent: "" },
  pageUrl: { textContent: "" },
  observerPath: { textContent: "" },
  capturedEventCount: { textContent: "" },
  connectedSourceCount: { textContent: "" },
  copyPageUrlButton: { disabled: true },
};
const summary = createLiveSessionSummary({ ...fields, testingState: "Active" });
renderLiveSessionSummary(elements, summary);

assert.equal(elements.sessionStatus.textContent, "Capturing");
assert.equal(elements.sessionStatus.dataset.status, "capturing");
assert.equal(elements.targetPage.textContent, fields.targetPage);
assert.equal(elements.pageUrl.textContent, fields.pageUrl);
assert.equal(elements.observerPath.textContent, fields.observerPath);
assert.equal(elements.capturedEventCount.textContent, "42");
assert.equal(elements.connectedSourceCount.textContent, "3");
assert.equal(elements.copyPageUrlButton.disabled, false);

let copiedValue;
assert.equal(
  await copyLivePageUrl(fields.pageUrl, async (value) => { copiedValue = value; }),
  "copied",
);
assert.equal(copiedValue, fields.pageUrl);
assert.equal(await copyLivePageUrl("", async () => {}), "unavailable");
assert.equal(await copyLivePageUrl(fields.pageUrl, async () => { throw new Error("denied"); }), "failed");
