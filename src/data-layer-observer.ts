import {
  pathStatus,
  samplePageObject,
  type HistoryPathStatus,
} from "./data-layer.js";
import { captureEntry, type DataLayerSessionState } from "./data-layer-session.js";

export type PageAccessStatus =
  | "page access available"
  | "page access unavailable";
export type DataLayerObserverStatus =
  | HistoryPathStatus
  | "page access unavailable";

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
  status: DataLayerObserverStatus;
  historyPath: string;
  pageUrl: string;
  activeCount: number;
}

export interface ActivePageReadResult {
  historyPath: string;
  pageUrl: string;
  pageObject: unknown;
}

export interface DataLayerHistoryObserverState {
  observer?: DataLayerHistoryObserver;
  pageObject?: unknown;
  pageAccessStatus?: PageAccessStatus;
  activePageReadResult?: ActivePageReadResult;
  observedEntries?: ObservedDataLayerEntry[];
  pushReturn?: number;
  sessionState?: DataLayerSessionState;
}

export interface HistoryArrayObserverAttachOptions {
  historyPath: string;
  pageUrl: string;
  pageObject?: unknown;
  pageAccessStatus?: PageAccessStatus;
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

function historyEntryName(rawValue: unknown): string {
  if (
    rawValue !== null &&
    typeof rawValue === "object" &&
    "event" in rawValue
  ) {
    const event = (rawValue as { event: unknown }).event;
    return typeof event === "string" ? event : String(event ?? "");
  }

  return "";
}

function historyEntryPayload(rawValue: unknown): unknown {
  if (
    rawValue !== null &&
    typeof rawValue === "object" &&
    "payload" in rawValue
  ) {
    return (rawValue as { payload: unknown }).payload;
  }

  return undefined;
}

function observedEntry(
  observer: DataLayerHistoryObserver,
  rawValue: unknown,
  timestamp = new Date().toISOString(),
): ObservedDataLayerEntry {
  return {
    type: "observed",
    url: observer.pageUrl,
    timestamp,
    observerPath: observer.historyPath,
    name: historyEntryName(rawValue),
    payload: observedPayload(historyEntryPayload(rawValue)),
    rawValue,
  };
}

function captureObservedEntry(
  state: DataLayerHistoryObserverState,
  entry: ObservedDataLayerEntry,
): DataLayerHistoryObserverState {
  const sessionState = state.sessionState
    ? captureEntry(state.sessionState, entry)
    : undefined;

  return {
    ...state,
    observedEntries: [...(state.observedEntries ?? []), entry],
    ...(sessionState ? { sessionState } : {}),
  };
}

function captureExistingHistoryEntries(
  state: DataLayerHistoryObserverState,
  observer: DataLayerHistoryObserver,
): DataLayerHistoryObserverState {
  const historyArray = valueAtPath(state.pageObject, observer.historyPath);

  if (!Array.isArray(historyArray)) {
    return state;
  }

  return historyArray.reduce<DataLayerHistoryObserverState>(
    (nextState, rawValue) =>
      captureObservedEntry(nextState, observedEntry(observer, rawValue)),
    state,
  );
}

export function attachHistoryArrayObserver(
  state: DataLayerHistoryObserverState,
  options: HistoryArrayObserverAttachOptions,
): DataLayerHistoryObserverState {
  if (options.pageAccessStatus === "page access unavailable") {
    return {
      ...state,
      pageAccessStatus: options.pageAccessStatus,
      observer: {
        status: "page access unavailable",
        historyPath: options.historyPath,
        pageUrl: options.pageUrl,
        activeCount: 0,
      },
    };
  }

  const pageObject =
    options.pageObject ?? state.pageObject ?? samplePageObject();
  const status = pathStatus(pageObject, options.historyPath);
  const activePageReadResult =
    options.pageObject === undefined
      ? undefined
      : {
          historyPath: options.historyPath,
          pageUrl: options.pageUrl,
          pageObject,
        };
  const observer: DataLayerHistoryObserver = {
    status,
    historyPath: options.historyPath,
    pageUrl: options.pageUrl,
    activeCount: status === "ready" ? 1 : 0,
  };
  const nextState: DataLayerHistoryObserverState = {
    ...state,
    pageObject,
    pageAccessStatus: options.pageAccessStatus ?? "page access available",
    ...(activePageReadResult ? { activePageReadResult } : {}),
    observer,
  };

  return status === "ready"
    ? captureExistingHistoryEntries(nextState, observer)
    : nextState;
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

  return {
    ...captureObservedEntry(state, observedEntry(observer, rawValue, timestamp)),
    pushReturn,
  };
}
