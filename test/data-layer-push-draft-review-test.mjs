import assert from "node:assert/strict";

import { createPushDraftReview } from "../dist/data-layer-push-draft-review.js";

const editor = {
  template: { eventName: "purchase", destination: "queue.history", version: 3, validation: "Valid" },
  draft: { transaction_id: "test-456" },
};
const target = { title: "Signal Shop", pageUrl: "https://signal.example.test/checkout" };
const review = createPushDraftReview(editor, target);
editor.draft.transaction_id = "changed-after-review";
target.title = "Different target";
assert.equal(review.editor.draft.transaction_id, "test-456");
assert.equal(review.target.title, "Signal Shop");
assert.equal(review.confirmLabel, "Push purchase to Signal Shop");
assert.match(review.summary, /queue\.history; version 3; Valid/);
