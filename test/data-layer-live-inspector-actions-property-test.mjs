import assert from "node:assert/strict";

import {
  createLiveInspectorActions,
  runLiveInspectorAction,
} from "../dist/data-layer-live-inspector-actions.js";

for (let sample = 0; sample < 100; sample += 1) {
  const event = {
    id: `event-${sample}`,
    name: `event ${sample}`,
    sourceId: `source-${sample % 4}`,
    captureTime: `2026-01-01T00:00:${String(sample % 60).padStart(2, "0")}Z`,
    payload: { sample, nested: { parity: sample % 2 } },
    validation: sample % 2 === 0 ? "Not checked" : "Valid",
  };
  const nextValidation = sample % 3 === 0 ? event.validation : "2 issues";
  const updates = [];
  const actions = createLiveInspectorActions({
    currentPageUrl: () => "https://example.test/fallback",
    writeClipboard: async () => {},
    storeTemplate: () => {},
    validationState: () => nextValidation,
    updateValidation: (eventId, validation) => updates.push([eventId, validation]),
  });

  const feedback = [];
  await runLiveInspectorAction("Validate", event, actions.validate, (message) => {
    feedback.push(message);
  });

  assert.equal(feedback[0], "");
  if (nextValidation === event.validation) {
    assert.deepEqual(updates, []);
    assert.equal(feedback.at(-1), `Validate failed for ${event.name}.`);
  } else {
    assert.deepEqual(updates, [[event.id, nextValidation]]);
    assert.equal(feedback.at(-1), `Validate completed for ${event.name}.`);
  }
}
