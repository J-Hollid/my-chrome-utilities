import { discardSchemaWorkingDraft, updateSchemaWorkingDraft, validateEvent, validateWithSchema } from "../../utilities/data-layer/schemas.js";
/** Projects library and draft lifecycle operations without owning their state. */
export function createSchemaLibraryPublicOperations(ports) {
    const library = ports.library, commit = (schema) => {
        library.replaceActive(schema);
        ports.persist();
        ports.render();
    };
    return {
        open: (id) => {
            if (!library.schemas.some((schema) => schema.id === id))
                throw new Error(`Unknown schema ${id}`);
            library.activeSchemaId = id;
            library.draft = structuredClone(ports.active());
            ports.render();
        },
        beginDraft: () => commit(updateSchemaWorkingDraft(ports.active(), {})),
        updateDraft: (changes, change) => commit(updateSchemaWorkingDraft(ports.active(), changes, change)),
        publish: () => structuredClone(ports.publish()),
        discard: () => commit(discardSchemaWorkingDraft(ports.active())),
        add: (schema) => {
            library.schemas = [...library.schemas, structuredClone(schema)];
            library.activeSchemaId = schema.id;
            library.draft = structuredClone(schema);
            ports.persist();
            ports.render();
        },
        replace: (next) => {
            library.schemas = structuredClone([...next]);
            if (!library.schemas.some(({ id }) => id === library.activeSchemaId)) {
                library.activeSchemaId = undefined;
                library.draft = undefined;
            }
            ports.persist();
            ports.render();
        },
        validate: (event) => validateEvent(event, library.schemas),
        validateAgainstSchema: (event, schemaId) => {
            const schema = library.schemas.find((candidate) => candidate.id === schemaId);
            if (!schema)
                return { message: "Select a schema to refresh Library draft validation." };
            const result = validateWithSchema(event, schema, library.schemas);
            return { message: `Library draft validation: ${result.state} · ${schema.name} v${schema.version}.`, result };
        },
        reviewLibraryImport: (serialized) => library.reviewImport(serialized),
        requestDeletion: (id) => library.requestDeletion(id),
        openExportChoices: (schemaId) => {
            if (!ports.exportButton)
                return false;
            const schema = schemaId ? library.schemas.find(({ id }) => id === schemaId) : undefined;
            if (schemaId && !schema)
                return false;
            library.openExportChoices(ports.exportButton, schema);
            return true;
        },
        omittedRuleStatus: (count) => library.omittedStatus(count),
        schemas: () => structuredClone(library.schemas),
        state: () => ({ ...(library.activeSchemaId ? { activeSchemaId: library.activeSchemaId } : {}),
            draftDirty: Boolean((library.activeSchemaId || library.draft) && ports.active().workingDraft),
            ...(ports.activeIndex() < 0 && library.draft ? { transientDraft: structuredClone(library.draft) } : {}),
            schemaCount: library.schemas.length, mounted: ports.mounted() }),
    };
}
//# sourceMappingURL=library-public-operations.js.map