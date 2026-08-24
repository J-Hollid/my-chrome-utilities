export interface SchemasInstalledPorts {
  listSchemas(): readonly Readonly<Record<string, unknown>>[];
  persistDraft(): Promise<void>;
  validateCurrentSchema(): Promise<void>;
  runGuidedValidation(): Promise<void>;
}

export const installedControllerDefinition = Object.freeze({
  id:"schemas",
  capabilities:["authoring", "rules", "assignments", "validation", "guided validation"],
});
