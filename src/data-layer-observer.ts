import {
  pathStatus,
  samplePageObject,
  type HistoryPathStatus,
} from "./data-layer.js";
import {
  captureSourceEvent,
  type DataLayerSessionState,
} from "./data-layer-session.js";
import {
  canonicalCapturedEvent,
  importedOnce,
  markImported,
  nextSubscription,
  stopSubscription,
  type CaptureContext,
  type SubscriptionState,
} from "./data-layer-event-presentation.js";
import type { SourceEvent } from "./data-layer-source.js";

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
  event: SourceEvent;
}

export interface DataLayerHistoryObserver {
  status: DataLayerObserverStatus;
  historyPath: string;
  pageUrl: string;
  pageLoadId?: string;
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
  sourceEvents?: SourceEvent[];
  subscription?: SubscriptionState;
}

export interface HistoryArrayObserverAttachOptions {
  historyPath: string;
  pageUrl: string;
  pageLoadId?: string;
  pageObject?: unknown;
  pageAccessStatus?: PageAccessStatus;
  requestId?: string;
  importExisting?: boolean;
}

export interface HistoryArraySnapshotAttachOptions {
  historyPath: string;
  pageUrl: string;
  pageLoadId?: string;
  rawValues: readonly unknown[];
  requestId?: string;
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

function pageObjectForHistorySnapshot(
  historyPath: string,
  rawValues: readonly unknown[],
): unknown {
  const parts = pathParts(historyPath);
  const root: Record<string, unknown> = {};
  let current = root;

  parts.forEach((part, index) => {
    const value = index === parts.length - 1 ? [...rawValues] : {};
    current[part] = value;
    if (index < parts.length - 1) {
      current = value as Record<string, unknown>;
    }
  });

  return root;
}

function captureContext(
  state: DataLayerHistoryObserverState,
  observer: DataLayerHistoryObserver,
): CaptureContext {
  return {
    sessionId: state.sessionState?.session?.id ?? `page:${observer.pageUrl}`,
    sourceId: "event-history",
    sourceKind: "Data Layer",
    pageUrl: observer.pageUrl,
    ...(observer.pageLoadId ? { pageLoadId: observer.pageLoadId } : {}),
    destination: observer.historyPath,
  };
}

function observedEntry(
  state: DataLayerHistoryObserverState,
  observer: DataLayerHistoryObserver,
  rawValue: unknown,
  timestamp = new Date().toISOString(),
): ObservedDataLayerEntry {
  const event = canonicalCapturedEvent(
    captureContext(state, observer),
    rawValue,
    timestamp,
    (state.sourceEvents?.length ?? 0) + 1,
  );
  return {
    type: "observed",
    url: event.pageUrl,
    timestamp: event.captureTime,
    observerPath: observer.historyPath,
    name: event.name,
    payload: event.payload,
    rawValue: event.rawInput,
    event,
  };
}

function captureObservedEntry(
  state: DataLayerHistoryObserverState,
  entry: ObservedDataLayerEntry,
): DataLayerHistoryObserverState {
  const sessionState = state.sessionState
    ? captureSourceEvent(state.sessionState, entry.event, entry.observerPath)
    : undefined;

  return {
    ...state,
    observedEntries: [...(state.observedEntries ?? []), entry],
    sourceEvents: [...(state.sourceEvents ?? []), entry.event],
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

  const captureTime = new Date().toISOString();
  const pageScope = observer.pageLoadId ?? observer.pageUrl;
  const captured = historyArray.reduce<DataLayerHistoryObserverState>(
    (nextState, rawValue, index) =>
      importedOnce(
        nextState.subscription ?? { imported: new Set(), activeCount: 0 },
        pageScope,
        observer.historyPath,
        index,
      )
        ? nextState
        : captureObservedEntry(
            nextState,
            observedEntry(nextState, observer, rawValue, captureTime),
          ),
    state,
  );
  return {
    ...captured,
    subscription: markImported(
      captured.subscription ?? { imported: new Set(), activeCount: 0 },
      pageScope,
      observer.historyPath,
      historyArray.length,
    ),
  };
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
      subscription: stopSubscription(
        state.subscription ?? { imported: new Set(), activeCount: 0 },
      ),
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
    ...(options.pageLoadId ? { pageLoadId: options.pageLoadId } : {}),
    activeCount: status === "ready" ? 1 : 0,
  };
  const nextState: DataLayerHistoryObserverState = {
    ...state,
    pageObject,
    pageAccessStatus: options.pageAccessStatus ?? "page access available",
    ...(activePageReadResult ? { activePageReadResult } : {}),
    observer,
    subscription: nextSubscription(
      state.subscription ?? { imported: new Set(), activeCount: 0 },
      options.pageUrl,
      options.historyPath,
      options.requestId ?? `${options.pageUrl}:${options.historyPath}`,
    ),
  };

  return status === "ready" && options.importExisting !== false
    ? captureExistingHistoryEntries(nextState, observer)
    : nextState;
}

export function attachHistoryArraySnapshot(
  state: DataLayerHistoryObserverState,
  options: HistoryArraySnapshotAttachOptions,
): DataLayerHistoryObserverState {
  return attachHistoryArrayObserver(state, {
    historyPath: options.historyPath,
    pageUrl: options.pageUrl,
    ...(options.pageLoadId === undefined
      ? {}
      : { pageLoadId: options.pageLoadId }),
    pageObject: pageObjectForHistorySnapshot(
      options.historyPath,
      options.rawValues,
    ),
    ...(options.requestId === undefined
      ? {}
      : { requestId: options.requestId }),
  });
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
  rawValue: unknown,
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
  const captured = captureObservedEntry(
    state,
    observedEntry(state, observer, rawValue, timestamp),
  );

  return {
    ...captured,
    pushReturn,
    subscription: markImported(
      captured.subscription ?? { imported: new Set(), activeCount: 0 },
      observer.pageLoadId ?? observer.pageUrl,
      observer.historyPath,
      historyArray.length,
    ),
  };
}

export function stopHistoryArrayObserver(
  state: DataLayerHistoryObserverState,
): DataLayerHistoryObserverState {
  const observer = state.observer;
  return {
    ...state,
    ...(observer ? { observer: { ...observer, activeCount: 0 } } : {}),
    subscription: stopSubscription(
      state.subscription ?? { imported: new Set(), activeCount: 0 },
    ),
  };
}
