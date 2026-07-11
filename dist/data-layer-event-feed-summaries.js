export const defaultFeedSummaryRules = [
    { sourceId: "event-history", eventName: "pageview", paths: ["page_name", "page_type", "page_category"] },
    { sourceId: "event-history", eventName: "offer", paths: ["offer_action", "offer_id"] },
];
export function usableSummaryValue(value) {
    if (value === null || value === undefined || value === "")
        return false;
    return !(Array.isArray(value) && value.length === 0)
        && !(typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0);
}
function atPath(value, path) {
    return path.split(".").reduce((current, part) => current && typeof current === "object" ? current[part] : undefined, value);
}
export function summaryLabel(path) {
    const leaf = path.split(".").at(-1) ?? path;
    return leaf.split("_").map((word) => word ? word[0]?.toUpperCase() + word.slice(1) : word).join(" ");
}
export function resolveFeedSummaries(event, rules = defaultFeedSummaryRules) {
    const paths = rules.find((rule) => rule.sourceId === event.sourceId && rule.eventName === event.name)?.paths ?? [];
    return paths.map((path) => ({ path, label: summaryLabel(path), value: atPath(event.payload, path) }))
        .filter(({ value }) => usableSummaryValue(value)).slice(0, 2);
}
export function pathnameVisits(events) {
    return events.reduce((visits, event) => {
        const pathname = event.pageUrl ? new URL(event.pageUrl).pathname : "/";
        const current = visits.at(-1);
        return current?.pathname === pathname
            ? [...visits.slice(0, -1), { ...current, events: [...current.events, event] }]
            : [...visits, { pathname, events: [event] }];
    }, []).reverse().map((visit) => ({ ...visit, events: [...visit.events].reverse() }));
}
//# sourceMappingURL=data-layer-event-feed-summaries.js.map