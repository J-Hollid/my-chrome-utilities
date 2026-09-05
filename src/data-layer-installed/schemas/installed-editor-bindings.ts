import type {
    SchemaEditorBindingOperations,
    SchemaInstalledEditorCommands,
    SchemaPropertyBindingOperations,
} from "./installed-editor-contracts.js";
export type { SchemaEditorBindingOperations, SchemaPropertyBindingOperations } from "./installed-editor-contracts.js";
/** Creates the installed listener facade without owning editor behavior. */
export function createSchemaEditorBindings(workflow: SchemaInstalledEditorCommands, operations: SchemaEditorBindingOperations) {
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
export function createSchemaPropertyBindings(workflow: SchemaInstalledEditorCommands, operations: SchemaPropertyBindingOperations) {
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
