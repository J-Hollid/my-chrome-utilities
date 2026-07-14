import type { SourceEvent } from "./data-layer-source.js";
import type { ValidationIssue } from "./data-layer-schema-verification.js";
import type { ValidationEvaluation } from "./data-layer-validation-model.js";
import type { ResolvedSchemaDocumentation } from "./data-layer-schema-documentation.js";
import type { PresentedEventTriage } from "./data-layer-defect-library.js";
import { filterEventsByQuery, type EventFeedQuery } from "./data-layer-event-feed-query.js";

export const DATA_LAYER_VIEW_STORAGE_KEY = "my-chrome-utilities.data-layer-view.v1";

export const dataLayerViews = ["Live", "Library", "Sessions", "Defects", "Schemas"] as const;
export type DataLayerView = (typeof dataLayerViews)[number];
export type LiveStatus = "Live" | "Paused";
export type InspectorLayout = "stacked" | "split";

export interface LiveSource {
  id: string;
  name: string;
  status: string;
  restartVisible?: boolean;
}

export type LiveEvent = Pick<SourceEvent, "id" | "name" | "sourceId" | "captureTime"> &
  Partial<
    Omit<SourceEvent, "id" | "name" | "sourceId" | "captureTime">
  > & {
    sourceName?: string;
    destination?: string;
    keyProperties?: Readonly<Record<string, unknown>>;
    defectTriage?: PresentedEventTriage;
    validationDetails?: {
      issues: readonly ValidationIssue[];
      evaluations: readonly ValidationEvaluation[];
      schema?: { id: string; name: string; version: number };
      documentation?: ResolvedSchemaDocumentation;
      assignment?: { id?: string; name?: string; sourceId?: string; eventName?: string; target?: string; priority?: number; domainCondition?: string; pathnameCondition?: string; versionPolicy?: string; enabled?: boolean };
    };
  };

export interface LiveFilter {
  kind: "text" | "source" | "event name" | "validation state";
  value: string;
}

export interface LiveObserverState {
  view: DataLayerView;
  status: LiveStatus;
  pageUrl: string;
  sources: readonly LiveSource[];
  events: readonly LiveEvent[];
  filter?: LiveFilter;
  query?: EventFeedQuery;
  inspectorEventId?: string;
  listVisible: boolean;
}

export function dataLayerViewForNavigationKey(
  current: DataLayerView,
  key: string,
): DataLayerView | undefined {
  const index = dataLayerViews.indexOf(current);
  if (key === "Home") return dataLayerViews[0];
  if (key === "End") return dataLayerViews.at(-1);
  if (key === "ArrowRight") return dataLayerViews[(index + 1) % dataLayerViews.length];
  if (key === "ArrowLeft") return dataLayerViews[(index - 1 + dataLayerViews.length) % dataLayerViews.length];
  return undefined;
}

export function createLiveObserverState(options: {
  pageUrl: string;
  sources: readonly LiveSource[];
}): LiveObserverState {
  return { view: "Live", status: "Live", pageUrl: options.pageUrl, sources: [...options.sources], events: [], listVisible: true };
}

export function pauseCapture(state: LiveObserverState): LiveObserverState {
  return { ...state, status: "Paused" };
}

export function resumeCapture(state: LiveObserverState): LiveObserverState {
  return { ...state, status: "Live" };
}

export function recordLiveEvent(state: LiveObserverState, event: LiveEvent): LiveObserverState {
  return state.status === "Paused" ? state : { ...state, events: [...state.events, { ...event }] };
}

export function updateLiveSourceStatus(
  state: LiveObserverState,
  sourceId: string,
  status: string,
): LiveObserverState {
  return {
    ...state,
    sources: state.sources.map((source) => source.id === sourceId
      ? { ...source, status, restartVisible: status !== "Connected" }
      : source),
  };
}

export function setLiveFilter(
  state: LiveObserverState,
  filter: LiveFilter | undefined,
): LiveObserverState {
  if (filter) return { ...state, filter: { ...filter } };
  const { filter: _filter, ...withoutFilter } = state;
  return withoutFilter;
}

export function setLiveQuery(state: LiveObserverState, query: EventFeedQuery): LiveObserverState {
  const { filter: _filter, ...withoutLegacyFilter } = state;
  return { ...withoutLegacyFilter, query: { conditions: query.conditions.map((condition) => ({ ...condition, values: [...condition.values] })) } };
}

export function filteredLiveEvents(state: LiveObserverState): LiveEvent[] {
  if (state.query?.conditions.length) return filterEventsByQuery(state.events, state.query);
  if (!state.filter) return [...state.events];
  const value = state.filter.value.toLowerCase();
  return state.events.filter((event) => {
    if (state.filter?.kind === "source") {
      return `${event.sourceName ?? ""} ${event.sourceId}`
        .toLowerCase()
        .includes(value);
    }
    if (state.filter?.kind === "event name") return event.name.toLowerCase().includes(value);
    if (state.filter?.kind === "validation state") {
      if (value === "warnings") return Boolean(event.validation?.endsWith("warnings") && !event.validation.includes("error"));
      if (value === "issues") return Boolean(event.validation?.endsWith("issues") || event.validation?.includes("error") && event.validation !== "Assignment error");
      return event.validation?.toLowerCase().includes(value) ?? false;
    }
    return `${event.name} ${event.sourceName ?? ""} ${event.sourceId} ${JSON.stringify(event.keyProperties ?? event.payload ?? "")}`
      .toLowerCase()
      .includes(value);
  });
}

export function liveEventWindow(state: LiveObserverState, count: number): LiveEvent[] {
  return filteredLiveEvents(state).slice(-count);
}

export function selectLiveEvent(
  state: LiveObserverState,
  eventId: string,
  layout: InspectorLayout,
): LiveObserverState {
  return { ...state, inspectorEventId: eventId, listVisible: layout === "split" };
}

export function closeLiveInspector(state: LiveObserverState): LiveObserverState {
  const { inspectorEventId: _inspectorEventId, ...withoutInspector } = state;
  return { ...withoutInspector, listVisible: true };
}

export function resetLiveObserverForSession(state: LiveObserverState): LiveObserverState {
  const {
    filter: _filter,
    query: _query,
    inspectorEventId: _inspectorEventId,
    ...sessionIndependentState
  } = state;
  return { ...sessionIndependentState, status: "Live", events: [], listVisible: true };
}
