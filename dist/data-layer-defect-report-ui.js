import { applyExpectedResult, copyDefectReportForJira, createDefectReport, generateReportDetails, renderJiraReport, toggleReportIssue, } from "./data-layer-defect-report.js";
function issueId(pointer, index) {
    return pointer.split("/").filter(Boolean).at(-1) ?? `issue-${index + 1}`;
}
export function defectCapturedEvent(event) {
    const schema = event.validationDetails?.schema;
    return {
        id: event.id,
        name: event.name,
        source: event.sourceName ?? event.sourceId,
        pageUrl: event.pageUrl ?? "",
        pathname: (() => { try {
            return new URL(event.pageUrl ?? "https://local.invalid/").pathname;
        }
        catch {
            return "/";
        } })(),
        captureTime: event.captureTime,
        payload: event.payload,
        schema: { name: schema?.name ?? "Assigned schema", version: schema?.version ?? 0 },
        issues: (event.validationDetails?.issues ?? []).map((issue, index) => ({
            id: issueId(issue.instancePath, index),
            severity: issue.severity === "warning" ? "warning" : "error",
            pointer: issue.instancePath || "/",
            constraint: issue.expected,
            actual: issue.actual,
            rule: issue.rule ?? issue.schemaLocation,
            ruleVersion: Number(issue.rule?.match(/ v(\d+)$/)?.[1] ?? 0),
        })),
    };
}
export function browserDefectReportClipboard() {
    return {
        ...(typeof navigator.clipboard?.write === "function" && typeof ClipboardItem !== "undefined" ? {
            async writeRich(html, text) {
                await navigator.clipboard.write([new ClipboardItem({
                        "text/html": new Blob([html], { type: "text/html" }),
                        "text/plain": new Blob([text], { type: "text/plain" }),
                    })]);
            },
        } : {}),
        ...(typeof navigator.clipboard?.writeText === "function" ? {
            async writeText(text) { await navigator.clipboard.writeText(text); },
        } : {}),
    };
}
export function renderDefectReportBuilder(root, event, clipboard = browserDefectReportClipboard()) {
    let report = createDefectReport(defectCapturedEvent(event));
    const heading = document.createElement("h4");
    heading.textContent = `Defect report: ${event.name}`;
    heading.tabIndex = -1;
    const issueHeading = document.createElement("h5");
    issueHeading.textContent = "Validation issues";
    const issues = document.createElement("fieldset");
    const expectedHeading = document.createElement("h5");
    expectedHeading.textContent = "Expected result";
    const expectedControls = document.createElement("div");
    const preview = document.createElement("section");
    preview.setAttribute("aria-label", "Final report preview");
    const feedback = document.createElement("output");
    feedback.setAttribute("aria-live", "polite");
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copy for Jira Cloud";
    copy.dataset.actionVariant = "primary";
    const selectedChoices = new Map();
    const refresh = () => {
        let corrected = report;
        try {
            corrected = applyExpectedResult(report, [...selectedChoices.values()]);
            feedback.textContent = "";
        }
        catch (error) {
            feedback.textContent = error instanceof Error ? error.message : "Expected result is incomplete.";
        }
        const generated = generateReportDetails(corrected);
        const rendered = renderJiraReport(generated);
        preview.innerHTML = rendered.html;
        copy.onclick = () => { void copyDefectReportForJira(generated, clipboard).then((result) => { feedback.textContent = result.feedback; }); };
    };
    for (const reportIssue of report.issues) {
        const row = document.createElement("div");
        const selected = document.createElement("input");
        selected.type = "checkbox";
        selected.checked = reportIssue.selected;
        selected.id = `defect-issue-${reportIssue.id}`;
        selected.addEventListener("change", () => { report = toggleReportIssue(report, reportIssue.id); refresh(); });
        const label = document.createElement("label");
        label.htmlFor = selected.id;
        label.textContent = `${reportIssue.severity}: ${reportIssue.pointer} — ${reportIssue.constraint}`;
        row.append(selected, label);
        issues.append(row);
        const methodLabel = document.createElement("label");
        methodLabel.textContent = `${reportIssue.id} correction `;
        const method = document.createElement("select");
        for (const value of ["", "choose an allowed value", "enter a valid response", "apply the rule", "keep the rule generic"]) {
            method.append(Object.assign(document.createElement("option"), { value, textContent: value || "Choose method" }));
        }
        const response = document.createElement("input");
        response.placeholder = "Valid response";
        const updateChoice = () => {
            if (!method.value)
                selectedChoices.delete(reportIssue.id);
            else
                selectedChoices.set(reportIssue.id, { issueId: reportIssue.id, method: method.value, ...(response.value ? { response: response.value } : {}) });
            refresh();
        };
        method.addEventListener("change", updateChoice);
        response.addEventListener("input", updateChoice);
        methodLabel.append(method, response);
        expectedControls.append(methodLabel);
    }
    root.replaceChildren(heading, issueHeading, issues, expectedHeading, expectedControls, preview, copy, feedback);
    refresh();
    heading.focus({ preventScroll: true });
}
//# sourceMappingURL=data-layer-defect-report-ui.js.map