import { cloneValue, pointerSegments } from "./data-layer-defect-report-json.js";
import type {
  DefectReport,
  DefectReportClipboard,
  GeneratedDefectReport,
} from "./data-layer-defect-report-model.js";

export function generateReportDetails(report: DefectReport): GeneratedDefectReport {
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

export function editReportDetails(
  report: GeneratedDefectReport,
  edits: Partial<Pick<GeneratedDefectReport, "summary" | "description" | "expectedExplanation">>,
): GeneratedDefectReport {
  return { ...report, ...edits };
}

function escapeHtml(value: unknown): string {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

interface JsonLine {
  text: string;
  pointer?: string;
}

function pointerChild(pointer: string, segment: string): string {
  return `${pointer}/${segment.replaceAll("~", "~0").replaceAll("/", "~1")}`;
}

function jsonLines(value: unknown, depth = 0, pointer = ""): JsonLine[] {
  const indentation = "  ".repeat(depth);
  if (value === null || typeof value !== "object") {
    return [{ text: `${indentation}${JSON.stringify(value)}`, pointer }];
  }
  const entries: Array<[string, unknown]> = Array.isArray(value)
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value);
  const opening = Array.isArray(value) ? "[" : "{";
  const closing = Array.isArray(value) ? "]" : "}";
  const lines: JsonLine[] = [{ text: `${indentation}${opening}`, pointer }];
  entries.forEach(([key, child], index) => {
    const childPointer = pointerChild(pointer, key);
    const childLines = jsonLines(child, depth + 1, childPointer);
    if (!Array.isArray(value)) {
      childLines[0] = {
        text: `${"  ".repeat(depth + 1)}${JSON.stringify(key)}: ${childLines[0]!.text.trimStart()}`,
        pointer: childPointer,
      };
    }
    if (index < entries.length - 1) childLines.at(-1)!.text += ",";
    lines.push(...childLines);
  });
  lines.push({ text: `${indentation}${closing}` });
  return lines;
}

function reportSections(report: GeneratedDefectReport): Array<[string, string]> {
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
    ...(report.timeline.length ? [["Supporting timeline", report.timeline.map((entry) => JSON.stringify(entry)).join("\n")] as [string, string]] : []),
  ];
}

function highlightedJson(
  payload: unknown,
  pointers: readonly string[],
  backgroundColor: string,
): string {
  const selected = new Set(pointers.map((pointer) => `/${pointerSegments(pointer)
    .map((segment) => segment.replaceAll("~", "~0").replaceAll("/", "~1"))
    .join("/")}`));
  const serialized = JSON.stringify(payload);
  const canonicalPayload = serialized === undefined ? null : JSON.parse(serialized) as unknown;
  return jsonLines(canonicalPayload).map((line) => {
    if (!line.pointer || !selected.has(line.pointer)) return escapeHtml(line.text);
    return `<span style="background-color:${backgroundColor}" data-json-pointer="${escapeHtml(line.pointer)}">${escapeHtml(line.text)}</span>`;
  }).join("\n");
}

export function renderJiraReport(report: GeneratedDefectReport): {
  html: string;
  text: string;
  actualJson: string;
  expectedJson: string;
} {
  const actualJson = JSON.stringify(report.actual.payload, null, 2);
  const expectedJson = JSON.stringify(report.expected.payload, null, 2);
  const sections = reportSections(report);
  const differenceHtml = [
    ...report.actual.differences.map(({ pointer }) => `<li style="background-color:#ffd7d7">− <code>${escapeHtml(pointer)}</code> invalid actual value</li>`),
    ...report.expected.corrections.filter(({ operation }) => operation !== "none").map(({ pointer }) => `<li style="background-color:#d9f7d9">+ <code>${escapeHtml(pointer)}</code> corrected expected value</li>`),
  ].join("");
  const html = sections.map(([heading, content]) => {
    if (heading === "Differences") return `<h2>${heading}</h2><ul>${differenceHtml}</ul>`;
    if (heading === "Steps to reproduce") {
      return `<h2>${heading}</h2><ol>${report.reproductionSteps.map(({ text }) => `<li>${escapeHtml(text.replace(/^\d+\.\s*/, ""))}</li>`).join("")}</ol>`;
    }
    if (heading === "Actual result") {
      return `<h2>${heading}</h2><pre style="font-family:monospace;white-space:pre-wrap">${highlightedJson(report.actual.payload, report.actual.differences.map(({ pointer }) => pointer), "#ffd7d7")}</pre>`;
    }
    if (heading === "Expected result") {
      const pointers = report.expected.corrections.filter(({ operation }) => operation !== "none").map(({ pointer }) => pointer);
      return `<h2>${heading}</h2><p>${escapeHtml(report.expectedExplanation)}</p><pre style="font-family:monospace;white-space:pre-wrap">${highlightedJson(report.expected.payload, pointers, "#d9f7d9")}</pre>`;
    }
    const structured = heading === "Actual result" || heading === "Expected result" || heading === "Validation evidence" || heading === "Supporting timeline";
    return `<h2>${heading}</h2>${structured ? `<pre style="font-family:monospace;white-space:pre-wrap">${escapeHtml(content)}</pre>` : `<p>${escapeHtml(content)}</p>`}`;
  }).join("");
  const text = sections.map(([heading, content]) => `${heading}\n${content}`).join("\n\n");
  return { html, text, actualJson, expectedJson };
}

export async function copyDefectReportForJira(
  report: GeneratedDefectReport,
  clipboard: DefectReportClipboard,
): Promise<{ status: "success" | "warning" | "failure"; feedback: string }> {
  const rendered = renderJiraReport(report);
  if (clipboard.writeRich) {
    try {
      await clipboard.writeRich(rendered.html, rendered.text);
      return { status: "success", feedback: "Report copied for Jira Cloud with color highlighting." };
    } catch {
      // The plain-text fallback below preserves a usable report.
    }
  }
  if (clipboard.writeText) {
    try {
      await clipboard.writeText(rendered.text);
      return { status: "warning", feedback: "Report copied as plain text; Jira Cloud color highlighting was not copied." };
    } catch {
      // Failure is reported without mutating the report.
    }
  }
  return { status: "failure", feedback: "Copy failed. The current report is unchanged." };
}
