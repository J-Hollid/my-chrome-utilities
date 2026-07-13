import { filterTimelineEvents, generatePathnameSkeleton, supportingTimeline, toggleReportIssue, } from "./data-layer-defect-report.js";
export function appendIssueControls(issues, expectedControls, state, selectedChoices) {
    for (const reportIssue of state.report().issues) {
        const row = document.createElement("div");
        const selected = document.createElement("input");
        selected.type = "checkbox";
        selected.checked = reportIssue.selected;
        selected.id = `defect-issue-${reportIssue.id}`;
        selected.addEventListener("change", () => { state.update(toggleReportIssue(state.report(), reportIssue.id)); state.refresh(); });
        const label = document.createElement("label");
        label.htmlFor = selected.id;
        label.textContent = `${reportIssue.severity}: ${reportIssue.pointer} — ${reportIssue.constraint}`;
        row.append(selected, label);
        issues.append(row);
        const methodLabel = document.createElement("label");
        methodLabel.textContent = `${reportIssue.id} correction `;
        const method = document.createElement("select");
        for (const value of ["", "choose an allowed value", "enter a valid response", "apply the rule", "keep the rule generic"]) {
            method.append(Object.assign(document.createElement("option"), { value, textContent: value || "Choose method" }));
        }
        const response = document.createElement("input");
        response.placeholder = "Valid response";
        const updateChoice = () => {
            if (!method.value)
                selectedChoices.delete(reportIssue.id);
            else
                selectedChoices.set(reportIssue.id, { issueId: reportIssue.id, method: method.value, ...(response.value ? { response: response.value } : {}) });
            state.refresh();
        };
        method.addEventListener("change", updateChoice);
        response.addEventListener("input", updateChoice);
        methodLabel.append(method, response);
        expectedControls.append(methodLabel);
    }
}
export function appendReproductionControls(controls, steps, context, state) {
    const startLabel = document.createElement("label");
    startLabel.textContent = "Reproduction starts at ";
    const startVisit = document.createElement("select");
    startVisit.id = "defect-reproduction-start";
    const defectVisitIndex = context.visits.findIndex(({ id }) => id === context.defectVisitId);
    for (const visit of context.visits.slice(0, defectVisitIndex + 1)) {
        startVisit.append(Object.assign(document.createElement("option"), { value: visit.id, textContent: visit.pathname }));
    }
    const renderSteps = () => {
        steps.replaceChildren(...state.report().reproductionSteps.map((step, index) => {
            const item = document.createElement("li");
            const input = document.createElement("input");
            input.value = step.text;
            input.setAttribute("aria-label", `Reproduction step ${index + 1}`);
            input.addEventListener("input", () => {
                state.update({ ...state.report(), reproductionSteps: state.report().reproductionSteps.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, text: input.value } : candidate) });
                state.refresh();
            });
            item.append(input);
            return item;
        }));
    };
    const generate = document.createElement("button");
    generate.type = "button";
    generate.textContent = "Generate pathname steps";
    generate.addEventListener("click", () => {
        state.update({ ...state.report(), reproductionSteps: generatePathnameSkeleton(context.visits, startVisit.value, context.defectVisitId) });
        renderSteps();
        state.refresh();
    });
    startLabel.append(startVisit);
    controls.append(startLabel, generate);
}
export function appendTimelineControls(filters, list, context, state) {
    const selections = new Map();
    const filter = {};
    const update = () => {
        state.update({ ...state.report(), timeline: supportingTimeline(context.timeline, [...selections.values()]) });
        state.refresh();
    };
    const render = () => {
        list.replaceChildren(...filterTimelineEvents(context.timeline, filter).map((event) => {
            const item = document.createElement("li");
            const selectedLabel = document.createElement("label");
            const selected = document.createElement("input");
            selected.type = "checkbox";
            selected.checked = selections.has(event.id);
            selectedLabel.append(selected, `${event.captureTime} ${event.name} · ${event.source} · ${event.pathname} · ${event.validation}`);
            const options = document.createElement("span");
            for (const [field, labelText] of [["includeSummary", "Summary"], ["includePayload", "Payload"], ["includeValidation", "Validation details"]]) {
                const optionLabel = document.createElement("label");
                const option = document.createElement("input");
                option.type = "checkbox";
                option.checked = Boolean(selections.get(event.id)?.[field]);
                option.disabled = !selected.checked;
                option.addEventListener("change", () => {
                    selections.set(event.id, { ...(selections.get(event.id) ?? { eventId: event.id }), [field]: option.checked });
                    update();
                });
                optionLabel.append(option, labelText);
                options.append(optionLabel);
            }
            selected.addEventListener("change", () => {
                if (selected.checked)
                    selections.set(event.id, { eventId: event.id });
                else
                    selections.delete(event.id);
                render();
                update();
            });
            item.append(selectedLabel, options);
            return item;
        }));
    };
    for (const [field, labelText] of [["name", "Event name"], ["source", "Source"], ["pathname", "Pathname"], ["validation", "Validation state"]]) {
        const label = document.createElement("label");
        label.textContent = `${labelText} `;
        const input = document.createElement("input");
        input.dataset.timelineFilter = field;
        input.addEventListener("input", () => { if (input.value)
            filter[field] = input.value;
        else
            delete filter[field]; render(); });
        label.append(input);
        filters.append(label);
    }
    render();
}
export function appendDetailControls(controls, edits, refresh) {
    for (const [field, labelText, multiline] of [
        ["summary", "Summary", false],
        ["description", "Description", true],
        ["expectedExplanation", "Expected result explanation", true],
    ]) {
        const label = document.createElement("label");
        label.textContent = `${labelText} `;
        const input = multiline ? document.createElement("textarea") : document.createElement("input");
        input.dataset.reportField = field;
        input.addEventListener("input", () => { input.dataset.edited = "true"; edits[field] = input.value; refresh(); });
        label.append(input);
        controls.append(label);
    }
}
//# sourceMappingURL=data-layer-defect-report-ui-controls.js.map