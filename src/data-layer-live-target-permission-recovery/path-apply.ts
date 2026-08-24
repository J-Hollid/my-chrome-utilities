import type { ActivePageObservationResult } from "../active-page-observation.js";
import type { ObservationTarget } from "../data-layer-observation-targets.js";
import type { LiveTargetPermissionProbeRequest } from "./coordinator.js";

export interface LiveTargetPermissionPathApplyResult {
  status: string;
  selectedTarget: ObservationTarget;
}

export interface LiveTargetPermissionPathApplyBridge {
  apply: (
    observation: ActivePageObservationResult,
  ) => Promise<LiveTargetPermissionPathApplyResult | undefined>;
}

export function createLiveTargetPermissionPathApplyBridge(options: {
  attachedTarget: () => ObservationTarget | undefined;
  selectedTarget: () => ObservationTarget | undefined;
  reconcileProbe: (
    request: LiveTargetPermissionProbeRequest,
  ) => Promise<LiveTargetPermissionPathApplyResult>;
  renderReadiness: () => void;
}): LiveTargetPermissionPathApplyBridge {
  return {
    async apply(observation) {
      const target = options.attachedTarget() ?? options.selectedTarget();
      if (!target || target.tabId !== observation.tabId) return undefined;
      const request: LiveTargetPermissionProbeRequest = {
        selectedTarget:target,
        historyPath:observation.historyPath,
        pageAccessStatus:observation.pageAccessStatus,
      };
      const result = await options.reconcileProbe(request);
      if (result.status !== "inactive") options.renderReadiness();
      return result;
    },
  };
}
