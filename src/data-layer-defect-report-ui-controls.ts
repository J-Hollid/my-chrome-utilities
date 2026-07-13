import type { DefectReport } from "./data-layer-defect-report.js";

export interface DefectReportBuilderState {
  report(): DefectReport;
  update(report: DefectReport): void;
  refresh(): void;
}

export function appendDetailControls(
  controls: HTMLElement,
  edits: Partial<Record<"summary" | "description" | "expectedExplanation", string>>,
  refresh: () => void,
): void {
  for (const [field, labelText, multiline] of [
    ["summary", "Summary", false],
    ["description", "Description", true],
    ["expectedExplanation", "Expected result explanation", true],
  ] as const) {
    const label = document.createElement("label"); label.textContent = `${labelText} `;
    const input = multiline ? document.createElement("textarea") : document.createElement("input");
    input.dataset.reportField = field;
    input.addEventListener("input", () => { input.dataset.edited = "true"; edits[field] = input.value; refresh(); });
    label.append(input); controls.append(label);
  }
}
