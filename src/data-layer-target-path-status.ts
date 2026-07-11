import type { ActivePageObservationResult } from "./active-page-observation.js";
import { pathStatus } from "./data-layer.js";

export type TargetPathStatus = "Checking target…" | "Selection required" | "page access unavailable" | ReturnType<typeof pathStatus>;

export interface TargetPathStatusController {
  configure: (path: string, fieldValue?: string) => Promise<void>;
}

export function targetPathStatusForObservation(
  observation: ActivePageObservationResult,
  path: string,
): TargetPathStatus {
  return observation.pageAccessStatus === "page access available"
    ? pathStatus(observation.pageObject, path)
    : "page access unavailable";
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
      options.render(path, fieldValue, "Checking target…");
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
