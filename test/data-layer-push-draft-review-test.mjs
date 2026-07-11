import assert from "node:assert/strict";

import { createPushDraftReview } from "../dist/data-layer-push-draft-review.js";

const editor = {
  template: { eventName: "purchase", destination: "queue.history", version: 3, validation: "Valid", payload: { ecommerce: { value: 18 }, items: [{ quantity: 1 }], legacy: { debug: true } } },
  draft: { ecommerce: { value: 19 }, items: [{ quantity: 2 }], experiment: { variant: "treatment-b" } },
};
const target = { title: "Signal Shop", pageUrl: "https://signal.example.test/checkout" };
const review = createPushDraftReview(editor, target);
editor.draft.ecommerce.value = 20;
target.title = "Different target";
assert.equal(review.editor.draft.ecommerce.value, 19);
assert.equal(review.target.title, "Signal Shop");
assert.equal(review.confirmLabel, "Push purchase to the active target");
assert.match(review.summary, /queue\.history; version 3; Valid/);
assert.deepEqual(review.rows, [["Event", "purchase"], ["Target title", "Signal Shop"], ["Target URL", "https://signal.example.test/checkout"], ["Destination", "queue.history"], ["Version", "3"], ["Validation", "Valid"]]);
assert.deepEqual(review.changes, [
  { path: "ecommerce.value", previous: "18", pushed: "19", change: "changed" },
  { path: "items[0].quantity", previous: "1", pushed: "2", change: "changed" },
  { path: "legacy.debug", previous: "true", pushed: "Not present", change: "removed" },
  { path: "experiment.variant", previous: "Not present", pushed: "treatment-b", change: "added" },
]);
