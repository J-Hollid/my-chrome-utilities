import { attachHistoryArrayObserver, } from "./data-layer-observer.js";
export function observerAttachmentStatus(sessionState, observerState) {
    const session = sessionState.session;
    if (!session || session.status !== "active") {
        return "inactive";
    }
    return observerState.observer?.status === "ready" ? "attached" : "needs sync";
}
export function restartObservation(sessionState, observerState, options) {
    const session = sessionState.session;
    if (!session || session.status !== "active") {
        return observerState;
    }
    return attachHistoryArrayObserver(observerState, {
        historyPath: session.historyPath,
        pageUrl: options.pageUrl,
        ...(options.pageObject === undefined
            ? {}
            : { pageObject: options.pageObject }),
    });
}
//# sourceMappingURL=data-layer-recovery.js.map