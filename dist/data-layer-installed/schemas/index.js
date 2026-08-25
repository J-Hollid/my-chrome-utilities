import { SCHEMA_LIBRARY_STORAGE_KEY, discardSchemaWorkingDraft, duplicateSchemaRevision, filterAndSortSchemaPropertyRows, inspectSchemaRename, proposeSchemaWorkingDraftName, publishSchemaWorkingDraft, restoreSchemaRevisionDraft, schemaPropertyRows, restoreSchemaLibrary, searchSchemas, serializeSchemaLibrary, setSchemaDescription as updateSchemaDescription, updateSchemaWorkingDraft, validateEvent, } from "../../utilities/data-layer/schemas.js";
export function createSchemasInstalledController(ports) {
    const schemaSearch = ports.root.querySelector("#schema-search");
    const schemaCategoryFilter = ports.root.querySelector("#schema-category-filter");
    const schemaCount = ports.root.querySelector("#schema-count");
    const schemaList = ports.root.querySelector("#schema-list");
    const schemaResult = ports.root.querySelector("#schema-result");
    const schemaEditor = ports.root.querySelector("#schema-editor");
    const schemaDetail = ports.root.querySelector("#schema-detail");
    const sidePanelLayeredProfileEditorHost = ports.root.querySelector("#side-panel-layered-profile-editor");
    const liveEventQuery = ports.root.querySelector("#live-event-query");
    const schemaSubviews = Array.from(ports.root.querySelectorAll("#schema-subviews [role=tab]"));
    const schemaPanels = Array.from(ports.root.querySelectorAll("#schema-master, #schema-rule-library, #schema-assignments"));
    if (sidePanelLayeredProfileEditorHost && schemaDetail && !schemaDetail.contains(sidePanelLayeredProfileEditorHost)) {
        schemaDetail.prepend(sidePanelLayeredProfileEditorHost);
    }
    const schemaDetailEmpty = ports.root.querySelector("#schema-detail-empty");
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
    let mounted = false;
    let unsubscribe;
    const storedSchemaLibrary = ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
    let schemas = restoreSchemaLibrary(storedSchemaLibrary);
    let activeSchemaId;
    let schemaDraft;
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
        const pendingChanges = draft?.pendingChanges ?? [];
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
    const renderSchemas = () => {
        if (!mounted)
            return;
        const visible = searchSchemas(schemas, schemaSearch?.value ?? "")
            .filter((schema) => !schemaCategoryFilter?.value || schemaCategoryFilter.value === "All"
            || String(schema.document.type ?? "").toLowerCase() === schemaCategoryFilter.value.toLowerCase());
        if (schemaCount)
            schemaCount.textContent = `${visible.length} schemas`;
        if (schemaList) {
            const document = schemaList.ownerDocument;
            schemaList.replaceChildren(...visible.map((schema) => {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = `${schema.name} v${schema.version}`;
                button.addEventListener("click", () => { activeSchemaId = schema.id; schemaDraft = structuredClone(schema); renderSchemas(); });
                return button;
            }));
        }
        if (schemaResult)
            schemaResult.textContent = activeSchemaId ? `Selected ${activeSchemaId}` : "";
        renderSchemaDraft();
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
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            schemaSearch?.addEventListener("input", renderSchemas);
            schemaCategoryFilter?.addEventListener("change", renderSchemas);
            schemaEditorName?.addEventListener("input", persistSchemaEditorDraft);
            saveSchemaDescriptionButton?.addEventListener("click", saveSchemaDescription);
            schemaEditorTarget?.addEventListener("change", updateSchemaTarget);
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
            unsubscribe = ports.subscribe(renderSchemas);
            renderSchemas();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            schemaSearch?.removeEventListener("input", renderSchemas);
            schemaCategoryFilter?.removeEventListener("change", renderSchemas);
            schemaEditorName?.removeEventListener("input", persistSchemaEditorDraft);
            saveSchemaDescriptionButton?.removeEventListener("click", saveSchemaDescription);
            schemaEditorTarget?.removeEventListener("change", updateSchemaTarget);
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
            unsubscribe?.();
            unsubscribe = undefined;
            schemaList?.replaceChildren();
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
        schemas: () => structuredClone(schemas),
        state: () => ({ ...(activeSchemaId ? { activeSchemaId } : {}), draftDirty: Boolean(activeSchemaId && active().workingDraft),
            schemaCount: schemas.length, mounted }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "schemas",
    capabilities: ["schema and rule libraries", "drafts", "assignments", "validation", "guided validation"],
});
//# sourceMappingURL=index.js.map