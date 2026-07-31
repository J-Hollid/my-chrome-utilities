export const clone = (value) => structuredClone(value);
export const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export const included = (target, context) => !target || target === "all" || target === context.eventRole || target === context.eventId || target === context.occurrenceId;
export const origin = (contributor) => ({ contributorId: contributor.id, contributorName: contributor.name, scope: contributor.scope, ...(contributor.inheritanceRoutes?.length ? { inheritanceRoutes: [...contributor.inheritanceRoutes] } : {}) });
export const branch = (scope) => scope === "Event" ? "event" : scope === "Page Group" || scope === "Page" || scope === "Flow Page-instance" ? "page" : scope === "Event-occurrence" ? "occurrence" : "shared";
export const parallelMismatch = (left, right) => Boolean(left.type && right.type && left.type !== right.type || left.expectedValue !== undefined && right.expectedValue !== undefined && !same(left.expectedValue, right.expectedValue) || left.presence === "required" && right.presence === "forbidden" || left.presence === "forbidden" && right.presence === "required");
export const peerMismatch = (left, right) => {
    const differentFacet = (key) => left[key] !== undefined && right[key] !== undefined && !same(left[key], right[key]);
    return parallelMismatch(left, right) || Boolean(left.itemType && right.itemType && left.itemType !== right.itemType
        || left.itemSchema && right.itemSchema && !same(left.itemSchema, right.itemSchema)
        || left.allowedValues?.length && right.allowedValues?.length && !left.allowedValues.some((value) => right.allowedValues.some((candidate) => same(value, candidate)))
        || left.expectedValue !== undefined && right.allowedValues?.length && !right.allowedValues.some((value) => same(value, left.expectedValue))
        || right.expectedValue !== undefined && left.allowedValues?.length && !left.allowedValues.some((value) => same(value, right.expectedValue))
        || left.minimum !== undefined && right.maximum !== undefined && left.minimum > right.maximum
        || right.minimum !== undefined && left.maximum !== undefined && right.minimum > left.maximum
        || left.minItems !== undefined && right.maxItems !== undefined && left.minItems > right.maxItems
        || right.minItems !== undefined && left.maxItems !== undefined && right.minItems > left.maxItems
        || differentFacet("concept") || differentFacet("condition") || differentFacet("displayText") || differentFacet("documentation") || differentFacet("comments") || differentFacet("examples"));
};
export const peerSetMismatch = (constraints) => {
    const allowed = constraints.flatMap(({ allowedValues }) => allowedValues?.length ? [allowedValues] : []);
    if (allowed.length > 1 && !allowed.reduce((intersection, values) => intersection.filter((value) => values.some((candidate) => same(value, candidate)))).length)
        return true;
    const minimums = constraints.flatMap(({ minimum }) => minimum === undefined ? [] : [minimum]), maximums = constraints.flatMap(({ maximum }) => maximum === undefined ? [] : [maximum]), minimumItems = constraints.flatMap(({ minItems }) => minItems === undefined ? [] : [minItems]), maximumItems = constraints.flatMap(({ maxItems }) => maxItems === undefined ? [] : [maxItems]);
    return Boolean(minimums.length && maximums.length && Math.max(...minimums) > Math.min(...maximums) || minimumItems.length && maximumItems.length && Math.max(...minimumItems) > Math.min(...maximumItems));
};
const ordinaryRules = (rules) => rules.filter(({ condition, arrayScope }) => !condition && !(arrayScope?.boundaries?.length));
const numericRuleValues = (rules, kind, field) => ordinaryRules(rules).filter((rule) => rule.kind === kind && typeof rule[field] === "number").map((rule) => rule[field]);
export const constraintWithStructuredRules = (constraint) => { const rules = constraint.rules ?? [], patterns = [...new Set([...(constraint.patterns ?? []), ...ordinaryRules(rules).filter((rule) => rule.kind === "pattern" && typeof rule.pattern === "string").map((rule) => rule.pattern)])], minimums = [...(constraint.minimum === undefined ? [] : [constraint.minimum]), ...numericRuleValues(rules, "range", "minimum")], maximums = [...(constraint.maximum === undefined ? [] : [constraint.maximum]), ...numericRuleValues(rules, "range", "maximum")], minimumItems = [...(constraint.minItems === undefined ? [] : [constraint.minItems]), ...numericRuleValues(rules, "cardinality", "minItems")], maximumItems = [...(constraint.maxItems === undefined ? [] : [constraint.maxItems]), ...numericRuleValues(rules, "cardinality", "maxItems")]; return { ...constraint, ...(patterns.length ? { patterns } : {}), ...(minimums.length ? { minimum: Math.max(...minimums) } : {}), ...(maximums.length ? { maximum: Math.min(...maximums) } : {}), ...(minimumItems.length ? { minItems: Math.max(...minimumItems) } : {}), ...(maximumItems.length ? { maxItems: Math.min(...maximumItems) } : {}) }; };
//# sourceMappingURL=compile-context.js.map