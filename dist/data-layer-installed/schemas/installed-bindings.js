export function bindSchemaEditorLifecycle(lifecycle, elements, actions) {
    lifecycle.listen(elements.schemaSearch, "input", actions.updateTree);
    lifecycle.listen(elements.createSchemaButton, "click", actions.createSchema);
    lifecycle.listen(elements.recheckSchemaValidationButton, "click", actions.recheck);
    lifecycle.listen(elements.schemaCategoryFilter, "change", actions.updateTree);
    lifecycle.listen(elements.schemaTreeScrollOwner, "scroll", actions.persistTreeScroll, { passive: true });
    lifecycle.listen(elements.schemaList, "keydown", actions.navigateTree);
    lifecycle.listen(elements.schemaDetail, "scroll", actions.rememberCanonicalScroll);
    lifecycle.listen(elements.schemaEditorName, "input", actions.updateName);
    lifecycle.listen(elements.saveSchemaDescriptionButton, "click", actions.saveDescription);
    lifecycle.listen(elements.schemaEditorTarget, "input", actions.updateTarget);
    lifecycle.listen(elements.schemaEditorParent, "change", actions.changeParent);
    lifecycle.listen(elements.schemaOnlyDeclaredProperties, "change", actions.changeDeclaredOnly);
    lifecycle.listen(elements.saveSchemaButton, "click", actions.openRevision);
    lifecycle.listen(elements.confirmSchemaRevisionButton, "click", actions.confirmRevision);
    lifecycle.listen(elements.cancelSchemaRevisionButton, "click", actions.cancelRevision);
    lifecycle.listen(elements.discardSchemaDraftButton, "click", actions.discardDraft);
    lifecycle.listen(elements.keepEditingSchemaButton, "click", actions.keepEditing);
    lifecycle.listen(elements.closeSchemaEditorButton, "click", actions.closeEditor);
    lifecycle.listen(elements.saveAndCloseSchemaButton, "click", actions.saveAndClose);
    lifecycle.listen(elements.saveSchemaCloseReviewButton, "click", actions.saveCloseReview);
    lifecycle.listen(elements.discardWorkingSchemaDraftButton, "click", actions.discardWorking);
    lifecycle.listen(elements.schemaRevisionSelector, "change", actions.renderRevision);
    lifecycle.listen(elements.duplicateSchemaRevisionButton, "click", actions.duplicateRevision);
    lifecycle.listen(elements.restoreSchemaRevisionButton, "click", actions.restoreRevision);
}
export function bindSchemaPropertyLifecycle(lifecycle, elements, subviews, actions) {
    lifecycle.listen(elements.addSchemaPropertyButton, "click", actions.openManual);
    lifecycle.listen(elements.schemaPropertyFilter, "input", actions.render);
    lifecycle.listen(elements.schemaPropertySort, "change", actions.render);
    lifecycle.listen(elements.clearSchemaPropertyFilter, "click", actions.clearFilter);
    for (const tab of subviews)
        lifecycle.listen(tab, "click", actions.activateSubview);
    lifecycle.listen(elements.confirmSchemaPropertyRemovalButton, "click", actions.confirmRemoval);
    lifecycle.listen(elements.cancelSchemaPropertyRemovalButton, "click", () => actions.cancelRemoval());
    lifecycle.listen(elements.schemaPropertyRemovalDialog, "cancel", (event) => actions.cancelRemoval(event));
    lifecycle.listen(elements.undoSchemaPropertyRemovalButton, "click", actions.undoRemoval);
    lifecycle.listen(elements.confirmSchemaDocumentationRemoval, "click", actions.confirmDocumentationRemoval);
    lifecycle.listen(elements.cancelSchemaDocumentationRemoval, "click", () => actions.cancelDocumentationRemoval());
    lifecycle.listen(elements.schemaDocumentationRemovalDialog, "cancel", (event) => actions.cancelDocumentationRemoval(event));
    lifecycle.listen(elements.undoSchemaPropertyCopyButton, "click", actions.undoCopy);
    lifecycle.listen(elements.schemaSpecificIndex, "input", actions.renderSpecificIndex);
    lifecycle.listen(elements.schemaSpecificIndexForm, "submit", actions.submitSpecificIndex);
    lifecycle.listen(elements.cancelSchemaSpecificIndex, "click", () => actions.closeSpecificIndex());
    lifecycle.listen(elements.schemaSpecificIndexDialog, "cancel", (event) => actions.closeSpecificIndex(event));
    lifecycle.listen(elements.schemaManualPropertyPath, "input", actions.renderManual);
    lifecycle.listen(elements.schemaManualPropertyChildName, "input", actions.renderManual);
    lifecycle.listen(elements.schemaManualPropertyType, "change", actions.renderManual);
    lifecycle.listen(elements.schemaManualArrayItemType, "change", actions.renderManual);
    lifecycle.listen(elements.schemaManualPropertyForm, "submit", actions.submitManual);
    lifecycle.listen(elements.cancelSchemaManualPropertyButton, "click", () => actions.closeManual());
    lifecycle.listen(elements.schemaManualPropertyDialog, "cancel", (event) => actions.closeManual(event));
    lifecycle.listen(elements.goToExistingSchemaPropertyButton, "click", actions.goToExisting);
    lifecycle.listen(elements.schemaPropertyRulePicker, "cancel", actions.cancelRulePicker);
    lifecycle.listen(elements.schemaPropertyRulePicker, "keydown", actions.navigateRulePicker);
}
//# sourceMappingURL=installed-bindings.js.map