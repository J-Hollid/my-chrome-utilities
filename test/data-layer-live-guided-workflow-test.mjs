import assert from "node:assert/strict";

import { liveGuidedWorkflow } from "../dist/data-layer-live-guided-workflow.js";
import { renderLiveGuidedWorkflow } from "../dist/data-layer-live-guided-workflow-ui.js";

const noTarget = liveGuidedWorkflow({
  activeSession: false,
  pathStatus: "Selection required",
});
assert.equal(noTarget.steps.find(({ state }) => state === "current")?.id, "target");
assert.equal(noTarget.startTestingEnabled, false);
assert.equal(noTarget.chooseTargetVisible, true);

const selectedWaiting = liveGuidedWorkflow({
  activeSession: false,
  selectedTarget: { title: "Checkout", accessState: "Ready" },
  pathStatus: "Checking target…",
});
assert.equal(selectedWaiting.steps.find(({ state }) => state === "current")?.id, "readiness");
assert.equal(selectedWaiting.startTestingEnabled, false);
assert.equal(selectedWaiting.chooseTargetVisible, true);

const ready = liveGuidedWorkflow({
  activeSession: false,
  selectedTarget: { title: "Checkout", accessState: "Ready" },
  pathStatus: "ready",
});
assert.equal(ready.steps.find(({ state }) => state === "current")?.id, "session");
assert.equal(ready.startTestingEnabled, true);
assert.equal(ready.startTestingLabel, "Start testing Checkout");

const active = liveGuidedWorkflow({
  activeSession: true,
  selectedTarget: { title: "Checkout", accessState: "Ready" },
  pathStatus: "ready",
});
assert.equal(active.setupVisible, false);
assert.equal(active.chooseTargetVisible, false);
assert.equal(active.startTestingEnabled, false);

function stepElement() {
  const attributes = new Map();
  return {
    textContent: "",
    dataset: {},
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    getAttribute: (name) => attributes.get(name),
  };
}
const elements = {
  setupSteps: { hidden: true },
  stepElements: {
    target: stepElement(),
    readiness: stepElement(),
    session: stepElement(),
  },
  chooseTargetButton: { hidden: true },
  startTestingButton: {
    disabled: true,
    textContent: "",
    setAttribute(name, value) { this[name] = value; },
  },
};
renderLiveGuidedWorkflow(elements, ready);
assert.equal(elements.setupSteps.hidden, false);
assert.equal(elements.stepElements.session.getAttribute("aria-current"), "step");
assert.equal(elements.stepElements.target.dataset.state, "complete");
assert.equal(elements.chooseTargetButton.hidden, false);
assert.equal(elements.startTestingButton.disabled, false);
assert.equal(elements.startTestingButton.textContent, "Start testing Checkout");
