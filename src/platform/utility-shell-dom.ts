import type { UtilityShell } from "../utility-registry.js";

export interface UtilityShellRoot {
  dataset: Record<string, string | undefined>;
}

export interface PageLifecycle {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

export function mountUtilityShell(
  shell: UtilityShell,
  root: UtilityShellRoot,
  pageLifecycle: PageLifecycle,
): { unmount(): void } {
  root.dataset.registeredUtilities = shell.utilityIds.join(",");
  root.dataset.activeUtilities = shell.activate().join(",");
  let mounted = true;
  const unmount = (): void => {
    if (!mounted) return;
    mounted = false;
    shell.deactivate();
    root.dataset.activeUtilities = "";
  };
  pageLifecycle.addEventListener("pagehide", unmount, { once: true });
  return { unmount };
}
