export interface FeedSummary { path: string; label: string; value: unknown; }
export interface FeedSummaryRule { sourceId: string; eventName: string; paths: readonly string[]; }

export const defaultFeedSummaryRules: readonly FeedSummaryRule[] = [
  { sourceId: "event-history", eventName: "pageview", paths: ["page_name", "page_type", "page_category"] },
  { sourceId: "event-history", eventName: "offer", paths: ["offer_action", "offer_id"] },
];

export function usableSummaryValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  return !(Array.isArray(value) && value.length === 0)
    && !(typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0);
}

function atPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) =>
    current && typeof current === "object" ? (current as Record<string, unknown>)[part] : undefined, value);
}

export function summaryLabel(path: string): string {
  const leaf = path.split(".").at(-1) ?? path;
  return leaf.split("_").map((word) => word ? word[0]?.toUpperCase() + word.slice(1) : word).join(" ");
}

export function resolveFeedSummaries(event: { sourceId: string; name: string; payload?: unknown }, rules = defaultFeedSummaryRules): FeedSummary[] {
  const paths = rules.find((rule) => rule.sourceId === event.sourceId && rule.eventName === event.name)?.paths ?? [];
  return paths.map((path) => ({ path, label: summaryLabel(path), value: atPath(event.payload, path) }))
    .filter(({ value }) => usableSummaryValue(value)).slice(0, 2);
}

export function eventPathname(pageUrl: string | undefined): string {
  if (!pageUrl) return "/";
  try {
    return new URL(pageUrl).pathname;
  } catch {
    return "/";
  }
}

export interface PathnameVisit<T> { pathname: string; events: T[]; }
export function pathnameVisits<T extends { pageUrl?: string }>(events: readonly T[]): PathnameVisit<T>[] {
  return events.reduce<PathnameVisit<T>[]>((visits, event) => {
    const pathname = eventPathname(event.pageUrl);
    const current = visits.at(-1);
    return current?.pathname === pathname
      ? [...visits.slice(0, -1), { ...current, events: [...current.events, event] }]
      : [...visits, { pathname, events: [event] }];
  }, []).reverse().map((visit) => ({ ...visit, events: [...visit.events].reverse() }));
}
