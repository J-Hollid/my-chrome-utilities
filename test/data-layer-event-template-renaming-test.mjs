import assert from "node:assert/strict";
import {
  beginTemplateRename,
  renameValidation,
  saveTemplateRename,
} from "../dist/data-layer-event-template-renaming.js";
import {
  restoreEventTemplateLibrary,
  serializeEventTemplateLibrary,
} from "../dist/data-layer-event-library-editor.js";

const template = {
  id: "template-7", name: "Purchase confirmation", eventName: "purchase",
  sourceId: "event-history", sourceName: "Event history", destination: "queue.history",
  tags: ["checkout"], schemaId: "purchase", validation: "Valid",
  payload: { transaction_id: "T-1" }, version: 3,
  originatingSessionId: "session-1", originatingEventId: "event-1", provenance: "captured:event-history",
};
const editor = { template, revisions: [], draft: structuredClone(template.payload), jsonDraft: JSON.stringify(template.payload), dirty: false };

assert.deepEqual(beginTemplateRename(template), {
  templateName: "Purchase confirmation", eventName: "purchase",
});
assert.deepEqual(renameValidation({ templateName: "   ", eventName: "purchase" }), {
  templateName: "Enter a template name",
});
assert.deepEqual(renameValidation({ templateName: "Purchase confirmation", eventName: "   " }), {
  eventName: "Enter an event name",
});
assert.deepEqual(renameValidation({ templateName: "Checkout purchase", eventName: "purchase" }), {});

const renamedTitle = saveTemplateRename(editor, {
  templateName: "Checkout purchase", eventName: "purchase",
});
assert.equal(renamedTitle.template.name, "Checkout purchase");
assert.equal(renamedTitle.template.eventName, "purchase");
assert.equal(renamedTitle.template.version, 4);
assert.deepEqual(renamedTitle.revisions, [template]);
assert.deepEqual(renamedTitle.template.payload, template.payload);
assert.equal(renamedTitle.template.destination, template.destination);
assert.deepEqual(renamedTitle.template.tags, template.tags);
assert.equal(renamedTitle.template.schemaId, template.schemaId);
assert.equal(renamedTitle.template.provenance, template.provenance);

const renamedEvent = saveTemplateRename(editor, {
  templateName: "Completed checkout", eventName: "checkout_completed",
});
assert.equal(renamedEvent.template.name, "Completed checkout");
assert.equal(renamedEvent.template.eventName, "checkout_completed");
assert.equal(renamedEvent.revisions[0].eventName, "purchase");
const restoredRename = restoreEventTemplateLibrary(
  serializeEventTemplateLibrary([renamedEvent.template]),
)[0];
assert.deepEqual(restoredRename.revisionHistory, [template]);
assert.throws(
  () => saveTemplateRename(editor, { templateName: "", eventName: "purchase" }),
  /Enter a template name/,
);
