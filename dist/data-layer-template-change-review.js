import { createPushDraftReview } from "./data-layer-push-draft-review.js";
export function createTemplateChangeReview(editor, kind) {
    const proposedLabel = kind === "revision" ? "Revised" : "Pushed";
    const payload = createPushDraftReview(editor, { id: "review", tabId: 0, windowId: 0, title: "active target", pageUrl: "", origin: "", accessState: "Ready" }).changes;
    const changed = (label, previous, proposed) => previous === proposed ? [] : [[label, previous, proposed]];
    return {
        kind,
        proposedLabel,
        operation: kind === "revision" ? "Save revision" : "Push draft",
        resultingVersion: editor.template.version + (kind === "revision" ? 1 : 0),
        rows: [["Operation", kind === "revision" ? "Save revision" : "Push draft"], ["Current version", String(editor.template.version)], ["Resulting version", String(editor.template.version + (kind === "revision" ? 1 : 0))], ["Validation", editor.template.validation]],
        identity: [
            ...changed("Template name", editor.savedTemplate?.name ?? editor.template.name, editor.template.name),
            ...changed("Event name", editor.savedTemplate?.eventName ?? editor.template.eventName, editor.template.eventName),
        ],
        execution: changed("Destination", editor.savedTemplate?.destination ?? editor.template.destination, editor.template.destination),
        changes: payload,
    };
}
//# sourceMappingURL=data-layer-template-change-review.js.map