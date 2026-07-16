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
export function cardinalityBounds(comparison, limit) {
    if (comparison === ">")
        return { minimum: limit + 1 };
    if (comparison === ">=")
        return { minimum: limit };
    if (comparison === "==")
        return { minimum: limit, maximum: limit };
    if (comparison === "<")
        return limit <= 0 ? { impossible: true } : { maximum: limit - 1 };
    return { maximum: limit };
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