import type { DataLayerEventEntry } from "./data-layer-session.js";

export interface TimelineEntrySummary {
  name: string;
  url: string;
  timestamp: string;
  observerPath: string;
}

export interface TimelineEntryDetails extends TimelineEntrySummary {
  payload: string;
  rawValue: string;
}

export interface TimelinePayloadProperty {
  name: string;
  value: string;
}

export interface NestedTimelineEvent extends TimelineEntryDetails {
  payloadProperties: TimelinePayloadProperty[];
}

export interface NestedTimelinePage {
  url: string;
  events: NestedTimelineEvent[];
}

function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function stringifyScalarValue(value: unknown): string {
  if (value !== null && typeof value === "object") {
    return stringifyValue(value);
  }

  return JSON.stringify(String(value ?? ""));
}

function objectEntries(value: unknown): [string, unknown][] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>);
}

export function timelineSummary(
  entry: DataLayerEventEntry,
): TimelineEntrySummary {
  return {
    name: entry.name ?? entry.type,
    url: entry.url,
    timestamp: entry.timestamp ?? "",
    observerPath: entry.observerPath ?? "",
  };
}

export function displayPayloadValue(entry: DataLayerEventEntry): string {
  return payloadProperties(entry).length > 0 ? "" : stringifyValue(entry.payload);
}

export function displayRawValue(entry: DataLayerEventEntry): string {
  return payloadProperties(entry).length > 0
    ? ""
    : stringifyValue(entry.rawValue);
}

export function timelineEventHeading(
  event: Pick<TimelineEntrySummary, "name" | "timestamp" | "observerPath">,
): string {
  return [event.name || event.timestamp, event.observerPath]
    .filter((value) => value.length > 0)
    .join(" | ");
}

export function timelineDetails(
  entry: DataLayerEventEntry,
): TimelineEntryDetails {
  return {
    ...timelineSummary(entry),
    payload: displayPayloadValue(entry),
    rawValue: displayRawValue(entry),
  };
}

export function payloadProperties(
  entry: DataLayerEventEntry,
): TimelinePayloadProperty[] {
  return objectEntries(entry.payload).map(([name, value]) => ({
    name,
    value: stringifyScalarValue(value),
  }));
}

function nestedEvent(entry: DataLayerEventEntry): NestedTimelineEvent {
  return {
    ...timelineDetails(entry),
    payloadProperties: payloadProperties(entry),
  };
}

function pageGroup(url: string): NestedTimelinePage {
  return { url, events: [] };
}

function findLatestPageIndex(
  pages: readonly NestedTimelinePage[],
  url: string,
): number {
  for (let index = pages.length - 1; index >= 0; index -= 1) {
    if (pages[index]?.url === url) {
      return index;
    }
  }

  return -1;
}

function appendObservedEvent(
  pages: NestedTimelinePage[],
  entry: DataLayerEventEntry,
): NestedTimelinePage[] {
  const pageIndex = findLatestPageIndex(pages, entry.url);
  const nextPages = pageIndex === -1 ? [...pages, pageGroup(entry.url)] : pages;
  const targetIndex = pageIndex === -1 ? nextPages.length - 1 : pageIndex;
  const targetPage = nextPages[targetIndex];

  if (!targetPage) {
    return nextPages;
  }

  return nextPages.map((page, index) =>
    index === targetIndex
      ? { ...page, events: [...page.events, nestedEvent(entry)] }
      : page,
  );
}

export function nestedTimeline(
  entries: readonly DataLayerEventEntry[],
): NestedTimelinePage[] {
  return entries.reduce<NestedTimelinePage[]>((pages, entry) => {
    if (entry.type === "page") {
      return [...pages, pageGroup(entry.url)];
    }

    if (entry.type === "observed") {
      return appendObservedEvent(pages, entry);
    }

    return pages;
  }, []);
}
