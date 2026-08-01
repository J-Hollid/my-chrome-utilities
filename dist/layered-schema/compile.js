import { branch, clone, constraintWithStructuredRules, included, origin, parallelMismatch, same } from "./compile-context.js";
import { mergeLayeredProperty } from "./compile-merge.js";
import { constraintWithPeerRules, peerConstraintForCompile, peerMismatch, peerSetMismatch } from "./peer-constraints.js";
const peerRule = (constraint, kind) => (constraint.rules ?? []).find((rule) => String(rule.kind ?? "") === kind);
const valueMatchesType = (value, type) => type === "array" ? Array.isArray(value) : type === "null" ? value === null : type === "integer" ? Number.isInteger(value) : type === "object" ? Boolean(value) && typeof value === "object" && !Array.isArray(value) : typeof value === type;
const valueMatchesItem = (value, schema) => (!schema.type || valueMatchesType(value, schema.type)) && (!schema.allowedValues?.length || schema.allowedValues.some((candidate) => same(candidate, value))) && (!schema.items || Array.isArray(value) && value.every((item) => valueMatchesItem(item, schema.items)));
const ownsFacet = (constraint, facet) => Object.hasOwn(constraint, facet) || (facet === "minimum" && Object.hasOwn(constraint, "maximum")) || (facet === "minItems" && Object.hasOwn(constraint, "maxItems"));
const matchesIssue = (resolution, issue, constraint) => { const sourceFacet = issue.details.sourceFacet ?? issue.keys[0], localFacet = issue.details.localFacet ?? issue.keys[0], sourceId = issue.details.sourceContributorId, localId = issue.details.localContributorId; return ownsFacet(constraint, resolution.selectedFacet) && ((resolution.selectedContributorId === sourceId && resolution.selectedFacet === sourceFacet && resolution.rejectedContributorId === localId && resolution.rejectedFacet === localFacet) || (resolution.selectedContributorId === localId && resolution.selectedFacet === localFacet && resolution.rejectedContributorId === sourceId && resolution.rejectedFacet === sourceFacet)); };
const withoutFacet = (constraint, facet) => { const next = clone(constraint), ruleKind = facet === "patterns" ? "pattern" : facet === "minimum" || facet === "maximum" ? "range" : facet === "minItems" || facet === "maxItems" ? "cardinality" : facet === "expectedValue" ? "value" : undefined; delete next[facet]; if (facet === "allowedValues") {
    delete next.allowedValueIds;
    delete next.allowedValueProvenance;
} if (facet === "minimum")
    delete next.maximum; if (facet === "maximum")
    delete next.minimum; if (facet === "minItems")
    delete next.maxItems; if (facet === "maxItems")
    delete next.minItems; if (facet === "itemType")
    delete next.itemSchema; if (ruleKind && next.rules) {
    next.rules = next.rules.filter((rule) => String(rule.kind ?? "") !== ruleKind);
    if (!next.rules.length)
        delete next.rules;
} return next; };
const peerFacetIssues = (left, right) => {
    const issues = [], details = (facet, section, sourceValue, localValue, message, kind, sourceFacet, localFacet) => { const sourceRule = kind ? peerRule(left.constraint, kind) : undefined, localRule = kind ? peerRule(right.constraint, kind) : undefined; return { facet, section, sourceContributor: left.contributor.name, sourceContributorId: left.contributor.id, sourceValue: clone(sourceValue), ...(sourceFacet ? { sourceFacet } : {}), localContributor: right.contributor.name, localContributorId: right.contributor.id, localValue: clone(localValue), ...(localFacet ? { localFacet } : {}), contributorIds: [left.contributor.id, right.contributor.id], message, ...(sourceRule?.id ? { sourceRuleId: String(sourceRule.id) } : {}), ...(sourceRule?.enforcement === "invariant" ? { sourceRuleInvariant: true } : {}), ...(localRule?.id ? { localRuleId: String(localRule.id) } : {}) }; };
    const leftConstraint = left.constraint, rightConstraint = right.constraint;
    if (leftConstraint.type && rightConstraint.type && leftConstraint.type !== rightConstraint.type)
        issues.push({ keys: ["type"], details: details("Type", "Definition", leftConstraint.type, rightConstraint.type, "the parallel definitions use incompatible Types") });
    if (leftConstraint.presence && rightConstraint.presence && new Set([leftConstraint.presence, rightConstraint.presence]).has("required") && new Set([leftConstraint.presence, rightConstraint.presence]).has("forbidden"))
        issues.push({ keys: ["presence"], details: details("Presence", "Definition", leftConstraint.presence, rightConstraint.presence, "the parallel definitions require and exclude the same property") });
    if (leftConstraint.allowedValues?.length && rightConstraint.allowedValues?.length && !leftConstraint.allowedValues.some((value) => rightConstraint.allowedValues.some((candidate) => same(value, candidate))))
        issues.push({ keys: ["allowedValues"], details: details("Allowed values", "Definition", leftConstraint.allowedValues, rightConstraint.allowedValues, "the available choices do not overlap") });
    if (leftConstraint.expectedValue !== undefined && rightConstraint.expectedValue !== undefined && !same(leftConstraint.expectedValue, rightConstraint.expectedValue))
        issues.push({ keys: ["expectedValue"], details: details("Expected value", "Definition", leftConstraint.expectedValue, rightConstraint.expectedValue, "the parallel expected values differ") });
    if (leftConstraint.minimum !== undefined && rightConstraint.maximum !== undefined && leftConstraint.minimum > rightConstraint.maximum || rightConstraint.minimum !== undefined && leftConstraint.maximum !== undefined && rightConstraint.minimum > leftConstraint.maximum)
        issues.push({ keys: ["minimum", "maximum"], details: details("Range rule", "Rules", { minimum: leftConstraint.minimum, maximum: leftConstraint.maximum }, { minimum: rightConstraint.minimum, maximum: rightConstraint.maximum }, "the ranges do not overlap", "range", leftConstraint.minimum !== undefined ? "minimum" : "maximum", rightConstraint.minimum !== undefined ? "minimum" : "maximum") });
    if (leftConstraint.minItems !== undefined && rightConstraint.maxItems !== undefined && leftConstraint.minItems > rightConstraint.maxItems || rightConstraint.minItems !== undefined && leftConstraint.maxItems !== undefined && rightConstraint.minItems > leftConstraint.maxItems)
        issues.push({ keys: ["minItems", "maxItems"], details: details("Cardinality rule", "Rules", { minItems: leftConstraint.minItems, maxItems: leftConstraint.maxItems }, { minItems: rightConstraint.minItems, maxItems: rightConstraint.maxItems }, "the item counts do not overlap", "cardinality", leftConstraint.minItems !== undefined ? "minItems" : "maxItems", rightConstraint.minItems !== undefined ? "minItems" : "maxItems") });
    if (leftConstraint.itemSchema && rightConstraint.itemSchema && !same(leftConstraint.itemSchema, rightConstraint.itemSchema))
        issues.push({ keys: ["itemSchema"], details: details("Array item definition", "Structure", leftConstraint.itemSchema, rightConstraint.itemSchema, "the parallel item definitions are incompatible") });
    const expectedAgainst = (facetEntry, expectedEntry, facetOnLeft) => {
        const facetConstraint = facetEntry.constraint, expected = expectedEntry.constraint.expectedValue;
        if (expected === undefined)
            return;
        const add = (keys, facet, section, facetValue, message, kind) => { const sourceValue = facetOnLeft ? facetValue : expected, localValue = facetOnLeft ? expected : facetValue, sourceFacet = facetOnLeft ? keys[0] : "expectedValue", localFacet = facetOnLeft ? "expectedValue" : keys[0]; issues.push({ keys: [...keys, "expectedValue"], details: details(facet, section, sourceValue, localValue, message, kind, sourceFacet, localFacet) }); };
        if (facetConstraint.allowedValues?.length && !facetConstraint.allowedValues.some((value) => same(value, expected)))
            add(["allowedValues"], "Expected value", "Definition", facetConstraint.allowedValues, "the expected value is outside the available choices");
        if (facetConstraint.type && !valueMatchesType(expected, facetConstraint.type))
            add(["type"], "Type", "Definition", facetConstraint.type, "the expected value does not match the parallel Type");
        if (facetConstraint.presence === "forbidden")
            add(["presence"], "Presence", "Definition", facetConstraint.presence, "the parallel definition forbids the expected value");
        if (facetConstraint.patterns?.length && facetConstraint.patterns.some((pattern) => { try {
            return !new RegExp(pattern).test(String(expected));
        }
        catch {
            return true;
        } }))
            add(["patterns"], "Pattern rule", "Rules", facetConstraint.patterns, "the expected value does not match the parallel Pattern rule", "pattern");
        if ((facetConstraint.minimum !== undefined && (typeof expected !== "number" || expected < facetConstraint.minimum)) || (facetConstraint.maximum !== undefined && (typeof expected !== "number" || expected > facetConstraint.maximum)))
            add(facetConstraint.minimum !== undefined ? ["minimum", "maximum"] : ["maximum", "minimum"], "Range rule", "Rules", { minimum: facetConstraint.minimum, maximum: facetConstraint.maximum }, "the expected value is outside the parallel Range rule", "range");
        if ((facetConstraint.minItems !== undefined && (!Array.isArray(expected) || expected.length < facetConstraint.minItems)) || (facetConstraint.maxItems !== undefined && (!Array.isArray(expected) || expected.length > facetConstraint.maxItems)))
            add(facetConstraint.minItems !== undefined ? ["minItems", "maxItems"] : ["maxItems", "minItems"], "Cardinality rule", "Rules", { minItems: facetConstraint.minItems, maxItems: facetConstraint.maxItems }, "the expected value is outside the parallel Cardinality rule", "cardinality");
        if (facetConstraint.itemType && (!Array.isArray(expected) || expected.some((value) => !valueMatchesType(value, facetConstraint.itemType))))
            add(["itemType"], "Array item definition", "Structure", facetConstraint.itemType, "the expected items do not match the parallel item Type");
        if (facetConstraint.itemSchema && (!Array.isArray(expected) || expected.some((value) => !valueMatchesItem(value, facetConstraint.itemSchema))))
            add(["itemSchema"], "Array item definition", "Structure", facetConstraint.itemSchema, "the expected items do not match the parallel item definition");
    };
    expectedAgainst(left, right, true);
    expectedAgainst(right, left, false);
    return issues;
};
export function compileLayeredSchema(contributors, context) {
    const selected = contributors.filter(({ active }) => active !== false), peerQueues = new Map();
    for (const contributor of selected)
        if (contributor.peerGroup) {
            const queue = peerQueues.get(contributor.peerGroup) ?? [];
            queue.push(contributor);
            peerQueues.set(contributor.peerGroup, queue);
        }
    for (const queue of peerQueues.values())
        queue.sort((left, right) => left.id.localeCompare(right.id));
    const activeContributors = selected.map((contributor) => contributor.peerGroup ? peerQueues.get(contributor.peerGroup).shift() : contributor), properties = {}, conflicts = activeContributors.flatMap((contributor) => (contributor.inheritanceConflicts ?? []).map(({ path, sourceRuleId, dependencyPropertyId }) => ({ path, message: `the rule needs the excluded property ${dependencyPropertyId}`, contributors: [contributor.name], contributorIds: [contributor.id], facet: "Conditional rule dependency", section: "Rules", sourceContributor: contributor.name, sourceContributorId: contributor.id, sourceValue: `requires ${dependencyPropertyId}`, sourceRuleId, localContributor: contributor.name, localContributorId: contributor.id, localValue: `exclude ${dependencyPropertyId}`, localRuleId: sourceRuleId }))), provenance = activeContributors.map(origin), exclusions = contributors.filter(({ active }) => active === false).flatMap((contributor) => contributor.constraints.length ? contributor.constraints.map(({ path }) => ({ contributorId: contributor.id, contributorName: contributor.name, path, target: contributor.exclusionReason ?? "applicability did not match" })) : [{ contributorId: contributor.id, contributorName: contributor.name, path: "/", target: contributor.exclusionReason ?? "applicability did not match" }]);
    const conflict = (path, message, names, details = {}) => conflicts.push({ path, message, contributors: names, ...details });
    const active = activeContributors.flatMap((contributor) => contributor.constraints.map(constraintWithStructuredRules).filter((constraint) => included(constraint.target, context)).map((constraint) => ({ contributor, constraint }))), blockedParallel = new Set(), blockedPeers = new Set(), resolvedParallel = new Set(), acceptedPeerResolutions = [], conflictingPolicyGroups = new Set();
    const peersByGroup = new Map();
    for (const contributor of activeContributors)
        if (contributor.peerGroup) {
            const peers = peersByGroup.get(contributor.peerGroup) ?? [];
            peers.push(contributor);
            peersByGroup.set(contributor.peerGroup, peers);
        }
    for (const [peerGroup, peers] of peersByGroup) {
        const policies = new Set(peers.flatMap(({ onlyDefinedFields }) => onlyDefinedFields === undefined ? [] : [onlyDefinedFields]));
        if (policies.size > 1)
            conflictingPolicyGroups.add(peerGroup);
    }
    const peerEntries = new Map();
    for (const entry of active)
        if (entry.contributor.peerGroup) {
            const key = `${entry.contributor.peerGroup}\u0000${entry.constraint.path}`, entries = peerEntries.get(key) ?? [];
            entries.push(entry);
            peerEntries.set(key, entries);
        }
    for (const [key, entries] of peerEntries) {
        const peerGroup = key.split("\u0000")[0], policyConflict = conflictingPolicyGroups.has(peerGroup), algebra = entries.map(({ contributor, constraint }) => ({ contributor, constraint: peerConstraintForCompile(constraint) }));
        let incompatible = policyConflict || peerSetMismatch(algebra.map(({ constraint }) => constraint));
        for (let left = 0; left < algebra.length; left += 1)
            for (let right = left + 1; right < algebra.length; right += 1)
                incompatible ||= peerMismatch(algebra[left].constraint, algebra[right].constraint);
        if (!incompatible)
            continue;
        const path = entries[0].constraint.path, names = policyConflict ? peersByGroup.get(peerGroup).map(({ name }) => name) : algebra.map(({ contributor }) => contributor.name), issues = policyConflict ? [] : algebra.flatMap((left, leftIndex) => algebra.slice(leftIndex + 1).flatMap((right) => peerFacetIssues(left, right))), downstream = active.filter(({ contributor, constraint }) => !contributor.peerGroup && constraint.path === path), unresolved = issues.filter((issue) => { for (const { constraint } of downstream)
            for (const resolution of constraint.peerFacetResolutions ?? [])
                if (matchesIssue(resolution, issue, constraint)) {
                    acceptedPeerResolutions.push({ ...resolution, path });
                    return false;
                } return true; });
        if (!policyConflict && issues.length && !unresolved.length)
            continue;
        blockedPeers.add(path);
        if (unresolved.length)
            for (const { details } of unresolved)
                conflict(path, details.message, [details.sourceContributor, details.localContributor], details);
        else
            conflict(path, "parallel Shared Profile peers conflict; add an explicit contextual resolution", [...new Set(names)]);
    }
    for (const peerGroup of conflictingPolicyGroups)
        if (![...peerEntries.keys()].some((key) => key.startsWith(`${peerGroup}\u0000`)))
            conflict("/", "parallel Shared Profile closed-field policies conflict; add an explicit contextual resolution", activeContributors.filter((contributor) => contributor.peerGroup === peerGroup).map(({ name }) => name));
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
    const contributorById = new Map(activeContributors.map((contributor) => [contributor.id, contributor]));
    for (const contributor of activeContributors)
        for (const rawConstraint of contributor.constraints) {
            let prepared = contributor.peerGroup ? constraintWithPeerRules(rawConstraint) : constraintWithStructuredRules(rawConstraint);
            for (const resolution of acceptedPeerResolutions)
                if (resolution.path === prepared.path && resolution.rejectedContributorId === contributor.id)
                    prepared = withoutFacet(prepared, resolution.rejectedFacet);
            const { peerFacetResolutions: discardedResolutions, ...constraint } = prepared;
            if (!included(constraint.target, context)) {
                exclusions.push({ contributorId: contributor.id, contributorName: contributor.name, path: constraint.path, target: constraint.target ?? "all" });
                continue;
            }
            if (blockedParallel.has(constraint.path) || blockedPeers.has(constraint.path))
                continue;
            const prior = properties[constraint.path], priorContributor = prior ? contributorById.get(prior.origins.at(-1).contributorId) : undefined, parallelPair = Boolean(prior && resolvedParallel.has(constraint.path) && new Set([branch(prior.origins.at(-1).scope), branch(contributor.scope)]).has("page") && new Set([branch(prior.origins.at(-1).scope), branch(contributor.scope)]).has("event")), parallelPeer = Boolean(priorContributor?.peerGroup && priorContributor.peerGroup === contributor.peerGroup), merged = mergeLayeredProperty(prior, constraint, contributor, parallelPair, parallelPeer, conflict);
            if (contributor.peerGroup)
                merged.peerContributions = [...(prior?.peerContributions ?? []), { contributorId: contributor.id, contributorName: contributor.name, constraint: clone(rawConstraint) }];
            else if (prior?.peerContributions?.length)
                merged.downstreamContributions = [...(prior.downstreamContributions ?? []), { contributorId: contributor.id, contributorName: contributor.name, scope: contributor.scope, ...(contributor.inheritanceRoutes?.length ? { inheritanceRoutes: [...contributor.inheritanceRoutes] } : {}), ...(parallelPair ? { parallelPair: true } : {}), constraint: clone(rawConstraint) }];
            properties[constraint.path] = merged;
        }
    const onlyDefinedFields = conflictingPolicyGroups.size ? undefined : [...activeContributors].reverse().find((contributor) => contributor.onlyDefinedFields !== undefined)?.onlyDefinedFields;
    return { status: conflicts.length ? "blocked" : "ready", properties, conflicts, provenance, exclusions, ...(onlyDefinedFields !== undefined ? { onlyDefinedFields } : {}) };
}
//# sourceMappingURL=compile.js.map