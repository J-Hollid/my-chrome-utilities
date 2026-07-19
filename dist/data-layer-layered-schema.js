const clone = (value) => structuredClone(value);
const included = (target, context) => !target || target === "all" || target === context.eventRole || target === context.eventId || target === context.occurrenceId;
const origin = (contributor) => ({ contributorId: contributor.id, contributorName: contributor.name, scope: contributor.scope });
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export function compileLayeredSchema(contributors, context) {
    const properties = {}, conflicts = [], provenance = contributors.map(origin), exclusions = [];
    const conflict = (path, message, names) => conflicts.push({ path, message, contributors: names });
    for (const contributor of contributors)
        for (const constraint of contributor.constraints) {
            if (!included(constraint.target, context)) {
                exclusions.push({ contributorId: contributor.id, contributorName: contributor.name, path: constraint.path, target: constraint.target ?? "all" });
                continue;
            }
            const prior = properties[constraint.path], source = origin(contributor);
            if (!prior) {
                properties[constraint.path] = { ...clone(constraint), origins: [source], superseded: [], ...(constraint.expectedValue !== undefined ? { expectedContributor: contributor.name } : {}) };
                continue;
            }
            const next = { ...prior, origins: [...prior.origins, source], superseded: [...prior.superseded] };
            if (constraint.type && prior.type && constraint.type !== prior.type)
                conflict(constraint.path, "type cannot change", [prior.origins.at(-1).contributorName, contributor.name]);
            else if (constraint.type)
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
            if (constraint.expectedValue !== undefined) {
                if (prior.expectedValue !== undefined && !same(prior.expectedValue, constraint.expectedValue)) {
                    if (prior.enforcement === "invariant")
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
export function validateLayeredObservation(target, payload) { const issues = Object.entries(target.compiled.properties).flatMap(([path, property]) => property.expectedValue !== undefined && !same(valueAt(payload, path), property.expectedValue) ? [{ path, code: "EXPECTED_VALUE", severity: "error", expected: clone(property.expectedValue), actual: clone(valueAt(payload, path)), provenance: property.expectedContributor ?? property.origins.at(-1)?.contributorName ?? target.targetName }] : []); return { selectedTargetId: target.targetId, selectedTargetName: target.targetName, effectiveSchemaRevision: target.revision, issues, provenance: target.compiled.provenance }; }
export function exportLayeredSchema(input) { const rows = Object.entries(input.compiled.properties).map(([path, property]) => `${path}: ${property.expectedValue !== undefined ? `equals ${String(property.expectedValue)}` : property.type ?? "constraint"} (${property.origins.map(({ contributorName }) => contributorName).join(" → ")})`); return [`${input.targetName} · ${input.pageName} · ${input.eventName}`, ...rows, input.activation === "documentation-only" ? "Documentation only — not automatically validated" : `Activation: ${input.activation}`].join("\n"); }
//# sourceMappingURL=data-layer-layered-schema.js.map