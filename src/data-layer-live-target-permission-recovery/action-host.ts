import type { ObservationTarget } from "../data-layer-observation-targets.js";

export interface LiveTargetPermissionRecoveryActionHost {
  show: (
    target: ObservationTarget,
    requestAccess: () => Promise<unknown> | void,
  ) => void;
  hide: () => void;
  historyPath?: () => string | undefined;
  pathStatus?: () => string | undefined;
}

export function createLiveTargetPermissionRecoveryActionHost(
  root: ParentNode | undefined = typeof document === "undefined" ? undefined : document,
): LiveTargetPermissionRecoveryActionHost {
  let action: HTMLButtonElement | undefined;

  const removeAction = (): void => {
    action?.remove();
    action = undefined;
  };

  return {
    show(target, requestAccess): void {
      const step = root?.querySelector<HTMLElement>("#live-setup-readiness");
      if (!step || typeof document === "undefined") return;
      removeAction();
      action = document.createElement("button");
      action.type = "button";
      action.dataset.liveTargetPermissionRecovery = target.id;
      action.textContent = "Request access";
      action.addEventListener("click", () => { void requestAccess(); });
      step.append(action);
    },
    hide:removeAction,
    historyPath:() => {
      const fieldValue = root?.querySelector<HTMLInputElement>("#history-path")?.value.trim();
      return fieldValue
        || root?.querySelector<HTMLElement>("#history-path-display")?.textContent?.trim();
    },
    pathStatus:() =>
      root?.querySelector<HTMLElement>("#history-path-status")?.textContent?.trim(),
  };
}
