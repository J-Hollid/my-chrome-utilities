import { liveTargetPermissionRecoveryReadiness, } from "./readiness.js";
export function createDormantLiveTargetPermissionRecoveryCoordinator(_adapters) {
    const inactive = (request) => Promise.resolve({
        status: "inactive",
        selectedTarget: request.selectedTarget,
    });
    return {
        projectReadiness: liveTargetPermissionRecoveryReadiness,
        reconcileProbe: inactive,
        requestAccess: inactive,
    };
}
//# sourceMappingURL=coordinator.js.map