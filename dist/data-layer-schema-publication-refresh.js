import { validateEvent, validateWithSchema, } from "./data-layer-schema-verification.js";
function validatableEvent(event) {
    return {
        sourceId: event.sourceId,
        eventName: event.name,
        payload: event.payload,
        rawInput: event.rawInput,
    };
}
function validationDetails(result) {
    return {
        issues: result.issues,
        evaluations: result.evaluations ?? [],
        ...(result.schema ? { schema: result.schema } : {}),
        ...(result.documentation ? { documentation: result.documentation } : {}),
        ...(result.assignment ? { assignment: result.assignment } : {}),
    };
}
export function revalidateCurrentLiveSession(state, publishedSchemas, manualSchemaOverrides) {
    const snapshot = structuredClone(publishedSchemas);
    const events = state.events.map((event) => {
        const input = validatableEvent(event);
        const manual = snapshot.find(({ id }) => id === manualSchemaOverrides[event.id]);
        const result = manual
            ? validateWithSchema(input, manual, snapshot)
            : validateEvent(input, snapshot, event.pageUrl);
        const { defectTriage: _staleTriage, ...captured } = event;
        return {
            ...captured,
            validation: result.state,
            validationDetails: validationDetails(result),
        };
    });
    return {
        state: { ...state, events },
        revalidatedEventIds: events.map(({ id }) => id),
    };
}
//# sourceMappingURL=data-layer-schema-publication-refresh.js.map