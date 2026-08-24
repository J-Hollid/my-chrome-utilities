import type {
  ObservationTarget,
  ObservationTargetAccessState,
} from "../data-layer-observation-targets.js";
import type {
  ActivePageObservationResult,
} from "../active-page-observation.js";
import {
  liveTargetPermissionRecoveryReadiness,
  type LiveTargetPermissionRecoveryReadiness,
} from "./readiness.js";
import type { TargetPathStatus } from "../data-layer-target-path-status.js";

export interface LiveTargetPermissionRecoveryRequest {
  selectedTarget: ObservationTarget;
  historyPath: string;
}

export interface LiveTargetPermissionProbeRequest
  extends LiveTargetPermissionRecoveryRequest {
  pageAccessStatus: ActivePageObservationResult["pageAccessStatus"];
}

export interface DormantLiveTargetPermissionRecoveryResult {
  status: "inactive";
  selectedTarget: ObservationTarget;
}

export interface LiveTargetPermissionRecoveryCoordinator {
  projectReadiness: (input: {
    selectedTarget?: Pick<ObservationTarget, "accessState">;
    pathStatus: TargetPathStatus;
  }) => LiveTargetPermissionRecoveryReadiness;
  reconcileProbe: (
    request: LiveTargetPermissionProbeRequest,
  ) => Promise<DormantLiveTargetPermissionRecoveryResult>;
  requestAccess: (
    request: LiveTargetPermissionRecoveryRequest,
  ) => Promise<DormantLiveTargetPermissionRecoveryResult>;
}

export function createDormantLiveTargetPermissionRecoveryCoordinator(_adapters: {
  requestOriginAccess: (origin: string) => Promise<boolean>;
  recheckPath: (
    target: ObservationTarget,
    historyPath: string,
  ) => Promise<ActivePageObservationResult | undefined>;
  updateTargetAccess: (
    targetId: string,
    accessState: ObservationTargetAccessState,
  ) => void;
}): LiveTargetPermissionRecoveryCoordinator {
  const inactive = (
    request: LiveTargetPermissionRecoveryRequest,
  ): Promise<DormantLiveTargetPermissionRecoveryResult> => Promise.resolve({
    status:"inactive",
    selectedTarget:request.selectedTarget,
  });

  return {
    projectReadiness:liveTargetPermissionRecoveryReadiness,
    reconcileProbe:inactive,
    requestAccess:inactive,
  };
}
