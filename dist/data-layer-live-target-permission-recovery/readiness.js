export function liveTargetPermissionRecoveryReadiness(input) {
    const targetSelected = input.selectedTarget !== undefined;
    const ready = input.selectedTarget?.accessState === "Ready"
        && input.pathStatus === "Ready";
    return {
        targetSelected,
        ready,
        currentStep: !targetSelected ? "target" : ready ? "session" : "readiness",
        requestAccessVisible: false,
    };
}
//# sourceMappingURL=readiness.js.map