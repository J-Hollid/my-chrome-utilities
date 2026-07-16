import { getHistoryArrayPath } from "./data-layer.js";
import type { SourceEvent } from "./data-layer-source.js";

export type DataLayerSessionStatus = "active" | "ended";

export interface DataLayerEventEntry {
  type: string;
  url: string;
  timestamp?: string;
  observerPath?: string;
  name?: string;
  payload?: unknown;
  rawValue?: unknown;
  id?: string;
  sessionId?: string;
  sourceId?: string;
  sourceKind?: string;
  pageUrl?: string;
  rawInput?: unknown;
  validation?: string;
  provenance?: string;
}

export interface DataLayerTestingSession {
  id: string;
  status: DataLayerSessionStatus;
  tabId: number;
  historyPath: string;
  startUrl: string;
  currentUrl: string;
  windowId?: number;
  targetTitle?: string;
  targetOrigin?: string;
  parentSavedSessionId?: string;
  freshBoundary?: boolean;
  timeline: DataLayerEventEntry[];
}

export interface DataLayerSessionState {
  session?: DataLayerTestingSession;
  warning?: string;
}

export const DATA_LAYER_SESSION_STORAGE_KEY = "dataLayerTestingSession";

export function sessionScope(state: DataLayerSessionState): string | undefined {
  return state.session ? "active-tab journey" : undefined;
}

export function startDataLayerTestingSession(
  state: DataLayerSessionState,
  options: {
    id: string;
    tabId: number;
    url: string;
    historyPath?: string;
    windowId?: number;
    targetTitle?: string;
    targetOrigin?: string;
  },
): DataLayerSessionState {
  if (state.session?.status === "active") {
    return {
      ...state,
      warning: "active session already exists",
    };
  }

  return {
    session: {
      id: options.id,
      status: "active",
      tabId: options.tabId,
      historyPath: options.historyPath ?? getHistoryArrayPath(),
      startUrl: options.url,
      currentUrl: options.url,
      ...(options.windowId === undefined ? {} : { windowId: options.windowId }),
      ...(options.targetTitle === undefined ? {} : { targetTitle: options.targetTitle }),
      ...(options.targetOrigin === undefined ? {} : { targetOrigin: options.targetOrigin }),
      timeline: [],
    },
  };
}

export function navigateSession(
  state: DataLayerSessionState,
  url: string,
): DataLayerSessionState {
  if (!state.session || state.session.status !== "active") {
    return state;
  }

  return {
    ...state,
    session: {
      ...state.session,
      currentUrl: url,
    },
  };
}

export function captureEntry(
  state: DataLayerSessionState,
  entry: DataLayerEventEntry,
): DataLayerSessionState {
  if (!state.session || state.session.status !== "active") {
    return state;
  }

  return {
    ...state,
    session: {
      ...state.session,
      timeline: [...state.session.timeline, entry],
    },
  };
}

export function captureSourceEvent(
  state: DataLayerSessionState,
  event: SourceEvent,
  destination: string,
): DataLayerSessionState {
  return captureEntry(state, {
    ...event,
    type: "observed",
    url: event.pageUrl,
    timestamp: event.captureTime,
    observerPath: destination,
    rawValue: event.rawInput,
  });
}

export function endDataLayerTestingSession(
  state: DataLayerSessionState,
): DataLayerSessionState {
  if (!state.session) {
    return state;
  }

  return {
    session: {
      ...state.session,
      status: "ended",
    },
  };
}

export function persistSession(state: DataLayerSessionState, storage: Pick<Storage, "setItem"> = localStorage): void {
  if (state.session) {
    storage.setItem(DATA_LAYER_SESSION_STORAGE_KEY, JSON.stringify(state));
  }
}

export function restoreSession(storage: Pick<Storage, "getItem"> = localStorage): DataLayerSessionState {
  const raw = storage.getItem(DATA_LAYER_SESSION_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as DataLayerSessionState;
  } catch {
    return {};
  }
}
