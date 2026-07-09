function stringifyValue(value) {
    if (value === undefined || value === null) {
        return "";
    }
    if (typeof value === "string") {
        return value;
    }
    try {
        return JSON.stringify(value);
    }
    catch {
        return String(value);
    }
}
export function timelineSummary(entry) {
    return {
        name: entry.name ?? entry.type,
        url: entry.url,
        timestamp: entry.timestamp ?? "",
        observerPath: entry.observerPath ?? "",
    };
}
export function timelineDetails(entry) {
    return {
        ...timelineSummary(entry),
        payload: stringifyValue(entry.payload),
        rawValue: stringifyValue(entry.rawValue),
    };
}
//# sourceMappingURL=data-layer-timeline.js.map