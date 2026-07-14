import { createEditableTemplate, } from "./data-layer-event-library-editor.js";
export function createLiveInspectorActions(effects) {
    return {
        async copyPayload(event) {
            await effects.writeClipboard(JSON.stringify(event.payload));
        },
        saveToLibrary(event) {
            const template = createEditableTemplate({
                id: event.id,
                sessionId: event.sessionId ?? "live",
                sourceId: event.sourceId,
                sourceKind: event.sourceKind ?? "page",
                name: event.name,
                captureTime: event.captureTime,
                pageUrl: event.pageUrl ?? effects.currentPageUrl(),
                payload: event.payload,
                rawInput: event.rawInput ?? event,
                validation: event.validation ?? "Not checked",
                provenance: event.provenance ?? "live",
            }, {
                name: event.name,
                destination: event.destination ?? "event.history",
                sourceName: event.sourceName ?? event.sourceId,
            });
            effects.storeTemplate(template);
            effects.onTemplateSaved?.(template);
        },
        ...(effects.createSchema ? { createSchema(event) { effects.createSchema?.(event); } } : {}),
        ...(effects.createValidation ? { createValidation(event) { effects.createValidation?.(event); } } : {}),
        ...(effects.addPropertyValidation ? { addPropertyValidation(event, path, trigger) { effects.addPropertyValidation?.(event, path, trigger); } } : {}),
        ...(effects.draftContinuation ? { draftContinuation(event) { return effects.draftContinuation?.(event); } } : {}),
        ...(effects.startDefectReport ? { startDefectReport(event) { effects.startDefectReport?.(event); } } : {}),
        ...(effects.openReportedDefect ? { openReportedDefect(defectId, event, issueIndex, trigger) { effects.openReportedDefect?.(defectId, event, issueIndex, trigger); } } : {}),
        validationAvailability(event) {
            return effects.validationAvailable?.(event) === false
                ? { enabled: false, reason: "Select a schema to validate" }
                : { enabled: true };
        },
        validate(event) {
            const previous = event.validation ?? "Not checked";
            const next = effects.validationState(event);
            if (next === previous) {
                throw new Error("Validation did not change the event state.");
            }
            effects.updateValidation(event.id, next);
        },
        manualSchemaChoices(event) { return effects.manualSchemaChoices?.(event) ?? []; },
        selectManualSchema(eventId, schemaId) { effects.selectManualSchema?.(eventId, schemaId); },
    };
}
export async function runLiveInspectorAction(label, event, action, report) {
    report("");
    try {
        await action(event);
        report(`${label} completed for ${event.name}.`);
    }
    catch {
        report(`${label} failed for ${event.name}.`);
    }
}
//# sourceMappingURL=data-layer-live-inspector-actions.js.map