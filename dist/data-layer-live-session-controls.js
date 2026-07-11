export function liveSessionControls(state) {
    if (!state.activeSession) {
        return { sessionAction: "Start testing", captureAction: "none" };
    }
    return {
        sessionAction: "End testing",
        captureAction: state.captureStatus === "Paused"
            ? "Resume capture"
            : "Pause capture",
    };
}
//# sourceMappingURL=data-layer-live-session-controls.js.map