import {
  EVENT_TEMPLATE_LIBRARY_STORAGE_KEY,
  appendImportedTemplates,
  beginTemplateRename,
  clearEventLibrary,
  createPushDraftReview,
  createTemplateChangeReview,
  createNewEventEditor,
  deleteEventTemplate,
  discardDraft,
  eventLibraryExport,
  eventLibraryImport,
  findEventLibraryEditorElements,
  openPropertyEditor,
  renderEventLibraryEditor,
  replaceImportedTemplates,
  renameValidation,
  restoreEventTemplateLibrary,
  saveAsTemplateCopy,
  saveDraftRevision,
  saveNewEvent,
  saveTemplateRename,
  searchEventTemplates,
  serializeEventTemplateLibrary,
  setEventLibraryValidation,
  setNewEventField,
  setPushDestination,
  setTemplateSchemaAttachment,
  setTemplateIdentity,
  updateDraftJson,
  type EditableEventTemplate,
  type PushDraftReview,
  type PropertyEditorState,
  type TemplateChangeReview,
  type TemplateRenameDraft,
} from "../../utilities/data-layer/event-library.js";

export interface EventLibraryInstalledPorts {
  root: ParentNode;
  storage: Pick<Storage, "getItem" | "setItem">;
  defaultPushPath(): string;
  push(template: EditableEventTemplate): Promise<void>;
  changed(): void;
  createSchema?(template: EditableEventTemplate): void;
  createTestCase?(template: EditableEventTemplate): Promise<EventLibraryTestCaseReview>;
  appendInspectorAction?(label:string, activate:() => void):() => void;
  openLibrary?():void;
  announce?(message:string):void;
  createId?(): string;
  downloadExport(exported: ReturnType<typeof eventLibraryExport>): void;
  readImportFile(): Promise<string>;
  schemas():readonly { id:string; name:string; version:number }[];
  validateDraft(draft:{ schemaId:string; sourceId:string; eventName:string; payload:unknown }):{ message:string };
  backToCapturedEvent(): void;
  pushTarget(): PushDraftReview["target"] | undefined;
  checkPushPath(target:PushDraftReview["target"], destination:string):Promise<{ success:boolean; message:string }>;
  renderPushReview(root: ParentNode, review: PushDraftReview): void;
  renderRevisionReview(root: ParentNode, review: TemplateChangeReview): void;
}

export interface EventLibraryTestCaseMapping { summary:string; events:readonly {id:string;name:string}[]; profiles:readonly {id:string;name:string;revision:number}[] }
export interface EventLibraryTestCaseReview { projects:readonly {id:string;name:string}[]; activeProjectId?:string;
  refresh(projectId:string):Promise<EventLibraryTestCaseMapping>; repair(projectId:string,kind:"events"|"profiles"):void;
  commit(input:{projectId:string;eventId:string;profileId:string}):Promise<void> }

export interface EventLibraryInstalledState {
  selectedId?: string;
  editor?: PropertyEditorState;
  rename?: { templateId: string; draft: TemplateRenameDraft };
  pendingImport?: ReturnType<typeof eventLibraryImport>;
  pendingDeletion?: { id?: string; name?: string; count: number };
  replaceArmed: boolean;
  templates: readonly EditableEventTemplate[];
  templateEditorReturnTemplateId?:string;
  savedInspectorTemplateId?:string;
}

export function createEventLibraryInstalledController(ports: EventLibraryInstalledPorts) {
  const eventLibraryEditorElements = findEventLibraryEditorElements(ports.root);
  const { search:eventTemplateSearch, addNewButton,
    templateName:eventTemplateName, eventName:eventTemplateEventName, source:eventTemplateSource,
    json:eventTemplateJson, pushDestination:eventTemplatePushDestination,
    saveRevisionButton:saveTemplateRevisionButton, saveCopyButton:saveTemplateCopyButton,
    pushDraftButton:pushTemplateDraftButton, discardDraftButton:discardTemplateDraftButton,
    closeEditorButton:closeTemplateEditorButton, backToCapturedEventButton,
  } = eventLibraryEditorElements;
  let libraryDraftSchemaSelector = ports.root.querySelector<HTMLSelectElement>("#library-draft-schema-selector");
  let refreshLibraryDraftValidationButton = ports.root.querySelector<HTMLButtonElement>("#refresh-library-draft-validation");
  let ownsDraftValidationControls = false;
  const templateEmptyStateElements = { state:ports.root.querySelector<HTMLElement>("#event-template-empty-state"),
    recovery:ports.root.querySelector<HTMLButtonElement>("#event-template-empty-recovery") };
  const templateEmptyRecovery = templateEmptyStateElements.recovery;
  const exportEventLibraryButton = ports.root.querySelector<HTMLButtonElement>("#export-event-library");
  const importEventLibraryButton = ports.root.querySelector<HTMLButtonElement>("#import-event-library");
  const eventLibraryFile = ports.root.querySelector<HTMLInputElement>("#event-library-file");
  const eventLibraryTransferResult = ports.root.querySelector<HTMLElement>("#event-library-transfer-result");
  const clearEventLibraryButton = ports.root.querySelector<HTMLButtonElement>("#clear-event-library");
  const eventLibraryDeleteReview = ports.root.querySelector<HTMLDialogElement>("#event-library-delete-review");
  const eventLibraryDeleteReviewHeading = ports.root.querySelector<HTMLElement>("#event-library-delete-review-heading");
  const eventLibraryDeleteReviewSummary = ports.root.querySelector<HTMLElement>("#event-library-delete-review-summary");
  const confirmEventLibraryDeleteButton = ports.root.querySelector<HTMLButtonElement>("#confirm-event-library-delete");
  const cancelEventLibraryDeleteButton = ports.root.querySelector<HTMLButtonElement>("#cancel-event-library-delete");
  const eventLibraryImportReview = ports.root.querySelector<HTMLDialogElement>("#event-library-import-review");
  const eventLibraryImportReviewHeading = ports.root.querySelector<HTMLElement>("#event-library-import-review-heading");
  const eventLibraryImportReviewSummary = ports.root.querySelector<HTMLElement>("#event-library-import-review-summary");
  const replaceEventLibraryButton = ports.root.querySelector<HTMLButtonElement>("#replace-event-library");
  const appendEventLibraryButton = ports.root.querySelector<HTMLButtonElement>("#append-event-library");
  const cancelEventLibraryImportButton = ports.root.querySelector<HTMLButtonElement>("#cancel-event-library-import");
  const templateRenameDialog = ports.root.querySelector<HTMLDialogElement>("#event-template-rename");
  const templateRenameHeading = ports.root.querySelector<HTMLElement>("#event-template-rename-heading");
  const templateRenameName = ports.root.querySelector<HTMLInputElement>("#event-template-rename-name");
  const templateRenameEventName = ports.root.querySelector<HTMLInputElement>("#event-template-rename-event-name");
  const templateRenameNameError = ports.root.querySelector<HTMLElement>("#event-template-rename-name-error");
  const templateRenameEventNameError = ports.root.querySelector<HTMLElement>("#event-template-rename-event-name-error");
  const saveTemplateNamesButton = ports.root.querySelector<HTMLButtonElement>("#save-template-names");
  const cancelTemplateRenameButton = ports.root.querySelector<HTMLButtonElement>("#cancel-template-rename");
  const templateRenameReview = ports.root.querySelector<HTMLDialogElement>("#event-template-rename-review");
  const templateRenameReviewHeading = ports.root.querySelector<HTMLElement>("#event-template-rename-review-heading");
  const templateRenameReviewSummary = ports.root.querySelector<HTMLElement>("#event-template-rename-review-summary");
  const confirmTemplateRenameButton = ports.root.querySelector<HTMLButtonElement>("#confirm-template-rename");
  const cancelTemplateRenameReviewButton = ports.root.querySelector<HTMLButtonElement>("#cancel-template-rename-review");
  const pushDraftReview = ports.root.querySelector<HTMLDialogElement>("#push-draft-review");
  const pushDraftReviewHeading = ports.root.querySelector<HTMLElement>("#push-draft-review-heading");
  const pushDraftReviewSummary = ports.root.querySelector<HTMLElement>("#push-draft-review-summary");
  const confirmPushDraftButton = ports.root.querySelector<HTMLButtonElement>("#confirm-push-draft");
  const cancelPushDraftButton = ports.root.querySelector<HTMLButtonElement>("#cancel-push-draft");
  const revisionChangeReview = ports.root.querySelector<HTMLDialogElement>("#revision-change-review");
  const revisionChangeReviewHeading = ports.root.querySelector<HTMLElement>("#revision-change-review-heading");
  const confirmRevisionChangeButton = ports.root.querySelector<HTMLButtonElement>("#confirm-revision-change");
  const cancelRevisionChangeButton = ports.root.querySelector<HTMLButtonElement>("#cancel-revision-change");
  const closeTemplateEditorConfirmation = ports.root.querySelector<HTMLElement>("#close-template-editor-confirmation");
  const closeTemplateEditorSummary = ports.root.querySelector<HTMLElement>("#close-template-editor-summary");
  const keepEditingTemplateButton = ports.root.querySelector<HTMLButtonElement>("#keep-editing-template");
  const saveAndCloseTemplateButton = ports.root.querySelector<HTMLButtonElement>("#save-and-close-template");
  const discardAndCloseTemplateButton = ports.root.querySelector<HTMLButtonElement>("#discard-and-close-template");
  let mounted = false;
  let eventTemplates = restoreEventTemplateLibrary(ports.storage.getItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY));
  let selectedId: string | undefined;
  let propertyEditorState: PropertyEditorState | undefined;
  let pendingTemplateRename: EventLibraryInstalledState["rename"];
  let pendingEventLibraryImport: ReturnType<typeof eventLibraryImport> | undefined;
  let pendingEventLibraryDeletion: EventLibraryInstalledState["pendingDeletion"];
  let replaceEventLibraryArmed = false;
  let pendingPushDraftReview: PushDraftReview | undefined;
  let pendingRevisionChangeReview: { editor:PropertyEditorState; review:TemplateChangeReview } | undefined;
  let templateEditorReturnTemplateId: string | undefined;
  let savedInspectorTemplateId: string | undefined;
  let pushPathReadiness:{ key:string; status:"checking" | "ready" | "blocked"; message:string } | undefined;
  let pushPathReadinessRequest = 0;
  let inspectorActionDispose:(() => void) | undefined;
  let testCaseReviewRequest = 0;
  let testCaseDialogDisposers:(() => void)[] = [];
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
  function ensureDraftValidationControls():void {
    if (libraryDraftSchemaSelector && refreshLibraryDraftValidationButton) return;
    const anchor = eventLibraryEditorElements.validation, ownerDocument = anchor?.ownerDocument;
    if (!anchor || !ownerDocument) return;
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
  function renderDraftValidationControls():void {
    ensureDraftValidationControls();
    const selectable = Boolean(propertyEditorState && !propertyEditorState.isNew);
    if (libraryDraftSchemaSelector) {
      libraryDraftSchemaSelector.hidden = !selectable;
      if (selectable) {
        const automatic = libraryDraftSchemaSelector.ownerDocument.createElement("option");
        automatic.value = ""; automatic.textContent = "Automatic schema";
        const options = ports.schemas().map((schema) => { const option = libraryDraftSchemaSelector!.ownerDocument.createElement("option");
          option.value = schema.id; option.textContent = `${schema.name} v${schema.version}`; return option; });
        libraryDraftSchemaSelector.replaceChildren(automatic, ...options);
        libraryDraftSchemaSelector.value = propertyEditorState?.template.schemaId ?? "";
      }
    }
    if (refreshLibraryDraftValidationButton) refreshLibraryDraftValidationButton.hidden = !selectable;
  }
  function hideDialog(dialog: HTMLDialogElement | null): void { if (dialog?.open) dialog.close(); if (dialog) dialog.hidden = true; }
  function showDialog(dialog: HTMLDialogElement | null, focus: HTMLElement | null): void {
    if (!dialog) return; dialog.hidden = false; if (!dialog.open) dialog.showModal(); focus?.focus();
  }
  function renderTemplateRenameValidation(): boolean {
    if (!pendingTemplateRename) return false; const errors = renameValidation(pendingTemplateRename.draft);
    for (const [input, output, error] of [[templateRenameName, templateRenameNameError, errors.templateName],
      [templateRenameEventName, templateRenameEventNameError, errors.eventName]] as const) {
      input?.setCustomValidity(error ?? ""); input?.setAttribute("aria-invalid", String(Boolean(error)));
      if (output) output.textContent = error ?? "";
    }
    const error = errors.templateName ?? errors.eventName; if (saveTemplateNamesButton) saveTemplateNamesButton.disabled = Boolean(error);
    return !error;
  }
  function openTemplateRename(template: EditableEventTemplate): void {
    pendingTemplateRename = { templateId:template.id, draft:beginTemplateRename(template) };
    if (templateRenameName) templateRenameName.value = pendingTemplateRename.draft.templateName;
    if (templateRenameEventName) templateRenameEventName.value = pendingTemplateRename.draft.eventName;
    renderTemplateRenameValidation(); showDialog(templateRenameDialog, templateRenameName ?? templateRenameHeading);
  }
  function closeTemplateRename(): void { hideDialog(templateRenameDialog); pendingTemplateRename = undefined; }
  function commitTemplateRename(): void {
    if (!pendingTemplateRename) return; const templateId = pendingTemplateRename.templateId;
    const renamed = saveTemplateRename(propertyEditorState?.template.id === templateId ? propertyEditorState : openPropertyEditor(find(templateId)),
      pendingTemplateRename.draft);
    eventTemplates = eventTemplates.map((template) => template.id === templateId ? renamed.template : template);
    if (propertyEditorState?.template.id === templateId) propertyEditorState = renamed;
    pendingTemplateRename = undefined; persistEventTemplateLibrary(); hideDialog(templateRenameDialog); hideDialog(templateRenameReview);
    renderEventTemplateLibrary();
  }
  function requestTemplateRenameSave(): void {
    if (!pendingTemplateRename || !renderTemplateRenameValidation()) return;
    const template = find(pendingTemplateRename.templateId); const nextEventName = pendingTemplateRename.draft.eventName.trim();
    if (template.eventName === nextEventName) { commitTemplateRename(); return; }
    hideDialog(templateRenameDialog);
    if (templateRenameReviewSummary) templateRenameReviewSummary.textContent =
      `${template.eventName} changes to ${nextEventName}. Future pushes use ${nextEventName}. The originating captured ${template.eventName} event remains unchanged.`;
    if (confirmTemplateRenameButton) confirmTemplateRenameButton.textContent = `Save names and use ${nextEventName}`;
    showDialog(templateRenameReview, templateRenameReviewHeading);
  }
  function returnToTemplateRename(): void { hideDialog(templateRenameReview); showDialog(templateRenameDialog, saveTemplateNamesButton); }
  const updateTemplateRenameName = (): void => { if (!pendingTemplateRename || !templateRenameName) return;
    pendingTemplateRename = { ...pendingTemplateRename, draft:{ ...pendingTemplateRename.draft, templateName:templateRenameName.value } };
    renderTemplateRenameValidation(); };
  const updateTemplateRenameEventName = (): void => { if (!pendingTemplateRename || !templateRenameEventName) return;
    pendingTemplateRename = { ...pendingTemplateRename, draft:{ ...pendingTemplateRename.draft, eventName:templateRenameEventName.value } };
    renderTemplateRenameValidation(); };
  const cancelTemplateRenameDialog = (event: Event): void => { event.preventDefault(); closeTemplateRename(); };
  const cancelTemplateRenameReview = (event: Event): void => { event.preventDefault(); returnToTemplateRename(); };
  function openRevisionChangeReview(): void {
    if (!propertyEditorState || propertyEditorState.isNew || propertyEditorState.jsonError) return;
    pendingRevisionChangeReview = { editor:structuredClone(propertyEditorState), review:createTemplateChangeReview(propertyEditorState, "revision") };
    ports.renderRevisionReview(revisionChangeReview ?? ports.root, pendingRevisionChangeReview.review);
    if (confirmRevisionChangeButton) confirmRevisionChangeButton.textContent = `Save revision ${pendingRevisionChangeReview.review.resultingVersion}`;
    showDialog(revisionChangeReview, revisionChangeReviewHeading);
  }
  function closeRevisionChangeReview(): void { pendingRevisionChangeReview = undefined; hideDialog(revisionChangeReview); saveTemplateRevisionButton?.focus(); }
  function commitRevisionChangeReview(): void {
    const pending = pendingRevisionChangeReview; if (!pending) return;
    propertyEditorState = saveDraftRevision(pending.editor);
    eventTemplates = eventTemplates.map((template) => template.id === propertyEditorState?.template.id ? propertyEditorState.template : template);
    pendingRevisionChangeReview = undefined; hideDialog(revisionChangeReview); persistEventTemplateLibrary(); renderEventTemplateLibrary();
  }
  function openPushDraftReview(): void {
    if (!propertyEditorState || propertyEditorState.jsonError) return; const target = ports.pushTarget();
    if (!target || target.accessState !== "Ready") return;
    pendingPushDraftReview = createPushDraftReview(propertyEditorState, target);
    ports.renderPushReview(pushDraftReview ?? ports.root, pendingPushDraftReview);
    if (pushDraftReviewSummary) pushDraftReviewSummary.textContent = pendingPushDraftReview.summary;
    if (confirmPushDraftButton) confirmPushDraftButton.textContent = pendingPushDraftReview.confirmLabel;
    showDialog(pushDraftReview, pushDraftReviewHeading);
  }
  async function pushPayloadToSelectedTargetPage(template:EditableEventTemplate):Promise<void> { await ports.push(structuredClone(template)); }
  function pushCurrentTemplateDraft():void { if (propertyEditorState) void pushPayloadToSelectedTargetPage(propertyEditorState.template); }
  function pushLibraryTemplate(template:EditableEventTemplate):void { selectedId = template.id; void pushPayloadToSelectedTargetPage(template); }
  const confirmPushDraft = (): void => { const pending = pendingPushDraftReview; pendingPushDraftReview = undefined;
    hideDialog(pushDraftReview); if (pending) void pushPayloadToSelectedTargetPage(pending.editor.template); };
  const cancelPushDraft = (): void => { pendingPushDraftReview = undefined; hideDialog(pushDraftReview); pushTemplateDraftButton?.focus(); };
  const cancelRevisionChangeDialog = (event: Event): void => { event.preventDefault(); closeRevisionChangeReview(); };
  const navigatePushDraftReview = (event: KeyboardEvent): void => { if (event.key === "Escape") { pendingPushDraftReview = undefined; hideDialog(pushDraftReview); } };
  function resetTemplateEditorDisclosures():void { pendingTemplateRename = undefined; pendingPushDraftReview = undefined; pendingRevisionChangeReview = undefined;
    if (closeTemplateEditorConfirmation) closeTemplateEditorConfirmation.hidden = true; hideDialog(templateRenameDialog); hideDialog(templateRenameReview);
    hideDialog(pushDraftReview); hideDialog(revisionChangeReview); }
  const closeEditor = (): void => { propertyEditorState = undefined; resetTemplateEditorDisclosures();
    if (closeTemplateEditorConfirmation) closeTemplateEditorConfirmation.hidden = true; };
  const requestCloseTemplateEditor = (): void => {
    if (!propertyEditorState?.dirty) { closeTemplateEditor(); return; }
    if (propertyEditorState.isNew) { if (saveAndCloseTemplateButton) saveAndCloseTemplateButton.textContent = "Save new event";
      if (discardAndCloseTemplateButton) discardAndCloseTemplateButton.textContent = "Discard new event"; }
    if (closeTemplateEditorSummary) closeTemplateEditorSummary.textContent =
      `Unsaved changes: ${Object.keys(propertyEditorState.draft as Record<string, unknown>).join(", ")}.`;
    if (closeTemplateEditorConfirmation) closeTemplateEditorConfirmation.hidden = false;
  };
  const keepEditingTemplate = (): void => { if (closeTemplateEditorConfirmation) closeTemplateEditorConfirmation.hidden = true; };
  const saveAndCloseTemplate = (): void => {
    if (!propertyEditorState) return;
    if (propertyEditorState.isNew) { const saved = saveNewEvent(propertyEditorState, createId); eventTemplates = [...eventTemplates, saved]; }
    else { const saved = saveDraftRevision(propertyEditorState); eventTemplates = eventTemplates.map((template) => template.id === saved.template.id ? saved.template : template); }
    persistEventTemplateLibrary(); closeTemplateEditor();
  };
  const discardAndCloseTemplate = (): void => { closeTemplateEditor(); };
  const renderEventLibraryTransfer = (): void => {
    if (eventLibraryTransferResult) eventLibraryTransferResult.textContent = pendingEventLibraryImport
      ? `${pendingEventLibraryImport.templates.length} templates ready to import` : "";
    if (eventLibraryImportReviewHeading) eventLibraryImportReviewHeading.textContent = replaceEventLibraryArmed
      ? "Confirm replacement" : "Review Event Library import";
    if (eventLibraryImportReviewSummary) eventLibraryImportReviewSummary.textContent = pendingEventLibraryImport
      ? `${pendingEventLibraryImport.templates.length} imported templates` : "";
    if (eventLibraryDeleteReviewHeading) eventLibraryDeleteReviewHeading.textContent = pendingEventLibraryDeletion?.id
      ? "Delete event template?" : "Clear Event Library?";
    if (eventLibraryDeleteReviewSummary) eventLibraryDeleteReviewSummary.textContent = pendingEventLibraryDeletion
      ? `${pendingEventLibraryDeletion.count} template${pendingEventLibraryDeletion.count === 1 ? "" : "s"}` : "";
  };
  const reviewEventLibraryImport = (serialized: string): void => {
    pendingEventLibraryImport = eventLibraryImport(serialized); replaceEventLibraryArmed = false;
    renderEventLibraryTransfer(); eventLibraryImportReview?.showModal();
  };
  const commitEventLibraryImport = (mode: "replace" | "append"): void => {
    if (!pendingEventLibraryImport) throw new Error("Review an import before committing");
    if (mode === "replace") {
      if (!replaceEventLibraryArmed) { replaceEventLibraryArmed = true; return; }
      eventTemplates = replaceImportedTemplates(eventTemplates, pendingEventLibraryImport.templates);
    } else eventTemplates = appendImportedTemplates(eventTemplates, pendingEventLibraryImport.templates, createId).templates;
    pendingEventLibraryImport = undefined; replaceEventLibraryArmed = false; closeEditor();
    eventLibraryImportReview?.close(); renderEventLibraryTransfer(); persistEventTemplateLibrary();
  };
  const requestEventTemplateDeletion = (id?: string): void => {
    pendingEventLibraryDeletion = id ? { id, name:find(id).name, count:1 } : { count:eventTemplates.length };
    renderEventLibraryTransfer(); eventLibraryDeleteReview?.showModal();
  };
  const commitEventLibraryDeletion = (): void => {
    if (!pendingEventLibraryDeletion) return;
    eventTemplates = pendingEventLibraryDeletion.id
      ? deleteEventTemplate(eventTemplates, pendingEventLibraryDeletion.id) : clearEventLibrary(eventTemplates);
    if (!pendingEventLibraryDeletion.id || selectedId === pendingEventLibraryDeletion.id) selectedId = undefined;
    if (!pendingEventLibraryDeletion.id || propertyEditorState?.template.id === pendingEventLibraryDeletion.id) closeEditor();
    pendingEventLibraryDeletion = undefined; eventLibraryDeleteReview?.close(); renderEventLibraryTransfer(); persistEventTemplateLibrary();
  };
  function appendOpenInLibraryAction(eventId:string, templateName:string):void {
    inspectorActionDispose?.(); inspectorActionDispose = undefined;
    const activate = ():void => {
      if (!mounted) return;
      const template = eventTemplates.find(({ id }) => id === savedInspectorTemplateId)
        ?? eventTemplates.find(({ originatingEventId }) => originatingEventId === eventId);
      if (!template) return;
      ports.openLibrary?.(); openTemplateEditor(template.id); renderEventTemplateLibrary();
    };
    inspectorActionDispose = ports.appendInspectorAction?.("Open in Library", activate);
    ports.announce?.(`Saved ${templateName} to Library. Open in Library is available.`);
  }
  async function reviewEventTemplateTestCaseCreation(template:EditableEventTemplate):Promise<void> {
    if (!ports.createTestCase || !mounted) return;
    const request = ++testCaseReviewRequest;
    let review:EventLibraryTestCaseReview; try { review=await ports.createTestCase(structuredClone(template)); }
    catch(error){if(mounted&&request===testCaseReviewRequest&&eventLibraryTransferResult)eventLibraryTransferResult.textContent=error instanceof Error?error.message:String(error);return;}
    const document=eventLibraryEditorElements.list?.ownerDocument;if(!mounted||request!==testCaseReviewRequest||!document)return;
    for(const dispose of testCaseDialogDisposers.splice(0))dispose();
    const dialog=document.createElement("dialog"),heading=document.createElement("h3"),summary=document.createElement("p"),projectLabel=document.createElement("label"),projectSelect=document.createElement("select"),
      eventLabel=document.createElement("label"),eventSelect=document.createElement("select"),schemaLabel=document.createElement("label"),schemaSelect=document.createElement("select"),confirm=document.createElement("button"),cancel=document.createElement("button"),repair=document.createElement("button");
    heading.textContent=`Create Test case from ${template.name}`;summary.textContent="Choose the destination project, then review the matching named Event and input-guidance schema. The Library template remains unchanged.";
    projectLabel.append("Project",projectSelect);eventLabel.append("Matching Event",eventSelect);schemaLabel.append("Input-guidance schema",schemaSelect);confirm.type=cancel.type=repair.type="button";
    confirm.textContent="Create Event validation Test case";cancel.textContent="Cancel";repair.textContent="Open Specification Studio to create, adopt, or select missing relationships";repair.hidden=true;
    for(const project of review.projects){const option=document.createElement("option");option.value=project.id;option.textContent=project.name;projectSelect.append(option);}projectSelect.value=review.activeProjectId??review.projects[0]?.id??"";
    const listen=(control:HTMLElement,type:string,listener:EventListener):void=>{control.addEventListener(type,listener);testCaseDialogDisposers.push(()=>control.removeEventListener(type,listener));};
    const close=():void=>{for(const dispose of testCaseDialogDisposers.splice(0))dispose();dialog.close();dialog.remove();};
    const refresh=async():Promise<void>=>{const refreshRequest=++testCaseReviewRequest,projectId=projectSelect.value;confirm.disabled=true;repair.hidden=true;
      const loadingEvent=document.createElement("option"),loadingSchema=document.createElement("option");loadingEvent.textContent="Loading matching Events…";loadingSchema.textContent="Loading schema relationships…";eventSelect.replaceChildren(loadingEvent);schemaSelect.replaceChildren(loadingSchema);
      try{const mapping=await review.refresh(projectId);if(!mounted||refreshRequest!==testCaseReviewRequest)return;
        const eventEmpty=document.createElement("option"),schemaEmpty=document.createElement("option");eventEmpty.value=schemaEmpty.value="";eventEmpty.textContent=mapping.events.length?"Choose reviewed Event":"No matching Event";schemaEmpty.textContent=mapping.profiles.length?"Choose reviewed input guidance":"No matching project schema";
        eventSelect.replaceChildren(eventEmpty,...mapping.events.map((entry)=>{const option=document.createElement("option");option.value=entry.id;option.textContent=entry.name;return option;}));schemaSelect.replaceChildren(schemaEmpty,...mapping.profiles.map((entry)=>{const option=document.createElement("option");option.value=entry.id;option.textContent=`${entry.name} revision ${entry.revision}`;return option;}));
        if(mapping.events.length===1)eventSelect.value=mapping.events[0]!.id;if(mapping.profiles.length===1)schemaSelect.value=mapping.profiles[0]!.id;confirm.disabled=!(mapping.events.length&&mapping.profiles.length);repair.hidden=!confirm.disabled;summary.textContent=mapping.summary;
      }catch(error){if(mounted&&refreshRequest===testCaseReviewRequest){summary.textContent=error instanceof Error?error.message:String(error);repair.hidden=false;}}};
    const updateReady=():void=>{confirm.disabled=!(eventSelect.value&&schemaSelect.value);};listen(projectSelect,"change",()=>{void refresh();});listen(eventSelect,"change",updateReady);listen(schemaSelect,"change",updateReady);
    listen(repair,"click",()=>review.repair(projectSelect.value,eventSelect.value?"profiles":"events"));listen(confirm,"click",()=>{confirm.disabled=true;void review.commit({projectId:projectSelect.value,eventId:eventSelect.value,profileId:schemaSelect.value}).then(()=>{if(mounted)close();},(error)=>{if(mounted){confirm.disabled=false;summary.textContent=error instanceof Error?error.message:String(error);}});});listen(cancel,"click",close);
    dialog.append(heading,summary,projectLabel,eventLabel,schemaLabel,confirm,repair,cancel);document.body.append(dialog);dialog.showModal();heading.tabIndex=-1;heading.focus();void refresh();
  }
  const renderEventTemplateLibrary = (): void => {
    if (!mounted) return;
    const visible = searchEventTemplates(eventTemplates, eventTemplateSearch?.value ?? "");
    if (templateEmptyStateElements.state) templateEmptyStateElements.state.hidden = visible.length > 0;
    if (templateEmptyRecovery) { templateEmptyRecovery.hidden = visible.length > 0;
      templateEmptyRecovery.textContent = eventTemplateSearch?.value.trim() ? "Clear template search" : "Return to Live events"; }
    refreshPushPathReadiness();
    renderDraftValidationControls();
    if (!eventLibraryEditorElements.list) return;
    renderEventLibraryEditor(eventLibraryEditorElements, visible, propertyEditorState, {
      edit:(template) => { openTemplateEditor(template.id); renderEventTemplateLibrary(); },
      rename:openTemplateRename,
      duplicate:(template) => { selectedId = template.id; propertyEditorState = openPropertyEditor(template); },
      push:pushLibraryTemplate,
      delete:(template) => requestEventTemplateDeletion(template.id),
      ...(ports.createSchema ? { createSchema:ports.createSchema } : {}),
      ...(ports.createTestCase ? { createTestCase:reviewEventTemplateTestCaseCreation } : {}),
    });
  };
  function refreshPushPathReadiness():void {
    const editor = propertyEditorState, target = ports.pushTarget();
    if (!editor || !target || target.accessState !== "Ready") { pushPathReadiness = undefined; pushPathReadinessRequest += 1;
      if (pushTemplateDraftButton) { pushTemplateDraftButton.disabled = true; pushTemplateDraftButton.setAttribute("aria-disabled", "true"); } return; }
    const destination = editor.template.destination.trim(), key = `${target.id}:${destination}`;
    if (pushPathReadiness?.key === key) { const ready = pushPathReadiness.status === "ready";
      if (pushTemplateDraftButton) { pushTemplateDraftButton.disabled = !ready; pushTemplateDraftButton.setAttribute("aria-disabled", String(!ready)); }
      const reason = ports.root.querySelector<HTMLElement>("#push-template-draft-reason"); if (reason) reason.textContent = pushPathReadiness.message; return; }
    const request = ++pushPathReadinessRequest; pushPathReadiness = { key, status:"checking", message:"Checking selected-page push path." };
    if (pushTemplateDraftButton) { pushTemplateDraftButton.disabled = true; pushTemplateDraftButton.setAttribute("aria-disabled", "true"); }
    void ports.checkPushPath(target, destination).then((result) => { if (!mounted || request !== pushPathReadinessRequest) return;
      pushPathReadiness = result.success ? { key, status:"ready", message:result.message } : { key, status:"blocked", message:result.message };
      renderEventTemplateLibrary(); }, () => { if (!mounted || request !== pushPathReadinessRequest) return;
      pushPathReadiness = { key, status:"blocked", message:"Push path is not push-capable" }; renderEventTemplateLibrary(); });
  }
  function openTemplateEditor(id:string):void { const template = find(id); templateEditorReturnTemplateId = selectedId; selectedId = id;
    propertyEditorState = openPropertyEditor(template); savedInspectorTemplateId = id; resetTemplateEditorDisclosures(); refreshPushPathReadiness(); }
  const openNewEventEditor = (): void => { selectedId = undefined;
    propertyEditorState = createNewEventEditor(ports.defaultPushPath()); renderEventTemplateLibrary(); };
  const updateTemplateName = (): void => { if (!propertyEditorState) return;
    propertyEditorState = propertyEditorState.isNew
      ? setNewEventField(propertyEditorState, "name", eventTemplateName?.value ?? "")
      : setTemplateIdentity(propertyEditorState, "name", eventTemplateName?.value ?? ""); renderEventTemplateLibrary(); };
  const updateTemplateEventName = (): void => { if (!propertyEditorState) return;
    propertyEditorState = propertyEditorState.isNew
      ? setNewEventField(propertyEditorState, "eventName", eventTemplateEventName?.value ?? "")
      : setTemplateIdentity(propertyEditorState, "eventName", eventTemplateEventName?.value ?? ""); renderEventTemplateLibrary(); };
  const updateTemplateSource = (): void => { if (!propertyEditorState?.isNew) return;
    const option = eventTemplateSource?.selectedOptions[0];
    propertyEditorState = setNewEventField(propertyEditorState, "source",
      { id:eventTemplateSource?.value ?? "", name:option?.textContent ?? eventTemplateSource?.value ?? "" }); renderEventTemplateLibrary(); };
  const updateTemplateJson = (): void => { if (!propertyEditorState) return;
    propertyEditorState = updateDraftJson(propertyEditorState, eventTemplateJson?.value ?? ""); renderEventTemplateLibrary(); };
  const updateTemplatePushDestination = (): void => { if (!propertyEditorState) return;
    propertyEditorState = setPushDestination(propertyEditorState, eventTemplatePushDestination?.value ?? ""); renderEventTemplateLibrary(); };
  const saveTemplateRevision = (): void => { if (!propertyEditorState) return;
    propertyEditorState = saveDraftRevision(propertyEditorState);
    eventTemplates = eventTemplates.map((candidate) => candidate.id === propertyEditorState?.template.id
      ? propertyEditorState.template : candidate); persistEventTemplateLibrary(); renderEventTemplateLibrary(); };
  const saveTemplateCopy = (): void => { if (!propertyEditorState) return;
    const copy = { ...saveAsTemplateCopy(propertyEditorState, `${propertyEditorState.template.name} copy`), id:createId() };
    eventTemplates = [...eventTemplates, copy]; persistEventTemplateLibrary(); renderEventTemplateLibrary(); };
  const pushTemplateDraft = pushCurrentTemplateDraft;
  const discardTemplateDraft = (): void => { if (propertyEditorState) propertyEditorState = discardDraft(propertyEditorState);
    renderEventTemplateLibrary(); };
  function closeTemplateEditor():void { closeEditor(); selectedId = templateEditorReturnTemplateId; templateEditorReturnTemplateId = undefined;
    savedInspectorTemplateId = undefined; renderEventTemplateLibrary(); }
  const recoverTemplateEmptyState = ():void => { if (eventTemplateSearch?.value.trim()) { eventTemplateSearch.value = ""; renderEventTemplateLibrary(); }
    else ports.backToCapturedEvent(); };
  const backToCapturedEvent = (): void => ports.backToCapturedEvent();
  const refreshLibraryDraftValidation = (): void => {
    if (!propertyEditorState || propertyEditorState.isNew) return;
    const schemaId = libraryDraftSchemaSelector?.value ?? propertyEditorState.template.schemaId ?? "";
    propertyEditorState = setTemplateSchemaAttachment(propertyEditorState, schemaId);
    const result = ports.validateDraft({ schemaId, sourceId:propertyEditorState.template.sourceId,
      eventName:propertyEditorState.template.eventName, payload:structuredClone(propertyEditorState.draft) });
    setEventLibraryValidation(eventLibraryEditorElements, result.message);
    renderEventTemplateLibrary();
  };
  const selectLibraryDraftSchema = ():void => {
    if (!propertyEditorState || propertyEditorState.isNew || !libraryDraftSchemaSelector) return;
    propertyEditorState = setTemplateSchemaAttachment(propertyEditorState, libraryDraftSchemaSelector.value);
    renderEventTemplateLibrary();
  };
  function downloadEventLibrary(): void { ports.downloadExport(eventLibraryExport(eventTemplates)); }
  const loadEventLibraryFile = async (): Promise<void> => reviewEventLibraryImport(await ports.readImportFile());
  const requestClearEventLibrary = (): void => requestEventTemplateDeletion();
  const replaceEventLibrary = (): void => commitEventLibraryImport("replace");
  const appendEventLibrary = (): void => commitEventLibraryImport("append");
  const cancelEventLibraryImport = (): void => { pendingEventLibraryImport = undefined; replaceEventLibraryArmed = false;
    eventLibraryImportReview?.close(); renderEventLibraryTransfer(); };
  const cancelEventLibraryDelete = (): void => { pendingEventLibraryDeletion = undefined;
    eventLibraryDeleteReview?.close(); renderEventLibraryTransfer(); };
  const cancelEventLibraryDeleteFromDialog = (event:Event):void => { event.preventDefault(); cancelEventLibraryDelete(); };

  return {
    mount(): void {
      if (mounted) return; mounted = true;
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
      renderEventTemplateLibrary(); renderEventLibraryTransfer();
    },
    dispose(): void {
      if (!mounted) return; mounted = false;
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
      closeEditor(); pendingEventLibraryImport = undefined; pendingEventLibraryDeletion = undefined; replaceEventLibraryArmed = false;
      inspectorActionDispose?.(); inspectorActionDispose = undefined; testCaseReviewRequest += 1;
      for(const dispose of testCaseDialogDisposers.splice(0))dispose();
      pushPathReadiness = undefined; pushPathReadinessRequest += 1;
      pendingPushDraftReview = undefined; pendingRevisionChangeReview = undefined;
      hideDialog(pushDraftReview); hideDialog(revisionChangeReview);
      if (ownsDraftValidationControls) {
        libraryDraftSchemaSelector?.remove(); refreshLibraryDraftValidationButton?.remove();
        libraryDraftSchemaSelector = null; refreshLibraryDraftValidationButton = null; ownsDraftValidationControls = false;
      }
    },
    select(id: string): void { find(id); selectedId = id; },
    beginDraft(id:string):void { openTemplateEditor(id); renderEventTemplateLibrary(); },
    beginNew:openNewEventEditor,
    discardDraft(): void { if (propertyEditorState) propertyEditorState = discardDraft(propertyEditorState); },
    saveRevision(): EditableEventTemplate {
      if (!propertyEditorState) throw new Error("Open a template before saving a revision");
      saveTemplateRevision(); return structuredClone(propertyEditorState.template);
    },
    saveNew(): EditableEventTemplate {
      if (!propertyEditorState?.isNew) throw new Error("Open a new event draft before saving");
      const saved = saveNewEvent(propertyEditorState, createId); eventTemplates = [...eventTemplates, saved];
      selectedId = saved.id; propertyEditorState = openPropertyEditor(saved); persistEventTemplateLibrary(); renderEventTemplateLibrary(); return structuredClone(saved);
    },
    saveCopy(name: string): EditableEventTemplate {
      if (!propertyEditorState) throw new Error("Open a template before saving a copy");
      const copy = { ...saveAsTemplateCopy(propertyEditorState, name), id:createId() };
      eventTemplates = [...eventTemplates, copy]; persistEventTemplateLibrary(); renderEventTemplateLibrary(); return structuredClone(copy);
    },
    store(template:EditableEventTemplate):void {
      const present=eventTemplates.some(({ id }) => id === template.id);
      eventTemplates=present ? eventTemplates.map((candidate) => candidate.id === template.id ? structuredClone(template) : candidate)
        : [...eventTemplates, structuredClone(template)];
      selectedId=template.id; persistEventTemplateLibrary(); renderEventTemplateLibrary();
    },
    beginRename(id: string): void { openTemplateRename(find(id)); },
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
    cancelDelete:cancelEventLibraryDelete,
    async pushSelected(): Promise<void> { if (!selectedId) throw new Error("Select a template before pushing"); await pushPayloadToSelectedTargetPage(find(selectedId)); },
    appendOpenInLibraryAction,
    reviewEventTemplateTestCaseCreation,
    export:() => eventLibraryExport(eventTemplates),
    templates:(): readonly EditableEventTemplate[] => structuredClone(eventTemplates),
    state:(): EventLibraryInstalledState => structuredClone({ ...(selectedId ? { selectedId } : {}),
      ...(propertyEditorState ? { editor:propertyEditorState } : {}), ...(pendingTemplateRename ? { rename:pendingTemplateRename } : {}),
      ...(pendingEventLibraryImport ? { pendingImport:pendingEventLibraryImport } : {}),
      ...(pendingEventLibraryDeletion ? { pendingDeletion:pendingEventLibraryDeletion } : {}),
      replaceArmed:replaceEventLibraryArmed, templates:eventTemplates,
      ...(pushPathReadiness ? { pushPathReadiness } : {}),
      ...(templateEditorReturnTemplateId ? { templateEditorReturnTemplateId } : {}), ...(savedInspectorTemplateId ? { savedInspectorTemplateId } : {}) }),
    mounted:() => mounted,
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"event-library",
  capabilities:["templates", "editor and rename", "import and deletion review", "push"],
});
