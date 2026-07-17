import type { UtilityShell } from "../utility-registry.js";
import type { UtilityModuleEntry } from "./utility-contract.js";

export interface UtilityShellRoot {
  dataset: Record<string, string | undefined>;
}

export interface UtilityMountRoot extends UtilityShellRoot, Pick<ParentNode, "querySelector"> {}

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

export function mountUtility(
  utility: UtilityModuleEntry,
  root: UtilityMountRoot,
  pageLifecycle: PageLifecycle,
): { unmount(): void } {
  return utility.lifecycle.mount(root, pageLifecycle);
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

export function bindUtilityPanels(
  utilities: readonly UtilityModuleEntry[],
  root: Pick<ParentNode, "querySelector">,
): void {
  const owners = new Map<string, string>();
  for (const utility of utilities) {
    for (const panelId of utility.panels) {
      const previousOwner = owners.get(panelId);
      if (previousOwner) {
        throw new Error(`Panel ${panelId} is owned by both ${previousOwner} and ${utility.id}`);
      }
      const panel = root.querySelector<HTMLElement>(`#${panelId}`);
      if (!panel) throw new Error(`Registered utility panel is missing: ${panelId}`);
      panel.dataset.utilityOwner = utility.id;
      owners.set(panelId, utility.id);
    }
  }
}
