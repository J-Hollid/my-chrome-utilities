import { compileLayeredSchema, layeredContributorPath, layeredContributorsForPath, validateLayeredObservation } from "../utilities/data-layer/schemas.js";
import { storedGraph } from "../data-layer-flow-graph.js";
import { applicableExample, exampleEditHref, setAtPath } from "./example-values.js";
export function deriveFlowOccurrenceExample(project, flowId, occurrenceId) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId);
    if (!occurrence)
        return { status: "Blocked", payload: {}, formattedJson: "{}", provenance: {}, issues: [{ path: "/", code: "CONFLICT", message: "The Event occurrence is unavailable.", editHref: exampleEditHref(flowId, occurrenceId, "/") }] };
    const state = { project }, path = layeredContributorPath(state, occurrence, "Event-occurrence", flowId), contributors = layeredContributorsForPath(state, path), compiled = compileLayeredSchema(contributors, { eventId: String(occurrence.eventId ?? ""), eventRole: "interaction", occurrenceId }), payload = {}, provenance = {};
    for (const [propertyPath, property] of Object.entries(compiled.properties)) {
        if (property.presence === "forbidden")
            continue;
        let configured;
        if (property.expectedValue !== undefined)
            configured = { value: property.expectedValue, source: property.expectedContributor ?? property.origins.at(-1)?.contributorName ?? occurrence.name };
        else
            for (const contributor of [...contributors].reverse()) {
                const constraint = [...contributor.constraints].reverse().find((candidate) => candidate.path === propertyPath && applicableExample(candidate, occurrence, String(occurrence.eventId ?? ""), "interaction") && (candidate.examples?.length ?? 0) > 0);
                if (constraint) {
                    configured = { value: constraint.examples[0], source: contributor.scope === "Event-occurrence" && !/occurrence$/i.test(contributor.name) ? `${contributor.name} occurrence` : contributor.name };
                    break;
                }
            }
        if (configured !== undefined) {
            setAtPath(payload, propertyPath, configured.value);
            provenance[propertyPath] = configured.source;
        }
    }
    const edit = (propertyPath) => exampleEditHref(flowId, occurrenceId, propertyPath);
    if (compiled.status === "blocked") {
        const issues = compiled.conflicts.map(({ path: propertyPath, message }) => ({ path: propertyPath, code: "CONFLICT", message, editHref: edit(propertyPath) }));
        return { status: "Blocked", payload, formattedJson: JSON.stringify(payload, null, 2), provenance, issues };
    }
    const validation = validateLayeredObservation({ targetId: occurrenceId, targetName: occurrence.name, revision: Number(occurrence.canonicalSchema?.revision ?? 0), compiled }, payload), issues = validation.issues.map((issue) => ({ path: issue.path, code: issue.code === "REQUIRED" ? "REQUIRED_EXAMPLE" : issue.code, message: issue.code === "REQUIRED" ? "Required property has no configured example." : `${issue.code} example does not satisfy ${JSON.stringify(issue.expected)}.`, editHref: edit(issue.path) })), invalid = issues.some(({ code }) => code !== "REQUIRED_EXAMPLE"), incomplete = issues.some(({ code }) => code === "REQUIRED_EXAMPLE"), status = invalid ? "Invalid" : incomplete ? "Incomplete" : "Complete";
    return { status, payload, formattedJson: JSON.stringify(payload, null, 2), provenance, issues };
}
//# sourceMappingURL=occurrence-example-derive.js.map