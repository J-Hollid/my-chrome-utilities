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
//# sourceMappingURL=side-panel-action-hierarchy.js.map