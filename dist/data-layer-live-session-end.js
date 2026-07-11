import { attachedObservationTarget, detachObservationTarget, } from "./data-layer-observation-targets.js";
import { endDataLayerTestingSession, } from "./data-layer-session.js";
export function endLiveSession(sessionState, targetState) {
    const releasedTargetId = attachedObservationTarget(targetState)?.id;
    return {
        sessionState: endDataLayerTestingSession(sessionState),
        targetState: detachObservationTarget(targetState),
        ...(releasedTargetId === undefined ? {} : { releasedTargetId }),
    };
}
//# sourceMappingURL=data-layer-live-session-end.js.map