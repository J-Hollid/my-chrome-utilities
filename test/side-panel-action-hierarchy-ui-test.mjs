import assert from "node:assert/strict";

import { applyActionTreatment } from "../dist/side-panel-action-hierarchy-ui.js";

function fakeButton() {
  const attributes = new Map();
  return {
    attributes,
    dataset: {},
    disabled: false,
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
  };
}

const button = fakeButton();
applyActionTreatment(button, {
  variant: "primary",
  disabled: true,
  disabledReason: "A ready target must be selected.",
}, "start-testing-reason");
assert.equal(button.dataset.actionVariant, "primary");
assert.equal(button.disabled, true);
assert.equal(button.attributes.get("aria-description"), "A ready target must be selected.");
assert.equal(button.attributes.get("aria-describedby"), "start-testing-reason");

applyActionTreatment(button, { variant: "secondary", disabled: false }, "start-testing-reason");
assert.equal(button.dataset.actionVariant, "secondary");
assert.equal(button.disabled, false);
assert.equal(button.attributes.has("aria-description"), false);
assert.equal(button.attributes.has("aria-describedby"), false);
