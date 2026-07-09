import {
  attachHistoryArrayObserver,
  type DataLayerHistoryObserverState,
} from "./data-layer-observer.js";
import type { DataLayerSessionState } from "./data-layer-session.js";

export type ObserverAttachmentStatus = "attached" | "needs sync" | "inactive";

export function observerAttachmentStatus(
  sessionState: DataLayerSessionState,
  observerState: DataLayerHistoryObserverState,
): ObserverAttachmentStatus {
  const session = sessionState.session;

  if (!session || session.status !== "active") {
    return "inactive";
  }

  return observerState.observer?.status === "ready" ? "attached" : "needs sync";
}

export function restartObservation(
  sessionState: DataLayerSessionState,
  observerState: DataLayerHistoryObserverState,
  options: { pageUrl: string; pageObject?: unknown },
): DataLayerHistoryObserverState {
  const session = sessionState.session;

  if (!session || session.status !== "active") {
    return observerState;
  }

  return attachHistoryArrayObserver(observerState, {
    historyPath: session.historyPath,
    pageUrl: options.pageUrl,
    ...(options.pageObject === undefined
      ? {}
      : { pageObject: options.pageObject }),
  });
}
