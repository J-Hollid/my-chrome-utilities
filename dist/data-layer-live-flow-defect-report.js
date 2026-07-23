function representedValue(value) {
    return JSON.stringify(value) ?? String(value);
}
function linkEvidence(entry) {
    if (!entry.relationshipId) {
        return {
            kind: "start",
            label: `Started at ${entry.stepName}`,
            pageFrameId: entry.stepId,
        };
    }
    const relationshipIds = entry.matchedPath.flatMap(({ relationshipId }) => (relationshipId ? [relationshipId] : []));
    return {
        kind: "path",
        label: `path ${entry.matchedPath.map(({ stepName }) => stepName).join(" to ")}`,
        relationshipIds,
    };
}
export function createManualFlowDefectEvent(entry, event) {
    const observedEvent = { ...event };
    delete observedEvent.manualFlowValidations;
    const context = {
        flowId: entry.flowId,
        flowName: entry.flowName,
        selectedStepId: entry.stepId,
        selectedStepName: entry.stepName,
        eventId: event.id,
        eventStepLink: { eventId: event.id, stepId: entry.stepId },
        path: structuredClone(entry.matchedPath),
        linkEvidence: linkEvidence(entry),
        effectiveTarget: structuredClone(entry.target),
        effectiveSchemaRevision: entry.effectiveSchemaRevision,
        effectiveSchemaRevisionIdentity: entry.effectiveSchemaRevisionIdentity,
        provenance: structuredClone(entry.provenance),
    };
    const contributorPath = entry.provenance
        .map(({ scope, contributorName }) => `${scope} ${contributorName}`)
        .join(" → ");
    return {
        ...observedEvent,
        manualFlowContext: context,
        validation: entry.status === "Valid" ? "Valid" : `${entry.issues.length} issues`,
        validationDetails: {
            evaluations: [],
            schema: {
                id: entry.target.id,
                name: `${entry.target.name} Flow-step expectation`,
                version: entry.effectiveSchemaRevision,
            },
            issues: entry.issues.map((issue) => ({
                instancePath: issue.path,
                message: `Observed value does not satisfy the linked ${entry.stepName} Flow-step expectation`,
                expected: representedValue(issue.expected),
                actual: representedValue(issue.actual),
                schemaName: entry.target.name,
                schemaVersion: entry.effectiveSchemaRevision,
                schemaLocation: `Flow ${entry.relationshipId ?? "start"} → ${entry.stepId}`,
                rule: issue.code,
                severity: issue.severity,
                origin: `Manual Flow test · ${issue.provenance}${contributorPath ? ` · ${contributorPath}` : ""}`,
            })),
        },
    };
}
//# sourceMappingURL=data-layer-live-flow-defect-report.js.map