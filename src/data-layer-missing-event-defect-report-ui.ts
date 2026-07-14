import {
  acceptMissingEventReplacements,
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
import { appendDetailControls, type DefectReportBuilderState } from "./data-layer-defect-report-ui-controls.js";
import { appendReproductionControls } from "./data-layer-defect-report-reproduction-controls.js";
import { appendTimelineControls } from "./data-layer-defect-report-timeline-controls.js";
import type { DefectReport, TimelineSelection } from "./data-layer-defect-report.js";
import type { DefectReportContext } from "./data-layer-defect-report-browser.js";
import {
  createExpectedPayloadDraft,
  expectedPayloadComplete,
  expectedPayloadEvaluation,
  expectedPayloadPresentation,
  missingEventActualPresentation,
  reconcileMissingEventJourney,
  reconcileMissingEventJourneyWithReview,
  type ExpectedPayloadDraft,
} from "./data-layer-unified-defect-builder.js";
import { renderExpectedPayloadEditor } from "./data-layer-missing-event-expected-payload-ui.js";

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
  saveReportedDefect?: (report: MissingEventReport) => void | Promise<void>;
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
  const initialSchema = options.initialSchemaId ? schemas.find(({ id }) => id === options.initialSchemaId) : undefined;
  const inferredVisit = !options.initialVisitId && initialSchema
    ? visits.find((visit) => initialSchema.assignments.some((assignment) => !assignment.pathnameCondition || visit.pathname.startsWith(assignment.pathnameCondition)))
    : undefined;
  if (options.initialVisitId || inferredVisit) draft = changeMissingEventScope(draft, options.initialVisitId ?? inferredVisit!.id);
  if (options.initialSchemaId) draft = selectMissingEventSchema(draft, options.initialSchemaId);
  let overrideExplanation = "";
  let feedback = "";
  let refreshPreview = () => {};
  let expectedPayloadDraft: ExpectedPayloadDraft | undefined = draft.expectation ? createExpectedPayloadDraft(draft.expectation.schema) : undefined;
  let reproductionStartVisitId = draft.visits[0]?.id ?? draft.scope.id;
  let reproductionReview: readonly { text:string; visitId:string; pathname:string }[] = [];
  let timelineSelections: TimelineSelection[] = [];
  const detailEdits: Partial<Record<"summary" | "description" | "expectedExplanation", string>> = {};
  let sharedReport: DefectReport = {
    event:{ id:"expected-event", name:"Expected event", source:"Expectation", pageUrl:"", pathname:"/", captureTime:"", payload:null, schema:{ name:"Expected schema", version:0 }, issues:[] },
    issues:[], actual:{ payload:null, differences:[] }, expected:{ payload:null, corrections:[], explanations:[] }, reproductionSteps:[], timeline:[],
  };
  sharedReport = {
    ...sharedReport,
    reproductionSteps:reconcileMissingEventJourney(
      draft.visits,
      draft.visits[0]?.id ?? draft.scope.id,
      draft.scope.id,
      [],
      { eventName:draft.expectation?.eventName || "expected event", sourceId:draft.expectation?.sourceId || "expected source" },
    ).filter((step): step is Exclude<typeof step, { kind:"assertion" }> => step.kind !== "assertion"),
  };

  const commonContext = (): DefectReportContext => ({
    visits:draft.visits.map((visit) => ({ id:visit.id, pathname:visit.pathname, eventIds:visit.events.map(({ id }) => id) })),
    defectVisitId:draft.scope.id,
    timeline:draft.visits.flatMap((visit) => visit.events.map((event) => ({ id:event.id, captureTime:event.captureTime ?? visit.startedAt, name:event.name, source:event.sourceName ?? event.sourceId, pathname:visit.pathname, validation:event.validation ?? "Not checked", ...(event.payload !== undefined ? { payload:structuredClone(event.payload) } : {}) }))),
  });

  const completedReport = (): MissingEventReport => {
    const report = createMissingEventReport(draft);
    const journey = reconcileMissingEventJourney(draft.visits, reproductionStartVisitId, draft.scope.id, sharedReport.reproductionSteps, { eventName:draft.expectation?.eventName ?? "event", sourceId:draft.expectation?.sourceId ?? "source" });
    const selectedTimeline = new Set(timelineSelections.map(({ eventId }) => eventId));
    return {
      ...report,
      expectedPayload:structuredClone(expectedPayloadDraft?.payload ?? {}),
      expectedResponseSources:structuredClone(expectedPayloadDraft?.responseSources ?? {}),
      expectedResponseProvenance:structuredClone(expectedPayloadDraft?.responseProvenance ?? {}),
      summary:detailEdits.summary ?? report.summary,
      description:detailEdits.description ?? report.description,
      expectedExplanation:detailEdits.expectedExplanation ?? draft.expectation?.explanation ?? "",
      reproductionSteps:journey.map(({ text }) => text),
      reproductionStartVisitId,
      reproductionEndpointVisitId:draft.scope.id,
      timeline:draft.visits.flatMap(({ events }) => events).filter((event) => selectedTimeline.has(event.id)),
    };
  };

  const reportReady = () => Boolean(
    draft.expectation?.confirmed
    && expectedPayloadDraft
    && expectedPayloadComplete(draft.expectation.schema, expectedPayloadDraft)
    && expectedPayloadEvaluation(draft.expectation.schema, expectedPayloadDraft).state === "Valid"
    && (!draft.verification.warningVisible || draft.override),
  );

  const currentReport = (): MissingEventReport | undefined => reportReady() ? completedReport() : undefined;

  const updateDraft = (next: MissingEventDraft) => {
    draft = next;
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
    schemaSelect.addEventListener("change", () => {
      const next = selectMissingEventSchema(draft, schemaSelect.value);
      updateDraft(next);
      expectedPayloadDraft = next.expectation ? createExpectedPayloadDraft(next.expectation.schema) : undefined;
      render();
    });
    schemaLabel.append(schemaSelect);

    const visitLabel = element("label", "To pathname ");
    const visitSelect = element("select"); visitSelect.id = "missing-event-visit";
    for (const visit of draft.visits) {
      const option = element("option", `${visit.pathname} · ${visit.events.length} captured events`); option.value = visit.id; option.selected = visit.id === draft.scope.id; visitSelect.append(option);
    }
    visitSelect.value = draft.scope.id;
    visitSelect.addEventListener("change", () => {
      const next = changeMissingEventScope(draft, visitSelect.value);
      const startIndex = next.visits.findIndex(({ id }) => id === reproductionStartVisitId);
      const endpointIndex = next.visits.findIndex(({ id }) => id === next.scope.id);
      if (startIndex < 0 || startIndex > endpointIndex) reproductionStartVisitId = next.scope.id;
      const reconciled = reconcileMissingEventJourneyWithReview(next.visits, reproductionStartVisitId, next.scope.id, sharedReport.reproductionSteps, { eventName:next.expectation?.eventName || "expected event", sourceId:next.expectation?.sourceId || "expected source" });
      reproductionReview = reconciled.review;
      sharedReport = { ...sharedReport, reproductionSteps:reconciled.journey.filter((step): step is Exclude<typeof step, { kind:"assertion" }> => step.kind !== "assertion") };
      updateDraft(next); render();
    });
    visitLabel.append(visitSelect);
    expectation.append(schemaLabel, visitLabel, element("p", draft.assistance));

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
      const properties = element("section"); properties.setAttribute("aria-label", "Schema-derived expected properties");
      expectedPayloadDraft ??= createExpectedPayloadDraft(selected.schema);
      renderExpectedPayloadEditor(properties, selected.schema, {
        draft:() => expectedPayloadDraft!,
        update:(next) => { expectedPayloadDraft = next; },
        refresh:() => refreshPreview(),
        issues:() => expectedPayloadEvaluation(selected.schema, expectedPayloadDraft!).issues,
      });
      expectation.append(properties);
      const evaluation = expectedPayloadEvaluation(selected.schema, expectedPayloadDraft);
      const evaluationState = element("output", evaluation.state); evaluationState.dataset.expectedPayloadValidation = "state";
      const evaluationIssues = element("ul"); evaluationIssues.setAttribute("aria-label", "Expected payload validation issues");
      for (const issue of evaluation.issues) evaluationIssues.append(element("li", `${issue.instancePath || "/"}: ${issue.message}`));
      expectation.append(evaluationState, evaluationIssues);
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
    const anyway = element("button", "Override matching-event warning"); anyway.type = "button";
    anyway.addEventListener("click", () => { updateDraft(overrideMissingEventWarning(draft, overrideExplanation)); render(); });
    warning.append(overrideLabel, anyway);

    const reproductionControls = element("div"); const reproductionSteps = element("ol");
    const timelineComposer = element("div"); timelineComposer.className = "defect-timeline-composer"; timelineComposer.setAttribute("aria-label", "Timeline composer");
    const timelineEntries = element("ul"); timelineEntries.setAttribute("aria-label", "Supporting timeline entries");
    const detailControls = element("div");
    const commonState: DefectReportBuilderState = { report:() => sharedReport, update:(next) => { sharedReport = next; }, refresh:() => refreshPreview() };
    appendReproductionControls(reproductionControls, reproductionSteps, commonContext(), commonState, {
      startLabel:"From pathname ",
      initialStartVisitId:reproductionStartVisitId,
      onStartVisitChange:(visitId) => { reproductionStartVisitId = visitId; refreshPreview(); },
      finalStep:() => ({ text:`Expect ${selected?.eventName || "expected event"} to be pushed to ${selected?.sourceId || "expected source"} during ${draft.scope.pathname}`, visitId:draft.scope.id, pathname:draft.scope.pathname }),
    });
    appendTimelineControls(timelineComposer, timelineEntries, commonContext(), commonState, {
      selections:timelineSelections,
      onSelectionsChange:(next) => { timelineSelections = next.map((selection) => ({ ...selection })); },
    });
    appendDetailControls(detailControls, detailEdits, () => refreshPreview());
    if (reproductionReview.length) {
      const review = element("section"); review.setAttribute("aria-label", "Reproduction steps outside selected journey");
      review.append(element("h6", "Steps outside the selected journey — review before discarding"));
      for (const step of reproductionReview) review.append(element("p", `${step.pathname} · ${step.text}`));
      reproductionControls.append(review);
    }

    const legacyPreview = element("section"); legacyPreview.setAttribute("aria-label", "Final missing-event report preview"); legacyPreview.hidden = true;
    const preview = element("section"); preview.setAttribute("aria-label", "Final report preview");
    const copy = element("button", "Copy for Jira Cloud"); copy.type = "button";
    const save = element("button", "Save as reported defect"); save.type = "button";
    const saveAndCopy = element("button", "Save as reported defect and copy"); saveAndCopy.type = "button";
    const status = element("output", feedback); status.setAttribute("aria-live", "polite");
    refreshPreview = () => {
      const summary = detailEdits.summary ?? `Missing event: ${selected?.eventName || "expected event"}`;
      const description = detailEdits.description ?? `${selected?.eventName || "The event"} was expected during ${draft.scope.pathname}.`;
      const actual = selected ? missingEventActualPresentation({ eventName:selected.eventName, sourceId:selected.sourceId, pathname:draft.scope.pathname, visitId:draft.scope.id }) : "Select and confirm an expected schema.";
      const expectedText = selected && expectedPayloadDraft
        ? `${expectedPayloadPresentation(selected.eventName, expectedPayloadDraft.payload)}\n${JSON.stringify(expectedPayloadDraft.payload, null, 2)}`
        : "Select an expected schema to build the expected payload.";
      const journey = selected ? reconcileMissingEventJourney(draft.visits, reproductionStartVisitId, draft.scope.id, sharedReport.reproductionSteps, { eventName:selected.eventName, sourceId:selected.sourceId }) : [];
      const steps = journey.map(({ text }) => text).join("\n");
      const timeline = sharedReport.timeline.length ? sharedReport.timeline.map(({ captureTime, name, source, pathname }) => `${captureTime} · ${name} · ${source} · ${pathname}`).join("\n") : "No supporting captured events selected";
      const report = currentReport();
      if (selected && expectedPayloadDraft) {
        const evaluation = expectedPayloadEvaluation(selected.schema, expectedPayloadDraft);
        const canQuery = typeof root.querySelector === "function";
        const evaluationState = canQuery ? root.querySelector<HTMLOutputElement>('[data-expected-payload-validation="state"]') : null;
        if (evaluationState) evaluationState.textContent = evaluation.state;
        const issueList = canQuery ? root.querySelector<HTMLUListElement>('[aria-label="Expected payload validation issues"]') : null;
        if (issueList) {
          issueList.replaceChildren();
          for (const issue of evaluation.issues) issueList.append(element("li", `${issue.instancePath || "/"}: ${issue.message}`));
        }
      }
      if (report) {
        const representations = generateMissingEventRepresentations(report);
        preview.innerHTML = representations.previewHtml;
        legacyPreview.innerHTML = representations.previewHtml;
      } else {
        preview.replaceChildren();
        const capture = draft.verification.warningVisible
          ? `${draft.verification.matchingCount} matching event(s) found; explicit override is required.`
          : `Selected page visit ${draft.scope.pathname} (${draft.scope.id}).`;
        for (const [headingText, content] of [["Summary",summary],["Description",description],["Steps to reproduce",steps],["Actual result",actual],["Expected result",`${detailEdits.expectedExplanation ?? ""}\n${expectedText}`.trim()],["Schema expectation",selected ? `${selected.schema.name} revision ${selected.schema.version} · ${selected.sourceId}/${selected.eventName}/${selected.target}` : "Incomplete"],["Capture evidence",capture],["Supporting timeline",timeline]]) {
          preview.append(element("h2", headingText), element("p", content));
        }
        legacyPreview.innerHTML = preview.innerHTML;
      }
      copy.disabled = save.disabled = saveAndCopy.disabled = !report;
      for (const input of Array.from(detailControls.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-report-field]"))) {
        const field = input.dataset.reportField as keyof typeof detailEdits;
        if (input.dataset.edited !== "true") input.value = field === "summary" ? summary : field === "description" ? description : expectedText;
      }
    };
    const writeCurrent = async (report: MissingEventReport) => {
      const write = options.writeClipboard ?? navigator.clipboard?.writeText?.bind(navigator.clipboard);
      if (!write) throw new Error("Clipboard access is unavailable.");
      await write(generateMissingEventRepresentations(report).jiraText);
    };
    const setFeedback = (message:string) => { feedback = message; status.textContent = message; };
    copy.addEventListener("click", () => {
      const report = currentReport(); if (!report) return;
      setFeedback("");
      void writeCurrent(report).then(() => setFeedback("Missing-event report copied for Jira Cloud.")).catch(() => setFeedback("Copy failed"));
    });
    save.addEventListener("click", () => {
      const report = currentReport(); if (!report || !options.saveReportedDefect) return;
      setFeedback("");
      void Promise.resolve().then(() => options.saveReportedDefect!(report)).then(() => setFeedback("Missing-event report saved in Defect Library.")).catch(() => setFeedback("Save failed"));
    });
    saveAndCopy.addEventListener("click", () => {
      const report = currentReport(); if (!report || !options.saveReportedDefect) return;
      setFeedback("");
      void Promise.resolve().then(() => options.saveReportedDefect!(report)).then(() => writeCurrent(report)).then(() => setFeedback("Missing-event report saved and copied for Jira Cloud.")).catch((error) => setFeedback(error instanceof Error && /clipboard/i.test(error.message) ? "Copy failed" : "Save failed"));
    });
    const evidenceStage = element("section"); evidenceStage.setAttribute("aria-label", "Expected-event confirmation and absence verification"); evidenceStage.append(expectation, warning);
    root.replaceChildren(header, evidenceStage,
      element("h5", "Expected result"),
      element("h5", "Steps to reproduce"), reproductionControls, reproductionSteps,
      element("h5", "Supporting timeline"), timelineComposer, timelineEntries,
      element("h5", "Report details"), detailControls,
      preview, legacyPreview, copy, save, saveAndCopy, status);
    refreshPreview();
    title.focus({ preventScroll:true });
  };

  const controller: MissingEventBuilderController = { draft:() => draft, report:() => currentReport(), restore:render };
  render();
  return controller;
}
