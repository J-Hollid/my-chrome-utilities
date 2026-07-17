import {
  resetLiveObserverForSession,
  type LiveObserverState,
} from "./utilities/data-layer/live-inspection.js";
import {
  startDataLayerTestingSession,
  type DataLayerSessionState,
} from "./data-layer-session.js";

export interface DataLayerSessionStartResult {
  sessionState: DataLayerSessionState;
  liveObserverState: LiveObserverState;
  started: boolean;
}
export function beginDataLayerTestingSession(
  sessionState: DataLayerSessionState,
  liveObserverState: LiveObserverState,
  options: Parameters<typeof startDataLayerTestingSession>[1],
): DataLayerSessionStartResult {
  const nextSessionState = startDataLayerTestingSession(sessionState, options);
  const started = nextSessionState.session !== sessionState.session;

  return {
    sessionState: nextSessionState,
    liveObserverState: started
      ? resetLiveObserverForSession(liveObserverState)
      : liveObserverState,
    started,
  };
}
