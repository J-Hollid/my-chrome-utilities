import { generatePathnameSkeleton } from "./data-layer-defect-report.js";
import { browserDefectReportClipboard, defectReportContext } from "./data-layer-defect-report-browser.js";
import { appendReproductionControls } from "./data-layer-defect-report-reproduction-controls.js";
import { appendTimelineControls } from "./data-layer-defect-report-timeline-controls.js";
import { appendDetailControls } from "./data-layer-defect-report-ui-controls.js";
import { confirmOccurrenceExpectation, createOccurrenceDefectDraft, createOccurrenceReport, editOccurrenceExpectedPayload, renderOccurrenceReport, selectOccurrenceExpectedIdentity, } from "./data-layer-event-occurrence-defect-report.js";
function pathname(pageUrl) {
    try {
        return new URL(pageUrl ?? "https://local.invalid/").pathname;
    }
    catch {
        return "/";
    }
}
export function occurrenceActualEvent(event, sessionEvents) {
    const context = defectReportContext(sessionEvents, event.id);
    return {
        id: event.id,
        sourceId: event.sourceId,
        ...(event.sourceName ? { sourceName: event.sourceName } : {}),
        eventName: event.name,
        target: event.validationDetails?.assignment?.target ?? "payload",
        payload: structuredClone(event.payload),
        validation: event.validation ?? "Not checked",
        ...(event.validationDetails?.schema ? { schema: { ...event.validationDetails.schema } } : {}),
        captureTime: event.captureTime,
        pageUrl: event.pageUrl ?? "",
        visitId: context.defectVisitId,
        pathname: pathname(event.pageUrl),
    };
}
export function occurrenceAssignments(schemas) {
    return schemas.flatMap((schema) => schema.assignments
        .filter((assignment) => assignment.enabled !== false)
        .map((assignment, index) => ({
        id: assignment.id ?? `${schema.id}:assignment:${index}`,
        ...(assignment.name ? { name: assignment.name } : {}),
        sourceId: assignment.sourceId,
        eventName: assignment.eventName,
        target: assignment.target,
        pathname: assignment.pathnameCondition ?? "/",
        schemaId: schema.id,
    })));
}
function heading(text) {
    const result = document.createElement("h5");
    result.textContent = text;
    return result;
}
function occurrenceVisitEvents(events) {
    return events.map((event) => occurrenceActualEvent(event, events));
}
async function copyOccurrenceReport(report, clipboard) {
    const rendered = renderOccurrenceReport(report);
    if (clipboard.writeRich) {
        try {
            await clipboard.writeRich(rendered.html, rendered.text);
            return "Copied rich report for Jira Cloud.";
        }
        catch { /* Fall through to plain text. */ }
    }
    if (!clipboard.writeText)
        throw new Error("Clipboard access is unavailable.");
    await clipboard.writeText(rendered.text);
    return "Copied plain-text report for Jira Cloud.";
}
export function renderOccurrenceDefectReportBuilder(root, event, mode, schemas, sessionEvents = [event], clipboard = browserDefectReportClipboard(), navigation, persistence) {
    const actual = occurrenceActualEvent(event, sessionEvents);
    const context = defectReportContext(sessionEvents, event.id);
    let draft = createOccurrenceDefectDraft(actual, mode, {
        assignments: occurrenceAssignments(schemas), schemas,
        visitEvents: occurrenceVisitEvents(sessionEvents),
    });
    if (context.visits.length)
        draft.reproductionSteps = generatePathnameSkeleton(context.visits, context.visits[0].id, context.defectVisitId);
    const detailEdits = {};
    const title = document.createElement("h4");
    title.textContent = `${mode}: ${event.name}`;
    title.tabIndex = -1;
    const header = document.createElement("header");
    header.className = "detail-view-header";
    const back = document.createElement("button");
    back.type = "button";
    back.textContent = "Back to captured event";
    back.disabled = !navigation;
    back.onclick = () => navigation?.backToCapturedEvent();
    const feed = document.createElement("button");
    feed.type = "button";
    feed.textContent = "Back to Live feed";
    feed.disabled = !navigation;
    feed.onclick = () => navigation?.backToLiveFeed();
    header.append(back, feed, title);
    const evidence = document.createElement("section");
    evidence.dataset.evidenceStage = mode === "Unexpected event" ? "captured occurrence and absence expectation" : "captured occurrence and replacement event identity";
    evidence.setAttribute("aria-label", "Occurrence evidence");
    const evidenceText = document.createElement("pre");
    evidenceText.textContent = `${event.name} · ${actual.validation}\n${actual.sourceName ?? actual.sourceId} · ${actual.captureTime}\n${actual.pageUrl} · ${actual.visitId}\n${JSON.stringify(actual.payload, null, 2)}`;
    evidence.append(evidenceText);
    const expectation = document.createElement("section");
    expectation.setAttribute("aria-label", "Expected event occurrence");
    const guardrail = document.createElement("output");
    guardrail.setAttribute("aria-live", "polite");
    const confirmation = document.createElement("button");
    confirmation.type = "button";
    confirmation.textContent = "Confirm expectation";
    const overrideLabel = document.createElement("label");
    const override = document.createElement("input");
    override.type = "checkbox";
    override.dataset.occurrenceOverride = "true";
    overrideLabel.append(override, " Explicit override");
    const acknowledgementLabel = document.createElement("label");
    const acknowledgement = document.createElement("input");
    acknowledgement.type = "checkbox";
    acknowledgement.dataset.occurrenceAcknowledgement = "true";
    acknowledgementLabel.append(acknowledgement, " Acknowledge non-schema expectation");
    const expectedPayloadLabel = document.createElement("label");
    expectedPayloadLabel.textContent = "Expected payload ";
    const expectedPayload = document.createElement("textarea");
    expectedPayload.dataset.occurrenceExpectedPayload = "true";
    expectedPayloadLabel.append(expectedPayload);
    const identityControls = document.createElement("div");
    const preview = document.createElement("section");
    preview.setAttribute("aria-label", "Final report preview");
    const feedback = document.createElement("output");
    feedback.setAttribute("aria-live", "polite");
    const reproductionControls = document.createElement("div");
    const reproductionSteps = document.createElement("ol");
    const timelineControls = document.createElement("div");
    timelineControls.className = "defect-timeline-composer";
    timelineControls.setAttribute("aria-label", "Timeline composer");
    const timeline = document.createElement("ul");
    timeline.setAttribute("aria-label", "Supporting timeline entries");
    const detailControls = document.createElement("div");
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copy for Jira Cloud";
    copy.dataset.actionVariant = "primary";
    const persistenceControls = document.createElement("section");
    persistenceControls.setAttribute("aria-label", "Reported defect actions");
    const duplicateReview = document.createElement("section");
    duplicateReview.hidden = true;
    duplicateReview.setAttribute("aria-label", "Existing reported defects");
    let report;
    const applyDetails = (generated) => ({
        ...generated,
        summary: detailEdits.summary ?? generated.summary,
        description: detailEdits.description ?? generated.description,
        expectedExplanation: detailEdits.expectedExplanation ?? generated.expectedExplanation,
    });
    const refresh = () => {
        guardrail.textContent = draft.guardrail ?? (draft.confirmed ? "Expectation confirmed" : "Confirm the occurrence expectation.");
        expectedPayloadLabel.hidden = mode === "Unexpected event" || draft.expectedPayload === undefined;
        if (document.activeElement !== expectedPayload && draft.expectedPayload !== undefined)
            expectedPayload.value = JSON.stringify(draft.expectedPayload, null, 2);
        try {
            report = applyDetails(createOccurrenceReport(draft));
            preview.innerHTML = renderOccurrenceReport(report).html;
            feedback.textContent = "";
        }
        catch {
            report = undefined;
            preview.textContent = "Confirm the expectation to generate the final report.";
        }
        if (report)
            for (const input of Array.from(detailControls.querySelectorAll("[data-report-field]"))) {
                const field = input.dataset.reportField;
                if (input.dataset.edited !== "true")
                    input.value = report[field];
            }
    };
    const state = {
        report: () => draft,
        update: (next) => { draft = next; },
        refresh,
    };
    if (mode === "Wrong event name") {
        const assignmentLabel = document.createElement("label");
        assignmentLabel.textContent = "Expected identity ";
        const assignment = document.createElement("select");
        assignment.dataset.occurrenceExpectedIdentity = "true";
        assignment.append(Object.assign(document.createElement("option"), { value: "", textContent: "Choose an assignment" }), ...draft.assignments.map((candidate) => Object.assign(document.createElement("option"), { value: candidate.id, textContent: `${candidate.name ?? candidate.eventName} · ${candidate.sourceId} · ${candidate.target} · ${candidate.pathname}` })));
        if (draft.expectedIdentity?.assignmentId)
            assignment.value = draft.expectedIdentity.assignmentId;
        assignment.onchange = () => {
            const selected = draft.assignments.find(({ id }) => id === assignment.value);
            if (selected)
                draft = selectOccurrenceExpectedIdentity(draft, { sourceId: selected.sourceId, eventName: selected.eventName, target: selected.target, pathname: selected.pathname, assignmentId: selected.id, ...(selected.schemaId ? { schemaId: selected.schemaId } : {}) });
            refresh();
        };
        const custom = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.textContent = "Custom expected identity";
        const fields = [['sourceId', actual.sourceId], ['eventName', ''], ['target', actual.target], ['pathname', actual.pathname]].map(([field, value]) => {
            const label = document.createElement("label");
            label.textContent = `${field} `;
            const input = document.createElement("input");
            input.dataset.occurrenceIdentityField = field;
            input.value = value;
            label.append(input);
            return { field, input, label };
        });
        const useCustom = document.createElement("button");
        useCustom.type = "button";
        useCustom.textContent = "Use custom identity";
        useCustom.onclick = () => {
            const identity = Object.fromEntries(fields.map(({ field, input }) => [field, input.value]));
            draft = selectOccurrenceExpectedIdentity(draft, identity);
            refresh();
        };
        custom.append(legend, ...fields.map(({ label }) => label), useCustom);
        assignmentLabel.append(assignment);
        identityControls.append(assignmentLabel, custom);
    }
    else
        identityControls.append(document.createTextNode(`Expected result: no ${event.name} event is fired during ${actual.pathname}.`));
    expectedPayload.addEventListener("input", () => {
        try {
            draft = editOccurrenceExpectedPayload(draft, JSON.parse(expectedPayload.value));
            expectedPayload.setCustomValidity("");
        }
        catch {
            expectedPayload.setCustomValidity("Enter valid JSON.");
        }
        refresh();
    });
    confirmation.onclick = () => {
        try {
            draft = confirmOccurrenceExpectation(draft, { override: override.checked, acknowledgeWarning: acknowledgement.checked });
            refresh();
        }
        catch (error) {
            feedback.textContent = error instanceof Error ? error.message : "Expectation could not be confirmed.";
        }
    };
    expectation.append(identityControls, expectedPayloadLabel, overrideLabel, acknowledgementLabel, confirmation, guardrail);
    appendReproductionControls(reproductionControls, reproductionSteps, context, state, {
        finalStep: () => ({
            text: mode === "Unexpected event"
                ? `Expect no ${actual.eventName} event to be pushed during ${actual.pathname}`
                : `Expect ${draft.expectedIdentity?.eventName ?? "a different event"} instead of ${actual.eventName} during ${actual.pathname}`,
            visitId: actual.visitId, pathname: actual.pathname,
        }),
    });
    appendTimelineControls(timelineControls, timeline, context, state);
    appendDetailControls(detailControls, detailEdits, refresh);
    copy.onclick = () => {
        if (!report) {
            feedback.textContent = "Confirm the expectation before copying.";
            return;
        }
        void copyOccurrenceReport(report, clipboard).then((message) => { feedback.textContent = message; }).catch(() => { feedback.textContent = "Copy failed."; });
    };
    const persist = async (copyAfterSave, saveSeparately = false) => {
        if (!persistence || !report) {
            feedback.textContent = "Confirm the expectation before saving.";
            return;
        }
        const result = await persistence.save(report, { copy: copyAfterSave, saveSeparately });
        feedback.textContent = result.feedback;
        duplicateReview.replaceChildren();
        duplicateReview.hidden = !result.existing?.length;
        for (const existing of result.existing ?? []) {
            const open = document.createElement("button");
            open.type = "button";
            open.textContent = `Open existing defect · ${existing.label}`;
            open.onclick = () => persistence.openExisting(existing.id);
            duplicateReview.append(open);
        }
        if (result.existing?.length) {
            const update = document.createElement("button");
            update.type = "button";
            update.textContent = "Update existing defect";
            update.onclick = () => persistence.updateExisting(result.existing[0].id, report);
            const separate = document.createElement("button");
            separate.type = "button";
            separate.textContent = "Save separately";
            separate.onclick = () => { void persist(copyAfterSave, true); };
            duplicateReview.append(update, separate);
        }
    };
    if (persistence) {
        const save = document.createElement("button");
        save.type = "button";
        save.textContent = "Save as reported defect";
        save.onclick = () => { void persist(false); };
        const saveCopy = document.createElement("button");
        saveCopy.type = "button";
        saveCopy.textContent = "Save as reported defect and copy";
        saveCopy.onclick = () => { void persist(true); };
        persistenceControls.append(save, saveCopy);
    }
    root.replaceChildren(header, heading("Occurrence evidence"), evidence, heading("Expected result"), expectation, heading("Steps to reproduce"), reproductionControls, reproductionSteps, heading("Supporting timeline"), timelineControls, timeline, heading("Report details"), detailControls, preview, copy, persistenceControls, duplicateReview, feedback);
    refresh();
    title.focus({ preventScroll: true });
}
//# sourceMappingURL=data-layer-event-occurrence-defect-report-ui.js.map