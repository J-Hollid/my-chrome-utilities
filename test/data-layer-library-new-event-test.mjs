import assert from "node:assert/strict";
import {
  createNewEventEditor,
  newEventValidation,
  saveNewEvent,
  setNewEventField,
  updateDraftJson,
} from "../dist/data-layer-event-library-editor.js";

let editor = createNewEventEditor();
assert.equal(editor.isNew, true);
assert.equal(editor.template.name, "");
assert.equal(editor.template.eventName, "");
assert.equal(editor.template.sourceId, "");
assert.equal(editor.template.destination, "");
assert.deepEqual(editor.draft, {});
assert.deepEqual(newEventValidation(editor), {
  name: "Enter a template name",
  eventName: "Enter an event name",
  source: "Select an event source",
  destination: "Enter a destination path",
});

editor = setNewEventField(editor, "name", "Scroll milestone");
editor = setNewEventField(editor, "eventName", "scroll");
editor = setNewEventField(editor, "source", { id: "event-history", name: "Event history" });
editor = setNewEventField(editor, "destination", "event.history");
editor = updateDraftJson(editor, '{"scroll_percentage":25}');
assert.deepEqual(newEventValidation(editor), {});
const created = saveNewEvent(editor, () => "template:library:new");
assert.deepEqual(created, {
  id: "template:library:new", name: "Scroll milestone", eventName: "scroll",
  sourceId: "event-history", sourceName: "Event history", destination: "event.history",
  tags: [], validation: "Not checked", payload: { scroll_percentage: 25 }, version: 1,
  provenance: "library-created",
});
assert.equal("originatingEventId" in created, false);
assert.equal("originatingSessionId" in created, false);
