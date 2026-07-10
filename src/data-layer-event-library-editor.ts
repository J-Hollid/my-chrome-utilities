import type { SourceAdapter, SourceEvent, ValidationState } from "./data-layer-source.js";

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface EditableEventTemplate {
  id: string;
  name: string;
  eventName: string;
  sourceId: string;
  sourceName: string;
  destination: string;
  tags: readonly string[];
  schemaId?: string;
  validation: ValidationState;
  payload: JsonValue;
  version: number;
  originatingSessionId: string;
  originatingEventId: string;
  provenance: string;
}

export interface PropertyEditorState {
  template: EditableEventTemplate;
  revisions: readonly EditableEventTemplate[];
  draft: JsonValue;
  jsonDraft: string;
  jsonError?: string;
  dirty: boolean;
}

export interface PushExecutionRecord {
  templateId: string;
  templateVersion: number;
  activePage: string;
  adapterId: string;
  destination: string;
  payload: JsonValue;
  success: boolean;
  result: string;
}

export const EVENT_TEMPLATE_LIBRARY_STORAGE_KEY = "my-chrome-utilities.event-template-library.v1";

function clone<T>(value: T): T { return structuredClone(value); }

function json(value: JsonValue): string { return JSON.stringify(value, null, 2); }

function pointerSegments(path: string): string[] {
  return path.replace(/^\/?/, "").split("/").filter(Boolean)
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

function parentAt(root: JsonValue, path: string): [Record<string, JsonValue> | JsonValue[], string] {
  const segments = pointerSegments(path);
  if (segments.length === 0) throw new Error("A property path is required.");
  let current: JsonValue = root;
  for (const segment of segments.slice(0, -1)) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || current[index] === undefined) throw new Error(`Unknown property path: ${path}`);
      current = current[index];
    } else if (current && typeof current === "object" && current[segment] !== undefined) {
      current = current[segment];
    } else {
      throw new Error(`Unknown property path: ${path}`);
    }
  }
  if (!Array.isArray(current) && (!current || typeof current !== "object")) throw new Error(`Property path is not expandable: ${path}`);
  return [current, segments.at(-1) as string];
}

function withDraft(state: PropertyEditorState, draft: JsonValue, error?: string): PropertyEditorState {
  return {
    ...state,
    draft: clone(draft),
    jsonDraft: json(draft),
    ...(error ? { jsonError: error } : {}),
    dirty: true,
  };
}

export function createEditableTemplate(
  event: SourceEvent,
  options: { name: string; destination: string; sourceName: string; tags?: readonly string[]; schemaId?: string },
): EditableEventTemplate {
  return {
    id: `template:${event.id}`,
    name: options.name,
    eventName: event.name,
    sourceId: event.sourceId,
    sourceName: options.sourceName,
    destination: options.destination,
    tags: [...(options.tags ?? [])],
    ...(options.schemaId ? { schemaId: options.schemaId } : {}),
    validation: event.validation,
    payload: clone(event.payload) as JsonValue,
    version: 1,
    originatingSessionId: event.sessionId,
    originatingEventId: event.id,
    provenance: `template:${event.provenance}`,
  };
}

export function openPropertyEditor(template: EditableEventTemplate): PropertyEditorState {
  const draft = clone(template.payload);
  return { template: clone(template), revisions: [], draft, jsonDraft: json(draft), dirty: false };
}

export function updateDraftJson(state: PropertyEditorState, source: string): PropertyEditorState {
  try {
    const draft = JSON.parse(source) as JsonValue;
    return { ...state, draft, jsonDraft: json(draft), dirty: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    const position = message.match(/position (\d+)/)?.[1];
    return { ...state, jsonDraft: source, jsonError: `Invalid JSON${position ? ` at position ${position}` : ""}.`, dirty: true };
  }
}

export function setDraftProperty(state: PropertyEditorState, path: string, value: JsonValue): PropertyEditorState {
  const draft = clone(state.draft);
  const [parent, key] = parentAt(draft, path);
  if (Array.isArray(parent)) parent[Number(key)] = clone(value);
  else parent[key] = clone(value);
  return withDraft(state, draft);
}

export function removeDraftProperty(state: PropertyEditorState, path: string): PropertyEditorState {
  const draft = clone(state.draft);
  const [parent, key] = parentAt(draft, path);
  if (Array.isArray(parent)) parent.splice(Number(key), 1);
  else delete parent[key];
  return withDraft(state, draft);
}

export function saveDraftRevision(state: PropertyEditorState): PropertyEditorState {
  if (state.jsonError) throw new Error(state.jsonError);
  const template: EditableEventTemplate = { ...state.template, payload: clone(state.draft), version: state.template.version + 1 };
  return { template, revisions: [...state.revisions, clone(state.template)], draft: clone(template.payload), jsonDraft: json(template.payload), dirty: false };
}

export function saveAsTemplateCopy(state: PropertyEditorState, name: string): EditableEventTemplate {
  if (state.jsonError) throw new Error(state.jsonError);
  return { ...state.template, id: `${state.template.id}:copy`, name, payload: clone(state.draft) };
}

export function searchEventTemplates(templates: readonly EditableEventTemplate[], query: string): EditableEventTemplate[] {
  const needle = query.trim().toLowerCase();
  return templates.filter((template) => [template.name, template.eventName, template.sourceName, template.destination,
    template.tags.join(" "), template.schemaId ?? "", JSON.stringify(template.payload)].join(" ").toLowerCase().includes(needle));
}

export function serializeEventTemplateLibrary(templates: readonly EditableEventTemplate[]): string {
  return JSON.stringify(templates);
}

export function restoreEventTemplateLibrary(serialized: string | null): EditableEventTemplate[] {
  if (!serialized) return [];
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is EditableEventTemplate => !!item && typeof item === "object"
      && typeof (item as Partial<EditableEventTemplate>).id === "string"
      && typeof (item as Partial<EditableEventTemplate>).name === "string"
      && typeof (item as Partial<EditableEventTemplate>).version === "number")
      .map((item) => clone(item));
  } catch {
    return [];
  }
}

export function canPushTemplate(template: EditableEventTemplate, adapter: SourceAdapter | undefined): boolean {
  return !!adapter && adapter.enabled && adapter.status === "Connected" && adapter.destination === template.destination && adapter.capabilities.includes("push");
}

export function executeDraftPush(
  state: PropertyEditorState,
  adapter: SourceAdapter | undefined,
  activePage: string,
  push: (destination: string, payload: JsonValue) => void,
): PushExecutionRecord {
  if (state.jsonError) throw new Error(state.jsonError);
  if (!canPushTemplate(state.template, adapter)) {
    return { templateId: state.template.id, templateVersion: state.template.version, activePage, adapterId: adapter?.id ?? "unavailable", destination: state.template.destination, payload: clone(state.draft), success: false, result: "Push unavailable for this adapter and destination." };
  }
  const enabledAdapter = adapter as SourceAdapter;
  try {
    push(state.template.destination, clone(state.draft));
    return { templateId: state.template.id, templateVersion: state.template.version, activePage, adapterId: enabledAdapter.id, destination: state.template.destination, payload: clone(state.draft), success: true, result: "Pushed" };
  } catch (error) {
    return { templateId: state.template.id, templateVersion: state.template.version, activePage, adapterId: enabledAdapter.id, destination: state.template.destination, payload: clone(state.draft), success: false, result: error instanceof Error ? error.message : "Push failed" };
  }
}

export function leaveEditorOptions(state: PropertyEditorState): readonly ("keep editing" | "discard draft" | "save")[] {
  return state.dirty ? ["keep editing", "discard draft", "save"] : ["keep editing"];
}

export function discardDraft(state: PropertyEditorState): PropertyEditorState { return openPropertyEditor(state.template); }
