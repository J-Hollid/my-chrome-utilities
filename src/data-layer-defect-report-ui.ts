import {
  applyExpectedResult,
  copyDefectReportForJira,
  createDefectReport,
  editReportDetails,
  filterTimelineEvents,
  generatePathnameSkeleton,
  generateReportDetails,
  renderJiraReport,
  supportingTimeline,
  toggleReportIssue,
  type DefectCapturedEvent,
  type DefectReport,
  type DefectReportClipboard,
  type ExpectedResultChoice,
  type PathnameVisit,
  type TimelineEvent,
  type TimelineFilter,
  type TimelineSelection,
} from "./data-layer-defect-report.js";
import type { LiveEvent } from "./data-layer-live-observer.js";

function issueId(pointer: string, index: number): string {
  return pointer.split("/").filter(Boolean).at(-1) ?? `issue-${index + 1}`;
}

function pathname(pageUrl: string | undefined): string {
  try { return new URL(pageUrl ?? "https://local.invalid/").pathname; }
  catch { return "/"; }
}

export interface DefectReportContext {
  visits: PathnameVisit[];
  defectVisitId: string;
  timeline: TimelineEvent[];
}

export function defectReportContext(
  events: readonly LiveEvent[],
  defectEventId: string,
): DefectReportContext {
  const chronological = [...events].sort((left, right) => left.captureTime.localeCompare(right.captureTime));
  const visits: PathnameVisit[] = [];
  for (const event of chronological) {
    const eventPathname = pathname(event.pageUrl);
    const latest = visits.at(-1);
    if (latest?.pathname === eventPathname) latest.eventIds = [...latest.eventIds, event.id];
    else visits.push({ id: `visit-${visits.length + 1}`, pathname: eventPathname, eventIds: [event.id] });
  }
  const defectVisitId = visits.find(({ eventIds }) => eventIds.includes(defectEventId))?.id ?? visits.at(-1)?.id ?? "";
  return {
    visits,
    defectVisitId,
    timeline: chronological.map((event) => ({
      id: event.id,
      captureTime: event.captureTime,
      name: event.name,
      source: event.sourceName ?? event.sourceId,
      pathname: pathname(event.pageUrl),
      validation: event.validation ?? "Not checked",
      payload: event.payload,
      ...(event.keyProperties ? { summary: Object.entries(event.keyProperties).map(([key, value]) => `${key}: ${String(value)}`).join(", ") } : {}),
      ...(event.validationDetails ? { validationDetails: event.validationDetails } : {}),
    })),
  };
}

export function defectCapturedEvent(event: LiveEvent): DefectCapturedEvent {
  const schema = event.validationDetails?.schema;
  return {
    id: event.id,
    name: event.name,
    source: event.sourceName ?? event.sourceId,
    pageUrl: event.pageUrl ?? "",
    pathname: pathname(event.pageUrl),
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

export function browserDefectReportClipboard(): DefectReportClipboard {
  return {
    ...(typeof navigator.clipboard?.write === "function" && typeof ClipboardItem !== "undefined" ? {
      async writeRich(html: string, text: string) {
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        })]);
      },
    } : {}),
    ...(typeof navigator.clipboard?.writeText === "function" ? {
      async writeText(text: string) { await navigator.clipboard.writeText(text); },
    } : {}),
  };
}

export function renderDefectReportBuilder(
  root: HTMLElement,
  event: LiveEvent,
  clipboard: DefectReportClipboard = browserDefectReportClipboard(),
  sessionEvents: readonly LiveEvent[] = [event],
): void {
  let report = createDefectReport(defectCapturedEvent(event));
  const context = defectReportContext(sessionEvents, event.id);
  const timelineSelections = new Map<string, TimelineSelection>();
  const detailEdits: Partial<Record<"summary" | "description" | "expectedExplanation", string>> = {};
  const heading = document.createElement("h4"); heading.textContent = `Defect report: ${event.name}`; heading.tabIndex = -1;
  const issueHeading = document.createElement("h5"); issueHeading.textContent = "Validation issues";
  const issues = document.createElement("fieldset");
  const expectedHeading = document.createElement("h5"); expectedHeading.textContent = "Expected result";
  const expectedControls = document.createElement("div");
  const reproductionHeading = document.createElement("h5"); reproductionHeading.textContent = "Steps to reproduce";
  const reproductionControls = document.createElement("div");
  const reproductionSteps = document.createElement("ol");
  const timelineHeading = document.createElement("h5"); timelineHeading.textContent = "Supporting timeline";
  const timelineFilters = document.createElement("div"); timelineFilters.setAttribute("aria-label", "Timeline filters");
  const timelineList = document.createElement("ul");
  const detailsHeading = document.createElement("h5"); detailsHeading.textContent = "Report details";
  const detailControls = document.createElement("div");
  const preview = document.createElement("section"); preview.setAttribute("aria-label", "Final report preview");
  const feedback = document.createElement("output"); feedback.setAttribute("aria-live", "polite");
  const copy = document.createElement("button"); copy.type = "button"; copy.textContent = "Copy for Jira Cloud"; copy.dataset.actionVariant = "primary";

  const selectedChoices = new Map<string, ExpectedResultChoice>();
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
    const rendered = renderJiraReport(lastGenerated);
    preview.innerHTML = rendered.html;
    copy.onclick = () => { void copyDefectReportForJira(lastGenerated, clipboard).then((result) => { feedback.textContent = result.feedback; }); };
  };

  for (const reportIssue of report.issues) {
    const row = document.createElement("div");
    const selected = document.createElement("input"); selected.type = "checkbox"; selected.checked = reportIssue.selected;
    selected.id = `defect-issue-${reportIssue.id}`;
    selected.addEventListener("change", () => { report = toggleReportIssue(report, reportIssue.id); refresh(); });
    const label = document.createElement("label"); label.htmlFor = selected.id; label.textContent = `${reportIssue.severity}: ${reportIssue.pointer} — ${reportIssue.constraint}`;
    row.append(selected, label); issues.append(row);

    const methodLabel = document.createElement("label"); methodLabel.textContent = `${reportIssue.id} correction `;
    const method = document.createElement("select");
    for (const value of ["", "choose an allowed value", "enter a valid response", "apply the rule", "keep the rule generic"]) {
      method.append(Object.assign(document.createElement("option"), { value, textContent: value || "Choose method" }));
    }
    const response = document.createElement("input"); response.placeholder = "Valid response";
    const updateChoice = () => {
      if (!method.value) selectedChoices.delete(reportIssue.id);
      else selectedChoices.set(reportIssue.id, { issueId: reportIssue.id, method: method.value as ExpectedResultChoice["method"], ...(response.value ? { response: response.value } : {}) });
      refresh();
    };
    method.addEventListener("change", updateChoice); response.addEventListener("input", updateChoice);
    methodLabel.append(method, response); expectedControls.append(methodLabel);
  }

  const startLabel = document.createElement("label"); startLabel.textContent = "Reproduction starts at ";
  const startVisit = document.createElement("select"); startVisit.id = "defect-reproduction-start";
  const defectVisitIndex = context.visits.findIndex(({ id }) => id === context.defectVisitId);
  for (const visit of context.visits.slice(0, defectVisitIndex + 1)) {
    startVisit.append(Object.assign(document.createElement("option"), { value: visit.id, textContent: visit.pathname }));
  }
  const generateSteps = document.createElement("button"); generateSteps.type = "button"; generateSteps.textContent = "Generate pathname steps";
  const renderReproductionSteps = () => {
    reproductionSteps.replaceChildren(...report.reproductionSteps.map((step, index) => {
      const item = document.createElement("li");
      const input = document.createElement("input"); input.value = step.text; input.setAttribute("aria-label", `Reproduction step ${index + 1}`);
      input.addEventListener("input", () => {
        report = { ...report, reproductionSteps: report.reproductionSteps.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, text: input.value } : candidate) };
        refresh();
      });
      item.append(input); return item;
    }));
  };
  generateSteps.addEventListener("click", () => {
    report = { ...report, reproductionSteps: generatePathnameSkeleton(context.visits, startVisit.value, context.defectVisitId) };
    renderReproductionSteps(); refresh();
  });
  startLabel.append(startVisit); reproductionControls.append(startLabel, generateSteps);

  const timelineFilter: TimelineFilter = {};
  const filterInputs = ([
    ["name", "Event name"], ["source", "Source"], ["pathname", "Pathname"], ["validation", "Validation state"],
  ] as const).map(([field, labelText]) => {
    const label = document.createElement("label"); label.textContent = `${labelText} `;
    const input = document.createElement("input"); input.dataset.timelineFilter = field;
    input.addEventListener("input", () => {
      if (input.value) timelineFilter[field] = input.value;
      else delete timelineFilter[field];
      renderTimeline();
    });
    label.append(input); return label;
  });
  timelineFilters.append(...filterInputs);
  const updateTimeline = () => {
    report = { ...report, timeline: supportingTimeline(context.timeline, [...timelineSelections.values()]) };
    refresh();
  };
  const renderTimeline = () => {
    timelineList.replaceChildren(...filterTimelineEvents(context.timeline, timelineFilter).map((timelineEvent) => {
      const item = document.createElement("li");
      const selectedLabel = document.createElement("label");
      const selected = document.createElement("input"); selected.type = "checkbox"; selected.checked = timelineSelections.has(timelineEvent.id);
      selectedLabel.append(selected, `${timelineEvent.captureTime} ${timelineEvent.name} · ${timelineEvent.source} · ${timelineEvent.pathname} · ${timelineEvent.validation}`);
      const options = document.createElement("span");
      for (const [field, labelText] of [["includeSummary", "Summary"], ["includePayload", "Payload"], ["includeValidation", "Validation details"]] as const) {
        const optionLabel = document.createElement("label");
        const option = document.createElement("input"); option.type = "checkbox"; option.checked = Boolean(timelineSelections.get(timelineEvent.id)?.[field]); option.disabled = !selected.checked;
        option.addEventListener("change", () => {
          timelineSelections.set(timelineEvent.id, { ...(timelineSelections.get(timelineEvent.id) ?? { eventId: timelineEvent.id }), [field]: option.checked });
          updateTimeline();
        });
        optionLabel.append(option, labelText); options.append(optionLabel);
      }
      selected.addEventListener("change", () => {
        if (selected.checked) timelineSelections.set(timelineEvent.id, { eventId: timelineEvent.id });
        else timelineSelections.delete(timelineEvent.id);
        renderTimeline(); updateTimeline();
      });
      item.append(selectedLabel, options); return item;
    }));
  };
  renderTimeline();

  for (const [field, labelText, multiline] of [
    ["summary", "Summary", false],
    ["description", "Description", true],
    ["expectedExplanation", "Expected result explanation", true],
  ] as const) {
    const label = document.createElement("label"); label.textContent = `${labelText} `;
    const input = multiline ? document.createElement("textarea") : document.createElement("input");
    input.dataset.reportField = field;
    input.addEventListener("input", () => { input.dataset.edited = "true"; detailEdits[field] = input.value; refresh(); });
    label.append(input); detailControls.append(label);
  }

  root.replaceChildren(
    heading,
    issueHeading, issues,
    expectedHeading, expectedControls,
    reproductionHeading, reproductionControls, reproductionSteps,
    timelineHeading, timelineFilters, timelineList,
    detailsHeading, detailControls,
    preview, copy, feedback,
  );
  refresh(); heading.focus({ preventScroll: true });
}
