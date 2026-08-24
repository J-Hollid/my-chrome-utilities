import type {
  ObservationTarget,
} from "../data-layer-observation-targets.js";
import type {
  TargetPathStatus,
} from "../data-layer-target-path-status.js";

export type LiveTargetPermissionRecoveryStep = "target" | "readiness" | "session";

export interface LiveTargetPermissionRecoveryReadiness {
  targetSelected: boolean;
  ready: boolean;
  currentStep: LiveTargetPermissionRecoveryStep;
  requestAccessVisible: false;
}

export function liveTargetPermissionRecoveryReadiness(input: {
  selectedTarget?: Pick<ObservationTarget, "accessState">;
  pathStatus: TargetPathStatus;
}): LiveTargetPermissionRecoveryReadiness {
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
