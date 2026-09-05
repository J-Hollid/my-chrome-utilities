import { normalizeAllowedValuesRuleLibraryEntry } from "../../data-layer-allowed-values-rule.js";
import {
  configuredRuleDetails,
  applicablePropertyTypesForRule,
  schemaPropertyRows,
  typedComparisonValue,
  updateSchemaWorkingDraft,
  type AssignmentConditionTarget,
  type PromotableReusableRule,
  type RuleConfiguration,
  type SchemaDefinition,
  type SchemaPropertyType,
} from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./contracts.js";
import type { SchemaRuleBehaviorPorts } from "./rule-behavior-contracts.js";
import { SchemaRuleAttachmentWorkflow } from "./rule-attachment-workflow.js";
import { SchemaRulePromotionWorkflow } from "./rule-promotion-workflow.js";
export type { RuleElements } from "./rule-view-contracts.js";

export const SCHEMA_RULE_STORAGE_KEY = "my-chrome-utilities.schema-rule-library.v1";

function normalizeRule(value:unknown):ReusableSchemaRule | undefined {
  if (!value || typeof value !== "object" || !("id" in value) || !("name" in value) || !("version" in value)) return;
  const candidate = structuredClone(value) as Partial<ReusableSchemaRule> & Pick<ReusableSchemaRule, "id" | "name" | "version">;
  return normalizeAllowedValuesRuleLibraryEntry({ ...candidate,
    kind:typeof candidate.kind === "string" && candidate.kind ? candidate.kind : candidate.operator === "allowed-values" ? "Allowed values" : "Rule",
    enabled:candidate.enabled !== false } as ReusableSchemaRule);
}

export class SchemaRuleController {
  readonly #storage:Pick<Storage, "getItem" | "setItem">;
  #behavior:SchemaRuleBehaviorPorts | undefined;
  #rules:ReusableSchemaRule[]=[];
  #pickerPath:string | undefined;
  #pickerTrigger:HTMLButtonElement | undefined;
  #pickerSearch = "";
  #configuration:RuleConfiguration | undefined;
  #editingAttached:NonNullable<SchemaDefinition["attachedRules"]>[number] | undefined;
  #editingReusableId:string | undefined;
  #approvedRevisionId:string | undefined;
  #pendingSnapshot:{ id:string; version:number; attachments:readonly string[] } | undefined;
  #pendingRevision:{ id:string; changes:Partial<Omit<ReusableSchemaRule, "id" | "version" | "revisionHistory">> } | undefined;
  #pendingDeletionId:string | undefined;
  readonly #attachmentWorkflow:SchemaRuleAttachmentWorkflow;
  readonly #promotionWorkflow:SchemaRulePromotionWorkflow;
  readonly #rowDisposers:Array<() => void> = [];
  readonly #pickerDisposers:Array<() => void> = [];

  constructor(storage:Pick<Storage, "getItem" | "setItem">, behavior?:SchemaRuleBehaviorPorts) {
    this.#storage = storage;
    this.#behavior = behavior;
    this.#attachmentWorkflow=new SchemaRuleAttachmentWorkflow({ behavior:() => this.#required(),stored:(id) => this.stored(id) });
    this.#promotionWorkflow=new SchemaRulePromotionWorkflow({ behavior:() => this.#required(),rules:() => this.rules,replaceRules:(rules) => this.replaceRules(rules),
      persist:() => this.persist(),render:() => this.render() });
    const serialized = storage.getItem(SCHEMA_RULE_STORAGE_KEY);
    try {
      const stored = JSON.parse(serialized ?? "[]") as unknown;
      this.#rules = Array.isArray(stored) ? stored.map(normalizeRule).filter((rule):rule is ReusableSchemaRule => Boolean(rule)) : [];
    } catch {
      this.#rules = [];
    }
    if (serialized !== null && JSON.stringify(this.rules) !== serialized) this.persist();
  }
  configure(behavior:SchemaRuleBehaviorPorts):void { this.#behavior = behavior; }
  get rules():ReusableSchemaRule[] { return structuredClone(this.#rules); }
  get pickerPath():string|undefined { return this.#pickerPath; }
  pickerTriggerLabel():string|undefined { return this.#pickerTrigger?.getAttribute("aria-label") ?? undefined; }
  focusPickerTrigger():boolean {
    if (!this.#pickerTrigger?.isConnected) return false;
    this.#pickerTrigger.focus({preventScroll:true}); return true;
  }
  get pickerSearch():string { return this.#pickerSearch; }
  get configuration():RuleConfiguration|undefined { return this.#configuration?structuredClone(this.#configuration):undefined; }
  get editingAttached() { return this.#editingAttached?structuredClone(this.#editingAttached):undefined; }
  get editingReusableId():string|undefined { return this.#editingReusableId; }
  get approvedRevisionId():string|undefined { return this.#approvedRevisionId; }
  get pendingSnapshot() { return this.#pendingSnapshot?structuredClone(this.#pendingSnapshot):undefined; }
  replaceRules(rules:readonly ReusableSchemaRule[]):void { this.#rules=structuredClone([...rules]); }
  setPicker(path:string|undefined,trigger?:HTMLButtonElement):void { this.#pickerPath=path;this.#pickerTrigger=trigger; }
  setPickerSearch(value:string):void { this.#pickerSearch=value; }
  setConfiguration(value:RuleConfiguration|undefined):void { this.#configuration=value?structuredClone(value):undefined; }
  setEditingAttached(value:NonNullable<SchemaDefinition["attachedRules"]>[number]|undefined):void { this.#editingAttached=value?structuredClone(value):undefined; }
  resetPickerState():void { this.#pickerPath=undefined;this.#pickerTrigger=undefined;this.#configuration=undefined;this.#editingAttached=undefined;this.#pickerSearch=""; }

  reload():void {
    const serialized = this.#storage.getItem(SCHEMA_RULE_STORAGE_KEY);
    try {
      const stored = JSON.parse(serialized ?? "[]") as unknown;
      this.#rules = Array.isArray(stored) ? stored.map(normalizeRule).filter((rule):rule is ReusableSchemaRule => Boolean(rule)) : [];
    } catch {
      this.#rules = [];
    }
  }
  persist():void { this.#storage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(this.rules)); }
  stored(id:string):ReusableSchemaRule | undefined { return this.rules.find((rule) => rule.id === id); }
  expansionRules() { return structuredClone(this.rules); }
  normalizePickerPath(path:string):string { return `/${path.replace(/^\//, "").replaceAll(".", "/")}`; }
  valueAtPath(value:unknown, path:string):{ exists:boolean; value:unknown } {
    let current=value;
    for (const segment of path.replace(/^\//, "").split(/[/.]/).filter(Boolean)) {
      if (current===null || typeof current!=="object" || !(segment in current)) return { exists:false, value:undefined };
      current=(current as Record<string, unknown>)[segment];
    }
    return { exists:true, value:current };
  }
  conditionPredicate(propertyPath:string, sampleProperty=false):NonNullable<PromotableReusableRule["conditionGroup"]> {
    const ports=this.#behavior; if (!ports) return { operator:"All", predicates:[] };
    const editable=ports.editableSchema(), consequence=this.normalizePickerPath(propertyPath),
       paths=schemaPropertyRows(editable.document).map(({ canonicalPath }) => canonicalPath);
    const choice=sampleProperty ? consequence : paths.find((path) => this.normalizePickerPath(path)==="/page_type")
      ?? paths.find((path) => this.normalizePickerPath(path)!==consequence) ?? "";
    const canonical=choice ? this.normalizePickerPath(choice) : "", sample=this.valueAtPath(ports.capturedValue("payload"), canonical),
      comparable=sample.exists && (sample.value===null || ["string","number","boolean"].includes(typeof sample.value));
    const detectedType=ports.propertyType(editable.document, canonical) ?? "string";
    return { operator:"All", predicates:[{ propertyPath:canonical, operator:comparable ? "Equals" : "Exists",
      ...(comparable ? { comparison:typedComparisonValue(sample.value as string|number|boolean|null) } : {}),
      ...(!sampleProperty || !comparable ? { detectedType } : {}) }] };
  }
  configuredRule():ReusableSchemaRule {
    const ports=this.#behavior, configuration=this.configuration;
    if (!ports) throw new Error("Schema rule behavior is not configured");
    if (configuration) { const details=configuredRuleDetails(configuration), generatedId=configuration.saveReusable
      ? ports.createRuleId() : ports.createRuleId().replace(/^rule:/,"local-rule:");
      return { id:this.editingAttached?.id ?? this.editingReusableId ?? generatedId,
        name:configuration.reusableName.trim() || `${configuration.ruleType} for ${this.pickerPath}`, kind:configuration.ruleType,
        version:this.stored(this.editingReusableId ?? "")?.version ?? 0, enabled:configuration.enabled, applicableType:configuration.propertyType,
        operator:details.operator, ...(details.parameters!==undefined ? { parameters:details.parameters } : {}),
        ...(details.allowedValues!==undefined ? { allowedValues:details.allowedValues } : {}), ...(details.comparison!==undefined ? { comparison:details.comparison } : {}),
        ...(details.limit!==undefined ? { limit:details.limit } : {}), severity:configuration.severity,
        ...(configuration.message.trim() ? { message:configuration.message.trim() } : {}),
        ...(configuration.applyOnlyWhen ? { conditionGroup:{ operator:configuration.conditionGroupOperator, predicates:structuredClone(configuration.conditions) } } : {}),
        ...(configuration.description.trim() ? { description:configuration.description.trim() } : {}) };
    }
    const elements=ports.elements, name=elements.name?.value.trim() || "Untitled rule", operator=elements.operator?.value || "required";
    return { id:this.editingReusableId ?? ports.createRuleId(), name, kind:operator, version:this.stored(this.editingReusableId ?? "")?.version ?? 0,
      enabled:true, applicableType:(elements.types?.value || "string") as SchemaPropertyType, operator,
      ...(elements.parameters?.value.trim() ? { parameters:elements.parameters.value.trim() } : {}),
      ...(elements.severity?.value ? { severity:elements.severity.value } : {}), ...(elements.message?.value.trim() ? { message:elements.message.value.trim() } : {}) };
  }
  typeForAttachment(schema:SchemaDefinition, propertyPath:string):SchemaPropertyType {
    const document=schema.workingDraft?.document ?? schema.document, type=this.#required().propertyType(document,this.normalizePickerPath(propertyPath));
    return type && ["string","number","array","object","boolean"].includes(type) ? type : "string";
  }
  attach(schemaId:string, ruleId:string, propertyPath?:string, suppliedRule?:ReusableSchemaRule):boolean {
    const ports=this.#required(), rule=suppliedRule ?? this.stored(ruleId), stored=ports.schemas().find(({ id }) => id===schemaId), draft=ports.draft(), schema=stored ?? (draft
      ?.id===schemaId ? draft : undefined);
    if (!rule || !schema || (propertyPath && !applicablePropertyTypesForRule(rule).includes(this.typeForAttachment(schema,propertyPath)))) return false;
    const canonical=propertyPath ? this.normalizePickerPath(propertyPath) : undefined, source=schema.workingDraft?.attachedRules ?? schema.attachedRules ?? [], attachedRules=
      [...source
      .filter((attached) => attached.id!==rule.id || this.normalizePickerPath(attached.propertyPath ?? "")!==canonical), { id:rule.id,name:rule.name,version:rule.version,
        ...(canonical ? { propertyPath:canonical } : {}), ...(rule.operator ? { operator:rule.operator } : {}), ...(rule.parameters ? { parameters:rule.parameters } : {}),
        ...(rule.severity ? { severity:rule.severity } : {}), ...(rule.allowedValues ? { allowedValues:structuredClone(rule.allowedValues) } : {}),
        ...(rule.comparison ? { comparison:rule.comparison } : {}), ...(rule.limit!==undefined ? { limit:rule.limit } : {}),
        ...(rule.applicableType ? { applicableType:rule.applicableType } : {}), ...(rule.message ? { message:rule.message } : {}),
        ...(rule.conditionGroup ? { conditionGroup:structuredClone(rule.conditionGroup) } : {}), enabled:rule.enabled }];
    const updated=updateSchemaWorkingDraft(schema,{ attachedRules },`Attach ${rule.name} to ${propertyPath ?? "schema"}`);
    if (!stored) { ports.replaceDraft(structuredClone(updated)); ports.renderDraft(); return true; }
    ports.replaceSchemas(ports.schemas().map((candidate) => candidate.id===schemaId ? updated : candidate)); ports.replaceDraft(ports.presentDraft(updated));
    ports.persistLibrary(); ports.persistRules(); ports.renderAll(); return true;
  }
  updateAttached(schemaId:string, ruleId:string, enabled:boolean):boolean {
    const ports=this.#required(); let changed=false;
    ports.replaceSchemas(ports.schemas().map((schema) => schema.id!==schemaId || !schema.attachedRules ? schema : { ...schema,
      attachedRules:schema.attachedRules.map((rule) => { if (rule.id!==ruleId) return rule; changed=true; return { ...rule,enabled }; }) }));
    if (changed) { ports.persistLibrary(); ports.persistRules(); ports.renderAll(); } return changed;
  }
  get pendingPromotion() { return this.#promotionWorkflow.pendingState(); }
  get promotionFocusReturn() { return this.#promotionWorkflow.focusReturnState(); }
  get promotionFocusedPosition() { return this.#promotionWorkflow.focusedPositionState(); }
  rememberPromotionFocusedPosition(value:{ propertyPath:string;ruleId:string;detailScroll:number }):void {
    this.#promotionWorkflow.rememberFocusedPosition(value);
  }
  get promotionGeneration() { return this.#promotionWorkflow.generationValue(); }
  restorePromotion(ruleId?:string,rerender=true):void { this.#promotionWorkflow.restore(ruleId,rerender); }
  openPromotion(propertyPath:string,sourceRuleId:string):boolean { return this.#promotionWorkflow.open(propertyPath,sourceRuleId); }
  render():void {
    this.#behavior?.presentation.render();
  }
  openNewEditor():void {
    const ports = this.#behavior; if (!ports) return;
    if (!this.#editingReusableId) this.#pendingSnapshot = undefined;
    ports.presentation.openEditor();
  }
  beginNew():void { this.#editingReusableId = undefined; this.#approvedRevisionId = undefined; this.#pendingSnapshot = undefined; this.openNewEditor(); }
  edit(id:string):boolean {
    const rule=this.stored(id);if(!rule||!this.#behavior)return false;
    this.#editingReusableId = id; this.openNewEditor();
    this.#behavior!.presentation.populate(rule);return true;
  }
  syncReview(rule:ReusableSchemaRule) { return this.#attachmentWorkflow.review(rule); }
  duplicate(id:string):void { const rule=this.stored(id),ports=this.#behavior;if(!rule||!ports)return;this.replaceRules([...this.rules,{...structuredClone(rule),id:ports.createId()
    ,name:`${rule.name} copy`,version:1,attachments:[]}]);ports.persistRules();this.render(); }
  toggle(id:string):void { const ports=this.#behavior;if(!ports)return;this.replaceRules(this.rules.map((rule) => rule.id===id ? {...rule,enabled:!rule.enabled}:rule));ports
    .persistRules();this.render(); }
  exportRule(id:string):void { const rule=this.stored(id),ports=this.#behavior;if(rule&&ports)ports.download(rule,`${rule.name.toLowerCase().replace(/[^a-z0-9]+/g,
    "-")}-v${rule.version}.json`); }
  save():void {
    const ports = this.#behavior; if (!ports) return; const elements = ports.elements, name = elements.name?.value.trim(); if (!name) return;
    const parameters = elements.parameters?.value.trim(), applicableType = elements.types?.value as SchemaPropertyType | undefined,
      operator = elements.operator?.value, severity = elements.severity?.value, message = elements.message?.value.trim(), examples = elements.examples?.value.trim(),
      attachments = Array.from(elements.attachments?.selectedOptions ?? []).map(({ value }) => value), previous = this.editingReusableId ? this.stored(this.editingReusableId) :
         undefined;
    if (previous && this.approvedRevisionId !== previous.id) {
      this.captureSnapshot(); this.requestRevision(previous.id, { name, kind:`${operator || "Required"}${parameters ? ` (${parameters})` : ""}`,
        ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
        ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments }); return;
    }
    const rule:ReusableSchemaRule = normalizeAllowedValuesRuleLibraryEntry({ id:previous?.id ?? ports.createId(), name,
      kind:`${operator || "Required"}${parameters ? ` (${parameters})` : ""}`, version:(previous?.version ?? 0) + 1, enabled:previous?.enabled ?? true,
      ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
      ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments });
    this.#pendingSnapshot = previous ? { id:previous.id, version:previous.version, attachments:[...(previous.attachments ?? [])] } : undefined;
    this.replaceRules([...this.rules.filter(({ id }) => id !== rule.id), rule]);
    if (elements.updateAttachments?.checked || rule.version === 1) ports.replaceSchemas(ports.schemas().map((schema) => {
      if (!attachments.includes(schema.id)) return schema;
      const attachedRules = [...(schema.attachedRules ?? []).filter(({ id }) => id !== rule.id),
        { id:rule.id, name:rule.name, version:rule.version, ...(operator ? { operator } : {}), ...(rule.parameters ? { parameters:rule.parameters } : {}),
          ...(rule.allowedValues ? { allowedValues:rule.allowedValues } : {}), ...(severity ? { severity } : {}), ...(message ? { message } : {}), enabled:true }];
      return { ...schema, attachedRules };
    }));
    this.#editingReusableId=undefined;ports.persistLibrary();ports.persistRules();ports.renderAll();this.render();ports.presentation.close("editor");
  }
  captureSnapshot():void { const previous = this.editingReusableId ? this.stored(this.editingReusableId) : undefined;
    if (previous) this.#pendingSnapshot = { id:previous.id, version:previous.version, attachments:[...(previous.attachments ?? [])] }; }
  updateAttachmentPreview():void { this.#behavior?.presentation.updateAttachmentPreview(); }
  requestRevision(id:string, changes:Partial<Omit<ReusableSchemaRule, "id"|"version"|"revisionHistory">>):boolean {
    const previous=this.stored(id);if(!previous||!this.#behavior)return false;
    this.#pendingRevision = { id, changes:structuredClone(changes) }; this.#approvedRevisionId = undefined;
    this.#behavior.presentation.showRevision(previous,changes);return true;
  }
  confirmRevision():void {
    const pending = this.#pendingRevision, ports = this.#behavior; if (!pending || !ports) return;
    this.replaceRules(this.rules.map((rule) => {
      if (rule.id !== pending.id) return rule;
      const revised:ReusableSchemaRule = { ...rule, ...structuredClone(pending.changes), version:rule.version + 1,
        revisionHistory:[...(rule.revisionHistory ?? []), { name:rule.name, kind:rule.kind, version:rule.version,
          ...(rule.enabled === false ? { enabled:false } : {}), ...(rule.applicableType ? { applicableType:rule.applicableType } : {}),
          ...(rule.operator ? { operator:rule.operator } : {}), ...(rule.parameters ? { parameters:rule.parameters } : {}),
          ...(rule.severity ? { severity:rule.severity } : {}), ...(rule.message ? { message:rule.message } : {}), ...(rule.examples ? { examples:rule.examples } : {}) }] };
      if (pending.changes.parameters !== undefined && (pending.changes.operator ?? rule.operator) === "allowed-values") delete revised.allowedValues;
      return normalizeAllowedValuesRuleLibraryEntry(revised);
    }));
    this.#approvedRevisionId = pending.id;if(this.#editingReusableId===pending.id){this.#editingReusableId=undefined;ports.presentation.close("editor");}
    this.#pendingRevision=undefined;ports.persistRules();this.render();ports.presentation.close("revision");
  }
  cancelRevision():void { this.#pendingRevision=undefined;this.#behavior?.presentation.close("revision"); }
  get pendingUpgrade() { return this.#attachmentWorkflow.pendingUpgradeState(); }
  get pendingSync() { return this.#attachmentWorkflow.pendingSyncState(); }
  get approvedAttachmentUpdateId() { return this.#attachmentWorkflow.approvedAttachmentUpdate(); }
  requestUpgrade(id:string,schemaIds:readonly string[]):boolean { return this.#attachmentWorkflow.requestUpgrade(id,schemaIds); }
  confirmUpgrade():void { this.#attachmentWorkflow.confirmUpgrade(); }
  cancelUpgrade():void { this.#attachmentWorkflow.cancelUpgrade(); }
  requestSync(id:string):boolean { return this.#attachmentWorkflow.requestSync(id); }
  confirmSync():void { this.#attachmentWorkflow.confirmSync(); }
  cancelSync():void { this.#attachmentWorkflow.cancelSync(); }
  requestDeletion(id:string):boolean {
    const rule = this.stored(id), ports = this.#behavior; if (!rule || !ports) return false;
    const attached = ports.schemas().filter((schema) => rule.attachments?.includes(schema.id) || schema.attachedRules?.some((item) => item.id === id) || JSON.stringify(
      schema.document).includes(id));
    if (attached.length) { if (ports.elements.result) ports.elements.result.textContent = `Cannot delete ${rule.name}: attached to ${attached.map(({ name }) => name).join(
      ", ")}.`; return false; }
    this.#pendingDeletionId=id;ports.presentation.showDeletion(rule);return true;
  }
  confirmDeletion():void { if (!this.#pendingDeletionId || !this.#behavior) return; this.replaceRules(this.rules.filter(({ id }) => id !== this.#pendingDeletionId));
    this.#pendingDeletionId=undefined;this.#behavior.persistRules();this.render();this.#behavior.presentation.close("delete"); }
  cancelDeletion():void { this.#pendingDeletionId=undefined;this.#behavior?.presentation.close("delete"); }
  exportRules():void {
    const blob = new Blob([`${JSON.stringify(this.rules, null, 2)}\n`], { type:"application/json" }), url = URL.createObjectURL(blob), link = this.#behavior?.elements.document
      ?.createElement("a");
    if (link) { link.href = url; link.download = "schema-rules.json"; link.click(); } URL.revokeObjectURL(url);
  }
  listenRow(target:EventTarget, type:string, listener:EventListener):void {
    target.addEventListener(type, listener);
    this.#rowDisposers.push(() => target.removeEventListener(type, listener));
  }
  listenPicker(target:EventTarget, type:string, listener:EventListener):void {
    target.addEventListener(type, listener);
    this.#pickerDisposers.push(() => target.removeEventListener(type, listener));
  }
  ownRow(dispose:()=>void):void { this.#rowDisposers.push(dispose); }
  ownPicker(...disposers:Array<() => void>):void { this.#pickerDisposers.push(...disposers); }
  clearRows():void { for (const dispose of this.#rowDisposers.splice(0)) dispose(); }
  clearPicker():void { for (const dispose of this.#pickerDisposers.splice(0)) dispose(); }
  dispose():void {
    this.resetPickerState();this.#pendingRevision=undefined;this.#pendingDeletionId=undefined;
    this.#editingReusableId=undefined;this.#approvedRevisionId=undefined;this.#pendingSnapshot=undefined;
    this.#attachmentWorkflow.dispose();this.#promotionWorkflow.dispose();
    this.clearRows(); this.clearPicker();
  }
  #required():SchemaRuleBehaviorPorts { if (!this.#behavior) throw new Error("Schema rule behavior is not configured"); return this.#behavior; }
}
