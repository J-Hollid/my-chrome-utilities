const clone = (value) => structuredClone(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export function focusedSourceState(node) {
    if (node.provenance.some(({ state }) => state === "shadowed"))
        return "overridden";
    if (node.provenance.some(({ state }) => state === "inherited"))
        return "inherited";
    return "local";
}
export function focusedPropertyPatch(node, original, removedRuleIds) {
    const patch = {};
    for (const key of ["name", "type", "itemType", "presence", "allowedValues", "documentation", "overrideReferences", "expectedValue", "enforcement", "target"])
        if (!same(node[key], original[key]))
            Object.assign(patch, { [key]: clone(node[key]) });
    const nextRules = node.rules.filter(({ id }) => !removedRuleIds.has(id));
    if (!same(nextRules, original.rules) || removedRuleIds.size)
        patch.rules = clone(nextRules);
    return patch;
}
export function focusedStagedChanges(node, original, removedRuleIds, path) {
    return Object.keys(focusedPropertyPatch(node, original, removedRuleIds)).map((key) => ({ label: key === "rules" ? "Edit rules" : key === "allowedValues" ? "Edit values" : `Edit ${key}`, detail: `${key} staged for ${path}` }));
}
//# sourceMappingURL=data-layer-canonical-schema-focused-drafts.js.map