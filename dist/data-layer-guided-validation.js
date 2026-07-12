const requirements = {
    String: ["Must be present", "Must be one of these values", "Must match a pattern", "Must have this length"],
    Number: ["Must be present", "Must be one of these values", "Must be within a range"],
    Array: ["Must be present", "Must contain this many items"],
    Object: ["Must be present", "Allow only these properties"],
    Boolean: ["Must be present", "Must equal this value"],
    Null: ["Must be present"],
};
const stageOrder = ["property", "requirement", "scope", "review"];
function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
export function detectedValueType(value) {
    if (value === null)
        return "Null";
    if (Array.isArray(value))
        return "Array";
    if (typeof value === "string")
        return "String";
    if (typeof value === "number")
        return "Number";
    if (typeof value === "boolean")
        return "Boolean";
    return "Object";
}
function flattenedProperties(value, prefix = "") {
    return Object.entries(value).flatMap(([name, propertyValue]) => {
        const path = prefix ? `${prefix}.${name}` : name;
        const own = { path, value: propertyValue, detectedType: detectedValueType(propertyValue) };
        return propertyValue && typeof propertyValue === "object" && !Array.isArray(propertyValue)
            ? [own, ...flattenedProperties(propertyValue, path)]
            : [own];
    });
}
function valueAtPath(payload, path) {
    return path.split(".").reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, payload);
}
function eventPasses(property) {
    return property ? detectedValueType(property.observedValue) === property.expectedType : false;
}
function previewFor(property) {
    if (!property)
        return { currentEventPasses: false, message: "Select a property to preview validation." };
    if (eventPasses(property))
        return { currentEventPasses: true, message: `${property.path} matches expected ${property.expectedType}.` };
    return {
        currentEventPasses: false,
        message: `${property.path} was observed as ${property.detectedType} but ${property.expectedType} is expected.`,
    };
}
export function createGuidedValidationDraft(event) {
    const url = new URL(event.pageUrl);
    const eventSlug = slug(event.name) || "event";
    return {
        stage: "property",
        event: { ...event, payload: { ...event.payload } },
        properties: flattenedProperties(event.payload),
        allowedValues: [],
        requirementCorrectionRequired: false,
        scope: { kind: "domain-all-paths", domain: url.hostname, pathname: url.pathname || "/", conditions: [] },
        advanced: {
            schemaName: `${event.name} validation`,
            ruleName: `${event.name} requirement`,
            severity: "Error",
            message: `Validate ${event.name} from ${event.sourceId}`,
            sourceId: event.sourceId,
            target: "payload",
            priority: 100,
            versionPolicy: "Pinned",
        },
        preview: { currentEventPasses: false, message: "Select a property to preview validation." },
        review: "",
        persisted: false,
    };
}
export function compatibleRequirements(type) {
    return requirements[type];
}
export function selectGuidedProperty(draft, path) {
    const observedValue = valueAtPath(draft.event.payload, path);
    const detectedType = detectedValueType(observedValue);
    const property = { path, observedValue, detectedType, expectedType: detectedType, typeSource: "detected from this event" };
    const { requirement: _requirement, ...withoutRequirement } = draft;
    return { ...withoutRequirement, property, allowedValues: [], requirementCorrectionRequired: false, preview: previewFor(property) };
}
export function setExpectedType(draft, expectedType) {
    if (!draft.property)
        return draft;
    const property = { ...draft.property, expectedType, typeSource: "explicit override" };
    const correction = draft.requirement !== undefined && !compatibleRequirements(expectedType).includes(draft.requirement);
    return { ...draft, property, requirementCorrectionRequired: correction, preview: previewFor(property) };
}
export function setGuidedRequirement(draft, requirement) {
    if (!draft.property || !compatibleRequirements(draft.property.expectedType).includes(requirement)) {
        return { ...draft, requirement, requirementCorrectionRequired: true };
    }
    const allowedValues = requirement === "Must be one of these values"
        ? [String(draft.property.observedValue ?? "")]
        : [];
    return { ...draft, requirement, allowedValues, requirementCorrectionRequired: false };
}
export function addAllowedValue(draft) {
    return { ...draft, allowedValues: [...draft.allowedValues, ""] };
}
export function setAllowedValue(draft, index, value) {
    return { ...draft, allowedValues: draft.allowedValues.map((current, candidate) => candidate === index ? value : current) };
}
export function removeAllowedValue(draft, index) {
    return { ...draft, allowedValues: draft.allowedValues.filter((_, candidate) => candidate !== index) };
}
export function validateAllowedValues(values) {
    if (!values.length)
        return { valid: false, assistance: "Add at least one allowed value" };
    if (values.some((value) => value.trim() === ""))
        return { valid: false, assistance: "Enter a value or remove the blank item" };
    const duplicate = values.find((value, index) => values.indexOf(value) !== index);
    if (duplicate)
        return { valid: false, assistance: `Remove or change the duplicate ${duplicate}` };
    return { valid: true, assistance: `${values.length} allowed values` };
}
function pathnameOf(pathOrUrl) {
    try {
        return new URL(pathOrUrl).pathname || "/";
    }
    catch {
        return pathOrUrl.split(/[?#]/, 1)[0] || "/";
    }
}
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function pathConditionResult(condition, pathOrUrl) {
    const pathname = pathnameOf(pathOrUrl);
    try {
        const pattern = condition.matchType === "Exact path"
            ? new RegExp(`^${escapeRegex(condition.expression)}$`)
            : condition.matchType === "Path pattern"
                ? new RegExp(`^${condition.expression.split("*").map(escapeRegex).join(".*")}$`)
                : new RegExp(condition.expression);
        return { valid: true, matches: pattern.test(pathname) };
    }
    catch (error) {
        return { valid: false, matches: false, error: error instanceof Error ? error.message : "Invalid regular expression" };
    }
}
export function pathConditionsResult(conditions, pathOrUrl) {
    for (const condition of conditions) {
        const result = pathConditionResult(condition, pathOrUrl);
        if (!result.valid)
            return { valid: false, matches: false, ...(result.error ? { error: result.error } : {}) };
        if (result.matches)
            return { valid: true, matches: true, matchingCondition: condition };
    }
    return { valid: true, matches: false };
}
export function setGuidedScope(draft, scope) {
    return { ...draft, scope: { ...scope, conditions: [...scope.conditions] } };
}
function reviewText(draft) {
    if (!draft.property || !draft.requirement)
        return "Complete the property and requirement stages.";
    const requirement = draft.requirement === "Must be one of these values"
        ? `to be ${draft.allowedValues.join(" or ")}`
        : draft.requirement.toLowerCase();
    return `${draft.event.name} on ${draft.scope.domain} requires ${draft.property.path} ${requirement}. ${draft.preview.message}`;
}
export function advanceGuidedValidation(draft) {
    const index = stageOrder.indexOf(draft.stage);
    const next = stageOrder[Math.min(stageOrder.length - 1, index + 1)] ?? "review";
    return { ...draft, stage: next, review: next === "review" ? reviewText(draft) : draft.review };
}
export function backGuidedValidation(draft) {
    const index = stageOrder.indexOf(draft.stage);
    return { ...draft, stage: stageOrder[Math.max(0, index - 1)] ?? "property" };
}
export function publishGuidedValidation(draft, reusable) {
    if (!draft.property || !draft.requirement || draft.requirementCorrectionRequired)
        throw new Error("Guided validation draft is incomplete.");
    const schemaId = `schema:${slug(draft.advanced.schemaName)}`;
    const reusableRuleId = reusable ? `rule:${slug(draft.advanced.ruleName)}` : undefined;
    const rule = {
        path: draft.property.path,
        expectedType: draft.property.expectedType,
        requirement: draft.requirement,
        values: [...draft.allowedValues],
        ...(reusableRuleId ? { reusableRuleId } : {}),
    };
    const scope = draft.scope;
    const pathnameCondition = scope.kind === "current-path" ? scope.pathname : undefined;
    const domainCondition = scope.kind === "everywhere" ? undefined : scope.domain;
    const assignment = {
        id: `assignment:${schemaId}:${slug(draft.event.name)}`,
        schemaId,
        sourceId: draft.advanced.sourceId,
        eventName: draft.event.name,
        target: draft.advanced.target,
        ...(domainCondition ? { domainCondition } : {}),
        ...(pathnameCondition ? { pathnameCondition } : {}),
        ...(scope.kind === "selected-paths" ? { pathConditions: [...scope.conditions] } : {}),
        priority: draft.advanced.priority,
        versionPolicy: draft.advanced.versionPolicy === "Pinned" ? "pinned" : "follow latest",
        enabled: true,
    };
    return {
        schema: { id: schemaId, name: draft.advanced.schemaName, version: 1, rules: [rule] },
        reusableRules: reusable && reusableRuleId ? [{ id: reusableRuleId, name: draft.advanced.ruleName, requirement: draft.requirement, values: [...draft.allowedValues] }] : [],
        assignment,
        readableRequirement: `${draft.property.path} must be ${draft.allowedValues.join(" or ") || draft.requirement.toLowerCase()}`,
    };
}
//# sourceMappingURL=data-layer-guided-validation.js.map