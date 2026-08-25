import { beginDataLayerTestingSession, persistSession, restoreSession, } from "../../utilities/data-layer/capture.js";
import { createLiveObserverState, pauseCapture, recordLiveEvent, resumeCapture, } from "../../utilities/data-layer/live-inspection.js";
import { endDataLayerTestingSession } from "../../data-layer-session.js";
export function createCaptureInstalledController(ports) {
    let mounted = false;
    let unsubscribe;
    let session = restoreSession(ports.storage);
    let observer = createLiveObserverState({ pageUrl: ports.initialPageUrl(), sources: ports.initialSources() });
    const publish = () => { persistSession(session, ports.storage); ports.changed(session, observer); };
    const capture = (event) => {
        const previousCount = observer.events.length;
        observer = recordLiveEvent(observer, event);
        if (observer.events.length !== previousCount && session.session?.status === "active") {
            session = { ...session, session: { ...session.session, currentUrl: event.pageUrl ?? session.session.currentUrl,
                    timeline: [...session.session.timeline, { ...event, type: "observed", url: event.pageUrl ?? session.session.currentUrl,
                            timestamp: event.captureTime, rawValue: event.rawInput }] } };
        }
        publish();
    };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            unsubscribe = ports.subscribeToLiveFeed(capture);
            ports.changed(session, observer);
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            unsubscribe?.();
            unsubscribe = undefined;
        },
        async begin() {
            const started = beginDataLayerTestingSession(session, observer, await ports.sessionStart());
            session = started.sessionState;
            observer = started.liveObserverState;
            publish();
        },
        end() { session = endDataLayerTestingSession(session); publish(); },
        pause() { observer = pauseCapture(observer); publish(); },
        resume() { observer = resumeCapture(observer); publish(); },
        capture,
        state: () => ({ session: structuredClone(session), observer: structuredClone(observer) }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "capture",
    capabilities: ["observation targets", "sessions", "Live feed", "saved sessions", "refresh lifecycle"],
});
//# sourceMappingURL=index.js.map