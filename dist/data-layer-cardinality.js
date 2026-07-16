export const cardinalityComparisons = [">", ">=", "==", "<", "<="];
export function cardinalityMeasuredValue(propertyType) {
    return propertyType === "string" ? "string character count" : "array item count";
}
export function cardinalityComparisonPasses(actual, comparison, limit) {
    if (comparison === ">")
        return actual > limit;
    if (comparison === ">=")
        return actual >= limit;
    if (comparison === "==")
        return actual === limit;
    if (comparison === "<")
        return actual < limit;
    return actual <= limit;
}
export function cardinalityConstraint(kind, comparison, limit) {
    const relation = comparison === ">" ? "greater than"
        : comparison === ">=" ? "at least"
            : comparison === "==" ? "exactly"
                : comparison === "<" ? "less than"
                    : "at most";
    return `${kind} ${relation} ${limit}`;
}
//# sourceMappingURL=data-layer-cardinality.js.map