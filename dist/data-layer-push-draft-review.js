const absent = "Not present";
const display = (value) => value === undefined ? absent : typeof value === "string" ? value : JSON.stringify(value);
function changesBetween(previous, pushed, path = "") {
    if (previous === pushed)
        return [];
    const previousRecord = previous !== null && typeof previous === "object";
    const pushedRecord = pushed !== null && typeof pushed === "object";
    if (previousRecord || pushedRecord) {
        const array = Array.isArray(previous) || Array.isArray(pushed);
        const previousEntries = Array.isArray(previous)
            ? Array.from({ length: previous.length }, (_, index) => String(index))
            : previousRecord ? Object.keys(previous) : [];
        const pushedEntries = Array.isArray(pushed)
            ? Array.from({ length: pushed.length }, (_, index) => String(index))
            : pushedRecord ? Object.keys(pushed) : [];
        const keys = [...new Set([...previousEntries, ...pushedEntries])];
        return keys.flatMap((key) => changesBetween(previousRecord ? previous[key] : undefined, pushedRecord ? pushed[key] : undefined, path ? (array ? `${path}[${key}]` : `${path}.${key}`) : key));
    }
    return [{ path, previous: display(previous), pushed: display(pushed), change: previous === undefined ? "added" : pushed === undefined ? "removed" : "changed" }];
}
export function createPushDraftReview(editor, target) {
    const reviewedEditor = structuredClone(editor);
    const reviewedTarget = structuredClone(target);
    return {
        editor: reviewedEditor,
        target: reviewedTarget,
        summary: `${reviewedEditor.template.eventName}; ${reviewedTarget.title}; ${reviewedTarget.pageUrl}; ${reviewedEditor.template.destination}; version ${reviewedEditor.template.version}; ${reviewedEditor.template.validation}.`,
        confirmLabel: `Push ${reviewedEditor.template.eventName} to ${reviewedTarget.title}`,
        rows: [["Event", reviewedEditor.template.eventName], ["Target title", reviewedTarget.title], ["Target URL", reviewedTarget.pageUrl], ["Destination", reviewedEditor.template.destination], ["Version", String(reviewedEditor.template.version)], ["Validation", reviewedEditor.template.validation]],
        changes: changesBetween(reviewedEditor.template.payload, reviewedEditor.draft),
    };
}
//# sourceMappingURL=data-layer-push-draft-review.js.map