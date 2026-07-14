import {
  attachHistoryArrayObserver,
  type DataLayerHistoryObserverState,
  type HistoryArrayObserverAttachOptions,
} from "./data-layer-observer.js";
import type { DataLayerSessionState } from "./data-layer-session.js";

export type ObserverAttachmentStatus =
  | "attached"
  | "needs sync"
  | "inactive"
  | "page access unavailable";

export function observerAttachmentStatus(
  sessionState: DataLayerSessionState,
  observerState: DataLayerHistoryObserverState,
): ObserverAttachmentStatus {
  const session = sessionState.session;

  if (!session || session.status !== "active") {
    return "inactive";
  }

  if (observerState.pageAccessStatus === "page access unavailable") {
    return "page access unavailable";
  }

  return observerState.observer?.status === "ready" ? "attached" : "needs sync";
}

export function restartObservation(
  sessionState: DataLayerSessionState,
  observerState: DataLayerHistoryObserverState,
  options: Omit<HistoryArrayObserverAttachOptions, "historyPath">,
): DataLayerHistoryObserverState {
  const session = sessionState.session;

  if (!session || session.status !== "active") {
    return observerState;
  }

  return attachHistoryArrayObserver(
    { ...observerState, sessionState },
    {
      historyPath: session.historyPath,
      pageUrl: options.pageUrl,
      ...(options.pageLoadId === undefined
        ? {}
        : { pageLoadId: options.pageLoadId }),
      ...(options.pageObject === undefined
        ? {}
        : { pageObject: options.pageObject }),
      ...(options.pageAccessStatus === undefined
        ? {}
        : { pageAccessStatus: options.pageAccessStatus }),
    },
  );
}
