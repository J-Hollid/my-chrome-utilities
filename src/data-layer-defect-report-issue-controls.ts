import {
  expectedResultAssistance,
  toggleReportIssue,
  validateAssistedResponse,
  type ExpectedResultChoice,
} from "./data-layer-defect-report.js";
import type { DefectReportBuilderState } from "./data-layer-defect-report-ui-controls.js";

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
