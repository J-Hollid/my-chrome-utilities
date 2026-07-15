function clone(value) { return structuredClone(value); }
function schemaTypeMatches(value, type) {
    if (!type)
        return true;
    if (type === "object")
        return value !== null && typeof value === "object" && !Array.isArray(value);
    if (type === "array")
        return Array.isArray(value);
    if (type === "number")
        return typeof value === "number" && Number.isFinite(value);
    if (type === "boolean")
        return typeof value === "boolean";
    if (type === "string")
        return typeof value === "string";
    if (type === "null")
        return value === null;
    return true;
}
function satisfiesSchema(value, schema) {
    if (!schemaTypeMatches(value, schema?.type))
        return false;
    if (schema?.type === "object") {
        const record = value;
        if ((schema.required ?? []).some((property) => !Object.prototype.hasOwnProperty.call(record, property)))
            return false;
        return Object.entries(schema.properties ?? {}).every(([property, child]) => !Object.prototype.hasOwnProperty.call(record, property) || satisfiesSchema(record[property], child));
    }
    if (schema?.type === "array")
        return value.every((item) => !schema.items || satisfiesSchema(item, schema.items));
    return true;
}
function compatiblePayload(value, schema) {
    if (schema?.type === "object") {
        const source = value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
        const result = {};
        for (const [property, child] of Object.entries(schema.properties ?? {})) {
            if (Object.prototype.hasOwnProperty.call(source, property) && schemaTypeMatches(source[property], child.type)) {
                result[property] = child.type === "object" || child.type === "array"
                    ? compatiblePayload(source[property], child)
                    : clone(source[property]);
            }
            else if (child.type === "object")
                result[property] = compatiblePayload({}, child);
            else if (child.type === "array")
                result[property] = [];
        }
        return result;
    }
    if (schema?.type === "array") {
        if (!Array.isArray(value))
            return [];
        return value.flatMap((item) => !schema.items || schemaTypeMatches(item, schema.items.type)
            ? [schema.items ? compatiblePayload(item, schema.items) : clone(item)]
            : []);
    }
    return schemaTypeMatches(value, schema?.type) ? clone(value) : undefined;
}
export function initializeOccurrenceExpectedPayload(capturedPayload, schema) {
    if (satisfiesSchema(capturedPayload, schema.document)) {
        return { payload: clone(capturedPayload), payloadState: "typed captured payload reused", completionState: "ready with optional editing" };
    }
    return {
        payload: compatiblePayload(capturedPayload, schema.document),
        payloadState: "compatible captured fields prefilled",
        completionState: "blocked on invalid and missing expected fields",
    };
}
function identityFromAssignment(assignment) {
    return {
        sourceId: assignment.sourceId,
        eventName: assignment.eventName,
        target: assignment.target,
        pathname: assignment.pathname,
        assignmentId: assignment.id,
        ...(assignment.schemaId ? { schemaId: assignment.schemaId } : {}),
    };
}
function covering(assignments, pathname) {
    return assignments.filter((assignment) => assignment.pathname === "/"
        || pathname === assignment.pathname
        || pathname.startsWith(`${assignment.pathname.replace(/\/$/, "")}/`));
}
function withExpectedIdentity(draft, identity) {
    const schema = identity.schemaId ? draft.schemas.find(({ id }) => id === identity.schemaId) : undefined;
    const initialized = schema
        ? initializeOccurrenceExpectedPayload(draft.actual.payload, schema)
        : { payload: clone(draft.actual.payload), payloadState: "captured payload retained as draft", completionState: "blocked on warning acknowledgement and confirmation" };
    const matchingEventIds = draft.visitEvents
        .filter((event) => event.id !== draft.actual.id
        && event.visitId === draft.actual.visitId
        && event.pathname === draft.actual.pathname
        && event.sourceId === identity.sourceId
        && event.eventName === identity.eventName
        && event.target === identity.target)
        .map(({ id }) => id);
    const guardrail = identity.eventName === draft.actual.eventName
        ? "completion blocked"
        : matchingEventIds.length
            ? "matching event evidence and explicit override required"
            : schema ? undefined : "warning acknowledgement and confirmation required";
    return {
        ...draft,
        expectedIdentity: clone(identity),
        expectedPayload: initialized.payload,
        payloadState: initialized.payloadState,
        completionState: initialized.completionState,
        ...(guardrail ? { guardrail } : {}),
        matchingEventIds,
        confirmed: false,
        override: false,
        warningAcknowledged: false,
    };
}
export function createOccurrenceDefectDraft(actual, mode, options) {
    const snapshot = clone(actual);
    const assignments = clone(covering(options.assignments, actual.pathname));
    let draft = {
        mode,
        actual: snapshot,
        assignments,
        schemas: Array.from(options.schemas, clone),
        visitEvents: Array.from(options.visitEvents, clone),
        completionState: mode === "Unexpected event" ? "ready with optional editing" : "blocked on warning acknowledgement and confirmation",
        matchingEventIds: [],
        confirmed: false,
        override: false,
        warningAcknowledged: false,
        reproductionSteps: [],
        timeline: [],
    };
    if (mode === "Unexpected event") {
        const contradictsAssignment = assignments.some((assignment) => assignment.sourceId === actual.sourceId
            && assignment.eventName === actual.eventName && assignment.target === actual.target);
        return { ...draft, ...(contradictsAssignment ? { guardrail: "explicit override required" } : {}) };
    }
    const alternatives = assignments.filter((assignment) => assignment.sourceId !== actual.sourceId
        || assignment.eventName !== actual.eventName || assignment.target !== actual.target);
    if (alternatives.length === 1)
        draft = withExpectedIdentity(draft, identityFromAssignment(alternatives[0]));
    return draft;
}
export function selectOccurrenceExpectedIdentity(draft, identity) {
    if (draft.mode !== "Wrong event name")
        throw new Error("Unexpected-event reports do not select a replacement identity.");
    return withExpectedIdentity(draft, identity);
}
export function editOccurrenceExpectedPayload(draft, payload) {
    if (draft.mode !== "Wrong event name" || !draft.expectedIdentity)
        throw new Error("Choose an expected event identity before editing its payload.");
    const schema = draft.expectedIdentity.schemaId ? draft.schemas.find(({ id }) => id === draft.expectedIdentity?.schemaId) : undefined;
    return {
        ...draft,
        expectedPayload: clone(payload),
        completionState: schema && !satisfiesSchema(payload, schema.document)
            ? "blocked on invalid and missing expected fields"
            : schema
                ? "ready with optional editing"
                : "blocked on warning acknowledgement and confirmation",
        confirmed: false,
    };
}
export function confirmOccurrenceExpectation(draft, confirmation = {}) {
    if (draft.mode === "Unexpected event") {
        if (draft.guardrail === "explicit override required" && !confirmation.override)
            throw new Error("An explicit override is required.");
        return { ...draft, confirmed: true, override: Boolean(confirmation.override) };
    }
    if (!draft.expectedIdentity)
        throw new Error("Choose an expected event identity before completing the report.");
    if (draft.expectedIdentity.eventName === draft.actual.eventName)
        throw new Error("Choose a different event name before completing the report.");
    if (draft.completionState === "blocked on invalid and missing expected fields")
        throw new Error("Expected payload has invalid and missing fields.");
    if (draft.matchingEventIds.length && !confirmation.override)
        throw new Error("Matching event evidence requires an explicit override.");
    if (!draft.expectedIdentity.schemaId && !confirmation.acknowledgeWarning)
        throw new Error("Acknowledge the non-schema expectation before completing the report.");
    return { ...draft, confirmed: true, override: Boolean(confirmation.override), warningAcknowledged: Boolean(confirmation.acknowledgeWarning) };
}
export function createOccurrenceReport(draft) {
    if (!draft.confirmed)
        throw new Error("Confirm the occurrence expectation before creating the report.");
    const summary = draft.summary ?? (draft.mode === "Unexpected event"
        ? `Unexpected ${draft.actual.eventName} event`
        : `${draft.actual.eventName} should be ${draft.expectedIdentity?.eventName}`);
    const description = draft.description ?? (draft.mode === "Unexpected event"
        ? `${draft.actual.eventName} was captured during ${draft.actual.pathname} but should not have fired.`
        : `${draft.actual.eventName} was captured during ${draft.actual.pathname} instead of ${draft.expectedIdentity?.eventName}.`);
    const expectedExplanation = draft.expectedExplanation ?? (draft.mode === "Unexpected event"
        ? `no ${draft.actual.eventName} event is fired during ${draft.actual.pathname}`
        : `${draft.expectedIdentity?.eventName} is fired instead of ${draft.actual.eventName} during ${draft.actual.pathname}`);
    const { assignments: _assignments, schemas: _schemas, visitEvents: _visitEvents, ...presentation } = clone(draft);
    return {
        ...presentation,
        type: draft.mode,
        summary,
        description,
        expectedExplanation,
        payloadCorrections: [],
        occurrenceEvidence: {
            sourceId: draft.actual.sourceId,
            ...(draft.actual.sourceName ? { sourceName: draft.actual.sourceName } : {}),
            validation: draft.actual.validation,
            ...(draft.actual.schema ? { schema: clone(draft.actual.schema) } : {}),
            captureTime: draft.actual.captureTime,
            pageUrl: draft.actual.pageUrl,
            visitId: draft.actual.visitId,
            pathname: draft.actual.pathname,
        },
    };
}
function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
export function renderOccurrenceReport(report) {
    const actual = [
        `Captured ${report.actual.eventName}`,
        `Validation state: ${report.actual.validation}`,
        `Source: ${report.actual.sourceName ?? report.actual.sourceId} (${report.actual.sourceId})`,
        `Capture time: ${report.actual.captureTime}`,
        `URL: ${report.actual.pageUrl}`,
        `Page visit: ${report.actual.visitId} · ${report.actual.pathname}`,
        JSON.stringify(report.actual.payload, null, 2),
    ].join("\n");
    const expected = report.mode === "Unexpected event"
        ? report.expectedExplanation
        : `${report.expectedExplanation}\n${JSON.stringify(report.expectedPayload, null, 2)}`;
    const difference = report.mode === "Unexpected event"
        ? `${report.actual.eventName} was an unexpected occurrence during ${report.actual.pathname}`
        : `${report.actual.eventName} was fired and ${report.expectedIdentity?.eventName} should have been fired instead`;
    const evidence = JSON.stringify(report.occurrenceEvidence, null, 2);
    const finalAssertion = report.mode === "Unexpected event"
        ? `Expect no ${report.actual.eventName} event to be pushed during ${report.actual.pathname}`
        : `Expect ${report.expectedIdentity?.eventName} instead of ${report.actual.eventName} during ${report.actual.pathname}`;
    const sections = [
        ["Summary", report.summary], ["Description", report.description],
        ["Steps to reproduce", [...report.reproductionSteps.map(({ text }) => text), finalAssertion].join("\n")],
        ["Actual result", actual], ["Expected result", expected], ["Differences", difference],
        ["Occurrence evidence", evidence],
        ...(report.timeline.length ? [["Supporting timeline", report.timeline.map((entry) => JSON.stringify(entry)).join("\n")]] : []),
    ];
    const text = sections.map(([heading, content]) => `${heading}\n${content}`).join("\n\n");
    const html = sections.map(([heading, content]) => heading === "Steps to reproduce"
        ? `<h2>${escapeHtml(heading)}</h2><ol>${content.split("\n").map((step) => `<li>${escapeHtml(step.replace(/^\d+\.\s*/, ""))}</li>`).join("")}</ol>`
        : `<h2>${escapeHtml(heading)}</h2><pre style="white-space:pre-wrap">${escapeHtml(content)}</pre>`).join("");
    return { html, text };
}
export function occurrenceDefectIdentity(report) {
    return {
        sourceId: report.actual.sourceId,
        actualEventName: report.actual.eventName,
        validationTarget: report.actual.target,
        pathname: report.actual.pathname,
        expectationMode: report.mode,
        ...(report.mode === "Wrong event name" && report.expectedIdentity ? {
            expectedSourceId: report.expectedIdentity.sourceId,
            expectedEventName: report.expectedIdentity.eventName,
            expectedTarget: report.expectedIdentity.target,
        } : {}),
    };
}
export function occurrenceIdentityMatches(left, right) {
    return left.sourceId === right.sourceId
        && left.actualEventName === right.actualEventName
        && left.validationTarget === right.validationTarget
        && left.pathname === right.pathname
        && left.expectationMode === right.expectationMode
        && left.expectedSourceId === right.expectedSourceId
        && left.expectedEventName === right.expectedEventName
        && left.expectedTarget === right.expectedTarget;
}
//# sourceMappingURL=data-layer-event-occurrence-defect-report.js.map