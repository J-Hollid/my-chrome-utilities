import { compileLayeredSchema, validateLayeredObservation } from "./data-layer-layered-schema.js";
import { layeredContributorPath, layeredContributorsForPath } from "./data-layer-layered-schema-project.js";
const scalar = (value) => typeof value === "string" ? value : JSON.stringify(value);
export function pageGroupConditionText(condition) {
    if (!condition)
        return "Always";
    if (condition.kind === "predicate") {
        const expected = condition.values?.join(", ") ?? condition.pattern ?? condition.value;
        return [condition.field, condition.operator, expected === undefined ? undefined : scalar(expected)].filter(Boolean).join(" ");
    }
    const joiner = condition.kind === "all" ? " and " : condition.kind === "any" ? " or " : " nor ";
    const body = condition.conditions.map(pageGroupConditionText).join(joiner);
    return condition.kind === "not" ? `not (${body})` : `(${body})`;
}
const pageFor = (state, pageId) => {
    const page = state.project.collections.pages.find(({ id }) => id === pageId);
    if (!page)
        throw new Error(`Page ${pageId} is unavailable.`);
    return page;
};
export function pageGroupStructuralSchema(state, pageId, selectedApplicabilitySetIds) {
    const page = pageFor(state, pageId);
    const contributors = layeredContributorsForPath(state, layeredContributorPath(state, page, "Page"));
    const unconditionalContributors = contributors.filter(({ applicabilityConditional }) => !applicabilityConditional);
    const memberships = contributors.filter(({ scope }) => scope === "Page Group").map((contributor, order) => ({
        groupId: contributor.id,
        groupName: contributor.name,
        order,
        ...(contributor.applicabilitySetId ? { applicabilitySetId: contributor.applicabilitySetId } : {}),
        applicabilitySetName: contributor.applicabilitySetName ?? "Always",
        condition: contributor.applicabilityCondition ? pageGroupConditionText(contributor.applicabilityCondition) : "Always",
        contributions: contributor.constraints.map((constraint) => structuredClone(constraint)),
    }));
    const referencedSetIds = [...new Set(memberships.flatMap(({ applicabilitySetId }) => applicabilitySetId ? [applicabilitySetId] : []))];
    const selected = new Set(selectedApplicabilitySetIds ?? referencedSetIds);
    const applicabilityPreviews = referencedSetIds.map((applicabilitySetId) => {
        const membership = memberships.find((candidate) => candidate.applicabilitySetId === applicabilitySetId);
        return { applicabilitySetId, applicabilitySetName: membership.applicabilitySetName, condition: membership.condition, checked: selected.has(applicabilitySetId) };
    });
    const includedMemberships = memberships.filter(({ applicabilitySetId }) => !applicabilitySetId || selected.has(applicabilitySetId));
    const excludedMemberships = memberships.filter(({ applicabilitySetId }) => Boolean(applicabilitySetId && !selected.has(applicabilitySetId)));
    const participatingGroupIds = new Set(includedMemberships.map(({ groupId }) => groupId));
    const participatingContributors = contributors.filter(({ scope, id }) => scope !== "Page Group" || participatingGroupIds.has(id));
    const conditionalBranches = memberships.filter((membership) => Boolean(membership.applicabilitySetId)).map((membership) => ({
        groupId: membership.groupId,
        groupName: membership.groupName,
        order: membership.order,
        applicabilitySetId: membership.applicabilitySetId,
        applicabilitySetName: membership.applicabilitySetName,
        condition: membership.condition,
        properties: Object.fromEntries(membership.contributions.map((constraint) => [constraint.path, structuredClone(constraint)])),
    }));
    return {
        mode: "complete-page-specification",
        pageId: page.id,
        pageName: page.name,
        memberships,
        applicabilityPreviews,
        includedMemberships,
        excludedMemberships,
        compiled: compileLayeredSchema(participatingContributors, { eventId: String(page.eventName ?? page.id), eventRole: "context" }),
        unconditional: compileLayeredSchema(unconditionalContributors, { eventId: String(page.eventName ?? page.id), eventRole: "context" }),
        conditionalBranches,
    };
}
const fixturePayload = (fixture) => {
    if (fixture.payload && typeof fixture.payload === "object" && !Array.isArray(fixture.payload))
        return structuredClone(fixture.payload);
    const observations = fixture.observations ?? [];
    const observed = observations.at(-1);
    if (observed?.payload && typeof observed.payload === "object" && !Array.isArray(observed.payload))
        return structuredClone(observed.payload);
    return structuredClone(observed ?? {});
};
export function evaluatePageGroupFixture(state, fixtureId) {
    const fixture = state.project.collections.fixtures.find(({ id }) => id === fixtureId);
    if (!fixture)
        throw new Error(`Fixture ${fixtureId} is unavailable.`);
    const pageId = String(fixture.pageId ?? fixture.context?.pageId ?? "");
    const page = pageFor(state, pageId), payload = fixturePayload(fixture);
    const contributors = layeredContributorsForPath(state, layeredContributorPath(state, page, "Page"), payload);
    const compiled = compileLayeredSchema(contributors, { eventId: String(page.eventName ?? page.id), eventRole: "context" });
    const groups = contributors.filter(({ scope }) => scope === "Page Group");
    const distinctSets = (active) => [...new Set(groups.filter((group) => active ? group.active !== false : group.active === false).flatMap(({ applicabilitySetName }) => applicabilitySetName ? [applicabilitySetName] : []))];
    return {
        mode: "evaluated-example",
        fixtureId: fixture.id,
        fixtureName: fixture.name,
        pageId: page.id,
        pageName: page.name,
        payload,
        includedStack: groups.filter(({ active }) => active !== false).map(({ name }) => name),
        inactiveGroups: groups.filter(({ active }) => active === false).map(({ name }) => name),
        matchedApplicabilitySets: distinctSets(true),
        unmatchedApplicabilitySets: distinctSets(false),
        compiled,
        validation: validateLayeredObservation({ targetId: page.id, targetName: page.name, revision: Number(page.revision ?? 1), compiled }, payload),
    };
}
const constraintText = (constraint) => {
    const facets = [
        constraint.type ? `type ${constraint.type}` : undefined,
        constraint.allowedValues ? `allowed ${JSON.stringify(constraint.allowedValues)}` : undefined,
        constraint.expectedValue !== undefined ? `equals ${scalar(constraint.expectedValue)}` : undefined,
        constraint.presence ? `presence ${constraint.presence}` : undefined,
    ].filter(Boolean).join(" · ");
    return `${constraint.path}: ${facets || "constraint"}`;
};
export function documentPageGroupStructure(input) {
    if (input.mode === "evaluated-example") {
        return [
            `Evaluated example: ${input.fixtureName} · Page ${input.pageName}`,
            `Matched Applicability Sets: ${input.matchedApplicabilitySets.join(", ") || "none"}`,
            `Not matched Applicability Sets: ${input.unmatchedApplicabilitySets.join(", ") || "none"}`,
            `Applicable Page Groups: ${input.includedStack.join(", ") || "none"}`,
            `Inactive Page Groups: ${input.inactiveGroups.join(", ") || "none"}`,
            ...Object.values(input.compiled.properties).map(constraintText),
        ].join("\n");
    }
    return [
        `Complete Page specification: ${input.pageName}`,
        ...input.memberships.map(({ groupName, applicabilitySetId, applicabilitySetName, condition }) => `${groupName} · ${applicabilitySetId ? `Applicability Set ${applicabilitySetName} · ${condition}` : "Always included"}`),
        ...Object.values(input.compiled.properties).map((property) => `${constraintText(property)} · provenance ${property.origins.map(({ contributorName }) => contributorName).join(" → ")}${property.superseded.length ? ` · superseded ${property.superseded.map(({ contributorName, value }) => `${contributorName} ${scalar(value)}`).join(", ")}` : ""}`),
    ].join("\n");
}
//# sourceMappingURL=data-layer-page-group-structural-authoring.js.map