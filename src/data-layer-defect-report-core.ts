import { cloneValue, pointerSegments, pointerValue, updatePointer } from "./data-layer-defect-report-json.js";
import type {
  DefectCapturedEvent,
  DefectIssue,
  DefectReport,
  ExpectedCorrection,
  ExpectedResponsePresentation,
  ExpectedResultAssistance,
  ExpectedResultChoice,
  ReportDifference,
  ReportIssue,
} from "./data-layer-defect-report-model.js";

function normalizedConstraint(constraint: string): string {
  return /^must\b/i.test(constraint) ? constraint : `must be ${constraint}`;
}

function allowedValues(issue: Pick<DefectIssue, "constraint" | "allowedValues">): Array<string | number | boolean | null> {
  if (issue.allowedValues?.length) return [...issue.allowedValues];
  const match = issue.constraint.match(/(?:must\s+be\s+)?one\s+of\s+(.+)$/i);
  if (!match?.[1]) return [];
  return match[1].split(/\s*(?:,|\bor\b)\s*/i).map((value) => value.trim()).filter(Boolean);
}

function assistanceConstraint(issue: DefectIssue): string {
  const values = allowedValues(issue);
  if (!values.length || (!issue.allowedValues?.length && /\bone\s+of\b/i.test(issue.constraint))) return normalizedConstraint(issue.constraint);
  const last = values.at(-1);
  return `must be one of ${values.length === 1 ? last : `${values.slice(0, -1).join(", ")} or ${last}`}`;
}

export function expectedResultAssistance(issue: DefectIssue): ExpectedResultAssistance {
  return {
    genericConstraint: `${issue.pointer} ${assistanceConstraint(issue)}`,
    schemaValues: allowedValues(issue).filter((value) => !Object.is(value, issue.actual)),
    customAvailable: true,
    ...(issue.schemaChoiceProvenance ? { provenance:structuredClone(issue.schemaChoiceProvenance) } : {}),
    ...(issue.schemaChoiceConflict ? { conflict:issue.schemaChoiceConflict } : {}),
  };
}

export function validateAssistedResponse(
  issue: DefectIssue,
  response: unknown,
): { valid: true } | { valid: false; warning: string } {
  const values = allowedValues(issue);
  if (!values.length || values.some((value) => Object.is(value, response))) return { valid: true };
  return { valid: false, warning: `${String(response)} does not satisfy the current schema constraint.` };
}

function issueName(issue: DefectIssue): string {
  return pointerSegments(issue.pointer).at(-1) ?? issue.id;
}

export function isUndeclaredPropertyIssue(issue: DefectIssue): boolean {
  return issue.violation === "Undeclared property";
}

export function isRequiredPropertyViolation(violation: string | undefined): boolean {
  return violation === "Required value";
}

export function isRequiredPropertyIssue(issue: DefectIssue): boolean {
  return isRequiredPropertyViolation(issue.violation);
}

function undeclaredPropertyChoice(issue: ReportIssue): ExpectedResultChoice {
  return {
    issueId: issue.id,
    method: "apply the rule",
    responseSource: "schema declared-property policy",
  };
}

function responsePresentation(
  issue: DefectIssue,
  choice: ExpectedResultChoice,
): ExpectedResponsePresentation | undefined {
  const property = issueName(issue);
  const values = allowedValues(issue);
  if (choice.method === "keep the rule generic") {
    return values.length ? { kind: "constraint", property, allowedValues: values } : undefined;
  }
  if (choice.method === "apply the rule" || choice.response === undefined) return undefined;
  return {
    kind: "value",
    property,
    value: cloneValue(choice.response),
    quoteValue: choice.includeAllowedValuesComment !== undefined,
    ...(choice.includeAllowedValuesComment && values.length ? { allowedValuesComment: values } : {}),
  };
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
  const report: DefectReport = {
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
  return applyExpectedResult(report, []);
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
  const applicableChoices = choices.filter(({ issueId }) => {
    const issue = report.issues.find(({ id }) => id === issueId);
    return !issue || !isRequiredPropertyIssue(issue) || issue.selected;
  });
  const explicitlyChosen = new Set(applicableChoices.map(({ issueId }) => issueId));
  const effectiveChoices = [
    ...report.issues.filter((issue) => issue.selected && isUndeclaredPropertyIssue(issue) && !explicitlyChosen.has(issue.id)).map(undeclaredPropertyChoice),
    ...applicableChoices,
  ];
  for (const choice of effectiveChoices) {
    const issue = report.issues.find(({ id }) => id === choice.issueId);
    if (!issue) throw new Error(`Unknown report issue: ${choice.issueId}`);
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
      explanations.push(allowedValues(issue).length
        ? expectedResultAssistance(issue).genericConstraint
        : `${name} satisfies its validation rule`);
      continue;
    }
    if (choice.method === "apply the rule") {
      if (!isUndeclaredPropertyIssue(issue) && !/forbidden/i.test(issue.constraint)) throw new Error(`The ${issue.id} rule cannot be applied without a response.`);
      updatePointer(payload, issue.pointer, "remove");
      corrections.push({ issueId: issue.id, pointer: issue.pointer, operation: "remove", marker: "+", ...(choice.responseSource ? { responseSource: choice.responseSource } : {}) });
      explanations.push(isUndeclaredPropertyIssue(issue) ? `${issue.pointer} is removed as an undeclared property` : `${name} is absent`);
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
      ...(choice.responseProvenance ? { responseProvenance:structuredClone(choice.responseProvenance) } : {}),
    });
    explanations.push(`${name} is ${String(choice.response)}${choice.operatorProvided ? " (operator-provided Custom value or response)" : ""}`);
  }
  return { ...report, expected: { payload, corrections, explanations } };
}
