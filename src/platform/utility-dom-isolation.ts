export interface UtilityDomScope {
  utilityId: string;
  panelIds: readonly string[];
  removeSelectors?: readonly string[];
}

export interface OwnedUtilityElement {
  id: string;
  owner: string | undefined;
}

export function retainUtilityElement(element: OwnedUtilityElement, scope: UtilityDomScope): boolean {
  return element.owner === scope.utilityId && scope.panelIds.includes(element.id);
}

export function utilityDomScopeFromSearch(search: string): UtilityDomScope | undefined {
  const parameters = new URLSearchParams(search);
  const utilityId = parameters.get("utility");
  const panelIds = parameters.getAll("panel");
  if (!utilityId || panelIds.length === 0) return undefined;

  const removeSelectors = parameters.getAll("remove");
  return {
    utilityId,
    panelIds,
    ...(removeSelectors.length > 0 ? { removeSelectors } : {}),
  };
}

function removeExcludedElements(root: ParentNode, selectors: readonly string[]): void {
  for (const selector of selectors) root.querySelector(selector)?.remove();
}

function removeElementsOutsideScope(root: ParentNode, scope: UtilityDomScope): void {
  for (const element of Array.from(root.querySelectorAll<HTMLElement>("[data-utility-owner]"))) {
    const ownedElement = { id: element.id, owner: element.dataset.utilityOwner };
    if (!retainUtilityElement(ownedElement, scope)) element.remove();
  }
}

function synchronizeTabList(
  root: ParentNode,
  tabs: readonly HTMLButtonElement[],
  panelIds: readonly string[],
): void {
  const selected = tabs.find((tab) => panelIds.includes(tab.getAttribute("aria-controls") ?? ""));
  if (!selected) return;

  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    const panel = root.querySelector<HTMLElement>(`#${tab.getAttribute("aria-controls")}`);
    if (panel) panel.hidden = !active;
  }
}

function synchronizeTabs(root: ParentNode, panelIds: readonly string[]): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"][aria-controls]'));
  for (const tab of tabs) {
    const panelId = tab.getAttribute("aria-controls");
    if (!panelId || !root.querySelector(`#${panelId}`)) tab.remove();
  }

  const connectedTabs = tabs.filter((tab) => tab.isConnected);
  const tabLists = new Set(connectedTabs.map((tab) => tab.parentElement));
  for (const tabList of tabLists) {
    synchronizeTabList(root, connectedTabs.filter((tab) => tab.parentElement === tabList), panelIds);
  }
}

export function isolateUtilityDom(root: ParentNode, scope: UtilityDomScope): void {
  removeExcludedElements(root, scope.removeSelectors ?? []);
  removeElementsOutsideScope(root, scope);
  synchronizeTabs(root, scope.panelIds);
}

export function isolateUtilityDomFromSearch(
  root: ParentNode,
  search: string,
): UtilityDomScope | undefined {
  const scope = utilityDomScopeFromSearch(search);
  if (!scope) return undefined;

  isolateUtilityDom(root, scope);
  const documentRoot = (root as Document).documentElement;
  if (documentRoot) documentRoot.dataset.utilityIsolation = scope.utilityId;
  return scope;
}
