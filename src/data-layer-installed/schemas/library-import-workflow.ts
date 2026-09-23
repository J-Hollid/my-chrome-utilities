import type { SchemaLibraryBehaviorPorts, SchemaLibraryWorkflowPort } from "./library-controller-contracts.js";
import { appendSchemaLibraryImport, inspectSchemaLibraryImport, replaceSchemaLibraryImport, type SchemaLibraryImportSet,
     } from "./library-import-policy.js";
export { inspectSchemaLibraryImport } from "./library-import-policy.js";
/** Owns file input, review dialog, and commit UI for Schema Library import. */
export class SchemaLibraryImportWorkflow {
    readonly #library: SchemaLibraryWorkflowPort;
    readonly #ports: SchemaLibraryBehaviorPorts;
    #pending: SchemaLibraryImportSet | undefined;
    constructor(library: SchemaLibraryWorkflowPort, ports: SchemaLibraryBehaviorPorts) {
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
            const currentSchemas=this.#library.schemas,currentRules=this.#ports.rules();
            const collisions=[
                ...this.#pending.schemas.filter(({id,name})=>currentSchemas.some((item)=>item.id===id||
                    item.name.trim().toLocaleLowerCase()===name.trim().toLocaleLowerCase())).map(({name})=>`schema ${name}`),
                ...this.#pending.rules.filter(({id,name})=>currentRules.some((item)=>item.id===id||
                    item.name.trim().toLocaleLowerCase()===name.trim().toLocaleLowerCase())).map(({name})=>`rule ${name}`),
            ];
            this.#ports.elements.importSummary.textContent =
                `${this.#pending.schemas.length} schemas and ` +
                    `${this.#pending.rules.length} reusable rules are ready to import. `+
                    (collisions.length?`Conflicts: ${collisions.join(", ")}. Choose a policy before any write.`:
                        "No conflicts. Unrelated local records stay in place.");
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
        const next = replaceSchemaLibraryImport(this.#library.schemas,this.#ports.rules(),pending);
        this.#library.replaceSchemas(next.schemas);
        this.#ports.replaceRules(next.rules);
        this.#pending = undefined;
        this.#persist("Reviewed Schema Library conflicts replaced; unrelated records kept.");
    }
    append(): void {
        const pending = this.#pending;
        if (!pending)
            return;
        const next = appendSchemaLibraryImport(this.#library.schemas, this.#ports.rules(), pending);
        this.#library.replaceSchemas(next.schemas);
        this.#ports.replaceRules(next.rules);
        this.#pending = undefined;
        this.#persist("Non-conflicting Schema Library records imported; conflicts kept local.");
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
