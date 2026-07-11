export function actionTreatment(variant) {
    return { variant, disabled: false };
}
export function templateActionHierarchy(editor) {
    return {
        saveRevision: editor.dirty
            ? actionTreatment("primary")
            : { variant: "primary", disabled: true, disabledReason: "The draft has no unsaved changes." },
        pushDraft: editor.jsonError
            ? {
                variant: editor.dirty ? "secondary" : "primary",
                disabled: true,
                disabledReason: "The JSON draft must be valid.",
            }
            : actionTreatment(editor.dirty ? "secondary" : "primary"),
        discardDraft: actionTreatment("destructive"),
    };
}
export function applyActionTreatment(button, treatment, descriptionId) {
    if (!button)
        return;
    button.dataset.actionVariant = treatment.variant;
    button.disabled = treatment.disabled;
    if (treatment.disabledReason) {
        button.setAttribute("aria-description", treatment.disabledReason);
        if (descriptionId)
            button.setAttribute("aria-describedby", descriptionId);
    }
    else {
        button.removeAttribute("aria-description");
        if (descriptionId)
            button.removeAttribute("aria-describedby");
    }
}
//# sourceMappingURL=side-panel-action-hierarchy.js.map