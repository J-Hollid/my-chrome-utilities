import { cloneValue, pointerSegments, pointerValue, updatePointer } from "./data-layer-defect-report-json.js";
import type {
  DefectCapturedEvent,
  DefectIssue,
  DefectReport,
  ExpectedCorrection,
  ExpectedResultChoice,
  ReportDifference,
  ReportIssue,
} from "./data-layer-defect-report-model.js";

function issueName(issue: DefectIssue): string {
  return pointerSegments(issue.pointer).at(-1) ?? issue.id;
}

function actualDifferences(payload: unknown, issues: readonly ReportIssue[]): ReportDifference[] {
  return issues.filter(({ selected }) => selected).map((issue) => ({
    pointer: issue.pointer,
    marker: "−",
    treatment: "red",
    value: cloneValue(pointerValue(payload, issue.pointer)),
  }));
}

export function createDefectReport(event: DefectCapturedEvent): DefectReport {
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

export function toggleReportIssue(report: DefectReport, issueId: string): DefectReport {
  if (!report.issues.some(({ id }) => id === issueId)) throw new Error(`Unknown report issue: ${issueId}`);
  const issues = report.issues.map((issue) => issue.id === issueId ? { ...issue, selected: !issue.selected } : issue);
  return {
    ...report,
    issues,
    actual: { payload: report.actual.payload, differences: actualDifferences(report.actual.payload, issues) },
  };
}

export function applyExpectedResult(
  report: DefectReport,
  choices: readonly ExpectedResultChoice[],
): DefectReport {
  const payload = cloneValue(report.event.payload);
  const corrections: ExpectedCorrection[] = [];
  const explanations: string[] = [];
  for (const choice of choices) {
    const issue = report.issues.find(({ id }) => id === choice.issueId);
    if (!issue) throw new Error(`Unknown report issue: ${choice.issueId}`);
    const name = issueName(issue);
    if (choice.method === "keep the rule generic") {
      corrections.push({ issueId: issue.id, pointer: issue.pointer, operation: "none" });
      explanations.push(`${name} satisfies its validation rule`);
      continue;
    }
    if (choice.method === "apply the rule") {
      if (!/forbidden/i.test(issue.constraint)) throw new Error(`The ${issue.id} rule cannot be applied without a response.`);
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
    corrections.push({ issueId: issue.id, pointer: issue.pointer, operation, response: cloneValue(choice.response), marker: "+" });
    explanations.push(`${name} is ${String(choice.response)}`);
  }
  return { ...report, expected: { payload, corrections, explanations } };
}
