import { cloneValue, pointerSegments } from "./data-layer-defect-report-json.js";
import { reportComponents } from "./data-layer-defect-report-core.js";
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
                ...(issue.violation ? { violation: issue.violation } : {}),
                constraint: issue.constraint,
                actual: cloneValue(issue.actual),
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
export function editReportDetails(report, edits) {
    return { ...report, ...edits };
}
function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function pointerChild(pointer, segment) {
    return `${pointer}/${segment.replaceAll("~", "~0").replaceAll("/", "~1")}`;
}
function jsonLines(value, depth = 0, pointer = "") {
    const indentation = "  ".repeat(depth);
    if (value === null || typeof value !== "object") {
        return [{ text: `${indentation}${JSON.stringify(value)}`, pointer }];
    }
    const entries = Array.isArray(value)
        ? value.map((item, index) => [String(index), item])
        : Object.entries(value);
    const opening = Array.isArray(value) ? "[" : "{";
    const closing = Array.isArray(value) ? "]" : "}";
    const lines = [{ text: `${indentation}${opening}`, pointer }];
    entries.forEach(([key, child], index) => {
        const childPointer = pointerChild(pointer, key);
        const childLines = jsonLines(child, depth + 1, childPointer);
        if (!Array.isArray(value)) {
            childLines[0] = {
                text: `${"  ".repeat(depth + 1)}${JSON.stringify(key)}: ${childLines[0].text.trimStart()}`,
                pointer: childPointer,
            };
        }
        if (index < entries.length - 1)
            childLines.at(-1).text += ",";
        lines.push(...childLines);
    });
    lines.push({ text: `${indentation}${closing}` });
    return lines;
}
function naturalList(values) {
    if (values.length < 2)
        return values.length ? String(values[0]) : "";
    if (values.length === 2)
        return `${values[0]} or ${values[1]}`;
    return `${values.slice(0, -1).join(", ")}, or ${values.at(-1)}`;
}
export function expectedResponseLine(correction) {
    const presentation = correction.responsePresentation;
    if (!presentation)
        return undefined;
    if (presentation.kind === "constraint") {
        return `${presentation.property}: ${presentation.allowedValues.join(" OR ")}`;
    }
    const value = presentation.quoteValue
        ? JSON.stringify(presentation.value)
        : String(presentation.value);
    const comment = presentation.allowedValuesComment
        ? `, // must be of type ${naturalList(presentation.allowedValuesComment)}`
        : "";
    return `${presentation.property}: ${value}${comment}`;
}
function expectedLines(report) {
    const inline = new Map(report.expected.corrections.flatMap((correction) => {
        const line = expectedResponseLine(correction);
        return line
            ? [[correction.pointer, line]]
            : [];
    }));
    return jsonLines(report.expected.payload).map((line) => {
        const response = line.pointer ? inline.get(line.pointer) : undefined;
        if (!response)
            return line;
        const indentation = line.text.match(/^\s*/)?.[0] ?? "";
        return { ...line, text: `${indentation}${response}` };
    });
}
function expectedPresentation(report) {
    return expectedLines(report).map(({ text }) => text).join("\n");
}
export function actualDifferenceDescription(difference) {
    switch (difference.violation) {
        case "Undeclared property": return "undeclared property is present in the actual payload";
        case "Required value": return "required property is missing from the actual payload";
        case "Value is not allowed": return "actual value is not allowed";
        case "Type mismatch": return "actual value has the wrong type";
        case "Value is not exact": return "actual value does not equal the required value";
        case undefined: return "validation failed";
        default: return `validation failed: ${difference.violation}`;
    }
}
export function expectedDifferenceDescription(correction) {
    switch (correction.operation) {
        case "add": return "was added to the expected payload";
        case "replace": return "was replaced in the expected payload";
        case "remove": return "was removed from the expected payload";
        case "none": return undefined;
    }
}
function actualDifferenceLine(difference) {
    return `Actual · ${difference.issueId ?? "legacy"} · ${difference.marker} ${difference.pointer} · ${actualDifferenceDescription(difference)}`;
}
function expectedDifferenceLine(correction) {
    const description = expectedDifferenceDescription(correction);
    return description
        ? `Expected · ${correction.issueId} · ${correction.operation} · + ${correction.pointer} · ${description}`
        : undefined;
}
function reportSections(report) {
    const expectedNarrative = report.expectedExplanation.trim() ? report.expectedExplanation : "";
    const components = reportComponents(report);
    return [
        ["Summary", report.summary],
        ["Description", report.description],
        ...(report.event.flowContext ? [["Manual Flow test path", JSON.stringify(report.event.flowContext, null, 2)]] : []),
        ["Steps to reproduce", report.reproductionSteps.map(({ text }) => text).join("\n")],
        ["Actual result", JSON.stringify(report.actual.payload, null, 2)],
        ["Expected result", `${expectedNarrative}\n${expectedPresentation(report)}`.trim()],
        ...(components.differences ? [["Differences", [
                    ...report.actual.differences.map(actualDifferenceLine),
                    ...report.expected.corrections.flatMap((correction) => {
                        const line = expectedDifferenceLine(correction);
                        return line ? [line] : [];
                    }),
                ].join("\n")]] : []),
        ...(components.validationRules || components.captureMetadata ? [["Validation evidence", ""]] : []),
        ...(components.validationRules ? [["Validation rules covered", JSON.stringify({ schema: report.evidence.schema, validation: report.evidence.validation }, null, 2)]] : []),
        ...(components.captureMetadata ? [["Capture metadata", JSON.stringify(report.evidence.capture, null, 2)]] : []),
        ...(report.timeline.length ? [["Supporting timeline", report.timeline.map((entry) => JSON.stringify(entry)).join("\n")]] : []),
    ];
}
function highlightedJson(payload, pointers, backgroundColor) {
    const selected = new Set(pointers.map((pointer) => `/${pointerSegments(pointer)
        .map((segment) => segment.replaceAll("~", "~0").replaceAll("/", "~1"))
        .join("/")}`));
    const serialized = JSON.stringify(payload);
    const canonicalPayload = serialized === undefined ? null : JSON.parse(serialized);
    return jsonLines(canonicalPayload).map((line) => {
        if (!line.pointer || !selected.has(line.pointer))
            return escapeHtml(line.text);
        return `<span style="background-color:${backgroundColor};color:#1f1f1f" data-json-pointer="${escapeHtml(line.pointer)}">${escapeHtml(line.text)}</span>`;
    }).join("\n");
}
function highlightedExpected(report) {
    const selected = new Set(report.expected.corrections
        .filter(({ operation, responsePresentation }) => operation !== "none" || responsePresentation)
        .map(({ pointer }) => pointer));
    return expectedLines(report).map((line) => {
        if (!line.pointer || !selected.has(line.pointer))
            return escapeHtml(line.text);
        return `<span style="background-color:#d9f7d9;color:#1f1f1f" data-json-pointer="${escapeHtml(line.pointer)}">${escapeHtml(line.text)}</span>`;
    }).join("\n");
}
export function renderJiraReport(report) {
    const actualJson = JSON.stringify(report.actual.payload, null, 2);
    const expectedJson = JSON.stringify(report.expected.payload, null, 2);
    const sections = reportSections(report);
    const differenceHtml = [
        ...report.actual.differences.map((difference) => `<li style="background-color:#ffd7d7;color:#1f1f1f" data-difference-group="actual" data-issue-id="${escapeHtml(difference.issueId ?? "legacy")}" data-json-pointer="${escapeHtml(difference.pointer)}"${difference.violation ? ` data-violation="${escapeHtml(difference.violation)}"` : ""}${difference.actualPresence ? ` data-actual-presence="${difference.actualPresence}"` : ""}>${escapeHtml(actualDifferenceLine(difference))}</li>`),
        ...report.expected.corrections.flatMap((correction) => {
            const line = expectedDifferenceLine(correction);
            return line
                ? [`<li style="background-color:#d9f7d9;color:#1f1f1f" data-difference-group="expected" data-issue-id="${escapeHtml(correction.issueId)}" data-operation="${correction.operation}" data-json-pointer="${escapeHtml(correction.pointer)}">${escapeHtml(line)}</li>`]
                : [];
        }),
    ].join("");
    const html = sections.map(([heading, content]) => {
        if (heading === "Differences")
            return `<h2>${heading}</h2><ul>${differenceHtml}</ul>`;
        if (heading === "Validation evidence")
            return `<h2>${heading}</h2>`;
        if (heading === "Steps to reproduce") {
            return `<h2>${heading}</h2><ol>${report.reproductionSteps.map(({ text }) => `<li>${escapeHtml(text.replace(/^\d+\.\s*/, ""))}</li>`).join("")}</ol>`;
        }
        if (heading === "Actual result") {
            return `<h2>${heading}</h2><pre style="font-family:monospace;white-space:pre-wrap">${highlightedJson(report.actual.payload, report.actual.differences.map(({ pointer }) => pointer), "#ffd7d7")}</pre>`;
        }
        if (heading === "Expected result") {
            const presentation = expectedPresentation(report);
            const narrative = content.slice(0, Math.max(0, content.lastIndexOf("\n" + presentation)));
            return `<h2>${heading}</h2><p>${escapeHtml(narrative).replaceAll("\n", "<br>")}</p><pre style="font-family:monospace;white-space:pre-wrap">${highlightedExpected(report)}</pre>`;
        }
        const structured = heading === "Actual result" || heading === "Expected result" || heading === "Manual Flow test path" || heading === "Validation rules covered" || heading === "Capture metadata" || heading === "Supporting timeline";
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
//# sourceMappingURL=data-layer-defect-report-export.js.map