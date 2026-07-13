import {
  expectedResultAssistance,
  filterTimelineEvents,
  generatePathnameSkeleton,
  supportingTimeline,
  toggleReportIssue,
  validateAssistedResponse,
  type DefectReport,
  type ExpectedResultChoice,
  type TimelineFilter,
  type TimelineSelection,
} from "./data-layer-defect-report.js";
import type { DefectReportContext } from "./data-layer-defect-report-browser.js";

export interface DefectReportBuilderState {
  report(): DefectReport;
  update(report: DefectReport): void;
  refresh(): void;
}

export function appendIssueControls(
  issues: HTMLElement,
  expectedControls: HTMLElement,
  state: DefectReportBuilderState,
  selectedChoices: Map<string, ExpectedResultChoice>,
): void {
  for (const reportIssue of state.report().issues) {
    let hideCustomResponse = () => {};
    const row = document.createElement("div");
    const selected = document.createElement("input"); selected.type = "checkbox"; selected.checked = reportIssue.selected;
    selected.id = `defect-issue-${reportIssue.id}`;
    selected.addEventListener("change", () => { state.update(toggleReportIssue(state.report(), reportIssue.id)); state.refresh(); });
    const label = document.createElement("label"); label.htmlFor = selected.id; label.textContent = `${reportIssue.severity}: ${reportIssue.pointer} — ${reportIssue.constraint}`;
    row.append(selected, label); issues.append(row);

    const assistance = expectedResultAssistance(reportIssue);
    const group = document.createElement("fieldset");
    group.setAttribute("aria-label", `${reportIssue.id} expected-result assistance`);
    const genericLabel = document.createElement("label");
    const generic = document.createElement("input"); generic.type = "radio"; generic.name = `defect-response-${reportIssue.id}`;
    generic.dataset.responseSource = "Use generic constraint";
    generic.addEventListener("change", () => {
      hideCustomResponse();
      selectedChoices.set(reportIssue.id, { issueId: reportIssue.id, method: "keep the rule generic" });
      state.refresh();
    });
    genericLabel.append(generic, `Use generic constraint — ${assistance.genericConstraint}`);
    group.append(genericLabel);

    for (const value of assistance.schemaValues) {
      const schemaLabel = document.createElement("label");
      const schemaValue = document.createElement("input");
      schemaValue.type = "radio"; schemaValue.name = `defect-response-${reportIssue.id}`; schemaValue.value = value;
      schemaValue.dataset.responseSource = `${state.report().event.schema.name} schema`;
      schemaValue.addEventListener("change", () => {
        hideCustomResponse();
        selectedChoices.set(reportIssue.id, {
          issueId: reportIssue.id,
          method: "choose an allowed value",
          response: value,
          responseSource: `${state.report().event.schema.name} schema`,
        });
        state.refresh();
      });
      schemaLabel.append(schemaValue, `${value} — ${state.report().event.schema.name} schema`);
      group.append(schemaLabel);
    }

    if (/forbidden/i.test(reportIssue.constraint)) {
      const ruleLabel = document.createElement("label");
      const rule = document.createElement("input"); rule.type = "radio"; rule.name = `defect-response-${reportIssue.id}`; rule.value = "remove";
      rule.dataset.responseSource = "validation rule";
      rule.addEventListener("change", () => {
        hideCustomResponse();
        selectedChoices.set(reportIssue.id, { issueId: reportIssue.id, method: "apply the rule", responseSource: "validation rule" });
        state.refresh();
      });
      ruleLabel.append(rule, "Remove property — validation rule"); group.append(ruleLabel);
    }

    const customLabel = document.createElement("label");
    const custom = document.createElement("input"); custom.type = "radio"; custom.name = `defect-response-${reportIssue.id}`;
    custom.dataset.responseSource = "Custom value or response";
    const response = document.createElement("input"); response.placeholder = "Custom value or response"; response.hidden = true;
    const warning = document.createElement("output"); warning.dataset.customResponseWarning = reportIssue.id; warning.setAttribute("aria-live", "polite");
    const keep = document.createElement("button"); keep.type = "button"; keep.textContent = "Keep custom override"; keep.hidden = true;
    const replace = document.createElement("button"); replace.type = "button"; replace.textContent = "Replace custom override"; replace.hidden = true;
    hideCustomResponse = () => {
      response.hidden = true; warning.textContent = ""; keep.hidden = true; replace.hidden = true;
    };
    custom.addEventListener("change", () => { response.hidden = false; response.focus({ preventScroll: true }); });
    response.addEventListener("input", () => {
      const result = validateAssistedResponse(reportIssue, response.value);
      warning.textContent = result.valid ? "Custom value or response." : result.warning;
      keep.hidden = result.valid; replace.hidden = result.valid;
      if (result.valid && response.value) {
        selectedChoices.set(reportIssue.id, { issueId: reportIssue.id, method: "enter a valid response", response: response.value, responseSource: "Custom value or response" });
      } else selectedChoices.delete(reportIssue.id);
      state.refresh();
    });
    keep.addEventListener("click", () => {
      selectedChoices.set(reportIssue.id, {
        issueId: reportIssue.id,
        method: "enter a valid response",
        response: response.value,
        responseSource: "Custom value or response",
        operatorProvided: true,
      });
      warning.textContent = `${response.value} is kept as an operator-provided override.`;
      state.refresh();
    });
    replace.addEventListener("click", () => {
      selectedChoices.delete(reportIssue.id); response.value = ""; warning.textContent = "Enter a replacement value.";
      keep.hidden = true; replace.hidden = true; response.focus({ preventScroll: true }); state.refresh();
    });
    customLabel.append(custom, "Custom value or response");
    group.append(customLabel, response, warning, keep, replace);
    expectedControls.append(group);
  }
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
