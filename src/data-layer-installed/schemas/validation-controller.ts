import type { SchemaValidationRecord } from "./index.js";

export const MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY = "my-chrome-utilities.manual-schema-overrides.v1";
export const SCHEMA_VALIDATION_RECORD_STORAGE_KEY = "my-chrome-utilities.schema-validation-records.v1";

export class SchemaValidationController {
  readonly #storage:Pick<Storage, "getItem" | "setItem">;
  records:SchemaValidationRecord[];
  manualOverrides:Record<string, string>;
  readonly #rowDisposers:Array<() => void> = [];
  readonly #dialogDisposers:Array<() => void> = [];

  constructor(storage:Pick<Storage, "getItem" | "setItem">) {
    this.#storage = storage;
    try {
      const parsed = JSON.parse(storage.getItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY) ?? "{}");
      this.manualOverrides = parsed && typeof parsed === "object" ? parsed : {};
    } catch { this.manualOverrides = {}; }
    try {
      const parsed = JSON.parse(storage.getItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY) ?? "[]");
      this.records = Array.isArray(parsed) ? parsed : [];
    } catch { this.records = []; }
  }
  replaceRecords(records:readonly SchemaValidationRecord[]):void {
    this.records = structuredClone([...records]).slice(-50);
    this.#storage.setItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY, JSON.stringify(this.records));
  }
  addRecord(record:SchemaValidationRecord):void { this.replaceRecords([...this.records, record]); }
  setManualOverride(eventId:string, schemaId?:string):void {
    if (schemaId) this.manualOverrides[eventId] = schemaId; else delete this.manualOverrides[eventId];
    this.#storage.setItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY, JSON.stringify(this.manualOverrides));
  }
  ownRow(dispose:()=>void):void { this.#rowDisposers.push(dispose); }
  ownDialog(...disposers:Array<() => void>):void { this.#dialogDisposers.push(...disposers); }
  clearRows():void { for (const dispose of this.#rowDisposers.splice(0)) dispose(); }
  clearDialog():void { for (const dispose of this.#dialogDisposers.splice(0)) dispose(); }
  dispose():void { this.clearRows(); this.clearDialog(); }
}

