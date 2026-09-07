export function assertConditionReferences(document, condition) {
    if (!condition)
        return;
    if (condition.kind === "predicate") {
        if (!document.nodes[condition.propertyId])
            throw new Error("Repair the broken condition property reference.");
        if (condition.operator === "Matches pattern")
            new RegExp(String(condition.value));
        return;
    }
    if (!condition.children.length)
        throw new Error("Repair the empty condition.");
    condition.children.forEach(child => assertConditionReferences(document, child));
}
export function assertRuleValidity(rule, path) {
    for (const key of ["minimum", "maximum", "minItems", "maxItems"]) {
        const value = rule[key];
        if (value !== undefined && (!Number.isFinite(value) || (key.endsWith("Items") && (!Number.isInteger(value) || value < 0))))
            throw new Error(`${path}: repair the invalid ${key}.`);
    }
    if (rule.minimum !== undefined && rule.maximum !== undefined && rule.minimum > rule.maximum)
        throw new Error(`${path}: repair the conflicting numeric limits.`);
    if (rule.minItems !== undefined && rule.maxItems !== undefined && rule.minItems > rule.maxItems)
        throw new Error(`${path}: repair the conflicting cardinality limits.`);
}
//# sourceMappingURL=canonical-errors.js.map