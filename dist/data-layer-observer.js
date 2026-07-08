import { pathStatus, samplePageObject, } from "./data-layer";
import { captureEntry } from "./data-layer-session";
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
function observedPayload(rawPayload) {
    if (rawPayload !== null &&
        typeof rawPayload === "object" &&
        "label" in rawPayload) {
        return rawPayload.label;
    }
    return rawPayload;
}
export function attachHistoryArrayObserver(state, options) {
    const pageObject = options.pageObject ?? state.pageObject ?? samplePageObject();
    const status = pathStatus(pageObject, options.historyPath);
    return {
        ...state,
        pageObject,
        observer: {
            status,
            historyPath: options.historyPath,
            pageUrl: options.pageUrl,
            activeCount: status === "ready" ? 1 : 0,
        },
    };
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
    const entry = {
        type: "observed",
        url: observer.pageUrl,
        timestamp,
        observerPath: observer.historyPath,
        name: rawValue.event,
        payload: observedPayload(rawValue.payload),
        rawValue,
    };
    const sessionState = state.sessionState
        ? captureEntry(state.sessionState, entry)
        : undefined;
    return {
        ...state,
        observedEntries: [...(state.observedEntries ?? []), entry],
        pushReturn,
        ...(sessionState ? { sessionState } : {}),
    };
}
//# sourceMappingURL=data-layer-observer.js.map