/** Installs the complete property editor element set for the Schema composition. */
export function installSchemaPropertyElements(root) {
    const document = root.ownerDocument ?? ("createElement" in root ? root : undefined);
    const owned = (selector, tag) => root.querySelector(selector) ?? document?.createElement(tag) ?? null;
    const addSchemaPropertyButton = root.querySelector("#add-schema-property"), schemaPropertyViewControls = owned("#schema-property-view-controls", "div"), schemaPropertyFilterLabel = owned("#schema-property-filter-label", "label"), schemaPropertyFilter = owned("#schema-property-filter", "input"), schemaPropertySortLabel = owned("#schema-property-sort-label", "label"), schemaPropertySort = owned("#schema-property-sort", "select"), schemaPropertyResultStatus = owned("#schema-property-result-status", "output"), schemaPropertyEmpty = owned("#schema-property-empty", "div"), schemaPropertyEmptyMessage = owned("#schema-property-empty-message", "p"), clearSchemaPropertyFilter = owned("#clear-schema-property-filter", "button"), schemaPropertyTree = owned("#schema-property-tree", "ul"), schemaPropertyRemovalFeedback = owned("#schema-property-removal-feedback", "output"), undoSchemaPropertyRemovalButton = owned("#undo-schema-property-removal", "button"), schemaPropertyCopyFeedback = owned("#schema-property-copy-feedback", "output"), undoSchemaPropertyCopyButton = owned("#undo-schema-property-copy", "button"), schemaPropertyRemovalDialog = owned("#schema-property-removal-dialog", "dialog"), schemaPropertyRemovalHeading = owned("#schema-property-removal-heading", "h4"), schemaPropertyRemovalSummary = owned("#schema-property-removal-summary", "output"), confirmSchemaPropertyRemovalButton = owned("#confirm-schema-property-removal", "button"), cancelSchemaPropertyRemovalButton = owned("#cancel-schema-property-removal", "button"), schemaDocumentationRemovalDialog = owned("#schema-documentation-removal-dialog", "dialog"), schemaDocumentationRemovalHeading = owned("#schema-documentation-removal-heading", "h4"), schemaDocumentationRemovalSummary = owned("#schema-documentation-removal-summary", "p"), confirmSchemaDocumentationRemoval = owned("#confirm-schema-documentation-removal", "button"), cancelSchemaDocumentationRemoval = owned("#cancel-schema-documentation-removal", "button"), schemaSpecificIndexDialog = owned("#schema-specific-index-dialog", "dialog"), schemaSpecificIndexForm = owned("#schema-specific-index-form", "form"), schemaSpecificIndexHeading = owned("#schema-specific-index-heading", "h4"), schemaSpecificIndexLabel = owned("#schema-specific-index-label", "label"), schemaSpecificIndex = owned("#schema-specific-index", "input"), schemaSpecificIndexAssistance = owned("#schema-specific-index-assistance", "output"), confirmSchemaSpecificIndex = owned("#confirm-schema-specific-index", "button"), cancelSchemaSpecificIndex = owned("#cancel-schema-specific-index", "button"), schemaManualPropertyDialog = owned("#schema-manual-property-dialog", "dialog"), schemaManualPropertyForm = owned("#schema-manual-property-form", "form"), schemaManualPropertyHeading = owned("#schema-manual-property-heading", "h4"), schemaManualPropertyPathLabel = owned("#schema-manual-property-path-label", "label"), schemaManualPropertyPath = owned("#schema-manual-property-path", "input"), schemaManualPropertyParentContext = owned("#schema-manual-property-parent-context", "output"), schemaManualPropertyChildNameLabel = owned("#schema-manual-property-child-name-label", "label"), schemaManualPropertyChildName = owned("#schema-manual-property-child-name", "input"), schemaManualPropertyTypeLabel = owned("#schema-manual-property-type-label", "label"), schemaManualPropertyType = owned("#schema-manual-property-type", "select"), schemaManualArrayTypeGroup = owned("#schema-manual-array-type-group", "label"), schemaManualArrayItemType = owned("#schema-manual-array-item-type", "select"), schemaManualPropertyPreview = owned("#schema-manual-property-preview", "output"), schemaManualPropertyAssistance = owned("#schema-manual-property-assistance", "output"), goToExistingSchemaPropertyButton = owned("#go-to-existing-schema-property", "button"), confirmSchemaManualPropertyButton = owned("#confirm-schema-manual-property", "button"), cancelSchemaManualPropertyButton = owned("#cancel-schema-manual-property", "button"), schemaPropertyRulePicker = owned("#schema-property-rule-picker", "dialog"), schemaPropertyCopyDialog = owned("#schema-property-copy-dialog", "dialog");
    if (schemaPropertyViewControls && !schemaPropertyViewControls.isConnected) {
        schemaPropertyViewControls.id = "schema-property-view-controls";
        if (schemaPropertyFilterLabel) {
            schemaPropertyFilterLabel.id = "schema-property-filter-label";
            schemaPropertyFilterLabel.htmlFor = "schema-property-filter";
            schemaPropertyFilterLabel.textContent = "Filter properties";
        }
        if (schemaPropertyFilter) {
            schemaPropertyFilter.id = "schema-property-filter";
            schemaPropertyFilter.type = "search";
        }
        if (schemaPropertySortLabel) {
            schemaPropertySortLabel.id = "schema-property-sort-label";
            schemaPropertySortLabel.htmlFor = "schema-property-sort";
            schemaPropertySortLabel.textContent = "Sort properties";
        }
        if (schemaPropertySort) {
            schemaPropertySort.id = "schema-property-sort";
            for (const [value, label] of [["schema", "Schema order"], ["name-asc", "Name A-Z"], ["name-desc",
                    "Name Z-A"]]) {
                const option = document?.createElement("option");
                if (option) {
                    option.value = value;
                    option.textContent = label;
                    schemaPropertySort.append(option);
                }
            }
        }
        if (schemaPropertyResultStatus) {
            schemaPropertyResultStatus.id = "schema-property-result-status";
            schemaPropertyResultStatus.setAttribute("aria-live", "polite");
        }
        for (const element of [schemaPropertyFilterLabel, schemaPropertyFilter, schemaPropertySortLabel, schemaPropertySort,
            schemaPropertyResultStatus])
            if (element)
                schemaPropertyViewControls.append(element);
        addSchemaPropertyButton?.before(schemaPropertyViewControls);
    }
    if (schemaPropertyEmpty && !schemaPropertyEmpty.isConnected) {
        schemaPropertyEmpty.id = "schema-property-empty";
        schemaPropertyEmpty.hidden = true;
        if (schemaPropertyEmptyMessage) {
            schemaPropertyEmptyMessage.id = "schema-property-empty-message";
            schemaPropertyEmpty.append(schemaPropertyEmptyMessage);
        }
        if (clearSchemaPropertyFilter) {
            clearSchemaPropertyFilter.id = "clear-schema-property-filter";
            clearSchemaPropertyFilter.type = "button";
            clearSchemaPropertyFilter.textContent = "Clear filter";
            schemaPropertyEmpty.append(clearSchemaPropertyFilter);
        }
        addSchemaPropertyButton?.before(schemaPropertyEmpty);
    }
    if (schemaPropertyTree && !schemaPropertyTree.isConnected) {
        schemaPropertyTree.id = "schema-property-tree";
        addSchemaPropertyButton?.after(schemaPropertyTree);
    }
    if (schemaPropertyRemovalFeedback && !schemaPropertyRemovalFeedback.isConnected) {
        schemaPropertyRemovalFeedback.id = "schema-property-removal-feedback";
        schemaPropertyRemovalFeedback.setAttribute("aria-live", "polite");
        schemaPropertyTree?.after(schemaPropertyRemovalFeedback);
    }
    if (undoSchemaPropertyRemovalButton && !undoSchemaPropertyRemovalButton.isConnected) {
        undoSchemaPropertyRemovalButton.id = "undo-schema-property-removal";
        undoSchemaPropertyRemovalButton.type = "button";
        undoSchemaPropertyRemovalButton.textContent = "Undo";
        undoSchemaPropertyRemovalButton.hidden = true;
        schemaPropertyRemovalFeedback?.after(undoSchemaPropertyRemovalButton);
    }
    if (schemaPropertyCopyFeedback && !schemaPropertyCopyFeedback.isConnected) {
        schemaPropertyCopyFeedback.id = "schema-property-copy-feedback";
        schemaPropertyCopyFeedback.setAttribute("aria-live", "polite");
        schemaPropertyRemovalFeedback?.after(schemaPropertyCopyFeedback);
    }
    if (undoSchemaPropertyCopyButton && !undoSchemaPropertyCopyButton.isConnected) {
        undoSchemaPropertyCopyButton.id = "undo-schema-property-copy";
        undoSchemaPropertyCopyButton.type = "button";
        undoSchemaPropertyCopyButton.textContent = "Undo property copy";
        undoSchemaPropertyCopyButton.hidden = true;
        schemaPropertyCopyFeedback?.after(undoSchemaPropertyCopyButton);
    }
    if (schemaPropertyCopyDialog && !schemaPropertyCopyDialog.isConnected) {
        schemaPropertyCopyDialog.id = "schema-property-copy-dialog";
        document?.body.append(schemaPropertyCopyDialog);
    }
    if (schemaPropertyRemovalDialog && !schemaPropertyRemovalDialog.isConnected) {
        schemaPropertyRemovalDialog.id = "schema-property-removal-dialog";
        if (schemaPropertyRemovalHeading) {
            schemaPropertyRemovalHeading.id = "schema-property-removal-heading";
            schemaPropertyRemovalHeading.textContent = "Remove property?";
            schemaPropertyRemovalDialog.append(schemaPropertyRemovalHeading);
        }
        if (schemaPropertyRemovalSummary) {
            schemaPropertyRemovalSummary.id = "schema-property-removal-summary";
            schemaPropertyRemovalDialog.append(schemaPropertyRemovalSummary);
        }
        if (confirmSchemaPropertyRemovalButton) {
            confirmSchemaPropertyRemovalButton.id = "confirm-schema-property-removal";
            confirmSchemaPropertyRemovalButton.textContent = "Remove property";
            schemaPropertyRemovalDialog.append(confirmSchemaPropertyRemovalButton);
        }
        if (cancelSchemaPropertyRemovalButton) {
            cancelSchemaPropertyRemovalButton.id = "cancel-schema-property-removal";
            cancelSchemaPropertyRemovalButton.textContent = "Cancel";
            schemaPropertyRemovalDialog.append(cancelSchemaPropertyRemovalButton);
        }
        document?.body.append(schemaPropertyRemovalDialog);
    }
    if (schemaDocumentationRemovalDialog && !schemaDocumentationRemovalDialog.isConnected) {
        schemaDocumentationRemovalDialog.id = "schema-documentation-removal-dialog";
        if (schemaDocumentationRemovalHeading) {
            schemaDocumentationRemovalHeading.id = "schema-documentation-removal-heading";
            schemaDocumentationRemovalHeading.textContent = "Remove property documentation?";
            schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalHeading);
        }
        if (schemaDocumentationRemovalSummary) {
            schemaDocumentationRemovalSummary.id = "schema-documentation-removal-summary";
            schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalSummary);
        }
        if (confirmSchemaDocumentationRemoval) {
            confirmSchemaDocumentationRemoval.id = "confirm-schema-documentation-removal";
            confirmSchemaDocumentationRemoval.textContent = "Remove documentation";
            schemaDocumentationRemovalDialog.append(confirmSchemaDocumentationRemoval);
        }
        if (cancelSchemaDocumentationRemoval) {
            cancelSchemaDocumentationRemoval.id = "cancel-schema-documentation-removal";
            cancelSchemaDocumentationRemoval.textContent = "Cancel";
            schemaDocumentationRemovalDialog.append(cancelSchemaDocumentationRemoval);
        }
        document?.body.append(schemaDocumentationRemovalDialog);
    }
    if (schemaSpecificIndexDialog && schemaSpecificIndexForm && !schemaSpecificIndexDialog.isConnected) {
        schemaSpecificIndexDialog.id = "schema-specific-index-dialog";
        schemaSpecificIndexForm.id = "schema-specific-index-form";
        if (schemaSpecificIndexHeading) {
            schemaSpecificIndexHeading.id = "schema-specific-index-heading";
            schemaSpecificIndexHeading.textContent = "Add specific index rule";
            schemaSpecificIndexForm.append(schemaSpecificIndexHeading);
        }
        if (schemaSpecificIndexLabel) {
            schemaSpecificIndexLabel.id = "schema-specific-index-label";
            schemaSpecificIndexLabel.htmlFor = "schema-specific-index";
            schemaSpecificIndexLabel.textContent = "Zero-based array index";
            schemaSpecificIndexForm.append(schemaSpecificIndexLabel);
        }
        if (schemaSpecificIndex) {
            schemaSpecificIndex.id = "schema-specific-index";
            schemaSpecificIndex.type = "number";
            schemaSpecificIndex.min = "0";
            schemaSpecificIndex.step = "1";
            schemaSpecificIndexForm.append(schemaSpecificIndex);
        }
        if (schemaSpecificIndexAssistance) {
            schemaSpecificIndexAssistance.id = "schema-specific-index-assistance";
            schemaSpecificIndexForm.append(schemaSpecificIndexAssistance);
        }
        if (confirmSchemaSpecificIndex) {
            confirmSchemaSpecificIndex.id = "confirm-schema-specific-index";
            confirmSchemaSpecificIndex.type = "submit";
            confirmSchemaSpecificIndex.textContent = "Choose rule";
            schemaSpecificIndexForm.append(confirmSchemaSpecificIndex);
        }
        if (cancelSchemaSpecificIndex) {
            cancelSchemaSpecificIndex.id = "cancel-schema-specific-index";
            cancelSchemaSpecificIndex.type = "button";
            cancelSchemaSpecificIndex.textContent = "Cancel";
            schemaSpecificIndexForm.append(cancelSchemaSpecificIndex);
        }
        schemaSpecificIndexDialog.append(schemaSpecificIndexForm);
        document?.body.append(schemaSpecificIndexDialog);
    }
    if (schemaManualPropertyDialog && schemaManualPropertyForm && !schemaManualPropertyDialog.isConnected) {
        schemaManualPropertyDialog.id = "schema-manual-property-dialog";
        schemaManualPropertyForm.id = "schema-manual-property-form";
        const append = (element) => { if (element)
            schemaManualPropertyForm.append(element); };
        if (schemaManualPropertyHeading) {
            schemaManualPropertyHeading.id = "schema-manual-property-heading";
            schemaManualPropertyHeading.textContent = "Add property";
        }
        append(schemaManualPropertyHeading);
        if (schemaManualPropertyPathLabel) {
            schemaManualPropertyPathLabel.id = "schema-manual-property-path-label";
            schemaManualPropertyPathLabel.htmlFor = "schema-manual-property-path";
            schemaManualPropertyPathLabel.textContent = "Property path";
        }
        append(schemaManualPropertyPathLabel);
        if (schemaManualPropertyPath)
            schemaManualPropertyPath.id = "schema-manual-property-path";
        append(schemaManualPropertyPath);
        if (schemaManualPropertyParentContext)
            schemaManualPropertyParentContext.id = "schema-manual-property-parent-context";
        append(schemaManualPropertyParentContext);
        if (schemaManualPropertyChildNameLabel) {
            schemaManualPropertyChildNameLabel.id = "schema-manual-property-child-name-label";
            schemaManualPropertyChildNameLabel.htmlFor = "schema-manual-property-child-name";
            schemaManualPropertyChildNameLabel.textContent = "Child property name";
        }
        append(schemaManualPropertyChildNameLabel);
        if (schemaManualPropertyChildName)
            schemaManualPropertyChildName.id = "schema-manual-property-child-name";
        append(schemaManualPropertyChildName);
        if (schemaManualPropertyTypeLabel) {
            schemaManualPropertyTypeLabel.id = "schema-manual-property-type-label";
            schemaManualPropertyTypeLabel.htmlFor = "schema-manual-property-type";
            schemaManualPropertyTypeLabel.textContent = "Value type";
        }
        append(schemaManualPropertyTypeLabel);
        if (schemaManualPropertyType) {
            schemaManualPropertyType.id = "schema-manual-property-type";
            for (const type of ["string", "number", "boolean", "object",
                "array"]) {
                const option = document?.createElement("option");
                if (option) {
                    option.value = type;
                    option.textContent = type;
                    schemaManualPropertyType.append(option);
                }
            }
        }
        append(schemaManualPropertyType);
        if (schemaManualArrayTypeGroup) {
            schemaManualArrayTypeGroup.id = "schema-manual-array-type-group";
            schemaManualArrayTypeGroup.htmlFor = "schema-manual-array-item-type";
            schemaManualArrayTypeGroup.textContent = "Array item type ";
            if (schemaManualArrayItemType) {
                schemaManualArrayItemType.id = "schema-manual-array-item-type";
                const empty = document?.createElement("option");
                if (empty) {
                    empty.value = "";
                    empty.textContent = "Choose item type";
                    schemaManualArrayItemType.append(empty);
                }
                for (const type of ["string", "number", "boolean", "object"]) {
                    const option = document?.createElement("option");
                    if (option) {
                        option.value = type;
                        option.textContent = type;
                        schemaManualArrayItemType.append(option);
                    }
                }
                schemaManualArrayTypeGroup.append(schemaManualArrayItemType);
            }
        }
        append(schemaManualArrayTypeGroup);
        if (schemaManualPropertyPreview) {
            schemaManualPropertyPreview.id = "schema-manual-property-preview";
            schemaManualPropertyPreview.setAttribute("aria-live", "polite");
        }
        append(schemaManualPropertyPreview);
        if (schemaManualPropertyAssistance) {
            schemaManualPropertyAssistance.id = "schema-manual-property-assistance";
            schemaManualPropertyAssistance.setAttribute("aria-live", "polite");
        }
        append(schemaManualPropertyAssistance);
        if (goToExistingSchemaPropertyButton) {
            goToExistingSchemaPropertyButton.id = "go-to-existing-schema-property";
            goToExistingSchemaPropertyButton.type = "button";
        }
        append(goToExistingSchemaPropertyButton);
        if (confirmSchemaManualPropertyButton) {
            confirmSchemaManualPropertyButton.id = "confirm-schema-manual-property";
            confirmSchemaManualPropertyButton.type = "submit";
            confirmSchemaManualPropertyButton.textContent = "Add property";
        }
        append(confirmSchemaManualPropertyButton);
        if (cancelSchemaManualPropertyButton) {
            cancelSchemaManualPropertyButton.id = "cancel-schema-manual-property";
            cancelSchemaManualPropertyButton.type = "button";
            cancelSchemaManualPropertyButton.textContent = "Cancel";
        }
        append(cancelSchemaManualPropertyButton);
        schemaManualPropertyDialog.append(schemaManualPropertyForm);
        document?.body.append(schemaManualPropertyDialog);
    }
    if (schemaPropertyRulePicker && !schemaPropertyRulePicker.isConnected) {
        schemaPropertyRulePicker.id = "schema-property-rule-picker";
        schemaPropertyRulePicker.setAttribute("aria-label", "Schema property rule picker");
        document?.body.append(schemaPropertyRulePicker);
    }
    return { addSchemaPropertyButton, schemaPropertyViewControls, schemaPropertyFilterLabel, schemaPropertyFilter, schemaPropertySortLabel, schemaPropertySort,
        schemaPropertyResultStatus, schemaPropertyEmpty, schemaPropertyEmptyMessage, clearSchemaPropertyFilter, schemaPropertyTree, schemaPropertyRemovalFeedback,
        undoSchemaPropertyRemovalButton, schemaPropertyCopyFeedback, undoSchemaPropertyCopyButton, schemaPropertyRemovalDialog, schemaPropertyRemovalHeading,
        schemaPropertyRemovalSummary, confirmSchemaPropertyRemovalButton, cancelSchemaPropertyRemovalButton, schemaDocumentationRemovalDialog,
        schemaDocumentationRemovalHeading, schemaDocumentationRemovalSummary, confirmSchemaDocumentationRemoval, cancelSchemaDocumentationRemoval,
        schemaSpecificIndexDialog, schemaSpecificIndexForm, schemaSpecificIndexHeading, schemaSpecificIndexLabel, schemaSpecificIndex, schemaSpecificIndexAssistance,
        confirmSchemaSpecificIndex, cancelSchemaSpecificIndex, schemaManualPropertyDialog, schemaManualPropertyForm, schemaManualPropertyHeading,
        schemaManualPropertyPathLabel, schemaManualPropertyPath, schemaManualPropertyParentContext, schemaManualPropertyChildNameLabel, schemaManualPropertyChildName,
        schemaManualPropertyTypeLabel, schemaManualPropertyType, schemaManualArrayTypeGroup, schemaManualArrayItemType, schemaManualPropertyPreview,
        schemaManualPropertyAssistance, goToExistingSchemaPropertyButton, confirmSchemaManualPropertyButton, cancelSchemaManualPropertyButton, schemaPropertyRulePicker };
}
//# sourceMappingURL=property-installed-view.js.map