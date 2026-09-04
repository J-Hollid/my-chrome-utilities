import { schemaEditorDraft } from "./schema-model.js";
import { createSchemaEditorBindings, createSchemaPropertyBindings, } from "./installed-editor-bindings.js";
import { SchemaInstalledPropertyWorkflow } from "./installed-property-workflow.js";
import { openInstalledSchemaSpecification } from "./installed-specification-workflow.js";
/** Owns installed editor commands, subviews, property adapters, and specification UI. */
export class SchemaInstalledEditorWorkflow {
    #ports;
    #property;
    constructor(ports) {
        this.#ports = ports;
        this.#property = new SchemaInstalledPropertyWorkflow(ports);
    }
    editorBindings(ops) {
        return createSchemaEditorBindings(this, ops);
    }
    propertyBindings(ops) {
        return createSchemaPropertyBindings(this, ops);
    }
    persistDraft() {
        this.#ports.editor.persistDraft();
    }
    updateName() {
        this.#ports.editor.updateName();
    }
    saveDescription() {
        this.#ports.editor.saveDescription();
    }
    updateTarget() {
        this.#ports.editor.updateTarget();
    }
    changeParent() {
        this.#ports.editor.changeParent();
    }
    changeDeclaredOnly() {
        this.#ports.editor.changeAdditionalProperties();
    }
    openRevision() {
        this.#ports.editor.openRevisionReview();
    }
    confirmRevision() {
        this.#ports.editor.confirmRevision();
    }
    cancelRevision() {
        this.#ports.editor.cancelRevision();
    }
    discardTransient() {
        this.#ports.editor.discardTransient();
    }
    keepEditing() {
        this.#ports.editor.keepEditing();
    }
    closeEditor() {
        this.#ports.editor.closeEditor();
    }
    discardWorking() {
        this.#ports.editor.discardWorking();
    }
    renderRevision() {
        this.#ports.editor.render();
    }
    duplicateRevision() {
        this.#ports.editor.duplicateRevision();
    }
    restoreRevision() {
        this.#ports.editor.restoreRevision();
    }
    publish(close = false) {
        return this.#ports.editor.publish(close);
    }
    saveFromCloseReview() {
        const dialog = this.#ports.root.querySelector("#close-schema-editor-review");
        dialog?.close();
        if (dialog)
            dialog.hidden = true;
        this.openRevision();
    }
    clearPropertyFilter() {
        this.#property.clearFilter();
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
        const subview = tab.dataset.schemaSubview ??
            tab.getAttribute("aria-controls") ??
            undefined;
        if (subview)
            this.showSubview(subview);
    }
    requestRemoval(path, trigger) {
        this.#property.requestRemoval(path, trigger);
    }
    confirmRemoval() {
        this.#property.confirmRemoval();
    }
    cancelRemoval(event) {
        this.#property.cancelRemoval(event);
    }
    undoRemoval() {
        this.#property.undoRemoval();
    }
    requestDocumentationRemoval(path, trigger) {
        this.#property.requestDocumentationRemoval(path, trigger);
    }
    confirmDocumentationRemoval() {
        this.#property.confirmDocumentationRemoval();
    }
    cancelDocumentationRemoval(event) {
        this.#property.cancelDocumentationRemoval(event);
    }
    openCopy(path, triggerOrDestination) {
        this.#property.openCopy(path, triggerOrDestination);
    }
    confirmCopy() {
        this.#property.confirmCopy();
    }
    undoCopy() {
        this.#property.undoCopy();
    }
    renderSpecificIndex() {
        this.#property.renderSpecificIndex();
    }
    openSpecificIndex(path, trigger) {
        this.#property.openSpecificIndex(path, trigger);
    }
    submitSpecificIndex(event) {
        this.#property.submitSpecificIndex(event);
    }
    closeSpecificIndex(event) {
        this.#property.closeSpecificIndex(event);
    }
    renderManual() {
        this.#property.renderManual();
    }
    openManual(parentPath, trigger) {
        this.#property.openManual(parentPath, trigger);
    }
    submitManual(event) {
        this.#property.submitManual(event);
    }
    closeManual(event) {
        this.#property.closeManual(event);
    }
    goToExisting() {
        this.#property.goToExisting();
    }
    openNew() {
        this.#ports.openRoute();
        this.#ports.createEmpty();
    }
    openDraft(schema) {
        this.#ports.library.select(schema.id, schemaEditorDraft(schema));
        this.#ports.showSchemas();
        this.#ports.renderAll();
        this.#ports.schemaEditorName?.focus({ preventScroll: true });
    }
    openSpecification(schema, surface, trigger) {
        openInstalledSchemaSpecification(this.#ports, schema, surface, trigger);
    }
}
//# sourceMappingURL=installed-editor-workflow.js.map