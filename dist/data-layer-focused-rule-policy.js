import { canonicalFlatPredicateIssue } from "./canonical-schema/predicate-policy.js";
const existenceOperators = new Set(["Exists", "Does not exist"]);
const incompleteConditionPredicate = (condition) => {
    if (!condition || typeof condition !== "object")
        return true;
    const value = condition;
    if (value.kind === "predicate") {
        const operator = String(value.operator ?? "").trim();
        if (!String(value.propertyId ?? "").trim() || !operator)
            return true;
        return !existenceOperators.has(operator) && (value.value === undefined || typeof value.value === "string" && !value.value.trim() || Array.isArray(value.value) && !value.value.length);
    }
    return Array.isArray(value.children) ? value.children.some(incompleteConditionPredicate) : true;
};
const flatConditionIssue = (condition) => {
    if (!condition || typeof condition !== "object")
        return true;
    const value = condition;
    if (!["all", "any"].includes(String(value.kind)) || !Array.isArray(value.children) || !value.children.length)
        return true;
    return value.children.some((child) => !child || typeof child !== "object" || child.kind !== "predicate" || incompleteConditionPredicate(child));
};
/** Validate a staged rule without depending on a browser or persistence adapter. */
export function focusedRuleIssue(rule) {
    if (["presence", "value", "pattern", "range", "cardinality", "reusable"].includes(String(rule.kind)) && !String(rule.name ?? "").trim())
        return "Enter a rule name.";
    const migrationIssue = canonicalFlatPredicateIssue(rule.condition);
    if (migrationIssue)
        return migrationIssue;
    if (["presence", "value", "pattern", "range", "cardinality", "reusable"].includes(String(rule.kind)) && flatConditionIssue(rule.condition))
        return "Complete or remove the condition.";
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