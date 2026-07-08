import {
  pathStatus,
  samplePageObject,
  type HistoryPathStatus,
} from "./data-layer";
import { captureEntry, type DataLayerSessionState } from "./data-layer-session";

export interface ObservedDataLayerEntry {
  type: "observed";
  url: string;
  timestamp: string;
  observerPath: string;
  name: string;
  payload: unknown;
  rawValue: unknown;
}

export interface DataLayerHistoryObserver {
  status: HistoryPathStatus;
  historyPath: string;
  pageUrl: string;
  activeCount: number;
}

export interface DataLayerHistoryObserverState {
  observer?: DataLayerHistoryObserver;
  pageObject?: unknown;
  observedEntries?: ObservedDataLayerEntry[];
  pushReturn?: number;
  sessionState?: DataLayerSessionState;
}

function pathParts(path: string): string[] {
  return path
    .split(".")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function valueAtPath(pageObject: unknown, path: string): unknown {
  return pathParts(path).reduce<unknown>((current, part) => {
    if (current === null || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, pageObject);
}

function observedPayload(rawPayload: unknown): unknown {
  if (
    rawPayload !== null &&
    typeof rawPayload === "object" &&
    "label" in rawPayload
  ) {
    return (rawPayload as { label: unknown }).label;
  }

  return rawPayload;
}

export function attachHistoryArrayObserver(
  state: DataLayerHistoryObserverState,
  options: { historyPath: string; pageUrl: string; pageObject?: unknown },
): DataLayerHistoryObserverState {
  const pageObject =
    options.pageObject ?? state.pageObject ?? samplePageObject();
  const status = pathStatus(pageObject, options.historyPath);

  return {
    ...state,
    pageObject,
    observer: {
      status,
      historyPath: options.historyPath,
      pageUrl: options.pageUrl,
      activeCount: status === "ready" ? 1 : 0,
    },
  };
}

export function reinstallHistoryArrayObserver(
  state: DataLayerHistoryObserverState,
  options: { historyPath: string; pageUrl: string },
): DataLayerHistoryObserverState {
  return attachHistoryArrayObserver(
    {
      ...state,
      pageObject: samplePageObject(),
    },
    options,
  );
}

export function appendObservedHistoryEntry(
  state: DataLayerHistoryObserverState,
  rawValue: { event: string; payload: unknown },
  timestamp = new Date().toISOString(),
): DataLayerHistoryObserverState {
  const observer = state.observer;

  if (!observer || observer.status !== "ready") {
    return state;
  }

  const historyArray = valueAtPath(state.pageObject, observer.historyPath);

  if (!Array.isArray(historyArray)) {
    return state;
  }

  const pushReturn = historyArray.push(rawValue);
  const entry: ObservedDataLayerEntry = {
    type: "observed",
    url: observer.pageUrl,
    timestamp,
    observerPath: observer.historyPath,
    name: rawValue.event,
    payload: observedPayload(rawValue.payload),
    rawValue,
  };
  const sessionState = state.sessionState
    ? captureEntry(state.sessionState, entry)
    : undefined;

  return {
    ...state,
    observedEntries: [...(state.observedEntries ?? []), entry],
    pushReturn,
    ...(sessionState ? { sessionState } : {}),
  };
}
