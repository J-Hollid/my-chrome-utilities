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
  let templates = restoreEventTemplateLibrary(ports.storage.getItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY));
  let selectedId: string | undefined;
  let editor: PropertyEditorState | undefined;
  let rename: EventLibraryInstalledState["rename"];
  let pendingImport: ReturnType<typeof eventLibraryImport> | undefined;
  let pendingDeletion: EventLibraryInstalledState["pendingDeletion"];
  let replaceArmed = false;
  const createId = ports.createId ?? (() => `template:${crypto.randomUUID()}`);
  const persist = (): void => {
    ports.storage.setItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, serializeEventTemplateLibrary(templates));
    ports.changed();
  };
  const find = (id: string): EditableEventTemplate => {
    const template = templates.find((candidate) => candidate.id === id);
    if (!template) throw new Error(`Unknown template ${id}`);
    return template;
  };
  const closeEditor = (): void => { editor = undefined; rename = undefined; };

  return {
    mount(): void { mounted = true; },
    dispose(): void { mounted = false; closeEditor(); pendingImport = undefined; pendingDeletion = undefined; replaceArmed = false; },
    select(id: string): void { find(id); selectedId = id; },
    beginDraft(id: string): void { const template = find(id); selectedId = id; editor = openPropertyEditor(template); },
    beginNew(): void { selectedId = undefined; editor = createNewEventEditor(ports.defaultPushPath()); },
    discardDraft(): void { if (editor) editor = discardDraft(editor); },
    saveRevision(): EditableEventTemplate {
      if (!editor) throw new Error("Open a template before saving a revision");
      editor = saveDraftRevision(editor);
      templates = templates.map((candidate) => candidate.id === editor?.template.id ? editor.template : candidate);
      persist(); return structuredClone(editor.template);
    },
    saveNew(): EditableEventTemplate {
      if (!editor?.isNew) throw new Error("Open a new event draft before saving");
      const saved = saveNewEvent(editor, createId); templates = [...templates, saved];
      selectedId = saved.id; editor = openPropertyEditor(saved); persist(); return structuredClone(saved);
    },
    saveCopy(name: string): EditableEventTemplate {
      if (!editor) throw new Error("Open a template before saving a copy");
      const copy = { ...saveAsTemplateCopy(editor, name), id:createId() };
      templates = [...templates, copy]; persist(); return structuredClone(copy);
    },
    beginRename(id: string): void { const template = find(id); rename = { templateId:id, draft:beginTemplateRename(template) }; },
    commitRename(): void {
      if (!rename) throw new Error("Open a rename review before saving");
      const templateId = rename.templateId;
      const renamed = saveTemplateRename(
        editor?.template.id === templateId ? editor : openPropertyEditor(find(templateId)),
        rename.draft,
      );
      templates = templates.map((template) => template.id === templateId ? renamed.template : template);
      if (editor?.template.id === templateId) editor = renamed;
      rename = undefined; persist();
    },
    reviewImport(serialized: string): void { pendingImport = eventLibraryImport(serialized); replaceArmed = false; },
    armReplaceImport(): void { if (!pendingImport) throw new Error("Review an import before replacing"); replaceArmed = true; },
    commitImport(mode: "replace" | "append"): void {
      if (!pendingImport) throw new Error("Review an import before committing");
      if (mode === "replace") {
        if (!replaceArmed) { replaceArmed = true; return; }
        templates = replaceImportedTemplates(templates, pendingImport.templates);
      } else templates = appendImportedTemplates(templates, pendingImport.templates, createId).templates;
      pendingImport = undefined; replaceArmed = false; closeEditor(); persist();
    },
    requestDelete(id?: string): void {
      pendingDeletion = id ? { id, name:find(id).name, count:1 } : { count:templates.length };
    },
    confirmDelete(): void {
      if (!pendingDeletion) return;
      templates = pendingDeletion.id ? deleteEventTemplate(templates, pendingDeletion.id) : clearEventLibrary(templates);
      if (!pendingDeletion.id || selectedId === pendingDeletion.id) selectedId = undefined;
      if (!pendingDeletion.id || editor?.template.id === pendingDeletion.id) closeEditor();
      pendingDeletion = undefined; persist();
    },
    cancelDelete(): void { pendingDeletion = undefined; },
    async pushSelected(): Promise<void> { if (!selectedId) throw new Error("Select a template before pushing"); await ports.push(find(selectedId)); },
    export:() => eventLibraryExport(templates),
    templates:(): readonly EditableEventTemplate[] => structuredClone(templates),
    state:(): EventLibraryInstalledState => structuredClone({ ...(selectedId ? { selectedId } : {}),
      ...(editor ? { editor } : {}), ...(rename ? { rename } : {}), ...(pendingImport ? { pendingImport } : {}),
      ...(pendingDeletion ? { pendingDeletion } : {}), replaceArmed, templates }),
    mounted:() => mounted,
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"event-library",
  capabilities:["templates", "editor and rename", "import and deletion review", "push"],
});
