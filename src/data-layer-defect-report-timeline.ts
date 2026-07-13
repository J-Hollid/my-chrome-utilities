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
    (!filter.name || event.name.toLowerCase().includes(filter.name.toLowerCase()))
    && (!filter.source || event.source.toLowerCase().includes(filter.source.toLowerCase()))
    && (!filter.pathname || event.pathname === filter.pathname)
    && (!filter.validation || event.validation === filter.validation));
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
