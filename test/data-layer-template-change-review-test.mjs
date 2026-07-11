import assert from "node:assert/strict";
import { openPropertyEditor, setPushDestination, setTemplateIdentity, updateDraftJson } from "../dist/data-layer-event-library-editor.js";
import { createTemplateChangeReview } from "../dist/data-layer-template-change-review.js";

const template = { id:"template-7", name:"Purchase confirmation", eventName:"purchase", sourceId:"event-history", sourceName:"Event history", destination:"event.history", tags:[], validation:"Valid", payload:{ ecommerce:{ value:18 }, legacy:{ debug:true } }, version:3, provenance:"captured:event-history" };
let editor = openPropertyEditor(template);
editor = setTemplateIdentity(editor, "name", "Completed checkout");
editor = setTemplateIdentity(editor, "eventName", "checkout_completed");
editor = setPushDestination(editor, "queue.history");
editor = updateDraftJson(editor, '{"ecommerce":{"value":19},"experiment":{"variant":"treatment-b"}}');
const revision = createTemplateChangeReview(editor, "revision");
const push = createTemplateChangeReview(editor, "push");
assert.equal(revision.resultingVersion, 4);
assert.equal(revision.proposedLabel, "Revised");
assert.deepEqual(revision.identity, [["Template name", "Purchase confirmation", "Completed checkout"], ["Event name", "purchase", "checkout_completed"]]);
assert.deepEqual(revision.execution, [["Destination", "event.history", "queue.history"]]);
assert.deepEqual(revision.changes, [
  { path:"ecommerce.value", previous:"18", pushed:"19", change:"changed" },
  { path:"legacy.debug", previous:"true", pushed:"Not present", change:"removed" },
  { path:"experiment.variant", previous:"Not present", pushed:"treatment-b", change:"added" },
]);
assert.equal(push.resultingVersion, 3);
assert.equal(push.proposedLabel, "Pushed");
