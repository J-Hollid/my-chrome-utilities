import { pathConditionResult, pathConditionsResult, } from "./data-layer-path-conditions.js";
export { pathConditionResult, pathConditionsResult };
const requirements = {
    String: ["Must be present", "Must be one of these values", "Must match a pattern", "Must have this length"],
    Number: ["Must be present", "Must be one of these values", "Must be within a range"],
    Array: ["Must be present", "Must contain this many items"],
    Object: ["Must be present", "Allow only these properties"],
    Boolean: ["Must be present", "Must equal this value"],
    Null: ["Must be present"],
};
const stageOrder = ["property", "destination", "requirement", "scope", "review"];
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
        prefillSources: {},
        scopeEdited: false,
        scope: { kind: "domain-all-paths", domain: url.hostname, pathname: url.pathname || "/", conditions: [] },
        advanced: {
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
    const { expectedType: _source, ...prefillSources } = draft.prefillSources;
    return { ...draft, property, prefillSources, requirementCorrectionRequired: correction, preview: previewFor(property) };
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
export function setGuidedScope(draft, scope) {
    const { domain: _domain, pathname: _pathname, pathConditions: _conditions, ...prefillSources } = draft.prefillSources;
    return { ...draft, scope: { ...scope, conditions: [...scope.conditions] }, prefillSources, scopeEdited: true };
}
export function validateNewSchemaName(schemaName, existingNames) {
    const name = schemaName.trim();
    if (!name)
        return { valid: false, assistance: "Enter a name for the new schema" };
    if (existingNames.some((candidate) => candidate.toLowerCase() === name.toLowerCase())) {
        return { valid: false, assistance: "Choose the existing schema or enter another name" };
    }
    return { valid: true, assistance: `New schema ${name} will be created` };
}
function samePathConditions(left, right) {
    const leftConditions = left ?? [];
    const rightConditions = right ?? [];
    return leftConditions.length === rightConditions.length
        && leftConditions.every((condition, index) => condition.matchType === rightConditions[index]?.matchType
            && condition.expression === rightConditions[index]?.expression);
}
export function guidedAssignmentsMatch(left, right) {
    return left.sourceId === right.sourceId
        && left.eventName === right.eventName
        && left.target === right.target
        && left.domainCondition === right.domainCondition
        && left.pathnameCondition === right.pathnameCondition
        && samePathConditions(left.pathConditions, right.pathConditions);
}
function reviewedAssignment(draft) {
    return {
        sourceId: draft.event.sourceId,
        eventName: draft.event.name,
        target: draft.advanced.target,
        ...(draft.scope.kind === "everywhere" ? {} : { domainCondition: draft.scope.domain }),
        ...(draft.scope.kind === "current-path" ? { pathnameCondition: draft.scope.pathname } : {}),
        ...(draft.scope.kind === "selected-paths" ? { pathConditions: draft.scope.conditions } : {}),
    };
}
function matchingAssignment(draft, candidate) {
    const reviewed = reviewedAssignment(draft);
    return candidate.assignments?.some((assignment) => assignment.enabled !== false
        && guidedAssignmentsMatch(assignment, reviewed)) ?? false;
}
export function schemaDestinationOptions(draft, candidates) {
    return candidates.map((candidate) => {
        const propertyType = draft.property ? candidate.propertyTypes[draft.property.path] : undefined;
        const targetMismatch = candidate.target !== draft.advanced.target;
        const typeMismatch = Boolean(propertyType && draft.property && propertyType !== draft.property.expectedType);
        const explanation = targetMismatch
            ? `schema validates ${candidate.target}, not ${draft.advanced.target}`
            : typeMismatch
                ? `${draft.property?.path} expects ${propertyType}`
                : propertyType
                    ? `${draft.property?.path} accepts ${draft.property?.expectedType} rules`
                    : `${draft.property?.path ?? "property"} will be added`;
        return { ...candidate, available: !targetMismatch && !typeMismatch, explanation };
    });
}
export function assignmentScopeSummary(assignments) {
    const assignment = assignments?.find(({ enabled }) => enabled !== false);
    if (!assignment)
        return "No assignments";
    const paths = assignment.pathConditions?.map(({ expression }) => expression)
        ?? (assignment.pathnameCondition ? [assignment.pathnameCondition] : []);
    const summary = [assignment.eventName, assignment.domainCondition ?? "every domain", ...paths].join(" · ");
    const additional = (assignments?.filter(({ enabled }) => enabled !== false).length ?? 1) - 1;
    return additional > 0 ? `${summary} · ${additional} more` : summary;
}
export function searchSchemaDestinationOptions(draft, candidates, query) {
    const normalized = query.trim().toLowerCase();
    const options = schemaDestinationOptions(draft, candidates);
    if (!normalized)
        return options;
    return options.filter((candidate) => {
        const searchable = [
            candidate.name,
            `version ${candidate.version}`,
            candidate.target,
            ...Object.keys(candidate.propertyTypes),
            ...(candidate.assignments ?? []).flatMap((assignment) => [
                assignment.name,
                assignment.sourceId,
                assignment.eventName,
                assignment.target,
                assignment.domainCondition,
                assignment.pathnameCondition,
                ...(assignment.pathConditions?.map(({ expression }) => expression) ?? []),
            ]),
        ].filter((value) => Boolean(value)).join(" ").toLowerCase();
        return searchable.includes(normalized);
    });
}
export function setGuidedSchemaDestination(draft, destination) {
    return { ...draft, destination };
}
function assignmentLabel(assignment) {
    return `${assignment.name ?? assignment.id ?? `${assignment.eventName} on ${assignment.domainCondition ?? "every domain"}`} assignment`;
}
function compatibleCapturedAssignments(draft, candidate) {
    return (candidate.assignments ?? []).filter((assignment) => assignment.enabled !== false
        && assignment.sourceId === draft.event.sourceId
        && assignment.eventName === draft.event.name
        && assignment.target === candidate.target)
        .map((assignment) => ({
        ...assignment,
        ...(assignment.pathConditions ? { pathConditions: [...assignment.pathConditions] } : {}),
    }));
}
function scopeFromAssignment(draft, assignment) {
    const conditions = assignment.pathConditions ? [...assignment.pathConditions] : [];
    const kind = conditions.length
        ? "selected-paths"
        : assignment.pathnameCondition
            ? "current-path"
            : assignment.domainCondition
                ? "domain-all-paths"
                : "everywhere";
    return {
        kind,
        domain: assignment.domainCondition ?? draft.scope.domain,
        pathname: assignment.pathnameCondition ?? draft.scope.pathname,
        conditions,
    };
}
function scopeReplacementReview(current, proposed) {
    const values = [
        ["domain", current.domain, proposed.domain],
        ["pathname", current.pathname, proposed.pathname],
        ["path conditions", JSON.stringify(current.conditions), JSON.stringify(proposed.conditions)],
    ];
    return values.flatMap(([field, currentValue, proposedValue]) => currentValue === proposedValue ? [] : [{ field, currentValue, proposedValue }]);
}
export function applyGuidedSchemaCandidate(draft, candidate, assignmentId) {
    const compatibleAssignments = compatibleCapturedAssignments(draft, candidate);
    const selectedAssignment = assignmentId
        ? compatibleAssignments.find((assignment) => assignment.id === assignmentId)
        : compatibleAssignments.length === 1
            ? compatibleAssignments[0]
            : undefined;
    const selection = compatibleAssignments.length === 0
        ? "Create a new assignment"
        : selectedAssignment
            ? "the compatible assignment"
            : "required from readable assignment choices";
    const schemaSource = `${candidate.name} version ${candidate.version}`;
    const expectedType = draft.property ? candidate.propertyTypes[draft.property.path] : undefined;
    const property = draft.property && expectedType
        ? { ...draft.property, expectedType, typeSource: "explicit override" }
        : draft.property;
    const schemaSources = {
        ...draft.prefillSources,
        target: schemaSource,
        ...(expectedType ? { expectedType: schemaSource } : {}),
    };
    const destination = {
        kind: "existing",
        schemaId: candidate.id,
        schemaName: candidate.name,
        schemaVersion: candidate.version,
        matchingAssignment: Boolean(selectedAssignment),
    };
    const base = {
        ...draft,
        ...(property ? { property } : {}),
        advanced: { ...draft.advanced, target: candidate.target },
        destination,
        assignmentResolution: {
            selection,
            compatibleAssignments,
            ...(selectedAssignment?.id ? { selectedAssignmentId: selectedAssignment.id } : {}),
        },
        prefillSources: schemaSources,
        preview: previewFor(property),
    };
    if (!selectedAssignment) {
        const { prefillReplacementReview: _review, pendingPrefill: _pending, ...withoutProposal } = base;
        return withoutProposal;
    }
    const proposedScope = scopeFromAssignment(draft, selectedAssignment);
    const source = assignmentLabel(selectedAssignment);
    const assignmentSources = {
        ...schemaSources,
        sourceId: source,
        eventName: source,
        domain: source,
        pathname: source,
        pathConditions: source,
    };
    const proposed = {
        ...base,
        event: { ...base.event, name: selectedAssignment.eventName },
        advanced: { ...base.advanced, sourceId: selectedAssignment.sourceId, target: selectedAssignment.target },
    };
    const replacementReview = draft.scopeEdited ? scopeReplacementReview(draft.scope, proposedScope) : [];
    if (replacementReview.length) {
        return {
            ...proposed,
            prefillReplacementReview: replacementReview,
            pendingPrefill: { scope: proposedScope, sources: assignmentSources },
        };
    }
    const { prefillReplacementReview: _review, pendingPrefill: _pending, ...withoutProposal } = proposed;
    return { ...withoutProposal, scope: proposedScope, prefillSources: assignmentSources, scopeEdited: false };
}
export function resolveGuidedPrefillReplacement(draft, choice) {
    const { prefillReplacementReview: _review, pendingPrefill, ...rest } = draft;
    if (choice === "accept" && pendingPrefill) {
        return { ...rest, scope: pendingPrefill.scope, prefillSources: pendingPrefill.sources, scopeEdited: false };
    }
    return rest;
}
function selectedAssignmentStillMatches(draft) {
    if (draft.destination?.kind !== "existing")
        return false;
    const resolution = draft.assignmentResolution;
    if (!resolution)
        return draft.destination.matchingAssignment;
    const selected = resolution.selectedAssignmentId
        ? resolution.compatibleAssignments.find(({ id }) => id === resolution.selectedAssignmentId)
        : resolution.selection === "the compatible assignment" && resolution.compatibleAssignments.length === 1
            ? resolution.compatibleAssignments[0]
            : undefined;
    return selected ? guidedAssignmentsMatch(selected, reviewedAssignment(draft)) : false;
}
export function existingSchemaDestination(draft, candidate) {
    return {
        kind: "existing",
        schemaId: candidate.id,
        schemaName: candidate.name,
        schemaVersion: candidate.version,
        matchingAssignment: matchingAssignment(draft, candidate),
    };
}
function reviewText(draft) {
    if (!draft.property || !draft.requirement || !draft.destination)
        return "Complete the property, requirement, scope, and schema destination stages.";
    const requirement = draft.requirement === "Must be one of these values"
        ? `to be ${draft.allowedValues.join(" or ")}`
        : draft.requirement.toLowerCase();
    const destination = draft.destination.kind === "new"
        ? `New schema ${draft.destination.schemaName} will be created.`
        : `${draft.destination.schemaName} version ${draft.destination.schemaVersion + 1} will be created while version ${draft.destination.schemaVersion} remains unchanged. Assignment action: ${selectedAssignmentStillMatches(draft) ? "reuse the matching enabled assignment" : "create the reviewed enabled assignment"}.`;
    return `${draft.event.name} on ${draft.scope.domain} requires ${draft.property.path} ${requirement}. ${draft.preview.message} Rule attachment path: ${draft.property.path}. ${destination}`;
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
    if (!draft.property || !draft.requirement || !draft.destination || draft.requirementCorrectionRequired)
        throw new Error("Guided validation draft is incomplete.");
    const schemaName = draft.destination.schemaName;
    const schemaVersion = draft.destination.kind === "existing" ? draft.destination.schemaVersion + 1 : 1;
    const schemaId = `schema:${slug(schemaName)}:${schemaVersion}`;
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
        schema: { id: schemaId, name: schemaName, version: schemaVersion, rules: [rule] },
        reusableRules: reusable && reusableRuleId ? [{ id: reusableRuleId, name: draft.advanced.ruleName, requirement: draft.requirement, values: [...draft.allowedValues] }] : [],
        assignment,
        destination: {
            kind: draft.destination.kind,
            ...(draft.destination.kind === "existing"
                ? { previousSchemaId: draft.destination.schemaId, previousVersion: draft.destination.schemaVersion }
                : {}),
            assignmentAction: draft.destination.kind === "existing" && selectedAssignmentStillMatches(draft)
                ? "reuse the matching enabled assignment"
                : "create the reviewed enabled assignment",
        },
        readableRequirement: `${draft.property.path} must be ${draft.allowedValues.join(" or ") || draft.requirement.toLowerCase()}`,
    };
}
//# sourceMappingURL=data-layer-guided-validation.js.map