import { schemaEditorDraft } from "./schema-model.js";
/** Owns installed editor commands, subviews, property adapters, and specification UI. */
export class SchemaInstalledEditorWorkflow {
    #ports;
    constructor(ports) { this.#ports = ports; }
    persistDraft() { this.#ports.editor.persistDraft(); }
    updateName() { this.#ports.editor.updateName(); }
    saveDescription() { this.#ports.editor.saveDescription(); }
    updateTarget() { this.#ports.editor.updateTarget(); }
    changeParent() { this.#ports.editor.changeParent(); }
    changeDeclaredOnly() { this.#ports.editor.changeAdditionalProperties(); }
    openRevision() { this.#ports.editor.openRevisionReview(); }
    confirmRevision() { this.#ports.editor.confirmRevision(); }
    cancelRevision() { this.#ports.editor.cancelRevision(); }
    discardTransient() { this.#ports.editor.discardTransient(); }
    keepEditing() { this.#ports.editor.keepEditing(); }
    closeEditor() { this.#ports.editor.closeEditor(); }
    discardWorking() { this.#ports.editor.discardWorking(); }
    renderRevision() { this.#ports.editor.render(); }
    duplicateRevision() { this.#ports.editor.duplicateRevision(); }
    restoreRevision() { this.#ports.editor.restoreRevision(); }
    publish(close = false) { return this.#ports.editor.publish(close); }
    saveFromCloseReview() {
        const dialog = this.#ports.root.querySelector("#close-schema-editor-review");
        dialog?.close();
        if (dialog)
            dialog.hidden = true;
        this.openRevision();
    }
    clearPropertyFilter() {
        const filter = this.#ports.propertyFilter;
        if (filter)
            filter.value = "";
        this.#ports.renderProperty();
        filter?.focus();
    }
    showSubview(subview) {
        for (const tab of this.#ports.subviews) {
            const target = tab.dataset.schemaSubview ?? tab.getAttribute("aria-controls"), selected = target === subview;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
        }
        for (const panel of this.#ports.panels)
            panel.hidden = panel.id !== subview;
        if (this.#ports.liveEventQuery)
            this.#ports.liveEventQuery.hidden = subview !== "schema-master";
    }
    activateSubview(event) {
        const tab = event.currentTarget;
        const subview = tab.dataset.schemaSubview ?? tab.getAttribute("aria-controls") ?? undefined;
        if (subview)
            this.showSubview(subview);
    }
    requestRemoval(path, trigger) { this.#ports.property.requestRemoval(path, trigger); }
    confirmRemoval() { this.#ports.property.confirmRemoval(); }
    cancelRemoval(event) { this.#ports.property.cancelRemoval(event); }
    undoRemoval() { this.#ports.property.undoRemoval(); }
    requestDocumentationRemoval(path, trigger) { this.#ports.property.requestDocumentationRemoval(path, trigger); }
    confirmDocumentationRemoval() {
        this.#ports.property.confirmDocumentationRemoval();
        this.#ports.schemaEditor?.setAttribute("aria-busy", String(this.#ports.settleCanonical));
    }
    cancelDocumentationRemoval(event) { event?.preventDefault(); this.#ports.property.closeDocumentationRemoval(); }
    openCopy(path, triggerOrDestination) { this.#ports.property.openCopy(path, triggerOrDestination); }
    confirmCopy() { this.#ports.property.confirmCopy(); }
    undoCopy() { this.#ports.property.undoCopy(); }
    renderSpecificIndex() { this.#ports.property.renderSpecificIndex(); }
    openSpecificIndex(path, trigger) { this.#ports.property.openSpecificIndex(path, trigger); }
    submitSpecificIndex(event) { this.#ports.property.submitSpecificIndex(event); }
    closeSpecificIndex(event) { this.#ports.property.closeSpecificIndex(event); }
    renderManual() { this.#ports.property.renderManual(); }
    openManual(parentPath, trigger) { this.#ports.property.openManual(parentPath, trigger); }
    submitManual(event) { this.#ports.property.submitManual(event); }
    closeManual(event) { event?.preventDefault(); this.#ports.property.closeManual(); }
    goToExisting() { this.#ports.property.goToExisting(); }
    openNew() { this.#ports.openRoute(); this.#ports.createEmpty(); }
    openDraft(schema) {
        this.#ports.library.activeSchemaId = schema.id;
        this.#ports.library.draft = schemaEditorDraft(schema);
        this.#ports.showSchemas();
        this.#ports.renderAll();
        this.#ports.schemaEditorName?.focus({ preventScroll: true });
    }
    openSpecification(schema, surface, trigger) {
        const root = this.#ports.specificationBuilder;
        if (!root)
            return;
        root.hidden = false;
        if (this.#ports.schemaEditor)
            this.#ports.schemaEditor.hidden = true;
        if (this.#ports.schemaDetailEmpty)
            this.#ports.schemaDetailEmpty.hidden = true;
        this.#ports.renderSpecification(root, structuredClone(schema), structuredClone(this.#ports.library.schemas), surface, () => {
            root.hidden = true;
            this.#ports.editor.render();
            trigger.focus({ preventScroll: true });
        });
    }
}
//# sourceMappingURL=installed-editor-workflow.js.map