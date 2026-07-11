export function createLiveSessionSummary(input) {
    return {
        statusLabel: input.testingState === "Active"
            ? "Capturing"
            : input.testingState,
        targetPage: input.targetPage,
        pageUrl: input.pageUrl,
        observerPath: input.observerPath,
        capturedEventCount: input.capturedEventCount,
        connectedSourceCount: input.connectedSourceCount,
    };
}
//# sourceMappingURL=data-layer-live-session-summary.js.map