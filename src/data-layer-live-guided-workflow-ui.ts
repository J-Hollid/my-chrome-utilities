import type { LiveGuidedWorkflow, LiveSetupStepId } from "./data-layer-live-guided-workflow.js";
import { applyActionTreatment } from "./side-panel-action-hierarchy.js";

export interface LiveGuidedWorkflowElements {
  setupSteps: HTMLOListElement | null;
  stepElements: Partial<Record<LiveSetupStepId, HTMLLIElement | null>>;
  chooseTargetButton: HTMLButtonElement | null;
  startTestingButton: HTMLButtonElement | null;
}

export function findLiveGuidedWorkflowElements(
  root: ParentNode = document,
): LiveGuidedWorkflowElements {
  return {
    setupSteps: root.querySelector<HTMLOListElement>("#live-setup-steps"),
    stepElements: {
      target: root.querySelector<HTMLLIElement>("#live-setup-target"),
      readiness: root.querySelector<HTMLLIElement>("#live-setup-readiness"),
      session: root.querySelector<HTMLLIElement>("#live-setup-session"),
    },
    chooseTargetButton: root.querySelector<HTMLButtonElement>("#choose-observation-target"),
    startTestingButton: root.querySelector<HTMLButtonElement>("#start-data-layer-testing"),
  };
}

export function renderLiveGuidedWorkflow(
  elements: LiveGuidedWorkflowElements,
  workflow: LiveGuidedWorkflow,
): void {
  if (elements.setupSteps) elements.setupSteps.hidden = !workflow.setupVisible;
  for (const step of workflow.steps) {
    const element = elements.stepElements[step.id];
    if (!element) continue;
    element.textContent = step.label;
    element.dataset.state = step.state;
    if (step.state === "current") element.setAttribute("aria-current", "step");
    else element.removeAttribute("aria-current");
  }
  if (elements.chooseTargetButton) {
    elements.chooseTargetButton.hidden = !workflow.chooseTargetVisible;
  }
  if (elements.startTestingButton) {
    elements.startTestingButton.textContent = workflow.startTestingLabel;
    applyActionTreatment(elements.startTestingButton, workflow.startTestingEnabled
      ? { variant: "primary", disabled: false }
      : {
        variant: "primary",
        disabled: true,
        disabledReason: "A ready target must be selected.",
      }, "start-testing-reason");
  }
}
