import { assignableSchemas, canonicalLivePropertyPath, validateEvent, validateWithSchema } from "../../utilities/data-layer/schemas.js";
import { schemaPropertyAt } from "./schema-model.js";
/** Projects validation and guidance operations for installed consumers. */
export function createGuidedPublicOperations(ports, projections) {
    const guided = ports.guided, validation = ports.validation;
    return { ...projections,
        runGuidedValidation: async () => {
            const event = ports.root?.dataset.eventId;
            if (event) {
                const captured = { id: event, sourceId: "", name: "", pageUrl: "", payload: {}, rawInput: {} };
                ports.flow.open(guided.uiEvent(captured), ports.activeSchemaId() ? ports.candidate(ports.active()) : undefined);
            }
        },
        openGuidedLiveProperty: async (event, path) => {
            guided.propertyReturn = { kind: "capture", eventId: event.id, propertyPath: path, generation: ports.generation() };
            await ports.openProperty(event, guided.selected(event), path, false);
            guided.propertyReturn = { kind: "capture", eventId: event.id, propertyPath: path, generation: ports.generation() };
        },
        livePropertyDeclaration: (event, path) => {
            const schema = guided.selected(event);
            if (!schema?.workingDraft)
                return {};
            const canonical = canonicalLivePropertyPath(path);
            return { destination: schema.name, alreadyDeclared: Boolean(schemaPropertyAt(schema.workingDraft.document, canonical)) };
        },
        liveValidationAvailable: (event) => {
            const schemas = ports.schemas(), manual = schemas.find(({ id }) => id === validation.manualOverrides[event.id]);
            return Boolean(manual ?? validateEvent({ sourceId: event.sourceId, eventName: event.name, payload: event.payload, rawInput: event.rawInput }, schemas, event.pageUrl).schema);
        },
        validateLive: (event) => {
            const schemas = ports.schemas(), input = { sourceId: event.sourceId, eventName: event.name, payload: event.payload, rawInput: event.rawInput };
            const manual = schemas.find(({ id }) => id === validation.manualOverrides[event.id]);
            return manual ? validateWithSchema(input, manual, schemas) : validateEvent(input, schemas, event.pageUrl);
        },
        liveSchemaChoices: () => assignableSchemas(ports.schemas()).map(({ id, name, version }) => ({ id, label: `${name} v${version}` })),
        closeGuided: ports.flow.close, guidedDraft: ports.flow.currentDraft,
        guidedState: () => ({ selections: structuredClone(guided.selections), selectedSchemaPropertyPath: ports.property.selectedPath,
            hasPropertyReturn: Boolean(guided.propertyReturn), dialogListenerCount: guided.dialogListenerCount() }),
        recheckCaptured: (events = []) => validation.recheck(events),
        recordCapturedValidation: (record) => { validation.addRecord(record); validation.render(); },
        reviewCapturedValidationContinuation: (record, trigger) => validation.reviewContinuation(record, trigger),
        setManualSchemaOverride: (eventId, schemaId) => validation.setManualOverride(eventId, schemaId),
    };
}
//# sourceMappingURL=guided-public-operations.js.map