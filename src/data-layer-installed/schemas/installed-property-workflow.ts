import type { SchemaInstalledEditorWorkflowPorts } from "./installed-editor-contracts.js";
/** Delegates installed property dialogs to the property state owner. */
export class SchemaInstalledPropertyWorkflow {
    readonly #ports: SchemaInstalledEditorWorkflowPorts;
    constructor(ports: SchemaInstalledEditorWorkflowPorts) {
        this.#ports = ports;
    }
    clearFilter(): void {
        const filter = this.#ports.propertyFilter;
        if (filter)
            filter.value = "";
        this.#ports.renderProperty();
        filter?.focus();
    }
    requestRemoval(path: string, trigger?: HTMLButtonElement): void {
        this.#ports.property.requestRemoval(path, trigger);
    }
    confirmRemoval(): void { this.#ports.property.confirmRemoval(); }
    cancelRemoval(event?: Event): void { this.#ports.property.cancelRemoval(event); }
    undoRemoval(): void { this.#ports.property.undoRemoval(); }
    requestDocumentationRemoval(path: string, trigger?: HTMLElement): void {
        this.#ports.property.requestDocumentationRemoval(path, trigger);
    }
    confirmDocumentationRemoval(): void {
        this.#ports.property.confirmDocumentationRemoval();
        this.#ports.schemaEditor?.setAttribute("aria-busy", String(this.#ports.settleCanonical));
    }
    cancelDocumentationRemoval(event?: Event): void {
        event?.preventDefault();
        this.#ports.property.closeDocumentationRemoval();
    }
    openCopy(path: string, triggerOrDestination: HTMLButtonElement | string): void {
        this.#ports.property.openCopy(path, triggerOrDestination);
    }
    confirmCopy(): void { this.#ports.property.confirmCopy(); }
    undoCopy(): void { this.#ports.property.undoCopy(); }
    renderSpecificIndex(): void { this.#ports.property.renderSpecificIndex(); }
    openSpecificIndex(path: string, trigger?: HTMLButtonElement): void {
        this.#ports.property.openSpecificIndex(path, trigger);
    }
    submitSpecificIndex(event: Event): void { this.#ports.property.submitSpecificIndex(event); }
    closeSpecificIndex(event?: Event): void { this.#ports.property.closeSpecificIndex(event); }
    renderManual(): void { this.#ports.property.renderManual(); }
    openManual(parentPath?: string, trigger?: HTMLButtonElement): void {
        this.#ports.property.openManual(parentPath, trigger);
    }
    submitManual(event: Event): void { this.#ports.property.submitManual(event); }
    closeManual(event?: Event): void {
        event?.preventDefault();
        this.#ports.property.closeManual();
    }
    goToExisting(): void { this.#ports.property.goToExisting(); }
}
