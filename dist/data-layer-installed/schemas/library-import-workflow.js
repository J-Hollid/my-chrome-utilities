import { appendSchemaLibraryImport, inspectSchemaLibraryImport, replaceSchemaLibraryImport, } from "./library-import-policy.js";
export { inspectSchemaLibraryImport } from "./library-import-policy.js";
/** Owns file input, review dialog, and commit UI for Schema Library import. */
export class SchemaLibraryImportWorkflow {
    #library;
    #ports;
    #pending;
    constructor(library, ports) {
        this.#library = library;
        this.#ports = ports;
    }
    reset() {
        this.#pending = undefined;
    }
    openFile() {
        this.#ports.elements.importFile?.click();
    }
    review(serialized) {
        this.#pending = inspectSchemaLibraryImport(serialized, this.#library.schemas);
        if (this.#ports.elements.importSummary) {
            this.#ports.elements.importSummary.textContent =
                `${this.#pending.schemas.length} schemas and ` +
                    `${this.#pending.rules.length} reusable rules are ready to import.`;
        }
        this.#ports.elements.importReview?.showModal();
    }
    async readFile() {
        const input = this.#ports.elements.importFile;
        const file = input?.files?.[0];
        if (!file)
            return;
        try {
            this.review(await file.text());
        }
        catch (error) {
            if (this.#ports.elements.result) {
                this.#ports.elements.result.textContent =
                    error instanceof Error
                        ? error.message
                        : "Schema Library import failed.";
            }
        }
        if (input)
            input.value = "";
    }
    replace() {
        const pending = this.#pending;
        if (!pending)
            return;
        const next = replaceSchemaLibraryImport(pending);
        this.#library.replaceSchemas(next.schemas);
        this.#ports.replaceRules(next.rules);
        this.#pending = undefined;
        this.#persist("Schema Library replaced.");
    }
    append() {
        const pending = this.#pending;
        if (!pending)
            return;
        const next = appendSchemaLibraryImport(this.#library.schemas, this.#ports.rules(), pending);
        this.#library.replaceSchemas(next.schemas);
        this.#ports.replaceRules(next.rules);
        this.#pending = undefined;
        this.#persist("Schema Library appended.");
    }
    cancel() {
        this.#pending = undefined;
        this.#ports.elements.importReview?.close();
    }
    #persist(status) {
        this.#library.persist();
        this.#ports.persistRules();
        this.#ports.renderAll();
        this.#ports.renderRules();
        this.#ports.elements.importReview?.close();
        if (this.#ports.elements.result) {
            this.#ports.elements.result.textContent = status;
        }
    }
}
//# sourceMappingURL=library-import-workflow.js.map