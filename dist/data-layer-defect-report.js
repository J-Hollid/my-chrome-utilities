function clone(value) {
    return value === undefined ? value : structuredClone(value);
}
function pointerSegments(pointer) {
    if (!pointer.startsWith("/"))
        throw new Error(`Invalid JSON pointer: ${pointer}`);
    return pointer.slice(1).split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}
function pointerValue(payload, pointer) {
    let current = payload;
    for (const segment of pointerSegments(pointer)) {
        if (current === null || typeof current !== "object")
            return undefined;
        current = current[segment];
    }
    return current;
}
function updatePointer(payload, pointer, operation, value) {
    const segments = pointerSegments(pointer);
    const leaf = segments.pop();
    if (!leaf)
        throw new Error("The root payload cannot be corrected directly.");
    let parent = payload;
    for (const segment of segments) {
        const child = parent[segment];
        if (child === null || typeof child !== "object")
            parent[segment] = {};
        parent = parent[segment];
    }
    if (operation === "remove")
        delete parent[leaf];
    else
        parent[leaf] = clone(value);
}
function issueName(issue) {
    return pointerSegments(issue.pointer).at(-1) ?? issue.id;
}
function actualDifferences(payload, issues) {
    return issues.filter(({ selected }) => selected).map((issue) => ({
        pointer: issue.pointer,
        marker: "−",
        treatment: "red",
        value: clone(pointerValue(payload, issue.pointer)),
    }));
}
export function createDefectReport(event) {
    const captured = clone(event);
    const issues = captured.issues
        .filter(({ severity }) => severity !== "pass")
        .map((issue) => ({ ...issue, selected: issue.severity === "error" }));
    return {
        event: captured,
        issues,
        actual: {
            payload: clone(captured.payload),
            differences: actualDifferences(captured.payload, issues),
        },
        expected: { payload: clone(captured.payload), corrections: [], explanations: [] },
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
    const payload = clone(report.event.payload);
    const corrections = [];
    const explanations = [];
    for (const choice of choices) {
        const issue = report.issues.find(({ id }) => id === choice.issueId);
        if (!issue)
            throw new Error(`Unknown report issue: ${choice.issueId}`);
        const name = issueName(issue);
        if (choice.method === "keep the rule generic") {
            corrections.push({ issueId: issue.id, pointer: issue.pointer, operation: "none" });
            explanations.push(`${name} satisfies its validation rule`);
            continue;
        }
        if (choice.method === "apply the rule") {
            if (!/forbidden/i.test(issue.constraint))
                throw new Error(`The ${issue.id} rule cannot be applied without a response.`);
            updatePointer(payload, issue.pointer, "remove");
            corrections.push({ issueId: issue.id, pointer: issue.pointer, operation: "remove", marker: "+" });
            explanations.push(`${name} is absent`);
            continue;
        }
        if (choice.response === undefined || choice.response === null || choice.response === "") {
            throw new Error(`A response is required for ${issue.id}.`);
        }
        const operation = pointerValue(payload, issue.pointer) === undefined ? "add" : "replace";
        updatePointer(payload, issue.pointer, operation, choice.response);
        corrections.push({ issueId: issue.id, pointer: issue.pointer, operation, response: clone(choice.response), marker: "+" });
        explanations.push(`${name} is ${String(choice.response)}`);
    }
    return { ...report, expected: { payload, corrections, explanations } };
}
export function generatePathnameSkeleton(visits, startVisitId, defectVisitId) {
    const start = visits.findIndex(({ id }) => id === startVisitId);
    const end = visits.findIndex(({ id }) => id === defectVisitId);
    if (start < 0 || end < start)
        throw new Error("The reproduction visit range is invalid.");
    return visits.slice(start, end + 1).map((visit, index) => ({
        visitId: visit.id,
        pathname: visit.pathname,
        text: `${index + 1}. Visit ${visit.pathname}`,
    }));
}
export function filterTimelineEvents(events, filter) {
    return events.filter((event) => (!filter.name || event.name.toLowerCase().includes(filter.name.toLowerCase()))
        && (!filter.source || event.source.toLowerCase().includes(filter.source.toLowerCase()))
        && (!filter.pathname || event.pathname === filter.pathname)
        && (!filter.validation || event.validation === filter.validation));
}
export function supportingTimeline(events, selection) {
    const selected = new Map(selection.map((item) => [item.eventId, item]));
    return [...events].sort((left, right) => left.captureTime.localeCompare(right.captureTime)).flatMap((event) => {
        const options = selected.get(event.id);
        if (!options)
            return [];
        return [{
                captureTime: event.captureTime,
                name: event.name,
                source: event.source,
                pathname: event.pathname,
                ...(options.includeSummary && event.summary !== undefined ? { summary: event.summary } : {}),
                ...(options.includePayload && event.payload !== undefined ? { payload: clone(event.payload) } : {}),
                ...(options.includeValidation && event.validationDetails !== undefined ? { validationDetails: clone(event.validationDetails) } : {}),
            }];
    });
}
export function generateReportDetails(report) {
    const selected = report.issues.filter(({ selected }) => selected);
    return {
        ...report,
        summary: `${report.event.name} fails ${report.event.schema.name} validation`,
        description: `${report.event.name} has ${selected.map(({ id }) => id).join(", ")} validation issue${selected.length === 1 ? "" : "s"}.`,
        expectedExplanation: report.expected.explanations.join("; "),
        editable: ["summary", "description", "expectedExplanation"],
        evidence: {
            schema: `${report.event.schema.name} version ${report.event.schema.version}`,
            validation: selected.map((issue) => ({
                rule: issue.rule,
                ruleVersion: issue.ruleVersion,
                severity: issue.severity,
                pointer: issue.pointer,
                constraint: issue.constraint,
                actual: clone(issue.actual),
            })),
            capture: {
                eventName: report.event.name,
                source: report.event.source,
                pageUrl: report.event.pageUrl,
                captureTime: report.event.captureTime,
            },
        },
    };
}
function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function reportSections(report) {
    return [
        ["Summary", report.summary],
        ["Description", report.description],
        ["Steps to reproduce", report.reproductionSteps.map(({ text }) => text).join("\n")],
        ["Actual result", JSON.stringify(report.actual.payload, null, 2)],
        ["Expected result", `${report.expectedExplanation}\n${JSON.stringify(report.expected.payload, null, 2)}`.trim()],
        ["Differences", [
                ...report.actual.differences.map(({ pointer }) => `− ${pointer} invalid actual value`),
                ...report.expected.corrections.filter(({ operation }) => operation !== "none").map(({ pointer }) => `+ ${pointer} corrected expected value`),
            ].join("\n")],
        ["Validation evidence", JSON.stringify(report.evidence, null, 2)],
        ...(report.timeline.length ? [["Supporting timeline", report.timeline.map((entry) => JSON.stringify(entry)).join("\n")]] : []),
    ];
}
export function renderJiraReport(report) {
    const actualJson = JSON.stringify(report.actual.payload, null, 2);
    const expectedJson = JSON.stringify(report.expected.payload, null, 2);
    const sections = reportSections(report);
    const differenceHtml = [
        ...report.actual.differences.map(({ pointer }) => `<li style="background-color:#ffd7d7">− <code>${escapeHtml(pointer)}</code> invalid actual value</li>`),
        ...report.expected.corrections.filter(({ operation }) => operation !== "none").map(({ pointer }) => `<li style="background-color:#d9f7d9">+ <code>${escapeHtml(pointer)}</code> corrected expected value</li>`),
    ].join("");
    const html = sections.map(([heading, content]) => {
        if (heading === "Differences")
            return `<h2>${heading}</h2><ul>${differenceHtml}</ul>`;
        if (heading === "Steps to reproduce") {
            return `<h2>${heading}</h2><ol>${report.reproductionSteps.map(({ text }) => `<li>${escapeHtml(text.replace(/^\d+\.\s*/, ""))}</li>`).join("")}</ol>`;
        }
        const structured = heading === "Actual result" || heading === "Expected result" || heading === "Validation evidence" || heading === "Supporting timeline";
        return `<h2>${heading}</h2>${structured ? `<pre style="font-family:monospace;white-space:pre-wrap">${escapeHtml(content)}</pre>` : `<p>${escapeHtml(content)}</p>`}`;
    }).join("");
    const text = sections.map(([heading, content]) => `${heading}\n${content}`).join("\n\n");
    return { html, text, actualJson, expectedJson };
}
export async function copyDefectReportForJira(report, clipboard) {
    const rendered = renderJiraReport(report);
    if (clipboard.writeRich) {
        try {
            await clipboard.writeRich(rendered.html, rendered.text);
            return { status: "success", feedback: "Report copied for Jira Cloud with color highlighting." };
        }
        catch {
            // The plain-text fallback below preserves a usable report.
        }
    }
    if (clipboard.writeText) {
        try {
            await clipboard.writeText(rendered.text);
            return { status: "warning", feedback: "Report copied as plain text; Jira Cloud color highlighting was not copied." };
        }
        catch {
            // Failure is reported without mutating the report.
        }
    }
    return { status: "failure", feedback: "Copy failed. The current report is unchanged." };
}
//# sourceMappingURL=data-layer-defect-report.js.map