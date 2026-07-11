import {
  detachObservationTarget,
  type ObservationTargetState,
} from "./data-layer-observation-targets.js";
import {
  endDataLayerTestingSession,
  type DataLayerSessionState,
} from "./data-layer-session.js";

export interface EndedLiveSession {
  sessionState: DataLayerSessionState;
  targetState: ObservationTargetState;
}

export function endLiveSession(
  sessionState: DataLayerSessionState,
  targetState: ObservationTargetState,
): EndedLiveSession {
  return {
    sessionState: endDataLayerTestingSession(sessionState),
    targetState: detachObservationTarget(targetState),
  };
}
