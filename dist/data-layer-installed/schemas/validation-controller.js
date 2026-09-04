export const MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY = "my-chrome-utilities.manual-schema-overrides.v1";
export const SCHEMA_VALIDATION_RECORD_STORAGE_KEY = "my-chrome-utilities.schema-validation-records.v1";
export class SchemaValidationController {
    #storage;
    records;
    manualOverrides;
    #rowDisposers = [];
    #dialogDisposers = [];
    constructor(storage) {
        this.#storage = storage;
        try {
            const parsed = JSON.parse(storage.getItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY) ?? "{}");
            this.manualOverrides = parsed && typeof parsed === "object" ? parsed : {};
        }
        catch {
            this.manualOverrides = {};
        }
        try {
            const parsed = JSON.parse(storage.getItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY) ?? "[]");
            this.records = Array.isArray(parsed) ? parsed : [];
        }
        catch {
            this.records = [];
        }
    }
    replaceRecords(records) {
        this.records = structuredClone([...records]).slice(-50);
        this.#storage.setItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY, JSON.stringify(this.records));
    }
    addRecord(record) { this.replaceRecords([...this.records, record]); }
    setManualOverride(eventId, schemaId) {
        if (schemaId)
            this.manualOverrides[eventId] = schemaId;
        else
            delete this.manualOverrides[eventId];
        this.#storage.setItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY, JSON.stringify(this.manualOverrides));
    }
    ownRow(dispose) { this.#rowDisposers.push(dispose); }
    ownDialog(...disposers) { this.#dialogDisposers.push(...disposers); }
    clearRows() { for (const dispose of this.#rowDisposers.splice(0))
        dispose(); }
    clearDialog() { for (const dispose of this.#dialogDisposers.splice(0))
        dispose(); }
    dispose() { this.clearRows(); this.clearDialog(); }
}
//# sourceMappingURL=validation-controller.js.map