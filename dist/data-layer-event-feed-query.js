export const coreEventFeedQueryFields = [
    "Event name", "Source", "Adapter kind", "Pathname",
];
export const validationEventFeedQueryFields = [
    "Validation state", "Schema", "Validation rule", "Rule severity", "Affected property",
];
function distinct(values) {
    return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}
function uniqueValues(values) {
    return [...new Set(values.filter(Boolean))];
}
function payloadEntries(value, prefix = "") {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return prefix ? [[prefix, value]] : [];
    return Object.entries(value).flatMap(([key, child]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return child && typeof child === "object" && !Array.isArray(child) ? payloadEntries(child, path) : [[path, child]];
    });
}
function pathname(pageUrl) {
    if (!pageUrl)
        return "";
    try {
        return new URL(pageUrl).pathname;
    }
    catch {
        return pageUrl;
    }
}
function affectedProperty(path) {
    return path.replace(/^\//, "").replaceAll("/", ".");
}
function eventValues(event, field) {
    if (field === "Event name")
        return [event.name];
    if (field === "Source")
        return [event.sourceName ?? event.sourceId];
    if (field === "Adapter kind")
        return [event.sourceKind ?? ""];
    if (field === "Pathname")
        return [pathname(event.pageUrl)];
    if (field === "Validation state")
        return [event.validation ?? "Not checked"];
    if (field === "Schema")
        return event.validationDetails?.schema ? [event.validationDetails.schema.name] : [];
    if (field === "Validation rule")
        return (event.validationDetails?.evaluations ?? []).map(({ rule }) => rule);
    if (field === "Rule severity")
        return [
            ...(event.validationDetails?.evaluations ?? []).map(({ severity }) => severity),
            ...(event.validationDetails?.issues ?? []).map(({ severity }) => severity ?? "error"),
        ];
    if (field === "Affected property")
        return [
            ...(event.validationDetails?.evaluations ?? []).map(({ propertyPath }) => affectedProperty(propertyPath)),
            ...(event.validationDetails?.issues ?? []).map(({ instancePath }) => affectedProperty(instancePath)),
        ];
    const path = field.slice("Payload · ".length);
    const match = payloadEntries(event.payload).find(([candidate]) => candidate === path);
    return match ? [String(match[1])] : [];
}
export function eventFeedQueryFields(events) {
    const payloadFields = distinct(events.flatMap((event) => payloadEntries(event.payload).map(([path]) => path)))
        .map((path) => `Payload · ${path}`);
    return [...coreEventFeedQueryFields, ...payloadFields, ...validationEventFeedQueryFields];
}
export function eventFeedQueryOperators(field) {
    return field === "Validation rule"
        ? ["failed", "warned", "passed", "was evaluated", "was not evaluated"]
        : ["is", "is not", "contains", "does not contain"];
}
export function eventFeedQuerySuggestions(events, field) {
    return distinct(events.flatMap((event) => eventValues(event, field)));
}
export function queryConditionComplete(condition) {
    return Boolean(condition.field && condition.operator && condition.values?.some((value) => value.trim()));
}
export function applyQueryCondition(query, condition) {
    if (!queryConditionComplete(condition))
        throw new Error("Complete Field, Operator, and Value before applying the condition.");
    return { conditions: [...query.conditions.filter(({ id }) => id !== condition.id), { ...condition, values: uniqueValues(condition.values.map((value) => value.trim())) }] };
}
export function removeQueryCondition(query, id) {
    return { conditions: query.conditions.filter((condition) => condition.id !== id) };
}
export function clearEventFeedQuery(_query) {
    return { conditions: [] };
}
function textMatches(actual, operator, expected) {
    const value = actual.toLocaleLowerCase();
    const query = expected.toLocaleLowerCase();
    if (operator === "is")
        return value === query;
    if (operator === "is not")
        return value !== query;
    if (operator === "contains")
        return value.includes(query);
    return !value.includes(query);
}
function validationStateMatches(actual, operator, expected) {
    if (expected.toLocaleLowerCase() === "warnings") {
        const warnings = actual.toLocaleLowerCase().includes("warning") && !actual.toLocaleLowerCase().includes("error");
        return operator === "is" || operator === "contains" ? warnings : !warnings;
    }
    if (expected.toLocaleLowerCase() !== "issues")
        return textMatches(actual, operator, expected);
    const hasIssues = !["valid", "not checked", "assignment error"].includes(actual.toLocaleLowerCase());
    return operator === "is" || operator === "contains" ? hasIssues : !hasIssues;
}
function ruleMatches(event, condition) {
    const evaluations = event.validationDetails?.evaluations ?? [];
    return condition.values.some((rule) => {
        const matches = evaluations.filter((evaluation) => evaluation.rule.toLocaleLowerCase() === rule.toLocaleLowerCase());
        if (condition.operator === "was not evaluated")
            return matches.length === 0;
        if (condition.operator === "was evaluated")
            return matches.length > 0;
        const status = condition.operator === "failed" ? "error" : condition.operator === "warned" ? "warning" : "pass";
        return matches.some((evaluation) => evaluation.status === status);
    });
}
export function eventMatchesQueryCondition(event, condition) {
    if (condition.field === "Validation rule")
        return ruleMatches(event, condition);
    const operator = condition.operator;
    const actualValues = eventValues(event, condition.field);
    return condition.values.some((expected) => actualValues.some((actual) => condition.field === "Validation state"
        ? validationStateMatches(actual, operator, expected)
        : textMatches(actual, operator, expected)));
}
export function filterEventsByQuery(events, query) {
    if (query.conditions.length === 0)
        return [...events];
    return events.filter((event) => query.conditions.every((condition) => eventMatchesQueryCondition(event, condition)));
}
export function queryConditionSummary(condition) {
    const values = condition.values.join(" or ");
    return condition.field === "Validation rule"
        ? `Validation rule ${values} ${condition.operator}`
        : `${condition.field} ${condition.operator} ${values}`;
}
export function activeQuerySummary(query) {
    return query.conditions.length ? "Match all conditions · Match any selected value" : "No active filters";
}
//# sourceMappingURL=data-layer-event-feed-query.js.map