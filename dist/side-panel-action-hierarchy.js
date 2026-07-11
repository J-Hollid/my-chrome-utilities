export function actionTreatment(variant) {
    return { variant, disabled: false };
}
export function templateActionHierarchy(editor) {
    return {
        saveRevision: editor.jsonError
            ? {
                variant: "primary",
                disabled: true,
                disabledReason: "Correct the JSON draft.",
            }
            : editor.dirty
                ? actionTreatment("primary")
                : { variant: "primary", disabled: true, disabledReason: "The draft has no unsaved changes." },
        pushDraft: editor.jsonError
            ? {
                variant: editor.dirty ? "secondary" : "primary",
                disabled: true,
                disabledReason: "Correct the JSON draft.",
            }
            : actionTreatment(editor.dirty ? "secondary" : "primary"),
        discardDraft: actionTreatment("destructive"),
    };
}
//# sourceMappingURL=side-panel-action-hierarchy.js.map