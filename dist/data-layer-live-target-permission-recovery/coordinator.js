import { liveTargetPermissionRecoveryReadiness, } from "./readiness.js";
import { createLiveTargetPermissionPathApplyBridge, } from "./path-apply.js";
export function createDormantLiveTargetPermissionRecoveryCoordinator(_adapters) {
    const inactive = (request) => Promise.resolve({
        status: "inactive",
        selectedTarget: request.selectedTarget,
    });
    const coordinator = {
        projectReadiness: liveTargetPermissionRecoveryReadiness,
        reconcileProbe: inactive,
        requestAccess: inactive,
        applyProbeObservation: async () => undefined,
    };
    if (_adapters.pathApply) {
        coordinator.applyProbeObservation = createLiveTargetPermissionPathApplyBridge({
            ..._adapters.pathApply,
            reconcileProbe: (request) => coordinator.reconcileProbe(request),
        }).apply;
    }
    return coordinator;
}
//# sourceMappingURL=coordinator.js.map