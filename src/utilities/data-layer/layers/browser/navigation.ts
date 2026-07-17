import type { UtilityMountHost } from "../../../../platform/utility-contract.js";

export function mountDataLayerNavigation(root: UtilityMountHost): () => void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(
    '[role="tab"][aria-controls^="data-layer-panel-"]',
  ));
  const select = (selected: HTMLButtonElement): void => {
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = root.querySelector<HTMLElement>(`#${tab.getAttribute("aria-controls")}`);
      if (panel) panel.hidden = !active;
    }
  };
  const onClick = (event: Event): void => {
    const tab = (event.target as Element).closest<HTMLButtonElement>('[role="tab"]');
    if (tab && tabs.includes(tab)) select(tab);
  };
  const tabList = tabs[0]?.parentElement;
  tabList?.addEventListener("click", onClick);
  if (tabs[0]) select(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0]);
  return () => tabList?.removeEventListener("click", onClick);
}
