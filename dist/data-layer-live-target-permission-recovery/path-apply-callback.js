export function createLiveTargetPermissionPathApplyCallback(options) {
    return (observation) => {
        options.applyObservationEffects(observation);
        void options.coordinator.applyProbeObservation(observation);
    };
}
//# sourceMappingURL=path-apply-callback.js.map