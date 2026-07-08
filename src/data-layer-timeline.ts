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

export function timelineDetails(
  entry: DataLayerEventEntry,
): TimelineEntryDetails {
  return {
    ...timelineSummary(entry),
    payload: stringifyValue(entry.payload),
    rawValue: stringifyValue(entry.rawValue),
  };
}
