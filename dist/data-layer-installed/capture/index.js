import { beginDataLayerTestingSession, createLiveNotificationController, observationRefreshDelay, persistSession, restoreSession, } from "../../utilities/data-layer/capture.js";
import { createLiveObserverState, findLiveObserverElements, pauseCapture, recordLiveEvent, renderLiveObserverState, resumeCapture, } from "../../utilities/data-layer/live-inspection.js";
import { endDataLayerTestingSession } from "../../data-layer-session.js";
export function createCaptureInstalledController(ports) {
    const startTestingButton = ports.root.querySelector("#start-data-layer-testing");
    const endTestingButton = ports.root.querySelector("#end-data-layer-testing");
    const liveObserverElements = findLiveObserverElements(ports.root);
    const pauseCaptureButton = liveObserverElements.pauseCaptureButton;
    const resumeCaptureButton = liveObserverElements.resumeCaptureButton;
    const liveNotificationController = createLiveNotificationController((message) => ports.setLiveSessionMessage(message), (clear, delayMs) => { globalThis.setTimeout(clear, delayMs); });
    let mounted = false;
    let unsubscribe;
    let dataLayerSessionState = restoreSession(ports.storage);
    let liveObserverState = createLiveObserverState({ pageUrl: ports.initialPageUrl(), sources: ports.initialSources() });
    let observationRefreshTimeoutId;
    const renderLiveObserver = () => {
        if (mounted)
            renderLiveObserverState(liveObserverElements, liveObserverState, () => { });
    };
    const publish = () => {
        persistSession(dataLayerSessionState, ports.storage);
        ports.changed(dataLayerSessionState, liveObserverState);
        renderLiveObserver();
    };
    const syncCapturedEventsToLive = (event) => {
        const previousCount = liveObserverState.events.length;
        liveObserverState = recordLiveEvent(liveObserverState, event);
        if (liveObserverState.events.length !== previousCount && dataLayerSessionState.session?.status === "active") {
            dataLayerSessionState = { ...dataLayerSessionState, session: { ...dataLayerSessionState.session,
                    currentUrl: event.pageUrl ?? dataLayerSessionState.session.currentUrl,
                    timeline: [...dataLayerSessionState.session.timeline, { ...event, type: "observed", url: event.pageUrl ?? dataLayerSessionState.session.currentUrl,
                            timestamp: event.captureTime, rawValue: event.rawInput }] } };
        }
        publish();
    };
    const startTesting = () => ports.runCommand("data-layer.start-testing");
    const endTesting = () => ports.runCommand("data-layer.end-testing");
    const setLiveSessionMessage = (message) => liveNotificationController.announce(message);
    const pauseInstalledCapture = () => {
        liveObserverState = pauseCapture(liveObserverState);
        setLiveSessionMessage("Capture paused");
        publish();
    };
    const resumeInstalledCapture = () => {
        liveObserverState = resumeCapture(liveObserverState);
        setLiveSessionMessage("Capture resumed");
        publish();
    };
    function clearScheduledObservationRefresh() {
        if (observationRefreshTimeoutId !== undefined) {
            globalThis.clearTimeout(observationRefreshTimeoutId);
            observationRefreshTimeoutId = undefined;
        }
    }
    function scheduleObservationRefresh(request) {
        clearScheduledObservationRefresh();
        const delay = observationRefreshDelay(request.attempt);
        observationRefreshTimeoutId = globalThis.setTimeout(() => {
            observationRefreshTimeoutId = undefined;
            void ports.runObservationRefresh(request);
        }, delay);
    }
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            unsubscribe = ports.subscribeToLiveFeed(syncCapturedEventsToLive);
            startTestingButton?.addEventListener("click", startTesting);
            endTestingButton?.addEventListener("click", endTesting);
            pauseCaptureButton?.addEventListener("click", pauseInstalledCapture);
            resumeCaptureButton?.addEventListener("click", resumeInstalledCapture);
            ports.changed(dataLayerSessionState, liveObserverState);
            renderLiveObserver();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            unsubscribe?.();
            unsubscribe = undefined;
            startTestingButton?.removeEventListener("click", startTesting);
            endTestingButton?.removeEventListener("click", endTesting);
            pauseCaptureButton?.removeEventListener("click", pauseInstalledCapture);
            resumeCaptureButton?.removeEventListener("click", resumeInstalledCapture);
            clearScheduledObservationRefresh();
        },
        async begin() {
            const started = beginDataLayerTestingSession(dataLayerSessionState, liveObserverState, await ports.sessionStart());
            dataLayerSessionState = started.sessionState;
            liveObserverState = started.liveObserverState;
            publish();
        },
        end() { dataLayerSessionState = endDataLayerTestingSession(dataLayerSessionState); publish(); },
        pause: pauseInstalledCapture,
        resume: resumeInstalledCapture,
        capture: syncCapturedEventsToLive,
        scheduleObservationRefresh,
        state: () => ({ session: structuredClone(dataLayerSessionState), observer: structuredClone(liveObserverState) }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "capture",
    capabilities: ["observation targets", "sessions", "Live feed", "saved sessions", "refresh lifecycle"],
});
//# sourceMappingURL=index.js.map