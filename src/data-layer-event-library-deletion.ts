import type { EditableEventTemplate } from "./data-layer-event-library-editor.js";

export function deleteEventTemplate(
  templates: readonly EditableEventTemplate[],
  id: string,
): EditableEventTemplate[] {
  return templates.filter((template) => template.id !== id);
}

export function clearEventLibrary(
  _templates: readonly EditableEventTemplate[],
): EditableEventTemplate[] {
  return [];
}
