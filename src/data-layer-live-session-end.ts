import {
  attachedObservationTarget,
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
  releasedTargetId?: string;
}

export function endLiveSession(
  sessionState: DataLayerSessionState,
  targetState: ObservationTargetState,
): EndedLiveSession {
  const releasedTargetId = attachedObservationTarget(targetState)?.id;
  return {
    sessionState: endDataLayerTestingSession(sessionState),
    targetState: detachObservationTarget(targetState),
    ...(releasedTargetId === undefined ? {} : { releasedTargetId }),
  };
}
