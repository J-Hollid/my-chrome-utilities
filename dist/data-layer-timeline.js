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
function stringifyScalarValue(value) {
    if (value !== null && typeof value === "object") {
        return stringifyValue(value);
    }
    return JSON.stringify(String(value ?? ""));
}
function objectEntries(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return [];
    }
    return Object.entries(value);
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
export function payloadProperties(entry) {
    return objectEntries(entry.payload).map(([name, value]) => ({
        name,
        value: stringifyScalarValue(value),
    }));
}
function nestedEvent(entry) {
    return {
        ...timelineDetails(entry),
        payloadProperties: payloadProperties(entry),
    };
}
function pageGroup(url) {
    return { url, events: [] };
}
function findLatestPageIndex(pages, url) {
    for (let index = pages.length - 1; index >= 0; index -= 1) {
        if (pages[index]?.url === url) {
            return index;
        }
    }
    return -1;
}
function appendObservedEvent(pages, entry) {
    const pageIndex = findLatestPageIndex(pages, entry.url);
    const nextPages = pageIndex === -1 ? [...pages, pageGroup(entry.url)] : pages;
    const targetIndex = pageIndex === -1 ? nextPages.length - 1 : pageIndex;
    const targetPage = nextPages[targetIndex];
    if (!targetPage) {
        return nextPages;
    }
    return nextPages.map((page, index) => index === targetIndex
        ? { ...page, events: [...page.events, nestedEvent(entry)] }
        : page);
}
export function nestedTimeline(entries) {
    return entries.reduce((pages, entry) => {
        if (entry.type === "page") {
            return [...pages, pageGroup(entry.url)];
        }
        if (entry.type === "observed") {
            return appendObservedEvent(pages, entry);
        }
        return pages;
    }, []);
}
//# sourceMappingURL=data-layer-timeline.js.map