import { dataLayerViews, } from "./data-layer-live-observer.js";
import { compactCaptureTime, conciseValuePreview, } from "./data-layer-event-presentation.js";
export function findLiveObserverElements(root = document) {
    return {
        viewList: root.querySelector("#data-layer-views"),
        sessionSummary: root.querySelector("#live-session-summary"),
        pageUrl: root.querySelector("#live-page-url"),
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
function eventRow(event, openEvent) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    const sourceName = event.sourceName ?? event.sourceId;
    button.setAttribute("aria-label", `${event.name}, ${sourceName}, ${compactCaptureTime(event.captureTime)}`);
    button.textContent = [
        event.name,
        sourceName,
        compactCaptureTime(event.captureTime),
        event.sourceKind,
        event.validation,
        conciseValuePreview(event.payload ?? event.rawInput),
    ]
        .filter(Boolean)
        .join(" | ");
    button.addEventListener("click", () => openEvent(event.id));
    item.append(button);
    return item;
}
export function renderLiveObserverState(elements, state, openEvent) {
    if (elements.sessionSummary) {
        elements.sessionSummary.textContent = `${state.status}: ${state.events.length} events, ${state.sources.length} sources`;
    }
    if (elements.pageUrl)
        elements.pageUrl.textContent = state.pageUrl;
    if (elements.sourceStatuses) {
        elements.sourceStatuses.replaceChildren(...state.sources.map((source) => {
            const item = document.createElement("li");
            item.textContent = `${source.name}: ${source.status}`;
            return item;
        }));
    }
    elements.eventFeed?.replaceChildren(...state.events.map((event) => eventRow(event, openEvent)));
    if (elements.eventList)
        elements.eventList.hidden = !state.listVisible;
    if (elements.eventInspector) {
        elements.eventInspector.hidden = !state.inspectorEventId;
    }
    if (elements.backToEventsButton) {
        elements.backToEventsButton.hidden = state.listVisible;
    }
}
export function renderLiveInspector(elements, event) {
    if (!elements.eventInspector)
        return;
    elements.eventInspector.textContent = [
        `Event ${event.name}`,
        `source ${event.sourceName ?? event.sourceId}`,
        event.destination ? `destination ${event.destination}` : undefined,
        `captured ${event.captureTime}`,
        event.pageUrl ? `page ${event.pageUrl}` : undefined,
        `Payload ${JSON.stringify(event.payload)}`,
        `Raw input ${JSON.stringify(event.rawInput)}`,
        `Validation ${event.validation ?? "Not checked"}`,
        event.provenance ? `Provenance ${event.provenance}` : undefined,
        "Actions Copy, Save to Library, Validate",
    ]
        .filter(Boolean)
        .join("; ");
}
export function renderLiveSessionMessage(elements, message) {
    if (elements.sessionMessage)
        elements.sessionMessage.textContent = message;
}
//# sourceMappingURL=data-layer-live-observer-ui.js.map