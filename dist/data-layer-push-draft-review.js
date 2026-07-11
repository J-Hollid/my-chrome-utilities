export function createPushDraftReview(editor, target) {
    const reviewedEditor = structuredClone(editor);
    const reviewedTarget = structuredClone(target);
    return {
        editor: reviewedEditor,
        target: reviewedTarget,
        summary: `${reviewedEditor.template.eventName}; ${reviewedTarget.title}; ${reviewedTarget.pageUrl}; ${reviewedEditor.template.destination}; version ${reviewedEditor.template.version}; ${reviewedEditor.template.validation}.`,
        confirmLabel: `Push ${reviewedEditor.template.eventName} to ${reviewedTarget.title}`,
    };
}
//# sourceMappingURL=data-layer-push-draft-review.js.map