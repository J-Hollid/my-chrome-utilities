import type { SchemaLibraryController } from "./library-controller.js";
import type { SchemaLibraryBehaviorPorts } from "./library-operations.js";
import { appendSchemaLibraryImport, inspectSchemaLibraryImport, replaceSchemaLibraryImport, type SchemaLibraryImportSet,
     } from "./library-import-policy.js";
export { inspectSchemaLibraryImport } from "./library-import-policy.js";
/** Owns file input, review dialog, and commit UI for Schema Library import. */
export class SchemaLibraryImportWorkflow {
    readonly #library: SchemaLibraryController;
    readonly #ports: SchemaLibraryBehaviorPorts;
    #pending: SchemaLibraryImportSet | undefined;
    constructor(library: SchemaLibraryController, ports: SchemaLibraryBehaviorPorts) {
        this.#library = library;
        this.#ports = ports;
    }
    reset(): void {
        this.#pending = undefined;
    }
    openFile(): void {
        this.#ports.elements.importFile?.click();
    }
    review(serialized: string): void {
        this.#pending = inspectSchemaLibraryImport(serialized, this.#library.schemas);
        if (this.#ports.elements.importSummary) {
            this.#ports.elements.importSummary.textContent =
                `${this.#pending.schemas.length} schemas and ` +
                    `${this.#pending.rules.length} reusable rules are ready to import.`;
        }
        this.#ports.elements.importReview?.showModal();
    }
    async readFile(): Promise<void> {
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
    replace(): void {
        const pending = this.#pending;
        if (!pending)
            return;
        const next = replaceSchemaLibraryImport(pending);
        this.#library.replaceSchemas(next.schemas);
        this.#ports.replaceRules(next.rules);
        this.#pending = undefined;
        this.#persist("Schema Library replaced.");
    }
    append(): void {
        const pending = this.#pending;
        if (!pending)
            return;
        const next = appendSchemaLibraryImport(this.#library.schemas, this.#ports.rules(), pending);
        this.#library.replaceSchemas(next.schemas);
        this.#ports.replaceRules(next.rules);
        this.#pending = undefined;
        this.#persist("Schema Library appended.");
    }
    cancel(): void {
        this.#pending = undefined;
        this.#ports.elements.importReview?.close();
    }
    #persist(status: string): void {
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
