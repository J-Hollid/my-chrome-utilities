function normalizedOperator(value) {
    return value?.replaceAll("_", "-").replaceAll(" ", "-").toLocaleLowerCase() ?? "";
}
function allowedValues(schema, pointer) {
    const rule = schema.attachedRules?.find((candidate) => candidate.propertyPath === pointer && normalizedOperator(candidate.operator) === "allowed-values");
    if (rule?.allowedValues)
        return structuredClone(rule.allowedValues);
    return rule?.parameters?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
}
export function expectedPropertyChoices(schema) {
    const required = new Set(schema.document.required ?? []);
    return Object.entries(schema.document.properties ?? {}).map(([property, definition]) => {
        const pointer = `/${property}`;
        const values = allowedValues(schema, pointer);
        return {
            property,
            pointer,
            required: required.has(property),
            type: definition.type ?? "value",
            constraint: values.length
                ? `one of ${values.map(String).join(" or ")}`
                : `${required.has(property) ? "required" : "optional"} ${definition.type ?? "value"}`,
            schemaValues: values,
        };
    });
}
export function expectedPropertyPresentation(property, response) {
    if (response.method === "generic") {
        const text = property.schemaValues.length
            ? `${property.property} is ${property.schemaValues.map(String).join(" OR ")}`
            : `${property.property} is ${property.constraint}`;
        return { text, source: "schema constraint" };
    }
    if (response.method === "schema-value" && !property.schemaValues.some((value) => Object.is(value, response.value))) {
        throw new Error(`${String(response.value)} is not a schema-provided value for ${property.property}.`);
    }
    return {
        text: `${property.property} is ${String(response.value)}`,
        source: response.method === "schema-value" ? "schema-provided value" : "operator custom response",
    };
}
export function missingEventActualPresentation(input) {
    return `No matching ${input.eventName} event was pushed or observed in ${input.sourceId} during ${input.pathname} from ${input.startedAt} to ${input.endedAt}.`;
}
function renumber(steps) {
    return steps.map((step, index) => {
        const plain = step.kind === "pathname" ? `Visit ${step.pathname}`
            : step.kind === "assertion" ? step.text?.replace(/^\d+\.\s*/, "") ?? "Expect event"
                : step.text?.replace(/^\d+\.\s*/, "") ?? "Manual step";
        return { ...step, text: `${index + 1}. ${plain}` };
    });
}
export function reconcileMissingEventJourney(visits, startVisitId, endpointVisitId, previous, expectation) {
    const start = visits.findIndex(({ id }) => id === startVisitId);
    const end = visits.findIndex(({ id }) => id === endpointVisitId);
    if (start < 0 || end < start)
        throw new Error("Choose a reproduction start at or before the expected-event endpoint.");
    const retainedVisits = visits.slice(start, end + 1);
    const retainedIds = new Set(retainedVisits.map(({ id }) => id));
    const manualByVisit = new Map();
    for (const step of previous) {
        if (step.kind !== "manual" || !retainedIds.has(step.visitId))
            continue;
        manualByVisit.set(step.visitId, [...(manualByVisit.get(step.visitId) ?? []), structuredClone(step)]);
    }
    const journey = retainedVisits.flatMap((visit) => [
        { kind: "pathname", visitId: visit.id, pathname: visit.pathname, text: `Visit ${visit.pathname}` },
        ...(manualByVisit.get(visit.id) ?? []),
    ]);
    const endpoint = retainedVisits.at(-1);
    journey.push({ kind: "assertion", visitId: endpoint.id, pathname: endpoint.pathname, text: `Expect ${expectation.eventName} to be pushed to ${expectation.sourceId} during ${endpoint.pathname}` });
    return renumber(journey);
}
//# sourceMappingURL=data-layer-unified-defect-builder.js.map