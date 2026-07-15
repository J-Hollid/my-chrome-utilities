import type {
  DefectReport,
  ReproductionStep,
  SupportingTimelineEntry,
} from "./data-layer-defect-report.js";

export interface ComposableDefectReport {
  reproductionSteps: ReproductionStep[];
  timeline: SupportingTimelineEntry[];
}

export interface DefectReportBuilderState<Report extends ComposableDefectReport = DefectReport> {
  report(): Report;
  update(report: Report): void;
  refresh(): void;
}

export type DefectReportDetailField = "summary" | "description" | "expectedExplanation" | "expectedResultAdditionalText";

export function appendDetailControls(
  controls: HTMLElement,
  edits: Partial<Record<DefectReportDetailField, string>>,
  refresh: () => void,
  expectedResult: {
    field: "expectedExplanation" | "expectedResultAdditionalText";
    label: string;
  } = { field:"expectedExplanation", label:"Expected result explanation" },
): void {
  for (const [field, labelText, multiline] of [
    ["summary", "Summary", false],
    ["description", "Description", true],
    [expectedResult.field, expectedResult.label, true],
  ] as const) {
    const label = document.createElement("label"); label.textContent = `${labelText} `;
    const input = multiline ? document.createElement("textarea") : document.createElement("input");
    input.dataset.reportField = field;
    input.addEventListener("input", () => { input.dataset.edited = "true"; edits[field] = input.value; refresh(); });
    label.append(input); controls.append(label);
  }
}
