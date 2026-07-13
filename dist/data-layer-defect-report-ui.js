import { applyExpectedResult, copyDefectReportForJira, createDefectReport, editReportDetails, generateReportDetails, renderJiraReport, } from "./data-layer-defect-report.js";
import { browserDefectReportClipboard, defectCapturedEvent, defectReportContext, } from "./data-layer-defect-report-browser.js";
import { appendDetailControls, } from "./data-layer-defect-report-ui-controls.js";
import { appendReproductionControls } from "./data-layer-defect-report-reproduction-controls.js";
import { appendIssueControls } from "./data-layer-defect-report-issue-controls.js";
import { appendTimelineControls } from "./data-layer-defect-report-timeline-controls.js";
export { browserDefectReportClipboard, createDefectReportNavigation, createLiveDefectReportNavigation, defectCapturedEvent, defectReportContext } from "./data-layer-defect-report-browser.js";
function heading(level, text) {
    const element = document.createElement(level);
    element.textContent = text;
    return element;
}
export function renderDefectReportBuilder(root, event, clipboard = browserDefectReportClipboard(), sessionEvents = [event], navigation) {
    let report = createDefectReport(defectCapturedEvent(event));
    const context = defectReportContext(sessionEvents, event.id);
    const selectedChoices = new Map();
    const detailEdits = {};
    const issues = document.createElement("fieldset");
    const expectedControls = document.createElement("div");
    const reproductionControls = document.createElement("div");
    const reproductionSteps = document.createElement("ol");
    const timelineFilters = document.createElement("div");
    timelineFilters.className = "defect-timeline-composer";
    timelineFilters.setAttribute("aria-label", "Timeline composer");
    const timelineList = document.createElement("ul");
    timelineList.className = "defect-timeline-entries";
    timelineList.setAttribute("aria-label", "Supporting timeline entries");
    const detailControls = document.createElement("div");
    const preview = document.createElement("section");
    preview.setAttribute("aria-label", "Final report preview");
    const feedback = document.createElement("output");
    feedback.setAttribute("aria-live", "polite");
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copy for Jira Cloud";
    copy.dataset.actionVariant = "primary";
    const title = heading("h4", `Defect report: ${event.name}`);
    title.tabIndex = -1;
    const builderHeader = document.createElement("header");
    builderHeader.className = "detail-view-header";
    const backToEvent = document.createElement("button");
    backToEvent.type = "button";
    backToEvent.textContent = "Back to captured event";
    backToEvent.dataset.actionVariant = "quiet";
    const backToFeed = document.createElement("button");
    backToFeed.type = "button";
    backToFeed.textContent = "Back to Live feed";
    backToFeed.dataset.actionVariant = "quiet";
    backToEvent.disabled = !navigation;
    backToFeed.disabled = !navigation;
    backToEvent.addEventListener("click", () => navigation?.backToCapturedEvent());
    backToFeed.addEventListener("click", () => navigation?.backToLiveFeed());
    builderHeader.append(backToEvent, backToFeed, title);
    let lastGenerated = generateReportDetails(report);
    const refresh = () => {
        let corrected = report;
        try {
            corrected = applyExpectedResult(report, [...selectedChoices.values()]);
            feedback.textContent = "";
        }
        catch (error) {
            feedback.textContent = error instanceof Error ? error.message : "Expected result is incomplete.";
        }
        lastGenerated = editReportDetails(generateReportDetails(corrected), detailEdits);
        for (const input of Array.from(detailControls.querySelectorAll("[data-report-field]"))) {
            const field = input.dataset.reportField;
            if (input.dataset.edited !== "true")
                input.value = lastGenerated[field];
        }
        preview.innerHTML = renderJiraReport(lastGenerated).html;
        copy.onclick = () => { void copyDefectReportForJira(lastGenerated, clipboard).then((result) => { feedback.textContent = result.feedback; }); };
    };
    const state = {
        report: () => report,
        update(next) { report = next; },
        refresh,
    };
    appendIssueControls(issues, expectedControls, state, selectedChoices);
    appendReproductionControls(reproductionControls, reproductionSteps, context, state);
    appendTimelineControls(timelineFilters, timelineList, context, state);
    appendDetailControls(detailControls, detailEdits, refresh);
    root.replaceChildren(builderHeader, heading("h5", "Validation issues"), issues, heading("h5", "Expected result"), expectedControls, heading("h5", "Steps to reproduce"), reproductionControls, reproductionSteps, heading("h5", "Supporting timeline"), timelineFilters, timelineList, heading("h5", "Report details"), detailControls, preview, copy, feedback);
    refresh();
    title.focus({ preventScroll: true });
}
//# sourceMappingURL=data-layer-defect-report-ui.js.map