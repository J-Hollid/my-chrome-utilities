import { canonicalNestedPath } from "./data-layer-schema-nested-path.js";
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
    const propertyPath = canonicalNestedPath(rule.path);
    const parameters = guidedParameters(rule);
    return {
        id: rule.reusableRuleId ?? localRuleId ?? `local-rule:${propertyPath}`,
        name,
        version: 1,
        propertyPath,
        operator: guidedOperator(rule.requirement),
        ...(parameters !== undefined ? { parameters } : {}),
        severity: "error",
        enabled: true,
    };
}
//# sourceMappingURL=data-layer-guided-rule-parameter-integrity.js.map