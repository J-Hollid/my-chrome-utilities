import { renderJiraReport } from "./data-layer-defect-report-export.js";
import { renderOccurrenceReport } from "./data-layer-event-occurrence-defect-report.js";
import { generateMissingEventRepresentations } from "./data-layer-missing-event-defect-report.js";
export function findDefectLibraryElements(root = document) {
    return {
        count: root.querySelector("#defect-library-count"),
        list: root.querySelector("#defect-library-list"),
        empty: root.querySelector("#defect-library-empty-state"),
        detail: root.querySelector("#defect-library-detail"),
        confirmation: root.querySelector("#defect-delete-confirmation"),
    };
}
function element(tag, text) {
    const result = document.createElement(tag);
    if (text !== undefined)
        result.textContent = text;
    return result;
}
function button(label, action) {
    const result = element("button", label);
    result.type = "button";
    result.addEventListener("click", action);
    return result;
}
function reportField(report, field) { return String(report?.[field] ?? ""); }
function noteLinks(notes) {
    const links = element("section");
    links.setAttribute("aria-label", "Note links");
    for (const value of notes.match(/https?:\/\/[^\s<]+/g) ?? []) {
        try {
            const url = new URL(value);
            if (url.protocol !== "http:" && url.protocol !== "https:")
                continue;
            const link = element("a", value);
            link.href = url.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            links.append(link);
        }
        catch { /* Invalid note text remains plain text in the textarea. */ }
    }
    return links;
}
function renderDetail(root, defect, actions) {
    const title = element("h4", reportField(defect.report, "summary") || defect.id);
    title.tabIndex = -1;
    const header = element("header");
    header.className = "detail-view-header";
    header.append(button("Back to Defects", actions.close), title);
    const identity = element("p", `${defect.type} · ${defect.status} · created ${defect.createdAt} · updated ${defect.updatedAt}`);
    const label = (text, control) => { const wrapper = element("label", text); wrapper.append(control); return wrapper; };
    const summary = element("input");
    summary.value = reportField(defect.report, "summary");
    summary.dataset.defectField = "summary";
    const description = element("textarea");
    description.value = reportField(defect.report, "description");
    description.dataset.defectField = "description";
    const missingEvent = defect.type === "Missing event";
    const occurrence = defect.type === "Unexpected event" || defect.type === "Wrong event name";
    const expectedField = missingEvent ? "expectedResultAdditionalText" : "expectedExplanation";
    const expected = element("textarea");
    expected.value = reportField(defect.report, expectedField);
    expected.dataset.defectField = expectedField;
    const notes = element("textarea");
    notes.value = defect.notes;
    notes.dataset.defectField = "notes";
    const save = button("Save defect edits", () => {
        const edited = { ...defect.report, summary: summary.value, description: description.value, [expectedField]: expected.value };
        if (missingEvent && !expected.value.trim())
            delete edited.expectedResultAdditionalText;
        actions.save(defect.id, edited, notes.value);
    });
    const feedback = element("output");
    feedback.setAttribute("aria-live", "polite");
    const recopy = button("Recopy for Jira Cloud", () => {
        feedback.textContent = "";
        void Promise.resolve(actions.recopy(defect.id)).then((message) => { feedback.textContent = message; });
    });
    const stateLabel = element("label", "State");
    const state = element("select");
    state.setAttribute("aria-label", "Defect state");
    for (const status of ["Saved", "Reported", "Resolved", "Archived"]) {
        const option = element("option", status);
        option.value = status;
        state.append(option);
    }
    state.value = defect.status;
    stateLabel.append(state);
    const updateState = button("Update state", () => actions.updateStatus(defect.id, state.value));
    const controls = element("section");
    controls.setAttribute("aria-label", "Defect actions");
    controls.append(save, recopy);
    controls.append(stateLabel, updateState);
    if (defect.type !== "Missing event" && !defect.savedSession)
        controls.append(button("Attach current session", () => actions.attachCurrentSession(defect.id)));
    if (defect.savedSession)
        controls.append(button("Open linked session", () => actions.openLinkedSession(defect.id)));
    controls.append(button("Delete", () => actions.requestDelete(defect.id)));
    const issues = element("ul");
    issues.setAttribute("aria-label", "Stored issue evidence");
    issues.replaceChildren(...defect.issues.map(({ match, evidence }) => element("li", `${match.canonicalPath} · ${evidence.ruleName ?? match.ruleId} revision ${match.ruleRevision} · actual ${String(evidence.actual)} · expected ${evidence.expected ?? ""}`)));
    const session = defect.savedSession ? element("p", `Linked session ${defect.savedSession.id} · ${defect.savedSession.containsMatchingIssue ? "contains a matching issue" : "does not contain a matching issue"}`) : element("p", "No linked saved session.");
    const preview = element("section");
    preview.setAttribute("aria-label", "Final report preview");
    preview.innerHTML = missingEvent
        ? generateMissingEventRepresentations(defect.report).previewHtml
        : occurrence
            ? renderOccurrenceReport(defect.report).html
            : renderJiraReport(defect.report).html;
    root.replaceChildren(header, identity, label("Summary", summary), label("Description", description), label(missingEvent ? "Expected result additional text (optional)" : "Expected result", expected), preview, label("Internal notes", notes), noteLinks(defect.notes), issues, session, controls, feedback);
    root.hidden = false;
    title.focus({ preventScroll: true });
}
export function renderDefectLibrary(elements, defects, selectedId, deletionConfirmationId, actions) {
    if (elements.count)
        elements.count.textContent = `${defects.length} saved defects`;
    if (elements.empty)
        elements.empty.hidden = defects.length > 0;
    if (elements.list) {
        elements.list.replaceChildren(...defects.map((defect) => {
            const item = element("li");
            item.dataset.defectId = defect.id;
            const open = button("Open", () => actions.open(defect.id, open));
            const reportSummary = reportField(defect.report, "summary") || defect.id;
            item.append(element("span", `${reportSummary} · ${defect.type} · ${defect.status} · ${defect.issues.map(({ match }) => match.canonicalPath).join(", ")} `), open);
            return item;
        }));
    }
    const selected = defects.find(({ id }) => id === selectedId);
    if (elements.detail) {
        if (selected)
            renderDetail(elements.detail, selected, actions);
        else {
            elements.detail.hidden = true;
            elements.detail.replaceChildren();
        }
    }
    if (elements.confirmation) {
        elements.confirmation.hidden = !deletionConfirmationId;
        elements.confirmation.replaceChildren();
        if (deletionConfirmationId)
            elements.confirmation.append(element("p", `Delete defect ${deletionConfirmationId}? Captured evidence and saved sessions remain unchanged.`), button("Cancel deletion", actions.cancelDelete), button("Confirm deletion", actions.confirmDelete));
    }
}
//# sourceMappingURL=data-layer-defect-library-ui.js.map