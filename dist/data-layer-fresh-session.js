import { resetLiveObserverForSession, } from "./utilities/data-layer/live-inspection.js";
export function freshSessionAvailability(options) {
    const unsavedEventCount = Math.max(0, options.eventCount - options.savedThroughEventCount);
    if (options.savedSessionMode)
        return { available: false, unsavedEventCount, action: "unavailable" };
    return {
        available: true,
        unsavedEventCount,
        action: unsavedEventCount > 0 ? "confirm" : "start",
    };
}
function freshSession(previous, id) {
    return {
        id,
        status: "active",
        freshBoundary: true,
        tabId: previous.tabId,
        historyPath: previous.historyPath,
        startUrl: previous.currentUrl,
        currentUrl: previous.currentUrl,
        ...(previous.windowId === undefined ? {} : { windowId: previous.windowId }),
        ...(previous.targetTitle === undefined ? {} : { targetTitle: previous.targetTitle }),
        ...(previous.targetOrigin === undefined ? {} : { targetOrigin: previous.targetOrigin }),
        timeline: [],
    };
}
export function startFreshLiveSession(sessionState, liveObserverState, observerState, id) {
    const previous = sessionState.session;
    if (!previous || previous.status !== "active") {
        return { sessionState, liveObserverState, observerState, started: false };
    }
    const nextSessionState = { session: freshSession(previous, id) };
    return {
        sessionState: nextSessionState,
        liveObserverState: resetLiveObserverForSession(liveObserverState),
        observerState: {
            ...observerState,
            observedEntries: [],
            sourceEvents: [],
            sessionState: nextSessionState,
        },
        started: true,
    };
}
function restoredLiveEvent(entry) {
    const captureTime = entry.timestamp;
    if (entry.type !== "observed" || !entry.id || !entry.name || !entry.sourceId || !captureTime)
        return undefined;
    return {
        id: entry.id,
        name: entry.name,
        sourceId: entry.sourceId,
        captureTime,
        ...(entry.sourceKind ? { sourceKind: entry.sourceKind } : {}),
        ...(entry.pageUrl ? { pageUrl: entry.pageUrl } : {}),
        ...(entry.payload !== undefined ? { payload: structuredClone(entry.payload) } : {}),
        ...(entry.rawInput !== undefined ? { rawInput: structuredClone(entry.rawInput) } : {}),
        ...(entry.validation ? { validation: entry.validation } : {}),
    };
}
export function restoreFreshSessionLiveObserver(base, sessionState) {
    const session = sessionState.session;
    if (!session?.freshBoundary)
        return base;
    const events = session.timeline.flatMap((entry) => {
        const event = restoredLiveEvent(entry);
        return event ? [event] : [];
    });
    return {
        ...resetLiveObserverForSession(base),
        pageUrl: session.currentUrl,
        events,
    };
}
//# sourceMappingURL=data-layer-fresh-session.js.map