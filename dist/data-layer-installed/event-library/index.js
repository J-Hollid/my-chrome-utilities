import { EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, appendImportedTemplates, beginTemplateRename, clearEventLibrary, createPushDraftReview, createTemplateChangeReview, createNewEventEditor, deleteEventTemplate, discardDraft, eventLibraryExport, eventLibraryImport, findEventLibraryEditorElements, openPropertyEditor, renderEventLibraryEditor, replaceImportedTemplates, renameValidation, restoreEventTemplateLibrary, saveAsTemplateCopy, saveDraftRevision, saveNewEvent, saveTemplateRename, searchEventTemplates, serializeEventTemplateLibrary, setEventLibraryValidation, setNewEventField, setPushDestination, setTemplateSchemaAttachment, setTemplateIdentity, updateDraftJson, } from "../../utilities/data-layer/event-library.js";
export function createEventLibraryInstalledController(ports) {
    const eventLibraryEditorElements = findEventLibraryEditorElements(ports.root);
    const { search: eventTemplateSearch, addNewButton, templateName: eventTemplateName, eventName: eventTemplateEventName, source: eventTemplateSource, json: eventTemplateJson, pushDestination: eventTemplatePushDestination, saveRevisionButton: saveTemplateRevisionButton, saveCopyButton: saveTemplateCopyButton, pushDraftButton: pushTemplateDraftButton, discardDraftButton: discardTemplateDraftButton, closeEditorButton: closeTemplateEditorButton, backToCapturedEventButton, } = eventLibraryEditorElements;
    let libraryDraftSchemaSelector = ports.root.querySelector("#library-draft-schema-selector");
    let refreshLibraryDraftValidationButton = ports.root.querySelector("#refresh-library-draft-validation");
    let ownsDraftValidationControls = false;
    const templateEmptyStateElements = { state: ports.root.querySelector("#event-template-empty-state"),
        recovery: ports.root.querySelector("#event-template-empty-recovery") };
    const templateEmptyRecovery = templateEmptyStateElements.recovery;
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
    const templateRenameDialog = ports.root.querySelector("#event-template-rename");
    const templateRenameHeading = ports.root.querySelector("#event-template-rename-heading");
    const templateRenameName = ports.root.querySelector("#event-template-rename-name");
    const templateRenameEventName = ports.root.querySelector("#event-template-rename-event-name");
    const templateRenameNameError = ports.root.querySelector("#event-template-rename-name-error");
    const templateRenameEventNameError = ports.root.querySelector("#event-template-rename-event-name-error");
    const saveTemplateNamesButton = ports.root.querySelector("#save-template-names");
    const cancelTemplateRenameButton = ports.root.querySelector("#cancel-template-rename");
    const templateRenameReview = ports.root.querySelector("#event-template-rename-review");
    const templateRenameReviewHeading = ports.root.querySelector("#event-template-rename-review-heading");
    const templateRenameReviewSummary = ports.root.querySelector("#event-template-rename-review-summary");
    const confirmTemplateRenameButton = ports.root.querySelector("#confirm-template-rename");
    const cancelTemplateRenameReviewButton = ports.root.querySelector("#cancel-template-rename-review");
    const pushDraftReview = ports.root.querySelector("#push-draft-review");
    const pushDraftReviewHeading = ports.root.querySelector("#push-draft-review-heading");
    const pushDraftReviewSummary = ports.root.querySelector("#push-draft-review-summary");
    const confirmPushDraftButton = ports.root.querySelector("#confirm-push-draft");
    const cancelPushDraftButton = ports.root.querySelector("#cancel-push-draft");
    const revisionChangeReview = ports.root.querySelector("#revision-change-review");
    const revisionChangeReviewHeading = ports.root.querySelector("#revision-change-review-heading");
    const confirmRevisionChangeButton = ports.root.querySelector("#confirm-revision-change");
    const cancelRevisionChangeButton = ports.root.querySelector("#cancel-revision-change");
    const closeTemplateEditorConfirmation = ports.root.querySelector("#close-template-editor-confirmation");
    const closeTemplateEditorSummary = ports.root.querySelector("#close-template-editor-summary");
    const keepEditingTemplateButton = ports.root.querySelector("#keep-editing-template");
    const saveAndCloseTemplateButton = ports.root.querySelector("#save-and-close-template");
    const discardAndCloseTemplateButton = ports.root.querySelector("#discard-and-close-template");
    let mounted = false;
    let eventTemplates = restoreEventTemplateLibrary(ports.storage.getItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY));
    let selectedId;
    let propertyEditorState;
    let pendingTemplateRename;
    let pendingEventLibraryImport;
    let pendingEventLibraryDeletion;
    let replaceEventLibraryArmed = false;
    let pendingPushDraftReview;
    let pendingRevisionChangeReview;
    let templateEditorReturnTemplateId;
    let savedInspectorTemplateId;
    let pushPathReadiness;
    let pushPathReadinessRequest = 0;
    let inspectorActionDispose;
    let testCaseReviewRequest = 0;
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
    function ensureDraftValidationControls() {
        if (libraryDraftSchemaSelector && refreshLibraryDraftValidationButton)
            return;
        const anchor = eventLibraryEditorElements.validation, ownerDocument = anchor?.ownerDocument;
        if (!anchor || !ownerDocument)
            return;
        libraryDraftSchemaSelector = ownerDocument.createElement("select");
        libraryDraftSchemaSelector.id = "library-draft-schema-selector";
        libraryDraftSchemaSelector.setAttribute("aria-label", "Schema for Library draft validation");
        refreshLibraryDraftValidationButton = ownerDocument.createElement("button");
        refreshLibraryDraftValidationButton.id = "refresh-library-draft-validation";
        refreshLibraryDraftValidationButton.type = "button";
        refreshLibraryDraftValidationButton.textContent = "Refresh validation";
        anchor.after(libraryDraftSchemaSelector, refreshLibraryDraftValidationButton);
        ownsDraftValidationControls = true;
    }
    function renderDraftValidationControls() {
        ensureDraftValidationControls();
        const selectable = Boolean(propertyEditorState && !propertyEditorState.isNew);
        if (libraryDraftSchemaSelector) {
            libraryDraftSchemaSelector.hidden = !selectable;
            if (selectable) {
                const automatic = libraryDraftSchemaSelector.ownerDocument.createElement("option");
                automatic.value = "";
                automatic.textContent = "Automatic schema";
                const options = ports.schemas().map((schema) => {
                    const option = libraryDraftSchemaSelector.ownerDocument.createElement("option");
                    option.value = schema.id;
                    option.textContent = `${schema.name} v${schema.version}`;
                    return option;
                });
                libraryDraftSchemaSelector.replaceChildren(automatic, ...options);
                libraryDraftSchemaSelector.value = propertyEditorState?.template.schemaId ?? "";
            }
        }
        if (refreshLibraryDraftValidationButton)
            refreshLibraryDraftValidationButton.hidden = !selectable;
    }
    function hideDialog(dialog) { if (dialog?.open)
        dialog.close(); if (dialog)
        dialog.hidden = true; }
    function showDialog(dialog, focus) {
        if (!dialog)
            return;
        dialog.hidden = false;
        if (!dialog.open)
            dialog.showModal();
        focus?.focus();
    }
    function renderTemplateRenameValidation() {
        if (!pendingTemplateRename)
            return false;
        const errors = renameValidation(pendingTemplateRename.draft);
        for (const [input, output, error] of [[templateRenameName, templateRenameNameError, errors.templateName],
            [templateRenameEventName, templateRenameEventNameError, errors.eventName]]) {
            input?.setCustomValidity(error ?? "");
            input?.setAttribute("aria-invalid", String(Boolean(error)));
            if (output)
                output.textContent = error ?? "";
        }
        const error = errors.templateName ?? errors.eventName;
        if (saveTemplateNamesButton)
            saveTemplateNamesButton.disabled = Boolean(error);
        return !error;
    }
    function openTemplateRename(template) {
        pendingTemplateRename = { templateId: template.id, draft: beginTemplateRename(template) };
        if (templateRenameName)
            templateRenameName.value = pendingTemplateRename.draft.templateName;
        if (templateRenameEventName)
            templateRenameEventName.value = pendingTemplateRename.draft.eventName;
        renderTemplateRenameValidation();
        showDialog(templateRenameDialog, templateRenameName ?? templateRenameHeading);
    }
    function closeTemplateRename() { hideDialog(templateRenameDialog); pendingTemplateRename = undefined; }
    function commitTemplateRename() {
        if (!pendingTemplateRename)
            return;
        const templateId = pendingTemplateRename.templateId;
        const renamed = saveTemplateRename(propertyEditorState?.template.id === templateId ? propertyEditorState : openPropertyEditor(find(templateId)), pendingTemplateRename.draft);
        eventTemplates = eventTemplates.map((template) => template.id === templateId ? renamed.template : template);
        if (propertyEditorState?.template.id === templateId)
            propertyEditorState = renamed;
        pendingTemplateRename = undefined;
        persistEventTemplateLibrary();
        hideDialog(templateRenameDialog);
        hideDialog(templateRenameReview);
        renderEventTemplateLibrary();
    }
    function requestTemplateRenameSave() {
        if (!pendingTemplateRename || !renderTemplateRenameValidation())
            return;
        const template = find(pendingTemplateRename.templateId);
        const nextEventName = pendingTemplateRename.draft.eventName.trim();
        if (template.eventName === nextEventName) {
            commitTemplateRename();
            return;
        }
        hideDialog(templateRenameDialog);
        if (templateRenameReviewSummary)
            templateRenameReviewSummary.textContent =
                `${template.eventName} changes to ${nextEventName}. Future pushes use ${nextEventName}. The originating captured ${template.eventName} event remains unchanged.`;
        if (confirmTemplateRenameButton)
            confirmTemplateRenameButton.textContent = `Save names and use ${nextEventName}`;
        showDialog(templateRenameReview, templateRenameReviewHeading);
    }
    function returnToTemplateRename() { hideDialog(templateRenameReview); showDialog(templateRenameDialog, saveTemplateNamesButton); }
    const updateTemplateRenameName = () => {
        if (!pendingTemplateRename || !templateRenameName)
            return;
        pendingTemplateRename = { ...pendingTemplateRename, draft: { ...pendingTemplateRename.draft, templateName: templateRenameName.value } };
        renderTemplateRenameValidation();
    };
    const updateTemplateRenameEventName = () => {
        if (!pendingTemplateRename || !templateRenameEventName)
            return;
        pendingTemplateRename = { ...pendingTemplateRename, draft: { ...pendingTemplateRename.draft, eventName: templateRenameEventName.value } };
        renderTemplateRenameValidation();
    };
    const cancelTemplateRenameDialog = (event) => { event.preventDefault(); closeTemplateRename(); };
    const cancelTemplateRenameReview = (event) => { event.preventDefault(); returnToTemplateRename(); };
    function openRevisionChangeReview() {
        if (!propertyEditorState || propertyEditorState.isNew || propertyEditorState.jsonError)
            return;
        pendingRevisionChangeReview = { editor: structuredClone(propertyEditorState), review: createTemplateChangeReview(propertyEditorState, "revision") };
        ports.renderRevisionReview(revisionChangeReview ?? ports.root, pendingRevisionChangeReview.review);
        if (confirmRevisionChangeButton)
            confirmRevisionChangeButton.textContent = `Save revision ${pendingRevisionChangeReview.review.resultingVersion}`;
        showDialog(revisionChangeReview, revisionChangeReviewHeading);
    }
    function closeRevisionChangeReview() { pendingRevisionChangeReview = undefined; hideDialog(revisionChangeReview); saveTemplateRevisionButton?.focus(); }
    function commitRevisionChangeReview() {
        const pending = pendingRevisionChangeReview;
        if (!pending)
            return;
        propertyEditorState = saveDraftRevision(pending.editor);
        eventTemplates = eventTemplates.map((template) => template.id === propertyEditorState?.template.id ? propertyEditorState.template : template);
        pendingRevisionChangeReview = undefined;
        hideDialog(revisionChangeReview);
        persistEventTemplateLibrary();
        renderEventTemplateLibrary();
    }
    function openPushDraftReview() {
        if (!propertyEditorState || propertyEditorState.jsonError)
            return;
        const target = ports.pushTarget();
        if (!target || target.accessState !== "Ready")
            return;
        pendingPushDraftReview = createPushDraftReview(propertyEditorState, target);
        ports.renderPushReview(pushDraftReview ?? ports.root, pendingPushDraftReview);
        if (pushDraftReviewSummary)
            pushDraftReviewSummary.textContent = pendingPushDraftReview.summary;
        if (confirmPushDraftButton)
            confirmPushDraftButton.textContent = pendingPushDraftReview.confirmLabel;
        showDialog(pushDraftReview, pushDraftReviewHeading);
    }
    async function pushPayloadToSelectedTargetPage(template) { await ports.push(structuredClone(template)); }
    function pushCurrentTemplateDraft() { if (propertyEditorState)
        void pushPayloadToSelectedTargetPage(propertyEditorState.template); }
    function pushLibraryTemplate(template) { selectedId = template.id; void pushPayloadToSelectedTargetPage(template); }
    const confirmPushDraft = () => {
        const pending = pendingPushDraftReview;
        pendingPushDraftReview = undefined;
        hideDialog(pushDraftReview);
        if (pending)
            void pushPayloadToSelectedTargetPage(pending.editor.template);
    };
    const cancelPushDraft = () => { pendingPushDraftReview = undefined; hideDialog(pushDraftReview); pushTemplateDraftButton?.focus(); };
    const cancelRevisionChangeDialog = (event) => { event.preventDefault(); closeRevisionChangeReview(); };
    const navigatePushDraftReview = (event) => { if (event.key === "Escape") {
        pendingPushDraftReview = undefined;
        hideDialog(pushDraftReview);
    } };
    function resetTemplateEditorDisclosures() {
        pendingTemplateRename = undefined;
        pendingPushDraftReview = undefined;
        pendingRevisionChangeReview = undefined;
        if (closeTemplateEditorConfirmation)
            closeTemplateEditorConfirmation.hidden = true;
        hideDialog(templateRenameDialog);
        hideDialog(templateRenameReview);
        hideDialog(pushDraftReview);
        hideDialog(revisionChangeReview);
    }
    const closeEditor = () => {
        propertyEditorState = undefined;
        resetTemplateEditorDisclosures();
        if (closeTemplateEditorConfirmation)
            closeTemplateEditorConfirmation.hidden = true;
    };
    const requestCloseTemplateEditor = () => {
        if (!propertyEditorState?.dirty) {
            closeTemplateEditor();
            return;
        }
        if (propertyEditorState.isNew) {
            if (saveAndCloseTemplateButton)
                saveAndCloseTemplateButton.textContent = "Save new event";
            if (discardAndCloseTemplateButton)
                discardAndCloseTemplateButton.textContent = "Discard new event";
        }
        if (closeTemplateEditorSummary)
            closeTemplateEditorSummary.textContent =
                `Unsaved changes: ${Object.keys(propertyEditorState.draft).join(", ")}.`;
        if (closeTemplateEditorConfirmation)
            closeTemplateEditorConfirmation.hidden = false;
    };
    const keepEditingTemplate = () => { if (closeTemplateEditorConfirmation)
        closeTemplateEditorConfirmation.hidden = true; };
    const saveAndCloseTemplate = () => {
        if (!propertyEditorState)
            return;
        if (propertyEditorState.isNew) {
            const saved = saveNewEvent(propertyEditorState, createId);
            eventTemplates = [...eventTemplates, saved];
        }
        else {
            const saved = saveDraftRevision(propertyEditorState);
            eventTemplates = eventTemplates.map((template) => template.id === saved.template.id ? saved.template : template);
        }
        persistEventTemplateLibrary();
        closeTemplateEditor();
    };
    const discardAndCloseTemplate = () => { closeTemplateEditor(); };
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
    function appendOpenInLibraryAction(eventId, templateName) {
        inspectorActionDispose?.();
        inspectorActionDispose = undefined;
        const activate = () => {
            if (!mounted)
                return;
            const template = eventTemplates.find(({ id }) => id === savedInspectorTemplateId)
                ?? eventTemplates.find(({ originatingEventId }) => originatingEventId === eventId);
            if (!template)
                return;
            ports.openLibrary?.();
            openTemplateEditor(template.id);
            renderEventTemplateLibrary();
        };
        inspectorActionDispose = ports.appendInspectorAction?.("Open in Library", activate);
        ports.announce?.(`Saved ${templateName} to Library. Open in Library is available.`);
    }
    async function reviewEventTemplateTestCaseCreation(template) {
        if (!ports.createTestCase || !mounted)
            return;
        const request = ++testCaseReviewRequest;
        await Promise.resolve(ports.createTestCase(structuredClone(template)));
        if (!mounted || request !== testCaseReviewRequest)
            return;
    }
    const renderEventTemplateLibrary = () => {
        if (!mounted)
            return;
        const visible = searchEventTemplates(eventTemplates, eventTemplateSearch?.value ?? "");
        if (templateEmptyStateElements.state)
            templateEmptyStateElements.state.hidden = visible.length > 0;
        if (templateEmptyRecovery) {
            templateEmptyRecovery.hidden = visible.length > 0;
            templateEmptyRecovery.textContent = eventTemplateSearch?.value.trim() ? "Clear template search" : "Return to Live events";
        }
        refreshPushPathReadiness();
        renderDraftValidationControls();
        if (!eventLibraryEditorElements.list)
            return;
        renderEventLibraryEditor(eventLibraryEditorElements, visible, propertyEditorState, {
            edit: (template) => { openTemplateEditor(template.id); renderEventTemplateLibrary(); },
            rename: openTemplateRename,
            duplicate: (template) => { selectedId = template.id; propertyEditorState = openPropertyEditor(template); },
            push: pushLibraryTemplate,
            delete: (template) => requestEventTemplateDeletion(template.id),
            ...(ports.createSchema ? { createSchema: ports.createSchema } : {}),
            ...(ports.createTestCase ? { createTestCase: reviewEventTemplateTestCaseCreation } : {}),
        });
    };
    function refreshPushPathReadiness() {
        const editor = propertyEditorState, target = ports.pushTarget();
        if (!editor || !target || target.accessState !== "Ready") {
            pushPathReadiness = undefined;
            pushPathReadinessRequest += 1;
            if (pushTemplateDraftButton) {
                pushTemplateDraftButton.disabled = true;
                pushTemplateDraftButton.setAttribute("aria-disabled", "true");
            }
            return;
        }
        const destination = editor.template.destination.trim(), key = `${target.id}:${destination}`;
        if (pushPathReadiness?.key === key) {
            const ready = pushPathReadiness.status === "ready";
            if (pushTemplateDraftButton) {
                pushTemplateDraftButton.disabled = !ready;
                pushTemplateDraftButton.setAttribute("aria-disabled", String(!ready));
            }
            const reason = ports.root.querySelector("#push-template-draft-reason");
            if (reason)
                reason.textContent = pushPathReadiness.message;
            return;
        }
        const request = ++pushPathReadinessRequest;
        pushPathReadiness = { key, status: "checking", message: "Checking selected-page push path." };
        if (pushTemplateDraftButton) {
            pushTemplateDraftButton.disabled = true;
            pushTemplateDraftButton.setAttribute("aria-disabled", "true");
        }
        void ports.checkPushPath(target, destination).then((result) => {
            if (!mounted || request !== pushPathReadinessRequest)
                return;
            pushPathReadiness = result.success ? { key, status: "ready", message: result.message } : { key, status: "blocked", message: result.message };
            renderEventTemplateLibrary();
        }, () => {
            if (!mounted || request !== pushPathReadinessRequest)
                return;
            pushPathReadiness = { key, status: "blocked", message: "Push path is not push-capable" };
            renderEventTemplateLibrary();
        });
    }
    function openTemplateEditor(id) {
        const template = find(id);
        templateEditorReturnTemplateId = selectedId;
        selectedId = id;
        propertyEditorState = openPropertyEditor(template);
        savedInspectorTemplateId = id;
        resetTemplateEditorDisclosures();
        refreshPushPathReadiness();
    }
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
    const pushTemplateDraft = pushCurrentTemplateDraft;
    const discardTemplateDraft = () => {
        if (propertyEditorState)
            propertyEditorState = discardDraft(propertyEditorState);
        renderEventTemplateLibrary();
    };
    function closeTemplateEditor() {
        closeEditor();
        selectedId = templateEditorReturnTemplateId;
        templateEditorReturnTemplateId = undefined;
        savedInspectorTemplateId = undefined;
        renderEventTemplateLibrary();
    }
    const recoverTemplateEmptyState = () => {
        if (eventTemplateSearch?.value.trim()) {
            eventTemplateSearch.value = "";
            renderEventTemplateLibrary();
        }
        else
            ports.backToCapturedEvent();
    };
    const backToCapturedEvent = () => ports.backToCapturedEvent();
    const refreshLibraryDraftValidation = () => {
        if (!propertyEditorState || propertyEditorState.isNew)
            return;
        const schemaId = libraryDraftSchemaSelector?.value ?? propertyEditorState.template.schemaId ?? "";
        propertyEditorState = setTemplateSchemaAttachment(propertyEditorState, schemaId);
        const result = ports.validateDraft({ schemaId, sourceId: propertyEditorState.template.sourceId,
            eventName: propertyEditorState.template.eventName, payload: structuredClone(propertyEditorState.draft) });
        setEventLibraryValidation(eventLibraryEditorElements, result.message);
        renderEventTemplateLibrary();
    };
    const selectLibraryDraftSchema = () => {
        if (!propertyEditorState || propertyEditorState.isNew || !libraryDraftSchemaSelector)
            return;
        propertyEditorState = setTemplateSchemaAttachment(propertyEditorState, libraryDraftSchemaSelector.value);
        renderEventTemplateLibrary();
    };
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
    const cancelEventLibraryDeleteFromDialog = (event) => { event.preventDefault(); cancelEventLibraryDelete(); };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            ensureDraftValidationControls();
            eventTemplateSearch?.addEventListener("input", renderEventTemplateLibrary);
            templateEmptyRecovery?.addEventListener("click", recoverTemplateEmptyState);
            addNewButton?.addEventListener("click", openNewEventEditor);
            refreshLibraryDraftValidationButton?.addEventListener("click", refreshLibraryDraftValidation);
            libraryDraftSchemaSelector?.addEventListener("change", selectLibraryDraftSchema);
            exportEventLibraryButton?.addEventListener("click", downloadEventLibrary);
            importEventLibraryButton?.addEventListener("click", loadEventLibraryFile);
            eventLibraryFile?.addEventListener("change", loadEventLibraryFile);
            clearEventLibraryButton?.addEventListener("click", requestClearEventLibrary);
            confirmEventLibraryDeleteButton?.addEventListener("click", commitEventLibraryDeletion);
            cancelEventLibraryDeleteButton?.addEventListener("click", cancelEventLibraryDelete);
            eventLibraryDeleteReview?.addEventListener("cancel", cancelEventLibraryDeleteFromDialog);
            replaceEventLibraryButton?.addEventListener("click", replaceEventLibrary);
            appendEventLibraryButton?.addEventListener("click", appendEventLibrary);
            cancelEventLibraryImportButton?.addEventListener("click", cancelEventLibraryImport);
            eventTemplateName?.addEventListener("input", updateTemplateName);
            eventTemplateEventName?.addEventListener("input", updateTemplateEventName);
            eventTemplateSource?.addEventListener("input", updateTemplateSource);
            eventTemplateJson?.addEventListener("input", updateTemplateJson);
            eventTemplatePushDestination?.addEventListener("input", updateTemplatePushDestination);
            saveTemplateRevisionButton?.addEventListener("click", openRevisionChangeReview);
            saveTemplateCopyButton?.addEventListener("click", saveTemplateCopy);
            pushTemplateDraftButton?.addEventListener("click", openPushDraftReview);
            discardTemplateDraftButton?.addEventListener("click", discardTemplateDraft);
            closeTemplateEditorButton?.addEventListener("click", requestCloseTemplateEditor);
            backToCapturedEventButton?.addEventListener("click", backToCapturedEvent);
            templateRenameName?.addEventListener("input", updateTemplateRenameName);
            templateRenameEventName?.addEventListener("input", updateTemplateRenameEventName);
            saveTemplateNamesButton?.addEventListener("click", requestTemplateRenameSave);
            cancelTemplateRenameButton?.addEventListener("click", closeTemplateRename);
            templateRenameDialog?.addEventListener("cancel", cancelTemplateRenameDialog);
            confirmTemplateRenameButton?.addEventListener("click", commitTemplateRename);
            cancelTemplateRenameReviewButton?.addEventListener("click", returnToTemplateRename);
            templateRenameReview?.addEventListener("cancel", cancelTemplateRenameReview);
            confirmPushDraftButton?.addEventListener("click", confirmPushDraft);
            cancelPushDraftButton?.addEventListener("click", cancelPushDraft);
            confirmRevisionChangeButton?.addEventListener("click", commitRevisionChangeReview);
            cancelRevisionChangeButton?.addEventListener("click", closeRevisionChangeReview);
            revisionChangeReview?.addEventListener("cancel", cancelRevisionChangeDialog);
            pushDraftReview?.addEventListener("keydown", navigatePushDraftReview);
            keepEditingTemplateButton?.addEventListener("click", keepEditingTemplate);
            saveAndCloseTemplateButton?.addEventListener("click", saveAndCloseTemplate);
            discardAndCloseTemplateButton?.addEventListener("click", discardAndCloseTemplate);
            renderEventTemplateLibrary();
            renderEventLibraryTransfer();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            eventTemplateSearch?.removeEventListener("input", renderEventTemplateLibrary);
            templateEmptyRecovery?.removeEventListener("click", recoverTemplateEmptyState);
            addNewButton?.removeEventListener("click", openNewEventEditor);
            refreshLibraryDraftValidationButton?.removeEventListener("click", refreshLibraryDraftValidation);
            libraryDraftSchemaSelector?.removeEventListener("change", selectLibraryDraftSchema);
            exportEventLibraryButton?.removeEventListener("click", downloadEventLibrary);
            importEventLibraryButton?.removeEventListener("click", loadEventLibraryFile);
            eventLibraryFile?.removeEventListener("change", loadEventLibraryFile);
            clearEventLibraryButton?.removeEventListener("click", requestClearEventLibrary);
            confirmEventLibraryDeleteButton?.removeEventListener("click", commitEventLibraryDeletion);
            cancelEventLibraryDeleteButton?.removeEventListener("click", cancelEventLibraryDelete);
            eventLibraryDeleteReview?.removeEventListener("cancel", cancelEventLibraryDeleteFromDialog);
            replaceEventLibraryButton?.removeEventListener("click", replaceEventLibrary);
            appendEventLibraryButton?.removeEventListener("click", appendEventLibrary);
            cancelEventLibraryImportButton?.removeEventListener("click", cancelEventLibraryImport);
            eventTemplateName?.removeEventListener("input", updateTemplateName);
            eventTemplateEventName?.removeEventListener("input", updateTemplateEventName);
            eventTemplateSource?.removeEventListener("input", updateTemplateSource);
            eventTemplateJson?.removeEventListener("input", updateTemplateJson);
            eventTemplatePushDestination?.removeEventListener("input", updateTemplatePushDestination);
            saveTemplateRevisionButton?.removeEventListener("click", openRevisionChangeReview);
            saveTemplateCopyButton?.removeEventListener("click", saveTemplateCopy);
            pushTemplateDraftButton?.removeEventListener("click", openPushDraftReview);
            discardTemplateDraftButton?.removeEventListener("click", discardTemplateDraft);
            closeTemplateEditorButton?.removeEventListener("click", requestCloseTemplateEditor);
            backToCapturedEventButton?.removeEventListener("click", backToCapturedEvent);
            templateRenameName?.removeEventListener("input", updateTemplateRenameName);
            templateRenameEventName?.removeEventListener("input", updateTemplateRenameEventName);
            saveTemplateNamesButton?.removeEventListener("click", requestTemplateRenameSave);
            cancelTemplateRenameButton?.removeEventListener("click", closeTemplateRename);
            templateRenameDialog?.removeEventListener("cancel", cancelTemplateRenameDialog);
            confirmTemplateRenameButton?.removeEventListener("click", commitTemplateRename);
            cancelTemplateRenameReviewButton?.removeEventListener("click", returnToTemplateRename);
            templateRenameReview?.removeEventListener("cancel", cancelTemplateRenameReview);
            confirmPushDraftButton?.removeEventListener("click", confirmPushDraft);
            cancelPushDraftButton?.removeEventListener("click", cancelPushDraft);
            confirmRevisionChangeButton?.removeEventListener("click", commitRevisionChangeReview);
            cancelRevisionChangeButton?.removeEventListener("click", closeRevisionChangeReview);
            revisionChangeReview?.removeEventListener("cancel", cancelRevisionChangeDialog);
            pushDraftReview?.removeEventListener("keydown", navigatePushDraftReview);
            keepEditingTemplateButton?.removeEventListener("click", keepEditingTemplate);
            saveAndCloseTemplateButton?.removeEventListener("click", saveAndCloseTemplate);
            discardAndCloseTemplateButton?.removeEventListener("click", discardAndCloseTemplate);
            closeEditor();
            pendingEventLibraryImport = undefined;
            pendingEventLibraryDeletion = undefined;
            replaceEventLibraryArmed = false;
            inspectorActionDispose?.();
            inspectorActionDispose = undefined;
            testCaseReviewRequest += 1;
            pushPathReadiness = undefined;
            pushPathReadinessRequest += 1;
            pendingPushDraftReview = undefined;
            pendingRevisionChangeReview = undefined;
            hideDialog(pushDraftReview);
            hideDialog(revisionChangeReview);
            if (ownsDraftValidationControls) {
                libraryDraftSchemaSelector?.remove();
                refreshLibraryDraftValidationButton?.remove();
                libraryDraftSchemaSelector = null;
                refreshLibraryDraftValidationButton = null;
                ownsDraftValidationControls = false;
            }
        },
        select(id) { find(id); selectedId = id; },
        beginDraft(id) { openTemplateEditor(id); renderEventTemplateLibrary(); },
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
        store(template) {
            const present = eventTemplates.some(({ id }) => id === template.id);
            eventTemplates = present ? eventTemplates.map((candidate) => candidate.id === template.id ? structuredClone(template) : candidate)
                : [...eventTemplates, structuredClone(template)];
            selectedId = template.id;
            persistEventTemplateLibrary();
            renderEventTemplateLibrary();
        },
        beginRename(id) { openTemplateRename(find(id)); },
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
            throw new Error("Select a template before pushing"); await pushPayloadToSelectedTargetPage(find(selectedId)); },
        appendOpenInLibraryAction,
        reviewEventTemplateTestCaseCreation,
        export: () => eventLibraryExport(eventTemplates),
        templates: () => structuredClone(eventTemplates),
        state: () => structuredClone({ ...(selectedId ? { selectedId } : {}),
            ...(propertyEditorState ? { editor: propertyEditorState } : {}), ...(pendingTemplateRename ? { rename: pendingTemplateRename } : {}),
            ...(pendingEventLibraryImport ? { pendingImport: pendingEventLibraryImport } : {}),
            ...(pendingEventLibraryDeletion ? { pendingDeletion: pendingEventLibraryDeletion } : {}),
            replaceArmed: replaceEventLibraryArmed, templates: eventTemplates,
            ...(pushPathReadiness ? { pushPathReadiness } : {}),
            ...(templateEditorReturnTemplateId ? { templateEditorReturnTemplateId } : {}), ...(savedInspectorTemplateId ? { savedInspectorTemplateId } : {}) }),
        mounted: () => mounted,
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "event-library",
    capabilities: ["templates", "editor and rename", "import and deletion review", "push"],
});
//# sourceMappingURL=index.js.map