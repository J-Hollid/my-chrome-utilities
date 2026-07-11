import { resetLiveObserverForSession, } from "./data-layer-live-observer.js";
import { startDataLayerTestingSession, } from "./data-layer-session.js";
export function beginDataLayerTestingSession(sessionState, liveObserverState, options) {
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
//# sourceMappingURL=data-layer-session-start.js.map