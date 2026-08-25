import {
  SCHEMA_LIBRARY_STORAGE_KEY,
  discardSchemaWorkingDraft,
  publishSchemaWorkingDraft,
  restoreSchemaLibrary,
  serializeSchemaLibrary,
  updateSchemaWorkingDraft,
  validateEvent,
  type SchemaDefinition,
  type SchemaWorkingDraft,
} from "../../utilities/data-layer/schemas.js";

export interface SchemasInstalledPorts {
  storage: Pick<Storage, "getItem" | "setItem">;
  changed(schemas: readonly SchemaDefinition[]): void;
  runGuidedValidation(schemaId?: string): Promise<void>;
}

export function createSchemasInstalledController(ports: SchemasInstalledPorts) {
  let mounted = false;
  let schemas = restoreSchemaLibrary(ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY));
  let activeSchemaId: string | undefined;
  const activeIndex = (): number => schemas.findIndex(({ id }) => id === activeSchemaId);
  const active = (): SchemaDefinition => {
    const schema = schemas[activeIndex()];
    if (!schema) throw new Error("Open a schema before editing its draft");
    return schema;
  };
  const persist = (): void => {
    ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(schemas));
    ports.changed(schemas);
  };
  const replaceActive = (schema: SchemaDefinition): void => {
    const index = activeIndex(); if (index < 0) throw new Error("Open a schema before editing its draft");
    schemas = schemas.map((candidate, candidateIndex) => candidateIndex === index ? schema : candidate);
  };
  return {
    mount(): void { mounted = true; },
    dispose(): void { mounted = false; },
    open(id: string): void {
      if (!schemas.some((schema) => schema.id === id)) throw new Error(`Unknown schema ${id}`);
      activeSchemaId = id;
    },
    beginDraft(): void { replaceActive(updateSchemaWorkingDraft(active(), {})); persist(); },
    updateDraft(changes: Partial<Pick<SchemaWorkingDraft, "name" | "document" | "assignments" | "attachedRules" | "parentSchemaId" | "inheritedRuleOverrides" | "documentation" | "canonicalSchema">>, change?: string): void {
      replaceActive(updateSchemaWorkingDraft(active(), changes, change)); persist();
    },
    publish(): SchemaDefinition { const published = publishSchemaWorkingDraft(active()); replaceActive(published); persist(); return structuredClone(published); },
    discard(): void { replaceActive(discardSchemaWorkingDraft(active())); persist(); },
    add(schema: SchemaDefinition): void { schemas = [...schemas, structuredClone(schema)]; activeSchemaId = schema.id; persist(); },
    replace(next: readonly SchemaDefinition[]): void { schemas = structuredClone([...next]); if (!schemas.some(({ id }) => id === activeSchemaId)) activeSchemaId = undefined; persist(); },
    validate:(event: Parameters<typeof validateEvent>[0]) => validateEvent(event, schemas),
    runGuidedValidation:() => ports.runGuidedValidation(activeSchemaId),
    schemas:(): readonly SchemaDefinition[] => structuredClone(schemas),
    state:() => ({ ...(activeSchemaId ? { activeSchemaId } : {}), draftDirty:Boolean(activeSchemaId && active().workingDraft),
      schemaCount:schemas.length, mounted }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"schemas",
  capabilities:["schema and rule libraries", "drafts", "assignments", "validation", "guided validation"],
});
