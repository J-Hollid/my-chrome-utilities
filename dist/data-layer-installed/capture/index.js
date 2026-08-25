export function createCaptureInstalledController(ports) {
    let mounted = false;
    let unsubscribe;
    let state = { phase: "idle", capturedEventCount: 0 };
    const noteCapturedEvent = () => {
        state = { ...state, capturedEventCount: state.capturedEventCount + 1 };
    };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            unsubscribe = ports.subscribeToLiveFeed(noteCapturedEvent);
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            unsubscribe?.();
            unsubscribe = undefined;
        },
        async begin() { await ports.beginSession(); state = { ...state, phase: "active" }; },
        async end() { await ports.endSession(); state = { ...state, phase: "idle" }; },
        save: ports.saveCurrentSession,
        noteCapturedEvent,
        state: () => ({ ...state }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "capture",
    capabilities: ["observation targets", "sessions", "Live feed", "saved sessions"],
});
//# sourceMappingURL=index.js.map