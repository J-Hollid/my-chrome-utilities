import { clone, same } from "./compile-context.js";
const canonicalUnion = (left, right) => [...new Map([...left, ...right].map((value) => [JSON.stringify(value), clone(value)])).values()].sort((first, second) => JSON.stringify(first).localeCompare(JSON.stringify(second)));
const valueMatchesType = (value, type) => type === "null" ? value === null : type === "array" ? Array.isArray(value) : type === "object" ? Boolean(value) && typeof value === "object" && !Array.isArray(value) : type === "integer" ? Number.isInteger(value) : type === "number" ? typeof value === "number" && Number.isFinite(value) : typeof value === type;
const valuesForTypeCheck = (constraint) => [...(constraint.allowedValues ?? []), ...(constraint.expectedValue === undefined ? [] : [constraint.expectedValue]), ...(constraint.examples ?? [])];
const incompatibleTypeChange = (prior, constraint) => Boolean(constraint.type && [...valuesForTypeCheck(prior), ...valuesForTypeCheck(constraint)].some((value) => !valueMatchesType(value, constraint.type)));
export function mergeLayeredProperty(prior, constraint, contributor, parallelPair, parallelPeer, conflict) {
    const source = { contributorId: contributor.id, contributorName: contributor.name, scope: contributor.scope, ...(contributor.inheritanceRoutes?.length ? { inheritanceRoutes: [...contributor.inheritanceRoutes] } : {}) };
    if (!prior)
        return { ...clone(constraint), origins: [source], superseded: [], ...((constraint.type || constraint.presence) ? { facetSources: { ...(constraint.type ? { type: source } : {}), ...(constraint.presence ? { presence: source } : {}) } } : {}), ...(constraint.expectedValue !== undefined ? { expectedContributor: contributor.name, expectedContributors: [contributor.name] } : {}) };
    const next = { ...prior, origins: [...prior.origins, source], superseded: [...prior.superseded], ...(prior.facetSources ? { facetSources: { ...prior.facetSources } } : {}) };
    if (!parallelPair && constraint.type && prior.type && constraint.type !== prior.type && (prior.protectedFacets?.includes("type") || incompatibleTypeChange(prior, constraint))) {
        const sourceOrigin = prior.facetSources?.type ?? prior.origins.at(-1), sourceContributor = sourceOrigin.contributorName;
        const protectedDefinition = prior.protectedFacets?.includes("type") === true;
        conflict(constraint.path, protectedDefinition ? `${sourceContributor} protects this definition from change` : `type cannot change to ${constraint.type} while existing values use ${prior.type}`, [sourceContributor, contributor.name], { contributorIds: [sourceOrigin.contributorId, contributor.id], facet: "Type", sourceContributor, sourceContributorId: sourceOrigin.contributorId, sourceValue: prior.type, localContributor: contributor.name, localContributorId: contributor.id, localValue: constraint.type });
    }
    else if (!parallelPair && constraint.type) {
        next.type = constraint.type;
        next.facetSources = { ...next.facetSources, type: source };
    }
    if (constraint.nullable !== undefined)
        next.nullable = constraint.nullable;
    if (constraint.onlyDefinedFields !== undefined)
        next.onlyDefinedFields = constraint.onlyDefinedFields;
    if (constraint.itemType)
        next.itemType = constraint.itemType;
    if (constraint.itemSchema)
        next.itemSchema = clone(constraint.itemSchema);
    if (constraint.protectedFacets)
        next.protectedFacets = clone(constraint.protectedFacets);
    if (constraint.allowedValues && !(parallelPeer && prior.expectedValue !== undefined)) {
        if (prior.allowedValues) {
            const orderedPageGroups = prior.origins.at(-1)?.scope === "Page Group" && contributor.scope === "Page Group", changed = !same(prior.allowedValues, constraint.allowedValues);
            if (parallelPeer)
                next.allowedValues = clone(prior.allowedValues.filter((value) => constraint.allowedValues.some((candidate) => same(value, candidate))).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))));
            else if (orderedPageGroups && changed) {
                if (prior.enforcement === "invariant")
                    conflict(constraint.path, "invariant allowed values cannot be replaced by membership order", [prior.origins.at(-1).contributorName, contributor.name]);
                else {
                    next.superseded.push({ contributorId: prior.origins.at(-1).contributorId, contributorName: prior.origins.at(-1).contributorName, value: clone(prior.allowedValues) });
                    next.allowedValues = clone(constraint.allowedValues);
                    delete next.allowedValueIds;
                    delete next.allowedValueProvenance;
                }
            }
            else {
                const narrowed = constraint.allowedValues.filter((value) => prior.allowedValues.some((base) => same(base, value)));
                if (narrowed.length !== constraint.allowedValues.length)
                    conflict(constraint.path, `${String(constraint.allowedValues.find((value) => !prior.allowedValues.some((base) => same(base, value))))} is outside the base allowed universe`, [prior.origins.at(-1).contributorName, contributor.name]);
                else
                    next.allowedValues = clone(narrowed);
            }
        }
        else
            next.allowedValues = clone(constraint.allowedValues);
        delete next.expectedValue;
        delete next.expectedContributor;
        delete next.expectedContributors;
        if (constraint.allowedValueIds)
            next.allowedValueIds = clone(constraint.allowedValueIds);
        if (constraint.allowedValueProvenance)
            next.allowedValueProvenance = clone(constraint.allowedValueProvenance);
    }
    if (!constraint.allowedValues && constraint.allowedValueIds)
        next.allowedValueIds = clone(constraint.allowedValueIds);
    if (!constraint.allowedValues && constraint.allowedValueProvenance)
        next.allowedValueProvenance = clone(constraint.allowedValueProvenance);
    if (parallelPeer && constraint.presence) {
        if (prior.presence === "required" || constraint.presence === "required")
            next.presence = "required";
        else if (prior.presence === "forbidden" || constraint.presence === "forbidden")
            next.presence = "forbidden";
        else if (prior.presence === "optional" || constraint.presence === "optional")
            next.presence = "optional";
        else
            next.presence = "permitted";
        if (next.presence === constraint.presence && next.presence !== prior.presence)
            next.facetSources = { ...next.facetSources, presence: source };
    }
    else if (!parallelPair && constraint.presence && prior.presence && constraint.presence !== prior.presence && prior.protectedFacets?.includes("presence")) {
        const sourceOrigin = prior.facetSources?.presence ?? prior.origins.at(-1), sourceContributor = sourceOrigin.contributorName;
        conflict(constraint.path, `${sourceContributor} protects this definition from change`, [sourceContributor, contributor.name], { contributorIds: [sourceOrigin.contributorId, contributor.id], facet: "Presence", sourceContributor, sourceContributorId: sourceOrigin.contributorId, sourceValue: prior.presence, localContributor: contributor.name, localContributorId: contributor.id, localValue: constraint.presence });
    }
    else if (constraint.presence) {
        next.presence = constraint.presence;
        next.facetSources = { ...next.facetSources, presence: source };
    }
    if (constraint.patterns)
        next.patterns = parallelPeer ? canonicalUnion(prior.patterns ?? [], constraint.patterns) : [...(prior.patterns ?? []), ...constraint.patterns];
    if (constraint.minimum !== undefined)
        next.minimum = prior.minimum === undefined ? constraint.minimum : Math.max(prior.minimum, constraint.minimum);
    if (constraint.maximum !== undefined)
        next.maximum = prior.maximum === undefined ? constraint.maximum : Math.min(prior.maximum, constraint.maximum);
    if (constraint.minItems !== undefined)
        next.minItems = prior.minItems === undefined ? constraint.minItems : Math.max(prior.minItems, constraint.minItems);
    if (constraint.maxItems !== undefined)
        next.maxItems = prior.maxItems === undefined ? constraint.maxItems : Math.min(prior.maxItems, constraint.maxItems);
    if (constraint.rules)
        next.rules = parallelPeer ? canonicalUnion(prior.rules ?? [], constraint.rules) : [...(prior.rules ?? []), ...constraint.rules.map(clone)];
    if (constraint.reusableRules)
        next.reusableRules = parallelPeer ? canonicalUnion(prior.reusableRules ?? [], constraint.reusableRules) : [...(prior.reusableRules ?? []), ...constraint.reusableRules.map(clone)];
    if (!parallelPair && constraint.expectedValue !== undefined) {
        if (prior.expectedValue !== undefined && !same(prior.expectedValue, constraint.expectedValue)) {
            const explicit = Boolean(prior.definitionId && constraint.overrideReferences?.includes(prior.definitionId));
            if (prior.enforcement === "invariant" && !explicit)
                conflict(constraint.path, `invariant expectation ${String(prior.expectedValue)} cannot be replaced by ${String(constraint.expectedValue)}`, [prior.expectedContributor ?? prior.origins.at(-1).contributorName, contributor.name]);
            else
                next.superseded.push({ contributorId: prior.origins.at(-1).contributorId, contributorName: prior.expectedContributor ?? prior.origins.at(-1).contributorName, value: clone(prior.expectedValue) });
        }
        delete next.allowedValues;
        delete next.allowedValueIds;
        delete next.allowedValueProvenance;
        next.expectedValue = clone(constraint.expectedValue);
        const expectedContributors = parallelPeer ? canonicalUnion(prior.expectedContributors ?? (prior.expectedContributor ? [prior.expectedContributor] : []), [contributor.name]) : [contributor.name];
        next.expectedContributors = expectedContributors;
        next.expectedContributor = expectedContributors.join(" + ");
        next.enforcement = parallelPeer && (prior.enforcement === "invariant" || constraint.enforcement === "invariant") ? "invariant" : constraint.enforcement ?? "overridable";
    }
    if (parallelPeer && constraint.enforcement)
        next.enforcement = prior.enforcement === "invariant" || constraint.enforcement === "invariant" ? "invariant" : "overridable";
    if (constraint.concept !== undefined)
        next.concept = constraint.concept;
    if (constraint.condition)
        next.condition = clone(constraint.condition);
    if (constraint.displayText !== undefined)
        next.displayText = constraint.displayText;
    if (constraint.documentation !== undefined)
        next.documentation = constraint.documentation;
    if (constraint.comments !== undefined)
        next.comments = constraint.comments;
    if (constraint.examples)
        next.examples = clone(constraint.examples);
    if (constraint.definitionId)
        next.definitionId = constraint.definitionId;
    if (constraint.overrideReferences)
        next.overrideReferences = parallelPeer ? canonicalUnion(prior.overrideReferences ?? [], constraint.overrideReferences) : clone(constraint.overrideReferences);
    return next;
}
//# sourceMappingURL=compile-merge.js.map