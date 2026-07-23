import { applyExpectedResult, copyDefectReportForJira, createDefectReport, editReportDetails, generateReportDetails, renderJiraReport, reportComponents, updateReportComponents, } from "./data-layer-defect-report.js";
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
export function renderDefectReportBuilder(root, event, clipboard = browserDefectReportClipboard(), sessionEvents = [event], navigation, persistence) {
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
    const reportSections = document.createElement("fieldset");
    reportSections.setAttribute("aria-label", "Report sections");
    reportSections.append(heading("h5", "Report sections"));
    const preview = document.createElement("section");
    preview.setAttribute("aria-label", "Final report preview");
    const feedback = document.createElement("output");
    feedback.setAttribute("aria-live", "polite");
    const duplicateReview = document.createElement("section");
    duplicateReview.setAttribute("aria-label", "Existing defects");
    duplicateReview.hidden = true;
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copy for Jira Cloud";
    copy.dataset.actionVariant = "primary";
    const title = heading("h4", event.manualFlowContext
        ? `Defect report: ${event.manualFlowContext.flowName} · ${event.manualFlowContext.selectedStepName} · ${event.name}`
        : `Defect report: ${event.name}`);
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
    const persist = async (copyAfterSave, saveSeparately = false) => {
        if (!persistence)
            return;
        const result = await persistence.save(lastGenerated, { copy: copyAfterSave, saveSeparately });
        feedback.textContent = result.feedback;
        duplicateReview.replaceChildren();
        duplicateReview.hidden = !result.existing?.length;
        if (result.existing?.length) {
            duplicateReview.append(heading("h5", "This issue is already reported"));
            for (const existing of result.existing)
                duplicateReview.append(Object.assign(document.createElement("button"), { type: "button", textContent: `Open existing defect · ${existing.label}`, onclick: () => persistence.openExisting(existing.id) }));
            const update = document.createElement("button");
            update.type = "button";
            update.textContent = "Update existing defect";
            update.onclick = () => persistence.updateExisting(result.existing[0].id, lastGenerated);
            const separate = document.createElement("button");
            separate.type = "button";
            separate.textContent = "Save separately";
            separate.onclick = () => { void persist(copyAfterSave, true); };
            duplicateReview.append(update, separate);
        }
    };
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
    const componentControl = (label, key) => {
        const wrapper = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = reportComponents(report)[key];
        checkbox.addEventListener("change", () => { report = updateReportComponents(report, { [key]: checkbox.checked }); refresh(); });
        wrapper.append(checkbox, ` ${label}`);
        return wrapper;
    };
    reportSections.append(componentControl("Include differences list", "differences"), componentControl("Include validation rules covered", "validationRules"), componentControl("Include capture metadata", "captureMetadata"));
    appendIssueControls(issues, expectedControls, state, selectedChoices);
    appendReproductionControls(reproductionControls, reproductionSteps, context, state);
    appendTimelineControls(timelineFilters, timelineList, context, state);
    appendDetailControls(detailControls, detailEdits, refresh);
    const persistenceActions = document.createElement("section");
    persistenceActions.setAttribute("aria-label", "Defect actions");
    if (persistence) {
        const save = document.createElement("button");
        save.type = "button";
        save.textContent = "Save defect";
        save.onclick = () => { void persist(false); };
        const saveAndCopy = document.createElement("button");
        saveAndCopy.type = "button";
        saveAndCopy.textContent = "Save defect and copy";
        saveAndCopy.onclick = () => { void persist(true); };
        persistenceActions.append(save, saveAndCopy);
    }
    root.replaceChildren(builderHeader, heading("h5", "Validation issues"), issues, heading("h5", "Expected result"), expectedControls, heading("h5", "Steps to reproduce"), reproductionControls, reproductionSteps, heading("h5", "Supporting timeline"), timelineFilters, timelineList, heading("h5", "Report details"), detailControls, reportSections, preview, copy, persistenceActions, duplicateReview, feedback);
    refresh();
    title.focus({ preventScroll: true });
}
//# sourceMappingURL=data-layer-defect-report-ui.js.map