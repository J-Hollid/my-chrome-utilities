import { clone, same } from "./compile-context.js";
const canonicalUnion = (left, right) => [...new Map([...left, ...right].map((value) => [JSON.stringify(value), clone(value)])).values()].sort((first, second) => JSON.stringify(first).localeCompare(JSON.stringify(second)));
const valueMatchesType = (value, type) => type === "null" ? value === null : type === "array" ? Array.isArray(value) : type === "object" ? Boolean(value) && typeof value === "object" && !Array.isArray(value) : type === "integer" ? Number.isInteger(value) : type === "number" ? typeof value === "number" && Number.isFinite(value) : typeof value === type;
const valuesForTypeCheck = (constraint) => [...(constraint.allowedValues ?? []), ...(constraint.expectedValue === undefined ? [] : [constraint.expectedValue]), ...(constraint.examples ?? [])];
const incompatibleTypeChange = (prior, constraint) => Boolean(constraint.type && [...valuesForTypeCheck(prior), ...valuesForTypeCheck(constraint)].some((value) => !valueMatchesType(value, constraint.type)));
const valueMatchesItemSchema = (value, schema) => (!schema.type || valueMatchesType(value, schema.type)) && (!schema.allowedValues || schema.allowedValues.some((candidate) => same(candidate, value))) && (!schema.items || !Array.isArray(value) || value.every((item) => valueMatchesItemSchema(item, schema.items)));
const incompatibleItemSchemaChange = (prior, constraint) => Boolean(constraint.itemSchema && valuesForTypeCheck(prior).filter(Array.isArray).some((items) => items.some((item) => !valueMatchesItemSchema(item, constraint.itemSchema))));
const itemSchemaLabel = (schema, itemType) => `${String(schema?.type ?? itemType ?? "unspecified").replace(/^./u, (first) => first.toUpperCase())} items`;
const facetSource = (prior, key) => prior.facetSources?.[key] ?? prior.origins.at(-1);
const issue = (prior, constraint, contributor, key, facet, section, sourceValue, localValue, message) => { const source = facetSource(prior, key); return { facet, section, contributorIds: [source.contributorId, contributor.id], sourceContributor: source.contributorName, sourceContributorId: source.contributorId, sourceValue, localContributor: contributor.name, localContributorId: contributor.id, localValue, message }; };
const simplePatternDomain = (pattern) => /\[a-z\]/iu.test(pattern) ? "letters" : /\[0-9\]|\\d/u.test(pattern) ? "digits" : undefined;
const rulesFor = (constraint, kind) => (constraint.rules ?? []).filter((candidate) => String(candidate.kind ?? "") === kind);
const conflictingRulePair = (prior, constraint, kind) => { const sources = rulesFor(prior, kind), locals = rulesFor(constraint, kind), conflicts = (source, local) => { if (kind === "pattern") {
    const sourceDomain = typeof source.pattern === "string" ? simplePatternDomain(source.pattern) : undefined, localDomain = typeof local.pattern === "string" ? simplePatternDomain(local.pattern) : undefined;
    return Boolean(sourceDomain && localDomain && sourceDomain !== localDomain);
} if (kind === "range")
    return typeof source.maximum === "number" && typeof local.minimum === "number" && local.minimum > source.maximum || typeof source.minimum === "number" && typeof local.maximum === "number" && local.maximum < source.minimum; return typeof source.maxItems === "number" && typeof local.minItems === "number" && local.minItems > source.maxItems || typeof source.minItems === "number" && typeof local.maxItems === "number" && local.maxItems < source.minItems; }; for (const source of sources)
    for (const local of locals)
        if (conflicts(source, local))
            return { source, local }; return { ...(sources[0] ? { source: sources[0] } : {}), ...(locals[0] ? { local: locals[0] } : {}) }; };
const ruleDetails = (prior, pair) => { const sourceRuleId = pair.source?.id === undefined ? undefined : String(pair.source.id), localRuleId = pair.local?.id === undefined ? undefined : String(pair.local.id); return { ...(sourceRuleId ? { sourceRuleId } : {}), ...(pair.source?.enforcement === "invariant" || prior.enforcement === "invariant" ? { sourceRuleInvariant: true } : {}), ...(localRuleId ? { localRuleId } : {}), ...(pair.local?.enforcement === "invariant" ? { localRuleInvariant: true } : {}) }; };
const replacedRuleIds = (constraint) => new Set((constraint.rules ?? []).flatMap((rule) => typeof rule.replacesRuleId === "string" ? [rule.replacesRuleId] : []));
export function mergeLayeredProperty(prior, constraint, contributor, parallelPair, parallelPeer, conflict) {
    const source = { contributorId: contributor.id, contributorName: contributor.name, scope: contributor.scope, ...(contributor.inheritanceRoutes?.length ? { inheritanceRoutes: [...contributor.inheritanceRoutes] } : {}) };
    if (!prior)
        return { ...clone(constraint), origins: [source], superseded: [], ...((constraint.type || constraint.presence || constraint.itemSchema) ? { facetSources: { ...(constraint.type ? { type: source } : {}), ...(constraint.presence ? { presence: source } : {}), ...(constraint.itemSchema ? { itemSchema: source } : {}) } } : {}), ...(constraint.expectedValue !== undefined ? { expectedContributor: contributor.name, expectedContributors: [contributor.name] } : {}) };
    const next = { ...prior, origins: [...prior.origins, source], superseded: [...prior.superseded], ...(prior.facetSources ? { facetSources: { ...prior.facetSources } } : {}) };
    if (!parallelPair && constraint.type && prior.type && constraint.type !== prior.type && (prior.protectedFacets?.includes("type") || incompatibleTypeChange(prior, constraint))) {
        const sourceOrigin = prior.facetSources?.type ?? prior.origins.at(-1), sourceContributor = sourceOrigin.contributorName;
        const protectedDefinition = prior.protectedFacets?.includes("type") === true;
        const message = protectedDefinition ? `${sourceContributor} protects this definition from change` : `type cannot change to ${constraint.type} while existing values use ${prior.type}`;
        conflict(constraint.path, message, [sourceContributor, contributor.name], { ...issue(prior, constraint, contributor, "type", "Type", "Definition", prior.type, constraint.type, message), contributorIds: [sourceOrigin.contributorId, contributor.id], sourceContributor, sourceContributorId: sourceOrigin.contributorId });
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
    if (constraint.itemSchema) {
        if (incompatibleItemSchemaChange(prior, constraint)) {
            const message = `existing values do not fit ${itemSchemaLabel(constraint.itemSchema, constraint.itemType)}`;
            conflict(constraint.path, message, [facetSource(prior, "itemSchema").contributorName, contributor.name], issue(prior, constraint, contributor, "itemSchema", "Array item definition", "Structure", itemSchemaLabel(prior.itemSchema, prior.itemType), itemSchemaLabel(constraint.itemSchema, constraint.itemType), message));
        }
        else {
            next.itemSchema = clone(constraint.itemSchema);
            next.facetSources = { ...next.facetSources, itemSchema: source };
        }
    }
    if (constraint.protectedFacets)
        next.protectedFacets = clone(constraint.protectedFacets);
    if (constraint.allowedValues && !(parallelPeer && prior.expectedValue !== undefined)) {
        if (prior.allowedValues) {
            const orderedPageGroups = prior.origins.at(-1)?.scope === "Page Group" && contributor.scope === "Page Group", changed = !same(prior.allowedValues, constraint.allowedValues);
            if (parallelPeer) {
                const intersection = prior.allowedValues.filter((value) => constraint.allowedValues.some((candidate) => same(value, candidate)));
                next.allowedValues = clone((intersection.length ? intersection : canonicalUnion(prior.allowedValues, constraint.allowedValues)).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))));
            }
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
                if (narrowed.length !== constraint.allowedValues.length) {
                    const message = `${String(constraint.allowedValues.find((value) => !prior.allowedValues.some((base) => same(base, value))))} is outside the base allowed universe`, origin = facetSource(prior, "allowedValues");
                    conflict(constraint.path, message, [origin.contributorName, contributor.name], issue(prior, constraint, contributor, "allowedValues", "Allowed values", "Definition", prior.allowedValues, constraint.allowedValues, message));
                }
                else
                    next.allowedValues = clone(narrowed);
            }
        }
        else
            next.allowedValues = clone(constraint.allowedValues);
        next.facetSources = { ...next.facetSources, allowedValues: source };
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
        const message = `${sourceContributor} protects this definition from change`;
        conflict(constraint.path, message, [sourceContributor, contributor.name], { ...issue(prior, constraint, contributor, "presence", "Presence", "Definition", prior.presence, constraint.presence, message), contributorIds: [sourceOrigin.contributorId, contributor.id], sourceContributor, sourceContributorId: sourceOrigin.contributorId });
    }
    else if (constraint.presence) {
        next.presence = constraint.presence;
        next.facetSources = { ...next.facetSources, presence: source };
    }
    if (constraint.patterns) {
        const replaced = replacedRuleIds(constraint), priorPatternRules = rulesFor(prior, "pattern"), retainedRulePatterns = priorPatternRules.filter((rule) => !replaced.has(String(rule.id ?? ""))).flatMap((rule) => typeof rule.pattern === "string" ? [rule.pattern] : []), removedRulePatterns = new Set(priorPatternRules.filter((rule) => replaced.has(String(rule.id ?? ""))).flatMap((rule) => typeof rule.pattern === "string" ? [rule.pattern] : [])), retainedPatterns = (prior.patterns ?? []).filter((pattern) => !removedRulePatterns.has(pattern) || retainedRulePatterns.includes(pattern)), replacedAny = retainedPatterns.length !== (prior.patterns ?? []).length, priorDomains = new Set(retainedPatterns.map(simplePatternDomain).filter(Boolean)), localDomains = new Set(constraint.patterns.map(simplePatternDomain).filter(Boolean)), pair = conflictingRulePair(prior, constraint, "pattern");
        if (!replacedAny && priorDomains.size && localDomains.size && ![...priorDomains].some((value) => localDomains.has(value))) {
            const message = "the rules cannot both match", origin = facetSource(prior, "patterns");
            conflict(constraint.path, message, [origin.contributorName, contributor.name], { ...issue(prior, constraint, contributor, "patterns", "Pattern rule", "Rules", prior.patterns, constraint.patterns, message), ...ruleDetails(prior, pair) });
        }
        next.patterns = replacedAny ? [...retainedPatterns, ...clone(constraint.patterns)] : parallelPeer ? canonicalUnion(prior.patterns ?? [], constraint.patterns) : [...(prior.patterns ?? []), ...constraint.patterns];
        next.facetSources = { ...next.facetSources, patterns: source };
    }
    if (constraint.minimum !== undefined)
        next.minimum = prior.minimum === undefined ? constraint.minimum : Math.max(prior.minimum, constraint.minimum);
    if (constraint.maximum !== undefined)
        next.maximum = prior.maximum === undefined ? constraint.maximum : Math.min(prior.maximum, constraint.maximum);
    if (constraint.minimum !== undefined || constraint.maximum !== undefined) {
        const crossed = constraint.minimum !== undefined && prior.maximum !== undefined || constraint.maximum !== undefined && prior.minimum !== undefined;
        if (crossed && next.minimum !== undefined && next.maximum !== undefined && next.minimum > next.maximum) {
            const message = "the ranges do not overlap", origin = facetSource(prior, "range");
            conflict(constraint.path, message, [origin.contributorName, contributor.name], { ...issue(prior, constraint, contributor, "range", "Range rule", "Rules", { minimum: prior.minimum, maximum: prior.maximum }, { minimum: constraint.minimum, maximum: constraint.maximum }, message), ...ruleDetails(prior, conflictingRulePair(prior, constraint, "range")) });
        }
        next.facetSources = { ...next.facetSources, range: source };
    }
    if (constraint.minItems !== undefined)
        next.minItems = prior.minItems === undefined ? constraint.minItems : Math.max(prior.minItems, constraint.minItems);
    if (constraint.maxItems !== undefined)
        next.maxItems = prior.maxItems === undefined ? constraint.maxItems : Math.min(prior.maxItems, constraint.maxItems);
    if (constraint.minItems !== undefined || constraint.maxItems !== undefined) {
        const crossed = constraint.minItems !== undefined && prior.maxItems !== undefined || constraint.maxItems !== undefined && prior.minItems !== undefined;
        if (crossed && next.minItems !== undefined && next.maxItems !== undefined && next.minItems > next.maxItems) {
            const message = "the item counts do not overlap", origin = facetSource(prior, "cardinality");
            conflict(constraint.path, message, [origin.contributorName, contributor.name], { ...issue(prior, constraint, contributor, "cardinality", "Cardinality rule", "Rules", { minItems: prior.minItems, maxItems: prior.maxItems }, { minItems: constraint.minItems, maxItems: constraint.maxItems }, message), ...ruleDetails(prior, conflictingRulePair(prior, constraint, "cardinality")) });
        }
        next.facetSources = { ...next.facetSources, cardinality: source };
    }
    if (constraint.rules) {
        const replaced = replacedRuleIds(constraint), priorRules = (prior.rules ?? []).filter((rule) => !replaced.has(String(rule.id ?? "")));
        next.rules = parallelPeer ? canonicalUnion(priorRules, constraint.rules) : [...priorRules, ...constraint.rules.map(clone)];
    }
    if (constraint.reusableRules)
        next.reusableRules = parallelPeer ? canonicalUnion(prior.reusableRules ?? [], constraint.reusableRules) : [...(prior.reusableRules ?? []), ...constraint.reusableRules.map(clone)];
    if (!parallelPair && constraint.expectedValue !== undefined) {
        if (prior.expectedValue !== undefined && !same(prior.expectedValue, constraint.expectedValue)) {
            const explicit = Boolean(prior.definitionId && constraint.overrideReferences?.includes(prior.definitionId));
            if (prior.enforcement === "invariant" && !explicit) {
                const message = `${prior.expectedContributor ?? prior.origins.at(-1).contributorName} keeps ${String(prior.expectedValue)} fixed`, origin = facetSource(prior, "expectedValue");
                if (origin.contributorId !== contributor.id)
                    conflict(constraint.path, message, [origin.contributorName, contributor.name], issue(prior, constraint, contributor, "expectedValue", "Expected value", "Definition", prior.expectedValue, constraint.expectedValue, message));
            }
            else
                next.superseded.push({ contributorId: prior.origins.at(-1).contributorId, contributorName: prior.expectedContributor ?? prior.origins.at(-1).contributorName, value: clone(prior.expectedValue) });
        }
        delete next.allowedValues;
        delete next.allowedValueIds;
        delete next.allowedValueProvenance;
        next.expectedValue = clone(constraint.expectedValue);
        next.facetSources = { ...next.facetSources, expectedValue: source };
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