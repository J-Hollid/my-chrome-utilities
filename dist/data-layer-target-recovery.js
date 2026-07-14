import { attachedObservationTarget, registerObservationTarget, } from "./data-layer-observation-targets.js";
export function captureAttachedTargetRecovery(targetState, sessionState) {
    const target = attachedObservationTarget(targetState);
    const session = sessionState.session;
    if (!target ||
        session?.status !== "active" ||
        session.tabId !== target.tabId) {
        return undefined;
    }
    return {
        sessionId: session.id,
        targetId: target.id,
        tabId: target.tabId,
    };
}
export function attachedTargetRecoveryIsCurrent(targetState, sessionState, request) {
    const session = sessionState.session;
    return (session?.status === "active" &&
        session.id === request.sessionId &&
        session.tabId === request.tabId &&
        targetState.selectedTargetId === request.targetId &&
        targetState.attachedTargetId === request.targetId);
}
export function completeAttachedTargetRecovery(targetState, sessionState, request, recoveredTarget) {
    if (!attachedTargetRecoveryIsCurrent(targetState, sessionState, request) ||
        recoveredTarget.id !== request.targetId) {
        return { state: targetState, applied: false };
    }
    return {
        state: registerObservationTarget(targetState, {
            ...recoveredTarget,
            priorSession: true,
        }),
        applied: true,
    };
}
//# sourceMappingURL=data-layer-target-recovery.js.map