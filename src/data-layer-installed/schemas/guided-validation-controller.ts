import {
  GUIDED_CONTINUATION_STORAGE_KEY,
  restoreGuidedContinuationSelections,
  selectGuidedContinuation,
  selectedGuidedContinuation,
  schemaPropertyRows,
  addLiveSchemaPropertyDeclaration,
  applyAllowedValueExpansion,
  reviewAllowedValueExpansion,
  openAllowedValueExpansionDialog,
  type PromotableReusableRule,
  type ReusableAllowedValueRule,
  type SchemaDefinition,
  type ValidationEvaluation,
  type GuidedContinuationSelections,
  type PublishedGuidedValidation,
  type SchemaAssignment,
} from "../../utilities/data-layer/schemas.js";
import { assignmentDraftAfterGuidedSave, guidedAttachedRule, guidedPropertyDocument, mergeGuidedDocument, updateSchemaWorkingDraft } from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./contracts.js";
import { createLiveSchemaPropertyDeclaration } from "../../data-layer-live-schema-property-declaration.js";
import type { GuidedSchemaCandidate } from "../../data-layer-guided-validation.js";
import type { AllowedValueExpansionDestination } from "../../data-layer-allowed-value-expansion.js";

export interface GuidedCapturedEvent {
  id:string; sourceId:string; name:string; payload:unknown; rawInput:unknown; pageUrl?:string;
}

interface GuidedValidationPorts {
  root:ParentNode;
  guidedRoot:HTMLElement | null;
  document:Document | null;
  schemas():readonly SchemaDefinition[];
  replaceSchemas(schemas:readonly SchemaDefinition[]):void;
  persistSchemas():void;
  renderSchemas():void;
  openDraft(schema:SchemaDefinition):void;
  restoreCapture(eventId:string, propertyPath?:string, focusAction?:"validation"|"declaration"):void;
  scheduleFrame(callback:()=>void):void;
  generation():number;
  selectSchema(schemaId:string, propertyPath:string):void;
  result(message:string):void;
  expansionRules():readonly PromotableReusableRule[];
  replaceExpansionRules(rules:readonly ReusableAllowedValueRule[]):void;
  rules():readonly ReusableSchemaRule[];
  replaceRules(rules:readonly ReusableSchemaRule[]):void;
  applyPersistence(schemas:readonly SchemaDefinition[],rules:readonly ReusableSchemaRule[]):void;
  beginPersistence(schemaId:string,previousSchemas:readonly SchemaDefinition[],previousRules:readonly ReusableSchemaRule[],nextSchemas:readonly SchemaDefinition[],nextRules:readonly ReusableSchemaRule[]):Promise<void>;
}

export type GuidedPropertyReturn =
  | { kind:"schema"; schemaId:string; propertyPath:string; generation:number }
  | { kind:"capture"; eventId:string; propertyPath:string; generation:number };

export class SchemaGuidedValidationController {
  readonly #storage:Pick<Storage, "getItem" | "setItem">;
  selections:GuidedContinuationSelections;
  propertyReturn:GuidedPropertyReturn | undefined;
  readonly #dialogDisposers:Array<() => void> = [];
  readonly #livePropertyDisposers:Array<() => void> = [];
  readonly #allowedValueDisposers:Array<() => void> = [];
  #ports:GuidedValidationPorts | undefined;

  constructor(storage:Pick<Storage, "getItem" | "setItem">) {
    this.#storage = storage;
    this.selections = restoreGuidedContinuationSelections(storage.getItem(GUIDED_CONTINUATION_STORAGE_KEY));
  }
  configure(ports:GuidedValidationPorts):void { this.#ports = ports; }
  select(event:Pick<{ sourceId:string; name:string }, "sourceId" | "name">, schemaId:string):void {
    this.selections = selectGuidedContinuation(this.selections, event, schemaId);
    this.#storage.setItem(GUIDED_CONTINUATION_STORAGE_KEY, JSON.stringify(this.selections));
  }
  ownDialog(dispose:()=>void):void { this.#dialogDisposers.push(dispose); }
  ownLiveProperty(dispose:()=>void):void { this.#livePropertyDisposers.push(dispose); }
  ownAllowedValue(dispose:()=>void):void { this.#allowedValueDisposers.push(dispose); }
  clearDialog():void { for (const dispose of this.#dialogDisposers.splice(0)) dispose(); }
  clearLiveProperty():void { for (const dispose of this.#livePropertyDisposers.splice(0)) dispose(); }
  clearAllowedValue():void { for (const dispose of this.#allowedValueDisposers.splice(0)) dispose(); }
  dialogListenerCount():number { return this.#dialogDisposers.length; }
  selected(event:Pick<GuidedCapturedEvent, "sourceId" | "name">):SchemaDefinition | undefined {
    return selectedGuidedContinuation(this.selections, event, this.#required().schemas());
  }
  candidates(event:GuidedCapturedEvent):readonly { schema:SchemaDefinition; assignment:SchemaDefinition["assignments"][number]; typeCoverage:number }[] {
    const types = (value:unknown):readonly string[] => Array.isArray(value) ? ["array"] : value === null ? ["null"]
      : typeof value === "object" ? ["object", ...Object.values(value as Record<string, unknown>).flatMap(types)] : [typeof value];
    return this.#required().schemas().flatMap((schema) => { const assignment = schema.assignments.find((candidate) =>
      candidate.sourceId === event.sourceId && candidate.eventName === event.name && candidate.enabled !== false);
      return assignment ? [{ schema, assignment, typeCoverage:new Set(types(event.payload)).size }] : []; });
  }
  uiCandidate(schema:SchemaDefinition, editable:SchemaDefinition):GuidedSchemaCandidate {
    const propertyTypes = (document:SchemaDefinition["document"], prefix=""):Record<string,"String"|"Number"|"Boolean"|"Array"|"Object"> =>
      Object.entries(document.properties ?? {}).reduce<Record<string,"String"|"Number"|"Boolean"|"Array"|"Object">>((types, [name, child]) => {
        const path=prefix ? `${prefix}.${name}` : name, type=child.type === "string" ? "String" : child.type === "number" ? "Number"
          : child.type === "boolean" ? "Boolean" : child.type === "array" ? "Array" : child.type === "object" ? "Object" : undefined;
        if (type) types[path]=type; return { ...types, ...propertyTypes(child, path) };
      }, {});
    return { id:schema.id, name:schema.name, version:schema.version, target:editable.assignments[0]?.target ?? "payload",
      propertyTypes:propertyTypes(editable.document), assignments:editable.assignments.map((assignment) => ({ ...assignment })) };
  }
  uiEvent(event:GuidedCapturedEvent):{ id:string; sourceId:string; name:string; pageUrl:string; payload:Record<string,unknown> } {
    return { id:event.id, sourceId:event.sourceId, name:event.name, pageUrl:event.pageUrl ?? globalThis.location?.href ?? "https://invalid.local/",
      payload:event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? structuredClone(event.payload) as Record<string,unknown> : {} };
  }
  restorePropertyReturn():void {
    const ports=this.#required(), snapshot=this.propertyReturn; if (!snapshot || snapshot.generation !== ports.generation()) return;
    this.propertyReturn=undefined;
    if (snapshot.kind === "capture") ports.restoreCapture(snapshot.eventId, snapshot.propertyPath);
    else ports.selectSchema(snapshot.schemaId, snapshot.propertyPath);
  }
  openContinuationPicker(event:GuidedCapturedEvent):void {
    const ports=this.#required(), root=ports.guidedRoot, document=ports.document; if (!root || !document) return;
    this.clearDialog(); root.replaceChildren();
    const dialog=document.createElement("dialog"), heading=document.createElement("h5"), choices=document.createElement("div");
    dialog.id="guided-continuation-schema-picker"; dialog.setAttribute("aria-labelledby", "guided-continuation-schema-picker-heading");
    heading.id="guided-continuation-schema-picker-heading"; heading.textContent="Choose schema destination";
    choices.setAttribute("aria-label", "Schemas with working drafts");
    for (const schema of ports.schemas().filter(({ workingDraft }) => Boolean(workingDraft))) {
      const choose=document.createElement("button"); choose.type="button";
      choose.textContent=`${schema.name} revision ${schema.version} · ${schema.workingDraft?.pendingChanges.length ?? 0} pending changes`;
      const select=():void => { this.select(event, schema.id); dialog.close(); root.replaceChildren(); ports.restoreCapture(event.id); this.clearDialog(); };
      choose.addEventListener("click", select); this.ownDialog(() => choose.removeEventListener("click", select)); choices.append(choose);
    }
    const cancel=document.createElement("button"); cancel.type="button"; cancel.textContent="Cancel";
    const close=():void => { dialog.close(); root.replaceChildren(); this.clearDialog(); };
    cancel.addEventListener("click", close); this.ownDialog(() => cancel.removeEventListener("click", close));
    dialog.append(heading, choices, cancel); root.append(dialog); dialog.showModal(); heading.focus({ preventScroll:true });
  }
  openLivePropertyDeclaration(event:GuidedCapturedEvent, path:string, trigger:HTMLButtonElement):boolean {
    const ports=this.#required(), root=ports.guidedRoot, document=ports.document; if (!root || !document) return false;
    this.clearLiveProperty(); root.replaceChildren();
    const dialog=document.createElement("dialog"), feedback=document.createElement("output");
    dialog.className="live-schema-property-declaration-review"; dialog.setAttribute("aria-labelledby", "live-schema-property-declaration-heading");
    const close=(restoreFocus=true):void => { this.clearLiveProperty(); dialog.close(); root.replaceChildren(); if (restoreFocus) trigger.focus({ preventScroll:true }); };
    const listen=(control:HTMLButtonElement, action:()=>void):void => { control.addEventListener("click", action); this.ownLiveProperty(() => control.removeEventListener("click", action)); };
    const showReview=(schema:SchemaDefinition):void => {
      const heading=document.createElement("h5"), review=document.createElement("p"), confirm=document.createElement("button"), cancel=document.createElement("button");
      heading.id="live-schema-property-declaration-heading"; heading.textContent="Review schema property declaration";
      try { const declaration=createLiveSchemaPropertyDeclaration(event.payload, path, schema);
        review.textContent=`${declaration.canonicalPath} · ${declaration.detectedType} · ${schema.name} revision ${schema.version}. No validation rule will be added.`;
        confirm.type=cancel.type="button"; confirm.textContent=`Add property to ${schema.name} draft`; cancel.textContent="Cancel";
        listen(confirm, () => { try { ports.replaceSchemas(ports.schemas().map((candidate) => candidate.id === schema.id
            ? addLiveSchemaPropertyDeclaration(candidate, declaration) : candidate)); ports.persistSchemas(); ports.renderSchemas(); close(false);
            ports.scheduleFrame(() => ports.restoreCapture(event.id, declaration.concretePath, "declaration")); }
          catch (error) { feedback.textContent=error instanceof Error ? error.message : "The property could not be added to the schema draft."; } });
        listen(cancel, () => close()); dialog.replaceChildren(heading, review, feedback, confirm, cancel);
      } catch (error) { feedback.textContent=error instanceof Error ? error.message : "The observed property is unavailable.";
        cancel.type="button"; cancel.textContent="Cancel"; listen(cancel, () => close()); dialog.replaceChildren(heading, feedback, cancel); }
      heading.focus({ preventScroll:true });
    };
    const selected=this.selected(event);
    if (selected?.workingDraft) showReview(selected);
    else { const heading=document.createElement("h5"), choices=ports.schemas().filter(({ workingDraft }) => Boolean(workingDraft)).map((schema) => {
        const choose=document.createElement("button"); choose.type="button"; choose.textContent=schema.name; listen(choose, () => showReview(schema)); return choose; }),
        cancel=document.createElement("button"); heading.id="live-schema-property-declaration-heading"; heading.textContent="Choose schema destination";
      cancel.type="button"; cancel.textContent="Cancel"; listen(cancel, () => close()); dialog.replaceChildren(heading, ...choices, cancel); heading.focus({ preventScroll:true }); }
    root.append(dialog); dialog.showModal(); return true;
  }
  openAllowedValueExpansion(eventId:string, assignedSchemaId:string, evaluation:ValidationEvaluation, trigger:HTMLButtonElement):boolean {
    const ports=this.#required(), inspector=ports.root.querySelector<HTMLElement>("#live-event-inspector"); if (!inspector) return false;
    const inspectorScroll=inspector.scrollTop, expandedPaths=Array.from(inspector.querySelectorAll<HTMLDetailsElement>("details[open][data-property-path]"),
      ({ dataset }) => dataset.propertyPath).filter((path):path is string => Boolean(path));
    const restoreLiveAction=():void => { ports.restoreCapture(eventId, evaluation.propertyPath); ports.scheduleFrame(() => {
      const restored=ports.root.querySelector<HTMLElement>("#live-event-inspector"); for (const path of expandedPaths)
        restored?.querySelector<HTMLDetailsElement>(`details[data-property-path="${CSS.escape(path)}"]`)?.setAttribute("open", "");
      if (restored) restored.scrollTop=inspectorScroll; restored?.querySelector<HTMLButtonElement>(`.live-allowed-value-expansion[data-rule-id="${CSS.escape(evaluation.ruleId ?? "")}"]`)?.focus({ preventScroll:true }); }); };
    const input={ schemas:ports.schemas(), reusableRules:ports.expansionRules(), assignedSchemaId, evidence:evaluation };
    let review:ReturnType<typeof reviewAllowedValueExpansion>;
    try { review=reviewAllowedValueExpansion(input); } catch (error) { ports.result(error instanceof Error ? error.message : "The allowed value review is unavailable."); return false; }
    this.clearAllowedValue(); const dispose=openAllowedValueExpansionDialog({ inspector, review, trigger,
      confirm:(destination:AllowedValueExpansionDestination) => { const applied=applyAllowedValueExpansion({ ...input, destination });
        ports.replaceSchemas(applied.schemas); ports.replaceExpansionRules(applied.reusableRules); ports.persistSchemas(); ports.selectSchema(applied.affectedSchemaId, evaluation.propertyPath);
        ports.result(applied.changed ? `${String(review.proposedValue)} was added to the working draft.` : "The allowed value was already pending; no duplicate was created.");
        return () => ports.scheduleFrame(restoreLiveAction); },
      openDraft:(destination:AllowedValueExpansionDestination) => { const targetId=destination === "parent-schema-draft" ? evaluation.schemaId : assignedSchemaId,
        target=ports.schemas().find(({ id }) => id === targetId); trigger.focus({ preventScroll:true }); if (target) ports.openDraft(target); },
    }); this.ownAllowedValue(dispose); return true;
  }
  persistPublished(result:PublishedGuidedValidation):Promise<void> {
    const ports=this.#required(),rule=result.schema.rules[0]; if (!rule) return Promise.resolve();
    const previousSchemas=structuredClone(ports.schemas()),previousRules=structuredClone(ports.rules()),previous=result.destination.previousSchemaId ? ports.schemas().find(({ id }) => id===result.destination.previousSchemaId) : undefined,
      assignment:SchemaAssignment={ id:result.assignment.id,name:result.assignment.name,sourceId:result.assignment.sourceId,eventName:result.assignment.eventName,target:result.assignment.target,priority:result.assignment.priority,versionPolicy:result.assignment.versionPolicy,enabled:true,
        ...(result.assignment.domainCondition ? { domainCondition:result.assignment.domainCondition } : {}),...(result.assignment.pathnameCondition ? { pathnameCondition:result.assignment.pathnameCondition } : {}),...(result.assignment.pathConditions ? { pathConditions:result.assignment.pathConditions } : {}) },
      attached=guidedAttachedRule(rule,result.reusableRules[0]?.name ?? `${rule.path} requirement`,`local-rule:${result.schema.id}:${rule.path}`),draft=previous?.workingDraft,
      assignments=assignmentDraftAfterGuidedSave(draft?.assignments ?? previous?.assignments ?? [],assignment,result.destination.assignmentAction),document=mergeGuidedDocument(draft?.document ?? previous?.document ?? { type:"object" },guidedPropertyDocument(rule.path,rule.expectedType)),
      attachedRules=[...(draft?.attachedRules ?? previous?.attachedRules ?? []).filter((candidate) => candidate.id!==attached.id || candidate.propertyPath!==attached.propertyPath),attached],schema:SchemaDefinition=previous
        ? updateSchemaWorkingDraft(previous,{ document,assignments,attachedRules },`Add ${rule.path} validation`)
        : { id:result.schema.id,name:result.schema.name,version:1,document:{ type:"object" },assignments:[],published:false,workingDraft:{ baseVersion:0,sourceVersion:0,document,assignments,attachedRules,pendingChanges:[`Add ${rule.path} validation`] } },
      nextSchemas=[...ports.schemas().filter(({ id }) => id!==schema.id),schema],published=result.reusableRules[0],nextRules:ReusableSchemaRule[]=published ? [...ports.rules().filter(({ id }) => id!==published.id),
        { id:published.id,name:published.name,kind:attached.operator ?? "required",version:published.version,enabled:published.enabled ?? true,attachments:[schema.id],...(attached.operator ? { operator:attached.operator } : {}),...(attached.parameters ? { parameters:attached.parameters } : {}),...(attached.allowedValues ? { allowedValues:attached.allowedValues } : {}),...(attached.severity ? { severity:attached.severity } : {}),...(attached.message ? { message:attached.message } : {}),...(attached.conditionGroup ? { conditionGroup:attached.conditionGroup } : {}) }] : [...ports.rules()];
    ports.applyPersistence(nextSchemas,nextRules); ports.replaceRules(nextRules); return ports.beginPersistence(schema.id,previousSchemas,previousRules,nextSchemas,nextRules);
  }
  documentHasPath(document:SchemaDefinition["document"], path:string):boolean {
    const normalized=`/${path.replace(/^\//, "").replaceAll(".", "/")}`;
    return schemaPropertyRows(document).some(({ canonicalPath }) => canonicalPath === normalized);
  }
  #required():GuidedValidationPorts { if (!this.#ports) throw new Error("Guided validation controller is not configured."); return this.#ports; }
  dispose():void {
    this.clearDialog(); this.clearLiveProperty(); this.clearAllowedValue(); this.propertyReturn = undefined;
  }
}
