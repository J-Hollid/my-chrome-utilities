import {
  applyExpectedResult,
  copyDefectReportForJira,
  createDefectReport,
  editReportDetails,
  generateReportDetails,
  renderJiraReport,
  type DefectReport,
  type DefectReportBuilderNavigation,
  type DefectReportClipboard,
  type ExpectedResultChoice,
} from "./data-layer-defect-report.js";
import {
  browserDefectReportClipboard,
  defectCapturedEvent,
  defectReportContext,
} from "./data-layer-defect-report-browser.js";
import {
  appendDetailControls,
  type DefectReportBuilderState,
} from "./data-layer-defect-report-ui-controls.js";
import { appendReproductionControls } from "./data-layer-defect-report-reproduction-controls.js";
import { appendIssueControls } from "./data-layer-defect-report-issue-controls.js";
import { appendTimelineControls } from "./data-layer-defect-report-timeline-controls.js";
import type { LiveEvent } from "./data-layer-live-observer.js";

export { browserDefectReportClipboard, createDefectReportNavigation, createLiveDefectReportNavigation, defectCapturedEvent, defectReportContext } from "./data-layer-defect-report-browser.js";
export type { DefectReportContext, DefectReportNavigationEffects, LiveDefectReportNavigationEffects } from "./data-layer-defect-report-browser.js";

function heading(level: "h4" | "h5", text: string): HTMLHeadingElement {
  const element = document.createElement(level);
  element.textContent = text;
  return element;
}

export function renderDefectReportBuilder(
  root: HTMLElement,
  event: LiveEvent,
  clipboard: DefectReportClipboard = browserDefectReportClipboard(),
  sessionEvents: readonly LiveEvent[] = [event],
  navigation?: DefectReportBuilderNavigation,
): void {
  let report = createDefectReport(defectCapturedEvent(event));
  const context = defectReportContext(sessionEvents, event.id);
  const selectedChoices = new Map<string, ExpectedResultChoice>();
  const detailEdits: Partial<Record<"summary" | "description" | "expectedExplanation", string>> = {};
  const issues = document.createElement("fieldset");
  const expectedControls = document.createElement("div");
  const reproductionControls = document.createElement("div");
  const reproductionSteps = document.createElement("ol");
  const timelineFilters = document.createElement("div"); timelineFilters.className = "defect-timeline-composer"; timelineFilters.setAttribute("aria-label", "Timeline composer");
  const timelineList = document.createElement("ul"); timelineList.className = "defect-timeline-entries"; timelineList.setAttribute("aria-label", "Supporting timeline entries");
  const detailControls = document.createElement("div");
  const preview = document.createElement("section"); preview.setAttribute("aria-label", "Final report preview");
  const feedback = document.createElement("output"); feedback.setAttribute("aria-live", "polite");
  const copy = document.createElement("button"); copy.type = "button"; copy.textContent = "Copy for Jira Cloud"; copy.dataset.actionVariant = "primary";
  const title = heading("h4", `Defect report: ${event.name}`); title.tabIndex = -1;
  const builderHeader = document.createElement("header"); builderHeader.className = "detail-view-header";
  const backToEvent = document.createElement("button"); backToEvent.type = "button"; backToEvent.textContent = "Back to captured event"; backToEvent.dataset.actionVariant = "quiet";
  const backToFeed = document.createElement("button"); backToFeed.type = "button"; backToFeed.textContent = "Back to Live feed"; backToFeed.dataset.actionVariant = "quiet";
  backToEvent.disabled = !navigation; backToFeed.disabled = !navigation;
  backToEvent.addEventListener("click", () => navigation?.backToCapturedEvent());
  backToFeed.addEventListener("click", () => navigation?.backToLiveFeed());
  builderHeader.append(backToEvent, backToFeed, title);

  let lastGenerated = generateReportDetails(report);
  const refresh = () => {
    let corrected: DefectReport = report;
    try { corrected = applyExpectedResult(report, [...selectedChoices.values()]); feedback.textContent = ""; }
    catch (error) { feedback.textContent = error instanceof Error ? error.message : "Expected result is incomplete."; }
    lastGenerated = editReportDetails(generateReportDetails(corrected), detailEdits);
    for (const input of Array.from(detailControls.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-report-field]"))) {
      const field = input.dataset.reportField as keyof typeof detailEdits;
      if (input.dataset.edited !== "true") input.value = lastGenerated[field];
    }
    preview.innerHTML = renderJiraReport(lastGenerated).html;
    copy.onclick = () => { void copyDefectReportForJira(lastGenerated, clipboard).then((result) => { feedback.textContent = result.feedback; }); };
  };
  const state: DefectReportBuilderState = {
    report: () => report,
    update(next) { report = next; },
    refresh,
  };

  appendIssueControls(issues, expectedControls, state, selectedChoices);
  appendReproductionControls(reproductionControls, reproductionSteps, context, state);
  appendTimelineControls(timelineFilters, timelineList, context, state);
  appendDetailControls(detailControls, detailEdits, refresh);
  root.replaceChildren(
    builderHeader,
    heading("h5", "Validation issues"), issues,
    heading("h5", "Expected result"), expectedControls,
    heading("h5", "Steps to reproduce"), reproductionControls, reproductionSteps,
    heading("h5", "Supporting timeline"), timelineFilters, timelineList,
    heading("h5", "Report details"), detailControls,
    preview, copy, feedback,
  );
  refresh(); title.focus({ preventScroll: true });
}
