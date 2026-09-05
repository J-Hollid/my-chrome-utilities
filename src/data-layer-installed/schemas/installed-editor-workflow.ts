import { schemaEditorDraft } from "./schema-model.js";
import { createSchemaEditorBindings, createSchemaPropertyBindings, type SchemaEditorBindingOperations,
     type SchemaPropertyBindingOperations, } from "./installed-editor-bindings.js";
import type { SchemaInstalledEditorCommands, SchemaInstalledEditorWorkflowPorts } from "./installed-editor-contracts.js";
export type { SchemaInstalledEditorWorkflowPorts } from "./installed-editor-contracts.js";
import { SchemaInstalledPropertyWorkflow } from "./installed-property-workflow.js";
import { openInstalledSchemaSpecification } from "./installed-specification-workflow.js";
/** Owns installed editor commands, subviews, property adapters, and specification UI. */
export class SchemaInstalledEditorWorkflow implements SchemaInstalledEditorCommands {
    readonly #ports: SchemaInstalledEditorWorkflowPorts;
    readonly #property: SchemaInstalledPropertyWorkflow;
    constructor(ports: SchemaInstalledEditorWorkflowPorts) {
        this.#ports = ports;
        this.#property = new SchemaInstalledPropertyWorkflow(ports);
    }
    editorBindings(ops: SchemaEditorBindingOperations) {
        return createSchemaEditorBindings(this, ops);
    }
    propertyBindings(ops: SchemaPropertyBindingOperations) {
        return createSchemaPropertyBindings(this, ops);
    }
    persistDraft(): void {
        this.#ports.editor.persistDraft();
    }
    updateName(): void {
        this.#ports.editor.updateName();
    }
    saveDescription(): void {
        this.#ports.editor.saveDescription();
    }
    updateTarget(): void {
        this.#ports.editor.updateTarget();
    }
    changeParent(): void {
        this.#ports.editor.changeParent();
    }
    changeDeclaredOnly(): void {
        this.#ports.editor.changeAdditionalProperties();
    }
    openRevision(): void {
        this.#ports.editor.openRevisionReview();
    }
    confirmRevision(): void {
        this.#ports.editor.confirmRevision();
    }
    cancelRevision(): void {
        this.#ports.editor.cancelRevision();
    }
    discardTransient(): void {
        this.#ports.editor.discardTransient();
    }
    keepEditing(): void {
        this.#ports.editor.keepEditing();
    }
    closeEditor(): void {
        this.#ports.editor.closeEditor();
    }
    discardWorking(): void {
        this.#ports.editor.discardWorking();
    }
    renderRevision(): void {
        this.#ports.editor.render();
    }
    duplicateRevision(): void {
        this.#ports.editor.duplicateRevision();
    }
    restoreRevision(): void {
        this.#ports.editor.restoreRevision();
    }
    publish(close = false): SchemaDefinition {
        return this.#ports.editor.publish(close);
    }
    saveFromCloseReview(): void {
        const dialog = this.#ports.root.querySelector<HTMLDialogElement>("#close-schema-editor-review");
        dialog?.close();
        if (dialog)
            dialog.hidden = true;
        this.openRevision();
    }
    clearPropertyFilter(): void {
        this.#property.clearFilter();
    }
    showSubview(subview: string): void {
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
    activateSubview(event: Event): void {
        const tab = event.currentTarget as HTMLButtonElement;
        const subview = tab.dataset.schemaSubview ??
            tab.getAttribute("aria-controls") ??
            undefined;
        if (subview)
            this.showSubview(subview);
    }
    requestRemoval(path: string, trigger?: HTMLButtonElement): void {
        this.#property.requestRemoval(path, trigger);
    }
    confirmRemoval(): void {
        this.#property.confirmRemoval();
    }
    cancelRemoval(event?: Event): void {
        this.#property.cancelRemoval(event);
    }
    undoRemoval(): void {
        this.#property.undoRemoval();
    }
    requestDocumentationRemoval(path: string, trigger?: HTMLElement): void {
        this.#property.requestDocumentationRemoval(path, trigger);
    }
    confirmDocumentationRemoval(): void {
        this.#property.confirmDocumentationRemoval();
    }
    cancelDocumentationRemoval(event?: Event): void {
        this.#property.cancelDocumentationRemoval(event);
    }
    openCopy(path: string, triggerOrDestination: HTMLButtonElement | string): void {
        this.#property.openCopy(path, triggerOrDestination);
    }
    confirmCopy(): void {
        this.#property.confirmCopy();
    }
    undoCopy(): void {
        this.#property.undoCopy();
    }
    renderSpecificIndex(): void {
        this.#property.renderSpecificIndex();
    }
    openSpecificIndex(path: string, trigger?: HTMLButtonElement): void {
        this.#property.openSpecificIndex(path, trigger);
    }
    submitSpecificIndex(event: Event): void {
        this.#property.submitSpecificIndex(event);
    }
    closeSpecificIndex(event?: Event): void {
        this.#property.closeSpecificIndex(event);
    }
    renderManual(): void {
        this.#property.renderManual();
    }
    openManual(parentPath?: string, trigger?: HTMLButtonElement): void {
        this.#property.openManual(parentPath, trigger);
    }
    submitManual(event: Event): void {
        this.#property.submitManual(event);
    }
    closeManual(event?: Event): void {
        this.#property.closeManual(event);
    }
    goToExisting(): void {
        this.#property.goToExisting();
    }
    openNew(): void {
        this.#ports.openRoute();
        this.#ports.createEmpty();
    }
    openDraft(schema: SchemaDefinition): void {
        this.#ports.library.select(schema.id, schemaEditorDraft(schema));
        this.#ports.showSchemas();
        this.#ports.renderAll();
        this.#ports.schemaEditorName?.focus({ preventScroll: true });
    }
    openSpecification(schema: SchemaDefinition, surface: `published:${number}` | `historical:${number}` | "working-draft",
         trigger: HTMLButtonElement): void {
        openInstalledSchemaSpecification(this.#ports, schema, surface, trigger);
    }
}
import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
