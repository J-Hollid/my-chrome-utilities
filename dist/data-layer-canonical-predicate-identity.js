const clone = (value) => structuredClone(value);
/** Add deterministic identities only when a legacy predicate has none. Existing IDs survive reordering. */
export function canonicalPredicateWithStableIds(predicate, id = (kind) => `${kind}:predicate`, path = "root") {
    if (!predicate)
        return undefined;
    if (predicate.kind === "predicate")
        return { ...clone(predicate), id: predicate.id ?? id(`condition-${path}`) };
    return { ...clone(predicate), id: predicate.id ?? id(`condition-${path}`), children: predicate.children.map((child, index) => canonicalPredicateWithStableIds(child, id, `${path}.${index}`)) };
}
export function canonicalPredicateIds(predicate) {
    if (!predicate)
        return [];
    return [predicate.id ?? "", ...(predicate.kind === "predicate" ? [] : predicate.children.flatMap(canonicalPredicateIds))].filter(Boolean);
}
//# sourceMappingURL=data-layer-canonical-predicate-identity.js.map