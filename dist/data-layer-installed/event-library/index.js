import { EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, appendImportedTemplates, beginTemplateRename, clearEventLibrary, createNewEventEditor, deleteEventTemplate, discardDraft, eventLibraryExport, eventLibraryImport, findEventLibraryEditorElements, openPropertyEditor, renderEventLibraryEditor, replaceImportedTemplates, restoreEventTemplateLibrary, saveAsTemplateCopy, saveDraftRevision, saveNewEvent, saveTemplateRename, searchEventTemplates, serializeEventTemplateLibrary, setNewEventField, setPushDestination, setTemplateIdentity, updateDraftJson, } from "../../utilities/data-layer/event-library.js";
export function createEventLibraryInstalledController(ports) {
    const eventLibraryEditorElements = findEventLibraryEditorElements(ports.root);
    const { search: eventTemplateSearch, addNewButton, templateName: eventTemplateName, eventName: eventTemplateEventName, source: eventTemplateSource, json: eventTemplateJson, pushDestination: eventTemplatePushDestination, saveRevisionButton: saveTemplateRevisionButton, saveCopyButton: saveTemplateCopyButton, pushDraftButton: pushTemplateDraftButton, discardDraftButton: discardTemplateDraftButton, closeEditorButton: closeTemplateEditorButton, backToCapturedEventButton, } = eventLibraryEditorElements;
    const libraryDraftSchemaSelector = ports.root.querySelector("#library-draft-schema-selector");
    const refreshLibraryDraftValidationButton = ports.root.querySelector("#refresh-library-draft-validation");
    const exportEventLibraryButton = ports.root.querySelector("#export-event-library");
    const importEventLibraryButton = ports.root.querySelector("#import-event-library");
    const eventLibraryFile = ports.root.querySelector("#event-library-file");
    const eventLibraryTransferResult = ports.root.querySelector("#event-library-transfer-result");
    const clearEventLibraryButton = ports.root.querySelector("#clear-event-library");
    const eventLibraryDeleteReview = ports.root.querySelector("#event-library-delete-review");
    const eventLibraryDeleteReviewHeading = ports.root.querySelector("#event-library-delete-review-heading");
    const eventLibraryDeleteReviewSummary = ports.root.querySelector("#event-library-delete-review-summary");
    const confirmEventLibraryDeleteButton = ports.root.querySelector("#confirm-event-library-delete");
    const cancelEventLibraryDeleteButton = ports.root.querySelector("#cancel-event-library-delete");
    const eventLibraryImportReview = ports.root.querySelector("#event-library-import-review");
    const eventLibraryImportReviewHeading = ports.root.querySelector("#event-library-import-review-heading");
    const eventLibraryImportReviewSummary = ports.root.querySelector("#event-library-import-review-summary");
    const replaceEventLibraryButton = ports.root.querySelector("#replace-event-library");
    const appendEventLibraryButton = ports.root.querySelector("#append-event-library");
    const cancelEventLibraryImportButton = ports.root.querySelector("#cancel-event-library-import");
    let mounted = false;
    let eventTemplates = restoreEventTemplateLibrary(ports.storage.getItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY));
    let selectedId;
    let propertyEditorState;
    let pendingTemplateRename;
    let pendingEventLibraryImport;
    let pendingEventLibraryDeletion;
    let replaceEventLibraryArmed = false;
    const createId = ports.createId ?? (() => `template:${crypto.randomUUID()}`);
    const persistEventTemplateLibrary = () => {
        ports.storage.setItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, serializeEventTemplateLibrary(eventTemplates));
        ports.changed();
    };
    const find = (id) => {
        const template = eventTemplates.find((candidate) => candidate.id === id);
        if (!template)
            throw new Error(`Unknown template ${id}`);
        return template;
    };
    const closeEditor = () => { propertyEditorState = undefined; pendingTemplateRename = undefined; };
    const renderEventLibraryTransfer = () => {
        if (eventLibraryTransferResult)
            eventLibraryTransferResult.textContent = pendingEventLibraryImport
                ? `${pendingEventLibraryImport.templates.length} templates ready to import` : "";
        if (eventLibraryImportReviewHeading)
            eventLibraryImportReviewHeading.textContent = replaceEventLibraryArmed
                ? "Confirm replacement" : "Review Event Library import";
        if (eventLibraryImportReviewSummary)
            eventLibraryImportReviewSummary.textContent = pendingEventLibraryImport
                ? `${pendingEventLibraryImport.templates.length} imported templates` : "";
        if (eventLibraryDeleteReviewHeading)
            eventLibraryDeleteReviewHeading.textContent = pendingEventLibraryDeletion?.id
                ? "Delete event template?" : "Clear Event Library?";
        if (eventLibraryDeleteReviewSummary)
            eventLibraryDeleteReviewSummary.textContent = pendingEventLibraryDeletion
                ? `${pendingEventLibraryDeletion.count} template${pendingEventLibraryDeletion.count === 1 ? "" : "s"}` : "";
    };
    const reviewEventLibraryImport = (serialized) => {
        pendingEventLibraryImport = eventLibraryImport(serialized);
        replaceEventLibraryArmed = false;
        renderEventLibraryTransfer();
        eventLibraryImportReview?.showModal();
    };
    const commitEventLibraryImport = (mode) => {
        if (!pendingEventLibraryImport)
            throw new Error("Review an import before committing");
        if (mode === "replace") {
            if (!replaceEventLibraryArmed) {
                replaceEventLibraryArmed = true;
                return;
            }
            eventTemplates = replaceImportedTemplates(eventTemplates, pendingEventLibraryImport.templates);
        }
        else
            eventTemplates = appendImportedTemplates(eventTemplates, pendingEventLibraryImport.templates, createId).templates;
        pendingEventLibraryImport = undefined;
        replaceEventLibraryArmed = false;
        closeEditor();
        eventLibraryImportReview?.close();
        renderEventLibraryTransfer();
        persistEventTemplateLibrary();
    };
    const requestEventTemplateDeletion = (id) => {
        pendingEventLibraryDeletion = id ? { id, name: find(id).name, count: 1 } : { count: eventTemplates.length };
        renderEventLibraryTransfer();
        eventLibraryDeleteReview?.showModal();
    };
    const commitEventLibraryDeletion = () => {
        if (!pendingEventLibraryDeletion)
            return;
        eventTemplates = pendingEventLibraryDeletion.id
            ? deleteEventTemplate(eventTemplates, pendingEventLibraryDeletion.id) : clearEventLibrary(eventTemplates);
        if (!pendingEventLibraryDeletion.id || selectedId === pendingEventLibraryDeletion.id)
            selectedId = undefined;
        if (!pendingEventLibraryDeletion.id || propertyEditorState?.template.id === pendingEventLibraryDeletion.id)
            closeEditor();
        pendingEventLibraryDeletion = undefined;
        eventLibraryDeleteReview?.close();
        renderEventLibraryTransfer();
        persistEventTemplateLibrary();
    };
    const renderEventTemplateLibrary = () => {
        if (!mounted || !eventLibraryEditorElements.list)
            return;
        const visible = searchEventTemplates(eventTemplates, eventTemplateSearch?.value ?? "");
        renderEventLibraryEditor(eventLibraryEditorElements, visible, propertyEditorState, {
            edit: (template) => { selectedId = template.id; propertyEditorState = openPropertyEditor(template); renderEventTemplateLibrary(); },
            rename: (template) => { pendingTemplateRename = { templateId: template.id, draft: beginTemplateRename(template) }; },
            duplicate: (template) => { selectedId = template.id; propertyEditorState = openPropertyEditor(template); },
            push: (template) => { selectedId = template.id; void ports.push(template); },
            delete: (template) => requestEventTemplateDeletion(template.id),
            ...(ports.createSchema ? { createSchema: ports.createSchema } : {}),
            ...(ports.createTestCase ? { createTestCase: ports.createTestCase } : {}),
        });
    };
    const openNewEventEditor = () => {
        selectedId = undefined;
        propertyEditorState = createNewEventEditor(ports.defaultPushPath());
        renderEventTemplateLibrary();
    };
    const updateTemplateName = () => {
        if (!propertyEditorState)
            return;
        propertyEditorState = propertyEditorState.isNew
            ? setNewEventField(propertyEditorState, "name", eventTemplateName?.value ?? "")
            : setTemplateIdentity(propertyEditorState, "name", eventTemplateName?.value ?? "");
        renderEventTemplateLibrary();
    };
    const updateTemplateEventName = () => {
        if (!propertyEditorState)
            return;
        propertyEditorState = propertyEditorState.isNew
            ? setNewEventField(propertyEditorState, "eventName", eventTemplateEventName?.value ?? "")
            : setTemplateIdentity(propertyEditorState, "eventName", eventTemplateEventName?.value ?? "");
        renderEventTemplateLibrary();
    };
    const updateTemplateSource = () => {
        if (!propertyEditorState?.isNew)
            return;
        const option = eventTemplateSource?.selectedOptions[0];
        propertyEditorState = setNewEventField(propertyEditorState, "source", { id: eventTemplateSource?.value ?? "", name: option?.textContent ?? eventTemplateSource?.value ?? "" });
        renderEventTemplateLibrary();
    };
    const updateTemplateJson = () => {
        if (!propertyEditorState)
            return;
        propertyEditorState = updateDraftJson(propertyEditorState, eventTemplateJson?.value ?? "");
        renderEventTemplateLibrary();
    };
    const updateTemplatePushDestination = () => {
        if (!propertyEditorState)
            return;
        propertyEditorState = setPushDestination(propertyEditorState, eventTemplatePushDestination?.value ?? "");
        renderEventTemplateLibrary();
    };
    const saveTemplateRevision = () => {
        if (!propertyEditorState)
            return;
        propertyEditorState = saveDraftRevision(propertyEditorState);
        eventTemplates = eventTemplates.map((candidate) => candidate.id === propertyEditorState?.template.id
            ? propertyEditorState.template : candidate);
        persistEventTemplateLibrary();
        renderEventTemplateLibrary();
    };
    const saveTemplateCopy = () => {
        if (!propertyEditorState)
            return;
        const copy = { ...saveAsTemplateCopy(propertyEditorState, `${propertyEditorState.template.name} copy`), id: createId() };
        eventTemplates = [...eventTemplates, copy];
        persistEventTemplateLibrary();
        renderEventTemplateLibrary();
    };
    const pushTemplateDraft = () => { if (propertyEditorState)
        void ports.push(propertyEditorState.template); };
    const discardTemplateDraft = () => {
        if (propertyEditorState)
            propertyEditorState = discardDraft(propertyEditorState);
        renderEventTemplateLibrary();
    };
    const closeTemplateEditor = () => { closeEditor(); renderEventTemplateLibrary(); };
    const backToCapturedEvent = () => ports.backToCapturedEvent();
    const refreshLibraryDraftValidation = () => ports.validateDraft(libraryDraftSchemaSelector?.value ?? "");
    function downloadEventLibrary() { ports.downloadExport(eventLibraryExport(eventTemplates)); }
    const loadEventLibraryFile = async () => reviewEventLibraryImport(await ports.readImportFile());
    const requestClearEventLibrary = () => requestEventTemplateDeletion();
    const replaceEventLibrary = () => commitEventLibraryImport("replace");
    const appendEventLibrary = () => commitEventLibraryImport("append");
    const cancelEventLibraryImport = () => {
        pendingEventLibraryImport = undefined;
        replaceEventLibraryArmed = false;
        eventLibraryImportReview?.close();
        renderEventLibraryTransfer();
    };
    const cancelEventLibraryDelete = () => {
        pendingEventLibraryDeletion = undefined;
        eventLibraryDeleteReview?.close();
        renderEventLibraryTransfer();
    };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            eventTemplateSearch?.addEventListener("input", renderEventTemplateLibrary);
            addNewButton?.addEventListener("click", openNewEventEditor);
            refreshLibraryDraftValidationButton?.addEventListener("click", refreshLibraryDraftValidation);
            exportEventLibraryButton?.addEventListener("click", downloadEventLibrary);
            importEventLibraryButton?.addEventListener("click", loadEventLibraryFile);
            eventLibraryFile?.addEventListener("change", loadEventLibraryFile);
            clearEventLibraryButton?.addEventListener("click", requestClearEventLibrary);
            confirmEventLibraryDeleteButton?.addEventListener("click", commitEventLibraryDeletion);
            cancelEventLibraryDeleteButton?.addEventListener("click", cancelEventLibraryDelete);
            replaceEventLibraryButton?.addEventListener("click", replaceEventLibrary);
            appendEventLibraryButton?.addEventListener("click", appendEventLibrary);
            cancelEventLibraryImportButton?.addEventListener("click", cancelEventLibraryImport);
            eventTemplateName?.addEventListener("input", updateTemplateName);
            eventTemplateEventName?.addEventListener("input", updateTemplateEventName);
            eventTemplateSource?.addEventListener("change", updateTemplateSource);
            eventTemplateJson?.addEventListener("input", updateTemplateJson);
            eventTemplatePushDestination?.addEventListener("input", updateTemplatePushDestination);
            saveTemplateRevisionButton?.addEventListener("click", saveTemplateRevision);
            saveTemplateCopyButton?.addEventListener("click", saveTemplateCopy);
            pushTemplateDraftButton?.addEventListener("click", pushTemplateDraft);
            discardTemplateDraftButton?.addEventListener("click", discardTemplateDraft);
            closeTemplateEditorButton?.addEventListener("click", closeTemplateEditor);
            backToCapturedEventButton?.addEventListener("click", backToCapturedEvent);
            renderEventTemplateLibrary();
            renderEventLibraryTransfer();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            eventTemplateSearch?.removeEventListener("input", renderEventTemplateLibrary);
            addNewButton?.removeEventListener("click", openNewEventEditor);
            refreshLibraryDraftValidationButton?.removeEventListener("click", refreshLibraryDraftValidation);
            exportEventLibraryButton?.removeEventListener("click", downloadEventLibrary);
            importEventLibraryButton?.removeEventListener("click", loadEventLibraryFile);
            eventLibraryFile?.removeEventListener("change", loadEventLibraryFile);
            clearEventLibraryButton?.removeEventListener("click", requestClearEventLibrary);
            confirmEventLibraryDeleteButton?.removeEventListener("click", commitEventLibraryDeletion);
            cancelEventLibraryDeleteButton?.removeEventListener("click", cancelEventLibraryDelete);
            replaceEventLibraryButton?.removeEventListener("click", replaceEventLibrary);
            appendEventLibraryButton?.removeEventListener("click", appendEventLibrary);
            cancelEventLibraryImportButton?.removeEventListener("click", cancelEventLibraryImport);
            eventTemplateName?.removeEventListener("input", updateTemplateName);
            eventTemplateEventName?.removeEventListener("input", updateTemplateEventName);
            eventTemplateSource?.removeEventListener("change", updateTemplateSource);
            eventTemplateJson?.removeEventListener("input", updateTemplateJson);
            eventTemplatePushDestination?.removeEventListener("input", updateTemplatePushDestination);
            saveTemplateRevisionButton?.removeEventListener("click", saveTemplateRevision);
            saveTemplateCopyButton?.removeEventListener("click", saveTemplateCopy);
            pushTemplateDraftButton?.removeEventListener("click", pushTemplateDraft);
            discardTemplateDraftButton?.removeEventListener("click", discardTemplateDraft);
            closeTemplateEditorButton?.removeEventListener("click", closeTemplateEditor);
            backToCapturedEventButton?.removeEventListener("click", backToCapturedEvent);
            closeEditor();
            pendingEventLibraryImport = undefined;
            pendingEventLibraryDeletion = undefined;
            replaceEventLibraryArmed = false;
        },
        select(id) { find(id); selectedId = id; },
        beginDraft(id) { const template = find(id); selectedId = id; propertyEditorState = openPropertyEditor(template); },
        beginNew: openNewEventEditor,
        discardDraft() { if (propertyEditorState)
            propertyEditorState = discardDraft(propertyEditorState); },
        saveRevision() {
            if (!propertyEditorState)
                throw new Error("Open a template before saving a revision");
            saveTemplateRevision();
            return structuredClone(propertyEditorState.template);
        },
        saveNew() {
            if (!propertyEditorState?.isNew)
                throw new Error("Open a new event draft before saving");
            const saved = saveNewEvent(propertyEditorState, createId);
            eventTemplates = [...eventTemplates, saved];
            selectedId = saved.id;
            propertyEditorState = openPropertyEditor(saved);
            persistEventTemplateLibrary();
            renderEventTemplateLibrary();
            return structuredClone(saved);
        },
        saveCopy(name) {
            if (!propertyEditorState)
                throw new Error("Open a template before saving a copy");
            const copy = { ...saveAsTemplateCopy(propertyEditorState, name), id: createId() };
            eventTemplates = [...eventTemplates, copy];
            persistEventTemplateLibrary();
            renderEventTemplateLibrary();
            return structuredClone(copy);
        },
        beginRename(id) { const template = find(id); pendingTemplateRename = { templateId: id, draft: beginTemplateRename(template) }; },
        commitRename() {
            if (!pendingTemplateRename)
                throw new Error("Open a rename review before saving");
            const templateId = pendingTemplateRename.templateId;
            const renamed = saveTemplateRename(propertyEditorState?.template.id === templateId ? propertyEditorState : openPropertyEditor(find(templateId)), pendingTemplateRename.draft);
            eventTemplates = eventTemplates.map((template) => template.id === templateId ? renamed.template : template);
            if (propertyEditorState?.template.id === templateId)
                propertyEditorState = renamed;
            pendingTemplateRename = undefined;
            persistEventTemplateLibrary();
        },
        reviewImport: reviewEventLibraryImport,
        armReplaceImport() { if (!pendingEventLibraryImport)
            throw new Error("Review an import before replacing"); replaceEventLibraryArmed = true; },
        commitImport: commitEventLibraryImport,
        requestDelete: requestEventTemplateDeletion,
        confirmDelete: commitEventLibraryDeletion,
        cancelDelete: cancelEventLibraryDelete,
        async pushSelected() { if (!selectedId)
            throw new Error("Select a template before pushing"); await ports.push(find(selectedId)); },
        export: () => eventLibraryExport(eventTemplates),
        templates: () => structuredClone(eventTemplates),
        state: () => structuredClone({ ...(selectedId ? { selectedId } : {}),
            ...(propertyEditorState ? { editor: propertyEditorState } : {}), ...(pendingTemplateRename ? { rename: pendingTemplateRename } : {}),
            ...(pendingEventLibraryImport ? { pendingImport: pendingEventLibraryImport } : {}),
            ...(pendingEventLibraryDeletion ? { pendingDeletion: pendingEventLibraryDeletion } : {}),
            replaceArmed: replaceEventLibraryArmed, templates: eventTemplates }),
        mounted: () => mounted,
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "event-library",
    capabilities: ["templates", "editor and rename", "import and deletion review", "push"],
});
//# sourceMappingURL=index.js.map