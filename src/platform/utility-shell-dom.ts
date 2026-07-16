import type { UtilityShell } from "../utility-registry.js";
import type { UtilityModuleEntry } from "./utility-contract.js";

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

export function renderUtilityDirectory(
  utilities: readonly UtilityModuleEntry[],
  container: HTMLElement,
  ownerDocument: Pick<Document, "createElement"> = document,
): void {
  const items = utilities.map((utility) => {
    const item = ownerDocument.createElement("li");
    item.dataset.utilityId = utility.id;
    item.textContent = utility.identity.name;
    item.title = utility.identity.description;
    return item;
  });
  container.replaceChildren(...items);
}
