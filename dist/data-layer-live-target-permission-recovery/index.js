import { createLiveTargetPermissionRecoveryCoordinator, } from "./coordinator.js";
import { createLiveTargetPermissionRecoveryActionHost, } from "./action-host.js";
export function createDormantLiveTargetPermissionRecoveryCoordinator(adapters) {
    return createLiveTargetPermissionRecoveryCoordinator({
        ...adapters,
        actionHost: adapters.actionHost ?? createLiveTargetPermissionRecoveryActionHost(),
    });
}
export { createLiveTargetPermissionRecoveryCoordinator, } from "./coordinator.js";
export { createLiveTargetPermissionRecoveryActionHost, } from "./action-host.js";
export { liveTargetPermissionRecoveryReadiness, } from "./readiness.js";
export { createLiveTargetPermissionPathApplyBridge, } from "./path-apply.js";
export { createLiveTargetPermissionPathApplyCallback, } from "./path-apply-callback.js";
//# sourceMappingURL=index.js.map