import type {
  EditableEventTemplate,
  PropertyEditorState,
} from "./data-layer-event-library-editor.js";

export interface EventLibraryEditorElements {
  search: HTMLInputElement | null;
  saveLatestButton: HTMLButtonElement | null;
  count: HTMLElement | null;
  list: HTMLElement | null;
  propertyEditor: HTMLElement | null;
  properties: HTMLElement | null;
  json: HTMLTextAreaElement | null;
  validation: HTMLElement | null;
  saveRevisionButton: HTMLButtonElement | null;
  saveCopyButton: HTMLButtonElement | null;
  pushDraftButton: HTMLButtonElement | null;
  discardDraftButton: HTMLButtonElement | null;
  result: HTMLElement | null;
}

export interface EventLibraryEditorActions {
  edit(template: EditableEventTemplate): void;
  duplicate(template: EditableEventTemplate): void;
  push(template: EditableEventTemplate): void;
}

export function findEventLibraryEditorElements(
  root: ParentNode = document,
): EventLibraryEditorElements {
  return {
    search: root.querySelector<HTMLInputElement>("#event-template-search"),
    saveLatestButton: root.querySelector<HTMLButtonElement>("#save-latest-template"),
    count: root.querySelector<HTMLElement>("#event-template-count"),
    list: root.querySelector<HTMLElement>("#event-template-list"),
    propertyEditor: root.querySelector<HTMLElement>("#event-property-editor"),
    properties: root.querySelector<HTMLElement>("#event-template-properties"),
    json: root.querySelector<HTMLTextAreaElement>("#event-template-json"),
    validation: root.querySelector<HTMLElement>("#event-template-validation"),
    saveRevisionButton: root.querySelector<HTMLButtonElement>("#save-template-revision"),
    saveCopyButton: root.querySelector<HTMLButtonElement>("#save-template-copy"),
    pushDraftButton: root.querySelector<HTMLButtonElement>("#push-template-draft"),
    discardDraftButton: root.querySelector<HTMLButtonElement>("#discard-template-draft"),
    result: root.querySelector<HTMLElement>("#event-template-result"),
  };
}

function draftProperties(value: unknown, path = ""): HTMLLIElement[] {
  if (value === null || typeof value !== "object") {
    const item = document.createElement("li");
    item.textContent = `${path || "/"}: ${String(value)} (${typeof value})`;
    return [item];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    draftProperties(child, `${path}/${key}`),
  );
}

function actionButton(
  label: string,
  action: () => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

export function renderEventLibraryEditor(
  elements: EventLibraryEditorElements,
  templates: readonly EditableEventTemplate[],
  editor: PropertyEditorState | undefined,
  actions: EventLibraryEditorActions,
): void {
  if (elements.count) elements.count.textContent = `${templates.length} templates`;
  elements.list?.replaceChildren(
    ...templates.map((template) => {
      const item = document.createElement("li");
      item.textContent = `${template.name}: ${template.eventName}, ${template.sourceName}, ${template.destination}, ${template.tags.join(", ") || "no tags"}, ${template.schemaId ?? "no schema"}, ${template.validation}, v${template.version}. `;
      item.append(
        actionButton("Edit", () => actions.edit(template)),
        actionButton("Duplicate", () => actions.duplicate(template)),
        actionButton("Push", () => actions.push(template)),
      );
      return item;
    }),
  );
  if (elements.propertyEditor) elements.propertyEditor.hidden = !editor;
  if (elements.json && editor) elements.json.value = editor.jsonDraft;
  if (elements.validation) {
    elements.validation.textContent =
      editor?.jsonError ?? "Properties, JSON, and Validation edit the same draft.";
  }
  elements.properties?.replaceChildren(
    ...(editor ? draftProperties(editor.draft) : []),
  );
}

export function setEventLibraryResult(
  elements: EventLibraryEditorElements,
  message: string,
): void {
  if (elements.result) elements.result.textContent = message;
}

export function setEventLibraryValidation(
  elements: EventLibraryEditorElements,
  message: string,
): void {
  if (elements.validation) elements.validation.textContent = message;
}
