import type {
  AttachedSchemaRule,
  SchemaDefinition,
  SchemaWorkingDraft,
} from "./data-layer-schema-verification.js";

export interface PromotableReusableRule extends AttachedSchemaRule {
  name: string;
  kind: string;
  description?: string;
  examples?: string;
  attachments?: readonly string[];
  revisionHistory?: readonly Partial<PromotableReusableRule>[];
}

export interface LocalRulePromotionInput {
  schema: SchemaDefinition;
  reusableRules: readonly PromotableReusableRule[];
  propertyPath: string;
  sourceRuleId: string;
}

export interface LocalRulePromotionReview {
  source: {
    schema: Pick<SchemaDefinition, "id" | "name" | "version">;
    propertyPath: string;
    rule: AttachedSchemaRule;
  };
  equivalentRules: PromotableReusableRule[];
  reusableRules: PromotableReusableRule[];
}

export type LocalRulePromotionSelection =
  | { action: "create"; name: string; description?: string; examples?: string }
  | { action: "use-existing"; reusableRuleId: string };

export interface LocalRulePromotionValidation {
  ready: boolean;
  assistance: string;
  duplicateDefinitionWarning?: boolean;
}

export interface LocalRulePromotionResult {
  schema: SchemaDefinition;
  reusableRules: PromotableReusableRule[];
  changed: boolean;
  replacementRuleId: string;
}

export interface LocalRulePromotionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): unknown;
  removeItem(key: string): unknown;
}

export interface LocalRulePromotionPersistence {
  schemaKey: string;
  schemaValue: string;
  ruleKey: string;
  ruleValue: string;
}

function clone<T>(value: T): T { return structuredClone(value); }

function normalizePath(path: string): string {
  const segments = path.trim().split("/").filter(Boolean);
  return `/${segments.join("/")}`;
}

function normalizedName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function normalizedOperator(operator: string | undefined): string {
  return operator?.trim().replaceAll("_", "-").replaceAll(" ", "-").toLocaleLowerCase() ?? "";
}

function configuredRule(rule: AttachedSchemaRule): AttachedSchemaRule {
  return {
    id:rule.id,
    ...(rule.name !== undefined ? { name:rule.name } : {}),
    version:rule.version,
    ...(rule.operator !== undefined ? { operator:rule.operator } : {}),
    ...(rule.parameters !== undefined ? { parameters:rule.parameters } : {}),
    ...(rule.allowedValues !== undefined ? { allowedValues:clone(rule.allowedValues) } : {}),
    ...(rule.applicableType !== undefined ? { applicableType:rule.applicableType } : {}),
    ...(rule.severity !== undefined ? { severity:rule.severity } : {}),
    ...(rule.message !== undefined ? { message:rule.message } : {}),
    ...(rule.conditionGroup !== undefined ? { conditionGroup:clone(rule.conditionGroup) } : {}),
    ...(rule.enabled !== undefined ? { enabled:rule.enabled } : {}),
  };
}

function semanticConfiguration(rule: AttachedSchemaRule): unknown {
  return {
    operator:normalizedOperator(rule.operator),
    parameters:rule.parameters ?? null,
    allowedValues:rule.allowedValues === undefined ? null : clone(rule.allowedValues),
    applicableType:rule.applicableType?.toLocaleLowerCase() ?? null,
    severity:rule.severity ?? null,
    message:rule.message ?? null,
    conditionGroup:rule.conditionGroup === undefined ? null : clone(rule.conditionGroup),
    enabled:rule.enabled !== false,
  };
}

function semanticallyEquivalent(left: AttachedSchemaRule, right: AttachedSchemaRule): boolean {
  return JSON.stringify(semanticConfiguration(left)) === JSON.stringify(semanticConfiguration(right));
}

function sourceRule(input: LocalRulePromotionInput): AttachedSchemaRule | undefined {
  const path = normalizePath(input.propertyPath);
  return input.schema.workingDraft?.attachedRules?.find((rule) =>
    rule.id === input.sourceRuleId && normalizePath(rule.propertyPath ?? "") === path
  );
}

export function localRulePromotionAvailability(
  input: LocalRulePromotionInput,
): { available: boolean; reason?: string } {
  if (!input.schema.workingDraft) return { available:false, reason:"Only working-draft rules can be promoted" };
  const source = sourceRule(input);
  if (!source) return { available:false, reason:"The local rule is no longer attached at this property path" };
  if (input.reusableRules.some(({ id }) => id === source.id)) return { available:false, reason:"The attachment already refers to a reusable rule" };
  return { available:true };
}

export function reviewLocalRulePromotion(input: LocalRulePromotionInput): LocalRulePromotionReview {
  const availability = localRulePromotionAvailability(input);
  if (!availability.available) throw new Error(availability.reason);
  const rule = sourceRule(input) as AttachedSchemaRule;
  return {
    source:{
      schema:{ id:input.schema.id, name:input.schema.name, version:input.schema.version },
      propertyPath:normalizePath(input.propertyPath),
      rule:configuredRule(rule),
    },
    equivalentRules:input.reusableRules.filter((candidate) => semanticallyEquivalent(rule, candidate)).map(clone),
    reusableRules:input.reusableRules.map(clone),
  };
}

export function validateLocalRulePromotion(
  review: LocalRulePromotionReview,
  selection: LocalRulePromotionSelection,
): LocalRulePromotionValidation {
  if (selection.action === "use-existing") {
    const candidate = review.equivalentRules.find(({ id }) => id === selection.reusableRuleId);
    return candidate
      ? { ready:true, assistance:`Use equivalent reusable rule revision ${candidate.version}`, duplicateDefinitionWarning:false }
      : { ready:false, assistance:"Select a semantically equivalent reusable rule" };
  }
  const name = selection.name.trim();
  if (!name) return { ready:false, assistance:"Enter a reusable rule name" };
  const sameName = review.reusableRules.find((candidate) => normalizedName(candidate.name) === normalizedName(name));
  if (sameName && !semanticallyEquivalent(review.source.rule, sameName)) {
    return { ready:false, assistance:"Open or use the existing differently defined rule" };
  }
  return {
    ready:true,
    assistance:"Review and confirm promotion",
    duplicateDefinitionWarning:review.equivalentRules.length > 0,
  };
}

function kindForOperator(operator: string | undefined): string {
  const normalized = normalizedOperator(operator);
  const labels: Record<string, string> = {
    "allowed-values":"Allowed values",
    "numeric-range":"Numeric range",
    "regular-expression":"Regular expression",
    required:"Required",
  };
  return labels[normalized] ?? (normalized ? normalized.split("-").map((word, index) => index ? word : `${word[0]?.toLocaleUpperCase() ?? ""}${word.slice(1)}`).join(" ") : "Validation");
}

function reusableConfiguration(rule: AttachedSchemaRule): Omit<AttachedSchemaRule, "id" | "name" | "version" | "propertyPath"> {
  return {
    ...(rule.operator !== undefined ? { operator:rule.operator } : {}),
    ...(rule.parameters !== undefined ? { parameters:rule.parameters } : {}),
    ...(rule.allowedValues !== undefined ? { allowedValues:clone(rule.allowedValues) } : {}),
    ...(rule.applicableType !== undefined ? { applicableType:rule.applicableType } : {}),
    ...(rule.severity !== undefined ? { severity:rule.severity } : {}),
    ...(rule.message !== undefined ? { message:rule.message } : {}),
    ...(rule.conditionGroup !== undefined ? { conditionGroup:clone(rule.conditionGroup) } : {}),
    ...(rule.enabled !== undefined ? { enabled:rule.enabled } : {}),
  };
}

export function promoteLocalRule(
  input: LocalRulePromotionInput & LocalRulePromotionSelection & { createId?: () => string },
): LocalRulePromotionResult {
  const review = reviewLocalRulePromotion(input);
  const validation = validateLocalRulePromotion(review, input);
  if (!validation.ready) throw new Error(validation.assistance);
  const source = review.source.rule;
  const reusableRules = input.reusableRules.map(clone);
  let destination: PromotableReusableRule;
  if (input.action === "use-existing") {
    destination = clone(review.equivalentRules.find(({ id }) => id === input.reusableRuleId) as PromotableReusableRule);
  } else {
    const id = input.createId?.() ?? `reusable-${crypto.randomUUID()}`;
    destination = {
      id,
      name:input.name.trim(),
      kind:kindForOperator(source.operator),
      version:1,
      ...reusableConfiguration(source),
      ...(input.description?.trim() ? { description:input.description.trim() } : {}),
      ...(input.examples?.trim() ? { examples:input.examples.trim() } : {}),
      attachments:[input.schema.id],
      revisionHistory:[],
    };
    reusableRules.push(destination);
  }
  const workingDraft = clone(input.schema.workingDraft) as SchemaWorkingDraft;
  let replaced = false;
  const attachedRules = (workingDraft.attachedRules ?? []).map((candidate) => {
    if (candidate.id !== input.sourceRuleId || normalizePath(candidate.propertyPath ?? "") !== review.source.propertyPath) return clone(candidate);
    replaced = true;
    return { ...clone(candidate), id:destination.id, name:destination.name, version:destination.version };
  });
  if (!replaced) throw new Error("The local rule is no longer attached at this property path.");
  const pendingChange = `Promote local rule ${source.id} to reusable rule ${destination.id}`;
  return {
    schema:{
      ...clone(input.schema),
      workingDraft:{ ...workingDraft, attachedRules, pendingChanges:[...workingDraft.pendingChanges, pendingChange] },
    },
    reusableRules,
    changed:true,
    replacementRuleId:destination.id,
  };
}

function restoreStoredValue(storage: LocalRulePromotionStorage, key: string, value: string | null): void {
  if (value === null) storage.removeItem(key);
  else storage.setItem(key, value);
}

export function persistLocalRulePromotion(
  storage: LocalRulePromotionStorage,
  values: LocalRulePromotionPersistence,
): void {
  const previousSchema = storage.getItem(values.schemaKey);
  const previousRules = storage.getItem(values.ruleKey);
  try {
    storage.setItem(values.ruleKey, values.ruleValue);
    storage.setItem(values.schemaKey, values.schemaValue);
  } catch (error) {
    try { restoreStoredValue(storage, values.ruleKey, previousRules); } catch { /* Preserve the original persistence error. */ }
    try { restoreStoredValue(storage, values.schemaKey, previousSchema); } catch { /* Preserve the original persistence error. */ }
    throw error;
  }
}
