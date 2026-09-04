import { SCHEMA_LIBRARY_STORAGE_KEY, discardSchemaWorkingDraft, duplicateSchemaRevision, proposeSchemaWorkingDraftName, schemaPropertyRows, schemaRevisionChoices, addManualProperty, assignmentDraftAfterGuidedSave, assignableSchemas, configuredRuleDetails, ruleConfigurationControls, validateRuleConfiguration, comparisonValueFromInput, builtInRulesForProperty, applicablePropertyTypesForRule, reusableRulesForProperty, reusableRuleMetadata, conditionGroupAppliesToValue, operatorsForConditionType, cardinalityComparisonPasses, createRuleConfiguration, createRuleConfigurationFromAttachedRule, guidedAttachedRule, guidedPropertyDocument, mergeGuidedDocument, serializeSchemaLibrary, setPropertyDocumentation, updateSchemaWorkingDraft, validateEvent, validateWithSchema, mountCanonicalSchemaEditor, typedComparisonValue, createGuidedValidationFlow, applyCanonicalCommand, canonicalPropertyPath, canonicalLivePropertyPath, canonicalRulePropertyPath, compactSchemaProjection, createSchema, activateFocusedOwnershipSection, clearSchemaTableOverlay, focusedCanonicalOwnershipInput, focusedDefinitionFieldLabels, focusedOwnershipActionTarget, focusedOwnershipState, focusedPropertyLayerSequence, focusedPropertyLifecycleOperation, focusedPropertyPatch, focusedPropertyProvenanceSummary, focusedSectionOwnershipActions, focusedSourceState, focusedStagedChanges, gateFocusedOwnershipSection, mountSchemaTableOverlay, renderCanonicalFocusedSection, renderFocusedPropertyMenu, renderCanonicalFocusedRules, savedSchemaCanonicalDocument, savedSchemaFromCanonical, compactCanonicalHistoryKey, recordCompactCanonicalMutation, } from "../../utilities/data-layer/schemas.js";
import { createSchemaLifecycle } from "./lifecycle.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import { SchemaLibraryController } from "./library-controller.js";
import { SchemaLibraryEditor } from "./library-editor.js";
import { installSchemaPropertyElements, SchemaPropertyController } from "./property-controller.js";
import { SchemaPropertyView } from "./property-view.js";
import { SchemaAssignmentController } from "./assignment-controller.js";
import { SchemaValidationController } from "./validation-controller.js";
import { SchemaGuidedValidationController } from "./guided-validation-controller.js";
import { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import { persistLocalRulePromotion, promoteLocalRule, reviewLocalRulePromotion, } from "../../data-layer-local-rule-promotion.js";
import { createProjectHydrationSlot } from "./project-hydration.js";
import { createSchemaEditorRouteController } from "./editor-route-controller.js";
import { SCHEMA_RULE_STORAGE_KEY, SchemaRuleController } from "./rule-controller.js";
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
    const { addSchemaPropertyButton, schemaPropertyViewControls, schemaPropertyFilter, schemaPropertySort, schemaPropertyResultStatus, schemaPropertyEmpty, schemaPropertyEmptyMessage, clearSchemaPropertyFilter, schemaPropertyTree, schemaPropertyRemovalFeedback, undoSchemaPropertyRemovalButton, schemaPropertyCopyFeedback, undoSchemaPropertyCopyButton, schemaPropertyRemovalDialog, confirmSchemaPropertyRemovalButton, cancelSchemaPropertyRemovalButton, schemaDocumentationRemovalDialog, confirmSchemaDocumentationRemoval, cancelSchemaDocumentationRemoval, schemaSpecificIndexDialog, schemaSpecificIndexForm, schemaSpecificIndex, confirmSchemaSpecificIndex, cancelSchemaSpecificIndex, schemaManualPropertyDialog, schemaManualPropertyForm, schemaManualPropertyPath, schemaManualPropertyChildName, schemaManualPropertyType, schemaManualArrayItemType, goToExistingSchemaPropertyButton, confirmSchemaManualPropertyButton, cancelSchemaManualPropertyButton, schemaPropertyRulePicker } = installSchemaPropertyElements(ports.root);
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
        panel: schemaPanel, list: schemaList, emptyState: schemaEmptyState, count: schemaCount,
        storage: ports.relationshipViewStorage, scheduleFrame: ports.scheduleFrame,
    });
    const activeSchemaProjectHydration = createProjectHydrationSlot();
    const schemaContributorRoute = { collectionKinds: ["profiles", "propertySets", "pages", "events", "flows"], includeFlowGraphs: true };
    const listen = (target, type, listener) => {
        relationshipTreeController.listen(target, type, listener);
    };
    const listenRule = (target, type, listener) => {
        ruleController.listenRow(target, type, listener);
    };
    const library = new SchemaLibraryController({ storage: ports.storage, changed: ports.changed });
    const propertyController = new SchemaPropertyController();
    let pendingSchemaRestoration;
    const validationController = new SchemaValidationController(ports.storage, {
        list: schemaValidationRecordList, issues: schemaValidationIssues, result: schemaResult,
        guidedRoot: guidedValidationRoot, document: schemaOwnerDocument,
        ...(ports.prepareCapturedValidationContinuation ? { prepare: ports.prepareCapturedValidationContinuation } : {}),
        schemas: () => library.schemas, generation: () => lifecycle.generation(), isCurrent: (generation) => lifecycle.isCurrent(generation),
    });
    const ruleController = new SchemaRuleController(ports.storage, {
        elements: { list: schemaRuleList, search: schemaRuleSearch, editor: schemaRuleEditor, name: schemaRuleName,
            parameters: schemaRuleParameters, types: schemaRuleTypes, operator: schemaRuleOperator, severity: schemaRuleSeverity,
            message: schemaRuleMessage, examples: schemaRuleExamples, attachments: schemaRuleAttachments,
            updateAttachments: updateSchemaRuleAttachments, result: schemaResult, revisionReview: schemaRuleRevisionReview,
            revisionSummary: schemaRuleRevisionReviewSummary, confirmRevision: confirmSchemaRuleRevisionButton,
            upgradeReview: schemaRuleUpgradeReview, upgradeSummary: schemaRuleUpgradeReviewSummary,
            confirmUpgrade: confirmSchemaRuleUpgradeButton, cancelUpgrade: cancelSchemaRuleUpgradeButton,
            syncReview: schemaRuleSyncReview, syncSummary: schemaRuleSyncReviewSummary, confirmSync: confirmSchemaRuleSyncButton,
            cancelSync: cancelSchemaRuleSyncButton, deleteReview: schemaRuleDeleteReview, deleteSummary: schemaRuleDeleteReviewSummary,
            confirmDelete: confirmSchemaRuleDeleteButton, document: schemaOwnerDocument },
        schemas: () => library.schemas, replaceSchemas: (schemas) => { library.schemas = schemas; },
        persistRules: () => ruleController.persist(), persistLibrary: () => persistSchemaLibrary(),
        renderAll: () => renderSchemas(), createId: ports.createRuleId, download: ports.downloadSchema,
    });
    const assignmentController = new SchemaAssignmentController({
        elements: { editor: schemaAssignmentEditor, source: schemaAssignmentSource, event: schemaAssignmentEvent,
            priority: schemaAssignmentPriority, save: saveSchemaAssignmentButton, target: schemaAssignmentTarget,
            domain: schemaAssignmentDomain, pathname: schemaAssignmentPathname, versionPolicy: schemaAssignmentVersionPolicy,
            enabled: schemaAssignmentEnabled, list: schemaAssignmentList, conflicts: schemaAssignmentConflicts,
            schema: schemaAssignmentSchema, conditions: schemaAssignmentDataConditions, result: schemaResult },
        schemas: () => library.schemas, replaceSchemas: (schemas) => { library.schemas = schemas; },
        persistAndRender: () => { persistSchemaLibrary(); renderSchemas(); },
        capturedValue: ports.capturedAssignmentValue, renderConditions: ports.renderAssignmentConditions,
    });
    library.configure({
        elements: { importFile: schemaLibraryImportFile, importReview: schemaImportReview, importSummary: schemaImportReviewSummary,
            deleteReview: schemaDeleteReview, deleteSummary: schemaDeleteReviewSummary, exportButton: exportSchemaButton,
            exportChoices: schemaExportChoices, exportReview: schemaExportReview, result: schemaResult },
        rules: () => ruleController.rules, replaceRules: (rules) => { ruleController.rules = rules; },
        persistRules: () => ruleController.persist(), renderAll: () => renderSchemas(), renderRules: () => ruleController.render(),
        download: ports.downloadSchema,
    });
    const localRulePromotionDialog = ports.localRulePromotionDialog;
    let pendingLocalRulePromotionPersistence;
    let pendingGuidedValidationPersistence;
    const guidedController = new SchemaGuidedValidationController(ports.storage);
    guidedController.configure({
        root: ports.root, guidedRoot: guidedValidationRoot, document: schemaOwnerDocument,
        schemas: () => library.schemas, replaceSchemas: (schemas) => { library.schemas = structuredClone([...schemas]); },
        persistSchemas: () => persistSchemaAndRuleLibraries(), renderSchemas: () => renderSchemas(),
        openDraft: (schema) => openGuidedDraft(schema), restoreCapture: ports.restoreGuidedCapture,
        scheduleFrame: ports.scheduleFrame, generation: () => lifecycle.generation(),
        selectSchema: (schemaId, propertyPath) => { propertyController.selectedPath = propertyPath; library.activeSchemaId = schemaId; renderSchemas(); },
        result: (message) => { if (schemaResult)
            schemaResult.textContent = message; }, expansionRules: () => expansionReusableRules(),
        replaceExpansionRules: (rules) => {
            ruleController.rules = storedPromotionRules(rules.map((rule) => ({ ...rule,
                name: rule.name ?? rule.id, enabled: rule.enabled !== false })));
        },
    });
    let persistenceGeneration = 0;
    const canonicalController = new SchemaCanonicalEditorController({
        blocked: () => Boolean(ports.blocked?.()), generation: () => lifecycle.generation(),
        isCurrent: (generation) => lifecycle.isCurrent(generation),
        setBusy: (busy) => { schemaEditor?.setAttribute("aria-busy", String(busy)); if (busy && saveSchemaButton)
            saveSchemaButton.disabled = true; },
        renderContext: () => renderCompactCanonicalContext(), renderEditor: () => renderCompactCanonicalEditor(),
        createId: ports.createRuleId,
    });
    propertyController.configure({
        root: ports.root, active: () => active(), schemas: () => library.schemas, ruleIds: () => ruleController.rules.map(({ id }) => id),
        replaceActive: (schema) => replaceActive(schema), replaceSchemas: (schemas) => { library.schemas = structuredClone([...schemas]); },
        persist: () => persistSchemaLibrary(), renderAll: () => renderSchemas(), renderView: () => renderSchemaPropertyView(), renderRules: () => ruleController.render(),
        openRulePicker: (path, trigger) => openSchemaPropertyRulePicker(path, trigger), queuePersistence: (schemaId) => queueSchemaLibraryPersistence(schemaId),
        canonicalUndo: () => { if (!canonicalController.editor?.onUndo)
            return false; canonicalController.editor.onUndo(); return true; },
        removeCanonicalDocumentation: (schema, path) => {
            const draft = schema.workingDraft, documentation = setPropertyDocumentation(draft.documentation ?? {}, path, { displayName: "", description: "" });
            const canonicalBase = canonicalController.savedSchemaId(canonicalController.editor) === schema.id ? canonicalController.savedDocument : draft.canonicalSchema, canonicalNode = canonicalBase && Object.values(canonicalBase.nodes).find((candidate) => canonicalPropertyPath(canonicalBase, candidate.id) === path), result = canonicalBase && canonicalNode ? applyCanonicalCommand(canonicalBase, { kind: "set", baseRevision: canonicalBase.revision, propertyId: canonicalNode.id,
                patch: { documentation: { displayText: "", description: "", comments: "", example: { method: "blank" } } } }) : undefined, canonicalSchema = result?.status === "applied" || result?.status === "rebased" ? result.document : undefined;
            if (canonicalSchema && canonicalController.savedSchemaId(canonicalController.editor) === schema.id)
                canonicalController.savedDocument = canonicalSchema;
            return updateSchemaWorkingDraft(schema, { documentation, ...(canonicalSchema ? { canonicalSchema } : {}) }, `Remove property documentation ${path}`);
        },
        addManualCanonical: (schema, document, path) => {
            const previous = schema.workingDraft?.canonicalSchema;
            if (!previous)
                return undefined;
            const draft = schema.workingDraft, projected = { ...schema, document, name: draft.name ?? schema.name, assignments: draft.assignments,
                ...(draft.attachedRules ? { attachedRules: draft.attachedRules } : {}), ...(draft.documentation ? { documentation: draft.documentation } : {}) }, canonical = savedSchemaCanonicalDocument(projected, (kind) => `schema:${kind}:${++canonicalController.idSequence}`, { id: previous.id, contributorId: previous.contributorId, contributorName: previous.contributorName });
            canonical.revision = previous.revision + 1;
            const selected = Object.values(canonical.nodes).find((node) => canonicalPropertyPath(canonical, node.id) === path)?.id;
            if (selected)
                canonical.selectedPropertyId = selected;
            return canonical;
        }, scheduleFrame: ports.scheduleFrame, ...(ports.settleCanonical ? { settle: ports.settleCanonical } : {}),
    });
    const propertyView = new SchemaPropertyView({
        root: ports.root, document: schemaOwnerDocument, library, property: propertyController, rules: ruleController, canonical: canonicalController,
        active: () => active(), editorDraft: (schema) => schemaEditorDraft(schema), parentDocuments: () => propertyController.parentDocuments(),
        normalizedPath: (path) => normalizedRulePickerPath(path), replaceActive: (schema) => replaceActive(schema),
        persistLibrary: () => persistSchemaLibrary(), persistLibraries: () => persistSchemaAndRuleLibraries(),
        queuePersistence: (schemaId) => queueSchemaLibraryPersistence(schemaId), renderAll: () => renderSchemas(), createId: ports.createRuleId,
        settleCanonical: Boolean(ports.settleCanonical), openCanonicalActions: (path, trigger) => { openCompactCanonicalPropertyActions(path, trigger); },
        openCanonicalRule: (path, trigger) => { openCompactCanonicalRuleEditor(path, trigger); }, openManual: (path, trigger) => propertyController.openManual(path, trigger),
        openRulePicker: (path, trigger) => openSchemaPropertyRulePicker(path, trigger), openSpecificIndex: (path, trigger) => propertyController.openSpecificIndex(path, trigger),
        openCopy: (path, trigger) => propertyController.openCopy(path, trigger), requestRemoval: (path, trigger) => propertyController.requestRemoval(path, trigger),
        requestDocumentationRemoval: (path, trigger) => propertyController.requestDocumentationRemoval(path, trigger),
        updateAttachedRule: (schemaId, ruleId, enabled) => { updateAttachedRule(schemaId, ruleId, enabled); },
        openAttachedRule: (schemaId, ruleId, path, trigger) => { openAttachedSchemaRuleEditor(schemaId, ruleId, path, trigger); },
        promoteRule: (path, ruleId) => { openLocalRulePromotionReview(path, ruleId); },
    });
    const libraryEditor = new SchemaLibraryEditor({
        root: ports.root, document: schemaOwnerDocument, library, canonical: canonicalController, active: () => active(),
        editorDraft: (schema) => schemaEditorDraft(schema), replaceActive: (schema) => replaceActive(schema), persist: () => persistSchemaLibrary(),
        renderAll: () => renderSchemas(), renderProperty: () => renderSchemaPropertyView(), renderInheritance: (schema) => renderSchemaInheritancePresentation(schema),
        revisionVersion: () => revisionVersion(), openSpecification: (schema, surface, trigger) => openSchemaSpecification(schema, surface, trigger), listen,
        proposeName: (schema, name) => proposeInstalledSchemaWorkingDraftName(schema, name), persistIfStored: () => persistEditedSchemaIfStored(),
        persistLibraries: () => persistSchemaAndRuleLibraries(), closeCanonical: () => closeCompactCanonicalEditor(),
        beginSettlement: (schemaId) => beginCompactCanonicalSettlement(schemaId), clearSettlement: (schemaId, settlement) => { clearCompactCanonicalSettlement(schemaId, settlement); },
        ...(ports.settleCanonical ? { settle: ports.settleCanonical } : {}), mounted: () => lifecycle.isMounted(), renderCanonical: () => renderCompactCanonicalEditor(),
        revalidate: () => refreshCurrentLiveAfterSchemaPublication(), rules: () => ruleController.rules,
        addPublishedRules: (published) => {
            let changed = false;
            for (const rule of published.attachedRules ?? []) {
                if (!rule.id.startsWith("rule:") || ruleController.rules.some(({ id }) => id === rule.id))
                    continue;
                ruleController.rules = [...ruleController.rules, { id: rule.id, name: rule.name ?? rule.id, kind: rule.operator ?? "required", version: rule.version, enabled: rule.enabled !== false,
                        ...(rule.operator ? { operator: rule.operator } : {}), ...(rule.parameters ? { parameters: rule.parameters } : {}), ...(rule.severity ? { severity: rule.severity } : {}),
                        ...(rule.message ? { message: rule.message } : {}), attachments: [published.id] }];
                changed = true;
            }
            return changed;
        },
        withParent: (schema, parentSchemaId) => withSchemaParent(schema, parentSchemaId),
    });
    const compactCanonicalProjection = (adapter, canonical = adapter.load()) => adapter.projection?.(canonical) ?? compactSchemaProjection(canonical, { id: canonical.contributorId, name: canonical.contributorName, version: canonical.revision });
    const compactCanonicalFacetText = (canonical, node) => {
        const allowed = node.allowedValues.length ? node.allowedValues.map(({ value }) => String(value)).join(", ") : "none";
        return `Canonical facets · type ${node.type} · presence ${node.presence.mode} · allowed values ${allowed} · revision ${canonical.revision}`;
    };
    const beginCompactCanonicalSettlement = (schemaId) => {
        const settlement = canonicalController.beginSettlement(schemaId);
        schemaEditor?.setAttribute("aria-busy", "true");
        if (saveSchemaButton)
            saveSchemaButton.disabled = true;
        return settlement;
    };
    const clearCompactCanonicalSettlement = (schemaId, settlement) => canonicalController.clearSettlement(schemaId, settlement);
    const renderCompactCanonicalContext = () => canonicalController.renderContext({
        host: compactCanonicalContext, document: schemaOwnerDocument, generation: lifecycle.generation(),
        isCurrent: (generation) => lifecycle.isCurrent(generation),
        dispatch: (command) => canonicalController.dispatchCommand(command),
        propertyAction: (propertyId, action, value) => canonicalController.propertyAction(propertyId, action, value),
        retry: () => canonicalController.retryCommand(), reject: () => canonicalController.rejectCommand(), rerender: renderCompactCanonicalContext,
    });
    function removeCompactCanonicalTableEditor() {
        canonicalController.tableHost?.replaceChildren();
        canonicalController.tableHost?.remove();
        canonicalController.tableHost = undefined;
        canonicalController.tableEditor = undefined;
        canonicalController.tableKey = undefined;
    }
    function renderCompactCanonicalEditor() {
        renderCompactCanonicalContext();
        const adapter = canonicalController.editor;
        if (!adapter || !schemaEditor || !schemaOwnerDocument) {
            removeCompactCanonicalTableEditor();
            return;
        }
        const canonical = adapter.load();
        library.draft = compactCanonicalProjection(adapter, canonical);
        canonicalController.revisionSnapshots.set(canonical.revision, structuredClone(canonical));
        const selected = canonical.selectedPropertyId ? canonical.nodes[canonical.selectedPropertyId] : undefined;
        const presented = library.activeSchemaId ? schemaEditorDraft(active()) : library.draft;
        const selectedPathStillExists = presented && schemaPropertyAt(presented.document, normalizedRulePickerPath(propertyController.selectedPath));
        if (selected && !selectedPathStillExists)
            propertyController.selectedPath = canonicalPropertyPath(canonical, selected.id).slice(1).replaceAll("/", ".");
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
        if (!canonicalController.tableHost?.isConnected) {
            canonicalController.tableHost = schemaOwnerDocument.createElement("section");
            canonicalController.tableHost.id = "compact-canonical-table-editor";
            schemaEditor.append(canonicalController.tableHost);
            canonicalController.tableEditor = undefined;
            canonicalController.tableKey = undefined;
        }
        canonicalController.tableHost.replaceChildren();
        canonicalController.tableKey = adapter.key;
        const createEditor = ports.createCanonicalTableEditor ?? mountCanonicalSchemaEditor;
        canonicalController.tableEditor = createEditor({ host: canonicalController.tableHost, surface: "Side panel",
            conceptSuggestions: ports.canonicalConceptSuggestions, load: adapter.load, id: (kind) => `${kind}:${crypto.randomUUID()}`,
            dispatch: (command) => canonicalController.beginCommand(command)?.result
                ?? canonicalController.blockedCommand(adapter, command, "The canonical editor is no longer available."),
            ...(adapter.onUndo ? { onUndo: adapter.onUndo } : {}), ...(adapter.onRedo ? { onRedo: adapter.onRedo } : {}) });
        const tableControl = Array.from(canonicalController.tableHost.querySelectorAll("button")).find(({ textContent }) => textContent?.trim() === "Table");
        const treeControl = Array.from(canonicalController.tableHost.querySelectorAll("button")).find(({ textContent }) => textContent?.trim() === "Tree");
        tableControl?.addEventListener("click", () => {
            const current = adapter.load();
            canonicalController.beginCommand({ kind: "view", baseRevision: current.revision, view: "table" });
            canonicalController.tableHost.hidden = false;
        }, { once: true });
        treeControl?.addEventListener("click", () => {
            const current = adapter.load();
            canonicalController.beginCommand({ kind: "view", baseRevision: current.revision, view: "tree" });
            renderCompactCanonicalEditor();
        }, { once: true });
        canonicalController.tableHost.hidden = adapter.load().view !== "table";
        const unavailable = canonicalController.semanticUnresolved();
        schemaEditor.setAttribute("aria-busy", String(unavailable));
        if (saveSchemaButton && adapter.key.startsWith("saved:"))
            saveSchemaButton.disabled = saveSchemaButton.disabled || unavailable;
    }
    const openCompactCanonicalEditor = (adapter) => {
        if (!adapter.key.startsWith("saved:")) {
            library.activeSchemaId = undefined;
            canonicalController.savedDocument = undefined;
            library.draft = undefined;
        }
        canonicalController.editor = adapter;
        canonicalController.reopenSelection = adapter.key;
        canonicalController.commandFeedback = undefined;
        canonicalController.revisionSnapshots.clear();
        canonicalController.revisionSnapshots.set(adapter.load().revision, structuredClone(adapter.load()));
        if (schemaDetail)
            schemaDetail.scrollTop = canonicalController.scrollByKey.get(adapter.key) ?? 0;
        renderCompactCanonicalEditor();
    };
    const closeCompactCanonicalEditor = (clearSchemaSelection = true) => {
        if (canonicalController.editor && schemaDetail)
            canonicalController.scrollByKey.set(canonicalController.editor.key, schemaDetail.scrollTop);
        canonicalController.discardProjectionPersistence(canonicalController.editor);
        canonicalController.editor = undefined;
        if (clearSchemaSelection) {
            library.activeSchemaId = undefined;
            library.draft = undefined;
            canonicalController.savedDocument = undefined;
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
        canonicalController.savedDocument = canonical;
        persistSchemaLibrary();
    };
    const persistSavedProjectionMetadata = (schemaId, projection, change) => {
        const stored = library.schemas.find(({ id }) => id === schemaId);
        if (!stored)
            throw new Error("The saved schema is unavailable.");
        const canonical = canonicalController.savedDocument;
        const updated = updateSchemaWorkingDraft(proposeInstalledSchemaWorkingDraftName(stored, projection.name), {
            document: projection.document, assignments: projection.assignments, attachedRules: projection.attachedRules,
            parentSchemaId: projection.parentSchemaId, inheritedRuleOverrides: projection.inheritedRuleOverrides,
            documentation: projection.documentation, ...(canonical ? { canonicalSchema: { ...canonical, contributorName: projection.name } } : {})
        }, change === "schema name" ? undefined : change);
        if (JSON.stringify(updated) === JSON.stringify(stored))
            return false;
        library.schemas = library.schemas.map((candidate) => candidate.id === schemaId ? updated : candidate);
        if (canonical)
            canonicalController.savedDocument = { ...canonical, contributorName: projection.name };
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
        canonicalController.savedDocument = savedSchemaCanonicalDocument(library.draft, (kind) => `schema:${kind}:${++canonicalController.idSequence}`);
        const adapter = { key: `saved:${schema.id}`, label: `${schema.name} · Saved schema working draft`,
            load: () => canonicalController.savedDocument, projection: (canonical) => savedCompactCanonicalProjection(schema.id, canonical),
            dispatch: (command) => {
                const result = applyCanonicalCommand(canonicalController.savedDocument, command);
                if (result.status === "applied" || result.status === "rebased") {
                    if (command.kind === "select" || command.kind === "view")
                        canonicalController.savedDocument = result.document;
                    else
                        persistSavedCanonicalResult(schema.id, result.document, `${command.kind} canonical property`);
                }
                return result;
            },
            stageProjectionCommand: (command) => {
                const result = applyCanonicalCommand(canonicalController.savedDocument, command);
                if (result.status === "applied" || result.status === "rebased")
                    canonicalController.savedDocument = result.document;
                return result;
            },
            restoreStagedProjection: (canonical) => { canonicalController.savedDocument = structuredClone(canonical); },
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
        if (canonicalController.libraryPersistenceWorker || !canonicalController.queuedLibraryPersistence || canonicalController.settlementClaims.size)
            return;
        const queuedSchemaId = canonicalController.queuedLibraryPersistence.schemaId;
        canonicalController.libraryPersistenceWorker = (async () => {
            let activeRequest;
            try {
                while (lifecycle.isMounted() && canonicalController.queuedLibraryPersistence) {
                    const request = canonicalController.queuedLibraryPersistence;
                    activeRequest = request;
                    canonicalController.queuedLibraryPersistence = undefined;
                    canonicalController.settlementPending = true;
                    canonicalController.settlementSchemaId = activeRequest.schemaId;
                    schemaEditor?.setAttribute("aria-busy", "true");
                    ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeChangedSchemaLibrary(activeRequest.schemas));
                    ports.changed(activeRequest.schemas);
                    await ports.settleCanonical(activeRequest.schemaId);
                    activeRequest = undefined;
                }
            }
            catch {
                if (ports.blocked?.() && !canonicalController.queuedLibraryPersistence && activeRequest)
                    canonicalController.queuedLibraryPersistence = activeRequest;
            }
            finally {
                canonicalController.libraryPersistenceWorker = undefined;
                if (!canonicalController.queuedLibraryPersistence)
                    clearCompactCanonicalSettlement(activeRequest?.schemaId ?? queuedSchemaId);
                if (canonicalController.editor)
                    renderCompactCanonicalEditor();
                else
                    schemaEditor?.setAttribute("aria-busy", String(Boolean(canonicalController.queuedLibraryPersistence)));
            }
        })();
    };
    const queueSchemaLibraryPersistence = (schemaId) => {
        if (!ports.settleCanonical) {
            persistSchemaLibrary();
            return;
        }
        canonicalController.queuedLibraryPersistence = { schemaId, schemas: structuredClone(library.schemas) };
        canonicalController.settlementPending = true;
        canonicalController.settlementSchemaId = schemaId;
        schemaEditor?.setAttribute("aria-busy", "true");
        void canonicalController.settlementBarrier.then((committed) => { if (committed)
            startQueuedSchemaLibraryPersistence(); });
    };
    const persistEditedSchemaIfStored = () => { if (activeIndex() >= 0)
        persistSchemaLibrary(); };
    const replaceActive = (schema) => library.replaceActive(schema);
    const revisionVersion = () => Number(schemaRevisionSelector?.value || active().version);
    const renderSchemaPropertyView = () => propertyView.render();
    function renderSchemaDraft() { libraryEditor.render(); }
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
        const relationship = ports.relationshipTree(library.schemas), invokingReference = editorRoute.invokingReference();
        relationshipTreeController.render({
            projectId: relationship.projectId, nodes: relationship.nodes, schemas: library.schemas,
            ...(library.activeSchemaId ? { activeSchemaId: library.activeSchemaId } : {}),
            ...(invokingReference ? { invokingReference } : {}),
            historyCount: (schema) => schemaRevisionChoices(schema).length,
            editSaved: (schema, trigger, referenceKey) => {
                editorRoute.open(trigger, referenceKey);
                library.activeSchemaId = schema.id;
                library.draft = structuredClone(schema);
                renderSchemas();
                openSavedSchemaInUnifiedEditor(schema);
            },
            duplicateSaved: (schema) => { library.schemas = [...library.schemas, duplicateSchemaRevision(schema, schema.version, library.schemas)]; persistSchemaLibrary(); renderSchemas(); },
            adoptSaved: requestSavedSchemaAdoption,
            buildSpecification: (schema, trigger) => openSchemaSpecification(schema, `published:${schema.version}`, trigger),
            exportSaved: (schema, trigger) => library.openExportChoices(trigger, schema),
            reportMissing: (schema) => ports.reportMissingSchemaEvent(schema.id),
            deleteSaved: (schema) => { library.requestDeletion(schema.id); },
            openContributor: (key, trigger, referenceKey) => {
                editorRoute.open(trigger, referenceKey);
                const retainedScroll = canonicalController.editor?.key === key ? schemaDetail?.scrollTop : undefined;
                openContributorInUnifiedEditor(key);
                if (schemaDetail && retainedScroll !== undefined)
                    schemaDetail.scrollTop = retainedScroll;
                renderSchemas();
            },
            openContributorInStudio: ports.openContributorInStudio, openProject: ports.openProjectLibrary, rerender: renderSchemas,
        });
        renderSchemaDraft();
        assignmentController.render();
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
    const persistSchemaEditorDraft = () => libraryEditor.persistDraft();
    const updateSchemaEditorName = () => libraryEditor.updateName();
    const saveSchemaDescription = () => libraryEditor.saveDescription();
    const updateSchemaTarget = () => libraryEditor.updateTarget();
    const changeSchemaParent = () => libraryEditor.changeParent();
    const changeOnlyDeclaredProperties = () => libraryEditor.changeAdditionalProperties();
    const openSchemaRevisionReview = () => libraryEditor.openRevisionReview();
    function refreshCurrentLiveAfterSchemaPublication() { return ports.revalidateCurrentLive?.(structuredClone(library.schemas), structuredClone(validationController.manualOverrides)) ?? 0; }
    const publishActiveSchema = (closeEditor = false) => libraryEditor.publish(closeEditor);
    const confirmSchemaRevision = () => libraryEditor.confirmRevision();
    const cancelSchemaRevision = () => libraryEditor.cancelRevision();
    const discardSchemaDraft = () => libraryEditor.discardTransient();
    const keepEditingSchema = () => libraryEditor.keepEditing();
    const closeSchemaEditor = () => libraryEditor.closeEditor();
    const saveAndCloseSchema = () => libraryEditor.openRevisionReview();
    const saveSchemaFromCloseReview = () => { const dialog = ports.root.querySelector("#close-schema-editor-review"); dialog?.close(); if (dialog)
        dialog.hidden = true; libraryEditor.openRevisionReview(); };
    const discardWorkingSchemaDraft = () => libraryEditor.discardWorking();
    const renderSchemaRevisionComparison = () => libraryEditor.render();
    const duplicateSelectedSchemaRevision = () => libraryEditor.duplicateRevision();
    const restoreSelectedSchemaRevision = () => libraryEditor.restoreRevision();
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
    function requestSchemaPropertyRemoval(path, trigger) {
        propertyController.requestRemoval(path, trigger);
    }
    const confirmSchemaPropertyRemoval = () => propertyController.confirmRemoval();
    const cancelSchemaPropertyRemoval = () => propertyController.cancelRemoval();
    const cancelSchemaPropertyRemovalFromDialog = (event) => propertyController.cancelRemoval(event);
    const undoLastSchemaPropertyRemoval = () => propertyController.undoRemoval();
    function requestSchemaDocumentationRemoval(path, trigger) {
        propertyController.requestDocumentationRemoval(path, trigger);
    }
    const confirmSchemaDocumentationRemovalAction = () => {
        propertyController.confirmDocumentationRemoval();
        schemaEditor?.setAttribute("aria-busy", String(Boolean(ports.settleCanonical)));
    };
    const cancelSchemaDocumentationRemovalAction = () => propertyController.closeDocumentationRemoval();
    const cancelSchemaDocumentationRemovalFromDialog = (event) => { event.preventDefault(); propertyController.closeDocumentationRemoval(); };
    function openSchemaPropertyCopyReview(path, triggerOrDestination) { propertyController.openCopy(path, triggerOrDestination); }
    const confirmSchemaPropertyCopy = () => propertyController.confirmCopy();
    const undoLastSchemaPropertyCopy = () => propertyController.undoCopy();
    const renderSpecificIndexInspection = () => propertyController.renderSpecificIndex();
    const openSpecificIndexDialog = (arrayPath, trigger) => propertyController.openSpecificIndex(arrayPath, trigger);
    const submitSpecificIndex = (event) => propertyController.submitSpecificIndex(event);
    const closeSpecificIndexDialog = () => propertyController.closeSpecificIndex();
    const cancelSpecificIndexDialog = (event) => propertyController.closeSpecificIndex(event);
    function schemaParentDocuments() { return propertyController.parentDocuments(); }
    function renderManualPropertyForm() { propertyController.renderManual(); }
    function closeManualPropertyForm(restoreFocus = true) { propertyController.closeManual(restoreFocus); }
    function openManualPropertyForm(parentPath, trigger) { propertyController.openManual(parentPath, trigger); }
    const submitManualProperty = (event) => propertyController.submitManual(event);
    function openContextualManualPropertyForm(parentPath, trigger) { propertyController.openManual(parentPath, trigger); }
    const openManualPropertyFromControl = () => propertyController.openManual();
    const cancelManualPropertyDialog = () => propertyController.closeManual();
    const cancelManualPropertyFromDialog = (event) => { event.preventDefault(); propertyController.closeManual(); };
    const goToExistingSchemaProperty = () => propertyController.goToExisting();
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
        const configuration = ruleController.configuration;
        if (configuration) {
            const details = configuredRuleDetails(configuration), generatedId = configuration.saveReusable
                ? ports.createRuleId() : ports.createRuleId().replace(/^rule:/, "local-rule:");
            return { id: ruleController.editingAttached?.id ?? ruleController.editingReusableId ?? generatedId,
                name: configuration.reusableName.trim() || `${configuration.ruleType} for ${ruleController.pickerPath}`, kind: configuration.ruleType,
                version: storedReusableRule(ruleController.editingReusableId ?? "")?.version ?? 0, enabled: configuration.enabled, applicableType: configuration.propertyType,
                operator: details.operator, ...(details.parameters !== undefined ? { parameters: details.parameters } : {}),
                ...(details.allowedValues !== undefined ? { allowedValues: details.allowedValues } : {}), ...(details.comparison !== undefined ? { comparison: details.comparison } : {}),
                ...(details.limit !== undefined ? { limit: details.limit } : {}), severity: configuration.severity,
                ...(configuration.message.trim() ? { message: configuration.message.trim() } : {}),
                ...(configuration.applyOnlyWhen ? { conditionGroup: { operator: configuration.conditionGroupOperator, predicates: structuredClone(configuration.conditions) } } : {}),
                ...(configuration.description.trim() ? { description: configuration.description.trim() } : {}) };
        }
        const name = schemaRuleName?.value.trim() || "Untitled rule", operator = schemaRuleOperator?.value || "required";
        return { id: ruleController.editingReusableId ?? ports.createRuleId(), name, kind: operator, version: storedReusableRule(ruleController.editingReusableId ?? "")?.version ?? 0,
            enabled: true, applicableType: (schemaRuleTypes?.value || "string"), operator,
            ...(schemaRuleParameters?.value.trim() ? { parameters: schemaRuleParameters.value.trim() } : {}),
            ...(schemaRuleSeverity?.value ? { severity: schemaRuleSeverity.value } : {}), ...(schemaRuleMessage?.value.trim() ? { message: schemaRuleMessage.value.trim() } : {}) };
    }
    function renderConditionalRuleConfiguration() {
        if (!schemaPropertyRulePicker || !ruleController.pickerPath)
            return;
        const condition = initialConditionPredicate(ruleController.pickerPath);
        schemaPropertyRulePicker.dataset.conditionPreview = JSON.stringify({
            propertyPath: normalizedRulePickerPath(ruleController.pickerPath), ...condition
        });
    }
    function renderSchemaLocalRuleConfiguration() { renderSchemaPropertyRulePicker(); renderConditionalRuleConfiguration(); }
    function createConfiguredSchemaRule() {
        if (!ruleController.pickerPath || (!library.activeSchemaId && !library.draft))
            return false;
        const rule = configuredRuleInput();
        const savedRule = { ...rule, version: ruleController.editingAttached?.version ?? Math.max(1, rule.version + 1) };
        if (ruleController.configuration?.saveReusable)
            ruleController.rules = [...ruleController.rules.filter(({ id }) => id !== savedRule.id), savedRule];
        const attached = attachReusableRule(library.activeSchemaId ?? library.draft.id, savedRule.id, ruleController.pickerPath, savedRule);
        if (attached)
            closeSchemaPropertyRulePickerForCommit();
        return attached;
    }
    function openCompactCanonicalRuleEditor(path, trigger) {
        const adapter = canonicalController.editor, base = adapter?.load(), node = base && Object.values(base.nodes)
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
                        const current = adapter.load(), result = await canonicalController.dispatchCommand({ kind: "set", baseRevision: current.revision,
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
        ruleController.pickerPath = path;
        ruleController.pickerTrigger = trigger;
        ruleController.configuration = undefined;
        ruleController.editingAttached = undefined;
        render();
        schemaPropertyRulePicker.showModal();
        schemaPropertyRulePicker.querySelector('[aria-label="Compact staged rule editor"] > button')?.focus({ preventScroll: true });
        return true;
    }
    function openCompactCanonicalPropertyActions(path, trigger) {
        const adapter = canonicalController.editor, documentModel = adapter?.load(), original = documentModel && Object.values(documentModel.nodes).find((candidate) => canonicalPropertyPath(documentModel, candidate.id) === path || candidate.id === path), owner = schemaEditor;
        if (!adapter || !documentModel || !original || !owner || !schemaOwnerDocument)
            return false;
        canonicalController.propertyMenuId = original.id;
        propertyController.selectedPath = path.replace(/^\//, "").replaceAll("/", ".");
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
            changes.append(Object.assign(schemaOwnerDocument.createElement("li"), { textContent: `Structure ${operation.kind} · ${"propertyId" in operation ? operation.propertyId : original.id}` })); cancel.type = "button"; cancel.textContent = "Cancel review"; cancel.addEventListener("click", () => showSection(section, "Review changes")); confirm.type = "button"; confirm.textContent = "Confirm changes"; confirm.addEventListener("click", () => { void canonicalController.dispatchCommand({ kind: "set", baseRevision: adapter.load().revision, propertyId: original.id, patch, operations: stagedOperations }).then((result) => { if (result)
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
    const updateConfiguredRulePreview = () => { if (ruleController.pickerPath)
        renderSchemaLocalRuleConfiguration(); };
    const renderSchemaPropertyRulePicker = () => {
        propertyController.renderSequence += 1;
        if (!schemaPropertyRulePicker || !ruleController.pickerPath)
            return;
        ruleController.clearPicker();
        const path = ruleController.pickerPath, document = schemaPropertyRulePicker.ownerDocument;
        if (!document)
            return;
        if (!ruleController.configuration) {
            const heading = document.createElement("h4"), search = document.createElement("input"), results = document.createElement("section"), cancel = document.createElement("button"), propertyType = schemaRuleTypeForAttachment(active(), path);
            heading.id = "schema-property-rule-picker-heading";
            heading.textContent = `Add rule for ${path} · type ${propertyType}`;
            results.id = "schema-property-rule-results";
            search.id = "schema-property-rule-search";
            search.value = ruleController.pickerSearch;
            schemaPropertyRulePicker.setAttribute("aria-labelledby", heading.id);
            cancel.type = "button";
            cancel.textContent = "Cancel";
            const canonicalPath = normalizedRulePickerPath(path), attachedIds = new Set((active().workingDraft?.attachedRules ?? active().attachedRules ?? [])
                .filter(({ propertyPath }) => normalizedRulePickerPath(propertyPath ?? "") === canonicalPath)
                .map(({ id }) => id));
            const normalized = ruleController.pickerSearch.trim().toLowerCase(), builtIns = builtInRulesForProperty(propertyType)
                .filter((rule) => !normalized || [rule.name, rule.operator, rule.applicableType].join(" ").toLowerCase().includes(normalized));
            const reusable = reusableRulesForProperty(ruleController.rules, propertyType, ruleController.pickerSearch, attachedIds);
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
                const action = () => { ruleController.configuration = createRuleConfiguration(rule.name, propertyType); renderSchemaPropertyRulePicker(); };
                button.addEventListener("click", action);
                ruleController.ownPicker(() => button.removeEventListener("click", action));
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
                ruleController.ownPicker(() => button.removeEventListener("click", action));
                article.append(button, metadata);
                library.append(article);
            }
            if (!builtIns.length && !reusable.length) {
                const empty = document.createElement("p"), clear = document.createElement("button");
                empty.id = "schema-property-rule-empty";
                empty.textContent = "No compatible rules match this search";
                clear.type = "button";
                clear.textContent = "Clear search";
                const clearSearch = () => { ruleController.pickerSearch = ""; renderSchemaPropertyRulePicker(); };
                clear.addEventListener("click", clearSearch);
                ruleController.ownPicker(() => clear.removeEventListener("click", clearSearch));
                results.append(empty, clear);
            }
            else
                results.append(create, library);
            const cancelPicker = () => closeSchemaPropertyRulePicker(), searchRules = () => { ruleController.pickerSearch = search.value; renderSchemaPropertyRulePicker(); };
            cancel.addEventListener("click", cancelPicker);
            search.addEventListener("input", searchRules);
            ruleController.ownPicker(() => cancel.removeEventListener("click", cancelPicker), () => search.removeEventListener("input", searchRules));
            schemaPropertyRulePicker.replaceChildren(heading, search, results, cancel);
            return;
        }
        const configuration = ruleController.configuration;
        const editLabel = ruleController.editingAttached ? `Edit ${ruleController.editingAttached.name ?? ruleController.editingAttached.id}` : "Create local rule";
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
            ruleController.ownPicker(() => input.removeEventListener(control.inputType === "select" ? "change" : "input", update));
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
                ruleController.ownPicker(() => input.removeEventListener("input", update), () => remove.removeEventListener("click", removeValue));
                allowedValues.append(input, remove);
            });
        if (configuration.ruleType === "Allowed values") {
            const add = document.createElement("button");
            add.type = "button";
            add.textContent = "Add another value";
            const addValue = () => { configuration.allowedValues.push(""); renderSchemaPropertyRulePicker(); };
            add.addEventListener("click", addValue);
            ruleController.ownPicker(() => add.removeEventListener("click", addValue));
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
        ruleController.ownPicker(() => severity.removeEventListener("change", changeSeverity), () => message.removeEventListener("input", changeMessage), () => enabled.removeEventListener("change", changeEnabled));
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
        ruleController.ownPicker(() => conditional.removeEventListener("change", changeConditional), () => reusable.removeEventListener("change", changeReusable));
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
            ruleController.ownPicker(() => group.removeEventListener("change", changeGroup));
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
                ruleController.ownPicker(() => property.removeEventListener("change", changeProperty), () => operator.removeEventListener("change", changeOperator), () => comparison.removeEventListener("input", changeComparison), () => remove.removeEventListener("click", removeCondition));
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
            ruleController.ownPicker(() => add.removeEventListener("click", addCondition));
            conditions.append(add, preview);
            form.append(conditions);
        }
        if (!ruleController.editingAttached)
            form.append(reusableLabel);
        if (!ruleController.editingAttached && configuration.saveReusable) {
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
            ruleController.ownPicker(() => name.removeEventListener("input", changeName), () => description.removeEventListener("input", changeDescription));
            form.append(explanation, name, description);
        }
        const back = document.createElement("button"), cancel = document.createElement("button"), create = document.createElement("button");
        back.type = cancel.type = "button";
        create.type = "submit";
        back.textContent = "Back to rule choices";
        cancel.textContent = "Cancel";
        create.textContent = ruleController.editingAttached ? "Save changes" : "Create rule";
        createButton = create;
        const goBack = () => { ruleController.configuration = undefined; renderSchemaPropertyRulePicker(); }, cancelEdit = () => closeSchemaPropertyRulePicker();
        const submit = (event) => { event.preventDefault(); if (validateRuleConfiguration(configuration).ready)
            createConfiguredSchemaRule(); };
        back.addEventListener("click", goBack);
        cancel.addEventListener("click", cancelEdit);
        form.addEventListener("submit", submit);
        ruleController.ownPicker(() => back.removeEventListener("click", goBack), () => cancel.removeEventListener("click", cancelEdit), () => form.removeEventListener("submit", submit));
        form.append(status, create, ...(ruleController.editingAttached ? [] : [back]), cancel);
        schemaPropertyRulePicker.replaceChildren(form);
        refreshValidation();
    };
    function openSchemaPropertyRulePicker(path, trigger) {
        if (canonicalController.editor && !canonicalController.editor.key.startsWith("saved:") && openCompactCanonicalRuleEditor(path, trigger))
            return;
        ruleController.pickerPath = path;
        ruleController.pickerTrigger = trigger;
        propertyController.selectedPath = path;
        propertyController.interactionReturn = { schemaId: active().id, path, triggerLabel: trigger?.ariaLabel ?? `Add rule for ${path}`,
            editorScroll: schemaEditor?.scrollTop ?? 0, treeScroll: schemaPropertyTree?.scrollTop ?? 0, detailScroll: schemaDetail?.scrollTop ?? 0 };
        ruleController.configuration = undefined;
        renderSchemaLocalRuleConfiguration();
        schemaPropertyRulePicker?.showModal();
        schemaPropertyRulePicker?.querySelector("#schema-property-rule-search")?.focus({ preventScroll: true });
    }
    function closeSchemaPropertyRulePicker() {
        const triggerLabel = ruleController.pickerTrigger?.getAttribute("aria-label") ?? propertyController.interactionReturn?.triggerLabel;
        schemaPropertyRulePicker?.close();
        const currentTrigger = ruleController.pickerTrigger?.isConnected ? ruleController.pickerTrigger
            : Array.from(schemaPropertyTree?.querySelectorAll("button") ?? [])
                .find((button) => button.getAttribute("aria-label") === triggerLabel);
        currentTrigger?.focus({ preventScroll: true });
        ruleController.pickerPath = undefined;
        ruleController.pickerTrigger = undefined;
        ruleController.configuration = undefined;
        ruleController.pickerSearch = "";
        ruleController.editingAttached = undefined;
        propertyController.interactionReturn = undefined;
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
    const persistReusableSchemaRules = () => ruleController.persist();
    const applyPersistenceSnapshot = (nextSchemas, nextRules) => {
        library.schemas = structuredClone([...nextSchemas]);
        ruleController.rules = structuredClone([...nextRules]);
        ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(library.schemas));
        persistReusableSchemaRules();
        renderSchemas();
        ruleController.render();
    };
    const restorePersistenceSnapshot = (nextSchemas, nextRules) => {
        library.schemas = structuredClone([...nextSchemas]);
        ruleController.rules = structuredClone([...nextRules]);
        persistReusableSchemaRules();
        renderSchemas();
        ruleController.render();
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
        if (propertyController.pendingCopyPosition && propertyController.pendingCopyPosition.settlementSchemaId === event.schemaId
            && (event.type === "saved" || event.type === "retried" || event.type === "rejected")) {
            const restoration = propertyController.pendingCopyPosition;
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
                    if (propertyController.pendingCopyPosition === restoration)
                        propertyController.pendingCopyPosition = undefined;
                });
            });
        }
        if (event.type === "retried" && canonicalController.editor && canonicalController.projectionRequest?.adapter === canonicalController.editor
            && canonicalController.savedSchemaId(canonicalController.editor) === event.schemaId) {
            return canonicalController.resumeProjectionPersistence(canonicalController.editor).then(() => { renderSchemas(); renderCompactCanonicalEditor(); });
        }
        if (event.type === "saved") {
            const acknowledged = [...canonicalController.settlementClaims]
                .find(([, schemaId]) => schemaId === event.schemaId)?.[0];
            if (acknowledged !== undefined)
                clearCompactCanonicalSettlement(event.schemaId, acknowledged);
            if (canonicalController.editor)
                renderCompactCanonicalEditor();
        }
        if (canonicalController.settlementSchemaId === event.schemaId) {
            if (event.type === "retried" || event.type === "rejected") {
                clearCompactCanonicalSettlement(event.schemaId);
                if (event.type === "rejected") {
                    canonicalController.pendingCommand = undefined;
                    canonicalController.pendingBase = undefined;
                    canonicalController.projectionRequest = undefined;
                    canonicalController.commandFeedback = "Durable schema change rejected; the saved state was restored.";
                }
                if (canonicalController.editor)
                    renderCompactCanonicalEditor();
            }
        }
        const pendingTransactions = [pendingLocalRulePromotionPersistence, pendingGuidedValidationPersistence];
        const transactional = pendingTransactions.some((pending) => pending?.schemaId === event.schemaId && !pending.settled);
        if (event.type === "failed" && !transactional && canonicalController.settlementSchemaId !== event.schemaId) {
            library.reload();
            if (library.activeSchemaId) {
                const activeStored = library.schemas.find(({ id }) => id === library.activeSchemaId);
                if (activeStored) {
                    library.draft = schemaEditorDraft(activeStored);
                    canonicalController.savedDocument = savedSchemaCanonicalDocument(library.draft, (kind) => `schema:${kind}:${++canonicalController.idSequence}`);
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
        if (ruleController.pendingPromotion)
            ruleController.promotionFocusReturn = {
                propertyPath: ruleController.pendingPromotion.propertyPath, ruleId: ruleId ?? ruleController.pendingPromotion.sourceRuleId,
                detailScroll: ruleController.pendingPromotion.detailScroll
            };
        ruleController.pendingPromotion = undefined;
        if (rerender) {
            renderSchemas();
            ruleController.render();
        }
        const focusReturn = ruleController.promotionFocusReturn ? { ...ruleController.promotionFocusReturn } : undefined;
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
        const focusedPosition = ruleController.promotionFocusedPosition?.propertyPath === propertyPath
            && ruleController.promotionFocusedPosition.ruleId === sourceRuleId ? ruleController.promotionFocusedPosition : undefined;
        ruleController.pendingPromotion = { propertyPath, sourceRuleId, generation,
            detailScroll: focusedPosition?.detailScroll ?? schemaDetail?.scrollTop ?? 0 };
        ruleController.promotionFocusReturn = undefined;
        localRulePromotionDialog.open({ review,
            cancel: () => { if (ruleController.pendingPromotion?.generation === generation)
                restoreLocalRulePromotionPresentation(undefined, false); },
            confirm: (selected) => {
                if (ruleController.pendingPromotion?.generation !== generation)
                    throw new Error("The promotion review is stale");
                const previousSchemas = structuredClone(library.schemas), previousRules = structuredClone(ruleController.rules);
                const result = selected.action === "create"
                    ? promoteLocalRule({ schema, reusableRules: promotionReusableRules(), propertyPath, sourceRuleId, editorContext, ...selected })
                    : promoteLocalRule({ schema, reusableRules: promotionReusableRules(), propertyPath,
                        sourceRuleId, editorContext, action: "use-existing", reusableRuleId: selected.reusableRuleId });
                const nextSchemas = storedSchema ? library.schemas.map((candidate) => candidate.id === result.schema.id ? result.schema : candidate) : library.schemas;
                const nextRules = storedPromotionRules(result.reusableRules);
                if (!storedSchema) {
                    ruleController.rules = structuredClone([...nextRules]);
                    library.draft = structuredClone(result.schema);
                    persistReusableSchemaRules();
                    renderSchemaDraft();
                    ruleController.render();
                    restoreLocalRulePromotionPresentation();
                    return;
                }
                const completion = beginSchemaPersistence("promotion", result.schema.id, previousSchemas, previousRules, nextSchemas, nextRules);
                persistLocalRulePromotion(ports.storage, { schemaKey: SCHEMA_LIBRARY_STORAGE_KEY,
                    schemaValue: serializeSchemaLibrary(nextSchemas), ruleKey: SCHEMA_RULE_STORAGE_KEY, ruleValue: JSON.stringify(nextRules) });
                library.schemas = structuredClone(nextSchemas);
                ruleController.rules = structuredClone([...nextRules]);
                renderSchemas();
                ruleController.render();
                return completion.then(async () => {
                    await ports.settleCanonical?.(result.schema.id);
                    const focusReplacement = () => Array.from(schemaOwnerDocument?.querySelectorAll?.("button[data-rule-id]")
                        ?? ports.root.querySelectorAll("button[data-rule-id]"))
                        .find(({ dataset }) => dataset.ruleId === result.replacementRuleId && dataset.propertyPath === propertyPath)
                        ?.focus({ preventScroll: true });
                    ports.scheduleFrame(() => ports.scheduleFrame(focusReplacement));
                    return () => {
                        if (ruleController.pendingPromotion?.generation === generation) {
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
        const previousSchemas = structuredClone(library.schemas), previousRules = structuredClone(ruleController.rules);
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
        const nextRules = published ? [...ruleController.rules.filter(({ id }) => id !== published.id),
            { id: published.id, name: published.name, kind: attachedRule.operator ?? "required", version: published.version, enabled: published.enabled ?? true,
                attachments: [schema.id], ...(attachedRule.operator ? { operator: attachedRule.operator } : {}),
                ...(attachedRule.parameters ? { parameters: attachedRule.parameters } : {}), ...(attachedRule.allowedValues ? { allowedValues: attachedRule.allowedValues } : {}),
                ...(attachedRule.severity ? { severity: attachedRule.severity } : {}), ...(attachedRule.message ? { message: attachedRule.message } : {}),
                ...(attachedRule.conditionGroup ? { conditionGroup: attachedRule.conditionGroup } : {}) }] : ruleController.rules;
        applyPersistenceSnapshot(nextSchemas, nextRules);
        return beginSchemaPersistence("guided", schema.id, previousSchemas, previousRules, nextSchemas, nextRules);
    }
    const guidedSchemaCandidates = (event) => guidedController.candidates(event);
    const guidedUiCandidate = (schema) => guidedController.uiCandidate(schema, schema.workingDraft ? schemaEditorDraft(schema) : schema);
    const guidedEvent = (event) => structuredClone(event);
    const guidedUiEvent = (event) => guidedController.uiEvent(event);
    const openGuidedValidationForEvent = async (event, schema) => {
        event = guidedEvent(event);
        const selected = schema ?? guidedController.selected(event) ?? guidedSchemaCandidates(event)[0]?.schema;
        if (selected)
            persistGuidedContinuation(event, selected.id);
        guidedController.propertyReturn = undefined;
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
            guidedController.propertyReturn = schema ? { kind: "schema", schemaId: schema.id, propertyPath, generation: lifecycle.generation() } : undefined;
    };
    const guidedDraftContinuationForEvent = (event) => {
        const schema = guidedController.selected(event);
        return schema?.workingDraft ? { schemaId: schema.id, schemaName: schema.name, schemaVersion: schema.version, pendingChanges: schema.workingDraft.pendingChanges.length,
            addProperty: () => { guidedValidationFlow.open(guidedUiEvent(event), guidedUiCandidate(schema)); }, review: () => openGuidedDraft(schema),
            publish: () => { openGuidedDraft(schema); openSchemaRevisionReview(); }, useDifferent: () => openGuidedContinuationPicker(event) } : undefined;
    };
    const finishGuidedValidationSave = (result) => {
        persistGuidedContinuation({ sourceId: result.assignment.sourceId, name: result.assignment.eventName }, result.schema.id);
        ports.guidedSaved?.(result.destination.kind === "new" ? `Draft ${result.schema.name} was created.` : `Validation was added to ${result.schema.name} draft.`);
        if (guidedController.propertyReturn?.generation === lifecycle.generation() && guidedController.propertyReturn.kind === "capture") {
            const snapshot = guidedController.propertyReturn;
            guidedController.propertyReturn = undefined;
            ports.restoreGuidedCapture(snapshot.eventId, snapshot.propertyPath);
        }
        else if (guidedController.propertyReturn?.generation === lifecycle.generation() && guidedController.propertyReturn.kind === "schema" && guidedController.propertyReturn.schemaId === result.schema.id) {
            restoreGuidedPropertyReturn();
        }
        if (schemaResult)
            schemaResult.textContent = result.destination.kind === "new" ? `Draft ${result.schema.name} was created.` : `Validation was added to ${result.schema.name} draft.`;
    };
    const createSchemaDraft = () => {
        const created = createSchema("", 1, { type: "object" }), transient = { ...created, published: false,
            workingDraft: { name: "", baseVersion: 1, sourceVersion: 1, document: { type: "object" }, assignments: [], pendingChanges: [] } };
        library.activeSchemaId = undefined;
        library.draft = transient;
        propertyController.selectedPath = "";
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
        propertyController.selectedPath = Object.keys(document.properties ?? {})[0] ?? "value";
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
        propertyController.interactionReturn = { schemaId: active().id,
            path, triggerLabel, editorScroll: schemaEditor?.scrollTop ?? 0, treeScroll: schemaPropertyTree?.scrollTop ?? 0, detailScroll: schemaDetail?.scrollTop ?? 0 };
    }
    function restoreSchemaPropertyInteractionReturn() {
        const restoration = propertyController.interactionReturn;
        if (!restoration || restoration.schemaId !== library.activeSchemaId)
            return;
        propertyController.selectedPath = restoration.path;
        if (schemaEditor)
            schemaEditor.scrollTop = restoration.editorScroll;
        schemaPropertyTree && (schemaPropertyTree.scrollTop = restoration.treeScroll);
        schemaDetail && (schemaDetail.scrollTop = restoration.detailScroll);
        renderSchemas();
    }
    function finishSchemaPropertyInteractionReturn() { restoreSchemaPropertyInteractionReturn(); propertyController.interactionReturn = undefined; }
    function closeSchemaPropertyRulePickerInternal(restore = true) { if (restore)
        finishSchemaPropertyInteractionReturn(); closeSchemaPropertyRulePicker(); }
    function closeSchemaPropertyRulePickerForCommit() { closeSchemaPropertyRulePickerInternal(true); }
    const expansionReusableRules = () => structuredClone(ruleController.rules);
    const promotionReusableRules = expansionReusableRules;
    const storedReusableRule = (id) => ruleController.rules.find((rule) => rule.id === id);
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
            return ruleController.edit(ruleId);
        }
        const propertyPath = path ?? attached.propertyPath ?? "";
        propertyController.selectedPath = ruleController.pickerPath = propertyPath;
        ruleController.pickerTrigger = trigger;
        ruleController.editingAttached = attached;
        ruleController.configuration = createRuleConfigurationFromAttachedRule(attachedSchemaRuleType(attached), schemaRuleTypeForAttachment(schema, propertyPath), attached);
        renderSchemaPropertyRulePicker();
        schemaPropertyRulePicker?.showModal();
        schemaPropertyRulePicker?.querySelector("input, select, textarea, button")?.focus({ preventScroll: true });
        return true;
    };
    const focusSchemaPropertyRule = (propertyPath) => { propertyController.selectedPath = propertyPath.replace(/^\//, "").replaceAll("/", "."); renderSchemas(); };
    const focusSchemaPropertyRow = focusSchemaPropertyRule;
    const renderSchemaWorkflowRows = () => { ruleController.render(); assignmentController.render(); };
    const rememberCompactCanonicalScroll = () => {
        if (canonicalController.editor && schemaDetail && schemaDetail.scrollTop > 0)
            canonicalController.scrollByKey.set(canonicalController.editor.key, schemaDetail.scrollTop);
    };
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
            lifecycle.listen(recheckSchemaValidationButton, "click", () => { validationController.recheck(); });
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
            lifecycle.listen(createSchemaRuleButton, "click", () => ruleController.beginNew());
            lifecycle.listen(saveSchemaRuleButton, "click", () => ruleController.save());
            lifecycle.listen(saveSchemaRuleButton, "pointerdown", () => ruleController.captureSnapshot());
            lifecycle.listen(schemaRuleEditor, "input", updateConfiguredRulePreview);
            lifecycle.listen(schemaRuleEditor, "click", (event) => { if (event.target?.id === "schema-rule-save")
                ruleController.captureSnapshot(); });
            lifecycle.listen(schemaRuleSearch, "input", () => ruleController.render());
            lifecycle.listen(updateSchemaRuleAttachments, "change", () => ruleController.updateAttachmentPreview());
            lifecycle.listen(confirmSchemaRuleRevisionButton, "click", () => ruleController.confirmRevision());
            lifecycle.listen(cancelSchemaRuleRevisionButton, "click", () => ruleController.cancelRevision());
            lifecycle.listen(confirmSchemaRuleUpgradeButton, "click", () => ruleController.confirmUpgrade());
            lifecycle.listen(cancelSchemaRuleUpgradeButton, "click", () => ruleController.cancelUpgrade());
            lifecycle.listen(confirmSchemaRuleSyncButton, "click", () => ruleController.confirmSync());
            lifecycle.listen(cancelSchemaRuleSyncButton, "click", () => ruleController.cancelSync());
            lifecycle.listen(confirmSchemaRuleDeleteButton, "click", () => ruleController.confirmDeletion());
            lifecycle.listen(cancelSchemaRuleDeleteButton, "click", () => ruleController.cancelDeletion());
            lifecycle.listen(exportSchemaRulesButton, "click", () => ruleController.exportRules());
            lifecycle.listen(schemaAssignmentTarget, "change", () => assignmentController.changeTarget());
            lifecycle.listen(createSchemaAssignmentButton, "click", () => assignmentController.openNew());
            lifecycle.listen(saveSchemaAssignmentButton, "click", () => assignmentController.save());
            lifecycle.listen(importSchemaButton, "click", () => library.openImportFile());
            lifecycle.listen(schemaLibraryImportFile, "change", () => { void library.readImportFile(); });
            lifecycle.listen(replaceSchemaLibraryButton, "click", () => library.replaceImport());
            lifecycle.listen(appendSchemaLibraryButton, "click", () => library.appendImport());
            lifecycle.listen(cancelSchemaImportButton, "click", () => library.cancelImport());
            lifecycle.listen(confirmSchemaDeleteButton, "click", () => library.confirmDeletion());
            lifecycle.listen(cancelSchemaDeleteButton, "click", () => library.cancelDeletion());
            lifecycle.listen(exportSchemaButton, "click", () => library.requestExport());
            unsubscribe = ports.subscribe((activeProjectId) => {
                library.reload();
                ruleController.reload();
                if (library.activeSchemaId) {
                    const activeStored = library.schemas.find(({ id }) => id === library.activeSchemaId);
                    if (activeStored)
                        library.draft = schemaEditorDraft(activeStored);
                }
                if (!schemaPanel?.hidden && activeProjectId && activeProjectId !== hydratedSchemaProjectId)
                    void hydrateProjectForSchemas(activeProjectId);
                renderSchemas();
                ruleController.render();
                if (canonicalController.editor)
                    renderCompactCanonicalEditor();
            });
            unsubscribeSchemaPersistence = ports.subscribeSchemaPersistence(settleSchemaPersistence);
            renderSchemas();
            ruleController.render();
            validationController.render();
        },
        dispose() {
            if (!lifecycle.dispose())
                return;
            editorRoute.dispose();
            propertyController.dispose();
            pendingSchemaRestoration = undefined;
            assignmentController.dispose();
            library.pendingImport = undefined;
            library.pendingDeletion = undefined;
            library.pendingStandardExport = undefined;
            library.exportTrigger = undefined;
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
            canonicalController.disposeState();
            sidePanelLayeredProfileEditor?.dispose();
            sidePanelLayeredProfileEditor = undefined;
            guidedValidationFlow.close();
            guidedController.dispose();
            validationController.dispose();
            guidedValidationRoot?.replaceChildren();
            const disposed = new Error("Schemas controller disposed before durable persistence settled");
            pendingLocalRulePromotionPersistence?.reject(disposed);
            pendingGuidedValidationPersistence?.reject(disposed);
            ruleController.dispose();
            localRulePromotionDialog.close();
            unsubscribe?.();
            unsubscribe = undefined;
            unsubscribeSchemaPersistence?.();
            unsubscribeSchemaPersistence = undefined;
            activeSchemaProjectHydration.reset();
            relationshipTreeController.dispose();
            propertyView.dispose();
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
            if (!ruleController.configuration)
                return false;
            ruleController.configuration = createRuleConfiguration(ruleType, ruleController.configuration.propertyType);
            renderSchemaPropertyRulePicker();
            return true;
        },
        openCanonicalPropertyActions: openCompactCanonicalPropertyActions,
        compactPropertyAction: (propertyId, action, value) => canonicalController.propertyAction(propertyId, action, value),
        configuredRule: configuredRuleInput,
        conditionPredicate: sampledConditionPredicate,
        createConfiguredRule: createConfiguredSchemaRule,
        requestRuleRevision: (id, changes) => ruleController.requestRevision(id, changes),
        requestRuleUpgrade: (id, schemaIds) => ruleController.requestUpgrade(id, schemaIds),
        requestRuleSync: (id) => ruleController.requestSync(id),
        confirmRuleSync: () => ruleController.confirmSync(),
        requestRuleDeletion: (id) => ruleController.requestDeletion(id),
        editReusableRule: (id) => ruleController.edit(id),
        openAttachedRule: openAttachedSchemaRuleEditor,
        attachReusableRule,
        updateAttachedRule,
        focusPropertyRule: focusSchemaPropertyRule,
        focusPropertyRow: focusSchemaPropertyRow,
        promotionRules: promotionReusableRules,
        renderWorkflow: renderSchemaWorkflowRows,
        editAssignment: (schemaId, assignment) => assignmentController.edit(schemaId, assignment),
        reviewLibraryImport: (serialized) => library.reviewImport(serialized),
        requestDeletion: (id) => library.requestDeletion(id),
        openExportChoices: (schemaId) => {
            if (!exportSchemaButton)
                return false;
            const schema = schemaId ? library.schemas.find(({ id }) => id === schemaId) : undefined;
            if (schemaId && !schema)
                return false;
            library.openExportChoices(exportSchemaButton, schema);
            return true;
        },
        requestLocalRulePromotion: openLocalRulePromotionReview,
        persistGuidedValidation: (result) => persistPublishedGuidedValidation(result).then(() => finishGuidedValidationSave(result)),
        openGuidedEvent: openGuidedValidationForEvent,
        openGuidedProperty: openGuidedValidationForProperty,
        openGuidedLiveProperty: async (event, path) => {
            guidedController.propertyReturn = { kind: "capture", eventId: event.id, propertyPath: path, generation: lifecycle.generation() };
            await openGuidedValidationForProperty(event, guidedController.selected(event), path, false);
            guidedController.propertyReturn = { kind: "capture", eventId: event.id, propertyPath: path, generation: lifecycle.generation() };
        },
        openLivePropertyDeclaration,
        livePropertyDeclaration: (event, path) => {
            const schema = guidedController.selected(event);
            if (!schema?.workingDraft)
                return {};
            const canonical = canonicalLivePropertyPath(path);
            return { destination: schema.name, alreadyDeclared: Boolean(schemaPropertyAt(schema.workingDraft.document, canonical)) };
        },
        liveValidationAvailable: (event) => {
            const manual = library.schemas.find(({ id }) => id === validationController.manualOverrides[event.id]);
            return Boolean(manual ?? validateEvent({ sourceId: event.sourceId, eventName: event.name, payload: event.payload, rawInput: event.rawInput }, library.schemas, event.pageUrl).schema);
        },
        validateLive: (event) => {
            const input = { sourceId: event.sourceId, eventName: event.name, payload: event.payload, rawInput: event.rawInput };
            const manual = library.schemas.find(({ id }) => id === validationController.manualOverrides[event.id]);
            return manual ? validateWithSchema(input, manual, library.schemas) : validateEvent(input, library.schemas, event.pageUrl);
        },
        liveSchemaChoices: () => assignableSchemas(library.schemas).map(({ id, name, version }) => ({ id, label: `${name} v${version}` })),
        openAllowedValueExpansionReview,
        closeGuided: guidedValidationFlow.close,
        guidedDraft: guidedValidationFlow.currentDraft,
        guidedState: () => ({ selections: structuredClone(guidedController.selections), selectedSchemaPropertyPath: propertyController.selectedPath,
            hasPropertyReturn: Boolean(guidedController.propertyReturn), dialogListenerCount: guidedController.dialogListenerCount() }),
        guidedContinuation: guidedDraftContinuationForEvent,
        recheckCaptured: (events = []) => validationController.recheck(events),
        recordCapturedValidation: (record) => { validationController.addRecord(record); validationController.render(); },
        refreshCurrentLiveAfterSchemaPublication,
        reviewCapturedValidationContinuation: (record, trigger) => validationController.reviewContinuation(record, trigger),
        setManualSchemaOverride: (eventId, schemaId) => validationController.setManualOverride(eventId, schemaId),
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
        dispatchCanonical: (command) => canonicalController.dispatchCommand(command),
        persistCanonicalProjection: (projection, change) => canonicalController.editor
            ? canonicalController.persistProjection(canonicalController.editor, projection, change) : Promise.resolve(false),
        resumeCanonicalProjection: () => canonicalController.editor ? canonicalController.resumeProjectionPersistence(canonicalController.editor) : Promise.resolve(false),
        retryCanonical: () => canonicalController.retryCommand(),
        rejectCanonical: () => canonicalController.rejectCommand(),
        canonicalProjection: () => canonicalController.editor ? compactCanonicalProjection(canonicalController.editor) : undefined,
        canonicalDocument: () => canonicalController.editor ? structuredClone(canonicalController.editor.load()) : undefined,
        canonicalFacet: (propertyId) => {
            const document = canonicalController.editor?.load(), node = document?.nodes[propertyId];
            return document && node ? compactCanonicalFacetText(document, node) : undefined;
        },
        canonicalCommandScope: (command) => canonicalController.editor
            ? canonicalController.commandScope(command, canonicalController.editor.load()) : undefined,
        canonicalQueueUnavailable: () => canonicalController.editor ? canonicalController.projectionQueueUnavailable(canonicalController.editor) : false,
        beginCanonicalHistory: (projectId, label, before, after) => {
            if (!canonicalController.editor)
                return undefined;
            const key = compactCanonicalHistoryKey(projectId, canonicalController.editor.key);
            const history = recordCompactCanonicalMutation(canonicalController.historyState.history, key, before, after);
            return canonicalController.beginPendingHistory(projectId, canonicalController.editor.key, label, history);
        },
        completeCanonicalHistory: (identity) => canonicalController.completePendingHistory(identity),
        rejectCanonicalHistory: (identity) => canonicalController.rejectPendingHistory(identity),
        pendingCanonicalHistory: (projectId, label) => canonicalController.pendingHistoryFor(projectId, label),
        canonicalState: () => ({ open: Boolean(canonicalController.editor), pending: Boolean(canonicalController.pendingCommand),
            settlementPending: canonicalController.settlementPending, reviewVisible: canonicalController.reviewVisible,
            feedback: canonicalController.commandFeedback, reopenSelection: canonicalController.reopenSelection,
            projectionPending: Boolean(canonicalController.projectionRequest), historyPending: Boolean(canonicalController.historyState.pending) }),
        renderCanonical: renderCompactCanonicalEditor,
        rulePickerState: () => ({ path: ruleController.pickerPath, renderSequence: propertyController.renderSequence,
            ...(ruleController.configuration ? { configuration: structuredClone(ruleController.configuration) } : {}) }),
        rules: () => structuredClone(ruleController.rules),
        ruleState: () => ({ editingReusableSchemaRuleId: ruleController.editingReusableId,
            approvedRuleRevisionId: ruleController.approvedRevisionId,
            approvedRuleAttachmentUpdateId: ruleController.approvedAttachmentUpdateId,
            pendingRuleSnapshotMetadata: ruleController.pendingSnapshot ? structuredClone(ruleController.pendingSnapshot) : undefined }),
        omittedRuleStatus: (count) => library.omittedStatus(count),
        storePromotionRules: storedPromotionRules,
        schemas: () => structuredClone(library.schemas),
        state: () => ({ ...(library.activeSchemaId ? { activeSchemaId: library.activeSchemaId } : {}), draftDirty: Boolean((library.activeSchemaId || library.draft) && active().workingDraft),
            ...(activeIndex() < 0 && library.draft ? { transientDraft: structuredClone(library.draft) } : {}), schemaCount: library.schemas.length, mounted: lifecycle.isMounted() }),
    };
    function restoreGuidedPropertyReturn() {
        guidedController.restorePropertyReturn();
    }
    function persistGuidedContinuation(event, schemaId) {
        guidedController.select(event, schemaId);
    }
    function openGuidedDraft(schema) {
        library.activeSchemaId = schema.id;
        library.draft = schemaEditorDraft(schema);
        ports.showSchemasView();
        renderSchemas();
    }
    function openGuidedContinuationPicker(event) {
        guidedController.openContinuationPicker(event);
    }
    function openLivePropertyDeclaration(event, path, trigger) {
        return guidedController.openLivePropertyDeclaration(event, path, trigger);
    }
    function openAllowedValueExpansionReview(eventId, assignedSchemaId, evaluation, trigger) {
        return guidedController.openAllowedValueExpansion(eventId, assignedSchemaId, evaluation, trigger);
    }
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
        return ruleController.rules.find(({ id }) => id === entry.rule.id)?.name ?? entry.rule.id;
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