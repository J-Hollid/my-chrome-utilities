import { renderJiraReport } from "./data-layer-defect-report-export.js";
import { renderOccurrenceReport } from "./data-layer-event-occurrence-defect-report.js";
import { generateMissingEventRepresentations } from "./data-layer-missing-event-defect-report.js";
export function storedDefectRepresentations(defect) {
    if (defect.type === "Missing event") {
        const rendered = generateMissingEventRepresentations(defect.report);
        return { html: rendered.previewHtml, text: rendered.jiraText };
    }
    if (defect.type === "Unexpected event" || defect.type === "Wrong event name") {
        const rendered = renderOccurrenceReport(defect.report);
        return { html: rendered.html, text: rendered.text };
    }
    const rendered = renderJiraReport(defect.report);
    return { html: rendered.html, text: rendered.text };
}
export async function copyStoredDefectForJira(defect, clipboard) {
    const rendered = storedDefectRepresentations(defect);
    if (clipboard.writeRich) {
        try {
            await clipboard.writeRich(rendered.html, rendered.text);
            return { status: "success", feedback: "Report copied for Jira Cloud with rich formatting." };
        }
        catch {
            // Preserve a usable plain-text fallback when rich clipboard writing fails.
        }
    }
    if (clipboard.writeText) {
        try {
            await clipboard.writeText(rendered.text);
            return { status: "warning", feedback: "Report copied as plain text; rich formatting was not copied." };
        }
        catch {
            // Report the failure without changing the stored defect.
        }
    }
    return { status: "failure", feedback: "Copy failed. The saved defect is unchanged." };
}
//# sourceMappingURL=data-layer-defect-library-copy.js.map