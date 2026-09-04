import { SCHEMA_LIBRARY_STORAGE_KEY, discardSchemaWorkingDraft, duplicateSchemaRevision, proposeSchemaWorkingDraftName, schemaRevisionChoices, assignableSchemas, createRuleConfiguration, createRuleConfigurationFromAttachedRule, serializeSchemaLibrary, setPropertyDocumentation, updateSchemaWorkingDraft, validateEvent, validateWithSchema, createGuidedValidationFlow, applyCanonicalCommand, canonicalPropertyPath, canonicalLivePropertyPath, savedSchemaCanonicalDocument, compactCanonicalHistoryKey, recordCompactCanonicalMutation, } from "../../utilities/data-layer/schemas.js";
import { createSchemaLifecycle } from "./lifecycle.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import { SchemaLibraryController } from "./library-controller.js";
import { SchemaLibraryEditor } from "./library-editor.js";
import { installSchemaPropertyElements, SchemaPropertyController } from "./property-controller.js";
import { SchemaPropertyView } from "./property-view.js";
import { SchemaPersistenceController } from "./persistence-controller.js";
import { SchemaAssignmentController } from "./assignment-controller.js";
import { SchemaValidationController } from "./validation-controller.js";
import { SchemaGuidedValidationController } from "./guided-validation-controller.js";
import { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import { SchemaCanonicalInstalledView } from "./canonical-installed-view.js";
import { persistLocalRulePromotion, } from "../../data-layer-local-rule-promotion.js";
import { createProjectHydrationSlot } from "./project-hydration.js";
import { createSchemaEditorRouteController } from "./editor-route-controller.js";
import { installSchemaRuleElements, SCHEMA_RULE_STORAGE_KEY, SchemaRuleController } from "./rule-controller.js";
import { SchemaRulePickerView } from "./rule-picker-view.js";
import { defineSchemaProperty, schemaDocumentPaths, schemaEditorDraft, schemaPropertyAt, schemaPropertyType, storedPromotionRules, withSchemaParent } from "./schema-model.js";
import { SchemaSourceController } from "./source-controller.js";
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
    const { createRule: createSchemaRuleButton, save: saveSchemaRuleButton, exportRules: exportSchemaRulesButton, cancelRevision: cancelSchemaRuleRevisionButton, cancelDelete: cancelSchemaRuleDeleteButton, elements: ruleElements } = installSchemaRuleElements(ports.root);
    const { editor: schemaRuleEditor, name: schemaRuleName, parameters: schemaRuleParameters, types: schemaRuleTypes, operator: schemaRuleOperator, severity: schemaRuleSeverity, message: schemaRuleMessage, examples: schemaRuleExamples, list: schemaRuleList, search: schemaRuleSearch, attachments: schemaRuleAttachments, updateAttachments: updateSchemaRuleAttachments, revisionReview: schemaRuleRevisionReview, revisionSummary: schemaRuleRevisionReviewSummary, confirmRevision: confirmSchemaRuleRevisionButton, upgradeReview: schemaRuleUpgradeReview, upgradeSummary: schemaRuleUpgradeReviewSummary, confirmUpgrade: confirmSchemaRuleUpgradeButton, cancelUpgrade: cancelSchemaRuleUpgradeButton, syncReview: schemaRuleSyncReview, syncSummary: schemaRuleSyncReviewSummary, confirmSync: confirmSchemaRuleSyncButton, cancelSync: cancelSchemaRuleSyncButton, deleteReview: schemaRuleDeleteReview, deleteSummary: schemaRuleDeleteReviewSummary, confirmDelete: confirmSchemaRuleDeleteButton } = ruleElements;
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
    const localRulePromotionDialog = ports.localRulePromotionDialog;
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
    const sourceController = new SchemaSourceController({
        setDraft: (schema) => { library.activeSchemaId = undefined; library.draft = schema; },
        setSelectedPath: (path) => { propertyController.selectedPath = path; }, showSchemas: ports.showSchemasView,
        render: () => renderSchemas(), result: (message) => { if (schemaResult)
            schemaResult.textContent = message; },
        focusName: () => { schemaEditorName?.focus({ preventScroll: true }); },
    });
    let pendingSchemaRestoration;
    const validationController = new SchemaValidationController(ports.storage, {
        list: schemaValidationRecordList, issues: schemaValidationIssues, result: schemaResult,
        guidedRoot: guidedValidationRoot, document: schemaOwnerDocument,
        ...(ports.prepareCapturedValidationContinuation ? { prepare: ports.prepareCapturedValidationContinuation } : {}),
        schemas: () => library.schemas, generation: () => lifecycle.generation(), isCurrent: (generation) => lifecycle.isCurrent(generation),
    });
    let commitPromotionTransaction = () => Promise.reject(new Error("Schema persistence is not ready"));
    const ruleController = new SchemaRuleController(ports.storage, {
        elements: ruleElements,
        schemas: () => library.schemas, replaceSchemas: (schemas) => { library.schemas = schemas; },
        persistRules: () => ruleController.persist(), persistLibrary: () => persistSchemaLibrary(),
        renderAll: () => renderSchemas(), renderDraft: () => renderSchemaDraft(), createId: ports.createRuleId, download: ports.downloadSchema,
        createRuleId: ports.createRuleId, capturedValue: ports.capturedAssignmentValue,
        editableSchema: () => library.draft ?? schemaEditorDraft(active()),
        propertyType: (document, path) => schemaPropertyType(document, path),
        draft: () => library.draft, replaceDraft: (schema) => { library.draft = schema; }, presentDraft: (schema) => schemaEditorDraft(schema),
        activeSchemaId: () => library.activeSchemaId, promotionDialog: localRulePromotionDialog, detail: schemaDetail, root: ports.root,
        scheduleFrame: ports.scheduleFrame, result: (message) => { if (schemaResult)
            schemaResult.textContent = message; },
        commitPromotion: (schemaId, previousSchemas, previousRules, nextSchemas, nextRules) => commitPromotionTransaction(schemaId, previousSchemas, previousRules, nextSchemas, nextRules),
        ...(ports.settleCanonical ? { settleCanonical: ports.settleCanonical } : {}),
    });
    const rulePickerView = new SchemaRulePickerView(ruleController, {
        picker: schemaPropertyRulePicker, active: () => active(), draft: () => library.draft, capturedValue: () => ports.capturedAssignmentValue("payload"),
        propertyType: (document, path) => schemaPropertyType(document, path), incrementRender: () => { propertyController.renderSequence += 1; },
        close: () => closeSchemaPropertyRulePicker(), closeForCommit: () => closeSchemaPropertyRulePickerForCommit(), createConfigured: () => createConfiguredSchemaRule(),
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
    let applyGuidedPersistence = () => { };
    let beginGuidedPersistence = () => Promise.reject(new Error("Schema persistence is not ready"));
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
        rules: () => ruleController.rules, replaceRules: (rules) => { ruleController.rules = structuredClone([...rules]); },
        applyPersistence: (schemas, rules) => applyGuidedPersistence(schemas, rules),
        beginPersistence: (schemaId, previousSchemas, previousRules, nextSchemas, nextRules) => beginGuidedPersistence(schemaId, previousSchemas, previousRules, nextSchemas, nextRules),
    });
    const canonicalController = new SchemaCanonicalEditorController({
        blocked: () => Boolean(ports.blocked?.()), generation: () => lifecycle.generation(),
        isCurrent: (generation) => lifecycle.isCurrent(generation),
        setBusy: (busy) => { schemaEditor?.setAttribute("aria-busy", String(busy)); if (busy && saveSchemaButton)
            saveSchemaButton.disabled = true; },
        renderContext: () => renderCompactCanonicalContext(), renderEditor: () => renderCompactCanonicalEditor(),
        createId: ports.createRuleId,
    });
    function proposeInstalledSchemaWorkingDraftName(schema, proposed) {
        const updated = proposeSchemaWorkingDraftName(schema, proposed), draft = updated.workingDraft;
        return !draft?.canonicalSchema || !proposed ? updated
            : { ...updated, workingDraft: { ...draft, canonicalSchema: { ...draft.canonicalSchema, contributorName: proposed } } };
    }
    const canonicalView = new SchemaCanonicalInstalledView({ controller: canonicalController,
        elements: { context: compactCanonicalContext, editor: schemaEditor, detail: schemaDetail, detailEmpty: schemaDetailEmpty, save: saveSchemaButton, list: schemaList, document: schemaOwnerDocument },
        activeSchemaId: () => library.activeSchemaId, setActiveSchemaId: (id) => { library.activeSchemaId = id; }, draft: () => library.draft, setDraft: (schema) => { library.draft = schema; },
        schemas: () => library.schemas, replaceSchemas: (schemas) => { library.schemas = structuredClone([...schemas]); }, editorDraft: schemaEditorDraft, propertyAt: schemaPropertyAt,
        selectedPath: () => propertyController.selectedPath, setSelectedPath: (path) => { propertyController.selectedPath = path; }, renderDraft: () => renderSchemaDraft(), renderAll: () => renderSchemas(),
        persistLibrary: () => persistSchemaLibrary(), proposeName: proposeInstalledSchemaWorkingDraftName, createId: (kind) => `schema:${kind}:${++canonicalController.idSequence}`,
        conceptSuggestions: ports.canonicalConceptSuggestions, ...(ports.createCanonicalTableEditor ? { createTableEditor: ports.createCanonicalTableEditor } : {}), ...(ports.settleCanonical ? { settle: ports.settleCanonical } : {}),
        closeRoute: (resolve) => editorRoute.close(resolve), generation: () => lifecycle.generation(), isCurrent: (generation) => lifecycle.isCurrent(generation),
        rulePicker: schemaPropertyRulePicker, setRulePicker: (path, trigger) => { ruleController.pickerPath = path; ruleController.pickerTrigger = trigger; ruleController.configuration = undefined; ruleController.editingAttached = undefined; },
        closeRulePicker: () => closeSchemaPropertyRulePicker(),
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
        renderAll: () => renderSchemas(), renderProperty: () => renderSchemaPropertyView(),
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
    const persistenceController = new SchemaPersistenceController({ root: ports.root, storage: ports.storage, library, rules: ruleController,
        property: propertyController, canonical: canonicalController, scheduleFrame: ports.scheduleFrame, renderAll: () => renderSchemas(),
        renderRules: () => ruleController.render(), renderCanonical: () => renderCompactCanonicalEditor(),
        clearCanonicalSettlement: (schemaId, settlement) => { clearCompactCanonicalSettlement(schemaId, settlement); }, editorDraft: (schema) => schemaEditorDraft(schema) });
    commitPromotionTransaction = (schemaId, previousSchemas, previousRules, nextSchemas, nextRules) => {
        const completion = persistenceController.begin("promotion", schemaId, previousSchemas, previousRules, nextSchemas, nextRules);
        persistLocalRulePromotion(ports.storage, { schemaKey: SCHEMA_LIBRARY_STORAGE_KEY, schemaValue: serializeSchemaLibrary(nextSchemas), ruleKey: SCHEMA_RULE_STORAGE_KEY, ruleValue: JSON.stringify(nextRules) });
        library.schemas = structuredClone([...nextSchemas]);
        ruleController.rules = structuredClone([...nextRules]);
        renderSchemas();
        ruleController.render();
        return completion;
    };
    applyGuidedPersistence = (schemas, rules) => persistenceController.apply(schemas, rules);
    beginGuidedPersistence = (schemaId, previousSchemas, previousRules, nextSchemas, nextRules) => persistenceController.begin("guided", schemaId, previousSchemas, previousRules, nextSchemas, nextRules);
    const compactCanonicalProjection = (adapter, canonical = adapter.load()) => canonicalView.projection(adapter, canonical);
    const compactCanonicalFacetText = (canonical, node) => canonicalView.facet(canonical, node);
    const beginCompactCanonicalSettlement = (schemaId) => { const settlement = canonicalController.beginSettlement(schemaId); schemaEditor?.setAttribute("aria-busy", "true"); if (saveSchemaButton)
        saveSchemaButton.disabled = true; return settlement; };
    const clearCompactCanonicalSettlement = (schemaId, settlement) => canonicalController.clearSettlement(schemaId, settlement);
    const renderCompactCanonicalContext = () => canonicalView.renderContext();
    const renderCompactCanonicalEditor = () => canonicalView.render();
    const openCompactCanonicalEditor = (adapter) => canonicalView.open(adapter);
    const closeCompactCanonicalEditor = (clearSchemaSelection = true) => canonicalView.close(clearSchemaSelection);
    const openSavedSchemaInUnifiedEditor = (schema) => canonicalView.openSaved(schema);
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
    const normalizedRulePickerPath = (path) => ruleController.normalizePickerPath(path);
    const currentConditionPayload = (target = "payload") => ports.capturedAssignmentValue(target);
    const valueAtSchemaPath = (value, path) => ruleController.valueAtPath(value, path);
    const initialConditionPredicate = (path) => ruleController.conditionPredicate(path);
    const sampledConditionPredicate = (path) => ruleController.conditionPredicate(path, true);
    const configuredRuleInput = () => ruleController.configuredRule();
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
    const openCompactCanonicalRuleEditor = (path, trigger) => canonicalView.openRule(path, trigger);
    const openCompactCanonicalPropertyActions = (path, trigger) => canonicalView.openPropertyActions(path, trigger);
    const updateConfiguredRulePreview = () => { if (ruleController.pickerPath)
        renderSchemaLocalRuleConfiguration(); };
    const renderSchemaPropertyRulePicker = () => rulePickerView.render();
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
    const applyPersistenceSnapshot = (schemas, rules) => persistenceController.apply(schemas, rules);
    const beginSchemaPersistence = (kind, schemaId, previousSchemas, previousRules, nextSchemas, nextRules) => persistenceController.begin(kind, schemaId, previousSchemas, previousRules, nextSchemas, nextRules);
    const settleSchemaPersistence = (event) => persistenceController.settle(event);
    const openLocalRulePromotionReview = (propertyPath, sourceRuleId) => ruleController.openPromotion(propertyPath, sourceRuleId);
    const persistPublishedGuidedValidation = (result) => guidedController.persistPublished(result);
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
    function openNewSchemaEditor() { editorRoute.open(createSchemaButton ?? undefined); sourceController.createEmpty(); }
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
    const storedReusableRule = (id) => ruleController.stored(id);
    const persistSchemaAndRuleLibraries = () => { persistSchemaLibrary(); persistReusableSchemaRules(); };
    const schemaRuleTypeForAttachment = (schema, propertyPath) => ruleController.typeForAttachment(schema, propertyPath);
    const attachReusableRule = (schemaId, ruleId, propertyPath, suppliedRule) => ruleController.attach(schemaId, ruleId, propertyPath, suppliedRule);
    const updateAttachedRule = (schemaId, ruleId, enabled) => ruleController.updateAttached(schemaId, ruleId, enabled);
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
            persistenceController.dispose(disposed);
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
        openSchemaFromSource: (source) => sourceController.open(source),
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
}
export const installedControllerDefinition = Object.freeze({
    id: "schemas",
    capabilities: ["schema and rule libraries", "drafts", "assignments", "validation", "guided validation"],
});
//# sourceMappingURL=installed-controller.js.map