import { normalizeAllowedValuesRuleLibraryEntry } from "../../data-layer-allowed-values-rule.js";
import { publishReusableRuleSync, reviewReusableRuleSync } from "../../data-layer-reusable-rule-sync.js";
import { promoteLocalRule, reviewLocalRulePromotion } from "../../data-layer-local-rule-promotion.js";
import { storedPromotionRules } from "./schema-model.js";
import { configuredRuleDetails, applicablePropertyTypesForRule, reusableRuleMetadata, schemaPropertyRows, typedComparisonValue, updateSchemaWorkingDraft, } from "../../utilities/data-layer/schemas.js";
export const SCHEMA_RULE_STORAGE_KEY = "my-chrome-utilities.schema-rule-library.v1";
export function installSchemaRuleElements(root) {
    const document = root.ownerDocument ?? ("createElement" in root ? root : undefined), owned = (selector, tag) => root.querySelector(selector) ?? document?.createElement(tag) ?? null, createRule = root.querySelector("#create-schema-rule"), editor = root.querySelector("#schema-rule-editor"), name = root.querySelector("#schema-rule-name"), parameters = root.querySelector("#schema-rule-parameters"), types = root.querySelector("#schema-rule-types"), operator = root.querySelector("#schema-rule-operator"), severity = root.querySelector("#schema-rule-severity"), message = root.querySelector("#schema-rule-message"), examples = root.querySelector("#schema-rule-examples"), save = root.querySelector("#save-schema-rule"), list = root.querySelector("#schema-rule-list"), search = root.querySelector("#schema-rule-search"), attachments = root.querySelector("#schema-rule-attachments"), updateAttachments = root.querySelector("#update-schema-rule-attachments"), exportRules = root.querySelector("#export-schema-rules"), revisionReview = owned("#schema-rule-revision-review", "dialog"), revisionSummary = owned("#schema-rule-revision-review-summary", "output"), confirmRevision = owned("#confirm-schema-rule-revision-review", "button"), cancelRevision = owned("#cancel-schema-rule-revision", "button"), upgradeReview = owned("#schema-rule-upgrade-review", "dialog"), upgradeSummary = owned("#schema-rule-upgrade-review-summary", "output"), confirmUpgrade = owned("#confirm-schema-rule-upgrade", "button"), cancelUpgrade = owned("#cancel-schema-rule-upgrade", "button"), syncReview = owned("#schema-rule-sync-review", "dialog"), syncSummary = owned("#schema-rule-sync-review-summary", "output"), confirmSync = owned("#confirm-schema-rule-sync", "button"), cancelSync = owned("#cancel-schema-rule-sync", "button"), deleteReview = owned("#schema-rule-delete-review", "dialog"), deleteSummary = owned("#schema-rule-delete-review-summary", "output"), confirmDelete = owned("#confirm-schema-rule-delete", "button"), cancelDelete = owned("#cancel-schema-rule-delete", "button"), result = root.querySelector("#schema-result");
    if (types?.ownerDocument)
        types.replaceChildren(...[["string", "String"], ["number", "Number"], ["boolean", "Boolean"], ["object", "Object"], ["array", "Array"]].map(([value, label]) => { const option = types.ownerDocument.createElement("option"); option.value = value; option.textContent = label; return option; }));
    const install = (dialog, id, heading, summary, confirm, cancel, confirmId = `confirm-${id.replace("-review", "")}`) => {
        if (!dialog || dialog.isConnected)
            return;
        dialog.id = id;
        const title = document?.createElement("h4");
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
        document?.body.append(dialog);
    };
    install(revisionReview, "schema-rule-revision-review", "Review rule revision", revisionSummary, confirmRevision, cancelRevision, "confirm-schema-rule-revision-review");
    install(upgradeReview, "schema-rule-upgrade-review", "Update pinned rule attachments", upgradeSummary, confirmUpgrade, cancelUpgrade);
    install(syncReview, "schema-rule-sync-review", "Sync attached schemas and publish revisions", syncSummary, confirmSync, cancelSync);
    install(deleteReview, "schema-rule-delete-review", "Delete reusable rule", deleteSummary, confirmDelete, cancelDelete);
    return { createRule, save, exportRules, cancelRevision, cancelDelete, elements: { list, search, editor, name, parameters, types, operator, severity, message, examples, attachments, updateAttachments, result,
            revisionReview, revisionSummary, confirmRevision, upgradeReview, upgradeSummary, confirmUpgrade, cancelUpgrade, syncReview, syncSummary, confirmSync, cancelSync, deleteReview, deleteSummary, confirmDelete, document } };
}
function normalizeRule(value) {
    if (!value || typeof value !== "object" || !("id" in value) || !("name" in value) || !("version" in value))
        return;
    const candidate = structuredClone(value);
    return normalizeAllowedValuesRuleLibraryEntry({ ...candidate,
        kind: typeof candidate.kind === "string" && candidate.kind ? candidate.kind : candidate.operator === "allowed-values" ? "Allowed values" : "Rule",
        enabled: candidate.enabled !== false });
}
export class SchemaRuleController {
    #storage;
    #behavior;
    rules;
    pickerPath;
    pickerTrigger;
    pickerSearch = "";
    configuration;
    editingAttached;
    editingReusableId;
    approvedRevisionId;
    approvedAttachmentUpdateId;
    pendingSnapshot;
    pendingRevision;
    pendingUpgrade;
    pendingSync;
    pendingDeletionId;
    pendingPromotion;
    promotionFocusReturn;
    promotionFocusedPosition;
    promotionGeneration = 0;
    #rowDisposers = [];
    #pickerDisposers = [];
    constructor(storage, behavior) {
        this.#storage = storage;
        this.#behavior = behavior;
        const serialized = storage.getItem(SCHEMA_RULE_STORAGE_KEY);
        try {
            const stored = JSON.parse(serialized ?? "[]");
            this.rules = Array.isArray(stored) ? stored.map(normalizeRule).filter((rule) => Boolean(rule)) : [];
        }
        catch {
            this.rules = [];
        }
        if (serialized !== null && JSON.stringify(this.rules) !== serialized)
            this.persist();
    }
    configure(behavior) { this.#behavior = behavior; }
    reload() {
        const serialized = this.#storage.getItem(SCHEMA_RULE_STORAGE_KEY);
        try {
            const stored = JSON.parse(serialized ?? "[]");
            this.rules = Array.isArray(stored) ? stored.map(normalizeRule).filter((rule) => Boolean(rule)) : [];
        }
        catch {
            this.rules = [];
        }
    }
    persist() { this.#storage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(this.rules)); }
    stored(id) { return this.rules.find((rule) => rule.id === id); }
    expansionRules() { return structuredClone(this.rules); }
    normalizePickerPath(path) { return `/${path.replace(/^\//, "").replaceAll(".", "/")}`; }
    valueAtPath(value, path) {
        let current = value;
        for (const segment of path.replace(/^\//, "").split(/[/.]/).filter(Boolean)) {
            if (current === null || typeof current !== "object" || !(segment in current))
                return { exists: false, value: undefined };
            current = current[segment];
        }
        return { exists: true, value: current };
    }
    conditionPredicate(propertyPath, sampleProperty = false) {
        const ports = this.#behavior;
        if (!ports)
            return { operator: "All", predicates: [] };
        const editable = ports.editableSchema(), consequence = this.normalizePickerPath(propertyPath), paths = schemaPropertyRows(editable.document).map(({ canonicalPath }) => canonicalPath);
        const choice = sampleProperty ? consequence : paths.find((path) => this.normalizePickerPath(path) === "/page_type")
            ?? paths.find((path) => this.normalizePickerPath(path) !== consequence) ?? "";
        const canonical = choice ? this.normalizePickerPath(choice) : "", sample = this.valueAtPath(ports.capturedValue("payload"), canonical), comparable = sample.exists && (sample.value === null || ["string", "number", "boolean"].includes(typeof sample.value));
        const detectedType = ports.propertyType(editable.document, canonical) ?? "string";
        return { operator: "All", predicates: [{ propertyPath: canonical, operator: comparable ? "Equals" : "Exists",
                    ...(comparable ? { comparison: typedComparisonValue(sample.value) } : {}),
                    ...(!sampleProperty || !comparable ? { detectedType } : {}) }] };
    }
    configuredRule() {
        const ports = this.#behavior, configuration = this.configuration;
        if (!ports)
            throw new Error("Schema rule behavior is not configured");
        if (configuration) {
            const details = configuredRuleDetails(configuration), generatedId = configuration.saveReusable
                ? ports.createRuleId() : ports.createRuleId().replace(/^rule:/, "local-rule:");
            return { id: this.editingAttached?.id ?? this.editingReusableId ?? generatedId,
                name: configuration.reusableName.trim() || `${configuration.ruleType} for ${this.pickerPath}`, kind: configuration.ruleType,
                version: this.stored(this.editingReusableId ?? "")?.version ?? 0, enabled: configuration.enabled, applicableType: configuration.propertyType,
                operator: details.operator, ...(details.parameters !== undefined ? { parameters: details.parameters } : {}),
                ...(details.allowedValues !== undefined ? { allowedValues: details.allowedValues } : {}), ...(details.comparison !== undefined ? { comparison: details.comparison } : {}),
                ...(details.limit !== undefined ? { limit: details.limit } : {}), severity: configuration.severity,
                ...(configuration.message.trim() ? { message: configuration.message.trim() } : {}),
                ...(configuration.applyOnlyWhen ? { conditionGroup: { operator: configuration.conditionGroupOperator, predicates: structuredClone(configuration.conditions) } } : {}),
                ...(configuration.description.trim() ? { description: configuration.description.trim() } : {}) };
        }
        const elements = ports.elements, name = elements.name?.value.trim() || "Untitled rule", operator = elements.operator?.value || "required";
        return { id: this.editingReusableId ?? ports.createRuleId(), name, kind: operator, version: this.stored(this.editingReusableId ?? "")?.version ?? 0,
            enabled: true, applicableType: (elements.types?.value || "string"), operator,
            ...(elements.parameters?.value.trim() ? { parameters: elements.parameters.value.trim() } : {}),
            ...(elements.severity?.value ? { severity: elements.severity.value } : {}), ...(elements.message?.value.trim() ? { message: elements.message.value.trim() } : {}) };
    }
    typeForAttachment(schema, propertyPath) {
        const document = schema.workingDraft?.document ?? schema.document, type = this.#required().propertyType(document, this.normalizePickerPath(propertyPath));
        return type && ["string", "number", "array", "object", "boolean"].includes(type) ? type : "string";
    }
    attach(schemaId, ruleId, propertyPath, suppliedRule) {
        const ports = this.#required(), rule = suppliedRule ?? this.stored(ruleId), stored = ports.schemas().find(({ id }) => id === schemaId), draft = ports.draft(), schema = stored ?? (draft?.id === schemaId ? draft : undefined);
        if (!rule || !schema || (propertyPath && !applicablePropertyTypesForRule(rule).includes(this.typeForAttachment(schema, propertyPath))))
            return false;
        const canonical = propertyPath ? this.normalizePickerPath(propertyPath) : undefined, source = schema.workingDraft?.attachedRules ?? schema.attachedRules ?? [], attachedRules = [...source
                .filter((attached) => attached.id !== rule.id || this.normalizePickerPath(attached.propertyPath ?? "") !== canonical), { id: rule.id, name: rule.name, version: rule.version,
                ...(canonical ? { propertyPath: canonical } : {}), ...(rule.operator ? { operator: rule.operator } : {}), ...(rule.parameters ? { parameters: rule.parameters } : {}),
                ...(rule.severity ? { severity: rule.severity } : {}), ...(rule.allowedValues ? { allowedValues: structuredClone(rule.allowedValues) } : {}),
                ...(rule.comparison ? { comparison: rule.comparison } : {}), ...(rule.limit !== undefined ? { limit: rule.limit } : {}),
                ...(rule.applicableType ? { applicableType: rule.applicableType } : {}), ...(rule.message ? { message: rule.message } : {}),
                ...(rule.conditionGroup ? { conditionGroup: structuredClone(rule.conditionGroup) } : {}), enabled: rule.enabled }];
        const updated = updateSchemaWorkingDraft(schema, { attachedRules }, `Attach ${rule.name} to ${propertyPath ?? "schema"}`);
        if (!stored) {
            ports.replaceDraft(structuredClone(updated));
            ports.renderDraft();
            return true;
        }
        ports.replaceSchemas(ports.schemas().map((candidate) => candidate.id === schemaId ? updated : candidate));
        ports.replaceDraft(ports.presentDraft(updated));
        ports.persistLibrary();
        ports.persistRules();
        ports.renderAll();
        return true;
    }
    updateAttached(schemaId, ruleId, enabled) {
        const ports = this.#required();
        let changed = false;
        ports.replaceSchemas(ports.schemas().map((schema) => schema.id !== schemaId || !schema.attachedRules ? schema : { ...schema,
            attachedRules: schema.attachedRules.map((rule) => { if (rule.id !== ruleId)
                return rule; changed = true; return { ...rule, enabled }; }) }));
        if (changed) {
            ports.persistLibrary();
            ports.persistRules();
            ports.renderAll();
        }
        return changed;
    }
    restorePromotion(ruleId, rerender = true) {
        const ports = this.#required();
        if (this.pendingPromotion)
            this.promotionFocusReturn = { propertyPath: this.pendingPromotion.propertyPath, ruleId: ruleId ?? this.pendingPromotion.sourceRuleId, detailScroll: this.pendingPromotion.detailScroll };
        this.pendingPromotion = undefined;
        if (rerender) {
            ports.renderAll();
            this.render();
        }
        const focus = this.promotionFocusReturn ? { ...this.promotionFocusReturn } : undefined;
        if (!focus)
            return;
        const restore = () => { if (ports.detail && ports.detail.scrollTop !== focus.detailScroll)
            ports.detail.scrollTop = focus.detailScroll; };
        ports.detail?.addEventListener("scroll", restore);
        restore();
        ports.scheduleFrame(() => {
            restore();
            ports.scheduleFrame(() => {
                Array.from(ports.root.querySelectorAll("button[data-rule-id]")).find(({ dataset }) => dataset.ruleId === focus.ruleId && dataset.propertyPath === focus.propertyPath)?.focus({ preventScroll: true });
                restore();
                ports.detail?.removeEventListener("scroll", restore);
            });
        });
    }
    openPromotion(propertyPath, sourceRuleId) {
        const ports = this.#required(), stored = ports.activeSchemaId() ? ports.schemas().find(({ id }) => id === ports.activeSchemaId()) : undefined, schema = stored ?? ports.draft();
        if (!schema)
            return false;
        const editorContext = stored ? "editable" : "new-schema", generation = ++this.promotionGeneration, reusableRules = structuredClone(this.rules);
        let review;
        try {
            review = reviewLocalRulePromotion({ schema, reusableRules, propertyPath, sourceRuleId, editorContext });
        }
        catch (error) {
            ports.result(error instanceof Error ? error.message : "Promotion is no longer available.");
            return false;
        }
        const focused = this.promotionFocusedPosition?.propertyPath === propertyPath && this.promotionFocusedPosition.ruleId === sourceRuleId ? this.promotionFocusedPosition : undefined;
        this.pendingPromotion = { propertyPath, sourceRuleId, generation, detailScroll: focused?.detailScroll ?? ports.detail?.scrollTop ?? 0 };
        this.promotionFocusReturn = undefined;
        ports.promotionDialog.open({ review, cancel: () => { if (this.pendingPromotion?.generation === generation)
                this.restorePromotion(undefined, false); },
            confirm: (selected) => {
                if (this.pendingPromotion?.generation !== generation)
                    throw new Error("The promotion review is stale");
                const previousSchemas = structuredClone(ports.schemas()), previousRules = structuredClone(this.rules), result = selected.action === "create"
                    ? promoteLocalRule({ schema, reusableRules, propertyPath, sourceRuleId, editorContext, ...selected })
                    : promoteLocalRule({ schema, reusableRules, propertyPath, sourceRuleId, editorContext, action: "use-existing", reusableRuleId: selected.reusableRuleId }), nextSchemas = stored ? ports.schemas().map((candidate) => candidate.id === result.schema.id ? result.schema : candidate) : ports.schemas(), nextRules = storedPromotionRules(result.reusableRules);
                if (!stored) {
                    this.rules = structuredClone(nextRules);
                    ports.replaceDraft(structuredClone(result.schema));
                    this.persist();
                    ports.renderDraft();
                    this.render();
                    this.restorePromotion();
                    return;
                }
                return ports.commitPromotion(result.schema.id, previousSchemas, previousRules, nextSchemas, nextRules).then(async () => {
                    await ports.settleCanonical?.(result.schema.id);
                    const focus = () => Array.from(ports.root.querySelectorAll("button[data-rule-id]")).find(({ dataset }) => dataset.ruleId === result.replacementRuleId && dataset.propertyPath === propertyPath)?.focus({ preventScroll: true });
                    ports.scheduleFrame(() => ports.scheduleFrame(focus));
                    return () => { if (this.pendingPromotion?.generation === generation) {
                        ports.result(`Promoted ${sourceRuleId} to reusable rule ${result.replacementRuleId}.`);
                        this.restorePromotion(result.replacementRuleId);
                    } ports.scheduleFrame(() => ports.scheduleFrame(focus)); };
                });
            }, });
        return true;
    }
    render() {
        const ports = this.#behavior;
        if (!ports)
            return;
        const { list, search } = ports.elements;
        const summaryFor = (rule) => `${rule.name} v${rule.version} · ${reusableRuleMetadata(rule, rule.applicableType ?? "string")}`;
        const query = search?.value.trim().toLowerCase() ?? "", visible = this.rules.filter((rule) => summaryFor(rule).toLowerCase().includes(query));
        this.clearRows();
        if (!list?.ownerDocument) {
            if (list)
                list.textContent = visible.map(summaryFor).join("\n");
            return;
        }
        list.replaceChildren(...visible.map((rule) => {
            const item = list.ownerDocument.createElement("li"), summary = list.ownerDocument.createElement("span");
            item.dataset.ruleId = rule.id;
            summary.textContent = summaryFor(rule);
            item.append(summary);
            const action = (label, run) => { const button = list.ownerDocument.createElement("button"); button.type = "button"; button.textContent = label; this.listenRow(button, "click", run); item.append(button); };
            action("Edit", () => { this.edit(rule.id); });
            if (reviewReusableRuleSync(ports.schemas(), rule).schemaCount)
                action("Sync attached schemas and publish revisions", () => { this.requestSync(rule.id); });
            action("Duplicate", () => { this.rules = [...this.rules, { ...structuredClone(rule), id: ports.createId(), name: `${rule.name} copy`, version: 1, attachments: [] }]; ports.persistRules(); this.render(); });
            action("Export", () => ports.download(rule, `${rule.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-v${rule.version}.json`));
            action(rule.enabled ? "Disable" : "Enable", () => { this.rules = this.rules.map((candidate) => candidate.id === rule.id ? { ...candidate, enabled: !candidate.enabled } : candidate); ports.persistRules(); this.render(); });
            action("Delete", () => { this.requestDeletion(rule.id); });
            return item;
        }));
    }
    openNewEditor() {
        const ports = this.#behavior;
        if (!ports)
            return;
        const elements = ports.elements;
        if (!this.editingReusableId)
            this.pendingSnapshot = undefined;
        if (elements.editor)
            elements.editor.hidden = false;
        if (elements.name)
            elements.name.value = "";
        if (elements.parameters)
            elements.parameters.value = "";
        if (elements.message)
            elements.message.value = "";
        if (elements.examples)
            elements.examples.value = "";
        if (elements.types)
            elements.types.value = "string";
        if (elements.severity)
            elements.severity.value = "error";
        if (elements.attachments?.ownerDocument)
            elements.attachments.replaceChildren(...ports.schemas().map((schema) => {
                const option = elements.attachments.ownerDocument.createElement("option");
                option.value = schema.id;
                option.textContent = `${schema.name} v${schema.version}`;
                return option;
            }));
        elements.name?.focus();
    }
    beginNew() { this.editingReusableId = undefined; this.approvedRevisionId = undefined; this.pendingSnapshot = undefined; this.openNewEditor(); }
    edit(id) {
        const rule = this.stored(id), elements = this.#behavior?.elements;
        if (!rule || !elements)
            return false;
        this.editingReusableId = id;
        this.openNewEditor();
        if (elements.name)
            elements.name.value = rule.name;
        if (elements.parameters)
            elements.parameters.value = rule.parameters ?? "";
        if (elements.types)
            elements.types.value = rule.applicableType ?? "string";
        if (elements.operator)
            elements.operator.value = rule.operator ?? "required";
        if (elements.severity)
            elements.severity.value = rule.severity ?? "error";
        if (elements.message)
            elements.message.value = rule.message ?? "";
        if (elements.examples)
            elements.examples.value = rule.examples ?? "";
        return true;
    }
    save() {
        const ports = this.#behavior;
        if (!ports)
            return;
        const elements = ports.elements, name = elements.name?.value.trim();
        if (!name)
            return;
        const parameters = elements.parameters?.value.trim(), applicableType = elements.types?.value, operator = elements.operator?.value, severity = elements.severity?.value, message = elements.message?.value.trim(), examples = elements.examples?.value.trim(), attachments = Array.from(elements.attachments?.selectedOptions ?? []).map(({ value }) => value), previous = this.editingReusableId ? this.stored(this.editingReusableId) : undefined;
        if (previous && this.approvedRevisionId !== previous.id) {
            this.captureSnapshot();
            this.requestRevision(previous.id, { name, kind: `${operator || "Required"}${parameters ? ` (${parameters})` : ""}`,
                ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
                ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments });
            return;
        }
        const rule = normalizeAllowedValuesRuleLibraryEntry({ id: previous?.id ?? ports.createId(), name,
            kind: `${operator || "Required"}${parameters ? ` (${parameters})` : ""}`, version: (previous?.version ?? 0) + 1, enabled: previous?.enabled ?? true,
            ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
            ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments });
        this.pendingSnapshot = previous ? { id: previous.id, version: previous.version, attachments: [...(previous.attachments ?? [])] } : undefined;
        this.rules = [...this.rules.filter(({ id }) => id !== rule.id), rule];
        if (elements.updateAttachments?.checked || rule.version === 1)
            ports.replaceSchemas(ports.schemas().map((schema) => {
                if (!attachments.includes(schema.id))
                    return schema;
                const attachedRules = [...(schema.attachedRules ?? []).filter(({ id }) => id !== rule.id),
                    { id: rule.id, name: rule.name, version: rule.version, ...(operator ? { operator } : {}), ...(rule.parameters ? { parameters: rule.parameters } : {}),
                        ...(rule.allowedValues ? { allowedValues: rule.allowedValues } : {}), ...(severity ? { severity } : {}), ...(message ? { message } : {}), enabled: true }];
                return { ...schema, attachedRules };
            }));
        this.editingReusableId = undefined;
        ports.persistLibrary();
        ports.persistRules();
        ports.renderAll();
        this.render();
        if (elements.editor)
            elements.editor.hidden = true;
    }
    captureSnapshot() {
        const previous = this.editingReusableId ? this.stored(this.editingReusableId) : undefined;
        if (previous)
            this.pendingSnapshot = { id: previous.id, version: previous.version, attachments: [...(previous.attachments ?? [])] };
    }
    updateAttachmentPreview() {
        const elements = this.#behavior?.elements;
        if (elements?.result)
            elements.result.textContent = elements.updateAttachments?.checked
                ? "Pinned attachments will be updated" : "Existing pinned attachments remain unchanged";
    }
    requestRevision(id, changes) {
        const previous = this.stored(id), elements = this.#behavior?.elements;
        if (!previous || !elements)
            return false;
        this.pendingRevision = { id, changes: structuredClone(changes) };
        this.approvedRevisionId = undefined;
        const previousParameters = previous.allowedValues?.map(String).join(",") ?? previous.parameters ?? "none";
        if (elements.revisionSummary)
            elements.revisionSummary.textContent = `${previous.name} v${previous.version} will become ${changes.name ?? previous.name} v${previous.version + 1}; parameters ${previousParameters} → ${changes.parameters ?? previous.parameters ?? "none"}; examples ${previous.examples ?? "none"} → ${changes.examples ?? previous.examples ?? "none"}.`;
        elements.revisionReview?.showModal();
        elements.confirmRevision?.focus();
        return true;
    }
    confirmRevision() {
        const pending = this.pendingRevision, ports = this.#behavior;
        if (!pending || !ports)
            return;
        this.rules = this.rules.map((rule) => {
            if (rule.id !== pending.id)
                return rule;
            const revised = { ...rule, ...structuredClone(pending.changes), version: rule.version + 1,
                revisionHistory: [...(rule.revisionHistory ?? []), { name: rule.name, kind: rule.kind, version: rule.version,
                        ...(rule.enabled === false ? { enabled: false } : {}), ...(rule.applicableType ? { applicableType: rule.applicableType } : {}),
                        ...(rule.operator ? { operator: rule.operator } : {}), ...(rule.parameters ? { parameters: rule.parameters } : {}),
                        ...(rule.severity ? { severity: rule.severity } : {}), ...(rule.message ? { message: rule.message } : {}), ...(rule.examples ? { examples: rule.examples } : {}) }] };
            if (pending.changes.parameters !== undefined && (pending.changes.operator ?? rule.operator) === "allowed-values")
                delete revised.allowedValues;
            return normalizeAllowedValuesRuleLibraryEntry(revised);
        });
        this.approvedRevisionId = pending.id;
        if (this.editingReusableId === pending.id) {
            this.editingReusableId = undefined;
            if (ports.elements.editor)
                ports.elements.editor.hidden = true;
        }
        this.pendingRevision = undefined;
        ports.persistRules();
        this.render();
        ports.elements.revisionReview?.close();
    }
    cancelRevision() { this.pendingRevision = undefined; this.#behavior?.elements.revisionReview?.close(); }
    requestUpgrade(id, schemaIds) {
        const rule = this.stored(id), ports = this.#behavior;
        if (!rule || !ports)
            return false;
        const affected = ports.schemas().filter((schema) => schemaIds.includes(schema.id) && schema.attachedRules?.some((item) => item.id === id));
        this.pendingUpgrade = { id, schemaIds: [...schemaIds] };
        if (ports.elements.upgradeSummary)
            ports.elements.upgradeSummary.textContent = affected.length
                ? `Update pinned attachments for ${rule.name} v${rule.version}: ${affected.map(({ name }) => name).join(", ")}.` : `No pinned attachments for ${rule.name} are selected.`;
        if (ports.elements.confirmUpgrade)
            ports.elements.confirmUpgrade.disabled = affected.length === 0;
        ports.elements.upgradeReview?.showModal();
        (affected.length ? ports.elements.confirmUpgrade : ports.elements.cancelUpgrade)?.focus();
        return true;
    }
    confirmUpgrade() {
        const pending = this.pendingUpgrade, ports = this.#behavior;
        if (!pending || !ports)
            return;
        const rule = this.stored(pending.id);
        if (!rule)
            return;
        ports.replaceSchemas(ports.schemas().map((schema) => !pending.schemaIds.includes(schema.id) || !schema.attachedRules ? schema : { ...schema,
            attachedRules: schema.attachedRules.map((attached) => attached.id !== rule.id ? attached : { ...attached, name: rule.name, version: rule.version,
                ...(rule.operator ? { operator: rule.operator } : {}), ...(rule.parameters ? { parameters: rule.parameters } : {}),
                ...(rule.severity ? { severity: rule.severity } : {}), ...(rule.message ? { message: rule.message } : {}), enabled: rule.enabled }) }));
        this.approvedAttachmentUpdateId = pending.id;
        this.pendingUpgrade = undefined;
        ports.persistLibrary();
        ports.elements.upgradeReview?.close();
    }
    cancelUpgrade() { this.pendingUpgrade = undefined; this.#behavior?.elements.upgradeReview?.close(); }
    requestSync(id) {
        const rule = this.stored(id), ports = this.#behavior;
        if (!rule || !ports)
            return false;
        const review = reviewReusableRuleSync(ports.schemas(), rule);
        this.pendingSync = { rule: structuredClone(rule), review };
        const changes = review.schemas.map((schema) => `${schema.schemaName} revision ${schema.currentVersion} to ${schema.nextVersion}`).join("; ");
        if (ports.elements.syncSummary)
            ports.elements.syncSummary.textContent = review.blocked.length
                ? `${review.schemaCount} schemas and ${review.attachmentCount} attachments. ${review.blocked.map(({ assistance }) => assistance).join(". ")}.`
                : `${review.schemaCount} schemas and ${review.attachmentCount} attachments: ${changes || "no pinned revisions"}. No changes occur before confirmation.`;
        if (ports.elements.confirmSync)
            ports.elements.confirmSync.disabled = !review.ready;
        ports.elements.syncReview?.showModal();
        (review.ready ? ports.elements.confirmSync : ports.elements.cancelSync)?.focus();
        return true;
    }
    confirmSync() {
        const pending = this.pendingSync, ports = this.#behavior;
        if (!pending || !ports)
            return;
        const rule = this.stored(pending.rule.id);
        if (!rule)
            throw new Error("The reusable rule was removed after review");
        const review = reviewReusableRuleSync(ports.schemas(), rule);
        if (JSON.stringify(review) !== JSON.stringify(pending.review))
            throw new Error("The attached schemas changed after review");
        ports.replaceSchemas(publishReusableRuleSync(ports.schemas(), rule, review));
        this.pendingSync = undefined;
        ports.persistLibrary();
        ports.renderAll();
        ports.elements.syncReview?.close();
    }
    cancelSync() { this.pendingSync = undefined; this.#behavior?.elements.syncReview?.close(); }
    requestDeletion(id) {
        const rule = this.stored(id), ports = this.#behavior;
        if (!rule || !ports)
            return false;
        const attached = ports.schemas().filter((schema) => rule.attachments?.includes(schema.id) || schema.attachedRules?.some((item) => item.id === id) || JSON.stringify(schema.document).includes(id));
        if (attached.length) {
            if (ports.elements.result)
                ports.elements.result.textContent = `Cannot delete ${rule.name}: attached to ${attached.map(({ name }) => name).join(", ")}.`;
            return false;
        }
        this.pendingDeletionId = id;
        if (ports.elements.deleteSummary)
            ports.elements.deleteSummary.textContent = `${rule.name} v${rule.version} will be removed.`;
        ports.elements.deleteReview?.showModal();
        ports.elements.confirmDelete?.focus();
        return true;
    }
    confirmDeletion() {
        if (!this.pendingDeletionId || !this.#behavior)
            return;
        this.rules = this.rules.filter(({ id }) => id !== this.pendingDeletionId);
        this.pendingDeletionId = undefined;
        this.#behavior.persistRules();
        this.render();
        this.#behavior.elements.deleteReview?.close();
    }
    cancelDeletion() { this.pendingDeletionId = undefined; this.#behavior?.elements.deleteReview?.close(); }
    exportRules() {
        const blob = new Blob([`${JSON.stringify(this.rules, null, 2)}\n`], { type: "application/json" }), url = URL.createObjectURL(blob), link = this.#behavior?.elements.document?.createElement("a");
        if (link) {
            link.href = url;
            link.download = "schema-rules.json";
            link.click();
        }
        URL.revokeObjectURL(url);
    }
    listenRow(target, type, listener) {
        target.addEventListener(type, listener);
        this.#rowDisposers.push(() => target.removeEventListener(type, listener));
    }
    listenPicker(target, type, listener) {
        target.addEventListener(type, listener);
        this.#pickerDisposers.push(() => target.removeEventListener(type, listener));
    }
    ownRow(dispose) { this.#rowDisposers.push(dispose); }
    ownPicker(...disposers) { this.#pickerDisposers.push(...disposers); }
    clearRows() { for (const dispose of this.#rowDisposers.splice(0))
        dispose(); }
    clearPicker() { for (const dispose of this.#pickerDisposers.splice(0))
        dispose(); }
    dispose() {
        this.pickerPath = undefined;
        this.pickerTrigger = undefined;
        this.configuration = undefined;
        this.editingAttached = undefined;
        this.pendingRevision = undefined;
        this.pendingUpgrade = undefined;
        this.pendingSync = undefined;
        this.pendingDeletionId = undefined;
        this.editingReusableId = undefined;
        this.approvedRevisionId = undefined;
        this.approvedAttachmentUpdateId = undefined;
        this.pendingSnapshot = undefined;
        this.pendingPromotion = undefined;
        this.promotionFocusReturn = undefined;
        this.promotionFocusedPosition = undefined;
        this.clearRows();
        this.clearPicker();
    }
    #required() { if (!this.#behavior)
        throw new Error("Schema rule behavior is not configured"); return this.#behavior; }
}
//# sourceMappingURL=rule-controller.js.map