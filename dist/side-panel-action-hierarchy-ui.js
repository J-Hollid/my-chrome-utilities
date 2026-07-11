export function applyActionTreatment(button, treatment, descriptionId) {
    if (!button)
        return;
    button.dataset.actionVariant = treatment.variant;
    button.disabled = treatment.disabled;
    if (treatment.disabledReason) {
        button.setAttribute("aria-description", treatment.disabledReason);
        if (descriptionId) {
            button.setAttribute("aria-describedby", descriptionId);
            const description = typeof document === "undefined"
                ? null
                : document.getElementById(descriptionId);
            if (description)
                description.textContent = treatment.disabledReason;
        }
        return;
    }
    button.removeAttribute("aria-description");
    if (descriptionId)
        button.removeAttribute("aria-describedby");
}
//# sourceMappingURL=side-panel-action-hierarchy-ui.js.map