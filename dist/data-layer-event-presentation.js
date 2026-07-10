function clone(value) {
    return structuredClone(value);
}
function inputName(raw) {
    if (Array.isArray(raw) && typeof raw[0] === "string")
        return raw[0];
    if (raw !== null &&
        typeof raw === "object" &&
        typeof raw.event === "string") {
        return raw.event;
    }
    return "Unknown event";
}
function inputPayload(raw) {
    if (Array.isArray(raw))
        return clone(raw[1]);
    if (raw !== null && typeof raw === "object") {
        const { event: _event, ...payload } = raw;
        return clone(payload);
    }
    return undefined;
}
export function canonicalCapturedEvent(context, rawInput, captureTime, ordinal, sourceTime) {
    return {
        id: `${context.sessionId}:${context.sourceId}:${context.pageUrl}:${ordinal}`,
        sessionId: context.sessionId,
        sourceId: context.sourceId,
        sourceKind: context.sourceKind,
        name: inputName(rawInput),
        captureTime,
        ...(sourceTime ? { sourceTime } : {}),
        pageUrl: context.pageUrl,
        payload: inputPayload(rawInput),
        rawInput: clone(rawInput),
        validation: "Not checked",
        provenance: `captured:${context.sourceId}`,
    };
}
export function importExistingHistory(context, inputs, captureTime, firstOrdinal = 1) {
    return inputs.map((input, index) => canonicalCapturedEvent(context, input, captureTime, firstOrdinal + index));
}
function importKey(pageUrl, historyPath, index) {
    return JSON.stringify([pageUrl, historyPath, index]);
}
export function nextSubscription(state, pageUrl, historyPath, requestId) {
    return {
        ...state,
        current: { pageUrl, historyPath, requestId },
        activeCount: 1,
    };
}
export function requestIsCurrent(state, requestId) {
    return state.current?.requestId === requestId;
}
export function importedOnce(state, pageUrl, historyPath, index) {
    return state.imported.has(importKey(pageUrl, historyPath, index));
}
export function markImported(state, pageUrl, historyPath, count) {
    const imported = new Set(state.imported);
    for (let index = 0; index < count; index += 1) {
        imported.add(importKey(pageUrl, historyPath, index));
    }
    return { ...state, imported };
}
export function stopSubscription(state) {
    const { current: _current, ...inactive } = state;
    return { ...inactive, activeCount: 0 };
}
export function compactCaptureTime(time) {
    return time.includes("T") ? time.slice(11, 19) : time;
}
export function conciseValuePreview(value) {
    if (value === undefined)
        return "";
    if (value === null || typeof value !== "object")
        return String(value);
    const entries = Object.entries(value);
    if (entries.length === 0)
        return "";
    const [key, preview] = entries[0];
    return `${key} ${preview !== null && typeof preview === "object"
        ? JSON.stringify(preview)
        : String(preview)}`;
}
//# sourceMappingURL=data-layer-event-presentation.js.map