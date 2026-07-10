import { pathStatus, samplePageObject, } from "./data-layer.js";
import { captureSourceEvent, } from "./data-layer-session.js";
import { canonicalCapturedEvent, importedOnce, markImported, nextSubscription, stopSubscription, } from "./data-layer-event-presentation.js";
function pathParts(path) {
    return path
        .split(".")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
}
function valueAtPath(pageObject, path) {
    return pathParts(path).reduce((current, part) => {
        if (current === null || typeof current !== "object") {
            return undefined;
        }
        return current[part];
    }, pageObject);
}
function captureContext(state, observer) {
    return {
        sessionId: state.sessionState?.session?.id ?? `page:${observer.pageUrl}`,
        sourceId: "event-history",
        sourceKind: "Data Layer",
        pageUrl: observer.pageUrl,
        destination: observer.historyPath,
    };
}
function observedEntry(state, observer, rawValue, timestamp = new Date().toISOString()) {
    const event = canonicalCapturedEvent(captureContext(state, observer), rawValue, timestamp, (state.sourceEvents?.length ?? 0) + 1);
    return {
        type: "observed",
        url: event.pageUrl,
        timestamp: event.captureTime,
        observerPath: observer.historyPath,
        name: event.name,
        payload: event.payload,
        rawValue: event.rawInput,
        event,
    };
}
function captureObservedEntry(state, entry) {
    const sessionState = state.sessionState
        ? captureSourceEvent(state.sessionState, entry.event, entry.observerPath)
        : undefined;
    return {
        ...state,
        observedEntries: [...(state.observedEntries ?? []), entry],
        sourceEvents: [...(state.sourceEvents ?? []), entry.event],
        ...(sessionState ? { sessionState } : {}),
    };
}
function captureExistingHistoryEntries(state, observer) {
    const historyArray = valueAtPath(state.pageObject, observer.historyPath);
    if (!Array.isArray(historyArray)) {
        return state;
    }
    const captureTime = new Date().toISOString();
    const captured = historyArray.reduce((nextState, rawValue, index) => importedOnce(nextState.subscription ?? { imported: new Set(), activeCount: 0 }, observer.pageUrl, observer.historyPath, index)
        ? nextState
        : captureObservedEntry(nextState, observedEntry(nextState, observer, rawValue, captureTime)), state);
    return {
        ...captured,
        subscription: markImported(captured.subscription ?? { imported: new Set(), activeCount: 0 }, observer.pageUrl, observer.historyPath, historyArray.length),
    };
}
export function attachHistoryArrayObserver(state, options) {
    if (options.pageAccessStatus === "page access unavailable") {
        return {
            ...state,
            pageAccessStatus: options.pageAccessStatus,
            observer: {
                status: "page access unavailable",
                historyPath: options.historyPath,
                pageUrl: options.pageUrl,
                activeCount: 0,
            },
            subscription: stopSubscription(state.subscription ?? { imported: new Set(), activeCount: 0 }),
        };
    }
    const pageObject = options.pageObject ?? state.pageObject ?? samplePageObject();
    const status = pathStatus(pageObject, options.historyPath);
    const activePageReadResult = options.pageObject === undefined
        ? undefined
        : {
            historyPath: options.historyPath,
            pageUrl: options.pageUrl,
            pageObject,
        };
    const observer = {
        status,
        historyPath: options.historyPath,
        pageUrl: options.pageUrl,
        activeCount: status === "ready" ? 1 : 0,
    };
    const nextState = {
        ...state,
        pageObject,
        pageAccessStatus: options.pageAccessStatus ?? "page access available",
        ...(activePageReadResult ? { activePageReadResult } : {}),
        observer,
        subscription: nextSubscription(state.subscription ?? { imported: new Set(), activeCount: 0 }, options.pageUrl, options.historyPath, options.requestId ?? `${options.pageUrl}:${options.historyPath}`),
    };
    return status === "ready"
        ? captureExistingHistoryEntries(nextState, observer)
        : nextState;
}
export function reinstallHistoryArrayObserver(state, options) {
    return attachHistoryArrayObserver({
        ...state,
        pageObject: samplePageObject(),
    }, options);
}
export function appendObservedHistoryEntry(state, rawValue, timestamp = new Date().toISOString()) {
    const observer = state.observer;
    if (!observer || observer.status !== "ready") {
        return state;
    }
    const historyArray = valueAtPath(state.pageObject, observer.historyPath);
    if (!Array.isArray(historyArray)) {
        return state;
    }
    const pushReturn = historyArray.push(rawValue);
    const captured = captureObservedEntry(state, observedEntry(state, observer, rawValue, timestamp));
    return {
        ...captured,
        pushReturn,
        subscription: markImported(captured.subscription ?? { imported: new Set(), activeCount: 0 }, observer.pageUrl, observer.historyPath, historyArray.length),
    };
}
export function stopHistoryArrayObserver(state) {
    const observer = state.observer;
    return {
        ...state,
        ...(observer ? { observer: { ...observer, activeCount: 0 } } : {}),
        subscription: stopSubscription(state.subscription ?? { imported: new Set(), activeCount: 0 }),
    };
}
//# sourceMappingURL=data-layer-observer.js.map