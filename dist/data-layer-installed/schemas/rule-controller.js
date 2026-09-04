import { normalizeAllowedValuesRuleLibraryEntry } from "../../data-layer-allowed-values-rule.js";
import { configuredRuleDetails, applicablePropertyTypesForRule, schemaPropertyRows, typedComparisonValue, updateSchemaWorkingDraft, } from "../../utilities/data-layer/schemas.js";
import { SchemaRuleAttachmentWorkflow } from "./rule-attachment-workflow.js";
import { SchemaRulePromotionWorkflow } from "./rule-promotion-workflow.js";
export const SCHEMA_RULE_STORAGE_KEY = "my-chrome-utilities.schema-rule-library.v1";
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
    pendingSnapshot;
    pendingRevision;
    pendingDeletionId;
    attachmentWorkflow;
    promotionWorkflow;
    #rowDisposers = [];
    #pickerDisposers = [];
    constructor(storage, behavior) {
        this.#storage = storage;
        this.#behavior = behavior;
        this.attachmentWorkflow = new SchemaRuleAttachmentWorkflow({ behavior: () => this.#required(), stored: (id) => this.stored(id) });
        this.promotionWorkflow = new SchemaRulePromotionWorkflow({ behavior: () => this.#required(), rules: () => this.rules, replaceRules: (rules) => { this.rules = structuredClone([...rules]); }, persist: () => this.persist(), render: () => this.render() });
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
    get pendingPromotion() { return this.promotionWorkflow.pending; }
    get promotionFocusReturn() { return this.promotionWorkflow.focusReturn; }
    get promotionFocusedPosition() { return this.promotionWorkflow.focusedPosition; }
    set promotionFocusedPosition(value) { this.promotionWorkflow.focusedPosition = value; }
    get promotionGeneration() { return this.promotionWorkflow.generation; }
    restorePromotion(ruleId, rerender = true) { this.promotionWorkflow.restore(ruleId, rerender); }
    openPromotion(propertyPath, sourceRuleId) { return this.promotionWorkflow.open(propertyPath, sourceRuleId); }
    render() {
        this.#behavior?.presentation.render();
    }
    openNewEditor() {
        const ports = this.#behavior;
        if (!ports)
            return;
        if (!this.editingReusableId)
            this.pendingSnapshot = undefined;
        ports.presentation.openEditor();
    }
    beginNew() { this.editingReusableId = undefined; this.approvedRevisionId = undefined; this.pendingSnapshot = undefined; this.openNewEditor(); }
    edit(id) {
        const rule = this.stored(id);
        if (!rule || !this.#behavior)
            return false;
        this.editingReusableId = id;
        this.openNewEditor();
        this.#behavior.presentation.populate(rule);
        return true;
    }
    syncReview(rule) { return this.attachmentWorkflow.review(rule); }
    duplicate(id) { const rule = this.stored(id), ports = this.#behavior; if (!rule || !ports)
        return; this.rules = [...this.rules, { ...structuredClone(rule), id: ports.createId(), name: `${rule.name} copy`, version: 1, attachments: [] }]; ports.persistRules(); this.render(); }
    toggle(id) { const ports = this.#behavior; if (!ports)
        return; this.rules = this.rules.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule); ports.persistRules(); this.render(); }
    exportRule(id) { const rule = this.stored(id), ports = this.#behavior; if (rule && ports)
        ports.download(rule, `${rule.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-v${rule.version}.json`); }
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
        ports.presentation.close("editor");
    }
    captureSnapshot() {
        const previous = this.editingReusableId ? this.stored(this.editingReusableId) : undefined;
        if (previous)
            this.pendingSnapshot = { id: previous.id, version: previous.version, attachments: [...(previous.attachments ?? [])] };
    }
    updateAttachmentPreview() { this.#behavior?.presentation.updateAttachmentPreview(); }
    requestRevision(id, changes) {
        const previous = this.stored(id);
        if (!previous || !this.#behavior)
            return false;
        this.pendingRevision = { id, changes: structuredClone(changes) };
        this.approvedRevisionId = undefined;
        this.#behavior.presentation.showRevision(previous, changes);
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
            ports.presentation.close("editor");
        }
        this.pendingRevision = undefined;
        ports.persistRules();
        this.render();
        ports.presentation.close("revision");
    }
    cancelRevision() { this.pendingRevision = undefined; this.#behavior?.presentation.close("revision"); }
    get pendingUpgrade() { return this.attachmentWorkflow.pendingUpgrade; }
    get pendingSync() { return this.attachmentWorkflow.pendingSync; }
    get approvedAttachmentUpdateId() { return this.attachmentWorkflow.approvedAttachmentUpdateId; }
    requestUpgrade(id, schemaIds) { return this.attachmentWorkflow.requestUpgrade(id, schemaIds); }
    confirmUpgrade() { this.attachmentWorkflow.confirmUpgrade(); }
    cancelUpgrade() { this.attachmentWorkflow.cancelUpgrade(); }
    requestSync(id) { return this.attachmentWorkflow.requestSync(id); }
    confirmSync() { this.attachmentWorkflow.confirmSync(); }
    cancelSync() { this.attachmentWorkflow.cancelSync(); }
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
        ports.presentation.showDeletion(rule);
        return true;
    }
    confirmDeletion() {
        if (!this.pendingDeletionId || !this.#behavior)
            return;
        this.rules = this.rules.filter(({ id }) => id !== this.pendingDeletionId);
        this.pendingDeletionId = undefined;
        this.#behavior.persistRules();
        this.render();
        this.#behavior.presentation.close("delete");
    }
    cancelDeletion() { this.pendingDeletionId = undefined; this.#behavior?.presentation.close("delete"); }
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
        this.pendingDeletionId = undefined;
        this.editingReusableId = undefined;
        this.approvedRevisionId = undefined;
        this.pendingSnapshot = undefined;
        this.attachmentWorkflow.dispose();
        this.promotionWorkflow.dispose();
        this.clearRows();
        this.clearPicker();
    }
    #required() { if (!this.#behavior)
        throw new Error("Schema rule behavior is not configured"); return this.#behavior; }
}
//# sourceMappingURL=rule-controller.js.map