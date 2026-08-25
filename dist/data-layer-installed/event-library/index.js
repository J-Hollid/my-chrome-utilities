import { EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, appendImportedTemplates, beginTemplateRename, clearEventLibrary, createNewEventEditor, deleteEventTemplate, discardDraft, eventLibraryExport, eventLibraryImport, openPropertyEditor, replaceImportedTemplates, restoreEventTemplateLibrary, saveAsTemplateCopy, saveDraftRevision, saveNewEvent, saveTemplateRename, serializeEventTemplateLibrary, } from "../../utilities/data-layer/event-library.js";
export function createEventLibraryInstalledController(ports) {
    let mounted = false;
    let templates = restoreEventTemplateLibrary(ports.storage.getItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY));
    let selectedId;
    let editor;
    let rename;
    let pendingImport;
    let pendingDeletion;
    let replaceArmed = false;
    const createId = ports.createId ?? (() => `template:${crypto.randomUUID()}`);
    const persist = () => {
        ports.storage.setItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, serializeEventTemplateLibrary(templates));
        ports.changed();
    };
    const find = (id) => {
        const template = templates.find((candidate) => candidate.id === id);
        if (!template)
            throw new Error(`Unknown template ${id}`);
        return template;
    };
    const closeEditor = () => { editor = undefined; rename = undefined; };
    return {
        mount() { mounted = true; },
        dispose() { mounted = false; closeEditor(); pendingImport = undefined; pendingDeletion = undefined; replaceArmed = false; },
        select(id) { find(id); selectedId = id; },
        beginDraft(id) { const template = find(id); selectedId = id; editor = openPropertyEditor(template); },
        beginNew() { selectedId = undefined; editor = createNewEventEditor(ports.defaultPushPath()); },
        discardDraft() { if (editor)
            editor = discardDraft(editor); },
        saveRevision() {
            if (!editor)
                throw new Error("Open a template before saving a revision");
            editor = saveDraftRevision(editor);
            templates = templates.map((candidate) => candidate.id === editor?.template.id ? editor.template : candidate);
            persist();
            return structuredClone(editor.template);
        },
        saveNew() {
            if (!editor?.isNew)
                throw new Error("Open a new event draft before saving");
            const saved = saveNewEvent(editor, createId);
            templates = [...templates, saved];
            selectedId = saved.id;
            editor = openPropertyEditor(saved);
            persist();
            return structuredClone(saved);
        },
        saveCopy(name) {
            if (!editor)
                throw new Error("Open a template before saving a copy");
            const copy = { ...saveAsTemplateCopy(editor, name), id: createId() };
            templates = [...templates, copy];
            persist();
            return structuredClone(copy);
        },
        beginRename(id) { const template = find(id); rename = { templateId: id, draft: beginTemplateRename(template) }; },
        commitRename() {
            if (!rename)
                throw new Error("Open a rename review before saving");
            const templateId = rename.templateId;
            const renamed = saveTemplateRename(editor?.template.id === templateId ? editor : openPropertyEditor(find(templateId)), rename.draft);
            templates = templates.map((template) => template.id === templateId ? renamed.template : template);
            if (editor?.template.id === templateId)
                editor = renamed;
            rename = undefined;
            persist();
        },
        reviewImport(serialized) { pendingImport = eventLibraryImport(serialized); replaceArmed = false; },
        armReplaceImport() { if (!pendingImport)
            throw new Error("Review an import before replacing"); replaceArmed = true; },
        commitImport(mode) {
            if (!pendingImport)
                throw new Error("Review an import before committing");
            if (mode === "replace") {
                if (!replaceArmed) {
                    replaceArmed = true;
                    return;
                }
                templates = replaceImportedTemplates(templates, pendingImport.templates);
            }
            else
                templates = appendImportedTemplates(templates, pendingImport.templates, createId).templates;
            pendingImport = undefined;
            replaceArmed = false;
            closeEditor();
            persist();
        },
        requestDelete(id) {
            pendingDeletion = id ? { id, name: find(id).name, count: 1 } : { count: templates.length };
        },
        confirmDelete() {
            if (!pendingDeletion)
                return;
            templates = pendingDeletion.id ? deleteEventTemplate(templates, pendingDeletion.id) : clearEventLibrary(templates);
            if (!pendingDeletion.id || selectedId === pendingDeletion.id)
                selectedId = undefined;
            if (!pendingDeletion.id || editor?.template.id === pendingDeletion.id)
                closeEditor();
            pendingDeletion = undefined;
            persist();
        },
        cancelDelete() { pendingDeletion = undefined; },
        async pushSelected() { if (!selectedId)
            throw new Error("Select a template before pushing"); await ports.push(find(selectedId)); },
        export: () => eventLibraryExport(templates),
        templates: () => structuredClone(templates),
        state: () => structuredClone({ ...(selectedId ? { selectedId } : {}),
            ...(editor ? { editor } : {}), ...(rename ? { rename } : {}), ...(pendingImport ? { pendingImport } : {}),
            ...(pendingDeletion ? { pendingDeletion } : {}), replaceArmed, templates }),
        mounted: () => mounted,
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "event-library",
    capabilities: ["templates", "editor and rename", "import and deletion review", "push"],
});
//# sourceMappingURL=index.js.map