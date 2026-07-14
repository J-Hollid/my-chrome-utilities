import type { GuidedRequirement, GuidedValueType } from "./data-layer-guided-validation.js";
import type { AttachedSchemaRule } from "./data-layer-schema-verification.js";

export interface GuidedPublishedRule {
  path: string;
  expectedType: GuidedValueType;
  requirement: GuidedRequirement;
  values: readonly string[];
  reusableRuleId?: string;
}

function guidedOperator(requirement: GuidedRequirement): string {
  if (requirement === "Must be one of these values") return "allowed-values";
  if (requirement === "Must match a pattern") return "regular-expression";
  return "required";
}

function guidedParameters(rule: GuidedPublishedRule): string | undefined {
  const operator = guidedOperator(rule.requirement);
  if (operator === "required") return undefined;
  if (operator === "regular-expression") return rule.values[0] ?? "";
  return rule.values.join(",");
}

export function guidedAttachedRule(rule: GuidedPublishedRule, name: string, localRuleId?: string): AttachedSchemaRule {
  const parameters = guidedParameters(rule);
  return {
    id:rule.reusableRuleId ?? localRuleId ?? `local-rule:${rule.path}`,
    name,
    version:1,
    propertyPath:rule.path,
    operator:guidedOperator(rule.requirement),
    ...(parameters !== undefined ? { parameters } : {}),
    severity:"error",
    enabled:true,
  };
}
