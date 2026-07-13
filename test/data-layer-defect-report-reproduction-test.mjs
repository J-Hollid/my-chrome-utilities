import assert from "node:assert/strict";

import {
  addManualReproductionStep,
  adjustManualReproductionStep,
  moveManualReproductionStep,
  removeManualReproductionStep,
  reproductionStepPreview,
} from "../dist/data-layer-defect-report.js";

const anchors = [
  { kind: "pathname", visitId: "products", pathname: "/products", text: "1. Visit /products" },
  { kind: "pathname", visitId: "checkout", pathname: "/checkout", text: "2. Visit /checkout" },
];

assert.equal(reproductionStepPreview({ kind: "click", componentName: "Checkout", description: "sticky footer button" }), "Click Checkout — sticky footer button");
assert.equal(reproductionStepPreview({ kind: "click", componentName: "Product card" }), "Click Product card");
assert.equal(reproductionStepPreview({ kind: "click", componentName: "" }), undefined);
assert.equal(reproductionStepPreview({ kind: "login", persona: "returning customer" }), "Log in as returning customer");
assert.equal(reproductionStepPreview({ kind: "login", persona: "" }), undefined);
assert.equal(reproductionStepPreview({ kind: "scroll", target: "bottom" }), "Scroll to the bottom of the page");
assert.equal(reproductionStepPreview({ kind: "scroll", target: "top" }), "Scroll to the top of the page");
assert.equal(reproductionStepPreview({ kind: "scroll", target: "component", detail: "Order summary" }), "Scroll to Order summary");
assert.equal(reproductionStepPreview({ kind: "scroll", target: "custom", detail: "middle of results" }), "Scroll to the middle of results");
assert.equal(reproductionStepPreview({ kind: "custom", text: "Apply the free delivery filter" }), "Apply the free delivery filter");
assert.equal(reproductionStepPreview({ kind: "custom", text: " " }), undefined);

const clicked = addManualReproductionStep(anchors, "products", "manual-click", {
  kind: "click", componentName: "Checkout", description: "sticky footer button",
});
assert.deepEqual(clicked.map(({ text }) => text), [
  "1. Visit /products",
  "2. Click Checkout — sticky footer button",
  "3. Visit /checkout",
]);
assert.deepEqual(clicked[1].template, { kind: "click", componentName: "Checkout", description: "sticky footer button" });

const adjusted = adjustManualReproductionStep(clicked, "manual-click", {
  kind: "click", componentName: "Checkout", description: "primary checkout action",
});
assert.deepEqual(adjusted.map(({ text }) => text), [
  "1. Visit /products",
  "2. Click Checkout — primary checkout action",
  "3. Visit /checkout",
]);
assert.equal(adjusted.filter(({ id }) => id === "manual-click").length, 1);
assert.deepEqual(removeManualReproductionStep(adjusted, "manual-click"), anchors);

const withTwoManualSteps = addManualReproductionStep(clicked, "products", "manual-scroll", { kind: "scroll", target: "bottom" });
assert.deepEqual(withTwoManualSteps.map(({ text }) => text), [
  "1. Visit /products",
  "2. Click Checkout — sticky footer button",
  "3. Scroll to the bottom of the page",
  "4. Visit /checkout",
]);
const reordered = moveManualReproductionStep(withTwoManualSteps, "manual-scroll", "earlier");
assert.deepEqual(reordered.map(({ text }) => text), [
  "1. Visit /products",
  "2. Scroll to the bottom of the page",
  "3. Click Checkout — sticky footer button",
  "4. Visit /checkout",
]);
assert.deepEqual(moveManualReproductionStep(reordered, "manual-scroll", "earlier"), reordered);
assert.deepEqual(anchors, [
  { kind: "pathname", visitId: "products", pathname: "/products", text: "1. Visit /products" },
  { kind: "pathname", visitId: "checkout", pathname: "/checkout", text: "2. Visit /checkout" },
]);
