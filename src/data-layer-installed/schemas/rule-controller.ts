import { normalizeAllowedValuesRuleLibraryEntry } from "../../data-layer-allowed-values-rule.js";
import type { ReusableRuleSyncReview } from "../../data-layer-reusable-rule-sync.js";
import { publishReusableRuleSync, reviewReusableRuleSync } from "../../data-layer-reusable-rule-sync.js";
import { reusableRuleMetadata, type RuleConfiguration, type SchemaDefinition, type SchemaPropertyType } from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./index.js";

export const SCHEMA_RULE_STORAGE_KEY = "my-chrome-utilities.schema-rule-library.v1";

interface RuleElements {
  list:HTMLElement|null; search:HTMLInputElement|null; editor:HTMLElement|null; name:HTMLInputElement|null;
  parameters:HTMLInputElement|null; types:HTMLSelectElement|null; operator:HTMLSelectElement|null;
  severity:HTMLSelectElement|null; message:HTMLInputElement|null; examples:HTMLInputElement|null;
  attachments:HTMLSelectElement|null; updateAttachments:HTMLInputElement|null; result:HTMLElement|null;
  revisionReview:HTMLDialogElement|null; revisionSummary:HTMLElement|null; confirmRevision:HTMLButtonElement|null;
  upgradeReview:HTMLDialogElement|null; upgradeSummary:HTMLElement|null; confirmUpgrade:HTMLButtonElement|null; cancelUpgrade:HTMLButtonElement|null;
  syncReview:HTMLDialogElement|null; syncSummary:HTMLElement|null; confirmSync:HTMLButtonElement|null; cancelSync:HTMLButtonElement|null;
  deleteReview:HTMLDialogElement|null; deleteSummary:HTMLElement|null; confirmDelete:HTMLButtonElement|null;
  document:Document|undefined;
}

export interface SchemaRuleBehaviorPorts {
  elements:RuleElements;
  schemas():SchemaDefinition[];
  replaceSchemas(schemas:SchemaDefinition[]):void;
  persistRules():void;
  persistLibrary():void;
  renderAll():void;
  createId():string;
  download(value:unknown, filename:string):void;
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
  render():void {
    const ports = this.#behavior; if (!ports) return; const { list, search } = ports.elements;
    const summaryFor = (rule:ReusableSchemaRule):string => `${rule.name} v${rule.version} · ${reusableRuleMetadata(rule, rule.applicableType ?? "string")}`;
    const query = search?.value.trim().toLowerCase() ?? "", visible = this.rules.filter((rule) => summaryFor(rule).toLowerCase().includes(query));
    this.clearRows(); if (!list?.ownerDocument) { if (list) list.textContent = visible.map(summaryFor).join("\n"); return; }
    list.replaceChildren(...visible.map((rule) => {
      const item = list.ownerDocument!.createElement("li"), summary = list.ownerDocument!.createElement("span"); item.dataset.ruleId = rule.id;
      summary.textContent = summaryFor(rule); item.append(summary);
      const action = (label:string, run:()=>void):void => { const button = list.ownerDocument!.createElement("button"); button.type = "button"; button.textContent = label; this.listenRow(button, "click", run); item.append(button); };
      action("Edit", () => { this.edit(rule.id); });
      if (reviewReusableRuleSync(ports.schemas(), rule).schemaCount) action("Sync attached schemas and publish revisions", () => { this.requestSync(rule.id); });
      action("Duplicate", () => { this.rules = [...this.rules, { ...structuredClone(rule), id:ports.createId(), name:`${rule.name} copy`, version:1, attachments:[] }]; ports.persistRules(); this.render(); });
      action("Export", () => ports.download(rule, `${rule.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-v${rule.version}.json`));
      action(rule.enabled ? "Disable" : "Enable", () => { this.rules = this.rules.map((candidate) => candidate.id === rule.id ? { ...candidate, enabled:!candidate.enabled } : candidate); ports.persistRules(); this.render(); });
      action("Delete", () => { this.requestDeletion(rule.id); }); return item;
    }));
  }
  openNewEditor():void {
    const ports = this.#behavior; if (!ports) return; const elements = ports.elements;
    if (!this.editingReusableId) this.pendingSnapshot = undefined;
    if (elements.editor) elements.editor.hidden = false;
    if (elements.name) elements.name.value = ""; if (elements.parameters) elements.parameters.value = "";
    if (elements.message) elements.message.value = ""; if (elements.examples) elements.examples.value = "";
    if (elements.types) elements.types.value = "string"; if (elements.severity) elements.severity.value = "error";
    if (elements.attachments?.ownerDocument) elements.attachments.replaceChildren(...ports.schemas().map((schema) => {
      const option = elements.attachments!.ownerDocument.createElement("option"); option.value = schema.id; option.textContent = `${schema.name} v${schema.version}`; return option;
    })); elements.name?.focus();
  }
  beginNew():void { this.editingReusableId = undefined; this.approvedRevisionId = undefined; this.pendingSnapshot = undefined; this.openNewEditor(); }
  edit(id:string):boolean {
    const rule = this.stored(id), elements = this.#behavior?.elements; if (!rule || !elements) return false;
    this.editingReusableId = id; this.openNewEditor();
    if (elements.name) elements.name.value = rule.name; if (elements.parameters) elements.parameters.value = rule.parameters ?? "";
    if (elements.types) elements.types.value = rule.applicableType ?? "string"; if (elements.operator) elements.operator.value = rule.operator ?? "required";
    if (elements.severity) elements.severity.value = rule.severity ?? "error"; if (elements.message) elements.message.value = rule.message ?? "";
    if (elements.examples) elements.examples.value = rule.examples ?? ""; return true;
  }
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
    this.editingReusableId = undefined; ports.persistLibrary(); ports.persistRules(); ports.renderAll(); this.render(); if (elements.editor) elements.editor.hidden = true;
  }
  captureSnapshot():void { const previous = this.editingReusableId ? this.stored(this.editingReusableId) : undefined;
    if (previous) this.pendingSnapshot = { id:previous.id, version:previous.version, attachments:[...(previous.attachments ?? [])] }; }
  updateAttachmentPreview():void { const elements = this.#behavior?.elements; if (elements?.result) elements.result.textContent = elements.updateAttachments?.checked
    ? "Pinned attachments will be updated" : "Existing pinned attachments remain unchanged"; }
  requestRevision(id:string, changes:Partial<Omit<ReusableSchemaRule, "id"|"version"|"revisionHistory">>):boolean {
    const previous = this.stored(id), elements = this.#behavior?.elements; if (!previous || !elements) return false;
    this.pendingRevision = { id, changes:structuredClone(changes) }; this.approvedRevisionId = undefined;
    const previousParameters = previous.allowedValues?.map(String).join(",") ?? previous.parameters ?? "none";
    if (elements.revisionSummary) elements.revisionSummary.textContent = `${previous.name} v${previous.version} will become ${changes.name ?? previous.name} v${previous.version + 1}; parameters ${previousParameters} → ${changes.parameters ?? previous.parameters ?? "none"}; examples ${previous.examples ?? "none"} → ${changes.examples ?? previous.examples ?? "none"}.`;
    elements.revisionReview?.showModal(); elements.confirmRevision?.focus(); return true;
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
    this.approvedRevisionId = pending.id; if (this.editingReusableId === pending.id) { this.editingReusableId = undefined; if (ports.elements.editor) ports.elements.editor.hidden = true; }
    this.pendingRevision = undefined; ports.persistRules(); this.render(); ports.elements.revisionReview?.close();
  }
  cancelRevision():void { this.pendingRevision = undefined; this.#behavior?.elements.revisionReview?.close(); }
  requestUpgrade(id:string, schemaIds:readonly string[]):boolean {
    const rule = this.stored(id), ports = this.#behavior; if (!rule || !ports) return false;
    const affected = ports.schemas().filter((schema) => schemaIds.includes(schema.id) && schema.attachedRules?.some((item) => item.id === id));
    this.pendingUpgrade = { id, schemaIds:[...schemaIds] };
    if (ports.elements.upgradeSummary) ports.elements.upgradeSummary.textContent = affected.length
      ? `Update pinned attachments for ${rule.name} v${rule.version}: ${affected.map(({ name }) => name).join(", ")}.` : `No pinned attachments for ${rule.name} are selected.`;
    if (ports.elements.confirmUpgrade) ports.elements.confirmUpgrade.disabled = affected.length === 0;
    ports.elements.upgradeReview?.showModal(); (affected.length ? ports.elements.confirmUpgrade : ports.elements.cancelUpgrade)?.focus(); return true;
  }
  confirmUpgrade():void {
    const pending = this.pendingUpgrade, ports = this.#behavior; if (!pending || !ports) return; const rule = this.stored(pending.id); if (!rule) return;
    ports.replaceSchemas(ports.schemas().map((schema) => !pending.schemaIds.includes(schema.id) || !schema.attachedRules ? schema : { ...schema,
      attachedRules:schema.attachedRules.map((attached) => attached.id !== rule.id ? attached : { ...attached, name:rule.name, version:rule.version,
        ...(rule.operator ? { operator:rule.operator } : {}), ...(rule.parameters ? { parameters:rule.parameters } : {}),
        ...(rule.severity ? { severity:rule.severity } : {}), ...(rule.message ? { message:rule.message } : {}), enabled:rule.enabled }) }));
    this.approvedAttachmentUpdateId = pending.id; this.pendingUpgrade = undefined; ports.persistLibrary(); ports.elements.upgradeReview?.close();
  }
  cancelUpgrade():void { this.pendingUpgrade = undefined; this.#behavior?.elements.upgradeReview?.close(); }
  requestSync(id:string):boolean {
    const rule = this.stored(id), ports = this.#behavior; if (!rule || !ports) return false;
    const review = reviewReusableRuleSync(ports.schemas(), rule); this.pendingSync = { rule:structuredClone(rule), review };
    const changes = review.schemas.map((schema) => `${schema.schemaName} revision ${schema.currentVersion} to ${schema.nextVersion}`).join("; ");
    if (ports.elements.syncSummary) ports.elements.syncSummary.textContent = review.blocked.length
      ? `${review.schemaCount} schemas and ${review.attachmentCount} attachments. ${review.blocked.map(({ assistance }) => assistance).join(". ")}.`
      : `${review.schemaCount} schemas and ${review.attachmentCount} attachments: ${changes || "no pinned revisions"}. No changes occur before confirmation.`;
    if (ports.elements.confirmSync) ports.elements.confirmSync.disabled = !review.ready;
    ports.elements.syncReview?.showModal(); (review.ready ? ports.elements.confirmSync : ports.elements.cancelSync)?.focus(); return true;
  }
  confirmSync():void {
    const pending = this.pendingSync, ports = this.#behavior; if (!pending || !ports) return; const rule = this.stored(pending.rule.id);
    if (!rule) throw new Error("The reusable rule was removed after review"); const review = reviewReusableRuleSync(ports.schemas(), rule);
    if (JSON.stringify(review) !== JSON.stringify(pending.review)) throw new Error("The attached schemas changed after review");
    ports.replaceSchemas(publishReusableRuleSync(ports.schemas(), rule, review)); this.pendingSync = undefined; ports.persistLibrary(); ports.renderAll(); ports.elements.syncReview?.close();
  }
  cancelSync():void { this.pendingSync = undefined; this.#behavior?.elements.syncReview?.close(); }
  requestDeletion(id:string):boolean {
    const rule = this.stored(id), ports = this.#behavior; if (!rule || !ports) return false;
    const attached = ports.schemas().filter((schema) => rule.attachments?.includes(schema.id) || schema.attachedRules?.some((item) => item.id === id) || JSON.stringify(schema.document).includes(id));
    if (attached.length) { if (ports.elements.result) ports.elements.result.textContent = `Cannot delete ${rule.name}: attached to ${attached.map(({ name }) => name).join(", ")}.`; return false; }
    this.pendingDeletionId = id; if (ports.elements.deleteSummary) ports.elements.deleteSummary.textContent = `${rule.name} v${rule.version} will be removed.`;
    ports.elements.deleteReview?.showModal(); ports.elements.confirmDelete?.focus(); return true;
  }
  confirmDeletion():void { if (!this.pendingDeletionId || !this.#behavior) return; this.rules = this.rules.filter(({ id }) => id !== this.pendingDeletionId);
    this.pendingDeletionId = undefined; this.#behavior.persistRules(); this.render(); this.#behavior.elements.deleteReview?.close(); }
  cancelDeletion():void { this.pendingDeletionId = undefined; this.#behavior?.elements.deleteReview?.close(); }
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
}
