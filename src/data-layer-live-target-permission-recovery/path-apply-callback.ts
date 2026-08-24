import type { ActivePageObservationResult } from "../active-page-observation.js";

export interface LiveTargetPermissionPathApplyCoordinator {
  applyProbeObservation: (observation: ActivePageObservationResult) => Promise<unknown>;
}

export function createLiveTargetPermissionPathApplyCallback(options: {
  applyObservationEffects: (observation: ActivePageObservationResult) => void;
  coordinator: LiveTargetPermissionPathApplyCoordinator;
}): (observation: ActivePageObservationResult) => void {
  return (observation) => {
    options.applyObservationEffects(observation);
    void options.coordinator.applyProbeObservation(observation);
  };
}
