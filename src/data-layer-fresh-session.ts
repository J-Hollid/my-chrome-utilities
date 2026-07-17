import type { DataLayerHistoryObserverState } from "./data-layer-observer.js";
import {
  resetLiveObserverForSession,
  type LiveEvent,
  type LiveObserverState,
} from "./utilities/data-layer/live-inspection.js";
import type {
  DataLayerEventEntry,
  DataLayerSessionState,
  DataLayerTestingSession,
} from "./data-layer-session.js";

export interface FreshSessionAvailability {
  available: boolean;
  unsavedEventCount: number;
  action: "start" | "confirm" | "unavailable";
}
export function freshSessionAvailability(options: {
  eventCount: number;
  savedThroughEventCount: number;
  savedSessionMode: boolean;
}): FreshSessionAvailability {
  const unsavedEventCount = Math.max(0, options.eventCount - options.savedThroughEventCount);
  if (options.savedSessionMode) return { available:false, unsavedEventCount, action:"unavailable" };
  return {
    available:true,
    unsavedEventCount,
    action:unsavedEventCount > 0 ? "confirm" : "start",
  };
}

export interface FreshLiveSessionResult {
  sessionState: DataLayerSessionState;
  liveObserverState: LiveObserverState;
  observerState: DataLayerHistoryObserverState;
  started: boolean;
}

function freshSession(previous: DataLayerTestingSession, id: string): DataLayerTestingSession {
  return {
    id,
    status:"active",
    freshBoundary:true,
    tabId:previous.tabId,
    historyPath:previous.historyPath,
    startUrl:previous.currentUrl,
    currentUrl:previous.currentUrl,
    ...(previous.windowId === undefined ? {} : { windowId:previous.windowId }),
    ...(previous.targetTitle === undefined ? {} : { targetTitle:previous.targetTitle }),
    ...(previous.targetOrigin === undefined ? {} : { targetOrigin:previous.targetOrigin }),
    timeline:[],
  };
}

export function startFreshLiveSession(
  sessionState: DataLayerSessionState,
  liveObserverState: LiveObserverState,
  observerState: DataLayerHistoryObserverState,
  id: string,
): FreshLiveSessionResult {
  const previous = sessionState.session;
  if (!previous || previous.status !== "active") {
    return { sessionState, liveObserverState, observerState, started:false };
  }
  const nextSessionState: DataLayerSessionState = { session:freshSession(previous, id) };
  return {
    sessionState:nextSessionState,
    liveObserverState:resetLiveObserverForSession(liveObserverState),
    observerState:{
      ...observerState,
      observedEntries:[],
      sourceEvents:[],
      sessionState:nextSessionState,
    },
    started:true,
  };
}

function restoredLiveEvent(entry: DataLayerEventEntry): LiveEvent | undefined {
  const captureTime = entry.timestamp;
  if (entry.type !== "observed" || !entry.id || !entry.name || !entry.sourceId || !captureTime) return undefined;
  return {
    id:entry.id,
    name:entry.name,
    sourceId:entry.sourceId,
    captureTime,
    ...(entry.sourceKind ? { sourceKind:entry.sourceKind } : {}),
    ...(entry.pageUrl ? { pageUrl:entry.pageUrl } : {}),
    ...(entry.payload !== undefined ? { payload:structuredClone(entry.payload) } : {}),
    ...(entry.rawInput !== undefined ? { rawInput:structuredClone(entry.rawInput) } : {}),
    ...(entry.validation ? { validation:entry.validation as NonNullable<LiveEvent["validation"]> } : {}),
  };
}

export function restoreFreshSessionLiveObserver(
  base: LiveObserverState,
  sessionState: DataLayerSessionState,
): LiveObserverState {
  const session = sessionState.session;
  if (!session?.freshBoundary) return base;
  const events = session.timeline.flatMap((entry) => {
    const event = restoredLiveEvent(entry);
    return event ? [event] : [];
  });
  return {
    ...resetLiveObserverForSession(base),
    pageUrl:session.currentUrl,
    events,
  };
}
