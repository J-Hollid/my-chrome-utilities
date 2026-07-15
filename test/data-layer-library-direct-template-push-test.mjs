import assert from "node:assert/strict";

import { createEditableTemplate } from "../dist/data-layer-event-library-editor.js";
import { pushSavedTemplateToSelectedTarget } from "../dist/data-layer-selected-target-push.js";

const template = createEditableTemplate({
  id: "purchase-v3", sessionId: "session-1", sourceId: "history", sourceKind: "page",
  name: "purchase", captureTime: "2026-07-15T10:00:00Z",
  pageUrl: "https://signal-shop.example/checkout",
  payload: { transaction_id: "test-123" }, rawInput: ["purchase"],
  validation: "Valid", provenance: "captured:history",
}, { name: "Purchase confirmation v3", destination: "dataLayer", sourceName: "Event history" });
const target = {
  id: "tab:42:window:1", tabId: 42, windowId: 1,
  pageUrl: "https://signal-shop.example/checkout", title: "Signal Shop",
  origin: "https://signal-shop.example", accessState: "Ready",
};

const original = structuredClone(template);
const calls = [];
const success = await pushSavedTemplateToSelectedTarget(template, target, async (request) => {
  calls.push(request);
  request.payload.transaction_id = "changed by adapter";
});
assert.equal(success.success, true);
assert.match(success.result, /Pushed Purchase confirmation v3 to Signal Shop/);
assert.match(success.summary, /dataLayer/);
assert.deepEqual(calls[0], {
  tabId: 42, destination: "dataLayer", eventName: "purchase",
  payload: { transaction_id: "changed by adapter" },
});
assert.deepEqual(template, original);

const noTarget = await pushSavedTemplateToSelectedTarget(template, undefined, async () => {
  throw new Error("must not push without a target");
});
assert.equal(noTarget.result, "Select a target before pushing");

const unavailable = await pushSavedTemplateToSelectedTarget(
  template,
  { ...target, accessState: "Permission required" },
  async () => { throw new Error("must not push to an unavailable target"); },
);
assert.equal(unavailable.result, "Request access for Signal Shop");

const invalidTemplate = { ...template, destination: "dataLayer[0]" };
const invalid = await pushSavedTemplateToSelectedTarget(invalidTemplate, target, async () => {
  throw new Error("must not push an invalid destination");
});
assert.equal(invalid.result, "Invalid push destination path dataLayer[0]");

const failure = await pushSavedTemplateToSelectedTarget(template, target, async () => {
  throw new Error("injection details should remain internal");
});
assert.equal(failure.result, "Push to Signal Shop failed");
assert.deepEqual(template, original);
