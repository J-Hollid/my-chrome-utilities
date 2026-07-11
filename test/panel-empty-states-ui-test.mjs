import assert from "node:assert/strict";

import { renderPanelEmptyState } from "../dist/panel-empty-states-ui.js";

const elements = {
  container: { hidden: true },
  heading: { textContent: "" },
  detail: { textContent: "" },
  recovery: { textContent: "" },
};
renderPanelEmptyState(elements, {
  message: "No templates match these filters",
  recoveryAction: "Clear filters",
});
assert.equal(elements.container.hidden, false);
assert.equal(elements.heading.textContent, "No templates match these filters");
assert.equal(elements.detail.textContent, "Clear filters can resolve this state.");
assert.equal(elements.recovery.textContent, "Clear filters");

renderPanelEmptyState(elements, undefined);
assert.equal(elements.container.hidden, true);
