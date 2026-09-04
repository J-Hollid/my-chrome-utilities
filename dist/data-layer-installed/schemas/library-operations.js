import { SchemaLibraryDeletionWorkflow } from "./library-deletion-workflow.js";
import { SchemaLibraryExportWorkflow, omittedRuleStatus, } from "./library-export-workflow.js";
import { SchemaLibraryImportWorkflow } from "./library-import-workflow.js";
/** Routes installed Library actions to one-purpose workflows. */
export class SchemaLibraryOperations {
    #import;
    #deletion;
    #export;
    constructor(library, ports) {
        this.#import = new SchemaLibraryImportWorkflow(library, ports);
        this.#deletion = new SchemaLibraryDeletionWorkflow(library, ports);
        this.#export = new SchemaLibraryExportWorkflow(library, ports);
    }
    reset() {
        this.#import.reset();
        this.#deletion.reset();
        this.#export.reset();
    }
    openImportFile() {
        this.#import.openFile();
    }
    reviewImport(serialized) {
        this.#import.review(serialized);
    }
    readImportFile() {
        return this.#import.readFile();
    }
    replaceImport() {
        this.#import.replace();
    }
    appendImport() {
        this.#import.append();
    }
    cancelImport() {
        this.#import.cancel();
    }
    requestDeletion(id) {
        return this.#deletion.request(id);
    }
    confirmDeletion() {
        this.#deletion.confirm();
    }
    cancelDeletion() {
        this.#deletion.cancel();
    }
    openExportChoices(trigger, schema) {
        return this.#export.openChoices(trigger, schema);
    }
    requestExport() {
        this.#export.request();
    }
    omittedStatus(count) {
        return omittedRuleStatus(count);
    }
}
//# sourceMappingURL=library-operations.js.map