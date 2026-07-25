/** The deliberately small vocabulary shared by every schema contributor editor. */
export const focusedPropertySections = [
    "definition",
    "presence",
    "values",
    "conditions",
    "rules",
    "documentation",
    "example",
    "structure",
];
export const focusedPropertySectionLabels = {
    definition: "Definition",
    presence: "Presence",
    values: "Expected and allowed values",
    conditions: "Conditions",
    rules: "Rules",
    documentation: "Documentation",
    example: "Example",
    structure: "Structure",
};
/**
 * Keep ownership legality in one place.  The UI may present an inherited item,
 * but it must never accidentally turn a parent item into a local deletion.
 */
export function focusedOwnershipActions(input) {
    if (input.conflict)
        return ["View conflict", "Edit local resolution", "Open contributing sources"];
    if (input.invariant)
        return ["View", "Open source"];
    if (input.overridden)
        return ["View", "Edit", "Reset to parent"];
    if (input.local)
        return ["View", "Edit", "Remove local"];
    if (input.inherited)
        return ["View", ...(input.replaceable ? ["Replace here"] : ["Override here"]), "Open source"];
    return ["View", "Edit"];
}
export const focusedReusableRuleStorageKey = "my-chrome-utilities.schema-rule-library.v1";
export function filterFocusedReusableRules(rules, query) {
    const needle = query.trim().toLocaleLowerCase();
    return rules.filter(({ enabled, name }) => enabled !== false && (!needle || name.toLocaleLowerCase().includes(needle)));
}
export function readFocusedReusableRules(storage) {
    let source = storage;
    if (!source)
        try {
            source = globalThis.localStorage;
        }
        catch {
            return [];
        }
    if (!source)
        return [];
    try {
        const parsed = JSON.parse(source.getItem(focusedReusableRuleStorageKey) ?? "[]");
        return Array.isArray(parsed) ? parsed.filter((entry) => Boolean(entry) && typeof entry.id === "string" && typeof entry.name === "string") : [];
    }
    catch {
        return [];
    }
}
const unresolvedConditionProperty = (condition) => {
    if (!condition || typeof condition !== "object")
        return true;
    const value = condition;
    if (value.kind === "predicate")
        return !String(value.propertyId ?? "").trim();
    return Array.isArray(value.children) ? value.children.some(unresolvedConditionProperty) : true;
};
export function focusedRuleIssue(rule) {
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
    if (rule.kind === "condition" && unresolvedConditionProperty(rule.condition))
        return "Resolve the condition property.";
    if (rule.kind === "reusable" && !String(rule.reusableRuleId ?? "").trim())
        return "Choose a reusable rule.";
    return undefined;
}
export function focusedRuleFields(kind) {
    switch (kind) {
        case "pattern": return ["pattern", "severity", "message"];
        case "range": return ["minimum", "maximum", "severity", "message"];
        case "cardinality": return ["minItems", "maxItems", "severity", "message"];
        case "condition": return ["condition", "severity", "message"];
        case "reusable": return ["reusableRuleId"];
        case "custom": return ["severity", "message", "reusableRuleId"];
        default: return ["severity", "message"];
    }
}
export function focusedConditionLabel(condition) {
    if (!condition)
        return "All (empty)";
    if (condition.kind === "predicate")
        return `${String(condition.propertyId ?? "Unresolved property")} ${String(condition.operator ?? "Exists")}${condition.value === undefined ? "" : ` ${String(condition.value)}`}`;
    const kind = condition.kind === "any" ? "Any" : condition.kind === "not" ? "Not" : "All";
    const children = Array.isArray(condition.children) ? condition.children : [];
    return `${kind} (${children.map((child) => focusedConditionLabel(child)).join(kind === "Any" ? " or " : " and ")})`;
}
export function focusedSparseDelta(next, inherited) {
    const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
    return Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== undefined && !same(value, inherited[key])));
}
export function focusedConstraintPreview(path, facets) {
    const pieces = [
        facets.type ? `type ${facets.type}` : undefined,
        facets.presence ? `presence ${facets.presence}` : undefined,
        facets.allowedValues?.length ? `allowed ${JSON.stringify(facets.allowedValues)}` : undefined,
        facets.rules?.length ? `${facets.rules.length} rules` : undefined,
    ].filter(Boolean);
    return `${path} · ${pieces.join(" · ") || "no local facets"}`;
}
//# sourceMappingURL=data-layer-focused-schema-property-ui.js.map