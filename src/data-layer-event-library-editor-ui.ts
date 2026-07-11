import type {
  EditableEventTemplate,
  PropertyEditorState,
} from "./data-layer-event-library-editor.js";
import { newEventValidation, templateIdentityValidation } from "./data-layer-event-library-editor.js";
import { templateActionHierarchy } from "./side-panel-action-hierarchy.js";
import { applyActionTreatment } from "./side-panel-action-hierarchy-ui.js";

export interface EventLibraryEditorElements {
  search: HTMLInputElement | null;
  addNewButton: HTMLButtonElement | null;
  count: HTMLElement | null;
  list: HTMLElement | null;
  propertyEditor: HTMLElement | null;
  editorTitle: HTMLElement | null;
  templateName: HTMLInputElement | null;
  eventName: HTMLInputElement | null;
  source: HTMLSelectElement | null;
  editorSummary: HTMLElement | null;
  revisionHistory: HTMLElement | null;
  properties: HTMLElement | null;
  json: HTMLTextAreaElement | null;
  pushDestination: HTMLInputElement | null;
  validation: HTMLElement | null;
  saveRevisionButton: HTMLButtonElement | null;
  saveCopyButton: HTMLButtonElement | null;
  pushDraftButton: HTMLButtonElement | null;
  discardDraftButton: HTMLButtonElement | null;
  closeEditorButton: HTMLButtonElement | null;
  backToCapturedEventButton: HTMLButtonElement | null;
  result: HTMLElement | null;
}

export interface EventLibraryEditorActions {
  edit(template: EditableEventTemplate): void;
  rename(template: EditableEventTemplate): void;
  duplicate(template: EditableEventTemplate): void;
  push(template: EditableEventTemplate): void;
  delete(template: EditableEventTemplate): void;
}

export function findEventLibraryEditorElements(
  root: ParentNode = document,
): EventLibraryEditorElements {
  return {
    search: root.querySelector<HTMLInputElement>("#event-template-search"),
    addNewButton: root.querySelector<HTMLButtonElement>("#add-new-event"),
    count: root.querySelector<HTMLElement>("#event-template-count"),
    list: root.querySelector<HTMLElement>("#event-template-list"),
    propertyEditor: root.querySelector<HTMLElement>("#event-property-editor"),
    editorTitle: root.querySelector<HTMLElement>("#event-template-editor-title"),
    templateName: root.querySelector<HTMLInputElement>("#event-template-name"),
    eventName: root.querySelector<HTMLInputElement>("#event-template-event-name"),
    source: root.querySelector<HTMLSelectElement>("#event-template-source"),
    editorSummary: root.querySelector<HTMLElement>("#event-template-editor-summary"),
    revisionHistory: root.querySelector<HTMLElement>("#event-template-revision-history"),
    properties: root.querySelector<HTMLElement>("#event-template-properties"),
    json: root.querySelector<HTMLTextAreaElement>("#event-template-json"),
    pushDestination: root.querySelector<HTMLInputElement>("#push-destination-path"),
    validation: root.querySelector<HTMLElement>("#event-template-validation"),
    saveRevisionButton: root.querySelector<HTMLButtonElement>("#save-template-revision"),
    saveCopyButton: root.querySelector<HTMLButtonElement>("#save-template-copy"),
    pushDraftButton: root.querySelector<HTMLButtonElement>("#push-template-draft"),
    discardDraftButton: root.querySelector<HTMLButtonElement>("#discard-template-draft"),
    closeEditorButton: root.querySelector<HTMLButtonElement>("#close-template-editor"),
    backToCapturedEventButton: root.querySelector<HTMLButtonElement>("#back-to-captured-event"),
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
  variant: "secondary" | "quiet" | "destructive" = "secondary",
  templateId?: string,
  accessibleName?: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.actionVariant = variant;
  if (templateId) button.dataset.templateId = templateId;
  if (accessibleName) button.setAttribute("aria-label", accessibleName);
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
  if (elements.addNewButton) elements.addNewButton.hidden = Boolean(editor?.isNew);
  elements.list?.replaceChildren(
    ...templates.map((template) => {
      const item = document.createElement("li");
      item.className = "event-template-row";
      const identity = document.createElement("div");
      identity.className = "event-template-identity";
      identity.textContent = `${template.name} · ${template.eventName}`;
      const routing = document.createElement("div");
      routing.className = "event-template-routing";
      routing.textContent = `${template.sourceName} → ${template.destination}`;
      const attributes = document.createElement("dl");
      attributes.className = "event-template-attributes";
      const attributesToRender: ReadonlyArray<readonly [string, string]> = [
        ["Version", String(template.version)],
        ["Validation", template.validation],
        ["Schema", template.schemaId ?? "None"],
        ["Tags", template.tags.join(", ") || "none"],
      ];
      for (const [label, value] of attributesToRender) {
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        attributes.append(term, description);
      }
      const actionsRow = document.createElement("div");
      actionsRow.className = "event-template-actions";
      actionsRow.append(
        actionButton("Edit", () => actions.edit(template), "quiet", template.id),
        actionButton("Delete", () => actions.delete(template), "destructive", template.id, `Delete ${template.name}`),
        actionButton("Duplicate", () => actions.duplicate(template)),
        actionButton("Push", () => actions.push(template)),
      );
      item.append(identity, routing, attributes, actionsRow);
      return item;
    }),
  );
  if (elements.propertyEditor) elements.propertyEditor.hidden = !editor;
  if (elements.editorTitle && editor) elements.editorTitle.textContent = editor.isNew ? "New event" : `${editor.template.name} editor`;
  for (const field of [elements.templateName, elements.eventName]) if (field) field.disabled = !editor;
  if (elements.source) elements.source.disabled = !editor?.isNew;
  if (elements.templateName) elements.templateName.value = editor?.template.name ?? "";
  if (elements.eventName) elements.eventName.value = editor?.template.eventName ?? "";
  if (elements.source) elements.source.value = editor?.template.sourceId ?? "";
  const newErrors = editor?.isNew ? newEventValidation(editor) : (editor ? templateIdentityValidation(editor) : {});
  const validationFields: ReadonlyArray<readonly [HTMLInputElement | HTMLSelectElement | null, string | undefined]> = [
    [elements.templateName, newErrors.name],
    [elements.eventName, newErrors.eventName],
    [elements.source, editor?.isNew ? newEventValidation(editor).source : undefined],
  ];
  for (const [field, error] of validationFields) {
    if (!field) continue;
    field.setAttribute("aria-invalid", String(Boolean(error)));
    if (error) field.setAttribute("aria-describedby", "event-template-validation");
    else field.removeAttribute("aria-describedby");
  }
  if (elements.editorSummary) {
    elements.editorSummary.replaceChildren(...(editor ? [
      ["Template", editor.template.name], ["Version", String(editor.template.version)],
      ["Draft", editor.dirty ? "Unsaved changes" : "Saved"], ["Provenance", editor.template.provenance],
    ].flatMap(([label, value]) => { const term = document.createElement("dt"); const description = document.createElement("dd"); term.textContent = String(label); description.textContent = String(value); return [term, description]; }) : []));
  }
  elements.revisionHistory?.replaceChildren(...(editor
    ? editor.revisions.map((revision) => {
      const item = document.createElement("li");
      item.textContent = `Version ${revision.version}: ${revision.name} · ${revision.eventName}`;
      return item;
    })
    : []));
  const revisionSummary = elements.revisionHistory?.parentElement?.querySelector("summary");
  if (revisionSummary) revisionSummary.textContent = `Revision history (${editor ? editor.revisions.length + 1 : 0} saved revisions)`;
  const propertiesSummary = elements.properties?.parentElement?.querySelector("summary");
  if (propertiesSummary) propertiesSummary.textContent = `Properties (${editor ? "draft properties available" : "no draft properties"})`;
  if (elements.json) {
    elements.json.value = editor?.jsonDraft ?? "";
    const error = editor?.jsonError ?? "";
    elements.json.setCustomValidity(error);
    elements.json.setAttribute("aria-invalid", String(Boolean(error)));
  }
  if (elements.pushDestination && editor) {
    elements.pushDestination.value = editor.template.destination;
  }
  if (elements.validation) {
    const error = editor?.jsonError ?? Object.values(newErrors)[0];
    elements.validation.textContent = error ?? "Properties, JSON, and Validation edit the same draft.";
    elements.validation.setAttribute("aria-live", error ? "assertive" : "polite");
    elements.validation.setAttribute("role", error ? "alert" : "status");
  }
  elements.properties?.replaceChildren(
    ...(editor ? draftProperties(editor.draft) : []),
  );
  if (editor) {
    const hierarchy = templateActionHierarchy(editor);
    if (elements.saveRevisionButton) elements.saveRevisionButton.textContent = editor.isNew ? "Save new event" : "Save revision";
    const error = Object.values(newErrors)[0];
    applyActionTreatment(elements.saveRevisionButton, error
      ? { variant: "primary", disabled: true, disabledReason: error }
      : hierarchy.saveRevision, "save-template-revision-reason");
    applyActionTreatment(elements.pushDraftButton, error
      ? { variant: "secondary", disabled: true, disabledReason: error }
      : hierarchy.pushDraft, "push-template-draft-reason");
    applyActionTreatment(elements.discardDraftButton, hierarchy.discardDraft);
  }
}

export function focusTemplateEditAction(
  elements: EventLibraryEditorElements,
  templateId: string,
): void {
  const escaped = typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(templateId)
    : templateId.replace(/["\\]/g, "\\$&");
  elements.list?.querySelector<HTMLButtonElement>(
    `button[data-template-id="${escaped}"]`,
  )?.focus({ preventScroll: true });
}

export function focusTemplateRenameAction(
  elements: EventLibraryEditorElements,
  templateId: string,
): void {
  const escaped = typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(templateId)
    : templateId.replace(/["\\]/g, "\\$&");
  elements.list?.querySelector<HTMLButtonElement>(
    `button[data-template-id="${escaped}"][aria-label^="Rename "]`,
  )?.focus({ preventScroll: true });
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
  if (elements.validation) {
    const blocking = /invalid|correct|select|error|unavailable|must/i.test(message);
    elements.validation.setAttribute("aria-live", blocking ? "assertive" : "polite");
    elements.validation.setAttribute("role", blocking ? "alert" : "status");
    elements.validation.textContent = message;
  }
}

export function setPushDestinationValidation(
  elements: EventLibraryEditorElements,
  message: string,
): void {
  if (!elements.pushDestination) return;
  elements.pushDestination.setCustomValidity(message);
  elements.pushDestination.setAttribute("aria-invalid", String(Boolean(message)));
  if (message) elements.pushDestination.setAttribute("aria-describedby", "event-template-validation");
}
