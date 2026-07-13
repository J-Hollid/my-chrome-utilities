export const GUIDED_CONTINUATION_STORAGE_KEY = "my-chrome-utilities.guided-validation-continuations.v1";
export function continuationEventKey(event) {
    return `${event.sourceId}\u0000${event.name}`;
}
export function restoreGuidedContinuationSelections(serialized) {
    if (!serialized)
        return {};
    try {
        const parsed = JSON.parse(serialized);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
            return {};
        return Object.fromEntries(Object.entries(parsed).filter((entry) => typeof entry[1] === "string"));
    }
    catch {
        return {};
    }
}
export function selectGuidedContinuation(selections, event, schemaId) {
    return { ...selections, [continuationEventKey(event)]: schemaId };
}
export function selectedGuidedContinuation(selections, event, schemas) {
    const schemaId = selections[continuationEventKey(event)];
    return schemas.find((schema) => schema.id === schemaId && Boolean(schema.workingDraft));
}
//# sourceMappingURL=data-layer-guided-validation-continuation.js.map