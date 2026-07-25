import { clone, same } from "./compile-context.js";
export function mergeLayeredProperty(prior, constraint, contributor, parallelPair, conflict) {
    const source = { contributorId: contributor.id, contributorName: contributor.name, scope: contributor.scope };
    if (!prior)
        return { ...clone(constraint), origins: [source], superseded: [], ...(constraint.expectedValue !== undefined ? { expectedContributor: contributor.name } : {}) };
    const next = { ...prior, origins: [...prior.origins, source], superseded: [...prior.superseded] };
    if (!parallelPair && constraint.type && prior.type && constraint.type !== prior.type)
        conflict(constraint.path, "type cannot change", [prior.origins.at(-1).contributorName, contributor.name]);
    else if (!parallelPair && constraint.type)
        next.type = constraint.type;
    if (constraint.allowedValues) {
        if (prior.allowedValues) {
            const narrowed = constraint.allowedValues.filter((value) => prior.allowedValues.some((base) => same(base, value)));
            if (narrowed.length !== constraint.allowedValues.length)
                conflict(constraint.path, `${String(constraint.allowedValues.find((value) => !prior.allowedValues.some((base) => same(base, value))))} is outside the base allowed universe`, [prior.origins.at(-1).contributorName, contributor.name]);
            else
                next.allowedValues = clone(narrowed);
        }
        else
            next.allowedValues = clone(constraint.allowedValues);
        if (constraint.allowedValueIds)
            next.allowedValueIds = clone(constraint.allowedValueIds);
        if (constraint.allowedValueProvenance)
            next.allowedValueProvenance = clone(constraint.allowedValueProvenance);
    }
    if (!constraint.allowedValues && constraint.allowedValueIds)
        next.allowedValueIds = clone(constraint.allowedValueIds);
    if (!constraint.allowedValues && constraint.allowedValueProvenance)
        next.allowedValueProvenance = clone(constraint.allowedValueProvenance);
    if (prior.presence === "required" && constraint.presence === "optional")
        conflict(constraint.path, "required cannot be silently relaxed", [prior.origins.at(-1).contributorName, contributor.name]);
    else if (prior.presence === "forbidden" && constraint.presence === "permitted")
        conflict(constraint.path, "a forbidden property cannot be re-enabled", [prior.origins.at(-1).contributorName, contributor.name]);
    else if (constraint.presence)
        next.presence = constraint.presence;
    if (constraint.patterns)
        next.patterns = [...(prior.patterns ?? []), ...constraint.patterns];
    if (constraint.minimum !== undefined)
        next.minimum = prior.minimum === undefined ? constraint.minimum : Math.max(prior.minimum, constraint.minimum);
    if (constraint.maximum !== undefined)
        next.maximum = prior.maximum === undefined ? constraint.maximum : Math.min(prior.maximum, constraint.maximum);
    if (constraint.minItems !== undefined)
        next.minItems = prior.minItems === undefined ? constraint.minItems : Math.max(prior.minItems, constraint.minItems);
    if (constraint.maxItems !== undefined)
        next.maxItems = prior.maxItems === undefined ? constraint.maxItems : Math.min(prior.maxItems, constraint.maxItems);
    if (constraint.rules)
        next.rules = [...(prior.rules ?? []), ...constraint.rules.map(clone)];
    if (constraint.reusableRules)
        next.reusableRules = [...(prior.reusableRules ?? []), ...constraint.reusableRules.map(clone)];
    if (!parallelPair && constraint.expectedValue !== undefined) {
        if (prior.expectedValue !== undefined && !same(prior.expectedValue, constraint.expectedValue)) {
            const explicit = Boolean(prior.definitionId && constraint.overrideReferences?.includes(prior.definitionId));
            if (prior.enforcement === "invariant" && !explicit)
                conflict(constraint.path, `invariant expectation ${String(prior.expectedValue)} cannot be replaced by ${String(constraint.expectedValue)}`, [prior.expectedContributor ?? prior.origins.at(-1).contributorName, contributor.name]);
            else
                next.superseded.push({ contributorId: prior.origins.at(-1).contributorId, contributorName: prior.expectedContributor ?? prior.origins.at(-1).contributorName, value: clone(prior.expectedValue) });
        }
        next.expectedValue = clone(constraint.expectedValue);
        next.expectedContributor = contributor.name;
        next.enforcement = constraint.enforcement ?? "overridable";
    }
    if (constraint.condition)
        next.condition = clone(constraint.condition);
    if (constraint.documentation)
        next.documentation = constraint.documentation;
    if (constraint.examples)
        next.examples = clone(constraint.examples);
    if (constraint.definitionId)
        next.definitionId = constraint.definitionId;
    if (constraint.overrideReferences)
        next.overrideReferences = clone(constraint.overrideReferences);
    return next;
}
//# sourceMappingURL=compile-merge.js.map