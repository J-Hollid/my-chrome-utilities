import {
  acceptMissingEventReplacements,
  changeMissingEventInterval,
  changeMissingEventScope,
  confirmMissingEventExpectation,
  createMissingEventDraft,
  createMissingEventReport,
  editMissingEventExpectation,
  generateMissingEventRepresentations,
  overrideMissingEventWarning,
  selectMissingEventAssignment,
  selectMissingEventSchema,
  verifyMissingEventAbsence,
  type MissingEventDraft,
  type MissingEventReport,
  type MissingEventVisit,
} from "./data-layer-missing-event-defect-report.js";
import type { SchemaDefinition, ValidationTarget } from "./data-layer-schema-verification.js";

export interface MissingEventBuilderNavigation {
  backToSelectedVisit(): void;
  backToLiveFeed(): void;
  openMatchingEvent?(eventId: string, restoreBuilder: () => void): void;
  focusReportMissingEvent?(): void;
}

export interface MissingEventBuilderOptions {
  entryPoint: string;
  initialSchemaId?: string;
  initialVisitId?: string;
  navigation?: MissingEventBuilderNavigation;
  writeClipboard?: (text: string) => Promise<void>;
  onDraftChange?: (draft: MissingEventDraft) => void;
}

export interface MissingEventBuilderController {
  draft(): MissingEventDraft;
  report(): MissingEventReport | undefined;
  restore(): void;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  return result;
}

function labelledInput(labelText: string, value: string, update: (value: string) => void): HTMLLabelElement {
  const label = element("label", labelText);
  const input = element("input"); input.type = "text"; input.value = value;
  input.addEventListener("input", () => update(input.value));
  label.append(input);
  return label;
}

function pathname(url: string): string {
  try { return new URL(url).pathname; } catch { return "/"; }
}

export function missingEventVisits(
  events: readonly {
    id: string; name: string; sourceId: string; sourceName?: string; pageUrl?: string; captureTime?: string; validation?: string; payload?: unknown; rawInput?: unknown;
  }[],
  currentPageUrl: string,
  immutable = false,
): MissingEventVisit[] {
  const visits: MissingEventVisit[] = [];
  for (const event of events) {
    const pageUrl = event.pageUrl ?? currentPageUrl;
    const latest = visits.at(-1);
    const item = {
      id:event.id,
      name:event.name,
      sourceId:event.sourceId,
      ...(event.sourceName ? { sourceName:event.sourceName } : {}),
      pageUrl,
      ...(event.captureTime ? { captureTime:event.captureTime } : {}),
      ...(event.validation ? { validation:event.validation } : {}),
      ...(event.payload !== undefined ? { payload:structuredClone(event.payload) } : {}),
      ...(event.rawInput !== undefined ? { rawInput:structuredClone(event.rawInput) } : {}),
    };
    if (latest?.pageUrl === pageUrl) {
      latest.events = [...latest.events, item];
      latest.endedAt = event.captureTime ?? latest.endedAt;
    } else {
      const timestamp = event.captureTime ?? new Date(0).toISOString();
      visits.push({ id:`visit:${visits.length + 1}`, pageUrl, pathname:pathname(pageUrl), startedAt:timestamp, endedAt:timestamp, events:[item], ...(immutable ? { immutable:true } : {}) });
    }
  }
  const latest = visits.at(-1);
  if (!latest || latest.pageUrl !== currentPageUrl) {
    const boundary = latest?.endedAt ?? new Date(0).toISOString();
    visits.push({ id:`visit:${visits.length + 1}`, pageUrl:currentPageUrl, pathname:pathname(currentPageUrl), startedAt:boundary, endedAt:new Date(8.64e15).toISOString(), events:[], ...(immutable ? { immutable:true } : {}) });
  }
  return visits;
}

export function renderMissingEventDefectReportBuilder(
  root: HTMLElement,
  visits: readonly MissingEventVisit[],
  schemas: readonly SchemaDefinition[],
  options: MissingEventBuilderOptions,
): MissingEventBuilderController {
  let draft = createMissingEventDraft(options.entryPoint, visits, schemas);
  if (options.initialVisitId) draft = changeMissingEventScope(draft, options.initialVisitId);
  if (options.initialSchemaId) draft = selectMissingEventSchema(draft, options.initialSchemaId);
  let completed: MissingEventReport | undefined;
  let overrideExplanation = "";
  let manualSteps = "";
  const timelineIds = new Set<string>();
  let feedback = "";

  const updateDraft = (next: MissingEventDraft) => {
    draft = next;
    completed = undefined;
    options.onDraftChange?.(draft);
  };

  const render = () => {
    const title = element("h4", "Missing event defect report"); title.tabIndex = -1;
    const header = element("header"); header.className = "detail-view-header";
    const backVisit = element("button", "Back to selected page visit"); backVisit.type = "button";
    const backFeed = element("button", "Back to Live feed"); backFeed.type = "button";
    backVisit.addEventListener("click", () => { options.navigation?.backToSelectedVisit(); options.navigation?.focusReportMissingEvent?.(); });
    backFeed.addEventListener("click", () => options.navigation?.backToLiveFeed());
    header.append(backVisit, backFeed, title);

    const expectation = element("section"); expectation.setAttribute("aria-label", "Expected event");
    expectation.append(element("h5", "Expected event"));
    const schemaLabel = element("label", "Expected schema");
    const schemaSelect = element("select"); schemaSelect.id = "missing-event-schema";
    schemaSelect.append(element("option", "Choose a schema"));
    for (const schema of schemas) {
      const option = element("option", `${schema.name} revision ${schema.version}`); option.value = schema.id; option.selected = draft.expectation?.schema.id === schema.id; schemaSelect.append(option);
    }
    schemaSelect.value = draft.expectation?.schema.id ?? "";
    schemaSelect.addEventListener("change", () => { updateDraft(selectMissingEventSchema(draft, schemaSelect.value)); render(); });
    schemaLabel.append(schemaSelect);

    const visitLabel = element("label", "Expectation scope");
    const visitSelect = element("select"); visitSelect.id = "missing-event-visit";
    for (const visit of draft.visits) {
      const option = element("option", `${visit.pathname} · ${visit.events.length} captured events`); option.value = visit.id; option.selected = visit.id === draft.scope.id; visitSelect.append(option);
    }
    visitSelect.value = draft.scope.id;
    visitSelect.addEventListener("change", () => { updateDraft(changeMissingEventScope(draft, visitSelect.value)); render(); });
    visitLabel.append(visitSelect);
    expectation.append(schemaLabel, visitLabel, element("p", draft.assistance));

    const interval = element("fieldset"); interval.append(element("legend", "Observation interval"));
    let intervalStart = draft.scope.startedAt; let intervalEnd = draft.scope.endedAt;
    interval.append(
      labelledInput("Observation start (ISO)", intervalStart, (value) => { intervalStart = value; }),
      labelledInput("Observation end (ISO)", intervalEnd, (value) => { intervalEnd = value; }),
    );
    const applyInterval = element("button", "Apply observation interval"); applyInterval.type = "button";
    applyInterval.addEventListener("click", () => {
      try { updateDraft(changeMissingEventInterval(draft, intervalStart, intervalEnd)); feedback = "Observation interval updated; matching-event verification must run again."; }
      catch (error) { feedback = error instanceof Error ? error.message : "Observation interval is invalid."; }
      render();
    });
    interval.append(applyInterval); expectation.append(interval);

    const selected = draft.expectation;
    if (selected) {
      if (selected.assignmentChoices.length > 1) {
        const assignmentLabel = element("label", "Enabled assignment");
        const assignmentSelect = element("select"); assignmentSelect.append(element("option", "Choose an assignment"));
        for (const assignment of selected.assignmentChoices) {
          const option = element("option", assignment.name ?? assignment.id ?? `${assignment.sourceId}/${assignment.eventName}`); option.value = assignment.id ?? ""; option.selected = assignment.id === selected.assignment?.id; assignmentSelect.append(option);
        }
        assignmentSelect.addEventListener("change", () => { updateDraft(selectMissingEventAssignment(draft, assignmentSelect.value)); render(); });
        assignmentLabel.append(assignmentSelect); expectation.append(assignmentLabel);
      }
      if (selected.disabledAssignmentContext.length > 0) {
        const disabledContext = element("section"); disabledContext.setAttribute("aria-label", "Disabled assignment context");
        disabledContext.append(element("h6", "Disabled assignments — non-authoritative context"));
        for (const assignment of selected.disabledAssignmentContext) {
          disabledContext.append(element("p", `${assignment.name ?? assignment.id ?? "Disabled assignment"} · ${assignment.sourceId}/${assignment.eventName}/${assignment.target}`));
        }
        expectation.append(disabledContext);
      }
      if (draft.replacementReview.length > 0) {
        const review = element("section"); review.setAttribute("aria-label", "Expected-event replacement review");
        review.append(element("h6", "Review schema-derived replacements"));
        for (const replacement of draft.replacementReview) review.append(element("p", `${replacement.field}: ${String(replacement.current)} would be replaced by ${String(replacement.proposed)}`));
        const keep = element("button", "Keep current expected-event values"); keep.type = "button"; keep.addEventListener("click", () => { updateDraft({ ...draft, replacementReview:[] }); render(); });
        const accept = element("button", "Accept schema-derived expected-event values"); accept.type = "button"; accept.addEventListener("click", () => { updateDraft(acceptMissingEventReplacements(draft)); render(); });
        review.append(keep, accept); expectation.append(review);
      }
      const edit = <K extends "sourceId" | "eventName" | "pageUrl" | "explanation">(field:K) => (value:string) => updateDraft(editMissingEventExpectation(draft, { [field]:value }));
      expectation.append(
        labelledInput("Expected source", selected.sourceId, edit("sourceId")),
        labelledInput("Expected event name", selected.eventName, edit("eventName")),
      );
      const targetLabel = element("label", "Validation target");
      const target = element("select");
      for (const value of ["payload", "raw input"] as ValidationTarget[]) { const option = element("option", value); option.value = value; option.selected = value === selected.target; target.append(option); }
      target.value = selected.target; target.addEventListener("change", () => updateDraft(editMissingEventExpectation(draft, { target:target.value as ValidationTarget })));
      targetLabel.append(target);
      expectation.append(targetLabel, labelledInput("Expected page URL", selected.pageUrl, edit("pageUrl")), labelledInput("Expectation explanation", selected.explanation, edit("explanation")));
      if (!selected.assignment) {
        const acknowledgement = element("label", "I acknowledge that no enabled covering assignment proves this expectation");
        const checkbox = element("input"); checkbox.type = "checkbox"; checkbox.checked = selected.warningAcknowledged;
        checkbox.addEventListener("change", () => updateDraft(editMissingEventExpectation(draft, { warningAcknowledged:checkbox.checked })));
        acknowledgement.prepend(checkbox); expectation.append(acknowledgement);
      }
      const confirm = element("button", "Confirm at least one matching event was expected"); confirm.type = "button";
      confirm.addEventListener("click", () => {
        try { updateDraft(verifyMissingEventAbsence(confirmMissingEventExpectation(draft))); feedback = "Absence verification complete."; }
        catch (error) { feedback = error instanceof Error ? error.message : "Expectation confirmation failed."; }
        render();
      });
      expectation.append(confirm);
    }

    const warning = element("section"); warning.setAttribute("aria-label", "Matching event warning"); warning.hidden = !draft.verification.warningVisible;
    warning.append(element("h5", `${draft.verification.matchingCount} matching event${draft.verification.matchingCount === 1 ? "" : "s"} found`));
    for (const match of draft.verification.matches) {
      const row = element("p", `${match.captureTime ?? "Time unavailable"} · ${match.sourceId} · ${match.pageUrl} · ${match.validation ?? "Not checked"} `);
      const open = element("button", "Open matching event"); open.type = "button"; open.addEventListener("click", () => options.navigation?.openMatchingEvent?.(match.id, render)); row.append(open); warning.append(row);
    }
    const overrideLabel = labelledInput("Optional override explanation", overrideExplanation, (value) => { overrideExplanation = value; });
    const anyway = element("button", "Create missing-event report anyway"); anyway.type = "button";
    anyway.addEventListener("click", () => { updateDraft(overrideMissingEventWarning(draft, overrideExplanation)); completed = createMissingEventReport(draft, [...timelineIds], manualSteps.split("\n").map((line) => line.trim()).filter(Boolean)); render(); });
    warning.append(overrideLabel, anyway);

    const evidence = element("section"); evidence.setAttribute("aria-label", "Missing event evidence"); evidence.append(element("h5", "Reproduction and supporting timeline"));
    const manualLabel = element("label", "Manual reproduction steps, one per line"); const manual = element("textarea"); manual.value = manualSteps; manual.addEventListener("input", () => { manualSteps = manual.value; }); manualLabel.append(manual); evidence.append(manualLabel);
    for (const event of draft.scope.events) {
      const label = element("label", `${event.captureTime ?? "Time unavailable"} · ${event.name} · observed event`); const checkbox = element("input"); checkbox.type = "checkbox"; checkbox.checked = timelineIds.has(event.id); checkbox.addEventListener("change", () => checkbox.checked ? timelineIds.add(event.id) : timelineIds.delete(event.id)); label.prepend(checkbox); evidence.append(label);
    }

    if (selected?.confirmed && !draft.verification.warningVisible) {
      const create = element("button", "Create missing-event report"); create.type = "button";
      create.addEventListener("click", () => { completed = createMissingEventReport(draft, [...timelineIds], manualSteps.split("\n").map((line) => line.trim()).filter(Boolean)); render(); });
      evidence.append(create);
    }

    const preview = element("section"); preview.setAttribute("aria-label", "Final missing-event report preview");
    const copy = element("button", "Copy for Jira Cloud"); copy.type = "button"; copy.disabled = !completed;
    if (completed) {
      const representations = generateMissingEventRepresentations(completed); preview.innerHTML = representations.previewHtml;
      copy.addEventListener("click", () => {
        const write = options.writeClipboard ?? navigator.clipboard?.writeText?.bind(navigator.clipboard);
        if (!write) { feedback = "Clipboard access is unavailable."; render(); return; }
        void write(representations.jiraText).then(() => { feedback = "Missing-event report copied for Jira Cloud."; render(); }).catch(() => { feedback = "Copy failed. The report is unchanged."; render(); });
      });
    } else preview.append(element("p", "Confirm and verify the expected event to generate the report."));
    const status = element("output", feedback); status.setAttribute("aria-live", "polite");
    root.replaceChildren(header, expectation, warning, evidence, preview, copy, status);
    title.focus({ preventScroll:true });
  };

  const controller: MissingEventBuilderController = { draft:() => draft, report:() => completed, restore:render };
  render();
  return controller;
}
