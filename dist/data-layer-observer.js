import { pathStatus, samplePageObject, } from "./data-layer.js";
import { captureEntry } from "./data-layer-session.js";
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
function historyEntryName(rawValue) {
    if (rawValue !== null &&
        typeof rawValue === "object" &&
        "event" in rawValue) {
        const event = rawValue.event;
        return typeof event === "string" ? event : String(event ?? "");
    }
    return "";
}
function historyEntryPayload(rawValue) {
    if (rawValue !== null &&
        typeof rawValue === "object" &&
        "payload" in rawValue) {
        return rawValue.payload;
    }
    return undefined;
}
function observedEntry(observer, rawValue, timestamp = new Date().toISOString()) {
    return {
        type: "observed",
        url: observer.pageUrl,
        timestamp,
        observerPath: observer.historyPath,
        name: historyEntryName(rawValue),
        payload: observedPayload(historyEntryPayload(rawValue)),
        rawValue,
    };
}
function captureObservedEntry(state, entry) {
    const sessionState = state.sessionState
        ? captureEntry(state.sessionState, entry)
        : undefined;
    return {
        ...state,
        observedEntries: [...(state.observedEntries ?? []), entry],
        ...(sessionState ? { sessionState } : {}),
    };
}
function captureExistingHistoryEntries(state, observer) {
    const historyArray = valueAtPath(state.pageObject, observer.historyPath);
    if (!Array.isArray(historyArray)) {
        return state;
    }
    return historyArray.reduce((nextState, rawValue) => captureObservedEntry(nextState, observedEntry(observer, rawValue)), state);
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
    return {
        ...captureObservedEntry(state, observedEntry(observer, rawValue, timestamp)),
        pushReturn,
    };
}
//# sourceMappingURL=data-layer-observer.js.map