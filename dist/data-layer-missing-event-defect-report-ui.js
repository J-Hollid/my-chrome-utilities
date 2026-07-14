import { acceptMissingEventReplacements, changeMissingEventInterval, changeMissingEventScope, confirmMissingEventExpectation, createMissingEventDraft, createMissingEventReport, editMissingEventExpectation, generateMissingEventRepresentations, overrideMissingEventWarning, selectMissingEventAssignment, selectMissingEventSchema, verifyMissingEventAbsence, } from "./data-layer-missing-event-defect-report.js";
import { appendDetailControls } from "./data-layer-defect-report-ui-controls.js";
import { appendReproductionControls } from "./data-layer-defect-report-reproduction-controls.js";
import { appendTimelineControls } from "./data-layer-defect-report-timeline-controls.js";
import { expectedPropertyChoices, expectedPropertyPresentation, reconcileMissingEventJourney } from "./data-layer-unified-defect-builder.js";
function element(tag, text) {
    const result = document.createElement(tag);
    if (text !== undefined)
        result.textContent = text;
    return result;
}
function labelledInput(labelText, value, update) {
    const label = element("label", labelText);
    const input = element("input");
    input.type = "text";
    input.value = value;
    input.addEventListener("input", () => update(input.value));
    label.append(input);
    return label;
}
function pathname(url) {
    try {
        return new URL(url).pathname;
    }
    catch {
        return "/";
    }
}
export function missingEventVisits(events, currentPageUrl, immutable = false) {
    const visits = [];
    for (const event of events) {
        const pageUrl = event.pageUrl ?? currentPageUrl;
        const latest = visits.at(-1);
        const item = {
            id: event.id,
            name: event.name,
            sourceId: event.sourceId,
            ...(event.sourceName ? { sourceName: event.sourceName } : {}),
            pageUrl,
            ...(event.captureTime ? { captureTime: event.captureTime } : {}),
            ...(event.validation ? { validation: event.validation } : {}),
            ...(event.payload !== undefined ? { payload: structuredClone(event.payload) } : {}),
            ...(event.rawInput !== undefined ? { rawInput: structuredClone(event.rawInput) } : {}),
        };
        if (latest?.pageUrl === pageUrl) {
            latest.events = [...latest.events, item];
            latest.endedAt = event.captureTime ?? latest.endedAt;
        }
        else {
            const timestamp = event.captureTime ?? new Date(0).toISOString();
            visits.push({ id: `visit:${visits.length + 1}`, pageUrl, pathname: pathname(pageUrl), startedAt: timestamp, endedAt: timestamp, events: [item], ...(immutable ? { immutable: true } : {}) });
        }
    }
    const latest = visits.at(-1);
    if (!latest || latest.pageUrl !== currentPageUrl) {
        const boundary = latest?.endedAt ?? new Date(0).toISOString();
        visits.push({ id: `visit:${visits.length + 1}`, pageUrl: currentPageUrl, pathname: pathname(currentPageUrl), startedAt: boundary, endedAt: new Date(8.64e15).toISOString(), events: [], ...(immutable ? { immutable: true } : {}) });
    }
    return visits;
}
export function renderMissingEventDefectReportBuilder(root, visits, schemas, options) {
    let draft = createMissingEventDraft(options.entryPoint, visits, schemas);
    const initialSchema = options.initialSchemaId ? schemas.find(({ id }) => id === options.initialSchemaId) : undefined;
    const inferredVisit = !options.initialVisitId && initialSchema
        ? visits.find((visit) => initialSchema.assignments.some((assignment) => !assignment.pathnameCondition || visit.pathname.startsWith(assignment.pathnameCondition)))
        : undefined;
    if (options.initialVisitId || inferredVisit)
        draft = changeMissingEventScope(draft, options.initialVisitId ?? inferredVisit.id);
    if (options.initialSchemaId)
        draft = selectMissingEventSchema(draft, options.initialSchemaId);
    let completed;
    let overrideExplanation = "";
    let feedback = "";
    let refreshPreview = () => { };
    const expectedResponses = new Map();
    const detailEdits = {};
    let sharedReport = {
        event: { id: "expected-event", name: "Expected event", source: "Expectation", pageUrl: "", pathname: "/", captureTime: "", payload: null, schema: { name: "Expected schema", version: 0 }, issues: [] },
        issues: [], actual: { payload: null, differences: [] }, expected: { payload: null, corrections: [], explanations: [] }, reproductionSteps: [], timeline: [],
    };
    sharedReport = {
        ...sharedReport,
        reproductionSteps: reconcileMissingEventJourney(draft.visits, draft.visits[0]?.id ?? draft.scope.id, draft.scope.id, [], { eventName: draft.expectation?.eventName || "expected event", sourceId: draft.expectation?.sourceId || "expected source" }).filter((step) => step.kind !== "assertion"),
    };
    const commonContext = () => ({
        visits: draft.visits.map((visit) => ({ id: visit.id, pathname: visit.pathname, eventIds: visit.events.map(({ id }) => id) })),
        defectVisitId: draft.scope.id,
        timeline: draft.visits.flatMap((visit) => visit.events.map((event) => ({ id: event.id, captureTime: event.captureTime ?? visit.startedAt, name: event.name, source: event.sourceName ?? event.sourceId, pathname: visit.pathname, validation: event.validation ?? "Not checked", ...(event.payload !== undefined ? { payload: structuredClone(event.payload) } : {}) }))),
    });
    const expectedLines = () => draft.expectation ? expectedPropertyChoices(draft.expectation.schema)
        .filter((property) => property.required || expectedResponses.has(property.pointer))
        .map((property) => expectedPropertyPresentation(property, expectedResponses.get(property.pointer) ?? { method: "generic" })) : [];
    const completedReport = () => {
        const report = createMissingEventReport(draft);
        const assertion = `Expect ${draft.expectation?.eventName ?? "event"} to be pushed to ${draft.expectation?.sourceId ?? "source"} during ${draft.scope.pathname}`;
        const steps = sharedReport.reproductionSteps.length ? sharedReport.reproductionSteps.map(({ text }) => text.replace(/^\d+\.\s*/, "")) : [`Visit ${draft.scope.pathname}`];
        const expected = expectedLines();
        const selectedTimeline = new Set(sharedReport.timeline.map((entry) => `${entry.captureTime}\0${entry.name}\0${entry.source}`));
        return {
            ...report,
            expected: [report.expected, ...expected.map(({ text, source }) => `${text} (${source})`)].join(". "),
            reproductionSteps: [...steps, assertion],
            timeline: draft.visits.flatMap(({ events }) => events).filter((event) => selectedTimeline.has(`${event.captureTime ?? ""}\0${event.name}\0${event.sourceName ?? event.sourceId}`)),
        };
    };
    const updateDraft = (next) => {
        draft = next;
        completed = undefined;
        options.onDraftChange?.(draft);
    };
    const render = () => {
        const title = element("h4", "Missing event defect report");
        title.tabIndex = -1;
        const header = element("header");
        header.className = "detail-view-header";
        const backVisit = element("button", "Back to selected page visit");
        backVisit.type = "button";
        const backFeed = element("button", "Back to Live feed");
        backFeed.type = "button";
        backVisit.addEventListener("click", () => { options.navigation?.backToSelectedVisit(); options.navigation?.focusReportMissingEvent?.(); });
        backFeed.addEventListener("click", () => options.navigation?.backToLiveFeed());
        header.append(backVisit, backFeed, title);
        const expectation = element("section");
        expectation.setAttribute("aria-label", "Expected event");
        expectation.append(element("h5", "Expected event"));
        const schemaLabel = element("label", "Expected schema");
        const schemaSelect = element("select");
        schemaSelect.id = "missing-event-schema";
        schemaSelect.append(element("option", "Choose a schema"));
        for (const schema of schemas) {
            const option = element("option", `${schema.name} revision ${schema.version}`);
            option.value = schema.id;
            option.selected = draft.expectation?.schema.id === schema.id;
            schemaSelect.append(option);
        }
        schemaSelect.value = draft.expectation?.schema.id ?? "";
        schemaSelect.addEventListener("change", () => { updateDraft(selectMissingEventSchema(draft, schemaSelect.value)); render(); });
        schemaLabel.append(schemaSelect);
        const visitLabel = element("label", "Expectation scope");
        const visitSelect = element("select");
        visitSelect.id = "missing-event-visit";
        for (const visit of draft.visits) {
            const option = element("option", `${visit.pathname} · ${visit.events.length} captured events`);
            option.value = visit.id;
            option.selected = visit.id === draft.scope.id;
            visitSelect.append(option);
        }
        visitSelect.value = draft.scope.id;
        visitSelect.addEventListener("change", () => {
            const next = changeMissingEventScope(draft, visitSelect.value);
            const startId = sharedReport.reproductionSteps.find(({ kind }) => kind === "pathname")?.visitId ?? next.visits[0]?.id ?? next.scope.id;
            const journey = reconcileMissingEventJourney(next.visits, startId, next.scope.id, sharedReport.reproductionSteps, { eventName: next.expectation?.eventName || "expected event", sourceId: next.expectation?.sourceId || "expected source" });
            sharedReport = { ...sharedReport, reproductionSteps: journey.filter((step) => step.kind !== "assertion") };
            updateDraft(next);
            render();
        });
        visitLabel.append(visitSelect);
        expectation.append(schemaLabel, visitLabel, element("p", draft.assistance));
        const interval = element("fieldset");
        interval.append(element("legend", "Observation interval"));
        let intervalStart = draft.scope.startedAt;
        let intervalEnd = draft.scope.endedAt;
        interval.append(labelledInput("Observation start (ISO)", intervalStart, (value) => { intervalStart = value; }), labelledInput("Observation end (ISO)", intervalEnd, (value) => { intervalEnd = value; }));
        const applyInterval = element("button", "Apply observation interval");
        applyInterval.type = "button";
        applyInterval.addEventListener("click", () => {
            try {
                updateDraft(changeMissingEventInterval(draft, intervalStart, intervalEnd));
                feedback = "Observation interval updated; matching-event verification must run again.";
            }
            catch (error) {
                feedback = error instanceof Error ? error.message : "Observation interval is invalid.";
            }
            render();
        });
        interval.append(applyInterval);
        expectation.append(interval);
        const selected = draft.expectation;
        if (selected) {
            if (selected.assignmentChoices.length > 1) {
                const assignmentLabel = element("label", "Enabled assignment");
                const assignmentSelect = element("select");
                assignmentSelect.append(element("option", "Choose an assignment"));
                for (const assignment of selected.assignmentChoices) {
                    const option = element("option", assignment.name ?? assignment.id ?? `${assignment.sourceId}/${assignment.eventName}`);
                    option.value = assignment.id ?? "";
                    option.selected = assignment.id === selected.assignment?.id;
                    assignmentSelect.append(option);
                }
                assignmentSelect.addEventListener("change", () => { updateDraft(selectMissingEventAssignment(draft, assignmentSelect.value)); render(); });
                assignmentLabel.append(assignmentSelect);
                expectation.append(assignmentLabel);
            }
            if (selected.disabledAssignmentContext.length > 0) {
                const disabledContext = element("section");
                disabledContext.setAttribute("aria-label", "Disabled assignment context");
                disabledContext.append(element("h6", "Disabled assignments — non-authoritative context"));
                for (const assignment of selected.disabledAssignmentContext) {
                    disabledContext.append(element("p", `${assignment.name ?? assignment.id ?? "Disabled assignment"} · ${assignment.sourceId}/${assignment.eventName}/${assignment.target}`));
                }
                expectation.append(disabledContext);
            }
            if (draft.replacementReview.length > 0) {
                const review = element("section");
                review.setAttribute("aria-label", "Expected-event replacement review");
                review.append(element("h6", "Review schema-derived replacements"));
                for (const replacement of draft.replacementReview)
                    review.append(element("p", `${replacement.field}: ${String(replacement.current)} would be replaced by ${String(replacement.proposed)}`));
                const keep = element("button", "Keep current expected-event values");
                keep.type = "button";
                keep.addEventListener("click", () => { updateDraft({ ...draft, replacementReview: [] }); render(); });
                const accept = element("button", "Accept schema-derived expected-event values");
                accept.type = "button";
                accept.addEventListener("click", () => { updateDraft(acceptMissingEventReplacements(draft)); render(); });
                review.append(keep, accept);
                expectation.append(review);
            }
            const edit = (field) => (value) => updateDraft(editMissingEventExpectation(draft, { [field]: value }));
            expectation.append(labelledInput("Expected source", selected.sourceId, edit("sourceId")), labelledInput("Expected event name", selected.eventName, edit("eventName")));
            const targetLabel = element("label", "Validation target");
            const target = element("select");
            for (const value of ["payload", "raw input"]) {
                const option = element("option", value);
                option.value = value;
                option.selected = value === selected.target;
                target.append(option);
            }
            target.value = selected.target;
            target.addEventListener("change", () => updateDraft(editMissingEventExpectation(draft, { target: target.value })));
            targetLabel.append(target);
            expectation.append(targetLabel, labelledInput("Expected page URL", selected.pageUrl, edit("pageUrl")), labelledInput("Expectation explanation", selected.explanation, edit("explanation")));
            const properties = element("section");
            properties.setAttribute("aria-label", "Schema-derived expected properties");
            properties.append(element("h6", "Schema-derived expected properties"));
            for (const property of expectedPropertyChoices(selected.schema)) {
                const field = element("fieldset");
                const legend = element("legend", `${property.property} · ${property.constraint}`);
                field.append(legend);
                if (!property.required) {
                    const includeLabel = element("label", `Include optional ${property.property}`);
                    const include = element("input");
                    include.type = "checkbox";
                    include.checked = expectedResponses.has(property.pointer);
                    include.addEventListener("change", () => { if (include.checked)
                        expectedResponses.set(property.pointer, { method: "generic" });
                    else
                        expectedResponses.delete(property.pointer); completed = undefined; render(); });
                    includeLabel.prepend(include);
                    field.append(includeLabel);
                    if (!include.checked) {
                        properties.append(field);
                        continue;
                    }
                }
                const addChoice = (labelText, response) => {
                    const label = element("label", labelText);
                    const radio = element("input");
                    radio.type = "radio";
                    radio.name = `missing-expected-${property.property}`;
                    radio.checked = JSON.stringify(expectedResponses.get(property.pointer) ?? { method: "generic" }) === JSON.stringify(response);
                    radio.addEventListener("change", () => { if (radio.checked) {
                        expectedResponses.set(property.pointer, response);
                        completed = undefined;
                        refreshPreview();
                    } });
                    label.prepend(radio);
                    field.append(label);
                };
                addChoice("Use generic constraint", { method: "generic" });
                for (const value of property.schemaValues)
                    addChoice(`Use schema value ${String(value)}`, { method: "schema-value", value });
                const customLabel = element("label", "Custom value ");
                const custom = element("input");
                custom.type = "text";
                custom.addEventListener("input", () => { if (custom.value) {
                    expectedResponses.set(property.pointer, { method: "custom", value: custom.value });
                    completed = undefined;
                    refreshPreview();
                } });
                customLabel.append(custom);
                field.append(customLabel);
                const current = expectedPropertyPresentation(property, expectedResponses.get(property.pointer) ?? { method: "generic" });
                const source = element("output", `${current.text} · response source: ${current.source}`);
                source.dataset.expectedProperty = property.property;
                field.append(source);
                properties.append(field);
            }
            expectation.append(properties);
            if (!selected.assignment) {
                const acknowledgement = element("label", "I acknowledge that no enabled covering assignment proves this expectation");
                const checkbox = element("input");
                checkbox.type = "checkbox";
                checkbox.checked = selected.warningAcknowledged;
                checkbox.addEventListener("change", () => updateDraft(editMissingEventExpectation(draft, { warningAcknowledged: checkbox.checked })));
                acknowledgement.prepend(checkbox);
                expectation.append(acknowledgement);
            }
            const confirm = element("button", "Confirm at least one matching event was expected");
            confirm.type = "button";
            confirm.addEventListener("click", () => {
                try {
                    updateDraft(verifyMissingEventAbsence(confirmMissingEventExpectation(draft)));
                    feedback = "Absence verification complete.";
                }
                catch (error) {
                    feedback = error instanceof Error ? error.message : "Expectation confirmation failed.";
                }
                render();
            });
            expectation.append(confirm);
        }
        const warning = element("section");
        warning.setAttribute("aria-label", "Matching event warning");
        warning.hidden = !draft.verification.warningVisible;
        warning.append(element("h5", `${draft.verification.matchingCount} matching event${draft.verification.matchingCount === 1 ? "" : "s"} found`));
        for (const match of draft.verification.matches) {
            const row = element("p", `${match.captureTime ?? "Time unavailable"} · ${match.sourceId} · ${match.pageUrl} · ${match.validation ?? "Not checked"} `);
            const open = element("button", "Open matching event");
            open.type = "button";
            open.addEventListener("click", () => options.navigation?.openMatchingEvent?.(match.id, render));
            row.append(open);
            warning.append(row);
        }
        const overrideLabel = labelledInput("Optional override explanation", overrideExplanation, (value) => { overrideExplanation = value; });
        const anyway = element("button", "Create missing-event report anyway");
        anyway.type = "button";
        anyway.addEventListener("click", () => { updateDraft(overrideMissingEventWarning(draft, overrideExplanation)); completed = completedReport(); render(); });
        warning.append(overrideLabel, anyway);
        const reproductionControls = element("div");
        const reproductionSteps = element("ol");
        const timelineComposer = element("div");
        timelineComposer.className = "defect-timeline-composer";
        timelineComposer.setAttribute("aria-label", "Timeline composer");
        const timelineEntries = element("ul");
        timelineEntries.setAttribute("aria-label", "Supporting timeline entries");
        const detailControls = element("div");
        const commonState = { report: () => sharedReport, update: (next) => { sharedReport = next; completed = undefined; }, refresh: () => refreshPreview() };
        appendReproductionControls(reproductionControls, reproductionSteps, commonContext(), commonState);
        appendTimelineControls(timelineComposer, timelineEntries, commonContext(), commonState);
        appendDetailControls(detailControls, detailEdits, () => refreshPreview());
        const finalAssertion = element("li", `Expect ${selected?.eventName || "expected event"} to be pushed to ${selected?.sourceId || "expected source"} during ${draft.scope.pathname}`);
        finalAssertion.dataset.reproductionStepKind = "assertion";
        reproductionSteps.append(finalAssertion);
        if (selected?.confirmed && !draft.verification.warningVisible) {
            const create = element("button", "Create missing-event report");
            create.type = "button";
            create.addEventListener("click", () => { completed = completedReport(); render(); });
            detailControls.append(create);
        }
        const legacyPreview = element("section");
        legacyPreview.setAttribute("aria-label", "Final missing-event report preview");
        legacyPreview.hidden = true;
        const preview = element("section");
        preview.setAttribute("aria-label", "Final report preview");
        const copy = element("button", "Copy for Jira Cloud");
        copy.type = "button";
        copy.disabled = !completed;
        const save = element("button", "Save as reported defect");
        save.type = "button";
        save.disabled = !completed;
        refreshPreview = () => {
            const expected = expectedLines();
            const summary = detailEdits.summary ?? `Missing event: ${selected?.eventName || "expected event"}`;
            const description = detailEdits.description ?? `${selected?.eventName || "The event"} was expected during ${draft.scope.pathname}.`;
            const actual = selected ? `${draft.verification.matchingCount ? `${draft.verification.matchingCount} matching event(s) found; override required.` : "No matching event found."} ${draft.scope.startedAt} to ${draft.scope.endedAt}.` : "Select and confirm an expected schema.";
            const expectedText = expected.map(({ text, source }) => `${text} · response source: ${source}`).join("\n") || "Select an expected schema to derive required payload constraints.";
            const steps = [...sharedReport.reproductionSteps.map(({ text }) => text), finalAssertion.textContent ?? ""].join("\n");
            const timeline = sharedReport.timeline.length ? sharedReport.timeline.map(({ captureTime, name, source, pathname }) => `${captureTime} · ${name} · ${source} · ${pathname}`).join("\n") : "No supporting captured events selected";
            preview.replaceChildren();
            for (const [headingText, content] of [["Summary", summary], ["Description", description], ["Steps to reproduce", steps], ["Actual result", completed?.absenceEvidence ?? actual], ["Expected result", completed?.expected ?? `${detailEdits.expectedExplanation ?? ""}\n${expectedText}`.trim()], ["Schema expectation", selected ? `${selected.schema.name} revision ${selected.schema.version} · ${selected.sourceId}/${selected.eventName}/${selected.target}` : "Incomplete"], ["Capture evidence", actual], ["Supporting timeline", timeline]]) {
                preview.append(element("h2", headingText), element("p", content));
            }
            legacyPreview.innerHTML = completed ? generateMissingEventRepresentations(completed).previewHtml : preview.innerHTML;
            for (const input of Array.from(detailControls.querySelectorAll("[data-report-field]"))) {
                const field = input.dataset.reportField;
                if (input.dataset.edited !== "true")
                    input.value = field === "summary" ? summary : field === "description" ? description : expectedText;
            }
        };
        if (completed) {
            const representations = generateMissingEventRepresentations(completed);
            copy.addEventListener("click", () => {
                const write = options.writeClipboard ?? navigator.clipboard?.writeText?.bind(navigator.clipboard);
                if (!write) {
                    feedback = "Clipboard access is unavailable.";
                    render();
                    return;
                }
                void write(representations.jiraText).then(() => { feedback = "Missing-event report copied for Jira Cloud."; render(); }).catch(() => { feedback = "Copy failed. The report is unchanged."; render(); });
            });
            save.addEventListener("click", () => { options.saveReportedDefect?.(completed); feedback = "Missing-event report saved in Defect Library."; render(); });
        }
        const status = element("output", feedback);
        status.setAttribute("aria-live", "polite");
        const evidenceStage = element("section");
        evidenceStage.setAttribute("aria-label", "Expected-event confirmation and absence verification");
        evidenceStage.append(expectation, warning);
        root.replaceChildren(header, evidenceStage, element("h5", "Expected result"), element("h5", "Steps to reproduce"), reproductionControls, reproductionSteps, element("h5", "Supporting timeline"), timelineComposer, timelineEntries, element("h5", "Report details"), detailControls, preview, legacyPreview, copy, save, status);
        refreshPreview();
        title.focus({ preventScroll: true });
    };
    const controller = { draft: () => draft, report: () => completed, restore: render };
    render();
    return controller;
}
//# sourceMappingURL=data-layer-missing-event-defect-report-ui.js.map