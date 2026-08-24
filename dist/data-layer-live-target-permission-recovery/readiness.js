export function liveTargetPermissionRecoveryReadiness(input) {
    const targetSelected = input.selectedTarget !== undefined;
    const ready = input.selectedTarget?.accessState === "Ready"
        && input.pathStatus === "Ready";
    const requestAccessVisible = input.selectedTarget?.accessState === "Permission required"
        && input.pathStatus === "Permission required";
    return {
        targetSelected,
        ready,
        currentStep: !targetSelected ? "target" : ready ? "session" : "readiness",
        requestAccessVisible,
    };
}
//# sourceMappingURL=readiness.js.map