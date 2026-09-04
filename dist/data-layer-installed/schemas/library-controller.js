import { SCHEMA_LIBRARY_STORAGE_KEY, restoreSchemaLibrary, serializeSchemaLibrary, } from "../../utilities/data-layer/schemas.js";
export class SchemaLibraryController {
    #ports;
    #initialProjection;
    #schemas;
    #activeSchemaId;
    #draft;
    constructor(ports) {
        this.#ports = ports;
        const stored = ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
        this.#schemas = restoreSchemaLibrary(stored);
        try {
            const parsed = JSON.parse(stored ?? "[]");
            this.#initialProjection = Array.isArray(parsed) ? parsed : [];
        }
        catch {
            this.#initialProjection = [];
        }
    }
    get schemas() { return this.#schemas; }
    set schemas(next) { this.#schemas = next; }
    get activeSchemaId() { return this.#activeSchemaId; }
    set activeSchemaId(next) { this.#activeSchemaId = next; }
    get draft() { return this.#draft; }
    set draft(next) { this.#draft = next; }
    activeIndex() { return this.#schemas.findIndex(({ id }) => id === this.#activeSchemaId); }
    active() {
        const schema = this.#schemas[this.activeIndex()] ?? this.#draft;
        if (!schema)
            throw new Error("Open a schema before editing its draft");
        return schema;
    }
    replaceActive(schema) {
        const index = this.activeIndex();
        if (index < 0) {
            if (!this.#draft)
                throw new Error("Open a schema before editing its draft");
            this.#draft = structuredClone(schema);
            return;
        }
        this.#schemas = this.#schemas.map((candidate, candidateIndex) => candidateIndex === index ? schema : candidate);
        this.#draft = structuredClone(schema);
    }
    reload() { this.#schemas = restoreSchemaLibrary(this.#ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY)); }
    serialize(next = this.#schemas) {
        const storedById = new Map(this.#initialProjection.map((schema) => [schema.id, schema]));
        const entries = next.map((schema) => {
            const canonical = JSON.parse(serializeSchemaLibrary([schema]))[0];
            const stored = storedById.get(schema.id);
            return { canonical, changed: !stored || serializeSchemaLibrary([stored]) !== JSON.stringify([canonical]) };
        });
        return JSON.stringify([...entries.filter(({ changed }) => changed), ...entries.filter(({ changed }) => !changed)]
            .map(({ canonical }) => canonical));
    }
    persist() {
        this.#ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, this.serialize());
        this.#ports.changed(this.#schemas);
    }
}
//# sourceMappingURL=library-controller.js.map