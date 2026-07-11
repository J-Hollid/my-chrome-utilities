import type { EditableEventTemplate } from "./data-layer-event-library-editor.js";

export const eventLibraryFormat = "my-chrome-utilities.event-library";
export const eventLibraryFormatVersion = 1;

export interface EventLibraryExport {
  format: typeof eventLibraryFormat;
  version: typeof eventLibraryFormatVersion;
  templates: readonly EditableEventTemplate[];
}

export function eventLibraryExport(
  templates: readonly EditableEventTemplate[],
): EventLibraryExport {
  return { format: eventLibraryFormat, version: eventLibraryFormatVersion, templates: structuredClone(templates) };
}

function isTemplate(value: unknown): value is EditableEventTemplate {
  if (!value || typeof value !== "object") return false;
  const template = value as Partial<EditableEventTemplate>;
  return typeof template.id === "string"
    && typeof template.name === "string"
    && typeof template.eventName === "string"
    && typeof template.sourceId === "string"
    && typeof template.sourceName === "string"
    && typeof template.destination === "string"
    && typeof template.version === "number"
    && Array.isArray(template.tags)
    && "payload" in template
    && typeof template.provenance === "string"
    && (!template.revisionHistory || Array.isArray(template.revisionHistory));
}

export function eventLibraryImport(serialized: string): EventLibraryExport {
  let value: unknown;
  try { value = JSON.parse(serialized); } catch { throw new Error("Select a valid Library JSON file"); }
  if (!value || typeof value !== "object") throw new Error("Select a valid Library JSON file");
  const parsed = value as Partial<EventLibraryExport>;
  if (parsed.format !== eventLibraryFormat || parsed.version !== eventLibraryFormatVersion) {
    throw new Error("Export with a supported Library version");
  }
  if (!Array.isArray(parsed.templates) || !parsed.templates.every(isTemplate)) {
    throw new Error("The import is missing required template data");
  }
  if (parsed.templates.some((template) => template.revisionHistory?.some((revision) => !isTemplate(revision)))) {
    throw new Error("Correct the imported revision history");
  }
  return { format: eventLibraryFormat, version: eventLibraryFormatVersion, templates: Array.from(structuredClone(parsed.templates)) };
}

export function replaceImportedTemplates(
  _current: readonly EditableEventTemplate[],
  imported: readonly EditableEventTemplate[],
): EditableEventTemplate[] {
  return Array.from(structuredClone(imported));
}

export function appendImportedTemplates(
  current: readonly EditableEventTemplate[],
  imported: readonly EditableEventTemplate[],
  nextId: () => string,
): { templates: EditableEventTemplate[]; remapped: number } {
  const ids = new Set(current.map(({ id }) => id));
  let remapped = 0;
  const additions = imported.map((template) => {
    if (!ids.has(template.id)) { ids.add(template.id); return structuredClone(template); }
    const id = nextId();
    ids.add(id); remapped += 1;
    return { ...structuredClone(template), id, provenance: `${template.provenance}; imported:${template.id}->${id}` };
  });
  return { templates: [...structuredClone(current), ...additions], remapped };
}
