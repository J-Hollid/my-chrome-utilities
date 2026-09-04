import { normalizeAllowedValuesRuleLibraryEntry } from "../../data-layer-allowed-values-rule.js";
import type { ReusableRuleSyncReview } from "../../data-layer-reusable-rule-sync.js";
import type { RuleConfiguration, SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./index.js";

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

  constructor(storage:Pick<Storage, "getItem" | "setItem">) {
    this.#storage = storage;
    const serialized = storage.getItem(SCHEMA_RULE_STORAGE_KEY);
    try {
      const stored = JSON.parse(serialized ?? "[]") as unknown;
      this.rules = Array.isArray(stored) ? stored.map(normalizeRule).filter((rule):rule is ReusableSchemaRule => Boolean(rule)) : [];
    } catch {
      this.rules = [];
    }
    if (serialized !== null && JSON.stringify(this.rules) !== serialized) this.persist();
  }

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
