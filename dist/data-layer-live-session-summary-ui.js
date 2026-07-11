export function findLiveSessionSummaryElements(root = document) {
    return {
        sessionStatus: root.querySelector("#live-session-status"),
        targetPage: root.querySelector("#live-target-page"),
        pageUrl: root.querySelector("#live-page-url"),
        observerPath: root.querySelector("#live-observer-path"),
        capturedEventCount: root.querySelector("#live-captured-event-count"),
        connectedSourceCount: root.querySelector("#live-connected-source-count"),
        copyPageUrlButton: root.querySelector("#copy-live-page-url"),
    };
}
export function renderLiveSessionSummary(elements, summary) {
    if (elements.sessionStatus) {
        elements.sessionStatus.textContent = summary.statusLabel;
        elements.sessionStatus.dataset.status = summary.statusLabel.toLowerCase();
    }
    if (elements.targetPage)
        elements.targetPage.textContent = summary.targetPage;
    if (elements.pageUrl)
        elements.pageUrl.textContent = summary.pageUrl;
    if (elements.observerPath)
        elements.observerPath.textContent = summary.observerPath;
    if (elements.capturedEventCount) {
        elements.capturedEventCount.textContent = String(summary.capturedEventCount);
    }
    if (elements.connectedSourceCount) {
        elements.connectedSourceCount.textContent = String(summary.connectedSourceCount);
    }
    if (elements.copyPageUrlButton) {
        elements.copyPageUrlButton.disabled = summary.pageUrl.length === 0;
    }
}
//# sourceMappingURL=data-layer-live-session-summary-ui.js.map