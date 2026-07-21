const clone = (value) => structuredClone(value);
const included = (target, context) => !target || target === "all" || target === context.eventRole || target === context.eventId || target === context.occurrenceId;
const origin = (contributor) => ({ contributorId: contributor.id, contributorName: contributor.name, scope: contributor.scope });
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const branch = (scope) => scope === "Event" ? "event" : scope === "Page Group" || scope === "Page" || scope === "Flow Page-instance" ? "page" : scope === "Event-occurrence" ? "occurrence" : "shared";
const parallelMismatch = (left, right) => Boolean(left.type && right.type && left.type !== right.type || left.expectedValue !== undefined && right.expectedValue !== undefined && !same(left.expectedValue, right.expectedValue) || left.presence === "required" && right.presence === "forbidden" || left.presence === "forbidden" && right.presence === "required");
const numericRuleValues = (rules, kind, field) => rules.filter((rule) => rule.kind === kind && typeof rule[field] === "number").map((rule) => rule[field]);
const constraintWithStructuredRules = (constraint) => {
    const rules = constraint.rules ?? [], patterns = [...new Set([...(constraint.patterns ?? []), ...rules.filter((rule) => rule.kind === "pattern" && typeof rule.pattern === "string").map((rule) => rule.pattern)])], minimums = [...(constraint.minimum === undefined ? [] : [constraint.minimum]), ...numericRuleValues(rules, "range", "minimum")], maximums = [...(constraint.maximum === undefined ? [] : [constraint.maximum]), ...numericRuleValues(rules, "range", "maximum")], minimumItems = [...(constraint.minItems === undefined ? [] : [constraint.minItems]), ...numericRuleValues(rules, "cardinality", "minItems")], maximumItems = [...(constraint.maxItems === undefined ? [] : [constraint.maxItems]), ...numericRuleValues(rules, "cardinality", "maxItems")];
    return { ...constraint, ...(patterns.length ? { patterns } : {}), ...(minimums.length ? { minimum: Math.max(...minimums) } : {}), ...(maximums.length ? { maximum: Math.min(...maximums) } : {}), ...(minimumItems.length ? { minItems: Math.max(...minimumItems) } : {}), ...(maximumItems.length ? { maxItems: Math.min(...maximumItems) } : {}) };
};
export function compileLayeredSchema(contributors, context) {
    const activeContributors = contributors.filter(({ active }) => active !== false), properties = {}, conflicts = [], provenance = activeContributors.map(origin), exclusions = contributors.filter(({ active }) => active === false).flatMap((contributor) => contributor.constraints.length ? contributor.constraints.map(({ path }) => ({ contributorId: contributor.id, contributorName: contributor.name, path, target: contributor.exclusionReason ?? "applicability did not match" })) : [{ contributorId: contributor.id, contributorName: contributor.name, path: "/", target: contributor.exclusionReason ?? "applicability did not match" }]);
    const conflict = (path, message, names) => conflicts.push({ path, message, contributors: names });
    const applicableGroups = activeContributors.filter(({ scope, applicabilityConditional }) => scope === "Page Group" && applicabilityConditional);
    if (applicableGroups.length > 1)
        conflict("/", "ambiguous Page Group applicability; membership order cannot select a winner", applicableGroups.map(({ name }) => name));
    const active = activeContributors.flatMap((contributor) => contributor.constraints.map(constraintWithStructuredRules).filter((constraint) => included(constraint.target, context)).map((constraint) => ({ contributor, constraint }))), blockedParallel = new Set(), resolvedParallel = new Set();
    for (const page of active.filter(({ contributor }) => branch(contributor.scope) === "page"))
        for (const event of active.filter(({ contributor }) => branch(contributor.scope) === "event")) {
            if (page.constraint.path !== event.constraint.path || !parallelMismatch(page.constraint, event.constraint))
                continue;
            const references = active.filter(({ contributor, constraint }) => branch(contributor.scope) === "occurrence" && constraint.path === page.constraint.path).flatMap(({ constraint }) => constraint.overrideReferences ?? []), pageId = page.constraint.definitionId, eventId = event.constraint.definitionId, resolved = Boolean(pageId && eventId && references.includes(pageId) && references.includes(eventId));
            if (resolved)
                resolvedParallel.add(page.constraint.path);
            else if (!blockedParallel.has(page.constraint.path)) {
                blockedParallel.add(page.constraint.path);
                conflict(page.constraint.path, "parallel Page and Event branches conflict; add an explicit contextual resolution", [page.contributor.name, event.contributor.name]);
            }
        }
    for (const contributor of activeContributors)
        for (const rawConstraint of contributor.constraints) {
            const constraint = constraintWithStructuredRules(rawConstraint);
            if (!included(constraint.target, context)) {
                exclusions.push({ contributorId: contributor.id, contributorName: contributor.name, path: constraint.path, target: constraint.target ?? "all" });
                continue;
            }
            if (blockedParallel.has(constraint.path))
                continue;
            const prior = properties[constraint.path], source = origin(contributor);
            if (!prior) {
                properties[constraint.path] = { ...clone(constraint), origins: [source], superseded: [], ...(constraint.expectedValue !== undefined ? { expectedContributor: contributor.name } : {}) };
                continue;
            }
            const next = { ...prior, origins: [...prior.origins, source], superseded: [...prior.superseded] };
            const parallelPair = resolvedParallel.has(constraint.path) && branch(prior.origins.at(-1).scope) !== branch(contributor.scope) && new Set([branch(prior.origins.at(-1).scope), branch(contributor.scope)]).has("page") && new Set([branch(prior.origins.at(-1).scope), branch(contributor.scope)]).has("event");
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
            }
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
            properties[constraint.path] = next;
        }
    return { status: conflicts.length ? "blocked" : "ready", properties, conflicts, provenance, exclusions };
}
const matches = (predicate, observation) => predicate.operator === "equals" ? same(observation[predicate.field], predicate.value) : new RegExp(String(predicate.value)).test(String(observation[predicate.field] ?? ""));
export function resolveLayeredTarget(targets, observation, options = {}) {
    if (options.manualTargetId) {
        const winner = targets.find(({ id, activation }) => id === options.manualTargetId && activation === "manual");
        return { ...(winner ? { selectionMode: "manual", winner } : {}), candidates: winner ? [{ id: winner.id, name: winner.name, matched: true, priority: winner.priority, reasons: [] }] : [], ties: [] };
    }
    const eligible = targets.filter(({ activation }) => activation === "automatic"), candidates = eligible.map((target) => { const reasons = target.applicability.filter((predicate) => !matches(predicate, observation)).map(({ name }) => `${name} did not match`); return { id: target.id, name: target.name, matched: reasons.length === 0, priority: target.priority, reasons }; }), matched = candidates.filter((candidate) => candidate.matched).sort((left, right) => right.priority - left.priority), highest = matched[0]?.priority, ties = matched.filter(({ priority }) => priority === highest).map(({ id }) => id), winner = ties.length === 1 ? eligible.find(({ id }) => id === ties[0]) : undefined;
    return { ...(winner ? { selectionMode: "automatic", winner } : {}), candidates, ties };
}
const valueAt = (payload, path) => path.split("/").filter(Boolean).reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, payload);
const typeMatches = (value, type) => type === "array" ? Array.isArray(value) : type === "null" ? value === null : type === "integer" ? Number.isInteger(value) : type === "object" ? Boolean(value) && typeof value === "object" && !Array.isArray(value) : typeof value === type;
function compiledConditionMatches(condition, payload, pathsByDefinition) { if (!condition)
    return true; const kind = String(condition.kind ?? ""); if (kind === "predicate") {
    const propertyId = String(condition.propertyId ?? ""), path = pathsByDefinition.get(propertyId), actual = path ? valueAt(payload, path) : undefined, operator = String(condition.operator ?? "Equals"), expected = condition.value;
    if (operator === "Equals")
        return same(actual, expected);
    if (operator === "Does not equal")
        return !same(actual, expected);
    if (operator === "Exists")
        return actual !== undefined;
    if (operator === "Does not exist")
        return actual === undefined;
    if (operator === "Starts with")
        return String(actual ?? "").startsWith(String(expected ?? ""));
    if (operator === "Contains")
        return String(actual ?? "").includes(String(expected ?? ""));
    if (operator === "Matches pattern")
        try {
            return new RegExp(String(expected ?? "")).test(String(actual ?? ""));
        }
        catch {
            return false;
        }
    if (operator === "Greater than")
        return Number(actual) > Number(expected);
    if (operator === "At least")
        return Number(actual) >= Number(expected);
    if (operator === "Less than")
        return Number(actual) < Number(expected);
    if (operator === "At most")
        return Number(actual) <= Number(expected);
    return false;
} const children = condition.children ?? []; if (kind === "all")
    return children.every((child) => compiledConditionMatches(child, payload, pathsByDefinition)); if (kind === "any")
    return children.some((child) => compiledConditionMatches(child, payload, pathsByDefinition)); if (kind === "not")
    return !children.some((child) => compiledConditionMatches(child, payload, pathsByDefinition)); return true; }
export function validateLayeredObservation(target, payload) { const issues = [], pathsByDefinition = new Map(Object.entries(target.compiled.properties).flatMap(([path, property]) => property.definitionId ? [[property.definitionId, path]] : [])); for (const [path, property] of Object.entries(target.compiled.properties)) {
    const actual = valueAt(payload, path), provenance = property.expectedContributor ?? property.origins.at(-1)?.contributorName ?? target.targetName, add = (code, expected) => issues.push({ path, code, severity: "error", expected: clone(expected), actual: clone(actual), provenance }), condition = compiledConditionMatches(property.condition, payload, pathsByDefinition);
    if (property.presence === "required" && condition && actual === undefined) {
        add("REQUIRED", "present");
        continue;
    }
    if (property.presence === "forbidden" && condition && actual !== undefined) {
        add("FORBIDDEN", "absent");
        continue;
    }
    if (actual === undefined)
        continue;
    if (property.type && !typeMatches(actual, property.type))
        add("TYPE", property.type);
    if (property.allowedValues && !property.allowedValues.some((candidate) => same(candidate, actual)))
        add("ALLOWED_VALUE", property.allowedValues);
    if (property.patterns && !property.patterns.every((pattern) => new RegExp(pattern).test(String(actual))))
        add("PATTERN", property.patterns);
    if (property.minimum !== undefined && typeof actual === "number" && actual < property.minimum)
        add("MINIMUM", property.minimum);
    if (property.maximum !== undefined && typeof actual === "number" && actual > property.maximum)
        add("MAXIMUM", property.maximum);
    if (property.minItems !== undefined && Array.isArray(actual) && actual.length < property.minItems)
        add("MIN_ITEMS", property.minItems);
    if (property.maxItems !== undefined && Array.isArray(actual) && actual.length > property.maxItems)
        add("MAX_ITEMS", property.maxItems);
    if (property.expectedValue !== undefined && !same(actual, property.expectedValue))
        add("EXPECTED_VALUE", property.expectedValue);
} return { selectedTargetId: target.targetId, selectedTargetName: target.targetName, effectiveSchemaRevision: target.revision, issues, provenance: target.compiled.provenance }; }
export function exportLayeredSchema(input) { const rows = Object.entries(input.compiled.properties).map(([path, property]) => { const definition = [property.type ? `type ${property.type}` : undefined, property.presence ? `presence ${property.presence}` : undefined, property.allowedValues ? `allowed ${JSON.stringify(property.allowedValues)}` : undefined, property.expectedValue !== undefined ? `equals ${String(property.expectedValue)}` : undefined, property.condition ? `condition ${JSON.stringify(property.condition)}` : undefined, property.rules?.length ? `rules ${JSON.stringify(property.rules)}` : undefined, property.documentation ? `documentation ${property.documentation}` : undefined, property.examples ? `examples ${JSON.stringify(property.examples)}` : undefined, property.overrideReferences?.length ? `explicit resolution ${property.overrideReferences.join(", ")}` : undefined].filter(Boolean).join(" · "), origins = property.origins.map(({ scope, contributorName }) => `${scope} ${contributorName}`).join(" → "); return `${path}: ${definition || "constraint"} · provenance ${origins}`; }); return [`${input.targetName} · ${input.pageName} · ${input.eventName}`, ...rows, input.activation === "documentation-only" ? "Documentation only — not automatically validated" : `Activation: ${input.activation}`].join("\n"); }
//# sourceMappingURL=data-layer-layered-schema.js.map