import { targetPathStatusForObservation, } from "../data-layer-target-path-status.js";
import { createLiveTargetPermissionRecoveryActionHost, } from "./action-host.js";
import { createLiveTargetPermissionPathApplyBridge, } from "./path-apply.js";
import { liveTargetPermissionRecoveryReadiness, } from "./readiness.js";
export function createDormantLiveTargetPermissionRecoveryCoordinator(adapters) {
    const actionHost = adapters.actionHost ?? createLiveTargetPermissionRecoveryActionHost();
    let recoveredTargetId;
    let recoveredPathStatus;
    let recoveredHistoryPath;
    const clearRecovery = () => {
        recoveredTargetId = undefined;
        recoveredPathStatus = undefined;
        recoveredHistoryPath = undefined;
        actionHost.hide();
    };
    const inactive = (request) => ({
        status: "inactive",
        selectedTarget: request.selectedTarget,
    });
    const showRecoveryAction = (request) => {
        actionHost.show(request.selectedTarget, () => coordinator.requestAccess(request));
    };
    const retainRecovery = (request, status) => {
        recoveredTargetId = request.selectedTarget.id;
        recoveredPathStatus = "Permission required";
        recoveredHistoryPath = request.historyPath;
        adapters.updateTargetAccess(request.selectedTarget.id, "Permission required");
        showRecoveryAction(request);
        return {
            status,
            selectedTarget: request.selectedTarget,
            pathStatus: "Permission required",
        };
    };
    const coordinator = {
        projectReadiness(input) {
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
        async reconcileProbe(request) {
            if (request.pageAccessStatus === "page access available") {
                clearRecovery();
                return inactive(request);
            }
            return retainRecovery(request, "recovery-required");
        },
        async requestAccess(request) {
            let granted = false;
            try {
                granted = await adapters.requestOriginAccess(request.selectedTarget.origin);
            }
            catch {
                granted = false;
            }
            if (!granted)
                return retainRecovery(request, "access-declined");
            let observation;
            try {
                observation = await adapters.recheckPath(request.selectedTarget, request.historyPath);
            }
            catch {
                observation = undefined;
            }
            if (!observation || observation.pageAccessStatus !== "page access available") {
                return retainRecovery(request, "recovery-required");
            }
            const pathStatus = targetPathStatusForObservation(observation, request.historyPath);
            recoveredTargetId = request.selectedTarget.id;
            recoveredPathStatus = pathStatus;
            recoveredHistoryPath = request.historyPath;
            actionHost.hide();
            adapters.updateTargetAccess(request.selectedTarget.id, "Ready");
            return { status: "path-rechecked", selectedTarget: request.selectedTarget, pathStatus };
        },
        applyProbeObservation: async () => undefined,
    };
    if (adapters.pathApply) {
        const applyPathObservation = createLiveTargetPermissionPathApplyBridge({
            ...adapters.pathApply,
            reconcileProbe: (request) => coordinator.reconcileProbe(request),
        }).apply;
        coordinator.applyProbeObservation = async (observation) => {
            const result = await applyPathObservation(observation);
            if (result?.status === "recovery-required" || result?.status === "access-declined") {
                showRecoveryAction({
                    selectedTarget: result.selectedTarget,
                    historyPath: observation.historyPath,
                });
            }
            return result;
        };
    }
    return coordinator;
}
//# sourceMappingURL=coordinator.js.map