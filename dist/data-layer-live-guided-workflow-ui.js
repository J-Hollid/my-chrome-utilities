import { applyActionTreatment } from "./side-panel-action-hierarchy.js";
export function findLiveGuidedWorkflowElements(root = document) {
    return {
        setupSteps: root.querySelector("#live-setup-steps"),
        stepElements: {
            target: root.querySelector("#live-setup-target"),
            readiness: root.querySelector("#live-setup-readiness"),
            session: root.querySelector("#live-setup-session"),
        },
        chooseTargetButton: root.querySelector("#choose-observation-target"),
        startTestingButton: root.querySelector("#start-data-layer-testing"),
    };
}
export function renderLiveGuidedWorkflow(elements, workflow) {
    if (elements.setupSteps)
        elements.setupSteps.hidden = !workflow.setupVisible;
    for (const step of workflow.steps) {
        const element = elements.stepElements[step.id];
        if (!element)
            continue;
        element.textContent = step.label;
        element.dataset.state = step.state;
        if (step.state === "current")
            element.setAttribute("aria-current", "step");
        else
            element.removeAttribute("aria-current");
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
//# sourceMappingURL=data-layer-live-guided-workflow-ui.js.map