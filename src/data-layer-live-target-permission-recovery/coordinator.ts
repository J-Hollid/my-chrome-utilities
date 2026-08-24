import type {
  ObservationTarget,
  ObservationTargetAccessState,
} from "../data-layer-observation-targets.js";
import type { ActivePageObservationResult } from "../active-page-observation.js";
import {
  targetPathStatusForObservation,
  type TargetPathStatus,
} from "../data-layer-target-path-status.js";
import type { LiveTargetPermissionRecoveryActionHost } from "./action-host.js";
import {
  createLiveTargetPermissionPathApplyBridge,
  type LiveTargetPermissionPathApplyResult,
} from "./path-apply.js";
import {
  liveTargetPermissionRecoveryReadiness,
  type LiveTargetPermissionRecoveryReadiness,
} from "./readiness.js";

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

export interface ActiveLiveTargetPermissionRecoveryResult {
  status: "recovery-required" | "access-declined" | "path-rechecked";
  selectedTarget: ObservationTarget;
  pathStatus: TargetPathStatus;
}

export type LiveTargetPermissionRecoveryResult =
  | DormantLiveTargetPermissionRecoveryResult
  | ActiveLiveTargetPermissionRecoveryResult;

export interface LiveTargetPermissionRecoveryCoordinator {
  projectReadiness: (input: {
    selectedTarget?: ObservationTarget;
    pathStatus: TargetPathStatus;
  }) => LiveTargetPermissionRecoveryReadiness;
  reconcileProbe: (
    request: LiveTargetPermissionProbeRequest,
  ) => Promise<LiveTargetPermissionRecoveryResult>;
  requestAccess: (
    request: LiveTargetPermissionRecoveryRequest,
  ) => Promise<LiveTargetPermissionRecoveryResult>;
  applyProbeObservation: (
    observation: ActivePageObservationResult,
  ) => Promise<LiveTargetPermissionPathApplyResult | undefined>;
}

export interface LiveTargetPermissionRecoveryCoordinatorAdapters {
  requestOriginAccess: (origin: string) => Promise<boolean>;
  recheckPath: (
    target: ObservationTarget,
    historyPath: string,
  ) => Promise<ActivePageObservationResult | undefined>;
  updateTargetAccess: (
    targetId: string,
    accessState: ObservationTargetAccessState,
  ) => void;
  actionHost: LiveTargetPermissionRecoveryActionHost;
  pathApply?: {
    attachedTarget: () => ObservationTarget | undefined;
    selectedTarget: () => ObservationTarget | undefined;
    renderReadiness: () => void;
  };
}

export function createLiveTargetPermissionRecoveryCoordinator(
  adapters: LiveTargetPermissionRecoveryCoordinatorAdapters,
): LiveTargetPermissionRecoveryCoordinator {
  const { actionHost } = adapters;
  let recoveredTargetId: string | undefined;
  let recoveredPathStatus: TargetPathStatus | undefined;
  let recoveredHistoryPath: string | undefined;

  const clearRecovery = (): void => {
    recoveredTargetId = undefined;
    recoveredPathStatus = undefined;
    recoveredHistoryPath = undefined;
    actionHost.hide();
  };
  const inactive = (
    request: LiveTargetPermissionRecoveryRequest,
  ): DormantLiveTargetPermissionRecoveryResult => ({
    status:"inactive",
    selectedTarget:request.selectedTarget,
  });
  const showRecoveryAction = (request: LiveTargetPermissionRecoveryRequest): void => {
    actionHost.show(request.selectedTarget, () => coordinator.requestAccess(request));
  };
  const retainRecovery = (
    request: LiveTargetPermissionRecoveryRequest,
    status: ActiveLiveTargetPermissionRecoveryResult["status"],
  ): ActiveLiveTargetPermissionRecoveryResult => {
    recoveredTargetId = request.selectedTarget.id;
    recoveredPathStatus = "Permission required";
    recoveredHistoryPath = request.historyPath;
    adapters.updateTargetAccess(request.selectedTarget.id, "Permission required");
    showRecoveryAction(request);
    return {
      status,
      selectedTarget:request.selectedTarget,
      pathStatus:"Permission required",
    };
  };

  const coordinator: LiveTargetPermissionRecoveryCoordinator = {
    projectReadiness(input): LiveTargetPermissionRecoveryReadiness {
      const currentHistoryPath = actionHost.historyPath?.();
      if (recoveredTargetId && (recoveredTargetId !== input.selectedTarget?.id
          || Boolean(currentHistoryPath && recoveredHistoryPath !== currentHistoryPath))) {
        clearRecovery();
      }
      const recoveryApplies = Boolean(input.selectedTarget
        && recoveredTargetId === input.selectedTarget.id
        && recoveredPathStatus
        && (!currentHistoryPath || recoveredHistoryPath === currentHistoryPath));
      const pathStatus = recoveryApplies && recoveredPathStatus
        ? recoveredPathStatus
        : input.pathStatus;
      return liveTargetPermissionRecoveryReadiness({ ...input, pathStatus });
    },
    async reconcileProbe(request): Promise<LiveTargetPermissionRecoveryResult> {
      if (request.pageAccessStatus === "page access available") {
        clearRecovery();
        return inactive(request);
      }
      return retainRecovery(request, "recovery-required");
    },
    async requestAccess(request): Promise<LiveTargetPermissionRecoveryResult> {
      let granted = false;
      try { granted = await adapters.requestOriginAccess(request.selectedTarget.origin); }
      catch { granted = false; }
      if (!granted) return retainRecovery(request, "access-declined");

      let observation: ActivePageObservationResult | undefined;
      try { observation = await adapters.recheckPath(request.selectedTarget, request.historyPath); }
      catch { observation = undefined; }
      if (!observation || observation.pageAccessStatus !== "page access available") {
        return retainRecovery(request, "recovery-required");
      }

      const pathStatus = targetPathStatusForObservation(observation, request.historyPath);
      recoveredTargetId = request.selectedTarget.id;
      recoveredPathStatus = pathStatus;
      recoveredHistoryPath = request.historyPath;
      actionHost.hide();
      adapters.updateTargetAccess(request.selectedTarget.id, "Ready");
      return { status:"path-rechecked", selectedTarget:request.selectedTarget, pathStatus };
    },
    applyProbeObservation:async () => undefined,
  };

  if (adapters.pathApply) {
    const applyPathObservation = createLiveTargetPermissionPathApplyBridge({
      ...adapters.pathApply,
      reconcileProbe:(request) => coordinator.reconcileProbe(request),
    }).apply;
    coordinator.applyProbeObservation = async (observation) => {
      const result = await applyPathObservation(observation);
      if (result?.status === "recovery-required" || result?.status === "access-declined") {
        showRecoveryAction({
          selectedTarget:result.selectedTarget,
          historyPath:observation.historyPath,
        });
      }
      return result;
    };
  }
  return coordinator;
}
