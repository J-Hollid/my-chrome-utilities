import {
  exactFlowExpectationChoice,
  expectedResultAssistance,
  isUndeclaredPropertyIssue,
  toggleReportIssue,
  validateAssistedResponse,
  type ExpectedResultChoice,
} from "./data-layer-defect-report.js";
import type { DefectReportBuilderState } from "./data-layer-defect-report-ui-controls.js";
import { exampleValueFromInput, type SchemaPropertyExampleInputType } from "./utilities/data-layer/schemas.js";

export function appendIssueControls(
  issues: HTMLElement,
  expectedControls: HTMLElement,
  state: DefectReportBuilderState,
  selectedChoices: Map<string, ExpectedResultChoice>,
): void {
  const flowContext = state.report().event.flowContext;
  for (const reportIssue of state.report().issues) {
    let hideCustomResponse = () => {};
    const row = document.createElement("div");
    const selected = document.createElement("input"); selected.type = "checkbox"; selected.checked = reportIssue.selected;
    selected.id = `defect-issue-${reportIssue.id}`;
    const label = document.createElement("label"); label.htmlFor = selected.id; label.textContent = flowContext
      ? `${reportIssue.severity}: ${reportIssue.pointer} — observed ${String(reportIssue.actual)} · expected ${reportIssue.constraint} · rule ${reportIssue.rule}`
      : `${reportIssue.severity}: ${reportIssue.pointer} — ${reportIssue.constraint}${reportIssue.violation ? ` (${reportIssue.violation})` : ""}`;
    row.append(selected, label); issues.append(row);

    const group = document.createElement("fieldset");
    group.setAttribute("aria-label", `${reportIssue.id} expected-result assistance`);
    if (isUndeclaredPropertyIssue(reportIssue)) {
      const removalLabel = document.createElement("label");
      const removal = document.createElement("input");
      removal.type = "radio";
      removal.name = `defect-response-${reportIssue.id}`;
      removal.checked = reportIssue.selected;
      removal.dataset.responseSource = "schema declared-property policy";
      removalLabel.textContent = "Remove undeclared property — schema declared-property policy";
      removalLabel.prepend(removal);
      group.append(removalLabel);
      selected.addEventListener("change", () => {
        state.update(toggleReportIssue(state.report(), reportIssue.id));
        removal.checked = selected.checked;
        state.refresh();
      });
      expectedControls.append(group);
      continue;
    }

    selected.addEventListener("change", () => { state.update(toggleReportIssue(state.report(), reportIssue.id)); state.refresh(); });
    const assistance = expectedResultAssistance(reportIssue);
    if (assistance.conflict) {
      const conflict = document.createElement("output");
      conflict.dataset.schemaChoiceConflict = reportIssue.id;
      conflict.textContent = assistance.conflict;
      group.append(conflict);
    }
    const includeComment = document.createElement("input");
    includeComment.type = "checkbox";
    includeComment.dataset.allowedValuesComment = reportIssue.id;
    const includeCommentLabel = document.createElement("label");
    includeCommentLabel.append(includeComment, "Include all allowed values as a comment");
    const genericLabel = document.createElement("label");
    const generic = document.createElement("input"); generic.type = "radio"; generic.name = `defect-response-${reportIssue.id}`;
    const flowExpectationChoice = exactFlowExpectationChoice(reportIssue, flowContext);
    const flowExpectationSource = flowExpectationChoice?.responseSource ?? (flowContext
      ? `${flowContext.selectedStepName} Flow-step expectation · effective schema revision ${flowContext.effectiveSchemaRevision}`
      : undefined);
    generic.dataset.responseSource = flowExpectationSource
      ? `Use ${flowExpectationSource}`
      : "Use generic constraint";
    if (assistance.schemaValues.length) {
      generic.checked = true;
      selectedChoices.set(reportIssue.id, {
        issueId: reportIssue.id,
        method: "keep the rule generic",
        responseSource: flowExpectationSource ?? "schema constraint",
      });
    }
    generic.addEventListener("change", () => {
      hideCustomResponse();
      selectedChoices.set(reportIssue.id, flowExpectationChoice ?? {
        issueId: reportIssue.id,
        method: "keep the rule generic",
        responseSource: flowExpectationSource ?? "schema constraint",
      });
      state.refresh();
    });
    genericLabel.append(generic, flowExpectationSource
      ? `Use ${flowExpectationSource} — ${assistance.genericConstraint}`
      : `Use generic constraint — ${assistance.genericConstraint}`);
    group.append(genericLabel);

    for (const value of assistance.schemaValues) {
      const schemaLabel = document.createElement("label");
      const schemaValue = document.createElement("input");
      schemaValue.type = "radio"; schemaValue.name = `defect-response-${reportIssue.id}`; schemaValue.value = String(value);
      const schemaSource = assistance.provenance
        ? `${assistance.provenance.schema.name} revision ${assistance.provenance.schema.version}`
        : `${state.report().event.schema.name} schema`;
      schemaValue.dataset.responseSource = schemaSource;
      schemaValue.addEventListener("change", () => {
        hideCustomResponse();
        selectedChoices.set(reportIssue.id, {
          issueId: reportIssue.id,
          method: "choose an allowed value",
          response: value,
          responseSource: schemaSource,
          ...(assistance.provenance ? { responseProvenance:assistance.provenance } : {}),
          ...(includeComment.checked ? { includeAllowedValuesComment: true } : {}),
        });
        state.refresh();
      });
      schemaLabel.append(schemaValue, `${String(value)} — ${schemaSource}`);
      group.append(schemaLabel);
    }

    includeComment.addEventListener("change", () => {
      const choice = selectedChoices.get(reportIssue.id);
      if (choice?.method !== "choose an allowed value") return;
      selectedChoices.set(reportIssue.id, { ...choice, includeAllowedValuesComment: includeComment.checked });
      state.refresh();
    });
    if (assistance.schemaValues.length) group.append(includeCommentLabel);

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
    let customInitialized = false;
    const exampleType: SchemaPropertyExampleInputType | undefined = reportIssue.example
      ? reportIssue.example.value === null ? "null" : typeof reportIssue.example.value as SchemaPropertyExampleInputType
      : undefined;
    const responseValue = (): unknown => exampleType ? exampleValueFromInput(response.value, exampleType)?.value : response.value;
    const updateCustomChoice = () => {
      const value = responseValue();
      const result = validateAssistedResponse(reportIssue, value);
      warning.textContent = result.valid ? "Custom value or response." : result.warning;
      keep.hidden = result.valid; replace.hidden = result.valid;
      if (result.valid && value !== undefined && value !== "") {
        selectedChoices.set(reportIssue.id, { issueId:reportIssue.id, method:"enter a valid response", response:value, responseSource:"operator custom override" });
      } else selectedChoices.delete(reportIssue.id);
      state.refresh();
    };
    custom.addEventListener("change", () => {
      response.hidden = false;
      if (!customInitialized && reportIssue.example) { response.value = String(reportIssue.example.value); customInitialized = true; updateCustomChoice(); }
      response.focus({ preventScroll: true });
    });
    response.addEventListener("input", () => {
      customInitialized = true;
      updateCustomChoice();
    });
    keep.addEventListener("click", () => {
      selectedChoices.set(reportIssue.id, {
        issueId: reportIssue.id,
        method: "enter a valid response",
        response: responseValue(),
        responseSource: "operator custom override",
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
