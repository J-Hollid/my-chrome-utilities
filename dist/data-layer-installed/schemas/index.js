import { SCHEMA_LIBRARY_STORAGE_KEY, discardSchemaWorkingDraft, publishSchemaWorkingDraft, restoreSchemaLibrary, serializeSchemaLibrary, updateSchemaWorkingDraft, validateEvent, } from "../../utilities/data-layer/schemas.js";
export function createSchemasInstalledController(ports) {
    let mounted = false;
    let schemas = restoreSchemaLibrary(ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY));
    let activeSchemaId;
    const activeIndex = () => schemas.findIndex(({ id }) => id === activeSchemaId);
    const active = () => {
        const schema = schemas[activeIndex()];
        if (!schema)
            throw new Error("Open a schema before editing its draft");
        return schema;
    };
    const persist = () => {
        ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(schemas));
        ports.changed(schemas);
    };
    const replaceActive = (schema) => {
        const index = activeIndex();
        if (index < 0)
            throw new Error("Open a schema before editing its draft");
        schemas = schemas.map((candidate, candidateIndex) => candidateIndex === index ? schema : candidate);
    };
    return {
        mount() { mounted = true; },
        dispose() { mounted = false; },
        open(id) {
            if (!schemas.some((schema) => schema.id === id))
                throw new Error(`Unknown schema ${id}`);
            activeSchemaId = id;
        },
        beginDraft() { replaceActive(updateSchemaWorkingDraft(active(), {})); persist(); },
        updateDraft(changes, change) {
            replaceActive(updateSchemaWorkingDraft(active(), changes, change));
            persist();
        },
        publish() { const published = publishSchemaWorkingDraft(active()); replaceActive(published); persist(); return structuredClone(published); },
        discard() { replaceActive(discardSchemaWorkingDraft(active())); persist(); },
        add(schema) { schemas = [...schemas, structuredClone(schema)]; activeSchemaId = schema.id; persist(); },
        replace(next) { schemas = structuredClone([...next]); if (!schemas.some(({ id }) => id === activeSchemaId))
            activeSchemaId = undefined; persist(); },
        validate: (event) => validateEvent(event, schemas),
        runGuidedValidation: () => ports.runGuidedValidation(activeSchemaId),
        schemas: () => structuredClone(schemas),
        state: () => ({ ...(activeSchemaId ? { activeSchemaId } : {}), draftDirty: Boolean(activeSchemaId && active().workingDraft),
            schemaCount: schemas.length, mounted }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "schemas",
    capabilities: ["schema and rule libraries", "drafts", "assignments", "validation", "guided validation"],
});
//# sourceMappingURL=index.js.map