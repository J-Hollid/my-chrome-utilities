import { detachObservationTarget, } from "./data-layer-observation-targets.js";
import { endDataLayerTestingSession, } from "./data-layer-session.js";
export function endLiveSession(sessionState, targetState) {
    return {
        sessionState: endDataLayerTestingSession(sessionState),
        targetState: detachObservationTarget(targetState),
    };
}
//# sourceMappingURL=data-layer-live-session-end.js.map