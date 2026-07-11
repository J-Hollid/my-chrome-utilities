import assert from "node:assert/strict";

import {
  createEditableTemplate,
  openPropertyEditor,
  setPushDestination,
} from "../dist/data-layer-event-library-editor.js";
import { pushTemplateToSelectedTarget } from "../dist/data-layer-selected-target-push.js";
import { pushPayloadInPage } from "../dist/data-layer-selected-target-push-page.js";

const template = createEditableTemplate({
  id: "event-1", sessionId: "session-1", sourceId: "history", sourceKind: "page",
  name: "purchase", captureTime: "2026-07-11T10:00:00Z",
  pageUrl: "https://shop.example.test/p/", payload: { transaction_id: "test-123" },
  rawInput: ["purchase"], validation: "Valid", provenance: "captured:history",
}, { name: "Purchase confirmation", destination: "dataLayer", sourceName: "Event history" });
const target = {
  id: "tab:42:window:1", tabId: 42, windowId: 1,
  pageUrl: "https://shop.example.test/p/", title: "Shop", origin: "https://shop.example.test",
  accessState: "Ready",
};

let editor = openPropertyEditor(template);
const calls = [];
const success = await pushTemplateToSelectedTarget(editor, target, async (request) => {
  calls.push(request);
});
assert.equal(success.success, true);
assert.equal(success.result, "Pushed");
assert.match(success.summary, /Shop; https:\/\/shop\.example\.test\/p\/; dataLayer; Pushed/);
assert.deepEqual(calls, [{ tabId: 42, destination: "dataLayer", payload: { transaction_id: "test-123" } }]);
assert.deepEqual(editor.draft, { transaction_id: "test-123" });

const selectedPage = { dataLayer: [], analytics: { queue: [] } };
assert.deepEqual(
  pushPayloadInPage("dataLayer", { transaction_id: "test-123" }, selectedPage),
  { success: true },
);
assert.deepEqual(selectedPage.dataLayer, [{ transaction_id: "test-123" }]);
assert.deepEqual(selectedPage.analytics.queue, []);
assert.deepEqual(
  pushPayloadInPage("missing.queue", {}, selectedPage),
  { success: false, result: "Destination missing.queue is unavailable." },
);

editor = setPushDestination(editor, "analytics[");
const invalid = await pushTemplateToSelectedTarget(editor, target, async () => {
  throw new Error("The target must not be invoked for an invalid destination.");
});
assert.equal(invalid.success, false);
assert.match(invalid.result, /Invalid push destination path/);
assert.match(invalid.fieldError, /Invalid push destination path/);

editor = setPushDestination(editor, "analytics.queue");
const failure = await pushTemplateToSelectedTarget(editor, target, async () => {
  throw new Error("Destination cannot accept payload");
});
assert.equal(failure.success, false);
assert.equal(failure.result, "Destination cannot accept payload");
assert.match(failure.summary, /Shop; https:\/\/shop\.example\.test\/p\/; analytics\.queue; Destination cannot accept payload/);
assert.deepEqual(editor.draft, { transaction_id: "test-123" });
