import { addManualProperty, contextualManualPropertyDefinition, inspectManualProperty, inspectSchemaPropertyRemoval, inspectSpecificIndexRuleTarget, manualPropertyPreview, removeSchemaProperty, schemaPropertyCopySource, schemaRevisionChoices, undoSchemaPropertyCopy, undoSchemaPropertyRemoval, updateSchemaWorkingDraft, } from "../../utilities/data-layer/schemas.js";
import { applySchemaPropertyCopy } from "../../data-layer-schema-property-copy.js";
import { renderSchemaPropertyCopyReview } from "../../data-layer-schema-property-copy-ui.js";
/** Owns the transient state for installed Schema property authoring. */
export class SchemaPropertyController {
    selectedPath = "example";
    expandedRulePaths = new Set();
    pendingRemoval;
    lastRemoval;
    lastCopy;
    pendingCopy;
    pendingCopyReview;
    pendingCopyPosition;
    pendingDocumentationRemoval;
    specificIndexArrayPath;
    specificIndexTrigger;
    pendingManualContext;
    pendingManualCanonicalBase;
    interactionReturn;
    renderSequence = 0;
    #ports;
    #copyDialog = null;
    configure(ports) { this.#ports = ports; this.#copyDialog = ports.root.querySelector("#schema-property-copy-dialog"); }
    requestRemoval(path, trigger) {
        const ports = this.#required(), draft = ports.active().workingDraft;
        if (!draft)
            return;
        const inspection = inspectSchemaPropertyRemoval(draft.document, draft.attachedRules ?? [], path, draft.documentation);
        if (!inspection.requiresConfirmation) {
            this.applyRemoval(path);
            return;
        }
        this.pendingRemoval = { path, ...(trigger ? { trigger } : {}) };
        const summary = ports.root.querySelector("#schema-property-removal-summary");
        if (summary) {
            const rules = inspection.affectedRuleAttachments.map((rule) => `${rule.name ?? rule.id} at ${rule.propertyPath ?? inspection.propertyPath}`).join(", ") || "none";
            summary.textContent = `${inspection.propertyPath} contains ${inspection.descendants.length} descendants: ${inspection.descendants.join(", ") || "none"}. ${inspection.affectedRuleAttachments.length} affected rule attachments: ${rules}. Documentation entries: ${inspection.affectedDocumentationPaths?.join(", ") || "none"}. No changes occur until confirmation.`;
        }
        ports.root.querySelector("#schema-property-removal-dialog")?.showModal();
        ports.root.querySelector("#schema-property-removal-heading")?.focus();
    }
    applyRemoval(path) {
        const ports = this.#required(), schema = ports.active(), draft = schema.workingDraft;
        if (!draft)
            return;
        const tree = ports.root.querySelector("#schema-property-tree"), priorPaths = Array.from(tree?.querySelectorAll("[data-schema-property-canonical-path]") ?? [], ({ dataset }) => dataset.schemaPropertyCanonicalPath ?? ""), priorIndex = Math.max(0, priorPaths.indexOf(path));
        const removal = removeSchemaProperty(draft.document, draft.attachedRules ?? [], path, draft.documentation);
        this.lastRemoval = removal;
        this.selectedPath = removal.propertyPath.slice(1).replaceAll("/", ".");
        this.expandedRulePaths.delete(removal.propertyPath);
        ports.replaceActive(updateSchemaWorkingDraft(schema, { document: removal.document, attachedRules: removal.attachedRules,
            ...(removal.documentation !== undefined ? { documentation: removal.documentation } : {}) }, `Remove property ${removal.propertyPath} and property-specific constraints`));
        this.#setText("#schema-property-removal-feedback", `Removed ${removal.propertyPath} from the working draft. Undo is available.`);
        this.#hidden("#undo-schema-property-removal", false);
        ports.persist();
        ports.renderAll();
        const remaining = Array.from(tree?.querySelectorAll("[data-schema-property-canonical-path]") ?? []), focusRow = remaining[Math.min(priorIndex, remaining.length - 1)];
        if (focusRow) {
            this.selectedPath = focusRow.dataset.schemaPropertyPath ?? focusRow.dataset.schemaPropertyCanonicalPath ?? "";
            ports.renderView();
            const selected = tree?.querySelector(`[data-schema-property-canonical-path="${CSS.escape(focusRow.dataset.schemaPropertyCanonicalPath ?? "")}"]`);
            (selected?.querySelector("button, a, input, select, textarea") ?? selected)?.focus({ preventScroll: true });
        }
        else
            ports.root.querySelector("#add-schema-property")?.focus({ preventScroll: true });
    }
    closeRemoval(restoreFocus = true) { const trigger = this.pendingRemoval?.trigger; this.pendingRemoval = undefined; const dialog = this.#required().root.querySelector("#schema-property-removal-dialog"); if (dialog?.open)
        dialog.close(); if (restoreFocus)
        trigger?.focus(); }
    confirmRemoval() { const path = this.pendingRemoval?.path; this.closeRemoval(false); if (path)
        this.applyRemoval(path); }
    cancelRemoval(event) { event?.preventDefault(); this.closeRemoval(); }
    undoRemoval() {
        const ports = this.#required(), removal = this.lastRemoval;
        if (!removal)
            return;
        if (ports.canonicalUndo()) {
            this.lastRemoval = undefined;
            this.#setText("#schema-property-removal-feedback", `Restored ${removal.propertyPath} from page-scoped Undo with its canonical identity and tree position.`);
            this.#hidden("#undo-schema-property-removal", true);
            return;
        }
        const schema = ports.active(), restored = undoSchemaPropertyRemoval(removal), path = removal.propertyPath;
        this.selectedPath = path.slice(1).replaceAll("/", ".");
        this.expandedRulePaths.add(path);
        ports.replaceActive(updateSchemaWorkingDraft(schema, { document: restored.document, attachedRules: restored.attachedRules,
            ...(restored.documentation !== undefined ? { documentation: restored.documentation } : {}) }, `Undo property removal ${path}`));
        this.#setText("#schema-property-removal-feedback", `Restored ${path} with its prior definition and tree position.`);
        this.#hidden("#undo-schema-property-removal", true);
        this.lastRemoval = undefined;
        ports.persist();
        ports.renderAll();
        ports.renderView();
    }
    requestDocumentationRemoval(path, trigger) {
        const ports = this.#required();
        this.pendingDocumentationRemoval = { path, ...(trigger ? { trigger } : {}) };
        this.#setText("#schema-documentation-removal-summary", `${path} documentation will be removed from the working draft. The schema property and validation rules remain unchanged.`);
        ports.root.querySelector("#schema-documentation-removal-dialog")?.showModal();
        ports.root.querySelector("#schema-documentation-removal-heading")?.focus();
    }
    closeDocumentationRemoval(restoreFocus = true) { const trigger = this.pendingDocumentationRemoval?.trigger; this.pendingDocumentationRemoval = undefined; const dialog = this.#required().root.querySelector("#schema-documentation-removal-dialog"); if (dialog?.open)
        dialog.close(); if (restoreFocus)
        trigger?.focus(); }
    confirmDocumentationRemoval() {
        const ports = this.#required(), path = this.pendingDocumentationRemoval?.path;
        if (!path)
            return;
        const schema = ports.active();
        this.closeDocumentationRemoval(false);
        if (!schema.workingDraft)
            return;
        ports.replaceActive(ports.removeCanonicalDocumentation(schema, path));
        ports.queuePersistence(schema.id);
        ports.renderAll();
    }
    resetCopyDialog() {
        const clean = typeof this.#copyDialog?.cloneNode === "function" ? this.#copyDialog.cloneNode(false) : undefined;
        if (this.#copyDialog && clean) {
            clean.id = this.#copyDialog.id;
            this.#copyDialog.replaceWith(clean);
            this.#copyDialog = clean;
        }
    }
    openCopy(path, triggerOrDestination) {
        const ports = this.#required(), sourceSchema = ports.active(), source = schemaPropertyCopySource(sourceSchema, { surface: sourceSchema.workingDraft ? "working draft" : "current" }), editor = ports.root.querySelector("#schema-editor"), tree = ports.root.querySelector("#schema-property-tree"), editorScroll = editor?.scrollTop ?? 0, treeScroll = tree?.scrollTop ?? 0, trigger = typeof triggerOrDestination === "string" ? undefined : triggerOrDestination, sources = [source, ...(sourceSchema.workingDraft ? [schemaPropertyCopySource(sourceSchema, { surface: "current" })] : []),
            ...schemaRevisionChoices(sourceSchema).map((version) => schemaPropertyCopySource(sourceSchema, { surface: "historical", version }))];
        this.pendingCopyReview?.close();
        this.resetCopyDialog();
        const review = renderSchemaPropertyCopyReview(this.#copyDialog, { source, sources, selectedPath: path,
            destinations: ports.schemas().filter(({ id }) => id !== sourceSchema.id), schemas: ports.schemas(), reusableRuleIds: ports.ruleIds(), ...(trigger ? { trigger } : {}),
            onApply: (transaction) => {
                this.pendingCopyPosition = { schemaId: sourceSchema.id, settlementSchemaId: transaction.schema.id, path, editorScroll, treeScroll };
                ports.replaceSchemas(ports.schemas().map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema));
                this.lastCopy = transaction;
                this.pendingCopy = undefined;
                this.pendingCopyReview = undefined;
                ports.persist();
                ports.renderAll();
                ports.renderRules();
                this.#hidden("#undo-schema-property-copy", false);
                this.#setText("#schema-property-copy-feedback", `Copied ${path} from ${source.label} to ${transaction.schema.name}. Published revisions are unchanged.`);
                const restoration = this.pendingCopyPosition, restore = () => { tree?.querySelector(`button[aria-label="Copy ${path} to another schema"]`)?.focus({ preventScroll: true }); if (editor)
                    editor.scrollTop = editorScroll; if (tree)
                    tree.scrollTop = treeScroll; }, complete = () => { restore(); ports.scheduleFrame(() => { restore(); if (this.pendingCopyPosition === restoration)
                    this.pendingCopyPosition = undefined; }); };
                queueMicrotask(restore);
                ports.scheduleFrame(restore);
                if (ports.settle)
                    void ports.settle(transaction.schema.id).then(() => ports.scheduleFrame(complete), () => { });
                else
                    ports.scheduleFrame(complete);
            }, ...(trigger ? { onClose: () => trigger.focus({ preventScroll: true }) } : {}) });
        this.pendingCopyReview = review;
        if (typeof triggerOrDestination === "string") {
            const destination = this.#copyDialog?.querySelector("#schema-property-copy-destination");
            if (destination) {
                destination.value = triggerOrDestination;
                const testable = destination;
                if (testable.dispatch)
                    testable.dispatch("change");
                else
                    destination.dispatchEvent(new Event("change", { bubbles: true }));
            }
            this.pendingCopy = review.plan();
        }
    }
    confirmCopy() {
        const ports = this.#required();
        if (!this.pendingCopy)
            return;
        const transaction = applySchemaPropertyCopy(this.pendingCopy);
        ports.replaceSchemas(ports.schemas().map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema));
        this.lastCopy = transaction;
        this.pendingCopy = undefined;
        this.pendingCopyReview?.close();
        this.pendingCopyReview = undefined;
        this.resetCopyDialog();
        this.#setText("#schema-property-copy-feedback", `Copied ${transaction.plan.selectedPath} from ${transaction.plan.source.label} to ${transaction.schema.name}. Published revisions are unchanged.`);
        this.#hidden("#undo-schema-property-copy", false);
        ports.persist();
        ports.renderAll();
    }
    undoCopy() {
        const ports = this.#required();
        if (!this.lastCopy)
            return;
        const restored = undoSchemaPropertyCopy(this.lastCopy).schema;
        ports.replaceSchemas(ports.schemas().map((schema) => schema.id === restored.id ? restored : schema));
        this.#setText("#schema-property-copy-feedback", `Undid property copy to ${restored.name}; the pre-copy working draft was restored.`);
        this.#hidden("#undo-schema-property-copy", true);
        this.lastCopy = undefined;
        ports.persist();
        ports.renderAll();
    }
    renderSpecificIndex() {
        const ports = this.#required(), draft = ports.active().workingDraft;
        if (!this.specificIndexArrayPath || !draft)
            return;
        const input = ports.root.querySelector("#schema-specific-index"), inspection = inspectSpecificIndexRuleTarget(draft.document, this.specificIndexArrayPath, input?.value ?? ""), confirm = ports.root.querySelector("#confirm-schema-specific-index");
        if (confirm)
            confirm.disabled = inspection.result !== "accepted";
        this.#setText("#schema-specific-index-assistance", inspection.assistance);
    }
    openSpecificIndex(arrayPath, trigger) {
        const ports = this.#required();
        this.specificIndexArrayPath = arrayPath;
        this.specificIndexTrigger = trigger;
        const input = ports.root.querySelector("#schema-specific-index"), confirm = ports.root.querySelector("#confirm-schema-specific-index");
        if (input)
            input.value = "";
        if (confirm)
            confirm.disabled = true;
        this.#setText("#schema-specific-index-assistance", "Enter a non-negative zero-based index");
        ports.root.querySelector("#schema-specific-index-dialog")?.showModal();
        input?.focus();
    }
    submitSpecificIndex(event) {
        event.preventDefault();
        const ports = this.#required(), draft = ports.active().workingDraft;
        if (!draft || !this.specificIndexArrayPath)
            return;
        const inspection = inspectSpecificIndexRuleTarget(draft.document, this.specificIndexArrayPath, ports.root.querySelector("#schema-specific-index")?.value ?? "");
        if (inspection.result !== "accepted")
            return;
        const trigger = this.specificIndexTrigger, path = inspection.canonicalPath.slice(1).replaceAll("/", ".");
        this.closeSpecificIndex();
        ports.openRulePicker(path, trigger);
    }
    closeSpecificIndex(event) { event?.preventDefault(); const ports = this.#required(); ports.root.querySelector("#schema-specific-index-dialog")?.close(); this.specificIndexTrigger?.focus(); this.specificIndexArrayPath = undefined; this.specificIndexTrigger = undefined; }
    parentDocuments() {
        const ports = this.#required(), documents = [], visited = new Set();
        let parentId = ports.active().workingDraft?.parentSchemaId ?? ports.active().parentSchemaId;
        while (parentId && !visited.has(parentId)) {
            visited.add(parentId);
            const parent = ports.schemas().find(({ id }) => id === parentId);
            if (!parent)
                break;
            documents.push(parent.document);
            parentId = parent.parentSchemaId;
        }
        return documents;
    }
    manualDefinition() {
        const ports = this.#required(), type = (ports.root.querySelector("#schema-manual-property-type")?.value || "string"), arrayType = (ports.root.querySelector("#schema-manual-array-item-type")?.value ?? "");
        if (this.pendingManualContext)
            return contextualManualPropertyDefinition(this.pendingManualContext.parentPath, ports.root.querySelector("#schema-manual-property-child-name")?.value ?? "", type, type === "array" && arrayType ? arrayType : undefined);
        return { path: ports.root.querySelector("#schema-manual-property-path")?.value ?? "", type, ...(type === "array" && arrayType ? { arrayItemType: arrayType } : {}) };
    }
    renderManual() {
        const ports = this.#required(), draft = ports.active().workingDraft;
        if (!draft)
            return;
        const definition = this.manualDefinition(), inspection = inspectManualProperty(draft.document, this.parentDocuments(), definition), contextual = Boolean(this.pendingManualContext);
        this.#hidden("#schema-manual-property-path-label", contextual);
        this.#hidden("#schema-manual-property-path", contextual);
        this.#hidden("#schema-manual-property-child-name-label", !contextual);
        this.#hidden("#schema-manual-property-child-name", !contextual);
        const parent = ports.root.querySelector("#schema-manual-property-parent-context");
        if (parent) {
            parent.hidden = !contextual;
            parent.textContent = this.pendingManualContext ? `Parent path: ${this.pendingManualContext.parentPath}` : "";
        }
        this.#hidden("#schema-manual-array-type-group", definition.type !== "array");
        this.#setText("#schema-manual-property-preview", definition.path.trim() ? `Normalized path: ${inspection.normalizedPath || "none"}. ${manualPropertyPreview(definition)}. Missing object path: ${inspection.missingObjectPath.join(", ") || "none"}.` : "Normalized path: none. Missing object path: none.");
        this.#setText("#schema-manual-property-assistance", inspection.result === "blocked" ? inspection.assistance : "Ready to add");
        const confirm = ports.root.querySelector("#confirm-schema-manual-property");
        if (confirm)
            confirm.disabled = inspection.result === "blocked";
        const existing = inspection.result === "blocked" ? inspection.existingPath : undefined, go = ports.root.querySelector("#go-to-existing-schema-property");
        if (go) {
            go.hidden = !existing;
            if (existing && inspection.result === "blocked") {
                go.textContent = inspection.assistance;
                go.dataset.schemaPropertyPath = existing;
            }
            else
                delete go.dataset.schemaPropertyPath;
        }
    }
    openManual(parentPath, trigger) {
        const ports = this.#required();
        if (!ports.active().workingDraft)
            return;
        this.pendingManualContext = parentPath ? { parentPath, ...(trigger ? { trigger } : {}) } : undefined;
        this.pendingManualCanonicalBase = ports.active().workingDraft?.canonicalSchema;
        this.#setText("#schema-manual-property-heading", parentPath ? "Add child property" : "Add property");
        for (const selector of ["#schema-manual-property-path", "#schema-manual-property-child-name"]) {
            const input = ports.root.querySelector(selector);
            if (input)
                input.value = "";
        }
        const type = ports.root.querySelector("#schema-manual-property-type"), array = ports.root.querySelector("#schema-manual-array-item-type");
        if (type)
            type.value = "string";
        if (array)
            array.value = "";
        this.renderManual();
        ports.root.querySelector("#schema-manual-property-dialog")?.showModal();
        ports.root.querySelector(parentPath ? "#schema-manual-property-child-name" : "#schema-manual-property-path")?.focus();
    }
    closeManual(restoreFocus = true) { const ports = this.#required(), trigger = this.pendingManualContext?.trigger; this.pendingManualContext = undefined; ports.root.querySelector("#schema-manual-property-dialog")?.close(); if (restoreFocus)
        (trigger ?? ports.root.querySelector("#add-schema-property"))?.focus(); }
    submitManual(event) {
        event.preventDefault();
        const ports = this.#required(), schema = ports.active(), draft = schema.workingDraft;
        if (!draft)
            return;
        const definition = this.manualDefinition(), inspection = inspectManualProperty(draft.document, this.parentDocuments(), definition);
        if (inspection.result !== "ready") {
            this.renderManual();
            return;
        }
        const document = addManualProperty(draft.document, this.parentDocuments(), definition), canonicalSchema = ports.addManualCanonical(schema, document, inspection.normalizedPath);
        ports.replaceActive(updateSchemaWorkingDraft(schema, { document, ...(canonicalSchema ? { canonicalSchema } : {}) }, `Add manual property ${inspection.normalizedPath}`));
        this.selectedPath = inspection.normalizedPath.slice(1).replaceAll("/", ".");
        this.closeManual(false);
        this.pendingManualCanonicalBase = undefined;
        ports.persist();
        ports.renderAll();
    }
    goToExisting() {
        const ports = this.#required(), path = ports.root.querySelector("#go-to-existing-schema-property")?.dataset.schemaPropertyPath;
        if (!path)
            return;
        this.selectedPath = path.replace(/^\//, "").replaceAll("/", ".");
        this.closeManual(false);
        ports.renderAll();
        ports.root.querySelector(`button[aria-label="${CSS.escape(`Add rule for ${this.selectedPath}`)}"]`)?.focus({ preventScroll: true });
    }
    #setText(selector, value) { const element = this.#required().root.querySelector(selector); if (element)
        element.textContent = value; }
    #hidden(selector, value) { const element = this.#required().root.querySelector(selector); if (element)
        element.hidden = value; }
    #required() { if (!this.#ports)
        throw new Error("Schema property controller is not configured."); return this.#ports; }
    dispose(resetCopyDialog = () => this.resetCopyDialog()) {
        this.pendingRemoval = undefined;
        this.pendingDocumentationRemoval = undefined;
        this.lastRemoval = undefined;
        this.pendingCopyReview?.close();
        this.pendingCopyReview = undefined;
        resetCopyDialog();
        this.pendingCopy = undefined;
        this.lastCopy = undefined;
        this.pendingCopyPosition = undefined;
        this.specificIndexArrayPath = undefined;
        this.specificIndexTrigger = undefined;
        this.pendingManualContext = undefined;
        this.pendingManualCanonicalBase = undefined;
        this.interactionReturn = undefined;
        this.expandedRulePaths.clear();
    }
}
//# sourceMappingURL=property-controller.js.map