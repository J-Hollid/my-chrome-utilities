import {
  createSchemaWorkingDraft,
  updateSchemaWorkingDraft,
  type AttachedSchemaRule,
  type SchemaDefinition,
} from "./data-layer-schema-verification.js";
import type { ValidationEvaluation } from "./data-layer-validation-model.js";

export type AllowedValue = string | number | boolean | null;
export type AllowedValueExpansionOrigin = "local" | "inherited" | "reusable";
export type AllowedValueExpansionDestination =
  | "assigned-schema-draft"
  | "parent-schema-draft"
  | "assigned-schema-override"
  | "reusable-rule-revision";

export interface ReusableAllowedValueRule extends AttachedSchemaRule {
  kind: string;
  attachments?: readonly string[];
  revisionHistory?: readonly Partial<ReusableAllowedValueRule>[];
}

export interface AllowedValueExpansionInput {
  schemas: readonly SchemaDefinition[];
  reusableRules: readonly ReusableAllowedValueRule[];
  assignedSchemaId: string;
  evidence: ValidationEvaluation;
}

export interface AllowedValueExpansionReview {
  assignedSchema: Pick<SchemaDefinition, "id" | "name" | "version">;
  origin: AllowedValueExpansionOrigin;
  destinations: readonly AllowedValueExpansionDestination[];
  propertyPath: string;
  rule: { id: string; name: string; version: number };
  currentValues: readonly AllowedValue[];
  proposedValue: AllowedValue;
  alreadyPending: boolean;
  publishedUnchanged: true;
  pinnedAssignmentWarning: string | undefined;
}

export interface AppliedAllowedValueExpansion {
  schemas: SchemaDefinition[];
  reusableRules: ReusableAllowedValueRule[];
  changed: boolean;
  affectedSchemaId: string;
  pendingChange?: string;
}

function normalizedOperator(operator: string | undefined): string {
  return operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase() ?? "";
}

function isAllowedValue(value: unknown): value is AllowedValue {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function sameValue(left: AllowedValue, right: AllowedValue): boolean {
  return Object.is(left, right);
}

export function allowedValueExpansionAvailability(
  evidence: Partial<ValidationEvaluation>,
): { available: boolean; reason?: string } {
  if (evidence.status !== "error" && evidence.status !== "warning") return { available:false, reason:"The rule did not fail" };
  if (normalizedOperator(evidence.operator) !== "allowed-values") return { available:false, reason:"The failed rule is not an Allowed values rule" };
  if (!evidence.ruleId) return { available:false, reason:"Stable rule identity is unavailable" };
  if (!isAllowedValue(evidence.actualValue)) return { available:false, reason:"Only scalar JSON values can be added" };
  return { available:true };
}

function valuesForRule(rule: AttachedSchemaRule | ReusableAllowedValueRule): AllowedValue[] {
  if (rule.allowedValues) return [...structuredClone(rule.allowedValues)];
  return rule.parameters?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
}

function evidenceRule(input: AllowedValueExpansionInput): AttachedSchemaRule {
  const originSchema = input.schemas.find(({ id }) => id === input.evidence.schemaId);
  const published = originSchema?.attachedRules?.find(({ id, version }) => id === input.evidence.ruleId && version === input.evidence.ruleVersion);
  if (published) return published;
  const assigned = input.schemas.find(({ id }) => id === input.assignedSchemaId);
  const local = assigned?.attachedRules?.find(({ id, version }) => id === input.evidence.ruleId && version === input.evidence.ruleVersion);
  if (local) return local;
  const reusable = input.reusableRules.find(({ id, version }) => id === input.evidence.ruleId && version === input.evidence.ruleVersion);
  if (reusable) return reusable;
  throw new Error("The evidenced Allowed values rule no longer exists.");
}

function expansionOrigin(input: AllowedValueExpansionInput): AllowedValueExpansionOrigin {
  if (input.reusableRules.some(({ id, version }) => id === input.evidence.ruleId && version === input.evidence.ruleVersion)) return "reusable";
  return input.evidence.schemaId && input.evidence.schemaId !== input.assignedSchemaId ? "inherited" : "local";
}

function destinationsFor(origin: AllowedValueExpansionOrigin): readonly AllowedValueExpansionDestination[] {
  if (origin === "inherited") return ["parent-schema-draft", "assigned-schema-override"];
  if (origin === "reusable") return ["reusable-rule-revision", "assigned-schema-override"];
  return ["assigned-schema-draft"];
}

function draftRule(schema: SchemaDefinition, id: string): AttachedSchemaRule | undefined {
  return schema.workingDraft?.attachedRules?.find((rule) => rule.id === id);
}

export function reviewAllowedValueExpansion(input: AllowedValueExpansionInput): AllowedValueExpansionReview {
  const availability = allowedValueExpansionAvailability(input.evidence);
  if (!availability.available) throw new Error(availability.reason);
  const assigned = input.schemas.find(({ id }) => id === input.assignedSchemaId);
  if (!assigned) throw new Error("The assigned schema no longer exists.");
  const rule = evidenceRule(input);
  const origin = expansionOrigin(input);
  const proposedValue = input.evidence.actualValue as AllowedValue;
  const pendingRule = origin === "inherited"
    ? draftRule(input.schemas.find(({ id }) => id === input.evidence.schemaId) ?? assigned, rule.id)
    : draftRule(assigned, rule.id);
  const pendingValues = pendingRule ? valuesForRule(pendingRule) : valuesForRule(rule);
  const pinned = assigned.assignments.find(({ versionPolicy }) => versionPolicy === "pinned");
  return {
    assignedSchema:{ id:assigned.id, name:assigned.name, version:assigned.version },
    origin,
    destinations:destinationsFor(origin),
    propertyPath:input.evidence.propertyPath,
    rule:{ id:rule.id, name:rule.name ?? rule.id, version:rule.version },
    currentValues:valuesForRule(rule),
    proposedValue,
    alreadyPending:pendingValues.some((value) => sameValue(value, proposedValue)),
    publishedUnchanged:true,
    pinnedAssignmentWarning:pinned
      ? `This assignment is pinned to revision ${pinned.schemaVersion ?? assigned.version}; publishing a later revision will not change this event until its version policy is changed separately.`
      : undefined,
  };
}

function valueDescription(value: AllowedValue): string {
  if (value === null) return "null";
  return `${typeof value} ${String(value)}`;
}

function widenedRule(rule: AttachedSchemaRule, value: AllowedValue): AttachedSchemaRule {
  const allowedValues = valuesForRule(rule);
  return allowedValues.some((candidate) => sameValue(candidate, value))
    ? structuredClone(rule)
    : { ...structuredClone(rule), allowedValues:[...allowedValues, value] };
}

function replaceRule(rules: readonly AttachedSchemaRule[], ruleId: string, update: (rule: AttachedSchemaRule) => AttachedSchemaRule): AttachedSchemaRule[] {
  let found = false;
  const result = rules.map((rule) => {
    if (rule.id !== ruleId) return structuredClone(rule);
    found = true;
    return update(rule);
  });
  if (!found) throw new Error("The evidenced rule is absent from the destination draft.");
  return result;
}

function updateSchemaRule(
  schema: SchemaDefinition,
  ruleId: string,
  value: AllowedValue,
  change: string,
): { schema: SchemaDefinition; changed: boolean } {
  const editable = schema.workingDraft ? structuredClone(schema) : createSchemaWorkingDraft(schema);
  const rules = editable.workingDraft?.attachedRules ?? [];
  const current = rules.find(({ id }) => id === ruleId);
  if (!current) throw new Error("The evidenced rule is absent from the destination schema.");
  if (valuesForRule(current).some((candidate) => sameValue(candidate, value))) return { schema:editable, changed:false };
  return {
    schema:updateSchemaWorkingDraft(editable, { attachedRules:replaceRule(rules, ruleId, (rule) => widenedRule(rule, value)) }, change),
    changed:true,
  };
}

function assignedOverride(
  assigned: SchemaDefinition,
  source: AttachedSchemaRule,
  evidence: ValidationEvaluation,
  value: AllowedValue,
  origin: AllowedValueExpansionOrigin,
  change: string,
): { schema: SchemaDefinition; changed: boolean } {
  const editable = assigned.workingDraft ? structuredClone(assigned) : createSchemaWorkingDraft(assigned);
  const rules = [...(editable.workingDraft?.attachedRules ?? [])];
  const overrideId = `local-override:${source.id}:${assigned.id}`;
  const existing = rules.find(({ id }) => id === overrideId);
  if (existing && valuesForRule(existing).some((candidate) => sameValue(candidate, value))) return { schema:editable, changed:false };
  const override = widenedRule({ ...structuredClone(source), id:overrideId, version:1 }, value);
  const attachedRules = [...rules.filter(({ id }) => id !== source.id && id !== overrideId), override];
  const inheritedRuleOverrides = origin === "inherited"
    ? { ...(editable.workingDraft?.inheritedRuleOverrides ?? {}), [evidence.propertyPath]:"disabled" as const }
    : editable.workingDraft?.inheritedRuleOverrides;
  return {
    schema:updateSchemaWorkingDraft(editable, {
      attachedRules,
      ...(inheritedRuleOverrides ? { inheritedRuleOverrides } : {}),
    }, change),
    changed:true,
  };
}

export function applyAllowedValueExpansion(
  input: AllowedValueExpansionInput & { destination: AllowedValueExpansionDestination },
): AppliedAllowedValueExpansion {
  const review = reviewAllowedValueExpansion(input);
  if (!review.destinations.includes(input.destination)) throw new Error("The selected destination is not valid for this rule origin.");
  const proposed = review.proposedValue;
  const source = evidenceRule(input);
  const change = `Allow ${valueDescription(proposed)} for ${review.propertyPath} in ${review.rule.name} (${review.rule.id})`;
  const schemas: SchemaDefinition[] = structuredClone([...input.schemas]);
  const reusableRules: ReusableAllowedValueRule[] = structuredClone([...input.reusableRules]);
  const assignedIndex = schemas.findIndex(({ id }) => id === input.assignedSchemaId);
  if (assignedIndex < 0) throw new Error("The assigned schema no longer exists.");

  if (input.destination === "assigned-schema-draft") {
    const result = updateSchemaRule(schemas[assignedIndex] as SchemaDefinition, source.id, proposed, change);
    schemas[assignedIndex] = result.schema;
    return { schemas, reusableRules, changed:result.changed, affectedSchemaId:input.assignedSchemaId, ...(result.changed ? { pendingChange:change } : {}) };
  }

  if (input.destination === "parent-schema-draft") {
    const parentIndex = schemas.findIndex(({ id }) => id === input.evidence.schemaId);
    if (parentIndex < 0) throw new Error("The parent schema no longer exists.");
    const result = updateSchemaRule(schemas[parentIndex] as SchemaDefinition, source.id, proposed, change);
    schemas[parentIndex] = result.schema;
    return { schemas, reusableRules, changed:result.changed, affectedSchemaId:schemas[parentIndex]!.id, ...(result.changed ? { pendingChange:change } : {}) };
  }

  if (input.destination === "assigned-schema-override") {
    const result = assignedOverride(schemas[assignedIndex] as SchemaDefinition, source, input.evidence, proposed, review.origin, change);
    schemas[assignedIndex] = result.schema;
    return { schemas, reusableRules, changed:result.changed, affectedSchemaId:input.assignedSchemaId, ...(result.changed ? { pendingChange:change } : {}) };
  }

  const reusableIndex = reusableRules.findIndex(({ id, version }) => id === source.id && version === source.version);
  if (reusableIndex < 0) throw new Error("The reusable rule revision no longer exists.");
  const previous = reusableRules[reusableIndex] as ReusableAllowedValueRule;
  if (valuesForRule(previous).some((candidate) => sameValue(candidate, proposed))) return { schemas, reusableRules, changed:false, affectedSchemaId:input.assignedSchemaId };
  const nextVersion = previous.version + 1;
  const revised = {
    ...widenedRule(previous, proposed),
    kind:previous.kind,
    version:nextVersion,
    revisionHistory:[...(previous.revisionHistory ?? []), structuredClone(previous)],
  } as ReusableAllowedValueRule;
  reusableRules[reusableIndex] = revised;
  const attachmentChange = `Update attachment ${source.id} to reusable rule revision ${nextVersion}`;
  const editable = schemas[assignedIndex]!.workingDraft ? structuredClone(schemas[assignedIndex]!) : createSchemaWorkingDraft(schemas[assignedIndex]!);
  const attachedRules = replaceRule(editable.workingDraft?.attachedRules ?? [], source.id, (rule) => ({ ...widenedRule(rule, proposed), version:nextVersion }));
  schemas[assignedIndex] = updateSchemaWorkingDraft(editable, { attachedRules }, attachmentChange);
  return { schemas, reusableRules, changed:true, affectedSchemaId:input.assignedSchemaId, pendingChange:attachmentChange };
}
