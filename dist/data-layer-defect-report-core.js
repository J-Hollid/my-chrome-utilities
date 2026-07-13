import { cloneValue, pointerSegments, pointerValue, updatePointer } from "./data-layer-defect-report-json.js";
function normalizedConstraint(constraint) {
    return /^must\b/i.test(constraint) ? constraint : `must be ${constraint}`;
}
function allowedValues(constraint) {
    const match = constraint.match(/(?:must\s+be\s+)?one\s+of\s+(.+)$/i);
    if (!match?.[1])
        return [];
    return match[1].split(/\s*(?:,|\bor\b)\s*/i).map((value) => value.trim()).filter(Boolean);
}
export function expectedResultAssistance(issue) {
    return {
        genericConstraint: `${issue.pointer} ${normalizedConstraint(issue.constraint)}`,
        schemaValues: allowedValues(issue.constraint).filter((value) => value !== String(issue.actual)),
        customAvailable: true,
    };
}
export function validateAssistedResponse(issue, response) {
    const values = allowedValues(issue.constraint);
    if (!values.length || values.includes(String(response)))
        return { valid: true };
    return { valid: false, warning: `${String(response)} does not satisfy the current schema constraint.` };
}
function issueName(issue) {
    return pointerSegments(issue.pointer).at(-1) ?? issue.id;
}
function responsePresentation(issue, choice) {
    const property = issueName(issue);
    const values = allowedValues(issue.constraint);
    if (choice.method === "keep the rule generic") {
        return values.length ? { kind: "constraint", property, allowedValues: values } : undefined;
    }
    if (choice.method === "apply the rule" || choice.response === undefined)
        return undefined;
    return {
        kind: "value",
        property,
        value: cloneValue(choice.response),
        quoteValue: choice.includeAllowedValuesComment !== undefined,
        ...(choice.includeAllowedValuesComment && values.length ? { allowedValuesComment: values } : {}),
    };
}
function actualDifferences(payload, issues) {
    return issues.filter(({ selected }) => selected).map((issue) => ({
        pointer: issue.pointer,
        marker: "−",
        treatment: "red",
        value: cloneValue(pointerValue(payload, issue.pointer)),
    }));
}
export function createDefectReport(event) {
    const captured = cloneValue(event);
    const issues = captured.issues
        .filter(({ severity }) => severity !== "pass")
        .map((issue) => ({ ...issue, selected: issue.severity === "error" }));
    return {
        event: captured,
        issues,
        actual: {
            payload: cloneValue(captured.payload),
            differences: actualDifferences(captured.payload, issues),
        },
        expected: { payload: cloneValue(captured.payload), corrections: [], explanations: [] },
        reproductionSteps: [],
        timeline: [],
    };
}
export function toggleReportIssue(report, issueId) {
    if (!report.issues.some(({ id }) => id === issueId))
        throw new Error(`Unknown report issue: ${issueId}`);
    const issues = report.issues.map((issue) => issue.id === issueId ? { ...issue, selected: !issue.selected } : issue);
    return {
        ...report,
        issues,
        actual: { payload: report.actual.payload, differences: actualDifferences(report.actual.payload, issues) },
    };
}
export function applyExpectedResult(report, choices) {
    const payload = cloneValue(report.event.payload);
    const corrections = [];
    const explanations = [];
    for (const choice of choices) {
        const issue = report.issues.find(({ id }) => id === choice.issueId);
        if (!issue)
            throw new Error(`Unknown report issue: ${choice.issueId}`);
        const name = issueName(issue);
        const presentation = responsePresentation(issue, choice);
        if (choice.method === "keep the rule generic") {
            corrections.push({
                issueId: issue.id,
                pointer: issue.pointer,
                operation: "none",
                ...(choice.responseSource ? { responseSource: choice.responseSource } : {}),
                ...(presentation ? { responsePresentation: presentation } : {}),
            });
            explanations.push(allowedValues(issue.constraint).length
                ? expectedResultAssistance(issue).genericConstraint
                : `${name} satisfies its validation rule`);
            continue;
        }
        if (choice.method === "apply the rule") {
            if (!/forbidden/i.test(issue.constraint))
                throw new Error(`The ${issue.id} rule cannot be applied without a response.`);
            updatePointer(payload, issue.pointer, "remove");
            corrections.push({ issueId: issue.id, pointer: issue.pointer, operation: "remove", marker: "+", ...(choice.responseSource ? { responseSource: choice.responseSource } : {}) });
            explanations.push(`${name} is absent`);
            continue;
        }
        if (choice.response === undefined || choice.response === null || choice.response === "") {
            throw new Error(`A response is required for ${issue.id}.`);
        }
        const operation = pointerValue(payload, issue.pointer) === undefined ? "add" : "replace";
        updatePointer(payload, issue.pointer, operation, choice.response);
        corrections.push({
            issueId: issue.id,
            pointer: issue.pointer,
            operation,
            response: cloneValue(choice.response),
            marker: "+",
            ...(choice.responseSource ? { responseSource: choice.responseSource } : {}),
            ...(choice.operatorProvided ? { operatorProvided: true } : {}),
            ...(presentation ? { responsePresentation: presentation } : {}),
        });
        explanations.push(`${name} is ${String(choice.response)}${choice.operatorProvided ? " (operator-provided Custom value or response)" : ""}`);
    }
    return { ...report, expected: { payload, corrections, explanations } };
}
//# sourceMappingURL=data-layer-defect-report-core.js.map