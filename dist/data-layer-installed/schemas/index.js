import { SCHEMA_LIBRARY_STORAGE_KEY, discardSchemaWorkingDraft, duplicateSchemaRevision, filterAndSortSchemaPropertyRows, inspectSchemaPropertyRemoval, inspectSpecificIndexRuleTarget, inspectJsonSchemaExport, importSchema, inspectManualProperty, inspectSchemaRename, proposeSchemaWorkingDraftName, publishSchemaWorkingDraft, removeSchemaProperty, restoreSchemaRevisionDraft, schemaRevision, schemaPropertyRows, schemaRevisionChoices, schemaPropertyCopySource, schemaInheritanceConflict, schemaInheritanceError, addManualProperty, assignmentDraftAfterGuidedSave, assignableSchemas, assignmentConditionSuggestions, configuredRuleDetails, ruleConfigurationControls, validateRuleConfiguration, comparisonValueFromInput, builtInRulesForProperty, applicablePropertyTypesForRule, reusableRulesForProperty, reusableRuleMetadata, conditionGroupAppliesToValue, operatorsForConditionType, cardinalityComparisonPasses, renderSchemaPropertyTypeEditor, applySchemaPropertyTypeEdit, schemaPropertyTypeLabel, schemaPropertyTypeOwner, canonicalDocumentationPath, resolveEffectiveSchemaDocumentation, schemaPropertyExampleChoices, schemaPropertyExampleInputType, exampleValueFromInput, schemaPropertyExampleConflicts, assignmentDataConditionSummary, contextualManualPropertyDefinition, createRuleConfiguration, createRuleConfigurationFromAttachedRule, createExtensionSchemaPackage, createSchemaLibraryExport, duplicateSchemaAssignment, guidedAttachedRule, guidedPropertyDocument, manualPropertyContainerAction, manualPropertyPreview, mergeGuidedDocument, serializeSchemaLibrary, exportJsonSchemaBundle, exportJsonSchemaResource, setSchemaDescription as updateSchemaDescription, setPropertyDocumentation, undoSchemaPropertyRemoval, undoSchemaPropertyCopy, updateSchemaWorkingDraft, validateAssignmentDataConditions, validateEvent, validateWithSchema, mountCanonicalSchemaEditor, mountCanonicalPredicateEditor, typedComparisonValue, GUIDED_CONTINUATION_STORAGE_KEY, restoreGuidedContinuationSelections, selectGuidedContinuation, selectedGuidedContinuation, createGuidedValidationFlow, applyCanonicalCommand, canonicalCommandOutcome, canonicalPropertyPath, canonicalLivePropertyPath, canonicalRulePropertyPath, canonicalCommandsFromCompactProjection, compactCanonicalCommandPolicy, compactSchemaProjection, createSchema, activateFocusedOwnershipSection, clearSchemaTableOverlay, focusedCanonicalOwnershipInput, focusedDefinitionFieldLabels, focusedOwnershipActionTarget, focusedOwnershipState, focusedPropertyLayerSequence, focusedPropertyLifecycleOperation, focusedPropertyPatch, focusedPropertyProvenanceSummary, focusedSectionOwnershipActions, focusedSourceState, focusedStagedChanges, gateFocusedOwnershipSection, mountSchemaTableOverlay, renderCanonicalFocusedSection, renderFocusedPropertyMenu, renderCanonicalFocusedRules, savedSchemaCanonicalDocument, savedSchemaFromCanonical, beginCompactCanonicalHistoryTransition, compactCanonicalHistoryKey, compactCanonicalHistorySettlement, completeCompactCanonicalHistoryTransition, recordCompactCanonicalMutation, rejectCompactCanonicalHistoryTransition, } from "../../utilities/data-layer/schemas.js";
import { createSchemaLifecycle } from "./lifecycle.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import { SchemaLibraryController } from "./library-controller.js";
import { applySchemaPropertyCopy } from "../../data-layer-schema-property-copy.js";
import { renderSchemaPropertyCopyReview } from "../../data-layer-schema-property-copy-ui.js";
import { normalizeAllowedValuesRuleLibraryEntry } from "../../data-layer-allowed-values-rule.js";
import { persistLocalRulePromotion, promoteLocalRule, reviewLocalRulePromotion, } from "../../data-layer-local-rule-promotion.js";
import { createProjectHydrationSlot } from "./project-hydration.js";
import { createSchemaEditorRouteController } from "./editor-route-controller.js";
import { publishReusableRuleSync, reviewReusableRuleSync, } from "../../data-layer-reusable-rule-sync.js";
import { addLiveSchemaPropertyDeclaration, createLiveSchemaPropertyDeclaration, } from "../../data-layer-live-schema-property-declaration.js";
import { applyAllowedValueExpansion, reviewAllowedValueExpansion, } from "../../data-layer-allowed-value-expansion.js";
import { openAllowedValueExpansionDialog } from "../../data-layer-allowed-value-expansion-ui.js";
const SCHEMA_RULE_STORAGE_KEY = "my-chrome-utilities.schema-rule-library.v1";
export function createSchemasInstalledController(ports) {
    const schemaSearch = ports.root.querySelector("#schema-search");
    const schemaCategoryFilter = ports.root.querySelector("#schema-category-filter");
    const schemaEmptyState = ports.root.querySelector("#schema-empty-state");
    const schemaCount = ports.root.querySelector("#schema-count");
    const schemaList = ports.root.querySelector("#schema-list");
    const schemaResult = ports.root.querySelector("#schema-result");
    const createSchemaButton = ports.root.querySelector("#create-schema");
    const recheckSchemaValidationButton = ports.root.querySelector("#recheck-schema-validation");
    const schemaValidationIssues = ports.root.querySelector("#schema-validation-issues");
    const schemaValidationRecordList = ports.root.querySelector("#schema-validation-record-list");
    const guidedValidationRoot = ports.root.querySelector("#guided-validation-flow");
    const schemaEditor = ports.root.querySelector("#schema-editor");
    const schemaEditorStatus = ports.root.querySelector("#schema-editor-status");
    const schemaDetail = ports.root.querySelector("#schema-detail");
    const schemaTreeScrollOwner = ports.root.querySelector("#workspace-panel-data-layer");
    const schemaPanel = ports.root.querySelector("#data-layer-panel-schemas");
    const editorRoute = createSchemaEditorRouteController({
        panel: schemaPanel, scrollOwner: schemaTreeScrollOwner, scheduleFrame: ports.scheduleFrame,
    });
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
    const schemaEditorNameAssistance = ownedElement("#schema-editor-name-assistance", "output");
    if (schemaEditorNameAssistance && !schemaEditorNameAssistance.isConnected) {
        schemaEditorNameAssistance.id = "schema-editor-name-assistance";
        schemaEditorName?.after(schemaEditorNameAssistance);
    }
    const schemaInheritedRuleGroups = ownedElement("#schema-inherited-rule-groups", "section");
    const schemaEffectiveRulePreview = ownedElement("#schema-effective-rule-preview", "section");
    const schemaSpecificationBuilder = ownedElement("#schema-specification-builder", "section");
    const buildSpecificationButton = ownedElement("#build-specification", "button");
    const buildHistoricalSpecificationButton = ownedElement("#build-historical-specification", "button");
    const compactCanonicalContext = ownedElement("#compact-canonical-context", "section");
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
    if (compactCanonicalContext) {
        compactCanonicalContext.id = "compact-canonical-context";
        compactCanonicalContext.setAttribute("aria-label", "Compact canonical schema context");
        compactCanonicalContext.hidden = true;
        schemaEditor?.prepend(compactCanonicalContext);
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
    let schemaPropertyCopyDialog = ownedElement("#schema-property-copy-dialog", "dialog");
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
    if (schemaRuleTypes?.ownerDocument)
        schemaRuleTypes.replaceChildren(...[
            ["string", "String"], ["number", "Number"], ["boolean", "Boolean"],
            ["object", "Object"], ["array", "Array"],
        ].map(([value, label]) => {
            const option = schemaRuleTypes.ownerDocument.createElement("option");
            option.value = value;
            option.textContent = label;
            return option;
        }));
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
    const confirmSchemaRuleRevisionButton = ownedElement("#confirm-schema-rule-revision-review", "button");
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
                const empty = schemaOwnerDocument?.createElement("option");
                if (empty) {
                    empty.value = "";
                    empty.textContent = "Choose item type";
                    schemaManualArrayItemType.append(empty);
                }
                for (const type of ["string", "number", "boolean", "object"]) {
                    const option = schemaOwnerDocument?.createElement("option");
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
        schemaOwnerDocument?.body.append(schemaManualPropertyDialog);
    }
    if (schemaPropertyRulePicker && !schemaPropertyRulePicker.isConnected) {
        schemaPropertyRulePicker.id = "schema-property-rule-picker";
        schemaPropertyRulePicker.setAttribute("aria-label", "Schema property rule picker");
        schemaOwnerDocument?.body.append(schemaPropertyRulePicker);
    }
    const installRuleReviewDialog = (dialog, id, heading, summary, confirm, cancel, confirmId = `confirm-${id.replace("-review", "")}`) => {
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
            confirm.id = confirmId;
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
    installRuleReviewDialog(schemaRuleRevisionReview, "schema-rule-revision-review", "Review rule revision", schemaRuleRevisionReviewSummary, confirmSchemaRuleRevisionButton, cancelSchemaRuleRevisionButton, "confirm-schema-rule-revision-review");
    installRuleReviewDialog(schemaRuleUpgradeReview, "schema-rule-upgrade-review", "Update pinned rule attachments", schemaRuleUpgradeReviewSummary, confirmSchemaRuleUpgradeButton, cancelSchemaRuleUpgradeButton);
    installRuleReviewDialog(schemaRuleSyncReview, "schema-rule-sync-review", "Sync attached schemas and publish revisions", schemaRuleSyncReviewSummary, confirmSchemaRuleSyncButton, cancelSchemaRuleSyncButton, "confirm-schema-rule-sync");
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
    const lifecycle = createSchemaLifecycle();
    let unsubscribe;
    let unsubscribeSchemaPersistence;
    let hydratedSchemaProjectId;
    const relationshipTreeController = createSchemaRelationshipTreeController({
        query: schemaSearch, category: schemaCategoryFilter, scrollOwner: schemaTreeScrollOwner,
        panel: schemaPanel, storage: ports.relationshipViewStorage, scheduleFrame: ports.scheduleFrame,
    });
    const activeSchemaProjectHydration = createProjectHydrationSlot();
    const schemaContributorRoute = { collectionKinds: ["profiles", "propertySets", "pages", "events", "flows"], includeFlowGraphs: true };
    let schemaRuleRowDisposers = [];
    let schemaPropertyRowDisposers = [], schemaRulePickerDisposers = [];
    const listen = (target, type, listener) => {
        relationshipTreeController.listen(target, type, listener);
    };
    const listenRule = (target, type, listener) => {
        target.addEventListener(type, listener);
        schemaRuleRowDisposers.push(() => target.removeEventListener(type, listener));
    };
    const listenProperty = (target, type, listener) => {
        target.addEventListener(type, listener);
        schemaPropertyRowDisposers.push(() => target.removeEventListener(type, listener));
    };
    const library = new SchemaLibraryController({ storage: ports.storage, changed: ports.changed });
    let selectedSchemaPropertyPath = "example";
    const expandedSchemaPropertyRulePaths = new Set();
    let pendingSchemaPropertyRemoval;
    let lastSchemaPropertyRemoval;
    let lastSchemaPropertyCopy;
    let pendingSchemaPropertyCopy;
    let pendingSchemaPropertyCopyReview;
    let pendingSchemaPropertyCopyPosition;
    let pendingSchemaDocumentationRemoval;
    let specificIndexArrayPath;
    let specificIndexTrigger;
    let pendingManualPropertyContext;
    let pendingManualPropertyCanonicalBase;
    let pendingSchemaRestoration;
    const MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY = "my-chrome-utilities.manual-schema-overrides.v1";
    let manualSchemaOverrides = (() => {
        try {
            const parsed = JSON.parse(ports.storage.getItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY) ?? "{}");
            return parsed && typeof parsed === "object" ? parsed : {};
        }
        catch {
            return {};
        }
    })();
    let schemaRulePickerPath;
    let schemaRulePickerTrigger;
    let schemaPropertyInteractionReturn;
    let schemaPropertyRenderSequence = 0, schemaRulePickerSearch = "";
    let schemaRuleConfiguration;
    let editingAttachedLocalRule;
    const normalizeReusableSchemaRule = (value) => {
        if (!value || typeof value !== "object" || !("id" in value) || !("name" in value) || !("version" in value))
            return;
        const candidate = structuredClone(value);
        return normalizeAllowedValuesRuleLibraryEntry({ ...candidate,
            kind: typeof candidate.kind === "string" && candidate.kind ? candidate.kind : candidate.operator === "allowed-values" ? "Allowed values" : "Rule",
            enabled: candidate.enabled !== false });
    };
    const storedReusableSchemaRules = ports.storage.getItem(SCHEMA_RULE_STORAGE_KEY);
    let reusableSchemaRules = (() => {
        try {
            const stored = JSON.parse(storedReusableSchemaRules ?? "[]");
            return Array.isArray(stored) ? stored.map(normalizeReusableSchemaRule).filter((rule) => Boolean(rule)) : [];
        }
        catch {
            return [];
        }
    })();
    if (storedReusableSchemaRules !== null && JSON.stringify(reusableSchemaRules) !== storedReusableSchemaRules) {
        ports.storage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules));
    }
    let editingReusableSchemaRuleId;
    let approvedRuleRevisionId;
    let approvedRuleAttachmentUpdateId;
    let pendingRuleSnapshotMetadata;
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
    let localRulePromotionFocusReturn;
    let localRulePromotionFocusedPosition;
    let pendingLocalRulePromotionPersistence;
    let pendingGuidedValidationPersistence;
    let guidedContinuationSelections = restoreGuidedContinuationSelections(ports.storage.getItem(GUIDED_CONTINUATION_STORAGE_KEY));
    let guidedPropertyReturn;
    const SCHEMA_VALIDATION_RECORD_STORAGE_KEY = "my-chrome-utilities.schema-validation-records.v1";
    let schemaValidationRecords = (() => {
        try {
            const parsed = JSON.parse(ports.storage.getItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY) ?? "[]");
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    })();
    let capturedContinuationRowDisposers = [];
    let capturedContinuationDialogDisposers = [];
    let persistenceGeneration = 0;
    let schemaExportTrigger;
    let pendingStandardSchemaExport;
    let savedCanonicalDocument;
    let compactCanonicalEditor;
    let compactCanonicalPendingCommand;
    let compactCanonicalPendingBase;
    let compactCanonicalReviewVisible = false;
    const compactCanonicalRevisionSnapshots = new Map();
    let compactCanonicalCommandFeedback;
    let compactCanonicalSettlementSequence = 0;
    const compactCanonicalSettlementClaims = new Map();
    let compactCanonicalIdSequence = 0;
    let compactCanonicalSettlementPending = false;
    let compactCanonicalSettlementSchemaId;
    let compactCanonicalSettlementBarrier = Promise.resolve(true);
    let compactCanonicalProjectionRequest;
    let compactCanonicalProjectionWorker;
    let queuedSchemaLibraryPersistence;
    let schemaLibraryPersistenceWorker;
    let compactCanonicalReopenSelection;
    const compactCanonicalScrollByKey = new Map();
    let compactCanonicalHistoryState = compactCanonicalHistorySettlement();
    let compactCanonicalPendingHistoryLabel;
    let compactCanonicalPresenceDraft;
    let compactCanonicalContextDisposers = [];
    let compactCanonicalPropertyMenuId;
    let compactCanonicalTableHost;
    let compactCanonicalTableEditor;
    let compactCanonicalTableKey;
    const compactCanonicalProjection = (adapter, canonical = adapter.load()) => adapter.projection?.(canonical) ?? compactSchemaProjection(canonical, { id: canonical.contributorId, name: canonical.contributorName, version: canonical.revision });
    const compactCanonicalFacetText = (canonical, node) => {
        const allowed = node.allowedValues.length ? node.allowedValues.map(({ value }) => String(value)).join(", ") : "none";
        return `Canonical facets · type ${node.type} · presence ${node.presence.mode} · allowed values ${allowed} · revision ${canonical.revision}`;
    };
    const beginCompactCanonicalPendingHistory = (projectId, editorKey, label, history) => {
        const identity = { operationId: `schema-history:${++compactCanonicalIdSequence}`, projectId, editorKey };
        compactCanonicalHistoryState = beginCompactCanonicalHistoryTransition(compactCanonicalHistoryState, { ...identity, history });
        compactCanonicalPendingHistoryLabel = label;
        return identity;
    };
    const completeCompactCanonicalPendingHistory = (identity) => {
        compactCanonicalHistoryState = completeCompactCanonicalHistoryTransition(compactCanonicalHistoryState, identity);
        if (!compactCanonicalHistoryState.pending)
            compactCanonicalPendingHistoryLabel = undefined;
    };
    const rejectCompactCanonicalPendingHistory = (identity) => {
        compactCanonicalHistoryState = rejectCompactCanonicalHistoryTransition(compactCanonicalHistoryState, identity);
        if (!compactCanonicalHistoryState.pending)
            compactCanonicalPendingHistoryLabel = undefined;
    };
    const compactCanonicalPendingHistoryFor = (projectId, label) => {
        const pending = compactCanonicalHistoryState.pending;
        return pending && pending.projectId === projectId && compactCanonicalPendingHistoryLabel === label
            ? { operationId: pending.operationId, projectId: pending.projectId, editorKey: pending.editorKey } : undefined;
    };
    const compactCanonicalSemanticUnresolved = (owned) => Boolean(compactCanonicalSettlementPending || compactCanonicalHistoryState.pending || compactCanonicalPendingCommand
        || (compactCanonicalProjectionWorker && compactCanonicalProjectionWorker.adapter !== owned?.adapter)
        || (compactCanonicalProjectionRequest && compactCanonicalProjectionRequest !== owned));
    const compactCanonicalSavedSchemaId = (adapter) => adapter?.key.startsWith("saved:") ? adapter.key.slice("saved:".length) : undefined;
    const beginCompactCanonicalSettlement = (schemaId) => {
        const settlement = ++compactCanonicalSettlementSequence;
        compactCanonicalSettlementClaims.set(settlement, schemaId);
        compactCanonicalSettlementPending = true;
        compactCanonicalSettlementSchemaId = schemaId;
        schemaEditor?.setAttribute("aria-busy", "true");
        if (saveSchemaButton)
            saveSchemaButton.disabled = true;
        return settlement;
    };
    const clearCompactCanonicalSettlement = (schemaId, settlement) => {
        if (settlement !== undefined) {
            if (!compactCanonicalSettlementClaims.has(settlement) || compactCanonicalSettlementClaims.get(settlement) !== schemaId)
                return false;
            compactCanonicalSettlementClaims.delete(settlement);
            if (compactCanonicalSettlementClaims.size) {
                compactCanonicalSettlementSchemaId = [...compactCanonicalSettlementClaims.values()].at(-1);
                return false;
            }
        }
        else
            compactCanonicalSettlementClaims.clear();
        if (queuedSchemaLibraryPersistence || schemaLibraryPersistenceWorker) {
            compactCanonicalSettlementPending = true;
            compactCanonicalSettlementSchemaId = queuedSchemaLibraryPersistence?.schemaId ?? schemaId;
            return false;
        }
        compactCanonicalSettlementPending = false;
        compactCanonicalSettlementSchemaId = undefined;
        return true;
    };
    const compactCanonicalProjectionQueueUnavailable = (adapter) => Boolean(compactCanonicalHistoryState.pending || compactCanonicalPendingCommand
        || (compactCanonicalProjectionWorker && compactCanonicalProjectionWorker.adapter !== adapter)
        || (compactCanonicalProjectionRequest && compactCanonicalProjectionRequest.adapter !== adapter));
    const renderCompactCanonicalContext = () => {
        if (!compactCanonicalContext)
            return;
        for (const dispose of compactCanonicalContextDisposers.splice(0))
            dispose();
        const adapter = compactCanonicalEditor;
        compactCanonicalContext.hidden = !adapter;
        compactCanonicalContext.replaceChildren();
        if (!adapter || !schemaOwnerDocument)
            return;
        const identity = schemaOwnerDocument.createElement("p"), feedback = schemaOwnerDocument.createElement("output");
        identity.textContent = `${adapter.label} · revision ${adapter.load().revision}`;
        feedback.setAttribute("aria-label", "Compact canonical command result");
        feedback.textContent = compactCanonicalCommandFeedback ?? "Canonical editor ready.";
        compactCanonicalContext.append(identity, feedback);
        const own = (control, action, type = "click") => { compactCanonicalContextDisposers.push(() => control.removeEventListener(type, action)); };
        const runHistoryAction = (action) => {
            void Promise.resolve(action()).then((message) => {
                if (message) {
                    compactCanonicalCommandFeedback = message;
                    renderCompactCanonicalContext();
                }
            }, (error) => { compactCanonicalCommandFeedback = `The page-scoped canonical command failed. ${error instanceof Error ? error.message : String(error)}`; renderCompactCanonicalContext(); });
        };
        if (adapter.onUndo) {
            const undo = schemaOwnerDocument.createElement("button"), action = () => runHistoryAction(adapter.onUndo);
            undo.type = "button";
            undo.textContent = "Undo";
            undo.addEventListener("click", action);
            own(undo, action);
            compactCanonicalContext.append(undo);
        }
        if (adapter.onRedo) {
            const redo = schemaOwnerDocument.createElement("button"), action = () => runHistoryAction(adapter.onRedo);
            redo.type = "button";
            redo.textContent = "Redo";
            redo.addEventListener("click", action);
            own(redo, action);
            compactCanonicalContext.append(redo);
        }
        for (const configured of adapter.actions ?? []) {
            const contextAction = schemaOwnerDocument.createElement("button"), action = () => configured.run();
            contextAction.type = "button";
            contextAction.textContent = configured.label;
            contextAction.addEventListener("click", action);
            own(contextAction, action);
            compactCanonicalContext.append(contextAction);
        }
        const tableControl = schemaOwnerDocument.createElement("button"), treeControl = schemaOwnerDocument.createElement("button");
        tableControl.type = treeControl.type = "button";
        tableControl.textContent = "Table";
        treeControl.textContent = "Tree";
        const showTable = () => { const current = adapter.load(); void dispatchCompactCanonicalCommand({ kind: "view", baseRevision: current.revision, view: "table" }); };
        const showTree = () => { const current = adapter.load(); void dispatchCompactCanonicalCommand({ kind: "view", baseRevision: current.revision, view: "tree" }); };
        tableControl.addEventListener("click", showTable);
        treeControl.addEventListener("click", showTree);
        own(tableControl, showTable);
        own(treeControl, showTree);
        compactCanonicalContext.append(tableControl, treeControl);
        adapter.renderContext?.(compactCanonicalContext);
        if (adapter.migration) {
            const migration = adapter.migration, review = schemaOwnerDocument.createElement("section"), summary = schemaOwnerDocument.createElement("p"), cancel = schemaOwnerDocument.createElement("button"), confirm = schemaOwnerDocument.createElement("button");
            review.setAttribute("aria-label", "Canonical schema migration review");
            summary.textContent = migration.summary;
            for (const conflict of migration.conflicts) {
                const resolution = schemaOwnerDocument.createElement("select");
                resolution.setAttribute("aria-label", conflict.label);
                resolution.append(...conflict.choices.map(({ id, label }) => {
                    const option = schemaOwnerDocument.createElement("option");
                    option.value = id;
                    option.textContent = label;
                    return option;
                }));
                const select = () => { if (resolution.value)
                    migration.resolve(conflict.id, resolution.value); };
                resolution.addEventListener("change", select);
                own(resolution, select, "change");
                review.append(resolution);
            }
            cancel.type = confirm.type = "button";
            cancel.textContent = "Cancel migration";
            confirm.textContent = "Confirm canonical migration";
            confirm.disabled = migration.conflicts.length > 0;
            const cancelMigration = () => { migration.cancel(); renderCompactCanonicalContext(); };
            const confirmMigration = () => {
                const generation = lifecycle.generation();
                confirm.disabled = true;
                void migration.confirm().then(() => { if (lifecycle.isMounted() && generation === lifecycle.generation() && compactCanonicalEditor === adapter)
                    renderCompactCanonicalContext(); }, () => { if (lifecycle.isMounted() && generation === lifecycle.generation() && compactCanonicalEditor === adapter) {
                    confirm.disabled = false;
                    renderCompactCanonicalContext();
                } });
            };
            cancel.addEventListener("click", cancelMigration);
            confirm.addEventListener("click", confirmMigration);
            own(cancel, cancelMigration);
            own(confirm, confirmMigration);
            review.append(summary, cancel, confirm);
            compactCanonicalContext.append(review);
        }
        if (compactCanonicalPropertyMenuId && adapter.load().nodes[compactCanonicalPropertyMenuId]) {
            const propertyId = compactCanonicalPropertyMenuId;
            for (const [label, action, value] of [
                ["Add child", "add-child"], ["Clear example", "no-example"], ["Use custom example", "custom-example", "example"],
                ["Save documentation", "documentation", "Documented property"], ["Required", "presence", "required"],
                ["Rename", "rename", `${adapter.load().nodes[propertyId].name} renamed`], ["Move to root", "move"], ["Duplicate", "duplicate"],
                ["Save expected value", "expected", "expected"], ["Reset expected value", "reset-expected"], ["View", "view"], ["Remove", "remove"],
            ]) {
                const compactPropertyControl = schemaOwnerDocument.createElement("button"), run = () => { void compactCanonicalPropertyAction(propertyId, action, value); };
                compactPropertyControl.type = "button";
                compactPropertyControl.textContent = label;
                compactPropertyControl.addEventListener("click", run);
                own(compactPropertyControl, run);
                compactCanonicalContext.append(compactPropertyControl);
            }
        }
        if (compactCanonicalPendingCommand) {
            const compare = schemaOwnerDocument.createElement("button"), retry = schemaOwnerDocument.createElement("button"), reject = schemaOwnerDocument.createElement("button");
            compare.type = retry.type = reject.type = "button";
            compare.textContent = "Compare latest property";
            retry.textContent = "Retry local edit";
            reject.textContent = "Reject local edit";
            const compareLatest = () => {
                compactCanonicalReviewVisible = true;
                const base = compactCanonicalPendingBase, latest = adapter.load();
                compactCanonicalCommandFeedback = `Comparing command base revision ${base?.revision ?? "unknown"} with latest revision ${latest.revision}.`;
                renderCompactCanonicalContext();
            };
            compare.addEventListener("click", compareLatest);
            retry.addEventListener("click", retryCompactCanonicalCommand);
            reject.addEventListener("click", rejectCompactCanonicalCommand);
            own(compare, compareLatest);
            own(retry, retryCompactCanonicalCommand);
            own(reject, rejectCompactCanonicalCommand);
            compactCanonicalContext.append(compare, retry, reject);
        }
    };
    function removeCompactCanonicalTableEditor() {
        compactCanonicalTableHost?.replaceChildren();
        compactCanonicalTableHost?.remove();
        compactCanonicalTableHost = undefined;
        compactCanonicalTableEditor = undefined;
        compactCanonicalTableKey = undefined;
    }
    function renderCompactCanonicalEditor() {
        renderCompactCanonicalContext();
        const adapter = compactCanonicalEditor;
        if (!adapter || !schemaEditor || !schemaOwnerDocument) {
            removeCompactCanonicalTableEditor();
            return;
        }
        const canonical = adapter.load();
        library.draft = compactCanonicalProjection(adapter, canonical);
        compactCanonicalRevisionSnapshots.set(canonical.revision, structuredClone(canonical));
        const selected = canonical.selectedPropertyId ? canonical.nodes[canonical.selectedPropertyId] : undefined;
        const presented = library.activeSchemaId ? schemaEditorDraft(active()) : library.draft;
        const selectedPathStillExists = presented && schemaPropertyAt(presented.document, normalizedRulePickerPath(selectedSchemaPropertyPath));
        if (selected && !selectedPathStillExists)
            selectedSchemaPropertyPath = canonicalPropertyPath(canonical, selected.id).slice(1).replaceAll("/", ".");
        schemaEditor.hidden = false;
        schemaEditor.dataset.schemaPresentation = "compact-panel";
        schemaEditor.dataset.canonicalRevision = String(canonical.revision);
        schemaEditor.dataset.canonicalSchemaId = canonical.id;
        schemaEditor.setAttribute("aria-label", "Side panel canonical schema editor");
        if (schemaDetail) {
            schemaDetail.hidden = false;
            schemaDetail.setAttribute("aria-label", "Side panel schema editor region");
        }
        renderSchemaDraft();
        if (!compactCanonicalTableHost?.isConnected) {
            compactCanonicalTableHost = schemaOwnerDocument.createElement("section");
            compactCanonicalTableHost.id = "compact-canonical-table-editor";
            schemaEditor.append(compactCanonicalTableHost);
            compactCanonicalTableEditor = undefined;
            compactCanonicalTableKey = undefined;
        }
        compactCanonicalTableHost.replaceChildren();
        compactCanonicalTableKey = adapter.key;
        const createEditor = ports.createCanonicalTableEditor ?? mountCanonicalSchemaEditor;
        compactCanonicalTableEditor = createEditor({ host: compactCanonicalTableHost, surface: "Side panel",
            conceptSuggestions: ports.canonicalConceptSuggestions, load: adapter.load, id: (kind) => `${kind}:${crypto.randomUUID()}`,
            dispatch: (command) => beginCompactCanonicalCommand(command)?.result
                ?? blockedCompactCanonicalCommand(adapter, command, "The canonical editor is no longer available."),
            ...(adapter.onUndo ? { onUndo: adapter.onUndo } : {}), ...(adapter.onRedo ? { onRedo: adapter.onRedo } : {}) });
        const tableControl = Array.from(compactCanonicalTableHost.querySelectorAll("button")).find(({ textContent }) => textContent?.trim() === "Table");
        const treeControl = Array.from(compactCanonicalTableHost.querySelectorAll("button")).find(({ textContent }) => textContent?.trim() === "Tree");
        tableControl?.addEventListener("click", () => {
            const current = adapter.load();
            beginCompactCanonicalCommand({ kind: "view", baseRevision: current.revision, view: "table" });
            compactCanonicalTableHost.hidden = false;
        }, { once: true });
        treeControl?.addEventListener("click", () => {
            const current = adapter.load();
            beginCompactCanonicalCommand({ kind: "view", baseRevision: current.revision, view: "tree" });
            renderCompactCanonicalEditor();
        }, { once: true });
        compactCanonicalTableHost.hidden = adapter.load().view !== "table";
        const unavailable = compactCanonicalSemanticUnresolved();
        schemaEditor.setAttribute("aria-busy", String(unavailable));
        if (saveSchemaButton && adapter.key.startsWith("saved:"))
            saveSchemaButton.disabled = saveSchemaButton.disabled || unavailable;
    }
    const blockedCompactCanonicalCommand = (adapter, command, message) => ({ status: "conflict", document: adapter.load(), ...(command.kind !== "policy" && "propertyId" in command ? { propertyId: command.propertyId } : {}), message });
    const beginCompactCanonicalCommand = (command, owned) => {
        const adapter = compactCanonicalEditor;
        if (!adapter)
            return;
        const policy = compactCanonicalCommandPolicy(command.kind, compactCanonicalSemanticUnresolved(owned));
        if (!policy.allowed) {
            const message = "Resolve the current durable schema save through Retry or Reject before another semantic change.";
            compactCanonicalCommandFeedback = message;
            renderCompactCanonicalContext();
            return { accepted: false, result: blockedCompactCanonicalCommand(adapter, command, message), completion: Promise.resolve(false) };
        }
        const before = structuredClone(adapter.load());
        compactCanonicalRevisionSnapshots.set(before.revision, before);
        let result;
        try {
            result = adapter.dispatch(command);
        }
        catch (error) {
            const message = `The canonical command was not applied. ${error instanceof Error ? error.message : String(error)}`;
            compactCanonicalCommandFeedback = message;
            renderCompactCanonicalContext();
            return { accepted: false, result: blockedCompactCanonicalCommand(adapter, command, message), completion: Promise.resolve(false) };
        }
        if (result.status === "conflict" || result.status === "confirmation-required") {
            compactCanonicalPendingCommand = command;
            compactCanonicalPendingBase = before;
            compactCanonicalReviewVisible = false;
            compactCanonicalCommandFeedback = result.status === "conflict" ? result.message : result.impact;
            renderCompactCanonicalContext();
            return { accepted: false, result, completion: Promise.resolve(false) };
        }
        if (policy.semantic) {
            compactCanonicalPendingCommand = undefined;
            compactCanonicalPendingBase = undefined;
            compactCanonicalReviewVisible = false;
            compactCanonicalPresenceDraft = undefined;
        }
        compactCanonicalCommandFeedback = canonicalCommandOutcome(command, result, before);
        renderCompactCanonicalContext();
        const settlementSchemaId = compactCanonicalSavedSchemaId(adapter);
        const settlement = policy.settles && adapter.settle && (adapter.settles?.(command) ?? true)
            ? beginCompactCanonicalSettlement(settlementSchemaId) : undefined;
        if (!settlement || !adapter.settle)
            return { accepted: true, result, completion: Promise.resolve(true) };
        const generation = lifecycle.generation();
        const completion = adapter.settle().then(() => {
            adapter.onSettlementCommitted?.();
            if (lifecycle.isMounted() && generation === lifecycle.generation()) {
                if (clearCompactCanonicalSettlement(settlementSchemaId, settlement))
                    compactCanonicalCommandFeedback = `Committed to ${adapter.settlementTarget ?? "durable Saved Draft"}.`;
                renderCompactCanonicalEditor();
            }
            return true;
        }, (error) => {
            if (lifecycle.isMounted() && generation === lifecycle.generation()) {
                if (!ports.blocked?.() && clearCompactCanonicalSettlement(settlementSchemaId, settlement)) {
                    compactCanonicalPendingCommand = command;
                    compactCanonicalPendingBase = before;
                    compactCanonicalCommandFeedback = `Not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`;
                }
                renderCompactCanonicalEditor();
            }
            return false;
        });
        compactCanonicalSettlementBarrier = completion;
        return { accepted: true, result, completion };
    };
    const dispatchCompactCanonicalCommand = async (command, owned) => {
        const dispatch = beginCompactCanonicalCommand(command, owned);
        return Boolean(dispatch?.accepted && await dispatch.completion);
    };
    const beginCompactCanonicalProjectionPersistence = (adapter, projection, change) => {
        if (!adapter.persistProjection)
            return Promise.resolve(true);
        compactCanonicalProjectionRequest = { adapter, projection: structuredClone(projection), ...(change ? { change } : {}) };
        if (ports.blocked?.()) {
            compactCanonicalCommandFeedback = "Projection is waiting for the failed durable save to be retried or rejected.";
            renderCompactCanonicalContext();
            return Promise.resolve(false);
        }
        const settlementSchemaId = compactCanonicalSavedSchemaId(adapter);
        compactCanonicalSettlementPending = true;
        compactCanonicalSettlementSchemaId = settlementSchemaId;
        if (schemaEditor)
            schemaEditor.setAttribute("aria-busy", "true");
        if (saveSchemaButton)
            saveSchemaButton.disabled = true;
        if (compactCanonicalProjectionWorker?.adapter === adapter)
            return compactCanonicalProjectionWorker.promise;
        const generation = lifecycle.generation();
        const worker = { adapter, promise: Promise.resolve(false),
            settlement: beginCompactCanonicalSettlement(settlementSchemaId) };
        compactCanonicalProjectionWorker = worker;
        worker.promise = (async () => {
            let committed = false, activeRequest;
            try {
                while (lifecycle.isMounted() && generation === lifecycle.generation() && compactCanonicalEditor === adapter) {
                    const request = compactCanonicalProjectionRequest;
                    if (!request || request.adapter !== adapter)
                        break;
                    activeRequest = request;
                    compactCanonicalProjectionRequest = undefined;
                    if (!adapter.persistProjection(structuredClone(request.projection), request.change))
                        continue;
                    await adapter.settle?.();
                    adapter.onSettlementCommitted?.();
                    committed = true;
                    activeRequest = undefined;
                }
                compactCanonicalCommandFeedback = committed ? `Saved to ${adapter.settlementTarget ?? "durable Saved Draft"}.` : "Projection already current.";
                return true;
            }
            catch (error) {
                if (ports.blocked?.() && lifecycle.isMounted() && generation === lifecycle.generation() && compactCanonicalEditor === adapter && !compactCanonicalProjectionRequest && activeRequest)
                    compactCanonicalProjectionRequest = activeRequest;
                compactCanonicalCommandFeedback = `Projection not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`;
                return false;
            }
            finally {
                if (compactCanonicalProjectionWorker === worker) {
                    compactCanonicalProjectionWorker = undefined;
                    clearCompactCanonicalSettlement(settlementSchemaId, worker.settlement);
                    renderCompactCanonicalEditor();
                }
            }
        })();
        return worker.promise;
    };
    const persistCompactCanonicalProjection = async (adapter, projection, change) => {
        const commands = canonicalCommandsFromCompactProjection(adapter.load(), projection, (kind) => `schema:${kind}:${++compactCanonicalIdSequence}`);
        for (const command of commands)
            if (!await dispatchCompactCanonicalCommand({ ...command, baseRevision: adapter.load().revision }, compactCanonicalProjectionRequest))
                return false;
        return beginCompactCanonicalProjectionPersistence(adapter, projection, change);
    };
    const discardCompactCanonicalProjectionPersistence = (adapter) => {
        if (!adapter || compactCanonicalProjectionRequest?.adapter === adapter)
            compactCanonicalProjectionRequest = undefined;
        if (compactCanonicalSettlementPending || (adapter && compactCanonicalProjectionWorker?.adapter === adapter))
            return;
        compactCanonicalSettlementSequence += 1;
        clearCompactCanonicalSettlement(compactCanonicalSavedSchemaId(adapter));
    };
    function resumeCompactCanonicalProjectionPersistence(adapter) {
        const request = compactCanonicalProjectionRequest;
        return request?.adapter === adapter
            ? persistCompactCanonicalProjection(adapter, request.projection, request.change) : Promise.resolve(true);
    }
    const compactCanonicalCommandScope = (command, document) => "propertyId" in command ? document.nodes[command.propertyId]?.name ?? command.propertyId : command.kind;
    function retryCompactCanonicalCommand() {
        const command = compactCanonicalPendingCommand, adapter = compactCanonicalEditor;
        if (!command || !adapter)
            return;
        compactCanonicalPendingCommand = undefined;
        if (compactCanonicalProjectionRequest?.adapter === adapter) {
            void resumeCompactCanonicalProjectionPersistence(adapter);
            return;
        }
        void dispatchCompactCanonicalCommand({ ...command, baseRevision: adapter.load().revision }).then(renderCompactCanonicalEditor);
    }
    function rejectCompactCanonicalCommand() {
        compactCanonicalPendingCommand = undefined;
        compactCanonicalPendingBase = undefined;
        compactCanonicalReviewVisible = false;
        compactCanonicalProjectionRequest = undefined;
        compactCanonicalCommandFeedback = "Local edit rejected; durable state is unchanged.";
        renderCompactCanonicalContext();
    }
    async function compactCanonicalPropertyAction(propertyId, action, value) {
        const adapter = compactCanonicalEditor, document = adapter?.load(), node = document?.nodes[propertyId];
        if (!adapter || !document || !node)
            return false;
        const baseRevision = document.revision;
        if (action === "add-child")
            return dispatchCompactCanonicalCommand({ kind: "add", baseRevision, parentId: propertyId, name: "New child", type: "string", id: () => ports.createRuleId() });
        if (action === "rename")
            return dispatchCompactCanonicalCommand({ kind: "rename", baseRevision, propertyId, name: value?.trim() || node.name });
        if (action === "move")
            return dispatchCompactCanonicalCommand({ kind: "move", baseRevision, propertyId });
        if (action === "duplicate")
            return dispatchCompactCanonicalCommand({ kind: "duplicate", baseRevision, propertyId, id: () => ports.createRuleId() });
        if (action === "view")
            return dispatchCompactCanonicalCommand({ kind: "select", baseRevision, propertyId });
        if (action === "remove")
            return dispatchCompactCanonicalCommand({ kind: "delete", baseRevision, propertyId });
        if (action === "presence")
            return dispatchCompactCanonicalCommand({ kind: "set", baseRevision, propertyId,
                patch: { presence: { ...node.presence, mode: (value || "optional") } } });
        if (action === "documentation")
            return dispatchCompactCanonicalCommand({ kind: "set", baseRevision, propertyId,
                patch: { documentation: { ...node.documentation, description: value ?? node.documentation.description } } });
        if (action === "no-example")
            return dispatchCompactCanonicalCommand({ kind: "set", baseRevision, propertyId,
                patch: { documentation: { ...node.documentation, example: { method: "blank" } } } });
        if (action === "custom-example")
            return dispatchCompactCanonicalCommand({ kind: "set", baseRevision, propertyId,
                patch: { documentation: { ...node.documentation, example: { method: "custom", value } } } });
        return dispatchCompactCanonicalCommand({ kind: "set", baseRevision, propertyId,
            patch: { expectedValue: action === "expected" ? value : undefined } });
    }
    const openCompactCanonicalEditor = (adapter) => {
        if (!adapter.key.startsWith("saved:")) {
            library.activeSchemaId = undefined;
            savedCanonicalDocument = undefined;
            library.draft = undefined;
        }
        compactCanonicalEditor = adapter;
        compactCanonicalReopenSelection = adapter.key;
        compactCanonicalCommandFeedback = undefined;
        compactCanonicalRevisionSnapshots.clear();
        compactCanonicalRevisionSnapshots.set(adapter.load().revision, structuredClone(adapter.load()));
        if (schemaDetail)
            schemaDetail.scrollTop = compactCanonicalScrollByKey.get(adapter.key) ?? 0;
        renderCompactCanonicalEditor();
    };
    const closeCompactCanonicalEditor = (clearSchemaSelection = true) => {
        if (compactCanonicalEditor && schemaDetail)
            compactCanonicalScrollByKey.set(compactCanonicalEditor.key, schemaDetail.scrollTop);
        discardCompactCanonicalProjectionPersistence(compactCanonicalEditor);
        compactCanonicalEditor = undefined;
        if (clearSchemaSelection) {
            library.activeSchemaId = undefined;
            library.draft = undefined;
            savedCanonicalDocument = undefined;
        }
        removeCompactCanonicalTableEditor();
        compactCanonicalContext && (compactCanonicalContext.hidden = true);
        if (schemaEditor)
            schemaEditor.hidden = true;
        if (schemaDetail)
            schemaDetail.hidden = false;
        if (schemaDetailEmpty)
            schemaDetailEmpty.hidden = false;
        renderSchemas();
        editorRoute.close((referenceKey) => {
            const invokingRow = Array.from(schemaList?.children ?? []).find((candidate) => candidate.dataset.schemaReferenceKey === referenceKey);
            return invokingRow?.querySelector("button") ?? undefined;
        });
    };
    const proposeInstalledSchemaWorkingDraftName = (schema, proposed) => {
        const updated = proposeSchemaWorkingDraftName(schema, proposed), draft = updated.workingDraft;
        if (!draft?.canonicalSchema || !proposed)
            return updated;
        return { ...updated, workingDraft: { ...draft,
                canonicalSchema: { ...draft.canonicalSchema, contributorName: proposed } } };
    };
    const persistSavedCanonicalResult = (schemaId, canonical, change) => {
        const stored = library.schemas.find(({ id }) => id === schemaId);
        if (!stored)
            throw new Error("The saved schema is unavailable.");
        const projectionSource = library.draft?.id === schemaId ? library.draft : schemaEditorDraft(stored);
        const projection = savedSchemaFromCanonical(projectionSource, canonical);
        const updated = updateSchemaWorkingDraft(proposeInstalledSchemaWorkingDraftName(stored, projection.name), {
            document: projection.document, assignments: projection.assignments, attachedRules: projection.attachedRules,
            parentSchemaId: projection.parentSchemaId, inheritedRuleOverrides: projection.inheritedRuleOverrides,
            documentation: projection.documentation, canonicalSchema: canonical
        }, change);
        library.schemas = library.schemas.map((candidate) => candidate.id === schemaId ? updated : candidate);
        savedCanonicalDocument = canonical;
        persistSchemaLibrary();
    };
    const persistSavedProjectionMetadata = (schemaId, projection, change) => {
        const stored = library.schemas.find(({ id }) => id === schemaId);
        if (!stored)
            throw new Error("The saved schema is unavailable.");
        const canonical = savedCanonicalDocument;
        const updated = updateSchemaWorkingDraft(proposeInstalledSchemaWorkingDraftName(stored, projection.name), {
            document: projection.document, assignments: projection.assignments, attachedRules: projection.attachedRules,
            parentSchemaId: projection.parentSchemaId, inheritedRuleOverrides: projection.inheritedRuleOverrides,
            documentation: projection.documentation, ...(canonical ? { canonicalSchema: { ...canonical, contributorName: projection.name } } : {})
        }, change === "schema name" ? undefined : change);
        if (JSON.stringify(updated) === JSON.stringify(stored))
            return false;
        library.schemas = library.schemas.map((candidate) => candidate.id === schemaId ? updated : candidate);
        if (canonical)
            savedCanonicalDocument = { ...canonical, contributorName: projection.name };
        persistSchemaLibrary();
        return true;
    };
    const savedCompactCanonicalProjection = (schemaId, canonical) => {
        const stored = library.schemas.find(({ id }) => id === schemaId);
        if (!stored)
            return compactSchemaProjection(canonical, { id: canonical.contributorId, name: canonical.contributorName, version: canonical.revision });
        const outer = schemaEditorDraft(stored), projected = savedSchemaFromCanonical({ ...outer, name: canonical.contributorName }, canonical);
        const { canonicalSchema: _canonicalSchema, ...projection } = projected;
        return projection;
    };
    const openSavedSchemaInUnifiedEditor = (schema) => {
        library.draft = schemaEditorDraft(schema);
        savedCanonicalDocument = savedSchemaCanonicalDocument(library.draft, (kind) => `schema:${kind}:${++compactCanonicalIdSequence}`);
        const adapter = { key: `saved:${schema.id}`, label: `${schema.name} · Saved schema working draft`,
            load: () => savedCanonicalDocument, projection: (canonical) => savedCompactCanonicalProjection(schema.id, canonical),
            dispatch: (command) => {
                const result = applyCanonicalCommand(savedCanonicalDocument, command);
                if (result.status === "applied" || result.status === "rebased") {
                    if (command.kind === "select" || command.kind === "view")
                        savedCanonicalDocument = result.document;
                    else
                        persistSavedCanonicalResult(schema.id, result.document, `${command.kind} canonical property`);
                }
                return result;
            },
            stageProjectionCommand: (command) => {
                const result = applyCanonicalCommand(savedCanonicalDocument, command);
                if (result.status === "applied" || result.status === "rebased")
                    savedCanonicalDocument = result.document;
                return result;
            },
            restoreStagedProjection: (canonical) => { savedCanonicalDocument = structuredClone(canonical); },
            persistProjection: (projection, change) => persistSavedProjectionMetadata(schema.id, projection, change),
            settle: () => ports.settleCanonical?.(schema.id) ?? Promise.resolve(), settles: (command) => command.kind !== "select" && command.kind !== "view",
            settlementTarget: "durable Saved Schema Library",
            actions: [{ label: "Publish schema", run: () => saveSchemaButton?.click() }, { label: "Close editor", run: closeCompactCanonicalEditor }] };
        openCompactCanonicalEditor(adapter);
    };
    const activeIndex = () => library.activeIndex();
    const active = () => library.active();
    const serializeChangedSchemaLibrary = (nextSchemas) => library.serialize(nextSchemas);
    const persistSchemaLibrary = () => library.persist();
    const startQueuedSchemaLibraryPersistence = () => {
        if (schemaLibraryPersistenceWorker || !queuedSchemaLibraryPersistence || compactCanonicalSettlementClaims.size)
            return;
        const queuedSchemaId = queuedSchemaLibraryPersistence.schemaId;
        schemaLibraryPersistenceWorker = (async () => {
            let activeRequest;
            try {
                while (lifecycle.isMounted() && queuedSchemaLibraryPersistence) {
                    const request = queuedSchemaLibraryPersistence;
                    activeRequest = request;
                    queuedSchemaLibraryPersistence = undefined;
                    compactCanonicalSettlementPending = true;
                    compactCanonicalSettlementSchemaId = activeRequest.schemaId;
                    schemaEditor?.setAttribute("aria-busy", "true");
                    ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeChangedSchemaLibrary(activeRequest.schemas));
                    ports.changed(activeRequest.schemas);
                    await ports.settleCanonical(activeRequest.schemaId);
                    activeRequest = undefined;
                }
            }
            catch {
                if (ports.blocked?.() && !queuedSchemaLibraryPersistence && activeRequest)
                    queuedSchemaLibraryPersistence = activeRequest;
            }
            finally {
                schemaLibraryPersistenceWorker = undefined;
                if (!queuedSchemaLibraryPersistence)
                    clearCompactCanonicalSettlement(activeRequest?.schemaId ?? queuedSchemaId);
                if (compactCanonicalEditor)
                    renderCompactCanonicalEditor();
                else
                    schemaEditor?.setAttribute("aria-busy", String(Boolean(queuedSchemaLibraryPersistence)));
            }
        })();
    };
    const queueSchemaLibraryPersistence = (schemaId) => {
        if (!ports.settleCanonical) {
            persistSchemaLibrary();
            return;
        }
        queuedSchemaLibraryPersistence = { schemaId, schemas: structuredClone(library.schemas) };
        compactCanonicalSettlementPending = true;
        compactCanonicalSettlementSchemaId = schemaId;
        schemaEditor?.setAttribute("aria-busy", "true");
        void compactCanonicalSettlementBarrier.then((committed) => { if (committed)
            startQueuedSchemaLibraryPersistence(); });
    };
    const persistEditedSchemaIfStored = () => { if (activeIndex() >= 0)
        persistSchemaLibrary(); };
    const replaceActive = (schema) => library.replaceActive(schema);
    const revisionVersion = () => Number(schemaRevisionSelector?.value || active().version);
    const renderSchemaPropertyView = () => {
        const openRuleDisclosures = schemaPropertyTree
            ? Array.from(schemaPropertyTree.querySelectorAll("details[data-attached-rules][open]")) : [];
        for (const disclosure of openRuleDisclosures) {
            const owner = disclosure.closest("[data-schema-property-canonical-path]");
            const canonicalPath = owner?.dataset.schemaPropertyCanonicalPath;
            if (canonicalPath)
                expandedSchemaPropertyRulePaths.add(canonicalPath);
        }
        const activePropertyElement = schemaOwnerDocument?.activeElement, focusedPropertyControl = activePropertyElement && schemaPropertyTree?.contains(activePropertyElement)
            ? activePropertyElement : undefined, previousTreeScroll = schemaPropertyTree?.scrollTop ?? 0, previousFocusLabel = focusedPropertyControl?.getAttribute("aria-label"), previousRuleFocus = focusedPropertyControl?.dataset.ruleId && focusedPropertyControl.dataset.propertyPath && focusedPropertyControl.dataset.schemaRuleAction
            ? { ruleId: focusedPropertyControl.dataset.ruleId, propertyPath: focusedPropertyControl.dataset.propertyPath,
                action: focusedPropertyControl.dataset.schemaRuleAction } : undefined, promotionFocusReturn = localRulePromotionFocusReturn ? { ...localRulePromotionFocusReturn } : undefined;
        for (const dispose of schemaPropertyRowDisposers.splice(0))
            dispose();
        const schema = library.activeSchemaId ? active() : library.draft;
        const editable = schema ? schemaEditorDraft(schema) : undefined, excludedInheritedPaths = new Set(Object.entries(editable?.inheritedRuleOverrides ?? {})
            .filter(([, state]) => state === "disabled").map(([path]) => canonicalRulePropertyPath(path)));
        const rows = editable ? schemaPropertyRows(editable.document, schemaParentDocuments(), excludedInheritedPaths) : [];
        const propertyView = filterAndSortSchemaPropertyRows(rows, schemaPropertyFilter?.value ?? "", (schemaPropertySort?.value || "schema"));
        const compactDocument = compactCanonicalEditor?.load(), compactNodesByPath = new Map(compactDocument
            ? Object.values(compactDocument.nodes).map((node) => [canonicalPropertyPath(compactDocument, node.id), node]) : []);
        if (schemaPropertyResultStatus)
            schemaPropertyResultStatus.textContent = `${propertyView.matchCount} of ${propertyView.totalCount} properties${schemaPropertyFilter?.value.trim() && propertyView.matchCount ? `, ${propertyView.contextCount} context` : ""}`;
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
                item.dataset.schemaPropertyPath = row.displayPath;
                item.dataset.schemaPropertyCanonicalPath = row.canonicalPath;
                const summary = schemaOwnerDocument.createElement("strong"), metadata = schemaOwnerDocument.createElement("span"), selectedRow = row.displayPath === selectedSchemaPropertyPath || row.canonicalPath === normalizedRulePickerPath(selectedSchemaPropertyPath);
                summary.textContent = compactCanonicalEditor ? `${row.displayPath} · ${row.canonicalPath}` : row.displayPath;
                metadata.className = "schema-property-metadata";
                metadata.textContent = `${row.filterContext ? "Filter context · " : ""}${row.origin === "inherited" ? "Inherited" : row.displayPath.endsWith(".*") ? "Every item" : row.schema.propertyOrigin === "manual" ? "Manual" : "Observed"} · type ${row.schema.type ?? "unknown"}`;
                if (selectedRow)
                    item.setAttribute("aria-current", "true");
                const compactNode = compactNodesByPath.get(row.canonicalPath), compactPropertyActions = compactNode && compactCanonicalEditor ? schemaOwnerDocument.createElement("button") : undefined;
                if (compactPropertyActions) {
                    compactPropertyActions.type = "button";
                    compactPropertyActions.textContent = "⋯";
                    compactPropertyActions.setAttribute("aria-label", `Property actions for ${row.canonicalPath}`);
                    listenProperty(compactPropertyActions, "click", () => openCompactCanonicalPropertyActions(row.canonicalPath, compactPropertyActions));
                }
                item.tabIndex = -1;
                listenProperty(summary, "click", () => {
                    selectedSchemaPropertyPath = row.displayPath;
                    if (compactDocument && compactNode)
                        void dispatchCompactCanonicalCommand({ kind: "select", baseRevision: compactDocument.revision, propertyId: compactNode.id });
                    renderSchemaPropertyView();
                });
                item.append(summary, metadata, ...(compactPropertyActions ? [compactPropertyActions] : []));
                if (schema) {
                    const editable = schemaEditorDraft(schema), inheritedOwner = row.origin === "inherited" ? schemaPropertyTypeOwner(editable, row.canonicalPath, library.schemas) : undefined;
                    const typeControls = renderSchemaPropertyTypeEditor({ schema: editable, path: row.canonicalPath, property: row.schema,
                        ...(inheritedOwner ? { inheritedOwner: { name: inheritedOwner.name, open: () => { library.activeSchemaId = inheritedOwner.id; library.draft = schemaEditorDraft(inheritedOwner); renderSchemas(); } } } : {}),
                        confirm: (edit) => {
                            const changed = applySchemaPropertyTypeEdit(schemaEditorDraft(active()), edit);
                            replaceActive(updateSchemaWorkingDraft(active(), { document: changed.document, attachedRules: changed.attachedRules, documentation: changed.documentation }, `Change ${row.canonicalPath} type from ${schemaPropertyTypeLabel(row.schema)} to ${edit.type}`));
                            persistSchemaLibrary();
                            renderSchemas();
                        } });
                    item.append(typeControls.action, typeControls.editor);
                }
                if (selectedRow && compactNode && compactDocument && compactCanonicalEditor && row.origin !== "inherited") {
                    const presence = schemaOwnerDocument.createElement("fieldset"), presenceLegend = schemaOwnerDocument.createElement("legend"), mode = schemaOwnerDocument.createElement("select"), savePresence = schemaOwnerDocument.createElement("button"), predicateControls = schemaOwnerDocument.createElement("section"), presenceDraft = compactCanonicalPresenceDraft?.propertyId === compactNode.id
                        ? compactCanonicalPresenceDraft : undefined;
                    presence.className = "compact-canonical-presence";
                    presence.dataset.compactPropertyId = compactNode.id;
                    presenceLegend.textContent = "Conditional presence";
                    mode.setAttribute("aria-label", `Conditional presence for ${row.canonicalPath}`);
                    mode.append(...["optional", "required", "required-when", "forbidden", "forbidden-when"]
                        .map((value) => { const option = schemaOwnerDocument.createElement("option"); option.textContent = value.replaceAll("-", " "); option.value = value; return option; }));
                    mode.value = presenceDraft?.mode ?? compactNode.presence.mode;
                    const dispatchPresence = (next) => {
                        void dispatchCompactCanonicalCommand({ kind: "set", baseRevision: presenceDraft?.baseRevision ?? compactDocument.revision,
                            propertyId: compactNode.id, patch: { presence: next } });
                    };
                    if (typeof schemaOwnerDocument.getElementById === "function")
                        mountCanonicalPredicateEditor({ host: predicateControls, document: compactDocument,
                            ...(compactNode.presence.condition ? { condition: compactNode.presence.condition } : {}),
                            label: `Nested conditional presence for ${row.canonicalPath}`, saveLabel: "Save conditional presence", excludePropertyId: compactNode.id,
                            onSave: (condition) => { if (mode.value.endsWith("-when"))
                                dispatchPresence({ mode: mode.value, condition }); },
                            ...(compactNode.presence.condition ? { onClear: () => dispatchPresence({ mode: mode.value.startsWith("forbidden") ? "forbidden" : "required" }) } : {}) });
                    predicateControls.hidden = !mode.value.endsWith("-when");
                    listenProperty(mode, "change", () => {
                        predicateControls.hidden = !mode.value.endsWith("-when");
                        compactCanonicalPresenceDraft = { propertyId: compactNode.id, baseRevision: presenceDraft?.baseRevision ?? compactDocument.revision, mode: mode.value };
                        savePresence.hidden = mode.value.endsWith("-when");
                    });
                    savePresence.type = "button";
                    savePresence.textContent = "Save presence";
                    savePresence.hidden = mode.value.endsWith("-when");
                    listenProperty(savePresence, "click", () => { if (!mode.value.endsWith("-when"))
                        dispatchPresence({ mode: mode.value }); });
                    presence.append(presenceLegend, mode, savePresence, predicateControls);
                    item.append(presence);
                    const lifecycle = schemaOwnerDocument.createElement("fieldset"), lifecycleLegend = schemaOwnerDocument.createElement("legend"), renameInput = schemaOwnerDocument.createElement("input"), rename = schemaOwnerDocument.createElement("button"), moveSelect = schemaOwnerDocument.createElement("select"), move = schemaOwnerDocument.createElement("button"), duplicate = schemaOwnerDocument.createElement("button"), expectedInput = schemaOwnerDocument.createElement("input"), saveExpected = schemaOwnerDocument.createElement("button"), reset = schemaOwnerDocument.createElement("button");
                    lifecycleLegend.textContent = "Move and lifecycle";
                    renameInput.name = "propertyName";
                    renameInput.value = compactNode.name;
                    renameInput.setAttribute("aria-label", `Rename ${row.canonicalPath}`);
                    rename.type = "button";
                    rename.textContent = "Rename";
                    listenProperty(rename, "click", () => { void dispatchCompactCanonicalCommand({ kind: "rename", baseRevision: compactDocument.revision, propertyId: compactNode.id, name: renameInput.value }); });
                    moveSelect.name = "moveParent";
                    moveSelect.setAttribute("aria-label", `Move ${row.canonicalPath} under`);
                    const rootOption = schemaOwnerDocument.createElement("option");
                    rootOption.textContent = "Root";
                    rootOption.value = "";
                    moveSelect.append(rootOption, ...Object.values(compactDocument.nodes).filter(({ id, parentId }) => id !== compactNode.id && parentId !== compactNode.id)
                        .map((node) => { const option = schemaOwnerDocument.createElement("option"); option.textContent = node.name; option.value = node.id; return option; }));
                    moveSelect.value = compactNode.parentId ?? "";
                    move.type = "button";
                    move.textContent = "Move";
                    listenProperty(move, "click", () => {
                        void dispatchCompactCanonicalCommand({ kind: "move", baseRevision: compactDocument.revision,
                            propertyId: compactNode.id, ...(moveSelect.value ? { parentId: moveSelect.value } : {}) });
                    });
                    duplicate.type = "button";
                    duplicate.textContent = "Duplicate";
                    listenProperty(duplicate, "click", () => {
                        void dispatchCompactCanonicalCommand({ kind: "duplicate",
                            baseRevision: compactDocument.revision, propertyId: compactNode.id, id: () => ports.createRuleId() });
                    });
                    expectedInput.name = "expectedValue";
                    expectedInput.setAttribute("aria-label", `Expected value for ${row.canonicalPath}`);
                    expectedInput.value = compactNode.expectedValue === undefined ? "" : String(compactNode.expectedValue);
                    saveExpected.type = "button";
                    saveExpected.textContent = "Save contextual contribution";
                    listenProperty(saveExpected, "click", () => {
                        const raw = expectedInput.value.trim();
                        let expectedValue = raw;
                        if (compactNode.type === "number")
                            expectedValue = Number(raw);
                        else if (compactNode.type === "boolean")
                            expectedValue = raw === "true";
                        else if (compactNode.type === "null")
                            expectedValue = null;
                        void dispatchCompactCanonicalCommand({ kind: "set", baseRevision: compactDocument.revision, propertyId: compactNode.id, patch: { expectedValue } });
                    });
                    reset.type = "button";
                    reset.textContent = "Reset to parents";
                    reset.hidden = compactDocument.source?.provenance !== "project-composed-effective";
                    listenProperty(reset, "click", () => { void dispatchCompactCanonicalCommand({ kind: "delete", baseRevision: compactDocument.revision, propertyId: compactNode.id }); });
                    lifecycle.append(lifecycleLegend, renameInput, rename, moveSelect, move, duplicate, expectedInput, saveExpected, reset);
                    item.append(lifecycle);
                }
                if (schema) {
                    const presented = schemaEditorDraft(schema), documentationPath = canonicalDocumentationPath(row.canonicalPath), effective = resolveEffectiveSchemaDocumentation(presented, [...library.schemas.filter(({ id }) => id !== presented.id), presented]), localDocumentation = presented.documentation?.properties?.[documentationPath], propertyDocumentation = effective.properties[documentationPath], parent = presented.parentSchemaId ? library.schemas.find(({ id }) => id === presented.parentSchemaId) : undefined, inheritedDocumentation = parent ? resolveEffectiveSchemaDocumentation(parent, library.schemas).properties[documentationPath] : undefined;
                    const documentationSummary = schemaOwnerDocument.createElement("p");
                    documentationSummary.className = "schema-property-documentation";
                    documentationSummary.textContent = propertyDocumentation
                        ? `${propertyDocumentation.displayName || row.displayPath} · ${propertyDocumentation.description}${propertyDocumentation.comments ? ` · Comments: ${propertyDocumentation.comments}` : ""}${propertyDocumentation.example ? ` · Example: ${String(propertyDocumentation.example.value)}` : ""}${propertyDocumentation.inherited ? ` · inherited from ${propertyDocumentation.origin.name} revision ${propertyDocumentation.origin.version}` : " · local"}`
                        : "No documentation";
                    const editDocumentation = schemaOwnerDocument.createElement("a");
                    editDocumentation.setAttribute("role", "button");
                    editDocumentation.tabIndex = 0;
                    editDocumentation.className = "schema-property-documentation-control";
                    editDocumentation.textContent = localDocumentation || propertyDocumentation ? "Edit documentation" : "Add documentation";
                    editDocumentation.setAttribute("aria-label", `${editDocumentation.textContent} for ${documentationPath}`);
                    const editor = schemaOwnerDocument.createElement("fieldset");
                    editor.className = "schema-property-documentation-editor";
                    editor.hidden = true;
                    const legend = schemaOwnerDocument.createElement("legend");
                    legend.textContent = `Documentation for ${documentationPath}`;
                    const field = (labelText, control) => { const label = schemaOwnerDocument.createElement("label"); label.htmlFor = control.id; label.textContent = labelText; return label; };
                    const suffix = row.displayPath.replace(/[^a-z0-9]+/gi, "-"), displayName = schemaOwnerDocument.createElement("input"), description = schemaOwnerDocument.createElement("textarea"), comments = schemaOwnerDocument.createElement("textarea");
                    displayName.id = `schema-documentation-name-${suffix}`;
                    displayName.value = localDocumentation?.displayName ?? propertyDocumentation?.displayName ?? "";
                    description.id = `schema-documentation-description-${suffix}`;
                    description.value = localDocumentation?.description ?? propertyDocumentation?.description ?? "";
                    comments.id = `schema-documentation-comments-${suffix}`;
                    comments.name = "comments";
                    comments.value = localDocumentation?.comments ?? propertyDocumentation?.comments ?? "";
                    const exampleGroup = schemaOwnerDocument.createElement("fieldset"), exampleLegend = schemaOwnerDocument.createElement("legend");
                    exampleGroup.className = "schema-property-example-editor";
                    exampleLegend.textContent = "Example value";
                    exampleGroup.append(exampleLegend);
                    const exampleName = `schema-documentation-example-${suffix}`, allowedExamples = schemaPropertyExampleChoices(presented, row.canonicalPath, [...library.schemas.filter(({ id }) => id !== presented.id), presented]), exampleType = schemaPropertyExampleInputType(presented, row.canonicalPath, localDocumentation?.example?.value ?? propertyDocumentation?.example?.value ?? allowedExamples[0], [...library.schemas.filter(({ id }) => id !== presented.id), presented]);
                    let exampleDraft = structuredClone(localDocumentation?.example ?? propertyDocumentation?.example), customInitialized = exampleDraft?.selectionMethod === "custom";
                    const assistance = schemaOwnerDocument.createElement("output");
                    assistance.className = "schema-property-example-assistance";
                    const noLabel = schemaOwnerDocument.createElement("label"), noExample = schemaOwnerDocument.createElement("input");
                    noExample.type = "radio";
                    noExample.name = exampleName;
                    noExample.checked = !exampleDraft;
                    noLabel.append(noExample, " No example value");
                    noExample.addEventListener("change", () => { if (noExample.checked) {
                        exampleDraft = undefined;
                        assistance.textContent = "";
                    } });
                    exampleGroup.append(noLabel);
                    for (const allowed of allowedExamples) {
                        const label = schemaOwnerDocument.createElement("label"), radio = schemaOwnerDocument.createElement("input");
                        radio.type = "radio";
                        radio.name = exampleName;
                        radio.value = String(allowed);
                        radio.dataset.exampleSelectionMethod = "allowed value";
                        radio.checked = exampleDraft?.selectionMethod === "allowed value" && Object.is(exampleDraft.value, allowed);
                        radio.addEventListener("change", () => { if (radio.checked) {
                            exampleDraft = { value: structuredClone(allowed), selectionMethod: "allowed value" };
                            assistance.textContent = "";
                        } });
                        label.append(radio, ` ${String(allowed)}`);
                        exampleGroup.append(label);
                    }
                    const customLabel = schemaOwnerDocument.createElement("label"), custom = schemaOwnerDocument.createElement("input"), customInput = schemaOwnerDocument.createElement("input");
                    custom.type = "radio";
                    custom.name = exampleName;
                    custom.dataset.exampleSelectionMethod = "custom";
                    custom.checked = exampleDraft?.selectionMethod === "custom";
                    customLabel.append(custom, " Custom value");
                    customInput.dataset.schemaPropertyExampleInput = documentationPath;
                    customInput.type = exampleType === "number" ? "number" : "text";
                    customInput.value = exampleDraft?.selectionMethod === "custom" ? String(exampleDraft.value) : exampleType === "null" ? "null" : "";
                    customInput.hidden = !custom.checked;
                    customInput.readOnly = exampleType === "null";
                    const refreshExample = () => { const parsed = exampleValueFromInput(customInput.value, exampleType); if (!parsed) {
                        exampleDraft = undefined;
                        assistance.textContent = `Enter a valid ${exampleType} example value`;
                        return;
                    } exampleDraft = parsed; assistance.textContent = schemaPropertyExampleConflicts(parsed, allowedExamples) ? "Example value does not satisfy the effective Allowed values rule" : ""; };
                    custom.addEventListener("change", () => { if (!custom.checked)
                        return; customInput.hidden = false; if (!customInitialized) {
                        customInitialized = true;
                        if (exampleType === "boolean" && !customInput.value)
                            customInput.value = "false";
                        if (exampleType === "null")
                            customInput.value = "null";
                    } refreshExample(); customInput.focus(); });
                    customInput.addEventListener("input", refreshExample);
                    exampleGroup.append(customLabel, customInput, assistance);
                    if (custom.checked)
                        refreshExample();
                    const save = schemaOwnerDocument.createElement("input"), remove = schemaOwnerDocument.createElement("input");
                    save.type = remove.type = "button";
                    save.value = "Save documentation";
                    remove.value = inheritedDocumentation ? "Restore inherited documentation" : "Remove documentation";
                    remove.hidden = !localDocumentation;
                    save.addEventListener("click", () => {
                        if (custom.checked && !exampleDraft) {
                            refreshExample();
                            customInput.focus();
                            return;
                        }
                        const entry = { displayName: displayName.value, description: description.value, ...(comments.value.trim() ? { comments: comments.value.trim() } : {}), ...(exampleDraft ? { example: structuredClone(exampleDraft) } : {}) };
                        const currentLocalDocumentation = schemaEditorDraft(active()).documentation?.properties?.[documentationPath];
                        if ((currentLocalDocumentation ?? localDocumentation) && !entry.displayName.trim() && !entry.description.trim() && !entry.comments && !entry.example) {
                            requestSchemaDocumentationRemoval(documentationPath, save);
                            return;
                        }
                        if (compactCanonicalEditor && compactNode && compactDocument) {
                            const example = entry.example
                                ? { method: entry.example.selectionMethod === "allowed value" ? "allowed-value" : "custom", value: structuredClone(entry.example.value) }
                                : { method: "blank" };
                            void dispatchCompactCanonicalCommand({ kind: "set", baseRevision: compactDocument.revision, propertyId: compactNode.id,
                                patch: { documentation: { displayText: entry.displayName, description: entry.description, comments: entry.comments ?? "", example } } });
                            return;
                        }
                        const documentation = setPropertyDocumentation(schemaEditorDraft(active()).documentation ?? {}, documentationPath, entry);
                        const schemaId = active().id;
                        replaceActive(updateSchemaWorkingDraft(active(), { documentation }, `Document property ${documentationPath}`));
                        queueSchemaLibraryPersistence(schemaId);
                        renderSchemas();
                        schemaEditor?.setAttribute("aria-busy", String(Boolean(ports.settleCanonical)));
                    });
                    remove.addEventListener("click", () => requestSchemaDocumentationRemoval(documentationPath, remove));
                    editDocumentation.addEventListener("click", () => { editor.hidden = false; editDocumentation.setAttribute("aria-expanded", "true"); displayName.focus(); });
                    editDocumentation.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        editDocumentation.click();
                    } });
                    editor.append(legend, field("Display name", displayName), displayName, field("Description", description), description, field("Comments", comments), comments, exampleGroup, save, remove);
                    const section = schemaOwnerDocument.createElement("section");
                    section.className = "schema-property-documentation-section";
                    section.setAttribute("aria-label", `Documentation for ${documentationPath}`);
                    section.append(documentationSummary, editDocumentation, editor);
                    item.append(section);
                }
                const propertyAction = (label, run, ariaLabel = `${label} ${row.canonicalPath}`) => {
                    const button = schemaOwnerDocument.createElement("button");
                    button.type = "button";
                    button.textContent = label;
                    button.setAttribute("aria-label", ariaLabel);
                    if (label === "Add rule")
                        button.className = "schema-property-add-rule";
                    listenProperty(button, "click", () => run(button));
                    item.append(button);
                };
                {
                    propertyAction("View", () => { selectedSchemaPropertyPath = row.canonicalPath.slice(1).replaceAll("/", "."); });
                    const containerAction = editable ? manualPropertyContainerAction(editable.document, row.canonicalPath) : undefined;
                    propertyAction(containerAction?.label ?? "Add child", (button) => openContextualManualPropertyForm(containerAction?.parentPath ?? row.canonicalPath, button), `${containerAction?.label ?? "Add child"} on ${row.canonicalPath}`);
                    propertyAction("Add rule", (button) => openSchemaPropertyRulePicker(row.displayPath, button), `Add rule for ${row.displayPath}`);
                    if (row.schema.type === "array")
                        propertyAction("Add specific index rule", (button) => openSpecificIndexDialog(row.canonicalPath, button));
                    propertyAction("Edit canonical rules", (button) => { openCompactCanonicalRuleEditor(row.displayPath, button); }, `Edit canonical rules for ${row.displayPath}`);
                    propertyAction("Copy to another schema", (button) => openSchemaPropertyCopyReview(row.canonicalPath, button), `Copy ${row.canonicalPath} to another schema`);
                    if (row.origin === "inherited")
                        propertyAction("Exclude inherited property", () => {
                            const current = active(), draft = schemaEditorDraft(current);
                            replaceActive(updateSchemaWorkingDraft(current, { inheritedRuleOverrides: { ...(draft.inheritedRuleOverrides ?? {}), [row.canonicalPath]: "disabled" } }, `Exclude inherited property ${row.canonicalPath}`));
                            persistSchemaLibrary();
                            renderSchemas();
                            if (schemaPropertyRemovalFeedback)
                                schemaPropertyRemovalFeedback.textContent = `Excluded inherited property ${row.canonicalPath} locally; the parent schema is unchanged.`;
                        }, `Exclude inherited property ${row.canonicalPath}`);
                    else
                        propertyAction("Remove property", (button) => requestSchemaPropertyRemoval(row.canonicalPath, button), `Remove property ${row.canonicalPath}`);
                    propertyAction("Remove documentation", (button) => requestSchemaDocumentationRemoval(row.canonicalPath, button));
                    propertyAction(expandedSchemaPropertyRulePaths.has(row.canonicalPath) ? "Hide rules" : "Show rules", () => {
                        if (expandedSchemaPropertyRulePaths.has(row.canonicalPath))
                            expandedSchemaPropertyRulePaths.delete(row.canonicalPath);
                        else
                            expandedSchemaPropertyRulePaths.add(row.canonicalPath);
                        renderSchemaPropertyView();
                    });
                }
                const attachedRules = (schema?.workingDraft?.attachedRules ?? schema?.attachedRules ?? [])
                    .filter(({ propertyPath }) => normalizedRulePickerPath(propertyPath ?? "") === row.canonicalPath);
                const disclosure = schemaOwnerDocument.createElement("details"), disclosureSummary = schemaOwnerDocument.createElement("summary");
                disclosure.dataset.attachedRules = "true";
                disclosure.open = expandedSchemaPropertyRulePaths.has(row.canonicalPath);
                disclosureSummary.textContent = `View attached rules (${attachedRules.length})`;
                const activeRuleCount = schemaOwnerDocument.createElement("span");
                activeRuleCount.className = "schema-property-active-rule-count";
                activeRuleCount.textContent = ` (${attachedRules.filter(({ enabled }) => enabled !== false).length} active rules)`;
                listenProperty(disclosure, "toggle", () => {
                    if (disclosure.open)
                        expandedSchemaPropertyRulePaths.add(row.canonicalPath);
                    else
                        expandedSchemaPropertyRulePaths.delete(row.canonicalPath);
                });
                disclosure.append(disclosureSummary, activeRuleCount);
                if (!attachedRules.length)
                    disclosure.append("No rules attached to this property.");
                for (const attached of attachedRules) {
                    const attachedRow = schemaOwnerDocument.createElement("div");
                    attachedRow.className = "schema-attached-rule";
                    attachedRow.dataset.ruleId = attached.id;
                    attachedRow.dataset.propertyPath = row.canonicalPath;
                    attachedRow.tabIndex = -1;
                    attachedRow.textContent = `${attached.id} v${attached.version} · ${attached.operator ?? "rule"} · ${attached.enabled === false ? "disabled" : "active"} `;
                    const attachedAction = (label, run) => {
                        const button = schemaOwnerDocument.createElement("button");
                        button.type = "button";
                        button.textContent = label;
                        button.dataset.ruleId = attached.id;
                        button.dataset.propertyPath = row.canonicalPath;
                        button.dataset.schemaRuleAction = label;
                        listenProperty(button, "click", () => run(button));
                        attachedRow.append(button);
                    };
                    attachedAction("Edit", (button) => { openAttachedSchemaRuleEditor(schema.id, attached.id, row.displayPath, button); });
                    attachedRow.lastElementChild?.classList.add("schema-attached-rule-edit");
                    attachedAction(attached.enabled === false ? "Re-enable" : "Disable", () => {
                        if (schema)
                            updateAttachedRule(schema.id, attached.id, attached.enabled === false);
                    });
                    attachedAction("Remove", () => {
                        if (!schema)
                            return;
                        library.schemas = library.schemas.map((candidate) => candidate.id !== schema.id ? candidate : {
                            ...candidate, attachedRules: (candidate.attachedRules ?? []).filter((rule) => rule.id !== attached.id),
                            ...(candidate.workingDraft ? { workingDraft: { ...candidate.workingDraft,
                                    attachedRules: (candidate.workingDraft.attachedRules ?? []).filter((rule) => rule.id !== attached.id) } } : {}),
                        });
                        persistSchemaAndRuleLibraries();
                        renderSchemas();
                    });
                    if (!reusableSchemaRules.some(({ id }) => id === attached.id)) {
                        attachedAction("Promote to reusable rule", () => { openLocalRulePromotionReview(row.canonicalPath, attached.id); });
                        const promotionAction = attachedRow.lastElementChild;
                        promotionAction?.classList.add("local-rule-promotion-action");
                        if (promotionAction)
                            listenProperty(promotionAction, "focus", () => {
                                localRulePromotionFocusedPosition = {
                                    propertyPath: row.canonicalPath, ruleId: attached.id, detailScroll: schemaDetail?.scrollTop ?? 0
                                };
                            });
                    }
                    const canonicalRule = compactNode?.rules.find(({ id }) => id === attached.id);
                    if (compactCanonicalEditor && compactDocument && compactNode && canonicalRule && typeof schemaOwnerDocument.getElementById === "function") {
                        const predicateEditor = schemaOwnerDocument.createElement("section");
                        mountCanonicalPredicateEditor({ host: predicateEditor, document: compactDocument,
                            ...(canonicalRule.condition ? { condition: canonicalRule.condition } : {}), label: `Nested rule predicate for ${attached.id}`,
                            saveLabel: "Save nested rule predicate", onSave: (condition) => {
                                const latest = compactCanonicalEditor?.load(), latestNode = latest?.nodes[compactNode.id];
                                if (!latest || !latestNode)
                                    return;
                                void dispatchCompactCanonicalCommand({ kind: "set", baseRevision: latest.revision, propertyId: latestNode.id,
                                    patch: { rules: latestNode.rules.map((candidate) => candidate.id === canonicalRule.id ? { ...candidate, condition } : candidate) } });
                            },
                            ...(canonicalRule.condition ? { onClear: () => {
                                    const latest = compactCanonicalEditor?.load(), latestNode = latest?.nodes[compactNode.id];
                                    if (!latest || !latestNode)
                                        return;
                                    void dispatchCompactCanonicalCommand({ kind: "set", baseRevision: latest.revision, propertyId: latestNode.id,
                                        patch: { rules: latestNode.rules.map((candidate) => {
                                                if (candidate.id !== canonicalRule.id)
                                                    return candidate;
                                                const { condition: _condition, ...withoutCondition } = candidate;
                                                return withoutCondition;
                                            }) } });
                                } } : {}) });
                        attachedRow.append(predicateEditor);
                    }
                    disclosure.append(attachedRow);
                }
                item.append(disclosure);
                return [item];
            });
            const itemByPath = new Map(propertyView.rows.map((row, index) => [row.displayPath, items[index]])), roots = [];
            propertyView.rows.forEach((row) => {
                const item = itemByPath.get(row.displayPath);
                item.setAttribute("role", "treeitem");
                item.setAttribute("aria-level", String(Math.max(1, row.displayPath.split(".").length)));
                const parentPath = propertyView.rows.map(({ displayPath }) => displayPath).filter((candidate) => candidate !== row.displayPath && row.displayPath.startsWith(`${candidate}.`))
                    .sort((left, right) => right.length - left.length)[0], parent = parentPath ? itemByPath.get(parentPath) : undefined;
                if (!parent) {
                    roots.push(item);
                    return;
                }
                let children = Array.from(parent.children).find((child) => child.tagName === "UL" && child.classList.contains("schema-property-children"));
                if (!children) {
                    children = schemaOwnerDocument.createElement("ul");
                    children.className = "schema-property-children";
                    parent.append(children);
                }
                children.append(item);
            });
            schemaPropertyTree.replaceChildren(...roots);
            schemaPropertyTree.scrollTop = previousTreeScroll;
            if (previousFocusLabel)
                Array.from(schemaPropertyTree.querySelectorAll("[aria-label]"))
                    .find((control) => control.getAttribute("aria-label") === previousFocusLabel)?.focus({ preventScroll: true });
            else if (previousRuleFocus)
                Array.from(schemaPropertyTree.querySelectorAll("button[data-rule-id]"))
                    .find(({ dataset }) => dataset.ruleId === previousRuleFocus.ruleId && dataset.propertyPath === previousRuleFocus.propertyPath
                    && dataset.schemaRuleAction === previousRuleFocus.action)?.focus({ preventScroll: true });
            else if (promotionFocusReturn && !schemaOwnerDocument?.querySelector("#local-rule-promotion-review")?.open)
                Array.from(schemaPropertyTree.querySelectorAll("button[data-rule-id]"))
                    .find(({ dataset }) => dataset.ruleId === promotionFocusReturn.ruleId
                    && dataset.propertyPath === promotionFocusReturn.propertyPath)?.focus({ preventScroll: true });
            const copyPosition = pendingSchemaPropertyCopyPosition;
            if (copyPosition && copyPosition.schemaId === library.activeSchemaId) {
                schemaPropertyTree.querySelector(`button[aria-label="Copy ${copyPosition.path} to another schema"]`)?.focus({ preventScroll: true });
                schemaEditor && (schemaEditor.scrollTop = copyPosition.editorScroll);
                schemaPropertyTree.scrollTop = copyPosition.treeScroll;
            }
        }
        if (addSchemaPropertyButton)
            addSchemaPropertyButton.disabled = !schema;
    };
    function renderSchemaDraft() {
        const schema = library.activeSchemaId ? active() : library.draft;
        const draft = schema?.workingDraft;
        const presented = schema ? schemaEditorDraft(schema) : undefined;
        if (schemaEditor)
            schemaEditor.hidden = !schema;
        if (schemaDetail)
            schemaDetail.hidden = false;
        if (schemaDetailEmpty)
            schemaDetailEmpty.hidden = Boolean(schema);
        if (schemaEditorName)
            schemaEditorName.value = draft?.name ?? schema?.name ?? "";
        if (schemaEditorStatus) {
            const pendingCount = schema?.workingDraft?.pendingChanges.length ?? 0;
            const lifecycleStatus = schema?.published === false
                ? `Unpublished new schema draft · ${pendingCount} pending changes`
                : schema?.workingDraft ? `Working draft based on revision ${schema.version} · ${pendingCount} pending changes`
                    : schema ? `Current revision ${schema.version} · no working draft` : "Unsaved new schema";
            const compactCanonicalRevision = compactCanonicalEditor?.load().revision;
            schemaEditorStatus.textContent = compactCanonicalEditor && compactCanonicalRevision !== undefined
                ? `${lifecycleStatus} · ${compactCanonicalEditor.label} · Schema revision ${compactCanonicalRevision}`
                : lifecycleStatus;
        }
        if (schemaEditorDescription)
            schemaEditorDescription.value = draft?.documentation?.description
                ?? schema?.documentation?.description ?? "";
        if (schemaDescriptionOrigin)
            schemaDescriptionOrigin.textContent = draft?.documentation?.description
                ? "Working draft" : schema?.documentation?.description ? `Revision ${schema.version}` : "No description";
        if (schemaEditorTarget)
            schemaEditorTarget.value = draft?.assignments[0]?.target ?? schema?.assignments[0]?.target ?? "payload";
        if (schemaOnlyDeclaredProperties && presented)
            schemaOnlyDeclaredProperties.checked = presented.document.additionalProperties === false;
        if (schemaEditorParent && presented && schemaOwnerDocument) {
            const parents = library.schemas.filter(({ id }) => id !== presented.id);
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
        const parent = presented?.parentSchemaId ? library.schemas.find(({ id }) => id === presented.parentSchemaId) : undefined;
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
                    if (!library.activeSchemaId)
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
        if (schema && presented) {
            const candidates = [...library.schemas.filter(({ id }) => id !== schema.id), presented];
            const inheritanceError = schemaInheritanceError(presented, candidates) ?? schemaInheritanceConflict(presented, candidates);
            const rename = inspectSchemaRename(schema, library.schemas, schemaEditorName?.value ?? presented.name);
            const hasProperties = Object.keys(presented.document.properties ?? {}).length > 0;
            const ready = rename.ready && hasProperties && !inheritanceError;
            if (saveSchemaButton) {
                saveSchemaButton.disabled = !ready;
                saveSchemaButton.textContent = schema.published === false ? "Publish schema" : "Publish revision";
            }
            if (saveSchemaReason)
                saveSchemaReason.textContent = !rename.ready ? rename.assistance
                    : !hasProperties ? "Add at least one property" : inheritanceError ?? "Ready to save";
        }
        else if (saveSchemaButton)
            saveSchemaButton.disabled = true;
        const pendingChanges = draft?.pendingChanges ?? [];
        if (buildSpecificationButton) {
            buildSpecificationButton.hidden = !draft;
            buildSpecificationButton.onclick = schema && draft ? () => openSchemaSpecification(schema, "working-draft", buildSpecificationButton) : null;
        }
        const historyVersions = schema ? schemaRevisionChoices(schema) : [];
        if (schemaRevisionSelector && schemaOwnerDocument) {
            const selectedRevision = Number(schemaRevisionSelector.value);
            schemaRevisionSelector.replaceChildren(...historyVersions.map((version) => {
                const option = schemaOwnerDocument.createElement("option");
                option.value = String(version);
                option.textContent = `Revision ${version}`;
                return option;
            }));
            schemaRevisionSelector.value = String(historyVersions.includes(selectedRevision) ? selectedRevision : historyVersions[0] ?? "");
        }
        if (duplicateSchemaRevisionButton)
            duplicateSchemaRevisionButton.disabled = historyVersions.length === 0;
        if (restoreSchemaRevisionButton)
            restoreSchemaRevisionButton.disabled = historyVersions.length === 0;
        if (buildHistoricalSpecificationButton) {
            buildHistoricalSpecificationButton.disabled = historyVersions.length === 0;
            buildHistoricalSpecificationButton.onclick = schema && historyVersions.length
                ? () => openSchemaSpecification(schema, `historical:${revisionVersion()}`, buildHistoricalSpecificationButton) : null;
        }
        if (schemaCloseReviewSummary)
            schemaCloseReviewSummary.textContent = draft
                ? `${pendingChanges.length} pending change${pendingChanges.length === 1 ? "" : "s"}` : "No pending changes";
        if (confirmSchemaRevisionButton && schema)
            confirmSchemaRevisionButton.textContent = schema.published === false
                ? "Publish revision 1" : `Publish revision ${schema.version + 1}`;
        if (schemaRevisionComparison && schema) {
            const version = revisionVersion(), historical = schemaRevision(schema, version);
            const historicalProperties = Object.keys(historical?.document.properties ?? {}).length;
            const currentProperties = Object.keys(schema.document.properties ?? {}).length;
            schemaRevisionComparison.textContent = `Revision ${version} compared with current revision ${schema.version}. ${historicalProperties} historical properties; ${currentProperties} current properties.`;
        }
        if (schemaEditorNameAssistance && schema)
            schemaEditorNameAssistance.textContent = inspectSchemaRename(schema, library.schemas, schemaEditorName?.value ?? draft?.name ?? schema.name).assistance;
        renderSchemaPropertyView();
    }
    function hydrateProjectForSchemas(activeProjectId) {
        const operation = lifecycle.generation();
        if (schemaResult)
            schemaResult.textContent = "Loading active project schema contributors from durable storage…";
        return activeSchemaProjectHydration.run(activeProjectId, () => ports.ensureProjectSchemaContributors(activeProjectId, schemaContributorRoute)
            .then(({ name }) => {
            if (!lifecycle.isMounted() || operation !== lifecycle.generation() || ports.activeProjectId() !== activeProjectId)
                return;
            hydratedSchemaProjectId = activeProjectId;
            relationshipTreeController.invalidateProject();
            renderSchemas();
            if (schemaResult)
                schemaResult.textContent = `Loaded schema contributors for ${name}.`;
        })
            .catch((error) => {
            if (lifecycle.isMounted() && operation === lifecycle.generation() && ports.activeProjectId() === activeProjectId && schemaResult) {
                schemaResult.textContent = `Schema contributors are unavailable. ${error instanceof Error ? error.message : String(error)}`;
            }
        }));
    }
    function hydrateActiveProjectForSchemas() {
        const activeProjectId = ports.activeProjectId();
        return activeProjectId ? hydrateProjectForSchemas(activeProjectId) : undefined;
    }
    const renderSchemas = () => {
        if (!lifecycle.isMounted())
            return;
        relationshipTreeController.clearRows();
        const relationship = ports.relationshipTree(library.schemas), projectId = relationship.projectId;
        const filtered = relationshipTreeController.project(projectId, relationship.nodes);
        const rows = [], document = schemaList?.ownerDocument;
        const savedRow = (node, level) => {
            const schema = library.schemas.find(({ id }) => `saved:${id}` === node.targetKey);
            if (!schema || !document)
                return;
            const item = document.createElement("li"), revise = document.createElement("button"), duplicate = document.createElement("button"), adopt = document.createElement("button"), build = document.createElement("button"), exportCurrent = document.createElement("button"), reportMissing = document.createElement("button"), remove = document.createElement("button");
            const pending = schema.workingDraft?.pendingChanges.length ?? 0, history = schemaRevisionChoices(schema).length;
            item.dataset.schemaEntryKey = node.targetKey;
            item.dataset.schemaReferenceKey = node.key;
            item.dataset.schemaRole = node.role;
            item.setAttribute("role", "treeitem");
            item.setAttribute("aria-level", String(level));
            item.setAttribute("aria-selected", String(library.activeSchemaId === schema.id));
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
            listen(revise, "click", () => {
                editorRoute.open(revise, node.key);
                library.activeSchemaId = schema.id;
                library.draft = structuredClone(schema);
                renderSchemas();
                openSavedSchemaInUnifiedEditor(schema);
            });
            listen(duplicate, "click", () => { library.schemas = [...library.schemas, duplicateSchemaRevision(schema, schema.version, library.schemas)]; persistSchemaLibrary(); renderSchemas(); });
            listen(adopt, "click", () => requestSavedSchemaAdoption(schema, adopt));
            listen(build, "click", () => openSchemaSpecification(schema, `published:${schema.version}`, build));
            listen(exportCurrent, "click", () => openSchemaExportChoices(exportCurrent, schema));
            listen(reportMissing, "click", () => ports.reportMissingSchemaEvent(schema.id));
            listen(remove, "click", () => {
                const children = library.schemas.filter((candidate) => candidate.parentSchemaId === schema.id);
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
            item.setAttribute("aria-selected", "false");
            item.style.setProperty("--schema-tree-level", String(level));
            if (node.targetKey) {
                const open = document.createElement("button"), studio = document.createElement("button");
                item.dataset.schemaEntryKey = node.targetKey;
                item.dataset.schemaRole = node.role;
                item.textContent = `${node.name} · role ${node.role} · path ${node.relationshipPath}. `;
                item.setAttribute("aria-selected", String(editorRoute.invokingReference() === node.key));
                open.type = studio.type = "button";
                open.textContent = "Open schema";
                studio.textContent = "Open schema in Specification Studio";
                open.setAttribute("aria-label", `Open ${node.name}; ${node.relationshipPath}`);
                studio.setAttribute("aria-label", `Open ${node.name} in Specification Studio; ${node.relationshipPath}`);
                listen(open, "click", () => {
                    editorRoute.open(open, node.key);
                    const retainedScroll = compactCanonicalEditor?.key === node.targetKey ? schemaDetail?.scrollTop : undefined;
                    openContributorInUnifiedEditor(node.targetKey);
                    if (schemaDetail && retainedScroll !== undefined)
                        schemaDetail.scrollTop = retainedScroll;
                    renderSchemas();
                });
                listen(studio, "click", () => ports.openContributorInStudio(node.targetKey));
                item.append(open, studio);
            }
            else {
                const toggle = document.createElement("button"), expanded = node.expanded || relationshipTreeController.isExpanded(node.key);
                item.dataset.schemaGroup = node.name;
                item.setAttribute("aria-expanded", String(expanded));
                toggle.type = "button";
                toggle.textContent = node.name;
                listen(toggle, "click", () => { relationshipTreeController.toggle(node.key); renderSchemas(); });
                item.append(toggle);
            }
            rows.push(item);
            const expanded = node.expanded || relationshipTreeController.isExpanded(node.key);
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
        renderSchemaDraft();
        renderSchemaAssignments();
    };
    const updateSchemaTreeView = () => { relationshipTreeController.update(); renderSchemas(); };
    const persistSchemaTreeScroll = () => relationshipTreeController.persistScroll();
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
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = active();
        replaceActive(proposeInstalledSchemaWorkingDraftName(schema, schemaEditorName?.value ?? schema.name));
        persistEditedSchemaIfStored();
        const presented = schemaEditorDraft(active()), candidate = library.schemas.find(({ id }) => id === presented.id) ?? presented, rename = inspectSchemaRename(candidate, library.schemas, presented.name), hasProperties = Object.keys(presented.document.properties ?? {}).length > 0, inheritanceError = schemaInheritanceError(presented, library.schemas) ?? schemaInheritanceConflict(presented, library.schemas);
        if (schemaEditorNameAssistance)
            schemaEditorNameAssistance.textContent = rename.assistance;
        if (saveSchemaButton)
            saveSchemaButton.disabled = !rename.ready || !hasProperties || Boolean(inheritanceError);
        if (saveSchemaReason)
            saveSchemaReason.textContent = !rename.ready ? rename.assistance : !hasProperties ? "Add at least one property" : inheritanceError ?? "Ready to save";
    };
    const updateSchemaEditorName = () => {
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = active(), name = schemaEditorName?.value ?? schema.name;
        if (compactCanonicalEditor) {
            const projection = { ...schemaEditorDraft(schema), name };
            library.draft = structuredClone(projection);
            const rename = inspectSchemaRename(schema, library.schemas, name), hasProperties = Object.keys(projection.document.properties ?? {}).length > 0, inheritanceError = schemaInheritanceError(projection, library.schemas) ?? schemaInheritanceConflict(projection, library.schemas);
            if (schemaEditorNameAssistance)
                schemaEditorNameAssistance.textContent = rename.assistance;
            if (saveSchemaButton)
                saveSchemaButton.disabled = !rename.ready || !hasProperties || Boolean(inheritanceError);
            if (saveSchemaReason)
                saveSchemaReason.textContent = !rename.ready ? rename.assistance : !hasProperties
                    ? "Add at least one property" : inheritanceError ?? "Ready to save";
            void beginCompactCanonicalProjectionPersistence(compactCanonicalEditor, projection, "schema name");
            return;
        }
        persistSchemaEditorDraft();
    };
    const saveSchemaDescription = () => {
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = active();
        const documentation = updateSchemaDescription(schema.workingDraft?.documentation ?? schema.documentation ?? {}, schemaEditorDescription?.value ?? "");
        replaceActive(updateSchemaWorkingDraft(schema, { documentation }, "Update schema description"));
        const tracksCanonicalSettlement = Boolean(compactCanonicalEditor && ports.settleCanonical);
        const settlement = tracksCanonicalSettlement ? beginCompactCanonicalSettlement(schema.id) : undefined;
        if (tracksCanonicalSettlement) {
            compactCanonicalSettlementPending = true;
            compactCanonicalSettlementSchemaId = schema.id;
        }
        persistEditedSchemaIfStored();
        renderSchemas();
        if (tracksCanonicalSettlement)
            void ports.settleCanonical(schema.id).then(() => {
                if (!lifecycle.isMounted())
                    return;
                clearCompactCanonicalSettlement(schema.id, settlement);
                if (compactCanonicalEditor)
                    renderCompactCanonicalEditor();
            }, () => { });
    };
    const updateSchemaTarget = () => {
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = active();
        const assignments = (schema.workingDraft?.assignments ?? schema.assignments)
            .map((assignment) => ({ ...assignment, target: (schemaEditorTarget?.value === "raw input" ? "raw input" : "payload") }));
        replaceActive(updateSchemaWorkingDraft(schema, { assignments }, "Update validation target"));
        persistEditedSchemaIfStored();
        renderSchemas();
    };
    const changeSchemaParent = () => {
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = active(), draft = schemaEditorDraft(schema);
        const changed = withSchemaParent(draft, schemaEditorParent?.value || undefined);
        replaceActive(updateSchemaWorkingDraft(schema, { parentSchemaId: changed.parentSchemaId }, "Change parent schema"));
        persistEditedSchemaIfStored();
        renderSchemas();
    };
    const changeOnlyDeclaredProperties = () => {
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = active(), draft = schemaEditorDraft(schema);
        const { additionalProperties: _previous, ...document } = draft.document;
        replaceActive(updateSchemaWorkingDraft(schema, { document: schemaOnlyDeclaredProperties?.checked
                ? { ...document, additionalProperties: false } : document }, "Change additional-property policy"));
        const tracksCanonicalSettlement = Boolean(compactCanonicalEditor && ports.settleCanonical);
        const settlement = tracksCanonicalSettlement ? beginCompactCanonicalSettlement(schema.id) : undefined;
        if (tracksCanonicalSettlement) {
            compactCanonicalSettlementPending = true;
            compactCanonicalSettlementSchemaId = schema.id;
        }
        persistEditedSchemaIfStored();
        renderSchemas();
        if (tracksCanonicalSettlement) {
            if (saveSchemaButton)
                saveSchemaButton.disabled = true;
            void ports.settleCanonical(schema.id).then(() => {
                if (!lifecycle.isMounted())
                    return;
                clearCompactCanonicalSettlement(schema.id, settlement);
                renderSchemas();
            }, () => { });
        }
    };
    const openSchemaRevisionReview = () => {
        renderSchemaDraft();
        const draft = library.draft ?? (library.activeSchemaId ? active() : undefined);
        if (!draft)
            return;
        const existing = library.schemas.find(({ id }) => id === draft.id), persisted = existing ? schemaEditorDraft(existing) : draft;
        const pending = persisted.workingDraft?.pendingChanges.filter((change) => !change.startsWith("Rename schema from ")).join("; ") ?? "";
        const proposedName = persisted.workingDraft?.name ?? persisted.name;
        const rename = existing && proposedName !== existing.name ? ` Rename schema from ${existing.name} to ${proposedName}.` : "";
        if (schemaRevisionReviewSummary)
            schemaRevisionReviewSummary.textContent = existing?.published === false
                ? `${draft.name} draft will be published as current revision 1.`
                : existing
                    ? `${existing.name} working draft will be compared with current revision ${existing.version}; confirmation publishes revision ${existing.version + 1}.${rename}${pending ? ` Pending changes: ${pending}.` : ""}`
                    : `${draft.name} will be published as current revision 1.`;
        if (schemaRevisionReview)
            schemaRevisionReview.hidden = false;
        schemaRevisionReview?.showModal();
    };
    function refreshCurrentLiveAfterSchemaPublication() {
        return ports.revalidateCurrentLive?.(structuredClone(library.schemas), structuredClone(manualSchemaOverrides)) ?? 0;
    }
    const publishActiveSchema = (closeEditor = false) => {
        const transient = activeIndex() < 0, current = active(), presented = schemaEditorDraft(current);
        const publishable = transient ? { ...current, id: createSchema(presented.name.trim(), 1, presented.document).id, published: false } : current;
        const published = publishSchemaWorkingDraft(publishable);
        if (transient) {
            library.schemas = [...library.schemas, published];
            library.activeSchemaId = published.id;
            library.draft = structuredClone(published);
        }
        else
            replaceActive(published);
        let ruleLibraryChanged = false;
        for (const rule of published.attachedRules ?? []) {
            if (!rule.id.startsWith("rule:") || reusableSchemaRules.some(({ id }) => id === rule.id))
                continue;
            reusableSchemaRules = [...reusableSchemaRules, {
                    id: rule.id, name: rule.name ?? rule.id, kind: rule.operator ?? "required", version: rule.version,
                    enabled: rule.enabled !== false, ...(rule.operator ? { operator: rule.operator } : {}),
                    ...(rule.parameters ? { parameters: rule.parameters } : {}), ...(rule.severity ? { severity: rule.severity } : {}),
                    ...(rule.message ? { message: rule.message } : {}), attachments: [published.id],
                }];
            ruleLibraryChanged = true;
        }
        if (ruleLibraryChanged)
            persistSchemaAndRuleLibraries();
        else
            persistSchemaLibrary();
        schemaRevisionReview?.close();
        if (schemaRevisionReview)
            schemaRevisionReview.hidden = true;
        if (closeEditor) {
            closeCompactCanonicalEditor();
            library.activeSchemaId = undefined;
            library.draft = undefined;
        }
        renderSchemas();
        const revalidated = refreshCurrentLiveAfterSchemaPublication();
        if (schemaResult)
            schemaResult.textContent = `Published ${published.name} revision ${published.version}. Revalidated ${revalidated} current Live events.`;
        return published;
    };
    const confirmSchemaRevision = () => {
        if (pendingSchemaRestoration) {
            const pending = pendingSchemaRestoration;
            pendingSchemaRestoration = undefined;
            if (active().id !== pending.schemaId)
                throw new Error("The schema selected for restoration is no longer active.");
            replaceActive(restoreSchemaRevisionDraft(active(), pending.version));
            persistSchemaLibrary();
            schemaRevisionReview?.close();
            if (schemaRevisionReview)
                schemaRevisionReview.hidden = true;
            renderSchemas();
            return;
        }
        publishActiveSchema(true);
    };
    const cancelSchemaRevision = () => {
        pendingSchemaRestoration = undefined;
        schemaRevisionReview?.close();
        if (schemaRevisionReview)
            schemaRevisionReview.hidden = true;
    };
    const discardSchemaDraft = () => {
        library.draft = undefined;
        library.activeSchemaId = undefined;
        schemaCloseReview?.close();
        if (schemaCloseReview)
            schemaCloseReview.hidden = true;
        renderSchemas();
    };
    const keepEditingSchema = () => { schemaCloseReview?.close(); schemaEditorName?.focus(); };
    const closeSchemaEditor = () => {
        if (!library.draft && !library.activeSchemaId)
            return;
        library.activeSchemaId = undefined;
        library.draft = undefined;
        closeCompactCanonicalEditor();
        renderSchemas();
        if (schemaResult)
            schemaResult.textContent = "Working draft retained without publishing.";
    };
    const saveAndCloseSchema = () => { openSchemaRevisionReview(); };
    const saveSchemaFromCloseReview = () => {
        schemaCloseReview?.close();
        if (schemaCloseReview)
            schemaCloseReview.hidden = true;
        openSchemaRevisionReview();
    };
    const discardWorkingSchemaDraft = () => {
        if (activeIndex() >= 0) {
            replaceActive(discardSchemaWorkingDraft(active()));
            persistSchemaLibrary();
        }
        library.activeSchemaId = undefined;
        library.draft = undefined;
        schemaCloseReview?.close();
        if (schemaCloseReview)
            schemaCloseReview.hidden = true;
        renderSchemas();
    };
    const renderSchemaRevisionComparison = () => renderSchemaDraft();
    const duplicateSelectedSchemaRevision = () => {
        const duplicate = duplicateSchemaRevision(active(), revisionVersion(), library.schemas);
        library.schemas = [...library.schemas, duplicate];
        library.activeSchemaId = duplicate.id;
        library.draft = structuredClone(duplicate);
        persistSchemaLibrary();
        renderSchemas();
    };
    const restoreSelectedSchemaRevision = () => {
        const schema = active(), version = revisionVersion();
        pendingSchemaRestoration = { schemaId: schema.id, version };
        if (schemaRevisionReviewSummary)
            schemaRevisionReviewSummary.textContent =
                `${schema.name} revision ${version} will replace ${schema.workingDraft?.pendingChanges.length ?? 0} pending draft changes and create a working draft. Current revision ${schema.version} remains active; publication will create revision ${schema.version + 1}.`;
        if (schemaRevisionReview)
            schemaRevisionReview.hidden = false;
        schemaRevisionReview?.showModal();
    };
    const clearSchemaPropertyViewFilter = () => {
        if (schemaPropertyFilter)
            schemaPropertyFilter.value = "";
        renderSchemaPropertyView();
        schemaPropertyFilter?.focus();
    };
    function showSchemaSubview(subview) {
        for (const tab of schemaSubviews) {
            const target = tab.dataset.schemaSubview ?? tab.getAttribute("aria-controls");
            const selected = target === subview;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
        }
        for (const panel of schemaPanels)
            panel.hidden = panel.id !== subview;
        if (liveEventQuery)
            liveEventQuery.hidden = subview !== "schema-master";
    }
    const activateSchemaSubview = (event) => {
        const tab = event.currentTarget;
        const subview = tab.dataset.schemaSubview ?? tab.getAttribute("aria-controls") ?? undefined;
        if (subview)
            showSchemaSubview(subview);
    };
    function applySchemaPropertyRemoval(path) {
        const schema = active();
        const draft = schema.workingDraft;
        if (!draft)
            return;
        const priorPaths = Array.from(schemaPropertyTree?.querySelectorAll("[data-schema-property-canonical-path]") ?? [], ({ dataset }) => dataset.schemaPropertyCanonicalPath ?? ""), priorIndex = Math.max(0, priorPaths.indexOf(path));
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
        const remaining = Array.from(schemaPropertyTree?.querySelectorAll("[data-schema-property-canonical-path]") ?? []), focusRow = remaining[Math.min(priorIndex, remaining.length - 1)];
        if (focusRow) {
            selectedSchemaPropertyPath = focusRow.dataset.schemaPropertyPath ?? focusRow.dataset.schemaPropertyCanonicalPath ?? "";
            renderSchemaPropertyView();
            const selected = schemaPropertyTree?.querySelector(`[data-schema-property-canonical-path="${CSS.escape(focusRow.dataset.schemaPropertyCanonicalPath ?? "")}"]`);
            (selected?.querySelector("button, a, input, select, textarea") ?? selected)?.focus({ preventScroll: true });
        }
        else
            addSchemaPropertyButton?.focus({ preventScroll: true });
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
        if (schemaPropertyRemovalSummary) {
            const affectedRules = inspection.affectedRuleAttachments
                .map((rule) => `${rule.name ?? rule.id} at ${rule.propertyPath ?? inspection.propertyPath}`).join(", ") || "none";
            schemaPropertyRemovalSummary.textContent = `${inspection.propertyPath} contains ${inspection.descendants.length} descendants: ${inspection.descendants.join(", ") || "none"}. ${inspection.affectedRuleAttachments.length} affected rule attachments: ${affectedRules}. Documentation entries: ${inspection.affectedDocumentationPaths?.join(", ") || "none"}. No changes occur until confirmation.`;
        }
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
    function focusAfterSchemaPropertyRemoval(path) { selectedSchemaPropertyPath = path.replace(/^\//, "").replaceAll("/", "."); renderSchemaPropertyView(); }
    const cancelSchemaPropertyRemoval = () => closeSchemaPropertyRemovalDialog();
    const cancelSchemaPropertyRemovalFromDialog = (event) => { event.preventDefault(); closeSchemaPropertyRemovalDialog(); };
    const undoLastSchemaPropertyRemoval = () => {
        if (!lastSchemaPropertyRemoval)
            return;
        if (compactCanonicalEditor?.onUndo) {
            const path = lastSchemaPropertyRemoval.propertyPath;
            lastSchemaPropertyRemoval = undefined;
            compactCanonicalEditor.onUndo();
            if (schemaPropertyRemovalFeedback)
                schemaPropertyRemovalFeedback.textContent = `Restored ${path} from page-scoped Undo with its canonical identity and tree position.`;
            if (undoSchemaPropertyRemovalButton)
                undoSchemaPropertyRemovalButton.hidden = true;
            return;
        }
        const schema = active(), restored = undoSchemaPropertyRemoval(lastSchemaPropertyRemoval);
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
        focusAfterSchemaPropertyRemoval(path);
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
        const canonicalBase = compactCanonicalSavedSchemaId(compactCanonicalEditor) === schema.id
            ? savedCanonicalDocument : draft.canonicalSchema;
        const canonicalNode = canonicalBase && Object.values(canonicalBase.nodes)
            .find((candidate) => canonicalPropertyPath(canonicalBase, candidate.id) === path);
        const canonicalRemoval = canonicalBase && canonicalNode ? applyCanonicalCommand(canonicalBase, {
            kind: "set", baseRevision: canonicalBase.revision, propertyId: canonicalNode.id,
            patch: { documentation: { displayText: "", description: "", comments: "", example: { method: "blank" } } },
        }) : undefined;
        const canonicalSchema = canonicalRemoval?.status === "applied" || canonicalRemoval?.status === "rebased"
            ? canonicalRemoval.document : undefined;
        if (canonicalSchema && compactCanonicalSavedSchemaId(compactCanonicalEditor) === schema.id)
            savedCanonicalDocument = canonicalSchema;
        replaceActive(updateSchemaWorkingDraft(schema, { documentation, ...(canonicalSchema ? { canonicalSchema } : {}) }, `Remove property documentation ${path}`));
        queueSchemaLibraryPersistence(schema.id);
        renderSchemas();
        schemaEditor?.setAttribute("aria-busy", String(Boolean(ports.settleCanonical)));
    };
    const cancelSchemaDocumentationRemovalAction = () => closeSchemaDocumentationRemoval();
    const cancelSchemaDocumentationRemovalFromDialog = (event) => { event.preventDefault(); closeSchemaDocumentationRemoval(); };
    const resetSchemaPropertyCopyDialog = () => {
        const cleanCopyDialog = typeof schemaPropertyCopyDialog?.cloneNode === "function"
            ? schemaPropertyCopyDialog.cloneNode(false) : undefined;
        if (schemaPropertyCopyDialog && cleanCopyDialog) {
            cleanCopyDialog.id = schemaPropertyCopyDialog.id;
            schemaPropertyCopyDialog.replaceWith(cleanCopyDialog);
            schemaPropertyCopyDialog = cleanCopyDialog;
        }
    };
    function openSchemaPropertyCopyReview(path, triggerOrDestination) {
        const sourceSchema = active(), source = schemaPropertyCopySource(sourceSchema, { surface: sourceSchema.workingDraft ? "working draft" : "current" }), editorScroll = schemaEditor?.scrollTop ?? 0, treeScroll = schemaPropertyTree?.scrollTop ?? 0;
        const trigger = typeof triggerOrDestination === "string" ? undefined : triggerOrDestination;
        const sources = [source, ...(sourceSchema.workingDraft ? [schemaPropertyCopySource(sourceSchema, { surface: "current" })] : []),
            ...schemaRevisionChoices(sourceSchema).map((version) => schemaPropertyCopySource(sourceSchema, { surface: "historical", version }))];
        pendingSchemaPropertyCopyReview?.close();
        resetSchemaPropertyCopyDialog();
        const reviewController = renderSchemaPropertyCopyReview(schemaPropertyCopyDialog, { source, sources, selectedPath: path,
            destinations: library.schemas.filter(({ id }) => id !== sourceSchema.id), schemas: library.schemas, reusableRuleIds: reusableSchemaRules.map(({ id }) => id),
            ...(trigger ? { trigger } : {}),
            onApply: (transaction) => {
                pendingSchemaPropertyCopyPosition = { schemaId: sourceSchema.id, settlementSchemaId: transaction.schema.id, path, editorScroll, treeScroll };
                library.schemas = library.schemas.map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema);
                lastSchemaPropertyCopy = transaction;
                pendingSchemaPropertyCopy = undefined;
                pendingSchemaPropertyCopyReview = undefined;
                persistSchemaLibrary();
                renderSchemas();
                renderSchemaRuleLibrary();
                if (undoSchemaPropertyCopyButton)
                    undoSchemaPropertyCopyButton.hidden = false;
                if (schemaPropertyCopyFeedback)
                    schemaPropertyCopyFeedback.textContent = `Copied ${path} from ${source.label} to ${transaction.schema.name}. Published revisions are unchanged.`;
                const restoration = pendingSchemaPropertyCopyPosition;
                const restoreCopyPosition = () => {
                    schemaPropertyTree?.querySelector(`button[aria-label="Copy ${path} to another schema"]`)?.focus({ preventScroll: true });
                    if (schemaEditor)
                        schemaEditor.scrollTop = editorScroll;
                    if (schemaPropertyTree)
                        schemaPropertyTree.scrollTop = treeScroll;
                };
                const completeCopyPosition = () => {
                    restoreCopyPosition();
                    ports.scheduleFrame(() => {
                        restoreCopyPosition();
                        if (pendingSchemaPropertyCopyPosition === restoration)
                            pendingSchemaPropertyCopyPosition = undefined;
                    });
                };
                queueMicrotask(restoreCopyPosition);
                ports.scheduleFrame(restoreCopyPosition);
                if (ports.settleCanonical)
                    void ports.settleCanonical(transaction.schema.id)
                        .then(() => ports.scheduleFrame(completeCopyPosition), () => { });
                else
                    ports.scheduleFrame(completeCopyPosition);
            }, ...(trigger ? { onClose: () => trigger.focus({ preventScroll: true }) } : {}) });
        pendingSchemaPropertyCopyReview = reviewController;
        if (typeof triggerOrDestination === "string") {
            const destination = schemaPropertyCopyDialog?.querySelector("#schema-property-copy-destination");
            if (destination) {
                destination.value = triggerOrDestination;
                const testableDestination = destination;
                if (testableDestination.dispatch)
                    testableDestination.dispatch("change");
                else
                    destination.dispatchEvent(new Event("change", { bubbles: true }));
            }
            pendingSchemaPropertyCopy = reviewController.plan();
        }
    }
    const confirmSchemaPropertyCopy = () => {
        if (!pendingSchemaPropertyCopy)
            return;
        const transaction = applySchemaPropertyCopy(pendingSchemaPropertyCopy);
        library.schemas = library.schemas.map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema);
        lastSchemaPropertyCopy = transaction;
        pendingSchemaPropertyCopy = undefined;
        pendingSchemaPropertyCopyReview?.close();
        pendingSchemaPropertyCopyReview = undefined;
        resetSchemaPropertyCopyDialog();
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
        library.schemas = library.schemas.map((schema) => schema.id === restored.id ? restored : schema);
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
        const trigger = specificIndexTrigger, dottedPath = inspection.canonicalPath.slice(1).replaceAll("/", ".");
        closeSpecificIndexDialog();
        openSchemaPropertyRulePicker(dottedPath, trigger);
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
            const parent = library.schemas.find(({ id }) => id === parentId);
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
        pendingManualPropertyCanonicalBase = active().workingDraft?.canonicalSchema;
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
        const document = addManualProperty(draft.document, schemaParentDocuments(), definition);
        let canonicalSchema = draft.canonicalSchema;
        if (canonicalSchema) {
            const previousCanonical = canonicalSchema;
            const projected = { ...schema, document, name: draft.name ?? schema.name, assignments: draft.assignments,
                ...(draft.attachedRules ? { attachedRules: draft.attachedRules } : {}), ...(draft.documentation ? { documentation: draft.documentation } : {}) };
            canonicalSchema = savedSchemaCanonicalDocument(projected, (kind) => `schema:${kind}:${++compactCanonicalIdSequence}`, {
                id: previousCanonical.id, contributorId: previousCanonical.contributorId, contributorName: previousCanonical.contributorName,
            });
            canonicalSchema.revision = previousCanonical.revision + 1;
            const selectedPropertyId = Object.values(canonicalSchema.nodes)
                .find((node) => canonicalPropertyPath(canonicalSchema, node.id) === inspection.normalizedPath)?.id;
            if (selectedPropertyId)
                canonicalSchema.selectedPropertyId = selectedPropertyId;
        }
        replaceActive(updateSchemaWorkingDraft(schema, { document, ...(canonicalSchema ? { canonicalSchema } : {}) }, `Add manual property ${inspection.normalizedPath}`));
        selectedSchemaPropertyPath = inspection.normalizedPath.slice(1).replaceAll("/", ".");
        closeManualPropertyForm(false);
        pendingManualPropertyCanonicalBase = undefined;
        persistSchemaLibrary();
        renderSchemas();
    };
    function openContextualManualPropertyForm(parentPath, trigger) { openManualPropertyForm(parentPath, trigger); }
    const openManualPropertyFromControl = () => openManualPropertyForm();
    const cancelManualPropertyDialog = () => closeManualPropertyForm();
    const cancelManualPropertyFromDialog = (event) => { event.preventDefault(); closeManualPropertyForm(); };
    const goToExistingSchemaProperty = () => {
        const path = goToExistingSchemaPropertyButton?.dataset.schemaPropertyPath;
        if (!path)
            return;
        selectedSchemaPropertyPath = path.replace(/^\//, "").replaceAll("/", ".");
        closeManualPropertyForm(false);
        renderSchemas();
        schemaPropertyTree?.querySelector(`button[aria-label="${CSS.escape(`Add rule for ${selectedSchemaPropertyPath}`)}"]`)?.focus({ preventScroll: true });
    };
    const normalizedRulePickerPath = (path) => `/${path.replace(/^\//, "").replaceAll(".", "/")}`;
    function currentConditionPayload(target = "payload") { return ports.capturedAssignmentValue(target); }
    function valueAtSchemaPath(value, path) {
        let current = value;
        for (const segment of path.replace(/^\//, "").split(/[/.]/).filter(Boolean)) {
            if (current === null || typeof current !== "object" || !(segment in current))
                return { exists: false, value: undefined };
            current = current[segment];
        }
        return { exists: true, value: current };
    }
    function initialConditionPredicate(propertyPath) {
        const editable = library.draft ?? schemaEditorDraft(active()), consequence = normalizedRulePickerPath(propertyPath);
        const choice = schemaDocumentPaths(editable.document).find((path) => normalizedRulePickerPath(path) === "/page_type")
            ?? schemaDocumentPaths(editable.document).find((path) => normalizedRulePickerPath(path) !== consequence) ?? "";
        const canonical = choice ? normalizedRulePickerPath(choice) : "", sample = valueAtSchemaPath(currentConditionPayload(), canonical);
        const detectedType = choice ? schemaPropertyType(editable.document, canonical) ?? "string" : "string";
        const comparable = sample.exists && (sample.value === null || ["string", "number", "boolean"].includes(typeof sample.value));
        return { operator: "All", predicates: [{ propertyPath: canonical, operator: comparable ? "Equals" : "Exists", detectedType,
                    ...(comparable ? { comparison: typedComparisonValue(sample.value) } : {}) }] };
    }
    function sampledConditionPredicate(propertyPath) {
        const editable = library.draft ?? schemaEditorDraft(active()), canonical = normalizedRulePickerPath(propertyPath), sample = valueAtSchemaPath(currentConditionPayload(), canonical), comparable = sample.exists &&
            (sample.value === null || ["string", "number", "boolean"].includes(typeof sample.value));
        return { operator: "All", predicates: [{ propertyPath: canonical, operator: comparable ? "Equals" : "Exists",
                    ...(comparable ? { comparison: typedComparisonValue(sample.value) } : {}),
                    ...(comparable ? {} : { detectedType: schemaPropertyType(editable.document, canonical) ?? "string" }) }] };
    }
    function configuredRuleInput() {
        const configuration = schemaRuleConfiguration;
        if (configuration) {
            const details = configuredRuleDetails(configuration), generatedId = configuration.saveReusable
                ? ports.createRuleId() : ports.createRuleId().replace(/^rule:/, "local-rule:");
            return { id: editingAttachedLocalRule?.id ?? editingReusableSchemaRuleId ?? generatedId,
                name: configuration.reusableName.trim() || `${configuration.ruleType} for ${schemaRulePickerPath}`, kind: configuration.ruleType,
                version: storedReusableRule(editingReusableSchemaRuleId ?? "")?.version ?? 0, enabled: configuration.enabled, applicableType: configuration.propertyType,
                operator: details.operator, ...(details.parameters !== undefined ? { parameters: details.parameters } : {}),
                ...(details.allowedValues !== undefined ? { allowedValues: details.allowedValues } : {}), ...(details.comparison !== undefined ? { comparison: details.comparison } : {}),
                ...(details.limit !== undefined ? { limit: details.limit } : {}), severity: configuration.severity,
                ...(configuration.message.trim() ? { message: configuration.message.trim() } : {}),
                ...(configuration.applyOnlyWhen ? { conditionGroup: { operator: configuration.conditionGroupOperator, predicates: structuredClone(configuration.conditions) } } : {}),
                ...(configuration.description.trim() ? { description: configuration.description.trim() } : {}) };
        }
        const name = schemaRuleName?.value.trim() || "Untitled rule", operator = schemaRuleOperator?.value || "required";
        return { id: editingReusableSchemaRuleId ?? ports.createRuleId(), name, kind: operator, version: storedReusableRule(editingReusableSchemaRuleId ?? "")?.version ?? 0,
            enabled: true, applicableType: (schemaRuleTypes?.value || "string"), operator,
            ...(schemaRuleParameters?.value.trim() ? { parameters: schemaRuleParameters.value.trim() } : {}),
            ...(schemaRuleSeverity?.value ? { severity: schemaRuleSeverity.value } : {}), ...(schemaRuleMessage?.value.trim() ? { message: schemaRuleMessage.value.trim() } : {}) };
    }
    function renderConditionalRuleConfiguration() {
        if (!schemaPropertyRulePicker || !schemaRulePickerPath)
            return;
        const condition = initialConditionPredicate(schemaRulePickerPath);
        schemaPropertyRulePicker.dataset.conditionPreview = JSON.stringify({
            propertyPath: normalizedRulePickerPath(schemaRulePickerPath), ...condition
        });
    }
    function renderSchemaLocalRuleConfiguration() { renderSchemaPropertyRulePicker(); renderConditionalRuleConfiguration(); }
    function createConfiguredSchemaRule() {
        if (!schemaRulePickerPath || (!library.activeSchemaId && !library.draft))
            return false;
        const rule = configuredRuleInput();
        const savedRule = { ...rule, version: editingAttachedLocalRule?.version ?? Math.max(1, rule.version + 1) };
        if (schemaRuleConfiguration?.saveReusable)
            reusableSchemaRules = [...reusableSchemaRules.filter(({ id }) => id !== savedRule.id), savedRule];
        const attached = attachReusableRule(library.activeSchemaId ?? library.draft.id, savedRule.id, schemaRulePickerPath, savedRule);
        if (attached)
            closeSchemaPropertyRulePickerForCommit();
        return attached;
    }
    function openCompactCanonicalRuleEditor(path, trigger) {
        const adapter = compactCanonicalEditor, base = adapter?.load(), node = base && Object.values(base.nodes)
            .find((candidate) => canonicalPropertyPath(base, candidate.id) === canonicalRulePropertyPath(path) || candidate.id === path);
        if (!adapter || !base || !node || !schemaPropertyRulePicker)
            return false;
        let working = structuredClone(node), feedbackText = "";
        const removedRuleIds = new Set();
        const properties = () => Object.values(base.nodes).map(({ id, name, type, allowedValues }) => ({
            id, name, type, allowedValues: allowedValues.map(({ value }) => value),
        }));
        const button = (text, run) => {
            const control = schemaPropertyRulePicker.ownerDocument.createElement("button");
            control.type = "button";
            control.textContent = text;
            control.addEventListener("click", run);
            return control;
        };
        const render = () => {
            const document = schemaPropertyRulePicker.ownerDocument, focused = document.createElement("section"), heading = document.createElement("h3"), identity = document.createElement("p"), rules = document.createElement("section"), actions = document.createElement("section"), feedback = document.createElement("output");
            focused.dataset.focusedPropertyEditor = "true";
            focused.dataset.focusedSection = "rules";
            focused.setAttribute("aria-label", `${path} focused Rules section`);
            heading.textContent = "Rules";
            identity.textContent = `${path} · stable identity ${node.id} · Local value and effective result remain staged until Review changes.`;
            rules.setAttribute("aria-label", "Compact staged rule editor");
            actions.setAttribute("aria-label", "Property actions");
            feedback.setAttribute("role", "status");
            feedback.textContent = feedbackText;
            renderCanonicalFocusedRules(rules, { dom: document, getWorking: () => working,
                properties, removedRuleIds, invariant: working.enforcement === "invariant", id: (kind) => `${kind}:${crypto.randomUUID()}`,
                render, feedback: (message) => { feedbackText = message; } });
            const cancel = button("Cancel", closeSchemaPropertyRulePicker), review = button("Review changes", () => {
                const reviewPanel = document.createElement("section"), summary = document.createElement("p"), reviewActions = document.createElement("section"), stagedRules = working.rules.filter(({ id }) => !removedRuleIds.has(id));
                reviewPanel.setAttribute("aria-label", "Review changes");
                summary.textContent = `Review changes · ${path} · ${stagedRules.length} staged rules · one property command and one Undo action.`;
                reviewActions.setAttribute("aria-label", "Property review actions");
                reviewActions.append(button("Cancel review", render), button("Confirm changes", () => {
                    void (async () => {
                        const current = adapter.load(), result = await dispatchCompactCanonicalCommand({ kind: "set", baseRevision: current.revision,
                            propertyId: node.id, patch: { rules: structuredClone(stagedRules) } });
                        if (result)
                            closeSchemaPropertyRulePicker();
                    })();
                }));
                reviewPanel.append(summary, reviewActions);
                schemaPropertyRulePicker.replaceChildren(reviewPanel);
            });
            actions.append(feedback, cancel, review);
            focused.append(heading, identity, rules, actions);
            schemaPropertyRulePicker.replaceChildren(focused);
        };
        schemaRulePickerPath = path;
        schemaRulePickerTrigger = trigger;
        schemaRuleConfiguration = undefined;
        editingAttachedLocalRule = undefined;
        render();
        schemaPropertyRulePicker.showModal();
        schemaPropertyRulePicker.querySelector('[aria-label="Compact staged rule editor"] > button')?.focus({ preventScroll: true });
        return true;
    }
    function openCompactCanonicalPropertyActions(path, trigger) {
        const adapter = compactCanonicalEditor, documentModel = adapter?.load(), original = documentModel && Object.values(documentModel.nodes).find((candidate) => canonicalPropertyPath(documentModel, candidate.id) === path || candidate.id === path), owner = schemaEditor;
        if (!adapter || !documentModel || !original || !owner || !schemaOwnerDocument)
            return false;
        compactCanonicalPropertyMenuId = original.id;
        selectedSchemaPropertyPath = path.replace(/^\//, "").replaceAll("/", ".");
        if (!trigger) {
            renderCompactCanonicalContext();
            return true;
        }
        let working = structuredClone(original), activeSection, feedbackText = "", stagedOwnershipAction = "";
        const ownership = focusedOwnershipState(focusedCanonicalOwnershipInput(original));
        let ownershipSession = ownership.session;
        const removedRuleIds = new Set(), removedValueIds = new Set(), stagedOperations = [];
        const state = focusedSourceState(original), sectionOwnership = focusedSectionOwnershipActions(ownership.input);
        const close = () => { clearSchemaTableOverlay(owner); trigger.focus({ preventScroll: true }); };
        const restoreFocus = (label) => queueMicrotask(() => Array.from(owner.ownerDocument.querySelectorAll('[data-schema-row-overlay="true"] button')).find(({ textContent, ariaLabel }) => textContent?.trim() === label || ariaLabel === label)?.focus({ preventScroll: true }));
        const menu = () => renderFocusedPropertyMenu({ dom: schemaOwnerDocument, path, provenance: focusedPropertyProvenanceSummary(original.provenance), close, sectionSummary: (name) => name === "rules" ? `${working.rules.length} rules` : name === "structure" ? "Stable property identity" : "Effective definition facets", selectSection: (name) => showSection(name) });
        const mount = (layers, focusLabel) => { const sequence = focusedPropertyLayerSequence(activeSection, ...(layers.length === 3 ? ["review"] : [])); layers.forEach((layer, index) => { layer.dataset.compactFocusedLayer = sequence[index] ?? "review"; }); mountSchemaTableOverlay(owner, trigger, path, layers, close); if (focusLabel)
            restoreFocus(focusLabel); };
        const showMenu = (focusLabel) => { activeSection = undefined; mount([menu()], focusLabel); };
        const sectionContext = (section, render) => ({ dom: schemaOwnerDocument, current: () => documentModel, node: original, getWorking: () => working, setWorking: (value) => { if (value)
                working = value; }, activeSection: section, setActiveSection: (value) => { if (value === "definition" || value === "rules" || value === "structure")
                activeSection = value; }, removedRuleIds, removedValueIds, id: (kind) => `${kind}:${crypto.randomUUID()}`, stageStructure: (operation) => { stagedOperations.push(operation); render(); }, render, patchFor: (next, source) => focusedPropertyPatch(next, source, removedRuleIds, removedValueIds), command: (command) => applyCanonicalCommand(documentModel, command), select: () => { }, feedback: (message) => { feedbackText = message; } });
        const showReview = (section, child, focusLabel) => { const review = schemaOwnerDocument.createElement("section"), heading = schemaOwnerDocument.createElement("h3"), summary = schemaOwnerDocument.createElement("p"), changes = schemaOwnerDocument.createElement("ul"), actions = schemaOwnerDocument.createElement("div"), cancel = schemaOwnerDocument.createElement("button"), confirm = schemaOwnerDocument.createElement("button"), patch = focusedPropertyPatch(working, original, removedRuleIds, removedValueIds), staged = focusedStagedChanges(working, original, removedRuleIds, path, removedValueIds); review.setAttribute("aria-label", "Review changes"); review.dataset.focusedReview = "true"; heading.textContent = "Review changes"; summary.textContent = `${path} · ${stagedOwnershipAction ? `${stagedOwnershipAction} · ` : ""}one property command and one Undo action · no durable write before confirmation.`; for (const change of staged)
            changes.append(Object.assign(schemaOwnerDocument.createElement("li"), { textContent: `${change.label} · ${change.detail}` })); for (const operation of stagedOperations)
            changes.append(Object.assign(schemaOwnerDocument.createElement("li"), { textContent: `Structure ${operation.kind} · ${"propertyId" in operation ? operation.propertyId : original.id}` })); cancel.type = "button"; cancel.textContent = "Cancel review"; cancel.addEventListener("click", () => showSection(section, "Review changes")); confirm.type = "button"; confirm.textContent = "Confirm changes"; confirm.addEventListener("click", () => { void dispatchCompactCanonicalCommand({ kind: "set", baseRevision: adapter.load().revision, propertyId: original.id, patch, operations: stagedOperations }).then((result) => { if (result)
            close(); }); }); actions.append(cancel, confirm); review.append(heading, summary, changes, actions); review.addEventListener("keydown", (event) => { if (event.key !== "Escape")
            return; event.preventDefault(); event.stopPropagation(); showSection(section, "Review changes"); }); activeSection = section; mount([menu(), child, review], focusLabel ?? "Confirm changes"); };
        const buildSection = (section) => { const host = schemaOwnerDocument.createElement("section"), heading = schemaOwnerDocument.createElement("h3"), identity = schemaOwnerDocument.createElement("p"), body = schemaOwnerDocument.createElement("section"), group = schemaOwnerDocument.createElement("div"), status = schemaOwnerDocument.createElement("p"), actions = schemaOwnerDocument.createElement("div"), cancel = schemaOwnerDocument.createElement("button"), review = schemaOwnerDocument.createElement("button"), render = () => showSection(section); host.dataset.focusedPropertyEditor = "true"; host.dataset.schemaOverlayLayer = "child"; host.dataset.focusedSection = section; host.setAttribute("aria-label", `${path} focused ${section} section`); heading.textContent = section === "definition" ? "Definition" : section === "rules" ? "Rules" : "Structure"; identity.textContent = `${path} · stable identity ${original.id} · ${focusedPropertyProvenanceSummary(original.provenance)}`; body.setAttribute("aria-label", `Focused ${heading.textContent} section`); renderCanonicalFocusedSection(body, sectionContext(section, render)); if (section === "definition")
            body.dataset.definitionFields = focusedDefinitionFieldLabels.join("|"); const target = focusedOwnershipActionTarget(section === "structure" ? "Structure" : section === "rules" ? "Rules" : "Definition", section === "structure" ? "property" : section === "rules" ? "rule" : "facet", section === "structure" ? original.id : section === "rules" ? `${original.id}:rules` : `${original.id}:definition`), visible = section === "rules" ? [] : sectionOwnership[section]; if (visible.length) {
            group.dataset.sectionOwnershipActions = "true";
            group.dataset.ownershipState = state;
            group.dataset.ownershipTarget = target.label;
            for (const action of visible) {
                const control = schemaOwnerDocument.createElement("button");
                control.type = "button";
                control.textContent = action;
                control.dataset.ownershipAction = action;
                control.dataset.ownershipTarget = target.label;
                control.setAttribute("aria-label", `${action} · ${target.label}`);
                control.addEventListener("click", () => { feedbackText = `${action} targets ${target.label}.`; ownershipSession = activateFocusedOwnershipSection(ownershipSession, section, action); if (action === "Override here" || action === "Replace here")
                    stagedOwnershipAction = action; const operation = focusedPropertyLifecycleOperation(action, original.id); if (operation) {
                    stagedOwnershipAction = action;
                    if (!stagedOperations.some((candidate) => candidate.kind === "delete" && candidate.propertyId === original.id))
                        stagedOperations.push(operation);
                } render(); });
                group.append(control);
            }
        } gateFocusedOwnershipSection(body, ownershipSession, section); status.setAttribute("role", "status"); status.textContent = feedbackText; cancel.type = "button"; cancel.textContent = "Cancel"; cancel.addEventListener("click", () => showMenu(heading.textContent)); review.type = "button"; review.textContent = "Review changes"; review.addEventListener("click", () => showReview(section, host)); actions.append(cancel, review); host.append(heading, identity, body, group, status, actions); host.addEventListener("keydown", (event) => { if (event.key !== "Escape")
            return; event.preventDefault(); event.stopPropagation(); showMenu(heading.textContent); }); return host; };
        function showSection(section, focusLabel) { activeSection = section; mount([menu(), buildSection(section)], focusLabel); }
        showMenu();
        renderCompactCanonicalContext();
        return true;
    }
    const updateConfiguredRulePreview = () => { if (schemaRulePickerPath)
        renderSchemaLocalRuleConfiguration(); };
    const renderSchemaPropertyRulePicker = () => {
        schemaPropertyRenderSequence += 1;
        if (!schemaPropertyRulePicker || !schemaRulePickerPath)
            return;
        for (const dispose of schemaRulePickerDisposers.splice(0))
            dispose();
        const path = schemaRulePickerPath, document = schemaPropertyRulePicker.ownerDocument;
        if (!document)
            return;
        if (!schemaRuleConfiguration) {
            const heading = document.createElement("h4"), search = document.createElement("input"), results = document.createElement("section"), cancel = document.createElement("button"), propertyType = schemaRuleTypeForAttachment(active(), path);
            heading.id = "schema-property-rule-picker-heading";
            heading.textContent = `Add rule for ${path} · type ${propertyType}`;
            results.id = "schema-property-rule-results";
            search.id = "schema-property-rule-search";
            search.value = schemaRulePickerSearch;
            schemaPropertyRulePicker.setAttribute("aria-labelledby", heading.id);
            cancel.type = "button";
            cancel.textContent = "Cancel";
            const canonicalPath = normalizedRulePickerPath(path), attachedIds = new Set((active().workingDraft?.attachedRules ?? active().attachedRules ?? [])
                .filter(({ propertyPath }) => normalizedRulePickerPath(propertyPath ?? "") === canonicalPath)
                .map(({ id }) => id));
            const normalized = schemaRulePickerSearch.trim().toLowerCase(), builtIns = builtInRulesForProperty(propertyType)
                .filter((rule) => !normalized || [rule.name, rule.operator, rule.applicableType].join(" ").toLowerCase().includes(normalized));
            const reusable = reusableRulesForProperty(reusableSchemaRules, propertyType, schemaRulePickerSearch, attachedIds);
            const create = document.createElement("section"), library = document.createElement("section");
            create.setAttribute("aria-label", "Create a rule");
            library.setAttribute("aria-label", "Attach from Rule Library");
            create.append(Object.assign(document.createElement("h5"), { textContent: "Create a rule" }));
            library.append(Object.assign(document.createElement("h5"), { textContent: "Attach from Rule Library" }));
            for (const rule of builtIns) {
                const article = document.createElement("article"), button = document.createElement("button"), metadata = document.createElement("p");
                button.type = "button";
                button.textContent = rule.name;
                metadata.textContent = reusableRuleMetadata(rule, propertyType);
                const action = () => { schemaRuleConfiguration = createRuleConfiguration(rule.name, propertyType); renderSchemaPropertyRulePicker(); };
                button.addEventListener("click", action);
                schemaRulePickerDisposers.push(() => button.removeEventListener("click", action));
                article.append(button, metadata);
                create.append(article);
            }
            for (const rule of reusable) {
                const article = document.createElement("article"), button = document.createElement("button"), metadata = document.createElement("p");
                button.type = "button";
                button.textContent = `${rule.name} version ${rule.version ?? 1}${rule.alreadyAttached ? " · already attached" : ""}`;
                button.disabled = rule.alreadyAttached;
                metadata.textContent = reusableRuleMetadata(rule, propertyType);
                const action = () => { attachReusableRule(active().id, rule.id, path); closeSchemaPropertyRulePickerForCommit(); };
                button.addEventListener("click", action);
                schemaRulePickerDisposers.push(() => button.removeEventListener("click", action));
                article.append(button, metadata);
                library.append(article);
            }
            if (!builtIns.length && !reusable.length) {
                const empty = document.createElement("p"), clear = document.createElement("button");
                empty.id = "schema-property-rule-empty";
                empty.textContent = "No compatible rules match this search";
                clear.type = "button";
                clear.textContent = "Clear search";
                const clearSearch = () => { schemaRulePickerSearch = ""; renderSchemaPropertyRulePicker(); };
                clear.addEventListener("click", clearSearch);
                schemaRulePickerDisposers.push(() => clear.removeEventListener("click", clearSearch));
                results.append(empty, clear);
            }
            else
                results.append(create, library);
            const cancelPicker = () => closeSchemaPropertyRulePicker(), searchRules = () => { schemaRulePickerSearch = search.value; renderSchemaPropertyRulePicker(); };
            cancel.addEventListener("click", cancelPicker);
            search.addEventListener("input", searchRules);
            schemaRulePickerDisposers.push(() => cancel.removeEventListener("click", cancelPicker), () => search.removeEventListener("input", searchRules));
            schemaPropertyRulePicker.replaceChildren(heading, search, results, cancel);
            return;
        }
        const configuration = schemaRuleConfiguration;
        const editLabel = editingAttachedLocalRule ? `Edit ${editingAttachedLocalRule.name ?? editingAttachedLocalRule.id}` : "Create local rule";
        const form = document.createElement("form"), heading = document.createElement("h4"), context = document.createElement("p"), status = document.createElement("output"), parameters = document.createElement("fieldset");
        form.id = "schema-local-rule-configuration";
        heading.id = "schema-property-rule-picker-heading";
        parameters.id = "schema-local-rule-parameters";
        parameters.append(Object.assign(document.createElement("legend"), { textContent: "Rule parameters" }));
        heading.textContent = `${editLabel} for ${normalizedRulePickerPath(path)}`;
        context.textContent = `Local rule origin · ${normalizedRulePickerPath(path)} · ${configuration.ruleType.toLowerCase()} operator · type ${configuration.propertyType}`;
        status.id = "schema-local-rule-assistance";
        schemaPropertyRulePicker.setAttribute("aria-labelledby", heading.id);
        let createButton;
        const refreshValidation = () => {
            const validation = validateRuleConfiguration(configuration);
            status.textContent = validation.assistance;
            if (createButton)
                createButton.disabled = !validation.ready;
            form.dataset.ready = String(validation.ready);
            schemaPropertyRulePicker.dataset.conditionPreview = JSON.stringify({ propertyPath: normalizedRulePickerPath(path), operator: configuration.conditionGroupOperator,
                predicates: configuration.conditions });
        };
        for (const control of ruleConfigurationControls(configuration.ruleType, configuration.propertyType)) {
            if (control.repeatable)
                continue;
            const input = control.inputType === "select" ? document.createElement("select") : document.createElement("input");
            input.id = `schema-local-rule-${control.key}`;
            if (control.inputType === "select")
                input.append(...(control.key === "comparison"
                    ? [Object.assign(document.createElement("option"), { value: "", textContent: "Choose comparison" })]
                    : []), ...(control.choices ?? []).map((value) => Object.assign(document.createElement("option"), { value, textContent: value })));
            else {
                const textInput = input;
                textInput.type = control.inputType === "number" ? "number" : "text";
                if (control.minimum !== undefined)
                    textInput.min = String(control.minimum);
                if (control.step !== undefined)
                    textInput.step = String(control.step);
            }
            input.value = String(configuration[control.key]);
            const label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = control.label;
            const update = () => { configuration[control.key] = input.value; refreshValidation(); };
            input.addEventListener(control.inputType === "select" ? "change" : "input", update);
            schemaRulePickerDisposers.push(() => input.removeEventListener(control.inputType === "select" ? "change" : "input", update));
            parameters.append(label, input);
        }
        if (!ruleConfigurationControls(configuration.ruleType, configuration.propertyType).length)
            parameters.append(Object.assign(document.createElement("p"), { textContent: "No parameter controls" }));
        const allowedValues = configuration.ruleType === "Allowed values" ? document.createElement("fieldset") : undefined;
        if (allowedValues)
            allowedValues.id = "schema-local-rule-allowed-values";
        if (allowedValues)
            configuration.allowedValues.forEach((value, index) => {
                const input = document.createElement("input"), remove = document.createElement("button");
                input.id = `schema-local-rule-allowed-value-${index + 1}`;
                input.value = value;
                remove.type = "button";
                remove.textContent = `Remove value ${index + 1}`;
                const update = () => { configuration.allowedValues[index] = input.value; refreshValidation(); };
                const removeValue = () => { configuration.allowedValues.splice(index, 1); renderSchemaPropertyRulePicker(); };
                input.addEventListener("input", update);
                remove.addEventListener("click", removeValue);
                schemaRulePickerDisposers.push(() => input.removeEventListener("input", update), () => remove.removeEventListener("click", removeValue));
                allowedValues.append(input, remove);
            });
        if (configuration.ruleType === "Allowed values") {
            const add = document.createElement("button");
            add.type = "button";
            add.textContent = "Add another value";
            const addValue = () => { configuration.allowedValues.push(""); renderSchemaPropertyRulePicker(); };
            add.addEventListener("click", addValue);
            schemaRulePickerDisposers.push(() => add.removeEventListener("click", addValue));
            allowedValues?.append(add);
            parameters.append(allowedValues);
        }
        const severity = document.createElement("select"), message = document.createElement("input"), enabled = document.createElement("input"), severityLabel = document.createElement("label"), messageLabel = document.createElement("label"), enabledLabel = document.createElement("label");
        severity.id = "schema-local-rule-severity";
        severity.append(...["error", "warning"].map((value) => Object.assign(document.createElement("option"), { value, textContent: value })));
        severity.value = configuration.severity;
        message.id = "schema-local-rule-message";
        message.value = configuration.message;
        enabled.id = "schema-local-rule-enabled";
        enabled.type = "checkbox";
        enabled.checked = configuration.enabled;
        severityLabel.htmlFor = severity.id;
        severityLabel.textContent = "Severity";
        messageLabel.htmlFor = message.id;
        messageLabel.textContent = "Issue message (optional)";
        enabledLabel.append(enabled, " Enabled");
        const changeSeverity = () => { configuration.severity = severity.value; refreshValidation(); }, changeMessage = () => { configuration.message = message.value; }, changeEnabled = () => { configuration.enabled = enabled.checked; };
        severity.addEventListener("change", changeSeverity);
        message.addEventListener("input", changeMessage);
        enabled.addEventListener("change", changeEnabled);
        schemaRulePickerDisposers.push(() => severity.removeEventListener("change", changeSeverity), () => message.removeEventListener("input", changeMessage), () => enabled.removeEventListener("change", changeEnabled));
        const conditional = document.createElement("input"), reusable = document.createElement("input"), conditionalLabel = document.createElement("label"), reusableLabel = document.createElement("label");
        conditional.id = "schema-local-rule-conditional";
        conditional.type = "checkbox";
        conditional.checked = configuration.applyOnlyWhen;
        reusable.id = "schema-local-rule-reusable";
        reusable.type = "checkbox";
        reusable.checked = configuration.saveReusable;
        conditionalLabel.append(conditional, " Apply only when");
        reusableLabel.append(reusable, " Save as reusable rule in Rule Library");
        const changeConditional = () => {
            configuration.applyOnlyWhen = conditional.checked;
            if (conditional.checked && !configuration.conditions.length)
                configuration.conditions.push(initialConditionPredicate(path).predicates[0]);
            renderSchemaPropertyRulePicker();
        };
        const changeReusable = () => { configuration.saveReusable = reusable.checked; renderSchemaPropertyRulePicker(); };
        conditional.addEventListener("change", changeConditional);
        reusable.addEventListener("change", changeReusable);
        schemaRulePickerDisposers.push(() => conditional.removeEventListener("change", changeConditional), () => reusable.removeEventListener("change", changeReusable));
        form.append(heading, context, parameters, severityLabel, severity, messageLabel, message, enabledLabel, conditionalLabel);
        if (configuration.applyOnlyWhen) {
            const conditions = document.createElement("fieldset"), group = document.createElement("select");
            conditions.id = "schema-local-rule-conditions";
            group.id = "schema-local-rule-condition-group";
            group.value = configuration.conditionGroupOperator;
            conditions.append(Object.assign(document.createElement("legend"), { textContent: "Apply only when" }));
            group.append(...["All", "Any"].map((value) => Object.assign(document.createElement("option"), { value, textContent: value })));
            group.value = configuration.conditionGroupOperator;
            const changeGroup = () => { configuration.conditionGroupOperator = group.value === "Any" ? "Any" : "All"; refreshValidation(); };
            group.addEventListener("change", changeGroup);
            schemaRulePickerDisposers.push(() => group.removeEventListener("change", changeGroup));
            conditions.append(group);
            configuration.conditions.forEach((predicate, index) => {
                const property = document.createElement("select"), operator = document.createElement("select"), comparison = document.createElement("input"), remove = document.createElement("button");
                const editable = library.draft ?? schemaEditorDraft(active());
                property.id = `schema-local-rule-condition-property-${index}`;
                property.append(Object.assign(document.createElement("option"), { value: "", textContent: "Choose a condition property" }), ...schemaDocumentPaths(editable.document).filter((candidate) => normalizedRulePickerPath(candidate) !== normalizedRulePickerPath(path))
                    .map((candidate) => Object.assign(document.createElement("option"), { value: normalizedRulePickerPath(candidate), textContent: normalizedRulePickerPath(candidate) })));
                property.value = predicate.propertyPath;
                operator.id = `schema-local-rule-condition-operator-${index}`;
                operator.append(...operatorsForConditionType(predicate.detectedType ?? "string").map((value) => Object.assign(document.createElement("option"), { value, textContent: value })));
                operator.value = predicate.operator;
                comparison.id = `schema-local-rule-condition-value-${index}`;
                comparison.value = predicate.comparison ? String(predicate.comparison.value ?? "") : "";
                remove.id = `schema-local-rule-condition-remove-${index}`;
                remove.type = "button";
                remove.textContent = `Remove condition ${index + 1}`;
                const changeProperty = () => {
                    const sample = valueAtSchemaPath(currentConditionPayload(), property.value), detectedType = schemaPropertyType(editable.document, property.value) ?? "string";
                    const comparable = sample.exists && (sample.value === null || ["string", "number", "boolean"].includes(typeof sample.value));
                    configuration.conditions[index] = { propertyPath: property.value, operator: comparable ? "Equals" : "Exists", detectedType,
                        ...(comparable ? { comparison: typedComparisonValue(sample.value) } : {}) };
                    renderSchemaPropertyRulePicker();
                };
                const changeOperator = () => { predicate.operator = operator.value; if (predicate.operator === "Exists" || predicate.operator === "Does not exist")
                    delete predicate.comparison; renderSchemaPropertyRulePicker(); };
                const changeComparison = () => { const value = comparisonValueFromInput(comparison.value, predicate.detectedType ?? "string"); if (value)
                    predicate.comparison = value;
                else
                    delete predicate.comparison; refreshValidation(); };
                const removeCondition = () => { configuration.conditions.splice(index, 1); renderSchemaPropertyRulePicker(); };
                property.addEventListener("change", changeProperty);
                operator.addEventListener("change", changeOperator);
                comparison.addEventListener("input", changeComparison);
                remove.addEventListener("click", removeCondition);
                schemaRulePickerDisposers.push(() => property.removeEventListener("change", changeProperty), () => operator.removeEventListener("change", changeOperator), () => comparison.removeEventListener("input", changeComparison), () => remove.removeEventListener("click", removeCondition));
                conditions.append(property, operator, comparison, remove);
            });
            const add = document.createElement("button");
            add.id = "schema-local-rule-condition-add";
            add.type = "button";
            add.textContent = "Add condition";
            const addCondition = () => { configuration.conditions.push(initialConditionPredicate(path).predicates[0]); renderSchemaPropertyRulePicker(); };
            const preview = document.createElement("output");
            preview.id = "schema-local-rule-current-preview";
            const applies = conditionGroupAppliesToValue(currentConditionPayload(), { operator: configuration.conditionGroupOperator, predicates: configuration.conditions });
            if (!applies)
                preview.textContent = "Current event preview: Not applicable";
            else {
                const observed = valueAtSchemaPath(currentConditionPayload(), path), measured = configuration.ruleType === "Item count" && Array.isArray(observed.value) ? observed.value.length
                    : configuration.ruleType === "Text length" && typeof observed.value === "string" ? observed.value.length : undefined;
                const passed = measured === undefined ? observed.exists : configuration.comparison !== "" && cardinalityComparisonPasses(measured, configuration.comparison, Number(configuration.limit));
                preview.textContent = `Current event preview: ${passed ? "Passed" : "Failed"}`;
            }
            add.addEventListener("click", addCondition);
            schemaRulePickerDisposers.push(() => add.removeEventListener("click", addCondition));
            conditions.append(add, preview);
            form.append(conditions);
        }
        if (!editingAttachedLocalRule)
            form.append(reusableLabel);
        if (!editingAttachedLocalRule && configuration.saveReusable) {
            const explanation = document.createElement("p"), name = document.createElement("input"), description = document.createElement("textarea");
            explanation.id = "schema-local-rule-reusable-explanation";
            explanation.textContent = "This reusable rule will be available to other library.schemas.";
            name.id = "schema-local-rule-name";
            name.value = configuration.reusableName;
            name.required = true;
            description.id = "schema-local-rule-description";
            description.value = configuration.description;
            const changeName = () => { configuration.reusableName = name.value; refreshValidation(); }, changeDescription = () => { configuration.description = description.value; };
            name.addEventListener("input", changeName);
            description.addEventListener("input", changeDescription);
            schemaRulePickerDisposers.push(() => name.removeEventListener("input", changeName), () => description.removeEventListener("input", changeDescription));
            form.append(explanation, name, description);
        }
        const back = document.createElement("button"), cancel = document.createElement("button"), create = document.createElement("button");
        back.type = cancel.type = "button";
        create.type = "submit";
        back.textContent = "Back to rule choices";
        cancel.textContent = "Cancel";
        create.textContent = editingAttachedLocalRule ? "Save changes" : "Create rule";
        createButton = create;
        const goBack = () => { schemaRuleConfiguration = undefined; renderSchemaPropertyRulePicker(); }, cancelEdit = () => closeSchemaPropertyRulePicker();
        const submit = (event) => { event.preventDefault(); if (validateRuleConfiguration(configuration).ready)
            createConfiguredSchemaRule(); };
        back.addEventListener("click", goBack);
        cancel.addEventListener("click", cancelEdit);
        form.addEventListener("submit", submit);
        schemaRulePickerDisposers.push(() => back.removeEventListener("click", goBack), () => cancel.removeEventListener("click", cancelEdit), () => form.removeEventListener("submit", submit));
        form.append(status, create, ...(editingAttachedLocalRule ? [] : [back]), cancel);
        schemaPropertyRulePicker.replaceChildren(form);
        refreshValidation();
    };
    function openSchemaPropertyRulePicker(path, trigger) {
        if (compactCanonicalEditor && !compactCanonicalEditor.key.startsWith("saved:") && openCompactCanonicalRuleEditor(path, trigger))
            return;
        schemaRulePickerPath = path;
        schemaRulePickerTrigger = trigger;
        selectedSchemaPropertyPath = path;
        schemaPropertyInteractionReturn = { schemaId: active().id, path, triggerLabel: trigger?.ariaLabel ?? `Add rule for ${path}`,
            editorScroll: schemaEditor?.scrollTop ?? 0, treeScroll: schemaPropertyTree?.scrollTop ?? 0, detailScroll: schemaDetail?.scrollTop ?? 0 };
        schemaRuleConfiguration = undefined;
        renderSchemaLocalRuleConfiguration();
        schemaPropertyRulePicker?.showModal();
        schemaPropertyRulePicker?.querySelector("#schema-property-rule-search")?.focus({ preventScroll: true });
    }
    function closeSchemaPropertyRulePicker() {
        const triggerLabel = schemaRulePickerTrigger?.getAttribute("aria-label") ?? schemaPropertyInteractionReturn?.triggerLabel;
        schemaPropertyRulePicker?.close();
        const currentTrigger = schemaRulePickerTrigger?.isConnected ? schemaRulePickerTrigger
            : Array.from(schemaPropertyTree?.querySelectorAll("button") ?? [])
                .find((button) => button.getAttribute("aria-label") === triggerLabel);
        currentTrigger?.focus({ preventScroll: true });
        schemaRulePickerPath = undefined;
        schemaRulePickerTrigger = undefined;
        schemaRuleConfiguration = undefined;
        schemaRulePickerSearch = "";
        editingAttachedLocalRule = undefined;
        schemaPropertyInteractionReturn = undefined;
    }
    const cancelSchemaPropertyRulePicker = (event) => { event.preventDefault(); closeSchemaPropertyRulePicker(); };
    const navigateSchemaPropertyRulePicker = (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeSchemaPropertyRulePicker();
            return;
        }
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter")
            return;
        const buttons = Array.from(schemaPropertyRulePicker?.querySelectorAll("#schema-property-rule-results button:not(:disabled)") ?? []), index = buttons.indexOf(schemaOwnerDocument?.activeElement);
        if (event.key === "Enter" && index >= 0) {
            event.preventDefault();
            buttons[index]?.click();
            return;
        }
        if (!buttons.length || (event.key !== "ArrowDown" && event.key !== "ArrowUp"))
            return;
        event.preventDefault();
        buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    };
    const persistReusableSchemaRules = () => { ports.storage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); };
    const applyPersistenceSnapshot = (nextSchemas, nextRules) => {
        library.schemas = structuredClone([...nextSchemas]);
        reusableSchemaRules = structuredClone([...nextRules]);
        ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(library.schemas));
        persistReusableSchemaRules();
        renderSchemas();
        renderSchemaRuleLibrary();
    };
    const restorePersistenceSnapshot = (nextSchemas, nextRules) => {
        library.schemas = structuredClone([...nextSchemas]);
        reusableSchemaRules = structuredClone([...nextRules]);
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
                restorePersistenceSnapshot(transaction.previousSchemas, transaction.previousRules);
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
                restorePersistenceSnapshot(transaction.previousSchemas, transaction.previousRules);
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
        if (pendingSchemaPropertyCopyPosition && pendingSchemaPropertyCopyPosition.settlementSchemaId === event.schemaId
            && (event.type === "saved" || event.type === "retried" || event.type === "rejected")) {
            const restoration = pendingSchemaPropertyCopyPosition;
            const restoreCopyPosition = () => {
                schemaPropertyTree?.querySelector(`button[aria-label="Copy ${restoration.path} to another schema"]`)?.focus({ preventScroll: true });
                if (schemaEditor)
                    schemaEditor.scrollTop = restoration.editorScroll;
                if (schemaPropertyTree)
                    schemaPropertyTree.scrollTop = restoration.treeScroll;
            };
            queueMicrotask(restoreCopyPosition);
            ports.scheduleFrame(() => {
                restoreCopyPosition();
                ports.scheduleFrame(() => {
                    restoreCopyPosition();
                    if (pendingSchemaPropertyCopyPosition === restoration)
                        pendingSchemaPropertyCopyPosition = undefined;
                });
            });
        }
        if (event.type === "retried" && compactCanonicalEditor && compactCanonicalProjectionRequest?.adapter === compactCanonicalEditor
            && compactCanonicalSavedSchemaId(compactCanonicalEditor) === event.schemaId) {
            return resumeCompactCanonicalProjectionPersistence(compactCanonicalEditor).then(() => { renderSchemas(); renderCompactCanonicalEditor(); });
        }
        if (event.type === "saved") {
            const acknowledged = [...compactCanonicalSettlementClaims]
                .find(([, schemaId]) => schemaId === event.schemaId)?.[0];
            if (acknowledged !== undefined)
                clearCompactCanonicalSettlement(event.schemaId, acknowledged);
            if (compactCanonicalEditor)
                renderCompactCanonicalEditor();
        }
        if (compactCanonicalSettlementSchemaId === event.schemaId) {
            if (event.type === "retried" || event.type === "rejected") {
                clearCompactCanonicalSettlement(event.schemaId);
                if (event.type === "rejected") {
                    compactCanonicalPendingCommand = undefined;
                    compactCanonicalPendingBase = undefined;
                    compactCanonicalProjectionRequest = undefined;
                    compactCanonicalCommandFeedback = "Durable schema change rejected; the saved state was restored.";
                }
                if (compactCanonicalEditor)
                    renderCompactCanonicalEditor();
            }
        }
        const pendingTransactions = [pendingLocalRulePromotionPersistence, pendingGuidedValidationPersistence];
        const transactional = pendingTransactions.some((pending) => pending?.schemaId === event.schemaId && !pending.settled);
        if (event.type === "failed" && !transactional && compactCanonicalSettlementSchemaId !== event.schemaId) {
            library.reload();
            if (library.activeSchemaId) {
                const activeStored = library.schemas.find(({ id }) => id === library.activeSchemaId);
                if (activeStored) {
                    library.draft = schemaEditorDraft(activeStored);
                    savedCanonicalDocument = savedSchemaCanonicalDocument(library.draft, (kind) => `schema:${kind}:${++compactCanonicalIdSequence}`);
                }
            }
            renderSchemas();
        }
        for (const pending of pendingTransactions) {
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
    function restoreLocalRulePromotionPresentation(ruleId, rerender = true) {
        if (pendingLocalRulePromotion)
            localRulePromotionFocusReturn = {
                propertyPath: pendingLocalRulePromotion.propertyPath, ruleId: ruleId ?? pendingLocalRulePromotion.sourceRuleId,
                detailScroll: pendingLocalRulePromotion.detailScroll
            };
        pendingLocalRulePromotion = undefined;
        if (rerender) {
            renderSchemas();
            renderSchemaRuleLibrary();
        }
        const focusReturn = localRulePromotionFocusReturn ? { ...localRulePromotionFocusReturn } : undefined;
        if (focusReturn) {
            const restoreDetailScroll = () => {
                if (schemaDetail && schemaDetail.scrollTop !== focusReturn.detailScroll)
                    schemaDetail.scrollTop = focusReturn.detailScroll;
            };
            schemaDetail?.addEventListener("scroll", restoreDetailScroll);
            restoreDetailScroll();
            ports.scheduleFrame(() => {
                restoreDetailScroll();
                ports.scheduleFrame(() => {
                    Array.from(ports.root.querySelectorAll("button[data-rule-id]"))
                        .find(({ dataset }) => dataset.ruleId === focusReturn.ruleId && dataset.propertyPath === focusReturn.propertyPath)
                        ?.focus({ preventScroll: true });
                    restoreDetailScroll();
                    schemaDetail?.removeEventListener("scroll", restoreDetailScroll);
                });
            });
        }
    }
    function openLocalRulePromotionReview(propertyPath, sourceRuleId) {
        const storedSchema = library.activeSchemaId ? active() : undefined, schema = storedSchema ?? library.draft;
        if (!schema)
            return false;
        const editorContext = storedSchema ? "editable" : "new-schema";
        const generation = ++persistenceGeneration;
        let review;
        try {
            review = reviewLocalRulePromotion({ schema, reusableRules: promotionReusableRules(), propertyPath, sourceRuleId, editorContext });
        }
        catch (error) {
            if (schemaResult)
                schemaResult.textContent = error instanceof Error ? error.message : "Promotion is no longer available.";
            return false;
        }
        const focusedPosition = localRulePromotionFocusedPosition?.propertyPath === propertyPath
            && localRulePromotionFocusedPosition.ruleId === sourceRuleId ? localRulePromotionFocusedPosition : undefined;
        pendingLocalRulePromotion = { propertyPath, sourceRuleId, generation,
            detailScroll: focusedPosition?.detailScroll ?? schemaDetail?.scrollTop ?? 0 };
        localRulePromotionFocusReturn = undefined;
        localRulePromotionDialog.open({ review,
            cancel: () => { if (pendingLocalRulePromotion?.generation === generation)
                restoreLocalRulePromotionPresentation(undefined, false); },
            confirm: (selected) => {
                if (pendingLocalRulePromotion?.generation !== generation)
                    throw new Error("The promotion review is stale");
                const previousSchemas = structuredClone(library.schemas), previousRules = structuredClone(reusableSchemaRules);
                const result = selected.action === "create"
                    ? promoteLocalRule({ schema, reusableRules: promotionReusableRules(), propertyPath, sourceRuleId, editorContext, ...selected })
                    : promoteLocalRule({ schema, reusableRules: promotionReusableRules(), propertyPath,
                        sourceRuleId, editorContext, action: "use-existing", reusableRuleId: selected.reusableRuleId });
                const nextSchemas = storedSchema ? library.schemas.map((candidate) => candidate.id === result.schema.id ? result.schema : candidate) : library.schemas;
                const nextRules = storedPromotionRules(result.reusableRules);
                if (!storedSchema) {
                    reusableSchemaRules = structuredClone([...nextRules]);
                    library.draft = structuredClone(result.schema);
                    persistReusableSchemaRules();
                    renderSchemaDraft();
                    renderSchemaRuleLibrary();
                    restoreLocalRulePromotionPresentation();
                    return;
                }
                const completion = beginSchemaPersistence("promotion", result.schema.id, previousSchemas, previousRules, nextSchemas, nextRules);
                persistLocalRulePromotion(ports.storage, { schemaKey: SCHEMA_LIBRARY_STORAGE_KEY,
                    schemaValue: serializeSchemaLibrary(nextSchemas), ruleKey: SCHEMA_RULE_STORAGE_KEY, ruleValue: JSON.stringify(nextRules) });
                library.schemas = structuredClone(nextSchemas);
                reusableSchemaRules = structuredClone([...nextRules]);
                renderSchemas();
                renderSchemaRuleLibrary();
                return completion.then(async () => {
                    await ports.settleCanonical?.(result.schema.id);
                    const focusReplacement = () => Array.from(schemaOwnerDocument?.querySelectorAll?.("button[data-rule-id]")
                        ?? ports.root.querySelectorAll("button[data-rule-id]"))
                        .find(({ dataset }) => dataset.ruleId === result.replacementRuleId && dataset.propertyPath === propertyPath)
                        ?.focus({ preventScroll: true });
                    ports.scheduleFrame(() => ports.scheduleFrame(focusReplacement));
                    return () => {
                        if (pendingLocalRulePromotion?.generation === generation) {
                            if (schemaResult)
                                schemaResult.textContent = `Promoted ${sourceRuleId} to reusable rule ${result.replacementRuleId}.`;
                            restoreLocalRulePromotionPresentation(result.replacementRuleId);
                        }
                        ports.scheduleFrame(() => ports.scheduleFrame(focusReplacement));
                    };
                });
            },
        });
        return true;
    }
    function persistPublishedGuidedValidation(result) {
        const rule = result.schema.rules[0];
        if (!rule)
            return Promise.resolve();
        const previousSchemas = structuredClone(library.schemas), previousRules = structuredClone(reusableSchemaRules);
        const previousSchema = result.destination.previousSchemaId ? library.schemas.find(({ id }) => id === result.destination.previousSchemaId) : undefined;
        const assignment = { id: result.assignment.id, name: result.assignment.name, sourceId: result.assignment.sourceId,
            eventName: result.assignment.eventName, target: result.assignment.target, priority: result.assignment.priority,
            versionPolicy: result.assignment.versionPolicy, enabled: true,
            ...(result.assignment.domainCondition ? { domainCondition: result.assignment.domainCondition } : {}),
            ...(result.assignment.pathnameCondition ? { pathnameCondition: result.assignment.pathnameCondition } : {}),
            ...(result.assignment.pathConditions ? { pathConditions: result.assignment.pathConditions } : {}) };
        const attachedRule = guidedAttachedRule(rule, result.reusableRules[0]?.name ?? `${rule.path} requirement`, `local-rule:${result.schema.id}:${rule.path}`);
        const currentDraft = previousSchema?.workingDraft;
        const assignments = assignmentDraftAfterGuidedSave(currentDraft?.assignments ?? previousSchema?.assignments ?? [], assignment, result.destination.assignmentAction);
        const document = mergeGuidedDocument(currentDraft?.document ?? previousSchema?.document ?? { type: "object" }, guidedPropertyDocument(rule.path, rule.expectedType));
        const attachedRules = [...(currentDraft?.attachedRules ?? previousSchema?.attachedRules ?? []).filter((candidate) => candidate.id !== attachedRule.id || candidate.propertyPath !== attachedRule.propertyPath), attachedRule];
        const schema = previousSchema
            ? updateSchemaWorkingDraft(previousSchema, { document, assignments, attachedRules }, `Add ${rule.path} validation`)
            : { id: result.schema.id, name: result.schema.name, version: 1, document: { type: "object" }, assignments: [], published: false,
                workingDraft: { baseVersion: 0, sourceVersion: 0, document, assignments, attachedRules, pendingChanges: [`Add ${rule.path} validation`] } };
        const nextSchemas = [...library.schemas.filter(({ id }) => id !== schema.id), schema];
        const published = result.reusableRules[0];
        const nextRules = published ? [...reusableSchemaRules.filter(({ id }) => id !== published.id),
            { id: published.id, name: published.name, kind: attachedRule.operator ?? "required", version: published.version, enabled: published.enabled ?? true,
                attachments: [schema.id], ...(attachedRule.operator ? { operator: attachedRule.operator } : {}),
                ...(attachedRule.parameters ? { parameters: attachedRule.parameters } : {}), ...(attachedRule.allowedValues ? { allowedValues: attachedRule.allowedValues } : {}),
                ...(attachedRule.severity ? { severity: attachedRule.severity } : {}), ...(attachedRule.message ? { message: attachedRule.message } : {}),
                ...(attachedRule.conditionGroup ? { conditionGroup: attachedRule.conditionGroup } : {}) }] : reusableSchemaRules;
        applyPersistenceSnapshot(nextSchemas, nextRules);
        return beginSchemaPersistence("guided", schema.id, previousSchemas, previousRules, nextSchemas, nextRules);
    }
    const guidedDocumentTypes = (value) => {
        if (Array.isArray(value))
            return ["array"];
        if (value === null)
            return ["null"];
        if (typeof value === "object")
            return ["object", ...Object.values(value).flatMap(guidedDocumentTypes)];
        return [typeof value];
    };
    const guidedSchemaCandidate = (event, schema) => {
        const assignment = schema.assignments.find((candidate) => candidate.sourceId === event.sourceId && candidate.eventName === event.name && candidate.enabled !== false);
        return assignment ? { schema, assignment, typeCoverage: new Set(guidedDocumentTypes(event.payload)).size } : undefined;
    };
    const guidedSchemaCandidates = (event) => library.schemas.map((schema) => guidedSchemaCandidate(event, schema)).filter((candidate) => Boolean(candidate));
    const guidedSchemaPropertyTypes = (document, prefix = "") => Object.entries(document.properties ?? {}).reduce((types, [name, child]) => {
        const path = prefix ? `${prefix}.${name}` : name, type = child.type === "string" ? "String" : child.type === "number" ? "Number"
            : child.type === "boolean" ? "Boolean" : child.type === "array" ? "Array" : child.type === "object" ? "Object" : undefined;
        if (type)
            types[path] = type;
        return { ...types, ...guidedSchemaPropertyTypes(child, path) };
    }, {});
    const guidedUiCandidate = (schema) => {
        const editable = schema.workingDraft ? schemaEditorDraft(schema) : schema;
        return {
            id: schema.id, name: schema.name, version: schema.version, target: editable.assignments[0]?.target ?? "payload",
            propertyTypes: guidedSchemaPropertyTypes(editable.document), assignments: editable.assignments.map((assignment) => ({
                ...(assignment.id ? { id: assignment.id } : {}), ...(assignment.name ? { name: assignment.name } : {}), sourceId: assignment.sourceId,
                eventName: assignment.eventName, target: assignment.target, ...(assignment.domainCondition ? { domainCondition: assignment.domainCondition } : {}),
                ...(assignment.pathnameCondition ? { pathnameCondition: assignment.pathnameCondition } : {}), ...(assignment.pathConditions ? { pathConditions: assignment.pathConditions } : {}),
                ...(assignment.priority !== undefined ? { priority: assignment.priority } : {}), ...(assignment.versionPolicy ? { versionPolicy: assignment.versionPolicy } : {}),
                ...(assignment.enabled !== undefined ? { enabled: assignment.enabled } : {})
            }))
        };
    };
    const guidedEvent = (event) => structuredClone(event);
    const guidedUiEvent = (event) => ({ id: event.id, sourceId: event.sourceId, name: event.name,
        pageUrl: event.pageUrl ?? globalThis.location?.href ?? "https://invalid.local/", payload: event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
            ? structuredClone(event.payload) : {} });
    const openGuidedValidationForEvent = async (event, schema) => {
        event = guidedEvent(event);
        const selected = schema ?? selectedGuidedContinuation(guidedContinuationSelections, event, library.schemas) ?? guidedSchemaCandidates(event)[0]?.schema;
        if (selected)
            persistGuidedContinuation(event, selected.id);
        guidedPropertyReturn = undefined;
        if (guidedValidationRoot) {
            guidedValidationRoot.hidden = false;
            guidedValidationRoot.dataset.eventId = event.id;
            guidedValidationRoot.dataset.schemaId = selected?.id ?? "";
        }
        guidedValidationFlow.open(guidedUiEvent(event), selected ? guidedUiCandidate(selected) : undefined);
    };
    const openGuidedValidationForProperty = async (event, schema, propertyPath, returnToSchema = true) => {
        event = guidedEvent(event);
        if (schema)
            persistGuidedContinuation(event, schema.id);
        if (guidedValidationRoot) {
            guidedValidationRoot.hidden = false;
            guidedValidationRoot.dataset.eventId = event.id;
            guidedValidationRoot.dataset.schemaId = schema?.id ?? "";
        }
        guidedValidationFlow.openProperty(guidedUiEvent(event), propertyPath, schema ? guidedUiCandidate(schema) : undefined);
        if (returnToSchema)
            guidedPropertyReturn = schema ? { kind: "schema", schemaId: schema.id, propertyPath, generation: lifecycle.generation() } : undefined;
    };
    const guidedDraftContinuationForEvent = (event) => {
        const schema = selectedGuidedContinuation(guidedContinuationSelections, event, library.schemas);
        return schema?.workingDraft ? { schemaId: schema.id, schemaName: schema.name, schemaVersion: schema.version, pendingChanges: schema.workingDraft.pendingChanges.length,
            addProperty: () => { guidedValidationFlow.open(guidedUiEvent(event), guidedUiCandidate(schema)); }, review: () => openGuidedDraft(schema),
            publish: () => { openGuidedDraft(schema); openSchemaRevisionReview(); }, useDifferent: () => openGuidedContinuationPicker(event) } : undefined;
    };
    const finishGuidedValidationSave = (result) => {
        persistGuidedContinuation({ sourceId: result.assignment.sourceId, name: result.assignment.eventName }, result.schema.id);
        ports.guidedSaved?.(result.destination.kind === "new" ? `Draft ${result.schema.name} was created.` : `Validation was added to ${result.schema.name} draft.`);
        if (guidedPropertyReturn?.generation === lifecycle.generation() && guidedPropertyReturn.kind === "capture") {
            const snapshot = guidedPropertyReturn;
            guidedPropertyReturn = undefined;
            ports.restoreGuidedCapture(snapshot.eventId, snapshot.propertyPath);
        }
        else if (guidedPropertyReturn?.generation === lifecycle.generation() && guidedPropertyReturn.kind === "schema" && guidedPropertyReturn.schemaId === result.schema.id) {
            restoreGuidedPropertyReturn();
        }
        if (schemaResult)
            schemaResult.textContent = result.destination.kind === "new" ? `Draft ${result.schema.name} was created.` : `Validation was added to ${result.schema.name} draft.`;
    };
    const renderSchemaValidationRecords = () => {
        if (!schemaValidationRecordList || !schemaOwnerDocument)
            return;
        for (const dispose of capturedContinuationRowDisposers.splice(0))
            dispose();
        for (const dispose of capturedContinuationDialogDisposers.splice(0))
            dispose();
        schemaValidationRecordList.replaceChildren(...schemaValidationRecords.map((record) => {
            const item = schemaOwnerDocument.createElement("li"), summary = schemaOwnerDocument.createElement("span"), continueButton = schemaOwnerDocument.createElement("button");
            summary.textContent = `${record.eventName} · ${record.state} · ${record.schemaName ? `${record.schemaName} v${record.schemaVersion} · ${record.target ?? "payload"}` : "No matching schema"}${record.assignmentId ? ` · assignment ${record.assignmentName ?? record.assignmentId} (${record.assignmentId})` : ""}${record.assignmentEvidence ? ` · ${record.assignmentEvidence}` : ""} · ${record.checkedAt}`;
            if (ports.prepareCapturedValidationContinuation) {
                continueButton.type = "button";
                continueButton.textContent = "Continue in project";
                continueButton.disabled = !record.schemaId || !record.evaluated;
                const review = () => { void reviewCapturedValidationContinuation(record, continueButton); };
                continueButton.addEventListener("click", review);
                capturedContinuationRowDisposers.push(() => continueButton.removeEventListener("click", review));
                item.append(summary, continueButton);
            }
            else
                item.append(summary);
            return item;
        }));
    };
    async function reviewCapturedValidationContinuation(record, trigger) {
        if (!ports.prepareCapturedValidationContinuation || !guidedValidationRoot || !schemaOwnerDocument || !lifecycle.isMounted())
            return;
        const generation = lifecycle.generation();
        let continuation;
        try {
            continuation = await ports.prepareCapturedValidationContinuation(structuredClone(record));
        }
        catch (error) {
            if (lifecycle.isMounted() && generation === lifecycle.generation() && schemaResult)
                schemaResult.textContent = error instanceof Error ? error.message : String(error);
            return;
        }
        if (!lifecycle.isMounted() || generation !== lifecycle.generation())
            return;
        for (const dispose of capturedContinuationDialogDisposers.splice(0))
            dispose();
        const dialog = schemaOwnerDocument.createElement("dialog"), heading = schemaOwnerDocument.createElement("h4"), summary = schemaOwnerDocument.createElement("p"), review = schemaOwnerDocument.createElement("p"), name = schemaOwnerDocument.createElement("input"), confirm = schemaOwnerDocument.createElement("button"), cancel = schemaOwnerDocument.createElement("button");
        const select = (labelText, values, optional = false) => {
            const label = schemaOwnerDocument.createElement("label"), control = schemaOwnerDocument.createElement("select");
            label.textContent = labelText;
            if (optional) {
                const option = schemaOwnerDocument.createElement("option");
                option.value = "";
                option.textContent = `No ${labelText.toLowerCase()}`;
                control.append(option);
            }
            for (const value of values) {
                const option = schemaOwnerDocument.createElement("option");
                option.value = value.id;
                option.textContent = value.name;
                control.append(option);
            }
            if (!optional && values[0])
                control.value = values[0].id;
            label.append(control);
            dialog.append(label);
            return control;
        };
        heading.textContent = "Continue captured validation in project";
        summary.textContent = continuation.summary;
        review.textContent = continuation.review;
        name.value = continuation.suggestedName;
        name.setAttribute("aria-label", "Test case name");
        dialog.append(heading, summary, review, name);
        const destination = select("Destination", [{ id: "fixture", name: "Event validation Test case" }, { id: "profile", name: "Profile requirements" }]), event = select("Event", continuation.events), page = select("Page", continuation.pages, true), step = select("Flow step", continuation.flowSteps, true), profile = select("Profile", continuation.profiles, true);
        confirm.type = cancel.type = "button";
        confirm.textContent = "Create Test case and open in Specification Studio";
        cancel.textContent = "Cancel";
        const close = (restoreFocus) => { for (const dispose of capturedContinuationDialogDisposers.splice(0))
            dispose(); dialog.close(); dialog.remove(); if (restoreFocus)
            trigger.focus({ preventScroll: true }); };
        const selectDestination = () => {
            const toProfile = destination.value === "profile";
            name.hidden = Boolean(toProfile);
            event.parentElement.hidden = toProfile;
            page.parentElement.hidden = toProfile;
            step.parentElement.hidden = toProfile;
            confirm.textContent = toProfile ? "Add requirements and open Profile" : "Create Test case and open in Specification Studio";
        };
        const confirmContinuation = () => {
            const toProfile = destination.value === "profile";
            if (toProfile && !profile.value) {
                summary.textContent = "Choose a Profile for the evaluated requirements.";
                return;
            }
            confirm.disabled = true;
            void continuation.commit({ destination: toProfile ? "profile" : "fixture", name: name.value.trim(), eventId: event.value, ...(page.value ? { pageId: page.value } : {}), ...(step.value ? { flowStepId: step.value } : {}), ...(profile.value ? { profileId: profile.value } : {}) })
                .then(({ entityName }) => { if (lifecycle.isMounted() && generation === lifecycle.generation()) {
                close(false);
                if (schemaResult)
                    schemaResult.textContent = `Saved evaluated capture evidence in ${entityName}; opening it in Specification Studio.`;
            } }, (error) => { if (lifecycle.isMounted() && generation === lifecycle.generation()) {
                confirm.disabled = false;
                summary.textContent = error instanceof Error ? error.message : String(error);
            } });
        };
        const cancelContinuation = () => close(true);
        destination.addEventListener("change", selectDestination);
        confirm.addEventListener("click", confirmContinuation);
        cancel.addEventListener("click", cancelContinuation);
        capturedContinuationDialogDisposers.push(() => destination.removeEventListener("change", selectDestination), () => confirm.removeEventListener("click", confirmContinuation), () => cancel.removeEventListener("click", cancelContinuation), () => { dialog.close(); dialog.remove(); });
        dialog.append(confirm, cancel);
        guidedValidationRoot.replaceChildren(dialog);
        dialog.showModal();
        name.focus({ preventScroll: true });
    }
    const recheckCapturedSchemaValidation = (events = []) => {
        const checkedAt = new Date().toISOString(), issues = [];
        const records = events.map((event) => {
            const override = manualSchemaOverrides[event.id], candidates = override ? library.schemas.filter(({ id }) => id === override) : library.schemas;
            const result = validateEvent({ sourceId: event.sourceId, eventName: event.name, payload: event.payload, rawInput: event.rawInput }, candidates, event.pageUrl);
            issues.push(...result.issues.map((issue) => `${event.name} · ${issue.instancePath || "root"} · ${issue.message}`));
            return { eventId: event.id, eventName: event.name, state: result.state, checkedAt, ...(result.schema ? { schemaId: result.schema.id, schemaName: result.schema.name,
                    schemaVersion: result.schema.version } : {}), issueCodes: result.issues.map((issue) => issue.rule ?? issue.schemaLocation) };
        });
        schemaValidationRecords = [...schemaValidationRecords, ...records].slice(-50);
        ports.storage.setItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY, JSON.stringify(schemaValidationRecords));
        schemaValidationIssues?.replaceChildren(...issues.map((textContent) => Object.assign(schemaOwnerDocument.createElement("li"), { textContent })));
        renderSchemaValidationRecords();
        if (schemaResult)
            schemaResult.textContent = events.length ? `Rechecked ${events.length} captured events.` : "No captured events are available to recheck.";
        return structuredClone(records);
    };
    const recheckCapturedSchemaValidationFromControl = () => { recheckCapturedSchemaValidation(); };
    const createSchemaDraft = () => {
        const created = createSchema("", 1, { type: "object" }), transient = { ...created, published: false,
            workingDraft: { name: "", baseVersion: 1, sourceVersion: 1, document: { type: "object" }, assignments: [], pendingChanges: [] } };
        library.activeSchemaId = undefined;
        library.draft = transient;
        selectedSchemaPropertyPath = "";
        renderSchemas();
        schemaEditorName?.focus({ preventScroll: true });
    };
    function schemaDocumentPaths(document) { return schemaPropertyRows(document).map(({ canonicalPath }) => canonicalPath); }
    function schemaPropertyAt(document, path) { return schemaPropertyRows(document).find(({ canonicalPath }) => canonicalPath === normalizedRulePickerPath(path))?.schema; }
    function schemaDocumentFromValue(value) {
        if (Array.isArray(value))
            return { type: "array", items: value.length ? schemaDocumentFromValue(value[0]) : {} };
        if (!value || typeof value !== "object")
            return { type: typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string" };
        return { type: "object", properties: Object.fromEntries(Object.entries(value).map(([name, child]) => [name, schemaDocumentFromValue(child)])) };
    }
    function openSchemaFromSource(source) {
        const inferred = schemaDocumentFromValue(source.payload), document = inferred.type === "object"
            ? inferred : { type: "object", properties: { value: inferred } };
        const assignment = { sourceId: source.sourceId, eventName: source.eventName, target: "payload" };
        const created = createSchema(`${source.name} schema`, 1, document), schema = { ...created, published: false,
            assignments: [assignment], workingDraft: { baseVersion: 1, sourceVersion: 1, document: structuredClone(document),
                assignments: [assignment], pendingChanges: ["Create schema from captured source"] } };
        library.activeSchemaId = undefined;
        library.draft = schema;
        selectedSchemaPropertyPath = Object.keys(document.properties ?? {})[0] ?? "value";
        ports.showSchemasView();
        renderSchemas();
        if (schemaResult)
            schemaResult.textContent = `${source.label} fields loaded into a new schema draft.`;
        schemaEditorName?.focus({ preventScroll: true });
        return structuredClone(schema);
    }
    function openNewSchemaEditor() { editorRoute.open(createSchemaButton ?? undefined); createSchemaDraft(); }
    function defineSchemaProperty(document, definition) {
        return addManualProperty(document, [], definition);
    }
    function schemaPropertyType(document, path) {
        const value = schemaPropertyAt(document, path);
        return value?.type;
    }
    function captureSchemaPropertyInteractionReturn(path, triggerLabel) {
        schemaPropertyInteractionReturn = { schemaId: active().id,
            path, triggerLabel, editorScroll: schemaEditor?.scrollTop ?? 0, treeScroll: schemaPropertyTree?.scrollTop ?? 0, detailScroll: schemaDetail?.scrollTop ?? 0 };
    }
    function restoreSchemaPropertyInteractionReturn() {
        const restoration = schemaPropertyInteractionReturn;
        if (!restoration || restoration.schemaId !== library.activeSchemaId)
            return;
        selectedSchemaPropertyPath = restoration.path;
        if (schemaEditor)
            schemaEditor.scrollTop = restoration.editorScroll;
        schemaPropertyTree && (schemaPropertyTree.scrollTop = restoration.treeScroll);
        schemaDetail && (schemaDetail.scrollTop = restoration.detailScroll);
        renderSchemas();
    }
    function finishSchemaPropertyInteractionReturn() { restoreSchemaPropertyInteractionReturn(); schemaPropertyInteractionReturn = undefined; }
    function closeSchemaPropertyRulePickerInternal(restore = true) { if (restore)
        finishSchemaPropertyInteractionReturn(); closeSchemaPropertyRulePicker(); }
    function closeSchemaPropertyRulePickerForCommit() { closeSchemaPropertyRulePickerInternal(true); }
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
        library.schemas = library.schemas.map((schema) => schema.id !== schemaId ? schema : { ...schema,
            assignments: schema.assignments.flatMap((assignment) => assignment.id !== assignmentId ? [assignment] : (() => {
                const changed = mutate(assignment);
                return changed ? [changed] : [];
            })()),
        });
        persistSchemaLibrary();
        renderSchemas();
    };
    const renderSchemaAssignments = () => {
        const assignments = library.schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment })));
        if (schemaAssignmentSchema?.ownerDocument)
            schemaAssignmentSchema.replaceChildren(...library.schemas.filter(({ published }) => published !== false).map((schema) => {
                const option = schemaAssignmentSchema.ownerDocument.createElement("option");
                option.value = schema.id;
                option.textContent = `${schema.name} version ${schema.version}`;
                return option;
            }));
        if (schemaAssignmentList?.ownerDocument)
            schemaAssignmentList.replaceChildren(...assignments.map(({ schema, assignment }) => {
                const item = schemaAssignmentList.ownerDocument.createElement("li");
                const summary = schemaAssignmentList.ownerDocument.createElement("span");
                summary.textContent = `${assignment.name ?? assignment.id ?? "Assignment"} · ${assignment.sourceId}/${assignment.eventName} · ${assignment.target} · ${assignmentDataConditionSummary(assignment)} · ${assignment.domainCondition ?? "any"}${assignment.pathnameCondition ?? "any"} · priority ${assignment.priority ?? 0} · ${assignment.versionPolicy ?? "pinned"} · ${assignment.enabled === false ? "disabled" : "enabled"} · ${schema.name}`;
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
                    library.schemas = library.schemas.map((candidate) => candidate.id !== schema.id ? candidate : { ...candidate,
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
        const schema = library.schemas.find((candidate) => candidate.id === schemaAssignmentSchema?.value) ?? library.schemas[0];
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
        library.schemas = library.schemas.map((candidate) => candidate.id !== schema.id ? candidate : { ...candidate,
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
        const summaryFor = (rule) => `${rule.name} v${rule.version} · ${reusableRuleMetadata(rule, rule.applicableType ?? "string")}`;
        const query = schemaRuleSearch?.value.trim().toLowerCase() ?? "";
        const visible = reusableSchemaRules.filter((rule) => summaryFor(rule).toLowerCase().includes(query));
        for (const dispose of schemaRuleRowDisposers.splice(0))
            dispose();
        if (!schemaRuleList?.ownerDocument) {
            if (schemaRuleList)
                schemaRuleList.textContent = visible.map(summaryFor).join("\n");
            return;
        }
        schemaRuleList.replaceChildren(...visible.map((rule) => {
            const item = schemaRuleList.ownerDocument.createElement("li"), summary = schemaRuleList.ownerDocument.createElement("span");
            item.dataset.ruleId = rule.id;
            summary.textContent = summaryFor(rule);
            item.append(summary);
            const action = (label, run) => {
                const button = schemaRuleList.ownerDocument.createElement("button");
                button.type = "button";
                button.textContent = label;
                listenRule(button, "click", run);
                item.append(button);
            };
            action("Edit", () => { editReusableSchemaRule(rule.id); });
            if (reviewReusableRuleSync(library.schemas, rule).schemaCount) {
                action("Sync attached library.schemas and publish revisions", () => { openReusableRuleSyncReview(rule.id); });
            }
            action("Duplicate", () => { reusableSchemaRules = [...reusableSchemaRules, { ...structuredClone(rule), id: ports.createRuleId(), name: `${rule.name} copy`, version: 1, attachments: [] }]; persistReusableSchemaRules(); renderSchemaRuleLibrary(); });
            action("Export", () => ports.downloadSchema(rule, `${rule.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-v${rule.version}.json`));
            action(rule.enabled ? "Disable" : "Enable", () => { reusableSchemaRules = reusableSchemaRules.map((candidate) => candidate.id === rule.id ? { ...candidate, enabled: !candidate.enabled } : candidate); persistReusableSchemaRules(); renderSchemaRuleLibrary(); });
            action("Delete", () => { requestSchemaRuleDeletion(rule.id); });
            return item;
        }));
    };
    const expansionReusableRules = () => structuredClone(reusableSchemaRules);
    const promotionReusableRules = expansionReusableRules;
    const storedReusableRule = (id) => reusableSchemaRules.find((rule) => rule.id === id);
    const persistSchemaAndRuleLibraries = () => { persistSchemaLibrary(); persistReusableSchemaRules(); };
    const schemaRuleTypeForAttachment = (schema, propertyPath) => {
        const row = schemaPropertyRows(schema.workingDraft?.document ?? schema.document).find(({ canonicalPath }) => canonicalPath === normalizedRulePickerPath(propertyPath));
        return ["string", "number", "array", "object", "boolean"].includes(row?.schema.type)
            ? row.schema.type : "string";
    };
    const attachReusableRule = (schemaId, ruleId, propertyPath, suppliedRule) => {
        const rule = suppliedRule ?? storedReusableRule(ruleId), storedSchema = library.schemas.find(({ id }) => id === schemaId), schema = storedSchema ?? (library.draft?.id === schemaId ? library.draft : undefined);
        if (!rule || !schema)
            return false;
        if (propertyPath && !applicablePropertyTypesForRule(rule).includes(schemaRuleTypeForAttachment(schema, propertyPath)))
            return false;
        const canonicalPropertyPath = propertyPath ? normalizedRulePickerPath(propertyPath) : undefined;
        const sourceRules = schema.workingDraft?.attachedRules ?? schema.attachedRules ?? [], attachedRules = [...sourceRules
                .filter((attached) => attached.id !== rule.id || normalizedRulePickerPath(attached.propertyPath ?? "") !== canonicalPropertyPath), { id: rule.id, name: rule.name, version: rule.version,
                ...(canonicalPropertyPath ? { propertyPath: canonicalPropertyPath } : {}), ...(rule.operator ? { operator: rule.operator } : {}),
                ...(rule.parameters ? { parameters: rule.parameters } : {}), ...(rule.severity ? { severity: rule.severity } : {}),
                ...(rule.allowedValues ? { allowedValues: structuredClone(rule.allowedValues) } : {}), ...(rule.comparison ? { comparison: rule.comparison } : {}),
                ...(rule.limit !== undefined ? { limit: rule.limit } : {}), ...(rule.applicableType ? { applicableType: rule.applicableType } : {}),
                ...(rule.message ? { message: rule.message } : {}), ...(rule.conditionGroup ? { conditionGroup: structuredClone(rule.conditionGroup) } : {}), enabled: rule.enabled }];
        const updated = updateSchemaWorkingDraft(schema, { attachedRules }, `Attach ${rule.name} to ${propertyPath ?? "schema"}`);
        if (!storedSchema) {
            library.draft = structuredClone(updated);
            renderSchemaDraft();
            return true;
        }
        library.schemas = library.schemas.map((candidate) => candidate.id === schemaId ? updated : candidate);
        library.draft = schemaEditorDraft(updated);
        persistSchemaAndRuleLibraries();
        renderSchemas();
        return true;
    };
    const updateAttachedRule = (schemaId, ruleId, enabled) => {
        let changed = false;
        library.schemas = library.schemas.map((schema) => {
            if (schema.id !== schemaId || !schema.attachedRules)
                return schema;
            return { ...schema, attachedRules: schema.attachedRules.map((rule) => { if (rule.id !== ruleId)
                    return rule; changed = true; return { ...rule, enabled }; }) };
        });
        if (changed) {
            persistSchemaAndRuleLibraries();
            renderSchemas();
        }
        return changed;
    };
    const editReusableSchemaRule = (id) => {
        const rule = storedReusableRule(id);
        if (!rule)
            return false;
        editingReusableSchemaRuleId = id;
        openNewSchemaRuleEditor();
        if (schemaRuleName)
            schemaRuleName.value = rule.name;
        if (schemaRuleParameters)
            schemaRuleParameters.value = rule.parameters ?? "";
        if (schemaRuleTypes)
            schemaRuleTypes.value = rule.applicableType ?? "string";
        if (schemaRuleOperator)
            schemaRuleOperator.value = rule.operator ?? "required";
        if (schemaRuleSeverity)
            schemaRuleSeverity.value = rule.severity ?? "error";
        if (schemaRuleMessage)
            schemaRuleMessage.value = rule.message ?? "";
        if (schemaRuleExamples)
            schemaRuleExamples.value = rule.examples ?? "";
        return true;
    };
    const attachedSchemaRuleType = (rule) => {
        const operator = rule.operator?.replaceAll("_", "-").toLowerCase();
        if (operator === "exact-value")
            return "Exact value";
        if (operator === "allowed-values")
            return "Allowed values";
        if (operator === "regular-expression" || operator === "regex")
            return "Regular expression";
        if (operator === "text-length")
            return "Text length";
        if (operator === "digits-only")
            return "Digits only";
        if (operator === "numeric-range")
            return "Numeric range";
        if (operator === "item-count")
            return "Item count";
        if (operator === "allow-undeclared-properties")
            return "Allow undeclared properties";
        return "Required";
    };
    const openAttachedSchemaRuleEditor = (schemaId, ruleId, path, trigger) => {
        const schema = library.schemas.find(({ id }) => id === schemaId), attached = (schema?.workingDraft?.attachedRules ?? schema?.attachedRules)?.find(({ id }) => id === ruleId);
        if (!schema || !attached)
            return false;
        if (storedReusableRule(ruleId)) {
            showSchemaSubview("schema-rule-library");
            return editReusableSchemaRule(ruleId);
        }
        const propertyPath = path ?? attached.propertyPath ?? "";
        selectedSchemaPropertyPath = schemaRulePickerPath = propertyPath;
        schemaRulePickerTrigger = trigger;
        editingAttachedLocalRule = attached;
        schemaRuleConfiguration = createRuleConfigurationFromAttachedRule(attachedSchemaRuleType(attached), schemaRuleTypeForAttachment(schema, propertyPath), attached);
        renderSchemaPropertyRulePicker();
        schemaPropertyRulePicker?.showModal();
        schemaPropertyRulePicker?.querySelector("input, select, textarea, button")?.focus({ preventScroll: true });
        return true;
    };
    const focusSchemaPropertyRule = (propertyPath) => { selectedSchemaPropertyPath = propertyPath.replace(/^\//, "").replaceAll("/", "."); renderSchemas(); };
    const focusSchemaPropertyRow = focusSchemaPropertyRule;
    const renderSchemaWorkflowRows = () => { renderSchemaRuleLibrary(); renderSchemaAssignments(); };
    const openNewSchemaRuleEditor = () => {
        if (!editingReusableSchemaRuleId)
            pendingRuleSnapshotMetadata = undefined;
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
            schemaRuleAttachments.replaceChildren(...library.schemas.map((schema) => {
                const option = schemaRuleAttachments.ownerDocument.createElement("option");
                option.value = schema.id;
                option.textContent = `${schema.name} v${schema.version}`;
                return option;
            }));
        schemaRuleName?.focus();
    };
    const beginNewReusableSchemaRule = () => {
        editingReusableSchemaRuleId = undefined;
        approvedRuleRevisionId = undefined;
        pendingRuleSnapshotMetadata = undefined;
        openNewSchemaRuleEditor();
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
        const previous = editingReusableSchemaRuleId ? storedReusableRule(editingReusableSchemaRuleId) : undefined;
        if (previous && approvedRuleRevisionId !== previous.id) {
            captureReusableRuleSnapshot();
            requestSchemaRuleRevision(previous.id, { name, kind: `${operator || "Required"}${parameters ? ` (${parameters})` : ""}`,
                ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
                ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments });
            return;
        }
        const rule = normalizeAllowedValuesRuleLibraryEntry({ id: previous?.id ?? ports.createRuleId(), name,
            kind: `${operator || "Required"}${parameters ? ` (${parameters})` : ""}`, version: (previous?.version ?? 0) + 1, enabled: previous?.enabled ?? true,
            ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
            ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments });
        pendingRuleSnapshotMetadata = previous ? { id: previous.id, version: previous.version, attachments: [...(previous.attachments ?? [])] } : undefined;
        reusableSchemaRules = [...reusableSchemaRules.filter(({ id }) => id !== rule.id), rule];
        if (updateSchemaRuleAttachments?.checked || rule.version === 1)
            library.schemas = library.schemas.map((schema) => {
                if (!attachments.includes(schema.id))
                    return schema;
                const attachedRules = [...(schema.attachedRules ?? []).filter(({ id }) => id !== rule.id),
                    { id: rule.id, name: rule.name, version: rule.version, ...(operator ? { operator } : {}),
                        ...(rule.parameters ? { parameters: rule.parameters } : {}), ...(rule.allowedValues ? { allowedValues: rule.allowedValues } : {}),
                        ...(severity ? { severity } : {}), ...(message ? { message } : {}), enabled: true }];
                return { ...schema, attachedRules };
            });
        editingReusableSchemaRuleId = undefined;
        persistSchemaAndRuleLibraries();
        renderSchemas();
        renderSchemaRuleLibrary();
        if (schemaRuleEditor)
            schemaRuleEditor.hidden = true;
    };
    const captureReusableRuleSnapshot = () => {
        const previous = editingReusableSchemaRuleId ? storedReusableRule(editingReusableSchemaRuleId) : undefined;
        if (previous)
            pendingRuleSnapshotMetadata = { id: previous.id, version: previous.version, attachments: [...(previous.attachments ?? [])] };
    };
    const captureReusableRuleSnapshotFromEditor = (event) => { if (event.target?.id === "schema-rule-save")
        captureReusableRuleSnapshot(); };
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
        approvedRuleRevisionId = undefined;
        const nextName = changes.name ?? previous.name;
        const previousParameters = previous.allowedValues?.map(String).join(",") ?? previous.parameters ?? "none";
        const nextParameters = changes.parameters ?? previous.parameters ?? "none";
        const nextExamples = changes.examples ?? previous.examples ?? "none";
        if (schemaRuleRevisionReviewSummary)
            schemaRuleRevisionReviewSummary.textContent =
                `${previous.name} v${previous.version} will become ${nextName} v${previous.version + 1}; parameters ${previousParameters} → ${nextParameters}; examples ${previous.examples ?? "none"} → ${nextExamples}.`;
        schemaRuleRevisionReview?.showModal();
        confirmSchemaRuleRevisionButton?.focus();
        return true;
    };
    const confirmReusableSchemaRuleRevision = () => {
        const pending = pendingSchemaRuleRevision;
        if (!pending)
            return;
        reusableSchemaRules = reusableSchemaRules.map((rule) => {
            if (rule.id !== pending.id)
                return rule;
            const revised = { ...rule, ...structuredClone(pending.changes), version: rule.version + 1,
                revisionHistory: [...(rule.revisionHistory ?? []), {
                        name: rule.name, kind: rule.kind, version: rule.version, ...(rule.enabled === false ? { enabled: false } : {}),
                        ...(rule.applicableType ? { applicableType: rule.applicableType } : {}), ...(rule.operator ? { operator: rule.operator } : {}),
                        ...(rule.parameters ? { parameters: rule.parameters } : {}), ...(rule.severity ? { severity: rule.severity } : {}),
                        ...(rule.message ? { message: rule.message } : {}), ...(rule.examples ? { examples: rule.examples } : {}),
                    }], };
            if (pending.changes.parameters !== undefined && (pending.changes.operator ?? rule.operator) === "allowed-values")
                delete revised.allowedValues;
            return normalizeAllowedValuesRuleLibraryEntry(revised);
        });
        approvedRuleRevisionId = pending.id;
        if (editingReusableSchemaRuleId === pending.id) {
            editingReusableSchemaRuleId = undefined;
            if (schemaRuleEditor)
                schemaRuleEditor.hidden = true;
        }
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
        const affected = library.schemas.filter((schema) => schemaIds.includes(schema.id) && schema.attachedRules?.some((item) => item.id === id));
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
        library.schemas = library.schemas.map((schema) => {
            if (!pending.schemaIds.includes(schema.id) || !schema.attachedRules)
                return schema;
            return { ...schema, attachedRules: schema.attachedRules.map((attached) => attached.id !== rule.id ? attached : {
                    ...attached, name: rule.name, version: rule.version, ...(rule.operator ? { operator: rule.operator } : {}),
                    ...(rule.parameters ? { parameters: rule.parameters } : {}), ...(rule.severity ? { severity: rule.severity } : {}),
                    ...(rule.message ? { message: rule.message } : {}), enabled: rule.enabled,
                }) };
        });
        approvedRuleAttachmentUpdateId = pending.id;
        pendingSchemaRuleUpgrade = undefined;
        persistSchemaLibrary();
        schemaRuleUpgradeReview?.close();
    };
    const cancelReusableSchemaRuleUpgrade = () => { pendingSchemaRuleUpgrade = undefined; schemaRuleUpgradeReview?.close(); };
    const requestSchemaRuleSync = (id) => {
        const rule = reusableSchemaRules.find((candidate) => candidate.id === id);
        if (!rule)
            return false;
        const review = reviewReusableRuleSync(library.schemas, rule);
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
    const openReusableRuleSyncReview = requestSchemaRuleSync;
    const confirmReusableSchemaRuleSync = () => {
        const pending = pendingSchemaRuleSync;
        if (!pending)
            return;
        const settledRule = reusableSchemaRules.find((rule) => rule.id === pending.rule.id);
        if (!settledRule)
            throw new Error("The reusable rule was removed after review");
        const settledReview = reviewReusableRuleSync(library.schemas, settledRule);
        if (JSON.stringify(settledReview) !== JSON.stringify(pending.review))
            throw new Error("The attached library.schemas changed after review");
        library.schemas = publishReusableRuleSync(library.schemas, settledRule, settledReview);
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
        const attached = library.schemas.filter((schema) => rule.attachments?.includes(schema.id)
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
        const candidates = [...library.schemas.filter((schema) => !importedSchemas.some(({ id }) => id === schema.id)), ...importedSchemas];
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
        library.schemas = structuredClone(pendingSchemaImport.schemas);
        reusableSchemaRules = structuredClone(pendingSchemaImport.rules);
        pendingSchemaImport = undefined;
        persistSchemaLibrary();
        persistReusableSchemaRules();
        renderSchemas();
        renderSchemaRuleLibrary();
        schemaImportReview?.close();
        if (schemaResult)
            schemaResult.textContent = "Schema Library replaced.";
    };
    const appendSchemaLibrary = () => {
        if (!pendingSchemaImport)
            return;
        library.schemas = [...library.schemas.filter((schema) => !pendingSchemaImport.schemas.some(({ id }) => id === schema.id)),
            ...structuredClone(pendingSchemaImport.schemas)];
        reusableSchemaRules = [...reusableSchemaRules.filter((rule) => !pendingSchemaImport.rules.some(({ id }) => id === rule.id)),
            ...structuredClone(pendingSchemaImport.rules)];
        pendingSchemaImport = undefined;
        persistSchemaLibrary();
        persistReusableSchemaRules();
        renderSchemas();
        renderSchemaRuleLibrary();
        schemaImportReview?.close();
        if (schemaResult)
            schemaResult.textContent = "Schema Library appended.";
    };
    const cancelSchemaLibraryImport = () => { pendingSchemaImport = undefined; schemaImportReview?.close(); };
    const requestSchemaDeletion = (id) => {
        const schema = library.schemas.find((candidate) => candidate.id === id);
        if (!schema)
            return false;
        const children = library.schemas.filter(({ parentSchemaId }) => parentSchemaId === id);
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
        library.schemas = library.schemas.filter(({ id }) => id !== schema.id);
        pendingSchemaDeletion = undefined;
        if (library.activeSchemaId === schema.id) {
            library.activeSchemaId = undefined;
            library.draft = undefined;
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
        schemaExportTrigger?.focus({ preventScroll: true });
        schemaExportTrigger = undefined;
    }
    function openStandardSchemaExportReview(scope, schema) {
        const review = schema ? inspectJsonSchemaExport(schema, library.schemas) : exportJsonSchemaBundle(library.schemas).compatibility;
        pendingStandardSchemaExport = { scope, ...(schema ? { schema } : {}), review };
        if (!schemaExportReview?.ownerDocument)
            return;
        const document = schemaExportReview.ownerDocument, heading = document.createElement("h4"), summary = document.createElement("p"), conversionList = document.createElement("ul"), omittedList = document.createElement("ul");
        heading.textContent = "JSON Schema Draft 2020-12 compatibility review";
        summary.textContent = scope === "library"
            ? `3rd-party validation format · ${library.schemas.filter((item) => item.published !== false && item.version > 0).length} schema resources`
            : `${schema?.name} · current published revision ${schema?.version}`;
        conversionList.setAttribute("aria-label", "Standard export conversions");
        conversionList.append(...review.conversions.map(({ ruleId, propertyPath, conversion }) => Object.assign(document.createElement("li"), { textContent: `${ruleId} at ${propertyPath}: ${conversion}` })));
        if (!review.conversions.length)
            conversionList.append(Object.assign(document.createElement("li"), { textContent: "No severity or issue-message conversions" }));
        omittedList.setAttribute("aria-label", "Unsupported rules omitted from standard export");
        omittedList.append(...review.omitted.map(({ ruleName, propertyPath, behavior }) => Object.assign(document.createElement("li"), { textContent: `${ruleName} at ${propertyPath}: unsupported ${behavior}; omitted` })));
        if (!review.omitted.length)
            omittedList.append(Object.assign(document.createElement("li"), { textContent: "No unsupported rules" }));
        const confirm = document.createElement("button");
        confirm.type = "button";
        confirm.textContent = review.omitted.length ? "Export without unsupported rules" : "Export JSON Schema Draft 2020-12";
        const cancel = schemaExportReview.ownerDocument.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        confirm.addEventListener("click", () => {
            const pending = pendingStandardSchemaExport;
            if (!pending)
                return;
            if (pending.scope === "library") {
                const exported = exportJsonSchemaBundle(library.schemas);
                downloadSchemaJson(exported.document, exported.filename);
                finishSchemaExport(`Exported JSON Schema Draft 2020-12 bundle · ${exported.resourceIds.length} schemas · ${omittedRuleStatus(exported.compatibility.omitted.length)}.`);
            }
            else if (pending.schema) {
                const exported = exportJsonSchemaResource(pending.schema, library.schemas);
                downloadSchemaJson(exported.document, exported.filename);
                finishSchemaExport(`Exported JSON Schema Draft 2020-12 · ${pending.schema.name} revision ${pending.schema.version} · ${omittedRuleStatus(exported.compatibility.omitted.length)}.`);
            }
        });
        cancel.addEventListener("click", () => { pendingStandardSchemaExport = undefined; schemaExportReview.close(); schemaExportTrigger?.focus({ preventScroll: true }); });
        schemaExportReview.replaceChildren(heading, summary, conversionList, omittedList, confirm, cancel);
        schemaExportReview.showModal();
        confirm.focus({ preventScroll: true });
    }
    function openSchemaExportChoices(trigger, schema) {
        schemaExportTrigger = trigger;
        if (!schemaExportChoices?.ownerDocument)
            return;
        const document = schemaExportChoices.ownerDocument, heading = document.createElement("h4"), extension = document.createElement("button"), extensionDescription = document.createElement("p"), standard = document.createElement("button"), standardDescription = document.createElement("p");
        heading.textContent = schema ? `Export ${schema.name}` : "Export Schema Library";
        extension.type = "button";
        extension.textContent = schema ? "Extension schema package" : "Extension backup";
        extensionDescription.textContent = schema ? "For restoring this schema and its extension dependencies." : "For complete extension backup and restore.";
        standard.type = "button";
        standard.textContent = schema ? "JSON Schema Draft 2020-12" : "JSON Schema Draft 2020-12 bundle";
        standardDescription.textContent = "For third-party standards-based validation; not extension configuration.";
        if (schema?.published === false || schema?.version === 0) {
            standard.disabled = true;
            standard.title = "Publish the schema before exporting a standard revision";
            standardDescription.textContent = standard.title;
        }
        const cancel = schemaExportChoices.ownerDocument.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        extension.addEventListener("click", () => {
            if (schema) {
                const archive = createExtensionSchemaPackage(schema, library.schemas, reusableSchemaRules);
                ports.downloadSchema(archive, `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-extension-package-v1.json`);
                finishSchemaExport(`Exported Extension schema package · ${schema.name} revision ${schema.version}.`);
            }
            else {
                const archive = createSchemaLibraryExport(library.schemas, reusableSchemaRules);
                ports.downloadSchema(archive, "schema-library-v1.json");
                finishSchemaExport(`Exported Extension backup · ${archive.schemas.length} schemas and ${archive.rules.length} rules.`);
            }
        });
        standard.addEventListener("click", () => { schemaExportChoices.close(); openStandardSchemaExportReview(schema ? "schema" : "library", schema); });
        cancel.addEventListener("click", () => { schemaExportChoices.close(); schemaExportTrigger?.focus({ preventScroll: true }); schemaExportTrigger = undefined; });
        schemaExportChoices.replaceChildren(heading, extension, extensionDescription, standard, standardDescription, cancel);
        schemaExportChoices.showModal();
        extension.focus({ preventScroll: true });
    }
    const requestSchemaLibraryExport = () => { if (exportSchemaButton)
        openSchemaExportChoices(exportSchemaButton); };
    const rememberCompactCanonicalScroll = () => {
        if (compactCanonicalEditor && schemaDetail && schemaDetail.scrollTop > 0)
            compactCanonicalScrollByKey.set(compactCanonicalEditor.key, schemaDetail.scrollTop);
    };
    let guidedDialogDisposers = [];
    let livePropertyDialogDisposers = [];
    let allowedValueDialogDisposers = [];
    let sidePanelLayeredProfileEditor;
    const guidedValidationFlow = createGuidedValidationFlow(guidedValidationRoot, {
        schemaCandidates: () => library.schemas.map(guidedUiCandidate),
        publish: persistPublishedGuidedValidation,
        close: () => {
            if (guidedValidationRoot) {
                guidedValidationRoot.hidden = true;
                guidedValidationRoot.removeAttribute("data-event-id");
                guidedValidationRoot.removeAttribute("data-schema-id");
            }
            restoreGuidedPropertyReturn();
        },
        saved: finishGuidedValidationSave,
    });
    return {
        mount() {
            if (!lifecycle.mount())
                return;
            editorRoute.mount();
            sidePanelLayeredProfileEditor = ports.mountLayeredProfileEditor();
            lifecycle.listen(schemaSearch, "input", updateSchemaTreeView);
            lifecycle.listen(createSchemaButton, "click", openNewSchemaEditor);
            lifecycle.listen(recheckSchemaValidationButton, "click", recheckCapturedSchemaValidationFromControl);
            lifecycle.listen(schemaCategoryFilter, "change", updateSchemaTreeView);
            lifecycle.listen(schemaTreeScrollOwner, "scroll", persistSchemaTreeScroll, { passive: true });
            lifecycle.listen(schemaList, "keydown", navigateSchemaTree);
            lifecycle.listen(schemaDetail, "scroll", rememberCompactCanonicalScroll);
            lifecycle.listen(schemaEditorName, "input", updateSchemaEditorName);
            lifecycle.listen(saveSchemaDescriptionButton, "click", saveSchemaDescription);
            lifecycle.listen(schemaEditorTarget, "input", updateSchemaTarget);
            lifecycle.listen(schemaEditorParent, "change", changeSchemaParent);
            lifecycle.listen(schemaOnlyDeclaredProperties, "change", changeOnlyDeclaredProperties);
            lifecycle.listen(saveSchemaButton, "click", openSchemaRevisionReview);
            lifecycle.listen(confirmSchemaRevisionButton, "click", confirmSchemaRevision);
            lifecycle.listen(cancelSchemaRevisionButton, "click", cancelSchemaRevision);
            lifecycle.listen(discardSchemaDraftButton, "click", discardSchemaDraft);
            lifecycle.listen(keepEditingSchemaButton, "click", keepEditingSchema);
            lifecycle.listen(closeSchemaEditorButton, "click", closeSchemaEditor);
            lifecycle.listen(saveAndCloseSchemaButton, "click", saveAndCloseSchema);
            lifecycle.listen(saveSchemaCloseReviewButton, "click", saveSchemaFromCloseReview);
            lifecycle.listen(discardWorkingSchemaDraftButton, "click", discardWorkingSchemaDraft);
            lifecycle.listen(schemaRevisionSelector, "change", renderSchemaRevisionComparison);
            lifecycle.listen(duplicateSchemaRevisionButton, "click", duplicateSelectedSchemaRevision);
            lifecycle.listen(restoreSchemaRevisionButton, "click", restoreSelectedSchemaRevision);
            lifecycle.listen(addSchemaPropertyButton, "click", openManualPropertyFromControl);
            lifecycle.listen(schemaPropertyFilter, "input", renderSchemaPropertyView);
            lifecycle.listen(schemaPropertySort, "change", renderSchemaPropertyView);
            lifecycle.listen(clearSchemaPropertyFilter, "click", clearSchemaPropertyViewFilter);
            for (const tab of schemaSubviews)
                lifecycle.listen(tab, "click", activateSchemaSubview);
            lifecycle.listen(confirmSchemaPropertyRemovalButton, "click", confirmSchemaPropertyRemoval);
            lifecycle.listen(cancelSchemaPropertyRemovalButton, "click", cancelSchemaPropertyRemoval);
            lifecycle.listen(schemaPropertyRemovalDialog, "cancel", cancelSchemaPropertyRemovalFromDialog);
            lifecycle.listen(undoSchemaPropertyRemovalButton, "click", undoLastSchemaPropertyRemoval);
            lifecycle.listen(confirmSchemaDocumentationRemoval, "click", confirmSchemaDocumentationRemovalAction);
            lifecycle.listen(cancelSchemaDocumentationRemoval, "click", cancelSchemaDocumentationRemovalAction);
            lifecycle.listen(schemaDocumentationRemovalDialog, "cancel", cancelSchemaDocumentationRemovalFromDialog);
            lifecycle.listen(undoSchemaPropertyCopyButton, "click", undoLastSchemaPropertyCopy);
            lifecycle.listen(schemaSpecificIndex, "input", renderSpecificIndexInspection);
            lifecycle.listen(schemaSpecificIndexForm, "submit", submitSpecificIndex);
            lifecycle.listen(cancelSchemaSpecificIndex, "click", closeSpecificIndexDialog);
            lifecycle.listen(schemaSpecificIndexDialog, "cancel", cancelSpecificIndexDialog);
            lifecycle.listen(schemaManualPropertyPath, "input", renderManualPropertyForm);
            lifecycle.listen(schemaManualPropertyChildName, "input", renderManualPropertyForm);
            lifecycle.listen(schemaManualPropertyType, "change", renderManualPropertyForm);
            lifecycle.listen(schemaManualArrayItemType, "change", renderManualPropertyForm);
            lifecycle.listen(schemaManualPropertyForm, "submit", submitManualProperty);
            lifecycle.listen(cancelSchemaManualPropertyButton, "click", cancelManualPropertyDialog);
            lifecycle.listen(schemaManualPropertyDialog, "cancel", cancelManualPropertyFromDialog);
            lifecycle.listen(goToExistingSchemaPropertyButton, "click", goToExistingSchemaProperty);
            lifecycle.listen(schemaPropertyRulePicker, "cancel", cancelSchemaPropertyRulePicker);
            lifecycle.listen(schemaPropertyRulePicker, "keydown", navigateSchemaPropertyRulePicker);
            lifecycle.listen(createSchemaRuleButton, "click", beginNewReusableSchemaRule);
            lifecycle.listen(saveSchemaRuleButton, "click", saveReusableSchemaRule);
            lifecycle.listen(saveSchemaRuleButton, "pointerdown", captureReusableRuleSnapshot);
            lifecycle.listen(schemaRuleEditor, "input", updateConfiguredRulePreview);
            lifecycle.listen(schemaRuleEditor, "click", captureReusableRuleSnapshotFromEditor);
            lifecycle.listen(schemaRuleSearch, "input", renderSchemaRuleLibrary);
            lifecycle.listen(updateSchemaRuleAttachments, "change", updateRuleAttachmentPreview);
            lifecycle.listen(confirmSchemaRuleRevisionButton, "click", confirmReusableSchemaRuleRevision);
            lifecycle.listen(cancelSchemaRuleRevisionButton, "click", cancelReusableSchemaRuleRevision);
            lifecycle.listen(confirmSchemaRuleUpgradeButton, "click", confirmReusableSchemaRuleUpgrade);
            lifecycle.listen(cancelSchemaRuleUpgradeButton, "click", cancelReusableSchemaRuleUpgrade);
            lifecycle.listen(confirmSchemaRuleSyncButton, "click", confirmReusableSchemaRuleSync);
            lifecycle.listen(cancelSchemaRuleSyncButton, "click", cancelReusableSchemaRuleSync);
            lifecycle.listen(confirmSchemaRuleDeleteButton, "click", confirmReusableSchemaRuleDeletion);
            lifecycle.listen(cancelSchemaRuleDeleteButton, "click", cancelReusableSchemaRuleDeletion);
            lifecycle.listen(exportSchemaRulesButton, "click", exportReusableSchemaRules);
            lifecycle.listen(schemaAssignmentTarget, "change", changeSchemaAssignmentTarget);
            lifecycle.listen(createSchemaAssignmentButton, "click", openNewSchemaAssignmentEditor);
            lifecycle.listen(saveSchemaAssignmentButton, "click", saveSchemaAssignment);
            lifecycle.listen(importSchemaButton, "click", openSchemaLibraryImportFile);
            lifecycle.listen(schemaLibraryImportFile, "change", readSchemaLibraryImportFile);
            lifecycle.listen(replaceSchemaLibraryButton, "click", replaceSchemaLibrary);
            lifecycle.listen(appendSchemaLibraryButton, "click", appendSchemaLibrary);
            lifecycle.listen(cancelSchemaImportButton, "click", cancelSchemaLibraryImport);
            lifecycle.listen(confirmSchemaDeleteButton, "click", confirmSchemaDeletion);
            lifecycle.listen(cancelSchemaDeleteButton, "click", cancelSchemaDeletion);
            lifecycle.listen(exportSchemaButton, "click", requestSchemaLibraryExport);
            unsubscribe = ports.subscribe((activeProjectId) => {
                library.reload();
                try {
                    const stored = JSON.parse(ports.storage.getItem(SCHEMA_RULE_STORAGE_KEY) ?? "[]");
                    reusableSchemaRules = Array.isArray(stored) ? stored.map(normalizeReusableSchemaRule).filter((rule) => Boolean(rule)) : [];
                }
                catch {
                    reusableSchemaRules = [];
                }
                if (library.activeSchemaId) {
                    const activeStored = library.schemas.find(({ id }) => id === library.activeSchemaId);
                    if (activeStored)
                        library.draft = schemaEditorDraft(activeStored);
                }
                if (!schemaPanel?.hidden && activeProjectId && activeProjectId !== hydratedSchemaProjectId)
                    void hydrateProjectForSchemas(activeProjectId);
                renderSchemas();
                renderSchemaRuleLibrary();
                if (compactCanonicalEditor)
                    renderCompactCanonicalEditor();
            });
            unsubscribeSchemaPersistence = ports.subscribeSchemaPersistence(settleSchemaPersistence);
            renderSchemas();
            renderSchemaRuleLibrary();
            renderSchemaValidationRecords();
        },
        dispose() {
            if (!lifecycle.dispose())
                return;
            editorRoute.dispose();
            pendingSchemaPropertyRemoval = undefined;
            pendingSchemaDocumentationRemoval = undefined;
            lastSchemaPropertyRemoval = undefined;
            pendingSchemaPropertyCopyReview?.close();
            pendingSchemaPropertyCopyReview = undefined;
            resetSchemaPropertyCopyDialog();
            pendingSchemaPropertyCopy = undefined;
            lastSchemaPropertyCopy = undefined;
            specificIndexArrayPath = undefined;
            specificIndexTrigger = undefined;
            pendingManualPropertyContext = undefined;
            pendingManualPropertyCanonicalBase = undefined;
            pendingSchemaRestoration = undefined;
            schemaRulePickerPath = undefined;
            schemaRulePickerTrigger = undefined;
            schemaPropertyInteractionReturn = undefined;
            schemaRuleConfiguration = undefined;
            editingAttachedLocalRule = undefined;
            pendingSchemaRuleRevision = undefined;
            pendingSchemaRuleUpgrade = undefined;
            pendingSchemaRuleSync = undefined;
            pendingReusableSchemaRuleDeletionId = undefined;
            editingReusableSchemaRuleId = undefined;
            approvedRuleRevisionId = undefined;
            approvedRuleAttachmentUpdateId = undefined;
            pendingRuleSnapshotMetadata = undefined;
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
            closeCompactCanonicalEditor(false);
            savedCanonicalDocument = undefined;
            compactCanonicalPendingCommand = undefined;
            for (const dispose of compactCanonicalContextDisposers.splice(0))
                dispose();
            sidePanelLayeredProfileEditor?.dispose();
            sidePanelLayeredProfileEditor = undefined;
            compactCanonicalPendingBase = undefined;
            compactCanonicalReviewVisible = false;
            compactCanonicalRevisionSnapshots.clear();
            compactCanonicalCommandFeedback = undefined;
            compactCanonicalProjectionWorker = undefined;
            compactCanonicalReopenSelection = undefined;
            compactCanonicalPresenceDraft = undefined;
            compactCanonicalHistoryState = compactCanonicalHistorySettlement();
            for (const dispose of guidedDialogDisposers.splice(0))
                dispose();
            guidedValidationFlow.close();
            guidedPropertyReturn = undefined;
            for (const dispose of livePropertyDialogDisposers.splice(0))
                dispose();
            for (const dispose of allowedValueDialogDisposers.splice(0))
                dispose();
            for (const dispose of capturedContinuationRowDisposers.splice(0))
                dispose();
            for (const dispose of capturedContinuationDialogDisposers.splice(0))
                dispose();
            guidedValidationRoot?.replaceChildren();
            const disposed = new Error("Schemas controller disposed before durable persistence settled");
            pendingLocalRulePromotionPersistence?.reject(disposed);
            pendingGuidedValidationPersistence?.reject(disposed);
            pendingLocalRulePromotion = undefined;
            localRulePromotionDialog.close();
            unsubscribe?.();
            unsubscribe = undefined;
            unsubscribeSchemaPersistence?.();
            unsubscribeSchemaPersistence = undefined;
            activeSchemaProjectHydration.reset();
            relationshipTreeController.dispose();
            for (const dispose of schemaRuleRowDisposers.splice(0))
                dispose();
            for (const dispose of schemaPropertyRowDisposers.splice(0))
                dispose();
            for (const dispose of schemaRulePickerDisposers.splice(0))
                dispose();
            schemaList?.replaceChildren();
            schemaAssignmentList?.replaceChildren();
            schemaAssignmentDataConditions?.replaceChildren();
        },
        open(id) {
            if (!library.schemas.some((schema) => schema.id === id))
                throw new Error(`Unknown schema ${id}`);
            library.activeSchemaId = id;
            library.draft = structuredClone(active());
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
        add(schema) { library.schemas = [...library.schemas, structuredClone(schema)]; library.activeSchemaId = schema.id; library.draft = structuredClone(schema); persistSchemaLibrary(); renderSchemas(); },
        replace(next) { library.schemas = structuredClone([...next]); if (!library.schemas.some(({ id }) => id === library.activeSchemaId)) {
            library.activeSchemaId = undefined;
            library.draft = undefined;
        } persistSchemaLibrary(); renderSchemas(); },
        validate: (event) => validateEvent(event, library.schemas),
        validateAgainstSchema: (event, schemaId) => {
            const schema = library.schemas.find((candidate) => candidate.id === schemaId);
            if (!schema)
                return { message: "Select a schema to refresh Library draft validation." };
            const result = validateWithSchema(event, schema, library.schemas);
            return { message: `Library draft validation: ${result.state} · ${schema.name} v${schema.version}.`, result };
        },
        runGuidedValidation: async () => {
            const event = guidedValidationRoot?.dataset.eventId;
            if (event) {
                const captured = { id: event, sourceId: "", name: "", pageUrl: "", payload: {}, rawInput: {} };
                guidedValidationFlow.open(guidedUiEvent(captured), library.activeSchemaId ? guidedUiCandidate(active()) : undefined);
            }
        },
        requestPropertyRemoval: requestSchemaPropertyRemoval,
        requestDocumentationRemoval: requestSchemaDocumentationRemoval,
        requestPropertyCopy: openSchemaPropertyCopyReview,
        confirmPropertyCopy: confirmSchemaPropertyCopy,
        openSpecificIndex: openSpecificIndexDialog,
        openManualProperty: openManualPropertyForm,
        openContextualManualProperty: openContextualManualPropertyForm,
        openSchemaFromSource,
        schemaDocumentPaths,
        schemaPropertyAt,
        defineSchemaProperty,
        schemaPropertyType,
        capturePropertyReturn: captureSchemaPropertyInteractionReturn,
        restorePropertyReturn: restoreSchemaPropertyInteractionReturn,
        closeRulePickerForCommit: closeSchemaPropertyRulePickerForCommit,
        openRulePicker: openSchemaPropertyRulePicker,
        openCanonicalRuleEditor: openCompactCanonicalRuleEditor,
        configureRule: (ruleType) => {
            if (!schemaRuleConfiguration)
                return false;
            schemaRuleConfiguration = createRuleConfiguration(ruleType, schemaRuleConfiguration.propertyType);
            renderSchemaPropertyRulePicker();
            return true;
        },
        openCanonicalPropertyActions: openCompactCanonicalPropertyActions,
        compactPropertyAction: compactCanonicalPropertyAction,
        configuredRule: configuredRuleInput,
        conditionPredicate: sampledConditionPredicate,
        createConfiguredRule: createConfiguredSchemaRule,
        requestRuleRevision: requestSchemaRuleRevision,
        requestRuleUpgrade: requestSchemaRuleUpgrade,
        requestRuleSync: openReusableRuleSyncReview,
        confirmRuleSync: confirmReusableSchemaRuleSync,
        requestRuleDeletion: requestSchemaRuleDeletion,
        editReusableRule: editReusableSchemaRule,
        openAttachedRule: openAttachedSchemaRuleEditor,
        attachReusableRule,
        updateAttachedRule,
        focusPropertyRule: focusSchemaPropertyRule,
        focusPropertyRow: focusSchemaPropertyRow,
        promotionRules: promotionReusableRules,
        renderWorkflow: renderSchemaWorkflowRows,
        editAssignment: editSchemaAssignment,
        reviewLibraryImport: reviewSchemaLibraryImport,
        requestDeletion: requestSchemaDeletion,
        openExportChoices: (schemaId) => {
            if (!exportSchemaButton)
                return false;
            const schema = schemaId ? library.schemas.find(({ id }) => id === schemaId) : undefined;
            if (schemaId && !schema)
                return false;
            openSchemaExportChoices(exportSchemaButton, schema);
            return true;
        },
        requestLocalRulePromotion: openLocalRulePromotionReview,
        persistGuidedValidation: (result) => persistPublishedGuidedValidation(result).then(() => finishGuidedValidationSave(result)),
        openGuidedEvent: openGuidedValidationForEvent,
        openGuidedProperty: openGuidedValidationForProperty,
        openGuidedLiveProperty: async (event, path) => {
            guidedPropertyReturn = { kind: "capture", eventId: event.id, propertyPath: path, generation: lifecycle.generation() };
            await openGuidedValidationForProperty(event, selectedGuidedContinuation(guidedContinuationSelections, event, library.schemas), path, false);
            guidedPropertyReturn = { kind: "capture", eventId: event.id, propertyPath: path, generation: lifecycle.generation() };
        },
        openLivePropertyDeclaration,
        livePropertyDeclaration: (event, path) => {
            const schema = selectedGuidedContinuation(guidedContinuationSelections, event, library.schemas);
            if (!schema?.workingDraft)
                return {};
            const canonical = canonicalLivePropertyPath(path);
            return { destination: schema.name, alreadyDeclared: Boolean(schemaPropertyAt(schema.workingDraft.document, canonical)) };
        },
        liveValidationAvailable: (event) => {
            const manual = library.schemas.find(({ id }) => id === manualSchemaOverrides[event.id]);
            return Boolean(manual ?? validateEvent({ sourceId: event.sourceId, eventName: event.name, payload: event.payload, rawInput: event.rawInput }, library.schemas, event.pageUrl).schema);
        },
        validateLive: (event) => {
            const input = { sourceId: event.sourceId, eventName: event.name, payload: event.payload, rawInput: event.rawInput };
            const manual = library.schemas.find(({ id }) => id === manualSchemaOverrides[event.id]);
            return manual ? validateWithSchema(input, manual, library.schemas) : validateEvent(input, library.schemas, event.pageUrl);
        },
        liveSchemaChoices: () => assignableSchemas(library.schemas).map(({ id, name, version }) => ({ id, label: `${name} v${version}` })),
        openAllowedValueExpansionReview,
        closeGuided: guidedValidationFlow.close,
        guidedDraft: guidedValidationFlow.currentDraft,
        guidedState: () => ({ selections: structuredClone(guidedContinuationSelections), selectedSchemaPropertyPath,
            hasPropertyReturn: Boolean(guidedPropertyReturn), dialogListenerCount: guidedDialogDisposers.length }),
        guidedContinuation: guidedDraftContinuationForEvent,
        recheckCaptured: recheckCapturedSchemaValidation,
        recordCapturedValidation: (record) => {
            schemaValidationRecords = [...schemaValidationRecords, structuredClone(record)].slice(-50);
            ports.storage.setItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY, JSON.stringify(schemaValidationRecords));
            renderSchemaValidationRecords();
        },
        refreshCurrentLiveAfterSchemaPublication,
        reviewCapturedValidationContinuation,
        setManualSchemaOverride: (eventId, schemaId) => {
            if (schemaId)
                manualSchemaOverrides[eventId] = schemaId;
            else
                delete manualSchemaOverrides[eventId];
            ports.storage.setItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY, JSON.stringify(manualSchemaOverrides));
        },
        hydrateActiveProjectForSchemas,
        openSavedCanonical: (schemaId) => {
            const schema = library.schemas.find(({ id }) => id === schemaId);
            if (!schema)
                return false;
            openSavedSchemaInUnifiedEditor(schema);
            return true;
        },
        openCanonical: openCompactCanonicalEditor,
        closeCanonical: closeCompactCanonicalEditor,
        show() { renderSchemas(); relationshipTreeController.restoreScroll(); },
        dispatchCanonical: dispatchCompactCanonicalCommand,
        persistCanonicalProjection: (projection, change) => compactCanonicalEditor
            ? persistCompactCanonicalProjection(compactCanonicalEditor, projection, change) : Promise.resolve(false),
        resumeCanonicalProjection: () => compactCanonicalEditor ? resumeCompactCanonicalProjectionPersistence(compactCanonicalEditor) : Promise.resolve(false),
        retryCanonical: retryCompactCanonicalCommand,
        rejectCanonical: rejectCompactCanonicalCommand,
        canonicalProjection: () => compactCanonicalEditor ? compactCanonicalProjection(compactCanonicalEditor) : undefined,
        canonicalDocument: () => compactCanonicalEditor ? structuredClone(compactCanonicalEditor.load()) : undefined,
        canonicalFacet: (propertyId) => {
            const document = compactCanonicalEditor?.load(), node = document?.nodes[propertyId];
            return document && node ? compactCanonicalFacetText(document, node) : undefined;
        },
        canonicalCommandScope: (command) => compactCanonicalEditor
            ? compactCanonicalCommandScope(command, compactCanonicalEditor.load()) : undefined,
        canonicalQueueUnavailable: () => compactCanonicalEditor ? compactCanonicalProjectionQueueUnavailable(compactCanonicalEditor) : false,
        beginCanonicalHistory: (projectId, label, before, after) => {
            if (!compactCanonicalEditor)
                return undefined;
            const key = compactCanonicalHistoryKey(projectId, compactCanonicalEditor.key);
            const history = recordCompactCanonicalMutation(compactCanonicalHistoryState.history, key, before, after);
            return beginCompactCanonicalPendingHistory(projectId, compactCanonicalEditor.key, label, history);
        },
        completeCanonicalHistory: completeCompactCanonicalPendingHistory,
        rejectCanonicalHistory: rejectCompactCanonicalPendingHistory,
        pendingCanonicalHistory: compactCanonicalPendingHistoryFor,
        canonicalState: () => ({ open: Boolean(compactCanonicalEditor), pending: Boolean(compactCanonicalPendingCommand),
            settlementPending: compactCanonicalSettlementPending, reviewVisible: compactCanonicalReviewVisible,
            feedback: compactCanonicalCommandFeedback, reopenSelection: compactCanonicalReopenSelection,
            projectionPending: Boolean(compactCanonicalProjectionRequest), historyPending: Boolean(compactCanonicalHistoryState.pending) }),
        renderCanonical: renderCompactCanonicalEditor,
        rulePickerState: () => ({ path: schemaRulePickerPath, renderSequence: schemaPropertyRenderSequence,
            ...(schemaRuleConfiguration ? { configuration: structuredClone(schemaRuleConfiguration) } : {}) }),
        rules: () => structuredClone(reusableSchemaRules),
        ruleState: () => ({ editingReusableSchemaRuleId, approvedRuleRevisionId, approvedRuleAttachmentUpdateId,
            pendingRuleSnapshotMetadata: pendingRuleSnapshotMetadata ? structuredClone(pendingRuleSnapshotMetadata) : undefined }),
        omittedRuleStatus,
        storePromotionRules: storedPromotionRules,
        schemas: () => structuredClone(library.schemas),
        state: () => ({ ...(library.activeSchemaId ? { activeSchemaId: library.activeSchemaId } : {}), draftDirty: Boolean((library.activeSchemaId || library.draft) && active().workingDraft),
            ...(activeIndex() < 0 && library.draft ? { transientDraft: structuredClone(library.draft) } : {}), schemaCount: library.schemas.length, mounted: lifecycle.isMounted() }),
    };
    function restoreGuidedPropertyReturn() {
        const snapshot = guidedPropertyReturn;
        if (!snapshot || snapshot.generation !== lifecycle.generation())
            return;
        if (snapshot.kind === "capture") {
            guidedPropertyReturn = undefined;
            ports.restoreGuidedCapture(snapshot.eventId, snapshot.propertyPath);
            return;
        }
        guidedPropertyReturn = undefined;
        selectedSchemaPropertyPath = snapshot.propertyPath;
        library.activeSchemaId = snapshot.schemaId;
        renderSchemas();
    }
    function persistGuidedContinuation(event, schemaId) {
        guidedContinuationSelections = selectGuidedContinuation(guidedContinuationSelections, event, schemaId);
        ports.storage.setItem(GUIDED_CONTINUATION_STORAGE_KEY, JSON.stringify(guidedContinuationSelections));
    }
    function openGuidedDraft(schema) {
        library.activeSchemaId = schema.id;
        library.draft = schemaEditorDraft(schema);
        ports.showSchemasView();
        renderSchemas();
    }
    function openGuidedContinuationPicker(event) {
        if (!guidedValidationRoot || !schemaOwnerDocument)
            return;
        for (const dispose of guidedDialogDisposers.splice(0))
            dispose();
        guidedValidationRoot.replaceChildren();
        const dialog = schemaOwnerDocument.createElement("dialog"), heading = schemaOwnerDocument.createElement("h5"), choices = schemaOwnerDocument.createElement("div");
        dialog.id = "guided-continuation-schema-picker";
        dialog.setAttribute("aria-labelledby", "guided-continuation-schema-picker-heading");
        heading.id = "guided-continuation-schema-picker-heading";
        heading.textContent = "Choose schema destination";
        choices.setAttribute("aria-label", "Schemas with working drafts");
        for (const schema of library.schemas.filter(({ workingDraft }) => Boolean(workingDraft))) {
            const choose = schemaOwnerDocument.createElement("button");
            choose.type = "button";
            choose.textContent = `${schema.name} revision ${schema.version} · ${schema.workingDraft?.pendingChanges.length ?? 0} pending changes`;
            const select = () => {
                persistGuidedContinuation(event, schema.id);
                dialog.close();
                guidedValidationRoot.replaceChildren();
                ports.restoreGuidedCapture(event.id);
                for (const dispose of guidedDialogDisposers.splice(0))
                    dispose();
            };
            choose.addEventListener("click", select);
            guidedDialogDisposers.push(() => choose.removeEventListener("click", select));
            choices.append(choose);
        }
        const cancel = schemaOwnerDocument.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        const close = () => { dialog.close(); guidedValidationRoot.replaceChildren(); for (const dispose of guidedDialogDisposers.splice(0))
            dispose(); };
        cancel.addEventListener("click", close);
        guidedDialogDisposers.push(() => cancel.removeEventListener("click", close));
        dialog.append(heading, choices, cancel);
        guidedValidationRoot.append(dialog);
        dialog.showModal();
        heading.focus({ preventScroll: true });
    }
    function openLivePropertyDeclaration(event, path, trigger) {
        if (!guidedValidationRoot || !schemaOwnerDocument)
            return false;
        for (const dispose of livePropertyDialogDisposers.splice(0))
            dispose();
        guidedValidationRoot.replaceChildren();
        const dialog = schemaOwnerDocument.createElement("dialog"), feedback = schemaOwnerDocument.createElement("output");
        dialog.className = "live-schema-property-declaration-review";
        dialog.setAttribute("aria-labelledby", "live-schema-property-declaration-heading");
        const close = (restoreFocus = true) => {
            for (const dispose of livePropertyDialogDisposers.splice(0))
                dispose();
            dialog.close();
            guidedValidationRoot.replaceChildren();
            if (restoreFocus)
                trigger.focus({ preventScroll: true });
        };
        const listen = (control, action) => {
            control.addEventListener("click", action);
            livePropertyDialogDisposers.push(() => control.removeEventListener("click", action));
        };
        const showReview = (schema) => {
            const heading = schemaOwnerDocument.createElement("h5"), review = schemaOwnerDocument.createElement("p"), confirm = schemaOwnerDocument.createElement("button"), cancel = schemaOwnerDocument.createElement("button");
            heading.id = "live-schema-property-declaration-heading";
            heading.textContent = "Review schema property declaration";
            try {
                const declaration = createLiveSchemaPropertyDeclaration(event.payload, path, schema);
                review.textContent = `${declaration.canonicalPath} · ${declaration.detectedType} · ${schema.name} revision ${schema.version}. No validation rule will be added.`;
                confirm.type = cancel.type = "button";
                confirm.textContent = `Add property to ${schema.name} draft`;
                cancel.textContent = "Cancel";
                listen(confirm, () => {
                    try {
                        library.schemas = library.schemas.map((candidate) => candidate.id === schema.id
                            ? addLiveSchemaPropertyDeclaration(candidate, declaration) : candidate);
                        persistSchemaLibrary();
                        renderSchemas();
                        close(false);
                        ports.scheduleFrame(() => ports.restoreGuidedCapture(event.id, declaration.concretePath, "declaration"));
                    }
                    catch (error) {
                        feedback.textContent = error instanceof Error ? error.message : "The property could not be added to the schema draft.";
                    }
                });
                listen(cancel, () => close());
                dialog.replaceChildren(heading, review, feedback, confirm, cancel);
            }
            catch (error) {
                feedback.textContent = error instanceof Error ? error.message : "The observed property is unavailable.";
                cancel.type = "button";
                cancel.textContent = "Cancel";
                listen(cancel, () => close());
                dialog.replaceChildren(heading, feedback, cancel);
            }
            heading.focus({ preventScroll: true });
        };
        const selected = selectedGuidedContinuation(guidedContinuationSelections, event, library.schemas);
        if (selected?.workingDraft)
            showReview(selected);
        else {
            const heading = schemaOwnerDocument.createElement("h5"), choices = library.schemas.filter(({ workingDraft }) => Boolean(workingDraft)).map((schema) => {
                const choose = schemaOwnerDocument.createElement("button");
                choose.type = "button";
                choose.textContent = schema.name;
                listen(choose, () => showReview(schema));
                return choose;
            }), cancel = schemaOwnerDocument.createElement("button");
            heading.id = "live-schema-property-declaration-heading";
            heading.textContent = "Choose schema destination";
            cancel.type = "button";
            cancel.textContent = "Cancel";
            listen(cancel, () => close());
            dialog.replaceChildren(heading, ...choices, cancel);
            heading.focus({ preventScroll: true });
        }
        guidedValidationRoot.append(dialog);
        dialog.showModal();
        return true;
    }
    function openAllowedValueExpansionReview(eventId, assignedSchemaId, evaluation, trigger) {
        const inspector = ports.root.querySelector("#live-event-inspector");
        if (!inspector)
            return false;
        const inspectorScroll = inspector.scrollTop;
        const expandedPaths = Array.from(inspector.querySelectorAll("details[open][data-property-path]"), ({ dataset }) => dataset.propertyPath).filter((path) => Boolean(path));
        const restoreLiveAction = () => {
            ports.restoreGuidedCapture(eventId, evaluation.propertyPath);
            ports.scheduleFrame(() => {
                const restoredInspector = ports.root.querySelector("#live-event-inspector");
                for (const path of expandedPaths)
                    restoredInspector?.querySelector(`details[data-property-path="${CSS.escape(path)}"]`)?.setAttribute("open", "");
                if (restoredInspector)
                    restoredInspector.scrollTop = inspectorScroll;
                const restoredAction = restoredInspector?.querySelector(`.live-allowed-value-expansion[data-rule-id="${CSS.escape(evaluation.ruleId ?? "")}"]`);
                restoredAction?.focus({ preventScroll: true });
            });
        };
        const input = { schemas: library.schemas, reusableRules: expansionReusableRules(), assignedSchemaId, evidence: evaluation };
        let review;
        try {
            review = reviewAllowedValueExpansion(input);
        }
        catch (error) {
            if (schemaResult)
                schemaResult.textContent = error instanceof Error ? error.message : "The allowed value review is unavailable.";
            return false;
        }
        for (const dispose of allowedValueDialogDisposers.splice(0))
            dispose();
        const disposeDialog = openAllowedValueExpansionDialog({ inspector, review, trigger,
            confirm: (destination) => {
                const applied = applyAllowedValueExpansion({ ...input, destination });
                library.schemas = applied.schemas;
                reusableSchemaRules = storedPromotionRules(applied.reusableRules.map((rule) => ({ ...rule,
                    name: rule.name ?? rule.id, enabled: rule.enabled !== false })));
                persistSchemaAndRuleLibraries();
                library.activeSchemaId = applied.affectedSchemaId;
                library.draft = schemaEditorDraft(active());
                renderSchemas();
                if (schemaResult)
                    schemaResult.textContent = applied.changed ? `${String(review.proposedValue)} was added to the working draft.` : "The allowed value was already pending; no duplicate was created.";
                return () => ports.scheduleFrame(restoreLiveAction);
            },
            openDraft: (destination) => {
                const targetId = destination === "parent-schema-draft" ? evaluation.schemaId : assignedSchemaId, target = library.schemas.find(({ id }) => id === targetId);
                trigger.focus({ preventScroll: true });
                if (!target)
                    return;
                library.activeSchemaId = target.id;
                library.draft = schemaEditorDraft(target);
                ports.showSchemasView();
                renderSchemas();
                schemaEditorName?.focus({ preventScroll: true });
            },
        });
        allowedValueDialogDisposers.push(disposeDialog);
        return true;
    }
    function downloadSchemaJson(value, filename) { ports.downloadSchema(value, filename); }
    function omittedRuleStatus(count) { return `${count} omitted ${count === 1 ? "rule" : "rules"}`; }
    function storedPromotionRules(rules) {
        return rules.map((rule) => {
            const { revisionHistory, ...current } = structuredClone(rule);
            return { ...current,
                ...(revisionHistory ? { revisionHistory: revisionHistory.map((snapshot) => ({ name: snapshot.name ?? rule.name,
                        kind: snapshot.kind ?? rule.kind, version: snapshot.version ?? 1, ...(snapshot.enabled !== undefined ? { enabled: snapshot.enabled } : {}),
                        ...(snapshot.operator !== undefined ? { operator: snapshot.operator } : {}), ...(snapshot.parameters !== undefined ? { parameters: snapshot.parameters } : {}),
                        ...(snapshot.allowedValues !== undefined ? { allowedValues: structuredClone(snapshot.allowedValues) } : {}),
                        ...(snapshot.severity !== undefined ? { severity: snapshot.severity } : {}), ...(snapshot.message !== undefined ? { message: snapshot.message } : {}),
                        ...(snapshot.conditionGroup !== undefined ? { conditionGroup: structuredClone(snapshot.conditionGroup) } : {}) })) } : {}) };
        });
    }
    function requestSavedSchemaAdoption(schema, trigger) {
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
        ports.renderSchemaSpecification(schemaSpecificationBuilder, structuredClone(schema), structuredClone(library.schemas), surface, () => {
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
            const parent = library.schemas.find(({ id }) => id === parentId);
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