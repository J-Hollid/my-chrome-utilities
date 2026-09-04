/** Delegates installed property dialogs to the property state owner. */
export class SchemaInstalledPropertyWorkflow {
    #ports;
    constructor(ports) {
        this.#ports = ports;
    }
    clearFilter() {
        const filter = this.#ports.propertyFilter;
        if (filter)
            filter.value = "";
        this.#ports.renderProperty();
        filter?.focus();
    }
    requestRemoval(path, trigger) {
        this.#ports.property.requestRemoval(path, trigger);
    }
    confirmRemoval() { this.#ports.property.confirmRemoval(); }
    cancelRemoval(event) { this.#ports.property.cancelRemoval(event); }
    undoRemoval() { this.#ports.property.undoRemoval(); }
    requestDocumentationRemoval(path, trigger) {
        this.#ports.property.requestDocumentationRemoval(path, trigger);
    }
    confirmDocumentationRemoval() {
        this.#ports.property.confirmDocumentationRemoval();
        this.#ports.schemaEditor?.setAttribute("aria-busy", String(this.#ports.settleCanonical));
    }
    cancelDocumentationRemoval(event) {
        event?.preventDefault();
        this.#ports.property.closeDocumentationRemoval();
    }
    openCopy(path, triggerOrDestination) {
        this.#ports.property.openCopy(path, triggerOrDestination);
    }
    confirmCopy() { this.#ports.property.confirmCopy(); }
    undoCopy() { this.#ports.property.undoCopy(); }
    renderSpecificIndex() { this.#ports.property.renderSpecificIndex(); }
    openSpecificIndex(path, trigger) {
        this.#ports.property.openSpecificIndex(path, trigger);
    }
    submitSpecificIndex(event) { this.#ports.property.submitSpecificIndex(event); }
    closeSpecificIndex(event) { this.#ports.property.closeSpecificIndex(event); }
    renderManual() { this.#ports.property.renderManual(); }
    openManual(parentPath, trigger) {
        this.#ports.property.openManual(parentPath, trigger);
    }
    submitManual(event) { this.#ports.property.submitManual(event); }
    closeManual(event) {
        event?.preventDefault();
        this.#ports.property.closeManual();
    }
    goToExisting() { this.#ports.property.goToExisting(); }
}
//# sourceMappingURL=installed-property-workflow.js.map