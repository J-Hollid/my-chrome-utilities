import { renderJiraReport } from "./data-layer-defect-report-export.js";
import type { DefectReportClipboard, GeneratedDefectReport } from "./data-layer-defect-report-model.js";
import { renderOccurrenceReport, type OccurrenceReport } from "./data-layer-event-occurrence-defect-report.js";
import { generateMissingEventRepresentations, type MissingEventReport } from "./data-layer-missing-event-defect-report.js";
import type { ReportedDefect } from "./data-layer-defect-library.js";

export interface StoredDefectCopyResult {
  status: "success" | "warning" | "failure";
  feedback: string;
}

export function storedDefectRepresentations(defect: ReportedDefect): { html:string; text:string } {
  if (defect.type === "Missing event") {
    const rendered = generateMissingEventRepresentations(defect.report as MissingEventReport);
    return { html:rendered.previewHtml, text:rendered.jiraText };
  }
  if (defect.type === "Unexpected event" || defect.type === "Wrong event name") {
    const rendered = renderOccurrenceReport(defect.report as OccurrenceReport);
    return { html:rendered.html, text:rendered.text };
  }
  const rendered = renderJiraReport(defect.report as GeneratedDefectReport);
  return { html:rendered.html, text:rendered.text };
}

export async function copyStoredDefectForJira(
  defect: ReportedDefect,
  clipboard: DefectReportClipboard,
): Promise<StoredDefectCopyResult> {
  const rendered = storedDefectRepresentations(defect);
  if (clipboard.writeRich) {
    try {
      await clipboard.writeRich(rendered.html, rendered.text);
      return { status:"success", feedback:"Report copied for Jira Cloud with rich formatting." };
    } catch {
      // Preserve a usable plain-text fallback when rich clipboard writing fails.
    }
  }
  if (clipboard.writeText) {
    try {
      await clipboard.writeText(rendered.text);
      return { status:"warning", feedback:"Report copied as plain text; rich formatting was not copied." };
    } catch {
      // Report the failure without changing the stored defect.
    }
  }
  return { status:"failure", feedback:"Copy failed. The saved defect is unchanged." };
}
