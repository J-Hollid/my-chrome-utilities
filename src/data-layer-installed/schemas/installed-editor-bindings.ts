import type { SchemaInstalledEditorWorkflow } from "./installed-editor-workflow.js";
export interface SchemaEditorBindingOperations {
    updateTree(): void;
    recheck(): void;
    persistTreeScroll(): void;
    navigateTree(event: KeyboardEvent): void;
    rememberCanonicalScroll(): void;
}
export interface SchemaPropertyBindingOperations {
    render(): void;
    undoCopy(): void;
    cancelRulePicker(event: Event): void;
    navigateRulePicker(event: KeyboardEvent): void;
}
/** Creates the installed listener facade without owning editor behavior. */
export function createSchemaEditorBindings(workflow: SchemaInstalledEditorWorkflow, operations: SchemaEditorBindingOperations) {
    return {
        ...operations,
        createSchema: () => workflow.openNew(),
        updateName: () => workflow.updateName(),
        saveDescription: () => workflow.saveDescription(),
        updateTarget: () => workflow.updateTarget(),
        changeParent: () => workflow.changeParent(),
        changeDeclaredOnly: () => workflow.changeDeclaredOnly(),
        openRevision: () => workflow.openRevision(),
        confirmRevision: () => workflow.confirmRevision(),
        cancelRevision: () => workflow.cancelRevision(),
        discardDraft: () => workflow.discardTransient(),
        keepEditing: () => workflow.keepEditing(),
        closeEditor: () => workflow.closeEditor(),
        saveAndClose: () => workflow.openRevision(),
        saveCloseReview: () => workflow.saveFromCloseReview(),
        discardWorking: () => workflow.discardWorking(),
        renderRevision: () => workflow.renderRevision(),
        duplicateRevision: () => workflow.duplicateRevision(),
        restoreRevision: () => workflow.restoreRevision(),
    };
}
/** Creates property listener commands without taking property state ownership. */
export function createSchemaPropertyBindings(workflow: SchemaInstalledEditorWorkflow, operations: SchemaPropertyBindingOperations) {
    return {
        ...operations,
        openManual: () => workflow.openManual(),
        clearFilter: () => workflow.clearPropertyFilter(),
        activateSubview: (event: Event) => workflow.activateSubview(event),
        confirmRemoval: () => workflow.confirmRemoval(),
        cancelRemoval: (event?: Event) => workflow.cancelRemoval(event),
        undoRemoval: () => workflow.undoRemoval(),
        confirmDocumentationRemoval: () => workflow.confirmDocumentationRemoval(),
        cancelDocumentationRemoval: (event?: Event) => workflow.cancelDocumentationRemoval(event),
        renderSpecificIndex: () => workflow.renderSpecificIndex(),
        submitSpecificIndex: (event: Event) => workflow.submitSpecificIndex(event),
        closeSpecificIndex: (event?: Event) => workflow.closeSpecificIndex(event),
        renderManual: () => workflow.renderManual(),
        submitManual: (event: Event) => workflow.submitManual(event),
        closeManual: (event?: Event) => workflow.closeManual(event),
        goToExisting: () => workflow.goToExisting(),
    };
}
