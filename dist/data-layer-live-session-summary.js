export function createLiveSessionSummary(input) {
    return {
        statusLabel: input.testingState === "Active"
            ? "Capturing"
            : input.testingState,
        observerStatus: input.observerStatus,
        targetPage: input.targetPage,
        pageUrl: input.pageUrl,
        observerPath: input.observerPath,
        capturedEventCount: input.capturedEventCount,
        connectedSourceCount: input.connectedSourceCount,
    };
}
export function canonicalLiveObserverStatus(status) {
    switch (status) {
        case "attached": return "Connected";
        case "needs sync": return "Waiting for path";
        case "page access unavailable": return "Error";
        case "inactive": return "Disconnected";
    }
}
//# sourceMappingURL=data-layer-live-session-summary.js.map