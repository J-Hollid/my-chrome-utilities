import type {
  AppliedSchemaPropertyCopy,
  CanonicalSchemaDocument,
  ManualArrayItemType,
  ManualPropertyDefinition,
  ManualPropertyValueType,
  SchemaDefinition,
  SchemaPropertyRemoval,
} from "../../utilities/data-layer/schemas.js";
import {
  addManualProperty,
  contextualManualPropertyDefinition,
  inspectManualProperty,
  inspectSchemaPropertyRemoval,
  inspectSpecificIndexRuleTarget,
  manualPropertyPreview,
  removeSchemaProperty,
  schemaPropertyCopySource,
  schemaRevisionChoices,
  undoSchemaPropertyCopy,
  undoSchemaPropertyRemoval,
  updateSchemaWorkingDraft,
} from "../../utilities/data-layer/schemas.js";
import { applySchemaPropertyCopy, type SchemaPropertyCopyPlan } from "../../data-layer-schema-property-copy.js";
import { renderSchemaPropertyCopyReview } from "../../data-layer-schema-property-copy-ui.js";

interface PropertyCopyReview { close():void }

interface PropertyControllerPorts {
  root:ParentNode;
  active():SchemaDefinition;
  schemas():readonly SchemaDefinition[];
  ruleIds():readonly string[];
  replaceActive(schema:SchemaDefinition):void;
  replaceSchemas(schemas:readonly SchemaDefinition[]):void;
  persist():void;
  renderAll():void;
  renderView():void;
  renderRules():void;
  openRulePicker(path:string, trigger?:HTMLButtonElement):void;
  queuePersistence(schemaId:string):void;
  canonicalUndo():boolean;
  removeCanonicalDocumentation(schema:SchemaDefinition, path:string):SchemaDefinition;
  addManualCanonical(schema:SchemaDefinition, document:SchemaDefinition["document"], path:string):CanonicalSchemaDocument | undefined;
  scheduleFrame(callback:()=>void):void;
  settle?(schemaId:string):Promise<void>;
}

export function installSchemaPropertyElements(root:ParentNode) {
  const document=(root as ParentNode & { ownerDocument?:Document }).ownerDocument ?? ("createElement" in root ? root as Document : undefined);
  const owned=<K extends keyof HTMLElementTagNameMap>(selector:string, tag:K):HTMLElementTagNameMap[K] | null =>
    root.querySelector<HTMLElementTagNameMap[K]>(selector) ?? document?.createElement(tag) ?? null;
  const addSchemaPropertyButton=root.querySelector<HTMLButtonElement>("#add-schema-property"),
    schemaPropertyViewControls=owned("#schema-property-view-controls", "div"), schemaPropertyFilterLabel=owned("#schema-property-filter-label", "label"),
    schemaPropertyFilter=owned("#schema-property-filter", "input"), schemaPropertySortLabel=owned("#schema-property-sort-label", "label"),
    schemaPropertySort=owned("#schema-property-sort", "select"), schemaPropertyResultStatus=owned("#schema-property-result-status", "output"),
    schemaPropertyEmpty=owned("#schema-property-empty", "div"), schemaPropertyEmptyMessage=owned("#schema-property-empty-message", "p"),
    clearSchemaPropertyFilter=owned("#clear-schema-property-filter", "button"), schemaPropertyTree=owned("#schema-property-tree", "ul"),
    schemaPropertyRemovalFeedback=owned("#schema-property-removal-feedback", "output"), undoSchemaPropertyRemovalButton=owned("#undo-schema-property-removal", "button"),
    schemaPropertyCopyFeedback=owned("#schema-property-copy-feedback", "output"), undoSchemaPropertyCopyButton=owned("#undo-schema-property-copy", "button"),
    schemaPropertyRemovalDialog=owned("#schema-property-removal-dialog", "dialog"), schemaPropertyRemovalHeading=owned("#schema-property-removal-heading", "h4"),
    schemaPropertyRemovalSummary=owned("#schema-property-removal-summary", "output"), confirmSchemaPropertyRemovalButton=owned("#confirm-schema-property-removal", "button"),
    cancelSchemaPropertyRemovalButton=owned("#cancel-schema-property-removal", "button"), schemaDocumentationRemovalDialog=owned("#schema-documentation-removal-dialog", "dialog"),
    schemaDocumentationRemovalHeading=owned("#schema-documentation-removal-heading", "h4"), schemaDocumentationRemovalSummary=owned("#schema-documentation-removal-summary", "p"),
    confirmSchemaDocumentationRemoval=owned("#confirm-schema-documentation-removal", "button"), cancelSchemaDocumentationRemoval=owned("#cancel-schema-documentation-removal", "button"),
    schemaSpecificIndexDialog=owned("#schema-specific-index-dialog", "dialog"), schemaSpecificIndexForm=owned("#schema-specific-index-form", "form"),
    schemaSpecificIndexHeading=owned("#schema-specific-index-heading", "h4"), schemaSpecificIndexLabel=owned("#schema-specific-index-label", "label"),
    schemaSpecificIndex=owned("#schema-specific-index", "input"), schemaSpecificIndexAssistance=owned("#schema-specific-index-assistance", "output"),
    confirmSchemaSpecificIndex=owned("#confirm-schema-specific-index", "button"), cancelSchemaSpecificIndex=owned("#cancel-schema-specific-index", "button"),
    schemaManualPropertyDialog=owned("#schema-manual-property-dialog", "dialog"), schemaManualPropertyForm=owned("#schema-manual-property-form", "form"),
    schemaManualPropertyHeading=owned("#schema-manual-property-heading", "h4"), schemaManualPropertyPathLabel=owned("#schema-manual-property-path-label", "label"),
    schemaManualPropertyPath=owned("#schema-manual-property-path", "input"), schemaManualPropertyParentContext=owned("#schema-manual-property-parent-context", "output"),
    schemaManualPropertyChildNameLabel=owned("#schema-manual-property-child-name-label", "label"), schemaManualPropertyChildName=owned("#schema-manual-property-child-name", "input"),
    schemaManualPropertyTypeLabel=owned("#schema-manual-property-type-label", "label"), schemaManualPropertyType=owned("#schema-manual-property-type", "select"),
    schemaManualArrayTypeGroup=owned("#schema-manual-array-type-group", "label"), schemaManualArrayItemType=owned("#schema-manual-array-item-type", "select"),
    schemaManualPropertyPreview=owned("#schema-manual-property-preview", "output"), schemaManualPropertyAssistance=owned("#schema-manual-property-assistance", "output"),
    goToExistingSchemaPropertyButton=owned("#go-to-existing-schema-property", "button"), confirmSchemaManualPropertyButton=owned("#confirm-schema-manual-property", "button"),
    cancelSchemaManualPropertyButton=owned("#cancel-schema-manual-property", "button"), schemaPropertyRulePicker=owned("#schema-property-rule-picker", "dialog"),
    schemaPropertyCopyDialog=owned("#schema-property-copy-dialog", "dialog");
  if (schemaPropertyViewControls && !schemaPropertyViewControls.isConnected) {
    schemaPropertyViewControls.id="schema-property-view-controls";
    if (schemaPropertyFilterLabel) { schemaPropertyFilterLabel.id="schema-property-filter-label"; schemaPropertyFilterLabel.htmlFor="schema-property-filter"; schemaPropertyFilterLabel.textContent="Filter properties"; }
    if (schemaPropertyFilter) { schemaPropertyFilter.id="schema-property-filter"; schemaPropertyFilter.type="search"; }
    if (schemaPropertySortLabel) { schemaPropertySortLabel.id="schema-property-sort-label"; schemaPropertySortLabel.htmlFor="schema-property-sort"; schemaPropertySortLabel.textContent="Sort properties"; }
    if (schemaPropertySort) { schemaPropertySort.id="schema-property-sort"; for (const [value,label] of [["schema","Schema order"],["name-asc","Name A-Z"],["name-desc","Name Z-A"]] as const) {
      const option=document?.createElement("option"); if (option) { option.value=value; option.textContent=label; schemaPropertySort.append(option); } } }
    if (schemaPropertyResultStatus) { schemaPropertyResultStatus.id="schema-property-result-status"; schemaPropertyResultStatus.setAttribute("aria-live", "polite"); }
    for (const element of [schemaPropertyFilterLabel,schemaPropertyFilter,schemaPropertySortLabel,schemaPropertySort,schemaPropertyResultStatus])
      if (element) schemaPropertyViewControls.append(element);
    addSchemaPropertyButton?.before(schemaPropertyViewControls);
  }
  if (schemaPropertyEmpty && !schemaPropertyEmpty.isConnected) { schemaPropertyEmpty.id="schema-property-empty"; schemaPropertyEmpty.hidden=true;
    if (schemaPropertyEmptyMessage) { schemaPropertyEmptyMessage.id="schema-property-empty-message"; schemaPropertyEmpty.append(schemaPropertyEmptyMessage); }
    if (clearSchemaPropertyFilter) { clearSchemaPropertyFilter.id="clear-schema-property-filter"; clearSchemaPropertyFilter.type="button"; clearSchemaPropertyFilter.textContent="Clear filter"; schemaPropertyEmpty.append(clearSchemaPropertyFilter); } addSchemaPropertyButton?.before(schemaPropertyEmpty); }
  if (schemaPropertyTree && !schemaPropertyTree.isConnected) { schemaPropertyTree.id="schema-property-tree"; addSchemaPropertyButton?.after(schemaPropertyTree); }
  if (schemaPropertyRemovalFeedback && !schemaPropertyRemovalFeedback.isConnected) { schemaPropertyRemovalFeedback.id="schema-property-removal-feedback"; schemaPropertyRemovalFeedback.setAttribute("aria-live", "polite"); schemaPropertyTree?.after(schemaPropertyRemovalFeedback); }
  if (undoSchemaPropertyRemovalButton && !undoSchemaPropertyRemovalButton.isConnected) { undoSchemaPropertyRemovalButton.id="undo-schema-property-removal"; undoSchemaPropertyRemovalButton.type="button"; undoSchemaPropertyRemovalButton.textContent="Undo"; undoSchemaPropertyRemovalButton.hidden=true; schemaPropertyRemovalFeedback?.after(undoSchemaPropertyRemovalButton); }
  if (schemaPropertyCopyFeedback && !schemaPropertyCopyFeedback.isConnected) { schemaPropertyCopyFeedback.id="schema-property-copy-feedback"; schemaPropertyCopyFeedback.setAttribute("aria-live", "polite"); schemaPropertyRemovalFeedback?.after(schemaPropertyCopyFeedback); }
  if (undoSchemaPropertyCopyButton && !undoSchemaPropertyCopyButton.isConnected) { undoSchemaPropertyCopyButton.id="undo-schema-property-copy"; undoSchemaPropertyCopyButton.type="button"; undoSchemaPropertyCopyButton.textContent="Undo property copy"; undoSchemaPropertyCopyButton.hidden=true; schemaPropertyCopyFeedback?.after(undoSchemaPropertyCopyButton); }
  if (schemaPropertyCopyDialog && !schemaPropertyCopyDialog.isConnected) { schemaPropertyCopyDialog.id="schema-property-copy-dialog"; document?.body.append(schemaPropertyCopyDialog); }
  if (schemaPropertyRemovalDialog && !schemaPropertyRemovalDialog.isConnected) { schemaPropertyRemovalDialog.id="schema-property-removal-dialog";
    if (schemaPropertyRemovalHeading) { schemaPropertyRemovalHeading.id="schema-property-removal-heading"; schemaPropertyRemovalHeading.textContent="Remove property?"; schemaPropertyRemovalDialog.append(schemaPropertyRemovalHeading); }
    if (schemaPropertyRemovalSummary) { schemaPropertyRemovalSummary.id="schema-property-removal-summary"; schemaPropertyRemovalDialog.append(schemaPropertyRemovalSummary); }
    if (confirmSchemaPropertyRemovalButton) { confirmSchemaPropertyRemovalButton.id="confirm-schema-property-removal"; confirmSchemaPropertyRemovalButton.textContent="Remove property"; schemaPropertyRemovalDialog.append(confirmSchemaPropertyRemovalButton); }
    if (cancelSchemaPropertyRemovalButton) { cancelSchemaPropertyRemovalButton.id="cancel-schema-property-removal"; cancelSchemaPropertyRemovalButton.textContent="Cancel"; schemaPropertyRemovalDialog.append(cancelSchemaPropertyRemovalButton); } document?.body.append(schemaPropertyRemovalDialog); }
  if (schemaDocumentationRemovalDialog && !schemaDocumentationRemovalDialog.isConnected) { schemaDocumentationRemovalDialog.id="schema-documentation-removal-dialog";
    if (schemaDocumentationRemovalHeading) { schemaDocumentationRemovalHeading.id="schema-documentation-removal-heading"; schemaDocumentationRemovalHeading.textContent="Remove property documentation?"; schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalHeading); }
    if (schemaDocumentationRemovalSummary) { schemaDocumentationRemovalSummary.id="schema-documentation-removal-summary"; schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalSummary); }
    if (confirmSchemaDocumentationRemoval) { confirmSchemaDocumentationRemoval.id="confirm-schema-documentation-removal"; confirmSchemaDocumentationRemoval.textContent="Remove documentation"; schemaDocumentationRemovalDialog.append(confirmSchemaDocumentationRemoval); }
    if (cancelSchemaDocumentationRemoval) { cancelSchemaDocumentationRemoval.id="cancel-schema-documentation-removal"; cancelSchemaDocumentationRemoval.textContent="Cancel"; schemaDocumentationRemovalDialog.append(cancelSchemaDocumentationRemoval); } document?.body.append(schemaDocumentationRemovalDialog); }
  if (schemaSpecificIndexDialog && schemaSpecificIndexForm && !schemaSpecificIndexDialog.isConnected) { schemaSpecificIndexDialog.id="schema-specific-index-dialog"; schemaSpecificIndexForm.id="schema-specific-index-form";
    if (schemaSpecificIndexHeading) { schemaSpecificIndexHeading.id="schema-specific-index-heading"; schemaSpecificIndexHeading.textContent="Add specific index rule"; schemaSpecificIndexForm.append(schemaSpecificIndexHeading); }
    if (schemaSpecificIndexLabel) { schemaSpecificIndexLabel.id="schema-specific-index-label"; schemaSpecificIndexLabel.htmlFor="schema-specific-index"; schemaSpecificIndexLabel.textContent="Zero-based array index"; schemaSpecificIndexForm.append(schemaSpecificIndexLabel); }
    if (schemaSpecificIndex) { schemaSpecificIndex.id="schema-specific-index"; schemaSpecificIndex.type="number"; schemaSpecificIndex.min="0"; schemaSpecificIndex.step="1"; schemaSpecificIndexForm.append(schemaSpecificIndex); }
    if (schemaSpecificIndexAssistance) { schemaSpecificIndexAssistance.id="schema-specific-index-assistance"; schemaSpecificIndexForm.append(schemaSpecificIndexAssistance); }
    if (confirmSchemaSpecificIndex) { confirmSchemaSpecificIndex.id="confirm-schema-specific-index"; confirmSchemaSpecificIndex.type="submit"; confirmSchemaSpecificIndex.textContent="Choose rule"; schemaSpecificIndexForm.append(confirmSchemaSpecificIndex); }
    if (cancelSchemaSpecificIndex) { cancelSchemaSpecificIndex.id="cancel-schema-specific-index"; cancelSchemaSpecificIndex.type="button"; cancelSchemaSpecificIndex.textContent="Cancel"; schemaSpecificIndexForm.append(cancelSchemaSpecificIndex); }
    schemaSpecificIndexDialog.append(schemaSpecificIndexForm); document?.body.append(schemaSpecificIndexDialog); }
  if (schemaManualPropertyDialog && schemaManualPropertyForm && !schemaManualPropertyDialog.isConnected) { schemaManualPropertyDialog.id="schema-manual-property-dialog"; schemaManualPropertyForm.id="schema-manual-property-form";
    const append=(element:HTMLElement|null):void => { if (element) schemaManualPropertyForm.append(element); };
    if (schemaManualPropertyHeading) { schemaManualPropertyHeading.id="schema-manual-property-heading"; schemaManualPropertyHeading.textContent="Add property"; } append(schemaManualPropertyHeading);
    if (schemaManualPropertyPathLabel) { schemaManualPropertyPathLabel.id="schema-manual-property-path-label"; schemaManualPropertyPathLabel.htmlFor="schema-manual-property-path"; schemaManualPropertyPathLabel.textContent="Property path"; } append(schemaManualPropertyPathLabel);
    if (schemaManualPropertyPath) schemaManualPropertyPath.id="schema-manual-property-path"; append(schemaManualPropertyPath);
    if (schemaManualPropertyParentContext) schemaManualPropertyParentContext.id="schema-manual-property-parent-context"; append(schemaManualPropertyParentContext);
    if (schemaManualPropertyChildNameLabel) { schemaManualPropertyChildNameLabel.id="schema-manual-property-child-name-label"; schemaManualPropertyChildNameLabel.htmlFor="schema-manual-property-child-name"; schemaManualPropertyChildNameLabel.textContent="Child property name"; } append(schemaManualPropertyChildNameLabel);
    if (schemaManualPropertyChildName) schemaManualPropertyChildName.id="schema-manual-property-child-name"; append(schemaManualPropertyChildName);
    if (schemaManualPropertyTypeLabel) { schemaManualPropertyTypeLabel.id="schema-manual-property-type-label"; schemaManualPropertyTypeLabel.htmlFor="schema-manual-property-type"; schemaManualPropertyTypeLabel.textContent="Value type"; } append(schemaManualPropertyTypeLabel);
    if (schemaManualPropertyType) { schemaManualPropertyType.id="schema-manual-property-type"; for (const type of ["string","number","boolean","object","array"] as const) { const option=document?.createElement("option"); if (option) { option.value=type; option.textContent=type; schemaManualPropertyType.append(option); } } } append(schemaManualPropertyType);
    if (schemaManualArrayTypeGroup) { schemaManualArrayTypeGroup.id="schema-manual-array-type-group"; schemaManualArrayTypeGroup.htmlFor="schema-manual-array-item-type"; schemaManualArrayTypeGroup.textContent="Array item type ";
      if (schemaManualArrayItemType) { schemaManualArrayItemType.id="schema-manual-array-item-type"; const empty=document?.createElement("option"); if (empty) { empty.value=""; empty.textContent="Choose item type"; schemaManualArrayItemType.append(empty); }
        for (const type of ["string","number","boolean","object"] as const) { const option=document?.createElement("option"); if (option) { option.value=type; option.textContent=type; schemaManualArrayItemType.append(option); } } schemaManualArrayTypeGroup.append(schemaManualArrayItemType); } } append(schemaManualArrayTypeGroup);
    if (schemaManualPropertyPreview) { schemaManualPropertyPreview.id="schema-manual-property-preview"; schemaManualPropertyPreview.setAttribute("aria-live", "polite"); } append(schemaManualPropertyPreview);
    if (schemaManualPropertyAssistance) { schemaManualPropertyAssistance.id="schema-manual-property-assistance"; schemaManualPropertyAssistance.setAttribute("aria-live", "polite"); } append(schemaManualPropertyAssistance);
    if (goToExistingSchemaPropertyButton) { goToExistingSchemaPropertyButton.id="go-to-existing-schema-property"; goToExistingSchemaPropertyButton.type="button"; } append(goToExistingSchemaPropertyButton);
    if (confirmSchemaManualPropertyButton) { confirmSchemaManualPropertyButton.id="confirm-schema-manual-property"; confirmSchemaManualPropertyButton.type="submit"; confirmSchemaManualPropertyButton.textContent="Add property"; } append(confirmSchemaManualPropertyButton);
    if (cancelSchemaManualPropertyButton) { cancelSchemaManualPropertyButton.id="cancel-schema-manual-property"; cancelSchemaManualPropertyButton.type="button"; cancelSchemaManualPropertyButton.textContent="Cancel"; } append(cancelSchemaManualPropertyButton);
    schemaManualPropertyDialog.append(schemaManualPropertyForm); document?.body.append(schemaManualPropertyDialog); }
  if (schemaPropertyRulePicker && !schemaPropertyRulePicker.isConnected) { schemaPropertyRulePicker.id="schema-property-rule-picker"; schemaPropertyRulePicker.setAttribute("aria-label", "Schema property rule picker"); document?.body.append(schemaPropertyRulePicker); }
  return { addSchemaPropertyButton, schemaPropertyViewControls, schemaPropertyFilterLabel, schemaPropertyFilter, schemaPropertySortLabel, schemaPropertySort,
    schemaPropertyResultStatus, schemaPropertyEmpty, schemaPropertyEmptyMessage, clearSchemaPropertyFilter, schemaPropertyTree, schemaPropertyRemovalFeedback,
    undoSchemaPropertyRemovalButton, schemaPropertyCopyFeedback, undoSchemaPropertyCopyButton, schemaPropertyRemovalDialog, schemaPropertyRemovalHeading,
    schemaPropertyRemovalSummary, confirmSchemaPropertyRemovalButton, cancelSchemaPropertyRemovalButton, schemaDocumentationRemovalDialog,
    schemaDocumentationRemovalHeading, schemaDocumentationRemovalSummary, confirmSchemaDocumentationRemoval, cancelSchemaDocumentationRemoval,
    schemaSpecificIndexDialog, schemaSpecificIndexForm, schemaSpecificIndexHeading, schemaSpecificIndexLabel, schemaSpecificIndex, schemaSpecificIndexAssistance,
    confirmSchemaSpecificIndex, cancelSchemaSpecificIndex, schemaManualPropertyDialog, schemaManualPropertyForm, schemaManualPropertyHeading,
    schemaManualPropertyPathLabel, schemaManualPropertyPath, schemaManualPropertyParentContext, schemaManualPropertyChildNameLabel, schemaManualPropertyChildName,
    schemaManualPropertyTypeLabel, schemaManualPropertyType, schemaManualArrayTypeGroup, schemaManualArrayItemType, schemaManualPropertyPreview,
    schemaManualPropertyAssistance, goToExistingSchemaPropertyButton, confirmSchemaManualPropertyButton, cancelSchemaManualPropertyButton, schemaPropertyRulePicker };
}

/** Owns the transient state for installed Schema property authoring. */
export class SchemaPropertyController {
  selectedPath = "example";
  readonly expandedRulePaths = new Set<string>();
  pendingRemoval:{ path:string; trigger?:HTMLButtonElement } | undefined;
  lastRemoval:SchemaPropertyRemoval | undefined;
  lastCopy:AppliedSchemaPropertyCopy | undefined;
  pendingCopy:SchemaPropertyCopyPlan | undefined;
  pendingCopyReview:PropertyCopyReview | undefined;
  pendingCopyPosition:{ schemaId:string; settlementSchemaId:string; path:string; editorScroll:number; treeScroll:number } | undefined;
  pendingDocumentationRemoval:{ path:string; trigger?:HTMLElement } | undefined;
  specificIndexArrayPath:string | undefined;
  specificIndexTrigger:HTMLButtonElement | undefined;
  pendingManualContext:{ parentPath:string; trigger?:HTMLButtonElement } | undefined;
  pendingManualCanonicalBase:CanonicalSchemaDocument | undefined;
  interactionReturn:{ schemaId:string; path:string; triggerLabel:string; editorScroll:number; treeScroll:number; detailScroll:number } | undefined;
  renderSequence = 0;
  #ports:PropertyControllerPorts | undefined;
  #copyDialog:HTMLDialogElement | null = null;

  configure(ports:PropertyControllerPorts):void { this.#ports=ports; this.#copyDialog=ports.root.querySelector<HTMLDialogElement>("#schema-property-copy-dialog"); }

  requestRemoval(path:string, trigger?:HTMLButtonElement):void {
    const ports=this.#required(), draft=ports.active().workingDraft; if (!draft) return;
    const inspection=inspectSchemaPropertyRemoval(draft.document, draft.attachedRules ?? [], path, draft.documentation);
    if (!inspection.requiresConfirmation) { this.applyRemoval(path); return; }
    this.pendingRemoval={ path, ...(trigger ? { trigger } : {}) };
    const summary=ports.root.querySelector<HTMLElement>("#schema-property-removal-summary");
    if (summary) { const rules=inspection.affectedRuleAttachments.map((rule) => `${rule.name ?? rule.id} at ${rule.propertyPath ?? inspection.propertyPath}`).join(", ") || "none";
      summary.textContent=`${inspection.propertyPath} contains ${inspection.descendants.length} descendants: ${inspection.descendants.join(", ") || "none"}. ${inspection.affectedRuleAttachments.length} affected rule attachments: ${rules}. Documentation entries: ${inspection.affectedDocumentationPaths?.join(", ") || "none"}. No changes occur until confirmation.`; }
    ports.root.querySelector<HTMLDialogElement>("#schema-property-removal-dialog")?.showModal(); ports.root.querySelector<HTMLElement>("#schema-property-removal-heading")?.focus();
  }
  applyRemoval(path:string):void {
    const ports=this.#required(), schema=ports.active(), draft=schema.workingDraft; if (!draft) return;
    const tree=ports.root.querySelector<HTMLElement>("#schema-property-tree"), priorPaths=Array.from(tree?.querySelectorAll<HTMLElement>("[data-schema-property-canonical-path]") ?? [], ({ dataset }) => dataset.schemaPropertyCanonicalPath ?? ""), priorIndex=Math.max(0, priorPaths.indexOf(path));
    const removal=removeSchemaProperty(draft.document, draft.attachedRules ?? [], path, draft.documentation);
    this.lastRemoval=removal; this.selectedPath=removal.propertyPath.slice(1).replaceAll("/", "."); this.expandedRulePaths.delete(removal.propertyPath);
    ports.replaceActive(updateSchemaWorkingDraft(schema, { document:removal.document, attachedRules:removal.attachedRules,
      ...(removal.documentation !== undefined ? { documentation:removal.documentation } : {}) }, `Remove property ${removal.propertyPath} and property-specific constraints`));
    this.#setText("#schema-property-removal-feedback", `Removed ${removal.propertyPath} from the working draft. Undo is available.`); this.#hidden("#undo-schema-property-removal", false);
    ports.persist(); ports.renderAll(); const remaining=Array.from(tree?.querySelectorAll<HTMLElement>("[data-schema-property-canonical-path]") ?? []), focusRow=remaining[Math.min(priorIndex, remaining.length - 1)];
    if (focusRow) { this.selectedPath=focusRow.dataset.schemaPropertyPath ?? focusRow.dataset.schemaPropertyCanonicalPath ?? ""; ports.renderView(); const selected=tree?.querySelector<HTMLElement>(`[data-schema-property-canonical-path="${CSS.escape(focusRow.dataset.schemaPropertyCanonicalPath ?? "")}"]`); (selected?.querySelector<HTMLElement>("button, a, input, select, textarea") ?? selected)?.focus({ preventScroll:true }); }
    else ports.root.querySelector<HTMLButtonElement>("#add-schema-property")?.focus({ preventScroll:true });
  }
  closeRemoval(restoreFocus=true):void { const trigger=this.pendingRemoval?.trigger; this.pendingRemoval=undefined; const dialog=this.#required().root.querySelector<HTMLDialogElement>("#schema-property-removal-dialog"); if (dialog?.open) dialog.close(); if (restoreFocus) trigger?.focus(); }
  confirmRemoval():void { const path=this.pendingRemoval?.path; this.closeRemoval(false); if (path) this.applyRemoval(path); }
  cancelRemoval(event?:Event):void { event?.preventDefault(); this.closeRemoval(); }
  undoRemoval():void {
    const ports=this.#required(), removal=this.lastRemoval; if (!removal) return;
    if (ports.canonicalUndo()) { this.lastRemoval=undefined; this.#setText("#schema-property-removal-feedback", `Restored ${removal.propertyPath} from page-scoped Undo with its canonical identity and tree position.`); this.#hidden("#undo-schema-property-removal", true); return; }
    const schema=ports.active(), restored=undoSchemaPropertyRemoval(removal), path=removal.propertyPath; this.selectedPath=path.slice(1).replaceAll("/", "."); this.expandedRulePaths.add(path);
    ports.replaceActive(updateSchemaWorkingDraft(schema, { document:restored.document, attachedRules:restored.attachedRules,
      ...(restored.documentation !== undefined ? { documentation:restored.documentation } : {}) }, `Undo property removal ${path}`));
    this.#setText("#schema-property-removal-feedback", `Restored ${path} with its prior definition and tree position.`); this.#hidden("#undo-schema-property-removal", true);
    this.lastRemoval=undefined; ports.persist(); ports.renderAll(); ports.renderView();
  }
  requestDocumentationRemoval(path:string, trigger?:HTMLElement):void { const ports=this.#required(); this.pendingDocumentationRemoval={ path, ...(trigger ? { trigger } : {}) };
    this.#setText("#schema-documentation-removal-summary", `${path} documentation will be removed from the working draft. The schema property and validation rules remain unchanged.`);
    ports.root.querySelector<HTMLDialogElement>("#schema-documentation-removal-dialog")?.showModal(); ports.root.querySelector<HTMLElement>("#schema-documentation-removal-heading")?.focus(); }
  closeDocumentationRemoval(restoreFocus=true):void { const trigger=this.pendingDocumentationRemoval?.trigger; this.pendingDocumentationRemoval=undefined; const dialog=this.#required().root.querySelector<HTMLDialogElement>("#schema-documentation-removal-dialog"); if (dialog?.open) dialog.close(); if (restoreFocus) trigger?.focus(); }
  confirmDocumentationRemoval():void { const ports=this.#required(), path=this.pendingDocumentationRemoval?.path; if (!path) return; const schema=ports.active(); this.closeDocumentationRemoval(false); if (!schema.workingDraft) return;
    ports.replaceActive(ports.removeCanonicalDocumentation(schema, path)); ports.queuePersistence(schema.id); ports.renderAll(); }
  resetCopyDialog():void { const clean=typeof this.#copyDialog?.cloneNode === "function" ? this.#copyDialog.cloneNode(false) as HTMLDialogElement : undefined;
    if (this.#copyDialog && clean) { clean.id=this.#copyDialog.id; this.#copyDialog.replaceWith(clean); this.#copyDialog=clean; } }
  openCopy(path:string, triggerOrDestination:HTMLButtonElement|string):void {
    const ports=this.#required(), sourceSchema=ports.active(), source=schemaPropertyCopySource(sourceSchema, { surface:sourceSchema.workingDraft ? "working draft" : "current" }),
      editor=ports.root.querySelector<HTMLElement>("#schema-editor"), tree=ports.root.querySelector<HTMLElement>("#schema-property-tree"), editorScroll=editor?.scrollTop ?? 0, treeScroll=tree?.scrollTop ?? 0,
      trigger=typeof triggerOrDestination === "string" ? undefined : triggerOrDestination,
      sources=[source, ...(sourceSchema.workingDraft ? [schemaPropertyCopySource(sourceSchema, { surface:"current" })] : []),
        ...schemaRevisionChoices(sourceSchema).map((version) => schemaPropertyCopySource(sourceSchema, { surface:"historical", version }))];
    this.pendingCopyReview?.close(); this.resetCopyDialog();
    const review=renderSchemaPropertyCopyReview(this.#copyDialog!, { source, sources, selectedPath:path,
      destinations:ports.schemas().filter(({ id }) => id !== sourceSchema.id), schemas:ports.schemas(), reusableRuleIds:ports.ruleIds(), ...(trigger ? { trigger } : {}),
      onApply:(transaction) => { this.pendingCopyPosition={ schemaId:sourceSchema.id, settlementSchemaId:transaction.schema.id, path, editorScroll, treeScroll };
        ports.replaceSchemas(ports.schemas().map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema)); this.lastCopy=transaction;
        this.pendingCopy=undefined; this.pendingCopyReview=undefined; ports.persist(); ports.renderAll(); ports.renderRules(); this.#hidden("#undo-schema-property-copy", false);
        this.#setText("#schema-property-copy-feedback", `Copied ${path} from ${source.label} to ${transaction.schema.name}. Published revisions are unchanged.`);
        const restoration=this.pendingCopyPosition, restore=():void => { tree?.querySelector<HTMLElement>(`button[aria-label="Copy ${path} to another schema"]`)?.focus({ preventScroll:true }); if (editor) editor.scrollTop=editorScroll; if (tree) tree.scrollTop=treeScroll; },
          complete=():void => { restore(); ports.scheduleFrame(() => { restore(); if (this.pendingCopyPosition === restoration) this.pendingCopyPosition=undefined; }); };
        queueMicrotask(restore); ports.scheduleFrame(restore); if (ports.settle) void ports.settle(transaction.schema.id).then(() => ports.scheduleFrame(complete), () => {}); else ports.scheduleFrame(complete);
      }, ...(trigger ? { onClose:() => trigger.focus({ preventScroll:true }) } : {}) });
    this.pendingCopyReview=review;
    if (typeof triggerOrDestination === "string") { const destination=this.#copyDialog?.querySelector<HTMLSelectElement>("#schema-property-copy-destination"); if (destination) {
      destination.value=triggerOrDestination; const testable=destination as HTMLSelectElement & { dispatch?:(type:string)=>void };
      if (testable.dispatch) testable.dispatch("change"); else destination.dispatchEvent(new Event("change", { bubbles:true })); } this.pendingCopy=review.plan(); }
  }
  confirmCopy():void { const ports=this.#required(); if (!this.pendingCopy) return; const transaction=applySchemaPropertyCopy(this.pendingCopy);
    ports.replaceSchemas(ports.schemas().map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema)); this.lastCopy=transaction;
    this.pendingCopy=undefined; this.pendingCopyReview?.close(); this.pendingCopyReview=undefined; this.resetCopyDialog();
    this.#setText("#schema-property-copy-feedback", `Copied ${transaction.plan.selectedPath} from ${transaction.plan.source.label} to ${transaction.schema.name}. Published revisions are unchanged.`);
    this.#hidden("#undo-schema-property-copy", false); ports.persist(); ports.renderAll(); }
  undoCopy():void { const ports=this.#required(); if (!this.lastCopy) return; const restored=undoSchemaPropertyCopy(this.lastCopy).schema;
    ports.replaceSchemas(ports.schemas().map((schema) => schema.id === restored.id ? restored : schema)); this.#setText("#schema-property-copy-feedback", `Undid property copy to ${restored.name}; the pre-copy working draft was restored.`);
    this.#hidden("#undo-schema-property-copy", true); this.lastCopy=undefined; ports.persist(); ports.renderAll(); }
  renderSpecificIndex():void { const ports=this.#required(), draft=ports.active().workingDraft; if (!this.specificIndexArrayPath || !draft) return;
    const input=this.#query<HTMLInputElement>("#schema-specific-index"), inspection=inspectSpecificIndexRuleTarget(draft.document, this.specificIndexArrayPath, input?.value ?? ""), confirm=this.#query<HTMLButtonElement>("#confirm-schema-specific-index");
    if (confirm) confirm.disabled=inspection.result !== "accepted"; this.#setText("#schema-specific-index-assistance", inspection.assistance); }
  openSpecificIndex(arrayPath:string, trigger?:HTMLButtonElement):void { const ports=this.#required(); this.specificIndexArrayPath=arrayPath; this.specificIndexTrigger=trigger;
    const input=this.#query<HTMLInputElement>("#schema-specific-index"), confirm=this.#query<HTMLButtonElement>("#confirm-schema-specific-index"); if (input) input.value=""; if (confirm) confirm.disabled=true;
    this.#setText("#schema-specific-index-assistance", "Enter a non-negative array index"); this.#query<HTMLDialogElement>("#schema-specific-index-dialog")?.showModal(); input?.focus(); }
  submitSpecificIndex(event:Event):void { event.preventDefault(); const ports=this.#required(), draft=ports.active().workingDraft; if (!draft || !this.specificIndexArrayPath) return;
    const inspection=inspectSpecificIndexRuleTarget(draft.document, this.specificIndexArrayPath, this.#query<HTMLInputElement>("#schema-specific-index")?.value ?? "");
    if (inspection.result !== "accepted") return; const trigger=this.specificIndexTrigger, path=inspection.canonicalPath.slice(1).replaceAll("/", "."); this.closeSpecificIndex(); ports.openRulePicker(path, trigger); }
  closeSpecificIndex(event?:Event):void { event?.preventDefault(); this.#query<HTMLDialogElement>("#schema-specific-index-dialog")?.close(); this.specificIndexTrigger?.focus(); this.specificIndexArrayPath=undefined; this.specificIndexTrigger=undefined; }
  parentDocuments():SchemaDefinition["document"][] { const ports=this.#required(), documents:SchemaDefinition["document"][]=[], visited=new Set<string>(); let parentId=ports.active().workingDraft?.parentSchemaId ?? ports.active().parentSchemaId;
    while (parentId && !visited.has(parentId)) { visited.add(parentId); const parent=ports.schemas().find(({ id }) => id === parentId); if (!parent) break; documents.push(parent.document); parentId=parent.parentSchemaId; } return documents; }
  manualDefinition():ManualPropertyDefinition { const ports=this.#required(), type=(ports.root.querySelector<HTMLSelectElement>("#schema-manual-property-type")?.value || "string") as ManualPropertyValueType,
      arrayType=(ports.root.querySelector<HTMLSelectElement>("#schema-manual-array-item-type")?.value ?? "") as ManualArrayItemType|"";
    if (this.pendingManualContext) return contextualManualPropertyDefinition(this.pendingManualContext.parentPath, ports.root.querySelector<HTMLInputElement>("#schema-manual-property-child-name")?.value ?? "", type, type === "array" && arrayType ? arrayType : undefined);
    return { path:ports.root.querySelector<HTMLInputElement>("#schema-manual-property-path")?.value ?? "", type, ...(type === "array" && arrayType ? { arrayItemType:arrayType } : {}) }; }
  renderManual():void { const ports=this.#required(), draft=ports.active().workingDraft; if (!draft) return; const definition=this.manualDefinition(), inspection=inspectManualProperty(draft.document, this.parentDocuments(), definition), contextual=Boolean(this.pendingManualContext);
    this.#hidden("#schema-manual-property-path-label", contextual); this.#hidden("#schema-manual-property-path", contextual); this.#hidden("#schema-manual-property-child-name-label", !contextual); this.#hidden("#schema-manual-property-child-name", !contextual);
    const parent=ports.root.querySelector<HTMLElement>("#schema-manual-property-parent-context"); if (parent) { parent.hidden=!contextual; parent.textContent=this.pendingManualContext ? `Parent path: ${this.pendingManualContext.parentPath}` : ""; }
    this.#hidden("#schema-manual-array-type-group", definition.type !== "array"); this.#setText("#schema-manual-property-preview", definition.path.trim() ? `Normalized path: ${inspection.normalizedPath || "none"}. ${manualPropertyPreview(definition)}. Missing object path: ${inspection.missingObjectPath.join(", ") || "none"}.` : "Normalized path: none. Missing object path: none.");
    this.#setText("#schema-manual-property-assistance", inspection.result === "blocked" ? inspection.assistance : "Ready to add"); const confirm=ports.root.querySelector<HTMLButtonElement>("#confirm-schema-manual-property"); if (confirm) confirm.disabled=inspection.result === "blocked";
    const existing=inspection.result === "blocked" ? inspection.existingPath : undefined, go=ports.root.querySelector<HTMLButtonElement>("#go-to-existing-schema-property"); if (go) { go.hidden=!existing; if (existing && inspection.result === "blocked") { go.textContent=inspection.assistance; go.dataset.schemaPropertyPath=existing; } else delete go.dataset.schemaPropertyPath; } }
  openManual(parentPath?:string, trigger?:HTMLButtonElement):void { const ports=this.#required(); if (!ports.active().workingDraft) return; this.pendingManualContext=parentPath ? { parentPath, ...(trigger ? { trigger } : {}) } : undefined; this.pendingManualCanonicalBase=ports.active().workingDraft?.canonicalSchema;
    this.#setText("#schema-manual-property-heading", parentPath ? "Add child property" : "Add property"); for (const selector of ["#schema-manual-property-path", "#schema-manual-property-child-name"]) { const input=ports.root.querySelector<HTMLInputElement>(selector); if (input) input.value=""; }
    const type=ports.root.querySelector<HTMLSelectElement>("#schema-manual-property-type"), array=ports.root.querySelector<HTMLSelectElement>("#schema-manual-array-item-type"); if (type) type.value="string"; if (array) array.value="";
    this.renderManual(); ports.root.querySelector<HTMLDialogElement>("#schema-manual-property-dialog")?.showModal(); ports.root.querySelector<HTMLInputElement>(parentPath ? "#schema-manual-property-child-name" : "#schema-manual-property-path")?.focus(); }
  closeManual(restoreFocus=true):void { const ports=this.#required(), trigger=this.pendingManualContext?.trigger; this.pendingManualContext=undefined; ports.root.querySelector<HTMLDialogElement>("#schema-manual-property-dialog")?.close(); if (restoreFocus) (trigger ?? ports.root.querySelector<HTMLButtonElement>("#add-schema-property"))?.focus(); }
  submitManual(event:Event):void { event.preventDefault(); const ports=this.#required(), schema=ports.active(), draft=schema.workingDraft; if (!draft) return; const definition=this.manualDefinition(), inspection=inspectManualProperty(draft.document, this.parentDocuments(), definition);
    if (inspection.result !== "ready") { this.renderManual(); return; } const document=addManualProperty(draft.document, this.parentDocuments(), definition), canonicalSchema=ports.addManualCanonical(schema, document, inspection.normalizedPath);
    ports.replaceActive(updateSchemaWorkingDraft(schema, { document, ...(canonicalSchema ? { canonicalSchema } : {}) }, `Add manual property ${inspection.normalizedPath}`)); this.selectedPath=inspection.normalizedPath.slice(1).replaceAll("/", ".");
    this.closeManual(false); this.pendingManualCanonicalBase=undefined; ports.persist(); ports.renderAll(); }
  goToExisting():void { const ports=this.#required(), path=ports.root.querySelector<HTMLButtonElement>("#go-to-existing-schema-property")?.dataset.schemaPropertyPath; if (!path) return;
    this.selectedPath=path.replace(/^\//, "").replaceAll("/", "."); this.closeManual(false); ports.renderAll(); ports.root.querySelector<HTMLButtonElement>(`button[aria-label="${CSS.escape(`Add rule for ${this.selectedPath}`)}"]`)?.focus({ preventScroll:true }); }

  #query<E extends Element>(selector:string):E|null { const root=this.#required().root;
    return root.querySelector<E>(selector) ?? (root as Node).ownerDocument?.querySelector<E>(selector) ?? null; }
  #setText(selector:string, value:string):void { const element=this.#query<HTMLElement>(selector); if (element) element.textContent=value; }
  #hidden(selector:string, value:boolean):void { const element=this.#required().root.querySelector<HTMLElement>(selector); if (element) element.hidden=value; }
  #required():PropertyControllerPorts { if (!this.#ports) throw new Error("Schema property controller is not configured."); return this.#ports; }

  dispose(resetCopyDialog:()=>void = () => this.resetCopyDialog()):void {
    this.pendingRemoval = undefined;
    this.pendingDocumentationRemoval = undefined;
    this.lastRemoval = undefined;
    this.pendingCopyReview?.close();
    this.pendingCopyReview = undefined;
    resetCopyDialog();
    this.pendingCopy = undefined;
    this.lastCopy = undefined;
    this.pendingCopyPosition = undefined;
    this.specificIndexArrayPath = undefined;
    this.specificIndexTrigger = undefined;
    this.pendingManualContext = undefined;
    this.pendingManualCanonicalBase = undefined;
    this.interactionReturn = undefined;
    this.expandedRulePaths.clear();
  }
}
