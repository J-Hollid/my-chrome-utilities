import { normalizeAllowedValuesRuleLibraryEntry } from "../../data-layer-allowed-values-rule.js";
import type { ReusableRuleSyncReview } from "../../data-layer-reusable-rule-sync.js";
import { publishReusableRuleSync, reviewReusableRuleSync } from "../../data-layer-reusable-rule-sync.js";
import { promoteLocalRule, reviewLocalRulePromotion, type LocalRulePromotionSelection } from "../../data-layer-local-rule-promotion.js";
import type { LocalRulePromotionDialogController } from "../../data-layer-local-rule-promotion-ui.js";
import { storedPromotionRules } from "./schema-model.js";
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
import type { RuleElements, SchemaRuleInstalledPresentation } from "./rule-installed-view.js";
export type { RuleElements } from "./rule-installed-view.js";

export const SCHEMA_RULE_STORAGE_KEY = "my-chrome-utilities.schema-rule-library.v1";

export interface SchemaRuleBehaviorPorts {
  elements:RuleElements;
  presentation:SchemaRuleInstalledPresentation;
  schemas():SchemaDefinition[];
  replaceSchemas(schemas:SchemaDefinition[]):void;
  persistRules():void;
  persistLibrary():void;
  renderAll():void;
  renderDraft():void;
  createId():string;
  download(value:unknown, filename:string):void;
  createRuleId():string;
  capturedValue(target:AssignmentConditionTarget):unknown;
  editableSchema():SchemaDefinition;
  propertyType(document:SchemaDefinition["document"], path:string):SchemaPropertyType|undefined;
  draft():SchemaDefinition|undefined;
  replaceDraft(schema:SchemaDefinition):void;
  presentDraft(schema:SchemaDefinition):SchemaDefinition;
  activeSchemaId():string|undefined;
  promotionDialog:LocalRulePromotionDialogController;
  detail:HTMLElement|null;
  root:ParentNode;
  scheduleFrame(callback:()=>void):void;
  result(message:string):void;
  commitPromotion(schemaId:string, previousSchemas:readonly SchemaDefinition[], previousRules:readonly ReusableSchemaRule[], nextSchemas:readonly SchemaDefinition[], nextRules:readonly ReusableSchemaRule[]):Promise<void>;
  settleCanonical?(schemaId:string):Promise<void>;
}

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
  rules:ReusableSchemaRule[];
  pickerPath:string | undefined;
  pickerTrigger:HTMLButtonElement | undefined;
  pickerSearch = "";
  configuration:RuleConfiguration | undefined;
  editingAttached:NonNullable<SchemaDefinition["attachedRules"]>[number] | undefined;
  editingReusableId:string | undefined;
  approvedRevisionId:string | undefined;
  approvedAttachmentUpdateId:string | undefined;
  pendingSnapshot:{ id:string; version:number; attachments:readonly string[] } | undefined;
  pendingRevision:{ id:string; changes:Partial<Omit<ReusableSchemaRule, "id" | "version" | "revisionHistory">> } | undefined;
  pendingUpgrade:{ id:string; schemaIds:readonly string[] } | undefined;
  pendingSync:{ rule:ReusableSchemaRule; review:ReusableRuleSyncReview } | undefined;
  pendingDeletionId:string | undefined;
  pendingPromotion:{ propertyPath:string; sourceRuleId:string; generation:number; detailScroll:number } | undefined;
  promotionFocusReturn:{ propertyPath:string; ruleId:string; detailScroll:number } | undefined;
  promotionFocusedPosition:{ propertyPath:string; ruleId:string; detailScroll:number } | undefined;
  promotionGeneration=0;
  readonly #rowDisposers:Array<() => void> = [];
  readonly #pickerDisposers:Array<() => void> = [];

  constructor(storage:Pick<Storage, "getItem" | "setItem">, behavior?:SchemaRuleBehaviorPorts) {
    this.#storage = storage;
    this.#behavior = behavior;
    const serialized = storage.getItem(SCHEMA_RULE_STORAGE_KEY);
    try {
      const stored = JSON.parse(serialized ?? "[]") as unknown;
      this.rules = Array.isArray(stored) ? stored.map(normalizeRule).filter((rule):rule is ReusableSchemaRule => Boolean(rule)) : [];
    } catch {
      this.rules = [];
    }
    if (serialized !== null && JSON.stringify(this.rules) !== serialized) this.persist();
  }
  configure(behavior:SchemaRuleBehaviorPorts):void { this.#behavior = behavior; }

  reload():void {
    const serialized = this.#storage.getItem(SCHEMA_RULE_STORAGE_KEY);
    try {
      const stored = JSON.parse(serialized ?? "[]") as unknown;
      this.rules = Array.isArray(stored) ? stored.map(normalizeRule).filter((rule):rule is ReusableSchemaRule => Boolean(rule)) : [];
    } catch {
      this.rules = [];
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
    const editable=ports.editableSchema(), consequence=this.normalizePickerPath(propertyPath), paths=schemaPropertyRows(editable.document).map(({ canonicalPath }) => canonicalPath);
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
    const ports=this.#required(), rule=suppliedRule ?? this.stored(ruleId), stored=ports.schemas().find(({ id }) => id===schemaId), draft=ports.draft(), schema=stored ?? (draft?.id===schemaId ? draft : undefined);
    if (!rule || !schema || (propertyPath && !applicablePropertyTypesForRule(rule).includes(this.typeForAttachment(schema,propertyPath)))) return false;
    const canonical=propertyPath ? this.normalizePickerPath(propertyPath) : undefined, source=schema.workingDraft?.attachedRules ?? schema.attachedRules ?? [], attachedRules=[...source
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
  restorePromotion(ruleId?:string,rerender=true):void {
    const ports=this.#required(); if (this.pendingPromotion) this.promotionFocusReturn={ propertyPath:this.pendingPromotion.propertyPath,ruleId:ruleId ?? this.pendingPromotion.sourceRuleId,detailScroll:this.pendingPromotion.detailScroll };
    this.pendingPromotion=undefined; if (rerender) { ports.renderAll(); this.render(); }
    const focus=this.promotionFocusReturn ? { ...this.promotionFocusReturn } : undefined; if (!focus) return;
    const restore=():void => { if (ports.detail && ports.detail.scrollTop!==focus.detailScroll) ports.detail.scrollTop=focus.detailScroll; };
    ports.detail?.addEventListener("scroll",restore); restore(); ports.scheduleFrame(() => { restore(); ports.scheduleFrame(() => {
      Array.from(ports.root.querySelectorAll<HTMLElement>("button[data-rule-id]")).find(({ dataset }) => dataset.ruleId===focus.ruleId && dataset.propertyPath===focus.propertyPath)?.focus({ preventScroll:true });
      restore(); ports.detail?.removeEventListener("scroll",restore); }); });
  }
  openPromotion(propertyPath:string,sourceRuleId:string):boolean {
    const ports=this.#required(), stored=ports.activeSchemaId() ? ports.schemas().find(({ id }) => id===ports.activeSchemaId()) : undefined, schema=stored ?? ports.draft(); if (!schema) return false;
    const editorContext=stored ? "editable" as const : "new-schema" as const, generation=++this.promotionGeneration, reusableRules=structuredClone(this.rules) as readonly PromotableReusableRule[];
    let review:ReturnType<typeof reviewLocalRulePromotion>; try { review=reviewLocalRulePromotion({ schema,reusableRules,propertyPath,sourceRuleId,editorContext }); }
    catch (error) { ports.result(error instanceof Error ? error.message : "Promotion is no longer available."); return false; }
    const focused=this.promotionFocusedPosition?.propertyPath===propertyPath && this.promotionFocusedPosition.ruleId===sourceRuleId ? this.promotionFocusedPosition : undefined;
    this.pendingPromotion={ propertyPath,sourceRuleId,generation,detailScroll:focused?.detailScroll ?? ports.detail?.scrollTop ?? 0 }; this.promotionFocusReturn=undefined;
    ports.promotionDialog.open({ review,cancel:() => { if (this.pendingPromotion?.generation===generation) this.restorePromotion(undefined,false); },
      confirm:(selected:LocalRulePromotionSelection) => { if (this.pendingPromotion?.generation!==generation) throw new Error("The promotion review is stale");
        const previousSchemas=structuredClone(ports.schemas()),previousRules=structuredClone(this.rules),result=selected.action==="create"
          ? promoteLocalRule({ schema,reusableRules,propertyPath,sourceRuleId,editorContext,...selected })
          : promoteLocalRule({ schema,reusableRules,propertyPath,sourceRuleId,editorContext,action:"use-existing",reusableRuleId:selected.reusableRuleId }),
          nextSchemas=stored ? ports.schemas().map((candidate) => candidate.id===result.schema.id ? result.schema : candidate) : ports.schemas(), nextRules=storedPromotionRules(result.reusableRules);
        if (!stored) { this.rules=structuredClone(nextRules); ports.replaceDraft(structuredClone(result.schema)); this.persist(); ports.renderDraft(); this.render(); this.restorePromotion(); return; }
        return ports.commitPromotion(result.schema.id,previousSchemas,previousRules,nextSchemas,nextRules).then(async() => { await ports.settleCanonical?.(result.schema.id);
          const focus=() => Array.from(ports.root.querySelectorAll<HTMLElement>("button[data-rule-id]")).find(({ dataset }) => dataset.ruleId===result.replacementRuleId && dataset.propertyPath===propertyPath)?.focus({ preventScroll:true });
          ports.scheduleFrame(() => ports.scheduleFrame(focus)); return () => { if (this.pendingPromotion?.generation===generation) { ports.result(`Promoted ${sourceRuleId} to reusable rule ${result.replacementRuleId}.`); this.restorePromotion(result.replacementRuleId); } ports.scheduleFrame(() => ports.scheduleFrame(focus)); }; }); }, });
    return true;
  }
  render():void {
    this.#behavior?.presentation.render();
  }
  openNewEditor():void {
    const ports = this.#behavior; if (!ports) return;
    if (!this.editingReusableId) this.pendingSnapshot = undefined;
    ports.presentation.openEditor();
  }
  beginNew():void { this.editingReusableId = undefined; this.approvedRevisionId = undefined; this.pendingSnapshot = undefined; this.openNewEditor(); }
  edit(id:string):boolean {
    const rule=this.stored(id);if(!rule||!this.#behavior)return false;
    this.editingReusableId = id; this.openNewEditor();
    this.#behavior!.presentation.populate(rule);return true;
  }
  syncReview(rule:ReusableSchemaRule):ReusableRuleSyncReview { return reviewReusableRuleSync(this.#required().schemas(),rule); }
  duplicate(id:string):void { const rule=this.stored(id),ports=this.#behavior;if(!rule||!ports)return;this.rules=[...this.rules,{...structuredClone(rule),id:ports.createId(),name:`${rule.name} copy`,version:1,attachments:[]}];ports.persistRules();this.render(); }
  toggle(id:string):void { const ports=this.#behavior;if(!ports)return;this.rules=this.rules.map((rule) => rule.id===id ? {...rule,enabled:!rule.enabled}:rule);ports.persistRules();this.render(); }
  exportRule(id:string):void { const rule=this.stored(id),ports=this.#behavior;if(rule&&ports)ports.download(rule,`${rule.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-v${rule.version}.json`); }
  save():void {
    const ports = this.#behavior; if (!ports) return; const elements = ports.elements, name = elements.name?.value.trim(); if (!name) return;
    const parameters = elements.parameters?.value.trim(), applicableType = elements.types?.value as SchemaPropertyType | undefined,
      operator = elements.operator?.value, severity = elements.severity?.value, message = elements.message?.value.trim(), examples = elements.examples?.value.trim(),
      attachments = Array.from(elements.attachments?.selectedOptions ?? []).map(({ value }) => value), previous = this.editingReusableId ? this.stored(this.editingReusableId) : undefined;
    if (previous && this.approvedRevisionId !== previous.id) {
      this.captureSnapshot(); this.requestRevision(previous.id, { name, kind:`${operator || "Required"}${parameters ? ` (${parameters})` : ""}`,
        ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
        ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments }); return;
    }
    const rule:ReusableSchemaRule = normalizeAllowedValuesRuleLibraryEntry({ id:previous?.id ?? ports.createId(), name,
      kind:`${operator || "Required"}${parameters ? ` (${parameters})` : ""}`, version:(previous?.version ?? 0) + 1, enabled:previous?.enabled ?? true,
      ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
      ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments });
    this.pendingSnapshot = previous ? { id:previous.id, version:previous.version, attachments:[...(previous.attachments ?? [])] } : undefined;
    this.rules = [...this.rules.filter(({ id }) => id !== rule.id), rule];
    if (elements.updateAttachments?.checked || rule.version === 1) ports.replaceSchemas(ports.schemas().map((schema) => {
      if (!attachments.includes(schema.id)) return schema;
      const attachedRules = [...(schema.attachedRules ?? []).filter(({ id }) => id !== rule.id),
        { id:rule.id, name:rule.name, version:rule.version, ...(operator ? { operator } : {}), ...(rule.parameters ? { parameters:rule.parameters } : {}),
          ...(rule.allowedValues ? { allowedValues:rule.allowedValues } : {}), ...(severity ? { severity } : {}), ...(message ? { message } : {}), enabled:true }];
      return { ...schema, attachedRules };
    }));
    this.editingReusableId=undefined;ports.persistLibrary();ports.persistRules();ports.renderAll();this.render();ports.presentation.close("editor");
  }
  captureSnapshot():void { const previous = this.editingReusableId ? this.stored(this.editingReusableId) : undefined;
    if (previous) this.pendingSnapshot = { id:previous.id, version:previous.version, attachments:[...(previous.attachments ?? [])] }; }
  updateAttachmentPreview():void { this.#behavior?.presentation.updateAttachmentPreview(); }
  requestRevision(id:string, changes:Partial<Omit<ReusableSchemaRule, "id"|"version"|"revisionHistory">>):boolean {
    const previous=this.stored(id);if(!previous||!this.#behavior)return false;
    this.pendingRevision = { id, changes:structuredClone(changes) }; this.approvedRevisionId = undefined;
    this.#behavior.presentation.showRevision(previous,changes);return true;
  }
  confirmRevision():void {
    const pending = this.pendingRevision, ports = this.#behavior; if (!pending || !ports) return;
    this.rules = this.rules.map((rule) => {
      if (rule.id !== pending.id) return rule;
      const revised:ReusableSchemaRule = { ...rule, ...structuredClone(pending.changes), version:rule.version + 1,
        revisionHistory:[...(rule.revisionHistory ?? []), { name:rule.name, kind:rule.kind, version:rule.version,
          ...(rule.enabled === false ? { enabled:false } : {}), ...(rule.applicableType ? { applicableType:rule.applicableType } : {}),
          ...(rule.operator ? { operator:rule.operator } : {}), ...(rule.parameters ? { parameters:rule.parameters } : {}),
          ...(rule.severity ? { severity:rule.severity } : {}), ...(rule.message ? { message:rule.message } : {}), ...(rule.examples ? { examples:rule.examples } : {}) }] };
      if (pending.changes.parameters !== undefined && (pending.changes.operator ?? rule.operator) === "allowed-values") delete revised.allowedValues;
      return normalizeAllowedValuesRuleLibraryEntry(revised);
    });
    this.approvedRevisionId = pending.id;if(this.editingReusableId===pending.id){this.editingReusableId=undefined;ports.presentation.close("editor");}
    this.pendingRevision=undefined;ports.persistRules();this.render();ports.presentation.close("revision");
  }
  cancelRevision():void { this.pendingRevision=undefined;this.#behavior?.presentation.close("revision"); }
  requestUpgrade(id:string, schemaIds:readonly string[]):boolean {
    const rule = this.stored(id), ports = this.#behavior; if (!rule || !ports) return false;
    const affected = ports.schemas().filter((schema) => schemaIds.includes(schema.id) && schema.attachedRules?.some((item) => item.id === id));
    this.pendingUpgrade = { id, schemaIds:[...schemaIds] };
    ports.presentation.showUpgrade(rule,affected);return true;
  }
  confirmUpgrade():void {
    const pending = this.pendingUpgrade, ports = this.#behavior; if (!pending || !ports) return; const rule = this.stored(pending.id); if (!rule) return;
    ports.replaceSchemas(ports.schemas().map((schema) => !pending.schemaIds.includes(schema.id) || !schema.attachedRules ? schema : { ...schema,
      attachedRules:schema.attachedRules.map((attached) => attached.id !== rule.id ? attached : { ...attached, name:rule.name, version:rule.version,
        ...(rule.operator ? { operator:rule.operator } : {}), ...(rule.parameters ? { parameters:rule.parameters } : {}),
        ...(rule.severity ? { severity:rule.severity } : {}), ...(rule.message ? { message:rule.message } : {}), enabled:rule.enabled }) }));
    this.approvedAttachmentUpdateId=pending.id;this.pendingUpgrade=undefined;ports.persistLibrary();ports.presentation.close("upgrade");
  }
  cancelUpgrade():void { this.pendingUpgrade=undefined;this.#behavior?.presentation.close("upgrade"); }
  requestSync(id:string):boolean {
    const rule = this.stored(id), ports = this.#behavior; if (!rule || !ports) return false;
    const review = reviewReusableRuleSync(ports.schemas(), rule); this.pendingSync = { rule:structuredClone(rule), review };
    ports.presentation.showSync(review);return true;
  }
  confirmSync():void {
    const pending = this.pendingSync, ports = this.#behavior; if (!pending || !ports) return; const rule = this.stored(pending.rule.id);
    if (!rule) throw new Error("The reusable rule was removed after review"); const review = reviewReusableRuleSync(ports.schemas(), rule);
    if (JSON.stringify(review) !== JSON.stringify(pending.review)) throw new Error("The attached schemas changed after review");
    ports.replaceSchemas(publishReusableRuleSync(ports.schemas(),rule,review));this.pendingSync=undefined;ports.persistLibrary();ports.renderAll();ports.presentation.close("sync");
  }
  cancelSync():void { this.pendingSync=undefined;this.#behavior?.presentation.close("sync"); }
  requestDeletion(id:string):boolean {
    const rule = this.stored(id), ports = this.#behavior; if (!rule || !ports) return false;
    const attached = ports.schemas().filter((schema) => rule.attachments?.includes(schema.id) || schema.attachedRules?.some((item) => item.id === id) || JSON.stringify(schema.document).includes(id));
    if (attached.length) { if (ports.elements.result) ports.elements.result.textContent = `Cannot delete ${rule.name}: attached to ${attached.map(({ name }) => name).join(", ")}.`; return false; }
    this.pendingDeletionId=id;ports.presentation.showDeletion(rule);return true;
  }
  confirmDeletion():void { if (!this.pendingDeletionId || !this.#behavior) return; this.rules = this.rules.filter(({ id }) => id !== this.pendingDeletionId);
    this.pendingDeletionId=undefined;this.#behavior.persistRules();this.render();this.#behavior.presentation.close("delete"); }
  cancelDeletion():void { this.pendingDeletionId=undefined;this.#behavior?.presentation.close("delete"); }
  exportRules():void {
    const blob = new Blob([`${JSON.stringify(this.rules, null, 2)}\n`], { type:"application/json" }), url = URL.createObjectURL(blob), link = this.#behavior?.elements.document?.createElement("a");
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
    this.pickerPath = undefined; this.pickerTrigger = undefined; this.configuration = undefined; this.editingAttached = undefined;
    this.pendingRevision = undefined; this.pendingUpgrade = undefined; this.pendingSync = undefined; this.pendingDeletionId = undefined;
    this.editingReusableId = undefined; this.approvedRevisionId = undefined; this.approvedAttachmentUpdateId = undefined; this.pendingSnapshot = undefined;
    this.pendingPromotion = undefined; this.promotionFocusReturn = undefined; this.promotionFocusedPosition = undefined;
    this.clearRows(); this.clearPicker();
  }
  #required():SchemaRuleBehaviorPorts { if (!this.#behavior) throw new Error("Schema rule behavior is not configured"); return this.#behavior; }
}
