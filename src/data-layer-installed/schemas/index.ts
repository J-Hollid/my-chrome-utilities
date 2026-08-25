import {
  SCHEMA_LIBRARY_STORAGE_KEY,
  discardSchemaWorkingDraft,
  duplicateSchemaRevision,
  filterAndSortSchemaPropertyRows,
  inspectSchemaPropertyRemoval,
  inspectSchemaRename,
  proposeSchemaWorkingDraftName,
  publishSchemaWorkingDraft,
  removeSchemaProperty,
  restoreSchemaRevisionDraft,
  schemaPropertyRows,
  schemaPropertyCopySource,
  restoreSchemaLibrary,
  searchSchemas,
  serializeSchemaLibrary,
  setSchemaDescription as updateSchemaDescription,
  setPropertyDocumentation,
  undoSchemaPropertyRemoval,
  undoSchemaPropertyCopy,
  updateSchemaWorkingDraft,
  validateEvent,
  type SchemaDefinition,
  type SchemaPropertySortOrder,
  type SchemaPropertyRemoval,
  type AppliedSchemaPropertyCopy,
  type SchemaWorkingDraft,
} from "../../utilities/data-layer/schemas.js";
import { applySchemaPropertyCopy, planSchemaPropertyCopy, type SchemaPropertyCopyPlan } from "../../data-layer-schema-property-copy.js";

export interface SchemasInstalledPorts {
  root: ParentNode;
  storage: Pick<Storage, "getItem" | "setItem">;
  changed(schemas: readonly SchemaDefinition[]): void;
  runGuidedValidation(schemaId?: string): Promise<void>;
  subscribe(listener: () => void): () => void;
}

export function createSchemasInstalledController(ports: SchemasInstalledPorts) {
  const schemaSearch = ports.root.querySelector<HTMLInputElement>("#schema-search");
  const schemaCategoryFilter = ports.root.querySelector<HTMLSelectElement>("#schema-category-filter");
  const schemaCount = ports.root.querySelector<HTMLElement>("#schema-count");
  const schemaList = ports.root.querySelector<HTMLElement>("#schema-list");
  const schemaResult = ports.root.querySelector<HTMLElement>("#schema-result");
  const schemaEditor = ports.root.querySelector<HTMLElement>("#schema-editor");
  const schemaDetail = ports.root.querySelector<HTMLElement>("#schema-detail");
  const sidePanelLayeredProfileEditorHost = ports.root.querySelector<HTMLElement>("#side-panel-layered-profile-editor");
  const liveEventQuery = ports.root.querySelector<HTMLElement>("#live-event-query");
  const schemaSubviews = Array.from(ports.root.querySelectorAll<HTMLButtonElement>("#schema-subviews [role=tab]"));
  const schemaPanels = Array.from(ports.root.querySelectorAll<HTMLElement>("#schema-master, #schema-rule-library, #schema-assignments"));
  if (sidePanelLayeredProfileEditorHost && schemaDetail && !schemaDetail.contains(sidePanelLayeredProfileEditorHost)) {
    schemaDetail.prepend(sidePanelLayeredProfileEditorHost);
  }
  const schemaDetailEmpty = ports.root.querySelector<HTMLElement>("#schema-detail-empty");
  const schemaEditorName = ports.root.querySelector<HTMLInputElement>("#schema-editor-name");
  const schemaEditorNameAssistance = ports.root.querySelector<HTMLOutputElement>("#schema-editor-name-assistance");
  const schemaEditorDescription = ports.root.querySelector<HTMLTextAreaElement>("#schema-editor-description");
  const saveSchemaDescriptionButton = ports.root.querySelector<HTMLButtonElement>("#save-schema-description");
  const schemaDescriptionOrigin = ports.root.querySelector<HTMLElement>("#schema-description-origin");
  const schemaEditorTarget = ports.root.querySelector<HTMLSelectElement>("#schema-editor-target");
  const saveSchemaButton = ports.root.querySelector<HTMLButtonElement>("#save-schema");
  const saveSchemaReason = ports.root.querySelector<HTMLElement>("#save-schema-reason");
  const schemaRevisionReview = ports.root.querySelector<HTMLDialogElement>("#schema-revision-review");
  const schemaRevisionReviewSummary = ports.root.querySelector<HTMLElement>("#schema-revision-review-summary");
  const confirmSchemaRevisionButton = ports.root.querySelector<HTMLButtonElement>("#confirm-schema-revision");
  const cancelSchemaRevisionButton = ports.root.querySelector<HTMLButtonElement>("#cancel-schema-revision");
  const schemaCloseReview = ports.root.querySelector<HTMLDialogElement>("#close-schema-editor-review");
  const schemaCloseReviewSummary = ports.root.querySelector<HTMLElement>("#schema-close-review-summary");
  const discardSchemaDraftButton = ports.root.querySelector<HTMLButtonElement>("#discard-schema-draft");
  const keepEditingSchemaButton = ports.root.querySelector<HTMLButtonElement>("#keep-editing-schema");
  const closeSchemaEditorButton = ports.root.querySelector<HTMLButtonElement>("#close-schema-editor");
  const saveAndCloseSchemaButton = ports.root.querySelector<HTMLButtonElement>("#save-and-close-schema");
  const saveSchemaCloseReviewButton = ports.root.querySelector<HTMLButtonElement>("#save-schema-close-review");
  const discardWorkingSchemaDraftButton = ports.root.querySelector<HTMLButtonElement>("#discard-working-schema-draft");
  const schemaRevisionSelector = ports.root.querySelector<HTMLSelectElement>("#schema-revision-selector");
  const schemaRevisionComparison = ports.root.querySelector<HTMLElement>("#schema-revision-comparison");
  const duplicateSchemaRevisionButton = ports.root.querySelector<HTMLButtonElement>("#duplicate-schema-revision");
  const restoreSchemaRevisionButton = ports.root.querySelector<HTMLButtonElement>("#restore-schema-revision");
  const addSchemaPropertyButton = ports.root.querySelector<HTMLButtonElement>("#add-schema-property");
  const schemaOwnerDocument = (ports.root as ParentNode & { ownerDocument?:Document }).ownerDocument
    ?? ("createElement" in ports.root ? ports.root as Document : undefined);
  const ownedElement = <K extends keyof HTMLElementTagNameMap>(selector: string, tag: K): HTMLElementTagNameMap[K] | null =>
    ports.root.querySelector<HTMLElementTagNameMap[K]>(selector) ?? schemaOwnerDocument?.createElement(tag) ?? null;
  const schemaPropertyViewControls = ownedElement("#schema-property-view-controls", "div");
  const schemaPropertyFilterLabel = ownedElement("#schema-property-filter-label", "label");
  const schemaPropertyFilter = ownedElement("#schema-property-filter", "input");
  const schemaPropertySortLabel = ownedElement("#schema-property-sort-label", "label");
  const schemaPropertySort = ownedElement("#schema-property-sort", "select");
  const schemaPropertyResultStatus = ownedElement("#schema-property-result-status", "output");
  const schemaPropertyEmpty = ownedElement("#schema-property-empty", "div");
  const schemaPropertyEmptyMessage = ownedElement("#schema-property-empty-message", "p");
  const clearSchemaPropertyFilter = ownedElement("#clear-schema-property-filter", "button");
  const schemaPropertyTree = ownedElement("#schema-property-tree", "ul");
  const schemaPropertyRemovalFeedback = ownedElement("#schema-property-removal-feedback", "output");
  const undoSchemaPropertyRemovalButton = ownedElement("#undo-schema-property-removal", "button");
  const schemaPropertyCopyFeedback = ownedElement("#schema-property-copy-feedback", "output");
  const undoSchemaPropertyCopyButton = ownedElement("#undo-schema-property-copy", "button");
  const schemaPropertyCopyDialog = ownedElement("#schema-property-copy-dialog", "dialog");
  const schemaPropertyRemovalDialog = ownedElement("#schema-property-removal-dialog", "dialog");
  const schemaPropertyRemovalHeading = ownedElement("#schema-property-removal-heading", "h4");
  const schemaPropertyRemovalSummary = ownedElement("#schema-property-removal-summary", "output");
  const confirmSchemaPropertyRemovalButton = ownedElement("#confirm-schema-property-removal", "button");
  const cancelSchemaPropertyRemovalButton = ownedElement("#cancel-schema-property-removal", "button");
  const schemaDocumentationRemovalDialog = ownedElement("#schema-documentation-removal-dialog", "dialog");
  const schemaDocumentationRemovalHeading = ownedElement("#schema-documentation-removal-heading", "h4");
  const schemaDocumentationRemovalSummary = ownedElement("#schema-documentation-removal-summary", "p");
  const confirmSchemaDocumentationRemoval = ownedElement("#confirm-schema-documentation-removal", "button");
  const cancelSchemaDocumentationRemoval = ownedElement("#cancel-schema-documentation-removal", "button");
  if (schemaPropertyViewControls && !schemaPropertyViewControls.isConnected) {
    schemaPropertyViewControls.id = "schema-property-view-controls";
    if (schemaPropertyFilterLabel) { schemaPropertyFilterLabel.id = "schema-property-filter-label";
      schemaPropertyFilterLabel.htmlFor = "schema-property-filter"; schemaPropertyFilterLabel.textContent = "Filter properties"; }
    if (schemaPropertyFilter) { schemaPropertyFilter.id = "schema-property-filter"; schemaPropertyFilter.type = "search"; }
    if (schemaPropertySortLabel) { schemaPropertySortLabel.id = "schema-property-sort-label";
      schemaPropertySortLabel.htmlFor = "schema-property-sort"; schemaPropertySortLabel.textContent = "Sort properties"; }
    if (schemaPropertySort) { schemaPropertySort.id = "schema-property-sort";
      for (const [value, label] of [["schema", "Schema order"], ["name-asc", "Name A-Z"], ["name-desc", "Name Z-A"]] as const) {
        const option = schemaOwnerDocument?.createElement("option"); if (option) { option.value = value; option.textContent = label; schemaPropertySort.append(option); }
      } }
    if (schemaPropertyResultStatus) { schemaPropertyResultStatus.id = "schema-property-result-status";
      schemaPropertyResultStatus.setAttribute("aria-live", "polite"); }
    const propertyControls: Array<Node | null> = [schemaPropertyFilterLabel, schemaPropertyFilter, schemaPropertySortLabel,
      schemaPropertySort, schemaPropertyResultStatus];
    schemaPropertyViewControls.append(...propertyControls.filter((element): element is Node => element !== null));
    addSchemaPropertyButton?.before(schemaPropertyViewControls);
  }
  if (schemaPropertyEmpty && !schemaPropertyEmpty.isConnected) {
    schemaPropertyEmpty.id = "schema-property-empty"; schemaPropertyEmpty.hidden = true;
    if (schemaPropertyEmptyMessage) { schemaPropertyEmptyMessage.id = "schema-property-empty-message"; schemaPropertyEmpty.append(schemaPropertyEmptyMessage); }
    if (clearSchemaPropertyFilter) { clearSchemaPropertyFilter.id = "clear-schema-property-filter";
      clearSchemaPropertyFilter.type = "button"; clearSchemaPropertyFilter.textContent = "Clear filter"; schemaPropertyEmpty.append(clearSchemaPropertyFilter); }
    addSchemaPropertyButton?.before(schemaPropertyEmpty);
  }
  if (schemaPropertyTree && !schemaPropertyTree.isConnected) { schemaPropertyTree.id = "schema-property-tree";
    addSchemaPropertyButton?.after(schemaPropertyTree); }
  if (schemaPropertyCopyDialog && !schemaPropertyCopyDialog.isConnected) {
    schemaPropertyCopyDialog.id = "schema-property-copy-dialog"; schemaOwnerDocument?.body.append(schemaPropertyCopyDialog);
  }
  if (schemaPropertyRemovalDialog && !schemaPropertyRemovalDialog.isConnected) {
    schemaPropertyRemovalDialog.id = "schema-property-removal-dialog";
    if (schemaPropertyRemovalHeading) { schemaPropertyRemovalHeading.id = "schema-property-removal-heading";
      schemaPropertyRemovalHeading.textContent = "Remove property?"; schemaPropertyRemovalDialog.append(schemaPropertyRemovalHeading); }
    if (schemaPropertyRemovalSummary) { schemaPropertyRemovalSummary.id = "schema-property-removal-summary";
      schemaPropertyRemovalDialog.append(schemaPropertyRemovalSummary); }
    if (confirmSchemaPropertyRemovalButton) { confirmSchemaPropertyRemovalButton.id = "confirm-schema-property-removal";
      confirmSchemaPropertyRemovalButton.textContent = "Remove property"; schemaPropertyRemovalDialog.append(confirmSchemaPropertyRemovalButton); }
    if (cancelSchemaPropertyRemovalButton) { cancelSchemaPropertyRemovalButton.id = "cancel-schema-property-removal";
      cancelSchemaPropertyRemovalButton.textContent = "Cancel"; schemaPropertyRemovalDialog.append(cancelSchemaPropertyRemovalButton); }
    schemaOwnerDocument?.body.append(schemaPropertyRemovalDialog);
  }
  if (schemaDocumentationRemovalDialog && !schemaDocumentationRemovalDialog.isConnected) {
    schemaDocumentationRemovalDialog.id = "schema-documentation-removal-dialog";
    if (schemaDocumentationRemovalHeading) { schemaDocumentationRemovalHeading.id = "schema-documentation-removal-heading";
      schemaDocumentationRemovalHeading.textContent = "Remove property documentation?"; schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalHeading); }
    if (schemaDocumentationRemovalSummary) schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalSummary);
    if (confirmSchemaDocumentationRemoval) { confirmSchemaDocumentationRemoval.id = "confirm-schema-documentation-removal";
      confirmSchemaDocumentationRemoval.textContent = "Remove documentation"; schemaDocumentationRemovalDialog.append(confirmSchemaDocumentationRemoval); }
    if (cancelSchemaDocumentationRemoval) { cancelSchemaDocumentationRemoval.id = "cancel-schema-documentation-removal";
      cancelSchemaDocumentationRemoval.textContent = "Cancel"; schemaDocumentationRemovalDialog.append(cancelSchemaDocumentationRemoval); }
    schemaOwnerDocument?.body.append(schemaDocumentationRemovalDialog);
  }
  let mounted = false;
  let unsubscribe: (() => void) | undefined;
  const storedSchemaLibrary = ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
  let schemas = restoreSchemaLibrary(storedSchemaLibrary);
  let activeSchemaId: string | undefined;
  let schemaDraft: SchemaDefinition | undefined;
  let selectedSchemaPropertyPath = "example";
  const expandedSchemaPropertyRulePaths = new Set<string>();
  let pendingSchemaPropertyRemoval: { path:string; trigger?:HTMLButtonElement } | undefined;
  let lastSchemaPropertyRemoval: SchemaPropertyRemoval | undefined;
  let lastSchemaPropertyCopy: AppliedSchemaPropertyCopy | undefined;
  let pendingSchemaPropertyCopy: SchemaPropertyCopyPlan | undefined;
  let pendingSchemaDocumentationRemoval: { path:string; trigger?:HTMLElement } | undefined;
  const activeIndex = (): number => schemas.findIndex(({ id }) => id === activeSchemaId);
  const active = (): SchemaDefinition => {
    const schema = schemas[activeIndex()];
    if (!schema) throw new Error("Open a schema before editing its draft");
    return schema;
  };
  const persistSchemaLibrary = (): void => {
    ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(schemas));
    ports.changed(schemas);
  };
  const replaceActive = (schema: SchemaDefinition): void => {
    const index = activeIndex(); if (index < 0) throw new Error("Open a schema before editing its draft");
    schemas = schemas.map((candidate, candidateIndex) => candidateIndex === index ? schema : candidate);
    schemaDraft = structuredClone(schema);
  };
  const revisionVersion = (): number => Number(schemaRevisionSelector?.value || active().version);
  const renderSchemaPropertyView = (): void => {
    const schema = activeSchemaId ? active() : undefined;
    const rows = schema ? schemaPropertyRows(schema.workingDraft?.document ?? schema.document) : [];
    const propertyView = filterAndSortSchemaPropertyRows(rows, schemaPropertyFilter?.value ?? "",
      (schemaPropertySort?.value || "schema") as SchemaPropertySortOrder);
    if (schemaPropertyResultStatus) schemaPropertyResultStatus.textContent = `${propertyView.matchCount} of ${propertyView.totalCount} properties`;
    if (schemaPropertyEmpty) schemaPropertyEmpty.hidden = propertyView.rows.length > 0;
    if (schemaPropertyEmptyMessage) schemaPropertyEmptyMessage.textContent = propertyView.rows.length
      ? "" : `No properties match ${schemaPropertyFilter?.value.trim() ?? ""}`;
    if (schemaPropertyTree) {
      const items = propertyView.rows.flatMap((row) => { const item = schemaOwnerDocument?.createElement("li");
        if (!item) return []; item.dataset.propertyPath = row.canonicalPath; item.textContent = row.displayPath; return [item]; });
      schemaPropertyTree.replaceChildren(...items);
    }
    if (addSchemaPropertyButton) addSchemaPropertyButton.disabled = !schema;
  };
  function renderSchemaDraft(): void {
    const schema = activeSchemaId ? active() : undefined;
    const draft = schema?.workingDraft;
    if (schemaEditor) schemaEditor.hidden = !schema;
    if (schemaDetail) schemaDetail.hidden = !schema;
    if (schemaDetailEmpty) schemaDetailEmpty.hidden = Boolean(schema);
    if (schemaEditorName) schemaEditorName.value = draft?.name ?? schema?.name ?? "";
    if (schemaEditorDescription) schemaEditorDescription.value = draft?.documentation?.description
      ?? schema?.documentation?.description ?? "";
    if (schemaDescriptionOrigin) schemaDescriptionOrigin.textContent = draft?.documentation?.description
      ? "Working draft" : schema?.documentation?.description ? `Revision ${schema.version}` : "No description";
    if (schemaEditorTarget) schemaEditorTarget.value = draft?.assignments[0]?.target ?? schema?.assignments[0]?.target ?? "payload";
    const pendingChanges = draft?.pendingChanges ?? [];
    if (saveSchemaReason) saveSchemaReason.textContent = pendingChanges.join("; ");
    if (schemaRevisionReviewSummary) schemaRevisionReviewSummary.textContent = pendingChanges.length
      ? pendingChanges.join("; ") : "No pending changes";
    if (schemaCloseReviewSummary) schemaCloseReviewSummary.textContent = draft
      ? `${pendingChanges.length} pending change${pendingChanges.length === 1 ? "" : "s"}` : "No pending changes";
    if (confirmSchemaRevisionButton && schema) confirmSchemaRevisionButton.textContent = schema.published === false
      ? "Publish revision 1" : `Publish revision ${schema.version + 1}`;
    if (schemaRevisionComparison && schema) schemaRevisionComparison.textContent = `Revision ${revisionVersion()} compared with ${schema.version}`;
    if (schemaEditorNameAssistance && schema) schemaEditorNameAssistance.textContent = inspectSchemaRename(
      schema, schemas, schemaEditorName?.value ?? draft?.name ?? schema.name).assistance;
    renderSchemaPropertyView();
  }
  const renderSchemas = (): void => {
    if (!mounted) return;
    const visible = searchSchemas(schemas, schemaSearch?.value ?? "")
      .filter((schema) => !schemaCategoryFilter?.value || schemaCategoryFilter.value === "All"
        || String(schema.document.type ?? "").toLowerCase() === schemaCategoryFilter.value.toLowerCase());
    if (schemaCount) schemaCount.textContent = `${visible.length} schemas`;
    if (schemaList) {
      const document = schemaList.ownerDocument;
      schemaList.replaceChildren(...visible.map((schema) => {
        const button = document.createElement("button"); button.type = "button";
        button.textContent = `${schema.name} v${schema.version}`;
        button.addEventListener("click", () => { activeSchemaId = schema.id; schemaDraft = structuredClone(schema); renderSchemas(); });
        return button;
      }));
    }
    if (schemaResult) schemaResult.textContent = activeSchemaId ? `Selected ${activeSchemaId}` : "";
    renderSchemaDraft();
  };
  const persistSchemaEditorDraft = (): void => {
    if (!activeSchemaId) return;
    const schema = active();
    replaceActive(proposeSchemaWorkingDraftName(schema, schemaEditorName?.value ?? schema.name));
    persistSchemaLibrary(); renderSchemas();
  };
  const saveSchemaDescription = (): void => { if (!activeSchemaId) return;
    const schema = active();
    const documentation = updateSchemaDescription(schema.workingDraft?.documentation ?? schema.documentation ?? {},
      schemaEditorDescription?.value ?? "");
    replaceActive(updateSchemaWorkingDraft(schema, { documentation }, "Update schema description"));
    persistSchemaLibrary(); renderSchemas(); };
  const updateSchemaTarget = (): void => { if (!activeSchemaId) return;
    const schema = active(); const assignments = (schema.workingDraft?.assignments ?? schema.assignments)
      .map((assignment) => ({ ...assignment, target:(schemaEditorTarget?.value === "raw input" ? "raw input" : "payload") as "raw input" | "payload" }));
    replaceActive(updateSchemaWorkingDraft(schema, { assignments }, "Update validation target")); persistSchemaLibrary(); renderSchemas(); };
  const openSchemaRevisionReview = (): void => { renderSchemaDraft(); schemaRevisionReview?.showModal(); };
  const publishActiveSchema = (): SchemaDefinition => { const published = publishSchemaWorkingDraft(active());
    replaceActive(published); persistSchemaLibrary(); schemaRevisionReview?.close(); renderSchemas(); return published; };
  const confirmSchemaRevision = (): void => { publishActiveSchema(); };
  const cancelSchemaRevision = (): void => schemaRevisionReview?.close();
  const discardSchemaDraft = (): void => { replaceActive(discardSchemaWorkingDraft(active())); persistSchemaLibrary(); renderSchemas(); };
  const keepEditingSchema = (): void => { schemaCloseReview?.close(); schemaEditorName?.focus(); };
  const closeSchemaEditor = (): void => { if (active().workingDraft) schemaCloseReview?.showModal();
    else { activeSchemaId = undefined; schemaDraft = undefined; renderSchemas(); } };
  const saveAndCloseSchema = (): void => { if (active().workingDraft) publishActiveSchema();
    activeSchemaId = undefined; schemaDraft = undefined; schemaCloseReview?.close(); renderSchemas(); };
  const discardWorkingSchemaDraft = (): void => { discardSchemaDraft(); activeSchemaId = undefined;
    schemaDraft = undefined; schemaCloseReview?.close(); renderSchemas(); };
  const renderSchemaRevisionComparison = (): void => renderSchemaDraft();
  const duplicateSelectedSchemaRevision = (): void => { const duplicate = duplicateSchemaRevision(active(), revisionVersion(), schemas);
    schemas = [...schemas, duplicate]; activeSchemaId = duplicate.id; schemaDraft = structuredClone(duplicate); persistSchemaLibrary(); renderSchemas(); };
  const restoreSelectedSchemaRevision = (): void => { replaceActive(restoreSchemaRevisionDraft(active(), revisionVersion()));
    persistSchemaLibrary(); renderSchemas(); };
  const clearSchemaPropertyViewFilter = (): void => { if (schemaPropertyFilter) schemaPropertyFilter.value = "";
    renderSchemaPropertyView(); schemaPropertyFilter?.focus(); };
  function showSchemaSubview(subview: string): void {
    for (const tab of schemaSubviews) tab.setAttribute("aria-selected", String(tab.dataset.schemaSubview === subview));
    for (const panel of schemaPanels) panel.hidden = panel.id !== subview;
    if (liveEventQuery) liveEventQuery.hidden = subview !== "schema-master";
  }
  const activateSchemaSubview = (event: Event): void => {
    const subview = (event.currentTarget as HTMLButtonElement).dataset.schemaSubview;
    if (subview) showSchemaSubview(subview);
  };
  function applySchemaPropertyRemoval(path: string): void {
    const schema = active();
    const draft = schema.workingDraft;
    if (!draft) return;
    const removal = removeSchemaProperty(draft.document, draft.attachedRules ?? [], path, draft.documentation);
    lastSchemaPropertyRemoval = removal; selectedSchemaPropertyPath = removal.propertyPath.slice(1).replaceAll("/", ".");
    expandedSchemaPropertyRulePaths.delete(removal.propertyPath);
    replaceActive(updateSchemaWorkingDraft(schema, { document:removal.document, attachedRules:removal.attachedRules,
      ...(removal.documentation !== undefined ? { documentation:removal.documentation } : {}) },
    `Remove property ${removal.propertyPath} and property-specific constraints`));
    if (schemaPropertyRemovalFeedback) schemaPropertyRemovalFeedback.textContent = `Removed ${removal.propertyPath} from the working draft. Undo is available.`;
    if (undoSchemaPropertyRemovalButton) undoSchemaPropertyRemovalButton.hidden = false;
    persistSchemaLibrary(); renderSchemas();
  }
  function requestSchemaPropertyRemoval(path: string, trigger?: HTMLButtonElement): void {
    const schema = active(); const draft = schema.workingDraft;
    if (!draft) return;
    const inspection = inspectSchemaPropertyRemoval(draft.document, draft.attachedRules ?? [], path, draft.documentation);
    if (!inspection.requiresConfirmation) { applySchemaPropertyRemoval(path); return; }
    pendingSchemaPropertyRemoval = { path, ...(trigger ? { trigger } : {}) };
    if (schemaPropertyRemovalSummary) schemaPropertyRemovalSummary.textContent = `${inspection.propertyPath} contains ${inspection.descendants.length} descendants: ${inspection.descendants.join(", ") || "none"}. ${inspection.affectedRuleAttachments.length} affected rule attachments. Documentation entries: ${inspection.affectedDocumentationPaths?.join(", ") || "none"}. No changes occur until confirmation.`;
    schemaPropertyRemovalDialog?.showModal(); schemaPropertyRemovalHeading?.focus();
  }
  function closeSchemaPropertyRemovalDialog(restoreFocus = true): void {
    const trigger = pendingSchemaPropertyRemoval?.trigger; pendingSchemaPropertyRemoval = undefined;
    if (schemaPropertyRemovalDialog?.open) schemaPropertyRemovalDialog.close(); if (restoreFocus) trigger?.focus();
  }
  const confirmSchemaPropertyRemoval = (): void => { const path = pendingSchemaPropertyRemoval?.path;
    closeSchemaPropertyRemovalDialog(false); if (path) applySchemaPropertyRemoval(path); };
  const cancelSchemaPropertyRemoval = (): void => closeSchemaPropertyRemovalDialog();
  const cancelSchemaPropertyRemovalFromDialog = (event: Event): void => { event.preventDefault(); closeSchemaPropertyRemovalDialog(); };
  const undoLastSchemaPropertyRemoval = (): void => {
    if (!lastSchemaPropertyRemoval) return; const schema = active(); const restored = undoSchemaPropertyRemoval(lastSchemaPropertyRemoval);
    const path = lastSchemaPropertyRemoval.propertyPath; selectedSchemaPropertyPath = path.slice(1).replaceAll("/", ".");
    expandedSchemaPropertyRulePaths.add(path);
    replaceActive(updateSchemaWorkingDraft(schema, { document:restored.document, attachedRules:restored.attachedRules,
      ...(restored.documentation !== undefined ? { documentation:restored.documentation } : {}) }, `Undo property removal ${path}`));
    if (schemaPropertyRemovalFeedback) schemaPropertyRemovalFeedback.textContent = `Restored ${path} with its prior definition and tree position.`;
    if (undoSchemaPropertyRemovalButton) undoSchemaPropertyRemovalButton.hidden = true;
    lastSchemaPropertyRemoval = undefined; persistSchemaLibrary(); renderSchemas();
  };
  function requestSchemaDocumentationRemoval(path: string, trigger?: HTMLElement): void {
    pendingSchemaDocumentationRemoval = { path, ...(trigger ? { trigger } : {}) };
    if (schemaDocumentationRemovalSummary) schemaDocumentationRemovalSummary.textContent = `${path} documentation will be removed from the working draft. The schema property and validation rules remain unchanged.`;
    schemaDocumentationRemovalDialog?.showModal(); schemaDocumentationRemovalHeading?.focus();
  }
  function closeSchemaDocumentationRemoval(restoreFocus = true): void {
    const trigger = pendingSchemaDocumentationRemoval?.trigger; pendingSchemaDocumentationRemoval = undefined;
    if (schemaDocumentationRemovalDialog?.open) schemaDocumentationRemovalDialog.close(); if (restoreFocus) trigger?.focus();
  }
  const confirmSchemaDocumentationRemovalAction = (): void => {
    const path = pendingSchemaDocumentationRemoval?.path; if (!path) return; const schema = active(); const draft = schema.workingDraft;
    closeSchemaDocumentationRemoval(false); if (!draft) return;
    const documentation = setPropertyDocumentation(draft.documentation ?? {}, path, { displayName:"", description:"" });
    replaceActive(updateSchemaWorkingDraft(schema, { documentation }, `Remove property documentation ${path}`));
    persistSchemaLibrary(); renderSchemas();
  };
  const cancelSchemaDocumentationRemovalAction = (): void => closeSchemaDocumentationRemoval();
  const cancelSchemaDocumentationRemovalFromDialog = (event: Event): void => { event.preventDefault(); closeSchemaDocumentationRemoval(); };
  function openSchemaPropertyCopyReview(path: string, destinationId: string): void {
    const sourceSchema = active(); const destination = schemas.find(({ id }) => id === destinationId);
    if (!destination) throw new Error(`Unknown destination schema ${destinationId}`);
    const source = schemaPropertyCopySource(sourceSchema, { surface:sourceSchema.workingDraft ? "working draft" : "current" });
    pendingSchemaPropertyCopy = planSchemaPropertyCopy({ source, destination, selectedPath:path, schemas, reusableRuleIds:[] });
    if (!pendingSchemaPropertyCopy.ready) throw new Error("Resolve property-copy conflicts before confirmation");
    schemaPropertyCopyDialog?.showModal();
  }
  const confirmSchemaPropertyCopy = (): void => {
    if (!pendingSchemaPropertyCopy) return; const transaction = applySchemaPropertyCopy(pendingSchemaPropertyCopy);
    schemas = schemas.map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema);
    lastSchemaPropertyCopy = transaction; pendingSchemaPropertyCopy = undefined; schemaPropertyCopyDialog?.close();
    if (schemaPropertyCopyFeedback) schemaPropertyCopyFeedback.textContent = `Copied ${transaction.plan.selectedPath} from ${transaction.plan.source.label} to ${transaction.schema.name}. Published revisions are unchanged.`;
    if (undoSchemaPropertyCopyButton) undoSchemaPropertyCopyButton.hidden = false;
    persistSchemaLibrary(); renderSchemas();
  };
  const undoLastSchemaPropertyCopy = (): void => {
    if (!lastSchemaPropertyCopy) return; const restored = undoSchemaPropertyCopy(lastSchemaPropertyCopy).schema;
    schemas = schemas.map((schema) => schema.id === restored.id ? restored : schema);
    if (schemaPropertyCopyFeedback) schemaPropertyCopyFeedback.textContent = `Undid property copy to ${restored.name}; the pre-copy working draft was restored.`;
    if (undoSchemaPropertyCopyButton) undoSchemaPropertyCopyButton.hidden = true;
    lastSchemaPropertyCopy = undefined; persistSchemaLibrary(); renderSchemas();
  };
  return {
    mount(): void {
      if (mounted) return; mounted = true;
      schemaSearch?.addEventListener("input", renderSchemas);
      schemaCategoryFilter?.addEventListener("change", renderSchemas);
      schemaEditorName?.addEventListener("input", persistSchemaEditorDraft);
      saveSchemaDescriptionButton?.addEventListener("click", saveSchemaDescription);
      schemaEditorTarget?.addEventListener("change", updateSchemaTarget);
      saveSchemaButton?.addEventListener("click", openSchemaRevisionReview);
      confirmSchemaRevisionButton?.addEventListener("click", confirmSchemaRevision);
      cancelSchemaRevisionButton?.addEventListener("click", cancelSchemaRevision);
      discardSchemaDraftButton?.addEventListener("click", discardSchemaDraft);
      keepEditingSchemaButton?.addEventListener("click", keepEditingSchema);
      closeSchemaEditorButton?.addEventListener("click", closeSchemaEditor);
      saveAndCloseSchemaButton?.addEventListener("click", saveAndCloseSchema);
      saveSchemaCloseReviewButton?.addEventListener("click", saveAndCloseSchema);
      discardWorkingSchemaDraftButton?.addEventListener("click", discardWorkingSchemaDraft);
      schemaRevisionSelector?.addEventListener("change", renderSchemaRevisionComparison);
      duplicateSchemaRevisionButton?.addEventListener("click", duplicateSelectedSchemaRevision);
      restoreSchemaRevisionButton?.addEventListener("click", restoreSelectedSchemaRevision);
      schemaPropertyFilter?.addEventListener("input", renderSchemaPropertyView);
      schemaPropertySort?.addEventListener("change", renderSchemaPropertyView);
      clearSchemaPropertyFilter?.addEventListener("click", clearSchemaPropertyViewFilter);
      for (const tab of schemaSubviews) tab.addEventListener("click", activateSchemaSubview);
      confirmSchemaPropertyRemovalButton?.addEventListener("click", confirmSchemaPropertyRemoval);
      cancelSchemaPropertyRemovalButton?.addEventListener("click", cancelSchemaPropertyRemoval);
      schemaPropertyRemovalDialog?.addEventListener("cancel", cancelSchemaPropertyRemovalFromDialog);
      undoSchemaPropertyRemovalButton?.addEventListener("click", undoLastSchemaPropertyRemoval);
      confirmSchemaDocumentationRemoval?.addEventListener("click", confirmSchemaDocumentationRemovalAction);
      cancelSchemaDocumentationRemoval?.addEventListener("click", cancelSchemaDocumentationRemovalAction);
      schemaDocumentationRemovalDialog?.addEventListener("cancel", cancelSchemaDocumentationRemovalFromDialog);
      undoSchemaPropertyCopyButton?.addEventListener("click", undoLastSchemaPropertyCopy);
      unsubscribe = ports.subscribe(renderSchemas);
      renderSchemas();
    },
    dispose(): void {
      if (!mounted) return; mounted = false;
      schemaSearch?.removeEventListener("input", renderSchemas);
      schemaCategoryFilter?.removeEventListener("change", renderSchemas);
      schemaEditorName?.removeEventListener("input", persistSchemaEditorDraft);
      saveSchemaDescriptionButton?.removeEventListener("click", saveSchemaDescription);
      schemaEditorTarget?.removeEventListener("change", updateSchemaTarget);
      saveSchemaButton?.removeEventListener("click", openSchemaRevisionReview);
      confirmSchemaRevisionButton?.removeEventListener("click", confirmSchemaRevision);
      cancelSchemaRevisionButton?.removeEventListener("click", cancelSchemaRevision);
      discardSchemaDraftButton?.removeEventListener("click", discardSchemaDraft);
      keepEditingSchemaButton?.removeEventListener("click", keepEditingSchema);
      closeSchemaEditorButton?.removeEventListener("click", closeSchemaEditor);
      saveAndCloseSchemaButton?.removeEventListener("click", saveAndCloseSchema);
      saveSchemaCloseReviewButton?.removeEventListener("click", saveAndCloseSchema);
      discardWorkingSchemaDraftButton?.removeEventListener("click", discardWorkingSchemaDraft);
      schemaRevisionSelector?.removeEventListener("change", renderSchemaRevisionComparison);
      duplicateSchemaRevisionButton?.removeEventListener("click", duplicateSelectedSchemaRevision);
      restoreSchemaRevisionButton?.removeEventListener("click", restoreSelectedSchemaRevision);
      schemaPropertyFilter?.removeEventListener("input", renderSchemaPropertyView);
      schemaPropertySort?.removeEventListener("change", renderSchemaPropertyView);
      clearSchemaPropertyFilter?.removeEventListener("click", clearSchemaPropertyViewFilter);
      for (const tab of schemaSubviews) tab.removeEventListener("click", activateSchemaSubview);
      confirmSchemaPropertyRemovalButton?.removeEventListener("click", confirmSchemaPropertyRemoval);
      cancelSchemaPropertyRemovalButton?.removeEventListener("click", cancelSchemaPropertyRemoval);
      schemaPropertyRemovalDialog?.removeEventListener("cancel", cancelSchemaPropertyRemovalFromDialog);
      undoSchemaPropertyRemovalButton?.removeEventListener("click", undoLastSchemaPropertyRemoval);
      confirmSchemaDocumentationRemoval?.removeEventListener("click", confirmSchemaDocumentationRemovalAction);
      cancelSchemaDocumentationRemoval?.removeEventListener("click", cancelSchemaDocumentationRemovalAction);
      schemaDocumentationRemovalDialog?.removeEventListener("cancel", cancelSchemaDocumentationRemovalFromDialog);
      undoSchemaPropertyCopyButton?.removeEventListener("click", undoLastSchemaPropertyCopy);
      pendingSchemaPropertyRemoval = undefined; pendingSchemaDocumentationRemoval = undefined; lastSchemaPropertyRemoval = undefined;
      pendingSchemaPropertyCopy = undefined; lastSchemaPropertyCopy = undefined;
      unsubscribe?.(); unsubscribe = undefined;
      schemaList?.replaceChildren();
    },
    open(id: string): void {
      if (!schemas.some((schema) => schema.id === id)) throw new Error(`Unknown schema ${id}`);
      activeSchemaId = id;
      schemaDraft = structuredClone(active()); renderSchemas();
    },
    beginDraft(): void { replaceActive(updateSchemaWorkingDraft(active(), {})); persistSchemaLibrary(); renderSchemas(); },
    updateDraft(changes: Partial<Pick<SchemaWorkingDraft, "name" | "document" | "assignments" | "attachedRules" | "parentSchemaId" | "inheritedRuleOverrides" | "documentation" | "canonicalSchema">>, change?: string): void {
      replaceActive(updateSchemaWorkingDraft(active(), changes, change)); persistSchemaLibrary(); renderSchemas();
    },
    publish(): SchemaDefinition { return structuredClone(publishActiveSchema()); },
    discard(): void { replaceActive(discardSchemaWorkingDraft(active())); persistSchemaLibrary(); renderSchemas(); },
    add(schema: SchemaDefinition): void { schemas = [...schemas, structuredClone(schema)]; activeSchemaId = schema.id; schemaDraft = structuredClone(schema); persistSchemaLibrary(); renderSchemas(); },
    replace(next: readonly SchemaDefinition[]): void { schemas = structuredClone([...next]); if (!schemas.some(({ id }) => id === activeSchemaId)) { activeSchemaId = undefined; schemaDraft = undefined; } persistSchemaLibrary(); renderSchemas(); },
    validate:(event: Parameters<typeof validateEvent>[0]) => validateEvent(event, schemas),
    runGuidedValidation:() => ports.runGuidedValidation(activeSchemaId),
    requestPropertyRemoval:requestSchemaPropertyRemoval,
    requestDocumentationRemoval:requestSchemaDocumentationRemoval,
    requestPropertyCopy:openSchemaPropertyCopyReview,
    confirmPropertyCopy:confirmSchemaPropertyCopy,
    schemas:(): readonly SchemaDefinition[] => structuredClone(schemas),
    state:() => ({ ...(activeSchemaId ? { activeSchemaId } : {}), draftDirty:Boolean(activeSchemaId && active().workingDraft),
      schemaCount:schemas.length, mounted }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"schemas",
  capabilities:["schema and rule libraries", "drafts", "assignments", "validation", "guided validation"],
});
