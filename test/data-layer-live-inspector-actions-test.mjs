import assert from "node:assert/strict";

import {
  createLiveInspectorActions,
  runLiveInspectorAction,
} from "../dist/data-layer-live-inspector-actions.js";

const selectedEvent = {
  id: "purchase-1",
  sessionId: "session-1",
  name: "purchase",
  sourceId: "history",
  sourceName: "Event history",
  sourceKind: "page",
  captureTime: "2026-07-11T00:00:00Z",
  pageUrl: "https://example.test/checkout",
  destination: "event.history",
  payload: { transaction_id: 1234 },
  rawInput: ["purchase", { transaction_id: 1234 }],
  validation: "Not checked",
  provenance: "captured:event-history",
};
const clipboardWrites = [];
const storedTemplates = [];
const validationUpdates = [];
let releaseClipboard;
const clipboardPending = new Promise((resolve) => { releaseClipboard = resolve; });
const inspectorActions = createLiveInspectorActions({
  currentPageUrl: () => "https://example.test/fallback",
  writeClipboard: async (text) => {
    clipboardWrites.push(text);
    await clipboardPending;
  },
  storeTemplate: (template) => { storedTemplates.push(template); },
  validationAvailable: () => false,
  validationState: () => "2 issues",
  updateValidation: (eventId, validation) => {
    validationUpdates.push([eventId, validation]);
  },
});
assert.deepEqual(inspectorActions.validationAvailability(selectedEvent), {
  enabled: false,
  reason: "Select a schema to validate",
});

const copyFeedback = [];
const copyRun = runLiveInspectorAction(
  "Copy payload",
  selectedEvent,
  inspectorActions.copyPayload,
  (message) => { copyFeedback.push(message); },
);
assert.deepEqual(copyFeedback, [""]);
assert.deepEqual(clipboardWrites, ['{"transaction_id":1234}']);
releaseClipboard();
await copyRun;
assert.equal(copyFeedback.at(-1), "Copy payload completed for purchase.");

const saveFeedback = [];
await runLiveInspectorAction(
  "Save to Library",
  selectedEvent,
  inspectorActions.saveToLibrary,
  (message) => { saveFeedback.push(message); },
);
assert.equal(storedTemplates.length, 1);
assert.equal(storedTemplates[0].originatingEventId, selectedEvent.id);
assert.equal(saveFeedback.at(-1), "Save to Library completed for purchase.");

const validationFeedback = [];
await runLiveInspectorAction(
  "Validate",
  selectedEvent,
  inspectorActions.validate,
  (message) => { validationFeedback.push(message); },
);
assert.deepEqual(validationUpdates, [[selectedEvent.id, "2 issues"]]);
assert.equal(validationFeedback.at(-1), "Validate completed for purchase.");

const failedFeedback = [];
await runLiveInspectorAction(
  "Validate",
  { ...selectedEvent, validation: "2 issues" },
  inspectorActions.validate,
  (message) => { failedFeedback.push(message); },
);
assert.deepEqual(validationUpdates, [[selectedEvent.id, "2 issues"]]);
assert.equal(failedFeedback.at(-1), "Validate failed for purchase.");
