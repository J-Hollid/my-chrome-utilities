import { dataLayerViews, } from "./data-layer-live-observer.js";
import { runLiveInspectorAction, } from "./data-layer-live-inspector-actions.js";
import { pathnameVisits, resolveFeedSummaries } from "./data-layer-event-feed-summaries.js";
export function findLiveObserverElements(root = document) {
    return {
        viewList: root.querySelector("#data-layer-views"),
        sessionMessage: root.querySelector("#live-session-message"),
        sourceStatuses: root.querySelector("#live-source-statuses"),
        eventFeed: root.querySelector("#live-event-feed"),
        eventList: root.querySelector("#live-event-list"),
        eventInspector: root.querySelector("#live-event-inspector"),
        backToEventsButton: root.querySelector("#back-to-events"),
        pauseCaptureButton: root.querySelector("#pause-capture"),
        resumeCaptureButton: root.querySelector("#resume-capture"),
    };
}
export function renderDataLayerView(elements, view, focus = false) {
    for (const candidate of dataLayerViews) {
        const button = elements.viewList?.querySelector(`#data-layer-view-${candidate.toLowerCase()}`);
        const panel = document.querySelector(`#data-layer-panel-${candidate.toLowerCase()}`);
        const selected = candidate === view;
        if (button) {
            button.setAttribute("aria-selected", String(selected));
            button.tabIndex = selected ? 0 : -1;
            if (focus)
                button.focus();
        }
        if (panel)
            panel.hidden = !selected;
    }
}
function eventRow(event, selected, openEvent) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    const sourceName = event.sourceName ?? event.sourceId;
    const summaries = resolveFeedSummaries(event);
    const pathname = event.pageUrl ? new URL(event.pageUrl).pathname : "/";
    const compactTime = event.captureTime.includes("T") ? event.captureTime.slice(11, 19) : event.captureTime;
    const summaryText = summaries.map(({ label, value }) => `${label} ${String(value)}`).join(", ");
    button.setAttribute("aria-label", [event.name, compactTime, sourceName, pathname, event.validation ?? "Not checked", summaryText].filter(Boolean).join(", "));
    button.setAttribute("aria-pressed", String(selected));
    button.textContent = [event.name, compactTime, sourceName, event.validation ?? "Not checked", summaryText].filter(Boolean).join(" · ");
    button.addEventListener("click", () => openEvent(event.id));
    item.append(button);
    return item;
}
export function renderLiveObserverState(elements, state, openEvent) {
    if (elements.sourceStatuses) {
        elements.sourceStatuses.replaceChildren(...state.sources.map((source) => {
            const item = document.createElement("li");
            item.textContent = source.name;
            return item;
        }));
    }
    elements.eventFeed?.replaceChildren(...pathnameVisits(state.events).map((visit) => {
        const group = document.createElement("li");
        group.className = "pathname-visit";
        const heading = document.createElement("h5");
        heading.textContent = visit.pathname;
        const rows = document.createElement("ul");
        rows.replaceChildren(...visit.events.map((event) => eventRow(event, event.id === state.inspectorEventId, openEvent)));
        group.append(heading, rows);
        return group;
    }));
    if (elements.eventList)
        elements.eventList.hidden = !state.listVisible;
    if (elements.eventInspector) {
        elements.eventInspector.hidden = !state.inspectorEventId;
    }
    if (elements.backToEventsButton) {
        elements.backToEventsButton.hidden = state.listVisible;
    }
}
export function renderLiveInspector(elements, event, actionHandlers) {
    if (!elements.eventInspector)
        return;
    elements.eventInspector.classList.add("live-detail-view");
    const heading = document.createElement("h4");
    heading.className = "detail-view-header";
    heading.textContent = event.name;
    const source = document.createElement("p");
    source.textContent = `Source: ${event.sourceName ?? event.sourceId}`;
    const status = document.createElement("output");
    status.textContent = event.validation ?? "Not checked";
    const summary = document.createElement("dl");
    appendSummaryItem(summary, "Capture time", event.captureTime);
    appendSummaryItem(summary, "Page", event.pageUrl);
    appendSummaryItem(summary, "Destination", event.destination);
    appendSummaryItem(summary, "Validation", event.validation ?? "Not checked");
    appendSummaryItem(summary, "Provenance", event.provenance);
    const payload = document.createElement("section");
    payload.setAttribute("aria-label", "Payload");
    const payloadHeading = document.createElement("h5");
    payloadHeading.textContent = "Payload";
    const payloadValues = document.createElement("pre");
    payloadValues.textContent = JSON.stringify(event.payload, null, 2);
    payload.append(payloadHeading, payloadValues);
    const raw = document.createElement("details");
    const rawSummary = document.createElement("summary");
    rawSummary.textContent = "Raw input";
    const rawValue = document.createElement("pre");
    rawValue.textContent = JSON.stringify(event.rawInput, null, 2);
    raw.append(rawSummary, rawValue);
    const actions = document.createElement("div");
    actions.className = "live-inspector-actions";
    const feedback = document.createElement("output");
    feedback.setAttribute("aria-live", "polite");
    const actionCallbacks = {
        "Copy payload": async () => actionHandlers.copyPayload(event),
        "Save to Library": async () => actionHandlers.saveToLibrary(event),
        Validate: async () => actionHandlers.validate(event),
    };
    for (const [label, callback] of Object.entries(actionCallbacks)) {
        const action = document.createElement("button");
        action.type = "button";
        action.textContent = label;
        action.dataset.actionVariant = label === "Copy payload" ? "quiet" : "secondary";
        if (label === "Validate" && !event.schemaId) {
            action.disabled = true;
            action.setAttribute("aria-description", "Select a schema to validate");
            action.title = "Select a schema to validate";
        }
        action.addEventListener("click", () => {
            void runLiveInspectorAction(label, event, callback, (message) => { feedback.textContent = message; });
        });
        actions.append(action);
    }
    actions.append(feedback);
    elements.eventInspector.replaceChildren(heading, source, status, summary, payload, raw, actions);
}
function appendSummaryItem(summary, label, value) {
    if (!value)
        return;
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.dataset.field = label.toLowerCase();
    term.textContent = label;
    description.textContent = value;
    summary.append(term, description);
}
export function renderLiveSessionMessage(elements, message) {
    if (elements.sessionMessage)
        elements.sessionMessage.textContent = message;
}
export function updateLiveInspectorValidation(elements, validation) {
    const term = elements.eventInspector?.querySelector('dt[data-field="validation"]');
    const description = term?.nextElementSibling;
    if (description instanceof HTMLElement)
        description.textContent = validation;
}
//# sourceMappingURL=data-layer-live-observer-ui.js.map