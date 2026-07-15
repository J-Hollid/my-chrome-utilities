import assert from "node:assert/strict";

import {
  createEditableTemplate,
  openPropertyEditor,
} from "../dist/data-layer-event-library-editor.js";
import {
  pushDestinationPathError,
  pushSavedTemplateToSelectedTarget,
  pushTemplateToSelectedTarget,
} from "../dist/data-layer-selected-target-push.js";
import { pushPayloadInPage } from "../dist/data-layer-selected-target-push-page.js";

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

  const savedSnapshot = structuredClone(template);
  let savedRequest;
  const savedResult = await pushSavedTemplateToSelectedTarget(template, target, async (request) => {
    savedRequest = structuredClone(request);
    request.payload.sample = -1;
    request.payload.nested.parity = -1;
  });
  assert.equal(savedResult.success, true);
  assert.deepEqual(savedRequest, {
    tabId:target.tabId, destination, eventName:"purchase",
    payload:{ sample, nested:{ parity:sample % 2 } },
  }, "saved-template pushes must conserve every generated request field");
  assert.deepEqual(template, savedSnapshot,
    "saved-template pushes must isolate generated payloads from page adapters");
  const repeatedSavedResult = await pushSavedTemplateToSelectedTarget(template, target, async () => {});
  assert.deepEqual(repeatedSavedResult, savedResult,
    "repeating a generated saved-template push must produce deterministic feedback");
  assert.deepEqual(template, savedSnapshot,
    "repeated saved-template pushes must not mutate persisted templates");

  const selectedPage = { dataLayer: { events: [] } };
  const pagePayload = { sample };
  assert.deepEqual(
    pushPayloadInPage("dataLayer.events", "purchase", pagePayload, selectedPage),
    { success: true },
  );
  assert.deepEqual(selectedPage.dataLayer.events, [["purchase", pagePayload]]);
  assert.deepEqual(
    pushPayloadInPage("dataLayer.missing", "purchase", pagePayload, selectedPage),
    { success: false, result: "Destination dataLayer.missing is unavailable." },
  );
}
