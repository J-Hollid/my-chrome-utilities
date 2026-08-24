import {
  createLiveTargetPermissionRecoveryCoordinator,
  type LiveTargetPermissionRecoveryCoordinatorAdapters,
} from "./coordinator.js";
import {
  createLiveTargetPermissionRecoveryActionHost,
  type LiveTargetPermissionRecoveryActionHost,
} from "./action-host.js";

export type LiveTargetPermissionRecoveryCompositionAdapters =
  Omit<LiveTargetPermissionRecoveryCoordinatorAdapters, "actionHost"> & {
    actionHost?: LiveTargetPermissionRecoveryActionHost;
  };

export function createDormantLiveTargetPermissionRecoveryCoordinator(
  adapters: LiveTargetPermissionRecoveryCompositionAdapters,
): import("./coordinator.js").LiveTargetPermissionRecoveryCoordinator {
  return createLiveTargetPermissionRecoveryCoordinator({
    ...adapters,
    actionHost:adapters.actionHost ?? createLiveTargetPermissionRecoveryActionHost(),
  });
}

export {
  createLiveTargetPermissionRecoveryCoordinator,
  type ActiveLiveTargetPermissionRecoveryResult,
  type DormantLiveTargetPermissionRecoveryResult,
  type LiveTargetPermissionProbeRequest,
  type LiveTargetPermissionRecoveryCoordinator,
  type LiveTargetPermissionRecoveryCoordinatorAdapters,
  type LiveTargetPermissionRecoveryRequest,
  type LiveTargetPermissionRecoveryResult,
} from "./coordinator.js";
export {
  createLiveTargetPermissionRecoveryActionHost,
  type LiveTargetPermissionRecoveryActionHost,
} from "./action-host.js";
export {
  liveTargetPermissionRecoveryReadiness,
  type LiveTargetPermissionRecoveryReadiness,
  type LiveTargetPermissionRecoveryStep,
} from "./readiness.js";
export {
  createLiveTargetPermissionPathApplyBridge,
  type LiveTargetPermissionPathApplyBridge,
  type LiveTargetPermissionPathApplyResult,
} from "./path-apply.js";
export {
  createLiveTargetPermissionPathApplyCallback,
  type LiveTargetPermissionPathApplyCoordinator,
} from "./path-apply-callback.js";
