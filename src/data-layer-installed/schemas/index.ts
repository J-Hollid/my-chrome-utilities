export interface SchemasInstalledPorts {
  loadSchemas(): readonly Readonly<{ id: string; name: string }>[];
  persistDraft(): Promise<void>;
  validateCurrentSchema(): Promise<void>;
  runGuidedValidation(): Promise<void>;
}

export function createSchemasInstalledController(ports: SchemasInstalledPorts) {
  let mounted = false;
  const schemas = ports.loadSchemas().map((schema) => ({ ...schema }));
  let activeSchemaId: string | undefined;
  let draftDirty = false;
  return {
    mount(): void { mounted = true; },
    dispose(): void { mounted = false; },
    open(id: string): void {
      if (!schemas.some((schema) => schema.id === id)) throw new Error(`Unknown schema ${id}`);
      activeSchemaId = id;
      draftDirty = false;
    },
    markDraftDirty(): void {
      if (!activeSchemaId) throw new Error("Open a schema before editing its draft");
      draftDirty = true;
    },
    async persist(): Promise<void> { await ports.persistDraft(); draftDirty = false; },
    validate:ports.validateCurrentSchema,
    runGuidedValidation:ports.runGuidedValidation,
    state:() => ({ ...(activeSchemaId ? { activeSchemaId } : {}), draftDirty,
      schemaCount:schemas.length }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"schemas",
  capabilities:["authoring", "rules", "assignments", "validation", "guided validation"],
});
