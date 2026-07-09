import { attachHistoryArrayObserver, } from "./data-layer-observer.js";
export function observerAttachmentStatus(sessionState, observerState) {
    const session = sessionState.session;
    if (!session || session.status !== "active") {
        return "inactive";
    }
    if (observerState.pageAccessStatus === "page access unavailable") {
        return "page access unavailable";
    }
    return observerState.observer?.status === "ready" ? "attached" : "needs sync";
}
export function restartObservation(sessionState, observerState, options) {
    const session = sessionState.session;
    if (!session || session.status !== "active") {
        return observerState;
    }
    return attachHistoryArrayObserver({ ...observerState, sessionState }, {
        historyPath: session.historyPath,
        pageUrl: options.pageUrl,
        ...(options.pageObject === undefined
            ? {}
            : { pageObject: options.pageObject }),
        ...(options.pageAccessStatus === undefined
            ? {}
            : { pageAccessStatus: options.pageAccessStatus }),
    });
}
//# sourceMappingURL=data-layer-recovery.js.map