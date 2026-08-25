import {
  EVENT_TEMPLATE_LIBRARY_STORAGE_KEY,
  appendImportedTemplates,
  beginTemplateRename,
  clearEventLibrary,
  createNewEventEditor,
  deleteEventTemplate,
  discardDraft,
  eventLibraryExport,
  eventLibraryImport,
  openPropertyEditor,
  replaceImportedTemplates,
  restoreEventTemplateLibrary,
  saveAsTemplateCopy,
  saveDraftRevision,
  saveNewEvent,
  saveTemplateRename,
  serializeEventTemplateLibrary,
  type EditableEventTemplate,
  type PropertyEditorState,
  type TemplateRenameDraft,
} from "../../utilities/data-layer/event-library.js";

export interface EventLibraryInstalledPorts {
  storage: Pick<Storage, "getItem" | "setItem">;
  defaultPushPath(): string;
  push(template: EditableEventTemplate): Promise<void>;
  changed(): void;
  createId?(): string;
}

export interface EventLibraryInstalledState {
  selectedId?: string;
  editor?: PropertyEditorState;
  rename?: { templateId: string; draft: TemplateRenameDraft };
  pendingImport?: ReturnType<typeof eventLibraryImport>;
  pendingDeletion?: { id?: string; name?: string; count: number };
  replaceArmed: boolean;
  templates: readonly EditableEventTemplate[];
}

export function createEventLibraryInstalledController(ports: EventLibraryInstalledPorts) {
  let mounted = false;
  let eventTemplates = restoreEventTemplateLibrary(ports.storage.getItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY));
  let selectedId: string | undefined;
  let propertyEditorState: PropertyEditorState | undefined;
  let pendingTemplateRename: EventLibraryInstalledState["rename"];
  let pendingEventLibraryImport: ReturnType<typeof eventLibraryImport> | undefined;
  let pendingEventLibraryDeletion: EventLibraryInstalledState["pendingDeletion"];
  let replaceEventLibraryArmed = false;
  const createId = ports.createId ?? (() => `template:${crypto.randomUUID()}`);
  const persistEventTemplateLibrary = (): void => {
    ports.storage.setItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, serializeEventTemplateLibrary(eventTemplates));
    ports.changed();
  };
  const find = (id: string): EditableEventTemplate => {
    const template = eventTemplates.find((candidate) => candidate.id === id);
    if (!template) throw new Error(`Unknown template ${id}`);
    return template;
  };
  const closeEditor = (): void => { propertyEditorState = undefined; pendingTemplateRename = undefined; };
  const reviewEventLibraryImport = (serialized: string): void => {
    pendingEventLibraryImport = eventLibraryImport(serialized); replaceEventLibraryArmed = false;
  };
  const commitEventLibraryImport = (mode: "replace" | "append"): void => {
    if (!pendingEventLibraryImport) throw new Error("Review an import before committing");
    if (mode === "replace") {
      if (!replaceEventLibraryArmed) { replaceEventLibraryArmed = true; return; }
      eventTemplates = replaceImportedTemplates(eventTemplates, pendingEventLibraryImport.templates);
    } else eventTemplates = appendImportedTemplates(eventTemplates, pendingEventLibraryImport.templates, createId).templates;
    pendingEventLibraryImport = undefined; replaceEventLibraryArmed = false; closeEditor(); persistEventTemplateLibrary();
  };
  const requestEventTemplateDeletion = (id?: string): void => {
    pendingEventLibraryDeletion = id ? { id, name:find(id).name, count:1 } : { count:eventTemplates.length };
  };
  const commitEventLibraryDeletion = (): void => {
    if (!pendingEventLibraryDeletion) return;
    eventTemplates = pendingEventLibraryDeletion.id
      ? deleteEventTemplate(eventTemplates, pendingEventLibraryDeletion.id) : clearEventLibrary(eventTemplates);
    if (!pendingEventLibraryDeletion.id || selectedId === pendingEventLibraryDeletion.id) selectedId = undefined;
    if (!pendingEventLibraryDeletion.id || propertyEditorState?.template.id === pendingEventLibraryDeletion.id) closeEditor();
    pendingEventLibraryDeletion = undefined; persistEventTemplateLibrary();
  };

  return {
    mount(): void { mounted = true; },
    dispose(): void { mounted = false; closeEditor(); pendingEventLibraryImport = undefined; pendingEventLibraryDeletion = undefined; replaceEventLibraryArmed = false; },
    select(id: string): void { find(id); selectedId = id; },
    beginDraft(id: string): void { const template = find(id); selectedId = id; propertyEditorState = openPropertyEditor(template); },
    beginNew(): void { selectedId = undefined; propertyEditorState = createNewEventEditor(ports.defaultPushPath()); },
    discardDraft(): void { if (propertyEditorState) propertyEditorState = discardDraft(propertyEditorState); },
    saveRevision(): EditableEventTemplate {
      if (!propertyEditorState) throw new Error("Open a template before saving a revision");
      propertyEditorState = saveDraftRevision(propertyEditorState);
      eventTemplates = eventTemplates.map((candidate) => candidate.id === propertyEditorState?.template.id ? propertyEditorState.template : candidate);
      persistEventTemplateLibrary(); return structuredClone(propertyEditorState.template);
    },
    saveNew(): EditableEventTemplate {
      if (!propertyEditorState?.isNew) throw new Error("Open a new event draft before saving");
      const saved = saveNewEvent(propertyEditorState, createId); eventTemplates = [...eventTemplates, saved];
      selectedId = saved.id; propertyEditorState = openPropertyEditor(saved); persistEventTemplateLibrary(); return structuredClone(saved);
    },
    saveCopy(name: string): EditableEventTemplate {
      if (!propertyEditorState) throw new Error("Open a template before saving a copy");
      const copy = { ...saveAsTemplateCopy(propertyEditorState, name), id:createId() };
      eventTemplates = [...eventTemplates, copy]; persistEventTemplateLibrary(); return structuredClone(copy);
    },
    beginRename(id: string): void { const template = find(id); pendingTemplateRename = { templateId:id, draft:beginTemplateRename(template) }; },
    commitRename(): void {
      if (!pendingTemplateRename) throw new Error("Open a rename review before saving");
      const templateId = pendingTemplateRename.templateId;
      const renamed = saveTemplateRename(
        propertyEditorState?.template.id === templateId ? propertyEditorState : openPropertyEditor(find(templateId)),
        pendingTemplateRename.draft,
      );
      eventTemplates = eventTemplates.map((template) => template.id === templateId ? renamed.template : template);
      if (propertyEditorState?.template.id === templateId) propertyEditorState = renamed;
      pendingTemplateRename = undefined; persistEventTemplateLibrary();
    },
    reviewImport:reviewEventLibraryImport,
    armReplaceImport(): void { if (!pendingEventLibraryImport) throw new Error("Review an import before replacing"); replaceEventLibraryArmed = true; },
    commitImport:commitEventLibraryImport,
    requestDelete:requestEventTemplateDeletion,
    confirmDelete:commitEventLibraryDeletion,
    cancelDelete(): void { pendingEventLibraryDeletion = undefined; },
    async pushSelected(): Promise<void> { if (!selectedId) throw new Error("Select a template before pushing"); await ports.push(find(selectedId)); },
    export:() => eventLibraryExport(eventTemplates),
    templates:(): readonly EditableEventTemplate[] => structuredClone(eventTemplates),
    state:(): EventLibraryInstalledState => structuredClone({ ...(selectedId ? { selectedId } : {}),
      ...(propertyEditorState ? { editor:propertyEditorState } : {}), ...(pendingTemplateRename ? { rename:pendingTemplateRename } : {}),
      ...(pendingEventLibraryImport ? { pendingImport:pendingEventLibraryImport } : {}),
      ...(pendingEventLibraryDeletion ? { pendingDeletion:pendingEventLibraryDeletion } : {}),
      replaceArmed:replaceEventLibraryArmed, templates:eventTemplates }),
    mounted:() => mounted,
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"event-library",
  capabilities:["templates", "editor and rename", "import and deletion review", "push"],
});
