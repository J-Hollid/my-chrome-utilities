import assert from "node:assert/strict";

import {
  createEditableTemplate,
  openPropertyEditor,
} from "../dist/data-layer-event-library-editor.js";
import {
  pushDestinationPathError,
  pushTemplateToSelectedTarget,
} from "../dist/data-layer-selected-target-push.js";

const target = {
  id: "tab:1:window:1",
  tabId: 1,
  windowId: 1,
  pageUrl: "https://example.test/",
  title: "Example",
  origin: "https://example.test",
  accessState: "Ready",
};

for (let sample = 0; sample < 100; sample += 1) {
  const destination = `dataLayer.events${sample}`;
  const template = createEditableTemplate({
    id: `event-${sample}`,
    sessionId: "session",
    sourceId: "source",
    sourceKind: "page",
    name: "purchase",
    captureTime: "2026-01-01T00:00:00Z",
    pageUrl: "https://example.test/",
    payload: { sample, nested: { parity: sample % 2 } },
    rawInput: {},
    validation: "Valid",
    provenance: "captured:test",
  }, { name: "Purchase", destination, sourceName: "Source" });
  const editor = openPropertyEditor(template);

  assert.equal(pushDestinationPathError(destination), undefined);
  for (const invalid of ["", "dataLayer[0]", "__proto__.events", "constructor", "events.prototype"]) {
    assert.match(pushDestinationPathError(invalid) ?? "", /Invalid push destination path/);
  }

  const result = await pushTemplateToSelectedTarget(editor, target, async (request) => {
    assert.equal(request.eventName, "purchase");
    request.payload.sample = -1;
  });
  assert.equal(result.success, true);
  assert.equal(editor.draft.sample, sample);
  assert.equal(editor.draft.nested.parity, sample % 2);
}
