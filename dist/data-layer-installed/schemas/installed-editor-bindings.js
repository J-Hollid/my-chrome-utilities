/** Creates the installed listener facade without owning editor behavior. */
export function createSchemaEditorBindings(workflow, operations) {
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
export function createSchemaPropertyBindings(workflow, operations) {
    return {
        ...operations,
        openManual: () => workflow.openManual(),
        clearFilter: () => workflow.clearPropertyFilter(),
        activateSubview: (event) => workflow.activateSubview(event),
        confirmRemoval: () => workflow.confirmRemoval(),
        cancelRemoval: (event) => workflow.cancelRemoval(event),
        undoRemoval: () => workflow.undoRemoval(),
        confirmDocumentationRemoval: () => workflow.confirmDocumentationRemoval(),
        cancelDocumentationRemoval: (event) => workflow.cancelDocumentationRemoval(event),
        renderSpecificIndex: () => workflow.renderSpecificIndex(),
        submitSpecificIndex: (event) => workflow.submitSpecificIndex(event),
        closeSpecificIndex: (event) => workflow.closeSpecificIndex(event),
        renderManual: () => workflow.renderManual(),
        submitManual: (event) => workflow.submitManual(event),
        closeManual: (event) => workflow.closeManual(event),
        goToExisting: () => workflow.goToExisting(),
    };
}
//# sourceMappingURL=installed-editor-bindings.js.map