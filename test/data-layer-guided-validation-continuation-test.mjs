import assert from "node:assert/strict";

import {
  continuationEventKey,
  restoreGuidedContinuationSelections,
  selectGuidedContinuation,
  selectedGuidedContinuation,
} from "../dist/data-layer-guided-validation-continuation.js";

const pageview = { id:"event:7", sourceId:"event-history", name:"pageview" };
const product = { id:"schema-product-listing", name:"Product listing", version:3, workingDraft:{ pendingChanges:["one", "two"] } };
const checkout = { id:"schema-checkout", name:"Checkout", version:2, workingDraft:{ pendingChanges:["one"] } };
const publishedOnly = { id:"schema-published", name:"Published", version:1 };

assert.equal(continuationEventKey(pageview), "event-history\u0000pageview");
const selected = selectGuidedContinuation({}, pageview, product.id);
assert.deepEqual(selected, { "event-history\u0000pageview":"schema-product-listing" });
assert.equal(selectedGuidedContinuation(selected, pageview, [product, checkout, publishedOnly]), product);
assert.equal(selectedGuidedContinuation(selectGuidedContinuation(selected, pageview, checkout.id), pageview, [product, checkout]), checkout);
assert.equal(selectedGuidedContinuation(selected, pageview, [publishedOnly]), undefined);
assert.deepEqual(restoreGuidedContinuationSelections(JSON.stringify(selected)), selected);
assert.deepEqual(restoreGuidedContinuationSelections("not json"), {});
assert.deepEqual(restoreGuidedContinuationSelections(JSON.stringify([product.id])), {});
