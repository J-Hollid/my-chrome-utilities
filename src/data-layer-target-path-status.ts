import type { ActivePageObservationResult } from "./active-page-observation.js";
import { pathStatus } from "./data-layer.js";

export type TargetPathStatus = "Ready" | "Waiting for path" | "Permission required" | "Error" | "Selection required";

export function authoritativePathStatus(status: ReturnType<typeof pathStatus> | "page access unavailable"): TargetPathStatus {
  if (status === "ready") return "Ready";
  if (status === "path missing") return "Waiting for path";
  if (status === "page access unavailable") return "Permission required";
  return "Error";
}

export interface TargetPathStatusController {
  configure: (path: string, fieldValue?: string) => Promise<void>;
}

export function targetPathStatusForObservation(
  observation: ActivePageObservationResult,
  path: string,
): TargetPathStatus {
  return authoritativePathStatus(observation.pageAccessStatus === "page access available"
    ? pathStatus(observation.pageObject, path)
    : "page access unavailable");
}

export function createTargetPathStatusController(options: {
  render: (path: string, fieldValue: string, status: TargetPathStatus) => void;
  read: (path: string) => Promise<ActivePageObservationResult | undefined>;
  apply: (observation: ActivePageObservationResult) => void;
}): TargetPathStatusController {
  let latestRequest = 0;

  return {
    async configure(path: string, fieldValue = path): Promise<void> {
      latestRequest += 1;
      const request = latestRequest;
      const observation = await options.read(path);

      if (request !== latestRequest) return;
      if (!observation) {
        options.render(path, fieldValue, "Selection required");
        return;
      }

      options.render(
        path,
        fieldValue,
        targetPathStatusForObservation(observation, path),
      );
      options.apply(observation);
    },
  };
}
