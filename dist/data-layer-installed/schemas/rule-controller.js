import { normalizeAllowedValuesRuleLibraryEntry } from "../../data-layer-allowed-values-rule.js";
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
    #rowDisposers = [];
    #pickerDisposers = [];
    constructor(storage) {
        this.#storage = storage;
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
}
//# sourceMappingURL=rule-controller.js.map