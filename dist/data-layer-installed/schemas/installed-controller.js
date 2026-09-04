import { SCHEMA_LIBRARY_STORAGE_KEY, duplicateSchemaRevision, proposeSchemaWorkingDraftName, schemaRevisionChoices, createRuleConfigurationFromAttachedRule, serializeSchemaLibrary, setPropertyDocumentation, updateSchemaWorkingDraft, createGuidedValidationFlow, applyCanonicalCommand, canonicalPropertyPath, savedSchemaCanonicalDocument, } from "../../utilities/data-layer/schemas.js";
import { createSchemaLifecycle } from "./lifecycle.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import { SchemaLibraryController } from "./library-controller.js";
import { SchemaLibraryEditor } from "./library-editor.js";
import { installSchemaPropertyElements, SchemaPropertyController } from "./property-controller.js";
import { SchemaPropertyView } from "./property-view.js";
import { SchemaPersistenceController } from "./persistence-controller.js";
import { bindSchemaAssignmentElements, installSchemaAssignmentElements, SchemaAssignmentController } from "./assignment-controller.js";
import { bindSchemaLibraryElements, installSchemaLibraryElements } from "./library-installed-view.js";
import { SchemaValidationController } from "./validation-controller.js";
import { SchemaGuidedValidationController } from "./guided-validation-controller.js";
import { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import { SchemaCanonicalInstalledView } from "./canonical-installed-view.js";
import { persistLocalRulePromotion } from "../../data-layer-local-rule-promotion.js";
import { createProjectHydrationSlot } from "./project-hydration.js";
import { createSchemaEditorRouteController } from "./editor-route-controller.js";
import { installSchemaEditorElements } from "./editor-installed-view.js";
import { createCanonicalPublicOperations } from "./canonical-public-operations.js";
import { createSchemaLibraryPublicOperations } from "./library-public-operations.js";
import { createSchemaAuthoringPublicOperations } from "./authoring-public-operations.js";
import { createGuidedPublicOperations } from "./guided-public-operations.js";
import { bindSchemaRuleElements, installSchemaRuleElements, SCHEMA_RULE_STORAGE_KEY, SchemaRuleController } from "./rule-controller.js";
import { SchemaRulePickerView } from "./rule-picker-view.js";
import { schemaEditorDraft, schemaPropertyAt, schemaPropertyType, storedPromotionRules, withSchemaParent } from "./schema-model.js";
import { SchemaSourceController } from "./source-controller.js";
export function createSchemasInstalledController(ports) {
    const editorElements = installSchemaEditorElements(ports.root);
    const { schemaSearch, schemaCategoryFilter, schemaEmptyState, schemaCount, schemaList, schemaResult, createSchemaButton, recheckSchemaValidationButton, schemaValidationIssues, schemaValidationRecordList, guidedValidationRoot, schemaEditor, schemaEditorStatus, schemaDetail, schemaTreeScrollOwner, schemaPanel, sidePanelLayeredProfileEditorHost, liveEventQuery, schemaSubviews, schemaPanels, schemaDetailEmpty, schemaInheritanceProvenance, schemaRuleOverrides, schemaRuleOverrideList, schemaEditorParent, schemaOnlyDeclaredProperties, schemaEditorName, schemaEditorDescription, saveSchemaDescriptionButton, schemaDescriptionOrigin, schemaEditorTarget, saveSchemaButton, saveSchemaReason, schemaRevisionReview, schemaRevisionReviewSummary, confirmSchemaRevisionButton, cancelSchemaRevisionButton, schemaCloseReview, schemaCloseReviewSummary, discardSchemaDraftButton, keepEditingSchemaButton, closeSchemaEditorButton, saveAndCloseSchemaButton, saveSchemaCloseReviewButton, discardWorkingSchemaDraftButton, schemaRevisionSelector, schemaRevisionComparison, duplicateSchemaRevisionButton, restoreSchemaRevisionButton, schemaOwnerDocument, schemaEditorNameAssistance, schemaInheritedRuleGroups, schemaEffectiveRulePreview, schemaSpecificationBuilder, buildSpecificationButton, buildHistoricalSpecificationButton, compactCanonicalContext } = editorElements;
    const editorRoute = createSchemaEditorRouteController({
        panel: schemaPanel, scrollOwner: schemaTreeScrollOwner, scheduleFrame: ports.scheduleFrame,
    });
    const { addSchemaPropertyButton, schemaPropertyViewControls, schemaPropertyFilter, schemaPropertySort, schemaPropertyResultStatus, schemaPropertyEmpty, schemaPropertyEmptyMessage, clearSchemaPropertyFilter, schemaPropertyTree, schemaPropertyRemovalFeedback, undoSchemaPropertyRemovalButton, schemaPropertyCopyFeedback, undoSchemaPropertyCopyButton, schemaPropertyRemovalDialog, confirmSchemaPropertyRemovalButton, cancelSchemaPropertyRemovalButton, schemaDocumentationRemovalDialog, confirmSchemaDocumentationRemoval, cancelSchemaDocumentationRemoval, schemaSpecificIndexDialog, schemaSpecificIndexForm, schemaSpecificIndex, confirmSchemaSpecificIndex, cancelSchemaSpecificIndex, schemaManualPropertyDialog, schemaManualPropertyForm, schemaManualPropertyPath, schemaManualPropertyChildName, schemaManualPropertyType, schemaManualArrayItemType, goToExistingSchemaPropertyButton, confirmSchemaManualPropertyButton, cancelSchemaManualPropertyButton, schemaPropertyRulePicker } = installSchemaPropertyElements(ports.root);
    const createSchemaAssignmentButton = ports.root.querySelector("#create-schema-assignment");
    const installedRuleElements = installSchemaRuleElements(ports.root);
    const { elements: ruleElements } = installedRuleElements;
    const { editor: schemaRuleEditor, name: schemaRuleName, parameters: schemaRuleParameters, types: schemaRuleTypes, operator: schemaRuleOperator, severity: schemaRuleSeverity, message: schemaRuleMessage, examples: schemaRuleExamples, list: schemaRuleList, search: schemaRuleSearch, attachments: schemaRuleAttachments, updateAttachments: updateSchemaRuleAttachments, revisionReview: schemaRuleRevisionReview, revisionSummary: schemaRuleRevisionReviewSummary, confirmRevision: confirmSchemaRuleRevisionButton, upgradeReview: schemaRuleUpgradeReview, upgradeSummary: schemaRuleUpgradeReviewSummary, confirmUpgrade: confirmSchemaRuleUpgradeButton, cancelUpgrade: cancelSchemaRuleUpgradeButton, syncReview: schemaRuleSyncReview, syncSummary: schemaRuleSyncReviewSummary, confirmSync: confirmSchemaRuleSyncButton, cancelSync: cancelSchemaRuleSyncButton, deleteReview: schemaRuleDeleteReview, deleteSummary: schemaRuleDeleteReviewSummary, confirmDelete: confirmSchemaRuleDeleteButton } = ruleElements;
    const assignmentElements = installSchemaAssignmentElements(ports.root);
    const { editor: schemaAssignmentEditor, source: schemaAssignmentSource, event: schemaAssignmentEvent, priority: schemaAssignmentPriority, save: saveSchemaAssignmentButton, target: schemaAssignmentTarget, domain: schemaAssignmentDomain, pathname: schemaAssignmentPathname, versionPolicy: schemaAssignmentVersionPolicy, enabled: schemaAssignmentEnabled, list: schemaAssignmentList, conflicts: schemaAssignmentConflicts, schema: schemaAssignmentSchema, conditions: schemaAssignmentDataConditions } = assignmentElements;
    const libraryElements = installSchemaLibraryElements(ports.root);
    const { importButton: importSchemaButton, importFile: schemaLibraryImportFile, importReview: schemaImportReview, importReviewSummary: schemaImportReviewSummary, replaceLibrary: replaceSchemaLibraryButton, appendLibrary: appendSchemaLibraryButton, cancelImport: cancelSchemaImportButton, deleteReview: schemaDeleteReview, deleteReviewSummary: schemaDeleteReviewSummary, confirmDelete: confirmSchemaDeleteButton, cancelDelete: cancelSchemaDeleteButton, exportButton: exportSchemaButton, exportChoices: schemaExportChoices, exportReview: schemaExportReview } = libraryElements;
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
        elements: { ...assignmentElements, result: schemaResult },
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
        selectSchema: (schemaId, propertyPath) => {
            propertyController.selectedPath = propertyPath;
            library.activeSchemaId = schemaId;
            const schema = library.schemas.find(({ id }) => id === schemaId);
            if (schema)
                library.draft = schemaEditorDraft(schema);
            renderSchemas();
        },
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
        writeLibrary: (schemas) => { ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, library.serialize(schemas)); ports.changed(schemas); },
        ...(ports.settleCanonical ? { settleLibrary: ports.settleCanonical } : {}), mounted: () => lifecycle.isMounted(),
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
    const queueSchemaLibraryPersistence = (schemaId) => canonicalController.queueLibraryPersistence(schemaId, library.schemas, persistSchemaLibrary);
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
            adoptSaved: (schema, trigger) => ports.adoptSavedSchema(structuredClone(schema), trigger),
            buildSpecification: (schema, trigger) => openSchemaSpecification(schema, `published:${schema.version}`, trigger),
            exportSaved: (schema, trigger) => library.openExportChoices(trigger, schema),
            reportMissing: (schema) => ports.reportMissingSchemaEvent(schema.id),
            deleteSaved: (schema) => { library.requestDeletion(schema.id); },
            openContributor: (key, trigger, referenceKey) => {
                editorRoute.open(trigger, referenceKey);
                const retainedScroll = canonicalController.editor?.key === key ? schemaDetail?.scrollTop : undefined;
                ports.openContributor(key);
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
            guidedController.select(event, selected.id);
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
            guidedController.select(event, schema.id);
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
            publish: () => { openGuidedDraft(schema); openSchemaRevisionReview(); }, useDifferent: () => guidedController.openContinuationPicker(event) } : undefined;
    };
    const finishGuidedValidationSave = (result) => {
        guidedController.select({ sourceId: result.assignment.sourceId, name: result.assignment.eventName }, result.schema.id);
        ports.guidedSaved?.(result.destination.kind === "new" ? `Draft ${result.schema.name} was created.` : `Validation was added to ${result.schema.name} draft.`);
        if (guidedController.propertyReturn?.generation === lifecycle.generation() && guidedController.propertyReturn.kind === "capture") {
            const snapshot = guidedController.propertyReturn;
            guidedController.propertyReturn = undefined;
            ports.restoreGuidedCapture(snapshot.eventId, snapshot.propertyPath);
        }
        else if (guidedController.propertyReturn?.generation === lifecycle.generation() && guidedController.propertyReturn.kind === "schema" && guidedController.propertyReturn.schemaId === result.schema.id) {
            guidedController.restorePropertyReturn();
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
            guidedController.restorePropertyReturn();
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
            bindSchemaRuleElements(lifecycle, installedRuleElements, ruleController, updateConfiguredRulePreview);
            bindSchemaAssignmentElements(lifecycle, assignmentElements, createSchemaAssignmentButton, assignmentController);
            bindSchemaLibraryElements(lifecycle, libraryElements, library);
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
        ...createSchemaLibraryPublicOperations({ library, active, activeIndex, persist: persistSchemaLibrary,
            render: renderSchemas, publish: publishActiveSchema, exportButton: exportSchemaButton, mounted: () => lifecycle.isMounted() }),
        ...createSchemaAuthoringPublicOperations({ property: propertyController, rule: ruleController,
            canonical: canonicalController, renderRulePicker: renderSchemaPropertyRulePicker }, {
            openSchemaFromSource: (source) => sourceController.open(source), requestPropertyRemoval: requestSchemaPropertyRemoval,
            requestDocumentationRemoval: requestSchemaDocumentationRemoval, requestPropertyCopy: openSchemaPropertyCopyReview,
            confirmPropertyCopy: confirmSchemaPropertyCopy, openSpecificIndex: openSpecificIndexDialog,
            openManualProperty: openManualPropertyForm, openContextualManualProperty: openContextualManualPropertyForm,
            capturePropertyReturn: captureSchemaPropertyInteractionReturn, restorePropertyReturn: restoreSchemaPropertyInteractionReturn,
            closeRulePickerForCommit: closeSchemaPropertyRulePickerForCommit, openRulePicker: openSchemaPropertyRulePicker,
            openCanonicalRuleEditor: openCompactCanonicalRuleEditor,
            openCanonicalPropertyActions: openCompactCanonicalPropertyActions, configuredRule: configuredRuleInput,
            conditionPredicate: sampledConditionPredicate, createConfiguredRule: createConfiguredSchemaRule,
            openAttachedRule: openAttachedSchemaRuleEditor, attachReusableRule, updateAttachedRule,
            focusPropertyRule: focusSchemaPropertyRule, focusPropertyRow: focusSchemaPropertyRow,
            promotionRules: promotionReusableRules, renderWorkflow: renderSchemaWorkflowRows,
            editAssignment: (schemaId, assignment) => assignmentController.edit(schemaId, assignment),
            requestLocalRulePromotion: openLocalRulePromotionReview
        }),
        ...createGuidedPublicOperations({ guided: guidedController, validation: validationController,
            property: propertyController, schemas: () => library.schemas, active, activeSchemaId: () => library.activeSchemaId,
            root: guidedValidationRoot, generation: () => lifecycle.generation(), flow: guidedValidationFlow,
            candidate: guidedUiCandidate, openProperty: openGuidedValidationForProperty }, {
            persistGuidedValidation: (result) => persistPublishedGuidedValidation(result).then(() => finishGuidedValidationSave(result)),
            openGuidedEvent: openGuidedValidationForEvent, openGuidedProperty: openGuidedValidationForProperty,
            openLivePropertyDeclaration: (event, path, trigger) => guidedController.openLivePropertyDeclaration(event, path, trigger),
            openAllowedValueExpansionReview: (eventId, schemaId, evaluation, trigger) => guidedController.openAllowedValueExpansion(eventId, schemaId, evaluation, trigger),
            guidedContinuation: guidedDraftContinuationForEvent, refreshCurrentLiveAfterSchemaPublication,
            hydrateActiveProjectForSchemas
        }),
        show() { renderSchemas(); relationshipTreeController.restoreScroll(); },
        ...createCanonicalPublicOperations({ controller: canonicalController,
            schema: (id) => library.schemas.find((schema) => schema.id === id), openSaved: openSavedSchemaInUnifiedEditor,
            open: openCompactCanonicalEditor, close: closeCompactCanonicalEditor,
            show: () => { renderSchemas(); relationshipTreeController.restoreScroll(); },
            projection: compactCanonicalProjection, facet: compactCanonicalFacetText, render: renderCompactCanonicalEditor }),
    };
    function openGuidedDraft(schema) {
        library.activeSchemaId = schema.id;
        library.draft = schemaEditorDraft(schema);
        ports.showSchemasView();
        renderSchemas();
        schemaEditorName?.focus({ preventScroll: true });
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
}
export const installedControllerDefinition = Object.freeze({ id: "schemas",
    capabilities: ["schema and rule libraries", "drafts", "assignments", "validation", "guided validation"],
});
//# sourceMappingURL=installed-controller.js.map