import { filterEventsByQuery } from "./data-layer-event-feed-query.js";
export const DATA_LAYER_VIEW_STORAGE_KEY = "my-chrome-utilities.data-layer-view.v1";
export const dataLayerViews = ["Live", "Projects", "Library", "Sessions", "Defects", "Schemas"];
export function dataLayerViewForNavigationKey(current, key) {
    const index = dataLayerViews.indexOf(current);
    if (key === "Home")
        return dataLayerViews[0];
    if (key === "End")
        return dataLayerViews.at(-1);
    if (key === "ArrowRight")
        return dataLayerViews[(index + 1) % dataLayerViews.length];
    if (key === "ArrowLeft")
        return dataLayerViews[(index - 1 + dataLayerViews.length) % dataLayerViews.length];
    return undefined;
}
export function createLiveObserverState(options) {
    return { view: "Live", status: "Live", pageUrl: options.pageUrl, sources: [...options.sources], events: [], listVisible: true };
}
export function pauseCapture(state) {
    return { ...state, status: "Paused" };
}
export function resumeCapture(state) {
    return { ...state, status: "Live" };
}
export function recordLiveEvent(state, event) {
    return state.status === "Paused" ? state : { ...state, events: [...state.events, { ...event }] };
}
export function updateLiveSourceStatus(state, sourceId, status) {
    return {
        ...state,
        sources: state.sources.map((source) => source.id === sourceId
            ? { ...source, status, restartVisible: status !== "Connected" }
            : source),
    };
}
export function setLiveFilter(state, filter) {
    if (filter)
        return { ...state, filter: { ...filter } };
    const { filter: _filter, ...withoutFilter } = state;
    return withoutFilter;
}
export function setLiveQuery(state, query) {
    const { filter: _filter, ...withoutLegacyFilter } = state;
    return { ...withoutLegacyFilter, query: { conditions: query.conditions.map((condition) => ({ ...condition, values: [...condition.values] })) } };
}
export function filteredLiveEvents(state) {
    if (state.query?.conditions.length)
        return filterEventsByQuery(state.events, state.query);
    if (!state.filter)
        return [...state.events];
    const value = state.filter.value.toLowerCase();
    return state.events.filter((event) => {
        if (state.filter?.kind === "source") {
            return `${event.sourceName ?? ""} ${event.sourceId}`
                .toLowerCase()
                .includes(value);
        }
        if (state.filter?.kind === "event name")
            return event.name.toLowerCase().includes(value);
        if (state.filter?.kind === "validation state") {
            if (value === "warnings")
                return Boolean(event.validation?.endsWith("warnings") && !event.validation.includes("error"));
            if (value === "issues")
                return Boolean(event.validation?.endsWith("issues") || event.validation?.includes("error") && event.validation !== "Assignment error");
            return event.validation?.toLowerCase().includes(value) ?? false;
        }
        return `${event.name} ${event.sourceName ?? ""} ${event.sourceId} ${JSON.stringify(event.keyProperties ?? event.payload ?? "")}`
            .toLowerCase()
            .includes(value);
    });
}
export function liveEventWindow(state, count) {
    return filteredLiveEvents(state).slice(-count);
}
export function selectLiveEvent(state, eventId, layout) {
    return { ...state, inspectorEventId: eventId, listVisible: layout === "split" };
}
export function closeLiveInspector(state) {
    const { inspectorEventId: _inspectorEventId, ...withoutInspector } = state;
    return { ...withoutInspector, listVisible: true };
}
export function resetLiveObserverForSession(state) {
    const { filter: _filter, query: _query, savedFilterId: _savedFilterId, inspectorEventId: _inspectorEventId, ...sessionIndependentState } = state;
    return { ...sessionIndependentState, status: "Live", events: [], listVisible: true };
}
//# sourceMappingURL=data-layer-live-observer.js.map