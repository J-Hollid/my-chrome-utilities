const unresolvedConditionProperty = (condition) => {
    if (!condition || typeof condition !== "object")
        return true;
    const value = condition;
    if (value.kind === "predicate")
        return !String(value.propertyId ?? "").trim();
    return Array.isArray(value.children) ? value.children.some(unresolvedConditionProperty) : true;
};
/** Validate a staged rule without depending on a browser or persistence adapter. */
export function focusedRuleIssue(rule) {
    if (rule.condition !== undefined && ["presence", "value", "pattern", "range", "cardinality", "reusable"].includes(String(rule.kind)) && unresolvedConditionProperty(rule.condition))
        return "Resolve the When condition.";
    if (rule.kind === "presence" && !["required", "optional", "forbidden"].includes(String(rule.presence ?? "")))
        return "Choose Required, Optional, or Forbidden.";
    if (rule.kind === "value" && !(Array.isArray(rule.allowedValues) && rule.allowedValues.length))
        return "Enter at least one allowed value.";
    if (rule.kind === "pattern" && !String(rule.pattern ?? "").trim())
        return "Enter a regular expression.";
    if (rule.kind === "range" && rule.minimum !== undefined && rule.maximum !== undefined && Number(rule.minimum) > Number(rule.maximum))
        return "Minimum must not exceed maximum.";
    if (rule.kind === "range" && rule.minimum === undefined && rule.maximum === undefined)
        return "Enter a minimum or maximum.";
    if (rule.kind === "cardinality" && rule.minItems !== undefined && rule.maxItems !== undefined && Number(rule.minItems) > Number(rule.maxItems))
        return "Minimum items must not exceed maximum items.";
    if (rule.kind === "cardinality" && rule.minItems === undefined && rule.maxItems === undefined)
        return "Enter minimum or maximum items.";
    if (rule.kind === "reusable" && !String(rule.reusableRuleId ?? "").trim())
        return "Choose a reusable rule.";
    return undefined;
}
//# sourceMappingURL=data-layer-focused-rule-policy.js.map