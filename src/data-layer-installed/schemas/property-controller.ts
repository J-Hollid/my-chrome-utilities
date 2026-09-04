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

  #setText(selector:string, value:string):void { const element=this.#required().root.querySelector<HTMLElement>(selector); if (element) element.textContent=value; }
  #hidden(selector:string, value:boolean):void { const element=this.#required().root.querySelector<HTMLElement>(selector); if (element) element.hidden=value; }
  #required():PropertyControllerPorts { if (!this.#ports) throw new Error("Schema property controller is not configured."); return this.#ports; }

  dispose(resetCopyDialog:()=>void):void {
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
