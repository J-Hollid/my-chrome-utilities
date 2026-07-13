import { cloneValue } from "./data-layer-defect-report-json.js";
import type {
  PathnameVisit,
  ReproductionStep,
  SupportingTimelineEntry,
  TimelineEvent,
  TimelineFilter,
  TimelineSelection,
} from "./data-layer-defect-report-model.js";

export function generatePathnameSkeleton(
  visits: readonly PathnameVisit[],
  startVisitId: string,
  defectVisitId: string,
): ReproductionStep[] {
  const start = visits.findIndex(({ id }) => id === startVisitId);
  const end = visits.findIndex(({ id }) => id === defectVisitId);
  if (start < 0 || end < start) throw new Error("The reproduction visit range is invalid.");
  return visits.slice(start, end + 1).map((visit, index) => ({
    visitId: visit.id,
    pathname: visit.pathname,
    text: `${index + 1}. Visit ${visit.pathname}`,
  }));
}

export function filterTimelineEvents(
  events: readonly TimelineEvent[],
  filter: TimelineFilter,
): TimelineEvent[] {
  return events.filter((event) =>
    (!filter.search || [event.captureTime, event.name, event.source, event.pathname, event.validation]
      .join(" ").toLowerCase().includes(filter.search.toLowerCase()))
    && (!filter.name || event.name.toLowerCase().includes(filter.name.toLowerCase()))
    && (!filter.source || event.source.toLowerCase().includes(filter.source.toLowerCase()))
    && (!filter.pathname || event.pathname === filter.pathname)
    && (!filter.validation || event.validation === filter.validation));
}

export interface TimelineEventChoice {
  event: TimelineEvent;
  alreadyAdded: boolean;
}

export interface TimelineEventChoicePage {
  choices: TimelineEventChoice[];
  hasOlder: boolean;
}

export function timelineEventChoices(
  events: readonly TimelineEvent[],
  filter: TimelineFilter,
  addedEventIds: readonly string[],
  limit: number,
): TimelineEventChoicePage {
  const added = new Set(addedEventIds);
  const matches = filterTimelineEvents(events, filter)
    .sort((left, right) => right.captureTime.localeCompare(left.captureTime));
  return {
    choices: matches.slice(0, Math.max(0, limit)).map((event) => ({ event, alreadyAdded: added.has(event.id) })),
    hasOlder: matches.length > limit,
  };
}

export function saveTimelineSelection(
  selections: readonly TimelineSelection[],
  selection: TimelineSelection,
): TimelineSelection[] {
  const index = selections.findIndex(({ eventId }) => eventId === selection.eventId);
  if (index < 0) return [...selections, { ...selection }];
  return selections.map((candidate, candidateIndex) => candidateIndex === index ? { ...selection } : { ...candidate });
}

export function removeTimelineSelection(
  selections: readonly TimelineSelection[],
  eventId: string,
): TimelineSelection[] {
  return selections.filter((selection) => selection.eventId !== eventId).map((selection) => ({ ...selection }));
}

export function supportingTimeline(
  events: readonly TimelineEvent[],
  selection: readonly TimelineSelection[],
): SupportingTimelineEntry[] {
  const selected = new Map(selection.map((item) => [item.eventId, item]));
  return [...events].sort((left, right) => left.captureTime.localeCompare(right.captureTime)).flatMap((event) => {
    const options = selected.get(event.id);
    if (!options) return [];
    return [{
      captureTime: event.captureTime,
      name: event.name,
      source: event.source,
      pathname: event.pathname,
      ...(options.includeSummary && event.summary !== undefined ? { summary: event.summary } : {}),
      ...(options.includePayload && event.payload !== undefined ? { payload: cloneValue(event.payload) } : {}),
      ...(options.includeValidation && event.validationDetails !== undefined ? { validationDetails: cloneValue(event.validationDetails) } : {}),
    }];
  });
}
