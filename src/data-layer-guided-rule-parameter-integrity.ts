import type { GuidedRequirement, PublishedGuidedRule } from "./data-layer-guided-validation.js";
import { canonicalRulePropertyPath } from "./data-layer-schema-property-path.js";
import type { AttachedSchemaRule } from "./data-layer-schema-verification.js";
import { typedAllowedValues } from "./data-layer-allowed-values-rule.js";

function guidedOperator(requirement: GuidedRequirement): string {
  if (requirement === "Must be one of these values") return "allowed-values";
  if (requirement === "Must match a pattern") return "regular-expression";
  return "required";
}

function guidedParameters(rule: PublishedGuidedRule): string | undefined {
  const operator = guidedOperator(rule.requirement);
  if (operator === "required") return undefined;
  if (operator === "regular-expression") return rule.values[0] ?? "";
  return rule.values.join(",");
}

export function guidedAttachedRule(rule: PublishedGuidedRule, name: string, localRuleId?: string): AttachedSchemaRule {
  const propertyPath = canonicalRulePropertyPath(rule.path);
  const parameters = guidedParameters(rule);
  const allowedValues = rule.requirement === "Must be one of these values"
    ? typedAllowedValues(rule.values, rule.expectedType.toLowerCase() as "string" | "number" | "boolean")
    : undefined;
  return {
    id:rule.reusableRuleId ?? localRuleId ?? `local-rule:${propertyPath}`,
    name,
    version:1,
    propertyPath,
    operator:guidedOperator(rule.requirement),
    ...(allowedValues !== undefined ? { allowedValues } : parameters !== undefined ? { parameters } : {}),
    severity:rule.severity ?? "error",
    ...(rule.message !== undefined ? { message:rule.message } : {}),
    ...(rule.conditionGroup ? { conditionGroup:structuredClone(rule.conditionGroup) } : {}),
    enabled:rule.enabled ?? true,
  };
}
