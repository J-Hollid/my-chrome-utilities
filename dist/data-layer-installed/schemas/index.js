import { SCHEMA_LIBRARY_STORAGE_KEY, discardSchemaWorkingDraft, publishSchemaWorkingDraft, restoreSchemaLibrary, searchSchemas, serializeSchemaLibrary, updateSchemaWorkingDraft, validateEvent, } from "../../utilities/data-layer/schemas.js";
export function createSchemasInstalledController(ports) {
    const schemaSearch = ports.root.querySelector("#schema-search");
    const schemaCategoryFilter = ports.root.querySelector("#schema-category-filter");
    const schemaCount = ports.root.querySelector("#schema-count");
    const schemaList = ports.root.querySelector("#schema-list");
    const schemaResult = ports.root.querySelector("#schema-result");
    let mounted = false;
    let unsubscribe;
    const storedSchemaLibrary = ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
    let schemas = restoreSchemaLibrary(storedSchemaLibrary);
    let activeSchemaId;
    let schemaDraft;
    const activeIndex = () => schemas.findIndex(({ id }) => id === activeSchemaId);
    const active = () => {
        const schema = schemas[activeIndex()];
        if (!schema)
            throw new Error("Open a schema before editing its draft");
        return schema;
    };
    const persistSchemaLibrary = () => {
        ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(schemas));
        ports.changed(schemas);
    };
    const replaceActive = (schema) => {
        const index = activeIndex();
        if (index < 0)
            throw new Error("Open a schema before editing its draft");
        schemas = schemas.map((candidate, candidateIndex) => candidateIndex === index ? schema : candidate);
        schemaDraft = structuredClone(schema);
    };
    const renderSchemas = () => {
        if (!mounted)
            return;
        const visible = searchSchemas(schemas, schemaSearch?.value ?? "")
            .filter((schema) => !schemaCategoryFilter?.value || schemaCategoryFilter.value === "All"
            || String(schema.document.type ?? "").toLowerCase() === schemaCategoryFilter.value.toLowerCase());
        if (schemaCount)
            schemaCount.textContent = `${visible.length} schemas`;
        if (schemaList) {
            const document = schemaList.ownerDocument;
            schemaList.replaceChildren(...visible.map((schema) => {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = `${schema.name} v${schema.version}`;
                button.addEventListener("click", () => { activeSchemaId = schema.id; schemaDraft = structuredClone(schema); renderSchemas(); });
                return button;
            }));
        }
        if (schemaResult)
            schemaResult.textContent = activeSchemaId ? `Selected ${activeSchemaId}` : "";
    };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            schemaSearch?.addEventListener("input", renderSchemas);
            schemaCategoryFilter?.addEventListener("change", renderSchemas);
            unsubscribe = ports.subscribe(renderSchemas);
            renderSchemas();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            schemaSearch?.removeEventListener("input", renderSchemas);
            schemaCategoryFilter?.removeEventListener("change", renderSchemas);
            unsubscribe?.();
            unsubscribe = undefined;
            schemaList?.replaceChildren();
        },
        open(id) {
            if (!schemas.some((schema) => schema.id === id))
                throw new Error(`Unknown schema ${id}`);
            activeSchemaId = id;
            schemaDraft = structuredClone(active());
            renderSchemas();
        },
        beginDraft() { replaceActive(updateSchemaWorkingDraft(active(), {})); persistSchemaLibrary(); renderSchemas(); },
        updateDraft(changes, change) {
            replaceActive(updateSchemaWorkingDraft(active(), changes, change));
            persistSchemaLibrary();
            renderSchemas();
        },
        publish() { const published = publishSchemaWorkingDraft(active()); replaceActive(published); persistSchemaLibrary(); renderSchemas(); return structuredClone(published); },
        discard() { replaceActive(discardSchemaWorkingDraft(active())); persistSchemaLibrary(); renderSchemas(); },
        add(schema) { schemas = [...schemas, structuredClone(schema)]; activeSchemaId = schema.id; schemaDraft = structuredClone(schema); persistSchemaLibrary(); renderSchemas(); },
        replace(next) { schemas = structuredClone([...next]); if (!schemas.some(({ id }) => id === activeSchemaId)) {
            activeSchemaId = undefined;
            schemaDraft = undefined;
        } persistSchemaLibrary(); renderSchemas(); },
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