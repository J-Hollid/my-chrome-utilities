import {
  filterTimelineEvents,
  generatePathnameSkeleton,
  supportingTimeline,
  type DefectReport,
  type TimelineFilter,
  type TimelineSelection,
} from "./data-layer-defect-report.js";
import type { DefectReportContext } from "./data-layer-defect-report-browser.js";

export { appendIssueControls } from "./data-layer-defect-report-issue-controls.js";

export interface DefectReportBuilderState {
  report(): DefectReport;
  update(report: DefectReport): void;
  refresh(): void;
}

export function appendReproductionControls(
  controls: HTMLElement,
  steps: HTMLElement,
  context: DefectReportContext,
  state: DefectReportBuilderState,
): void {
  const startLabel = document.createElement("label"); startLabel.textContent = "Reproduction starts at ";
  const startVisit = document.createElement("select"); startVisit.id = "defect-reproduction-start";
  const defectVisitIndex = context.visits.findIndex(({ id }) => id === context.defectVisitId);
  for (const visit of context.visits.slice(0, defectVisitIndex + 1)) {
    startVisit.append(Object.assign(document.createElement("option"), { value: visit.id, textContent: visit.pathname }));
  }
  const renderSteps = () => {
    steps.replaceChildren(...state.report().reproductionSteps.map((step, index) => {
      const item = document.createElement("li");
      const input = document.createElement("input"); input.value = step.text; input.setAttribute("aria-label", `Reproduction step ${index + 1}`);
      input.addEventListener("input", () => {
        state.update({ ...state.report(), reproductionSteps: state.report().reproductionSteps.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, text: input.value } : candidate) });
        state.refresh();
      });
      item.append(input); return item;
    }));
  };
  const generate = document.createElement("button"); generate.type = "button"; generate.textContent = "Generate pathname steps";
  generate.addEventListener("click", () => {
    state.update({ ...state.report(), reproductionSteps: generatePathnameSkeleton(context.visits, startVisit.value, context.defectVisitId) });
    renderSteps(); state.refresh();
  });
  startLabel.append(startVisit); controls.append(startLabel, generate);
}

export function appendTimelineControls(
  filters: HTMLElement,
  list: HTMLElement,
  context: DefectReportContext,
  state: DefectReportBuilderState,
): void {
  const selections = new Map<string, TimelineSelection>();
  const filter: TimelineFilter = {};
  const update = () => {
    state.update({ ...state.report(), timeline: supportingTimeline(context.timeline, [...selections.values()]) });
    state.refresh();
  };
  const render = () => {
    list.replaceChildren(...filterTimelineEvents(context.timeline, filter).map((event) => {
      const item = document.createElement("li");
      const selectedLabel = document.createElement("label");
      const selected = document.createElement("input"); selected.type = "checkbox"; selected.checked = selections.has(event.id);
      selectedLabel.append(selected, `${event.captureTime} ${event.name} · ${event.source} · ${event.pathname} · ${event.validation}`);
      const options = document.createElement("span");
      for (const [field, labelText] of [["includeSummary", "Summary"], ["includePayload", "Payload"], ["includeValidation", "Validation details"]] as const) {
        const optionLabel = document.createElement("label");
        const option = document.createElement("input"); option.type = "checkbox"; option.checked = Boolean(selections.get(event.id)?.[field]); option.disabled = !selected.checked;
        option.addEventListener("change", () => {
          selections.set(event.id, { ...(selections.get(event.id) ?? { eventId: event.id }), [field]: option.checked });
          update();
        });
        optionLabel.append(option, labelText); options.append(optionLabel);
      }
      selected.addEventListener("change", () => {
        if (selected.checked) selections.set(event.id, { eventId: event.id });
        else selections.delete(event.id);
        render(); update();
      });
      item.append(selectedLabel, options); return item;
    }));
  };
  for (const [field, labelText] of [["name", "Event name"], ["source", "Source"], ["pathname", "Pathname"], ["validation", "Validation state"]] as const) {
    const label = document.createElement("label"); label.textContent = `${labelText} `;
    const input = document.createElement("input"); input.dataset.timelineFilter = field;
    input.addEventListener("input", () => { if (input.value) filter[field] = input.value; else delete filter[field]; render(); });
    label.append(input); filters.append(label);
  }
  render();
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
