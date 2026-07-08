import { getHistoryArrayPath } from "./data-layer";

export type DataLayerSessionStatus = "active" | "ended";

export interface DataLayerEventEntry {
  type: string;
  url: string;
  timestamp?: string;
  observerPath?: string;
  name?: string;
  payload?: unknown;
  rawValue?: unknown;
}

export interface DataLayerTestingSession {
  id: string;
  status: DataLayerSessionStatus;
  tabId: number;
  historyPath: string;
  startUrl: string;
  currentUrl: string;
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
  options: { tabId: number; url: string; historyPath?: string },
): DataLayerSessionState {
  if (state.session?.status === "active") {
    return {
      ...state,
      warning: "active session already exists",
    };
  }

  return {
    session: {
      id: `tab-${options.tabId}`,
      status: "active",
      tabId: options.tabId,
      historyPath: options.historyPath ?? getHistoryArrayPath(),
      startUrl: options.url,
      currentUrl: options.url,
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

export function persistSession(state: DataLayerSessionState): void {
  if (state.session) {
    localStorage.setItem(DATA_LAYER_SESSION_STORAGE_KEY, JSON.stringify(state));
  }
}

export function restoreSession(): DataLayerSessionState {
  const raw = localStorage.getItem(DATA_LAYER_SESSION_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as DataLayerSessionState;
  } catch {
    return {};
  }
}
