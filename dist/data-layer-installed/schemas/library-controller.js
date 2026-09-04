import { SCHEMA_LIBRARY_STORAGE_KEY, restoreSchemaLibrary, serializeSchemaLibrary, } from "../../utilities/data-layer/schemas.js";
import { SchemaLibraryOperations, } from "./library-operations.js";
export class SchemaLibraryController {
    #ports;
    #initialProjection;
    #schemas;
    #activeSchemaId;
    #draft;
    #operations;
    constructor(ports) {
        this.#ports = ports;
        const stored = ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
        this.#schemas = restoreSchemaLibrary(stored);
        try {
            const parsed = JSON.parse(stored ?? "[]");
            this.#initialProjection = Array.isArray(parsed)
                ? parsed
                : [];
        }
        catch {
            this.#initialProjection = [];
        }
    }
    configure(behavior) {
        this.#operations = new SchemaLibraryOperations(this, behavior);
    }
    get schemas() {
        return structuredClone(this.#schemas);
    }
    get activeSchemaId() {
        return this.#activeSchemaId;
    }
    get draft() {
        return this.#draft ? structuredClone(this.#draft) : undefined;
    }
    replaceSchemas(next) {
        this.#schemas = structuredClone([...next]);
    }
    select(id, draft) {
        this.#activeSchemaId = id;
        this.#draft = structuredClone(draft ?? this.#schemas.find((schema) => schema.id === id));
    }
    setDraft(next) {
        this.#draft = next ? structuredClone(next) : undefined;
    }
    clearSelection() {
        this.#activeSchemaId = undefined;
        this.#draft = undefined;
    }
    append(schema) {
        this.#schemas = [...this.#schemas, structuredClone(schema)];
        this.select(schema.id, schema);
    }
    activeIndex() {
        return this.#schemas.findIndex(({ id }) => id === this.#activeSchemaId);
    }
    active() {
        const schema = this.#schemas[this.activeIndex()] ?? this.#draft;
        if (!schema)
            throw new Error("Open a schema before editing its draft");
        return structuredClone(schema);
    }
    replaceActive(schema) {
        const index = this.activeIndex();
        if (index < 0) {
            if (!this.#draft)
                throw new Error("Open a schema before editing its draft");
            this.#draft = structuredClone(schema);
            return;
        }
        this.#schemas = this.#schemas.map((candidate, candidateIndex) => candidateIndex === index ? structuredClone(schema) : candidate);
        this.#draft = structuredClone(schema);
    }
    reload() {
        this.#schemas = restoreSchemaLibrary(this.#ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY));
    }
    serialize(next = this.#schemas) {
        const storedById = new Map(this.#initialProjection.map((schema) => [schema.id, schema]));
        const entries = next.map((schema) => {
            const canonical = JSON.parse(serializeSchemaLibrary([schema]))[0];
            const stored = storedById.get(schema.id);
            return {
                canonical,
                changed: !stored ||
                    serializeSchemaLibrary([stored]) !== JSON.stringify([canonical]),
            };
        });
        return JSON.stringify([
            ...entries.filter(({ changed }) => changed),
            ...entries.filter(({ changed }) => !changed),
        ].map(({ canonical }) => canonical));
    }
    persist() {
        this.#ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, this.serialize());
        this.#ports.changed(this.#schemas);
    }
    openImportFile() {
        this.#operations?.openImportFile();
    }
    reviewImport(serialized) {
        this.#operations?.reviewImport(serialized);
    }
    async readImportFile() {
        await this.#operations?.readImportFile();
    }
    replaceImport() {
        this.#operations?.replaceImport();
    }
    appendImport() {
        this.#operations?.appendImport();
    }
    cancelImport() {
        this.#operations?.cancelImport();
    }
    requestDeletion(id) {
        return this.#operations?.requestDeletion(id) ?? false;
    }
    confirmDeletion() {
        this.#operations?.confirmDeletion();
    }
    cancelDeletion() {
        this.#operations?.cancelDeletion();
    }
    openExportChoices(trigger, schema) {
        this.#operations?.openExportChoices(trigger, schema);
    }
    requestExport() {
        this.#operations?.requestExport();
    }
    omittedStatus(count) {
        return (this.#operations?.omittedStatus(count) ??
            `${count} omitted ${count === 1 ? "rule" : "rules"}`);
    }
    resetBehaviorState() {
        this.#operations?.reset();
    }
}
//# sourceMappingURL=library-controller.js.map