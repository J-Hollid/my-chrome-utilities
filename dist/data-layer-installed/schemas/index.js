export function createSchemasInstalledController(ports) {
    let mounted = false;
    const schemas = ports.loadSchemas().map((schema) => ({ ...schema }));
    let activeSchemaId;
    let draftDirty = false;
    return {
        mount() { mounted = true; },
        dispose() { mounted = false; },
        open(id) {
            if (!schemas.some((schema) => schema.id === id))
                throw new Error(`Unknown schema ${id}`);
            activeSchemaId = id;
            draftDirty = false;
        },
        markDraftDirty() {
            if (!activeSchemaId)
                throw new Error("Open a schema before editing its draft");
            draftDirty = true;
        },
        async persist() { await ports.persistDraft(); draftDirty = false; },
        validate: ports.validateCurrentSchema,
        runGuidedValidation: ports.runGuidedValidation,
        state: () => ({ ...(activeSchemaId ? { activeSchemaId } : {}), draftDirty,
            schemaCount: schemas.length }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "schemas",
    capabilities: ["authoring", "rules", "assignments", "validation", "guided validation"],
});
//# sourceMappingURL=index.js.map