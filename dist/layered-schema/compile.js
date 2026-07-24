import { branch, constraintWithStructuredRules, included, origin, parallelMismatch } from "./compile-context.js";
import { mergeLayeredProperty } from "./compile-merge.js";
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
            const prior = properties[constraint.path], parallelPair = Boolean(prior && resolvedParallel.has(constraint.path) && new Set([branch(prior.origins.at(-1).scope), branch(contributor.scope)]).has("page") && new Set([branch(prior.origins.at(-1).scope), branch(contributor.scope)]).has("event"));
            properties[constraint.path] = mergeLayeredProperty(prior, constraint, contributor, parallelPair, conflict);
        }
    return { status: conflicts.length ? "blocked" : "ready", properties, conflicts, provenance, exclusions };
}
//# sourceMappingURL=compile.js.map