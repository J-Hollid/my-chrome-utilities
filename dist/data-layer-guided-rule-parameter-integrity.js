import { canonicalNestedPath } from "./data-layer-schema-nested-path.js";
import { parseTargetExpression } from "./data-layer-recursive-property-tree.js";
function guidedOperator(requirement) {
    if (requirement === "Must be one of these values")
        return "allowed-values";
    if (requirement === "Must match a pattern")
        return "regular-expression";
    return "required";
}
function guidedParameters(rule) {
    const operator = guidedOperator(rule.requirement);
    if (operator === "required")
        return undefined;
    if (operator === "regular-expression")
        return rule.values[0] ?? "";
    return rule.values.join(",");
}
export function guidedAttachedRule(rule, name, localRuleId) {
    const propertyPath = rule.path.startsWith("$")
        ? `/${parseTargetExpression(rule.path).map((segment) => segment.kind === "property" ? String(segment.value).replaceAll("~", "~0").replaceAll("/", "~1") : segment.kind === "every" ? "*" : String(segment.value)).join("/")}`
        : canonicalNestedPath(rule.path);
    const parameters = guidedParameters(rule);
    return {
        id: rule.reusableRuleId ?? localRuleId ?? `local-rule:${propertyPath}`,
        name,
        version: 1,
        propertyPath,
        operator: guidedOperator(rule.requirement),
        ...(parameters !== undefined ? { parameters } : {}),
        severity: rule.severity ?? "error",
        ...(rule.message !== undefined ? { message: rule.message } : {}),
        ...(rule.conditionGroup ? { conditionGroup: structuredClone(rule.conditionGroup) } : {}),
        enabled: rule.enabled ?? true,
    };
}
//# sourceMappingURL=data-layer-guided-rule-parameter-integrity.js.map