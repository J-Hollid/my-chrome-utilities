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
    const parameters = guidedParameters(rule);
    return {
        id: rule.reusableRuleId ?? localRuleId ?? `local-rule:${rule.path}`,
        name,
        version: 1,
        propertyPath: rule.path,
        operator: guidedOperator(rule.requirement),
        ...(parameters !== undefined ? { parameters } : {}),
        severity: "error",
        enabled: true,
    };
}
//# sourceMappingURL=data-layer-guided-rule-parameter-integrity.js.map