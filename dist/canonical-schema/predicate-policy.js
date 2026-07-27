export const nestedCanonicalPredicateMessage = "Nested All, Any, or Not conditions require explicit migration before this rule can be edited.";
/**
 * Canonical rule authoring persists exactly one All/Any group containing leaves.
 * Existing nested trees remain readable, but they cannot cross a write boundary
 * until an explicit, semantics-preserving migration has replaced them.
 */
export function canonicalFlatPredicateIssue(condition) {
    if (condition === undefined)
        return undefined;
    if (!condition || typeof condition !== "object")
        return "A rule condition must be a structured All or Any match.";
    const value = condition;
    if (value.kind === "predicate")
        return "A rule condition requires one top-level All or Any match mode.";
    if (value.kind === "not")
        return nestedCanonicalPredicateMessage;
    if (!["all", "any"].includes(String(value.kind)) || !Array.isArray(value.children))
        return "A rule condition must be a structured All or Any match.";
    if (value.children.some((child) => !child || typeof child !== "object" || child.kind !== "predicate"))
        return nestedCanonicalPredicateMessage;
    if (!value.children.length)
        return "A rule condition requires at least one condition row.";
    return undefined;
}
//# sourceMappingURL=predicate-policy.js.map