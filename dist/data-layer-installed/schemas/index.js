import { SCHEMA_LIBRARY_STORAGE_KEY, discardSchemaWorkingDraft, duplicateSchemaRevision, filterAndSortSchemaPropertyRows, inspectSchemaPropertyRemoval, inspectSpecificIndexRuleTarget, inspectJsonSchemaExport, importSchema, inspectManualProperty, inspectSchemaRename, proposeSchemaWorkingDraftName, publishSchemaWorkingDraft, removeSchemaProperty, restoreSchemaRevisionDraft, schemaPropertyRows, schemaRevisionChoices, schemaPropertyCopySource, schemaInheritanceConflict, schemaInheritanceError, addManualProperty, assignmentDraftAfterGuidedSave, assignmentConditionSuggestions, assignmentDataConditionSummary, contextualManualPropertyDefinition, createRuleConfiguration, createExtensionSchemaPackage, createSchemaLibraryExport, duplicateSchemaAssignment, guidedAttachedRule, guidedPropertyDocument, manualPropertyPreview, mergeGuidedDocument, restoreSchemaLibrary, serializeSchemaLibrary, exportJsonSchemaBundle, exportJsonSchemaResource, setSchemaDescription as updateSchemaDescription, setPropertyDocumentation, undoSchemaPropertyRemoval, undoSchemaPropertyCopy, updateSchemaWorkingDraft, validateAssignmentDataConditions, validateEvent, filterSchemaRelationshipTree, restoreSchemaRelationshipTreeView, saveSchemaRelationshipTreeView, } from "../../utilities/data-layer/schemas.js";
import { applySchemaPropertyCopy, planSchemaPropertyCopy } from "../../data-layer-schema-property-copy.js";
import { persistLocalRulePromotion, promoteLocalRule, reviewLocalRulePromotion, } from "../../data-layer-local-rule-promotion.js";
import { publishReusableRuleSync, reviewReusableRuleSync, } from "../../data-layer-reusable-rule-sync.js";
const SCHEMA_RULE_STORAGE_KEY = "my-chrome-utilities.schema-rule-library.v1";
export function createSchemasInstalledController(ports) {
    const schemaSearch = ports.root.querySelector("#schema-search");
    const schemaCategoryFilter = ports.root.querySelector("#schema-category-filter");
    const schemaEmptyState = ports.root.querySelector("#schema-empty-state");
    const schemaCount = ports.root.querySelector("#schema-count");
    const schemaList = ports.root.querySelector("#schema-list");
    const schemaResult = ports.root.querySelector("#schema-result");
    const schemaEditor = ports.root.querySelector("#schema-editor");
    const schemaDetail = ports.root.querySelector("#schema-detail");
    const schemaTreeScrollOwner = ports.root.querySelector("#workspace-panel-data-layer");
    const schemaPanel = ports.root.querySelector("#data-layer-panel-schemas");
    const sidePanelLayeredProfileEditorHost = ports.root.querySelector("#side-panel-layered-profile-editor");
    const liveEventQuery = ports.root.querySelector("#live-event-query");
    const schemaSubviews = Array.from(ports.root.querySelectorAll("#schema-subviews [role=tab]"));
    const schemaPanels = Array.from(ports.root.querySelectorAll("#schema-master, #schema-rule-library, #schema-assignments"));
    if (sidePanelLayeredProfileEditorHost && schemaDetail && !schemaDetail.contains(sidePanelLayeredProfileEditorHost)) {
        schemaDetail.prepend(sidePanelLayeredProfileEditorHost);
    }
    const schemaDetailEmpty = ports.root.querySelector("#schema-detail-empty");
    const schemaInheritanceProvenance = ports.root.querySelector("#schema-inheritance-provenance");
    const schemaRuleOverrides = ports.root.querySelector("#schema-rule-overrides");
    const schemaRuleOverrideList = ports.root.querySelector("#schema-rule-override-list");
    const schemaEditorParent = ports.root.querySelector("#schema-editor-parent");
    const schemaOnlyDeclaredProperties = ports.root.querySelector("#schema-only-declared-properties");
    const schemaEditorName = ports.root.querySelector("#schema-editor-name");
    const schemaEditorNameAssistance = ports.root.querySelector("#schema-editor-name-assistance");
    const schemaEditorDescription = ports.root.querySelector("#schema-editor-description");
    const saveSchemaDescriptionButton = ports.root.querySelector("#save-schema-description");
    const schemaDescriptionOrigin = ports.root.querySelector("#schema-description-origin");
    const schemaEditorTarget = ports.root.querySelector("#schema-editor-target");
    const saveSchemaButton = ports.root.querySelector("#save-schema");
    const saveSchemaReason = ports.root.querySelector("#save-schema-reason");
    const schemaRevisionReview = ports.root.querySelector("#schema-revision-review");
    const schemaRevisionReviewSummary = ports.root.querySelector("#schema-revision-review-summary");
    const confirmSchemaRevisionButton = ports.root.querySelector("#confirm-schema-revision");
    const cancelSchemaRevisionButton = ports.root.querySelector("#cancel-schema-revision");
    const schemaCloseReview = ports.root.querySelector("#close-schema-editor-review");
    const schemaCloseReviewSummary = ports.root.querySelector("#schema-close-review-summary");
    const discardSchemaDraftButton = ports.root.querySelector("#discard-schema-draft");
    const keepEditingSchemaButton = ports.root.querySelector("#keep-editing-schema");
    const closeSchemaEditorButton = ports.root.querySelector("#close-schema-editor");
    const saveAndCloseSchemaButton = ports.root.querySelector("#save-and-close-schema");
    const saveSchemaCloseReviewButton = ports.root.querySelector("#save-schema-close-review");
    const discardWorkingSchemaDraftButton = ports.root.querySelector("#discard-working-schema-draft");
    const schemaRevisionSelector = ports.root.querySelector("#schema-revision-selector");
    const schemaRevisionComparison = ports.root.querySelector("#schema-revision-comparison");
    const duplicateSchemaRevisionButton = ports.root.querySelector("#duplicate-schema-revision");
    const restoreSchemaRevisionButton = ports.root.querySelector("#restore-schema-revision");
    const addSchemaPropertyButton = ports.root.querySelector("#add-schema-property");
    const schemaOwnerDocument = ports.root.ownerDocument
        ?? ("createElement" in ports.root ? ports.root : undefined);
    const ownedElement = (selector, tag) => ports.root.querySelector(selector) ?? schemaOwnerDocument?.createElement(tag) ?? null;
    const schemaInheritedRuleGroups = ownedElement("#schema-inherited-rule-groups", "section");
    const schemaEffectiveRulePreview = ownedElement("#schema-effective-rule-preview", "section");
    const schemaSpecificationBuilder = ownedElement("#schema-specification-builder", "section");
    const buildSpecificationButton = ownedElement("#build-specification", "button");
    const buildHistoricalSpecificationButton = ownedElement("#build-historical-specification", "button");
    if (schemaInheritedRuleGroups) {
        schemaInheritedRuleGroups.id = "schema-inherited-rule-groups";
        schemaInheritedRuleGroups.setAttribute("aria-label", "Inherited rule states");
    }
    if (schemaEffectiveRulePreview) {
        schemaEffectiveRulePreview.id = "schema-effective-rule-preview";
        schemaEffectiveRulePreview.setAttribute("aria-label", "Effective-rule preview");
    }
    if (schemaRuleOverrides && schemaInheritedRuleGroups && schemaEffectiveRulePreview) {
        schemaRuleOverrides.after(schemaInheritedRuleGroups, schemaEffectiveRulePreview);
    }
    if (schemaSpecificationBuilder) {
        schemaSpecificationBuilder.id = "schema-specification-builder";
        schemaSpecificationBuilder.hidden = true;
        schemaDetail?.append(schemaSpecificationBuilder);
    }
    if (buildSpecificationButton) {
        buildSpecificationButton.id = "build-specification";
        buildSpecificationButton.type = "button";
        buildSpecificationButton.textContent = "Build specification";
        schemaEditor?.prepend(buildSpecificationButton);
    }
    if (buildHistoricalSpecificationButton) {
        buildHistoricalSpecificationButton.id = "build-historical-specification";
        buildHistoricalSpecificationButton.type = "button";
        buildHistoricalSpecificationButton.textContent = "Build specification";
        restoreSchemaRevisionButton?.after(buildHistoricalSpecificationButton);
    }
    const schemaPropertyViewControls = ownedElement("#schema-property-view-controls", "div");
    const schemaPropertyFilterLabel = ownedElement("#schema-property-filter-label", "label");
    const schemaPropertyFilter = ownedElement("#schema-property-filter", "input");
    const schemaPropertySortLabel = ownedElement("#schema-property-sort-label", "label");
    const schemaPropertySort = ownedElement("#schema-property-sort", "select");
    const schemaPropertyResultStatus = ownedElement("#schema-property-result-status", "output");
    const schemaPropertyEmpty = ownedElement("#schema-property-empty", "div");
    const schemaPropertyEmptyMessage = ownedElement("#schema-property-empty-message", "p");
    const clearSchemaPropertyFilter = ownedElement("#clear-schema-property-filter", "button");
    const schemaPropertyTree = ownedElement("#schema-property-tree", "ul");
    const schemaPropertyRemovalFeedback = ownedElement("#schema-property-removal-feedback", "output");
    const undoSchemaPropertyRemovalButton = ownedElement("#undo-schema-property-removal", "button");
    const schemaPropertyCopyFeedback = ownedElement("#schema-property-copy-feedback", "output");
    const undoSchemaPropertyCopyButton = ownedElement("#undo-schema-property-copy", "button");
    const schemaPropertyCopyDialog = ownedElement("#schema-property-copy-dialog", "dialog");
    const schemaPropertyRemovalDialog = ownedElement("#schema-property-removal-dialog", "dialog");
    const schemaPropertyRemovalHeading = ownedElement("#schema-property-removal-heading", "h4");
    const schemaPropertyRemovalSummary = ownedElement("#schema-property-removal-summary", "output");
    const confirmSchemaPropertyRemovalButton = ownedElement("#confirm-schema-property-removal", "button");
    const cancelSchemaPropertyRemovalButton = ownedElement("#cancel-schema-property-removal", "button");
    const schemaDocumentationRemovalDialog = ownedElement("#schema-documentation-removal-dialog", "dialog");
    const schemaDocumentationRemovalHeading = ownedElement("#schema-documentation-removal-heading", "h4");
    const schemaDocumentationRemovalSummary = ownedElement("#schema-documentation-removal-summary", "p");
    const confirmSchemaDocumentationRemoval = ownedElement("#confirm-schema-documentation-removal", "button");
    const cancelSchemaDocumentationRemoval = ownedElement("#cancel-schema-documentation-removal", "button");
    const schemaSpecificIndexDialog = ownedElement("#schema-specific-index-dialog", "dialog");
    const schemaSpecificIndexForm = ownedElement("#schema-specific-index-form", "form");
    const schemaSpecificIndexHeading = ownedElement("#schema-specific-index-heading", "h4");
    const schemaSpecificIndexLabel = ownedElement("#schema-specific-index-label", "label");
    const schemaSpecificIndex = ownedElement("#schema-specific-index", "input");
    const schemaSpecificIndexAssistance = ownedElement("#schema-specific-index-assistance", "output");
    const confirmSchemaSpecificIndex = ownedElement("#confirm-schema-specific-index", "button");
    const cancelSchemaSpecificIndex = ownedElement("#cancel-schema-specific-index", "button");
    const schemaManualPropertyDialog = ownedElement("#schema-manual-property-dialog", "dialog");
    const schemaManualPropertyForm = ownedElement("#schema-manual-property-form", "form");
    const schemaManualPropertyHeading = ownedElement("#schema-manual-property-heading", "h4");
    const schemaManualPropertyPathLabel = ownedElement("#schema-manual-property-path-label", "label");
    const schemaManualPropertyPath = ownedElement("#schema-manual-property-path", "input");
    const schemaManualPropertyParentContext = ownedElement("#schema-manual-property-parent-context", "output");
    const schemaManualPropertyChildNameLabel = ownedElement("#schema-manual-property-child-name-label", "label");
    const schemaManualPropertyChildName = ownedElement("#schema-manual-property-child-name", "input");
    const schemaManualPropertyTypeLabel = ownedElement("#schema-manual-property-type-label", "label");
    const schemaManualPropertyType = ownedElement("#schema-manual-property-type", "select");
    const schemaManualArrayTypeGroup = ownedElement("#schema-manual-array-type-group", "label");
    const schemaManualArrayItemType = ownedElement("#schema-manual-array-item-type", "select");
    const schemaManualPropertyPreview = ownedElement("#schema-manual-property-preview", "output");
    const schemaManualPropertyAssistance = ownedElement("#schema-manual-property-assistance", "output");
    const goToExistingSchemaPropertyButton = ownedElement("#go-to-existing-schema-property", "button");
    const confirmSchemaManualPropertyButton = ownedElement("#confirm-schema-manual-property", "button");
    const cancelSchemaManualPropertyButton = ownedElement("#cancel-schema-manual-property", "button");
    const schemaPropertyRulePicker = ownedElement("#schema-property-rule-picker", "dialog");
    const createSchemaAssignmentButton = ports.root.querySelector("#create-schema-assignment");
    const createSchemaRuleButton = ports.root.querySelector("#create-schema-rule");
    const schemaRuleEditor = ports.root.querySelector("#schema-rule-editor");
    const schemaRuleName = ports.root.querySelector("#schema-rule-name");
    const schemaRuleParameters = ports.root.querySelector("#schema-rule-parameters");
    const schemaRuleTypes = ports.root.querySelector("#schema-rule-types");
    const schemaRuleOperator = ports.root.querySelector("#schema-rule-operator");
    const schemaRuleSeverity = ports.root.querySelector("#schema-rule-severity");
    const schemaRuleMessage = ports.root.querySelector("#schema-rule-message");
    const schemaRuleExamples = ports.root.querySelector("#schema-rule-examples");
    const saveSchemaRuleButton = ports.root.querySelector("#save-schema-rule");
    const schemaRuleList = ports.root.querySelector("#schema-rule-list");
    const schemaRuleSearch = ports.root.querySelector("#schema-rule-search");
    const schemaRuleAttachments = ports.root.querySelector("#schema-rule-attachments");
    const updateSchemaRuleAttachments = ports.root.querySelector("#update-schema-rule-attachments");
    const schemaRuleUpgradeReview = ownedElement("#schema-rule-upgrade-review", "dialog");
    const schemaRuleUpgradeReviewSummary = ownedElement("#schema-rule-upgrade-review-summary", "output");
    const confirmSchemaRuleUpgradeButton = ownedElement("#confirm-schema-rule-upgrade", "button");
    const cancelSchemaRuleUpgradeButton = ownedElement("#cancel-schema-rule-upgrade", "button");
    const schemaRuleRevisionReview = ownedElement("#schema-rule-revision-review", "dialog");
    const schemaRuleRevisionReviewSummary = ownedElement("#schema-rule-revision-review-summary", "output");
    const confirmSchemaRuleRevisionButton = ownedElement("#confirm-schema-rule-revision", "button");
    const cancelSchemaRuleRevisionButton = ownedElement("#cancel-schema-rule-revision", "button");
    const schemaRuleSyncReview = ownedElement("#schema-rule-sync-review", "dialog");
    const schemaRuleSyncReviewSummary = ownedElement("#schema-rule-sync-review-summary", "output");
    const confirmSchemaRuleSyncButton = ownedElement("#confirm-schema-rule-sync", "button");
    const cancelSchemaRuleSyncButton = ownedElement("#cancel-schema-rule-sync", "button");
    const exportSchemaRulesButton = ports.root.querySelector("#export-schema-rules");
    const schemaRuleDeleteReview = ownedElement("#schema-rule-delete-review", "dialog");
    const schemaRuleDeleteReviewSummary = ownedElement("#schema-rule-delete-review-summary", "output");
    const confirmSchemaRuleDeleteButton = ownedElement("#confirm-schema-rule-delete", "button");
    const cancelSchemaRuleDeleteButton = ownedElement("#cancel-schema-rule-delete", "button");
    const schemaAssignmentEditor = ports.root.querySelector("#schema-assignment-editor");
    const schemaAssignmentSource = ports.root.querySelector("#schema-assignment-source");
    const schemaAssignmentEvent = ports.root.querySelector("#schema-assignment-event");
    const schemaAssignmentPriority = ports.root.querySelector("#schema-assignment-priority");
    const saveSchemaAssignmentButton = ports.root.querySelector("#save-schema-assignment");
    const schemaAssignmentTarget = ports.root.querySelector("#schema-assignment-target");
    const schemaAssignmentDomain = ports.root.querySelector("#schema-assignment-domain");
    const schemaAssignmentPathname = ports.root.querySelector("#schema-assignment-pathname");
    const schemaAssignmentVersionPolicy = ports.root.querySelector("#schema-assignment-version-policy");
    const schemaAssignmentEnabled = ports.root.querySelector("#schema-assignment-enabled");
    const schemaAssignmentList = ports.root.querySelector("#schema-assignment-list");
    const schemaAssignmentConflicts = ports.root.querySelector("#schema-assignment-conflicts");
    const schemaAssignmentSchema = ports.root.querySelector("#schema-assignment-schema");
    const schemaAssignmentDataConditions = ownedElement("#schema-assignment-data-conditions", "section");
    const importSchemaButton = ports.root.querySelector("#import-schema");
    const schemaLibraryImportFile = ports.root.querySelector("#schema-library-import-file");
    const schemaImportReview = ownedElement("#schema-import-review", "dialog");
    const schemaImportReviewSummary = ownedElement("#schema-import-review-summary", "output");
    const replaceSchemaLibraryButton = ownedElement("#replace-schema-library", "button");
    const appendSchemaLibraryButton = ownedElement("#append-schema-library", "button");
    const cancelSchemaImportButton = ownedElement("#cancel-schema-import", "button");
    const schemaDeleteReview = ownedElement("#schema-delete-review", "dialog");
    const schemaDeleteReviewSummary = ownedElement("#schema-delete-review-summary", "output");
    const confirmSchemaDeleteButton = ownedElement("#confirm-schema-delete", "button");
    const cancelSchemaDeleteButton = ownedElement("#cancel-schema-delete", "button");
    const exportSchemaButton = ports.root.querySelector("#export-schema");
    const schemaExportChoices = ownedElement("#schema-export-choices", "dialog");
    const schemaExportReview = ownedElement("#schema-export-compatibility-review", "dialog");
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
            for (const [value, label] of [["schema", "Schema order"], ["name-asc", "Name A-Z"], ["name-desc", "Name Z-A"]]) {
                const option = schemaOwnerDocument?.createElement("option");
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
        const propertyControls = [schemaPropertyFilterLabel, schemaPropertyFilter, schemaPropertySortLabel,
            schemaPropertySort, schemaPropertyResultStatus];
        schemaPropertyViewControls.append(...propertyControls.filter((element) => element !== null));
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
    if (schemaPropertyCopyDialog && !schemaPropertyCopyDialog.isConnected) {
        schemaPropertyCopyDialog.id = "schema-property-copy-dialog";
        schemaOwnerDocument?.body.append(schemaPropertyCopyDialog);
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
        schemaOwnerDocument?.body.append(schemaPropertyRemovalDialog);
    }
    if (schemaDocumentationRemovalDialog && !schemaDocumentationRemovalDialog.isConnected) {
        schemaDocumentationRemovalDialog.id = "schema-documentation-removal-dialog";
        if (schemaDocumentationRemovalHeading) {
            schemaDocumentationRemovalHeading.id = "schema-documentation-removal-heading";
            schemaDocumentationRemovalHeading.textContent = "Remove property documentation?";
            schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalHeading);
        }
        if (schemaDocumentationRemovalSummary)
            schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalSummary);
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
        schemaOwnerDocument?.body.append(schemaDocumentationRemovalDialog);
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
        if (schemaSpecificIndexAssistance)
            schemaSpecificIndexForm.append(schemaSpecificIndexAssistance);
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
        schemaOwnerDocument?.body.append(schemaSpecificIndexDialog);
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
            for (const type of ["string", "number", "boolean", "object", "array"]) {
                const option = schemaOwnerDocument?.createElement("option");
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
                schemaManualArrayTypeGroup.append(schemaManualArrayItemType);
            }
        }
        append(schemaManualArrayTypeGroup);
        append(schemaManualPropertyPreview);
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
        schemaOwnerDocument?.body.append(schemaManualPropertyDialog);
    }
    if (schemaPropertyRulePicker && !schemaPropertyRulePicker.isConnected) {
        schemaPropertyRulePicker.id = "schema-property-rule-picker";
        schemaPropertyRulePicker.setAttribute("aria-label", "Schema property rule picker");
        schemaOwnerDocument?.body.append(schemaPropertyRulePicker);
    }
    const installRuleReviewDialog = (dialog, id, heading, summary, confirm, cancel) => {
        if (!dialog || dialog.isConnected)
            return;
        dialog.id = id;
        const title = schemaOwnerDocument?.createElement("h4");
        if (title) {
            title.textContent = heading;
            dialog.append(title);
        }
        if (summary) {
            summary.id = `${id}-summary`;
            dialog.append(summary);
        }
        if (confirm) {
            confirm.id = `confirm-${id.replace("-review", "")}`;
            confirm.type = "button";
            confirm.textContent = "Confirm";
            dialog.append(confirm);
        }
        if (cancel) {
            cancel.id = `cancel-${id.replace("-review", "")}`;
            cancel.type = "button";
            cancel.textContent = "Cancel";
            dialog.append(cancel);
        }
        schemaOwnerDocument?.body.append(dialog);
    };
    installRuleReviewDialog(schemaRuleRevisionReview, "schema-rule-revision-review", "Review rule revision", schemaRuleRevisionReviewSummary, confirmSchemaRuleRevisionButton, cancelSchemaRuleRevisionButton);
    installRuleReviewDialog(schemaRuleUpgradeReview, "schema-rule-upgrade-review", "Update pinned rule attachments", schemaRuleUpgradeReviewSummary, confirmSchemaRuleUpgradeButton, cancelSchemaRuleUpgradeButton);
    installRuleReviewDialog(schemaRuleSyncReview, "schema-rule-sync-review", "Sync attached schemas and publish revisions", schemaRuleSyncReviewSummary, confirmSchemaRuleSyncButton, cancelSchemaRuleSyncButton);
    installRuleReviewDialog(schemaRuleDeleteReview, "schema-rule-delete-review", "Delete reusable rule", schemaRuleDeleteReviewSummary, confirmSchemaRuleDeleteButton, cancelSchemaRuleDeleteButton);
    installRuleReviewDialog(schemaImportReview, "schema-import-review", "Import Schema Library", schemaImportReviewSummary, replaceSchemaLibraryButton, cancelSchemaImportButton);
    if (schemaImportReview && appendSchemaLibraryButton && !appendSchemaLibraryButton.isConnected) {
        appendSchemaLibraryButton.id = "append-schema-library";
        appendSchemaLibraryButton.type = "button";
        appendSchemaLibraryButton.textContent = "Append";
        schemaImportReview.append(appendSchemaLibraryButton);
    }
    installRuleReviewDialog(schemaDeleteReview, "schema-delete-review", "Delete schema", schemaDeleteReviewSummary, confirmSchemaDeleteButton, cancelSchemaDeleteButton);
    if (schemaExportChoices && !schemaExportChoices.isConnected) {
        schemaExportChoices.id = "schema-export-choices";
        schemaOwnerDocument?.body.append(schemaExportChoices);
    }
    if (schemaExportReview && !schemaExportReview.isConnected) {
        schemaExportReview.id = "schema-export-compatibility-review";
        schemaOwnerDocument?.body.append(schemaExportReview);
    }
    if (schemaAssignmentDataConditions && !schemaAssignmentDataConditions.isConnected) {
        schemaAssignmentDataConditions.id = "schema-assignment-data-conditions";
        schemaAssignmentDataConditions.setAttribute("aria-label", "Data layer conditions");
        schemaAssignmentEditor?.insertBefore(schemaAssignmentDataConditions, saveSchemaAssignmentButton);
    }
    let mounted = false;
    let lifecycleGeneration = 0;
    let unsubscribe;
    let unsubscribeSchemaPersistence;
    let schemaTreeProjectId;
    let schemaTreeExpandedKeys = new Set();
    let schemaTreeInvokingReference;
    let schemaTreeRestoringScroll = false;
    let schemaTreePendingScroll;
    const schemaTreeStorage = ports.relationshipViewStorage;
    let activeSchemaProjectHydration;
    const schemaContributorRoute = { collectionKinds: ["profiles", "propertySets", "pages", "events", "flows"], includeFlowGraphs: true };
    let schemaRowDisposers = [];
    const clearSchemaRowListeners = () => { for (const dispose of schemaRowDisposers.splice(0))
        dispose(); };
    const listen = (target, type, listener) => {
        target.addEventListener(type, listener);
        schemaRowDisposers.push(() => target.removeEventListener(type, listener));
    };
    const storedSchemaLibrary = ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
    let schemas = restoreSchemaLibrary(storedSchemaLibrary);
    let activeSchemaId;
    let schemaDraft;
    let selectedSchemaPropertyPath = "example";
    const expandedSchemaPropertyRulePaths = new Set();
    let pendingSchemaPropertyRemoval;
    let lastSchemaPropertyRemoval;
    let lastSchemaPropertyCopy;
    let pendingSchemaPropertyCopy;
    let pendingSchemaDocumentationRemoval;
    let specificIndexArrayPath;
    let specificIndexTrigger;
    let pendingManualPropertyContext;
    let schemaRulePickerPath;
    let schemaRulePickerTrigger;
    let schemaPropertyInteractionReturn;
    let schemaPropertyRenderSequence = 0;
    let schemaRuleConfiguration;
    let editingAttachedLocalRule;
    let reusableSchemaRules = (() => {
        try {
            const stored = JSON.parse(ports.storage.getItem(SCHEMA_RULE_STORAGE_KEY) ?? "[]");
            return Array.isArray(stored) ? stored.filter((rule) => Boolean(rule && typeof rule === "object" && "id" in rule)) : [];
        }
        catch {
            return [];
        }
    })();
    let pendingSchemaRuleRevision;
    let pendingSchemaRuleUpgrade;
    let pendingSchemaRuleSync;
    let pendingReusableSchemaRuleDeletionId;
    let editingSchemaAssignment;
    let schemaAssignmentConditionState = { target: "payload", suggestions: [] };
    let pendingSchemaImport;
    let pendingSchemaDeletion;
    const localRulePromotionDialog = ports.localRulePromotionDialog;
    let pendingLocalRulePromotion;
    let pendingLocalRulePromotionPersistence;
    let pendingGuidedValidationPersistence;
    let persistenceGeneration = 0;
    let schemaExportTrigger;
    let pendingStandardSchemaExport;
    const activeIndex = () => schemas.findIndex(({ id }) => id === activeSchemaId);
    const active = () => {
        const schema = schemas[activeIndex()];
        if (!schema)
            throw new Error("Open a schema before editing its draft");
        return schema;
    };
    const persistSchemaLibrary = () => {
        ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(schemas));
        ports.changed(schemas);
    };
    const replaceActive = (schema) => {
        const index = activeIndex();
        if (index < 0)
            throw new Error("Open a schema before editing its draft");
        schemas = schemas.map((candidate, candidateIndex) => candidateIndex === index ? schema : candidate);
        schemaDraft = structuredClone(schema);
    };
    const revisionVersion = () => Number(schemaRevisionSelector?.value || active().version);
    const renderSchemaPropertyView = () => {
        const schema = activeSchemaId ? active() : undefined;
        const rows = schema ? schemaPropertyRows(schema.workingDraft?.document ?? schema.document) : [];
        const propertyView = filterAndSortSchemaPropertyRows(rows, schemaPropertyFilter?.value ?? "", (schemaPropertySort?.value || "schema"));
        if (schemaPropertyResultStatus)
            schemaPropertyResultStatus.textContent = `${propertyView.matchCount} of ${propertyView.totalCount} properties`;
        if (schemaPropertyEmpty)
            schemaPropertyEmpty.hidden = propertyView.rows.length > 0;
        if (schemaPropertyEmptyMessage)
            schemaPropertyEmptyMessage.textContent = propertyView.rows.length
                ? "" : `No properties match ${schemaPropertyFilter?.value.trim() ?? ""}`;
        if (schemaPropertyTree) {
            const items = propertyView.rows.flatMap((row) => {
                const item = schemaOwnerDocument?.createElement("li");
                if (!item)
                    return [];
                item.dataset.propertyPath = row.canonicalPath;
                item.textContent = row.displayPath;
                return [item];
            });
            schemaPropertyTree.replaceChildren(...items);
        }
        if (addSchemaPropertyButton)
            addSchemaPropertyButton.disabled = !schema;
    };
    function renderSchemaDraft() {
        const schema = activeSchemaId ? active() : undefined;
        const draft = schema?.workingDraft;
        const presented = schema ? schemaEditorDraft(schema) : undefined;
        if (schemaEditor)
            schemaEditor.hidden = !schema;
        if (schemaDetail)
            schemaDetail.hidden = !schema;
        if (schemaDetailEmpty)
            schemaDetailEmpty.hidden = Boolean(schema);
        if (schemaEditorName)
            schemaEditorName.value = draft?.name ?? schema?.name ?? "";
        if (schemaEditorDescription)
            schemaEditorDescription.value = draft?.documentation?.description
                ?? schema?.documentation?.description ?? "";
        if (schemaDescriptionOrigin)
            schemaDescriptionOrigin.textContent = draft?.documentation?.description
                ? "Working draft" : schema?.documentation?.description ? `Revision ${schema.version}` : "No description";
        if (schemaEditorTarget)
            schemaEditorTarget.value = draft?.assignments[0]?.target ?? schema?.assignments[0]?.target ?? "payload";
        if (schemaOnlyDeclaredProperties)
            schemaOnlyDeclaredProperties.checked = presented?.document.additionalProperties === false;
        if (schemaEditorParent && presented && schemaOwnerDocument) {
            const parents = schemas.filter(({ id }) => id !== presented.id);
            const empty = schemaOwnerDocument.createElement("option");
            empty.value = "";
            empty.textContent = "No parent";
            schemaEditorParent.replaceChildren(empty, ...parents.map((candidate) => {
                const option = schemaOwnerDocument.createElement("option");
                option.value = candidate.id;
                option.textContent = `${candidate.name} v${candidate.version}`;
                return option;
            }));
            schemaEditorParent.value = presented.parentSchemaId ?? "";
        }
        const parent = presented?.parentSchemaId ? schemas.find(({ id }) => id === presented.parentSchemaId) : undefined;
        if (schemaInheritanceProvenance)
            schemaInheritanceProvenance.textContent = parent
                ? `Inherited rules originate in ${parent.name} v${parent.version}. Local rules override only after conflicts are resolved.` : "Local schema only";
        if (schemaRuleOverrides)
            schemaRuleOverrides.hidden = !parent;
        if (schemaRuleOverrideList && schemaOwnerDocument)
            schemaRuleOverrideList.replaceChildren(...Object.keys(parent?.document.properties ?? {}).map((property) => {
                const label = schemaOwnerDocument.createElement("label"), select = schemaOwnerDocument.createElement("select");
                select.setAttribute("aria-label", `${property} inherited rule override`);
                select.replaceChildren(...["inherit", "enabled", "disabled"].map((state) => {
                    const option = schemaOwnerDocument.createElement("option");
                    option.value = state;
                    option.textContent = state === "inherit" ? "Inherit" : state === "enabled" ? "Enabled in this schema" : "Disabled in this schema";
                    return option;
                }));
                select.value = presented?.inheritedRuleOverrides?.[property] ?? "inherit";
                listen(select, "change", () => {
                    if (!activeSchemaId)
                        return;
                    const current = active(), currentDraft = schemaEditorDraft(current);
                    replaceActive(updateSchemaWorkingDraft(current, { inheritedRuleOverrides: { ...(currentDraft.inheritedRuleOverrides ?? {}),
                            [property]: select.value } }, `Change inherited rule override ${property}`));
                    persistSchemaLibrary();
                    renderSchemas();
                });
                label.append(`${property}: `, select);
                return label;
            }));
        if (presented)
            renderSchemaInheritancePresentation(presented);
        const pendingChanges = draft?.pendingChanges ?? [];
        if (buildSpecificationButton) {
            buildSpecificationButton.hidden = !draft;
            buildSpecificationButton.onclick = schema && draft ? () => openSchemaSpecification(schema, "working-draft", buildSpecificationButton) : null;
        }
        const historyVersions = schema ? schemaRevisionChoices(schema) : [];
        if (buildHistoricalSpecificationButton) {
            buildHistoricalSpecificationButton.disabled = historyVersions.length === 0;
            buildHistoricalSpecificationButton.onclick = schema && historyVersions.length
                ? () => openSchemaSpecification(schema, `historical:${revisionVersion()}`, buildHistoricalSpecificationButton) : null;
        }
        if (saveSchemaReason)
            saveSchemaReason.textContent = pendingChanges.join("; ");
        if (schemaRevisionReviewSummary)
            schemaRevisionReviewSummary.textContent = pendingChanges.length
                ? pendingChanges.join("; ") : "No pending changes";
        if (schemaCloseReviewSummary)
            schemaCloseReviewSummary.textContent = draft
                ? `${pendingChanges.length} pending change${pendingChanges.length === 1 ? "" : "s"}` : "No pending changes";
        if (confirmSchemaRevisionButton && schema)
            confirmSchemaRevisionButton.textContent = schema.published === false
                ? "Publish revision 1" : `Publish revision ${schema.version + 1}`;
        if (schemaRevisionComparison && schema)
            schemaRevisionComparison.textContent = `Revision ${revisionVersion()} compared with ${schema.version}`;
        if (schemaEditorNameAssistance && schema)
            schemaEditorNameAssistance.textContent = inspectSchemaRename(schema, schemas, schemaEditorName?.value ?? draft?.name ?? schema.name).assistance;
        renderSchemaPropertyView();
    }
    function restorePendingSchemaTreeScroll() {
        if (schemaTreePendingScroll === undefined || !schemaTreeScrollOwner)
            return;
        const scrollTop = schemaTreePendingScroll;
        schemaTreeRestoringScroll = true;
        queueMicrotask(() => {
            schemaTreeScrollOwner.scrollTop = scrollTop;
            schemaTreePendingScroll = undefined;
            ports.scheduleFrame(() => { schemaTreeRestoringScroll = false; });
        });
    }
    function persistSchemaTreeView(projectId) {
        saveSchemaRelationshipTreeView(schemaTreeStorage, projectId, { query: schemaSearch?.value ?? "",
            category: (schemaCategoryFilter?.value ?? "All"),
            expandedKeys: [...schemaTreeExpandedKeys], scrollTop: schemaTreeScrollOwner?.scrollTop ?? 0 });
    }
    function hydrateActiveProjectForSchemas() {
        if (activeSchemaProjectHydration)
            return activeSchemaProjectHydration;
        const activeProjectId = ports.activeProjectId();
        if (!activeProjectId)
            return;
        const operation = lifecycleGeneration;
        if (schemaResult)
            schemaResult.textContent = "Loading active project schema contributors from durable storage…";
        activeSchemaProjectHydration = ports.ensureProjectSchemaContributors(activeProjectId, schemaContributorRoute)
            .then(({ name }) => {
            if (!mounted || operation !== lifecycleGeneration)
                return;
            renderSchemas();
            if (schemaResult)
                schemaResult.textContent = `Loaded schema contributors for ${name}.`;
        })
            .catch((error) => {
            if (mounted && operation === lifecycleGeneration && schemaResult) {
                schemaResult.textContent = `Schema contributors are unavailable. ${error instanceof Error ? error.message : String(error)}`;
            }
        })
            .finally(() => { activeSchemaProjectHydration = undefined; });
        return activeSchemaProjectHydration;
    }
    const renderSchemas = () => {
        if (!mounted)
            return;
        clearSchemaRowListeners();
        const relationship = ports.relationshipTree(schemas), projectId = relationship.projectId;
        const allNodes = (nodes) => nodes.flatMap((node) => [node, ...allNodes(node.children)]);
        const validNodes = allNodes(relationship.nodes), validKeys = new Set(validNodes.map(({ key }) => key));
        if (schemaTreeProjectId !== projectId) {
            schemaTreeProjectId = projectId;
            const restored = restoreSchemaRelationshipTreeView(schemaTreeStorage, projectId, validKeys);
            schemaTreeExpandedKeys = new Set(restored.expandedKeys.length ? restored.expandedKeys
                : validNodes.filter(({ children }) => children.length).map(({ key }) => key));
            if (schemaSearch)
                schemaSearch.value = restored.query;
            if (schemaCategoryFilter)
                schemaCategoryFilter.value = restored.category;
            schemaTreePendingScroll = restored.scrollTop;
            if (!schemaPanel?.hidden)
                restorePendingSchemaTreeScroll();
        }
        else
            schemaTreeExpandedKeys = new Set([...schemaTreeExpandedKeys].filter((key) => validKeys.has(key)));
        const filtered = filterSchemaRelationshipTree(relationship.nodes, { query: schemaSearch?.value ?? "",
            category: (schemaCategoryFilter?.value ?? "All") });
        const rows = [], document = schemaList?.ownerDocument;
        const savedRow = (node, level) => {
            const schema = schemas.find(({ id }) => `saved:${id}` === node.targetKey);
            if (!schema || !document)
                return;
            const item = document.createElement("li"), revise = document.createElement("button"), duplicate = document.createElement("button"), adopt = document.createElement("button"), build = document.createElement("button"), exportCurrent = document.createElement("button"), reportMissing = document.createElement("button"), remove = document.createElement("button");
            const pending = schema.workingDraft?.pendingChanges.length ?? 0, history = schemaRevisionChoices(schema).length;
            item.dataset.schemaEntryKey = node.targetKey;
            item.dataset.schemaReferenceKey = node.key;
            item.dataset.schemaRole = node.role;
            item.setAttribute("role", "treeitem");
            item.setAttribute("aria-level", String(level));
            item.setAttribute("aria-selected", String(activeSchemaId === schema.id));
            item.textContent = schema.published === false
                ? `${schema.name} · role Saved schema · path ${node.relationshipPath} · revision ${schema.version} · Draft · ${pending} pending changes. `
                : `${schema.name} · current revision ${schema.version} · role Saved schema · path ${node.relationshipPath} · saved · ${pending} pending draft changes · ${history} historical revisions · ${schema.assignments.map((assignment) => `${assignment.sourceId}/${assignment.eventName}/${assignment.target}`).join(", ") || "unassigned"}. `;
            revise.type = duplicate.type = adopt.type = build.type = exportCurrent.type = reportMissing.type = remove.type = "button";
            revise.textContent = "Edit working draft";
            duplicate.textContent = "Duplicate";
            adopt.textContent = "Add saved schema to project";
            build.textContent = "Build documentation table";
            exportCurrent.textContent = "Export";
            reportMissing.textContent = "Report missing event";
            remove.textContent = "Delete";
            listen(revise, "click", () => { schemaTreeInvokingReference = node.key; activeSchemaId = schema.id; schemaDraft = structuredClone(schema); renderSchemas(); });
            listen(duplicate, "click", () => { schemas = [...schemas, duplicateSchemaRevision(schema, schema.version, schemas)]; persistSchemaLibrary(); renderSchemas(); });
            listen(adopt, "click", () => reviewSavedSchemaAdoption(schema, adopt));
            listen(build, "click", () => openSchemaSpecification(schema, `published:${schema.version}`, build));
            listen(exportCurrent, "click", () => openSchemaExportChoices(exportCurrent, schema));
            listen(reportMissing, "click", () => ports.reportMissingSchemaEvent(schema.id));
            listen(remove, "click", () => {
                const children = schemas.filter((candidate) => candidate.parentSchemaId === schema.id);
                if (children.length) {
                    if (schemaResult)
                        schemaResult.textContent = `Cannot delete ${schema.name}: it is the parent of ${children.map(({ name }) => name).join(", ")}.`;
                    return;
                }
                pendingSchemaDeletion = schema;
                if (schemaDeleteReviewSummary)
                    schemaDeleteReviewSummary.textContent = `${schema.name} v${schema.version} and its assignments will be removed.`;
                schemaDeleteReview?.showModal();
            });
            item.append(revise, duplicate, adopt, build, exportCurrent, reportMissing, remove);
            return item;
        };
        const visit = (node, level) => {
            if (node.targetKey?.startsWith("saved:")) {
                const item = savedRow(node, level);
                if (item)
                    rows.push(item);
                return;
            }
            if (!document)
                return;
            const item = document.createElement("li");
            item.dataset.schemaReferenceKey = node.key;
            item.setAttribute("role", "treeitem");
            item.setAttribute("aria-level", String(level));
            if (node.targetKey) {
                const open = document.createElement("button"), studio = document.createElement("button");
                item.dataset.schemaEntryKey = node.targetKey;
                item.dataset.schemaRole = node.role;
                item.textContent = `${node.name} · role ${node.role} · path ${node.relationshipPath}. `;
                open.type = studio.type = "button";
                open.textContent = "Open schema";
                studio.textContent = "Open schema in Specification Studio";
                listen(open, "click", () => { schemaTreeInvokingReference = node.key; openContributorInUnifiedEditor(node.targetKey); });
                listen(studio, "click", () => ports.openContributorInStudio(node.targetKey));
                item.append(open, studio);
            }
            else {
                const toggle = document.createElement("button"), expanded = node.expanded || schemaTreeExpandedKeys.has(node.key);
                item.dataset.schemaGroup = node.name;
                item.setAttribute("aria-expanded", String(expanded));
                toggle.type = "button";
                toggle.textContent = node.name;
                listen(toggle, "click", () => {
                    if (expanded)
                        schemaTreeExpandedKeys.delete(node.key);
                    else
                        schemaTreeExpandedKeys.add(node.key);
                    persistSchemaTreeView(projectId);
                    renderSchemas();
                });
                item.append(toggle);
            }
            rows.push(item);
            const expanded = node.expanded || schemaTreeExpandedKeys.has(node.key);
            if (node.children.length && (node.targetKey || expanded))
                for (const child of node.children)
                    visit(child, level + 1);
        };
        for (const root of filtered)
            visit(root, 1);
        if (projectId === "no-project" && document) {
            const item = document.createElement("li"), open = document.createElement("button"), create = document.createElement("button");
            item.setAttribute("role", "status");
            item.textContent = "No active project. Open a project to see relationship-derived contributors. ";
            open.type = create.type = "button";
            open.textContent = "Open project";
            create.textContent = "Create project";
            listen(open, "click", () => ports.openProjectLibrary(false));
            listen(create, "click", () => ports.openProjectLibrary(true));
            item.append(open, create);
            rows.push(item);
        }
        const resultCount = rows.filter(({ dataset }) => Boolean(dataset.schemaEntryKey)).length;
        if (schemaEmptyState)
            schemaEmptyState.hidden = resultCount > 0;
        if (schemaCount) {
            schemaCount.textContent = `${resultCount} relationship-tree results`;
            schemaCount.setAttribute("aria-label", `${resultCount} schema relationship-tree results`);
        }
        schemaList?.replaceChildren(...rows);
        if (schemaResult)
            schemaResult.textContent = activeSchemaId ? `Selected ${activeSchemaId}` : "";
        renderSchemaDraft();
        renderSchemaAssignments();
    };
    const updateSchemaTreeView = () => { if (schemaTreeProjectId)
        persistSchemaTreeView(schemaTreeProjectId); renderSchemas(); };
    const persistSchemaTreeScroll = () => {
        if (schemaTreeProjectId && !schemaTreeRestoringScroll && schemaTreePendingScroll === undefined && !schemaPanel?.hidden) {
            persistSchemaTreeView(schemaTreeProjectId);
        }
    };
    const navigateSchemaTree = (event) => {
        const target = event.target;
        const controls = Array.from(schemaList?.querySelectorAll("li[role=treeitem] > button:first-of-type") ?? []);
        const current = target ? controls.indexOf(target) : -1;
        if (current < 0 || !target)
            return;
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? controls.length - 1
                : Math.max(0, Math.min(controls.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)));
            controls[next]?.focus({ preventScroll: false });
        }
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            const row = target.closest('[role="treeitem"][aria-expanded]');
            if (!row)
                return;
            const expanded = row.getAttribute("aria-expanded") === "true";
            if ((event.key === "ArrowRight" && !expanded) || (event.key === "ArrowLeft" && expanded)) {
                event.preventDefault();
                target.click();
            }
        }
    };
    const persistSchemaEditorDraft = () => {
        if (!activeSchemaId)
            return;
        const schema = active();
        replaceActive(proposeSchemaWorkingDraftName(schema, schemaEditorName?.value ?? schema.name));
        persistSchemaLibrary();
        renderSchemas();
    };
    const saveSchemaDescription = () => {
        if (!activeSchemaId)
            return;
        const schema = active();
        const documentation = updateSchemaDescription(schema.workingDraft?.documentation ?? schema.documentation ?? {}, schemaEditorDescription?.value ?? "");
        replaceActive(updateSchemaWorkingDraft(schema, { documentation }, "Update schema description"));
        persistSchemaLibrary();
        renderSchemas();
    };
    const updateSchemaTarget = () => {
        if (!activeSchemaId)
            return;
        const schema = active();
        const assignments = (schema.workingDraft?.assignments ?? schema.assignments)
            .map((assignment) => ({ ...assignment, target: (schemaEditorTarget?.value === "raw input" ? "raw input" : "payload") }));
        replaceActive(updateSchemaWorkingDraft(schema, { assignments }, "Update validation target"));
        persistSchemaLibrary();
        renderSchemas();
    };
    const changeSchemaParent = () => {
        if (!activeSchemaId)
            return;
        const schema = active(), draft = schemaEditorDraft(schema);
        const changed = withSchemaParent(draft, schemaEditorParent?.value || undefined);
        replaceActive(updateSchemaWorkingDraft(schema, { parentSchemaId: changed.parentSchemaId }, "Change parent schema"));
        persistSchemaLibrary();
        renderSchemas();
    };
    const changeOnlyDeclaredProperties = () => {
        if (!activeSchemaId)
            return;
        const schema = active(), draft = schemaEditorDraft(schema);
        const { additionalProperties: _previous, ...document } = draft.document;
        replaceActive(updateSchemaWorkingDraft(schema, { document: schemaOnlyDeclaredProperties?.checked
                ? { ...document, additionalProperties: false } : document }, "Change additional-property policy"));
        persistSchemaLibrary();
        renderSchemas();
    };
    const openSchemaRevisionReview = () => { renderSchemaDraft(); schemaRevisionReview?.showModal(); };
    const publishActiveSchema = () => {
        const published = publishSchemaWorkingDraft(active());
        replaceActive(published);
        persistSchemaLibrary();
        schemaRevisionReview?.close();
        renderSchemas();
        return published;
    };
    const confirmSchemaRevision = () => { publishActiveSchema(); };
    const cancelSchemaRevision = () => schemaRevisionReview?.close();
    const discardSchemaDraft = () => { replaceActive(discardSchemaWorkingDraft(active())); persistSchemaLibrary(); renderSchemas(); };
    const keepEditingSchema = () => { schemaCloseReview?.close(); schemaEditorName?.focus(); };
    const closeSchemaEditor = () => {
        if (active().workingDraft)
            schemaCloseReview?.showModal();
        else {
            activeSchemaId = undefined;
            schemaDraft = undefined;
            renderSchemas();
        }
    };
    const saveAndCloseSchema = () => {
        if (active().workingDraft)
            publishActiveSchema();
        activeSchemaId = undefined;
        schemaDraft = undefined;
        schemaCloseReview?.close();
        renderSchemas();
    };
    const discardWorkingSchemaDraft = () => {
        discardSchemaDraft();
        activeSchemaId = undefined;
        schemaDraft = undefined;
        schemaCloseReview?.close();
        renderSchemas();
    };
    const renderSchemaRevisionComparison = () => renderSchemaDraft();
    const duplicateSelectedSchemaRevision = () => {
        const duplicate = duplicateSchemaRevision(active(), revisionVersion(), schemas);
        schemas = [...schemas, duplicate];
        activeSchemaId = duplicate.id;
        schemaDraft = structuredClone(duplicate);
        persistSchemaLibrary();
        renderSchemas();
    };
    const restoreSelectedSchemaRevision = () => {
        replaceActive(restoreSchemaRevisionDraft(active(), revisionVersion()));
        persistSchemaLibrary();
        renderSchemas();
    };
    const clearSchemaPropertyViewFilter = () => {
        if (schemaPropertyFilter)
            schemaPropertyFilter.value = "";
        renderSchemaPropertyView();
        schemaPropertyFilter?.focus();
    };
    function showSchemaSubview(subview) {
        for (const tab of schemaSubviews)
            tab.setAttribute("aria-selected", String(tab.dataset.schemaSubview === subview));
        for (const panel of schemaPanels)
            panel.hidden = panel.id !== subview;
        if (liveEventQuery)
            liveEventQuery.hidden = subview !== "schema-master";
    }
    const activateSchemaSubview = (event) => {
        const subview = event.currentTarget.dataset.schemaSubview;
        if (subview)
            showSchemaSubview(subview);
    };
    function applySchemaPropertyRemoval(path) {
        const schema = active();
        const draft = schema.workingDraft;
        if (!draft)
            return;
        const removal = removeSchemaProperty(draft.document, draft.attachedRules ?? [], path, draft.documentation);
        lastSchemaPropertyRemoval = removal;
        selectedSchemaPropertyPath = removal.propertyPath.slice(1).replaceAll("/", ".");
        expandedSchemaPropertyRulePaths.delete(removal.propertyPath);
        replaceActive(updateSchemaWorkingDraft(schema, { document: removal.document, attachedRules: removal.attachedRules,
            ...(removal.documentation !== undefined ? { documentation: removal.documentation } : {}) }, `Remove property ${removal.propertyPath} and property-specific constraints`));
        if (schemaPropertyRemovalFeedback)
            schemaPropertyRemovalFeedback.textContent = `Removed ${removal.propertyPath} from the working draft. Undo is available.`;
        if (undoSchemaPropertyRemovalButton)
            undoSchemaPropertyRemovalButton.hidden = false;
        persistSchemaLibrary();
        renderSchemas();
    }
    function requestSchemaPropertyRemoval(path, trigger) {
        const schema = active();
        const draft = schema.workingDraft;
        if (!draft)
            return;
        const inspection = inspectSchemaPropertyRemoval(draft.document, draft.attachedRules ?? [], path, draft.documentation);
        if (!inspection.requiresConfirmation) {
            applySchemaPropertyRemoval(path);
            return;
        }
        pendingSchemaPropertyRemoval = { path, ...(trigger ? { trigger } : {}) };
        if (schemaPropertyRemovalSummary)
            schemaPropertyRemovalSummary.textContent = `${inspection.propertyPath} contains ${inspection.descendants.length} descendants: ${inspection.descendants.join(", ") || "none"}. ${inspection.affectedRuleAttachments.length} affected rule attachments. Documentation entries: ${inspection.affectedDocumentationPaths?.join(", ") || "none"}. No changes occur until confirmation.`;
        schemaPropertyRemovalDialog?.showModal();
        schemaPropertyRemovalHeading?.focus();
    }
    function closeSchemaPropertyRemovalDialog(restoreFocus = true) {
        const trigger = pendingSchemaPropertyRemoval?.trigger;
        pendingSchemaPropertyRemoval = undefined;
        if (schemaPropertyRemovalDialog?.open)
            schemaPropertyRemovalDialog.close();
        if (restoreFocus)
            trigger?.focus();
    }
    const confirmSchemaPropertyRemoval = () => {
        const path = pendingSchemaPropertyRemoval?.path;
        closeSchemaPropertyRemovalDialog(false);
        if (path)
            applySchemaPropertyRemoval(path);
    };
    const cancelSchemaPropertyRemoval = () => closeSchemaPropertyRemovalDialog();
    const cancelSchemaPropertyRemovalFromDialog = (event) => { event.preventDefault(); closeSchemaPropertyRemovalDialog(); };
    const undoLastSchemaPropertyRemoval = () => {
        if (!lastSchemaPropertyRemoval)
            return;
        const schema = active();
        const restored = undoSchemaPropertyRemoval(lastSchemaPropertyRemoval);
        const path = lastSchemaPropertyRemoval.propertyPath;
        selectedSchemaPropertyPath = path.slice(1).replaceAll("/", ".");
        expandedSchemaPropertyRulePaths.add(path);
        replaceActive(updateSchemaWorkingDraft(schema, { document: restored.document, attachedRules: restored.attachedRules,
            ...(restored.documentation !== undefined ? { documentation: restored.documentation } : {}) }, `Undo property removal ${path}`));
        if (schemaPropertyRemovalFeedback)
            schemaPropertyRemovalFeedback.textContent = `Restored ${path} with its prior definition and tree position.`;
        if (undoSchemaPropertyRemovalButton)
            undoSchemaPropertyRemovalButton.hidden = true;
        lastSchemaPropertyRemoval = undefined;
        persistSchemaLibrary();
        renderSchemas();
    };
    function requestSchemaDocumentationRemoval(path, trigger) {
        pendingSchemaDocumentationRemoval = { path, ...(trigger ? { trigger } : {}) };
        if (schemaDocumentationRemovalSummary)
            schemaDocumentationRemovalSummary.textContent = `${path} documentation will be removed from the working draft. The schema property and validation rules remain unchanged.`;
        schemaDocumentationRemovalDialog?.showModal();
        schemaDocumentationRemovalHeading?.focus();
    }
    function closeSchemaDocumentationRemoval(restoreFocus = true) {
        const trigger = pendingSchemaDocumentationRemoval?.trigger;
        pendingSchemaDocumentationRemoval = undefined;
        if (schemaDocumentationRemovalDialog?.open)
            schemaDocumentationRemovalDialog.close();
        if (restoreFocus)
            trigger?.focus();
    }
    const confirmSchemaDocumentationRemovalAction = () => {
        const path = pendingSchemaDocumentationRemoval?.path;
        if (!path)
            return;
        const schema = active();
        const draft = schema.workingDraft;
        closeSchemaDocumentationRemoval(false);
        if (!draft)
            return;
        const documentation = setPropertyDocumentation(draft.documentation ?? {}, path, { displayName: "", description: "" });
        replaceActive(updateSchemaWorkingDraft(schema, { documentation }, `Remove property documentation ${path}`));
        persistSchemaLibrary();
        renderSchemas();
    };
    const cancelSchemaDocumentationRemovalAction = () => closeSchemaDocumentationRemoval();
    const cancelSchemaDocumentationRemovalFromDialog = (event) => { event.preventDefault(); closeSchemaDocumentationRemoval(); };
    function openSchemaPropertyCopyReview(path, destinationId) {
        const sourceSchema = active();
        const destination = schemas.find(({ id }) => id === destinationId);
        if (!destination)
            throw new Error(`Unknown destination schema ${destinationId}`);
        const source = schemaPropertyCopySource(sourceSchema, { surface: sourceSchema.workingDraft ? "working draft" : "current" });
        pendingSchemaPropertyCopy = planSchemaPropertyCopy({ source, destination, selectedPath: path, schemas, reusableRuleIds: [] });
        if (!pendingSchemaPropertyCopy.ready)
            throw new Error("Resolve property-copy conflicts before confirmation");
        schemaPropertyCopyDialog?.showModal();
    }
    const confirmSchemaPropertyCopy = () => {
        if (!pendingSchemaPropertyCopy)
            return;
        const transaction = applySchemaPropertyCopy(pendingSchemaPropertyCopy);
        schemas = schemas.map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema);
        lastSchemaPropertyCopy = transaction;
        pendingSchemaPropertyCopy = undefined;
        schemaPropertyCopyDialog?.close();
        if (schemaPropertyCopyFeedback)
            schemaPropertyCopyFeedback.textContent = `Copied ${transaction.plan.selectedPath} from ${transaction.plan.source.label} to ${transaction.schema.name}. Published revisions are unchanged.`;
        if (undoSchemaPropertyCopyButton)
            undoSchemaPropertyCopyButton.hidden = false;
        persistSchemaLibrary();
        renderSchemas();
    };
    const undoLastSchemaPropertyCopy = () => {
        if (!lastSchemaPropertyCopy)
            return;
        const restored = undoSchemaPropertyCopy(lastSchemaPropertyCopy).schema;
        schemas = schemas.map((schema) => schema.id === restored.id ? restored : schema);
        if (schemaPropertyCopyFeedback)
            schemaPropertyCopyFeedback.textContent = `Undid property copy to ${restored.name}; the pre-copy working draft was restored.`;
        if (undoSchemaPropertyCopyButton)
            undoSchemaPropertyCopyButton.hidden = true;
        lastSchemaPropertyCopy = undefined;
        persistSchemaLibrary();
        renderSchemas();
    };
    const renderSpecificIndexInspection = () => {
        if (!specificIndexArrayPath || !active().workingDraft)
            return;
        const inspection = inspectSpecificIndexRuleTarget(active().workingDraft.document, specificIndexArrayPath, schemaSpecificIndex?.value ?? "");
        if (confirmSchemaSpecificIndex)
            confirmSchemaSpecificIndex.disabled = inspection.result !== "accepted";
        if (schemaSpecificIndexAssistance)
            schemaSpecificIndexAssistance.textContent = inspection.assistance;
    };
    const openSpecificIndexDialog = (arrayPath, trigger) => {
        specificIndexArrayPath = arrayPath;
        specificIndexTrigger = trigger;
        if (schemaSpecificIndex)
            schemaSpecificIndex.value = "";
        if (confirmSchemaSpecificIndex)
            confirmSchemaSpecificIndex.disabled = true;
        if (schemaSpecificIndexAssistance)
            schemaSpecificIndexAssistance.textContent = "Enter a non-negative zero-based index";
        schemaSpecificIndexDialog?.showModal();
        schemaSpecificIndex?.focus();
    };
    const submitSpecificIndex = (event) => {
        event.preventDefault();
        const draft = active().workingDraft;
        if (!draft || !specificIndexArrayPath)
            return;
        const inspection = inspectSpecificIndexRuleTarget(draft.document, specificIndexArrayPath, schemaSpecificIndex?.value ?? "");
        if (inspection.result !== "accepted")
            return;
        schemaSpecificIndexDialog?.close();
        ports.specificIndexSelected(inspection.canonicalPath.slice(1).replaceAll("/", "."));
    };
    const closeSpecificIndexDialog = () => {
        schemaSpecificIndexDialog?.close();
        specificIndexTrigger?.focus();
        specificIndexArrayPath = undefined;
        specificIndexTrigger = undefined;
    };
    const cancelSpecificIndexDialog = (event) => { event.preventDefault(); closeSpecificIndexDialog(); };
    function schemaParentDocuments() {
        const documents = [];
        const visited = new Set();
        let parentId = active().workingDraft?.parentSchemaId ?? active().parentSchemaId;
        while (parentId && !visited.has(parentId)) {
            visited.add(parentId);
            const parent = schemas.find(({ id }) => id === parentId);
            if (!parent)
                break;
            documents.push(parent.document);
            parentId = parent.parentSchemaId;
        }
        return documents;
    }
    function manualPropertyDefinition() {
        const type = (schemaManualPropertyType?.value || "string");
        const arrayItemType = (schemaManualArrayItemType?.value ?? "");
        if (pendingManualPropertyContext)
            return contextualManualPropertyDefinition(pendingManualPropertyContext.parentPath, schemaManualPropertyChildName?.value ?? "", type, type === "array" && arrayItemType ? arrayItemType : undefined);
        return { path: schemaManualPropertyPath?.value ?? "", type,
            ...(type === "array" && arrayItemType ? { arrayItemType } : {}) };
    }
    function renderManualPropertyForm() {
        const draft = active().workingDraft;
        if (!draft)
            return;
        const definition = manualPropertyDefinition();
        const inspection = inspectManualProperty(draft.document, schemaParentDocuments(), definition);
        const contextual = Boolean(pendingManualPropertyContext);
        if (schemaManualPropertyPathLabel)
            schemaManualPropertyPathLabel.hidden = contextual;
        if (schemaManualPropertyPath)
            schemaManualPropertyPath.hidden = contextual;
        if (schemaManualPropertyChildNameLabel)
            schemaManualPropertyChildNameLabel.hidden = !contextual;
        if (schemaManualPropertyChildName)
            schemaManualPropertyChildName.hidden = !contextual;
        if (schemaManualPropertyParentContext) {
            schemaManualPropertyParentContext.hidden = !contextual;
            schemaManualPropertyParentContext.textContent = pendingManualPropertyContext ? `Parent path: ${pendingManualPropertyContext.parentPath}` : "";
        }
        if (schemaManualArrayTypeGroup)
            schemaManualArrayTypeGroup.hidden = definition.type !== "array";
        if (schemaManualPropertyPreview)
            schemaManualPropertyPreview.textContent = definition.path.trim()
                ? `Normalized path: ${inspection.normalizedPath || "none"}. ${manualPropertyPreview(definition)}. Missing object path: ${inspection.missingObjectPath.join(", ") || "none"}.`
                : "Normalized path: none. Missing object path: none.";
        if (schemaManualPropertyAssistance)
            schemaManualPropertyAssistance.textContent = inspection.result === "blocked" ? inspection.assistance : "Ready to add";
        if (confirmSchemaManualPropertyButton)
            confirmSchemaManualPropertyButton.disabled = inspection.result === "blocked";
        const existingPath = inspection.result === "blocked" ? inspection.existingPath : undefined;
        if (goToExistingSchemaPropertyButton) {
            goToExistingSchemaPropertyButton.hidden = !existingPath;
            if (existingPath && inspection.result === "blocked") {
                goToExistingSchemaPropertyButton.textContent = inspection.assistance;
                goToExistingSchemaPropertyButton.dataset.schemaPropertyPath = existingPath;
            }
            else
                delete goToExistingSchemaPropertyButton.dataset.schemaPropertyPath;
        }
    }
    function closeManualPropertyForm(restoreFocus = true) {
        const trigger = pendingManualPropertyContext?.trigger;
        pendingManualPropertyContext = undefined;
        schemaManualPropertyDialog?.close();
        if (restoreFocus)
            (trigger ?? addSchemaPropertyButton)?.focus();
    }
    function openManualPropertyForm(parentPath, trigger) {
        if (!active().workingDraft)
            return;
        pendingManualPropertyContext = parentPath ? { parentPath, ...(trigger ? { trigger } : {}) } : undefined;
        if (schemaManualPropertyHeading)
            schemaManualPropertyHeading.textContent = parentPath ? "Add child property" : "Add property";
        if (schemaManualPropertyPath)
            schemaManualPropertyPath.value = "";
        if (schemaManualPropertyChildName)
            schemaManualPropertyChildName.value = "";
        if (schemaManualPropertyType)
            schemaManualPropertyType.value = "string";
        if (schemaManualArrayItemType)
            schemaManualArrayItemType.value = "";
        renderManualPropertyForm();
        schemaManualPropertyDialog?.showModal();
        (parentPath ? schemaManualPropertyChildName : schemaManualPropertyPath)?.focus();
    }
    const submitManualProperty = (event) => {
        event.preventDefault();
        const schema = active();
        const draft = schema.workingDraft;
        if (!draft)
            return;
        const definition = manualPropertyDefinition();
        const inspection = inspectManualProperty(draft.document, schemaParentDocuments(), definition);
        if (inspection.result !== "ready") {
            renderManualPropertyForm();
            return;
        }
        replaceActive(updateSchemaWorkingDraft(schema, { document: addManualProperty(draft.document, schemaParentDocuments(), definition) }, `Add manual property ${inspection.normalizedPath}`));
        selectedSchemaPropertyPath = inspection.normalizedPath.slice(1).replaceAll("/", ".");
        closeManualPropertyForm(false);
        persistSchemaLibrary();
        renderSchemas();
    };
    const cancelManualPropertyDialog = () => closeManualPropertyForm();
    const cancelManualPropertyFromDialog = (event) => { event.preventDefault(); closeManualPropertyForm(); };
    const goToExistingSchemaProperty = () => {
        const path = goToExistingSchemaPropertyButton?.dataset.schemaPropertyPath;
        if (!path)
            return;
        selectedSchemaPropertyPath = path.replace(/^\//, "").replaceAll("/", ".");
        closeManualPropertyForm(false);
        renderSchemas();
    };
    const normalizedRulePickerPath = (path) => `/${path.replace(/^\//, "").replaceAll(".", "/")}`;
    const renderSchemaPropertyRulePicker = () => {
        schemaPropertyRenderSequence += 1;
        if (!schemaPropertyRulePicker || !schemaRulePickerPath || !schemaRuleConfiguration)
            return;
        const editLabel = editingAttachedLocalRule ? `Edit ${editingAttachedLocalRule.name ?? editingAttachedLocalRule.id}` : "Create local rule";
        schemaPropertyRulePicker.textContent = `${editLabel} for ${schemaRulePickerPath} · ${schemaRuleConfiguration.propertyType} · render ${schemaPropertyRenderSequence}`;
    };
    function openSchemaPropertyRulePicker(path, trigger) {
        const draft = active().workingDraft;
        if (!draft)
            return;
        const canonicalPath = normalizedRulePickerPath(path);
        const row = schemaPropertyRows(draft.document).find(({ canonicalPath: candidate }) => candidate === canonicalPath);
        const propertyType = ["string", "number", "array", "object", "boolean"]
            .includes(row?.schema.type) ? row?.schema.type : "string";
        schemaRulePickerPath = path;
        schemaRulePickerTrigger = trigger;
        selectedSchemaPropertyPath = path;
        schemaPropertyInteractionReturn = { schemaId: active().id, path, triggerLabel: trigger?.ariaLabel ?? `Add rule for ${path}`,
            editorScroll: schemaEditor?.scrollTop ?? 0, treeScroll: schemaPropertyTree?.scrollTop ?? 0, detailScroll: schemaDetail?.scrollTop ?? 0 };
        editingAttachedLocalRule = draft.attachedRules?.find((rule) => normalizedRulePickerPath(rule.propertyPath ?? "") === canonicalPath);
        schemaRuleConfiguration = createRuleConfiguration("Required", propertyType);
        renderSchemaPropertyRulePicker();
        schemaPropertyRulePicker?.showModal();
        ports.rulePickerChanged(path, true);
    }
    function closeSchemaPropertyRulePicker() {
        const path = schemaRulePickerPath;
        schemaPropertyRulePicker?.close();
        schemaRulePickerTrigger?.focus();
        schemaRulePickerPath = undefined;
        schemaRulePickerTrigger = undefined;
        schemaRuleConfiguration = undefined;
        editingAttachedLocalRule = undefined;
        schemaPropertyInteractionReturn = undefined;
        if (path)
            ports.rulePickerChanged(path, false);
    }
    const cancelSchemaPropertyRulePicker = (event) => { event.preventDefault(); closeSchemaPropertyRulePicker(); };
    const navigateSchemaPropertyRulePicker = (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeSchemaPropertyRulePicker();
        }
    };
    const persistReusableSchemaRules = () => { ports.storage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); };
    const applyPersistenceSnapshot = (nextSchemas, nextRules) => {
        schemas = structuredClone([...nextSchemas]);
        reusableSchemaRules = structuredClone([...nextRules]);
        ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(schemas));
        persistReusableSchemaRules();
        renderSchemas();
        renderSchemaRuleLibrary();
    };
    const beginSchemaPersistence = (kind, schemaId, previousSchemas, previousRules, nextSchemas, nextRules) => {
        const generation = ++persistenceGeneration;
        let resolveCompletion;
        let rejectCompletion;
        const completion = new Promise((resolve, reject) => { resolveCompletion = resolve; rejectCompletion = reject; });
        const transaction = {
            schemaId, generation, kind, paused: false, settled: false, previousSchemas: structuredClone([...previousSchemas]),
            previousRules: structuredClone([...previousRules]), nextSchemas: structuredClone([...nextSchemas]), nextRules: structuredClone([...nextRules]),
            pause() {
                if (transaction.settled || transaction.paused)
                    return;
                transaction.paused = true;
                applyPersistenceSnapshot(transaction.previousSchemas, transaction.previousRules);
            },
            complete() {
                if (transaction.settled || transaction.generation !== generation)
                    return;
                transaction.settled = true;
                if (transaction.paused)
                    applyPersistenceSnapshot(transaction.nextSchemas, transaction.nextRules);
                if (pendingLocalRulePromotionPersistence === transaction)
                    pendingLocalRulePromotionPersistence = undefined;
                if (pendingGuidedValidationPersistence === transaction)
                    pendingGuidedValidationPersistence = undefined;
                resolveCompletion();
            },
            reject(error) {
                if (transaction.settled || transaction.generation !== generation)
                    return;
                transaction.settled = true;
                applyPersistenceSnapshot(transaction.previousSchemas, transaction.previousRules);
                if (pendingLocalRulePromotionPersistence === transaction)
                    pendingLocalRulePromotionPersistence = undefined;
                if (pendingGuidedValidationPersistence === transaction)
                    pendingGuidedValidationPersistence = undefined;
                rejectCompletion(error);
            },
        };
        if (kind === "promotion")
            pendingLocalRulePromotionPersistence = transaction;
        else
            pendingGuidedValidationPersistence = transaction;
        return completion;
    };
    const settleSchemaPersistence = (event) => {
        for (const pending of [pendingLocalRulePromotionPersistence, pendingGuidedValidationPersistence]) {
            if (!pending || pending.schemaId !== event.schemaId || pending.settled)
                continue;
            if (event.type === "failed") {
                if (pending.kind === "guided")
                    pending.pause();
                continue;
            }
            if (event.type === "rejected")
                pending.reject(event.error);
            else
                pending.complete();
        }
    };
    function restoreLocalRulePromotionPresentation() {
        pendingLocalRulePromotion = undefined;
        renderSchemas();
        renderSchemaRuleLibrary();
    }
    function openLocalRulePromotionReview(propertyPath, sourceRuleId) {
        const schema = activeSchemaId ? active() : undefined;
        if (!schema)
            return false;
        const generation = ++persistenceGeneration;
        let review;
        try {
            review = reviewLocalRulePromotion({ schema, reusableRules: reusableSchemaRules,
                propertyPath, sourceRuleId, editorContext: "editable" });
        }
        catch (error) {
            if (schemaResult)
                schemaResult.textContent = error instanceof Error ? error.message : "Promotion is no longer available.";
            return false;
        }
        pendingLocalRulePromotion = { propertyPath, sourceRuleId, generation };
        localRulePromotionDialog.open({ review,
            cancel: () => { if (pendingLocalRulePromotion?.generation === generation)
                restoreLocalRulePromotionPresentation(); },
            confirm: (selected) => {
                if (pendingLocalRulePromotion?.generation !== generation)
                    throw new Error("The promotion review is stale");
                const previousSchemas = structuredClone(schemas), previousRules = structuredClone(reusableSchemaRules);
                const result = selected.action === "create"
                    ? promoteLocalRule({ schema, reusableRules: reusableSchemaRules, propertyPath,
                        sourceRuleId, editorContext: "editable", ...selected, createId: ports.createRuleId })
                    : promoteLocalRule({ schema, reusableRules: reusableSchemaRules, propertyPath,
                        sourceRuleId, editorContext: "editable", action: "use-existing", reusableRuleId: selected.reusableRuleId });
                const nextSchemas = schemas.map((candidate) => candidate.id === result.schema.id ? result.schema : candidate);
                const nextRules = result.reusableRules;
                persistLocalRulePromotion(ports.storage, { schemaKey: SCHEMA_LIBRARY_STORAGE_KEY,
                    schemaValue: serializeSchemaLibrary(nextSchemas), ruleKey: SCHEMA_RULE_STORAGE_KEY, ruleValue: JSON.stringify(nextRules) });
                schemas = structuredClone(nextSchemas);
                reusableSchemaRules = structuredClone([...nextRules]);
                renderSchemas();
                renderSchemaRuleLibrary();
                const completion = beginSchemaPersistence("promotion", result.schema.id, previousSchemas, previousRules, nextSchemas, nextRules);
                return completion.then(() => {
                    if (pendingLocalRulePromotion?.generation === generation) {
                        restoreLocalRulePromotionPresentation();
                        if (schemaResult)
                            schemaResult.textContent =
                                `Promoted ${sourceRuleId} to reusable rule ${result.replacementRuleId}.`;
                    }
                });
            },
        });
        return true;
    }
    function persistPublishedGuidedValidation(result) {
        const rule = result.schema.rules[0];
        if (!rule)
            return Promise.resolve();
        const previousSchemas = structuredClone(schemas), previousRules = structuredClone(reusableSchemaRules);
        const previousSchema = result.destination.previousSchemaId ? schemas.find(({ id }) => id === result.destination.previousSchemaId) : undefined;
        const assignment = { id: result.assignment.id, name: result.assignment.name, sourceId: result.assignment.sourceId,
            eventName: result.assignment.eventName, target: result.assignment.target, priority: result.assignment.priority,
            versionPolicy: result.assignment.versionPolicy, enabled: true };
        const attachedRule = guidedAttachedRule(rule, result.reusableRules[0]?.name ?? `${rule.path} requirement`, `local-rule:${result.schema.id}:${rule.path}`);
        const currentDraft = previousSchema?.workingDraft;
        const assignments = assignmentDraftAfterGuidedSave(currentDraft?.assignments ?? previousSchema?.assignments ?? [], assignment, result.destination.assignmentAction);
        const document = mergeGuidedDocument(currentDraft?.document ?? previousSchema?.document ?? { type: "object" }, guidedPropertyDocument(rule.path, rule.expectedType));
        const attachedRules = [...(currentDraft?.attachedRules ?? previousSchema?.attachedRules ?? []).filter((candidate) => candidate.id !== attachedRule.id || candidate.propertyPath !== attachedRule.propertyPath), attachedRule];
        const schema = previousSchema
            ? updateSchemaWorkingDraft(previousSchema, { document, assignments, attachedRules }, `Add ${rule.path} validation`)
            : { id: result.schema.id, name: result.schema.name, version: 1, document: { type: "object" }, assignments: [], published: false,
                workingDraft: { baseVersion: 0, sourceVersion: 0, document, assignments, attachedRules, pendingChanges: [`Add ${rule.path} validation`] } };
        const nextSchemas = [...schemas.filter(({ id }) => id !== schema.id), schema];
        const published = result.reusableRules[0];
        const nextRules = published ? [...reusableSchemaRules.filter(({ id }) => id !== published.id),
            { id: published.id, name: published.name, kind: "Guided validation", version: published.version, enabled: published.enabled ?? true,
                attachments: [schema.id], ...(attachedRule.operator ? { operator: attachedRule.operator } : {}),
                ...(attachedRule.parameters ? { parameters: attachedRule.parameters } : {}), ...(attachedRule.allowedValues ? { allowedValues: attachedRule.allowedValues } : {}),
                ...(attachedRule.severity ? { severity: attachedRule.severity } : {}), ...(attachedRule.message ? { message: attachedRule.message } : {}),
                ...(attachedRule.conditionGroup ? { conditionGroup: attachedRule.conditionGroup } : {}) }] : reusableSchemaRules;
        applyPersistenceSnapshot(nextSchemas, nextRules);
        return beginSchemaPersistence("guided", schema.id, previousSchemas, previousRules, nextSchemas, nextRules);
    }
    function assignmentConditionCapturedValue(target) {
        return ports.capturedAssignmentValue(target);
    }
    function assignmentConditionEditorState(target, group) {
        return { target, ...(group ? { group: structuredClone(group) } : {}),
            suggestions: assignmentConditionSuggestions(assignmentConditionCapturedValue(target)) };
    }
    function renderSchemaAssignmentConditionEditor() {
        if (!schemaAssignmentDataConditions)
            return;
        ports.renderAssignmentConditions(schemaAssignmentDataConditions, schemaAssignmentConditionState, (next) => {
            schemaAssignmentConditionState = { ...structuredClone(next),
                suggestions: assignmentConditionSuggestions(assignmentConditionCapturedValue(next.target)) };
            renderSchemaAssignmentConditionEditor();
        });
        const validation = validateAssignmentDataConditions(schemaAssignmentConditionState.group);
        if (saveSchemaAssignmentButton) {
            saveSchemaAssignmentButton.disabled = !validation.ready;
            saveSchemaAssignmentButton.title = validation.ready ? "" : validation.assistance;
        }
    }
    const editSchemaAssignment = (schemaId, assignment) => {
        editingSchemaAssignment = assignment.id ? { schemaId, assignmentId: assignment.id } : { schemaId };
        if (schemaAssignmentSchema)
            schemaAssignmentSchema.value = schemaId;
        if (schemaAssignmentSource)
            schemaAssignmentSource.value = assignment.sourceId;
        if (schemaAssignmentEvent)
            schemaAssignmentEvent.value = assignment.eventName;
        if (schemaAssignmentTarget)
            schemaAssignmentTarget.value = assignment.target;
        if (schemaAssignmentDomain)
            schemaAssignmentDomain.value = assignment.domainCondition ?? "";
        if (schemaAssignmentPathname)
            schemaAssignmentPathname.value = assignment.pathnameCondition ?? "";
        if (schemaAssignmentPriority)
            schemaAssignmentPriority.value = String(assignment.priority ?? 0);
        if (schemaAssignmentVersionPolicy)
            schemaAssignmentVersionPolicy.value = assignment.versionPolicy ?? "pinned";
        if (schemaAssignmentEnabled)
            schemaAssignmentEnabled.checked = assignment.enabled !== false;
        schemaAssignmentConditionState = assignmentConditionEditorState(assignment.conditionTarget ?? assignment.target, assignment.dataConditionGroup);
        renderSchemaAssignmentConditionEditor();
        if (schemaAssignmentEditor)
            schemaAssignmentEditor.hidden = false;
    };
    const mutateSchemaAssignment = (schemaId, assignmentId, mutate) => {
        schemas = schemas.map((schema) => schema.id !== schemaId ? schema : { ...schema,
            assignments: schema.assignments.flatMap((assignment) => assignment.id !== assignmentId ? [assignment] : (() => {
                const changed = mutate(assignment);
                return changed ? [changed] : [];
            })()),
        });
        persistSchemaLibrary();
        renderSchemas();
    };
    const renderSchemaAssignments = () => {
        const assignments = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment })));
        if (schemaAssignmentSchema?.ownerDocument)
            schemaAssignmentSchema.replaceChildren(...schemas.map((schema) => {
                const option = schemaAssignmentSchema.ownerDocument.createElement("option");
                option.value = schema.id;
                option.textContent = `${schema.name} version ${schema.version}`;
                return option;
            }));
        if (schemaAssignmentList?.ownerDocument)
            schemaAssignmentList.replaceChildren(...assignments.map(({ schema, assignment }) => {
                const item = schemaAssignmentList.ownerDocument.createElement("li");
                const summary = schemaAssignmentList.ownerDocument.createElement("span");
                summary.textContent = `${assignment.name ?? assignment.id ?? "Assignment"} · ${assignment.sourceId}/${assignment.eventName} · ${assignment.target} · ${assignmentDataConditionSummary(assignment)} · priority ${assignment.priority ?? 0} · ${assignment.enabled === false ? "disabled" : "enabled"} · ${schema.name}`;
                const edit = schemaAssignmentList.ownerDocument.createElement("button");
                const duplicate = schemaAssignmentList.ownerDocument.createElement("button");
                const disable = schemaAssignmentList.ownerDocument.createElement("button");
                const remove = schemaAssignmentList.ownerDocument.createElement("button");
                edit.type = duplicate.type = disable.type = remove.type = "button";
                edit.textContent = "Edit";
                duplicate.textContent = "Duplicate";
                disable.textContent = assignment.enabled === false ? "Enable" : "Disable";
                remove.textContent = "Delete";
                edit.addEventListener("click", () => editSchemaAssignment(schema.id, assignment));
                duplicate.addEventListener("click", () => {
                    schemas = schemas.map((candidate) => candidate.id !== schema.id ? candidate : { ...candidate,
                        assignments: [...candidate.assignments, duplicateSchemaAssignment(assignment, `${assignment.id ?? "assignment"}:copy`, `${assignment.name ?? "Assignment"} copy`)] });
                    persistSchemaLibrary();
                    renderSchemas();
                });
                disable.addEventListener("click", () => mutateSchemaAssignment(schema.id, assignment.id, (item) => ({ ...item, enabled: item.enabled === false })));
                remove.addEventListener("click", () => mutateSchemaAssignment(schema.id, assignment.id, () => undefined));
                item.append(summary, edit, duplicate, disable, remove);
                return item;
            }));
        const collisions = new Map();
        for (const { schema, assignment } of assignments.filter(({ assignment }) => assignment.enabled !== false)) {
            const key = [assignment.sourceId, assignment.eventName, assignment.target, assignment.priority ?? 0,
                assignment.domainCondition ?? "any", assignment.pathnameCondition ?? "any", assignmentDataConditionSummary(assignment)].join("|");
            collisions.set(key, [...(collisions.get(key) ?? []), `${schema.name}/${assignment.name ?? assignment.id ?? "unnamed"}`]);
        }
        const conflicts = [...collisions.values()].filter((matches) => matches.length > 1);
        if (schemaAssignmentConflicts)
            schemaAssignmentConflicts.textContent = conflicts.length
                ? `Assignment conflict: ${conflicts.map((matches) => matches.join(", ")).join("; ")}. Edit priorities before validation.` : "";
    };
    const changeSchemaAssignmentTarget = () => {
        if (!schemaAssignmentConditionState.group) {
            schemaAssignmentConditionState = assignmentConditionEditorState(schemaAssignmentTarget?.value === "raw input" ? "raw input" : "payload");
            renderSchemaAssignmentConditionEditor();
        }
    };
    const openNewSchemaAssignmentEditor = () => {
        editingSchemaAssignment = undefined;
        const target = schemaAssignmentTarget?.value === "raw input" ? "raw input" : "payload";
        schemaAssignmentConditionState = assignmentConditionEditorState(target);
        renderSchemaAssignmentConditionEditor();
        if (schemaAssignmentEditor)
            schemaAssignmentEditor.hidden = false;
        schemaAssignmentSource?.focus();
    };
    const saveSchemaAssignment = () => {
        const schema = schemas.find((candidate) => candidate.id === schemaAssignmentSchema?.value) ?? schemas[0];
        if (!schema)
            return;
        const conditionValidation = validateAssignmentDataConditions(schemaAssignmentConditionState.group);
        if (!conditionValidation.ready) {
            if (schemaResult)
                schemaResult.textContent = conditionValidation.assistance;
            renderSchemaAssignmentConditionEditor();
            return;
        }
        const sourceId = schemaAssignmentSource?.value.trim() || "event-history";
        const eventName = schemaAssignmentEvent?.value.trim() || "page_view";
        const target = schemaAssignmentTarget?.value === "raw input" ? "raw input" : "payload";
        const existing = editingSchemaAssignment?.schemaId === schema.id
            ? schema.assignments.find(({ id }) => id === editingSchemaAssignment?.assignmentId) : undefined;
        const next = { id: editingSchemaAssignment?.assignmentId ?? `assignment:${schema.id}:${eventName}`,
            name: existing?.name ?? `${schema.name} automatic`, sourceId, eventName, target,
            priority: Number(schemaAssignmentPriority?.value || 10),
            ...(schemaAssignmentDomain?.value.trim() ? { domainCondition: schemaAssignmentDomain.value.trim() } : {}),
            ...(schemaAssignmentPathname?.value.trim() ? { pathnameCondition: schemaAssignmentPathname.value.trim() } : {}),
            ...(schemaAssignmentConditionState.group ? { conditionTarget: schemaAssignmentConditionState.target,
                dataConditionGroup: structuredClone(schemaAssignmentConditionState.group) } : {}),
            versionPolicy: schemaAssignmentVersionPolicy?.value === "follow latest" ? "follow latest" : "pinned",
            enabled: schemaAssignmentEnabled?.checked ?? true };
        schemas = schemas.map((candidate) => candidate.id !== schema.id ? candidate : { ...candidate,
            assignments: editingSchemaAssignment?.schemaId === schema.id
                ? candidate.assignments.map((assignment) => assignment.id === editingSchemaAssignment?.assignmentId ? next : assignment)
                : [...candidate.assignments.filter(({ id }) => id !== next.id), next] });
        editingSchemaAssignment = undefined;
        persistSchemaLibrary();
        renderSchemas();
        if (schemaAssignmentEditor)
            schemaAssignmentEditor.hidden = true;
        if (schemaResult)
            schemaResult.textContent = `Saved ${next.name} with ${assignmentDataConditionSummary(next)}.`;
    };
    const renderSchemaRuleLibrary = () => {
        const query = schemaRuleSearch?.value.trim().toLowerCase() ?? "";
        const visible = reusableSchemaRules.filter((rule) => `${rule.name} ${rule.kind}`.toLowerCase().includes(query));
        if (schemaRuleList)
            schemaRuleList.textContent = visible.map((rule) => `${rule.name} v${rule.version} · ${rule.kind}`).join("\n");
    };
    const openNewSchemaRuleEditor = () => {
        if (schemaRuleEditor)
            schemaRuleEditor.hidden = false;
        if (schemaRuleName)
            schemaRuleName.value = "";
        if (schemaRuleParameters)
            schemaRuleParameters.value = "";
        if (schemaRuleMessage)
            schemaRuleMessage.value = "";
        if (schemaRuleExamples)
            schemaRuleExamples.value = "";
        if (schemaRuleTypes)
            schemaRuleTypes.value = "string";
        if (schemaRuleSeverity)
            schemaRuleSeverity.value = "error";
        if (schemaRuleAttachments?.ownerDocument)
            schemaRuleAttachments.replaceChildren(...schemas.map((schema) => {
                const option = schemaRuleAttachments.ownerDocument.createElement("option");
                option.value = schema.id;
                option.textContent = `${schema.name} v${schema.version}`;
                return option;
            }));
        schemaRuleName?.focus();
    };
    const saveReusableSchemaRule = () => {
        const name = schemaRuleName?.value.trim();
        if (!name)
            return;
        const parameters = schemaRuleParameters?.value.trim();
        const applicableType = schemaRuleTypes?.value;
        const operator = schemaRuleOperator?.value;
        const severity = schemaRuleSeverity?.value;
        const message = schemaRuleMessage?.value.trim();
        const examples = schemaRuleExamples?.value.trim();
        const attachments = Array.from(schemaRuleAttachments?.selectedOptions ?? []).map(({ value }) => value);
        const rule = { id: ports.createRuleId(), name,
            kind: `${operator || "Required"}${parameters ? ` (${parameters})` : ""}`, version: 1, enabled: true,
            ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
            ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments };
        reusableSchemaRules = [...reusableSchemaRules, rule];
        if (updateSchemaRuleAttachments?.checked || rule.version === 1)
            schemas = schemas.map((schema) => {
                if (!attachments.includes(schema.id))
                    return schema;
                const attachedRules = [...(schema.attachedRules ?? []).filter(({ id }) => id !== rule.id),
                    { id: rule.id, name: rule.name, version: rule.version, ...(operator ? { operator } : {}),
                        ...(parameters ? { parameters } : {}), ...(severity ? { severity } : {}), ...(message ? { message } : {}), enabled: true }];
                return { ...schema, attachedRules };
            });
        persistReusableSchemaRules();
        persistSchemaLibrary();
        renderSchemas();
        renderSchemaRuleLibrary();
        if (schemaRuleEditor)
            schemaRuleEditor.hidden = true;
    };
    const updateRuleAttachmentPreview = () => {
        if (schemaResult)
            schemaResult.textContent = updateSchemaRuleAttachments?.checked
                ? "Pinned attachments will be updated" : "Existing pinned attachments remain unchanged";
    };
    const requestSchemaRuleRevision = (id, changes) => {
        const previous = reusableSchemaRules.find((rule) => rule.id === id);
        if (!previous)
            return false;
        pendingSchemaRuleRevision = { id, changes: structuredClone(changes) };
        const nextName = changes.name ?? previous.name;
        const nextParameters = changes.parameters ?? previous.parameters ?? "none";
        if (schemaRuleRevisionReviewSummary)
            schemaRuleRevisionReviewSummary.textContent =
                `${previous.name} v${previous.version} will become ${nextName} v${previous.version + 1}; parameters ${previous.parameters ?? "none"} → ${nextParameters}.`;
        schemaRuleRevisionReview?.showModal();
        confirmSchemaRuleRevisionButton?.focus();
        return true;
    };
    const confirmReusableSchemaRuleRevision = () => {
        const pending = pendingSchemaRuleRevision;
        if (!pending)
            return;
        reusableSchemaRules = reusableSchemaRules.map((rule) => rule.id !== pending.id ? rule : {
            ...rule, ...structuredClone(pending.changes), version: rule.version + 1,
            revisionHistory: [...(rule.revisionHistory ?? []), {
                    name: rule.name, kind: rule.kind, version: rule.version, ...(rule.enabled === false ? { enabled: false } : {}),
                    ...(rule.applicableType ? { applicableType: rule.applicableType } : {}), ...(rule.operator ? { operator: rule.operator } : {}),
                    ...(rule.parameters ? { parameters: rule.parameters } : {}), ...(rule.severity ? { severity: rule.severity } : {}),
                    ...(rule.message ? { message: rule.message } : {}), ...(rule.examples ? { examples: rule.examples } : {}),
                }],
        });
        pendingSchemaRuleRevision = undefined;
        persistReusableSchemaRules();
        renderSchemaRuleLibrary();
        schemaRuleRevisionReview?.close();
    };
    const cancelReusableSchemaRuleRevision = () => { pendingSchemaRuleRevision = undefined; schemaRuleRevisionReview?.close(); };
    const requestSchemaRuleUpgrade = (id, schemaIds) => {
        const rule = reusableSchemaRules.find((candidate) => candidate.id === id);
        if (!rule)
            return false;
        const affected = schemas.filter((schema) => schemaIds.includes(schema.id) && schema.attachedRules?.some((item) => item.id === id));
        pendingSchemaRuleUpgrade = { id, schemaIds: [...schemaIds] };
        if (schemaRuleUpgradeReviewSummary)
            schemaRuleUpgradeReviewSummary.textContent = affected.length
                ? `Update pinned attachments for ${rule.name} v${rule.version}: ${affected.map(({ name }) => name).join(", ")}.`
                : `No pinned attachments for ${rule.name} are selected.`;
        if (confirmSchemaRuleUpgradeButton)
            confirmSchemaRuleUpgradeButton.disabled = affected.length === 0;
        schemaRuleUpgradeReview?.showModal();
        (affected.length ? confirmSchemaRuleUpgradeButton : cancelSchemaRuleUpgradeButton)?.focus();
        return true;
    };
    const confirmReusableSchemaRuleUpgrade = () => {
        const pending = pendingSchemaRuleUpgrade;
        if (!pending)
            return;
        const rule = reusableSchemaRules.find((candidate) => candidate.id === pending.id);
        if (!rule)
            return;
        schemas = schemas.map((schema) => {
            if (!pending.schemaIds.includes(schema.id) || !schema.attachedRules)
                return schema;
            return { ...schema, attachedRules: schema.attachedRules.map((attached) => attached.id !== rule.id ? attached : {
                    ...attached, name: rule.name, version: rule.version, ...(rule.operator ? { operator: rule.operator } : {}),
                    ...(rule.parameters ? { parameters: rule.parameters } : {}), ...(rule.severity ? { severity: rule.severity } : {}),
                    ...(rule.message ? { message: rule.message } : {}), enabled: rule.enabled,
                }) };
        });
        pendingSchemaRuleUpgrade = undefined;
        persistSchemaLibrary();
        schemaRuleUpgradeReview?.close();
    };
    const cancelReusableSchemaRuleUpgrade = () => { pendingSchemaRuleUpgrade = undefined; schemaRuleUpgradeReview?.close(); };
    const requestSchemaRuleSync = (id) => {
        const rule = reusableSchemaRules.find((candidate) => candidate.id === id);
        if (!rule)
            return false;
        const review = reviewReusableRuleSync(schemas, rule);
        pendingSchemaRuleSync = { rule: structuredClone(rule), review };
        const changes = review.schemas.map((schema) => `${schema.schemaName} revision ${schema.currentVersion} to ${schema.nextVersion}`).join("; ");
        if (schemaRuleSyncReviewSummary)
            schemaRuleSyncReviewSummary.textContent = review.blocked.length
                ? `${review.schemaCount} schemas and ${review.attachmentCount} attachments. ${review.blocked.map(({ assistance }) => assistance).join(". ")}.`
                : `${review.schemaCount} schemas and ${review.attachmentCount} attachments: ${changes || "no pinned revisions"}. No changes occur before confirmation.`;
        if (confirmSchemaRuleSyncButton)
            confirmSchemaRuleSyncButton.disabled = !review.ready;
        schemaRuleSyncReview?.showModal();
        (review.ready ? confirmSchemaRuleSyncButton : cancelSchemaRuleSyncButton)?.focus();
        return true;
    };
    const confirmReusableSchemaRuleSync = () => {
        const pending = pendingSchemaRuleSync;
        if (!pending)
            return;
        const settledRule = reusableSchemaRules.find((rule) => rule.id === pending.rule.id);
        if (!settledRule)
            throw new Error("The reusable rule was removed after review");
        const settledReview = reviewReusableRuleSync(schemas, settledRule);
        if (JSON.stringify(settledReview) !== JSON.stringify(pending.review))
            throw new Error("The attached schemas changed after review");
        schemas = publishReusableRuleSync(schemas, settledRule, settledReview);
        pendingSchemaRuleSync = undefined;
        persistSchemaLibrary();
        renderSchemas();
        schemaRuleSyncReview?.close();
    };
    const cancelReusableSchemaRuleSync = () => { pendingSchemaRuleSync = undefined; schemaRuleSyncReview?.close(); };
    const requestSchemaRuleDeletion = (id) => {
        const rule = reusableSchemaRules.find((candidate) => candidate.id === id);
        if (!rule)
            return false;
        const attached = schemas.filter((schema) => rule.attachments?.includes(schema.id)
            || schema.attachedRules?.some((attachedRule) => attachedRule.id === id) || JSON.stringify(schema.document).includes(id));
        if (attached.length) {
            if (schemaResult)
                schemaResult.textContent = `Cannot delete ${rule.name}: attached to ${attached.map(({ name }) => name).join(", ")}.`;
            return false;
        }
        pendingReusableSchemaRuleDeletionId = id;
        if (schemaRuleDeleteReviewSummary)
            schemaRuleDeleteReviewSummary.textContent = `${rule.name} v${rule.version} will be removed.`;
        schemaRuleDeleteReview?.showModal();
        confirmSchemaRuleDeleteButton?.focus();
        return true;
    };
    const confirmReusableSchemaRuleDeletion = () => {
        if (!pendingReusableSchemaRuleDeletionId)
            return;
        reusableSchemaRules = reusableSchemaRules.filter(({ id }) => id !== pendingReusableSchemaRuleDeletionId);
        pendingReusableSchemaRuleDeletionId = undefined;
        persistReusableSchemaRules();
        renderSchemaRuleLibrary();
        schemaRuleDeleteReview?.close();
    };
    const cancelReusableSchemaRuleDeletion = () => { pendingReusableSchemaRuleDeletionId = undefined; schemaRuleDeleteReview?.close(); };
    const exportReusableSchemaRules = () => {
        const blob = new Blob([`${JSON.stringify(reusableSchemaRules, null, 2)}\n`], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = schemaOwnerDocument?.createElement("a");
        if (link) {
            link.href = url;
            link.download = "schema-rules.json";
            link.click();
        }
        URL.revokeObjectURL(url);
    };
    const openSchemaLibraryImportFile = () => schemaLibraryImportFile?.click();
    const reviewSchemaLibraryImport = (serialized) => {
        const archive = JSON.parse(serialized);
        if (archive.version !== 1 || !Array.isArray(archive.schemas) || !Array.isArray(archive.rules)) {
            throw new Error("Choose a version 1 Schema Library export.");
        }
        const importedSchemas = archive.schemas.map((schema) => importSchema(JSON.stringify(schema)));
        const candidates = [...schemas.filter((schema) => !importedSchemas.some(({ id }) => id === schema.id)), ...importedSchemas];
        for (const schema of importedSchemas) {
            const issue = schemaInheritanceError(schema, candidates) ?? schemaInheritanceConflict(schema, candidates);
            if (issue)
                throw new Error(issue);
        }
        const rules = archive.rules.filter((rule) => Boolean(rule && typeof rule === "object"
            && "id" in rule && "name" in rule && "kind" in rule && "version" in rule && "enabled" in rule));
        pendingSchemaImport = { schemas: importedSchemas, rules: structuredClone(rules) };
        if (schemaImportReviewSummary)
            schemaImportReviewSummary.textContent =
                `${importedSchemas.length} schemas and ${rules.length} reusable rules are ready to import.`;
        schemaImportReview?.showModal();
    };
    const readSchemaLibraryImportFile = async () => {
        const file = schemaLibraryImportFile?.files?.[0];
        if (!file)
            return;
        try {
            reviewSchemaLibraryImport(await file.text());
        }
        catch (error) {
            if (schemaResult)
                schemaResult.textContent = error instanceof Error ? error.message : "Schema Library import failed.";
        }
        if (schemaLibraryImportFile)
            schemaLibraryImportFile.value = "";
    };
    const replaceSchemaLibrary = () => {
        if (!pendingSchemaImport)
            return;
        schemas = structuredClone(pendingSchemaImport.schemas);
        reusableSchemaRules = structuredClone(pendingSchemaImport.rules);
        pendingSchemaImport = undefined;
        persistSchemaLibrary();
        persistReusableSchemaRules();
        renderSchemas();
        renderSchemaRuleLibrary();
        schemaImportReview?.close();
    };
    const appendSchemaLibrary = () => {
        if (!pendingSchemaImport)
            return;
        schemas = [...schemas.filter((schema) => !pendingSchemaImport.schemas.some(({ id }) => id === schema.id)),
            ...structuredClone(pendingSchemaImport.schemas)];
        reusableSchemaRules = [...reusableSchemaRules.filter((rule) => !pendingSchemaImport.rules.some(({ id }) => id === rule.id)),
            ...structuredClone(pendingSchemaImport.rules)];
        pendingSchemaImport = undefined;
        persistSchemaLibrary();
        persistReusableSchemaRules();
        renderSchemas();
        renderSchemaRuleLibrary();
        schemaImportReview?.close();
    };
    const cancelSchemaLibraryImport = () => { pendingSchemaImport = undefined; schemaImportReview?.close(); };
    const requestSchemaDeletion = (id) => {
        const schema = schemas.find((candidate) => candidate.id === id);
        if (!schema)
            return false;
        const children = schemas.filter(({ parentSchemaId }) => parentSchemaId === id);
        if (children.length) {
            if (schemaResult)
                schemaResult.textContent =
                    `Cannot delete ${schema.name}: it is the parent of ${children.map(({ name }) => name).join(", ")}.`;
            return false;
        }
        pendingSchemaDeletion = structuredClone(schema);
        if (schemaDeleteReviewSummary)
            schemaDeleteReviewSummary.textContent = `${schema.name} v${schema.version} and its assignments will be removed.`;
        schemaDeleteReview?.showModal();
        return true;
    };
    const confirmSchemaDeletion = () => {
        const schema = pendingSchemaDeletion;
        if (!schema)
            return;
        schemas = schemas.filter(({ id }) => id !== schema.id);
        pendingSchemaDeletion = undefined;
        if (activeSchemaId === schema.id) {
            activeSchemaId = undefined;
            schemaDraft = undefined;
        }
        persistSchemaLibrary();
        renderSchemas();
        schemaDeleteReview?.close();
        if (schemaResult)
            schemaResult.textContent = `Deleted ${schema.name}.`;
    };
    const cancelSchemaDeletion = () => { pendingSchemaDeletion = undefined; schemaDeleteReview?.close(); };
    function finishSchemaExport(status) {
        if (schemaResult)
            schemaResult.textContent = status;
        schemaExportReview?.close();
        schemaExportChoices?.close();
        pendingStandardSchemaExport = undefined;
        schemaExportTrigger?.focus();
        schemaExportTrigger = undefined;
    }
    function openStandardSchemaExportReview(scope, schema) {
        const review = schema ? inspectJsonSchemaExport(schema, schemas) : exportJsonSchemaBundle(schemas).compatibility;
        pendingStandardSchemaExport = { scope, ...(schema ? { schema } : {}), review };
        if (!schemaExportReview?.ownerDocument)
            return;
        const summary = schemaExportReview.ownerDocument.createElement("p");
        summary.textContent =
            `${scope === "library" ? `${schemas.length} schema resources` : `${schema?.name} revision ${schema?.version}`} · ${review.conversions.length} conversions · ${review.omitted.length} omitted rules`;
        const confirm = schemaExportReview.ownerDocument.createElement("button");
        confirm.type = "button";
        confirm.textContent = "Confirm standard export";
        const cancel = schemaExportReview.ownerDocument.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        confirm.addEventListener("click", () => {
            const pending = pendingStandardSchemaExport;
            if (!pending)
                return;
            if (pending.scope === "library") {
                const exported = exportJsonSchemaBundle(schemas);
                ports.downloadSchema(exported.document, exported.filename);
                finishSchemaExport(`Exported JSON Schema bundle with ${exported.resourceIds.length} schemas.`);
            }
            else if (pending.schema) {
                const exported = exportJsonSchemaResource(pending.schema, schemas);
                ports.downloadSchema(exported.document, exported.filename);
                finishSchemaExport(`Exported ${pending.schema.name} revision ${pending.schema.version}.`);
            }
        });
        cancel.addEventListener("click", () => { pendingStandardSchemaExport = undefined; schemaExportReview.close(); schemaExportTrigger?.focus(); });
        schemaExportReview.replaceChildren(summary, confirm, cancel);
        schemaExportReview.showModal();
        confirm.focus();
    }
    function openSchemaExportChoices(trigger, schema) {
        schemaExportTrigger = trigger;
        if (!schemaExportChoices?.ownerDocument)
            return;
        const extension = schemaExportChoices.ownerDocument.createElement("button");
        extension.type = "button";
        extension.textContent = "Extension backup";
        const standard = schemaExportChoices.ownerDocument.createElement("button");
        standard.type = "button";
        standard.textContent = "JSON Schema Draft 2020-12";
        const cancel = schemaExportChoices.ownerDocument.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        extension.addEventListener("click", () => {
            if (schema) {
                const archive = createExtensionSchemaPackage(schema, schemas, reusableSchemaRules);
                ports.downloadSchema(archive, `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-extension-package-v1.json`);
                finishSchemaExport(`Exported Extension schema package for ${schema.name}.`);
            }
            else {
                const archive = createSchemaLibraryExport(schemas, reusableSchemaRules);
                ports.downloadSchema(archive, "schema-library-v1.json");
                finishSchemaExport(`Exported Extension backup with ${archive.schemas.length} schemas and ${archive.rules.length} rules.`);
            }
        });
        standard.addEventListener("click", () => { schemaExportChoices.close(); openStandardSchemaExportReview(schema ? "schema" : "library", schema); });
        cancel.addEventListener("click", () => { schemaExportChoices.close(); schemaExportTrigger?.focus(); schemaExportTrigger = undefined; });
        schemaExportChoices.replaceChildren(extension, standard, cancel);
        schemaExportChoices.showModal();
        extension.focus();
    }
    const requestSchemaLibraryExport = () => { if (exportSchemaButton)
        openSchemaExportChoices(exportSchemaButton); };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            lifecycleGeneration += 1;
            schemaSearch?.addEventListener("input", updateSchemaTreeView);
            schemaCategoryFilter?.addEventListener("change", updateSchemaTreeView);
            schemaTreeScrollOwner?.addEventListener("scroll", persistSchemaTreeScroll, { passive: true });
            schemaList?.addEventListener("keydown", navigateSchemaTree);
            schemaEditorName?.addEventListener("input", persistSchemaEditorDraft);
            saveSchemaDescriptionButton?.addEventListener("click", saveSchemaDescription);
            schemaEditorTarget?.addEventListener("change", updateSchemaTarget);
            schemaEditorParent?.addEventListener("change", changeSchemaParent);
            schemaOnlyDeclaredProperties?.addEventListener("change", changeOnlyDeclaredProperties);
            saveSchemaButton?.addEventListener("click", openSchemaRevisionReview);
            confirmSchemaRevisionButton?.addEventListener("click", confirmSchemaRevision);
            cancelSchemaRevisionButton?.addEventListener("click", cancelSchemaRevision);
            discardSchemaDraftButton?.addEventListener("click", discardSchemaDraft);
            keepEditingSchemaButton?.addEventListener("click", keepEditingSchema);
            closeSchemaEditorButton?.addEventListener("click", closeSchemaEditor);
            saveAndCloseSchemaButton?.addEventListener("click", saveAndCloseSchema);
            saveSchemaCloseReviewButton?.addEventListener("click", saveAndCloseSchema);
            discardWorkingSchemaDraftButton?.addEventListener("click", discardWorkingSchemaDraft);
            schemaRevisionSelector?.addEventListener("change", renderSchemaRevisionComparison);
            duplicateSchemaRevisionButton?.addEventListener("click", duplicateSelectedSchemaRevision);
            restoreSchemaRevisionButton?.addEventListener("click", restoreSelectedSchemaRevision);
            schemaPropertyFilter?.addEventListener("input", renderSchemaPropertyView);
            schemaPropertySort?.addEventListener("change", renderSchemaPropertyView);
            clearSchemaPropertyFilter?.addEventListener("click", clearSchemaPropertyViewFilter);
            for (const tab of schemaSubviews)
                tab.addEventListener("click", activateSchemaSubview);
            confirmSchemaPropertyRemovalButton?.addEventListener("click", confirmSchemaPropertyRemoval);
            cancelSchemaPropertyRemovalButton?.addEventListener("click", cancelSchemaPropertyRemoval);
            schemaPropertyRemovalDialog?.addEventListener("cancel", cancelSchemaPropertyRemovalFromDialog);
            undoSchemaPropertyRemovalButton?.addEventListener("click", undoLastSchemaPropertyRemoval);
            confirmSchemaDocumentationRemoval?.addEventListener("click", confirmSchemaDocumentationRemovalAction);
            cancelSchemaDocumentationRemoval?.addEventListener("click", cancelSchemaDocumentationRemovalAction);
            schemaDocumentationRemovalDialog?.addEventListener("cancel", cancelSchemaDocumentationRemovalFromDialog);
            undoSchemaPropertyCopyButton?.addEventListener("click", undoLastSchemaPropertyCopy);
            schemaSpecificIndex?.addEventListener("input", renderSpecificIndexInspection);
            schemaSpecificIndexForm?.addEventListener("submit", submitSpecificIndex);
            cancelSchemaSpecificIndex?.addEventListener("click", closeSpecificIndexDialog);
            schemaSpecificIndexDialog?.addEventListener("cancel", cancelSpecificIndexDialog);
            schemaManualPropertyPath?.addEventListener("input", renderManualPropertyForm);
            schemaManualPropertyChildName?.addEventListener("input", renderManualPropertyForm);
            schemaManualPropertyType?.addEventListener("change", renderManualPropertyForm);
            schemaManualArrayItemType?.addEventListener("change", renderManualPropertyForm);
            schemaManualPropertyForm?.addEventListener("submit", submitManualProperty);
            cancelSchemaManualPropertyButton?.addEventListener("click", cancelManualPropertyDialog);
            schemaManualPropertyDialog?.addEventListener("cancel", cancelManualPropertyFromDialog);
            goToExistingSchemaPropertyButton?.addEventListener("click", goToExistingSchemaProperty);
            schemaPropertyRulePicker?.addEventListener("cancel", cancelSchemaPropertyRulePicker);
            schemaPropertyRulePicker?.addEventListener("keydown", navigateSchemaPropertyRulePicker);
            createSchemaRuleButton?.addEventListener("click", openNewSchemaRuleEditor);
            saveSchemaRuleButton?.addEventListener("click", saveReusableSchemaRule);
            schemaRuleSearch?.addEventListener("input", renderSchemaRuleLibrary);
            updateSchemaRuleAttachments?.addEventListener("change", updateRuleAttachmentPreview);
            confirmSchemaRuleRevisionButton?.addEventListener("click", confirmReusableSchemaRuleRevision);
            cancelSchemaRuleRevisionButton?.addEventListener("click", cancelReusableSchemaRuleRevision);
            confirmSchemaRuleUpgradeButton?.addEventListener("click", confirmReusableSchemaRuleUpgrade);
            cancelSchemaRuleUpgradeButton?.addEventListener("click", cancelReusableSchemaRuleUpgrade);
            confirmSchemaRuleSyncButton?.addEventListener("click", confirmReusableSchemaRuleSync);
            cancelSchemaRuleSyncButton?.addEventListener("click", cancelReusableSchemaRuleSync);
            confirmSchemaRuleDeleteButton?.addEventListener("click", confirmReusableSchemaRuleDeletion);
            cancelSchemaRuleDeleteButton?.addEventListener("click", cancelReusableSchemaRuleDeletion);
            exportSchemaRulesButton?.addEventListener("click", exportReusableSchemaRules);
            schemaAssignmentTarget?.addEventListener("change", changeSchemaAssignmentTarget);
            createSchemaAssignmentButton?.addEventListener("click", openNewSchemaAssignmentEditor);
            saveSchemaAssignmentButton?.addEventListener("click", saveSchemaAssignment);
            importSchemaButton?.addEventListener("click", openSchemaLibraryImportFile);
            schemaLibraryImportFile?.addEventListener("change", readSchemaLibraryImportFile);
            replaceSchemaLibraryButton?.addEventListener("click", replaceSchemaLibrary);
            appendSchemaLibraryButton?.addEventListener("click", appendSchemaLibrary);
            cancelSchemaImportButton?.addEventListener("click", cancelSchemaLibraryImport);
            confirmSchemaDeleteButton?.addEventListener("click", confirmSchemaDeletion);
            cancelSchemaDeleteButton?.addEventListener("click", cancelSchemaDeletion);
            exportSchemaButton?.addEventListener("click", requestSchemaLibraryExport);
            unsubscribe = ports.subscribe(renderSchemas);
            unsubscribeSchemaPersistence = ports.subscribeSchemaPersistence(settleSchemaPersistence);
            renderSchemas();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            lifecycleGeneration += 1;
            schemaSearch?.removeEventListener("input", updateSchemaTreeView);
            schemaCategoryFilter?.removeEventListener("change", updateSchemaTreeView);
            schemaTreeScrollOwner?.removeEventListener("scroll", persistSchemaTreeScroll);
            schemaList?.removeEventListener("keydown", navigateSchemaTree);
            schemaEditorName?.removeEventListener("input", persistSchemaEditorDraft);
            saveSchemaDescriptionButton?.removeEventListener("click", saveSchemaDescription);
            schemaEditorTarget?.removeEventListener("change", updateSchemaTarget);
            schemaEditorParent?.removeEventListener("change", changeSchemaParent);
            schemaOnlyDeclaredProperties?.removeEventListener("change", changeOnlyDeclaredProperties);
            saveSchemaButton?.removeEventListener("click", openSchemaRevisionReview);
            confirmSchemaRevisionButton?.removeEventListener("click", confirmSchemaRevision);
            cancelSchemaRevisionButton?.removeEventListener("click", cancelSchemaRevision);
            discardSchemaDraftButton?.removeEventListener("click", discardSchemaDraft);
            keepEditingSchemaButton?.removeEventListener("click", keepEditingSchema);
            closeSchemaEditorButton?.removeEventListener("click", closeSchemaEditor);
            saveAndCloseSchemaButton?.removeEventListener("click", saveAndCloseSchema);
            saveSchemaCloseReviewButton?.removeEventListener("click", saveAndCloseSchema);
            discardWorkingSchemaDraftButton?.removeEventListener("click", discardWorkingSchemaDraft);
            schemaRevisionSelector?.removeEventListener("change", renderSchemaRevisionComparison);
            duplicateSchemaRevisionButton?.removeEventListener("click", duplicateSelectedSchemaRevision);
            restoreSchemaRevisionButton?.removeEventListener("click", restoreSelectedSchemaRevision);
            schemaPropertyFilter?.removeEventListener("input", renderSchemaPropertyView);
            schemaPropertySort?.removeEventListener("change", renderSchemaPropertyView);
            clearSchemaPropertyFilter?.removeEventListener("click", clearSchemaPropertyViewFilter);
            for (const tab of schemaSubviews)
                tab.removeEventListener("click", activateSchemaSubview);
            confirmSchemaPropertyRemovalButton?.removeEventListener("click", confirmSchemaPropertyRemoval);
            cancelSchemaPropertyRemovalButton?.removeEventListener("click", cancelSchemaPropertyRemoval);
            schemaPropertyRemovalDialog?.removeEventListener("cancel", cancelSchemaPropertyRemovalFromDialog);
            undoSchemaPropertyRemovalButton?.removeEventListener("click", undoLastSchemaPropertyRemoval);
            confirmSchemaDocumentationRemoval?.removeEventListener("click", confirmSchemaDocumentationRemovalAction);
            cancelSchemaDocumentationRemoval?.removeEventListener("click", cancelSchemaDocumentationRemovalAction);
            schemaDocumentationRemovalDialog?.removeEventListener("cancel", cancelSchemaDocumentationRemovalFromDialog);
            undoSchemaPropertyCopyButton?.removeEventListener("click", undoLastSchemaPropertyCopy);
            schemaSpecificIndex?.removeEventListener("input", renderSpecificIndexInspection);
            schemaSpecificIndexForm?.removeEventListener("submit", submitSpecificIndex);
            cancelSchemaSpecificIndex?.removeEventListener("click", closeSpecificIndexDialog);
            schemaSpecificIndexDialog?.removeEventListener("cancel", cancelSpecificIndexDialog);
            schemaManualPropertyPath?.removeEventListener("input", renderManualPropertyForm);
            schemaManualPropertyChildName?.removeEventListener("input", renderManualPropertyForm);
            schemaManualPropertyType?.removeEventListener("change", renderManualPropertyForm);
            schemaManualArrayItemType?.removeEventListener("change", renderManualPropertyForm);
            schemaManualPropertyForm?.removeEventListener("submit", submitManualProperty);
            cancelSchemaManualPropertyButton?.removeEventListener("click", cancelManualPropertyDialog);
            schemaManualPropertyDialog?.removeEventListener("cancel", cancelManualPropertyFromDialog);
            goToExistingSchemaPropertyButton?.removeEventListener("click", goToExistingSchemaProperty);
            schemaPropertyRulePicker?.removeEventListener("cancel", cancelSchemaPropertyRulePicker);
            schemaPropertyRulePicker?.removeEventListener("keydown", navigateSchemaPropertyRulePicker);
            createSchemaRuleButton?.removeEventListener("click", openNewSchemaRuleEditor);
            saveSchemaRuleButton?.removeEventListener("click", saveReusableSchemaRule);
            schemaRuleSearch?.removeEventListener("input", renderSchemaRuleLibrary);
            updateSchemaRuleAttachments?.removeEventListener("change", updateRuleAttachmentPreview);
            confirmSchemaRuleRevisionButton?.removeEventListener("click", confirmReusableSchemaRuleRevision);
            cancelSchemaRuleRevisionButton?.removeEventListener("click", cancelReusableSchemaRuleRevision);
            confirmSchemaRuleUpgradeButton?.removeEventListener("click", confirmReusableSchemaRuleUpgrade);
            cancelSchemaRuleUpgradeButton?.removeEventListener("click", cancelReusableSchemaRuleUpgrade);
            confirmSchemaRuleSyncButton?.removeEventListener("click", confirmReusableSchemaRuleSync);
            cancelSchemaRuleSyncButton?.removeEventListener("click", cancelReusableSchemaRuleSync);
            confirmSchemaRuleDeleteButton?.removeEventListener("click", confirmReusableSchemaRuleDeletion);
            cancelSchemaRuleDeleteButton?.removeEventListener("click", cancelReusableSchemaRuleDeletion);
            exportSchemaRulesButton?.removeEventListener("click", exportReusableSchemaRules);
            schemaAssignmentTarget?.removeEventListener("change", changeSchemaAssignmentTarget);
            createSchemaAssignmentButton?.removeEventListener("click", openNewSchemaAssignmentEditor);
            saveSchemaAssignmentButton?.removeEventListener("click", saveSchemaAssignment);
            importSchemaButton?.removeEventListener("click", openSchemaLibraryImportFile);
            schemaLibraryImportFile?.removeEventListener("change", readSchemaLibraryImportFile);
            replaceSchemaLibraryButton?.removeEventListener("click", replaceSchemaLibrary);
            appendSchemaLibraryButton?.removeEventListener("click", appendSchemaLibrary);
            cancelSchemaImportButton?.removeEventListener("click", cancelSchemaLibraryImport);
            confirmSchemaDeleteButton?.removeEventListener("click", confirmSchemaDeletion);
            cancelSchemaDeleteButton?.removeEventListener("click", cancelSchemaDeletion);
            exportSchemaButton?.removeEventListener("click", requestSchemaLibraryExport);
            pendingSchemaPropertyRemoval = undefined;
            pendingSchemaDocumentationRemoval = undefined;
            lastSchemaPropertyRemoval = undefined;
            pendingSchemaPropertyCopy = undefined;
            lastSchemaPropertyCopy = undefined;
            specificIndexArrayPath = undefined;
            specificIndexTrigger = undefined;
            pendingManualPropertyContext = undefined;
            schemaRulePickerPath = undefined;
            schemaRulePickerTrigger = undefined;
            schemaPropertyInteractionReturn = undefined;
            schemaRuleConfiguration = undefined;
            editingAttachedLocalRule = undefined;
            pendingSchemaRuleRevision = undefined;
            pendingSchemaRuleUpgrade = undefined;
            pendingSchemaRuleSync = undefined;
            pendingReusableSchemaRuleDeletionId = undefined;
            editingSchemaAssignment = undefined;
            schemaAssignmentConditionState = { target: "payload", suggestions: [] };
            pendingSchemaImport = undefined;
            pendingSchemaDeletion = undefined;
            pendingStandardSchemaExport = undefined;
            schemaExportTrigger = undefined;
            schemaExportChoices?.close();
            schemaExportReview?.close();
            schemaExportChoices?.replaceChildren();
            schemaExportReview?.replaceChildren();
            if (buildSpecificationButton)
                buildSpecificationButton.onclick = null;
            if (buildHistoricalSpecificationButton)
                buildHistoricalSpecificationButton.onclick = null;
            if (schemaSpecificationBuilder) {
                schemaSpecificationBuilder.hidden = true;
                schemaSpecificationBuilder.replaceChildren();
            }
            const disposed = new Error("Schemas controller disposed before durable persistence settled");
            pendingLocalRulePromotionPersistence?.reject(disposed);
            pendingGuidedValidationPersistence?.reject(disposed);
            pendingLocalRulePromotion = undefined;
            localRulePromotionDialog.close();
            unsubscribe?.();
            unsubscribe = undefined;
            unsubscribeSchemaPersistence?.();
            unsubscribeSchemaPersistence = undefined;
            activeSchemaProjectHydration = undefined;
            clearSchemaRowListeners();
            schemaList?.replaceChildren();
            schemaAssignmentList?.replaceChildren();
            schemaAssignmentDataConditions?.replaceChildren();
        },
        open(id) {
            if (!schemas.some((schema) => schema.id === id))
                throw new Error(`Unknown schema ${id}`);
            activeSchemaId = id;
            schemaDraft = structuredClone(active());
            renderSchemas();
        },
        beginDraft() { replaceActive(updateSchemaWorkingDraft(active(), {})); persistSchemaLibrary(); renderSchemas(); },
        updateDraft(changes, change) {
            replaceActive(updateSchemaWorkingDraft(active(), changes, change));
            persistSchemaLibrary();
            renderSchemas();
        },
        publish() { return structuredClone(publishActiveSchema()); },
        discard() { replaceActive(discardSchemaWorkingDraft(active())); persistSchemaLibrary(); renderSchemas(); },
        add(schema) { schemas = [...schemas, structuredClone(schema)]; activeSchemaId = schema.id; schemaDraft = structuredClone(schema); persistSchemaLibrary(); renderSchemas(); },
        replace(next) { schemas = structuredClone([...next]); if (!schemas.some(({ id }) => id === activeSchemaId)) {
            activeSchemaId = undefined;
            schemaDraft = undefined;
        } persistSchemaLibrary(); renderSchemas(); },
        validate: (event) => validateEvent(event, schemas),
        runGuidedValidation: () => ports.runGuidedValidation(activeSchemaId),
        requestPropertyRemoval: requestSchemaPropertyRemoval,
        requestDocumentationRemoval: requestSchemaDocumentationRemoval,
        requestPropertyCopy: openSchemaPropertyCopyReview,
        confirmPropertyCopy: confirmSchemaPropertyCopy,
        openSpecificIndex: openSpecificIndexDialog,
        openManualProperty: openManualPropertyForm,
        openRulePicker: openSchemaPropertyRulePicker,
        requestRuleRevision: requestSchemaRuleRevision,
        requestRuleUpgrade: requestSchemaRuleUpgrade,
        requestRuleSync: requestSchemaRuleSync,
        confirmRuleSync: confirmReusableSchemaRuleSync,
        requestRuleDeletion: requestSchemaRuleDeletion,
        editAssignment: editSchemaAssignment,
        reviewLibraryImport: reviewSchemaLibraryImport,
        requestDeletion: requestSchemaDeletion,
        openExportChoices: (schemaId) => {
            if (!exportSchemaButton)
                return false;
            const schema = schemaId ? schemas.find(({ id }) => id === schemaId) : undefined;
            if (schemaId && !schema)
                return false;
            openSchemaExportChoices(exportSchemaButton, schema);
            return true;
        },
        requestLocalRulePromotion: openLocalRulePromotionReview,
        persistGuidedValidation: persistPublishedGuidedValidation,
        hydrateActiveProjectForSchemas,
        rulePickerState: () => ({ path: schemaRulePickerPath, renderSequence: schemaPropertyRenderSequence,
            ...(schemaRuleConfiguration ? { configuration: structuredClone(schemaRuleConfiguration) } : {}) }),
        rules: () => structuredClone(reusableSchemaRules),
        schemas: () => structuredClone(schemas),
        state: () => ({ ...(activeSchemaId ? { activeSchemaId } : {}), draftDirty: Boolean(activeSchemaId && active().workingDraft),
            schemaCount: schemas.length, mounted }),
    };
    function reviewSavedSchemaAdoption(schema, trigger) {
        ports.adoptSavedSchema(structuredClone(schema), trigger);
    }
    function openSchemaSpecification(schema, surface, trigger) {
        if (!schemaSpecificationBuilder)
            return;
        schemaSpecificationBuilder.hidden = false;
        if (schemaEditor)
            schemaEditor.hidden = true;
        if (schemaDetailEmpty)
            schemaDetailEmpty.hidden = true;
        ports.renderSchemaSpecification(schemaSpecificationBuilder, structuredClone(schema), structuredClone(schemas), surface, () => {
            schemaSpecificationBuilder.hidden = true;
            renderSchemaDraft();
            trigger.focus({ preventScroll: true });
        });
    }
    function openContributorInUnifiedEditor(key) { ports.openContributor(key); }
    function schemaEditorDraft(schema) {
        const draft = schema.workingDraft;
        if (!draft)
            return structuredClone(schema);
        const { attachedRules: _attachedRules, parentSchemaId: _parentSchemaId, inheritedRuleOverrides: _overrides, documentation: _documentation, canonicalSchema: _canonicalSchema, ...current } = structuredClone(schema);
        return { ...current, name: draft.name ?? current.name, document: structuredClone(draft.document), assignments: structuredClone(draft.assignments),
            ...(draft.attachedRules !== undefined ? { attachedRules: structuredClone(draft.attachedRules) } : {}),
            ...(draft.parentSchemaId !== undefined ? { parentSchemaId: draft.parentSchemaId } : {}),
            ...(draft.inheritedRuleOverrides !== undefined ? { inheritedRuleOverrides: structuredClone(draft.inheritedRuleOverrides) } : {}),
            ...(draft.documentation !== undefined ? { documentation: structuredClone(draft.documentation) } : {}),
            ...(draft.canonicalSchema !== undefined ? { canonicalSchema: structuredClone(draft.canonicalSchema) } : {}) };
    }
    function withSchemaParent(schema, parentSchemaId) {
        const { parentSchemaId: _previousParentSchemaId, ...withoutParent } = schema;
        return parentSchemaId ? { ...withoutParent, parentSchemaId } : withoutParent;
    }
    function schemaRuleLabel(entry) {
        return reusableSchemaRules.find(({ id }) => id === entry.rule.id)?.name ?? entry.rule.id;
    }
    function displaySchemaRule(entry) {
        return `${schemaRuleLabel(entry)} v${entry.rule.version} · ${entry.path} · ${entry.origin.name} v${entry.origin.version}`;
    }
    function renderSchemaInheritancePresentation(draft) {
        if (!schemaInheritedRuleGroups || !schemaEffectiveRulePreview || !schemaOwnerDocument)
            return;
        const ancestors = [], seen = new Set([draft.id]);
        let parentId = draft.parentSchemaId;
        while (parentId && !seen.has(parentId)) {
            seen.add(parentId);
            const parent = schemas.find(({ id }) => id === parentId);
            if (!parent)
                break;
            ancestors.push(parent);
            parentId = parent.parentSchemaId;
        }
        const inherited = ancestors.flatMap((origin) => (origin.attachedRules ?? []).map((rule) => {
            const override = rule.propertyPath ? draft.inheritedRuleOverrides?.[rule.propertyPath] : undefined;
            return { path: rule.propertyPath ?? "root", rule, origin, state: override === "disabled" ? "disabled-inherited"
                    : override === "enabled" ? "explicitly-reenabled" : "active-inherited" };
        }));
        const local = (draft.attachedRules ?? []).map((rule) => ({ path: rule.propertyPath ?? "root", rule, origin: draft, state: "local" }));
        const groups = {
            "active-inherited": inherited.filter((entry) => entry.state === "active-inherited" && entry.rule.enabled !== false),
            "disabled-inherited": inherited.filter((entry) => entry.state === "disabled-inherited" || (entry.state === "active-inherited" && entry.rule.enabled === false)),
            "explicitly-reenabled": inherited.filter((entry) => entry.state === "explicitly-reenabled"), local
        };
        const labels = { "active-inherited": "Active inherited",
            "disabled-inherited": "Disabled inherited", "explicitly-reenabled": "Explicitly re-enabled", local: "Local" };
        schemaInheritedRuleGroups.hidden = ancestors.length === 0;
        schemaEffectiveRulePreview.hidden = ancestors.length === 0;
        schemaInheritedRuleGroups.replaceChildren(...["active-inherited", "disabled-inherited", "explicitly-reenabled", "local"].map((state) => {
            const group = schemaOwnerDocument.createElement("section"), heading = schemaOwnerDocument.createElement("h5"), list = schemaOwnerDocument.createElement("ul"), entries = groups[state];
            group.dataset.inheritedRuleGroup = state;
            heading.textContent = `${labels[state]} (${entries.length})`;
            const empty = state === "local" ? "No local rules." : state === "explicitly-reenabled" ? "No explicitly re-enabled inherited rules." : `No ${labels[state].toLowerCase()} rules.`;
            list.replaceChildren(...(entries.length ? entries.map((entry) => { const item = schemaOwnerDocument.createElement("li"); item.textContent = displaySchemaRule(entry); return item; })
                : [Object.assign(schemaOwnerDocument.createElement("li"), { textContent: empty })]));
            group.append(heading, list);
            return group;
        }));
        const effective = [...groups["active-inherited"], ...groups["explicitly-reenabled"], ...groups.local], heading = schemaOwnerDocument.createElement("h4"), list = schemaOwnerDocument.createElement("ul");
        heading.textContent = "Effective-rule preview";
        list.replaceChildren(...(effective.length ? effective.map((entry) => Object.assign(schemaOwnerDocument.createElement("li"), {
            textContent: `${entry.path} · ${schemaRuleLabel(entry)} v${entry.rule.version} · ${entry.state === "local" ? "local" : `inherited from ${entry.origin.name} v${entry.origin.version}`}`
        }))
            : [Object.assign(schemaOwnerDocument.createElement("li"), { textContent: "No effective rules." })]));
        schemaEffectiveRulePreview.replaceChildren(heading, list);
    }
}
export const installedControllerDefinition = Object.freeze({
    id: "schemas",
    capabilities: ["schema and rule libraries", "drafts", "assignments", "validation", "guided validation"],
});
//# sourceMappingURL=index.js.map