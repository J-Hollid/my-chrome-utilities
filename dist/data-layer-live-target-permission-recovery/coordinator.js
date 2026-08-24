export function createDormantLiveTargetPermissionRecoveryCoordinator(_adapters) {
    const inactive = (request) => Promise.resolve({
        status: "inactive",
        selectedTarget: request.selectedTarget,
    });
    return {
        reconcileProbe: inactive,
        requestAccess: inactive,
    };
}
//# sourceMappingURL=coordinator.js.map